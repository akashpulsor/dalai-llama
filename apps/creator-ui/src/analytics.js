// @ts-nocheck
const GOOGLE_TAG_SCRIPT_ID = "creator-ga4-tag";

export function initGoogleAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const measurementId = googleAnalyticsMeasurementId();
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!document.getElementById(GOOGLE_TAG_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GOOGLE_TAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

function googleAnalyticsMeasurementId() {
  const runtimeEnv = window.__ENV__ || {};
  return firstText(
    runtimeEnv.GA_MEASUREMENT_ID,
    runtimeEnv.GOOGLE_ANALYTICS_MEASUREMENT_ID,
    import.meta.env.VITE_GA_MEASUREMENT_ID,
    import.meta.env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID
  );
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}
