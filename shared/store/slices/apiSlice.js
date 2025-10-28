// shared/store/slices/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@dalaillama/shared-config";
import { logout } from "./authSlice.js";
import { showFlash } from "./flashSlice.js";
import { prometheusClient } from "@dalaillama/shared-utils";

/**
 * Base query with token injection
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: appConfig.API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/**
 * Extended base query that tracks metrics and handles auth errors.
 * @type {import('@reduxjs/toolkit/query').BaseQueryFn<
 *   string | { url: string, method?: string, body?: unknown },
 *   unknown,
 *   unknown
 * >}
 */
const baseQueryWithMetrics = async (args, api, extraOptions) => {
  const start = performance.now();
  const result = await rawBaseQuery(args, api, extraOptions);
  const latency = performance.now() - start;

  // ✅ Log latency metric
  try {
    prometheusClient.pushLatency("frontend_api_latency_ms", latency, {
      endpoint: typeof args === "string" ? args : args.url || "unknown",
    });
  } catch (err) {
    console.warn("Metric push failed:", err);
  }

  // ✅ Handle errors gracefully
  if (result.error) {
    const status = Number(result.error.status) || 0;

    try {
      prometheusClient.push("frontend_api_error_total", { status }, 1);
    } catch (err) {
      console.warn("Prometheus push error:", err);
    }

    if (status === 401 || status === 403) {
      api.dispatch(logout());
      api.dispatch(showFlash({ message: "Session expired.", type: "error" }));
    } else if (status >= 500) {
      api.dispatch(showFlash({ message: "Server error", type: "error" }));
    }
  }

  return result;
};

/**
 * API definition
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithMetrics,
  endpoints: (builder) => ({
    getHealth: builder.query({
      query: () => "/health",
    }),
  }),
});

export const { useGetHealthQuery } = api;
