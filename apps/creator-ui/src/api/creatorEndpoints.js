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
    getWeeklyIdeaTags: builder.query({
      query: () => "/creator/weekly-idea-tags",
      providesTags: ["CreatorTrends"],
    }),
    refreshWeeklyIdeaTags: builder.mutation({
      query: () => ({ url: "/creator/weekly-idea-tags/refresh", method: "POST" }),
      invalidatesTags: ["CreatorTrends"],
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
    getCreatorAiPricing: builder.query({
      query: () => "/creator/ai-pricing",
      providesTags: ["CreatorAiProviders"],
    }),
    getCreatorProviderCredits: builder.query({
      query: () => "/creator/ai-pricing/provider-credits",
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
    generateProductAdPipeline: builder.mutation({
      query: (body = {}) => ({
        url: "/creator/product-ads/pipeline/generate-async",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorProjects", "CreatorTrends"],
    }),
    uploadProductReferenceImages: builder.mutation({
      query: (files = []) => {
        const formData = new FormData();
        (Array.isArray(files) ? files : [files])
          .filter(Boolean)
          .forEach((file) => formData.append("files", file));
        return {
          url: "/creator/product-ads/reference-images",
          method: "POST",
          body: formData,
        };
      },
    }),
    getProductAdAssets: builder.query({
      query: ({ jobId } = {}) => ({
        url: "/creator/product-ads/assets",
        params: { jobId },
      }),
      providesTags: (_result, _error, args) => [{ type: "CreatorProjects", id: `product-ad-assets-${args?.jobId || "latest"}` }],
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
    getShortVideos: builder.query({
      query: () => "/creator/shorts",
      providesTags: ["CreatorProjects"],
    }),
    getShortVideo: builder.query({
      query: (videoId) => `/creator/shorts/${videoId}`,
      providesTags: (_result, _error, videoId) => [{ type: "CreatorProjects", id: `short-${videoId || "detail"}` }],
    }),
    generateShorts: builder.mutation({
      query: ({ file, ...fields }) => {
        const formData = new FormData();
        formData.append("file", file);
        Object.entries(fields || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
          }
        });
        return {
          url: "/creator/shorts/generate",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["CreatorProjects"],
    }),
    createShortMultipartUpload: builder.mutation({
      query: (body = {}) => ({
        url: "/creator/shorts/uploads/multipart",
        method: "POST",
        body,
      }),
    }),
    presignShortMultipartUploadPart: builder.mutation({
      query: ({ uploadId, partNumber, ...body }) => ({
        url: `/creator/shorts/uploads/${uploadId}/multipart/parts/${partNumber}/presign`,
        method: "POST",
        body,
      }),
    }),
    completeShortMultipartUpload: builder.mutation({
      query: ({ uploadId, ...body }) => ({
        url: `/creator/shorts/uploads/${uploadId}/multipart/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorProjects"],
    }),
    createTimelineIngestion: builder.mutation({
      query: (body = {}) => ({
        url: "/creator/shorts/timeline-ingestions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorProjects"],
    }),
    uploadTimelineIngestionPart: builder.mutation({
      query: ({ videoId, partNumber, part, ...fields }) => {
        const formData = new FormData();
        formData.append("part", part);
        Object.entries(fields || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
          }
        });
        return {
          url: `/creator/shorts/timeline-ingestions/${videoId}/parts/${partNumber}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `timeline-ingestion-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    getTimelineIngestion: builder.query({
      query: (videoId) => `/creator/shorts/timeline-ingestions/${videoId}`,
      providesTags: (_result, _error, videoId) => [{ type: "CreatorProjects", id: `timeline-ingestion-${videoId || "detail"}` }],
    }),
    completeTimelineIngestion: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/timeline-ingestions/${videoId}/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `timeline-ingestion-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    requestTimelineFabric: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/timeline-ingestions/${videoId}/fabric-timeline`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `timeline-ingestion-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    requestTimelineTranscript: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/timeline-ingestions/${videoId}/transcript-timeline`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `timeline-ingestion-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    requestTimelineVideoAnalysis: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/timeline-ingestions/${videoId}/video-analysis`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `timeline-ingestion-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    requestTimelineStoryShots: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/timeline-ingestions/${videoId}/story-shots`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `timeline-ingestion-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    pauseShortGeneration: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/${videoId}/pause`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `short-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    saveShortProcessingTimeline: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/${videoId}/timeline`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `short-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    resumeShortGeneration: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/${videoId}/resume`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `short-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    restartShortGeneration: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/${videoId}/restart`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `short-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    runShortVisualAnalysis: builder.mutation({
      query: ({ videoId, ...body }) => ({
        url: `/creator/shorts/${videoId}/visual-analysis`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `short-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
    }),
    reviewShortCandidate: builder.mutation({
      query: ({ videoId, candidateId, action, payload = {} }) => ({
        url: `/creator/shorts/${videoId}/candidates/${candidateId}/review`,
        method: "POST",
        body: { action, payload },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjects", id: `short-${args?.videoId || "detail"}` },
        "CreatorProjects",
      ],
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
    getPostProductionProjects: builder.query({
      query: ({ limit = 30 } = {}) => ({
        url: "/creator/post-production/projects",
        params: { limit },
      }),
      transformResponse: (response = []) => arrayFromResponse(response, ["projects", "items", "content"]),
      providesTags: ["CreatorProjects", "Storyboard"],
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
    suggestCampaignAngles: builder.mutation({
      query: (body = {}) => ({ url: "/creator/angles/suggest", method: "POST", body }),
    }),
    selectLockedCampaignAngle: builder.mutation({
      query: ({ lockedIdeaId, campaignAngle }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/campaign-angle`,
        method: "PUT",
        body: { campaignAngle },
      }),
      invalidatesTags: ["CreatorProjects"],
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
      query: ({ lockedIdeaId, page = 0, size = 5, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/ideas/generate`,
        method: "POST",
        params: { page, size },
        body: Object.keys(body).length ? body : undefined,
      }),
    }),
    generateLockedIdeaOptionsAsync: builder.mutation({
      query: ({ lockedIdeaId, page = 0, size = 5, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/ideas/generate-async`,
        method: "POST",
        params: { page, size },
        body: Object.keys(body).length ? body : undefined,
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
      invalidatesTags: (_result, _error, args) => [
        "CreatorProjects",
        { type: "CreatorProjects", id: `storyline-${args?.storyIdeaId || "detail"}` },
      ],
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
    approveScreenplay: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, scriptId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/screenplay/${scriptId}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorProjects"],
    }),
    generateScreenplayVideoAsync: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/videos/generate-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    uploadScreenplayVideoReferenceImage: builder.mutation({
      query: ({ scriptId, file, details, enhanceScreenplay }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (details) formData.append("details", details);
        if (enhanceScreenplay != null) formData.append("enhanceScreenplay", String(Boolean(enhanceScreenplay)));
        return {
          url: `/creator/storyboards/scripts/${scriptId}/reference-images`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-reference-${body?.scriptId || "current"}` },
        "Storyboard",
      ],
    }),
    uploadScreenplayFounderAvatarSource: builder.mutation({
      query: ({
        scriptId,
        file,
        details,
        providerMode,
        synthesiaAvatarId,
        synthesiaVoiceId,
        localVoiceModel,
        voiceProfileId,
        localTalkingAvatarModel,
        localLipSyncModel,
        localImageModel,
        localVideoModel,
        referenceTranscript,
        previewText,
        spokenText,
        pronunciationGuide,
        elevenLabsVoiceId,
        sarvamVoiceId,
        productionEnhancementEnabled,
        productionEnhancementPrompt,
        consentConfirmed,
        language,
        languageCode,
      }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (details) formData.append("details", details);
        if (providerMode) formData.append("providerMode", providerMode);
        if (synthesiaAvatarId) formData.append("synthesiaAvatarId", synthesiaAvatarId);
        if (synthesiaVoiceId) formData.append("synthesiaVoiceId", synthesiaVoiceId);
        if (localVoiceModel) formData.append("localVoiceModel", localVoiceModel);
        if (voiceProfileId) formData.append("voiceProfileId", voiceProfileId);
        if (localTalkingAvatarModel) formData.append("localTalkingAvatarModel", localTalkingAvatarModel);
        if (localLipSyncModel) formData.append("localLipSyncModel", localLipSyncModel);
        if (localImageModel) formData.append("localImageModel", localImageModel);
        if (localVideoModel) formData.append("localVideoModel", localVideoModel);
        if (referenceTranscript) formData.append("referenceTranscript", referenceTranscript);
        if (previewText) formData.append("previewText", previewText);
        if (spokenText) formData.append("spokenText", spokenText);
        if (pronunciationGuide) formData.append("pronunciationGuide", pronunciationGuide);
        if (elevenLabsVoiceId) formData.append("elevenLabsVoiceId", elevenLabsVoiceId);
        if (sarvamVoiceId) formData.append("sarvamVoiceId", sarvamVoiceId);
        if (productionEnhancementEnabled != null) formData.append("productionEnhancementEnabled", String(Boolean(productionEnhancementEnabled)));
        if (productionEnhancementPrompt) formData.append("productionEnhancementPrompt", productionEnhancementPrompt);
        if (consentConfirmed != null) formData.append("consentConfirmed", String(Boolean(consentConfirmed)));
        if (language) formData.append("language", language);
        if (languageCode) formData.append("languageCode", languageCode);
        return {
          url: `/creator/storyboards/scripts/${scriptId}/founder-avatar-source`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    prepareFounderAvatarPortrait: builder.mutation({
      query: ({ scriptId, file, sourceMode = "extract", timestampSeconds = 0.5, consentConfirmed }) => {
        const formData = new FormData();
        if (file) formData.append("file", file);
        formData.append("sourceMode", sourceMode);
        formData.append("timestampSeconds", String(timestampSeconds));
        formData.append("consentConfirmed", String(Boolean(consentConfirmed)));
        return {
          url: `/creator/storyboards/scripts/${scriptId}/founder-avatar-portrait`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    generateFounderAvatarTest: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-avatar-test`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    prepareFounderEnglishDialogue: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-dialogue/english`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    listReusableFounderAvatars: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/founder-avatars`,
      providesTags: (_result, _error, args) => [
        { type: "Storyboard", id: `screenplay-video-founder-library-${args?.scriptId || "current"}` },
      ],
    }),
    selectReusableFounderAvatar: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-avatar-selection`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-founder-library-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    generateFounderVoicePreview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-voice-preview`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    approveFounderVoicePreview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-voice-approval`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    generateFounderAvatarPreview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-avatar-preview`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    approveFounderAvatarPreview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/founder-avatar-approval`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `screenplay-video-latest-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    uploadFounderFinalAudio: builder.mutation({
      query: ({ scriptId, file, captionText, consentConfirmed }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (captionText) formData.append("captionText", captionText);
        formData.append("consentConfirmed", String(Boolean(consentConfirmed)));
        return {
          url: `/creator/storyboards/scripts/${scriptId}/founder-final-audio`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-founder-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    getLatestScreenplayVideoRun: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/videos/latest`,
      providesTags: (_result, _error, args) => [
        { type: "Storyboard", id: `screenplay-video-latest-${args?.scriptId || "current"}` },
      ],
    }),
    getScreenplayVideoRun: builder.query({
      query: ({ scriptId, runId }) => `/creator/storyboards/scripts/${scriptId}/videos/${runId}`,
      providesTags: (_result, _error, args) => [
        { type: "Storyboard", id: `screenplay-video-${args?.runId || args?.scriptId || "current"}` },
      ],
    }),
    chatScreenplayVideoScene: builder.mutation({
      query: ({ runId, sceneId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/chat`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
      ],
    }),
    generateScreenplaySceneDialogueVoice: builder.mutation({
      query: ({ runId, sceneId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/dialogue-voice`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    decideScreenplaySceneDialogueVoice: builder.mutation({
      query: ({ runId, sceneId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/dialogue-voice/decision`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    combineScreenplaySceneDialogueAudio: builder.mutation({
      query: ({ runId }) => ({
        url: `/creator/storyboards/videos/${runId}/dialogue-audio/combine`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    uploadScreenplaySceneAvatarImage: builder.mutation({
      query: ({ runId, sceneId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/avatar-image`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    uploadScreenplaySceneProductionImage: builder.mutation({
      query: ({ runId, sceneId, file, details }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (details) formData.append("details", details);
        return {
          url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/production-image`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    regenerateScreenplayVideoSceneAsync: builder.mutation({
      query: ({ runId, sceneId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/regenerate-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    generateScreenplayVideoSceneAsync: builder.mutation({
      query: ({ runId, sceneId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/generate-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    renderScreenplayVideoFinalAsync: builder.mutation({
      query: ({ runId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/final-render-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    generateScreenplayVideoAudioPackAsync: builder.mutation({
      query: ({ runId, ...body }) => ({
        url: `/creator/storyboards/videos/${runId}/audio-pack-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `screenplay-video-${body?.runId || "current"}` },
        "Storyboard",
      ],
    }),
    submitHumanWorkOrder: builder.mutation({
      query: (body) => ({
        url: "/creator/human-work-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "CreatorHumanWorkOrders", id: body?.scriptId || "LIST" },
        "CreatorHumanWorkOrders",
        "CreatorProjects",
      ],
    }),
    getHumanWorkOrders: builder.query({
      query: (params = {}) => ({ url: "/creator/human-work-orders", params }),
      providesTags: (_result, _error, params) => [
        { type: "CreatorHumanWorkOrders", id: params?.scriptId || "LIST" },
        "CreatorHumanWorkOrders",
      ],
    }),
    getHumanWorkOrderQueue: builder.query({
      query: (params = {}) => ({ url: "/creator/human-work-orders/queue", params }),
      providesTags: ["CreatorHumanWorkOrders"],
    }),
    updateHumanWorkOrderQueueItem: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/creator/human-work-orders/queue/${workOrderId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CreatorHumanWorkOrders"],
    }),
    addHumanWorkOrderMessage: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/creator/human-work-orders/${workOrderId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "CreatorHumanWorkOrders", id: body?.scriptId || "LIST" },
        "CreatorHumanWorkOrders",
      ],
    }),
    requestHumanWorkOrderChanges: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/creator/human-work-orders/${workOrderId}/request-changes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "CreatorHumanWorkOrders", id: body?.scriptId || "LIST" },
        "CreatorHumanWorkOrders",
      ],
    }),
    approveHumanWorkOrder: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/creator/human-work-orders/${workOrderId}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "CreatorHumanWorkOrders", id: body?.scriptId || "LIST" },
        "CreatorHumanWorkOrders",
        "CreatorWallet",
        "CreatorProjects",
      ],
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
    getStoryboardClientReview: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/client-review`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `client-review-${args?.scriptId || "current"}` }],
    }),
    saveStoryboardClientReview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/client-review`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `client-review-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    chatStoryboardClientReview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/client-review/chat`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `client-review-${body?.scriptId || "current"}` },
      ],
    }),
    applyStoryboardClientReview: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/client-review/apply`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `client-review-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `plans-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    revertStoryboardClientReview: builder.mutation({
      query: ({ scriptId }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/client-review/revert`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `client-review-${body?.scriptId || "current"}` },
        { type: "Storyboard", id: `plans-${body?.scriptId || "current"}` },
        "Storyboard",
        "CreatorProjects",
      ],
    }),
    uploadStoryboardFontReferenceImage: builder.mutation({
      query: ({ scriptId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/creator/storyboards/scripts/${scriptId}/client-review/font-references`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `client-review-${body?.scriptId || "current"}` },
        "CreatorProjects",
      ],
    }),
    uploadStoryboardVisualReferenceImage: builder.mutation({
      query: ({ scriptId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/creator/storyboards/scripts/${scriptId}/client-review/visual-references`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `client-review-${body?.scriptId || "current"}` },
        "CreatorProjects",
      ],
    }),
    getAnimatedStoryboardPreview: builder.query({
      query: ({ scriptId }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/animated-preview`,
        responseHandler: (response) => response.text(),
      }),
      keepUnusedDataFor: 0,
    }),
    getShotImageUrls: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/shots/images`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `shot-images-${args?.scriptId || "current"}` }],
    }),
    getShotTakes: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/takes`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `shot-takes-${args?.scriptId || "current"}` }],
    }),
    uploadShotTake: builder.mutation({
      query: ({ scriptId, shotNumber, file, note }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (note) formData.append("note", note);
        return {
          url: `/creator/storyboards/scripts/${scriptId}/shots/${shotNumber}/takes`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: `shot-takes-${body?.scriptId || "current"}` }],
    }),
    uploadShotTakeReferenceFrame: builder.mutation({
      query: ({ takeId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/creator/storyboards/shots/takes/${takeId}/reference-frame`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Storyboard"],
    }),
    saveShotTakeMediaAnalysis: builder.mutation({
      query: ({ takeId, mediaAnalysis }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/media-analysis`,
        method: "POST",
        body: { mediaAnalysis },
      }),
      invalidatesTags: ["Storyboard"],
    }),
    saveShotTakeSoundTimeline: builder.mutation({
      query: ({ takeId, layers = [], mixSettings = {} }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/sound-timeline`,
        method: "POST",
        body: { layers, mixSettings },
      }),
      invalidatesTags: ["Storyboard"],
    }),
    uploadShotTakeSoundSnippet: builder.mutation({
      query: ({ takeId, file, metadata = {} }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify(metadata));
        return {
          url: `/creator/storyboards/shots/takes/${takeId}/sound-snippets`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Storyboard"],
    }),
    generateShotTakeSoundAsync: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/sound-generate-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    reviewShotTakeAsync: builder.mutation({
      query: ({ takeId }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/review-async`,
        method: "POST",
      }),
      invalidatesTags: ["Storyboard"],
    }),
    confirmShotTake: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    getAcceptedShotSequence: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/accepted-sequence`,
      providesTags: (_result, _error, params) => [{ type: "Storyboard", id: `accepted-sequence-${params?.scriptId || "current"}` }],
    }),
    renderAcceptedShotSequenceAsync: builder.mutation({
      query: ({ scriptId }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/accepted-sequence/final-render-async`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `accepted-sequence-${body?.scriptId || "current"}` },
        "Storyboard",
      ],
    }),
    enhanceShotTakePreviewAsync: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/enhance-preview-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    studioPolishShotTakeAsync: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/studio-polish-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    studioPolishAllShotTakesAsync: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/studio-polish-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: `shot-takes-${body?.scriptId || "current"}` }, "Storyboard"],
    }),
    enhanceShotTakeAudioAsync: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/enhance-audio-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    mixShotTakeAudioAsync: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/audio-mix-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    generateShotTakePolishedFrames: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/polished-frames`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    renderShotTakeFinalVideoAsync: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/final-render-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    saveShotTakeEnhancementFeedback: builder.mutation({
      query: ({ takeId, ...body }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/enhance-feedback`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Storyboard"],
    }),
    applyShotTakePreviewToTimeline: builder.mutation({
      query: ({ takeId, variantId, applied = true }) => ({
        url: `/creator/storyboards/shots/takes/${takeId}/variants/${variantId}/timeline-clip`,
        method: "POST",
        body: { applied },
      }),
      invalidatesTags: ["Storyboard"],
    }),
    enhanceAllShotTakesAsync: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/enhance-all-async`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: `shot-takes-${body?.scriptId || "current"}` }],
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
    editStoryboardShotWithAi: builder.mutation({
      query: ({ scriptId, shotNumber, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/shots/${shotNumber}/ai-edit`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: body?.projectId || body?.scriptId || "latest" },
        "Storyboard",
      ],
    }),
    insertStoryboardTimelineShot: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/shots/insert`,
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
  useGetWeeklyIdeaTagsQuery,
  useRefreshWeeklyIdeaTagsMutation,
  useGetCreatorPlatformsQuery,
  useGetCreatorCategoriesQuery,
  useGetAiProvidersQuery,
  useGetCreatorAiPricingQuery,
  useGetCreatorProviderCreditsQuery,
  useGetTrendsQuery,
  useGetTrendInsightQuery,
  usePredictTrendsMutation,
  useGenerateProductAdPipelineMutation,
  useUploadProductReferenceImagesMutation,
  useGetProductAdAssetsQuery,
  useGetJobQuery,
  useLazyGetJobQuery,
  useGetJobsQuery,
  useGetShortVideosQuery,
  useGetShortVideoQuery,
  useGenerateShortsMutation,
  useCreateShortMultipartUploadMutation,
  usePresignShortMultipartUploadPartMutation,
  useCompleteShortMultipartUploadMutation,
  useCreateTimelineIngestionMutation,
  useUploadTimelineIngestionPartMutation,
  useGetTimelineIngestionQuery,
  useCompleteTimelineIngestionMutation,
  useRequestTimelineFabricMutation,
  useRequestTimelineTranscriptMutation,
  useRequestTimelineVideoAnalysisMutation,
  useRequestTimelineStoryShotsMutation,
  usePauseShortGenerationMutation,
  useSaveShortProcessingTimelineMutation,
  useResumeShortGenerationMutation,
  useRestartShortGenerationMutation,
  useRunShortVisualAnalysisMutation,
  useReviewShortCandidateMutation,
  useGetCreatorProjectsQuery,
  useLazyGetCreatorProjectQuery,
  useGetPostProductionProjectsQuery,
  useCreateCreatorProjectMutation,
  useSuggestAudienceMutation,
  useSuggestCampaignAnglesMutation,
  useSelectLockedCampaignAngleMutation,
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
  useApproveScreenplayMutation,
  useGenerateScreenplayVideoAsyncMutation,
  useUploadScreenplayVideoReferenceImageMutation,
  useUploadScreenplayFounderAvatarSourceMutation,
  usePrepareFounderAvatarPortraitMutation,
  useGenerateFounderAvatarTestMutation,
  usePrepareFounderEnglishDialogueMutation,
  useListReusableFounderAvatarsQuery,
  useSelectReusableFounderAvatarMutation,
  useGenerateFounderVoicePreviewMutation,
  useApproveFounderVoicePreviewMutation,
  useGenerateFounderAvatarPreviewMutation,
  useApproveFounderAvatarPreviewMutation,
  useUploadFounderFinalAudioMutation,
  useGetLatestScreenplayVideoRunQuery,
  useGetScreenplayVideoRunQuery,
  useChatScreenplayVideoSceneMutation,
  useGenerateScreenplaySceneDialogueVoiceMutation,
  useDecideScreenplaySceneDialogueVoiceMutation,
  useCombineScreenplaySceneDialogueAudioMutation,
  useUploadScreenplaySceneAvatarImageMutation,
  useUploadScreenplaySceneProductionImageMutation,
  useRegenerateScreenplayVideoSceneAsyncMutation,
  useGenerateScreenplayVideoSceneAsyncMutation,
  useRenderScreenplayVideoFinalAsyncMutation,
  useGenerateScreenplayVideoAudioPackAsyncMutation,
  useSubmitHumanWorkOrderMutation,
  useGetHumanWorkOrdersQuery,
  useGetHumanWorkOrderQueueQuery,
  useUpdateHumanWorkOrderQueueItemMutation,
  useAddHumanWorkOrderMessageMutation,
  useRequestHumanWorkOrderChangesMutation,
  useApproveHumanWorkOrderMutation,
  useLockIdeaGenerateStoryboardMutation,
  useGenerateStoryboardFromScriptMutation,
  useGenerateStoryboardFromScriptAsyncMutation,
  useGetProductionPlansQuery,
  useGetStoryboardClientReviewQuery,
  useSaveStoryboardClientReviewMutation,
  useChatStoryboardClientReviewMutation,
  useApplyStoryboardClientReviewMutation,
  useRevertStoryboardClientReviewMutation,
  useUploadStoryboardFontReferenceImageMutation,
  useUploadStoryboardVisualReferenceImageMutation,
  useLazyGetAnimatedStoryboardPreviewQuery,
  useGetShotImageUrlsQuery,
  useGetShotTakesQuery,
  useUploadShotTakeMutation,
  useUploadShotTakeReferenceFrameMutation,
  useSaveShotTakeMediaAnalysisMutation,
  useSaveShotTakeSoundTimelineMutation,
  useUploadShotTakeSoundSnippetMutation,
  useGenerateShotTakeSoundAsyncMutation,
  useReviewShotTakeAsyncMutation,
  useConfirmShotTakeMutation,
  useGetAcceptedShotSequenceQuery,
  useRenderAcceptedShotSequenceAsyncMutation,
  useEnhanceShotTakePreviewAsyncMutation,
  useStudioPolishShotTakeAsyncMutation,
  useStudioPolishAllShotTakesAsyncMutation,
  useEnhanceShotTakeAudioAsyncMutation,
  useMixShotTakeAudioAsyncMutation,
  useGenerateShotTakePolishedFramesMutation,
  useRenderShotTakeFinalVideoAsyncMutation,
  useSaveShotTakeEnhancementFeedbackMutation,
  useApplyShotTakePreviewToTimelineMutation,
  useEnhanceAllShotTakesAsyncMutation,
  useGenerateProductionPlansAsyncMutation,
  useGenerateShotImageMutation,
  useEditStoryboardShotWithAiMutation,
  useInsertStoryboardTimelineShotMutation,
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
