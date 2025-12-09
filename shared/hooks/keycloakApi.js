import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { jwtDecode  } from "jwt-decode";
import { setUser, logout } from "@dalaillama/shared-store";

/* -------------------------------------------------------------------------- */
/*                               🔧 Environment                               */
/* -------------------------------------------------------------------------- */
const keycloakBaseUrl = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
/**
 * @typedef {object} KeycloakJwtPayload
 * @property {string} [sub]
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [preferred_username]
 */
/* -------------------------------------------------------------------------- */
/*                           🔒 PKCE Helper Utilities                          */
/* -------------------------------------------------------------------------- */
const generatePKCE = async () => {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const verifier = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
};

/* -------------------------------------------------------------------------- */
/*                                ⚙️ API Definition                            */
/* -------------------------------------------------------------------------- */
export const keycloakApi = createApi({
  reducerPath: "keycloakApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect`,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
      return headers;
    },
  }),

  endpoints: (builder) => ({
    /* ---------------------------------------------------------------------- */
    /*                           🔑 LOGIN (Email + Password)                  */
    /* ---------------------------------------------------------------------- */
    login: builder.mutation({
      async queryFn({ username, password }, { dispatch }) {
        try {
          const { verifier, challenge } = await generatePKCE();
          sessionStorage.setItem("pkce_verifier", verifier);

          const body = new URLSearchParams({
            grant_type: "password",
            client_id: clientId,
            username,
            password,
            scope: "openid profile email",
            code_challenge: challenge,
            code_challenge_method: "S256",
          });

          const response = await fetch(
            `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body,
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            return { error: { status: response.status, data: errText } };
          }

          const data = await response.json();
          /** @type {KeycloakJwtPayload} */
          const decoded = jwtDecode(data.access_token);

          dispatch(
            setUser({
              user: {
                id: decoded.sub,
                name: decoded.name || decoded.preferred_username || "User",
                email: decoded.email,
              },
              token: data.access_token,
            })
          );

          sessionStorage.setItem("access_token", data.access_token);
          if (data.refresh_token)
            sessionStorage.setItem("refresh_token", data.refresh_token);

          return { data };
          
        } catch (error) {
            /** @type {Error} */
            const err = /** @type {Error} */ (error);
            const message = err.message || String(error);
            console.error("❌ Something failed:", message);
            return { error: { status: 500, data: message } };
        }
      },
    }),

    /* ---------------------------------------------------------------------- */
    /*                        🆕 SELF-REGISTER USER                           */
    /* ---------------------------------------------------------------------- */
    registerUser: builder.mutation({
      async queryFn({ email, firstName, lastName, password }) {
        try {
          const response = await fetch(
            `${keycloakBaseUrl}/realms/${realm}/users`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_KEYCLOAK_ADMIN_TOKEN}`,
              },
              body: JSON.stringify({
                username: email,
                email,
                firstName,
                lastName,
                enabled: true,
                credentials: [
                  { type: "password", value: password, temporary: false },
                ],
              }),
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            return { error: { status: response.status, data: errText } };
          }

          return { data: { success: true } };
        } catch (error) {
            /** @type {Error} */
            const err = /** @type {Error} */ (error);
            const message = err.message || String(error);
            console.error("❌ Something failed:", message);
            return { error: { status: 500, data: message } };
        }
      },
    }),

    /* ---------------------------------------------------------------------- */
    /*                        🔐 RESET PASSWORD (Email Link)                  */
    /* ---------------------------------------------------------------------- */
    resetPassword: builder.mutation({
      async queryFn({ email }) {
        try {
          // Step 1: Find user by email
          const findRes = await fetch(
            `${keycloakBaseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_KEYCLOAK_ADMIN_TOKEN}`,
              },
            }
          );
          const users = await findRes.json();
          if (!users.length) {
            return { error: { status: 404, data: "User not found" } };
          }

          const userId = users[0].id;

          // Step 2: Trigger password reset email
          const resetRes = await fetch(
            `${keycloakBaseUrl}/admin/realms/${realm}/users/${userId}/execute-actions-email`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_KEYCLOAK_ADMIN_TOKEN}`,
              },
              body: JSON.stringify(["UPDATE_PASSWORD"]),
            }
          );

          if (!resetRes.ok) {
            const errText = await resetRes.text();
            return { error: { status: resetRes.status, data: errText } };
          }

          return { data: { success: true } };
        } catch (error) {
            /** @type {Error} */
            const err = /** @type {Error} */ (error);
            const message = err.message || String(error);
            console.error("❌ Something failed:", message);
            return { error: { status: 500, data: message } };
        }
      },
    }),

    /* ---------------------------------------------------------------------- */
    /*                        🔄 REFRESH TOKEN                                */
    /* ---------------------------------------------------------------------- */
    refreshToken: builder.mutation({
      async queryFn(_, { dispatch }) {
        const refreshToken = sessionStorage.getItem("refresh_token");
        if (!refreshToken)
          return { error: { status: 401, data: "Missing refresh token" } };

        const body = new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          refresh_token: refreshToken,
        });

        const res = await fetch(
          `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          }
        );

        if (!res.ok) {
          dispatch(logout());
          return { error: { status: res.status, data: "Session expired" } };
        }

        const data = await res.json();
        /** @type {KeycloakJwtPayload} */
        const decoded = jwtDecode(data.access_token);
        dispatch(
          setUser({
            user: {
              id: decoded.sub,
              name: decoded.name || decoded.preferred_username,
              email: decoded.email,
            },
            token: data.access_token,
          })
        );
        sessionStorage.setItem("access_token", data.access_token);
        if (data.refresh_token)
          sessionStorage.setItem("refresh_token", data.refresh_token);
        return { data };
      },
    }),

    /* ---------------------------------------------------------------------- */
    /*                        🚪 LOGOUT                                       */
    /* ---------------------------------------------------------------------- */
    logout: builder.mutation({
      async queryFn() {
        const refreshToken = sessionStorage.getItem("refresh_token");
        if (!refreshToken) return { data: { success: true } };

        await fetch(`${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            refresh_token: refreshToken,
          }),
        });

        sessionStorage.clear();
        return { data: { success: true } };
      },
    }),

    /* ---------------------------------------------------------------------- */
    /*                        👤 GET USER INFO                                */
    /* ---------------------------------------------------------------------- */
    getUserInfo: builder.query({
      query: (accessToken) => ({
        url: "userinfo",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    }),
  }),
});

/* -------------------------------------------------------------------------- */
/*                              Exported Hooks                                */
/* -------------------------------------------------------------------------- */
export const {
  useLoginMutation,
  useRegisterUserMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetUserInfoQuery,
} = keycloakApi;
