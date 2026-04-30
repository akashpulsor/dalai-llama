// @ts-check
// shared/hooks/useAuthBootstrap.js
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@dalaillama/shared-store";
import { appConfig } from "@dalaillama/shared-config";
import {
  useExchangeTokenMutation,
  getUser,
  getAccessToken,
  isTokenExpired,
  clearAuthState,
} from "./keycloakApi.js";

/**
 * @typedef {"loading"|"authenticated"|"unauthenticated"} AuthStatus
 */

const RETURN_URL_KEY = "auth_return_url";

/**
 * Auth bootstrap hook - handles OAuth callback and session restore
 * @param {{ redirectToDashboard?: boolean }} [options]
 * @returns {{ status: AuthStatus, error: string | null }}
 */
export const useAuthBootstrap = (options = {}) => {
  const { redirectToDashboard = false } = options;
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [exchangeToken] = useExchangeTokenMutation();

  const [status, setStatus] = useState(/** @type {AuthStatus} */ ("loading"));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const oauthError = searchParams.get("error");
        const returnUrl = searchParams.get("returnUrl");

        // Store returnUrl in localStorage (persists across Keycloak redirect)
        if (returnUrl) {
          console.log("[Auth] Storing returnUrl:", returnUrl);
          localStorage.setItem(RETURN_URL_KEY, returnUrl);
        }

        // OAuth error from Keycloak
        if (oauthError) {
          console.error("[Auth] OAuth error:", oauthError);
          setError(searchParams.get("error_description") || oauthError);
          setStatus("unauthenticated");
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        // OAuth callback - exchange code for token
        if (code && state) {
          console.log("[Auth] Exchanging code for token...");
          const result = await exchangeToken({ code, state }).unwrap();
          console.log("[Auth] Login successful:", result.user?.email);

          // Clean URL
          window.history.replaceState({}, "", window.location.pathname);

          // Redirect to returnUrl or Dashboard
          if (redirectToDashboard) {
            const token = localStorage.getItem("auth_token");
            const user = localStorage.getItem("user");
            const storedReturnUrl = localStorage.getItem(RETURN_URL_KEY);

            console.log("[Auth] Check redirect - returnUrl:", storedReturnUrl, "token:", !!token);

            if (storedReturnUrl && token) {
              console.log("[Auth] Redirecting to returnUrl with token");
              localStorage.removeItem(RETURN_URL_KEY);
              
              // Build redirect URL with token in hash
              const targetUrl = new URL(decodeURIComponent(storedReturnUrl));
              targetUrl.hash = `auth=${encodeURIComponent(token)}&user=${encodeURIComponent(user || "")}`;
              window.location.href = targetUrl.toString();
              return;
            }

            // No returnUrl, go to default dashboard
            const dashboardUrl = appConfig.DASHBOARD_DOMAIN || appConfig.REMOTE_APPS?.dashboard || "/dashboard";
            console.log("[Auth] Redirecting to dashboard:", dashboardUrl);
            window.location.href = dashboardUrl;
            return;
          }

          setStatus("authenticated");
          return;
        }

        // Check existing session
        const token = getAccessToken();
        const user = getUser();

        if (token && user) {
          if (isTokenExpired(token)) {
            console.log("[Auth] Token expired, clearing session");
            clearAuthState();
            dispatch(logout());
            setStatus("unauthenticated");
            return;
          }

          // Restore session to Redux
          dispatch(setUser({ user, token }));
          setStatus("authenticated");
          console.log("[Auth] Session restored:", user.email);

          // If already authenticated and returnUrl exists, redirect
          const storedReturnUrl = localStorage.getItem(RETURN_URL_KEY);
          if (storedReturnUrl && redirectToDashboard) {
            console.log("[Auth] Already authenticated, redirecting to:", storedReturnUrl);
            localStorage.removeItem(RETURN_URL_KEY);
            const targetUrl = new URL(decodeURIComponent(storedReturnUrl));
            targetUrl.hash = `auth=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
            window.location.href = targetUrl.toString();
          }
          return;
        }

        if (token || user) {
          console.log("[Auth] Incomplete session found, clearing auth state");
          clearAuthState();
          dispatch(logout());
        }

        // No session
        setStatus("unauthenticated");

      } catch (e) {
        console.error("[Auth] Bootstrap error:", e);
        const err = /** @type {{ data?: string, message?: string }} */ (e);
        setError(err.data || err.message || "Authentication failed");
        setStatus("unauthenticated");
        clearAuthState();
        dispatch(logout());
      }
    };

    bootstrap();
  }, [dispatch, searchParams, exchangeToken, redirectToDashboard]);

  return { status, error };
};

export default useAuthBootstrap;
