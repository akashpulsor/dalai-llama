/**
 * @typedef {"shared" | "single"} PlanType
 */

/**
 * @typedef {object} AppConfig
 * @property {string} APP_NAME
 * @property {string} PLATFORM_URL
 * @property {string} API_BASE_URL
 * @property {string} DASHBOARD_DOMAIN
 * @property {string} PROM_PUSH_URL
 * @property {string} PROM_JOB_NAME
 * @property {number} METRICS_INTERVAL_MS
 * @property {number} REQUEST_TIMEOUT_MS
 * @property {boolean} ENABLE_LOGGING
 * @property {(planType: PlanType, id: string) => string} getDashboardUrl
 */

/** @type {AppConfig} */
export const appConfig = {
  APP_NAME: "Dalai Llama",
  PLATFORM_URL: "https://dalaillama.in",
  API_BASE_URL: "https://api.dalaillama.in",
  DASHBOARD_DOMAIN: "dash.dalaillama.in",

  PROM_PUSH_URL: "https://prom.dalaillama.in/api/v1/push",
  PROM_JOB_NAME: "frontend_metrics",
  METRICS_INTERVAL_MS: 15000,
  REQUEST_TIMEOUT_MS: 10000,
  ENABLE_LOGGING: true,

  /**
   * Build dashboard URL for a given tenant
   * @param {PlanType} planType - 'shared' or 'single'
   * @param {string} id - tenant identifier
   * @returns {string}
   */
  getDashboardUrl(planType, id) {
    if (planType === "shared") return `https://dash.dalaillama.in/s/${id}`;
    if (planType === "single") return `https://dash.dalaillama.in/t/${id}`;
    return "https://dalaillama.in";
  },
};
