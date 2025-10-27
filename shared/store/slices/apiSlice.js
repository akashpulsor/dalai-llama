import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@dalaillama/shared-config";
import { logout } from "./authSlice.js";
import { showFlash } from "./flashSlice.js";
import { prometheusClient } from "@dalaillama/shared-utils";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: appConfig.API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }
});

const baseQueryWithMetrics = async (args, api, extra) => {
  const start = performance.now();
  const result = await rawBaseQuery(args, api, extra);
  const latency = performance.now() - start;

  prometheusClient.pushLatency("frontend_api_latency_ms", latency, {
    endpoint: typeof args === "string" ? args : args.url || "unknown"
  });

  if (result.error) {
    const status = result.error.status;
    prometheusClient.push("frontend_api_error_total", { status }, 1);

    if (status === 401 || status === 403) {
      api.dispatch(logout());
      api.dispatch(showFlash({ message: "Session expired.", type: "error" }));
    } else if (status >= 500) {
      api.dispatch(showFlash({ message: "Server error", type: "error" }));
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithMetrics,
  endpoints: (builder) => ({
    getHealth: builder.query({ query: () => "/health" })
  })
});

export const { useGetHealthQuery } = api;
