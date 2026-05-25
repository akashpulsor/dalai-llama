// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTenantId,
  setTenantIdentity,
  showFlash,
  useAddWalletBalanceMutation,
  useGetWalletBalanceQuery,
} from "@dalaillama/shared-store";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, FolderOpen, HelpCircle, History, ListChecks, Loader2, LockKeyhole, RefreshCw, Sparkles, X } from "lucide-react";
import {
  useConfirmAudienceMutation,
  useCreateCreatorMutation,
  useGenerateIdeasMutation,
  useGenerateLockedIdeaOptionsAsyncMutation,
  useGenerateLockedIdeaOptionsMutation,
  useGenerateStoryIdeaScriptMutation,
  useGenerateStoryIdeaScreenplayAsyncMutation,
  useGetAiProvidersQuery,
  useGetCharacterCastMappingsQuery,
  useGetCreatorCategoriesQuery,
  useGetCreatorPlatformsQuery,
  useGetCreatorProjectsQuery,
  useLazyGetCreatorProjectQuery,
  useGetOrganizationQuery,
  useGetJobQuery,
  useGetJobsQuery,
  useLazyGetJobQuery,
  useGetSavedStoryboardsQuery,
  useGetStoryboardQuery,
  useGetStoryboardHistoryQuery,
  useGetTrendInsightQuery,
  useGetTrendsQuery,
  useGetTrendCombinationsQuery,
  useGetCreatorSubscriptionQuery,
  useLockIdeaSelectionMutation,
  useGenerateStoryboardFromScriptMutation,
  useGenerateStoryboardFromScriptAsyncMutation,
  useGenerateProductionPlansAsyncMutation,
  useGenerateShotImageMutation,
  useGetProductionPlansQuery,
  useGetShotImageUrlsQuery,
  useGetCreatorStorylineHistoryQuery,
  useGetCreatorScriptHistoryQuery,
  useLazyGetCreatorStorylineHistoryItemQuery,
  useLazyGetCreatorScriptHistoryItemQuery,
  useListCreatorsQuery,
  usePredictTrendsMutation,
  useRequestExportMutation,
  useSaveStoryIdeaMutation,
  useSaveStoryIdeaScriptMutation,
  useSaveGeneratedScriptMutation,
  useSaveCharacterCastMappingsMutation,
  useGenerateStoryIdeaScreenplayMutation,
  useSaveStoryboardMutation,
  useSetupOrganizationMutation,
  useSuggestAudienceMutation,
  useStartSubscriptionUpgradeMutation,
  useUpdateCreatorMutation,
  useUnsaveStoryboardMutation,
} from "../api/creatorEndpoints.js";
import {
  completeStep,
  selectAudience,
  selectCreator,
  selectCreatorPlanner,
  selectIdea,
  selectTrend,
  setActiveStep,
  setProjectId,
  resetPlannerState,
  restorePlannerState,
} from "../slices/plannerSlice.js";
import { markSceneImageReady, markSceneJsonReady, selectCreatorStoryboardLocal } from "../slices/storyboardLocalSlice.js";
import { selectCreatorPreview, setCursorMs, setCurrentSceneIndex, setDurationMs, togglePlayback } from "../slices/previewSlice.js";
import TrendFilterBar from "../components/trends/TrendFilterBar.jsx";
import TrendCarousel from "../components/trends/TrendCarousel.jsx";
import TrendCard from "../components/trends/TrendCard.jsx";
import WhyTrendingStrip from "../components/trends/WhyTrendingStrip.jsx";
import AudienceForm from "../components/audience/AudienceForm.jsx";
import CreatorForm from "../components/creator/CreatorForm.jsx";
import IdeaCandidatesPanel from "../components/ideas/IdeaCandidatesPanel.jsx";
import StoryScriptPanel from "../components/ideas/StoryScriptPanel.jsx";
import ScriptReviewPanel from "../components/ideas/ScriptReviewPanel.jsx";
import ScriptGenerationModal from "../components/ideas/ScriptGenerationModal.jsx";
import StoryboardGrid from "../components/storyboard/StoryboardGrid.jsx";
import StoryboardHistoryPanel from "../components/storyboard/StoryboardHistoryPanel.jsx";
import ProductionPlanPanel from "../components/storyboard/ProductionPlanPanel.jsx";
import MobileFrame from "../components/preview/MobileFrame.jsx";
import GenerationStatusBar from "../components/jobs/GenerationStatusBar.jsx";
import OrganizationSetupCard from "../components/billing/OrganizationSetupCard.jsx";
import RechargeWalletModal from "../components/billing/RechargeWalletModal.jsx";
import SubscriptionBadge from "../components/billing/SubscriptionBadge.jsx";

const countryOptions = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AE", label: "UAE" },
];

const sanitizeTenantId = (tenantId) => {
  if (!tenantId) return null;
  const normalized = String(tenantId).trim();
  if (!normalized || normalized === "undefined" || normalized === "null") return null;
  return normalized;
};

const fallbackTrends = [
  {
    id: "trend-she-almost",
    title: "She Almost Didn't Go",
    status: "Very Hot",
    hashtags: ["#gymmotivation", "#transformation"],
    reels: "12.4K",
    reelsGrowth: "+38%",
    engagement: "9.1%",
    engagementGrowth: "+21%",
  },
  {
    id: "trend-wife-gym",
    title: "POV: Indian Wife Starts Gym",
    status: "Hot",
    hashtags: ["#relatable", "#couplegoals"],
    reels: "9.8K",
    reelsGrowth: "+27%",
    engagement: "8.7%",
    engagementGrowth: "+18%",
  },
  {
    id: "trend-study-late",
    title: "Study With Me - Late Nights",
    status: "Hot",
    hashtags: ["#studygram", "#motivation"],
    reels: "8.7K",
    reelsGrowth: "+16%",
    engagement: "7.2%",
    engagementGrowth: "+14%",
  },
  {
    id: "trend-skin-routine",
    title: "Glowing Skin Real Routine",
    status: "Trending",
    hashtags: ["#skincare", "#glowup"],
    reels: "7.1K",
    reelsGrowth: "+13%",
    engagement: "6.3%",
    engagementGrowth: "+14%",
  },
  {
    id: "trend-protein-meals",
    title: "High Protein Indian Meals",
    status: "Trending",
    hashtags: ["#highprotein", "#healthy"],
    reels: "6.3K",
    reelsGrowth: "+11%",
    engagement: "5.8%",
    engagementGrowth: "+9%",
  },
];

const fallbackAiProviderCatalog = [
  {
    code: "openai",
    label: "OpenAI",
    displayName: "OpenAI",
    providerType: "LLM",
    defaultModel: "gpt-4o-mini",
    defaultProvider: true,
    credentialConfigured: true,
    sortOrder: 10,
  },
  {
    code: "mock",
    label: "Mock Provider",
    displayName: "Mock Provider",
    providerType: "MOCK",
    defaultModel: "mock-creator-v1",
    defaultProvider: false,
    credentialConfigured: true,
    sortOrder: 90,
  },
];

const filterLabels = {
  platform: { instagram_reels: "Instagram Reels", instagram: "Instagram Reels", youtube_shorts: "YouTube Shorts", youtube: "YouTube Shorts", tiktok: "TikTok" },
  category: { fitness: "Fitness", beauty: "Beauty", food: "Food", study: "Study" },
  timeframe: { "7d": "Last 7 Days", "24h": "Last 24 Hours", "30d": "Last 30 Days" },
};

const TREND_DISCOVERY_ENABLED = false;

const workflowSlides = [
  { id: "ideas", label: "New Ideas", caption: "Write a topic and pick one of the generated angles" },
  { id: "script", label: "Storyline", caption: "Shape the story, characters, personas, and backstories" },
  { id: "cast", label: "Actor", caption: "Add actors and map them to story characters" },
  { id: "screenplay", label: "Script", caption: "Convert the locked story and actors into shot-wise pages" },
];

const workflowStepIds = new Set(workflowSlides.map((slide) => slide.id));
const workspacePageIds = new Set(["ideas", "generated-ideas", "script", "screenplay", "cast", "storyboard"]);
const modalHashIds = new Set(["projects", "past-storyline", "past-script"]);

const pageFromHash = (hash) => {
  const id = String(hash || "").replace(/^#/, "");
  if (id === "dashboard" || id === "trends" || id === "generate") return "ideas";
  return workspacePageIds.has(id) ? id : "ideas";
};

function currentHashId() {
  if (typeof window === "undefined") return "";
  return String(window.location.hash || "").replace(/^#/, "");
}

function isReloadNavigation() {
  try {
    const [navigation] = window.performance?.getEntriesByType?.("navigation") || [];
    return navigation?.type === "reload";
  } catch {
    return false;
  }
}

function shouldRestoreStoredWorkflowOnLoad() {
  if (typeof window === "undefined") return false;
  const id = currentHashId();
  if (id === "ideas") return false;
  if (workspacePageIds.has(id) || modalHashIds.has(id)) return true;
  return !id && isReloadNavigation();
}

function initialWorkspacePageFromLocation() {
  if (typeof window === "undefined") return "ideas";
  const id = currentHashId();
  if (workspacePageIds.has(id)) return id;
  if (modalHashIds.has(id) || (!id && isReloadNavigation())) {
    const stored = readStoredCreatorWorkflow();
    return workspacePageIds.has(stored?.workspacePage) ? stored.workspacePage : "ideas";
  }
  return "ideas";
}

const CREATOR_WORKFLOW_STORAGE_KEY = "creatorPlannerWorkflow";

const fallbackIdeas = [
  {
    id: "idea-she-almost",
    title: "She Almost Didn't Go",
    bestMatch: true,
    description: "A hesitant beginner nearly skips the gym, then chooses one small brave step.",
    hashtags: ["#ShowUp", "#FitnessJourney", "#BeginnerGym"],
  },
  {
    id: "idea-wife-gym",
    title: "POV: Indian Wife Starts Gym",
    description: "Relatable and funny POV on starting a gym journey.",
    hashtags: ["#POV", "#IndianFitness", "#Confidence"],
  },
  {
    id: "idea-day-one",
    title: "Nobody Saw Her Day 1",
    description: "Powerful transformation from day one to consistency.",
    hashtags: ["#DayOne", "#GlowUp", "#Discipline"],
  },
];

const mockIdeaBatches = [
  [
    {
      id: "idea-small-win",
      title: "First Small Win",
      description: "A beginner celebrates showing up for ten quiet minutes instead of chasing perfection.",
      hashtags: ["#SmallWins", "#BeginnerFitness", "#ShowUp"],
    },
    {
      id: "idea-gym-bag",
      title: "The Gym Bag Stayed Packed",
      description: "A visual story about preparing the night before and making the morning easier.",
      hashtags: ["#FitnessPrep", "#HabitBuild", "#Routine"],
    },
  ],
  [
    {
      id: "idea-mirror-talk",
      title: "Mirror Pep Talk",
      description: "A nervous creator practices one honest line before entering the gym.",
      hashtags: ["#SelfTalk", "#GymAnxiety", "#Confidence"],
    },
    {
      id: "idea-quiet-rep",
      title: "One Quiet Rep",
      description: "A slow, grounded short built around doing one rep with no audience and no pressure.",
      hashtags: ["#Discipline", "#DayOne", "#Relatable"],
    },
  ],
];

const fallbackScenes = [
  { id: "scene-01", timestamp: "0-2 sec", description: "Standing outside gym, deep breath.", vo: "She almost didn't go.", shotType: "Wide" },
  { id: "scene-02", timestamp: "2-4 sec", description: "Close-up on shoes and bag.", vo: "None", shotType: "Close Up" },
  { id: "scene-03", timestamp: "4-6 sec", description: "Scrolling phone, distraction.", vo: "Excuses were easier.", shotType: "Medium" },
  { id: "scene-04", timestamp: "6-8 sec", description: "Looks at gym entrance, nervous.", vo: "But something inside pushed me.", shotType: "Medium" },
  { id: "scene-05", timestamp: "8-10 sec", description: "Takes a small step inside.", vo: "None", shotType: "Wide" },
  { id: "scene-06", timestamp: "10-15 sec", description: "Tying hair, preparing herself.", vo: "Day 1. New me.", shotType: "Medium" },
  { id: "scene-07", timestamp: "15-20 sec", description: "First set - struggle but consistent.", vo: "It wasn't easy, but I didn't stop.", shotType: "Medium" },
  { id: "scene-08", timestamp: "20-23 sec", description: "Wiping sweat, determined look.", vo: "One decision...", shotType: "Close Up" },
  { id: "scene-09", timestamp: "23-25 sec", description: "Pushing more reps.", vo: "None", shotType: "Close Up" },
  { id: "scene-10", timestamp: "25-27 sec", description: "Small smile after completing set.", vo: "Changed everything.", shotType: "Medium" },
  { id: "scene-11", timestamp: "27-29 sec", description: "Looks in mirror, confident.", vo: "None", shotType: "Medium" },
  { id: "scene-12", timestamp: "29-30 sec", type: "text", description: "Text on screen: Just one decision... to show up.", vo: "None", shotType: "Text" },
  { id: "scene-13", timestamp: "End Frame", type: "text", description: "Brand end card.", vo: "None", shotType: "Text" },
  { id: "scene-14", timestamp: "End Frame", description: "Walking out, stronger version.", vo: "None", shotType: "Wide" },
];

export default function PlannerPage() {
  const dispatch = useDispatch();
  const planner = useSelector(selectCreatorPlanner);
  const preview = useSelector(selectCreatorPreview);
  const storyboardLocal = useSelector(selectCreatorStoryboardLocal);
  const reduxTenantId = sanitizeTenantId(useSelector(selectTenantId));
  const authTenantId = sanitizeTenantId(useSelector((state) => state.auth?.user?.tenantId || null));
  const eventWallet = useSelector((state) => state.billing?.wallet || null);
  const localTenantId = useMemo(() => {
    try {
      return sanitizeTenantId(window.localStorage.getItem("tenantId"));
    } catch {
      return null;
    }
  }, []);
  const shouldRestoreStoredWorkflow = useMemo(() => shouldRestoreStoredWorkflowOnLoad(), []);
  const [storedWorkflowSnapshot] = useState(() => shouldRestoreStoredWorkflow ? readStoredCreatorWorkflow() : null);
  const [workflowRestored, setWorkflowRestored] = useState(() => !storedWorkflowSnapshot?.planner);

  const [filters, setFilters] = useState({ platform: "instagram_reels", category: "fitness", timeframe: "7d" });
  const [trendPage, setTrendPage] = useState(0);
  const trendPageSize = 8;
  const [trendChoiceMode, setTrendChoiceMode] = useState(TREND_DISCOVERY_ENABLED ? "trend" : "original");
  const [country, setCountry] = useState(countryOptions[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [extraIdeas, setExtraIdeas] = useState(() => normalizeStoredIdeas(storedWorkflowSnapshot?.extraIdeas));
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [savedIdeaSnapshots, setSavedIdeaSnapshots] = useState(() => normalizeSavedIdeaSnapshots(storedWorkflowSnapshot?.savedIdeaSnapshots || storedWorkflowSnapshot?.savedIdeas));
  const [savedIdeaIds, setSavedIdeaIds] = useState(() => {
    const storedIds = Array.isArray(storedWorkflowSnapshot?.savedIdeaIds) ? storedWorkflowSnapshot.savedIdeaIds : [];
    const snapshotIds = savedIdeaSnapshots.map((idea) => idea.id).filter(Boolean);
    return new Set(storedIds.length ? storedIds : snapshotIds);
  });
  const [storyboardSaved, setStoryboardSaved] = useState(() => Boolean(storedWorkflowSnapshot?.storyboardSaved));
  const [selectedDuration, setSelectedDuration] = useState(() => Number(storedWorkflowSnapshot?.selectedDuration) || 30);
  const [dialogueLanguage, setDialogueLanguage] = useState(() => storedWorkflowSnapshot?.dialogueLanguage || "Hinglish");
  const [screenType, setScreenType] = useState(() => storedWorkflowSnapshot?.screenType || "vertical");
  const [selectedProviderCode, setSelectedProviderCode] = useState(() => {
    try {
      return window.localStorage.getItem("creatorAiProviderCode") || "";
    } catch {
      return "";
    }
  });
  const [manualIdeaDraft, setManualIdeaDraft] = useState(() => storedWorkflowSnapshot?.manualIdeaDraft || "");
  const [lockedBrief, setLockedBrief] = useState(() => storedWorkflowSnapshot?.lockedBrief || null);
  const [lockedIdeaOptions, setLockedIdeaOptions] = useState(() => normalizeStoredIdeas(storedWorkflowSnapshot?.lockedIdeaOptions));
  const [ideaCandidatePageItems, setIdeaCandidatePageItems] = useState(() => normalizeStoredIdeas(storedWorkflowSnapshot?.ideaCandidatePageItems));
  const [ideaCandidatePageInfo, setIdeaCandidatePageInfo] = useState(() => storedWorkflowSnapshot?.ideaCandidatePageInfo || { number: 0, size: 5, totalPages: 1, totalElements: 0 });
  const [savedStoryIdeaId, setSavedStoryIdeaId] = useState(() => storedWorkflowSnapshot?.savedStoryIdeaId || null);
  const ideaCandidatePageSize = 5;
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptModalMode, setScriptModalMode] = useState("brief");
  const [storyScriptIdea, setStoryScriptIdea] = useState(() => storedWorkflowSnapshot?.storyScriptIdea || null);
  const [scriptDetailIdea, setScriptDetailIdea] = useState(() => storedWorkflowSnapshot?.scriptDetailIdea || null);
  const [predictionJobId, setPredictionJobId] = useState(null);
  const [localPredictedTrends, setLocalPredictedTrends] = useState([]);
  const [castPlan, setCastPlan] = useState(() => storedWorkflowSnapshot?.castPlan || null);
  const [selectedAudienceDecision, setSelectedAudienceDecision] = useState(() => storedWorkflowSnapshot?.selectedAudienceDecision || null);
  const [ideaGenerationJobId, setIdeaGenerationJobId] = useState(() => shouldRestoreStoredWorkflow ? readStoredIdeaGenerationJob()?.jobId || null : null);
  const [screenplayJobId, setScreenplayJobId] = useState(null);
  const [productionPlanJobId, setProductionPlanJobId] = useState(null);
  const [shotPlanRetry, setShotPlanRetry] = useState(null);
  const [shotPlanRetrySeconds, setShotPlanRetrySeconds] = useState(0);
  const [generatedIdeasOpen, setGeneratedIdeasOpen] = useState(false);
  const [selectedGeneratedTopicId, setSelectedGeneratedTopicId] = useState(null);
  const [recentIdeaJobsOpen, setRecentIdeaJobsOpen] = useState(false);
  const [pastHistoryModal, setPastHistoryModal] = useState(null);
  const [actorModalSignal, setActorModalSignal] = useState(0);
  const [recentIdeaJobsPage, setRecentIdeaJobsPage] = useState(0);
  const [workspacePage, setWorkspacePage] = useState(() => initialWorkspacePageFromLocation());
  const [storyboardJobId, setStoryboardJobId] = useState(null);
  const [generatedStoryboard, setGeneratedStoryboard] = useState(() => storedWorkflowSnapshot?.generatedStoryboard || null);
  const [shotImageLoadingKeys, setShotImageLoadingKeys] = useState([]);
  const [activity, setActivity] = useState([
    { label: "Storyboard generated", detail: "14-shot short preview", time: "4 min ago" },
    { label: "Audience confirmed", detail: "Women 22-35 in India", time: "2 min ago" },
    { label: "Trend selected", detail: "She Almost Didn't Go", time: "Just now" },
  ]);

  const { data: organization = {}, isFetching: organizationLoading, refetch: refetchOrganization } = useGetOrganizationQuery();
  const organizationTenantId = sanitizeTenantId(organization?.tenantId || organization?.id);
  const tenantId = reduxTenantId || organizationTenantId || localTenantId || authTenantId;

  const { data: combinationData = {} } = useGetTrendCombinationsQuery(undefined, { skip: !TREND_DISCOVERY_ENABLED });
  const { data: masterPlatforms = [] } = useGetCreatorPlatformsQuery(undefined, { skip: !TREND_DISCOVERY_ENABLED });
  const { data: masterCategories = [] } = useGetCreatorCategoriesQuery(undefined, { skip: !TREND_DISCOVERY_ENABLED });
  const { data: aiProviders = [], isFetching: aiProvidersLoading, isError: aiProvidersError } = useGetAiProvidersQuery();
  const { data: walletFromService, isFetching: walletLoading, refetch: refetchWallet } = useGetWalletBalanceQuery(tenantId, {
    skip: !tenantId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const wallet = walletFromService || eventWallet || { balance: 0, currency: organization?.currency || "INR" };
  const { data: subscription = { planName: "Creator Starter", creatorEntitlements: {} }, isFetching: subscriptionLoading } = useGetCreatorSubscriptionQuery();
  const { data: trendsData = [], isFetching } = useGetTrendsQuery(
    {
      ...filters,
      platform: normalizePlatformCode(filters.platform),
      country: country.code,
      days: timeframeToDays(filters.timeframe),
      page: trendPage,
      size: trendPageSize,
    },
    { skip: !TREND_DISCOVERY_ENABLED }
  );
  const [predictTrends, predictState] = usePredictTrendsMutation();
  const [suggestAudience, suggestAudienceState] = useSuggestAudienceMutation();
  const [confirmAudience, confirmAudienceState] = useConfirmAudienceMutation();
  const { data: creators = [] } = useListCreatorsQuery();
  const [createCreator, createCreatorState] = useCreateCreatorMutation();
  const [updateCreator, updateCreatorState] = useUpdateCreatorMutation();
  const [generateIdeas, ideasState] = useGenerateIdeasMutation();
  const [generateLockedIdeaOptions, generatedIdeaState] = useGenerateLockedIdeaOptionsMutation();
  const [generateLockedIdeaOptionsAsync, generatedIdeaAsyncState] = useGenerateLockedIdeaOptionsAsyncMutation();
  const [fetchJobStatus] = useLazyGetJobQuery();
  const [saveStoryIdea, saveStoryIdeaState] = useSaveStoryIdeaMutation();
  const [generateStoryIdeaScript, generateScriptState] = useGenerateStoryIdeaScriptMutation();
  const [saveStoryIdeaScript, saveStoryScriptState] = useSaveStoryIdeaScriptMutation();
  const [saveCharacterCastMappings, saveCharacterCastMappingsState] = useSaveCharacterCastMappingsMutation();
  const [generateStoryIdeaScreenplay, generateScreenplayState] = useGenerateStoryIdeaScreenplayMutation();
  const [generateStoryIdeaScreenplayAsync, generateScreenplayAsyncState] = useGenerateStoryIdeaScreenplayAsyncMutation();
  const [saveGeneratedScript, saveGeneratedScriptState] = useSaveGeneratedScriptMutation();
  const [lockIdeaSelection, lockSelectionState] = useLockIdeaSelectionMutation();
  const [generateStoryboardFromScript, generateStoryboardState] = useGenerateStoryboardFromScriptMutation();
  const [generateStoryboardFromScriptAsync, generateStoryboardAsyncState] = useGenerateStoryboardFromScriptAsyncMutation();
  const [generateProductionPlansAsync, generateProductionPlansState] = useGenerateProductionPlansAsyncMutation();
  const [generateShotImage, generateShotImageState] = useGenerateShotImageMutation();
  const [saveStoryboard] = useSaveStoryboardMutation();
  const [unsaveStoryboard] = useUnsaveStoryboardMutation();
  const [requestExport, exportState] = useRequestExportMutation();
  const [createWalletRecharge, rechargeState] = useAddWalletBalanceMutation();
  const [setupOrganization, setupOrganizationState] = useSetupOrganizationMutation();
  const [startSubscriptionUpgrade, upgradeState] = useStartSubscriptionUpgradeMutation();
  const { data: predictionJob } = useGetJobQuery(predictionJobId, { skip: !predictionJobId, pollingInterval: predictionJobId ? 1600 : 0 });
  const { data: ideaGenerationJob } = useGetJobQuery(ideaGenerationJobId, { skip: !ideaGenerationJobId, pollingInterval: ideaGenerationJobId ? 1600 : 0 });
  const { data: screenplayJob } = useGetJobQuery(screenplayJobId, { skip: !screenplayJobId, pollingInterval: screenplayJobId ? 1600 : 0 });
  const { data: productionPlanJob } = useGetJobQuery(productionPlanJobId, { skip: !productionPlanJobId, pollingInterval: productionPlanJobId ? 1600 : 0 });
  const { data: creatorProjects = [], isFetching: creatorProjectsLoading, refetch: refetchCreatorProjects } = useGetCreatorProjectsQuery(
    { limit: 12 },
    { skip: !tenantId, refetchOnMountOrArgChange: true }
  );
  const [fetchCreatorProject, fetchCreatorProjectState] = useLazyGetCreatorProjectQuery();
  const { data: ideaGenerationJobs = [], isFetching: ideaGenerationJobsLoading, refetch: refetchIdeaGenerationJobs } = useGetJobsQuery(
    { jobType: "IDEA_GENERATE" },
    { skip: !tenantId, pollingInterval: ideaGenerationJobId ? 5000 : 0, refetchOnMountOrArgChange: true }
  );
  const { data: storyboardJob } = useGetJobQuery(storyboardJobId, { skip: !storyboardJobId, pollingInterval: storyboardJobId ? 1600 : 0 });
  const { data: backendProductionPlans = [], isFetching: productionPlansLoading, refetch: refetchProductionPlans } = useGetProductionPlansQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    { skip: !scriptDetailIdea?.scriptId || productionPlanJobId }
  );
  const { data: backendShotImageUrls = [], isFetching: shotImageUrlsLoading } = useGetShotImageUrlsQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    { skip: !scriptDetailIdea?.scriptId, refetchOnMountOrArgChange: true }
  );
  const { data: backendStorylineHistory = [], isFetching: storylineHistoryLoading } = useGetCreatorStorylineHistoryQuery(
    { limit: 30 },
    { skip: !tenantId || pastHistoryModal !== "storyline", refetchOnMountOrArgChange: true }
  );
  const { data: backendScriptHistory = [], isFetching: scriptHistoryLoading } = useGetCreatorScriptHistoryQuery(
    { limit: 30 },
    { skip: !tenantId || pastHistoryModal !== "script", refetchOnMountOrArgChange: true }
  );
  const [fetchStorylineHistoryItem, fetchStorylineHistoryItemState] = useLazyGetCreatorStorylineHistoryItemQuery();
  const [fetchScriptHistoryItem, fetchScriptHistoryItemState] = useLazyGetCreatorScriptHistoryItemQuery();
  const legacyStoryboardQueriesEnabled = false;
  const { data: storyboardHistory = [] } = useGetStoryboardHistoryQuery({ limit: 6 }, { skip: !legacyStoryboardQueriesEnabled });
  const { data: savedStoryboards = [] } = useGetSavedStoryboardsQuery({ limit: 6 }, { skip: !legacyStoryboardQueriesEnabled });
  const { data: storyboard } = useGetStoryboardQuery(planner.projectId, { skip: !legacyStoryboardQueriesEnabled || !isUuid(planner.projectId) });

  const trendResult = useMemo(() => normalizeTrendResult(trendsData, trendPage, trendPageSize), [trendPage, trendsData]);
  const apiTrends = TREND_DISCOVERY_ENABLED
    ? trendResult.items.length ? trendResult.items : fallbackTrends.map(normalizeTrend)
    : [];
  const trends = useMemo(() => {
    if (!TREND_DISCOVERY_ENABLED) return [];
    const merged = [...localPredictedTrends, ...apiTrends];
    return merged.filter((trend, index) => merged.findIndex((candidate) => candidate.id === trend.id) === index);
  }, [apiTrends, localPredictedTrends]);
  const currentStoryboard = generatedStoryboard || storyboard;
  const activeProjectId = isUuid(planner.projectId)
    ? planner.projectId
    : isUuid(lockedBrief?.projectId)
      ? lockedBrief.projectId
      : null;
  const projectWorkspaceMode = Boolean(activeProjectId);
  const platformOptions = useMemo(() => normalizePlatformOptions(
    masterPlatforms.length ? masterPlatforms : combinationData.platforms || [
      { code: "instagram_reels", label: "Instagram Reels" },
      { code: "youtube_shorts", label: "YouTube Shorts" },
      { code: "tiktok", label: "TikTok" },
    ]
  ), [combinationData.platforms, masterPlatforms]);
  const categoryOptions = useMemo(() => normalizeCategoryOptions(
    masterCategories.length ? masterCategories : combinationData.categories || [
      { code: "fitness", label: "Fitness" },
      { code: "beauty", label: "Beauty" },
      { code: "food", label: "Food" },
      { code: "study", label: "Study" },
    ]
  ), [combinationData.categories, masterCategories]);
  const validCombinations = combinationData.combinations || [];
  const isValidCombination = !validCombinations.length || validCombinations.some(
    (combo) => combo.active !== false
      && normalizePlatformCode(combo.platformCode) === normalizePlatformCode(filters.platform)
      && combo.categoryCode === filters.category
  );

  useEffect(() => {
    const platformCodes = platformOptions.map((option) => option.code).filter(Boolean);
    const categoryCodes = categoryOptions.map((option) => option.code).filter(Boolean);
    const normalizedPlatform = normalizePlatformCode(filters.platform);
    const nextPlatform = platformCodes.length && !platformCodes.includes(normalizedPlatform) ? platformCodes[0] : normalizedPlatform;
    const nextCategory = categoryCodes.length && !categoryCodes.includes(filters.category) ? categoryCodes[0] : filters.category;

    if (nextPlatform !== filters.platform || nextCategory !== filters.category) {
      setFilters((current) => ({
        ...current,
        platform: nextPlatform,
        category: nextCategory,
      }));
      setTrendPage(0);
    }
  }, [categoryOptions, filters.category, filters.platform, platformOptions]);

  const availableAiProviders = aiProviders.length ? aiProviders : fallbackAiProviderCatalog;
  const recentIdeaGenerationJobs = useMemo(
    () => normalizeGenerationJobs(ideaGenerationJobs)
      .filter((job) => String(job.jobType || "").toUpperCase() === "IDEA_GENERATE")
      .sort((left, right) => jobTimestampMs(right) - jobTimestampMs(left))
      .slice(0, 30),
    [ideaGenerationJobs]
  );
  const recentIdeaJobsPageSize = 6;
  const recentIdeaJobsTotalPages = Math.max(1, Math.ceil(recentIdeaGenerationJobs.length / recentIdeaJobsPageSize));
  const safeRecentIdeaJobsPage = Math.min(recentIdeaJobsPage, recentIdeaJobsTotalPages - 1);
  const recentIdeaJobPageItems = recentIdeaGenerationJobs.slice(
    safeRecentIdeaJobsPage * recentIdeaJobsPageSize,
    safeRecentIdeaJobsPage * recentIdeaJobsPageSize + recentIdeaJobsPageSize
  );
  const successfulGeneratedTopics = useMemo(
    () => recentIdeaGenerationJobs
      .filter((job) => isCompletedJobStatus(job.status))
      .map((job) => {
        const page = extractPageFromGenerationJob(job);
        const brief = buildLockedBriefFromGenerationJob(job);
        const ideas = (Array.isArray(page?.content) ? page.content : [])
          .map((idea) => normalizeGeneratedIdea(idea))
          .filter((idea) => idea?.id);
        return buildGeneratedTopicItem({
          job,
          brief,
          ideas,
        });
      })
      .filter((item) => item.ideas.length)
      .sort((left, right) => generatedTopicTimestampMs(right) - generatedTopicTimestampMs(left)),
    [recentIdeaGenerationJobs]
  );
  const selectedAiProvider = useMemo(() => {
    if (!availableAiProviders.length) return null;
    return availableAiProviders.find((provider) => provider.code === selectedProviderCode)
      || availableAiProviders.find((provider) => provider.defaultProvider)
      || availableAiProviders[0];
  }, [availableAiProviders, selectedProviderCode]);
  const aiProviderContext = useMemo(() => buildAiProviderContext(selectedAiProvider), [selectedAiProvider]);
  const baseIdeas = ideasState.data?.ideas || currentStoryboard?.ideas || fallbackIdeas;
  const ideas = useMemo(() => {
    const merged = [...baseIdeas, ...lockedIdeaOptions, ...extraIdeas, ...savedIdeaSnapshots];
    return merged.filter((idea, index) => merged.findIndex((candidate) => candidate.id === idea.id) === index);
  }, [baseIdeas, lockedIdeaOptions, extraIdeas, savedIdeaSnapshots]);
  const storyboardSourceScenes = currentStoryboard?.shots?.length ? currentStoryboard.shots : currentStoryboard?.scenes?.length ? currentStoryboard.scenes : [];
  const productionPlanTags = useMemo(
    () => {
      const hasPlanSource = Boolean(
        scriptDetailIdea?.scriptId
        || scriptDetailIdea?.productionPlanTags?.length
        || scriptDetailIdea?.scriptScenes?.length
        || scriptDetailIdea?.scriptJson?.shots?.length
        || currentStoryboard?.productionPlanTags?.length
        || currentStoryboard?.scenes?.length
      );
      if (!hasPlanSource) return [];
      const jobPlans = productionPlanJob?.result?.productionPlanTags || [];
      const jobFocusedShot = Number(productionPlanJob?.result?.focusedShotNumber || productionPlanJob?.input?.focusedShotNumber || productionPlanJob?.inputPayload?.focusedShotNumber || 0);
      if (jobPlans.length && jobFocusedShot) {
        return mergeProductionPlanTags(backendProductionPlans.length ? backendProductionPlans : scriptDetailIdea?.productionPlanTags || [], jobPlans);
      }
      if (jobPlans.length) return jobPlans;
      if (backendProductionPlans.length) return backendProductionPlans;
      if (currentStoryboard?.productionPlanTags?.length) return currentStoryboard.productionPlanTags;
      const scenePlans = extractProductionPlanTagsFromScenes(currentStoryboard?.scenes);
      if (scenePlans.length) return scenePlans;
      const scriptScenePlans = extractProductionPlanTagsFromScenes(scriptDetailIdea?.scriptScenes?.length ? scriptDetailIdea.scriptScenes : scriptDetailIdea?.scriptJson?.shots);
      if (scriptScenePlans.length) return scriptScenePlans;
      return scriptDetailIdea?.productionPlanTags || [];
    },
    [backendProductionPlans, currentStoryboard?.productionPlanTags, currentStoryboard?.scenes, productionPlanJob?.input?.focusedShotNumber, productionPlanJob?.inputPayload?.focusedShotNumber, productionPlanJob?.result?.focusedShotNumber, productionPlanJob?.result?.productionPlanTags, scriptDetailIdea?.productionPlanTags, scriptDetailIdea?.scriptId, scriptDetailIdea?.scriptJson?.shots, scriptDetailIdea?.scriptScenes]
  );
  const screenplayPlanScenes = useMemo(
    () => mergeScreenplayScenesWithProductionPlans(scriptDetailIdea?.scriptScenes || scriptDetailIdea?.scriptJson?.shots || [], productionPlanTags),
    [productionPlanTags, scriptDetailIdea?.scriptJson?.shots, scriptDetailIdea?.scriptScenes]
  );
  const baseScenes = storyboardSourceScenes.length ? storyboardSourceScenes : screenplayPlanScenes.length ? screenplayPlanScenes : fallbackScenes;
  const scenes = useMemo(
    () => mergeShotImageUrlsIntoScenes(baseScenes, backendShotImageUrls),
    [backendShotImageUrls, baseScenes]
  );
  const backendShotImageLoadingKeys = useMemo(
    () => shotImageUrlsLoading ? shotImageLoadingKeysForScenes(baseScenes) : [],
    [baseScenes, shotImageUrlsLoading]
  );
  const visibleShotImageLoadingKeys = useMemo(
    () => [...shotImageLoadingKeys, ...backendShotImageLoadingKeys],
    [backendShotImageLoadingKeys, shotImageLoadingKeys]
  );
  const shotPlanLoading = productionPlansLoading || generateProductionPlansState.isLoading || Boolean(productionPlanJobId);
  const selectedCreator = castPlan || creators.find((creator) => creator.id === planner.selectedCreatorId) || buildDefaultCastPlan(creators);
  const selectedScene = scenes[preview.currentSceneIndex] || scenes[0];
  const selectedTrend = useMemo(
    () => TREND_DISCOVERY_ENABLED ? trends.find((trend) => trend.id === planner.selectedTrendId) || trends[0] : null,
    [planner.selectedTrendId, trends]
  );
  const shouldFetchTrendInsight = Boolean(selectedTrend?.id && isUuid(selectedTrend.id));
  const { data: trendInsight, isFetching: insightLoading } = useGetTrendInsightQuery(
    { trendId: selectedTrend?.id, country: country.code, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { skip: !TREND_DISCOVERY_ENABLED || !shouldFetchTrendInsight }
  );
  const selectedTrendInsight = trendInsight || buildPendingTrendInsight(selectedTrend);
  const selectedIdea = useMemo(() => ideas.find((idea) => idea.id === planner.selectedIdeaId) || ideas[0], [ideas, planner.selectedIdeaId]);
  const projectGeneratedIdeas = useMemo(() => {
    const projectIdeas = mergeUniqueIdeas([], [
      ...ideaCandidatePageItems,
      ...lockedIdeaOptions,
      ...(savedStoryIdeaId && selectedIdea ? [selectedIdea] : []),
    ]).filter((idea) => idea?.id && !String(idea.id).startsWith("idea-she-almost"));
    return projectIdeas.map((idea) => ({
      job: {
        jobId: `project-${idea.id}`,
        status: "COMPLETED",
        createdAt: idea.generatedAt || idea.updatedAt || null,
      },
      brief: lockedBrief,
      idea: normalizeGeneratedIdea(idea),
    }));
  }, [ideaCandidatePageItems, lockedBrief, lockedIdeaOptions, savedStoryIdeaId, selectedIdea]);
  const projectGeneratedTopic = useMemo(
    () => projectGeneratedIdeas.length ? buildGeneratedTopicItem({
      job: {
        jobId: "current-project-generated-ideas",
        status: "COMPLETED",
        createdAt: projectGeneratedIdeas.map((item) => item.job?.createdAt).filter(Boolean).sort().at(-1),
      },
      brief: lockedBrief,
      ideas: projectGeneratedIdeas.map((item) => item.idea),
    }) : null,
    [lockedBrief, projectGeneratedIdeas]
  );
  const displayedGeneratedTopics = useMemo(
    () => mergeGeneratedTopicLibraryItems([
      ...successfulGeneratedTopics,
      ...(projectGeneratedTopic ? [projectGeneratedTopic] : []),
    ])
      .sort((left, right) => generatedTopicTimestampMs(right) - generatedTopicTimestampMs(left)),
    [projectGeneratedTopic, successfulGeneratedTopics]
  );
  const selectedGeneratedTopic = useMemo(
    () => displayedGeneratedTopics.find((topic) => topic.id === selectedGeneratedTopicId) || null,
    [displayedGeneratedTopics, selectedGeneratedTopicId]
  );
  const activeStoryIdeaForCast = scriptDetailIdea || storyScriptIdea || selectedIdea;
  const activeStoryIdeaIdForCast = activeStoryIdeaForCast?.id;
  const activeStoryCharactersForCast = useMemo(
    () => resolveStoryCharactersForCast(activeStoryIdeaForCast, storyScriptIdea, selectedIdea),
    [activeStoryIdeaForCast, storyScriptIdea, selectedIdea]
  );
  const shouldFetchCharacterCastMappings = Boolean(isUuid(lockedBrief?.lockedIdeaId) && isUuid(activeStoryIdeaIdForCast));
  const { data: characterCastMappingData = { mappings: [] } } = useGetCharacterCastMappingsQuery(
    { lockedIdeaId: lockedBrief?.lockedIdeaId, storyIdeaId: activeStoryIdeaIdForCast },
    { skip: !shouldFetchCharacterCastMappings }
  );
  useEffect(() => {
    if (!isUuid(characterCastMappingData?.projectId) || activeProjectId) return;
    dispatch(setProjectId(characterCastMappingData.projectId));
    void refetchCreatorProjects?.();
  }, [activeProjectId, characterCastMappingData?.projectId, dispatch, refetchCreatorProjects]);
  const savedIdeas = useMemo(() => {
    const savedById = new Map();
    savedIdeaSnapshots.forEach((idea) => {
      if (idea?.id && savedIdeaIds.has(idea.id)) savedById.set(idea.id, idea);
    });
    ideas.forEach((idea) => {
      if (!idea?.id || !savedIdeaIds.has(idea.id)) return;
      savedById.set(idea.id, { ...(savedById.get(idea.id) || {}), ...idea });
    });
    return Array.from(savedById.values());
  }, [ideas, savedIdeaIds, savedIdeaSnapshots]);

  useEffect(() => {
    if (!storedWorkflowSnapshot?.planner) {
      setWorkflowRestored(true);
      return;
    }
    dispatch(restorePlannerState(storedWorkflowSnapshot.planner));
    setWorkflowRestored(true);
  }, [dispatch, storedWorkflowSnapshot]);

  useEffect(() => {
    const visibleSavedIdeas = ideas.filter((idea) => idea?.id && savedIdeaIds.has(idea.id));
    if (!visibleSavedIdeas.length) return;
    setSavedIdeaSnapshots((current) => {
      const merged = mergeUniqueIdeas(current, visibleSavedIdeas);
      const unchanged = merged.length === current.length
        && merged.every((idea, index) => {
          const previous = current[index];
          return previous?.id === idea?.id
            && previous?.title === idea?.title
            && previous?.description === idea?.description
            && previous?.status === idea?.status;
        });
      return unchanged ? current : merged;
    });
  }, [ideas, savedIdeaIds]);

  useEffect(() => {
    if (!workflowRestored) return;
    persistStoredCreatorWorkflow({
      planner: {
        activeStep: planner.activeStep,
        completedSteps: planner.completedSteps,
        selectedTrendId: planner.selectedTrendId,
        selectedAudienceId: planner.selectedAudienceId,
        selectedCreatorId: planner.selectedCreatorId,
        selectedIdeaId: planner.selectedIdeaId,
        projectId: activeProjectId || planner.projectId,
      },
      workspacePage,
      lockedBrief,
      lockedIdeaOptions,
      ideaCandidatePageItems,
      ideaCandidatePageInfo,
      savedStoryIdeaId,
      storyScriptIdea,
      scriptDetailIdea,
      castPlan,
      selectedAudienceDecision,
      generatedStoryboard,
      storyboardSaved,
      selectedDuration,
      dialogueLanguage,
      screenType,
      manualIdeaDraft,
      savedIdeaIds: Array.from(savedIdeaIds),
      savedIdeaSnapshots,
      extraIdeas,
      updatedAt: new Date().toISOString(),
    });
  }, [
    activeProjectId,
    castPlan,
    dialogueLanguage,
    extraIdeas,
    generatedStoryboard,
    ideaCandidatePageInfo,
    ideaCandidatePageItems,
    lockedBrief,
    lockedIdeaOptions,
    manualIdeaDraft,
    planner.activeStep,
    planner.completedSteps,
    planner.projectId,
    planner.selectedAudienceId,
    planner.selectedCreatorId,
    planner.selectedIdeaId,
    planner.selectedTrendId,
    savedIdeaIds,
    savedIdeaSnapshots,
    savedStoryIdeaId,
    screenType,
    scriptDetailIdea,
    selectedAudienceDecision,
    selectedDuration,
    storyboardSaved,
    storyScriptIdea,
    workflowRestored,
    workspacePage,
  ]);
  const fallbackAudienceSummary = useMemo(
    () => buildAudienceSuggestionForPlanner(selectedIdea, selectedTrend, country),
    [country, selectedIdea, selectedTrend]
  );
  const selectedAudienceSummary = selectedAudienceDecision || fallbackAudienceSummary;
  const savedBriefMatchesCurrentMode = TREND_DISCOVERY_ENABLED && trendChoiceMode === "trend"
    ? Boolean(lockedBrief?.source === "trend" && lockedBrief?.trendId === selectedTrend?.id)
    : Boolean(lockedBrief?.source === "original" && lockedBrief?.description === manualIdeaDraft.trim());
  const activeStoryboardId = currentStoryboard?.id || currentStoryboard?.storyboardId || planner.projectId;
  const workflowDisplaySlides = useMemo(
    () => projectWorkspaceMode
      ? workflowSlides.filter((slide) => slide.id !== "ideas")
      : workflowSlides,
    [projectWorkspaceMode]
  );
  const activeWorkflowStepIndex = workflowDisplaySlides.findIndex((slide) => slide.id === planner.activeStep);
  const workflowIndex = activeWorkflowStepIndex >= 0
    ? activeWorkflowStepIndex
    : planner.activeStep === "storyboard"
      ? workflowDisplaySlides.length - 1
      : 0;
  const activeWorkflowSlide = workflowDisplaySlides[workflowIndex] || workflowDisplaySlides[0];
  const screenplayShotCount = scriptDetailIdea?.scriptJson?.shots?.length || scriptDetailIdea?.scriptScenes?.length || 0;
  const selectedCreatorMappings = Array.isArray(selectedCreator?.characterMappings) ? selectedCreator.characterMappings : [];
  const backendCharacterMappings = Array.isArray(characterCastMappingData?.mappings) ? characterCastMappingData.mappings : [];
  const activeCharacterMappings = selectedCreatorMappings.length ? selectedCreatorMappings : backendCharacterMappings;
  const mappedCharacterCount = activeCharacterMappings
    .filter((mapping) => mapping?.actorId || mapping?.actorName || mapping?.actorIds?.length || mapping?.castProfileId || mapping?.castDisplayName)
    .length;
  const castStepComplete = Boolean(planner.completedSteps.cast || mappedCharacterCount || castPlan?.characterMappings?.length || characterCastMappingData?.mappings?.length);
  const freshNewIdeaMode = !activeProjectId
    && !lockedBrief
    && !savedStoryIdeaId
    && !storyScriptIdea
    && !scriptDetailIdea
    && !castPlan
    && !selectedAudienceDecision
    && !generatedStoryboard
    && !storyboardSaved;
  const effectiveStoryScriptReady = !freshNewIdeaMode && Boolean(storyScriptIdea);
  const effectiveCastStepComplete = !freshNewIdeaMode
    && Boolean(storyScriptIdea || scriptDetailIdea || castPlan || activeProjectId)
    && castStepComplete;
  const effectiveAudienceStepComplete = !freshNewIdeaMode && Boolean(selectedAudienceDecision || planner.completedSteps.audience);
  const effectiveScreenplayReady = !freshNewIdeaMode && Boolean(scriptDetailIdea);
  const effectiveShotPlansReady = !freshNewIdeaMode && Boolean(productionPlanTags.length || storyboardSaved || generatedStoryboard);
  const usedGeneratedIdeaIds = useMemo(
    () => new Set([savedStoryIdeaId, storyScriptIdea?.id, scriptDetailIdea?.id].filter(Boolean).map((id) => String(id))),
    [savedStoryIdeaId, scriptDetailIdea?.id, storyScriptIdea?.id]
  );
  const selectedStoryIdeaMarkerIds = useMemo(
    () => new Set([savedStoryIdeaId, planner.completedSteps.ideas ? planner.selectedIdeaId : null].filter(Boolean).map((id) => String(id))),
    [planner.completedSteps.ideas, planner.selectedIdeaId, savedStoryIdeaId]
  );
  const workflowSlideStates = {
    ideas: Boolean(savedStoryIdeaId),
    script: effectiveStoryScriptReady,
    screenplay: effectiveScreenplayReady,
    cast: effectiveCastStepComplete,
  };
  const workflowStatusItems = [
    {
      id: "brief",
      label: projectWorkspaceMode ? "Brief" : TREND_DISCOVERY_ENABLED ? "Brief" : "Topic",
      value: lockedBrief?.title || (projectWorkspaceMode ? "Project brief restored" : TREND_DISCOVERY_ENABLED ? "Save a trend or original idea" : "Write a topic to generate content about"),
      done: Boolean(lockedBrief || projectWorkspaceMode),
      active: planner.activeStep === "trend",
    },
    {
      id: "idea",
      label: "Idea",
      value: savedStoryIdeaId ? selectedIdea?.title || "Story idea saved" : projectWorkspaceMode ? selectedIdea?.title || "Idea selection pending" : selectedIdea?.title || "Pick a story idea",
      done: Boolean(savedStoryIdeaId || (projectWorkspaceMode && selectedIdea?.id)),
      active: activeWorkflowSlide.id === "ideas",
    },
    {
      id: "script",
      label: "Storyline",
      value: storyScriptIdea ? storyScriptIdea.title || "Story script ready" : "Generate story script",
      done: effectiveStoryScriptReady,
      active: activeWorkflowSlide.id === "script",
    },
    {
      id: "cast",
      label: "Actor",
      value: effectiveCastStepComplete
        ? `${mappedCharacterCount || selectedCreator?.actors?.length || 0} mappings saved`
        : "Map characters to actors",
      done: effectiveCastStepComplete,
      active: activeWorkflowSlide.id === "cast",
    },
    {
      id: "screenplay",
      label: "Script",
      value: scriptDetailIdea ? `${screenplayShotCount || "Shot-wise"} pages ready` : "Generate screenplay",
      done: effectiveScreenplayReady,
      active: activeWorkflowSlide.id === "screenplay",
    },
  ];
  const visibleWorkflowStatusItems = projectWorkspaceMode
    ? workflowStatusItems.filter((item) => item.id !== "brief" && item.id !== "idea")
    : workflowStatusItems;
  const workspacePages = [
    {
      id: "ideas",
      label: "New Idea",
      kicker: TREND_DISCOVERY_ENABLED ? "Trend or topic" : "Topic",
      description: lockedBrief?.title ? `Current: ${lockedBrief.title}` : (TREND_DISCOVERY_ENABLED ? "Save a trend or original idea" : "Write and save a topic"),
      done: false,
      locked: false,
    },
    {
      id: "generated-ideas",
      label: "Generated Ideas",
      kicker: "Library",
      description: displayedGeneratedTopics.length
        ? `${displayedGeneratedTopics.length} past topics, newest first`
        : ideaGenerationJobsLoading ? "Loading completed jobs" : "Past generated ideas will appear here",
      done: false,
      locked: false,
    },
    {
      id: "script",
      label: "Storyline",
      kicker: "Story",
      description: storyScriptIdea?.title || getWorkflowGateMessage("script") || "Generate story from selected idea",
      done: effectiveStoryScriptReady,
      locked: Boolean(getWorkflowGateMessage("script")),
    },
    {
      id: "cast",
      label: "Actor",
      kicker: "Cast mapping",
      description: effectiveCastStepComplete ? `${mappedCharacterCount || selectedCreator?.actors?.length || 0} mappings saved` : "Add actors and map characters",
      done: effectiveCastStepComplete,
      locked: false,
    },
    {
      id: "screenplay",
      label: "Script",
      kicker: "Shots",
      description: scriptDetailIdea
        ? `${screenplayShotCount || "Shot-wise"} pages ready - ${productionPlanTags.length || 0} plan tags`
        : getWorkflowGateMessage("screenplay") || "Generate shot-wise script",
      done: effectiveScreenplayReady,
      locked: Boolean(getWorkflowGateMessage("screenplay")),
    },
    {
      id: "storyboard",
      label: "Storyboard",
      kicker: "Plan",
      description: productionPlanTags.length ? `${productionPlanTags.length} shot plans ready` : getWorkflowGateMessage("storyboard") || "Generate readable shot plans",
      done: effectiveShotPlansReady,
      locked: Boolean(getWorkflowGateMessage("storyboard")),
    },
  ];
  const visibleWorkspacePages = projectWorkspaceMode
    ? workspacePages
        .filter((page) => page.id !== "ideas" && page.id !== "generated-ideas")
    : workspacePages;
  const activeWorkspaceMeta = visibleWorkspacePages.find((page) => page.id === workspacePage) || visibleWorkspacePages[0] || workspacePages[0];

  useEffect(() => {
    if (!projectWorkspaceMode || (workspacePage !== "ideas" && workspacePage !== "generated-ideas")) return;
    setGeneratedIdeasOpen(false);
    setSelectedGeneratedTopicId(null);
    setWorkspacePage("script");
    window.history.replaceState(null, "", "/#script");
  }, [projectWorkspaceMode, workspacePage]);

  useEffect(() => {
    if (projectWorkspaceMode || workspacePage !== "generated-ideas") return;
    setGeneratedIdeasOpen(true);
  }, [projectWorkspaceMode, workspacePage]);

  useEffect(() => {
    if (!selectedGeneratedTopicId) return;
    if (displayedGeneratedTopics.some((topic) => topic.id === selectedGeneratedTopicId)) return;
    setSelectedGeneratedTopicId(null);
  }, [displayedGeneratedTopics, selectedGeneratedTopicId]);

  useEffect(() => {
    const syncWorkspaceFromHash = () => {
      if (!window.location.hash) return;
      if (window.location.hash === "#projects") {
        setProjectsOpen(true);
        return;
      }
      if (window.location.hash === "#past-storyline" || window.location.hash === "#past-script") {
        setPastHistoryModal(window.location.hash === "#past-storyline" ? "storyline" : "script");
        return;
      }
      setWorkspacePage(pageFromHash(window.location.hash));
    };
    syncWorkspaceFromHash();
    window.addEventListener("hashchange", syncWorkspaceFromHash);
    return () => window.removeEventListener("hashchange", syncWorkspaceFromHash);
  }, []);

  useEffect(() => {
    const openProjects = () => setProjectsOpen(true);
    window.addEventListener("creator:open-projects", openProjects);
    if (window.location.hash === "#projects") {
      setProjectsOpen(true);
    }
    return () => window.removeEventListener("creator:open-projects", openProjects);
  }, []);

  useEffect(() => {
    if (!workflowStepIds.has(workspacePage) || planner.activeStep === workspacePage) return;
    const gateMessage = getWorkflowGateMessage(workspacePage);
    if (gateMessage) {
      setWorkspacePage(workflowStepIds.has(planner.activeStep) ? planner.activeStep : "ideas");
      return;
    }
    dispatch(setActiveStep(workspacePage));
  }, [
    dispatch,
    effectiveAudienceStepComplete,
    effectiveCastStepComplete,
    effectiveScreenplayReady,
    planner.activeStep,
    scriptDetailIdea,
    storyScriptIdea,
    workspacePage,
  ]);

  useEffect(() => {
    if (!effectiveCastStepComplete || planner.completedSteps.cast) return;
    dispatch(completeStep("cast"));
  }, [dispatch, effectiveCastStepComplete, planner.completedSteps.cast]);

  useEffect(() => {
    if (workspacePage !== "storyboard") return;
    const gateMessage = getWorkflowGateMessage("storyboard");
    if (!gateMessage) return;
    setWorkspacePage(workflowStepIds.has(planner.activeStep) ? planner.activeStep : "ideas");
  }, [
    effectiveScreenplayReady,
    planner.activeStep,
    workspacePage,
  ]);

  useEffect(() => {
    if (!organizationTenantId || reduxTenantId === organizationTenantId) return;
    dispatch(setTenantIdentity(extractOrganizationIdentity(organization)));
    persistTenantId(organizationTenantId);
  }, [dispatch, organization, organizationTenantId, reduxTenantId]);

  useEffect(() => {
    if (!availableAiProviders.length) return;
    const hasSelected = availableAiProviders.some((provider) => provider.code === selectedProviderCode);
    if (hasSelected) return;
    const nextProvider = availableAiProviders.find((provider) => provider.defaultProvider) || availableAiProviders[0];
    setSelectedProviderCode(nextProvider?.code || "");
  }, [availableAiProviders, selectedProviderCode]);

  useEffect(() => {
    if (!selectedProviderCode) return;
    try {
      window.localStorage.setItem("creatorAiProviderCode", selectedProviderCode);
    } catch {
      // Provider choice stays in component state if local storage is unavailable.
    }
  }, [selectedProviderCode]);

  useEffect(() => {
    if (!tenantId || typeof window === "undefined") return undefined;
    const refetch = () => {
      try {
        void refetchWallet?.();
      } catch {
        // The wallet query may not be started yet on the first tenant render.
      }
    };
    window.addEventListener("wallet-funded", refetch);
    window.addEventListener("wallet-refetch", refetch);
    return () => {
      window.removeEventListener("wallet-funded", refetch);
      window.removeEventListener("wallet-refetch", refetch);
    };
  }, [refetchWallet, tenantId]);

  useEffect(() => {
    if (TREND_DISCOVERY_ENABLED
      && !ideasState.data
      && isUuid(planner.selectedTrendId)
      && isUuid(planner.selectedAudienceId)
      && isUuid(planner.selectedCreatorId)) {
      void generateIdeas({
        trendId: planner.selectedTrendId,
        audienceId: planner.selectedAudienceId,
        creatorId: planner.selectedCreatorId,
      }).unwrap().catch(() => {});
    }
  }, [generateIdeas, ideasState.data, planner.selectedAudienceId, planner.selectedCreatorId, planner.selectedTrendId]);

  useEffect(() => {
    dispatch(setDurationMs((currentStoryboard?.durationSeconds || currentStoryboard?.duration || selectedDuration) * 1000));
  }, [currentStoryboard?.duration, currentStoryboard?.durationSeconds, dispatch, selectedDuration]);

  useEffect(() => {
    const status = String(predictionJob?.status || "").toUpperCase();
    if (isCompletedJobStatus(status)) {
      addActivity("Trend prediction ready", `${filterLabels.category[filters.category] || filters.category} - ${country.label}`);
      flash("Predicted trends are ready", "success");
      setPredictionJobId(null);
      return;
    }
    if (isFailedJobStatus(status)) {
      addActivity("Trend prediction failed", `${filterLabels.category[filters.category] || filters.category} - ${country.label}`);
      flash("Trend prediction failed. Try again.", "error");
      setPredictionJobId(null);
    }
  }, [predictionJob?.status]);

  useEffect(() => {
    const status = String(screenplayJob?.status || "").toUpperCase();
    if (isFailedJobStatus(status)) {
      setScreenplayJobId(null);
      addActivity("Screenplay generation failed", selectedIdea?.title || storyScriptIdea?.title || "Story idea");
      flash(screenplayJob?.errorMessage || screenplayJob?.message || "Screenplay generation failed. Inspect raw prompt response and retry.", "error");
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    const sourceIdea = storyScriptIdea || selectedIdea;
    const result = attachAiProviderMetadata(screenplayJob?.result || {}, aiProviderContext);
    const screenplayIdea = applyScreenplayResult(result, sourceIdea);
    setScreenplayJobId(null);
    if (screenplayIdea) {
      flash("Screenplay generated. Review it, then generate storyboard, lighting, and DP plans.", "success");
      void refetchCreatorProjects?.();
    }
  }, [screenplayJob?.status, screenplayJob?.progress]);

  useEffect(() => {
    const status = String(productionPlanJob?.status || "").toUpperCase();
    if (isFailedJobStatus(status)) {
      setProductionPlanJobId(null);
      const message = productionPlanJob?.errorMessage || productionPlanJob?.message || "Shot plan generation failed. Inspect raw prompt response and retry.";
      const missingDetails = extractMissingDetailsFromJob(productionPlanJob);
      const focusedShotNumber = Number(productionPlanJob?.input?.focusedShotNumber || productionPlanJob?.inputPayload?.focusedShotNumber || extractShotNumberFromText(message) || 0) || null;
      setShotPlanRetry({
        shotNumber: focusedShotNumber,
        message,
        missingDetails,
        availableAt: Date.now() + 30000,
      });
      setScriptDetailIdea((current) => current ? {
        ...current,
        productionPlanStatus: "FAILED",
        productionPlanError: message,
        productionPlanMissingDetails: missingDetails,
        productionPlanDebug: productionPlanJob?.result || null,
      } : current);
      flash(message, "error");
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    const plans = productionPlanJob?.result?.productionPlanTags || [];
    const focusedShotNumber = Number(productionPlanJob?.result?.focusedShotNumber || productionPlanJob?.input?.focusedShotNumber || productionPlanJob?.inputPayload?.focusedShotNumber || 0);
    setScriptDetailIdea((current) => current ? {
      ...current,
      productionPlanTags: focusedShotNumber ? mergeProductionPlanTags(current.productionPlanTags || productionPlanTags, plans) : plans,
      productionPlanStatus: "GENERATED",
      productionPlanError: "",
    } : current);
    setProductionPlanJobId(null);
    setShotPlanRetry(null);
    void refetchProductionPlans?.();
    dispatch(completeStep("storyboard"));
    addActivity("Shot plans generated", `${plans.length || "All"} shots enriched`);
    flash("Storyboard, lighting, sound, and DP plans generated. You can render images per shot now.", "success");
  }, [productionPlanJob?.status, productionPlanJob?.progress]);

  useEffect(() => {
    if (!shotPlanRetry?.availableAt) {
      setShotPlanRetrySeconds(0);
      return undefined;
    }
    const updateCountdown = () => {
      setShotPlanRetrySeconds(Math.max(0, Math.ceil((shotPlanRetry.availableAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [shotPlanRetry?.availableAt]);

  useEffect(() => {
    const status = String(storyboardJob?.status || "").toUpperCase();
    if (storyboardJob?.result?.storyboard) {
      setGeneratedStoryboard(normalizeStoryboardResponse(storyboardJob.result.storyboard, scriptDetailIdea));
    }
    if (isFailedJobStatus(status)) {
      setStoryboardJobId(null);
      addActivity("Storyboard generation failed", selectedIdea?.title || "Locked idea");
      flash(storyboardJob?.errorMessage || storyboardJob?.message || "Storyboard generation failed. Try again.", "error");
      return;
    }
    if (!isCompletedJobStatus(status)) return;

    const storyboardResult = storyboardJob?.result?.storyboard
      ? normalizeStoryboardResponse(storyboardJob.result.storyboard, scriptDetailIdea)
      : null;
    if (storyboardResult) setGeneratedStoryboard(storyboardResult);
    setStoryboardSaved(false);
    setStoryboardJobId(null);
    dispatch(completeStep("storyboard"));
    if (isUuid(storyboardResult?.projectId || activeProjectId)) {
      dispatch(setProjectId(storyboardResult?.projectId || activeProjectId));
    }
    addActivity("Storyboard generated", selectedIdea?.title || "Locked idea");
    flash("Storyboard, lighting build sheets, and DP camera sheets generated", "success");
    void refetchWallet?.();
    void refetchCreatorProjects?.();
    scrollToSection("storyboard");
  }, [storyboardJob?.status, storyboardJob?.progress]);

  useEffect(() => {
    if (!scenes.length) return;
    const timers = scenes.flatMap((scene, index) => {
      const sceneId = scene.id || `shot-${scene.shotNumber || index + 1}`;
      const jsonTimer = window.setTimeout(() => dispatch(markSceneJsonReady(sceneId)), 350 + index * 180);
      const imageTimer = window.setTimeout(() => dispatch(markSceneImageReady(sceneId)), index < 3 ? 1200 + index * 500 : 2600 + index * 750);
      return [jsonTimer, imageTimer];
    });
    return () => timers.forEach(window.clearTimeout);
  }, [dispatch, scenes]);

  useEffect(() => {
    if (!preview.isPlaying) return undefined;
    const timer = window.setInterval(() => {
      const next = preview.cursorMs >= preview.durationMs ? 0 : preview.cursorMs + 500;
      const sceneMs = preview.durationMs / Math.max(1, scenes.length);
      dispatch(setCursorMs(next));
      dispatch(setCurrentSceneIndex(Math.min(Math.max(0, scenes.length - 1), Math.floor(next / sceneMs))));
    }, 500);
    return () => window.clearInterval(timer);
  }, [dispatch, preview.cursorMs, preview.durationMs, preview.isPlaying, scenes.length]);

  const flash = (message, type = "success") => {
    dispatch(showFlash({ message, type }));
  };

  const addActivity = (label, detail) => {
    setActivity((current) => [{ label, detail, time: "Just now" }, ...current.slice(0, 5)]);
  };

  const buildIdeaSelectionPayload = ({ sourceType, idea, trend }) => {
    const isTrendSource = sourceType === "TREND";
    const basePayload = {
      sourceType,
      projectId: activeProjectId,
      trendId: isTrendSource && isUuid(trend?.id) ? trend.id : null,
      ideaTitle: idea?.title || trend?.title || "Original idea",
      ideaText: idea?.description || idea?.summary || trend?.summary || idea?.title || trend?.title || "Original creator idea",
      durationSeconds: selectedDuration,
      dialogueLanguage,
      screenType,
      selectionPayload: {
        selectedFrom: isTrendSource ? "trend_cloud" : "own_idea",
        aiProvider: aiProviderContext,
        idea,
      },
    };

    if (!isTrendSource) {
      return basePayload;
    }

    return {
      ...basePayload,
      platformCode: normalizePlatformCode(filters.platform),
      categoryCode: filters.category,
      countryCode: country.code,
      timeframe: filters.timeframe,
      selectionPayload: {
        ...basePayload.selectionPayload,
        filters,
        country,
        trend: trend ? compactTrendForSelection(trend) : null,
      },
    };
  };

  const persistIdeaSelection = async ({ sourceType, idea, trend }) => {
    try {
      const result = await lockIdeaSelection(buildIdeaSelectionPayload({ sourceType, idea, trend })).unwrap();
      if (isUuid(result?.projectId)) {
        dispatch(setProjectId(result.projectId));
        void refetchCreatorProjects?.();
      }
      return result;
    } catch (error) {
      logCreatorWorkflowError("Locked idea selection failed.", error, { sourceType });
      return null;
    }
  };

  const applyIdeaCandidatePage = (result, page = 0) => {
    const normalized = normalizeGeneratedIdeaResult(result, page, ideaCandidatePageSize);
    setIdeaCandidatePageItems(normalized.items);
    setIdeaCandidatePageInfo(normalized.pageInfo);
    setLockedIdeaOptions((current) => mergeUniqueIdeas(current, normalized.items));
    return normalized;
  };

  const loadIdeaCandidatesForBrief = async (brief, page = 0) => {
    const fallbackIdeasForBrief = buildLocalGeneratedIdeasFromBrief(brief, {
      filters,
      country,
      trend: selectedTrend,
      durationSeconds: selectedDuration,
    });
    let usedFallback = false;

    if (brief?.lockedIdeaId && isUuid(brief.lockedIdeaId)) {
      try {
        const acceptedJob = await generateLockedIdeaOptionsAsync({
          lockedIdeaId: brief.lockedIdeaId,
          page,
          size: ideaCandidatePageSize,
        }).unwrap();
        const jobId = acceptedJob?.jobId || acceptedJob?.id;
        if (!jobId) {
          throw new Error("Story idea generation job id was missing from backend response.");
        }
        persistIdeaGenerationJob({ jobId, lockedIdeaId: brief.lockedIdeaId, brief: compactBriefForStorage(brief) });
        setIdeaGenerationJobId(jobId);
        addActivity("Story ideas job started", `Waiting for AI job ${jobId.slice(0, 8)}`);
        const completedJob = await waitForCreatorJob(fetchJobStatus, jobId, {
          timeoutMs: 185000,
          intervalMs: 1800,
        });
        const result = extractPageFromGenerationJob(completedJob);
        if (!result?.content?.length) {
          throw new Error("Story idea generation job completed without a page result.");
        }
        setIdeaGenerationJobId(null);
        clearStoredIdeaGenerationJob(jobId);
        void refetchIdeaGenerationJobs?.();
        return applyIdeaCandidatePage(result, page);
      } catch (asyncError) {
        logCreatorWorkflowError("Story ideas async API failed; trying direct request before local fallback.", asyncError, {
          endpoint: `/creator/locked-ideas/${brief.lockedIdeaId}/ideas/generate-async`,
          lockedIdeaId: brief.lockedIdeaId,
          page,
          size: ideaCandidatePageSize,
          provider: selectedAiProvider?.code || selectedProviderCode || null,
          briefTitle: brief.title || brief.description || null,
        });
        setIdeaGenerationJobId(null);
        try {
          const result = await generateLockedIdeaOptions({
            lockedIdeaId: brief.lockedIdeaId,
            page,
            size: ideaCandidatePageSize,
          }).unwrap();
          return applyIdeaCandidatePage(result, page);
        } catch (error) {
          usedFallback = true;
          logCreatorWorkflowError("Story ideas API failed; using local generated options.", error, {
          endpoint: `/creator/locked-ideas/${brief.lockedIdeaId}/ideas/generate`,
          lockedIdeaId: brief.lockedIdeaId,
          page,
          size: ideaCandidatePageSize,
          provider: selectedAiProvider?.code || selectedProviderCode || null,
          briefTitle: brief.title || brief.description || null,
          });
        }
        // Use local deterministic ideas while the backend is unavailable.
      }
    }

    const start = page * ideaCandidatePageSize;
    const normalized = applyIdeaCandidatePage({
      content: fallbackIdeasForBrief.slice(start, start + ideaCandidatePageSize),
      number: page,
      size: ideaCandidatePageSize,
      totalElements: fallbackIdeasForBrief.length,
      totalPages: Math.max(1, Math.ceil(fallbackIdeasForBrief.length / ideaCandidatePageSize)),
    }, page);
    return { ...normalized, usedFallback };
  };

  useEffect(() => {
    if (!shouldRestoreStoredWorkflow) return;
    const stored = readStoredIdeaGenerationJob();
    if (!stored?.jobId) return;
    if (!ideaGenerationJobId) {
      setIdeaGenerationJobId(stored.jobId);
    }
    setWorkspacePage("ideas");
    if (!lockedBrief && stored.brief) {
      setLockedBrief(stored.brief);
      setExtraIdeas((current) => mergeUniqueIdeas(current, [stored.brief]));
    }
  }, [shouldRestoreStoredWorkflow]);

  useEffect(() => {
    if (!ideaGenerationJob?.jobId) return;
    const status = String(ideaGenerationJob.status || "").toUpperCase();
    if (!isCompletedJobStatus(status) && !isFailedJobStatus(status)) return;

    if (isFailedJobStatus(status)) {
      clearStoredIdeaGenerationJob(ideaGenerationJob.jobId);
      setIdeaGenerationJobId(null);
      addActivity("Story ideas job failed", ideaGenerationJob.message || ideaGenerationJob.errorMessage || "Generation failed");
      flash("Story idea generation failed. You can retry from recent jobs.", "error");
      void refetchIdeaGenerationJobs?.();
      return;
    }

    const restoredBrief = buildLockedBriefFromGenerationJob(ideaGenerationJob);
    if (restoredBrief) {
      setLockedBrief(restoredBrief);
      setExtraIdeas((current) => mergeUniqueIdeas(current, [restoredBrief]));
      if (isUuid(restoredBrief.projectId)) {
        dispatch(setProjectId(restoredBrief.projectId));
      }
    }
    const result = extractPageFromGenerationJob(ideaGenerationJob);
    if (result?.content?.length) {
      const normalized = applyIdeaCandidatePage(result, result.number || 0);
      const firstGeneratedIdea = normalized.items[0];
      if (firstGeneratedIdea?.id) {
        dispatch(selectIdea(firstGeneratedIdea.id));
      }
      dispatch(setActiveStep("ideas"));
      setWorkspacePage("ideas");
      addActivity("Story ideas ready", `${normalized.pageInfo.totalElements || normalized.items.length} generated options recovered`);
      flash("Story ideas are ready", "success");
    }
    clearStoredIdeaGenerationJob(ideaGenerationJob.jobId);
    setIdeaGenerationJobId(null);
    void refetchIdeaGenerationJobs?.();
  }, [ideaGenerationJob?.jobId, ideaGenerationJob?.status]);

  const handleResumeIdeaGenerationJob = async (job) => {
    if (!job?.jobId) return;
    const restoredBrief = buildLockedBriefFromGenerationJob(job);
    if (restoredBrief) {
      setLockedBrief(restoredBrief);
      setExtraIdeas((current) => mergeUniqueIdeas(current, [restoredBrief]));
    }
    const status = String(job.status || "").toUpperCase();
    if (isCompletedJobStatus(status)) {
      const result = extractPageFromGenerationJob(job);
      if (!result?.content?.length) {
        flash("This completed job does not include generated ideas yet", "warning");
        return;
      }
      const normalized = applyIdeaCandidatePage(result, result.number || 0);
      const firstGeneratedIdea = normalized.items[0];
      if (firstGeneratedIdea?.id) {
        dispatch(selectIdea(firstGeneratedIdea.id));
      }
      dispatch(setActiveStep("ideas"));
      setWorkspacePage("ideas");
      scrollToSection("workflow");
      flash("Recovered generated story ideas", "success");
      return;
    }
    if (isFailedJobStatus(status)) {
      flash(job.errorMessage || job.message || "This generation job failed", "error");
      return;
    }
    persistIdeaGenerationJob({ jobId: job.jobId, lockedIdeaId: restoredBrief?.lockedIdeaId, brief: restoredBrief });
    setIdeaGenerationJobId(job.jobId);
    flash("Resuming story idea generation", "success");
  };

  const handleOpenGeneratedIdea = (job, idea) => {
    if (!job || !idea) return;
    const restoredBrief = buildLockedBriefFromGenerationJob(job);
    if (restoredBrief) {
      setLockedBrief(restoredBrief);
      setExtraIdeas((current) => mergeUniqueIdeas(current, [restoredBrief]));
    }
    const page = extractPageFromGenerationJob(job);
    if (page?.content?.length) {
      applyIdeaCandidatePage(page, page.number || 0);
    }
    const normalizedIdea = normalizeGeneratedIdea(idea);
    setLockedIdeaOptions((current) => mergeUniqueIdeas(current, [normalizedIdea]));
    setIdeaCandidatePageItems((current) => mergeUniqueIdeas(current, [normalizedIdea]));
    dispatch(selectIdea(normalizedIdea.id));
    dispatch(setActiveStep("ideas"));
    setWorkspacePage("ideas");
    setGeneratedIdeasOpen(false);
    setSelectedGeneratedTopicId(null);
    scrollToSection("workflow");
    addActivity("Recovered generated idea", normalizedIdea.title || "Story idea");
    flash("Generated idea opened in workflow", "success");
  };

  const handleCloseGeneratedIdeas = () => {
    setGeneratedIdeasOpen(false);
    setSelectedGeneratedTopicId(null);
    if (workspacePage === "generated-ideas") {
      setWorkspacePage("ideas");
      window.history.replaceState(null, "", "/#ideas");
    }
  };

  const handleStartNewIdea = () => {
    setManualIdeaDraft("");
    setLockedBrief(null);
    setLockedIdeaOptions([]);
    setIdeaCandidatePageItems([]);
    setIdeaCandidatePageInfo({ number: 0, size: ideaCandidatePageSize, totalPages: 1, totalElements: 0 });
    setSavedStoryIdeaId(null);
    setStoryScriptIdea(null);
    setScriptDetailIdea(null);
    setCastPlan(null);
    setSelectedAudienceDecision(null);
    setGeneratedStoryboard(null);
    setStoryboardSaved(false);
    setStoryboardJobId(null);
    setScreenplayJobId(null);
    setProductionPlanJobId(null);
    setShotPlanRetry(null);
    setShotPlanRetrySeconds(0);
    setIdeaGenerationJobId(null);
    clearStoredIdeaGenerationJob();
    setWorkspacePage("ideas");
    dispatch(resetPlannerState());
    window.history.replaceState(null, "", "/#ideas");
    scrollToSection("dashboard");
    addActivity("Started new idea", "Cleared recovered workflow state");
    flash("Ready for a new topic", "success");
  };

  const updateStoryIdeaInState = (nextIdea) => {
    const normalized = normalizeGeneratedIdea(nextIdea);
    setLockedIdeaOptions((current) => current.map((idea) => idea.id === normalized.id ? { ...idea, ...normalized } : idea));
    setIdeaCandidatePageItems((current) => current.map((idea) => idea.id === normalized.id ? { ...idea, ...normalized } : idea));
    return normalized;
  };

  const handlePredictTrends = async (nextFilters = filters) => {
    const normalizedFilters = { ...nextFilters, platform: normalizePlatformCode(nextFilters.platform) };
    setFilters(normalizedFilters);
    setTrendPage(0);
    if (!isValidCombination) {
      flash("Select a valid platform/category combination first", "error");
      return;
    }
    let usedFallbackJob = false;
    try {
      const result = await predictTrends({
        platform: normalizedFilters.platform,
        category: normalizedFilters.category,
        country: country.code,
        horizonHours: timeframeToHours(normalizedFilters.timeframe),
        userSignals: selectedTrend ? [`Selected trend: ${selectedTrend.title}. ${selectedTrend.summary || ""}`] : [],
        sourceTrendIds: selectedTrend?.id && isUuid(selectedTrend.id) ? [selectedTrend.id] : [],
        parameters: {
          timeframe: normalizedFilters.timeframe,
          days: timeframeToDays(normalizedFilters.timeframe),
          selectedTrendId: selectedTrend?.id,
          aiProvider: aiProviderContext,
        },
      }).unwrap();
      if (result?.predictions?.length) {
        setLocalPredictedTrends((current) => [
          ...result.predictions.map((trend) => normalizeTrend({
            ...trend,
            platform: normalizedFilters.platform,
            category: normalizedFilters.category,
            country: country.code,
            status: "Predicted",
          })),
          ...current,
        ]);
        setPredictionJobId(null);
      } else {
        setPredictionJobId(result.jobId || "job-predict-trends-mock");
      }
    } catch {
      usedFallbackJob = true;
      setPredictionJobId("job-predict-trends-mock");
    }
    addActivity("Trend prediction started", `${filterLabels.category[normalizedFilters.category] || normalizedFilters.category} - ${country.label}`);
    flash(
      usedFallbackJob ? "Trend prediction API failed; using mock trend job." : "Predicting trends from recent signal dumps",
      usedFallbackJob ? "warning" : "info"
    );
  };

  const handleFilterChange = (nextFilters) => {
    const normalizedFilters = { ...nextFilters, platform: normalizePlatformCode(nextFilters.platform) };
    setFilters(normalizedFilters);
    setTrendPage(0);
    addActivity(
      "Filters updated",
      `${filterLabels.platform[normalizedFilters.platform] || normalizedFilters.platform} / ${filterLabels.category[normalizedFilters.category] || normalizedFilters.category}`
    );
  };

  const handleCountrySelect = (nextCountry) => {
    setCountry(nextCountry);
    setTrendPage(0);
    setCountryOpen(false);
    addActivity("Country changed", nextCountry.label);
    flash(`Showing trend predictions for ${nextCountry.label}`, "info");
  };

  const handlePredictSelectedTrend = () => {
    if (!TREND_DISCOVERY_ENABLED) {
      flash("Trend discovery is disabled for now. Write your own topic instead.", "info");
      return;
    }
    if (!selectedTrend) {
      flash("Select a trend first", "error");
      return;
    }
    void handlePredictTrends(filters);
  };

  const buildLockPayload = () => {
    const isTrendSource = lockedBrief?.source === "trend";
    return {
      projectId: activeProjectId,
      trendId: isTrendSource ? planner.selectedTrendId : null,
      audienceId: planner.selectedAudienceId,
      creatorId: planner.selectedCreatorId,
      ideaId: planner.selectedIdeaId,
      durationSeconds: selectedDuration,
      ...(isTrendSource
        ? {
            platformCode: filters.platform,
            categoryCode: filters.category,
            countryCode: country.code,
          }
        : {}),
      idea: selectedIdea,
      audience: selectedAudienceSummary,
      castProfile: selectedCreator,
      castActors: selectedCreator?.actors || [],
      characterCastMappings: activeCharacterMappings,
      aiProvider: aiProviderContext,
    };
  };

  const handleGenerateStoryboard = async (options = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and review the backend screenplay before shot plans", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return;
    }
    const focusedShotNumber = Number(options.focusedShotNumber || 0) || null;

    try {
      const job = await generateProductionPlansAsync({
        scriptId: scriptDetailIdea.scriptId,
        styleKey: "indian_creator_pencil",
        ...(focusedShotNumber ? { focusedShotNumber } : {}),
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (!jobId) {
        throw new Error("Shot plan job did not return a job id.");
      }
      setProductionPlanJobId(jobId);
      setShotPlanRetry(null);
      setWorkspacePage("storyboard");
      dispatch(setActiveStep("storyboard"));
      addActivity(focusedShotNumber ? `Shot ${focusedShotNumber} plan retry started` : "Shot plans started", "Storyboard, lighting, sound, and DP tags");
      flash(focusedShotNumber ? `Retrying shot ${focusedShotNumber} plan with full screenplay context.` : "Shot plan generation started. Images can be rendered after this step.", "success");
      scrollToSection("storyboard");
    } catch (error) {
      const message = apiErrorMessage(error, "Shot plan generation failed. Check backend logs and try again.");
      const missingDetails = extractMissingDetailsFromApiError(error);
      if (missingDetails.length) {
        setShotPlanRetry({
          shotNumber: null,
          message,
          missingDetails,
          availableAt: Date.now() + 30000,
        });
      }
      flash(message, "error");
    }
  };

  const handleShotPlansAction = () => {
    if (effectiveShotPlansReady) {
      setWorkspacePage("storyboard");
      dispatch(setActiveStep("storyboard"));
      window.history.replaceState(null, "", "/#storyboard");
      scrollToSection("storyboard");
      return;
    }
    void handleGenerateStoryboard();
  };

  const handleRetryShotPlan = () => {
    if (shotPlanRetrySeconds > 0 || generateProductionPlansState.isLoading || productionPlanJobId) return;
    const fallbackShotNumber = scenes[preview.currentSceneIndex]?.shotNumber || preview.currentSceneIndex + 1;
    void handleGenerateStoryboard({ focusedShotNumber: shotPlanRetry?.shotNumber || fallbackShotNumber });
  };

  const handleGenerateShotImage = async (scene, imageKind = "storyboard") => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before rendering images.", "error");
      return;
    }
    const effectivePlans = productionPlanTags.length ? productionPlanTags : extractProductionPlanTagsFromScenes(scenes);
    if (!effectivePlans.some(hasProductionPlanData) && !hasProductionPlanData(scene)) {
      flash("Generate shot plans before rendering images.", "error");
      return;
    }
    const shotNumber = scene?.shotNumber || 1;
    const loadingKey = shotImageLoadingKey(shotNumber, imageKind);
    setShotImageLoadingKeys((current) => current.includes(loadingKey) ? current : [...current, loadingKey]);
    try {
      const result = await generateShotImage({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        imageKind,
        screenType: scriptDetailIdea.screenType || scriptDetailIdea.scriptJson?.screenType || screenType,
        signedUrlTtlSeconds: 604800,
      }).unwrap();
      const resultScene = normalizeShotImageResult(result, scene, shotNumber, imageKind);
      const normalizedScene = normalizeStoryboardResponse(
        { scenes: [resultScene], screenType: resultScene.screenType || result.screenType || screenType, renderWidth: resultScene.renderWidth || result.renderWidth, renderHeight: resultScene.renderHeight || result.renderHeight },
        scriptDetailIdea
      ).scenes[0];
      setGeneratedStoryboard((current) => {
        const baseScenes = current?.scenes?.length ? current.scenes : scenes;
        const updatedScenes = replaceSceneByShotNumber(baseScenes, normalizedScene);
        return {
          ...(current || {}),
          id: current?.id || current?.storyboardId || activeStoryboardId || scriptDetailIdea.scriptId,
          storyboardId: current?.storyboardId || current?.id || activeStoryboardId || scriptDetailIdea.scriptId,
          projectId: current?.projectId || scriptDetailIdea.projectId || activeProjectId,
          title: current?.title || scriptDetailIdea.title,
          screenType: current?.screenType || scriptDetailIdea.screenType || screenType,
          renderWidth: current?.renderWidth || normalizedScene.renderWidth,
          renderHeight: current?.renderHeight || normalizedScene.renderHeight,
          durationSeconds: current?.durationSeconds || scriptDetailIdea.durationSeconds || selectedDuration,
          totalShots: updatedScenes.length,
          scenes: updatedScenes,
          productionPlanTags: extractProductionPlanTagsFromScenes(updatedScenes),
        };
      });
      setScriptDetailIdea((current) => current ? {
        ...current,
        scriptScenes: replaceSceneByShotNumber(current.scriptScenes || [], normalizedScene),
      } : current);
      addActivity(`${imageKind.toUpperCase()} image rendered`, `Shot ${shotNumber}`);
      flash(`${imageKind === "dp" ? "DP" : imageKind} image generated for shot ${shotNumber}.`, "success");
    } catch (error) {
      flash(apiErrorMessage(error, `Could not render ${imageKind} image for shot ${shotNumber}.`), "error");
    } finally {
      setShotImageLoadingKeys((current) => current.filter((key) => key !== loadingKey));
    }
  };

  function getWorkflowGateMessage(step) {
    if (!workflowStepIds.has(step) && step !== "storyboard") return "";
    if (step === "ideas") return "";
    if (step === "script" && !storyScriptIdea) {
      if (projectWorkspaceMode && (savedStoryIdeaId || lockedBrief || ideaCandidatePageItems.length)) return "";
      return savedStoryIdeaId === planner.selectedIdeaId
        ? "Generate the story script from the saved idea first"
        : "Save a story idea, then generate its script";
    }
    if (step === "cast") return "";
    if (step === "screenplay" && !scriptDetailIdea) {
      if (!storyScriptIdea) return "Generate the story script before screenplay";
      if (!effectiveCastStepComplete) return "Lock character-to-actor mapping before screenplay";
      return "";
    }
    if (step === "storyboard" && !effectiveScreenplayReady) {
      return "Generate and review the screenplay before storyboard generation";
    }
    return "";
  }

  const handleWorkspacePageClick = (pageId) => {
    if (pageId === "past-storyline" || pageId === "past-script") {
      setPastHistoryModal(pageId === "past-storyline" ? "storyline" : "script");
      window.history.replaceState(null, "", `/#${pageId}`);
      scrollToSection("dashboard");
      return;
    }
    const nextPage = workspacePageIds.has(pageId) ? pageId : "ideas";
    const currentSection = workspacePage === "ideas" && projectWorkspaceMode ? "workflow" : sectionForWorkspacePage(workspacePage);
    const nextSection = nextPage === "ideas" && projectWorkspaceMode ? "workflow" : sectionForWorkspacePage(nextPage);
    const gateStep = nextPage === "generated-ideas" ? "" : nextPage;
    const gateMessage = gateStep ? getWorkflowGateMessage(gateStep) : "";
    if (gateMessage) {
      scrollToSection(currentSection);
      return;
    }
    if (nextPage === "generated-ideas") {
      setGeneratedIdeasOpen(true);
      setWorkspacePage(nextPage);
      window.history.replaceState(null, "", "/#generated-ideas");
      scrollToSection("dashboard");
      return;
    }
    if (workflowStepIds.has(nextPage)) {
      dispatch(setActiveStep(nextPage));
    }
    if (nextPage === "cast") {
      setActorModalSignal(Date.now());
    }
    setWorkspacePage(nextPage);
    window.history.replaceState(null, "", `/#${nextPage}`);
    scrollToSection(nextSection);
  };

  useEffect(() => {
    const navigateWorkspace = (event) => {
      const pageId = event?.detail?.id;
      if (!pageId) return;
      if (pageId === "ideas") {
        handleStartNewIdea();
        return;
      }
      handleWorkspacePageClick(pageId);
    };
    window.addEventListener("creator:navigate-workspace", navigateWorkspace);
    return () => window.removeEventListener("creator:navigate-workspace", navigateWorkspace);
  });

  const handleStepClick = (step) => {
    const sectionByStep = {
      trend: "trends",
      ideas: "workflow",
      script: "workflow",
      screenplay: "workflow",
      cast: "workflow",
      storyboard: "storyboard",
    };
    const gateMessage = getWorkflowGateMessage(step);
    if (gateMessage) {
      scrollToSection(sectionByStep[step] || "workflow");
      return;
    }
    if (step === "storyboard") {
      setWorkspacePage("storyboard");
    } else if (workflowStepIds.has(step)) {
      setWorkspacePage(step);
      if (step === "cast") {
        setActorModalSignal(Date.now());
      }
    } else if (step === "trend") {
      setWorkspacePage("ideas");
    }
    dispatch(setActiveStep(step));
    window.history.replaceState(null, "", `/#${step === "trend" ? "ideas" : step}`);
    scrollToSection(sectionByStep[step] || "dashboard");
  };

  const handleShowStoryScript = () => {
    handleStepClick("script");
  };

  const handleShowScreenplay = () => {
    handleStepClick("screenplay");
  };

  const handleShowShots = () => {
    if (effectiveShotPlansReady) {
      setWorkspacePage("storyboard");
      dispatch(setActiveStep("storyboard"));
      window.history.replaceState(null, "", "/#storyboard");
      scrollToSection("storyboard");
      return;
    }
    handleStepClick("storyboard");
  };

  const handleContinueFromScreenplay = () => {
    dispatch(completeStep("screenplay"));
    setWorkspacePage("storyboard");
    addActivity("Screenplay reviewed", scriptDetailIdea?.title || selectedIdea?.title || "Generated screenplay");
    flash("Screenplay reviewed. Ready for storyboard generation.");
    scrollToSection("workflow");
  };

  const handleContinueFromStoryline = async (draftStoryScript = null) => {
    if (draftStoryScript) {
      await handleSaveStoryScript(draftStoryScript);
    }
    dispatch(completeStep("script"));
    dispatch(setActiveStep("cast"));
    setWorkspacePage("cast");
    addActivity("Storyline locked", storyScriptIdea?.title || selectedIdea?.title || "Storyline");
    flash("Storyline locked. Map characters to cast before screenplay.");
    scrollToSection("workflow");
  };

  const handleSaveStoryScript = async (draftScript, revisionContext = {}) => {
    if (!storyScriptIdea) {
      flash("Generate a story script before saving edits", "error");
      return null;
    }

    const revisionPayload = buildStoryRevisionPayload(draftScript, storyScriptIdea, revisionContext);
    const payload = {
      title: draftScript.projectTitle || storyScriptIdea.title,
      durationSeconds: draftScript.duration || selectedDuration,
      dialogueLanguage: draftScript.dialogueLanguage || dialogueLanguage,
      screenType: draftScript.screenType || screenType,
      scriptText: buildStoryScriptTextFromDraft(draftScript),
      scriptJson: revisionPayload,
    };

    let result = {
      ...storyScriptIdea,
      title: payload.title,
      scriptText: payload.scriptText,
      scriptJson: payload.scriptJson,
      durationSeconds: payload.durationSeconds,
      status: "SCRIPT_GENERATED",
    };

    let usedLocalSave = false;
    if (isUuid(lockedBrief?.lockedIdeaId) && isUuid(storyScriptIdea.id)) {
      try {
        result = await saveStoryIdeaScript({
          lockedIdeaId: lockedBrief.lockedIdeaId,
          storyIdeaId: storyScriptIdea.id,
          ...payload,
        }).unwrap();
      } catch {
        usedLocalSave = true;
        // Local story script editing stays usable while backend save is unavailable.
      }
    }

    const updatedIdea = updateStoryIdeaInState({
      ...storyScriptIdea,
      title: result.title || payload.title,
      storyScriptText: result.scriptText || payload.scriptText,
      storyScriptJson: result.scriptJson || payload.scriptJson,
      projectId: result.projectId || storyScriptIdea.projectId || activeProjectId,
      durationSeconds: result.durationSeconds || payload.durationSeconds,
      status: result.status || "SCRIPT_GENERATED",
    });
    setStoryScriptIdea(updatedIdea);
    addActivity("Story script saved", updatedIdea.title);
    logStoryRevisionEvent(updatedIdea, payload.scriptJson.revisionAudit, usedLocalSave);
    flash(
      usedLocalSave ? "Story script save API failed; saved locally for this session." : "Story script saved",
      usedLocalSave ? "warning" : "success"
    );
    return updatedIdea;
  };

  const handleSaveGeneratedScript = async (draftScript) => {
    if (!scriptDetailIdea) {
      flash("Generate a screenplay before saving edits", "error");
      return null;
    }

    const payload = {
      title: draftScript.projectTitle || scriptDetailIdea.title,
      script: buildScriptTextFromDraft(draftScript),
      durationSeconds: draftScript.duration || selectedDuration,
      dialogueLanguage: draftScript.dialogueLanguage || dialogueLanguage,
      screenType: draftScript.screenType || screenType,
      scriptJson: draftScript,
      scenes: draftScript.shots || [],
    };

    let result = {
      ...scriptDetailIdea,
      title: payload.title,
      script: payload.script,
      scriptJson: payload.scriptJson,
      scenes: payload.scenes,
      durationSeconds: payload.durationSeconds,
      status: "SCRIPT_EDITED",
    };

    let usedLocalSave = false;
    if (isUuid(lockedBrief?.lockedIdeaId) && isUuid(scriptDetailIdea.id) && isUuid(scriptDetailIdea.scriptId)) {
      try {
        result = await saveGeneratedScript({
          lockedIdeaId: lockedBrief.lockedIdeaId,
          storyIdeaId: scriptDetailIdea.id,
          scriptId: scriptDetailIdea.scriptId,
          ...payload,
        }).unwrap();
      } catch {
        usedLocalSave = true;
        // Keep local editing usable while backend save is temporarily unavailable.
      }
    }

    const updatedIdea = updateStoryIdeaInState({
      ...scriptDetailIdea,
      title: result.title || payload.title,
      scriptId: result.scriptId || scriptDetailIdea.scriptId,
      projectId: result.projectId || scriptDetailIdea.projectId || activeProjectId,
      scriptText: result.script || payload.script,
      scriptJson: result.scriptJson || payload.scriptJson,
      scriptScenes: normalizeGeneratedScriptScenes(result.scenes || result.scriptJson?.shots || payload.scenes),
      productionPlanTags: result.productionPlanTags || scriptDetailIdea.productionPlanTags || [],
      productionPlanStatus: result.productionPlanStatus || result.scriptJson?.productionPlanStatus || scriptDetailIdea.productionPlanStatus || "",
      productionPlanError: result.productionPlanError || result.scriptJson?.productionPlanError || scriptDetailIdea.productionPlanError || "",
      productionPlanDebug: result.productionPlanDebug || result.scriptJson?.productionPlanDebug || scriptDetailIdea.productionPlanDebug || null,
      durationSeconds: result.durationSeconds || payload.durationSeconds,
      status: result.status || "SCRIPT_EDITED",
    });
    setScriptDetailIdea(updatedIdea);
    addActivity("Screenplay saved", updatedIdea.title);
    flash(
      usedLocalSave ? "Screenplay save API failed; saved locally for this session." : "Edited screenplay saved",
      usedLocalSave ? "warning" : "success"
    );
    return updatedIdea;
  };

  const handleWorkflowMove = (direction) => {
    const nextIndex = Math.max(0, Math.min(workflowDisplaySlides.length - 1, workflowIndex + direction));
    const nextStep = workflowDisplaySlides[nextIndex]?.id;
    if (!nextStep) return;

    if (direction > 0 && activeWorkflowSlide.id === "screenplay" && scriptDetailIdea) {
      handleContinueFromScreenplay();
      return;
    }

    const gateMessage = direction > 0 ? getWorkflowGateMessage(nextStep) : "";
    if (gateMessage) {
      return;
    }

    dispatch(setActiveStep(nextStep));
    setWorkspacePage(nextStep);
    scrollToSection("workflow");
  };

  const handleTrendSelect = (id) => {
    const trend = trends.find((item) => item.id === id);
    dispatch(selectTrend(id));
    addActivity("Trend selected", trend?.title || "Predicted trend");
    setTrendChoiceMode("trend");
    flash(`Selected ${trend?.title || "trend"}`);
  };

  const handleSaveTrendBrief = async () => {
    if (!selectedTrend) {
      flash("Select a trend first", "error");
      return;
    }
    const draftIdea = {
      id: `idea-from-trend-${selectedTrend.id}-${Date.now()}`,
      title: selectedTrend.title,
      description: selectedTrend.summary || `Create a short-form concept using the selected trend: ${selectedTrend.title}.`,
      hashtags: selectedTrend.hashtags || selectedTrend.tags || ["#TrendIdea", "#CreatorScript"],
      source: "trend",
      trendId: selectedTrend.id,
    };
    const lockedSelection = await persistIdeaSelection({ sourceType: "TREND", idea: draftIdea, trend: selectedTrend });
    const nextIdea = {
      ...draftIdea,
      id: lockedSelection?.ideaId || draftIdea.id,
      backendLocked: Boolean(lockedSelection?.ideaId),
      lockedIdeaId: lockedSelection?.ideaId,
      projectId: lockedSelection?.projectId || activeProjectId,
    };
    setLockedBrief(nextIdea);
    setExtraIdeas((current) => mergeUniqueIdeas(current, [nextIdea]));
    setIdeaCandidatePageItems([]);
    setIdeaCandidatePageInfo({ number: 0, size: ideaCandidatePageSize, totalPages: 1, totalElements: 0 });
    setSavedStoryIdeaId(null);
    addActivity("Trend saved", selectedTrend.title);
    flash(
      lockedSelection?.ideaId ? "Trend saved as creative brief" : "Trend saved locally; backend save unavailable",
      lockedSelection?.ideaId ? "success" : "warning"
    );
  };

  const handleSaveOriginalIdea = async (text) => {
    if (!text?.trim()) {
      flash("Write the topic you want to generate content about first", "error");
      return;
    }
    const trimmed = text.trim();
    const draftIdea = {
      id: `idea-original-${Date.now()}`,
      title: trimmed.length > 42 ? `${trimmed.slice(0, 39)}...` : trimmed,
      description: trimmed,
      hashtags: ["#OriginalIdea", "#CreatorScript"],
      manual: true,
      source: "original",
    };
    const lockedSelection = await persistIdeaSelection({ sourceType: "ORIGINAL", idea: draftIdea, trend: null });
    const nextIdea = {
      ...draftIdea,
      id: lockedSelection?.ideaId || draftIdea.id,
      backendLocked: Boolean(lockedSelection?.ideaId),
      lockedIdeaId: lockedSelection?.ideaId,
      projectId: lockedSelection?.projectId || activeProjectId,
    };
    setLockedBrief(nextIdea);
    setExtraIdeas((current) => mergeUniqueIdeas(current, [nextIdea]));
    addActivity("Original idea saved", nextIdea.title);
    setIdeaCandidatePageItems([]);
    setIdeaCandidatePageInfo({ number: 0, size: ideaCandidatePageSize, totalPages: 1, totalElements: 0 });
    setSavedStoryIdeaId(null);
    dispatch(completeStep("trend"));
    setWorkspacePage("ideas");
    flash(
      lockedSelection?.ideaId ? "Topic saved as creative brief" : "Topic saved locally; backend save unavailable",
      lockedSelection?.ideaId ? "success" : "warning"
    );
  };

  const handleGenerateStoryIdeas = async () => {
    if (!lockedBrief) {
      flash(TREND_DISCOVERY_ENABLED ? "Save a trend or original idea first" : "Write and save a topic first", "error");
      return;
    }
    if (!savedBriefMatchesCurrentMode) {
      flash(TREND_DISCOVERY_ENABLED ? "Save the current trend or idea before generating" : "Save the current topic before generating", "error");
      return;
    }
    const generated = await loadIdeaCandidatesForBrief(lockedBrief, 0);
    const firstGeneratedIdea = generated.items[0] || lockedBrief;
    dispatch(selectIdea(firstGeneratedIdea.id));
    dispatch(setActiveStep("ideas"));
    setWorkspacePage("ideas");
    addActivity("Generated story ideas", `${generated.pageInfo.totalElements || 20} options from saved brief`);
    flash(
      generated.usedFallback ? "Story ideas API failed; showing local generated options." : "Story ideas generated in creative workflow",
      generated.usedFallback ? "warning" : "success"
    );
    scrollToSection("workflow");
  };

  const handleIdeaCandidatePageChange = async (page) => {
    if (!lockedBrief) {
      flash("Lock a trend or original idea first", "error");
      return;
    }
    const normalizedPage = Math.max(0, page);
    const generated = await loadIdeaCandidatesForBrief(lockedBrief, normalizedPage);
    if (generated.usedFallback) {
      flash("Story idea page API failed; showing local options.", "warning");
    }
  };

  const saveSelectedStoryIdeaForWorkflow = async (storyIdea, { silent = false } = {}) => {
    if (!lockedBrief || !storyIdea) {
      if (!silent) flash("Select a story idea first", "error");
      return null;
    }

    let savedIdea = { ...storyIdea, saved: true, status: "SELECTED" };
    let usedLocalSave = false;
    if (isUuid(lockedBrief.lockedIdeaId) && isUuid(storyIdea.id)) {
      try {
        savedIdea = await saveStoryIdea({ lockedIdeaId: lockedBrief.lockedIdeaId, storyIdeaId: storyIdea.id }).unwrap();
      } catch {
        usedLocalSave = true;
        // Local save keeps the workflow usable while the backend is unavailable.
      }
    }

    const normalized = updateStoryIdeaInState({ ...savedIdea, saved: true, status: "SELECTED" });
    setSavedStoryIdeaId(normalized.id);
    setSavedIdeaIds((current) => {
      const next = new Set(current);
      next.add(normalized.id);
      return next;
    });
    setSavedIdeaSnapshots((current) => mergeUniqueIdeas(current, [normalized]));
    dispatch(selectIdea(normalized.id));
    addActivity("Story idea saved", normalized.title);
    if (!silent) {
      flash(
        usedLocalSave ? "Story idea save failed on API; saved locally for this session." : "Story idea saved. You can generate the story now.",
        usedLocalSave ? "warning" : "success"
      );
    }
    return { idea: normalized, usedLocalSave };
  };

  const handleSaveStoryIdea = async () => {
    const storyIdea = ideas.find((idea) => idea.id === planner.selectedIdeaId);
    await saveSelectedStoryIdeaForWorkflow(storyIdea);
  };

  const handleGenerateScriptForStoryIdea = async () => {
    const storyIdea = ideas.find((idea) => idea.id === planner.selectedIdeaId);
    if (!lockedBrief || !storyIdea) {
      flash("Select a story idea first", "error");
      return;
    }

    let sourceStoryIdea = storyIdea;
    let usedLocalSave = false;
    if (savedStoryIdeaId !== storyIdea.id) {
      const saved = await saveSelectedStoryIdeaForWorkflow(storyIdea, { silent: true });
      if (!saved?.idea) {
        flash("Could not save selected story idea before generation", "error");
        return;
      }
      sourceStoryIdea = saved.idea;
      usedLocalSave = saved.usedLocalSave;
    }

    const providerMemory = aiProviderContext;
    const storyCategoryCode = resolveWorkflowCategoryCode(lockedBrief, sourceStoryIdea, filters.category);
    if (!isUuid(lockedBrief.lockedIdeaId) || !isUuid(sourceStoryIdea.id)) {
      flash("Story generation needs saved UUIDs. Save the topic again so the workflow can continue.", "error");
      return;
    }

    let scriptResult;
    try {
      scriptResult = attachAiProviderMetadata(await generateStoryIdeaScript({
        lockedIdeaId: lockedBrief.lockedIdeaId,
        storyIdeaId: sourceStoryIdea.id,
        durationSeconds: selectedDuration,
        categoryCode: storyCategoryCode,
        idea: `${sourceStoryIdea.title}\n${sourceStoryIdea.description || ""}`.trim(),
        dialogueLanguage,
        screenType,
        context: { aiProvider: providerMemory },
      }).unwrap(), providerMemory);
    } catch (error) {
      flash(apiErrorMessage(error, "Story generation failed. Please regenerate with complete storyline, character, and beat JSON."), "error");
      return;
    }

    const scriptedIdea = updateStoryIdeaInState({
      ...sourceStoryIdea,
      title: scriptResult.title || sourceStoryIdea.title,
      description: sourceStoryIdea.description,
      storyScriptText: scriptResult.scriptText || scriptResult.script,
      storyScriptJson: buildInitialStoryRevisionPayload(scriptResult.scriptJson),
      rawPromptResponse: scriptResult.rawPromptResponse || null,
      projectId: scriptResult.projectId || sourceStoryIdea.projectId || activeProjectId,
      status: scriptResult.status || "SCRIPT_GENERATED",
      dialogueLanguage: scriptResult.scriptJson?.dialogueLanguage || scriptResult.dialogueLanguage || dialogueLanguage,
      screenType: scriptResult.scriptJson?.screenType || scriptResult.screenType || screenType,
      provider: scriptResult.provider,
      model: scriptResult.model,
    });
    setStoryScriptIdea(scriptedIdea);
    setScriptDetailIdea(null);
    dispatch(setActiveStep("script"));
    setWorkspacePage("script");
    dispatch(completeStep("ideas"));
    addActivity("Story generated", scriptedIdea.title);
    flash(
      usedLocalSave
        ? "Story idea saved locally and story generated. Review characters and storyline."
        : "Story generated. Review characters and storyline.",
      usedLocalSave ? "warning" : "success"
    );
    scrollToSection("workflow");
  };

  const applyScreenplayResult = (screenplayResult, sourceIdea, draftStoryScript = null) => {
    if (!screenplayResult || !sourceIdea) return null;
    const screenplayIdea = updateStoryIdeaInState({
      ...sourceIdea,
      title: screenplayResult.title || sourceIdea.title,
      description: sourceIdea.description,
      scriptId: screenplayResult.scriptId,
      projectId: screenplayResult.projectId || sourceIdea.projectId || activeProjectId,
      scriptText: screenplayResult.script,
      scriptJson: screenplayResult.scriptJson,
      rawPromptResponse: screenplayResult.rawPromptResponse || null,
      scriptScenes: normalizeGeneratedScriptScenes(screenplayResult.scenes || screenplayResult.scriptJson?.shots),
      productionPlanTags: screenplayResult.productionPlanTags || [],
      productionPlanStatus: screenplayResult.productionPlanStatus || screenplayResult.scriptJson?.productionPlanStatus || "NOT_STARTED",
      productionPlanError: screenplayResult.productionPlanError || screenplayResult.scriptJson?.productionPlanError || "",
      productionPlanDebug: screenplayResult.productionPlanDebug || screenplayResult.scriptJson?.productionPlanDebug || null,
      status: screenplayResult.status || "SCREENPLAY_GENERATED",
      dialogueLanguage: screenplayResult.scriptJson?.dialogueLanguage || screenplayResult.dialogueLanguage || dialogueLanguage,
      screenType: screenplayResult.scriptJson?.screenType || screenplayResult.screenType || screenType,
      provider: screenplayResult.provider,
      model: screenplayResult.model,
      storyScriptJson: sourceIdea.storyScriptJson || buildInitialStoryRevisionPayload(draftStoryScript),
      storyScriptText: sourceIdea.storyScriptText,
    });
    setScriptDetailIdea(screenplayIdea);
    dispatch(completeStep("script"));
    dispatch(setActiveStep("screenplay"));
    setWorkspacePage("screenplay");
    addActivity("Screenplay generated", screenplayIdea.title);
    scrollToSection("workflow");
    return screenplayIdea;
  };

  const handleGenerateScreenplayForStoryIdea = async (draftStoryScript = null) => {
    const storyIdea = storyScriptIdea || ideas.find((idea) => idea.id === planner.selectedIdeaId);
    if (!lockedBrief || !storyIdea) {
      flash("Generate the story script first", "error");
      return;
    }
    if (!effectiveCastStepComplete) {
      flash("Lock character-to-actor mapping before generating screenplay", "error");
      setWorkspacePage("cast");
      dispatch(setActiveStep("cast"));
      return;
    }
    let sourceIdea = storyIdea;
    if (draftStoryScript) {
      sourceIdea = await handleSaveStoryScript(draftStoryScript) || storyIdea;
    }

    const providerMemory = aiProviderContext;
    const screenplayCategoryCode = resolveWorkflowCategoryCode(lockedBrief, sourceIdea, filters.category);
    if (!isUuid(lockedBrief.lockedIdeaId) || !isUuid(sourceIdea.id)) {
      flash("Screenplay generation needs saved UUIDs. Save the topic again so the workflow can continue.", "error");
      return;
    }

    try {
      const productionContext = buildScreenplayProductionContext();
      const job = await generateStoryIdeaScreenplayAsync({
        lockedIdeaId: lockedBrief.lockedIdeaId,
        storyIdeaId: sourceIdea.id,
        durationSeconds: selectedDuration,
        categoryCode: screenplayCategoryCode,
        idea: `${sourceIdea.title}\n${sourceIdea.description || ""}`.trim(),
        dialogueLanguage,
        screenType,
        budgetTier: productionContext.budgetTier,
        characterCastMappings: productionContext.characterCastMappings,
        availableActors: productionContext.availableActors,
        audienceDecision: productionContext.audienceDecision,
        brandContext: productionContext.brandContext,
        creatorContext: productionContext.creatorContext,
        context: {
          aiProvider: providerMemory,
          workflowLockedAt: new Date().toISOString(),
          lockedPackage: productionContext,
        },
      }).unwrap();
      if (job?.jobId) {
        setScreenplayJobId(job.jobId);
        addActivity("Screenplay generation started", sourceIdea.title);
        flash("Screenplay generation started. Shot-wise JSON will appear when ready.", "success");
      }
    } catch (error) {
      flash(apiErrorMessage(error, "Screenplay generation failed. Please regenerate with complete shots, timing, audio, lighting, blocking, and production metadata."), "error");
    }
  };

  const buildAudienceDecisionPayload = (audienceData = {}) => ({
    ...audienceData,
    id: audienceData.id || selectedAudienceDecision?.id,
    projectId: activeProjectId,
    lockedIdeaId: lockedBrief?.lockedIdeaId,
    storyIdeaId: activeStoryIdeaIdForCast,
    scriptId: scriptDetailIdea?.scriptId,
    trendId: selectedTrend?.id,
    categoryCode: resolveWorkflowCategoryCode(lockedBrief, selectedIdea, filters.category),
    countryCode: country.code,
    idea: `${selectedIdea?.title || ""}\n${selectedIdea?.description || ""}`.trim(),
    title: audienceData.title || selectedAudienceSummary?.title,
    description: audienceData.description || selectedAudienceSummary?.description,
    selectedIdea,
    trend: selectedTrend,
    storyScriptJson: storyScriptIdea?.storyScriptJson,
    scriptJson: scriptDetailIdea?.scriptJson,
    castPlan: selectedCreator,
    characterCastMappings: activeCharacterMappings,
    context: {
      durationSeconds: selectedDuration,
      dialogueLanguage,
      screenType,
      source: "creator-ui",
    },
  });

  const buildScreenplayProductionContext = () => {
    const characterCastMappings = activeCharacterMappings;
    const availableActors = selectedCreator?.actors || creators || [];
    const brandContext = selectedAudienceDecision?.brandContext || {
      productContext: selectedAudienceDecision?.productContext || "",
      brandTone: selectedAudienceDecision?.brandTone || "",
      restrictions: selectedAudienceDecision?.restrictions || [],
    };
    const creatorContext = {
      selectedCreator,
      castPlan: selectedCreator,
      selectedIdea,
      lockedBrief,
      dialogueLanguage,
      screenType,
      durationSeconds: selectedDuration,
    };
    return {
      budgetTier: selectedDuration <= 60 ? "zero_budget" : selectedDuration <= 180 ? "micro_budget" : "indie",
      characterCastMappings,
      availableActors,
      audienceDecision: selectedAudienceDecision || selectedAudienceSummary,
      brandContext,
      creatorContext,
    };
  };

  const handleSuggestAudience = async (audienceDraft) => {
    let result = null;
    let usedLocalSuggestion = false;
    try {
      result = await suggestAudience(buildAudienceDecisionPayload(audienceDraft)).unwrap();
    } catch {
      usedLocalSuggestion = true;
      result = {
        ...selectedAudienceSummary,
        ...audienceDraft,
        id: audienceDraft?.id || `audience-local-${Date.now()}`,
        aiSuggested: true,
      };
    }
    setSelectedAudienceDecision(result);
    addActivity("AI audience suggested", result?.title || "Script-fit audience");
    flash(
      usedLocalSuggestion ? "Audience suggestion API failed; drafted local audience." : "AI audience decision drafted from script and cast",
      usedLocalSuggestion ? "warning" : "success"
    );
    return result;
  };

  const handleAudienceConfirm = async (audienceData) => {
    const payload = buildAudienceDecisionPayload(audienceData);
    let result = {
      ...selectedAudienceSummary,
      ...audienceData,
      id: audienceData?.id || selectedAudienceDecision?.id || planner.selectedAudienceId,
      confirmed: true,
    };
    let usedLocalSave = false;
    try {
      result = await confirmAudience(payload).unwrap();
    } catch {
      usedLocalSave = true;
      // The visible mock confirmation is local.
    }
    setSelectedAudienceDecision(result);
    dispatch(selectAudience(result?.id || payload.id || planner.selectedAudienceId));
    dispatch(completeStep("audience"));
    dispatch(setActiveStep("screenplay"));
    setWorkspacePage("screenplay");
    addActivity("Audience saved", result?.title || audienceData?.title || "Confirmed audience");
    flash(
      usedLocalSave ? "Audience save API failed; saved locally for this session." : "Audience locked. Generate screenplay next.",
      usedLocalSave ? "warning" : "success"
    );
    scrollToSection("workflow");
  };

  const handleCreateActor = async (actorDraft) => {
    const normalized = normalizeSavedActorProfile(
      {
        id: `actor-local-${Date.now()}`,
        name: actorDraft?.name?.trim() || "Local Actor",
        displayName: actorDraft?.name?.trim() || "Local Actor",
        roleInShort: actorDraft?.roleInShort || actorDraft?.role || "Supporting Actor",
        age: actorDraft?.age,
        gender: actorDraft?.gender,
        vibe: actorDraft?.vibe,
        style: actorDraft?.style,
        cameraConfidence: actorDraft?.cameraConfidence,
        look: actorDraft?.look,
        profile: actorDraft?.profile,
        confirmed: true,
        attributes: {
          scenePresence: actorDraft?.scenePresence || "Reaction shots",
          localOnly: true,
        },
      },
      actorDraft
    );
    addActivity("Actor added locally", normalized.name);
    flash("Actor saved locally. You can map it to characters now.", "success");
    return normalized;
  };

  const handleCreatorConfirm = async (creatorProfile) => {
    let savedActors = creatorProfile?.actors || [];
    const originalActors = creatorProfile?.actors || [];
    let usedLocalActors = false;
    let usedLocalMappings = false;
    let castSaveWarning = "";
    try {
      savedActors = [];
      for (const actor of originalActors) {
        const payload = castMemberToProfilePayload(actor, activeProjectId);
        const saved = isUuid(actor.actorId)
          ? await updateCreator({ id: actor.actorId, ...payload }).unwrap()
          : await createCreator(payload).unwrap();
        savedActors.push({
          ...actor,
          actorId: saved.id || actor.actorId,
          id: saved.id || actor.id,
          name: saved.name || saved.displayName || actor.name,
          age: saved.age || actor.age,
          gender: saved.gender || actor.gender,
          vibe: saved.vibe || saved.vibes || actor.vibe,
          style: saved.style || actor.style,
          cameraConfidence: saved.cameraConfidence || actor.cameraConfidence,
          look: saved.look || actor.look,
          profile: saved.profile || actor.profile,
        });
      }
    } catch {
      usedLocalActors = true;
      // Keep the local cast workflow usable if profile persistence is temporarily unavailable.
      savedActors = creatorProfile?.actors || [];
    }

    let savedMappings = normalizeCharacterMappingsForSave(creatorProfile?.characterMappings || [], savedActors, originalActors);
    if (!savedMappings.length) {
      flash("No story characters are available to map. Generate the storyline first, then confirm cast.", "error");
      return;
    }
    if (savedMappings.length && isUuid(lockedBrief?.lockedIdeaId) && isUuid(activeStoryIdeaIdForCast)) {
      try {
        const mappingResult = await saveCharacterCastMappings({
          lockedIdeaId: lockedBrief.lockedIdeaId,
          storyIdeaId: activeStoryIdeaIdForCast,
          projectId: activeProjectId,
          scriptId: isUuid(scriptDetailIdea?.scriptId) ? scriptDetailIdea.scriptId : null,
          mappings: savedMappings,
        }).unwrap();
        savedMappings = mappingResult.mappings || savedMappings;
      } catch (error) {
        usedLocalMappings = true;
        castSaveWarning = apiErrorMessage(error, "Cast mapping save failed; cast plan saved locally.");
        logCreatorWorkflowError("Character cast mapping save failed.", error, {
          lockedIdeaId: lockedBrief?.lockedIdeaId,
          storyIdeaId: activeStoryIdeaIdForCast,
          projectId: activeProjectId,
        });
        // The cast plan still carries the local mapping if backend save is unavailable.
      }
    }

    const savedCastPlan = {
      ...creatorProfile,
      id: savedActors[0]?.actorId || creatorProfile?.id,
      actors: savedActors,
      characterMappings: savedMappings,
    };
    setCastPlan(savedCastPlan);
    dispatch(selectCreator(savedActors[0]?.actorId || creatorProfile?.id || selectedCreator?.id || "creator-priya"));
    dispatch(completeStep("cast"));
    dispatch(setActiveStep("screenplay"));
    setWorkspacePage("screenplay");
    addActivity("Cast plan confirmed", savedCastPlan?.name || selectedCreator?.name || "Confirmed cast");
    flash(
      usedLocalActors || usedLocalMappings ? castSaveWarning || "Cast save API failed; cast plan saved locally." : "Cast mapped. Generate script next.",
      usedLocalActors || usedLocalMappings ? "warning" : "success"
    );
    scrollToSection("workflow");
  };

  const handleEnhanceIdeaWithCast = (nextCastPlan) => {
    const castNames = (nextCastPlan?.actors || []).map((actor) => actor.name).join(", ") || "my cast";
    const baseIdea = selectedIdea || ideas[0];
    const nextIdea = {
      ...baseIdea,
      id: `idea-cast-enhanced-${Date.now()}`,
      title: `${baseIdea?.title || "Short idea"} - cast fit`,
      description: `${baseIdea?.description || "Creator brief"} Adapted for ${castNames}, with roles, reactions, and dialogue beats shaped around their camera comfort.`,
      hashtags: baseIdea?.hashtags || ["#CastFit", "#CreatorScript"],
      castEnhanced: true,
      castActors: nextCastPlan?.actors || [],
    };
    setCastPlan(nextCastPlan);
    setExtraIdeas((current) => [nextIdea, ...current]);
    dispatch(selectIdea(nextIdea.id));
    addActivity("Enhanced idea with cast", castNames);
    flash("Idea enhanced for your cast");
    scrollToSection("workflow");
  };

  const handleIdeaSelect = (id) => {
    const idea = ideas.find((item) => item.id === id);
    dispatch(selectIdea(id));
    addActivity("Idea selected", idea?.title || "Short concept");
    flash(`Selected ${idea?.title || "idea"}. Save it, then generate the script.`);
    scrollToSection("workflow");
  };

  const handleManualIdeaSave = (text, options = {}) => {
    const nextIdea = {
      id: `idea-manual-${Date.now()}`,
      title: text.length > 42 ? `${text.slice(0, 39)}...` : text,
      description: text,
      hashtags: ["#OriginalIdea", "#CreatorScript"],
      manual: true,
      source: options.source || "manual",
    };
    setExtraIdeas((current) => [nextIdea, ...current]);
    dispatch(selectIdea(nextIdea.id));
    setManualIdeaDraft("");
    addActivity("Manual idea selected", nextIdea.title);
    flash("Manual idea added. Save it, then generate the script.");
    scrollToSection(options.nextSection || "workflow");
  };

  const handleGenerateMoreIdeas = async () => {
    setIsGeneratingMore(true);
    let usedLocalBatch = false;
    if (TREND_DISCOVERY_ENABLED
      && isUuid(planner.selectedTrendId)
      && isUuid(planner.selectedAudienceId)
      && isUuid(planner.selectedCreatorId)) {
      try {
        await generateIdeas({ trendId: planner.selectedTrendId, audienceId: planner.selectedAudienceId, creatorId: planner.selectedCreatorId }).unwrap();
      } catch {
        usedLocalBatch = true;
        // The local mock batch below keeps the CTA useful if a real API is unavailable.
      }
    }
    const batchIndex = Math.floor(extraIdeas.length / 2) % mockIdeaBatches.length;
    const batch = mockIdeaBatches[batchIndex].map((idea, index) => ({
      ...idea,
      id: `${idea.id}-${extraIdeas.length + index}`,
      source: "trend",
    }));
    setExtraIdeas((current) => [...current, ...batch]);
    if (batch[0]) {
      dispatch(selectIdea(batch[0].id));
    }
    setIsGeneratingMore(false);
    addActivity("Generated trend ideas", `${batch.length} new concepts`);
    flash(
      usedLocalBatch
        ? "Idea generation API failed; added local trend ideas."
        : (batch[0] ? "Generated and selected an idea from trend. Save it before script." : "Added more ideas"),
      usedLocalBatch ? "warning" : "success"
    );
  };

  const handleGenerateGeneralIdea = () => {
    setIsGeneratingMore(true);
    window.setTimeout(() => {
      const categoryLabel = filterLabels.category[filters.category] || filters.category || "creator";
      const nextIdea = {
        id: `idea-general-${Date.now()}`,
        title: `${categoryLabel} relatable hook`,
        description: `A simple ${categoryLabel.toLowerCase()} short where the creator opens with a relatable problem, shows one practical shift, and ends with a clear payoff viewers can save.`,
        hashtags: ["#CreatorIdea", "#Shorts", `#${String(categoryLabel).replace(/[^a-z0-9]/gi, "")}`],
        source: "general_ai",
      };
      setExtraIdeas((current) => [nextIdea, ...current]);
      dispatch(selectIdea(nextIdea.id));
      setIsGeneratingMore(false);
      addActivity("Generated general AI idea", nextIdea.title);
      flash("Generated and selected a general AI idea. Save it before script.");
    }, 450);
  };

  const handleOpenScriptModal = (mode = "brief") => {
    setScriptModalMode(mode);
    setScriptDetailIdea(null);
    setScriptModalOpen(true);
  };

  const handleOpenScriptDetail = (idea) => {
    setScriptModalMode(idea?.source || "brief");
    setScriptDetailIdea(idea);
    setScriptModalOpen(true);
  };

  const handleApplyGeneratedScript = (script) => {
    const nextIdea = {
      id: `idea-script-${Date.now()}`,
      title: script.ideaTitle || (script.title?.length > 54 ? `${script.title.slice(0, 51)}...` : script.title) || "Generated short script",
      description: script.ideaSummary || script.summary || "Scene-by-scene script generated for the selected short.",
      hashtags: script.source === "trend" ? selectedTrend?.hashtags || ["#TrendScript"] : ["#OriginalIdea", "#ShortScript"],
      generatedScript: true,
      source: script.source,
      scriptScenes: script.scenes || [],
    };
    setExtraIdeas((current) => [nextIdea, ...current]);
    dispatch(selectIdea(nextIdea.id));
    setScriptDetailIdea(nextIdea);
    dispatch(setActiveStep("script"));
    setWorkspacePage("script");
    setManualIdeaDraft(nextIdea.description);
    setScriptModalOpen(false);
    addActivity("Generated script", nextIdea.title);
    flash(script.source === "script" ? "Idea extracted. Review the script pages." : "Scene-by-scene script applied. Review the script pages.");
    scrollToSection("workflow");
  };

  const handleToggleSaveIdea = (idea) => {
    const wasSaved = savedIdeaIds.has(idea.id);
    setSavedIdeaIds((current) => {
      const next = new Set(current);
      if (next.has(idea.id)) next.delete(idea.id);
      else next.add(idea.id);
      return next;
    });
    setSavedIdeaSnapshots((current) => (
      wasSaved
        ? current.filter((savedIdea) => savedIdea.id !== idea.id)
        : mergeUniqueIdeas(current, [idea])
    ));
    addActivity(wasSaved ? "Removed saved idea" : "Saved idea", idea.title);
    flash(wasSaved ? "Removed from saved" : "Idea saved");
  };

  const handleSaveStoryboard = async () => {
    const next = !storyboardSaved;
    let usedLocalSave = false;
    try {
      if (next) {
        await saveStoryboard({ storyboardId: activeStoryboardId, note: "Saved from planner" }).unwrap();
      } else {
        await unsaveStoryboard({ storyboardId: activeStoryboardId }).unwrap();
      }
    } catch {
      usedLocalSave = true;
      // Local state keeps the CTA responsive if the backend is not available yet.
    }
    setStoryboardSaved(next);
    addActivity(next ? "Saved storyboard" : "Unsaved storyboard", currentStoryboard?.title || "She Almost Didn't Go");
    flash(
      usedLocalSave
        ? (next ? "Storyboard save API failed; saved locally." : "Storyboard unsave API failed; updated locally.")
        : (next ? "Storyboard saved" : "Storyboard removed from saved"),
      usedLocalSave ? "warning" : "success"
    );
  };

  const handleExport = async () => {
    if (!activeProjectId) {
      flash("Save a topic first so this workflow has a project id to export.", "error");
      return;
    }
    let exportResult = { exportId: "export-local-mock" };
    let usedLocalExport = false;
    try {
      exportResult = await requestExport({ projectId: activeProjectId, format: "json" }).unwrap();
    } catch {
      usedLocalExport = true;
      // Local export still works as a mock even without an API response.
    }
    const payload = {
      projectId: activeProjectId,
      exportId: exportResult.exportId,
      title: currentStoryboard?.title || "She Almost Didn't Go",
      selectedTrend,
      selectedIdea,
      scenes,
    };
    downloadJson("she-almost-didnt-go-storyboard.json", payload);
    addActivity("Exported storyboard", exportResult.exportId || "mock export");
    flash(
      usedLocalExport ? "Export API failed; downloaded local storyboard JSON." : "Storyboard export downloaded",
      usedLocalExport ? "warning" : "success"
    );
  };

  const handleSceneSelect = (index) => {
    const sceneMs = preview.durationMs / Math.max(1, scenes.length);
    dispatch(setCurrentSceneIndex(index));
    dispatch(setCursorMs(Math.min(preview.durationMs, index * sceneMs)));
  };

  const handleOpenRecharge = () => {
    if (!tenantId) {
      flash("Set up organization before wallet recharge", "error");
      scrollToSection("dashboard");
      return;
    }
    setRechargeOpen(true);
  };

  const handleOrganizationSetup = async (draft) => {
    const payload = buildOrganizationSetupPayload(draft);
    let organizationResult = null;
    try {
      organizationResult = await setupOrganization(payload).unwrap();
    } catch {
      flash("Organization setup failed. Try again.", "error");
      return;
    }

    const identity = extractOrganizationIdentity(organizationResult, draft);
    if (!identity.tenantId) {
      flash("Organization created, but backend did not return a tenant id.", "warning");
      return;
    }

    dispatch(setTenantIdentity(identity));
    persistTenantId(identity.tenantId);

    let walletRechargeFailed = false;
    if (Number(draft?.initialWalletAmount) >= 100) {
      try {
        await createWalletRecharge({
          tenantId: identity.tenantId,
          amount: Number(draft.initialWalletAmount),
          currency: draft.currency || "INR",
          source: "organization_setup",
        }).unwrap();
      } catch {
        walletRechargeFailed = true;
      }
    }

    void refetchOrganization?.();
    addActivity("Organization configured", identity.companyName || identity.name || identity.tenantId);
    flash(
      walletRechargeFailed
        ? "Organization created; wallet recharge API failed."
        : "Organization created and wallet service connected.",
      walletRechargeFailed ? "warning" : "success"
    );
  };

  const handleRecharge = async (body) => {
    if (!tenantId) {
      flash("Tenant is required before wallet recharge", "error");
      return;
    }
    try {
      await createWalletRecharge({ tenantId, ...body }).unwrap();
      await refetchWallet?.();
      flash("Recharge flow started");
    } catch {
      flash("Mock recharge flow started because recharge API failed", "warning");
    }
    setRechargeOpen(false);
  };

  const handleUpgrade = async () => {
    if (!tenantId) {
      flash("Tenant is required before subscription activation", "error");
      return;
    }
    try {
      const result = await startSubscriptionUpgrade({ tenantId, productCode: "CREATOR", planCode: "CREATOR_PRO", agentCount: 0 }).unwrap();
      flash(result?.subscriptionId ? "Creator subscription activation started" : "Subscription flow started");
    } catch {
      flash("Mock subscription flow started because subscription API failed", "warning");
    }
  };

  const displayedSavedStoryboards = [
    ...(storyboardSaved
      ? [{
          id: activeStoryboardId,
          title: currentStoryboard?.title || "She Almost Didn't Go",
          lockedIdeaTitle: selectedIdea?.title || "Selected idea",
          durationSeconds: currentStoryboard?.durationSeconds || currentStoryboard?.duration || selectedDuration,
        }]
      : []),
    ...(Array.isArray(savedStoryboards) ? savedStoryboards : []),
    ...savedIdeas.map((idea) => ({
      id: `saved-${idea.id}`,
      title: idea.title,
      lockedIdeaTitle: idea.description,
      status: "SAVED_IDEA",
    })),
  ];
  const displayedProjectHistory = (Array.isArray(creatorProjects) ? creatorProjects : [])
    .filter((project) => project?.projectId || project?.id)
    .map((project) => {
      const projectId = project.projectId || project.id;
      const restored = buildWorkflowStateFromProject(project);
      const stage = projectResumeStage(restored, project);
      return {
        id: `project-${projectId}`,
        projectId,
        title: project.title || "Creator project",
        lockedIdeaTitle: stage.description,
        durationSeconds: project.durationSeconds,
        time: project.updatedAt ? formatJobTime(project.updatedAt) : "Project",
        status: project.status,
        stage,
        rawProject: project,
      };
    });
  const pastStorylineItems = dedupeHistoryItems([
    ...buildPastStorylineHistory(storyScriptIdea, displayedProjectHistory),
    ...normalizeBackendHistoryItems(backendStorylineHistory, "storyline"),
  ]);
  const pastScriptItems = dedupeHistoryItems([
    ...buildPastScriptHistory(scriptDetailIdea, displayedProjectHistory),
    ...normalizeBackendHistoryItems(backendScriptHistory, "script"),
  ]);
  const pastHistoryLoading = pastHistoryModal === "storyline"
    ? storylineHistoryLoading || fetchStorylineHistoryItemState.isFetching
    : pastHistoryModal === "script"
      ? scriptHistoryLoading || fetchScriptHistoryItemState.isFetching
      : false;
  const displayedHistory = [
    ...activity.map((item, index) => ({ id: `activity-${index}`, title: item.label, lockedIdeaTitle: item.detail, time: item.time })),
    ...displayedProjectHistory,
    ...(Array.isArray(storyboardHistory) ? storyboardHistory : []),
  ];

  const handleOpenHistoryItem = async (item) => {
    let project = item?.rawProject || item;
    const requestedProjectId = project?.projectId || item?.projectId || project?.id || item?.id;
    if (isUuid(requestedProjectId)) {
      try {
        project = await fetchCreatorProject(requestedProjectId).unwrap();
      } catch {
        project = item?.rawProject || item;
      }
    }
    const restored = buildWorkflowStateFromProject(project);
    const nextProjectId = restored?.projectId || requestedProjectId;

    if (restored?.projectId) {
      if (restored.lockedBrief) {
        setLockedBrief(restored.lockedBrief);
        setExtraIdeas((current) => mergeUniqueIdeas(current, [restored.lockedBrief]));
      }
      if (restored.ideaCandidates.length) {
        setLockedIdeaOptions((current) => mergeUniqueIdeas(current, restored.ideaCandidates));
        setIdeaCandidatePageItems(restored.ideaCandidates.slice(0, ideaCandidatePageSize));
        setIdeaCandidatePageInfo({
          number: 0,
          size: ideaCandidatePageSize,
          totalPages: Math.max(1, Math.ceil(restored.ideaCandidates.length / ideaCandidatePageSize)),
          totalElements: restored.ideaCandidates.length,
        });
      }
      if (restored.savedStoryIdea) {
        setSavedStoryIdeaId(restored.savedStoryIdea.id);
        setSavedIdeaIds((current) => {
          const next = new Set(current);
          next.add(restored.savedStoryIdea.id);
          return next;
        });
        setSavedIdeaSnapshots((current) => mergeUniqueIdeas(current, [restored.savedStoryIdea]));
      }
      if (restored.storyScriptIdea) setStoryScriptIdea(restored.storyScriptIdea);
      if (restored.scriptDetailIdea) setScriptDetailIdea(restored.scriptDetailIdea);
      if (restored.castPlan) setCastPlan(restored.castPlan);
      if (restored.audienceDecision) setSelectedAudienceDecision(restored.audienceDecision);
      if (restored.storyboard) setGeneratedStoryboard(restored.storyboard);
      setStoryboardSaved(Boolean(restored.storyboardSaved));
      dispatch(restorePlannerState(restored.planner));
      setWorkspacePage(restored.workspacePage);
      window.history.replaceState(null, "", `/#${restored.workspacePage}`);
      flash("Project restored as the active workflow", "success");
    } else if (isUuid(nextProjectId)) {
      dispatch(setProjectId(nextProjectId));
      flash("Project restored as the active workflow", "success");
    }
    const restoredSection = restored?.workspacePage === "ideas" ? "workflow" : sectionForWorkspacePage(restored?.workspacePage);
    scrollToSection(restored?.workspacePage ? restoredSection : isUuid(nextProjectId) ? "storyboard" : "dashboard");
  };

  const handleOpenBackendHistoryItem = async (item) => {
    const type = item?.backendType || item?.type;
    const id = type === "storyline" ? item?.storyIdeaId || item?.id : item?.scriptId || item?.id;
    if (!id) return;
    try {
      const detail = type === "storyline"
        ? await fetchStorylineHistoryItem(id).unwrap()
        : await fetchScriptHistoryItem(id).unwrap();
      if (type === "storyline") {
        const storyIdea = normalizeBackendStorylineDetail(detail);
        setStoryScriptIdea(storyIdea);
        if (storyIdea?.id) {
          setSavedStoryIdeaId(storyIdea.id);
          setSavedIdeaSnapshots((current) => mergeUniqueIdeas(current, [storyIdea]));
          setSavedIdeaIds((current) => {
            const next = new Set(current);
            next.add(storyIdea.id);
            return next;
          });
        }
        setWorkspacePage("script");
        window.history.replaceState(null, "", "/#script");
        scrollToSection("workflow");
      } else {
        const scriptIdea = normalizeBackendScriptDetail(detail);
        setScriptDetailIdea(scriptIdea);
        if (scriptIdea?.id) {
          setStoryScriptIdea((current) => current || normalizeGeneratedIdea(scriptIdea));
        }
        setWorkspacePage("screenplay");
        window.history.replaceState(null, "", "/#screenplay");
        scrollToSection("workflow");
      }
      setPastHistoryModal(null);
    } catch {
      flash("History details are still loading. Please try again.", "warning");
    }
  };

  const renderWorkflowSlide = (slideId) => {
    if (slideId === "ideas") {
      return (
        <IdeaCandidatesPanel
          lockedBrief={lockedBrief}
          ideas={ideaCandidatePageItems}
          selectedIdeaId={planner.selectedIdeaId}
          duration={selectedDuration}
          onDurationChange={setSelectedDuration}
          dialogueLanguage={dialogueLanguage}
          onDialogueLanguageChange={setDialogueLanguage}
          screenType={screenType}
          onScreenTypeChange={setScreenType}
          aiProviders={availableAiProviders}
          selectedProviderCode={selectedAiProvider?.code || selectedProviderCode}
          selectedProvider={selectedAiProvider}
          onProviderChange={setSelectedProviderCode}
          providersLoading={aiProvidersLoading}
          providersError={aiProvidersError}
          pageInfo={ideaCandidatePageInfo}
          onPageChange={handleIdeaCandidatePageChange}
          onSelectIdea={handleIdeaSelect}
          onSaveStoryIdea={handleSaveStoryIdea}
          onGenerateScript={handleGenerateScriptForStoryIdea}
          isLoading={generatedIdeaState.isLoading || generatedIdeaAsyncState.isLoading || Boolean(ideaGenerationJobId)}
          isSavingStoryIdea={saveStoryIdeaState.isLoading}
          isGeneratingScript={generateScriptState.isLoading}
          savedStoryIdeaId={savedStoryIdeaId}
          storyScriptReady={effectiveStoryScriptReady}
          screenplayReady={effectiveScreenplayReady}
          shotPlansReady={effectiveShotPlansReady}
          onShowStoryScript={handleShowStoryScript}
          onShowScreenplay={handleShowScreenplay}
          onShowShots={handleShowShots}
          projectMode={projectWorkspaceMode}
        />
      );
    }

    if (slideId === "script") {
      return (
        <StoryScriptPanel
          storyIdea={storyScriptIdea}
          duration={selectedDuration}
          onSave={handleSaveStoryScript}
          isSaving={saveStoryScriptState.isLoading}
          onGenerateScreenplay={handleContinueFromStoryline}
          generateScreenplayLabel="Lock Storyline and Map Cast"
          isGeneratingScreenplay={false}
          sourceIdea={selectedIdea}
          onGenerateStoryScript={handleGenerateScriptForStoryIdea}
          isGeneratingStoryScript={generateScriptState.isLoading}
          isSavingStoryIdea={saveStoryIdeaState.isLoading}
          aiProviders={availableAiProviders}
          selectedProviderCode={selectedAiProvider?.code || selectedProviderCode}
          selectedProvider={selectedAiProvider}
          onProviderChange={setSelectedProviderCode}
          providersLoading={aiProvidersLoading}
          providersError={aiProvidersError}
        />
      );
    }

    if (slideId === "screenplay") {
      return (
        <div className="min-h-0 space-y-4">
          <ScriptReviewPanel
            scriptIdea={scriptDetailIdea}
            duration={selectedDuration}
            onGenerate={handleGenerateScreenplayForStoryIdea}
            isGenerating={generateScreenplayState.isLoading || generateScreenplayAsyncState.isLoading || Boolean(screenplayJobId)}
            onSave={handleSaveGeneratedScript}
            isSaving={saveGeneratedScriptState.isLoading}
            onContinue={handleContinueFromScreenplay}
          />
          <ProductionPlanPanel plans={productionPlanTags} scenes={scenes} />
        </div>
      );
    }

    if (slideId === "cast") {
      return (
        <CreatorForm
          creator={selectedCreator}
          availableActors={creators}
          storyCharacters={activeStoryCharactersForCast}
          initialCharacterMappings={activeCharacterMappings}
          idea={selectedIdea}
          audience={selectedAudienceSummary}
          onCreateActor={handleCreateActor}
          onConfirm={handleCreatorConfirm}
          onEnhanceIdeaWithCast={handleEnhanceIdeaWithCast}
          openActorModalSignal={actorModalSignal}
          isCreatingActor={createCreatorState.isLoading}
          isSaving={createCreatorState.isLoading || updateCreatorState.isLoading || saveCharacterCastMappingsState.isLoading}
        />
      );
    }

    return null;
  };

  return (
    <div id="dashboard" className="creator-section mx-auto max-w-[1680px] space-y-5 px-4 py-6 sm:px-6 xl:px-8">
      <header className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{activeWorkspaceMeta.label}</h1>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {activeWorkspaceMeta.description}
          </p>
        </div>
        <div className="flex max-w-full items-center gap-2">
          <div className="custom-scrollbar -mx-1 flex min-w-0 items-center gap-2 overflow-x-auto px-1 pb-1">
            <div className="shrink-0">
              <SubscriptionBadge subscription={subscription} isLoading={subscriptionLoading || upgradeState.isLoading} onUpgrade={handleUpgrade} />
            </div>
            <button type="button" onClick={() => setProjectsOpen(true)} className="creator-control flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-300">
              <FolderOpen size={16} /> Projects
              {displayedProjectHistory.length > 0 && (
                <span className="rounded bg-purple-400/10 px-1.5 py-0.5 text-[10px] font-black text-purple-200">{displayedProjectHistory.length}</span>
              )}
            </button>
            {!projectWorkspaceMode && (
              <button type="button" onClick={() => setRecentIdeaJobsOpen(true)} className="creator-control flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-300">
                <History size={16} /> Recent Ideas
                {recentIdeaGenerationJobs.length > 0 && (
                  <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-black text-emerald-200">{recentIdeaGenerationJobs.length}</span>
                )}
              </button>
            )}
            <button type="button" onClick={() => setModal("help")} className="creator-control flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-300">
              <HelpCircle size={16} /> How it works
            </button>
          </div>
          <div className="relative shrink-0">
            <button type="button" onClick={() => setCountryOpen((open) => !open)} className="creator-control flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold">
              {country.label} <ChevronDown size={16} className={`text-slate-500 transition ${countryOpen ? "rotate-180" : ""}`} />
            </button>
            {countryOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] p-1 shadow-2xl shadow-black/40">
                {countryOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleCountrySelect(option)}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold ${
                      option.code === country.code ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <OrganizationSetupCard
        organization={organization}
        tenantId={tenantId}
        wallet={wallet}
        isLoading={organizationLoading}
        walletLoading={walletLoading}
        isSaving={setupOrganizationState.isLoading}
        onSubmit={handleOrganizationSetup}
        onRecharge={handleOpenRecharge}
      />

      {workspacePage === "ideas" && !projectWorkspaceMode && (
      <section id="trends" className="creator-section space-y-4">
        {TREND_DISCOVERY_ENABLED && (
          <>
            <TrendFilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onPredict={handlePredictTrends}
              isPredicting={isFetching || predictState.isLoading || Boolean(predictionJobId)}
              platformOptions={platformOptions}
              categoryOptions={categoryOptions}
              validCombination={isValidCombination}
            />
            <GenerationStatusBar job={predictionJob || (predictionJobId ? { status: "RUNNING", progress: 45, message: "Reading recent 30-minute trend dumps" } : null)} label="Predict Trends" />
          </>
        )}
        <TrendCarousel
          trends={trends}
          selectedTrendId={selectedTrend?.id || planner.selectedTrendId}
          onSelectTrend={handleTrendSelect}
          onViewAll={() => setModal("trends")}
          pageInfo={trendResult.pageInfo}
          onPageChange={setTrendPage}
          mode={TREND_DISCOVERY_ENABLED ? trendChoiceMode : "original"}
          onModeChange={TREND_DISCOVERY_ENABLED ? setTrendChoiceMode : () => setTrendChoiceMode("original")}
          originalIdea={manualIdeaDraft}
          onOriginalIdeaChange={setManualIdeaDraft}
          onSaveOriginalIdea={handleSaveOriginalIdea}
          onSaveTrend={handleSaveTrendBrief}
          onGenerateStoryIdeas={handleGenerateStoryIdeas}
          isFetching={isFetching}
          isLockingSelection={lockSelectionState.isLoading}
          isGeneratingIdeas={generatedIdeaState.isLoading || generatedIdeaAsyncState.isLoading || Boolean(ideaGenerationJobId)}
          canGenerateStoryIdeas={savedBriefMatchesCurrentMode}
          savedBriefTitle={savedBriefMatchesCurrentMode ? lockedBrief?.title : ""}
          aiProviders={availableAiProviders}
          selectedProviderCode={selectedAiProvider?.code || selectedProviderCode}
          selectedProvider={selectedAiProvider}
          onProviderChange={setSelectedProviderCode}
          providersLoading={aiProvidersLoading}
          providersError={aiProvidersError}
          trendsDisabled={!TREND_DISCOVERY_ENABLED}
          autoFocusOriginalIdea={workspacePage === "ideas" && !projectWorkspaceMode}
        />
        {TREND_DISCOVERY_ENABLED && (
          <WhyTrendingStrip
            trend={selectedTrend}
            insight={selectedTrendInsight}
            isLoading={insightLoading}
            onPredictSelected={handlePredictSelectedTrend}
          />
        )}
      </section>
      )}

      {workflowStepIds.has(workspacePage) && (
      <section id="workflow" className="creator-section space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-purple-200">Creative workflow</p>
            <h2 className="mt-1 text-xl font-bold text-white">{activeWorkflowSlide.label}</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">{activeWorkflowSlide.caption}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {workflowDisplaySlides.map((slide, index) => {
              const isActive = index === workflowIndex;
              const isDone = Boolean(workflowSlideStates[slide.id]);
              const isLocked = Boolean(getWorkflowGateMessage(slide.id));
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => handleStepClick(slide.id)}
                  aria-disabled={isLocked}
                  className={`inline-flex min-h-[2.25rem] items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : isDone
                        ? "bg-emerald-400/[0.12] text-emerald-100 hover:bg-emerald-400/[0.18]"
                        : isLocked
                          ? "bg-amber-400/[0.08] text-amber-100 hover:bg-amber-400/[0.12]"
                          : "bg-white/[0.055] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : isLocked ? <LockKeyhole size={13} /> : <Circle size={12} />}
                  <span>{index + 1}. {slide.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {visibleWorkflowStatusItems.map((item) => (
            <div
              key={item.id}
              className={`min-h-[4.75rem] rounded-lg border px-3 py-2.5 ${
                item.active
                  ? "border-purple-300/[0.45] bg-purple-500/[0.12]"
                  : item.done
                    ? "border-emerald-300/20 bg-emerald-400/[0.08]"
                    : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-500">
                {item.done ? <CheckCircle2 size={13} className="text-emerald-300" /> : <Circle size={11} />}
                <span>{item.label}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-200" title={item.value}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <GenerationStatusBar
          job={ideaGenerationJob || (ideaGenerationJobId ? { status: "RUNNING", progress: 35, message: "Waiting for AI story ideas" } : null)}
          label="Story idea generation"
        />
        <GenerationStatusBar
          job={screenplayJob || (screenplayJobId || generateScreenplayAsyncState.isLoading ? { status: "RUNNING", progress: 28, message: "Generating screenplay" } : null)}
          label="Screenplay generation"
        />

        <div className="creator-workflow-stage">
          {workflowDisplaySlides.map((slide) => (
            <div
              key={slide.id}
              id={slide.id}
              aria-hidden={slide.id !== activeWorkflowSlide.id}
              className={`${slide.id === activeWorkflowSlide.id ? "creator-workflow-panel block" : "hidden"} min-h-[clamp(42rem,calc(100vh-9rem),58rem)]`}
            >
              {renderWorkflowSlide(slide.id)}
            </div>
          ))}
        </div>

        <div className="creator-panel-muted grid gap-3 p-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
          <button
            type="button"
            onClick={() => handleWorkflowMove(-1)}
            disabled={workflowIndex === 0}
            className="creator-control flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{activeWorkflowSlide.label}: {selectedIdea?.title || "Select a trend or original idea first"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Step {workflowIndex + 1} of {workflowDisplaySlides.length}</span>
              {workflowIndex < workflowDisplaySlides.length - 1 && (
                <span className="text-xs font-semibold text-slate-400">
                  {getWorkflowGateMessage(workflowDisplaySlides[workflowIndex + 1].id) || `Next: ${workflowDisplaySlides[workflowIndex + 1].label}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleWorkflowMove(1)}
              disabled={workflowIndex === workflowDisplaySlides.length - 1}
              className="creator-control flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleShotPlansAction}
              disabled={
                !effectiveShotPlansReady
                && (!scriptDetailIdea?.scriptId || !effectiveScreenplayReady || generateProductionPlansState.isLoading || Boolean(productionPlanJobId))
              }
              className="creator-primary flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {effectiveShotPlansReady ? "Show Shot Plans" : "Generate Shot Plans"}
            </button>
          </div>
        </div>
      </section>
      )}

      {workspacePage === "storyboard" && (
      <>
      {shotPlanRetry && (
        <section className="creator-panel border-amber-300/20 bg-amber-400/[0.045] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-amber-200">
                {shotPlanRetry.shotNumber ? `Shot ${shotPlanRetry.shotNumber} plan failed` : "Shot plan generation failed"}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">{shotPlanRetry.message}</p>
              {Array.isArray(shotPlanRetry.missingDetails) && shotPlanRetry.missingDetails.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-300/20 bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase tracking-normal text-amber-200">Missing details</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shotPlanRetry.missingDetails.slice(0, 18).map((detail) => (
                      <span key={detail} className="rounded-md border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-50">
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRetryShotPlan}
              disabled={shotPlanRetrySeconds > 0 || generateProductionPlansState.isLoading || Boolean(productionPlanJobId)}
              className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <RefreshCw size={15} className={generateProductionPlansState.isLoading || productionPlanJobId ? "animate-spin" : ""} />
              {shotPlanRetrySeconds > 0 ? `Retry in ${shotPlanRetrySeconds}s` : shotPlanRetry.shotNumber ? `Retry Shot ${shotPlanRetry.shotNumber}` : "Retry Current Shot"}
            </button>
          </div>
        </section>
      )}
      <ProductionPlanPanel plans={productionPlanTags} scenes={scenes} isLoading={shotPlanLoading} />
      <div id="storyboard" className="creator-section grid gap-5 2xl:grid-cols-[minmax(0,3fr)_minmax(19rem,1fr)]">
        <StoryboardGrid
          scenes={scenes}
          title={currentStoryboard?.projectTitle || currentStoryboard?.title || selectedIdea?.title}
          durationSeconds={currentStoryboard?.durationSeconds || currentStoryboard?.duration || selectedDuration}
          screenType={currentStoryboard?.screenType || screenType}
          renderWidth={currentStoryboard?.renderWidth}
          renderHeight={currentStoryboard?.renderHeight}
          readySceneIds={storyboardLocal.readySceneIds}
          imageReadySceneIds={storyboardLocal.imageReadySceneIds}
          imageLoadingKeys={visibleShotImageLoadingKeys}
          activeSceneIndex={preview.currentSceneIndex}
          onSelectScene={handleSceneSelect}
          onGenerateImage={handleGenerateShotImage}
          onExport={handleExport}
          onSave={handleSaveStoryboard}
          isSaved={storyboardSaved}
          onGenerateAgain={handleGenerateStoryboard}
          isGenerating={shotPlanLoading || shotImageUrlsLoading || generateShotImageState.isLoading || exportState.isLoading}
        />
        <MobileFrame
          scene={selectedScene}
          cursorMs={preview.cursorMs}
          durationMs={preview.durationMs}
          isPlaying={preview.isPlaying}
          onToggle={() => dispatch(togglePlayback())}
          onSeek={(ms) => {
            const sceneMs = preview.durationMs / Math.max(1, scenes.length);
            dispatch(setCursorMs(ms));
            dispatch(setCurrentSceneIndex(Math.min(Math.max(0, scenes.length - 1), Math.floor(ms / sceneMs))));
          }}
        />
      </div>
      <GenerationStatusBar job={productionPlanJob || storyboardJob || (generateProductionPlansState.isLoading ? { status: "RUNNING", progress: 18, message: "Starting shot plan job" } : productionPlanJobId ? { status: "RUNNING", progress: 38, message: "Generating storyboard, lighting, sound, and DP plans" } : null)} label="Storyboard planning" />

      <StoryboardHistoryPanel
        saved={displayedSavedStoryboards}
        history={displayedHistory}
        onOpen={handleOpenHistoryItem}
      />
      </>
      )}

      <RechargeWalletModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onRecharge={handleRecharge}
        isLoading={rechargeState.isLoading}
      />

      <ScriptGenerationModal
        open={scriptModalOpen}
        onClose={() => {
          setScriptModalOpen(false);
          setScriptDetailIdea(null);
        }}
        onApply={handleApplyGeneratedScript}
        brief={manualIdeaDraft || selectedIdea?.description}
        trend={selectedTrend}
        duration={selectedDuration}
        initialMode={scriptModalMode}
        scriptDetail={scriptDetailIdea}
      />

      {pastHistoryModal && (
        <CreatorModal
          title={pastHistoryModal === "storyline" ? "Past Storyline" : "Past Script"}
          onClose={() => setPastHistoryModal(null)}
        >
          <PastHistoryList
            items={pastHistoryModal === "storyline" ? pastStorylineItems : pastScriptItems}
            isLoading={pastHistoryLoading}
            emptyText="No past history"
            loadingLabel={pastHistoryModal === "storyline" ? "Loading storylines" : "Loading scripts"}
            openLabel={pastHistoryModal === "storyline" ? "Open Storyline" : "Open Script"}
            onOpen={(item) => {
              if (item.backendType) {
                handleOpenBackendHistoryItem(item);
                return;
              }
              setPastHistoryModal(null);
              if (item.project) {
                handleOpenHistoryItem(item.project);
                return;
              }
              handleStepClick(pastHistoryModal === "storyline" ? "script" : "screenplay");
            }}
          />
        </CreatorModal>
      )}

      {generatedIdeasOpen && (
        <CreatorModal title="Generated Ideas" onClose={handleCloseGeneratedIdeas}>
          <div className="space-y-4">
            {!selectedGeneratedTopic ? (
              <>
                <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Choose a generated topic</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-400">
                      Topics are sorted newest first. Open one to review every generated idea in that batch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetchIdeaGenerationJobs?.()}
                    className="creator-control px-4 py-2.5 text-sm font-bold text-slate-200"
                  >
                    {ideaGenerationJobsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                <div className="custom-scrollbar max-h-[60vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
                  {ideaGenerationJobsLoading && !displayedGeneratedTopics.length ? (
                    <div className="px-3 py-6 text-sm font-semibold text-slate-500">Loading generated topics...</div>
                  ) : displayedGeneratedTopics.length ? (
                    <div className="space-y-2">
                      {displayedGeneratedTopics.map((topic) => {
                        const usedCount = topic.ideas.filter((idea) => isGeneratedIdeaAlreadyUsed(idea, usedGeneratedIdeaIds)).length;
                        const selectedCount = topic.ideas.filter((idea) => selectedStoryIdeaMarkerIds.has(String(idea.id || ""))).length;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => setSelectedGeneratedTopicId(topic.id)}
                            className="flex w-full items-start gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-3 text-left transition hover:border-purple-300/35 hover:bg-white/[0.06]"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-200">
                              <ListChecks size={16} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className="min-w-0 truncate text-sm font-bold text-white">{topic.title}</span>
                                <span className="rounded bg-purple-400/10 px-2 py-1 text-[10px] font-black uppercase text-purple-100">{topic.ideas.length} ideas</span>
                                {selectedCount > 0 && <span className="rounded bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-100">Selected here</span>}
                                {usedCount > 0 && <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-slate-300">{usedCount} used</span>}
                              </span>
                              <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{topic.description}</span>
                              <span className="mt-1 block text-xs font-semibold text-slate-400">{topic.generatedAt ? `Generated ${formatJobTime(topic.generatedAt)}` : "Completed"}</span>
                            </span>
                            <span className="mt-1 shrink-0 rounded bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-200">
                              Open
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-6 text-sm font-semibold text-slate-500">
                      No generated topic history yet. Save a topic and generate story ideas first.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-normal text-purple-200">Topic</p>
                    <h3 className="mt-1 text-lg font-extrabold leading-7 text-white">{selectedGeneratedTopic.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-400">{selectedGeneratedTopic.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Selected idea: {selectedStoryIdeaMarkerIds.size ? selectedIdea?.title || "Selected idea" : "None selected yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGeneratedTopicId(null)}
                      className="creator-control px-4 py-2.5 text-sm font-bold text-slate-200"
                    >
                      Back to topics
                    </button>
                    <button
                      type="button"
                      onClick={() => refetchIdeaGenerationJobs?.()}
                      className="creator-control px-4 py-2.5 text-sm font-bold text-slate-200"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="custom-scrollbar max-h-[62vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
                  <div className="grid gap-3 xl:grid-cols-2">
                    {selectedGeneratedTopic.ideas.map((idea) => {
                      const isSavedSelection = String(idea.id || "") === String(savedStoryIdeaId || "");
                      const isCurrentSelection = String(idea.id || "") === String(planner.selectedIdeaId || "");
                      const alreadyUsed = isGeneratedIdeaAlreadyUsed(idea, usedGeneratedIdeaIds);
                      const statusLabel = isSavedSelection
                        ? "Selected"
                        : isCurrentSelection
                          ? "Current"
                          : alreadyUsed
                            ? "Used"
                            : "Ready";
                      const cardStateClass = isSavedSelection
                        ? "border-emerald-300/45 bg-emerald-400/[0.075]"
                        : isCurrentSelection
                          ? "border-purple-300/45 bg-purple-500/[0.08]"
                          : alreadyUsed
                            ? "border-emerald-300/20 bg-emerald-400/[0.04]"
                            : "border-white/10 bg-white/[0.03]";
                      return (
                        <article key={`${selectedGeneratedTopic.id}-${idea.id}`} className={`rounded-lg border p-4 ${cardStateClass}`}>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="min-w-0 text-base font-extrabold leading-6 text-white">{idea.title}</h4>
                            <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-black uppercase ${
                              isSavedSelection
                                ? "bg-emerald-400/15 text-emerald-100"
                                : isCurrentSelection
                                  ? "bg-purple-400/15 text-purple-100"
                                  : alreadyUsed
                                    ? "bg-emerald-400/10 text-emerald-100"
                                    : "bg-white/[0.06] text-slate-300"
                            }`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-400">{idea.description || idea.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(idea.hashtags || []).slice(0, 5).map((tag) => (
                              <span key={tag} className="rounded bg-black/20 px-2 py-1 text-[10px] font-bold text-slate-300">{tag}</span>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenGeneratedIdea(selectedGeneratedTopic.job, idea)}
                              className={isSavedSelection || isCurrentSelection || alreadyUsed
                                ? "creator-control px-3 py-2 text-xs font-bold text-emerald-100"
                                : "creator-primary px-3 py-2 text-xs font-bold text-white"}
                            >
                              {isSavedSelection ? "Continue Selected Idea" : isCurrentSelection ? "Continue Current Idea" : alreadyUsed ? "Open Used Idea" : "Select & Continue"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </CreatorModal>
      )}

      {projectsOpen && (
        <CreatorModal title="Resume Project" onClose={() => setProjectsOpen(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-white">Continue where you left off</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-400">
                  Each project shows the next workspace stage to open and the progress already completed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetchCreatorProjects?.()}
                className="creator-control px-4 py-2.5 text-sm font-bold text-slate-200"
              >
                {creatorProjectsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
              {creatorProjectsLoading && !displayedProjectHistory.length ? (
                <div className="px-3 py-6 text-sm font-semibold text-slate-500">Loading projects...</div>
              ) : displayedProjectHistory.length ? (
                <div className="space-y-2">
                  {displayedProjectHistory.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        handleOpenHistoryItem(project);
                        setProjectsOpen(false);
                      }}
                      className="flex w-full items-start gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-3 text-left transition hover:border-purple-300/35 hover:bg-white/[0.06]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-200">
                        <FolderOpen size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="min-w-0 truncate text-sm font-bold text-white">{project.title}</span>
                          <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-slate-300">{project.stage.progressText}</span>
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-slate-400">
                          {project.stage.label} {project.time ? `- Updated ${project.time}` : ""}
                        </span>
                        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{project.stage.description}</span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {project.stage.steps.map((step) => (
                            <span
                              key={`${project.id}-${step.id}`}
                              className={`rounded px-2 py-1 text-[10px] font-black uppercase ${
                                step.done
                                  ? "bg-emerald-400/10 text-emerald-200"
                                  : step.active
                                    ? "bg-purple-400/15 text-purple-200"
                                    : "bg-white/[0.045] text-slate-500"
                              }`}
                            >
                              {step.label}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 rounded bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-200">
                        {project.stage.actionLabel}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-6 text-sm font-semibold text-slate-500">
                  No saved projects yet. Once a workflow is saved, it will appear here with its current stage.
                </div>
              )}
            </div>
          </div>
        </CreatorModal>
      )}

      {recentIdeaJobsOpen && (
        <CreatorModal title="Recent Story Ideas" onClose={() => setRecentIdeaJobsOpen(false)}>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-bold text-white">Resume generated ideas</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-400">
                Completed jobs stay available from the backend. Open one to continue, or use New Idea to clear the current recovered workflow.
              </p>
            </div>

            <div className="custom-scrollbar max-h-[60vh] overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="min-w-[44rem] space-y-1">
                {recentIdeaJobPageItems.length ? recentIdeaJobPageItems.map((job) => {
                  const status = String(job.status || "PENDING").toUpperCase();
                  const restoredBrief = buildLockedBriefFromGenerationJob(job);
                  const page = extractPageFromGenerationJob(job);
                  const count = Number(page?.totalElements || page?.content?.length || 0);
                  return (
                    <button
                      key={job.jobId}
                      type="button"
                      onClick={() => {
                        handleResumeIdeaGenerationJob(job);
                        setRecentIdeaJobsOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-white/[0.06]"
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isCompletedJobStatus(status)
                          ? "bg-emerald-300"
                          : isFailedJobStatus(status)
                            ? "bg-rose-300"
                            : "bg-purple-300"
                      }`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-white">{restoredBrief?.title || job.inputPayload?.lockedIdeaTitle || "Story idea generation"}</span>
                        <span className="mt-0.5 block whitespace-nowrap text-xs font-semibold text-slate-500">
                          {status} {count ? `- ${count} ideas` : ""} {job.createdAt ? `- ${formatJobTime(job.createdAt)}` : ""} {job.message ? `- ${job.message}` : ""}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-black uppercase ${
                        isCompletedJobStatus(status)
                          ? "bg-emerald-400/10 text-emerald-200"
                          : isFailedJobStatus(status)
                            ? "bg-rose-400/10 text-rose-200"
                            : "bg-purple-400/10 text-purple-200"
                      }`}>
                        {isCompletedJobStatus(status) ? "Open" : isFailedJobStatus(status) ? "Failed" : "Resume"}
                      </span>
                    </button>
                  );
                }) : (
                  <div className="px-3 py-6 text-sm font-semibold text-slate-500">
                    {ideaGenerationJobsLoading ? "Loading recent jobs..." : "No story idea jobs found yet."}
                  </div>
                )}
              </div>
            </div>

            {recentIdeaJobsTotalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={safeRecentIdeaJobsPage <= 0}
                  onClick={() => setRecentIdeaJobsPage((page) => Math.max(0, page - 1))}
                  className="flex items-center gap-1 rounded border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-purple-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Page {safeRecentIdeaJobsPage + 1} of {recentIdeaJobsTotalPages}
                </span>
                <button
                  type="button"
                  disabled={safeRecentIdeaJobsPage >= recentIdeaJobsTotalPages - 1}
                  onClick={() => setRecentIdeaJobsPage((page) => Math.min(recentIdeaJobsTotalPages - 1, page + 1))}
                  className="flex items-center gap-1 rounded border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-purple-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </CreatorModal>
      )}

      {modal && (
        <CreatorModal title={modal === "help" ? "How It Works" : "All Trends"} onClose={() => setModal(null)}>
          {modal === "help" ? (
            <div className="space-y-3 text-sm font-medium leading-6 text-slate-300">
              <p>{TREND_DISCOVERY_ENABLED
                ? "Predict trends for a valid platform/category, add actors, choose or write an idea, then lock it to start the storyboard package."
                : "Write the topic you want to generate content about, save it as the creative brief, then generate story ideas and continue through storyline, actors, script, and storyboard."}</p>
              <p>Wallet, subscription, and async job states are wired to production-shaped APIs with mock fallbacks until the Creator backend is available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trends.map((trend) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  selected={selectedTrend?.id === trend.id}
                  onClick={() => {
                    setModal(null);
                    handleTrendSelect(trend.id);
                  }}
                />
              ))}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <button type="button" onClick={() => setTrendPage((page) => Math.max(0, page - 1))} className="creator-control px-3 py-2 text-xs font-bold text-slate-200">Previous</button>
                <span className="text-xs font-semibold text-slate-400">Page {(trendResult.pageInfo?.number || 0) + 1} of {Math.max(1, trendResult.pageInfo?.totalPages || 1)}</span>
                <button type="button" onClick={() => setTrendPage((page) => Math.min(Math.max(1, trendResult.pageInfo?.totalPages || 1) - 1, page + 1))} className="creator-control px-3 py-2 text-xs font-bold text-slate-200">Next</button>
              </div>
            </div>
          )}
        </CreatorModal>
      )}
    </div>
  );
}

function buildDefaultCastPlan(creators = []) {
  const creator = Array.isArray(creators) && creators.length ? creators[0] : {
    id: "creator-priya",
    name: "Priya",
    age: 27,
    gender: "Female",
    vibe: ["Relatable", "Soft Spoken"],
    style: "Casual Gym Wear",
    cameraConfidence: "Shy",
  };
  return {
    id: `cast-${creator.id || "default"}`,
    name: creator.name || "My cast",
    actors: [{
      castId: `${creator.id || "creator"}-main`,
      actorId: creator.id || "creator-priya",
      name: creator.name || "Priya",
      age: creator.age || 27,
      gender: creator.gender || "Female",
      vibe: creator.vibe || creator.vibes || ["Relatable"],
      style: creator.style || "Casual Gym Wear",
      role: "Main Actor",
      scenePresence: "All scenes",
      cameraConfidence: creator.cameraConfidence || "Somewhat Comfortable",
    }],
  };
}

function castMemberToProfilePayload(member = {}, projectId) {
  return {
    projectId: isUuid(projectId) ? projectId : undefined,
    name: member.name || "Cast Member",
    displayName: member.name || "Cast Member",
    roleInShort: member.role || "Main Actor",
    age: Number(member.age || 26),
    gender: member.gender || "All",
    vibe: Array.isArray(member.vibe) ? member.vibe : textToArray(member.vibe),
    style: member.style || "Casual Gym Wear",
    cameraConfidence: member.cameraConfidence || "Somewhat Comfortable",
    look: member.look || "",
    profile: member.profile || "",
    confirmed: true,
    attributes: {
      scenePresence: member.scenePresence || "All scenes",
      castId: member.castId,
    },
  };
}

function resolveStoryCharactersForCast(...sources) {
  for (const source of sources) {
    const candidates = [
      source?.storyScriptJson?.characters,
      source?.storyScriptJson?.llmGeneratedScript?.characters,
      source?.storyScriptJson?.userRevision?.characters,
      source?.scriptJson?.characters,
      source?.scriptJson?.llmGeneratedScript?.characters,
      source?.characters,
    ];
    const found = candidates.find((items) => Array.isArray(items) && items.length);
    if (found) return found;
  }
  return [];
}

function normalizeSavedActorProfile(saved = {}, fallback = {}) {
  const attributes = saved.attributes || {};
  const id = saved.id || fallback.actorId || fallback.id || `actor-local-${Date.now()}`;
  const roleInShort = saved.roleInShort || fallback.roleInShort || fallback.role || attributes.roleInShort || "Supporting Actor";
  const vibe = saved.vibe || saved.vibes || fallback.vibe || fallback.vibes || attributes.vibe || attributes.vibes || ["Relatable"];
  return {
    ...fallback,
    ...saved,
    id,
    actorId: id,
    name: saved.name || saved.displayName || fallback.name || "Cast Member",
    age: saved.age || fallback.age || attributes.age || 26,
    gender: saved.gender || fallback.gender || attributes.gender || "All",
    vibe: Array.isArray(vibe) ? vibe : textToArray(vibe),
    style: saved.style || fallback.style || attributes.style || "Casual Gym Wear",
    cameraConfidence: saved.cameraConfidence || fallback.cameraConfidence || attributes.cameraConfidence || "Somewhat Comfortable",
    roleInShort,
    role: roleInShort,
    scenePresence: fallback.scenePresence || attributes.scenePresence || "Reaction shots",
    look: saved.look || fallback.look || attributes.look || "",
    profile: saved.profile || fallback.profile || attributes.profile || "",
  };
}

function normalizeCharacterMappingsForSave(mappings = [], savedActors = [], originalActors = []) {
  return (Array.isArray(mappings) ? mappings : []).map((mapping) => {
    const matchedActor = findMappedActor(mapping, savedActors, originalActors);
    const castProfileId = matchedActor?.actorId || mapping.castProfileId;
    return {
      characterKey: mapping.characterKey,
      characterName: mapping.characterName,
      characterRole: mapping.characterRole,
      castProfileId: isUuid(castProfileId) ? castProfileId : null,
      castDisplayName: matchedActor?.name || mapping.castDisplayName || "",
      characterPayload: mapping.characterPayload || {},
      castPayload: {
        ...(mapping.castPayload || {}),
        ...(matchedActor || {}),
        actorId: matchedActor?.actorId || mapping.castProfileId,
      },
    };
  }).filter((mapping) => mapping.characterKey && mapping.characterName);
}

function findMappedActor(mapping = {}, savedActors = [], originalActors = []) {
  const originalIndex = originalActors.findIndex((actor) => actor.actorId === mapping.castProfileId || actor.name === mapping.castDisplayName);
  if (originalIndex >= 0 && savedActors[originalIndex]) return savedActors[originalIndex];
  return savedActors.find((actor) => actor.actorId === mapping.castProfileId || actor.name === mapping.castDisplayName)
    || originalActors.find((actor) => actor.actorId === mapping.castProfileId || actor.name === mapping.castDisplayName)
    || null;
}

function buildAudienceSuggestionForPlanner(idea, trend, country) {
  const text = `${idea?.title || ""} ${idea?.description || ""} ${trend?.title || ""}`.toLowerCase();
  const countryName = country?.label || "India";

  if (/saas|bahu|wife|family|couple|neighbor|comedy/.test(text)) {
    return {
      id: `audience-ai-${idea?.id || "family"}`,
      title: `Family comedy viewers in ${countryName}`,
      description: "Interested in relatable household moments, reaction humor, couple/family dynamics, and character-led punchlines.",
    };
  }
  if (/study|exam|student|focus|late night/.test(text)) {
    return {
      id: `audience-ai-${idea?.id || "study"}`,
      title: `Students and focus builders in ${countryName}`,
      description: "Interested in study routines, focus blocks, discipline, realistic productivity, and night-session motivation.",
    };
  }
  if (/food|meal|protein|recipe|kitchen|lunch|dinner/.test(text)) {
    return {
      id: `audience-ai-${idea?.id || "food"}`,
      title: `Practical food viewers in ${countryName}`,
      description: "Interested in saveable meals, protein ideas, kitchen shortcuts, and simple creator-led recipe formats.",
    };
  }
  if (/skin|beauty|glow|routine|makeup/.test(text)) {
    return {
      id: `audience-ai-${idea?.id || "beauty"}`,
      title: `Beauty routine viewers in ${countryName}`,
      description: "Interested in real routines, visible results, low-effort glow-up steps, and honest product-light storytelling.",
    };
  }
  return {
    id: `audience-ai-${idea?.id || "fitness"}`,
    title: `Women 22-35 in ${countryName}`,
    description: "Interested in fitness, confidence building, habit change, weight loss, and relatable self-improvement stories.",
  };
}

function normalizeTrendResult(data, fallbackPage = 0, fallbackSize = 8) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

  const totalElements = Number(data?.totalElements ?? data?.total ?? rawItems.length);
  const totalPages = Number(data?.totalPages ?? Math.max(1, Math.ceil(totalElements / Math.max(1, fallbackSize))));
  const number = Number(data?.number ?? data?.page ?? fallbackPage);
  const size = Number(data?.size ?? fallbackSize);

  return {
    items: rawItems.map(normalizeTrend),
    pageInfo: { totalElements, totalPages, number, size },
  };
}

function normalizeTrend(trend) {
  const id = String(trend?.id || trend?.trendId || `trend-${Math.random().toString(36).slice(2)}`);
  const score = numberValue(trend?.score ?? trend?.confidenceScore, 62);
  const velocity = numberValue(trend?.velocity, Math.max(7, Math.round(score / 8)));
  const hashtags = trend?.hashtags || trend?.tags || trend?.suggestedTags || buildHashtags(trend?.category, trend?.title);

  return {
    ...trend,
    id,
    platform: normalizePlatformCode(trend?.platform || trend?.platformCode),
    category: trend?.category || trend?.categoryCode,
    country: trend?.country || trend?.countryCode,
    status: trend?.status || statusFromScore(score),
    hashtags,
    tags: trend?.tags || hashtags,
    reels: trend?.reels || formatCompactNumber(score * 140),
    reelsGrowth: trend?.reelsGrowth || `+${Math.max(4, Math.round(velocity))}%`,
    engagement: trend?.engagement || `${Math.max(3.8, Math.min(12.5, score / 10)).toFixed(1)}%`,
    engagementGrowth: trend?.engagementGrowth || `+${Math.max(3, Math.round(velocity / 1.4))}%`,
    imageUrl: trend?.imageUrl || trend?.thumbnailUrl || trend?.mediaUrl,
  };
}

function compactTrendForSelection(trend) {
  if (!trend) return null;
  return {
    id: trend.id,
    title: trend.title,
    summary: trend.summary,
    platform: trend.platform || trend.platformCode,
    category: trend.category || trend.categoryCode,
    country: trend.country || trend.countryCode,
    score: trend.score ?? trend.confidenceScore,
    velocity: trend.velocity,
    status: trend.status,
    tags: trend.tags || trend.hashtags,
  };
}

function normalizeGeneratedIdeaResult(data, fallbackPage = 0, fallbackSize = 5) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];
  const totalElements = Number(data?.totalElements ?? data?.total ?? rawItems.length);
  const totalPages = Number(data?.totalPages ?? Math.max(1, Math.ceil(totalElements / Math.max(1, fallbackSize))));
  const number = Number(data?.number ?? data?.page ?? fallbackPage);
  const size = Number(data?.size ?? fallbackSize);

  return {
    items: rawItems.map(normalizeGeneratedIdea),
    pageInfo: { totalElements, totalPages, number, size },
  };
}

function normalizeGeneratedIdea(idea) {
  const id = String(idea?.id || idea?.ideaId || `idea-generated-${Math.random().toString(36).slice(2)}`);
  return {
    ...idea,
    id,
    title: idea?.title || "Generated story idea",
    description: idea?.description || idea?.summary || "AI-generated story idea from the locked brief.",
    hashtags: idea?.hashtags || idea?.tags || ["#CreatorIdea", "#Shorts"],
    source: idea?.source || "AI_FROM_LOCKED_BRIEF",
    lockedIdeaId: idea?.lockedIdeaId,
    projectId: idea?.projectId,
    creativeNotes: idea?.creativeNotes || idea?.notes || {},
  };
}

function buildLocalGeneratedIdeasFromBrief(brief, context = {}) {
  const angles = [
    ["Contrarian opener", "Start with the opposite of what viewers expect, then reveal the real lesson in the last beat."],
    ["Beginner mistake", "Show the most relatable mistake first, then make the correction feel simple and repeatable."],
    ["Before-after reveal", "Use a quick visual contrast so viewers understand the payoff without explanation."],
    ["Silent reaction", "Lead with expression and body language before the idea is explained through action."],
    ["Myth versus reality", "Split the short into what people think happens and what actually happens."],
    ["One small win", "Make the story about one tiny success that feels achievable today."],
    ["Friend interruption", "Add a second person who interrupts the moment and creates a natural punchline."],
    ["Countdown challenge", "Turn the idea into three fast steps with an ending viewers can try."],
    ["Confession hook", "Open with an honest line that makes the creator feel human immediately."],
    ["Unexpected comparison", "Compare the idea to something familiar and slightly funny."],
    ["Saved checklist", "Make the concept useful enough to save with a clear checklist structure."],
    ["Day one diary", "Frame the story as a raw first-day moment with a small emotional win."],
    ["POV comedy beat", "Turn the brief into a POV setup with a reaction-driven punchline."],
    ["Quick transformation", "Show a visible state change inside the selected duration."],
    ["Behind-the-scenes truth", "Reveal the unpolished part of the journey viewers rarely see."],
    ["Two character conflict", "Use disagreement between two people to make the hook sharper."],
    ["Mini tutorial", "Teach one practical move while keeping the story personal."],
    ["Relatable failure", "Let the creator fail first, recover, and earn the payoff."],
    ["Emotional payoff", "Build toward one sincere line or look that closes the loop."],
    ["Shareable punchline", "End with a line viewers would send to a friend."],
  ];
  const baseTitle = truncateText(brief?.title || context.trend?.title || "Locked brief", 72);
  const categoryLabel = filterLabels.category?.[context.filters?.category] || context.filters?.category || "Creator";
  const seed = String(brief?.lockedIdeaId || brief?.id || "local").replace(/[^a-z0-9]/gi, "").slice(0, 10) || "local";

  return angles.map(([angle, description], index) => ({
    id: `idea-${seed}-${index + 1}`,
    lockedIdeaId: brief?.lockedIdeaId || brief?.id,
    projectId: brief?.projectId,
    title: `${String(index + 1).padStart(2, "0")}. ${angle}: ${baseTitle}`,
    description,
    source: "AI_FROM_LOCKED_BRIEF",
    durationSeconds: context.durationSeconds || 30,
    hashtags: [`#${String(categoryLabel).replace(/[^a-z0-9]/gi, "")}`, `#${angle.replace(/[^a-z0-9]/gi, "")}`, "#ShortsIdea"],
    creativeNotes: {
      hook: angle,
      targetEmotion: index % 3 === 0 ? "Fast curiosity" : index % 3 === 1 ? "Relatable humor" : "Honest connection",
      storyShape: index % 2 === 0 ? "Hook, escalation, payoff" : "Setup, reaction, practical close",
    },
  }));
}

function buildLocalStoryScriptFromIdea(idea, durationSeconds = 30, dialogueLanguage = "English", screenType = "vertical", category = "creator") {
  const title = idea?.title || "Creator Story Script";
  const { spokenLines } = localLanguageLines(dialogueLanguage, title);
  const characters = [
    {
      name: dialogueLanguage?.toLowerCase?.().includes("hindi") || dialogueLanguage?.toLowerCase?.().includes("hinglish") ? "Priya" : "Asha",
      role: "Main creator",
      gender: "Female",
      age: "26",
      ageRange: "22-30",
      look: "Everyday casual outfit, natural face, expressive eyes, subtle reactions, phone-friendly styling.",
      profile: "Beginner creator and emotional point of view for the short; viewers should recognize themselves through her hesitation and small win.",
      persona: "Relatable beginner who wants to take the idea seriously but overthinks the first step.",
      backstory: idea?.description || "Has tried to start before, but self-consciousness made the idea feel bigger than it is.",
      motivation: "Find one small win that feels real enough to repeat.",
      fearOrBlock: "Being judged or failing publicly.",
      relationshipToStory: "The audience experiences the idea through her decision.",
      speakingStyle: `${dialogueLanguage}, natural and understated`,
      visualIdentity: "Everyday outfit, natural face, expressive but subtle reactions",
    },
    {
      name: dialogueLanguage?.toLowerCase?.().includes("hindi") || dialogueLanguage?.toLowerCase?.().includes("hinglish") ? "Neha" : "Maya",
      role: "Support character",
      gender: "Female",
      age: "27",
      ageRange: "22-32",
      look: "Simple casual look, relaxed posture, grounded body language, supportive eye contact.",
      profile: "Practical friend who creates contrast and helps the main creator move without turning the scene into advice.",
      persona: "Practical friend who gives a tiny push without sounding preachy.",
      backstory: "Has seen the main character delay this decision before.",
      motivation: "Help the main character make the first move.",
      fearOrBlock: "Pushing too hard and making the moment awkward.",
      relationshipToStory: "Creates a natural second voice and contrast.",
      speakingStyle: `${dialogueLanguage}, casual and conversational`,
      visualIdentity: "Simple casual look, grounded body language",
    },
  ];
  const beats = [
    { beatNumber: 1, title: "Decision Point", summary: `${characters[0].name} is caught right before taking action.`, characterFocus: characters[0].name, emotionalPurpose: "Create immediate recognition.", estimatedSeconds: Math.round(durationSeconds * 0.2) },
    { beatNumber: 2, title: "The Block", summary: "The excuse or insecurity becomes visible.", characterFocus: characters[0].name, emotionalPurpose: "Build relatability.", estimatedSeconds: Math.round(durationSeconds * 0.3) },
    { beatNumber: 3, title: "Small Push", summary: `${characters[1].name} gives one simple nudge and the first tiny action begins.`, characterFocus: characters[1].name, emotionalPurpose: "Shift the energy from stuck to moving.", estimatedSeconds: Math.round(durationSeconds * 0.3) },
    { beatNumber: 4, title: "Payoff", summary: `${characters[0].name} lands a small win with a final saveable line: "${spokenLines[5]}".`, characterFocus: characters[0].name, emotionalPurpose: "Deliver confidence or light comic relief.", estimatedSeconds: Math.max(3, Math.round(durationSeconds * 0.2)) },
  ];
  const scriptJson = {
    projectTitle: title,
    duration: durationSeconds,
    category,
    dialogueLanguage,
    screenType,
    logline: `A beginner-friendly short where ${characters[0].name} turns "${title}" into one small believable decision.`,
    centralConflict: `${characters[0].name} wants the payoff, but hesitation and social pressure make the first step feel too big.`,
    storyline: `The story opens on ${characters[0].name} stuck at the decision point. ${characters[1].name} notices the hesitation and gives a tiny practical nudge. Instead of solving everything, ${characters[0].name} takes one small action. The final moment shows a visible emotional shift that makes the idea feel repeatable.`,
    emotionalArc: "Doubt -> recognition -> small action -> payoff",
    hook: "Open on the character caught mid-thought before explaining the idea.",
    endingPayoff: "End with a clear line or look that viewers can save.",
    setting: screenType === "horizontal" ? "Simple everyday location staged for a 16:9 frame" : "Simple everyday location staged for a 9:16 phone frame",
    inferredTone: "Practical, relatable, beginner-friendly",
    characters,
    beats,
  };
  return {
    ideaId: idea?.id,
    lockedIdeaId: idea?.lockedIdeaId,
    title,
    scriptText: buildStoryScriptTextFromDraft(scriptJson),
    scriptJson,
    durationSeconds,
    status: "SCRIPT_GENERATED",
  };
}

function buildLocalGeneratedScriptFromIdea(idea, durationSeconds = 30, dialogueLanguage = "English", screenType = "vertical", category = "creator") {
  const sceneCount = Number(durationSeconds) >= 60 ? 10 : Number(durationSeconds) >= 45 ? 8 : 6;
  const segment = Math.max(1, Math.round(Number(durationSeconds) / sceneCount));
  const hook = idea?.creativeNotes?.hook || idea?.title || "Selected story idea";
  const { spokenLines, screenCopy } = localLanguageLines(dialogueLanguage, hook);
  const scenes = Array.from({ length: sceneCount }, (_, index) => {
    const start = index * segment;
    const end = index === sceneCount - 1 ? Number(durationSeconds) : Math.min(Number(durationSeconds), (index + 1) * segment);
    return {
      sceneNumber: index + 1,
      time: `${start}-${end} sec`,
      camera: ["Cold open close-up", "Insert detail", "Medium setup", "Handheld follow", "Reaction close-up", "End frame wide"][Math.min(index, 5)],
      visual: [
        "Open on the creator caught at the decision point.",
        "Show the object or place that makes the story concrete.",
        "Reveal the small problem the audience recognizes.",
        "Show one visible action that changes the energy.",
        "Hold the reaction that proves the payoff.",
        "Close with a clean saveable line.",
      ][Math.min(index, 5)],
      dialogue: spokenLines[Math.min(index, 5)],
      screenText: screenCopy[Math.min(index, 5)],
      directorNote: `Keep it phone-friendly, natural, and framed for ${screenType === "horizontal" ? "horizontal 16:9 center-safe composition" : "vertical short-form safe zones"}.`,
      intent: ["Hook", "Ground the story", "Build relatability", "Show action", "Deliver payoff", "Create save intent"][Math.min(index, 5)],
    };
  });

  return {
    ideaId: idea?.id,
    lockedIdeaId: idea?.lockedIdeaId,
    title: idea?.title || "Generated Script",
    script: scenes.map((scene) => `${scene.time}: ${scene.visual} VO: ${scene.dialogue}`).join("\n"),
    scenes,
    scriptJson: {
      projectTitle: idea?.title || "Generated Script",
      duration: durationSeconds,
      totalShots: scenes.length,
      pacingStyle: "Local preview pacing with a clear hook, middle action, and saveable close",
      emotionalArc: "Decision point -> small action -> visible payoff",
      hookStrategy: "Start with the human hesitation before explaining the idea.",
      creatorFitReasoning: "Phone-friendly local preview while backend generation is unavailable.",
      audienceFitReasoning: "Clear short-form structure with relatable dialogue.",
      overallExecutionDifficulty: "Beginner Friendly",
      category,
      dialogueLanguage,
      screenType,
      shots: scenes.map((scene, index) => ({
        shotNumber: index + 1,
        title: scene.camera,
        purpose: scene.intent,
        shotType: scene.camera,
        cameraAngle: screenType === "horizontal" ? "Centered 16:9 frame" : "Centered 9:16 frame",
        cameraMovement: index % 2 === 0 ? "Static" : "Handheld light",
        fps: 30,
        setDesign: screenType === "horizontal"
          ? "Simple everyday set arranged for a 16:9 frame, with subject center-safe and side clutter removed."
          : "Simple everyday set arranged for a 9:16 phone frame, with clean background and safe text space.",
        peopleInFrame: index === 2 || index === 3 ? 2 : 1,
        primaryActors: ["Main creator"],
        sideActors: index === 2 || index === 3 ? ["Support friend"] : [],
        primaryActorAction: scene.visual,
        sideActorAction: index === 2 || index === 3 ? "Support friend reacts subtly or gives a small practical nudge without taking focus." : "No side actor required in this shot.",
        action: scene.visual,
        voiceOver: scene.dialogue,
        dialogue: { creator: scene.dialogue },
        textOverlay: scene.screenText,
        creatorDirection: scene.directorNote,
        sketchPrompt: `Monochrome storyboard sketch, ${scene.camera}, ${screenType === "horizontal" ? "horizontal 16:9 composition" : "vertical 9:16 composition"}, phone-friendly creator short.`,
      })),
    },
    durationSeconds,
    status: "SCRIPT_GENERATED",
  };
}

function localLanguageLines(language, hook) {
  const value = String(language || "").toLowerCase();
  if (value.includes("hindi") || value.includes("hinglish")) {
    return {
      spokenLines: [
        "Yahin main usually ruk jata hoon.",
        "Excuse mujhse pehle ready tha.",
        "Phir mujhe asli block samajh aaya.",
        "Toh maine bas ek chhota version try kiya.",
        "Us chhote shift ne sab badal diya.",
        `${hook}. Isse save kar lo.`,
      ],
      screenCopy: ["THE MOMENT", "EXCUSE READY", "REAL BLOCK", "ONE MOVE", "SHIFT", "SAVE THIS"],
    };
  }
  if (value.includes("tamil")) {
    return {
      spokenLines: ["Naan inga dhaan nikkaporen.", "Excuse already ready irundhudhu.", "Appuram real block purinjiduchu.", "Oru chinna version try panninen.", "Andha chinna shift ellam maathiduchu.", `${hook}. Idha save pannunga.`],
      screenCopy: ["MOMENT", "EXCUSE", "REAL BLOCK", "ONE STEP", "SHIFT", "SAVE"],
    };
  }
  if (value.includes("telugu")) {
    return {
      spokenLines: ["Nenu ikkade aagipothanu.", "Excuse mundhe ready ga undi.", "Tarvata real block ardham ayyindi.", "Oka chinna version try chesanu.", "Aa chinna shift anni marchindi.", `${hook}. Idi save chesuko.`],
      screenCopy: ["MOMENT", "EXCUSE", "REAL BLOCK", "ONE STEP", "SHIFT", "SAVE"],
    };
  }
  if (value.includes("bengali") || value.includes("bangla")) {
    return {
      spokenLines: ["Ami ekhanei theme jetam.", "Excuse age thekei ready chhilo.", "Tarpor real block ta bujhlam.", "Ekta chhoto version try korlam.", "Oi chhoto shift sob bodle dilo.", `${hook}. Eta save kore rakho.`],
      screenCopy: ["MOMENT", "EXCUSE", "REAL BLOCK", "ONE STEP", "SHIFT", "SAVE"],
    };
  }
  if (value.includes("marathi")) {
    return {
      spokenLines: ["Mi ithech thambnar hoto.", "Excuse adhich ready hota.", "Mag khara block kalala.", "Ek chhota version try kela.", "Tya chhotya shift ne sagla badalla.", `${hook}. He save kara.`],
      screenCopy: ["MOMENT", "EXCUSE", "REAL BLOCK", "ONE STEP", "SHIFT", "SAVE"],
    };
  }
  return {
    spokenLines: [
      "This is where I usually stop.",
      "The excuse was ready before I was.",
      "Then I noticed the real block.",
      "So I tried one small version.",
      "That tiny shift changed everything.",
      `${hook}. Save this before you forget it.`,
    ],
    screenCopy: ["THE MOMENT", "THE EXCUSE", "THE BLOCK", "ONE MOVE", "THE SHIFT", "SAVE THIS"],
  };
}

function normalizeGeneratedScriptScenes(scenes = []) {
  return (Array.isArray(scenes) ? scenes : []).map((scene, index) => ({
    ...scene,
    id: scene.id || scene.sceneId || `shot-${scene.shotNumber || index + 1}`,
    sceneId: scene.sceneId || scene.id || `shot-${scene.shotNumber || index + 1}`,
    shotNumber: scene.shotNumber || index + 1,
    time: scene.time || scene.timestamp || (scene.startTime && scene.endTime ? `${scene.startTime}-${scene.endTime}` : `${index * 5}-${(index + 1) * 5} sec`),
    camera: scene.camera || scene.cameraAngle || scene.shotType || "Director shot",
    visual: scene.visual || scene.action || scene.description || scene.visualDirection || "Scene visual detail",
    dialogue: textValue(scene.dialogue || scene.vo || scene.voiceOver || scene.voiceover || "No dialogue"),
    screenText: scene.screenText || scene.textOverlay || scene.text || "No screen text",
    directorNote: scene.directorNote || scene.creatorDirection || scene.direction || "Use the generated direction for this beat.",
    intent: scene.intent || scene.retentionGoal || scene.intendedImpact || scene.emotionalImpact || "Move the story forward.",
  }));
}

function normalizeStoryboardResponse(response = {}, scriptIdea = {}) {
  const scenes = Array.isArray(response.scenes) ? response.scenes : [];
  const responseImageAssets = collectStoryboardImageAssets(response);
  const normalizedScenes = scenes.map((scene, index) => {
    const sceneWithImages = mergeSceneImageSources(scene, responseImageAssets, index);
    const storyboardTag = sceneWithImages.storyboardTag || {};
    const lightingBuildSheetTag = sceneWithImages.lightingBuildSheetTag || {};
    const cameraPlanSheetTag = sceneWithImages.cameraPlanSheetTag || {};
    const imageFields = normalizeShotImageFields(sceneWithImages);
    return {
      ...sceneWithImages,
      id: sceneWithImages.id || sceneWithImages.sceneId || `shot-${sceneWithImages.shotNumber || index + 1}`,
      timestamp: sceneWithImages.timestamp || buildTimestamp(sceneWithImages.startTime, sceneWithImages.endTime),
      description: sceneWithImages.description || storyboardTag.narrativeBeatSummary || storyboardTag.action || sceneWithImages.title,
      visualDirection: sceneWithImages.visualDirection || storyboardTag.compositionSummary || storyboardTag.action,
      dialogue: sceneWithImages.dialogue || storyboardTag.primaryDialogue || {},
      textOverlay: sceneWithImages.textOverlay ?? storyboardTag.textOverlay,
      lighting: sceneWithImages.lighting || storyboardTag.lightingAtmosphericDescription || lightingBuildSheetTag.cinematicIntent,
      environment: sceneWithImages.environment || storyboardTag.environment || storyboardTag.setDesign,
      title: sceneWithImages.title || storyboardTag.shotTitle || cameraPlanSheetTag.shotTitle || `Shot ${sceneWithImages.shotNumber || index + 1}`,
      signedUrl: imageFields.storyboardImageUrl,
      imageUrl: imageFields.storyboardImageUrl,
      storyboardImageUrl: imageFields.storyboardImageUrl,
      publicUrl: imageFields.storyboardImageUrl,
      assetUrl: imageFields.storyboardImageUrl,
      lightingImageUrl: imageFields.lightingImageUrl,
      cameraPlanImageUrl: imageFields.cameraPlanImageUrl,
      screenType: sceneWithImages.screenType || response.screenType || scriptIdea.screenType || scriptIdea.scriptJson?.screenType || "vertical",
      renderWidth: sceneWithImages.renderWidth || response.renderWidth || (response.screenType === "horizontal" ? 1920 : 1080),
      renderHeight: sceneWithImages.renderHeight || response.renderHeight || (response.screenType === "horizontal" ? 1080 : 1920),
      lightingObjectKey: sceneWithImages.lightingObjectKey || sceneWithImages.lighting_object_key || "",
      cameraPlanObjectKey: sceneWithImages.cameraPlanObjectKey || sceneWithImages.camera_plan_object_key || "",
      storyboardTag,
      lightingBuildSheetTag,
      cameraPlanSheetTag,
    };
  });

  return {
    ...response,
    id: response.id || response.storyboardId,
    storyboardId: response.storyboardId || response.id,
    projectId: response.projectId || scriptIdea.projectId,
    title: response.title || scriptIdea.title || scriptIdea.scriptJson?.projectTitle || "Generated Storyboard",
    durationSeconds: response.durationSeconds || scriptIdea.durationSeconds || scriptIdea.scriptJson?.duration,
    totalShots: response.totalShots || normalizedScenes.length,
    scenes: normalizedScenes,
    productionPlanTags: extractProductionPlanTagsFromScenes(normalizedScenes),
  };
}

function normalizeShotImageFields(scene = {}) {
  const imageKind = normalizeImageAssetKind(scene.imageKind || scene.image_kind || scene.kind || scene.assetKind || scene.asset_kind || scene.imageType || scene.image_type || scene.type || scene.role);
  const imageAssets = collectStoryboardImageAssets(scene);
  const directImageUrl = firstText(
    scene.signedUrl,
    scene.signed_url,
    scene.presignedUrl,
    scene.presigned_url,
    scene.imageUrl,
    scene.image_url,
    scene.storyboardImageUrl,
    scene.storyboard_image_url,
    scene.publicUrl,
    scene.public_url,
    scene.assetUrl,
    scene.asset_url,
    scene.downloadUrl,
    scene.download_url,
    scene.url,
    imageUrlFromObject(scene.storyboardImage),
    imageUrlFromObject(scene.storyboardAsset),
    imageUrlFromObject(scene.image),
    imageUrlFromObject(scene.asset),
    imageUrlFromObject(scene.file),
    imageUrlFromObject(scene.media),
    imageUrlFromObject(scene.result),
    imageUrlFromObject(scene.data)
  );
  const isLightingImage = imageKind === "lighting";
  const isCameraImage = imageKind === "dp";
  const storyboardImageUrl = firstText(
    scene.storyboardImageUrl,
    scene.storyboard_image_url,
    imageUrlFromObject(scene.storyboardImage),
    imageUrlFromObject(scene.storyboardAsset),
    imageUrlByKind(imageAssets, "storyboard"),
    !isLightingImage && !isCameraImage ? directImageUrl : ""
  );

  return {
    storyboardImageUrl,
    lightingImageUrl: firstText(
      scene.lightingImageUrl,
      scene.lighting_image_url,
      scene.lightImageUrl,
      scene.light_image_url,
      imageUrlFromObject(scene.lightingImage),
      imageUrlFromObject(scene.lightingAsset),
      imageUrlByKind(imageAssets, "lighting"),
      isLightingImage ? directImageUrl : ""
    ),
    cameraPlanImageUrl: firstText(
      scene.cameraPlanImageUrl,
      scene.camera_plan_image_url,
      scene.dpImageUrl,
      scene.dp_image_url,
      scene.cameraImageUrl,
      scene.camera_image_url,
      imageUrlFromObject(scene.cameraPlanImage),
      imageUrlFromObject(scene.cameraPlanAsset),
      imageUrlFromObject(scene.dpImage),
      imageUrlFromObject(scene.dpAsset),
      imageUrlByKind(imageAssets, "dp"),
      isCameraImage ? directImageUrl : ""
    ),
  };
}

function normalizeShotImageResult(result = {}, baseScene = {}, shotNumber = 1, imageKind = "storyboard") {
  const data = firstObject(result?.data) || {};
  const nestedScene = firstObject(
    result?.scene,
    result?.shot,
    result?.storyboardScene,
    result?.storyboard_scene,
    data.scene,
    data.shot,
    data.storyboardScene,
    data.storyboard_scene
  ) || {};
  const nestedImage = firstObject(
    result?.image,
    result?.asset,
    result?.imageAsset,
    result?.image_asset,
    data.image,
    data.asset,
    data.imageAsset,
    data.image_asset
  ) || {};
  const candidate = {
    ...baseScene,
    ...nestedScene,
    ...data,
    ...result,
    image: nestedImage,
    asset: firstObject(result?.asset, data.asset, nestedImage) || nestedImage,
    images: firstArray(result?.images, result?.assets, result?.shotImages, result?.shot_images, data.images, data.assets, data.shotImages, data.shot_images),
    imageKind: result?.imageKind || result?.image_kind || data.imageKind || data.image_kind || imageKind,
    shotNumber: Number(result?.shotNumber || result?.shot_number || data.shotNumber || data.shot_number || nestedScene.shotNumber || nestedScene.shot_number || baseScene?.shotNumber || shotNumber),
  };
  const stableSceneId = baseScene?.sceneId || baseScene?.id || nestedScene.sceneId || nestedScene.id || `shot-${candidate.shotNumber}`;
  return {
    ...candidate,
    id: stableSceneId,
    sceneId: stableSceneId,
  };
}

function collectStoryboardImageAssets(source = {}) {
  if (!source || typeof source !== "object") return [];
  return [
    source.images,
    source.imageAssets,
    source.image_assets,
    source.assets,
    source.shotImages,
    source.shot_images,
    source.generatedImages,
    source.generated_images,
    source.storyboardImages,
    source.storyboard_images,
    source.lightingImages,
    source.lighting_images,
    source.cameraPlanImages,
    source.camera_plan_images,
    source.dpImages,
    source.dp_images,
  ].flatMap((value) => Array.isArray(value) ? value : [])
    .filter((item) => item && typeof item === "object");
}

function mergeSceneImageSources(scene = {}, responseImageAssets = [], index = 0) {
  const shotNumber = Number(scene?.shotNumber || scene?.shot_number || index + 1);
  const matchingAssets = responseImageAssets.filter((asset) => imageAssetShotNumber(asset) === shotNumber);
  if (!matchingAssets.length) return scene;
  return matchingAssets.reduce((merged, asset) => {
    const kind = normalizeImageAssetKind(asset.imageKind || asset.image_kind || asset.kind || asset.assetKind || asset.asset_kind || asset.type || asset.role || asset.objectKey || asset.object_key || imageUrlFromObject(asset));
    const url = imageUrlFromObject(asset);
    if (!url) return merged;
    if (kind === "lighting") return { ...merged, lightingImageUrl: merged.lightingImageUrl || url };
    if (kind === "dp") return { ...merged, cameraPlanImageUrl: merged.cameraPlanImageUrl || url };
    return {
      ...merged,
      signedUrl: merged.signedUrl || url,
      imageUrl: merged.imageUrl || url,
      storyboardImageUrl: merged.storyboardImageUrl || url,
      publicUrl: merged.publicUrl || url,
      assetUrl: merged.assetUrl || url,
    };
  }, scene);
}

function imageAssetShotNumber(asset = {}) {
  const explicit = Number(asset.shotNumber || asset.shot_number || asset.shotNo || asset.shot_no || asset.number || 0);
  if (explicit) return explicit;
  const text = [
    asset.objectKey,
    asset.object_key,
    asset.key,
    asset.path,
    asset.url,
    asset.imageUrl,
    asset.image_url,
  ].filter(Boolean).join(" ");
  const match = text.match(/shot[-_/ ]?(\d+)|\/(\d+)\.(?:png|jpg|jpeg|webp)/i);
  return match ? Number(match[1] || match[2]) : 0;
}

function imageUrlByKind(assets = [], targetKind = "storyboard") {
  const normalizedTarget = normalizeImageAssetKind(targetKind);
  const match = assets.find((asset) => {
    const kind = normalizeImageAssetKind(asset.imageKind || asset.image_kind || asset.kind || asset.assetKind || asset.asset_kind || asset.imageType || asset.image_type || asset.type || asset.role || asset.objectKey || asset.object_key || imageUrlFromObject(asset));
    return kind === normalizedTarget;
  });
  return imageUrlFromObject(match);
}

function imageUrlFromObject(value = {}) {
  if (!value || typeof value !== "object") return "";
  return firstText(
    value.signedUrl,
    value.signed_url,
    value.presignedUrl,
    value.presigned_url,
    value.imageUrl,
    value.image_url,
    value.storyboardImageUrl,
    value.storyboard_image_url,
    value.publicUrl,
    value.public_url,
    value.assetUrl,
    value.asset_url,
    value.downloadUrl,
    value.download_url,
    value.url,
    value.href,
    value.location,
    value.src,
    value.path,
    value.file?.signedUrl,
    value.file?.signed_url,
    value.file?.url,
    value.media?.signedUrl,
    value.media?.signed_url,
    value.media?.url,
    value.asset?.signedUrl,
    value.asset?.signed_url,
    value.asset?.publicUrl,
    value.asset?.public_url,
    value.asset?.url,
    value.image?.signedUrl,
    value.image?.signed_url,
    value.image?.publicUrl,
    value.image?.public_url,
    value.image?.url
  );
}

function normalizeImageAssetKind(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("light")) return "lighting";
  if (text.includes("camera") || text.includes("dp") || text.includes("director_photography")) return "dp";
  return "storyboard";
}

function shotImageLoadingKey(shotNumber, imageKind = "storyboard") {
  return `${Number(shotNumber || 1)}:${normalizeImageAssetKind(imageKind)}`;
}

function shotImageLoadingKeysForScenes(scenes = []) {
  return (Array.isArray(scenes) ? scenes : [])
    .flatMap((scene, index) => {
      const shotNumber = Number(scene?.shotNumber || scene?.shot_number || index + 1);
      return ["storyboard", "lighting", "dp"].map((kind) => shotImageLoadingKey(shotNumber, kind));
    });
}

function mergeShotImageUrlsIntoScenes(scenes = [], shotImages = []) {
  if (!Array.isArray(scenes) || !Array.isArray(shotImages) || !shotImages.length) return scenes;
  const imageByShot = new Map(shotImages
    .filter((item) => item && typeof item === "object")
    .map((item) => [Number(item.shotNumber || item.shot_number || 0), item])
    .filter(([shotNumber]) => shotNumber > 0));
  if (!imageByShot.size) return scenes;
  return scenes.map((scene, index) => {
    const shotNumber = Number(scene?.shotNumber || scene?.shot_number || index + 1);
    const image = imageByShot.get(shotNumber);
    if (!image) return scene;
    const storyboardUrl = firstText(image.storyboardImageUrl, image.storyboard_image_url, image.signedUrl, image.signed_url, image.imageUrl, image.image_url);
    const lightingUrl = firstText(image.lightingImageUrl, image.lighting_image_url);
    const cameraUrl = firstText(image.cameraPlanImageUrl, image.camera_plan_image_url, image.dpImageUrl, image.dp_image_url);
    return {
      ...scene,
      shotNumber,
      storyboardImageAssetId: image.storyboardImageAssetId || image.storyboard_image_asset_id || scene.storyboardImageAssetId,
      imageAssetId: image.storyboardImageAssetId || image.storyboard_image_asset_id || scene.imageAssetId,
      objectKey: image.storyboardObjectKey || image.storyboard_object_key || scene.objectKey,
      signedUrl: storyboardUrl || scene.signedUrl,
      imageUrl: storyboardUrl || scene.imageUrl,
      storyboardImageUrl: storyboardUrl || scene.storyboardImageUrl,
      publicUrl: storyboardUrl || scene.publicUrl,
      assetUrl: storyboardUrl || scene.assetUrl,
      lightingImageAssetId: image.lightingImageAssetId || image.lighting_image_asset_id || scene.lightingImageAssetId,
      lightingObjectKey: image.lightingObjectKey || image.lighting_object_key || scene.lightingObjectKey,
      lightingImageUrl: lightingUrl || scene.lightingImageUrl,
      cameraPlanImageAssetId: image.cameraPlanImageAssetId || image.camera_plan_image_asset_id || scene.cameraPlanImageAssetId,
      cameraPlanObjectKey: image.cameraPlanObjectKey || image.camera_plan_object_key || scene.cameraPlanObjectKey,
      cameraPlanImageUrl: cameraUrl || scene.cameraPlanImageUrl,
    };
  });
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function extractProductionPlanTagsFromScenes(scenes = []) {
  return (Array.isArray(scenes) ? scenes : [])
    .filter(hasProductionPlanData)
    .map((scene, index) => {
      const storyboardTag = extractStoryboardTag(scene);
      const lightingBuildSheetTag = extractLightingTag(scene);
      const cameraPlanSheetTag = extractCameraTag(scene);
      return {
        planId: scene.sceneId || scene.id || scene.planId || `scene-plan-${index}`,
        shotNumber: scene.shotNumber || storyboardTag?.shotNumber || lightingBuildSheetTag?.shotNumber || cameraPlanSheetTag?.shotNumber || index + 1,
        styleKey: scene.styleKey || storyboardTag?.styleKey || "indian_creator_pencil",
        storyboardTag,
        lightingBuildSheetTag,
        cameraPlanSheetTag,
      };
    });
}

function mergeScreenplayScenesWithProductionPlans(screenplayScenes = [], productionPlans = []) {
  const plansByShot = new Map((Array.isArray(productionPlans) ? productionPlans : [])
    .map((plan, index) => [Number(plan?.shotNumber || plan?.storyboardTag?.shotNumber || index + 1), plan]));
  return (Array.isArray(screenplayScenes) ? screenplayScenes : []).map((scene, index) => {
    const shotNumber = Number(scene?.shotNumber || index + 1);
    const plan = plansByShot.get(shotNumber) || {};
    return {
      ...scene,
      id: scene?.id || scene?.sceneId || `shot-${shotNumber}`,
      sceneId: scene?.sceneId || scene?.id || `shot-${shotNumber}`,
      shotNumber,
      storyboardTag: extractStoryboardTag(scene) || extractStoryboardTag(plan) || {},
      lightingBuildSheetTag: extractLightingTag(scene) || extractLightingTag(plan) || {},
      cameraPlanSheetTag: extractCameraTag(scene) || extractCameraTag(plan) || {},
      planId: plan.planId || scene?.planId || "",
    };
  });
}

function hasProductionPlanData(value = {}) {
  return Boolean(extractStoryboardTag(value) || extractLightingTag(value) || extractCameraTag(value));
}

function extractStoryboardTag(value = {}) {
  const tag = firstObject(
    value.storyboardTag,
    value.storyboard_tag,
    value.storyboard,
    value.storyboardPlan,
    value.storyboard_plan,
    value.tags?.storyboardTag,
    value.tags?.storyboard
  );
  return tag || (looksLikeStoryboardTag(value) ? value : null);
}

function extractLightingTag(value = {}) {
  const tag = firstObject(
    value.lightingBuildSheetTag,
    value.lighting_build_sheet_tag,
    value.lightingTag,
    value.lighting,
    value.lightingPlan,
    value.lightPlan,
    value.tags?.lightingBuildSheetTag,
    value.tags?.lighting
  );
  return tag || (looksLikeLightingTag(value) ? value : null);
}

function extractCameraTag(value = {}) {
  const tag = firstObject(
    value.cameraPlanSheetTag,
    value.camera_plan_sheet_tag,
    value.cameraPlanTag,
    value.camera,
    value.cameraPlan,
    value.dpPlan,
    value.tags?.cameraPlanSheetTag,
    value.tags?.camera
  );
  return tag || (looksLikeCameraTag(value) ? value : null);
}

function looksLikeStoryboardTag(value = {}) {
  return Boolean(value.shotTitle || value.narrativeBeatSummary || value.compositionSummary || value.primaryDialogue || value.targetFocalPoint || value.soundDesign || value.soundCues);
}

function looksLikeLightingTag(value = {}) {
  return Boolean(value.cinematicIntent || value.floorPlan || value.gearCards || value.keyLight || value.estimatedSetupMinutes);
}

function looksLikeCameraTag(value = {}) {
  return Boolean(value.cameraRig || value.movementSpec || value.framePreview || value.blockingMap || value.lensSuggestion);
}

function replaceSceneByShotNumber(scenes = [], replacement = {}) {
  const shotNumber = Number(replacement?.shotNumber || 0);
  const source = Array.isArray(scenes) ? scenes : [];
  let replaced = false;
  const updated = source.map((scene, index) => {
    const currentShot = Number(scene?.shotNumber || index + 1);
    if (shotNumber && currentShot === shotNumber) {
      replaced = true;
      return mergeScenePreservingImages(scene, replacement);
    }
    return scene;
  });
  return replaced ? updated : [...updated, replacement].sort((a, b) => Number(a?.shotNumber || 0) - Number(b?.shotNumber || 0));
}

function mergeScenePreservingImages(existing = {}, replacement = {}) {
  const merged = { ...existing, ...replacement };
  ["signedUrl", "imageUrl", "storyboardImageUrl", "publicUrl", "assetUrl", "lightingImageUrl", "cameraPlanImageUrl"].forEach((field) => {
    if (!replacement[field] && existing[field]) {
      merged[field] = existing[field];
    }
  });
  return merged;
}

function mergeProductionPlanTags(existing = [], incoming = []) {
  const byShot = new Map();
  const addPlan = (plan, index) => {
    if (!plan || typeof plan !== "object") return;
    const shotNumber = Number(plan.shotNumber || plan.storyboardTag?.shotNumber || plan.lightingBuildSheetTag?.shotNumber || plan.cameraPlanSheetTag?.shotNumber || index + 1);
    if (!shotNumber) return;
    byShot.set(shotNumber, { ...(byShot.get(shotNumber) || {}), ...plan, shotNumber });
  };
  (Array.isArray(existing) ? existing : []).forEach(addPlan);
  (Array.isArray(incoming) ? incoming : []).forEach(addPlan);
  return Array.from(byShot.values()).sort((a, b) => Number(a.shotNumber || 0) - Number(b.shotNumber || 0));
}

function extractShotNumberFromText(value = "") {
  const match = String(value || "").match(/shot\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function buildTimestamp(startTime, endTime) {
  if (startTime && endTime) return `${startTime}-${endTime}`;
  if (startTime) return String(startTime);
  return "";
}

function buildStoryScriptTextFromDraft(scriptJson = {}) {
  const characters = Array.isArray(scriptJson.characters) ? scriptJson.characters : [];
  const beats = Array.isArray(scriptJson.beats) ? scriptJson.beats : [];
  return [
    `Title: ${scriptJson.projectTitle || "Creator Story Script"}`,
    `Duration: ${scriptJson.duration || 30}s`,
    `Dialogue Language: ${scriptJson.dialogueLanguage || "English"}`,
    `Screen Type: ${scriptJson.screenType || "vertical"}`,
    "",
    "Logline:",
    scriptJson.logline || "",
    "",
    "Storyline:",
    scriptJson.storyline || "",
    "",
    "Central Conflict:",
    scriptJson.centralConflict || "",
    "",
    "Characters:",
    ...characters.map((character) => [
      `${character.name || "Character"} (${character.role || "Role"})`,
      `Gender: ${character.gender || ""}`,
      `Age: ${character.age || character.ageRange || ""}`,
      `Look: ${character.look || character.visualIdentity || ""}`,
      `Profile: ${character.profile || character.persona || ""}`,
      `Persona: ${character.persona || ""}`,
      `Backstory: ${character.backstory || ""}`,
    ].join("\n")),
    "",
    "Story Beats:",
    ...beats.map((beat, index) => `${beat.beatNumber || index + 1}. ${beat.title || "Beat"} - ${beat.summary || ""}`),
  ].join("\n");
}

function buildScriptTextFromDraft(scriptJson = {}) {
  const shots = Array.isArray(scriptJson.shots) ? scriptJson.shots : [];
  return [
    `Title: ${scriptJson.projectTitle || "Creator Short Script"}`,
    `Duration: ${scriptJson.duration || 30}s`,
    `Dialogue Language: ${scriptJson.dialogueLanguage || "English"}`,
    `Screen Type: ${scriptJson.screenType || "vertical"}`,
    "",
    ...shots.map((shot, index) => [
      `Shot ${shot.shotNumber || index + 1}: ${shot.title || "Untitled"}`,
      `Purpose: ${shot.purpose || ""}`,
      `Action: ${shot.action || ""}`,
      `Dialogue: ${textValue(shot.dialogue)}`,
      `Voice Over: ${shot.voiceOver || ""}`,
      `Text Overlay: ${shot.textOverlay || ""}`,
      `Camera: ${shot.shotType || ""} / ${shot.cameraAngle || ""} / ${shot.cameraMovement || ""}`,
      `Set Design: ${shot.setDesign || ""}`,
      `People In Frame: ${shot.peopleInFrame || 1}`,
      `Primary Actors: ${textValue(shot.primaryActors)}`,
      `Side Actors: ${textValue(shot.sideActors)}`,
      `Primary Actor Action: ${shot.primaryActorAction || ""}`,
      `Side Actor Action: ${shot.sideActorAction || ""}`,
      `Direction: ${shot.creatorDirection || ""}`,
    ].join("\n")),
  ].join("\n\n");
}

function textValue(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${textValue(item)}`).join("\n");
  }
  return String(value);
}

function textToArray(value) {
  if (Array.isArray(value)) return value;
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function mergeUniqueIdeas(current = [], incoming = []) {
  const merged = [...incoming, ...current];
  return merged.filter((idea, index) => merged.findIndex((candidate) => candidate.id === idea.id) === index);
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function buildPendingTrendInsight(trend) {
  return {
    trendId: trend?.id,
    summary: trend?.summary,
    whyItWorked: [],
    bestTimes: [],
    creatorActions: [],
    postingStrategy: {
      audiencePeakLabel: "Awaiting AI",
    },
  };
}

function buildHashtags(category, title) {
  const safeCategory = category ? String(category).replace(/[^a-z0-9]/gi, "") : "CreatorTrend";
  const safeTitle = title ? String(title).split(/\s+/).slice(0, 2).join("").replace(/[^a-z0-9]/gi, "") : "Shorts";
  return [`#${safeCategory}`, `#${safeTitle}`, "#Trend"];
}

function statusFromScore(score) {
  if (score >= 82) return "Very Hot";
  if (score >= 68) return "Hot";
  return "Trending";
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatCompactNumber(value) {
  const number = Math.max(0, Number(value) || 0);
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return `${Math.round(number)}`;
}

function timeframeToDays(timeframe) {
  if (timeframe === "24h") return 1;
  if (timeframe === "30d") return 30;
  return 7;
}

function timeframeToHours(timeframe) {
  return timeframeToDays(timeframe) * 24;
}

function normalizePlatformCode(value) {
  if (value === "instagram") return "instagram_reels";
  if (value === "youtube") return "youtube_shorts";
  return value || "instagram_reels";
}

function resolveWorkflowCategoryCode(lockedBrief, idea, currentCategory) {
  if (!TREND_DISCOVERY_ENABLED) return "AI_INFER_FROM_IDEA";
  const isTrendBrief = lockedBrief?.source === "trend" || lockedBrief?.sourceType === "TREND" || lockedBrief?.trendId;
  if (!isTrendBrief) return "AI_INFER_FROM_IDEA";
  return currentCategory || "creator";
}

function normalizePlatformOptions(options) {
  const normalized = (options || []).map((option) => {
    const code = normalizePlatformCode(option.value || option.code || option.platformCode);
    return {
      ...option,
      value: code,
      code,
      label: option.label || option.displayName || option.name || code,
      displayName: option.displayName || option.label || option.name || code,
      description: option.description || "",
    };
  });
  return normalized.filter((option, index) => normalized.findIndex((candidate) => candidate.code === option.code) === index);
}

function normalizeCategoryOptions(options) {
  const normalized = (options || []).map((option) => {
    const code = option.value || option.code || option.categoryCode;
    return {
      ...option,
      value: code,
      code,
      label: option.label || option.displayName || option.name || code,
      displayName: option.displayName || option.label || option.name || code,
      description: option.description || "",
    };
  });
  return normalized.filter((option, index) => option.code && normalized.findIndex((candidate) => candidate.code === option.code) === index);
}

function buildOrganizationSetupPayload(draft = {}) {
  const name = String(draft.name || "Creator Organization").trim();
  const slug = slugifyTenant(draft.slug || name);
  const currency = draft.currency || "INR";
  return {
    name,
    companyName: name,
    slug,
    adminEmail: draft.adminEmail || null,
    countryCode: draft.countryCode || "IN",
    productCode: "CREATOR",
    requestedApps: ["CREATOR"],
    planCode: "CREATOR_STARTER",
    currency,
    wallet: {
      currency,
      initialAmount: Number(draft.initialWalletAmount) || 0,
    },
    metadata: {
      source: "creator-ui",
    },
  };
}

function extractOrganizationIdentity(organization = {}, fallback = {}) {
  const tenantId = sanitizeTenantId(organization?.tenantId || organization?.tenant_id || organization?.id);
  const name = organization?.name || organization?.companyName || organization?.company_name || fallback?.name || "Creator Organization";
  return {
    tenantId,
    slug: organization?.slug || fallback?.slug || slugifyTenant(name),
    name,
    companyName: organization?.companyName || organization?.company_name || name,
  };
}

function persistTenantId(tenantId) {
  try {
    if (typeof window !== "undefined" && tenantId) {
      window.localStorage.setItem("tenantId", tenantId);
    }
  } catch {
    // Local persistence is best-effort; Redux still carries the active tenant.
  }
}

function slugifyTenant(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "creator-org";
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function logCreatorWorkflowError(message, error, context = {}) {
  if (typeof console === "undefined" || typeof console.error !== "function") return;
  console.error(`[creator-ui] ${message}`, {
    ...context,
    error: normalizeApiErrorForLog(error),
  });
}

function normalizeApiErrorForLog(error) {
  if (!error) return null;
  const data = error.data || error.response?.data || null;
  return {
    status: error.status || error.originalStatus || error.response?.status || null,
    name: error.name || null,
    message: error.message || data?.message || data?.error || null,
    error: error.error || data?.error || null,
    path: data?.path || null,
    timestamp: data?.timestamp || null,
    data,
  };
}

function apiErrorMessage(error, fallback = "Request failed. Please check the missing fields and try again.") {
  const data = error?.data || error?.response?.data || null;
  const fieldMessages = data?.fields && typeof data.fields === "object" ? Object.values(data.fields).filter(Boolean) : [];
  if (fieldMessages.length) return String(fieldMessages[0]);
  if (data?.message) return String(data.message);
  if (data?.error && !/bad request/i.test(String(data.error))) return String(data.error);
  const raw = error?.message || error?.error || "";
  if (/mappings/i.test(String(raw))) {
    return "Map at least one story character to a cast profile before confirming cast.";
  }
  if (/uuid/i.test(String(raw))) {
    return "A project or idea id is invalid. Save the topic again so the workflow gets a real UUID.";
  }
  return fallback;
}

function extractMissingDetailsFromJob(job = {}) {
  return uniqueMissingDetails([
    ...collectSchemaIssues(job?.result),
    ...collectSchemaIssues(job?.outputPayload),
    ...extractMissingDetailsFromText(job?.errorMessage),
    ...extractMissingDetailsFromText(job?.message),
    ...extractMissingDetailsFromText(job?.result?.message),
  ]);
}

function extractMissingDetailsFromApiError(error = {}) {
  const data = error?.data || error?.response?.data || {};
  const fieldNames = data?.fields && typeof data.fields === "object" ? Object.keys(data.fields) : [];
  return uniqueMissingDetails([
    ...fieldNames,
    ...collectSchemaIssues(data),
    ...extractMissingDetailsFromText(data?.message),
    ...extractMissingDetailsFromText(data?.error),
    ...extractMissingDetailsFromText(error?.message),
    ...extractMissingDetailsFromText(error?.error),
  ]);
}

function collectSchemaIssues(value, depth = 0) {
  if (!value || depth > 8) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSchemaIssues(item, depth + 1));
  }
  if (typeof value !== "object") return [];
  const direct = Array.isArray(value.schemaIssues) ? value.schemaIssues : [];
  return [
    ...direct,
    ...Object.values(value).flatMap((item) => collectSchemaIssues(item, depth + 1)),
  ];
}

function extractMissingDetailsFromText(value = "") {
  const text = String(value || "");
  if (!text) return [];
  const match = text.match(/Missing or invalid fields:\s*([^.]*)\./i);
  if (!match?.[1] || /none detected/i.test(match[1])) return [];
  return match[1].split(",").map((item) => item.trim()).filter(Boolean);
}

function uniqueMissingDetails(details = []) {
  const seen = new Set();
  return details
    .map((detail) => String(detail || "").trim())
    .filter((detail) => detail && !/none detected/i.test(detail))
    .filter((detail) => {
      const key = detail.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeGenerationJobs(response = []) {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.content)
      ? response.content
      : Array.isArray(response?.items)
        ? response.items
        : [];

  return items
    .map((job) => ({
      ...job,
      jobId: job?.jobId || job?.id || "",
      inputPayload: job?.inputPayload || job?.input || {},
      result: job?.result || job?.outputPayload || {},
    }))
    .filter((job) => job.jobId);
}

function buildLockedBriefFromGenerationJob(job = {}) {
  const input = job.inputPayload || job.input || {};
  const page = extractPageFromGenerationJob(job);
  const firstIdea = Array.isArray(page?.content) ? page.content[0] : null;
  const lockedIdeaId = input.lockedIdeaId || job.lockedIdeaId || firstIdea?.lockedIdeaId;
  const projectId = input.projectId || job.projectId || firstIdea?.projectId;
  if (!lockedIdeaId) return null;
  const title = input.lockedIdeaTitle || input.title || firstIdea?.title || "Recovered creative brief";
  return {
    id: lockedIdeaId,
    lockedIdeaId,
    projectId,
    backendLocked: true,
    title,
    description: input.summary || title,
    durationSeconds: input.durationSeconds || firstIdea?.durationSeconds || 30,
    source: String(input.source || "original").toLowerCase(),
    recoveredFromJobId: job.jobId || job.id,
  };
}

function compactBriefForStorage(brief = {}) {
  if (!brief) return null;
  return {
    id: brief.id,
    lockedIdeaId: brief.lockedIdeaId,
    projectId: brief.projectId,
    backendLocked: brief.backendLocked,
    title: brief.title,
    description: brief.description,
    durationSeconds: brief.durationSeconds,
    trendId: brief.trendId,
    source: brief.source,
  };
}

function persistIdeaGenerationJob(job = {}) {
  try {
    if (typeof window === "undefined" || !job?.jobId) return;
    window.localStorage.setItem("creatorIdeaGenerationJob", JSON.stringify(job));
  } catch {
    // The backend job list is still the durable recovery source.
  }
}

function readStoredIdeaGenerationJob() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("creatorIdeaGenerationJob");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredIdeaGenerationJob(jobId) {
  try {
    if (typeof window === "undefined") return;
    const stored = readStoredIdeaGenerationJob();
    if (!jobId || !stored?.jobId || stored.jobId === jobId) {
      window.localStorage.removeItem("creatorIdeaGenerationJob");
    }
  } catch {
    // Nothing else to do; the server keeps the durable job state.
  }
}

function readStoredCreatorWorkflow() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(CREATOR_WORKFLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function persistStoredCreatorWorkflow(snapshot = {}) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CREATOR_WORKFLOW_STORAGE_KEY, JSON.stringify({
      ...snapshot,
      schemaVersion: 1,
    }));
  } catch {
    // Project history remains the durable backend source if browser storage is unavailable.
  }
}

function normalizeStoredIdeas(ideas = []) {
  return (Array.isArray(ideas) ? ideas : [])
    .filter((idea) => idea && typeof idea === "object")
    .map(normalizeGeneratedIdea);
}

function normalizeSavedIdeaSnapshots(ideas = []) {
  const stored = normalizeStoredIdeas(ideas);
  return stored.length ? stored : fallbackIdeas.slice(0, 1).map(normalizeGeneratedIdea);
}

function buildWorkflowStateFromProject(project = {}) {
  if (!project || typeof project !== "object") return null;
  const memorySnapshot = firstObject(project.memorySnapshot, project.memory_snapshot) || {};
  const preferences = firstObject(project.preferences) || {};
  project = { ...preferences, ...memorySnapshot, ...project, memorySnapshot, preferences };
  const projectId = project.projectId || project.project_id || project.id || "";
  if (!projectId) return null;

  const lockedBrief = buildLockedBriefFromProject(project);
  const ideaCandidates = normalizeProjectStoryIdeas(project, lockedBrief);
  const savedStoryIdea = normalizeProjectSavedStoryIdea(project, ideaCandidates, lockedBrief);
  const storyScriptIdea = normalizeProjectStoryScript(project, savedStoryIdea || ideaCandidates[0], lockedBrief);
  const scriptDetailIdea = normalizeProjectScreenplay(project, storyScriptIdea || savedStoryIdea || ideaCandidates[0], lockedBrief);
  const storyboard = normalizeProjectStoryboard(project, scriptDetailIdea);
  const castPlan = firstObject(
    project.castPlan,
    project.creatorCastPlan,
    project.castProfile,
    project.characterCastPlan
  );
  const audienceDecision = firstObject(
    project.audienceDecision,
    project.audience,
    project.targetAudience,
    project.confirmedAudience
  );

  const completedSteps = {
    trend: Boolean(lockedBrief),
    ideas: Boolean(savedStoryIdea || ideaCandidates.length),
    script: Boolean(storyScriptIdea),
    cast: Boolean(castPlan || project.characterCastMappings?.length || project.castMappings?.length),
    screenplay: Boolean(scriptDetailIdea),
    storyboard: Boolean(storyboard?.scenes?.length || scriptDetailIdea?.productionPlanTags?.length),
  };
  const workspacePage = completedSteps.storyboard
    ? "storyboard"
    : completedSteps.screenplay
      ? "screenplay"
      : completedSteps.cast
        ? "screenplay"
        : completedSteps.script
          ? "cast"
          : "script";

  return {
    projectId,
    lockedBrief,
    ideaCandidates,
    savedStoryIdea,
    storyScriptIdea,
    scriptDetailIdea,
    castPlan,
    audienceDecision,
    storyboard,
    storyboardSaved: Boolean(project.saved || project.storyboardSaved || storyboard?.saved),
    workspacePage,
    planner: {
      activeStep: workspacePage === "storyboard" ? "storyboard" : workspacePage,
      completedSteps,
      selectedTrendId: project.selectedTrendId || project.trendId || lockedBrief?.trendId || "trend-she-almost",
      selectedAudienceId: audienceDecision?.id || project.selectedAudienceId || project.audienceId || "audience-women-22-35-in",
      selectedCreatorId: castPlan?.id || project.selectedProfileId || project.creatorId || "creator-priya",
      selectedIdeaId: savedStoryIdea?.id || storyScriptIdea?.id || scriptDetailIdea?.id || project.selectedIdeaId || ideaCandidates[0]?.id || "idea-she-almost",
      projectId,
    },
  };
}

function buildLockedBriefFromProject(project = {}) {
  const lockedIdea = firstObject(
    project.lockedBrief,
    project.lockedIdea,
    project.lockedIdeaSelection,
    project.brief,
    project.creativeBrief,
    project.ideaSelection
  ) || {};
  const lockedIdeaId =
    project.lockedIdeaId ||
    project.locked_idea_id ||
    lockedIdea.lockedIdeaId ||
    lockedIdea.id ||
    project.ideaId ||
    "";
  const title =
    lockedIdea.title ||
    project.lockedIdeaTitle ||
    project.ideaTitle ||
    project.title ||
    project.projectTitle ||
    "Recovered creative brief";
  const description =
    lockedIdea.description ||
    lockedIdea.summary ||
    project.ideaText ||
    project.description ||
    project.summary ||
    title;

  if (!lockedIdeaId && !title) return null;
  return {
    ...lockedIdea,
    id: lockedIdeaId || project.projectId || project.id,
    lockedIdeaId: lockedIdeaId || lockedIdea.lockedIdeaId || lockedIdea.id,
    projectId: project.projectId || project.project_id || project.id,
    backendLocked: Boolean(lockedIdeaId),
    trendId: project.selectedTrendId || project.trendId || lockedIdea.trendId || null,
    title,
    description,
    durationSeconds: project.durationSeconds || lockedIdea.durationSeconds || 30,
    source: String(project.sourceType || lockedIdea.source || lockedIdea.sourceType || "original").toLowerCase(),
  };
}

function normalizeProjectStoryIdeas(project = {}, lockedBrief = null) {
  const rawIdeas = firstArray(
    project.storyIdeas,
    project.generatedIdeas,
    project.ideaCandidates,
    project.storyIdeaOptions,
    project.ideas,
    project.lockedIdea?.storyIdeas,
    project.result?.ideas
  );
  return rawIdeas.map((idea) => normalizeGeneratedIdea({
    ...idea,
    lockedIdeaId: idea.lockedIdeaId || lockedBrief?.lockedIdeaId,
    projectId: idea.projectId || project.projectId || project.project_id || project.id,
  }));
}

function normalizeProjectSavedStoryIdea(project = {}, ideaCandidates = [], lockedBrief = null) {
  const rawIdea = firstObject(
    project.savedStoryIdea,
    project.selectedStoryIdea,
    project.storyIdea,
    project.selectedIdea
  );
  const candidate = ideaCandidates.find((idea) => {
    const status = String(idea.status || "").toUpperCase();
    return idea.saved || idea.selected || status === "SELECTED" || status === "SAVED";
  });
  const source = rawIdea || candidate;
  if (!source) return null;
  return normalizeGeneratedIdea({
    ...source,
    saved: true,
    status: source.status || "SELECTED",
    lockedIdeaId: source.lockedIdeaId || lockedBrief?.lockedIdeaId,
    projectId: source.projectId || project.projectId || project.project_id || project.id,
  });
}

function normalizeProjectStoryScript(project = {}, sourceIdea = null, lockedBrief = null) {
  const rawScript = firstObject(
    project.storyScript,
    project.storyline,
    project.storyScriptIdea
  );
  if (!rawScript && !sourceIdea?.storyScriptJson && !sourceIdea?.storyScriptText && !sourceIdea?.selectionContext?.storyScript && !sourceIdea?.scriptText && !sourceIdea?.script) return null;
  return normalizeGeneratedIdea({
    ...(sourceIdea || {}),
    ...(rawScript || {}),
    id: rawScript?.storyIdeaId || rawScript?.ideaId || sourceIdea?.id,
    title: rawScript?.title || sourceIdea?.title,
    storyScriptText: rawScript?.scriptText || rawScript?.script || sourceIdea?.storyScriptText || sourceIdea?.scriptText || sourceIdea?.script,
    storyScriptJson: buildInitialStoryRevisionPayload(rawScript?.scriptJson || rawScript?.storyScriptJson || sourceIdea?.storyScriptJson || sourceIdea?.selectionContext?.storyScript || {}),
    lockedIdeaId: rawScript?.lockedIdeaId || sourceIdea?.lockedIdeaId || lockedBrief?.lockedIdeaId,
    projectId: rawScript?.projectId || sourceIdea?.projectId || project.projectId || project.project_id || project.id,
    status: rawScript?.status || sourceIdea?.status || "SCRIPT_GENERATED",
  });
}

function normalizeProjectScreenplay(project = {}, sourceIdea = null, lockedBrief = null) {
  const rawScreenplay = firstObject(
    project.screenplay,
    project.generatedScript,
    project.screenplayScript,
    project.scriptDetail,
    project.script
  );
  if (!rawScreenplay && !sourceIdea?.scriptId && !sourceIdea?.scriptJson?.shots?.length && !sourceIdea?.scriptScenes?.length && !sourceIdea?.scenes?.length) return null;
  const scriptJson = rawScreenplay?.scriptJson || sourceIdea?.scriptJson || {};
  const scenes = rawScreenplay?.scenes || rawScreenplay?.shots || scriptJson.shots || sourceIdea?.scriptScenes || sourceIdea?.scenes || [];
  return normalizeGeneratedIdea({
    ...(sourceIdea || {}),
    ...(rawScreenplay || {}),
    id: rawScreenplay?.storyIdeaId || rawScreenplay?.ideaId || sourceIdea?.id,
    title: rawScreenplay?.title || sourceIdea?.title,
    scriptId: rawScreenplay?.scriptId || rawScreenplay?.id || sourceIdea?.scriptId,
    scriptText: rawScreenplay?.script || rawScreenplay?.scriptText || sourceIdea?.scriptText || sourceIdea?.script,
    scriptJson,
    scriptScenes: normalizeGeneratedScriptScenes(scenes),
    productionPlanTags: rawScreenplay?.productionPlanTags || project.productionPlanTags || sourceIdea?.productionPlanTags || [],
    lockedIdeaId: rawScreenplay?.lockedIdeaId || sourceIdea?.lockedIdeaId || lockedBrief?.lockedIdeaId,
    projectId: rawScreenplay?.projectId || sourceIdea?.projectId || project.projectId || project.project_id || project.id,
    status: rawScreenplay?.status || sourceIdea?.status || "SCREENPLAY_GENERATED",
  });
}

function normalizeProjectStoryboard(project = {}, scriptDetailIdea = null) {
  const rawStoryboard = firstObject(
    project.storyboard,
    project.generatedStoryboard,
    project.storyboardResult
  ) || {};
  const imageAssets = [
    ...collectStoryboardImageAssets(rawStoryboard),
    ...collectStoryboardImageAssets(project),
  ];
  const storyboardScenes = firstArray(
    rawStoryboard.scenes,
    rawStoryboard.shots,
    project.storyboardScenes,
    project.storyboard_scenes,
    project.storyboardShots,
    project.storyboard_shots
  );
  const fallbackScenes = imageAssets.length || project.productionPlanTags?.length
    ? firstArray(
      project.scenes,
      project.shots,
      scriptDetailIdea?.scriptScenes,
      scriptDetailIdea?.scriptJson?.shots
    )
    : [];
  const rawScenes = storyboardScenes.length ? storyboardScenes : fallbackScenes;
  const scenes = rawScenes.length
    ? rawScenes
    : imageAssets.map((asset, index) => ({
      ...asset,
      shotNumber: imageAssetShotNumber(asset) || index + 1,
      imageKind: asset.imageKind || asset.image_kind || asset.kind || asset.assetKind || asset.asset_kind || "storyboard",
    }));
  if (!scenes.length) return null;
  return normalizeStoryboardResponse({
    ...rawStoryboard,
    scenes,
    images: imageAssets,
    projectId: rawStoryboard.projectId || project.projectId || project.project_id || project.id,
    title: rawStoryboard.title || project.title || project.projectTitle,
  }, scriptDetailIdea || {});
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || null;
}

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function buildGeneratedTopicItem({ job = {}, brief = null, ideas = [] } = {}) {
  const generatedAt = job.createdAt || job.created_at || job.updatedAt || job.updated_at || job.completedAt || job.completed_at || ideas[0]?.generatedAt || ideas[0]?.updatedAt || null;
  const title = generatedIdeaTopic({ job, brief, idea: ideas[0] || {} });
  const input = job.inputPayload || job.input || {};
  return {
    id: String(job.jobId || job.id || brief?.lockedIdeaId || title || "generated-topic"),
    job,
    brief,
    title,
    description: brief?.description || input.summary || input.ideaText || input.description || `${ideas.length} generated ideas`,
    generatedAt,
    ideas: mergeUniqueIdeas([], ideas),
  };
}

function mergeGeneratedTopicLibraryItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.id || "");
    if (!key || seen.has(key) || !item?.ideas?.length) return false;
    seen.add(key);
    return true;
  });
}

function mergeGeneratedIdeaLibraryItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const ideaId = item?.idea?.id || "";
    const jobId = item?.job?.jobId || item?.job?.id || "";
    const key = `${ideaId}:${jobId || item?.brief?.lockedIdeaId || ""}`;
    if (!ideaId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generatedTopicTimestampMs(item = {}) {
  const value = item.generatedAt || item.job?.createdAt || item.job?.created_at || item.job?.updatedAt || item.job?.updated_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function jobTimestampMs(job = {}) {
  const value = job.createdAt || job.created_at || job.updatedAt || job.updated_at || job.completedAt || job.completed_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function generatedIdeaTimestampMs(item = {}) {
  const value =
    item.idea?.generatedAt ||
    item.idea?.generated_at ||
    item.idea?.updatedAt ||
    item.idea?.updated_at ||
    item.job?.createdAt ||
    item.job?.created_at ||
    item.job?.updatedAt ||
    item.job?.updated_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function generatedIdeaTopic({ job = {}, brief = {}, idea = {} } = {}) {
  const input = job.inputPayload || job.input || {};
  return brief?.title ||
    input.lockedIdeaTitle ||
    input.title ||
    input.topic ||
    input.ideaTitle ||
    idea.lockedIdeaTitle ||
    idea.topic ||
    "Recovered topic";
}

function isGeneratedIdeaAlreadyUsed(idea = {}, usedIdeaIds = new Set()) {
  const status = String(idea.status || "").toUpperCase();
  return usedIdeaIds.has(String(idea.id || ""))
    || Boolean(idea.saved || idea.selected || idea.used)
    || ["SELECTED", "SAVED", "SCRIPT_GENERATED", "SCREENPLAY_GENERATED", "SCRIPT_EDITED"].includes(status);
}

function formatJobTime(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatNoteLabel(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim() || "Note";
}

async function waitForCreatorJob(fetchJobStatus, jobId, { timeoutMs = 180000, intervalMs = 1800 } = {}) {
  const startedAt = Date.now();
  let lastJob = null;
  while (Date.now() - startedAt < timeoutMs) {
    const job = await fetchJobStatus(jobId, false).unwrap();
    lastJob = job;
    const status = String(job?.status || "").toUpperCase();
    if (["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(status)) {
      return job;
    }
    if (["FAILED", "FAILURE", "ERROR", "ERRORED", "CANCELED", "CANCELLED"].includes(status)) {
      const message = job?.errorMessage || job?.message || "Generation job failed.";
      throw new Error(message);
    }
    await delay(intervalMs);
  }
  const status = lastJob?.status ? ` Last status: ${lastJob.status}.` : "";
  throw new Error(`Generation job timed out after ${Math.round(timeoutMs / 1000)}s.${status}`);
}

function extractPageFromGenerationJob(job = {}) {
  const result = job.result || job.outputPayload || job.data || {};
  return result.page || result.generatedIdeasPage || result.ideasPage || result;
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildAiProviderContext(provider) {
  if (!provider?.code) return null;
  return {
    providerCode: provider.code,
    provider: provider.code,
    providerLabel: provider.displayName || provider.label || provider.code,
    model: provider.defaultModel || "",
    providerType: provider.providerType || "",
    credentialConfigured: provider.credentialConfigured !== false,
  };
}

function attachAiProviderMetadata(result, providerContext) {
  if (!result || typeof result !== "object" || !providerContext) return result;
  const provider = result.provider || result.scriptJson?.provider || providerContext.providerCode || providerContext.provider || "";
  const model = result.model || result.scriptJson?.model || providerContext.model || "";
  const scriptJson = result.scriptJson && typeof result.scriptJson === "object"
    ? {
        ...result.scriptJson,
        provider,
        model,
        aiProvider: result.scriptJson.aiProvider || providerContext,
      }
    : result.scriptJson;
  return {
    ...result,
    provider,
    model,
    scriptJson,
    aiProvider: result.aiProvider || providerContext,
  };
}

function buildInitialStoryRevisionPayload(scriptJson = {}) {
  const llmGeneratedScript = stripStoryRevisionMeta(scriptJson);
  return {
    ...llmGeneratedScript,
    llmGeneratedScript,
    revisionAudit: {
      source: "LLM_GENERATION",
      revisionNumber: 0,
      edited: false,
      changedFields: [],
      changes: [],
      generatedAt: new Date().toISOString(),
      provider: llmGeneratedScript.provider || llmGeneratedScript.aiProvider?.providerCode || llmGeneratedScript.aiProvider?.provider || "",
      model: llmGeneratedScript.model || llmGeneratedScript.aiProvider?.model || "",
    },
  };
}

function buildStoryRevisionPayload(draftScript = {}, storyIdea = {}, revisionContext = {}) {
  const userRevision = stripStoryRevisionMeta(draftScript);
  const currentSource = storyIdea?.storyScriptJson || storyIdea?.scriptJson || {};
  const llmGeneratedScript = stripStoryRevisionMeta(
    revisionContext.llmGeneratedScript
      || currentSource.llmGeneratedScript
      || currentSource.originalLlmScript
      || currentSource.generatedScript
      || currentSource
      || userRevision
  );
  const changes = Array.isArray(revisionContext.changes)
    ? revisionContext.changes
    : buildStoryRevisionChanges(llmGeneratedScript, userRevision);
  const previousRevision = Number(currentSource?.revisionAudit?.revisionNumber ?? 0);
  const revisionAudit = {
    source: "CREATOR_UI_STORY_EDITOR",
    revisionNumber: previousRevision + 1,
    edited: changes.length > 0,
    changedFields: changes.map((change) => change.path),
    changes,
    savedAt: new Date().toISOString(),
    provider: llmGeneratedScript.provider || storyIdea.provider || "",
    model: llmGeneratedScript.model || storyIdea.model || "",
  };

  return {
    ...userRevision,
    llmGeneratedScript,
    userRevision,
    revisionAudit,
  };
}

function stripStoryRevisionMeta(scriptJson = {}) {
  if (!scriptJson || typeof scriptJson !== "object") return {};
  const {
    llmGeneratedScript,
    originalLlmScript,
    generatedScript,
    userRevision,
    acceptedScript,
    currentRevision,
    revisionAudit,
    editAudit,
    auditTrail,
    ...storyFields
  } = scriptJson;
  return storyFields;
}

function buildStoryRevisionChanges(original = {}, current = {}) {
  const changes = [];
  const fields = ["projectTitle", "logline", "hook", "centralConflict", "endingPayoff", "emotionalArc", "setting", "storyline"];
  fields.forEach((field) => addStoryRevisionChange(changes, `story.${field}`, original[field], current[field]));
  compareStoryArrayChanges(changes, "characters", original.characters, current.characters, ["name", "role", "look", "profile", "persona", "backstory", "motivation", "speakingStyle"]);
  compareStoryArrayChanges(changes, "beats", original.beats, current.beats, ["title", "summary", "characterFocus", "emotionalPurpose"]);
  return changes;
}

function compareStoryArrayChanges(changes, collection, originalItems = [], currentItems = [], fields = []) {
  const count = Math.max(originalItems?.length || 0, currentItems?.length || 0);
  for (let index = 0; index < count; index += 1) {
    const original = originalItems?.[index] || {};
    const current = currentItems?.[index] || {};
    fields.forEach((field) => addStoryRevisionChange(changes, `${collection}.${index}.${field}`, original[field], current[field]));
  }
}

function addStoryRevisionChange(changes, path, original, current) {
  const before = textCompareValue(original);
  const after = textCompareValue(current);
  if (before === after) return;
  changes.push({ path, original: before, current: after });
}

function textCompareValue(value) {
  if (value == null) return "";
  return String(value).trim();
}

function logStoryRevisionEvent(storyIdea = {}, revisionAudit = {}, localOnly = false) {
  if (!revisionAudit) return;
  console.info("[creator.story_revision]", {
    storyIdeaId: storyIdea.id,
    lockedIdeaId: storyIdea.lockedIdeaId,
    revisionNumber: revisionAudit.revisionNumber,
    edited: revisionAudit.edited,
    changedFieldCount: revisionAudit.changedFields?.length || 0,
    provider: revisionAudit.provider,
    model: revisionAudit.model,
    localOnly,
  });
}

function isCompletedJobStatus(status) {
  return ["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(String(status || "").toUpperCase());
}

function isFailedJobStatus(status) {
  return ["FAILED", "FAILURE", "ERROR", "ERRORED", "CANCELED", "CANCELLED"].includes(String(status || "").toUpperCase());
}

function CreatorModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="creator-panel max-h-[85vh] w-full max-w-3xl overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="creator-control flex h-8 w-8 items-center justify-center">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PastHistoryList({ items = [], emptyText = "No past history", openLabel = "Open", onOpen, isLoading = false, loadingLabel = "Loading history" }) {
  if (isLoading && !items.length) {
    return (
      <CreativeLoader
        label={loadingLabel}
        detail="Recovering saved topics, selected ideas, and production history from the backend."
      />
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm font-semibold text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="custom-scrollbar max-h-[62vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
      {isLoading && (
        <div className="mb-2">
          <CreativeLoader
            compact
            label={loadingLabel}
            detail="Refreshing the backend list."
          />
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-normal text-purple-200">{item.sourceLabel}</p>
                <h4 className="mt-1 text-base font-extrabold leading-6 text-white">{item.title}</h4>
                {item.meta && <p className="mt-1 text-xs font-semibold text-slate-500">{item.meta}</p>}
              </div>
              <button
                type="button"
                onClick={() => onOpen?.(item)}
                className="creator-control shrink-0 px-3 py-2 text-xs font-bold text-slate-200"
              >
                {openLabel}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line rounded-md border border-white/10 bg-black/20 p-3 text-sm font-medium leading-6 text-slate-300">
              {item.preview}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function CreativeLoader({ label, detail, compact = false }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-purple-300/20 bg-purple-500/[0.08] ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-400/15 text-purple-100">
          <Loader2 size={18} className="animate-spin" />
          <Sparkles size={11} className="absolute -right-1 -top-1 text-amber-200" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{detail}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeBackendHistoryItems(items = [], type = "storyline") {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const id = item.id || item.storyIdeaId || item.scriptId || `${type}-${index}`;
    return {
      id: `backend-${type}-${id}`,
      backendType: item.type || type,
      storyIdeaId: item.storyIdeaId || item.story_idea_id || (type === "storyline" ? item.id : null),
      scriptId: item.scriptId || item.script_id || (type === "script" ? item.id : null),
      title: item.title || item.topic || (type === "storyline" ? "Past storyline" : "Past script"),
      sourceLabel: item.sourceLabel || (type === "storyline" ? "Backend storylines" : "Backend scripts"),
      meta: item.updatedAt ? `Updated ${formatJobTime(item.updatedAt)}` : item.createdAt ? `Created ${formatJobTime(item.createdAt)}` : "",
      preview: buildHistoryPreview(item.preview || item.selectedIdea?.summary || item.topic || item.title),
      rawHistoryItem: item,
    };
  });
}

function normalizeBackendStorylineDetail(detail = {}) {
  const payload = firstObject(detail.payload) || {};
  const selectedIdea = firstObject(detail.selectedIdea) || {};
  return normalizeGeneratedIdea({
    ...selectedIdea,
    id: detail.storyIdeaId || detail.id || selectedIdea.id,
    title: detail.title || selectedIdea.title || detail.topic || "Past storyline",
    description: selectedIdea.description || selectedIdea.summary || detail.preview,
    storyScriptText: payload.storyScriptText || detail.preview || selectedIdea.storyScriptText || selectedIdea.scriptText || "",
    storyScriptJson: buildInitialStoryRevisionPayload(payload.storyScriptJson || selectedIdea.storyScriptJson || selectedIdea.selectionContext?.storyScript || {}),
    lockedIdeaId: detail.lockedIdeaId || selectedIdea.lockedIdeaId,
    projectId: detail.projectId || selectedIdea.projectId,
    durationSeconds: detail.durationSeconds || selectedIdea.durationSeconds,
    status: detail.status || selectedIdea.status || "SCRIPT_GENERATED",
    saved: true,
  });
}

function normalizeBackendScriptDetail(detail = {}) {
  const payload = firstObject(detail.payload) || {};
  const selectedIdea = firstObject(detail.selectedIdea) || {};
  const scriptJson = payload.scriptJson || {};
  const shots = payload.shots || scriptJson.shots || [];
  return normalizeGeneratedIdea({
    ...selectedIdea,
    id: detail.storyIdeaId || selectedIdea.id || detail.id,
    title: detail.title || selectedIdea.title || scriptJson.projectTitle || "Past script",
    description: selectedIdea.description || selectedIdea.summary || detail.preview,
    scriptId: detail.scriptId || detail.id,
    scriptText: payload.scriptText || detail.preview || "",
    scriptJson,
    scriptScenes: normalizeGeneratedScriptScenes(shots),
    productionPlanTags: payload.productionPlanTags || [],
    lockedIdeaId: detail.lockedIdeaId || selectedIdea.lockedIdeaId,
    projectId: detail.projectId || selectedIdea.projectId,
    durationSeconds: detail.durationSeconds || selectedIdea.durationSeconds || scriptJson.duration,
    status: detail.status || "SCREENPLAY_GENERATED",
    saved: true,
  });
}

function buildPastStorylineHistory(currentStoryScript, projectHistory = []) {
  const items = [];
  if (currentStoryScript) {
    const preview = currentStoryScript.storyScriptText || buildStoryScriptTextFromDraft(currentStoryScript.storyScriptJson || currentStoryScript.scriptJson || {});
    items.push({
      id: `current-storyline-${currentStoryScript.id || "active"}`,
      title: currentStoryScript.title || currentStoryScript.storyScriptJson?.projectTitle || "Current storyline",
      sourceLabel: "Current workflow",
      meta: currentStoryScript.updatedAt ? `Updated ${formatJobTime(currentStoryScript.updatedAt)}` : "Generated in this session",
      preview: buildHistoryPreview(preview),
    });
  }

  projectHistory.forEach((project) => {
    const restored = buildWorkflowStateFromProject(project.rawProject || project);
    const story = restored?.storyScriptIdea;
    if (!story) return;
    const preview = story.storyScriptText || buildStoryScriptTextFromDraft(story.storyScriptJson || story.scriptJson || {});
    items.push({
      id: `project-storyline-${project.projectId || project.id}`,
      title: story.title || project.title || "Past storyline",
      sourceLabel: "Project history",
      meta: project.time || "",
      preview: buildHistoryPreview(preview),
      project,
    });
  });

  return dedupeHistoryItems(items);
}

function buildPastScriptHistory(currentScript, projectHistory = []) {
  const items = [];
  if (currentScript) {
    const preview = currentScript.scriptText || currentScript.script || buildScriptTextFromDraft(currentScript.scriptJson || {});
    items.push({
      id: `current-script-${currentScript.scriptId || currentScript.id || "active"}`,
      title: currentScript.title || currentScript.scriptJson?.projectTitle || "Current script",
      sourceLabel: "Current workflow",
      meta: currentScript.updatedAt ? `Updated ${formatJobTime(currentScript.updatedAt)}` : "Generated in this session",
      preview: buildHistoryPreview(preview),
    });
  }

  projectHistory.forEach((project) => {
    const restored = buildWorkflowStateFromProject(project.rawProject || project);
    const script = restored?.scriptDetailIdea;
    if (!script) return;
    const preview = script.scriptText || script.script || buildScriptTextFromDraft(script.scriptJson || {});
    items.push({
      id: `project-script-${project.projectId || project.id}`,
      title: script.title || project.title || "Past script",
      sourceLabel: "Project history",
      meta: project.time || "",
      preview: buildHistoryPreview(preview),
      project,
    });
  });

  return dedupeHistoryItems(items);
}

function buildHistoryPreview(value) {
  const text = String(value || "").replace(/\n{3,}/g, "\n\n").trim();
  return truncateText(text || "No preview available", 900);
}

function dedupeHistoryItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.id || `${item.title}:${item.preview}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function projectResumeStage(restored, project = {}) {
  const steps = [
    { id: "ideas", label: "Idea", fullLabel: "Idea selected" },
    { id: "script", label: "Story", fullLabel: "Storyline ready" },
    { id: "cast", label: "Actor", fullLabel: "Actors mapped" },
    { id: "screenplay", label: "Script", fullLabel: "Script ready" },
    { id: "storyboard", label: "Storyboard", fullLabel: "Storyboard ready" },
  ];
  const completedSteps = restored?.planner?.completedSteps || {};
  const resumePage = restored?.workspacePage || "ideas";
  const resumeLabel = workspacePageLabel(resumePage);
  const lastCompleted = [...steps].reverse().find((step) => completedSteps[step.id]);
  const completedCount = steps.filter((step) => completedSteps[step.id]).length;
  const status = formatNoteLabel(project.status || "Draft");
  const category = project.selectedCategoryCode ? formatNoteLabel(project.selectedCategoryCode) : "";

  const descriptionParts = [
    lastCompleted ? `Last completed: ${lastCompleted.fullLabel}` : "No completed workflow stage detected yet",
    status ? `Status: ${status}` : "",
    category ? `Category: ${category}` : "",
  ].filter(Boolean);

  return {
    label: `${completedSteps.storyboard ? "Open" : "Continue at"} ${resumeLabel}`,
    description: descriptionParts.join(" - "),
    actionLabel: completedSteps.storyboard ? "Open" : "Continue",
    progressText: `${completedCount}/${steps.length}`,
    steps: steps.map((step) => ({
      ...step,
      done: Boolean(completedSteps[step.id]),
      active: step.id === resumePage,
    })),
  };
}

function workspacePageLabel(pageId) {
  return {
    ideas: "Ideas",
    "generated-ideas": "Generated Ideas",
    script: "Storyline",
    cast: "Actor",
    screenplay: "Script",
    storyboard: "Storyboard",
  }[pageId] || "Workflow";
}

function sectionForWorkspacePage(pageId) {
  if (pageId === "storyboard") return "storyboard";
  if (pageId === "generated-ideas") return "generated-ideas";
  if (pageId === "ideas") return "trends";
  return "workflow";
}

function scrollToSection(id) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
