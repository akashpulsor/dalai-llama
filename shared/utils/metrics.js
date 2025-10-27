import { appConfig } from "@dalaillama/shared-config";
import { logError } from "./logger.js";

class PrometheusClient {
  constructor(baseUrl = appConfig.PROM_PUSH_URL) {
    this.baseUrl = baseUrl;
    this.job = appConfig.PROM_JOB_NAME;
  }

  async push(metric, labels = {}, value = 1) {
    try {
      const payload = {
        job: this.job,
        instance: window.location.hostname,
        metric,
        labels,
        value,
        timestamp: Date.now()
      };
      await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      logError("Prometheus push failed:", err);
    }
  }

  async pushError(error, origin = "ui") {
    return this.push("frontend_error_total", { origin, message: error?.message || String(error) }, 1);
  }

  async pushLatency(name, durationMs, labels = {}) {
    return this.push(name, { ...labels, unit: "ms" }, durationMs);
  }

  async pushHeartbeat() {
    return this.push("frontend_up", { app: appConfig.APP_NAME }, 1);
  }

  async pushTokenStatus(valid = true) {
    return this.push("frontend_auth_status", { valid: valid ? "1" : "0" }, 1);
  }
}

export const prometheusClient = new PrometheusClient();
