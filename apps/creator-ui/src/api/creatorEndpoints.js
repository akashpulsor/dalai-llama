// @ts-nocheck
import { api as apiSlice } from "@dalaillama/shared-store";

export const creatorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrendCombinations: builder.query({
      query: () => "/creator/trend-combinations",
      providesTags: ["CreatorTrends"],
    }),
    getTrends: builder.query({
      query: ({ platform = "instagram", category = "fitness", timeframe = "7d", country = "IN" } = {}) => ({
        url: "/creator/trends",
        params: { platform, category, timeframe, country },
      }),
      providesTags: ["CreatorTrends"],
    }),
    predictTrends: builder.mutation({
      query: (body) => ({ url: "/creator/trends/predict", method: "POST", body }),
      invalidatesTags: ["CreatorTrends"],
    }),
    getJob: builder.query({
      query: (jobId) => `/creator/jobs/${jobId}`,
    }),
    suggestAudience: builder.mutation({
      query: ({ trendId }) => ({ url: "/creator/audience/suggest", method: "POST", body: { trendId } }),
    }),
    confirmAudience: builder.mutation({
      query: (audience) => ({ url: "/creator/audience/confirm", method: "POST", body: audience }),
    }),
    listCreators: builder.query({
      query: () => "/creator/profiles",
      providesTags: ["CreatorProfiles"],
    }),
    createCreator: builder.mutation({
      query: (body) => ({ url: "/creator/profiles", method: "POST", body }),
      invalidatesTags: ["CreatorProfiles"],
    }),
    updateCreator: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/creator/profiles/${id}`, method: "PATCH", body }),
      invalidatesTags: ["CreatorProfiles"],
    }),
    generateIdeas: builder.mutation({
      query: ({ trendId, audienceId, creatorId }) => ({
        url: "/creator/ideas/generate",
        method: "POST",
        body: { trendId, audienceId, creatorId },
      }),
    }),
    quoteLockedIdea: builder.mutation({
      query: (body) => ({ url: "/creator/locked-ideas/quote", method: "POST", body }),
    }),
    lockIdeaGenerateStoryboard: builder.mutation({
      query: (body) => ({ url: "/creator/locked-ideas/generate-storyboard", method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: body?.projectId || "latest" }],
    }),
    generateStoryboard: builder.mutation({
      query: (body) => ({ url: "/creator/storyboard/generate", method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: body?.projectId || "latest" }],
    }),
    getStoryboard: builder.query({
      query: (projectId) => `/creator/storyboard/${projectId}`,
      providesTags: (_result, _error, projectId) => [{ type: "Storyboard", id: projectId }],
    }),
    regenerateScene: builder.mutation({
      query: ({ projectId, sceneId }) => ({
        url: `/creator/storyboard/${projectId}/scenes/${sceneId}/regenerate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: "Storyboard", id: projectId }],
    }),
    saveStoryboard: builder.mutation({
      query: ({ storyboardId, ...body }) => ({
        url: `/creator/storyboards/${storyboardId}/save`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    unsaveStoryboard: builder.mutation({
      query: ({ storyboardId }) => ({
        url: `/creator/storyboards/${storyboardId}/save`,
        method: "DELETE",
      }),
      invalidatesTags: ["Storyboard"],
    }),
    getStoryboardHistory: builder.query({
      query: (params = {}) => ({ url: "/creator/storyboards/history", params }),
      providesTags: ["Storyboard"],
    }),
    getSavedStoryboards: builder.query({
      query: (params = {}) => ({ url: "/creator/storyboards/saved", params }),
      providesTags: ["Storyboard"],
    }),
    requestExport: builder.mutation({
      query: ({ projectId, format }) => ({
        url: "/creator/export",
        method: "POST",
        body: { projectId, format },
      }),
    }),
    getExport: builder.query({
      query: (exportId) => `/creator/export/${exportId}`,
    }),
    getWallet: builder.query({
      query: () => "/creator/billing/wallet",
      providesTags: ["CreatorWallet"],
    }),
    createWalletRecharge: builder.mutation({
      query: (body) => ({ url: "/creator/billing/recharge", method: "POST", body }),
      invalidatesTags: ["CreatorWallet"],
    }),
    getSubscription: builder.query({
      query: () => "/creator/subscription",
      providesTags: ["CreatorSubscription"],
    }),
    startSubscriptionUpgrade: builder.mutation({
      query: (body) => ({ url: "/creator/subscription/upgrade", method: "POST", body }),
      invalidatesTags: ["CreatorSubscription"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTrendCombinationsQuery,
  useGetTrendsQuery,
  usePredictTrendsMutation,
  useGetJobQuery,
  useSuggestAudienceMutation,
  useConfirmAudienceMutation,
  useListCreatorsQuery,
  useCreateCreatorMutation,
  useUpdateCreatorMutation,
  useGenerateIdeasMutation,
  useQuoteLockedIdeaMutation,
  useLockIdeaGenerateStoryboardMutation,
  useGenerateStoryboardMutation,
  useGetStoryboardQuery,
  useRegenerateSceneMutation,
  useSaveStoryboardMutation,
  useUnsaveStoryboardMutation,
  useGetStoryboardHistoryQuery,
  useGetSavedStoryboardsQuery,
  useRequestExportMutation,
  useGetExportQuery,
  useGetWalletQuery,
  useCreateWalletRechargeMutation,
  useGetSubscriptionQuery,
  useStartSubscriptionUpgradeMutation,
} = creatorApi;
