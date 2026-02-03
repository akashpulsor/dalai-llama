// @ts-check
// shared/hooks/useAuthGuard.js
import { useEffect, useState } from "react";
import { getAccessToken, getUser, isTokenExpired, useRefreshTokenMutation } from "./keycloakApi.js";
import { appConfig } from "@dalaillama/shared-config";

/**
 * @typedef {"checking"|"authenticated"|"redirecting"} GuardStatus
 */

/**
 * Auth guard hook - protects routes that require authentication
 * @returns {{ status: GuardStatus, user: object | null }}
 */
export const useAuthGuard = () => {
  const [refreshToken] = useRefreshTokenMutation();
  const [status, setStatus] = useState(/** @type {GuardStatus} */ ("checking"));
  const [user, setUser] = useState(/** @type {object | null} */ (null));

  useEffect(() => {
    const checkAuth = async () => {
      // Step 1: Check if token passed via URL hash (from platform-ui redirect)
      const hash = window.location.hash;
      if (hash && hash.includes("auth=")) {
        console.log("[AuthGuard] Token found in URL hash");
        try {
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get("auth");
          const userStr = params.get("user");

          if (token) {
            localStorage.setItem("auth_token", decodeURIComponent(token));
            console.log("[AuthGuard] Token saved to localStorage");
          }
          if (userStr) {
            localStorage.setItem("user", decodeURIComponent(userStr));
            console.log("[AuthGuard] User saved to localStorage");
          }
          
          // Clear hash from URL
          window.history.replaceState({}, "", window.location.pathname + window.location.search);
        } catch (e) {
          console.error("[AuthGuard] Error parsing hash:", e);
        }
      }

      // Step 2: Check token
      const token = getAccessToken();
      const currentUser = getUser();

      console.log("[AuthGuard] Token exists:", !!token, "User:", currentUser?.email);

      // No token - redirect to login
      if (!token) {
        console.log("[AuthGuard] No token found, redirecting to login");
        setStatus("redirecting");
        redirectToLogin();
        return;
      }

      // Token expired - try refresh
      if (isTokenExpired(token)) {
        console.log("[AuthGuard] Token expired, attempting refresh...");
        try {
          await refreshToken(undefined).unwrap();
          console.log("[AuthGuard] Token refreshed successfully");
          setUser(getUser());
          setStatus("authenticated");
        } catch (e) {
          console.log("[AuthGuard] Refresh failed, redirecting to login");
          setStatus("redirecting");
          redirectToLogin();
        }
        return;
      }

      // Valid token
      console.log("[AuthGuard] Authenticated:", currentUser?.email);
      setUser(currentUser);
      setStatus("authenticated");
    };

    checkAuth();
  }, [refreshToken]);

  return { status, user };
};

/**
 * Redirect to platform login with return URL
 */
const redirectToLogin = () => {
  const returnUrl = encodeURIComponent(window.location.href);
  const loginUrl = `${appConfig.PLATFORM_URL}?returnUrl=${returnUrl}`;
  console.log("[AuthGuard] Redirecting to:", loginUrl);
  window.location.href = loginUrl;
};

export default useAuthGuard;