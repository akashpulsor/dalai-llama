// @ts-nocheck
// Brand-side calls (sign in by email link, follow, request a video, brand home). The brand session
// is an HttpOnly cookie set by tenant-service: this code never sees it, it only asks the browser
// to send it (credentials: "include"). platform.dalaillama.in and api.dalaillama.in are the same
// site, so the SameSite=Lax cookie goes along.
import { appConfig } from "@dalaillama/shared-config";
import { visitorId } from "./showcaseApi.js";

// Not the session: only "this browser signed in until <expiresAt>", so the header can say
// "Your brand" without a request. The server stays the judge (401 clears it).
const SIGNED_IN_KEY = "dl_brand_signed_in_until";
const base = () => `${appConfig.API_BASE_URL}/public`;

export class SignInRequired extends Error {}

export function isSignedIn() {
  try {
    const until = window.localStorage.getItem(SIGNED_IN_KEY);
    return Boolean(until) && new Date(until) > new Date();
  } catch {
    return false;
  }
}

function rememberSignedIn(expiresAt) {
  try { window.localStorage.setItem(SIGNED_IN_KEY, expiresAt); } catch { /* private mode: header just says "Brand sign in" */ }
}

function forgetSignedIn() {
  try { window.localStorage.removeItem(SIGNED_IN_KEY); } catch { /* nothing kept */ }
}

async function call(method, path, body) {
  const headers = { Accept: "application/json", "X-Visitor-Id": visitorId() };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${base()}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    forgetSignedIn();
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

/** The server sets the session cookie; the body says where to go next. */
export async function completeSignIn(token) {
  const signedIn = await call("POST", `/brands/sign-in/${encodeURIComponent(token)}`);
  rememberSignedIn(signedIn.expiresAt);
  return signedIn;
}

/** The cookie is HttpOnly, so only the server can clear it. */
export async function signOut() {
  forgetSignedIn();
  try { await call("POST", "/brands/sign-out"); } catch { /* already signed out */ }
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
