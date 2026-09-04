// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTenantId,
  setTenantIdentity,
  showFlash,
  useAddWalletBalanceMutation,
  useGetWalletBalanceQuery,
  useVerifyWalletPaymentMutation,
} from "@dalaillama/shared-store";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clapperboard, Download, FolderOpen, GripVertical, HelpCircle, History, Image as ImageIcon, ListChecks, Loader2, LockKeyhole, MessageSquareText, Plus, RefreshCw, Sparkles, WalletCards, X } from "lucide-react";
import {
  useConfirmAudienceMutation,
  useCreateCreatorMutation,
  useGenerateIdeasMutation,
  useGenerateLockedIdeaOptionsAsyncMutation,
  useGenerateLockedIdeaOptionsMutation,
  useGenerateStoryIdeaScriptMutation,
  useRunGraphPipelineMutation,
  useGenerateStoryIdeaScreenplayAsyncMutation,
  useGetAiProvidersQuery,
  useGetCreatorProviderCreditsQuery,
  useGetCharacterCastMappingsQuery,
  useGetCreatorCategoriesQuery,
  useGetCreatorPlatformsQuery,
  useGetCreatorProjectsQuery,
  useLazyGetCreatorProjectQuery,
  useGetPostProductionProjectsQuery,
  useGetPreProductionProjectQuery,
  useAdvanceProjectStatusMutation,
  useGetProjectSpendQuery,
  useCreateFinalRenderMutation,
  useGetLatestFinalRenderQuery,
  useUpdateFinalVideoLockMutation,
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
  useLockIdeaSelectionMutation,
  useGenerateStoryboardFromScriptMutation,
  useGenerateStoryboardFromScriptAsyncMutation,
  useGenerateProductionPlansAsyncMutation,
  useGenerateShotImageMutation,
  useAnalyzeShotProductReferenceMutation,
  useConfirmShotProductReferenceMutation,
  useEditStoryboardShotWithAiMutation,
  useInsertStoryboardTimelineShotMutation,
  useGetProductionPlansQuery,
  useGetStoryboardClientReviewQuery,
  useSaveStoryboardClientReviewMutation,
  useChatStoryboardClientReviewMutation,
  useEmbedOfflineAnimatedStoryboardHtmlMutation,
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
  useGetCreatorStorylineHistoryQuery,
  useGetCreatorScriptHistoryQuery,
  useLazyGetCreatorStorylineHistoryItemQuery,
  useLazyGetCreatorScriptHistoryItemQuery,
  useListCreatorsQuery,
  usePredictTrendsMutation,
  useGenerateProductAdPipelineMutation,
  useUploadProductReferenceImagesMutation,
  useRefreshWeeklyIdeaTagsMutation,
  useSaveStoryIdeaMutation,
  useSaveStoryIdeaScriptMutation,
  useSaveGeneratedScriptMutation,
  useSaveCharacterCastMappingsMutation,
  useGenerateStoryIdeaScreenplayMutation,
  useSaveStoryboardMutation,
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
  useUploadScreenplaySceneReferenceImageMutation,
  useUploadScreenplaySceneProductionImageMutation,
  useGenerateScreenplayVideoSceneAsyncMutation,
  useRegenerateScreenplayVideoSceneAsyncMutation,
  useRenderScreenplayVideoFinalAsyncMutation,
  useGenerateScreenplayVideoAudioPackAsyncMutation,
  useSubmitHumanWorkOrderMutation,
  useGetHumanWorkOrdersQuery,
  useRequestHumanWorkOrderChangesMutation,
  useApproveHumanWorkOrderMutation,
  useSetupOrganizationMutation,
  useSuggestAudienceMutation,
  useSuggestCampaignAnglesMutation,
  useSelectLockedCampaignAngleMutation,
  useUpdateCreatorMutation,
  useUploadActorReferenceImageMutation,
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
import GraphPipelineTracePanel from "../components/creator/GraphPipelineTracePanel.jsx";
import IdeaCandidatesPanel from "../components/ideas/IdeaCandidatesPanel.jsx";
import StoryScriptPanel from "../components/ideas/StoryScriptPanel.jsx";
import ScriptReviewPanel from "../components/ideas/ScriptReviewPanel.jsx";
import ScriptGenerationModal from "../components/ideas/ScriptGenerationModal.jsx";
import StoryboardGrid from "../components/storyboard/StoryboardGrid.jsx";
import ShotTakePanel from "../components/storyboard/ShotTakePanel.jsx";
import StoryboardHistoryPanel from "../components/storyboard/StoryboardHistoryPanel.jsx";
import ProductionPlanPanel from "../components/storyboard/ProductionPlanPanel.jsx";
import ClientReviewPanel from "../components/storyboard/ClientReviewPanel.jsx";
import WorkspaceChatPanel from "../components/storyboard/WorkspaceChatPanel.jsx";
import ScreenplayVideoGenerationPanel, { isReadyStatus } from "../components/storyboard/ScreenplayVideoGenerationPanel.jsx";
import ScenePreparationPanel from "../components/storyboard/ScenePreparationPanel.jsx";
import MobileFrame from "../components/preview/MobileFrame.jsx";
import GenerationStatusBar from "../components/jobs/GenerationStatusBar.jsx";
import OrganizationSetupCard from "../components/billing/OrganizationSetupCard.jsx";
import RechargeWalletModal from "../components/billing/RechargeWalletModal.jsx";
import WalletBalanceButton from "../components/billing/WalletBalanceButton.jsx";
import { animatedStoryboardFileName, buildAnimatedStoryboardHtml, embedAndWatermarkImages } from "../utils/storyboardAnimatedExport.js";

const MINIMUM_PAID_GENERATION_WALLET_BALANCE = 100;
const AI_SHORT_STARTER_PRICE_INR = 5999;
const SCREENPLAY_REVIEW_PRICE_INR = 999;
const USD_INR_RATE = 95;
const MEDIA_URL_RENEWAL_INTERVAL_MS = 6 * 60 * 60 * 1000;
const CLIENT_REVIEW_DIALOGUE_FIELDS = [
  "dialogue",
  "primaryDialogue",
  "voiceOver",
  "voiceover",
  "dialogueScript",
  "exactDialogue",
  "spokenDialogue",
  "spokenText",
  "caption",
  "captionText",
  "subtitle",
  "subtitles",
];

const countryOptions = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AE", label: "UAE" },
  { code: "SG", label: "Singapore" },
];

const REGION_CURRENCY = {
  IN: { currency: "INR", label: "India" },
  US: { currency: "USD", label: "United States" },
  GB: { currency: "GBP", label: "United Kingdom" },
  AE: { currency: "AED", label: "UAE" },
  SG: { currency: "SGD", label: "Singapore" },
};

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

const RAZORPAY_CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayCheckoutScriptPromise = null;

function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayCheckoutScriptPromise) return razorpayCheckoutScriptPromise;

  razorpayCheckoutScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });

  return razorpayCheckoutScriptPromise;
}

function orderCheckoutDetails(order = {}) {
  return order.checkoutDetails || order.checkout_details || order.checkout || {};
}

function paymentOrderId(order = {}) {
  const checkout = orderCheckoutDetails(order);
  return firstText(
    checkout.order_id,
    checkout.orderId,
    checkout.gatewayOrderId,
    checkout.gateway_order_id,
    order.order_id,
    order.orderId,
    order.gatewayOrderId,
    order.gateway_order_id
  );
}

function paymentKeyId(order = {}) {
  const checkout = orderCheckoutDetails(order);
  return firstText(
    checkout.key,
    checkout.keyId,
    checkout.key_id,
    order.key,
    order.keyId,
    order.key_id,
    import.meta.env?.VITE_RAZORPAY_KEY_ID
  );
}

function paymentAmountPaise(order = {}, requestedAmount) {
  const checkout = orderCheckoutDetails(order);
  const amountPaise = Number(
    checkout.amount
    ?? checkout.amountPaise
    ?? checkout.amount_paise
    ?? order.amountPaise
    ?? order.amount_paise
    ?? order.amountInPaise
    ?? order.amount_in_paise
  );
  if (Number.isFinite(amountPaise) && amountPaise >= 100) return Math.round(amountPaise);
  const amount = Number(order.amount ?? checkout.amountMajor ?? checkout.amount_major ?? requestedAmount);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function normalizeCurrencyCode(value = "INR") {
  const currency = String(value || "INR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "INR";
}

function normalizeRegionCode(value = "") {
  const region = String(value || "").trim().toUpperCase();
  if (REGION_CURRENCY[region]) return region;
  return "";
}

function detectBrowserRegionCode() {
  if (typeof window === "undefined") return "IN";
  try {
    const locale = window.navigator?.language || window.navigator?.languages?.[0] || "";
    const localeRegion = typeof Intl.Locale === "function" && locale ? new Intl.Locale(locale).region : "";
    const normalizedLocaleRegion = normalizeRegionCode(localeRegion);
    if (normalizedLocaleRegion) return normalizedLocaleRegion;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/kolkata|calcutta/i.test(timezone)) return "IN";
    if (/dubai/i.test(timezone)) return "AE";
    if (/london/i.test(timezone)) return "GB";
    if (/singapore/i.test(timezone)) return "SG";
    if (/america\//i.test(timezone)) return "US";
  } catch {
    // Default below keeps billing usable if browser locale APIs are unavailable.
  }
  return "IN";
}

function currencyForRegion(regionCode = "IN") {
  return REGION_CURRENCY[normalizeRegionCode(regionCode)]?.currency || "INR";
}

function labelForRegion(regionCode = "IN") {
  return REGION_CURRENCY[normalizeRegionCode(regionCode)]?.label || "India";
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

const TREND_DISCOVERY_ENABLED = true;
const DEFAULT_STORYTELLING_TYPE = "narrator_visual_mix";
const DEFAULT_HOOK_LENS = "direct";
const DEFAULT_TOPIC_TYPE = "lifestyle";
const DEFAULT_PRODUCTION_STYLE = "hybrid";
const DEFAULT_HYBRID_SCENE_MODE = "ask_speaking_scenes";
const DEFAULT_BROLL_STYLE = "cinematic_social";
const DEFAULT_CAPTION_STYLE = "bold_keyword";
const DEFAULT_VIDEO_FINISHING_PLAN = {
  backgroundMusicMode: "auto",
  backgroundMusicPrompt: "",
  musicVolume: 22,
  ambiencePrompt: "",
  soundFxPrompt: "",
  voiceMixMode: "balanced",
  useStoryboardReferences: true,
  imageLedAdMode: false,
  referenceImageMode: "prompt_only",
  requireImageAnchors: false,
  productMotionPrompt: "",
  voiceDialoguePrompt: "",
  editingPlanPrompt: "",
  burnCaptions: true,
  useMixedAudio: true,
};
const DEFAULT_AUDIO_MIX_STANDARDS = {
  dialogueLevel: "consistent_speech_first",
  backgroundMusicDucking: "duck_under_speech",
  ambientRoomTone: "maintain_low_scene_matched_room_tone",
  soundEffectsUse: "small_sfx_sparingly_for_whooshes_clicks_transitions",
  reverbMatch: "match_scene_space_and_camera_distance",
  fades: "smooth_fades_between_audio_segments",
  dialogueTargetDb: -3,
  musicBedDb: -18,
  ambienceBedDb: -22,
  sfxPeakDb: -9,
  fadeMs: 120,
};

const TOPIC_TYPE_OPTIONS = [
  {
    value: "education",
    label: "Education",
    hint: "Explain, teach, compare",
    angles: [
      ["Beginner explainer", "Turn the topic into a clear first-step lesson with one visual example."],
      ["Myth correction", "Open with a common belief, then correct it through a short story."],
      ["3-part framework", "Package the idea as three memorable steps viewers can save."],
    ],
  },
  {
    value: "technology",
    label: "Technology",
    hint: "AI, tools, workflows",
    angles: [
      ["Tool before-after", "Show the old workflow, the new tool moment, and the time saved."],
      ["Human problem first", "Start with the daily frustration before revealing the tech fix."],
      ["Tiny automation", "Make one small automation feel practical enough to try today."],
    ],
  },
  {
    value: "business",
    label: "Business",
    hint: "Brand, startup, sales",
    angles: [
      ["Founder mistake", "Frame the story around one avoidable mistake and the sharper alternative."],
      ["Customer moment", "Show the customer pain first, then the offer as the natural answer."],
      ["Proof beat", "Use a fast proof point, result, or contrast to make the idea credible."],
    ],
  },
  {
    value: "product",
    label: "Product",
    hint: "Demo, use case, offer",
    angles: [
      ["Problem demo", "Open with the messy problem and let the product cleanly solve it."],
      ["One feature story", "Make one feature the hero instead of listing everything."],
      ["Unexpected use", "Show a surprising use case that makes the product feel memorable."],
    ],
  },
  {
    value: "health",
    label: "Health",
    hint: "Wellness, habits, care",
    angles: [
      ["Tiny habit", "Show one small habit shift with a realistic emotional payoff."],
      ["Confusion to clarity", "Start with overwhelm, then make the next action feel simple."],
      ["Routine reset", "Turn the topic into a morning, evening, or recovery routine beat."],
    ],
  },
  {
    value: "fitness",
    label: "Fitness",
    hint: "Gym, body, movement",
    angles: [
      ["Beginner courage", "Follow the moment before starting, then make one small win visible."],
      ["Form fix", "Show the mistake, the correction, and the immediate confidence shift."],
      ["Challenge timer", "Turn the idea into a quick timed challenge with a visible result."],
    ],
  },
  {
    value: "food",
    label: "Food",
    hint: "Recipe, meal, kitchen",
    angles: [
      ["Saveable recipe", "Build the short around ingredients, quick steps, and a final reveal."],
      ["Kitchen shortcut", "Show one practical shortcut that solves a familiar meal problem."],
      ["Taste reaction", "Let the payoff land through a reaction instead of explanation."],
    ],
  },
  {
    value: "beauty",
    label: "Beauty",
    hint: "Skin, makeup, style",
    angles: [
      ["Routine reveal", "Show a simple routine with a visible before and after beat."],
      ["Product-light fix", "Make the story about technique or habit, not only products."],
      ["Mirror moment", "Use a self-confidence moment as the emotional close."],
    ],
  },
  {
    value: "travel",
    label: "Travel",
    hint: "Places, itineraries",
    angles: [
      ["Hidden spot", "Open on the unexpected place, then reveal why it is worth saving."],
      ["Mistake to itinerary", "Turn a common travel mistake into a cleaner route or checklist."],
      ["Budget contrast", "Compare the expensive version with a smarter local alternative."],
    ],
  },
  {
    value: "finance",
    label: "Finance",
    hint: "Money, career, saving",
    angles: [
      ["Small money move", "Make one financial action feel doable and non-intimidating."],
      ["Bad advice flip", "Start with common advice, then show the missing nuance."],
      ["Future-self payoff", "Connect today's tiny decision to a believable future benefit."],
    ],
  },
  {
    value: "relationships",
    label: "Relationships",
    hint: "Family, couples, friends",
    angles: [
      ["Two-person tension", "Use a small disagreement to create a natural emotional hook."],
      ["Unsaid feeling", "Let the story hinge on what one person is not saying yet."],
      ["Relatable punchline", "Close with a line viewers would send to someone they know."],
    ],
  },
  {
    value: "comedy",
    label: "Comedy",
    hint: "POV, skit, satire",
    angles: [
      ["POV escalation", "Start with a tiny absurd truth and escalate it in three beats."],
      ["Character contrast", "Let two different personalities collide around the same topic."],
      ["Expectation flip", "Set up the obvious ending, then land the opposite."],
    ],
  },
  {
    value: "culture",
    label: "Culture",
    hint: "Society, identity, place",
    angles: [
      ["Then versus now", "Use a cultural contrast to make the topic instantly recognizable."],
      ["Local detail", "Ground the story in one specific detail only insiders notice."],
      ["Shared memory", "Build toward a nostalgic or familiar emotional beat."],
    ],
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
    hint: "Daily life, habits, POV",
    angles: [
      ["Day-in-life shift", "Show one daily moment changing from messy to intentional."],
      ["Relatable confession", "Open with an honest admission, then resolve it practically."],
      ["Small upgrade", "Make one tiny upgrade feel worth copying."],
    ],
  },
];

const PRODUCTION_STYLE_OPTIONS = [
  {
    value: "hybrid",
    label: "Hybrid",
    hint: "Talking head + AI scenes",
    aiScenePercent: 55,
    talkingHeadPercent: 45,
  },
  {
    value: "full_ai",
    label: "Full AI",
    hint: "All scenes generated",
    aiScenePercent: 100,
    talkingHeadPercent: 0,
  },
];

const HYBRID_SCENE_MODE_OPTIONS = [
  {
    value: "full_founder",
    label: "Full Founder (60 sec)",
    hint: "Use the uploaded founder in every scene",
  },
  {
    value: "ask_speaking_scenes",
    label: "Ask on speaking scenes",
    hint: "Choose Human or AI where a person speaks",
  },
  {
    value: "auto_mix",
    label: "Auto mix",
    hint: "Let backend decide human vs AI scene",
  },
  {
    value: "human_first",
    label: "Human first",
    hint: "Prefer talking head for dialogue moments",
  },
  {
    value: "ai_first",
    label: "AI first",
    hint: "Prefer AI scenes unless human is needed",
  },
];

const BROLL_STYLE_OPTIONS = [
  { value: "cinematic_social", label: "Cinematic Social", hint: "Polished motion B-roll with creator-safe framing" },
  { value: "ugc_real", label: "UGC Real", hint: "Phone-shot, natural, believable inserts" },
  { value: "kinetic_product", label: "Kinetic Product", hint: "Fast macro details, transitions, and proof shots" },
  { value: "documentary_clean", label: "Documentary Clean", hint: "Grounded context, soft motion, real-world texture" },
  { value: "surreal_ai", label: "Stylized AI", hint: "Expressive metaphor shots and generated visual moments" },
];

const CAPTION_STYLE_OPTIONS = [
  { value: "bold_keyword", label: "Bold Keywords", hint: "Large captions with highlighted words" },
  { value: "karaoke_pop", label: "Karaoke Pop", hint: "Word-by-word animated captions" },
  { value: "clean_subtitle", label: "Clean Subtitle", hint: "Minimal readable lower captions" },
  { value: "creator_meme", label: "Creator Meme", hint: "Punchy top/bottom caption beats" },
  { value: "none", label: "No Captions", hint: "Use only visuals and spoken audio" },
];

const workflowSlides = [
  { id: "ideas", label: "New Ideas", caption: "Write a topic and pick one of the generated angles" },
  { id: "script", label: "Storyline", caption: "Shape the story, characters, personas, and backstories" },
  { id: "cast", label: "Cast", caption: "Add actors and map them to story characters" },
  { id: "screenplay", label: "Screenplay", caption: "Convert the locked story and cast into shot-wise pages" },
];

const workflowStepIds = new Set(workflowSlides.map((slide) => slide.id));
const workspacePageIds = new Set(["ideas", "generated-ideas", "script", "screenplay", "cast", "video", "storyboard", "client-review"]);
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
const PRODUCT_AD_BRIEF_MODE = "product_ad_agent";
const DEFAULT_PRODUCT_AD_BRIEF = {
  productInput: "",
  imageUrlsText: "",
  imageUrls: [],
  sourceProductImageUrls: [],
  imageAssets: [],
  ingredientDetails: "",
  targetAudience: "",
  campaignObjective: "",
  adFormat: "product_showcase",
  selectedShotTypes: [],
  shotRecipeSource: "auto_product",
  noHumans: false,
};
const PRODUCT_AD_FORMAT_OPTIONS = [
  { value: "product_showcase", label: "Product Showcase", description: "A clear product-first commercial that makes the offer easy to understand." },
  { value: "problem_solution", label: "Problem -> Solution", description: "Open on a relatable problem, demonstrate the answer, then close with a clear CTA." },
  { value: "lifestyle", label: "Lifestyle", description: "Show how the product fits naturally into a customer’s day." },
  { value: "storytelling", label: "Storytelling", description: "Build a short narrative around a moment, need, or payoff." },
  { value: "demonstration", label: "Demonstration", description: "Show the product working, step by step, with proof beats." },
  { value: "feature_highlight", label: "Feature Highlight", description: "Make one or two differentiating features memorable." },
  { value: "comparison", label: "Comparison", description: "Contrast a current friction point with the better product choice." },
  { value: "explainer", label: "Explainer", description: "Make a new product or benefit simple in a short, visual sequence." },
  { value: "testimonial_ugc", label: "Testimonial / UGC", description: "Use an authentic social-first recommendation or proof moment." },
  { value: "emotional_brand_film", label: "Emotional Brand Film", description: "Lead with feeling, identity, and a memorable brand payoff." },
  { value: "promotional_offer", label: "Promotional / Offer", description: "Prioritize the offer, urgency, product proof, and CTA." },
  { value: "luxury_cinematic", label: "Luxury Cinematic", description: "Use premium composition, texture, controlled movement, and restraint." },
  { value: "motion_graphics", label: "Motion Graphics", description: "Use product visuals with clear graphic explanations and text moments." },
  { value: "documentary_bts", label: "Documentary / Behind the Scenes", description: "Show process, craft, origin, or proof in a grounded style." },
  { value: "announcement_launch", label: "Announcement / Launch", description: "Introduce a new product, feature, event, or release with momentum." },
];
const PRODUCT_AD_FORMAT_PLAYBOOKS = {
  product_showcase: {
    shotTypes: ["hero_shot", "beauty_shot", "macro_shot", "texture_shot", "pack_shot"],
    structure: "Product reveal -> sensory proof -> key detail -> packshot CTA",
    hookStyle: "Show the product at its most desirable before explaining it.",
    retentionStyle: "Move from broad beauty to tighter proof, then reward attention with a clear finish.",
    musicStyle: "Confident modern commercial bed with a clean opening accent.",
  },
  problem_solution: {
    shotTypes: ["action_shot", "hero_shot", "cutaway_shot", "macro_shot", "pack_shot"],
    structure: "Relatable friction -> product switch -> proof -> result -> CTA",
    hookStyle: "Open on the costly, annoying, or familiar problem.",
    retentionStyle: "Contrast the before and after, escalating proof toward the payoff.",
    musicStyle: "Tension at the problem, then a brighter release when the product appears.",
  },
  lifestyle: {
    shotTypes: ["lifestyle_shot", "action_shot", "hero_shot", "beauty_shot", "pack_shot"],
    structure: "Real-life moment -> natural use -> product benefit -> routine payoff -> CTA",
    hookStyle: "Start inside a recognisable customer moment rather than a product pedestal.",
    retentionStyle: "Keep changing the everyday context while the product stays useful and believable.",
    musicStyle: "Warm, natural, lightly rhythmic music that supports the routine.",
  },
  storytelling: {
    shotTypes: ["lifestyle_shot", "action_shot", "macro_shot", "beauty_shot", "pack_shot"],
    structure: "Character moment -> tension -> product choice -> emotional payoff -> CTA",
    hookStyle: "Begin mid-moment with a human question, choice, or small tension.",
    retentionStyle: "Advance the story with a new reveal or decision in each beat.",
    musicStyle: "A small emotional arc with a gentle lift into the payoff.",
  },
  demonstration: {
    shotTypes: ["hero_shot", "action_shot", "assembly_shot", "cutaway_shot", "pack_shot"],
    structure: "Claim -> show it working -> how it works -> proof -> CTA",
    hookStyle: "Lead with the result the viewer wants to see proven.",
    retentionStyle: "Make every beat answer the next practical question about the product.",
    musicStyle: "Precise, energetic product-demo pulse with room for explanation.",
  },
  feature_highlight: {
    shotTypes: ["hero_shot", "macro_shot", "cutaway_shot", "floating_shot", "pack_shot"],
    structure: "Feature promise -> detail reveal -> mechanism -> benefit -> CTA",
    hookStyle: "Put the most differentiated feature or outcome on screen immediately.",
    retentionStyle: "Reveal one feature layer at a time, with visual evidence for each claim.",
    musicStyle: "Clean, premium tech-commercial rhythm with small feature accents.",
  },
  comparison: {
    shotTypes: ["action_shot", "hero_shot", "cutaway_shot", "macro_shot", "pack_shot"],
    structure: "Old way -> better product -> side-by-side proof -> winning result -> CTA",
    hookStyle: "Make the old choice visibly less useful before revealing the alternative.",
    retentionStyle: "Alternate contrast and evidence so the viewer keeps evaluating the difference.",
    musicStyle: "A restrained tension-to-resolution cue that makes the improvement land.",
  },
  explainer: {
    shotTypes: ["hero_shot", "assembly_shot", "cutaway_shot", "floating_shot", "pack_shot"],
    structure: "Simple question -> visual explanation -> mechanism -> benefit -> CTA",
    hookStyle: "Open with the confusing thing made simple in one visual statement.",
    retentionStyle: "Use each visual change to answer one question without overloading the frame.",
    musicStyle: "Clear, unobtrusive explanatory bed with soft transitions.",
  },
  testimonial_ugc: {
    shotTypes: ["lifestyle_shot", "action_shot", "hero_shot", "beauty_shot", "pack_shot"],
    structure: "Personal discovery -> real use -> honest proof -> recommendation -> CTA",
    hookStyle: "Start with a believable first-person reaction or outcome.",
    retentionStyle: "Use small proof details and natural reactions instead of polished claims.",
    musicStyle: "Light social rhythm, mixed below a conversational voice.",
  },
  emotional_brand_film: {
    shotTypes: ["lifestyle_shot", "beauty_shot", "macro_shot", "slow_motion_shot", "pack_shot"],
    structure: "Feeling -> sensory world -> product meaning -> emotional payoff -> CTA",
    hookStyle: "Open with a feeling or aspiration the product helps express.",
    retentionStyle: "Build sensory detail and emotional progression without rushing the product read.",
    musicStyle: "Cinematic emotional score with space, texture, and a measured resolve.",
  },
  promotional_offer: {
    shotTypes: ["hero_shot", "action_shot", "splash_shot", "beauty_shot", "pack_shot"],
    structure: "Offer hook -> product proof -> urgency -> offer lockup -> CTA",
    hookStyle: "Lead with the benefit or offer that makes action feel timely.",
    retentionStyle: "Refresh the offer with proof, visual energy, and a single readable reason to act.",
    musicStyle: "Upbeat commercial energy with crisp transitions and a firm CTA ending.",
  },
  luxury_cinematic: {
    shotTypes: ["beauty_shot", "macro_shot", "texture_shot", "ingredient_shot", "pack_shot"],
    structure: "Brand-world mystery -> artifact-like partial reveal -> texture and craft -> ingredients -> earned hero packshot -> CTA",
    hookStyle: "Use the first 2–3 seconds to establish desire, mystery, scale, and premium positioning. Do not explain ingredients or reveal the full pack.",
    retentionStyle: "Let viewers discover the product through 10–20% partial reveals, moving light, macro detail, controlled camera drift, and one distinct visual idea per shot. Treat every ad as a professional cinema production, never a rookie or casual camera setup.",
    musicStyle: "Spacious premium score with restrained percussion, tactile detail, and silence around reveal moments.",
  },
  motion_graphics: {
    shotTypes: ["hero_shot", "floating_shot", "assembly_shot", "cutaway_shot", "pack_shot"],
    structure: "Animated claim -> graphic breakdown -> benefit sequence -> CTA lockup",
    hookStyle: "Open with one bold animated product claim or transformation, not a generic title card.",
    retentionStyle: "Use purposeful kinetic typography, callouts, and transitions to reveal one idea per beat.",
    musicStyle: "Rhythmic, precise motion-design bed with cuts and text movement landing on beat.",
  },
  documentary_bts: {
    shotTypes: ["action_shot", "ingredient_shot", "macro_shot", "texture_shot", "pack_shot"],
    structure: "Origin or process -> craft proof -> close detail -> finished product -> CTA",
    hookStyle: "Start with a real process detail, maker action, or material truth.",
    retentionStyle: "Reveal the next part of the making process while building trust in the finished product.",
    musicStyle: "Grounded, tactile score with subtle natural ambience and minimal polish.",
  },
  announcement_launch: {
    shotTypes: ["hero_shot", "floating_shot", "beauty_shot", "action_shot", "pack_shot"],
    structure: "What is new -> reveal -> why it matters -> launch energy -> CTA",
    hookStyle: "Make the new thing visible in the first beat, with a clear reason it matters.",
    retentionStyle: "Escalate reveal, feature proof, and launch momentum toward the CTA.",
    musicStyle: "Forward launch cue with a reveal hit and confident close.",
  },
};
const PRODUCT_AD_SHOT_TYPE_OPTIONS = [
  { value: "hero_shot", label: "Hero Shot", description: "The product at its most attractive, usually opening or closing." },
  { value: "beauty_shot", label: "Beauty Shot", description: "Premium lighting and composition focused on the product." },
  { value: "macro_shot", label: "Macro Shot", description: "Extreme detail for texture, craftsmanship, or fine features." },
  { value: "texture_shot", label: "Texture Shot", description: "Surface, material, crispness, creaminess, or finish." },
  { value: "ingredient_shot", label: "Ingredient Shot", description: "Ingredients or components shown separately or together." },
  { value: "pour_shot", label: "Pour Shot", description: "A liquid pour over, into, or from the product." },
  { value: "splash_shot", label: "Splash Shot", description: "Dynamic liquid impact around the product." },
  { value: "slow_motion_shot", label: "Slow Motion Shot", description: "A dramatic movement or payoff in slow motion." },
  { value: "floating_shot", label: "Floating Shot", description: "Product, ingredients, or components suspended in motion." },
  { value: "explosion_shot", label: "Explosion Shot", description: "A controlled burst of ingredients or energy around the product." },
  { value: "assembly_shot", label: "Assembly Shot", description: "Components or layers coming together." },
  { value: "cutaway_shot", label: "Cutaway Shot", description: "Reveal what is inside or how the product is made." },
  { value: "action_shot", label: "Action Shot", description: "A hand or person naturally using the product." },
  { value: "pack_shot", label: "Pack Shot", description: "A clear packaging and logo view, usually near the end." },
  { value: "lifestyle_shot", label: "Lifestyle Shot", description: "The product in a believable real-world setting." },
];
const PRODUCT_AD_CONCEPT_LANES = [
  {
    key: "problem_solution",
    title: "Problem -> Solution",
    description: "Direct response concept that names the pain, shows the product solving it, and closes with purchase intent.",
  },
  {
    key: "luxury_brand_story",
    title: "Luxury Brand Story",
    description: "Premium concept built around atmosphere, packaging, sensory detail, and high-trust brand perception.",
  },
  {
    key: "ugc_testimonial",
    title: "UGC/Testimonial Style",
    description: "Social-first concept that feels like a buyer discovery, proof moment, or creator recommendation.",
  },
];

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
  const navigate = useNavigate();
  const planner = useSelector(selectCreatorPlanner);
  const preview = useSelector(selectCreatorPreview);
  const storyboardLocal = useSelector(selectCreatorStoryboardLocal);
  const reduxTenantId = sanitizeTenantId(useSelector(selectTenantId));
  const authTenantId = sanitizeTenantId(useSelector((state) => state.auth?.user?.tenantId || null));
  const tenantCompanyName = useSelector((state) => state.tenant?.companyName || state.tenant?.name || null);
  const authUserName = useSelector((state) => state.auth?.user?.name || null);
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
  const [creativeFlow, setCreativeFlow] = useState(() => storedWorkflowSnapshot?.creativeFlow === "autonomous_product_ad" ? "autonomous_product_ad" : "guided");
  const [country, setCountry] = useState(() => {
    const detectedRegion = detectBrowserRegionCode();
    return countryOptions.find((option) => option.code === detectedRegion) || countryOptions[0];
  });
  const [countryOpen, setCountryOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [postProductionOpen, setPostProductionOpen] = useState(false);
  const [scenePreparationOpen, setScenePreparationOpen] = useState(false);
  const [scenePreparationShotId, setScenePreparationShotId] = useState(null);
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
  const [clientReview, setClientReview] = useState(() => normalizeClientReview(
    storedWorkflowSnapshot?.clientReview,
    storedWorkflowSnapshot?.dialogueLanguage || "Hinglish"
  ));
  const [clientReviewDirty, setClientReviewDirty] = useState(false);
  const [reviewFrameUpdateKey, setReviewFrameUpdateKey] = useState("");
  const [screenType, setScreenType] = useState(() => storedWorkflowSnapshot?.screenType || "vertical");
  const [storytellingType, setStorytellingType] = useState(() => storedWorkflowSnapshot?.storytellingType || DEFAULT_STORYTELLING_TYPE);
  const [hookLens, setHookLens] = useState(() => storedWorkflowSnapshot?.hookLens || DEFAULT_HOOK_LENS);
  const [topicType, setTopicType] = useState(() => storedWorkflowSnapshot?.topicType || inferTopicTypeFromText(storedWorkflowSnapshot?.manualIdeaDraft, filters.category));
  const [productionStyle, setProductionStyle] = useState(() => storedWorkflowSnapshot?.productionStyle || DEFAULT_PRODUCTION_STYLE);
  const [hybridSceneMode, setHybridSceneMode] = useState(() => storedWorkflowSnapshot?.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE);
  const [brollStyle, setBrollStyle] = useState(() => storedWorkflowSnapshot?.brollStyle || DEFAULT_BROLL_STYLE);
  const [captionStyle, setCaptionStyle] = useState(() => storedWorkflowSnapshot?.captionStyle || DEFAULT_CAPTION_STYLE);
  const [videoFinishingPlan, setVideoFinishingPlan] = useState(() => normalizeVideoFinishingPlan(storedWorkflowSnapshot?.videoFinishingPlan));
  const [screenplayVideoProvider, setScreenplayVideoProvider] = useState(() => normalizeScreenplayVideoProvider(storedWorkflowSnapshot?.screenplayVideoProvider || "gemini_omni"));
  const [screenplayVideoModel, setScreenplayVideoModel] = useState(() => {
    const provider = normalizeScreenplayVideoProvider(storedWorkflowSnapshot?.screenplayVideoProvider || "gemini_omni");
    const storedModel = String(storedWorkflowSnapshot?.screenplayVideoModel || "").trim();
    return compatibleScreenplayVideoModelForProvider(provider, storedModel);
  });
  const [founderAvatarProfile, setFounderAvatarProfile] = useState(() => storedWorkflowSnapshot?.founderAvatarProfile || storedWorkflowSnapshot?.founderKit || {});
  const [selectedProviderCode, setSelectedProviderCode] = useState(() => {
    try {
      return window.localStorage.getItem("creatorAiProviderCode") || "";
    } catch {
      return "";
    }
  });
  const [manualIdeaDraft, setManualIdeaDraft] = useState(() => storedWorkflowSnapshot?.manualIdeaDraft || "");
  const [campaignAngleSuggestions, setCampaignAngleSuggestions] = useState([]);
  const [selectedCampaignAngle, setSelectedCampaignAngle] = useState(() => campaignAngleFromEntity(
    storedWorkflowSnapshot?.lockedBrief,
    storedWorkflowSnapshot?.productAdBrief
  ));
  const [productAdBrief, setProductAdBrief] = useState(() => normalizeProductAdBrief(
    storedWorkflowSnapshot?.productAdBrief
    || storedWorkflowSnapshot?.lockedBrief?.productIntelligenceBrief
    || storedWorkflowSnapshot?.lockedBrief?.selectionPayload?.productIntelligenceBrief
    || DEFAULT_PRODUCT_AD_BRIEF
  ));
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
  const [storyboardReferenceDetails, setStoryboardReferenceDetails] = useState(() => storedWorkflowSnapshot?.storyboardReferenceDetails || "");
  const [storyboardReferenceAssets, setStoryboardReferenceAssets] = useState(() => firstArray(storedWorkflowSnapshot?.storyboardReferenceAssets));
  const [storyboardEnhanceWithReference, setStoryboardEnhanceWithReference] = useState(() => Boolean(storedWorkflowSnapshot?.storyboardEnhanceWithReference));
  const [storyboardReferenceUploadError, setStoryboardReferenceUploadError] = useState("");
  const [predictionJobId, setPredictionJobId] = useState(null);
  const [localPredictedTrends, setLocalPredictedTrends] = useState([]);
  const [castPlan, setCastPlan] = useState(() => storedWorkflowSnapshot?.castPlan || null);
  const [selectedAudienceDecision, setSelectedAudienceDecision] = useState(() => storedWorkflowSnapshot?.selectedAudienceDecision || null);
  const [ideaGenerationJobId, setIdeaGenerationJobId] = useState(() => shouldRestoreStoredWorkflow ? readStoredIdeaGenerationJob()?.jobId || null : null);
  const [productAdPipelineJobId, setProductAdPipelineJobId] = useState(() => storedWorkflowSnapshot?.productAdPipelineJobId || null);
  const [screenplayJobId, setScreenplayJobId] = useState(null);
  const [screenplayApprovedForVideo, setScreenplayApprovedForVideo] = useState(() => Boolean(storedWorkflowSnapshot?.screenplayApprovedForVideo));
  const [screenplayVideoRunId, setScreenplayVideoRunId] = useState(() => storedWorkflowSnapshot?.screenplayVideoRunId || null);
  // Queue job IDs are transient. The persisted run remains the source of truth after a reload.
  const [screenplayVideoJobId, setScreenplayVideoJobId] = useState(null);
  const [screenplayVideoSceneJobId, setScreenplayVideoSceneJobId] = useState(null);
  const [screenplayVideoActiveSceneId, setScreenplayVideoActiveSceneId] = useState(null);
  const [screenplayVideoFinalJobId, setScreenplayVideoFinalJobId] = useState(() => storedWorkflowSnapshot?.screenplayVideoFinalJobId || null);
  const [screenplayVideoAudioJobId, setScreenplayVideoAudioJobId] = useState(() => storedWorkflowSnapshot?.screenplayVideoAudioJobId || null);
  const [productionPlanJobId, setProductionPlanJobId] = useState(null);
  // "Run full pipeline" (story script -> screenplay -> shot plan -> storyboard), each stage
  // running its own critic/retry loop already - see CreatorGenerationGraphOrchestratorService.
  const [pipelineJobId, setPipelineJobId] = useState(null);
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
  const [productShotImagesGenerating, setProductShotImagesGenerating] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [animatedPreviewLoading, setAnimatedPreviewLoading] = useState(false);
  const [animatedHtmlExporting, setAnimatedHtmlExporting] = useState(false);
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
  const detectedBillingRegionCode = normalizeRegionCode(firstText(
    organization?.countryCode,
    organization?.country_code,
    organization?.country,
    country?.code,
    detectBrowserRegionCode()
  )) || "IN";
  const detectedBillingRegionLabel = labelForRegion(detectedBillingRegionCode);
  const detectedBillingCurrencyCode = currencyForRegion(detectedBillingRegionCode);
  const wallet = walletFromService || walletFromProviderCredits || eventWallet || { balance: 0, currency: organization?.currency || detectedBillingCurrencyCode };
  const walletBalanceAmount = walletBalanceValue(wallet);
  const paidGenerationMinimumBalance = walletMinimumBalanceValue(wallet, MINIMUM_PAID_GENERATION_WALLET_BALANCE);
  const walletCurrencyCode = normalizeCurrencyCode(wallet?.currency || wallet?.currencyCode || organization?.currency || detectedBillingCurrencyCode);
  const creatorFlowMinimumBalance = walletMinimumBalanceForInrPrice(AI_SHORT_STARTER_PRICE_INR, walletCurrencyCode);
  const screenplayReviewMinimumBalance = walletMinimumBalanceForInrPrice(SCREENPLAY_REVIEW_PRICE_INR, walletCurrencyCode);
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
  const [suggestCampaignAngles, campaignAngleSuggestionState] = useSuggestCampaignAnglesMutation();
  const [selectLockedCampaignAngle, selectLockedCampaignAngleState] = useSelectLockedCampaignAngleMutation();
  const [confirmAudience, confirmAudienceState] = useConfirmAudienceMutation();
  const { data: creators = [] } = useListCreatorsQuery();
  const [createCreator, createCreatorState] = useCreateCreatorMutation();
  const [updateCreator, updateCreatorState] = useUpdateCreatorMutation();
  const [uploadActorReferenceImage, uploadActorReferenceImageState] = useUploadActorReferenceImageMutation();
  const [generateIdeas, ideasState] = useGenerateIdeasMutation();
  const [generateProductAdPipeline, productAdPipelineState] = useGenerateProductAdPipelineMutation();
  const [uploadProductReferenceImages, uploadProductReferenceImagesState] = useUploadProductReferenceImagesMutation();
  const [generateLockedIdeaOptions, generatedIdeaState] = useGenerateLockedIdeaOptionsMutation();
  const [generateLockedIdeaOptionsAsync, generatedIdeaAsyncState] = useGenerateLockedIdeaOptionsAsyncMutation();
  const [fetchJobStatus] = useLazyGetJobQuery();
  const [saveStoryIdea, saveStoryIdeaState] = useSaveStoryIdeaMutation();
  const [generateStoryIdeaScript, generateScriptState] = useGenerateStoryIdeaScriptMutation();
  const [runGraphPipeline, runGraphPipelineState] = useRunGraphPipelineMutation();
  const [saveStoryIdeaScript, saveStoryScriptState] = useSaveStoryIdeaScriptMutation();
  const [saveCharacterCastMappings, saveCharacterCastMappingsState] = useSaveCharacterCastMappingsMutation();
  const [generateStoryIdeaScreenplay, generateScreenplayState] = useGenerateStoryIdeaScreenplayMutation();
  const [generateStoryIdeaScreenplayAsync, generateScreenplayAsyncState] = useGenerateStoryIdeaScreenplayAsyncMutation();
  const [saveGeneratedScript, saveGeneratedScriptState] = useSaveGeneratedScriptMutation();
  const [approveScreenplay, approveScreenplayState] = useApproveScreenplayMutation();
  const [generateScreenplayVideoAsync, generateScreenplayVideoState] = useGenerateScreenplayVideoAsyncMutation();
  const [uploadScreenplayVideoReferenceImage, uploadScreenplayVideoReferenceImageState] = useUploadScreenplayVideoReferenceImageMutation();
  const [uploadScreenplayFounderAvatarSource, uploadScreenplayFounderAvatarSourceState] = useUploadScreenplayFounderAvatarSourceMutation();
  const [prepareFounderEnglishDialogue, prepareFounderEnglishDialogueState] = usePrepareFounderEnglishDialogueMutation();
  const [selectReusableFounderAvatar, selectReusableFounderAvatarState] = useSelectReusableFounderAvatarMutation();
  const [generateFounderVoicePreview, generateFounderVoicePreviewState] = useGenerateFounderVoicePreviewMutation();
  const [approveFounderVoicePreview, approveFounderVoicePreviewState] = useApproveFounderVoicePreviewMutation();
  const [generateFounderAvatarPreview, generateFounderAvatarPreviewState] = useGenerateFounderAvatarPreviewMutation();
  const [approveFounderAvatarPreview, approveFounderAvatarPreviewState] = useApproveFounderAvatarPreviewMutation();
  const [uploadFounderFinalAudio, uploadFounderFinalAudioState] = useUploadFounderFinalAudioMutation();
  const [prepareFounderAvatarPortrait, prepareFounderAvatarPortraitState] = usePrepareFounderAvatarPortraitMutation();
  const [generateFounderAvatarTest, generateFounderAvatarTestState] = useGenerateFounderAvatarTestMutation();
  const [chatScreenplayVideoScene] = useChatScreenplayVideoSceneMutation();
  const [generateScreenplaySceneDialogueVoice] = useGenerateScreenplaySceneDialogueVoiceMutation();
  const [decideScreenplaySceneDialogueVoice] = useDecideScreenplaySceneDialogueVoiceMutation();
  const [combineScreenplaySceneDialogueAudio] = useCombineScreenplaySceneDialogueAudioMutation();
  const [uploadScreenplaySceneAvatarImage] = useUploadScreenplaySceneAvatarImageMutation();
  const [uploadScreenplaySceneReferenceImage] = useUploadScreenplaySceneReferenceImageMutation();
  const [uploadScreenplaySceneProductionImage] = useUploadScreenplaySceneProductionImageMutation();
  const [generateScreenplayVideoSceneAsync, generateScreenplayVideoSceneState] = useGenerateScreenplayVideoSceneAsyncMutation();
  const [regenerateScreenplayVideoSceneAsync, regenerateScreenplayVideoSceneState] = useRegenerateScreenplayVideoSceneAsyncMutation();
  const [renderScreenplayVideoFinalAsync, renderScreenplayVideoFinalState] = useRenderScreenplayVideoFinalAsyncMutation();
  const [generateScreenplayVideoAudioPackAsync, generateScreenplayVideoAudioPackState] = useGenerateScreenplayVideoAudioPackAsyncMutation();
  const [submitHumanWorkOrder, submitHumanWorkOrderState] = useSubmitHumanWorkOrderMutation();
  const [requestHumanWorkOrderChanges, requestHumanWorkOrderChangesState] = useRequestHumanWorkOrderChangesMutation();
  const [approveHumanWorkOrder, approveHumanWorkOrderState] = useApproveHumanWorkOrderMutation();
  const [lockIdeaSelection, lockSelectionState] = useLockIdeaSelectionMutation();
  const [generateStoryboardFromScript, generateStoryboardState] = useGenerateStoryboardFromScriptMutation();
  const [generateStoryboardFromScriptAsync, generateStoryboardAsyncState] = useGenerateStoryboardFromScriptAsyncMutation();
  const [generateProductionPlansAsync, generateProductionPlansState] = useGenerateProductionPlansAsyncMutation();
  const [saveStoryboardClientReview, saveClientReviewState] = useSaveStoryboardClientReviewMutation();
  const [chatStoryboardClientReview, chatClientReviewState] = useChatStoryboardClientReviewMutation();
  const [embedOfflineAnimatedStoryboardHtml] = useEmbedOfflineAnimatedStoryboardHtmlMutation();
  const [applyStoryboardClientReview, applyClientReviewState] = useApplyStoryboardClientReviewMutation();
  const [revertStoryboardClientReview, revertClientReviewState] = useRevertStoryboardClientReviewMutation();
  const [uploadStoryboardFontReferenceImage, uploadFontReferenceState] = useUploadStoryboardFontReferenceImageMutation();
  const [uploadStoryboardVisualReferenceImage, uploadVisualReferenceState] = useUploadStoryboardVisualReferenceImageMutation();
  const [fetchAnimatedStoryboardPreview] = useLazyGetAnimatedStoryboardPreviewQuery();
  const [generateShotImage, generateShotImageState] = useGenerateShotImageMutation();
  const [analyzeShotProductReference] = useAnalyzeShotProductReferenceMutation();
  const [confirmShotProductReference] = useConfirmShotProductReferenceMutation();
  // Multi-shot batching: staged uploads (not yet analyzed) and mismatch reviews that came back
  // from a batch analysis run for a shot whose detail panel wasn't open at the time - both are
  // in-memory only, matching every other in-progress upload state in this app.
  const [pendingProductReferences, setPendingProductReferences] = useState(new Map());
  const [pendingProductMismatchReviews, setPendingProductMismatchReviews] = useState(new Map());
  const [analyzingStagedProductReferences, setAnalyzingStagedProductReferences] = useState(false);
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
  const [verifyWalletPayment, verifyWalletPaymentState] = useVerifyWalletPaymentMutation();
  const [setupOrganization, setupOrganizationState] = useSetupOrganizationMutation();
  const { data: predictionJob } = useGetJobQuery(predictionJobId, { skip: !predictionJobId, pollingInterval: predictionJobId ? 1600 : 0 });
  const { data: ideaGenerationJob } = useGetJobQuery(ideaGenerationJobId, { skip: !ideaGenerationJobId, pollingInterval: ideaGenerationJobId ? 1600 : 0 });
  const { data: productAdPipelineJob } = useGetJobQuery(productAdPipelineJobId, { skip: !productAdPipelineJobId, pollingInterval: productAdPipelineJobId ? 2200 : 0 });
  const { data: screenplayJob } = useGetJobQuery(screenplayJobId, { skip: !screenplayJobId, pollingInterval: screenplayJobId ? 1600 : 0 });
  const { data: productionPlanJob } = useGetJobQuery(productionPlanJobId, { skip: !productionPlanJobId, pollingInterval: productionPlanJobId ? 1600 : 0 });
  const { data: pipelineJob } = useGetJobQuery(pipelineJobId, { skip: !pipelineJobId, pollingInterval: pipelineJobId ? 2200 : 0 });
  const {
    data: shotTakeJob,
    error: shotTakeJobError,
    isError: shotTakeJobIsError,
  } = useGetJobQuery(shotTakeJobId, { skip: !shotTakeJobId, pollingInterval: shotTakeJobId ? 1600 : 0 });
  const { data: screenplayVideoJob, isError: screenplayVideoJobIsError } = useGetJobQuery(screenplayVideoJobId, {
    skip: !screenplayVideoJobId,
    pollingInterval: screenplayVideoJobId ? 2000 : 0,
  });
  const { data: screenplayVideoSceneJob, isError: screenplayVideoSceneJobIsError } = useGetJobQuery(screenplayVideoSceneJobId, {
    skip: !screenplayVideoSceneJobId,
    pollingInterval: screenplayVideoSceneJobId ? 2000 : 0,
  });
  const { data: screenplayVideoFinalJob, isError: screenplayVideoFinalJobIsError } = useGetJobQuery(screenplayVideoFinalJobId, {
    skip: !screenplayVideoFinalJobId,
    pollingInterval: screenplayVideoFinalJobId ? 2000 : 0,
  });
  const { data: screenplayVideoAudioJob, isError: screenplayVideoAudioJobIsError } = useGetJobQuery(screenplayVideoAudioJobId, {
    skip: !screenplayVideoAudioJobId,
    pollingInterval: screenplayVideoAudioJobId ? 2000 : 0,
  });
  const screenplayVideoJobActive = isJobActuallyRunning(
    screenplayVideoJob,
    screenplayVideoJobId,
    generateScreenplayVideoState.isLoading,
    screenplayVideoJobIsError
  );
  const screenplayVideoSceneJobActive = isJobActuallyRunning(
    screenplayVideoSceneJob,
    screenplayVideoSceneJobId,
    generateScreenplayVideoSceneState.isLoading || regenerateScreenplayVideoSceneState.isLoading,
    screenplayVideoSceneJobIsError
  );
  const screenplayVideoFinalJobActive = isJobActuallyRunning(
    screenplayVideoFinalJob,
    screenplayVideoFinalJobId,
    renderScreenplayVideoFinalState.isLoading,
    screenplayVideoFinalJobIsError
  );
  const screenplayVideoAudioJobActive = isJobActuallyRunning(
    screenplayVideoAudioJob,
    screenplayVideoAudioJobId,
    generateScreenplayVideoAudioPackState.isLoading,
    screenplayVideoAudioJobIsError
  );
  const screenplayVideoRunIdFromJobs = runIdFromVideoPayload(screenplayVideoJob?.result)
    || runIdFromVideoPayload(screenplayVideoJob?.outputPayload)
    || runIdFromVideoPayload(screenplayVideoSceneJob?.result)
    || runIdFromVideoPayload(screenplayVideoSceneJob?.outputPayload)
    || runIdFromVideoPayload(screenplayVideoFinalJob?.result)
    || runIdFromVideoPayload(screenplayVideoFinalJob?.outputPayload)
    || runIdFromVideoPayload(screenplayVideoAudioJob?.result)
    || runIdFromVideoPayload(screenplayVideoAudioJob?.outputPayload);
  const {
    data: latestPersistedScreenplayVideoRun,
    isFetching: latestPersistedScreenplayVideoRunLoading,
    refetch: refetchLatestPersistedScreenplayVideoRun,
  } = useGetLatestScreenplayVideoRunQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    {
      skip: !isUuid(scriptDetailIdea?.scriptId),
      pollingInterval: MEDIA_URL_RENEWAL_INTERVAL_MS,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );
  const {
    data: reusableFounderAvatarLibrary,
    isFetching: reusableFounderAvatarLibraryLoading,
  } = useListReusableFounderAvatarsQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    {
      skip: !isUuid(scriptDetailIdea?.scriptId),
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );
  const availableFounderAvatars = Array.isArray(reusableFounderAvatarLibrary?.avatars)
    ? reusableFounderAvatarLibrary.avatars
    : [];
  const latestPersistedScreenplayVideoRunId = runIdFromVideoPayload(latestPersistedScreenplayVideoRun);
  const activeScreenplayVideoRunId = screenplayVideoRunId || screenplayVideoRunIdFromJobs || latestPersistedScreenplayVideoRunId;
  const screenplayVideoPollingActive = Boolean(
    activeScreenplayVideoRunId
    && (
      screenplayVideoJobActive
      || screenplayVideoSceneJobActive
      || screenplayVideoFinalJobActive
      || screenplayVideoAudioJobActive
    )
  );
  const {
    data: screenplaySceneAssets,
    refetch: refetchScreenplaySceneAssets,
  } = useGetScreenplaySceneAssetsQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    {
      skip: !isUuid(scriptDetailIdea?.scriptId),
      pollingInterval: screenplayVideoPollingActive ? 2200 : MEDIA_URL_RENEWAL_INTERVAL_MS,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );
  const [setScreenplaySceneAssetAccepted] = useSetScreenplaySceneAssetAcceptedMutation();
  // The reliable source for "which shots are already generated" - reads creator_assets
  // directly rather than reconstructing it from whichever generation job happened to
  // complete most recently, which an unrelated failure (e.g. final-render billing error)
  // can silently poison. Used both for accurate progress display and to let "run complete
  // pipeline" skip shots that are already done instead of re-generating everything.
  const generatedShotNumbers = useMemo(
    () => new Set(
      (screenplaySceneAssets?.scenes || [])
        .filter((scene) => scene?.status === "READY")
        .map((scene) => scene?.shotNumber)
        .filter((shotNumber) => Number.isInteger(shotNumber))
    ),
    [screenplaySceneAssets]
  );
  const combinedVideoAsset = screenplaySceneAssets?.combinedVideo || null;
  // This hook is declared once at the top of the component and never remounts as the
  // user moves between storyboard/video, so RTK Query's mount-based refetch heuristics
  // don't apply when switching pages. Force a refetch on entry so the video page always
  // shows the latest generated shots instead of waiting on the next poll tick.
  useEffect(() => {
    if (workspacePage === "video" && isUuid(scriptDetailIdea?.scriptId)) {
      refetchScreenplaySceneAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacePage, scriptDetailIdea?.scriptId]);
  const {
    data: screenplayVideoRun,
    isFetching: screenplayVideoRunLoading,
    refetch: refetchScreenplayVideoRun,
  } = useGetScreenplayVideoRunQuery(
    { scriptId: scriptDetailIdea?.scriptId, runId: activeScreenplayVideoRunId },
    {
      skip: !scriptDetailIdea?.scriptId || !activeScreenplayVideoRunId,
      pollingInterval: screenplayVideoPollingActive ? 2200 : MEDIA_URL_RENEWAL_INTERVAL_MS,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );
  const refreshScreenplayMedia = () => {
    if (activeScreenplayVideoRunId) {
      return refetchScreenplayVideoRun();
    }
    return refetchLatestPersistedScreenplayVideoRun();
  };
  const baseScreenplayVideoRun = screenplayVideoRun
    || latestPersistedScreenplayVideoRun
    || videoRunFromPayload(screenplayVideoJob?.result)
    || videoRunFromPayload(screenplayVideoJob?.outputPayload)
    || videoRunFromPayload(screenplayVideoSceneJob?.result)
    || videoRunFromPayload(screenplayVideoSceneJob?.outputPayload)
    || videoRunFromPayload(screenplayVideoFinalJob?.result)
    || videoRunFromPayload(screenplayVideoFinalJob?.outputPayload)
    || videoRunFromPayload(screenplayVideoAudioJob?.result)
    || videoRunFromPayload(screenplayVideoAudioJob?.outputPayload);
  const latestAudioVideoRun = videoRunFromPayload(screenplayVideoAudioJob?.result)
    || videoRunFromPayload(screenplayVideoAudioJob?.outputPayload);
  const currentScreenplayVideoRun = mergeVideoRunAudioState(baseScreenplayVideoRun, latestAudioVideoRun);
  const {
    data: humanWorkOrdersData = [],
    refetch: refetchHumanWorkOrders,
  } = useGetHumanWorkOrdersQuery(
    { scriptId: scriptDetailIdea?.scriptId, limit: 20 },
    {
      skip: !scriptDetailIdea?.scriptId,
      refetchOnMountOrArgChange: true,
    }
  );
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
  const [fetchLatestScreenplayVideoRun] = useLazyGetLatestScreenplayVideoRunQuery();
  const { data: ideaGenerationJobs = [], isFetching: ideaGenerationJobsLoading, refetch: refetchIdeaGenerationJobs } = useGetJobsQuery(
    { jobType: "IDEA_GENERATE" },
    { pollingInterval: ideaGenerationJobId ? 5000 : 0, refetchOnMountOrArgChange: true }
  );
  const { data: storyboardJob } = useGetJobQuery(storyboardJobId, { skip: !storyboardJobId, pollingInterval: storyboardJobId ? 1600 : 0 });
  const { data: backendProductionPlans = [], isFetching: productionPlansLoading, refetch: refetchProductionPlans } = useGetProductionPlansQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    { skip: !scriptDetailIdea?.scriptId || productionPlanJobId }
  );
  const {
    data: backendClientReview,
    isFetching: clientReviewLoading,
  } = useGetStoryboardClientReviewQuery(
    { scriptId: scriptDetailIdea?.scriptId },
    { skip: !isUuid(scriptDetailIdea?.scriptId), refetchOnMountOrArgChange: true }
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
  const activeProductionStyleGuidance = useMemo(
    () => productionStyleGuidanceFor(productionStyle, { hybridSceneMode, brollStyle, captionStyle }),
    [brollStyle, captionStyle, hybridSceneMode, productionStyle]
  );
  const screenplayVideoGenerationPackage = useMemo(
    () => {
      const provider = normalizeScreenplayVideoProvider(screenplayVideoProvider);
      const model = compatibleScreenplayVideoModelForProvider(provider, screenplayVideoModel);
      const maxClipSeconds = maxClipSecondsForVideoProvider(provider, model);
      return buildScreenplayVideoGenerationPackage(scriptDetailIdea?.scriptJson, {
        durationSeconds: selectedDuration,
        screenType,
        topicType,
        storytellingType,
        productionStyle,
        hybridSceneMode,
        brollStyle,
        captionStyle,
        dialogueLanguage,
        provider,
        model,
        maxClipSeconds,
        videoModelCapability: videoModelCapabilityForScreenplay(provider, model),
      });
    },
    [brollStyle, captionStyle, dialogueLanguage, hybridSceneMode, productionStyle, screenType, screenplayVideoModel, screenplayVideoProvider, scriptDetailIdea?.scriptJson, selectedDuration, storytellingType, topicType]
  );
  const activeVideoStylePayload = useMemo(() => ({
    productionStyle,
    hybridSceneMode,
    brollStyle,
    captionStyle,
    productionStyleGuidance: activeProductionStyleGuidance,
    ...screenplayVideoGenerationPackage,
    ...(Object.keys(screenplayVideoGenerationPackage).length ? { screenplayVideoGenerationPackage } : {}),
  }), [activeProductionStyleGuidance, brollStyle, captionStyle, hybridSceneMode, productionStyle, screenplayVideoGenerationPackage]);
  const activeProductAdBrief = useMemo(() => normalizeProductAdBrief(productAdBrief), [productAdBrief]);
  const hasActiveProductAdInput = useMemo(() => hasProductAdInput(activeProductAdBrief), [activeProductAdBrief]);
  const activeProductIntelligenceBrief = useMemo(
    () => buildProductIntelligenceBrief(activeProductAdBrief, manualIdeaDraft, {
      countryCode: country.code,
      durationSeconds: selectedDuration,
      topicType,
      productionStyle,
      dialogueLanguage,
      screenType,
      storytellingType,
      hookLens,
      brollStyle,
      captionStyle,
      campaignAngle: selectedCampaignAngle,
    }),
    [activeProductAdBrief, brollStyle, captionStyle, country.code, dialogueLanguage, hookLens, manualIdeaDraft, productionStyle, screenType, selectedCampaignAngle, selectedDuration, storytellingType, topicType]
  );
  const storyboardProductBrief = useMemo(
    () => productIntelligenceBriefForWorkflow(
      scriptDetailIdea,
      storyScriptIdea,
      lockedBrief,
      activeProductIntelligenceBrief
    ),
    [activeProductIntelligenceBrief, lockedBrief, scriptDetailIdea, storyScriptIdea]
  );
  const productStoryboardMode = Boolean(storyboardProductBrief);
  const activeCampaignAngle = selectedCampaignAngle || campaignAngleFromEntity(lockedBrief, activeProductAdBrief);
  const activeProductInputKey = useMemo(
    () => productAdInputKey(activeProductIntelligenceBrief),
    [activeProductIntelligenceBrief]
  );
  const activeVideoFinishingPlan = useMemo(
    () => normalizeVideoFinishingPlan(videoFinishingPlan),
    [videoFinishingPlan]
  );
  const activeFounderAvatarProfile = useMemo(
    () => normalizeFounderAvatarProfileForPlanning(scriptDetailIdea, currentScreenplayVideoRun, founderAvatarProfile),
    [currentScreenplayVideoRun, founderAvatarProfile, scriptDetailIdea]
  );
  const selectedFounderAvatarKey = useMemo(() => {
    const explicitSelection = firstString(
      activeFounderAvatarProfile.selectedFromScriptId,
      activeFounderAvatarProfile.selected_from_script_id
    );
    if (explicitSelection) return explicitSelection;
    const activeProviderVoiceId = firstString(
      activeFounderAvatarProfile.providerVoiceId,
      activeFounderAvatarProfile.minimaxVoiceId,
      activeFounderAvatarProfile.elevenLabsVoiceId,
      activeFounderAvatarProfile.sarvamVoiceId,
      activeFounderAvatarProfile.synthesiaVoiceId
    );
    return firstString(
      availableFounderAvatars.find((avatar) => firstString(avatar?.providerVoiceId) === activeProviderVoiceId)?.sourceScriptId
    );
  }, [activeFounderAvatarProfile, availableFounderAvatars]);
  const activeFounderAvatarPayload = useMemo(
    () => founderAvatarPayloadForPlanning(activeFounderAvatarProfile),
    [activeFounderAvatarProfile]
  );
  const activeScreenplayVideoPayload = useMemo(() => {
    const provider = normalizeScreenplayVideoProvider(screenplayVideoProvider);
    const model = compatibleScreenplayVideoModelForProvider(provider, screenplayVideoModel);
    const maxClipSeconds = maxClipSecondsForVideoProvider(provider, model);
    const videoModelCapability = videoModelCapabilityForScreenplay(provider, model);
    return {
      ...activeVideoStylePayload,
      provider,
      model,
      maxClipSeconds,
      videoModelCapability,
      modelCapabilities: videoModelCapability,
      dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
      videoFinishingPlan: activeVideoFinishingPlan,
      soundDesignPlan: soundDesignPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
      imageLedAdPlan: imageLedAdPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
      audioProductionPlan: audioProductionPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
      editingPlan: editingPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
      ...activeFounderAvatarPayload,
      storyboardReferenceMode: activeVideoFinishingPlan.useStoryboardReferences ? activeVideoFinishingPlan.referenceImageMode : "ignore",
      referenceImageMode: activeVideoFinishingPlan.referenceImageMode,
      requireImageAnchors: activeVideoFinishingPlan.requireImageAnchors,
      burnCaptions: activeVideoFinishingPlan.burnCaptions,
      useMixedAudio: activeVideoFinishingPlan.useMixedAudio,
    };
  }, [activeFounderAvatarPayload, activeVideoFinishingPlan, activeVideoStylePayload, screenplayVideoModel, screenplayVideoProvider]);
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
  // The video-generation panel reads raw scriptScenes/scriptJson.shots (it needs their full
  // per-shot planning fields - dialogue, camera notes, etc. - which the storyboard-oriented
  // `scenes` above doesn't carry the same way), but that raw data has no image URLs on it at
  // all: productionImageUrl only ever lands on scriptScenes as a client-side, this-session-only
  // patch when a shot's "Generate" click resolves (see handleGenerateShotImage's optimistic
  // setScriptDetailIdea update). On a fresh load, or for any shot generated in an earlier
  // session/via the bulk generator, that patch never happened, so the panel silently fell back
  // to the unrelated product-brief reference image instead of the real generated frame. Patch
  // the same authoritative DB-backed image URLs (backendShotImageUrls) onto it that `scenes`
  // already gets, so every shot - not just the one generated most recently in this tab - shows
  // its real production frame.
  const videoPanelScenes = useMemo(() => {
    const raw = scriptDetailIdea?.scriptScenes?.length
      ? scriptDetailIdea.scriptScenes
      : scriptDetailIdea?.scriptJson?.shots || scenes;
    return mergeShotImageUrlsIntoScenes(raw, backendShotImageUrls);
  }, [scriptDetailIdea?.scriptScenes, scriptDetailIdea?.scriptJson?.shots, scenes, backendShotImageUrls]);
  const { data: activeProjectDetail } = useGetPreProductionProjectQuery(activeProjectId, { skip: !isUuid(activeProjectId) });
  const { data: activeProjectSpend } = useGetProjectSpendQuery(
    { tenantId: reduxTenantId, projectId: activeProjectId },
    { skip: !isUuid(activeProjectId) || !isUuid(reduxTenantId) }
  );
  const [triggerAdvanceProjectStatus] = useAdvanceProjectStatusMutation();
  const allShotsVideoGenerated = videoPanelScenes.length > 0 && videoPanelScenes.every((scene) => isReadyStatus(scene?.status));
  const videoGenerationCompleteFiredRef = useRef(null);
  useEffect(() => {
    if (!allShotsVideoGenerated || !isUuid(activeProjectId)) return;
    if (videoGenerationCompleteFiredRef.current === activeProjectId) return;
    videoGenerationCompleteFiredRef.current = activeProjectId;
    triggerAdvanceProjectStatus({ projectId: activeProjectId, target: "VIDEO_GENERATION_COMPLETE" });
  }, [allShotsVideoGenerated, activeProjectId, triggerAdvanceProjectStatus]);
  const {
    data: latestFinalRender,
    isFetching: latestFinalRenderLoading,
    refetch: refetchLatestFinalRender,
  } = useGetLatestFinalRenderQuery(activeProjectId, { skip: !isUuid(activeProjectId) });
  const [triggerCreateFinalRender, createFinalRenderState] = useCreateFinalRenderMutation();
  const [triggerUpdateFinalVideoLock, updateFinalVideoLockState] = useUpdateFinalVideoLockMutation();
  const handleToggleFinalVideoLock = useCallback(async (unlocked) => {
    if (!isUuid(activeProjectId)) return;
    try {
      await triggerUpdateFinalVideoLock({ projectId: activeProjectId, unlocked }).unwrap();
    } catch (error) {
      setFinalRenderError(error?.data?.message || error?.error || "Could not update download lock.");
    }
  }, [activeProjectId, triggerUpdateFinalVideoLock]);
  const [finalRenderError, setFinalRenderError] = useState(null);
  const handleAssembleFinalVideo = useCallback(async () => {
    if (!isUuid(activeProjectId)) return;
    setFinalRenderError(null);
    try {
      await triggerCreateFinalRender(activeProjectId).unwrap();
      refetchLatestFinalRender?.();
    } catch (error) {
      setFinalRenderError(error?.data?.message || error?.error || "Could not assemble the final video.");
    }
  }, [activeProjectId, triggerCreateFinalRender, refetchLatestFinalRender]);
  useEffect(() => {
    setPostProductionSceneOrder((current) => reconcileSceneOrder(mergedScenes, current));
  }, [mergedScenes]);
  // Shots whose shot plan lists a character - candidates for "apply this same cast face to other
  // shots too" after a CAST reference is confirmed for one shot.
  const castCandidateShots = useMemo(
    () => scenes
      .filter((scene) => shotHasHumanCharacter(scene))
      .map((scene) => ({
        shotNumber: Number(scene.shotNumber || 0),
        title: firstText(scene.title, scene.shotTitle, `Shot ${scene.shotNumber || ""}`),
      }))
      .filter((entry) => entry.shotNumber > 0),
    [scenes]
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
    () => summarizeShotExportAssets(scenes, expectedExportShotCount, productStoryboardMode),
    [expectedExportShotCount, productStoryboardMode, scenes]
  );
  const productFrameGenerationLoading = Boolean(
    productShotImagesGenerating
    || visibleShotImageLoadingKeys.some((key) => String(key).endsWith(":production"))
  );
  const canExportShotsPdf = Boolean(
    !shotGenerationLoading
    && !productFrameGenerationLoading
    && shotExportSummary.expected > 0
    && shotExportSummary.storyboardReady >= shotExportSummary.expected
    && shotExportSummary.lightingReady >= shotExportSummary.expected
    && shotExportSummary.dpReady >= shotExportSummary.expected
    && (!productStoryboardMode || shotExportSummary.productionReady >= shotExportSummary.expected)
  );
  const generatedShotCardsReadyForPolish = Boolean(
    shotExportSummary.expected > 0
    && shotExportSummary.completeReady >= shotExportSummary.expected
  );
  const exportBlockedReason = shotGenerationLoading
    ? "Shot generation is still running. Please export after all shots are generated."
    : productFrameGenerationLoading
      ? "Product frames are still generating. Please wait before exporting."
    : shotExportSummary.expected <= 0
      ? "Generate shot plans and shots before exporting."
      : !canExportShotsPdf
        ? productStoryboardMode
          ? `Generate all storyboard, lighting, DP, and product frames before export (${shotExportSummary.completeReady}/${shotExportSummary.expected} complete).`
          : `Please export after generating all the shots (${shotExportSummary.completeReady}/${shotExportSummary.expected} complete).`
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
  const activeStoryIdeaIdForCast = resolveWorkflowStoryIdeaId(activeStoryIdeaForCast, storyScriptIdea, selectedIdea, { id: savedStoryIdeaId });
  const activeLockedIdeaIdForCast = resolveWorkflowLockedIdeaId(activeStoryIdeaForCast, storyScriptIdea, selectedIdea, lockedBrief);
  const activeStoryCharactersForCast = useMemo(
    () => resolveStoryCharactersForCast(activeStoryIdeaForCast, storyScriptIdea, selectedIdea),
    [activeStoryIdeaForCast, storyScriptIdea, selectedIdea]
  );
  const shouldFetchCharacterCastMappings = Boolean(isUuid(activeLockedIdeaIdForCast) && isUuid(activeStoryIdeaIdForCast));
  const { data: characterCastMappingData = { mappings: [] } } = useGetCharacterCastMappingsQuery(
    { lockedIdeaId: activeLockedIdeaIdForCast, storyIdeaId: activeStoryIdeaIdForCast },
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
    const savedAssets = storyboardReferenceAssetsFromScriptIdea(scriptDetailIdea);
    if (savedAssets.length) {
      setStoryboardReferenceAssets((current) => mergeStoryboardReferenceAssets(current, savedAssets));
    }
    const savedDetails = storyboardReferenceDetailsFromScriptIdea(scriptDetailIdea);
    if (savedDetails && !storyboardReferenceDetails) {
      setStoryboardReferenceDetails(savedDetails);
    }
    if (storyboardReferenceEnhancementEnabledFromScriptIdea(scriptDetailIdea)) {
      setStoryboardEnhanceWithReference(true);
    }
  }, [scriptDetailIdea?.scriptId]);

  useEffect(() => {
    const planningLanguage = firstString(
      scriptDetailIdea?.dialogueLanguage,
      scriptDetailIdea?.scriptJson?.dialogueLanguage,
      dialogueLanguage
    );
    const embeddedReview = normalizeClientReview(
      scriptDetailIdea?.clientReview || scriptDetailIdea?.scriptJson?.clientReview,
      planningLanguage
    );
    setClientReview(embeddedReview);
    setClientReviewDirty(false);
    if (planningLanguage) setDialogueLanguage(planningLanguage);
  }, [scriptDetailIdea?.scriptId]);

  useEffect(() => {
    if (!backendClientReview || clientReviewDirty) return;
    const normalized = normalizeClientReview(backendClientReview, dialogueLanguage);
    setClientReview(normalized);
  }, [backendClientReview, clientReviewDirty]);

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
      screenplayApprovedForVideo,
      productAdPipelineJobId,
      screenplayVideoRunId: activeScreenplayVideoRunId,
      screenplayVideoJobId,
      screenplayVideoFinalJobId,
      screenplayVideoAudioJobId,
      selectedDuration,
      dialogueLanguage,
      clientReview,
      screenType,
      storytellingType,
      hookLens,
      topicType,
      productionStyle,
      hybridSceneMode,
      brollStyle,
      captionStyle,
      videoFinishingPlan: activeVideoFinishingPlan,
      screenplayVideoProvider,
      screenplayVideoModel,
      founderAvatarProfile: activeFounderAvatarProfile,
      founderKit: activeFounderAvatarProfile,
      storyboardReferenceDetails,
      storyboardReferenceAssets,
      storyboardEnhanceWithReference,
      creativeFlow,
      manualIdeaDraft,
      productAdBrief: activeProductAdBrief,
      savedIdeaIds: Array.from(savedIdeaIds),
      savedIdeaSnapshots,
      extraIdeas,
      updatedAt: new Date().toISOString(),
    });
  }, [
    activeProjectId,
    activeFounderAvatarProfile,
    castPlan,
    clientReview,
    dialogueLanguage,
    extraIdeas,
    generatedStoryboard,
    ideaCandidatePageInfo,
    ideaCandidatePageItems,
    hookLens,
    hybridSceneMode,
    lockedBrief,
    lockedIdeaOptions,
    manualIdeaDraft,
    activeProductAdBrief,
    brollStyle,
    captionStyle,
    creativeFlow,
    planner.activeStep,
    planner.completedSteps,
    planner.projectId,
    planner.selectedAudienceId,
    planner.selectedCreatorId,
    planner.selectedIdeaId,
    planner.selectedTrendId,
    productAdPipelineJobId,
    savedIdeaIds,
    savedIdeaSnapshots,
    savedStoryIdeaId,
    screenType,
    screenplayApprovedForVideo,
    screenplayVideoAudioJobId,
    screenplayVideoFinalJobId,
    screenplayVideoJobId,
    screenplayVideoModel,
    screenplayVideoProvider,
    storyboardEnhanceWithReference,
    storyboardReferenceAssets,
    storyboardReferenceDetails,
    activeScreenplayVideoRunId,
    scriptDetailIdea,
    selectedAudienceDecision,
    selectedDuration,
    storyboardSaved,
    storyScriptIdea,
    storytellingType,
    topicType,
    productionStyle,
    activeVideoFinishingPlan,
    workflowRestored,
    workspacePage,
  ]);
  const fallbackAudienceSummary = useMemo(
    () => buildAudienceSuggestionForPlanner(selectedIdea, selectedTrend, country),
    [country, selectedIdea, selectedTrend]
  );
  const selectedAudienceSummary = selectedAudienceDecision || fallbackAudienceSummary;
  const savedBriefMatchesProductInput = Boolean(
    hasActiveProductAdInput
    && lockedBrief?.source === "original"
    && productAdInputKey(productIntelligenceBriefFromEntity(lockedBrief)) === activeProductInputKey
  );
  const savedBriefMatchesCurrentMode = TREND_DISCOVERY_ENABLED && trendChoiceMode === "trend"
    ? Boolean(lockedBrief?.source === "trend" && lockedBrief?.trendId === selectedTrend?.id)
    : hasActiveProductAdInput
      ? savedBriefMatchesProductInput
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
  const activeDialogueVoiceProfile = useMemo(
    () => dialogueVoiceProfileForPlanning(activeCharacterMappings, selectedCreator, scriptDetailIdea?.scriptJson, activeFounderAvatarProfile),
    [activeCharacterMappings, activeFounderAvatarProfile, selectedCreator, scriptDetailIdea?.scriptJson]
  );
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
  // Self-heal: the persisted localStorage snapshot can end up with scriptDetailIdea
  // cleared (e.g. a script-generation modal was opened and cancelled) while still
  // carrying a real projectId and workspacePage="video"/"storyboard" - the app then
  // reads as "no screenplay" even though one exists on the backend. Re-fetch from the
  // durable source instead of trusting the cached snapshot as the only source of truth.
  useEffect(() => {
    if (!workflowRestored || !isUuid(activeProjectId) || scriptDetailIdea || freshNewIdeaMode) return;
    let cancelled = false;
    (async () => {
      try {
        const project = await fetchCreatorProject(activeProjectId).unwrap();
        const restored = buildWorkflowStateFromProject(project);
        if (!cancelled && restored?.scriptDetailIdea) {
          setScriptDetailIdea(restored.scriptDetailIdea);
          if (restored.storyScriptIdea) setStoryScriptIdea(restored.storyScriptIdea);
        }
      } catch {
        // No recoverable screenplay for this project - leave the UI's own
        // "generate a screenplay" prompt as the correct next step.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowRestored, activeProjectId, scriptDetailIdea, freshNewIdeaMode]);
  const effectiveStoryScriptReady = !freshNewIdeaMode && Boolean(storyScriptIdea);
  const effectiveCastStepComplete = !freshNewIdeaMode
    && Boolean(storyScriptIdea || scriptDetailIdea || castPlan || activeProjectId)
    && castStepComplete;
  const effectiveAudienceStepComplete = !freshNewIdeaMode && Boolean(selectedAudienceDecision || planner.completedSteps.audience);
  const effectiveScreenplayReady = !freshNewIdeaMode && Boolean(scriptDetailIdea);
  const effectiveScreenplayApprovedForVideo = Boolean(
    screenplayApprovedForVideo
    || scriptDetailIdea?.approval
    || activeScreenplayVideoRunId
    || currentScreenplayVideoRun?.runId
    || currentScreenplayVideoRun?.id
    || ["SCREENPLAY_APPROVED", "APPROVED", "VIDEO_APPROVED"].includes(String(scriptDetailIdea?.status || "").toUpperCase())
  );
  const effectiveShotPlansReady = !freshNewIdeaMode && Boolean(productionPlanTags.length || storyboardSaved || generatedStoryboard);
  const expectedShotTakeCount = scenes.length || productionPlanTags.length || screenplayShotCount || 0;
  const acceptedShotTakeCount = (Array.isArray(shotTakes) ? shotTakes : []).filter((take) => take?.accepted).length;
  const effectiveShootPolishReady = Boolean(expectedShotTakeCount && acceptedShotTakeCount >= expectedShotTakeCount);
  const screenplayVideoSceneCount = screenplayVideoSceneCountFor(screenplayVideoRun, scenes);
  const screenplayVideoGeneratedCount = generatedShotNumbers.size > 0
    ? generatedShotNumbers.size
    : screenplayVideoGeneratedCountFor(screenplayVideoRun);
  const activeFinalVideoUrl = combinedVideoAsset?.videoUrl
    || finalVideoUrlFromPayload(currentScreenplayVideoRun)
    || finalVideoUrlFromPayload(screenplayVideoFinalJob?.result)
    || finalVideoUrlFromPayload(screenplayVideoFinalJob?.outputPayload);
  useEffect(() => {
    if (
      workspacePage !== "video"
      || !productStoryboardMode
      || canExportShotsPdf
      || activeFinalVideoUrl
      || screenplayVideoGeneratedCount > 0
      || !scriptDetailIdea?.scriptId
    ) return;
    setWorkspacePage("storyboard");
    dispatch(setActiveStep("storyboard"));
    window.history.replaceState(null, "", "/#storyboard");
  }, [activeFinalVideoUrl, canExportShotsPdf, dispatch, productStoryboardMode, screenplayVideoGeneratedCount, scriptDetailIdea?.scriptId, workspacePage]);
  const effectiveScreenplayVideoReady = Boolean(
    activeFinalVideoUrl
  );
  const humanWorkOrders = useMemo(() => normalizeHumanWorkOrderList(humanWorkOrdersData), [humanWorkOrdersData]);
  const screenplayReviewOrder = useMemo(
    () => latestHumanWorkOrderOfType(humanWorkOrders, "SCREENPLAY_REVIEW"),
    [humanWorkOrders]
  );
  const editingWorkOrder = useMemo(
    () => latestHumanWorkOrderOfType(humanWorkOrders, "EDITING_JOB"),
    [humanWorkOrders]
  );
  const videoBlockedReason = !effectiveScreenplayReady
    ? "Generate and review the screenplay before video generation"
    : !planner.completedSteps.screenplay && !effectiveScreenplayApprovedForVideo
      ? "Review the screenplay before video generation"
      : !effectiveShotPlansReady
        ? "Generate storyboard shot plans before video generation"
        : !storyboardSaved
          ? "Save Production on the Storyboard page before video generation"
          : !canExportShotsPdf
            ? exportBlockedReason || "Generate every required storyboard image before video generation"
      : "";
  const polishBlockedReason = !effectiveShotPlansReady
    ? "Generate storyboard before opening Polish."
    : shotGenerationLoading
      ? "Shot images are still generating. Polish unlocks when generated shots are ready."
      : !generatedShotCardsReadyForPolish
        ? `Generate all shot images before opening Polish (${shotExportSummary.completeReady}/${shotExportSummary.expected || expectedShotTakeCount || 0} complete).`
        : "";
  const polishUnlocked = !polishBlockedReason;
  const usedGeneratedIdeaIds = useMemo(
    () => new Set([
      savedStoryIdeaId,
      storyScriptIdea?.storyIdeaId,
      storyScriptIdea?.id,
      scriptDetailIdea?.storyIdeaId,
      scriptDetailIdea?.id,
    ].filter(Boolean).map((id) => String(id))),
    [savedStoryIdeaId, scriptDetailIdea?.id, scriptDetailIdea?.storyIdeaId, storyScriptIdea?.id, storyScriptIdea?.storyIdeaId]
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
      label: "Cast",
      value: effectiveCastStepComplete
        ? `${mappedCharacterCount || selectedCreator?.actors?.length || 0} mappings saved`
        : "Map characters to cast",
      done: effectiveCastStepComplete,
      active: activeWorkflowSlide.id === "cast",
    },
    {
      id: "screenplay",
      label: "Screenplay",
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
      label: "Cast",
      kicker: "Cast mapping",
      description: effectiveCastStepComplete ? `${mappedCharacterCount || selectedCreator?.actors?.length || 0} mappings saved` : "Add cast and map characters",
      done: effectiveCastStepComplete,
      locked: false,
    },
    {
      id: "screenplay",
      label: "Screenplay",
      kicker: "Shots",
      description: scriptDetailIdea
        ? `${screenplayShotCount || "Shot-wise"} pages ready - ${productionPlanTags.length || 0} plan tags`
        : getWorkflowGateMessage("screenplay") || "Generate shot-wise script",
      done: effectiveScreenplayReady,
      locked: Boolean(getWorkflowGateMessage("screenplay")),
    },
    {
      id: "video",
      label: "Video",
      kicker: "Video Render",
      description: videoBlockedReason
        || (effectiveScreenplayVideoReady
          ? "Final video ready"
          : screenplayVideoGeneratedCount
            ? `${screenplayVideoGeneratedCount}/${screenplayVideoSceneCount || screenplayShotCount || scenes.length || 0} shot clips ready`
            : effectiveScreenplayApprovedForVideo
              ? "Ready to prepare shot render"
              : "Approve screenplay for video"),
      done: effectiveScreenplayVideoReady,
      locked: Boolean(videoBlockedReason),
    },
    {
      id: "storyboard",
      label: "Storyboard",
      kicker: "Optional review",
      description: productionPlanTags.length ? `${productionPlanTags.length} shot plans ready` : getWorkflowGateMessage("storyboard") || "Preview and adjust shots before video",
      done: effectiveShotPlansReady,
      locked: Boolean(getWorkflowGateMessage("storyboard")),
    },
    {
      id: "client-review",
      label: "Client Review",
      kicker: "Feedback",
      description: clientReview?.propagation?.status === "APPLIED"
        ? `${clientReview.propagation.updatedShotCount || scenes.length || 0} shots synced`
        : "Review frames, language, fonts, and overlays",
      done: clientReview?.propagation?.status === "APPLIED",
      locked: false,
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
    if (!tenantId) {
      setLowBalanceNotice(null);
      return;
    }
    if (!lowBalanceNotice) return;
    const minimumBalance = Number(lowBalanceNotice.minimumBalance) > 0 ? Number(lowBalanceNotice.minimumBalance) : paidGenerationMinimumBalance;
    if (walletBalanceAmount >= minimumBalance) {
      setLowBalanceNotice(null);
    }
  }, [lowBalanceNotice, paidGenerationMinimumBalance, tenantId, walletBalanceAmount]);

  // "creator:open-recharge" is now handled globally by GlobalRechargeModal (mounted in
  // CreatorShell, so the sidebar's Recharge button works on every page, not just this one) --
  // PlannerPage no longer listens for it itself, to avoid two recharge modals opening at once
  // here. setRechargeOpen(true) is still called directly elsewhere in this page (its own
  // low-balance guard before a paid action), which still opens this page's own modal below.

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
    if (!screenplayVideoRunIdFromJobs || screenplayVideoRunIdFromJobs === screenplayVideoRunId) return;
    setScreenplayVideoRunId(screenplayVideoRunIdFromJobs);
  }, [screenplayVideoRunId, screenplayVideoRunIdFromJobs]);

  useEffect(() => {
    if (screenplayVideoJobId && screenplayVideoJobIsError) {
      setScreenplayVideoJobId(null);
      return;
    }
    const status = String(screenplayVideoJob?.status || "").toUpperCase();
    if (!status) return;
    if (isFailedJobStatus(status)) {
      setScreenplayVideoJobId(null);
      addActivity("Shot queue preparation failed", scriptDetailIdea?.title || "Screenplay video");
      flash(screenplayVideoJob?.errorMessage || screenplayVideoJob?.message || "Shot queue preparation failed. Try again.", "error");
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    setScreenplayVideoJobId(null);
    setScreenplayVideoRunId(runIdFromVideoPayload(screenplayVideoJob?.result) || runIdFromVideoPayload(screenplayVideoJob?.outputPayload) || screenplayVideoRunId);
    addActivity("Shot queue prepared", scriptDetailIdea?.title || "Screenplay video");
    flash("Shot queue ready. Generate one shot at a time.", "success");
    void refetchScreenplayVideoRun?.();
    void refetchWallet?.();
  }, [screenplayVideoJob?.status, screenplayVideoJob?.progress, screenplayVideoJobId, screenplayVideoJobIsError, refetchWallet]);

  useEffect(() => {
    if (screenplayVideoSceneJobId && screenplayVideoSceneJobIsError) {
      setScreenplayVideoSceneJobId(null);
      setScreenplayVideoActiveSceneId(null);
      return;
    }
    const status = String(screenplayVideoSceneJob?.status || "").toUpperCase();
    if (!status) return;
    if (isFailedJobStatus(status)) {
      setScreenplayVideoSceneJobId(null);
      setScreenplayVideoActiveSceneId(null);
      addActivity("Shot generation failed", scriptDetailIdea?.title || "Screenplay video");
      flash(screenplayVideoSceneJob?.errorMessage || screenplayVideoSceneJob?.message || "Shot generation failed. Try again.", "error");
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    setScreenplayVideoSceneJobId(null);
    setScreenplayVideoActiveSceneId(null);
    addActivity("Shot generated", scriptDetailIdea?.title || "Screenplay video");
    flash("Shot clip is ready for review.", "success");
    void refetchScreenplayVideoRun?.();
    void refetchWallet?.();
  }, [screenplayVideoSceneJob?.status, screenplayVideoSceneJob?.progress, screenplayVideoSceneJobId, screenplayVideoSceneJobIsError, refetchWallet]);

  useEffect(() => {
    if (screenplayVideoFinalJobId && screenplayVideoFinalJobIsError) {
      setScreenplayVideoFinalJobId(null);
      return;
    }
    const status = String(screenplayVideoFinalJob?.status || "").toUpperCase();
    if (!status) return;
    if (isFailedJobStatus(status)) {
      setScreenplayVideoFinalJobId(null);
      addActivity("Final video merge failed", scriptDetailIdea?.title || "Screenplay video");
      flash(screenplayVideoFinalJob?.errorMessage || screenplayVideoFinalJob?.message || "Final video merge failed. Try again.", "error");
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    setScreenplayVideoFinalJobId(null);
    addActivity("Final video ready", scriptDetailIdea?.title || "Screenplay video");
    flash("Final video is ready.", "success");
    void refetchScreenplayVideoRun?.();
    void refetchWallet?.();
  }, [screenplayVideoFinalJob?.status, screenplayVideoFinalJob?.progress, screenplayVideoFinalJobId, screenplayVideoFinalJobIsError, refetchWallet]);

  useEffect(() => {
    if (screenplayVideoAudioJobId && screenplayVideoAudioJobIsError) {
      setScreenplayVideoAudioJobId(null);
      return;
    }
    const status = String(screenplayVideoAudioJob?.status || "").toUpperCase();
    if (!status) return;
    if (isFailedJobStatus(status)) {
      setScreenplayVideoAudioJobId(null);
      addActivity("Dialogue and music preparation failed", scriptDetailIdea?.title || "Screenplay video");
      flash(screenplayVideoAudioJob?.errorMessage || screenplayVideoAudioJob?.message || "Dialogue or music preparation failed. Try again.", "error");
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;
    setScreenplayVideoAudioJobId(null);
    addActivity("Dialogue and music ready", scriptDetailIdea?.title || "Screenplay video");
    flash("Dialogue and background music details are attached to the video run.", "success");
    void refetchScreenplayVideoRun?.();
    void refetchWallet?.();
  }, [screenplayVideoAudioJob?.status, screenplayVideoAudioJob?.progress, screenplayVideoAudioJobId, screenplayVideoAudioJobIsError, refetchWallet]);

  useEffect(() => {
    const status = String(productAdPipelineJob?.status || "").toUpperCase();
    if (!status) return;
    if (isFailedJobStatus(status)) {
      setProductAdPipelineJobId(null);
      addActivity("Product ad agent failed", activeProductIntelligenceBrief?.displayName || "Product campaign");
      flash(productAdPipelineJob?.errorMessage || productAdPipelineJob?.message || "Product ad agent failed. Try again.", "error");
      void refetchWallet?.();
      return;
    }
    if (!isCompletedJobStatus(status)) return;

    const result = productAdPipelineJob?.result || productAdPipelineJob?.outputPayload || {};
    const enrichedBrief = productAdBriefFromPipelineResult(result, activeProductAdBrief);
    if (enrichedBrief) {
      setProductAdBrief(enrichedBrief);
    }
    const productWorkflowState = workflowStateFromProductAdPipelineResult(result, activeProductAdBrief);
    if (productWorkflowState?.lockedBrief) {
      setLockedBrief(productWorkflowState.lockedBrief);
    }
    if (productWorkflowState?.storyScriptIdea) {
      setStoryScriptIdea(productWorkflowState.storyScriptIdea);
      setSavedStoryIdeaId(productWorkflowState.storyScriptIdea.id || productWorkflowState.storyScriptIdea.storyIdeaId || null);
    }
    if (productWorkflowState?.scriptDetailIdea) {
      setScriptDetailIdea(productWorkflowState.scriptDetailIdea);
      setScreenplayApprovedForVideo(true);
      dispatch(completeStep("ideas"));
      dispatch(completeStep("script"));
      dispatch(completeStep("screenplay"));
    }
    const preparedRunId = runIdFromVideoPayload(result?.screenplayVideoRunJob?.result)
      || runIdFromVideoPayload(result?.screenplayVideoRunJob?.outputPayload)
      || runIdFromVideoPayload(result?.screenplayVideoRunJob)
      || runIdFromVideoPayload(result);
    if (preparedRunId) {
      setScreenplayVideoRunId(preparedRunId);
    }
    setProductAdPipelineJobId(null);
    if (productWorkflowState?.scriptDetailIdea) {
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      window.history.replaceState(null, "", "/#screenplay");
    }
    addActivity("Product ad agent completed", enrichedBrief?.displayName || activeProductIntelligenceBrief?.displayName || "Product campaign");
    flash("Product strategy, image anchors, dialogue, captions, and music plan are ready.", "success");
    void refetchScreenplayVideoRun?.();
    void refetchWallet?.();
  }, [productAdPipelineJob?.status, productAdPipelineJob?.progress, refetchWallet]);

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
    setStoryboardSaved(true);
    setStoryboardJobId(null);
    dispatch(completeStep("storyboard"));
    if (isUuid(storyboardResult?.projectId || activeProjectId)) {
      dispatch(setProjectId(storyboardResult?.projectId || activeProjectId));
    }
    addActivity("Storyboard generated", selectedIdea?.title || "Locked idea");
    if (productStoryboardMode && storyboardResult?.scenes?.length) {
      void handleGenerateAllScreenplaySceneImages(storyboardResult.scenes);
    }
    flash(
      productStoryboardMode
        ? "Storyboard, lighting, and DP sheets generated. Product frames are now rendering."
        : "Storyboard, lighting build sheets, and DP camera sheets generated",
      "success"
    );
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

  const canRunPaidModelAction = (actionLabel = "paid AI generation", details = {}) => {
    if (walletLoading) return true;
    const minimumBalance = Number(details.minimumBalance) > 0 ? Number(details.minimumBalance) : paidGenerationMinimumBalance;
    if (walletBalanceAmount >= minimumBalance) return true;
    openRechargeForPaidAction(actionLabel, { minimumBalance });
    return false;
  };

  const handlePaidModelError = (error, fallback, actionLabel = "paid AI generation") => {
    if (isInsufficientBalanceError(error)) {
      openRechargeForPaidAction(actionLabel, { minimumBalance: minimumBalanceFromError(error) });
      return;
    }
    flash(apiErrorMessage(error, fallback), "error");
  };

  const clearCampaignAngleSelection = () => {
    setCampaignAngleSuggestions([]);
    setSelectedCampaignAngle(null);
  };

  const handleOriginalIdeaChange = (value) => {
    setManualIdeaDraft(value);
    clearCampaignAngleSelection();
  };

  const handleProductAdBriefChange = (value) => {
    setProductAdBrief(normalizeProductAdBrief(value));
    clearCampaignAngleSelection();
  };

  const handleUploadProductReferenceImages = async (selectedFiles = []) => {
    const existingAssets = firstArray(activeProductAdBrief.imageAssets);
    const remainingSlots = Math.max(0, 8 - productReferenceUrlsFromBrief(activeProductAdBrief).length);
    const files = (Array.isArray(selectedFiles) ? selectedFiles : Array.from(selectedFiles || []))
      .filter(Boolean)
      .slice(0, remainingSlots);
    if (!remainingSlots) {
      flash("Remove a product image before adding another. You can attach up to 8.", "warning");
      return;
    }
    if (!files.length) return;
    const invalidFile = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(String(file?.type || "").toLowerCase()));
    if (invalidFile) {
      flash("Product references must be JPG, PNG, or WebP images.", "error");
      return;
    }
    try {
      const optimizedFiles = await Promise.all(files.map(optimizeProductReferenceFile));
      const result = await uploadProductReferenceImages(optimizedFiles).unwrap();
      const uploadedAssets = firstArray(result?.images, result?.assets)
        .filter((asset) => asset && typeof asset === "object");
      const uploadedUrls = uniqueStrings([
        ...splitProductImageUrls(result?.imageUrls),
        ...uploadedAssets.map(productReferenceAssetUrl).filter(Boolean),
      ]);
      if (!uploadedAssets.length || !uploadedUrls.length) {
        throw new Error("The upload completed without reusable product image details.");
      }
      setProductAdBrief((currentValue) => {
        const current = normalizeProductAdBrief(currentValue);
        const imageAssets = uniqueProductReferenceAssets([
          ...firstArray(current.imageAssets),
          ...uploadedAssets,
        ]).slice(0, 8);
        const sourceProductImageUrls = uniqueStrings([
          ...splitProductImageUrls(current.sourceProductImageUrls || current.imageUrls),
          ...uploadedUrls,
        ]).slice(0, 8);
        return normalizeProductAdBrief({
          ...current,
          imageAssets,
          uploadedImageUrls: sourceProductImageUrls,
          sourceProductImageUrls,
          imageUrls: sourceProductImageUrls,
        });
      });
      clearCampaignAngleSelection();
      flash(`${uploadedAssets.length} product image${uploadedAssets.length === 1 ? "" : "s"} attached and ready for AI analysis.`, "success");
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the product images."), "error");
    }
  };

  const handleTopicTypeChange = (value) => {
    setTopicType(value);
    clearCampaignAngleSelection();
  };

  const handleGenerateCampaignAngles = async () => {
    if (creativeFlow !== "guided") {
      flash("Switch to Guided angle to video to generate campaign angles.", "error");
      return;
    }
    const ideaText = String(manualIdeaDraft || "").trim();
    if (!lockedBrief?.backendLocked || !isUuid(lockedBrief?.lockedIdeaId)) {
      flash("Save the brief before generating campaign angles.", "error");
      return;
    }
    if (!canRunPaidModelAction("AI campaign angle generation")) return;

    try {
      const result = await suggestCampaignAngles({
        projectId: isUuid(lockedBrief?.projectId || activeProjectId) ? (lockedBrief?.projectId || activeProjectId) : undefined,
        ideaText: ideaText || lockedBrief.description || lockedBrief.title,
        topicType,
        adFormat: activeProductAdBrief.adFormat,
        campaignObjective: activeProductIntelligenceBrief?.campaignObjective,
        targetAudience: firstString(
          activeProductIntelligenceBrief?.productUnderstanding?.targetAudience,
          activeProductIntelligenceBrief?.targetAudience
        ),
        productionStyle,
        dialogueLanguage,
        screenType,
        storytellingType,
        hookLens,
        durationSeconds: selectedDuration,
        selectedShotTypes: activeProductIntelligenceBrief?.selectedShotTypes || activeProductAdBrief.selectedShotTypes || [],
        brandContext: brandContextFromProductIntelligence(activeProductIntelligenceBrief),
        productIntelligenceBrief: hasActiveProductAdInput ? activeProductIntelligenceBrief : undefined,
      }).unwrap();
      const suggestions = (Array.isArray(result?.angles) ? result.angles : [])
        .map((angle, index) => ({
          ...angle,
          id: angle?.id || `angle-${index + 1}`,
          provider: result?.provider,
          model: result?.model,
          promptRunId: result?.promptRunId,
        }))
        .filter((angle) => angle.title && angle.description);
      if (!suggestions.length) {
        throw new Error("The AI response did not contain campaign angles.");
      }
      setCampaignAngleSuggestions(suggestions);
      setSelectedCampaignAngle(null);
      addActivity("AI campaign angles ready", `${suggestions.length} directions for ${lockedBrief.title || ideaText || activeProductIntelligenceBrief?.displayName || "your brief"}`);
      flash("Choose one campaign angle to guide the full workflow.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not generate AI campaign angles.", "AI campaign angle generation");
    }
  };

  const handleCampaignAngleSelect = async (angle) => {
    if (!angle?.title || !angle?.description) return;
    if (!lockedBrief?.backendLocked || !isUuid(lockedBrief?.lockedIdeaId)) {
      flash("Save the brief before selecting a campaign angle.", "error");
      return;
    }
    const selected = {
      ...angle,
      generatedBy: "ai",
      selectedAt: new Date().toISOString(),
    };
    try {
      const saved = await selectLockedCampaignAngle({
        lockedIdeaId: lockedBrief.lockedIdeaId,
        campaignAngle: selected,
      }).unwrap();
      setSelectedCampaignAngle(selected);
      setLockedBrief((current) => ({
        ...current,
        campaignAngle: selected,
        selectionPayload: saved?.selectionContext?.selectionPayload || current?.selectionPayload,
      }));
      if (hasActiveProductAdInput) {
        setProductAdBrief((current) => normalizeProductAdBrief({ ...current, campaignAngle: selected }));
      }
    } catch (error) {
      handlePaidModelError(error, "Could not save the selected campaign angle.", "campaign angle selection");
      return;
    }
    addActivity("Campaign angle selected", selected.title);
    flash(`Selected "${selected.title}". It will guide the generated story and scenes.`, "success");
  };

  const buildIdeaSelectionPayload = ({ sourceType, idea, trend }) => {
    const isTrendSource = sourceType === "TREND";
    const productIntelligenceBrief = !isTrendSource && hasActiveProductAdInput
      ? buildProductIntelligenceBrief(activeProductAdBrief, manualIdeaDraft, {
        countryCode: country.code,
        durationSeconds: selectedDuration,
        topicType,
        productionStyle,
        dialogueLanguage,
        screenType,
        storytellingType,
        hookLens,
        brollStyle,
        captionStyle,
        campaignAngle: activeCampaignAngle,
      })
      : null;
    const productSelectionPayload = productIntelligenceBrief ? {
      briefMode: PRODUCT_AD_BRIEF_MODE,
      marketingAgentMode: true,
      productInputKey: productAdInputKey(productIntelligenceBrief),
      productIntelligenceBrief,
      productUnderstanding: productIntelligenceBrief.productUnderstanding,
      adConceptLanes: PRODUCT_AD_CONCEPT_LANES,
      brandContext: brandContextFromProductIntelligence(productIntelligenceBrief),
      campaignObjective: productIntelligenceBrief.campaignObjective,
      campaignAngle: activeCampaignAngle,
    } : {};
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
      topicType,
      ...activeVideoStylePayload,
      selectionPayload: {
        selectedFrom: isTrendSource ? "trend_cloud" : "own_idea",
        aiProvider: aiProviderContext,
        storytellingType,
        hookLens,
        topicType,
        campaignAngle: activeCampaignAngle,
        ...activeVideoStylePayload,
        ...productSelectionPayload,
        idea: productIntelligenceBrief ? {
          ...idea,
          briefMode: PRODUCT_AD_BRIEF_MODE,
          productInputKey: productAdInputKey(productIntelligenceBrief),
          productIntelligenceBrief,
        } : idea,
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
      topicType,
      productIntelligenceBrief: productIntelligenceBriefFromEntity(brief) || activeProductIntelligenceBrief,
      adConceptLanes: PRODUCT_AD_CONCEPT_LANES,
      ...activeVideoStylePayload,
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
          briefDescription: brief.description || brief.title,
          topicType,
          productIntelligenceBrief: productIntelligenceBriefFromEntity(brief) || activeProductIntelligenceBrief,
          adConceptLanes: PRODUCT_AD_CONCEPT_LANES,
          ...activeVideoStylePayload,
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
            briefDescription: brief.description || brief.title,
            topicType,
            productIntelligenceBrief: productIntelligenceBriefFromEntity(brief) || activeProductIntelligenceBrief,
            adConceptLanes: PRODUCT_AD_CONCEPT_LANES,
            ...activeVideoStylePayload,
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
    setProductAdBrief(normalizeProductAdBrief());
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
    setVideoFinishingPlan(normalizeVideoFinishingPlan());
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
    const videoProvider = normalizeScreenplayVideoProvider(activeScreenplayVideoPayload.provider);
    const videoModel = activeScreenplayVideoPayload.model;
    const maxClipSeconds = maxClipSecondsForVideoProvider(videoProvider, videoModel);

    productionPlanStartInFlightRef.current = true;
    try {
      const job = await generateProductionPlansAsync({
        scriptId: scriptDetailIdea.scriptId,
        styleKey: "indian_creator_pencil",
        videoProvider,
        videoModel,
        maxClipSeconds,
        ...activeFounderAvatarPayload,
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
        videoProvider: activeScreenplayVideoPayload.provider,
        videoModel: activeScreenplayVideoPayload.model,
        maxClipSeconds: activeScreenplayVideoPayload.maxClipSeconds,
        ...activeFounderAvatarPayload,
      }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (!jobId) {
        throw new Error("Shot generation job did not return a job id.");
      }
      setStoryboardJobId(jobId);
      setWorkspacePage("storyboard");
      dispatch(setActiveStep("storyboard"));
      addActivity("Shot generation started", `${productionPlanTags.length || "All"} shots queued`);
      flash(
        productStoryboardMode
          ? "Shot generation started. Storyboard, lighting, DP, and product frames will appear as they complete."
          : "Shot generation started. Storyboard, lighting, and DP cards will appear as the job progresses.",
        "success"
      );
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

  const handleUploadStoryboardReferenceImage = async (event) => {
    const file = event?.target?.files?.[0];
    if (event?.target) event.target.value = "";
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and save the screenplay before attaching a storyboard reference image.", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return null;
    }
    if (!file) return null;
    setStoryboardReferenceUploadError("");
    try {
      const asset = await uploadScreenplayVideoReferenceImage({
        scriptId: scriptDetailIdea.scriptId,
        file,
        details: storyboardReferenceDetails,
        enhanceScreenplay: storyboardEnhanceWithReference,
      }).unwrap();
      const normalizedAsset = normalizeStoryboardReferenceAsset(asset);
      setStoryboardReferenceAssets((current) => mergeStoryboardReferenceAssets(current, [normalizedAsset]));
      setScriptDetailIdea((current) => applyStoryboardReferenceToScriptIdea(
        current,
        [normalizedAsset],
        storyboardReferenceDetails,
        storyboardEnhanceWithReference
      ));
      setStoryboardSaved(false);
      addActivity("Storyboard reference attached", asset?.details || asset?.originalFilename || "Image anchor");
      flash(
        storyboardEnhanceWithReference
          ? "Reference image attached and screenplay context enhanced for storyboard generation."
          : "Reference image attached for storyboard generation.",
        "success"
      );
      return asset;
    } catch (error) {
      const message = apiErrorMessage(error, "Could not upload the storyboard reference image.");
      setStoryboardReferenceUploadError(message);
      flash(message, "error");
      return null;
    }
  };

  const handleToggleStoryboardReferenceEnhancement = (enabled) => {
    setStoryboardEnhanceWithReference(Boolean(enabled));
    setScriptDetailIdea((current) => applyStoryboardReferenceToScriptIdea(
      current,
      storyboardReferenceAssets,
      storyboardReferenceDetails,
      Boolean(enabled)
    ));
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

  const handleGenerateShotImage = async (scene, imageKind = "storyboard", imageOptions = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before rendering images.", "error");
      return null;
    }
    if (shotPlanLoading) {
      flash("Shot plans are still generating. Please wait before rendering images.", "warning");
      return null;
    }
    const normalizedImageKind = normalizeImageAssetKind(imageKind);
    const shotNumber = Number(scene?.shotNumber || 1);
    const effectivePlans = productionPlanTags.length ? productionPlanTags : extractProductionPlanTagsFromScenes(scenes);
    const matchingPlan = productionPlanForShot(effectivePlans, scene, shotNumber);
    if (!hasProductionPlanImageKindData(matchingPlan || scene, normalizedImageKind)) {
      const planLabel = normalizedImageKind === "dp" ? "camera/DP" : normalizedImageKind;
      flash(`Generate ${planLabel} shot plan JSON for shot ${shotNumber} before rendering this image.`, "error");
      return null;
    }
    if (!canRunPaidModelAction(`${normalizedImageKind === "dp" ? "DP" : normalizedImageKind} image generation`)) return null;
    const loadingKey = shotImageLoadingKey(shotNumber, normalizedImageKind);
    setShotImageLoadingKeys((current) => current.includes(loadingKey) ? current : [...current, loadingKey]);
    try {
      // productionImagePrompt is the full backend-rendered prompt echoed back for
      // display/debugging (can run past 12000 chars) - it must never be resubmitted as an
      // imagePrompt override, or each plain Redo compounds it into buildProductionImagePrompt's
      // own template again and eventually trips the server's @Size(max=12000) validation.
      const requestedImagePrompt = firstText(
        imageOptions.imagePrompt,
        imageOptions.productImagePrompt,
        scene?.productImagePrompt,
        scene?.imagePrompt,
        scene?.storyboardImagePrompt,
        scene?.visualPrompt
      );
      const requestedReferenceImageUrls = uniqueStrings([
        ...(Array.isArray(imageOptions.referenceImageUrls) ? imageOptions.referenceImageUrls : []),
        ...(Array.isArray(imageOptions.productReferenceImageUrls) ? imageOptions.productReferenceImageUrls : []),
        ...(Array.isArray(imageOptions.canonicalProductImageUrls) ? imageOptions.canonicalProductImageUrls : []),
        ...(Array.isArray(scene?.visualReferenceImageUrls) ? scene.visualReferenceImageUrls : []),
        ...(Array.isArray(scene?.visualReferenceImages)
          ? scene.visualReferenceImages.map((asset) => firstText(asset?.signedUrl, asset?.publicUrl, asset?.assetUrl, asset?.url))
          : []),
        ...(normalizedImageKind === "production" && (imageOptions.productLed || productStoryboardMode || activeVideoFinishingPlan?.imageLedAdMode)
          ? productReferenceUrlsFromBrief(storyboardProductBrief || activeProductIntelligenceBrief)
          : []),
      ]).slice(0, 9);
      const result = await generateShotImage({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        imageKind: normalizedImageKind,
        screenType: scriptDetailIdea.screenType || scriptDetailIdea.scriptJson?.screenType || screenType,
        signedUrlTtlSeconds: 604800,
        imagePrompt: requestedImagePrompt,
        productReferenceDetails: firstText(
          imageOptions.referenceImageDetails,
          imageOptions.productReferenceDetails,
          storyboardReferenceDetails
        ),
        productReferenceImageUrls: requestedReferenceImageUrls,
        ...(normalizedImageKind === "production" ? {
          productLed: Boolean(imageOptions.productLed ?? (productStoryboardMode || activeVideoFinishingPlan?.imageLedAdMode)),
        } : {}),
      }).unwrap();
      const resultScene = normalizeShotImageResult(result, scene, shotNumber, normalizedImageKind);
      let normalizedScene = normalizeStoryboardResponse(
        { scenes: [resultScene], screenType: resultScene.screenType || result.screenType || screenType, renderWidth: resultScene.renderWidth || result.renderWidth, renderHeight: resultScene.renderHeight || result.renderHeight },
        scriptDetailIdea
      ).scenes[0];
      if (normalizedImageKind === "storyboard") {
        const storyboardImageUrl = firstText(
          result?.storyboardImageUrl,
          result?.storyboard_image_url,
          result?.signedUrl,
          result?.signed_url,
          resultScene?.storyboardImageUrl,
          resultScene?.storyboard_image_url,
          resultScene?.signedUrl,
          resultScene?.imageUrl,
          resultScene?.assetUrl
        );
        const storyboardImageAsset = {
          assetId: firstText(result?.imageAssetId, result?.image_asset_id, result?.storyboardImageAssetId, result?.storyboard_image_asset_id, resultScene?.imageAssetId, resultScene?.image_asset_id),
          bucket: firstText(result?.bucket, resultScene?.bucket),
          objectKey: firstText(result?.objectKey, result?.object_key, result?.storyboardObjectKey, result?.storyboard_object_key, resultScene?.objectKey, resultScene?.object_key),
          contentType: firstText(result?.contentType, result?.content_type, resultScene?.contentType, resultScene?.content_type, "image/jpeg"),
          assetUrl: storyboardImageUrl,
          signedUrl: storyboardImageUrl,
          publicUrl: storyboardImageUrl,
          assetType: "STORYBOARD_IMAGE",
          assetKind: "storyboard",
          imageKind: "storyboard",
        };
        normalizedScene = {
          ...normalizedScene,
          imageKind: "storyboard",
          storyboardImage: storyboardImageAsset,
          storyboardImageUrl,
          signedUrl: storyboardImageUrl,
          imageUrl: storyboardImageUrl,
          publicUrl: storyboardImageUrl,
          assetUrl: storyboardImageUrl,
          imageAssetId: storyboardImageAsset.assetId,
          storyboardRevisionAt: new Date().toISOString(),
        };
      } else if (normalizedImageKind === "production") {
        const productionImageUrl = firstText(
          result?.productionImageUrl,
          result?.production_image_url,
          resultScene?.productionImageUrl,
          resultScene?.production_image_url,
          result?.signedUrl,
          result?.signed_url,
          resultScene?.signedUrl,
          resultScene?.imageUrl,
          resultScene?.assetUrl
        );
        const productionImagePrompt = firstText(
          result?.productionImagePrompt,
          result?.production_image_prompt,
          resultScene?.productionImagePrompt,
          resultScene?.production_image_prompt,
          imageOptions.imagePrompt,
          imageOptions.productImagePrompt,
          scene?.productImagePrompt,
          scene?.productionImagePrompt
        );
        const productionImageAsset = {
          assetId: firstText(result?.productionImageAssetId, result?.production_image_asset_id, result?.imageAssetId, result?.image_asset_id, resultScene?.imageAssetId, resultScene?.image_asset_id),
          bucket: firstText(result?.bucket, resultScene?.bucket),
          objectKey: firstText(result?.productionObjectKey, result?.production_object_key, result?.objectKey, result?.object_key, resultScene?.objectKey, resultScene?.object_key),
          contentType: firstText(result?.contentType, result?.content_type, resultScene?.contentType, resultScene?.content_type, "image/jpeg"),
          assetUrl: productionImageUrl,
          signedUrl: productionImageUrl,
          publicUrl: productionImageUrl,
          assetType: "PRODUCT_SCENE_FRAME",
          assetKind: "generated_product_scene_frame",
          referenceRole: "generated_product_scene_frame",
        };
        normalizedScene = {
          ...normalizedScene,
          imageKind: "production",
          productionImage: productionImageAsset,
          productionImageUrl,
          generatedProductImageUrl: productionImageUrl,
          generatedProductImageAssets: [productionImageAsset],
          imageAnchorUrl: productionImageUrl,
          // productionImagePrompt is display/debug-only (the full backend-rendered prompt) -
          // never mirror it into productImagePrompt, which every Redo fallback chain treats as
          // a short, resubmittable creative brief.
          productionImagePrompt,
        };
      }
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
      return normalizedScene;
    } catch (error) {
      if (!imageOptions.suppressErrorFlash) {
        handlePaidModelError(error, `Could not render ${normalizedImageKind} image for shot ${shotNumber}.`, `${normalizedImageKind === "dp" ? "DP" : normalizedImageKind} image generation`);
      }
      if (imageOptions.throwOnError) {
        throw error;
      }
      return null;
    } finally {
      setShotImageLoadingKeys((current) => current.filter((key) => key !== loadingKey));
    }
  };

  const handleAnalyzeShotProductReference = async (scene, file, classification) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate screenplay before attaching a product reference.", "error");
      return null;
    }
    const shotNumber = Number(scene?.shotNumber || 1);
    try {
      const result = await analyzeShotProductReference({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        file,
        classification,
      }).unwrap();
      if (classification === "INSPIRATION" && result?.analysis?.mismatches?.length) {
        flash("This reference doesn't fully match your current planning - review before attaching it.", "warning");
      }
      return result;
    } catch (error) {
      creatorDebugLog("shot product reference analyze failed", { scriptId: scriptDetailIdea?.scriptId, shotNumber, error });
      flash("Could not analyze the reference photo. Try again.", "error");
      return null;
    }
  };

  const handleConfirmShotProductReference = async (scene, reference, options = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId) || !reference) {
      return null;
    }
    const shotNumber = Number(scene?.shotNumber || 1);
    try {
      const result = await confirmShotProductReference({
        scriptId: scriptDetailIdea.scriptId,
        shotNumber,
        bucket: reference.bucket,
        objectKey: reference.objectKey,
        url: reference.url,
        classification: reference.classification,
        castProfileId: reference.castProfileId || "",
        castDisplayName: reference.castDisplayName || "",
        approvedUpdates: Array.isArray(options.approvedUpdates) ? options.approvedUpdates : [],
        ignoreSubject: Boolean(options.ignoreSubject),
        detectedSubject: options.detectedSubject || "",
        dominantMood: options.dominantMood || "",
        cameraAngle: options.cameraAngle || "",
        lightingStyle: options.lightingStyle || "",
        motion: options.motion || "",
      }).unwrap();
      addActivity(
        reference.classification === "CAST" ? "Cast reference attached" : "Style reference attached",
        result?.planningUpdated ? `Shot ${shotNumber} - planning updated (${(result.updatedFields || []).join(", ")})` : `Shot ${shotNumber} - regenerate the product frame to apply it`
      );
      flash(
        result?.planningUpdated
          ? "Reference attached and planning updated."
          : "Reference photo attached. Regenerate this shot's product frame to apply it.",
        "success"
      );
      return result;
    } catch (error) {
      creatorDebugLog("shot product reference confirm failed", { scriptId: scriptDetailIdea?.scriptId, shotNumber, error });
      flash("Could not attach the reference photo. Try again.", "error");
      return null;
    }
  };

  const handleApplyCastReferenceToOtherShots = async (reference, shotNumbers = []) => {
    const targets = Array.from(new Set(shotNumbers.map(Number))).filter(Boolean);
    if (!reference || !targets.length) return;
    let appliedCount = 0;
    for (const shotNumber of targets) {
      // eslint-disable-next-line no-await-in-loop
      const result = await handleConfirmShotProductReference({ shotNumber }, reference, { approvedUpdates: [] });
      if (result) appliedCount += 1;
    }
    if (appliedCount) {
      addActivity("Cast reference applied to more shots", `${appliedCount} additional shot${appliedCount === 1 ? "" : "s"} - regenerate each product frame to apply it`);
      flash(`Applied to ${appliedCount} more shot${appliedCount === 1 ? "" : "s"}. Regenerate each one's product frame when ready.`, "success");
    }
  };

  const handleStageShotProductReference = (scene, file, classification, castName) => {
    const shotNumber = Number(scene?.shotNumber || 1);
    setPendingProductReferences((current) => {
      const next = new Map(current);
      next.set(shotNumber, { scene, file, classification, castName });
      return next;
    });
    flash(`Reference staged for shot ${shotNumber}. Analyze it from the toolbar when you're ready.`, "success");
  };

  const handleAnalyzeStagedProductReferences = async () => {
    const staged = Array.from(pendingProductReferences.values());
    if (!staged.length || analyzingStagedProductReferences) return;
    setAnalyzingStagedProductReferences(true);
    setPendingProductReferences(new Map());
    try {
      for (const item of staged) {
        const shotNumber = Number(item.scene?.shotNumber || 1);
        const result = await handleAnalyzeShotProductReference(item.scene, item.file, item.classification);
        if (!result?.reference) continue;
        const mismatches = Array.isArray(result.analysis?.mismatches) ? result.analysis.mismatches : [];
        const isCast = item.classification === "CAST";
        if (isCast || !mismatches.length) {
          // No review needed - attach immediately, same as the single-shot "no mismatch" path.
          await handleConfirmShotProductReference(item.scene, { ...result.reference, castDisplayName: item.castName }, {
            approvedUpdates: [],
            detectedSubject: result.analysis?.detectedSubject || "",
            dominantMood: result.analysis?.dominantMood || "",
            cameraAngle: result.analysis?.cameraAngle || "",
            lightingStyle: result.analysis?.lightingStyle || "",
            motion: result.analysis?.motion || "",
          });
        } else {
          // A mismatch needs a human decision - stash the analysis so opening this shot's detail
          // panel resumes straight into the review state instead of losing the (already-paid-for)
          // analysis and forcing the user to re-upload and re-analyze.
          setPendingProductMismatchReviews((current) => {
            const next = new Map(current);
            next.set(shotNumber, result);
            return next;
          });
          flash(`Shot ${shotNumber}'s reference needs review - open that shot to resolve it.`, "warning");
        }
      }
    } finally {
      setAnalyzingStagedProductReferences(false);
    }
  };

  const handleConsumeProductMismatchReview = (shotNumber) => {
    setPendingProductMismatchReviews((current) => {
      if (!current.has(shotNumber)) return current;
      const next = new Map(current);
      next.delete(shotNumber);
      return next;
    });
  };

  const handleGenerateAllScreenplaySceneImages = async (candidateScenes = [], options = {}) => {
    if (productShotImagesGenerating) return;
    const sourceScenes = Array.isArray(candidateScenes) && candidateScenes.length
      ? candidateScenes
      : scriptDetailIdea?.scriptScenes?.length
        ? scriptDetailIdea.scriptScenes
        : scriptDetailIdea?.scriptJson?.shots || scenes;
    if (!sourceScenes.length) return;
    setProductShotImagesGenerating(true);
    let generatedCount = 0;
    try {
      for (const scene of sourceScenes) {
        const existingImage = normalizeShotImageFields(scene).productionImageUrl;
        if (options.force || !existingImage) {
          const generated = await handleGenerateShotImage(scene, "production", {
            productLed: true,
            imagePrompt: defaultProductImagePrompt(scene),
            productReferenceImageUrls: productReferenceUrlsFromBrief(storyboardProductBrief || activeProductIntelligenceBrief),
          });
          if (generated) generatedCount += 1;
        }
      }
      if (generatedCount > 0) {
        addActivity("Product frames generated", `${generatedCount} shot${generatedCount === 1 ? "" : "s"} ready`);
      }
    } finally {
      setProductShotImagesGenerating(false);
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

  const handleApproveScreenplayForVideo = async () => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and save the screenplay before approval.", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return false;
    }
    const lockedIdeaId = resolveWorkflowLockedIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, lockedBrief);
    const storyIdeaId = resolveWorkflowStoryIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, { id: savedStoryIdeaId });
    if (!isUuid(lockedIdeaId) || !isUuid(storyIdeaId)) {
      flash("Backend screenplay approval needs the saved locked idea and story idea ids.", "error");
      return false;
    }
    try {
      const targetProvider = normalizeScreenplayVideoProvider(activeScreenplayVideoPayload.provider);
      const targetModel = activeScreenplayVideoPayload.model;
      const maxClipSeconds = maxClipSecondsForVideoProvider(targetProvider, targetModel);
      const result = await approveScreenplay({
        lockedIdeaId,
        storyIdeaId,
        scriptId: scriptDetailIdea.scriptId,
        approvalSource: "creator_ui_video_generation",
        targetProvider,
        targetModel,
        maxClipSeconds,
        videoModelCapability: videoModelCapabilityForScreenplay(targetProvider, targetModel),
        durationSeconds: selectedDuration,
        screenType,
        topicType,
        ...activeScreenplayVideoPayload,
      }).unwrap();
      setScreenplayApprovedForVideo(true);
      dispatch(completeStep("screenplay"));
      setScriptDetailIdea((current) => current ? {
        ...current,
        lockedIdeaId,
        storyIdeaId,
        status: result?.status || result?.scriptStatus || "SCREENPLAY_APPROVED",
        approval: result?.approval || result?.screenplayApproval || current.approval || null,
      } : current);
      addActivity("Screenplay approved", scriptDetailIdea?.title || "Video render");
      flash("Screenplay approved for video generation.", "success");
      return true;
    } catch (error) {
      flash(apiErrorMessage(error, "Screenplay approval failed. The backend approval endpoint may not be available yet."), "error");
      return false;
    }
  };

  const handleGenerateScreenplayVideo = async (generationOptions = {}) => {
    const preparingSceneWorkspace = generationOptions.prepareOnly === true
      || generationOptions.generationWorkflow === "scene_by_scene";
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and approve the screenplay before video generation.", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return;
    }
    if (!effectiveScreenplayApprovedForVideo) {
      flash("Approve the screenplay before preparing shot video generation.", "error");
      return;
    }
    const activeRunScenes = Array.isArray(currentScreenplayVideoRun?.scenes)
      ? currentScreenplayVideoRun.scenes
      : Array.isArray(currentScreenplayVideoRun?.sceneClips)
        ? currentScreenplayVideoRun.sceneClips
        : [];
    // generatedShotNumbers comes from creator_assets (reliable) rather than the JSONB
    // videoRun snapshot, which an unrelated job failure can leave stale/incomplete - prefer
    // it so "run complete pipeline" correctly skips shots already generated even when the
    // old run payload undercounts them.
    const resumingStoredRun = !generationOptions.forceNewRun
      && (
        (generatedShotNumbers.size > 0 && expectedShotTakeCount > generatedShotNumbers.size)
        || (activeRunScenes.some(screenplaySceneHasGeneratedClip)
          && activeRunScenes.some((scene) => !screenplaySceneHasGeneratedClip(scene)))
      );
    if (!preparingSceneWorkspace
        && !resumingStoredRun
        && !canRunPaidModelAction("60-second AI video production", { minimumBalance: creatorFlowMinimumBalance })) return;
    const screenplayScenes = scriptDetailIdea?.scriptScenes?.length
      ? scriptDetailIdea.scriptScenes
      : scriptDetailIdea?.scriptJson?.shots?.length
        ? scriptDetailIdea.scriptJson.shots
        : scenes;
    const sceneModeOverrides = normalizeVideoSceneModeOverrides(
      generationOptions.sceneModeOverrides || {},
      screenplayScenes,
      productionStyle,
      generationOptions.hybridSceneMode || hybridSceneMode
    );
    const requestedVideoFinishingPlan = normalizeVideoFinishingPlan(generationOptions.videoFinishingPlan || activeVideoFinishingPlan);
    try {
      const provider = normalizeScreenplayVideoProvider(generationOptions.provider || activeScreenplayVideoPayload.provider);
      const model = generationOptions.model || activeScreenplayVideoPayload.model;
      const maxClipSeconds = maxClipSecondsForVideoProvider(provider, model);
      const job = await generateScreenplayVideoAsync({
        scriptId: scriptDetailIdea.scriptId,
        targetDurationSeconds: selectedDuration,
        durationSeconds: selectedDuration,
        screenType,
        storytellingType,
        hookLens,
        topicType,
        ...activeScreenplayVideoPayload,
        ...generationOptions,
        dialogueLanguage: generationOptions.dialogueLanguage || dialogueLanguage,
        clientReview,
        typographySystem: scriptDetailIdea?.scriptJson?.typographySystem || {},
        overlayPlan: scriptDetailIdea?.scriptJson?.overlayPlan || [],
        videoDirectorPlan: scriptDetailIdea?.scriptJson?.videoDirectorPlan || {},
        planningPropagation: clientReview?.propagation || scriptDetailIdea?.scriptJson?.planningPropagation || {},
        provider,
        model,
        maxClipSeconds,
        videoModelCapability: videoModelCapabilityForScreenplay(provider, model),
        modelCapabilities: videoModelCapabilityForScreenplay(provider, model),
        dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
        forceNewRun: Boolean(generationOptions.forceNewRun),
        billingConsent: Boolean(generationOptions.billingConsent),
        videoFinishingPlan: requestedVideoFinishingPlan,
        soundDesignPlan: soundDesignPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        imageLedAdPlan: imageLedAdPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        audioProductionPlan: audioProductionPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        editingPlan: editingPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        storyboardReferenceMode: generationOptions.storyboardReferenceMode || (requestedVideoFinishingPlan.useStoryboardReferences ? requestedVideoFinishingPlan.referenceImageMode : "ignore"),
        referenceImageMode: generationOptions.referenceImageMode || requestedVideoFinishingPlan.referenceImageMode,
        requireImageAnchors: Boolean(generationOptions.requireImageAnchors || requestedVideoFinishingPlan.requireImageAnchors),
        sceneModeOverrides,
        screenplayJson: scriptDetailIdea.scriptJson,
        scenes: screenplayScenes,
      }).unwrap();
      const jobId = jobIdFromPayload(job);
      const runId = runIdFromVideoPayload(job);
      const returnedRun = videoRunFromPayload(job);
      const resumedExistingRun = Boolean(returnedRun?.resumedAt || returnedRun?.resumeCount);
      const jobStatus = String(job?.status || job?.jobStatus || "").toUpperCase();
      if (jobId && jobStatus && !isCompletedJobStatus(jobStatus)) {
        setScreenplayVideoJobId(jobId);
      } else {
        setScreenplayVideoJobId(null);
      }
      if (runId) setScreenplayVideoRunId(runId);
      setWorkspacePage("video");
      addActivity(
        preparingSceneWorkspace
          ? "Scene workspace prepared"
          : resumedExistingRun
            ? "Video queue resumed"
            : generationOptions.billingConsent
              ? "Paid full video rerun started"
              : "Full video queue started",
        preparingSceneWorkspace
          ? `${screenplayScenes.length || "All"} scenes are ready for individual generation`
          : resumedExistingRun
            ? "Only missing shots will be generated"
            : generationOptions.billingConsent
              ? "A separate confirmed package run is generating"
              : `${screenplayScenes.length || "All"} shots generating in sequence`
      );
      flash(
        preparingSceneWorkspace
          ? "Scene workspace ready. No video provider was called; generate and review one scene at a time."
          : resumedExistingRun
            ? "Resuming missing shots. Existing generated clips will not be submitted again."
            : generationOptions.billingConsent
              ? "Confirmed full-video rerun started. Its wallet charges will appear in the video ledger."
              : "Full video generation started. Each completed shot will appear here automatically.",
        "success"
      );
      scrollToSection("video");
    } catch (error) {
      handlePaidModelError(error, "Could not prepare the shot queue.", "Shot queue preparation");
    }
  };

  const handleUploadScreenplayVideoReferenceImage = async ({ file, details } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before uploading reference images.", "error");
      return null;
    }
    if (!file) {
      flash("Choose a reference image to upload.", "error");
      return null;
    }
    try {
      const asset = await uploadScreenplayVideoReferenceImage({
        scriptId: scriptDetailIdea.scriptId,
        file,
        details,
      }).unwrap();
      addActivity("Reference image uploaded", asset?.details || asset?.originalFilename || "Product visual anchor");
      flash("Reference image attached for storyboard-level consistency.", "success");
      return asset;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the reference image."), "error");
      return null;
    }
  };

  const handleUploadFounderAvatarSource = async ({ file, details, providerMode, synthesiaAvatarId, synthesiaVoiceId, localVoiceModel, voiceProfileId, localTalkingAvatarModel, localLipSyncModel, localImageModel, localVideoModel, referenceTranscript, previewText, spokenText, pronunciationGuide, elevenLabsVoiceId, sarvamVoiceId, productionEnhancementEnabled, productionEnhancementPrompt, consentConfirmed, language, languageCode } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before uploading the founder source video.", "error");
      return null;
    }
    if (!file) {
      flash("Choose a founder source video to upload.", "error");
      return null;
    }
    try {
      const asset = await uploadScreenplayFounderAvatarSource({
        scriptId: scriptDetailIdea.scriptId,
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
      }).unwrap();
      const normalizedProfile = normalizeFounderAvatarProfileForPlanning(asset?.founderAvatarProfile || asset?.profile || asset);
      setFounderAvatarProfile(normalizedProfile);
      setScriptDetailIdea((current) => applyFounderAvatarProfileToScriptIdea(current, normalizedProfile, asset));
      addActivity("Founder avatar source uploaded", avatarProviderModeLabel(normalizedProfile.avatarProviderMode));
      flash("Founder avatar kit saved for the hybrid video flow.", "success");
      return asset;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the founder source video."), "error");
      return null;
    }
  };

  const applyFounderProfileResult = (result) => {
    const normalizedProfile = normalizeFounderAvatarProfileForPlanning(result?.founderAvatarProfile || result?.profile || result);
    setFounderAvatarProfile(normalizedProfile);
    setScriptDetailIdea((current) => applyFounderAvatarProfileToScriptIdea(current, normalizedProfile, normalizedProfile.sourceAsset || {}));
    return normalizedProfile;
  };

  const applyFounderVoiceResult = (result, activityLabel) => {
    const normalizedProfile = applyFounderProfileResult(result);
    addActivity(activityLabel, voiceApprovalLabelForPlanning(normalizedProfile.voiceApprovalStatus));
    return normalizedProfile;
  };

  const handleSelectFounderAvatar = async (avatar = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate or open a saved screenplay before selecting an avatar.", "error");
      return null;
    }
    const sourceScriptId = firstString(avatar.sourceScriptId, avatar.selectionKey, avatar.id);
    if (!sourceScriptId) {
      flash("Select a ready avatar. Create and approve one first.", "warning");
      return null;
    }
    try {
      const result = await selectReusableFounderAvatar({
        scriptId: scriptDetailIdea.scriptId,
        sourceScriptId,
        avatarId: firstString(avatar.avatarId),
      }).unwrap();
      const normalizedProfile = normalizeFounderAvatarProfileForPlanning(result?.founderAvatarProfile || result?.profile || result);
      setFounderAvatarProfile(normalizedProfile);
      setScriptDetailIdea((current) => applyFounderAvatarProfileToScriptIdea(
        current,
        normalizedProfile,
        normalizedProfile.sourceAsset || {}
      ));
      addActivity("Saved avatar selected", firstString(avatar.name, normalizedProfile.avatarId, "Founder avatar"));
      flash("Avatar selected. Create avatar video will use the current screenplay dialogue.", "success");
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not select the saved avatar."), "error");
      return null;
    }
  };

  const handlePrepareFounderEnglishDialogue = async (request = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before preparing English dialogue.", "error");
      return null;
    }
    if (!canRunPaidModelAction("English dialogue translation")) return null;
    try {
      const result = await prepareFounderEnglishDialogue({
        scriptId: scriptDetailIdea.scriptId,
        sourceDialogueLanguage: firstString(
          request.sourceDialogueLanguage,
          scriptDetailIdea?.dialogueLanguage,
          scriptDetailIdea?.scriptJson?.dialogueLanguage,
          dialogueLanguage,
          "Hinglish"
        ),
        dialogueText: request.dialogueText,
        avatarScript: request.dialogueText,
        voiceModel: "client_rvc_english",
        voiceProfileId: firstString(request.voiceProfileId, "founder_female_v1"),
        founderAvatarProfile: activeFounderAvatarProfile,
      }).unwrap();
      const normalized = applyFounderVoiceResult(result, "English avatar dialogue prepared");
      setDialogueLanguage("English");
      flash("English dialogue is ready. Review it, then generate the client voice preview.", "success");
      return normalized;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not prepare the current dialogue in English."), "error");
      return null;
    }
  };

  const handleGenerateFounderVoicePreview = async (voiceRequest = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before preparing a founder voice.", "error");
      return null;
    }
    if (!canRunPaidModelAction("Founder voice preview")) return null;
    try {
      const result = await generateFounderVoicePreview({
        scriptId: scriptDetailIdea.scriptId,
        ...voiceRequest,
      }).unwrap();
      applyFounderVoiceResult(result, "Founder voice preview ready");
      flash("Mastered voice preview is ready. Approve it to create the lip-sync avatar preview.", "success");
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not generate the founder voice preview."), "error");
      return null;
    }
  };

  const handleFounderVoiceDecision = async (decision, voiceRequest = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) return null;
    try {
      const result = await approveFounderVoicePreview({
        scriptId: scriptDetailIdea.scriptId,
        decision,
        ...voiceRequest,
      }).unwrap();
      const normalized = applyFounderVoiceResult(result, decision === "APPROVE" ? "Founder voice approved" : "Founder voice needs changes");
      flash(decision === "APPROVE" ? "Founder voice approved. Create the fal.ai lip-sync preview next." : "Voice approval reset. Generate another preview.", decision === "APPROVE" ? "success" : "info");
      return normalized;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not update founder voice approval."), "error");
      return null;
    }
  };

  const handlePrepareFounderAvatarPortrait = async ({
    file,
    sourceMode = "extract",
    timestampSeconds = 0.5,
    consentConfirmed = false,
  } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before preparing an avatar portrait.", "error");
      return null;
    }
    try {
      const result = await prepareFounderAvatarPortrait({
        scriptId: scriptDetailIdea.scriptId,
        file,
        sourceMode,
        timestampSeconds,
        consentConfirmed,
      }).unwrap();
      const normalized = applyFounderProfileResult(result);
      addActivity(
        sourceMode === "upload" ? "Founder portrait uploaded" : "Founder portrait extracted",
        "Avatar test portrait ready"
      );
      flash("Founder portrait is ready. Review it before running the avatar quality test.", "success");
      return normalized;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not prepare the founder portrait."), "error");
      return null;
    }
  };

  const handleGenerateFounderAvatarTest = async (testRequest = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before creating an avatar test.", "error");
      return null;
    }
    if (!canRunPaidModelAction("5-second avatar quality test")) return null;
    try {
      const result = await generateFounderAvatarTest({
        scriptId: scriptDetailIdea.scriptId,
        durationSeconds: 5,
        aspectRatio: firstString(
          testRequest.aspectRatio,
          scriptDetailIdea?.aspectRatio,
          scriptDetailIdea?.scriptJson?.aspectRatio,
          "9:16"
        ),
        portraitMode: testRequest.portraitMode,
        motionPrompt: testRequest.motionPrompt,
        previewText: testRequest.previewText,
        talkingAvatarModel: testRequest.talkingAvatarModel,
        lipSyncModel: testRequest.lipSyncModel,
        avatarResolution: testRequest.avatarResolution,
        talkingStyle: testRequest.talkingStyle,
      }).unwrap();
      const normalized = applyFounderProfileResult(result);
      addActivity(
        "Founder avatar quality test ready",
        testRequest.talkingAvatarModel === "fal_heygen_avatar4"
          ? "HeyGen Avatar IV"
          : testRequest.lipSyncModel === "fal_musetalk"
            ? "HappyHorse 1.1 + MuseTalk"
            : "HappyHorse 1.1 + LatentSync"
      );
      flash("Avatar test is ready in the Avatar panel. Review or download the result.", "success");
      return normalized;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not create the founder avatar quality test."), "error");
      return null;
    }
  };

  const handleGenerateFounderAvatarPreview = async (previewRequest = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before creating an avatar preview.", "error");
      return null;
    }
    if (!canRunPaidModelAction("Avatar lip-sync preview")) return null;
    try {
      const result = await generateFounderAvatarPreview({
        scriptId: scriptDetailIdea.scriptId,
        durationSeconds: 8,
        aspectRatio: firstString(
          previewRequest.aspectRatio,
          scriptDetailIdea?.aspectRatio,
          scriptDetailIdea?.scriptJson?.aspectRatio,
          "9:16"
        ),
        previewText: previewRequest.previewText,
      }).unwrap();
      const normalized = applyFounderProfileResult(result);
      addActivity("Founder lip-sync preview ready", avatarApprovalLabelForPlanning(normalized.avatarPreviewStatus));
      flash("fal.ai lip-sync preview is ready in the Avatar panel. Review and approve it before the full run.", "success");
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not create the founder lip-sync preview."), "error");
      return null;
    }
  };

  const handleFounderAvatarDecision = async (decision) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) return null;
    try {
      const result = await approveFounderAvatarPreview({
        scriptId: scriptDetailIdea.scriptId,
        decision,
      }).unwrap();
      const normalized = applyFounderProfileResult(result);
      addActivity(
        decision === "APPROVE" ? "Founder avatar approved" : "Founder avatar needs changes",
        avatarApprovalLabelForPlanning(normalized.avatarPreviewStatus)
      );
      flash(
        decision === "APPROVE"
          ? "Avatar approved. You can edit the final dialogue and run the founder video pipeline."
          : "Avatar preview rejected. Create another lip-sync preview when ready.",
        decision === "APPROVE" ? "success" : "info"
      );
      return normalized;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not update avatar preview approval."), "error");
      return null;
    }
  };

  const handleUploadFounderFinalAudio = async ({ file, captionText, consentConfirmed } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before uploading founder audio.", "error");
      return null;
    }
    if (!file) return null;
    try {
      const result = await uploadFounderFinalAudio({
        scriptId: scriptDetailIdea.scriptId,
        file,
        captionText,
        consentConfirmed,
      }).unwrap();
      applyFounderVoiceResult(result, "Exact founder audio uploaded");
      flash("Exact founder audio saved and approved for lip-sync.", "success");
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the founder audio."), "error");
      return null;
    }
  };

  const handleChatScreenplayVideoScene = async (scene, message, sceneOptions = {}) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId) {
      flash("Prepare the video run before editing an individual shot.", "error");
      return;
    }
    if (!canRunPaidModelAction("Scene chat improvement")) return;
    try {
      const provider = normalizeScreenplayVideoProvider(sceneOptions.provider || activeScreenplayVideoPayload.provider);
      const model = sceneOptions.model || activeScreenplayVideoPayload.model;
      const maxClipSeconds = maxClipSecondsForVideoProvider(provider, model);
      const result = await chatScreenplayVideoScene({
        runId,
        sceneId,
        message,
        editRequest: message,
        sceneNumber: scene?.sceneNumber,
        ...activeScreenplayVideoPayload,
        ...sceneOptions,
        provider,
        model,
        maxClipSeconds,
        videoModelCapability: videoModelCapabilityForScreenplay(provider, model),
        dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
        generationMode: videoGenerationModeForStyle(productionStyle, sceneOptions.generationMode),
      }).unwrap();
      const nextRunId = runIdFromVideoPayload(result);
      if (nextRunId) setScreenplayVideoRunId(nextRunId);
      addActivity("Scene edit saved", scene?.title || `Scene ${scene?.sceneNumber || ""}`.trim());
      flash("Scene edit request saved.", "success");
      void refetchScreenplayVideoRun?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not save the scene edit request."), "error");
    }
  };

  const handleRegenerateScreenplayVideoScene = async (scene, sceneOptions = {}) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId) {
      flash("Prepare the video run before generating a shot.", "error");
      return;
    }
    if (!effectiveScreenplayApprovedForVideo) {
      flash("Approve the screenplay before generating shot video.", "error");
      return;
    }
    const sceneHasClip = screenplaySceneHasGeneratedClip(scene);
    if (!canRunPaidModelAction(sceneHasClip ? "Paid shot regeneration" : "Shot generation")) return;
    setScreenplayVideoActiveSceneId(sceneId);
    try {
      const provider = normalizeScreenplayVideoProvider(sceneOptions.provider || activeScreenplayVideoPayload.provider);
      const model = sceneOptions.model || activeScreenplayVideoPayload.model;
      const maxClipSeconds = maxClipSecondsForVideoProvider(provider, model);
      const job = await (sceneHasClip ? regenerateScreenplayVideoSceneAsync : generateScreenplayVideoSceneAsync)({
        runId,
        sceneId,
        sceneNumber: scene?.sceneNumber,
        ...activeScreenplayVideoPayload,
        ...sceneOptions,
        provider,
        model,
        maxClipSeconds,
        videoModelCapability: videoModelCapabilityForScreenplay(provider, model),
        dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
        generationMode: videoGenerationModeForStyle(productionStyle, sceneOptions.generationMode),
        billingConsent: Boolean(sceneOptions.billingConsent),
      }).unwrap();
      const jobId = jobIdFromPayload(job);
      const nextRunId = runIdFromVideoPayload(job);
      if (jobId) setScreenplayVideoSceneJobId(jobId);
      if (nextRunId) setScreenplayVideoRunId(nextRunId);
      addActivity(sceneHasClip ? "Shot regeneration started" : "Shot generation started", scene?.title || `Shot ${scene?.sceneNumber || ""}`.trim());
      flash(sceneHasClip ? "Shot regeneration started." : "Shot generation started.", "success");
    } catch (error) {
      setScreenplayVideoActiveSceneId(null);
      handlePaidModelError(error, "Could not generate this shot.", "Shot generation");
    }
  };

  const handleGenerateScreenplaySceneDialogueVoice = async (scene, voiceOptions = {}) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId) {
      flash("Prepare the video run before cloning scene dialogue.", "error");
      return null;
    }
    if (!canRunPaidModelAction("Scene dialogue voice clone")) return null;
    try {
      const result = await generateScreenplaySceneDialogueVoice({
        runId,
        sceneId,
        ...voiceOptions,
      }).unwrap();
      addActivity("Scene dialogue cloned", scene?.title || `Scene ${scene?.sceneNumber || ""}`.trim());
      flash("Cloned dialogue is ready. Play it and accept it before creating the avatar.", "success");
      void refetchScreenplayVideoRun?.();
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not clone this scene dialogue."), "error");
      return null;
    }
  };

  const handleDecideScreenplaySceneDialogueVoice = async (scene, decision) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId) return null;
    try {
      const result = await decideScreenplaySceneDialogueVoice({
        runId,
        sceneId,
        decision,
      }).unwrap();
      addActivity(
        decision === "APPROVE" ? "Scene dialogue accepted" : "Scene dialogue rejected",
        scene?.title || `Scene ${scene?.sceneNumber || ""}`.trim()
      );
      flash(
        decision === "APPROVE"
          ? "Scene dialogue accepted. Create avatar is now enabled."
          : "Scene dialogue rejected. Generate another clone.",
        decision === "APPROVE" ? "success" : "warning"
      );
      void refetchScreenplayVideoRun?.();
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not update the scene dialogue decision."), "error");
      return null;
    }
  };

  const handleCombineScreenplaySceneDialogueAudio = async () => {
    const runId = activeScreenplayVideoRunId;
    if (!runId) {
      flash("Prepare the video run before combining scene dialogue.", "error");
      return null;
    }
    try {
      const result = await combineScreenplaySceneDialogueAudio({ runId }).unwrap();
      const included = Number(result?.includedSceneCount || 0);
      const total = Number(result?.totalSceneCount || 0);
      addActivity("Scene dialogue combined", `${included || 0} of ${total || included || 0} tracks`);
      flash(
        included < total
          ? `Combined ${included} of ${total} scene dialogue tracks. Missing scenes were skipped.`
          : "All scene dialogue audio is combined and ready to download.",
        "success"
      );
      void refetchScreenplayVideoRun?.();
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not combine the available scene dialogue audio."), "error");
      return null;
    }
  };

  const handleUploadScreenplaySceneAvatarImage = async (scene, file) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId || !file) return null;
    try {
      const result = await uploadScreenplaySceneAvatarImage({ runId, sceneId, file }).unwrap();
      addActivity("Scene avatar image uploaded", scene?.title || `Scene ${scene?.sceneNumber || ""}`.trim());
      flash("Avatar image attached to this scene.", "success");
      void refetchScreenplayVideoRun?.();
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the scene avatar image."), "error");
      return null;
    }
  };

  const handleUploadScreenplaySceneReferenceImage = async (scene, file, priority) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId || !file) return null;
    try {
      const result = await uploadScreenplaySceneReferenceImage({ runId, sceneId, file, priority }).unwrap();
      addActivity(
        "Scene reference image uploaded",
        `${priority === "override" ? "Replacing" : "Combined with"} existing references for ${scene?.title || `Scene ${scene?.sceneNumber || ""}`.trim()}`
      );
      flash(
        priority === "override"
          ? "Reference image attached. It will replace other references the next time this scene generates."
          : "Reference image attached. It will be combined with other references the next time this scene generates.",
        "success"
      );
      void refetchScreenplayVideoRun?.();
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the scene reference image."), "error");
      return null;
    }
  };

  const handleUploadScreenplaySceneProductionImage = async (scene, file, details) => {
    const runId = activeScreenplayVideoRunId;
    const sceneId = scene?.id || scene?.sceneId || scene?.scene_id;
    if (!runId || !sceneId || !file) return null;
    try {
      const result = await uploadScreenplaySceneProductionImage({ runId, sceneId, file, details }).unwrap();
      addActivity("Scene image uploaded", scene?.title || `Scene ${scene?.sceneNumber || ""}`.trim());
      flash("Image attached to this AI scene.", "success");
      void refetchScreenplayVideoRun?.();
      return result;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the scene image."), "error");
      return null;
    }
  };

  const handleRenderScreenplayFinalVideo = async (renderOptions = {}) => {
    const runId = activeScreenplayVideoRunId;
    if (!runId) {
      flash("Generate all shot clips before merging the final video.", "error");
      return;
    }
    if (!canRunPaidModelAction("Final video merge")) return;
    const requestedVideoFinishingPlan = normalizeVideoFinishingPlan(renderOptions.videoFinishingPlan || activeVideoFinishingPlan);
    const {
      targetDurationSeconds: _ignoredTargetDurationSeconds,
      durationSeconds: _ignoredDurationSeconds,
      ...finalMergePayload
    } = activeScreenplayVideoPayload;
    try {
      const job = await renderScreenplayVideoFinalAsync({
        runId,
        renderMode: "MERGE_SCENE_CLIPS",
        ...finalMergePayload,
        provider: normalizeScreenplayVideoProvider(renderOptions.provider || activeScreenplayVideoPayload.provider),
        model: renderOptions.model || activeScreenplayVideoPayload.model,
        videoFinishingPlan: requestedVideoFinishingPlan,
        soundDesignPlan: soundDesignPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        imageLedAdPlan: imageLedAdPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        audioProductionPlan: audioProductionPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        editingPlan: editingPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        storyboardReferenceMode: requestedVideoFinishingPlan.useStoryboardReferences ? requestedVideoFinishingPlan.referenceImageMode : "ignore",
        referenceImageMode: requestedVideoFinishingPlan.referenceImageMode,
        requireImageAnchors: requestedVideoFinishingPlan.requireImageAnchors,
        acceptedSceneIds: Array.isArray(renderOptions.acceptedSceneIds) ? renderOptions.acceptedSceneIds : [],
        acceptedClipKeys: Array.isArray(renderOptions.acceptedClipKeys) ? renderOptions.acceptedClipKeys : [],
        requireAcceptedScenes: Boolean(renderOptions.requireAcceptedScenes),
      }).unwrap();
      const jobId = jobIdFromPayload(job);
      const nextRunId = runIdFromVideoPayload(job);
      if (jobId) setScreenplayVideoFinalJobId(jobId);
      if (nextRunId) setScreenplayVideoRunId(nextRunId);
      addActivity("Final video merge started", scriptDetailIdea?.title || "Screenplay video");
      flash("Final video merge started.", "success");
    } catch (error) {
      flash(apiErrorMessage(error, "Could not start final video merge."), "error");
    }
  };

  const handleGenerateScreenplayAudioPack = async (audioOptions = {}) => {
    const runId = activeScreenplayVideoRunId;
    if (!runId) {
      flash("Prepare the video run before generating audio.", "error");
      return;
    }
    const audioRequestType = audioOptions.audioRequestType || (
      audioOptions.generateDialogue === false || audioOptions.generateVoice === false ? "background_music" : "dialogue"
    );
    const requestedMusicSource = normalizeAudioMusicSource(audioOptions.musicSource || audioOptions.backgroundMusicSource || "free_licensed");
    const shouldGenerateDialogue = audioOptions.generateDialogue !== false && audioOptions.generateVoice !== false;
    const shouldGenerateAiMusic = requestedMusicSource === "ai_generated" && audioOptions.generateMusic !== false;
    if (shouldGenerateDialogue || shouldGenerateAiMusic) {
      const label = shouldGenerateDialogue && shouldGenerateAiMusic
        ? "Dialogue and AI music generation"
        : shouldGenerateDialogue
          ? "Dialogue generation"
          : "AI music generation";
      if (!canRunPaidModelAction(label)) return;
    }
    const requestedVideoFinishingPlan = normalizeVideoFinishingPlan(activeVideoFinishingPlan);
    try {
      const job = await generateScreenplayVideoAudioPackAsync({
        runId,
        audioRequestType,
        voiceProvider: activeDialogueVoiceProfile.voiceProvider || "google_chirp",
        musicProvider: "google_lyria",
        ...activeDialogueVoiceProfile,
        ...(audioRequestType === "dialogue" ? { preserveExistingMusic: true } : {
          musicSource: requestedMusicSource,
          backgroundMusicSource: requestedMusicSource,
        }),
        musicLayerType: audioOptions.musicLayerType || "background_music",
        backgroundMusicPrompt: audioOptions.backgroundMusicPrompt || requestedVideoFinishingPlan.backgroundMusicPrompt,
        musicPrompt: audioOptions.musicPrompt || requestedVideoFinishingPlan.backgroundMusicPrompt,
        generateDialogue: shouldGenerateDialogue,
        generateVoice: shouldGenerateDialogue,
        forceRegenerateDialogue: Boolean(audioOptions.forceRegenerateDialogue),
        generateMusic: shouldGenerateAiMusic,
        generateAiMusic: shouldGenerateAiMusic,
        durationSeconds: selectedDuration,
        targetDurationSeconds: selectedDuration,
        dialogueLanguage,
        screenType,
        provider: normalizeScreenplayVideoProvider(activeScreenplayVideoPayload.provider),
        model: activeScreenplayVideoPayload.model,
        videoFinishingPlan: requestedVideoFinishingPlan,
        soundDesignPlan: soundDesignPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        audioProductionPlan: audioProductionPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        editingPlan: editingPlanFromVideoFinishingPlan(requestedVideoFinishingPlan),
        srt: scriptDetailIdea?.scriptJson?.srt,
        srtFile: scriptDetailIdea?.scriptJson?.srtFile,
        srtCues: scriptDetailIdea?.scriptJson?.srtCues,
        screenplayJson: scriptDetailIdea?.scriptJson,
      }).unwrap();
      const jobId = jobIdFromPayload(job);
      const nextRunId = runIdFromVideoPayload(job);
      if (jobId) setScreenplayVideoAudioJobId(jobId);
      if (nextRunId) setScreenplayVideoRunId(nextRunId);
      addActivity(audioRequestType === "background_music" ? "Background music preparation started" : "Dialogue voice generation started", scriptDetailIdea?.title || "Screenplay video");
      if (shouldGenerateAiMusic) {
        flash("Generating background music with Google Lyria.", "success");
      } else if (shouldGenerateDialogue) {
        flash(
          activeDialogueVoiceProfile.voiceProvider === "dalai_llama"
            ? "Generating the founder voice clone with DalaiLlama Voice."
            : "Generating or syncing dialogue voiceover with Google Chirp.",
          "success"
        );
      } else {
        flash(requestedMusicSource === "none" ? "Background music will be skipped for this run." : "Preparing background music selection plan.", "success");
      }
    } catch (error) {
      handlePaidModelError(error, "Could not start audio preparation.", audioRequestType === "background_music" ? "Background music preparation" : "Dialogue generation");
    }
  };

  const handleSubmitScreenplayReview = async ({ requesterNotes } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate and save the screenplay before sending it for human review.", "error");
      setWorkspacePage("screenplay");
      dispatch(setActiveStep("screenplay"));
      return;
    }
    if (!canRunPaidModelAction("Human screenplay review", { minimumBalance: screenplayReviewMinimumBalance })) return;
    const lockedIdeaId = resolveWorkflowLockedIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, lockedBrief);
    const storyIdeaId = resolveWorkflowStoryIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, { id: savedStoryIdeaId });
    try {
      await submitHumanWorkOrder({
        workType: "SCREENPLAY_REVIEW",
        scriptId: scriptDetailIdea.scriptId,
        lockedIdeaId,
        storyIdeaId,
        projectId: scriptDetailIdea?.projectId || activeProjectId || lockedBrief?.projectId,
        title: `Screenplay review: ${scriptDetailIdea?.title || scriptDetailIdea?.scriptJson?.projectTitle || "Untitled video"}`,
        description: "Human expert review for hook, structure, dialogue, pacing, and production clarity.",
        requesterNotes: requesterNotes || "Please improve this screenplay for stronger retention, clearer visuals, and production-ready scene detail.",
        sourcePayload: {
          brief: lockedBrief,
          screenplay: scriptDetailIdea,
          scenes: videoPanelScenes,
          style: activeVideoStylePayload,
          durationSeconds: selectedDuration,
          screenType,
          topicType,
        },
      }).unwrap();
      addActivity("Human screenplay review submitted", scriptDetailIdea?.title || "Screenplay");
      flash("Screenplay sent for human review.", "success");
      void refetchHumanWorkOrders?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not submit screenplay for human review."), "error");
    }
  };

  const handleSubmitEditingJob = async ({ requesterNotes } = {}) => {
    if (!scriptDetailIdea?.scriptId || !isUuid(scriptDetailIdea.scriptId)) {
      flash("Generate the screenplay before creating an editing job.", "error");
      return;
    }
    const runId = currentScreenplayVideoRun?.runId || currentScreenplayVideoRun?.id || activeScreenplayVideoRunId;
    const finalClipUrl = finalVideoUrlFromPayload(currentScreenplayVideoRun)
      || finalVideoUrlFromPayload(screenplayVideoFinalJob?.result)
      || finalVideoUrlFromPayload(screenplayVideoFinalJob?.outputPayload);
    if (!runId || !finalClipUrl) {
      flash("Combine accepted clips before sending the video to an editor.", "error");
      return;
    }
    const lockedIdeaId = resolveWorkflowLockedIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, lockedBrief);
    const storyIdeaId = resolveWorkflowStoryIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, { id: savedStoryIdeaId });
    try {
      await submitHumanWorkOrder({
        workType: "EDITING_JOB",
        scriptId: scriptDetailIdea.scriptId,
        videoRunId: runId,
        lockedIdeaId,
        storyIdeaId,
        projectId: scriptDetailIdea?.projectId || activeProjectId || lockedBrief?.projectId,
        title: `Editor job: ${scriptDetailIdea?.title || scriptDetailIdea?.scriptJson?.projectTitle || "Final video"}`,
        description: "Freelancer editing handoff with final clip, shot clips, voice/music/caption plan, and revision notes.",
        requesterNotes: requesterNotes || "Please polish the final video, tighten pacing, balance music/voice, verify captions, and return an edited master.",
        priceAmount: 0,
        priceCurrency: "INR",
        sourcePayload: {
          brief: lockedBrief,
          screenplay: scriptDetailIdea,
          videoRun: currentScreenplayVideoRun,
          finalClipUrl,
          scenes: videoPanelScenes,
          acceptedShotSequence,
          videoFinishingPlan: activeVideoFinishingPlan,
          soundDesignPlan: soundDesignPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
          imageLedAdPlan: imageLedAdPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
          audioProductionPlan: audioProductionPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
          editingPlan: editingPlanFromVideoFinishingPlan(activeVideoFinishingPlan),
          style: activeVideoStylePayload,
          provider: activeScreenplayVideoPayload.provider,
          model: activeScreenplayVideoPayload.model,
          durationSeconds: selectedDuration,
          screenType,
          topicType,
        },
      }).unwrap();
      addActivity("Editing job submitted", scriptDetailIdea?.title || "Final video");
      flash("Editing job sent to the freelancer queue. Basic editing is included in this AI video package.", "success");
      void refetchHumanWorkOrders?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not submit the editing job."), "error");
    }
  };

  const handleRequestEditingChanges = async (workOrder, message) => {
    const workOrderId = workOrder?.workOrderId || workOrder?.id;
    const cleanMessage = String(message || "").trim();
    if (!workOrderId || !cleanMessage) {
      flash("Write the edit change you want before sending it.", "error");
      return;
    }
    try {
      await requestHumanWorkOrderChanges({
        workOrderId,
        scriptId: scriptDetailIdea?.scriptId,
        message: cleanMessage,
        authorRole: "CREATOR",
      }).unwrap();
      addActivity("Editor changes requested", workOrder?.title || "Editing job");
      flash("Change request sent to the editor.", "success");
      void refetchHumanWorkOrders?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not send the edit change request."), "error");
    }
  };

  const handleApproveEditingJob = async (workOrder) => {
    const workOrderId = workOrder?.workOrderId || workOrder?.id;
    if (!workOrderId) {
      flash("No editing job is selected for approval.", "error");
      return;
    }
    try {
      await approveHumanWorkOrder({
        workOrderId,
        scriptId: scriptDetailIdea?.scriptId,
        message: "Creator approved the edited video.",
      }).unwrap();
      addActivity("Edited video approved", workOrder?.title || "Editing job");
      flash("Edited video approved. Basic editing was included in the AI video package.", "success");
      void refetchHumanWorkOrders?.();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not approve the edited video or debit the wallet."), "error");
    }
  };

  function getWorkflowGateMessage(step) {
    if (!workflowStepIds.has(step) && step !== "video" && step !== "storyboard") return "";
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
    if (step === "video" && videoBlockedReason) {
      return videoBlockedReason;
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
    const storyboardVideoGate = workspacePage === "storyboard" && nextPage === "video" && !activeFinalVideoUrl && !generatedShotNumbers.size
      ? !effectiveShotPlansReady
        ? "Generate shot plans before continuing to Video."
        : !storyboardSaved
          ? "Save Production before continuing to Video."
          : !canExportShotsPdf
            ? exportBlockedReason || "Generate every required shot image before continuing to Video."
          : ""
      : "";
    const gateMessage = storyboardVideoGate || (gateStep ? getWorkflowGateMessage(gateStep) : "");
    if (gateMessage) {
      flash(gateMessage, "warning");
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
      flash(gateMessage, "warning");
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
    dispatch(setActiveStep("storyboard"));
    setWorkspacePage("storyboard");
    addActivity("Screenplay reviewed", scriptDetailIdea?.title || selectedIdea?.title || "Generated screenplay");
    flash(
      effectiveShotPlansReady
        ? "Screenplay reviewed. Review and generate the storyboard before Video."
        : "Screenplay reviewed. Generating storyboard shot plans next.",
      "success"
    );
    window.history.replaceState(null, "", "/#storyboard");
    scrollToSection("storyboard");
    if (!effectiveShotPlansReady && !shotPlanLoading) {
      void handleGenerateStoryboard();
    }
  };

  const handleContinueFromStoryline = async (draftStoryScript = null) => {
    if (draftStoryScript) {
      try {
        await handleSaveStoryScript(draftStoryScript);
      } catch {
        return;
      }
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
      const message = "Generate a story script before saving edits";
      flash(message, "error");
      throw new Error(message);
    }

    const revisionPayload = buildStoryRevisionPayload(draftScript, storyScriptIdea, revisionContext);
    const payload = {
      title: draftScript.projectTitle || storyScriptIdea.title,
      durationSeconds: draftScript.duration || selectedDuration,
      dialogueLanguage: draftScript.dialogueLanguage || dialogueLanguage,
      screenType: draftScript.screenType || screenType,
      storytellingType: draftScript.storytellingType || storytellingType,
      hookLens: draftScript.hookLens || hookLens,
      topicType: draftScript.topicType || topicType,
      ...activeVideoStylePayload,
      scriptText: buildStoryScriptTextFromDraft(draftScript),
      scriptJson: revisionPayload,
    };

    const storyScriptLockedIdeaId = resolveWorkflowLockedIdeaId(storyScriptIdea, selectedIdea, lockedBrief);
    const storyScriptStoryIdeaId = resolveWorkflowStoryIdeaId(storyScriptIdea, selectedIdea, { id: savedStoryIdeaId });
    if (!isUuid(storyScriptLockedIdeaId) || !isUuid(storyScriptStoryIdeaId)) {
      const message = "Storyline edits need a backend-saved topic and story idea. Save the idea again, then retry the edit.";
      flash(message, "error");
      throw new Error(message);
    }

    let result;
    try {
      result = await saveStoryIdeaScript({
        lockedIdeaId: storyScriptLockedIdeaId,
        storyIdeaId: storyScriptStoryIdeaId,
        ...payload,
      }).unwrap();
    } catch (error) {
      flash(apiErrorMessage(error, "Could not save storyline edits to the backend. Your text remains in the editor; edit it again to retry."), "error");
      throw error;
    }

    const updatedIdea = updateStoryIdeaInState({
      ...storyScriptIdea,
      id: storyScriptStoryIdeaId || storyScriptIdea.id,
      storyIdeaId: storyScriptStoryIdeaId || storyScriptIdea.storyIdeaId,
      lockedIdeaId: storyScriptLockedIdeaId || storyScriptIdea.lockedIdeaId,
      title: result.title || payload.title,
      storyScriptText: result.scriptText || payload.scriptText,
      storyScriptJson: result.scriptJson || payload.scriptJson,
      projectId: result.projectId || storyScriptIdea.projectId || activeProjectId,
      durationSeconds: result.durationSeconds || payload.durationSeconds,
      storytellingType: result.scriptJson?.storytellingType || payload.storytellingType,
      hookLens: result.scriptJson?.hookLens || payload.hookLens,
      topicType: result.scriptJson?.topicType || result.topicType || payload.topicType,
      productionStyle: result.scriptJson?.productionStyle || result.productionStyle || payload.productionStyle,
      hybridSceneMode: result.scriptJson?.hybridSceneMode || result.hybridSceneMode || payload.hybridSceneMode,
      brollStyle: result.scriptJson?.brollStyle || result.brollStyle || payload.brollStyle,
      captionStyle: result.scriptJson?.captionStyle || result.captionStyle || payload.captionStyle,
      productionStyleGuidance: result.scriptJson?.productionStyleGuidance || result.productionStyleGuidance || payload.productionStyleGuidance,
      status: result.status || "SCRIPT_GENERATED",
    });
    setStoryScriptIdea(updatedIdea);
    addActivity("Story script saved", updatedIdea.title);
    logStoryRevisionEvent(updatedIdea, payload.scriptJson.revisionAudit, false);
    flash("Story script saved to backend", "success");
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
      topicType: draftScript.topicType || topicType,
      ...activeVideoStylePayload,
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
    const screenplayLockedIdeaId = resolveWorkflowLockedIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, lockedBrief);
    const screenplayStoryIdeaId = resolveWorkflowStoryIdeaId(scriptDetailIdea, storyScriptIdea, selectedIdea, { id: savedStoryIdeaId });
    if (isUuid(screenplayLockedIdeaId) && isUuid(screenplayStoryIdeaId) && isUuid(scriptDetailIdea.scriptId)) {
      try {
        result = await saveGeneratedScript({
          lockedIdeaId: screenplayLockedIdeaId,
          storyIdeaId: screenplayStoryIdeaId,
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
      id: screenplayStoryIdeaId || scriptDetailIdea.id,
      storyIdeaId: screenplayStoryIdeaId || scriptDetailIdea.storyIdeaId,
      lockedIdeaId: screenplayLockedIdeaId || scriptDetailIdea.lockedIdeaId,
      title: result.title || payload.title,
      scriptId: result.scriptId || scriptDetailIdea.scriptId,
      projectId: result.projectId || scriptDetailIdea.projectId || activeProjectId,
      scriptText: result.script || payload.script,
      scriptJson: result.scriptJson || payload.scriptJson,
      scriptScenes: normalizeGeneratedScriptScenes(result.scenes || result.scriptJson?.shots || payload.scenes),
      productionPlanTags: result.productionPlanTags || scriptDetailIdea.productionPlanTags || [],
      productionPlanStatus: result.productionPlanStatus || result.scriptJson?.productionPlanStatus || scriptDetailIdea.productionPlanStatus || "",
      topicType: result.scriptJson?.topicType || result.topicType || payload.topicType,
      productionStyle: result.scriptJson?.productionStyle || result.productionStyle || payload.productionStyle,
      hybridSceneMode: result.scriptJson?.hybridSceneMode || result.hybridSceneMode || payload.hybridSceneMode,
      brollStyle: result.scriptJson?.brollStyle || result.brollStyle || payload.brollStyle,
      captionStyle: result.scriptJson?.captionStyle || result.captionStyle || payload.captionStyle,
      productionStyleGuidance: result.scriptJson?.productionStyleGuidance || result.productionStyleGuidance || payload.productionStyleGuidance,
      productionPlanError: result.productionPlanError || result.scriptJson?.productionPlanError || scriptDetailIdea.productionPlanError || "",
      productionPlanDebug: result.productionPlanDebug || result.scriptJson?.productionPlanDebug || scriptDetailIdea.productionPlanDebug || null,
      durationSeconds: result.durationSeconds || payload.durationSeconds,
      storytellingType: result.scriptJson?.storytellingType || payload.storytellingType,
      hookLens: result.scriptJson?.hookLens || payload.hookLens,
      status: result.status || "SCRIPT_EDITED",
    });
    setScriptDetailIdea(updatedIdea);
    setScreenplayApprovedForVideo(false);
    setScreenplayVideoRunId(null);
    setScreenplayVideoJobId(null);
    setScreenplayVideoSceneJobId(null);
    setScreenplayVideoActiveSceneId(null);
    setScreenplayVideoFinalJobId(null);
    setScreenplayVideoAudioJobId(null);
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
    setTopicType(inferTopicTypeFromText(text, topicType));
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
      // If cached lookup fails, fall through to refresh so API errors surface normally.
    }
    if (hasWeeklyIdeaTagsPayload(latestTags)) return;
    try {
      await refreshWeeklyIdeaTags().unwrap();
      await refetchWeeklyIdeaTags?.();
      addActivity("Trend moments loaded", "Next 7 days");
    } catch (error) {
      handlePaidModelError(error, "Could not load trend moments.", "trend moment refresh");
    }
  };

  const handleRefreshWeeklyIdeaTags = async () => {
    try {
      await refreshWeeklyIdeaTags().unwrap();
      await refetchWeeklyIdeaTags?.();
      addActivity("Trend moments refreshed", "Next 7 days");
      flash("Trend moments refreshed.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not refresh trend moments.", "trend moment refresh");
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
      topicType,
      topicTypeLabel: topicTypeLabelFor(topicType),
      ...activeVideoStylePayload,
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
    if (creativeFlow !== "guided") {
      flash("Switch to Guided angle to video to save a brief and generate ideas.", "error");
      return;
    }
    const trimmed = String(text || "").trim();
    const productIntelligenceBrief = hasActiveProductAdInput
      ? buildProductIntelligenceBrief(activeProductAdBrief, trimmed, {
        countryCode: country.code,
        durationSeconds: selectedDuration,
        topicType,
        productionStyle,
        dialogueLanguage,
        screenType,
        storytellingType,
        hookLens,
        brollStyle,
        captionStyle,
      })
      : null;
    if (!trimmed && !productIntelligenceBrief) {
      flash("Add a product URL, product name, image URL, or short topic first", "error");
      return;
    }
    const briefDescription = productIntelligenceBrief?.briefSummary || trimmed;
    const briefTitle = productIntelligenceBrief?.displayName || trimmed;
    const draftIdea = {
      id: `idea-original-${Date.now()}`,
      title: briefTitle.length > 42 ? `${briefTitle.slice(0, 39)}...` : briefTitle,
      description: briefDescription,
      hashtags: productIntelligenceBrief ? ["#ProductAd", "#Commercial", "#CreatorScript"] : ["#OriginalIdea", "#CreatorScript"],
      manual: true,
      source: "original",
      briefMode: productIntelligenceBrief ? PRODUCT_AD_BRIEF_MODE : "creator_topic",
      productInputKey: productIntelligenceBrief ? productAdInputKey(productIntelligenceBrief) : "",
      productIntelligenceBrief,
      adConceptLanes: productIntelligenceBrief ? PRODUCT_AD_CONCEPT_LANES : [],
      topicType,
      topicTypeLabel: topicTypeLabelFor(topicType),
      campaignAngle: activeCampaignAngle,
      ...activeVideoStylePayload,
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
      lockedSelection?.ideaId
        ? productIntelligenceBrief ? "Product brief saved. Generate campaign concepts when ready." : "Topic saved. Generate story ideas when ready."
        : productIntelligenceBrief ? "Product brief saved locally; generate local campaign concepts when ready." : "Topic saved locally; generate local story ideas when ready.",
      lockedSelection?.ideaId ? "success" : "warning"
    );
  };

  const handleGenerateProductAdPipeline = async () => {
    if (creativeFlow !== "autonomous_product_ad") {
      flash("Switch to Autonomous product ad to run the product-ad agent.", "error");
      return;
    }
    if (!hasActiveProductAdInput || !activeProductIntelligenceBrief) {
      flash("Add a product URL, product name, or product image URL first.", "error");
      return;
    }
    if (!canRunPaidModelAction("product ad research and image generation")) return;

    const productInput = firstString(activeProductIntelligenceBrief.productInput, activeProductAdBrief.productInput);
    const imageUrls = splitProductImageUrls(
      activeProductIntelligenceBrief.imageUrls
      || activeProductAdBrief.imageUrlsText
      || activeProductAdBrief.imageUrls
      || activeProductAdBrief.productImageUrls
    );
    const payload = {
      productUrl: firstString(activeProductIntelligenceBrief.sourceUrl, isHttpUrl(productInput) ? productInput : ""),
      productName: firstString(activeProductIntelligenceBrief.displayName, activeProductIntelligenceBrief.productName, isHttpUrl(productInput) ? "" : productInput),
      productImageUrls: imageUrls,
      campaignObjective: activeProductIntelligenceBrief.campaignObjective || "",
      targetAudience: firstString(activeProductIntelligenceBrief.productUnderstanding?.targetAudience, activeProductIntelligenceBrief.targetAudience),
      ingredientDetails: firstString(
        activeProductIntelligenceBrief.ingredientDetails,
        activeProductIntelligenceBrief.productUnderstanding?.ingredients
      ),
      tone: firstString(
        activeProductIntelligenceBrief.adTone,
        activeProductIntelligenceBrief.productUnderstanding?.adTone,
        activeProductIntelligenceBrief.productUnderstanding?.tone
      ),
      categoryCode: filters.category,
      platformCode: filters.platform,
      durationSeconds: selectedDuration || 60,
      conceptCount: 3,
      imageCount: 10,
      screenType,
      pacingStyle: selectedDuration <= 30 ? "FAST" : "BALANCED",
      noHumans: Boolean(activeProductAdBrief.noHumans),
      autoPlanShotTypes: activeProductAdBrief.shotRecipeSource !== "custom",
      generateImages: true,
      useWebSearch: true,
      autoPrepareVideoRun: Boolean(scriptDetailIdea?.scriptId && screenplayApprovedForVideo),
      projectId: isUuid(activeProjectId) ? activeProjectId : undefined,
      lockedIdeaId: isUuid(lockedBrief?.lockedIdeaId) ? lockedBrief.lockedIdeaId : undefined,
      storyIdeaId: isUuid(savedStoryIdeaId) ? savedStoryIdeaId : undefined,
      scriptId: isUuid(scriptDetailIdea?.scriptId) ? scriptDetailIdea.scriptId : undefined,
      existingBrief: activeProductIntelligenceBrief,
      brandContext: brandContextFromProductIntelligence(activeProductIntelligenceBrief),
    };

    try {
      const job = await generateProductAdPipeline(payload).unwrap();
      setProductAdPipelineJobId(job.jobId || job.id);
      addActivity("Product ad agent started", activeProductIntelligenceBrief.displayName || "Product campaign");
      flash("Product ad agent started. It will research the product, create campaign concepts, and generate image anchors.", "success");
    } catch (error) {
      handlePaidModelError(error, "Could not start the product ad agent.", "product ad research and image generation");
    }
  };

  const handleGenerateStoryIdeas = async () => {
    if (creativeFlow !== "guided") {
      flash("The autonomous product-ad route creates its own campaign concepts. Switch to Guided angle to video for manual idea generation.", "error");
      return;
    }
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

  const ensureSavedLockedBriefForWorkflow = async () => {
    if (!lockedBrief) return null;
    if (isUuid(lockedBrief.lockedIdeaId)) return lockedBrief;

    const sourceType = lockedBrief.source === "trend" ? "TREND" : "ORIGINAL";
    const lockedSelection = await persistIdeaSelection({
      sourceType,
      idea: lockedBrief,
      trend: sourceType === "TREND" ? selectedTrend : null,
    });

    if (!isUuid(lockedSelection?.ideaId)) return lockedBrief;

    const nextBrief = {
      ...lockedBrief,
      id: lockedSelection.ideaId,
      backendLocked: true,
      lockedIdeaId: lockedSelection.ideaId,
      projectId: lockedSelection.projectId || lockedBrief.projectId || activeProjectId,
    };
    setLockedBrief(nextBrief);
    setExtraIdeas((current) => mergeUniqueIdeas(current, [nextBrief]));
    return nextBrief;
  };

  const ensureBackendStoryIdeaForWorkflow = async (storyIdea, workflowLockedBrief, { silent = false } = {}) => {
    if (!storyIdea || !workflowLockedBrief) return storyIdea;
    if (isUuid(storyIdea.id)) return storyIdea;
    if (!isUuid(workflowLockedBrief.lockedIdeaId)) return storyIdea;

    const knownMatch = findBestPersistedStoryIdea(storyIdea, [
      ...ideaCandidatePageItems,
      ...lockedIdeaOptions,
      ...savedIdeaSnapshots,
    ]);
    if (knownMatch) return knownMatch;

    if (!silent) {
      flash("Saving this story idea to the backend before generation.", "info");
    }

    try {
      const page = Math.max(0, Number(ideaCandidatePageInfo?.number || 0));
      const generated = await loadIdeaCandidatesForBrief(workflowLockedBrief, page);
      const backendMatch = findBestPersistedStoryIdea(storyIdea, generated.items);
      if (backendMatch) {
        setLockedIdeaOptions((current) => mergeUniqueIdeas(current, [backendMatch]));
        setIdeaCandidatePageItems((current) => mergeUniqueIdeas(current, [backendMatch]));
        dispatch(selectIdea(backendMatch.id));
        return backendMatch;
      }
    } catch (error) {
      logCreatorWorkflowError("Could not hydrate local story idea with backend UUID.", error, {
        lockedIdeaId: workflowLockedBrief.lockedIdeaId,
        localStoryIdeaId: storyIdea.id,
      });
    }

    return storyIdea;
  };

  const saveSelectedStoryIdeaForWorkflow = async (storyIdea, { silent = false, lockedBriefOverride = null } = {}) => {
    const workflowLockedBrief = lockedBriefOverride || lockedBrief;
    if (!workflowLockedBrief || !storyIdea) {
      if (!silent) flash("Select a story idea first", "error");
      return null;
    }

    let savedIdea = { ...storyIdea, saved: true, status: "SELECTED" };
    let usedLocalSave = false;
    if (isUuid(workflowLockedBrief.lockedIdeaId) && isUuid(storyIdea.id)) {
      try {
        savedIdea = await saveStoryIdea({ lockedIdeaId: workflowLockedBrief.lockedIdeaId, storyIdeaId: storyIdea.id }).unwrap();
      } catch {
        usedLocalSave = true;
        // Local save keeps the workflow usable while the backend is unavailable.
      }
    }

    const normalized = updateStoryIdeaInState({
      ...savedIdea,
      lockedIdeaId: savedIdea.lockedIdeaId || workflowLockedBrief.lockedIdeaId,
      projectId: savedIdea.projectId || workflowLockedBrief.projectId || activeProjectId,
      saved: true,
      status: "SELECTED",
    });
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

    const workflowLockedBrief = await ensureSavedLockedBriefForWorkflow();
    if (!isUuid(workflowLockedBrief?.lockedIdeaId)) {
      flash("Could not save the topic to the backend. Save the topic again after the backend is reachable.", "error");
      return;
    }

    let sourceStoryIdea = storyIdea;
    let usedLocalSave = false;
    sourceStoryIdea = await ensureBackendStoryIdeaForWorkflow(storyIdea, workflowLockedBrief, { silent: true });
    if (!isUuid(sourceStoryIdea?.id)) {
      flash("Story ideas are still local only. Regenerate story ideas once the backend can return saved UUIDs.", "error");
      return;
    }

    if (savedStoryIdeaId !== sourceStoryIdea.id) {
      const saved = await saveSelectedStoryIdeaForWorkflow(sourceStoryIdea, { silent: true, lockedBriefOverride: workflowLockedBrief });
      if (!saved?.idea) {
        flash("Could not save selected story idea before generation", "error");
        return;
      }
      sourceStoryIdea = saved.idea;
      usedLocalSave = saved.usedLocalSave;
    }

    const providerMemory = aiProviderContext;
    const storyCategoryCode = resolveWorkflowCategoryCode(workflowLockedBrief, sourceStoryIdea, filters.category);
    if (!isUuid(workflowLockedBrief.lockedIdeaId) || !isUuid(sourceStoryIdea.id)) {
      flash("Story generation needs backend-saved topic and story idea IDs. Regenerate story ideas and try again.", "error");
      return;
    }
    if (!canRunPaidModelAction("AI story script generation")) return;

    const productWorkflowBrief = productIntelligenceBriefForWorkflow(workflowLockedBrief, sourceStoryIdea, activeProductIntelligenceBrief);
    const productBrandContext = brandContextFromProductIntelligence(productWorkflowBrief);
    const adConceptStrategy = adConceptStrategyFromIdea(sourceStoryIdea);
    const campaignAngle = campaignAngleFromEntity(sourceStoryIdea, workflowLockedBrief, productWorkflowBrief, activeCampaignAngle);
    let scriptResult;
    try {
      scriptResult = attachAiProviderMetadata(await generateStoryIdeaScript({
        lockedIdeaId: workflowLockedBrief.lockedIdeaId,
        storyIdeaId: sourceStoryIdea.id,
        durationSeconds: selectedDuration,
        categoryCode: storyCategoryCode,
        idea: `${sourceStoryIdea.title}\n${sourceStoryIdea.description || ""}`.trim(),
        dialogueLanguage,
        screenType,
        storytellingType,
        hookLens,
        topicType,
        ...activeVideoStylePayload,
        brandContext: productBrandContext,
        context: {
          aiProvider: providerMemory,
          storytellingType,
          hookLens,
          topicType,
          campaignAngle,
          ...activeVideoStylePayload,
          briefMode: productWorkflowBrief ? PRODUCT_AD_BRIEF_MODE : "creator_topic",
          productIntelligenceBrief: productWorkflowBrief,
          adConceptStrategy,
          campaignObjective: productWorkflowBrief?.campaignObjective || adConceptStrategy?.marketingObjective || "",
          brandContext: productBrandContext,
        },
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
      topicType: scriptResult.scriptJson?.topicType || scriptResult.topicType || topicType,
      productionStyle: scriptResult.scriptJson?.productionStyle || scriptResult.productionStyle || productionStyle,
      hybridSceneMode: scriptResult.scriptJson?.hybridSceneMode || scriptResult.hybridSceneMode || hybridSceneMode,
      brollStyle: scriptResult.scriptJson?.brollStyle || scriptResult.brollStyle || brollStyle,
      captionStyle: scriptResult.scriptJson?.captionStyle || scriptResult.captionStyle || captionStyle,
      productionStyleGuidance: scriptResult.scriptJson?.productionStyleGuidance || scriptResult.productionStyleGuidance || activeProductionStyleGuidance,
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

  // Opt-in "run the whole graph" trigger: story script -> screenplay -> shot plan -> storyboard,
  // each stage already running its own critic/retry loop server-side. Fires the async job and
  // leaves the existing per-stage screens as the source of truth once it completes - this only
  // adds a single button + a readable trace of what each stage did while it runs.
  const handleRunGraphPipeline = async () => {
    const storyIdea = ideas.find((idea) => idea.id === planner.selectedIdeaId);
    if (!lockedBrief || !storyIdea) {
      flash("Select a story idea first", "error");
      return;
    }
    const workflowLockedBrief = await ensureSavedLockedBriefForWorkflow();
    if (!isUuid(workflowLockedBrief?.lockedIdeaId)) {
      flash("Could not save the topic to the backend. Save the topic again after the backend is reachable.", "error");
      return;
    }
    let sourceStoryIdea = await ensureBackendStoryIdeaForWorkflow(storyIdea, workflowLockedBrief, { silent: true });
    if (!isUuid(sourceStoryIdea?.id)) {
      flash("Story ideas are still local only. Regenerate story ideas once the backend can return saved UUIDs.", "error");
      return;
    }
    if (savedStoryIdeaId !== sourceStoryIdea.id) {
      const saved = await saveSelectedStoryIdeaForWorkflow(sourceStoryIdea, { silent: true, lockedBriefOverride: workflowLockedBrief });
      if (!saved?.idea) {
        flash("Could not save selected story idea before generation", "error");
        return;
      }
      sourceStoryIdea = saved.idea;
    }
    if (!canRunPaidModelAction("Full pipeline generation")) return;
    try {
      const result = await runGraphPipeline({
        lockedIdeaId: workflowLockedBrief.lockedIdeaId,
        storyIdeaId: sourceStoryIdea.id,
      }).unwrap();
      setPipelineJobId(result?.jobId || result?.id || null);
      addActivity("Full pipeline run started", sourceStoryIdea.title);
      flash("Running story script -> screenplay -> shot plan -> storyboard. Track progress below.", "success");
    } catch (error) {
      handlePaidModelError(error, "Full pipeline run failed to start.", "Full pipeline generation");
    }
  };

  const applyScreenplayResult = (screenplayResult, sourceIdea, draftStoryScript = null) => {
    if (!screenplayResult || !sourceIdea) return null;
    const storyIdeaId = resolveWorkflowStoryIdeaId(screenplayResult, sourceIdea);
    const lockedIdeaId = resolveWorkflowLockedIdeaId(screenplayResult, sourceIdea, lockedBrief);
    const screenplayResultId = firstString(screenplayResult.id);
    const scriptId = resolveWorkflowScriptId(screenplayResult) || (screenplayResultId && screenplayResultId !== storyIdeaId ? screenplayResultId : "");
    const screenplayIdea = updateStoryIdeaInState({
      ...sourceIdea,
      id: storyIdeaId || sourceIdea.id,
      storyIdeaId: storyIdeaId || sourceIdea.storyIdeaId,
      title: screenplayResult.title || sourceIdea.title,
      description: sourceIdea.description,
      lockedIdeaId: lockedIdeaId || sourceIdea.lockedIdeaId,
      scriptId,
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
      topicType: screenplayResult.scriptJson?.topicType || screenplayResult.topicType || sourceIdea.topicType || topicType,
      productionStyle: screenplayResult.scriptJson?.productionStyle || screenplayResult.productionStyle || sourceIdea.productionStyle || productionStyle,
      hybridSceneMode: screenplayResult.scriptJson?.hybridSceneMode || screenplayResult.hybridSceneMode || sourceIdea.hybridSceneMode || hybridSceneMode,
      brollStyle: screenplayResult.scriptJson?.brollStyle || screenplayResult.brollStyle || sourceIdea.brollStyle || brollStyle,
      captionStyle: screenplayResult.scriptJson?.captionStyle || screenplayResult.captionStyle || sourceIdea.captionStyle || captionStyle,
      productionStyleGuidance: screenplayResult.scriptJson?.productionStyleGuidance || screenplayResult.productionStyleGuidance || sourceIdea.productionStyleGuidance || activeProductionStyleGuidance,
      provider: screenplayResult.provider,
      model: screenplayResult.model,
      storyScriptJson: sourceIdea.storyScriptJson || buildInitialStoryRevisionPayload(draftStoryScript),
      storyScriptText: sourceIdea.storyScriptText,
    });
    setScriptDetailIdea(screenplayIdea);
    setScreenplayApprovedForVideo(false);
    setScreenplayVideoRunId(null);
    setScreenplayVideoJobId(null);
    setScreenplayVideoSceneJobId(null);
    setScreenplayVideoActiveSceneId(null);
    setScreenplayVideoFinalJobId(null);
    setScreenplayVideoAudioJobId(null);
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

      const workflowLockedBrief = await ensureSavedLockedBriefForWorkflow();
      if (!isUuid(workflowLockedBrief?.lockedIdeaId)) {
        screenplayStartInFlightRef.current = false;
        flash("Could not save the topic to the backend. Save the topic again after the backend is reachable.", "error");
        return;
      }

      const hydratedStoryIdea = await ensureBackendStoryIdeaForWorkflow(sourceIdea, workflowLockedBrief, { silent: true });
      if (!isUuid(hydratedStoryIdea?.id)) {
        screenplayStartInFlightRef.current = false;
        flash("Screenplay generation needs a backend-saved story idea. Regenerate story ideas once the backend can return saved UUIDs.", "error");
        return;
      }
      if (hydratedStoryIdea.id !== sourceIdea.id) {
        sourceIdea = updateStoryIdeaInState({
          ...hydratedStoryIdea,
          storyScriptText: sourceIdea.storyScriptText || hydratedStoryIdea.storyScriptText,
          storyScriptJson: sourceIdea.storyScriptJson || hydratedStoryIdea.storyScriptJson,
          status: sourceIdea.status || hydratedStoryIdea.status,
        });
        setStoryScriptIdea(sourceIdea);
        dispatch(selectIdea(sourceIdea.id));
      } else {
        sourceIdea = hydratedStoryIdea;
      }

      const providerMemory = aiProviderContext;
      const screenplayLockedIdeaId = resolveWorkflowLockedIdeaId(sourceIdea, storyScriptIdea, selectedIdea, workflowLockedBrief);
      const screenplayCategoryCode = resolveWorkflowCategoryCode(sourceIdea, workflowLockedBrief, filters.category);
      if (!isUuid(screenplayLockedIdeaId) || !isUuid(sourceIdea.id)) {
        screenplayStartInFlightRef.current = false;
        flash("Screenplay generation needs backend-saved topic and story idea IDs. Regenerate story ideas and try again.", "error");
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
        lockedIdeaId: screenplayLockedIdeaId,
        storyIdeaId: sourceIdea.id,
        durationSeconds: selectedDuration,
        categoryCode: screenplayCategoryCode,
        idea: `${sourceIdea.title}\n${sourceIdea.description || ""}`.trim(),
        dialogueLanguage,
        screenType,
        storytellingType,
        hookLens,
        topicType,
        ...activeVideoStylePayload,
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
          topicType,
          ...activeVideoStylePayload,
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
    lockedIdeaId: activeLockedIdeaIdForCast,
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
    brandContext: brandContextFromProductIntelligence(productIntelligenceBriefForWorkflow(lockedBrief, selectedIdea, activeProductIntelligenceBrief)),
    context: {
      durationSeconds: selectedDuration,
      dialogueLanguage,
      screenType,
      storytellingType,
      hookLens,
      topicType,
      campaignAngle: campaignAngleFromEntity(selectedIdea, lockedBrief, activeCampaignAngle),
      ...activeVideoStylePayload,
      briefMode: hasActiveProductAdInput ? PRODUCT_AD_BRIEF_MODE : "creator_topic",
      productIntelligenceBrief: productIntelligenceBriefForWorkflow(lockedBrief, selectedIdea, activeProductIntelligenceBrief),
      adConceptStrategy: adConceptStrategyFromIdea(selectedIdea),
      source: "creator-ui",
    },
  });

  const buildScreenplayProductionContext = () => {
    const characterCastMappings = activeCharacterMappings;
    const availableActors = selectedCreator?.actors || creators || [];
    const productWorkflowBrief = productIntelligenceBriefForWorkflow(lockedBrief, storyScriptIdea || selectedIdea, activeProductIntelligenceBrief);
    const campaignAngle = campaignAngleFromEntity(storyScriptIdea, selectedIdea, lockedBrief, productWorkflowBrief, activeCampaignAngle);
    const productBrandContext = brandContextFromProductIntelligence(productWorkflowBrief);
    const referenceImageUrls = splitProductImageUrls(
      productWorkflowBrief?.imageUrls
      || productWorkflowBrief?.referenceImageUrls
      || productWorkflowBrief?.productUnderstanding?.imageUrls
      || activeProductAdBrief?.imageUrlsText
    );
    const brandContext = normalizeBrandContextForApi(selectedAudienceDecision?.brandContext || productBrandContext || {
      productContext: selectedAudienceDecision?.productContext || "",
      brandTone: selectedAudienceDecision?.brandTone || "",
      restrictions: selectedAudienceDecision?.restrictions || [],
    });
    const creatorContext = {
      selectedCreator,
      castPlan: selectedCreator,
      selectedIdea,
      lockedBrief,
      briefMode: productWorkflowBrief ? PRODUCT_AD_BRIEF_MODE : "creator_topic",
      productIntelligenceBrief: productWorkflowBrief,
      adConceptStrategy: adConceptStrategyFromIdea(storyScriptIdea || selectedIdea),
      metadata: {
        campaignAngle,
        referenceImageUrls,
        storyboardReferencePolicy: referenceImageUrls.length
          ? "Use the supplied product and brand reference images to keep packaging, logo placement, colors, and materials consistent in storyboard sketches. Do not paste a source image into a storyboard panel; storyboard sketches remain planning assets only."
          : "No product reference images were supplied.",
      },
      dialogueLanguage,
      screenType,
      storytellingType,
      hookLens,
      topicType,
      ...activeVideoStylePayload,
      durationSeconds: selectedDuration,
    };
    return {
      budgetTier: selectedDuration <= 60 ? "zero_budget" : selectedDuration <= 180 ? "micro_budget" : "indie",
      storytellingType,
      hookLens,
      topicType,
      ...activeVideoStylePayload,
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
    // Persisted right away (not deferred to "Confirm cast") so the actor has a real profile id
    // and a photo can be uploaded immediately after adding it.
    const payload = castMemberToProfilePayload(
      {
        name: actorDraft?.name?.trim() || "Local Actor",
        role: actorDraft?.roleInShort || actorDraft?.role || "Supporting Actor",
        age: actorDraft?.age,
        gender: actorDraft?.gender,
        vibe: actorDraft?.vibe,
        style: actorDraft?.style,
        cameraConfidence: actorDraft?.cameraConfidence,
        look: actorDraft?.look,
        profile: actorDraft?.profile,
        scenePresence: actorDraft?.scenePresence || "Reaction shots",
      },
      activeProjectId
    );
    try {
      const saved = await createCreator(payload).unwrap();
      const normalized = normalizeSavedActorProfile(saved, actorDraft);
      addActivity("Actor added", normalized.name);
      flash("Actor saved. Add a photo, then map it to characters.", "success");
      return normalized;
    } catch {
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
      flash("Couldn't save to your account right now; actor added locally. Photo upload needs a saved actor — try Confirm cast, then add a photo.", "warning");
      return normalized;
    }
  };

  const handleUploadActorPhoto = async (actorId, file) => {
    const saved = await uploadActorReferenceImage({ id: actorId, file }).unwrap();
    flash("Actor photo saved. It'll be used to lock this character's face in video and storyboard generation.", "success");
    return saved;
  };

  const handleUploadCastReferenceImage = async (characterName, file) => {
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const mapping = activeCharacterMappings.find((item) => normalize(item.characterName) === normalize(characterName));

    if (!mapping || !isUuid(mapping.castProfileId)) {
      flash("This character isn't mapped to a cast member yet. Open the Cast step to assign one first.", "error");
      throw new Error("No cast profile mapped for this character yet.");
    }

    let savedActor;
    try {
      savedActor = await handleUploadActorPhoto(mapping.castProfileId, file);
    } catch (error) {
      flash(apiErrorMessage(error, "Photo upload failed. Try a JPG, PNG, or WebP under 15 MB."), "error");
      throw error;
    }

    const referenceImageUrl = savedActor?.attributes?.referenceImageUrl || savedActor?.referenceImageUrl || "";
    const updatedMappings = activeCharacterMappings.map((item) =>
      item === mapping
        ? {
            ...item,
            castDisplayName: savedActor?.name || savedActor?.displayName || item.castDisplayName,
            castPayload: {
              ...(item.castPayload || {}),
              referenceImageUrl,
              actorId: mapping.castProfileId,
            },
          }
        : item
    );

    try {
      const mappingResult = await saveCharacterCastMappings({
        lockedIdeaId: activeLockedIdeaIdForCast,
        storyIdeaId: activeStoryIdeaIdForCast,
        projectId: activeProjectId,
        scriptId: isUuid(scriptDetailIdea?.scriptId) ? scriptDetailIdea.scriptId : null,
        mappings: updatedMappings,
      }).unwrap();
      const savedMappings = mappingResult.mappings || updatedMappings;
      setCastPlan((current) => {
        const base = current || selectedCreator || {};
        return {
          ...base,
          characterMappings: savedMappings,
          actors: (base.actors || []).map((actor) =>
            actor.actorId === mapping.castProfileId ? { ...actor, referenceImageUrl } : actor
          ),
        };
      });
      flash(`Cast reference set for ${mapping.castDisplayName || characterName}.`, "success");
    } catch (error) {
      setCastPlan((current) => {
        const base = current || selectedCreator || {};
        return { ...base, characterMappings: updatedMappings };
      });
      flash(
        apiErrorMessage(error, "Photo saved to the actor, but syncing it to this scene's cast mapping failed. Retry to confirm it sticks."),
        "warning"
      );
      throw error;
    }
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
          referenceImageUrl: saved.attributes?.referenceImageUrl || actor.referenceImageUrl || "",
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
    if (savedMappings.length && isUuid(activeLockedIdeaIdForCast) && isUuid(activeStoryIdeaIdForCast)) {
      try {
        const mappingResult = await saveCharacterCastMappings({
          lockedIdeaId: activeLockedIdeaIdForCast,
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
          lockedIdeaId: activeLockedIdeaIdForCast,
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
      topicType: baseIdea?.topicType || topicType,
      topicTypeLabel: baseIdea?.topicTypeLabel || topicTypeLabelFor(topicType),
      ...(baseIdea?.productionStyleGuidance ? {
        productionStyle: baseIdea.productionStyle || productionStyle,
        hybridSceneMode: baseIdea.hybridSceneMode || hybridSceneMode,
        brollStyle: baseIdea.brollStyle || brollStyle,
        captionStyle: baseIdea.captionStyle || captionStyle,
        productionStyleGuidance: baseIdea.productionStyleGuidance,
      } : activeVideoStylePayload),
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
      topicType,
      topicTypeLabel: topicTypeLabelFor(topicType),
      ...activeVideoStylePayload,
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
      topicType,
      topicTypeLabel: topicTypeLabelFor(topicType),
      ...activeVideoStylePayload,
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
      const selectedTopicType = topicTypeOptionFor(topicType);
      const categoryLabel = selectedTopicType.label || filterLabels.category[filters.category] || filters.category || "creator";
      const [suggestedAngle] = ideaAngleSuggestionsFor(topicType, manualIdeaDraft);
      const nextIdea = {
        id: `idea-general-${Date.now()}`,
        title: `${categoryLabel}: ${suggestedAngle?.title || "relatable hook"}`,
        description: suggestedAngle?.description || `A simple ${categoryLabel.toLowerCase()} short where the creator opens with a relatable problem, shows one practical shift, and ends with a clear payoff viewers can save.`,
        hashtags: ["#CreatorIdea", "#Shorts", `#${String(categoryLabel).replace(/[^a-z0-9]/gi, "")}`],
        source: "general_ai",
        topicType,
        topicTypeLabel: selectedTopicType.label,
        ...activeVideoStylePayload,
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
      topicType,
      topicTypeLabel: topicTypeLabelFor(topicType),
      ...activeVideoStylePayload,
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

  const handleContinueStoryboardToVideo = () => {
    // handleWorkspacePageClick already applies the same shot-plan/save/export gate
    // (and bypasses it when a combined video already exists) - no need to duplicate it here.
    handleWorkspacePageClick("video");
  };

  const handleClientReviewChange = (field, value) => {
    setClientReview((current) => normalizeClientReview(
      { ...current, [field]: value },
      current?.dialogueLanguage || dialogueLanguage
    ));
    setClientReviewDirty(true);
  };

  const handleClientDialogueLanguageChange = (value) => {
    const nextLanguage = String(value || "English").trim() || "English";
    const appliedLanguage = firstString(
      scriptDetailIdea?.scriptJson?.contentRules?.dialogueLanguage,
      scriptDetailIdea?.dialogueLanguage,
      dialogueLanguage,
      "English"
    );
    const languageChanged = nextLanguage.toLowerCase() !== appliedLanguage.toLowerCase();
    setClientReview((current) => {
      const reviewChat = (Array.isArray(current?.reviewChat) ? current.reviewChat : [])
        .filter((message) => !message?.languageChangePrompt);
      if (languageChanged) {
        reviewChat.push({
          id: `language-change-${Date.now()}`,
          role: "assistant",
          text: `You selected ${nextLanguage}, while the currently applied dialogue language is ${appliedLanguage}. Do you want to translate the dialogue, voice-over, captions, subtitles, and overlays to ${nextLanguage} when you Apply to all planning?`,
          targetType: "PLANNING",
          shotNumber: "",
          affectedShotNumbers: [],
          status: "AWAITING_CONFIRMATION",
          languageChangePrompt: true,
          sourceDialogueLanguage: appliedLanguage,
          targetDialogueLanguage: nextLanguage,
          createdAt: new Date().toISOString(),
        });
      }
      return normalizeClientReview({
        ...current,
        dialogueLanguage: nextLanguage,
        reviewChat,
      }, nextLanguage);
    });
    setClientReviewDirty(true);
  };

  const handleSendReviewMessage = async ({
    text,
    targetType,
    shotNumber,
    visualReferenceAssetIds = [],
    visualReferenceUsageMode = "INSPIRATION_ONLY",
  } = {}) => {
    const instruction = compactReviewInstruction(text);
    if (!instruction) return null;
    if (!isUuid(scriptDetailIdea?.scriptId)) {
      flash("Open a saved project with a screenplay before starting review chat.", "warning");
      return null;
    }
    const normalizedTarget = String(targetType || "STORYBOARD_AND_PRODUCT").toUpperCase();
    const normalizedShotNumber = Number(shotNumber) > 0 ? Number(shotNumber) : "";
    const normalizedVisualReferenceAssetIds = [...new Set(
      (Array.isArray(visualReferenceAssetIds) ? visualReferenceAssetIds : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )].slice(0, 8);
    const normalizedVisualReferenceUsageMode = String(visualReferenceUsageMode || "").toUpperCase() === "EXACT_SOURCE"
      ? "EXACT_SOURCE"
      : "INSPIRATION_ONLY";
    const message = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      text: instruction,
      targetType: normalizedTarget,
      shotNumber: normalizedShotNumber,
      visualReferenceAssetIds: normalizedVisualReferenceAssetIds,
      visualReferenceUsageMode: normalizedVisualReferenceUsageMode,
      status: "AWAITING_ANALYSIS",
      createdAt: new Date().toISOString(),
    };
    const reviewChat = [...(Array.isArray(clientReview?.reviewChat) ? clientReview.reviewChat : []), message];
    const frameFeedback = normalizedTarget === "PLANNING"
      ? clientReview?.frameFeedback || []
      : [
          ...(Array.isArray(clientReview?.frameFeedback) ? clientReview.frameFeedback : []),
          {
            id: message.id,
            targetType: normalizedTarget,
            shotNumber: normalizedShotNumber,
            instruction,
            visualReferenceAssetIds: normalizedVisualReferenceAssetIds,
            visualReferenceUsageMode: normalizedVisualReferenceUsageMode,
          },
        ];
    const nextReview = normalizeClientReview(
      { ...clientReview, reviewChat, frameFeedback },
      clientReview?.dialogueLanguage || dialogueLanguage
    );
    setClientReview(nextReview);
    setClientReviewDirty(true);
    addActivity("Client review message added", normalizedShotNumber ? `Shot ${normalizedShotNumber}` : "Complete planning");
    try {
      const ragResult = await chatStoryboardClientReview({
        scriptId: scriptDetailIdea.scriptId,
        messageId: message.id,
        message: instruction,
        targetType: normalizedTarget,
        shotNumber: normalizedShotNumber || null,
        dialogueLanguage: nextReview.dialogueLanguage || dialogueLanguage,
        currentReview: compactClientReviewForInspection(nextReview),
        visualReferenceAssetIds: normalizedVisualReferenceAssetIds,
        visualReferenceUsageMode: normalizedVisualReferenceUsageMode,
      }).unwrap();
      const analyzedReview = normalizeClientReview(
        ragResult?.review || {
          ...nextReview,
          reviewChat: [
            ...reviewChat,
            ...(ragResult?.assistantMessage ? [ragResult.assistantMessage] : []),
          ],
        },
        nextReview.dialogueLanguage || dialogueLanguage
      );
      setClientReview(analyzedReview);
      setClientReviewDirty(false);
      addActivity(
        "Current project context retrieved",
        `${ragResult?.retrievedKeys?.length || 0} planning sources · ${ragResult?.attachedImageCount || 0} current images`
      );
      flash("Change analyzed. Confirm Apply in the assistant message to update the storyboard and planning.", "success");
      return {
        message: ragResult?.userMessage || message,
        review: analyzedReview,
        rag: ragResult,
      };
    } catch (error) {
      setClientReview((current) => normalizeClientReview({
        ...current,
        reviewChat: (current?.reviewChat || []).map((item) => (
          item.id === message.id ? { ...item, status: "FAILED" } : item
        )),
      }, dialogueLanguage));
      if (isRateLimitedError(error)) {
        const retrySeconds = Math.max(1, Math.ceil(reviewRetryDelayMs(error) / 1000));
        flash(
          `Gemini reached its per-minute capacity. This is separate from your Google billing balance. Retry in about ${retrySeconds} seconds.`,
          "warning"
        );
      } else {
        flash(apiErrorMessage(error, "Could not inspect the current project for this revision."), "error");
      }
      return null;
    }
  };

  const handleUploadFontReferenceImage = async (file) => {
    if (!isUuid(scriptDetailIdea?.scriptId)) {
      flash("Generate and save the screenplay before uploading a font reference.", "warning");
      return [];
    }
    if (!file || !String(file.type || "").toLowerCase().startsWith("image/")) {
      flash("Choose a JPG, PNG, WebP, AVIF, or GIF image containing the font style.", "warning");
      return [];
    }
    if (Number(file.size || 0) > 10 * 1024 * 1024) {
      flash("Font reference images must be 10 MB or smaller.", "warning");
      return [];
    }
    try {
      const uploaded = await uploadStoryboardFontReferenceImage({
        scriptId: scriptDetailIdea.scriptId,
        file,
      }).unwrap();
      const normalizedAsset = {
        ...normalizeStoryboardReferenceAsset(uploaded),
        referenceRole: "typography_style_reference",
        assetRole: "typography_style_reference",
      };
      setClientReview((current) => normalizeClientReview({
        ...current,
        fontReferenceImages: mergeStoryboardReferenceAssets(
          current?.fontReferenceImages || [],
          [normalizedAsset]
        ),
      }, dialogueLanguage));
      addActivity("Font style reference uploaded", normalizedAsset.originalFilename || "Image sample");
      flash("Font image uploaded. Apply the review when you want AI to choose the closest renderable font.", "success");
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the font reference image."), "error");
    }
  };

  const handleUploadVisualReferenceImages = async (selectedFiles = []) => {
    if (!isUuid(scriptDetailIdea?.scriptId)) {
      flash("Generate and save the screenplay before uploading visual references.", "warning");
      return [];
    }
    const currentCount = Array.isArray(clientReview?.visualReferenceImages)
      ? clientReview.visualReferenceImages.length
      : 0;
    const remainingSlots = Math.max(0, 40 - currentCount);
    const files = (Array.isArray(selectedFiles) ? selectedFiles : Array.from(selectedFiles || []))
      .filter(Boolean)
      .slice(0, remainingSlots);
    if (!remainingSlots) {
      flash("Reference history can hold up to 40 images. Remove an older item before adding another.", "warning");
      return [];
    }
    if (!files.length) return [];
    const invalidFile = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(String(file?.type || "").toLowerCase()));
    if (invalidFile) {
      flash("Visual references must be JPG, PNG, or WebP images.", "error");
      return [];
    }
    try {
      const uploadedAssets = [];
      for (const file of files) {
        const optimizedFile = await optimizeProductReferenceFile(file);
        const uploaded = await uploadStoryboardVisualReferenceImage({
          scriptId: scriptDetailIdea.scriptId,
          file: optimizedFile,
        }).unwrap();
        uploadedAssets.push({
          ...normalizeStoryboardReferenceAsset(uploaded),
          referenceRole: "visual_inspiration_only",
          assetRole: "visual_inspiration_only",
          usageMode: "INSPIRATION_ONLY",
        });
      }
      setClientReview((current) => normalizeClientReview({
        ...current,
        visualReferenceImages: mergeStoryboardReferenceAssets(
          current?.visualReferenceImages || [],
          uploadedAssets
        ).slice(0, 8),
      }, dialogueLanguage));
      setClientReviewDirty(true);
      addActivity("Visual inspiration uploaded", `${uploadedAssets.length} image${uploadedAssets.length === 1 ? "" : "s"} marked inspiration-only`);
      flash("Visual references uploaded. They will influence both storyboard and product-frame regeneration without copying brand or packaging details.", "success");
      return uploadedAssets;
    } catch (error) {
      flash(apiErrorMessage(error, "Could not upload the visual inspiration image."), "error");
      return [];
    }
  };

  const persistClientReview = async ({ silent = false, reviewOverride = null } = {}) => {
    if (!isUuid(scriptDetailIdea?.scriptId)) {
      if (!silent) flash("Generate and save the screenplay before saving client feedback.", "warning");
      return null;
    }
    const payload = normalizeClientReview({
      ...(reviewOverride || clientReview),
      dialogueLanguage: reviewOverride?.dialogueLanguage || clientReview?.dialogueLanguage || dialogueLanguage,
    }, reviewOverride?.dialogueLanguage || clientReview?.dialogueLanguage || dialogueLanguage);
    try {
      const saved = await saveStoryboardClientReview({
        scriptId: scriptDetailIdea.scriptId,
        storyboardFeedback: payload.storyboardFeedback,
        productionFramesFeedback: payload.productionFramesFeedback,
        dialogueFeedback: payload.dialogueFeedback,
        dialogueLanguage: payload.dialogueLanguage,
        reviewStatus: payload.reviewStatus,
        frameFeedback: payload.frameFeedback,
        referenceUrls: payload.referenceUrls,
        visualReferenceImages: payload.visualReferenceImages,
        fontReferenceImages: payload.fontReferenceImages,
        reviewChat: compactReviewChatForMutation(payload.reviewChat),
        typographySystem: payload.typographySystem,
        overlayPlan: payload.overlayPlan,
        videoDirectorPlan: payload.videoDirectorPlan,
      }).unwrap();
      const normalized = normalizeClientReview(saved, payload.dialogueLanguage);
      setClientReview(normalized);
      setClientReviewDirty(false);
      setScriptDetailIdea((current) => current ? {
        ...current,
        clientReview: normalized,
        scriptJson: {
          ...(current.scriptJson || {}),
          clientReview: normalized,
        },
      } : current);
      if (!silent) {
        addActivity("Review working copy saved", `${reviewStatusLabel(normalized.reviewStatus)} · ${normalized.dialogueLanguage}`);
        flash("Review draft saved. The current screenplay and planning remain unchanged until Apply to all planning.", "success");
      }
      return normalized;
    } catch (error) {
      if (!silent) {
        flash(apiErrorMessage(error, "Could not save client feedback."), "error");
      }
      return null;
    }
  };

  const handleApplyClientReview = async ({
    reviewOverride = null,
    silent = false,
    selectedReviewMessageId = "",
  } = {}) => {
    if (!isUuid(scriptDetailIdea?.scriptId)) {
      flash("Generate and save the screenplay before applying client feedback.", "warning");
      return;
    }
    const payload = normalizeClientReview({
      ...(reviewOverride || clientReview),
      dialogueLanguage: reviewOverride?.dialogueLanguage || clientReview?.dialogueLanguage || dialogueLanguage,
    }, reviewOverride?.dialogueLanguage || clientReview?.dialogueLanguage || dialogueLanguage);
    try {
      const applied = await applyStoryboardClientReview({
        scriptId: scriptDetailIdea.scriptId,
        storyboardFeedback: payload.storyboardFeedback,
        productionFramesFeedback: payload.productionFramesFeedback,
        dialogueFeedback: payload.dialogueFeedback,
        dialogueLanguage: payload.dialogueLanguage,
        reviewStatus: payload.reviewStatus,
        frameFeedback: payload.frameFeedback,
        referenceUrls: payload.referenceUrls,
        visualReferenceImages: payload.visualReferenceImages,
        fontReferenceImages: payload.fontReferenceImages,
        reviewChat: compactReviewChatForMutation(payload.reviewChat),
        typographySystem: payload.typographySystem,
        overlayPlan: payload.overlayPlan,
        videoDirectorPlan: payload.videoDirectorPlan,
        selectedReviewMessageId: String(selectedReviewMessageId || "").trim() || null,
      }).unwrap();
      const normalized = normalizeClientReview(applied, payload.dialogueLanguage);
      const updatedShots = Array.isArray(applied?.updatedShots) ? applied.updatedShots : [];
      setClientReview(normalized);
      setClientReviewDirty(false);
      setDialogueLanguage(normalized.dialogueLanguage);
      setScriptDetailIdea((current) => current ? {
        ...current,
        dialogueLanguage: normalized.dialogueLanguage,
        clientReview: normalized,
        scriptScenes: updatedShots.length ? updatedShots : current.scriptScenes,
        scriptJson: {
          ...(current.scriptJson || {}),
          dialogueLanguage: normalized.dialogueLanguage,
          clientReview: normalized,
          typographySystem: normalized.typographySystem,
          overlayPlan: normalized.overlayPlan,
          videoDirectorPlan: normalized.videoDirectorPlan,
          planningPropagation: normalized.propagation,
          shots: updatedShots.length ? updatedShots : current.scriptJson?.shots,
        },
      } : current);
      if (updatedShots.length) {
        setGeneratedStoryboard((current) => {
          const base = current || currentStoryboard || {};
          const existingScenes = Array.isArray(base.shots) && base.shots.length
            ? base.shots
            : Array.isArray(base.scenes)
              ? base.scenes
              : [];
          const synchronizedScenes = mergeAppliedReviewScenes(existingScenes, updatedShots);
          return {
            ...base,
            dialogueLanguage: normalized.dialogueLanguage,
            shots: synchronizedScenes,
            scenes: synchronizedScenes,
          };
        });
      }
      await refetchProductionPlans?.();
      if (!silent) {
        const approvedRuleCount = Number(normalized.creativeLearning?.approvedRuleCount || 0);
        addActivity(
          "Client feedback applied",
          `${normalized.propagation?.updatedShotCount || updatedShots.length || scenes.length} shots synced across planning`
        );
        flash(
          `Client feedback was applied to the storyline, screenplay, shot plans, overlays, dialogue language, and video handoff.${approvedRuleCount > 0 ? ` ${approvedRuleCount} approved creative principle${approvedRuleCount === 1 ? "" : "s"} will guide matching future ads.` : ""}`,
          "success"
        );
      }
      return { ...normalized, updatedShots };
    } catch (error) {
      creatorDebugLog("client review propagation failed", { scriptId: scriptDetailIdea?.scriptId, error });
      if (!silent) flash(apiErrorMessage(error, "Could not apply client feedback across planning."), "error");
      return null;
    }
  };

  const handleRevertClientReview = async () => {
    if (!isUuid(scriptDetailIdea?.scriptId)) {
      flash("Generate and save the screenplay before restoring an earlier plan.", "warning");
      return;
    }
    try {
      const reverted = await revertStoryboardClientReview({
        scriptId: scriptDetailIdea.scriptId,
      }).unwrap();
      const normalized = normalizeClientReview(reverted, dialogueLanguage);
      const restoredShots = Array.isArray(reverted?.updatedShots) ? reverted.updatedShots : [];
      const restoredPlanningLanguage = firstString(
        normalized.propagation?.restoredDialogueLanguage,
        dialogueLanguage
      );
      const restoredTypography = restoredShots.find((shot) => (
        shot?.typographySystem && typeof shot.typographySystem === "object"
      ))?.typographySystem || {};
      const restoredOverlayPlan = restoredShots
        .map((shot) => shot?.overlayPlan)
        .filter((item) => item && typeof item === "object");
      const restoredVideoDirectorPlan = normalized.propagation?.restoredVideoDirectorPlan
        && typeof normalized.propagation.restoredVideoDirectorPlan === "object"
        ? normalized.propagation.restoredVideoDirectorPlan
        : {};
      setClientReview(normalized);
      setClientReviewDirty(false);
      setDialogueLanguage(restoredPlanningLanguage);
      setScriptDetailIdea((current) => current ? {
        ...current,
        dialogueLanguage: restoredPlanningLanguage,
        clientReview: normalized,
        scriptScenes: restoredShots.length ? restoredShots : current.scriptScenes,
        scriptJson: {
          ...(current.scriptJson || {}),
          dialogueLanguage: restoredPlanningLanguage,
          clientReview: normalized,
          typographySystem: restoredTypography,
          overlayPlan: restoredOverlayPlan,
          videoDirectorPlan: restoredVideoDirectorPlan,
          planningPropagation: normalized.propagation,
          shots: restoredShots.length ? restoredShots : current.scriptJson?.shots,
        },
      } : current);
      await refetchProductionPlans?.();
      addActivity(
        "Planning revision restored",
        `${restoredShots.length || scenes.length} shots returned to the pre-apply version`
      );
      flash(
        `The last applied revision was reverted. Your saved review draft and earlier planning state are restored.${normalized.propagation?.creativeLearningReverted ? " Its future-ad learning was also disabled." : ""}`,
        "success"
      );
    } catch (error) {
      creatorDebugLog("client review revert failed", { scriptId: scriptDetailIdea?.scriptId, error });
      flash(apiErrorMessage(error, "Could not restore the previous planning version."), "error");
    }
  };

  const handleApplyReviewMessage = async (message = {}, reviewOverride = null) => {
    const messageId = String(message.id || "");
    if (!messageId || reviewFrameUpdateKey) return;
    setReviewFrameUpdateKey(messageId);
    try {
      const effectiveReviewSource = reviewOverride || clientReview;
      const preliminaryAnalysisMessage = [...(effectiveReviewSource?.reviewChat || [])].reverse().find((item) => (
        String(item?.confirmationForMessageId || "") === messageId
        || String(item?.id || "") === `${messageId}-analysis`
      ));
      const preliminaryProposal = preliminaryAnalysisMessage?.proposal
        && typeof preliminaryAnalysisMessage.proposal === "object"
        ? preliminaryAnalysisMessage.proposal
        : {};
      if (!proposalHasMeaningfulPlanningDelta(preliminaryProposal)) {
        flash("This draft has no usable current-versus-proposed frame changes. Analyze the prompt again before Apply.", "warning");
        return;
      }
      const explicitEditScope = explicitReviewShotScope(message.text || message.message);
      const proposedShotNumbers = reviewAffectedShotNumbers(
        message,
        preliminaryAnalysisMessage,
        preliminaryProposal
      );
      const requestedShotNumbers = explicitEditScope.length
        ? proposedShotNumbers.filter((shotNumber) => explicitEditScope.includes(shotNumber))
        : proposedShotNumbers;
      const pairedFrameRevision = requestedShotNumbers.length > 0
        && preliminaryProposal.requiresFrameRegeneration !== false;
      const effectiveTargetType = pairedFrameRevision ? "STORYBOARD_AND_PRODUCT" : "PLANNING";
      const propagationReview = pairedFrameRevision ? {
        ...effectiveReviewSource,
        reviewChat: (effectiveReviewSource?.reviewChat || []).map((item) => (
          String(item?.id || "") === messageId
          || String(item?.confirmationForMessageId || "") === messageId
            ? {
                ...item,
                targetType: "STORYBOARD_AND_PRODUCT",
                affectedShotNumbers: requestedShotNumbers,
                status: "AWAITING_CONFIRMATION",
              }
            : item
        )),
      } : effectiveReviewSource;
      const appliedReview = await handleApplyClientReview({
        silent: true,
        reviewOverride: propagationReview,
        selectedReviewMessageId: messageId,
      });
      if (!appliedReview) {
        flash("Could not propagate this review instruction. Please retry from the chat message.", "error");
        return;
      }
      const appliedShots = Array.isArray(appliedReview.updatedShots) ? appliedReview.updatedShots : [];
      const appliedDialogueLanguage = firstText(
        appliedReview.dialogueLanguage,
        effectiveReviewSource?.dialogueLanguage,
        dialogueLanguage,
        "English"
      );
      const analysisMessage = [...(appliedReview.reviewChat || [])].reverse().find((item) => (
        String(item?.confirmationForMessageId || "") === messageId
        || String(item?.id || "") === `${messageId}-analysis`
      ));
      const proposal = analysisMessage?.proposal && typeof analysisMessage.proposal === "object"
        ? analysisMessage.proposal
        : preliminaryProposal;
      const appliedProposalShotNumbers = reviewAffectedShotNumbers(
        message,
        analysisMessage,
        proposal
      );
      const affectedShotNumbers = explicitEditScope.length
        ? appliedProposalShotNumbers.filter((shotNumber) => explicitEditScope.includes(shotNumber))
        : appliedProposalShotNumbers;
      const targetType = affectedShotNumbers.length > 0 && proposal.requiresFrameRegeneration !== false
        ? "STORYBOARD_AND_PRODUCT"
        : effectiveTargetType;
      const referenceAssetIds = new Set(
        (Array.isArray(message.visualReferenceAssetIds) ? message.visualReferenceAssetIds : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      );
      const referenceUsageMode = String(
        message.visualReferenceUsageMode || analysisMessage?.visualReferenceUsageMode || "INSPIRATION_ONLY"
      ).toUpperCase();
      const selectedReferenceAssets = (appliedReview.visualReferenceImages || [])
        .filter((asset) => referenceAssetIds.has(String(asset?.assetId || asset?.id || "").trim()))
        .map((asset) => ({
          ...asset,
          usageMode: referenceUsageMode,
          visualReferenceUsageMode: referenceUsageMode,
          referenceRole: referenceUsageMode === "EXACT_SOURCE" ? "exact_visual_source" : "visual_inspiration_only",
          assetRole: referenceUsageMode === "EXACT_SOURCE" ? "exact_visual_source" : "visual_inspiration_only",
        }));
      const selectedReferenceUrls = uniqueStrings(selectedReferenceAssets.map((asset) => (
        firstText(asset?.signedUrl, asset?.publicUrl, asset?.assetUrl, asset?.url)
      )));
      const referenceUsageGuidance = referenceUsageMode === "EXACT_SOURCE"
        ? "Use the attached client image as the exact visual source for this confirmed shot. Preserve its visible source details and composition unless the confirmed instruction explicitly changes them."
        : "Use the attached client image only as inspiration for mood, composition, lighting, texture, palette, and pacing. Preserve this project's approved product name, logo, packaging, claims, and identity; do not copy reference branding or artwork.";
      const persistFrameRevisionRetry = async (failureMessage, completedFrames = []) => {
        const retryAt = new Date().toISOString();
        const retryChat = (appliedReview.reviewChat || []).map((item) => (
          item.id === messageId
            ? {
                ...item,
                status: "AWAITING_CONFIRMATION",
                lastAttemptAt: retryAt,
                generatedFrames: completedFrames,
                affectedShotNumbers,
              }
            : item
        ));
        retryChat.push({
          id: `${messageId}-retry-${Date.now()}`,
          role: "assistant",
          confirmationForMessageId: messageId,
          targetType,
          shotNumber: affectedShotNumbers.length === 1 ? affectedShotNumbers[0] : "",
          affectedShotNumbers,
          status: "AWAITING_CONFIRMATION",
          createdAt: retryAt,
          text: failureMessage,
        });
        const retryReview = normalizeClientReview(
          { ...appliedReview, reviewChat: retryChat },
          appliedReview.dialogueLanguage
        );
        await persistClientReview({ silent: true, reviewOverride: retryReview });
        return retryReview;
      };
      const generated = [];
      const regenerationQueue = [];
      for (const shotNumber of affectedShotNumbers) {
        const targetScene = appliedShots.find((shot) => Number(shot?.shotNumber) === shotNumber)
          || scenes.find((shot) => Number(shot?.shotNumber) === shotNumber);
        if (!targetScene) {
          await persistFrameRevisionRetry(
            `Planning was updated, but Shot ${shotNumber} could not be found for frame regeneration. The revision remains pending so the storyboard, product frames, and planning sheet cannot drift apart.`,
            generated
          );
          flash(`Shot ${shotNumber} could not be loaded for regeneration. The revision remains pending.`, "warning");
          return;
        }
        const shotRevision = (Array.isArray(proposal.shotRevisions) ? proposal.shotRevisions : []).find((item) => (
          Number(item?.shotNumber || item?.shot_number) === shotNumber
        )) || {};
        const planningPreview = (Array.isArray(proposal.planningChangePreview) ? proposal.planningChangePreview : []).find((item) => (
          Number(item?.shotNumber || item?.shot_number) === shotNumber
        )) || {};
        const previewOverlay = planningPreview.overlayPlan && typeof planningPreview.overlayPlan === "object"
          ? planningPreview.overlayPlan
          : {};
        const previewPerSecondFrames = Array.isArray(planningPreview.perSecondFrames)
          ? planningPreview.perSecondFrames
          : [];
        const premiumPlanningPrompt = [
          "[APPROVED PRE-APPLY PREMIUM FRAME PLAN]",
          planningPreview.proposedFrameDescription
            ? `Proposed frame: ${planningPreview.proposedFrameDescription}`
            : "",
          planningPreview.cameraPlan ? `Camera: ${planningPreview.cameraPlan}` : "",
          planningPreview.lensFocusPlan ? `Lens and focus: ${planningPreview.lensFocusPlan}` : "",
          planningPreview.lightingPlan ? `Lighting: ${planningPreview.lightingPlan}` : "",
          planningPreview.directionPlan ? `Direction: ${planningPreview.directionPlan}` : "",
          planningPreview.transitionPlan ? `Transition: ${planningPreview.transitionPlan}` : "",
          planningPreview.soundPlan ? `Sound: ${planningPreview.soundPlan}` : "",
          `Dialogue language: ${appliedDialogueLanguage}. All spoken dialogue, voice-over, captions, subtitles, and text callouts must use ${appliedDialogueLanguage} only. Do not retain wording from the previously applied language.`,
          Object.keys(previewOverlay).length
            ? `Overlay: ${previewOverlay.enabled === false
              ? "No on-screen text."
              : [
                  previewOverlay.text ? `render only "${previewOverlay.text}"` : "use only approved copy",
                  previewOverlay.fontFamily,
                  previewOverlay.position,
                  previewOverlay.entrance,
                  previewOverlay.exit,
                ].filter(Boolean).join("; ")}`
            : "",
          previewPerSecondFrames.length
            ? `Second-by-second execution:\n${previewPerSecondFrames.map((frame) => (
                `[${frame.startTimeSeconds}-${frame.endTimeSeconds}s] ${frame.frameDescription}`
                + ` | Camera: ${frame.cameraAction}`
                + ` | Lighting: ${frame.lightingAction}`
                + ` | Focus: ${frame.focusAction}`
                + ` | Direction: ${frame.directorAction}`
                + ` | Transition: ${frame.transitionAction}`
              )).join("\n")}`
            : "",
          "Execute as a premium commercial film only: ARRI Alexa 35 or Sony Venice 2 class cinema capture, premium glass chosen for the intended scale, calibrated movement, measured focus marks, focus-puller control, 10/12-bit log or RAW intent, protected highlights, and 4K delivery oversampled from 6K/8K when supported.",
          "Use a DP and gaffer-ready lighting design with motivated key, shaped fill or negative fill, precise rim and separation, declared color-temperature and contrast intent, modifiers, flagging, reflection control, and recorded continuity. Preserve deliberate commercial-director intent and exact product choreography. No phone, casual, rookie, generic, or automatic camera, exposure, focus, lighting, or direction.",
        ].filter(Boolean).join("\n");
        const revisionPrompt = [
          firstText(
            shotRevision.imageRevisionPrompt,
            shotRevision.changeSummary,
            proposal.imageRevisionPrompt,
            proposal.changeSummary,
            message.text,
            message.message
          ),
          `Apply this instruction specifically to Shot ${shotNumber}. Preserve continuity with every preceding and following shot in the approved plan.`,
          premiumPlanningPrompt,
          selectedReferenceUrls.length ? referenceUsageGuidance : "",
        ].filter(Boolean).join("\n\n");
        const proposedShot = shotRevision.proposedShot && typeof shotRevision.proposedShot === "object"
          ? shotRevision.proposedShot
          : {};
        const sceneForRegeneration = mergeAppliedDialogueFields({
          ...targetScene,
          ...proposedShot,
          visualReferenceImages: selectedReferenceAssets.length
            ? selectedReferenceAssets
            : targetScene.visualReferenceImages,
          visualReferenceImageUrls: selectedReferenceUrls.length
            ? selectedReferenceUrls
            : targetScene.visualReferenceImageUrls,
          visualReferenceUsageMode: referenceUsageMode,
          planningChangePreview: planningPreview,
          storyboardTag: mergeAppliedDialogueFields(
            {
              ...(targetScene.storyboardTag || {}),
              ...(proposedShot.storyboardTag || {}),
            },
            targetScene.storyboardTag || {},
            appliedDialogueLanguage
          ),
        }, targetScene, appliedDialogueLanguage);
        const productFrameChangeRequired = shotRevision.productFrameChangeRequired !== false
          && planningPreview.productFrameChangeRequired !== false;
        const storyboardChangeRequired = productFrameChangeRequired
          || (shotRevision.storyboardChangeRequired !== false
            && planningPreview.storyboardChangeRequired !== false);
        regenerationQueue.push({
          shotNumber,
          sceneForRegeneration,
          revisionPrompt,
          storyboardChangeRequired,
          productFrameChangeRequired,
        });
      }
      const generateReviewFrameWithRetry = async (scene, imageKind, imageOptions) => {
        const retryableOptions = {
          ...imageOptions,
          throwOnError: true,
          suppressErrorFlash: true,
        };
        try {
          return await handleGenerateShotImage(scene, imageKind, retryableOptions);
        } catch (error) {
          if (!isRateLimitedError(error) && !isTransientServiceError(error)) {
            throw error;
          }
          const retryDelayMs = reviewRetryDelayMs(error);
          const retrySeconds = Math.max(1, Math.ceil(retryDelayMs / 1000));
          const shotNumber = Number(scene?.shotNumber || 1);
          const frameLabel = imageKind === "production" ? "product frame" : "storyboard";
          flash(
            isRateLimitedError(error)
              ? `Gemini is cooling down. Retrying Shot ${shotNumber} ${frameLabel} automatically in ${retrySeconds} seconds.`
              : `The service is recovering. Retrying Shot ${shotNumber} ${frameLabel} automatically in ${retrySeconds} seconds.`,
            "warning"
          );
          await waitForReviewRetry(retryDelayMs);
          return handleGenerateShotImage(scene, imageKind, retryableOptions);
        }
      };
      for (const {
        shotNumber,
        sceneForRegeneration,
        revisionPrompt,
        storyboardChangeRequired,
        productFrameChangeRequired,
      } of regenerationQueue) {
        if (storyboardChangeRequired) {
          try {
            const frame = await generateReviewFrameWithRetry(sceneForRegeneration, "storyboard", {
              imagePrompt: revisionPrompt,
              referenceImageUrls: selectedReferenceUrls,
              referenceImageDetails: referenceUsageGuidance,
            });
            if (!frame) {
              await persistFrameRevisionRetry(
                `The planning sheet was updated, but Shot ${shotNumber}'s storyboard image could not be regenerated. Its product frame was not changed, so that visual pair stays consistent. Select retry below to regenerate all affected shots.`,
                generated
              );
              flash(`Shot ${shotNumber} storyboard generation did not finish. Product regeneration was paused.`, "warning");
              return;
            }
            generated.push(`Shot ${shotNumber} storyboard`);
          } catch (error) {
            const reason = apiErrorMessage(error, "The image provider is temporarily unavailable.");
            await persistFrameRevisionRetry(
              `The planning sheet was updated, but the continuous storyboard sequence paused at Shot ${shotNumber}: ${reason} Its product-frame regeneration and all later shots have not started. Select retry to resume the complete affected sequence.`,
              generated
            );
            flash(`Shot ${shotNumber} storyboard paused: ${reason}`, "warning");
            return;
          }
        }
        if (productFrameChangeRequired) {
          try {
            const frame = await generateReviewFrameWithRetry(sceneForRegeneration, "production", {
              productLed: true,
              imagePrompt: [revisionPrompt, defaultProductImagePrompt(sceneForRegeneration)].filter(Boolean).join("\n\n"),
              referenceImageDetails: referenceUsageGuidance,
              productReferenceImageUrls: uniqueStrings([
                ...selectedReferenceUrls,
                ...productReferenceUrlsFromBrief(storyboardProductBrief || activeProductIntelligenceBrief),
              ]),
            });
            if (!frame) {
              await persistFrameRevisionRetry(
                `Shot ${shotNumber}'s storyboard step completed, but its matching product frame did not finish. The complete revision remains pending. Select retry below to synchronize this shot before later shots continue.`,
                generated
              );
              flash(`Shot ${shotNumber} product-frame generation did not finish. The revision remains pending.`, "warning");
              return;
            }
            generated.push(`Shot ${shotNumber} product frame`);
          } catch (error) {
            const reason = apiErrorMessage(error, "The image provider is temporarily unavailable.");
            await persistFrameRevisionRetry(
              `Shot ${shotNumber}'s storyboard step completed, but its product frame is temporarily unavailable: ${reason} Later shots have not started. Select retry below to synchronize every affected shot and the planning sheet.`,
              generated
            );
            flash(`Shot ${shotNumber} product frame paused: ${reason}`, "warning");
            return;
          }
        }
      }
      await refetchProductionPlans?.();
      const completedAt = new Date().toISOString();
      const updatedChat = (appliedReview.reviewChat || []).map((item) => (
        item.id === messageId
          ? {
              ...item,
              status: "COMPLETED",
              completedAt,
              generatedFrames: generated,
              affectedShotNumbers,
            }
          : item
      ));
      updatedChat.push({
        id: `${messageId}-result-${Date.now()}`,
        role: "assistant",
        targetType,
        shotNumber: affectedShotNumbers.length === 1 ? affectedShotNumbers[0] : "",
        affectedShotNumbers,
        status: "COMPLETED",
        createdAt: completedAt,
        text: affectedShotNumbers.length
          ? `${generated.length ? generated.join(", ") : "The requested planning changes"} ${generated.length === 1 ? "was" : "were"} completed. The planning sheet, screenplay, overlays, DP/lighting context, and complete per-second video prompt were rebuilt and are ready for review.`
          : "The feedback was propagated across the complete planning sheet and the per-second video-generation prompt was rebuilt.",
      });
      const finalReview = normalizeClientReview({ ...appliedReview, reviewChat: updatedChat }, appliedReview.dialogueLanguage);
      await persistClientReview({ silent: true, reviewOverride: finalReview });
      addActivity(
        "Review change completed",
        affectedShotNumbers.length ? `Shots ${affectedShotNumbers.join(", ")}` : "Complete planning"
      );
      const approvedRuleCount = Number(finalReview.creativeLearning?.approvedRuleCount || 0);
      flash(
        affectedShotNumbers.length
          ? `Review applied to Shots ${affectedShotNumbers.join(", ")}; frames, planning sheet, and video prompt synchronized.${approvedRuleCount > 0 ? ` ${approvedRuleCount} approved creative principle${approvedRuleCount === 1 ? "" : "s"} saved for matching future ads.` : ""}`
          : `Review applied across the complete plan and per-second video prompt.${approvedRuleCount > 0 ? ` ${approvedRuleCount} approved creative principle${approvedRuleCount === 1 ? "" : "s"} saved for matching future ads.` : ""}`,
        "success"
      );
    } catch (error) {
      creatorDebugLog("review message apply failed", { messageId, error });
      flash(apiErrorMessage(error, "Could not apply this review change."), "error");
    } finally {
      setReviewFrameUpdateKey("");
    }
  };

  const localAnimatedStoryboardReport = (reviewOverride) => buildAnimatedStoryboardHtml({
    title: buildExportTitle({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard }),
    storyline: buildExportStoryline({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard }),
    scenes,
    durationSeconds: currentStoryboard?.durationSeconds || currentStoryboard?.duration || selectedDuration,
    screenType: currentStoryboard?.screenType || screenType,
    dialogueLanguage,
    clientReview: reviewOverride || clientReview,
    productMode: productStoryboardMode,
  });

  const resolveAnimatedStoryboardReport = async (reviewOverride) => {
    const effectiveReview = reviewOverride || clientReview;
    // Build from the live planner scenes so newly regenerated storyboard and product
    // frames, manual overlay locks, and the latest motion settings are always present.
    return { ...localAnimatedStoryboardReport(effectiveReview), source: "local" };
  };

  const handleAnimatedPreview = async () => {
    if (!scenes.length) {
      flash("Generate storyboard shots before opening the animated preview.", "warning");
      return;
    }
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      flash("Allow pop-ups for Creator UI, then open Client Preview again.", "error");
      return;
    }
    previewWindow.document.open();
    previewWindow.document.write(animatedStoryboardLoadingHtml());
    previewWindow.document.close();
    setAnimatedPreviewLoading(true);
    try {
      const reviewNeededSaving = clientReviewDirty;
      const savedReview = reviewNeededSaving ? await persistClientReview({ silent: true }) : null;
      const report = await resolveAnimatedStoryboardReport(savedReview || clientReview, !reviewNeededSaving || Boolean(savedReview));
      previewWindow.document.open();
      previewWindow.document.write(report.html);
      previewWindow.document.close();
      previewWindow.focus();
      addActivity("Animated storyboard opened", `${report.shotCount} shots · ${dialogueLanguage}`);
      flash("Animated client storyboard opened in a new window.", "success");
    } catch (error) {
      previewWindow.close();
      creatorDebugLog("animated storyboard preview failed", { scriptId: scriptDetailIdea?.scriptId, error });
      flash("Could not open the animated storyboard preview.", "error");
    } finally {
      setAnimatedPreviewLoading(false);
    }
  };

  const handleAnimatedHtmlExport = async () => {
    if (!scenes.length) {
      flash("Generate storyboard shots before exporting animated HTML.", "warning");
      return;
    }
    setAnimatedHtmlExporting(true);
    try {
      const reviewNeededSaving = clientReviewDirty;
      const savedReview = reviewNeededSaving ? await persistClientReview({ silent: true }) : null;
      const report = await resolveAnimatedStoryboardReport(savedReview || clientReview, !reviewNeededSaving || Boolean(savedReview));
      const title = buildExportTitle({ activeProjectId, storyScriptIdea, scriptDetailIdea, selectedIdea, currentStoryboard });
      flash("Preparing an offline copy - embedding and watermarking images...", "success");
      const offlineHtml = await embedAndWatermarkImages(report.html, `${title} · DRAFT FOR REVIEW`, async (html, watermarkText) => {
        const response = await embedOfflineAnimatedStoryboardHtml({ scriptId: scriptDetailIdea.scriptId, html, watermarkText }).unwrap();
        return response.html;
      });
      downloadHtmlDocument(offlineHtml, animatedStoryboardFileName(title));
      addActivity("Animated HTML exported", `${report.shotCount} client-ready shots (offline, watermarked)`);
      flash("Animated storyboard HTML downloaded - fully offline, images watermarked for review.", "success");
    } catch (error) {
      creatorDebugLog("animated storyboard HTML export failed", { scriptId: scriptDetailIdea?.scriptId, error });
      flash("Could not export the animated storyboard HTML.", "error");
    } finally {
      setAnimatedHtmlExporting(false);
    }
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
        productMode: productStoryboardMode,
        dialogueLanguage,
        clientReview,
        creatorName: tenantCompanyName || authUserName || "",
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

    void refetchOrganization?.();
    addActivity("Organization configured", identity.companyName || identity.name || identity.tenantId);
    flash("Organization created and wallet service connected.");
  };

  const handleRecharge = async (body) => {
    if (!tenantId) {
      flash("Tenant is required before wallet recharge", "error");
      return;
    }
    try {
      const requestedCurrency = normalizeCurrencyCode(body?.currency || walletCurrencyCode || detectedBillingCurrencyCode);
      const order = await createWalletRecharge({ tenantId, ...body, currency: requestedCurrency }).unwrap();
      const checkoutDetails = orderCheckoutDetails(order);
      const gatewayOrderId = paymentOrderId(order);
      const paymentId = firstText(order.paymentId, order.payment_id);
      const keyId = paymentKeyId(order);
      const amountPaise = paymentAmountPaise(order, body?.amount);
      const currency = normalizeCurrencyCode(firstText(checkoutDetails.currency, order.currency, body?.currency, requestedCurrency));

      if (!gatewayOrderId) {
        throw new Error("Razorpay order response is missing checkout details.");
      }
      if (!paymentId) {
        throw new Error("Billing did not return a payment tracking id for this recharge.");
      }
      if (!keyId) {
        throw new Error("Razorpay public key is not configured for checkout.");
      }
      if (amountPaise < 100) {
        throw new Error("Recharge amount is below Razorpay minimum amount.");
      }

      await loadRazorpayCheckoutScript();
      await new Promise((resolve, reject) => {
        let settled = false;
        const rejectOnce = (error) => {
          if (settled) return;
          settled = true;
          reject(error);
        };

        const checkout = new window.Razorpay({
          key: keyId,
          amount: amountPaise,
          currency,
          name: firstText(checkoutDetails.name, "Dalai Llama Platform"),
          description: firstText(checkoutDetails.description, "Wallet recharge"),
          order_id: gatewayOrderId,
          handler: async (response) => {
            if (settled) return;
            settled = true;
            try {
              await verifyWalletPayment({
                tenantId,
                paymentId,
                gatewayOrderId: response.razorpay_order_id,
                gatewayPaymentId: response.razorpay_payment_id,
                gatewaySignature: response.razorpay_signature,
              }).unwrap();
              resolve(response);
            } catch (error) {
              reject(new Error(apiErrorMessage(error, "Payment verification failed. Wallet was not credited.")));
            }
          },
          modal: {
            ondismiss: () => {
              const error = new Error("Payment cancelled. Wallet was not recharged.");
              error.paymentCancelled = true;
              rejectOnce(error);
            },
          },
          theme: { color: "#8b5cf6" },
        });

        checkout.on("payment.failed", (response) => {
          const error = new Error(response?.error?.description || "Payment failed. Wallet was not recharged.");
          error.paymentFailed = true;
          rejectOnce(error);
        });

        checkout.open();
      });

      await refetchWallet?.();
      flash("Wallet recharge verified and credited.");
      setRechargeOpen(false);
    } catch (error) {
      flash(error?.message || apiErrorMessage(error, "Could not start Razorpay checkout."), error?.paymentCancelled ? "warning" : "error");
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

    // The lightweight project list doesn't carry video-render status, so if the
    // caller didn't pin a workspace page, check for an already-combined video and
    // land there directly instead of stopping at whatever step buildWorkflowStateFromProject
    // (which has no visibility into video generation) guessed.
    if (restored?.projectId && !options.workspacePage && isUuid(restored.scriptDetailIdea?.scriptId)) {
      try {
        const latestVideoRun = await fetchLatestScreenplayVideoRun({ scriptId: restored.scriptDetailIdea.scriptId }).unwrap();
        if (finalVideoUrlFromPayload(latestVideoRun)) {
          restored.workspacePage = "video";
          restored.planner.completedSteps.video = true;
        }
      } catch {
        // No persisted video run for this project yet - keep the derived workspace page.
      }
    }

    if (restored?.projectId) {
      const requestedWorkspacePage = options.workspacePage || restored.workspacePage;
      const targetWorkspacePage = workspacePageIds.has(requestedWorkspacePage)
        ? requestedWorkspacePage
        : requestedWorkspacePage === "shoot-polish"
          ? "video"
          : "ideas";
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
      setTopicType(restored.topicType || inferTopicTypeFromText(restored.lockedBrief?.description || restored.lockedBrief?.title));
      setProductionStyle(restored.productionStyle || DEFAULT_PRODUCTION_STYLE);
      setHybridSceneMode(restored.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE);
      setBrollStyle(restored.brollStyle || DEFAULT_BROLL_STYLE);
      setCaptionStyle(restored.captionStyle || DEFAULT_CAPTION_STYLE);
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
    const requestedTargetPage = options.workspacePage || restored?.workspacePage;
    const targetPage = workspacePageIds.has(requestedTargetPage)
      ? requestedTargetPage
      : requestedTargetPage === "shoot-polish"
        ? "video"
        : "ideas";
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
      workspacePage: "video",
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
        setTopicType(storyIdea.topicType || inferTopicTypeFromText(storyIdea.description || storyIdea.title));
        setProductionStyle(storyIdea.productionStyle || DEFAULT_PRODUCTION_STYLE);
        setHybridSceneMode(storyIdea.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE);
        setBrollStyle(storyIdea.brollStyle || DEFAULT_BROLL_STYLE);
        setCaptionStyle(storyIdea.captionStyle || DEFAULT_CAPTION_STYLE);
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
        setTopicType(scriptIdea.topicType || inferTopicTypeFromText(scriptIdea.description || scriptIdea.title));
        setProductionStyle(scriptIdea.productionStyle || DEFAULT_PRODUCTION_STYLE);
        setHybridSceneMode(scriptIdea.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE);
        setBrollStyle(scriptIdea.brollStyle || DEFAULT_BROLL_STYLE);
        setCaptionStyle(scriptIdea.captionStyle || DEFAULT_CAPTION_STYLE);
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
        <>
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
          productionStyle={productionStyle}
          onProductionStyleChange={setProductionStyle}
          productionStyleOptions={PRODUCTION_STYLE_OPTIONS}
          hybridSceneMode={hybridSceneMode}
          onHybridSceneModeChange={setHybridSceneMode}
          hybridSceneModeOptions={HYBRID_SCENE_MODE_OPTIONS}
          brollStyle={brollStyle}
          onBrollStyleChange={setBrollStyle}
          brollStyleOptions={BROLL_STYLE_OPTIONS}
          captionStyle={captionStyle}
          onCaptionStyleChange={setCaptionStyle}
          captionStyleOptions={CAPTION_STYLE_OPTIONS}
          aiProviders={availableAiProviders}
          selectedProviderCode={selectedAiProvider?.code || selectedProviderCode}
          selectedProvider={selectedAiProvider}
          onProviderChange={setSelectedProviderCode}
          providersLoading={aiProvidersLoading}
          providersError={aiProvidersError}
          pageInfo={ideaCandidatePageInfo}
          onPageChange={handleIdeaCandidatePageChange}
          onGenerateIdeas={handleGenerateStoryIdeas}
          campaignAngleSuggestions={campaignAngleSuggestions}
          selectedCampaignAngle={activeCampaignAngle}
          onGenerateCampaignAngles={handleGenerateCampaignAngles}
          onSelectCampaignAngle={handleCampaignAngleSelect}
          isGeneratingCampaignAngles={campaignAngleSuggestionState.isLoading}
          isSelectingCampaignAngle={selectLockedCampaignAngleState.isLoading}
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
        {planner.selectedIdeaId ? (
          <GraphPipelineTracePanel
            onRun={handleRunGraphPipeline}
            isStarting={runGraphPipelineState.isLoading}
            job={pipelineJob}
          />
        ) : null}
        </>
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
            humanReviewOrder={screenplayReviewOrder}
            onSubmitHumanReview={handleSubmitScreenplayReview}
            isSubmittingHumanReview={submitHumanWorkOrderState.isLoading}
          />
          <StoryboardReferenceImagePanel
            assets={storyboardReferenceAssets}
            details={storyboardReferenceDetails}
            enhanceScreenplay={storyboardEnhanceWithReference}
            uploading={uploadScreenplayVideoReferenceImageState.isLoading}
            error={storyboardReferenceUploadError}
            disabled={!scriptDetailIdea?.scriptId}
            onDetailsChange={(value) => {
              setStoryboardReferenceDetails(value);
              if (storyboardReferenceAssets.length) {
                setScriptDetailIdea((current) => applyStoryboardReferenceToScriptIdea(current, storyboardReferenceAssets, value, storyboardEnhanceWithReference));
              }
            }}
            onEnhanceChange={handleToggleStoryboardReferenceEnhancement}
            onUpload={handleUploadStoryboardReferenceImage}
            onBlockedAction={(message) => flash(message, "warning")}
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
          onUploadActorPhoto={handleUploadActorPhoto}
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

  const lowBalanceMinimum = Number(lowBalanceNotice?.minimumBalance) > 0
    ? Number(lowBalanceNotice.minimumBalance)
    : paidGenerationMinimumBalance;
  const lowBalanceShortfall = Math.max(0, lowBalanceMinimum - walletBalanceAmount);
  const lowBalanceIsEmpty = walletBalanceAmount <= 0;
  const lowBalanceTitle = lowBalanceIsEmpty ? "Wallet balance is zero" : "Wallet balance is too low";
  const lowBalanceBody = lowBalanceIsEmpty
    ? `Add at least ${formatWalletAmount(lowBalanceMinimum, walletCurrencyCode)} to start ${lowBalanceNotice?.actionLabel || "this paid flow"}.`
    : `Keep at least ${formatWalletAmount(lowBalanceMinimum, walletCurrencyCode)} to run ${lowBalanceNotice?.actionLabel || "this paid flow"}.`;

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
              <WalletBalanceButton
                wallet={wallet}
                isLoading={walletLoading}
                onRecharge={handleOpenRecharge}
                minimumBalance={creatorFlowMinimumBalance}
                minimumLabel="60-sec video flow"
              />
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
        minimumBalance={creatorFlowMinimumBalance}
        minimumLabel="60-sec video flow"
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
          creativeFlow={creativeFlow}
          onCreativeFlowChange={setCreativeFlow}
          originalIdea={manualIdeaDraft}
          onOriginalIdeaChange={handleOriginalIdeaChange}
          productAdBrief={activeProductAdBrief}
          onProductAdBriefChange={handleProductAdBriefChange}
          onUploadProductReferenceImages={handleUploadProductReferenceImages}
          isUploadingProductReferenceImages={uploadProductReferenceImagesState.isLoading}
          productAdFormatOptions={PRODUCT_AD_FORMAT_OPTIONS}
          productAdFormatPlaybooks={PRODUCT_AD_FORMAT_PLAYBOOKS}
          productAdShotTypeOptions={PRODUCT_AD_SHOT_TYPE_OPTIONS}
          onGenerateProductAdPipeline={handleGenerateProductAdPipeline}
          isGeneratingProductAdPipeline={productAdPipelineState.isLoading || Boolean(productAdPipelineJobId)}
          productAdPipelineJob={productAdPipelineJob}
          canGenerateProductAdPipeline={hasActiveProductAdInput}
          onSaveOriginalIdea={handleSaveOriginalIdea}
          onSaveTrend={handleSaveTrendBrief}
          onGenerateStoryIdeas={handleGenerateStoryIdeas}
          topicType={topicType}
          onTopicTypeChange={handleTopicTypeChange}
          topicTypeOptions={TOPIC_TYPE_OPTIONS}
          topicIdeaSuggestions={campaignAngleSuggestions}
          selectedCampaignAngle={activeCampaignAngle}
          onSelectCampaignAngle={handleCampaignAngleSelect}
          onGenerateCampaignAngles={handleGenerateCampaignAngles}
          isGeneratingCampaignAngles={campaignAngleSuggestionState.isLoading}
          canGenerateCampaignAngles={creativeFlow === "guided" && Boolean(lockedBrief?.backendLocked && isUuid(lockedBrief?.lockedIdeaId))}
          productionStyle={productionStyle}
          onProductionStyleChange={setProductionStyle}
          productionStyleOptions={PRODUCTION_STYLE_OPTIONS}
          hybridSceneMode={hybridSceneMode}
          onHybridSceneModeChange={setHybridSceneMode}
          hybridSceneModeOptions={HYBRID_SCENE_MODE_OPTIONS}
          brollStyle={brollStyle}
          onBrollStyleChange={setBrollStyle}
          brollStyleOptions={BROLL_STYLE_OPTIONS}
          captionStyle={captionStyle}
          onCaptionStyleChange={setCaptionStyle}
          captionStyleOptions={CAPTION_STYLE_OPTIONS}
          isFetching={isFetching}
          isLockingSelection={lockSelectionState.isLoading}
          isGeneratingIdeas={generatedIdeaState.isLoading || generatedIdeaAsyncState.isLoading || Boolean(ideaGenerationJobId)}
          canGenerateStoryIdeas={creativeFlow === "guided" && canGenerateStoryIdeas}
          savedBriefTitle={creativeFlow === "guided" && canGenerateStoryIdeas ? lockedBrief?.title : ""}
          aiProviders={availableAiProviders}
          selectedProviderCode={selectedAiProvider?.code || selectedProviderCode}
          selectedProvider={selectedAiProvider}
          onProviderChange={setSelectedProviderCode}
          providersLoading={aiProvidersLoading}
          providersError={aiProvidersError}
          trendsDisabled={!TREND_DISCOVERY_ENABLED}
          autoFocusOriginalIdea={workspacePage === "ideas" && !projectWorkspaceMode}
          onRefreshTrendMoments={handleRefreshWeeklyIdeaTags}
          isRefreshingTrendMoments={weeklyIdeaTagsLoading || refreshWeeklyIdeaTagsState.isLoading}
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

      {workspacePage === "video" && (
      <section id="video" className="creator-section space-y-5">
        {activeProjectSpend?.quotedTotalPrice != null && (
          <p className={`text-xs font-bold ${activeProjectSpend.withinCap ? "text-slate-400" : "text-rose-300"}`}>
            {activeProjectSpend.withinCap
              ? `₹${Math.round(activeProjectSpend.totalSpent)} of ₹${Math.round(activeProjectSpend.quotedTotalPrice)} budget used`
              : `Budget exceeded — ₹${Math.round(activeProjectSpend.totalSpent)} spent against a ₹${Math.round(activeProjectSpend.quotedTotalPrice)} quote. Further generation is blocked until this is resolved.`}
          </p>
        )}
        {isUuid(activeProjectId) && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setScenePreparationOpen((open) => !open)}
              className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-100"
            >
              <Sparkles size={14} className="text-purple-200" />
              {scenePreparationOpen ? "Hide Prepare Scene" : "Prepare Scene"}
            </button>
          </div>
        )}
        {scenePreparationOpen && isUuid(activeProjectId) && (
          <ScenePreparationPanel
            projectId={activeProjectId}
            shots={videoPanelScenes}
            activeShotId={scenePreparationShotId || selectedScene?.id || null}
            onSelectShot={setScenePreparationShotId}
            onClose={() => setScenePreparationOpen(false)}
          />
        )}
        {isUuid(activeProjectId) && allShotsVideoGenerated && (
          <div className="rounded-lg border border-purple-300/25 bg-purple-400/[0.06] p-4 space-y-3">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">Assemble the final video</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Concatenates every completed shot into one deliverable the client can watch.
                  {latestFinalRender?.completedAt
                    ? ` Last assembled ${new Date(latestFinalRender.completedAt).toLocaleString()} (${latestFinalRender.shotCount} shots).`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAssembleFinalVideo}
                disabled={createFinalRenderState.isLoading}
                className="creator-primary flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-55"
              >
                {createFinalRenderState.isLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Sparkles size={16} />}
                {createFinalRenderState.isLoading
                  ? "Assembling…"
                  : latestFinalRender?.videoUrl ? "Re-assemble" : "Assemble Final Video"}
              </button>
            </div>
            {finalRenderError && (
              <p className="text-[11px] font-semibold text-rose-300">{finalRenderError}</p>
            )}
            {latestFinalRender?.status === "COMPLETED" && latestFinalRender?.videoUrl && (
              <>
                <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-white">Client download</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      Flip this once the client has paid you. They can preview the video regardless; this only gates the download link on their review page.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <a
                      href={latestFinalRender.videoUrl}
                      download
                      className="creator-control flex items-center gap-1.5 px-3 py-2 text-xs font-black text-slate-100"
                    >
                      <Download size={14} /> Download
                    </a>
                    <label className="flex items-center gap-2 text-xs font-black text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(activeProjectDetail?.finalVideoDownloadUnlocked)}
                        onChange={(event) => handleToggleFinalVideoLock(event.target.checked)}
                        disabled={updateFinalVideoLockState.isLoading}
                        className="h-4 w-4 accent-purple-400"
                      />
                      Unlocked for client
                    </label>
                  </div>
                </div>
              <video
                key={latestFinalRender.renderId}
                src={latestFinalRender.videoUrl}
                controls
                className="mt-2 w-full rounded-lg border border-white/10 bg-black"
              />
              </>
            )}
            {latestFinalRender?.status === "FAILED" && latestFinalRender?.lastError && (
              <p className="text-[11px] font-semibold text-rose-300">Last render failed: {latestFinalRender.lastError}</p>
            )}
            {latestFinalRenderLoading && !latestFinalRender && (
              <p className="text-[11px] font-semibold text-slate-500">Checking for a previous render…</p>
            )}
          </div>
        )}
        {activeProjectDetail?.status === "VIDEO_GENERATION_COMPLETE" && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-emerald-300/25 bg-emerald-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-white">Every shot has finished generating</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Move this project into post-production to dub, edit, or upscale the final video.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/editor", { state: { projectId: activeProjectId } })}
              className="creator-primary flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-bold text-white"
            >
              Move to Post-Production <ChevronRight size={16} />
            </button>
          </div>
        )}
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,3fr)_minmax(19rem,1fr)]">
          <ScreenplayVideoGenerationPanel
            screenplay={scriptDetailIdea}
            scenes={videoPanelScenes}
            characterCastMappings={activeCharacterMappings}
            onOpenCastStep={() => handleWorkspacePageClick("cast")}
            onUploadCastReference={handleUploadCastReferenceImage}
            screenplayApproved={effectiveScreenplayApprovedForVideo}
            videoRun={currentScreenplayVideoRun}
            videoRunLoading={screenplayVideoRunLoading || latestPersistedScreenplayVideoRunLoading}
            videoJob={screenplayVideoJob || (screenplayVideoJobActive ? { status: "RUNNING", progress: 12, message: "Preparing video run" } : null)}
            finalRenderJob={screenplayVideoFinalJob || (screenplayVideoFinalJobActive ? { status: "RUNNING", progress: 18, message: "Merging accepted shot clips" } : null)}
            audioJob={screenplayVideoAudioJob || (screenplayVideoAudioJobActive ? { status: "RUNNING", progress: 18, message: "Preparing dialogue and background music" } : null)}
            productionStyle={productionStyle}
            productionStyleLabel={productionStyleLabelFor(productionStyle)}
            hybridSceneMode={hybridSceneMode}
            onHybridSceneModeChange={setHybridSceneMode}
            brollStyleLabel={brollStyleOptionFor(brollStyle).label}
            captionStyleLabel={captionStyleOptionFor(captionStyle).label}
            videoFinishingPlan={activeVideoFinishingPlan}
            onVideoFinishingPlanChange={setVideoFinishingPlan}
            videoProvider={screenplayVideoProvider}
            videoModel={screenplayVideoModel}
            onVideoProviderChange={setScreenplayVideoProvider}
            onVideoModelChange={setScreenplayVideoModel}
            storyboardReady={effectiveShotPlansReady}
            storyboardGenerated={shotsGenerated}
            storyboardLoading={shotGenerationLoading || shotPlanLoading}
            onOpenStoryboard={() => handleWorkspacePageClick("storyboard")}
            onGenerateStoryboard={handleShotPlansAction}
            onGenerateSceneImage={(scene, imageOptions) => handleGenerateShotImage(scene, "production", imageOptions)}
            onGenerateAllSceneImages={handleGenerateAllScreenplaySceneImages}
            onUploadSceneImage={handleUploadScreenplaySceneProductionImage}
            onApprove={handleApproveScreenplayForVideo}
            onGenerate={handleGenerateScreenplayVideo}
            onUploadReferenceImage={handleUploadScreenplayVideoReferenceImage}
            founderAvatarProfile={activeFounderAvatarProfile}
            availableFounderAvatars={availableFounderAvatars}
            selectedFounderAvatarKey={selectedFounderAvatarKey}
            founderAvatarLibraryLoading={reusableFounderAvatarLibraryLoading}
            onSelectFounderAvatar={handleSelectFounderAvatar}
            onFounderAvatarProfileChange={setFounderAvatarProfile}
            dialogueLanguage={dialogueLanguage}
            onDialogueLanguageChange={setDialogueLanguage}
            onUploadFounderAvatarSource={handleUploadFounderAvatarSource}
            onPrepareFounderEnglishDialogue={handlePrepareFounderEnglishDialogue}
            onGenerateFounderVoicePreview={handleGenerateFounderVoicePreview}
            onFounderVoiceDecision={handleFounderVoiceDecision}
            onPrepareFounderAvatarPortrait={handlePrepareFounderAvatarPortrait}
            onGenerateFounderAvatarTest={handleGenerateFounderAvatarTest}
            onGenerateFounderAvatarPreview={handleGenerateFounderAvatarPreview}
            onFounderAvatarDecision={handleFounderAvatarDecision}
            onUploadFounderFinalAudio={handleUploadFounderFinalAudio}
            onBlockedAction={(message) => flash(message, "warning")}
            onChatScene={handleChatScreenplayVideoScene}
            onGenerateSceneDialogueVoice={handleGenerateScreenplaySceneDialogueVoice}
            onDecideSceneDialogueVoice={handleDecideScreenplaySceneDialogueVoice}
            onCombineSceneDialogueAudio={handleCombineScreenplaySceneDialogueAudio}
            onUploadSceneAvatarImage={handleUploadScreenplaySceneAvatarImage}
            onUploadSceneReferenceImage={handleUploadScreenplaySceneReferenceImage}
            onRegenerateScene={handleRegenerateScreenplayVideoScene}
            sceneAssets={screenplaySceneAssets?.scenes || []}
            combinedVideoAsset={combinedVideoAsset}
            onSetSceneAssetAccepted={(assetId, accepted) => {
              if (!scriptDetailIdea?.scriptId) return;
              setScreenplaySceneAssetAccepted({ scriptId: scriptDetailIdea.scriptId, assetId, accepted });
            }}
            onFinalRender={handleRenderScreenplayFinalVideo}
            onGenerateAudioPack={handleGenerateScreenplayAudioPack}
            onRefreshMedia={refreshScreenplayMedia}
            onOpenScreenplay={() => handleWorkspacePageClick("screenplay")}
            editingWorkOrder={editingWorkOrder}
            onSubmitEditingJob={handleSubmitEditingJob}
            onApproveEditingJob={handleApproveEditingJob}
            onRequestEditingChanges={handleRequestEditingChanges}
            isApproving={approveScreenplayState.isLoading}
            isGenerating={screenplayVideoJobActive}
            isUploadingReferenceImage={uploadScreenplayVideoReferenceImageState.isLoading}
            isUploadingFounderAvatarSource={uploadScreenplayFounderAvatarSourceState.isLoading}
            isPreparingFounderEnglishDialogue={prepareFounderEnglishDialogueState.isLoading}
            isSelectingFounderAvatar={selectReusableFounderAvatarState.isLoading}
            isGeneratingFounderVoicePreview={generateFounderVoicePreviewState.isLoading}
            isUpdatingFounderVoiceApproval={approveFounderVoicePreviewState.isLoading}
            isPreparingFounderAvatarPortrait={prepareFounderAvatarPortraitState.isLoading}
            isGeneratingFounderAvatarTest={generateFounderAvatarTestState.isLoading}
            isGeneratingFounderAvatarPreview={generateFounderAvatarPreviewState.isLoading}
            isUpdatingFounderAvatarApproval={approveFounderAvatarPreviewState.isLoading}
            isUploadingFounderFinalAudio={uploadFounderFinalAudioState.isLoading}
            isFinalRendering={screenplayVideoFinalJobActive}
            isGeneratingAudio={screenplayVideoAudioJobActive}
            isSubmittingEditingJob={submitHumanWorkOrderState.isLoading}
            isApprovingEditingJob={approveHumanWorkOrderState.isLoading}
            isRequestingEditingChanges={requestHumanWorkOrderChangesState.isLoading}
            isGeneratingSceneImage={(scene) => visibleShotImageLoadingKeys.includes(shotImageLoadingKey(scene?.shotNumber || scene?.sceneNumber || 1, "production"))}
            isSceneWorking={(scene) => {
              const sceneId = String(scene?.id || scene?.sceneId || scene?.scene_id || "");
              const sceneGenerationLoading = generateScreenplayVideoSceneState.isLoading || regenerateScreenplayVideoSceneState.isLoading;
              const activeSceneMatches = !screenplayVideoActiveSceneId || String(screenplayVideoActiveSceneId || "") === sceneId;
              return (sceneGenerationLoading && String(screenplayVideoActiveSceneId || "") === sceneId)
                || (screenplayVideoSceneJobActive && activeSceneMatches)
                || (screenplayVideoSceneJobActive && isActiveSceneVideoStatus(scene?.status));
            }}
          />
          <MobileFrame
            scene={selectedScene}
            scenes={videoPanelScenes}
            videoRun={currentScreenplayVideoRun}
            finalVideoUrl={activeFinalVideoUrl}
            screenplay={scriptDetailIdea}
            productionStyle={productionStyle}
            cursorMs={preview.cursorMs}
            durationMs={preview.durationMs}
            isPlaying={preview.isPlaying}
            onToggle={() => dispatch(togglePlayback())}
            onSeek={(ms) => {
              const previewScenes = scriptDetailIdea?.scriptScenes?.length ? scriptDetailIdea.scriptScenes : scriptDetailIdea?.scriptJson?.shots || scenes;
              const sceneMs = preview.durationMs / Math.max(1, previewScenes.length);
              dispatch(setCursorMs(ms));
              dispatch(setCurrentSceneIndex(Math.min(Math.max(0, previewScenes.length - 1), Math.floor(ms / sceneMs))));
            }}
            onRefreshMedia={refreshScreenplayMedia}
          />
        </div>
      </section>
      )}

      {workspacePage === "client-review" && (
        <section id="client-review" className="creator-section space-y-4">
          <div className="creator-panel border-cyan-300/20 bg-gradient-to-r from-cyan-400/[0.08] via-purple-400/[0.06] to-transparent p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-200">
                  <MessageSquareText size={15} />
                  Client Review
                </div>
                <h2 className="mt-1 text-lg font-extrabold text-white">Review frames and update the complete production plan</h2>
                <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
                  Select a storyboard or product frame and describe the change. The director automatically plans premium typography, placement, motion, and pacing before the approved revision moves to Video.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleWorkspacePageClick("storyboard")}
                className="creator-control flex min-h-11 shrink-0 items-center justify-center gap-2 px-5 text-sm font-black text-white"
              >
                <Clapperboard size={16} />
                Back to Storyboard
              </button>
            </div>
          </div>
          {isUuid(scriptDetailIdea?.scriptId) && (
            <WorkspaceChatPanel
              scriptId={scriptDetailIdea.scriptId}
              onMerged={(result) => flash(`Workspace merged into the project (version ${result.mergedVersion}).`, "success")}
            />
          )}
          <ClientReviewPanel
            review={clientReview}
            shots={scenes}
            dialogueLanguage={clientReview?.dialogueLanguage || dialogueLanguage}
            shotCount={scenes.length}
            onChange={handleClientReviewChange}
            onDialogueLanguageChange={handleClientDialogueLanguageChange}
            onSave={() => persistClientReview()}
            onApply={handleApplyClientReview}
            onRevert={handleRevertClientReview}
            onUploadVisualReference={handleUploadVisualReferenceImages}
            onUploadFontReference={handleUploadFontReferenceImage}
            onSendReviewMessage={handleSendReviewMessage}
            onApplyReviewMessage={handleApplyReviewMessage}
            isLoading={clientReviewLoading}
            isSaving={saveClientReviewState.isLoading}
            isChatting={chatClientReviewState.isLoading}
            isApplying={applyClientReviewState.isLoading}
            isReverting={revertClientReviewState.isLoading}
            isUploadingVisualReference={uploadVisualReferenceState.isLoading}
            isUploadingFontReference={uploadFontReferenceState.isLoading}
            updatingReviewMessageId={reviewFrameUpdateKey}
            isDirty={clientReviewDirty}
            disabled={!isUuid(scriptDetailIdea?.scriptId)}
          />
        </section>
      )}

      {workspacePage === "storyboard" && (
      <>
      <section className="creator-panel border-cyan-300/20 bg-gradient-to-r from-cyan-400/[0.08] via-purple-400/[0.06] to-transparent p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-200">
              <ListChecks size={15} />
              Client review
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-white">Give feedback and propagate it to final planning</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Review storyboard images, product frames, dialogue, and references. Approved changes propagate through storyline, screenplay, shot planning, production frames, and animation; typography and overlay motion are directed automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleWorkspacePageClick("client-review")}
            className="creator-primary flex min-h-11 shrink-0 items-center justify-center gap-2 px-5 text-sm font-black text-white"
          >
            <Sparkles size={16} />
            Open Client Review
          </button>
        </div>
      </section>
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
      <StoryboardReferenceImagePanel
        assets={storyboardReferenceAssets}
        details={storyboardReferenceDetails}
        enhanceScreenplay={storyboardEnhanceWithReference}
        uploading={uploadScreenplayVideoReferenceImageState.isLoading}
        error={storyboardReferenceUploadError}
        disabled={!scriptDetailIdea?.scriptId}
        onDetailsChange={(value) => {
          setStoryboardReferenceDetails(value);
          if (storyboardReferenceAssets.length) {
            setScriptDetailIdea((current) => applyStoryboardReferenceToScriptIdea(current, storyboardReferenceAssets, value, storyboardEnhanceWithReference));
          }
        }}
        onEnhanceChange={handleToggleStoryboardReferenceEnhancement}
        onUpload={handleUploadStoryboardReferenceImage}
        onBlockedAction={(message) => flash(message, "warning")}
      />
      <ClientReviewPanel
        review={clientReview}
        shots={scenes}
        dialogueLanguage={clientReview?.dialogueLanguage || dialogueLanguage}
        shotCount={scenes.length}
        onChange={handleClientReviewChange}
        onDialogueLanguageChange={handleClientDialogueLanguageChange}
        onSave={() => persistClientReview()}
        onApply={handleApplyClientReview}
        onRevert={handleRevertClientReview}
        onUploadVisualReference={handleUploadVisualReferenceImages}
        onUploadFontReference={handleUploadFontReferenceImage}
        onSendReviewMessage={handleSendReviewMessage}
        onApplyReviewMessage={handleApplyReviewMessage}
        isLoading={clientReviewLoading}
        isSaving={saveClientReviewState.isLoading}
        isChatting={chatClientReviewState.isLoading}
        isApplying={applyClientReviewState.isLoading}
        isReverting={revertClientReviewState.isLoading}
        isUploadingVisualReference={uploadVisualReferenceState.isLoading}
        isUploadingFontReference={uploadFontReferenceState.isLoading}
        updatingReviewMessageId={reviewFrameUpdateKey}
        isDirty={clientReviewDirty}
        disabled={!isUuid(scriptDetailIdea?.scriptId)}
      />
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
          onAnalyzeProductReference={handleAnalyzeShotProductReference}
          onConfirmProductReference={handleConfirmShotProductReference}
          onStageProductReference={handleStageShotProductReference}
          stagedProductReferenceCount={pendingProductReferences.size}
          onAnalyzeStagedProductReferences={handleAnalyzeStagedProductReferences}
          isAnalyzingStagedProductReferences={analyzingStagedProductReferences}
          pendingProductMismatchReviews={pendingProductMismatchReviews}
          onConsumeProductMismatchReview={handleConsumeProductMismatchReview}
          castCandidateShots={castCandidateShots}
          onApplyCastToShots={handleApplyCastReferenceToOtherShots}
          onGenerateProductImages={() => handleGenerateAllScreenplaySceneImages(scenes)}
          onEditShot={handleEditStoryboardShotWithAi}
          onInsertShot={handleInsertStoryboardTimelineShot}
          onExport={handleExport}
          onPreviewAnimated={handleAnimatedPreview}
          onDownloadAnimated={handleAnimatedHtmlExport}
          onSave={handleSaveStoryboard}
          isSaved={storyboardSaved}
          onGenerateAgain={handleGenerateStoryboard}
          onGenerateShots={handleGenerateShots}
          onBlockedAction={(message) => flash(message, "warning")}
          canGenerateShots={canGenerateShots}
          generateShotsBlockedReason={generateShotsBlockedReason}
          canExport={canExportShotsPdf}
          exportBlockedReason={exportBlockedReason}
          isExporting={pdfExporting}
          isPreviewingAnimated={animatedPreviewLoading}
          isExportingAnimated={animatedHtmlExporting}
          shotsGenerated={shotsGenerated}
          isGeneratingShots={shotGenerationLoading}
          productMode={productStoryboardMode}
          productImageSummary={shotExportSummary}
          isGeneratingProductImages={productFrameGenerationLoading}
          isEditingShot={editStoryboardShotWithAiState.isLoading}
          isInsertingShot={insertStoryboardTimelineShotState.isLoading}
          isGenerating={shotPlanLoading || shotImageUrlsLoading || generateShotImageState.isLoading || editStoryboardShotWithAiState.isLoading || insertStoryboardTimelineShotState.isLoading || pdfExporting || shotGenerationLoading}
        />
        <MobileFrame
          scene={selectedScene}
          scenes={scenes}
          videoRun={currentScreenplayVideoRun}
          finalVideoUrl={activeFinalVideoUrl}
          screenplay={scriptDetailIdea}
          productionStyle={productionStyle}
          cursorMs={preview.cursorMs}
          durationMs={preview.durationMs}
          isPlaying={preview.isPlaying}
          onToggle={() => dispatch(togglePlayback())}
          onSeek={(ms) => {
            const sceneMs = preview.durationMs / Math.max(1, scenes.length);
            dispatch(setCursorMs(ms));
            dispatch(setCurrentSceneIndex(Math.min(Math.max(0, scenes.length - 1), Math.floor(ms / sceneMs))));
          }}
          onRefreshMedia={refreshScreenplayMedia}
        />
      </div>
      <GenerationStatusBar job={productionPlanJob || storyboardJob || (generateProductionPlansState.isLoading ? { status: "RUNNING", progress: 18, message: "Starting shot plan job" } : productionPlanJobId ? { status: "RUNNING", progress: 38, message: "Generating storyboard, lighting, sound, and DP plans" } : generateStoryboardAsyncState.isLoading ? { status: "RUNNING", progress: 10, message: "Starting shot generation job" } : storyboardJobId ? { status: "RUNNING", progress: 35, message: "Generating shot cards one by one" } : null)} label="Shot design" />

      <div className="creator-panel-muted flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-xs font-black uppercase tracking-normal ${storyboardSaved && canExportShotsPdf ? "text-emerald-200" : "text-amber-200"}`}>
              {storyboardSaved && canExportShotsPdf ? "Ready for video" : storyboardSaved ? "Generate all shot images to continue" : "Save production to continue"}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              {storyboardSaved && canExportShotsPdf
                ? productStoryboardMode
                  ? "Storyboard and product frames are ready for PDF export and the Video stage."
                  : "Shot plans and generated images are ready. Continue to Video to assemble the final render."
                : storyboardSaved
                  ? exportBlockedReason
                : "Review the shot plans, select Save Production, then continue to Video."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleContinueStoryboardToVideo}
            disabled={!activeFinalVideoUrl && !generatedShotNumbers.size && (!effectiveShotPlansReady || !storyboardSaved || !canExportShotsPdf)}
            aria-disabled={!activeFinalVideoUrl && !generatedShotNumbers.size && (!effectiveShotPlansReady || !storyboardSaved || !canExportShotsPdf)}
            className={`creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white ${
              !activeFinalVideoUrl && !generatedShotNumbers.size && (!effectiveShotPlansReady || !storyboardSaved || !canExportShotsPdf) ? "opacity-60" : ""
            }`}
            title={activeFinalVideoUrl
              ? "Continue to Video"
              : !effectiveShotPlansReady
                ? "Generate shot plans before continuing"
                : !storyboardSaved
                  ? "Save Production before continuing"
                  : !canExportShotsPdf
                    ? exportBlockedReason
                    : "Continue to Video"}
          >
            Continue to Video <ChevronRight size={16} />
          </button>
        </div>

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
              {effectiveShotPlansReady ? "Generated shots needed" : "Storyboard needed"}
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
              {shotGenerationLoading ? "Generating Shots" : "Open Storyboard"} <ChevronRight size={16} />
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
        <GenerationStatusBar job={shotTakeJob || (shotTakeJobId && !shotTakeJobIsError ? { status: "RUNNING", progress: 35, message: "Processing editor handoff job" } : null)} label="Editor Handoff" />
      </section>
      )}

      {tenantId && !rechargeOpen && lowBalanceNotice && (
        <div
          className="fixed inset-0 z-[75] bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={lowBalanceTitle}
          onClick={() => setLowBalanceNotice(null)}
        >
          <div
            className={`absolute bottom-4 right-4 w-[min(25rem,calc(100vw-2rem))] rounded-lg border p-3 shadow-2xl shadow-black/55 backdrop-blur-md ${
              lowBalanceIsEmpty
                ? "border-rose-300/35 bg-[#190c11]/92 text-rose-50"
                : "border-amber-300/35 bg-[#16110a]/90 text-amber-50"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                lowBalanceIsEmpty ? "bg-rose-300/15 text-rose-200" : "bg-amber-300/15 text-amber-200"
              }`}>
                <WalletCards size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${lowBalanceIsEmpty ? "text-rose-100" : "text-amber-100"}`}>{lowBalanceTitle}</p>
                <p className={`mt-1 text-xs leading-5 ${lowBalanceIsEmpty ? "text-rose-100/80" : "text-amber-100/80"}`}>
                  {lowBalanceBody} Your generated ideas and scripts stay visible after closing this.
                </p>
                <p className={`mt-1 text-[11px] font-semibold uppercase tracking-normal ${lowBalanceIsEmpty ? "text-rose-200/80" : "text-amber-200/80"}`}>
                  Balance {formatWalletAmount(walletBalanceAmount, walletCurrencyCode)} - Required {formatWalletAmount(lowBalanceMinimum, walletCurrencyCode)} - Short by {formatWalletAmount(lowBalanceShortfall, walletCurrencyCode)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLowBalanceNotice(null)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 ${
                  lowBalanceIsEmpty ? "text-rose-100/80 hover:border-rose-200/40 hover:text-rose-50" : "text-amber-100/80 hover:border-amber-200/40 hover:text-amber-50"
                }`}
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
        isLoading={rechargeState.isLoading || verifyWalletPaymentState.isLoading}
        currencyCode={walletCurrencyCode}
        regionLabel={detectedBillingRegionLabel}
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
        <CreatorModal title="Editor Handoff" onClose={handleClosePostProduction}>
          <div className="grid max-h-[72vh] gap-4 overflow-hidden lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-h-0 space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-bold text-white">Projects ready for editor handoff</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-400">
                  Only projects with storyboard or shot plans appear here.
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
                    No projects have storyboard ready yet. Generate shot plans from a project first.
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
                      <p className="mt-1 text-xs font-semibold text-slate-500">Select a shot to resume the project in Video and send assets to an editor.</p>
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
                                Open Video <ChevronRight size={12} />
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
                      Its shot thumbnails will appear here. Opening one resumes the project in the Video workspace.
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

function dialogueVoiceProfileForPlanning(characterMappings = [], castPlan = {}, scriptJson = {}, founderAvatarProfile = {}) {
  const founderProfile = normalizeFounderAvatarProfileForPlanning(founderAvatarProfile);
  if (hasFounderAvatarIdentityForPlanning(founderProfile) && founderProfile.avatarProviderMode === "dalai_llama") {
    const profile = {
      selectionSource: "founder_avatar_kit",
      speakerName: "Founder",
      voiceProvider: "dalai_llama",
      voiceModel: founderProfile.localModels.voiceModel,
      voiceId: founderProfile.voiceId,
      voiceEmbeddingId: founderProfile.voiceEmbeddingId,
      avatarId: founderProfile.avatarId,
      language: founderProfile.language,
      languageCode: founderProfile.languageCode,
    };
    return {
      dialogueVoiceProfile: profile,
      speakerName: "Founder",
      voiceProvider: "dalai_llama",
      voiceModel: founderProfile.localModels.voiceModel,
      voiceId: founderProfile.voiceId,
      voiceEmbeddingId: founderProfile.voiceEmbeddingId,
      avatarId: founderProfile.avatarId,
      founderAvatarProfile: founderProfile,
      language: founderProfile.language,
      languageCode: founderProfile.languageCode,
      stylePrompt: "Natural Hinglish founder voiceover with clear pronunciation and confident ad energy.",
    };
  }
  const mappings = Array.isArray(characterMappings) ? characterMappings : [];
  const castActors = Array.isArray(castPlan?.actors) ? castPlan.actors : [];
  const storyCharacters = resolveStoryCharactersForCast({ scriptJson });
  const candidates = [
    ...mappings.map((mapping) => ({
      ...mapping,
      ...(mapping?.characterPayload || {}),
      ...(mapping?.castPayload || {}),
      role: mapping?.characterRole || mapping?.role || mapping?.castPayload?.role || mapping?.castPayload?.roleInShort,
      speakerName: mapping?.castDisplayName || mapping?.castPayload?.name || mapping?.characterName,
    })),
    ...castActors,
    ...storyCharacters,
  ].filter((candidate) => candidate && typeof candidate === "object");
  const lead = [...candidates].sort((left, right) => dialogueVoiceCandidateScore(right) - dialogueVoiceCandidateScore(left))[0] || {};
  const voiceGender = normalizeDialogueVoiceGender(lead.gender || lead.genderIdentity || lead.castPayload?.gender || lead.characterPayload?.gender);
  const speakerName = firstString(
    lead.speakerName,
    lead.name,
    lead.displayName,
    lead.characterName,
    lead.castDisplayName
  );
  const profile = {
    selectionSource: candidates.length ? "planning_cast" : "configured_default",
    ...(voiceGender ? { voiceGender } : {}),
    ...(speakerName ? { speakerName } : {}),
  };
  return {
    dialogueVoiceProfile: profile,
    ...(voiceGender ? { voiceGender } : {}),
    ...(speakerName ? { speakerName } : {}),
  };
}

function dialogueVoiceCandidateScore(candidate = {}) {
  const role = String(
    candidate.characterRole
    || candidate.roleInShort
    || candidate.role
    || candidate.castPayload?.roleInShort
    || candidate.castPayload?.role
    || ""
  ).toLowerCase();
  let score = 0;
  if (role.includes("main")) score += 30;
  if (role.includes("lead") || role.includes("primary") || role.includes("narrator")) score += 20;
  if (normalizeDialogueVoiceGender(candidate.gender || candidate.genderIdentity || candidate.castPayload?.gender)) score += 10;
  if (candidate.name || candidate.displayName || candidate.characterName || candidate.castDisplayName) score += 1;
  return score;
}

function normalizeDialogueVoiceGender(value = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z]+/g, "");
  if (normalized.startsWith("female") || normalized === "woman" || normalized === "girl") return "female";
  if (normalized.startsWith("male") || normalized === "man" || normalized === "boy") return "male";
  return "";
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
    referenceImageUrl: attributes.referenceImageUrl || saved.referenceImageUrl || fallback.referenceImageUrl || "",
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
  const explicitStoryIdeaId = firstString(idea?.storyIdeaId, idea?.story_idea_id, idea?.ideaId, idea?.idea_id);
  const explicitScriptId = firstString(idea?.scriptId, idea?.script_id, idea?.screenplayId, idea?.screenplay_id);
  const id = String(explicitStoryIdeaId || idea?.id || `idea-generated-${Math.random().toString(36).slice(2)}`);
  const creativeNotes = idea?.creativeNotes || idea?.notes || {};
  const productIntelligenceBrief = productIntelligenceBriefFromEntity({ ...idea, creativeNotes });
  return {
    ...idea,
    id,
    storyIdeaId: explicitStoryIdeaId || idea?.storyIdeaId,
    scriptId: explicitScriptId || idea?.scriptId,
    title: idea?.title || "Generated story idea",
    description: idea?.description || idea?.summary || "AI-generated story idea from the locked brief.",
    hashtags: idea?.hashtags || idea?.tags || ["#CreatorIdea", "#Shorts"],
    source: idea?.source || "AI_FROM_LOCKED_BRIEF",
    lockedIdeaId: idea?.lockedIdeaId || idea?.locked_idea_id,
    projectId: idea?.projectId,
    storytellingType: idea?.storytellingType || idea?.storyScriptJson?.storytellingType || idea?.scriptJson?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: idea?.storytellingGuidance || idea?.storyScriptJson?.storytellingGuidance || idea?.scriptJson?.storytellingGuidance || {},
    hookLens: idea?.hookLens || idea?.storyScriptJson?.hookLens || idea?.scriptJson?.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: idea?.hookLensGuidance || idea?.storyScriptJson?.hookLensGuidance || idea?.scriptJson?.hookLensGuidance || {},
    topicType: normalizeTopicType(idea?.topicType || idea?.storyScriptJson?.topicType || idea?.scriptJson?.topicType || DEFAULT_TOPIC_TYPE),
    topicTypeLabel: idea?.topicTypeLabel || topicTypeLabelFor(idea?.topicType || idea?.storyScriptJson?.topicType || idea?.scriptJson?.topicType || DEFAULT_TOPIC_TYPE),
    productionStyle: normalizeProductionStyle(idea?.productionStyle || idea?.storyScriptJson?.productionStyle || idea?.scriptJson?.productionStyle || DEFAULT_PRODUCTION_STYLE),
    hybridSceneMode: normalizeHybridSceneMode(idea?.hybridSceneMode || idea?.storyScriptJson?.hybridSceneMode || idea?.scriptJson?.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE),
    brollStyle: normalizeBrollStyle(idea?.brollStyle || idea?.storyScriptJson?.brollStyle || idea?.scriptJson?.brollStyle || DEFAULT_BROLL_STYLE),
    captionStyle: normalizeCaptionStyle(idea?.captionStyle || idea?.storyScriptJson?.captionStyle || idea?.scriptJson?.captionStyle || DEFAULT_CAPTION_STYLE),
    productionStyleGuidance: idea?.productionStyleGuidance || idea?.storyScriptJson?.productionStyleGuidance || idea?.scriptJson?.productionStyleGuidance || productionStyleGuidanceFor(
      idea?.productionStyle || idea?.storyScriptJson?.productionStyle || idea?.scriptJson?.productionStyle || DEFAULT_PRODUCTION_STYLE,
      {
        hybridSceneMode: idea?.hybridSceneMode || idea?.storyScriptJson?.hybridSceneMode || idea?.scriptJson?.hybridSceneMode,
        brollStyle: idea?.brollStyle || idea?.storyScriptJson?.brollStyle || idea?.scriptJson?.brollStyle,
        captionStyle: idea?.captionStyle || idea?.storyScriptJson?.captionStyle || idea?.scriptJson?.captionStyle,
      }
    ),
    hookBridge: idea?.hookBridge || idea?.storyScriptJson?.hookBridge || idea?.scriptJson?.hookBridge || {},
    factualityNotes: idea?.factualityNotes || idea?.storyScriptJson?.factualityNotes || idea?.scriptJson?.factualityNotes || {},
    briefMode: idea?.briefMode || idea?.selectionContext?.briefMode || creativeNotes?.briefMode || (productIntelligenceBrief ? PRODUCT_AD_BRIEF_MODE : undefined),
    productInputKey: idea?.productInputKey || idea?.selectionContext?.productInputKey || creativeNotes?.productInputKey || productAdInputKey(productIntelligenceBrief),
    productIntelligenceBrief,
    campaignAngle: campaignAngleFromEntity(idea, creativeNotes, idea?.selectionContext),
    adConceptStrategy: idea?.adConceptStrategy || creativeNotes?.adConceptStrategy || creativeNotes?.campaignStrategy || {},
    creativeNotes,
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
  const productBrief = productIntelligenceBriefFromEntity(brief) || context.productIntelligenceBrief;
  if (productBrief && hasProductIntelligenceBrief(productBrief)) {
    return buildLocalProductAdIdeasFromBrief(brief, context, normalizeProductIntelligenceBrief(productBrief));
  }
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
  const normalizedTopicType = normalizeTopicType(context.topicType || brief?.topicType || context.filters?.category);
  const topicOption = topicTypeOptionFor(normalizedTopicType);
  const productionGuidance = productionStyleGuidanceFor(context.productionStyle || brief?.productionStyle, {
    hybridSceneMode: context.hybridSceneMode || brief?.hybridSceneMode,
    brollStyle: context.brollStyle || brief?.brollStyle,
    captionStyle: context.captionStyle || brief?.captionStyle,
  });
  const topicAngles = ideaAngleSuggestionsFor(normalizedTopicType, brief?.description || baseTitle)
    .map((item) => [item.title, item.description]);
  const seenAngles = new Set();
  const combinedAngles = [...topicAngles, ...angles].filter(([angle]) => {
    const key = String(angle || "").toLowerCase();
    if (seenAngles.has(key)) return false;
    seenAngles.add(key);
    return true;
  });

  return combinedAngles.map(([angle, description], index) => ({
    id: `idea-${seed}-${index + 1}`,
    lockedIdeaId: brief?.lockedIdeaId || brief?.id,
    projectId: brief?.projectId,
    title: `${String(index + 1).padStart(2, "0")}. ${angle}: ${baseTitle}`,
    description,
    source: "AI_FROM_LOCKED_BRIEF",
    durationSeconds: context.durationSeconds || 30,
    storytellingType: context.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: context.hookLens || DEFAULT_HOOK_LENS,
    topicType: normalizedTopicType,
    topicTypeLabel: topicOption.label,
    productionStyle: productionGuidance.mode,
    hybridSceneMode: productionGuidance.hybridSceneMode,
    brollStyle: productionGuidance.brollStyle,
    captionStyle: productionGuidance.captionStyle,
    productionStyleGuidance: productionGuidance,
    hashtags: [`#${String(categoryLabel).replace(/[^a-z0-9]/gi, "")}`, `#${angle.replace(/[^a-z0-9]/gi, "")}`, "#ShortsIdea"],
    creativeNotes: {
      hook: angle,
      targetEmotion: index % 3 === 0 ? "Fast curiosity" : index % 3 === 1 ? "Relatable humor" : "Honest connection",
      storyShape: index % 2 === 0 ? "Hook, escalation, payoff" : "Setup, reaction, practical close",
      topicType: topicOption.label,
      productionStyle: productionGuidance.label,
    },
  }));
}

function buildLocalProductAdIdeasFromBrief(brief, context = {}, productBrief = {}) {
  const normalizedProduct = normalizeProductIntelligenceBrief(productBrief);
  const productName = normalizedProduct.displayName || normalizedProduct.productName || normalizedProduct.productInputLabel || "the product";
  const seed = String(brief?.lockedIdeaId || brief?.id || normalizedProduct.productInputKey || "product").replace(/[^a-z0-9]/gi, "").slice(0, 10) || "product";
  const category = normalizedProduct.productUnderstanding?.productCategory || normalizedProduct.productCategory || "product";
  const audience = normalizedProduct.productUnderstanding?.targetAudience || normalizedProduct.targetAudience || "likely buyers";
  const usp = normalizedProduct.productUnderstanding?.usp || normalizedProduct.usp || "clear value";
  const durationSeconds = context.durationSeconds || normalizedProduct.durationSeconds || 60;
  const productionGuidance = productionStyleGuidanceFor(context.productionStyle || brief?.productionStyle || normalizedProduct.productionStyle || DEFAULT_PRODUCTION_STYLE, {
    hybridSceneMode: context.hybridSceneMode || brief?.hybridSceneMode,
    brollStyle: context.brollStyle || brief?.brollStyle,
    captionStyle: context.captionStyle || brief?.captionStyle,
  });

  return PRODUCT_AD_CONCEPT_LANES.map((lane, index) => {
    const strategy = productAdStrategyForLane(lane.key, normalizedProduct);
    const title = `${String(index + 1).padStart(2, "0")}. ${lane.title}: ${truncateText(productName, 52)}`;
    return {
      id: `idea-${seed}-${lane.key}`,
      lockedIdeaId: brief?.lockedIdeaId || brief?.id,
      projectId: brief?.projectId,
      title,
      description: strategy.summary,
      source: "AI_FROM_LOCKED_BRIEF",
      durationSeconds,
      storytellingType: context.storytellingType || DEFAULT_STORYTELLING_TYPE,
      hookLens: context.hookLens || DEFAULT_HOOK_LENS,
      topicType: normalizeTopicType(context.topicType || brief?.topicType || "product"),
      topicTypeLabel: topicTypeLabelFor(context.topicType || brief?.topicType || "product"),
      productionStyle: productionGuidance.mode,
      hybridSceneMode: productionGuidance.hybridSceneMode,
      brollStyle: productionGuidance.brollStyle,
      captionStyle: productionGuidance.captionStyle,
      productionStyleGuidance: productionGuidance,
      briefMode: PRODUCT_AD_BRIEF_MODE,
      productInputKey: normalizedProduct.productInputKey,
      productIntelligenceBrief: normalizedProduct,
      adConceptStrategy: strategy,
      hashtags: ["ProductAd", lane.key.replace(/_/g, ""), String(category).replace(/[^a-z0-9]/gi, "")].filter(Boolean),
      creativeNotes: {
        briefMode: PRODUCT_AD_BRIEF_MODE,
        productInputKey: normalizedProduct.productInputKey,
        productIntelligenceBrief: normalizedProduct,
        adConceptLane: lane.key,
        adConceptTitle: lane.title,
        hook: strategy.hook,
        cta: strategy.cta,
        targetAudience: audience,
        usp,
        marketingObjective: strategy.marketingObjective,
        productUnderstanding: normalizedProduct.productUnderstanding,
        shotPlanner: strategy.shotPlanner,
        imagePrompts: strategy.imagePrompts,
        videoPromptPlan: strategy.videoPromptPlan,
        voiceMusicCaptionPlan: strategy.voiceMusicCaptionPlan,
        editorPlan: strategy.editorPlan,
        selectionReason: strategy.selectionReason,
      },
    };
  });
}

function productAdStrategyForLane(laneKey, productBrief = {}) {
  const productName = productBrief.displayName || productBrief.productName || productBrief.productInputLabel || "the product";
  const category = productBrief.productUnderstanding?.productCategory || "product";
  const audience = productBrief.productUnderstanding?.targetAudience || "likely buyers";
  const usp = productBrief.productUnderstanding?.usp || productBrief.usp || "clear product value";
  const brandTone = productBrief.productUnderstanding?.tone || productBrief.brandTone || "credible";
  const cta = productBrief.cta || "Order today";
  const baseImagePrompts = [
    `Hero packshot of ${productName}, clean product-first commercial image, brand colors respected, vertical 9:16 safe framing`,
    `Macro sensory detail for ${productName}, premium lighting, shallow depth of field, high-retention social ad still`,
    `Lifestyle use moment for ${audience}, product visible, believable environment, natural hands and practical composition`,
    `Final end-card style image with ${productName}, clear CTA space, readable layout, no fake claims`,
  ];

  if (laneKey === "luxury_brand_story") {
    return {
      laneKey,
      marketingObjective: "Increase premium perception and purchase confidence.",
      hook: `${productName} should create desire and mystery before the audience sees the complete pack or hears ingredient detail.`,
      cta,
      summary: `Position ${productName} as a premium ${category} with sensory product shots, slow motion detail, and a clean purchase close.`,
      shotPlanner: [
        "0–2.5s brand-world hook: darkness, architectural scale, amber light, or abstract product silhouette; no ingredients and no full-pack reveal",
        "Artifact discovery: reveal only 10–20% through logo foil, edge geometry, surface engraving, material texture, or reflection",
        "Texture and craft transformation with a distinct action that avoids repeating a pour",
        "Ingredient reveal only after desire and product-world context are established",
        "Earned full product hero with approved pack identity, restrained motion, and clean CTA space",
      ],
      imagePrompts: baseImagePrompts,
      videoPromptPlan: [
        "Master in 4K minimum: 2160x3840 vertical or 3840x2160 horizontal; capture with a professional cinema-camera package, 10/12-bit log, 24fps and controlled 180-degree shutter unless a planned slow-motion beat requires higher frame rate",
        "Begin from near-black with a faint amber highlight and controlled atmospheric particles; use a professional dolly, motion-control slider, or calibrated tiny orbit while keeping product visibility below 10%",
        "Use cinema macro glass in the 85–100mm range, measured focus pulls, controlled depth of field, and a gaffer-designed moving light sweep to discover packaging or product detail without showing the whole object",
        "Transition through texture or craft, then ingredients, with physically plausible movement and no repetitive chocolate-pouring beat",
        "Reveal the full approved product only in the earned hero beat; preserve exact name, logo, pack geometry, colors, claims, and proportions",
      ],
      voiceMusicCaptionPlan: {
        voice: "Calm premium voiceover with minimal words.",
        music: "Warm modern luxury bed ducked under speech.",
        captions: "Sparse premium captions with key benefit words only.",
      },
      editorPlan: "Plan every second at commercial-director, cinematographer, gaffer, and focus-puller standard. Hold shots longer, move light as deliberately as the camera, reveal only 10–20% before the hero, use clean motivated transitions, keep sound restrained, and end on an earned full packshot.",
      selectionReason: "Best when brand perception and product desirability matter more than hard-selling.",
    };
  }

  if (laneKey === "ugc_testimonial") {
    return {
      laneKey,
      marketingObjective: "Make the product feel discovered, useful, and socially believable.",
      hook: `I did not expect ${productName} to be this useful.`,
      cta,
      summary: `Make ${productName} feel like a creator recommendation with proof beats, quick reactions, and simple buyer language.`,
      shotPlanner: [
        "Creator discovery hook",
        "Product in hand or real-use setup",
        "Visible proof/detail moment",
        "Direct recommendation and CTA",
      ],
      imagePrompts: baseImagePrompts,
      videoPromptPlan: [
        "Handheld creator-style movement, natural room light, honest framing",
        "Quick product insert with practical proof detail",
        "Fast social cut with testimonial caption emphasis",
      ],
      voiceMusicCaptionPlan: {
        voice: "Conversational first-person delivery.",
        music: "Light social rhythm ducked below voice.",
        captions: "Bold keyword captions on proof and CTA beats.",
      },
      editorPlan: "Keep cuts fast, preserve natural pauses, add small whooshes sparingly, make proof beat impossible to miss.",
      selectionReason: "Best when the buyer needs authenticity and social proof before purchase.",
    };
  }

  return {
    laneKey: "problem_solution",
    marketingObjective: "Convert a clear buyer pain into purchase intent.",
    hook: `Still choosing ordinary ${category}?`,
    cta,
    summary: `Open with a buyer problem, introduce ${productName} as the cleaner solution, then close on ${usp} and CTA.`,
    shotPlanner: [
      "Problem visual in first three seconds",
      "Product enters as the solution",
      "Benefit proof through close-ups",
      "CTA packshot",
    ],
    imagePrompts: baseImagePrompts,
    videoPromptPlan: [
      "Fast contrast cut from problem state to product reveal",
      "Cinematic product push-in with benefit text-safe framing",
      "Clean final packshot with motion accent and CTA space",
    ],
    voiceMusicCaptionPlan: {
      voice: "Direct response voiceover with clear benefit order.",
      music: "Fast modern pulse ducked under dialogue.",
      captions: "High-contrast captions for problem, solution, benefit, CTA.",
    },
    editorPlan: "Use fast opening cuts, tighten every pause, add crisp transition accents, keep CTA readable.",
    selectionReason: "Best for immediate conversion and paid performance testing.",
  };
}

function buildLocalStoryScriptFromIdea(idea, durationSeconds = 30, dialogueLanguage = "English", screenType = "vertical", category = "creator", storytellingType = DEFAULT_STORYTELLING_TYPE, hookLens = DEFAULT_HOOK_LENS) {
  const title = idea?.title || "Creator Story Script";
  const { spokenLines } = localLanguageLines(dialogueLanguage, title);
  const normalizedStorytellingType = normalizeStorytellingType(storytellingType);
  const normalizedHookLens = normalizeHookLens(hookLens);
  const normalizedTopicType = normalizeTopicType(idea?.topicType || category);
  const productionGuidance = productionStyleGuidanceFor(idea?.productionStyle || DEFAULT_PRODUCTION_STYLE, {
    hybridSceneMode: idea?.hybridSceneMode,
    brollStyle: idea?.brollStyle,
    captionStyle: idea?.captionStyle,
  });
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
    topicType: normalizedTopicType,
    topicTypeLabel: topicTypeLabelFor(normalizedTopicType),
    productionStyle: productionGuidance.mode,
    hybridSceneMode: productionGuidance.hybridSceneMode,
    brollStyle: productionGuidance.brollStyle,
    captionStyle: productionGuidance.captionStyle,
    productionStyleGuidance: productionGuidance,
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
    topicType: normalizedTopicType,
    productionStyle: productionGuidance.mode,
    hybridSceneMode: productionGuidance.hybridSceneMode,
    brollStyle: productionGuidance.brollStyle,
    captionStyle: productionGuidance.captionStyle,
    productionStyleGuidance: productionGuidance,
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
  const normalizedTopicType = normalizeTopicType(idea?.topicType || category);
  const productionGuidance = productionStyleGuidanceFor(idea?.productionStyle || DEFAULT_PRODUCTION_STYLE, {
    hybridSceneMode: idea?.hybridSceneMode,
    brollStyle: idea?.brollStyle,
    captionStyle: idea?.captionStyle,
  });
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
      generationMode: productionGuidance.mode === "full_ai" ? "ai_generated" : index % 3 === 0 ? "talking_head" : "ai_generated",
      brollStyle: productionGuidance.brollStyle,
      captionStyle: productionGuidance.captionStyle,
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
      topicType: normalizedTopicType,
      topicTypeLabel: topicTypeLabelFor(normalizedTopicType),
      productionStyle: productionGuidance.mode,
      hybridSceneMode: productionGuidance.hybridSceneMode,
      brollStyle: productionGuidance.brollStyle,
      captionStyle: productionGuidance.captionStyle,
      productionStyleGuidance: productionGuidance,
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
        const fullAiScene = productionGuidance.mode === "full_ai";
        return {
          shotNumber: index + 1,
          title: scene.camera,
          purpose: scene.intent,
          shotType: scene.camera,
          cameraAngle: screenType === "horizontal" ? "Centered 16:9 frame" : "Centered 9:16 frame",
          cameraMovement: index % 2 === 0 ? "Static" : "Handheld light",
          fps: 30,
          storytellingRole,
          generationMode: scene.generationMode,
          brollStyle: scene.brollStyle,
          captionStyle: scene.captionStyle,
          targetProvider: fullAiScene || scene.generationMode === "ai_generated" ? "seedance" : "record_or_upload",
          assetCaptureMode: fullAiScene ? "generate" : relatedVisual ? "record_or_generate" : "record",
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
    topicType: normalizedTopicType,
    productionStyle: productionGuidance.mode,
    hybridSceneMode: productionGuidance.hybridSceneMode,
    brollStyle: productionGuidance.brollStyle,
    captionStyle: productionGuidance.captionStyle,
    productionStyleGuidance: productionGuidance,
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

function normalizeTopicType(value = DEFAULT_TOPIC_TYPE) {
  const normalized = String(value || DEFAULT_TOPIC_TYPE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["ai", "software", "tools", "tech"].includes(normalized)) return "technology";
  if (["startup", "sales", "marketing", "brand"].includes(normalized)) return "business";
  if (["demo", "saas", "offer"].includes(normalized)) return "product";
  if (["wellness", "medical", "habit"].includes(normalized)) return "health";
  if (["gym", "workout", "sports"].includes(normalized)) return "fitness";
  if (["recipe", "cooking", "meal"].includes(normalized)) return "food";
  if (["skin", "makeup", "fashion"].includes(normalized)) return "beauty";
  if (["money", "career", "investing"].includes(normalized)) return "finance";
  if (["family", "couple", "friends", "friendship"].includes(normalized)) return "relationships";
  if (["funny", "skit", "satire"].includes(normalized)) return "comedy";
  if (TOPIC_TYPE_OPTIONS.some((option) => option.value === normalized)) return normalized;
  return DEFAULT_TOPIC_TYPE;
}

function topicTypeOptionFor(value = DEFAULT_TOPIC_TYPE) {
  const normalized = normalizeTopicType(value);
  return TOPIC_TYPE_OPTIONS.find((option) => option.value === normalized) || TOPIC_TYPE_OPTIONS.find((option) => option.value === DEFAULT_TOPIC_TYPE) || TOPIC_TYPE_OPTIONS[0];
}

function topicTypeLabelFor(value = DEFAULT_TOPIC_TYPE) {
  return topicTypeOptionFor(value)?.label || "Lifestyle";
}

function inferTopicTypeFromText(text = "", fallback = DEFAULT_TOPIC_TYPE) {
  const value = String(text || "").toLowerCase();
  if (/ai|automation|software|tool|app|code|tech|chatgpt|workflow/.test(value)) return "technology";
  if (/startup|brand|business|founder|sales|marketing|customer|growth/.test(value)) return "business";
  if (/product|demo|feature|offer|saas|launch/.test(value)) return "product";
  if (/learn|teach|study|course|exam|explain|tutorial|student/.test(value)) return "education";
  if (/health|wellness|sleep|stress|doctor|care|habit/.test(value)) return "health";
  if (/gym|fitness|workout|weight|muscle|run|yoga/.test(value)) return "fitness";
  if (/food|recipe|meal|kitchen|cook|protein|lunch|dinner/.test(value)) return "food";
  if (/skin|beauty|makeup|glow|hair|style|fashion/.test(value)) return "beauty";
  if (/travel|trip|place|city|hotel|flight|itinerary/.test(value)) return "travel";
  if (/money|finance|salary|saving|invest|career|budget/.test(value)) return "finance";
  if (/wife|husband|couple|family|friend|relationship|parent/.test(value)) return "relationships";
  if (/comedy|funny|pov|skit|joke|satire/.test(value)) return "comedy";
  if (/culture|india|local|society|history|festival|language/.test(value)) return "culture";
  return normalizeTopicType(fallback);
}

function ideaAngleSuggestionsFor(topicType = DEFAULT_TOPIC_TYPE, briefText = "", productIntelligenceBrief = null) {
  if (productIntelligenceBrief && hasProductIntelligenceBrief(productIntelligenceBrief)) {
    return PRODUCT_AD_CONCEPT_LANES.map((lane) => ({
      title: lane.title,
      description: lane.description,
    }));
  }
  const option = topicTypeOptionFor(topicType);
  const baseAngles = option?.angles || topicTypeOptionFor(DEFAULT_TOPIC_TYPE).angles || [];
  const brief = truncateText(String(briefText || "").trim(), 72);
  const contextual = brief
    ? [
        ["Audience POV", `Show the topic through a viewer who wants "${brief}" to feel simpler or more useful.`],
        ["Personal test", `Make the creator try "${brief}" in one small real moment with a visible payoff.`],
        ["Fast contrast", `Contrast the confusing version of "${brief}" with the cleaner version viewers can remember.`],
      ]
    : [];
  return [...baseAngles, ...contextual].map(([title, description]) => ({ title, description }));
}

function normalizeProductAdBrief(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const imageAssets = uniqueProductReferenceAssets([
    ...(Array.isArray(source.imageAssets) ? source.imageAssets : []),
    ...(Array.isArray(source.productImageAssets) ? source.productImageAssets : []),
    ...(Array.isArray(source.referenceImageAssets) ? source.referenceImageAssets : []),
  ]).slice(0, 8);
  const assetUrls = imageAssets.map(productReferenceAssetUrl).filter(Boolean);
  const manualImageUrls = splitProductImageUrls(source.imageUrlsText || source.imageUrlText);
  const sourceProductImageUrls = uniqueStrings([
    ...manualImageUrls,
    ...splitProductImageUrls(source.sourceProductImageUrls),
    ...splitProductImageUrls(source.uploadedImageUrls),
    ...splitProductImageUrls(source.imageUrls),
    ...splitProductImageUrls(source.productImageUrls),
    ...splitProductImageUrls(source.referenceImageUrls),
    ...assetUrls,
  ]).slice(0, 8);
  const linkedImageUrls = manualImageUrls.length
    ? manualImageUrls
    : sourceProductImageUrls.filter((url) => !assetUrls.includes(url));
  const imageUrlsText = linkedImageUrls.join("\n");
  const adFormat = PRODUCT_AD_FORMAT_OPTIONS.some((option) => option.value === source.adFormat)
    ? source.adFormat
    : DEFAULT_PRODUCT_AD_BRIEF.adFormat;
  const selectedShotTypes = uniqueStrings(firstArray(source.selectedShotTypes, source.shotTypes, source.preferredShotTypes))
    .filter((value) => PRODUCT_AD_SHOT_TYPE_OPTIONS.some((option) => option.value === value));
  const customShotRecipe = source.shotRecipeSource === "custom" && selectedShotTypes.length > 0;
  // Preserve source.productInput exactly as typed (including a trailing space mid-word) rather
  // than routing it through firstString's trim() - this runs on every keystroke via
  // handleProductAdBriefChange, so trimming here silently ate the space the user just pressed.
  // Only fall back to the other (trimmed) candidates when productInput itself is genuinely empty.
  const productInput = source.productInput !== undefined && source.productInput !== null && String(source.productInput) !== ""
    ? String(source.productInput)
    : firstString(source.input, source.productUrl, source.sourceUrl, source.productName, source.displayName, source.productInputLabel);
  return {
    ...DEFAULT_PRODUCT_AD_BRIEF,
    ...source,
    productInput,
    imageUrlsText,
    imageUrls: sourceProductImageUrls,
    sourceProductImageUrls,
    uploadedImageUrls: uniqueStrings([
      ...splitProductImageUrls(source.uploadedImageUrls),
      ...assetUrls,
    ]),
    imageAssets,
    ingredientDetails: String(source.ingredientDetails || source.ingredients || source.productUnderstanding?.ingredients || "").slice(0, 150),
    targetAudience: String(source.targetAudience || source.productUnderstanding?.targetAudience || ""),
    campaignObjective: String(source.campaignObjective || DEFAULT_PRODUCT_AD_BRIEF.campaignObjective).slice(0, 240),
    adFormat,
    selectedShotTypes: customShotRecipe ? selectedShotTypes : [],
    shotRecipeSource: customShotRecipe ? "custom" : "auto_product",
    noHumans: Boolean(source.noHumans ?? source.no_humans),
  };
}

function productAdFormatPlaybookFor(adFormat = DEFAULT_PRODUCT_AD_BRIEF.adFormat) {
  return PRODUCT_AD_FORMAT_PLAYBOOKS[adFormat]
    || PRODUCT_AD_FORMAT_PLAYBOOKS[DEFAULT_PRODUCT_AD_BRIEF.adFormat];
}

function productAdBriefFromPipelineResult(result = {}, currentBrief = {}) {
  if (!result || typeof result !== "object") return null;
  const product = firstObject(result.productIntelligence, result.product, result.productUnderstanding) || {};
  const current = normalizeProductAdBrief(currentBrief);
  const generatedAssets = firstArray(result.generatedAssets)
    .map((asset) => firstString(asset?.assetUrl, asset?.signedUrl, asset?.publicUrl))
    .filter(Boolean);
  const imageUrls = uniqueStrings([
    ...splitProductImageUrls(product.sourceImages || product.imageUrls || product.productImageUrls || product.referenceImageUrls),
    ...splitProductImageUrls(current.sourceProductImageUrls || current.imageUrls || current.productImageUrls),
  ]).slice(0, 8);
  const displayName = firstString(
    product.productName,
    product.displayName,
    product.name,
    product.productUnderstanding?.productName,
    current.productName,
    current.displayName,
    current.productInput
  );
  const sourceUrl = firstString(product.productUrl, product.sourceUrl, current.sourceUrl, current.productUrl);
  const productUnderstanding = {
    ...(current.productUnderstanding || {}),
    productName: displayName,
    sourceType: sourceUrl ? "product_url" : imageUrls.length ? "product_images" : "product_name",
    sourceUrl,
    imageUrls,
    brandColors: firstArray(product.brandColors, product.visualIdentity?.colors, current.productUnderstanding?.brandColors),
    logo: firstString(product.logoUrl, product.logo, current.productUnderstanding?.logo),
    packaging: firstString(product.packaging, product.packagingDescription, current.productUnderstanding?.packaging),
    productCategory: firstString(product.productCategory, product.category, current.productUnderstanding?.productCategory),
    ingredients: firstString(product.ingredients, current.ingredientDetails, current.productUnderstanding?.ingredients),
    usp: firstString(product.usp, product.description, current.productUnderstanding?.usp),
    benefits: firstArray(product.benefits, current.productUnderstanding?.benefits),
    targetAudience: firstString(product.targetAudience, result.marketResearch?.audience, current.targetAudience, current.productUnderstanding?.targetAudience),
    price: firstString(product.price, current.productUnderstanding?.price),
    customerReviews: firstArray(product.customerReviews, product.reviews, current.productUnderstanding?.customerReviews),
    competitorPositioning: firstString(result.marketResearch?.positioning, product.competitorPositioning, current.productUnderstanding?.competitorPositioning),
    tone: firstString(product.adTone, product.tone, result.adTone, current.productUnderstanding?.tone),
    adTone: firstString(product.adTone, product.tone, result.adTone, current.productUnderstanding?.adTone),
    toneRationale: firstString(product.toneRationale, result.toneRationale, current.productUnderstanding?.toneRationale),
    evidencePolicy: "Backend product research enriched this brief. Unknown facts must stay marked as unknown or inferred.",
  };
  return normalizeProductAdBrief({
    ...current,
    mode: PRODUCT_AD_BRIEF_MODE,
    briefMode: PRODUCT_AD_BRIEF_MODE,
    productInput: firstString(sourceUrl, displayName, current.productInput),
    productUrl: sourceUrl,
    sourceUrl,
    productName: displayName,
    displayName,
    imageUrls,
    imageUrlsText: normalized.imageUrlsText || "",
    sourceProductImageUrls: imageUrls,
    imageAssets: current.imageAssets,
    ingredientDetails: firstString(product.ingredients, current.ingredientDetails),
    targetAudience: firstString(product.targetAudience, current.targetAudience),
    campaignObjective: firstString(product.campaignObjective, current.campaignObjective),
    adTone: firstString(product.adTone, product.tone, result.adTone),
    toneRationale: firstString(product.toneRationale, result.toneRationale),
    productUnderstanding,
    productIntelligence: product,
    marketResearch: result.marketResearch || {},
    adConcepts: firstArray(result.adConcepts),
    generatedAssets,
    srtFile: result.srtFile,
    videoFinishingPlan: result.videoFinishingPlan,
  });
}

function workflowStateFromProductAdPipelineResult(result = {}, currentBrief = {}) {
  if (!result || typeof result !== "object") return null;
  const workflow = firstObject(result.savedWorkflow, result.workflowIds, result.persistedWorkflow, result.workflow);
  const product = firstObject(result.productIntelligence, result.product, result.productUnderstanding) || {};
  const videoRequest = firstObject(result.videoGenerationRequest);
  const shotPlan = firstArray(result.shotPlan, videoRequest.scenes, result.scenes);
  const scriptId = firstString(result.scriptId, workflow.scriptId, videoRequest.scriptId);
  const storyIdeaId = firstString(result.storyIdeaId, workflow.storyIdeaId, videoRequest.storyIdeaId);
  const lockedIdeaId = firstString(result.lockedIdeaId, workflow.lockedIdeaId, videoRequest.lockedIdeaId);
  const projectId = firstString(result.projectId, workflow.projectId, videoRequest.projectId);
  if (!scriptId || !storyIdeaId || !lockedIdeaId) return null;
  const brief = normalizeProductAdBrief(currentBrief);
  const title = firstString(
    product.productName,
    product.name,
    result.title,
    brief.displayName,
    brief.productName,
    "Product ad"
  );
  const scriptText = firstString(result.storyScript, result.script, videoRequest.script, brief.campaignObjective);
  const durationSeconds = Number(result.durationSeconds || videoRequest.durationSeconds || videoRequest.targetDurationSeconds || brief.durationSeconds || 60) || 60;
  const scriptJson = {
    projectTitle: title,
    title,
    script: scriptText,
    shots: shotPlan,
    scenes: shotPlan,
    duration: durationSeconds,
    durationSeconds,
    screenType: firstString(result.screenType, videoRequest.screenType, brief.screenType, "vertical"),
    categoryCode: firstString(result.categoryCode, videoRequest.categoryCode, "advertisement"),
    productionStyle: "full_ai",
    hybridSceneMode: "ai_only",
    noHumans: Boolean(result.noHumans ?? videoRequest.noHumans ?? brief.noHumans),
    shotPlanningMode: firstString(result.shotPlanningMode, videoRequest.shotPlanningMode, brief.shotRecipeSource),
    screenplayApprovedForVideo: true,
    approvalStatus: "AUTO_APPROVED_PRODUCT_AD_PIPELINE",
    productIntelligence: product,
    productIntelligenceBrief: brief,
    productImageUrls: productReferenceUrlsFromBrief(brief),
    referenceImageUrls: productReferenceUrlsFromBrief(brief),
    productImageAssets: firstArray(brief.imageAssets),
    referenceImageAssets: firstArray(brief.imageAssets),
    marketResearch: result.marketResearch || {},
    adConcepts: firstArray(result.adConcepts),
    videoFinishingPlan: firstObject(result.videoFinishingPlan, videoRequest.videoFinishingPlan),
    soundDesignPlan: firstObject(result.soundDesignPlan, videoRequest.soundDesignPlan),
    audioProductionPlan: firstObject(result.audioProductionPlan, videoRequest.audioProductionPlan),
    editingPlan: firstObject(result.editingPlan, result.editorHandoffPlan, videoRequest.editingPlan, videoRequest.editorHandoffPlan),
    editorHandoffPlan: firstObject(result.editorHandoffPlan, result.editingPlan, videoRequest.editorHandoffPlan, videoRequest.editingPlan),
    videoPacingProfile: firstObject(result.videoPacingProfile, videoRequest.videoPacingProfile),
    videoConsistencyBible: firstObject(result.videoConsistencyBible, videoRequest.videoConsistencyBible),
    generatedAssets: firstArray(result.generatedAssets),
    srt: result.srt || videoRequest.srt,
    srtFile: result.srtFile || videoRequest.srtFile,
    srtCues: firstArray(result.srtCues, videoRequest.srtCues),
  };
  const lockedBrief = {
    id: lockedIdeaId,
    lockedIdeaId,
    projectId,
    backendLocked: true,
    title,
    description: firstString(product.usp, product.summary, result.strategySummary, title),
    durationSeconds,
    topicType: "advertisement",
    productionStyle: "full_ai",
    hybridSceneMode: "ai_only",
    productIntelligenceBrief: brief,
    productIntelligence: product,
    selectionPayload: {
      productIntelligenceBrief: brief,
      productAdPipelineResult: result,
      productionStyle: "full_ai",
      hybridSceneMode: "ai_only",
    },
  };
  const storyScriptIdea = {
    id: storyIdeaId,
    ideaId: storyIdeaId,
    storyIdeaId,
    lockedIdeaId,
    projectId,
    title,
    description: firstString(result.strategySummary, product.usp, title),
    storyScriptText: scriptText,
    storyScriptJson: buildInitialStoryRevisionPayload({ script: scriptText, shots: shotPlan }),
    scenes: shotPlan,
    durationSeconds,
    status: "SCRIPT_GENERATED",
    productionStyle: "full_ai",
    hybridSceneMode: "ai_only",
  };
  const scriptDetailIdea = {
    ...storyScriptIdea,
    scriptId,
    script: scriptText,
    scriptText,
    scriptJson,
    scriptScenes: shotPlan,
    scenes: shotPlan,
    rawPromptResponse: result,
    status: "GENERATED",
    screenplayApprovedForVideo: true,
    productionPlanTags: firstArray(result.productionPlanTags),
    videoGenerationRequest: videoRequest,
  };
  return { lockedBrief, storyScriptIdea, scriptDetailIdea };
}

function hasProductAdInput(value = {}) {
  const normalized = normalizeProductAdBrief(value);
  return Boolean(
    String(normalized.productInput || "").trim()
    || String(normalized.productUrl || "").trim()
    || String(normalized.productName || "").trim()
    || splitProductImageUrls(normalized.imageUrlsText || normalized.imageUrls || normalized.productImageUrls).length
  );
}

function buildProductIntelligenceBrief(productAdBrief = {}, campaignNotes = "", context = {}) {
  const normalized = normalizeProductAdBrief(productAdBrief);
  if (!hasProductAdInput(normalized)) return null;
  const configuredImageUrls = splitProductImageUrls(
    normalized.sourceProductImageUrls
    || normalized.imageUrls
    || normalized.productImageUrls
    || normalized.imageUrlsText
  );
  const productInput = firstString(normalized.productInput, normalized.productUrl, normalized.productName);
  const sourceUrl = isHttpUrl(productInput) ? productInput : firstString(normalized.productUrl, normalized.sourceUrl);
  const imageUrls = uniqueStrings([
    ...configuredImageUrls,
    ...(isProductReferenceImageUrl(sourceUrl) ? [sourceUrl] : []),
  ]);
  const productName = firstString(normalized.productName, isHttpUrl(productInput) ? inferProductNameFromUrl(productInput) : productInput, "Product campaign");
  const notes = String(campaignNotes || normalized.campaignNotes || normalized.notes || "").trim();
  const category = inferProductCategory(`${productInput} ${notes}`);
  const ingredientDetails = String(normalized.ingredientDetails || "").slice(0, 150);
  const targetAudience = firstString(normalized.targetAudience, inferProductAudience(category, notes));
  const resolvedAdTone = firstString(
    normalized.adTone,
    normalized.productUnderstanding?.adTone,
    normalized.productUnderstanding?.tone
  );
  const displayName = productName || inferProductNameFromUrl(sourceUrl) || "Product campaign";
  const adFormatOption = PRODUCT_AD_FORMAT_OPTIONS.find((option) => option.value === normalized.adFormat)
    || PRODUCT_AD_FORMAT_OPTIONS[0];
  const formatPlaybook = productAdFormatPlaybookFor(adFormatOption.value);
  const selectedShotTypes = normalized.shotRecipeSource === "custom" ? normalized.selectedShotTypes : [];
  const selectedShotTypeLabels = selectedShotTypes
    .map((value) => PRODUCT_AD_SHOT_TYPE_OPTIONS.find((option) => option.value === value)?.label)
    .filter(Boolean);
  const productUnderstanding = {
    productName: displayName,
    sourceType: sourceUrl ? "product_url" : imageUrls.length ? "product_images" : "product_name",
    sourceUrl,
    imageUrls,
    brandColors: [],
    logo: "",
    packaging: "",
    productCategory: category,
    ingredients: ingredientDetails,
    usp: notes || "Value proposition to be inferred from product context.",
    benefits: [],
    targetAudience,
    price: "",
    customerReviews: [],
    competitorPositioning: "",
    tone: resolvedAdTone,
    adTone: resolvedAdTone,
    toneSelectionMode: "AUTO_FROM_PRODUCT_CONTEXT",
    toneRationale: firstString(normalized.toneRationale, normalized.productUnderstanding?.toneRationale),
    evidencePolicy: "Use provided URL/name/images as source. Mark unknown facts as inferred; do not invent ingredients, price, reviews, or claims.",
  };
  const briefSummary = limitTextWords(
    `Create a ${context.durationSeconds || 60}s ${adFormatOption.label.toLowerCase()} commercial for ${displayName}.${notes ? ` Notes: ${notes}` : ""}`,
    45
  );
  const brief = {
    mode: PRODUCT_AD_BRIEF_MODE,
    briefMode: PRODUCT_AD_BRIEF_MODE,
    productInput,
    productInputLabel: sourceUrl ? sourceUrl : displayName,
    sourceUrl,
    productName: displayName,
    displayName,
    imageUrls,
    sourceProductImageUrls: imageUrls,
    imageAssets: firstArray(normalized.imageAssets),
    ingredientDetails,
    targetAudience,
    campaignNotes: notes,
    campaignAngle: context.campaignAngle || normalized.campaignAngle || null,
    campaignObjective: normalized.campaignObjective || "",
    adTone: resolvedAdTone,
    toneSelectionMode: "AUTO_FROM_PRODUCT_CONTEXT",
    cta: normalized.cta || "Order today",
    adFormat: adFormatOption.value,
    adFormatLabel: adFormatOption.label,
    adFormatDescription: adFormatOption.description,
    formatPlaybook,
    selectedShotTypes,
    selectedShotTypeLabels,
    shotRecipeSource: normalized.shotRecipeSource,
    autoPlanShotTypes: normalized.shotRecipeSource !== "custom",
    noHumans: Boolean(normalized.noHumans),
    creativeDirection: {
      adFormat: adFormatOption.label,
      adFormatKey: adFormatOption.value,
      adFormatDescription: adFormatOption.description,
      formatPlaybook,
      requestedShotTypes: selectedShotTypeLabels,
      shotRecipeSource: normalized.shotRecipeSource,
      autoPlanShotTypes: normalized.shotRecipeSource !== "custom",
      noHumans: Boolean(normalized.noHumans),
      campaignNotes: notes,
      ingredientDetails,
      targetAudience,
      campaignObjective: normalized.campaignObjective || "",
      toneSelectionMode: "AUTO_FROM_PRODUCT_CONTEXT",
      adTone: resolvedAdTone,
      storytellingType: context.storytellingType || DEFAULT_STORYTELLING_TYPE,
      hookLens: context.hookLens || "",
      hookBridge: defaultHookBridgeFor(context.hookLens),
      retentionStrategy: "Open with an immediate product-relevant hook, add a fresh proof or visual payoff every few seconds, and reserve the clearest packshot plus CTA for the final beat.",
      pacingStyle: context.pacingStyle || (Number(context.durationSeconds || 60) <= 30 ? "FAST" : "BALANCED"),
      brollStyle: context.brollStyle || "",
      captionStyle: context.captionStyle || "",
      productReferencePolicy: "Use supplied product images only as product/package reference. Do not turn storyboard sketches into final product visuals.",
    },
    countryCode: context.countryCode || "",
    durationSeconds: context.durationSeconds || 60,
    topicType: context.topicType || "product",
    productionStyle: context.productionStyle || DEFAULT_PRODUCTION_STYLE,
    dialogueLanguage: context.dialogueLanguage || "Hinglish",
    screenType: context.screenType || "vertical",
    storytellingType: context.storytellingType || DEFAULT_STORYTELLING_TYPE,
    hookLens: context.hookLens || "",
    brollStyle: context.brollStyle || "",
    captionStyle: context.captionStyle || "",
    productUnderstanding,
    adConceptLanes: PRODUCT_AD_CONCEPT_LANES,
    briefSummary,
  };
  return {
    ...brief,
    productInputKey: productAdInputKey(brief),
  };
}

function normalizeProductIntelligenceBrief(value = {}) {
  if (!value || typeof value !== "object") return null;
  const productUnderstanding = {
    ...(value.productUnderstanding || {}),
  };
  const imageAssets = uniqueProductReferenceAssets([
    ...(Array.isArray(value.imageAssets) ? value.imageAssets : []),
    ...(Array.isArray(value.productImageAssets) ? value.productImageAssets : []),
    ...(Array.isArray(value.referenceImageAssets) ? value.referenceImageAssets : []),
  ]).slice(0, 8);
  const configuredImageUrls = splitProductImageUrls(
    value.sourceProductImageUrls
    || value.imageUrls
    || value.productImageUrls
    || value.referenceImageUrls
    || productUnderstanding.imageUrls
    || value.imageUrlsText
  );
  const productInput = firstString(
    value.productInput,
    value.input,
    value.productUrl,
    value.sourceUrl,
    value.productName,
    value.displayName,
    value.productInputLabel,
    productUnderstanding.productName
  );
  const sourceUrl = firstString(value.sourceUrl, value.productUrl, isHttpUrl(productInput) ? productInput : "");
  const imageUrls = uniqueStrings([
    ...configuredImageUrls,
    ...imageAssets.map(productReferenceAssetUrl).filter(Boolean),
    ...(isProductReferenceImageUrl(sourceUrl) ? [sourceUrl] : []),
  ]).slice(0, 8);
  const displayName = firstString(
    value.displayName,
    value.productName,
    productUnderstanding.productName,
    isHttpUrl(productInput) ? inferProductNameFromUrl(productInput) : productInput,
    imageUrls.length ? "Image-led product" : ""
  );
  if (!productInput && !displayName && !imageUrls.length) return null;
  const normalized = {
    ...value,
    mode: value.mode || value.briefMode || PRODUCT_AD_BRIEF_MODE,
    briefMode: value.briefMode || value.mode || PRODUCT_AD_BRIEF_MODE,
    productInput,
    productInputLabel: firstString(value.productInputLabel, sourceUrl, displayName),
    sourceUrl,
    productName: displayName,
    displayName,
    imageUrls,
    sourceProductImageUrls: imageUrls,
    imageAssets,
    imageUrlsText: firstString(value.imageUrlsText, imageUrls.join("\n")),
    ingredientDetails: String(value.ingredientDetails || productUnderstanding.ingredients || "").slice(0, 150),
    targetAudience: firstString(value.targetAudience, productUnderstanding.targetAudience),
    campaignObjective: value.campaignObjective || "",
    adTone: firstString(value.adTone, productUnderstanding.adTone, productUnderstanding.tone),
    toneRationale: firstString(value.toneRationale, productUnderstanding.toneRationale),
    toneSelectionMode: value.toneSelectionMode || "AUTO_FROM_PRODUCT_CONTEXT",
    cta: value.cta || "Order today",
    productUnderstanding: {
      ...productUnderstanding,
      productName: displayName,
      productCategory: value.productCategory || productUnderstanding.productCategory || inferProductCategory(productInput || displayName),
      ingredients: String(value.ingredientDetails || productUnderstanding.ingredients || "").slice(0, 150),
      targetAudience: value.targetAudience || productUnderstanding.targetAudience || inferProductAudience(productUnderstanding.productCategory, value.campaignNotes),
      tone: firstString(value.adTone, value.brandTone, productUnderstanding.adTone, productUnderstanding.tone),
      adTone: firstString(value.adTone, productUnderstanding.adTone, productUnderstanding.tone),
      toneRationale: firstString(value.toneRationale, productUnderstanding.toneRationale),
      toneSelectionMode: value.toneSelectionMode || productUnderstanding.toneSelectionMode || "AUTO_FROM_PRODUCT_CONTEXT",
      imageUrls,
    },
    adConceptLanes: value.adConceptLanes || PRODUCT_AD_CONCEPT_LANES,
  };
  return {
    ...normalized,
    productInputKey: value.productInputKey || productAdInputKey(normalized),
  };
}

function hasProductIntelligenceBrief(value = {}) {
  const normalized = normalizeProductIntelligenceBrief(value);
  return Boolean(normalized?.productInputKey || normalized?.displayName || normalized?.imageUrls?.length);
}

function campaignAngleFromEntity(...entities) {
  for (const entity of entities) {
    if (!entity || typeof entity !== "object") continue;
    const selectionContext = firstObject(entity.selectionContext, entity.selection_context) || {};
    const selectionPayload = firstObject(
      entity.selectionPayload,
      entity.selection_payload,
      selectionContext.selectionPayload,
      selectionContext.selection_payload
    ) || {};
    const sourceBrief = firstObject(entity.sourceBrief, selectionContext.sourceBrief, selectionPayload.sourceBrief) || {};
    const productBrief = firstObject(entity.productIntelligenceBrief, selectionPayload.productIntelligenceBrief, sourceBrief.productIntelligenceBrief) || {};
    const candidate = firstObject(
      entity.campaignAngle,
      selectionPayload.campaignAngle,
      selectionContext.campaignAngle,
      sourceBrief.campaignAngle,
      productBrief.campaignAngle
    );
    if (candidate && firstString(candidate.title, candidate.description)) {
      return candidate;
    }
  }
  return null;
}

function productIntelligenceBriefFromEntity(entity = {}) {
  if (!entity || typeof entity !== "object") return null;
  if (
    entity.briefMode === PRODUCT_AD_BRIEF_MODE
    || entity.mode === PRODUCT_AD_BRIEF_MODE
    || entity.productInput
    || entity.productUrl
    || entity.sourceUrl
    || entity.productUnderstanding
  ) {
    const directSelf = normalizeProductIntelligenceBrief(entity);
    if (directSelf && hasProductIntelligenceBrief(directSelf)) return directSelf;
  }
  const selectionContext = firstObject(entity.selectionContext, entity.selection_context) || {};
  const selectionPayload = firstObject(entity.selectionPayload, entity.selection_payload, selectionContext.selectionPayload, selectionContext.selection_payload) || {};
  const creativeNotes = firstObject(entity.creativeNotes, entity.notes) || {};
  const sourceBrief = firstObject(entity.sourceBrief, selectionContext.sourceBrief) || {};
  const direct = firstObject(
    entity.productIntelligenceBrief,
    entity.product_intelligence_brief,
    entity.productBrief,
    entity.product_brief,
    selectionPayload.productIntelligenceBrief,
    selectionPayload.product_intelligence_brief,
    selectionContext.productIntelligenceBrief,
    selectionContext.product_intelligence_brief,
    sourceBrief.productIntelligenceBrief,
    creativeNotes.productIntelligenceBrief,
    creativeNotes.product_intelligence_brief
  );
  if (direct) return normalizeProductIntelligenceBrief(direct);
  const productUnderstanding = firstObject(
    entity.productUnderstanding,
    entity.product_understanding,
    selectionPayload.productUnderstanding,
    selectionContext.productUnderstanding,
    creativeNotes.productUnderstanding
  );
  return productUnderstanding ? normalizeProductIntelligenceBrief({ productUnderstanding }) : null;
}

function productIntelligenceBriefForWorkflow(...entities) {
  for (const entity of entities) {
    const direct = normalizeProductIntelligenceBrief(entity);
    if (direct && hasProductIntelligenceBrief(direct)) return direct;
    const productBrief = productIntelligenceBriefFromEntity(entity);
    if (productBrief && hasProductIntelligenceBrief(productBrief)) return productBrief;
  }
  return null;
}

function productAdInputKey(value = {}) {
  if (!value || typeof value !== "object") return "";
  const productInput = firstString(
    value.productInput,
    value.input,
    value.productUrl,
    value.sourceUrl,
    value.productName,
    value.displayName,
    value.productInputLabel,
    value.productUnderstanding?.productName
  );
  const imageUrls = splitProductImageUrls(value.imageUrls || value.productImageUrls || value.referenceImageUrls || value.imageUrlsText);
  const raw = [productInput, ...imageUrls].filter(Boolean).join("|");
  return raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9|._/-]+/g, "-")
    .slice(0, 240);
}

function brandContextFromProductIntelligence(productBrief = null) {
  const normalized = normalizeProductIntelligenceBrief(productBrief);
  if (!normalized) return null;
  const understanding = normalized.productUnderstanding || {};
  return normalizeBrandContextForApi({
    brandName: normalized.brandName || "",
    productName: normalized.displayName || normalized.productName || understanding.productName || "",
    productCategory: understanding.productCategory || normalized.productCategory || "",
    offer: normalized.campaignNotes || understanding.usp || "",
    campaignObjective: normalized.campaignObjective || "",
    ingredientDetails: normalized.ingredientDetails || understanding.ingredients || "",
    targetAudience: normalized.targetAudience || understanding.targetAudience || "",
    brandTone: normalized.adTone || understanding.adTone || understanding.tone || "",
    toneSelectionMode: normalized.toneSelectionMode || "AUTO_FROM_PRODUCT_CONTEXT",
    cta: normalized.cta || "Order today",
    adFormat: normalized.adFormatLabel || normalized.adFormat || "Product Showcase",
    adFormatKey: normalized.adFormat || "product_showcase",
    formatPlaybook: normalized.formatPlaybook || normalized.creativeDirection?.formatPlaybook || productAdFormatPlaybookFor(normalized.adFormat),
    requestedShotTypes: normalized.selectedShotTypeLabels || normalized.selectedShotTypes || [],
    storytellingType: normalized.storytellingType || normalized.creativeDirection?.storytellingType || "",
    hookLens: normalized.hookLens || normalized.creativeDirection?.hookLens || "",
    retentionStrategy: normalized.creativeDirection?.retentionStrategy || "",
    requiredMentions: [understanding.usp].filter(Boolean),
    bannedClaims: normalized.bannedClaims || [],
    restrictions: ["Do not invent price, reviews, ingredients, guarantees, or competitor claims."],
    visualIdentity: {
      colors: understanding.brandColors || [],
      logoRequired: Boolean(understanding.logo),
      styleNotes: understanding.packaging || "Keep the product and packaging visually consistent across shots.",
    },
    metadata: {
      productInputKey: normalized.productInputKey,
      sourceUrl: normalized.sourceUrl || "",
      imageUrls: normalized.imageUrls || [],
      imageAssets: normalized.imageAssets || [],
      creativeDirection: normalized.creativeDirection || {},
      productUnderstanding: understanding,
    },
  });
}

function normalizeBrandContextForApi(brandContext = null) {
  if (!brandContext || typeof brandContext !== "object" || Array.isArray(brandContext)) return brandContext;
  return {
    ...brandContext,
    campaignObjective: String(brandContext.campaignObjective || "").slice(0, 240),
  };
}

function adConceptStrategyFromIdea(idea = {}) {
  const notes = firstObject(idea?.creativeNotes, idea?.notes) || {};
  const strategy = firstObject(idea?.adConceptStrategy, notes.adConceptStrategy, notes.campaignStrategy) || {};
  if (Object.keys(strategy).length) return strategy;
  if (!notes.adConceptLane && !notes.hook && !notes.shotPlanner) return {};
  return {
    laneKey: notes.adConceptLane || "",
    title: notes.adConceptTitle || "",
    hook: notes.hook || "",
    cta: notes.cta || "",
    marketingObjective: notes.marketingObjective || "",
    shotPlanner: notes.shotPlanner || [],
    imagePrompts: notes.imagePrompts || [],
    videoPromptPlan: notes.videoPromptPlan || [],
    voiceMusicCaptionPlan: notes.voiceMusicCaptionPlan || {},
    editorPlan: notes.editorPlan || "",
  };
}

function splitProductImageUrls(value) {
  if (Array.isArray(value)) {
    return value.flatMap(splitProductImageUrls);
  }
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 12);
}

function productReferenceAssetUrl(asset = {}) {
  return firstString(
    asset?.assetUrl,
    asset?.signedUrl,
    asset?.publicUrl,
    asset?.imageUrl,
    asset?.url
  );
}

function uniqueProductReferenceAssets(assets = []) {
  const seen = new Set();
  return (Array.isArray(assets) ? assets : [])
    .filter((asset) => asset && typeof asset === "object")
    .filter((asset) => {
      const key = firstString(
        asset?.bucket && asset?.objectKey ? `${asset.bucket}/${asset.objectKey}` : "",
        asset?.bucket && asset?.object_key ? `${asset.bucket}/${asset.object_key}` : "",
        productReferenceAssetUrl(asset)
      );
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function productReferenceUrlsFromBrief(productBrief = {}) {
  const understanding = firstObject(productBrief?.productUnderstanding) || {};
  return uniqueStrings([
    ...splitProductImageUrls(productBrief?.sourceProductImageUrls),
    ...splitProductImageUrls(productBrief?.imageUrls),
    ...splitProductImageUrls(productBrief?.productImageUrls),
    ...splitProductImageUrls(productBrief?.referenceImageUrls),
    ...splitProductImageUrls(understanding?.imageUrls),
    ...firstArray(productBrief?.imageAssets).map(productReferenceAssetUrl).filter(Boolean),
  ]).slice(0, 8);
}

async function optimizeProductReferenceFile(file) {
  if (!file || typeof createImageBitmap !== "function" || file.size <= 3 * 1024 * 1024) {
    return file;
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) return file;
    const baseName = String(file.name || "product-reference").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

function isHttpUrl(value = "") {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function isProductReferenceImageUrl(value = "") {
  if (!isHttpUrl(value)) return false;
  try {
    return /\.(avif|gif|jpe?g|png|webp)$/i.test(new URL(String(value).trim()).pathname);
  } catch {
    return false;
  }
}

function inferProductNameFromUrl(value = "") {
  try {
    const url = new URL(String(value || "").trim());
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || url.hostname.replace(/^www\./, "");
    return titleCase(last.replace(/\.(html?|php)$/i, "").replace(/[-_]+/g, " "));
  } catch {
    return "";
  }
}

function titleCase(value = "") {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function inferProductCategory(value = "") {
  const text = String(value || "").toLowerCase();
  if (/coffee|tea|latte|espresso|brew/.test(text)) return "coffee";
  if (/skin|serum|cream|beauty|makeup|hair/.test(text)) return "beauty";
  if (/shoe|shirt|fashion|wear|bag|watch/.test(text)) return "fashion";
  if (/protein|snack|food|butter|milk|drink|beverage/.test(text)) return "food";
  if (/app|saas|software|tool|platform/.test(text)) return "software";
  if (/fitness|gym|workout|supplement/.test(text)) return "fitness";
  return "product";
}

function inferProductAudience(category = "", notes = "") {
  const text = `${category} ${notes}`.toLowerCase();
  if (/coffee|software|saas|tool/.test(text)) return "working professionals";
  if (/beauty|skin|hair/.test(text)) return "beauty-conscious buyers";
  if (/fitness|protein|gym/.test(text)) return "fitness-focused buyers";
  if (/food|snack|beverage/.test(text)) return "everyday shoppers";
  return "likely buyers";
}

function inferProductBrandTone(value = "") {
  const text = String(value || "").toLowerCase();
  if (/luxury|premium|gold|rich|elegant/.test(text)) return "premium";
  if (/fun|viral|ugc|creator|casual/.test(text)) return "social and conversational";
  if (/trust|proof|clinical|safe/.test(text)) return "credible";
  return "clear and persuasive";
}

function normalizeProductionStyle(value = DEFAULT_PRODUCTION_STYLE) {
  const normalized = String(value || DEFAULT_PRODUCTION_STYLE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["ai", "fullai", "full_ai_video", "all_ai"].includes(normalized)) return "full_ai";
  if (["mixed", "mix", "talking_head_ai", "talking_head_plus_ai"].includes(normalized)) return "hybrid";
  return PRODUCTION_STYLE_OPTIONS.some((option) => option.value === normalized) ? normalized : DEFAULT_PRODUCTION_STYLE;
}

function productionStyleOptionFor(value = DEFAULT_PRODUCTION_STYLE) {
  const normalized = normalizeProductionStyle(value);
  return PRODUCTION_STYLE_OPTIONS.find((option) => option.value === normalized) || PRODUCTION_STYLE_OPTIONS[0];
}

function productionStyleLabelFor(value = DEFAULT_PRODUCTION_STYLE) {
  return productionStyleOptionFor(value)?.label || "Hybrid";
}

function normalizeHybridSceneMode(value = DEFAULT_HYBRID_SCENE_MODE) {
  const normalized = String(value || DEFAULT_HYBRID_SCENE_MODE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["ask", "ask_user", "ask_human_or_ai"].includes(normalized)) return "ask_speaking_scenes";
  if (["human", "human_talking_head", "talking_head_first"].includes(normalized)) return "human_first";
  if (["ai", "ai_generated", "ai_generated_first"].includes(normalized)) return "ai_first";
  if (["founder_only", "avatar_only", "talking_head_only", "all_founder"].includes(normalized)) return "full_founder";
  return HYBRID_SCENE_MODE_OPTIONS.some((option) => option.value === normalized) ? normalized : DEFAULT_HYBRID_SCENE_MODE;
}

function hybridSceneModeOptionFor(value = DEFAULT_HYBRID_SCENE_MODE) {
  const normalized = normalizeHybridSceneMode(value);
  return HYBRID_SCENE_MODE_OPTIONS.find((option) => option.value === normalized) || HYBRID_SCENE_MODE_OPTIONS[0];
}

function normalizeBrollStyle(value = DEFAULT_BROLL_STYLE) {
  const normalized = String(value || DEFAULT_BROLL_STYLE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["cinematic", "stylized", "premium"].includes(normalized)) return "cinematic_social";
  if (["ugc", "real", "phone"].includes(normalized)) return "ugc_real";
  return BROLL_STYLE_OPTIONS.some((option) => option.value === normalized) ? normalized : DEFAULT_BROLL_STYLE;
}

function brollStyleOptionFor(value = DEFAULT_BROLL_STYLE) {
  const normalized = normalizeBrollStyle(value);
  return BROLL_STYLE_OPTIONS.find((option) => option.value === normalized) || BROLL_STYLE_OPTIONS[0];
}

function normalizeCaptionStyle(value = DEFAULT_CAPTION_STYLE) {
  const normalized = String(value || DEFAULT_CAPTION_STYLE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (["bold", "keyword", "styled", "full"].includes(normalized)) return "bold_keyword";
  if (["karaoke", "animated"].includes(normalized)) return "karaoke_pop";
  if (["subtitle", "clean"].includes(normalized)) return "clean_subtitle";
  return CAPTION_STYLE_OPTIONS.some((option) => option.value === normalized) ? normalized : DEFAULT_CAPTION_STYLE;
}

function captionStyleOptionFor(value = DEFAULT_CAPTION_STYLE) {
  const normalized = normalizeCaptionStyle(value);
  return CAPTION_STYLE_OPTIONS.find((option) => option.value === normalized) || CAPTION_STYLE_OPTIONS[0];
}

function productionStyleGuidanceFor(value = DEFAULT_PRODUCTION_STYLE, styleOptions = {}) {
  const option = productionStyleOptionFor(value);
  const fullAi = option.value === "full_ai";
  const hybridMode = hybridSceneModeOptionFor(styleOptions.hybridSceneMode);
  const fullFounder = !fullAi && hybridMode.value === "full_founder";
  const broll = brollStyleOptionFor(styleOptions.brollStyle);
  const captions = captionStyleOptionFor(styleOptions.captionStyle);
  return {
    mode: option.value,
    label: option.label,
    aiScenePercent: fullFounder ? 0 : option.aiScenePercent,
    talkingHeadPercent: fullFounder ? 100 : option.talkingHeadPercent,
    hybridSceneMode: hybridMode.value,
    hybridSceneModeLabel: hybridMode.label,
    brollStyle: broll.value,
    brollStyleLabel: broll.label,
    captionStyle: captions.value,
    captionStyleLabel: captions.label,
    seedanceMaxClipSeconds: 15,
    scenePlanningRule: fullAi
      ? "Every timeline scene should be generated as AI video with Seedance-compatible prompts."
      : fullFounder
        ? "Every timeline scene must show the uploaded founder and use generationMode talking_head; split the complete spoken script into consecutive model-safe clips without dropping or paraphrasing dialogue."
        : "Mix talking-head scenes with generated AI visual scenes; ask for Human or AI on speaking scenes when hybridSceneMode is ask_speaking_scenes, and mark each scene with generationMode as talking_head or ai_generated.",
    brollRule: `Use ${broll.label} B-roll for non-speaking inserts, transitions, and visual support scenes.`,
    captionRule: captions.value === "none" ? "Do not burn in captions unless required for accessibility." : `Use ${captions.label} captions across spoken and key text moments.`,
    mergeRule: "Generate each timeline scene as <=15 second clips, then merge clips in timeline order to meet the target duration.",
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

function videoGenerationModeForStyle(productionStyle = DEFAULT_PRODUCTION_STYLE, requestedMode = "") {
  if (normalizeProductionStyle(productionStyle) === "full_ai") return "ai_generated";
  return requestedMode || "";
}

function normalizeScreenplayVideoProvider(provider = "gemini_omni") {
  const normalized = String(provider || "gemini_omni").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "gemini_omni" || normalized === "google_omni" || normalized === "omni_flash" || normalized === "omini_flash" || normalized === "gemini_omni_flash" || normalized === "google_omni_flash") return "gemini_omni";
  if (normalized === "omini" || normalized === "omni" || normalized === "openai_omni" || normalized === "openai_omini") return "omini";
  if (normalized === "veo" || normalized === "google_veo" || normalized === "google_video" || normalized === "vertex_veo") return "gemini_omni";
  if (normalized === "dalai_llama" || normalized === "dallai_llama" || normalized === "local" || normalized === "open_source" || normalized === "opensource") return "seedance";
  if (normalized === "synthesia" || normalized === "synthesia_api") return "synthesia";
  if (normalized === "seedance" || normalized === "seed_dance" || normalized === "fal_seedance" || normalized === "fal_ai_seedance") return "seedance";
  return "seedance";
}

function defaultScreenplayVideoModelForProvider(provider = "gemini_omni") {
  const normalized = normalizeScreenplayVideoProvider(provider);
  if (normalized === "google_veo") return "veo-3.1-generate-preview";
  if (normalized === "gemini_omni") return "gemini-omni-flash-preview";
  if (normalized === "omini") return "omini-video";
  if (normalized === "dalai_llama") return "ltx_video";
  if (normalized === "synthesia") return "synthesia-avatar-video";
  return "bytedance/seedance-2.0";
}

function compatibleScreenplayVideoModelForProvider(provider = "gemini_omni", model = "") {
  const normalizedProvider = normalizeScreenplayVideoProvider(provider);
  const normalizedModel = String(model || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (!normalizedModel) return defaultScreenplayVideoModelForProvider(normalizedProvider);
  if (normalizedProvider === "gemini_omni" && !(normalizedModel.includes("gemini") || normalizedModel.includes("omni"))) {
    return defaultScreenplayVideoModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "omini" && !(normalizedModel.includes("omini") || normalizedModel.includes("omni"))) {
    return defaultScreenplayVideoModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "seedance" && !(normalizedModel.includes("seedance") || normalizedModel.includes("seed_dance"))) {
    return defaultScreenplayVideoModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "dalai_llama" && !(normalizedModel.includes("ltx") || normalizedModel.includes("liveportrait") || normalizedModel.includes("echo") || normalizedModel.includes("face") || normalizedModel.includes("avatar") || normalizedModel.includes("local"))) {
    return defaultScreenplayVideoModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "synthesia" && !(normalizedModel.includes("synthesia") || normalizedModel.includes("avatar") || normalizedModel.includes("digital"))) {
    return defaultScreenplayVideoModelForProvider(normalizedProvider);
  }
  return model || defaultScreenplayVideoModelForProvider(normalizedProvider);
}

function maxClipSecondsForVideoProvider(provider = "gemini_omni", model = "") {
  const normalized = normalizeScreenplayVideoProvider(provider);
  const normalizedModel = String(model || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (normalized === "google_veo") return 8;
  if (/\b20\b|20s|twenty|long/.test(normalizedModel)) return 20;
  if (normalized === "dalai_llama") return 8;
  if (normalized === "synthesia") return 20;
  if (normalized === "gemini_omni") return 10;
  return 15;
}

function videoModelCapabilityForScreenplay(provider = "gemini_omni", model = "") {
  const normalizedProvider = normalizeScreenplayVideoProvider(provider);
  const compatibleModel = compatibleScreenplayVideoModelForProvider(normalizedProvider, model);
  const maxClipSeconds = maxClipSecondsForVideoProvider(normalizedProvider, compatibleModel);
  return {
    videoProvider: normalizedProvider,
    videoModel: compatibleModel,
    maxClipSeconds,
    maxDialogueSecondsPerShot: Math.max(1, maxClipSeconds - 1),
    dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
  };
}

function normalizeFounderAvatarProfileForPlanning(...values) {
  const merged = {};
  const localModelSources = [];
  values.forEach((value) => {
    const source = firstObject(value) || {};
    const embeddedProfile = firstObject(
      source.founderAvatarProfile,
      source.founderKit,
      source.avatarProfile,
      source.scriptJson?.founderAvatarProfile,
      source.scriptJson?.founderKit,
      source.scriptJson?.creatorContext?.founderAvatarProfile,
      source.scriptJson?.creatorContext?.founderKit,
      source.metadata?.founderAvatarProfile
    ) || {};
    const profile = Object.keys(embeddedProfile).length
      ? embeddedProfile
      : looksLikeFounderAvatarProfileSourceForPlanning(source)
        ? source
        : {};
    mergeFounderProfileFieldsForPlanning(merged, profile);
    localModelSources.push(
      firstObject(profile.localModels, profile.localAvatarModels),
      firstObject(source.localModels, source.localAvatarModels),
      firstObject(source.scriptJson?.localModels, source.scriptJson?.localAvatarModels),
      firstObject(source.scriptJson?.creatorContext?.localModels, source.scriptJson?.creatorContext?.localAvatarModels)
    );
  });
  const localModels = normalizeFounderLocalModelsForPlanning(...localModelSources);
  const avatarProviderMode = normalizeAvatarProviderModeForPlanning(firstString(
    merged.avatarProviderMode,
    merged.providerMode,
    merged.avatarProvider,
    merged.provider,
    "dalai_llama"
  ));
  const synthesiaAvatarId = firstString(merged.synthesiaAvatarId, merged.synthesia_avatar_id, avatarProviderMode === "synthesia" ? merged.avatarId : "");
  const synthesiaVoiceId = firstString(merged.synthesiaVoiceId, merged.synthesia_voice_id, avatarProviderMode === "synthesia" ? merged.voiceId : "");
  return {
    ...merged,
    providerMode: avatarProviderMode,
    avatarProviderMode,
    avatarProvider: avatarProviderMode,
    provider: avatarProviderMode,
    avatarId: firstString(merged.avatarId, synthesiaAvatarId),
    voiceId: firstString(merged.voiceId, synthesiaVoiceId),
    providerVoiceId: firstString(merged.providerVoiceId, merged.customVoiceId, merged.minimaxVoiceId, merged.elevenLabsVoiceId, merged.sarvamVoiceId),
    minimaxVoiceId: firstString(merged.minimaxVoiceId),
    synthesiaAvatarId,
    synthesiaVoiceId,
    portraitEmbeddingId: firstString(merged.portraitEmbeddingId, merged.portrait_embedding_id),
    facialFeatureEmbeddingId: firstString(merged.facialFeatureEmbeddingId, merged.facial_feature_embedding_id),
    voiceEmbeddingId: firstString(merged.voiceEmbeddingId, merged.voice_embedding_id),
    voiceProfileId: firstString(merged.voiceProfileId, merged.voice_profile_id, localModels.voiceProfileId),
    sourceUrl: firstString(merged.sourceUrl, merged.source_url, merged.publicUrl, merged.signedUrl, merged.url),
    sourceAsset: firstObject(merged.sourceAsset, merged.source_asset, merged.asset),
    referenceTranscript: firstString(merged.referenceTranscript, merged.reference_transcript),
    voicePreviewText: firstString(merged.voicePreviewText, merged.previewText, merged.voice_preview_text),
    avatarScript: firstString(merged.avatarScript, merged.avatar_script, merged.fullSpokenText, merged.spokenText, merged.spoken_text),
    spokenText: firstString(merged.spokenText, merged.spoken_text),
    pronunciationGuide: firstString(merged.pronunciationGuide, merged.pronunciation_guide),
    elevenLabsVoiceId: firstString(merged.elevenLabsVoiceId, merged.eleven_labs_voice_id, merged.proprietaryVoiceId),
    sarvamVoiceId: firstString(merged.sarvamVoiceId, merged.sarvam_voice_id, merged.sarvamSpeakerId),
    voiceApprovalStatus: firstString(merged.voiceApprovalStatus, merged.voice_approval_status, "NOT_REQUESTED").toUpperCase(),
    voicePreviewAsset: firstObject(merged.voicePreviewAsset, merged.voice_preview_asset),
    voiceEnhancement: firstObject(merged.voiceEnhancement, merged.voice_enhancement),
    voiceEnhancementStatus: firstString(merged.voiceEnhancementStatus, merged.voice_enhancement_status),
    voiceEnhancementApplied: booleanValue(merged.voiceEnhancementApplied ?? merged.voice_enhancement_applied, false),
    voiceEnhancementProfile: firstString(merged.voiceEnhancementProfile, merged.voice_enhancement_profile),
    avatarPortraitStatus: firstString(merged.avatarPortraitStatus, merged.avatar_portrait_status, "NOT_REQUESTED").toUpperCase(),
    avatarPortraitAsset: firstObject(merged.avatarPortraitAsset, merged.avatar_portrait_asset),
    avatarPortraitUrl: firstString(merged.avatarPortraitUrl, merged.avatar_portrait_url),
    avatarPortraitSourceMode: firstString(merged.avatarPortraitSourceMode, merged.avatar_portrait_source_mode, "extract"),
    avatarPortraitPreparedAt: firstString(merged.avatarPortraitPreparedAt, merged.avatar_portrait_prepared_at),
    avatarMotionPrompt: firstString(merged.avatarMotionPrompt, merged.avatar_motion_prompt),
    avatarTestStatus: firstString(merged.avatarTestStatus, merged.avatar_test_status, "NOT_REQUESTED").toUpperCase(),
    avatarTestAsset: firstObject(merged.avatarTestAsset, merged.avatar_test_asset),
    avatarTestUrl: firstString(merged.avatarTestUrl, merged.avatar_test_url),
    avatarTestGeneratedAt: firstString(merged.avatarTestGeneratedAt, merged.avatar_test_generated_at),
    avatarTestRequestId: firstString(merged.avatarTestRequestId, merged.avatar_test_request_id),
    avatarTestModel: firstString(merged.avatarTestModel, merged.avatar_test_model),
    avatarPreviewStatus: firstString(merged.avatarPreviewStatus, merged.avatar_preview_status, "NOT_REQUESTED").toUpperCase(),
    avatarPreviewAsset: firstObject(merged.avatarPreviewAsset, merged.avatar_preview_asset),
    avatarPreviewUrl: firstString(merged.avatarPreviewUrl, merged.avatar_preview_url),
    avatarPreviewGeneratedAt: firstString(merged.avatarPreviewGeneratedAt, merged.avatar_preview_generated_at),
    avatarPreviewApprovedAt: firstString(merged.avatarPreviewApprovedAt, merged.avatar_preview_approved_at),
    avatarPreviewFingerprint: firstString(merged.avatarPreviewFingerprint, merged.avatar_preview_fingerprint),
    lipSyncProvider: firstString(merged.lipSyncProvider, merged.lip_sync_provider),
    lipSyncModel: firstString(merged.lipSyncModel, merged.lip_sync_model, localModels.lipSyncModel),
    exactFounderAudioAsset: firstObject(merged.exactFounderAudioAsset, merged.finalFounderAudioAsset, merged.exact_founder_audio_asset),
    finalFounderAudioUrl: firstString(merged.finalFounderAudioUrl, merged.final_founder_audio_url),
    details: firstString(merged.details, merged.referenceDetails, merged.sourceDetails),
    language: firstString(merged.language, "Hinglish"),
    languageCode: firstString(merged.languageCode, merged.language_code, "hi-IN"),
    voiceLanguageMode: firstString(merged.voiceLanguageMode, merged.voice_language_mode, "english_indian"),
    voiceLanguage: firstString(merged.voiceLanguage, merged.voice_language, "English"),
    voiceLanguageCode: firstString(merged.voiceLanguageCode, merged.voice_language_code, "en-IN"),
    minimaxLanguageBoost: firstString(merged.minimaxLanguageBoost, merged.minimax_language_boost, "English"),
    gpuProfile: firstString(merged.gpuProfile, merged.gpu_profile, "rtx_4060_8gb"),
    localModels,
    manualApprovalRequiredForFallback: booleanValue(merged.manualApprovalRequiredForFallback ?? merged.manual_approval_required_for_fallback, true),
    productionEnhancementEnabled: booleanValue(merged.productionEnhancementEnabled ?? merged.production_enhancement_enabled, false),
    consentConfirmed: booleanValue(merged.consentConfirmed ?? merged.consent_confirmed, false),
  };
}

function looksLikeFounderAvatarProfileSourceForPlanning(source = {}) {
  const localModels = firstObject(source.localModels, source.localAvatarModels) || {};
  return Boolean(firstString(
    source.avatarProviderMode,
    source.providerMode,
    source.avatarProvider,
    source.synthesiaAvatarId,
    source.synthesiaVoiceId,
    source.avatarId,
    source.voiceId,
    source.portraitEmbeddingId,
    source.facialFeatureEmbeddingId,
    source.voiceEmbeddingId,
    source.sourceUrl,
    source.source_url,
    source.avatarPortraitUrl,
    source.avatarTestUrl,
    localModels.voiceModel,
    localModels.talkingAvatarModel,
    localModels.lipSyncModel
  ));
}

function mergeFounderProfileFieldsForPlanning(target, source = {}) {
  Object.entries(firstObject(source) || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    if (Array.isArray(value) && !value.length) return;
    if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) return;
    target[key] = value;
  });
  return target;
}

function normalizeFounderLocalModelsForPlanning(...values) {
  const merged = Object.assign({}, ...values.map(firstObject));
  return {
    voiceModel: normalizeLocalVoiceModelForPlanning(firstString(merged.voiceModel, merged.voice_model, "fal_minimax_voice_clone")),
    voiceProfileId: firstString(merged.voiceProfileId, merged.voice_profile_id),
    talkingAvatarModel: normalizeLocalTalkingAvatarModelForPlanning(firstString(merged.talkingAvatarModel, merged.talking_avatar_model, merged.avatarModel, "source_video")),
    lipSyncModel: normalizeLocalLipSyncModelForPlanning(firstString(merged.lipSyncModel, merged.lipsyncModel, merged.lip_sync_model, "fal_latentsync")),
    imageModel: normalizeLocalImageModelForPlanning(firstString(merged.imageModel, merged.image_model, "gemini_storyboard")),
    lightingModel: normalizeLocalImageModelForPlanning(firstString(merged.lightingModel, merged.lighting_model, "ic_lightning")),
    videoModel: normalizeLocalVideoModelForPlanning(firstString(merged.videoModel, merged.video_model, "ltx_video")),
    gpuProfile: firstString(merged.gpuProfile, merged.gpu_profile, "rtx_4060_8gb"),
  };
}

function normalizeAvatarProviderModeForPlanning(value = "dalai_llama") {
  const normalized = String(value || "dalai_llama").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "synthesia" || normalized === "synthesia_api") return "synthesia";
  if (normalized === "dalai_llama" || normalized === "dallai_llama" || normalized === "local" || normalized === "open_source" || normalized === "opensource") return "dalai_llama";
  return "dalai_llama";
}

function normalizeLocalVoiceModelForPlanning(value = "fal_minimax_voice_clone") {
  const normalized = String(value || "fal_minimax_voice_clone").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("client_rvc") || normalized.includes("trained_client_voice") || normalized.includes("founder_female_v1")) return "client_rvc_english";
  if (normalized.includes("minimax") || normalized.includes("f5") || normalized === "fal" || normalized === "fal_tts") return "fal_minimax_voice_clone";
  if (normalized.includes("chatterbox") || normalized.includes("multilingual_voice")) return "fal_chatterbox_multilingual";
  if (normalized === "fal_elevenlabs_v3" || normalized === "fal_elevenlabs") return "fal_elevenlabs_v3";
  if (["elevenlabs_v3_voice_clone", "elevenlabs_v3", "eleven_v3", "elevenlabs_direct", "elevenlabs_ivc"].includes(normalized)) return "elevenlabs_v3_voice_clone";
  if (normalized.includes("sarvam")) return "sarvam_voice_clone";
  if (normalized.includes("eleven") || normalized.includes("11labs")) return "elevenlabs_professional";
  if (normalized.includes("upload") || normalized.includes("exact") || normalized.includes("founder_audio")) return "uploaded_founder_audio";
  if (normalized.includes("synthesia")) return "synthesia_managed";
  if (normalized.includes("api") || normalized.includes("fallback") || normalized.includes("proprietary")) return "api_fallback";
  return "fal_minimax_voice_clone";
}

function normalizeLocalTalkingAvatarModelForPlanning() {
  return "source_video";
}

function normalizeLocalLipSyncModelForPlanning(value = "fal_latentsync") {
  const normalized = String(value || "fal_latentsync").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("muse")) return "fal_musetalk";
  if (normalized.includes("fal") && normalized.includes("latent")) return "fal_latentsync";
  if (normalized.includes("latent")) return "fal_latentsync";
  if (normalized.includes("sync_lab") || normalized === "synclabs" || normalized === "sync_labs") return "sync_labs";
  if (normalized.includes("api") || normalized.includes("fallback") || normalized.includes("proprietary")) return "api_fallback";
  return "fal_latentsync";
}

function normalizeLocalImageModelForPlanning(value = "gemini_storyboard") {
  const normalized = String(value || "gemini_storyboard").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("gemini") || normalized.includes("storyboard")) return "gemini_storyboard";
  if (normalized.includes("ic_light")) return "ic_lightning";
  return "flux_1_dev";
}

function normalizeLocalVideoModelForPlanning() {
  return "fal_seedance";
}

function hasFounderAvatarIdentityForPlanning(profile = {}) {
  const sourceAsset = firstObject(profile.sourceAsset, profile.source_asset, profile.asset) || {};
  return Boolean(firstString(
    profile.avatarId,
    profile.voiceId,
    profile.synthesiaAvatarId,
    profile.synthesiaVoiceId,
    profile.portraitEmbeddingId,
    profile.facialFeatureEmbeddingId,
    profile.voiceEmbeddingId,
    profile.sourceUrl,
    sourceAsset.objectKey,
    sourceAsset.object_key,
    sourceAsset.assetId,
    sourceAsset.id
  ));
}

function founderAvatarPayloadForPlanning(profile = {}) {
  const normalized = normalizeFounderAvatarProfileForPlanning(profile);
  if (!hasFounderAvatarIdentityForPlanning(normalized)) return {};
  return {
    founderLedHybridEnabled: true,
    founderAvatarProfile: normalized,
    founderKit: normalized,
    avatarProviderMode: normalized.avatarProviderMode,
    avatarProvider: normalized.avatarProviderMode,
    avatarId: normalized.avatarId,
    voiceId: normalized.voiceId,
    providerVoiceId: normalized.providerVoiceId,
    minimaxVoiceId: normalized.minimaxVoiceId,
    elevenLabsVoiceId: normalized.elevenLabsVoiceId,
    sarvamVoiceId: normalized.sarvamVoiceId,
    avatarScript: normalized.avatarScript,
    avatarScriptOverride: normalized.avatarScript,
    spokenText: normalized.avatarScript,
    synthesiaAvatarId: normalized.synthesiaAvatarId,
    synthesiaVoiceId: normalized.synthesiaVoiceId,
    portraitEmbeddingId: normalized.portraitEmbeddingId,
    facialFeatureEmbeddingId: normalized.facialFeatureEmbeddingId,
    voiceEmbeddingId: normalized.voiceEmbeddingId,
    voiceProfileId: normalized.voiceProfileId,
    localModels: normalized.localModels,
    localAvatarModels: normalized.localModels,
    manualApprovalRequiredForFallback: normalized.manualApprovalRequiredForFallback,
    founderConsentConfirmed: normalized.consentConfirmed,
    language: normalized.language,
    languageCode: normalized.languageCode,
  };
}

function avatarProviderModeLabel(value = "dalai_llama") {
  return normalizeAvatarProviderModeForPlanning(value) === "synthesia" ? "Synthesia API" : "DalaiLlama managed";
}

function voiceApprovalLabelForPlanning(value = "NOT_REQUESTED") {
  const normalized = String(value || "NOT_REQUESTED").trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "PREVIEW_READY") return "Preview ready";
  if (normalized === "REJECTED") return "Needs another preview";
  return "Preview required";
}

function avatarApprovalLabelForPlanning(value = "NOT_REQUESTED") {
  const normalized = String(value || "NOT_REQUESTED").trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "PREVIEW_READY") return "Lip-sync preview ready";
  if (normalized === "REJECTED") return "Needs another lip-sync preview";
  return "Lip-sync preview required";
}

function applyFounderAvatarProfileToScriptIdea(idea, profile = {}, asset = {}) {
  if (!idea) return idea;
  const normalized = normalizeFounderAvatarProfileForPlanning(profile);
  const scriptJson = firstObject(idea.scriptJson);
  const creatorContext = firstObject(scriptJson.creatorContext);
  const sourceAsset = firstObject(asset.sourceAsset, asset.asset, asset);
  const nextProfile = {
    ...normalized,
    ...(Object.keys(sourceAsset).length ? { sourceAsset } : {}),
  };
  return {
    ...idea,
    scriptJson: {
      ...scriptJson,
      founderAvatarProfile: nextProfile,
      founderKit: nextProfile,
      founderLedHybridEnabled: hasFounderAvatarIdentityForPlanning(nextProfile),
      avatarProviderMode: nextProfile.avatarProviderMode,
      avatarProvider: nextProfile.avatarProviderMode,
      avatarId: nextProfile.avatarId,
      voiceId: nextProfile.voiceId,
      portraitEmbeddingId: nextProfile.portraitEmbeddingId,
      facialFeatureEmbeddingId: nextProfile.facialFeatureEmbeddingId,
      voiceEmbeddingId: nextProfile.voiceEmbeddingId,
      creatorContext: {
        ...creatorContext,
        founderAvatarProfile: nextProfile,
        founderKit: nextProfile,
        avatarProviderMode: nextProfile.avatarProviderMode,
        avatarProvider: nextProfile.avatarProviderMode,
      },
    },
  };
}

function dialogueTimingPolicyForModelCapability(maxClipSeconds = 15) {
  const safeMax = Math.max(1, Number(maxClipSeconds) || 15);
  const spokenBudget = Math.max(1, safeMax - 1);
  return `Storyboard every beat so full spoken dialogue fits inside ${safeMax}s clips; keep each shot near ${spokenBudget}s of spoken line and split longer dialogue into consecutive parts without paraphrasing.`;
}

function screenplaySceneHasGeneratedClip(scene = {}) {
  return Boolean(scene?.videoUrl || scene?.clipUrl || scene?.publicUrl || scene?.bucket || scene?.objectKey || scene?.object_key);
}

function isActiveSceneVideoStatus(status = "") {
  return ["GENERATING_VIDEO", "SCENE_GENERATION_QUEUED", "VIDEO_GENERATION_QUEUED", "PROVIDER_QUEUED", "RUNNING", "PENDING"]
    .includes(String(status || "").trim().toUpperCase());
}

function normalizeVideoSceneModeOverrides(overrides = {}, scenes = [], productionStyle = DEFAULT_PRODUCTION_STYLE, hybridSceneMode = DEFAULT_HYBRID_SCENE_MODE) {
  const fullAi = normalizeProductionStyle(productionStyle) === "full_ai";
  const fullFounder = normalizeHybridSceneMode(hybridSceneMode) === "full_founder";
  if (!fullAi && !fullFounder) return overrides || {};
  return (Array.isArray(scenes) ? scenes : []).reduce((next, scene, index) => {
    const sceneId = String(scene?.id || scene?.sceneId || scene?.scene_id || scene?.shotId || scene?.shot_id || `shot-${scene?.shotNumber || scene?.sceneNumber || index + 1}`);
    next[sceneId] = fullFounder ? "talking_head" : "ai_generated";
    return next;
  }, {});
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
      productionImageUrl: imageFields.productionImageUrl,
      generatedProductImageUrl: imageFields.productionImageUrl,
      imageAnchorUrl: imageFields.productionImageUrl,
      productionImagePrompt: firstText(
        sceneWithImages.productionImagePrompt,
        sceneWithImages.production_image_prompt,
        sceneWithImages.rawShot?.productionImagePrompt,
        sceneWithImages.rawShot?.productImagePrompt
      ),
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
  const isProductionImage = imageKind === "production";
  const storyboardImageUrl = firstText(
    scene.storyboardImageUrl,
    scene.storyboard_image_url,
    imageUrlFromObject(scene.storyboardImage),
    imageUrlFromObject(scene.storyboardAsset),
    imageUrlByKind(imageAssets, "storyboard"),
    !isLightingImage && !isCameraImage && !isProductionImage ? directImageUrl : ""
  );

  return {
    storyboardImageUrl,
    productionImageUrl: firstText(
      scene.productionImageUrl,
      scene.production_image_url,
      scene.generatedProductImageUrl,
      scene.generated_product_image_url,
      scene.imageAnchorUrl,
      scene.image_anchor_url,
      imageUrlFromObject(scene.productionImage),
      imageUrlFromObject(scene.production_image),
      imageUrlFromObject(scene.productionAsset),
      imageUrlFromObject(scene.production_asset),
      imageUrlFromObject(scene.generatedProductImage),
      imageUrlFromObject(scene.generated_product_image),
      imageUrlByKind(imageAssets, "production"),
      isProductionImage ? directImageUrl : ""
    ),
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
    source.productionImages,
    source.production_images,
    source.productImages,
    source.product_images,
    source.generatedProductImageAssets,
    source.generated_product_image_assets,
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
    if (kind === "production") {
      return {
        ...merged,
        productionImageUrl: merged.productionImageUrl || url,
        generatedProductImageUrl: merged.generatedProductImageUrl || url,
        imageAnchorUrl: merged.imageAnchorUrl || url,
      };
    }
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
  if (text.includes("production") || text.includes("video_anchor") || text.includes("image_anchor")) return "production";
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
      return ["storyboard", "lighting", "dp", "production"].map((kind) => shotImageLoadingKey(shotNumber, kind));
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
    const productionUrl = firstText(
      image.productionImageUrl,
      image.production_image_url,
      image.generatedProductImageUrl,
      image.generated_product_image_url,
      image.imageAnchorUrl,
      image.image_anchor_url,
      imageUrlFromObject(image.productionImage),
      imageUrlFromObject(image.production_image),
      imageUrlFromObject(image.productionAsset),
      imageUrlFromObject(image.production_asset),
      imageUrlByKind(imageAssets, "production")
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
      productionImageAssetId: image.productionImageAssetId || image.production_image_asset_id || scene.productionImageAssetId,
      productionObjectKey: image.productionObjectKey || image.production_object_key || scene.productionObjectKey,
      productionImageUrl: productionUrl || scene.productionImageUrl,
      generatedProductImageUrl: productionUrl || scene.generatedProductImageUrl,
      imageAnchorUrl: productionUrl || scene.imageAnchorUrl,
      productionImagePrompt: image.productionImagePrompt || image.production_image_prompt || scene.productionImagePrompt,
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
      item.productionImageUrl,
      item.production_image_url,
      item.generatedProductImageUrl,
      item.generated_product_image_url,
      item.imageAnchorUrl,
      item.image_anchor_url,
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
      imageUrlByKind(collectStoryboardImageAssets(item), "dp"),
      imageUrlByKind(collectStoryboardImageAssets(item), "production")
    )
    || item.storyboardImageAssetId
    || item.storyboard_image_asset_id
    || item.lightingImageAssetId
    || item.lighting_image_asset_id
    || item.cameraPlanImageAssetId
    || item.camera_plan_image_asset_id
    || item.productionImageAssetId
    || item.production_image_asset_id
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

function summarizeShotExportAssets(scenes = [], expectedShotCount = 0, requireProduction = false) {
  const shotCount = expectedShotCount || (Array.isArray(scenes) ? scenes.length : 0);
  const relevantScenes = (Array.isArray(scenes) ? scenes : []).slice(0, shotCount || undefined);
  const summary = relevantScenes.reduce((counts, scene) => {
    const urls = normalizeShotImageFields(scene);
    const storyboardReady = Boolean(urls.storyboardImageUrl);
    const lightingReady = Boolean(urls.lightingImageUrl);
    const dpReady = Boolean(urls.cameraPlanImageUrl);
    const productionReady = Boolean(urls.productionImageUrl);
    return {
      storyboardReady: counts.storyboardReady + (storyboardReady ? 1 : 0),
      lightingReady: counts.lightingReady + (lightingReady ? 1 : 0),
      dpReady: counts.dpReady + (dpReady ? 1 : 0),
      productionReady: counts.productionReady + (productionReady ? 1 : 0),
      completeReady: counts.completeReady + (
        storyboardReady && lightingReady && dpReady && (!requireProduction || productionReady) ? 1 : 0
      ),
    };
  }, { storyboardReady: 0, lightingReady: 0, dpReady: 0, productionReady: 0, completeReady: 0 });

  return {
    expected: shotCount,
    ...summary,
  };
}

function defaultProductImagePrompt(scene = {}) {
  // productionImagePrompt/production_image_prompt are the full backend-rendered prompt echoed
  // back for display only - never a resubmittable short brief, and can exceed the server's
  // @Size(max=12000) imagePrompt limit if fed back in.
  return firstText(
    scene.productImagePrompt,
    scene.product_image_prompt,
    scene.rawShot?.productImagePrompt,
    scene.rawShot?.product_image_prompt,
    scene.imagePrompt,
    scene.image_prompt,
    scene.storyboardImagePrompt,
    scene.storyboard_image_prompt,
    scene.visualPrompt,
    scene.visual_prompt,
    scene.sketchPrompt,
    scene.visualDirection,
    scene.description,
    scene.action
  );
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
  productMode = false,
  dialogueLanguage = "English",
  clientReview = {},
  creatorName = "",
  callbackUrl,
}) {
  const generatedAt = formatExportDate(new Date());
  const shotCards = (Array.isArray(scenes) ? scenes : [])
    .map((scene, index) => renderShotPdfCard(scene, index, productMode))
    .join("\n");
  const safeProjectTitle = escapeHtml(title || "Creator project");
  const safeStoryline = escapeHtml(storyline || "Storyline not available.");
  const safeCallbackUrl = escapeHtml(callbackUrl || "");
  const safeCreatorName = escapeHtml(creatorName || "");
  const reviewSummary = renderPdfClientReview(clientReview);
  const callbackAction = safeCallbackUrl
    ? `<a class="callback-button" href="${safeCallbackUrl}" target="_blank" rel="noreferrer">Open walkthrough / callback</a>`
    : "";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeProjectTitle} - Dalaillama Creator Studio Story Board</title>
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
    .brand-name {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .brand-name .sub {
      color: #b8c2d6;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .premium-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-left: 8px;
      padding: 4px 10px;
      border-radius: 999px;
      background: linear-gradient(145deg, #f7c948, #d49d18);
      color: #07101f;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: 0 8px 18px rgba(247, 201, 72, 0.25);
    }
    .creator-line {
      margin-top: 6px;
      color: #dbe5f6;
      font-size: 12px;
      font-weight: 700;
    }
    .creator-line strong {
      color: #f7c948;
      font-weight: 900;
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
      grid-template-columns: repeat(5, minmax(0, 1fr));
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
    .client-review {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid rgba(34, 211, 238, 0.22);
      border-radius: 8px;
      background: rgba(34, 211, 238, 0.055);
    }
    .client-review h3 {
      margin: 0 0 10px;
      color: #a5f3fc;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .review-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 9px;
    }
    .review-note {
      padding: 9px;
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.045);
    }
    .review-note span {
      color: #f7c948;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .review-note p {
      margin: 5px 0 0;
      color: #dce6f5;
      font-size: 10px;
      line-height: 1.45;
      font-weight: 650;
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
    .asset-grid.product-assets {
      grid-template-columns: repeat(2, minmax(0, 1fr));
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
        <div class="brand">
          <span class="brand-mark">DL</span>
          <span class="brand-name">
            <span>Dalaillama<span class="premium-pill">Premium</span></span>
            <span class="sub">Creator Studio</span>
          </span>
        </div>
        <div class="meta">Generated ${escapeHtml(generatedAt)}<br />Story Board</div>
      </div>
      <div>
        <h1>Story Board</h1>
        <div class="project-title">${safeProjectTitle}</div>
        ${safeCreatorName ? `<div class="creator-line">Prepared by <strong>${safeCreatorName}</strong></div>` : ""}
        <div class="storyline">${safeStoryline}</div>
        <div class="summary-grid">
          <div class="summary-item"><span>Shots</span><strong>${scenes.length}</strong></div>
          <div class="summary-item"><span>Duration</span><strong>${escapeHtml(durationSeconds || 30)} sec</strong></div>
          <div class="summary-item"><span>Format</span><strong>${escapeHtml(screenType || "vertical")}</strong></div>
          <div class="summary-item"><span>Dialogue</span><strong>${escapeHtml(dialogueLanguage || "English")}</strong></div>
          <div class="summary-item"><span>Project</span><strong>${escapeHtml(shortId(projectId))}</strong></div>
        </div>
        ${reviewSummary}
      </div>
      <div class="cover-actions">
        ${callbackAction}
        <span class="site-pill">dalaillama.in</span>
      </div>
    </section>
    ${shotCards}
    <div class="pdf-footer">${safeCreatorName ? `${safeCreatorName} &middot; ` : ""}Dalaillama Creator Studio &middot; Premium &middot; dalaillama.in</div>
  </main>
</body>
</html>`;
  return { html, shotCount: scenes.length };
}

function renderPdfClientReview(review = {}) {
  const typography = review.typographySystem || {};
  const referenceUrls = Array.isArray(review.referenceUrls) ? review.referenceUrls : [];
  const notes = [
    ["Storyboard direction", review.storyboardFeedback],
    ["Production frames", review.productionFramesFeedback],
    ["Dialogue direction", review.dialogueFeedback],
    ["Typography", joinNonEmpty([
      typography.primaryFont && `Primary: ${typography.primaryFont} ${typography.primaryWeight || ""}`,
      typography.secondaryFont && `Supporting: ${typography.secondaryFont} ${typography.secondaryWeight || ""}`,
      typography.caseRule,
    ], " | ")],
    ["Shared references", referenceUrls.length ? referenceUrls.join(" | ") : "Visual references required before final frame generation."],
  ]
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `<div class="review-note"><span>${escapeHtml(label)}</span><p>${escapeHtml(trimText(value, 520))}</p></div>`)
    .join("");
  if (!notes) return "";
  return `<section class="client-review"><h3>Client review · ${escapeHtml(reviewStatusLabel(review.reviewStatus))}</h3><div class="review-grid">${notes}</div></section>`;
}

function renderShotPdfCard(scene = {}, index = 0, productMode = false) {
  const shotNumber = Number(scene.shotNumber || scene.shot_number || index + 1);
  const storyboardTag = extractStoryboardTag(scene) || {};
  const lightingTag = extractLightingTag(scene) || {};
  const cameraTag = extractCameraTag(scene) || {};
  const overlayPlan = scene.overlayPlan || scene.overlay_plan || storyboardTag.overlayPlan || storyboardTag.overlay_plan || {};
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
    <div class="asset-grid${productMode ? " product-assets" : ""}">
      ${renderPdfAsset("Storyboard", imageFields.storyboardImageUrl)}
      ${renderPdfAsset("Lighting Design", imageFields.lightingImageUrl)}
      ${renderPdfAsset("DP / Camera", imageFields.cameraPlanImageUrl)}
      ${productMode ? renderPdfAsset("Product Frame", imageFields.productionImageUrl) : ""}
    </div>
    <div class="details-grid">
      ${renderPdfDetail("Visual", visual || "Visual direction pending.")}
      ${renderPdfDetail("Dialogue / VO", dialogue || "No dialogue.")}
      ${renderPdfDetail("Sound", sound || "Sound design pending.")}
      ${renderPdfDetail("Lighting + DP", joinNonEmpty([lighting, camera], " | ") || "Lighting and camera plan pending.")}
      ${renderPdfDetail("Text overlay + motion", pdfOverlaySummary(overlayPlan))}
      ${productMode ? renderPdfDetail("Product image prompt", defaultProductImagePrompt(scene) || "Product image prompt not available.") : ""}
    </div>
  </section>`;
}

function pdfOverlaySummary(overlay = {}) {
  if (!overlay || overlay.enabled === false) return "No overlay; keep this as a visual-only beat.";
  return joinNonEmpty([
    overlay.text && `Copy: ${overlay.text}`,
    overlay.fontFamily && `Font: ${overlay.fontFamily} ${overlay.fontWeight || ""}`,
    overlay.entrance && `Entrance: ${overlay.entrance}`,
    overlay.entranceDurationMs && `${overlay.entranceDurationMs} ms in`,
    overlay.holdDurationMs && `${overlay.holdDurationMs} ms hold`,
    overlay.exit && `Exit: ${overlay.exit}`,
    overlay.position,
    overlay.speed,
    overlay.rationale,
  ], " | ") || "Overlay plan pending AI review.";
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

function proposalHasMeaningfulPlanningDelta(proposal = {}) {
  const affectedShotNumbers = Array.isArray(proposal?.affectedShotNumbers)
    ? proposal.affectedShotNumbers.map(Number).filter((value) => Number.isInteger(value) && value > 0)
    : [];
  if (!affectedShotNumbers.length) return true;
  const previews = Array.isArray(proposal?.planningChangePreview)
    ? proposal.planningChangePreview
    : [];
  const comparable = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return affectedShotNumbers.every((shotNumber) => {
    const preview = previews.find((item) => Number(item?.shotNumber || item?.shot_number) === shotNumber);
    if (!preview) return false;
    const current = comparable(preview.currentFrameDescription);
    const proposed = comparable(preview.proposedFrameDescription);
    const proposedIsComplete = proposed.split(" ").filter(Boolean).length >= 5
      && !/(?:\bimage of|\buse image of|\bof|\bto|\bwith|\band|\bfor|\busing)$/.test(proposed);
    return Boolean(current && proposed && current !== proposed && proposedIsComplete);
  });
}

function reviewAffectedShotNumbers(message = {}, analysisMessage = {}, proposalValue = null) {
  const proposal = proposalValue && typeof proposalValue === "object"
    ? proposalValue
    : analysisMessage?.proposal && typeof analysisMessage.proposal === "object"
      ? analysisMessage.proposal
      : {};
  const revisionShotNumbers = (Array.isArray(proposal.shotRevisions) ? proposal.shotRevisions : [])
    .map((item) => item?.shotNumber ?? item?.shot_number);
  return [...new Set([
    ...(Array.isArray(message?.affectedShotNumbers) ? message.affectedShotNumbers : []),
    ...(Array.isArray(analysisMessage?.affectedShotNumbers) ? analysisMessage.affectedShotNumbers : []),
    ...(Array.isArray(proposal?.affectedShotNumbers) ? proposal.affectedShotNumbers : []),
    ...revisionShotNumbers,
    message?.shotNumber,
    analysisMessage?.shotNumber,
    proposal?.shotNumber,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0))]
    .sort((left, right) => left - right);
}

function explicitReviewShotScope(value) {
  const text = String(value || "");
  const directive = /\b(?:review|revise|rework|redesign|edit|update|change|fix|generate|regenerate|improve|see|make)\s+(?:only\s+)?shots?\s*#?\s*/i.exec(text);
  if (!directive) return [];
  const tail = text.slice(directive.index + directive[0].length);
  const boundary = /[.;:\n]|\b(?:maintain|preserve|keep|continuity|anchor|reference|read\s*-?\s*only|without|while|but)\b/i.exec(tail);
  const scopeText = boundary ? tail.slice(0, boundary.index) : tail;
  const shotNumbers = [];
  for (const range of scopeText.matchAll(/#?\s*(\d+)\s*(?:-|to)\s*(?:shots?\s*)?#?\s*(\d+)/gi)) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end > 0 && Math.abs(end - start) <= 50) {
      const direction = start <= end ? 1 : -1;
      for (let shotNumber = start; shotNumber !== end + direction; shotNumber += direction) {
        shotNumbers.push(shotNumber);
      }
    }
  }
  for (const match of scopeText.matchAll(/\d+/g)) {
    shotNumbers.push(Number(match[0]));
  }
  return [...new Set(shotNumbers)]
    .filter((shotNumber) => Number.isInteger(shotNumber) && shotNumber > 0)
    .sort((left, right) => left - right);
}

function compactReviewInstruction(value, maxLength = 24000) {
  const normalized = String(value || "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*>[ \t]?/gm, "")
    .replace(/^[ \t]*-{3,}[ \t]*$/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length <= maxLength) return normalized;
  const marker = "\n\n[Long brief compacted: retain all stated constraints and use director/editor judgment.]\n\n";
  const headLength = Math.max(1, Math.floor((maxLength - marker.length) * 0.68));
  const tailLength = Math.max(1, maxLength - marker.length - headLength);
  return `${normalized.slice(0, headLength).trimEnd()}${marker}${normalized.slice(-tailLength).trimStart()}`;
}

function mergeAppliedDialogueFields(base = {}, applied = {}, dialogueLanguage = "English") {
  const merged = { ...(base || {}) };
  for (const field of CLIENT_REVIEW_DIALOGUE_FIELDS) {
    if (applied && Object.prototype.hasOwnProperty.call(applied, field)) {
      merged[field] = applied[field];
    }
  }
  merged.dialogueLanguage = String(dialogueLanguage || "English").trim() || "English";
  return merged;
}

function mergeAppliedReviewScenes(existingScenes = [], updatedShots = []) {
  const updatedByShot = new Map((Array.isArray(updatedShots) ? updatedShots : []).map((shot, index) => [
    Number(shot?.shotNumber || shot?.shot_number || index + 1),
    shot,
  ]));
  const sourceScenes = Array.isArray(existingScenes) && existingScenes.length
    ? existingScenes
    : Array.isArray(updatedShots)
      ? updatedShots
      : [];
  return sourceScenes.map((scene, index) => {
    const shotNumber = Number(scene?.shotNumber || scene?.shot_number || index + 1);
    const updated = updatedByShot.get(shotNumber);
    if (!updated) return scene;
    const merged = { ...scene, ...updated };
    [
      "storyboardImage",
      "storyboardImageUrl",
      "storyboard_image_url",
      "productionImage",
      "productionImageUrl",
      "production_image_url",
      "generatedProductImageUrl",
      "generatedProductImageAssets",
      "imageAnchorUrl",
      "lightingImageUrl",
      "cameraImageUrl",
      "signedUrl",
      "imageUrl",
      "publicUrl",
      "assetUrl",
    ].forEach((field) => {
      const updatedValue = updated?.[field];
      const hasUpdatedValue = Array.isArray(updatedValue)
        ? updatedValue.length > 0
        : updatedValue && (typeof updatedValue !== "object" || Object.keys(updatedValue).length > 0);
      if (!hasUpdatedValue && scene?.[field]) merged[field] = scene[field];
    });
    return merged;
  });
}

function compactClientReviewForInspection(value = {}) {
  const review = value && typeof value === "object" ? value : {};
  const compactAsset = (asset = {}) => ({
    assetId: asset.assetId || asset.id || "",
    id: asset.id || asset.assetId || "",
    signedUrl: asset.signedUrl || "",
    publicUrl: asset.publicUrl || "",
    assetUrl: asset.assetUrl || asset.url || "",
    originalFilename: asset.originalFilename || asset.filename || "",
    usageMode: asset.usageMode || asset.visualReferenceUsageMode || "INSPIRATION_ONLY",
    visualReferenceUsageMode: asset.visualReferenceUsageMode || asset.usageMode || "INSPIRATION_ONLY",
    referenceRole: asset.referenceRole || asset.assetRole || "",
    assetRole: asset.assetRole || asset.referenceRole || "",
  });
  const frameFeedback = (Array.isArray(review.frameFeedback) ? review.frameFeedback : [])
    .slice(-40)
    .map((item = {}) => ({
      id: item.id || "",
      targetType: item.targetType || "PLANNING",
      shotNumber: item.shotNumber || "",
      instruction: compactReviewInstruction(item.instruction || item.text || "", 3000),
      visualReferenceAssetIds: (Array.isArray(item.visualReferenceAssetIds) ? item.visualReferenceAssetIds : []).slice(0, 8),
      visualReferenceUsageMode: item.visualReferenceUsageMode || "INSPIRATION_ONLY",
    }));
  return {
    storyboardFeedback: compactReviewInstruction(review.storyboardFeedback || "", 6000),
    productionFramesFeedback: compactReviewInstruction(review.productionFramesFeedback || "", 6000),
    dialogueFeedback: compactReviewInstruction(review.dialogueFeedback || "", 6000),
    dialogueLanguage: review.dialogueLanguage || "English",
    reviewStatus: review.reviewStatus || "CHANGES_REQUESTED",
    frameFeedback,
    referenceUrls: (Array.isArray(review.referenceUrls) ? review.referenceUrls : []).filter(Boolean).slice(-40),
    visualReferenceImages: (Array.isArray(review.visualReferenceImages) ? review.visualReferenceImages : [])
      .slice(-40)
      .map(compactAsset),
    fontReferenceImages: (Array.isArray(review.fontReferenceImages) ? review.fontReferenceImages : [])
      .slice(-12)
      .map(compactAsset),
    typographySystem: review.typographySystem && typeof review.typographySystem === "object"
      ? review.typographySystem
      : {},
    overlayPlan: (Array.isArray(review.overlayPlan) ? review.overlayPlan : []).map((item = {}) => ({
      shotNumber: item.shotNumber,
      enabled: item.enabled,
      text: item.text,
      copyRole: item.copyRole,
      fontFamily: item.fontFamily,
      fontWeight: item.fontWeight,
      fontSizePx: item.fontSizePx,
      position: item.position,
      safeZone: item.safeZone,
      backgroundStyle: item.backgroundStyle,
      textColor: item.textColor,
      entrance: item.entrance,
      exit: item.exit,
      speed: item.speed,
      delayMs: item.delayMs,
      entranceDurationMs: item.entranceDurationMs,
      holdDurationMs: item.holdDurationMs,
      exitDurationMs: item.exitDurationMs,
      transitionPrompt: item.transitionPrompt,
      finalVideoPromptClause: item.finalVideoPromptClause,
      locked: item.locked,
    })),
  };
}

function compactReviewChatForMutation(value = []) {
  const messages = (Array.isArray(value) ? value : []).slice(-24);
  return messages.map((message = {}, index) => {
    const compact = {
      id: message.id,
      role: message.role,
      text: compactReviewInstruction(message.text || message.message || "", 12000),
      targetType: message.targetType,
      shotNumber: message.shotNumber,
      affectedShotNumbers: Array.isArray(message.affectedShotNumbers) ? message.affectedShotNumbers.slice(0, 24) : [],
      visualReferenceAssetIds: Array.isArray(message.visualReferenceAssetIds) ? message.visualReferenceAssetIds.slice(0, 8) : [],
      visualReferenceUsageMode: message.visualReferenceUsageMode,
      status: message.status,
      createdAt: message.createdAt,
      confirmationForMessageId: message.confirmationForMessageId,
      completedAt: message.completedAt,
      generatedFrames: Array.isArray(message.generatedFrames) ? message.generatedFrames.slice(0, 24) : undefined,
      retrievedKeys: Array.isArray(message.retrievedKeys) ? message.retrievedKeys.slice(0, 20) : undefined,
      attachedImageCount: message.attachedImageCount,
      languageChangePrompt: message.languageChangePrompt,
      sourceDialogueLanguage: message.sourceDialogueLanguage,
      targetDialogueLanguage: message.targetDialogueLanguage,
    };
    if (message.proposal && typeof message.proposal === "object") {
      compact.proposal = compactReviewProposalForMutation(
        message.proposal,
        index >= Math.max(0, messages.length - 4)
      );
    }
    return compact;
  });
}

function compactReviewProposalForMutation(proposal = {}, includeDetailedFrames = false) {
  const compactShot = (shot = {}) => ({
    shotNumber: shot.shotNumber ?? shot.shot_number,
    sceneNumber: shot.sceneNumber,
    sequenceNumber: shot.sequenceNumber,
    title: compactReviewInstruction(shot.title || "", 500),
    purpose: compactReviewInstruction(shot.purpose || "", 1200),
    action: compactReviewInstruction(shot.action || "", 3000),
    visualAction: compactReviewInstruction(shot.visualAction || "", 3000),
    visualDirection: compactReviewInstruction(shot.visualDirection || "", 3000),
    description: compactReviewInstruction(shot.description || "", 3000),
    narrativeBeatSummary: compactReviewInstruction(shot.narrativeBeatSummary || "", 3000),
    durationSeconds: shot.durationSeconds,
    startTimeSeconds: shot.startTimeSeconds,
    endTimeSeconds: shot.endTimeSeconds,
    dialogue: shot.dialogue,
    overlayPlan: shot.overlayPlan,
    storyboardChangeRequired: shot.storyboardChangeRequired,
    productFrameChangeRequired: shot.productFrameChangeRequired,
  });
  const compactRevision = (revision = {}) => ({
    shotNumber: revision.shotNumber ?? revision.shot_number,
    changeSummary: compactReviewInstruction(revision.changeSummary || "", 2500),
    currentFrameDescription: compactReviewInstruction(revision.currentFrameDescription || "", 2500),
    proposedFrameDescription: compactReviewInstruction(revision.proposedFrameDescription || "", 2500),
    imageRevisionPrompt: compactReviewInstruction(revision.imageRevisionPrompt || "", 6000),
    proposedShot: compactShot(revision.proposedShot || revision.shot || {}),
    proposedOverlayPlan: revision.proposedOverlayPlan || revision.overlayPlan || {},
    continuityIn: compactReviewInstruction(revision.continuityIn || "", 2500),
    continuityOut: compactReviewInstruction(revision.continuityOut || "", 2500),
    cameraPlan: compactReviewInstruction(revision.cameraPlan || "", 2500),
    lensFocusPlan: compactReviewInstruction(revision.lensFocusPlan || "", 2500),
    lightingPlan: compactReviewInstruction(revision.lightingPlan || "", 2500),
    directionPlan: compactReviewInstruction(revision.directionPlan || "", 2500),
    transitionPlan: compactReviewInstruction(revision.transitionPlan || "", 2500),
    soundPlan: compactReviewInstruction(revision.soundPlan || "", 2500),
    storyboardChangeRequired: revision.storyboardChangeRequired,
    productFrameChangeRequired: revision.productFrameChangeRequired,
  });
  const compactPreview = (preview = {}) => ({
    shotNumber: preview.shotNumber ?? preview.shot_number,
    title: compactReviewInstruction(preview.title || "", 500),
    changeSummary: compactReviewInstruction(preview.changeSummary || "", 2500),
    currentFrameDescription: compactReviewInstruction(preview.currentFrameDescription || "", 2500),
    proposedFrameDescription: compactReviewInstruction(preview.proposedFrameDescription || "", 2500),
    cameraPlan: compactReviewInstruction(preview.cameraPlan || "", 2500),
    lensFocusPlan: compactReviewInstruction(preview.lensFocusPlan || "", 2500),
    lightingPlan: compactReviewInstruction(preview.lightingPlan || "", 2500),
    directionPlan: compactReviewInstruction(preview.directionPlan || "", 2500),
    transitionPlan: compactReviewInstruction(preview.transitionPlan || "", 2500),
    soundPlan: compactReviewInstruction(preview.soundPlan || "", 2500),
    continuityIn: compactReviewInstruction(preview.continuityIn || "", 2500),
    continuityOut: compactReviewInstruction(preview.continuityOut || "", 2500),
    imageRevisionPrompt: compactReviewInstruction(preview.imageRevisionPrompt || "", 6000),
    storyboardChangeRequired: preview.storyboardChangeRequired,
    productFrameChangeRequired: preview.productFrameChangeRequired,
    overlayPlan: preview.overlayPlan || {},
    premiumStandards: preview.premiumStandards || {},
    perSecondFrames: includeDetailedFrames && Array.isArray(preview.perSecondFrames)
      ? preview.perSecondFrames.slice(0, 20).map((frame = {}) => ({
          second: frame.second,
          startTimeSeconds: frame.startTimeSeconds,
          endTimeSeconds: frame.endTimeSeconds,
          frameDescription: compactReviewInstruction(frame.frameDescription || "", 1200),
          cameraAction: compactReviewInstruction(frame.cameraAction || "", 1200),
          lightingAction: compactReviewInstruction(frame.lightingAction || "", 1200),
          focusAction: compactReviewInstruction(frame.focusAction || "", 1200),
          directorAction: compactReviewInstruction(frame.directorAction || "", 1200),
          transitionAction: compactReviewInstruction(frame.transitionAction || "", 1200),
          continuityAnchor: compactReviewInstruction(frame.continuityAnchor || "", 1200),
        }))
      : [],
  });
  return {
    targetType: proposal.targetType,
    shotNumber: proposal.shotNumber,
    affectedShotNumbers: Array.isArray(proposal.affectedShotNumbers) ? proposal.affectedShotNumbers.slice(0, 24) : [],
    continuityAnchorShotNumbers: Array.isArray(proposal.continuityAnchorShotNumbers)
      ? proposal.continuityAnchorShotNumbers.slice(0, 24)
      : [],
    changeSummary: compactReviewInstruction(proposal.changeSummary || "", 4000),
    imageRevisionPrompt: compactReviewInstruction(proposal.imageRevisionPrompt || "", 6000),
    proposedShot: compactShot(proposal.proposedShot || {}),
    proposedOverlayPlan: proposal.proposedOverlayPlan || {},
    shotRevisions: (Array.isArray(proposal.shotRevisions) ? proposal.shotRevisions : []).slice(0, 24).map(compactRevision),
    planningChangePreview: (Array.isArray(proposal.planningChangePreview) ? proposal.planningChangePreview : []).slice(0, 24).map(compactPreview),
    storyInterpretation: proposal.storyInterpretation || {},
    creativeLearningCandidates: Array.isArray(proposal.creativeLearningCandidates)
      ? proposal.creativeLearningCandidates.slice(0, 12)
      : [],
    requiresFrameRegeneration: proposal.requiresFrameRegeneration,
    affectedPlanningStages: Array.isArray(proposal.affectedPlanningStages) ? proposal.affectedPlanningStages.slice(0, 20) : [],
    analysisSource: proposal.analysisSource,
    analysisWarning: compactReviewInstruction(proposal.analysisWarning || "", 1500),
  };
}

function normalizeClientReview(value = {}, fallbackLanguage = "English") {
  const source = value && typeof value === "object" ? value : {};
  const defaultFrameFeedback = [{
    id: "client-chocolate-variety",
    targetType: "STORYBOARD_AND_PRODUCT",
    shotNumber: "",
    instruction: "Replace the repeated chocolate-pouring shot with a distinct product-detail or consumption beat while preserving continuity.",
  }];
  return {
    scriptId: firstString(source.scriptId, source.script_id),
    storyboardFeedback: firstString(
      source.storyboardFeedback,
      source.storyboard_feedback,
      "Replace the repetitive chocolate-pouring beat with a distinct product moment while preserving story continuity. Add specific action, blocking, camera, and transition detail."
    ),
    productionFramesFeedback: firstString(
      source.productionFramesFeedback,
      source.production_frames_feedback,
      "Use client visual references as inspiration only for mood, composition, lighting, texture, and pacing. Preserve the core ad idea. Never copy a reference name, logo, packaging, claims, trademark, or exact artwork; all product details must come only from this project's approved product data."
    ),
    dialogueFeedback: firstString(
      source.dialogueFeedback,
      source.dialogue_feedback,
      "Use the selected dialogue language consistently. Do not use emojis in dialogue, voice-over, captions, or on-screen overlays. Keep delivery natural and provide performance detail."
    ),
    dialogueLanguage: firstString(
      source.dialogueLanguage,
      source.dialogue_language,
      fallbackLanguage,
      "English"
    ),
    reviewStatus: firstString(source.reviewStatus, source.review_status, "CHANGES_REQUESTED").toUpperCase(),
    frameFeedback: Array.isArray(source.frameFeedback)
      ? source.frameFeedback
      : Array.isArray(source.frame_feedback)
        ? source.frame_feedback
        : defaultFrameFeedback,
    referenceUrls: Array.isArray(source.referenceUrls)
      ? source.referenceUrls.filter(Boolean)
      : Array.isArray(source.reference_urls)
        ? source.reference_urls.filter(Boolean)
        : [],
    visualReferenceImages: mergeStoryboardReferenceAssets(
      [],
      Array.isArray(source.visualReferenceImages)
        ? source.visualReferenceImages
        : Array.isArray(source.visual_reference_images)
          ? source.visual_reference_images
          : []
    ).map((asset) => ({
      ...asset,
      referenceRole: asset.referenceRole || asset.reference_role || "visual_inspiration_only",
      assetRole: asset.assetRole || asset.asset_role || asset.referenceRole || asset.reference_role || "visual_inspiration_only",
      usageMode: asset.usageMode || asset.usage_mode || asset.visualReferenceUsageMode || asset.visual_reference_usage_mode || "INSPIRATION_ONLY",
    })),
    fontReferenceImages: mergeStoryboardReferenceAssets(
      [],
      Array.isArray(source.fontReferenceImages)
        ? source.fontReferenceImages
        : Array.isArray(source.font_reference_images)
          ? source.font_reference_images
          : []
    ).map((asset) => ({
      ...asset,
      referenceRole: "typography_style_reference",
      assetRole: "typography_style_reference",
    })),
    reviewChat: Array.isArray(source.reviewChat)
      ? source.reviewChat
      : Array.isArray(source.review_chat)
        ? source.review_chat
        : [],
    typographySystem: {
      overlayPolicy: "AUTO",
      presetId: "SWISS_FMCG_SYSTEM",
      presetName: "Premium FMCG / Swiss editorial system",
      primaryFont: "Inter",
      primaryWeight: 800,
      secondaryFont: "Helvetica Neue",
      secondaryWeight: 500,
      fallbackStack: "Arial, sans-serif",
      backgroundStyle: "none",
      defaultEntrance: "fade-up",
      defaultSpeed: "medium",
      decisionSource: "AI recommendation pending",
      draftOnly: true,
      ...(
        source.typographySystem && typeof source.typographySystem === "object"
          ? source.typographySystem
          : source.typography_system && typeof source.typography_system === "object"
            ? source.typography_system
            : {}
      ),
    },
    overlayPlan: Array.isArray(source.overlayPlan)
      ? source.overlayPlan
      : Array.isArray(source.overlay_plan)
        ? source.overlay_plan
        : [],
    videoDirectorPlan: (
      source.videoDirectorPlan && typeof source.videoDirectorPlan === "object"
        ? source.videoDirectorPlan
        : source.video_director_plan && typeof source.video_director_plan === "object"
          ? source.video_director_plan
          : {}
    ),
    creativeLearning: (
      source.creativeLearning && typeof source.creativeLearning === "object"
        ? source.creativeLearning
        : source.creative_learning && typeof source.creative_learning === "object"
          ? source.creative_learning
          : {}
    ),
    propagation: (
      source.propagation && typeof source.propagation === "object"
        ? source.propagation
        : source.planningPropagation && typeof source.planningPropagation === "object"
          ? source.planningPropagation
          : source.planning_propagation && typeof source.planning_propagation === "object"
            ? source.planning_propagation
            : {}
    ),
    updatedShots: Array.isArray(source.updatedShots) ? source.updatedShots : [],
    updatedAt: firstString(source.updatedAt, source.updated_at),
    updatedBy: firstString(source.updatedBy, source.updated_by),
  };
}

function reviewStatusLabel(value) {
  return {
    DRAFT: "Draft",
    CHANGES_REQUESTED: "Changes requested",
    READY_FOR_CLIENT: "Ready for client",
    APPROVED: "Approved",
  }[String(value || "DRAFT").toUpperCase()] || "Draft";
}

function animatedStoryboardLoadingHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preparing animated storyboard</title><style>
    html,body{height:100%;margin:0;background:#060910;color:#f8fafc;font-family:Inter,system-ui,sans-serif}
    body{display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,rgba(247,201,72,.16),transparent 30%),#060910}
    .card{text-align:center}.mark{width:58px;height:58px;margin:0 auto;display:grid;place-items:center;border-radius:18px;background:linear-gradient(145deg,#ffe486,#d49d18);color:#07101f;font-weight:950;animation:pulse 1.2s ease-in-out infinite}
    h1{margin:18px 0 0;font-size:20px}p{color:#94a3b8;font-size:13px}@keyframes pulse{50%{transform:scale(1.08);box-shadow:0 0 40px rgba(247,201,72,.25)}}
  </style></head><body><div class="card"><div class="mark">DL</div><h1>Preparing client preview</h1><p>Loading frames, feedback, and dialogue direction…</p></div></body></html>`;
}

function downloadHtmlDocument(html, fileName) {
  const blob = new Blob([String(html || "")], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "storyboard-animated.html";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

function shotHasHumanCharacter(scene = {}) {
  const tag = extractStoryboardTag(scene) || {};
  const primary = Array.isArray(tag.primaryCharacters) ? tag.primaryCharacters : (Array.isArray(scene.primaryCharacters) ? scene.primaryCharacters : []);
  const side = Array.isArray(tag.sideCharacters) ? tag.sideCharacters : (Array.isArray(scene.sideCharacters) ? scene.sideCharacters : []);
  return primary.some((name) => String(name || "").trim()) || side.some((name) => String(name || "").trim());
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
  return Boolean(
    value.shotTitle
    || value.narrativeBeatSummary
    || value.compositionSummary
    || value.primaryDialogue
    || value.targetFocalPoint
    || value.soundDesign
    || value.soundCues
    || value.storyboardImagePrompt
    || value.imagePrompt
    || value.visualPrompt
    || (value.shotType && value.visual)
  );
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
  ["signedUrl", "imageUrl", "storyboardImageUrl", "productionImageUrl", "generatedProductImageUrl", "imageAnchorUrl", "publicUrl", "assetUrl", "lightingImageUrl", "lightImageUrl", "cameraPlanImageUrl", "dpImageUrl", "cameraImageUrl"].forEach((field) => {
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

function findBestPersistedStoryIdea(sourceIdea = {}, candidates = []) {
  const sourceLockedIdeaId = String(sourceIdea.lockedIdeaId || "").trim();
  const persisted = (Array.isArray(candidates) ? candidates : [])
    .filter((idea) => isUuid(idea?.id))
    .filter((idea) => {
      if (!isUuid(sourceLockedIdeaId)) return true;
      const candidateLockedIdeaId = String(idea.lockedIdeaId || "").trim();
      return !candidateLockedIdeaId || candidateLockedIdeaId === sourceLockedIdeaId;
    });
  if (!persisted.length) return null;

  const sourceTitle = ideaMatchKey(sourceIdea.title);
  const sourceDescription = ideaMatchKey(sourceIdea.description || sourceIdea.summary);
  const exact = persisted.find((idea) => {
    const title = ideaMatchKey(idea.title);
    const description = ideaMatchKey(idea.description || idea.summary);
    return title && title === sourceTitle && (!sourceDescription || description === sourceDescription);
  });
  if (exact) return exact;

  const scored = persisted
    .map((idea) => ({
      idea,
      score:
        ideaTextOverlapScore(sourceTitle, ideaMatchKey(idea.title)) +
        ideaTextOverlapScore(sourceDescription, ideaMatchKey(idea.description || idea.summary)),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.idea || persisted[0];
}

function ideaMatchKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^\s*\d+[\).\s:-]+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ideaTextOverlapScore(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (left.includes(right) || right.includes(left)) return 60;
  const leftWords = new Set(left.split(/\s+/).filter((word) => word.length > 2));
  const rightWords = right.split(/\s+/).filter((word) => word.length > 2);
  if (!leftWords.size || !rightWords.length) return 0;
  return rightWords.reduce((score, word) => score + (leftWords.has(word) ? 1 : 0), 0);
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function limitTextWords(value, maxWords) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(value || "").trim();
  return words.slice(0, maxWords).join(" ");
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

function resolveWorkflowLockedIdeaId(...entities) {
  const candidates = entities
    .flatMap((entity) => {
      const scriptJson = firstObject(entity?.scriptJson, entity?.script_json) || {};
      const storyScriptJson = firstObject(entity?.storyScriptJson, entity?.story_script_json) || {};
      return [
        entity?.lockedIdeaId,
        entity?.locked_idea_id,
        entity?.parentLockedIdeaId,
        entity?.parent_locked_idea_id,
        scriptJson.lockedIdeaId,
        scriptJson.locked_idea_id,
        storyScriptJson.lockedIdeaId,
        storyScriptJson.locked_idea_id,
      ];
    })
    .map((value) => firstString(value))
    .filter(Boolean);
  return candidates.find(isUuid) || candidates[0] || "";
}

function resolveWorkflowStoryIdeaId(...entities) {
  const candidates = entities
    .flatMap((entity) => {
      const scriptId = resolveWorkflowScriptId(entity);
      const scriptJson = firstObject(entity?.scriptJson, entity?.script_json) || {};
      const storyScriptJson = firstObject(entity?.storyScriptJson, entity?.story_script_json) || {};
      return [
        entity?.storyIdeaId,
        entity?.story_idea_id,
        entity?.ideaId,
        entity?.idea_id,
        scriptJson.storyIdeaId,
        scriptJson.story_idea_id,
        storyScriptJson.storyIdeaId,
        storyScriptJson.story_idea_id,
        entity?.id && String(entity.id) !== String(scriptId) ? entity.id : "",
      ];
    })
    .map((value) => firstString(value))
    .filter(Boolean);
  return candidates.find(isUuid) || candidates[0] || "";
}

function resolveWorkflowScriptId(...entities) {
  const candidates = entities
    .flatMap((entity) => [
      entity?.scriptId,
      entity?.script_id,
      entity?.screenplayId,
      entity?.screenplay_id,
      entity?.script?.id,
      entity?.screenplay?.id,
    ])
    .map((value) => firstString(value))
    .filter(Boolean);
  return candidates.find(isUuid) || candidates[0] || "";
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

function walletMinimumBalanceForInrPrice(amountInr = 0, currency = "INR") {
  const amount = Number(amountInr);
  if (!Number.isFinite(amount) || amount <= 0) return MINIMUM_PAID_GENERATION_WALLET_BALANCE;
  const normalizedCurrency = String(currency || "INR").toUpperCase();
  if (normalizedCurrency === "USD") return Math.ceil(amount / USD_INR_RATE);
  return Math.ceil(amount);
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

function isTransientServiceError(error = {}) {
  const data = error?.data || error?.response?.data || {};
  const status = Number(error?.status || error?.originalStatus || error?.response?.status || data?.status || data?.statusCode || 0);
  const transportStatus = String(error?.status || "").toUpperCase();
  const text = [
    data?.message,
    data?.error,
    data?.reason,
    data?.code,
    error?.message,
    error?.error,
  ].filter(Boolean).join(" ").toLowerCase();
  return [502, 503, 504].includes(status)
    || transportStatus === "FETCH_ERROR"
    || /database temporarily unavailable|service unavailable|connection (?:is )?closed|connection reset|sqlstate.?08006|temporarily restarting|gateway timeout/.test(text);
}

function reviewRetryDelayMs(error = {}) {
  const data = error?.data || error?.response?.data || {};
  const explicitDelay = Number(
    data?.retryAfterMs
    || data?.retry_after_ms
    || data?.retryDelayMs
    || data?.retry_delay_ms
  );
  if (Number.isFinite(explicitDelay) && explicitDelay > 0) {
    return Math.min(120000, Math.max(1000, explicitDelay + 1000));
  }
  const text = [
    data?.message,
    data?.error,
    data?.reason,
    error?.message,
    error?.error,
  ].filter(Boolean).join(" ");
  const secondsMatch = text.match(/retry\s+(?:after|in)(?:\s+about)?\s+([0-9]+(?:\.[0-9]+)?)\s*(?:seconds?|secs?|s)\b/i);
  if (secondsMatch) {
    return Math.min(120000, Math.max(1000, Math.ceil(Number(secondsMatch[1]) * 1000) + 1000));
  }
  const millisecondsMatch = text.match(/retry\s+(?:after|in)(?:\s+about)?\s+([0-9]+)\s*(?:milliseconds?|ms)\b/i);
  if (millisecondsMatch) {
    return Math.min(120000, Math.max(1000, Number(millisecondsMatch[1]) + 1000));
  }
  return isRateLimitedError(error) ? 61000 : 8000;
}

function waitForReviewRetry(delayMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, Number(delayMs) || 0));
  });
}

function apiErrorMessage(error, fallback = "Request failed. Please check the missing fields and try again.") {
  const data = error?.data || error?.response?.data || null;
  const fieldMessages = data?.fields && typeof data.fields === "object" ? Object.values(data.fields).filter(Boolean) : [];
  if (fieldMessages.length) return String(fieldMessages[0]);
  if (data?.message) return String(data.message);
  if (data?.error && !/bad request/i.test(String(data.error))) return String(data.error);
  const raw = error?.message || error?.error || "";
  if (String(error?.status || "").toUpperCase() === "FETCH_ERROR") {
    return "The review service could not be reached. Please retry; if it continues, check the creator-service route.";
  }
  if (String(error?.status || "").toUpperCase() === "PARSING_ERROR") {
    return `The review service returned an invalid response${error?.originalStatus ? ` (HTTP ${error.originalStatus})` : ""}.`;
  }
  if (Number(error?.status) >= 500) {
    return `${fallback} (HTTP ${error.status}).`;
  }
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
  const inputLockedBrief = firstObject(input.lockedBrief, input.sourceBrief) || {};
  const page = extractPageFromGenerationJob(job);
  const firstIdea = Array.isArray(page?.content) ? page.content[0] : null;
  const lockedIdeaId = input.lockedIdeaId || job.lockedIdeaId || firstIdea?.lockedIdeaId;
  const projectId = input.projectId || job.projectId || firstIdea?.projectId;
  if (!lockedIdeaId) return null;
  const title = input.lockedIdeaTitle || input.title || firstIdea?.title || "Recovered creative brief";
  const description = input.briefDescription || input.summary || input.ideaText || firstIdea?.description || title;
  const productIntelligenceBrief = productIntelligenceBriefFromEntity(inputLockedBrief)
    || productIntelligenceBriefFromEntity(input)
    || productIntelligenceBriefFromEntity(firstIdea);
  const recoveredStyleOptions = {
    hybridSceneMode: input.hybridSceneMode || firstIdea?.hybridSceneMode,
    brollStyle: input.brollStyle || firstIdea?.brollStyle,
    captionStyle: input.captionStyle || firstIdea?.captionStyle,
  };
  return {
    id: lockedIdeaId,
    lockedIdeaId,
    projectId,
    backendLocked: true,
    title,
    description,
    durationSeconds: input.durationSeconds || firstIdea?.durationSeconds || 30,
    topicType: normalizeTopicType(input.topicType || firstIdea?.topicType || inferTopicTypeFromText(description)),
    topicTypeLabel: topicTypeLabelFor(input.topicType || firstIdea?.topicType || inferTopicTypeFromText(description)),
    productionStyle: normalizeProductionStyle(input.productionStyle || firstIdea?.productionStyle || DEFAULT_PRODUCTION_STYLE),
    hybridSceneMode: normalizeHybridSceneMode(recoveredStyleOptions.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE),
    brollStyle: normalizeBrollStyle(recoveredStyleOptions.brollStyle || DEFAULT_BROLL_STYLE),
    captionStyle: normalizeCaptionStyle(recoveredStyleOptions.captionStyle || DEFAULT_CAPTION_STYLE),
    productionStyleGuidance: input.productionStyleGuidance || firstIdea?.productionStyleGuidance || productionStyleGuidanceFor(input.productionStyle || firstIdea?.productionStyle || DEFAULT_PRODUCTION_STYLE, recoveredStyleOptions),
    briefMode: input.briefMode || inputLockedBrief.briefMode || firstIdea?.briefMode || (productIntelligenceBrief ? PRODUCT_AD_BRIEF_MODE : undefined),
    productInputKey: input.productInputKey || inputLockedBrief.productInputKey || firstIdea?.productInputKey || productAdInputKey(productIntelligenceBrief),
    productIntelligenceBrief,
    adConceptLanes: input.adConceptLanes || inputLockedBrief.adConceptLanes || PRODUCT_AD_CONCEPT_LANES,
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
    topicType: brief.topicType,
    topicTypeLabel: brief.topicTypeLabel,
    productionStyle: brief.productionStyle,
    hybridSceneMode: brief.hybridSceneMode,
    brollStyle: brief.brollStyle,
    captionStyle: brief.captionStyle,
    productionStyleGuidance: brief.productionStyleGuidance,
    briefMode: brief.briefMode,
    productInputKey: brief.productInputKey,
    productIntelligenceBrief: brief.productIntelligenceBrief,
    adConceptLanes: brief.adConceptLanes,
    selectionPayload: brief.selectionPayload,
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
    topicType: scriptDetailIdea?.topicType || storyScriptIdea?.topicType || savedStoryIdea?.topicType || lockedBrief?.topicType || inferTopicTypeFromText(lockedBrief?.description || lockedBrief?.title),
    productionStyle: scriptDetailIdea?.productionStyle || storyScriptIdea?.productionStyle || savedStoryIdea?.productionStyle || lockedBrief?.productionStyle || DEFAULT_PRODUCTION_STYLE,
    hybridSceneMode: scriptDetailIdea?.hybridSceneMode || storyScriptIdea?.hybridSceneMode || savedStoryIdea?.hybridSceneMode || lockedBrief?.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE,
    brollStyle: scriptDetailIdea?.brollStyle || storyScriptIdea?.brollStyle || savedStoryIdea?.brollStyle || lockedBrief?.brollStyle || DEFAULT_BROLL_STYLE,
    captionStyle: scriptDetailIdea?.captionStyle || storyScriptIdea?.captionStyle || savedStoryIdea?.captionStyle || lockedBrief?.captionStyle || DEFAULT_CAPTION_STYLE,
    lockedBrief,
    productAdBrief: normalizeProductAdBrief(lockedBrief?.productIntelligenceBrief),
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
  const productIntelligenceBrief = productIntelligenceBriefFromEntity(lockedIdea)
    || productIntelligenceBriefFromEntity(project)
    || productIntelligenceBriefFromEntity(lockedIdea.selectionPayload);

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
    topicType: normalizeTopicType(project.topicType || lockedIdea.topicType || lockedIdea.selectionPayload?.topicType || inferTopicTypeFromText(description)),
    topicTypeLabel: topicTypeLabelFor(project.topicType || lockedIdea.topicType || lockedIdea.selectionPayload?.topicType || inferTopicTypeFromText(description)),
    productionStyle: normalizeProductionStyle(project.productionStyle || lockedIdea.productionStyle || lockedIdea.selectionPayload?.productionStyle || DEFAULT_PRODUCTION_STYLE),
    hybridSceneMode: normalizeHybridSceneMode(project.hybridSceneMode || lockedIdea.hybridSceneMode || lockedIdea.selectionPayload?.hybridSceneMode || DEFAULT_HYBRID_SCENE_MODE),
    brollStyle: normalizeBrollStyle(project.brollStyle || lockedIdea.brollStyle || lockedIdea.selectionPayload?.brollStyle || DEFAULT_BROLL_STYLE),
    captionStyle: normalizeCaptionStyle(project.captionStyle || lockedIdea.captionStyle || lockedIdea.selectionPayload?.captionStyle || DEFAULT_CAPTION_STYLE),
    productionStyleGuidance: lockedIdea.productionStyleGuidance || lockedIdea.selectionPayload?.productionStyleGuidance || productionStyleGuidanceFor(project.productionStyle || lockedIdea.productionStyle || lockedIdea.selectionPayload?.productionStyle || DEFAULT_PRODUCTION_STYLE, {
      hybridSceneMode: project.hybridSceneMode || lockedIdea.hybridSceneMode || lockedIdea.selectionPayload?.hybridSceneMode,
      brollStyle: project.brollStyle || lockedIdea.brollStyle || lockedIdea.selectionPayload?.brollStyle,
      captionStyle: project.captionStyle || lockedIdea.captionStyle || lockedIdea.selectionPayload?.captionStyle,
    }),
    briefMode: lockedIdea.briefMode || lockedIdea.selectionPayload?.briefMode || project.briefMode || (productIntelligenceBrief ? PRODUCT_AD_BRIEF_MODE : undefined),
    productInputKey: lockedIdea.productInputKey || lockedIdea.selectionPayload?.productInputKey || project.productInputKey || productAdInputKey(productIntelligenceBrief),
    productIntelligenceBrief,
    adConceptLanes: lockedIdea.adConceptLanes || lockedIdea.selectionPayload?.adConceptLanes || project.adConceptLanes || PRODUCT_AD_CONCEPT_LANES,
    selectionPayload: lockedIdea.selectionPayload,
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
    topicType: idea.topicType || lockedBrief?.topicType || DEFAULT_TOPIC_TYPE,
    productionStyle: idea.productionStyle || lockedBrief?.productionStyle || DEFAULT_PRODUCTION_STYLE,
    productionStyleGuidance: idea.productionStyleGuidance || lockedBrief?.productionStyleGuidance,
    briefMode: idea.briefMode || lockedBrief?.briefMode,
    productInputKey: idea.productInputKey || lockedBrief?.productInputKey,
    productIntelligenceBrief: productIntelligenceBriefFromEntity(idea) || lockedBrief?.productIntelligenceBrief,
    adConceptStrategy: idea.adConceptStrategy || idea.creativeNotes?.adConceptStrategy,
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
    topicType: source.topicType || lockedBrief?.topicType || DEFAULT_TOPIC_TYPE,
    productionStyle: source.productionStyle || lockedBrief?.productionStyle || DEFAULT_PRODUCTION_STYLE,
    productionStyleGuidance: source.productionStyleGuidance || lockedBrief?.productionStyleGuidance,
    briefMode: source.briefMode || lockedBrief?.briefMode,
    productInputKey: source.productInputKey || lockedBrief?.productInputKey,
    productIntelligenceBrief: productIntelligenceBriefFromEntity(source) || lockedBrief?.productIntelligenceBrief,
    adConceptStrategy: source.adConceptStrategy || source.creativeNotes?.adConceptStrategy,
  });
}

function normalizeProjectStoryScript(project = {}, sourceIdea = null, lockedBrief = null) {
  const rawScript = firstObject(
    project.storyScript,
    project.storyline,
    project.storyScriptIdea
  );
  if (!rawScript && !sourceIdea?.storyScriptJson && !sourceIdea?.storyScriptText && !sourceIdea?.selectionContext?.storyScript && !sourceIdea?.scriptText && !sourceIdea?.script) return null;
  const storyIdeaId = firstString(rawScript?.storyIdeaId, rawScript?.story_idea_id, rawScript?.ideaId, rawScript?.idea_id, sourceIdea?.storyIdeaId, sourceIdea?.id);
  return normalizeGeneratedIdea({
    ...(sourceIdea || {}),
    ...(rawScript || {}),
    id: storyIdeaId,
    storyIdeaId,
    title: rawScript?.title || sourceIdea?.title,
    storyScriptText: rawScript?.scriptText || rawScript?.script || sourceIdea?.storyScriptText || sourceIdea?.scriptText || sourceIdea?.script,
    storyScriptJson: buildInitialStoryRevisionPayload(rawScript?.scriptJson || rawScript?.storyScriptJson || sourceIdea?.storyScriptJson || sourceIdea?.selectionContext?.storyScript || {}),
    lockedIdeaId: rawScript?.lockedIdeaId || sourceIdea?.lockedIdeaId || lockedBrief?.lockedIdeaId,
    projectId: rawScript?.projectId || sourceIdea?.projectId || project.projectId || project.project_id || project.id,
    storytellingType: rawScript?.scriptJson?.storytellingType || rawScript?.storyScriptJson?.storytellingType || sourceIdea?.storytellingType || DEFAULT_STORYTELLING_TYPE,
    storytellingGuidance: rawScript?.scriptJson?.storytellingGuidance || rawScript?.storyScriptJson?.storytellingGuidance || sourceIdea?.storytellingGuidance || {},
    hookLens: rawScript?.scriptJson?.hookLens || rawScript?.storyScriptJson?.hookLens || sourceIdea?.hookLens || DEFAULT_HOOK_LENS,
    hookLensGuidance: rawScript?.scriptJson?.hookLensGuidance || rawScript?.storyScriptJson?.hookLensGuidance || sourceIdea?.hookLensGuidance || {},
    topicType: rawScript?.scriptJson?.topicType || rawScript?.storyScriptJson?.topicType || sourceIdea?.topicType || lockedBrief?.topicType || DEFAULT_TOPIC_TYPE,
    productionStyle: rawScript?.scriptJson?.productionStyle || rawScript?.storyScriptJson?.productionStyle || sourceIdea?.productionStyle || lockedBrief?.productionStyle || DEFAULT_PRODUCTION_STYLE,
    productionStyleGuidance: rawScript?.scriptJson?.productionStyleGuidance || rawScript?.storyScriptJson?.productionStyleGuidance || sourceIdea?.productionStyleGuidance || lockedBrief?.productionStyleGuidance,
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
  const storyIdeaId = firstString(rawScreenplay?.storyIdeaId, rawScreenplay?.story_idea_id, rawScreenplay?.ideaId, rawScreenplay?.idea_id, sourceIdea?.storyIdeaId, sourceIdea?.id);
  const rawScreenplayId = firstString(rawScreenplay?.id);
  const scriptId = firstString(rawScreenplay?.scriptId, rawScreenplay?.script_id, rawScreenplay?.screenplayId, rawScreenplay?.screenplay_id, rawScreenplayId && rawScreenplayId !== storyIdeaId ? rawScreenplayId : "", sourceIdea?.scriptId);
  return normalizeGeneratedIdea({
    ...(sourceIdea || {}),
    ...(rawScreenplay || {}),
    id: storyIdeaId || sourceIdea?.id,
    storyIdeaId,
    title: rawScreenplay?.title || sourceIdea?.title,
    scriptId,
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
    topicType: scriptJson.topicType || sourceIdea?.topicType || lockedBrief?.topicType || DEFAULT_TOPIC_TYPE,
    productionStyle: scriptJson.productionStyle || sourceIdea?.productionStyle || lockedBrief?.productionStyle || DEFAULT_PRODUCTION_STYLE,
    productionStyleGuidance: scriptJson.productionStyleGuidance || sourceIdea?.productionStyleGuidance || lockedBrief?.productionStyleGuidance,
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

function normalizeHumanWorkOrderList(response = []) {
  if (Array.isArray(response)) return response;
  return firstArray(response?.workOrders, response?.items, response?.content, response?.data);
}

function latestHumanWorkOrderOfType(workOrders = [], workType) {
  const normalizedType = String(workType || "").toUpperCase();
  return [...(Array.isArray(workOrders) ? workOrders : [])]
    .filter((order) => String(order?.workType || order?.work_type || "").toUpperCase() === normalizedType)
    .sort((left, right) => {
      const leftTime = Date.parse(left?.updatedAt || left?.submittedAt || left?.createdAt || "") || 0;
      const rightTime = Date.parse(right?.updatedAt || right?.submittedAt || right?.createdAt || "") || 0;
      return rightTime - leftTime;
    })[0] || null;
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || null;
}

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function uniqueStrings(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)));
}

function isActiveJobStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (!normalized || isCompletedJobStatus(normalized) || isFailedJobStatus(normalized)) return false;
  return ["PENDING", "QUEUED", "RUNNING", "PAUSED", "STARTED", "IN_PROGRESS", "GENERATING", "RENDERING", "PROCESSING"]
    .includes(normalized);
}

function isJobActuallyRunning(job, jobId, mutationLoading = false, isError = false) {
  if (mutationLoading) return true;
  if (!jobId || isError || !job) return false;
  return isActiveJobStatus(job.status || job.jobStatus);
}

function mergeVideoRunAudioState(baseRun, audioRun) {
  if (!baseRun && !audioRun) return null;
  if (!baseRun) return audioRun;
  if (!audioRun || typeof audioRun !== "object") return baseRun;
  const merged = { ...baseRun };
  [
    "dialogueAudio",
    "voiceTrack",
    "audioPack",
    "audioAssets",
    "audioProductionPlan",
    "freeMusicSelectionPlan",
    "backgroundMusicSelection",
    "backgroundMusic",
    "musicTrack",
    "editingPlan",
    "editorHandoffPlan",
  ].forEach((key) => {
    const value = audioRun[key];
    if (value == null) return;
    if (typeof value === "string" && !value.trim()) return;
    if (Array.isArray(value) && !value.length) return;
    if (typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) return;
    merged[key] = value;
  });
  return merged;
}

function jobIdFromPayload(payload = {}) {
  return firstString(
    payload?.jobId,
    payload?.job_id,
    payload?.generationJobId,
    payload?.generation_job_id,
    payload?.id
  );
}

function runIdFromVideoPayload(payload = {}) {
  const run = videoRunFromPayload(payload);
  return firstString(
    payload?.runId,
    payload?.run_id,
    payload?.videoRunId,
    payload?.video_run_id,
    payload?.screenplayVideoRunId,
    payload?.screenplay_video_run_id,
    run?.runId,
    run?.run_id,
    run?.videoRunId,
    run?.video_run_id,
    run?.id
  );
}

function videoRunFromPayload(payload = {}) {
  const run = firstObject(
    payload?.videoRun,
    payload?.video_run,
    payload?.screenplayVideoRun,
    payload?.screenplay_video_run,
    payload?.run,
    payload?.result?.videoRun,
    payload?.outputPayload?.videoRun
  );
  if (run) return run;
  if (
    payload
    && typeof payload === "object"
    && !Array.isArray(payload)
    && (
      payload.runId
      || payload.run_id
      || payload.videoRunId
      || payload.video_run_id
      || payload.finalVideoUrl
      || payload.final_video_url
      || firstArray(payload.scenes, payload.sceneClips, payload.clips).length
    )
  ) {
    return payload;
  }
  return null;
}

function finalVideoUrlFromPayload(payload = {}) {
  const run = videoRunFromPayload(payload) || payload || {};
  return firstString(
    run?.finalVideo?.videoUrl,
    run?.finalVideo?.video_url,
    run?.finalVideo?.clipUrl,
    run?.finalVideo?.clip_url,
    run?.finalVideo?.publicUrl,
    run?.finalVideo?.signedUrl,
    run?.finalVideoUrl,
    run?.final_video_url,
    run?.finalAssetUrl,
    run?.final_asset_url,
    run?.publicUrl,
    run?.public_url,
    run?.signedUrl,
    run?.signed_url,
    run?.finalVideoAsset?.publicUrl,
    run?.finalVideoAsset?.signedUrl,
    run?.asset?.publicUrl,
    run?.asset?.signedUrl
  );
}

function screenplayVideoSceneCountFor(videoRun, fallbackScenes = []) {
  const run = videoRunFromPayload(videoRun) || {};
  return firstArray(run?.scenes, run?.sceneClips, run?.clips, run?.timeline?.scenes, run?.renderManifest?.scenes).length
    || (Array.isArray(fallbackScenes) ? fallbackScenes.length : 0);
}

function screenplayVideoGeneratedCountFor(videoRun) {
  const run = videoRunFromPayload(videoRun) || {};
  return firstArray(run?.scenes, run?.sceneClips, run?.clips, run?.timeline?.scenes, run?.renderManifest?.scenes)
    .filter((scene) => Boolean(
      scene?.videoUrl
      || scene?.video_url
      || scene?.clipUrl
      || scene?.clip_url
      || scene?.publicUrl
      || scene?.public_url
      || ["READY", "READY_FOR_REVIEW", "RENDERED", "COMPLETED", "APPROVED"].includes(String(scene?.status || scene?.clipStatus || "").toUpperCase())
    ))
    .length;
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function buildScreenplayVideoGenerationPackage(scriptJson = {}, options = {}) {
  const source = scriptJson && typeof scriptJson === "object" ? scriptJson : {};
  const shots = resolveScreenplayVideoShots(source);
  const hasVideoContract = Boolean(
    source.videoPacingProfile
    || source.video_pacing_profile
    || source.seedancePromptStrategy
    || source.seedance_prompt_strategy
    || source.videoConsistencyBible
    || source.video_consistency_bible
    || source.srt
    || source.srtFile
    || source.srt_file
    || firstArray(source.srtCues, source.srt_cues).length
  );
  if (!shots.length && !hasVideoContract) return {};

  const durationSeconds = numberValue(
    firstString(source.durationSeconds, source.duration_seconds, source.duration, options.durationSeconds),
    options.durationSeconds || 30
  );
  const provider = normalizeScreenplayVideoProvider(firstString(options.provider, source.provider, source.videoProvider, "gemini_omni"));
  const model = firstString(options.model, source.model, source.videoModel, defaultScreenplayVideoModelForProvider(provider));
  const maxClipSeconds = Math.max(1, numberValue(
    firstString(options.maxClipSeconds, source.maxClipSeconds, source.max_clip_seconds),
    maxClipSecondsForVideoProvider(provider, model)
  ));
  const videoPacingProfile = firstObject(source.videoPacingProfile, source.video_pacing_profile)
    || deriveVideoPacingProfileForScreenplay(source, shots, { ...options, durationSeconds, provider, model, maxClipSeconds });
  const videoConsistencyBible = firstObject(source.videoConsistencyBible, source.video_consistency_bible)
    || deriveVideoConsistencyBibleForScreenplay(source, shots, options);
  const seedancePromptStrategy = firstObject(source.seedancePromptStrategy, source.seedance_prompt_strategy)
    || deriveSeedancePromptStrategyForScreenplay(source, videoPacingProfile, videoConsistencyBible, { ...options, provider, model, maxClipSeconds });
  const generatedSrt = screenplaySrtArtifactForScreenplay(source, shots, durationSeconds, maxClipSeconds);
  const existingSrtFile = firstObject(source.srtFile, source.srt_file, source.subtitleFile, source.subtitle_file) || {};
  const existingSrtCues = firstArray(source.srtCues, source.srt_cues);
  const srtContent = firstString(
    existingSrtFile.content,
    source.srt,
    source.srtContent,
    source.srt_content,
    generatedSrt.content
  );
  const srtCues = existingSrtCues.length ? existingSrtCues : generatedSrt.cues;
  const payload = {
    videoPacingProfile,
    seedancePromptStrategy,
    videoConsistencyBible,
    maxClipSeconds,
    videoModelCapability: videoModelCapabilityForScreenplay(provider, model),
    dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
    generatedSubtitleFilename: "generated.srt",
  };
  if (srtCues.length) payload.srtCues = srtCues;
  if (srtContent) {
    payload.srt = srtContent;
    payload.srtFile = {
      filename: firstString(existingSrtFile.filename, existingSrtFile.name, "generated.srt"),
      contentType: firstString(existingSrtFile.contentType, existingSrtFile.content_type, "application/x-subrip"),
      cueCount: numberValue(firstString(existingSrtFile.cueCount, existingSrtFile.cue_count), srtCues.length),
      durationSeconds,
      ...existingSrtFile,
      content: srtContent,
    };
  } else if (Object.keys(existingSrtFile).length) {
    payload.srtFile = existingSrtFile;
  }
  return payload;
}

function normalizeVideoFinishingPlan(plan = {}) {
  const source = plan && typeof plan === "object" ? plan : {};
  const musicVolume = Math.max(0, Math.min(100, numberValue(source.musicVolume ?? source.music_volume, DEFAULT_VIDEO_FINISHING_PLAN.musicVolume)));
  return {
    backgroundMusicMode: normalizedOptionValue(
      firstString(source.backgroundMusicMode, source.background_music_mode, DEFAULT_VIDEO_FINISHING_PLAN.backgroundMusicMode),
      ["auto", "energetic", "warm_cinematic", "documentary", "none"],
      DEFAULT_VIDEO_FINISHING_PLAN.backgroundMusicMode
    ),
    backgroundMusicPrompt: firstString(source.backgroundMusicPrompt, source.background_music_prompt, DEFAULT_VIDEO_FINISHING_PLAN.backgroundMusicPrompt),
    musicVolume,
    ambiencePrompt: firstString(source.ambiencePrompt, source.ambience_prompt, source.ambientBedPrompt, source.ambient_bed_prompt, DEFAULT_VIDEO_FINISHING_PLAN.ambiencePrompt),
    soundFxPrompt: firstString(source.soundFxPrompt, source.sound_fx_prompt, source.sfxPrompt, source.sfx_prompt, DEFAULT_VIDEO_FINISHING_PLAN.soundFxPrompt),
    voiceMixMode: normalizedOptionValue(
      firstString(source.voiceMixMode, source.voice_mix_mode, DEFAULT_VIDEO_FINISHING_PLAN.voiceMixMode),
      ["balanced", "speech_forward", "music_forward", "ambient_only"],
      DEFAULT_VIDEO_FINISHING_PLAN.voiceMixMode
    ),
    useStoryboardReferences: booleanValue(source.useStoryboardReferences ?? source.use_storyboard_references, DEFAULT_VIDEO_FINISHING_PLAN.useStoryboardReferences),
    imageLedAdMode: booleanValue(source.imageLedAdMode ?? source.image_led_ad_mode, DEFAULT_VIDEO_FINISHING_PLAN.imageLedAdMode),
    referenceImageMode: normalizedOptionValue(
      firstString(source.referenceImageMode, source.reference_image_mode, source.storyboardReferenceMode, source.storyboard_reference_mode, DEFAULT_VIDEO_FINISHING_PLAN.referenceImageMode),
      ["prompt_only", "product_packshot", "product_motion_anchor"],
      DEFAULT_VIDEO_FINISHING_PLAN.referenceImageMode
    ),
    requireImageAnchors: booleanValue(source.requireImageAnchors ?? source.require_image_anchors, DEFAULT_VIDEO_FINISHING_PLAN.requireImageAnchors),
    productMotionPrompt: firstString(source.productMotionPrompt, source.product_motion_prompt, DEFAULT_VIDEO_FINISHING_PLAN.productMotionPrompt),
    voiceDialoguePrompt: firstString(source.voiceDialoguePrompt, source.voice_dialogue_prompt, source.dialoguePrompt, source.dialogue_prompt, DEFAULT_VIDEO_FINISHING_PLAN.voiceDialoguePrompt),
    editingPlanPrompt: firstString(source.editingPlanPrompt, source.editing_plan_prompt, DEFAULT_VIDEO_FINISHING_PLAN.editingPlanPrompt),
    burnCaptions: booleanValue(source.burnCaptions ?? source.burn_captions, DEFAULT_VIDEO_FINISHING_PLAN.burnCaptions),
    useMixedAudio: booleanValue(source.useMixedAudio ?? source.use_mixed_audio, DEFAULT_VIDEO_FINISHING_PLAN.useMixedAudio),
    audioMixStandards: normalizeAudioMixStandards(source.audioMixStandards || source.audio_mix_standards),
  };
}

function normalizeAudioMusicSource(value = "free_licensed") {
  const normalized = String(value || "free_licensed").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (["ai", "ai_music", "ai_generated", "google_lyria", "lyria"].includes(normalized)) return "ai_generated";
  if (["none", "no_music", "off"].includes(normalized)) return "none";
  return "free_licensed";
}

function imageLedAdPlanFromVideoFinishingPlan(plan = {}) {
  const normalized = normalizeVideoFinishingPlan(plan);
  return {
    enabled: normalized.imageLedAdMode,
    referenceImageMode: normalized.referenceImageMode,
    useStoryboardReferences: normalized.useStoryboardReferences,
    requireImageAnchors: normalized.requireImageAnchors,
    productMotionPrompt: normalized.productMotionPrompt,
    providerPolicy: normalized.imageLedAdMode
      ? "generate_or_use_approved_image_anchors_then_render_video_from_image"
      : "storyboard_guidance_in_prompt_only",
    sceneUseCases: [
      "d2c_product_packshot",
      "slow_motion_food_or_texture",
      "macro_product_detail",
      "multi_direction_product_motion",
    ],
  };
}

function audioProductionPlanFromVideoFinishingPlan(plan = {}) {
  const normalized = normalizeVideoFinishingPlan(plan);
  return {
    voiceDialogue: {
      prompt: normalized.voiceDialoguePrompt,
      mode: normalized.voiceMixMode,
      policy: "native_voice_or_dialogue_when_provider_supports_audio_then_final_mix",
    },
    music: {
      mode: normalized.backgroundMusicMode,
      prompt: normalized.backgroundMusicPrompt,
      source: "free_licensed",
      volumePercent: normalized.musicVolume,
      duckUnderSpeech: normalized.voiceMixMode !== "music_forward",
    },
    freeMusicPlan: {
      status: "NEEDS_USER_SELECTION",
      sourceType: "free_licensed",
      searchQuery: normalized.backgroundMusicPrompt || `${normalized.backgroundMusicMode} instrumental ad music`,
      licensePolicy: "Use only tracks with explicit commercial-use permission and save source, license URL, attribution text, and download timestamp.",
    },
    ambience: {
      prompt: normalized.ambiencePrompt,
      roomTone: "scene_matched_low_bed",
    },
    soundEffects: {
      prompt: normalized.soundFxPrompt,
      policy: "small_whooshes_clicks_transitions_sparingly",
    },
    audioMixStandards: normalized.audioMixStandards,
  };
}

function editingPlanFromVideoFinishingPlan(plan = {}) {
  const normalized = normalizeVideoFinishingPlan(plan);
  return {
    editorNotes: normalized.editingPlanPrompt,
    pacing: "follow_screenplay_timeline_and_srt_cues",
    imageLedAdMode: normalized.imageLedAdMode,
    referenceImageMode: normalized.referenceImageMode,
    deliverables: [
      "final_master_video",
      "verified_captions_srt",
      "balanced_voice_music_sfx_mix",
    ],
    reviewPolicy: "two_included_revision_rounds_then_paid_changes",
  };
}

function soundDesignPlanFromVideoFinishingPlan(plan = {}) {
  const normalized = normalizeVideoFinishingPlan(plan);
  return {
    voiceDialogue: {
      prompt: normalized.voiceDialoguePrompt,
      mode: normalized.voiceMixMode,
      enabled: Boolean(normalized.voiceDialoguePrompt) || normalized.voiceMixMode !== "ambient_only",
    },
    backgroundMusic: {
      mode: normalized.backgroundMusicMode,
      prompt: normalized.backgroundMusicPrompt,
      volumePercent: normalized.musicVolume,
      enabled: normalized.backgroundMusicMode !== "none",
    },
    ambience: {
      prompt: normalized.ambiencePrompt,
      enabled: Boolean(normalized.ambiencePrompt),
    },
    soundEffects: {
      prompt: normalized.soundFxPrompt,
      enabled: Boolean(normalized.soundFxPrompt),
    },
    voiceMix: {
      mode: normalized.voiceMixMode,
      duckMusicUnderSpeech: normalized.voiceMixMode !== "music_forward",
    },
    audioMixStandards: normalized.audioMixStandards,
    mixPolicy: {
      dialogueFirst: true,
      duckBackgroundMusicUnderSpeech: true,
      preserveAmbientRoomTone: true,
      sparseSoundEffects: true,
      sceneMatchedReverb: true,
      smoothSegmentFades: true,
    },
    useMixedAudio: normalized.useMixedAudio,
    burnCaptions: normalized.burnCaptions,
    useStoryboardReferences: normalized.useStoryboardReferences,
    imageLedAdPlan: imageLedAdPlanFromVideoFinishingPlan(normalized),
    audioProductionPlan: audioProductionPlanFromVideoFinishingPlan(normalized),
  };
}

function normalizeAudioMixStandards(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_AUDIO_MIX_STANDARDS,
    ...source,
    dialogueTargetDb: numberValue(source.dialogueTargetDb ?? source.dialogue_target_db, DEFAULT_AUDIO_MIX_STANDARDS.dialogueTargetDb),
    musicBedDb: numberValue(source.musicBedDb ?? source.music_bed_db, DEFAULT_AUDIO_MIX_STANDARDS.musicBedDb),
    ambienceBedDb: numberValue(source.ambienceBedDb ?? source.ambience_bed_db, DEFAULT_AUDIO_MIX_STANDARDS.ambienceBedDb),
    sfxPeakDb: numberValue(source.sfxPeakDb ?? source.sfx_peak_db, DEFAULT_AUDIO_MIX_STANDARDS.sfxPeakDb),
    fadeMs: numberValue(source.fadeMs ?? source.fade_ms, DEFAULT_AUDIO_MIX_STANDARDS.fadeMs),
  };
}

function normalizedOptionValue(value, allowedValues = [], fallback = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function booleanValue(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function resolveScreenplayVideoShots(scriptJson = {}) {
  return firstArray(
    scriptJson.shots,
    scriptJson.scenes,
    scriptJson.timeline?.shots,
    scriptJson.timeline?.scenes
  )
    .filter((shot) => shot && typeof shot === "object")
    .map((shot, index) => ({
      ...shot,
      shotNumber: Number(shot.shotNumber || shot.shot_number || shot.sceneNumber || shot.scene_number || index + 1),
    }));
}

function deriveVideoPacingProfileForScreenplay(scriptJson = {}, shots = [], options = {}) {
  const paceKey = videoPacingKeyForScreenplay(scriptJson, shots, options);
  const durationSeconds = numberValue(options.durationSeconds || scriptJson.durationSeconds || scriptJson.duration, 30);
  const maxClipSeconds = Math.max(1, numberValue(options.maxClipSeconds || scriptJson.maxClipSeconds || scriptJson.max_clip_seconds, 15));
  const averageShotSeconds = shots.length ? Math.round((durationSeconds / shots.length) * 100) / 100 : durationSeconds;
  return {
    paceKey,
    maxClipSeconds,
    maxDialogueSecondsPerShot: Math.max(1, maxClipSeconds - 1),
    dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
    averageShotSeconds,
    cutDensity: paceKey === "fast_paced" ? "high" : paceKey === "slow_paced" ? "low" : "medium",
    captionRhythm: paceKey === "fast_paced"
      ? "short punchy captions every 1.2-2.4 seconds"
      : paceKey === "slow_paced"
        ? "readable captions every 2.8-5.0 seconds with emotional breathing room"
        : "clean captions every 2.0-3.5 seconds",
    shotDurationRule: paceKey === "fast_paced"
      ? "Prefer 1.5-3.5 second shots, except payoff shots may breathe briefly."
      : paceKey === "slow_paced"
        ? "Prefer 4-8 second shots with steadier camera and fewer abrupt transitions."
        : "Mix 2.5-5 second shots with faster hook and slower payoff.",
  };
}

function videoPacingKeyForScreenplay(scriptJson = {}, shots = [], options = {}) {
  const durationSeconds = numberValue(options.durationSeconds || scriptJson.durationSeconds || scriptJson.duration, 30);
  const averageShotSeconds = shots.length ? durationSeconds / shots.length : durationSeconds;
  const text = [
    options.topicType,
    options.storytellingType,
    scriptJson.category,
    scriptJson.pacingStyle,
    scriptJson.emotionalArc,
    scriptJson.inferredTone,
    scriptJson.projectTitle,
  ].join(" ").toLowerCase();
  if (/comedy|meme|trend|fitness|kinetic|urgent|fast|challenge|product|demo/.test(text) || durationSeconds <= 45 || averageShotSeconds <= 3.25) {
    return "fast_paced";
  }
  if (/emotional|romantic|documentary|dramatic|slow|cinematic|reflection|wellness/.test(text) || durationSeconds >= 120 || averageShotSeconds >= 6) {
    return "slow_paced";
  }
  return "balanced";
}

function deriveSeedancePromptStrategyForScreenplay(scriptJson = {}, pacingProfile = {}, consistencyBible = {}, options = {}) {
  const paceKey = pacingProfile.paceKey || "balanced";
  const maxClipSeconds = Math.max(1, numberValue(options.maxClipSeconds || pacingProfile.maxClipSeconds || scriptJson.maxClipSeconds || scriptJson.max_clip_seconds, 15));
  const pacingPrompt = paceKey === "fast_paced"
    ? "Use energetic motion, punchy cuts, crisp hook text, fast but readable captions, and quick visual payoffs."
    : paceKey === "slow_paced"
      ? "Use steadier camera movement, longer emotional beats, smoother transitions, and fewer cuts so the moment can breathe."
      : "Use a fast hook, readable middle, and clear payoff with no rushed emotional beats.";
  return {
    provider: "seedance",
    maxClipSeconds,
    maxDialogueSecondsPerShot: Math.max(1, maxClipSeconds - 1),
    dialogueTimingPolicy: dialogueTimingPolicyForModelCapability(maxClipSeconds),
    pacingKey: paceKey,
    selectedPacingPrompt: pacingPrompt,
    globalConsistencyPrompt: [
      "Generate each scene from the screenplay JSON as the source of truth.",
      dialogueTimingPolicyForModelCapability(maxClipSeconds),
      pacingPrompt,
      "Maintain the same character identity, face, age, wardrobe, hairstyle, props, set geography, lighting temperature, color palette, camera language, screen direction, and aspect ratio across clips.",
      "Use approved storyboard frames or the first generated frame as reference frames when available.",
      "Use the provided captionTrack/SRT cues only; avoid random subtitles or unreadable generated text.",
      `Negative constraints: ${consistencyBible.negativePrompt || consistencyBible.globalNegativePrompt || "no face drift, wardrobe changes, extra limbs, watermarks, logo artifacts, or sudden environment changes"}.`,
    ].join(" "),
    fastPacedPrompt: "Use energetic cuts, visible motion, strong hook text, punchy camera movement, and short readable caption beats while preserving continuity locks.",
    slowPacedPrompt: "Use steadier camera language, longer emotional beats, softer motion, fewer cuts, and readable captions while preserving continuity locks.",
    continuityTechniques: [
      "repeat locked character identity words in every scene prompt",
      "carry wardrobe, hair, face, props, and set geography across adjacent shots",
      "include previous-shot and next-shot continuity notes",
      "preserve screen direction, eyeline, lighting temperature, lens language, and aspect ratio",
      "use reference frames or approved storyboard images when available",
      "use negative prompts against face drift, outfit changes, extra limbs, logo artifacts, random text, and environment jumps",
    ],
    srtRequired: true,
    captionStyle: options.captionStyle || scriptJson.captionStyle || DEFAULT_CAPTION_STYLE,
  };
}

function deriveVideoConsistencyBibleForScreenplay(scriptJson = {}, shots = [], options = {}) {
  return {
    projectTitle: firstString(scriptJson.projectTitle, scriptJson.title, "Creator video"),
    screenType: firstString(options.screenType, scriptJson.screenType, "vertical"),
    category: firstString(options.topicType, scriptJson.topicType, scriptJson.category, DEFAULT_TOPIC_TYPE),
    characterIdentityLocks: uniqueScreenplayShotValues(shots, (shot) => [
      shot.primaryActors,
      shot.sideActors,
      shot.primaryCharacters,
      shot.sideCharacters,
      shot.expression,
      shot.bodyLanguage,
    ]),
    wardrobeAndAppearanceLocks: uniqueScreenplayShotValues(shots, (shot) => [
      shot.wardrobe,
      shot.costume,
      shot.blockingNotes,
      shot.primaryActorAction,
      shot.creatorDirection,
    ]),
    setAndPropLocks: uniqueScreenplayShotValues(shots, (shot) => [
      shot.setDesign,
      shot.environment,
      shot.resourceRequirements,
      shot.props,
    ]),
    cameraLanguageLocks: uniqueScreenplayShotValues(shots, (shot) => [
      shot.shotType,
      shot.cameraAngle,
      shot.cameraMovement,
      shot.lensSuggestion,
      shot.composition,
    ]),
    lightingAndColorLocks: uniqueScreenplayShotValues(shots, (shot) => [
      shot.lighting,
      shot.lightingMobile,
      shot.lightingProfessional,
      shot.colorPalette,
    ]),
    continuityRules: [
      "Do not change the main character face, age, hairstyle, wardrobe, body type, or skin tone between shots.",
      "Keep location geography and props stable unless the screenplay explicitly changes location.",
      "Preserve left-right screen direction, eyeline, lens feel, lighting temperature, and color palette across adjacent clips.",
      "Keep captions inside safe zones and leave room for platform UI.",
      "When a scene is regenerated after chat, apply only the requested change and preserve all continuity locks.",
    ],
    negativePrompt: "No new actor, changed face, changed outfit, changed room layout, wrong aspect ratio, unreadable generated text, extra limbs, logo artifacts, watermark, random subtitles, or inconsistent lighting.",
  };
}

function uniqueScreenplayShotValues(shots = [], collect, maxItems = 8) {
  const seen = [];
  (Array.isArray(shots) ? shots : []).forEach((shot) => {
    const values = typeof collect === "function" ? collect(shot || {}) : [];
    values.flatMap((value) => Array.isArray(value) ? value : [value]).forEach((value) => {
      const text = truncateText(plainTextValue(value) || textValue(value), 160).replace(/\s+/g, " ").trim();
      if (text && !seen.includes(text) && seen.length < maxItems) seen.push(text);
    });
  });
  return seen;
}

function screenplaySrtArtifactForScreenplay(scriptJson = {}, shots = [], durationSeconds = 30, maxClipSeconds = 15) {
  const existingContent = firstString(scriptJson.srt, scriptJson.srtContent, scriptJson.srt_content);
  const existingCues = firstArray(scriptJson.srtCues, scriptJson.srt_cues);
  const cues = existingCues.length
    ? normalizeScreenplaySrtCues(existingCues)
    : normalizedSrtCuesForScreenplay(shots, durationSeconds, maxClipSeconds);
  const content = existingContent || screenplaySrtTextFromCues(cues);
  return {
    content,
    cues,
    cueCount: cues.length,
    file: {
      filename: "generated.srt",
      contentType: "application/x-subrip",
      cueCount: cues.length,
      durationSeconds,
      content,
    },
  };
}

function normalizedSrtCuesForScreenplay(shots = [], durationSeconds = 30, maxClipSeconds = 15) {
  const cues = [];
  let cursor = 0;
  const safeMaxClipSeconds = Math.max(1.2, Number(maxClipSeconds) || 15);
  const fallbackDuration = shots.length ? Math.max(1.2, Math.min(safeMaxClipSeconds, durationSeconds / shots.length)) : Math.max(1.2, Math.min(safeMaxClipSeconds, durationSeconds));
  (Array.isArray(shots) ? shots : []).forEach((shot, index) => {
    const range = timeRangeForScreenplayShot(shot);
    const startSeconds = Number.isFinite(range.start) ? range.start : cursor;
    const duration = shotDurationSecondsForSrt(shot, range, fallbackDuration, safeMaxClipSeconds);
    const endSeconds = Math.max(startSeconds + 0.5, Number.isFinite(range.end) ? range.end : startSeconds + duration);
    const captions = captionRowsForScreenplayShot(shot, startSeconds, endSeconds);
    captions.forEach((caption) => cues.push({
      shotNumber: Number(shot?.shotNumber || shot?.shot_number || index + 1),
      startSeconds: caption.startSeconds,
      endSeconds: caption.endSeconds,
      text: caption.text,
    }));
    cursor = endSeconds;
  });
  return normalizeScreenplaySrtCues(cues);
}

function normalizeScreenplaySrtCues(cues = []) {
  let index = 1;
  let lastEnd = 0;
  return (Array.isArray(cues) ? cues : [])
    .map((cue) => cue && typeof cue === "object" ? cue : {})
    .filter((cue) => firstString(cue.text, cue.caption, cue.line))
    .sort((left, right) => secondsFromShotTimeValue(left.startSeconds ?? left.start, 0) - secondsFromShotTimeValue(right.startSeconds ?? right.start, 0))
    .map((cue) => {
      const start = Math.max(lastEnd, secondsFromShotTimeValue(cue.startSeconds ?? cue.start, lastEnd));
      const end = Math.max(start + 0.5, secondsFromShotTimeValue(cue.endSeconds ?? cue.end, start + 1.5));
      lastEnd = end;
      return {
        ...cue,
        index: index++,
        startSeconds: start,
        endSeconds: end,
        startTimecode: normalizeSrtTimestamp(start),
        endTimecode: normalizeSrtTimestamp(end),
        text: truncateText(firstString(cue.text, cue.caption, cue.line), 180),
      };
    });
}

function screenplaySrtTextFromCues(cues = []) {
  return (Array.isArray(cues) ? cues : []).map((cue, index) => [
    cue.index || index + 1,
    `${cue.startTimecode || normalizeSrtTimestamp(cue.startSeconds)} --> ${cue.endTimecode || normalizeSrtTimestamp(cue.endSeconds)}`,
    String(cue.text || "").replace(/[\r\n]+/g, " ").trim(),
  ].join("\n")).join("\n\n");
}

function captionRowsForScreenplayShot(shot = {}, shotStart = 0, shotEnd = 0) {
  const captionTrack = firstArray(shot.captionTrack, shot.caption_track, shot.captions);
  if (!captionTrack.length) {
    const text = captionTextForScreenplayShot(shot);
    return text ? [{ startSeconds: shotStart, endSeconds: shotEnd, text }] : [];
  }
  return captionTrack
    .map((caption) => {
      const item = caption && typeof caption === "object" ? caption : { text: caption };
      const rawStart = secondsFromShotTimeValue(item.startSeconds ?? item.startTime ?? item.start_time ?? item.start, shotStart);
      const rawEnd = secondsFromShotTimeValue(item.endSeconds ?? item.endTime ?? item.end_time ?? item.end, Math.min(shotEnd, rawStart + 2.5));
      const relativeWindow = Math.max(0, shotEnd - shotStart);
      const startSeconds = rawStart >= 0 && rawStart <= relativeWindow + 0.25 ? shotStart + rawStart : rawStart;
      const endSeconds = rawEnd > 0 && rawEnd <= relativeWindow + 0.25 ? shotStart + rawEnd : rawEnd;
      const text = truncateText(firstString(item.text, item.caption, item.line, item.words, captionTextForScreenplayShot(shot)), 180);
      return {
        startSeconds: Math.max(0, Math.min(startSeconds, Math.max(shotStart, shotEnd - 0.5))),
        endSeconds: Math.max(startSeconds + 0.5, Math.min(Math.max(shotEnd, startSeconds + 0.5), endSeconds)),
        text,
      };
    })
    .filter((caption) => caption.text);
}

function captionTextForScreenplayShot(shot = {}) {
  return truncateText(firstString(
    shot.textOverlay,
    shot.text_overlay,
    shot.voiceOver,
    shot.voiceover,
    plainTextValue(shot.dialogue),
    shot.title,
    shot.action,
    shot.description
  ), 180);
}

function timeRangeForScreenplayShot(shot = {}) {
  const start = secondsFromShotTimeValue(shot.startTime ?? shot.start_time, Number.NaN);
  const end = secondsFromShotTimeValue(shot.endTime ?? shot.end_time, Number.NaN);
  if (Number.isFinite(start) || Number.isFinite(end)) return { start, end };
  const text = firstString(shot.timestamp, shot.time);
  const numericRange = text.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds)?\s*(?:-|to|->)\s*(\d+(?:\.\d+)?)/i);
  if (numericRange) {
    return { start: Number(numericRange[1]), end: Number(numericRange[2]) };
  }
  return { start: Number.NaN, end: Number.NaN };
}

function shotDurationSecondsForSrt(shot = {}, range = {}, fallbackDuration = 3, maxClipSeconds = 15) {
  const safeMaxClipSeconds = Math.max(1.2, Number(maxClipSeconds) || 15);
  const explicit = numberValue(firstString(shot.durationSeconds, shot.duration_seconds), 0);
  if (explicit > 0) return Math.min(safeMaxClipSeconds, explicit);
  if (Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start) {
    return Math.min(safeMaxClipSeconds, range.end - range.start);
  }
  return fallbackDuration;
}

function secondsFromShotTimeValue(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const clock = text.match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[,.](\d{1,3}))?/);
  if (clock) {
    const hours = Number(clock[1] || 0);
    const minutes = Number(clock[2] || 0);
    const seconds = Number(clock[3] || 0);
    const millis = Number(String(clock[4] || "0").padEnd(3, "0"));
    return hours * 3600 + minutes * 60 + seconds + millis / 1000;
  }
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function normalizeSrtTimestamp(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0);
  const totalMillis = Math.round(safe * 1000);
  const hours = Math.floor(totalMillis / 3600000);
  const minutes = Math.floor((totalMillis % 3600000) / 60000);
  const wholeSeconds = Math.floor((totalMillis % 60000) / 1000);
  const millis = totalMillis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
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

function normalizeStoryboardReferenceAsset(asset = {}) {
  const source = asset && typeof asset === "object" ? asset : {};
  const metadata = firstObject(source.metadata) || {};
  return {
    ...source,
    assetId: firstString(source.assetId, source.id, metadata.assetId, metadata.id),
    id: firstString(source.id, source.assetId, metadata.id, metadata.assetId),
    publicUrl: firstString(source.publicUrl, source.signedUrl, source.assetUrl, source.url, metadata.publicUrl, metadata.signedUrl, metadata.assetUrl),
    signedUrl: firstString(source.signedUrl, source.publicUrl, source.assetUrl, source.url, metadata.signedUrl, metadata.publicUrl, metadata.assetUrl),
    assetUrl: firstString(source.assetUrl, source.signedUrl, source.publicUrl, source.url, metadata.assetUrl, metadata.signedUrl, metadata.publicUrl),
    details: firstString(source.details, metadata.details),
    originalFilename: firstString(source.originalFilename, source.filename, metadata.originalFilename, metadata.filename),
    referenceRole: firstString(source.referenceRole, source.assetRole, metadata.referenceRole, metadata.assetRole, "product_visual_anchor"),
    assetRole: firstString(source.assetRole, source.referenceRole, metadata.assetRole, metadata.referenceRole, "product_visual_anchor"),
  };
}

function mergeStoryboardReferenceAssets(current = [], incoming = []) {
  const merged = [];
  [...firstArray(current), ...firstArray(incoming)]
    .map(normalizeStoryboardReferenceAsset)
    .filter((asset) => storyboardReferenceAssetUrl(asset) || asset.assetId || asset.id)
    .forEach((asset) => {
      const key = storyboardReferenceAssetKey(asset, merged.length);
      if (!merged.some((item, index) => storyboardReferenceAssetKey(item, index) === key)) {
        merged.push(asset);
      }
    });
  return merged;
}

function applyStoryboardReferenceToScriptIdea(scriptIdea, assets = [], details = "", enhanceScreenplay = false) {
  if (!scriptIdea) return scriptIdea;
  const normalizedAssets = mergeStoryboardReferenceAssets([], assets);
  if (!normalizedAssets.length && !details) return scriptIdea;
  const scriptJson = firstObject(scriptIdea.scriptJson, scriptIdea.script_json) || {};
  const creatorContext = firstObject(scriptJson.creatorContext, scriptJson.creator_context) || {};
  const metadata = firstObject(creatorContext.metadata) || {};
  const urls = uniqueStrings([
    ...firstArray(scriptJson.referenceImageUrls, scriptJson.reference_image_urls),
    ...firstArray(scriptJson.productImageUrls, scriptJson.product_image_urls),
    ...normalizedAssets.map(storyboardReferenceAssetUrl),
  ]);
  const nextAssets = mergeStoryboardReferenceAssets(
    [
      ...firstArray(scriptJson.referenceImageAssets, scriptJson.reference_image_assets),
      ...firstArray(scriptJson.productImageAssets, scriptJson.product_image_assets),
    ],
    normalizedAssets
  );
  const cleanDetails = firstString(details, scriptJson.referenceImageDetails, creatorContext.referenceImageDetails);
  const nextMetadata = {
    ...metadata,
    referenceImageUrls: urls,
    ...(cleanDetails ? { referenceImageDetails: cleanDetails } : {}),
  };
  const nextCreatorContext = {
    ...creatorContext,
    metadata: nextMetadata,
    referenceImageUrls: urls,
    productImageUrls: urls,
    referenceImageAssets: nextAssets,
    productImageAssets: nextAssets,
    ...(cleanDetails ? { referenceImageDetails: cleanDetails } : {}),
    ...(enhanceScreenplay && cleanDetails ? { screenplayEnhancementReferenceDetails: cleanDetails } : {}),
    screenplayReferenceEnhancementEnabled: Boolean(enhanceScreenplay),
  };
  const nextScriptJson = {
    ...scriptJson,
    creatorContext: nextCreatorContext,
    referenceImageUrls: urls,
    productImageUrls: urls,
    referenceImageAssets: nextAssets,
    productImageAssets: nextAssets,
    ...(cleanDetails ? { referenceImageDetails: cleanDetails } : {}),
    ...(enhanceScreenplay && cleanDetails ? { screenplayEnhancementReferenceDetails: cleanDetails } : {}),
    screenplayReferenceEnhancementEnabled: Boolean(enhanceScreenplay),
  };
  return {
    ...scriptIdea,
    scriptJson: nextScriptJson,
  };
}

function storyboardReferenceAssetsFromScriptIdea(scriptIdea = {}) {
  const scriptJson = firstObject(scriptIdea?.scriptJson, scriptIdea?.script_json) || {};
  const creatorContext = firstObject(scriptJson.creatorContext, scriptJson.creator_context) || {};
  return mergeStoryboardReferenceAssets(
    [
      ...firstArray(scriptJson.referenceImageAssets, scriptJson.reference_image_assets),
      ...firstArray(scriptJson.productImageAssets, scriptJson.product_image_assets),
      ...firstArray(creatorContext.referenceImageAssets, creatorContext.reference_image_assets),
      ...firstArray(creatorContext.productImageAssets, creatorContext.product_image_assets),
    ],
    []
  );
}

function storyboardReferenceDetailsFromScriptIdea(scriptIdea = {}) {
  const scriptJson = firstObject(scriptIdea?.scriptJson, scriptIdea?.script_json) || {};
  const creatorContext = firstObject(scriptJson.creatorContext, scriptJson.creator_context) || {};
  const metadata = firstObject(creatorContext.metadata) || {};
  return firstString(
    scriptJson.referenceImageDetails,
    scriptJson.screenplayEnhancementReferenceDetails,
    creatorContext.referenceImageDetails,
    creatorContext.screenplayEnhancementReferenceDetails,
    metadata.referenceImageDetails
  );
}

function storyboardReferenceEnhancementEnabledFromScriptIdea(scriptIdea = {}) {
  const scriptJson = firstObject(scriptIdea?.scriptJson, scriptIdea?.script_json) || {};
  const creatorContext = firstObject(scriptJson.creatorContext, scriptJson.creator_context) || {};
  return Boolean(scriptJson.screenplayReferenceEnhancementEnabled || creatorContext.screenplayReferenceEnhancementEnabled);
}

function storyboardReferenceAssetUrl(asset = {}) {
  return firstString(asset.publicUrl, asset.signedUrl, asset.assetUrl, asset.imageUrl, asset.url, asset.href);
}

function storyboardReferenceAssetKey(asset = {}, index = 0) {
  return firstString(asset.assetId, asset.id, asset.objectKey, storyboardReferenceAssetUrl(asset), `reference-${index}`);
}

function StoryboardReferenceImagePanel({
  assets = [],
  details = "",
  enhanceScreenplay = false,
  uploading = false,
  error = "",
  disabled = false,
  onDetailsChange,
  onEnhanceChange,
  onUpload,
  onBlockedAction,
}) {
  const uploadInputRef = useRef(null);
  const attachedCount = Array.isArray(assets) ? assets.length : 0;
  const openUploadPicker = () => {
    if (uploading) return;
    if (disabled) {
      onBlockedAction?.("Generate and save the screenplay before attaching a storyboard reference image.");
      return;
    }
    uploadInputRef.current?.click();
  };
  return (
    <section className="creator-panel p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-200">
            <ImageIcon size={14} /> Optional storyboard reference
          </p>
          <h3 className="mt-1 text-base font-black text-white">Attach image before storyboard</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {attachedCount ? `${attachedCount} image${attachedCount === 1 ? "" : "s"} attached` : "No image attached"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openUploadPicker}
            disabled={uploading}
            aria-disabled={disabled || uploading}
            className={`creator-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white ${
              disabled || uploading ? "opacity-60" : ""
            }`}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            {uploading ? "Uploading" : "Upload Image"}
          </button>
          <input ref={uploadInputRef} type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onUpload} />
          <label className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-cyan-400"
              checked={Boolean(enhanceScreenplay)}
              onChange={(event) => onEnhanceChange?.(event.target.checked)}
            />
            Enhance screenplay
          </label>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]">
        <textarea
          value={details}
          onChange={(event) => onDetailsChange?.(event.target.value)}
          rows={3}
          placeholder="Product, hair, wardrobe, background, logo placement, texture, colors, claims to preserve"
          className="creator-input w-full resize-none px-3 py-2 text-sm font-semibold leading-5"
        />
        <div className="grid min-h-[5.75rem] gap-2 sm:grid-cols-2">
          {attachedCount ? assets.slice(0, 4).map((asset, index) => (
            <div key={storyboardReferenceAssetKey(asset, index)} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
              {storyboardReferenceAssetUrl(asset) ? (
                <img src={storyboardReferenceAssetUrl(asset)} alt="" className="h-16 w-full bg-black/30 object-cover" />
              ) : (
                <div className="grid h-16 place-items-center bg-black/30 text-slate-500">
                  <ImageIcon size={16} />
                </div>
              )}
              <div className="min-w-0 px-2.5 py-2">
                <p className="truncate text-xs font-bold text-white">{asset.details || asset.originalFilename || asset.label || `Reference ${index + 1}`}</p>
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] p-3 text-xs font-semibold text-slate-400 sm:col-span-2">
              Product, character, hair, wardrobe, or background image anchors will be used by storyboard generation after upload.
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>
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
  const storyIdeaId = firstString(detail.storyIdeaId, detail.story_idea_id, detail.id, selectedIdea.storyIdeaId, selectedIdea.story_idea_id, selectedIdea.id);
  return normalizeGeneratedIdea({
    ...selectedIdea,
    id: storyIdeaId,
    storyIdeaId,
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
    topicType: payload.storyScriptJson?.topicType || selectedIdea.topicType || selectedIdea.selectionContext?.storyScript?.topicType || DEFAULT_TOPIC_TYPE,
    productionStyle: payload.storyScriptJson?.productionStyle || selectedIdea.productionStyle || selectedIdea.selectionContext?.storyScript?.productionStyle || DEFAULT_PRODUCTION_STYLE,
    productionStyleGuidance: payload.storyScriptJson?.productionStyleGuidance || selectedIdea.productionStyleGuidance || selectedIdea.selectionContext?.storyScript?.productionStyleGuidance,
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
  const detailId = firstString(detail.id);
  const storyIdeaId = firstString(detail.storyIdeaId, detail.story_idea_id, selectedIdea.storyIdeaId, selectedIdea.story_idea_id, selectedIdea.id);
  const scriptId = firstString(detail.scriptId, detail.script_id, detailId && detailId !== storyIdeaId ? detailId : "");
  return normalizeGeneratedIdea({
    ...selectedIdea,
    id: storyIdeaId || selectedIdea.id || detail.id,
    storyIdeaId,
    title: detail.title || selectedIdea.title || scriptJson.projectTitle || "Past script",
    description: selectedIdea.description || selectedIdea.summary || detail.preview,
    scriptId,
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
    topicType: scriptJson.topicType || selectedIdea.topicType || DEFAULT_TOPIC_TYPE,
    productionStyle: scriptJson.productionStyle || selectedIdea.productionStyle || DEFAULT_PRODUCTION_STYLE,
    productionStyleGuidance: scriptJson.productionStyleGuidance || selectedIdea.productionStyleGuidance,
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
    lockedIdeaTitle: `${shotCount || shots.length || "Shot"} shots ready for editor handoff`,
    status: project.status || "SHOT_DESIGN_READY",
    durationSeconds: project.durationSeconds || project.duration_seconds,
    time: updatedAt ? formatJobTime(updatedAt) : "",
    stage: {
      label: "Open Video",
      description: `${shotCount || shots.length || 0} storyboard shots are ready for render and editor handoff.`,
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
    { id: "cast", label: "Cast", fullLabel: "Cast mapped" },
    { id: "screenplay", label: "Screenplay", fullLabel: "Screenplay ready" },
    { id: "storyboard", label: "Storyboard", fullLabel: "Storyboard ready" },
    { id: "video", label: "Video", fullLabel: "Video render ready" },
  ];
  const completedSteps = restored?.planner?.completedSteps || {};
  const resumePage = workspacePageIds.has(restored?.workspacePage)
    ? restored.workspacePage
    : restored?.workspacePage === "shoot-polish"
      ? "video"
      : "ideas";
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
    cast: "Cast",
    screenplay: "Screenplay",
    video: "Video",
    storyboard: "Storyboard",
    "client-review": "Client Review",
  }[pageId] || "Workflow";
}

function sectionForWorkspacePage(pageId) {
  if (pageId === "video") return "video";
  if (pageId === "storyboard") return "storyboard";
  if (pageId === "client-review") return "client-review";
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
