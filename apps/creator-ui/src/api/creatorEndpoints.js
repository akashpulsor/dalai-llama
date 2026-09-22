// @ts-nocheck
import { api as apiSlice } from "@dalaillama/shared-store";
import { appConfig } from "@dalaillama/shared-config";

/**
 * The 9 real backend services (creative-planning-service, pre-production-service,
 * trend-intelligence-service, etc. -- creator-service is decommissioned) are NOT behind
 * the `/creator/*` gateway prefix every other endpoint in this file uses. Per
 * infra-platform/charts/backend-service/values.yaml's Istio VirtualService `apiPaths`,
 * each of them is mounted at the gateway host's bare `/v1/...` (no `/api` segment, no
 * per-service path segment) -- e.g. creative-planning-service owns `/v1/project-requirements`
 * and `/v1/public/project-requirements`, trend-intelligence-service owns `/v1/trend-reports`,
 * pre-production-service owns `/v1/projects`. That's a different mount than this slice's
 * configured `baseUrl` (`appConfig.API_BASE_URL`, which always ends in `/api/v1`), so these
 * calls use a fully-qualified URL (same origin as API_BASE_URL, `/v1` instead of `/api/v1`)
 * to bypass fetchBaseQuery's baseUrl join instead of a relative path.
 */
const platformApiOrigin = (() => {
  try {
    const base = new URL(appConfig.API_BASE_URL, typeof window !== "undefined" ? window.location.origin : undefined);
    return base.origin;
  } catch {
    return "https://api.dalaillama.in";
  }
})();
const platformUrl = (path) => `${platformApiOrigin}/v1${path}`;

/**
 * Same-origin URL for admin ops endpoints. Uses window.location.origin explicitly rather than
 * a leading-slash relative path because RTK Query's baseUrl (`platformApiOrigin/api/v1`) prepends
 * to any non-absolute URL -- returning `/api/v1/internal/admin/...` produced double-prefixed
 * requests like https://api.dalaillama.in/api/v1/api/v1/internal/admin/... (observed in prod).
 *
 * The /admin route only renders on ops.dalaillama.in (AdminOpsPage.isServedOnOpsHost guard), so
 * window.location.origin is always the ops hostname when these endpoints are called; the ops
 * VirtualService then routes /api/v1/internal/admin/** to the owning backend service.
 */
const opsAdminUrl = (path) => {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/api/v1/internal/admin${path}`;
};

/** Same rationale as opsAdminUrl -- Loki HTTP API is same-origin on ops.dalaillama.in via the
 * VirtualService /loki/api route. */
const opsLokiUrl = (path) => {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/loki/api${path}`;
};

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

    // billing-service GET /api/v1/billing/{tenantId}/wallet/transactions -- the full wallet
    // ledger: RECHARGE/ADJUSTMENT_CREDIT (money in), USAGE_DEDUCTION/DID_RENTAL/SUBSCRIPTION
    // (money out). Client-payment earnings land here as ADJUSTMENT_CREDIT once the pay-to-lock
    // flow exists. Relative URL -> hits API_BASE_URL (/api/v1), not the /v1 platform services.
    listWalletTransactions: builder.query({
      query: (tenantId) => ({ url: `/billing/${tenantId}/wallet/transactions?size=200` }),
      transformResponse: (response) => response?.content || response?.data?.content || response || [],
      providesTags: ["CreatorWallet"],
    }),

    // billing-service GET /api/v1/billing/{tenantId}/video-pricing/quote?durationSeconds=N --
    // live price estimate (platform per-second rate x seconds, plus this creator's own
    // marginPercent, same field updateOrganization above writes) shown while a creator is
    // typing a duration into the Start New Idea modal, before they submit.
    getVideoPricingQuote: builder.query({
      query: ({ tenantId, durationSeconds }) => ({
        url: `/billing/${tenantId}/video-pricing/quote?durationSeconds=${durationSeconds}`,
      }),
    }),

    // tenant-service PUT /api/v1/tenants/{id} -- partial update (null fields left untouched).
    // Used today for marginPercent: the creator's own markup on the platform's standard rate
    // for client-facing pricing.
    updateOrganization: builder.mutation({
      query: ({ tenantId, ...body }) => ({ url: `/tenants/${tenantId}`, method: "PUT", body }),
      transformResponse: normalizeOrganization,
      invalidatesTags: ["CreatorOrganization"],
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
    generatePatchEditAsync: builder.mutation({
      // Model-agnostic video-to-video edit request for the AI Patch Editor.
      // `file` is the already-cut selection clip; `provider`/`model` tell the
      // backend which engine to route to (e.g. provider: "kling", model: "kling-o3-pro").
      // Returns { jobId }, polled via getJob/useGetJobQuery like every other *Async mutation.
      query: ({ file, ...fields }) => {
        const formData = new FormData();
        formData.append("file", file);
        Object.entries(fields || {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          if (Array.isArray(value)) {
            // Repeated same-key parts - Spring binds this to List<MultipartFile>.
            value.forEach((item) => formData.append(key, item));
            return;
          }
          formData.append(key, value);
        });
        return {
          url: "/creator/patch-editor/edits/generate-async",
          method: "POST",
          body: formData,
        };
      },
    }),
    // --- Dub / change-language (post-production-service, platform /v1/dubbing) ---
    // Upload a whole video + a target language; the backend runs the full pipeline
    // (transcribe -> translate -> clone voice -> synthesize -> lip-sync the speaking
    // parts -> re-mux) and returns { jobId }. Poll getDubbingJob until status COMPLETED;
    // the completed view carries videoUrl (presigned) for the dubbed result.
    createDubbingJob: builder.mutation({
      query: ({ file, targetLanguage }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("targetLanguage", targetLanguage);
        return { url: platformUrl("/dubbing/jobs"), method: "POST", body: formData };
      },
    }),
    getDubbingJob: builder.query({
      query: (jobId) => ({ url: platformUrl(`/dubbing/jobs/${jobId}`) }),
    }),
    // billing-service, /api/v1/billing (default relative baseUrl -- not the platformUrl()
    // /v1 mount every other cross-service call in this file uses, see the note at the top).
    // Real accumulated spend for one project against its quoted price.
    getProjectSpend: builder.query({
      query: ({ tenantId, projectId }) => `/billing/${tenantId}/projects/${projectId}/spend`,
      providesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `spend-${args?.projectId}` }],
    }),

    // --- Upscale (post-production-service, platform /v1/post-production) ---
    // Manual CTA once a video exists: pick a model from the type=upscale catalog and run it
    // against a hosted video URL. Blocks until done -- no job id, returns { videoUrl } directly.
    listUpscaleModels: builder.query({
      query: () => ({ url: platformUrl("/post-production/models"), params: { type: "upscale" } }),
    }),
    generateUpscale: builder.mutation({
      query: ({ sourceVideoUrl, model, durationSeconds }) => ({
        url: platformUrl("/post-production/upscale"),
        method: "POST",
        body: { sourceVideoUrl, model, durationSeconds },
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
    uploadActorReferenceImage: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/creator/profiles/${id}/reference-image`,
          method: "POST",
          body: formData,
        };
      },
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
    // Opt-in "run the whole graph" entry point: story script -> screenplay -> shot plan ->
    // storyboard, each stage running its own critic/retry loop already. Returns { jobId },
    // polled via getJob/useGetJobQuery like every other *Async mutation - the job's
    // outputPayload.trace is a readable step-by-step log of what each stage did.
    runGraphPipeline: builder.mutation({
      query: ({ lockedIdeaId, storyIdeaId, ...body }) => ({
        url: `/creator/locked-ideas/${lockedIdeaId}/story-ideas/${storyIdeaId}/pipeline/run`,
        method: "POST",
        body: Object.keys(body || {}).length ? body : undefined,
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
    getScreenplaySceneAssets: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/scene-assets`,
      providesTags: (_result, _error, args) => [
        { type: "Storyboard", id: `screenplay-scene-assets-${args?.scriptId || "current"}` },
      ],
    }),
    setScreenplaySceneAssetAccepted: builder.mutation({
      query: ({ scriptId, assetId, accepted }) => ({
        url: `/creator/storyboards/scene-assets/${assetId}/accept`,
        method: "POST",
        body: { accepted },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "Storyboard", id: `screenplay-scene-assets-${args?.scriptId || "current"}` },
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
    uploadScreenplaySceneReferenceImage: builder.mutation({
      query: ({ runId, sceneId, file, priority }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("priority", priority === "override" ? "override" : "combine");
        return {
          url: `/creator/storyboards/videos/${runId}/scenes/${sceneId}/reference-image`,
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
    embedOfflineAnimatedStoryboardHtml: builder.mutation({
      query: ({ scriptId, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/animation/embed-offline-html`,
        method: "POST",
        body,
      }),
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
    analyzeShotProductReference: builder.mutation({
      query: ({ scriptId, shotNumber, file, classification }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("classification", classification);
        return {
          url: `/creator/storyboards/scripts/${scriptId}/shots/${shotNumber}/product-reference/analyze`,
          method: "POST",
          body: formData,
        };
      },
    }),
    confirmShotProductReference: builder.mutation({
      query: ({ scriptId, shotNumber, ...body }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/shots/${shotNumber}/product-reference/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: body?.projectId || body?.scriptId || "latest" },
        "Storyboard",
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
    // Storyboard "workspace" - the RAG-grounded chat brain that can read the whole
    // project's shots and edit them directly (sandboxed until merge). Distinct from
    // the client-review chat above, which proposes diffs for manual apply/revert.
    openStoryboardWorkspace: builder.mutation({
      query: ({ scriptId }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/workspace`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: `workspace-${body?.scriptId || "current"}` }],
    }),
    getStoryboardWorkspaces: builder.query({
      query: ({ scriptId }) => `/creator/storyboards/scripts/${scriptId}/workspace`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `workspace-${args?.scriptId || "current"}` }],
    }),
    chatStoryboardWorkspace: builder.mutation({
      query: ({ scriptId, workspaceId, message, shotNumber }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/workspace/${workspaceId}/chat`,
        method: "POST",
        body: { message, shotNumber },
      }),
    }),
    uploadWorkspaceShotInspirationImage: builder.mutation({
      query: ({ scriptId, workspaceId, shotNumber, file, note }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (note) formData.append("note", note);
        return {
          url: `/creator/storyboards/scripts/${scriptId}/workspace/${workspaceId}/shots/${shotNumber}/inspiration-image`,
          method: "POST",
          body: formData,
        };
      },
    }),
    createStoryboardWorkspaceCheckpoint: builder.mutation({
      query: ({ scriptId, workspaceId, title }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/workspace/${workspaceId}/checkpoints`,
        method: "POST",
        body: { title },
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "Storyboard", id: `workspace-checkpoints-${body?.workspaceId || "current"}` }],
    }),
    getStoryboardWorkspaceCheckpoints: builder.query({
      query: ({ scriptId, workspaceId }) => `/creator/storyboards/scripts/${scriptId}/workspace/${workspaceId}/checkpoints`,
      providesTags: (_result, _error, args) => [{ type: "Storyboard", id: `workspace-checkpoints-${args?.workspaceId || "current"}` }],
    }),
    revertStoryboardWorkspace: builder.mutation({
      query: ({ scriptId, workspaceId, toVersion }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/workspace/${workspaceId}/revert`,
        method: "POST",
        body: { toVersion },
      }),
    }),
    mergeStoryboardWorkspace: builder.mutation({
      query: ({ scriptId, workspaceId }) => ({
        url: `/creator/storyboards/scripts/${scriptId}/workspace/${workspaceId}/merge`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Storyboard", id: `shot-images-${body?.scriptId || "current"}` },
        "CreatorProjects",
      ],
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
    // billing-service UsageController.getUsageRecords -- individual debit line items newest
    // first (LLM usage, video generation, client-review payments, ...), the actual log behind
    // the wallet balance moving, as opposed to getWallet's single current-balance number.
    listUsageRecords: builder.query({
      query: ({ tenantId, limit = 50 } = {}) => `/billing/${tenantId}/usage/records?limit=${limit}`,
      providesTags: ["CreatorWallet"],
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

    // product-service CreatorVideoSubscriptionController -- the real creator-video subscription
    // (edits/upload/upscaling/voice-clone/share gating), separate from the CREATOR/CREATOR_PRO
    // stub above (that one is wired to the PBX tenant-app system and isn't this feature).
    listCreatorVideoPlans: builder.query({
      query: () => "/products/creator-video/plans",
      providesTags: ["CreatorVideoSubscription"],
    }),
    // Primary lookup by subscriptionId (matches how billing-service/product-service key
    // everything else in this flow) -- getCreatorVideoEntitlementsByTenant below is the
    // convenience form for a page load that only has tenantId so far.
    getCreatorVideoEntitlementsBySubscription: builder.query({
      query: (subscriptionId) => `/products/creator-video/subscriptions/${subscriptionId}/entitlements`,
      providesTags: ["CreatorVideoSubscription"],
    }),
    getCreatorVideoEntitlementsByTenant: builder.query({
      query: (tenantId) => `/products/creator-video/tenants/${tenantId}/entitlements`,
      providesTags: ["CreatorVideoSubscription"],
    }),
    subscribeCreatorVideo: builder.mutation({
      query: ({ tenantId, planCode }) => ({
        url: "/products/creator-video/subscriptions",
        method: "POST",
        body: { tenantId, planCode },
      }),
      invalidatesTags: ["CreatorVideoSubscription", "CreatorWallet"],
    }),
    cancelCreatorVideoSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/products/creator-video/subscriptions/${subscriptionId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["CreatorVideoSubscription"],
    }),
    pauseCreatorVideoSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/products/creator-video/subscriptions/${subscriptionId}/pause`,
        method: "POST",
      }),
      invalidatesTags: ["CreatorVideoSubscription"],
    }),
    resumeCreatorVideoSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/products/creator-video/subscriptions/${subscriptionId}/resume`,
        method: "POST",
      }),
      invalidatesTags: ["CreatorVideoSubscription", "CreatorWallet"],
    }),

    /* ------------------------------------------------------------------ */
    /*  Home page: recent projects (pre-production-service), trend tags   */
    /*  (trend-intelligence-service), and the standalone "new idea" brief */
    /*  + client funding link (creative-planning-service).                */
    /* ------------------------------------------------------------------ */

    // pre-production-service ProjectController: GET /v1/projects -- tenant's own
    // projects, ProjectView { id, name, lockedIdeaId, budgetTier, status, createdAt },
    // already sorted newest-first by the service itself.
    listPreProductionProjects: builder.query({
      query: () => ({ url: platformUrl("/projects") }),
      transformResponse: (response) => (Array.isArray(response) ? response : []),
      providesTags: ["CreatorHomeProjects"],
    }),

    // pre-production-service ProjectController: GET /v1/projects/shot-design-ready -- every
    // recent project that has at least one real shot, shots included inline. Replaces
    // getPostProductionProjects (GET /creator/post-production/projects), which only ever existed
    // on creator-service -- decommissioned, not deployed, and even when it was, that route lived
    // behind the /api/v1/creator/* apiPath, which the gateway never routes to a disabled service.
    // No per-shot storyboard/lighting/camera-plan thumbnail URLs here -- see
    // ShotDesignReadyProjectView's javadoc for why; PlannerPage's normalizer already tolerates a
    // shot with no image fields.
    listShotDesignReadyProjects: builder.query({
      query: ({ limit = 30 } = {}) => ({ url: platformUrl("/projects/shot-design-ready"), params: { limit } }),
      transformResponse: (response) => (Array.isArray(response) ? response : []),
      providesTags: ["CreatorProjects"],
    }),

    // trend-intelligence-service TrendReportController: GET /v1/trend-reports -- the
    // tenant's own saved reports, newest-first. There is no discovery/browse endpoint --
    // this only ever returns reports the tenant already generated via generateTrendReport.
    listTrendReports: builder.query({
      query: () => ({ url: platformUrl("/trend-reports") }),
      transformResponse: (response) => (Array.isArray(response) ? response : []),
      providesTags: ["CreatorTrendReports"],
    }),

    // trend-intelligence-service TrendReportController: POST /v1/trend-reports
    // { topic, industry, targetAudience } -- generates a new report (LLM-backed).
    generateTrendReport: builder.mutation({
      query: (body) => ({ url: platformUrl("/trend-reports"), method: "POST", body }),
      invalidatesTags: ["CreatorTrendReports"],
    }),

    // ---- Brands (Plans & Brand tab) ----
    // creative-planning-service BrandContextController: a tenant can manage several brands now
    // (an agency running multiple client brands) -- every route takes an explicit brandId, no
    // more implicit "the tenant's one brand." Each brand is versioned (every update snapshots a
    // new row, see BrandContextService's javadoc).
    listBrands: builder.query({
      query: () => ({ url: platformUrl(`/brands`) }),
      providesTags: ["CreatorBrands"],
    }),
    createBrand: builder.mutation({
      query: (body) => ({ url: platformUrl(`/brands`), method: "POST", body }),
      invalidatesTags: ["CreatorBrands"],
    }),
    getBrand: builder.query({
      query: (brandId) => ({ url: platformUrl(`/brands/${brandId}`) }),
      providesTags: (_result, _error, brandId) => [{ type: "CreatorBrandVersions", id: brandId }],
    }),
    updateBrand: builder.mutation({
      query: ({ brandId, ...body }) => ({ url: platformUrl(`/brands/${brandId}`), method: "PUT", body }),
      invalidatesTags: (_result, _error, args) => [
        "CreatorBrands",
        { type: "CreatorBrandVersions", id: args?.brandId },
      ],
    }),
    listBrandVersions: builder.query({
      query: (brandId) => ({ url: platformUrl(`/brands/${brandId}/versions`) }),
      providesTags: (_result, _error, brandId) => [{ type: "CreatorBrandVersions", id: brandId }],
    }),
    getBrandVersion: builder.query({
      query: ({ brandId, version }) => ({ url: platformUrl(`/brands/${brandId}/versions/${version}`) }),
      providesTags: (_result, _error, args) => [{ type: "CreatorBrandVersions", id: `${args?.brandId}-${args?.version}` }],
    }),
    // Every brief/project created for this brand -- "what has this brand actually been used for."
    listBrandProjects: builder.query({
      query: (brandId) => ({ url: platformUrl(`/brands/${brandId}/projects`) }),
      providesTags: (_result, _error, brandId) => [{ type: "CreatorBrandProjects", id: brandId }],
    }),

    // ---- Product Library (also on the Plans & Brand tab, scoped to one brand at a time) ----
    // creative-planning-service ProductController -- not versioned (see ProjectRequirementService's
    // phased-plan note: cast doesn't need it, shots regenerate from a reference image instead --
    // products are the same "just edit in place" case, nothing here is drafted/critiqued).
    listProducts: builder.query({
      query: (brandId) => ({ url: platformUrl(`/products?brandId=${brandId}`) }),
      providesTags: (_result, _error, brandId) => [{ type: "CreatorProducts", id: brandId }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: platformUrl(`/products`), method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [{ type: "CreatorProducts", id: body?.brandContextId }],
    }),
    updateProduct: builder.mutation({
      query: ({ productId, ...patch }) => ({ url: platformUrl(`/products/${productId}`), method: "PATCH", body: patch }),
      invalidatesTags: ["CreatorProducts"],
    }),
    listProductReferenceImages: builder.query({
      query: (productId) => ({ url: platformUrl(`/products/${productId}/reference-images`) }),
      providesTags: (_result, _error, productId) => [{ type: "CreatorProductImages", id: productId }],
    }),
    uploadProductReferenceImage: builder.mutation({
      query: ({ productId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: platformUrl(`/products/${productId}/reference-images`), method: "POST", body: formData };
      },
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorProductImages", id: args?.productId }],
    }),

    // creative-planning-service ProjectRequirementController: POST /v1/project-requirements
    // (multipart/form-data: a `data` JSON part shaped like CreateStandaloneRequirementRequest,
    // plus an optional `image` file part) -- Entry B, "no brand exercise, no locked idea, a
    // user fills a brief directly." tenantType is fixed to AI_VIDEO_CREATOR here because this
    // is creator-ui's own solo-creator quick-start flow, not the brand/company console.
    // Priced by duration, not a LEAN/STANDARD/PREMIUM tier: `durationSeconds` is quoted
    // server-side against billing-service's per-second platform rate plus the creator's own
    // margin, and the quote is snapshotted onto the response (quotedTotalPrice/quotedCurrency)
    // -- see getVideoPricingQuote above for the live estimate shown before submitting.
    // `languages` is the set of spoken languages the video should be produced/dubbed in.
    // `brandContext` is optional -- pass it only when the creator filled in at least a brand
    // name; the backend upserts it onto the tenant's one brand row (same row `PUT
    // /v1/brand-context` edits) before saving the requirement. `productDetails` (optional --
    // requires a brand, inline or pre-existing) creates a ProductProfile tagged with this
    // requirement; its images ride along as `productImages`, distinct from
    // `projectReferenceImages` ("what the client has in mind", not the product). `image` is the
    // brief's own reference attachment, stored the same way uploadProjectRequirementAttachment
    // below does. None of the three image sets are analyzed synchronously -- see
    // ReferenceMaterialAnalysisService on the backend, triggered once the brief is funded.
    // NOTE: unlike Entry A (campaign-session -> locked idea -> from-locked-idea), a
    // standalone requirement created this way has no lockedIdeaId, and pre-production-service's
    // only project-creation endpoint (POST /v1/projects/from-locked-idea) requires one -- so
    // today, funding a standalone requirement does not yet produce a pre-production Project.
    // That's a real backend gap, not a frontend omission; this call still does exactly what
    // the real endpoint supports (create the brief + share link) and nothing more.
    createProjectRequirement: builder.mutation({
      query: ({
        briefText,
        targetAudience,
        campaignDirection,
        durationSeconds,
        languages,
        brandId,
        brandContext,
        image,
        productDetails,
        productImages,
        projectReferenceImages,
      }) => {
        const formData = new FormData();
        formData.append(
          "data",
          new Blob(
            [
              JSON.stringify({
                briefText,
                targetAudience: targetAudience || undefined,
                campaignDirection: campaignDirection || undefined,
                durationSeconds,
                languages,
                tenantType: "AI_VIDEO_CREATOR",
                brandId: brandId || undefined,
                brandContext: brandContext?.brandName ? brandContext : undefined,
                productDetails: productDetails?.name ? productDetails : undefined,
              }),
            ],
            { type: "application/json" },
          ),
        );
        if (image) formData.append("image", image);
        (productImages || []).forEach((file) => formData.append("productImages", file));
        (projectReferenceImages || []).forEach((file) => formData.append("projectReferenceImages", file));
        return {
          url: platformUrl("/project-requirements"),
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["CreatorProjectRequirements"],
    }),

    // creative-planning-service ProjectRequirementAttachmentService: POST
    // /v1/project-requirements/{requirementId}/attachments (multipart, single `file` part).
    // For adding/replacing an attachment after the requirement already exists -- creation-time
    // images go through createProjectRequirement's own `image` part instead.
    uploadProjectRequirementAttachment: builder.mutation({
      query: ({ requirementId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: platformUrl(`/project-requirements/${requirementId}/attachments`),
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjectRequirements", id: args?.requirementId || "detail" },
      ],
    }),

    // creative-planning-service PublicProjectRequirementController: GET
    // /v1/public/project-requirements/{shareToken} -- deliberately unauthenticated (no tenant
    // id, no JWT required); returns PublicProjectRequirementView { briefText, targetAudience,
    // campaignDirection, durationSeconds, languages, quotedTotalPrice, quotedCurrency, funded,
    // brand, product, productReferenceImages, projectReferenceImages }. Powers the client-facing
    // brief/funding page.
    getPublicProjectRequirement: builder.query({
      query: (shareToken) => ({ url: platformUrl(`/public/project-requirements/${shareToken}`) }),
      providesTags: (_result, _error, shareToken) => [{ type: "CreatorProjectRequirements", id: shareToken }],
    }),

    // The real "fund this brief" flow: start an order for the exact price already quoted, run
    // Razorpay's own checkout, then verify -- same shape as the client-review lock/pay flow.
    // Lets whoever holds the share link edit the brief and add reference images before paying --
    // multipart so images can ride along with the text edits; `data` is optional (a pure
    // image-only edit posts with no text part).
    updateRequirementFromClient: builder.mutation({
      query: ({ shareToken, briefText, targetAudience, campaignDirection, brand, product, images, productImages, includeVideoShots, videoShotsIntent }) => {
        const formData = new FormData();
        const hasTextEdit = briefText != null || targetAudience != null || campaignDirection != null
          || brand != null || product != null || includeVideoShots != null;
        if (hasTextEdit) {
          formData.append("data", new Blob([JSON.stringify({ briefText, targetAudience, campaignDirection, brand, product, includeVideoShots, videoShotsIntent })], { type: "application/json" }));
        }
        (images || []).forEach((file) => formData.append("images", file));
        (productImages || []).forEach((file) => formData.append("productImages", file));
        return { url: platformUrl(`/public/project-requirements/${shareToken}`), method: "PATCH", body: formData };
      },
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorProjectRequirements", id: args?.shareToken }],
    }),

    // Client-side video upload -- one file at a time (multipart form field name: file). Capped
    // at ~5 MB by the backend; the button reflects that.
    uploadPublicRequirementReferenceVideo: builder.mutation({
      query: ({ shareToken, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: platformUrl(`/public/project-requirements/${shareToken}/reference-videos`), method: "POST", body: formData };
      },
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorProjectRequirements", id: args?.shareToken }],
    }),

    startRequirementPayment: builder.mutation({
      query: (shareToken) => ({ url: platformUrl(`/public/project-requirements/${shareToken}/payment`), method: "POST" }),
    }),
    verifyRequirementPayment: builder.mutation({
      query: ({ shareToken, ...body }) => ({
        url: platformUrl(`/public/project-requirements/${shareToken}/payment/verify`),
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorProjectRequirements", id: args?.shareToken }],
    }),

    // creative-planning-service ProjectRequirementController: GET /v1/project-requirements/{id}
    // -- the tenant-authenticated read (funded, briefText, budgetTier, shareToken, ...) the
    // creator's own brief workspace page polls, as opposed to the public view above.
    getProjectRequirement: builder.query({
      query: (requirementId) => ({ url: platformUrl(`/project-requirements/${requirementId}`) }),
      providesTags: (_result, _error, requirementId) => [{ type: "CreatorProjectRequirements", id: requirementId }],
    }),

    // creative-planning-service ProjectRequirementController: PATCH
    // /v1/project-requirements/{id}/quote -- a creator overriding their own auto-computed quote
    // and/or configuring what percentage of it the client must pay upfront (100 = full payment).
    // Refused once funded (400). Powers the "Project Pricing" panel on the brief workspace page.
    updateProjectRequirementQuote: builder.mutation({
      query: ({ requirementId, totalPrice, requiredPaymentPercent }) => ({
        url: platformUrl(`/project-requirements/${requirementId}/quote`),
        method: "PATCH",
        body: { totalPrice, requiredPaymentPercent },
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorProjectRequirements", id: args?.requirementId }],
    }),

    // creative-planning-service ProjectRequirementController: GET /v1/project-requirements --
    // every brief this tenant has created, newest first (funded or not) -- what HomePage's
    // "Recent projects" list merges alongside pre-production Projects so a brief shows up the
    // moment it's created, and its status flips once the client funds it.
    listProjectRequirements: builder.query({
      query: () => ({ url: platformUrl("/project-requirements") }),
      providesTags: ["CreatorProjectRequirements"],
    }),

    // creative-planning-service ProjectRequirementController: GET
    // /v1/project-requirements/{id}/product -- the inline product created from `productDetails`
    // at creation time (see createProjectRequirement above), or an empty body if none.
    getProjectRequirementProduct: builder.query({
      query: (requirementId) => ({ url: platformUrl(`/project-requirements/${requirementId}/product`) }),
      providesTags: (_result, _error, requirementId) => [{ type: "CreatorProjectRequirements", id: `product-${requirementId}` }],
    }),

    // creative-planning-service ProjectRequirementController: GET
    // /v1/project-requirements/{id}/product/reference-images -- images of the actual product;
    // each ProductReferenceImageView's `analysis` is null until the requirement is funded.
    listProjectRequirementProductImages: builder.query({
      query: (requirementId) => ({ url: platformUrl(`/project-requirements/${requirementId}/product/reference-images`) }),
      providesTags: (_result, _error, requirementId) => [{ type: "CreatorProjectRequirements", id: `product-images-${requirementId}` }],
    }),

    // creative-planning-service ProjectRequirementController: GET
    // /v1/project-requirements/{id}/reference-images -- "what the client has in mind" images,
    // distinct from the product's own images above; `analysis` is likewise null until funded.
    listProjectRequirementReferenceImages: builder.query({
      query: (requirementId) => ({ url: platformUrl(`/project-requirements/${requirementId}/reference-images`) }),
      providesTags: (_result, _error, requirementId) => [{ type: "CreatorProjectRequirements", id: `reference-images-${requirementId}` }],
    }),

    // creative-planning-service ProjectRequirementIdeaService: POST
    // /v1/project-requirements/{id}/ideas/generate -- only valid once funded; returns a fresh,
    // unpersisted batch of IdeaOptionView candidates every call.
    generateProjectRequirementIdeas: builder.mutation({
      query: ({ requirementId, count }) => ({
        url: platformUrl(`/project-requirements/${requirementId}/ideas/generate`),
        method: "POST",
        params: count ? { count } : undefined,
      }),
      // Every option generate() returns is now persisted server-side (source=GENERATED), so a
      // refresh must see the same list -- invalidate the list query rather than holding the
      // result only in component state.
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjectRequirements", id: `ideas-${args?.requirementId || "current"}` },
      ],
    }),

    // creative-planning-service ProjectRequirementIdeaService: GET
    // /v1/project-requirements/{id}/ideas -- every option ever saved for this requirement
    // (GENERATED batches + any EDITED variants), newest first. What a refreshed page reads
    // instead of losing the generated list.
    listProjectRequirementIdeas: builder.query({
      query: (requirementId) => ({ url: platformUrl(`/project-requirements/${requirementId}/ideas`) }),
      providesTags: (_result, _error, requirementId) => [{ type: "CreatorProjectRequirements", id: `ideas-${requirementId}` }],
    }),

    // creative-planning-service ProjectRequirementIdeaService: POST
    // /v1/project-requirements/{id}/ideas/{optionId}/save-edit -- saves an edited variant as a
    // NEW option (source=EDITED, parentId=optionId) rather than overwriting the original.
    saveEditedProjectRequirementIdea: builder.mutation({
      query: ({ requirementId, optionId, ...edited }) => ({
        url: platformUrl(`/project-requirements/${requirementId}/ideas/${optionId}/save-edit`),
        method: "POST",
        body: edited,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjectRequirements", id: `ideas-${args?.requirementId || "current"}` },
      ],
    }),

    // creative-planning-service ProjectRequirementIdeaService: POST
    // /v1/project-requirements/{id}/ideas/lock -- echoes back the chosen IdeaOptionView, creates
    // the real LockedIdea, and synchronously creates the pre-production-service project. This is
    // the funded -> pre-production transition; invalidates the requirement (funded/idea state)
    // and the recent-projects list (a new project now exists).
    lockProjectRequirementIdea: builder.mutation({
      query: ({ requirementId, ...chosenOption }) => ({
        url: platformUrl(`/project-requirements/${requirementId}/ideas/lock`),
        method: "POST",
        body: chosenOption,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorProjectRequirements", id: args?.requirementId || "current" },
        "CreatorHomeProjects",
      ],
    }),

    // creative-planning-service LockedIdeaController: GET /v1/locked-ideas/{id} -- the full
    // idea a project was built from (title, concept, targetAudience, campaignAngle, keyMessage,
    // tone). pre-production-service's own ProjectView only carries lockedIdeaId, not the idea's
    // content, so the project workspace reads it from here separately.
    getLockedIdea: builder.query({
      query: (lockedIdeaId) => ({ url: platformUrl(`/locked-ideas/${lockedIdeaId}`) }),
      providesTags: (_result, _error, lockedIdeaId) => [{ type: "CreatorProjectRequirements", id: `locked-idea-${lockedIdeaId}` }],
    }),

    // pre-production-service ProjectController: GET /v1/projects/{id} -- ProjectView { id, name,
    // lockedIdeaId, budgetTier, status, createdAt }.
    getPreProductionProject: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: projectId }],
    }),

    // pre-production-service ProjectController: PATCH /v1/projects/{id}/status { target }.
    // ProjectStateMachine enforces which transitions are legal -- this call fails with 409 if
    // target isn't reachable from the project's current status. Used to flip a project to
    // VIDEO_GENERATION_COMPLETE once every shot finishes generating.
    advanceProjectStatus: builder.mutation({
      query: ({ projectId, target }) => ({
        url: platformUrl(`/projects/${projectId}/status`),
        method: "PATCH",
        body: { target },
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: args?.projectId }],
    }),

    // Creator control over a project's client reviews: set the included allowance and/or turn
    // reviews on/off on demand. Body: { reviewAllowance?, reviewsEnabled? }.
    updateProjectReviewSettings: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: platformUrl(`/projects/${projectId}/review-settings`),
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: args?.projectId }],
    }),

    // Refreshes this project's chat-embedding context (script/screenplay/cast/shots) so the
    // creator's chat panel has real answers before any client has paid to lock the package --
    // see ProjectLockService#syncChatContext. Safe to call repeatedly (each ingest upserts).
    syncProjectChatContext: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/chat/sync`), method: "POST" }),
    }),

    // pre-production-service ScriptController: GET /v1/projects/{id}/script. 404 until a script
    // has been generated -- callers should treat a 404 error as "no script yet", not a failure.
    getScript: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/script`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `script-${projectId}` }],
    }),

    // pre-production-service ScriptController: PATCH .../script/characters/{characterId} -- only
    // the fields present in the body change; a manual correction/refinement, not a fork (the next
    // regenerate still overwrites this character from scratch).
    updateScriptCharacter: builder.mutation({
      query: ({ projectId, characterId, ...patch }) => ({
        url: platformUrl(`/projects/${projectId}/script/characters/${characterId}`),
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `script-${args?.projectId}` }],
    }),

    // pre-production-service ScriptController: POST /v1/projects/{id}/script/generate
    // { briefText, targetDurationSeconds? } -- no approve gate, calling this again destructively
    // replaces whatever script already exists. There's no separate "regenerate" endpoint; the
    // caller composes a fresh briefText (e.g. from an edited locked idea) and calls this again.
    generateScript: builder.mutation({
      query: ({ projectId, briefText, targetDurationSeconds, productCastProfileIds }) => ({
        url: platformUrl(`/projects/${projectId}/script/generate`),
        method: "POST",
        body: {
          briefText,
          targetDurationSeconds: targetDurationSeconds || undefined,
          productCastProfileIds: productCastProfileIds?.length ? productCastProfileIds : undefined,
        },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `script-${args?.projectId || "current"}` },
        { type: "CreatorHomeProjects", id: `script-versions-${args?.projectId || "current"}` },
      ],
    }),

    // pre-production-service ScriptController -- now versioned like Screenplay: getScript reads
    // the live/current row (unchanged), these read the separate script_version history log.
    listScriptVersions: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/script/versions`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `script-versions-${projectId}` }],
    }),
    getScriptVersion: builder.query({
      query: ({ projectId, version }) => ({ url: platformUrl(`/projects/${projectId}/script/versions/${version}`) }),
      providesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `script-version-${args?.projectId}-${args?.version}` }],
    }),
    // POST .../script/versions/{fromVersion}/edit -- saves a manual script edit as a new EDITED
    // version, no LLM call; also updates the live script row so the edit actually takes effect.
    saveScriptEdit: builder.mutation({
      query: ({ projectId, fromVersion, ...edit }) => ({
        url: platformUrl(`/projects/${projectId}/script/versions/${fromVersion}/edit`),
        method: "POST",
        body: edit,
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `script-${args?.projectId}` },
        { type: "CreatorHomeProjects", id: `script-versions-${args?.projectId}` },
      ],
    }),

    // pre-production-service ScreenplayController -- versioned, unlike Script: generate() always
    // creates a new version rather than overwriting. getScreenplay reads the latest version.
    getScreenplay: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/screenplay`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `screenplay-${projectId}` }],
    }),

    // GET /v1/projects/{id}/screenplay/versions -- every version ever saved, oldest first
    // (scenes omitted per entry -- fetch a specific version for its scenes).
    listScreenplayVersions: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/screenplay/versions`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `screenplay-versions-${projectId}` }],
    }),

    // GET /v1/projects/{id}/screenplay/versions/{version} -- what "previous"/"next version"
    // navigation reads.
    getScreenplayVersion: builder.query({
      query: ({ projectId, version }) => ({ url: platformUrl(`/projects/${projectId}/screenplay/versions/${version}`) }),
      providesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `screenplay-version-${args?.projectId}-${args?.version}` }],
    }),

    generateScreenplay: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/screenplay/generate`), method: "POST" }),
      invalidatesTags: (_result, _error, projectId) => [
        { type: "CreatorHomeProjects", id: `screenplay-${projectId}` },
        { type: "CreatorHomeProjects", id: `screenplay-versions-${projectId}` },
      ],
    }),

    // POST /v1/projects/{id}/screenplay/versions/{fromVersion}/edit -- saves a manual scene edit
    // as a new EDITED version, no LLM call.
    saveScreenplayEdit: builder.mutation({
      query: ({ projectId, fromVersion, scenes }) => ({
        url: platformUrl(`/projects/${projectId}/screenplay/versions/${fromVersion}/edit`),
        method: "POST",
        body: { scenes },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `screenplay-${args?.projectId}` },
        { type: "CreatorHomeProjects", id: `screenplay-versions-${args?.projectId}` },
      ],
    }),

    // pre-production-service CastController -- CastProfile doubles as a real actor (name, age,
    // gender, face image, voice sample to clone) and a product the ad showcases (name,
    // description, product image), distinguished by profileType. projectId omitted fetches the
    // reusable library (project_id IS NULL) plus anything scoped to this project.
    listCastProfiles: builder.query({
      query: ({ projectId, profileType } = {}) => {
        const params = new URLSearchParams();
        if (projectId) params.set("projectId", projectId);
        if (profileType) params.set("profileType", profileType);
        const qs = params.toString();
        return { url: platformUrl(`/cast-profiles${qs ? `?${qs}` : ""}`) };
      },
      providesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-${args?.profileType || "all"}` }],
    }),

    createCastProfile: builder.mutation({
      query: (body) => ({ url: platformUrl("/cast-profiles"), method: "POST", body }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-${args?.profileType || "all"}` },
        { type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-all` },
        { type: "CreatorHomeProjects", id: "cast-profiles-library-all" },
      ],
    }),

    // PUT /v1/cast-profiles/{id}/voice -- attaches (or replaces) a voice sample on a cast profile
    // that already exists, e.g. one created before a sample was ready, or one shared across
    // characters (an actor also voicing the narrator). createCastProfile only ever sets this at
    // creation time; this is the only way to change it afterward.
    updateCastProfileVoice: builder.mutation({
      query: ({ castProfileId, projectId, voiceRefBucket, voiceRefObjectKey }) => ({
        url: platformUrl(`/cast-profiles/${castProfileId}/voice`),
        method: "PUT",
        body: { castProfileId, ...(projectId ? { projectId } : {}), voiceIdentityType: "HUMAN", voiceRefBucket, voiceRefObjectKey },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-${args?.profileType || "all"}` },
        { type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-all` },
        { type: "CreatorHomeProjects", id: "cast-profiles-library-all" },
      ],
    }),

    // PUT /v1/cast-profiles/{id}/voice -- store the provider-qualified identity returned
    // by GET /v1/voices/builtin (providerVoiceId + providerId), rather than an unqualified id.
    selectCastProfileBuiltinVoice: builder.mutation({
      query: ({ castProfileId, projectId, clonedVoiceId, providerId }) => ({
        url: platformUrl(`/cast-profiles/${castProfileId}/voice`),
        method: "PUT",
        body: {
          castProfileId,
          ...(projectId ? { projectId } : {}),
          voiceIdentityType: "AI",
          clonedVoiceId,
          providerId,
        },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-${args?.profileType || "all"}` },
        { type: "CreatorHomeProjects", id: `cast-profiles-${args?.projectId || "library"}-all` },
        { type: "CreatorHomeProjects", id: "cast-profiles-library-all" },
      ],
    }),

    // POST /v1/cast-profiles/media (multipart) -- uploads a raw face image or voice sample to
    // MinIO and hands back {bucket, objectKey}, which the caller then feeds into
    // createCastProfile's faceRef/voiceRef fields.
    uploadCastMedia: builder.mutation({
      query: ({ kind, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: platformUrl(`/cast-profiles/media?kind=${kind}`), method: "POST", body: formData };
      },
    }),

    listCastAssignments: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/cast-assignments`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `cast-assignments-${projectId}` }],
    }),

    // GET /v1/projects/{projectId}/speaking-characters -- every characterKey with at least one
    // dialogue beat anywhere in the project, the same ground truth video-generation-service
    // resolves a voice for at dispatch time. Backs the Cast tab's "needs a voice" marker.
    listSpeakingCharacters: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/speaking-characters`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `speaking-characters-${projectId}` }],
    }),

    createCastAssignment: builder.mutation({
      query: ({ projectId, scriptCharacterId, castProfileId, wardrobeNote, performanceDirection }) => ({
        url: platformUrl(`/projects/${projectId}/cast-assignments`),
        method: "POST",
        body: { scriptCharacterId, castProfileId, wardrobeNote, performanceDirection },
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `cast-assignments-${args?.projectId}` },
      ],
    }),

    // pre-production-service ShotListController.generateList -- ASYNC submit. Returns HTTP 202
    // with {jobId, projectId, status:PENDING, createdAt} immediately. The Gemini call runs on
    // llm-gateway's Kafka worker (see the backend ShotListGenerationJobService); the shot rows
    // themselves are written when the completion event lands. The caller must poll
    // getPreProductionShotListJob until status flips to SUCCEEDED (then listPreProductionShots
    // will return the new list) or FAILED (surface the errorMessage). Regenerating an existing
    // list still destructively replaces it -- same as before, just now under the async flow.
    generatePreProductionShotList: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots/generate-list`), method: "POST" }),
    }),

    // Status endpoint for one submitted shot-list job. Poll with `pollingInterval` and stop
    // (via `skip`) once status is SUCCEEDED or FAILED. On SUCCEEDED the caller should invalidate
    // { type: "CreatorHomeProjects", id: `shots-${projectId}` } so listPreProductionShots refetches.
    getPreProductionShotListJob: builder.query({
      query: ({ projectId, jobId }) => ({
        url: platformUrl(`/projects/${projectId}/shots/generate-list/${jobId}`),
      }),
      providesTags: (_result, _error, { projectId, jobId }) => [
        { type: "CreatorHomeProjects", id: `shot-list-job-${projectId}-${jobId}` },
      ],
    }),

    // Latest shot-list job for this project (any status), fetched on mount so a page reload after
    // a FAILED run rehydrates the persistent failure banner + retry affordance instead of showing
    // the same empty-shot-list panel a fresh project shows. Returns undefined when the backend
    // sends 204 (no job ever submitted).
    getLatestPreProductionShotListJob: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots/latest-list-job`) }),
      providesTags: (_result, _error, projectId) => [
        { type: "CreatorHomeProjects", id: `shot-list-latest-job-${projectId}` },
      ],
    }),

    listPreProductionShots: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `shots-${projectId}` }],
    }),

    // Manually insert one shot into an existing screenplay scene -- pre-production-service's
    // ShotListController.createShot. Does NOT survive "Regenerate shot list" (that wipes and
    // rebuilds every shot from the screenplay), same caveat as any hand-edit to an AI shot.
    createPreProductionShot: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: platformUrl(`/projects/${projectId}/shots`),
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `shots-${args?.projectId}` }],
    }),

    // Hand-edit the shot's plan (script line, duration, action, voice-over, emotion, location,
    // time of day, lighting mood, camera size/angle/movement/note, text overlay, sound design,
    // editing notes) -- pre-production-service's ShotListController.updateShot. Every field on
    // the request is PATCH-optional; a non-null (including empty-string, to clear a free-text
    // field) is applied and every other column on the shot is left untouched.
    updatePreProductionShot: builder.mutation({
      query: ({ projectId, shotId, ...body }) => ({
        url: platformUrl(`/shots/${shotId}`),
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `shots-${args?.projectId}` }],
    }),

    // pre-production-service ShotImageController -- one row per (shot, kind); kind is one of
    // STORYBOARD/PRODUCTION/LIGHTING/CAMERA_PLAN/MOTION_GRAPHIC.
    generatePreProductionShotImage: builder.mutation({
      query: ({ shotId, kind }) => ({ url: platformUrl(`/shots/${shotId}/images/${kind}`), method: "POST" }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `shot-images-${args?.shotId}` },
        { type: "CreatorHomeProjects", id: "shot-asset-completion" },
      ],
    }),

    // "Inspired" upload flow -- POST /v1/shots/{shotId}/images/{kind}/inspiration -- attaches one
    // or more reference photos as edit inputs for the next Gemini call, keeps the plan's own
    // context in the prompt. mode="inspired" in ShotImagesPanel's upload dialog.
    generatePreProductionShotImageWithInspiration: builder.mutation({
      query: ({ shotId, kind, note, files }) => {
        const formData = new FormData();
        if (note) formData.append("note", note);
        (files || []).forEach((f) => formData.append("files", f));
        return { url: platformUrl(`/shots/${shotId}/images/${kind}/inspiration`), method: "POST", body: formData };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `shot-images-${args?.shotId}` },
        { type: "CreatorHomeProjects", id: "shot-asset-completion" },
      ],
    }),

    // "Same" upload flow -- POST /v1/shots/{shotId}/images/{kind}/replace -- uploaded bytes ARE
    // the new image, no LLM call. For hand-corrected images (e.g. Gemini's text rendering was
    // wrong so creator fixed it in Photoshop and wants THIS exact image saved). mode="same" in
    // ShotImagesPanel's upload dialog.
    replacePreProductionShotImage: builder.mutation({
      query: ({ shotId, kind, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: platformUrl(`/shots/${shotId}/images/${kind}/replace`), method: "POST", body: formData };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `shot-images-${args?.shotId}` },
        { type: "CreatorHomeProjects", id: "shot-asset-completion" },
      ],
    }),

    listPreProductionShotImages: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/images`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `shot-images-${shotId}` }],
    }),

    // Backfill for images generated before the vision-analysis-on-generate change shipped -- those
    // rows have on_screen_text NULL forever otherwise, so the per-image Download affordance never
    // shows on text-bearing PRODUCTION frames. Fired lazily per tile by ShotImagesPanel when it
    // sees a null onScreenText; server just re-runs the same describe() the generate/replace paths
    // already do, applied to the stored bytes.
    reanalyzePreProductionShotImage: builder.mutation({
      query: ({ shotId, kind }) => ({ url: platformUrl(`/shots/${shotId}/images/${kind}/reanalyze`), method: "POST" }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `shot-images-${args?.shotId}` },
      ],
    }),

    // Proactive project-wide legacy backfill: walks every shot_image whose on_screen_text is
    // still NULL and runs the vision-analysis on each in one shot -- fired once per project per
    // session on ShotsSection mount so the creator doesn't have to open every tile individually
    // to unlock its Download button.
    reanalyzePreProductionShotImagesForProject: builder.mutation({
      query: (projectId) => ({
        url: platformUrl(`/projects/${projectId}/shot-images/reanalyze-missing`),
        method: "POST",
      }),
    }),

    // pre-production-service ShotAssetBatchController -- the single "Generate all shot assets"
    // CTA that replaces clicking a lighting-plan/camera-plan/4-image button separately per shot
    // (confirmed: 10 shots x ~7 buttons each is genuinely ~70 CTAs on one page). Runs one step at
    // a time on the backend's own single scheduled worker (ShotAssetBatchWorker), not something
    // this request waits on -- start() returns immediately with a jobId, poll status() for
    // progress. Idempotent: starting again while one is already running just returns that job.
    startShotAssetBatch: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots/generate-all-assets`), method: "POST" }),
    }),
    getShotAssetBatchStatus: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots/generate-all-assets/status`) }),
    }),

    // Per-shot "does this shot have every asset it needs" (lighting plan, camera plan, all 4
    // images) -- ground truth (does the row exist), not batch/dead-letter bookkeeping, so it
    // reflects a shot fixed via any path: batch, manual regenerate, or a dead-letter retry.
    // Drives the shots list's per-shot green check.
    listShotAssetCompletion: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots/generate-all-assets/completion`) }),
      // One fixed tag, not per-project -- the mutations that can affect completion (lighting/
      // camera plan generate, shot-image generate, dead-letter retry) only carry a shotId, not a
      // projectId, so a per-project tag couldn't be invalidated from them. Refetching this list
      // for whichever project happens to be open is negligible cost either way.
      providesTags: [{ type: "CreatorHomeProjects", id: "shot-asset-completion" }],
    }),

    // Steps that failed 3 consecutive automatic attempts during a run -- never retried
    // automatically (see ShotAssetBatchWorker's own reasoning), only via this explicit action.
    listShotAssetDeadLetters: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shots/generate-all-assets/dead-letters`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `shot-asset-dead-letters-${projectId}` }],
    }),
    retryShotAssetDeadLetter: builder.mutation({
      query: ({ projectId, deadLetterId }) => ({
        url: platformUrl(`/projects/${projectId}/shots/generate-all-assets/dead-letters/${deadLetterId}/retry`),
        method: "POST",
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `shot-asset-dead-letters-${args?.projectId}` },
        { type: "CreatorHomeProjects", id: "shot-asset-completion" },
      ],
    }),

    // pre-production-service GenerationThoughtController -- append-only running commentary of
    // this shot's own dispatch pipeline (context assembly, pre-flight critique, video-generation
    // hand-off), logged by ShotContextAssemblyService/ShotImageService as each step actually runs.
    // Not polled/live -- refetched on demand (see ShotThoughtLog's own refetch-on-open) since a
    // shot's dispatch is a single request/response cycle, not a long-running background job.
    listShotThoughts: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/thoughts`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `shot-thoughts-${shotId}` }],
    }),

    // pre-production-service ShotProductReferenceController -- analyze (vision call, nothing
    // persisted) then confirm (upsert, one reference per shot). Distinct names from the older
    // creator-service analyzeShotProductReference/confirmShotProductReference endpoints already
    // defined above (scriptId/shotNumber-keyed, different backend entirely) -- reusing those keys
    // would silently overwrite them since this is all one injectEndpoints object literal.
    analyzePreProductionShotProductReference: builder.mutation({
      query: ({ shotId, classification, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: platformUrl(`/shots/${shotId}/product-reference/analyze?classification=${classification}`), method: "POST", body: formData };
      },
    }),

    confirmPreProductionShotProductReference: builder.mutation({
      query: ({ shotId, ...body }) => ({
        url: platformUrl(`/shots/${shotId}/product-reference/confirm`),
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `shot-product-reference-${args?.shotId}` }],
    }),

    getPreProductionShotProductReference: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/product-reference`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `shot-product-reference-${shotId}` }],
    }),

    // creative-planning-service ProjectIdeaController -- idea versioning for an already-created
    // project (distinct from listProjectRequirementIdeas, which is the pre-project-creation
    // funding-brief flow). Path is /v1/project-ideas, not /v1/projects/..., to avoid colliding
    // with pre-production-service's own /v1/projects prefix at the gateway.
    listProjectIdeaOptions: builder.query({
      query: (projectId) => ({ url: platformUrl(`/project-ideas/${projectId}`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `project-idea-options-${projectId}` }],
    }),

    generateProjectIdeaOptions: builder.mutation({
      query: ({ projectId, count }) => ({
        url: platformUrl(`/project-ideas/${projectId}/generate`),
        method: "POST",
        params: count ? { count } : undefined,
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `project-idea-options-${args?.projectId}` }],
    }),

    selectProjectIdeaOption: builder.mutation({
      query: ({ projectId, ideaOptionId }) => ({
        url: platformUrl(`/project-ideas/${projectId}/${ideaOptionId}/select`),
        method: "POST",
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `project-idea-options-${args?.projectId}` },
        // Refetches getPreProductionProject, which is what tells the frontend the NEW
        // lockedIdeaId -- getLockedIdea is keyed by that id, so it naturally refetches once this
        // resolves to a different value, no separate invalidation needed for it.
        { type: "CreatorHomeProjects", id: args?.projectId },
      ],
    }),

    // pre-production-service ShotDialogueBeatController -- a "beat" is a dialogue timestamp
    // (which second a line starts, how long it runs) within a shot; video-generation-service uses
    // these to turn off the video model's native audio and dub in a beat-matched cloned voice
    // instead, rather than trusting the model's own audio synthesis.
    listShotDialogueBeats: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/dialogue-beats`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `dialogue-beats-${shotId}` }],
    }),

    createShotDialogueBeat: builder.mutation({
      query: ({ shotId, projectId, ...body }) => ({ url: platformUrl(`/shots/${shotId}/dialogue-beats`), method: "POST", body }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `dialogue-beats-${args?.shotId}` },
        { type: "CreatorHomeProjects", id: `speaking-characters-${args?.projectId}` },
      ],
    }),

    updateShotDialogueBeat: builder.mutation({
      query: ({ shotId, beatId, projectId, ...body }) => ({ url: platformUrl(`/shots/${shotId}/dialogue-beats/${beatId}`), method: "PUT", body }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `dialogue-beats-${args?.shotId}` },
        { type: "CreatorHomeProjects", id: `speaking-characters-${args?.projectId}` },
        { type: "CreatorHomeProjects", id: `clone-audio-${args?.projectId}` },
      ],
    }),

    deleteShotDialogueBeat: builder.mutation({
      query: ({ shotId, beatId }) => ({ url: platformUrl(`/shots/${shotId}/dialogue-beats/${beatId}`), method: "DELETE" }),
      invalidatesTags: (_result, _error, args) => [
        { type: "CreatorHomeProjects", id: `dialogue-beats-${args?.shotId}` },
        { type: "CreatorHomeProjects", id: `speaking-characters-${args?.projectId}` },
        { type: "CreatorHomeProjects", id: `clone-audio-${args?.projectId}` },
      ],
    }),

    // pre-production-service ProjectController -- idempotent, returns the existing token if one
    // was already generated.
    ensureClientReviewLink: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/client-review-link`), method: "POST" }),
    }),

    // pre-production-service ChangeRequestController -- pending suggestions logged by the
    // client's chat (via chat-service's SUGGEST_PRE_PRODUCTION_CHANGE action), reviewed here.
    listChangeRequests: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/change-requests`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `change-requests-${projectId}` }],
    }),

    // `files` (optional) is the "attach a reference photo -- e.g. from Pinterest -- and apply"
    // flow (SHOT_IMAGE only, see ChangeRequestService#apply(..., files)): pre-production-service
    // analyzes each attached photo's cinematic technique and edits the shot's current image using
    // both the technique and the current image as visual references.
    applyChangeRequest: builder.mutation({
      query: ({ projectId, changeRequestId, files }) => {
        if (files?.length) {
          const formData = new FormData();
          files.forEach((file) => formData.append("files", file));
          return { url: platformUrl(`/projects/${projectId}/change-requests/${changeRequestId}/apply`), method: "POST", body: formData };
        }
        return { url: platformUrl(`/projects/${projectId}/change-requests/${changeRequestId}/apply`), method: "POST" };
      },
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `change-requests-${args?.projectId}` }],
    }),

    dismissChangeRequest: builder.mutation({
      query: ({ projectId, changeRequestId }) => ({
        url: platformUrl(`/projects/${projectId}/change-requests/${changeRequestId}/dismiss`),
        method: "POST",
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `change-requests-${args?.projectId}` }],
    }),

    // chat-service ChatSessionController -- fully authenticated (JWT, own tenant), same session
    // model the client's public review chat uses (scopeType PRE_PRODUCTION_PROJECT / scopeId
    // projectId), so the same SUGGEST_PRE_PRODUCTION_CHANGE action fires and lands in the
    // ChangeRequest list above. A distinct title keeps this session apart from the client's
    // "Client review chat" one even though both are scoped to the same project.
    listChatSessions: builder.query({
      query: () => ({ url: platformUrl(`/chat-sessions`) }),
      providesTags: ["ChatSessions"],
    }),

    createChatSession: builder.mutation({
      query: ({ scopeType, scopeId, title }) => ({
        url: platformUrl(`/chat-sessions`),
        method: "POST",
        body: { scopeType, scopeId, title },
      }),
      invalidatesTags: ["ChatSessions"],
    }),

    sendChatMessage: builder.mutation({
      query: ({ sessionId, content }) => ({
        url: platformUrl(`/chat-sessions/${sessionId}/messages`),
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "ChatMessages", id: args?.sessionId }],
    }),

    getChatMessages: builder.query({
      query: (sessionId) => ({ url: platformUrl(`/chat-sessions/${sessionId}/messages`) }),
      providesTags: (_result, _error, sessionId) => [{ type: "ChatMessages", id: sessionId }],
    }),

    // pre-production-service PublicProjectController -- deliberately unauthenticated (see that
    // controller's javadoc), reached via /review/:token in App.jsx, not the normal authenticated
    // shell. The client's full locked package plus, once locked, the chat box.
    getPublicProject: builder.query({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}`) }),
      providesTags: (_result, _error, token) => [{ type: "CreatorHomeProjects", id: `public-project-${token}` }],
    }),

    // Lazy-loaded brief summary for the client-review page's "Brief" section. Backend is
    // creative-planning-service's /v1/public/locked-ideas/{id}/brief; it resolves the requirement
    // internally so the client doesn't need to know the requirement's share token to see the
    // brief content they submitted. Returns 404 when the locked idea came from a chat session --
    // handled by the caller as "no brief attached".
    getPublicBriefByLockedIdea: builder.query({
      query: (lockedIdeaId) => ({ url: platformUrl(`/public/locked-ideas/${lockedIdeaId}/brief`) }),
      providesTags: (_result, _error, lockedIdeaId) => [{ type: "CreatorHomeProjects", id: `public-brief-${lockedIdeaId}` }],
    }),

    // The pay-to-lock flow (the bare /lock route was removed -- a client must pay to lock):
    // quote (show the price) -> payment (create Razorpay order) -> verify (verify signature,
    // credit the creator, then lock). Same token-scoped public surface.
    getLockQuote: builder.mutation({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/lock/quote`), method: "POST" }),
    }),
    startLockPayment: builder.mutation({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/lock/payment`), method: "POST" }),
    }),
    verifyLockPayment: builder.mutation({
      query: ({ token, ...body }) => ({ url: platformUrl(`/public/projects/${token}/lock/verify`), method: "POST", body }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `public-project-${args?.token}` }],
    }),

    sendPublicProjectChatMessage: builder.mutation({
      query: ({ token, content }) => ({ url: platformUrl(`/public/projects/${token}/chat`), method: "POST", body: { content } }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `review-status-${args?.token}` }],
    }),

    getPublicProjectChatHistory: builder.query({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/chat`) }),
    }),

    // The review comment feed: a comment plus an optional reference image, left while a review
    // is open. Multipart so the image rides along with the comment text in one request.
    addPublicReviewComment: builder.mutation({
      query: ({ token, content, image }) => {
        const formData = new FormData();
        formData.append("content", content);
        if (image) formData.append("image", image);
        return { url: platformUrl(`/public/projects/${token}/review-comments`), method: "POST", body: formData };
      },
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `review-comments-${args?.token}` }],
    }),
    getPublicReviewComments: builder.query({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/review-comments`) }),
      providesTags: (_result, _error, token) => [{ type: "CreatorHomeProjects", id: `review-comments-${token}` }],
    }),

    // Creator-authenticated side of the same feed -- what ProjectPage reads/resolves.
    listProjectReviewComments: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/review-comments`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `creator-review-comments-${projectId}` }],
    }),
    resolveProjectReviewComment: builder.mutation({
      query: ({ projectId, commentId }) => ({
        url: platformUrl(`/projects/${projectId}/review-comments/${commentId}/resolve`),
        method: "POST",
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `creator-review-comments-${args?.projectId}` }],
    }),

    // ---- Transactional client reviews (open -> batch changes via chat -> close/apply) ----
    // ReviewStatus: { allowance, used, openReviewId, paymentRequiredToStart }.
    getReviewStatus: builder.query({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/reviews/status`) }),
      providesTags: (_result, _error, token) => [{ type: "CreatorHomeProjects", id: `review-status-${token}` }],
    }),
    startReview: builder.mutation({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/reviews/start`), method: "POST" }),
      invalidatesTags: (_result, _error, token) => [{ type: "CreatorHomeProjects", id: `review-status-${token}` }],
    }),
    endReview: builder.mutation({
      query: ({ token, satisfied }) => ({ url: platformUrl(`/public/projects/${token}/reviews/end`), method: "POST", body: { satisfied: !!satisfied } }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `review-status-${args?.token}` }],
    }),
    getReviewPaymentQuote: builder.mutation({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/reviews/payment/quote`), method: "POST" }),
    }),
    startReviewPayment: builder.mutation({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/reviews/payment`), method: "POST" }),
    }),
    verifyReviewPayment: builder.mutation({
      query: ({ token, ...body }) => ({ url: platformUrl(`/public/projects/${token}/reviews/verify`), method: "POST", body }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `review-status-${args?.token}` }],
    }),

    // llm-gateway GET /v1/models -- real master data (model_master), not a hardcoded list. Used
    // here to show which providers/models can actually clone a voice (fal.ai MiniMax,
    // ElevenLabs) rather than a UI-only guess at what's available.
    listCloningModels: builder.query({
      query: () => ({ url: platformUrl("/models?type=voice_clone") }),
    }),

    // llm-gateway GET /v1/voices/builtin -- stock ElevenLabs voices for a cast profile with no
    // recorded sample to clone (see CastProfile.builtinVoiceId). gender/language are optional
    // server-side filters; the caller still decides what to do with an empty/mismatched result.
    listBuiltinVoices: builder.query({
      query: ({ gender, language } = {}) => {
        const params = new URLSearchParams();
        if (gender) params.set("gender", gender);
        if (language) params.set("language", language);
        const qs = params.toString();
        return { url: platformUrl(`/voices/builtin${qs ? `?${qs}` : ""}`) };
      },
    }),

    // video-generation-service POST /v1/clone -- given a shot, resolves the primary
    // character's cast identity and returns a short audio sample rendered with the real voice
    // identity (cloned from the actor's uploaded sample, or direct TTS with the built-in voice
    // pick). Same clone-then-TTS vs direct-TTS routing BeatDubbingService uses at dispatch time,
    // just against a caller-supplied line instead of a persisted DialogueBeat.
    getClonedVoiceAudio: builder.query({
      query: (projectId) => ({ url: platformUrl(`/clone/projects/${projectId}/audio`) }),
      providesTags: (_result, _error, projectId) => [
        { type: "CreatorHomeProjects", id: `clone-audio-${projectId}` },
      ],
    }),

    testShotVoice: builder.mutation({
      query: ({ projectId, shotId, text }) => ({
        url: platformUrl("/clone"),
        method: "POST",
        body: { projectId, shotId, text },
      }),
      invalidatesTags: (_result, _error, { shotId, projectId }) => [
        { type: "CreatorHomeProjects", id: `dialogue-beats-${shotId}` },
        { type: "CreatorHomeProjects", id: `clone-audio-${projectId}` },
        // A fresh take is what turns the fit report's estimate back into a measurement -- without
        // this the panel goes on showing the estimate it fell back to when the line changed.
        { type: "CreatorHomeProjects", id: `dialogue-fit-${projectId}` },
      ],
    }),

    // video-generation-service POST /v1/clone/project -- prepares voice clones for every
    // dialogue-bearing shot in the project, using the same cast identity resolution as
    // testShotVoice without requiring the frontend to issue a request per shot.
    cloneProjectVoices: builder.mutation({
      query: ({ projectId }) => ({
        url: platformUrl("/clone/project"),
        method: "POST",
        body: { projectId },
      }),
      invalidatesTags: (result, _error, { projectId }) => [
        { type: "CreatorHomeProjects", id: `clone-audio-${projectId}` },
        ...[...new Set((result || []).map((voice) => voice.shotId))].map((shotId) => (
          { type: "CreatorHomeProjects", id: `dialogue-beats-${shotId}` }
        )),
      ],
    }),

    // llm-gateway POST /v1/voices/sync -- one-shot admin refresh that queries the tenant's actual
    // ElevenLabs account, pulls in voices ElevenLabs itself verifies for Hindi (not the premade
    // English voices trained to speak Hindi with an English accent), and updates builtin_voice +
    // builtin_voice_language accordingly. Fixes the "same English voice for hi-IN/hi-Latn-IN"
    // symptom by giving the built-in voice picker real Hindi-native options to filter into.
    syncBuiltinVoices: builder.mutation({
      query: () => ({ url: platformUrl("/voices/sync"), method: "POST" }),
    }),

    // llm-gateway GET /v1/models -- real master data (model_master, type=tts), not a hardcoded
    // constant. Which model actually speaks beat-dubbed dialogue (project's preferredTtsModel).
    listTtsModels: builder.query({
      query: () => ({ url: platformUrl("/models?type=tts") }),
    }),

    // pre-production-service ShotBackgroundMusicController -- on-demand only (never part of the
    // automatic dispatch pipeline), generated from the shot's already-planned ambient_bed sound
    // design via ElevenLabs' real music-composition model.
    getShotBackgroundMusic: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/background-music`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `shot-bg-music-${shotId}` }],
    }),

    generateShotBackgroundMusic: builder.mutation({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/background-music`), method: "POST" }),
      invalidatesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `shot-bg-music-${shotId}` }],
    }),

    // pre-production-service ShotContextAssemblyService -- assembles ShotContext, runs the
    // mandatory pre-flight critique, then hands off to video-generation-service.
    // autoApprove=false gets the model recommendation/prompt/cost back without spending anything;
    // autoApprove=true generates immediately (blocks until done or failed).
    dispatchShot: builder.mutation({
      query: ({ shotId, autoApprove, dialogue, captions }) => ({
        url: platformUrl(`/shots/${shotId}/generate`),
        method: "POST",
        body: { autoApprove, dialogue, captions },
      }),
    }),

    // Master/reference data (see SuggestionTargetType's javadoc for why these are real tables,
    // not hardcoded frontend string literals) -- shot types, video feature flags, aspect ratios.
    listShotTypes: builder.query({
      query: () => ({ url: platformUrl(`/shot-types`) }),
    }),

    listVideoFeatureFlags: builder.query({
      query: () => ({ url: platformUrl(`/video-feature-flags`) }),
    }),

    listAspectRatios: builder.query({
      query: () => ({ url: platformUrl(`/aspect-ratios`) }),
    }),

    // pre-production-service MasterDataController -- live proxy of llm-gateway's own language
    // master data (which languages a voice-clone/TTS model actually supports), not a local copy.
    listDialogueLanguages: builder.query({
      query: () => ({ url: platformUrl(`/dialogue-languages`) }),
    }),

    // pre-production-service GET /v1/genders -- MALE/FEMALE, matches llm-gateway's
    // builtin_voice.gender vocabulary since that's the concrete downstream consumer. See V55.
    listGenders: builder.query({
      query: () => ({ url: platformUrl(`/genders`) }),
    }),

    // pre-production-service ProjectConfigController -- aspect ratio / target duration / motion-
    // graphics preference, set once and read by script/shot-list/video generation from then on.
    getProjectConfig: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/config`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `project-config-${projectId}` }],
    }),

    updateProjectConfig: builder.mutation({
      query: ({ projectId, ...body }) => ({ url: platformUrl(`/projects/${projectId}/config`), method: "PUT", body }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `project-config-${args?.projectId}` }],
    }),

    // pre-production-service MotionGraphicPlanController -- MOTION_GRAPHIC shots are planned,
    // never dispatched to video-generation-service (no motion-graphics rendering engine exists).
    generateMotionGraphicPlan: builder.mutation({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/motion-graphic-plan/generate`), method: "POST" }),
      invalidatesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `motion-graphic-plan-${shotId}` }],
    }),

    getMotionGraphicPlan: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/motion-graphic-plan`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `motion-graphic-plan-${shotId}` }],
    }),

    // pre-production-service ContinuityBibleController -- deterministically recomputed whenever
    // the shot list regenerates, not a separate generate action from the frontend.
    getContinuityBible: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/continuity-bible`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `continuity-bible-${projectId}` }],
    }),

    // pre-production-service LightingPlanController/CameraPlanController -- structured plans that
    // feed the LIGHTING/CAMERA_PLAN shot image prompts.
    generateLightingPlan: builder.mutation({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/lighting-plan/generate`), method: "POST" }),
      invalidatesTags: (_result, _error, shotId) => [
        { type: "CreatorHomeProjects", id: `lighting-plan-${shotId}` },
        { type: "CreatorHomeProjects", id: "shot-asset-completion" },
      ],
    }),

    getLightingPlan: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/lighting-plan`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `lighting-plan-${shotId}` }],
    }),

    generateCameraPlan: builder.mutation({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/camera-plan/generate`), method: "POST" }),
      invalidatesTags: (_result, _error, shotId) => [
        { type: "CreatorHomeProjects", id: `camera-plan-${shotId}` },
        { type: "CreatorHomeProjects", id: "shot-asset-completion" },
      ],
    }),

    getCameraPlan: builder.query({
      query: (shotId) => ({ url: platformUrl(`/shots/${shotId}/camera-plan`) }),
      providesTags: (_result, _error, shotId) => [{ type: "CreatorHomeProjects", id: `camera-plan-${shotId}` }],
    }),

    // Manual correction, no LLM call -- source flips to EDITED. Both plans now also auto-generate
    // (with a critique retry) right after shot-list generation, same as MotionGraphicPlan; these
    // "Plan"/"Replan" actions are the fallback for whatever that pass missed, or a revision after
    // editing the shot itself.
    saveLightingPlanEdit: builder.mutation({
      query: ({ shotId, ...patch }) => ({ url: platformUrl(`/shots/${shotId}/lighting-plan`), method: "PATCH", body: patch }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `lighting-plan-${args?.shotId}` }],
    }),
    saveCameraPlanEdit: builder.mutation({
      query: ({ shotId, ...patch }) => ({ url: platformUrl(`/shots/${shotId}/camera-plan`), method: "PATCH", body: patch }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `camera-plan-${args?.shotId}` }],
    }),

    // pre-production-service ShotPlanIssueController -- deterministic (no LLM) findings,
    // recomputed whenever the shot list regenerates, informational only.
    listShotPlanIssues: builder.query({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/shot-plan-issues`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `shot-plan-issues-${projectId}` }],
    }),

    // video-generation-service, called DIRECTLY (not proxied through pre-production-service) --
    // its own JWT-authenticated /v1/prompts and /v1/jobs surface. NOTE: /v1/projects and
    // /v1/shots are claimed by BOTH pre-production-service and video-generation-service in
    // infra-platform's gateway apiPaths config, so only /v1/prompts/{id} and /v1/jobs/{id}/...
    // (uniquely video-generation-service's) are safe to call this way -- deliberately not calling
    // GET /v1/projects/{id}/jobs for that reason; per-shot polling via promptId covers the same need.
    getVideoGenPrompt: builder.query({
      query: (promptId) => ({ url: platformUrl(`/prompts/${promptId}`) }),
    }),

    // What actually happened to a job, lastError included. approve() blocks for the length of a
    // render, so a request can easily end before the shot does -- and the render carries on. This
    // is how to find out, instead of approving again and paying for the same shot twice.
    getVideoGenJob: builder.query({
      query: (jobId) => ({ url: platformUrl(`/jobs/${jobId}`) }),
    }),

    // acceptDialogueOverrun: generate even though the shot's line cannot be said in ANY clip this
    // model produces, so it will be cut off mid-word. The backend refuses without it, deliberately:
    // the alternative is a render that is paid for and then unusable. Only send it from the
    // "generate it cut off anyway" action, where the creator has read the numbers and both remedies.
    approveVideoGenJob: builder.mutation({
      query: (arg) => {
        const { jobId, acceptDialogueOverrun } = typeof arg === "object" && arg !== null ? arg : { jobId: arg };
        return {
          url: platformUrl(`/jobs/${jobId}/approve`),
          method: "POST",
          params: acceptDialogueOverrun ? { acceptDialogueOverrun: true } : undefined,
        };
      },
      // Invalidated on failure as well as success, and that is the point. Approve renders
      // synchronously and holds the connection for minutes; when the answer is lost -- a gateway
      // timeout, a dropped connection, a closed tab -- the render carries on and finishes, and
      // without this the page never asks again. The shot then looks ungenerated while its clip sits
      // finished in storage, which is how a shot gets generated, and paid for, twice.
      //
      // It also replaces the URL the response carried. That one is the job's STORED outputUri --
      // the provider's own link, which expires -- whereas the listing re-signs from MinIO on every
      // read. Taking the fresh one means a finished shot plays instead of showing an empty frame.
      invalidatesTags: (_result, _error, arg) => {
        const projectId = typeof arg === "object" && arg !== null ? arg.projectId : undefined;
        return projectId ? [{ type: "CreatorHomeProjects", id: `shot-videos-${projectId}` }] : [];
      },
    }),

    rejectVideoGenJob: builder.mutation({
      query: ({ jobId, reason }) => ({ url: platformUrl(`/jobs/${jobId}/reject`), method: "POST", body: reason ? { reason } : undefined }),
    }),

    cancelVideoGenJob: builder.mutation({
      query: (jobId) => ({ url: platformUrl(`/jobs/${jobId}/cancel`), method: "POST" }),
    }),

    // video-generation-service PrepareSceneController -- two-stage prepare-scene flow. Stage 1
    // (project prepare) pulls project-level material from pre-production-service and saves a
    // ProjectScenePreparation row. Stage 2 (shot prepare) pulls per-shot material + UI overrides,
    // assembles the ShotContext, and saves a ShotPrompt (shipped=false) the user reviews before
    // dispatch. Dispatch is unchanged: existing approveVideoGenJob on the returned job id.
    // Endpoints live under /v1/scenes -- deliberately not /v1/projects or /v1/shots (both
    // claimed by pre-production-service too, per the getVideoGenPrompt comment above).
    prepareProjectScene: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/scenes/projects/${projectId}/prepare`), method: "POST" }),
      invalidatesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `scene-prep-${projectId}` }],
    }),

    getProjectScenePreparation: builder.query({
      query: (projectId) => ({ url: platformUrl(`/scenes/projects/${projectId}/preparation`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `scene-prep-${projectId}` }],
    }),

    prepareShotScene: builder.mutation({
      query: ({ projectId, shotId, ...overrides }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/prepare`),
        method: "POST",
        body: overrides,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "CreatorHomeProjects", id: `shot-prompts-${projectId}` },
      ],
    }),

    // Bulk shot-prepare. Sequential inside video-gen, one HTTP call from the UI so the DB
    // pool never sees N-way parallel prepare traffic (the failure mode this replaces --
    // per-shot fan-out was exhausting Hikari and timing out mid-batch). Response includes
    // every prepared prompt inline so the UI can render editable rows without a follow-up
    // per-shot GET; per-shot failures come back in `failed` rather than aborting the batch.
    //
    // An empty/omitted shotIds means "every shot in the project" -- the server expands it from the
    // prepare bundle it already fetched, so the UI doesn't enumerate ids just to hand them back.
    // The remaining fields are the project-wide prepare choices (dialogue/captions flags, pinned
    // video model, resolution) and apply to every shot in the batch.
    prepareShotScenesBatch: builder.mutation({
      query: ({ projectId, shotIds, featureFlagOverrides, modelPin, resolutionOverride }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/prepare-batch`),
        method: "POST",
        body: { shotIds, featureFlagOverrides, modelPin, resolutionOverride },
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "CreatorHomeProjects", id: `shot-prompts-${projectId}` },
      ],
    }),

    // The wallet as a statement: what went in last, what has been spent since, and which stage of
    // production spent it. Replaces reading a flat transaction list and trying to infer all three.
    getWalletStatement: builder.query({
      query: (tenantId) => ({ url: `/billing/${tenantId}/wallet/statement` }),
      providesTags: ["CreatorWallet"],
    }),

    // One row per billable call, for the detail behind a stage total.
    getWalletStatementLines: builder.query({
      query: ({ tenantId, from, to }) => ({
        url: `/billing/${tenantId}/wallet/statement/lines`,
        params: { from: from || undefined, to: to || undefined },
      }),
      providesTags: ["CreatorWallet"],
    }),

    // Progress of the project's latest prepare batch. video-generation-service runs the batch on
    // its Kafka worker side and this row is the durable record of it, so this is what the UI
    // polls: PENDING/RUNNING while live, SUCCEEDED/FAILED with counts once done. 404 means the
    // project has never had a batch.
    getPrepareBatchStatus: builder.query({
      query: (projectId) => ({ url: platformUrl(`/scenes/projects/${projectId}/prepare-batch`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `prepare-batch-${projectId}` }],
    }),

    // Whether each shot's spoken audio fits the clip it is planned for -- read BEFORE generating,
    // which is the only point at which it is still free to fix. Covers both mismatches: a line too
    // long for its shot (comes back cut off mid-word) and a line too SHORT for it (the character
    // stops talking and the shot runs on in silence, which nothing downstream can detect because as
    // far as the pipeline is concerned it fits). Cheap and side-effect-free -- no LLM call, nothing
    // written -- so it is safe to refetch after every remedy to see what changed.
    getProjectDialogueFit: builder.query({
      query: (projectId) => ({ url: platformUrl(`/scenes/projects/${projectId}/dialogue-fit`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `dialogue-fit-${projectId}` }],
    }),

    // The same check for a single shot, for after a remedy lands.
    getShotDialogueFit: builder.query({
      query: ({ projectId, shotId }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/dialogue-fit`),
      }),
      providesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: `dialogue-fit-${args?.projectId}` }],
    }),

    // What to do about a shot whose line overruns it, judged rather than calculated. Called ONLY for
    // a shot the fit report flagged -- the report itself is arithmetic against measured audio and
    // costs nothing, so a shot that fits never reaches a model. 204 (undefined here) when there is
    // nothing to advise on or the gateway could not answer; the three options still stand, just
    // without a suggested one.
    adviseShotDialogueFit: builder.mutation({
      query: ({ projectId, shotId }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/dialogue-fit/advice`),
        method: "POST",
      }),
    }),

    // The clip and the dialogue take for a finished shot, so it can be repaired by hand: download
    // both, fix it in your own editor, upload the result. The escape hatch that stops the flow
    // being a dead end when neither automatic repair gives something worth shipping.
    getShotClipSources: builder.query({
      query: ({ projectId, shotId }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/clip-sources`),
      }),
      providesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-sources-${a?.shotId}` }],
    }),

    // Give a finished clip the seconds its dialogue needs without regenerating it. mode HOLD
    // freezes the last frame (nothing billed); mode GENERATE animates on from it with a cheaper
    // model, billing only the added seconds. tailSeconds omitted asks for exactly what the measured
    // audio needs.
    extendShotTail: builder.mutation({
      query: ({ projectId, shotId, tailSeconds, mode, continuationPrompt }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/extend-tail`),
        method: "POST",
        body: { tailSeconds, mode, continuationPrompt },
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `shot-videos-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `clip-sources-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `clip-versions-${a?.shotId}` },
      ],
    }),

    // --- Reordering shots (pre-production-service) ---
    // What moving a shot would do, asked BEFORE it moves. A read with no side effects: the shot
    // stays where it is until the creator says otherwise.
    getShotReorderImpact: builder.query({
      query: ({ projectId, shotId, position }) => ({
        url: platformUrl(`/projects/${projectId}/shots/${shotId}/reorder-impact`),
        params: { position },
      }),
    }),

    // Moves the shot and renumbers the rest. Changes NOTHING else -- not the script, not the shot
    // descriptions, not a single generated clip. Video follows on its own because clips are keyed
    // to a shot and everything downstream orders by shot number.
    reorderShot: builder.mutation({
      query: ({ projectId, shotId, position }) => ({
        url: platformUrl(`/projects/${projectId}/shots/${shotId}/reorder`),
        method: "POST",
        body: { position },
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `shots-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `project-clips-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `film-${a?.projectId}` },
      ],
    }),

    // --- Cutting a shot (post-production-service, /v1/post-production) ---
    // A shot's clip is a sequence of numbered versions, not a file. Making a cut never changes what
    // the film uses: it returns a PREVIEW, and accepting it is a separate, deliberate call.
    listClipVersions: builder.query({
      query: ({ projectId, shotId }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions`),
      }),
      providesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` }],
    }),

    // Makes sure the shot has version 1 -- its generated clip. Versions are created lazily, the
    // first time a shot is cut, so a shot the creator is happy with has no rows at all and nothing
    // to download, publish or point at. Called the first time any of those is wanted.
    importClipBaseline: builder.mutation({
      query: ({ projectId, shotId, shotRef }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/baseline`),
        method: "POST",
        params: shotRef ? { shotRef } : undefined,
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `project-clips-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `film-${a?.projectId}` },
      ],
    }),

    // Strip the invented audio and put the recorded take on instead.
    createDubbedCut: builder.mutation({
      query: ({ projectId, shotId, shotRef }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/dubbed`),
        method: "POST",
        params: shotRef ? { shotRef } : undefined,
      }),
      invalidatesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` }],
    }),

    // Strip the audio and leave the shot silent.
    createSilentCut: builder.mutation({
      query: ({ projectId, shotId, shotRef }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/silent`),
        method: "POST",
        params: shotRef ? { shotRef } : undefined,
      }),
      invalidatesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` }],
    }),

    // A cut the creator made themselves and brought back.
    uploadClipCut: builder.mutation({
      query: ({ projectId, shotId, shotRef, editedFromVersionId, file }) => {
        const body = new FormData();
        body.append("file", file);
        const params = {};
        if (shotRef) params.shotRef = shotRef;
        // Says which cut this was edited from, so a version that went out and came back reads as a
        // chain rather than two unrelated rows -- and clears the "out for edit" mark on it.
        if (editedFromVersionId) params.editedFromVersionId = editedFromVersionId;
        return {
          url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/uploaded`),
          method: "POST",
          params: Object.keys(params).length ? params : undefined,
          body,
        };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` }],
    }),

    // Make this cut the one the film uses. The cut it replaces is kept, so this goes both ways.
    acceptClipCut: builder.mutation({
      query: ({ projectId, shotId, versionId }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/${versionId}/accept`),
        method: "POST",
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `film-${a?.projectId}` },
      ],
    }),

    // Turns a cut down, or takes the rejection back. Nothing is removed: the cut stays watchable
    // and the film keeps whatever cut it was already using -- accept is still the only thing that
    // changes that. Rejecting the ACTIVE cut is refused by the service on purpose.
    rejectClipCut: builder.mutation({
      query: ({ projectId, shotId, versionId, rejected = true }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/${versionId}/reject`),
        method: "POST",
        params: { rejected },
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `film-${a?.projectId}` },
      ],
    }),

    // Marks a cut as taken away to be edited. The download button calls this, so "what am I still
    // waiting on" has an answer -- until now only the coming-back half left a trace.
    checkoutClipVersion: builder.mutation({
      query: ({ projectId, shotId, versionId }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/${versionId}/checkout`),
        method: "POST",
      }),
      invalidatesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` }],
    }),

    // Show one shot to the client on its own, ahead of any film.
    publishClipVersion: builder.mutation({
      query: ({ projectId, shotId, versionId, published = true }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/shots/${shotId}/clip-versions/${versionId}/publish`),
        method: "POST",
        params: { published },
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `clip-cuts-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `project-clips-${a?.projectId}` },
      ],
    }),

    // The current cut of every shot, in one call. What the editor lists -- it needs all the shots,
    // not only the joined film, because a creator opens it to work on one shot and save it back.
    listProjectClips: builder.query({
      query: (projectId) => ({ url: platformUrl(`/post-production/projects/${projectId}/clips`) }),
      providesTags: (_r, _e, projectId) => [{ type: "CreatorHomeProjects", id: `project-clips-${projectId}` }],
    }),

    // --- The whole film (post-production-service) ---
    // Whether every shot has a cut yet, and which do not -- so the combine button can say WHY it
    // is disabled rather than being greyed out with no reason.
    getFilmReadiness: builder.query({
      query: (projectId) => ({ url: platformUrl(`/post-production/projects/${projectId}/film/readiness`) }),
      providesTags: (_r, _e, projectId) => [{ type: "CreatorHomeProjects", id: `film-${projectId}` }],
    }),

    assembleFilm: builder.mutation({
      query: (projectId) => ({
        url: platformUrl(`/post-production/projects/${projectId}/film`),
        method: "POST",
      }),
      invalidatesTags: (_r, _e, projectId) => [{ type: "CreatorHomeProjects", id: `film-${projectId}` }],
    }),

    getLatestFilm: builder.query({
      query: (projectId) => ({ url: platformUrl(`/post-production/projects/${projectId}/film/latest`) }),
      providesTags: (_r, _e, projectId) => [{ type: "CreatorHomeProjects", id: `film-${projectId}` }],
    }),

    // The creator's own edit of the whole film, brought back after cutting it elsewhere. Recorded
    // as a NEW render, so the joined version and the hand-edited one both survive.
    uploadFilmEdit: builder.mutation({
      query: ({ projectId, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: platformUrl(`/post-production/projects/${projectId}/film/uploaded`),
          method: "POST",
          body,
        };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `film-${a?.projectId}` }],
    }),

    // Show the film on the client's review page, or take it back down. Off means invisible there,
    // not merely undownloadable.
    publishFilm: builder.mutation({
      query: ({ projectId, renderId, published = true }) => ({
        url: platformUrl(`/post-production/projects/${projectId}/film/${renderId}/publish`),
        method: "POST",
        params: { published },
      }),
      invalidatesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `film-${a?.projectId}` }],
    }),

    // --- Dubbing, queued (video-generation-service) ---
    // Returns a job id immediately; the page polls it. The synchronous /clone stays for the
    // project-wide prepare, which is already a batch the caller waits on.
    queueShotDub: builder.mutation({
      query: ({ projectId, shotId, text }) => ({
        url: platformUrl("/clone/jobs"),
        method: "POST",
        body: { projectId, shotId, text },
      }),
    }),

    // Turns down the most recent take, or takes the rejection back. Every flow that puts "the
    // dubbed voice" on a clip reaches for the newest take, so without this a recording that came
    // out wrong sits as the newest thing there is and every later cut picks it up.
    rejectShotDub: builder.mutation({
      query: ({ projectId, shotId, rejected = true }) => ({
        url: platformUrl(`/clone/shots/${shotId}/reject`),
        method: "POST",
        params: { projectId, rejected },
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `clone-audio-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `dialogue-fit-${a?.projectId}` },
      ],
    }),

    getDubJob: builder.query({
      query: (jobId) => ({ url: platformUrl(`/clone/jobs/${jobId}`) }),
    }),

    // Every clip a shot has had, newest first, each with a playable URL so a version can be
    // watched before it is chosen. Written before each repair moves the pointer, so the list is
    // a record rather than a reconstruction.
    listShotClipVersions: builder.query({
      query: ({ projectId, shotId }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/clip-versions`),
      }),
      providesTags: (_r, _e, a) => [{ type: "CreatorHomeProjects", id: `clip-versions-${a?.shotId}` }],
    }),

    // Puts the shot back on one of its earlier clips. The clip being replaced is kept first, so
    // this goes both ways.
    restoreShotClipVersion: builder.mutation({
      query: ({ projectId, shotId, versionId }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/clip-versions/${versionId}/restore`),
        method: "POST",
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `shot-videos-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `clip-sources-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `clip-versions-${a?.shotId}` },
      ],
    }),

    // Puts the shot back on the clip that was generated for it, when a repair made things worse.
    // The generated object is still in storage under a key derived from the job id, so this needs
    // nothing to have been recorded beforehand.
    restoreShotClip: builder.mutation({
      query: ({ projectId, shotId }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/restore-clip`),
        method: "POST",
      }),
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `shot-videos-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `clip-sources-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `clip-versions-${a?.shotId}` },
      ],
    }),

    // The creator's own finished clip, replacing what the model produced for this shot.
    uploadShotClip: builder.mutation({
      query: ({ projectId, shotId, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: platformUrl(`/scenes/projects/${projectId}/shots/${shotId}/upload-clip`),
          method: "POST",
          body,
        };
      },
      invalidatesTags: (_r, _e, a) => [
        { type: "CreatorHomeProjects", id: `shot-videos-${a?.projectId}` },
        { type: "CreatorHomeProjects", id: `clip-sources-${a?.shotId}` },
        { type: "CreatorHomeProjects", id: `clip-versions-${a?.shotId}` },
      ],
    }),

    // Rewrite a line to take a given number of seconds to say, keeping its meaning. Both
    // directions: shorter when it overruns the shot, longer when the shot runs on in silence after
    // it. Returns the rewrite and saves NOTHING -- the line is the creator's writing, so it is shown
    // against the original and applied only if they accept, via updatePreProductionShot (voice-over)
    // or updateShotDialogueBeat (a single beat's text). targetSeconds comes from the fit report,
    // already snapped to the shot's frame grid; don't compute one here.
    retimeShotDialogue: builder.mutation({
      query: ({ projectId, dialogue, targetSeconds, shotId, beatId, languageCode }) => ({
        url: platformUrl(`/scenes/projects/${projectId}/dialogue-retime`),
        method: "POST",
        // shotId/beatId rather than any timing numbers: the server looks up how long this exact line
        // takes to say from its synthesized take, and sizes the rewrite from that. A duration sent
        // from here would be a second opinion on a measurement the server already holds.
        body: { dialogue, targetSeconds, shotId, beatId, languageCode },
      }),
    }),

    // All prepared shot prompts for a project, one row per shot (latest version wins). Video
    // workspace calls this once on page load to render the full editable list -- this is what
    // makes a prepared prompt survive a refresh instead of living only in component state.
    listProjectShotPrompts: builder.query({
      query: (projectId) => ({ url: platformUrl(`/scenes/projects/${projectId}/shot-prompts`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `shot-prompts-${projectId}` }],
    }),

    // Every generated shot clip in a project, each with a PRESIGNED videoUrl -- fetchable with
    // no Authorization header, which is what the patch editor needs (it loads a source with a
    // plain fetch()). On /scenes rather than /projects/{id}/jobs because that prefix belongs to
    // pre-production-service at the gateway; /jobs/{id}/video reaches video-gen but 302s behind
    // JWT auth, which a credential-less fetch cannot follow. videoUrl is null until a shot has a
    // persisted output.
    listProjectShotVideos: builder.query({
      query: (projectId) => ({ url: platformUrl(`/scenes/projects/${projectId}/shot-videos`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `shot-videos-${projectId}` }],
    }),

    // Every prompt version written for a shot, newest first, each carrying the approval/job
    // status it produced. Editing never overwrites -- a save writes a new row parented to the
    // one it came from -- so this is the shot's history and a rejected prompt is still readable.
    // On /scenes rather than /v1/shots/{ref}/prompts, which video-gen also serves but the
    // browser cannot reach: /v1/shots belongs to pre-production-service at the gateway.
    listShotPromptVersions: builder.query({
      query: (shotRef) => ({ url: platformUrl(`/scenes/shots/${shotRef}/prompts`) }),
      providesTags: (_result, _error, shotRef) => [{ type: "CreatorHomeProjects", id: `prompt-versions-${shotRef}` }],
    }),


    // Model catalog for the video-workspace "generate with" dropdown. Proxied through video-gen
    // (UI never calls llm-gateway directly -- llm-gateway is cluster-internal). type=video
    // filters to registered video-generation models (Seedance, Wan, ...).
    listVideoModels: builder.query({
      query: () => ({ url: platformUrl(`/scenes/models`), params: { type: "video" } }),
    }),

    getShotScenePrompt: builder.query({
      query: (promptId) => ({ url: platformUrl(`/scenes/${promptId}`) }),
    }),

    // Save a creator's edit of a prepared prompt. The backend writes a NEW prompt version (parent
    // pointing at the one edited) under the SAME job, copying across the attachments and source
    // ids, and approve() dispatches a job's newest prompt -- so the returned promptId is what
    // "Approve & generate" will render. Nothing is re-derived and nothing is charged for a save.
    // projectId is optional and only used to refresh the project's prompt list.
    updateShotScenePrompt: builder.mutation({
      query: ({ promptId, positive }) => ({
        url: platformUrl(`/scenes/${promptId}`),
        method: "PUT",
        body: { positive },
      }),
      invalidatesTags: (_result, _error, { projectId }) =>
        projectId ? [{ type: "CreatorHomeProjects", id: `shot-prompts-${projectId}` }] : [],
    }),

    // video-generation-service FinalRenderController -- concatenates every completed shot
    // in a project into one deliverable mp4 (self-hosted ffmpeg, not fal.ai). Blocks for
    // the whole render; poll getLatestFinalRender or getFinalRender for a UI that would
    // rather fire-and-poll. Endpoints live under /v1/final-renders -- deliberately not
    // /v1/projects or /v1/shots (both claimed by pre-production-service too).
    // silentShotRefs: shots whose voice is left out of THIS cut. A render-time choice -- the clips
    // themselves are untouched, so the next assembly can include every voice again. Accepts either a
    // bare projectId (all voices kept) or {projectId, silentShotRefs}.
    createFinalRender: builder.mutation({
      query: (arg) => {
        const { projectId, silentShotRefs, shotAudio, allowPartial } = typeof arg === "object" && arg !== null
          ? arg : { projectId: arg };
        return {
          url: platformUrl(`/final-renders`),
          method: "POST",
          // shotAudio: per shotRef, CLIP / DUBBED / SILENT. silentShotRefs is the older, narrower
          // way of saying the same thing and is still accepted by the server.
          // allowPartial: assemble the ready shots and leave out the unfinished ones. The server
          // refuses by default and names what is missing; this is the creator overruling that.
          body: { projectId, silentShotRefs, shotAudio, allowPartial },
        };
      },
      invalidatesTags: (_result, _error, arg) => {
        const id = typeof arg === "object" && arg !== null ? arg.projectId : arg;
        return [{ type: "CreatorHomeProjects", id: `final-render-${id}` }];
      },
    }),

    getLatestFinalRender: builder.query({
      query: (projectId) => ({ url: platformUrl(`/final-renders/projects/${projectId}/latest`) }),
      providesTags: (_result, _error, projectId) => [{ type: "CreatorHomeProjects", id: `final-render-${projectId}` }],
    }),

    getFinalRender: builder.query({
      query: (renderId) => ({ url: platformUrl(`/final-renders/${renderId}`) }),
    }),

    // pre-production-service ProjectController -- creator's manual toggle for whether the client
    // can see the assembled final video on their public review page. The name is narrower than
    // what it does: PublicProjectService returns no videoUrl at all while this is off, so the
    // client's page shows nothing -- the cut is invisible, not merely undownloadable. Per-tenant,
    // JWT-auth.
    updateFinalVideoLock: builder.mutation({
      query: ({ projectId, unlocked }) => ({
        url: platformUrl(`/projects/${projectId}/final-video-lock`),
        method: "PATCH",
        body: { unlocked },
      }),
      invalidatesTags: (_result, _error, args) => [{ type: "CreatorHomeProjects", id: args?.projectId }],
    }),

    // pre-production-service PublicProjectController -- unauthenticated, token-based read of
    // a project's assembled final video for the client review page. Server-side gate: videoUrl
    // is null when the creator has not unlocked download for this client.
    // Individual shots the creator published for this client, ahead of any finished film.
    // Unauthenticated and token-scoped, like every other read on the review page.
    getPublicPublishedShots: builder.query({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/published-shots`) }),
    }),

    getPublicFinalVideo: builder.query({
      query: (token) => ({ url: platformUrl(`/public/projects/${token}/final-video`) }),
    }),

    // pre-production-service ShotExportService/AnimatedPreviewService.
    exportShotsPdf: builder.mutation({
      query: (projectId) => ({ url: platformUrl(`/projects/${projectId}/export-pdf`), method: "POST" }),
    }),

    // Returns raw HTML (not JSON) -- fetched here (rather than a plain <a href>) so the request
    // carries the normal Authorization header; the caller turns the text into a Blob URL to open.
    getAnimatedPreviewHtml: builder.mutation({
      query: (projectId) => ({
        url: platformUrl(`/projects/${projectId}/animated-preview`),
        responseHandler: (response) => response.text(),
      }),
    }),

    // Ops dashboard admin endpoints. Same-origin (ops.dalaillama.in) -- see opsAdminUrl comment
    // for the routing decision. Every call is gated by oauth2-proxy + dalai_admin at the ingress.
    listStuckLlmJobs: builder.query({
      query: (lookbackHours = 24) => ({ url: opsAdminUrl(`/llm-jobs/stuck?lookbackHours=${lookbackHours}`) }),
      providesTags: [{ type: "CreatorHomeProjects", id: "admin-stuck-llm-jobs" }],
    }),
    // Every LLM job (all statuses including COMPLETED) in the window. For the "did this run"
    // audit view in /admin -- filtered client-side by status/tenant/etc.
    listRecentLlmJobs: builder.query({
      query: (lookbackHours = 24) => ({ url: opsAdminUrl(`/llm-jobs/recent?lookbackHours=${lookbackHours}`) }),
      providesTags: [{ type: "CreatorHomeProjects", id: "admin-recent-llm-jobs" }],
    }),
    retryLlmJob: builder.mutation({
      query: (jobId) => ({ url: opsAdminUrl(`/llm-jobs/${jobId}/retry`), method: "POST" }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-stuck-llm-jobs" }],
    }),
    listAdminTenants: builder.query({
      query: () => ({ url: opsAdminUrl(`/tenants`) }),
      providesTags: [{ type: "CreatorHomeProjects", id: "admin-tenants" }],
    }),
    activateAdminTenant: builder.mutation({
      query: (tenantId) => ({ url: opsAdminUrl(`/tenants/${tenantId}/activate`), method: "POST" }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-tenants" }],
    }),
    deactivateAdminTenant: builder.mutation({
      query: ({ tenantId, reason }) => ({
        url: opsAdminUrl(`/tenants/${tenantId}/deactivate`),
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-tenants" }],
    }),
    getAdminWallet: builder.query({
      query: (tenantId) => ({ url: opsAdminUrl(`/billing/wallets/${tenantId}`) }),
      providesTags: (_r, _e, tenantId) => [{ type: "CreatorHomeProjects", id: `admin-wallet-${tenantId}` }],
    }),
    creditAdminWallet: builder.mutation({
      query: ({ tenantId, amount, reference }) => ({
        url: opsAdminUrl(`/billing/wallets/${tenantId}/credit`),
        method: "POST",
        body: { amount, reference },
      }),
      invalidatesTags: (_r, _e, { tenantId }) => [{ type: "CreatorHomeProjects", id: `admin-wallet-${tenantId}` }],
    }),
    listAdminPlans: builder.query({
      query: () => ({ url: opsAdminUrl(`/plans`) }),
      providesTags: [{ type: "CreatorHomeProjects", id: "admin-plans" }],
    }),
    createAdminPlan: builder.mutation({
      query: (body) => ({ url: opsAdminUrl(`/plans`), method: "POST", body }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-plans" }],
    }),
    updateAdminPlan: builder.mutation({
      query: ({ planId, ...body }) => ({ url: opsAdminUrl(`/plans/${planId}`), method: "PUT", body }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-plans" }],
    }),
    activateAdminPlan: builder.mutation({
      query: (planId) => ({ url: opsAdminUrl(`/plans/${planId}/activate`), method: "POST" }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-plans" }],
    }),
    deactivateAdminPlan: builder.mutation({
      query: (planId) => ({ url: opsAdminUrl(`/plans/${planId}/deactivate`), method: "POST" }),
      invalidatesTags: [{ type: "CreatorHomeProjects", id: "admin-plans" }],
    }),
    // Loki HTTP API pass-through (routed by ops-virtualservice /loki/api -> loki service).
    // {query} is a LogQL expression, {sinceMinutes} shifts the range window. Loki's query_range
    // response shape is preserved -- callers unpack data.result[].values themselves rather than
    // this endpoint normalising to a domain DTO, so any LogQL is queryable without service changes.
    queryLokiRange: builder.query({
      query: ({ logql, sinceMinutes = 60, limit = 100 }) => {
        const end = Date.now() * 1_000_000;
        const start = end - sinceMinutes * 60 * 1_000_000_000;
        return { url: opsLokiUrl(`/v1/query_range?query=${encodeURIComponent(logql)}&start=${start}&end=${end}&limit=${limit}&direction=backward`) };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrganizationQuery,
  useSetupOrganizationMutation,
  useUpdateOrganizationMutation,
  useListWalletTransactionsQuery,
  useGetVideoPricingQuoteQuery,
  useListProjectRequirementsQuery,
  useGetProjectRequirementProductQuery,
  useListProjectRequirementProductImagesQuery,
  useListProjectRequirementReferenceImagesQuery,
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
  useGeneratePatchEditAsyncMutation,
  useCreateDubbingJobMutation,
  useLazyGetDubbingJobQuery,
  useListUpscaleModelsQuery,
  useGenerateUpscaleMutation,
  useGetProjectSpendQuery,
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
  useCreateCreatorProjectMutation,
  useSuggestAudienceMutation,
  useSuggestCampaignAnglesMutation,
  useSelectLockedCampaignAngleMutation,
  useConfirmAudienceMutation,
  useListCreatorsQuery,
  useCreateCreatorMutation,
  useUpdateCreatorMutation,
  useUploadActorReferenceImageMutation,
  useGenerateIdeasMutation,
  useQuoteLockedIdeaMutation,
  useLockIdeaSelectionMutation,
  useGenerateLockedIdeaOptionsMutation,
  useGenerateLockedIdeaOptionsAsyncMutation,
  useSaveStoryIdeaMutation,
  useGenerateStoryIdeaScriptMutation,
  useRunGraphPipelineMutation,
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
  useLazyGetLatestScreenplayVideoRunQuery,
  useGetScreenplayVideoRunQuery,
  useGetScreenplaySceneAssetsQuery,
  useSetScreenplaySceneAssetAcceptedMutation,
  useChatScreenplayVideoSceneMutation,
  useGenerateScreenplaySceneDialogueVoiceMutation,
  useDecideScreenplaySceneDialogueVoiceMutation,
  useCombineScreenplaySceneDialogueAudioMutation,
  useUploadScreenplaySceneAvatarImageMutation,
  useUploadScreenplaySceneProductionImageMutation,
  useUploadScreenplaySceneReferenceImageMutation,
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
  useEmbedOfflineAnimatedStoryboardHtmlMutation,
  useApplyStoryboardClientReviewMutation,
  useRevertStoryboardClientReviewMutation,
  useUploadStoryboardFontReferenceImageMutation,
  useUploadStoryboardVisualReferenceImageMutation,
  useAnalyzeShotProductReferenceMutation,
  useConfirmShotProductReferenceMutation,
  useLazyGetAnimatedStoryboardPreviewQuery,
  useGetShotImageUrlsQuery,
  useOpenStoryboardWorkspaceMutation,
  useGetStoryboardWorkspacesQuery,
  useChatStoryboardWorkspaceMutation,
  useUploadWorkspaceShotInspirationImageMutation,
  useCreateStoryboardWorkspaceCheckpointMutation,
  useGetStoryboardWorkspaceCheckpointsQuery,
  useRevertStoryboardWorkspaceMutation,
  useMergeStoryboardWorkspaceMutation,
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
  useListUsageRecordsQuery,
  useGetCreatorSubscriptionQuery,
  useStartSubscriptionUpgradeMutation,
  useListCreatorVideoPlansQuery,
  useGetCreatorVideoEntitlementsBySubscriptionQuery,
  useGetCreatorVideoEntitlementsByTenantQuery,
  useSubscribeCreatorVideoMutation,
  useCancelCreatorVideoSubscriptionMutation,
  usePauseCreatorVideoSubscriptionMutation,
  useResumeCreatorVideoSubscriptionMutation,
  useListPreProductionProjectsQuery,
  useListShotDesignReadyProjectsQuery,
  useListTrendReportsQuery,
  useGenerateTrendReportMutation,
  useListBrandsQuery,
  useCreateBrandMutation,
  useGetBrandQuery,
  useUpdateBrandMutation,
  useListBrandVersionsQuery,
  useGetBrandVersionQuery,
  useListBrandProjectsQuery,
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useListProductReferenceImagesQuery,
  useUploadProductReferenceImageMutation,
  useCreateProjectRequirementMutation,
  useUploadProjectRequirementAttachmentMutation,
  useGetPublicProjectRequirementQuery,
  useUploadPublicRequirementReferenceVideoMutation,
  useUpdateRequirementFromClientMutation,
  useStartRequirementPaymentMutation,
  useVerifyRequirementPaymentMutation,
  useGetProjectRequirementQuery,
  useUpdateProjectRequirementQuoteMutation,
  useGenerateProjectRequirementIdeasMutation,
  useListProjectRequirementIdeasQuery,
  useSaveEditedProjectRequirementIdeaMutation,
  useLockProjectRequirementIdeaMutation,
  useGetLockedIdeaQuery,
  useGetPreProductionProjectQuery,
  useAdvanceProjectStatusMutation,
  useUpdateProjectReviewSettingsMutation,
  useSyncProjectChatContextMutation,
  useGetScriptQuery,
  useGenerateScriptMutation,
  useListScriptVersionsQuery,
  useGetScriptVersionQuery,
  useSaveScriptEditMutation,
  useUpdateScriptCharacterMutation,
  useGetScreenplayQuery,
  useListScreenplayVersionsQuery,
  useGetScreenplayVersionQuery,
  useGenerateScreenplayMutation,
  useSaveScreenplayEditMutation,
  useListCastProfilesQuery,
  useCreateCastProfileMutation,
  useUpdateCastProfileVoiceMutation,
  useSelectCastProfileBuiltinVoiceMutation,
  useUploadCastMediaMutation,
  useListCastAssignmentsQuery,
  useListSpeakingCharactersQuery,
  useCreateCastAssignmentMutation,
  useGeneratePreProductionShotListMutation,
  useGetPreProductionShotListJobQuery,
  useGetLatestPreProductionShotListJobQuery,
  useListStuckLlmJobsQuery,
  useListRecentLlmJobsQuery,
  useRetryLlmJobMutation,
  useListAdminTenantsQuery,
  useActivateAdminTenantMutation,
  useDeactivateAdminTenantMutation,
  useGetAdminWalletQuery,
  useCreditAdminWalletMutation,
  useListAdminPlansQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useActivateAdminPlanMutation,
  useDeactivateAdminPlanMutation,
  useQueryLokiRangeQuery,
  useListPreProductionShotsQuery,
  useCreatePreProductionShotMutation,
  useUpdatePreProductionShotMutation,
  useGeneratePreProductionShotImageMutation,
  useGeneratePreProductionShotImageWithInspirationMutation,
  useReplacePreProductionShotImageMutation,
  useListPreProductionShotImagesQuery,
  useReanalyzePreProductionShotImageMutation,
  useReanalyzePreProductionShotImagesForProjectMutation,
  useAnalyzePreProductionShotProductReferenceMutation,
  useConfirmPreProductionShotProductReferenceMutation,
  useGetPreProductionShotProductReferenceQuery,
  useListShotDialogueBeatsQuery,
  useCreateShotDialogueBeatMutation,
  useUpdateShotDialogueBeatMutation,
  useDeleteShotDialogueBeatMutation,
  useListProjectIdeaOptionsQuery,
  useGenerateProjectIdeaOptionsMutation,
  useSelectProjectIdeaOptionMutation,
  useEnsureClientReviewLinkMutation,
  useListChangeRequestsQuery,
  useApplyChangeRequestMutation,
  useDismissChangeRequestMutation,
  useListChatSessionsQuery,
  useCreateChatSessionMutation,
  useSendChatMessageMutation,
  useGetChatMessagesQuery,
  useGetPublicProjectQuery,
  useGetPublicBriefByLockedIdeaQuery,
  useLockPublicProjectMutation,
  useGetLockQuoteMutation,
  useStartLockPaymentMutation,
  useVerifyLockPaymentMutation,
  useGetReviewStatusQuery,
  useStartReviewMutation,
  useEndReviewMutation,
  useGetReviewPaymentQuoteMutation,
  useStartReviewPaymentMutation,
  useVerifyReviewPaymentMutation,
  useSendPublicProjectChatMessageMutation,
  useGetPublicProjectChatHistoryQuery,
  useAddPublicReviewCommentMutation,
  useGetPublicReviewCommentsQuery,
  useListProjectReviewCommentsQuery,
  useResolveProjectReviewCommentMutation,
  useListCloningModelsQuery,
  useListBuiltinVoicesQuery,
  useSyncBuiltinVoicesMutation,
  useTestShotVoiceMutation,
  useCloneProjectVoicesMutation,
  useGetClonedVoiceAudioQuery,
  useListTtsModelsQuery,
  useGetShotBackgroundMusicQuery,
  useGenerateShotBackgroundMusicMutation,
  useDispatchShotMutation,
  useGetVideoGenPromptQuery,
  useLazyGetVideoGenPromptQuery,
  useLazyGetVideoGenJobQuery,
  useApproveVideoGenJobMutation,
  useRejectVideoGenJobMutation,
  useCancelVideoGenJobMutation,
  usePrepareProjectSceneMutation,
  useGetProjectScenePreparationQuery,
  useLazyGetProjectScenePreparationQuery,
  usePrepareShotSceneMutation,
  usePrepareShotScenesBatchMutation,
  useGetPrepareBatchStatusQuery,
  useGetWalletStatementQuery,
  useGetWalletStatementLinesQuery,
  useListProjectShotPromptsQuery,
  useGetProjectDialogueFitQuery,
  useGetShotDialogueFitQuery,
  useRetimeShotDialogueMutation,
  useAdviseShotDialogueFitMutation,
  useGetShotClipSourcesQuery,
  useExtendShotTailMutation,
  useAcceptClipCutMutation,
  useRejectClipCutMutation,
  useLazyGetShotReorderImpactQuery,
  useReorderShotMutation,
  useCheckoutClipVersionMutation,
  useImportClipBaselineMutation,
  useListProjectClipsQuery,
  usePublishClipVersionMutation,
  useAssembleFilmMutation,
  useCreateDubbedCutMutation,
  useCreateSilentCutMutation,
  useGetDubJobQuery,
  useGetFilmReadinessQuery,
  useGetLatestFilmQuery,
  useLazyGetDubJobQuery,
  useListClipVersionsQuery,
  usePublishFilmMutation,
  useUploadFilmEditMutation,
  useQueueShotDubMutation,
  useRejectShotDubMutation,
  useUploadClipCutMutation,
  useListShotClipVersionsQuery,
  useRestoreShotClipMutation,
  useRestoreShotClipVersionMutation,
  useUploadShotClipMutation,
  useLazyListProjectShotPromptsQuery,
  useListVideoModelsQuery,
  useGetShotScenePromptQuery,
  useLazyGetShotScenePromptQuery,
  useUpdateShotScenePromptMutation,
  useCreateFinalRenderMutation,
  useGetLatestFinalRenderQuery,
  useListProjectShotVideosQuery,
  useListShotPromptVersionsQuery,
  useLazyGetLatestFinalRenderQuery,
  useGetFinalRenderQuery,
  useLazyGetFinalRenderQuery,
  useUpdateFinalVideoLockMutation,
  useGetPublicFinalVideoQuery,
  useGetPublicPublishedShotsQuery,
  useExportShotsPdfMutation,
  useGetAnimatedPreviewHtmlMutation,
  useListShotTypesQuery,
  useListVideoFeatureFlagsQuery,
  useListAspectRatiosQuery,
  useListDialogueLanguagesQuery,
  useListGendersQuery,
  useGetProjectConfigQuery,
  useUpdateProjectConfigMutation,
  useGenerateMotionGraphicPlanMutation,
  useGetMotionGraphicPlanQuery,
  useGetContinuityBibleQuery,
  useGenerateLightingPlanMutation,
  useGetLightingPlanQuery,
  useGenerateCameraPlanMutation,
  useGetCameraPlanQuery,
  useSaveLightingPlanEditMutation,
  useSaveCameraPlanEditMutation,
  useListShotThoughtsQuery,
  useStartShotAssetBatchMutation,
  useGetShotAssetBatchStatusQuery,
  useListShotAssetCompletionQuery,
  useListShotAssetDeadLettersQuery,
  useRetryShotAssetDeadLetterMutation,
  useListShotPlanIssuesQuery,
} = creatorApi;
 
 
