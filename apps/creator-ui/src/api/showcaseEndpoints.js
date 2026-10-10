// @ts-nocheck
// Creator Showcase endpoints (tenant-service): public profile, YouTube channel, showcase items,
// platform films and the visibility ladder. Own file, like leadEndpoints.js, so creatorEndpoints.js
// doesn't grow another block. Contract: dallai-llama-backend/docs/lead-management/CREATOR_SHOWCASE.md
import { api as apiSlice } from "@dalaillama/shared-store";
import { opsAdminUrl } from "./creatorEndpoints.js";

const showcaseBase = apiSlice.enhanceEndpoints({
  addTagTypes: ["ShowcaseProfile", "ShowcaseChannel", "ShowcaseVideos", "ShowcaseItems", "ShowcaseVisibility", "ShowcaseUpload",
    "ShowcaseAdmin", "ShowcaseRequests", "Outreach", "EmailTemplates", "Audiences", "AudienceLeads"],
});

export const showcaseApi = showcaseBase.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Profile ----
    getMyPublicProfile: builder.query({
      query: () => ({ url: "/tenants/me/public-profile" }),
      providesTags: ["ShowcaseProfile"],
    }),
    updateMyPublicProfile: builder.mutation({
      query: (body) => ({ url: "/tenants/me/public-profile", method: "PUT", body }),
      invalidatesTags: ["ShowcaseProfile", "ShowcaseVisibility"],
    }),
    checkHandle: builder.query({
      query: (handle) => ({ url: "/tenants/me/public-profile/handle-availability", params: { handle } }),
    }),

    // ---- YouTube channel ----
    getMyChannel: builder.query({
      query: () => ({ url: "/tenants/me/youtube/channel" }),
      providesTags: ["ShowcaseChannel"],
    }),
    linkChannel: builder.mutation({
      query: (channel) => ({ url: "/tenants/me/youtube/channel", method: "POST", body: { channel } }),
      invalidatesTags: ["ShowcaseChannel"],
    }),
    verifyChannel: builder.mutation({
      query: () => ({ url: "/tenants/me/youtube/channel/verify", method: "POST" }),
      invalidatesTags: ["ShowcaseChannel", "ShowcaseVideos", "ShowcaseProfile", "ShowcaseVisibility"],
    }),
    syncChannel: builder.mutation({
      query: () => ({ url: "/tenants/me/youtube/sync", method: "POST" }),
      invalidatesTags: ["ShowcaseVideos", "ShowcaseChannel"],
    }),
    getMyVideos: builder.query({
      query: () => ({ url: "/tenants/me/youtube/videos" }),
      providesTags: ["ShowcaseVideos"],
    }),

    // ---- Showcase items ----
    getMyShowcase: builder.query({
      query: () => ({ url: "/tenants/me/showcase" }),
      providesTags: ["ShowcaseItems"],
    }),
    pickVideo: builder.mutation({
      query: (body) => ({ url: "/tenants/me/showcase", method: "POST", body }),
      invalidatesTags: ["ShowcaseItems", "ShowcaseProfile", "ShowcaseVisibility"],
    }),
    updateShowcaseItem: builder.mutation({
      query: ({ itemId, ...body }) => ({ url: `/tenants/me/showcase/${itemId}`, method: "PUT", body }),
      invalidatesTags: ["ShowcaseItems", "ShowcaseProfile", "ShowcaseVisibility"],
    }),
    removeShowcaseItem: builder.mutation({
      query: (itemId) => ({ url: `/tenants/me/showcase/${itemId}`, method: "DELETE" }),
      invalidatesTags: ["ShowcaseItems", "ShowcaseProfile", "ShowcaseVisibility"],
    }),
    reorderShowcase: builder.mutation({
      query: (itemIds) => ({ url: "/tenants/me/showcase/order", method: "PUT", body: { itemIds } }),
      invalidatesTags: ["ShowcaseItems"],
    }),

    // ---- Films made on Dalaillama ----
    getYouTubeKit: builder.query({
      query: (projectId) => ({ url: `/tenants/me/showcase/projects/${projectId}/youtube-kit` }),
    }),
    linkPlatformFilm: builder.mutation({
      query: ({ projectId, ...body }) => ({ url: `/tenants/me/showcase/projects/${projectId}/youtube-link`, method: "POST", body }),
      invalidatesTags: ["ShowcaseItems", "ShowcaseVisibility"],
    }),
    requestOfficialUpload: builder.mutation({
      query: ({ projectId, ...body }) => ({ url: `/tenants/me/showcase/projects/${projectId}/official-upload`, method: "POST", body }),
      invalidatesTags: ["ShowcaseUpload"],
    }),
    getOfficialUpload: builder.query({
      query: (projectId) => ({ url: `/tenants/me/showcase/projects/${projectId}/official-upload` }),
      providesTags: ["ShowcaseUpload"],
    }),

    // ---- Ops (ops.dalaillama.in only; oauth2-proxy + dalai_admin at the gateway) ----
    adminShowcaseRescore: builder.mutation({
      query: () => ({ url: opsAdminUrl("/tenants/showcase/rescore"), method: "POST" }),
      invalidatesTags: ["ShowcaseAdmin"],
    }),
    adminShowcaseReports: builder.query({
      query: () => ({ url: opsAdminUrl("/tenants/showcase/reports") }),
      providesTags: ["ShowcaseAdmin"],
    }),
    adminShowcaseHideItem: builder.mutation({
      query: ({ publicId, hidden }) => ({ url: opsAdminUrl(`/tenants/showcase/items/${publicId}`), method: "PATCH", body: { hidden } }),
      invalidatesTags: ["ShowcaseAdmin"],
    }),
    adminShowcaseProfileStatus: builder.mutation({
      query: ({ handle, status }) => ({ url: opsAdminUrl(`/tenants/showcase/profiles/${handle}`), method: "PATCH", body: { status } }),
    }),
    adminShowcaseHealth: builder.query({
      query: () => ({ url: opsAdminUrl("/tenants/showcase/health") }),
      providesTags: ["ShowcaseAdmin"],
    }),
    adminShowcaseProbe: builder.mutation({
      query: () => ({ url: opsAdminUrl("/tenants/showcase/health/probe"), method: "POST" }),
      invalidatesTags: ["ShowcaseAdmin"],
    }),
    adminOnboardingBackfill: builder.mutation({
      query: () => ({ url: opsAdminUrl("/tenants/onboarding/backfill"), method: "POST" }),
    }),

    // ---- Visibility ladder ----
    getMyVisibility: builder.query({
      query: () => ({ url: "/tenants/me/visibility" }),
      providesTags: ["ShowcaseVisibility"],
    }),

    // ---- Brand requests ("Request a video" from the public profile) ----
    getMyInquiries: builder.query({
      query: () => ({ url: "/tenants/me/inquiries" }),
      providesTags: ["ShowcaseRequests"],
    }),
    setInquiryStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/tenants/me/inquiries/${id}`, method: "PATCH", body: { status } }),
      invalidatesTags: ["ShowcaseRequests"],
    }),
    convertInquiry: builder.mutation({
      query: (id) => ({ url: `/tenants/me/inquiries/${id}/convert`, method: "POST" }),
      invalidatesTags: ["ShowcaseRequests", "ShowcaseVisibility"],
    }),

    // ---- Outreach (template mail to brands; one mail per brand per day) ----
    getOutreachOverview: builder.query({
      query: () => ({ url: "/tenants/me/outreach" }),
      providesTags: ["Outreach"],
    }),
    previewOutreach: builder.mutation({
      query: (body) => ({ url: "/tenants/me/outreach/preview", method: "POST", body }),
    }),
    sendOutreach: builder.mutation({
      query: (body) => ({ url: "/tenants/me/outreach/send", method: "POST", body }),
      invalidatesTags: ["Outreach"],
    }),
    getOutreachReach: builder.query({
      query: () => ({ url: "/tenants/me/outreach/reach" }),
      providesTags: ["Outreach"],
    }),
    getOutreachHistory: builder.query({
      query: () => ({ url: "/tenants/me/outreach/history" }),
      providesTags: ["Outreach"],
    }),
    buyMailPack: builder.mutation({
      query: (idempotencyKey) => ({ url: "/tenants/me/outreach/packs", method: "POST", body: { idempotencyKey } }),
      invalidatesTags: ["Outreach"],
    }),

    // ---- Phase E: templates, audiences, audience sends, analytics (CREATOR_SHOWCASE.md rules 21-28) ----
    getEmailTemplates: builder.query({
      query: () => ({ url: "/tenants/me/outreach/templates" }),
      providesTags: ["EmailTemplates"],
    }),
    createEmailTemplate: builder.mutation({
      query: (body) => ({ url: "/tenants/me/outreach/templates", method: "POST", body }),
      invalidatesTags: ["EmailTemplates", "Outreach"],
    }),
    updateEmailTemplate: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/tenants/me/outreach/templates/${id}`, method: "PUT", body }),
      invalidatesTags: ["EmailTemplates", "Outreach"],
    }),
    deleteEmailTemplate: builder.mutation({
      query: (id) => ({ url: `/tenants/me/outreach/templates/${id}`, method: "DELETE" }),
      invalidatesTags: ["EmailTemplates", "Outreach"],
    }),
    getAudiences: builder.query({
      query: () => ({ url: "/tenants/me/outreach/audiences" }),
      providesTags: ["Audiences"],
    }),
    createAudience: builder.mutation({
      query: (name) => ({ url: "/tenants/me/outreach/audiences", method: "POST", body: { name } }),
      invalidatesTags: ["Audiences"],
    }),
    deleteAudience: builder.mutation({
      query: (id) => ({ url: `/tenants/me/outreach/audiences/${id}`, method: "DELETE" }),
      invalidatesTags: ["Audiences", "AudienceLeads", "Outreach"],
    }),
    uploadAudienceCsv: builder.mutation({
      query: ({ audienceId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/tenants/me/outreach/audiences/${audienceId}/upload`, method: "POST", body: formData };
      },
      invalidatesTags: ["Audiences", "AudienceLeads"],
    }),
    getAudienceLeads: builder.query({
      query: ({ audienceId, q, page = 0 }) => ({
        url: `/tenants/me/outreach/audiences/${audienceId}/leads`,
        params: { page, ...(q ? { q } : {}) },
      }),
      providesTags: ["AudienceLeads"],
    }),
    removeLeadFromAudience: builder.mutation({
      query: ({ audienceId, leadId }) => ({ url: `/tenants/me/outreach/audiences/${audienceId}/leads/${leadId}`, method: "DELETE" }),
      invalidatesTags: ["Audiences", "AudienceLeads"],
    }),
    discardContactPoint: builder.mutation({
      query: ({ leadId, contactPointId }) => ({
        url: `/tenants/me/outreach/leads/${leadId}/contact-points/${contactPointId}`, method: "DELETE",
      }),
      invalidatesTags: ["Audiences", "AudienceLeads"],
    }),
    sendToAudience: builder.mutation({
      query: (body) => ({ url: "/tenants/me/outreach/send-to-audience", method: "POST", body }),
      invalidatesTags: ["Outreach", "Audiences"],
    }),
    getOutreachAnalytics: builder.query({
      query: (days = 30) => ({ url: "/tenants/me/outreach/analytics", params: { days } }),
      providesTags: ["Outreach"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyPublicProfileQuery,
  useUpdateMyPublicProfileMutation,
  useLazyCheckHandleQuery,
  useGetMyChannelQuery,
  useLinkChannelMutation,
  useVerifyChannelMutation,
  useSyncChannelMutation,
  useGetMyVideosQuery,
  useGetMyShowcaseQuery,
  usePickVideoMutation,
  useUpdateShowcaseItemMutation,
  useRemoveShowcaseItemMutation,
  useReorderShowcaseMutation,
  useGetYouTubeKitQuery,
  useLinkPlatformFilmMutation,
  useRequestOfficialUploadMutation,
  useGetOfficialUploadQuery,
  useGetMyVisibilityQuery,
  useAdminShowcaseRescoreMutation,
  useAdminShowcaseReportsQuery,
  useAdminShowcaseHideItemMutation,
  useAdminShowcaseProfileStatusMutation,
  useAdminShowcaseHealthQuery,
  useAdminShowcaseProbeMutation,
  useAdminOnboardingBackfillMutation,
  useGetMyInquiriesQuery,
  useSetInquiryStatusMutation,
  useConvertInquiryMutation,
  useGetOutreachOverviewQuery,
  usePreviewOutreachMutation,
  useSendOutreachMutation,
  useGetOutreachHistoryQuery,
  useGetOutreachReachQuery,
  useGetEmailTemplatesQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useGetAudiencesQuery,
  useCreateAudienceMutation,
  useDeleteAudienceMutation,
  useUploadAudienceCsvMutation,
  useGetAudienceLeadsQuery,
  useRemoveLeadFromAudienceMutation,
  useDiscardContactPointMutation,
  useSendToAudienceMutation,
  useGetOutreachAnalyticsQuery,
  useBuyMailPackMutation,
} = showcaseApi;
