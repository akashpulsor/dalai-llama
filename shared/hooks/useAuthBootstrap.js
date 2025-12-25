// @ts-check
// shared/hooks/useAuthBootstrap.js
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@dalaillama/shared-store";
import { appConfig } from "@dalaillama/shared-config";
import { useExchangeTokenMutation, isAuthenticated, getUser, getAccessToken, isTokenExpired } from "./keycloakApi.js";

/**
 * @typedef {"loading"|"authenticated"|"unauthenticated"} AuthStatus
 */

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

          // Redirect to Dashboard if requested (Platform UI uses this)
          if (redirectToDashboard) {
            const dashboardUrl = appConfig.REMOTE_APPS?.dashboard || "/dashboard";
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
          // Check if token is expired
          if (isTokenExpired(token)) {
            console.log("[Auth] Token expired, clearing session");
            setStatus("unauthenticated");
            return;
          }

          // Restore session to Redux
          dispatch(setUser({ user, token }));
          setStatus("authenticated");
          console.log("[Auth] Session restored:", user.email);
          return;
        }

        // No session
        setStatus("unauthenticated");

      } catch (e) {
        console.error("[Auth] Bootstrap error:", e);
        const err = /** @type {{ data?: string, message?: string }} */ (e);
        setError(err.data || err.message || "Authentication failed");
        setStatus("unauthenticated");
        dispatch(logout());
      }
    };

    bootstrap();
  }, [dispatch, searchParams, exchangeToken, redirectToDashboard]);

  return { status, error };
};

export default useAuthBootstrap;