// @ts-check
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { jwtDecode } from "jwt-decode";

import { appConfig } from "@dalaillama/shared-config";

const AUTH_SET_USER = "auth/setUser";
const AUTH_LOGOUT = "auth/logout";
const PKCE_VERIFIER_KEY = "pkce_verifier";
const OAUTH_STATE_KEY = "oauth_state";
const KNOWN_BASENAMES = ["/platform", "/dashboard"];

const normalizeTenantId = (tenantId) => {
  if (!tenantId) return null;
  const normalized = String(tenantId).trim();
  if (!normalized || normalized.toLowerCase() === "default") {
    return null;
  }
  return normalized;
};

/** @type {Record<string, string>} */
const LOCALHOST_PORT_CLIENT_MAP = {
  "5173": "platform-ui",
  "5174": "admin-ui",
  "5175": "supervisor-ui",
  "5176": "agent-ui",
  "5177": "dashboard-ui",
};

/**
 * @typedef {Object} ResolvedKeycloakConfig
 * @property {string} url
 * @property {string} realm
 * @property {string} clientId
 * @property {string} redirectUri
 */

/**
 * @typedef {Object} KeycloakJwtPayload
 * @property {string} [sub]
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [preferred_username]
 * @property {string} [tenant_id]
 * @property {string} [azp]
 * @property {{ roles?: string[] }} [realm_access]
 * @property {Record<string, { roles?: string[] }>} [resource_access]
 */

/** @type {{ accessToken: string | null, refreshToken: string | null, user: object | null }} */
let authState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

/** @param {string} value */
const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const isLocalDevHost = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

const getAppBasePath = () => {
  if (typeof window === "undefined") return "";
  const { pathname } = window.location;
  const match = KNOWN_BASENAMES.find(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
  return match || "";
};

export const resolveRealm = () => {
  if (typeof window === "undefined") {
    return appConfig.KEYCLOAK_REALM;
  }

  const hostname = window.location.hostname;
  if (isLocalDevHost()) {
    return appConfig.KEYCLOAK_REALM;
  }

  const match = hostname.match(/^(admin|supervisor|agent)-([^.]+)\./);
  if (match) {
    return `tenant-${match[2]}`;
  }

  return appConfig.KEYCLOAK_REALM;
};

export const resolveClientId = () => {
  if (typeof window === "undefined") {
    return appConfig.KEYCLOAK_CLIENT_ID;
  }

  if (isLocalDevHost()) {
    return LOCALHOST_PORT_CLIENT_MAP[window.location.port] || appConfig.KEYCLOAK_CLIENT_ID;
  }

  const hostname = window.location.hostname;
  if (hostname.startsWith("admin-")) return "admin-ui";
  if (hostname.startsWith("supervisor-")) return "supervisor-ui";
  if (hostname.startsWith("agent-")) return "agent-ui";
  if (hostname.startsWith("dashboard.")) return "dashboard-ui";
  if (hostname.startsWith("platform.")) return "platform-ui";

  return appConfig.KEYCLOAK_CLIENT_ID;
};

export const getRedirectUri = () => {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}${getAppBasePath()}/auth/callback`;
};

const resolveKeycloakUrl = () => {
  const configuredUrl = trimTrailingSlash(appConfig.KEYCLOAK_URL);
  const serverUrl = trimTrailingSlash(appConfig.KEYCLOAK_SERVER_URL);
  const profile = appConfig.KEYCLOAK_PROFILE || "auto";

  if (profile === "server") {
    return serverUrl;
  }

  if (profile === "local") {
    return configuredUrl;
  }

  // Auto mode: use serverUrl in production, configuredUrl only on localhost
  if (!isLocalDevHost()) {
    return serverUrl;
  }

  return configuredUrl;
};

export const resolveKeycloakConfig = () => ({
  url: resolveKeycloakUrl(),
  realm: resolveRealm(),
  clientId: resolveClientId(),
  redirectUri: getRedirectUri(),
});

export const getAccessToken = () =>
  authState.accessToken || localStorage.getItem("auth_token");

export const getUser = () =>
  (() => {
    const user = authState.user || JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return null;
    return {
      ...user,
      tenantId: normalizeTenantId(user.tenantId),
    };
  })();

export const isAuthenticated = () =>
  !!(authState.accessToken || localStorage.getItem("auth_token"));

export const clearAuthState = () => {
  authState = { accessToken: null, refreshToken: null, user: null };
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/** @param {string} verifier */
const generateCodeChallenge = async (verifier) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const generateState = () => crypto.randomUUID();

/**
 * @param {KeycloakJwtPayload} tokenPayload
 * @param {string} resolvedClientId
 * @returns {"admin" | "supervisor" | "agent"}
 */
const extractRole = (tokenPayload, resolvedClientId) => {
  const realmRoles = (tokenPayload.realm_access?.roles || []).map((role) =>
    String(role).toLowerCase()
  );
  const tokenClientId = tokenPayload.azp || resolvedClientId;
  const clientRoles = (
    tokenPayload.resource_access?.[tokenClientId]?.roles || []
  ).map((role) => String(role).toLowerCase());
  const allRoles = [...realmRoles, ...clientRoles];

  if (allRoles.includes("admin")) return "admin";
  if (allRoles.includes("supervisor")) return "supervisor";
  return "agent";
};

/**
 * @param {string} token
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

/**
 * @param {{ returnUrl?: string | null }} [options]
 */
export const redirectToKeycloakLogin = async (options = {}) => {
  const { url, realm, clientId, redirectUri } = resolveKeycloakConfig();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const authUrl = new URL(`${url}/realms/${realm}/protocol/openid-connect/auth`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  if (options.returnUrl) {
    authUrl.searchParams.set("returnUrl", options.returnUrl);
  }

  window.location.href = authUrl.toString();
};

export const keycloakApi = createApi({
  reducerPath: "keycloakApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({
    initiateLogin: builder.mutation({
      async queryFn(arg) {
        try {
          const options =
            arg && typeof arg === "object" ? /** @type {{ returnUrl?: string | null }} */ (arg) : {};
          await redirectToKeycloakLogin(options);
          return { data: { redirecting: true } };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    exchangeToken: builder.mutation({
      /**
       * @param {{ code: string, state: string }} params
       */
      async queryFn({ code, state }, { dispatch }) {
        try {
          const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
          if (!storedState || state !== storedState) {
            return {
              error: { status: 400, data: "Invalid state - CSRF detected" },
            };
          }

          const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
          if (!codeVerifier) {
            return { error: { status: 400, data: "Missing code verifier" } };
          }

          const { url, realm, clientId, redirectUri } = resolveKeycloakConfig();
          const params = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          });

          const res = await fetch(
            `${url}/realms/${realm}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            }
          );

          if (!res.ok) {
            const errText = await res.text();
            return { error: { status: res.status, data: errText } };
          }

          const data = await res.json();
          /** @type {KeycloakJwtPayload} */
          const decoded = jwtDecode(data.access_token);
          const user = {
            id: decoded.sub || "",
            name: decoded.name || decoded.preferred_username || "User",
            email: decoded.email || "",
            role: extractRole(decoded, clientId),
            tenantId: normalizeTenantId(decoded.tenant_id),
          };

          authState = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || null,
            user,
          };

          localStorage.setItem("auth_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token || "");
          localStorage.setItem("user", JSON.stringify(user));

          sessionStorage.removeItem(PKCE_VERIFIER_KEY);
          sessionStorage.removeItem(OAUTH_STATE_KEY);

          dispatch({
            type: AUTH_SET_USER,
            payload: { user, token: data.access_token },
          });

          return { data: { ...data, user } };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    refreshToken: builder.mutation({
      async queryFn(_, { dispatch }) {
        const refreshToken =
          authState.refreshToken || localStorage.getItem("refresh_token");
        if (!refreshToken) {
          return { error: { status: 401, data: "No refresh token" } };
        }

        try {
          const { url, realm, clientId } = resolveKeycloakConfig();
          const params = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: clientId,
            refresh_token: refreshToken,
          });

          const res = await fetch(
            `${url}/realms/${realm}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            }
          );

          if (!res.ok) {
            clearAuthState();
            dispatch({ type: AUTH_LOGOUT });
            return { error: { status: res.status, data: "Session expired" } };
          }

          const data = await res.json();
          /** @type {KeycloakJwtPayload} */
          const decoded = jwtDecode(data.access_token);
          const user = {
            id: decoded.sub || "",
            name: decoded.name || decoded.preferred_username || "User",
            email: decoded.email || "",
            role: extractRole(decoded, clientId),
            tenantId: normalizeTenantId(decoded.tenant_id),
          };

          authState = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || authState.refreshToken,
            user,
          };

          localStorage.setItem("auth_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token || "");
          localStorage.setItem("user", JSON.stringify(user));

          dispatch({
            type: AUTH_SET_USER,
            payload: { user, token: data.access_token },
          });

          return { data };
        } catch (error) {
          clearAuthState();
          dispatch({ type: AUTH_LOGOUT });
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    keycloakLogout: builder.mutation({
      async queryFn(_, { dispatch }) {
        const refreshToken =
          authState.refreshToken || localStorage.getItem("refresh_token");

        if (refreshToken) {
          const { url, realm, clientId } = resolveKeycloakConfig();
          await fetch(`${url}/realms/${realm}/protocol/openid-connect/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              refresh_token: refreshToken,
            }),
          }).catch(() => {});
        }

        clearAuthState();
        dispatch({ type: AUTH_LOGOUT });
        sessionStorage.removeItem(PKCE_VERIFIER_KEY);
        sessionStorage.removeItem(OAUTH_STATE_KEY);
        return { data: { success: true } };
      },
    }),
  }),
});

export const {
  useInitiateLoginMutation,
  useExchangeTokenMutation,
  useRefreshTokenMutation,
  useKeycloakLogoutMutation,
} = keycloakApi;
