// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Clapperboard, Copy, Film, Image as ImageIcon, Lightbulb, Mic2, Move, Music, Pause, Play, Plus, RefreshCw, SlidersHorizontal, Sparkles, Undo2, Upload, Volume2, X } from "lucide-react";

export default function ShotTakePanel({
  scenes = [],
  takes = [],
  scriptId,
  focusedShotNumber,
  isLoading,
  isBusy,
  activeJob,
  acceptedSequence = {},
  acceptedSequenceLoading = false,
  providerCredits = {},
  polishLocked = false,
  polishBlockedReason = "",
  onUpload,
  onUploadReferenceFrame,
  onDeleteTimelineFrame,
  onSaveSoundTimeline,
  onUploadSoundSnippet,
  onGenerateSound,
  onReview,
  onConfirm,
  onEnhancePreview,
  onStudioPolish,
  onSaveTextOverlay,
  onSavePolishedVideoFrames,
  onGeneratePolishedVideoFrames,
  onEnhanceAudio,
  onMixAudio,
  onRenderFinalVideo,
  onGenerateInsertedShot,
  isInsertingShot = false,
  onFeedback,
  onEnhanceAll,
}) {
  const [draftFiles, setDraftFiles] = useState({});
  const [selectedFramePreviews, setSelectedFramePreviews] = useState({});
  const [polishedFramePreviews, setPolishedFramePreviews] = useState({});
  const [enhancementFrameKeys, setEnhancementFrameKeys] = useState({});
  const [referenceFrameSavingKey, setReferenceFrameSavingKey] = useState("");
  const [timelineFrameDeletingKey, setTimelineFrameDeletingKey] = useState("");
  const [editNotes, setEditNotes] = useState({});
  const [tryOnNotes, setTryOnNotes] = useState({});
  const [lastEnhancementPrompt, setLastEnhancementPrompt] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [studioPreset, setStudioPreset] = useState("clean_studio");
  const [studioVideoProvider, setStudioVideoProvider] = useState("runway");
  const [studioControls, setStudioControls] = useState(() => defaultStudioControls("clean_studio"));
  const [studioControlsOpen, setStudioControlsOpen] = useState(false);
  const [copiedPolishRecipe, setCopiedPolishRecipe] = useState(null);
  const [selectedShotNumber, setSelectedShotNumber] = useState(Number(focusedShotNumber || 0));
  const [textOverlayDrafts, setTextOverlayDrafts] = useState({});
  const [frameEditorModalKey, setFrameEditorModalKey] = useState("");
  const [insertedShotPrompts, setInsertedShotPrompts] = useState({});
  const selectedProviderCredit = providerCredits?.providers?.[studioVideoProvider] || null;
  const decartProviderCredit = providerCredits?.providers?.decart || null;
  const activeJobCategory = shotTakeJobCategory(activeJob);
  const activeJobRunning = isRunningJobStatus(activeJob?.status);
  const busyBeforeJobSnapshot = isBusy && !activeJobRunning;
  const videoToolsBusy = busyBeforeJobSnapshot || activeJobCategory === "video" || activeJobCategory === "shared" || activeJobCategory === "unknown";
  const timelineToolsBusy = busyBeforeJobSnapshot || activeJobCategory === "video" || activeJobCategory === "shared" || activeJobCategory === "unknown";
  const takesByShot = useMemo(() => latestTakeByShot(takes), [takes]);
  const acceptedFinalTakes = useMemo(() => acceptedTakeSequence(takes), [takes]);
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
  const uploadedCount = takes.length;
  const studioPayload = (editNote = "", take = null, extra = {}) => ({
    editNote,
    provider: studioVideoProvider,
    model: studioVideoProvider === "runway" ? "aleph2" : studioVideoProvider === "decart" ? "lucy-vton-3" : undefined,
    providerMode: "",
    seed: ["runway", "decart"].includes(studioVideoProvider) ? stableRunwaySeed(take?.takeId || scriptId || "studio-polish") : undefined,
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
  const handleSelectPolishedFrame = (take, frame) => {
    if (!take?.takeId || !frame?.thumbnailDataUrl) return;
    const timestampSeconds = roundTimelineValue(frame.timestampSeconds || 0);
    const draftKey = textOverlayDraftKey(take, timestampSeconds);
    setPolishedFramePreviews((current) => ({
      ...current,
      [take.takeId]: {
        key: `polished:${take.takeId}:${timestampSeconds}`,
        thumbnailDataUrl: frame.thumbnailDataUrl,
        timestampSeconds,
        width: frame.width,
        height: frame.height,
        source: "polished_timeline",
      },
    }));
    setFrameEditorModalKey(draftKey);
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
  const updateTryOnNote = (takeId, value) => {
    setTryOnNotes((current) => ({ ...current, [takeId]: value }));
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
  const updateTextOverlayDraft = (key, patch) => {
    setTextOverlayDrafts((current) => ({
      ...current,
      [key]: { ...(current[key] || {}), ...patch },
    }));
  };
  const saveTextOverlayDraft = async (take, key, draft, remove = false, renderPayload = {}) => {
    if (!take?.takeId || !key) return;
    const payload = remove ? { ...draft, remove: true } : normalizeTextOverlayDraft(draft);
    await onSaveTextOverlay?.(take, payload);
    if (onRenderFinalVideo && renderPayload?.variantId) {
      await onRenderFinalVideo(take, {
        variantId: renderPayload.variantId,
        burnTextOverlays: true,
        useMixedAudio: true,
        metadata: {
          trigger: remove ? "text_overlay_removed" : "text_overlay_saved",
          overlayId: payload.id,
          timestampSeconds: payload.timestampSeconds,
        },
      });
    }
    if (remove) {
      setTextOverlayDrafts((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };
  const generateInsertedShot = async (scene, shotNumber) => {
    const prompt = String(insertedShotPrompts[shotNumber] || "").trim();
    if (!prompt || isBusy || isInsertingShot) return;
    await onGenerateInsertedShot?.(scene, prompt);
  };
  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-emerald-200">Shoot & Polish</p>
          <h3 className="mt-1 text-lg font-extrabold text-white">Record takes against the shot plan</h3>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            {uploadedCount}/{scenes.length || 0} uploaded takes {activeJobRunning ? `- ${activeJob.message || activeJob.status}` : ""}
          </p>
        </div>
        <p className="max-w-xl text-xs font-semibold leading-5 text-slate-500">
          Upload the recorded shot, choose a timeline frame if you want a different anchor, then polish the video from production design plus your optional prompt.
        </p>
      </div>
      <div className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-bold text-slate-200">
            <SlidersHorizontal size={15} className="text-emerald-200" />
            <span className="shrink-0">Studio Look</span>
            <select
              value={studioPreset}
              disabled={videoToolsBusy}
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
      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-stretch">
        <div className="rounded-lg border border-white/10 bg-black/25 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-normal text-emerald-200">Final shot list</p>
              <h4 className="mt-1 text-sm font-extrabold text-white">
                {acceptedFinalTakes.length ? `${acceptedFinalTakes.length} accepted ${acceptedFinalTakes.length === 1 ? "shot" : "shots"}` : "No shots accepted yet"}
              </h4>
            </div>
            <StatusPill status={acceptedSequenceLoading ? "RENDERING" : acceptedSequence?.status || (acceptedFinalTakes.length ? "PENDING_RENDER" : "EMPTY")} />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {acceptedFinalTakes.length ? acceptedFinalTakes.map((take, index) => (
              <button
                key={take.takeId || `${take.shotNumber}-${index}`}
                type="button"
                onClick={() => setSelectedShotNumber(Number(take.shotNumber || index + 1))}
                className="min-w-[7rem] rounded-lg border border-emerald-300/20 bg-emerald-400/[0.06] px-3 py-2 text-left transition hover:border-emerald-200/40"
              >
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-normal text-emerald-100">
                  <Check size={12} /> Shot {String(take.shotNumber || index + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block truncate text-[11px] font-bold text-slate-300">
                  {take.status === "ACCEPTED" ? "Ready in sequence" : take.status || "Accepted"}
                </span>
              </button>
            )) : (
              <div className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs font-semibold text-slate-500">
                Accept shot 1 to create the first mobile preview. Accept shot 2 and the backend will rebuild the preview with both shots.
              </div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Mobile preview</p>
            {acceptedSequenceLoading && <RefreshCw size={13} className="animate-spin text-emerald-200" />}
          </div>
          <div className="mx-auto aspect-[9/16] max-h-[24rem] overflow-hidden rounded-[1.35rem] border border-white/15 bg-black shadow-2xl shadow-emerald-950/30">
            {acceptedSequence?.url ? (
              <video
                key={acceptedSequence.url}
                src={acceptedSequence.url}
                className="h-full w-full object-contain"
                controls
                playsInline
              />
            ) : (
              <div className="grid h-full place-items-center px-5 text-center text-xs font-semibold leading-5 text-slate-500">
                {acceptedSequenceLoading ? "Rendering accepted shots..." : "Accepted shots will play here as one sequence."}
              </div>
            )}
          </div>
        </div>
      </div>
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
          const isInsertedEmptyShot = sceneNeedsGeneratedShot(scene);
          const insertedPrompt = insertedShotPrompts[shotNumber] || "";
          if (isInsertedEmptyShot) {
            return (
              <article key={`${shotNumber}-${scene.id || scene.sceneId || "empty-inserted-shot"}`} className="w-full rounded-lg border border-cyan-300/20 bg-cyan-400/[0.045] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-normal text-cyan-100">Sequence {String(shotNumber).padStart(2, "0")}</p>
                    <h4 className="mt-1 text-sm font-extrabold text-white">Empty shot slot</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
                      This slot is waiting for a generated shot design. Describe the shot here; it will become a storyboard shot with production, lighting, camera, and sound context.
                    </p>
                  </div>
                  <StatusPill status={isInsertingShot ? "GENERATING" : "PROMPT_NEEDED"} />
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-400">Shot prompt</span>
                    <textarea
                      value={insertedPrompt}
                      disabled={isBusy || isInsertingShot}
                      onChange={(event) => setInsertedShotPrompts((current) => ({ ...current, [shotNumber]: event.target.value }))}
                      placeholder="Example: close-up of Maya tying her shoes, quick breath, then looking up with confidence. Keep continuity with previous shot."
                      rows={5}
                      className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                    />
                  </label>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      disabled={isBusy || isInsertingShot || !insertedPrompt.trim()}
                      onClick={() => generateInsertedShot(scene, shotNumber)}
                      className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {isInsertingShot ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isInsertingShot ? "Generating Shot..." : "Generate Shot"}
                    </button>
                    <p className="text-[11px] font-bold text-slate-500">
                      Added after Sequence {String(scene.insertAfterShotNumber || Math.max(0, shotNumber - 1)).padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </article>
            );
          }
          const take = takesByShot.get(shotNumber);
          const takeId = take?.takeId || "";
          const draftFile = draftFiles[shotNumber];
          const soundGenerateJob = activeJobForTake(activeJob, take, "SHOT_TAKE_SOUND_GENERATE");
          const audioEnhanceJob = activeJobForTake(activeJob, take, "SHOT_TAKE_AUDIO_ENHANCE");
          const audioMixJob = activeJobForTake(activeJob, take, "SHOT_TAKE_AUDIO_MIX") || activeJobForTake(activeJob, take, "AUDIO_MIX");
          const studioPolishJob = activeJobForTake(activeJob, take, "SHOT_TAKE_STUDIO_POLISH");
          const finalRenderJob = activeJobForTake(activeJob, take, "SHOT_TAKE_FINAL_RENDER");
          const variants = take?.variants || [];
          const currentClipVariants = variants.filter((variant) => variantBelongsToClip(variant, take, shotNumber));
          const latestVariant = currentClipVariants[0];
          const appliedPreviewVariant = currentClipVariants.find((variant) => variant.previewUrl && variantAppliedToTimeline(variant, take, shotNumber));
          const generatedPreviewVariant = currentClipVariants.find((variant) => variant.previewUrl && !variantAppliedToTimeline(variant, take, shotNumber));
          const latestFinalVideoVariant = currentClipVariants.find((variant) => variantUrl(variant, "finalVideoUrl", "final_video_url"));
          const latestFinalRenderVariant = latestFinalVideoVariant
            ? currentClipVariants.find((variant) => (
                variant?.variantId === latestFinalVideoVariant.variantId
                && variantUrl(variant, "finalRenderUrl", "final_render_url")
              ))
            : currentClipVariants.find((variant) => variantUrl(variant, "finalRenderUrl", "final_render_url"));
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
          const finalVideoUrl = variantUrl(latestFinalVideoVariant, "finalVideoUrl", "final_video_url") || variantUrl(latestVariant, "finalVideoUrl", "final_video_url");
          const finalRenderUrl = latestFinalVideoVariant && latestFinalRenderVariant?.variantId === latestFinalVideoVariant.variantId
            ? variantUrl(latestFinalRenderVariant, "finalRenderUrl", "final_render_url")
            : "";
          const polishedPlaybackVideoUrl = finalRenderUrl || finalVideoUrl;
          const finalVideoVariant = latestFinalRenderVariant || latestFinalVideoVariant || latestVariant;
          const timelinePreviewUrl = appliedPreviewVariant?.previewUrl || "";
          const shotThumbnailUrl = shotDesignThumbnailUrl(scene);
          const polishedFramePreview = takeId ? polishedFramePreviews[takeId] : null;
          const hasPolishedTextFrame = Boolean((polishedPlaybackVideoUrl || timelinePreviewUrl || previewUrl) && polishedFramePreview?.thumbnailDataUrl);
          const textFrameTimestamp = hasPolishedTextFrame
            ? normalizedTimelineNumber(polishedFramePreview?.timestampSeconds, 0)
            : null;
          const textFrameUrl = hasPolishedTextFrame ? polishedFramePreview.thumbnailDataUrl : "";
          const textClipDurationSeconds = take
            ? mediaTimelineDuration(
                take,
                take?.mediaAnalysis?.video || {},
                take?.mediaAnalysis?.audio || {},
                take?.mediaAnalysis?.video?.frames || []
              )
            : 0;
          const clipUiKey = `${shotNumber}-${takeId || "empty"}-${selectedFrameKey || "no-frame"}-${generatedPreviewForSelectedFrame?.variantId || "no-preview"}-${appliedPreviewVariant?.variantId || "not-applied"}`;
          const review = take?.reviews?.[0];
          const soundLayers = review?.soundTimeline?.length || take?.validationSummary?.soundTimeline?.length || 0;
          const hasImageAnchor = Boolean(take && (!isVideoTake || take.referenceFrameUrl));
          const textOverlays = textOverlaysForTake(take);
          const overlayDraftKey = take && hasPolishedTextFrame ? textOverlayDraftKey(take, textFrameTimestamp) : "";
          const overlayDraft = overlayDraftKey
            ? textOverlayDrafts[overlayDraftKey] || defaultTextOverlayDraft(textOverlayAtTime(textOverlays, textFrameTimestamp), textFrameTimestamp)
            : null;
          return (
            <article key={`${shotNumber}-${takeId || "empty"}`} className="w-full rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Shot {String(shotNumber).padStart(2, "0")}</p>
                  <h4 className="mt-1 line-clamp-2 text-sm font-extrabold text-white">{scene.title || scene.description || `Shot ${shotNumber}`}</h4>
                </div>
                <StatusPill status={take?.status || "PENDING_UPLOAD"} />
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-3">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem] md:items-center">
                  <label className="min-w-0">
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
                  <button
                    type="button"
                    disabled={!draftFile || isBusy || !scriptId}
                    onClick={() => onUpload?.(scene, draftFile, "")}
                    className="creator-control flex h-10 w-full items-center justify-center gap-2 px-4 text-xs font-bold text-slate-200 disabled:opacity-50"
                  >
                    <Upload size={14} /> Save Take
                  </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
                    <RawTakePreview take={take} scene={scene} />

                    <MediaPreview
                      key={`preview-${clipUiKey}`}
                      take={take}
                      scene={scene}
                      finalVideoUrl={polishedPlaybackVideoUrl}
                      finalVideoVariant={finalVideoVariant}
                      textOverlays={finalRenderUrl ? [] : textOverlays}
                      selectedPolishedFrameUrl={textFrameUrl}
                      selectedPolishedFrameTimestamp={textFrameTimestamp}
                      onOpenFrameEditor={textFrameUrl && overlayDraft ? () => setFrameEditorModalKey(overlayDraftKey) : undefined}
                      useEmbeddedAudioOnly={Boolean(finalRenderUrl)}
                      polishedOnly
                    />
                  </div>

                  {take ? (
                    <VideoPolishControls
                      take={take}
                      isBusy={videoToolsBusy}
                      polishBlockedReason={polishLocked ? polishBlockedReason : ""}
                      provider={studioVideoProvider}
                      providerCredit={selectedProviderCredit}
                      decartProviderCredit={decartProviderCredit}
                      polishJob={studioPolishJob}
                      finalRenderJob={finalRenderJob}
                      finalVideoUrl={finalVideoUrl}
                      finalRenderUrl={finalRenderUrl}
                      finalVideoVariant={finalVideoVariant}
                      selectedFrameUrl={selectedFrameUrl}
                      selectedFrameTimestamp={selectedFrameTimestamp}
                      editNote={editNotes[take.takeId] || ""}
                      tryOnNote={tryOnNotes[take.takeId] || ""}
                      status={displayVariant?.status || take.status || "READY"}
                      studioPayload={studioPayload}
                      onEditNoteChange={(value) => updateEditNote(take.takeId, value)}
                      onTryOnNoteChange={(value) => updateTryOnNote(take.takeId, value)}
                      onStudioPolish={onStudioPolish}
                      onRenderFinalVideo={onRenderFinalVideo}
                    />
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-500">
                      Upload and save this shot before enhancement.
                    </div>
                  )}

                  {take && isVideoTake && textFrameUrl && overlayDraft && frameEditorModalKey === overlayDraftKey && (
                    <FrameEditorModal onClose={() => setFrameEditorModalKey("")}>
                      <TextOverlayEditor
                        take={take}
                        frameUrl={textFrameUrl}
                        timestampSeconds={textFrameTimestamp}
                        clipDurationSeconds={textClipDurationSeconds}
                        draft={overlayDraft}
                        disabled={timelineToolsBusy}
                        onChange={(patch) => updateTextOverlayDraft(overlayDraftKey, patch)}
                        onSave={async () => {
                          await saveTextOverlayDraft(take, overlayDraftKey, overlayDraft, false, {
                            variantId: latestFinalVideoVariant?.variantId || finalVideoVariant?.variantId,
                          });
                          setFrameEditorModalKey("");
                        }}
                        onRemove={async () => {
                          await saveTextOverlayDraft(take, overlayDraftKey, overlayDraft, true, {
                            variantId: latestFinalVideoVariant?.variantId || finalVideoVariant?.variantId,
                          });
                          setFrameEditorModalKey("");
                        }}
                        onApplyToTimeline={async () => {
                          const fullTimelineDraft = normalizeTextOverlayDraft({
                            ...overlayDraft,
                            startSeconds: 0,
                            endSeconds: Math.max(0.5, textClipDurationSeconds || overlayDraft.endSeconds || 2),
                          });
                          updateTextOverlayDraft(overlayDraftKey, fullTimelineDraft);
                          await saveTextOverlayDraft(take, overlayDraftKey, fullTimelineDraft, false, {
                            variantId: latestFinalVideoVariant?.variantId || finalVideoVariant?.variantId,
                          });
                          setFrameEditorModalKey("");
                        }}
                      />
                    </FrameEditorModal>
                  )}

                  {take && isVideoTake && (
                    <MediaTimeline
                      key={`timeline-${clipUiKey}`}
                      take={take}
                      scene={scene}
                      disabled={timelineToolsBusy && !studioPolishJob}
                      savingFrameKey={referenceFrameSavingKey}
                      deletingFrameKey={timelineFrameDeletingKey}
                      previewUrl={previewUrl}
                      timelinePreviewUrl={timelinePreviewUrl}
                      shotThumbnailUrl={shotThumbnailUrl}
                      finalVideoUrl={polishedPlaybackVideoUrl}
                      finalVideoVariantId={finalVideoVariant?.variantId}
                      finalVideoVariant={finalVideoVariant}
                      activeVideoAssetId={finalRenderUrl
                        ? latestFinalRenderVariant?.finalRenderAssetId || latestFinalRenderVariant?.final_render_asset_id
                        : latestFinalVideoVariant?.finalVideoAssetId || latestFinalVideoVariant?.final_video_asset_id || finalVideoVariant?.finalVideoAssetId || finalVideoVariant?.final_video_asset_id}
                      textOverlays={textOverlays}
                      textOverlaysBaked={Boolean(finalRenderUrl)}
                      selectedFrameTimestamp={selectedFrameTimestamp}
                      onSelectFrame={(frame) => handleSelectReferenceFrame(take, frame)}
                      onSelectPolishedFrame={(frame) => handleSelectPolishedFrame(take, frame)}
                      onDeleteFrame={(frame) => handleDeleteTimelineFrame(take, frame)}
                      onSavePolishedVideoFrames={(analysis) => onSavePolishedVideoFrames?.(take, analysis)}
                      onGeneratePolishedVideoFrames={(payload) => onGeneratePolishedVideoFrames?.(take, payload)}
                    />
                  )}
                  {take && isVideoTake && polishedPlaybackVideoUrl && !textFrameUrl && (
                    <div className="rounded-lg border border-fuchsia-300/15 bg-fuchsia-400/[0.045] px-3 py-2 text-xs font-semibold leading-5 text-fuchsia-100">
                      Seek the polished timeline, then click the polished clip to open frame-level edits.
                    </div>
                  )}
                  {take && (
                    <SoundTimelineEditor
                      take={take}
                      scene={scene}
                      disabled={isBusy}
                      soundGenerateJob={soundGenerateJob}
                      audioEnhanceJob={audioEnhanceJob}
                      audioMixJob={audioMixJob}
                      onSaveSoundTimeline={onSaveSoundTimeline}
                      onUploadSoundSnippet={onUploadSoundSnippet}
                      onGenerateSound={onGenerateSound}
                      onEnhanceAudio={onEnhanceAudio}
                      onMixAudio={onMixAudio}
                    />
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
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold leading-5 text-slate-300">
                    {take.validationSummary?.message || review?.message || "Run review, then accept the take or ask for a re-shoot."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <MiniButton icon={RefreshCw} label="Review" disabled={isBusy} onClick={() => onReview?.(take)} />
                    <MiniButton icon={Check} label="Accept" disabled={isBusy || take.accepted} onClick={() => onConfirm?.(take, true)} />
                    <MiniButton icon={X} label="Re-shoot" disabled={isBusy} onClick={() => onConfirm?.(take, false)} />
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

const STUDIO_VIDEO_PROVIDERS = [
  { id: "runway", label: "Fix background & lighting" },
  { id: "decart", label: "Change clothes" },
  { id: "google_veo", label: "Premium video polish" },
];

const SHOT_TAKE_AUDIO_JOB_TYPES = new Set([
  "SHOT_TAKE_AUDIO_ENHANCE",
  "SHOT_TAKE_AUDIO_MIX",
  "AUDIO_MIX",
  "SHOT_TAKE_SOUND_GENERATE",
]);

const SHOT_TAKE_VIDEO_JOB_TYPES = new Set([
  "SHOT_TAKE_STUDIO_POLISH",
  "SHOT_TAKE_FINAL_RENDER",
  "SHOT_TAKE_ENHANCE_PREVIEW",
  "SHOT_TAKE_PREVIEW_ENHANCE",
  "SHOT_TAKE_IMAGE_PREVIEW",
  "SHOT_TAKE_STUDIO_POLISH_ALL",
  "SHOT_TAKE_ENHANCE_ALL",
  "SHOT_TAKE_ACCEPTED_SEQUENCE_RENDER",
]);

const SHOT_TAKE_SHARED_JOB_TYPES = new Set([
  "SHOT_TAKE_REVIEW",
  "SHOT_TAKE_VALIDATE",
]);

const CROP_OPTIONS = [
  { id: "auto", label: "Auto" },
  { id: "original", label: "Original" },
  { id: "vertical", label: "Vertical" },
  { id: "horizontal", label: "Horizontal" },
  { id: "square", label: "Square" },
];

const TEXT_OVERLAY_FONTS = ["Inter", "Arial", "Georgia", "Impact", "Montserrat", "Poppins"];
const CAPTION_STYLE_PRESETS = [
  { id: "classic", label: "Classic", color: "#ffffff", backgroundColor: "#000000", backgroundOpacity: 0.28, fontWeight: 900, textTransform: "none" },
  { id: "subtitle", label: "Subtitle", color: "#ffffff", backgroundColor: "#000000", backgroundOpacity: 0.62, fontWeight: 800, textTransform: "none" },
  { id: "bubble", label: "Bubble", color: "#111827", backgroundColor: "#ffffff", backgroundOpacity: 0.92, fontWeight: 900, textTransform: "none" },
  { id: "outline", label: "Outline", color: "#ffffff", backgroundColor: "#000000", backgroundOpacity: 0, fontWeight: 900, textTransform: "none" },
  { id: "glow", label: "Glow", color: "#ffffff", backgroundColor: "#7c3aed", backgroundOpacity: 0.18, fontWeight: 900, textTransform: "uppercase" },
];
const TEXT_OVERLAY_POSITIONS = [
  { id: "top", label: "Top" },
  { id: "center", label: "Center" },
  { id: "bottom", label: "Bottom" },
];

function TypeIcon() {
  return <span className="inline-grid h-3.5 w-3.5 place-items-center rounded border border-fuchsia-200/30 text-[10px] font-black leading-none text-fuchsia-100">T</span>;
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

function acceptedTakeSequence(takes = []) {
  const map = new Map();
  (Array.isArray(takes) ? takes : []).forEach((take) => {
    if (!take?.accepted) return;
    const shotNumber = Number(take.shotNumber || 0);
    if (!shotNumber || map.has(shotNumber)) return;
    map.set(shotNumber, take);
  });
  return Array.from(map.values()).sort((left, right) => Number(left.shotNumber || 0) - Number(right.shotNumber || 0));
}

function sceneNeedsGeneratedShot(scene = {}) {
  return Boolean(
    scene?.needsShotGeneration
    || scene?.needs_shot_generation
    || scene?.emptyShotSlot
    || scene?.empty_shot_slot
    || scene?.placeholderType === "inserted-shot"
  );
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

function variantUrl(variant = {}, camelKey = "", snakeKey = "") {
  return variant?.[camelKey] || variant?.[snakeKey] || "";
}

function variantTimeMs(variant = {}) {
  const value = variant?.updatedAt || variant?.updated_at || variant?.createdAt || variant?.created_at || "";
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function finalAudioVariantForTake(take = {}, activeVideoVariant = null) {
  const variants = Array.isArray(take?.variants) ? take.variants : [];
  const audioVariants = variants.filter((variant) => variantUrl(variant, "finalAudioUrl", "final_audio_url"));
  if (!activeVideoVariant) return audioVariants[0] || null;
  const videoTime = variantTimeMs(activeVideoVariant);
  return audioVariants.find((variant) => variantTimeMs(variant) >= Math.max(0, videoTime - 1000)) || null;
}

function finalAudioUrlForTake(take = {}, activeVideoVariant = null) {
  const variant = finalAudioVariantForTake(take, activeVideoVariant);
  return variantUrl(variant, "finalAudioUrl", "final_audio_url");
}

function rawAudioUrlForTake(take = {}) {
  const contentType = String(take?.contentType || "").toLowerCase();
  if (!contentType.startsWith("video/") && !contentType.startsWith("audio/")) return "";
  return take?.assetUrl || take?.publicUrl || "";
}

function mediaSourceAspectRatio(take = {}, fallback = "16 / 9") {
  const video = take?.mediaAnalysis?.video || {};
  return mediaAspectRatioFromDimensions(video.width, video.height, fallback);
}

function mediaPreviewFrameSpec(scene = {}, take = {}) {
  const base = shotFrameSpec(scene, take);
  const aspectRatio = mediaSourceAspectRatio(take, base.aspectRatio);
  const ratio = aspectRatioNumber(aspectRatio, aspectRatioNumber(base.aspectRatio, 16 / 9));
  const horizontal = ratio > 1.2;
  const vertical = ratio < 0.85;
  return {
    ...base,
    aspectRatio,
    maxWidth: "100%",
    objectFit: "contain",
    objectPosition: "center center",
    alignmentLabel: horizontal
      ? "Horizontal source preview"
      : vertical
        ? "Vertical mobile source preview"
        : base.alignmentLabel,
  };
}

function mediaFrameAspectRatio(frame = {}, fallback = "16 / 9") {
  return frame.aspectRatio || mediaAspectRatioFromDimensions(
    frame.width || frame.originalWidth,
    frame.height || frame.originalHeight,
    fallback
  );
}

function aspectRatioNumber(aspectRatio = "16 / 9", fallback = 16 / 9) {
  if (typeof aspectRatio === "number" && Number.isFinite(aspectRatio) && aspectRatio > 0) return aspectRatio;
  const normalized = String(aspectRatio || "").replace(/\s/g, "");
  const fraction = normalized.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const width = Number(fraction[1]);
    const height = Number(fraction[2]);
    if (width > 0 && height > 0) return width / height;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function compactEditorFrameStyle(frame = {}) {
  const aspectRatio = frame.aspectRatio || "16 / 9";
  const ratio = aspectRatioNumber(aspectRatio);
  if (ratio < 0.85) {
    return {
      aspectRatio,
      height: "clamp(19rem, 58vh, 27rem)",
      width: "auto",
      maxWidth: "100%",
    };
  }
  if (ratio < 1.2) {
    return {
      aspectRatio,
      height: "clamp(16rem, 46vh, 23rem)",
      width: "auto",
      maxWidth: "100%",
    };
  }
  return {
    aspectRatio,
    width: "100%",
  };
}

function frameEditorStageStyle(aspectRatio = "9 / 16") {
  const ratio = aspectRatioNumber(aspectRatio, 9 / 16);
  if (ratio < 0.85) {
    return {
      aspectRatio,
      height: "min(68vh, 34rem)",
      width: "auto",
      maxWidth: "100%",
    };
  }
  return {
    aspectRatio,
    width: "100%",
    maxWidth: ratio > 1.2 ? "48rem" : "34rem",
  };
}

function waitForMediaEvent(element, eventName, timeoutMs = 900) {
  return new Promise((resolve) => {
    if (!element) {
      resolve(false);
      return;
    }
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      element.removeEventListener(eventName, onEvent);
      element.removeEventListener("error", onError);
      resolve(value);
    };
    const onEvent = () => finish(true);
    const onError = () => finish(false);
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    element.addEventListener(eventName, onEvent, { once: true });
    element.addEventListener("error", onError, { once: true });
  });
}

async function captureVideoElementFrame(video, seconds = 0, fallbackUrl = "") {
  if (!video) return fallbackUrl ? { thumbnailDataUrl: fallbackUrl, timestampSeconds: seconds } : null;
  if (video.readyState < 1) {
    await waitForMediaEvent(video, "loadedmetadata", 1200);
  }
  const duration = Number(video.duration);
  const maxSeconds = Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - 0.05) : Number(seconds || 0);
  const targetSeconds = Math.max(0, Math.min(maxSeconds, Number(seconds) || 0));
  if (Math.abs(Number(video.currentTime || 0) - targetSeconds) > 0.05) {
    video.currentTime = targetSeconds;
    await waitForMediaEvent(video, "seeked", 1200);
  }
  if (video.readyState < 2) {
    await waitForMediaEvent(video, "loadeddata", 1200);
  }
  const width = Math.max(1, Number(video.videoWidth || 0));
  const height = Math.max(1, Number(video.videoHeight || 0));
  if (!width || !height) {
    return fallbackUrl ? { thumbnailDataUrl: fallbackUrl, timestampSeconds: targetSeconds } : null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, width, height);
    return {
      thumbnailDataUrl: canvas.toDataURL("image/jpeg", 0.86),
      timestampSeconds: roundTimelineValue(targetSeconds),
      width,
      height,
      aspectRatio: `${width} / ${height}`,
    };
  } catch {
    return fallbackUrl
      ? { thumbnailDataUrl: fallbackUrl, timestampSeconds: roundTimelineValue(targetSeconds), width, height, aspectRatio: `${width} / ${height}` }
      : null;
  }
}

async function extractPolishedVideoFrameTimeline(videoUrl, shotNumber = 0, sampleCount = 10) {
  if (!videoUrl) throw new Error("Polished video URL is missing.");
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = videoUrl;
  await waitForMediaEvent(video, "loadedmetadata", 5000);
  if (video.readyState < 2) {
    await waitForMediaEvent(video, "loadeddata", 5000);
  }
  const durationSeconds = Math.max(0, Number(video.duration) || 0);
  const width = Math.max(1, Number(video.videoWidth || 0));
  const height = Math.max(1, Number(video.videoHeight || 0));
  const timestamps = polishedTimelineSampleTimestamps(durationSeconds, sampleCount);
  const maxWidth = 180;
  const scale = width > 0 ? Math.min(1, maxWidth / width) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Browser could not create a canvas for polished video frames.");
  const frames = [];
  for (let index = 0; index < timestamps.length; index++) {
    const timestamp = timestamps[index];
    if (Math.abs(Number(video.currentTime || 0) - timestamp) > 0.04) {
      video.currentTime = timestamp;
      await waitForMediaEvent(video, "seeked", 2500);
    }
    if (video.readyState < 2) {
      await waitForMediaEvent(video, "loadeddata", 2500);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({
      index,
      shotNumber,
      timestampSeconds: roundTimelineValue(timestamp),
      width: canvas.width,
      height: canvas.height,
      originalWidth: width,
      originalHeight: height,
      aspectRatio: `${canvas.width} / ${canvas.height}`,
      thumbnailDataUrl: canvas.toDataURL("image/jpeg", 0.62),
      source: "polished_video",
    });
  }
  video.removeAttribute("src");
  video.load?.();
  return {
    status: "ready",
    source: "polished_video",
    sourceUrl: videoUrl,
    durationSeconds: roundTimelineValue(durationSeconds),
    width,
    height,
    frameCount: frames.length,
    sampleStrategy: "polished_video_browser_canvas",
    generatedAt: new Date().toISOString(),
    frames,
  };
}

function polishedTimelineSampleTimestamps(durationSeconds, count = 10) {
  const duration = Math.max(0, Number(durationSeconds) || 0);
  if (!duration) return [0];
  const frameCount = Math.max(1, Math.min(count, Math.ceil(duration)));
  if (frameCount === 1) return [Math.min(0.05, duration)];
  const last = Math.max(0, duration - 0.05);
  return Array.from({ length: frameCount }, (_, index) => roundTimelineValue((last * index) / (frameCount - 1)));
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

function videoPolishDisabledReason({ take, isBusy, isVideoTake, hasImageAnchor, polishJob, provider = "luma", providerCredit = null, polishBlockedReason = "" }) {
  if (polishJob && isRunningJobStatus(polishJob.status)) return "";
  if (polishBlockedReason) return polishBlockedReason;
  if (!take?.takeId) return "Save this take first.";
  if (!isVideoTake) return "Upload a video take to polish.";
  if (isBusy) return "Finish the current shot job first.";
  if (providerCredit?.polishDisabled) return provider === "decart" ? "Clothing change credits are not available." : "Video polish credits are not available.";
  if (provider === "google_veo" && !hasImageAnchor) return "Click a raw timeline frame first.";
  return "";
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function isVideoLikeMediaUrl(value = "") {
  return /\.(mp4|mov|m4v|webm|avi|mkv)(?:$|[?#])/i.test(String(value || ""));
}

function studioVideoProviderLabel(provider = "runway") {
  const found = STUDIO_VIDEO_PROVIDERS.find((item) => item.id === provider);
  return found?.label || "Studio Polish";
}

function ProviderCreditNotice({ status = null, provider = "runway" }) {
  if (!status) {
    return (
      <div className="mt-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-semibold text-slate-400">
        Checking video polish availability...
      </div>
    );
  }
  const normalizedStatus = String(status.status || "").toUpperCase();
  const isBlocked = Boolean(status.polishDisabled);
  const isOk = normalizedStatus === "OK" || normalizedStatus === "UNKNOWN_CREDIT" || normalizedStatus === "CHECK_DISABLED";
  const toneClass = isBlocked
    ? "border-rose-300/20 bg-rose-400/[0.07] text-rose-100"
    : isOk
      ? "border-emerald-300/20 bg-emerald-400/[0.06] text-emerald-100"
      : "border-amber-300/20 bg-amber-400/[0.06] text-amber-100";
  const balance = providerCreditBalanceText(status);
  return (
    <div className={`mt-3 flex flex-col gap-1 rounded-md border px-3 py-2 text-[11px] font-semibold leading-5 ${toneClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-black uppercase tracking-normal">{provider === "decart" ? "Clothing change" : "Video polish"}</span>
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-black">{status.status || "UNKNOWN"}</span>
        {balance && <span className="text-slate-200">{balance}</span>}
      </div>
      <span className={isBlocked ? "text-rose-100" : "text-slate-300"}>
        {isBlocked ? "Add credits before running this edit." : "This edit is available."}
      </span>
    </div>
  );
}

function providerCreditBalanceText(status = {}) {
  if (status.balanceUsd != null) return `$${Number(status.balanceUsd).toFixed(2)} available`;
  if (status.creditBalance != null) return `${Number(status.creditBalance).toLocaleString()} credits available`;
  if (status.estimatedBalanceUsd != null) return `~$${Number(status.estimatedBalanceUsd).toFixed(2)} available`;
  return "";
}

function firstShotImageString(...values) {
  return values.find((value) => typeof value === "string" && value.trim() && !isVideoLikeMediaUrl(value)) || "";
}

function imageUrlFromShotDesignValue(value = {}) {
  if (typeof value === "string") return isVideoLikeMediaUrl(value) ? "" : value;
  if (!value || typeof value !== "object") return "";
  return firstShotImageString(
    value.storyboardImageUrl,
    value.storyboard_image_url,
    value.lightingImageUrl,
    value.lighting_image_url,
    value.cameraPlanImageUrl,
    value.camera_plan_image_url,
    value.dpImageUrl,
    value.dp_image_url,
    value.signedUrl,
    value.signed_url,
    value.imageUrl,
    value.image_url,
    value.publicUrl,
    value.public_url,
    value.url
  );
}

function shotDesignThumbnailUrl(scene = {}) {
  return firstShotImageString(
    scene.storyboardImageUrl,
    scene.storyboard_image_url,
    imageUrlFromShotDesignValue(scene.storyboardImage),
    imageUrlFromShotDesignValue(scene.storyboard_image),
    imageUrlFromShotDesignValue(scene.storyboardAsset),
    imageUrlFromShotDesignValue(scene.storyboard_asset),
    scene.lightingImageUrl,
    scene.lighting_image_url,
    imageUrlFromShotDesignValue(scene.lightingImage),
    imageUrlFromShotDesignValue(scene.lighting_image),
    imageUrlFromShotDesignValue(scene.lightingAsset),
    imageUrlFromShotDesignValue(scene.lighting_asset),
    scene.cameraPlanImageUrl,
    scene.camera_plan_image_url,
    scene.dpImageUrl,
    scene.dp_image_url,
    imageUrlFromShotDesignValue(scene.cameraPlanImage),
    imageUrlFromShotDesignValue(scene.camera_plan_image),
    imageUrlFromShotDesignValue(scene.cameraPlanAsset),
    imageUrlFromShotDesignValue(scene.camera_plan_asset),
    imageUrlFromShotDesignValue(scene.dpImage),
    imageUrlFromShotDesignValue(scene.dp_image)
  );
}

function textOverlaysForTake(take = {}) {
  const overlays = take?.mediaAnalysis?.textOverlays || take?.mediaAnalysis?.text_overlays || [];
  return (Array.isArray(overlays) ? overlays : [])
    .map(normalizeTextOverlayDraft)
    .filter((overlay) => overlay.text);
}

function textOverlayAtTime(overlays = [], seconds = null) {
  if (!Array.isArray(overlays) || !overlays.length) return null;
  const time = Number(seconds);
  if (!Number.isFinite(time)) return overlays[0] || null;
  return overlays.find((overlay) => overlayActiveAt(overlay, time) || Math.abs(Number(overlay.timestampSeconds || 0) - time) < 0.25) || null;
}

function textOverlayDraftKey(take = {}, seconds = null) {
  const time = Number(seconds);
  const suffix = Number.isFinite(time) ? Math.round(time * 10) / 10 : "default";
  return `${take?.takeId || "take"}:${suffix}`;
}

function defaultTextOverlayDraft(savedOverlay = null, seconds = null) {
  return normalizeTextOverlayDraft(savedOverlay || {
    timestampSeconds: Number.isFinite(Number(seconds)) ? Number(seconds) : 0,
    startSeconds: Math.max(0, (Number(seconds) || 0) - 0.25),
    endSeconds: Math.max(1, (Number(seconds) || 0) + 2),
    text: "",
    color: "#ffffff",
    fontFamily: "Inter",
    fontSize: 28,
    captionStyle: "classic",
    backgroundColor: "#000000",
    backgroundOpacity: 0.28,
    textTransform: "none",
    position: "bottom",
    x: 12,
    y: 68,
    width: 76,
    height: 16,
  });
}

function normalizeTextOverlayDraft(value = {}) {
  const timestamp = Number(value?.timestampSeconds ?? value?.timestamp_seconds ?? value?.startSeconds ?? 0);
  const start = Number(value?.startSeconds ?? value?.start_seconds ?? Math.max(0, timestamp - 0.25));
  const end = Number(value?.endSeconds ?? value?.end_seconds ?? Math.max(start + 0.5, timestamp + 2));
  const box = normalizeTextOverlayBox(value);
  const stylePreset = captionStylePreset(value?.captionStyle || value?.caption_style || value?.style);
  return {
    id: value?.id || `text-${Math.round((Number.isFinite(timestamp) ? timestamp : 0) * 1000)}`,
    text: String(value?.text || value?.label || "").trim(),
    timestampSeconds: Number.isFinite(timestamp) ? timestamp : 0,
    startSeconds: Number.isFinite(start) ? Math.max(0, start) : 0,
    endSeconds: Number.isFinite(end) ? Math.max(Number.isFinite(start) ? start + 0.25 : 0.5, end) : 2,
    color: value?.color || "#ffffff",
    fontFamily: value?.fontFamily || value?.font_family || "Inter",
    fontSize: Number(value?.fontSize || value?.font_size || 28),
    captionStyle: stylePreset.id,
    backgroundColor: value?.backgroundColor || value?.background_color || stylePreset.backgroundColor,
    backgroundOpacity: clampNumber(value?.backgroundOpacity ?? value?.background_opacity, stylePreset.backgroundOpacity, 0, 1),
    textTransform: value?.textTransform || value?.text_transform || stylePreset.textTransform || "none",
    position: value?.position || "bottom",
    fontWeight: value?.fontWeight || value?.font_weight || stylePreset.fontWeight || 900,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    frameSource: value?.frameSource || value?.frame_source || value?.source || "polished_timeline",
  };
}

function captionStylePreset(style = "classic") {
  return CAPTION_STYLE_PRESETS.find((preset) => preset.id === style) || CAPTION_STYLE_PRESETS[0];
}

function applyCaptionStylePreset(current = {}, style = "classic") {
  const preset = captionStylePreset(style);
  return {
    captionStyle: preset.id,
    color: preset.color,
    backgroundColor: preset.backgroundColor,
    backgroundOpacity: preset.backgroundOpacity,
    fontWeight: preset.fontWeight,
    textTransform: preset.textTransform,
  };
}

function clampNumber(value, fallback, min = 0, max = 1) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : fallback;
  return Math.max(min, Math.min(max, Math.round(safe * 100) / 100));
}

function normalizeTextOverlayBox(value = {}) {
  const x = clampPercent(value?.x ?? value?.left ?? value?.boxX ?? value?.box_x, 12, 0, 92);
  const y = clampPercent(value?.y ?? value?.top ?? value?.boxY ?? value?.box_y, 68, 0, 92);
  const width = clampPercent(value?.width ?? value?.boxWidth ?? value?.box_width, 76, 8, 100 - x);
  const height = clampPercent(value?.height ?? value?.boxHeight ?? value?.box_height, 16, 5, 100 - y);
  return { x, y, width, height };
}

function clampPercent(value, fallback, min = 0, max = 100) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : fallback;
  return Math.max(min, Math.min(max, Math.round(safe * 10) / 10));
}

function overlayActiveAt(overlay = {}, seconds = 0) {
  const time = Number(seconds) || 0;
  return time >= Number(overlay.startSeconds || 0) && time <= Number(overlay.endSeconds || 0);
}

function textOverlayPositionClass(position = "bottom") {
  if (position === "top") return "top-5 justify-center";
  if (position === "center") return "top-1/2 -translate-y-1/2 justify-center";
  return "bottom-8 justify-center";
}

function textOverlayStyle(overlay = {}) {
  const fontSize = Math.max(12, Math.min(80, Number(overlay.fontSize || 28)));
  const style = overlay.captionStyle || "classic";
  const backgroundOpacity = clampNumber(overlay.backgroundOpacity, style === "subtitle" ? 0.62 : style === "bubble" ? 0.92 : 0.28, 0, 1);
  const backgroundColor = overlay.backgroundColor || (style === "bubble" ? "#ffffff" : "#000000");
  const color = overlay.color || (style === "bubble" ? "#111827" : "#ffffff");
  const background = style === "outline" || backgroundOpacity <= 0
    ? "transparent"
    : hexToRgba(backgroundColor, backgroundOpacity);
  const textShadow = style === "outline"
    ? "0 2px 1px rgba(0,0,0,0.95), 2px 0 1px rgba(0,0,0,0.95), -2px 0 1px rgba(0,0,0,0.95), 0 -2px 1px rgba(0,0,0,0.95)"
    : style === "glow"
      ? "0 0 16px rgba(168,85,247,0.85), 0 3px 12px rgba(0,0,0,0.9)"
      : "0 2px 12px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)";
  return {
    color,
    fontFamily: overlay.fontFamily || "Inter",
    fontSize: `${fontSize}px`,
    fontWeight: overlay.fontWeight || 900,
    lineHeight: 1.05,
    textShadow,
    textTransform: overlay.textTransform || (style === "glow" ? "uppercase" : "none"),
    background,
    backdropFilter: "blur(2px)",
    borderRadius: style === "bubble" ? "999px" : "8px",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  };
}

function hexToRgba(hex = "#000000", alpha = 0.3) {
  const text = String(hex || "#000000").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(text)) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(text.slice(0, 2), 16);
  const g = parseInt(text.slice(2, 4), 16);
  const b = parseInt(text.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function textOverlayBoxLayoutStyle(overlay = {}) {
  const box = normalizeTextOverlayBox(overlay);
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    minHeight: `${box.height}%`,
  };
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

function SoundTimelineEditor({
  take,
  scene,
  disabled = false,
  soundGenerateJob = null,
  audioEnhanceJob = null,
  audioMixJob = null,
  onSaveSoundTimeline,
  onUploadSoundSnippet,
  onGenerateSound,
  onEnhanceAudio,
  onMixAudio,
}) {
  const [draft, setDraft] = useState(() => buildSoundTimelineDraft(take, scene));
  const [undoStack, setUndoStack] = useState([]);
  const [snippetFile, setSnippetFile] = useState(null);
  const [snippetDraft, setSnippetDraft] = useState(() => defaultSnippetLayer(take));
  const [generationDraft, setGenerationDraft] = useState(() => defaultGeneratedSoundDraft(take));
  const [mixerDraft, setMixerDraft] = useState(() => defaultMixerAutomationDraft(take));
  const [audioEnhanceNote, setAudioEnhanceNote] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [soundModalTrack, setSoundModalTrack] = useState(null);
  const [mixerModalOpen, setMixerModalOpen] = useState(false);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [draggingLayerId, setDraggingLayerId] = useState("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isGeneratingSound, setIsGeneratingSound] = useState(false);
  const sourcePreviewRef = useRef(null);
  const finalAudioVariant = finalAudioVariantForTake(take);
  const finalAudioProviderResponse = finalAudioVariant?.providerResponse || {};
  const audioFixes = normalizeAudioFixes(finalAudioProviderResponse, finalAudioVariant);
  const isSoundGenerating = isGeneratingSound || isRunningJobStatus(soundGenerateJob?.status);
  const isAudioEnhancing = isRunningJobStatus(audioEnhanceJob?.status);
  const isAudioMixing = isRunningJobStatus(audioMixJob?.status);
  const duration = Math.max(soundTimelineDuration(take, draft.layers), 1);
  const ticks = timelineTicks(duration);
  const lanes = useMemo(() => buildSoundTrackLanes(draft.layers), [draft.layers]);
  const selectedLayerIndex = draft.layers.findIndex((layer) => layer.id === selectedLayerId);
  const selectedLayer = selectedLayerIndex >= 0 ? draft.layers[selectedLayerIndex] : draft.layers[0] || null;
  const selectedAudioLayer = audioLayerCanBeEnhanced(selectedLayer) ? selectedLayer : null;
  const inputSummary = soundInputSummary(take, draft.layers, finalAudioVariant);
  const canPreviewSource = Boolean(take?.assetUrl) && inputSummary.hasTakeAudio;
  const audioEnhanceBlockReason = audioEnhanceDisabledReason({
    take,
    disabled: disabled && !isAudioEnhancing,
    hasTakeAudio: inputSummary.hasTakeAudio,
    hasSelectedAudioLayer: Boolean(selectedAudioLayer),
  });

  useEffect(() => {
    const nextDraft = buildSoundTimelineDraft(take, scene);
    setDraft(nextDraft);
    setUndoStack([]);
    setSelectedLayerId(nextDraft.layers[0]?.id || "");
    setSnippetDraft(defaultSnippetLayer(take));
    setGenerationDraft(defaultGeneratedSoundDraft(take));
    setMixerDraft(defaultMixerAutomationDraft(take));
    setAudioEnhanceNote("");
    setSnippetFile(null);
    setFileInputKey((current) => current + 1);
    setPlayheadSeconds(0);
    setDraggingLayerId("");
    setSoundModalTrack(null);
    setMixerModalOpen(false);
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
  const openSoundLaneModal = (track, startSeconds = playheadSeconds) => {
    const start = Math.max(0, Math.min(duration, safeTimelineNumber(startSeconds, 0)));
    const end = Math.max(start + 0.5, Math.min(duration, start + 4));
    const layerType = track?.id === "dialogue" ? "dialogue" : track?.id || "foley";
    setSoundModalTrack(track || SOUND_TRACKS[1]);
    setGenerationDraft((current) => ({
      ...current,
      layerType,
      startSeconds: roundTimelineValue(start),
      endSeconds: roundTimelineValue(end),
      durationSeconds: roundTimelineValue(end - start),
    }));
    setSnippetDraft((current) => ({
      ...current,
      layerType,
      startSeconds: roundTimelineValue(start),
      endSeconds: roundTimelineValue(end),
    }));
    setPlayheadSeconds(roundTimelineValue(start));
  };
  const updateSoundModalRange = (startValue, endValue) => {
    const start = Math.max(0, Math.min(duration, safeTimelineNumber(startValue, 0)));
    const end = Math.max(start + 0.1, Math.min(duration, safeTimelineNumber(endValue, start + 1)));
    setGenerationDraft((current) => ({
      ...current,
      startSeconds: roundTimelineValue(start),
      endSeconds: roundTimelineValue(end),
      durationSeconds: roundTimelineValue(end - start),
    }));
    setSnippetDraft((current) => ({
      ...current,
      startSeconds: roundTimelineValue(start),
      endSeconds: roundTimelineValue(end),
    }));
    setPlayheadSeconds(roundTimelineValue(start));
  };
  const openMixerModal = (track = null, startSeconds = playheadSeconds) => {
    const start = Math.max(0, Math.min(duration, safeTimelineNumber(startSeconds, 0)));
    const end = Math.max(start + 0.5, Math.min(duration, start + 4));
    setMixerDraft((current) => normalizeVolumeAutomation({
      ...current,
      trackId: track?.id || current.trackId || "dialogue",
      startSeconds: roundTimelineValue(start),
      endSeconds: roundTimelineValue(end),
    }));
    setPlayheadSeconds(roundTimelineValue(start));
    setMixerModalOpen(true);
  };
  const updateMixerRange = (startValue, endValue) => {
    const start = Math.max(0, Math.min(duration, safeTimelineNumber(startValue, 0)));
    const end = Math.max(start + 0.1, Math.min(duration, safeTimelineNumber(endValue, start + 1)));
    setMixerDraft((current) => normalizeVolumeAutomation({
      ...current,
      startSeconds: roundTimelineValue(start),
      endSeconds: roundTimelineValue(end),
    }));
    setPlayheadSeconds(roundTimelineValue(start));
  };
  const addVolumeAutomation = () => {
    const nextAutomation = normalizeVolumeAutomation(mixerDraft);
    pushUndo();
    setDraft((current) => ({
      ...current,
      mixSettings: normalizeMixSettings({
        ...current.mixSettings,
        volumeAutomation: [
          ...(Array.isArray(current.mixSettings?.volumeAutomation) ? current.mixSettings.volumeAutomation : []),
          nextAutomation,
        ],
      }),
    }));
  };
  const removeVolumeAutomation = (automationId) => {
    pushUndo();
    setDraft((current) => ({
      ...current,
      mixSettings: normalizeMixSettings({
        ...current.mixSettings,
        volumeAutomation: (Array.isArray(current.mixSettings?.volumeAutomation) ? current.mixSettings.volumeAutomation : []).filter((item) => item.id !== automationId),
      }),
    }));
  };
  const renderAudioMix = () => {
    onMixAudio?.(take, {
      layers: draft.layers.map(normalizeSoundLayerForSave),
      mixSettings: normalizeMixSettings(draft.mixSettings),
    });
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
    if (!generationDraft.prompt?.trim() || isSoundGenerating) return;
    const start = safeTimelineNumber(generationDraft.startSeconds, playheadSeconds);
    const end = safeTimelineNumber(generationDraft.endSeconds, start + Math.max(0.5, safeTimelineNumber(generationDraft.durationSeconds, 4)));
    setIsGeneratingSound(true);
    try {
      await onGenerateSound?.(take, {
        ...generationDraft,
        startSeconds: start,
        endSeconds: Math.max(start + 0.5, end),
        durationSeconds: Math.max(0.5, end - start),
        mixSettings: normalizeMixSettings(draft.mixSettings),
      });
      setGenerationDraft((current) => ({ ...current, prompt: "" }));
      setSoundModalTrack(null);
    } finally {
      setIsGeneratingSound(false);
    }
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
  const startAudioEnhance = (sourceLayer = null) => {
    const sourceAssetId = sourceLayer?.assetId || undefined;
    onEnhanceAudio?.(take, {
      sourceAssetId,
      mixSettings: normalizeMixSettings(draft.mixSettings),
      editNote: audioEnhanceNote || (sourceAssetId
        ? `Progressively enhance the selected ${soundTypeLabel(sourceLayer.layerType)} clip. Remove fan/noise artifacts, make it studio-clean, and preserve the same sound identity and timing.`
        : "Enhance audio quality for this video while preserving the original voice, words, timing, and texture."),
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
          <MiniButton icon={isSoundGenerating ? RefreshCw : Plus} label={isSoundGenerating ? "Generating..." : "Sound Bin"} disabled={disabled || isSoundGenerating} onClick={() => openSoundLaneModal(SOUND_TRACKS.find((track) => track.id === "foley"))} />
          <MiniButton icon={SlidersHorizontal} label="Mixer" disabled={disabled} onClick={() => openMixerModal(SOUND_TRACKS[0])} title="Open mixer for range-based volume changes." />
          <MiniButton
            icon={isAudioMixing ? RefreshCw : Volume2}
            label={isAudioMixing ? "Mixing..." : "Render Mix"}
            disabled={disabled || isAudioMixing || !take?.takeId}
            onClick={renderAudioMix}
            title="Render the saved dialogue, generated sounds, snippets, and mixer automation into the polished audio track."
          />
          <MiniButton icon={Volume2} label="Save Timeline" disabled={disabled} onClick={saveTimeline} />
        </div>
      </div>

      {isSoundGenerating && (
        <div className="mt-3 rounded-md border border-violet-300/15 bg-violet-400/[0.06] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-normal text-violet-100">
              <RefreshCw size={13} className="animate-spin" /> Sound generation running
            </p>
            <span className="shrink-0 text-[11px] font-black text-violet-100">
              {Math.max(5, Math.min(99, Number(soundGenerateJob?.progress || 35)))}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-300 transition-all"
              style={{ width: `${Math.max(5, Math.min(99, Number(soundGenerateJob?.progress || 35)))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-300">
            {soundGenerateJob?.message || soundGenerateJob?.outputPayload?.message || "Generating the selected music, ambience, foley, or sync hit for this range."}
          </p>
        </div>
      )}

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
              disabled={disabled || isAudioEnhancing}
              onChange={(event) => setAudioEnhanceNote(event.target.value)}
              placeholder="Optional: remove room echo, reduce traffic noise, make voice clearer, preserve original tone and timing"
              rows={2}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
            />
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={Boolean(audioEnhanceBlockReason) || isAudioEnhancing || !inputSummary.hasTakeAudio}
              onClick={() => startAudioEnhance()}
              className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              title={audioEnhanceBlockReason || "Enhance the recorded audio from this take while preserving original voice, words, timing, and texture."}
            >
              {isAudioEnhancing ? <RefreshCw size={14} className="animate-spin" /> : <Mic2 size={14} />}
              {isAudioEnhancing ? "Enhancing..." : "Enhance Audio"}
            </button>
            <button
              type="button"
              disabled={Boolean(audioEnhanceBlockReason) || isAudioEnhancing || !selectedAudioLayer}
              onClick={() => startAudioEnhance(selectedAudioLayer)}
              className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-100 disabled:opacity-50"
              title={selectedAudioLayer ? `Enhance selected layer: ${selectedAudioLayer.label || selectedAudioLayer.description || selectedAudioLayer.layerType}` : "Select a generated/uploaded audio layer in the timeline to enhance it."}
            >
              {isAudioEnhancing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isAudioEnhancing ? "Enhancing..." : "Enhance Selected Sound"}
            </button>
          </div>
        </div>
        {isAudioEnhancing && (
          <div className="mt-3 rounded-md border border-violet-300/15 bg-violet-400/[0.06] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-normal text-violet-100">
                <RefreshCw size={13} className="animate-spin" /> Audio enhancement running
              </p>
              <span className="shrink-0 text-[11px] font-black text-violet-100">{Math.max(5, Number(audioEnhanceJob?.progress || 35))}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-300 transition-all"
                style={{ width: `${Math.max(5, Math.min(99, Number(audioEnhanceJob?.progress || 35)))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-300">
              {audioEnhanceJob?.message || audioEnhanceJob?.outputPayload?.message || "Cleaning the recorded voice while preserving words, timing, and texture."}
            </p>
          </div>
        )}
        {isAudioMixing && (
          <div className="mt-3 rounded-md border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-normal text-cyan-100">
                <RefreshCw size={13} className="animate-spin" /> Audio mix rendering
              </p>
              <span className="shrink-0 text-[11px] font-black text-cyan-100">{Math.max(5, Number(audioMixJob?.progress || 35))}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all"
                style={{ width: `${Math.max(5, Math.min(99, Number(audioMixJob?.progress || 35)))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-300">
              {audioMixJob?.message || audioMixJob?.outputPayload?.message || "Rendering dialogue, generated clips, snippets, and volume automation into one polished track."}
            </p>
          </div>
        )}
        {audioEnhanceBlockReason && (
          <p className="mt-2 text-[11px] font-bold text-slate-500">{audioEnhanceBlockReason}</p>
        )}
        {finalAudioUrlForTake(take) && (
          <div className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/[0.055] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
                  <Volume2 size={13} /> Enhanced Audio Result
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                  {finalAudioProviderResponse.message || "Production-friendly audio is ready. Play it here before exporting or replacing the take audio."}
                </p>
              </div>
              <StatusPill status={finalAudioVariant.status || "AUDIO_READY"} />
            </div>
            <audio src={finalAudioUrlForTake(take)} controls className="mt-3 w-full" />
            <div className="mt-3 flex flex-wrap gap-2">
              {audioFixes.map((fix) => (
                <span key={fix} className="rounded-md border border-emerald-300/15 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-emerald-100">
                  {audioFixLabel(fix)}
                </span>
              ))}
            </div>
            {audioDisplayCost(finalAudioVariant) != null && (
              <p className="mt-2 text-[10px] font-bold text-slate-500">
                Charged: ${Number(audioDisplayCost(finalAudioVariant) || 0).toFixed(4)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-3">
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
                      onClick={() => openSoundLaneModal(track)}
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
                            onClick={(event) => {
                              event.stopPropagation();
                              selectLayer(layer);
                              openSoundLaneModal(track, layer.startSeconds);
                            }}
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

        <div className="rounded-md border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-100">
                <Sparkles size={13} /> Sound Bin
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-300">
                Click a lane to generate or upload sound. Open Mixer to lower or raise any track over a chosen duration.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOUND_TRACKS.filter((track) => track.id !== "dialogue").slice(0, 4).map((track) => (
                <button
                  key={track.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => openSoundLaneModal(track)}
                  className="rounded-md border border-white/10 bg-black/25 px-2 py-2 text-[10px] font-black uppercase tracking-normal text-slate-200 transition hover:border-cyan-300/40 disabled:opacity-50"
                >
                  {track.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {mixerModalOpen && (
        <MixerModal
          duration={duration}
          draft={mixerDraft}
          mixSettings={draft.mixSettings}
          disabled={disabled || isAudioMixing}
          isRendering={isAudioMixing}
          onClose={() => setMixerModalOpen(false)}
          onDraftChange={(patch) => setMixerDraft((current) => normalizeVolumeAutomation({ ...current, ...patch }))}
          onRangeChange={updateMixerRange}
          onMixChange={updateMix}
          onAddAutomation={addVolumeAutomation}
          onRemoveAutomation={removeVolumeAutomation}
          onRender={renderAudioMix}
        />
      )}
      {soundModalTrack && (
        <SoundLaneModal
          track={soundModalTrack}
          duration={duration}
          draft={generationDraft}
          snippetDraft={snippetDraft}
          snippetFile={snippetFile}
          fileInputKey={fileInputKey}
          disabled={disabled || isSoundGenerating}
          isGenerating={isSoundGenerating}
          onClose={() => setSoundModalTrack(null)}
          onDraftChange={(patch) => setGenerationDraft((current) => ({ ...current, ...patch }))}
          onSnippetDraftChange={(patch) => setSnippetDraft((current) => ({ ...current, ...patch }))}
          onSnippetFileChange={setSnippetFile}
          onRangeChange={updateSoundModalRange}
          onGenerate={generateSound}
          onUploadSnippet={uploadSnippet}
        />
      )}
    </div>
  );
}

function SoundLaneModal({
  track,
  duration,
  draft,
  snippetDraft,
  snippetFile,
  fileInputKey,
  disabled = false,
  isGenerating = false,
  onClose,
  onDraftChange,
  onSnippetDraftChange,
  onSnippetFileChange,
  onRangeChange,
  onGenerate,
  onUploadSnippet,
}) {
  const Icon = track?.icon || Music;
  const start = Math.max(0, safeTimelineNumber(draft?.startSeconds, 0));
  const end = Math.max(start + 0.1, safeTimelineNumber(draft?.endSeconds, start + safeTimelineNumber(draft?.durationSeconds, 1)));
  const canGenerate = draft?.layerType !== "dialogue";
  const updateLayerType = (value) => {
    onDraftChange?.({ layerType: value });
    onSnippetDraftChange?.({ layerType: value });
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#070a10] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.035] p-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-100">
              <Icon size={14} /> {track?.label || "Sound"} Lane
            </p>
            <h4 className="mt-1 text-base font-extrabold text-white">Generate or add sound</h4>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              Choose the horizontal range, describe the sound, then generate or upload a snippet for this lane.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="creator-control grid h-8 w-8 place-items-center p-0 text-slate-300"
            aria-label="Close sound modal"
          >
            <X size={15} />
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
          <div className="space-y-4">
            <SoundRangeSelector
              duration={duration}
              start={start}
              end={end}
              disabled={disabled}
              onChange={onRangeChange}
            />

            <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
              <p className="text-[10px] font-black uppercase tracking-normal text-cyan-100">Generate with AI</p>
              <textarea
                value={draft.prompt || ""}
                disabled={disabled || !canGenerate}
                onChange={(event) => onDraftChange?.({ prompt: event.target.value })}
                placeholder={canGenerate ? "Describe the exact music, ambience, foley, or SFX needed in this selected range." : "Dialogue generation is not used here. Upload dialogue or enhance recorded audio instead."}
                rows={4}
                className="mt-2 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <select
                  value={draft.layerType || track?.id || "foley"}
                  disabled={disabled}
                  onChange={(event) => updateLayerType(event.target.value)}
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
                >
                  {SOUND_LAYER_TYPES.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label}</option>
                  ))}
                </select>
                <input
                  value={draft.mood || ""}
                  disabled={disabled || !canGenerate}
                  onChange={(event) => onDraftChange?.({ mood: event.target.value })}
                  placeholder="Mood"
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                />
                <input
                  value={draft.instrumentation || ""}
                  disabled={disabled || !canGenerate}
                  onChange={(event) => onDraftChange?.({ instrumentation: event.target.value })}
                  placeholder="Instruments"
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                disabled={disabled || isGenerating || !canGenerate || !draft.prompt?.trim()}
                onClick={onGenerate}
                className="creator-primary mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                title="Generate audio for the selected range."
              >
                {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {isGenerating ? "Generating Sound..." : `Generate ${formatTimelineTime(start)} - ${formatTimelineTime(end)}`}
              </button>
              {!canGenerate && (
                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  For spoken dialogue, use recorded take audio or Enhance Audio so lip-sync and voice texture stay intact.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Sound Bin</p>
            <label className="block rounded-md border border-dashed border-white/10 bg-black/20 p-2">
              <span className="mb-2 block text-[11px] font-bold text-slate-300">Upload sound snippet</span>
              <input
                key={fileInputKey}
                type="file"
                accept="audio/*"
                disabled={disabled}
                onChange={(event) => onSnippetFileChange?.(event.target.files?.[0] || null)}
                className="block w-full text-[11px] text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-white"
              />
            </label>
            <select
              value={snippetDraft.layerType || draft.layerType || track?.id || "foley"}
              disabled={disabled}
              onChange={(event) => updateLayerType(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
            >
              {SOUND_LAYER_TYPES.map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <NumberMiniInput label="Start" value={snippetDraft.startSeconds} max={duration} disabled={disabled} onChange={(value) => onRangeChange?.(value, snippetDraft.endSeconds)} />
              <NumberMiniInput label="End" value={snippetDraft.endSeconds} max={duration} disabled={disabled} onChange={(value) => onRangeChange?.(snippetDraft.startSeconds, value)} />
            </div>
            <SoundKnob label="Level" value={snippetDraft.volumeDb} min={-48} max={6} disabled={disabled} onChange={(value) => onSnippetDraftChange?.({ volumeDb: value })} />
            <button
              type="button"
              disabled={disabled || !snippetFile}
              onClick={onUploadSnippet}
              className="creator-control flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
            >
              <Upload size={13} /> Add Snippet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MixerModal({
  duration,
  draft,
  mixSettings = {},
  disabled = false,
  isRendering = false,
  onClose,
  onDraftChange,
  onRangeChange,
  onMixChange,
  onAddAutomation,
  onRemoveAutomation,
  onRender,
}) {
  const start = Math.max(0, safeTimelineNumber(draft?.startSeconds, 0));
  const end = Math.max(start + 0.1, safeTimelineNumber(draft?.endSeconds, start + 1));
  const automation = Array.isArray(mixSettings.volumeAutomation) ? mixSettings.volumeAutomation : [];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-[#070a10] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.035] p-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-cyan-100">
              <SlidersHorizontal size={14} /> Audio Mixer
            </p>
            <h4 className="mt-1 text-base font-extrabold text-white">Shape the mix over time</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="creator-control grid h-8 w-8 place-items-center p-0 text-slate-300"
            aria-label="Close mixer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="space-y-4">
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/[0.045] p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem] md:items-end">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-400">Track</span>
                  <select
                    value={draft.trackId || "dialogue"}
                    disabled={disabled}
                    onChange={(event) => onDraftChange?.({ trackId: event.target.value })}
                    className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs font-bold text-white outline-none"
                  >
                    {SOUND_TRACKS.map((track) => (
                      <option key={track.id} value={track.id} className="bg-slate-950 text-white">{track.label}</option>
                    ))}
                  </select>
                </label>
                <SoundKnob
                  label="Range Level"
                  value={draft.volumeDb}
                  min={-48}
                  max={6}
                  disabled={disabled}
                  onChange={(value) => onDraftChange?.({ volumeDb: value })}
                />
              </div>
              <div className="mt-3">
                <SoundRangeSelector
                  duration={duration}
                  start={start}
                  end={end}
                  disabled={disabled}
                  onChange={onRangeChange}
                />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <NumberMiniInput label="Start" value={start} max={duration} disabled={disabled} onChange={(value) => onRangeChange?.(value, end)} />
                <NumberMiniInput label="End" value={end} max={duration} disabled={disabled} onChange={(value) => onRangeChange?.(start, value)} />
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={onAddAutomation}
                className="creator-control mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
              >
                <Plus size={13} /> Add Volume Change
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Volume Changes</p>
                <span className="text-[10px] font-black text-slate-500">{automation.length}</span>
              </div>
              {automation.length ? (
                <div className="mt-3 space-y-2">
                  {automation.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/25 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black uppercase tracking-normal text-white">{soundTrackLabel(item.trackId)}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                          {formatTimelineTime(item.startSeconds)} - {formatTimelineTime(item.endSeconds)} / {Number(item.volumeDb || 0)} dB
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onRemoveAutomation?.(item.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-black/30 text-slate-400 transition hover:border-red-300/40 hover:text-red-100 disabled:opacity-50"
                        aria-label="Remove volume change"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-md border border-dashed border-white/10 bg-black/20 px-3 py-3 text-[11px] font-semibold leading-5 text-slate-500">
                  No range changes yet. Add one when music, foley, ambience, or dialogue needs to rise or duck for a specific moment.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Global Mix</p>
              <label className="block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-normal text-slate-400">Overtake Priority</span>
                <select
                  value={mixSettings.overtakeLayer}
                  disabled={disabled}
                  onChange={(event) => onMixChange?.("overtakeLayer", event.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
                >
                  {SOUND_OVERTAKE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-950 text-white">{option.label} overtakes</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <SoundKnob label="Music" value={mixSettings.musicBedDb} min={-48} max={0} disabled={disabled} onChange={(value) => onMixChange?.("musicBedDb", value)} />
                <SoundKnob label="Foley" value={mixSettings.foleyDuckingDb} min={-30} max={0} disabled={disabled} onChange={(value) => onMixChange?.("foleyDuckingDb", value)} />
                <SoundKnob label="Voice" value={mixSettings.dialogueDuckingDb} min={-30} max={0} disabled={disabled} onChange={(value) => onMixChange?.("dialogueDuckingDb", value)} />
              </div>
            </div>

            <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.055] p-3">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
                <Volume2 size={13} /> Rendered Mix
              </p>
              <button
                type="button"
                disabled={disabled || isRendering}
                onClick={onRender}
                className="creator-primary mt-3 flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {isRendering ? <RefreshCw size={13} className="animate-spin" /> : <Volume2 size={13} />}
                {isRendering ? "Rendering Mix..." : "Render Mix"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoundRangeSelector({ duration, start, end, disabled = false, onChange }) {
  const total = Math.max(0.5, safeTimelineNumber(duration, 1));
  const safeStart = Math.max(0, Math.min(total - 0.1, safeTimelineNumber(start, 0)));
  const safeEnd = Math.max(safeStart + 0.1, Math.min(total, safeTimelineNumber(end, safeStart + 1)));
  const left = (safeStart / total) * 100;
  const width = ((safeEnd - safeStart) / total) * 100;
  const updateStart = (value) => onChange?.(Math.min(Number(value), safeEnd - 0.1), safeEnd);
  const updateEnd = (value) => onChange?.(safeStart, Math.max(Number(value), safeStart + 0.1));
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Duration Range</p>
        <p className="text-[11px] font-black text-cyan-100">
          {formatTimelineTime(safeStart)} - {formatTimelineTime(safeEnd)}
        </p>
      </div>
      <div className="relative mt-3 h-10 rounded-md border border-white/10 bg-black/45">
        <div className="absolute inset-y-2 rounded bg-cyan-300/25 ring-1 ring-cyan-200/40" style={{ left: `${left}%`, width: `${width}%` }} />
        <span className="absolute top-1 h-8 w-1 rounded bg-cyan-200" style={{ left: `calc(${left}% - 2px)` }} />
        <span className="absolute top-1 h-8 w-1 rounded bg-cyan-200" style={{ left: `calc(${left + width}% - 2px)` }} />
      </div>
      <div className="mt-3 grid gap-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold text-slate-500">Start</span>
          <input
            type="range"
            min={0}
            max={total}
            step="0.1"
            value={safeStart}
            disabled={disabled}
            onChange={(event) => updateStart(event.target.value)}
            className="w-full accent-cyan-300"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold text-slate-500">End</span>
          <input
            type="range"
            min={0}
            max={total}
            step="0.1"
            value={safeEnd}
            disabled={disabled}
            onChange={(event) => updateEnd(event.target.value)}
            className="w-full accent-cyan-300"
          />
        </label>
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
    mixSettings: {
      ...(draft.mixSettings || {}),
      volumeAutomation: (Array.isArray(draft.mixSettings?.volumeAutomation) ? draft.mixSettings.volumeAutomation : []).map((item) => ({ ...item })),
    },
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

function audioLayerCanBeEnhanced(layer = null) {
  if (!layer?.assetId) return false;
  const contentType = String(layer.contentType || "").toLowerCase();
  const source = String(layer.source || "").toLowerCase();
  return contentType.startsWith("audio/")
    || ["ai_generated", "user_upload", "generated_sound", "audio_enhanced", "audio_mixed"].includes(source);
}

function audioEnhanceDisabledReason({ take, disabled, hasTakeAudio, hasSelectedAudioLayer = false }) {
  if (disabled) return "Finish current shot job first.";
  if (!take?.takeId) return "Save this take first.";
  if (!hasTakeAudio && !hasSelectedAudioLayer) return "Upload a video/audio take or select a generated sound layer first.";
  return "";
}

function shotTakeJobCategory(job = null) {
  if (!job || !isRunningJobStatus(job.status)) return "";
  const jobType = String(job.jobType || job.type || "").toUpperCase();
  if (!jobType) return "unknown";
  if (SHOT_TAKE_AUDIO_JOB_TYPES.has(jobType)) return "audio";
  if (SHOT_TAKE_VIDEO_JOB_TYPES.has(jobType)) return "video";
  if (SHOT_TAKE_SHARED_JOB_TYPES.has(jobType)) return "shared";
  return "unknown";
}

function activeJobForTake(job = null, take = null, jobType = "") {
  if (!job || !take?.takeId || !isRunningJobStatus(job.status)) return null;
  const normalizedType = String(job.jobType || job.type || "").toUpperCase();
  if (jobType && normalizedType !== String(jobType).toUpperCase()) return null;
  const input = job.inputPayload || job.input || {};
  const output = job.outputPayload || job.result || {};
  const candidates = [
    input.takeId,
    input.take_id,
    output.takeId,
    output.take_id,
    output.audioEnhancement?.takeId,
    output.audioEnhancement?.providerTask?.takeId,
    output.audioMix?.takeId,
    output.audioMix?.providerTask?.takeId,
    output.soundMix?.takeId,
    output.soundMix?.providerTask?.takeId,
  ].filter(Boolean).map(String);
  return candidates.includes(String(take.takeId)) ? job : null;
}

function isRunningJobStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (!normalized) return false;
  return !["COMPLETED", "SUCCEEDED", "SUCCESS", "FAILED", "FAILURE", "ERROR", "ERRORED", "CANCELED", "CANCELLED"].includes(normalized);
}

function normalizeAudioFixes(providerResponse = {}, variant = {}) {
  const rawFixes = providerResponse.audioFixes || providerResponse.fixes || providerResponse.whatChanged || [];
  const fixes = Array.isArray(rawFixes) ? rawFixes : String(rawFixes || "").split(",");
  const normalized = fixes.map((fix) => String(fix || "").trim()).filter(Boolean);
  if (normalized.length) return normalized;
  if (variant?.finalAudioUrl) {
    return ["background_noise_reduced", "speech_clarity_improved", "loudness_normalized", "voice_texture_preserved"];
  }
  return [];
}

function audioFixLabel(value = "") {
  const labels = {
    background_noise_reduced: "Noise reduced",
    speech_clarity_improved: "Voice clearer",
    light_dereverb_if_needed: "Echo softened",
    loudness_normalized: "Loudness normalized",
    uploaded_snippet_mix_preserved: "Timeline mix preserved",
    voice_texture_preserved: "Voice preserved",
  };
  const key = String(value || "").toLowerCase();
  return labels[key] || key.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function audioDisplayCost(variant = {}) {
  const costMetadata = variant?.promptPayload?.costMetadata || variant?.providerResponse?.costMetadata || {};
  const value = costMetadata.billableTotalCost ?? costMetadata.customerTotalCost ?? costMetadata.totalCost;
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
  const end = Math.min(duration, 4);
  return {
    prompt: "",
    layerType: "music",
    startSeconds: 0,
    endSeconds: end,
    durationSeconds: end,
    volumeDb: -14,
    mood: "",
    instrumentation: "",
    bpmRange: "",
    loopable: true,
    avoidVocals: true,
  };
}

function defaultMixerAutomationDraft(take = {}) {
  const duration = Math.max(1, soundTimelineDuration(take, []));
  return normalizeVolumeAutomation({
    trackId: "dialogue",
    startSeconds: 0,
    endSeconds: Math.min(duration, 4),
    volumeDb: 0,
  });
}

function normalizeMixSettings(settings = {}) {
  const rawAutomation = settings.volumeAutomation || settings.volume_automation || settings.automation || [];
  return {
    primaryLayer: normalizeOvertakeLayer(settings.primaryLayer || "dialogue"),
    overtakeLayer: normalizeOvertakeLayer(settings.overtakeLayer || "dialogue"),
    dialogueDuckingDb: Math.max(-30, Math.min(0, safeTimelineNumber(settings.dialogueDuckingDb, -10))),
    foleyDuckingDb: Math.max(-30, Math.min(0, safeTimelineNumber(settings.foleyDuckingDb, -6))),
    musicBedDb: Math.max(-48, Math.min(0, safeTimelineNumber(settings.musicBedDb, -18))),
    ambienceBedDb: Math.max(-48, Math.min(0, safeTimelineNumber(settings.ambienceBedDb, -22))),
    backgroundMusicDucksUnderDialogue: settings.backgroundMusicDucksUnderDialogue !== false,
    foleyDucksUnderDialogue: settings.foleyDucksUnderDialogue !== false,
    volumeAutomation: (Array.isArray(rawAutomation) ? rawAutomation : []).map(normalizeVolumeAutomation),
  };
}

function normalizeVolumeAutomation(item = {}) {
  const start = Math.max(0, safeTimelineNumber(item.startSeconds ?? item.start_seconds, 0));
  const end = Math.max(start + 0.1, safeTimelineNumber(item.endSeconds ?? item.end_seconds, start + 1));
  return {
    id: item.id || `volume-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trackId: normalizeSoundType(item.trackId || item.track_id || item.layerType || "dialogue"),
    startSeconds: roundTimelineValue(start),
    endSeconds: roundTimelineValue(end),
    volumeDb: Math.max(-48, Math.min(6, safeTimelineNumber(item.volumeDb ?? item.volume_db ?? item.gainDb ?? item.gain_db, 0))),
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

function soundTrackLabel(value) {
  const normalized = normalizeSoundType(value);
  return SOUND_TRACKS.find((track) => track.id === normalized)?.label || soundTypeLabel(normalized);
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

function nearestTimelineFrame(frames = [], seconds = 0) {
  const items = (Array.isArray(frames) ? frames : []).filter((frame) => frame?.thumbnailDataUrl);
  if (!items.length) return null;
  const target = Number(seconds) || 0;
  return items.reduce((best, frame) => {
    if (!best) return frame;
    const bestDistance = Math.abs(Number(best.timestampSeconds || 0) - target);
    const frameDistance = Math.abs(Number(frame.timestampSeconds || 0) - target);
    return frameDistance < bestDistance ? frame : best;
  }, null);
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

function VideoPolishControls({
  take,
  isBusy,
  polishBlockedReason = "",
  provider = "luma",
  providerCredit = null,
  decartProviderCredit = null,
  polishJob = null,
  finalRenderJob = null,
  finalVideoUrl = "",
  finalRenderUrl = "",
  finalVideoVariant = null,
  selectedFrameUrl = "",
  selectedFrameTimestamp = null,
  editNote = "",
  tryOnNote = "",
  status = "READY",
  studioPayload,
  onEditNoteChange,
  onTryOnNoteChange,
  onStudioPolish,
  onRenderFinalVideo,
}) {
  const isVideoTake = String(take?.contentType || "").startsWith("video/");
  const isPolishing = isRunningJobStatus(polishJob?.status);
  const isFinalRendering = isRunningJobStatus(finalRenderJob?.status);
  const canRenderFinal = Boolean(finalVideoUrl && take?.takeId && finalVideoVariant?.variantId);
  const blockReason = videoPolishDisabledReason({
    take,
    isBusy: isBusy && !isPolishing,
    isVideoTake,
    hasImageAnchor: Boolean(selectedFrameUrl || take?.referenceFrameUrl),
    polishJob,
    provider,
    providerCredit,
    polishBlockedReason,
  });
  const tryOnPrompt = String(tryOnNote || "").trim();
  const tryOnBlockReason = videoPolishDisabledReason({
    take,
    isBusy: isBusy && !isPolishing,
    isVideoTake,
    hasImageAnchor: Boolean(selectedFrameUrl || take?.referenceFrameUrl),
    polishJob,
    provider: "decart",
    providerCredit: decartProviderCredit,
    polishBlockedReason,
  }) || (!tryOnPrompt ? "Describe the clothing change first." : "");
  const progress = Math.max(5, Math.min(99, Number(polishJob?.progress || 35)));
  return (
    <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.045] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
            <Sparkles size={13} /> Fix Background & Lighting
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
            Improve the room, set design, lighting, color, camera finish, and actor polish while keeping the same face, voice timing, and performance.
          </p>
        </div>
        <StatusPill status={isPolishing ? polishJob?.status || "RUNNING" : finalRenderUrl ? "FINAL_READY" : finalVideoUrl ? "VIDEO_READY" : status} />
      </div>

      <textarea
        value={editNote}
        disabled={isPolishing || Boolean(polishBlockedReason)}
        onChange={(event) => onEditNoteChange?.(event.target.value)}
        placeholder="Optional: make the room darker and glossy, add soft rim light, improve set design while keeping the same face."
        rows={3}
        className="mt-3 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
      />

      <div className="mt-3 rounded-lg border border-violet-300/15 bg-violet-400/[0.055] p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-violet-100">
              <Sparkles size={13} /> Try different clothes
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
              Change only the visible clothes. Background and lighting can be fixed before or after this pass.
            </p>
          </div>
          <StatusPill status={isPolishing ? polishJob?.status || "RUNNING" : "OPTIONAL"} />
        </div>
        <textarea
          value={tryOnNote}
          disabled={isPolishing || Boolean(polishBlockedReason)}
          onChange={(event) => onTryOnNoteChange?.(event.target.value)}
          placeholder="Example: substitute the current top with a black fitted tank top, natural fabric, no logo."
          rows={2}
          className="mt-3 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={Boolean(tryOnBlockReason) || isPolishing}
            onClick={() => onStudioPolish?.(take, studioPayload?.(tryOnPrompt, take, {
              provider: "decart",
              model: "lucy-vton-3",
              providerMode: "virtual_try_on",
              seed: stableRunwaySeed(`${take?.takeId || "try-on"}:${tryOnPrompt}`),
              overrides: {
                operation: "wardrobe_try_on",
                providerIntent: "change_clothing_only",
              },
            }))}
            className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-violet-100 disabled:opacity-50"
            title={tryOnBlockReason || "Change clothes on the current latest polished video."}
          >
            {isPolishing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isPolishing ? "Trying Clothes..." : "Try Clothes"}
          </button>
          <p className="text-[11px] font-bold text-slate-500">
            {tryOnBlockReason || "This pass becomes the newest polished video."}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(blockReason) || isPolishing}
            onClick={() => onStudioPolish?.(take, studioPayload?.(editNote || "", take))}
            className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            title={blockReason || "Fix the uploaded video using production design plus the optional prompt."}
          >
            {isPolishing ? <RefreshCw size={14} className="animate-spin" /> : <Film size={14} />}
            {isPolishing ? "Fixing..." : finalVideoUrl ? "Fix Again" : "Fix Background & Lighting"}
          </button>
          <button
            type="button"
            disabled={!canRenderFinal || isFinalRendering || isPolishing}
            onClick={() => onRenderFinalVideo?.(take, {
              variantId: finalVideoVariant?.variantId,
              burnTextOverlays: true,
              useMixedAudio: true,
            })}
            className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-100 disabled:opacity-50"
            title={canRenderFinal ? "Create one baked MP4 with polished video, mixed/enhanced audio, and saved text overlays." : "Polish the video first before rendering the final MP4."}
          >
            {isFinalRendering ? <RefreshCw size={14} className="animate-spin" /> : <Film size={14} />}
            {isFinalRendering ? "Rendering Final..." : finalRenderUrl ? "Render Final Again" : "Render Final MP4"}
          </button>
        </div>
        <p className="text-[11px] font-bold text-slate-500">
          {blockReason || (selectedFrameTimestamp == null ? "Using saved reference frame." : `Using frame at ${formatTimelineTime(selectedFrameTimestamp)}.`)}
        </p>
      </div>

      {isPolishing && (
        <div className="mt-3 rounded-md border border-violet-300/15 bg-violet-400/[0.06] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-normal text-violet-100">
              <RefreshCw size={13} className="animate-spin" /> Video polish running
            </p>
            <span className="shrink-0 text-[11px] font-black text-violet-100">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-violet-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-300">
            {polishJob?.message || polishJob?.outputPayload?.message || "Rendering the uploaded take with production design, continuity, and your prompt."}
          </p>
        </div>
      )}

      {finalVideoUrl && (
        <p className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-1.5 text-[11px] font-bold text-emerald-100">
          Polished video is active in the preview and edited timeline.
        </p>
      )}
      {isFinalRendering && (
        <div className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/[0.06] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-normal text-emerald-100">
              <RefreshCw size={13} className="animate-spin" /> Final MP4 rendering
            </p>
            <span className="shrink-0 text-[11px] font-black text-emerald-100">
              {Math.max(5, Math.min(99, Number(finalRenderJob?.progress || 35)))}%
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-300">
            {finalRenderJob?.message || "Baking polished video, final audio, and text overlays into one saved MP4."}
          </p>
        </div>
      )}
      {finalRenderUrl && (
        <p className="mt-3 rounded-md border border-fuchsia-300/15 bg-fuchsia-400/10 px-2 py-1.5 text-[11px] font-bold text-fuchsia-100">
          Final baked MP4 is ready for preview/export.
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
  const renderAnchorUrl = selectedFrameUrl || analysisImageUrl;
  const canRenderFinal = Boolean(take?.takeId && isVideoTake && renderAnchorUrl && !finalVideoUrl);
  const frame = shotFrameSpec(scene, take);
  if (finalVideoUrl) {
    return (
      <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.07] px-3 py-2">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
          <Film size={13} /> Final video active
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
          Use the Polished timeline button to play this rendered video separately from the raw take.
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
              : "Select a frame if needed, then render Studio Polish from production design, Studio Look, continuity, and your optional prompt."}
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
              title={canRenderFinal ? "Render a playable Studio Polish video for the timeline." : "Select a timeline frame before rendering the final video."}
            >
              <Film size={13} /> Render Polish
            </button>
          </div>
          {isPreviewInTimeline && (
            <p className="mt-2 text-[10px] font-bold text-cyan-100">Applied to this clip.</p>
          )}
          {isVideoTake && !renderAnchorUrl && (
            <p className="mt-2 text-[10px] font-bold text-slate-500">Select a timeline frame to render final video.</p>
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

function PolishedFrameCanvasEmpty({ take, scene, isVideoTake = false, hasFinalVideo = false }) {
  const frame = shotFrameSpec(scene, take);
  let title = "Upload a take";
  let message = "Save a shot take before writing text.";
  if (take && !isVideoTake) {
    title = "Video take needed";
    message = "Text placement is for polished video frames.";
  } else if (take && !hasFinalVideo) {
    title = "Polish video first";
    message = "Render the polished video, then choose a frame from the polished timeline.";
  } else if (take && hasFinalVideo) {
    title = "Choose polished frame";
    message = "Play or seek the polished timeline below, then click Use Polished Frame.";
  }
  return (
    <div className="rounded-lg border border-fuchsia-300/15 bg-fuchsia-400/[0.035] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-fuchsia-100">
            <TypeIcon /> Text Canvas
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">{message}</p>
        </div>
        <StatusPill status={hasFinalVideo ? "SELECT_FRAME" : "WAITING"} />
      </div>
      <div
        className="relative mx-auto grid h-80 w-auto max-w-full place-items-center overflow-hidden rounded-lg border border-dashed border-fuchsia-200/20 bg-black/45"
        style={{ aspectRatio: frame.aspectRatio }}
      >
        <div className="text-center">
          <TypeIcon className="mx-auto mb-2 text-fuchsia-100/70" size={28} />
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-slate-400">{message}</p>
        </div>
        <div className="pointer-events-none absolute inset-x-[10%] inset-y-0 border-x border-white/10" />
        <div className="pointer-events-none absolute inset-y-[8%] inset-x-0 border-y border-white/10" />
      </div>
    </div>
  );
}

function TextCanvasTile({ take, scene, frameUrl, timestampSeconds, draft, onOpen }) {
  const frame = shotFrameSpec(scene, take);
  return (
    <div className="rounded-lg border border-fuchsia-300/15 bg-fuchsia-400/[0.045] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-fuchsia-100">
            <TypeIcon /> Text Canvas
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
            {timestampSeconds == null ? "Selected polished frame" : `Polished frame at ${formatTimelineTime(timestampSeconds)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="creator-control shrink-0 px-3 py-2 text-[10px] font-black uppercase tracking-normal text-fuchsia-100"
        >
          Edit Frame
        </button>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="group relative mx-auto block h-80 w-auto max-w-full overflow-hidden rounded-lg border border-white/10 bg-black text-left outline-none transition hover:border-fuchsia-200/60 focus-visible:border-fuchsia-200"
        style={{ aspectRatio: frame.aspectRatio }}
        title="Open frame-level editor"
      >
        <img src={frameUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.01]" loading="lazy" />
        <TextOverlayLayer fallbackOverlay={draft} />
        <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-white/80">
          Click to edit
        </span>
      </button>
    </div>
  );
}

function RawTakePreview({ take, scene }) {
  const src = take?.assetUrl || take?.publicUrl || "";
  const contentType = String(take?.contentType || "").toLowerCase();
  const frame = mediaPreviewFrameSpec(scene, take);
  const mediaStyle = {
    objectFit: frame.objectFit,
    objectPosition: frame.objectPosition,
  };
  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-300">
        <Film size={13} /> Original Take
      </p>
      {src ? (
        <EditorFrame frame={frame} compact>
          {contentType.startsWith("video/") ? (
            <video src={src} controls playsInline className="h-full w-full bg-black" style={mediaStyle} />
          ) : (
            <img src={src} alt="" className="h-full w-full bg-black" style={mediaStyle} loading="lazy" />
          )}
        </EditorFrame>
      ) : (
        <div
          className="grid h-72 place-items-center rounded-lg border border-dashed border-white/10 bg-black/45 text-center text-xs font-bold text-slate-500"
        >
          Upload original take
        </div>
      )}
    </div>
  );
}

function MediaPreview({
  take,
  scene,
  finalVideoUrl,
  finalVideoVariant = null,
  textOverlays = [],
  selectedPolishedFrameUrl = "",
  selectedPolishedFrameTimestamp = null,
  onOpenFrameEditor,
  polishedOnly = false,
  useEmbeddedAudioOnly = false,
}) {
  const src = polishedOnly ? finalVideoUrl : finalVideoUrl || take?.assetUrl;
  const contentType = take?.contentType || "";
  const frame = mediaPreviewFrameSpec(scene, take);
  const enhancedAudioUrl = useEmbeddedAudioOnly ? "" : finalAudioUrlForTake(take, finalVideoVariant);
  const originalAudioUrl = useEmbeddedAudioOnly ? "" : rawAudioUrlForTake(take);
  const externalAudioUrl = enhancedAudioUrl || originalAudioUrl;
  const externalAudioLabel = enhancedAudioUrl
    ? "Enhanced/mixed audio is synced for final take preview."
    : "Original take audio is synced until you polish audio.";
  const mediaStyle = {
    objectFit: frame.objectFit,
    objectPosition: frame.objectPosition,
  };
  if (!src) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/30 p-3">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
          <Film size={13} /> Polished Video
        </p>
        <div
          className="grid h-72 place-items-center rounded-lg border border-dashed border-white/10 bg-black/45 text-center text-xs font-bold text-slate-500"
        >
          {take ? "Polished video pending" : "No take"}
        </div>
      </div>
    );
  }
  if (finalVideoUrl) {
    return (
      <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-emerald-100">
          <Film size={13} /> Polished Video
        </p>
        <EditorFrame frame={frame} compact>
          {externalAudioUrl ? (
            <FinalTakePreview
              videoUrl={finalVideoUrl}
              audioUrl={externalAudioUrl}
              audioLabel={externalAudioLabel}
              textOverlays={textOverlays}
              mediaStyle={mediaStyle}
            />
          ) : (
            <VideoWithTextOverlays src={finalVideoUrl} textOverlays={textOverlays} mediaStyle={mediaStyle} />
          )}
        </EditorFrame>
        <p className={`rounded-md border px-2 py-1 text-[11px] font-bold ${
          enhancedAudioUrl
            ? "border-violet-300/15 bg-violet-400/10 text-violet-100"
            : "border-emerald-300/15 bg-emerald-400/10 text-emerald-100"
        }`}>
          {enhancedAudioUrl ? "Final take preview is using polished video plus enhanced/mixed audio." : "Polished video is using original take audio. Polish audio when the video look is approved."}
        </p>
        {selectedPolishedFrameUrl ? (
          <button
            type="button"
            onClick={onOpenFrameEditor}
            className="creator-control flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-fuchsia-100"
            title="Open the selected polished frame for text and frame-level edits."
          >
            <TypeIcon /> <span className="whitespace-nowrap">Edit frame</span>
            <span className="whitespace-nowrap text-[10px] text-slate-400">
              {selectedPolishedFrameTimestamp == null ? "" : formatTimelineTime(selectedPolishedFrameTimestamp)}
            </span>
          </button>
        ) : (
          <p className="rounded-md border border-fuchsia-300/15 bg-fuchsia-400/[0.045] px-2 py-1 text-[11px] font-semibold text-fuchsia-100">
            Use the polished timeline below to choose a frame for text or frame-level edits.
          </p>
        )}
      </div>
    );
  }
  if (contentType.startsWith("video/")) {
    return (
      <EditorFrame frame={frame} compact>
        <VideoWithTextOverlays src={src} textOverlays={textOverlays} mediaStyle={mediaStyle} />
      </EditorFrame>
    );
  }
  return (
    <EditorFrame frame={frame} compact>
      <img src={src} alt="" className="h-full w-full bg-black" style={mediaStyle} loading="lazy" />
    </EditorFrame>
  );
}

function FinalTakePreview({ videoUrl, audioUrl, audioLabel = "Mixed audio is synced for final take preview.", textOverlays = [], mediaStyle = {} }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [videoUrl, audioUrl]);

  const syncMediaTime = (seconds) => {
    const safeTime = Math.max(0, Math.min(Number.isFinite(duration) && duration > 0 ? duration : Number.MAX_SAFE_INTEGER, Number(seconds) || 0));
    [videoRef.current, audioRef.current].forEach((element) => {
      if (!element) return;
      try {
        element.currentTime = safeTime;
      } catch {
        // Ignore browser seek edge cases on signed URLs while metadata is still loading.
      }
    });
    setCurrentTime(roundTimelineValue(safeTime));
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;
    if (!video.paused || !audio.paused) {
      video.pause();
      audio.pause();
      setIsPlaying(false);
      return;
    }
    setSyncing(true);
    try {
      audio.currentTime = video.currentTime;
      await Promise.all([video.play(), audio.play()]);
      setIsPlaying(true);
    } catch {
      video.pause?.();
      audio.pause?.();
      setIsPlaying(false);
    } finally {
      setSyncing(false);
    }
  };

  const onTimeUpdate = (event) => {
    const nextTime = Number(event.currentTarget.currentTime) || 0;
    setCurrentTime(roundTimelineValue(nextTime));
    const audio = audioRef.current;
    if (audio && !audio.paused && Math.abs(Number(audio.currentTime || 0) - nextTime) > 0.28) {
      audio.currentTime = nextTime;
    }
  };

  const onLoadedMetadata = (event) => {
    const videoDuration = Number(event.currentTarget.duration);
    const audioDuration = Number(audioRef.current?.duration || 0);
    const nextDuration = Math.max(
      Number.isFinite(videoDuration) ? videoDuration : 0,
      Number.isFinite(audioDuration) ? audioDuration : 0
    );
    if (nextDuration > 0) {
      setDuration(roundTimelineValue(nextDuration));
    }
  };

  const onEnded = () => {
    audioRef.current?.pause?.();
    setIsPlaying(false);
  };

  return (
    <div className="relative h-full min-h-[12rem] w-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        className="h-full w-full bg-black"
        style={mediaStyle}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />
      <audio ref={audioRef} src={audioUrl} preload="metadata" onLoadedMetadata={onLoadedMetadata} />
      <TextOverlayLayer overlays={textOverlays} currentTime={currentTime} />
      <div className="absolute inset-x-3 bottom-3 z-30 rounded-lg border border-white/10 bg-black/78 p-2 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={togglePlay}
            disabled={syncing}
            className="creator-primary flex h-8 items-center justify-center gap-2 px-3 text-[10px] font-black uppercase tracking-normal text-white disabled:opacity-60"
          >
            {syncing ? <RefreshCw size={12} className="animate-spin" /> : isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? "Pause Final" : "Play Final"}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, duration || 0.1)}
            step={0.05}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={(event) => syncMediaTime(Number(event.target.value))}
            className="min-w-0 flex-1 accent-violet-300"
            aria-label="Final take scrubber"
          />
          <span className="shrink-0 text-[10px] font-black uppercase tracking-normal text-slate-300">
            {formatTimelineTime(currentTime)} / {formatTimelineTime(duration)}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-2 text-[10px] font-bold text-violet-100/85">
          <Volume2 size={12} /> {audioLabel}
        </p>
      </div>
    </div>
  );
}

function FrameEditorModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/78 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-normal text-fuchsia-100">Frame Editor</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">Enhance the selected polished frame, place text, then save it to this shot.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="creator-control grid h-8 w-8 place-items-center text-slate-200"
            aria-label="Close frame editor"
          >
            <X size={14} />
          </button>
        </div>
        <div className="custom-scrollbar max-h-[calc(92vh-4rem)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function EditorFrame({ frame, children, compact = false }) {
  const frameStyle = compact
    ? compactEditorFrameStyle(frame)
    : { aspectRatio: frame.aspectRatio, maxWidth: frame.maxWidth };
  return (
    <div className="space-y-2">
      <div
        className={`${compact ? "max-w-full" : "w-full"} relative mx-auto overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.03)]`}
        style={frameStyle}
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

function VideoWithTextOverlays({ src, textOverlays = [], mediaStyle = {}, autoPlay = false, onEnded }) {
  const [currentTime, setCurrentTime] = useState(0);
  return (
    <div className="relative h-full min-h-[12rem] w-full bg-black">
      <video
        src={src}
        controls
        autoPlay={autoPlay}
        playsInline
        className="h-full w-full bg-black"
        style={mediaStyle}
        onTimeUpdate={(event) => setCurrentTime(Number(event.currentTarget.currentTime) || 0)}
        onEnded={onEnded}
      />
      <TextOverlayLayer overlays={textOverlays} currentTime={currentTime} />
    </div>
  );
}

function TextOverlayLayer({ overlays = [], currentTime = 0, fallbackOverlay = null }) {
  const active = fallbackOverlay && fallbackOverlay.text
    ? [fallbackOverlay]
    : (Array.isArray(overlays) ? overlays : []).filter((overlay) => overlayActiveAt(overlay, currentTime));
  if (!active.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {active.map((overlay, index) => (
        <div
          key={overlay.id || `${overlay.text}-${index}`}
          className="absolute flex items-center justify-center"
          style={textOverlayBoxLayoutStyle(overlay)}
        >
          <span
            className="flex h-full w-full items-center justify-center overflow-hidden whitespace-pre-wrap break-words rounded-md px-3 py-1.5 text-center font-black"
            style={textOverlayStyle(overlay)}
          >
            {overlay.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function TextOverlayEditor({ take, frameUrl, timestampSeconds, clipDurationSeconds = 0, draft, disabled = false, onChange, onSave, onRemove, onApplyToTimeline }) {
  const frameRef = useRef(null);
  const textInputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [dragState, setDragState] = useState(null);
  const hasSavedOverlay = Boolean(draft?.id && textOverlaysForTake(take).some((overlay) => overlay.id === draft.id));
  const overlayBox = normalizeTextOverlayBox(draft);
  const frameAspectRatio = mediaSourceAspectRatio(take, "9 / 16");
  const selectedStyle = draft?.captionStyle || "classic";
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!dragState) return undefined;
    const handleMove = (event) => {
      const rect = frameRef.current?.getBoundingClientRect?.();
      if (!rect?.width || !rect?.height) return;
      const deltaX = ((event.clientX - dragState.startX) / rect.width) * 100;
      const deltaY = ((event.clientY - dragState.startY) / rect.height) * 100;
      if (dragState.mode === "resize") {
        onChangeRef.current?.({
          width: clampPercent(dragState.box.width + deltaX, dragState.box.width, 8, 100 - dragState.box.x),
          height: clampPercent(dragState.box.height + deltaY, dragState.box.height, 5, 100 - dragState.box.y),
        });
        return;
      }
      onChangeRef.current?.({
        x: clampPercent(dragState.box.x + deltaX, dragState.box.x, 0, 100 - dragState.box.width),
        y: clampPercent(dragState.box.y + deltaY, dragState.box.y, 0, 100 - dragState.box.height),
      });
    };
    const handleUp = () => setDragState(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState]);
  const startBoxDrag = (event, mode) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    setDragState({
      mode,
      startX: event.clientX,
      startY: event.clientY,
      box: normalizeTextOverlayBox(draft),
    });
  };
  const focusTextInput = () => {
    if (disabled) return;
    window.requestAnimationFrame(() => textInputRef.current?.focus?.());
  };
  return (
    <div className="rounded-lg border border-fuchsia-300/15 bg-fuchsia-400/[0.045] p-3">
      <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(18rem,1fr)_18rem] xl:items-start">
        <div ref={frameRef} className="relative mx-auto overflow-hidden rounded-lg border border-white/10 bg-black" style={frameEditorStageStyle(frameAspectRatio)}>
          <img src={frameUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div
            className="absolute z-20 flex items-stretch justify-stretch rounded-md border border-fuchsia-200/80 bg-black/20 shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
            style={textOverlayBoxLayoutStyle(draft)}
            onDoubleClick={focusTextInput}
          >
            {!disabled && (
              <button
                type="button"
                className="absolute left-1 top-1 z-30 flex h-6 touch-none items-center gap-1 rounded-md border border-fuchsia-100/70 bg-fuchsia-400/95 px-2 text-[10px] font-black uppercase tracking-normal text-white shadow-lg"
                onPointerDown={(event) => startBoxDrag(event, "move")}
                title="Drag text box"
              >
                <Move size={11} /> Move
              </button>
            )}
            <textarea
              ref={textInputRef}
              value={draft.text || ""}
              disabled={disabled}
              onChange={(event) => onChange?.({ text: event.target.value })}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              placeholder="Type here"
              rows={2}
              className="h-full w-full resize-none overflow-hidden rounded-md border-0 px-3 py-1.5 text-center font-black outline-none placeholder:text-white/70 disabled:opacity-70"
              style={textOverlayStyle(draft)}
            />
            {!disabled && (
              <span
                className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border border-fuchsia-100 bg-fuchsia-300 shadow-lg"
                onPointerDown={(event) => startBoxDrag(event, "resize")}
                title="Resize text box"
              />
            )}
          </div>
          <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-white/80">
            {timestampSeconds == null ? "Polished frame" : `Polished ${formatTimelineTime(timestampSeconds)}`}
          </span>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-fuchsia-100">
            <TypeIcon /> Frame Enhancements
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
            Drag the caption where it belongs. Save bakes it into the polished video; apply to timeline keeps the same style across the whole clip.
          </p>
          <textarea
            value={draft.text || ""}
            disabled={disabled}
            onChange={(event) => onChange?.({ text: event.target.value })}
            placeholder="Text to show on this frame"
            rows={2}
            className="mt-3 w-full rounded-md border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
          />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {CAPTION_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(applyCaptionStylePreset(draft, preset.id))}
                className={`rounded-md border px-2 py-2 text-[10px] font-black uppercase tracking-normal transition disabled:opacity-50 ${
                  selectedStyle === preset.id
                    ? "border-fuchsia-200 bg-fuchsia-300/20 text-white"
                    : "border-white/10 bg-black/20 text-slate-300 hover:border-fuchsia-200/40"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500">Text color</span>
              <input
                type="color"
                value={draft.color || "#ffffff"}
                disabled={disabled}
                onChange={(event) => onChange?.({ color: event.target.value })}
                className="h-9 w-full rounded-md border border-white/10 bg-black/25 p-1 disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500">Backplate</span>
              <input
                type="color"
                value={draft.backgroundColor || "#000000"}
                disabled={disabled}
                onChange={(event) => onChange?.({ backgroundColor: event.target.value })}
                className="h-9 w-full rounded-md border border-white/10 bg-black/25 p-1 disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500">Font</span>
              <select
                value={draft.fontFamily || "Inter"}
                disabled={disabled}
                onChange={(event) => onChange?.({ fontFamily: event.target.value })}
                className="h-9 w-full rounded-md border border-white/10 bg-black/25 px-2 text-[11px] font-bold text-white outline-none disabled:opacity-50"
              >
                {TEXT_OVERLAY_FONTS.map((font) => <option key={font} value={font} className="bg-slate-950">{font}</option>)}
              </select>
            </label>
            <NumberMiniInput label="Size" value={draft.fontSize || 28} min={14} max={72} disabled={disabled} onChange={(value) => onChange?.({ fontSize: value })} />
            <NumberMiniInput label="Backplate" value={Math.round((draft.backgroundOpacity ?? 0.28) * 100)} min={0} max={100} disabled={disabled} onChange={(value) => onChange?.({ backgroundOpacity: clampNumber(Number(value) / 100, 0.28, 0, 1) })} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <NumberMiniInput label="X" value={overlayBox.x} min={0} max={92} disabled={disabled} onChange={(value) => onChange?.({ x: clampPercent(value, overlayBox.x, 0, 100 - overlayBox.width) })} />
            <NumberMiniInput label="Y" value={overlayBox.y} min={0} max={92} disabled={disabled} onChange={(value) => onChange?.({ y: clampPercent(value, overlayBox.y, 0, 100 - overlayBox.height) })} />
            <NumberMiniInput label="Width" value={overlayBox.width} min={8} max={100 - overlayBox.x} disabled={disabled} onChange={(value) => onChange?.({ width: clampPercent(value, overlayBox.width, 8, 100 - overlayBox.x) })} />
            <NumberMiniInput label="Height" value={overlayBox.height} min={5} max={100 - overlayBox.y} disabled={disabled} onChange={(value) => onChange?.({ height: clampPercent(value, overlayBox.height, 5, 100 - overlayBox.y) })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !String(draft.text || "").trim()}
              onClick={onSave}
              className="creator-primary flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              <Check size={13} /> Save Text
            </button>
            <button
              type="button"
              disabled={disabled || !String(draft.text || "").trim() || !clipDurationSeconds}
              onClick={onApplyToTimeline}
              className="creator-control flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-fuchsia-100 disabled:opacity-50"
              title={clipDurationSeconds ? "Use this caption style across the full polished clip." : "Clip duration is not available yet."}
            >
              <Copy size={13} /> Apply to Timeline
            </button>
            {hasSavedOverlay && (
              <button
                type="button"
                disabled={disabled}
                onClick={onRemove}
                className="creator-control flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
              >
                <X size={13} /> Remove Text
              </button>
            )}
          </div>
        </div>
      </div>
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
  shotThumbnailUrl = "",
  finalVideoUrl = "",
  finalVideoVariantId = "",
  finalVideoVariant = null,
  activeVideoAssetId = "",
  textOverlays = [],
  textOverlaysBaked = false,
  selectedFrameTimestamp = null,
  onSelectFrame,
  onSelectPolishedFrame,
  onDeleteFrame,
  onSavePolishedVideoFrames,
  onGeneratePolishedVideoFrames,
}) {
  const [mediaElementDuration, setMediaElementDuration] = useState(0);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [playingSource, setPlayingSource] = useState("");
  const [rawTimelineOpen, setRawTimelineOpen] = useState(true);
  const [editedTimelineOpen, setEditedTimelineOpen] = useState(true);
  const [capturingPolishedFrame, setCapturingPolishedFrame] = useState(false);
  const [localPolishedFrames, setLocalPolishedFrames] = useState([]);
  const [polishedFrameStatus, setPolishedFrameStatus] = useState("");
  const rawMediaRef = useRef(null);
  const polishedMediaRef = useRef(null);
  const analysis = take?.mediaAnalysis || {};
  const video = analysis.video || {};
  const audio = analysis.audio || {};
  const frames = Array.isArray(video.frames) ? video.frames.filter((frame) => frame?.thumbnailDataUrl) : [];
  const savedPolishedVideo = analysis.polishedVideo && typeof analysis.polishedVideo === "object" ? analysis.polishedVideo : {};
  const activeFrameSourceAssetId = String(activeVideoAssetId || "").trim();
  const savedFrameSourceAssetId = String(savedPolishedVideo.sourceVideoAssetId || savedPolishedVideo.source_video_asset_id || "").trim();
  const savedFramesMatchActiveVariant = !finalVideoVariantId
    ? true
    : String(savedPolishedVideo.sourceVariantId || "") === String(finalVideoVariantId);
  const savedFramesMatchActiveSource = savedFramesMatchActiveVariant
    && (!activeFrameSourceAssetId || !savedFrameSourceAssetId || activeFrameSourceAssetId === savedFrameSourceAssetId);
  const savedPolishedFrames = savedFramesMatchActiveSource && Array.isArray(savedPolishedVideo.frames)
    ? savedPolishedVideo.frames.filter((frame) => frame?.thumbnailDataUrl)
    : [];
  const polishedFrames = savedPolishedFrames.length ? savedPolishedFrames : localPolishedFrames;
  const peaks = Array.isArray(audio.peaks) ? audio.peaks : [];
  const duration = Math.max(mediaTimelineDuration(take, video, audio, frames), mediaElementDuration);
  const frameSpec = shotFrameSpec(scene, take);
  const sourceAspectRatio = mediaSourceAspectRatio(take, frameSpec.aspectRatio);
  const selectedReferenceTimestamp = normalizedTimelineNumber(selectedFrameTimestamp, referenceFrameTimestampSeconds(take));
  const selectedReferenceFrame = selectedReferenceTimestamp == null
    ? null
    : frames.find((frame) => Math.abs(Number(frame.timestampSeconds || 0) - selectedReferenceTimestamp) < 0.18);
  const timelineAnchorFrame = selectedReferenceFrame || frames[0] || null;
  const nearestPolishedFrame = nearestTimelineFrame(polishedFrames, playheadSeconds) || polishedFrames[0] || null;
  const editedClipAspectRatio = mediaFrameAspectRatio(nearestPolishedFrame || timelineAnchorFrame, sourceAspectRatio || frameSpec.aspectRatio);
  const ticks = timelineTicks(duration);
  const frameCoverage = maxFrameTimestampSeconds(frames);
  const framesStopEarly = frames.length > 0 && duration > 0 && frameCoverage > 0 && duration - frameCoverage > 0.75;
  const enhancedAudioUrl = finalAudioUrlForTake(take, finalVideoVariant);
  const rawPlaybackUrl = take?.assetUrl || take?.publicUrl || "";
  const rawPlaybackType = String(take?.contentType || "").toLowerCase();
  const polishedPlaybackUrl = finalVideoUrl || "";
  const usingFinalVideo = Boolean(finalVideoUrl);
  const canPlayRaw = Boolean(rawPlaybackUrl) && (rawPlaybackType.startsWith("video/") || rawPlaybackType.startsWith("audio/"));
  const canPlayPolished = Boolean(polishedPlaybackUrl);
  const hasPolishClip = Boolean(timelinePreviewUrl || finalVideoUrl);
  const textOverlayCount = Array.isArray(textOverlays) ? textOverlays.filter((overlay) => overlay?.text).length : 0;
  const textRenderPending = textOverlayCount > 0 && !textOverlaysBaked;
  const polishedFrameFallbackUrl = usingFinalVideo
    ? nearestPolishedFrame?.thumbnailDataUrl || ""
    : timelinePreviewUrl
      || previewUrl
      || shotThumbnailUrl
      || timelineAnchorFrame?.thumbnailDataUrl
      || frames[0]?.thumbnailDataUrl
      || take?.referenceFrameUrl
      || "";
  const editedClipThumbnailUrl = usingFinalVideo
    ? nearestPolishedFrame?.thumbnailDataUrl || ""
    : timelinePreviewUrl || previewUrl || shotThumbnailUrl || polishedFrameFallbackUrl;
  const rawPlaybackLabel = "Raw Take";
  const metadataVideoUrl = polishedPlaybackUrl || (rawPlaybackType.startsWith("video/") ? rawPlaybackUrl : "");
  const playheadPercent = duration > 0 ? Math.max(0, Math.min(100, (playheadSeconds / duration) * 100)) : 0;
  useEffect(() => {
    if (hasPolishClip) setEditedTimelineOpen(true);
  }, [hasPolishClip]);
  useEffect(() => {
    setLocalPolishedFrames([]);
    setPolishedFrameStatus("");
  }, [take?.takeId, finalVideoUrl]);
  useEffect(() => {
    if (!finalVideoUrl || savedPolishedFrames.length || localPolishedFrames.length || ["loading", "error", "empty"].includes(polishedFrameStatus)) {
      return undefined;
    }
    let cancelled = false;
    setPolishedFrameStatus("loading");
    const runExtraction = async () => {
      const backendResponse = await onGeneratePolishedVideoFrames?.({
        variantId: finalVideoVariantId,
        sampleCount: 10,
        persist: true,
      });
      const backendAnalysis = backendResponse?.mediaAnalysis?.polishedVideo;
      const backendFrames = Array.isArray(backendAnalysis?.frames) ? backendAnalysis.frames : [];
      if (backendFrames.length) {
        return {
          ...backendAnalysis,
          frames: backendFrames,
          source: backendAnalysis?.source || "backend_ffmpeg",
        };
      }
      return extractPolishedVideoFrameTimeline(finalVideoUrl, take?.shotNumber || scene?.shotNumber || 0, 10);
    };
    runExtraction()
      .then((polishedVideoAnalysis) => {
        if (cancelled) return;
        const nextFrames = Array.isArray(polishedVideoAnalysis.frames) ? polishedVideoAnalysis.frames : [];
        setLocalPolishedFrames(nextFrames);
        setPolishedFrameStatus(nextFrames.length ? "ready" : "empty");
        if (nextFrames.length && polishedVideoAnalysis.source !== "backend_ffmpeg") {
          onSavePolishedVideoFrames?.(polishedVideoAnalysis);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[creator] polished video frame extraction failed", error);
        setPolishedFrameStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [finalVideoUrl, finalVideoVariantId, localPolishedFrames.length, onGeneratePolishedVideoFrames, onSavePolishedVideoFrames, polishedFrameStatus, savedPolishedFrames.length, scene?.shotNumber, take?.shotNumber, take?.takeId]);
  useEffect(() => {
    if (!metadataVideoUrl) {
      setMediaElementDuration(0);
      return undefined;
    }
    let cancelled = false;
    const element = document.createElement("video");
    element.preload = "metadata";
    element.src = metadataVideoUrl;
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
  }, [metadataVideoUrl]);
  useEffect(() => {
    setPlayheadSeconds(0);
    setPlayingSource("");
    rawMediaRef.current?.pause?.();
    polishedMediaRef.current?.pause?.();
  }, [take?.takeId, rawPlaybackUrl, polishedPlaybackUrl]);
  const seekTimeline = (seconds) => {
    const next = Math.max(0, Math.min(duration, Number(seconds) || 0));
    setPlayheadSeconds(roundTimelineValue(next));
    [rawMediaRef.current, polishedMediaRef.current].forEach((element) => {
      if (element) element.currentTime = next;
    });
  };
  const toggleTimelinePlayback = async (source) => {
    const element = source === "polished" ? polishedMediaRef.current : rawMediaRef.current;
    if (!element || disabled) return;
    if (!element.paused) {
      element.pause();
      setPlayingSource("");
      return;
    }
    const other = source === "polished" ? rawMediaRef.current : polishedMediaRef.current;
    other?.pause?.();
    element.currentTime = Math.max(0, Math.min(playheadSeconds, duration));
    try {
      await element.play?.();
      setPlayingSource(source);
    } catch {
      setPlayingSource("");
    }
  };
  const updatePlayheadFromMedia = (event) => {
    const seconds = Number(event.currentTarget.currentTime);
    if (Number.isFinite(seconds)) {
      setPlayheadSeconds(roundTimelineValue(Math.max(0, Math.min(duration, seconds))));
    }
  };
  const selectPolishedFrameAtPlayhead = async () => {
    if ((!canPlayPolished && !polishedFrameFallbackUrl && !nearestPolishedFrame?.thumbnailDataUrl) || disabled || capturingPolishedFrame) return;
    setCapturingPolishedFrame(true);
    try {
      const timelineFrame = nearestPolishedFrame?.thumbnailDataUrl
        ? {
            ...nearestPolishedFrame,
            timestampSeconds: nearestPolishedFrame.timestampSeconds ?? playheadSeconds,
          }
        : null;
      const capturedFrame = !timelineFrame && canPlayPolished
        ? await captureVideoElementFrame(polishedMediaRef.current, playheadSeconds, polishedFrameFallbackUrl)
        : null;
      const frame = timelineFrame?.thumbnailDataUrl
        ? timelineFrame
        : capturedFrame?.thumbnailDataUrl
        ? capturedFrame
        : polishedFrameFallbackUrl
          ? {
              thumbnailDataUrl: polishedFrameFallbackUrl,
              timestampSeconds: roundTimelineValue(playheadSeconds),
              aspectRatio: editedClipAspectRatio || sourceAspectRatio || frameSpec.aspectRatio,
            }
          : null;
      if (!frame?.thumbnailDataUrl) return;
      onSelectPolishedFrame?.({
        ...frame,
        timestampSeconds: frame.timestampSeconds ?? playheadSeconds,
        source: timelineFrame ? "polished_video_frame" : canPlayPolished ? "polished_timeline" : "polished_frame",
      });
    } finally {
      setCapturingPolishedFrame(false);
    }
  };
  if (!frames.length && !peaks.length && !canPlayRaw && !canPlayPolished) {
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
            disabled={disabled || !canPlayRaw}
            onClick={() => toggleTimelinePlayback("raw")}
            className="creator-control flex h-8 items-center gap-2 px-3 text-[10px] font-black uppercase tracking-normal text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="Play the uploaded take from the current playhead."
          >
            {playingSource === "raw" ? <Pause size={12} /> : <Play size={12} />}
            {playingSource === "raw" ? "Pause" : rawPlaybackLabel}
          </button>
          <button
            type="button"
            disabled={disabled || !canPlayPolished}
            onClick={() => toggleTimelinePlayback("polished")}
            className={`creator-control flex h-8 items-center gap-2 px-3 text-[10px] font-black uppercase tracking-normal text-slate-200 disabled:cursor-not-allowed disabled:opacity-60 ${!canPlayPolished ? "animate-pulse border-violet-300/25 text-violet-100" : ""}`}
            title={canPlayPolished ? "Play polished video from the current playhead." : "Polish the video first to enable polished playback."}
          >
            {playingSource === "polished" ? <Pause size={12} /> : <Play size={12} />}
            {playingSource === "polished" ? "Pause" : canPlayPolished ? "Polished" : "Polish First"}
          </button>
          {hasPolishClip && (
            <button
              type="button"
              disabled={disabled || capturingPolishedFrame || (!canPlayPolished && !polishedFrameFallbackUrl)}
              onClick={selectPolishedFrameAtPlayhead}
              className="creator-control flex h-8 items-center gap-2 px-3 text-[10px] font-black uppercase tracking-normal text-fuchsia-100 disabled:cursor-wait disabled:opacity-60"
              title="Open the current polished frame editor."
            >
              {capturingPolishedFrame ? <RefreshCw size={12} className="animate-spin" /> : <TypeIcon />}
              <span className="whitespace-nowrap">Edit Frame</span>
            </button>
          )}
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
        Raw playback: uploaded take audio - Polished playback: {canPlayPolished ? (enhancedAudioUrl ? "video plus enhanced audio" : "video plus original audio") : "polish pending"}
      </p>
      {textRenderPending && (
        <p className="mt-2 rounded-md border border-fuchsia-300/15 bg-fuchsia-400/[0.055] px-2 py-1 text-[11px] font-bold text-fuchsia-100">
          Caption saved. Render the final MP4 to bake it into the polished video and timeline frames.
        </p>
      )}

      <div className="mt-3 space-y-2">
        <TimelineCollapseHeader
          label="Edited / Polished Timeline"
          open={editedTimelineOpen}
          active={hasPolishClip}
          count={usingFinalVideo ? polishedFrames.length : hasPolishClip ? 1 : 0}
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
                      {usingFinalVideo && polishedFrames.length > 0 ? (
                        polishedFrames.map((frame) => {
                          const frameTimestamp = Number(frame.timestampSeconds || 0);
                          const active = Math.abs(frameTimestamp - playheadSeconds) < 0.18;
                          return (
                            <button
                              key={`polished-${frame.index ?? frameTimestamp}`}
                              type="button"
                              disabled={disabled || capturingPolishedFrame}
                              onClick={() => {
                                seekTimeline(frameTimestamp);
                                onSelectPolishedFrame?.({
                                  ...frame,
                                  timestampSeconds: frameTimestamp,
                                  source: "polished_video_frame",
                                });
                              }}
                              className={`group relative z-10 h-24 shrink-0 overflow-hidden rounded-md border bg-emerald-400/[0.08] text-left transition hover:border-emerald-200/70 disabled:cursor-not-allowed disabled:opacity-60 ${
                                active ? "border-emerald-200/80 shadow-[0_0_0_1px_rgba(110,231,183,0.55)]" : "border-emerald-300/25"
                              }`}
                              style={{ aspectRatio: mediaFrameAspectRatio(frame, editedClipAspectRatio) }}
                              title={`Open polished frame at ${formatTimelineTime(frameTimestamp)}`}
                            >
                              <img
                                src={frame.thumbnailDataUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full opacity-95 transition group-hover:scale-[1.02]"
                                style={{ objectFit: "cover", objectPosition: "center center" }}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/20" />
                              <span className="absolute left-2 top-2 rounded bg-emerald-300 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-slate-950">
                                Frame
                              </span>
                              <span className="absolute bottom-2 left-2 right-2 truncate rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white/85">
                                {formatTimelineTime(frameTimestamp)}
                              </span>
                              {active && <span className="pointer-events-none absolute inset-0 border-2 border-emerald-200" />}
                            </button>
                          );
                        })
                      ) : usingFinalVideo ? (
                        <div className="relative z-10 grid h-24 min-w-[14rem] place-items-center rounded-md border border-dashed border-emerald-300/20 bg-emerald-400/[0.055] px-4 text-center text-[10px] font-black uppercase tracking-normal text-emerald-100">
                          {polishedFrameStatus === "loading" ? (
                            <span className="flex items-center gap-2"><RefreshCw size={13} className="animate-spin" /> Extracting polished frames</span>
                          ) : polishedFrameStatus === "error" ? (
                            <span>Polished frame extraction failed</span>
                          ) : (
                            <span>Polished frames pending</span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={disabled || capturingPolishedFrame}
                          onClick={selectPolishedFrameAtPlayhead}
                          className="group relative z-10 h-24 shrink-0 overflow-hidden rounded-md border border-cyan-300/25 bg-cyan-400/[0.08] text-left transition hover:border-cyan-200/70 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ aspectRatio: editedClipAspectRatio }}
                          title="Open this edited frame for text and frame-level edits."
                        >
                          {editedClipThumbnailUrl ? (
                            <img
                              src={editedClipThumbnailUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full opacity-90 transition group-hover:scale-[1.01]"
                              style={{ objectFit: "cover", objectPosition: frameSpec.objectPosition }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center bg-black/55 text-center text-[10px] font-bold uppercase tracking-normal text-slate-500">
                              <span>
                                <ImageIcon size={18} className="mx-auto mb-1 text-slate-600" />
                                Edited frame
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/35" />
                          <span className="absolute left-2 top-2 rounded bg-cyan-300 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-slate-950">
                            <span className="block max-w-[5.5rem] truncate whitespace-nowrap">
                              {capturingPolishedFrame ? "Opening..." : "Edit frame"}
                            </span>
                          </span>
                          <span className="absolute bottom-2 left-2 right-2 truncate rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white/85">
                            Frame 01
                          </span>
                        </button>
                      )}
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
                              title={`Use raw frame as polish anchor at ${formatTimelineTime(frame.timestampSeconds)}`}
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
                                {isSaving ? "Saving" : isDeleting ? "Deleting" : "Anchor"}
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
      {canPlayRaw && rawPlaybackType.startsWith("video/") ? (
        <video
          ref={rawMediaRef}
          src={rawPlaybackUrl}
          className="hidden"
          preload="metadata"
          playsInline
          onLoadedMetadata={(event) => {
            const seconds = Number(event.currentTarget.duration);
            if (Number.isFinite(seconds) && seconds > 0) setMediaElementDuration(roundTimelineValue(seconds));
          }}
          onTimeUpdate={updatePlayheadFromMedia}
          onPlay={() => setPlayingSource("raw")}
          onPause={() => setPlayingSource((current) => current === "raw" ? "" : current)}
          onEnded={() => setPlayingSource((current) => current === "raw" ? "" : current)}
        />
      ) : canPlayRaw ? (
        <audio
          ref={rawMediaRef}
          src={rawPlaybackUrl}
          className="hidden"
          preload="metadata"
          onLoadedMetadata={(event) => {
            const seconds = Number(event.currentTarget.duration);
            if (Number.isFinite(seconds) && seconds > 0) setMediaElementDuration(roundTimelineValue(seconds));
          }}
          onTimeUpdate={updatePlayheadFromMedia}
          onPlay={() => setPlayingSource("raw")}
          onPause={() => setPlayingSource((current) => current === "raw" ? "" : current)}
          onEnded={() => setPlayingSource((current) => current === "raw" ? "" : current)}
        />
      ) : null}
      {canPlayPolished && (
        <video
          ref={polishedMediaRef}
          src={polishedPlaybackUrl}
          className="hidden"
          crossOrigin="anonymous"
          preload="metadata"
          playsInline
          onLoadedMetadata={(event) => {
            const seconds = Number(event.currentTarget.duration);
            if (Number.isFinite(seconds) && seconds > 0) setMediaElementDuration(roundTimelineValue(seconds));
          }}
          onTimeUpdate={updatePlayheadFromMedia}
          onPlay={() => setPlayingSource("polished")}
          onPause={() => setPlayingSource((current) => current === "polished" ? "" : current)}
          onEnded={() => setPlayingSource((current) => current === "polished" ? "" : current)}
        />
      )}
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

function stableRunwaySeed(value = "studio-polish") {
  const text = String(value || "studio-polish");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
