// @ts-nocheck
// Creator-facing lead-management endpoints -- kept in their OWN file so the huge
// creatorEndpoints.js doesn't gain another block. RTK Query lets injectEndpoints be
// called any number of times against the shared apiSlice.
import { api as apiSlice } from "@dalaillama/shared-store";

export const leadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/tenants/me/email/identity -- fetch (or auto-provision) the caller's
    // creator email identity + provisional login password. Backend resolves tenant from JWT.
    getMyEmailIdentity: builder.query({
      query: () => ({ url: "/tenants/me/email/identity" }),
      providesTags: ["CreatorEmailIdentity"],
    }),

    // POST /api/v1/tenants/me/email/identity/rotate-password -- returns the new password.
    rotateMyEmailPassword: builder.mutation({
      query: () => ({ url: "/tenants/me/email/identity/rotate-password", method: "POST" }),
      invalidatesTags: ["CreatorEmailIdentity"],
    }),

    // POST /api/v1/tenants/me/email/send -- send from the caller's identity via the SMTP
    // relay. body: { to: string[], subject, bodyText, bodyHtml? }.
    sendCreatorEmail: builder.mutation({
      query: (body) => ({ url: "/tenants/me/email/send", method: "POST", body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyEmailIdentityQuery,
  useRotateMyEmailPasswordMutation,
  useSendCreatorEmailMutation,
} = leadApi;
