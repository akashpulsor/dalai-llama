// @ts-nocheck
// Brand sign-in and registration with Keycloak (realm dalai-llama, public client platform-ui):
// authorization code + PKCE, no client secret. Watching films never needs this; following a
// creator, requesting a video and the brand home do. Tokens live in localStorage for this origin
// only and go to tenant-service as a Bearer token.
import { appConfig } from "@dalaillama/shared-config";

const TOKENS_KEY = "dl_brand_tokens";
const PENDING_KEY = "dl_brand_login";

/** Runtime config, ignoring placeholders the container didn't fill in ("__KEYCLOAK_URL__"). */
const setting = (value, fallback) => (value && !String(value).startsWith("__") ? value : fallback);
const KEYCLOAK = () => setting(appConfig.KEYCLOAK_URL, "https://auth.dalaillama.in").replace(/\/$/, "");
const REALM = () => setting(appConfig.KEYCLOAK_REALM, "dalai-llama");
const CLIENT = () => setting(appConfig.KEYCLOAK_CLIENT_ID, "platform-ui");
const oidc = (path) => `${KEYCLOAK()}/realms/${REALM()}/protocol/openid-connect/${path}`;
const redirectUri = () => `${window.location.origin}/brands/callback`;

const read = (key) => { try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch { return null; } };
const write = (key, value) => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } };
const remove = (key) => { try { window.localStorage.removeItem(key); } catch { /* nothing kept */ } };

const base64Url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomString = () => base64Url(crypto.getRandomValues(new Uint8Array(32)));

/** Sends the browser to Keycloak's sign-in (or registration) page; comes back to /brands/callback. */
export async function startBrandLogin({ register = false, returnTo = window.location.pathname + window.location.search } = {}) {
  const verifier = randomString();
  const state = randomString();
  const challenge = base64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  write(PENDING_KEY, { verifier, state, returnTo });
  const params = new URLSearchParams({
    client_id: CLIENT(), response_type: "code", scope: "openid email profile", redirect_uri: redirectUri(),
    state, code_challenge: challenge, code_challenge_method: "S256",
  });
  window.location.assign(`${oidc(register ? "registrations" : "auth")}?${params}`);
}

/** /brands/callback: trades the code for tokens. Returns where to go next. */
export async function finishBrandLogin(search) {
  const params = new URLSearchParams(search);
  const pending = read(PENDING_KEY);
  remove(PENDING_KEY);
  if (params.get("error")) throw new Error(params.get("error_description") || "Sign-in was cancelled");
  if (!pending || params.get("state") !== pending.state) throw new Error("This sign-in expired. Please try again.");
  const tokens = await tokenRequest({
    grant_type: "authorization_code", code: params.get("code"), redirect_uri: redirectUri(), code_verifier: pending.verifier,
  });
  write(TOKENS_KEY, tokens);
  return pending.returnTo && pending.returnTo.startsWith("/") ? pending.returnTo : "/brands/home";
}

/** A valid access token, refreshed when it's about to expire; null when signed out. */
export async function brandAccessToken() {
  const tokens = read(TOKENS_KEY);
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 30_000) return tokens.accessToken;
  if (!tokens.refreshToken || Date.now() > tokens.refreshExpiresAt) { remove(TOKENS_KEY); return null; }
  try {
    const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refreshToken });
    write(TOKENS_KEY, fresh);
    return fresh.accessToken;
  } catch {
    remove(TOKENS_KEY);
    return null;
  }
}

export function isBrandSignedIn() {
  const tokens = read(TOKENS_KEY);
  return Boolean(tokens) && Date.now() < (tokens.refreshExpiresAt || tokens.expiresAt);
}

/** Forgets the tokens here and ends the Keycloak session, then comes back to the creators page. */
export function brandSignOut() {
  const tokens = read(TOKENS_KEY);
  remove(TOKENS_KEY);
  const params = new URLSearchParams({ client_id: CLIENT(), post_logout_redirect_uri: `${window.location.origin}/creators` });
  if (tokens?.idToken) params.set("id_token_hint", tokens.idToken);
  window.location.assign(`${oidc("logout")}?${params}`);
}

export function forgetBrandTokens() {
  remove(TOKENS_KEY);
}

async function tokenRequest(fields) {
  const response = await fetch(oidc("token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT(), ...fields }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error_description || "Sign-in failed");
  const now = Date.now();
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    idToken: body.id_token,
    expiresAt: now + (body.expires_in || 300) * 1000,
    refreshExpiresAt: now + (body.refresh_expires_in || 1800) * 1000,
  };
}
