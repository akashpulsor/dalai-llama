/**
 * @typedef {"shared" | "single"} PlanType
 */

/**
 * @typedef {object} AppConfig
 *
 * ---------- SYSTEM / CORE -----------
 * @property {string} APP_NAME
 * @property {string} ENV
 * @property {string} PLATFORM_URL
 * @property {string} API_BASE_URL
 * @property {string} DASHBOARD_DOMAIN
 *
 * ---------- LOGGING / METRICS --------
 * @property {string} PROM_PUSH_URL
 * @property {string} PROM_JOB_NAME
 * @property {number} METRICS_INTERVAL_MS
 * @property {number} REQUEST_TIMEOUT_MS
 * @property {boolean} ENABLE_LOGGING
 * @property {string} LOG_LEVEL
 * @property {string} METRICS_ENDPOINT
 * @property {string} LOG_COLLECTOR_URL
 *
 * ---------- AUTH / WEBSOCKETS --------
 * @property {string} WS_STT_URL
 * @property {string} MOCK_WS_URL
 *
 * ---------- MODES ---------------------
 * @property {boolean} MOCK_MODE
 * @property {boolean} DEMO_MODE
 * @property {string} MOCK_API_BASE_URL
 *
 * ---------- ROUTING (LOCAL ROUTES) ----
 * @property {{
 *   ROOT: string,
 *   LOGIN: string,
 *   PLATFORM: string,
 *   DASHBOARD: string,
 *   AGENT: string,
 *   ANALYTICS: string,
 *   SUBSCRIPTION: string,
 *   TENANT: string
 * }} APP_ROUTES
 *
 * ---------- REMOTE MICRO-APP URLS -----
 * @property {{
 *   agent?: string,
 *   dashboard?: string,
 *   analytics?: string,
 *   subscription?: string
 * }} REMOTE_APPS
 *
 * ---------- TENANT-BASED ROUTES -------
 * @property {(tenantId: string) => string | undefined} getTenantDashboardUrl
 * @property {(tenantId: string) => string | undefined} getTenantAgentUrl
 */

let demoOverride = false;
try {
  demoOverride =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("demo_mode") === "true";
} catch (e) {
  demoOverride = false;
}

const env = import.meta.env ?? {};

/**
 * @template T
 * @param {T | undefined} v
 * @param {T} def
 * @returns {T}
 */
const fallback = (v, def) => (v !== undefined ? v : def);

/** MOCK MODE (client-side only) */
const resolvedMockMode = env.VITE_MOCK_MODE === "true";

/** DEMO MODE */
const resolvedDemoMode = env.VITE_DEMO_MODE === "true";

/** Mock API override */
const resolvedMockApiBaseUrl =
  env.VITE_MOCK_API_BASE_URL || "http://localhost:9999";

/* -------------------------------------------------------------------------- */
/*                               FINAL CONFIG                                 */
/* -------------------------------------------------------------------------- */

/** @type {AppConfig} */
export const appConfig = {
  APP_NAME: "Dalai Llama",
  ENV: fallback(env.VITE_ENV, "development"),

  PLATFORM_URL: "https://dalaillama.in",
  API_BASE_URL: fallback(env.VITE_API_BASE_URL, "https://api.dalaillama.in"),

  DASHBOARD_DOMAIN: "dash.dalaillama.in",

  /* Logging / Metrics */
  METRICS_ENDPOINT: fallback(
    env.VITE_METRICS_ENDPOINT,
    "https://metrics.dalaillama.in/push"
  ),
  PROM_PUSH_URL: "https://prom.dalaillama.in/api/v1/push",
  PROM_JOB_NAME: "frontend_metrics",
  METRICS_INTERVAL_MS: fallback(env.VITE_METRICS_INTERVAL_MS, 30000),
  REQUEST_TIMEOUT_MS: 10000,
  ENABLE_LOGGING: true,
  LOG_LEVEL: fallback(env.VITE_LOG_LEVEL, "info"),
  LOG_COLLECTOR_URL: "https://log.dalaillama.in",

  /* WebSocket STT */
  WS_STT_URL: "wss://api.dalaillama.in/stt",
  MOCK_WS_URL: "ws://localhost:7777/mock",


  /* LOCAL ROUTES INSIDE PLATFORM-UI */
  APP_ROUTES: {
    ROOT: "/",
    LOGIN: "/login",

    PLATFORM: "/platform",
    DASHBOARD: "/dashboard",
    AGENT: "/agent",
    ANALYTICS: "/analytics",
    SUBSCRIPTION: "/subscription",
    TENANT: "/tenant",
  },

  /* REMOTE APP URLS FOR REDIRECTS — supports DEV & PROD */
  REMOTE_APPS: {
    agent: env.VITE_AGENT_APP_URL || "http://localhost:5174",
    dashboard: env.VITE_DASHBOARD_APP_URL || "http://localhost:5174",
    analytics: env.VITE_ANALYTICS_APP_URL || "http://localhost:5176",
    subscription: env.VITE_SUBSCRIPTION_APP_URL || "http://localhost:5177",
  },

  /* TENANT-BASED URLS (fetched from backend, override later) */
  getTenantDashboardUrl(tenantId) {
    return undefined; // platform-ui will override dynamically
  },

  getTenantAgentUrl(tenantId) {
    return undefined;
  },

  /* Mock flags */
  MOCK_MODE: demoOverride || resolvedMockMode,
  DEMO_MODE: demoOverride || resolvedDemoMode,
  MOCK_API_BASE_URL: resolvedMockApiBaseUrl,
};

/* Legacy named exports */
export const MOCK_MODE = appConfig.MOCK_MODE;
export const DEMO_MODE = appConfig.DEMO_MODE;
export const API_BASE_URL = appConfig.API_BASE_URL;
