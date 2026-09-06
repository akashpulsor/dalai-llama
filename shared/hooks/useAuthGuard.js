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
// creator-ui never remounts this hook's caller on navigation (single-page app), so a
// mount-only check never notices a session that expires while the user sits on an
// already-loaded page with no new API call firing. Re-check periodically and whenever
// the tab regains focus/visibility, not just once.
const RECHECK_INTERVAL_MS = 60_000;

export const useAuthGuard = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState(/** @type {GuardStatus} */ ("checking"));
  const [user, setUser] = useState(/** @type {object | null} */ (null));

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const token = getAccessToken();
      const currentUser = getUser();

      if (!token || !currentUser || isTokenExpired(token)) {
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

    const intervalId = setInterval(checkAuth, RECHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkAuth();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", checkAuth);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", checkAuth);
    };
  }, [dispatch]);

  return { status, user };
};

export default useAuthGuard;
