// shared/config/index.js
export const appConfig = {
  ENV: import.meta.env.VITE_ENV || "development",
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "https://dalaillama.in/api",
  METRICS_ENDPOINT:
    import.meta.env.VITE_METRICS_ENDPOINT ||
    "https://metrics.dalaillama.in/push",
  METRICS_INTERVAL_MS: 30000,
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || "info"
};
