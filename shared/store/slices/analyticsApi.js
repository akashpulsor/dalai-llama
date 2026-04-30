import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Analytics + Billing RTK Query API.
 * Hits billing-service / analytics-service via platform API gateway.
 */
/**
 * Resolve analytics base URL.
 * Production: https://api.{domain}/api/v1 (billing-service analytics endpoints)
 * Dev (Vite proxy): /analytics
 */
function getAnalyticsBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.split('.');
      const domain = parts.slice(-2).join('.');
      return `https://api.${domain}/api/v1`;
    }
  }
  return '/analytics';
}

const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getAnalyticsBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const state = /** @type {any} */ (getState());
      const token = state.auth?.keycloakToken || state.auth?.access_token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({

    getOverview: builder.query({
      query: ({ tenantId, fromTs, toTs }) =>
        `/tenants/${tenantId}/overview?from_ts=${fromTs}&to_ts=${toTs}`,
      providesTags: ['Analytics'],
    }),

    getCustomerAnalytics: builder.query({
      query: ({ tenantId, fromTs, toTs }) =>
        `/tenants/${tenantId}/customer?from_ts=${fromTs}&to_ts=${toTs}`,
      providesTags: ['Analytics'],
    }),

    getBotAnalytics: builder.query({
      query: ({ tenantId, fromTs, toTs }) =>
        `/tenants/${tenantId}/bot?from_ts=${fromTs}&to_ts=${toTs}`,
      providesTags: ['Analytics'],
    }),

    getAgentAnalytics: builder.query({
      query: ({ tenantId, fromTs, toTs }) =>
        `/tenants/${tenantId}/agent?from_ts=${fromTs}&to_ts=${toTs}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetCustomerAnalyticsQuery,
  useGetBotAnalyticsQuery,
  useGetAgentAnalyticsQuery,
} = analyticsApi;

export default analyticsApi;