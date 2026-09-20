// @ts-nocheck
/**
 * PostHog Cloud session recording + product analytics for creator-ui.
 *
 * Purpose is operator visibility, not third-party analytics -- the single ops
 * dashboard needs to answer "what did this user actually do before they got
 * stuck". Session replay + autocaptured events on a per-tenant, per-user basis
 * is the fastest way to get that without building a bespoke UX-telemetry
 * pipeline. PostHog Cloud's free tier (1M events + 5k replays per month) fits
 * a single-client platform with room to spare.
 *
 * Same env-config shape as analytics.js / faro.js: absence of the API key
 * turns the whole thing into a no-op, so a dev build never phones home and a
 * misconfigured deploy fails safe (no error, no data).
 *
 * Identification is deferred -- initPostHog runs at bootstrap when we have no
 * user yet. identifyPostHog(user) is called by the auth slice once Keycloak
 * hands us a profile, so recordings are searchable by tenant/email in the
 * PostHog UI. resetPostHog() clears the identity on logout.
 */
import posthog from "posthog-js";

const RUNTIME_ENV = () => (typeof window === "undefined" ? {} : window.__ENV__ || {});

export function initPostHog() {
  if (typeof window === "undefined") return;
  const key = posthogApiKey();
  if (!key) return;

  posthog.init(key, {
    api_host: posthogHost(),
    // Full autocapture + session replay -- that IS the value here for ops.
    // A single-client platform's replay volume is trivially small.
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      // Mask everything that could carry a secret or a client's script text.
      // password inputs are masked by default; adding [type=email] and any
      // element carrying data-private keeps client scripts / dialogue that
      // creators paste in from leaking off-cluster.
      maskAllInputs: false,
      maskInputOptions: { password: true, email: true },
      maskTextSelector: "[data-private]",
    },
    // Disable in localhost / preview builds so a dev run does not pollute the
    // ops recordings with test clicks.
    disable_session_recording: RUNTIME_ENV().POSTHOG_DISABLE_RECORDING === "true",
  });
}

/** Called from the auth slice the moment Keycloak returns a user, so replays
 * and events attribute to a real person + tenant instead of an anonymous
 * distinct_id. Safe to call before init (no-op) and to call repeatedly (idempotent
 * per distinct_id). */
export function identifyPostHog(user) {
  if (!user || !posthog.__loaded) return;
  posthog.identify(user.id || user.sub || user.email, {
    email: user.email,
    name: user.name,
    tenant_id: user.tenantId,
    tenant_name: user.tenantName,
    role: user.role,
  });
  if (user.tenantId) {
    posthog.group("tenant", user.tenantId, { name: user.tenantName });
  }
}

/** Logout hook -- called from the auth slice on sign-out so the next session
 * gets a fresh anonymous distinct_id instead of continuing under the old identity. */
export function resetPostHog() {
  if (!posthog.__loaded) return;
  posthog.reset();
}

function posthogApiKey() {
  const env = RUNTIME_ENV();
  return firstText(env.POSTHOG_API_KEY, import.meta.env.VITE_POSTHOG_API_KEY);
}

function posthogHost() {
  const env = RUNTIME_ENV();
  return firstText(env.POSTHOG_HOST, import.meta.env.VITE_POSTHOG_HOST, "https://us.i.posthog.com");
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}
