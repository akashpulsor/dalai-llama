// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Clapperboard, Loader2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useApproveVideoGenJobMutation,
  useCloneProjectVoicesMutation,
  useDispatchShotMutation,
  useGetProjectConfigQuery,
  useLazyGetVideoGenPromptQuery,
  useListPreProductionShotsQuery,
  useListVideoFeatureFlagsQuery,
  useListVideoModelsQuery,
  useRejectVideoGenJobMutation,
  useUpdateProjectConfigMutation,
} from "../../api/creatorEndpoints.js";
import ShotVideoCard from "./ShotVideoCard.jsx";

const dialogueTextForShot = (shot) => (
  shot?.voiceOver || (shot?.shotType === "DIALOGUE" ? shot?.scriptLine : "") || ""
).trim();

/**
 * Video generation, the stage after shots/images: per shot, build the prompt (assemble +
 * mandatory pre-flight critique on pre-production-service's side, autoApprove=false so nothing
 * spends yet), show the model video-generation-service recommended + why + the exact prompt text,
 * then approve (dispatches for real, blocks until the clip is ready) or reject. "Generate all"
 * just loops this per shot -- video-generation-service has no real multi-shot stitching yet, so
 * the result is a gallery of independently playable clips, not one combined video.
 */
export default function VideoGenerationSection({ projectId }) {
  const dispatch = useDispatch();
  const { data: shots = [] } = useListPreProductionShotsQuery(projectId, { skip: !projectId });
  const { data: featureFlags = [] } = useListVideoFeatureFlagsQuery();
  const { data: projectConfig } = useGetProjectConfigQuery(projectId, { skip: !projectId });
  const { data: videoModels = [] } = useListVideoModelsQuery();
  const [updateProjectConfig] = useUpdateProjectConfigMutation();
  const [openShotId, setOpenShotId] = useState(null);
  const [preparing, setPreparing] = useState({});
  const [prepared, setPrepared] = useState({}); // shotId -> ShotDispatchResponse
  const [videos, setVideos] = useState({}); // shotId -> VideoGenJobView
  const [flagOverrides, setFlagOverrides] = useState({}); // flagKey -> boolean, undefined = use project default
  const [preparingDialogues, setPreparingDialogues] = useState(false);
  const [dubbedVoices, setDubbedVoices] = useState({}); // shotId -> CloneVoiceResult

  const [dispatchShot] = useDispatchShotMutation();
  const [fetchPrompt] = useLazyGetVideoGenPromptQuery();
  const [cloneProjectVoices] = useCloneProjectVoicesMutation();
  const [approveJob] = useApproveVideoGenJobMutation();
  const [rejectJob] = useRejectVideoGenJobMutation();

  const handlePrepare = async (shotId) => {
    setPreparing((s) => ({ ...s, [shotId]: true }));
    setOpenShotId(shotId);
    try {
      const response = await dispatchShot({
        shotId,
        autoApprove: false,
        dialogue: flagOverrides.dialogue,
        captions: flagOverrides.captions,
      }).unwrap();
      if (response.critiqueVerdict === "NEEDS_HUMAN_REVIEW") {
        dispatch(showFlash({ message: "Pre-flight critique flagged issues with this shot's plan — see findings below", type: "error" }));
        setPrepared((p) => ({ ...p, [shotId]: response }));
        return;
      }
      let promptView = null;
      if (response.externalPromptId) {
        promptView = await fetchPrompt(response.externalPromptId).unwrap();
      }
      setPrepared((p) => ({ ...p, [shotId]: { ...response, prompt: promptView } }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not prepare this shot", type: "error" }));
    } finally {
      setPreparing((s) => ({ ...s, [shotId]: false }));
    }
  };

  const handleApprove = async (shotId) => {
    const info = prepared[shotId];
    if (!info?.externalJobId) return;
    setPreparing((s) => ({ ...s, [shotId]: true }));
    try {
      const job = await approveJob(info.externalJobId).unwrap();
      setVideos((v) => ({ ...v, [shotId]: job }));
      if (job.status === "COMPLETED") {
        dispatch(showFlash({ message: "Video ready", type: "success" }));
      } else if (job.status === "FAILED") {
        dispatch(showFlash({ message: "Generation failed", type: "error" }));
      }
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate this video — it may take a few minutes, try again", type: "error" }));
    } finally {
      setPreparing((s) => ({ ...s, [shotId]: false }));
    }
  };

  const handleReject = async (shotId) => {
    const info = prepared[shotId];
    if (!info?.externalJobId) return;
    try {
      await rejectJob({ jobId: info.externalJobId }).unwrap();
      setPrepared((p) => {
        const next = { ...p };
        delete next[shotId];
        return next;
      });
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not reject this", type: "error" }));
    }
  };

  const handleGenerateAll = () => {
    // MOTION_GRAPHIC shots dispatch too now -- MotionGraphicShotContextAssemblyStrategy attaches
    // the shot's own MOTION_GRAPHIC image as the reference frame, so Wan/Seedance treat it as the
    // input for image-to-video (animating the actual designed graphic rather than making up its
    // own interpretation of the animation notes). Filtering them out here would leave MG shots
    // out of "Generate all" and force per-shot manual prepare, defeating the batch action.
    shots.forEach((shot) => {
      if (!prepared[shot.id]) handlePrepare(shot.id);
    });
  };

  const dialogueShots = shots.filter((shot) => dialogueTextForShot(shot));

  const handlePrepareAllDialogues = async () => {
    if (preparingDialogues || !dialogueShots.length) return;
    setPreparingDialogues(true);
    try {
      // CloneVoiceService resolves every shot's cast identity and generates the individual
      // dialogue clones server-side. One project request keeps the frontend independent of the
      // number of shots and uses the same clone/TTS path as the per-shot Test voice control.
      const clones = await cloneProjectVoices({ projectId }).unwrap();
      const cloneCount = Array.isArray(clones) ? clones.length : dialogueShots.length;
      // Keep every dubbed clip around keyed by shot -- without this the audio CloneVoiceService
      // just generated was thrown away the moment this promise resolved, leaving no way to hear
      // or even see which shots got dubbed short of hitting Test voice again per shot.
      if (Array.isArray(clones)) {
        setDubbedVoices((v) => {
          const next = { ...v };
          clones.forEach((clone) => { if (clone.shotId) next[clone.shotId] = clone; });
          return next;
        });
      }
      dispatch(showFlash({
        message: `${cloneCount} dialogue ${cloneCount === 1 ? "clone is" : "clones are"} ready for review.`,
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || "Could not prepare dialogue clones for this project.",
        type: "error",
      }));
    } finally {
      setPreparingDialogues(false);
    }
  };

  if (!shots?.length) return null;

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Video generation</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Prepare each shot to see the suggested model and exact prompt before anything generates — approve to spend and render.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateAll}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-purple-400/30"
          >
            <Clapperboard size={13} />
            Prepare all shots
          </button>
          <button
            type="button"
            onClick={handlePrepareAllDialogues}
            disabled={preparingDialogues || !dialogueShots.length}
            title={!dialogueShots.length ? "Add a spoken line to prepare dialogue." : "Clone every shot's dialogue using its assigned voice; rendering still requires approval."}
            className="flex items-center gap-1.5 rounded-md border border-purple-400/25 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-200 hover:border-purple-400/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preparingDialogues ? <Loader2 size={13} className="animate-spin" /> : <AudioLines size={13} />}
            {preparingDialogues ? "Preparing dialogues" : "Prepare all dialogues"}
          </button>
        </div>
      </div>

      {featureFlags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Flags for the next shot(s) prepared</span>
          {featureFlags.map((flag) => {
            const enabled = flagOverrides[flag.flagKey] ?? flag.defaultEnabled;
            return (
              <label key={flag.flagKey} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300" title={flag.description}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setFlagOverrides((f) => ({ ...f, [flag.flagKey]: event.target.checked }))}
                />
                {flag.label}
              </label>
            );
          })}
        </div>
      )}

      {/* Voice clone / TTS model dropdowns removed: only one active model per type after V85
       * (elevenlabs/instant-voice-clone + elevenlabs-tts-v1) and the path between them is
       * derived from per-character identity flow -- an actor voice sample uploaded means
       * clone-then-TTS, an AI-generated identity with a built-in voice picked means direct TTS.
       * BeatDubbingService already routes on that. What's left here is the two real creator
       * choices: which video model runs the render, and at what resolution. */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        {videoModels.length > 0 && (
          <label className="flex items-center gap-2" title="Overrides the auto-recommended model for shots prepared after this change.">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Video model</span>
            <select
              value={projectConfig?.preferredVideoModel || ""}
              onChange={(event) => updateProjectConfig({ projectId, preferredVideoModel: event.target.value || null })}
              className="creator-input px-2.5 py-1.5 text-[11px] font-semibold"
            >
              <option value="">Recommended</option>
              {videoModels.map((m) => (
                <option key={m.modelId} value={m.modelId}>{m.modelId}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2" title="Applies to every shot; per-shot override in the prepare-scene panel still wins when set.">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Resolution</span>
          <select
            value={projectConfig?.preferredResolution || ""}
            onChange={(event) => updateProjectConfig({ projectId, preferredResolution: event.target.value || "" })}
            className="creator-input px-2.5 py-1.5 text-[11px] font-semibold"
          >
            <option value="">Provider default</option>
            <option value="480p">480p (cheapest)</option>
            <option value="720p">720p</option>
          </select>
        </label>

        <p className="text-[10px] font-medium text-slate-500">
          Voice: ElevenLabs — cloned automatically when a character has an uploaded actor sample, otherwise direct TTS with the built-in voice you picked in Cast.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shots.map((shot) => (
          <ShotVideoCard
            key={shot.id}
            shot={shot}
            projectId={projectId}
            isOpen={openShotId === shot.id}
            onToggle={() => setOpenShotId(openShotId === shot.id ? null : shot.id)}
            info={prepared[shot.id]}
            busy={preparing[shot.id]}
            video={videos[shot.id]}
            dubbed={dubbedVoices[shot.id]}
            onPrepare={() => handlePrepare(shot.id)}
            onApprove={() => handleApprove(shot.id)}
            onReject={() => handleReject(shot.id)}
          />
        ))}
      </div>
    </div>
  );
}
