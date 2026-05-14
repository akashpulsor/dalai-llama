// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, HelpCircle, X } from "lucide-react";
import {
  useCreateWalletRechargeMutation,
  useConfirmAudienceMutation,
  useGenerateIdeasMutation,
  useGetJobQuery,
  useGetSavedStoryboardsQuery,
  useGetStoryboardQuery,
  useGetStoryboardHistoryQuery,
  useGetTrendsQuery,
  useGetTrendCombinationsQuery,
  useGetSubscriptionQuery,
  useGetWalletQuery,
  useLockIdeaGenerateStoryboardMutation,
  useListCreatorsQuery,
  usePredictTrendsMutation,
  useQuoteLockedIdeaMutation,
  useRequestExportMutation,
  useSaveStoryboardMutation,
  useStartSubscriptionUpgradeMutation,
  useUnsaveStoryboardMutation,
} from "../api/creatorEndpoints.js";
import {
  selectAudience,
  selectCreator,
  selectCreatorPlanner,
  selectIdea,
  selectTrend,
  setActiveStep,
  setProjectId,
} from "../slices/plannerSlice.js";
import { markSceneImageReady, markSceneJsonReady, selectCreatorStoryboardLocal } from "../slices/storyboardLocalSlice.js";
import { selectCreatorPreview, setCursorMs, setCurrentSceneIndex, setDurationMs, togglePlayback } from "../slices/previewSlice.js";
import TrendFilterBar from "../components/trends/TrendFilterBar.jsx";
import TrendCarousel from "../components/trends/TrendCarousel.jsx";
import WhyTrendingStrip from "../components/trends/WhyTrendingStrip.jsx";
import PlannerStepper from "../components/stepper/PlannerStepper.jsx";
import AudienceForm from "../components/audience/AudienceForm.jsx";
import CreatorForm from "../components/creator/CreatorForm.jsx";
import IdeaLockPanel from "../components/ideas/IdeaLockPanel.jsx";
import ScriptGenerationModal from "../components/ideas/ScriptGenerationModal.jsx";
import StoryboardGrid from "../components/storyboard/StoryboardGrid.jsx";
import StoryboardHistoryPanel from "../components/storyboard/StoryboardHistoryPanel.jsx";
import MobileFrame from "../components/preview/MobileFrame.jsx";
import GenerationStatusBar from "../components/jobs/GenerationStatusBar.jsx";
import LockIdeaModal from "../components/billing/LockIdeaModal.jsx";
import RechargeWalletModal from "../components/billing/RechargeWalletModal.jsx";
import SubscriptionBadge from "../components/billing/SubscriptionBadge.jsx";
import WalletBalanceButton from "../components/billing/WalletBalanceButton.jsx";

const countryOptions = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AE", label: "UAE" },
];

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

const filterLabels = {
  platform: { instagram: "Instagram Reels", youtube: "YouTube Shorts", tiktok: "TikTok" },
  category: { fitness: "Fitness", beauty: "Beauty", food: "Food", study: "Study" },
  timeframe: { "7d": "Last 7 Days", "24h": "Last 24 Hours", "30d": "Last 30 Days" },
};

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

  const [filters, setFilters] = useState({ platform: "instagram", category: "fitness", timeframe: "7d" });
  const [country, setCountry] = useState(countryOptions[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [extraIdeas, setExtraIdeas] = useState([]);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [savedIdeaIds, setSavedIdeaIds] = useState(() => new Set(["idea-she-almost"]));
  const [storyboardSaved, setStoryboardSaved] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [manualIdeaDraft, setManualIdeaDraft] = useState("");
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptModalMode, setScriptModalMode] = useState("brief");
  const [scriptDetailIdea, setScriptDetailIdea] = useState(null);
  const [predictionJobId, setPredictionJobId] = useState(null);
  const [storyboardJobId, setStoryboardJobId] = useState(null);
  const [generatedStoryboard, setGeneratedStoryboard] = useState(null);
  const [activity, setActivity] = useState([
    { label: "Storyboard generated", detail: "14-shot short preview", time: "4 min ago" },
    { label: "Audience confirmed", detail: "Women 22-35 in India", time: "2 min ago" },
    { label: "Trend selected", detail: "She Almost Didn't Go", time: "Just now" },
  ]);

  const { data: combinationData = {} } = useGetTrendCombinationsQuery();
  const { data: wallet = { balance: 1250, currency: "INR" }, isFetching: walletLoading, refetch: refetchWallet } = useGetWalletQuery();
  const { data: subscription = { planName: "Creator Pro", creatorEntitlements: {} }, isFetching: subscriptionLoading } = useGetSubscriptionQuery();
  const { data: trendsData = [], isFetching } = useGetTrendsQuery({ ...filters, country: country.code });
  const [predictTrends, predictState] = usePredictTrendsMutation();
  const [confirmAudience] = useConfirmAudienceMutation();
  const { data: creators = [] } = useListCreatorsQuery();
  const [generateIdeas, ideasState] = useGenerateIdeasMutation();
  const [quoteLockedIdea, quoteState] = useQuoteLockedIdeaMutation();
  const [lockIdeaGenerateStoryboard, lockState] = useLockIdeaGenerateStoryboardMutation();
  const [saveStoryboard] = useSaveStoryboardMutation();
  const [unsaveStoryboard] = useUnsaveStoryboardMutation();
  const [requestExport, exportState] = useRequestExportMutation();
  const [createWalletRecharge, rechargeState] = useCreateWalletRechargeMutation();
  const [startSubscriptionUpgrade, upgradeState] = useStartSubscriptionUpgradeMutation();
  const { data: predictionJob } = useGetJobQuery(predictionJobId, { skip: !predictionJobId, pollingInterval: predictionJobId ? 1600 : 0 });
  const { data: storyboardJob } = useGetJobQuery(storyboardJobId, { skip: !storyboardJobId, pollingInterval: storyboardJobId ? 1600 : 0 });
  const { data: storyboardHistory = [] } = useGetStoryboardHistoryQuery({ limit: 6 });
  const { data: savedStoryboards = [] } = useGetSavedStoryboardsQuery({ limit: 6 });
  const { data: storyboard } = useGetStoryboardQuery(planner.projectId);

  const trends = trendsData.length ? trendsData : fallbackTrends;
  const currentStoryboard = generatedStoryboard || storyboard;
  const platformOptions = combinationData.platforms || [
    { code: "instagram", label: "Instagram Reels" },
    { code: "youtube", label: "YouTube Shorts" },
    { code: "tiktok", label: "TikTok" },
  ];
  const categoryOptions = combinationData.categories || [
    { code: "fitness", label: "Fitness" },
    { code: "beauty", label: "Beauty" },
    { code: "food", label: "Food" },
    { code: "study", label: "Study" },
  ];
  const validCombinations = combinationData.combinations || [];
  const isValidCombination = !validCombinations.length || validCombinations.some(
    (combo) => combo.active !== false && combo.platformCode === filters.platform && combo.categoryCode === filters.category
  );
  const baseIdeas = ideasState.data?.ideas || currentStoryboard?.ideas || fallbackIdeas;
  const ideas = useMemo(() => {
    const merged = [...baseIdeas, ...extraIdeas];
    return merged.filter((idea, index) => merged.findIndex((candidate) => candidate.id === idea.id) === index);
  }, [baseIdeas, extraIdeas]);
  const scenes = currentStoryboard?.shots?.length ? currentStoryboard.shots : currentStoryboard?.scenes?.length ? currentStoryboard.scenes : fallbackScenes;
  const selectedCreator = creators.find((creator) => creator.id === planner.selectedCreatorId) || creators[0];
  const selectedScene = scenes[preview.currentSceneIndex] || scenes[0];
  const selectedTrend = useMemo(
    () => trends.find((trend) => trend.id === planner.selectedTrendId) || trends[0],
    [planner.selectedTrendId, trends]
  );
  const selectedIdea = useMemo(() => ideas.find((idea) => idea.id === planner.selectedIdeaId) || ideas[0], [ideas, planner.selectedIdeaId]);
  const savedIdeas = useMemo(() => ideas.filter((idea) => savedIdeaIds.has(idea.id)), [ideas, savedIdeaIds]);
  const selectedAudienceSummary = { id: planner.selectedAudienceId, title: "Women 22-35 in India", description: "Interested in fitness, weight loss, confidence building and self improvement." };
  const activeStoryboardId = currentStoryboard?.id || currentStoryboard?.storyboardId || planner.projectId;

  useEffect(() => {
    if (!ideasState.data) {
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
    if (["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(status)) {
      addActivity("Trend prediction ready", `${filterLabels.category[filters.category] || filters.category} - ${country.label}`);
      flash("Predicted trends are ready");
      setPredictionJobId(null);
    }
  }, [predictionJob?.status]);

  useEffect(() => {
    const status = String(storyboardJob?.status || "").toUpperCase();
    if (!["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(status)) return;

    if (storyboardJob?.result?.storyboard) {
      setGeneratedStoryboard(storyboardJob.result.storyboard);
    }
    setStoryboardSaved(false);
    setStoryboardJobId(null);
    dispatch(setProjectId(storyboardJob?.result?.storyboard?.projectId || planner.projectId));
    addActivity("Storyboard generated", selectedIdea?.title || "Locked idea");
    flash("Director-level storyboard generated");
    void refetchWallet?.();
    scrollToSection("storyboard");
  }, [storyboardJob?.status]);

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

  const flash = (message) => {
    setNotice(message);
    window.clearTimeout(window.__creatorPlannerNotice);
    window.__creatorPlannerNotice = window.setTimeout(() => setNotice(""), 2200);
  };

  const addActivity = (label, detail) => {
    setActivity((current) => [{ label, detail, time: "Just now" }, ...current.slice(0, 5)]);
  };

  const handlePredictTrends = async (nextFilters = filters) => {
    setFilters(nextFilters);
    if (!isValidCombination) {
      flash("Select a valid platform/category combination first");
      return;
    }
    try {
      const result = await predictTrends({
        platformCode: nextFilters.platform,
        categoryCode: nextFilters.category,
        timeframe: nextFilters.timeframe,
        countryCode: country.code,
      }).unwrap();
      setPredictionJobId(result.jobId || "job-predict-trends-mock");
    } catch {
      setPredictionJobId("job-predict-trends-mock");
    }
    addActivity("Trend prediction started", `${filterLabels.category[nextFilters.category] || nextFilters.category} - ${country.label}`);
    flash("Predicting trends from recent signal dumps");
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    addActivity(
      "Filters updated",
      `${filterLabels.platform[nextFilters.platform] || nextFilters.platform} / ${filterLabels.category[nextFilters.category] || nextFilters.category}`
    );
  };

  const handleCountrySelect = (nextCountry) => {
    setCountry(nextCountry);
    setCountryOpen(false);
    addActivity("Country changed", nextCountry.label);
    flash(`Showing trend predictions for ${nextCountry.label}`);
  };

  const buildLockPayload = () => ({
    projectId: planner.projectId,
    trendId: planner.selectedTrendId,
    audienceId: planner.selectedAudienceId,
    creatorId: planner.selectedCreatorId,
    ideaId: planner.selectedIdeaId,
    durationSeconds: selectedDuration,
    platformCode: filters.platform,
    categoryCode: filters.category,
    countryCode: country.code,
    idea: selectedIdea,
  });

  const handleOpenLockModal = async () => {
    if (!selectedTrend || !selectedCreator || !selectedIdea || !selectedDuration) {
      flash("Select trend, audience, cast, idea, and duration first");
      return;
    }
    try {
      await quoteLockedIdea(buildLockPayload()).unwrap();
    } catch {
      // The modal still has local fallback pricing through the mock quote state.
    }
    setLockModalOpen(true);
  };

  const handleGenerateStoryboard = () => {
    void handleOpenLockModal();
  };

  const handleConfirmLock = async () => {
    let result = { lockedIdeaId: "locked-idea-local", storyboardId: activeStoryboardId, jobId: "job-storyboard-mock" };
    try {
      result = await lockIdeaGenerateStoryboard(buildLockPayload()).unwrap();
    } catch {
      // Keep the mock flow running while backend work is in progress.
    }
    setStoryboardJobId(result.jobId || "job-storyboard-mock");
    setLockModalOpen(false);
    addActivity("Idea locked", selectedIdea?.title || "Selected idea");
    flash("Wallet package confirmed. Generating storyboard.");
  };

  const handleStepClick = (step) => {
    const sectionByStep = {
      trend: "trends",
      audience: "audience",
      cast: "cast",
      ideas: "ideas",
      storyboard: "storyboard",
    };
    dispatch(setActiveStep(step));
    scrollToSection(sectionByStep[step] || "dashboard");
  };

  const handleTrendSelect = (id) => {
    const trend = trends.find((item) => item.id === id);
    dispatch(selectTrend(id));
    addActivity("Trend selected", trend?.title || "Predicted trend");
    flash(`Selected ${trend?.title || "trend"}`);
    scrollToSection("audience");
  };

  const handleAudienceConfirm = async (audienceData) => {
    try {
      await confirmAudience({ id: planner.selectedAudienceId, ...audienceData }).unwrap();
    } catch {
      // The visible mock confirmation is local.
    }
    dispatch(selectAudience(planner.selectedAudienceId));
    addActivity("Audience confirmed", audienceData?.title || "Women 22-35 in India");
    flash("Audience confirmed");
    scrollToSection("cast");
  };

  const handleCreatorConfirm = (creatorProfile) => {
    dispatch(selectCreator(creatorProfile?.id || selectedCreator?.id || "creator-priya"));
    addActivity("Cast confirmed", creatorProfile?.name || selectedCreator?.name || "Priya");
    flash("Cast profile confirmed");
    scrollToSection("ideas");
  };

  const handleIdeaSelect = (id) => {
    const idea = ideas.find((item) => item.id === id);
    dispatch(selectIdea(id));
    addActivity("Idea selected", idea?.title || "Short concept");
    flash(`Selected ${idea?.title || "idea"}`);
    scrollToSection("storyboard");
  };

  const handleManualIdeaSave = (text) => {
    const nextIdea = {
      id: `idea-manual-${Date.now()}`,
      title: text.length > 42 ? `${text.slice(0, 39)}...` : text,
      description: text,
      hashtags: ["#OriginalIdea", "#CreatorScript"],
      manual: true,
    };
    setExtraIdeas((current) => [nextIdea, ...current]);
    dispatch(selectIdea(nextIdea.id));
    setManualIdeaDraft("");
    addActivity("Manual idea selected", nextIdea.title);
    flash("Manual idea added and selected");
    scrollToSection("storyboard");
  };

  const handleGenerateMoreIdeas = async () => {
    setIsGeneratingMore(true);
    try {
      await generateIdeas({ trendId: planner.selectedTrendId, audienceId: planner.selectedAudienceId, creatorId: planner.selectedCreatorId }).unwrap();
    } catch {
      // The local mock batch below keeps the CTA useful if a real API is unavailable.
    }
    const batchIndex = Math.floor(extraIdeas.length / 2) % mockIdeaBatches.length;
    const batch = mockIdeaBatches[batchIndex].map((idea, index) => ({
      ...idea,
      id: `${idea.id}-${extraIdeas.length + index}`,
    }));
    setExtraIdeas((current) => [...current, ...batch]);
    setIsGeneratingMore(false);
    addActivity("Generated ideas", `${batch.length} new concepts`);
    flash("Added more ideas");
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
    setManualIdeaDraft(nextIdea.description);
    setScriptModalOpen(false);
    setScriptDetailIdea(null);
    addActivity("Generated script", nextIdea.title);
    flash(script.source === "script" ? "Idea extracted from script and selected" : "Scene-by-scene script applied to the brief");
    scrollToSection("storyboard");
  };

  const handleToggleSaveIdea = (idea) => {
    const wasSaved = savedIdeaIds.has(idea.id);
    setSavedIdeaIds((current) => {
      const next = new Set(current);
      if (next.has(idea.id)) next.delete(idea.id);
      else next.add(idea.id);
      return next;
    });
    addActivity(wasSaved ? "Removed saved idea" : "Saved idea", idea.title);
    flash(wasSaved ? "Removed from saved" : "Idea saved");
  };

  const handleSaveStoryboard = async () => {
    const next = !storyboardSaved;
    try {
      if (next) {
        await saveStoryboard({ storyboardId: activeStoryboardId, note: "Saved from planner" }).unwrap();
      } else {
        await unsaveStoryboard({ storyboardId: activeStoryboardId }).unwrap();
      }
    } catch {
      // Local state keeps the CTA responsive if the backend is not available yet.
    }
    setStoryboardSaved(next);
    addActivity(next ? "Saved storyboard" : "Unsaved storyboard", currentStoryboard?.title || "She Almost Didn't Go");
    flash(next ? "Storyboard saved" : "Storyboard removed from saved");
  };

  const handleExport = async () => {
    let exportResult = { exportId: "export-local-mock" };
    try {
      exportResult = await requestExport({ projectId: planner.projectId, format: "json" }).unwrap();
    } catch {
      // Local export still works as a mock even without an API response.
    }
    const payload = {
      projectId: planner.projectId,
      exportId: exportResult.exportId,
      title: currentStoryboard?.title || "She Almost Didn't Go",
      selectedTrend,
      selectedIdea,
      scenes,
    };
    downloadJson("she-almost-didnt-go-storyboard.json", payload);
    addActivity("Exported storyboard", exportResult.exportId || "mock export");
    flash("Storyboard export downloaded");
  };

  const handleSceneSelect = (index) => {
    const sceneMs = preview.durationMs / Math.max(1, scenes.length);
    dispatch(setCurrentSceneIndex(index));
    dispatch(setCursorMs(Math.min(preview.durationMs, index * sceneMs)));
  };

  const handleRecharge = async (body) => {
    try {
      await createWalletRecharge(body).unwrap();
      await refetchWallet?.();
      flash("Recharge flow started");
    } catch {
      flash("Mock recharge flow started");
    }
    setRechargeOpen(false);
  };

  const handleUpgrade = async () => {
    try {
      await startSubscriptionUpgrade({ productCode: "CREATOR" }).unwrap();
      flash("Subscription flow started");
    } catch {
      flash("Mock subscription flow started");
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
  const displayedHistory = [
    ...activity.map((item, index) => ({ id: `activity-${index}`, title: item.label, lockedIdeaTitle: item.detail, time: item.time })),
    ...(Array.isArray(storyboardHistory) ? storyboardHistory : []),
  ];

  return (
    <div id="dashboard" className="creator-section mx-auto max-w-[1680px] space-y-5 px-4 py-6 sm:px-6 xl:px-8">
      {notice && (
        <div className="fixed right-4 top-4 z-[90] rounded-lg border border-purple-400/30 bg-[#0b1020]/95 px-4 py-3 text-sm font-semibold text-purple-100 shadow-2xl shadow-black/40 backdrop-blur">
          {notice}
        </div>
      )}

      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Discover Trends</h1>
          <p className="mt-2 text-sm font-medium text-slate-400">
            Find what's trending and get ideas that fit your audience & creator.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WalletBalanceButton wallet={wallet} isLoading={walletLoading} onRecharge={() => setRechargeOpen(true)} />
          <SubscriptionBadge subscription={subscription} isLoading={subscriptionLoading || upgradeState.isLoading} onUpgrade={handleUpgrade} />
          <button type="button" onClick={() => setModal("help")} className="creator-control flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-300">
            <HelpCircle size={16} /> How it works?
          </button>
          <div className="relative">
            <button type="button" onClick={() => setCountryOpen((open) => !open)} className="creator-control flex items-center gap-2 px-4 py-3 text-sm font-semibold">
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

      <section id="trends" className="creator-section space-y-4">
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
        <TrendCarousel trends={trends} selectedTrendId={planner.selectedTrendId} onSelectTrend={handleTrendSelect} onViewAll={() => setModal("trends")} />
        <WhyTrendingStrip trend={selectedTrend} />
      </section>

      <PlannerStepper activeStep={planner.activeStep} completedSteps={planner.completedSteps} onStepClick={handleStepClick} />

      <div className="grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(28rem,1.2fr)]">
        <div id="audience" className="creator-section flex min-w-0">
          <AudienceForm
            audience={selectedAudienceSummary}
            onConfirm={handleAudienceConfirm}
          />
        </div>
        <div id="cast" className="creator-section flex min-w-0">
          <CreatorForm creator={selectedCreator} onConfirm={handleCreatorConfirm} />
        </div>
        <div id="ideas" className="creator-section flex min-w-0 lg:col-span-2 xl:col-span-1">
          <IdeaLockPanel
            ideas={ideas}
            selectedIdeaId={planner.selectedIdeaId}
            savedIdeaIds={savedIdeaIds}
            manualIdea={manualIdeaDraft}
            onManualIdeaChange={setManualIdeaDraft}
            onManualIdeaSave={handleManualIdeaSave}
            onSelectIdea={handleIdeaSelect}
            onToggleSave={handleToggleSaveIdea}
            onGenerateMore={handleGenerateMoreIdeas}
            onOpenGenerateScript={handleOpenScriptModal}
            onOpenScriptDetail={handleOpenScriptDetail}
            selectedTrendTitle={selectedTrend?.title}
            isGeneratingMore={isGeneratingMore}
            duration={selectedDuration}
            onDurationChange={setSelectedDuration}
            onLock={handleOpenLockModal}
            isLocking={lockState.isLoading}
            lockDisabled={!selectedTrend || !selectedCreator || !selectedIdea || !selectedDuration}
          />
        </div>
      </div>

      <div id="storyboard" className="creator-section grid gap-5 2xl:grid-cols-[minmax(0,3fr)_minmax(19rem,1fr)]">
        <StoryboardGrid
          scenes={scenes}
          title={currentStoryboard?.projectTitle || currentStoryboard?.title || selectedIdea?.title}
          durationSeconds={currentStoryboard?.durationSeconds || currentStoryboard?.duration || selectedDuration}
          readySceneIds={storyboardLocal.readySceneIds}
          imageReadySceneIds={storyboardLocal.imageReadySceneIds}
          activeSceneIndex={preview.currentSceneIndex}
          onSelectScene={handleSceneSelect}
          onExport={handleExport}
          onSave={handleSaveStoryboard}
          isSaved={storyboardSaved}
          onGenerateAgain={handleGenerateStoryboard}
          isGenerating={lockState.isLoading || Boolean(storyboardJobId) || exportState.isLoading}
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
      <GenerationStatusBar job={storyboardJob || (storyboardJobId ? { status: "RUNNING", progress: 38, message: "Building director-level scenes" } : null)} label="Storyboard generation" />

      <StoryboardHistoryPanel
        saved={displayedSavedStoryboards}
        history={displayedHistory}
        onOpen={() => scrollToSection("storyboard")}
      />

      <LockIdeaModal
        open={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        onConfirm={handleConfirmLock}
        onRecharge={() => setRechargeOpen(true)}
        onUpgrade={handleUpgrade}
        isLoading={lockState.isLoading}
        quote={quoteState.data || { cost: 149, wallet }}
        wallet={wallet}
        subscription={subscription}
        selectedTrend={selectedTrend}
        selectedIdea={selectedIdea}
        selectedCreator={selectedCreator}
        audience={selectedAudienceSummary}
        duration={selectedDuration}
      />

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

      {modal && (
        <CreatorModal title={modal === "help" ? "How It Works" : "All Trends"} onClose={() => setModal(null)}>
          {modal === "help" ? (
            <div className="space-y-3 text-sm font-medium leading-6 text-slate-300">
              <p>Predict trends for a valid platform/category, confirm the audience and cast, choose or write an idea, then lock it to start the paid storyboard package.</p>
              <p>Wallet, subscription, and async job states are wired to production-shaped APIs with mock fallbacks until the Creator backend is available.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {trends.map((trend) => (
                <article key={trend.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <img src={`/mocks/creator/${trend.id}.png`} alt="" className="h-28 w-full rounded-md object-cover" />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{trend.title}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{trend.hashtags?.join(" ")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModal(null);
                        handleTrendSelect(trend.id);
                      }}
                      className="creator-primary shrink-0 px-3 py-2 text-xs font-bold text-white"
                    >
                      Use
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CreatorModal>
      )}
    </div>
  );
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
