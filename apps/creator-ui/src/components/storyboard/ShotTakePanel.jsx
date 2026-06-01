// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Clapperboard, Copy, Film, Image as ImageIcon, Lightbulb, Mic2, Music, Pause, Play, Plus, RefreshCw, SlidersHorizontal, Sparkles, Undo2, Upload, Volume2, X } from "lucide-react";

export default function ShotTakePanel({
  scenes = [],
  takes = [],
  scriptId,
  pricingMatrix = {},
  focusedShotNumber,
  isLoading,
  isBusy,
  activeJob,
  onUpload,
  onUploadReferenceFrame,
  onDeleteTimelineFrame,
  onSaveSoundTimeline,
  onUploadSoundSnippet,
  onGenerateSound,
  onReview,
  onConfirm,
  onEnhancePreview,
  onApplyPreviewToTimeline,
  onStudioPolish,
  onStudioPolishAll,
  onEnhanceAudio,
  onFeedback,
  onEnhanceAll,
}) {
  const [draftFiles, setDraftFiles] = useState({});
  const [selectedFramePreviews, setSelectedFramePreviews] = useState({});
  const [enhancementFrameKeys, setEnhancementFrameKeys] = useState({});
  const [referenceFrameSavingKey, setReferenceFrameSavingKey] = useState("");
  const [timelineFrameDeletingKey, setTimelineFrameDeletingKey] = useState("");
  const [draftNotes, setDraftNotes] = useState({});
  const [editNotes, setEditNotes] = useState({});
  const [lastEnhancementPrompt, setLastEnhancementPrompt] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [studioPreset, setStudioPreset] = useState("clean_studio");
  const [studioControls, setStudioControls] = useState(() => defaultStudioControls("clean_studio"));
  const [studioControlsOpen, setStudioControlsOpen] = useState(false);
  const [copiedPolishRecipe, setCopiedPolishRecipe] = useState(null);
  const [selectedShotNumber, setSelectedShotNumber] = useState(Number(focusedShotNumber || 0));
  const [sequencePlayerOpen, setSequencePlayerOpen] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const takesByShot = useMemo(() => latestTakeByShot(takes), [takes]);
  const shotOptions = useMemo(() => scenes.map((scene, index) => ({
    scene,
    shotNumber: Number(scene.shotNumber || index + 1),
    title: scene.title || scene.description || `Shot ${index + 1}`,
  })), [scenes]);
  useEffect(() => {
    const focused = Number(focusedShotNumber || 0);
    const first = shotOptions[0]?.shotNumber || 0;
    const exists = shotOptions.some((shot) => shot.shotNumber === selectedShotNumber);
    if (focused && focused !== selectedShotNumber) {
      setSelectedShotNumber(focused);
    } else if (!exists && first) {
      setSelectedShotNumber(first);
    }
  }, [focusedShotNumber, selectedShotNumber, shotOptions]);
  const activeShotIndex = Math.max(0, shotOptions.findIndex((shot) => shot.shotNumber === selectedShotNumber));
  const activeShot = shotOptions[activeShotIndex] || shotOptions[0] || null;
  const activeScenes = activeShot ? [activeShot.scene] : [];
  const finalShotSequence = useMemo(() => shotOptions
    .map((shot) => {
      const take = takesByShot.get(shot.shotNumber);
      const variant = (take?.variants || []).find((item) => item.finalVideoUrl);
      return variant?.finalVideoUrl ? {
        shotNumber: shot.shotNumber,
        title: shot.title,
        url: variant.finalVideoUrl,
      } : null;
    })
    .filter(Boolean), [shotOptions, takesByShot]);
  const acceptedCount = takes.filter((take) => take.accepted).length;
  const latestApprovedVariant = takes
    .flatMap((take) => take.variants || [])
    .find((variant) => variant.status === "PREVIEW_READY" || variant.previewUrl);
  const studioPayload = (editNote = "", take = null, extra = {}) => ({
    editNote,
    preset: studioPreset,
    plateMode: studioControls?.background?.replace ? "clean_background_plate" : "original_background_grade",
    generatePlateFromReference: Boolean(take?.referenceFrameUrl && studioControls?.background?.replace),
    studioPolishControls: studioControls,
    ...extra,
  });
  const updateStudioPreset = (value) => {
    setStudioPreset(value);
    setStudioControls(defaultStudioControls(value));
  };
  const updateStudioControl = (section, key, value) => {
    setStudioControls((current) => ({
      ...current,
      [section]: {
        ...(current?.[section] || {}),
        [key]: value,
      },
    }));
  };
  const handleSelectReferenceFrame = async (take, frame) => {
    if (!take?.takeId || !frame?.thumbnailDataUrl || isBusy) return;
    const key = timelineFrameKey(take, frame);
    setSelectedFramePreviews((current) => ({
      ...current,
      [take.takeId]: {
        key,
        thumbnailDataUrl: frame.thumbnailDataUrl,
        timestampSeconds: frame.timestampSeconds,
        frameIndex: frame.index,
      },
    }));
    setReferenceFrameSavingKey(key);
    try {
      const file = await dataUrlToFile(
        frame.thumbnailDataUrl,
        `shot-${String(take.shotNumber || "frame").padStart(2, "0")}-anchor-${Math.round(Number(frame.timestampSeconds || 0) * 1000)}.jpg`
      );
      await onUploadReferenceFrame?.(take, file, {
        source: "timeline",
        timestampSeconds: frame.timestampSeconds,
        frameIndex: frame.index,
      });
    } finally {
      setReferenceFrameSavingKey((current) => current === key ? "" : current);
    }
  };
  const handleDeleteTimelineFrame = async (take, frame) => {
    if (!take?.takeId || !frame || isBusy) return;
    const key = timelineFrameKey(take, frame);
    setTimelineFrameDeletingKey(key);
    try {
      await onDeleteTimelineFrame?.(take, frame);
      setSelectedFramePreviews((current) => {
        if (current[take.takeId]?.key !== key) return current;
        const next = { ...current };
        delete next[take.takeId];
        return next;
      });
    } finally {
      setTimelineFrameDeletingKey((current) => current === key ? "" : current);
    }
  };
  const updateEditNote = (takeId, value) => {
    setEditNotes((current) => ({ ...current, [takeId]: value }));
    if (String(value || "").trim()) {
      setLastEnhancementPrompt(value);
    }
  };
  const runEnhancePreview = (take, note = "") => {
    const prompt = String(note || "").trim() || String(lastEnhancementPrompt || "").trim();
    if (prompt) {
      setLastEnhancementPrompt(prompt);
    }
    if (take?.takeId) {
      setEnhancementFrameKeys((current) => ({
        ...current,
        [take.takeId]: selectedFramePreviews[take.takeId]?.key || savedReferenceFrameKey(take) || `asset:${take.assetUrl || take.publicUrl || take.takeId}`,
      }));
    }
    onEnhancePreview?.(take, prompt);
  };
  useEffect(() => {
    if (sequenceIndex >= finalShotSequence.length) {
      setSequenceIndex(0);
    }
    if (!finalShotSequence.length && sequencePlayerOpen) {
      setSequencePlayerOpen(false);
    }
  }, [finalShotSequence.length, sequenceIndex, sequencePlayerOpen]);

  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-emerald-200">Shoot & Polish</p>
          <h3 className="mt-1 text-lg font-extrabold text-white">Record takes against the shot plan</h3>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            {acceptedCount}/{scenes.length || 0} accepted takes {activeJob ? `- ${activeJob.message || activeJob.status}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
          <button
            type="button"
            onClick={() => {
              setSequenceIndex(0);
              setSequencePlayerOpen(true);
            }}
            disabled={!finalShotSequence.length}
            className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 disabled:opacity-50"
            title={finalShotSequence.length ? "Play polished shot videos in storyboard order." : "Render at least one final polished video first."}
          >
            <Play size={15} />
            {finalShotSequence.length === scenes.length && scenes.length ? "Play Complete Video" : `Play Final Shots ${finalShotSequence.length}/${scenes.length || 0}`}
          </button>
          <button
            type="button"
            onClick={() => onStudioPolishAll?.(studioPayload())}
            disabled={!scriptId || !acceptedCount || isBusy}
            className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            <Sparkles size={15} className={isBusy ? "animate-pulse" : ""} />
            Studio Polish Accepted
          </button>
          <button
            type="button"
            onClick={() => onEnhanceAll?.({ approvedVariantId: latestApprovedVariant?.variantId })}
            disabled={!scriptId || !acceptedCount || isBusy}
            className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 disabled:opacity-50"
          >
            <Sparkles size={15} className={isBusy ? "animate-pulse" : ""} />
            Premium Veo
          </button>
        </div>
      </div>
      <AiPricingMatrix matrix={pricingMatrix} shotCount={scenes.length || 0} acceptedCount={acceptedCount} />
      {sequencePlayerOpen && (
        <FinalSequencePlayer
          sequence={finalShotSequence}
          totalShots={scenes.length || 0}
          index={sequenceIndex}
          onIndexChange={setSequenceIndex}
          onClose={() => setSequencePlayerOpen(false)}
        />
      )}
      <div className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-bold text-slate-200">
            <SlidersHorizontal size={15} className="text-emerald-200" />
            <span className="shrink-0">Studio Look</span>
            <select
              value={studioPreset}
              disabled={isBusy}
              onChange={(event) => updateStudioPreset(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white outline-none"
            >
              {STUDIO_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-slate-950 text-white">{preset.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setStudioControlsOpen((current) => !current)}
            className="creator-control flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200"
          >
            <SlidersHorizontal size={13} /> Advanced
          </button>
        </div>
        {studioControlsOpen && (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ControlGroup title="Background">
              <SelectControl label="Style" value={studioControls.background.style} options={STUDIO_PRESETS} onChange={(value) => updateStudioControl("background", "style", value)} />
              <SliderControl label="Blur" value={studioControls.background.blur} onChange={(value) => updateStudioControl("background", "blur", value)} />
              <SliderControl label="Darkness" value={studioControls.background.darkness} min={-0.5} max={0.8} onChange={(value) => updateStudioControl("background", "darkness", value)} />
              <SliderControl label="Warmth" value={studioControls.background.warmth} min={-0.5} max={0.5} onChange={(value) => updateStudioControl("background", "warmth", value)} />
              <SliderControl label="Saturation" value={studioControls.background.saturation} min={-0.6} max={0.8} onChange={(value) => updateStudioControl("background", "saturation", value)} />
              <CheckboxControl label="Replace Background" checked={studioControls.background.replace} onChange={(value) => updateStudioControl("background", "replace", value)} />
              <CheckboxControl label="Regenerate Background" checked={studioControls.background.regenerate} onChange={(value) => updateStudioControl("background", "regenerate", value)} />
            </ControlGroup>
            <ControlGroup title="Lighting">
              <SliderControl label="Face Brightness" value={studioControls.lighting.faceBrightness} min={-0.3} max={0.6} onChange={(value) => updateStudioControl("lighting", "faceBrightness", value)} />
              <SliderControl label="Rim Light" value={studioControls.lighting.rimLight} max={0.8} onChange={(value) => updateStudioControl("lighting", "rimLight", value)} />
              <SliderControl label="Contrast" value={studioControls.lighting.contrast} min={-0.4} max={0.7} onChange={(value) => updateStudioControl("lighting", "contrast", value)} />
              <SliderControl label="Shadows" value={studioControls.lighting.shadows} min={-0.6} max={0.6} onChange={(value) => updateStudioControl("lighting", "shadows", value)} />
              <SliderControl label="Highlights" value={studioControls.lighting.highlights} min={-0.6} max={0.4} onChange={(value) => updateStudioControl("lighting", "highlights", value)} />
              <SliderControl label="Glow Bloom" value={studioControls.lighting.glowBloom} max={0.4} onChange={(value) => updateStudioControl("lighting", "glowBloom", value)} />
              <SliderControl label="Vignette" value={studioControls.lighting.vignette} max={0.6} onChange={(value) => updateStudioControl("lighting", "vignette", value)} />
            </ControlGroup>
            <ControlGroup title="Style">
              <SliderControl label="Cinematic" value={studioControls.style.cinematic} onChange={(value) => updateStudioControl("style", "cinematic", value)} />
              <SliderControl label="Sharpness" value={studioControls.style.sharpness} max={0.8} onChange={(value) => updateStudioControl("style", "sharpness", value)} />
              <SliderControl label="Skin Smoothing" value={studioControls.style.skinSmoothing} max={0.5} onChange={(value) => updateStudioControl("style", "skinSmoothing", value)} />
              <SliderControl label="Color Warmth" value={studioControls.style.colorWarmth} min={-0.5} max={0.5} onChange={(value) => updateStudioControl("style", "colorWarmth", value)} />
              <SliderControl label="LUT Intensity" value={studioControls.style.lutIntensity} onChange={(value) => updateStudioControl("style", "lutIntensity", value)} />
              <SliderControl label="Grain" value={studioControls.style.grain} max={0.25} onChange={(value) => updateStudioControl("style", "grain", value)} />
            </ControlGroup>
            <ControlGroup title="Camera">
              <SliderControl label="Zoom" value={studioControls.camera.zoom} max={0.25} onChange={(value) => updateStudioControl("camera", "zoom", value)} />
              <SelectControl label="Crop" value={studioControls.camera.crop} options={CROP_OPTIONS} onChange={(value) => updateStudioControl("camera", "crop", value)} />
              <SliderControl label="Stabilization" value={studioControls.camera.stabilization} onChange={(value) => updateStudioControl("camera", "stabilization", value)} />
              <SliderControl label="Cinematic Drift" value={studioControls.camera.cinematicDrift} max={0.3} onChange={(value) => updateStudioControl("camera", "cinematicDrift", value)} />
              <SliderControl label="Motion Blur" value={studioControls.camera.motionBlur} max={0.3} onChange={(value) => updateStudioControl("camera", "motionBlur", value)} />
            </ControlGroup>
          </div>
        )}
      </div>

      {shotOptions.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 p-2">
          <button
            type="button"
            disabled={activeShotIndex <= 0}
            onClick={() => setSelectedShotNumber(shotOptions[Math.max(0, activeShotIndex - 1)]?.shotNumber)}
            className="creator-control shrink-0 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
          >
            Prev
          </button>
          <div className="custom-scrollbar min-w-0 flex-1 overflow-x-auto pb-1">
            <div className="flex gap-2">
              {shotOptions.map((shot) => {
                const take = takesByShot.get(shot.shotNumber);
                const selected = shot.shotNumber === (activeShot?.shotNumber || selectedShotNumber);
                return (
                  <button
                    key={shot.shotNumber}
                    type="button"
                    onClick={() => setSelectedShotNumber(shot.shotNumber)}
                    className={`min-w-[7.5rem] rounded-lg border px-3 py-2 text-left transition ${
                      selected
                        ? "border-emerald-300/50 bg-emerald-300/10 text-white"
                        : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-normal text-slate-500">
                      Shot {String(shot.shotNumber).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block truncate text-xs font-bold">{shot.title}</span>
                    <span className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-normal ${
                      take?.accepted
                        ? "bg-emerald-400/15 text-emerald-100"
                        : take
                          ? "bg-amber-400/15 text-amber-100"
                          : "bg-white/10 text-slate-400"
                    }`}>
                      {take?.accepted ? "Accepted" : take ? "Uploaded" : "Empty"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            disabled={activeShotIndex >= shotOptions.length - 1}
            onClick={() => setSelectedShotNumber(shotOptions[Math.min(shotOptions.length - 1, activeShotIndex + 1)]?.shotNumber)}
            className="creator-control shrink-0 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {!scenes.length && (
          <div className="rounded-lg border border-amber-300/20 bg-amber-400/[0.045] p-4">
            <p className="text-xs font-black uppercase tracking-normal text-amber-200">Waiting for shot design</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
              Generate shot plans first. This page will then show one upload card per shot so the user can record, review, accept, and polish each take.
            </p>
          </div>
        )}
        {activeScenes.map((scene, index) => {
          const shotNumber = Number(scene.shotNumber || index + 1);
          const take = takesByShot.get(shotNumber);
          const takeId = take?.takeId || "";
          const draftFile = draftFiles[shotNumber];
          const variants = take?.variants || [];
          const currentClipVariants = variants.filter((variant) => variantBelongsToClip(variant, take, shotNumber));
          const latestVariant = currentClipVariants[0];
          const appliedPreviewVariant = currentClipVariants.find((variant) => variant.previewUrl && variantAppliedToTimeline(variant, take, shotNumber));
          const generatedPreviewVariant = currentClipVariants.find((variant) => variant.previewUrl && !variantAppliedToTimeline(variant, take, shotNumber));
          const latestFinalVideoVariant = currentClipVariants.find((variant) => variant.finalVideoUrl);
          const isVideoTake = String(take?.contentType || "").startsWith("video/");
          const selectedFramePreview = takeId ? selectedFramePreviews[takeId] : null;
          const selectedFrameTimestamp = normalizedTimelineNumber(selectedFramePreview?.timestampSeconds, referenceFrameTimestampSeconds(take));
          const assetFrameKey = take ? `asset:${take.assetUrl || take.publicUrl || take.takeId}` : "";
          const selectedFrameUrl = selectedFramePreview?.thumbnailDataUrl || take?.referenceFrameUrl || (!isVideoTake ? take?.assetUrl || take?.publicUrl || "" : "");
          const selectedFrameKey = selectedFramePreview?.key || savedReferenceFrameKey(take) || (!isVideoTake ? assetFrameKey : "");
          const generatedPreviewForSelectedFrame = generatedPreviewVariant
            && selectedFrameKey
            && enhancementFrameKeys[takeId] === selectedFrameKey
            ? generatedPreviewVariant
            : null;
          const displayVariant = latestFinalVideoVariant || generatedPreviewForSelectedFrame || appliedPreviewVariant || latestVariant;
          const latestRecipe = variantPolishRecipe(displayVariant) || variantPolishRecipe(latestVariant);
          const previewUrl = generatedPreviewForSelectedFrame?.previewUrl || "";
          const finalVideoUrl = latestFinalVideoVariant?.finalVideoUrl || latestVariant?.finalVideoUrl;
          const timelinePreviewUrl = appliedPreviewVariant?.previewUrl || "";
          const clipUiKey = `${shotNumber}-${takeId || "empty"}-${selectedFrameKey || "no-frame"}-${generatedPreviewForSelectedFrame?.variantId || "no-preview"}-${appliedPreviewVariant?.variantId || "not-applied"}`;
          const review = take?.reviews?.[0];
          const soundLayers = review?.soundTimeline?.length || take?.validationSummary?.soundTimeline?.length || 0;
          const hasImageAnchor = Boolean(take && (!isVideoTake || take.referenceFrameUrl));
          const shotEnhanceBlockReason = shotEnhanceDisabledReason({ take, isBusy, isVideoTake, hasImageAnchor });
          return (
            <article key={`${shotNumber}-${takeId || "empty"}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Shot {String(shotNumber).padStart(2, "0")}</p>
                  <h4 className="mt-1 line-clamp-2 text-sm font-extrabold text-white">{scene.title || scene.description || `Shot ${shotNumber}`}</h4>
                </div>
                <StatusPill status={take?.status || "PENDING_UPLOAD"} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(22rem,1.15fr)]">
                <div className="space-y-2">
                  <label className="block rounded-lg border border-dashed border-white/15 bg-black/20 p-3">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-200"><Upload size={14} /> Upload take</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      disabled={isBusy || isLoading || !scriptId}
                      onChange={(event) => setDraftFiles((current) => ({ ...current, [shotNumber]: event.target.files?.[0] || null }))}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                    />
                    {draftFile && <span className="mt-2 block truncate text-[11px] font-semibold text-emerald-200">{draftFile.name}</span>}
                  </label>
                  <textarea
                    value={draftNotes[shotNumber] || ""}
                    onChange={(event) => setDraftNotes((current) => ({ ...current, [shotNumber]: event.target.value }))}
                    placeholder="Shot note"
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    disabled={!draftFile || isBusy || !scriptId}
                    onClick={() => onUpload?.(scene, draftFile, draftNotes[shotNumber] || "")}
                    className="creator-control flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
                  >
                    <Upload size={14} /> Save Take
                  </button>
                </div>

                <div className="space-y-3">
                  <MediaPreview key={`preview-${clipUiKey}`} take={take} scene={scene} finalVideoUrl={finalVideoUrl} />
                  {take ? (
                    <div className="space-y-3">
                      <ShotEnhancementState
                        key={`enhancement-${clipUiKey}`}
                        take={take}
                        scene={scene}
                        isBusy={isBusy}
                        previewUrl={previewUrl}
                        finalVideoUrl={finalVideoUrl}
                        selectedFrameUrl={selectedFrameUrl}
                        selectedFrameTimestamp={selectedFrameTimestamp}
                        selectedFrameIndex={selectedFramePreview?.frameIndex}
                        previewVariant={generatedPreviewForSelectedFrame}
                        appliedVariant={appliedPreviewVariant}
                        editNote={editNotes[take.takeId] || ""}
                        studioPayload={studioPayload}
                        onStudioPolish={onStudioPolish}
                        isPreviewInTimeline={false}
                        onAddToTimeline={() => generatedPreviewForSelectedFrame && onApplyPreviewToTimeline?.(take, generatedPreviewForSelectedFrame, true)}
                        onRemoveFromTimeline={() => appliedPreviewVariant && onApplyPreviewToTimeline?.(take, appliedPreviewVariant, false)}
                      />
                      <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.045] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
                              <Sparkles size={13} /> Enhance This Shot
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                              Improve the selected shot image with lighting, background, production design, grading, and actor look.
                            </p>
                          </div>
                          <StatusPill status={displayVariant?.status || "READY"} />
                        </div>
                        <textarea
                          value={editNotes[take.takeId] || ""}
                          onChange={(event) => updateEditNote(take.takeId, event.target.value)}
                          placeholder="Example: make lighting cinematic, clean background, enhance face clarity, keep same pose and expression"
                          rows={3}
                          className="mt-3 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600"
                        />
                        {!editNotes[take.takeId]?.trim() && lastEnhancementPrompt.trim() && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => updateEditNote(take.takeId, lastEnhancementPrompt)}
                            className="mt-2 rounded-md border border-cyan-300/15 bg-cyan-400/[0.045] px-2 py-1 text-left text-[11px] font-bold text-cyan-100 transition hover:border-cyan-200/40 disabled:opacity-50"
                            title="Use the last enhancement prompt on this clip."
                          >
                            Use last prompt: {shortRecipeText(lastEnhancementPrompt)}
                          </button>
                        )}
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={Boolean(shotEnhanceBlockReason)}
                              onClick={() => runEnhancePreview(take, editNotes[take.takeId] || "")}
                              className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                              title={shotEnhanceBlockReason || "Enhance this selected shot frame with the prompt above."}
                            >
                              <Sparkles size={14} className={isBusy ? "animate-pulse" : ""} />
                              {!hasImageAnchor ? "Choose Frame First" : displayVariant?.status === "PREVIEW_READY" ? "Enhance Again" : "Enhance Shot"}
                            </button>
                            {copiedPolishRecipe && copiedPolishRecipe.takeId !== take.takeId && (
                              <button
                                type="button"
                                disabled={Boolean(shotEnhanceBlockReason)}
                                onClick={() => runEnhancePreview(take, copiedEnhancementPrompt(
                                  copiedPolishRecipe.recipe,
                                  editNotes[take.takeId] || "",
                                  lastEnhancementPrompt
                                ))}
                                className="creator-control flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-200 disabled:opacity-50"
                                title={`Enhance this clip using the copied Shot ${String(copiedPolishRecipe.shotNumber || "").padStart(2, "0")} look.`}
                              >
                                <Copy size={13} /> Same Look
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-slate-500">
                            {shotEnhanceBlockReason || (isVideoTake
                              ? take.referenceFrameUrl ? "Using selected timeline frame." : "Click a timeline frame first."
                              : "Optional prompt. Empty uses shot production design.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-500">
                      Upload and save this shot before enhancement.
                    </div>
                  )}
                </div>
              </div>

              {take && (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <QuickStat icon={Film} label="Review" value={take.reviewStatus || "Pending"} />
                    <QuickStat icon={Clapperboard} label="Match" value={take.accepted ? "Accepted" : take.status === "NEEDS_RESHOOT" ? "Re-shoot" : "Check"} />
                    <QuickStat icon={Lightbulb} label="Sound layers" value={soundLayers ? `${soundLayers}` : "Pending"} />
                  </div>
                  {isVideoTake && (
                    <MediaTimeline
                      key={`timeline-${clipUiKey}`}
                      take={take}
                      scene={scene}
                      disabled={isBusy}
                      savingFrameKey={referenceFrameSavingKey}
                      deletingFrameKey={timelineFrameDeletingKey}
                      previewUrl={previewUrl}
                      timelinePreviewUrl={timelinePreviewUrl}
                      finalVideoUrl={finalVideoUrl}
                      selectedFrameTimestamp={selectedFrameTimestamp}
                      onSelectFrame={(frame) => handleSelectReferenceFrame(take, frame)}
                      onDeleteFrame={(frame) => handleDeleteTimelineFrame(take, frame)}
                    />
                  )}
                  <SoundTimelineEditor
                    take={take}
                    scene={scene}
                    disabled={isBusy}
                    onSaveSoundTimeline={onSaveSoundTimeline}
                    onUploadSoundSnippet={onUploadSoundSnippet}
                    onGenerateSound={onGenerateSound}
                    onEnhanceAudio={onEnhanceAudio}
                  />
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold leading-5 text-slate-300">
                    {take.validationSummary?.message || review?.message || "Run review, then accept the take or ask for a re-shoot."}
                  </p>
                  {isVideoTake && (
                    <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-100">
                        <ImageIcon size={14} /> Image-wise Gemini anchor
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                        Click a frame in the timeline above. Gemini uses that exact frame for the fast image-wise preview, then Veo can render the final video with sound.
                      </p>
                      {selectedFrameUrl && (
                        <div className="mt-3 w-full max-w-sm overflow-hidden rounded-lg border border-white/10 bg-black" style={{ aspectRatio: mediaSourceAspectRatio(take, "16 / 9") }}>
                          <img src={selectedFrameUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <p className="mt-2 text-[11px] font-bold text-slate-500">
                        {selectedFrameUrl ? `Selected frame${selectedFrameTimestamp == null ? "" : ` at ${formatTimelineTime(selectedFrameTimestamp)}`}. Click another timeline frame to replace it.` : "No anchor selected yet."}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <MiniButton icon={RefreshCw} label="Review" disabled={isBusy} onClick={() => onReview?.(take)} />
                    <MiniButton icon={Check} label="Accept" disabled={isBusy || take.accepted} onClick={() => onConfirm?.(take, true)} />
                    <MiniButton icon={X} label="Re-shoot" disabled={isBusy} onClick={() => onConfirm?.(take, false)} />
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-400">Shot polish actions</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MiniButton
                        icon={Clapperboard}
                        label="Studio Polish"
                        disabled={isBusy || !take.accepted || !isVideoTake}
                        onClick={() => onStudioPolish?.(take, studioPayload(editNotes[take.takeId] || "", take))}
                      />
                      {latestRecipe && (
                        <MiniButton
                          icon={Copy}
                          label="Copy Look"
                          disabled={isBusy}
                          onClick={() => setCopiedPolishRecipe({
                            variantId: displayVariant.variantId,
                            takeId: take.takeId,
                            shotNumber: take.shotNumber,
                            recipe: latestRecipe,
                          })}
                        />
                      )}
                      {copiedPolishRecipe && copiedPolishRecipe.takeId !== take.takeId && (
                        <MiniButton
                          icon={Sparkles}
                          label={copiedPolishRecipe.recipe?.version === "image-wise-enhancement-v1"
                            ? `Enhance Like Shot ${String(copiedPolishRecipe.shotNumber || "").padStart(2, "0")}`
                            : `Apply Shot ${String(copiedPolishRecipe.shotNumber || "").padStart(2, "0")} Look`}
                          disabled={copiedPolishRecipe.recipe?.version === "image-wise-enhancement-v1"
                            ? Boolean(shotEnhanceBlockReason)
                            : isBusy || !take.accepted || !isVideoTake}
                          onClick={() => {
                            if (copiedPolishRecipe.recipe?.version === "image-wise-enhancement-v1") {
                              onEnhancePreview?.(take, copiedEnhancementPrompt(copiedPolishRecipe.recipe, editNotes[take.takeId] || ""));
                              return;
                            }
                            onStudioPolish?.(take, studioPayload(editNotes[take.takeId] || "", take, {
                              recipeSourceVariantId: copiedPolishRecipe.variantId,
                            }));
                          }}
                        />
                      )}
                    </div>
                    {(latestRecipe || copiedPolishRecipe) && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {latestRecipe && (
                          <RecipeChip
                            label="OpenCV Recipe"
                            value={recipeSummary(latestRecipe)}
                          />
                        )}
                        {copiedPolishRecipe && (
                          <RecipeChip
                            label="Copied Look"
                            value={`Shot ${String(copiedPolishRecipe.shotNumber || "").padStart(2, "0")}`}
                          />
                        )}
                      </div>
                    )}
                    {displayVariant && (
                      <div className="mt-3 space-y-2">
                        <StatusPill status={displayVariant.status} />
                        <textarea
                          value={feedbackNotes[take.takeId] || ""}
                          onChange={(event) => setFeedbackNotes((current) => ({ ...current, [take.takeId]: event.target.value }))}
                          placeholder="Preview edit feedback"
                          rows={2}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600"
                        />
                        <MiniButton
                          icon={RefreshCw}
                          label="Save Feedback"
                          disabled={isBusy || !feedbackNotes[take.takeId]}
                          onClick={() => onFeedback?.(take, feedbackNotes[take.takeId])}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

const STUDIO_PRESETS = [
  { id: "clean_studio", label: "Clean Studio" },
  { id: "cinematic_warm", label: "Cinematic Warm" },
  { id: "premium_podcast", label: "Premium Podcast" },
  { id: "dark_glossy", label: "Dark Glossy" },
  { id: "bright_beauty", label: "Bright Beauty" },
  { id: "minimal_creator", label: "Minimal Creator" },
];

const CROP_OPTIONS = [
  { id: "auto", label: "Auto" },
  { id: "original", label: "Original" },
  { id: "vertical", label: "Vertical" },
  { id: "horizontal", label: "Horizontal" },
  { id: "square", label: "Square" },
];

function AiPricingMatrix({ matrix = {}, shotCount = 0, acceptedCount = 0 }) {
  const entries = Array.isArray(matrix?.entries) ? matrix.entries : [];
  const workflows = Array.isArray(matrix?.workflowEstimates) ? matrix.workflowEstimates : [];
  if (!entries.length && !workflows.length) return null;
  const lowCost = workflowEstimate(workflows, "low_cost_shot_polish");
  const veo = workflowEstimate(workflows, "premium_veo_shot");
  const lyria = workflowEstimate(workflows, "lyria_music_clip");
  const textPlanning = entries.find((entry) => String(entry?.id || "").includes("gemini-2.5-flash") && !String(entry?.id || "").includes("lite"));
  const imageEntry = entries.find((entry) => entry?.id === "gemini_image");
  const localEntry = entries.find((entry) => entry?.id === "local_opencv_worker");
  const veoEntryData = entries.find((entry) => entry?.id === "veo_video");
  const billableShotCount = Math.max(0, Number(acceptedCount || 0));
  const perShotLowCost = estimateTotal(lowCost?.estimatedCost);
  const perShotVeo = estimateTotal(veo?.estimatedCost);
  const rows = [
    {
      label: "Planning JSON",
      value: textPlanning ? `$${formatRate(textPlanning.inputRate)} in / $${formatRate(textPlanning.outputRate)} out` : "Metered",
      note: "per 1M tokens",
    },
    {
      label: "Frame Preview",
      value: formatUsd(perShotLowCost || imageEntry?.outputRatePerImage),
      note: imageEntry ? `${imageEntry.model} per generated image` : "Gemini image",
    },
    {
      label: "OpenCV Polish",
      value: formatUsd(localEntry?.rate || 0),
      note: "AI provider cost only",
    },
    {
      label: "Premium Veo",
      value: formatUsd(perShotVeo || Number(veoEntryData?.ratePerSecond || 0)),
      note: perShotVeo ? "configured shot duration" : "per second",
    },
    {
      label: "Music / Foley",
      value: formatUsd(estimateTotal(lyria?.estimatedCost)),
      note: "Lyria clip",
    },
  ];
  const acceptedLowCost = perShotLowCost * billableShotCount;
  const acceptedVeo = perShotVeo * billableShotCount;

  return (
    <div className="mb-4 rounded-lg border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-normal text-cyan-100">AI Pricing Matrix</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
            Provider cost uses one backend calculator. Storage, CPU worker cost, taxes, and wallet markup are separate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
          <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">{matrix?.currency || "USD"}</span>
          <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">{shotCount || 0} shots</span>
          <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">{billableShotCount} accepted</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-normal text-slate-500">{row.label}</p>
            <p className="mt-1 truncate text-sm font-black text-white">{row.value}</p>
            <p className="mt-1 truncate text-[10px] font-bold text-slate-500">{row.note}</p>
          </div>
        ))}
      </div>
      {billableShotCount > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <PricingTotal label="Low-cost accepted shots" value={acceptedLowCost} count={billableShotCount} />
          <PricingTotal label="Premium Veo accepted shots" value={acceptedVeo} count={billableShotCount} />
        </div>
      )}
    </div>
  );
}

function PricingTotal({ label, value, count }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-emerald-100">{formatUsd(value)}</p>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{count} accepted takes</p>
    </div>
  );
}

function workflowEstimate(workflows = [], id) {
  return workflows.find((workflow) => workflow?.id === id) || null;
}

function estimateTotal(estimate = {}) {
  const value = Number(estimate?.totalCost ?? estimate?.providerCost ?? estimate?.amount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function formatUsd(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "$0.0000";
  if (number === 0) return "$0";
  if (number < 0.01) return `$${number.toFixed(4)}`;
  return `$${number.toFixed(2)}`;
}

function formatRate(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  return number < 1 ? number.toFixed(2) : number.toFixed(2);
}

function defaultStudioControls(preset = "clean_studio") {
  const base = {
    background: { style: preset, blur: 0.18, darkness: 0.08, warmth: 0.08, saturation: 0.04, replace: true, regenerate: false },
    lighting: { faceBrightness: 0.16, rimLight: 0.18, contrast: 0.18, shadows: -0.08, highlights: -0.04, glowBloom: 0, vignette: 0.12 },
    style: { cinematic: 0.45, sharpness: 0.16, skinSmoothing: 0.1, colorWarmth: 0.08, lutIntensity: 0.45, grain: 0.03 },
    camera: { zoom: 0, crop: "auto", stabilization: 0.25, cinematicDrift: 0, motionBlur: 0 },
  };
  const overrides = {
    cinematic_warm: {
      background: { warmth: 0.18, darkness: 0.12, saturation: 0.08 },
      lighting: { faceBrightness: 0.18, rimLight: 0.24, contrast: 0.24, vignette: 0.18 },
      style: { cinematic: 0.68, colorWarmth: 0.18, lutIntensity: 0.62, grain: 0.05 },
    },
    premium_podcast: {
      background: { style: "premium_podcast", blur: 0.12, darkness: 0.18, warmth: 0.12 },
      lighting: { faceBrightness: 0.14, rimLight: 0.3, contrast: 0.22, vignette: 0.2 },
      style: { cinematic: 0.55, sharpness: 0.18, lutIntensity: 0.5 },
    },
    dark_glossy: {
      background: { style: "dark_glossy", darkness: 0.35, saturation: -0.04 },
      lighting: { faceBrightness: 0.2, rimLight: 0.38, contrast: 0.32, shadows: -0.2, highlights: -0.08, vignette: 0.28 },
      style: { cinematic: 0.72, lutIntensity: 0.66, grain: 0.06 },
    },
    bright_beauty: {
      background: { style: "bright_beauty", blur: 0.22, darkness: -0.08, warmth: 0.12, saturation: 0.08 },
      lighting: { faceBrightness: 0.28, rimLight: 0.1, contrast: 0.1, shadows: 0.04, highlights: -0.1, vignette: 0.05 },
      style: { cinematic: 0.35, skinSmoothing: 0.2, colorWarmth: 0.1, lutIntensity: 0.32, grain: 0 },
    },
    minimal_creator: {
      background: { style: "minimal_creator", blur: 0.08, darkness: 0.02, warmth: 0.02, saturation: 0, replace: false },
      lighting: { faceBrightness: 0.1, rimLight: 0.08, contrast: 0.1, shadows: -0.03, highlights: -0.03, vignette: 0.04 },
      style: { cinematic: 0.2, sharpness: 0.1, skinSmoothing: 0.06, colorWarmth: 0.03, lutIntensity: 0.18, grain: 0 },
    },
  }[preset] || {};
  return mergeControls(base, overrides);
}

function mergeControls(base, overrides) {
  return Object.entries(overrides || {}).reduce((next, [section, values]) => ({
    ...next,
    [section]: { ...(next[section] || {}), ...(values || {}) },
  }), { ...base, background: { ...base.background }, lighting: { ...base.lighting }, style: { ...base.style }, camera: { ...base.camera } });
}

function ControlGroup({ title, children }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-400">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SliderControl({ label, value = 0, min = 0, max = 1, step = 0.01, onChange }) {
  const numericValue = Number(value || 0);
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-slate-500">{numericValue.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="w-full accent-emerald-300"
      />
    </label>
  );
}

function SelectControl({ label, value, options = [], onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function CheckboxControl({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] font-bold text-slate-300">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 accent-emerald-300"
      />
    </label>
  );
}

function latestTakeByShot(takes = []) {
  const map = new Map();
  (Array.isArray(takes) ? takes : []).forEach((take) => {
    const shotNumber = Number(take.shotNumber || 0);
    if (!shotNumber || map.has(shotNumber)) return;
    map.set(shotNumber, take);
  });
  return map;
}

async function dataUrlToFile(dataUrl, fileName) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

function timelineFrameKey(take = {}, frame = {}) {
  return `${take.takeId || take.id || "take"}:${frame.index ?? frame.timestampSeconds ?? "frame"}`;
}

function savedReferenceFrameKey(take = {}) {
  return take?.referenceFrameUrl ? `saved:${take.takeId || take.id || "take"}:${take.referenceFrameUrl}` : "";
}

function mediaSourceAspectRatio(take = {}, fallback = "16 / 9") {
  const video = take?.mediaAnalysis?.video || {};
  return mediaAspectRatioFromDimensions(video.width, video.height, fallback);
}

function mediaFrameAspectRatio(frame = {}, fallback = "16 / 9") {
  return frame.aspectRatio || mediaAspectRatioFromDimensions(
    frame.width || frame.originalWidth,
    frame.height || frame.originalHeight,
    fallback
  );
}

function mediaAspectRatioFromDimensions(width, height, fallback = "16 / 9") {
  const safeWidth = Number(width || 0);
  const safeHeight = Number(height || 0);
  if (!safeWidth || !safeHeight) return fallback;
  return `${safeWidth} / ${safeHeight}`;
}

function mediaTimelineDuration(take = {}, video = {}, audio = {}, frames = []) {
  const maxFrameTime = (Array.isArray(frames) ? frames : []).reduce((max, frame) => {
    const seconds = Number(frame?.timestampSeconds);
    return Number.isFinite(seconds) ? Math.max(max, seconds + 0.05) : max;
  }, 0);
  return Math.max(
    durationSecondsFrom(video.durationSeconds),
    durationSecondsFrom(video.duration),
    durationSecondsFrom(video.durationMs, 1000),
    durationSecondsFrom(video.durationMillis, 1000),
    durationSecondsFrom(audio.durationSeconds),
    durationSecondsFrom(audio.duration),
    durationSecondsFrom(audio.durationMs, 1000),
    durationSecondsFrom(audio.durationMillis, 1000),
    durationSecondsFrom(take?.mediaAnalysis?.durationSeconds),
    durationSecondsFrom(take?.mediaAnalysis?.duration),
    durationSecondsFrom(take?.durationSeconds),
    durationSecondsFrom(take?.duration),
    maxFrameTime
  );
}

function shotEnhanceDisabledReason({ take, isBusy, isVideoTake, hasImageAnchor }) {
  if (!take?.takeId) return "Save this take first.";
  if (isVideoTake && !hasImageAnchor) return "Click a timeline frame first.";
  if (!hasImageAnchor) return "Upload an image take first.";
  return "";
}

function durationSecondsFrom(value, divisor = 1) {
  const seconds = Number(value) / divisor;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

function buildSoundTrackLanes(layers = []) {
  const lanes = SOUND_TRACKS.reduce((map, track) => {
    map[track.id] = [];
    return map;
  }, {});
  (Array.isArray(layers) ? layers : []).forEach((layer) => {
    const track = normalizeSoundType(layer.layerType);
    const key = lanes[track] ? track : "foley";
    lanes[key].push(layer);
  });
  return lanes;
}

const SOUND_LAYER_TYPES = [
  { id: "dialogue", label: "Dialogue" },
  { id: "foley", label: "Foley" },
  { id: "ambience", label: "Ambience" },
  { id: "music", label: "Music" },
  { id: "sfx", label: "SFX" },
  { id: "sync_hit", label: "Sync Hit" },
];

const SOUND_OVERTAKE_OPTIONS = [
  { id: "dialogue", label: "Dialogue" },
  { id: "foley", label: "Foley" },
  { id: "background_music", label: "Music" },
  { id: "ambience", label: "Ambience" },
  { id: "sfx", label: "SFX" },
];

const SOUND_TRACKS = [
  { id: "dialogue", label: "Dialogue", icon: Mic2 },
  { id: "foley", label: "Foley", icon: Volume2 },
  { id: "ambience", label: "Ambience", icon: Volume2 },
  { id: "music", label: "Music", icon: Music },
  { id: "sfx", label: "SFX", icon: Sparkles },
  { id: "sync_hit", label: "Sync Hit", icon: Sparkles },
];

function SoundTimelineEditor({ take, scene, disabled = false, onSaveSoundTimeline, onUploadSoundSnippet, onGenerateSound, onEnhanceAudio }) {
  const [draft, setDraft] = useState(() => buildSoundTimelineDraft(take, scene));
  const [undoStack, setUndoStack] = useState([]);
  const [snippetFile, setSnippetFile] = useState(null);
  const [snippetDraft, setSnippetDraft] = useState(() => defaultSnippetLayer(take));
  const [generationDraft, setGenerationDraft] = useState(() => defaultGeneratedSoundDraft(take));
  const [audioEnhanceNote, setAudioEnhanceNote] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [draggingLayerId, setDraggingLayerId] = useState("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const sourcePreviewRef = useRef(null);
  const finalAudioVariant = (take?.variants || []).find((variant) => variant.finalAudioUrl);
  const duration = Math.max(soundTimelineDuration(take, draft.layers), 1);
  const ticks = timelineTicks(duration);
  const lanes = useMemo(() => buildSoundTrackLanes(draft.layers), [draft.layers]);
  const selectedLayerIndex = draft.layers.findIndex((layer) => layer.id === selectedLayerId);
  const selectedLayer = selectedLayerIndex >= 0 ? draft.layers[selectedLayerIndex] : draft.layers[0] || null;
  const inputSummary = soundInputSummary(take, draft.layers, finalAudioVariant);
  const canPreviewSource = Boolean(take?.assetUrl) && inputSummary.hasTakeAudio;
  const audioEnhanceBlockReason = audioEnhanceDisabledReason({ take, disabled, hasTakeAudio: inputSummary.hasTakeAudio });

  useEffect(() => {
    const nextDraft = buildSoundTimelineDraft(take, scene);
    setDraft(nextDraft);
    setUndoStack([]);
    setSelectedLayerId(nextDraft.layers[0]?.id || "");
    setSnippetDraft(defaultSnippetLayer(take));
    setGenerationDraft(defaultGeneratedSoundDraft(take));
    setAudioEnhanceNote("");
    setSnippetFile(null);
    setFileInputKey((current) => current + 1);
    setPlayheadSeconds(0);
    setDraggingLayerId("");
    sourcePreviewRef.current?.pause?.();
    setIsPreviewPlaying(false);
  }, [scene?.id, scene?.shotNumber, take?.takeId, take?.updatedAt]);

  useEffect(() => {
    if (!draft.layers.length) {
      setSelectedLayerId("");
      return;
    }
    if (!draft.layers.some((layer) => layer.id === selectedLayerId)) {
      setSelectedLayerId(draft.layers[0].id);
    }
  }, [draft.layers, selectedLayerId]);

  const pushUndo = () => {
    setUndoStack((current) => [...current.slice(-11), cloneSoundDraft(draft)]);
  };
  const undoDraft = () => {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setDraft(previous);
    setUndoStack((current) => current.slice(0, -1));
    setSelectedLayerId((current) => previous.layers.some((layer) => layer.id === current) ? current : previous.layers[0]?.id || "");
    setPlayheadSeconds(0);
  };
  const updateLayer = (index, key, value) => {
    pushUndo();
    setDraft((current) => ({
      ...current,
      layers: current.layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, [key]: value } : layer),
    }));
  };
  const updateSelectedLayer = (key, value) => {
    if (!selectedLayer?.id) return;
    pushUndo();
    setDraft((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === selectedLayer.id ? { ...layer, [key]: value } : layer),
    }));
  };
  const updateMix = (key, value) => {
    pushUndo();
    setDraft((current) => ({
      ...current,
      mixSettings: { ...current.mixSettings, [key]: value },
    }));
  };
  const addLayer = () => {
    const nextLayer = defaultSnippetLayer(take, draft.layers.length);
    pushUndo();
    setDraft((current) => ({
      ...current,
      layers: [...current.layers, nextLayer],
    }));
    setSelectedLayerId(nextLayer.id);
  };
  const deleteLayer = (layerId) => {
    pushUndo();
    setDraft((current) => ({
      ...current,
      layers: current.layers.filter((layer) => layer.id !== layerId),
    }));
  };
  const moveLayerToTrack = (layerId, trackId) => {
    if (!layerId || !trackId) return;
    pushUndo();
    setDraft((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === layerId ? { ...layer, layerType: trackId } : layer),
    }));
    setSelectedLayerId(layerId);
    setDraggingLayerId("");
  };
  const saveTimeline = () => {
    onSaveSoundTimeline?.(take, {
      layers: draft.layers.map(normalizeSoundLayerForSave),
      mixSettings: normalizeMixSettings(draft.mixSettings),
    });
  };
  const selectLayer = (layer) => {
    setSelectedLayerId(layer.id);
    setPlayheadSeconds(safeTimelineNumber(layer.startSeconds, 0));
  };
  const uploadSnippet = async () => {
    if (!snippetFile) return;
    await onUploadSoundSnippet?.(take, snippetFile, normalizeSoundLayerForSave({
      ...snippetDraft,
      label: snippetDraft.label || snippetFile.name,
      originalFilename: snippetFile.name,
    }));
    setSnippetFile(null);
    setSnippetDraft(defaultSnippetLayer(take));
    setFileInputKey((current) => current + 1);
  };
  const generateSound = async () => {
    if (!generationDraft.prompt?.trim()) return;
    await onGenerateSound?.(take, {
      ...generationDraft,
      startSeconds: playheadSeconds,
      endSeconds: playheadSeconds + Math.max(0.5, safeTimelineNumber(generationDraft.durationSeconds, 4)),
      mixSettings: normalizeMixSettings(draft.mixSettings),
    });
    setGenerationDraft((current) => ({ ...current, prompt: "" }));
  };
  const playFromPlayhead = async () => {
    const element = sourcePreviewRef.current;
    if (!element) return;
    element.currentTime = Math.max(0, Math.min(playheadSeconds, duration));
    try {
      await element.play?.();
      setIsPreviewPlaying(true);
    } catch {
      setIsPreviewPlaying(false);
    }
  };
  const toggleSourcePreview = () => {
    const element = sourcePreviewRef.current;
    if (!element) return;
    if (isPreviewPlaying && !element.paused) {
      element.pause();
      setIsPreviewPlaying(false);
      return;
    }
    playFromPlayhead();
  };
  const updatePlayheadFromPreview = (event) => {
    const seconds = Number(event.currentTarget.currentTime);
    if (Number.isFinite(seconds)) {
      setPlayheadSeconds(roundTimelineValue(Math.min(duration, Math.max(0, seconds))));
    }
  };
  const startAudioEnhance = () => {
    onEnhanceAudio?.(take, {
      mixSettings: normalizeMixSettings(draft.mixSettings),
      editNote: audioEnhanceNote || "Clean recorded voice, remove noise, improve clarity, and preserve original voice texture.",
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#05070b] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
            <Music size={13} /> Audio Editor
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {draft.layers.length} layers - {formatTimelineTime(duration)} - overtake: {soundOvertakeLabel(draft.mixSettings.overtakeLayer)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniButton icon={Undo2} label="Undo" disabled={disabled || !undoStack.length} onClick={undoDraft} title="Undo the last local timeline or mixer edit." />
          <MiniButton icon={Plus} label="Add Clip" disabled={disabled} onClick={addLayer} />
          <MiniButton icon={Volume2} label="Save Timeline" disabled={disabled} onClick={saveTimeline} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <SourceChip label="Input" value={inputSummary.input} tone={inputSummary.hasTakeAudio ? "ok" : "warn"} />
        <SourceChip label="Plan Cues" value={String(inputSummary.planCueCount)} tone={inputSummary.planCueCount ? "ok" : "muted"} />
        <SourceChip label="Snippets" value={String(inputSummary.snippetCount)} tone={inputSummary.snippetCount ? "ok" : "muted"} />
        <SourceChip label="AI Output" value={inputSummary.output} tone={inputSummary.hasOutput ? "ok" : "warn"} />
      </div>

      <div className="mt-3 rounded-md border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
        <div className="grid gap-3 lg:grid-cols-[9rem_minmax(0,1fr)_auto] lg:items-end">
          <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-100">
              <Mic2 size={13} /> Recorded Audio
            </p>
            <p className="mt-1 text-xs font-black text-white">{inputSummary.input}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-500">{formatTimelineTime(duration)}</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-400">Enhance prompt</span>
            <textarea
              value={audioEnhanceNote}
              disabled={disabled}
              onChange={(event) => setAudioEnhanceNote(event.target.value)}
              placeholder="Optional: remove room echo, reduce traffic noise, make voice clearer, preserve original tone and timing"
              rows={2}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            disabled={Boolean(audioEnhanceBlockReason)}
            onClick={startAudioEnhance}
            className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            title={audioEnhanceBlockReason || "Enhance the recorded audio from this take while preserving original voice, words, timing, and texture."}
          >
            <Mic2 size={14} className={disabled ? "" : undefined} />
            Enhance Audio
          </button>
        </div>
        {audioEnhanceBlockReason && (
          <p className="mt-2 text-[11px] font-bold text-slate-500">{audioEnhanceBlockReason}</p>
        )}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-md border border-white/10 bg-black/50">
          <div className="grid grid-cols-[7.5rem_minmax(34rem,1fr)] border-b border-white/10 bg-white/[0.035]">
            <div className="border-r border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-normal text-slate-500">Tracks</div>
            <div className="relative px-3 py-2">
              <div className="grid grid-cols-5 text-[10px] font-bold text-slate-500">
                {ticks.map((tick) => (
                  <span key={tick} className="border-l border-white/10 pl-1">{formatTimelineTime(tick)}</span>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                step="0.1"
                value={Math.min(duration, playheadSeconds)}
                disabled={disabled}
                onChange={(event) => setPlayheadSeconds(Number(event.target.value))}
                className="mt-2 w-full accent-cyan-300"
                aria-label="Playhead"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-normal text-cyan-100">
                  Playhead {formatTimelineTime(playheadSeconds)}
                </span>
                <button
                  type="button"
                  disabled={disabled || !canPreviewSource}
                  onClick={toggleSourcePreview}
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-slate-200 hover:border-cyan-300/40 disabled:opacity-50"
                >
                  {isPreviewPlaying ? "Pause" : "Play From Here"}
                </button>
              </div>
              {canPreviewSource && String(take?.contentType || "").toLowerCase().startsWith("audio/") ? (
                <audio
                  ref={sourcePreviewRef}
                  src={take.assetUrl}
                  className="hidden"
                  onTimeUpdate={updatePlayheadFromPreview}
                  onPause={() => setIsPreviewPlaying(false)}
                  onEnded={() => setIsPreviewPlaying(false)}
                />
              ) : canPreviewSource ? (
                <video
                  ref={sourcePreviewRef}
                  src={take.assetUrl}
                  className="hidden"
                  onTimeUpdate={updatePlayheadFromPreview}
                  onPause={() => setIsPreviewPlaying(false)}
                  onEnded={() => setIsPreviewPlaying(false)}
                />
              ) : null}
            </div>
          </div>
          <div className="custom-scrollbar overflow-x-auto">
            <div className="relative min-w-[42rem]">
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-30 w-px bg-cyan-200 shadow-[0_0_12px_rgba(125,211,252,0.9)]"
                style={{ left: `calc(7.5rem + ${Math.max(0, Math.min(88, (playheadSeconds / duration) * 88))}%)` }}
              />
              {SOUND_TRACKS.map((track) => {
                const Icon = track.icon;
                const trackLayers = lanes[track.id] || [];
                return (
                  <div key={track.id} className="grid grid-cols-[7.5rem_minmax(0,1fr)] border-b border-white/10 last:border-b-0">
                    <div className="flex items-center gap-2 border-r border-white/10 bg-white/[0.025] px-3 py-3">
                      <Icon size={13} className="text-slate-400" />
                      <span className="truncate text-[11px] font-black uppercase tracking-normal text-slate-400">{track.label}</span>
                    </div>
                    <div
                      className={`relative h-16 bg-black/30 ${draggingLayerId ? "outline outline-1 outline-cyan-300/10" : ""}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveLayerToTrack(event.dataTransfer.getData("text/plain") || draggingLayerId, track.id);
                      }}
                    >
                      <div className="absolute inset-0 grid grid-cols-5">
                        {ticks.map((tick) => <span key={tick} className="border-l border-white/10" />)}
                      </div>
                      {trackLayers.map((layer) => {
                        const start = safeTimelineNumber(layer.startSeconds, 0);
                        const end = Math.max(start + 0.05, safeTimelineNumber(layer.endSeconds, start + 1));
                        const left = Math.max(0, Math.min(96, (start / duration) * 100));
                        const width = Math.max(3, Math.min(100 - left, ((end - start) / duration) * 100));
                        const active = selectedLayer?.id === layer.id;
                        return (
                          <button
                            key={layer.id}
                            type="button"
                            draggable={!disabled}
                            disabled={disabled}
                            onClick={() => selectLayer(layer)}
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/plain", layer.id);
                              setDraggingLayerId(layer.id);
                            }}
                            onDragEnd={() => setDraggingLayerId("")}
                            className={`absolute top-3 h-10 rounded-md border px-2 text-left text-[10px] font-black uppercase tracking-normal shadow-lg transition ${
                              active
                                ? "border-white/80 ring-2 ring-cyan-200/40"
                                : "border-white/10 hover:border-white/40"
                            } ${soundLayerClass(layer.layerType)}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${layer.label || layer.description || soundTypeLabel(layer.layerType)} ${formatTimelineTime(start)}-${formatTimelineTime(end)}`}
                          >
                            <span className="block truncate">{layer.label || layer.description || soundTypeLabel(layer.layerType)}</span>
                            <span className="mt-0.5 block text-[9px] opacity-80">{formatTimelineTime(start)} - {formatTimelineTime(end)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Clip Inspector</p>
              {selectedLayer && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => deleteLayer(selectedLayer.id)}
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-slate-300 hover:border-amber-300/40 hover:text-amber-100 disabled:opacity-50"
                  title="Remove this clip from the saved mix timeline. Uploaded source assets are kept."
                >
                  Remove from Mix
                </button>
              )}
            </div>
            {selectedLayer ? (
              <div className="space-y-3">
                <select
                  value={selectedLayer.layerType}
                  disabled={disabled}
                  onChange={(event) => updateSelectedLayer("layerType", event.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
                >
                  {SOUND_LAYER_TYPES.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label}</option>
                  ))}
                </select>
                <input
                  value={selectedLayer.label || ""}
                  disabled={disabled}
                  onChange={(event) => updateSelectedLayer("label", event.target.value)}
                  placeholder="Clip name"
                  className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none placeholder:text-slate-600"
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumberMiniInput label="Start" value={selectedLayer.startSeconds} disabled={disabled} onChange={(value) => updateSelectedLayer("startSeconds", value)} />
                  <NumberMiniInput label="End" value={selectedLayer.endSeconds} disabled={disabled} onChange={(value) => updateSelectedLayer("endSeconds", value)} />
                </div>
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-end gap-2">
                  <SoundKnob label="Level" value={selectedLayer.volumeDb} min={-48} max={6} disabled={disabled} onChange={(value) => updateSelectedLayer("volumeDb", value)} />
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-500">Ducks Under</span>
                    <select
                      value={selectedLayer.duckUnder || "dialogue"}
                      disabled={disabled}
                      onChange={(event) => updateSelectedLayer("duckUnder", event.target.value)}
                      className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
                    >
                      {SOUND_OVERTAKE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id} className="bg-slate-950 text-white">Under {option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={addLayer}
                className="creator-control flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
              >
                <Plus size={13} /> Add Clip
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Mixer</p>
          <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-normal text-slate-400">Overtake Priority</span>
            <select
              value={draft.mixSettings.overtakeLayer}
              disabled={disabled}
              onChange={(event) => updateMix("overtakeLayer", event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
            >
              {SOUND_OVERTAKE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label} overtakes</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <SoundKnob label="Music" value={draft.mixSettings.musicBedDb} min={-48} max={0} disabled={disabled} onChange={(value) => updateMix("musicBedDb", value)} />
            <SoundKnob label="Foley" value={draft.mixSettings.foleyDuckingDb} min={-30} max={0} disabled={disabled} onChange={(value) => updateMix("foleyDuckingDb", value)} />
            <SoundKnob label="Voice" value={draft.mixSettings.dialogueDuckingDb} min={-30} max={0} disabled={disabled} onChange={(value) => updateMix("dialogueDuckingDb", value)} />
          </div>
          </div>

          <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Generate Sound</p>
          <textarea
            value={generationDraft.prompt}
            disabled={disabled}
            onChange={(event) => setGenerationDraft((current) => ({ ...current, prompt: event.target.value }))}
            placeholder="Describe music, foley, ambience, or SFX"
            rows={3}
            className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-2 text-[11px] font-bold text-white outline-none placeholder:text-slate-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={generationDraft.layerType}
              disabled={disabled}
              onChange={(event) => setGenerationDraft((current) => ({ ...current, layerType: event.target.value }))}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
            >
              {SOUND_LAYER_TYPES.filter((option) => option.id !== "dialogue").map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label}</option>
              ))}
            </select>
            <NumberMiniInput label="Seconds" value={generationDraft.durationSeconds} min={0.5} max={60} disabled={disabled} onChange={(value) => setGenerationDraft((current) => ({ ...current, durationSeconds: value }))} />
            <input
              value={generationDraft.mood}
              disabled={disabled}
              onChange={(event) => setGenerationDraft((current) => ({ ...current, mood: event.target.value }))}
              placeholder="Mood"
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none placeholder:text-slate-600"
            />
            <input
              value={generationDraft.instrumentation}
              disabled={disabled}
              onChange={(event) => setGenerationDraft((current) => ({ ...current, instrumentation: event.target.value }))}
              placeholder="Instruments"
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none placeholder:text-slate-600"
            />
          </div>
          <button
            type="button"
            disabled={disabled || !take?.accepted || !generationDraft.prompt?.trim()}
            onClick={generateSound}
            className="creator-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            title="Creates a pending generated clip at the playhead. The backend prepares the provider task; the audio worker uploads the rendered sound."
          >
            <Sparkles size={13} /> Generate at {formatTimelineTime(playheadSeconds)}
          </button>
          <div className="h-px bg-white/10" />
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Sound Bin</p>
          <label className="block rounded-md border border-dashed border-white/10 bg-black/20 p-2">
            <span className="mb-2 block text-[11px] font-bold text-slate-300">Upload sound snippet</span>
            <input
              key={fileInputKey}
              type="file"
              accept="audio/*"
              disabled={disabled}
              onChange={(event) => setSnippetFile(event.target.files?.[0] || null)}
              className="block w-full text-[11px] text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={snippetDraft.layerType}
              disabled={disabled}
              onChange={(event) => setSnippetDraft((current) => ({ ...current, layerType: event.target.value }))}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
            >
              {SOUND_LAYER_TYPES.filter((option) => option.id !== "dialogue").map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label}</option>
              ))}
            </select>
            <NumberMiniInput label="Start" value={snippetDraft.startSeconds} disabled={disabled} onChange={(value) => setSnippetDraft((current) => ({ ...current, startSeconds: value }))} />
            <NumberMiniInput label="End" value={snippetDraft.endSeconds} disabled={disabled} onChange={(value) => setSnippetDraft((current) => ({ ...current, endSeconds: value }))} />
            <SoundKnob label="Level" value={snippetDraft.volumeDb} min={-48} max={6} disabled={disabled} onChange={(value) => setSnippetDraft((current) => ({ ...current, volumeDb: value }))} />
          </div>
          <button
            type="button"
            disabled={disabled || !snippetFile}
            onClick={uploadSnippet}
            className="creator-control flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
          >
            <Upload size={13} /> Add Snippet
          </button>
          {finalAudioVariant?.finalAudioUrl && (
            <audio src={finalAudioVariant.finalAudioUrl} controls className="w-full" />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberMiniInput({ label, value, min = 0, max = 999, disabled = false, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step="0.1"
        value={Number.isFinite(Number(value)) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none disabled:opacity-50"
      />
    </label>
  );
}

function SourceChip({ label, value, tone = "muted" }) {
  const toneClass = {
    ok: "border-emerald-300/15 bg-emerald-400/[0.07] text-emerald-100",
    warn: "border-amber-300/15 bg-amber-400/[0.07] text-amber-100",
    muted: "border-white/10 bg-white/[0.035] text-slate-300",
  }[tone] || "border-white/10 bg-white/[0.035] text-slate-300";
  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="text-[9px] font-black uppercase tracking-normal opacity-70">{label}</p>
      <p className="mt-1 truncate text-xs font-black">{value}</p>
    </div>
  );
}

function RecipeChip({ label, value }) {
  return (
    <div className="rounded-md border border-cyan-300/15 bg-cyan-400/[0.055] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-normal text-cyan-100/80">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-cyan-50">{value}</p>
    </div>
  );
}

function variantPolishRecipe(variant = {}) {
  const payload = variant?.promptPayload || {};
  if (payload.copyableTransformationRecipe) return payload.copyableTransformationRecipe;
  if (payload.mode === "IMAGE_WISE_GEMINI_EDIT" || payload.imagePrompt || payload.editNote) {
    return {
      version: "image-wise-enhancement-v1",
      editNote: payload.editNote || "",
      imagePrompt: payload.imagePrompt,
      safeRetryImagePrompt: payload.safeRetryImagePrompt,
      storyboardTag: payload.storyboardTag,
      lightingBuildSheetTag: payload.lightingBuildSheetTag,
      cameraPlanSheetTag: payload.cameraPlanSheetTag,
    };
  }
  if (payload.opencvTransformationRecipe || payload.opencvPlan || payload.lookRecipe || payload.studioPolishControls) {
    return {
      version: "studio-polish-recipe-v1",
      preset: payload.preset,
      plateMode: payload.plateMode,
      studioPolishControls: payload.studioPolishControls,
      lookRecipe: payload.lookRecipe,
      opencvPlan: payload.opencvPlan,
      opencvTransformationRecipe: payload.opencvTransformationRecipe,
    };
  }
  return null;
}

function variantBelongsToClip(variant = {}, take = {}, shotNumber = 0) {
  if (!variant) return false;
  if (take?.takeId && String(variant.takeId || "") !== String(take.takeId)) return false;
  const payload = variant?.promptPayload || {};
  const timelineClip = payload.timelineClip || {};
  if (timelineClip.takeId && take?.takeId && String(timelineClip.takeId) !== String(take.takeId)) return false;
  if (Number(timelineClip.shotNumber || 0) && Number(timelineClip.shotNumber) !== Number(shotNumber || take?.shotNumber || 0)) return false;
  if (Number(payload.shotNumber || 0) && Number(payload.shotNumber) !== Number(shotNumber || take?.shotNumber || 0)) return false;
  return true;
}

function variantAppliedToTimeline(variant = {}, take = {}, shotNumber = 0) {
  const payload = variant?.promptPayload || {};
  const timelineClip = payload?.timelineClip || {};
  if (!variantBelongsToClip(variant, take, shotNumber)) return false;
  if (timelineClip.takeId && take?.takeId && String(timelineClip.takeId) !== String(take.takeId)) return false;
  if (Number(timelineClip.shotNumber || 0) && Number(timelineClip.shotNumber) !== Number(shotNumber || take?.shotNumber || 0)) return false;
  return variant?.status === "TIMELINE_APPLIED" || timelineClip.applied === true;
}

function copiedEnhancementPrompt(recipe = {}, currentNote = "", lastPrompt = "") {
  const copiedNote = String(recipe.editNote || "").trim();
  const extra = String(currentNote || "").trim();
  const priorPrompt = String(lastPrompt || "").trim();
  const pieces = [
    copiedNote ? `Use the same visual enhancement direction as the copied previous clip: ${copiedNote}` : "Use the same visual enhancement direction as the copied previous clip.",
    priorPrompt && priorPrompt !== copiedNote && priorPrompt !== extra ? `Carry forward the last user prompt as continuity: ${priorPrompt}` : "",
    "Keep this current clip reference frame as source of truth for face, pose, lips, hands, framing, and camera angle.",
    "Carry forward only compatible lighting, grading, background polish, production design, wardrobe/look continuity, and overall style.",
    extra ? `Additional current clip note: ${extra}` : "",
  ].filter(Boolean);
  return pieces.join("\n");
}

function recipeSummary(recipe = {}) {
  if (recipe.version === "image-wise-enhancement-v1") {
    return shortRecipeText(recipe.editNote || "image-wise look");
  }
  const look = recipe.lookRecipe || recipe.transformationIntent || {};
  const background = look.backgroundIntent || recipe.opencvTransformationRecipe?.backgroundTransforms?.strategy || "background";
  const lighting = look.lightingIntent || "lighting";
  const preset = recipe.preset || look.preset || "studio";
  return `${preset}: ${shortRecipeText(background)} + ${shortRecipeText(lighting)}`;
}

function shortRecipeText(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 24 ? `${text.slice(0, 24)}...` : text || "look";
}

function cloneSoundDraft(draft = {}) {
  return {
    layers: (Array.isArray(draft.layers) ? draft.layers : []).map((layer) => ({ ...layer })),
    mixSettings: { ...(draft.mixSettings || {}) },
  };
}

function soundInputSummary(take = {}, layers = [], finalAudioVariant = null) {
  const contentType = String(take?.contentType || "").toLowerCase();
  const hasTakeAudio = contentType.startsWith("video/") || contentType.startsWith("audio/");
  const snippetCount = (Array.isArray(layers) ? layers : []).filter((layer) => layer?.assetId || layer?.source === "user_upload" || layer?.source === "ai_generated").length;
  const planCueCount = (Array.isArray(layers) ? layers : []).filter((layer) => !layer?.assetId && !["user_upload", "ai_generated", "original_take_audio"].includes(layer?.source)).length;
  return {
    hasTakeAudio,
    hasOutput: Boolean(finalAudioVariant?.finalAudioUrl),
    input: hasTakeAudio ? "Take audio" : "No audio",
    snippetCount,
    planCueCount,
    output: finalAudioVariant?.finalAudioUrl ? "Ready" : "Not generated",
  };
}

function audioEnhanceDisabledReason({ take, disabled, hasTakeAudio }) {
  if (!take?.takeId) return "Save this take first.";
  if (!hasTakeAudio) return "Upload a video or audio take first.";
  return "";
}

function SoundKnob({ label, value, min = -48, max = 6, disabled = false, onChange }) {
  const numeric = clampUiNumber(value, min, max);
  const percent = max === min ? 0 : (numeric - min) / (max - min);
  const sweep = Math.round(percent * 270);
  const degrees = -135 + sweep;
  const display = numeric > -1 && numeric < 1 ? numeric.toFixed(1) : Math.round(numeric);
  return (
    <label className="flex min-w-0 flex-col items-center rounded-md border border-white/10 bg-black/25 p-2 text-center">
      <span className="mb-1 block max-w-full truncate text-[10px] font-bold text-slate-500">{label}</span>
      <span className="relative h-14 w-14 shrink-0">
        <span
          className="absolute inset-0 rounded-full border border-white/10 shadow-inner"
          style={{
            background: `conic-gradient(from -135deg, rgba(110,231,183,0.95) 0deg, rgba(34,211,238,0.9) ${sweep}deg, rgba(255,255,255,0.08) ${sweep}deg 270deg, rgba(255,255,255,0.02) 270deg)`,
          }}
        />
        <span className="absolute inset-[7px] rounded-full border border-white/10 bg-slate-950 shadow-[inset_0_0_18px_rgba(0,0,0,0.85)]" />
        <span
          className="absolute left-1/2 top-1/2 h-5 w-0.5 origin-bottom rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ transform: `translate(-50%, -100%) rotate(${degrees}deg)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step="0.5"
          value={numeric}
          disabled={disabled}
          onChange={(event) => onChange?.(Number(event.target.value))}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </span>
      <span className="mt-1 text-[10px] font-black tabular-nums text-slate-300">{display} dB</span>
    </label>
  );
}

function clampUiNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function buildSoundTimelineDraft(take = {}, scene = {}) {
  const savedTimeline = take?.mediaAnalysis?.soundTimeline || {};
  const savedLayers = Array.isArray(savedTimeline.layers) ? savedTimeline.layers : [];
  const originalLayer = originalTakeAudioLayer(take);
  const planLayers = savedLayers.length
    ? savedLayers
    : [
        ...(originalLayer ? [originalLayer] : []),
        ...(Array.isArray(take?.reviews?.[0]?.soundTimeline) ? take.reviews[0].soundTimeline : []),
        ...(Array.isArray(take?.validationSummary?.soundTimeline) ? take.validationSummary.soundTimeline : []),
        ...sceneSoundLayers(scene),
      ];
  const layers = savedLayers.length && originalLayer && !savedLayers.some((layer) => layer.source === "original_take_audio")
    ? [originalLayer, ...savedLayers]
    : planLayers;
  return {
    layers: normalizeSoundLayers(layers),
    mixSettings: normalizeMixSettings(savedTimeline.mixSettings || take?.mediaAnalysis?.audioMix || {}),
  };
}

function originalTakeAudioLayer(take = {}) {
  const contentType = String(take?.contentType || "").toLowerCase();
  if (!contentType.startsWith("video/") && !contentType.startsWith("audio/")) return null;
  const analysis = take?.mediaAnalysis || {};
  const duration = Math.max(
    durationSecondsFrom(analysis?.audio?.durationSeconds),
    durationSecondsFrom(analysis?.video?.durationSeconds),
    durationSecondsFrom(analysis?.durationSeconds),
    durationSecondsFrom(take?.durationSeconds),
    1
  );
  return {
    id: "original-take-dialogue",
    source: "original_take_audio",
    layerType: "dialogue",
    label: "Original dialogue",
    description: "Audio from uploaded take",
    startSeconds: 0,
    endSeconds: duration,
    volumeDb: 0,
    priority: 1,
    duckUnder: "dialogue",
  };
}

function sceneSoundLayers(scene = {}) {
  const tag = scene.storyboardTag || scene.storyboard_tag || {};
  const layers = [];
  const duration = Math.max(1, Number(scene.durationSeconds || scene.duration || 5) || 5);
  if (tag.ambientBedDescription || tag.ambient_bed_description) {
    layers.push({ layerType: "ambience", label: "Ambient bed", description: tag.ambientBedDescription || tag.ambient_bed_description, startSeconds: 0, endSeconds: duration, volumeDb: -22 });
  }
  if (tag.syncHitDescription || tag.sync_hit_description) {
    layers.push({ layerType: "sync_hit", label: "Sync hit", description: tag.syncHitDescription || tag.sync_hit_description, startSeconds: Math.max(0, duration - 0.5), endSeconds: duration, volumeDb: -6 });
  }
  [tag.soundDesign, tag.soundCues, tag.audioCues, tag.foleyNotes].forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          layers.push({ layerType: "foley", label: item, description: item, startSeconds: 0, endSeconds: duration, volumeDb: -10 });
        } else if (item && typeof item === "object") {
          layers.push(item);
        }
      });
    } else if (typeof value === "string" && value.trim()) {
      layers.push({ layerType: "foley", label: value, description: value, startSeconds: 0, endSeconds: duration, volumeDb: -10 });
    }
  });
  return layers;
}

function normalizeSoundLayers(layers = []) {
  return (Array.isArray(layers) ? layers : []).map((layer, index) => normalizeSoundLayerForSave({
    id: layer.id || `sound-layer-${index}`,
    layerType: normalizeSoundType(layer.layerType || layer.type),
    label: layer.label || layer.description || layer.cue || layer.note || soundTypeLabel(layer.layerType || layer.type),
    description: layer.description || layer.text || layer.cue || layer.note || "",
    startSeconds: safeTimelineNumber(layer.startSeconds ?? layer.startTime ?? layer.timingSeconds, 0),
    endSeconds: safeTimelineNumber(layer.endSeconds ?? layer.endTime, safeTimelineNumber(layer.startSeconds ?? layer.timingSeconds, 0) + 1),
    volumeDb: safeTimelineNumber(layer.volumeDb ?? layer.gainDb ?? volumeLevelToDb(layer.volumeLevel || layer.volume), -10),
    priority: Number(layer.priority || index + 1),
    duckUnder: normalizeOvertakeLayer(layer.duckUnder || layer.duckingTarget || "dialogue"),
    source: layer.source || (layer.assetId ? "user_upload" : "plan"),
    assetId: layer.assetId,
    assetUrl: layer.assetUrl,
    contentType: layer.contentType,
    originalFilename: layer.originalFilename,
  }));
}

function normalizeSoundLayerForSave(layer = {}) {
  const start = Math.max(0, safeTimelineNumber(layer.startSeconds, 0));
  const end = Math.max(start + 0.05, safeTimelineNumber(layer.endSeconds, start + 1));
  return {
    ...layer,
    id: layer.id || `sound-layer-${Math.random().toString(36).slice(2, 8)}`,
    layerType: normalizeSoundType(layer.layerType),
    label: layer.label || layer.description || soundTypeLabel(layer.layerType),
    description: layer.description || "",
    startSeconds: roundTimelineValue(start),
    endSeconds: roundTimelineValue(end),
    volumeDb: Math.max(-48, Math.min(6, safeTimelineNumber(layer.volumeDb, -10))),
    priority: Math.max(1, Number(layer.priority || 1)),
    duckUnder: normalizeOvertakeLayer(layer.duckUnder || "dialogue"),
  };
}

function defaultSnippetLayer(take = {}, index = 0) {
  const duration = Math.max(1, soundTimelineDuration(take, []));
  return {
    id: `sound-layer-${Date.now()}-${index}`,
    layerType: "foley",
    label: "",
    description: "",
    startSeconds: 0,
    endSeconds: Math.min(duration, 1),
    volumeDb: -10,
    priority: index + 1,
    duckUnder: "dialogue",
    source: "user_upload",
  };
}

function defaultGeneratedSoundDraft(take = {}) {
  const duration = Math.max(1, soundTimelineDuration(take, []));
  return {
    prompt: "",
    layerType: "music",
    durationSeconds: Math.min(duration, 4),
    volumeDb: -14,
    mood: "",
    instrumentation: "",
    bpmRange: "",
    loopable: true,
    avoidVocals: true,
  };
}

function normalizeMixSettings(settings = {}) {
  return {
    primaryLayer: normalizeOvertakeLayer(settings.primaryLayer || "dialogue"),
    overtakeLayer: normalizeOvertakeLayer(settings.overtakeLayer || "dialogue"),
    dialogueDuckingDb: Math.max(-30, Math.min(0, safeTimelineNumber(settings.dialogueDuckingDb, -10))),
    foleyDuckingDb: Math.max(-30, Math.min(0, safeTimelineNumber(settings.foleyDuckingDb, -6))),
    musicBedDb: Math.max(-48, Math.min(0, safeTimelineNumber(settings.musicBedDb, -18))),
    ambienceBedDb: Math.max(-48, Math.min(0, safeTimelineNumber(settings.ambienceBedDb, -22))),
    backgroundMusicDucksUnderDialogue: settings.backgroundMusicDucksUnderDialogue !== false,
    foleyDucksUnderDialogue: settings.foleyDucksUnderDialogue !== false,
  };
}

function soundTimelineDuration(take = {}, layers = []) {
  const analysis = take?.mediaAnalysis || {};
  const video = analysis.video || {};
  const audio = analysis.audio || {};
  const frames = Array.isArray(video.frames) ? video.frames : [];
  const layerEnd = (Array.isArray(layers) ? layers : []).reduce((max, layer) => Math.max(max, safeTimelineNumber(layer.endSeconds, 0)), 0);
  return Math.max(mediaTimelineDuration(take, video, audio, frames), layerEnd, 1);
}

function safeTimelineNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizedTimelineNumber(value, fallback = null) {
  if (value !== null && value !== undefined && value !== "") {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  if (fallback === null || fallback === undefined) return null;
  const fallbackNumber = Number(fallback);
  return Number.isFinite(fallbackNumber) ? fallbackNumber : null;
}

function shortId(value = "") {
  const text = String(value || "");
  return text.length > 8 ? text.slice(0, 8) : text;
}

function roundTimelineValue(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function normalizeSoundType(value) {
  const text = String(value || "foley").toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (["dialogue", "spoken", "voice"].includes(text)) return "dialogue";
  if (["ambient_bed", "ambience", "ambience_bed"].includes(text)) return "ambience";
  if (["background_music", "music", "bgm"].includes(text)) return "music";
  if (["sfx", "sync_hit", "foley"].includes(text)) return text;
  return "foley";
}

function normalizeOvertakeLayer(value) {
  const text = String(value || "dialogue").toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (["voice", "spoken"].includes(text)) return "dialogue";
  if (["music", "bgm"].includes(text)) return "background_music";
  if (["dialogue", "foley", "background_music", "ambience", "sfx"].includes(text)) return text;
  return "dialogue";
}

function soundTypeLabel(value) {
  const normalized = normalizeSoundType(value);
  return SOUND_LAYER_TYPES.find((type) => type.id === normalized)?.label || "Foley";
}

function soundOvertakeLabel(value) {
  const normalized = normalizeOvertakeLayer(value);
  return SOUND_OVERTAKE_OPTIONS.find((option) => option.id === normalized)?.label || "Dialogue";
}

function soundLayerClass(layerType) {
  const normalized = normalizeSoundType(layerType);
  if (normalized === "dialogue") return "bg-cyan-300/85 text-slate-950";
  if (normalized === "music") return "bg-violet-300/85 text-slate-950";
  if (normalized === "ambience") return "bg-teal-300/85 text-slate-950";
  if (normalized === "sfx" || normalized === "sync_hit") return "bg-amber-300/85 text-slate-950";
  return "bg-emerald-300/85 text-slate-950";
}

function volumeLevelToDb(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("high")) return -6;
  if (text.includes("low")) return -22;
  if (text.includes("medium")) return -12;
  return Number.isFinite(Number(value)) ? Number(value) : -10;
}

function maxFrameTimestampSeconds(frames = []) {
  return (Array.isArray(frames) ? frames : []).reduce((max, frame) => {
    const seconds = Number(frame?.timestampSeconds);
    return Number.isFinite(seconds) ? Math.max(max, seconds) : max;
  }, 0);
}

function referenceFrameTimestampSeconds(take = {}) {
  const candidates = [
    take?.validationSummary?.referenceFrame?.timestampSeconds,
    take?.validationSummary?.selectedFrame?.timestampSeconds,
    take?.mediaAnalysis?.referenceFrame?.timestampSeconds,
    take?.mediaAnalysis?.selectedFrame?.timestampSeconds,
    take?.mediaAnalysis?.referenceFrameTimestampSeconds,
    take?.mediaAnalysis?.selectedFrameTimestampSeconds,
  ];
  for (const value of candidates) {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return seconds;
  }
  return null;
}

function FinalSequencePlayer({ sequence = [], totalShots = 0, index = 0, onIndexChange, onClose }) {
  const currentIndex = Math.max(0, Math.min(sequence.length - 1, Number(index) || 0));
  const current = sequence[currentIndex];
  if (!current) return null;
  const isComplete = totalShots > 0 && sequence.length >= totalShots;
  const goTo = (nextIndex) => onIndexChange?.(Math.max(0, Math.min(sequence.length - 1, nextIndex)));
  return (
    <div className="mb-4 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.055] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
            <Play size={13} /> {isComplete ? "Complete polished video" : "Polished shot sequence"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-300">
            Shot {String(current.shotNumber).padStart(2, "0")} of {totalShots || sequence.length}: {current.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={() => goTo(currentIndex - 1)}
            className="creator-control px-3 py-2 text-[10px] font-black uppercase tracking-normal text-slate-200 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={currentIndex >= sequence.length - 1}
            onClick={() => goTo(currentIndex + 1)}
            className="creator-control px-3 py-2 text-[10px] font-black uppercase tracking-normal text-slate-200 disabled:opacity-50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/25 text-slate-300 transition hover:border-white/25 hover:text-white"
            aria-label="Close final sequence player"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <video
        key={current.url}
        src={current.url}
        controls
        autoPlay
        playsInline
        className="mx-auto max-h-[34rem] w-full rounded-lg border border-white/10 bg-black"
        onEnded={() => {
          if (currentIndex < sequence.length - 1) goTo(currentIndex + 1);
        }}
      />
      {!isComplete && (
        <p className="mt-2 rounded-md border border-amber-300/15 bg-amber-400/[0.06] px-2 py-1.5 text-[11px] font-bold text-amber-100">
          {sequence.length}/{totalShots || sequence.length} shots have final videos. Render the remaining shots before client playback/export.
        </p>
      )}
    </div>
  );
}

function ShotEnhancementState({
  take,
  scene,
  isBusy,
  previewUrl,
  finalVideoUrl,
  selectedFrameUrl = "",
  selectedFrameTimestamp = null,
  selectedFrameIndex = null,
  previewVariant = null,
  appliedVariant = null,
  editNote = "",
  studioPayload,
  onStudioPolish,
  isPreviewInTimeline = false,
  onAddToTimeline,
  onRemoveFromTimeline,
}) {
  const isVideoTake = String(take?.contentType || "").startsWith("video/");
  const appliedPreviewUrl = appliedVariant?.previewUrl || "";
  const analysisImageUrl = previewUrl || appliedPreviewUrl;
  const analysisVariant = previewUrl ? previewVariant : appliedVariant;
  const canRenderFinal = Boolean(take?.takeId && isVideoTake && take?.accepted && analysisImageUrl && !finalVideoUrl);
  const frame = shotFrameSpec(scene, take);
  if (finalVideoUrl) {
    return (
      <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.07] px-3 py-2">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
          <Film size={13} /> Final video active
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
          The timeline play button now uses the polished video for this shot.
        </p>
      </div>
    );
  }
  if (!selectedFrameUrl && !analysisImageUrl) return null;
  return (
    <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/[0.04] p-2.5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <PreviewAnalysisImage
          label="Timeline frame"
          imageUrl={selectedFrameUrl}
          frame={frame}
          meta={selectedFrameTimestamp == null ? "" : `${formatTimelineTime(selectedFrameTimestamp)}${selectedFrameIndex == null ? "" : ` - F${selectedFrameIndex}`}`}
          emptyText="Choose a raw timeline frame"
        />
        <PreviewAnalysisImage
          label="Preview variant"
          imageUrl={analysisImageUrl}
          frame={frame}
          meta={analysisVariant?.variantId ? `Variant ${shortId(analysisVariant.variantId)}` : ""}
          emptyText="Generate an enhancement"
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-100">
            <Sparkles size={13} /> Preview image analysis
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-300">
            {analysisImageUrl
              ? "This result belongs to the selected shot clip. Apply it to the polished timeline when it looks right."
              : "Select a frame, then generate an enhancement variant for that exact clip."}
          </p>
          {analysisVariant?.variantId && (
            <p className="mt-1 truncate text-[10px] font-bold text-cyan-100/80">
              {analysisVariant.variantId}
            </p>
          )}
        </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {previewUrl ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={isPreviewInTimeline ? onRemoveFromTimeline : onAddToTimeline}
                className="creator-control flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
                title={isPreviewInTimeline ? "Remove this returned image from the current clip." : "Apply this returned image to the current clip timeline."}
              >
                <ImageIcon size={13} /> {isPreviewInTimeline ? "Remove" : "Apply to Clip"}
              </button>
            ) : analysisImageUrl ? (
              <span className="rounded-md border border-cyan-300/15 bg-cyan-400/[0.07] px-3 py-2 text-xs font-bold text-cyan-100">
                Applied
              </span>
            ) : null}
            <button
              type="button"
              disabled={!canRenderFinal || isBusy}
              onClick={() => onStudioPolish?.(take, studioPayload?.(editNote, take))}
              className="creator-primary flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              title={canRenderFinal ? "Render a playable polished video for the timeline." : "Accept this video take before rendering the final timeline version."}
            >
              <Film size={13} /> Render
            </button>
          </div>
          {isPreviewInTimeline && (
            <p className="mt-2 text-[10px] font-bold text-cyan-100">Applied to this clip.</p>
          )}
          {!take?.accepted && isVideoTake && (
            <p className="mt-2 text-[10px] font-bold text-slate-500">Accept take to render final video.</p>
          )}
      </div>
    </div>
  );
}

function PreviewAnalysisImage({ label, imageUrl, frame, meta = "", emptyText = "" }) {
  return (
    <div>
      <div
        className="relative overflow-hidden rounded-md border border-cyan-300/20 bg-black"
        style={{ aspectRatio: frame.aspectRatio }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full"
            style={{ objectFit: frame.objectFit, objectPosition: frame.objectPosition }}
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center px-3 text-center text-[10px] font-bold uppercase tracking-normal text-slate-500">
            {emptyText}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-white/80">
          {label}
        </span>
      </div>
      {meta && <p className="mt-1 truncate text-[10px] font-bold text-cyan-100/80">{meta}</p>}
    </div>
  );
}

function MediaPreview({ take, scene, finalVideoUrl }) {
  const src = finalVideoUrl || take?.assetUrl;
  const contentType = take?.contentType || "";
  const referenceFrameUrl = take?.referenceFrameUrl || "";
  const frame = shotFrameSpec(scene, take);
  const sourceAspectRatio = mediaSourceAspectRatio(take, frame.aspectRatio);
  const mediaStyle = {
    objectFit: frame.objectFit,
    objectPosition: frame.objectPosition,
  };
  const referenceStyle = {
    objectFit: "cover",
    objectPosition: frame.objectPosition,
  };
  if (!src) {
    return (
      <div className="grid min-h-[11rem] place-items-center rounded-lg border border-white/10 bg-black/30 text-center text-xs font-bold text-slate-500">
        No take
      </div>
    );
  }
  if (finalVideoUrl) {
    return (
      <div className="space-y-2">
        <EditorFrame frame={frame}>
          <video src={finalVideoUrl} controls className="h-full w-full bg-black" style={mediaStyle} />
        </EditorFrame>
        <p className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
          Final polished video is ready.
        </p>
      </div>
    );
  }
  if (contentType.startsWith("video/")) {
    return (
      <div className="space-y-2">
        <EditorFrame frame={frame}>
          <video src={src} controls className="h-full w-full bg-black" style={mediaStyle} />
        </EditorFrame>
        {referenceFrameUrl ? (
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border border-cyan-300/15 bg-black" style={{ aspectRatio: sourceAspectRatio }}>
            <img src={referenceFrameUrl} alt="" className="h-full w-full" style={referenceStyle} loading="lazy" />
          </div>
        ) : (
          <div className="grid h-20 place-items-center rounded-lg border border-dashed border-cyan-300/15 bg-cyan-400/[0.035] text-center text-[11px] font-bold text-cyan-100">
            Choose timeline frame for Gemini polish
          </div>
        )}
      </div>
    );
  }
  return (
    <EditorFrame frame={frame}>
      <img src={src} alt="" className="h-full w-full bg-black" style={mediaStyle} loading="lazy" />
    </EditorFrame>
  );
}

function EditorFrame({ frame, children }) {
  return (
    <div className="space-y-2">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
        style={{ aspectRatio: frame.aspectRatio, maxWidth: frame.maxWidth }}
      >
        {children}
        <div className="pointer-events-none absolute inset-x-[10%] inset-y-0 border-x border-white/15" />
        <div className="pointer-events-none absolute inset-y-[8%] inset-x-0 border-y border-white/10" />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-1 text-[9px] font-black uppercase tracking-normal text-white/80">
          {frame.label}
        </div>
      </div>
      <p className="text-center text-[10px] font-bold leading-4 text-slate-500">{frame.alignmentLabel}</p>
    </div>
  );
}

function MediaTimeline({
  take,
  scene,
  disabled = false,
  savingFrameKey = "",
  deletingFrameKey = "",
  previewUrl = "",
  timelinePreviewUrl = "",
  finalVideoUrl = "",
  selectedFrameTimestamp = null,
  onSelectFrame,
  onDeleteFrame,
}) {
  const [mediaElementDuration, setMediaElementDuration] = useState(0);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rawTimelineOpen, setRawTimelineOpen] = useState(true);
  const [editedTimelineOpen, setEditedTimelineOpen] = useState(true);
  const mediaRef = useRef(null);
  const analysis = take?.mediaAnalysis || {};
  const video = analysis.video || {};
  const audio = analysis.audio || {};
  const frames = Array.isArray(video.frames) ? video.frames.filter((frame) => frame?.thumbnailDataUrl) : [];
  const peaks = Array.isArray(audio.peaks) ? audio.peaks : [];
  const duration = Math.max(mediaTimelineDuration(take, video, audio, frames), mediaElementDuration);
  const frameSpec = shotFrameSpec(scene, take);
  const sourceAspectRatio = mediaSourceAspectRatio(take, frameSpec.aspectRatio);
  const selectedReferenceTimestamp = normalizedTimelineNumber(selectedFrameTimestamp, referenceFrameTimestampSeconds(take));
  const selectedReferenceFrame = selectedReferenceTimestamp == null
    ? null
    : frames.find((frame) => Math.abs(Number(frame.timestampSeconds || 0) - selectedReferenceTimestamp) < 0.18);
  const timelineAnchorFrame = selectedReferenceFrame || frames[0] || null;
  const editedClipAspectRatio = mediaFrameAspectRatio(timelineAnchorFrame, sourceAspectRatio || frameSpec.aspectRatio);
  const ticks = timelineTicks(duration);
  const frameCoverage = maxFrameTimestampSeconds(frames);
  const framesStopEarly = frames.length > 0 && duration > 0 && frameCoverage > 0 && duration - frameCoverage > 0.75;
  const src = finalVideoUrl || take?.assetUrl || take?.publicUrl || "";
  const contentType = String(finalVideoUrl ? "video/mp4" : take?.contentType || "").toLowerCase();
  const usingFinalVideo = Boolean(finalVideoUrl);
  const canPlaySource = Boolean(src) && (contentType.startsWith("video/") || contentType.startsWith("audio/"));
  const hasPolishClip = Boolean(timelinePreviewUrl || finalVideoUrl);
  const playheadPercent = duration > 0 ? Math.max(0, Math.min(100, (playheadSeconds / duration) * 100)) : 0;
  useEffect(() => {
    if (hasPolishClip) setEditedTimelineOpen(true);
  }, [hasPolishClip]);
  useEffect(() => {
    if (!src || !contentType.startsWith("video/")) {
      setMediaElementDuration(0);
      return undefined;
    }
    let cancelled = false;
    const element = document.createElement("video");
    element.preload = "metadata";
    element.src = src;
    const read = () => {
      if (cancelled) return;
      const seconds = Number(element.duration);
      if (Number.isFinite(seconds) && seconds > 0) {
        setMediaElementDuration(Math.round(seconds * 1000) / 1000);
      }
    };
    element.addEventListener("loadedmetadata", read);
    element.addEventListener("durationchange", read);
    const timers = [250, 750, 1500].map((delay) => window.setTimeout(read, delay));
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      element.removeEventListener("loadedmetadata", read);
      element.removeEventListener("durationchange", read);
      element.removeAttribute("src");
      element.load?.();
    };
  }, [src, contentType]);
  useEffect(() => {
    setPlayheadSeconds(0);
    setIsPlaying(false);
    mediaRef.current?.pause?.();
  }, [take?.takeId, src]);
  const seekTimeline = (seconds) => {
    const next = Math.max(0, Math.min(duration, Number(seconds) || 0));
    setPlayheadSeconds(roundTimelineValue(next));
    if (mediaRef.current) {
      mediaRef.current.currentTime = next;
    }
  };
  const toggleTimelinePlayback = async () => {
    const element = mediaRef.current;
    if (!element || disabled) return;
    if (!element.paused) {
      element.pause();
      setIsPlaying(false);
      return;
    }
    element.currentTime = Math.max(0, Math.min(playheadSeconds, duration));
    try {
      await element.play?.();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };
  const updatePlayheadFromMedia = (event) => {
    const seconds = Number(event.currentTarget.currentTime);
    if (Number.isFinite(seconds)) {
      setPlayheadSeconds(roundTimelineValue(Math.max(0, Math.min(duration, seconds))));
    }
  };
  if (!frames.length && !peaks.length && !canPlaySource) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-500">
        Timeline pending
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
          <Film size={13} /> Editor Timeline
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled || !canPlaySource}
            onClick={toggleTimelinePlayback}
            className="creator-control flex h-8 items-center gap-2 px-3 text-[10px] font-black uppercase tracking-normal text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            title={usingFinalVideo ? "Play polished final video from the timeline playhead" : "Play raw take audio/video from the timeline playhead"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <p className="text-[11px] font-bold text-slate-400">
            {formatTimelineTime(playheadSeconds)} / {formatTimelineTime(duration)} {video.width && video.height ? `- ${video.width}x${video.height}` : ""} - {frameSpec.label}
          </p>
        </div>
      </div>

      <p className={`mt-2 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-normal ${
        usingFinalVideo
          ? "border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-100"
            : timelinePreviewUrl
            ? "border-cyan-300/15 bg-cyan-400/[0.05] text-cyan-100"
            : "border-white/10 bg-white/[0.035] text-slate-500"
      }`}>
        Playback source: {usingFinalVideo ? "polished final video" : timelinePreviewUrl ? "raw take, AI image clip on timeline" : previewUrl ? "raw take, enhanced image ready" : "raw uploaded take"}
      </p>

      <div className="mt-3 space-y-2">
        <TimelineCollapseHeader
          label="Edited / Polished Timeline"
          open={editedTimelineOpen}
          active={hasPolishClip}
          count={hasPolishClip ? 1 : 0}
          onToggle={() => setEditedTimelineOpen((open) => !open)}
        />
        {editedTimelineOpen && (
          <div className="overflow-x-auto rounded-md border border-cyan-300/15 bg-cyan-400/[0.035]">
            <div className="min-w-[34rem] p-3">
              <TimelineTicks ticks={ticks} />
              <TimelinePlayhead
                duration={duration}
                playheadSeconds={playheadSeconds}
                disabled={disabled}
                onSeek={seekTimeline}
              />
              <div className="relative mt-2">
                <TimelinePlayheadLine playheadPercent={playheadPercent} />
                {hasPolishClip ? (
                  <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                    <div className="pt-5 text-[10px] font-black uppercase tracking-normal text-cyan-100">
                      {usingFinalVideo ? "Final" : "Frames"}
                    </div>
                    <div className="relative flex min-h-28 gap-2 overflow-x-auto rounded-md border border-cyan-300/20 bg-black p-2">
                      <div className="pointer-events-none absolute inset-0 grid grid-cols-5">
                        {ticks.map((tick) => <span key={tick} className="border-l border-white/10" />)}
                      </div>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => seekTimeline(0)}
                        className={`group relative z-10 h-24 shrink-0 overflow-hidden rounded-md border text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          usingFinalVideo
                            ? "border-emerald-300/25 bg-emerald-400/[0.08] hover:border-emerald-200/70"
                            : "border-cyan-300/25 bg-cyan-400/[0.08] hover:border-cyan-200/70"
                        }`}
                        style={{ aspectRatio: editedClipAspectRatio }}
                        title={usingFinalVideo ? "Final video is the active polished timeline source." : "Enhanced frame applied to this polished timeline."}
                      >
                        {timelinePreviewUrl ? (
                          <img
                            src={timelinePreviewUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full opacity-90 transition group-hover:scale-[1.01]"
                            style={{ objectFit: "cover", objectPosition: frameSpec.objectPosition }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-black/45" />
                        )}
                        <div className="absolute inset-0 bg-black/35" />
                        <span className={`absolute left-2 top-2 rounded px-2 py-1 text-[9px] font-black uppercase tracking-normal ${
                          usingFinalVideo ? "bg-emerald-300 text-slate-950" : "bg-cyan-300 text-slate-950"
                        }`}>
                          {usingFinalVideo ? "Final video" : "Edited frame"}
                        </span>
                        <span className="absolute bottom-2 left-2 right-2 truncate rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white/85">
                          {usingFinalVideo ? formatTimelineTime(duration) : "Frame 01"}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                    <div className="pt-4 text-[10px] font-black uppercase tracking-normal text-cyan-100">Frames</div>
                    <div className="grid h-16 place-items-center rounded-md border border-dashed border-cyan-300/15 bg-black/25 text-[10px] font-bold uppercase tracking-normal text-cyan-100/70">
                      No edited frames applied
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <TimelineCollapseHeader
          label="Raw Timeline"
          open={rawTimelineOpen}
          active={frames.length > 0 || peaks.length > 0}
          count={frames.length}
          onToggle={() => setRawTimelineOpen((open) => !open)}
        />
        {rawTimelineOpen && (
          <div className="overflow-x-auto rounded-md border border-white/10 bg-black/30">
            <div className="min-w-[34rem] p-3">
              <TimelineTicks ticks={ticks} />
              <TimelinePlayhead
                duration={duration}
                playheadSeconds={playheadSeconds}
                disabled={disabled}
                onSeek={seekTimeline}
              />
              <div className="relative mt-2">
                <TimelinePlayheadLine playheadPercent={playheadPercent} />
                {frames.length > 0 && (
                  <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                    <div className="pt-5 text-[10px] font-black uppercase tracking-normal text-slate-500">Video</div>
                    <div className="relative flex min-h-28 gap-2 overflow-x-auto rounded-md border border-white/10 bg-black p-2">
                      <div className="pointer-events-none absolute inset-0 grid grid-cols-5">
                        {ticks.map((tick) => <span key={tick} className="border-l border-white/10" />)}
                      </div>
                      {frames.map((frame) => {
                        const frameKey = timelineFrameKey(take, frame);
                        const isSaving = savingFrameKey === frameKey;
                        const isDeleting = deletingFrameKey === frameKey;
                        const frameAspectRatio = mediaFrameAspectRatio(frame, sourceAspectRatio);
                        const frameTimestamp = Number(frame.timestampSeconds || 0);
                        const isSelectedFrame = selectedReferenceTimestamp != null && Math.abs(frameTimestamp - selectedReferenceTimestamp) < 0.18;
                        return (
                          <div
                            key={`${frame.index}-${frame.timestampSeconds}`}
                            className={`group relative h-24 shrink-0 overflow-hidden rounded-md border bg-black transition hover:border-cyan-200/70 ${
                              isSelectedFrame ? "border-cyan-200/80 shadow-[0_0_0_1px_rgba(103,232,249,0.55)]" : "border-white/10"
                            }`}
                            style={{ aspectRatio: frameAspectRatio }}
                          >
                            <button
                              type="button"
                              disabled={disabled || isSaving || isDeleting}
                              onClick={() => {
                                seekTimeline(frame.timestampSeconds);
                                onSelectFrame?.(frame);
                              }}
                              className="h-full w-full text-left outline-none transition disabled:cursor-wait"
                              title={`Use frame at ${formatTimelineTime(frame.timestampSeconds)}`}
                            >
                              <img
                                src={frame.thumbnailDataUrl}
                                alt=""
                                className="h-full w-full transition group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                                style={{ objectFit: "cover", objectPosition: frameSpec.objectPosition }}
                                loading="lazy"
                              />
                              <span className="pointer-events-none absolute inset-0 border-2 border-transparent transition group-hover:border-cyan-200/80 group-focus-visible:border-cyan-200/80" />
                              <span className="pointer-events-none absolute right-1 top-1 rounded bg-cyan-300/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-normal text-slate-950 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                                {isSaving ? "Saving" : isDeleting ? "Deleting" : "Use"}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={disabled || isSaving || isDeleting}
                              onClick={() => onDeleteFrame?.(frame)}
                              className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded bg-black/75 text-white/80 opacity-0 transition hover:bg-red-500 hover:text-white group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-wait disabled:opacity-70"
                              title={`Delete frame at ${formatTimelineTime(frame.timestampSeconds)}`}
                              aria-label={`Delete frame at ${formatTimelineTime(frame.timestampSeconds)}`}
                            >
                              <X size={12} />
                            </button>
                            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white/80">
                              {formatTimelineTime(frame.timestampSeconds)}
                            </span>
                            {Math.abs(Number(frame.timestampSeconds || 0) - playheadSeconds) < 0.18 && (
                              <span className="pointer-events-none absolute inset-0 border-2 border-emerald-300" />
                            )}
                            {isSelectedFrame && (
                              <span className="pointer-events-none absolute inset-0 border-2 border-cyan-200" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {peaks.length > 0 && (
                  <div className="mt-2 grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                    <div className="pt-4 text-[10px] font-black uppercase tracking-normal text-slate-500">Audio</div>
                    <div className="relative flex h-14 items-center gap-[2px] rounded-md border border-white/10 bg-black/40 px-2">
                      <div className="absolute inset-0 grid grid-cols-5">
                        {ticks.map((tick) => <span key={tick} className="border-l border-white/10" />)}
                      </div>
                      {peaks.map((peak, index) => (
                        <span
                          key={index}
                          className="relative z-10 min-w-[2px] flex-1 rounded-full bg-emerald-300/70"
                          style={{ height: `${Math.max(6, Math.min(48, Number(peak || 0) * 48))}px` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {canPlaySource && contentType.startsWith("video/") ? (
        <video
          ref={mediaRef}
          src={src}
          className="hidden"
          preload="metadata"
          playsInline
          onLoadedMetadata={(event) => {
            const seconds = Number(event.currentTarget.duration);
            if (Number.isFinite(seconds) && seconds > 0) setMediaElementDuration(roundTimelineValue(seconds));
          }}
          onTimeUpdate={updatePlayheadFromMedia}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : canPlaySource ? (
        <audio
          ref={mediaRef}
          src={src}
          className="hidden"
          preload="metadata"
          onLoadedMetadata={(event) => {
            const seconds = Number(event.currentTarget.duration);
            if (Number.isFinite(seconds) && seconds > 0) setMediaElementDuration(roundTimelineValue(seconds));
          }}
          onTimeUpdate={updatePlayheadFromMedia}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : null}
      <p className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-500">
        <Volume2 size={12} /> {frameSpec.alignmentLabel}
      </p>
      {framesStopEarly && (
        <p className="mt-2 rounded-md border border-amber-300/15 bg-amber-400/[0.06] px-2 py-1.5 text-[10px] font-bold leading-4 text-amber-100">
          Saved thumbnails stop at {formatTimelineTime(frameCoverage)} while the video reads {formatTimelineTime(duration)}. Re-upload this take once to rebuild the full thumbnail timeline.
        </p>
      )}
    </div>
  );
}

function TimelineCollapseHeader({ label, open, active, count, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-left transition hover:border-white/20"
    >
      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-300">
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {label}
      </span>
      <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-normal ${
        active ? "bg-cyan-300/15 text-cyan-100" : "bg-white/10 text-slate-500"
      }`}>
        {active ? `${count || 1}` : "0"}
      </span>
    </button>
  );
}

function TimelineTicks({ ticks = [] }) {
  return (
    <div className="ml-14 grid grid-cols-5 text-[10px] font-bold text-slate-600">
      {ticks.map((tick) => (
        <span key={tick} className="border-l border-white/10 pl-1">{formatTimelineTime(tick)}</span>
      ))}
    </div>
  );
}

function TimelinePlayhead({ duration, playheadSeconds, disabled, onSeek }) {
  return (
    <div className="mt-2 grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
      <div className="text-[10px] font-black uppercase tracking-normal text-slate-500">Play</div>
      <input
        type="range"
        min={0}
        max={duration}
        step="0.05"
        value={Math.min(duration, playheadSeconds)}
        disabled={disabled}
        onChange={(event) => onSeek?.(Number(event.target.value))}
        className="w-full accent-emerald-300"
        aria-label="Editor timeline playhead"
      />
    </div>
  );
}

function TimelinePlayheadLine({ playheadPercent }) {
  return (
    <div
      className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]"
      style={{ left: `calc(3.5rem + ${Math.max(0, Math.min(91, playheadPercent * 0.91))}%)` }}
    />
  );
}

function shotFrameSpec(scene = {}, take = {}) {
  const storyboardTag = scene.storyboardTag || scene.storyboard_tag || {};
  const cameraTag = scene.cameraPlanSheetTag || scene.camera_plan_sheet_tag || {};
  const framePreview = cameraTag.framePreview || {};
  const analysis = take.mediaAnalysis || {};
  const rawWidth = Number(analysis.video?.width || 0);
  const rawHeight = Number(analysis.video?.height || 0);
  const screenType = String(
    scene.screenType
    || storyboardTag.screenType
    || cameraTag.screenType
    || (rawWidth > rawHeight ? "horizontal" : "vertical")
  ).toLowerCase();
  const horizontal = screenType.includes("horizontal") || screenType.includes("16:9") || screenType.includes("landscape");
  const square = screenType.includes("square") || screenType.includes("1:1");
  const shotText = [
    scene.shotType,
    scene.camera,
    scene.cameraAngle,
    storyboardTag.shotType,
    storyboardTag.shotTypeFullName,
    cameraTag.shotType,
    framePreview.subjectPlacement,
    framePreview.mobileFocusArea,
  ].filter(Boolean).join(" ").toLowerCase();
  const objectPosition = shotObjectPosition(shotText);
  const aspectRatio = square ? "1 / 1" : horizontal ? "16 / 9" : "9 / 16";
  const label = square ? "1:1" : horizontal ? "16:9" : "9:16";
  const shotLabel = shotText.includes("close") || /\bcu\b/.test(shotText)
    ? "close-up"
    : shotText.includes("wide")
      ? "wide"
      : shotText.includes("full")
        ? "full body"
        : "medium";
  return {
    aspectRatio,
    label,
    maxWidth: horizontal ? "28rem" : square ? "18rem" : "15rem",
    objectFit: "cover",
    objectPosition,
    alignmentLabel: `${label} ${shotLabel} crop - ${objectPosition}`,
  };
}

function shotObjectPosition(text = "") {
  if (text.includes("top") || text.includes("head") || text.includes("face") || text.includes("close") || /\bcu\b/.test(text)) {
    return "50% 36%";
  }
  if (text.includes("bottom") || text.includes("feet") || text.includes("shoes")) {
    return "50% 68%";
  }
  if (text.includes("left")) return "38% 50%";
  if (text.includes("right")) return "62% 50%";
  if (text.includes("full") || text.includes("wide")) return "50% 54%";
  return "50% 48%";
}

function timelineTicks(duration) {
  const total = Math.max(0, Number(duration) || 0);
  if (!total) return [0, 1, 2, 3, 4];
  return Array.from({ length: 5 }, (_, index) => Math.round((total * index / 4) * 10) / 10);
}

function formatTimelineTime(value) {
  const seconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${String(Math.floor(rest)).padStart(2, "0")}` : `${rest.toFixed(1)}s`;
}

function QuickStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-slate-500"><Icon size={12} /> {label}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-200">{value}</p>
    </div>
  );
}

function MiniButton({ icon: Icon, label, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
    >
      <Icon size={13} /> {label}
    </button>
  );
}

function StatusPill({ status }) {
  const text = String(status || "PENDING").replace(/_/g, " ");
  const ok = /ACCEPTED|CONFIRMED|READY|PASSED/i.test(text);
  const bad = /REJECTED|RESHOT|RE-SHOOT|FAILED/i.test(text);
  return (
    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-normal ${
      ok
        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
        : bad
          ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
          : "border-amber-300/20 bg-amber-400/10 text-amber-100"
    }`}>
      {text}
    </span>
  );
}
