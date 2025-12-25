// @ts-check
// shared/hooks/keycloakApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { jwtDecode } from "jwt-decode";

import { appConfig } from "@dalaillama/shared-config";

/* -------------------------------------------------------------------------- */
/*                               🔧 Config                                    */
/* -------------------------------------------------------------------------- */
const keycloakBaseUrl = appConfig.KEYCLOAK_URL;
const realm = appConfig.KEYCLOAK_REALM;
const clientId = appConfig.KEYCLOAK_CLIENT;
// At the top - REMOVE this import:
// import { setUser, logout } from "@dalaillama/shared-store";

// Add these action type constants instead:
const AUTH_SET_USER = "auth/setUser";
const AUTH_LOGOUT = "auth/logout";
/** Get redirect URI dynamically based on current app */
const getRedirectUri = () => `${window.location.origin}/auth/callback`;

/* -------------------------------------------------------------------------- */
/*                         🧠 In-Memory Token Store                           */
/* -------------------------------------------------------------------------- */
/** @type {{ accessToken: string | null, refreshToken: string | null, user: object | null }} */
let authState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

/** Get current access token (for API calls) */
export const getAccessToken = () => authState.accessToken || localStorage.getItem("auth_token");

/** Get current user */
export const getUser = () => authState.user || JSON.parse(localStorage.getItem("user") || "null");

/** Check if authenticated */
export const isAuthenticated = () => !!(authState.accessToken || localStorage.getItem("auth_token"));

/** Clear auth state */
export const clearAuthState = () => {
  authState = { accessToken: null, refreshToken: null, user: null };
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

/* -------------------------------------------------------------------------- */
/*                           🔒 PKCE Utilities                                */
/* -------------------------------------------------------------------------- */
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
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const generateState = () => crypto.randomUUID();

/**
 * @typedef {Object} KeycloakJwtPayload
 * @property {string} [sub]
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [preferred_username]
 * @property {string} [tenant_id]
 * @property {{ roles?: string[] }} [realm_access]
 * @property {Record<string, { roles?: string[] }>} [resource_access]
 */

/**
 * Extract role from Keycloak token
 * @param {KeycloakJwtPayload} tokenPayload
 * @returns {"admin" | "supervisor" | "agent"}
 */
const extractRole = (tokenPayload) => {
  const realmRoles = tokenPayload.realm_access?.roles || [];
  const clientRoles = tokenPayload.resource_access?.[clientId]?.roles || [];
  const allRoles = [...realmRoles, ...clientRoles];
  if (allRoles.includes("admin")) return "admin";
  if (allRoles.includes("supervisor")) return "supervisor";
  return "agent";
};

/**
 * Check if token is expired
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

/* -------------------------------------------------------------------------- */
/*                                ⚙️ API                                      */
/* -------------------------------------------------------------------------- */
export const keycloakApi = createApi({
  reducerPath: "keycloakApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({

    /* -------------------- Initiate Login (PKCE) -------------------- */
    initiateLogin: builder.mutation({
      async queryFn() {
        try {
          const codeVerifier = generateCodeVerifier();
          const codeChallenge = await generateCodeChallenge(codeVerifier);
          const state = generateState();

          sessionStorage.setItem("pkce_verifier", codeVerifier);
          sessionStorage.setItem("oauth_state", state);

          const authUrl = new URL(`${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/auth`);
          authUrl.searchParams.set("client_id", clientId);
          authUrl.searchParams.set("redirect_uri", getRedirectUri());
          authUrl.searchParams.set("response_type", "code");
          authUrl.searchParams.set("scope", "openid profile email");
          authUrl.searchParams.set("state", state);
          authUrl.searchParams.set("code_challenge", codeChallenge);
          authUrl.searchParams.set("code_challenge_method", "S256");

          console.log("[Auth] Redirecting to Keycloak:", authUrl.toString());
          window.location.href = authUrl.toString();
          return { data: { redirecting: true } };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

   

// Then in exchangeToken mutation:
/* -------------------- Exchange Code for Tokens -------------------- */
/**
 * @typedef {Object} ExchangeTokenParams
 * @property {string} code
 * @property {string} state
 */
/** @type {import('@reduxjs/toolkit/query/react').MutationDefinition<ExchangeTokenParams, any, any, any>} */
    exchangeToken: builder.mutation({
      async queryFn({ code, state }, { dispatch }) {
        try {
          const storedState = sessionStorage.getItem("oauth_state");
          if (state !== storedState) {
            return { error: { status: 400, data: "Invalid state - CSRF detected" } };
          }

          const codeVerifier = sessionStorage.getItem("pkce_verifier");
          if (!codeVerifier) {
            return { error: { status: 400, data: "Missing code verifier" } };
          }

          const params = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            code,
            redirect_uri: getRedirectUri(),
            code_verifier: codeVerifier,
          });

          const res = await fetch(
            `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
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
            role: extractRole(decoded),
            tenantId: decoded.tenant_id || "default",
          };

          // Store in memory
          authState = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || null,
            user,
          };

          // Store in localStorage (for persistence)
          localStorage.setItem("auth_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token || "");
          localStorage.setItem("user", JSON.stringify(user));

          // Clear PKCE data
          sessionStorage.removeItem("pkce_verifier");
          sessionStorage.removeItem("oauth_state");

          // Update Redux
          dispatch({ type: AUTH_SET_USER, payload: { user, token: data.access_token } });

          console.log("[Auth] Token exchange successful:", user.email);
          return { data: { ...data, user } };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    /* -------------------- Refresh Token -------------------- */
    refreshToken: builder.mutation({
      async queryFn(_, { dispatch }) {
        const refreshToken = authState.refreshToken || localStorage.getItem("refresh_token");
        if (!refreshToken) {
          return { error: { status: 401, data: "No refresh token" } };
        }

        try {
          const params = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: clientId,
            refresh_token: refreshToken,
          });

          const res = await fetch(
            `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
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
            role: extractRole(decoded),
            tenantId: decoded.tenant_id || "default",
          };

          // Update memory
          authState = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || authState.refreshToken,
            user,
          };

          // Update localStorage
          localStorage.setItem("auth_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token || "");
          localStorage.setItem("user", JSON.stringify(user));

          dispatch({ type: AUTH_SET_USER, payload: { user, token: data.access_token } });

          return { data };
        } catch (error) {
          clearAuthState();
          dispatch({ type: AUTH_LOGOUT });
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    /* -------------------- Logout -------------------- */
    keycloakLogout: builder.mutation({
      async queryFn(_, { dispatch }) {
        const refreshToken = authState.refreshToken || localStorage.getItem("refresh_token");

        if (refreshToken) {
          await fetch(
            `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                refresh_token: refreshToken,
              }),
            }
          ).catch(() => {});
        }

        clearAuthState();
        dispatch({ type: AUTH_LOGOUT });
        sessionStorage.clear();

        return { data: { success: true } };
      },
    }),
  }),
});

/* -------------------------------------------------------------------------- */
/*                              Exported Hooks                                */
/* -------------------------------------------------------------------------- */
export const {
  useInitiateLoginMutation,
  useExchangeTokenMutation,
  useRefreshTokenMutation,
  useKeycloakLogoutMutation,
} = keycloakApi;