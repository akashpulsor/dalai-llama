
// @ts-check
// shared/hooks/index.js
export { 
  keycloakApi,
  useInitiateLoginMutation,
  useExchangeTokenMutation,
  useRefreshTokenMutation,
  useKeycloakLogoutMutation,
  getAccessToken,
  getUser,
  isAuthenticated,
  isTokenExpired,
  clearAuthState,
  getRedirectUri,
  resolveRealm,
  resolveClientId,
  resolveKeycloakConfig,
  redirectToKeycloakLogin,
} from "./keycloakApi.js";

// shared/hooks/index.js
export * from "./useMetricsHeartbeat.js";
export * from "./useAuthBootstrap.js";
export { useAuthGuard } from "./useAuthGuard.js";
