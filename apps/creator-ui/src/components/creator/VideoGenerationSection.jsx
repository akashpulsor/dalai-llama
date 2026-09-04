// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Clapperboard } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useApproveVideoGenJobMutation,
  useDispatchShotMutation,
  useGetProjectConfigQuery,
  useLazyGetVideoGenPromptQuery,
  useListCloningModelsQuery,
  useListPreProductionShotsQuery,
  useListVideoFeatureFlagsQuery,
  useListVideoModelsQuery,
  useRejectVideoGenJobMutation,
  useUpdateProjectConfigMutation,
} from "../../api/creatorEndpoints.js";
import ShotVideoCard from "./ShotVideoCard.jsx";

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
  const { data: cloningModels = [] } = useListCloningModelsQuery();
  const { data: videoModels = [] } = useListVideoModelsQuery();
  const [updateProjectConfig] = useUpdateProjectConfigMutation();
  const [openShotId, setOpenShotId] = useState(null);
  const [preparing, setPreparing] = useState({});
  const [prepared, setPrepared] = useState({}); // shotId -> ShotDispatchResponse
  const [videos, setVideos] = useState({}); // shotId -> VideoGenJobView
  const [flagOverrides, setFlagOverrides] = useState({}); // flagKey -> boolean, undefined = use project default

  const [dispatchShot] = useDispatchShotMutation();
  const [fetchPrompt] = useLazyGetVideoGenPromptQuery();
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
    shots
      .filter((shot) => shot.shotType !== "MOTION_GRAPHIC")
      .forEach((shot) => {
        if (!prepared[shot.id]) handlePrepare(shot.id);
      });
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
        <button
          type="button"
          onClick={handleGenerateAll}
          className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-purple-400/30"
        >
          <Clapperboard size={13} />
          Prepare all shots
        </button>
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

      {cloningModels.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            Voice clone model for auto-dub
          </span>
          <select
            value={projectConfig?.preferredVoiceModel || ""}
            onChange={(event) => updateProjectConfig({ projectId, preferredVoiceModel: event.target.value || null })}
            className="creator-input px-2.5 py-1.5 text-[11px] font-semibold"
          >
            <option value="">Default</option>
            {cloningModels.map((m) => (
              <option key={m.modelId} value={m.modelId}>{m.modelId}</option>
            ))}
          </select>
          <span className="text-[10px] font-medium text-slate-500">
            Applies to beat-timed auto-dub on shots prepared after this change.
          </span>
        </div>
      )}

      {videoModels.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            Video model
          </span>
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
          <span className="text-[10px] font-medium text-slate-500">
            Overrides the auto-recommended model for shots prepared after this change.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shots.map((shot) => (
          <ShotVideoCard
            key={shot.id}
            shot={shot}
            isOpen={openShotId === shot.id}
            onToggle={() => setOpenShotId(openShotId === shot.id ? null : shot.id)}
            info={prepared[shot.id]}
            busy={preparing[shot.id]}
            video={videos[shot.id]}
            onPrepare={() => handlePrepare(shot.id)}
            onApprove={() => handleApprove(shot.id)}
            onReject={() => handleReject(shot.id)}
          />
        ))}
      </div>
    </div>
  );
}
