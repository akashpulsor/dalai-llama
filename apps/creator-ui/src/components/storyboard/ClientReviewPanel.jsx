// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  CheckCircle2,
  Image as ImageIcon,
  Languages,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Upload,
  UserRound,
  X,
  ZoomIn,
} from "lucide-react";
import {
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  PREMIUM_FOOD_TYPOGRAPHY_PRESETS,
  typographyPresetById,
} from "./typographyPresets";
import VideoDirectorPlanPanel from "./VideoDirectorPlanPanel";

const DIALOGUE_LANGUAGES = [
  "English", "Hinglish", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi",
  "Spanish", "French", "German", "Portuguese", "Italian", "Arabic", "Japanese",
  "Korean", "Chinese", "Indonesian", "Vietnamese", "Thai", "Russian", "Turkish",
];

const RENDERABLE_FONTS = [
  "Montserrat", "Inter", "Poppins", "Playfair Display", "Bebas Neue",
  "Oswald", "Lora", "Raleway", "Roboto Slab", "DM Sans",
];

export default function ClientReviewPanel({
  review = {},
  shots = [],
  dialogueLanguage = "English",
  shotCount = 0,
  onChange,
  onDialogueLanguageChange,
  onSave,
  onApply,
  onRevert,
  onUploadVisualReference,
  onUploadFontReference,
  onSendReviewMessage,
  onApplyReviewMessage,
  isLoading = false,
  isSaving = false,
  isChatting = false,
  isApplying = false,
  isReverting = false,
  isUploadingVisualReference = false,
  isUploadingFontReference = false,
  updatingReviewMessageId = "",
  isDirty = false,
  disabled = false,
}) {
  const updatedAt = formatUpdatedAt(review.updatedAt);
  const visualReferenceImages = Array.isArray(review.visualReferenceImages) ? review.visualReferenceImages : [];
  const fontReferenceImages = Array.isArray(review.fontReferenceImages) ? review.fontReferenceImages : [];
  const reviewChat = Array.isArray(review.reviewChat) ? review.reviewChat : [];
  const reviewShots = Array.isArray(shots) ? shots : [];
  const typography = review.typographySystem || {};
  const creativeLearning = review.creativeLearning && typeof review.creativeLearning === "object"
    ? review.creativeLearning
    : {};
  const approvedCreativeRuleCount = Number(creativeLearning.approvedRuleCount || 0);
  const overlayPlan = Array.isArray(review.overlayPlan) ? review.overlayPlan : [];
  const busy = isSaving || isChatting || isApplying || isReverting || isUploadingVisualReference || isUploadingFontReference;
  const [chatDraft, setChatDraft] = useState("");
  const [chatTarget, setChatTarget] = useState("PLANNING");
  const [chatShotNumber, setChatShotNumber] = useState("");
  const [chatReferenceAssetIds, setChatReferenceAssetIds] = useState([]);
  const [chatReferenceUsageMode, setChatReferenceUsageMode] = useState("INSPIRATION_ONLY");
  const [selectedFrameKind, setSelectedFrameKind] = useState("storyboard");
  const [zoomedFrame, setZoomedFrame] = useState(null);
  const [selectedProposalMessageId, setSelectedProposalMessageId] = useState("");
  const reviewChatSectionRef = useRef(null);
  const reviewChatListRef = useRef(null);
  const reviewChatInputRef = useRef(null);
  const selectedReviewShot = reviewShots.find((shot, index) => (
    Number(shot?.shotNumber || shot?.shot_number || index + 1) === Number(chatShotNumber)
  ));
  const selectedReviewFrames = selectedReviewShot ? frameUrlsForReviewShot(selectedReviewShot) : {};
  const selectedReviewImage = selectedFrameKind === "product"
    ? selectedReviewFrames.product
    : selectedReviewFrames.storyboard || selectedReviewFrames.product;
  const selectedChatReferences = visualReferenceImages.filter((asset) => (
    chatReferenceAssetIds.includes(referenceAssetId(asset))
  ));
  const overlayPolicy = String(typography.overlayPolicy || "AUTO").toUpperCase();
  const selectedTypographyPreset = typographyPresetById(
    typography.presetId || DEFAULT_TYPOGRAPHY_PRESET_ID
  );

  const updateOverlay = (index, field, value) => {
    onChange?.("overlayPlan", overlayPlan.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value, locked: true } : item
    )));
  };

  const updateTypography = (patch) => {
    onChange?.("typographySystem", { ...typography, ...patch, draftOnly: true });
  };

  const applyTypographyPreset = (preset) => {
    updateTypography({
      presetId: preset.id,
      presetName: preset.name,
      presetPrompt: preset.prompt,
      primaryFont: preset.primaryFont,
      secondaryFont: preset.secondaryFont,
      primaryWeight: preset.primaryWeight,
      secondaryWeight: preset.secondaryWeight,
      caseRule: preset.caseRule,
      maxLines: preset.maxLines,
      backgroundStyle: preset.backgroundStyle,
      defaultEntrance: preset.entrance,
      defaultSpeed: preset.speed,
      decisionSource: "Client-approved premium food typography preset",
    });
    onChange?.("overlayPlan", overlayPlan.map((item) => ({
      ...item,
      stylePresetId: preset.id,
      stylePresetName: preset.name,
      fontFamily: preset.primaryFont,
      fontWeight: preset.primaryWeight,
      entrance: preset.entrance,
      speed: preset.speed,
      backgroundStyle: preset.backgroundStyle,
      locked: true,
    })));
  };

  useEffect(() => {
    const chatList = reviewChatListRef.current;
    if (!chatList || !reviewChat.length) return;
    const frame = window.requestAnimationFrame(() => {
      chatList.scrollTo({
        top: chatList.scrollHeight,
        behavior: isChatting ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reviewChat.length, isChatting, updatingReviewMessageId]);

  useEffect(() => {
    if (!zoomedFrame || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setZoomedFrame(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [zoomedFrame]);

  const selectFrameForReview = (targetType, shotNumber) => {
    setChatTarget("STORYBOARD_AND_PRODUCT");
    setSelectedFrameKind(targetType === "PRODUCT_FRAME" ? "product" : "storyboard");
    setChatShotNumber(String(shotNumber));
    window.requestAnimationFrame(() => {
      reviewChatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      reviewChatInputRef.current?.focus();
    });
  };

  const askToChangeDirectorPlan = () => {
    setChatTarget("PLANNING");
    setChatShotNumber("");
    setChatDraft((current) => current.trim()
      ? current
      : "Please revise the director's video blueprint: ");
    window.requestAnimationFrame(() => {
      reviewChatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      reviewChatInputRef.current?.focus();
    });
  };

  const sendReviewMessage = async () => {
    const text = chatDraft.trim();
    if (!text || updatingReviewMessageId) return;
    const submission = await onSendReviewMessage?.({
      text,
      targetType: chatShotNumber ? "STORYBOARD_AND_PRODUCT" : "PLANNING",
      shotNumber: chatShotNumber,
      visualReferenceAssetIds: chatReferenceAssetIds,
      visualReferenceUsageMode: chatReferenceUsageMode,
    });
    if (submission?.message) {
      setChatDraft("");
      setChatReferenceAssetIds([]);
    }
  };

  const reanalyzeReviewMessage = async (message = {}) => {
    const text = String(message.text || message.message || "").trim();
    if (!text || updatingReviewMessageId) return;
    await onSendReviewMessage?.({
      text,
      targetType: message.targetType || "PLANNING",
      shotNumber: message.shotNumber || "",
      visualReferenceAssetIds: Array.isArray(message.visualReferenceAssetIds)
        ? message.visualReferenceAssetIds
        : [],
      visualReferenceUsageMode: message.visualReferenceUsageMode || "INSPIRATION_ONLY",
    });
  };

  const uploadChatReferences = async (files) => {
    const uploaded = await onUploadVisualReference?.(files);
    const uploadedIds = (Array.isArray(uploaded) ? uploaded : [])
      .map(referenceAssetId)
      .filter(Boolean);
    if (uploadedIds.length) {
      setChatReferenceAssetIds((current) => [...new Set([...current, ...uploadedIds])]);
      setChatDraft((current) => current.trim()
        ? current
        : "Use the attached reference for this shot according to the selected usage mode, while preserving approved project identity and continuity.");
    }
  };

  const toggleChatReference = (asset) => {
    const assetId = referenceAssetId(asset);
    if (!assetId) return;
    setChatReferenceAssetIds((current) => (
      current.includes(assetId)
        ? current.filter((item) => item !== assetId)
        : [...current, assetId]
    ));
  };

  return (
    <>
    <section id="client-review-panel" className="creator-panel scroll-mt-4 overflow-hidden p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-200">
            <MessageSquareText size={15} />
            Client review and creative direction
          </div>
          <h3 className="mt-2 text-lg font-extrabold text-white">One feedback source for the entire production plan</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-400">
            Chat naturally about any shot or combination of shots. The assistant reads the complete storyboard, product frames, DP and lighting plans, screenplay, overlays, and current video blueprint before preparing one synchronized revision.
          </p>
          <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">
            A story with shot references is mapped beat by beat. Only Apply-approved creative principles guide matching future ads; Revert disables that learning.
            {approvedCreativeRuleCount > 0 && (
              <span className="ml-1 text-emerald-300">{approvedCreativeRuleCount} currently approved.</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300">
            Review status
            <select
              value={review.reviewStatus || "CHANGES_REQUESTED"}
              onChange={(event) => onChange?.("reviewStatus", event.target.value)}
              disabled={disabled || busy}
              className="bg-transparent text-xs font-black text-white outline-none"
            >
              <option value="DRAFT" className="bg-slate-950">Draft</option>
              <option value="CHANGES_REQUESTED" className="bg-slate-950">Changes requested</option>
              <option value="READY_FOR_CLIENT" className="bg-slate-950">Ready for client</option>
              <option value="APPROVED" className="bg-slate-950">Approved</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onSave}
            disabled={disabled || busy}
            className="creator-control flex min-h-10 items-center gap-2 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : isDirty ? <Save size={14} /> : <CheckCircle2 size={14} />}
            {isSaving ? "Saving" : isDirty ? "Save review" : "Saved"}
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={disabled || busy}
            className="creator-primary flex min-h-10 items-center gap-2 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isApplying ? "Applying across planning" : "Apply to all planning"}
          </button>
          {review.propagation?.undoAvailable && (
            <button
              type="button"
              onClick={onRevert}
              disabled={disabled || busy}
              className="creator-control flex min-h-10 items-center gap-2 px-4 text-xs font-black text-amber-100 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isReverting ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
              {isReverting ? "Restoring" : "Revert last apply"}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-cyan-300/15 bg-cyan-400/[0.045] p-4 text-sm font-semibold text-slate-300">
          <Loader2 size={16} className="animate-spin text-cyan-200" />
          Loading the latest client review...
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-fuchsia-300/15 bg-fuchsia-400/[0.035] p-3">
            <Languages size={15} className="text-fuchsia-200" />
            <span className="text-[10px] font-black uppercase text-fuchsia-200">Dialogue language</span>
            <select
              value={dialogueLanguage || "English"}
              onChange={(event) => onDialogueLanguageChange?.(event.target.value)}
              disabled={disabled || busy}
              className="h-9 rounded-md border border-fuchsia-300/20 bg-slate-950 px-3 text-xs font-black text-white outline-none disabled:opacity-60"
            >
              {DIALOGUE_LANGUAGES.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
            <span className="text-[10px] font-semibold text-slate-500">
              The assistant confirms a changed selection in chat. Apply to all planning then translates dialogue, voice-over, captions, subtitles, overlays, and video generation prompts.
            </span>
          </div>

          <section className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/15">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 p-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <ImageIcon size={15} className="text-amber-200" />
                  Frames in client review
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                  Review the current storyboard and product frames together. Choose Review below a frame to preselect it in chat.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase text-slate-400">
                {reviewShots.length} shots
              </span>
            </div>
            {reviewShots.length ? (
              <div className="custom-scrollbar flex gap-3 overflow-x-auto p-3">
                {reviewShots.map((shot, index) => {
                  const shotNumber = Number(shot?.shotNumber || shot?.shot_number || index + 1);
                  const frames = frameUrlsForReviewShot(shot);
                  return (
                    <article key={shot?.id || shot?.shotId || `review-shot-${shotNumber}`} className="w-[30rem] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/55">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                        <div>
                          <p className="text-[9px] font-black uppercase text-amber-200">Shot {shotNumber}</p>
                          <p className="mt-0.5 max-w-80 truncate text-xs font-black text-white">{shot?.title || shot?.shotTitle || `Shot ${shotNumber}`}</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600">
                          {[frames.storyboard, frames.product].filter(Boolean).length}/2 ready
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-px bg-white/10">
                        <ReviewFrame
                          label="Storyboard"
                          imageUrl={frames.storyboard}
                          disabled={disabled || busy}
                          onReview={() => selectFrameForReview("STORYBOARD", shotNumber)}
                          onZoom={() => setZoomedFrame({
                            src: frames.storyboard,
                            label: `Shot ${shotNumber} storyboard`,
                          })}
                        />
                        <ReviewFrame
                          label="Product frame"
                          imageUrl={frames.product}
                          disabled={disabled || busy}
                          onReview={() => selectFrameForReview("PRODUCT_FRAME", shotNumber)}
                          onZoom={() => setZoomedFrame({
                            src: frames.product,
                            label: `Shot ${shotNumber} product frame`,
                          })}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 text-center text-[11px] font-semibold text-slate-600">
                Storyboard shots will appear here after the screenplay creates the shot plan.
              </div>
            )}
          </section>

          <section ref={reviewChatSectionRef} className="mt-3 scroll-mt-4 overflow-hidden rounded-lg border border-cyan-300/20 bg-cyan-400/[0.035]">
            <div className="border-b border-white/10 p-3">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <Bot size={15} className="text-cyan-200" />
                Review chat and frame updates
              </div>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                Type freely, for example “make Shot 1 flow into Shot 2 and keep the same light direction.” Selecting a frame only adds an anchor; it does not limit the assistant to that shot.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-normal">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-1 text-cyan-100">1 Describe</span>
                <span className="text-slate-700">→</span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-1 text-cyan-100">2 Review real diff</span>
                <span className="text-slate-700">→</span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-2 py-1 text-emerald-200">3 Apply + generate</span>
                <span className="ml-1 normal-case text-slate-500">Sending creates a draft; images change only after Apply.</span>
              </div>
            </div>

            {chatShotNumber && chatTarget !== "PLANNING" && (
              <div className="grid gap-3 border-b border-cyan-300/15 bg-cyan-300/[0.045] p-3 md:grid-cols-[12rem_minmax(0,1fr)]">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-950">
                  {selectedReviewImage ? (
                    <button
                      type="button"
                      onClick={() => setZoomedFrame({
                        src: selectedReviewImage,
                        label: `Shot ${chatShotNumber} ${selectedFrameKind === "product" ? "product frame" : "storyboard"}`,
                      })}
                      className="group h-full w-full cursor-zoom-in"
                      aria-label="Zoom selected frame"
                    >
                      <img
                        src={selectedReviewImage}
                        alt={`Shot ${chatShotNumber} selected for review`}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-slate-950/85 text-white opacity-80 transition group-hover:opacity-100">
                        <ZoomIn size={13} />
                      </span>
                    </button>
                  ) : (
                    <div className="grid h-full place-items-center text-center">
                      <ImageIcon size={22} className="mx-auto text-slate-700" />
                      <p className="mt-1 text-[9px] font-black uppercase text-slate-600">Frame pending</p>
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-slate-950/90 px-2 py-1 text-[8px] font-black uppercase text-cyan-100">
                    Selected
                  </span>
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="text-[9px] font-black uppercase tracking-normal text-cyan-200">
                    Shot {chatShotNumber} · {formatTargetType(chatTarget)}
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-white">
                    {selectedReviewShot?.title || selectedReviewShot?.shotTitle || `Shot ${chatShotNumber}`}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">
                    This frame is a context anchor. You can still compare it with or change any other shot in the same message.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setChatShotNumber("");
                      setChatTarget("PLANNING");
                    }}
                    className="mt-2 w-fit text-[10px] font-black text-slate-500 transition hover:text-white"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}

            <div ref={reviewChatListRef} className="custom-scrollbar max-h-80 space-y-2 overflow-y-auto p-3">
              {reviewChat.length ? reviewChat.map((message, index) => {
                const messageId = message.id || `review-message-${index}`;
                const isUser = String(message.role || "user").toLowerCase() === "user";
                const confirmationMessageId = String(
                  message.confirmationForMessageId
                    || (String(message.id || "").endsWith("-analysis")
                      ? String(message.id).slice(0, -"-analysis".length)
                      : "")
                );
                const confirmationMessage = !isUser && confirmationMessageId
                  ? reviewChat.find((item) => String(item.id || "") === confirmationMessageId)
                  : null;
                const effectiveProposal = message?.proposal && typeof message.proposal === "object"
                  ? message.proposal
                  : confirmationMessage?.proposal || {};
                const hasMeaningfulDelta = proposalHasMeaningfulDelta(effectiveProposal);
                const canConfirm = confirmationMessage
                  && hasMeaningfulDelta
                  && ["PENDING", "AWAITING_CONFIRMATION"].includes(String(confirmationMessage.status || "").toUpperCase());
                const affectedShotNumbers = reviewMessageAffectedShotNumbers({
                  ...confirmationMessage,
                  proposal: effectiveProposal,
                });
                const canRegeneratePair = affectedShotNumbers.length > 0
                  && hasMeaningfulDelta
                  && effectiveProposal?.requiresFrameRegeneration !== false
                  && String(confirmationMessage.status || "").toUpperCase() === "COMPLETED";
                const needsReanalysis = confirmationMessage
                  && affectedShotNumbers.length > 0
                  && !hasMeaningfulDelta;
                const proposedPlanSelected = Boolean(confirmationMessageId)
                  && selectedProposalMessageId === confirmationMessageId;
                return (
                  <article key={messageId} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-200"><Bot size={14} /></div>}
                    <div className={`max-w-[88%] rounded-xl border p-3 ${isUser ? "border-purple-300/20 bg-purple-400/[0.08]" : "border-cyan-300/15 bg-black/25"}`}>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-normal">
                        <span className={isUser ? "text-purple-200" : "text-cyan-200"}>{isUser ? "Client" : "Planning assistant"}</span>
                        {message.targetType && <span className="text-slate-600">{formatTargetType(message.targetType)}</span>}
                        {message.shotNumber && <span className="text-slate-600">Shot {message.shotNumber}</span>}
                        {!message.shotNumber && reviewMessageAffectedShotNumbers(message).length > 0 && (
                          <span className="text-slate-600">
                            Shots {reviewMessageAffectedShotNumbers(message).join(", ")}
                          </span>
                        )}
                        {Array.isArray(message.visualReferenceAssetIds) && message.visualReferenceAssetIds.length > 0 && (
                          <span className="text-amber-300">
                            {message.visualReferenceAssetIds.length} reference{message.visualReferenceAssetIds.length === 1 ? "" : "s"} · {formatReferenceUsageMode(message.visualReferenceUsageMode)}
                          </span>
                        )}
                        {message.status && <span className={message.status === "COMPLETED" ? "text-emerald-300" : "text-amber-300"}>{message.status}</span>}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-200">{message.text || message.message}</p>
                      {!isUser && Array.isArray(message?.proposal?.planningChangePreview) && message.proposal.planningChangePreview.length > 0 && (
                        <PlanningChangePreview
                          proposal={message.proposal}
                          proposedPlanSelected={proposedPlanSelected}
                          onSelectCurrent={() => setSelectedProposalMessageId("")}
                          onSelectProposed={() => setSelectedProposalMessageId(confirmationMessageId)}
                        />
                      )}
                      {!isUser && Array.isArray(message?.proposal?.creativeLearningCandidates) && message.proposal.creativeLearningCandidates.length > 0 && (
                        <CreativeLearningPreview candidates={message.proposal.creativeLearningCandidates} />
                      )}
                      {(canConfirm || canRegeneratePair) && (
                        <button
                          type="button"
                          disabled={disabled || busy || Boolean(updatingReviewMessageId) || !proposedPlanSelected}
                          onClick={() => onApplyReviewMessage?.(confirmationMessage)}
                          className="creator-primary mt-2 flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50"
                        >
                          {updatingReviewMessageId === confirmationMessageId
                            ? <Loader2 size={12} className="animate-spin" />
                            : <RefreshCw size={12} />}
                          {proposedPlanSelected
                            ? applyReviewButtonLabel({
                                ...confirmationMessage,
                                proposal: effectiveProposal,
                              })
                            : "Select proposed plan above"}
                        </button>
                      )}
                      {needsReanalysis && (
                        <div className="mt-2 rounded-md border border-amber-300/20 bg-amber-300/[0.055] p-2">
                          <p className="text-[9px] font-semibold leading-4 text-amber-100">
                            No usable visual difference was produced, so this draft cannot be applied.
                          </p>
                          <button
                            type="button"
                            disabled={disabled || busy || Boolean(updatingReviewMessageId)}
                            onClick={() => reanalyzeReviewMessage(confirmationMessage)}
                            className="creator-control mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black text-white disabled:opacity-50"
                          >
                            {isChatting ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            Analyze this prompt again
                          </button>
                        </div>
                      )}
                    </div>
                    {isUser && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-purple-300/10 text-purple-200"><UserRound size={14} /></div>}
                  </article>
                );
              }) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-black/15 p-5 text-center">
                  <Bot size={20} className="mx-auto text-slate-600" />
                  <p className="mt-2 text-[11px] font-black text-slate-300">Start with a specific visual instruction</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-600">Example: “Make Shot 1 transition into Shot 2 through the same amber light sweep, then replace Shot 4’s repeated pour with a macro texture reveal.”</p>
                </div>
              )}
            </div>

            {visualReferenceImages.length > 0 && (
              <div className="custom-scrollbar flex items-center gap-2 overflow-x-auto border-t border-white/10 bg-black/10 px-3 py-2">
                <span className="shrink-0 text-[9px] font-black uppercase text-slate-600">
                  Reference history · select only for this message
                </span>
                {visualReferenceImages.map((asset, index) => {
                  const assetId = referenceAssetId(asset);
                  const selected = chatReferenceAssetIds.includes(assetId);
                  const imageUrl = asset.signedUrl || asset.publicUrl || asset.assetUrl || asset.url;
                  return (
                    <button
                      key={assetId || `${imageUrl}-${index}`}
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => toggleChatReference(asset)}
                      className={`flex shrink-0 items-center gap-2 rounded-md border px-2 py-1.5 text-[9px] font-black transition disabled:opacity-50 ${
                        selected
                          ? "border-amber-300/50 bg-amber-300/10 text-amber-100"
                          : "border-white/10 bg-black/20 text-slate-400 hover:text-white"
                      }`}
                    >
                      {imageUrl && <img src={imageUrl} alt="" className="h-7 w-9 rounded object-cover" />}
                      Reference {index + 1}
                      {selected ? ` · ${formatReferenceUsageMode(chatReferenceUsageMode)}` : ""}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-white/10 bg-black/15 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase">
                <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1.5 text-cyan-100">
                  Full project context
                </span>
                <span className="text-slate-600">All shots · storyboard · product · DP · lighting · planning</span>
                {chatShotNumber && (
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1.5 text-amber-100">
                    Frame anchor: Shot {chatShotNumber}
                  </span>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_9rem_auto_auto]">
              <textarea
                ref={reviewChatInputRef}
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendReviewMessage();
                  }
                }}
                rows={2}
                disabled={disabled || busy}
                placeholder="Ask naturally about one shot, several shots, continuity, DP, lighting, dialogue, overlays, pacing, or the complete ad. Enter sends; Shift+Enter adds a line."
                className="min-h-10 resize-y rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold leading-5 text-white outline-none placeholder:text-slate-600"
              />
              <select
                value={chatReferenceUsageMode}
                onChange={(event) => setChatReferenceUsageMode(event.target.value)}
                disabled={disabled || busy || chatReferenceAssetIds.length === 0}
                aria-label="How AI should use attached images"
                className="h-10 rounded-md border border-amber-300/20 bg-slate-950 px-2 text-[10px] font-black text-amber-100 outline-none disabled:opacity-45"
              >
                <option value="INSPIRATION_ONLY">Inspiration only</option>
                <option value="EXACT_SOURCE">Use exactly</option>
              </select>
              <label className={`creator-control flex min-h-10 cursor-pointer items-center justify-center gap-1.5 px-3 text-[10px] font-black text-white ${
                disabled || busy ? "pointer-events-none opacity-50" : ""
              }`}>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled || busy}
                  className="sr-only"
                  onChange={async (event) => {
                    const files = Array.from(event.target.files || []);
                    if (files.length) await uploadChatReferences(files);
                    event.target.value = "";
                  }}
                />
                {isUploadingVisualReference
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Upload size={13} />}
                {isUploadingVisualReference
                  ? "Uploading"
                  : selectedChatReferences.length
                    ? `${selectedChatReferences.length} attached`
                    : "Attach reference"}
              </label>
              <button
                type="button"
                onClick={sendReviewMessage}
                disabled={disabled || busy || Boolean(updatingReviewMessageId) || !chatDraft.trim()}
                className="creator-primary flex min-h-10 items-center justify-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50"
              >
                {isChatting || updatingReviewMessageId ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {isChatting
                  ? "Inspecting current project"
                  : "Review change"}
              </button>
              </div>
            </div>
            <p className="border-t border-amber-300/10 bg-amber-300/[0.035] px-3 py-2 text-[10px] font-semibold leading-4 text-amber-100/75">
              References stay in history but are sent to AI only when selected for the current message. <span className="font-black text-amber-100">Inspiration only</span> borrows mood, composition, lighting, texture, and pacing while preserving approved project details. <span className="font-black text-amber-100">Use exactly</span> makes the selected image the visual source of truth for the confirmed shot.
            </p>
          </section>

          <VideoDirectorPlanPanel
            plan={review.videoDirectorPlan || {}}
            onChange={(value) => onChange?.("videoDirectorPlan", value)}
            onAskChange={askToChangeDirectorPlan}
            disabled={disabled}
            busy={busy}
          />

          {false && (
          <details className="mt-3 rounded-lg border border-purple-300/15 bg-purple-400/[0.04]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
              <span className="flex items-center gap-2 text-xs font-black text-white">
                <Type size={15} className="text-purple-200" />
                Typography and on-screen text
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                AI chooses placement, font, transition, and pacing
              </span>
            </summary>
            <div className="border-t border-purple-300/10 p-3">
            <div className="mb-3 grid gap-2 rounded-lg border border-purple-300/15 bg-black/20 p-3 md:grid-cols-[minmax(0,1fr)_15rem]">
              <div>
                <p className="text-xs font-black text-white">Optional overlay policy</p>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">
                  Ads benefit from planned copy. Storytelling can remain visual-first. This edits only the review draft until Apply to all planning.
                </p>
              </div>
              <select
                value={overlayPolicy}
                onChange={(event) => updateTypography({ overlayPolicy: event.target.value })}
                disabled={disabled || busy}
                className="h-10 rounded-md border border-purple-300/20 bg-slate-950 px-3 text-[10px] font-black text-white outline-none disabled:opacity-50"
              >
                <option value="AUTO">AI decides: ads yes, stories selective</option>
                <option value="ENABLED">Use planned overlays</option>
                <option value="DISABLED">No overlays</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <Type size={15} className="text-purple-200" />
                  AI editor typography and overlay plan
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                  Give AI an optional font-style image. The editor decides which shots need text, the premium hierarchy, safe placement, transition, and pacing, then carries those decisions into the final video prompt.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <FontPill label="Primary" value={typography.primaryFont || "Montserrat"} weight={typography.primaryWeight || 800} />
                <FontPill label="Supporting" value={typography.secondaryFont || "Inter"} weight={typography.secondaryWeight || 600} />
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black text-slate-300">
                  {overlayPlan.filter((item) => item?.enabled !== false).length}/{shotCount || overlayPlan.length || 0} overlay shots
                </span>
              </div>
            </div>

            <details className="mt-3 rounded-lg border border-white/10 bg-black/15">
              <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-black text-slate-400">
                Advanced style override
              </summary>
              <div className="border-t border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase text-purple-200">Premium food typography presets</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">Select a system now; AI adapts copy placement and pacing shot by shot.</p>
                </div>
                <span className="text-[10px] font-black text-white">{selectedTypographyPreset.name}</span>
              </div>
              <div className="custom-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                {PREMIUM_FOOD_TYPOGRAPHY_PRESETS.map((preset) => {
                  const active = selectedTypographyPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => applyTypographyPreset(preset)}
                      className={`w-56 shrink-0 rounded-lg border p-3 text-left transition disabled:opacity-50 ${
                        active
                          ? "border-purple-200/55 bg-purple-300/10"
                          : "border-white/10 bg-black/20 hover:border-purple-300/30"
                      }`}
                    >
                      <span
                        className="block text-sm text-white"
                        style={{ fontFamily: `${preset.primaryFont}, sans-serif`, fontWeight: preset.primaryWeight }}
                      >
                        {preset.name}
                      </span>
                      <span className="mt-1 block text-[9px] font-semibold leading-4 text-slate-500">{preset.useFor}</span>
                      <span className="mt-2 block text-[8px] font-black uppercase text-purple-200">
                        {preset.entrance} &middot; {preset.speed}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 rounded-md border border-white/10 bg-black/15 px-3 py-2 text-[10px] font-semibold leading-4 text-slate-500">
                <span className="font-black text-slate-300">Generator direction: </span>
                {selectedTypographyPreset.prompt}
              </p>
              </div>
            </details>

            <div className="mt-3 grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <label className={`grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-purple-300/25 bg-black/20 p-4 text-center transition hover:border-purple-200/50 ${disabled || busy ? "pointer-events-none opacity-55" : ""}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  disabled={disabled || busy}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUploadFontReference?.(file);
                    event.target.value = "";
                  }}
                />
                <span>
                  {isUploadingFontReference
                    ? <Loader2 size={22} className="mx-auto animate-spin text-purple-200" />
                    : <Upload size={22} className="mx-auto text-purple-200" />}
                  <span className="mt-2 block text-xs font-black text-white">
                    {isUploadingFontReference ? "Uploading font sample" : "Upload font-style image"}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold leading-4 text-slate-500">
                    JPG, PNG, WebP, AVIF, or GIF. No TTF file is required.
                  </span>
                </span>
              </label>

              <div>
                {fontReferenceImages.length ? (
                  <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {fontReferenceImages.map((asset, index) => {
                      const imageUrl = asset.signedUrl || asset.publicUrl || asset.assetUrl || asset.url;
                      return (
                        <article key={asset.assetId || asset.id || `${imageUrl}-${index}`} className="w-44 shrink-0 overflow-hidden rounded-lg border border-purple-300/20 bg-black/25">
                          <div className="relative aspect-[4/3] bg-black/30">
                            {imageUrl
                              ? <img src={imageUrl} alt={`Font style reference ${index + 1}`} className="h-full w-full object-contain" />
                              : <div className="grid h-full place-items-center text-purple-200"><ImageIcon size={24} /></div>}
                            <button
                              type="button"
                              aria-label="Remove font reference"
                              disabled={disabled || busy}
                              onClick={() => onChange?.("fontReferenceImages", fontReferenceImages.filter((_, itemIndex) => itemIndex !== index))}
                              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-slate-950/90 text-slate-300 transition hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="p-2">
                            <p className="truncate text-[10px] font-black text-white">{asset.originalFilename || `Font sample ${index + 1}`}</p>
                            <p className="mt-1 text-[9px] font-semibold text-purple-200">Typography reference only</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-36 place-items-center rounded-lg border border-white/10 bg-black/15 p-4 text-center">
                    <div>
                      <ImageIcon size={22} className="mx-auto text-slate-600" />
                      <p className="mt-2 text-[11px] font-black text-slate-300">No font images uploaded</p>
                      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">AI will use the current typography recommendation until a visual sample is supplied.</p>
                    </div>
                  </div>
                )}
                <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">
                  An image does not contain an installable font. AI records the closest available family and an approximation rationale; animation uses that selected family with a safe fallback.
                </p>
              </div>
            </div>

            {(typography.matchRationale || typography.decisionSource) && (
              <div className="mt-3 rounded-lg border border-purple-300/15 bg-purple-400/[0.035] px-3 py-2 text-[10px] font-semibold leading-4 text-slate-400">
                <span className="font-black text-purple-200">AI font decision: </span>
                {typography.matchRationale || typography.decisionSource}
                {typography.confidence ? ` Confidence: ${typography.confidence}.` : ""}
              </div>
            )}

            <details className="mt-3 rounded-lg border border-white/10 bg-black/15">
              <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-black text-slate-400">
                View AI shot typography decisions
              </summary>
              <div className="border-t border-white/10 p-3">
            {overlayPlan.length ? (
              <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
                {overlayPlan.map((item, index) => (
                  <div key={`${item.shotNumber || index}-${index}`} className={`w-80 shrink-0 rounded-lg border p-3 ${item.enabled === false ? "border-white/10 bg-black/15" : "border-purple-300/20 bg-black/25"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase tracking-normal text-purple-200">Shot {item.shotNumber || index + 1}</span>
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(event) => updateOverlay(index, "enabled", event.target.checked)}
                          disabled={disabled || busy || overlayPolicy === "DISABLED"}
                          className="accent-purple-400"
                        />
                        On-screen text
                      </label>
                    </div>
                    <input
                      value={item.text || ""}
                      onChange={(event) => updateOverlay(index, "text", event.target.value)}
                      disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      placeholder="Text shown on screen"
                      className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-xs font-black text-white outline-none disabled:opacity-45"
                      style={{ fontFamily: `${item.fontFamily || typography.primaryFont || "Montserrat"}, sans-serif`, fontWeight: item.fontWeight || 800 }}
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <OverlaySelect
                        label="Copy role"
                        value={item.copyRole || "Benefit"}
                        options={["Hook", "Ingredient", "Benefit", "Product name", "Nutrition", "Campaign line", "CTA"]}
                        onChange={(value) => updateOverlay(index, "copyRole", value)}
                        disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      />
                      <OverlaySelect
                        label="Font"
                        value={item.fontFamily || typography.primaryFont || "Montserrat"}
                        options={RENDERABLE_FONTS}
                        onChange={(value) => updateOverlay(index, "fontFamily", value)}
                        disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      />
                      <OverlaySelect
                        label="Speed"
                        value={item.speed || "Measured"}
                        options={["Quick", "Measured", "Slow"]}
                        onChange={(value) => updateOverlay(index, "speed", value)}
                        disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      />
                      <OverlaySelect
                        label="Position"
                        value={item.position || "Lower safe zone"}
                        options={["Upper safe zone", "Center safe zone", "Lower safe zone", "Left safe zone", "Right safe zone"]}
                        onChange={(value) => updateOverlay(index, "position", value)}
                        disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      />
                      <OverlaySelect
                        label="Entrance"
                        value={item.entrance || "Slide up and fade"}
                        options={["Wipe and fade", "Slide up and fade", "Fade", "Zoom and fade"]}
                        onChange={(value) => updateOverlay(index, "entrance", value)}
                        disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      />
                      <OverlaySelect
                        label="Background"
                        value={item.backgroundStyle || selectedTypographyPreset.backgroundStyle}
                        options={["No panel", "Matte black", "Semi-transparent dark rectangle", "Thin outline badge", "Pastel highlight strip", "Soft pastel tag box"]}
                        onChange={(value) => updateOverlay(index, "backgroundStyle", value)}
                        disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-6">
                      <OverlayNumber label="Weight" value={item.fontWeight || 800} min={400} max={900} step={100} onChange={(value) => updateOverlay(index, "fontWeight", value)} disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"} />
                      <OverlayNumber label="Size px" value={item.fontSizePx || 58} min={24} max={96} step={1} onChange={(value) => updateOverlay(index, "fontSizePx", value)} disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"} />
                      <OverlayNumber label="In ms" value={item.entranceDurationMs || 650} min={200} max={1800} step={50} onChange={(value) => updateOverlay(index, "entranceDurationMs", value)} disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"} />
                      <OverlayNumber label="Delay ms" value={item.delayMs || 250} min={0} max={3000} step={50} onChange={(value) => updateOverlay(index, "delayMs", value)} disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"} />
                      <OverlayNumber label="Hold ms" value={item.holdDurationMs || 1800} min={500} max={6000} step={100} onChange={(value) => updateOverlay(index, "holdDurationMs", value)} disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"} />
                      <OverlayNumber label="Out ms" value={item.exitDurationMs || 450} min={150} max={1800} step={50} onChange={(value) => updateOverlay(index, "exitDurationMs", value)} disabled={disabled || busy || item.enabled === false || overlayPolicy === "DISABLED"} />
                    </div>
                    <p className="mt-2 text-[9px] font-semibold leading-4 text-slate-500">
                      {item.locked ? "Manual choices locked for the next planning propagation." : item.rationale || "AI-planned overlay; edit any field to lock your choice."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-purple-300/20 bg-black/15 p-4 text-center">
                <p className="text-[11px] font-black text-slate-300">Overlay plan will appear shot by shot after Apply to all planning.</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-600">AI will decide the exact copy, hierarchy, placement, entrance, exit, and readable pacing for each useful shot.</p>
              </div>
            )}
              </div>
            </details>
            </div>
          </details>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
        <span>
          {review.propagation?.status === "APPLIED"
            ? `${review.propagation.updatedShotCount || shotCount || 0} shots and ${review.propagation.updatedPlanCount || 0} production plans updated; affected frames require regeneration.`
            : "Draft saves do not rewrite planning. Use Apply to all planning when the feedback is ready."}
        </span>
        <span>{updatedAt ? `Last saved ${updatedAt}` : "Not saved to the screenplay yet"}</span>
      </div>
    </section>
    {zoomedFrame?.src && typeof document !== "undefined" && createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={zoomedFrame.label || "Frame preview"}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setZoomedFrame(null);
        }}
      >
        <div className="relative flex h-full w-full max-w-7xl flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm font-black text-white">{zoomedFrame.label || "Frame preview"}</p>
            <button
              type="button"
              onClick={() => setZoomedFrame(null)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 bg-slate-950 text-white transition hover:bg-white/10"
              aria-label="Close enlarged frame"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/15 bg-black">
            <img
              src={zoomedFrame.src}
              alt={zoomedFrame.label || "Enlarged review frame"}
              className="h-full min-h-[70vh] w-full object-contain"
            />
          </div>
          <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
            Press Esc or click outside the image to close.
          </p>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

function FontPill({ label, value, weight }) {
  return (
    <span className="rounded-full border border-purple-300/20 bg-purple-400/[0.07] px-3 py-2 text-[10px] text-white">
      <span className="mr-1.5 font-black uppercase text-purple-200">{label}</span>
      <span style={{ fontFamily: `${value}, sans-serif`, fontWeight: weight }}>{value}</span>
    </span>
  );
}

function OverlaySelect({ label, value, options = [], onChange, disabled }) {
  return (
    <label>
      <span className="text-[8px] font-black uppercase tracking-normal text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="mt-1 h-9 w-full rounded-md border border-white/10 bg-slate-950 px-2 text-[9px] font-black text-white outline-none disabled:opacity-45"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function OverlayNumber({ label, value, min, max, step, onChange, disabled }) {
  return (
    <label>
      <span className="text-[8px] font-black uppercase tracking-normal text-slate-600">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange?.(Number(event.target.value))}
        disabled={disabled}
        className="mt-1 h-9 w-full rounded-md border border-white/10 bg-black/30 px-2 text-[9px] font-black text-white outline-none disabled:opacity-45"
      />
    </label>
  );
}

function PlanningChangePreview({
  proposal = {},
  proposedPlanSelected = false,
  onSelectCurrent,
  onSelectProposed,
}) {
  const shots = Array.isArray(proposal.planningChangePreview) ? proposal.planningChangePreview : [];
  const continuityAnchors = Array.isArray(proposal.continuityAnchorShotNumbers)
    ? proposal.continuityAnchorShotNumbers.map(Number).filter((value) => Number.isInteger(value) && value > 0)
    : [];
  if (!shots.length) return null;
  return (
    <details className="mt-2 overflow-hidden rounded-lg border border-cyan-300/15 bg-cyan-300/[0.035]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[10px] font-black text-cyan-100">
        <span>Preview planning changes frame by frame</span>
        <span className="shrink-0 rounded-full border border-cyan-300/15 bg-black/20 px-2 py-1 text-[8px] uppercase text-cyan-200">
          {shots.length} shot{shots.length === 1 ? "" : "s"} · before Apply
        </span>
      </summary>
      <div className="space-y-2 border-t border-white/10 p-2">
        <div className="grid gap-2 rounded-md border border-white/[0.08] bg-black/20 p-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSelectCurrent}
            className={`rounded-md border px-3 py-2 text-left transition ${
              !proposedPlanSelected
                ? "border-slate-300/40 bg-slate-300/10 text-white"
                : "border-white/10 bg-black/20 text-slate-500 hover:text-white"
            }`}
          >
            <span className="block text-[9px] font-black uppercase">Keep current plan</span>
            <span className="mt-1 block text-[9px] font-semibold leading-4 opacity-70">Continue from the saved, currently approved storyboard.</span>
          </button>
          <button
            type="button"
            onClick={onSelectProposed}
            className={`rounded-md border px-3 py-2 text-left transition ${
              proposedPlanSelected
                ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-100"
                : "border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-100 hover:border-cyan-200/50"
            }`}
          >
            <span className="block text-[9px] font-black uppercase">Use proposed plan</span>
            <span className="mt-1 block text-[9px] font-semibold leading-4 opacity-75">Derive the next plan from this exact chat instruction and preview.</span>
          </button>
        </div>
        {proposal.analysisWarning && (
          <p className="rounded-md border border-amber-300/20 bg-amber-300/[0.055] px-2.5 py-2 text-[9px] font-semibold leading-4 text-amber-100">
            {proposal.analysisWarning}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/[0.07] bg-black/20 px-2.5 py-2 text-[9px] font-black">
          <span className="text-cyan-100">
            Regenerate continuously: {shots.map((shot) => `Shot ${shot.shotNumber}`).join(" → ")}
          </span>
          {continuityAnchors.length > 0 && (
            <span className="text-slate-500">
              Read-only continuity: {continuityAnchors.map((shotNumber) => `Shot ${shotNumber}`).join(", ")}
            </span>
          )}
        </div>
        {shots.map((shot, shotIndex) => {
          const perSecondFrames = Array.isArray(shot.perSecondFrames) ? shot.perSecondFrames : [];
          return (
            <article key={`${shot.shotNumber || shotIndex}-${shot.title || ""}`} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase text-cyan-200">Shot {shot.shotNumber || shotIndex + 1}</p>
                  <p className="mt-0.5 text-[11px] font-black text-white">{shot.title || `Shot ${shot.shotNumber || shotIndex + 1}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-black uppercase">
                  {shot.storyboardChangeRequired !== false && (
                    <span className="rounded-full border border-cyan-300/15 px-2 py-1 text-cyan-200">Storyboard changes</span>
                  )}
                  {shot.productFrameChangeRequired !== false && (
                    <span className="rounded-full border border-purple-300/15 px-2 py-1 text-purple-200">Product frame changes</span>
                  )}
                  <span className="text-slate-500">Nothing copied yet</span>
                </div>
              </div>
              {shot.changeSummary && <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-300">{shot.changeSummary}</p>}
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <PlanningPreviewField label="Current approved plan" value={shot.currentFrameDescription} muted />
                <PlanningPreviewField label="Proposed after Apply" value={shot.proposedFrameDescription} />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <PlanningPreviewField label="Camera" value={shot.cameraPlan} />
                <PlanningPreviewField label="Lens and focus" value={shot.lensFocusPlan} />
                <PlanningPreviewField label="Lighting" value={shot.lightingPlan} />
                <PlanningPreviewField label="Direction" value={shot.directionPlan} />
                <PlanningPreviewField label="Transition" value={shot.transitionPlan} />
                <PlanningPreviewField label="Sound" value={shot.soundPlan} />
              </div>
              {shot.overlayPlan && Object.keys(shot.overlayPlan).length > 0 && (
                <PlanningPreviewField
                  className="mt-2"
                  label="On-screen text"
                  value={overlayPreviewText(shot.overlayPlan)}
                />
              )}
              {perSecondFrames.length > 0 && (
                <details className="mt-2 rounded-md border border-white/10 bg-black/20">
                  <summary className="cursor-pointer list-none px-2.5 py-2 text-[9px] font-black uppercase text-slate-300">
                    View {perSecondFrames.length} second-by-second frame{perSecondFrames.length === 1 ? "" : "s"}
                  </summary>
                  <div className="space-y-1.5 border-t border-white/10 p-2">
                    {perSecondFrames.map((frame, frameIndex) => (
                      <div key={`${frame.startTimeSeconds || frameIndex}-${frame.endTimeSeconds || ""}`} className="rounded-md border border-white/[0.07] bg-black/25 p-2">
                        <p className="text-[8px] font-black uppercase text-cyan-200">
                          {formatFrameTime(frame, frameIndex)}
                        </p>
                        <p className="mt-1 text-[9px] font-semibold leading-4 text-slate-200">{frame.frameDescription}</p>
                        <p className="mt-1 text-[8px] font-semibold leading-3.5 text-slate-500">
                          Camera: {frame.cameraAction} · Lighting: {frame.lightingAction} · Focus: {frame.focusAction}
                        </p>
                        <p className="mt-1 text-[8px] font-semibold leading-3.5 text-slate-500">
                          Direction: {frame.directorAction} · Transition: {frame.transitionAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </article>
          );
        })}
        <p className="px-1 text-[9px] font-semibold leading-4 text-slate-500">
          Apply copies this approved direction into screenplay, storyboard, product, camera, lighting, overlay, planning sheets, and the complete per-second video prompt.
        </p>
      </div>
    </details>
  );
}

function CreativeLearningPreview({ candidates = [] }) {
  const rules = candidates
    .map((candidate) => (
      candidate && typeof candidate === "object"
        ? candidate
        : { principle: String(candidate || "") }
    ))
    .filter((candidate) => String(candidate.principle || candidate.rule || "").trim());
  if (!rules.length) return null;
  return (
    <details className="mt-2 overflow-hidden rounded-lg border border-emerald-300/15 bg-emerald-300/[0.035]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[10px] font-black text-emerald-100">
        <span>Future-ad learning preview</span>
        <span className="shrink-0 text-[8px] uppercase text-emerald-300">{rules.length} · saved only on Apply</span>
      </summary>
      <div className="space-y-1.5 border-t border-white/10 p-2.5">
        {rules.map((rule, index) => (
          <p key={`${rule.principle || rule.rule}-${index}`} className="text-[9px] font-semibold leading-4 text-slate-300">
            {index + 1}. {rule.principle || rule.rule}
          </p>
        ))}
        <p className="text-[8px] font-semibold leading-3.5 text-slate-500">
          General principles only. Product names, logos, claims, URLs, and exact reference compositions are never reused.
        </p>
      </div>
    </details>
  );
}

function PlanningPreviewField({ label, value, muted = false, className = "" }) {
  if (!value) return null;
  return (
    <div className={`rounded-md border border-white/[0.07] bg-black/20 px-2.5 py-2 ${className}`}>
      <p className="text-[8px] font-black uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-[9px] font-semibold leading-4 ${muted ? "text-slate-500" : "text-slate-200"}`}>{String(value)}</p>
    </div>
  );
}

function overlayPreviewText(overlay = {}) {
  if (overlay.enabled === false) return "No on-screen text in this shot.";
  const text = String(overlay.text || "").trim();
  const font = String(overlay.fontFamily || "").trim();
  const position = String(overlay.position || "").trim();
  const entrance = String(overlay.entrance || "").trim();
  const exit = String(overlay.exit || "").trim();
  return [
    text ? `"${text}"` : "AI-selected approved copy",
    font,
    position,
    [entrance, exit].filter(Boolean).join(" → "),
  ].filter(Boolean).join(" · ");
}

function formatFrameTime(frame = {}, index = 0) {
  const start = Number(frame.startTimeSeconds);
  const end = Number(frame.endTimeSeconds);
  if (Number.isFinite(start) && Number.isFinite(end)) {
    return `${formatSecond(start)}–${formatSecond(end)}`;
  }
  return `Second ${Number(frame.second) || index + 1}`;
}

function formatSecond(value) {
  return `${Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 1)}s`;
}

function ReviewFrame({ label, imageUrl, onReview, onZoom, disabled }) {
  return (
    <div className="bg-black/30 p-2">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-slate-950">
        {imageUrl ? (
          <button
            type="button"
            onClick={onZoom}
            className="group h-full w-full cursor-zoom-in"
            aria-label={`Zoom ${label}`}
          >
            <img src={imageUrl} alt={label} className="h-full w-full object-contain" />
            <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-slate-950/85 text-white opacity-80 transition group-hover:opacity-100">
              <ZoomIn size={13} />
            </span>
          </button>
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div>
              <ImageIcon size={20} className="mx-auto text-slate-700" />
              <p className="mt-1 text-[9px] font-black uppercase text-slate-600">Frame pending</p>
            </div>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-slate-950/85 px-2 py-1 text-[8px] font-black uppercase text-white">
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={onReview}
        disabled={disabled}
        className="creator-control mt-2 flex h-8 w-full items-center justify-center gap-1.5 text-[9px] font-black text-white disabled:opacity-50"
      >
        <MessageSquareText size={11} />
        Review {imageUrl ? "this frame" : "this shot"}
      </button>
    </div>
  );
}

function frameUrlsForReviewShot(shot = {}) {
  const nested = [
    shot.shotPayload,
    shot.shot_payload,
    shot.storyboardTag,
    shot.storyboard_tag,
  ].filter((value) => value && typeof value === "object");
  const assets = [
    ...(Array.isArray(shot.imageAssets) ? shot.imageAssets : []),
    ...(Array.isArray(shot.image_assets) ? shot.image_assets : []),
    ...(Array.isArray(shot.shotImages) ? shot.shotImages : []),
    ...(Array.isArray(shot.shot_images) ? shot.shot_images : []),
    ...(Array.isArray(shot.images) ? shot.images : []),
    ...(Array.isArray(shot.assets) ? shot.assets : []),
  ];
  const assetUrl = (kindTerms) => {
    const match = assets.find((asset) => {
      const kind = String(asset?.imageKind || asset?.image_kind || asset?.assetType || asset?.asset_type || asset?.kind || "").toLowerCase();
      return kindTerms.some((term) => kind.includes(term));
    });
    return firstFrameUrl(match);
  };
  return {
    storyboard: firstFrameUrl(
      shot.storyboardImageUrl,
      shot.storyboard_image_url,
      shot.shotDesignImageUrl,
      shot.imageUrl,
      shot.image_url,
      ...nested.map((value) => value.storyboardImageUrl || value.storyboard_image_url),
      assetUrl(["storyboard"])
    ),
    product: firstFrameUrl(
      shot.productionImageUrl,
      shot.production_image_url,
      shot.generatedProductImageUrl,
      shot.generated_product_image_url,
      shot.imageAnchorUrl,
      shot.image_anchor_url,
      ...nested.map((value) => value.productionImageUrl || value.production_image_url || value.generatedProductImageUrl),
      assetUrl(["production", "product", "anchor"])
    ),
  };
}

function firstFrameUrl(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = value.signedUrl || value.publicUrl || value.assetUrl || value.imageUrl || value.url;
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
  }
  return "";
}

function referenceAssetId(asset = {}) {
  return String(asset.assetId || asset.id || "").trim();
}

function formatReferenceUsageMode(value) {
  return String(value || "").toUpperCase() === "EXACT_SOURCE" ? "Use exactly" : "Inspiration only";
}

function formatTargetType(value) {
  return {
    STORYBOARD: "Storyboard image",
    PRODUCT_FRAME: "Product frame",
    STORYBOARD_AND_PRODUCT: "Both frames",
    PLANNING: "Complete planning",
  }[String(value || "").toUpperCase()] || String(value || "").replaceAll("_", " ");
}

function comparablePreviewText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isCompleteProposedFrame(value) {
  const text = comparablePreviewText(value);
  if (text.split(" ").filter(Boolean).length < 5) return false;
  return !/(?:\bimage of|\buse image of|\bof|\bto|\bwith|\band|\bfor|\busing)$/.test(text);
}

function proposalHasMeaningfulDelta(proposal = {}) {
  const affectedShotNumbers = Array.isArray(proposal.affectedShotNumbers)
    ? proposal.affectedShotNumbers.map(Number).filter((value) => Number.isInteger(value) && value > 0)
    : [];
  if (!affectedShotNumbers.length) return true;
  const previews = Array.isArray(proposal.planningChangePreview)
    ? proposal.planningChangePreview
    : [];
  return affectedShotNumbers.every((shotNumber) => {
    const preview = previews.find((item) => Number(item?.shotNumber || item?.shot_number) === shotNumber);
    if (!preview) return false;
    const current = comparablePreviewText(preview.currentFrameDescription);
    const proposed = comparablePreviewText(preview.proposedFrameDescription);
    return Boolean(current && proposed && current !== proposed && isCompleteProposedFrame(proposed));
  });
}

function applyReviewButtonLabel(message = {}) {
  const affectedShotNumbers = reviewMessageAffectedShotNumbers(message);
  const proposal = message?.proposal && typeof message.proposal === "object" ? message.proposal : {};
  const previews = Array.isArray(proposal.planningChangePreview) ? proposal.planningChangePreview : [];
  const storyboardCount = previews.filter((item) => item?.storyboardChangeRequired !== false).length;
  const productCount = previews.filter((item) => item?.productFrameChangeRequired !== false).length;
  if (affectedShotNumbers.length > 1) {
    if (productCount === 0) return `Apply plan + generate ${storyboardCount} storyboards`;
    if (storyboardCount === 0) return `Apply plan + generate ${productCount} product frames`;
    return `Apply plan + generate ${affectedShotNumbers.length} shots`;
  }
  if (affectedShotNumbers.length === 1) {
    if (productCount === 0) return "Apply plan + generate storyboard";
    if (storyboardCount === 0) return "Apply plan + generate product frame";
    return "Apply plan + generate both frames";
  }
  return "Apply to complete planning";
}

function reviewMessageAffectedShotNumbers(message = {}) {
  const proposal = message?.proposal && typeof message.proposal === "object" ? message.proposal : {};
  return [...new Set([
    ...(Array.isArray(message?.affectedShotNumbers) ? message.affectedShotNumbers : []),
    ...(Array.isArray(proposal?.affectedShotNumbers) ? proposal.affectedShotNumbers : []),
    message?.shotNumber,
    proposal?.shotNumber,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0))]
    .sort((left, right) => left - right);
}

function formatUpdatedAt(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "";
  }
}
