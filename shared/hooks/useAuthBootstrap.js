
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@dalaillama/shared-store";
import { logger } from "@dalaillama/shared-utils";
import { appConfig } from "@dalaillama/shared-config";
/**
 * @typedef {object} StoredUser
 * @property {string} id
 * @property {string} name
 * @property {string} [email]
 * @property {"shared" | "single"} [planType]
 * @property {string} [tenantId]
 */

/**
 * Bootstraps authentication state on app load.
 * - Restores token and user from localStorage
 * - Validates expiry
 * - Dispatches Redux actions
 * - Redirects unauthenticated users
 */
export const useAuthBootstrap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
const location = useLocation();

  useEffect(() => {
    try {
      logger.info(`[${appConfig.APP_NAME || "Dalai Llama"}] Bootstrapping auth...`);

      const token = localStorage.getItem("auth_token");
      const userJson = localStorage.getItem("user");
      const expiryRaw = localStorage.getItem("token_expiry");
          // ✅ Do NOT redirect on public pages
    const publicRoutes = ["/", "/login"];
    const currentPath = location?.pathname || "/";
    console.log("currentPath", currentPath);
      // 1️⃣ If no token — redirect to login
      if (!token && !publicRoutes.includes(currentPath)) {
        logger.info("No auth token found — redirecting to /login");
        navigate("/login",{replace: true});
        return;
      }

      
      if(token){
                  // 2️⃣ Check expiry (optional local expiry tracking)
        const isExpired = expiryRaw && Date.now() > Number(expiryRaw);
        if (isExpired) {
            logger.info("Auth token expired — logging out");
            dispatch(logout());
            navigate("/login");
            return;
        }

        // 3️⃣ Restore user if available
        if (userJson) {
            /** @type {StoredUser} */
            const user = JSON.parse(userJson);
            dispatch(setUser({ user, token }));
        }
          
      }

      logger.info("✅ Auth bootstrap complete");
    } catch (err) {
      logger.error("❌ Auth bootstrap failed:", err);
      dispatch(logout());
      navigate("/login");
    }
  }, [dispatch, navigate]);
};
