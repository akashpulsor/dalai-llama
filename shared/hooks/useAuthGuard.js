// @ts-check
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@dalaillama/shared-store";
import {
  getAccessToken,
  getUser,
  isTokenExpired,
  redirectToKeycloakLogin,
  clearAuthState,
} from "./keycloakApi.js";

/**
 * @typedef {"checking"|"authenticated"|"redirecting"} GuardStatus
 */

/**
 * Auth guard hook - protects routes that require authentication.
 * @returns {{ status: GuardStatus, user: object | null }}
 */
export const useAuthGuard = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState(/** @type {GuardStatus} */ ("checking"));
  const [user, setUser] = useState(/** @type {object | null} */ (null));

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const token = getAccessToken();
      const currentUser = getUser();

      if (!token || !currentUser) {
        clearAuthState();
        dispatch(logout());
        if (!cancelled) {
          setStatus("redirecting");
        }
        await redirectToKeycloakLogin();
        return;
      }

      if (isTokenExpired(token)) {
        clearAuthState();
        dispatch(logout());
        if (!cancelled) {
          setStatus("redirecting");
        }
        await redirectToKeycloakLogin();
        return;
      }

      if (!cancelled) {
        setUser(currentUser);
        setStatus("authenticated");
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return { status, user };
};

export default useAuthGuard;
