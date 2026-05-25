// @ts-nocheck
import { api as apiSlice } from "@dalaillama/shared-store";

const normalizeOrganization = (response = {}) => {
  const data = response?.data && typeof response.data === "object" ? response.data : response;
  const tenantId = data?.tenantId || data?.tenant_id || data?.id || null;
  const name = data?.name || data?.companyName || data?.company_name || data?.organizationName || data?.organization_name || "";
  return {
    ...data,
    tenantId,
    id: data?.id || tenantId,
    name,
    companyName: data?.companyName || data?.company_name || name,
    slug: data?.slug || data?.tenantSlug || data?.tenant_slug || "",
    status: data?.status || (tenantId ? "ACTIVE" : null),
    hasTenant: data?.hasTenant ?? Boolean(tenantId),
    needsOnboarding: data?.needsOnboarding ?? !tenantId,
  };
};

const onboardingOrganization = () => normalizeOrganization({
  hasTenant: false,
  needsOnboarding: true,
});

const normalizeAiProviders = (response = []) => {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.items)
        ? response.items
        : [];

  return items
    .map((provider) => ({
      ...provider,
      code: provider?.code || provider?.providerCode || "",
      label: provider?.label || provider?.displayName || provider?.code || "AI Provider",
      displayName: provider?.displayName || provider?.label || provider?.code || "AI Provider",
      defaultModel: provider?.defaultModel || provider?.model || "",
      defaultProvider: Boolean(provider?.defaultProvider),
      credentialConfigured: provider?.credentialConfigured !== false,
      sortOrder: Number(provider?.sortOrder ?? 100),
      capabilities: provider?.capabilities && typeof provider.capabilities === "object" ? provider.capabilities : {},
    }))
    .filter((provider) => provider.code)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
};

const normalizeCreatorMasterOptions = (response = []) => {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.items)
        ? response.items
        : [];

  return items
    .map((item) => {
      const code = item?.code || item?.value || item?.platformCode || item?.categoryCode || "";
      const displayName = item?.displayName || item?.label || item?.name || code;
      return {
        ...item,
        code,
        value: code,
        label: item?.label || displayName,
        displayName,
        description: item?.description || "",
        iconKey: item?.iconKey || "",
        sortOrder: Number(item?.sortOrder ?? 100),
      };
    })
    .filter((item) => item.code && item.active !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
};

const arrayFromResponse = (response = {}, keys = []) => {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data,
    response?.content,
    response?.items,
    response?.results,
    response?.records,
    response?.page?.content,
    response?.data?.content,
    response?.data?.items,
    response?.data?.results,
    ...keys.map((key) => response?.[key] || response?.data?.[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const normalizeCreatorProjects = (response = []) => {
  return arrayFromResponse(response, ["projects", "creatorProjects"])
    .map((project) => {
      const projectId = project?.projectId || project?.project_id || project?.id || project?.uuid || "";
      const lockedIdea = project?.lockedIdea || project?.lockedIdeaSelection || project?.brief || {};
      const selectedIdea = project?.selectedStoryIdea || project?.storyIdea || project?.selectedIdea || {};
      const title =
        project?.title ||
        project?.projectTitle ||
        project?.name ||
        lockedIdea?.title ||
        project?.lockedIdeaTitle ||
        selectedIdea?.title ||
        project?.ideaTitle ||
        "Creator project";

      return {
        ...project,
        id: project?.id || projectId,
        projectId,
        title,
        lockedIdeaTitle:
          project?.lockedIdeaTitle ||
          lockedIdea?.title ||
          selectedIdea?.title ||
          project?.ideaTitle ||
          title,
        selectedCategoryCode:
          project?.selectedCategoryCode ||
          project?.categoryCode ||
          project?.category_code ||
          lockedIdea?.categoryCode ||
          "",
        durationSeconds:
          project?.durationSeconds ||
          project?.duration_seconds ||
          lockedIdea?.durationSeconds ||
          selectedIdea?.durationSeconds,
        status: project?.status || project?.workflowStatus || project?.state || "DRAFT",
        updatedAt:
          project?.updatedAt ||
          project?.updated_at ||
          project?.modifiedAt ||
          project?.createdAt ||
          project?.created_at,
      };
    })
    .filter((project) => project.projectId || project.id);
};

const normalizeCreatorProject = (response = {}) => {
  const project = response?.data && !Array.isArray(response.data) ? response.data : response;
  return normalizeCreatorProjects({ projects: [project] })[0] || project || {};
};

export const creatorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrganization: builder.query({
      async queryFn(_arg, api, extraOptions, baseQuery) {
        const result = await baseQuery({ url: "/tenants/me" }, api, extraOptions);

        if (result.data !== undefined) {
          return { data: normalizeOrganization(result.data) };
        }

        const status = result.error?.status;
        if (status === 403 || status === 404) return { data: onboardingOrganization() };
        return { error: result.error };
      },
      providesTags: ["CreatorOrganization"],
    }),
    setupOrganization: builder.mutation({
      query: (body = {}) => ({ url: "/tenants", method: "POST", body }),
      transformResponse: normalizeOrganization,
      invalidatesTags: ["CreatorOrganization", "CreatorWallet", "CreatorSubscription"],
    }),
    getTrendCombinations: builder.query({
      query: () => "/creator/trend-combinations",
      providesTags: ["CreatorTrends"],
    }),
    getCreatorPlatforms: builder.query({
      query: () => "/creator/platforms",
      transformResponse: normalizeCreatorMasterOptions,
      providesTags: ["CreatorMasterData"],
    }),
    getCreatorCategories: builder.query({
      query: () => "/creator/categories",
      transformResponse: normalizeCreatorMasterOptions,
      providesTags: ["CreatorMasterData"],
    }),
    getAiProviders: builder.query({
      query: () => "/creator/ai-providers",
      transformResponse: normalizeAiProviders,
      providesTags: ["CreatorAiProviders"],
    }),
    getTrends: builder.query({
      query: ({ platform = "instagram_reels", category = "fitness", timeframe = "7d", days, country = "IN", page = 0, size = 8 } = {}) => ({
        url: "/creator/trends",
        params: { platform, category, timeframe, days, country, page, size },
      }),
      providesTags: ["CreatorTrends"],
    }),
    getTrendInsight: builder.query({
      query: ({ trendId, country = "IN", timezone } = {}) => ({
        url: `/creator/trends/${trendId}/insight`,
        params: { country, timezone },
      }),
      providesTags: (_result, _error, args) => [{ type: "CreatorTrends", id: args?.trendId || "insight" }],
    }),
    predictTrends: builder.mutation({
      query: (body) => ({ url: "/creator/trends/predict", method: "POST", body }),
      invalidatesTags: ["CreatorTrends"],
    }),
    getJob: builder.query({
      query: (jobId) => `/creator/jobs/${jobId}`,
    }),
    getJobs: builder.query({
      query: ({ jobType, lockedIdeaId } = {}) => ({
        url: "/creator/jobs",
        params: { jobType, lockedIdeaId },
      }),
    }),
    getCreatorProjects: builder.query({
      query: ({ page = 0, limit = 20, size = limit } = {}) => ({
        url: "/creator/projects",
        params: { page, size, limit },
      }),
      transformResponse: normalizeCreatorProjects,
      providesTags: ["CreatorProjects"],
    }),
    getCreatorProject: builder.query({
      query: (projectId) => `/creator/projects/${projectId}`,
      transformResponse: normalizeCreatorProject,
      providesTags: (_result, _error, projectId) => [{ type: "CreatorProjects", id: projectId || "detail" }],
    }),
    createCreatorProject: builder.mutation({
      query: (body = {}) => ({
        url: "/creator/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorProjects"],
    }),
    suggestAudience: builder.mutation({
      query: (body = {}) => ({ url: "/creator/audience/suggest", method: "POST", body }),
    }),
    confirmAudience: builder.mutation({
      query: (audience) => ({ url: "/creator/audience/confirm", method: "POST", body: audience }),
      invalidatesTags: ["CreatorProjects"],
    }),
    listCreators: builder.query({
      query: (params = {}) => ({ url: "/creator/profiles", params }),
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
    lockIdeaSelection: builder.mutation({
      query: (body) => ({ url: "/creator/locked-ideas/selection", method: "POST", body }),
      invalidatesTags: ["CreatorProjects"],
    }),
    generateLockedIdeaOptions: builder.mutation({
      query: ({ lockedIdeaId, page = 0, size = 5 }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/ideas/generate`,
        method: "POST",
        params: { page, size },
      }),
    }),
    generateLockedIdeaOptionsAsync: builder.mutation({
      query: ({ lockedIdeaId, page = 0, size = 5 }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/ideas/generate-async`,
        method: "POST",
        params: { page, size },
      }),
    }),
    saveStoryIdea: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/save`,
        method: "POST",
      }),
    }),
    generateStoryIdeaScript: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/script/generate`,
        method: "POST",
        body,
      }),
    }),
    saveStoryIdeaScript: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/script`,
        method: "PUT",
        body,
      }),
    }),
    getCharacterCastMappings: builder.query({
      query: ({ lockedIdeaId, storyIdeaId }) => `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/cast-mappings`,
      providesTags: (_result, _error, args) => [{ type: "CreatorProfiles", id: `cast-map-${args?.storyIdeaId || "current"}` }],
    }),
    saveCharacterCastMappings: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/cast-mappings`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProfiles", id: `cast-map-${args?.storyIdeaId || "current"}` },
        "CreatorProjects",
      ],
    }),
    generateStoryIdeaScreenplay: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/screenplay/generate`,
        method: "POST",
        body,
      }),
    }),
    generateStoryIdeaScreenplayAsync: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/screenplay/generate-async`,
        method: "POST",
        body,
      }),
    }),
    saveGeneratedScript: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, scriptId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/screenplay/${scriptId}`,
        method: "PUT",
        body,
      }),
    }),
    lockIdeaGenerateStoryboard: builder.mutation({
      query: (body) => ({ url: "/creator/locked-ideas/generate-storyboard", method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: body?.projectId || "latest" }],
    }),
    generateStoryboardFromScript: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: body?.projectId || body?.scriptId || "latest" },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    generateStoryboardFromScriptAsync: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/generate-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: body?.projectId || body?.scriptId || "latest" },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    getProductionPlans: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/plans`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `plans-${args?.scriptId || "current"}` }],
    }),
    getShotImageUrls: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/shots/images`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `shot-images-${args?.scriptId || "current"}` }],
    }),
    generateProductionPlansAsync: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/plans/generate-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: `plans-${body?.scriptId || "current"}` }, "CreatorProjects"],
    }),
    generateShotImage: builder.mutation({
      query: ({ scriptId, shotNumber, imageKind, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/shots/${shotNumber}/images/${imageKind}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: body?.projectId || body?.scriptId || "latest" },
        "Storyboard",
      ],
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
    getCreatorStorylineHistory: builder.query({
      query: (params = {}) => ({ url: "/creator/history/storylines", params }),
      providesTags: ["CreatorProjects"],
    }),
    getCreatorStorylineHistoryItem: builder.query({
      query: (storyIdeaId) => `/creator/history/storylines/${storyIdeaId}`,
      providesTags: (_result, _error, storyIdeaId) => [{ type: "CreatorProjects", id: `storyline-${storyIdeaId || "detail"}` }],
    }),
    getCreatorScriptHistory: builder.query({
      query: (params = {}) => ({ url: "/creator/history/scripts", params }),
      providesTags: ["CreatorProjects"],
    }),
    getCreatorScriptHistoryItem: builder.query({
      query: (scriptId) => `/creator/history/scripts/${scriptId}`,
      providesTags: (_result, _error, scriptId) => [{ type: "CreatorProjects", id: `script-${scriptId || "detail"}` }],
    }),
    getCreatorStoryboardHistory: builder.query({
      query: (params = {}) => ({ url: "/creator/history/storyboards", params }),
      providesTags: ["Storyboard"],
    }),
    getCreatorStoryboardHistoryItem: builder.query({
      query: (storyboardId) => `/creator/history/storyboards/${storyboardId}`,
      providesTags: (_result, _error, storyboardId) => [{ type: "Storyboard", id: `storyboard-${storyboardId || "detail"}` }],
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
      query: (tenantId) => (tenantId ? `/billing/${tenantId}/wallet` : "/wallet/balance"),
      providesTags: ["CreatorWallet"],
    }),
    createWalletRecharge: builder.mutation({
      query: (body = {}) => {
        const { tenantId, ...payload } = body;
        return {
          url: tenantId ? `/billing/${tenantId}/wallet/recharge` : "/wallet/add-balance",
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["CreatorWallet"],
    }),
    getCreatorSubscription: builder.query({
      query: () => "/tenants/me/apps",
      transformResponse: (response) => {
        const apps = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.items)
              ? response.items
              : [];
        const creatorApp = apps.find((app) => {
          const product = String(app?.productCode || app?.product_code || "").toUpperCase();
          const type = String(app?.appType || app?.app_type || "").toUpperCase();
          return product.includes("CREATOR") || type.includes("CREATOR");
        });
        if (!creatorApp) {
          return {
            planName: "Creator Starter",
            planCode: "CREATOR_STARTER",
            status: "NOT_SUBSCRIBED",
            creatorEntitlements: {
              creatorTrendPredictionEnabled: false,
              lockIdeaPackageEnabled: false,
            },
          };
        }
        const status = creatorApp.deploymentStatus || creatorApp.status || "ACTIVE";
        return {
          ...creatorApp,
          planName: creatorApp.planName || creatorApp.planCode || creatorApp.displayName || "Creator",
          planCode: creatorApp.planCode || creatorApp.plan_code || "CREATOR",
          status,
          creatorEntitlements: {
            creatorTrendPredictionEnabled: status !== "FAILED",
            lockIdeaPackageEnabled: status !== "FAILED",
          },
        };
      },
      providesTags: ["CreatorSubscription"],
    }),
    startSubscriptionUpgrade: builder.mutation({
      query: (body = {}) => ({
        url: "/subscriptions",
        method: "POST",
        body: {
          productCode: "CREATOR",
          planCode: "CREATOR_PRO",
          agentCount: 0,
          ...body,
        },
      }),
      invalidatesTags: ["CreatorSubscription"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrganizationQuery,
  useSetupOrganizationMutation,
  useGetTrendCombinationsQuery,
  useGetCreatorPlatformsQuery,
  useGetCreatorCategoriesQuery,
  useGetAiProvidersQuery,
  useGetTrendsQuery,
  useGetTrendInsightQuery,
  usePredictTrendsMutation,
  useGetJobQuery,
  useLazyGetJobQuery,
  useGetJobsQuery,
  useGetCreatorProjectsQuery,
  useLazyGetCreatorProjectQuery,
  useCreateCreatorProjectMutation,
  useSuggestAudienceMutation,
  useConfirmAudienceMutation,
  useListCreatorsQuery,
  useCreateCreatorMutation,
  useUpdateCreatorMutation,
  useGenerateIdeasMutation,
  useQuoteLockedIdeaMutation,
  useLockIdeaSelectionMutation,
  useGenerateLockedIdeaOptionsMutation,
  useGenerateLockedIdeaOptionsAsyncMutation,
  useSaveStoryIdeaMutation,
  useGenerateStoryIdeaScriptMutation,
  useSaveStoryIdeaScriptMutation,
  useGetCharacterCastMappingsQuery,
  useSaveCharacterCastMappingsMutation,
  useGenerateStoryIdeaScreenplayMutation,
  useGenerateStoryIdeaScreenplayAsyncMutation,
  useSaveGeneratedScriptMutation,
  useLockIdeaGenerateStoryboardMutation,
  useGenerateStoryboardFromScriptMutation,
  useGenerateStoryboardFromScriptAsyncMutation,
  useGetProductionPlansQuery,
  useGetShotImageUrlsQuery,
  useGenerateProductionPlansAsyncMutation,
  useGenerateShotImageMutation,
  useGenerateStoryboardMutation,
  useGetStoryboardQuery,
  useRegenerateSceneMutation,
  useSaveStoryboardMutation,
  useUnsaveStoryboardMutation,
  useGetStoryboardHistoryQuery,
  useGetSavedStoryboardsQuery,
  useGetCreatorStorylineHistoryQuery,
  useLazyGetCreatorStorylineHistoryItemQuery,
  useGetCreatorStorylineHistoryItemQuery,
  useGetCreatorScriptHistoryQuery,
  useLazyGetCreatorScriptHistoryItemQuery,
  useGetCreatorScriptHistoryItemQuery,
  useGetCreatorStoryboardHistoryQuery,
  useGetCreatorStoryboardHistoryItemQuery,
  useRequestExportMutation,
  useGetExportQuery,
  useGetWalletQuery,
  useCreateWalletRechargeMutation,
  useGetCreatorSubscriptionQuery,
  useStartSubscriptionUpgradeMutation,
} = creatorApi;
