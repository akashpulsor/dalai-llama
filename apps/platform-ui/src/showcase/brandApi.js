// @ts-nocheck
// Brand-side calls (sign in by email link, follow, request a video, brand home). The brand session
// is a signed token from tenant-service, sent as X-Brand-Session; it lives in this browser only.
import { appConfig } from "@dalaillama/shared-config";
import { visitorId } from "./showcaseApi.js";

const SESSION_KEY = "dl_brand_session";
const base = () => `${appConfig.API_BASE_URL}/public`;

export class SignInRequired extends Error {}

export function brandSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return new Date(session.expiresAt) > new Date() ? session.token : null;
  } catch {
    return null;
  }
}

export const isSignedIn = () => Boolean(brandSession());

function keepSession(token, expiresAt) {
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt })); } catch { /* private mode */ }
}

export function signOut() {
  try { window.localStorage.removeItem(SESSION_KEY); } catch { /* nothing kept */ }
}

async function call(method, path, body) {
  const headers = { Accept: "application/json", "X-Visitor-Id": visitorId() };
  const session = brandSession();
  if (session) headers["X-Brand-Session"] = session;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${base()}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 401) {
    signOut();
    throw new SignInRequired();
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).message || message; } catch { /* no body */ }
    throw new Error(message);
  }
  return response.status === 202 || response.status === 204 ? null : response.json();
}

/** Emails a one-time sign-in link. Same answer whether or not the email is known. */
export const requestSignIn = (form) => call("POST", "/brands/sign-in", form);

export async function completeSignIn(token) {
  const signedIn = await call("POST", `/brands/sign-in/${encodeURIComponent(token)}`);
  keepSession(signedIn.sessionToken, signedIn.expiresAt);
  return signedIn;
}

export const getMe = () => call("GET", "/brands/me");
export const getMyInquiries = () => call("GET", "/brands/me/inquiries");
export const savePreferences = (prefs) => call("PATCH", "/brands/me/preferences", prefs);

export const follow = (handle) => call("PUT", `/creators/${encodeURIComponent(handle)}/follow`);
export const unfollow = (handle) => call("DELETE", `/creators/${encodeURIComponent(handle)}/follow`);

export const requestVideo = (handle, request) => call("POST", `/creators/${encodeURIComponent(handle)}/inquiries`, request);

// Likes are anonymous: the visitor id is enough. Which films this browser liked is remembered here
// only to draw the button; the count comes from the server.
const LIKED_KEY = "dl_liked";

export function likedHere(publicId) {
  try { return JSON.parse(window.localStorage.getItem(LIKED_KEY) || "[]").includes(publicId); } catch { return false; }
}

export async function setLiked(publicId, liked) {
  const state = await call(liked ? "PUT" : "DELETE", `/showcase/${encodeURIComponent(publicId)}/like`);
  try {
    const set = new Set(JSON.parse(window.localStorage.getItem(LIKED_KEY) || "[]"));
    if (liked) set.add(publicId); else set.delete(publicId);
    window.localStorage.setItem(LIKED_KEY, JSON.stringify([...set].slice(-500)));
  } catch { /* not remembered; the button just resets on reload */ }
  return state;
}

/** Attribution token from a tracked mail link (?ref=...), kept for this visit. */
export function attributionToken() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    if (fromUrl) window.sessionStorage.setItem("dl_ref", fromUrl);
    return fromUrl || window.sessionStorage.getItem("dl_ref");
  } catch {
    return new URLSearchParams(window.location.search).get("ref");
  }
}
