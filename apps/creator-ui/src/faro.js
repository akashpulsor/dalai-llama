// @ts-nocheck
import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

export function initFaro() {
  if (typeof window === "undefined") return;
  const url = faroCollectorUrl();
  if (!url) return;

  initializeFaro({
    url,
    app: {
      name: "creator-ui",
      environment: "production",
    },
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });
}

function faroCollectorUrl() {
  const runtimeEnv = window.__ENV__ || {};
  return firstText(runtimeEnv.FARO_COLLECTOR_URL, import.meta.env.VITE_FARO_COLLECTOR_URL);
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}
