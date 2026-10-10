// Service worker (Manifest V3). It alone holds the pairing token and talks to the Dalai Llama API.
// - Pairing arrives only from the web app (externally_connectable + an origin allowlist here).
// - The token lives in chrome.storage.session, which content scripts can't read (we ship none
//   anyway) and which Chrome clears when the browser closes.
// - The popup asks for a fixed set of API calls; the token never leaves this worker.
// - Google/YouTube tokens never reach the extension at all: the backend holds them.
import { ALLOWED_CALLS, ALLOWED_PAIRING_ORIGINS, API_BASE } from "./config.js";
import { isValidPairing } from "./youtube.js";

const TOKEN_KEY = "pairing";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
});

/** Pairing from the signed-in web app. */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const origin = sender.origin || (sender.url ? new URL(sender.url).origin : "");
  if (!ALLOWED_PAIRING_ORIGINS.includes(origin)) {
    sendResponse({ ok: false, error: "origin" });
    return false;
  }
  if (isValidPairing(origin, message, ALLOWED_PAIRING_ORIGINS)) {
    chrome.storage.session.set({ [TOKEN_KEY]: { token: message.token, expiresAt: String(message.expiresAt || "") } })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message?.type === "DALAI_UNPAIR") {
    chrome.storage.session.remove(TOKEN_KEY).then(() => sendResponse({ ok: true }));
    return true;
  }
  sendResponse({ ok: false, error: "message" });
  return false;
});

/** Requests from our own popup only. */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || sender.tab) {
    sendResponse({ ok: false, status: 0, error: "Not allowed" });
    return false;
  }
  if (message?.type === "STATUS") {
    paired().then((p) => sendResponse({ ok: true, paired: Boolean(p) }));
    return true;
  }
  if (message?.type === "UNPAIR") {
    chrome.storage.session.remove(TOKEN_KEY).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message?.type === "API") {
    call(message.method, message.path, message.body).then(sendResponse);
    return true;
  }
  sendResponse({ ok: false, status: 0, error: "Unknown request" });
  return false;
});

async function paired() {
  const stored = (await chrome.storage.session.get(TOKEN_KEY))[TOKEN_KEY];
  if (!stored) return null;
  if (stored.expiresAt && new Date(stored.expiresAt) < new Date()) {
    await chrome.storage.session.remove(TOKEN_KEY);
    return null;
  }
  return stored;
}

async function call(method, path, body) {
  if (!ALLOWED_CALLS.some(([m, p]) => m === method && p === path)) return { ok: false, status: 0, error: "Not allowed" };
  const stored = await paired();
  if (!stored) return { ok: false, status: 401, error: "Not connected" };
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "X-Dalai-Extension-Token": stored.token, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "omit",
    });
    if (response.status === 401) await chrome.storage.session.remove(TOKEN_KEY);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return response.ok ? { ok: true, status: response.status, data } : { ok: false, status: response.status, error: data?.message || `HTTP ${response.status}` };
  } catch (e) {
    return { ok: false, status: 0, error: "Dalai Llama couldn't be reached" };
  }
}
