// @ts-nocheck
// Brand-side calls (follow, request a video, brand home). Brands sign in with Keycloak
// (brandAuth.js); the access token goes along as a Bearer token. Watching and liking need no sign-in.
import { appConfig } from "@dalaillama/shared-config";
import { brandAccessToken, brandSignOut, forgetBrandTokens, isBrandSignedIn } from "./brandAuth.js";
import { visitorId } from "./showcaseApi.js";

const base = () => `${appConfig.API_BASE_URL}/public`;

export class SignInRequired extends Error {}

/** Signed in with Keycloak (a usable token or refresh token here). */
export const isSignedIn = () => isBrandSignedIn();

async function call(method, path, body) {
  const headers = { Accept: "application/json", "X-Visitor-Id": visitorId() };
  const token = await brandAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // FormData sets its own multipart Content-Type (with the boundary); JSON bodies say so.
  const form = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !form) headers["Content-Type"] = "application/json";
  const response = await fetch(`${base()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  if (response.status === 401) {
    forgetBrandTokens();
    throw new SignInRequired();
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).message || message; } catch { /* no body */ }
    throw new Error(message);
  }
  return response.status === 202 || response.status === 204 ? null : response.json();
}

/** Ends the Keycloak session too. */
export function signOut() {
  brandSignOut();
}

export const getMe = () => call("GET", "/brands/me");
export const getMyInquiries = () => call("GET", "/brands/me/inquiries");
export const savePreferences = (prefs) => call("PATCH", "/brands/me/preferences", prefs);

export const follow = (handle) => call("PUT", `/creators/${encodeURIComponent(handle)}/follow`);
export const unfollow = (handle) => call("DELETE", `/creators/${encodeURIComponent(handle)}/follow`);

/** The brief, with any product and reference images (sent as multipart when there are some). */
export const requestVideo = (handle, request, productImages = [], referenceImages = []) => {
  if (productImages.length === 0 && referenceImages.length === 0) {
    return call("POST", `/creators/${encodeURIComponent(handle)}/inquiries`, request);
  }
  const body = new FormData();
  body.append("data", new Blob([JSON.stringify(request)], { type: "application/json" }));
  productImages.forEach((f) => body.append("productImages", f));
  referenceImages.forEach((f) => body.append("referenceImages", f));
  return call("POST", `/creators/${encodeURIComponent(handle)}/inquiries`, body);
};

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
