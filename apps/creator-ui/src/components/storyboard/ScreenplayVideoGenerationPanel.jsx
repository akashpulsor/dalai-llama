// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clapperboard,
  CircleDollarSign,
  Download,
  Film,
  Image as ImageIcon,
  Info,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Music2,
  Play,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Upload,
  Volume2,
  X,
} from "lucide-react";

const terminalStatuses = new Set(["COMPLETED", "READY", "READY_FOR_REVIEW", "RENDERED", "FAILED", "CANCELLED", "CANCELED"]);
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
const DIALOGUE_LANGUAGE_OPTIONS = [
  { value: "Hinglish", label: "Hinglish", languageCode: "hi-IN" },
  { value: "Hindi", label: "Hindi", languageCode: "hi-IN" },
  { value: "English", label: "English", languageCode: "en-IN" },
  { value: "Tamil", label: "Tamil", languageCode: "ta-IN" },
  { value: "Telugu", label: "Telugu", languageCode: "te-IN" },
  { value: "Bengali", label: "Bengali", languageCode: "bn-IN" },
  { value: "Marathi", label: "Marathi", languageCode: "mr-IN" },
  { value: "Spanish", label: "Spanish", languageCode: "es-ES" },
  { value: "French", label: "French", languageCode: "fr-FR" },
  { value: "German", label: "German", languageCode: "de-DE" },
  { value: "Portuguese", label: "Portuguese", languageCode: "pt-BR" },
  { value: "Italian", label: "Italian", languageCode: "it-IT" },
  { value: "Arabic", label: "Arabic", languageCode: "ar-SA" },
  { value: "Japanese", label: "Japanese", languageCode: "ja-JP" },
  { value: "Korean", label: "Korean", languageCode: "ko-KR" },
  { value: "Chinese", label: "Chinese (Mandarin)", languageCode: "zh-CN" },
  { value: "Indonesian", label: "Indonesian", languageCode: "id-ID" },
  { value: "Vietnamese", label: "Vietnamese", languageCode: "vi-VN" },
  { value: "Thai", label: "Thai", languageCode: "th-TH" },
  { value: "Russian", label: "Russian", languageCode: "ru-RU" },
  { value: "Turkish", label: "Turkish", languageCode: "tr-TR" },
  { value: "Dutch", label: "Dutch", languageCode: "nl-NL" },
  { value: "Polish", label: "Polish", languageCode: "pl-PL" },
];
const VOICE_LANGUAGE_OPTIONS = [
  { value: "english_indian", label: "English - Indian accent", language: "English", languageCode: "en-IN", languageBoost: "English" },
  { value: "hinglish_indian", label: "Hinglish - Indian accent", language: "Hinglish", languageCode: "hi-IN", languageBoost: "Hindi" },
  { value: "hindi_indian", label: "Hindi", language: "Hindi", languageCode: "hi-IN", languageBoost: "Hindi" },
];
const CLIENT_RVC_VOICE_MODEL = "client_rvc_english";
const CLIENT_RVC_PROFILE_ID = "founder_female_v1";
const SCENE_VOICE_METHOD_OPTIONS = [
  { value: "fal_chatterbox_multilingual", label: "DalaiLlama Multilingual Voice" },
  { value: "elevenlabs_v3_voice_clone", label: "ElevenLabs v3 Voice Clone" },
  { value: "sarvam_voice_clone", label: "Sarvam Voice Clone" },
  { value: CLIENT_RVC_VOICE_MODEL, label: "Client English Voice - Trained profile" },
  { value: "fal_elevenlabs_v3", label: "ElevenLabs via fal.ai - Existing ID", requires: "elevenLabsVoiceId" },
  { value: "elevenlabs_professional", label: "ElevenLabs Professional - Existing ID", requires: "elevenLabsVoiceId" },
];

export default function ScreenplayVideoGenerationPanel({
  screenplay,
  scenes = [],
  screenplayApproved = false,
  videoRun,
  videoRunLoading = false,
  videoJob,
  finalRenderJob,
  audioJob,
  productionStyle = "hybrid",
  productionStyleLabel = "Hybrid",
  hybridSceneMode = "ask_speaking_scenes",
  onHybridSceneModeChange,
  brollStyleLabel = "Cinematic Social",
  captionStyleLabel = "Bold Keywords",
  videoFinishingPlan,
  onVideoFinishingPlanChange,
  videoProvider = "gemini_omni",
  videoModel = "",
  onVideoProviderChange,
  onVideoModelChange,
  storyboardReady = false,
  storyboardGenerated = false,
  storyboardLoading = false,
  onOpenStoryboard,
  onGenerateStoryboard,
  onGenerateSceneImage,
  onGenerateAllSceneImages,
  onUploadSceneImage,
  onApprove,
  onGenerate,
  onUploadReferenceImage,
  founderAvatarProfile,
  availableFounderAvatars = [],
  selectedFounderAvatarKey = "",
  founderAvatarLibraryLoading = false,
  onSelectFounderAvatar,
  onFounderAvatarProfileChange,
  dialogueLanguage = "Hinglish",
  onDialogueLanguageChange,
  onUploadFounderAvatarSource,
  onPrepareFounderEnglishDialogue,
  onGenerateFounderVoicePreview,
  onFounderVoiceDecision,
  onPrepareFounderAvatarPortrait,
  onGenerateFounderAvatarTest,
  onGenerateFounderAvatarPreview,
  onFounderAvatarDecision,
  onUploadFounderFinalAudio,
  onBlockedAction,
  onChatScene,
  onGenerateSceneDialogueVoice,
  onDecideSceneDialogueVoice,
  onCombineSceneDialogueAudio,
  onUploadSceneAvatarImage,
  onRegenerateScene,
  onFinalRender,
  onGenerateAudioPack,
  onRefreshMedia,
  onOpenScreenplay,
  editingWorkOrder,
  onSubmitEditingJob,
  onApproveEditingJob,
  onRequestEditingChanges,
  isApproving = false,
  isGenerating = false,
  isUploadingReferenceImage = false,
  isUploadingFounderAvatarSource = false,
  isPreparingFounderEnglishDialogue = false,
  isSelectingFounderAvatar = false,
  isGeneratingFounderVoicePreview = false,
  isUpdatingFounderVoiceApproval = false,
  isPreparingFounderAvatarPortrait = false,
  isGeneratingFounderAvatarTest = false,
  isGeneratingFounderAvatarPreview = false,
  isUpdatingFounderAvatarApproval = false,
  isUploadingFounderFinalAudio = false,
  isFinalRendering = false,
  isGeneratingAudio = false,
  isSubmittingEditingJob = false,
  isApprovingEditingJob = false,
  isRequestingEditingChanges = false,
  isGeneratingSceneImage,
  isSceneWorking,
}) {
  const [sceneDrafts, setSceneDrafts] = useState({});
  const [videoPromptDrafts, setVideoPromptDrafts] = useState({});
  const [sceneImagePromptDrafts, setSceneImagePromptDrafts] = useState({});
  const [sceneSoundDrafts, setSceneSoundDrafts] = useState({});
  const [sceneModeOverrides, setSceneModeOverrides] = useState({});
  const [sceneAiProviders, setSceneAiProviders] = useState({});
  const [sceneUploadedImageAssets, setSceneUploadedImageAssets] = useState({});
  const [sceneProductionImageUploading, setSceneProductionImageUploading] = useState({});
  const [sceneDialogueLanguages, setSceneDialogueLanguages] = useState({});
  const [sceneVoiceMethods, setSceneVoiceMethods] = useState({});
  const [sceneVoiceWorking, setSceneVoiceWorking] = useState({});
  const [sceneVoiceDecisionWorking, setSceneVoiceDecisionWorking] = useState({});
  const [scenePortraitUploading, setScenePortraitUploading] = useState({});
  const [combinedDialogueResult, setCombinedDialogueResult] = useState(null);
  const [combiningSceneDialogue, setCombiningSceneDialogue] = useState(false);
  const [generationWorkflow, setGenerationWorkflow] = useState("scene_by_scene");
  const [acceptedClipKeys, setAcceptedClipKeys] = useState({});
  const [editorBrief, setEditorBrief] = useState("");
  const [editorRevisionDraft, setEditorRevisionDraft] = useState("");
  const [musicSource, setMusicSource] = useState("free_licensed");
  const [pendingPaidAction, setPendingPaidAction] = useState(null);
  const [referenceDetails, setReferenceDetails] = useState("");
  const [uploadedReferenceAssets, setUploadedReferenceAssets] = useState([]);
  const [referenceUploadError, setReferenceUploadError] = useState("");
  const [founderAvatarUploadError, setFounderAvatarUploadError] = useState("");
  const finishAvatarSourceInputRef = useRef(null);
  const sceneWorkspaceRef = useRef(null);
  const scenePreparationInFlightRef = useRef(false);
  const refreshedMediaUrls = useRef(new Set());
  const refreshMediaUrl = (mediaUrl) => {
    if (!mediaUrl || refreshedMediaUrls.current.has(mediaUrl)) return;
    refreshedMediaUrls.current.add(mediaUrl);
    onRefreshMedia?.();
    if (typeof window !== "undefined") {
      window.setTimeout(() => refreshedMediaUrls.current.delete(mediaUrl), 15000);
    }
  };
  const sceneRows = useMemo(() => normalizeSceneRows(videoRun, scenes), [videoRun, scenes]);
  const persistedCombinedDialogueAsset = combinedSceneDialogueAudioAsset(videoRun);
  const combinedDialogueAsset = firstObject(
    combinedDialogueResult?.combinedDialogueAudio,
    combinedDialogueResult?.videoRun?.combinedDialogueAudio,
    persistedCombinedDialogueAsset
  );
  const combinedDialogueUrl = firstText(
    combinedDialogueAsset.assetUrl,
    combinedDialogueAsset.signedUrl,
    combinedDialogueAsset.publicUrl,
    combinedDialogueAsset.url,
    videoRun?.combinedDialogueTrack
  );
  const combinedDialogueSummary = firstObject(
    combinedDialogueResult,
    videoRun?.combinedDialogueSummary,
    combinedDialogueAsset
  );
  const availableSceneDialogueCount = sceneRows.filter((scene) => Boolean(sceneDialogueAudioUrl(scene))).length;
  const missingSceneDialogueNumbers = sceneRows
    .filter((scene) => !sceneDialogueAudioUrl(scene))
    .map((scene, index) => Number(scene.sceneNumber || scene.shotNumber || index + 1));
  const status = statusValue(videoRun?.status || videoJob?.status || (sceneRows.length ? "PLANNED" : "WAITING"));
  const finalVideoVariants = finalVideoVariantsFrom(videoRun, finalRenderJob?.result, finalRenderJob?.outputPayload);
  const customVoiceFinalVideo = finalVideoVariants.find((variant) => variant.audioVariant === "CUSTOM_GENERATED_VOICE");
  const nativeAudioFinalVideo = finalVideoVariants.find((variant) => variant.audioVariant === "VIDEO_GENERATED_AUDIO");
  const finalUrl = firstText(
    customVoiceFinalVideo?.url,
    nativeAudioFinalVideo?.url,
    finalVideoVariants[0]?.url,
    finalVideoUrl(videoRun),
    finalVideoUrl(finalRenderJob?.result),
    finalVideoUrl(finalRenderJob?.outputPayload)
  );
  const finalFilename = finalVideoFilename(screenplay, videoRun);
  const srtArtifact = srtArtifactFrom(videoRun, finalRenderJob?.result, finalRenderJob?.outputPayload, screenplay?.scriptJson, screenplay);
  const srtDownloadHref = srtArtifact?.content ? `data:application/x-subrip;charset=utf-8,${encodeURIComponent(srtArtifact.content)}` : "";
  const pacingProfile = firstObject(
    videoRun?.videoPacingProfile,
    videoRun?.video_pacing_profile,
    videoRun?.renderManifest?.videoPacingProfile,
    screenplay?.scriptJson?.videoPacingProfile
  );
  const activeVideoJob = isActiveJob(videoJob);
  const scenePreparationBusy = generationWorkflow === "scene_by_scene"
    && (isGenerating || activeVideoJob);
  const completePipelineBusy = generationWorkflow === "complete_pipeline"
    && (isGenerating || activeVideoJob);
  const activeFinalJob = isActiveJob(finalRenderJob);
  const activeAudioJob = isActiveJob(audioJob);
  const audioAssets = audioAssetsFrom(videoRun, audioJob?.result, audioJob?.outputPayload);
  const musicSelectionPlan = musicSelectionPlanFrom(videoRun, audioJob?.result, audioJob?.outputPayload);
  const hasDialogueAudio = audioAssets.some(isDialogueAudioAsset);
  const hasMusicAudio = audioAssets.some(isMusicAudioAsset);
  const audioPackReady = audioAssets.length > 0 || Boolean(musicSelectionPlan?.status);
  const audioPanelTitle = audioStatusTitle({ hasDialogueAudio, hasMusicAudio, musicSelectionPlan, activeAudioJob });
  const selectedMusicSource = normalizeMusicSource(musicSource);
  const generatedClipRows = sceneRows.filter(hasGeneratedSceneClip);
  const acceptedSceneRows = sceneRows.filter((scene) => isSceneAccepted(scene, acceptedClipKeys, videoRun));
  const anySceneWorking = sceneRows.some((scene) => Boolean(isSceneWorking?.(scene)));
  const activeSceneVoiceId = Object.entries(sceneVoiceWorking).find(([, working]) => Boolean(working))?.[0] || "";
  const anySceneImageGenerating = sceneRows.some((scene) => Boolean(isGeneratingSceneImage?.(scene)));
  const generatedCount = generatedClipRows.length;
  const acceptedCount = acceptedSceneRows.length;
  const imageReadyCount = sceneRows.filter((scene) => Boolean(sceneProductionImageUrl(scene))).length;
  const scenesMissingImages = sceneRows.filter((scene) => !sceneProductionImageUrl(scene));
  const totalDuration = sceneRows.reduce((sum, scene) => sum + (Number(scene.durationSeconds) || 0), 0);
  const resolvedProductionStyleLabel = productionStyleLabel || productionStyleLabelFor(productionStyle);
  const normalizedProductionStyle = normalizeProductionStyle(productionStyle);
  const normalizedVideoProvider = normalizeVideoProvider(videoRun?.provider || videoRun?.metadata?.provider || videoProvider);
  const resolvedVideoModel = compatibleModelForProvider(
    normalizedVideoProvider,
    videoRun?.model || videoRun?.metadata?.model || videoModel
  );
  const activeFounderAvatarProfile = useMemo(
    () => normalizeFounderAvatarProfile(screenplay, videoRun, founderAvatarProfile),
    [founderAvatarProfile, screenplay, videoRun]
  );
  const sourceDialogueLanguage = firstText(
    screenplay?.dialogueLanguage,
    screenplay?.scriptJson?.dialogueLanguage,
    dialogueLanguage,
    "Hinglish"
  );
  const requestedDialogueLanguage = firstText(
    dialogueLanguage,
    activeFounderAvatarProfile.language,
    sourceDialogueLanguage
  );
  const requestedDialogueLanguageOption = dialogueLanguageOptionFor(
    requestedDialogueLanguage,
    activeFounderAvatarProfile.languageCode
  );
  const sourceDialogueLanguageOption = dialogueLanguageOptionFor(sourceDialogueLanguage);
  const runDialogueLanguage = firstText(
    videoRun?.dialogueLanguage,
    videoRun?.language,
    videoRun?.metadata?.dialogueLanguage,
    videoRun?.metadata?.language,
    videoRun?.request?.dialogueLanguage
  );
  const currentWorkspaceDialogueLanguageOption = dialogueLanguageOptionFor(
    firstText(runDialogueLanguage, sourceDialogueLanguage)
  );
  const workspaceLanguageNeedsRefresh = Boolean(runDialogueLanguage)
    && normalizeLanguageKey(runDialogueLanguage) !== normalizeLanguageKey(requestedDialogueLanguageOption.value);
  const dialogueTranslationPending = workspaceLanguageNeedsRefresh || (
    !runDialogueLanguage
    && normalizeLanguageKey(sourceDialogueLanguage) !== normalizeLanguageKey(requestedDialogueLanguageOption.value)
  );
  const founderGenerationPayload = useMemo(
    () => founderAvatarPayloadFrom(activeFounderAvatarProfile),
    [activeFounderAvatarProfile]
  );
  const clonedVoiceAsset = firstObject(
    activeFounderAvatarProfile.voicePreviewAsset,
    activeFounderAvatarProfile.exactFounderAudioAsset,
    activeFounderAvatarProfile.finalFounderAudioAsset
  );
  const clonedVoicePreviewUrl = firstText(
    activeFounderAvatarProfile.finalFounderAudioUrl,
    clonedVoiceAsset.assetUrl,
    clonedVoiceAsset.signedUrl,
    clonedVoiceAsset.publicUrl
  );
  const clonedVoiceId = firstText(
    activeFounderAvatarProfile.providerVoiceId,
    activeFounderAvatarProfile.minimaxVoiceId,
    activeFounderAvatarProfile.elevenLabsVoiceId,
    activeFounderAvatarProfile.sarvamVoiceId,
    activeFounderAvatarProfile.voiceEmbeddingId
  );
  const founderVoiceStatus = String(activeFounderAvatarProfile.voiceApprovalStatus || "NOT_REQUESTED").toUpperCase();
  const founderVoiceCloneCreated = Boolean(clonedVoiceId || clonedVoicePreviewUrl)
    || ["PREVIEW_READY", "APPROVED"].includes(founderVoiceStatus);
  const founderVoiceCloneApproved = founderVoiceStatus === "APPROVED"
    && Boolean(clonedVoiceId || clonedVoicePreviewUrl);
  const finishVoiceLanguageOption = dialogueLanguageOptionFor(
    firstText(
      activeFounderAvatarProfile.voiceLanguage,
      activeFounderAvatarProfile.language,
      requestedDialogueLanguageOption.value
    ),
    firstText(
      activeFounderAvatarProfile.voiceLanguageCode,
      activeFounderAvatarProfile.languageCode,
      requestedDialogueLanguageOption.languageCode
    )
  );
  const selectedTalkingAvatarModel = normalizeLocalTalkingAvatarModel(
    activeFounderAvatarProfile.localModels?.talkingAvatarModel
  );
  const heygenAvatarSelected = selectedTalkingAvatarModel === "fal_heygen_avatar4";
  const dialogueVoiceServiceLabel = activeFounderAvatarProfile.avatarProviderMode === "dalai_llama"
    ? "DalaiLlama Voice"
    : "Google Chirp";
  const isFullAi = normalizedProductionStyle === "full_ai";
  const isHybrid = normalizedProductionStyle === "hybrid";
  const isFullFounder = isHybrid && normalizeHybridSceneModeValue(hybridSceneMode) === "full_founder";
  const finishingPlan = normalizeVideoFinishingPlan(videoFinishingPlan);
  const isProductLed = Boolean(finishingPlan.imageLedAdMode);
  const hasVideoRun = Boolean(videoRun?.runId || videoRun?.id);
  const sceneWorkspaceReady = hasVideoRun && sceneRows.length > 0;
  const hasRemainingSceneClips = hasVideoRun && sceneRows.length > 0 && generatedCount < sceneRows.length;
  const founderVoiceNeedsApproval = isHybrid
    && hasFounderAvatarIdentity(activeFounderAvatarProfile)
    && activeFounderAvatarProfile.voiceApprovalStatus !== "APPROVED";
  const founderAvatarNeedsApproval = isHybrid
    && hasFounderAvatarIdentity(activeFounderAvatarProfile)
    && activeFounderAvatarProfile.avatarProviderMode === "dalai_llama"
    && activeFounderAvatarProfile.avatarPreviewStatus !== "APPROVED";
  const avatarVideoBlockedReason = !hasFounderAvatarIdentity(activeFounderAvatarProfile)
    ? "Select a ready avatar or upload a consented creator video before creating an avatar video."
    : activeFounderAvatarProfile.voiceApprovalStatus !== "APPROVED"
      ? "Create and approve the founder voice clone before creating an avatar video."
      : activeFounderAvatarProfile.avatarProviderMode === "dalai_llama"
        && activeFounderAvatarProfile.avatarPreviewStatus !== "APPROVED"
        ? "Create and approve the portrait avatar quality test before running the full avatar video."
      : sceneGenerationReason({
        hasScript: Boolean(screenplay?.scriptId),
        hasRun: hasVideoRun,
        screenplayApproved,
        isGenerating,
        activeVideoJob,
      });
  const completePipelineBlockedReason = isFullFounder && !hasFounderAvatarIdentity(activeFounderAvatarProfile)
    ? "Select a ready avatar or upload a consented founder source video before generating a Full Founder video."
    : founderVoiceNeedsApproval
      ? "Approve the founder voice preview or upload exact founder audio before avatar generation."
      : founderAvatarNeedsApproval
        ? "Create and approve the portrait avatar quality test before the full video pipeline."
      : sceneGenerationReason({
        hasScript: Boolean(screenplay?.scriptId),
        hasRun: hasVideoRun,
        screenplayApproved,
        isGenerating,
        activeVideoJob,
      });
  const prepareWorkspaceBlockedReason = sceneGenerationReason({
    hasScript: Boolean(screenplay?.scriptId),
    screenplayApproved,
    isGenerating,
    activeVideoJob,
  });
  const generateBlockedReason = generationWorkflow === "scene_by_scene"
    ? prepareWorkspaceBlockedReason
    : completePipelineBlockedReason;
  const sceneWorkspaceAlreadyCurrent = generationWorkflow === "scene_by_scene"
    && sceneWorkspaceReady;
  const canGenerate = !generateBlockedReason
    && !sceneWorkspaceAlreadyCurrent
    && !anySceneWorking
    && !activeFinalJob;
  const primaryGenerationActionAvailable = canGenerate || sceneWorkspaceAlreadyCurrent;
  const generateActionBlockedReason = generateBlockedReason
    || (anySceneWorking ? "Wait for the active scene generation to finish." : "")
    || (activeFinalJob ? "Wait for the current final render to finish." : "");
  const allSceneClipsGenerated = sceneRows.length > 0 && generatedCount >= sceneRows.length;
  const allSceneClipsAccepted = allSceneClipsGenerated && acceptedCount >= sceneRows.length;
  const finalRenderBlockedReason = finalRenderReason({
    hasRun: hasVideoRun,
    totalScenes: sceneRows.length,
    generatedCount,
    acceptedCount,
    allSceneClipsGenerated,
    allSceneClipsAccepted,
  });
  const canFinalRender = hasVideoRun && allSceneClipsAccepted && !isFinalRendering && !activeFinalJob;
  const canGenerateAudio = hasVideoRun && !isGeneratingAudio && !activeAudioJob;
  const remainingSceneRows = sceneRows.filter((scene) => !hasGeneratedSceneClip(scene));
  const plannedAvatarSceneCount = sceneRows.filter((scene) => (
    String(resolvedSceneMode(scene, sceneModeOverrides, productionStyle, hybridSceneMode) || "")
      .toLowerCase()
      .includes("talking")
  )).length;
  const showFinishAvatarControls = isHybrid || hasFounderAvatarIdentity(activeFounderAvatarProfile);
  const finishAvatarGenerationBlockedReason = !screenplayApproved
    ? "Approve the screenplay before generating the complete video."
    : !activeFounderAvatarProfile.consentConfirmed
      ? "Confirm creator consent before cloning voice or generating avatar scenes."
      : !hasFounderAvatarIdentity(activeFounderAvatarProfile)
        ? "Upload the creator source video before cloning voice or generating avatar scenes."
        : !founderVoiceCloneApproved
          ? "Create, review, and approve the cloned voice before generating avatar scenes."
          : !heygenAvatarSelected && activeFounderAvatarProfile.avatarPreviewStatus !== "APPROVED"
            ? "Approve the avatar quality preview before using this non-HeyGen avatar model."
            : !sceneRows.length
              ? "Prepare screenplay scenes before generating the complete video."
              : !remainingSceneRows.length
                ? "All scenes are generated. Accept them and combine the video."
                : anySceneWorking || activeVideoJob
                  ? "Wait for the active scene generation to finish."
                  : "";
  const billingSummary = billingSummaryFromRun(videoRun);
  const billingLineItems = arrayValue(billingSummary.lineItems);
  const fullVideoPackageInr = moneyValue(billingSummary.newFullVideoPackageInr, 5999);
  const fullVideoRerunIsPaid = generationWorkflow === "complete_pipeline"
    && hasVideoRun
    && generatedCount > 0;
  const referenceAssets = useMemo(
    () => mergeReferenceAssets(referenceAssetsFrom(videoRun, screenplay), uploadedReferenceAssets),
    [screenplay, uploadedReferenceAssets, videoRun]
  );
  const referenceGenerationPayload = useMemo(
    () => referenceGenerationPayloadFrom(referenceAssets, referenceDetails),
    [referenceAssets, referenceDetails]
  );
  useEffect(() => {
    setCombinedDialogueResult(null);
  }, [videoRun?.runId, videoRun?.id]);
  useEffect(() => {
    if (scenePreparationBusy) {
      scenePreparationInFlightRef.current = true;
      return;
    }
    if (!scenePreparationInFlightRef.current || !sceneWorkspaceReady) return;
    scenePreparationInFlightRef.current = false;
    window.requestAnimationFrame(() => {
      sceneWorkspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [scenePreparationBusy, sceneWorkspaceReady]);
  const actionReadiness = [
    {
      label: "Video run",
      value: canGenerate
        ? hasVideoRun
          ? "Ready to create a fresh full-video regeneration."
          : "Ready to generate every shot in sequence."
        : generateBlockedReason,
      ready: canGenerate,
    },
    {
      label: "Shot review",
      value: generatedCount
        ? `${generatedCount} generated shot${generatedCount === 1 ? "" : "s"} can be accepted.`
        : "Generate at least one shot before review.",
      ready: Boolean(generatedCount),
    },
    {
      label: "Final merge",
      value: canFinalRender
        ? "Ready to combine accepted clips into the final video."
        : finalRenderBlockedReason,
      ready: canFinalRender,
    },
  ];

  const handleDraftChange = (sceneId, value) => {
    setSceneDrafts((current) => ({ ...current, [sceneId]: value }));
  };

  const handleVideoPromptChange = (sceneId, value) => {
    setVideoPromptDrafts((current) => ({ ...current, [sceneId]: value }));
  };

  const handleSceneSoundChange = (sceneId, value) => {
    setSceneSoundDrafts((current) => ({ ...current, [sceneId]: value }));
  };

  const handleChatSubmit = async (scene) => {
    const draft = String(sceneDrafts[scene.id] || "").trim();
    if (!draft) return;
    await onChatScene?.(scene, draft, {
      ...referenceGenerationPayload,
      ...founderGenerationPayload,
      generationMode: resolvedSceneMode(scene, sceneModeOverrides, productionStyle, hybridSceneMode),
      hybridSceneMode,
      provider: normalizedVideoProvider,
      model: resolvedVideoModel,
      dialogueLanguage: requestedDialogueLanguageOption.value,
      languageCode: requestedDialogueLanguageOption.languageCode,
      sourceDialogueLanguage,
      autoTranslateDialogue: normalizeLanguageKey(requestedDialogueLanguageOption.value) !== normalizeLanguageKey(sourceDialogueLanguage),
      ...videoPromptPayload(scene, videoPromptDrafts, sceneSoundDrafts, isProductLed),
    });
    setSceneDrafts((current) => ({ ...current, [scene.id]: "" }));
  };

  const handleModeChange = (scene, mode) => {
    setSceneModeOverrides((current) => {
      const next = { ...current };
      if (!mode || mode === "auto") delete next[scene.id];
      else next[scene.id] = mode;
      return next;
    });
  };

  const handleAcceptScene = (scene) => {
    if (!hasGeneratedSceneClip(scene)) return;
    const key = clipReviewKey(scene, videoRun);
    if (!key) return;
    setAcceptedClipKeys((current) => ({ ...current, [key]: true }));
  };

  const handleAcceptAllReady = () => {
    const next = {};
    generatedClipRows.forEach((scene) => {
      const key = clipReviewKey(scene, videoRun);
      if (key) next[key] = true;
    });
    setAcceptedClipKeys((current) => ({ ...current, ...next }));
  };

  const handleFinalRender = () => onFinalRender?.({
    videoFinishingPlan: finishingPlan,
    ...founderGenerationPayload,
    provider: normalizedVideoProvider,
    model: resolvedVideoModel,
    acceptedSceneIds: acceptedSceneRows.map((scene) => scene.id),
    acceptedClipKeys: acceptedSceneRows.map((scene) => clipReviewKey(scene, videoRun)).filter(Boolean),
    requireAcceptedScenes: true,
  });

  const videoGenerationPayload = (billingConsent = false, workflow = generationWorkflow) => {
    const prepareOnly = workflow === "scene_by_scene";
    const payloadDialogueLanguage = prepareOnly
      ? sourceDialogueLanguageOption
      : requestedDialogueLanguageOption;
    const productNoHumans = Boolean(
      screenplay?.scriptJson?.noHumans
      ?? screenplay?.scriptJson?.no_humans
      ?? sceneRows.some((scene) => Boolean(scene?.noHumans ?? scene?.no_humans))
    );
    const canonicalProductImageAssets = referenceAssets.map((asset) => ({
      ...asset,
      referenceRole: "canonical_product_reference",
      assetRole: "canonical_product_reference",
    }));
    const canonicalProductImageUrls = canonicalProductReferenceUrls(videoRun, screenplay, canonicalProductImageAssets);
    return {
      sceneModeOverrides: resolvedSceneModeOverrides(sceneRows, sceneModeOverrides, productionStyle, hybridSceneMode),
      scenes: sceneRows.map((scene) => ({
        id: scene.id,
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        shotNumber: scene.shotNumber || scene.sceneNumber,
        ...videoPromptPayload(scene, videoPromptDrafts, sceneSoundDrafts, isProductLed),
      })),
      videoFinishingPlan: finishingPlan,
      ...referenceGenerationPayload,
      productLed: isProductLed,
      imageLedAdMode: isProductLed,
      noHumans: productNoHumans,
      ...(isProductLed ? {
        canonicalProductImageAssets,
        canonicalProductImageUrls,
      } : {}),
      ...founderGenerationPayload,
      dialogueLanguage: payloadDialogueLanguage.value,
      languageCode: payloadDialogueLanguage.languageCode,
      sourceDialogueLanguage,
      autoTranslateDialogue: !prepareOnly
        && normalizeLanguageKey(requestedDialogueLanguageOption.value) !== normalizeLanguageKey(sourceDialogueLanguage),
      hybridSceneMode,
      generationWorkflow: workflow,
      prepareOnly,
      autoMerge: workflow === "complete_pipeline",
      provider: normalizedVideoProvider,
      model: resolvedVideoModel,
      forceNewRun: billingConsent || (
        workflow === "complete_pipeline"
        && hasVideoRun
        && workspaceLanguageNeedsRefresh
      ),
      billingConsent,
    };
  };

  const fullFounderGenerationPayload = (billingConsent = false, workflow = generationWorkflow) => {
    const payload = videoGenerationPayload(billingConsent, workflow);
    return {
      ...payload,
      hybridSceneMode: "full_founder",
      sceneModeOverrides: Object.fromEntries(sceneRows.map((scene) => [scene.id, "talking_head"])),
      useSceneDialogue: true,
      avatarScript: "",
      avatarScriptOverride: "",
      spokenText: "",
    };
  };

  const handleGenerateVideo = () => {
    if (generationWorkflow === "scene_by_scene") {
      onGenerate?.(isFullFounder ? fullFounderGenerationPayload(false) : videoGenerationPayload(false));
      return;
    }
    if (fullVideoRerunIsPaid) {
      setPendingPaidAction({
        type: isFullFounder ? "founder_avatar" : "full_video",
        title: generationWorkflow === "scene_by_scene"
          ? "Prepare a fresh scene workspace?"
          : "Start a new complete-video run?",
        walletChargeInr: fullVideoPackageInr,
      });
      return;
    }
    onGenerate?.(isFullFounder ? fullFounderGenerationPayload(false) : videoGenerationPayload(false));
  };

  const handleFinishAvatarVideo = () => {
    if (finishAvatarGenerationBlockedReason) {
      onBlockedAction?.(finishAvatarGenerationBlockedReason);
      return;
    }
    setGenerationWorkflow("complete_pipeline");
    const payload = isFullFounder
      ? fullFounderGenerationPayload(false, "complete_pipeline")
      : videoGenerationPayload(false, "complete_pipeline");
    onGenerate?.({
      ...payload,
      generationWorkflow: "complete_pipeline",
      prepareOnly: false,
      autoMerge: true,
    });
  };

  const handleCreateAvatarVideo = () => {
    if (avatarVideoBlockedReason) {
      onBlockedAction?.(avatarVideoBlockedReason);
      return;
    }
    if (hasVideoRun) {
      setPendingPaidAction({
        type: "founder_avatar",
        title: "Create a new Full Founder avatar video?",
        walletChargeInr: fullVideoPackageInr,
      });
      return;
    }
    onGenerate?.(fullFounderGenerationPayload(false));
  };

  const handleRegenerateScene = (scene, requestOverrides = {}) => {
    const requestLanguageOption = dialogueLanguageOptionFor(
      firstText(requestOverrides.dialogueLanguage, requestOverrides.language, requestedDialogueLanguageOption.value),
      firstText(requestOverrides.languageCode, requestedDialogueLanguageOption.languageCode)
    );
    const request = {
      ...referenceGenerationPayload,
      ...founderGenerationPayload,
      generationMode: resolvedSceneMode(scene, sceneModeOverrides, productionStyle, hybridSceneMode),
      hybridSceneMode,
      provider: normalizedVideoProvider,
      model: resolvedVideoModel,
      dialogueLanguage: requestLanguageOption.value,
      language: requestLanguageOption.value,
      languageCode: requestLanguageOption.languageCode,
      sourceDialogueLanguage,
      autoTranslateDialogue: normalizeLanguageKey(requestLanguageOption.value) !== normalizeLanguageKey(sourceDialogueLanguage),
      generationWorkflow: "scene_by_scene",
      ...videoPromptPayload(scene, videoPromptDrafts, sceneSoundDrafts, isProductLed),
      ...requestOverrides,
    };
    if (hasGeneratedSceneClip(scene)) {
      const quote = sceneRerunQuote(scene, billingSummary);
      setPendingPaidAction({
        type: "scene",
        title: `Regenerate scene ${scene.sceneNumber || ""}?`.trim(),
        scene,
        request,
        ...quote,
      });
      return;
    }
    onRegenerateScene?.(scene, request);
  };

  const handleCloneSceneDialogue = async (scene, languageOption, voiceMethod) => {
    const sceneId = scene?.id;
    if (!sceneId || sceneVoiceWorking[sceneId]) return;
    if (activeSceneVoiceId && activeSceneVoiceId !== sceneId) {
      onBlockedAction?.("Wait for the current scene voice cloning process to complete.");
      return;
    }
    if (!hasVideoRun) {
      onBlockedAction?.("Prepare the video run before cloning this scene dialogue.");
      return;
    }
    if (!screenplayApproved) {
      onBlockedAction?.("Approve the screenplay before cloning this scene dialogue.");
      return;
    }
    if (!dialogueForScene(scene)) {
      onBlockedAction?.("Add dialogue to this scene before cloning its voice.");
      return;
    }
    if (!activeFounderAvatarProfile.consentConfirmed) {
      onBlockedAction?.("Confirm creator consent in Finish production before cloning scene dialogue.");
      return;
    }
    if (!hasFounderAvatarIdentity(activeFounderAvatarProfile)) {
      onBlockedAction?.("Upload or select a creator profile before cloning scene dialogue.");
      return;
    }
    if (voiceMethod.value === CLIENT_RVC_VOICE_MODEL && normalizeLanguageKey(languageOption.value) !== "english") {
      onBlockedAction?.("The trained client voice supports English only. Choose English or another clone method.");
      return;
    }
    if (voiceMethod.requires && !firstText(activeFounderAvatarProfile[voiceMethod.requires])) {
      onBlockedAction?.(`${voiceMethod.label} requires an existing approved voice ID.`);
      return;
    }
    setSceneVoiceWorking((current) => ({ ...current, [sceneId]: true }));
    setCombinedDialogueResult(null);
    try {
      handleModeChange(scene, "talking_head");
      await onGenerateSceneDialogueVoice?.(scene, {
        ...founderGenerationPayload,
        generationMode: "talking_head",
        provider: "dalai_llama",
        voiceModel: voiceMethod.value,
        localVoiceModel: voiceMethod.value,
        voiceCloneMethod: voiceMethod.value,
        localModels: {
          ...activeFounderAvatarProfile.localModels,
          voiceModel: voiceMethod.value,
        },
        dialogueLanguage: languageOption.value,
        language: languageOption.value,
        languageCode: languageOption.languageCode,
        dialogueRecordId: languageOption.dialogueRecordId || "",
        rootDialogueId: languageOption.rootDialogueId || "",
        sourceDialogueLanguage: firstText(scene.sourceDialogueLanguage, sourceDialogueLanguage),
        autoTranslateDialogue: normalizeLanguageKey(languageOption.value) !== normalizeLanguageKey(
          firstText(scene.sourceDialogueLanguage, sourceDialogueLanguage)
        ),
      });
    } finally {
      setSceneVoiceWorking((current) => ({ ...current, [sceneId]: false }));
    }
  };

  const handleCombineSceneDialogue = async () => {
    if (combiningSceneDialogue) return;
    if (!hasVideoRun) {
      onBlockedAction?.("Prepare the scene workspace before combining dialogue audio.");
      return;
    }
    if (!availableSceneDialogueCount) {
      onBlockedAction?.("Clone at least one scene dialogue before combining audio.");
      return;
    }
    if (activeSceneVoiceId) {
      onBlockedAction?.("Wait for the current scene voice cloning process to complete.");
      return;
    }
    setCombiningSceneDialogue(true);
    try {
      const result = await onCombineSceneDialogueAudio?.();
      if (result?.combinedDialogueAudio) {
        setCombinedDialogueResult(result);
      }
    } finally {
      setCombiningSceneDialogue(false);
    }
  };

  const handleSceneVoiceDecision = async (scene, decision) => {
    const sceneId = scene?.id;
    if (!sceneId || sceneVoiceDecisionWorking[sceneId]) return;
    setSceneVoiceDecisionWorking((current) => ({ ...current, [sceneId]: true }));
    try {
      await onDecideSceneDialogueVoice?.(scene, decision);
    } finally {
      setSceneVoiceDecisionWorking((current) => ({ ...current, [sceneId]: false }));
    }
  };

  const handleSceneAvatarImageUpload = async (scene, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const sceneId = scene?.id;
    if (!file || !sceneId || scenePortraitUploading[sceneId]) return;
    if (!String(file.type || "").startsWith("image/")) {
      onBlockedAction?.("Upload a JPG, PNG, or WebP avatar image.");
      return;
    }
    if (!hasVideoRun) {
      onBlockedAction?.("Prepare the video run before uploading a scene avatar image.");
      return;
    }
    setScenePortraitUploading((current) => ({ ...current, [sceneId]: true }));
    try {
      await onUploadSceneAvatarImage?.(scene, file);
    } finally {
      setScenePortraitUploading((current) => ({ ...current, [sceneId]: false }));
    }
  };

  const handleSceneProductionImageUpload = async (scene, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const sceneId = scene?.id;
    if (!file || !sceneId || sceneProductionImageUploading[sceneId]) return;
    if (!String(file.type || "").startsWith("image/")) {
      onBlockedAction?.("Upload a JPG, PNG, WebP, AVIF, or GIF image.");
      return;
    }
    if (!hasVideoRun) {
      onBlockedAction?.("Prepare the scene workspace before uploading an image for this shot.");
      return;
    }
    setSceneProductionImageUploading((current) => ({ ...current, [sceneId]: true }));
    try {
      const imagePrompt = String(
        sceneImagePromptDrafts[sceneId] ?? productionImagePromptForScene(scene, isProductLed)
      ).trim();
      const shotNumber = scene.sceneNumber || scene.shotNumber || "";
      const details = [
        shotNumber ? `Shot ${shotNumber} production image.` : "Scene production image.",
        imagePrompt,
        referenceDetails,
      ].filter(Boolean).join(" ");
      const result = await onUploadSceneImage?.(scene, file, details);
      const asset = firstObject(result?.asset, result?.scene?.productionImage, result);
      if (!Object.keys(asset).length) return;
      setSceneUploadedImageAssets((current) => ({ ...current, [sceneId]: asset }));
    } finally {
      setSceneProductionImageUploading((current) => ({ ...current, [sceneId]: false }));
    }
  };

  const confirmPaidAction = () => {
    if (!pendingPaidAction) return;
    if (pendingPaidAction.type === "full_video") {
      onGenerate?.(videoGenerationPayload(true));
    } else if (pendingPaidAction.type === "founder_avatar") {
      onGenerate?.(fullFounderGenerationPayload(true));
    } else if (pendingPaidAction.scene) {
      onRegenerateScene?.(pendingPaidAction.scene, {
        ...pendingPaidAction.request,
        billingConsent: true,
      });
    }
    setPendingPaidAction(null);
  };

  const handleReferenceUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReferenceUploadError("");
    if (!String(file.type || "").startsWith("image/")) {
      setReferenceUploadError("Upload a JPG, PNG, WebP, AVIF, or GIF image.");
      return;
    }
    const asset = await onUploadReferenceImage?.({ file, details: referenceDetails });
    if (!asset) return;
    setUploadedReferenceAssets((current) => mergeReferenceAssets(current, [asset]));
  };

  const handleFounderAvatarChange = (patch) => {
    if (patch?.consentConfirmed) {
      setFounderAvatarUploadError("");
    }
    const currentVoiceModel = activeFounderAvatarProfile.localModels?.voiceModel;
    const currentTalkingAvatarModel = activeFounderAvatarProfile.localModels?.talkingAvatarModel;
    const currentLipSyncModel = activeFounderAvatarProfile.localModels?.lipSyncModel;
    const nextProfile = normalizeFounderAvatarProfile({ ...activeFounderAvatarProfile, ...patch });
    const voiceSettingsChanged = [
      "referenceTranscript",
      "voicePreviewText",
      "pronunciationGuide",
      "elevenLabsVoiceId",
      "sarvamVoiceId",
      "synthesiaVoiceId",
      "voiceProfileId",
      "language",
      "languageCode",
      "voiceLanguageMode",
      "voiceLanguage",
      "voiceLanguageCode",
      "referenceLanguage",
      "minimaxLanguageBoost",
    ]
      .some((key) => Object.prototype.hasOwnProperty.call(patch || {}, key))
      || currentVoiceModel !== nextProfile.localModels?.voiceModel;
    const avatarSettingsChanged = voiceSettingsChanged
      || currentTalkingAvatarModel !== nextProfile.localModels?.talkingAvatarModel
      || currentLipSyncModel !== nextProfile.localModels?.lipSyncModel;
    const avatarTestSettingsChanged = voiceSettingsChanged
      || Object.prototype.hasOwnProperty.call(patch || {}, "avatarMotionPrompt");
    if (voiceSettingsChanged) {
      nextProfile.voiceApprovalStatus = "NOT_REQUESTED";
      nextProfile.voicePreviewAsset = {};
    }
    if (avatarSettingsChanged) {
      nextProfile.avatarPreviewStatus = "NOT_REQUESTED";
      nextProfile.avatarPreviewAsset = {};
      nextProfile.avatarPreviewUrl = "";
    }
    if (avatarTestSettingsChanged) {
      nextProfile.avatarTestStatus = "NOT_REQUESTED";
      nextProfile.avatarTestAsset = {};
      nextProfile.avatarTestUrl = "";
    }
    onFounderAvatarProfileChange?.(nextProfile);
  };

  const handleFounderAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFounderAvatarUploadError("");
    if (!isSupportedVideoUpload(file)) {
      setFounderAvatarUploadError("Upload the founder source as a video file.");
      return;
    }
    if (!activeFounderAvatarProfile.consentConfirmed) {
      setFounderAvatarUploadError("Confirm founder consent before uploading media for avatar or voice cloning.");
      return;
    }
    const localModels = normalizeFounderLocalModels(activeFounderAvatarProfile.localModels);
    const asset = await onUploadFounderAvatarSource?.({
      file,
      details: activeFounderAvatarProfile.details,
      providerMode: activeFounderAvatarProfile.avatarProviderMode,
      synthesiaAvatarId: activeFounderAvatarProfile.synthesiaAvatarId,
      synthesiaVoiceId: activeFounderAvatarProfile.synthesiaVoiceId,
      localVoiceModel: localModels.voiceModel,
      voiceProfileId: activeFounderAvatarProfile.voiceProfileId || localModels.voiceProfileId,
      localTalkingAvatarModel: localModels.talkingAvatarModel,
      localLipSyncModel: localModels.lipSyncModel,
      localImageModel: localModels.imageModel,
      localVideoModel: localModels.videoModel,
      referenceTranscript: activeFounderAvatarProfile.referenceTranscript,
      previewText: activeFounderAvatarProfile.voicePreviewText,
      spokenText: activeFounderAvatarProfile.spokenText,
      pronunciationGuide: activeFounderAvatarProfile.pronunciationGuide,
      elevenLabsVoiceId: activeFounderAvatarProfile.elevenLabsVoiceId,
      sarvamVoiceId: activeFounderAvatarProfile.sarvamVoiceId,
      productionEnhancementEnabled: activeFounderAvatarProfile.productionEnhancementEnabled,
      productionEnhancementPrompt: activeFounderAvatarProfile.details,
      consentConfirmed: activeFounderAvatarProfile.consentConfirmed,
      language: activeFounderAvatarProfile.language,
      languageCode: activeFounderAvatarProfile.languageCode,
    });
    if (!asset) return;
    const nextProfile = normalizeFounderAvatarProfile(asset.founderAvatarProfile || asset.profile || asset);
    onFounderAvatarProfileChange?.(nextProfile);
  };

  const founderVoiceRequest = () => ({
    voiceModel: activeFounderAvatarProfile.localModels?.voiceModel,
    voiceProfileId: activeFounderAvatarProfile.voiceProfileId || activeFounderAvatarProfile.localModels?.voiceProfileId,
    providerVoiceId: activeFounderAvatarProfile.providerVoiceId,
    minimaxVoiceId: activeFounderAvatarProfile.minimaxVoiceId,
    referenceTranscript: activeFounderAvatarProfile.referenceTranscript,
    previewText: activeFounderAvatarProfile.voicePreviewText,
    captionText: activeFounderAvatarProfile.voicePreviewText,
    spokenText: activeFounderAvatarProfile.voicePreviewText,
    pronunciationGuide: activeFounderAvatarProfile.pronunciationGuide,
    elevenLabsVoiceId: activeFounderAvatarProfile.elevenLabsVoiceId,
    sarvamVoiceId: activeFounderAvatarProfile.sarvamVoiceId,
    language: activeFounderAvatarProfile.language,
    languageCode: activeFounderAvatarProfile.languageCode,
    voiceLanguage: activeFounderAvatarProfile.voiceLanguage,
    voiceLanguageCode: activeFounderAvatarProfile.voiceLanguageCode,
    referenceLanguage: activeFounderAvatarProfile.referenceLanguage,
    minimaxLanguageBoost: activeFounderAvatarProfile.minimaxLanguageBoost,
    sourceDialogueLanguage: activeFounderAvatarProfile.localModels?.voiceModel === CLIENT_RVC_VOICE_MODEL
      ? "English"
      : sourceDialogueLanguage,
  });

  const handlePrepareFounderEnglishDialogue = async () => {
    setFounderAvatarUploadError("");
    if (!activeFounderAvatarProfile.consentConfirmed) {
      setFounderAvatarUploadError("Confirm creator consent before preparing the client voice dialogue.");
      return;
    }
    const result = await onPrepareFounderEnglishDialogue?.({
      dialogueText: firstText(activeFounderAvatarProfile.avatarScript, activeFounderAvatarProfile.spokenText),
      sourceDialogueLanguage,
      voiceProfileId: activeFounderAvatarProfile.voiceProfileId || CLIENT_RVC_PROFILE_ID,
    });
    if (result) {
      onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(result));
    }
  };

  const handleFounderVoicePreview = async () => {
    setFounderAvatarUploadError("");
    if (!activeFounderAvatarProfile.consentConfirmed || !hasFounderAvatarIdentity(activeFounderAvatarProfile)) {
      setFounderAvatarUploadError("Upload a consented founder source video before generating a voice preview.");
      return;
    }
    const result = await onGenerateFounderVoicePreview?.(founderVoiceRequest());
    if (result?.founderAvatarProfile) {
      onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(result.founderAvatarProfile));
    }
  };

  const handleFinishVoiceLanguageChange = (event) => {
    const option = DIALOGUE_LANGUAGE_OPTIONS.find((candidate) => candidate.value === event.target.value)
      || DIALOGUE_LANGUAGE_OPTIONS[0];
    const accentOption = VOICE_LANGUAGE_OPTIONS.find((candidate) => (
      normalizeLanguageKey(candidate.language) === normalizeLanguageKey(option.value)
    ));
    onDialogueLanguageChange?.(option.value);
    updateFounderAvatarProfile({
      language: option.value,
      languageCode: option.languageCode,
      voiceLanguageMode: accentOption?.value || `multilingual_${option.languageCode}`,
      voiceLanguage: option.value,
      voiceLanguageCode: option.languageCode,
      minimaxLanguageBoost: accentOption?.languageBoost || option.value,
    });
  };

  const handleFounderVoiceDecision = async (decision) => {
    setFounderAvatarUploadError("");
    const result = await onFounderVoiceDecision?.(decision, {
      ...founderVoiceRequest(),
      spokenText: activeFounderAvatarProfile.spokenText,
    });
    if (result) onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(result));
  };

  const handlePrepareFounderAvatarPortrait = async (request = {}) => {
    setFounderAvatarUploadError("");
    if (!activeFounderAvatarProfile.consentConfirmed) {
      setFounderAvatarUploadError("Confirm creator consent before preparing an avatar portrait.");
      return null;
    }
    const result = await onPrepareFounderAvatarPortrait?.({
      ...request,
      consentConfirmed: activeFounderAvatarProfile.consentConfirmed,
    });
    if (result) {
      onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(
        result.founderAvatarProfile || result.profile || result
      ));
    }
    return result;
  };

  const handleGenerateFounderAvatarTest = async (request = {}) => {
    setFounderAvatarUploadError("");
    if (activeFounderAvatarProfile.voiceApprovalStatus !== "APPROVED") {
      setFounderAvatarUploadError("Approve the mastered voice preview before creating an avatar quality test.");
      return null;
    }
    const result = await onGenerateFounderAvatarTest?.({
      portraitMode: activeFounderAvatarProfile.avatarPortraitSourceMode,
      motionPrompt: activeFounderAvatarProfile.avatarMotionPrompt,
      previewText: activeFounderAvatarProfile.voicePreviewText,
      aspectRatio: firstText(screenplay?.aspectRatio, screenplay?.scriptJson?.aspectRatio, "9:16"),
      ...request,
    });
    if (result) {
      onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(
        result.founderAvatarProfile || result.profile || result
      ));
    }
    return result;
  };

  const handleFounderAvatarPreview = async () => {
    setFounderAvatarUploadError("");
    if (activeFounderAvatarProfile.voiceApprovalStatus !== "APPROVED") {
      setFounderAvatarUploadError("Approve the mastered voice preview before creating the lip-sync avatar preview.");
      return;
    }
    const result = await onGenerateFounderAvatarPreview?.({
      previewText: activeFounderAvatarProfile.voicePreviewText,
      aspectRatio: firstText(screenplay?.aspectRatio, screenplay?.scriptJson?.aspectRatio, "9:16"),
    });
    if (result?.founderAvatarProfile) {
      onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(result.founderAvatarProfile));
    }
  };

  const handleFounderAvatarDecision = async (decision) => {
    setFounderAvatarUploadError("");
    const result = await onFounderAvatarDecision?.(decision);
    if (result) onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(result));
  };

  const handleFounderFinalAudioUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFounderAvatarUploadError("");
    if (!activeFounderAvatarProfile.consentConfirmed) {
      setFounderAvatarUploadError("Confirm founder consent before uploading final audio.");
      return;
    }
    if (!String(file.type || "").startsWith("audio/") && !String(file.type || "").startsWith("video/")) {
      setFounderAvatarUploadError("Upload an audio file, or a video containing the final founder recording.");
      return;
    }
    const result = await onUploadFounderFinalAudio?.({
      file,
      captionText: activeFounderAvatarProfile.spokenText,
      consentConfirmed: activeFounderAvatarProfile.consentConfirmed,
    });
    if (result?.founderAvatarProfile) {
      onFounderAvatarProfileChange?.(normalizeFounderAvatarProfile(result.founderAvatarProfile));
    }
  };

  const handleGenerateDialogue = () => onGenerateAudioPack?.({
    audioRequestType: "dialogue",
    generateDialogue: true,
    generateVoice: true,
    forceRegenerateDialogue: false,
    musicSource: "none",
    backgroundMusicSource: "none",
    generateMusic: false,
    generateAiMusic: false,
  });

  const handlePrepareMusic = () => onGenerateAudioPack?.({
    audioRequestType: "background_music",
    generateDialogue: false,
    generateVoice: false,
    musicSource: selectedMusicSource,
    backgroundMusicSource: selectedMusicSource,
    generateMusic: selectedMusicSource === "ai_generated",
    generateAiMusic: selectedMusicSource === "ai_generated",
    musicLayerType: "background_music",
    backgroundMusicPrompt: finishingPlan.backgroundMusicPrompt,
    musicPrompt: finishingPlan.backgroundMusicPrompt,
  });

  const selectProductionTrack = (track) => {
    const productLed = track === "product";
    onVideoFinishingPlanChange?.({
      ...finishingPlan,
      imageLedAdMode: productLed,
      useStoryboardReferences: productLed ? true : finishingPlan.useStoryboardReferences,
      requireImageAnchors: productLed,
      referenceImageMode: productLed ? "product_motion_anchor" : "prompt_only",
    });
  };

  const primaryGenerationLabel = generationWorkflow === "scene_by_scene"
    ? sceneWorkspaceReady
      ? "Review scenes"
      : "Prepare scenes"
    : hasVideoRun
      ? hasRemainingSceneClips
        ? "Resume complete pipeline"
        : "Regenerate complete video"
      : "Generate complete video";

  return (
    <div className="creator-panel overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-cyan-100">
                <Film size={13} /> {providerLabel(normalizedVideoProvider)} video
              </span>
              <StatusPill status={status} />
              {screenplayApproved ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-emerald-100">
                  <CheckCircle2 size={13} /> Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-amber-100">
                  <LockKeyhole size={13} /> Needs approval
                </span>
              )}
            </div>
            <h2 className="mt-3 truncate text-xl font-black text-white">{screenplay?.title || screenplay?.scriptJson?.projectTitle || "Screenplay video"}</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Prepare, generate, review, and accept each scene before combining the final video.
            </p>
          </div>

          {!screenplayApproved && (
            <button
              type="button"
              onClick={() => {
                if (!screenplay?.scriptId) {
                  onBlockedAction?.("Generate and save the screenplay before approval.");
                  return;
                }
                onApprove?.();
              }}
              disabled={isApproving}
              aria-disabled={!screenplay?.scriptId || isApproving}
              className={`creator-control flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-50 ${
                !screenplay?.scriptId ? "opacity-50" : ""
              }`}
            >
              {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve screenplay
            </button>
          )}

        </div>
      </div>

      <PaidGenerationConfirmDialog
        action={pendingPaidAction}
        onCancel={() => setPendingPaidAction(null)}
        onConfirm={confirmPaidAction}
      />

      <section className="border-b border-white/10 p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-white">Production setup</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Scene preparation translates dialogue on the backend. It does not call a video model.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-400">
            <span>{sceneRows.length || 0} scenes</span>
            <span>{generatedCount} generated</span>
            <span>{acceptedCount} accepted</span>
            <span>{formatSeconds(totalDuration || screenplay?.durationSeconds || screenplay?.scriptJson?.duration)}</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
          <fieldset className="min-w-0">
            <legend className="mb-1 block text-[10px] font-black uppercase text-slate-500">Workflow</legend>
            <div className="grid h-10 grid-cols-2 rounded-md border border-white/10 bg-black/20 p-1">
              {[
                { value: "scene_by_scene", label: "Scene by scene" },
                { value: "complete_pipeline", label: "Complete pipeline" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGenerationWorkflow(option.value)}
                  className={`rounded px-2 text-xs font-black ${
                    generationWorkflow === option.value ? "bg-cyan-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-1 block text-[10px] font-black uppercase text-slate-500">Production type</legend>
            <div className="grid h-10 grid-cols-2 rounded-md border border-white/10 bg-black/20 p-1">
              {[
                { value: "story", label: "Story-led" },
                { value: "product", label: "Product-led" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectProductionTrack(option.value)}
                  className={`rounded px-2 text-xs font-black ${
                    (isProductLed ? "product" : "story") === option.value ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Dialogue language</span>
            <input
              type="text"
              list="screenplay-dialogue-language-options"
              value={requestedDialogueLanguage}
              onChange={(event) => onDialogueLanguageChange?.(event.target.value)}
              placeholder="Choose or type any language"
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            />
            <datalist id="screenplay-dialogue-language-options">
              {DIALOGUE_LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </datalist>
          </label>

          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Video provider</span>
            <select
              value={normalizedVideoProvider}
              onChange={(event) => {
                const nextProvider = normalizeVideoProvider(event.target.value);
                onVideoProviderChange?.(nextProvider);
                onVideoModelChange?.(defaultModelForProvider(nextProvider));
              }}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            >
              <option value="gemini_omni">Gemini Omni Flash</option>
              <option value="seedance">DalaiLlama Video</option>
              <option value="omini">Omini</option>
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Video model</span>
            <select
              value={resolvedVideoModel}
              onChange={(event) => onVideoModelChange?.(event.target.value)}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            >
              {videoModelOptions(normalizedVideoProvider).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            {isHybrid && (
              <div className="min-w-[15rem]">
                <HybridSceneModeChoice value={hybridSceneMode} onChange={onHybridSceneModeChange} />
              </div>
            )}
            <div className="text-xs font-semibold leading-5 text-slate-400">
              <p>{isProductLed ? "Image first, then video with scene sound." : "Generate directly from the screenplay; an image is optional."}</p>
              {generationWorkflow === "complete_pipeline" && dialogueTranslationPending && (
                <p className="font-bold text-amber-200">
                  {`Change every scene dialogue to ${requestedDialogueLanguageOption.label}.`}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (sceneWorkspaceAlreadyCurrent) {
                sceneWorkspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
              if (!canGenerate) {
                onBlockedAction?.(generateActionBlockedReason || "Complete the required steps before continuing.");
                return;
              }
              handleGenerateVideo();
            }}
            disabled={isGenerating || activeVideoJob}
            aria-disabled={!primaryGenerationActionAvailable}
            className={`creator-primary flex h-10 items-center justify-center gap-2 px-4 text-sm font-black text-white ${
              !primaryGenerationActionAvailable ? "opacity-60" : ""
            }`}
            title={sceneWorkspaceAlreadyCurrent
              ? "Go to the prepared scene controls."
              : generateActionBlockedReason || (
              generationWorkflow === "scene_by_scene"
                ? "Prepare translated scenes without calling the video provider."
                : `Generate all scenes with ${providerLabel(normalizedVideoProvider)} and merge the result.`
              )}
          >
            {isGenerating || activeVideoJob
              ? <Loader2 size={16} className="animate-spin" />
              : sceneWorkspaceAlreadyCurrent ? <Play size={16} /> : <Sparkles size={16} />}
            {isGenerating || activeVideoJob
              ? scenePreparationBusy ? "Preparing scenes" : "Generating video"
              : primaryGenerationLabel}
          </button>
        </div>
      </section>

      {isProductLed ? (
        <section className="border-b border-white/10">
          <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-white">Product image source</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Upload the real product or generate the planned image for each scene before video.</p>
            </div>
            {onGenerateAllSceneImages && (
              <button
                type="button"
                onClick={() => {
                  if (!scenesMissingImages.length) {
                    onBlockedAction?.("Every scene already has a generated image.");
                    return;
                  }
                  onGenerateAllSceneImages(scenesMissingImages);
                }}
                disabled={anySceneImageGenerating}
                className="creator-control flex h-10 items-center gap-2 px-3 text-xs font-black text-slate-200 disabled:opacity-50"
              >
                {anySceneImageGenerating ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                {anySceneImageGenerating ? "Generating images" : `Generate missing images (${imageReadyCount}/${sceneRows.length})`}
              </button>
            )}
          </div>
          <ReferenceImagePanel
            assets={referenceAssets}
            details={referenceDetails}
            error={referenceUploadError}
            uploading={isUploadingReferenceImage}
            onDetailsChange={setReferenceDetails}
            onUpload={handleReferenceUpload}
          />
        </section>
      ) : (
        <details className="border-b border-white/10">
          <summary className="cursor-pointer px-4 py-3 text-xs font-black text-slate-300">Optional visual references</summary>
          <ReferenceImagePanel
            assets={referenceAssets}
            details={referenceDetails}
            error={referenceUploadError}
            uploading={isUploadingReferenceImage}
            onDetailsChange={setReferenceDetails}
            onUpload={handleReferenceUpload}
          />
        </details>
      )}

      {isHybrid && (
        <details className="border-b border-white/10">
          <summary className="cursor-pointer px-4 py-3 text-sm font-black text-slate-200">
            Avatar model test
            <span className="ml-2 text-xs font-semibold text-slate-500">Upload, clone voice, and approve a short test before production</span>
          </summary>
          <div className="p-4 pt-1">
            <FounderAvatarPanel
              profile={activeFounderAvatarProfile}
              availableAvatars={availableFounderAvatars}
              selectedAvatarKey={selectedFounderAvatarKey}
              avatarLibraryLoading={founderAvatarLibraryLoading}
              selectingAvatar={isSelectingFounderAvatar}
              languageOptions={DIALOGUE_LANGUAGE_OPTIONS}
              error={founderAvatarUploadError}
              uploading={isUploadingFounderAvatarSource}
              preparingEnglishDialogue={isPreparingFounderEnglishDialogue}
              generatingPreview={isGeneratingFounderVoicePreview}
              updatingApproval={isUpdatingFounderVoiceApproval}
              preparingPortrait={isPreparingFounderAvatarPortrait}
              generatingAvatarTest={isGeneratingFounderAvatarTest}
              generatingAvatarPreview={isGeneratingFounderAvatarPreview}
              updatingAvatarApproval={isUpdatingFounderAvatarApproval}
              uploadingFinalAudio={isUploadingFounderFinalAudio}
              onChange={handleFounderAvatarChange}
              onSelectAvatar={onSelectFounderAvatar}
              onSelectAvatarBlocked={onBlockedAction}
              onUpload={handleFounderAvatarUpload}
              onUploadBlocked={() => setFounderAvatarUploadError("Confirm creator consent before selecting the source video.")}
              onPrepareEnglishDialogue={handlePrepareFounderEnglishDialogue}
              onGeneratePreview={handleFounderVoicePreview}
              onVoiceDecision={handleFounderVoiceDecision}
              onPreparePortrait={handlePrepareFounderAvatarPortrait}
              onGenerateAvatarTest={handleGenerateFounderAvatarTest}
              onGenerateAvatarPreview={handleFounderAvatarPreview}
              onAvatarDecision={handleFounderAvatarDecision}
              onUploadFinalAudio={handleFounderFinalAudioUpload}
            />
          </div>
        </details>
      )}

      <details className="border-b border-white/10">
        <summary className="cursor-pointer px-4 py-3 text-xs font-black text-slate-300">Storyboard and finishing settings</summary>
        <div className="grid gap-3 p-4 pt-1 lg:grid-cols-2">
          <StoryboardReviewChoice
            ready={storyboardReady}
            generated={storyboardGenerated}
            loading={storyboardLoading}
            useReferences={finishingPlan.useStoryboardReferences}
            onUseReferencesChange={(value) => onVideoFinishingPlanChange?.({ ...finishingPlan, useStoryboardReferences: value })}
            onOpenStoryboard={onOpenStoryboard}
            onGenerateStoryboard={onGenerateStoryboard}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStyle label="Style" value={resolvedProductionStyleLabel} />
            <MiniStyle label="B-roll" value={brollStyleLabel} />
            <MiniStyle label="Captions" value={`${captionStyleLabel}${srtArtifact?.cueCount ? ` + ${srtArtifact.cueCount} SRT cues` : ""}`} />
          </div>
          <VideoFinishingControls
            plan={finishingPlan}
            onChange={(nextPlan) => onVideoFinishingPlanChange?.(nextPlan)}
          />
        </div>
      </details>

      {(videoRunLoading || videoJob || finalRenderJob || audioJob) && (
        <div className="border-b border-white/10 p-4">
          <div className="grid gap-3 lg:grid-cols-3">
            {(videoRunLoading || videoJob) && (
              <JobMiniPanel
                label={scenePreparationBusy ? "Scene preparation" : "Video generation"}
                job={videoJob}
                isLoading={videoRunLoading || activeVideoJob}
              />
            )}
            {audioJob && <JobMiniPanel label="Audio assets" job={audioJob} isLoading={activeAudioJob} />}
            {finalRenderJob && <JobMiniPanel label="Final merge" job={finalRenderJob} isLoading={activeFinalJob} />}
          </div>
        </div>
      )}

      {(audioPackReady || activeAudioJob) && (
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-cyan-200">Audio assets</p>
              <h3 className="mt-1 text-lg font-black text-white">
                {audioPackReady ? audioPanelTitle : "Preparing audio assets"}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">Dialogue voice and background music run separately</span>
          </div>
          {audioAssets.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {audioAssets.map((asset, index) => (
                <AudioAssetCard key={`${asset.assetUrl || asset.signedUrl || index}`} asset={asset} onRefresh={refreshMediaUrl} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm font-semibold text-slate-400">
              Dialogue voice files and AI background music files appear here separately after generation.
            </div>
          )}
          {musicSelectionPlan?.status && <FreeMusicSelectionPanel plan={musicSelectionPlan} />}
        </div>
      )}

      {finalVideoVariants.length > 0 && (
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-emerald-200">Complete video previews</p>
              <h3 className="mt-1 text-lg font-black text-white">Accepted scenes combined into one final video</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {formatSeconds(totalDuration || screenplay?.durationSeconds || screenplay?.scriptJson?.duration)}
            </span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {finalVideoVariants.map((variant, index) => (
              <div key={`${variant.audioVariant || "final"}-${variant.url}`} className="overflow-hidden rounded-lg border border-emerald-300/20 bg-black/30">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <p className="text-xs font-black uppercase tracking-normal text-emerald-100">{finalAudioVariantLabel(variant.audioVariant)}</p>
                  <span className="text-[11px] font-semibold text-slate-400">{variant.description}</span>
                </div>
                <video
                  src={variant.url}
                  controls
                  onError={() => refreshMediaUrl(variant.url)}
                  className={`${videoPlayerFrameClass(videoAspectRatio(variant, videoRun, screenplay))} bg-black object-contain`}
                />
                <div className="grid grid-cols-2 gap-2 p-3">
                  <a
                    href={variant.url}
                    download={finalVariantFilename(finalFilename, variant.audioVariant, index)}
                    className="creator-primary flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white"
                  >
                    <Download size={15} /> Download
                  </a>
                  <a
                    href={variant.url}
                    target="_blank"
                    rel="noreferrer"
                    className="creator-control flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200"
                  >
                    <Play size={15} /> Preview
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {srtDownloadHref && (
              <a
                href={srtDownloadHref}
                download={srtArtifact.filename || "generated.srt"}
                className="creator-control inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-200"
              >
                <Download size={16} /> Download SRT
              </a>
            )}
          </div>
          <EditorHandoffPanel
            order={editingWorkOrder}
            finalUrl={finalUrl}
            editorBrief={editorBrief}
            revisionDraft={editorRevisionDraft}
            isSubmitting={isSubmittingEditingJob}
            isApproving={isApprovingEditingJob}
            isRequestingChanges={isRequestingEditingChanges}
            onBriefChange={setEditorBrief}
            onRevisionChange={setEditorRevisionDraft}
            onSubmit={() => onSubmitEditingJob?.({ requesterNotes: editorBrief })}
            onApprove={() => onApproveEditingJob?.(editingWorkOrder)}
            onRequestChanges={async () => {
              await onRequestEditingChanges?.(editingWorkOrder, editorRevisionDraft);
              setEditorRevisionDraft("");
            }}
          />
        </div>
      )}

      {Boolean(screenplay?.scriptId) && (
        <section className="border-b border-white/10 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-black text-white">Finish production</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Accept the generated scenes, prepare optional voice or music layers, then combine the video.
              </p>
            </div>
            {hasVideoRun && <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!generatedCount) {
                    onBlockedAction?.("Generate at least one scene before accepting clips.");
                    return;
                  }
                  handleAcceptAllReady();
                }}
                disabled={isFinalRendering || activeFinalJob}
                aria-disabled={!generatedCount || acceptedCount >= generatedCount}
                className={`creator-control flex h-10 items-center gap-2 px-3 text-xs font-black text-slate-200 ${
                  !generatedCount || acceptedCount >= generatedCount ? "opacity-60" : ""
                }`}
              >
                <CheckCircle2 size={15} /> Accept ready scenes
              </button>
              <label className="min-w-[10rem]">
                <span className="sr-only">Background music source</span>
                <select
                  value={selectedMusicSource}
                  onChange={(event) => setMusicSource(normalizeMusicSource(event.target.value))}
                  disabled={isGeneratingAudio || activeAudioJob}
                  className="creator-input h-10 w-full px-3 text-xs font-bold"
                  title="Choose the background music source"
                >
                  <option value="free_licensed">Free music</option>
                  <option value="ai_generated">AI music</option>
                  <option value="none">No music</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleGenerateDialogue}
                disabled={!canGenerateAudio}
                className="creator-control flex h-10 items-center gap-2 px-3 text-xs font-black text-slate-200 disabled:opacity-50"
                title={`Generate or sync dialogue with ${dialogueVoiceServiceLabel}`}
              >
                {isGeneratingAudio || activeAudioJob ? <Loader2 size={15} className="animate-spin" /> : <Volume2 size={15} />}
                {hasDialogueAudio ? "Sync voice" : "Generate voice"}
              </button>
              <button
                type="button"
                onClick={handlePrepareMusic}
                disabled={!canGenerateAudio}
                className="creator-control flex h-10 items-center gap-2 px-3 text-xs font-black text-slate-200 disabled:opacity-50"
              >
                {isGeneratingAudio || activeAudioJob ? <Loader2 size={15} className="animate-spin" /> : <Music2 size={15} />}
                {selectedMusicSource === "ai_generated" ? "Generate music" : selectedMusicSource === "none" ? "Skip music" : "Plan music"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canFinalRender) {
                    onBlockedAction?.(finalRenderBlockedReason);
                    return;
                  }
                  handleFinalRender();
                }}
                disabled={isFinalRendering || activeFinalJob}
                aria-disabled={!canFinalRender}
                className={`creator-primary flex h-10 items-center gap-2 px-4 text-xs font-black text-white ${
                  !canFinalRender ? "opacity-60" : ""
                }`}
                title={finalRenderBlockedReason}
              >
                {isFinalRendering || activeFinalJob ? <Loader2 size={15} className="animate-spin" /> : <Clapperboard size={15} />}
                Combine video
              </button>
            </div>}
          </div>
          {showFinishAvatarControls && (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(13rem,0.7fr)_minmax(15rem,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black text-white">Avatar scenes</p>
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase ${
                    founderVoiceCloneApproved
                      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                      : founderVoiceCloneCreated
                        ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                        : "border-amber-300/25 bg-amber-400/10 text-amber-100"
                  }`}>
                    {founderVoiceCloneApproved ? "Voice ready" : founderVoiceCloneCreated ? "Approve clone" : "Clone required"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">
                  {plannedAvatarSceneCount
                    ? `${plannedAvatarSceneCount} avatar scene${plannedAvatarSceneCount === 1 ? "" : "s"} planned.`
                    : "Speaking scenes will use the approved avatar and cloned voice."}
                  {" "}{remainingSceneRows.length} scene{remainingSceneRows.length === 1 ? "" : "s"} remaining.
                </p>
              </div>

              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Dialogue and clone language</span>
                <select
                  value={finishVoiceLanguageOption.value}
                  onChange={handleFinishVoiceLanguageChange}
                  disabled={isGeneratingFounderVoicePreview || isGenerating || Boolean(activeVideoJob)}
                  className="creator-input h-10 w-full px-3 text-xs font-bold disabled:opacity-50"
                >
                  {DIALOGUE_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <div className="min-w-0">
                {clonedVoicePreviewUrl ? (
                  <>
                    <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Cloned voice</span>
                    <audio
                      controls
                      preload="metadata"
                      src={clonedVoicePreviewUrl}
                      onError={() => refreshMediaUrl(clonedVoicePreviewUrl)}
                      className="h-10 w-full"
                    />
                  </>
                ) : (
                  <p className="text-xs font-semibold leading-5 text-slate-400">
                    {hasFounderAvatarIdentity(activeFounderAvatarProfile)
                      ? `Create a ${finishVoiceLanguageOption.label} preview from the uploaded creator video.`
                      : "Upload a consented creator video to extract and clone the voice."}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {!activeFounderAvatarProfile.consentConfirmed && (
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(event) => updateFounderAvatarProfile({ consentConfirmed: event.target.checked })}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    Creator consent
                  </label>
                )}
                {!hasFounderAvatarIdentity(activeFounderAvatarProfile) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeFounderAvatarProfile.consentConfirmed) {
                        onBlockedAction?.("Confirm creator consent before uploading the source video.");
                        return;
                      }
                      finishAvatarSourceInputRef.current?.click();
                    }}
                    disabled={isUploadingFounderAvatarSource}
                    className="creator-control flex h-10 items-center gap-2 px-3 text-xs font-black text-slate-200 disabled:opacity-50"
                  >
                    {isUploadingFounderAvatarSource ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    Upload creator video
                  </button>
                )}
                {!founderVoiceCloneApproved && founderVoiceStatus !== "PREVIEW_READY" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeFounderAvatarProfile.consentConfirmed || !hasFounderAvatarIdentity(activeFounderAvatarProfile)) {
                        onBlockedAction?.("Confirm consent and upload the creator video before cloning voice.");
                        return;
                      }
                      handleFounderVoicePreview();
                    }}
                    disabled={isGeneratingFounderVoicePreview}
                    className="creator-primary flex h-10 items-center gap-2 px-3 text-xs font-black text-white disabled:opacity-50"
                  >
                    {isGeneratingFounderVoicePreview || founderVoiceStatus === "GENERATING"
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Sparkles size={15} />}
                    Create voice clone
                  </button>
                )}
                {!founderVoiceCloneApproved && founderVoiceStatus === "PREVIEW_READY" && (
                  <button
                    type="button"
                    onClick={() => handleFounderVoiceDecision("APPROVE")}
                    disabled={isUpdatingFounderVoiceApproval}
                    className="creator-primary flex h-10 items-center gap-2 px-3 text-xs font-black text-white disabled:opacity-50"
                  >
                    {isUpdatingFounderVoiceApproval
                      ? <Loader2 size={15} className="animate-spin" />
                      : <CheckCircle2 size={15} />}
                    Approve voice
                  </button>
                )}
                {founderVoiceCloneApproved && (
                  <button
                    type="button"
                    onClick={handleFinishAvatarVideo}
                    disabled={isGenerating || Boolean(activeVideoJob) || anySceneWorking}
                    aria-disabled={Boolean(finishAvatarGenerationBlockedReason)}
                    title={finishAvatarGenerationBlockedReason || "Generate all remaining scenes and combine the complete video"}
                    className={`creator-primary flex h-10 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50 ${
                      finishAvatarGenerationBlockedReason ? "opacity-60" : ""
                    }`}
                  >
                    {completePipelineBusy
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Clapperboard size={15} />}
                    Generate complete video
                  </button>
                )}
                <input
                  ref={finishAvatarSourceInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.mpeg,.mpg"
                  onChange={handleFounderAvatarUpload}
                  className="sr-only"
                />
              </div>
              {founderAvatarUploadError && (
                <p role="alert" className="text-xs font-bold text-rose-200 lg:col-span-4">{founderAvatarUploadError}</p>
              )}
            </div>
          )}
        </section>
      )}

      {!screenplay?.scriptId && (
        <div className="p-4">
          <div className="rounded-lg border border-amber-300/20 bg-amber-400/[0.045] p-4">
            <p className="text-sm font-bold text-amber-100">Generate a screenplay before video generation.</p>
            <button type="button" onClick={onOpenScreenplay} className="creator-control mt-3 px-4 py-2 text-sm font-bold text-slate-200">
              Open screenplay
            </button>
          </div>
        </div>
      )}

      {Boolean(screenplay?.scriptId) && (
        <div ref={sceneWorkspaceRef} className="scroll-mt-4 space-y-3 p-4">
          {sceneRows.length ? sceneRows.map((scene, index) => {
            const draft = sceneDrafts[scene.id] || "";
            const videoPrompt = videoPromptDrafts[scene.id] ?? videoPromptForScene(scene);
            const imagePrompt = sceneImagePromptDrafts[scene.id] ?? productionImagePromptForScene(scene, isProductLed);
            const sceneSound = sceneSoundDrafts[scene.id] ?? soundPromptForScene(scene);
            const currentSceneDialogue = dialogueForScene(scene);
            const displayGenerationMode = resolvedSceneMode(scene, sceneModeOverrides, productionStyle, hybridSceneMode);
            const isAvatarScene = String(displayGenerationMode || "").toLowerCase().includes("talking");
            const sceneDialogueOptions = dialogueLanguageOptionsForScene(scene);
            const selectedSceneDialogueLanguage = dialogueLanguageOptionFor(
              firstText(
                sceneDialogueLanguages[scene.id],
                isAvatarScene ? scene.dialogueCloneLanguage : "",
                scene.dialogueLanguage,
                requestedDialogueLanguageOption.value
              ),
              firstText(
                isAvatarScene ? scene.dialogueCloneLanguageCode : "",
                scene.languageCode,
                requestedDialogueLanguageOption.languageCode
              ),
              sceneDialogueOptions
            );
            const sceneDialogue = firstText(
              selectedSceneDialogueLanguage.dialogueText,
              scene.sourceDialogueScript,
              scene.source_dialogue_script,
              currentSceneDialogue
            );
            const selectedSceneVoiceMethod = sceneVoiceMethodOptionFor(firstText(
              sceneVoiceMethods[scene.id],
              scene.dialogueCloneVoiceModel,
              scene.dialogueCloneMethod,
              activeFounderAvatarProfile.localModels?.voiceModel
            ));
            const sceneLanguageTranslationPending = !selectedSceneDialogueLanguage.available
              && normalizeLanguageKey(
                firstText(scene.sourceDialogueLanguage, sourceDialogueLanguage)
              ) !== normalizeLanguageKey(selectedSceneDialogueLanguage.value);
            const sceneCloneStatus = statusValue(scene.dialogueCloneStatus || "NOT_REQUESTED");
            const sceneCloneAudioUrl = sceneDialogueAudioUrl(scene);
            const sceneCloneVoiceMethod = firstText(
              scene.dialogueCloneVoiceModel,
              scene.dialogueCloneMethod,
              sceneDialogueAudioAsset(scene).metadata?.voiceModel
            );
            const sceneCloneMatchesSelection = Boolean(sceneCloneAudioUrl)
              && normalizedDialogueText(scene.dialogueCloneText) === normalizedDialogueText(sceneDialogue)
              && normalizeLanguageKey(scene.dialogueCloneLanguage) === normalizeLanguageKey(selectedSceneDialogueLanguage.value)
              && sceneCloneVoiceMethod === selectedSceneVoiceMethod.value;
            const sceneCloneAccepted = sceneCloneStatus === "APPROVED" && sceneCloneMatchesSelection;
            const sceneClonePreviewReady = sceneCloneStatus === "PREVIEW_READY" && sceneCloneMatchesSelection;
            const sceneVoiceBusy = Boolean(sceneVoiceWorking[scene.id]);
            const anotherSceneVoiceBusy = Boolean(activeSceneVoiceId && activeSceneVoiceId !== scene.id);
            const sceneVoiceDecisionBusy = Boolean(sceneVoiceDecisionWorking[scene.id]);
            const scenePortraitBusy = Boolean(scenePortraitUploading[scene.id]);
            const scenePortraitAsset = sceneAvatarPortraitAsset(scene);
            const scenePortraitUrl = firstText(
              sceneAvatarPortraitUrl(scene),
              activeFounderAvatarProfile.avatarPortraitUrl,
              activeFounderAvatarProfile.avatarPortraitAsset?.assetUrl,
              activeFounderAvatarProfile.avatarPortraitAsset?.signedUrl,
              activeFounderAvatarProfile.avatarPortraitAsset?.publicUrl
            );
            const sourceSceneDialogue = firstText(scene.sourceDialogueScript, scene.source_dialogue_script);
            const sceneDialogueWasLocalized = Boolean(
              sourceSceneDialogue
              && sceneDialogue
              && sourceSceneDialogue.trim() !== sceneDialogue.trim()
            );
            const productionImageUrl = sceneProductionImageUrl(scene);
            const uploadedSceneImageAsset = firstObject(sceneUploadedImageAssets[scene.id]);
            const uploadedSceneImageUrl = mediaUrlFromAsset(uploadedSceneImageAsset);
            const generatedSceneImageAsset = firstObject(
              uploadedSceneImageAsset,
              productSceneFrameAsset(scene)
            );
            const generatedSceneImageUrl = firstText(
              uploadedSceneImageUrl,
              productionImageUrl,
              mediaUrlFromAsset(generatedSceneImageAsset)
            );
            const canonicalProductImageAssets = referenceAssets.map((asset) => ({
              ...asset,
              referenceRole: "canonical_product_reference",
              assetRole: "canonical_product_reference",
            }));
            const canonicalProductImageUrls = canonicalProductReferenceUrls(videoRun, screenplay, canonicalProductImageAssets);
            const canonicalProductImageReady = Boolean(canonicalProductImageAssets.length || canonicalProductImageUrls.length);
            const imageUrl = isProductLed
              ? firstText(generatedSceneImageUrl, canonicalProductImageUrls[0])
              : firstText(generatedSceneImageUrl, sceneImageUrl(scene), canonicalProductImageUrls[0]);
            const imageBusy = Boolean(isGeneratingSceneImage?.(scene));
            const imageUploading = Boolean(sceneProductionImageUploading[scene.id]);
            const sceneBusy = Boolean(isSceneWorking?.(scene)) || ["GENERATING", "RUNNING", "PROCESSING", "RENDERING"].includes(statusValue(scene.status));
            const otherSceneBusy = anySceneWorking && !sceneBusy;
            const sceneTypeLabel = isAvatarScene ? "Avatar scene" : isProductLed ? "Product scene" : "Story scene";
            const selectedAiProvider = aiSceneProvider(firstText(
              sceneAiProviders[scene.id],
              scene.provider,
              scene.targetProvider,
              normalizedVideoProvider
            ));
            const selectedAiModel = defaultModelForProvider(selectedAiProvider);
            const effectiveSceneImageAsset = firstObject(
              generatedSceneImageAsset,
              isProductLed ? {} : canonicalProductImageAssets[0]
            );
            const effectiveSceneImageUrl = firstText(
              generatedSceneImageUrl,
              isProductLed ? "" : mediaUrlFromAsset(effectiveSceneImageAsset)
            );
            const productImageReady = Boolean(generatedSceneImageUrl && canonicalProductImageReady);
            const seedanceReferenceImageAssets = mergeReferenceAssets(
              Object.keys(generatedSceneImageAsset).length ? [generatedSceneImageAsset] : [],
              canonicalProductImageAssets
            );
            const seedanceReferenceImageUrls = uniqueTextValues(
              generatedSceneImageUrl,
              canonicalProductImageUrls
            );
            const aiGenerationOverrides = {
              generationMode: "ai_generated",
              provider: selectedAiProvider,
              model: selectedAiModel,
              dialogueLanguage: selectedSceneDialogueLanguage.value,
              language: selectedSceneDialogueLanguage.value,
              languageCode: selectedSceneDialogueLanguage.languageCode,
              sourceDialogueLanguage: firstText(scene.sourceDialogueLanguage, sourceDialogueLanguage),
              autoTranslateDialogue: normalizeLanguageKey(selectedSceneDialogueLanguage.value)
                !== normalizeLanguageKey(firstText(scene.dialogueLanguage, scene.sourceDialogueLanguage, sourceDialogueLanguage)),
              imagePrompt,
              productImagePrompt: imagePrompt,
              productLed: isProductLed,
              referenceImageMode: isProductLed
                ? "product_cgi_multi_reference"
                : effectiveSceneImageUrl
                  ? "use_when_available"
                  : "prompt_only",
              requireReferenceImage: Boolean(isProductLed),
              seedanceReferenceToVideo: Boolean(isProductLed && productImageReady),
              seedanceReferenceMode: isProductLed ? "product_cgi_multi_reference" : undefined,
              canonicalProductImageAssets,
              canonicalProductImageUrls,
              generatedProductImageAssets: Object.keys(generatedSceneImageAsset).length ? [generatedSceneImageAsset] : [],
              generatedProductImageUrl: generatedSceneImageUrl,
              seedanceReferenceImageAssets,
              seedanceReferenceImageUrls,
              ...(isProductLed
                ? {
                    productImageAssets: canonicalProductImageAssets,
                    referenceImageAssets: seedanceReferenceImageAssets,
                  }
                : Object.keys(effectiveSceneImageAsset).length
                  ? {
                      productImageAssets: [effectiveSceneImageAsset],
                      referenceImageAssets: [effectiveSceneImageAsset],
                    }
                  : {}),
              ...(isProductLed && canonicalProductImageUrls[0]
                ? {
                    productImageUrl: canonicalProductImageUrls[0],
                    referenceImageUrl: generatedSceneImageUrl,
                    referenceImageUrls: seedanceReferenceImageUrls,
                  }
                : effectiveSceneImageUrl
                  ? {
                      productImageUrl: effectiveSceneImageUrl,
                      referenceImageUrl: effectiveSceneImageUrl,
                    }
                : {}),
            };
            const sceneClipReady = hasGeneratedSceneClip(scene);
            const sceneAccepted = isSceneAccepted(scene, acceptedClipKeys, videoRun);
            const shotCharge = shotChargeForScene(scene, index, billingLineItems);
            const cloneDialogueBlockedReason = !hasVideoRun
              ? "Prepare the video run before cloning this scene dialogue."
              : !screenplayApproved
                ? "Approve the screenplay before cloning this scene dialogue."
                : !sceneDialogue
                  ? "Add dialogue to this scene before cloning its voice."
                  : !activeFounderAvatarProfile.consentConfirmed
                    ? "Confirm creator consent in Finish production before cloning scene dialogue."
                  : !hasFounderAvatarIdentity(activeFounderAvatarProfile)
                      ? "Upload or select a creator profile before cloning scene dialogue."
                      : anotherSceneVoiceBusy
                        ? "Wait for the current scene voice cloning process to complete."
                      : selectedSceneVoiceMethod.value === CLIENT_RVC_VOICE_MODEL
                          && normalizeLanguageKey(selectedSceneDialogueLanguage.value) !== "english"
                        ? "The trained client voice supports English only. Choose English or another clone method."
                        : selectedSceneVoiceMethod.requires
                            && !firstText(activeFounderAvatarProfile[selectedSceneVoiceMethod.requires])
                          ? `${selectedSceneVoiceMethod.label} requires an existing approved voice ID.`
                    : sceneBusy || otherSceneBusy
                      ? "Wait for the current scene generation to finish."
                      : "";
            const createAvatarBlockedReason = !hasVideoRun
              ? "Prepare the video run before creating this avatar."
              : !screenplayApproved
                ? "Approve the screenplay before creating this avatar."
                : !sceneCloneAccepted
                    ? "First clone and accept this scene dialogue using the selected language and voice method."
                    : !scenePortraitUrl && !hasFounderAvatarIdentity(activeFounderAvatarProfile)
                      ? "Upload an avatar image for this scene first."
                      : sceneBusy || imageBusy || otherSceneBusy
                        ? "Wait for the current scene generation to finish."
                        : "";
            const shotActionBlockedReason = !hasVideoRun
              ? "Prepare the video run before generating shots."
              : !screenplayApproved
                ? "Approve the screenplay before generating this shot."
                : generationWorkflow === "complete_pipeline" && workspaceLanguageNeedsRefresh
                  ? `Change the scene dialogue to ${requestedDialogueLanguageOption.label} before generating video.`
                : isProductLed && !canonicalProductImageReady
                  ? "Attach the original product reference before generating this CGI product shot."
                : isProductLed && !generatedSceneImageUrl
                  ? "Generate or upload this shot's CGI product frame before creating its Seedance video."
                  : isAvatarScene && !hasFounderAvatarIdentity(activeFounderAvatarProfile)
                    ? "Create or select an approved avatar before generating this avatar scene."
                    : isAvatarScene && activeFounderAvatarProfile.voiceApprovalStatus !== "APPROVED"
                      ? "Approve the cloned voice before generating this avatar scene."
                : otherSceneBusy
                  ? "Another shot is generating. Wait for it to finish."
                  : "";
            return (
              <div key={scene.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.42fr)]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] font-black uppercase text-slate-300">
                        Shot {scene.sceneNumber || index + 1}
                      </span>
                      <StatusPill status={scene.status} />
                      <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-400">
                        {formatSeconds(scene.durationSeconds)}
                      </span>
                      {shotCharge > 0 && (
                        <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
                          Charged {formatInr(shotCharge)}
                        </span>
                      )}
                      {displayGenerationMode && (
                        <span className="rounded-md border border-purple-300/20 bg-purple-400/10 px-2 py-1 text-[11px] font-bold text-purple-100">
                          {sceneTypeLabel}
                        </span>
                      )}
                      {scene.shotType && (
                        <span className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-bold text-cyan-100">
                          {scene.shotType}
                        </span>
                      )}
                      {sceneAccepted && (
                        <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
                          Accepted
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-black text-white">{scene.title}</h3>
                    <p className="mt-1 line-clamp-3 text-sm font-semibold leading-6 text-slate-400">
                      {scene.imagePrompt || scene.storyboardImagePrompt || scene.action || scene.purpose || "Scene prompt is pending."}
                    </p>
                    {scene.operationId && (
                      <p className="mt-2 truncate text-[11px] font-semibold text-slate-500">Provider task: {scene.operationId}</p>
                    )}
                    {isHybrid && !isFullFounder && (
                      <SceneModePicker
                        value={sceneModeOverrides[scene.id] || scene.generationMode || "auto"}
                        onChange={(mode) => handleModeChange(scene, mode)}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    {clipVideoUrl(scene) ? (
                      <video
                        src={clipVideoUrl(scene)}
                        controls
                        onError={() => refreshMediaUrl(clipVideoUrl(scene))}
                        className={`${videoPlayerFrameClass(videoAspectRatio(scene, videoRun, screenplay))} rounded-lg bg-black object-contain`}
                      />
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${scene.title || `Shot ${scene.sceneNumber || index + 1}`} image anchor`}
                        onError={() => refreshMediaUrl(imageUrl)}
                        className={`${videoPlayerFrameClass(videoAspectRatio(scene, videoRun, screenplay))} rounded-lg bg-black object-contain`}
                      />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/25">
                        <div className="text-center">
                          <Play size={22} className="mx-auto text-slate-500" />
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            {sceneBusy ? "Generating this shot" : statusValue(scene.status) === "QUEUED" ? "Waiting for the prior shot" : scene.status || "Not generated"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-cyan-300/15 bg-cyan-400/[0.045] px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-cyan-200">
                      Dialogue - {selectedSceneDialogueLanguage.label}
                    </span>
                    {sceneLanguageTranslationPending && (
                      <span className="text-[10px] font-black text-amber-200">
                        {isAvatarScene ? "Will translate before voice cloning" : "Will translate before video generation"}
                      </span>
                    )}
                    {!sceneLanguageTranslationPending
                      && generationWorkflow === "complete_pipeline"
                      && dialogueTranslationPending && (
                      <span className="text-[10px] font-black text-amber-200">
                        {hasVideoRun
                          ? `Pending change to ${requestedDialogueLanguageOption.label}`
                          : `Translated to ${requestedDialogueLanguageOption.label} during scene preparation`}
                      </span>
                    )}
                    {!dialogueTranslationPending && sceneDialogueWasLocalized && (
                      <span className="text-[10px] font-black text-emerald-200">Translated</span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-200">
                    {sceneDialogue || "No spoken dialogue in this scene."}
                  </p>
                  {sceneDialogueWasLocalized && (
                    <details className="mt-2 border-t border-white/10 pt-2">
                      <summary className="cursor-pointer text-[10px] font-black uppercase text-slate-500">Original dialogue</summary>
                      <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-400">
                        {sourceSceneDialogue}
                      </p>
                    </details>
                  )}
                </div>

                {isAvatarScene && (
                <div className="mt-3 border-y border-white/10 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase text-cyan-200">Avatar dialogue</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Clone, review, and accept this scene before creating its avatar.
                      </p>
                    </div>
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase ${
                      sceneCloneAccepted
                        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                        : sceneClonePreviewReady
                          ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
                          : "border-white/10 bg-white/[0.035] text-slate-400"
                    }`}>
                      {sceneCloneAccepted
                        ? "Dialogue accepted"
                        : sceneClonePreviewReady
                          ? "Ready to review"
                          : sceneCloneStatus === "APPROVED"
                            ? "Language changed"
                            : "Clone required"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(9rem,0.7fr)_minmax(12rem,1fr)_auto_auto_auto]">
                    <label className="min-w-0">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Dialogue language</span>
                      <select
                        value={selectedSceneDialogueLanguage.value}
                        onChange={(event) => {
                          setSceneDialogueLanguages((current) => ({ ...current, [scene.id]: event.target.value }));
                          handleModeChange(scene, "talking_head");
                        }}
                        disabled={sceneVoiceBusy || sceneVoiceDecisionBusy || sceneBusy || anotherSceneVoiceBusy}
                        className="creator-input h-11 w-full px-3 text-xs font-bold"
                        title="Choose the language for this scene dialogue and cloned voice."
                      >
                        {sceneDialogueOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="min-w-0">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Voice clone method</span>
                      <select
                        value={selectedSceneVoiceMethod.value}
                        onChange={(event) => {
                          setSceneVoiceMethods((current) => ({ ...current, [scene.id]: event.target.value }));
                          handleModeChange(scene, "talking_head");
                        }}
                        disabled={sceneVoiceBusy || sceneVoiceDecisionBusy || sceneBusy || anotherSceneVoiceBusy}
                        className="creator-input h-11 w-full px-3 text-xs font-bold"
                        title="The exact selected method will generate this scene voice."
                      >
                        {SCENE_VOICE_METHOD_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={Boolean(option.requires && !firstText(activeFounderAvatarProfile[option.requires]))}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (cloneDialogueBlockedReason) {
                          onBlockedAction?.(cloneDialogueBlockedReason);
                          return;
                        }
                        handleCloneSceneDialogue(scene, selectedSceneDialogueLanguage, selectedSceneVoiceMethod);
                      }}
                      disabled={sceneVoiceBusy || sceneVoiceDecisionBusy || anotherSceneVoiceBusy}
                      aria-disabled={Boolean(cloneDialogueBlockedReason)}
                      className={`creator-control mt-auto flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-100 disabled:opacity-50 ${
                        cloneDialogueBlockedReason ? "opacity-60" : ""
                      }`}
                      title={cloneDialogueBlockedReason || (sceneCloneAudioUrl ? "Generate a fresh clone for this scene dialogue." : "Clone this scene dialogue.")}
                    >
                      {sceneVoiceBusy ? <Loader2 size={15} className="animate-spin" /> : <Volume2 size={15} />}
                      {sceneVoiceBusy ? "Cloning" : sceneCloneAudioUrl ? "Clone again" : "Clone voice"}
                    </button>

                    <label
                      className={`creator-control mt-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-100 ${
                        scenePortraitBusy || !hasVideoRun ? "cursor-not-allowed opacity-60" : ""
                      }`}
                      title={!hasVideoRun
                        ? "Prepare the video run before uploading an avatar image."
                        : scenePortraitUrl
                          ? "Replace the avatar image for this scene."
                          : "Upload an avatar image for this scene."}
                    >
                      {scenePortraitBusy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {scenePortraitBusy ? "Uploading" : scenePortraitUrl ? "Replace image" : "Upload image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        disabled={scenePortraitBusy || !hasVideoRun}
                        onChange={(event) => handleSceneAvatarImageUpload(scene, event)}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (createAvatarBlockedReason) {
                          onBlockedAction?.(createAvatarBlockedReason);
                          return;
                        }
                        handleModeChange(scene, "talking_head");
                        handleRegenerateScene(scene, {
                          generationMode: "talking_head",
                          provider: "dalai_llama",
                          model: selectedTalkingAvatarModel,
                          talkingAvatarModel: selectedTalkingAvatarModel,
                          dialogueLanguage: selectedSceneDialogueLanguage.value,
                          language: selectedSceneDialogueLanguage.value,
                          languageCode: selectedSceneDialogueLanguage.languageCode,
                          dialogueRecordId: selectedSceneDialogueLanguage.dialogueRecordId || "",
                          rootDialogueId: selectedSceneDialogueLanguage.rootDialogueId || "",
                          voiceModel: selectedSceneVoiceMethod.value,
                          localVoiceModel: selectedSceneVoiceMethod.value,
                          voiceCloneMethod: selectedSceneVoiceMethod.value,
                          localModels: {
                            ...activeFounderAvatarProfile.localModels,
                            voiceModel: selectedSceneVoiceMethod.value,
                          },
                          requireApprovedSceneDialogue: true,
                          ...(Object.keys(scenePortraitAsset).length ? { avatarPortraitAsset: scenePortraitAsset } : {}),
                        });
                      }}
                      disabled={sceneBusy || sceneVoiceBusy || sceneVoiceDecisionBusy || scenePortraitBusy}
                      aria-disabled={Boolean(createAvatarBlockedReason)}
                      className={`creator-primary mt-auto flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs font-black text-white disabled:opacity-50 ${
                        createAvatarBlockedReason ? "opacity-60" : ""
                      }`}
                      title={createAvatarBlockedReason || (sceneClipReady ? "Create a fresh avatar video for this scene." : "Create the avatar video for this scene.")}
                    >
                      {sceneBusy ? <Loader2 size={15} className="animate-spin" /> : <Clapperboard size={15} />}
                      {sceneBusy ? "Creating avatar" : sceneClipReady && isAvatarScene ? "Recreate avatar" : "Create avatar"}
                    </button>
                  </div>

                  {anotherSceneVoiceBusy && (
                    <p className="mt-2 text-xs font-bold text-amber-200">
                      Wait for the current scene voice cloning process to complete.
                    </p>
                  )}

                  {scene.dialogueCloneError && sceneCloneStatus === "FAILED" && (
                    <p role="alert" className="mt-2 text-xs font-bold text-rose-200">
                      {scene.dialogueCloneError}
                    </p>
                  )}

                  {(sceneCloneAudioUrl || scenePortraitUrl) && (
                    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        {sceneCloneAudioUrl && (
                          <audio
                            controls
                            preload="metadata"
                            src={sceneCloneAudioUrl}
                            onError={() => refreshMediaUrl(sceneCloneAudioUrl)}
                            className="h-10 w-full"
                          />
                        )}
                        {!sceneCloneMatchesSelection && sceneCloneAudioUrl && (
                          <p className="mt-1 text-[11px] font-bold text-amber-200">
                            This preview belongs to different dialogue, language, or clone method. Clone the current selection before creating the avatar.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {scenePortraitUrl && (
                          <img
                            src={scenePortraitUrl}
                            alt={`Avatar for ${scene.title || `scene ${scene.sceneNumber || index + 1}`}`}
                            onError={() => refreshMediaUrl(scenePortraitUrl)}
                            className="h-10 w-10 rounded-md border border-white/10 bg-black object-cover"
                          />
                        )}
                        {sceneCloneAccepted ? (
                          <span className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-black text-emerald-100">
                            <CheckCircle2 size={15} /> Accepted
                          </span>
                        ) : sceneCloneAudioUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!sceneClonePreviewReady) {
                                onBlockedAction?.("Clone the current dialogue and language before accepting it.");
                                return;
                              }
                              handleSceneVoiceDecision(scene, "APPROVE");
                            }}
                            disabled={sceneVoiceDecisionBusy || sceneVoiceBusy}
                            aria-disabled={!sceneClonePreviewReady}
                            className={`creator-primary flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-xs font-black text-white disabled:opacity-50 ${
                              !sceneClonePreviewReady ? "opacity-60" : ""
                            }`}
                            title={sceneClonePreviewReady
                              ? "Accept this cloned dialogue for avatar generation."
                              : "Clone the current dialogue and language before accepting it."}
                          >
                            {sceneVoiceDecisionBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            {sceneVoiceDecisionBusy ? "Accepting" : "Accept dialogue"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
                )}

                {!isAvatarScene && (
                  <div className="mt-3 border-y border-white/10 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase text-cyan-200">AI scene</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Choose the spoken language and video model, then upload or generate the final image anchor.
                        </p>
                      </div>
                      <span className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-black uppercase text-slate-300">
                        {selectedAiProvider === "seedance" && effectiveSceneImageUrl ? "Seedance image to video" : providerLabel(selectedAiProvider)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Dialogue language</span>
                        <input
                          type="text"
                          list={`ai-scene-dialogue-languages-${index}`}
                          value={selectedSceneDialogueLanguage.value}
                          onChange={(event) => {
                            setSceneDialogueLanguages((current) => ({ ...current, [scene.id]: event.target.value }));
                            handleModeChange(scene, "ai_generated");
                          }}
                          disabled={sceneBusy || otherSceneBusy}
                          className="creator-input h-11 w-full px-3 text-xs font-bold"
                          placeholder="Choose or type any language"
                          title="Choose or type a language. The dialogue is translated before this AI scene is submitted."
                        />
                        <datalist id={`ai-scene-dialogue-languages-${index}`}>
                          {DIALOGUE_LANGUAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </datalist>
                      </label>

                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Video model</span>
                        <select
                          value={selectedAiProvider}
                          onChange={(event) => {
                            setSceneAiProviders((current) => ({ ...current, [scene.id]: aiSceneProvider(event.target.value) }));
                            handleModeChange(scene, "ai_generated");
                          }}
                          disabled={sceneBusy || otherSceneBusy}
                          className="creator-input h-11 w-full px-3 text-xs font-bold"
                          title="Choose the model used for this scene."
                        >
                          <option value="seedance">Seedance 2.0</option>
                          <option value="omini">Omini</option>
                        </select>
                      </label>
                    </div>

                    <label className="mt-3 block min-w-0">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">
                        {isProductLed ? "High-quality CGI product image prompt" : "Image prompt"}
                      </span>
                      <textarea
                        value={imagePrompt}
                        onChange={(event) => setSceneImagePromptDrafts((current) => ({
                          ...current,
                          [scene.id]: event.target.value,
                        }))}
                        rows={3}
                        className="creator-input min-h-[6.75rem] w-full resize-y px-3 py-2 text-sm leading-6"
                        placeholder={isProductLed
                          ? "Premium CGI packshot, exact packaging, commercial lighting, camera angle, surface, and background"
                          : "Describe the production-ready first frame for this scene"}
                      />
                    </label>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label
                        className={`creator-control flex min-h-11 cursor-pointer items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-100 ${
                          !onUploadSceneImage || imageUploading || sceneBusy || !hasVideoRun ? "cursor-not-allowed opacity-60" : ""
                        }`}
                        title={!hasVideoRun
                          ? "Prepare the scene workspace before uploading an image."
                          : effectiveSceneImageUrl
                            ? "Replace the image anchor for this scene."
                            : "Upload an image anchor for this scene."}
                      >
                        {imageUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                        {imageUploading ? "Uploading" : effectiveSceneImageUrl ? "Replace image" : "Upload image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,.jpg,.jpeg,.png,.webp,.avif,.gif"
                          className="sr-only"
                          disabled={!onUploadSceneImage || imageUploading || sceneBusy || !hasVideoRun}
                          onChange={(event) => handleSceneProductionImageUpload(scene, event)}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => onGenerateSceneImage?.(scene, {
                          imagePrompt,
                          productImagePrompt: imagePrompt,
                          productLed: isProductLed,
                          referenceImageDetails: referenceDetails,
                          productReferenceImageUrls: canonicalProductImageUrls,
                          canonicalProductImageAssets,
                        })}
                        disabled={!onGenerateSceneImage || imageBusy || imageUploading || sceneBusy || (isProductLed && !canonicalProductImageReady)}
                        className="creator-control flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-100 disabled:opacity-50"
                        title={isProductLed && !canonicalProductImageReady
                          ? "Attach the original product reference first."
                          : generatedSceneImageUrl
                            ? "Generate a fresh high-quality CGI frame from the original product reference."
                            : "Generate a high-quality CGI frame from the original product reference and this shot prompt."}
                      >
                        {imageBusy ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                        {imageBusy ? "Generating image" : generatedSceneImageUrl ? "Regenerate image" : "Generate image"}
                      </button>

                      {generatedSceneImageUrl && (
                        <span className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-black text-emerald-100">
                          <CheckCircle2 size={15} /> CGI frame ready
                        </span>
                      )}
                    </div>

                    {isProductLed && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
                        <span className={canonicalProductImageReady ? "text-emerald-200" : "text-amber-200"}>
                          Original product reference: {canonicalProductImageReady ? "ready" : "missing"}
                        </span>
                        <span className={generatedSceneImageUrl ? "text-emerald-200" : "text-slate-400"}>
                          Shot-specific CGI frame: {generatedSceneImageUrl ? "ready" : "generate next"}
                        </span>
                      </div>
                    )}

                    {selectedAiProvider === "seedance" && (
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {isProductLed && productImageReady
                          ? "Seedance 2.0 will receive the CGI shot frame as @Image1 and the original product reference as @Image2."
                          : effectiveSceneImageUrl
                            ? "The approved image will be sent as Seedance's starting frame."
                          : isProductLed
                            ? "Attach the original product reference, then generate or upload this shot's CGI frame."
                            : "Without an image, Seedance will use text-to-video for this story scene."}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <label className="min-w-0">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Video motion prompt</span>
                    <textarea
                      value={videoPrompt}
                      onChange={(event) => handleVideoPromptChange(scene.id, event.target.value)}
                      rows={3}
                      className="creator-input min-h-[6.75rem] w-full resize-y px-3 py-2 text-sm leading-6"
                    />
                    {scene.cameraMovement && (
                      <span className="mt-1 block text-[11px] font-semibold text-cyan-200">Camera: {scene.cameraMovement}</span>
                    )}
                  </label>
                  <label className="min-w-0">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Scene sound</span>
                    <textarea
                      value={sceneSound}
                      onChange={(event) => handleSceneSoundChange(scene.id, event.target.value)}
                      rows={3}
                      placeholder="Ambient sound, product sounds, transitions, and sync hits from the screenplay"
                      className="creator-input min-h-[6.75rem] w-full resize-y px-3 py-2 text-sm leading-6"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {isAvatarScene && (
                    <button
                      type="button"
                      onClick={() => onGenerateSceneImage?.(scene)}
                      disabled={!onGenerateSceneImage || imageBusy || sceneBusy}
                      className="creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                      title={productionImageUrl ? "Generate a new production image anchor for this shot" : "Generate the production image anchor for this shot"}
                    >
                      {imageBusy ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                      {imageBusy ? "Generating" : productionImageUrl ? "Regenerate image" : "Generate image"}
                    </button>
                  )}
                  {!isAvatarScene && (
                    <button
                      type="button"
                      onClick={() => {
                        if (shotActionBlockedReason) {
                          onBlockedAction?.(shotActionBlockedReason);
                          return;
                        }
                        handleRegenerateScene(scene, aiGenerationOverrides);
                      }}
                      disabled={sceneBusy || imageBusy || otherSceneBusy}
                      aria-disabled={Boolean(shotActionBlockedReason)}
                      className={`creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50 ${
                        shotActionBlockedReason ? "opacity-60" : ""
                      }`}
                      title={shotActionBlockedReason || (sceneClipReady ? "Regenerate this scene with a charge confirmation." : "Generate this scene video and its planned sound.")}
                    >
                      {sceneBusy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                      {sceneBusy ? "Generating" : sceneClipReady ? "Regenerate video + sound" : "Generate video + sound"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAcceptScene(scene)}
                    disabled={!sceneClipReady || sceneAccepted || sceneBusy || otherSceneBusy}
                    className="creator-primary flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                    title={sceneClipReady ? "Accept this shot clip for the final combined video" : "Generate this shot clip first"}
                  >
                    <CheckCircle2 size={15} />
                    {sceneAccepted ? "Accepted" : "Accept"}
                  </button>
                </div>

                <details className="mt-3 border-t border-white/10 pt-2">
                  <summary className="cursor-pointer text-[11px] font-black text-slate-400">Request a scene revision</summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <textarea
                      value={draft}
                      onChange={(event) => handleDraftChange(scene.id, event.target.value)}
                      rows={2}
                      placeholder="Describe the shot change"
                      className="creator-input min-h-[4.5rem] w-full resize-none px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleChatSubmit(scene)}
                      disabled={!draft.trim() || !hasVideoRun || sceneBusy || otherSceneBusy}
                      className="creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                      title={!hasVideoRun ? "Prepare the scene workspace first." : otherSceneBusy ? "Another scene is generating." : "Save scene improvement context."}
                    >
                      {sceneBusy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Send
                    </button>
                  </div>
                </details>

                {Array.isArray(scene.revisions) && scene.revisions.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <MessageSquareText size={13} /> {scene.revisions.length} revision{scene.revisions.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-slate-400">
              Screenplay scenes will appear here after the script JSON is available.
            </div>
          )}

          {sceneRows.length > 0 && (
            <section className="border-t border-white/10 pt-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                      <Music2 size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Complete dialogue audio</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {availableSceneDialogueCount} of {sceneRows.length} scene track{sceneRows.length === 1 ? "" : "s"} available
                      </p>
                    </div>
                  </div>
                  {missingSceneDialogueNumbers.length > 0 && (
                    <p className="mt-2 text-[11px] font-bold text-amber-200">
                      Missing scenes {missingSceneDialogueNumbers.join(", ")} will be skipped.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCombineSceneDialogue}
                  disabled={combiningSceneDialogue}
                  aria-disabled={!hasVideoRun || !availableSceneDialogueCount || Boolean(activeSceneVoiceId)}
                  className={`creator-primary flex min-h-11 shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm font-black text-white disabled:opacity-50 ${
                    !hasVideoRun || !availableSceneDialogueCount || activeSceneVoiceId ? "opacity-60" : ""
                  }`}
                  title={
                    !hasVideoRun
                      ? "Prepare the scene workspace first."
                      : !availableSceneDialogueCount
                        ? "Clone at least one scene dialogue first."
                        : activeSceneVoiceId
                          ? "Wait for the current scene voice clone."
                          : combinedDialogueUrl
                            ? "Rebuild the downloadable file from all currently available scene dialogue."
                            : "Combine all currently available scene dialogue in scene order."
                  }
                >
                  {combiningSceneDialogue ? <Loader2 size={16} className="animate-spin" /> : <Music2 size={16} />}
                  {combiningSceneDialogue
                    ? "Combining"
                    : combinedDialogueUrl
                      ? "Rebuild combined audio"
                      : "Combine available audio"}
                </button>
              </div>

              {combinedDialogueUrl && (
                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <audio
                      controls
                      preload="metadata"
                      src={combinedDialogueUrl}
                      onError={() => refreshMediaUrl(combinedDialogueUrl)}
                      className="h-10 w-full"
                    />
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      {Number(combinedDialogueSummary.includedSceneCount || combinedDialogueAsset.includedSceneCount || availableSceneDialogueCount)} scene track
                      {Number(combinedDialogueSummary.includedSceneCount || combinedDialogueAsset.includedSceneCount || availableSceneDialogueCount) === 1 ? "" : "s"} combined in screenplay order.
                    </p>
                  </div>
                  <a
                    href={combinedDialogueUrl}
                    download={combinedDialogueDownloadFilename(screenplay, combinedDialogueAsset)}
                    className="creator-control flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-black text-slate-100"
                    title="Download the combined scene dialogue audio"
                  >
                    <Download size={16} /> Download audio
                  </a>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StoryboardReviewChoice({
  ready,
  generated,
  loading,
  useReferences,
  onUseReferencesChange,
  onOpenStoryboard,
  onGenerateStoryboard,
}) {
  const statusLabel = generated ? "Frames ready" : ready ? "Plans ready" : "Optional";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-purple-300/20 bg-purple-400/10 text-purple-100">
            <ImageIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">Storyboard review</p>
            <p className="mt-0.5 text-[11px] font-black uppercase tracking-normal text-slate-500">{statusLabel}</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] font-black text-slate-200">
          <input
            type="checkbox"
            checked={Boolean(useReferences)}
            onChange={(event) => onUseReferencesChange?.(event.target.checked)}
            className="h-3.5 w-3.5 accent-purple-500"
          />
          Use frames
        </label>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
        Confirm the look shot-by-shot before video, or skip and generate directly from the approved screenplay.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onGenerateStoryboard}
          disabled={loading}
          className="creator-control flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {ready || generated ? "Open Storyboard" : "Create Storyboard"}
        </button>
        <button
          type="button"
          onClick={onOpenStoryboard}
          disabled={!ready && !generated}
          className="creator-control flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"
        >
          <ImageIcon size={14} />
          Review Shots
        </button>
      </div>
    </div>
  );
}

function EditorHandoffPanel({
  order,
  finalUrl,
  editorBrief,
  revisionDraft,
  isSubmitting,
  isApproving,
  isRequestingChanges,
  onBriefChange,
  onRevisionChange,
  onSubmit,
  onApprove,
  onRequestChanges,
}) {
  const status = humanWorkOrderStatus(order);
  const approved = status === "APPROVED";
  const delivered = ["DELIVERED", "APPROVED"].includes(status);
  const active = Boolean(order) && !["APPROVED", "REJECTED", "CANCELLED", "CANCELED"].includes(status);
  const deliveryUrl = humanWorkOrderDeliveryUrl(order);
  const price = Number(order?.priceAmount ?? order?.price_amount ?? 0);
  const currency = String(order?.priceCurrency || order?.price_currency || "INR").toUpperCase();
  const includedInPackage = !Number.isFinite(price) || price <= 0;
  const revisionCount = humanWorkOrderRevisionCount(order);
  const revisionsLeft = Math.max(0, 2 - revisionCount);
  return (
    <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-purple-300/20 bg-purple-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-purple-100">
              <Clapperboard size={13} /> Freelancer edit
            </span>
            {order && <StatusPill status={status} />}
            <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-slate-300">
              {includedInPackage ? "Included in video package" : `${currency} ${price.toLocaleString("en-IN")}`}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
            Send the final clip, shot clips, voice/music assets, captions, and edit plan to a freelancer. Basic editing is included in the AI video package; approval does not create another edit fee.
          </p>
          {order && (
            <p className="mt-2 text-[11px] font-black uppercase tracking-normal text-slate-500">
              {approved ? "Approved and paid" : active ? `Queue status: ${humanStatusLabel(status)}` : "Ready for editor submission"}
              {!approved && delivered ? ` / ${revisionsLeft} revision round${revisionsLeft === 1 ? "" : "s"} left` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!finalUrl || Boolean(order) || isSubmitting}
          className="creator-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
          title={order ? "This video is already in the freelancer queue." : "Send the final video and assets to the editor queue."}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send to editor
        </button>
      </div>

      {!order && (
        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Editing brief</span>
          <textarea
            value={editorBrief || ""}
            onChange={(event) => onBriefChange?.(event.target.value)}
            rows={2}
            maxLength={800}
            placeholder="Tighten pacing, clean audio, balance music, verify captions, add premium transitions..."
            className="creator-input min-h-[4.25rem] w-full resize-none px-3 py-2 text-xs"
          />
        </label>
      )}

      {deliveryUrl && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={deliveryUrl}
            target="_blank"
            rel="noreferrer"
            className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-200"
          >
            <Play size={14} /> Open edited video
          </a>
          <a
            href={deliveryUrl}
            download
            className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-200"
          >
            <Download size={14} /> Download edited video
          </a>
        </div>
      )}

      {delivered && !approved && (
        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <textarea
            value={revisionDraft || ""}
            onChange={(event) => onRevisionChange?.(event.target.value)}
            rows={2}
            maxLength={800}
            placeholder="Request an edit change before approval"
            className="creator-input min-h-[4.25rem] w-full resize-none px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={onRequestChanges}
            disabled={!revisionDraft?.trim() || isRequestingChanges || revisionsLeft <= 0}
            className="creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"
          >
            {isRequestingChanges ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareText size={14} />}
            Request changes
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={isApproving}
            className="creator-primary flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {includedInPackage ? "Approve edited video" : `Approve & pay ${currency} ${price.toLocaleString("en-IN")}`}
          </button>
        </div>
      )}
    </section>
  );
}

function InfoSuggestion({ generated, ready, useReferences, imageLedAdMode }) {
  const stateText = generated
    ? imageLedAdMode
      ? "Generated image anchors are ready to guide product motion and first-frame video generation."
      : "Storyboard images are ready to guide the video model."
    : ready
      ? imageLedAdMode
        ? "Generate the image anchors before video so the model can move the exact product look."
        : "Generate the storyboard images before video for the strongest reference."
      : imageLedAdMode
        ? "Create product/storyboard image anchors first for D2C packshots, slow motion, and macro shots."
        : "Create the storyboard first when visual consistency matters.";
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cyan-300/20 bg-cyan-400/[0.075] px-4 py-3 text-cyan-50 sm:flex-row sm:items-start">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-200/25 bg-cyan-300/10">
        <Info size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-white">{imageLedAdMode ? "Product ads work best with generated image anchors." : "Best video results use storyboard reference images."}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-cyan-100/85">
          {stateText} Storyboard frames are sketch previews by design; product image anchors can be used as first-frame references for the actual shot video when available.
        </p>
        {!useReferences && (
          <p className="mt-2 text-[11px] font-black uppercase tracking-normal text-cyan-100">
            Turn on Use frames to carry character, background, and camera continuity across scenes.
          </p>
        )}
      </div>
    </div>
  );
}

function VideoProviderChoice({ provider = "gemini_omni", model = "", onProviderChange, onModelChange }) {
  const normalizedProvider = normalizeVideoProvider(provider);
  const modelOptions = videoModelOptions(normalizedProvider);
  const resolvedModel = model || defaultModelForProvider(normalizedProvider);
  const handleProviderChange = (nextProvider) => {
    const normalized = normalizeVideoProvider(nextProvider);
    onProviderChange?.(normalized);
    onModelChange?.(defaultModelForProvider(normalized));
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-300/20 bg-amber-400/10 text-amber-100">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">B-roll renderer</p>
          <p className="mt-0.5 text-[11px] font-black uppercase tracking-normal text-slate-500">{providerLabel(normalizedProvider)}</p>
        </div>
      </div>
      <div className="grid gap-3">
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Provider</span>
          <select
            value={normalizedProvider}
            onChange={(event) => handleProviderChange(event.target.value)}
            className="creator-input h-10 w-full px-3 text-xs font-bold"
          >
            <option value="gemini_omni">Gemini Omni Flash</option>
            <option value="seedance">DalaiLlama Video</option>
            <option value="omini">Omini</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Model</span>
          <select
            value={resolvedModel}
            onChange={(event) => onModelChange?.(event.target.value)}
            className="creator-input h-10 w-full px-3 text-xs font-bold"
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function FounderAvatarPanel({
  profile = {},
  availableAvatars = [],
  selectedAvatarKey = "",
  avatarLibraryLoading = false,
  selectingAvatar = false,
  languageOptions = DIALOGUE_LANGUAGE_OPTIONS,
  error = "",
  uploading = false,
  preparingEnglishDialogue = false,
  generatingPreview = false,
  updatingApproval = false,
  preparingPortrait = false,
  generatingAvatarTest = false,
  generatingAvatarPreview = false,
  updatingAvatarApproval = false,
  uploadingFinalAudio = false,
  onChange,
  onSelectAvatar,
  onSelectAvatarBlocked,
  onUpload,
  onUploadBlocked,
  onPrepareEnglishDialogue,
  onGeneratePreview,
  onVoiceDecision,
  onPreparePortrait,
  onGenerateAvatarTest,
  onGenerateAvatarPreview,
  onAvatarDecision,
  onUploadFinalAudio,
  onCreateAvatar,
  createAvatarBlockedReason = "",
  creatingAvatar = false,
}) {
  const sourceVideoInputRef = useRef(null);
  const portraitInputRef = useRef(null);
  const [avatarSelectionKey, setAvatarSelectionKey] = useState(selectedAvatarKey);
  const [portraitMode, setPortraitMode] = useState(() => firstText(profile?.avatarPortraitSourceMode, "extract"));
  const [previewBlockMessage, setPreviewBlockMessage] = useState("");
  const normalized = normalizeFounderAvatarProfile(profile);
  const mode = normalized.avatarProviderMode;
  const localModels = normalized.localModels || {};
  const usesHeygenAvatar = localModels.talkingAvatarModel === "fal_heygen_avatar4";
  const avatarModelLabel = usesHeygenAvatar ? "HeyGen Avatar IV" : "Happy Horse portrait";
  const lipSyncLabel = usesHeygenAvatar || localModels.lipSyncModel === "avatar_native"
    ? "built-in lip sync"
    : localModels.lipSyncModel === "fal_musetalk"
    ? "MuseTalk"
    : localModels.lipSyncModel === "sync_labs"
      ? "Sync Labs"
      : "LatentSync";
  const hasKit = hasFounderAvatarIdentity(normalized);
  const voiceStatus = String(normalized.voiceApprovalStatus || "NOT_REQUESTED").toUpperCase();
  const avatarStatus = String(normalized.avatarPreviewStatus || "NOT_REQUESTED").toUpperCase();
  const previewAsset = firstObject(normalized.voicePreviewAsset);
  const previewUrl = firstText(previewAsset.assetUrl, previewAsset.signedUrl, previewAsset.publicUrl);
  const avatarPreviewAsset = firstObject(normalized.avatarPreviewAsset);
  const avatarPreviewUrl = firstText(
    normalized.avatarPreviewUrl,
    avatarPreviewAsset.assetUrl,
    avatarPreviewAsset.signedUrl,
    avatarPreviewAsset.publicUrl
  );
  const avatarPortraitAsset = firstObject(normalized.avatarPortraitAsset);
  const avatarPortraitUrl = firstText(
    normalized.avatarPortraitUrl,
    avatarPortraitAsset.assetUrl,
    avatarPortraitAsset.signedUrl,
    avatarPortraitAsset.publicUrl
  );
  const avatarTestAsset = firstObject(normalized.avatarTestAsset);
  const avatarTestUrl = firstText(
    normalized.avatarTestUrl,
    avatarTestAsset.assetUrl,
    avatarTestAsset.signedUrl,
    avatarTestAsset.publicUrl
  );
  const avatarTestStatus = String(normalized.avatarTestStatus || "NOT_REQUESTED").toUpperCase();
  const sourceAsset = firstObject(normalized.sourceAsset, normalized.source_asset, normalized.asset);
  const sourceVideoUrl = firstText(
    normalized.sourceUrl,
    sourceAsset.assetUrl,
    sourceAsset.signedUrl,
    sourceAsset.publicUrl
  );
  const sourceFilename = firstText(
    firstObject(sourceAsset.metadata).originalFilename,
    sourceAsset.originalFilename,
    sourceAsset.filename,
    "Creator video"
  );
  const sourceUploaded = Boolean(sourceVideoUrl || sourceAsset.objectKey || sourceAsset.object_key || normalized.sourceObjectKey);
  const finalAudioAsset = firstObject(normalized.exactFounderAudioAsset, normalized.finalFounderAudioAsset);
  const hasExactAudio = Boolean(firstText(normalized.finalFounderAudioUrl, finalAudioAsset.assetUrl, finalAudioAsset.objectKey));
  const voiceModel = localModels.voiceModel;
  const clientRvcSelected = voiceModel === CLIENT_RVC_VOICE_MODEL;
  const voiceProfileId = firstText(normalized.voiceProfileId, localModels.voiceProfileId, CLIENT_RVC_PROFILE_ID);
  const englishDialogueReady = clientRvcSelected
    && normalizeLanguageKey(normalized.language) === "english"
    && Boolean(firstText(normalized.voicePreviewText));
  const voiceReady = voiceStatus === "APPROVED";
  const avatarReady = avatarStatus === "APPROVED";
  const providerVoiceId = ["fal_elevenlabs_v3", "elevenlabs_v3_voice_clone", "elevenlabs_professional"].includes(voiceModel)
    ? firstText(normalized.elevenLabsVoiceId)
    : voiceModel === "sarvam_voice_clone"
      ? firstText(normalized.sarvamVoiceId)
    : firstText(
      normalized.minimaxVoiceId,
      normalized.providerVoiceId,
      normalized.customVoiceId,
      normalized.elevenLabsVoiceId,
      normalized.sarvamVoiceId,
      normalized.synthesiaVoiceId
    );
  const cloneReady = Boolean(providerVoiceId)
    || (voiceModel === "fal_chatterbox_multilingual" && ["PREVIEW_READY", "APPROVED"].includes(voiceStatus))
    || (clientRvcSelected && ["PREVIEW_READY", "APPROVED"].includes(voiceStatus))
    || voiceModel === "uploaded_founder_audio";
  const previewUnavailable = voiceModel === "uploaded_founder_audio" || voiceModel === "synthesia_managed";
  const previewBlockedReason = !normalized.consentConfirmed
    ? "Confirm creator consent first."
    : !sourceUploaded
      ? "Upload the creator video first."
      : clientRvcSelected && !englishDialogueReady
        ? "Prepare the current screenplay dialogue in English first."
      : previewUnavailable
        ? "This voice option does not generate a preview."
        : (voiceModel === "elevenlabs_professional" || voiceModel === "fal_elevenlabs_v3")
          && !normalized.elevenLabsVoiceId
          ? "This legacy ElevenLabs option requires an existing voice ID. Select ElevenLabs v3 Voice Clone to clone from the uploaded video."
          : "";
  const avatarPreviewBlockedReason = !normalized.consentConfirmed
    ? "Confirm creator consent first."
    : !sourceUploaded
      ? "Upload the creator video first."
      : !voiceReady
        ? "Approve the mastered voice preview first."
      : !previewUrl && !hasExactAudio
          ? "Generate and approve a cloned-voice preview first."
          : "";
  const avatarTestBlockedReason = !normalized.consentConfirmed
    ? "Confirm creator consent first."
    : !voiceReady
      ? "Approve the mastered voice preview first."
      : !avatarPortraitUrl
        ? portraitMode === "upload"
          ? "Upload a founder portrait first."
          : "Extract a portrait from the creator video first."
        : "";
  const generateVoicePreview = () => {
    if (generatingPreview) return;
    if (previewBlockedReason) {
      setPreviewBlockMessage(previewBlockedReason);
      return;
    }
    setPreviewBlockMessage("");
    onGeneratePreview?.();
  };
  useEffect(() => {
    setAvatarSelectionKey(selectedAvatarKey || "");
  }, [selectedAvatarKey]);
  useEffect(() => {
    setPortraitMode(normalized.avatarPortraitSourceMode || "extract");
  }, [normalized.avatarPortraitSourceMode]);
  const selectSavedAvatar = () => {
    if (avatarLibraryLoading || selectingAvatar) return;
    if (!availableAvatars.length) {
      onSelectAvatarBlocked?.("No ready avatar exists yet. Upload a creator video, create the voice clone, and approve it first.");
      return;
    }
    const selectedAvatar = availableAvatars.find((avatar) => reusableAvatarKey(avatar) === avatarSelectionKey);
    if (!selectedAvatar) {
      onSelectAvatarBlocked?.("Select a ready avatar before creating the video.");
      return;
    }
    onSelectAvatar?.(selectedAvatar);
  };
  const openSourceVideoPicker = () => {
    if (uploading) return;
    if (!normalized.consentConfirmed) {
      onUploadBlocked?.();
      return;
    }
    sourceVideoInputRef.current?.click();
  };
  const changePortraitMode = (value) => {
    const nextMode = value === "upload" ? "upload" : "extract";
    setPortraitMode(nextMode);
    setPreviewBlockMessage("");
    if (nextMode !== normalized.avatarPortraitSourceMode) {
      onChange?.({
        avatarPortraitSourceMode: nextMode,
        avatarPortraitStatus: "NOT_REQUESTED",
        avatarPortraitAsset: {},
        avatarPortraitUrl: "",
        avatarTestStatus: "NOT_REQUESTED",
        avatarTestAsset: {},
        avatarTestUrl: "",
      });
    }
  };
  const openPortraitPicker = () => {
    if (preparingPortrait) return;
    if (!normalized.consentConfirmed) {
      setPreviewBlockMessage("Confirm creator consent before uploading a portrait.");
      return;
    }
    portraitInputRef.current?.click();
  };
  const uploadPortrait = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setPreviewBlockMessage("Upload a JPG, PNG, or WebP founder portrait.");
      return;
    }
    setPreviewBlockMessage("");
    await onPreparePortrait?.({ file, sourceMode: "upload", timestampSeconds: 0.5 });
  };
  const extractPortrait = async () => {
    if (preparingPortrait) return;
    if (!sourceUploaded) {
      setPreviewBlockMessage("Upload the creator video before extracting a portrait.");
      return;
    }
    setPreviewBlockMessage("");
    await onPreparePortrait?.({ sourceMode: "extract", timestampSeconds: 0.5 });
  };
  const createAvatarTest = async () => {
    if (generatingAvatarTest) return;
    if (avatarTestBlockedReason) {
      setPreviewBlockMessage(avatarTestBlockedReason);
      return;
    }
    setPreviewBlockMessage("");
    await onGenerateAvatarTest?.({
      portraitMode,
      motionPrompt: normalized.avatarMotionPrompt,
      previewText: normalized.voicePreviewText,
      talkingAvatarModel: localModels.talkingAvatarModel,
      lipSyncModel: usesHeygenAvatar ? "avatar_native" : localModels.lipSyncModel,
      avatarResolution: localModels.avatarResolution,
      talkingStyle: localModels.talkingStyle,
    });
  };
  const updateLocalModel = (key, value) => {
    const providerPatch = key === "voiceModel" && value === "synthesia_managed"
      ? { avatarProviderMode: "synthesia", providerMode: "synthesia" }
      : key === "voiceModel" && mode === "synthesia"
        ? { avatarProviderMode: "dalai_llama", providerMode: "dalai_llama" }
        : {};
    const clientVoicePatch = key === "voiceModel" && value === CLIENT_RVC_VOICE_MODEL
      ? {
        voiceProfileId: CLIENT_RVC_PROFILE_ID,
        language: "English",
        languageCode: "en-IN",
        voiceLanguageMode: "english_indian",
        voiceLanguage: "English",
        voiceLanguageCode: "en-IN",
        minimaxLanguageBoost: "English",
      }
      : {};
    const avatarModelPatch = key === "talkingAvatarModel" && value === "fal_heygen_avatar4"
      ? { lipSyncModel: "avatar_native", avatarResolution: "720p", talkingStyle: "stable" }
      : key === "talkingAvatarModel" && localModels.lipSyncModel === "avatar_native"
        ? { lipSyncModel: "fal_musetalk", avatarResolution: "1080p" }
        : {};
    onChange?.({
      ...providerPatch,
      ...clientVoicePatch,
      localModels: {
        ...localModels,
        [key]: value,
        ...avatarModelPatch,
        ...(value === CLIENT_RVC_VOICE_MODEL ? {
          voiceProfileId: CLIENT_RVC_PROFILE_ID,
          lipSyncModel: "fal_latentsync",
        } : {}),
      },
    });
  };
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-300/20 bg-emerald-400/10 text-emerald-100">
          <Clapperboard size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">Avatar test</p>
          <p className="mt-0.5 text-[11px] font-black uppercase tracking-normal text-slate-500">Voice and motion quality only</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2 border-b border-white/10 pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Saved avatar</span>
            <select
              value={avatarSelectionKey}
              onChange={(event) => setAvatarSelectionKey(event.target.value)}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
              aria-label="Select saved avatar"
            >
              <option value="">{avatarLibraryLoading ? "Loading avatars..." : availableAvatars.length ? "Choose an approved avatar" : "No ready avatar available"}</option>
              {availableAvatars.map((avatar) => (
                <option key={reusableAvatarKey(avatar)} value={reusableAvatarKey(avatar)}>
                  {reusableAvatarLabel(avatar)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={selectSavedAvatar}
            disabled={selectingAvatar}
            aria-disabled={!avatarSelectionKey || !availableAvatars.length || selectingAvatar}
            title={availableAvatars.length ? "Use this approved avatar with the current screenplay dialogue" : "Create and approve an avatar before selecting it"}
            className={`creator-control inline-flex h-10 items-center justify-center gap-2 px-3 text-xs font-black text-slate-100 ${!avatarSelectionKey || !availableAvatars.length ? "opacity-60" : ""}`}
          >
            {selectingAvatar ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {selectingAvatar ? "Selecting" : "Select avatar"}
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-2">
          <FounderFlowStatus label="Creator video" value={sourceUploaded ? "Uploaded" : "Required"} ready={sourceUploaded} />
          <FounderFlowStatus label="Voice clone" value={voiceReady ? "Approved" : cloneReady ? "Created" : voiceStatus === "PREVIEW_READY" ? "Preview ready" : "Pending"} ready={cloneReady} />
          <FounderFlowStatus
            label="Avatar"
            value={generatingAvatarTest || generatingAvatarPreview ? "Generating" : avatarReady ? "Approved" : avatarTestStatus === "TEST_READY" || avatarStatus === "PREVIEW_READY" ? "Review" : avatarStatus === "REJECTED" ? "Retry" : "Waiting"}
            ready={avatarReady}
          />
        </div>

        <div className="grid gap-2 border-b border-white/10 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-xs font-black text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(normalized.consentConfirmed)}
                onChange={(event) => onChange?.({ consentConfirmed: event.target.checked })}
                className="h-3.5 w-3.5 accent-emerald-500"
              />
              Creator consent for avatar and voice cloning confirmed
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openSourceVideoPicker}
                title={normalized.consentConfirmed ? `${sourceUploaded ? "Replace" : "Upload"} creator video` : "Confirm creator consent before uploading"}
                disabled={uploading}
                className={`${sourceUploaded ? "creator-control text-slate-100" : "creator-primary text-white"} inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-black ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading" : sourceUploaded ? "Replace video" : "Upload creator video"}
              </button>
              {!previewUnavailable && (
                <button
                  type="button"
                  onClick={generateVoicePreview}
                  disabled={generatingPreview}
                  aria-disabled={Boolean(previewBlockedReason)}
                  title={previewBlockedReason || "Generate a short approval preview using the selected voice language and accent"}
                  className="creator-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generatingPreview ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generatingPreview
                    ? cloneReady ? "Generating preview" : "Creating voice clone"
                    : cloneReady
                      ? "Generate voice preview"
                      : clientRvcSelected
                        ? "Generate client voice preview"
                        : "Create voice clone"}
                </button>
              )}
            </div>
            <input
              ref={sourceVideoInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.mpeg,.mpg"
              disabled={uploading}
              onChange={onUpload}
              className="sr-only"
            />
          </div>
          {previewBlockMessage && (
            <p role="alert" className="text-xs font-bold text-amber-200">{previewBlockMessage}</p>
          )}
          {sourceVideoUrl && (
            <div className="grid gap-1.5">
              <video controls preload="metadata" src={sourceVideoUrl} className="max-h-56 w-full bg-black object-contain" />
              <p className="truncate text-[11px] font-bold text-slate-400">{sourceFilename}</p>
            </div>
          )}
          {error && <p className="text-xs font-bold text-rose-200">{error}</p>}
        </div>

        <div className="grid gap-2">
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Avatar mode</span>
            <select
              value={mode}
              onChange={(event) => onChange?.({ avatarProviderMode: normalizeAvatarProviderMode(event.target.value), providerMode: normalizeAvatarProviderMode(event.target.value) })}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            >
              <option value="dalai_llama">DalaiLlama managed avatar</option>
              <option value="synthesia">Synthesia API</option>
            </select>
          </label>
        </div>

        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Voice language and accent</span>
          <select
            value={normalized.voiceLanguageMode}
            disabled={clientRvcSelected}
            onChange={(event) => {
              const option = VOICE_LANGUAGE_OPTIONS.find((candidate) => candidate.value === event.target.value) || VOICE_LANGUAGE_OPTIONS[0];
              onChange?.({
                voiceLanguageMode: option.value,
                voiceLanguage: option.language,
                voiceLanguageCode: option.languageCode,
                minimaxLanguageBoost: option.languageBoost,
                voiceApprovalStatus: "NOT_REQUESTED",
                voicePreviewAsset: {},
                avatarPreviewStatus: "NOT_REQUESTED",
                avatarPreviewAsset: {},
                avatarPreviewUrl: "",
              });
            }}
            className="creator-input h-10 w-full px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {VOICE_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {voiceModel === "fal_chatterbox_multilingual" && (
          <label className="block min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Uploaded video speech language</span>
            <select
              value={normalized.referenceLanguage}
              onChange={(event) => onChange?.({
                referenceLanguage: event.target.value,
                voiceApprovalStatus: "NOT_REQUESTED",
                voicePreviewAsset: {},
                avatarPreviewStatus: "NOT_REQUESTED",
                avatarPreviewAsset: {},
                avatarPreviewUrl: "",
              })}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            >
              <option value="English">English with Indian accent</option>
              <option value="Hindi">Hindi or Hinglish</option>
            </select>
          </label>
        )}

        {mode === "synthesia" && <div className="grid gap-2 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Synthesia avatar ID</span>
            <input
              value={normalized.synthesiaAvatarId}
              onChange={(event) => onChange?.({ synthesiaAvatarId: event.target.value })}
              placeholder="avatar id"
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Synthesia voice ID</span>
            <input
              value={normalized.synthesiaVoiceId}
              onChange={(event) => onChange?.({ synthesiaVoiceId: event.target.value })}
              placeholder="voice id"
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            />
          </label>
        </div>}

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Voice model</span>
            <select
              value={localModels.voiceModel}
              onChange={(event) => updateLocalModel("voiceModel", event.target.value)}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            >
              <option value={CLIENT_RVC_VOICE_MODEL}>Client English Voice - Trained profile</option>
              <option value="fal_chatterbox_multilingual">DalaiLlama Multilingual Voice</option>
              <option value="elevenlabs_v3_voice_clone">ElevenLabs v3 Voice Clone</option>
              <option value="sarvam_voice_clone">Sarvam Voice Clone - Private beta</option>
              {normalized.elevenLabsVoiceId && (
                <option value="fal_elevenlabs_v3">ElevenLabs v3 via fal.ai - Existing ID</option>
              )}
              <option value="elevenlabs_professional">ElevenLabs Professional - Production</option>
              <option value="uploaded_founder_audio">Upload final founder audio - Exact voice</option>
              <option value="synthesia_managed">Synthesia managed fallback</option>
            </select>
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Avatar video model</span>
            <select
              value={localModels.talkingAvatarModel}
              onChange={(event) => updateLocalModel("talkingAvatarModel", event.target.value)}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            >
              <option value="fal_heygen_avatar4">HeyGen Avatar IV</option>
              <option value="fal_happy_horse_v1_1">DalaiLlama portrait avatar</option>
            </select>
          </label>
        </div>

        {clientRvcSelected && (
          <div className="flex items-start gap-2 border-l-2 border-cyan-300/50 bg-cyan-400/[0.06] px-3 py-2 text-xs font-bold text-cyan-50">
            <Info size={15} className="mt-0.5 shrink-0" />
            <span>English-only client profile: {voiceProfileId}. Prepare and review the English dialogue before voice approval.</span>
          </div>
        )}

        {(voiceModel === "elevenlabs_professional"
          || voiceModel === "fal_elevenlabs_v3"
          || voiceModel === "elevenlabs_v3_voice_clone") && (
          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">
              {voiceModel === "elevenlabs_v3_voice_clone" ? "Existing ElevenLabs voice ID (optional)" : "Verified ElevenLabs voice ID"}
            </span>
            <input
              value={normalized.elevenLabsVoiceId}
              onChange={(event) => onChange?.({ elevenLabsVoiceId: event.target.value })}
              placeholder={voiceModel === "elevenlabs_v3_voice_clone" ? "Leave blank to clone from uploaded video" : "Professional Voice Clone ID"}
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            />
          </label>
        )}

        {voiceModel === "sarvam_voice_clone" && (
          <label className="min-w-0" title="Sarvam cloning requires private API access. Requests stop before billing until its clone endpoint is configured.">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Sarvam clone or speaker ID (optional)</span>
            <input
              value={normalized.sarvamVoiceId}
              onChange={(event) => onChange?.({ sarvamVoiceId: event.target.value })}
              placeholder="Existing clone ID"
              className="creator-input h-10 w-full px-3 text-xs font-bold"
            />
          </label>
        )}

        {!previewUnavailable && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">
                {clientRvcSelected ? "English approval preview" : "10-second preview text"}
              </span>
              <textarea
                value={normalized.voicePreviewText}
                onChange={(event) => onChange?.({ voicePreviewText: event.target.value })}
                rows={3}
                maxLength={240}
                placeholder={clientRvcSelected ? "A short English line from the prepared dialogue" : "A short Hinglish line for voice approval"}
                className="creator-input min-h-[5.25rem] w-full resize-y px-3 py-2 text-xs"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Pronunciation aliases</span>
              <textarea
                value={normalized.pronunciationGuide}
                onChange={(event) => onChange?.({ pronunciationGuide: event.target.value })}
                rows={3}
                maxLength={4000}
                placeholder={"procrastination = pro-kras-ti-nay-shun\nDhyana = ध्यान"}
                className="creator-input min-h-[5.25rem] w-full resize-y px-3 py-2 text-xs"
              />
            </label>
          </div>
        )}

        <details className="border-y border-white/10 py-2">
          <summary className="cursor-pointer text-[11px] font-black text-slate-400">Test model settings</summary>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Image model</span>
                <select
                  value={localModels.imageModel}
                  onChange={(event) => updateLocalModel("imageModel", event.target.value)}
                  className="creator-input h-10 w-full px-3 text-xs font-bold"
                >
                  <option value="gemini_storyboard">Gemini storyboard</option>
                  <option value="flux_1_dev">Flux.1 Dev</option>
                  <option value="ic_lightning">IC-Lightning</option>
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Lip sync</span>
                <select
                  value={localModels.lipSyncModel}
                  title="Select lip-sync provider"
                  disabled={usesHeygenAvatar}
                  onChange={(event) => updateLocalModel("lipSyncModel", event.target.value)}
                  className="creator-input h-10 w-full px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="avatar_native">Built into HeyGen Avatar IV</option>
                  <option value="fal_latentsync">DalaiLlama LatentSync</option>
                  <option value="fal_musetalk">DalaiLlama MuseTalk</option>
                  <option value="sync_labs">Sync Labs API</option>
                  <option value="api_fallback">API fallback</option>
                </select>
              </label>
            </div>
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Video model</span>
              <select
                value={localModels.videoModel}
                onChange={(event) => updateLocalModel("videoModel", event.target.value)}
                className="creator-input h-10 w-full px-3 text-xs font-bold"
              >
                <option value="fal_seedance">DalaiLlama Video</option>
              </select>
            </label>
            {mode === "dalai_llama" && (
              <label className="inline-flex items-center gap-2 text-xs font-black text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(normalized.productionEnhancementEnabled)}
                  onChange={(event) => onChange?.({ productionEnhancementEnabled: event.target.checked })}
                  className="h-3.5 w-3.5 accent-emerald-500"
                />
                Enhance wardrobe and background
              </label>
            )}
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Founder source notes</span>
              <textarea
                value={normalized.details}
                onChange={(event) => onChange?.({ details: event.target.value })}
                rows={2}
                maxLength={1000}
                placeholder="Wardrobe, hair, lighting, camera distance, founder speaking style..."
                className="creator-input min-h-[4.25rem] w-full resize-none px-3 py-2 text-xs"
              />
            </label>
          </div>
        </details>

        <div className="grid gap-2 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Voice approval</span>
            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-normal ${voiceStatus === "APPROVED" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : voiceStatus === "PREVIEW_READY" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}`}>
              {voiceApprovalLabel(voiceStatus)}
            </span>
          </div>

          {previewUrl && <audio controls preload="metadata" src={previewUrl} className="h-10 w-full" />}
          {previewUrl && (
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-400">
              <span>Voice quality</span>
              <span className={normalized.voiceEnhancementApplied ? "text-emerald-200" : "text-amber-200"}>
                {normalized.voiceEnhancementApplied ? "Studio mastered" : normalized.voiceEnhancementStatus === "skipped_after_error" ? "Original clone" : "Enhanced"}
              </span>
            </div>
          )}
          {hasExactAudio && (
            <audio controls preload="metadata" src={firstText(normalized.finalFounderAudioUrl, finalAudioAsset.assetUrl, finalAudioAsset.signedUrl)} className="h-10 w-full" />
          )}

          <div className="flex flex-wrap gap-2">
            {!previewUnavailable && previewUrl && (
              <button
                type="button"
                onClick={generateVoicePreview}
                disabled={generatingPreview}
                aria-disabled={Boolean(previewBlockedReason)}
                title={previewBlockedReason || "Generate another cloned-voice preview"}
                className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingPreview ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Try another preview
              </button>
            )}
            {(voiceStatus === "PREVIEW_READY" || (voiceModel === "synthesia_managed" && normalized.synthesiaVoiceId)) && (
              <button
                type="button"
                onClick={() => onVoiceDecision?.("APPROVE")}
                disabled={updatingApproval}
                className="creator-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                {updatingApproval ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Approve voice
              </button>
            )}
            {voiceStatus === "APPROVED" && !hasExactAudio && voiceModel !== "synthesia_managed" && (
              <button
                type="button"
                onClick={() => onVoiceDecision?.("REJECT")}
                disabled={updatingApproval}
                className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"
              >
                <RefreshCw size={14} /> Replace voice
              </button>
            )}
            <label className={`creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-200 ${uploadingFinalAudio || !normalized.consentConfirmed ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
              {uploadingFinalAudio ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
              Upload final audio
              <input
                type="file"
                accept="audio/*,video/*"
                disabled={uploadingFinalAudio || !normalized.consentConfirmed}
                onChange={onUploadFinalAudio}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-normal text-slate-500">Combined avatar preview</span>
              <span className="mt-0.5 block text-xs font-black text-white">{avatarModelLabel} + {lipSyncLabel}</span>
            </div>
            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-normal ${avatarTestStatus === "APPROVED" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : avatarTestStatus === "TEST_READY" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : avatarTestStatus === "GENERATING" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}`}>
              {avatarTestStatus === "APPROVED" ? "Approved" : avatarTestStatus === "TEST_READY" ? "Ready to review" : avatarTestStatus === "GENERATING" || generatingAvatarTest ? "Generating" : "Not generated"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Founder portrait</span>
              <select
                value={portraitMode}
                onChange={(event) => changePortraitMode(event.target.value)}
                className="creator-input h-10 w-full px-3 text-xs font-bold"
              >
                <option value="extract">Extract from creator video</option>
                <option value="upload">Upload portrait image</option>
              </select>
            </label>
            <button
              type="button"
              onClick={portraitMode === "upload" ? openPortraitPicker : extractPortrait}
              disabled={preparingPortrait}
              aria-disabled={preparingPortrait || (portraitMode === "extract" && !sourceUploaded)}
              title={portraitMode === "upload" ? "Upload a founder portrait" : sourceUploaded ? "Extract a founder portrait from the uploaded video" : "Upload the creator video first"}
              className={`creator-control inline-flex h-10 items-center justify-center gap-2 px-3 text-xs font-black text-slate-100 ${portraitMode === "extract" && !sourceUploaded ? "opacity-60" : ""}`}
            >
              {preparingPortrait ? <Loader2 size={14} className="animate-spin" /> : portraitMode === "upload" ? <Upload size={14} /> : <ImageIcon size={14} />}
              {preparingPortrait ? "Preparing portrait" : portraitMode === "upload" ? avatarPortraitUrl ? "Replace portrait" : "Upload portrait" : avatarPortraitUrl ? "Extract again" : "Extract portrait"}
            </button>
            <input
              ref={portraitInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={preparingPortrait}
              onChange={uploadPortrait}
              className="sr-only"
            />
          </div>

          {avatarPortraitUrl && (
            <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start">
              <img
                src={avatarPortraitUrl}
                alt="Founder portrait selected for avatar test"
                className="aspect-[3/4] w-32 border border-white/10 bg-black object-cover"
              />
              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Motion direction</span>
                <textarea
                  value={normalized.avatarMotionPrompt}
                  onChange={(event) => onChange?.({ avatarMotionPrompt: event.target.value })}
                  rows={4}
                  maxLength={2000}
                  placeholder="Natural eye contact, restrained gestures, stable identity and background."
                  className="creator-input min-h-[8rem] w-full resize-y px-3 py-2 text-xs leading-5"
                />
              </label>
            </div>
          )}

          {generatingAvatarTest && (
            <div className="flex min-h-40 items-center justify-center gap-2 border-y border-white/10 bg-black/30 px-4 text-xs font-black text-cyan-100">
              <Loader2 size={16} className="animate-spin" />
              Generating {avatarModelLabel} with {lipSyncLabel}
            </div>
          )}

          {avatarTestUrl && !generatingAvatarTest && (
            <div className="border-y border-white/10 bg-black/30 py-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-3">
                <span className="text-[10px] font-black uppercase tracking-normal text-slate-400">{avatarModelLabel} + {lipSyncLabel} preview</span>
                <span className="text-[10px] font-bold text-emerald-200">Combined MP4</span>
              </div>
              <video
                key={avatarTestUrl}
                controls
                playsInline
                preload="metadata"
                src={avatarTestUrl}
                className="max-h-80 w-full bg-black object-contain"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={createAvatarTest}
              disabled={generatingAvatarTest}
              aria-disabled={Boolean(avatarTestBlockedReason) || generatingAvatarTest}
              title={avatarTestBlockedReason || `Generate a five-second ${avatarModelLabel} preview with the approved cloned voice`}
              className={`creator-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-white ${avatarTestBlockedReason || generatingAvatarTest ? "opacity-50" : ""}`}
            >
              {generatingAvatarTest ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generatingAvatarTest ? "Generating combined preview" : avatarTestUrl ? "Regenerate combined preview" : "Generate combined preview"}
            </button>
            {avatarTestStatus === "TEST_READY" && (
              <button
                type="button"
                onClick={() => onAvatarDecision?.("APPROVE")}
                disabled={updatingAvatarApproval}
                className="creator-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                {updatingAvatarApproval ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Approve combined avatar
              </button>
            )}
            {avatarTestStatus === "APPROVED" && (
              <button
                type="button"
                onClick={() => onAvatarDecision?.("REJECT")}
                disabled={updatingAvatarApproval}
                className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-100 disabled:opacity-50"
              >
                <RefreshCw size={14} /> Replace avatar
              </button>
            )}
            {avatarTestUrl && (
              <a
                href={avatarTestUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-100"
              >
                <Download size={14} /> Download preview
              </a>
            )}
          </div>
        </div>

        <details className="border-t border-white/10 pt-2">
          <summary className="cursor-pointer text-[11px] font-black text-slate-400">Original-video lip-sync fallback</summary>
          <div className="mt-3 grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Uploaded video + Lip sync</span>
              <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-normal ${avatarStatus === "APPROVED" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : avatarStatus === "PREVIEW_READY" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}`}>
                {avatarApprovalLabel(avatarStatus)}
              </span>
            </div>

            {avatarPreviewUrl && (
              <video
                controls
                playsInline
                preload="metadata"
                src={avatarPreviewUrl}
                className="max-h-72 w-full bg-black object-contain"
              />
            )}

            <div className="flex flex-wrap gap-2">
              {mode === "dalai_llama" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!generatingAvatarPreview && !avatarPreviewBlockedReason) onGenerateAvatarPreview?.();
                  }}
                  disabled={generatingAvatarPreview}
                  aria-disabled={Boolean(avatarPreviewBlockedReason) || generatingAvatarPreview}
                  title={avatarPreviewBlockedReason || "Create an 8-second lip-sync preview from the uploaded video and approved cloned voice"}
                  className={`creator-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-white ${avatarPreviewBlockedReason || generatingAvatarPreview ? "opacity-50" : ""}`}
                >
                  {generatingAvatarPreview ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  {generatingAvatarPreview ? "Creating lip-sync preview" : avatarPreviewUrl ? "Retry lip-sync preview" : "Create lip-sync preview"}
                </button>
              )}
              {avatarStatus === "PREVIEW_READY" && (
                <button
                  type="button"
                  onClick={() => onAvatarDecision?.("APPROVE")}
                  disabled={updatingAvatarApproval}
                  className="creator-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                >
                  {updatingAvatarApproval ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve avatar
                </button>
              )}
              {["PREVIEW_READY", "APPROVED"].includes(avatarStatus) && (
                <button
                  type="button"
                  onClick={() => onAvatarDecision?.("REJECT")}
                  disabled={updatingAvatarApproval}
                  className="creator-control inline-flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"
                >
                  <RefreshCw size={14} /> Reject and retry
                </button>
              )}
            </div>
          </div>
        </details>

        {hasKit && (
          <details className="border-t border-white/10 pt-2">
            <summary className="cursor-pointer text-[11px] font-black text-slate-400">Saved avatar identifiers</summary>
            <div className="mt-2 grid gap-1.5 rounded-lg border border-emerald-300/15 bg-emerald-400/[0.055] p-2 text-[11px] font-semibold text-emerald-50">
              <FounderKitId label="Avatar" value={normalized.avatarId} />
              <FounderKitId label={clientRvcSelected ? "Adapter voice" : voiceModel === "fal_minimax_voice_clone" ? "MiniMax clone" : "Provider voice"} value={providerVoiceId} />
              <FounderKitId label={clientRvcSelected ? "Client profile" : "Voice profile"} value={clientRvcSelected ? voiceProfileId : normalized.voiceId} />
              <FounderKitId label="Portrait" value={normalized.portraitEmbeddingId} />
              <FounderKitId label="Face" value={normalized.facialFeatureEmbeddingId} />
              <FounderKitId label="Voice emb." value={normalized.voiceEmbeddingId} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function FounderKitId({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="shrink-0 text-emerald-100/70">{label}</span>
      <span className="truncate font-black text-emerald-50">{value}</span>
    </div>
  );
}

function FounderFlowStatus({ label, value, ready = false }) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <span className="block truncate text-[9px] font-black uppercase text-slate-500">{label}</span>
      <span className={`mt-0.5 block truncate text-[11px] font-black ${ready ? "text-emerald-200" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function reusableAvatarKey(avatar = {}) {
  return firstText(avatar.sourceScriptId, avatar.selectionKey, avatar.id, avatar.avatarId);
}

function reusableAvatarLabel(avatar = {}) {
  const name = firstText(avatar.name, "Founder avatar");
  const cloneId = firstText(avatar.providerVoiceId, avatar.avatarId);
  if (!cloneId) return name;
  const shortId = cloneId.length > 12 ? `${cloneId.slice(0, 8)}...` : cloneId;
  return `${name} - ${shortId}`;
}

function VideoFinishingControls({ plan, onChange }) {
  const update = (patch) => onChange?.(normalizeVideoFinishingPlan({ ...plan, ...patch }));
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 lg:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
          <SlidersHorizontal size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">Video finishing</p>
          <p className="mt-0.5 text-[11px] font-black uppercase tracking-normal text-slate-500">Music, sound, captions</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-normal text-slate-500">
            <Music2 size={12} /> Music
          </span>
          <select
            value={plan.backgroundMusicMode}
            onChange={(event) => update({ backgroundMusicMode: event.target.value })}
            className="creator-input h-10 w-full px-3 text-xs font-bold"
          >
            <option value="auto">Auto score</option>
            <option value="energetic">Energetic beat</option>
            <option value="warm_cinematic">Warm cinematic</option>
            <option value="documentary">Documentary bed</option>
            <option value="none">No music</option>
          </select>
        </label>
        <label className="min-w-0">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-normal text-slate-500">
            <Volume2 size={12} /> Music level
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={plan.musicVolume}
            onChange={(event) => update({ musicVolume: Number(event.target.value) })}
            className="mt-2 w-full accent-cyan-400"
          />
          <p className="mt-1 text-[11px] font-bold text-slate-500">{plan.musicVolume}%</p>
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Voice mix</span>
          <select
            value={plan.voiceMixMode}
            onChange={(event) => update({ voiceMixMode: event.target.value })}
            className="creator-input h-10 w-full px-3 text-xs font-bold"
          >
            <option value="balanced">Balanced</option>
            <option value="speech_forward">Speech forward</option>
            <option value="music_forward">Music forward</option>
            <option value="ambient_only">Ambient only</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <FinishingTextarea
          label="Music note"
          value={plan.backgroundMusicPrompt}
          placeholder="Warm tabla pulse, modern kitchen rhythm..."
          onChange={(value) => update({ backgroundMusicPrompt: value })}
        />
        <FinishingTextarea
          label="Ambience"
          value={plan.ambiencePrompt}
          placeholder="Soft kitchen room tone, light utensil detail..."
          onChange={(value) => update({ ambiencePrompt: value })}
        />
        <FinishingTextarea
          label="Sound effects"
          value={plan.soundFxPrompt}
          placeholder="Subtle whoosh on cuts, gentle grain pour..."
          onChange={(value) => update({ soundFxPrompt: value })}
        />
      </div>

      <div className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <label className="inline-flex items-center gap-2 text-xs font-black text-cyan-50">
            <input
              type="checkbox"
              checked={Boolean(plan.imageLedAdMode)}
              onChange={(event) => update({
                imageLedAdMode: event.target.checked,
                useStoryboardReferences: event.target.checked ? true : plan.useStoryboardReferences,
                referenceImageMode: event.target.checked ? plan.referenceImageMode || "product_motion_anchor" : plan.referenceImageMode,
              })}
              className="h-3.5 w-3.5 accent-cyan-500"
            />
            Image-led product ad
          </label>
          <label className="min-w-[13rem]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-cyan-100/70">Reference style</span>
            <select
              value={plan.referenceImageMode}
              onChange={(event) => update({ referenceImageMode: event.target.value })}
              className="creator-input h-9 w-full px-3 text-xs font-bold"
            >
              <option value="storyboard_anchor">Storyboard anchor</option>
              <option value="product_packshot">Product packshot</option>
              <option value="product_motion_anchor">Product motion anchor</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-cyan-100/80">
          Use this for D2C ads where a generated product image should become the visual anchor for video motion, like slow-motion pouring, falling butter, macro texture, or multi-angle product movement.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <FinishingTextarea
            label="Product motion"
            value={plan.productMotionPrompt}
            placeholder="Slow-motion butter falling on hot toast, macro texture, rich highlights..."
            onChange={(value) => update({ productMotionPrompt: value })}
          />
          <FinishingTextarea
            label="Voice/dialogue"
            value={plan.voiceDialoguePrompt}
            placeholder="Warm founder voiceover, concise product benefit, natural pauses..."
            onChange={(value) => update({ voiceDialoguePrompt: value })}
          />
          <FinishingTextarea
            label="Editor plan"
            value={plan.editingPlanPrompt}
            placeholder="Cut on beat, hold packshot, verify SRT, balance voice/music/SFX..."
            onChange={(value) => update({ editingPlanPrompt: value })}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] font-black text-slate-200">
          <input
            type="checkbox"
            checked={Boolean(plan.burnCaptions)}
            onChange={(event) => update({ burnCaptions: event.target.checked })}
            className="h-3.5 w-3.5 accent-cyan-500"
          />
          Burn captions
        </label>
        <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] font-black text-slate-200">
          <input
            type="checkbox"
            checked={Boolean(plan.useMixedAudio)}
            onChange={(event) => update({ useMixedAudio: event.target.checked })}
            className="h-3.5 w-3.5 accent-cyan-500"
          />
          Use mix
        </label>
        <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] font-black text-slate-200">
          <input
            type="checkbox"
            checked={Boolean(plan.requireImageAnchors)}
            onChange={(event) => update({ requireImageAnchors: event.target.checked })}
            className="h-3.5 w-3.5 accent-cyan-500"
          />
          Require image anchors
        </label>
      </div>
    </div>
  );
}

function FinishingTextarea({ label, value, placeholder, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</span>
      <textarea
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder={placeholder}
        className="creator-input min-h-[4.25rem] w-full resize-none px-3 py-2 text-xs"
      />
    </label>
  );
}

function PaidGenerationConfirmDialog({ action, onCancel, onConfirm }) {
  if (!action) return null;
  const sceneAction = action.type === "scene";
  const walletCharge = moneyValue(action.walletChargeInr);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="paid-generation-title">
      <div className="w-full max-w-md rounded-lg border border-cyan-300/20 bg-[#0b1220] shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-200"><CircleDollarSign size={15} /> Paid generation</p>
            <h3 id="paid-generation-title" className="mt-1 text-lg font-black text-white">{action.title}</h3>
          </div>
          <button type="button" onClick={onCancel} className="creator-control grid h-9 w-9 place-items-center text-slate-300" title="Cancel paid generation">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold leading-6 text-slate-300">
            {sceneAction
              ? "This replaces the existing shot. The last completed shot provides the charge estimate below."
              : "This creates a separate full-video run. It does not overwrite the accepted video you already have."}
          </p>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{sceneAction ? "Shot charge" : "Run charge"}</p>
            <p className="mt-1 text-lg font-black text-emerald-200">{formatInr(walletCharge)}</p>
          </div>
          {!sceneAction && <p className="text-xs font-medium leading-5 text-slate-400">The package starts at {formatInr(walletCharge)}. Any later confirmed paid action is charged separately.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 p-4">
          <button type="button" onClick={onCancel} className="creator-control px-4 py-2 text-sm font-bold text-slate-200">Cancel</button>
          <button type="button" onClick={onConfirm} className="creator-primary px-4 py-2 text-sm font-black text-white">Generate and charge {formatInr(walletCharge)}</button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const toneClass = {
    cyan: "text-cyan-200 bg-cyan-400/10 border-cyan-300/20",
    emerald: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20",
    purple: "text-purple-200 bg-purple-400/10 border-purple-300/20",
    amber: "text-amber-200 bg-amber-400/10 border-amber-300/20",
    slate: "text-slate-200 bg-white/[0.04] border-white/10",
  }[tone] || "text-slate-200 bg-white/[0.04] border-white/10";
  return (
    <div className={`min-h-[5rem] rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-normal opacity-80">
        <Icon size={14} /> {label}
      </div>
      <p className="mt-2 truncate text-lg font-black text-white">{value || "-"}</p>
    </div>
  );
}

function MiniStyle({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value || "-"}</p>
    </div>
  );
}

function ReferenceImagePanel({ assets = [], details = "", error = "", uploading = false, onDetailsChange, onUpload }) {
  return (
    <div className="border-b border-white/10 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-200">
                <ImageIcon size={14} /> Reference anchors
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-400">{assets.length ? `${assets.length} attached` : "No image attached"}</p>
            </div>
            <label className="creator-control inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              Upload image
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onUpload} />
            </label>
          </div>
          <textarea
            value={details}
            onChange={(event) => onDetailsChange?.(event.target.value)}
            rows={3}
            placeholder="Product, hair, wardrobe, background, logo placement, texture, claims to preserve"
            className="creator-input w-full resize-none px-3 py-2 text-sm font-semibold leading-5"
          />
          {error && <p className="mt-2 text-xs font-bold text-rose-200">{error}</p>}
        </div>
        <div className="grid min-h-[8rem] gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {assets.length ? assets.map((asset, index) => (
            <div key={referenceAssetKey(asset, index)} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
              {referenceAssetUrl(asset) ? (
                <img src={referenceAssetUrl(asset)} alt="" className="h-24 w-full bg-black/30 object-cover" />
              ) : (
                <div className="grid h-24 place-items-center bg-black/30 text-slate-500">
                  <ImageIcon size={18} />
                </div>
              )}
              <div className="min-w-0 px-3 py-2">
                <p className="truncate text-xs font-bold text-white">{asset.details || asset.label || asset.originalFilename || `Reference ${index + 1}`}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{asset.referenceRole || asset.assetRole || "product_visual_anchor"}</p>
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3 sm:col-span-2 xl:col-span-3">
              <p className="text-xs font-semibold leading-5 text-slate-400">Attached product images and notes lock product appearance, hair styling, wardrobe, and background continuity across the storyboard video.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SceneModePicker({ value = "auto", onChange }) {
  const modes = [
    { value: "auto", label: "Auto" },
    { value: "talking_head", label: "Avatar" },
    { value: "ai_generated", label: "AI" },
  ];
  return (
    <div className="mt-3 inline-flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
      {modes.map((mode) => {
        const selected = mode.value === value || (mode.value === "talking_head" && String(value).includes("talking")) || (mode.value === "ai_generated" && String(value).includes("ai"));
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange?.(mode.value)}
            className={`rounded-md px-2.5 py-1.5 text-[11px] font-black transition ${
              selected
                ? "bg-cyan-500 text-white"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function HybridSceneModeChoice({ value = "ask_speaking_scenes", onChange }) {
  return (
    <label className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5">
      <span className="block text-[10px] font-black uppercase text-slate-500">Founder coverage</span>
      <select
        value={normalizeHybridSceneModeValue(value) || "ask_speaking_scenes"}
        onChange={(event) => onChange?.(event.target.value)}
        className="creator-input mt-1.5 w-full px-2.5 py-2 text-xs font-bold text-white"
      >
        <option value="full_founder">Full Founder (60 sec)</option>
        <option value="ask_speaking_scenes">Ask on speaking scenes</option>
        <option value="auto_mix">Auto mix</option>
        <option value="human_first">Human first</option>
        <option value="ai_first">AI first</option>
      </select>
    </label>
  );
}

function JobMiniPanel({ label, job, isLoading }) {
  const status = statusValue(job?.status || (isLoading ? "RUNNING" : "WAITING"));
  const progress = Math.max(0, Math.min(100, Number(job?.progress ?? job?.percent ?? 0)));
  const message = job?.message || job?.errorMessage || job?.result?.message || job?.outputPayload?.message || "";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-black text-white">{label}</p>
        <StatusPill status={status} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${terminalStatuses.has(status) ? 100 : progress || (isLoading ? 18 : 0)}%` }} />
      </div>
      {message && <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-400">{message}</p>}
    </div>
  );
}

function AudioAssetCard({ asset = {}, onRefresh }) {
  const label = firstText(asset.layerType, asset.assetKind, asset.type, "audio");
  const url = firstText(asset.assetUrl, asset.signedUrl, asset.publicUrl, asset.url);
  const contentType = firstText(asset.contentType, "audio/mpeg");
  const status = firstText(asset.status, asset.state, asset.metadata?.status, url ? "SAVED" : "");
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-black text-white">{audioAssetLabel(label)}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {status && (
            <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-emerald-100">
              {status.replace(/_/g, " ")}
            </span>
          )}
          <span className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-cyan-100">
            {contentType.replace("audio/", "")}
          </span>
        </div>
      </div>
      {url ? (
        <audio src={url} controls onError={() => onRefresh?.(url)} className="w-full" />
      ) : (
        <p className="text-xs font-semibold text-slate-500">Audio URL is not ready yet.</p>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-xs font-black text-cyan-100 hover:text-white"
        >
          <Download size={13} /> Open asset
        </a>
      )}
    </div>
  );
}

function FreeMusicSelectionPanel({ plan = {} }) {
  const sources = firstArray(plan.candidateSources, plan.candidate_sources);
  const query = firstText(plan.searchQuery, plan.query, plan.prompt);
  const licensePolicy = firstText(plan.licensePolicy, plan.license_policy);
  return (
    <div className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.055] p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-white">Free licensed music plan</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-50/80">{query}</p>
        </div>
        <span className="rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-emerald-100">
          Verify license
        </span>
      </div>
      {sources.length > 0 && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {sources.slice(0, 4).map((source, index) => {
            const url = firstText(source.searchUrl, source.url, source.sourceUrl);
            return (
              <a
                key={`${source.source || index}-${url}`}
                href={url || undefined}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-white/10 bg-black/15 p-2 text-xs font-bold text-emerald-50 hover:border-emerald-200/35"
              >
                <span className="block text-sm font-black text-white">{firstText(source.source, source.name, `Source ${index + 1}`)}</span>
                <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-emerald-50/70">
                  {firstText(source.licenseNote, source.note, "Check commercial-use license and attribution before final delivery.")}
                </span>
              </a>
            );
          })}
        </div>
      )}
      {licensePolicy && <p className="mt-3 text-[11px] font-semibold leading-5 text-emerald-50/70">{licensePolicy}</p>}
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = statusValue(status);
  const tone = statusTone(normalized);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-normal ${tone}`}>
      {normalized === "RUNNING" || normalized === "QUEUED" || normalized === "PENDING" ? <Loader2 size={12} className="animate-spin" /> : null}
      {normalized}
    </span>
  );
}

function humanWorkOrderStatus(order) {
  return String(order?.status || "NOT_SUBMITTED").toUpperCase();
}

function humanStatusLabel(status) {
  return String(status || "NOT_SUBMITTED").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanWorkOrderDeliveryUrl(order = {}) {
  const delivery = firstObject(order?.deliveryPayload, order?.delivery_payload, order?.result, order?.outputPayload);
  return firstText(
    order?.editedVideoUrl,
    order?.edited_video_url,
    delivery?.editedVideoUrl,
    delivery?.edited_video_url,
    delivery?.videoUrl,
    delivery?.video_url,
    delivery?.finalVideoUrl,
    delivery?.final_video_url,
    delivery?.downloadUrl,
    delivery?.download_url
  );
}

function humanWorkOrderRevisionCount(order = {}) {
  const conversation = firstArray(order?.conversation, order?.messages, order?.deliveryPayload?.conversation);
  return conversation.filter((message) => {
    const role = String(message?.authorRole || message?.author_role || message?.role || "").toUpperCase();
    const type = String(message?.type || message?.messageType || message?.message_type || "").toUpperCase();
    const text = String(message?.message || message?.text || "").toUpperCase();
    return role === "CREATOR" && (type.includes("CHANGE") || text.includes("CHANGE") || text.includes("REVISION"));
  }).length;
}

function normalizeSceneRows(videoRun = {}, screenplayScenes = []) {
  const backendScenes = firstArray(
    videoRun?.scenes,
    videoRun?.sceneClips,
    videoRun?.clips,
    videoRun?.timeline?.scenes,
    videoRun?.renderManifest?.scenes
  );
  const screenplayRows = arrayValue(screenplayScenes);
  const source = backendScenes.length ? backendScenes : screenplayRows;
  return source.map((rawScene, index) => {
    const rawSceneNumber = Number(rawScene?.sceneNumber || rawScene?.scene_number || rawScene?.shotNumber || rawScene?.shot_number || index + 1);
    const screenplayScene = screenplayRows.find((candidate, candidateIndex) => Number(
      candidate?.sceneNumber || candidate?.scene_number || candidate?.shotNumber || candidate?.shot_number || candidateIndex + 1
    ) === rawSceneNumber) || {};
    const scene = { ...screenplayScene, ...rawScene };
    const sceneNumber = Number(scene?.sceneNumber || scene?.scene_number || scene?.shotNumber || scene?.shot_number || index + 1);
    const id = String(scene?.id || scene?.sceneId || scene?.scene_id || scene?.clipId || scene?.clip_id || `scene-${sceneNumber || index + 1}`);
    const prompt = firstText(
      scene?.seedancePrompt,
      scene?.seedance_prompt,
      scene?.providerPrompt,
      scene?.provider_prompt,
      scene?.assetGenerationPrompt,
      scene?.sketchPrompt,
      scene?.visualPrompt,
      scene?.action,
      scene?.description
    );
    return {
      ...scene,
      id,
      sceneNumber,
      title: firstText(scene?.title, scene?.beatTitle, scene?.beat_title, scene?.narrativeBeat, `Scene ${sceneNumber || index + 1}`),
      prompt,
      action: firstText(scene?.action, scene?.primaryCharacterAction, scene?.primaryActorAction),
      purpose: firstText(scene?.purpose, scene?.retentionGoal, scene?.creatorDirection),
      generationMode: firstText(scene?.generationMode, scene?.generation_mode, scene?.assetCaptureMode, scene?.asset_capture_mode),
      brollStyle: firstText(scene?.brollStyle, scene?.broll_style),
      captionStyle: firstText(scene?.captionStyle, scene?.caption_style),
      durationSeconds: Number(scene?.durationSeconds || scene?.duration_seconds || secondsBetween(scene?.startTime, scene?.endTime) || 15),
      aspectRatio: firstText(scene?.aspectRatio, scene?.aspect_ratio, videoRun?.aspectRatio, videoRun?.aspect_ratio),
      status: statusValue(scene?.status || scene?.clipStatus || scene?.clip_status || scene?.renderStatus || (backendScenes.length ? "QUEUED" : "PLANNED")),
      videoUrl: clipVideoUrl(scene),
      operationId: firstText(scene?.providerOperationId, scene?.provider_operation_id, scene?.operationName, scene?.taskId, scene?.task_id),
      revisions: firstArray(scene?.revisions, scene?.chatRevisions, scene?.chat_revisions, scene?.messages),
    };
  });
}

function clipVideoUrl(scene = {}) {
  const directVideoUrl = firstText(
    scene?.videoUrl,
    scene?.video_url,
    scene?.clipUrl,
    scene?.clip_url,
    scene?.videoAsset?.publicUrl,
    scene?.videoAsset?.signedUrl
  );
  if (directVideoUrl) return directVideoUrl;
  const genericUrl = firstText(
    scene?.assetUrl,
    scene?.asset_url,
    scene?.publicUrl,
    scene?.public_url,
    scene?.signedUrl,
    scene?.signed_url,
    scene?.asset?.publicUrl,
    scene?.asset?.signedUrl
  );
  if (!genericUrl) return "";
  const explicitImageUrl = sceneImageUrl(scene);
  if (explicitImageUrl && genericUrl === explicitImageUrl) return "";
  const mediaHint = firstText(scene?.contentType, scene?.content_type, scene?.mimeType, scene?.mime_type, scene?.objectKey, scene?.object_key, genericUrl).toLowerCase();
  if (mediaHint.includes("video/") || /\.(mp4|webm|mov|m3u8)(?:$|[?#])/i.test(mediaHint)) return genericUrl;
  return isReadyStatus(scene?.status) ? genericUrl : "";
}

function sceneImageUrl(scene = {}) {
  return firstText(
    sceneProductionImageUrl(scene),
    scene?.storyboardImageUrl,
    scene?.storyboard_image_url,
    scene?.generatedImageUrl,
    scene?.generated_image_url,
    scene?.generatedProductImageUrl,
    scene?.generated_product_image_url,
    scene?.imageAnchorUrl,
    scene?.image_anchor_url,
    scene?.referenceImageUrl,
    scene?.reference_image_url,
    scene?.storyboardImage?.publicUrl,
    scene?.storyboardImage?.signedUrl,
    scene?.imageAsset?.publicUrl,
    scene?.imageAsset?.signedUrl,
    scene?.imageUrl,
    scene?.image_url
  );
}

function sceneProductionImageUrl(scene = {}) {
  return firstText(
    scene?.productionImageUrl,
    scene?.production_image_url,
    scene?.generatedProductImageUrl,
    scene?.generated_product_image_url,
    scene?.imageAnchorUrl,
    scene?.image_anchor_url,
    scene?.productionImage?.publicUrl,
    scene?.productionImage?.signedUrl
  );
}

function mediaUrlFromAsset(asset = {}) {
  return firstText(
    asset?.assetUrl,
    asset?.signedUrl,
    asset?.publicUrl,
    asset?.url,
    asset?.href
  );
}

function productSceneFrameAsset(scene = {}) {
  const candidates = [
    scene?.productionImage,
    scene?.generatedProductImage,
    scene?.generated_product_image,
    ...firstArray(scene?.generatedProductImageAssets, scene?.generated_product_image_assets),
    scene?.productImageAsset,
  ].filter((asset) => asset && typeof asset === "object");
  const explicit = candidates.find((asset) => {
    const role = firstText(
      asset?.referenceRole,
      asset?.reference_role,
      asset?.assetKind,
      asset?.asset_kind,
      asset?.assetType,
      asset?.asset_type
    ).toLowerCase();
    return role.includes("scene") || role.includes("generated") || role.includes("production");
  });
  if (explicit) return explicit;
  const productionImageUrl = sceneProductionImageUrl(scene);
  const productionObjectKey = firstText(
    scene?.productionImageObjectKey,
    scene?.production_image_object_key,
    scene?.imageKind === "production" ? scene?.objectKey : "",
    scene?.image_kind === "production" ? scene?.object_key : ""
  );
  if (!productionImageUrl && !productionObjectKey) return {};
  return {
    assetId: firstText(scene?.productionImageAssetId, scene?.production_image_asset_id, scene?.imageAssetId, scene?.image_asset_id),
    bucket: firstText(scene?.productionImageBucket, scene?.production_image_bucket, scene?.bucket),
    objectKey: productionObjectKey,
    contentType: firstText(scene?.productionImageContentType, scene?.contentType, "image/jpeg"),
    assetUrl: productionImageUrl,
    signedUrl: productionImageUrl,
    publicUrl: productionImageUrl,
    assetType: "PRODUCT_SCENE_FRAME",
    assetKind: "generated_product_scene_frame",
    referenceRole: "generated_product_scene_frame",
  };
}

function canonicalProductReferenceUrls(videoRun = {}, screenplay = {}, assets = []) {
  const productBrief = firstObject(
    screenplay?.scriptJson?.productIntelligenceBrief,
    screenplay?.scriptJson?.creatorContext?.productIntelligenceBrief,
    screenplay?.productIntelligenceBrief
  );
  const productUnderstanding = firstObject(productBrief?.productUnderstanding);
  return uniqueTextValues(
    arrayValue(videoRun?.productImageUrls),
    arrayValue(videoRun?.referenceImageUrls),
    arrayValue(videoRun?.renderManifest?.productImageUrls),
    arrayValue(screenplay?.scriptJson?.productImageUrls),
    arrayValue(screenplay?.scriptJson?.referenceImageUrls),
    arrayValue(screenplay?.scriptJson?.creatorContext?.productImageUrls),
    arrayValue(screenplay?.scriptJson?.creatorContext?.referenceImageUrls),
    arrayValue(productBrief?.sourceProductImageUrls),
    arrayValue(productBrief?.imageUrls),
    arrayValue(productBrief?.productImageUrls),
    arrayValue(productBrief?.referenceImageUrls),
    arrayValue(productUnderstanding?.imageUrls),
    arrayValue(productBrief?.imageAssets).map((asset) => mediaUrlFromAsset(asset)),
    arrayValue(assets).map((asset) => mediaUrlFromAsset(asset))
  ).slice(0, 8);
}

function uniqueTextValues(...values) {
  const unique = [];
  values.flat(Infinity).forEach((value) => {
    const text = String(value || "").trim();
    if (text && !unique.includes(text)) unique.push(text);
  });
  return unique;
}

function productionImagePromptForScene(scene = {}, productLed = false) {
  const productShotPlan = firstObject(scene?.productShotPlan, scene?.product_shot_plan);
  const structuredPrompt = firstText(
    productShotPlan?.imagePrompt,
    productShotPlan?.cgiFramePrompt,
    productShotPlan?.cgi_frame_prompt
  );
  const plannedPrompt = firstText(
    structuredPrompt,
    scene?.productImagePrompt,
    scene?.product_image_prompt,
    scene?.productionImagePrompt,
    scene?.production_image_prompt,
    scene?.imagePrompt,
    scene?.storyboardImagePrompt,
    scene?.visualPrompt,
    scene?.visual,
    scene?.description,
    scene?.action
  );
  if (!productLed) return plannedPrompt;
  if (structuredPrompt) return structuredPrompt;
  const shotType = firstText(scene?.shotType, scene?.shot_type, "hero product shot");
  const nextShot = firstText(
    scene?.nextProductImagePrompt,
    scene?.next_product_image_prompt,
    productShotPlan?.nextShotImagePrompt,
    productShotPlan?.next_shot_image_prompt
  );
  return [
    "Ultra high-end photoreal CGI product advertising still.",
    `Shot execution: ${shotType}.`,
    plannedPrompt,
    "Preserve the exact supplied product silhouette, package geometry, logo, label, colors, material, and proportions.",
    "Use immaculate commercial lighting, physically plausible reflections and shadows, macro detail, premium set design, clean mobile-safe composition, and no storyboard labels or watermarks.",
    nextShot ? `Continuity into the next product frame: ${nextShot}` : "",
  ].filter(Boolean).join(" ");
}

function videoPromptForScene(scene = {}) {
  return firstText(
    scene?.videoDirectorPlan?.generationPrompt,
    scene?.video_director_plan?.generationPrompt,
    scene?.directorPlan?.generationPrompt,
    scene?.director_plan?.generationPrompt,
    scene?.videoPrompt,
    scene?.video_prompt,
    scene?.animationPrompt,
    scene?.animation_prompt,
    scene?.videoMotionPrompt,
    scene?.video_motion_prompt,
    scene?.providerPrompt,
    scene?.provider_prompt,
    scene?.seedancePrompt,
    scene?.seedance_prompt,
    scene?.prompt,
    scene?.action,
    scene?.description
  );
}

function videoPromptPayload(scene = {}, drafts = {}, soundDrafts = {}, productLed = false) {
  const prompt = String(drafts?.[scene?.id] ?? videoPromptForScene(scene)).trim();
  const soundPrompt = String(soundDrafts?.[scene?.id] ?? soundPromptForScene(scene)).trim();
  const videoDirectorPlan = firstObject(
    scene?.videoDirectorPlan,
    scene?.video_director_plan,
    scene?.directorPlan,
    scene?.director_plan
  );
  return {
    prompt,
    providerPrompt: prompt,
    videoPrompt: prompt,
    animationPrompt: prompt,
    videoMotionPrompt: prompt,
    videoDirectorPlan,
    cameraMovement: firstText(scene?.cameraMovement, scene?.cameraMove, scene?.motion),
    negativePrompt: firstText(scene?.negativePrompt, scene?.negative_prompt),
    noHumans: Boolean(scene?.noHumans ?? scene?.no_humans),
    audioDescription: soundPrompt,
    soundPrompt,
    soundDesignPrompt: soundPrompt,
    soundDesign: firstObject(scene?.soundDesign, scene?.sound_design),
    ambientBedDescription: firstText(scene?.ambientBedDescription, scene?.ambient_bed_description),
    syncHitDescription: firstText(scene?.syncHitDescription, scene?.sync_hit_description),
    backgroundMusicCue: firstText(scene?.backgroundMusicCue, scene?.background_music_cue),
    generateAudio: Boolean(productLed || soundPrompt),
    generate_audio: Boolean(productLed || soundPrompt),
  };
}

function soundPromptForScene(scene = {}) {
  return firstText(
    scene?.audioDescription,
    scene?.audio_description,
    scene?.soundDescription,
    scene?.sound_description,
    scene?.soundPrompt,
    scene?.sound_prompt,
    scene?.soundDesignPrompt,
    scene?.sound_design_prompt,
    textFromStructuredValue(scene?.soundDesign),
    textFromStructuredValue(scene?.sound_design),
    scene?.ambientBedDescription,
    scene?.ambient_bed_description,
    scene?.syncHitDescription,
    scene?.sync_hit_description,
    scene?.backgroundMusicCue,
    scene?.background_music_cue,
    scene?.sfx,
    scene?.soundEffects
  );
}

function dialogueForScene(scene = {}) {
  return firstText(
    scene?.localizedDialogue,
    scene?.localized_dialogue,
    scene?.dialogueScript,
    scene?.dialogue_script,
    scene?.dialogueText,
    scene?.dialogue_text,
    scene?.spokenText,
    scene?.spoken_text,
    scene?.voiceover,
    scene?.voiceOver,
    scene?.voice_over,
    scene?.narration,
    textFromStructuredValue(scene?.dialogue),
    textFromStructuredValue(scene?.dialogueLines),
    textFromStructuredValue(scene?.dialogue_lines),
    textFromStructuredValue(scene?.voiceoverLines),
    textFromStructuredValue(scene?.voiceover_lines)
  );
}

function sceneDialogueAudioAsset(scene = {}) {
  return firstObject(
    scene.dialogueAudio,
    scene.dialogue_audio,
    scene.providerRequest?.dialogueAudioAsset,
    scene.provider_request?.dialogue_audio_asset
  );
}

function sceneDialogueAudioUrl(scene = {}) {
  const asset = sceneDialogueAudioAsset(scene);
  return firstText(
    scene.voiceTrack,
    scene.voice_track,
    asset.assetUrl,
    asset.signedUrl,
    asset.publicUrl,
    asset.url
  );
}

function combinedSceneDialogueAudioAsset(source = {}) {
  const safeSource = source || {};
  return firstObject(
    safeSource.combinedDialogueAudio,
    safeSource.combinedSceneDialogueAudio,
    safeSource.combined_dialogue_audio,
    safeSource.combined_scene_dialogue_audio,
    safeSource.videoRun?.combinedDialogueAudio,
    safeSource.videoRun?.combinedSceneDialogueAudio
  );
}

function combinedDialogueDownloadFilename(screenplay = {}, asset = {}) {
  const suppliedFilename = firstText(asset.downloadFilename, asset.download_filename);
  if (suppliedFilename) return suppliedFilename;
  const title = firstText(screenplay?.title, screenplay?.scriptJson?.projectTitle, "screenplay");
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "screenplay";
  return `${safeTitle}-all-dialogue.m4a`;
}

function sceneAvatarPortraitAsset(scene = {}) {
  return firstObject(
    scene.avatarPortraitAsset,
    scene.avatar_portrait_asset,
    scene.providerRequest?.avatarPortraitAsset,
    scene.provider_request?.avatar_portrait_asset
  );
}

function sceneAvatarPortraitUrl(scene = {}) {
  const asset = sceneAvatarPortraitAsset(scene);
  return firstText(
    scene.avatarPortraitUrl,
    scene.avatar_portrait_url,
    asset.assetUrl,
    asset.signedUrl,
    asset.publicUrl,
    asset.url
  );
}

function normalizedDialogueText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function textFromStructuredValue(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map(textFromStructuredValue).filter(Boolean).join("\n");
  }
  if (!value || typeof value !== "object") return "";
  const preferredKeys = [
    "text",
    "line",
    "dialogue",
    "spokenText",
    "spoken_text",
    "voiceover",
    "voiceOver",
    "narration",
    "description",
    "prompt",
    "ambient",
    "sfx",
    "soundEffect",
    "sound_effect",
    "music",
  ];
  const parts = preferredKeys
    .map((key) => textFromStructuredValue(value[key]))
    .filter(Boolean);
  return [...new Set(parts)].join("\n");
}

function finalVideoUrl(value = {}) {
  return firstText(
    value?.videoUrl,
    value?.video_url,
    value?.clipUrl,
    value?.clip_url,
    value?.finalVideoUrl,
    value?.final_video_url,
    value?.finalAssetUrl,
    value?.final_asset_url,
    value?.publicUrl,
    value?.public_url,
    value?.signedUrl,
    value?.signed_url,
    value?.finalVideo?.publicUrl,
    value?.finalVideo?.signedUrl,
    value?.finalVideo?.videoUrl,
    value?.finalVideo?.video_url,
    value?.finalVideo?.clipUrl,
    value?.finalVideo?.clip_url,
    value?.finalVideoAsset?.publicUrl,
    value?.finalVideoAsset?.signedUrl,
    value?.asset?.publicUrl,
    value?.asset?.signedUrl
  );
}

function videoAspectRatio(...values) {
  for (const value of values) {
    const aspectRatio = firstText(value?.aspectRatio, value?.aspect_ratio, value?.screenAspectRatio, value?.screen_aspect_ratio);
    if (aspectRatio) return aspectRatio;
    const screenType = firstText(value?.screenType, value?.screen_type);
    if (screenType) return screenType;
  }
  return "9:16";
}

function videoPlayerFrameClass(aspectRatio) {
  return isPortraitAspectRatio(aspectRatio)
    ? "mx-auto block aspect-[9/16] w-full max-w-[18.5rem]"
    : "aspect-video w-full";
}

function isPortraitAspectRatio(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.includes("vertical") || normalized === "9:16" || normalized === "9x16") return true;
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)/);
  return Boolean(match && Number(match[1]) < Number(match[2]));
}

function finalVideoVariantsFrom(...values) {
  const variants = [];
  for (const source of values.filter(Boolean)) {
    const candidates = [
      source,
      source?.result,
      source?.outputPayload,
      source?.output_payload,
    ].filter(Boolean);
    for (const value of candidates) {
      const directVariants = [
        ...firstArray(value?.finalVideoVariants, value?.final_video_variants),
        ...firstArray(value?.finalVideo?.variants, value?.renderManifest?.finalVideoVariants, value?.renderManifest?.final_video_variants),
        ...firstArray(value?.renderManifest?.finalVideo?.variants),
      ];
      for (const variant of directVariants) {
        const url = finalVideoUrl(variant);
        if (!url) continue;
        variants.push({
          ...variant,
          url,
          audioVariant: String(variant?.audioVariant || variant?.audio_variant || "VIDEO_GENERATED_AUDIO").toUpperCase(),
          description: firstText(variant?.label, variant?.description, variant?.audioVariantLabel),
        });
      }
    }
  }

  if (!variants.length) {
    const fallbackUrl = values.map((value) => finalVideoUrl(value)).find(Boolean);
    if (fallbackUrl) {
      variants.push({
        url: fallbackUrl,
        audioVariant: "VIDEO_GENERATED_AUDIO",
        description: "Video generated audio",
      });
    }
  }

  const seen = new Set();
  return variants.filter((variant) => {
    const key = `${variant.audioVariant}:${variant.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function finalAudioVariantLabel(value) {
  const variant = String(value || "").toUpperCase();
  if (variant === "CUSTOM_GENERATED_VOICE") return "Custom generated voice";
  if (variant === "VIDEO_GENERATED_AUDIO") return "Video generated audio";
  return variant.replace(/_/g, " ") || "Final video";
}

function finalVariantFilename(filename, audioVariant, index) {
  const suffix = String(audioVariant || "final").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const base = String(filename || "final-video.mp4");
  const extensionIndex = base.lastIndexOf(".");
  if (extensionIndex < 1) return `${base}-${suffix || index + 1}.mp4`;
  return `${base.slice(0, extensionIndex)}-${suffix || index + 1}${base.slice(extensionIndex)}`;
}

function srtArtifactFrom(...values) {
  for (const value of values) {
    const directFile = firstObject(value?.srtFile, value?.srt_file, value?.subtitleFile, value?.subtitle_file);
    const content = firstText(
      directFile?.content,
      value?.srt,
      value?.srtContent,
      value?.srt_content,
      value?.subtitles,
      value?.subtitleContent,
      value?.subtitle_content
    );
    if (content) {
      return {
        filename: firstText(directFile?.filename, directFile?.name, value?.srtFilename, "generated.srt"),
        content,
        cueCount: Number(directFile?.cueCount || directFile?.cue_count || value?.srtCueCount || value?.srt_cue_count || firstArray(value?.srtCues, value?.srt_cues).length || 0),
      };
    }
  }
  return null;
}

function pacingLabel(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("fast")) return "Fast";
  if (normalized.includes("slow") || normalized.includes("emotional")) return "Slow";
  if (normalized.includes("balanced")) return "Balanced";
  return value || "-";
}

function isActiveJob(job) {
  const status = statusValue(job?.status);
  if (!job || terminalStatuses.has(status)) return false;
  return ["PENDING", "QUEUED", "RUNNING", "PAUSED", "STARTED", "IN_PROGRESS", "GENERATING", "RENDERING", "PROCESSING"]
    .includes(status);
}

function hasGeneratedSceneClip(scene = {}) {
  return Boolean(clipVideoUrl(scene) || isReadyStatus(scene?.status) || scene?.bucket || scene?.objectKey || scene?.object_key);
}

function isSceneAccepted(scene = {}, acceptedClipKeys = {}, videoRun = {}) {
  if (scene?.accepted === true || scene?.clipAccepted === true || scene?.reviewAccepted === true) return true;
  if (isAcceptedStatus(scene?.reviewStatus || scene?.review_status || scene?.acceptanceStatus || scene?.acceptance_status)) return true;
  const key = clipReviewKey(scene, videoRun);
  return Boolean(key && acceptedClipKeys?.[key]);
}

function clipReviewKey(scene = {}, videoRun = {}) {
  const runId = firstText(videoRun?.runId, videoRun?.id, videoRun?.videoRunId);
  const sceneId = firstText(scene?.id, scene?.sceneId, scene?.scene_id, scene?.clipId, scene?.clip_id, `scene-${scene?.sceneNumber || ""}`);
  const clipVersion = firstText(
    scene?.providerOperationId,
    scene?.provider_operation_id,
    scene?.operationId,
    scene?.operationName,
    scene?.taskId,
    scene?.task_id,
    scene?.videoUrl,
    scene?.clipUrl,
    scene?.objectKey,
    scene?.object_key,
    scene?.updatedAt,
    scene?.updated_at,
    scene?.status
  );
  return [runId || "current", sceneId, clipVersion || "pending"].filter(Boolean).join(":");
}

function isAcceptedStatus(status) {
  return ["ACCEPTED", "APPROVED", "CLIP_ACCEPTED", "SCENE_ACCEPTED"].includes(statusValue(status));
}

function isReadyStatus(status) {
  return ["READY", "VIDEO_READY", "READY_FOR_REVIEW", "RENDERED", "COMPLETED", "APPROVED"].includes(statusValue(status));
}

function isApprovedStatus(status) {
  return ["APPROVED", "READY", "RENDERED", "COMPLETED"].includes(statusValue(status));
}

function sceneGenerationReason({
  hasScript,
  screenplayApproved,
  isGenerating,
  activeVideoJob,
}) {
  if (!hasScript) return "Generate a saved screenplay first.";
  if (!screenplayApproved) return "Approve the screenplay before video generation.";
  if (isGenerating || activeVideoJob) return "The full shot queue is already generating.";
  return "";
}

function finalRenderReason({
  hasRun,
  totalScenes,
  generatedCount,
  acceptedCount,
  allSceneClipsGenerated,
  allSceneClipsAccepted,
}) {
  if (!hasRun) return "Prepare the video run first";
  if (!totalScenes) return "Screenplay scenes are missing";
  if (!allSceneClipsGenerated) return `Generate all shot clips first (${generatedCount}/${totalScenes} ready)`;
  if (!allSceneClipsAccepted) return `Accept all shot clips before combining (${acceptedCount}/${totalScenes} accepted)`;
  return "Combine accepted shot clips into the complete video";
}

function finalVideoFilename(screenplay = {}, videoRun = {}) {
  const title = firstText(screenplay?.title, screenplay?.scriptJson?.projectTitle, videoRun?.title, "screenplay-video");
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "screenplay-video";
  return `${safeTitle}.mp4`;
}

function audioAssetsFrom(...sources) {
  const assets = [];
  const pushAsset = (asset, fallback = {}) => {
    if (!asset) return;
    if (typeof asset === "string") {
      const url = asset.trim();
      if (!url) return;
      assets.push({
        assetUrl: url,
        layerType: fallback.layerType || fallback.type || "audio",
        assetKind: fallback.assetKind || fallback.layerType || "audio",
        contentType: fallback.contentType || "audio/mpeg",
        status: fallback.status || "SAVED",
        source: fallback.source || "saved_run",
      });
      return;
    }
    if (typeof asset === "object") {
      assets.push({ ...fallback, ...asset });
    }
  };
  sources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    [
      source.videoRun,
      source.video_run,
      source.screenplayVideoRun,
      source.screenplay_video_run,
      source.run,
      source.result,
      source.outputPayload,
      source.output_payload,
    ].forEach((nested) => {
      if (nested && nested !== source && typeof nested === "object" && !Array.isArray(nested)) {
        audioAssetsFrom(nested).forEach((asset) => pushAsset(asset));
      }
    });
    [source.audioAssets, source.generatedAudioAssets].filter(Array.isArray).flat().forEach((asset) => pushAsset(asset));
    [source.audioPack?.assets, source.audio_pack?.assets].filter(Array.isArray).flat().forEach((asset) => pushAsset(asset));
    [source.audioProductionPlan?.generatedAudioAssets, source.audio_production_plan?.generatedAudioAssets].filter(Array.isArray).flat().forEach((asset) => pushAsset(asset));
    [source.editorHandoffPlan?.generatedAudioAssets, source.editingPlan?.generatedAudioAssets].filter(Array.isArray).flat().forEach((asset) => pushAsset(asset));
    pushAsset(source.audioPack?.dialogue?.asset, { layerType: "voiceover", status: source.audioPack?.dialogue?.status || "SAVED" });
    pushAsset(source.audio_pack?.dialogue?.asset, { layerType: "voiceover", status: source.audio_pack?.dialogue?.status || "SAVED" });
    pushAsset(source.audioProductionPlan?.dialogue?.asset, { layerType: "voiceover", status: source.audioProductionPlan?.dialogue?.status || "SAVED" });
    pushAsset(source.editingPlan?.dialogue?.asset, { layerType: "voiceover", status: source.editingPlan?.dialogue?.status || "SAVED" });
    pushAsset(source.audioPack?.backgroundMusic?.asset, { layerType: "music-bed", status: source.audioPack?.backgroundMusic?.status || "SAVED" });
    pushAsset(source.audioProductionPlan?.backgroundMusic?.asset, { layerType: "music-bed", status: source.audioProductionPlan?.backgroundMusic?.status || "SAVED" });
    pushAsset(source.dialogueAudio, { layerType: "voiceover", status: "SAVED" });
    pushAsset(source.backgroundMusic, { layerType: "music-bed", status: "SAVED" });
    pushAsset(source.voiceTrack, { layerType: "voiceover", status: "SAVED" });
    pushAsset(source.musicTrack, { layerType: "music-bed", status: "SAVED" });
  });
  const seen = new Set();
  return assets
    .filter((asset) => asset && typeof asset === "object")
    .filter(isAudioMediaAsset)
    .filter((asset) => {
      const key = firstText(asset.assetUrl, asset.signedUrl, asset.publicUrl, asset.url, asset.objectKey, JSON.stringify(asset));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function musicSelectionPlanFrom(...sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const nestedPlan = musicSelectionPlanFrom(
      source.videoRun,
      source.video_run,
      source.screenplayVideoRun,
      source.screenplay_video_run,
      source.run,
      source.result,
      source.outputPayload,
      source.output_payload
    );
    if (nestedPlan) return nestedPlan;
    const direct = firstObject(
      source.freeMusicSelectionPlan,
      source.free_music_selection_plan,
      source.backgroundMusicSelection,
      source.background_music_selection,
      source.audioPack?.backgroundMusic,
      source.audio_pack?.backgroundMusic,
      source.audioProductionPlan?.freeMusicSelectionPlan,
      source.audioProductionPlan?.freeMusicPlan,
      source.editorHandoffPlan?.freeMusicSelectionPlan,
      source.editingPlan?.freeMusicSelectionPlan
    );
    if (!direct || !Object.keys(direct).length) continue;
    if (isAudioMediaAsset(direct)) continue;
    const sourceType = normalizeMusicSource(firstText(direct.sourceType, direct.source_type, direct.musicSource, direct.music_source, "free_licensed"));
    const status = firstText(direct.status).toUpperCase();
    if (sourceType === "free_licensed" && (status.includes("SELECTION") || direct.searchQuery || direct.candidateSources)) {
      return direct;
    }
  }
  return null;
}

function isAudioMediaAsset(asset = {}) {
  return Boolean(
    firstText(asset.assetUrl, asset.signedUrl, asset.publicUrl, asset.url, asset.objectKey)
    || firstText(asset.contentType, asset.content_type).startsWith("audio/")
    || ["voiceover", "dialogue", "music-bed", "music", "audio"].includes(String(asset.layerType || asset.assetKind || asset.type || "").toLowerCase())
  );
}

function isDialogueAudioAsset(asset = {}) {
  const label = String(firstText(asset.layerType, asset.assetKind, asset.type, asset.metadata?.layerType)).toLowerCase();
  return label.includes("voice") || label.includes("dialogue");
}

function isMusicAudioAsset(asset = {}) {
  const label = String(firstText(asset.layerType, asset.assetKind, asset.type, asset.metadata?.layerType)).toLowerCase();
  return label.includes("music");
}

function audioStatusTitle({ hasDialogueAudio, hasMusicAudio, musicSelectionPlan, activeAudioJob }) {
  if (activeAudioJob) return "Preparing audio assets";
  if (hasDialogueAudio && hasMusicAudio) return "Dialogue and AI background music are ready";
  if (hasDialogueAudio && musicSelectionPlan?.status) return "Dialogue is ready; free music shortlist is prepared";
  if (hasDialogueAudio) return "Dialogue voiceover is ready";
  if (hasMusicAudio) return "AI background music is ready";
  if (musicSelectionPlan?.status) return "Free music shortlist is prepared";
  return "Audio assets are prepared";
}

function normalizeMusicSource(value = "free_licensed") {
  const normalized = String(value || "free_licensed").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (["ai", "ai_music", "ai_generated", "google_lyria", "lyria"].includes(normalized)) return "ai_generated";
  if (["none", "no_music", "off"].includes(normalized)) return "none";
  return "free_licensed";
}

function musicSourceLabel(value = "free_licensed") {
  const normalized = normalizeMusicSource(value);
  if (normalized === "ai_generated") return "AI music file";
  if (normalized === "none") return "no background music";
  return "free music shortlist";
}

function audioAssetLabel(value) {
  const normalized = String(value || "audio").replace(/[_-]+/g, " ").trim();
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusValue(status) {
  return String(status || "WAITING").trim().replace(/\s+/g, "_").toUpperCase();
}

function statusTone(status) {
  const normalized = statusValue(status);
  if (["COMPLETED", "READY", "READY_FOR_REVIEW", "RENDERED", "APPROVED"].includes(normalized)) {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }
  if (["FAILED", "ERROR", "CANCELLED", "CANCELED"].includes(normalized)) {
    return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  }
  if (["RUNNING", "QUEUED", "PENDING", "GENERATING", "RENDERING"].includes(normalized)) {
    return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
  }
  if (["WAITING", "PLANNED", "NEEDS_APPROVAL", "NEEDS_MANUAL_AVATAR_APPROVAL", "WAITING_FOR_MANUAL_AVATAR_APPROVAL"].includes(normalized)) {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }
  return "border-white/10 bg-white/[0.06] text-slate-200";
}

function providerLabel(provider) {
  const value = String(provider || "").trim().toLowerCase();
  if (["seedance", "seed_dance", "fal_seedance", "fal_ai_seedance"].includes(value)) return "DalaiLlama Video";
  if (value === "gemini_omni" || value === "google_omni" || value === "omni_flash" || value === "omini_flash" || value === "gemini_omni_flash") return "Gemini Omni Flash";
  if (value === "omini" || value === "omni" || value === "openai_omni" || value === "openai_omini") return "Omini";
  if (value === "dalai_llama" || value === "dallai_llama" || value === "local" || value === "open_source") return "DalaiLlama Avatar";
  if (value === "synthesia" || value === "synthesia_api") return "Synthesia API";
  if (value === "google_veo") return "Google Veo";
  if (value === "runway") return "Runway";
  if (value === "luma") return "Luma";
  return provider || "Gemini Omni Flash";
}

function aiSceneProvider(provider) {
  return normalizeVideoProvider(provider) === "omini" ? "omini" : "seedance";
}

function normalizeVideoProvider(provider) {
  const value = String(provider || "gemini_omni").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (value === "gemini_omni" || value === "google_omni" || value === "omni_flash" || value === "omini_flash" || value === "gemini_omni_flash" || value === "google_omni_flash") return "gemini_omni";
  if (value === "omini" || value === "omni" || value === "openai_omni" || value === "openai_omini") return "omini";
  if (value === "veo" || value === "google_veo" || value === "google_video" || value === "vertex_veo") return "gemini_omni";
  if (value === "dalai_llama" || value === "dallai_llama" || value === "local" || value === "open_source" || value === "opensource") return "seedance";
  if (value === "synthesia" || value === "synthesia_api") return "synthesia";
  if (value === "seedance" || value === "seed_dance" || value === "fal_seedance" || value === "fal_ai_seedance") return "seedance";
  return "seedance";
}

function defaultModelForProvider(provider) {
  const normalized = normalizeVideoProvider(provider);
  if (normalized === "google_veo") return "veo-3.1-generate-preview";
  if (normalized === "gemini_omni") return "gemini-omni-flash-preview";
  if (normalized === "omini") return "omini-video";
  if (normalized === "dalai_llama") return "ltx_video";
  if (normalized === "synthesia") return "synthesia-avatar-video";
  return "bytedance/seedance-2.0";
}

function compatibleModelForProvider(provider, model = "") {
  const normalizedProvider = normalizeVideoProvider(provider);
  const normalizedModel = String(model || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (!normalizedModel) return defaultModelForProvider(normalizedProvider);
  if (normalizedProvider === "gemini_omni" && !(normalizedModel.includes("gemini") || normalizedModel.includes("omni"))) {
    return defaultModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "omini" && !(normalizedModel.includes("omini") || normalizedModel.includes("omni"))) {
    return defaultModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "seedance" && !(normalizedModel.includes("seedance") || normalizedModel.includes("seed_dance"))) {
    return defaultModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "dalai_llama" && !(normalizedModel.includes("ltx") || normalizedModel.includes("liveportrait") || normalizedModel.includes("echo") || normalizedModel.includes("face") || normalizedModel.includes("avatar") || normalizedModel.includes("local"))) {
    return defaultModelForProvider(normalizedProvider);
  }
  if (normalizedProvider === "synthesia" && !(normalizedModel.includes("synthesia") || normalizedModel.includes("avatar") || normalizedModel.includes("digital"))) {
    return defaultModelForProvider(normalizedProvider);
  }
  return model || defaultModelForProvider(normalizedProvider);
}

function videoModelOptions(provider) {
  if (normalizeVideoProvider(provider) === "dalai_llama") {
    return [
      { value: "ltx_video", label: "LTX-Video" },
      { value: "liveportrait", label: "LivePortrait avatar" },
      { value: "echomimic_v2", label: "EchoMimic v2 avatar" },
    ];
  }
  if (normalizeVideoProvider(provider) === "synthesia") {
    return [
      { value: "synthesia-avatar-video", label: "Synthesia avatar video" },
    ];
  }
  if (normalizeVideoProvider(provider) === "google_veo") {
    return [
      { value: "veo-3.1-generate-preview", label: "Veo 3.1" },
      { value: "veo-3.1-fast-generate-preview", label: "Veo 3.1 Fast" },
    ];
  }
  if (normalizeVideoProvider(provider) === "gemini_omni") {
    return [
      { value: "gemini-omni-flash-preview", label: "Gemini Omni Flash" },
    ];
  }
  if (normalizeVideoProvider(provider) === "omini") {
    return [
      { value: "omini-video", label: "Omini Video" },
      { value: "omini-video-pro", label: "Omini Video Pro" },
    ];
  }
  return [
    { value: "bytedance/seedance-2.0", label: "Seedance 2.0" },
    { value: "bytedance/seedance-2.0/fast", label: "Seedance 2.0 Fast" },
  ];
}

function normalizeFounderAvatarProfile(...values) {
  const merged = {};
  const localModelSources = [];
  values.forEach((value) => {
    const source = firstObject(value);
    const embeddedProfile = firstObject(
      source.founderAvatarProfile,
      source.founderKit,
      source.avatarProfile,
      source.scriptJson?.founderAvatarProfile,
      source.scriptJson?.founderKit,
      source.scriptJson?.creatorContext?.founderAvatarProfile,
      source.scriptJson?.creatorContext?.founderKit,
      source.metadata?.founderAvatarProfile
    );
    const profile = Object.keys(embeddedProfile).length
      ? embeddedProfile
      : looksLikeFounderAvatarProfileSource(source)
        ? source
        : {};
    mergeFounderProfileFields(merged, profile);
    localModelSources.push(
      firstObject(profile.localModels, profile.localAvatarModels),
      firstObject(source.localModels, source.localAvatarModels),
      firstObject(source.scriptJson?.localModels, source.scriptJson?.localAvatarModels),
      firstObject(source.scriptJson?.creatorContext?.localModels, source.scriptJson?.creatorContext?.localAvatarModels)
    );
  });
  const localModels = normalizeFounderLocalModels(...localModelSources);
  const elevenLabsVoiceId = firstText(
    merged.elevenLabsVoiceId,
    merged.eleven_labs_voice_id,
    merged.proprietaryVoiceId
  );
  const sarvamVoiceId = firstText(
    merged.sarvamVoiceId,
    merged.sarvam_voice_id,
    merged.sarvamSpeakerId
  );
  if (localModels.voiceModel === "fal_minimax_voice_clone"
    || (localModels.voiceModel === "fal_elevenlabs_v3" && !elevenLabsVoiceId)) {
    localModels.voiceModel = "fal_chatterbox_multilingual";
  }
  const avatarProviderMode = normalizeAvatarProviderMode(firstText(
    merged.avatarProviderMode,
    merged.providerMode,
    merged.avatarProvider,
    merged.provider,
    "dalai_llama"
  ));
  const synthesiaAvatarId = firstText(merged.synthesiaAvatarId, merged.synthesia_avatar_id, avatarProviderMode === "synthesia" ? merged.avatarId : "");
  const synthesiaVoiceId = firstText(merged.synthesiaVoiceId, merged.synthesia_voice_id, avatarProviderMode === "synthesia" ? merged.voiceId : "");
  return {
    ...merged,
    providerMode: avatarProviderMode,
    avatarProviderMode,
    avatarProvider: avatarProviderMode,
    provider: avatarProviderMode,
    avatarId: firstText(merged.avatarId, synthesiaAvatarId),
    voiceId: firstText(merged.voiceId, synthesiaVoiceId),
    providerVoiceId: firstText(merged.providerVoiceId, merged.customVoiceId, merged.minimaxVoiceId, elevenLabsVoiceId, sarvamVoiceId),
    minimaxVoiceId: firstText(merged.minimaxVoiceId),
    synthesiaAvatarId,
    synthesiaVoiceId,
    portraitEmbeddingId: firstText(merged.portraitEmbeddingId, merged.portrait_embedding_id),
    facialFeatureEmbeddingId: firstText(merged.facialFeatureEmbeddingId, merged.facial_feature_embedding_id),
    voiceEmbeddingId: firstText(merged.voiceEmbeddingId, merged.voice_embedding_id),
    voiceProfileId: firstText(merged.voiceProfileId, merged.voice_profile_id, localModels.voiceProfileId),
    sourceUrl: firstText(merged.sourceUrl, merged.source_url, merged.publicUrl, merged.signedUrl, merged.url),
    sourceAsset: firstObject(merged.sourceAsset, merged.source_asset, merged.asset),
    referenceTranscript: firstText(merged.referenceTranscript, merged.reference_transcript),
    voicePreviewText: firstText(
      merged.voicePreviewText,
      merged.previewText,
      merged.voice_preview_text,
      "Aap procrastinate isliye nahi karte kyunki aap mein willpower ki kami hai. Aksar dimaag stress se bachne ki koshish kar raha hota hai."
    ),
    avatarScript: firstText(merged.avatarScript, merged.avatar_script, merged.fullSpokenText, merged.spokenText, merged.spoken_text),
    spokenText: firstText(merged.spokenText, merged.spoken_text),
    pronunciationGuide: firstText(merged.pronunciationGuide, merged.pronunciation_guide),
    elevenLabsVoiceId,
    sarvamVoiceId,
    voiceApprovalStatus: firstText(merged.voiceApprovalStatus, merged.voice_approval_status, "NOT_REQUESTED").toUpperCase(),
    voicePreviewAsset: firstObject(merged.voicePreviewAsset, merged.voice_preview_asset),
    voiceEnhancement: firstObject(merged.voiceEnhancement, merged.voice_enhancement),
    voiceEnhancementStatus: firstText(merged.voiceEnhancementStatus, merged.voice_enhancement_status),
    voiceEnhancementApplied: Boolean(merged.voiceEnhancementApplied ?? merged.voice_enhancement_applied),
    voiceEnhancementProfile: firstText(merged.voiceEnhancementProfile, merged.voice_enhancement_profile),
    avatarPortraitStatus: firstText(merged.avatarPortraitStatus, merged.avatar_portrait_status, "NOT_REQUESTED").toUpperCase(),
    avatarPortraitAsset: firstObject(merged.avatarPortraitAsset, merged.avatar_portrait_asset),
    avatarPortraitUrl: firstText(merged.avatarPortraitUrl, merged.avatar_portrait_url),
    avatarPortraitSourceMode: firstText(merged.avatarPortraitSourceMode, merged.avatar_portrait_source_mode, "extract"),
    avatarPortraitPreparedAt: firstText(merged.avatarPortraitPreparedAt, merged.avatar_portrait_prepared_at),
    avatarMotionPrompt: firstText(merged.avatarMotionPrompt, merged.avatar_motion_prompt),
    avatarTestStatus: firstText(merged.avatarTestStatus, merged.avatar_test_status, "NOT_REQUESTED").toUpperCase(),
    avatarTestAsset: firstObject(merged.avatarTestAsset, merged.avatar_test_asset),
    avatarTestUrl: firstText(merged.avatarTestUrl, merged.avatar_test_url),
    avatarTestGeneratedAt: firstText(merged.avatarTestGeneratedAt, merged.avatar_test_generated_at),
    avatarTestRequestId: firstText(merged.avatarTestRequestId, merged.avatar_test_request_id),
    avatarTestModel: firstText(merged.avatarTestModel, merged.avatar_test_model),
    avatarPreviewStatus: firstText(merged.avatarPreviewStatus, merged.avatar_preview_status, "NOT_REQUESTED").toUpperCase(),
    avatarPreviewAsset: firstObject(merged.avatarPreviewAsset, merged.avatar_preview_asset),
    avatarPreviewUrl: firstText(merged.avatarPreviewUrl, merged.avatar_preview_url),
    avatarPreviewGeneratedAt: firstText(merged.avatarPreviewGeneratedAt, merged.avatar_preview_generated_at),
    avatarPreviewApprovedAt: firstText(merged.avatarPreviewApprovedAt, merged.avatar_preview_approved_at),
    avatarPreviewFingerprint: firstText(merged.avatarPreviewFingerprint, merged.avatar_preview_fingerprint),
    lipSyncProvider: firstText(merged.lipSyncProvider, merged.lip_sync_provider),
    lipSyncModel: firstText(merged.lipSyncModel, merged.lip_sync_model, localModels.lipSyncModel),
    exactFounderAudioAsset: firstObject(merged.exactFounderAudioAsset, merged.finalFounderAudioAsset, merged.exact_founder_audio_asset),
    finalFounderAudioAsset: firstObject(merged.finalFounderAudioAsset, merged.exactFounderAudioAsset, merged.final_founder_audio_asset),
    finalFounderAudioUrl: firstText(merged.finalFounderAudioUrl, merged.final_founder_audio_url),
    details: firstText(merged.details, merged.referenceDetails, merged.sourceDetails),
    language: firstText(merged.language, "Hinglish"),
    languageCode: firstText(merged.languageCode, merged.language_code, "hi-IN"),
    voiceLanguageMode: firstText(merged.voiceLanguageMode, merged.voice_language_mode, "english_indian"),
    voiceLanguage: firstText(merged.voiceLanguage, merged.voice_language, "English"),
    voiceLanguageCode: firstText(merged.voiceLanguageCode, merged.voice_language_code, "en-IN"),
    referenceLanguage: firstText(merged.referenceLanguage, merged.reference_language, "English"),
    minimaxLanguageBoost: firstText(merged.minimaxLanguageBoost, merged.minimax_language_boost, "English"),
    gpuProfile: firstText(merged.gpuProfile, merged.gpu_profile, "rtx_4060_8gb"),
    localModels,
    manualApprovalRequiredForFallback: merged.manualApprovalRequiredForFallback ?? merged.manual_approval_required_for_fallback ?? true,
    productionEnhancementEnabled: Boolean(merged.productionEnhancementEnabled ?? merged.production_enhancement_enabled),
    consentConfirmed: Boolean(merged.consentConfirmed ?? merged.consent_confirmed),
  };
}

function normalizeLanguageKey(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function dialogueLanguageOptionsForScene(scene = {}) {
  const variants = Array.isArray(scene?.dialogueVariants)
    ? scene.dialogueVariants
    : Array.isArray(scene?.dialogue_variants)
      ? scene.dialogue_variants
      : [];
  const options = [];
  const languageKeys = new Set();

  variants.forEach((variant) => {
    const language = firstText(variant?.language, variant?.dialogueLanguage);
    const dialogueText = firstText(
      variant?.dialogueText,
      variant?.dialogue_text,
      variant?.text
    );
    const languageKey = normalizeLanguageKey(language);
    if (!language || !dialogueText || languageKeys.has(languageKey)) return;
    languageKeys.add(languageKey);
    options.push({
      value: language,
      label: `${language} - ${compactDialogueOptionText(dialogueText)}`,
      languageCode: firstText(variant?.languageCode, variant?.language_code, "und"),
      dialogueRecordId: firstText(variant?.id, variant?.dialogueId, variant?.dialogue_id),
      rootDialogueId: firstText(variant?.rootDialogueId, variant?.root_dialogue_id),
      dialogueText,
      available: true,
      source: Boolean(variant?.source ?? variant?.isSource ?? variant?.is_source),
    });
  });

  DIALOGUE_LANGUAGE_OPTIONS.forEach((option) => {
    const languageKey = normalizeLanguageKey(option.value);
    if (languageKeys.has(languageKey)) return;
    options.push({
      ...option,
      label: `${option.label} - translate when cloning`,
      available: false,
    });
  });
  return options.length ? options : DIALOGUE_LANGUAGE_OPTIONS;
}

function compactDialogueOptionText(value, maxLength = 88) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

function dialogueLanguageOptionFor(value, languageCode, options = DIALOGUE_LANGUAGE_OPTIONS) {
  const customLanguage = String(value || "").trim();
  const languageKey = normalizeLanguageKey(value);
  const exactLanguage = options.find((option) => normalizeLanguageKey(option.value) === languageKey);
  if (exactLanguage) return exactLanguage;
  const codeKey = String(languageCode || "").trim().toLowerCase();
  if (customLanguage) {
    return {
      value: customLanguage,
      label: customLanguage,
      languageCode: codeKey || "und",
    };
  }
  const exactCode = options.find((option) => String(option.languageCode || "").toLowerCase() === codeKey);
  return exactCode || options[0];
}

function sceneVoiceMethodOptionFor(value) {
  const selected = String(value || "").trim().toLowerCase().replace(/-/g, "_");
  const exact = SCENE_VOICE_METHOD_OPTIONS.find((option) => option.value === selected);
  if (exact) return exact;
  return SCENE_VOICE_METHOD_OPTIONS[0];
}

function looksLikeFounderAvatarProfileSource(source = {}) {
  return Boolean(firstText(
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
    firstObject(source.localModels, source.localAvatarModels).voiceModel,
    firstObject(source.localModels, source.localAvatarModels).talkingAvatarModel,
    firstObject(source.localModels, source.localAvatarModels).lipSyncModel
  ));
}

function mergeFounderProfileFields(target, source = {}) {
  Object.entries(firstObject(source)).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    if (Array.isArray(value) && !value.length) return;
    if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) return;
    target[key] = value;
  });
  return target;
}

function normalizeFounderLocalModels(...values) {
  const merged = Object.assign({}, ...values.map(firstObject));
  const talkingAvatarModel = normalizeLocalTalkingAvatarModel(firstText(
    merged.talkingAvatarModel,
    merged.talking_avatar_model,
    merged.avatarModel,
    "fal_heygen_avatar4"
  ));
  const lipSyncModel = talkingAvatarModel === "fal_heygen_avatar4"
    ? "avatar_native"
    : normalizeLocalLipSyncModel(firstText(
      merged.lipSyncModel,
      merged.lipsyncModel,
      merged.lip_sync_model,
      "fal_latentsync"
    ));
  return {
    voiceModel: normalizeLocalVoiceModel(firstText(merged.voiceModel, merged.voice_model, "fal_minimax_voice_clone")),
    voiceProfileId: firstText(merged.voiceProfileId, merged.voice_profile_id),
    talkingAvatarModel,
    lipSyncModel,
    imageModel: normalizeLocalImageModel(firstText(merged.imageModel, merged.image_model, "gemini_storyboard")),
    lightingModel: normalizeLocalImageModel(firstText(merged.lightingModel, merged.lighting_model, "ic_lightning")),
    videoModel: normalizeLocalVideoModel(firstText(merged.videoModel, merged.video_model, "ltx_video")),
    avatarResolution: firstText(merged.avatarResolution, merged.avatar_resolution, "720p"),
    talkingStyle: firstText(merged.talkingStyle, merged.talking_style, "stable") === "expressive" ? "expressive" : "stable",
    gpuProfile: firstText(merged.gpuProfile, merged.gpu_profile, "rtx_4060_8gb"),
  };
}

function normalizeAvatarProviderMode(value = "dalai_llama") {
  const normalized = String(value || "dalai_llama").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "synthesia" || normalized === "synthesia_api") return "synthesia";
  if (normalized === "dalai_llama" || normalized === "dallai_llama" || normalized === "local" || normalized === "open_source" || normalized === "opensource") return "dalai_llama";
  return "dalai_llama";
}

function normalizeLocalVoiceModel(value = "fal_minimax_voice_clone") {
  const normalized = String(value || "fal_minimax_voice_clone").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("client_rvc") || normalized.includes("trained_client_voice") || normalized.includes("founder_female_v1")) return CLIENT_RVC_VOICE_MODEL;
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

function normalizeLocalTalkingAvatarModel(value = "fal_heygen_avatar4") {
  const normalized = String(value || "fal_heygen_avatar4").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("heygen") && (normalized.includes("avatar4") || normalized.includes("avatar_4"))) return "fal_heygen_avatar4";
  if (normalized.includes("happy_horse") || normalized.includes("happyhorse")) return "fal_happy_horse_v1_1";
  return "fal_heygen_avatar4";
}

function isSupportedVideoUpload(file) {
  if (String(file?.type || "").toLowerCase().startsWith("video/")) return true;
  return /\.(mp4|mov|m4v|webm|mkv|avi|mpeg|mpg)$/i.test(String(file?.name || ""));
}

function normalizeLocalLipSyncModel(value = "fal_latentsync") {
  const normalized = String(value || "fal_latentsync").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (["avatar_native", "native", "none"].includes(normalized)) return "avatar_native";
  if (normalized.includes("muse")) return "fal_musetalk";
  if (normalized.includes("fal") && normalized.includes("latent")) return "fal_latentsync";
  if (normalized.includes("latent")) return "fal_latentsync";
  if (normalized.includes("sync_lab") || normalized === "synclabs" || normalized === "sync_labs") return "sync_labs";
  if (normalized.includes("api") || normalized.includes("fallback") || normalized.includes("proprietary")) return "api_fallback";
  return "fal_latentsync";
}

function normalizeLocalImageModel(value = "gemini_storyboard") {
  const normalized = String(value || "gemini_storyboard").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("gemini") || normalized.includes("storyboard")) return "gemini_storyboard";
  if (normalized.includes("ic_light")) return "ic_lightning";
  return "flux_1_dev";
}

function normalizeLocalVideoModel() {
  return "fal_seedance";
}

function avatarProviderModeLabel(value = "dalai_llama") {
  return normalizeAvatarProviderMode(value) === "synthesia" ? "Synthesia API" : "DalaiLlama managed";
}

function voiceApprovalLabel(value = "NOT_REQUESTED") {
  const normalized = String(value || "NOT_REQUESTED").trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "PREVIEW_READY") return "Preview ready";
  if (normalized === "GENERATING") return "Generating";
  if (normalized === "REJECTED") return "Needs changes";
  return "Preview required";
}

function avatarApprovalLabel(value = "NOT_REQUESTED") {
  const normalized = String(value || "NOT_REQUESTED").trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "PREVIEW_READY") return "Review preview";
  if (normalized === "GENERATING") return "Generating";
  if (normalized === "REJECTED") return "Needs retry";
  return "Preview required";
}

function hasFounderAvatarIdentity(profile = {}) {
  const sourceAsset = firstObject(profile.sourceAsset, profile.source_asset, profile.asset);
  return Boolean(
    firstText(
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
    )
  );
}

function founderAvatarPayloadFrom(profile = {}) {
  const normalized = normalizeFounderAvatarProfile(profile);
  if (!hasFounderAvatarIdentity(normalized)) return {};
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

function normalizeProductionStyle(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "full_ai" || normalized === "all_ai") return "full_ai";
  return "hybrid";
}

function productionStyleLabelFor(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "full_ai" || normalized === "all_ai") return "Full AI";
  return "Hybrid";
}

function hybridSceneModeLabel(value) {
  const normalized = normalizeHybridSceneModeValue(value);
  if (normalized === "full_founder") return "Full Founder (60 sec)";
  if (normalized === "auto_mix") return "Auto mix";
  if (normalized === "human_first") return "Human first";
  if (normalized === "ai_first") return "AI first";
  return "Ask on speaking scenes";
}

function normalizeHybridSceneModeValue(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (["full_founder", "founder_only", "avatar_only", "talking_head_only"].includes(normalized)) return "full_founder";
  return normalized;
}

function resolvedSceneMode(scene = {}, overrides = {}, productionStyle = "hybrid", hybridSceneMode = "") {
  if (normalizeProductionStyle(productionStyle) === "full_ai") return "ai_generated";
  if (normalizeHybridSceneModeValue(hybridSceneMode) === "full_founder") return "talking_head";
  const override = overrides[scene.id];
  if (override && override !== "auto") return override;
  const normalized = String(scene.generationMode || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("talking")) return "talking_head";
  if (normalized.includes("ai") || normalized.includes("generate")) return "ai_generated";
  return "";
}

function resolvedSceneModeOverrides(scenes = [], overrides = {}, productionStyle = "hybrid", hybridSceneMode = "") {
  const fullAi = normalizeProductionStyle(productionStyle) === "full_ai";
  const fullFounder = normalizeHybridSceneModeValue(hybridSceneMode) === "full_founder";
  if (!fullAi && !fullFounder) return overrides || {};
  return arrayValue(scenes).reduce((next, scene, index) => {
    const sceneId = String(scene?.id || scene?.sceneId || scene?.scene_id || `scene-${index + 1}`);
    next[sceneId] = fullFounder ? "talking_head" : "ai_generated";
    return next;
  }, {});
}

function generationModeLabel(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("talking")) return "Avatar scene";
  if (normalized.includes("ai") || normalized.includes("generate")) return "AI scene";
  if (normalized.includes("record")) return "Recorded";
  return value;
}

function normalizeVideoFinishingPlan(plan = {}) {
  return {
    backgroundMusicMode: firstText(plan.backgroundMusicMode, plan.background_music_mode, "auto"),
    backgroundMusicPrompt: firstText(plan.backgroundMusicPrompt, plan.background_music_prompt),
    musicVolume: clampNumber(plan.musicVolume ?? plan.music_volume, 22, 0, 100),
    ambiencePrompt: firstText(plan.ambiencePrompt, plan.ambience_prompt, plan.ambientBedPrompt, plan.ambient_bed_prompt),
    soundFxPrompt: firstText(plan.soundFxPrompt, plan.sound_fx_prompt, plan.sfxPrompt, plan.sfx_prompt),
    voiceMixMode: firstText(plan.voiceMixMode, plan.voice_mix_mode, "balanced"),
    useStoryboardReferences: plan.useStoryboardReferences ?? plan.use_storyboard_references ?? true,
    imageLedAdMode: plan.imageLedAdMode ?? plan.image_led_ad_mode ?? false,
    referenceImageMode: normalizeReferenceImageMode(firstText(plan.referenceImageMode, plan.reference_image_mode, plan.storyboardReferenceMode, plan.storyboard_reference_mode, "storyboard_anchor")),
    requireImageAnchors: plan.requireImageAnchors ?? plan.require_image_anchors ?? false,
    productMotionPrompt: firstText(plan.productMotionPrompt, plan.product_motion_prompt),
    voiceDialoguePrompt: firstText(plan.voiceDialoguePrompt, plan.voice_dialogue_prompt, plan.dialoguePrompt, plan.dialogue_prompt),
    editingPlanPrompt: firstText(plan.editingPlanPrompt, plan.editing_plan_prompt),
    burnCaptions: plan.burnCaptions ?? plan.burn_captions ?? true,
    useMixedAudio: plan.useMixedAudio ?? plan.use_mixed_audio ?? true,
    audioMixStandards: normalizeAudioMixStandards(plan.audioMixStandards || plan.audio_mix_standards),
  };
}

function normalizeReferenceImageMode(value = "storyboard_anchor") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return ["storyboard_anchor", "product_packshot", "product_motion_anchor"].includes(normalized)
    ? normalized
    : "storyboard_anchor";
}

function normalizeAudioMixStandards(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_AUDIO_MIX_STANDARDS,
    ...source,
    dialogueTargetDb: clampNumber(source.dialogueTargetDb ?? source.dialogue_target_db, DEFAULT_AUDIO_MIX_STANDARDS.dialogueTargetDb, -24, 0),
    musicBedDb: clampNumber(source.musicBedDb ?? source.music_bed_db, DEFAULT_AUDIO_MIX_STANDARDS.musicBedDb, -48, 0),
    ambienceBedDb: clampNumber(source.ambienceBedDb ?? source.ambience_bed_db, DEFAULT_AUDIO_MIX_STANDARDS.ambienceBedDb, -48, 0),
    sfxPeakDb: clampNumber(source.sfxPeakDb ?? source.sfx_peak_db, DEFAULT_AUDIO_MIX_STANDARDS.sfxPeakDb, -30, 0),
    fadeMs: clampNumber(source.fadeMs ?? source.fade_ms, DEFAULT_AUDIO_MIX_STANDARDS.fadeMs, 0, 2000),
  };
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function formatSeconds(value) {
  const seconds = Number(value) || 0;
  if (!seconds) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function moneyValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number(fallback) || 0;
}

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(moneyValue(value));
}

function shotChargeForScene(scene = {}, index = 0, lineItems = []) {
  const sceneNumber = Number(firstText(scene.sceneNumber, scene.scene_number, scene.shotNumber, scene.shot_number, index + 1));
  const sceneId = firstText(scene.id, scene.sceneId, scene.scene_id, scene.shotId, scene.shot_id);
  const labelNumberPattern = new RegExp(`\\b(?:scene|shot)\\s*${sceneNumber}\\b`, "i");
  const item = arrayValue(lineItems).find((candidate) => {
    const type = String(candidate?.type || candidate?.chargeType || candidate?.charge_type || "").toUpperCase();
    const label = firstText(candidate?.label, candidate?.description, candidate?.name);
    const candidateSceneId = firstText(candidate?.sceneId, candidate?.scene_id, candidate?.shotId, candidate?.shot_id);
    const candidateNumber = Number(firstText(candidate?.sceneNumber, candidate?.scene_number, candidate?.shotNumber, candidate?.shot_number));
    return (
      type === "VIDEO_SCENE"
      || type === "SCENE"
      || type === "SHOT"
    ) && (
      (sceneId && candidateSceneId && sceneId === candidateSceneId)
      || (Number.isFinite(candidateNumber) && candidateNumber === sceneNumber)
      || labelNumberPattern.test(label)
    );
  });
  return moneyValue(item?.walletChargeInr ?? item?.wallet_charge_inr ?? item?.chargedAmountInr ?? item?.charged_amount_inr);
}

function referenceAssetsFrom(videoRun = {}, screenplay = {}) {
  const productBrief = firstObject(
    screenplay?.scriptJson?.productIntelligenceBrief,
    screenplay?.scriptJson?.creatorContext?.productIntelligenceBrief,
    screenplay?.productIntelligenceBrief
  );
  return mergeReferenceAssets(
    videoRun?.productImageAssets,
    videoRun?.referenceImageAssets,
    videoRun?.renderManifest?.productImageAssets,
    videoRun?.renderManifest?.referenceImageAssets,
    screenplay?.scriptJson?.productImageAssets,
    screenplay?.scriptJson?.referenceImageAssets,
    screenplay?.scriptJson?.creatorContext?.productImageAssets,
    screenplay?.scriptJson?.creatorContext?.referenceImageAssets,
    productBrief?.imageAssets,
    productBrief?.productImageAssets,
    productBrief?.referenceImageAssets
  );
}

function mergeReferenceAssets(...groups) {
  const merged = [];
  groups.flatMap((group) => arrayValue(group)).forEach((asset) => {
    const normalized = normalizeReferenceAsset(asset);
    if (!normalized) return;
    const key = referenceAssetKey(normalized, merged.length);
    if (!merged.some((existing, index) => referenceAssetKey(existing, index) === key)) {
      merged.push(normalized);
    }
  });
  return merged;
}

function normalizeReferenceAsset(asset = {}) {
  if (!asset || typeof asset !== "object") return null;
  const objectKey = firstText(asset.objectKey, asset.object_key, asset.key, asset.storageKey);
  const url = referenceAssetUrl(asset);
  if (!objectKey && !url) return null;
  return {
    ...asset,
    assetId: firstText(asset.assetId, asset.asset_id, asset.id),
    bucket: firstText(asset.bucket, asset.assetBucket, asset.storageBucket),
    objectKey,
    contentType: firstText(asset.contentType, asset.content_type, asset.mimeType),
    publicUrl: firstText(asset.publicUrl, asset.public_url, asset.signedUrl, asset.assetUrl, asset.url),
    signedUrl: firstText(asset.signedUrl, asset.signed_url, asset.publicUrl, asset.assetUrl, asset.url),
    assetUrl: firstText(asset.assetUrl, asset.asset_url, asset.publicUrl, asset.signedUrl, asset.url),
    details: firstText(asset.details, asset.referenceDetails, asset.reference_image_details, asset.metadata?.details),
    referenceRole: firstText(asset.referenceRole, asset.reference_role, asset.assetRole, asset.role, "product_visual_anchor"),
    assetRole: firstText(asset.assetRole, asset.referenceRole, "product_visual_anchor"),
  };
}

function referenceGenerationPayloadFrom(assets = [], details = "") {
  const normalizedAssets = mergeReferenceAssets(assets);
  if (!normalizedAssets.length && !String(details || "").trim()) return {};
  const cleanDetails = String(details || "").trim();
  return {
    productImageAssets: normalizedAssets,
    referenceImageAssets: normalizedAssets,
    referenceImageDetails: cleanDetails,
    productReferenceDetails: cleanDetails,
    referenceImageMode: normalizedAssets.length ? "product_motion_anchor" : undefined,
    storyboardReferenceMode: normalizedAssets.length ? "product_motion_anchor" : undefined,
    requireImageAnchors: normalizedAssets.length > 0,
    videoConsistencyBible: {
      referenceImageDetails: cleanDetails,
      productReferenceLock: cleanDetails,
      hairLookLock: "Preserve exact hair length, color, parting, volume, texture, grooming, and styling continuity across every scene.",
      backgroundSetLock: "Preserve the same background/set geography, furniture, surface materials, product placement, lighting direction, and color temperature across every scene.",
      wardrobeLock: "Preserve wardrobe, accessories, makeup, hands, and product interaction details unless the shot explicitly changes them.",
      dialogueCoverageLock: "Every scripted dialogue line must be spoken completely, in order, without paraphrase or dropped final words when native audio is supported.",
      negativePrompt: "no face drift, no hairstyle change, no hair length change, no wardrobe change, no changed room layout, no random actor, no changed product packaging, no random subtitles",
    },
  };
}

function referenceAssetUrl(asset = {}) {
  return firstText(asset.publicUrl, asset.public_url, asset.signedUrl, asset.signed_url, asset.assetUrl, asset.asset_url, asset.url, asset.href);
}

function referenceAssetKey(asset = {}, index = 0) {
  return firstText(asset.assetId, asset.id, asset.objectKey, asset.object_key, referenceAssetUrl(asset), `reference-${index}`);
}

function billingSummaryFromRun(videoRun = {}) {
  const saved = firstObject(videoRun?.billingSummary, videoRun?.renderManifest?.billingSummary);
  const usdInrRate = moneyValue(saved.usdInrRate ?? saved.usd_inr_rate, 95);
  const lineItems = [];
  const addCharge = (type, label, metadata) => {
    const lineItem = normalizeBillingLineItem(firstObject(metadata), {
      type,
      label,
      usdInrRate,
    });
    if (!lineItem.walletChargeInr) return;
    lineItems.push(lineItem);
  };

  arrayValue(videoRun?.scenes?.length ? videoRun.scenes : videoRun?.sceneClips).forEach((scene, index) => {
    addCharge(
      "VIDEO_SCENE",
      `Scene ${firstText(scene?.sceneNumber, scene?.scene_number, index + 1)}`,
      firstObject(scene?.costMetadata, scene?.providerMetadata?.costMetadata)
    );
  });
  addCharge(
    "DIALOGUE_VOICE",
    "Dialogue voiceover",
    firstObject(videoRun?.dialogueAudio?.costMetadata, videoRun?.dialogueAudio?.providerDetails?.costMetadata)
  );
  addCharge(
    "BACKGROUND_MUSIC",
    "AI background music",
    firstObject(videoRun?.backgroundMusic?.costMetadata, videoRun?.backgroundMusic?.providerDetails?.costMetadata)
  );

  const packageBilling = firstObject(videoRun?.packageBilling, videoRun?.renderManifest?.packageBilling, videoRun?.finalVideo?.packageBilling);
  const packageTopUpInr = chargeAmountInr(packageBilling, { usdInrRate });
  if (Object.keys(packageBilling).length && packageTopUpInr > 0) {
    lineItems.push({
      type: "VIDEO_PACKAGE_TOP_UP",
      label: "AI Short Starter package floor top-up",
      walletChargeInr: packageTopUpInr,
    });
  }

  const derived = {
    currency: "INR",
    newFullVideoPackageInr: 5999,
    packageTopUpInr,
    totalWalletChargeInr: lineItems.reduce((total, item) => total + moneyValue(item.walletChargeInr), 0),
    lineItems,
  };
  return Object.keys(saved).length ? normalizeBillingSummary(saved, derived) : derived;
}

function sceneRerunQuote(scene = {}, billingSummary = {}) {
  const costMetadata = firstObject(scene.costMetadata, scene.providerMetadata?.costMetadata);
  const walletChargeInr = normalizeBillingLineItem(costMetadata, {
    label: "Scene regeneration",
    usdInrRate: 95,
  }).walletChargeInr;
  return {
    walletChargeInr,
  };
}

function normalizeBillingSummary(summary = {}, fallback = {}) {
  const usdInrRate = moneyValue(summary.usdInrRate ?? summary.usd_inr_rate, moneyValue(fallback.usdInrRate, 95));
  const savedItems = firstArray(summary.lineItems, summary.line_items, summary.items, summary.ledgerItems, summary.ledger_items);
  const fallbackItems = arrayValue(fallback.lineItems);
  const lineItems = (savedItems.length ? savedItems : fallbackItems)
    .map((item, index) => normalizeBillingLineItem(item, {
      type: item?.type || item?.chargeType || item?.charge_type || `CHARGE_${index + 1}`,
      label: firstText(item?.label, item?.description, item?.name, item?.type, `Paid action ${index + 1}`),
      usdInrRate,
    }))
    .filter((item) => item.walletChargeInr > 0);
  const lineItemTotal = lineItems.reduce((total, item) => total + moneyValue(item.walletChargeInr), 0);
  const explicitTotal = chargeAmountInr(summary, { usdInrRate });
  const fallbackTotal = moneyValue(fallback.totalWalletChargeInr);

  return {
    currency: "INR",
    newFullVideoPackageInr: moneyValue(
      summary.newFullVideoPackageInr ?? summary.new_full_video_package_inr,
      moneyValue(fallback.newFullVideoPackageInr, 5999)
    ),
    packageTopUpInr: chargeAmountInr(firstObject(summary.packageBilling, summary.package_billing), { usdInrRate }) || moneyValue(fallback.packageTopUpInr),
    totalWalletChargeInr: Math.max(explicitTotal, lineItemTotal, fallbackTotal),
    lineItems,
  };
}

function normalizeBillingLineItem(item = {}, { type = "", label = "", usdInrRate = 95 } = {}) {
  const explicitCharge = chargeAmountInr(item, { usdInrRate });

  return {
    type: type || item.type || item.chargeType || item.charge_type || "PAID_ACTION",
    label: label || firstText(item.label, item.description, item.name, item.type, "Paid action"),
    walletChargeInr: explicitCharge,
  };
}

function chargeAmountInr(value = {}, { usdInrRate = 95 } = {}) {
  const source = firstObject(value);
  if (!Object.keys(source).length) return 0;
  const currency = firstText(source.currency, source.currencyCode, source.currency_code, "INR").toUpperCase();
  const toInr = (amount) => currency === "USD" ? moneyValue(amount) * usdInrRate : moneyValue(amount);
  const majorAmount = firstMoneyValue(
    source.totalWalletChargeInr,
    source.total_wallet_charge_inr,
    source.walletChargeInr,
    source.wallet_charge_inr,
    source.chargedAmountInr,
    source.charged_amount_inr,
    source.customerTotalCostInr,
    source.customer_total_cost_inr,
    source.billableTotalCostInr,
    source.billable_total_cost_inr,
    source.walletDebitAmountInr,
    source.wallet_debit_amount_inr,
    source.debitAmountInr,
    source.debit_amount_inr,
    source.totalChargeInr,
    source.total_charge_inr,
    source.amountInr,
    source.amount_inr,
    source.walletCharge,
    source.wallet_charge,
    source.chargedAmount,
    source.charged_amount,
    source.customerTotalCost,
    source.customer_total_cost,
    source.billableTotalCost,
    source.billable_total_cost,
    source.walletDebitAmount,
    source.wallet_debit_amount,
    source.debitAmount,
    source.debit_amount,
    source.topUpAmountInr,
    source.top_up_amount_inr,
    source.amount
  );
  const minorAmount = firstMoneyValue(
    source.totalWalletChargePaise,
    source.total_wallet_charge_paise,
    source.walletChargePaise,
    source.wallet_charge_paise,
    source.chargedAmountPaise,
    source.charged_amount_paise,
    source.walletDebitAmountPaise,
    source.wallet_debit_amount_paise,
    source.debitAmountPaise,
    source.debit_amount_paise,
    source.amountPaise,
    source.amount_paise
  );
  return Math.max(toInr(majorAmount), minorAmount / 100);
}

function firstMoneyValue(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function secondsBetween(start, end) {
  const startNumber = Number(String(start ?? "").replace(/[^\d.]/g, ""));
  const endNumber = Number(String(end ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(startNumber) || !Number.isFinite(endNumber) || endNumber <= startNumber) return 0;
  return endNumber - startNumber;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
}

function firstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}
