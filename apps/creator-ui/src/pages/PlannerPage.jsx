// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTenantId,
  setTenantIdentity,
  showFlash,
  useAddWalletBalanceMutation,
  useGetWalletBalanceQuery,
} from "@dalaillama/shared-store";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clapperboard, FolderOpen, GripVertical, HelpCircle, History, Image as ImageIcon, ListChecks, Loader2, LockKeyhole, Plus, RefreshCw, Sparkles, WalletCards, X } from "lucide-react";
import {
  useConfirmAudienceMutation,
  useCreateCreatorMutation,
  useGenerateIdeasMutation,
  useGenerateLockedIdeaOptionsAsyncMutation,
  useGenerateLockedIdeaOptionsMutation,
  useGenerateStoryIdeaScriptMutation,
  useGenerateStoryIdeaScreenplayAsyncMutation,
  useGetAiProvidersQuery,
  useGetCreatorProviderCreditsQuery,
  useGetCharacterCastMappingsQuery,
  useGetCreatorCategoriesQuery,
  useGetCreatorPlatformsQuery,
  useGetCreatorProjectsQuery,
  useLazyGetCreatorProjectQuery,
  useGetPostProductionProjectsQuery,
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
  useGetWeeklyIdeaTagsQuery,
  useGetCreatorSubscriptionQuery,
  useLockIdeaSelectionMutation,
  useGenerateStoryboardFromScriptMutation,
  useGenerateStoryboardFromScriptAsyncMutation,
  useGenerateProductionPlansAsyncMutation,
  useGenerateShotImageMutation,
  useEditStoryboardShotWithAiMutation,
  useInsertStoryboardTimelineShotMutation,
  useGetProductionPlansQuery,
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
  useGetCreatorStorylineHistoryQuery,
  useGetCreatorScriptHistoryQuery,
  useLazyGetCreatorStorylineHistoryItemQuery,
  useLazyGetCreatorScriptHistoryItemQuery,
  useListCreatorsQuery,
  usePredictTrendsMutation,
  useRefreshWeeklyIdeaTagsMutation,
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
import ShotTakePanel from "../components/storyboard/ShotTakePanel.jsx";
import StoryboardHistoryPanel from "../components/storyboard/StoryboardHistoryPanel.jsx";
import ProductionPlanPanel from "../components/storyboard/ProductionPlanPanel.jsx";
import MobileFrame from "../components/preview/MobileFrame.jsx";
import GenerationStatusBar from "../components/jobs/GenerationStatusBar.jsx";
import OrganizationSetupCard from "../components/billing/OrganizationSetupCard.jsx";
import RechargeWalletModal from "../components/billing/RechargeWalletModal.jsx";
import SubscriptionBadge from "../components/billing/SubscriptionBadge.jsx";

const MINIMUM_PAID_GENERATION_WALLET_BALANCE = 100;

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

function creatorDebugEnabled() {
  try {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search || "");
    return params.get("creatorDebug") === "1" || window.localStorage.getItem("creatorDebug") === "1";
  } catch {
    return false;
  }
}

function creatorDebugLog(label, payload = {}) {
  if (!creatorDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.debug(`[creator-ui] ${label}`, payload);
}

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
const DEFAULT_STORYTELLING_TYPE = "narrator_visual_mix";
const DEFAULT_HOOK_LENS = "direct";

const workflowSlides = [
  { id: "ideas", label: "New Ideas", caption: "Write a topic and pick one of the generated angles" },
  { id: "script", label: "Storyline", caption: "Shape the story, characters, personas, and backstories" },
  { id: "cast", label: "Actor", caption: "Add actors and map them to story characters" },
  { id: "screenplay", label: "Script", caption: "Convert the locked story and actors into shot-wise pages" },
];

const workflowStepIds = new Set(workflowSlides.map((slide) => slide.id));
const workspacePageIds = new Set(["ideas", "generated-ideas", "script", "screenplay", "cast", "storyboard", "shoot-polish"]);
const modalHashIds = new Set(["projects", "post-production", "past-storyline", "past-script"]);

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
  const [postProductionOpen, setPostProductionOpen] = useState(false);
  const [selectedPostProductionProject, setSelectedPostProductionProject] = useState(null);
  const [postProductionShotRailCollapsed, setPostProductionShotRailCollapsed] = useState(false);
  const [postProductionSceneOrder, setPostProductionSceneOrder] = useState([]);
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
  const [storytellingType, setStorytellingType] = useState(() => storedWorkflowSnapshot?.storytellingType || DEFAULT_STORYTELLING_TYPE);
  const [hookLens, setHookLens] = useState(() => storedWorkflowSnapshot?.hookLens || DEFAULT_HOOK_LENS);
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
  const [lowBalanceNotice, setLowBalanceNotice] = useState(null);
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
  const screenplayStartInFlightRef = useRef(false);
  const productionPlanStartInFlightRef = useRef(false);
  const [shotTakeJobId, setShotTakeJobId] = useState(null);
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
  const [pdfExporting, setPdfExporting] = useState(false);
  const [activity, setActivity] = useState([
    { label: "Storyboard generated", detail: "14-shot short preview", time: "4 min ago" },
    { label: "Audience confirmed", detail: "Women 22-35 in India", time: "2 min ago" },
    { label: "Trend selected", detail: "She Almost Didn't Go", time: "Just now" },
  ]);

  const { data: organization = {}, isFetching: organizationLoading, refetch: refetchOrganization } = useGetOrganizationQuery();
  const organizationTenantId = sanitizeTenantId(organization?.tenantId || organization?.id);
  const tenantId = reduxTenantId || organizationTenantId || localTenantId || authTenantId;

  const { data: combinationData = {} } = useGetTrendCombinationsQuery(undefined, { skip: !TREND_DISCOVERY_ENABLED });
  const {
    data: weeklyIdeaTags = {},
    isFetching: weeklyIdeaTagsLoading,
    refetch: refetchWeeklyIdeaTags,
  } = useGetWeeklyIdeaTagsQuery(undefined, {
    skip: !tenantId,
    refetchOnMountOrArgChange: true,
  });
  const { data: masterPlatforms = [] } = useGetCreatorPlatformsQuery(undefined, { skip: !TREND_DISCOVERY_ENABLED });
  const { data: masterCategories = [] } = useGetCreatorCategoriesQuery(undefined, { skip: !TREND_DISCOVERY_ENABLED });
  const { data: aiProviders = [], isFetching: aiProvidersLoading, isError: aiProvidersError } = useGetAiProvidersQuery();
  const { data: creatorProviderCredits = {} } = useGetCreatorProviderCreditsQuery(undefined, {
    pollingInterval: 60000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const { data: walletFromService, isFetching: walletLoading, refetch: refetchWallet } = useGetWalletBalanceQuery(tenantId, {
    skip: !tenantId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const walletFromProviderCredits = normalizeProviderCreditsWallet(creatorProviderCredits?.wallet);
  const wallet = walletFromService || walletFromProviderCredits || eventWallet || { balance: 0, currency: organization?.currency || "INR" };
  const walletBalanceAmount = walletBalanceValue(wallet);
  const paidGenerationMinimumBalance = walletMinimumBalanceValue(wallet, MINIMUM_PAID_GENERATION_WALLET_BALANCE);
  const walletHasPaidGenerationBalance = walletBalanceAmount >= paidGenerationMinimumBalance;
  const walletCurrencyCode = wallet?.currency || wallet?.currencyCode || organization?.currency || "INR";
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
  const [refreshWeeklyIdeaTags, refreshWeeklyIdeaTagsState] = useRefreshWeeklyIdeaTagsMutation();
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
  const [editStoryboardShotWithAi, editStoryboardShotWithAiState] = useEditStoryboardShotWithAiMutation();
  const [insertStoryboardTimelineShot, insertStoryboardTimelineShotState] = useInsertStoryboardTimelineShotMutation();
  const [uploadShotTake, uploadShotTakeState] = useUploadShotTakeMutation();
  const [uploadShotTakeReferenceFrame, uploadShotTakeReferenceFrameState] = useUploadShotTakeReferenceFrameMutation();
  const [saveShotTakeMediaAnalysis, saveShotTakeMediaAnalysisState] = useSaveShotTakeMediaAnalysisMutation();
  const [saveShotTakeSoundTimeline, saveShotTakeSoundTimelineState] = useSaveShotTakeSoundTimelineMutation();
  const [uploadShotTakeSoundSnippet, uploadShotTakeSoundSnippetState] = useUploadShotTakeSoundSnippetMutation();
  const [generateShotTakeSoundAsync, generateShotTakeSoundState] = useGenerateShotTakeSoundAsyncMutation();
  const [reviewShotTakeAsync, reviewShotTakeState] = useReviewShotTakeAsyncMutation();
  const [confirmShotTake, confirmShotTakeState] = useConfirmShotTakeMutation();
  const [renderAcceptedShotSequenceAsync, renderAcceptedShotSequenceState] = useRenderAcceptedShotSequenceAsyncMutation();
  const [enhanceShotTakePreviewAsync, enhanceShotTakePreviewState] = useEnhanceShotTakePreviewAsyncMutation();
  const [studioPolishShotTakeAsync, studioPolishShotTakeState] = useStudioPolishShotTakeAsyncMutation();
  const [studioPolishAllShotTakesAsync, studioPolishAllShotTakesState] = useStudioPolishAllShotTakesAsyncMutation();
  const [enhanceShotTakeAudioAsync, enhanceShotTakeAudioState] = useEnhanceShotTakeAudioAsyncMutation();
  const [mixShotTakeAudioAsync, mixShotTakeAudioState] = useMixShotTakeAudioAsyncMutation();
  const [generateShotTakePolishedFrames] = useGenerateShotTakePolishedFramesMutation();
  const [renderShotTakeFinalVideoAsync] = useRenderShotTakeFinalVideoAsyncMutation();
  const [saveShotTakeEnhancementFeedback, saveShotTakeFeedbackState] = useSaveShotTakeEnhancementFeedbackMutation();
  const [applyShotTakePreviewToTimeline, applyShotTakePreviewState] = useApplyShotTakePreviewToTimelineMutation();
  const [enhanceAllShotTakesAsync, enhanceAllShotTakesState] = useEnhanceAllShotTakesAsyncMutation();
  const [saveStoryboard] = useSaveStoryboardMutation();
  const [unsaveStoryboard] = useUnsaveStoryboardMutation();
  const [createWalletRecharge, rechargeState] = useAddWalletBalanceMutation();
  const [setupOrganization, setupOrganizationState] = useSetupOrganizationMutation();
  const [startSubscriptionUpgrade, upgradeState] = useStartSubscriptionUpgradeMutation();
  const { data: predictionJob } = useGetJobQuery(predictionJobId, { skip: !predictionJobId, pollingInterval: predictionJobId ? 1600 : 0 });
  const { data: ideaGenerationJob } = useGetJobQuery(ideaGenerationJobId, { skip: !ideaGenerationJobId, pollingInterval: ideaGenerationJobId ? 1600 : 0 });
  const { data: screenplayJob } = useGetJobQuery(screenplayJobId, { skip: !screenplayJobId, pollingInterval: screenplayJobId ? 1600 : 0 });
  const { data: productionPlanJob } = useGetJobQuery(productionPlanJobId, { skip: !productionPlanJobId, pollingInterval: productionPlanJobId ? 1600 : 0 });
  const {
    data: shotTakeJob,
    error: shotTakeJobError,
    isError: shotTakeJobIsError,
  } = useGetJobQuery(shotTakeJobId, { skip: !shotTakeJobId, pollingInterval: shotTakeJobId ? 1600 : 0 });
  const { data: creatorProjects = [], isFetching: creatorProjectsLoading, refetch: refetchCreatorProjects } = useGetCreatorProjectsQuery(
    { limit: 12 },
    { refetchOnMountOrArgChange: true }
  );
  const {
    data: postProductionProjects = [],
    isFetching: postProductionProjectsLoading,
    refetch: refetchPostProductionProjects,
  } = useGetPostProductionProjectsQuery(
    { limit: 30 },
    { skip: !postProductionOpen, refetchOnMountOrArgChange: true }
  );
  const [fetchCreatorProject, fetchCreatorProjectState] = useLazyGetCreatorProjectQuery();
  const { data: ideaGenerationJobs = [], isFetching: ideaGenerationJobsLoading, refetch: refetchIdeaGenerationJobs } = useGetJobsQuery(
    { jobType: "IDEA_GENERATE" },
    { pollingInterval: ideaGenerationJobId ? 5000 : 0, refetchOnMountOrArgChange: true }
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
  const { data: shotTakes = [], isFetching: shotTakesLoading, refetch: refetchShotTakes } = useGetShotTakesQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    { skip: !scriptDetailIdea?.scriptId, pollingInterval: shotTakeJobId ? 2500 : 0, refetchOnMountOrArgChange: true }
  );
  const {
    data: acceptedShotSequence = {},
    isFetching: acceptedShotSequenceLoading,
    refetch: refetchAcceptedShotSequence,
  } = useGetAcceptedShotSequenceQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    { skip: !scriptDetailIdea?.scriptId, pollingInterval: shotTakeJobId ? 2500 : 0, refetchOnMountOrArgChange: true }
  );
  const { data: backendStorylineHistory = [], isFetching: storylineHistoryLoading, refetch: refetchStorylineHistory } = useGetCreatorStorylineHistoryQuery(
    { limit: 30 },
    { skip: pastHistoryModal !== "storyline", refetchOnMountOrArgChange: true }
  );
  const { data: backendScriptHistory = [], isFetching: scriptHistoryLoading, refetch: refetchScriptHistory } = useGetCreatorScriptHistoryQuery(
    { limit: 30 },
    { skip: pastHistoryModal !== "script", refetchOnMountOrArgChange: true }
  );
  const [fetchStorylineHistoryItem, fetchStorylineHistoryItemState] = useLazyGetCreatorStorylineHistoryItemQuery();
  const [fetchScriptHistoryItem, fetchScriptHistoryItemState] = useLazyGetCreatorScriptHistoryItemQuery();
  const legacyStoryboardQueriesEnabled = false;
  const legacyStoryboardSaveApiEnabled = false;
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
  const mergedScenes = useMemo(
    () => mergeShotImageUrlsIntoScenes(baseScenes, backendShotImageUrls),
    [backendShotImageUrls, baseScenes]
  );
  const scenes = useMemo(
    () => applySceneOrder(mergedScenes, postProductionSceneOrder),
    [mergedScenes, postProductionSceneOrder]
  );
  useEffect(() => {
    setPostProductionSceneOrder((current) => reconcileSceneOrder(mergedScenes, current));
  }, [mergedScenes]);
  const backendShotImageLoadingKeys = useMemo(
    () => shotImageUrlsLoading ? shotImageLoadingKeysForScenes(baseScenes) : [],
    [baseScenes, shotImageUrlsLoading]
  );
  const visibleShotImageLoadingKeys = useMemo(
    () => [...shotImageLoadingKeys, ...backendShotImageLoadingKeys],
    [backendShotImageLoadingKeys, shotImageLoadingKeys]
  );
  const shotPlanLoading = productionPlansLoading || generateProductionPlansState.isLoading || Boolean(productionPlanJobId);
  const shotPlansReadyForGeneration = productionPlanTags.length > 0;
  const shotGenerationLoading = Boolean(storyboardJobId) || generateStoryboardAsyncState.isLoading;
  const shotsGenerated = Boolean(
    (Array.isArray(backendShotImageUrls) && backendShotImageUrls.some(hasShotImageUrlData))
    || (Array.isArray(currentStoryboard?.scenes) && currentStoryboard.scenes.some(hasRenderableShotAsset))
    || (Array.isArray(generatedStoryboard?.scenes) && generatedStoryboard.scenes.some(hasRenderableShotAsset))
  );
  const canGenerateShots = Boolean(
    scriptDetailIdea?.scriptId
    && shotPlansReadyForGeneration
    && storyboardSaved
    && !shotGenerationLoading
  );
  const generateShotsBlockedReason = !scriptDetailIdea?.scriptId
    ? "Generate screenplay before generating shots."
    : !shotPlansReadyForGeneration
      ? "Generate shot plans first."
      : !storyboardSaved
        ? "Save production before generating shots."
      : shotGenerationLoading
        ? "Shot generation is already running."
        : "";
  const expectedExportShotCount = useMemo(() => firstPositiveNumber(
    currentStoryboard?.totalShots,
    currentStoryboard?.total_shots,
    scriptDetailIdea?.scriptJson?.shots?.length,
    scriptDetailIdea?.scriptScenes?.length,
    productionPlanTags.length,
    scenes.length
  ), [
    currentStoryboard?.totalShots,
    currentStoryboard?.total_shots,
    productionPlanTags.length,
    scenes.length,
    scriptDetailIdea?.scriptJson?.shots?.length,
    scriptDetailIdea?.scriptScenes?.length,
  ]);
  const shotExportSummary = useMemo(
    () => summarizeShotExportAssets(scenes, expectedExportShotCount),
    [expectedExportShotCount, scenes]
  );
  const canExportShotsPdf = Boolean(
    !shotGenerationLoading
    && shotExportSummary.expected > 0
    && shotExportSummary.storyboardReady >= shotExportSummary.expected
    && shotExportSummary.lightingReady >= shotExportSummary.expected
    && shotExportSummary.dpReady >= shotExportSummary.expected
  );
  const generatedShotCardsReadyForPolish = Boolean(
    shotExportSummary.expected > 0
    && shotExportSummary.completeReady >= shotExportSummary.expected
  );
  const exportBlockedReason = shotGenerationLoading
    ? "Shot generation is still running. Please export after all shots are generated."
    : shotExportSummary.expected <= 0
      ? "Generate shot plans and shots before exporting."
      : !canExportShotsPdf
        ? `Please export after generating all the shots (${shotExportSummary.completeReady}/${shotExportSummary.expected} complete).`
        : "";
  const shotTakeBusy = Boolean(
    shotTakeJobId
    || uploadShotTakeState.isLoading
    || uploadShotTakeReferenceFrameState.isLoading
    || saveShotTakeMediaAnalysisState.isLoading
    || saveShotTakeSoundTimelineState.isLoading
    || uploadShotTakeSoundSnippetState.isLoading
    || generateShotTakeSoundState.isLoading
    || reviewShotTakeState.isLoading
    || confirmShotTakeState.isLoading
    || renderAcceptedShotSequenceState.isLoading
    || enhanceShotTakePreviewState.isLoading
    || studioPolishShotTakeState.isLoading
    || studioPolishAllShotTakesState.isLoading
    || enhanceShotTakeAudioState.isLoading
    || mixShotTakeAudioState.isLoading
    || saveShotTakeFeedbackState.isLoading
    || applyShotTakePreviewState.isLoading
    || enhanceAllShotTakesState.isLoading
  );
  const selectedCreator = castPlan || creators.find((creator) => creator.id === planner.selectedCreatorId) || buildDefaultCastPlan(creators);
  const selectedScene = scenes[preview.currentSceneIndex] || scenes[0];
  useEffect(() => {
    setPostProductionSceneOrder([]);
  }, [activeProjectId, scriptDetailIdea?.scriptId]);
  useEffect(() => {
    creatorDebugLog("storyboard-flow snapshot", {
      projectId: activeProjectId,
      scriptId: scriptDetailIdea?.scriptId,
      productionPlanTagsCount: productionPlanTags.length,
      backendProductionPlansCount: Array.isArray(backendProductionPlans) ? backendProductionPlans.length : 0,
      firstPlanSound: productionPlanSoundDebug(productionPlanTags[0]),
      sceneCount: scenes.length,
      storyboardJobId,
      storyboardJobStatus: storyboardJob?.status || "",
      storyboardJobProgress: storyboardJob?.progress || 0,
      shotImageUrlCount: Array.isArray(backendShotImageUrls) ? backendShotImageUrls.length : 0,
      shotsGenerated,
      shotExportSummary,
      storyboardSaved,
    });
  }, [
    activeProjectId,
    backendProductionPlans.length,
    backendShotImageUrls.length,
    productionPlanTags.length,
    scenes.length,
    scriptDetailIdea?.scriptId,
    shotExportSummary,
    shotsGenerated,
    storyboardJob?.progress,
    storyboardJob?.status,
    storyboardJobId,
    storyboardSaved,
  ]);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      if (params.get("creatorPdfCallback") !== "1") return;
      emitCreatorAnalyticsEvent("creator_pdf_callback_page_view", {
        project_id: params.get("projectId") || "",
        script_id: params.get("scriptId") || "",
        source: "pdf_callback",
      });
    } catch {
      // Ignore analytics parsing issues on normal app load.
    }
  }, []);
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
      storytellingType,
      hookLens,
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
    hookLens,
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
    storytellingType,
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
  const canGenerateStoryIdeas = projectWorkspaceMode ? Boolean(lockedBrief) : savedBriefMatchesCurrentMode;
  const activeStoryboardId = currentStoryboard?.id || currentStoryboard?.storyboardId || planner.projectId;
  const projectNeedsIdeaWorkflow = projectWorkspaceMode && !storyScriptIdea && !scriptDetailIdea;
  const hideIdeaWorkflowForProject = projectWorkspaceMode && !projectNeedsIdeaWorkflow;
  const workflowDisplaySlides = useMemo(
    () => hideIdeaWorkflowForProject
      ? workflowSlides.filter((slide) => slide.id !== "ideas")
      : workflowSlides,
    [hideIdeaWorkflowForProject]
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
  const expectedShotTakeCount = scenes.length || productionPlanTags.length || screenplayShotCount || 0;
  const acceptedShotTakeCount = (Array.isArray(shotTakes) ? shotTakes : []).filter((take) => take?.accepted).length;
  const effectiveShootPolishReady = Boolean(expectedShotTakeCount && acceptedShotTakeCount >= expectedShotTakeCount);
  const polishBlockedReason = !effectiveShotPlansReady
    ? "Generate shot design before opening Polish."
    : shotGenerationLoading
      ? "Shot images are still generating. Polish unlocks when generated shots are ready."
      : !generatedShotCardsReadyForPolish
        ? `Generate all shot images before opening Polish (${shotExportSummary.completeReady}/${shotExportSummary.expected || expectedShotTakeCount || 0} complete).`
        : "";
  const polishUnlocked = !polishBlockedReason;
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
      value: savedStoryIdeaId ? selectedIdea?.title || "Story idea saved" : projectNeedsIdeaWorkflow ? "Choose a story idea" : selectedIdea?.title || "Pick a story idea",
      done: Boolean(savedStoryIdeaId),
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
  const visibleWorkflowStatusItems = hideIdeaWorkflowForProject
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
      label: "Shot Design",
      kicker: "Production",
      description: productionPlanTags.length ? `${productionPlanTags.length} shot plans ready` : getWorkflowGateMessage("storyboard") || "Generate readable shot plans",
      done: effectiveShotPlansReady,
      locked: Boolean(getWorkflowGateMessage("storyboard")),
    },
    {
      id: "shoot-polish",
      label: "Polish",
      kicker: "Takes",
      description: polishBlockedReason
        ? polishBlockedReason
        : effectiveShotPlansReady
        ? `${acceptedShotTakeCount}/${expectedShotTakeCount || scenes.length || 0} takes accepted`
        : "Upload takes after shot design is ready",
      done: effectiveShootPolishReady,
      locked: Boolean(polishBlockedReason),
    },
  ];
  const visibleWorkspacePages = projectWorkspaceMode
    ? workspacePages
        .filter((page) => page.id !== "generated-ideas" && (page.id !== "ideas" || projectNeedsIdeaWorkflow))
    : workspacePages;
  const activeWorkspaceMeta = visibleWorkspacePages.find((page) => page.id === workspacePage) || visibleWorkspacePages[0] || workspacePages[0];
  const showCreativeBriefPanel = workspacePage === "ideas" && (!projectWorkspaceMode || projectNeedsIdeaWorkflow);

  useEffect(() => {
    if (!projectWorkspaceMode || (workspacePage !== "ideas" && workspacePage !== "generated-ideas")) return;
    if (workspacePage === "generated-ideas") {
      const nextPage = projectNeedsIdeaWorkflow ? "ideas" : "script";
      setGeneratedIdeasOpen(false);
      setSelectedGeneratedTopicId(null);
      setWorkspacePage(nextPage);
      window.history.replaceState(null, "", `/#${nextPage}`);
      return;
    }
    if (!hideIdeaWorkflowForProject) return;
    setGeneratedIdeasOpen(false);
    setSelectedGeneratedTopicId(null);
    setWorkspacePage("script");
    window.history.replaceState(null, "", "/#script");
  }, [hideIdeaWorkflowForProject, projectNeedsIdeaWorkflow, projectWorkspaceMode, workspacePage]);

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
      if (window.location.hash === "#post-production") {
        setPostProductionOpen(true);
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
    const openPostProduction = () => {
      setSelectedPostProductionProject(null);
      setPostProductionOpen(true);
    };
    window.addEventListener("creator:open-post-production", openPostProduction);
    if (window.location.hash === "#post-production") {
      openPostProduction();
    }
    return () => window.removeEventListener("creator:open-post-production", openPostProduction);
  }, []);

  useEffect(() => {
    if (!projectsOpen) return;
    void refetchCreatorProjects?.();
  }, [projectsOpen, refetchCreatorProjects]);

  useEffect(() => {
    if (!recentIdeaJobsOpen) return;
    void refetchIdeaGenerationJobs?.();
  }, [recentIdeaJobsOpen, refetchIdeaGenerationJobs]);

  useEffect(() => {
    if (!postProductionOpen) return;
    void refetchPostProductionProjects?.();
  }, [postProductionOpen, refetchPostProductionProjects]);

  useEffect(() => {
    if (!pastHistoryModal) return;
    void refetchCreatorProjects?.();
    if (pastHistoryModal === "storyline") {
      void refetchStorylineHistory?.();
    } else if (pastHistoryModal === "script") {
      void refetchScriptHistory?.();
    }
  }, [pastHistoryModal, refetchCreatorProjects, refetchScriptHistory, refetchStorylineHistory]);

  useEffect(() => {
    if (!workflowStepIds.has(workspacePage) || planner.activeStep === workspacePage) return;
    const gateMessage = getWorkflowGateMessage(workspacePage);
    if (gateMessage) {
      const fallbackStep = workflowStepIds.has(planner.activeStep) && !getWorkflowGateMessage(planner.activeStep)
        ? planner.activeStep
        : "ideas";
      setWorkspacePage(fallbackStep);
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
    if (!tenantId || walletHasPaidGenerationBalance) {
      setLowBalanceNotice(null);
    }
  }, [tenantId, walletHasPaidGenerationBalance]);

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
      void refetchWallet?.();
      setPredictionJobId(null);
      return;
    }
    if (isFailedJobStatus(status)) {
      addActivity("Trend prediction failed", `${filterLabels.category[filters.category] || filters.category} - ${country.label}`);
      flash("Trend prediction failed. Try again.", "error");
      void refetchWallet?.();
      setPredictionJobId(null);
    }
  }, [predictionJob?.status, refetchWallet]);

  useEffect(() => {
    const status = String(screenplayJob?.status || "").toUpperCase();
    if (isFailedJobStatus(status)) {
      screenplayStartInFlightRef.current = false;
      setScreenplayJobId(null);
      addActivity("Screenplay generation failed", selectedIdea?.title || storyScriptIdea?.title || "Story idea");
      flash(screenplayJob?.errorMessage || screenplayJob?.message || "Screenplay generation failed. Inspect raw prompt response and retry.", "error");
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    screenplayStartInFlightRef.current = false;
    const sourceIdea = storyScriptIdea || selectedIdea;
    const result = attachAiProviderMetadata(screenplayJob?.result || {}, aiProviderContext);
    const screenplayIdea = applyScreenplayResult(result, sourceIdea);
    setScreenplayJobId(null);
    if (screenplayIdea) {
      flash("Screenplay generated. Review it, then generate storyboard, lighting, and DP plans.", "success");
      void refetchWallet?.();
      void refetchCreatorProjects?.();
    }
  }, [screenplayJob?.status, screenplayJob?.progress, refetchWallet]);

  useEffect(() => {
    const status = String(productionPlanJob?.status || "").toUpperCase();
    if (isFailedJobStatus(status)) {
      creatorDebugLog("production plan job failed", {
        jobId: productionPlanJobId,
        scriptId: scriptDetailIdea?.scriptId,
        status,
        errorMessage: productionPlanJob?.errorMessage || productionPlanJob?.message || "",
        result: productionPlanJob?.result || null,
      });
      productionPlanStartInFlightRef.current = false;
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
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    productionPlanStartInFlightRef.current = false;
    const plans = productionPlanJob?.result?.productionPlanTags || [];
    const focusedShotNumber = Number(productionPlanJob?.result?.focusedShotNumber || productionPlanJob?.input?.focusedShotNumber || productionPlanJob?.inputPayload?.focusedShotNumber || 0);
    creatorDebugLog("production plan job completed", {
      jobId: productionPlanJobId,
      scriptId: scriptDetailIdea?.scriptId,
      focusedShotNumber,
      planCount: plans.length,
      firstPlanSound: productionPlanSoundDebug(plans[0]),
    });
    setScriptDetailIdea((current) => current ? {
      ...current,
      productionPlanTags: focusedShotNumber ? mergeProductionPlanTags(current.productionPlanTags || productionPlanTags, plans) : plans,
      productionPlanStatus: "GENERATED",
      productionPlanError: "",
    } : current);
    if (!focusedShotNumber) {
      setStoryboardSaved(false);
    }
    setProductionPlanJobId(null);
    setShotPlanRetry(null);
    void refetchProductionPlans?.();
    void refetchWallet?.();
    dispatch(completeStep("storyboard"));
    addActivity("Shot plans generated", `${plans.length || "All"} shots enriched`);
    flash("Storyboard, lighting, sound, and DP plans generated. You can render images per shot now.", "success");
  }, [productionPlanJob?.status, productionPlanJob?.progress, refetchWallet]);

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
    if (storyboardJobId || status) {
      creatorDebugLog("storyboard job update", {
        jobId: storyboardJobId,
        scriptId: scriptDetailIdea?.scriptId,
        status,
        progress: storyboardJob?.progress || 0,
        message: storyboardJob?.message || storyboardJob?.result?.message || "",
        partialSceneCount: storyboardJob?.result?.storyboard?.scenes?.length || 0,
        storyboardId: storyboardJob?.result?.storyboardId || storyboardJob?.result?.storyboard?.storyboardId || "",
      });
    }
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
    creatorDebugLog("storyboard job completed", {
      jobId: storyboardJobId,
      scriptId: scriptDetailIdea?.scriptId,
      storyboardId: storyboardResult?.storyboardId || storyboardResult?.id || storyboardJob?.result?.storyboardId || "",
      sceneCount: storyboardResult?.scenes?.length || 0,
    });
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
    const status = String(shotTakeJob?.status || "").toUpperCase();
    if (!shotTakeJobId || !status) return;
    creatorDebugLog("shot take job update", {
      jobId: shotTakeJobId,
      jobType: shotTakeJob?.jobType,
      status,
      progress: shotTakeJob?.progress || 0,
      message: shotTakeJob?.message || "",
    });
    if (!isCompletedJobStatus(status) && !isFailedJobStatus(status)) return;
    setShotTakeJobId(null);
    void refetchShotTakes?.();
    void refetchAcceptedShotSequence?.();
    void refetchWallet?.();
    if (isFailedJobStatus(status)) {
      flash(shotTakeJob?.errorMessage || shotTakeJob?.message || "Shot take job failed.", "error");
      return;
    }
    addActivity("Shoot & Polish updated", shotTakeJob?.message || "Shot take job completed");
    flash(shotTakeJob?.message || "Shoot & Polish job completed.", "success");
  }, [shotTakeJob?.status, shotTakeJob?.progress]);

  useEffect(() => {
    if (!shotTakeJobId || !shotTakeJobIsError) return;
    const status = queryErrorStatus(shotTakeJobError);
    creatorDebugLog("shot take job polling failed", {
      jobId: shotTakeJobId,
      status,
      error: shotTakeJobError,
    });
    if (status && ![401, 403, 404].includes(status)) return;
    setShotTakeJobId(null);
    void refetchShotTakes?.();
    void refetchWallet?.();
    flash("Could not read the shoot/polish job status. Refreshing the shot take results.", "warning");
  }, [shotTakeJobId, shotTakeJobIsError, shotTakeJobError]);

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

  const openRechargeForPaidAction = (actionLabel = "paid AI generation", details = {}) => {
    if (!tenantId) {
      flash("Set up organization before using paid Creator generation.", "error");
      scrollToSection("dashboard");
      return;
    }
    setLowBalanceNotice({
      actionLabel,
      openedAt: Date.now(),
      minimumBalance: Number(details.minimumBalance) > 0 ? Number(details.minimumBalance) : paidGenerationMinimumBalance,
    });
  };

  const canRunPaidModelAction = (actionLabel = "paid AI generation") => {
    if (walletLoading) return true;
    if (walletHasPaidGenerationBalance) return true;
    openRechargeForPaidAction(actionLabel);
    return false;
  };

  const handlePaidModelError = (error, fallback, actionLabel = "paid AI generation") => {
    if (isInsufficientBalanceError(error)) {
      openRechargeForPaidAction(actionLabel, { minimumBalance: minimumBalanceFromError(error) });
      return;
    }
    flash(apiErrorMessage(error, fallback), "error");
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
      storytellingType,
      hookLens,
      selectionPayload: {
        selectedFrom: isTrendSource ? "trend_cloud" : "own_idea",
        aiProvider: aiProviderContext,
        storytellingType,
        hookLens,
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
      storytellingType,
      hookLens,
    });
    let usedFallback = false;
    let usedBalanceFallback = false;
    let usedRateLimitFallback = false;

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
        if (isInsufficientBalanceError(asyncError)) {
          usedFallback = true;
          usedBalanceFallback = true;
          openRechargeForPaidAction("AI story idea generation");
        }
        if (isRateLimitedError(asyncError)) {
          usedFallback = true;
          usedRateLimitFallback = true;
        }
        if (!usedBalanceFallback && !usedRateLimitFallback) {
        try {
          const result = await generateLockedIdeaOptions({
            lockedIdeaId: brief.lockedIdeaId,
            page,
            size: ideaCandidatePageSize,
          }).unwrap();
          return applyIdeaCandidatePage(result, page);
        } catch (error) {
          usedFallback = true;
          if (isInsufficientBalanceError(error)) {
            usedBalanceFallback = true;
            openRechargeForPaidAction("AI story idea generation");
          }
          if (isRateLimitedError(error)) {
            usedRateLimitFallback = true;
          }
          logCreatorWorkflowError("Story ideas API failed; using local generated options.", error, {
          endpoint: `/creator/locked-ideas/${brief.lockedIdeaId}/ideas/generate`,
          lockedIdeaId: brief.lockedIdeaId,
          page,
          size: ideaCandidatePageSize,
          provider: selectedAiProvider?.code || selectedProviderCode || null,
          briefTitle: brief.title || brief.description || null,
          });
        }
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
    return { ...normalized, usedFallback, usedBalanceFallback, usedRateLimitFallback };
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
      void refetchWallet?.();
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
    void refetchWallet?.();
    void refetchIdeaGenerationJobs?.();
  }, [ideaGenerationJob?.jobId, ideaGenerationJob?.status, refetchWallet]);

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
    setActorModalSignal(0);
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
    setActorModalSignal(0);
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
    if (!canRunPaidModelAction("AI trend prediction")) return;
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
    } catch (error) {
      if (isInsufficientBalanceError(error)) {
        openRechargeForPaidAction("AI trend prediction");
        return;
      }
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
    if (productionPlanStartInFlightRef.current || generateProductionPlansState.isLoading || productionPlanJobId) {
      flash("Shot plan generation is already running.", "info");
      return;
    }
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and review the backend screenplay before shot plans", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return;
    }
    if (!canRunPaidModelAction("AI shot plan generation")) return;
    const focusedShotNumber = Number(options.focusedShotNumber || 0) || null;

    productionPlanStartInFlightRef.current = true;
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
      productionPlanStartInFlightRef.current = false;
      const message = apiErrorMessage(error, "Shot plan generation failed. Check backend logs and try again.");
      const missingDetails = extractMissingDetailsFromApiError(error);
      if (isInsufficientBalanceError(error)) {
        openRechargeForPaidAction("AI shot plan generation");
        return;
      }
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

  const handleGenerateShots = async () => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and review the backend screenplay before generating shots.", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return;
    }
    if (!shotPlansReadyForGeneration) {
      flash("Generate shot plans before generating shots.", "error");
      return;
    }
    if (!storyboardSaved) {
      flash("Save the production plan first, then generate shots.", "warning");
      return;
    }
    if (shotGenerationLoading) return;
    if (!canRunPaidModelAction("AI shot image generation")) return;

    try {
      creatorDebugLog("generate shots requested", {
        projectId: activeProjectId,
        scriptId: scriptDetailIdea.scriptId,
        planCount: productionPlanTags.length,
        firstPlanSound: productionPlanSoundDebug(productionPlanTags[0]),
      });
      const job = await generateStoryboardFromScriptAsync({
        scriptId: scriptDetailIdea.scriptId,
        screenType: scriptDetailIdea.screenType || scriptDetailIdea.scriptJson?.screenType || screenType,
        signedUrlTtlSeconds: 604800,
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (!jobId) {
        throw new Error("Shot generation job did not return a job id.");
      }
      setStoryboardJobId(jobId);
      setWorkspacePage("storyboard");
      dispatch(setActiveStep("storyboard"));
      addActivity("Shot generation started", `${productionPlanTags.length || "All"} shots queued`);
      flash("Shot generation started. Storyboard, lighting, and DP cards will appear as the job progresses.", "success");
      scrollToSection("storyboard");
    } catch (error) {
      const message = apiErrorMessage(error, "Shot generation failed. Check backend logs and try again.");
      creatorDebugLog("generate shots failed to start", {
        projectId: activeProjectId,
        scriptId: scriptDetailIdea.scriptId,
        message,
        error,
      });
      handlePaidModelError(error, message, "AI shot image generation");
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
    if (shotPlanLoading) {
      flash("Shot plans are still generating. Please wait before rendering images.", "warning");
      return;
    }
    const normalizedImageKind = normalizeImageAssetKind(imageKind);
    const shotNumber = Number(scene?.shotNumber || 1);
    const effectivePlans = productionPlanTags.length ? productionPlanTags : extractProductionPlanTagsFromScenes(scenes);
    const matchingPlan = productionPlanForShot(effectivePlans, scene, shotNumber);
    if (!hasProductionPlanImageKindData(matchingPlan || scene, normalizedImageKind)) {
      const planLabel = normalizedImageKind === "dp" ? "camera/DP" : normalizedImageKind;
      flash(`Generate ${planLabel} shot plan JSON for shot ${shotNumber} before rendering this image.`, "error");
      return;
    }
    if (!canRunPaidModelAction(`${normalizedImageKind === "dp" ? "DP" : normalizedImageKind} image generation`)) return;
    const loadingKey = shotImageLoadingKey(shotNumber, normalizedImageKind);
    setShotImageLoadingKeys((current) => current.includes(loadingKey) ? current : [...current, loadingKey]);
    try {
      const result = await generateShotImage({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        imageKind: normalizedImageKind,
        screenType: scriptDetailIdea.screenType || scriptDetailIdea.scriptJson?.screenType || screenType,
        signedUrlTtlSeconds: 604800,
      }).unwrap();
      const resultScene = normalizeShotImageResult(result, scene, shotNumber, normalizedImageKind);
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
      addActivity(`${normalizedImageKind.toUpperCase()} image rendered`, `Shot ${shotNumber}`);
      flash(`${normalizedImageKind === "dp" ? "DP" : normalizedImageKind} image generated for shot ${shotNumber}.`, "success");
    } catch (error) {
      handlePaidModelError(error, `Could not render ${normalizedImageKind} image for shot ${shotNumber}.`, `${normalizedImageKind === "dp" ? "DP" : normalizedImageKind} image generation`);
    } finally {
      setShotImageLoadingKeys((current) => current.filter((key) => key !== loadingKey));
    }
  };

  const handleEditStoryboardShotWithAi = async (scene, instruction) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before editing storyboard shots.", "error");
      return;
    }
    const cleanInstruction = String(instruction || "").trim();
    if (!cleanInstruction) {
      flash("Describe what AI should change in this shot.", "error");
      return;
    }
    if (!canRunPaidModelAction("AI shot editing")) return;
    const shotNumber = Number(scene?.shotNumber || preview.currentSceneIndex + 1 || 1);
    const loadingKey = shotImageLoadingKey(shotNumber, "storyboard");
    setShotImageLoadingKeys((current) => current.includes(loadingKey) ? current : [...current, loadingKey]);
    try {
      creatorDebugLog("shot-ai-edit:start", { projectId: activeProjectId, scriptId: scriptDetailIdea.scriptId, shotNumber, instruction: cleanInstruction });
      const result = await editStoryboardShotWithAi({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        instruction: cleanInstruction,
        imageKind: "storyboard",
        screenType: scriptDetailIdea.screenType || scriptDetailIdea.scriptJson?.screenType || screenType,
        signedUrlTtlSeconds: 604800,
      }).unwrap();
      const resultScene = normalizeShotImageResult(result, scene, shotNumber, "storyboard");
      const normalizedScene = normalizeStoryboardResponse(
        { scenes: [resultScene], screenType: resultScene.screenType || result.screenType || screenType, renderWidth: resultScene.renderWidth || result.renderWidth, renderHeight: resultScene.renderHeight || result.renderHeight },
        scriptDetailIdea
      ).scenes[0];
      const editedShot = rawShotFromShotImageResult(result, normalizedScene, shotNumber);
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
        scriptJson: editedShot ? replaceShotInScriptJson(current.scriptJson, editedShot) : current.scriptJson,
        productionPlanTags: mergeProductionPlanTags(current.productionPlanTags || [], extractProductionPlanTagsFromScenes([normalizedScene])),
      } : current);
      addActivity("AI shot edit rendered", `Shot ${shotNumber}`);
      flash(`Shot ${shotNumber} updated with AI.`, "success");
      creatorDebugLog("shot-ai-edit:complete", { scriptId: scriptDetailIdea.scriptId, shotNumber, result });
    } catch (error) {
      handlePaidModelError(error, `Could not edit shot ${shotNumber}.`, "AI shot editing");
    } finally {
      setShotImageLoadingKeys((current) => current.filter((key) => key !== loadingKey));
    }
  };

  const handleAddEmptyPostProductionShot = (scene) => {
    const afterShotNumber = Number(scene?.shotNumber || preview.currentSceneIndex + 1 || scenes.length || 0);
    if (!afterShotNumber) {
      flash("Select a shot before adding an empty slot.", "error");
      return;
    }
    const insertedShotNumber = afterShotNumber + 1;
    const placeholder = createEmptyInsertedShot(scene, insertedShotNumber, afterShotNumber);
    const updatedScenes = replaceSceneByShotNumber(shiftScenesAfterShotNumber(scenes, afterShotNumber), placeholder);
    setPostProductionSceneOrder(updatedScenes.map((item, index) => sceneOrderKey(item, index)));
    setGeneratedStoryboard((current) => {
      const base = current || currentStoryboard || {};
      return {
        ...base,
        id: base.id || base.storyboardId || activeStoryboardId || scriptDetailIdea?.scriptId,
        storyboardId: base.storyboardId || base.id || activeStoryboardId || scriptDetailIdea?.scriptId,
        projectId: base.projectId || scriptDetailIdea?.projectId || activeProjectId,
        title: base.title || scriptDetailIdea?.title,
        screenType: base.screenType || scriptDetailIdea?.screenType || screenType,
        durationSeconds: base.durationSeconds || scriptDetailIdea?.durationSeconds || selectedDuration,
        totalShots: updatedScenes.length,
        scenes: updatedScenes,
        productionPlanTags: extractProductionPlanTagsFromScenes(updatedScenes),
      };
    });
    setScriptDetailIdea((current) => current ? {
      ...current,
      scriptScenes: updatedScenes,
      scriptJson: current.scriptJson ? {
        ...current.scriptJson,
        shots: updatedScenes,
      } : current.scriptJson,
      productionPlanTags: extractProductionPlanTagsFromScenes(updatedScenes),
    } : current);
    dispatch(setCurrentSceneIndex(Math.max(0, insertedShotNumber - 1)));
    addActivity("Empty shot added", `After shot ${afterShotNumber}`);
    flash("Empty shot slot added. Describe it in the shot panel to generate it.", "success");
  };

  const handleInsertStoryboardTimelineShot = async (scene, instruction) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before adding timeline shots.", "error");
      return;
    }
    const cleanInstruction = String(instruction || "").trim();
    if (!cleanInstruction) {
      flash("Describe the shot you want to add.", "error");
      return;
    }
    if (!canRunPaidModelAction("AI timeline shot generation")) return;
    const replacingPlaceholder = isGeneratedShotPlaceholder(scene);
    const afterShotNumber = Number(
      scene?.insertAfterShotNumber
      || scene?.insert_after_shot_number
      || (replacingPlaceholder ? Math.max(0, Number(scene?.shotNumber || 1) - 1) : 0)
      || scene?.shotNumber
      || preview.currentSceneIndex + 1
      || scenes.length
      || 0
    );
    const expectedShotNumber = replacingPlaceholder ? Number(scene?.shotNumber || afterShotNumber + 1) : afterShotNumber + 1;
    const loadingKey = shotImageLoadingKey(expectedShotNumber, "storyboard");
    setShotImageLoadingKeys((current) => current.includes(loadingKey) ? current : [...current, loadingKey]);
    try {
      creatorDebugLog("shot-ai-insert:start", { projectId: activeProjectId, scriptId: scriptDetailIdea.scriptId, afterShotNumber, instruction: cleanInstruction });
      const result = await insertStoryboardTimelineShot({
        scriptId: scriptDetailIdea.scriptId,
        afterShotNumber,
        instruction: cleanInstruction,
        screenType: scriptDetailIdea.screenType || scriptDetailIdea.scriptJson?.screenType || screenType,
        signedUrlTtlSeconds: 604800,
      }).unwrap();
      const insertedShotNumber = Number(result?.shotNumber || result?.shot_number || expectedShotNumber);
      const resultScene = normalizeShotImageResult(result, {}, insertedShotNumber, "storyboard");
      const normalizedScene = normalizeStoryboardResponse(
        { scenes: [resultScene], screenType: resultScene.screenType || result.screenType || screenType, renderWidth: resultScene.renderWidth || result.renderWidth, renderHeight: resultScene.renderHeight || result.renderHeight },
        scriptDetailIdea
      ).scenes[0];
      setGeneratedStoryboard((current) => {
        const baseScenes = current?.scenes?.length ? current.scenes : scenes;
        const baseForInsert = replacingPlaceholder
          ? removeSceneByOrderKey(baseScenes, scene)
          : shiftScenesAfterShotNumber(baseScenes, afterShotNumber);
        const updatedScenes = replaceSceneByShotNumber(baseForInsert, normalizedScene);
        setPostProductionSceneOrder(updatedScenes.map((item, index) => sceneOrderKey(item, index)));
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
        scriptScenes: replaceSceneByShotNumber(
          replacingPlaceholder
            ? removeSceneByOrderKey(current.scriptScenes?.length ? current.scriptScenes : scenes, scene)
            : shiftScenesAfterShotNumber(current.scriptScenes || [], afterShotNumber),
          normalizedScene
        ),
        scriptJson: current.scriptJson ? {
          ...current.scriptJson,
          shots: replaceSceneByShotNumber(
            replacingPlaceholder
              ? removeSceneByOrderKey(current.scriptJson.shots?.length ? current.scriptJson.shots : scenes, scene)
              : shiftScenesAfterShotNumber(current.scriptJson.shots || [], afterShotNumber),
            normalizedScene
          ),
        } : current.scriptJson,
      } : current);
      dispatch(setCurrentSceneIndex(Math.max(0, insertedShotNumber - 1)));
      addActivity("AI timeline shot added", `After shot ${afterShotNumber}`);
      flash(`Added AI shot after shot ${afterShotNumber}.`, "success");
      creatorDebugLog("shot-ai-insert:complete", { scriptId: scriptDetailIdea.scriptId, afterShotNumber, insertedShotNumber, result });
    } catch (error) {
      handlePaidModelError(error, `Could not add a shot after shot ${afterShotNumber}.`, "AI timeline shot generation");
    } finally {
      setShotImageLoadingKeys((current) => current.filter((key) => key !== loadingKey));
    }
  };

  const handleUploadShotTake = async (scene, file, note = "") => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before uploading shot takes.", "error");
      return;
    }
    if (!file) {
      flash("Choose a video or image take first.", "error");
      return;
    }
    const shotNumber = Number(scene?.shotNumber || 1);
    try {
      const uploadedTake = await uploadShotTake({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        file,
        note,
      }).unwrap();
      if (String(file.type || "").startsWith("video/") && uploadedTake?.takeId) {
        try {
          const mediaAnalysis = await analyzeVideoTakeFile(file, shotNumber);
          await saveShotTakeMediaAnalysis({
            takeId: uploadedTake.takeId,
            mediaAnalysis,
          }).unwrap();
          const firstTimelineFrame = mediaAnalysis?.video?.frames?.find((frame) => frame?.thumbnailDataUrl);
          if (firstTimelineFrame?.thumbnailDataUrl) {
            try {
              const referenceFile = await dataUrlToFileForUpload(
                firstTimelineFrame.thumbnailDataUrl,
                `shot-${String(shotNumber).padStart(2, "0")}-polish-anchor.jpg`
              );
              await uploadShotTakeReferenceFrame({
                takeId: uploadedTake.takeId,
                file: referenceFile,
              }).unwrap();
            } catch (referenceError) {
              console.warn("[creator] default polish reference frame upload failed", referenceError);
              flash("Take uploaded. Click a timeline frame before polishing if the polish button asks for an anchor.", "warning");
            }
          }
        } catch (analysisError) {
          console.warn("[creator] video media analysis failed", analysisError);
          flash("Take uploaded. Timeline analysis could not be created in this browser.", "warning");
        }
      }
      addActivity("Shot take uploaded", `Shot ${shotNumber}`);
      flash(`Shot ${shotNumber} take uploaded. Timeline and polish anchor are ready.`, "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, `Could not upload shot ${shotNumber}.`), "error");
    }
  };

  const handleReviewShotTake = async (take) => {
    if (!take?.takeId) return;
    if (!canRunPaidModelAction("AI shot take review")) return;
    try {
      const job = await reviewShotTakeAsync({ takeId: take.takeId }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Shot review started", `Shot ${take.shotNumber}`);
      flash("Shot review started. Deterministic checks will finish shortly.", "success");
    } catch (error) {
      handlePaidModelError(error, "Shot review could not start.", "AI shot take review");
    }
  };

  const handleUploadShotTakeReferenceFrame = async (take, file, context = {}) => {
    if (!take?.takeId || !file) return;
    try {
      await uploadShotTakeReferenceFrame({
        takeId: take.takeId,
        file,
      }).unwrap();
      const timelineSuffix = context?.source === "timeline" && context.timestampSeconds != null
        ? ` at ${Number(context.timestampSeconds).toFixed(1)}s`
        : "";
      addActivity(context?.source === "timeline" ? "Timeline frame selected" : "Reference frame saved", `Shot ${take.shotNumber}${timelineSuffix}`);
      flash(context?.source === "timeline" ? "Timeline frame selected for video polish." : "Reference frame saved for video polish.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not save selected frame."), "error");
    }
  };

  const handleDeleteShotTakeTimelineFrame = async (take, frame) => {
    if (!take?.takeId || !frame) return;
    const currentAnalysis = take.mediaAnalysis && typeof take.mediaAnalysis === "object" ? take.mediaAnalysis : {};
    const currentVideo = currentAnalysis.video && typeof currentAnalysis.video === "object" ? currentAnalysis.video : {};
    const currentFrames = Array.isArray(currentVideo.frames) ? currentVideo.frames : [];
    const nextFrames = currentFrames.filter((candidate) => !isSameTimelineFrame(candidate, frame));
    if (nextFrames.length === currentFrames.length) {
      flash("That timeline frame was already removed.", "warning");
      return;
    }
    const mediaAnalysis = {
      ...currentAnalysis,
      updatedAt: new Date().toISOString(),
      video: {
        ...currentVideo,
        frameCount: nextFrames.length,
        frames: nextFrames,
      },
    };
    try {
      await saveShotTakeMediaAnalysis({
        takeId: take.takeId,
        mediaAnalysis,
      }).unwrap();
      addActivity("Timeline frame deleted", `Shot ${take.shotNumber} at ${Number(frame.timestampSeconds || 0).toFixed(1)}s`);
      flash("Timeline frame removed.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not delete timeline frame."), "error");
    }
  };

  const handleSaveShotTakeSoundTimeline = async (take, payload = {}) => {
    if (!take?.takeId) return;
    try {
      await saveShotTakeSoundTimeline({
        takeId: take.takeId,
        layers: Array.isArray(payload.layers) ? payload.layers : [],
        mixSettings: payload.mixSettings || {},
      }).unwrap();
      addActivity("Sound timeline saved", `Shot ${take.shotNumber}`);
      flash("Sound timeline and ducking rules saved.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not save sound timeline."), "error");
    }
  };

  const handleSaveShotTakeTextOverlay = async (take, overlay = {}) => {
    if (!take?.takeId) return;
    const currentAnalysis = take.mediaAnalysis && typeof take.mediaAnalysis === "object" ? take.mediaAnalysis : {};
    const currentOverlays = Array.isArray(currentAnalysis.textOverlays) ? currentAnalysis.textOverlays : [];
    const overlayId = overlay.id || `text-${Math.round(Number(overlay.timestampSeconds || 0) * 1000)}`;
    const nextOverlays = overlay.remove
      ? currentOverlays.filter((item) => String(item.id || "") !== String(overlayId))
      : [
          ...currentOverlays.filter((item) => String(item.id || "") !== String(overlayId)),
          {
            id: overlayId,
            text: String(overlay.text || "").trim(),
            timestampSeconds: Number(overlay.timestampSeconds || 0),
            startSeconds: Number(overlay.startSeconds || 0),
            endSeconds: Number(overlay.endSeconds || 2),
            color: overlay.color || "#ffffff",
            fontFamily: overlay.fontFamily || "Inter",
            fontSize: Number(overlay.fontSize || 28),
            captionStyle: overlay.captionStyle || overlay.caption_style || "classic",
            backgroundColor: overlay.backgroundColor || overlay.background_color || "#000000",
            backgroundOpacity: Number(overlay.backgroundOpacity ?? overlay.background_opacity ?? 0.28),
            textTransform: overlay.textTransform || overlay.text_transform || "none",
            position: overlay.position || "bottom",
            fontWeight: overlay.fontWeight || 900,
            x: Number(overlay.x ?? 12),
            y: Number(overlay.y ?? 68),
            width: Number(overlay.width ?? 76),
            height: Number(overlay.height ?? 16),
            frameSource: overlay.frameSource || overlay.source || "polished_timeline",
          },
        ];
    try {
      const response = await saveShotTakeMediaAnalysis({
        takeId: take.takeId,
        mediaAnalysis: {
          ...currentAnalysis,
          textOverlays: nextOverlays.sort((left, right) => Number(left.startSeconds || 0) - Number(right.startSeconds || 0)),
          updatedAt: new Date().toISOString(),
        },
      }).unwrap();
      addActivity(overlay.remove ? "Shot text removed" : "Shot text saved", `Shot ${take.shotNumber}`);
      flash(overlay.remove ? "Text removed from this shot." : "Text saved on this shot frame.", "success");
      void refetchShotTakes?.();
      return response;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not save text overlay."), "error");
      throw error;
    }
  };

  const handleSaveShotTakePolishedVideoFrames = async (take, polishedVideoAnalysis = {}) => {
    if (!take?.takeId || !Array.isArray(polishedVideoAnalysis.frames) || !polishedVideoAnalysis.frames.length) return;
    const currentAnalysis = take.mediaAnalysis && typeof take.mediaAnalysis === "object" ? take.mediaAnalysis : {};
    const currentPolishedVideo = currentAnalysis.polishedVideo && typeof currentAnalysis.polishedVideo === "object"
      ? currentAnalysis.polishedVideo
      : {};
    try {
      await saveShotTakeMediaAnalysis({
        takeId: take.takeId,
        mediaAnalysis: {
          ...currentAnalysis,
          polishedVideo: {
            ...currentPolishedVideo,
            ...polishedVideoAnalysis,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
      }).unwrap();
      creatorDebugLog("polished video frames saved", {
        takeId: take.takeId,
        shotNumber: take.shotNumber,
        frameCount: polishedVideoAnalysis.frames.length,
      });
      void refetchShotTakes?.();
    } catch (error) {
      console.warn("[creator] could not save polished video frames", error);
    }
  };

  const handleGenerateShotTakePolishedFrames = async (take, payload = {}) => {
    if (!take?.takeId) return null;
    try {
      const response = await generateShotTakePolishedFrames({
        takeId: take.takeId,
        variantId: payload.variantId,
        sampleCount: payload.sampleCount || 10,
        persist: payload.persist ?? true,
        metadata: payload.metadata || {},
      }).unwrap();
      const frames = response?.mediaAnalysis?.polishedVideo?.frames || [];
      creatorDebugLog("backend polished frames generated", {
        takeId: take.takeId,
        shotNumber: take.shotNumber,
        variantId: payload.variantId,
        frameCount: Array.isArray(frames) ? frames.length : 0,
      });
      void refetchShotTakes?.();
      return response;
    } catch (error) {
      console.warn("[creator] backend polished frame extraction failed", error);
      return null;
    }
  };

  const handleUploadShotTakeSoundSnippet = async (take, file, metadata = {}) => {
    if (!take?.takeId || !file) return;
    try {
      await uploadShotTakeSoundSnippet({
        takeId: take.takeId,
        file,
        metadata,
      }).unwrap();
      addActivity("Sound snippet added", `Shot ${take.shotNumber}`);
      flash("Sound snippet added to the timeline.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload sound snippet."), "error");
    }
  };

  const handleGenerateShotTakeSound = async (take, payload = {}) => {
    if (!take?.takeId) return;
    if (!canRunPaidModelAction("AI sound generation")) return;
    try {
      const job = await generateShotTakeSoundAsync({
        takeId: take.takeId,
        ...payload,
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Sound generation prepared", `Shot ${take.shotNumber}`);
      flash("Sound generation task prepared and added to the timeline.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      handlePaidModelError(error, "Could not prepare generated sound.", "AI sound generation");
    }
  };

  const handleEnhanceShotTakeAudio = async (take, payload = {}) => {
    if (!take?.takeId) return;
    if (!canRunPaidModelAction("AI audio enhancement")) return;
    try {
      const job = await enhanceShotTakeAudioAsync({
        takeId: take.takeId,
        editNote: payload.editNote || "Enhance audio quality for this video while preserving the original voice, words, timing, and texture.",
        preserveVoiceTexture: true,
        preserveRoomTone: true,
        overrides: {
          mixSettings: payload.mixSettings || take.mediaAnalysis?.soundTimeline?.mixSettings || {},
        },
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Audio enhancement prepared", `Shot ${take.shotNumber}`);
      flash("Audio enhancement task prepared with the saved foley/music timeline.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not start audio enhancement.", "AI audio enhancement");
    }
  };

  const handleMixShotTakeAudio = async (take, payload = {}) => {
    if (!take?.takeId) return;
    if (!canRunPaidModelAction("AI audio mix render")) return;
    try {
      const job = await mixShotTakeAudioAsync({
        takeId: take.takeId,
        layers: payload.layers || take.mediaAnalysis?.soundTimeline?.layers || [],
        mixSettings: payload.mixSettings || take.mediaAnalysis?.soundTimeline?.mixSettings || {},
        renderMode: "polished_timeline_audio",
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Audio mix render started", `Shot ${take.shotNumber}`);
      flash("Audio mix render started. The mixed track will appear in the polished panel when ready.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      handlePaidModelError(error, "Could not render audio mix.", "AI audio mix render");
    }
  };

  const handleRenderShotTakeFinalVideo = async (take, payload = {}) => {
    if (!take?.takeId) return;
    if (!canRunPaidModelAction("final MP4 render")) return;
    try {
      const job = await renderShotTakeFinalVideoAsync({
        takeId: take.takeId,
        variantId: payload.variantId,
        burnTextOverlays: payload.burnTextOverlays ?? true,
        useMixedAudio: payload.useMixedAudio ?? true,
        metadata: payload.metadata || {},
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Final MP4 render started", `Shot ${take.shotNumber}`);
      flash("Final MP4 render started. The baked video will appear in the polished panel when ready.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      handlePaidModelError(error, "Could not render final MP4.", "final MP4 render");
    }
  };

  const handleConfirmShotTake = async (take, accepted) => {
    if (!take?.takeId) return;
    try {
      await confirmShotTake({
        takeId: take.takeId,
        accepted,
        note: accepted ? "User confirmed shot matches plan." : "User requested re-shoot.",
      }).unwrap();
      addActivity(accepted ? "Shot take accepted" : "Shot take marked re-shoot", `Shot ${take.shotNumber}`);
      if (accepted && scriptDetailIdea?.scriptId) {
        try {
          const job = await renderAcceptedShotSequenceAsync({ scriptId: scriptDetailIdea.scriptId }).unwrap();
          const jobId = job?.jobId || job?.id;
          if (jobId) setShotTakeJobId(jobId);
          addActivity("Final shot preview rebuilding", `Accepted through Shot ${take.shotNumber}`);
          flash("Shot accepted. Rebuilding the mobile final preview.", "success");
        } catch (sequenceError) {
          flash(apiErrorMessage(sequenceError, "Shot accepted, but final preview could not start."), "warning");
        }
      } else {
        flash(accepted ? "Shot take accepted. Polish preview is enabled." : "Shot take marked for re-shoot.", accepted ? "success" : "warning");
      }
      void refetchShotTakes?.();
      void refetchAcceptedShotSequence?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not update shot take."), "error");
    }
  };

  const handleEnhanceShotTakePreview = async (take, editNote = "") => {
    if (!take?.takeId) return;
    if (!canRunPaidModelAction("AI polish preview")) return;
    try {
      const job = await enhanceShotTakePreviewAsync({
        takeId: take.takeId,
        editNote,
        generateImage: true,
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Polish preview started", `Shot ${take.shotNumber}`);
      flash("Gemini frame preview started from the uploaded image/frame.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not start polish preview.", "AI polish preview");
    }
  };

  const handleShotTakeFeedback = async (take, feedback) => {
    if (!take?.takeId || !feedback?.trim()) return;
    try {
      await saveShotTakeEnhancementFeedback({ takeId: take.takeId, feedback }).unwrap();
      addActivity("Polish feedback saved", `Shot ${take.shotNumber}`);
      flash("Polish feedback saved.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not save polish feedback."), "error");
    }
  };

  const handleApplyShotTakePreviewToTimeline = async (take, variant, applied = true) => {
    if (!take?.takeId || !variant?.variantId) {
      flash("Generate an enhanced image for this clip before applying it to the timeline.", "warning");
      return;
    }
    try {
      await applyShotTakePreviewToTimeline({
        takeId: take.takeId,
        variantId: variant.variantId,
        applied,
      }).unwrap();
      addActivity(applied ? "Preview applied to clip" : "Preview removed from clip", `Shot ${take.shotNumber}`);
      flash(applied ? "Enhanced image applied to this clip timeline." : "Enhanced image removed from this clip timeline.", "success");
      void refetchShotTakes?.();
    } catch (error) {
      flash(apiErrorMessage(error, applied ? "Could not apply preview to timeline." : "Could not remove preview from timeline."), "error");
    }
  };

  const handleStudioPolishShotTake = async (take, polishPayload = {}) => {
    if (!take?.takeId) return;
    if (polishBlockedReason) {
      flash(polishBlockedReason, "error");
      return;
    }
    if (!canRunPaidModelAction("AI video polish")) return;
    const payload = typeof polishPayload === "string" ? { editNote: polishPayload } : (polishPayload || {});
    try {
      const job = await studioPolishShotTakeAsync({
        takeId: take.takeId,
        ...payload,
        generatePlateFromReference: payload.generatePlateFromReference ?? Boolean(take.referenceFrameUrl),
        plateMode: payload.plateMode || "clean_background_plate",
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Video polish started", `Shot ${take.shotNumber}`);
      flash("Video polish started. Production design, Studio Look, continuity, and your prompt will be used together.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not start video polish.", "AI video polish");
    }
  };

  const handleStudioPolishAllShotTakes = async (polishPayload = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before Studio Polish.", "error");
      return;
    }
    if (polishBlockedReason) {
      flash(polishBlockedReason, "error");
      return;
    }
    if (!canRunPaidModelAction("Studio Polish for accepted shots")) return;
    const payload = typeof polishPayload === "string" ? { editNote: polishPayload } : (polishPayload || {});
    try {
      const job = await studioPolishAllShotTakesAsync({
        scriptId: scriptDetailIdea.scriptId,
        ...payload,
        plateMode: payload.plateMode || "clean_background_plate",
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Studio Polish started", "Accepted shot takes");
      flash("Studio Polish started for accepted shots.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not start Studio Polish for accepted shots.", "Studio Polish for accepted shots");
    }
  };

  const handleEnhanceAllShotTakes = async ({ approvedVariantId } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before applying polish.", "error");
      return;
    }
    if (!canRunPaidModelAction("apply-all video polish")) return;
    try {
      const job = await enhanceAllShotTakesAsync({
        scriptId: scriptDetailIdea.scriptId,
        approvedVariantId,
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (jobId) setShotTakeJobId(jobId);
      addActivity("Video polish started", "Accepted shot takes");
      flash("Video polish generation started.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not start apply-all polish job.", "apply-all video polish");
    }
  };

  function getWorkflowGateMessage(step) {
    if (!workflowStepIds.has(step) && step !== "storyboard" && step !== "shoot-polish") return "";
    if (step === "ideas") return "";
    if (step === "script" && !storyScriptIdea) {
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
    if (step === "shoot-polish" && polishBlockedReason) {
      return polishBlockedReason;
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
    } else {
      setActorModalSignal(0);
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
      } else {
        setActorModalSignal(0);
      }
    } else if (step === "trend") {
      setWorkspacePage("ideas");
      setActorModalSignal(0);
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
      storytellingType: draftScript.storytellingType || storytellingType,
      hookLens: draftScript.hookLens || hookLens,
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
      storytellingType: result.scriptJson?.storytellingType || payload.storytellingType,
      hookLens: result.scriptJson?.hookLens || payload.hookLens,
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
      storytellingType: draftScript.storytellingType || storytellingType,
      hookLens: draftScript.hookLens || hookLens,
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
      storytellingType: result.scriptJson?.storytellingType || payload.storytellingType,
      hookLens: result.scriptJson?.hookLens || payload.hookLens,
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

  const handleSelectWeeklyIdeaTag = (tag) => {
    const text = String(tag?.prompt || tag?.title || tag?.label || "").trim();
    if (!text) return;
    setTrendChoiceMode("original");
    setManualIdeaDraft(text);
    addActivity("Weekly idea selected", tag?.title || tag?.label || "Idea tag");
    flash("Idea copied into the topic box.", "success");
  };

  const handleLoadWeeklyIdeaTags = async () => {
    if (!tenantId) return;
    let latestTags = weeklyIdeaTags;
    try {
      const result = await refetchWeeklyIdeaTags?.();
      latestTags = result?.data || result?.currentData || latestTags;
    } catch {
      // If cached lookup fails, fall through to paid refresh so wallet/API errors surface normally.
    }
    if (hasWeeklyIdeaTagsPayload(latestTags)) return;
    if (!canRunPaidModelAction("weekly idea cloud refresh")) return;
    try {
      await refreshWeeklyIdeaTags().unwrap();
      await refetchWeeklyIdeaTags?.();
      addActivity("Weekly idea cloud loaded", "Next 7 days");
    } catch (error) {
      handlePaidModelError(error, "Could not load weekly idea tags.", "weekly idea cloud refresh");
    }
  };

  const handleRefreshWeeklyIdeaTags = async () => {
    if (!canRunPaidModelAction("weekly idea cloud refresh")) return;
    try {
      await refreshWeeklyIdeaTags().unwrap();
      await refetchWeeklyIdeaTags?.();
      addActivity("Weekly idea cloud refreshed", "Next 7 days");
      flash("Weekly idea cloud refreshed.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not refresh weekly idea tags.", "weekly idea cloud refresh");
    }
  };

  const generateStoryIdeasForBrief = async (brief) => {
    if (!brief) {
      flash(TREND_DISCOVERY_ENABLED ? "Save a trend or original idea first" : "Write and save a topic first", "error");
      return null;
    }

    dispatch(setActiveStep("ideas"));
    setWorkspacePage("ideas");
    window.history.replaceState(null, "", "/#ideas");

    const generated = await loadIdeaCandidatesForBrief(brief, 0);
    const firstGeneratedIdea = generated.items[0] || brief;
    if (firstGeneratedIdea?.id) {
      dispatch(selectIdea(firstGeneratedIdea.id));
    }
    dispatch(setActiveStep("ideas"));
    setWorkspacePage("ideas");
    addActivity("Generated story ideas", `${generated.pageInfo.totalElements || generated.items.length || 20} options from saved brief`);
    flash(
      generated.usedBalanceFallback
        ? "Showing local story ideas now. Recharge to run paid AI idea generation."
        : generated.usedRateLimitFallback
          ? "Gemini is rate-limited right now, so local story ideas are shown. Try paid AI generation again in a minute."
        : generated.usedFallback ? "Story ideas API failed; showing local generated options." : "Story ideas generated in creative workflow",
      generated.usedFallback ? "warning" : "success"
    );
    scrollToSection("workflow");
    return generated;
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
    dispatch(completeStep("trend"));
    setWorkspacePage("ideas");
    addActivity("Trend saved", selectedTrend.title);
    flash(
      lockedSelection?.ideaId ? "Trend saved. Generate story ideas when ready." : "Trend saved locally; generate local story ideas when ready.",
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
      lockedSelection?.ideaId ? "Topic saved. Generate story ideas when ready." : "Topic saved locally; generate local story ideas when ready.",
      lockedSelection?.ideaId ? "success" : "warning"
    );
  };

  const handleGenerateStoryIdeas = async () => {
    if (!lockedBrief) {
      flash(TREND_DISCOVERY_ENABLED ? "Save a trend or original idea first" : "Write and save a topic first", "error");
      return;
    }
    if (!canGenerateStoryIdeas) {
      flash(TREND_DISCOVERY_ENABLED ? "Save the current trend or idea before generating" : "Save the current topic before generating", "error");
      return;
    }
    let generationBrief = lockedBrief;
    if (!isUuid(generationBrief.lockedIdeaId)) {
      const sourceType = generationBrief.source === "trend" ? "TREND" : "ORIGINAL";
      const lockedSelection = await persistIdeaSelection({
        sourceType,
        idea: generationBrief,
        trend: sourceType === "TREND" ? selectedTrend : null,
      });
      if (lockedSelection?.ideaId) {
        generationBrief = {
          ...generationBrief,
          id: lockedSelection.ideaId,
          backendLocked: true,
          lockedIdeaId: lockedSelection.ideaId,
          projectId: lockedSelection.projectId || generationBrief.projectId || activeProjectId,
        };
        setLockedBrief(generationBrief);
        setExtraIdeas((current) => mergeUniqueIdeas(current, [generationBrief]));
      }
    }
    await generateStoryIdeasForBrief(generationBrief);
  };

  const handleIdeaCandidatePageChange = async (page) => {
    if (!lockedBrief) {
      flash("Lock a trend or original idea first", "error");
      return;
    }
    const normalizedPage = Math.max(0, page);
    const generated = await loadIdeaCandidatesForBrief(lockedBrief, normalizedPage);
    if (generated.usedBalanceFallback) {
      flash("Showing local story ideas for this page. Recharge to run paid AI idea generation.", "warning");
    } else if (generated.usedFallback) {
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
    if (!canRunPaidModelAction("AI story script generation")) return;

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
        storytellingType,
        hookLens,
        context: { aiProvider: providerMemory, storytellingType, hookLens },
      }).unwrap(), providerMemory);
    } catch (error) {
      handlePaidModelError(error, "Story generation failed. Please regenerate with complete storyline, character, and beat JSON.", "AI story script generation");
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
      storytellingType: scriptResult.scriptJson?.storytellingType || scriptResult.storytellingType || storytellingType,
      hookLens: scriptResult.scriptJson?.hookLens || scriptResult.hookLens || hookLens,
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
      storytellingType: screenplayResult.scriptJson?.storytellingType || screenplayResult.storytellingType || storytellingType,
      hookLens: screenplayResult.scriptJson?.hookLens || screenplayResult.hookLens || hookLens,
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
    if (screenplayStartInFlightRef.current || generateScreenplayAsyncState.isLoading || screenplayJobId) {
      flash("Screenplay generation is already running.", "warning");
      return;
    }
    screenplayStartInFlightRef.current = true;

    try {
      let sourceIdea = storyIdea;
      if (draftStoryScript) {
        sourceIdea = await handleSaveStoryScript(draftStoryScript) || storyIdea;
      }

      const providerMemory = aiProviderContext;
      const screenplayCategoryCode = resolveWorkflowCategoryCode(lockedBrief, sourceIdea, filters.category);
      if (!isUuid(lockedBrief.lockedIdeaId) || !isUuid(sourceIdea.id)) {
        screenplayStartInFlightRef.current = false;
        flash("Screenplay generation needs saved UUIDs. Save the topic again so the workflow can continue.", "error");
        return;
      }
      if (!canRunPaidModelAction("AI screenplay generation")) {
        screenplayStartInFlightRef.current = false;
        return;
      }

      const productionContext = buildScreenplayProductionContext();
      setProductionPlanJobId(null);
      productionPlanStartInFlightRef.current = false;
      setShotPlanRetry(null);
      setShotPlanRetrySeconds(0);
      setStoryboardJobId(null);
      setGeneratedStoryboard(null);
      const job = await generateStoryIdeaScreenplayAsync({
        lockedIdeaId: lockedBrief.lockedIdeaId,
        storyIdeaId: sourceIdea.id,
        durationSeconds: selectedDuration,
        categoryCode: screenplayCategoryCode,
        idea: `${sourceIdea.title}\n${sourceIdea.description || ""}`.trim(),
        dialogueLanguage,
        screenType,
        storytellingType,
        hookLens,
        budgetTier: productionContext.budgetTier,
        characterCastMappings: productionContext.characterCastMappings,
        availableActors: productionContext.availableActors,
        audienceDecision: productionContext.audienceDecision,
        brandContext: productionContext.brandContext,
        creatorContext: productionContext.creatorContext,
        context: {
          aiProvider: providerMemory,
          workflowLockedAt: new Date().toISOString(),
          storytellingType,
          hookLens,
          lockedPackage: productionContext,
        },
      }).unwrap();
      if (job?.jobId) {
        setScreenplayJobId(job.jobId);
        addActivity("Screenplay generation started", sourceIdea.title);
        flash("Screenplay generation started. Shot-wise JSON will appear when ready.", "success");
      } else {
        screenplayStartInFlightRef.current = false;
      }
    } catch (error) {
      screenplayStartInFlightRef.current = false;
      handlePaidModelError(error, "Screenplay generation failed. Please regenerate with complete shots, timing, audio, lighting, blocking, and production metadata.", "AI screenplay generation");
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
      storytellingType,
      hookLens,
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
      storytellingType,
      hookLens,
      durationSeconds: selectedDuration,
    };
    return {
      budgetTier: selectedDuration <= 60 ? "zero_budget" : selectedDuration <= 180 ? "micro_budget" : "indie",
      storytellingType,
      hookLens,
      characterCastMappings,
      availableActors,
      audienceDecision: selectedAudienceDecision || selectedAudienceSummary,
      brandContext,
      creatorContext,
    };
  };

  const handleSuggestAudience = async (audienceDraft) => {
    if (!canRunPaidModelAction("AI audience suggestion")) return null;
    let result = null;
    let usedLocalSuggestion = false;
    try {
      result = await suggestAudience(buildAudienceDecisionPayload(audienceDraft)).unwrap();
    } catch (error) {
      if (isInsufficientBalanceError(error)) {
        openRechargeForPaidAction("AI audience suggestion");
        return null;
      }
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
      if (!canRunPaidModelAction("AI trend idea generation")) {
        usedLocalBatch = true;
      } else {
        try {
          await generateIdeas({ trendId: planner.selectedTrendId, audienceId: planner.selectedAudienceId, creatorId: planner.selectedCreatorId }).unwrap();
        } catch (error) {
          if (isInsufficientBalanceError(error)) {
            openRechargeForPaidAction("AI trend idea generation");
          }
          usedLocalBatch = true;
          // The local mock batch below keeps the CTA useful if a real API is unavailable.
        }
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
    const actualStoryboardId = currentStoryboard?.storyboardId || currentStoryboard?.id;
    const canPersistStoryboardSave = legacyStoryboardSaveApiEnabled
      && isUuid(actualStoryboardId)
      && actualStoryboardId !== activeProjectId
      && actualStoryboardId !== scriptDetailIdea?.scriptId;
    try {
      if (canPersistStoryboardSave) {
        if (next) {
          await saveStoryboard({ storyboardId: actualStoryboardId, note: "Saved from planner" }).unwrap();
        } else {
          await unsaveStoryboard({ storyboardId: actualStoryboardId }).unwrap();
        }
      } else {
        usedLocalSave = true;
      }
    } catch {
      usedLocalSave = true;
      // Local state keeps the CTA responsive if the backend is not available yet.
    }
    creatorDebugLog("production save toggled", {
      next,
      usedLocalSave,
      activeProjectId,
      actualStoryboardId,
      scriptId: scriptDetailIdea?.scriptId,
      planCount: productionPlanTags.length,
    });
    setStoryboardSaved(next);
    addActivity(next ? "Saved production" : "Unsaved production", currentStoryboard?.title || "Shot plan");
    flash(
      usedLocalSave
        ? (next ? "Production plan saved. Generate Shots is now enabled." : "Production plan save removed.")
        : (next ? "Storyboard saved" : "Storyboard removed from saved"),
      "success"
    );
  };

  const handleExport = () => {
    if (!activeProjectId) {
      flash("Save a topic first so this workflow has a project id to export.", "error");
      return;
    }
    if (!canExportShotsPdf) {
      emitCreatorAnalyticsEvent("creator_pdf_export_blocked", {
        project_id: activeProjectId,
        script_id: scriptDetailIdea?.scriptId || "",
        expected_shots: shotExportSummary.expected,
        complete_shots: shotExportSummary.completeReady,
      });
      flash(exportBlockedReason || "Please export after generating all the shots.", "warning");
      return;
    }
    setPdfExporting(true);
    try {
      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        flash("Allow pop-ups for Creator UI, then export again.", "error");
        return;
      }
      const report = buildStoryboardPdfReport({
        projectId: activeProjectId,
        scriptId: scriptDetailIdea?.scriptId || "",
        title: buildExportTitle({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard }),
        storyline: buildExportStoryline({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard }),
        scenes: scenes.slice(0, shotExportSummary.expected),
        durationSeconds: currentStoryboard?.durationSeconds || currentStoryboard?.duration || selectedDuration,
        screenType: currentStoryboard?.screenType || screenType,
        callbackUrl: buildPdfCallbackUrl(activeProjectId, scriptDetailIdea?.scriptId),
      });
      emitCreatorAnalyticsEvent("creator_pdf_export_opened", {
        project_id: activeProjectId,
        script_id: scriptDetailIdea?.scriptId || "",
        shot_count: report.shotCount,
      });
      emitCreatorAnalyticsEvent("creator_pdf_preview_page_view", {
        project_id: activeProjectId,
        script_id: scriptDetailIdea?.scriptId || "",
        shot_count: report.shotCount,
      });
      reportWindow.document.open();
      reportWindow.document.write(report.html);
      reportWindow.document.close();
      let printRequested = false;
      const openPrintDialog = () => {
        if (printRequested) return;
        printRequested = true;
        emitCreatorAnalyticsEvent("creator_pdf_print_dialog_opened", {
          project_id: activeProjectId,
          script_id: scriptDetailIdea?.scriptId || "",
          shot_count: report.shotCount,
        });
        reportWindow.focus();
        reportWindow.print();
      };
      reportWindow.onload = () => window.setTimeout(openPrintDialog, 500);
      window.setTimeout(openPrintDialog, 1400);
      addActivity("Export PDF opened", `${report.shotCount} generated shots`);
      flash("Branded PDF report opened. Use Save as PDF from the print dialog.", "success");
    } catch (error) {
      creatorDebugLog("pdf export failed", {
        projectId: activeProjectId,
        scriptId: scriptDetailIdea?.scriptId,
        error,
      });
      flash("Could not create the PDF report. Try again after the shot cards finish loading.", "error");
    } finally {
      setPdfExporting(false);
    }
  };

  const handleSceneSelect = (index) => {
    const sceneMs = preview.durationMs / Math.max(1, scenes.length);
    dispatch(setCurrentSceneIndex(index));
    dispatch(setCursorMs(Math.min(preview.durationMs, index * sceneMs)));
  };

  const handleReorderPostProductionShots = (fromIndex, toIndex) => {
    const from = Number(fromIndex);
    const to = Number(toIndex);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to || from < 0 || to < 0 || from >= scenes.length || to >= scenes.length) return;
    const orderedKeys = scenes.map(sceneOrderKey);
    const nextOrder = moveArrayItem(orderedKeys, from, to);
    const reorderedScenes = moveArrayItem(scenes, from, to);
    setPostProductionSceneOrder(nextOrder);
    setGeneratedStoryboard((current) => {
      const base = current || currentStoryboard || {};
      if (!base && !reorderedScenes.length) return current;
      return {
        ...base,
        scenes: reorderedScenes,
        shots: Array.isArray(base.shots) && base.shots.length ? sortScenesLikeOrder(base.shots, reorderedScenes) : base.shots,
        totalShots: reorderedScenes.length,
        productionPlanTags: extractProductionPlanTagsFromScenes(reorderedScenes),
      };
    });
    setScriptDetailIdea((current) => current ? {
      ...current,
      scriptScenes: sortScenesLikeOrder(current.scriptScenes?.length ? current.scriptScenes : reorderedScenes, reorderedScenes),
      scriptJson: current.scriptJson ? {
        ...current.scriptJson,
        shots: sortScenesLikeOrder(current.scriptJson.shots || current.scriptScenes || reorderedScenes, reorderedScenes),
      } : current.scriptJson,
      productionPlanTags: extractProductionPlanTagsFromScenes(reorderedScenes),
    } : current);
    dispatch(setCurrentSceneIndex(to));
    const sceneMs = preview.durationMs / Math.max(1, scenes.length);
    dispatch(setCursorMs(Math.min(preview.durationMs, to * sceneMs)));
    addActivity("Shot sequence reordered", `Moved shot ${from + 1} to ${to + 1}`);
  };

  const handleOpenRecharge = () => {
    if (!tenantId) {
      flash("Set up organization before wallet recharge", "error");
      scrollToSection("dashboard");
      return;
    }
    setLowBalanceNotice(null);
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
      const postProductionShots = buildPostProductionShotsFromRestored(restored);
      return {
        id: `project-${projectId}`,
        projectId,
        title: project.title || "Creator project",
        lockedIdeaTitle: stage.description,
        durationSeconds: project.durationSeconds,
        time: project.updatedAt ? formatJobTime(project.updatedAt) : "Project",
        status: project.status,
        stage,
        restored,
        postProductionShots,
        shotDesignReady: Boolean(postProductionShots.length || restored?.planner?.completedSteps?.storyboard),
        rawProject: project,
      };
    });
  const displayedPostProductionProjects = useMemo(
    () => (Array.isArray(postProductionProjects) ? postProductionProjects : [])
      .map(normalizePostProductionProject)
      .filter((project) => project.shotDesignReady),
    [postProductionProjects]
  );
  useEffect(() => {
    if (!postProductionOpen) return;
    creatorDebugLog("post production projects loaded", {
      count: displayedPostProductionProjects.length,
      firstProjectId: displayedPostProductionProjects[0]?.projectId,
      firstScriptId: displayedPostProductionProjects[0]?.scriptId,
      firstShotCount: displayedPostProductionProjects[0]?.postProductionShots?.length || 0,
    });
  }, [displayedPostProductionProjects, postProductionOpen]);
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

  const handleOpenHistoryItem = async (item, options = {}) => {
    let project = item?.rawProject || item;
    const requestedProjectId = project?.projectId || item?.projectId || project?.id || item?.id;
    if (isUuid(requestedProjectId) && !options.skipProjectFetch) {
      try {
        project = await fetchCreatorProject(requestedProjectId).unwrap();
      } catch {
        project = item?.rawProject || item;
      }
    }
    const restored = buildWorkflowStateFromProject(project);
    const nextProjectId = restored?.projectId || requestedProjectId;

    if (restored?.projectId) {
      const targetWorkspacePage = options.workspacePage || restored.workspacePage;
      if (restored.lockedBrief) {
        setLockedBrief(restored.lockedBrief);
        setExtraIdeas((current) => mergeUniqueIdeas(current, [restored.lockedBrief]));
      } else {
        setLockedBrief(null);
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
      } else {
        setIdeaCandidatePageItems([]);
        setIdeaCandidatePageInfo({ number: 0, size: ideaCandidatePageSize, totalPages: 1, totalElements: 0 });
      }
      if (restored.savedStoryIdea) {
        setSavedStoryIdeaId(restored.savedStoryIdea.id);
        setSavedIdeaIds((current) => {
          const next = new Set(current);
          next.add(restored.savedStoryIdea.id);
          return next;
        });
        setSavedIdeaSnapshots((current) => mergeUniqueIdeas(current, [restored.savedStoryIdea]));
      } else {
        setSavedStoryIdeaId(null);
      }
      setStoryScriptIdea(restored.storyScriptIdea || null);
      setScriptDetailIdea(restored.scriptDetailIdea || null);
      setStorytellingType(restored.storytellingType || DEFAULT_STORYTELLING_TYPE);
      setHookLens(restored.hookLens || DEFAULT_HOOK_LENS);
      setCastPlan(restored.castPlan || null);
      setSelectedAudienceDecision(restored.audienceDecision || null);
      setGeneratedStoryboard(restored.storyboard || null);
      setStoryboardSaved(Boolean(restored.storyboardSaved));
      dispatch(restorePlannerState(restored.planner));
      if (Number.isFinite(options.sceneIndex)) {
        dispatch(setCurrentSceneIndex(Math.max(0, options.sceneIndex)));
        dispatch(setCursorMs(0));
      }
      setWorkspacePage(targetWorkspacePage);
      window.history.replaceState(null, "", `/#${targetWorkspacePage}`);
      flash("Project restored as the active workflow", "success");
    } else if (isUuid(nextProjectId)) {
      dispatch(setProjectId(nextProjectId));
      flash("Project restored as the active workflow", "success");
    }
    const targetPage = options.workspacePage || restored?.workspacePage;
    const restoredSection = targetPage === "ideas" ? "workflow" : sectionForWorkspacePage(targetPage);
    scrollToSection(restored?.workspacePage ? restoredSection : isUuid(nextProjectId) ? "storyboard" : "dashboard");
  };

  const handleClosePostProduction = () => {
    setPostProductionOpen(false);
    setSelectedPostProductionProject(null);
    if (window.location.hash === "#post-production") {
      window.history.replaceState(null, "", "/#dashboard");
    }
  };

  const handleSelectPostProductionProject = async (project) => {
    if (!project) return;
    const requestedProjectId = project.projectId || project.rawProject?.projectId || project.rawProject?.id;
    let rawProject = project.rawProject || project;
    if (isUuid(requestedProjectId) && !project.postProductionApi) {
      try {
        rawProject = await fetchCreatorProject(requestedProjectId).unwrap();
      } catch {
        rawProject = project.rawProject || project;
      }
    }
    const restored = buildWorkflowStateFromProject(rawProject);
    const apiShots = Array.isArray(project.postProductionShots) ? project.postProductionShots : [];
    const restoredShots = buildPostProductionShotsFromRestored(restored);
    const postProductionShots = apiShots.length ? apiShots : restoredShots;
    setSelectedPostProductionProject({
      ...project,
      rawProject,
      restored,
      projectId: restored?.projectId || requestedProjectId,
      title: rawProject?.title || project.title || "Creator project",
      postProductionShots,
      shotDesignReady: Boolean(postProductionShots.length || restored?.planner?.completedSteps?.storyboard),
    });
  };

  const handleOpenPostProductionShot = async (project, shot, index = 0) => {
    if (!project) return;
    await handleOpenHistoryItem(project, {
      workspacePage: "shoot-polish",
      sceneIndex: Number.isFinite(index) ? index : Math.max(0, Number(shot?.shotNumber || 1) - 1),
      skipProjectFetch: Boolean(project.postProductionApi),
    });
    handleClosePostProduction();
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
        setStorytellingType(storyIdea.storytellingType || DEFAULT_STORYTELLING_TYPE);
        setHookLens(storyIdea.hookLens || DEFAULT_HOOK_LENS);
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
        setStorytellingType(scriptIdea.storytellingType || DEFAULT_STORYTELLING_TYPE);
        setHookLens(scriptIdea.hookLens || DEFAULT_HOOK_LENS);
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
          storytellingType={storytellingType}
          onStorytellingTypeChange={setStorytellingType}
          hookLens={hookLens}
          onHookLensChange={setHookLens}
          aiProviders={availableAiProviders}
          selectedProviderCode={selectedAiProvider?.code || selectedProviderCode}
          selectedProvider={selectedAiProvider}
          onProviderChange={setSelectedProviderCode}
          providersLoading={aiProvidersLoading}
          providersError={aiProvidersError}
          pageInfo={ideaCandidatePageInfo}
          onPageChange={handleIdeaCandidatePageChange}
          onGenerateIdeas={handleGenerateStoryIdeas}
          showGenerateIdeasAction={!showCreativeBriefPanel}
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
          weeklyIdeaTags={weeklyIdeaTags}
          weeklyIdeaTagsLoading={weeklyIdeaTagsLoading || refreshWeeklyIdeaTagsState.isLoading}
          onLoadWeeklyIdeaTags={handleLoadWeeklyIdeaTags}
          onSelectWeeklyIdeaTag={handleSelectWeeklyIdeaTag}
          onRefreshWeeklyIdeaTags={handleRefreshWeeklyIdeaTags}
        />
      );
    }

    if (slideId === "script") {
      return (
        <StoryScriptPanel
          storyIdea={storyScriptIdea}
          duration={selectedDuration}
          onDurationChange={setSelectedDuration}
          storytellingType={storytellingType}
          onStorytellingTypeChange={setStorytellingType}
          hookLens={hookLens}
          onHookLensChange={setHookLens}
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
            storytellingType={storytellingType}
            hookLens={hookLens}
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
          openActorModalSignal={workspacePage === "cast" ? actorModalSignal : 0}
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
            <button type="button" onClick={() => setRecentIdeaJobsOpen(true)} className="creator-control flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-300">
              <History size={16} /> Recent Ideas
              {recentIdeaGenerationJobs.length > 0 && (
                <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-black text-emerald-200">{recentIdeaGenerationJobs.length}</span>
              )}
            </button>
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

      {showCreativeBriefPanel && (
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
          canGenerateStoryIdeas={canGenerateStoryIdeas}
          savedBriefTitle={canGenerateStoryIdeas ? lockedBrief?.title : ""}
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
            <p className="truncate text-sm font-bold text-white">
              {activeWorkflowSlide.label}: {selectedIdea?.title || (activeWorkflowSlide.id === "ideas" ? "Pick a trend tag or save a topic" : "Start from Creative Brief")}
            </p>
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
          onEditShot={handleEditStoryboardShotWithAi}
          onInsertShot={handleInsertStoryboardTimelineShot}
          onExport={handleExport}
          onSave={handleSaveStoryboard}
          isSaved={storyboardSaved}
          onGenerateAgain={handleGenerateStoryboard}
          onGenerateShots={handleGenerateShots}
          canGenerateShots={canGenerateShots}
          generateShotsBlockedReason={generateShotsBlockedReason}
          canExport={canExportShotsPdf}
          exportBlockedReason={exportBlockedReason}
          isExporting={pdfExporting}
          shotsGenerated={shotsGenerated}
          isGeneratingShots={shotGenerationLoading}
          isEditingShot={editStoryboardShotWithAiState.isLoading}
          isInsertingShot={insertStoryboardTimelineShotState.isLoading}
          isGenerating={shotPlanLoading || shotImageUrlsLoading || generateShotImageState.isLoading || editStoryboardShotWithAiState.isLoading || insertStoryboardTimelineShotState.isLoading || pdfExporting || shotGenerationLoading}
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
      <GenerationStatusBar job={productionPlanJob || storyboardJob || (generateProductionPlansState.isLoading ? { status: "RUNNING", progress: 18, message: "Starting shot plan job" } : productionPlanJobId ? { status: "RUNNING", progress: 38, message: "Generating storyboard, lighting, sound, and DP plans" } : generateStoryboardAsyncState.isLoading ? { status: "RUNNING", progress: 10, message: "Starting shot generation job" } : storyboardJobId ? { status: "RUNNING", progress: 35, message: "Generating shot cards one by one" } : null)} label="Shot design" />

      {effectiveShotPlansReady && (
        <div className="creator-panel-muted flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-xs font-black uppercase tracking-normal ${polishUnlocked ? "text-emerald-200" : "text-amber-200"}`}>
              {polishUnlocked ? "Ready for real footage" : "Generate shots first"}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              {polishUnlocked
                ? "Upload each recorded take in Polish, review camera/dialogue fit, then generate a preview pass for lighting, background, production design, and sound direction."
                : polishBlockedReason}
            </p>
          </div>
          <button
            type="button"
            disabled={!polishUnlocked}
            onClick={() => handleWorkspacePageClick("shoot-polish")}
            className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            title={polishBlockedReason || "Open Polish"}
          >
            {shotGenerationLoading ? "Generating Shots" : "Open Polish"} <ChevronRight size={16} />
          </button>
        </div>
      )}

      <StoryboardHistoryPanel
        saved={displayedSavedStoryboards}
        history={displayedHistory}
        onOpen={handleOpenHistoryItem}
      />
      </>
      )}

      {workspacePage === "shoot-polish" && (
      <section id="shoot-polish" className="creator-section space-y-5">
        {polishBlockedReason && (
          <div className="creator-panel border-amber-300/20 bg-amber-400/[0.045] p-4">
            <p className="text-xs font-black uppercase tracking-normal text-amber-200">
              {effectiveShotPlansReady ? "Generated shots needed" : "Shot design needed"}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
              {polishBlockedReason}
            </p>
            <button
              type="button"
              onClick={() => handleWorkspacePageClick("storyboard")}
              disabled={shotGenerationLoading}
              className="creator-primary mt-3 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {shotGenerationLoading ? "Generating Shots" : effectiveShotPlansReady ? "Open Shot Design" : "Open Shot Design"} <ChevronRight size={16} />
            </button>
          </div>
        )}
        <div className={`grid gap-5 ${postProductionShotRailCollapsed ? "xl:grid-cols-[4.25rem_minmax(0,1fr)]" : "xl:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]"}`}>
          <PostProductionShotStrip
            scenes={scenes}
            activeIndex={preview.currentSceneIndex}
            onSelect={handleSceneSelect}
            collapsed={postProductionShotRailCollapsed}
            onToggle={() => setPostProductionShotRailCollapsed((collapsed) => !collapsed)}
            disabled={shotTakeBusy || insertStoryboardTimelineShotState.isLoading}
            onInsertShot={handleAddEmptyPostProductionShot}
            onReorderShots={handleReorderPostProductionShots}
          />
          <ShotTakePanel
            scenes={scenes}
            takes={shotTakes}
            scriptId={scriptDetailIdea?.scriptId}
            focusedShotNumber={selectedScene?.shotNumber || preview.currentSceneIndex + 1}
            isLoading={shotTakesLoading}
            isBusy={shotTakeBusy}
            activeJob={shotTakeJob}
            acceptedSequence={acceptedShotSequence}
            acceptedSequenceLoading={acceptedShotSequenceLoading || renderAcceptedShotSequenceState.isLoading}
            providerCredits={creatorProviderCredits}
            polishLocked={!polishUnlocked}
            polishBlockedReason={polishBlockedReason}
            onUpload={handleUploadShotTake}
            onUploadReferenceFrame={handleUploadShotTakeReferenceFrame}
            onDeleteTimelineFrame={handleDeleteShotTakeTimelineFrame}
            onSaveSoundTimeline={handleSaveShotTakeSoundTimeline}
            onUploadSoundSnippet={handleUploadShotTakeSoundSnippet}
            onGenerateSound={handleGenerateShotTakeSound}
            onReview={handleReviewShotTake}
            onConfirm={handleConfirmShotTake}
            onEnhancePreview={handleEnhanceShotTakePreview}
            onStudioPolish={handleStudioPolishShotTake}
            onSaveTextOverlay={handleSaveShotTakeTextOverlay}
            onSavePolishedVideoFrames={handleSaveShotTakePolishedVideoFrames}
            onGeneratePolishedVideoFrames={handleGenerateShotTakePolishedFrames}
            onEnhanceAudio={handleEnhanceShotTakeAudio}
            onMixAudio={handleMixShotTakeAudio}
            onRenderFinalVideo={handleRenderShotTakeFinalVideo}
            onGenerateInsertedShot={handleInsertStoryboardTimelineShot}
            isInsertingShot={insertStoryboardTimelineShotState.isLoading}
            onFeedback={handleShotTakeFeedback}
            onEnhanceAll={handleEnhanceAllShotTakes}
          />
        </div>
        <GenerationStatusBar job={shotTakeJob || (shotTakeJobId && !shotTakeJobIsError ? { status: "RUNNING", progress: 35, message: "Processing shoot and polish job" } : null)} label="Shoot & Polish" />
      </section>
      )}

      {tenantId && !rechargeOpen && lowBalanceNotice && (
        <div
          className="fixed inset-0 z-[75] bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Recharge wallet"
          onClick={() => setLowBalanceNotice(null)}
        >
          <div
            className="absolute bottom-4 right-4 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-amber-300/35 bg-[#16110a]/90 p-3 text-amber-50 shadow-2xl shadow-black/55 backdrop-blur-md"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-300/15 text-amber-200">
                <WalletCards size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-100">Recharge wallet</p>
                <p className="mt-1 text-xs leading-5 text-amber-100/80">
                  Recharge to run {lowBalanceNotice.actionLabel || "paid AI generation"}. Your generated ideas and scripts stay visible after closing this.
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-normal text-amber-200/80">
                  Balance {formatWalletAmount(walletBalanceAmount, walletCurrencyCode)} · Minimum {formatWalletAmount(lowBalanceNotice.minimumBalance || paidGenerationMinimumBalance, walletCurrencyCode)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLowBalanceNotice(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-amber-100/80 hover:border-amber-200/40 hover:text-amber-50"
                aria-label="Close low balance notice"
              >
                <X size={15} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLowBalanceNotice(null)}
                className="creator-control px-3 py-2 text-xs font-bold text-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOpenRecharge}
                className="creator-primary flex items-center gap-2 px-3 py-2 text-xs font-bold text-white"
              >
                <WalletCards size={14} /> Recharge
              </button>
            </div>
          </div>
        </div>
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

      {postProductionOpen && (
        <CreatorModal title="Post Production" onClose={handleClosePostProduction}>
          <div className="grid max-h-[72vh] gap-4 overflow-hidden lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-h-0 space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-bold text-white">Projects ready for polish</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-400">
                  Only projects with shot design or storyboard plans appear here.
                </p>
                <button
                  type="button"
                  onClick={() => refetchPostProductionProjects?.()}
                  className="creator-control mt-3 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  {postProductionProjectsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="custom-scrollbar max-h-[52vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
                {postProductionProjectsLoading && !displayedPostProductionProjects.length ? (
                  <div className="px-3 py-6 text-sm font-semibold text-slate-500">Loading shot-ready projects...</div>
                ) : displayedPostProductionProjects.length ? (
                  <div className="space-y-2">
                    {displayedPostProductionProjects.map((project) => {
                      const active = String(selectedPostProductionProject?.projectId || "") === String(project.projectId || "");
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleSelectPostProductionProject(project)}
                          className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition ${
                            active
                              ? "border-emerald-300/35 bg-emerald-400/[0.07]"
                              : "border-white/10 bg-white/[0.025] hover:border-emerald-300/30 hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                            <Clapperboard size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-white">{project.title}</span>
                            <span className="mt-1 block text-xs font-semibold text-slate-400">
                              {project.postProductionShots.length || "Shot design"} shots ready {project.time ? `- ${project.time}` : ""}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-xs font-medium leading-5 text-slate-500">{project.stage.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-sm font-semibold text-slate-500">
                    No projects have shot design ready yet. Generate shot plans from a project first.
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.025] p-3">
              {fetchCreatorProjectState.isFetching ? (
                <div className="grid min-h-[20rem] place-items-center text-sm font-semibold text-slate-500">Loading project shots...</div>
              ) : selectedPostProductionProject ? (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-normal text-emerald-200">Shot thumbnails</p>
                      <h3 className="mt-1 truncate text-lg font-extrabold text-white">{selectedPostProductionProject.title}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Select a shot to open its storyboard and upload the actual take.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPostProductionShot(selectedPostProductionProject, selectedPostProductionProject.postProductionShots[0], 0)}
                      disabled={!selectedPostProductionProject.postProductionShots.length}
                      className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Open First Shot <ChevronRight size={14} />
                    </button>
                  </div>
                  {selectedPostProductionProject.postProductionShots.length ? (
                    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedPostProductionProject.postProductionShots.map((shot, index) => (
                          <button
                            key={`${selectedPostProductionProject.projectId}-${shot.shotNumber}-${index}`}
                            type="button"
                            onClick={() => handleOpenPostProductionShot(selectedPostProductionProject, shot, index)}
                            className="group overflow-hidden rounded-lg border border-white/10 bg-black/25 text-left transition hover:border-emerald-300/35 hover:bg-white/[0.055]"
                          >
                            <PostProductionShotThumb shot={shot} />
                            <span className="block p-3">
                              <span className="block text-[10px] font-black uppercase tracking-normal text-slate-500">Shot {String(shot.shotNumber || index + 1).padStart(2, "0")}</span>
                              <span className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs font-extrabold leading-5 text-white">{shot.title || `Shot ${index + 1}`}</span>
                              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-200">
                                Open Polish <ChevronRight size={12} />
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid min-h-[20rem] place-items-center rounded-lg border border-amber-300/20 bg-amber-400/[0.045] p-6 text-center">
                      <div>
                        <p className="text-sm font-bold text-amber-100">No shot thumbnails found</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Open the project and generate shot plans first.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid min-h-[20rem] place-items-center text-center">
                  <div>
                    <Clapperboard size={28} className="mx-auto text-emerald-200" />
                    <p className="mt-3 text-sm font-bold text-white">Choose a project</p>
                    <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-slate-500">
                      Its shot thumbnails will appear here. Opening one resumes the project in the polish workspace.
                    </p>
                  </div>
                </div>
              )}
            </div>
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
    storytellingType: idea?.storytellingType || idea?.storyScriptJson?.storytellingType || idea?.scriptJson?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: idea?.storytellingGuidance || idea?.storyScriptJson?.storytellingGuidance || idea?.scriptJson?.storytellingGuidance || {},
    hookLens: idea?.hookLens || idea?.storyScriptJson?.hookLens || idea?.scriptJson?.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: idea?.hookLensGuidance || idea?.storyScriptJson?.hookLensGuidance || idea?.scriptJson?.hookLensGuidance || {},
    hookBridge: idea?.hookBridge || idea?.storyScriptJson?.hookBridge || idea?.scriptJson?.hookBridge || {},
    factualityNotes: idea?.factualityNotes || idea?.storyScriptJson?.factualityNotes || idea?.scriptJson?.factualityNotes || {},
    creativeNotes: idea?.creativeNotes || idea?.notes || {},
  };
}

function hasWeeklyIdeaTagsPayload(payload = {}) {
  const hasText = (item = {}) => Boolean(String(
    item?.title
    || item?.label
    || item?.tag
    || item?.topic
    || item?.prompt
    || item?.creatorPrompt
    || item?.brief
    || ""
  ).trim());
  const categories = Array.isArray(payload?.categories) ? payload.categories : [];
  if (categories.some((category) => Array.isArray(category?.ideas) && category.ideas.some(hasText))) {
    return true;
  }
  const tags = Array.isArray(payload?.tags) ? payload.tags : [];
  return tags.some(hasText);
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
  const baseTitle = truncateText(brief?.title || context.trend?.title || "Saved brief", 72);
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
    storytellingType: context.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: context.hookLens || DEFAULT_HOOK_LENS,
    hashtags: [`#${String(categoryLabel).replace(/[^a-z0-9]/gi, "")}`, `#${angle.replace(/[^a-z0-9]/gi, "")}`, "#ShortsIdea"],
    creativeNotes: {
      hook: angle,
      targetEmotion: index % 3 === 0 ? "Fast curiosity" : index % 3 === 1 ? "Relatable humor" : "Honest connection",
      storyShape: index % 2 === 0 ? "Hook, escalation, payoff" : "Setup, reaction, practical close",
    },
  }));
}

function buildLocalStoryScriptFromIdea(idea, durationSeconds = 30, dialogueLanguage = "English", screenType = "vertical", category = "creator", storytellingType = DEFAULT_STORYTELLING_TYPE, hookLens = DEFAULT_HOOK_LENS) {
  const title = idea?.title || "Creator Story Script";
  const { spokenLines } = localLanguageLines(dialogueLanguage, title);
  const normalizedStorytellingType = normalizeStorytellingType(storytellingType);
  const normalizedHookLens = normalizeHookLens(hookLens);
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
    storytellingType: normalizedStorytellingType,
    storytellingGuidance: storytellingGuidanceFor(normalizedStorytellingType),
    hookLens: normalizedHookLens,
    hookLensGuidance: hookLensGuidanceFor(normalizedHookLens),
    hookBridge: defaultHookBridgeFor(normalizedHookLens),
    factualityNotes: defaultFactualityNotesFor(normalizedHookLens),
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

function buildLocalGeneratedScriptFromIdea(idea, durationSeconds = 30, dialogueLanguage = "English", screenType = "vertical", category = "creator", storytellingType = DEFAULT_STORYTELLING_TYPE, hookLens = DEFAULT_HOOK_LENS) {
  const sceneCount = Number(durationSeconds) >= 60 ? 10 : Number(durationSeconds) >= 45 ? 8 : 6;
  const segment = Math.max(1, Math.round(Number(durationSeconds) / sceneCount));
  const hook = idea?.creativeNotes?.hook || idea?.title || "Selected story idea";
  const { spokenLines, screenCopy } = localLanguageLines(dialogueLanguage, hook);
  const normalizedStorytellingType = normalizeStorytellingType(storytellingType);
  const normalizedHookLens = normalizeHookLens(hookLens);
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
      storytellingType: normalizedStorytellingType,
      storytellingGuidance: storytellingGuidanceFor(normalizedStorytellingType),
      shotMixPlan: shotMixPlanFor(normalizedStorytellingType),
      hookLens: normalizedHookLens,
      hookLensGuidance: hookLensGuidanceFor(normalizedHookLens),
      hookBridge: defaultHookBridgeFor(normalizedHookLens),
      factualityNotes: defaultFactualityNotesFor(normalizedHookLens),
      pacingStyle: "Local preview pacing with a clear hook, middle action, and saveable close",
      emotionalArc: "Decision point -> small action -> visible payoff",
      hookStrategy: "Start with the human hesitation before explaining the idea.",
      creatorFitReasoning: "Phone-friendly local preview while backend generation is unavailable.",
      audienceFitReasoning: "Clear short-form structure with relatable dialogue.",
      overallExecutionDifficulty: "Beginner Friendly",
      category,
      dialogueLanguage,
      screenType,
      shots: scenes.map((scene, index) => {
        const storytellingRole = localStorytellingRoleFor(index, normalizedStorytellingType);
        const relatedVisual = storytellingRole === "related_visual";
        return {
          shotNumber: index + 1,
          title: scene.camera,
          purpose: scene.intent,
          shotType: scene.camera,
          cameraAngle: screenType === "horizontal" ? "Centered 16:9 frame" : "Centered 9:16 frame",
          cameraMovement: index % 2 === 0 ? "Static" : "Handheld light",
          fps: 30,
          storytellingRole,
          assetCaptureMode: relatedVisual ? "record_or_generate" : "record",
          assetGenerationPrompt: relatedVisual ? `Create a clean, phone-friendly visual metaphor or B-roll frame for: ${scene.visual}` : "",
          setDesign: screenType === "horizontal"
            ? "Simple everyday set arranged for a 16:9 frame, with subject center-safe and side clutter removed."
            : "Simple everyday set arranged for a 9:16 phone frame, with clean background and safe text space.",
          peopleInFrame: relatedVisual ? 0 : index === 2 || index === 3 ? 2 : 1,
          primaryActors: relatedVisual ? [] : ["Main creator"],
          sideActors: relatedVisual ? [] : index === 2 || index === 3 ? ["Support friend"] : [],
          primaryActorAction: relatedVisual ? "No actor required; show the related visual clearly." : scene.visual,
          sideActorAction: relatedVisual ? "No side actor required in this shot." : index === 2 || index === 3 ? "Support friend reacts subtly or gives a small practical nudge without taking focus." : "No side actor required in this shot.",
          action: scene.visual,
          voiceOver: scene.dialogue,
          dialogue: relatedVisual ? {} : { creator: scene.dialogue },
          textOverlay: scene.screenText,
          creatorDirection: relatedVisual ? "Use this as recordable B-roll or generate it as a visual insert." : scene.directorNote,
          sketchPrompt: `Professional storyboard sketch panel, hand-drawn animatic linework, loose pencil construction marks, clean ink outlines, selective muted marker color accents, ${scene.camera}, ${screenType === "horizontal" ? "horizontal 16:9 composition" : "vertical 9:16 composition"}, phone-friendly creator short with natural light notes, visible wardrobe/set cues, not a black-and-white photo or glossy cinematic still.`,
        };
      }),
    },
    durationSeconds,
    status: "SCRIPT_GENERATED",
  };
}

function normalizeStorytellingType(value) {
  const normalized = String(value || DEFAULT_STORYTELLING_TYPE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["talking_head", "talking_head_explainer"].includes(normalized)) return "talking_head_explainer";
  if (["visual_voiceover", "visual_vo", "broll_voiceover"].includes(normalized)) return "visual_voiceover";
  if (["dialogue_scene", "acted_dialogue", "character_dialogue"].includes(normalized)) return "dialogue_scene";
  if (["dramatic_scene", "drama", "cinematic_drama"].includes(normalized)) return "dramatic_scene";
  return "narrator_visual_mix";
}

function storytellingGuidanceFor(storytellingType = DEFAULT_STORYTELLING_TYPE) {
  const normalized = normalizeStorytellingType(storytellingType);
  if (normalized === "talking_head_explainer") {
    return { primaryMode: "narrator_face", narratorFacePercent: 80, relatedVisualPercent: 20, dialogueStyle: "simple narration with direct creator address" };
  }
  if (normalized === "visual_voiceover") {
    return { primaryMode: "related_visual", narratorFacePercent: 10, relatedVisualPercent: 90, dialogueStyle: "voice over with minimal on-camera dialogue" };
  }
  if (normalized === "dialogue_scene") {
    return { primaryMode: "acted_dialogue", narratorFacePercent: 10, relatedVisualPercent: 20, dialogueStyle: "natural character dialogue" };
  }
  if (normalized === "dramatic_scene") {
    return { primaryMode: "dramatic_scene", narratorFacePercent: 0, relatedVisualPercent: 20, dialogueStyle: "cinematic acted dialogue" };
  }
  return { primaryMode: "narrator_visual_mix", narratorFacePercent: 40, relatedVisualPercent: 60, dialogueStyle: "simple narration with engaging dialogue", recordOrGenerateVisuals: true };
}

function shotMixPlanFor(storytellingType = DEFAULT_STORYTELLING_TYPE) {
  const guidance = storytellingGuidanceFor(storytellingType);
  return {
    narratorFacePercent: guidance.narratorFacePercent || 0,
    relatedVisualPercent: guidance.relatedVisualPercent || 0,
    recordOrGenerateVisualsNote: guidance.recordOrGenerateVisuals ? "Related visual shots can be recorded by the user or generated from assetGenerationPrompt." : "",
  };
}

function localStorytellingRoleFor(index, storytellingType = DEFAULT_STORYTELLING_TYPE) {
  const normalized = normalizeStorytellingType(storytellingType);
  if (normalized === "talking_head_explainer") return index % 5 === 2 ? "related_visual" : "narrator_face";
  if (normalized === "visual_voiceover") return index === 0 ? "narrator_face" : "related_visual";
  if (normalized === "dialogue_scene" || normalized === "dramatic_scene") return "acted_dialogue";
  return index % 3 === 0 ? "narrator_face" : "related_visual";
}

function normalizeHookLens(value) {
  const normalized = String(value || DEFAULT_HOOK_LENS)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["historical", "history"].includes(normalized)) return "history";
  if (["geo", "geography", "place"].includes(normalized)) return "geography";
  if (["philosophy", "philosophical"].includes(normalized)) return "philosophy";
  if (["science", "scientific"].includes(normalized)) return "science";
  if (["culture", "cultural", "arts"].includes(normalized)) return "culture";
  if (["psychology", "human_behavior"].includes(normalized)) return "psychology";
  if (["economics", "economy", "money"].includes(normalized)) return "economics";
  return "direct";
}

function hookLensGuidanceFor(hookLens = DEFAULT_HOOK_LENS) {
  const normalized = normalizeHookLens(hookLens);
  return {
    hookLens: normalized,
    useExternalBridge: normalized !== "direct",
    factualityRule: "Use only reliable, commonly known facts. Do not invent dates, places, people, causal links, or analogies.",
    fallbackRule: "If no accurate bridge exists, use a direct hook and mark relationConfidence as none.",
    bridgeStyle: normalized === "direct" ? "start directly from the original story" : `open with a factual ${normalized} reference only when it truthfully relates to the story`,
  };
}

function defaultHookBridgeFor(hookLens = DEFAULT_HOOK_LENS) {
  const normalized = normalizeHookLens(hookLens);
  return {
    hookLens: normalized,
    factualHook: "",
    bridgeLine: "",
    relationConfidence: normalized === "direct" ? "not_applicable" : "none",
    noFalseLinkReason: normalized === "direct"
      ? "Direct hook selected."
      : "Local fallback does not invent external facts. Use direct opening unless the AI can supply a reliable factual bridge.",
  };
}

function defaultFactualityNotesFor(hookLens = DEFAULT_HOOK_LENS) {
  return {
    hookLens: normalizeHookLens(hookLens),
    verifiedFacts: [],
    avoidedClaims: ["No unsupported historical, geographical, philosophical, or causal links."],
    requiresHumanFactCheck: normalizeHookLens(hookLens) !== "direct",
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

function normalizeShotDesignThumbnailFields(scene = {}) {
  const storyboardTag = firstObject(scene.storyboardTag, scene.storyboard_tag) || {};
  const lightingTag = firstObject(scene.lightingBuildSheetTag, scene.lighting_build_sheet_tag) || {};
  const cameraTag = firstObject(scene.cameraPlanSheetTag, scene.camera_plan_sheet_tag) || {};
  const shotPayload = firstObject(scene.shotPayload, scene.shot_payload, scene.payload) || {};
  const imageAssets = collectStoryboardImageAssets(scene).filter((asset) => !isTakeLikeShotAsset(imageUrlFromObject(asset), asset));
  const storyboardImageUrl = firstText(
    designImageUrl(scene.storyboardImageUrl, scene),
    designImageUrl(scene.storyboard_image_url, scene),
    designImageUrl(scene.shotDesignImageUrl, scene),
    designImageUrl(scene.shot_design_image_url, scene),
    designImageUrl(shotPayload.storyboardImageUrl, shotPayload),
    designImageUrl(shotPayload.storyboard_image_url, shotPayload),
    designImageUrl(storyboardTag.storyboardImageUrl, storyboardTag),
    designImageUrl(storyboardTag.storyboard_image_url, storyboardTag),
    designImageUrl(scene.storyboardImage, scene.storyboardImage),
    designImageUrl(scene.storyboard_image, scene.storyboard_image),
    designImageUrl(scene.storyboardAsset, scene.storyboardAsset),
    designImageUrl(scene.storyboard_asset, scene.storyboard_asset),
    designImageUrl(imageUrlByKind(imageAssets, "storyboard"))
  );
  return {
    storyboardImageUrl,
    lightingImageUrl: firstText(
      designImageUrl(scene.lightingImageUrl, scene),
      designImageUrl(scene.lighting_image_url, scene),
      designImageUrl(shotPayload.lightingImageUrl, shotPayload),
      designImageUrl(shotPayload.lighting_image_url, shotPayload),
      designImageUrl(lightingTag.lightingImageUrl, lightingTag),
      designImageUrl(lightingTag.lighting_image_url, lightingTag),
      designImageUrl(scene.lightingImage, scene.lightingImage),
      designImageUrl(scene.lighting_image, scene.lighting_image),
      designImageUrl(scene.lightingAsset, scene.lightingAsset),
      designImageUrl(scene.lighting_asset, scene.lighting_asset),
      designImageUrl(imageUrlByKind(imageAssets, "lighting"))
    ),
    cameraPlanImageUrl: firstText(
      designImageUrl(scene.cameraPlanImageUrl, scene),
      designImageUrl(scene.camera_plan_image_url, scene),
      designImageUrl(scene.dpImageUrl, scene),
      designImageUrl(scene.dp_image_url, scene),
      designImageUrl(shotPayload.cameraPlanImageUrl, shotPayload),
      designImageUrl(shotPayload.camera_plan_image_url, shotPayload),
      designImageUrl(shotPayload.dpImageUrl, shotPayload),
      designImageUrl(shotPayload.dp_image_url, shotPayload),
      designImageUrl(cameraTag.cameraPlanImageUrl, cameraTag),
      designImageUrl(cameraTag.camera_plan_image_url, cameraTag),
      designImageUrl(cameraTag.dpImageUrl, cameraTag),
      designImageUrl(cameraTag.dp_image_url, cameraTag),
      designImageUrl(scene.cameraPlanImage, scene.cameraPlanImage),
      designImageUrl(scene.camera_plan_image, scene.camera_plan_image),
      designImageUrl(scene.cameraPlanAsset, scene.cameraPlanAsset),
      designImageUrl(scene.camera_plan_asset, scene.camera_plan_asset),
      designImageUrl(scene.dpImage, scene.dpImage),
      designImageUrl(scene.dp_image, scene.dp_image),
      designImageUrl(imageUrlByKind(imageAssets, "dp"))
    ),
  };
}

function designImageUrl(value = "", source = {}) {
  const url = typeof value === "string" ? value : imageUrlFromObject(value);
  if (!url) return "";
  if (isVideoLikeShotAsset(url, source) || isTakeLikeShotAsset(url, source)) return "";
  return url;
}

function normalizeShotImageResult(result = {}, baseScene = {}, shotNumber = 1, imageKind = "storyboard") {
  const data = firstObject(result?.data) || {};
  const rawShot = firstObject(
    result?.rawShot,
    result?.raw_shot,
    result?.shotJson,
    result?.shot_json,
    result?.updatedShot,
    result?.updated_shot,
    data.rawShot,
    data.raw_shot,
    data.shotJson,
    data.shot_json,
    data.updatedShot,
    data.updated_shot
  ) || {};
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
    ...rawShot,
    ...nestedScene,
    ...data,
    ...result,
    rawShot: rawShot && Object.keys(rawShot).length ? rawShot : result?.rawShot,
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
    const imageAssets = collectStoryboardImageAssets(image);
    const storyboardUrl = firstText(
      image.storyboardImageUrl,
      image.storyboard_image_url,
      image.signedUrl,
      image.signed_url,
      image.imageUrl,
      image.image_url,
      imageUrlFromObject(image.storyboardImage),
      imageUrlFromObject(image.storyboard_image),
      imageUrlFromObject(image.storyboardAsset),
      imageUrlFromObject(image.storyboard_asset),
      imageUrlByKind(imageAssets, "storyboard")
    );
    const lightingUrl = firstText(
      image.lightingImageUrl,
      image.lighting_image_url,
      image.lightImageUrl,
      image.light_image_url,
      imageUrlFromObject(image.lightingImage),
      imageUrlFromObject(image.lighting_image),
      imageUrlFromObject(image.lightingAsset),
      imageUrlFromObject(image.lighting_asset),
      imageUrlByKind(imageAssets, "lighting")
    );
    const cameraUrl = firstText(
      image.cameraPlanImageUrl,
      image.camera_plan_image_url,
      image.dpImageUrl,
      image.dp_image_url,
      image.cameraImageUrl,
      image.camera_image_url,
      imageUrlFromObject(image.cameraPlanImage),
      imageUrlFromObject(image.camera_plan_image),
      imageUrlFromObject(image.cameraPlanAsset),
      imageUrlFromObject(image.camera_plan_asset),
      imageUrlFromObject(image.dpImage),
      imageUrlFromObject(image.dp_image),
      imageUrlFromObject(image.dpAsset),
      imageUrlFromObject(image.dp_asset),
      imageUrlByKind(imageAssets, "dp")
    );
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
      lightImageUrl: lightingUrl || scene.lightImageUrl,
      cameraPlanImageAssetId: image.cameraPlanImageAssetId || image.camera_plan_image_asset_id || scene.cameraPlanImageAssetId,
      cameraPlanObjectKey: image.cameraPlanObjectKey || image.camera_plan_object_key || scene.cameraPlanObjectKey,
      cameraPlanImageUrl: cameraUrl || scene.cameraPlanImageUrl,
      dpImageUrl: cameraUrl || scene.dpImageUrl,
    };
  });
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function hasShotImageUrlData(item = {}) {
  return Boolean(
    firstText(
      item.storyboardImageUrl,
      item.storyboard_image_url,
      item.signedUrl,
      item.signed_url,
      item.imageUrl,
      item.image_url,
      item.lightingImageUrl,
      item.lighting_image_url,
      item.lightImageUrl,
      item.light_image_url,
      item.cameraPlanImageUrl,
      item.camera_plan_image_url,
      item.dpImageUrl,
      item.dp_image_url,
      item.cameraImageUrl,
      item.camera_image_url,
      imageUrlFromObject(item.storyboardImage),
      imageUrlFromObject(item.storyboard_image),
      imageUrlFromObject(item.lightingImage),
      imageUrlFromObject(item.lighting_image),
      imageUrlFromObject(item.cameraPlanImage),
      imageUrlFromObject(item.camera_plan_image),
      imageUrlFromObject(item.dpImage),
      imageUrlFromObject(item.dp_image),
      imageUrlByKind(collectStoryboardImageAssets(item), "storyboard"),
      imageUrlByKind(collectStoryboardImageAssets(item), "lighting"),
      imageUrlByKind(collectStoryboardImageAssets(item), "dp")
    )
    || item.storyboardImageAssetId
    || item.storyboard_image_asset_id
    || item.lightingImageAssetId
    || item.lighting_image_asset_id
    || item.cameraPlanImageAssetId
    || item.camera_plan_image_asset_id
  );
}

function hasRenderableShotAsset(scene = {}) {
  return Boolean(
    firstText(
      scene.signedUrl,
      scene.signed_url,
      scene.imageUrl,
      scene.image_url,
      scene.storyboardImageUrl,
      scene.storyboard_image_url,
      scene.publicUrl,
      scene.public_url,
      scene.assetUrl,
      scene.asset_url,
      scene.lightingImageUrl,
      scene.lighting_image_url,
      scene.cameraPlanImageUrl,
      scene.camera_plan_image_url
    )
    || scene.imageAssetId
    || scene.image_asset_id
    || scene.lightingImageAssetId
    || scene.lighting_image_asset_id
    || scene.cameraPlanImageAssetId
    || scene.camera_plan_image_asset_id
  );
}

function firstPositiveNumber(...values) {
  const value = values.map((item) => Number(item)).find((item) => Number.isFinite(item) && item > 0);
  return value || 0;
}

function summarizeShotExportAssets(scenes = [], expectedShotCount = 0) {
  const shotCount = expectedShotCount || (Array.isArray(scenes) ? scenes.length : 0);
  const relevantScenes = (Array.isArray(scenes) ? scenes : []).slice(0, shotCount || undefined);
  const summary = relevantScenes.reduce((counts, scene) => {
    const urls = normalizeShotImageFields(scene);
    const storyboardReady = Boolean(urls.storyboardImageUrl);
    const lightingReady = Boolean(urls.lightingImageUrl);
    const dpReady = Boolean(urls.cameraPlanImageUrl);
    return {
      storyboardReady: counts.storyboardReady + (storyboardReady ? 1 : 0),
      lightingReady: counts.lightingReady + (lightingReady ? 1 : 0),
      dpReady: counts.dpReady + (dpReady ? 1 : 0),
      completeReady: counts.completeReady + (storyboardReady && lightingReady && dpReady ? 1 : 0),
    };
  }, { storyboardReady: 0, lightingReady: 0, dpReady: 0, completeReady: 0 });

  return {
    expected: shotCount,
    ...summary,
  };
}

function emitCreatorAnalyticsEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  const payload = Object.fromEntries(Object.entries(params)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value) || value == null)
    .map(([key, value]) => [key, value ?? ""]));
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    }
    window.dataLayer = window.dataLayer || [];
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
    }
    creatorDebugLog("analytics event", { eventName, payload });
  } catch {
    // Analytics should never block the export workflow.
  }
}

function buildStoryboardPdfReport({
  projectId,
  scriptId,
  title,
  storyline,
  scenes = [],
  durationSeconds,
  screenType,
  callbackUrl,
}) {
  const generatedAt = formatExportDate(new Date());
  const shotCards = (Array.isArray(scenes) ? scenes : []).map(renderShotPdfCard).join("\n");
  const safeProjectTitle = escapeHtml(title || "Creator project");
  const safeStoryline = escapeHtml(storyline || "Storyline not available.");
  const safeCallbackUrl = escapeHtml(callbackUrl || "");
  const callbackAction = safeCallbackUrl
    ? `<a class="callback-button" href="${safeCallbackUrl}" target="_blank" rel="noreferrer">Open walkthrough / callback</a>`
    : "";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeProjectTitle} - DalaiLlama Story Board</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    html { background: #070a12; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 15% 0%, rgba(247, 201, 72, 0.18), transparent 28%),
        radial-gradient(circle at 88% 8%, rgba(34, 211, 238, 0.12), transparent 26%),
        linear-gradient(145deg, #070a12 0%, #0d1322 52%, #111827 100%);
      color: #f7f9fc;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 1060px;
      margin: 0 auto;
      padding: 28px;
    }
    .cover {
      min-height: 92vh;
      border: 1px solid rgba(255, 255, 255, 0.13);
      background:
        linear-gradient(160deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.035)),
        linear-gradient(135deg, #101827 0%, #080b13 100%);
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.18);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 900;
      letter-spacing: 0;
      color: #ffffff;
    }
    .brand-mark {
      display: inline-grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: linear-gradient(145deg, #f7c948, #b98b16);
      color: #070a12;
      font-weight: 900;
      box-shadow: 0 10px 24px rgba(247, 201, 72, 0.28);
    }
    .meta {
      color: #b8c2d6;
      font-size: 12px;
      font-weight: 700;
      text-align: right;
    }
    h1 {
      margin: 0;
      max-width: 860px;
      font-size: 56px;
      line-height: 0.98;
      letter-spacing: 0;
      color: #ffffff;
      text-transform: uppercase;
    }
    .project-title {
      margin-top: 12px;
      color: #f7c948;
      font-size: 18px;
      font-weight: 900;
    }
    .storyline {
      margin-top: 24px;
      padding: 20px;
      border: 1px solid rgba(247, 201, 72, 0.26);
      border-left: 5px solid #f7c948;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.07);
      color: #e6ecf7;
      font-size: 15px;
      font-weight: 650;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 22px;
    }
    .summary-item {
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.055);
    }
    .summary-item span {
      display: block;
      color: #91a0b8;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .summary-item strong {
      display: block;
      margin-top: 4px;
      color: #ffffff;
      font-size: 15px;
    }
    .cover-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 26px;
    }
    .callback-button,
    .site-pill {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      border-radius: 8px;
      padding: 0 14px;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0;
      text-transform: uppercase;
      text-decoration: none;
    }
    .callback-button {
      background: linear-gradient(145deg, #f7c948, #d49d18);
      color: #07101f;
      box-shadow: 0 12px 28px rgba(247, 201, 72, 0.2);
    }
    .site-pill {
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      color: #dbe5f6;
    }
    .shot-card {
      margin-top: 22px;
      border: 1px solid rgba(255, 255, 255, 0.13);
      border-radius: 8px;
      background:
        linear-gradient(160deg, rgba(255, 255, 255, 0.105), rgba(255, 255, 255, 0.035)),
        #0c111d;
      padding: 18px;
      break-inside: avoid;
      page-break-inside: avoid;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }
    .shot-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.10);
      padding-bottom: 12px;
    }
    .eyebrow {
      margin: 0 0 4px;
      color: #f7c948;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    h2 {
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      letter-spacing: 0;
    }
    .timestamp {
      flex: 0 0 auto;
      color: #9aa8bd;
      font-size: 12px;
      font-weight: 800;
      text-align: right;
    }
    .asset-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .asset {
      min-height: 210px;
      border: 1px solid rgba(255, 255, 255, 0.11);
      border-radius: 8px;
      overflow: hidden;
      background: #070a12;
    }
    .asset-title {
      padding: 8px 10px;
      background: linear-gradient(145deg, rgba(247, 201, 72, 0.18), rgba(255, 255, 255, 0.055));
      color: #eef4ff;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .asset img {
      display: block;
      width: 100%;
      height: 260px;
      object-fit: contain;
      background: #05070d;
    }
    .missing {
      display: grid;
      place-items: center;
      height: 260px;
      color: #77869d;
      font-size: 12px;
      font-weight: 800;
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .detail {
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 8px;
      padding: 11px;
      background: rgba(255, 255, 255, 0.055);
    }
    .detail span {
      display: block;
      color: #8fa0ba;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0;
      margin-bottom: 4px;
    }
    .detail p {
      margin: 0;
      color: #e7edf8;
      font-size: 12px;
      font-weight: 650;
    }
    .pdf-footer {
      margin-top: 14px;
      color: #8190a8;
      font-size: 10px;
      font-weight: 900;
      text-align: right;
      text-transform: uppercase;
    }
    @media print {
      body { background: #070a12; }
      .page { max-width: none; padding: 0; }
      .cover, .shot-card { box-shadow: none; }
      .shot-card { margin-top: 14px; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="cover">
      <div class="brand-row">
        <div class="brand"><span class="brand-mark">DL</span><span>DalaiLlama Creator</span></div>
        <div class="meta">Generated ${escapeHtml(generatedAt)}<br />Story Board</div>
      </div>
      <div>
        <h1>Story Board</h1>
        <div class="project-title">${safeProjectTitle}</div>
        <div class="storyline">${safeStoryline}</div>
        <div class="summary-grid">
          <div class="summary-item"><span>Shots</span><strong>${scenes.length}</strong></div>
          <div class="summary-item"><span>Duration</span><strong>${escapeHtml(durationSeconds || 30)} sec</strong></div>
          <div class="summary-item"><span>Format</span><strong>${escapeHtml(screenType || "vertical")}</strong></div>
          <div class="summary-item"><span>Project</span><strong>${escapeHtml(shortId(projectId))}</strong></div>
        </div>
      </div>
      <div class="cover-actions">
        ${callbackAction}
        <span class="site-pill">dalaillama.in</span>
      </div>
    </section>
    ${shotCards}
    <div class="pdf-footer">dalaillama.in</div>
  </main>
</body>
</html>`;
  return { html, shotCount: scenes.length };
}

function renderShotPdfCard(scene = {}, index = 0) {
  const shotNumber = Number(scene.shotNumber || scene.shot_number || index + 1);
  const storyboardTag = extractStoryboardTag(scene) || {};
  const lightingTag = extractLightingTag(scene) || {};
  const cameraTag = extractCameraTag(scene) || {};
  const imageFields = normalizeShotImageFields(scene);
  const title = firstText(scene.title, scene.shotTitle, storyboardTag.shotTitle, cameraTag.shotTitle, `Shot ${shotNumber}`);
  const timestamp = firstText(scene.timestamp, scene.time, buildTimestamp(scene.startTime, scene.endTime), `Shot ${shotNumber}`);
  const visual = firstText(scene.visualDirection, scene.visual, scene.description, storyboardTag.narrativeBeatSummary, storyboardTag.compositionSummary, storyboardTag.action);
  const dialogue = plainTextValue(scene.dialogue || scene.primaryDialogue || storyboardTag.primaryDialogue || scene.vo || scene.voiceOver || scene.voiceover);
  const sound = buildExportSoundText(scene, storyboardTag);
  const lighting = firstText(scene.lighting, storyboardTag.lightingAtmosphericDescription, lightingTag.cinematicIntent, lightingTag.motivatedSource, lightingTag.keyLightBehavior);
  const camera = joinNonEmpty([
    firstText(scene.camera, scene.cameraAngle, storyboardTag.cameraAngle, cameraTag.cameraAngle),
    firstText(scene.shotType, storyboardTag.shotType, cameraTag.shotType),
    firstText(scene.cameraMovement, storyboardTag.cameraMovement, cameraTag.cameraMovement),
    firstText(scene.lensSuggestion, storyboardTag.lensSuggestion, cameraTag.lensSuggestion, cameraTag.cameraRig?.lensSuggestion),
  ], " | ");
  return `<section class="shot-card">
    <div class="shot-head">
      <div>
        <p class="eyebrow">Shot ${escapeHtml(shotNumber)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="timestamp">${escapeHtml(timestamp)}</div>
    </div>
    <div class="asset-grid">
      ${renderPdfAsset("Storyboard", imageFields.storyboardImageUrl)}
      ${renderPdfAsset("Lighting Design", imageFields.lightingImageUrl)}
      ${renderPdfAsset("DP / Camera", imageFields.cameraPlanImageUrl)}
    </div>
    <div class="details-grid">
      ${renderPdfDetail("Visual", visual || "Visual direction pending.")}
      ${renderPdfDetail("Dialogue / VO", dialogue || "No dialogue.")}
      ${renderPdfDetail("Sound", sound || "Sound design pending.")}
      ${renderPdfDetail("Lighting + DP", joinNonEmpty([lighting, camera], " | ") || "Lighting and camera plan pending.")}
    </div>
  </section>`;
}

function renderPdfAsset(label, url) {
  const safeLabel = escapeHtml(label);
  const safeUrl = escapeHtml(url || "");
  return `<div class="asset">
    <div class="asset-title">${safeLabel}</div>
    ${safeUrl ? `<img src="${safeUrl}" alt="${safeLabel}" />` : `<div class="missing">${safeLabel} pending</div>`}
  </div>`;
}

function renderPdfDetail(label, value) {
  return `<div class="detail"><span>${escapeHtml(label)}</span><p>${escapeHtml(trimText(value, 420))}</p></div>`;
}

function buildExportSoundText(scene = {}, storyboardTag = {}) {
  const shotPayload = scene.shotPayload || scene.shot_payload || {};
  const ambient = firstText(
    storyboardTag.ambientBedDescription,
    storyboardTag.ambient_bed_description,
    scene.ambientBedDescription,
    scene.ambient_bed_description,
    shotPayload.ambientBedDescription,
    shotPayload.ambient_bed_description
  );
  const sync = firstText(
    storyboardTag.syncHitDescription,
    storyboardTag.sync_hit_description,
    scene.syncHitDescription,
    scene.sync_hit_description,
    shotPayload.syncHitDescription,
    shotPayload.sync_hit_description
  );
  const explicit = plainTextValue(
    storyboardTag.soundDesign
    || storyboardTag.sound_design
    || storyboardTag.soundCues
    || storyboardTag.sound_cues
    || storyboardTag.audioCues
    || storyboardTag.audio_cues
    || scene.soundDesign
    || scene.sound_design
    || shotPayload.soundDesign
    || shotPayload.sound_design
  );
  return joinNonEmpty([
    ambient ? `Ambient bed: ${ambient}` : "",
    sync ? `Sync hit: ${sync}` : "",
    explicit,
  ], " ");
}

function buildExportTitle({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard } = {}) {
  const scope = buildExportScope({ activeProjectId, scriptDetailIdea, currentStoryboard });
  const matchingStoryScriptIdea = matchesExportScope(storyScriptIdea, scope) ? storyScriptIdea : null;
  const matchingSelectedIdea = matchesExportScope(selectedIdea, scope) ? selectedIdea : null;
  return firstText(
    currentStoryboard?.projectTitle,
    currentStoryboard?.title,
    scriptDetailIdea?.title,
    scriptDetailIdea?.scriptJson?.projectTitle,
    matchingStoryScriptIdea?.title,
    matchingSelectedIdea?.title,
    "Storyboard"
  );
}

function buildExportStoryline({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard } = {}) {
  const scope = buildExportScope({ activeProjectId, scriptDetailIdea, currentStoryboard });
  const matchingStoryScriptIdea = matchesExportScope(storyScriptIdea, scope) ? storyScriptIdea : null;
  const matchingSelectedIdea = matchesExportScope(selectedIdea, scope) ? selectedIdea : null;
  const scopedStoryline = trimText(firstText(
    currentStoryboard?.storyline,
    currentStoryboard?.logline,
    currentStoryboard?.storyScriptJson?.storyline,
    currentStoryboard?.storyScriptJson?.logline,
    scriptDetailIdea?.storyline,
    scriptDetailIdea?.scriptJson?.storyline,
    scriptDetailIdea?.scriptJson?.logline,
    buildSceneStorylineSnippet(scriptDetailIdea?.scriptScenes || scriptDetailIdea?.scriptJson?.shots || currentStoryboard?.scenes),
    matchingStoryScriptIdea?.storyScriptJson?.storyline,
    matchingStoryScriptIdea?.storyScriptJson?.logline,
    matchingStoryScriptIdea?.storyScriptText,
    matchingStoryScriptIdea?.description,
    matchingSelectedIdea?.storyScriptJson?.storyline,
    matchingSelectedIdea?.storyScriptJson?.logline,
    matchingSelectedIdea?.description,
    matchingSelectedIdea?.summary,
    scriptDetailIdea?.scriptText
  ), 900);
  return scopedStoryline || "Storyline not available for this storyboard.";
}

function buildExportScope({ activeProjectId, scriptDetailIdea, currentStoryboard } = {}) {
  return {
    projectIds: exportIdSet(
      activeProjectId,
      scriptDetailIdea?.projectId,
      scriptDetailIdea?.project_id,
      currentStoryboard?.projectId,
      currentStoryboard?.project_id
    ),
    scriptIds: exportIdSet(
      scriptDetailIdea?.scriptId,
      scriptDetailIdea?.script_id,
      currentStoryboard?.scriptId,
      currentStoryboard?.script_id,
      currentStoryboard?.screenplayId,
      currentStoryboard?.screenplay_id
    ),
    storyIdeaIds: exportIdSet(
      scriptDetailIdea?.storyIdeaId,
      scriptDetailIdea?.story_idea_id,
      scriptDetailIdea?.ideaId,
      scriptDetailIdea?.idea_id,
      scriptDetailIdea?.id,
      currentStoryboard?.storyIdeaId,
      currentStoryboard?.story_idea_id,
      currentStoryboard?.ideaId,
      currentStoryboard?.idea_id
    ),
    lockedIdeaIds: exportIdSet(
      scriptDetailIdea?.lockedIdeaId,
      scriptDetailIdea?.locked_idea_id,
      currentStoryboard?.lockedIdeaId,
      currentStoryboard?.locked_idea_id
    ),
  };
}

function matchesExportScope(entity = {}, scope = {}) {
  if (!entity || typeof entity !== "object") return false;
  const scopeScriptIds = scope.scriptIds || new Set();
  const scopeProjectIds = scope.projectIds || new Set();
  const scopeStoryIdeaIds = scope.storyIdeaIds || new Set();
  const scopeLockedIdeaIds = scope.lockedIdeaIds || new Set();
  const scriptJson = entity.scriptJson || {};
  const storyScriptJson = entity.storyScriptJson || {};
  const entityIds = {
    projectIds: exportIdSet(
      entity.projectId,
      entity.project_id,
      scriptJson.projectId,
      scriptJson.project_id,
      storyScriptJson.projectId,
      storyScriptJson.project_id
    ),
    scriptIds: exportIdSet(
      entity.scriptId,
      entity.script_id,
      entity.screenplayId,
      entity.screenplay_id,
      scriptJson.scriptId,
      scriptJson.script_id,
      scriptJson.id
    ),
    storyIdeaIds: exportIdSet(
      entity.storyIdeaId,
      entity.story_idea_id,
      entity.ideaId,
      entity.idea_id,
      entity.id,
      scriptJson.storyIdeaId,
      scriptJson.story_idea_id,
      storyScriptJson.storyIdeaId,
      storyScriptJson.story_idea_id
    ),
    lockedIdeaIds: exportIdSet(
      entity.lockedIdeaId,
      entity.locked_idea_id,
      scriptJson.lockedIdeaId,
      scriptJson.locked_idea_id,
      storyScriptJson.lockedIdeaId,
      storyScriptJson.locked_idea_id
    ),
  };
  if (scopeScriptIds.size && entityIds.scriptIds.size) {
    return hasIdOverlap(scopeScriptIds, entityIds.scriptIds);
  }
  if (scopeStoryIdeaIds.size && entityIds.storyIdeaIds.size) {
    return hasIdOverlap(scopeStoryIdeaIds, entityIds.storyIdeaIds);
  }
  if (scopeLockedIdeaIds.size && entityIds.lockedIdeaIds.size) {
    return hasIdOverlap(scopeLockedIdeaIds, entityIds.lockedIdeaIds);
  }
  return hasIdOverlap(scopeProjectIds, entityIds.projectIds);
}

function exportIdSet(...values) {
  return new Set(values
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean));
}

function hasIdOverlap(left = new Set(), right = new Set()) {
  if (!left.size || !right.size) return false;
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
}

function buildSceneStorylineSnippet(scenes = []) {
  if (!Array.isArray(scenes) || !scenes.length) return "";
  return scenes
    .slice(0, 5)
    .map((scene) => firstText(
      scene?.title,
      scene?.beatTitle,
      scene?.narrativeBeat,
      scene?.description,
      scene?.visual,
      scene?.action,
      scene?.directorNote
    ))
    .filter(Boolean)
    .join(" ");
}

function buildPdfCallbackUrl(projectId, scriptId) {
  if (typeof window === "undefined") return "";
  const env = window.__ENV__ || {};
  const base = firstText(env.CREATOR_APP_URL, window.location.origin);
  try {
    const url = new URL(base, window.location.origin);
    url.searchParams.set("creatorPdfCallback", "1");
    url.searchParams.set("utm_source", "creator_pdf");
    url.searchParams.set("utm_medium", "pdf");
    url.searchParams.set("utm_campaign", "client_reachout");
    if (projectId) url.searchParams.set("projectId", projectId);
    if (scriptId) url.searchParams.set("scriptId", scriptId);
    url.hash = "storyboard";
    return url.toString();
  } catch {
    return window.location.href;
  }
}

function plainTextValue(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(plainTextValue).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return "";
  return firstText(
    value.text,
    value.line,
    value.words,
    value.dialogue,
    value.voiceOver,
    value.voiceover,
    value.description,
    value.summary,
    value.primaryDialogue,
    value.ambientBedDescription,
    value.syncHitDescription
  );
}

function joinNonEmpty(values = [], separator = " ") {
  return values.map((value) => String(value || "").trim()).filter(Boolean).join(separator);
}

function trimText(value, maxLength = 900) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortId(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 8)}...${text.slice(-4)}` : text || "Draft";
}

function formatExportDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value);
  } catch {
    return "";
  }
}

function productionPlanSoundDebug(plan = {}) {
  const storyboardTag = extractStoryboardTag(plan) || {};
  const scene = plan.sourceScene || plan.scene || {};
  const sceneStoryboard = scene.storyboardTag || {};
  return {
    shotNumber: plan.shotNumber || storyboardTag.shotNumber || scene.shotNumber || "",
    soundDesign: storyboardTag.soundDesign || storyboardTag.sound_design || scene.soundDesign || scene.sound_design || scene.shotPayload?.soundDesign || scene.shot_payload?.soundDesign || null,
    ambientBedDescription: firstText(
      storyboardTag.ambientBedDescription,
      storyboardTag.ambient_bed_description,
      sceneStoryboard.ambientBedDescription,
      sceneStoryboard.ambient_bed_description,
      scene.ambientBedDescription,
      scene.ambient_bed_description
    ),
    syncHitDescription: firstText(
      storyboardTag.syncHitDescription,
      storyboardTag.sync_hit_description,
      sceneStoryboard.syncHitDescription,
      sceneStoryboard.sync_hit_description,
      scene.syncHitDescription,
      scene.sync_hit_description
    ),
    storyboardTagKeys: Object.keys(storyboardTag).filter((key) => /sound|audio|ambient|sync/i.test(key)),
  };
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
        sourceScene: scene,
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

function hasProductionPlanImageKindData(value = {}, imageKind = "storyboard") {
  const normalizedKind = normalizeImageAssetKind(imageKind);
  if (normalizedKind === "lighting") return Boolean(extractLightingTag(value));
  if (normalizedKind === "dp") return Boolean(extractCameraTag(value));
  return Boolean(extractStoryboardTag(value));
}

function productionPlanForShot(plans = [], scene = {}, shotNumber = 1) {
  const targetShotNumber = Number(shotNumber || scene?.shotNumber || scene?.shot_number || 1);
  const source = Array.isArray(plans) ? plans : [];
  return source.find((plan, index) => Number(
    plan?.shotNumber
    || plan?.shot_number
    || plan?.storyboardTag?.shotNumber
    || plan?.storyboard_tag?.shot_number
    || plan?.lightingBuildSheetTag?.shotNumber
    || plan?.lighting_build_sheet_tag?.shot_number
    || plan?.cameraPlanSheetTag?.shotNumber
    || plan?.camera_plan_sheet_tag?.shot_number
    || index + 1
  ) === targetShotNumber) || (Number(scene?.shotNumber || scene?.shot_number || 0) === targetShotNumber ? scene : null);
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

function replaceShotInScriptJson(scriptJson = {}, replacement = {}) {
  if (!scriptJson || typeof scriptJson !== "object" || !replacement || typeof replacement !== "object") {
    return scriptJson;
  }
  const shotNumber = Number(replacement.shotNumber || replacement.shot_number || 0);
  if (!shotNumber) return scriptJson;
  const sourceShots = Array.isArray(scriptJson.shots) ? scriptJson.shots : [];
  let replaced = false;
  const shots = sourceShots.map((shot, index) => {
    const currentShotNumber = Number(shot?.shotNumber || shot?.shot_number || index + 1);
    if (currentShotNumber === shotNumber) {
      replaced = true;
      return {
        ...shot,
        ...replacement,
        shotNumber,
      };
    }
    return shot;
  });
  if (!replaced) {
    shots.push({ ...replacement, shotNumber });
  }
  shots.sort((left, right) => Number(left?.shotNumber || left?.shot_number || 0) - Number(right?.shotNumber || right?.shot_number || 0));
  return {
    ...scriptJson,
    shots,
    totalShots: scriptJson.totalShots || shots.length,
  };
}

function rawShotFromShotImageResult(result = {}, fallbackScene = {}, shotNumber = 1) {
  const data = firstObject(result?.data) || {};
  const rawShot = firstObject(
    result?.rawShot,
    result?.raw_shot,
    result?.shotJson,
    result?.shot_json,
    result?.updatedShot,
    result?.updated_shot,
    data.rawShot,
    data.raw_shot,
    data.shotJson,
    data.shot_json,
    data.updatedShot,
    data.updated_shot,
    fallbackScene?.rawShot,
    fallbackScene?.raw_shot
  );
  if (!rawShot || !Object.keys(rawShot).length) return null;
  return {
    ...rawShot,
    shotNumber: Number(rawShot.shotNumber || rawShot.shot_number || fallbackScene?.shotNumber || shotNumber),
  };
}

function shiftScenesAfterShotNumber(scenes = [], afterShotNumber = 0) {
  const after = Number(afterShotNumber || 0);
  return (Array.isArray(scenes) ? scenes : [])
    .map((scene, index) => {
      const currentShot = Number(scene?.shotNumber || index + 1);
      if (currentShot > after) {
        return {
          ...scene,
          shotNumber: currentShot + 1,
        };
      }
      return scene;
    })
    .sort((a, b) => Number(a?.shotNumber || 0) - Number(b?.shotNumber || 0));
}

function createEmptyInsertedShot(afterScene = {}, insertedShotNumber = 1, afterShotNumber = 0) {
  const placeholderId = `empty-inserted-shot-${Date.now()}-${insertedShotNumber}`;
  return {
    id: placeholderId,
    sceneId: placeholderId,
    shotNumber: Number(insertedShotNumber || 1),
    title: "Empty shot slot",
    description: "Describe this shot to generate storyboard, production, lighting, camera, and sound direction.",
    timestamp: "",
    storyboardTag: {},
    lightingBuildSheetTag: {},
    cameraPlanSheetTag: {},
    shotPayload: {},
    needsShotGeneration: true,
    emptyShotSlot: true,
    placeholderType: "inserted-shot",
    insertAfterShotNumber: Number(afterShotNumber || afterScene?.shotNumber || 0),
    insertAfterSceneId: afterScene?.sceneId || afterScene?.id || "",
  };
}

function isGeneratedShotPlaceholder(scene = {}) {
  return Boolean(
    scene?.needsShotGeneration
    || scene?.needs_shot_generation
    || scene?.emptyShotSlot
    || scene?.empty_shot_slot
    || scene?.placeholderType === "inserted-shot"
  );
}

function removeSceneByOrderKey(scenes = [], scene = {}) {
  const targetKey = sceneOrderKey(scene, Number(scene?.shotNumber || 1) - 1);
  return (Array.isArray(scenes) ? scenes : []).filter((item, index) => sceneOrderKey(item, index) !== targetKey);
}

function mergeScenePreservingImages(existing = {}, replacement = {}) {
  const merged = { ...existing, ...replacement };
  ["signedUrl", "imageUrl", "storyboardImageUrl", "publicUrl", "assetUrl", "lightingImageUrl", "lightImageUrl", "cameraPlanImageUrl", "dpImageUrl", "cameraImageUrl"].forEach((field) => {
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
    `Storytelling Type: ${scriptJson.storytellingType || DEFAULT_STORYTELLING_TYPE}`,
    `Hook Lens: ${scriptJson.hookLens || DEFAULT_HOOK_LENS}`,
    `Hook Bridge: ${textValue(scriptJson.hookBridge || {})}`,
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
    `Storytelling Type: ${scriptJson.storytellingType || DEFAULT_STORYTELLING_TYPE}`,
    `Hook Lens: ${scriptJson.hookLens || DEFAULT_HOOK_LENS}`,
    `Hook Bridge: ${textValue(scriptJson.hookBridge || {})}`,
    "",
    ...shots.map((shot, index) => [
      `Shot ${shot.shotNumber || index + 1}: ${shot.title || "Untitled"}`,
      `Purpose: ${shot.purpose || ""}`,
      `Action: ${shot.action || ""}`,
      `Dialogue: ${textValue(shot.dialogue)}`,
      `Voice Over: ${shot.voiceOver || ""}`,
      `Text Overlay: ${shot.textOverlay || ""}`,
      `Story Role: ${shot.storytellingRole || ""}`,
      `Asset Mode: ${shot.assetCaptureMode || ""}`,
      `Asset Prompt: ${shot.assetGenerationPrompt || ""}`,
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

async function analyzeVideoTakeFile(file, shotNumber) {
  const [video, audio] = await Promise.all([
    extractVideoFrameTimeline(file, shotNumber),
    extractAudioWaveform(file).catch(() => ({ status: "unavailable", peaks: [] })),
  ]);
  return {
    version: 1,
    source: "browser_local_file",
    generatedAt: new Date().toISOString(),
    shotNumber,
    file: {
      name: file?.name || "video",
      sizeBytes: file?.size || 0,
      contentType: file?.type || "",
      lastModified: file?.lastModified || null,
    },
    video,
    audio,
  };
}

async function dataUrlToFileForUpload(dataUrl, fileName) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

function isSameTimelineFrame(candidate = {}, target = {}) {
  const candidateIndex = candidate.index == null ? null : Number(candidate.index);
  const targetIndex = target.index == null ? null : Number(target.index);
  const candidateTime = candidate.timestampSeconds == null ? null : Number(candidate.timestampSeconds);
  const targetTime = target.timestampSeconds == null ? null : Number(target.timestampSeconds);
  const hasIndex = candidateIndex != null && targetIndex != null && Number.isFinite(candidateIndex) && Number.isFinite(targetIndex);
  const hasTime = candidateTime != null && targetTime != null && Number.isFinite(candidateTime) && Number.isFinite(targetTime);
  if (hasIndex && hasTime) return candidateIndex === targetIndex && Math.abs(candidateTime - targetTime) < 0.001;
  if (hasIndex) return candidateIndex === targetIndex;
  if (hasTime) return Math.abs(candidateTime - targetTime) < 0.001;
  return Boolean(candidate.thumbnailDataUrl && candidate.thumbnailDataUrl === target.thumbnailDataUrl);
}

async function extractVideoFrameTimeline(file, shotNumber) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;
  try {
    await waitForMediaEvent(video, "loadedmetadata");
    await ensureVideoFrameReady(video);
    const durationSeconds = await resolveVideoDurationSeconds(video);
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    const timestamps = timelineSampleTimestamps(durationSeconds, 10);
    const canvas = document.createElement("canvas");
    const maxWidth = 160;
    const scale = width > 0 ? Math.min(1, maxWidth / width) : 1;
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    const frames = [];
    for (let index = 0; index < timestamps.length; index++) {
      const timestamp = timestamps[index];
      await seekVideo(video, timestamp);
      if (ctx && width && height) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      frames.push({
        index,
        shotNumber,
        timestampSeconds: roundMediaNumber(timestamp),
        width: canvas.width,
        height: canvas.height,
        originalWidth: width,
        originalHeight: height,
        aspectRatio: canvas.width && canvas.height ? `${canvas.width} / ${canvas.height}` : "",
        thumbnailDataUrl: ctx ? canvas.toDataURL("image/jpeg", 0.58) : "",
      });
    }
    return {
      durationSeconds: roundMediaNumber(durationSeconds),
      width,
      height,
      frameCount: frames.length,
      sampleStrategy: "evenly_spaced_browser_canvas",
      frames,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function resolveVideoDurationSeconds(video) {
  let best = readVideoDurationCandidate(video);
  for (const delay of [80, 160, 320, 640]) {
    await sleep(delay);
    best = Math.max(best, readVideoDurationCandidate(video));
  }
  return roundMediaNumber(best);
}

function readVideoDurationCandidate(video) {
  return Math.max(
    safeMediaDuration(video.duration),
    mediaRangeEnd(video.seekable),
    mediaRangeEnd(video.buffered)
  );
}

function safeMediaDuration(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

function mediaRangeEnd(ranges) {
  try {
    if (!ranges?.length) return 0;
    const end = Number(ranges.end(ranges.length - 1));
    return Number.isFinite(end) && end > 0 ? end : 0;
  } catch {
    return 0;
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function extractAudioWaveform(file) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return { status: "unsupported", peaks: [] };
  }
  const context = new AudioContextClass();
  try {
    const audioBuffer = await context.decodeAudioData(await file.arrayBuffer());
    const channel = audioBuffer.getChannelData(0);
    const bucketCount = 72;
    const bucketSize = Math.max(1, Math.floor(channel.length / bucketCount));
    const peaks = [];
    for (let bucket = 0; bucket < bucketCount; bucket++) {
      let peak = 0;
      const start = bucket * bucketSize;
      const end = Math.min(channel.length, start + bucketSize);
      for (let index = start; index < end; index++) {
        peak = Math.max(peak, Math.abs(channel[index] || 0));
      }
      peaks.push(roundMediaNumber(peak));
    }
    return {
      status: "ready",
      durationSeconds: roundMediaNumber(audioBuffer.duration),
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      peaks,
    };
  } finally {
    context.close?.();
  }
}

function timelineSampleTimestamps(durationSeconds, count) {
  if (!durationSeconds || durationSeconds <= 0) return [0];
  const frameCount = Math.max(1, Math.min(count, Math.ceil(durationSeconds)));
  if (frameCount === 1) return [Math.min(0.05, durationSeconds)];
  const last = Math.max(0, durationSeconds - 0.05);
  return Array.from({ length: frameCount }, (_, index) => (last * index) / (frameCount - 1));
}

function waitForMediaEvent(element, eventName) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), 12000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      element.removeEventListener(eventName, onEvent);
      element.removeEventListener("error", onError);
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not read video metadata."));
    };
    element.addEventListener(eventName, onEvent, { once: true });
    element.addEventListener("error", onError, { once: true });
  });
}

async function seekVideo(video, timestampSeconds) {
  const target = Math.max(0, Math.min(timestampSeconds || 0, Number.isFinite(video.duration) ? video.duration : timestampSeconds || 0));
  if (Math.abs((video.currentTime || 0) - target) < 0.03) {
    await ensureVideoFrameReady(video);
    return;
  }
  const wait = waitForMediaEvent(video, "seeked");
  video.currentTime = target;
  await wait;
  await ensureVideoFrameReady(video);
}

async function ensureVideoFrameReady(video) {
  if (video.readyState >= 2) return;
  await waitForMediaEvent(video, "loadeddata");
}

function roundMediaNumber(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
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

function walletBalanceValue(wallet = {}) {
  const value = Number(
    wallet?.availableBalance
    ?? wallet?.available_balance
    ?? wallet?.balance
    ?? wallet?.amount
    ?? wallet?.totalBalance
    ?? wallet?.total_balance
    ?? 0
  );
  return Number.isFinite(value) ? value : 0;
}

function normalizeProviderCreditsWallet(wallet = null) {
  if (!wallet || typeof wallet !== "object") return null;
  if (!wallet.checked && wallet.balance == null) return null;
  return {
    ...wallet,
    balance: wallet.balance ?? wallet.currentBalance ?? wallet.availableBalance ?? 0,
    currency: wallet.currency || "INR",
    minimumBalance: wallet.minimumBalance ?? wallet.minimum_wallet_balance,
  };
}

function walletMinimumBalanceValue(wallet = {}, fallback = MINIMUM_PAID_GENERATION_WALLET_BALANCE) {
  const value = Number(
    wallet?.minimumBalance
    ?? wallet?.minimum_balance
    ?? wallet?.minimumWalletBalance
    ?? wallet?.minimum_wallet_balance
    ?? wallet?.requiredMinimumBalance
    ?? wallet?.required_minimum_balance
    ?? fallback
  );
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function formatWalletAmount(amount = 0, currency = "INR") {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `${currency || "INR"} ${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function minimumBalanceFromError(error = {}) {
  const data = error?.data || error?.response?.data || {};
  const direct = Number(
    data?.minimumBalance
    ?? data?.minimum_balance
    ?? data?.minimumWalletBalance
    ?? data?.minimum_wallet_balance
    ?? data?.requiredMinimumBalance
    ?? data?.required_minimum_balance
  );
  if (Number.isFinite(direct) && direct > 0) return direct;
  const text = [
    data?.message,
    data?.error,
    data?.reason,
    error?.message,
    error?.error,
  ].filter(Boolean).join(" ");
  const match = text.match(/minimum(?:\s+wallet)?\s+balance(?:\s+is)?\s+([0-9]+(?:\.[0-9]+)?)/i);
  const parsed = Number(match?.[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isInsufficientBalanceError(error = {}) {
  const data = error?.data || error?.response?.data || {};
  const status = Number(error?.status || error?.originalStatus || error?.response?.status || data?.status || data?.statusCode || 0);
  const text = [
    data?.message,
    data?.error,
    data?.reason,
    data?.code,
    error?.message,
    error?.error,
  ].filter(Boolean).join(" ").toLowerCase();
  return status === 402
    || /insufficient|low balance|wallet balance|recharge|payment required|not enough|no credits|credits are not available|balance is zero/.test(text);
}

function isRateLimitedError(error = {}) {
  const data = error?.data || error?.response?.data || {};
  const status = Number(error?.status || error?.originalStatus || error?.response?.status || data?.status || data?.statusCode || 0);
  const text = [
    data?.message,
    data?.error,
    data?.reason,
    data?.code,
    error?.message,
    error?.error,
  ].filter(Boolean).join(" ").toLowerCase();
  return status === 429
    || /too many requests|rate limit|rate-limited|quota exceeded|resource exhausted|429/.test(text);
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
    ideas: Boolean(savedStoryIdea),
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
          : "ideas";

  return {
    projectId,
    storytellingType: scriptDetailIdea?.storytellingType || storyScriptIdea?.storytellingType || savedStoryIdea?.storytellingType || lockedBrief?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: scriptDetailIdea?.hookLens || storyScriptIdea?.hookLens || savedStoryIdea?.hookLens || lockedBrief?.hookLens || DEFAULT_HOOK_LENS,
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
    storytellingType: project.storytellingType || lockedIdea.storytellingType || lockedIdea.selectionPayload?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: project.hookLens || lockedIdea.hookLens || lockedIdea.selectionPayload?.hookLens || DEFAULT_HOOK_LENS,
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
    storytellingType: idea.storytellingType || lockedBrief?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: idea.hookLens || lockedBrief?.hookLens || DEFAULT_HOOK_LENS,
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
    storytellingType: source.storytellingType || lockedBrief?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: source.hookLens || lockedBrief?.hookLens || DEFAULT_HOOK_LENS,
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
    storytellingType: rawScript?.scriptJson?.storytellingType || rawScript?.storyScriptJson?.storytellingType || sourceIdea?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: rawScript?.scriptJson?.storytellingGuidance || rawScript?.storyScriptJson?.storytellingGuidance || sourceIdea?.storytellingGuidance || {},
    hookLens: rawScript?.scriptJson?.hookLens || rawScript?.storyScriptJson?.hookLens || sourceIdea?.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: rawScript?.scriptJson?.hookLensGuidance || rawScript?.storyScriptJson?.hookLensGuidance || sourceIdea?.hookLensGuidance || {},
    hookBridge: rawScript?.scriptJson?.hookBridge || rawScript?.storyScriptJson?.hookBridge || sourceIdea?.hookBridge || {},
    factualityNotes: rawScript?.scriptJson?.factualityNotes || rawScript?.storyScriptJson?.factualityNotes || sourceIdea?.factualityNotes || {},
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
    storytellingType: scriptJson.storytellingType || sourceIdea?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: scriptJson.storytellingGuidance || sourceIdea?.storytellingGuidance || {},
    hookLens: scriptJson.hookLens || sourceIdea?.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: scriptJson.hookLensGuidance || sourceIdea?.hookLensGuidance || {},
    hookBridge: scriptJson.hookBridge || sourceIdea?.hookBridge || {},
    factualityNotes: scriptJson.factualityNotes || sourceIdea?.factualityNotes || {},
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

function isVideoLikeShotAsset(value = "", source = {}) {
  const contentType = firstText(
    source.contentType,
    source.content_type,
    source.mimeType,
    source.mime_type,
    source.assetContentType,
    source.asset_content_type
  ).toLowerCase();
  if (contentType.startsWith("video/")) return true;
  return /\.(mp4|mov|m4v|webm|avi|mkv)(?:$|[?#])/i.test(String(value || ""));
}

function isTakeLikeShotAsset(value = "", source = {}) {
  const sourceText = [
    source.assetType,
    source.asset_type,
    source.kind,
    source.assetKind,
    source.asset_kind,
    source.type,
    source.role,
    source.source,
    source.objectKey,
    source.object_key,
    source.key,
    source.path,
    source.takeId,
    source.take_id,
    source.referenceFrameAssetId,
    source.reference_frame_asset_id,
    source.metadata?.source,
    source.metadata?.assetType,
    source.metadata?.asset_type,
    source.metadata?.kind,
  ].filter(Boolean).join(" ").toLowerCase();
  if (/\b(shot_take|shot-take|take_frame|take-frame|reference_frame|reference-frame|timeline_frame|timeline-frame|polish_anchor|polish-anchor|user_upload|user-upload|raw_take|raw-take|uploaded_take|uploaded-take|recorded_take|recorded-take)\b/.test(sourceText)) {
    return true;
  }
  const urlText = String(value || "").toLowerCase();
  return /(shot[-_/]?takes|take[-_/]?frames|reference[-_/]?frames?|timeline[-_/]?frames?|polish[-_/]?anchor|user[-_/]?upload|raw[-_/]?take|uploaded[-_/]?take|recorded[-_/]?take)/.test(urlText);
}

function sceneOrderKey(scene = {}, index = 0) {
  return String(
    scene.id
    || scene.sceneId
    || scene.scene_id
    || scene.planId
    || scene.plan_id
    || scene.storyboardTag?.shotId
    || scene.storyboard_tag?.shotId
    || `shot-${scene.shotNumber || scene.shot_number || index + 1}`
  );
}

function applySceneOrder(scenes = [], order = []) {
  const source = Array.isArray(scenes) ? scenes : [];
  const keys = Array.isArray(order) ? order : [];
  if (!source.length || !keys.length) return source;
  const byKey = new Map(source.map((scene, index) => [sceneOrderKey(scene, index), scene]));
  const ordered = keys.map((key) => byKey.get(key)).filter(Boolean);
  const orderedKeys = new Set(keys);
  const missing = source.filter((scene, index) => !orderedKeys.has(sceneOrderKey(scene, index)));
  return [...ordered, ...missing];
}

function reconcileSceneOrder(scenes = [], current = []) {
  const source = Array.isArray(scenes) ? scenes : [];
  const order = Array.isArray(current) ? current : [];
  if (!source.length) return order.length ? [] : order;
  if (!order.length) return order;
  const existingKeys = new Set(source.map(sceneOrderKey));
  const next = order.filter((key) => existingKeys.has(key));
  source.forEach((scene, index) => {
    const key = sceneOrderKey(scene, index);
    if (!next.includes(key)) next.push(key);
  });
  return arraysShallowEqual(next, order) ? order : next;
}

function moveArrayItem(values = [], fromIndex = 0, toIndex = 0) {
  const next = [...values];
  const from = Math.max(0, Math.min(next.length - 1, Number(fromIndex) || 0));
  const to = Math.max(0, Math.min(next.length - 1, Number(toIndex) || 0));
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function sortScenesLikeOrder(source = [], orderedScenes = []) {
  const orderMap = new Map((Array.isArray(orderedScenes) ? orderedScenes : []).map((scene, index) => [sceneOrderKey(scene, index), index]));
  return [...(Array.isArray(source) ? source : [])].sort((left, right) => {
    const leftOrder = orderMap.get(sceneOrderKey(left, 0));
    const rightOrder = orderMap.get(sceneOrderKey(right, 0));
    return (leftOrder ?? 9999) - (rightOrder ?? 9999);
  });
}

function arraysShallowEqual(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function postProductionShotThumbnailUrl(shot = {}) {
  const images = normalizeShotDesignThumbnailFields(shot);
  return firstText(
    !isVideoLikeShotAsset(images.storyboardImageUrl, shot) ? images.storyboardImageUrl : "",
    !isVideoLikeShotAsset(images.lightingImageUrl, shot) ? images.lightingImageUrl : "",
    !isVideoLikeShotAsset(images.cameraPlanImageUrl, shot) ? images.cameraPlanImageUrl : ""
  );
}

function PostProductionShotStrip({ scenes = [], activeIndex = 0, onSelect, collapsed = false, onToggle, disabled = false, onInsertShot, onReorderShots }) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const selectedScene = scenes[activeIndex] || scenes[0] || null;
  const selectedSequenceNumber = activeIndex + 1;
  const canDrag = Boolean(onReorderShots) && !disabled;
  const startDrag = (event, index) => {
    if (!canDrag) return;
    setDraggingIndex(index);
    setDragOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };
  const dropShot = (event, index) => {
    if (!canDrag) return;
    event.preventDefault();
    const from = draggingIndex ?? Number(event.dataTransfer.getData("text/plain"));
    setDraggingIndex(null);
    setDragOverIndex(null);
    onReorderShots?.(from, index);
  };
  const endDrag = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };
  const submitInsertShot = () => {
    if (!selectedScene) return;
    onInsertShot?.(selectedScene);
  };
  if (collapsed) {
    return (
      <section className="creator-panel flex min-h-[4.25rem] flex-row items-center gap-3 p-2 xl:sticky xl:top-4 xl:min-h-[32rem] xl:flex-col">
        <button
          type="button"
          onClick={onToggle}
          title="Expand storyboard reference"
          aria-label="Expand storyboard reference"
          className="creator-control grid h-10 w-10 place-items-center p-0 text-slate-200"
        >
          <ChevronRight size={16} />
        </button>
        <div className="h-10 w-px bg-white/10 xl:h-px xl:w-full" />
        <div className="custom-scrollbar flex w-full flex-1 gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-x-hidden xl:overflow-y-auto xl:pb-0 xl:pr-1">
          {scenes.map((scene, index) => {
            const shotImageUrl = postProductionShotThumbnailUrl(scene);
            const active = index === activeIndex;
            return (
              <button
                key={scene.id || scene.sceneId || `post-shot-rail-${index}`}
                type="button"
                draggable={canDrag}
                onDragStart={(event) => startDrag(event, index)}
                onDragOver={(event) => {
                  if (!canDrag) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverIndex(index);
                }}
                onDrop={(event) => dropShot(event, index)}
                onDragEnd={endDrag}
                onClick={() => onSelect?.(index)}
                title={`Open ${scene.title || `Shot ${index + 1}`}`}
                className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border text-[10px] font-black transition ${
                  active
                    ? "border-emerald-300/50 bg-emerald-300/[0.12] text-white"
                    : dragOverIndex === index
                      ? "border-cyan-300/50 bg-cyan-300/[0.1] text-white"
                      : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-emerald-300/25 hover:text-slate-200"
                }`}
              >
                {shotImageUrl ? (
                  <span className="relative h-full w-full">
                    <img src={shotImageUrl} alt="" className="h-full w-full object-cover opacity-75" loading="lazy" />
                    <span className="absolute inset-0 grid place-items-center bg-black/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="creator-panel p-3 xl:sticky xl:top-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-emerald-200">Shot Navigator</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            Sequence {String(selectedSequenceNumber).padStart(2, "0")} selected
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/[0.045] px-2 py-1 text-[10px] font-black uppercase tracking-normal text-slate-300">
            {scenes.length || 0} shots
          </span>
          <button
            type="button"
            onClick={onToggle}
            title="Collapse storyboard reference"
            aria-label="Collapse storyboard reference"
            className="creator-control grid h-8 w-8 place-items-center p-0 text-slate-300"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar max-h-[32rem] space-y-2 overflow-y-auto pr-1">
        {scenes.map((scene, index) => {
          const shotImageUrl = postProductionShotThumbnailUrl(scene);
          const active = index === activeIndex;
          return (
            <div
              key={scene.id || scene.sceneId || `post-shot-${index}`}
              draggable={canDrag}
              onDragStart={(event) => startDrag(event, index)}
              onDragOver={(event) => {
                if (!canDrag) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverIndex(index);
              }}
              onDrop={(event) => dropShot(event, index)}
              onDragEnd={endDrag}
              className={`group flex w-full items-center gap-2 rounded-lg border p-2 transition ${
                active
                  ? "border-emerald-300/40 bg-emerald-400/[0.08]"
                  : dragOverIndex === index
                    ? "border-cyan-300/45 bg-cyan-400/[0.08]"
                    : "border-white/10 bg-white/[0.025] hover:border-emerald-300/25 hover:bg-white/[0.055]"
              }`}
            >
              <span
                className={`grid h-8 w-5 shrink-0 place-items-center rounded text-slate-500 ${canDrag ? "cursor-grab active:cursor-grabbing group-hover:text-slate-300" : ""}`}
                title={canDrag ? "Drag to reorder" : "Reorder disabled while processing"}
              >
                <GripVertical size={14} />
              </span>
              <button
                type="button"
                onClick={() => onSelect?.(index)}
                title={`Open ${scene.title || `Shot ${index + 1}`}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none"
              >
              <span className="grid h-16 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-black/40">
                {shotImageUrl ? (
                  <img src={shotImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <ImageIcon size={14} className="text-slate-600" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-black uppercase tracking-normal text-slate-500">
                  Sequence {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-0.5 line-clamp-2 text-xs font-bold leading-5 text-slate-200">{scene.title || scene.description || `Shot ${index + 1}`}</span>
                {active && (
                  <span className="mt-1 inline-flex rounded bg-emerald-300/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-normal text-emerald-100">
                    Open
                  </span>
                )}
              </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-2">
        <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
          Add after Sequence {String(selectedSequenceNumber).padStart(2, "0")}
        </p>
        <button
          type="button"
          disabled={disabled || !selectedScene}
          onClick={submitInsertShot}
          className="creator-control mt-2 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
          title="Add an empty shot slot after the selected shot."
        >
          <Plus size={13} /> Add Empty Shot
        </button>
      </div>
    </section>
  );
}

function PostProductionShotThumb({ shot = {} }) {
  const shotImageUrl = postProductionShotThumbnailUrl(shot);
  if (shotImageUrl) {
    return <img src={shotImageUrl} alt="" className="h-36 w-full bg-black object-cover" loading="lazy" />;
  }
  return (
    <span className="grid h-36 w-full place-items-center bg-black/40 text-center text-xs font-bold text-slate-500">
      <span>
        <ImageIcon size={22} className="mx-auto mb-2 text-slate-600" />
        Shot thumbnail
      </span>
    </span>
  );
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

function queryErrorStatus(error) {
  const raw = error?.status ?? error?.originalStatus ?? error?.data?.status ?? error?.data?.statusCode;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
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
    storytellingType: payload.storyScriptJson?.storytellingType || selectedIdea.storytellingType || selectedIdea.selectionContext?.storyScript?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: payload.storyScriptJson?.storytellingGuidance || selectedIdea.storytellingGuidance || selectedIdea.selectionContext?.storyScript?.storytellingGuidance || {},
    hookLens: payload.storyScriptJson?.hookLens || selectedIdea.hookLens || selectedIdea.selectionContext?.storyScript?.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: payload.storyScriptJson?.hookLensGuidance || selectedIdea.hookLensGuidance || selectedIdea.selectionContext?.storyScript?.hookLensGuidance || {},
    hookBridge: payload.storyScriptJson?.hookBridge || selectedIdea.hookBridge || selectedIdea.selectionContext?.storyScript?.hookBridge || {},
    factualityNotes: payload.storyScriptJson?.factualityNotes || selectedIdea.factualityNotes || selectedIdea.selectionContext?.storyScript?.factualityNotes || {},
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
    storytellingType: scriptJson.storytellingType || selectedIdea.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: scriptJson.storytellingGuidance || selectedIdea.storytellingGuidance || {},
    hookLens: scriptJson.hookLens || selectedIdea.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: scriptJson.hookLensGuidance || selectedIdea.hookLensGuidance || {},
    hookBridge: scriptJson.hookBridge || selectedIdea.hookBridge || {},
    factualityNotes: scriptJson.factualityNotes || selectedIdea.factualityNotes || {},
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

function normalizePostProductionProject(project = {}) {
  const projectId = project.projectId || project.project_id || project.id || "";
  const scriptId = project.scriptId || project.script_id || project.screenplayId || project.screenplay_id || "";
  const rawShots = firstArray(project.shots, project.scenes, project.storyboardScenes, project.storyboard_scenes);
  const shots = rawShots.map(normalizePostProductionShot).filter((shot) => shot.shotNumber);
  const title = firstText(project.title, project.projectTitle, project.project_title, project.name, "Creator project");
  const shotCount = Number(project.shotCount || project.shot_count || shots.length || 0);
  const updatedAt = project.updatedAt || project.updated_at || project.createdAt || project.created_at;
  const rawProject = buildRawPostProductionProject({
    ...project,
    projectId,
    scriptId,
    title,
    shots,
    shotCount,
    updatedAt,
  });

  return {
    ...project,
    id: `post-production-${projectId || scriptId || title}`,
    projectId,
    scriptId,
    title,
    lockedIdeaTitle: `${shotCount || shots.length || "Shot"} shots ready for polish`,
    status: project.status || "SHOT_DESIGN_READY",
    durationSeconds: project.durationSeconds || project.duration_seconds,
    time: updatedAt ? formatJobTime(updatedAt) : "",
    stage: {
      label: "Open Polish",
      description: `${shotCount || shots.length || 0} storyboard shots are ready for recording and polishing.`,
      actionLabel: "Open",
      progressText: `${shotCount || shots.length || 0} shots`,
      steps: [],
    },
    rawProject,
    restored: buildWorkflowStateFromProject(rawProject),
    postProductionShots: shots,
    postProductionApi: true,
    shotDesignReady: shots.length > 0,
  };
}

function normalizePostProductionShot(shot = {}, index = 0) {
  const shotNumber = Number(shot.shotNumber || shot.shot_number || index + 1);
  const storyboardTag = firstObject(shot.storyboardTag, shot.storyboard_tag) || {};
  const lightingBuildSheetTag = firstObject(shot.lightingBuildSheetTag, shot.lighting_build_sheet_tag) || {};
  const cameraPlanSheetTag = firstObject(shot.cameraPlanSheetTag, shot.camera_plan_sheet_tag) || {};
  const shotPayload = firstObject(shot.shotPayload, shot.shot_payload, shot.payload) || {};
  const merged = {
    ...shotPayload,
    ...shot,
    shotNumber,
    storyboardTag,
    lightingBuildSheetTag,
    cameraPlanSheetTag,
  };
  const imageFields = normalizeShotDesignThumbnailFields(merged);
  const title = firstText(
    shot.title,
    shot.shotTitle,
    shot.shot_title,
    storyboardTag.shotTitle,
    cameraPlanSheetTag.shotTitle,
    shotPayload.title,
    `Shot ${shotNumber}`
  );

  return {
    ...merged,
    id: shot.id || shot.sceneId || shot.scene_id || `shot-${shotNumber}`,
    sceneId: shot.sceneId || shot.scene_id || shot.id || `shot-${shotNumber}`,
    shotNumber,
    title,
    timestamp: shot.timestamp || buildTimestamp(shot.startTime || shot.start_time, shot.endTime || shot.end_time),
    camera: firstText(shot.camera, shot.cameraAngle, shot.camera_angle, storyboardTag.cameraAngle, cameraPlanSheetTag.cameraAngle, shot.shotType, shot.shot_type),
    visual: firstText(shot.visual, shot.description, storyboardTag.narrativeBeatSummary, storyboardTag.action, shotPayload.visual, shotPayload.action),
    storyboardTag,
    lightingBuildSheetTag,
    cameraPlanSheetTag,
    shotPayload,
    shotDesignImageUrl: imageFields.storyboardImageUrl,
    storyboardImageUrl: imageFields.storyboardImageUrl,
    lightingImageUrl: imageFields.lightingImageUrl,
    cameraPlanImageUrl: imageFields.cameraPlanImageUrl,
  };
}

function buildRawPostProductionProject(project = {}) {
  const shots = firstArray(project.shots);
  const productionPlanTags = shots.map((shot, index) => ({
    shotNumber: shot.shotNumber || index + 1,
    title: shot.title || `Shot ${index + 1}`,
    storyboardTag: shot.storyboardTag || {},
    lightingBuildSheetTag: shot.lightingBuildSheetTag || {},
    cameraPlanSheetTag: shot.cameraPlanSheetTag || {},
    sourceScene: shot,
  }));
  return {
    ...project,
    projectId: project.projectId,
    id: project.projectId,
    title: project.title,
    updatedAt: project.updatedAt,
    productionPlanTags,
    script: {
      id: project.scriptId,
      scriptId: project.scriptId,
      projectId: project.projectId,
      title: project.title,
      durationSeconds: project.durationSeconds,
      screenType: project.screenType || project.screen_type,
      scriptJson: {
        projectTitle: project.title,
        duration: project.durationSeconds,
        screenType: project.screenType || project.screen_type,
        shots,
      },
      shots,
      scenes: shots,
      productionPlanTags,
      status: "SHOT_DESIGN_READY",
    },
    storyboard: {
      id: project.storyboardId || project.storyboard_id || project.projectId,
      storyboardId: project.storyboardId || project.storyboard_id || project.projectId,
      projectId: project.projectId,
      title: project.title,
      totalShots: shots.length,
      scenes: shots,
      productionPlanTags,
    },
  };
}

function buildPostProductionShotsFromRestored(restored = {}) {
  const storyboardScenes = Array.isArray(restored?.storyboard?.scenes) ? restored.storyboard.scenes : [];
  const screenplayScenes = firstArray(
    restored?.scriptDetailIdea?.scriptScenes,
    restored?.scriptDetailIdea?.scriptJson?.shots,
    restored?.scriptDetailIdea?.scenes
  );
  const productionPlans = Array.isArray(restored?.scriptDetailIdea?.productionPlanTags)
    ? restored.scriptDetailIdea.productionPlanTags
    : [];
  const mergedScreenplayScenes = screenplayScenes.length
    ? mergeScreenplayScenesWithProductionPlans(screenplayScenes, productionPlans)
    : [];
  const sourceScenes = storyboardScenes.length
    ? storyboardScenes
    : mergedScreenplayScenes.length
      ? mergedScreenplayScenes
      : productionPlans.map((plan, index) => ({
          ...plan,
          shotNumber: plan.shotNumber || plan.storyboardTag?.shotNumber || index + 1,
          title: plan.title || plan.storyboardTag?.shotTitle || plan.cameraPlanSheetTag?.shotTitle || `Shot ${index + 1}`,
          description: plan.description || plan.storyboardTag?.narrativeBeatSummary || plan.storyboardTag?.action || "",
        }));

  return sourceScenes
    .map((scene, index) => {
      const imageFields = normalizeShotDesignThumbnailFields(scene);
      return {
        ...scene,
        shotNumber: Number(scene.shotNumber || scene.shot_number || index + 1),
        title: scene.title || scene.shotTitle || scene.storyboardTag?.shotTitle || `Shot ${index + 1}`,
        shotDesignImageUrl: imageFields.storyboardImageUrl,
        storyboardImageUrl: imageFields.storyboardImageUrl,
        lightingImageUrl: imageFields.lightingImageUrl,
        cameraPlanImageUrl: imageFields.cameraPlanImageUrl,
      };
    })
    .filter((shot) => shot.shotNumber);
}

function projectResumeStage(restored, project = {}) {
  const steps = [
    { id: "ideas", label: "Idea", fullLabel: "Idea selected" },
    { id: "script", label: "Story", fullLabel: "Storyline ready" },
    { id: "cast", label: "Actor", fullLabel: "Actors mapped" },
    { id: "screenplay", label: "Script", fullLabel: "Script ready" },
    { id: "storyboard", label: "Shot Design", fullLabel: "Shot design ready" },
    { id: "shoot-polish", label: "Polish", fullLabel: "Recorded takes ready" },
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
    storyboard: "Shot Design",
    "shoot-polish": "Polish",
  }[pageId] || "Workflow";
}

function sectionForWorkspacePage(pageId) {
  if (pageId === "storyboard") return "storyboard";
  if (pageId === "shoot-polish") return "shoot-polish";
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
