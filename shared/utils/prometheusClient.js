// shared/utils/prometheusClient.js
// --------------------------------------------------------------
//  Prometheus Pushgateway Frontend Client
//  Works in MOCK + REAL mode
// --------------------------------------------------------------

import { appConfig } from "@dalaillama/shared-config";

/**
 * Internal helper to POST JSON with timeout.
 *
 * @param {string} url
 * @param {string} body
 * @returns {Promise<boolean>}
 */
async function safePost(url, body) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "text/plain" },
      signal: controller.signal,
    });

    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Build Prometheus payload
 *
 * @param {string} name
 * @param {number|string} value
 * @param {Record<string,string>} labels
 * @returns {string}
 */
function formatMetric(name, value, labels) {
  const labelStr = Object.entries(labels || {})
    .map(
      /**
       * @param {[string, string]} entry
       */
      ([k, v]) => `${k}="${v}"`
    )
    .join(",");

  return `${name}{${labelStr}} ${value}\n`;
}

/**
 * --------------------------------------------------------------
 *  PUBLIC CLIENT
 * --------------------------------------------------------------
 */
export const prometheusClient = {
  /**
   * Push latency metric
   * @param {string} metric
   * @param {number} value
   * @param {Record<string,string>} [labels={}]
   */
  async pushLatency(metric, value, labels = {}) {
    if (!appConfig.PROM_PUSH_URL) return;

    const payload = formatMetric(metric, value, {
      job: appConfig.PROM_JOB_NAME || "frontend",
      ...labels,
    });

    if (appConfig.MOCK_MODE) {
      // MOCK — don't actually send anything
      console.log("📊 MOCK METRIC:", payload.trim());
      return;
    }

    await safePost(appConfig.PROM_PUSH_URL, payload);
  },
};

export default prometheusClient;
