// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Clapperboard, Layers, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { showFlash } from "@dalaillama/shared-store";
import {
  useApproveVideoGenJobMutation,
  useCloneProjectVoicesMutation,
  useGetClonedVoiceAudioQuery,
  useGetProjectConfigQuery,
  useListPreProductionShotsQuery,
  useGetPrepareBatchStatusQuery,
  useListProjectShotPromptsQuery,
  useListVideoFeatureFlagsQuery,
  useListVideoModelsQuery,
  usePrepareShotSceneMutation,
  usePrepareShotScenesBatchMutation,
  useRejectVideoGenJobMutation,
  useListProjectShotVideosQuery,
  useLazyGetVideoGenJobQuery,
  useUpdateProjectConfigMutation,
  useUpdateShotScenePromptMutation,
} from "../../api/creatorEndpoints.js";
import ShotVideoCard from "./ShotVideoCard.jsx";

const dialogueTextForShot = (shot) => (
  shot?.voiceOver || (shot?.shotType === "DIALOGUE" ? shot?.scriptLine : "") || ""
).trim();

/**
 * Video generation, the stage after shots/images: per shot, build the prompt (assemble +
 * recommend/resolve a model, no spend yet) via video-generation-service's own prepare-scene
 * flow, show the model + estimated cost + the exact prompt text, then approve (dispatches for
 * real, blocks until the clip is ready) or reject. Pre-production-service's old per-shot dispatch
 * path (with its own mandatory pre-flight critique) is retired -- video-generation-service now
 * owns prepare end to end, same as CloneVoiceService owns the voice-clone path. "Prepare all
 * shots" calls the batch endpoint once for the whole project instead of looping per shot.
 */
/** A presigned URL without its signature, which is the part that changes on every fetch. Two URLs
 * with the same path are the same stored clip however differently they are signed. Falls back to
 * the whole string for anything unparseable -- a URL we cannot read is one we should not claim is
 * unchanged. */
function objectPath(url) {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

export default function VideoGenerationSection({ projectId }) {
  const dispatch = useDispatch();
  const { data: shots = [] } = useListPreProductionShotsQuery(projectId, { skip: !projectId });
  const { data: featureFlags = [] } = useListVideoFeatureFlagsQuery();
  const { data: projectConfig } = useGetProjectConfigQuery(projectId, { skip: !projectId });
  const { data: videoModels = [] } = useListVideoModelsQuery();
  // True from the moment a batch is accepted until the project's preparation status leaves
  // PREPARING. Drives the polling below, not just the button label.
  const [batchRunning, setBatchRunning] = useState(false);
  // Which batch the progress UI is following. Without it, the status already cached from the
  // PREVIOUS batch (SUCCEEDED) is what the terminal-status effect sees the instant a new batch
  // starts, so it ends the run before the first poll of the new one has even returned -- the
  // progress count never appears and the spinners clear immediately.
  const [activeBatchJobId, setActiveBatchJobId] = useState(null);
  // Prepared prompts are persisted per shot, so a page reload can show what was already built
  // instead of every card reverting to "not prepared yet" and inviting the creator to pay to
  // rebuild a prompt that is sitting in the database.
  // Polled while a batch runs so prompts appear card by card as the server commits them, then
  // left alone -- there is nothing to watch for once the batch is done.
  const { data: savedPrompts = [] } = useListProjectShotPromptsQuery(projectId, {
    skip: !projectId,
    pollingInterval: batchRunning ? 4000 : 0,
  });
  // The batch's own job row, not the project's scene-preparation flag: it distinguishes "never
  // run" from "finished", and carries the prepared/failed counts to report at the end.
  // Queried on load, not just while this tab started a batch: the job is durable server-side, so
  // reloading the page (or opening it elsewhere) mid-batch should pick the run back up rather
  // than show a project that looks idle while shots are still being prepared. 404 -- the project
  // has never had a batch -- reads as undefined, which is the idle case anyway.
  const { data: batchStatus } = useGetPrepareBatchStatusQuery(projectId, {
    skip: !projectId,
    pollingInterval: batchRunning ? 4000 : 0,
  });
  const [updateProjectConfig] = useUpdateProjectConfigMutation();
  const [openShotId, setOpenShotId] = useState(null);
  const [preparing, setPreparing] = useState({});
  const [prepared, setPrepared] = useState({}); // shotId -> toCardInfo(ShotPromptView)
  // Shots the creator has asked to generate again. A shot with a finished clip normally offers no
  // Approve -- there is nothing to approve -- but one being regenerated has a fresh prompt that has
  // not been rendered yet, and that does.
  const [regenerating, setRegenerating] = useState({});
  const [videos, setVideos] = useState({}); // shotId -> VideoGenJobView

  // Seed from what the server already has. This used to start empty and fill only when you
  // pressed Approve in this session, so a shot generated earlier -- or generated by an
  // approve whose request timed out while the render carried on -- came back looking like it
  // had never run. The clip existed and was paid for; the page just never asked for it, and
  // the obvious reaction to a shot that looks ungenerated is to generate it again.
  const { data: existingShotVideos = [], refetch: refetchShotVideos } = useListProjectShotVideosQuery(projectId, { skip: !projectId });
  useEffect(() => {
    if (!existingShotVideos.length) return;
    setVideos((current) => {
      const next = { ...current };
      existingShotVideos.forEach((clip) => {
        if (!clip?.shotId || !clip?.videoUrl) return;
        const local = next[clip.shotId];
        // Once a shot had a clip, this list could never update it again. The guard was there to
        // stop a list fetched mid-render from clobbering a job this session was watching, but it
        // also froze the player on whatever URL it first saw -- and a repair rewrites the output
        // behind the SAME job id. Silencing a clip reported success and went on playing the voice
        // it had just removed; replacing the audio, extending the tail and uploading a finished
        // clip all did the same, until a full page reload.
        //
        // What actually needs protecting is only the first case, so protect only that: a locally
        // tracked shot with no output yet is a render in flight and the list knows nothing about
        // it. Anything else, the server is authoritative.
        if (local && !local.outputUri) return;
        // Presigned URLs are re-signed on every fetch, so the same clip comes back under a new
        // query string each time and swapping it in would make the player reload on every poll.
        // The object path is what actually identifies the clip, and a repair always writes a new
        // object -- so compare paths, and keep the URL already in hand when they match.
        const sameClip = local?.outputUri && objectPath(local.outputUri) === objectPath(clip.videoUrl);
        next[clip.shotId] = {
          jobId: clip.jobId,
          shotRef: clip.shotRef,
          status: clip.status,
          approvalStatus: clip.approvalStatus,
          outputUri: sameClip ? local.outputUri : clip.videoUrl,
        };
      });
      return next;
    });
  }, [existingShotVideos]);
  const [flagOverrides, setFlagOverrides] = useState({}); // flagKey -> boolean, undefined = use project default
  const [preparingDialogues, setPreparingDialogues] = useState(false);
  // Empty = "every shot", which is exactly what the batch endpoint does with an empty shotIds --
  // no need to enumerate ids the server already has in its bundle. Ticking boxes narrows it.
  const [selectedShotIds, setSelectedShotIds] = useState([]);
  const { currentData: savedAudio = [], isError: audioLoadFailed, refetch: reloadAudio } = useGetClonedVoiceAudioQuery(projectId, {
    skip: !projectId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 45 * 60 * 1000,
  });
  const dubbedVoices = Object.fromEntries(savedAudio.map((audio) => [audio.shotId, audio]));

  // The film's running length against what the client agreed. Every per-shot decision to give a shot
  // more seconds is individually reasonable and collectively how a sixty second ad becomes ninety --
  // which the client did not buy. Shown once, above the grid, where the accumulation is visible.
  const plannedTotal = shots.reduce((sum, shot) => sum + (Number(shot?.durationSeconds) || 0), 0);
  const targetTotal = Number(projectConfig?.targetDurationSeconds) || 0;
  // Two seconds of drift is rounding, not a problem -- shot lengths are whole seconds and the breath
  // after a line pushes several of them up by one. Past that it is the film getting longer than the
  // one that was sold, a second at a time, each step individually reasonable.
  const RUNNING_LENGTH_TOLERANCE_SECONDS = 2;
  const overBudget = targetTotal > 0 && plannedTotal > targetTotal + RUNNING_LENGTH_TOLERANCE_SECONDS;

  const [prepareShotScene] = usePrepareShotSceneMutation();
  const [prepareShotScenesBatch] = usePrepareShotScenesBatchMutation();
  const [updateShotPrompt] = useUpdateShotScenePromptMutation();
  const [cloneProjectVoices] = useCloneProjectVoicesMutation();
  const [approveJob] = useApproveVideoGenJobMutation();
  const [rejectJob] = useRejectVideoGenJobMutation();
  const [triggerGetVideoGenJob] = useLazyGetVideoGenJobQuery();

  // FeatureFlags on the wire is FlagState ("ON"/"OFF") per field, not a boolean map -- undefined
  // stays undefined so the backend falls back to the project/effective default instead of forcing
  // a value.
  const featureFlagOverridesBody = () => {
    const { dialogue, captions } = flagOverrides;
    if (dialogue === undefined && captions === undefined) return undefined;
    return {
      dialogue: dialogue === undefined ? undefined : dialogue ? "ON" : "OFF",
      captions: captions === undefined ? undefined : captions ? "ON" : "OFF",
    };
  };

  // ShotPromptView -> the shape ShotVideoCard already renders (externalJobId/recommendedModel/
  // prompt.*) so the card stays untouched by this move from pre-prod's dispatch() to video-gen's
  // own prepare-scene endpoints.
  const toCardInfo = (view) => ({
    externalJobId: view.jobId,
    externalPromptId: view.promptId,
    recommendedModel: view.recommendedModelId,
    estimatedCost: view.estimatedCost,
    costCurrency: view.costCurrency,
    // Every asset this prompt pulled in (frames, character faces, voice sample, music bed), each
    // tagged with its kind so the card can thumbnail the images and play the audio.
    references: view.references,
    prompt: {
      promptOriginal: view.promptOriginal,
      promptCompressed: view.promptCompressed,
      negativePrompt: view.negativePrompt,
      referenceImageUrls: view.referenceImageUrls,
    },
  });

  // The server row is the truth for a prepared prompt, so it always wins. This used to only
  // overwrite while a batch was running, which meant a re-prepare left the old prompt on screen:
  // the batch-status poll and this one are independent, so the batch could report SUCCEEDED
  // before the last prompts arrived, and from then on every fetch was ignored. That is why
  // editing a shot's dialogue and re-preparing still showed the previous text.
  //
  // Nothing is lost by always taking it: the only local writes are handleSavePrompt, which sets
  // state from the server's own response and invalidates this query anyway.
  useEffect(() => {
    if (!savedPrompts.length) return;
    setPrepared((p) => {
      const next = { ...p };
      savedPrompts.forEach((view) => {
        if (view.shotId) next[view.shotId] = toCardInfo(view);
      });
      return next;
    });
  }, [savedPrompts]);

  // A shot whose prompt has landed is no longer preparing -- clears spinners progressively
  // instead of all at once when the batch ends.
  useEffect(() => {
    if (!batchRunning) return;
    setPreparing((current) => {
      const next = { ...current };
      savedPrompts.forEach((view) => {
        if (view.shotId) next[view.shotId] = false;
      });
      return next;
    });
  }, [savedPrompts, batchRunning]);

  // PENDING (queued, not yet picked up) and RUNNING both mean live. Anything else is terminal.
  // Dropping every remaining spinner is deliberate: a shot still marked busy once the batch has
  // finished is one the batch could not prepare, and leaving it spinning forever would suggest
  // work is still happening.
  useEffect(() => {
    if (!batchRunning || !batchStatus?.status) return;
    // Ignore a status that belongs to an earlier batch: right after starting one, the cached
    // status is still the previous run's terminal state, and acting on it would end this run
    // before it began.
    if (activeBatchJobId && batchStatus.jobId !== activeBatchJobId) return;
    if (batchStatus.status === "PENDING" || batchStatus.status === "RUNNING") return;
    setBatchRunning(false);
    setActiveBatchJobId(null);
    setPreparing({});
    const failed = batchStatus.failedCount || 0;
    if (batchStatus.status === "FAILED") {
      dispatch(showFlash({
        message: batchStatus.errorMessage
          ? `Preparing shots failed: ${batchStatus.errorMessage}`
          : "Preparing shots failed",
        type: "error",
      }));
    } else if (failed > 0) {
      dispatch(showFlash({
        message: `${batchStatus.preparedCount || 0} prepared, ${failed} could not be prepared`,
        type: "error",
      }));
    } else {
      dispatch(showFlash({
        message: `${batchStatus.preparedCount || 0} shot${batchStatus.preparedCount === 1 ? "" : "s"} prepared`,
        type: "success",
      }));
    }
  }, [batchRunning, batchStatus, activeBatchJobId, dispatch]);

  // Adopt a batch that was already running when this view loaded.
  useEffect(() => {
    if (batchRunning || !batchStatus?.status) return;
    if (batchStatus.status !== "PENDING" && batchStatus.status !== "RUNNING") return;
    setActiveBatchJobId(batchStatus.jobId || null);
    setBatchRunning(true);
  }, [batchStatus?.status, batchStatus?.jobId, batchRunning]);

  const handlePrepare = async (shotId) => {
    setPreparing((s) => ({ ...s, [shotId]: true }));
    setOpenShotId(shotId);
    try {
      const view = await prepareShotScene({
        projectId,
        shotId,
        featureFlagOverrides: featureFlagOverridesBody(),
      }).unwrap();
      setPrepared((p) => ({ ...p, [shotId]: toCardInfo(view) }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not prepare this shot", type: "error" }));
    } finally {
      setPreparing((s) => ({ ...s, [shotId]: false }));
    }
  };

  /**
   * Generate this shot again, from the shot as it stands now.
   *
   * <p>A generated shot used to be a dead end: the card showed the clip and offered nothing else, so
   * a shot that came back wrong -- the line cut off at the end, the duration since changed, the
   * dialogue since rewritten -- could only be fixed by never having generated it in the first place.
   * That is exactly the shot the dialogue-fit check is for, and it was the one shot the check could
   * not reach.
   *
   * <p>Clears the finished clip from view and prepares afresh, which builds a new prompt from the
   * shot's CURRENT duration and line rather than reusing the prepared one. The existing job and its
   * prompt history are untouched server-side; this adds a version rather than overwriting one. The
   * usual approve step follows, so the new render is costed and confirmed exactly like the first.
   */
  const handleRegenerate = async (shotId) => {
    // Marked rather than deleted. Dropping the clip from state would fight the server's own view --
    // the project's shot-videos query would put it straight back on the next refetch, and the old
    // clip is worth keeping on screen anyway so the new one can be compared against it. The flag is
    // what tells the card to offer Approve again despite a rendered clip already existing.
    setRegenerating((r) => ({ ...r, [shotId]: true }));
    await handlePrepare(shotId);
  };

  /** Save an edited prompt. Returns true so the card can leave edit mode only on success --
   * dropping the creator's text back to the old version on a failed save would lose their work. */
  const handleSavePrompt = async (shotId, positive) => {
    const info = prepared[shotId];
    if (!info?.externalPromptId) return false;
    try {
      const view = await updateShotPrompt({
        projectId,
        promptId: info.externalPromptId,
        positive,
      }).unwrap();
      // The save created a new prompt version -- adopt its id so a later edit branches from the
      // edit, not from the original.
      setPrepared((p) => ({ ...p, [shotId]: toCardInfo(view) }));
      dispatch(showFlash({ message: "Prompt saved — approve to generate with it", type: "success" }));
      return true;
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this prompt", type: "error" }));
      return false;
    }
  };

  /** Approve dispatches the shot and blocks until the provider returns, which for a video is
   * minutes. Two things follow from that.
   *
   * First, a failure now says why. video-generation-service records the provider's or the
   * gateway's own reason on the job -- "Insufficient wallet balance. currentBalance=0
   * minimumRequired=50" and the like -- and now returns it, so an empty wallet reads as an empty
   * wallet instead of a flat "Generation failed".
   *
   * Second, a timed-out request is not a failed render. The dispatch carries on server-side, so
   * rather than telling the creator it failed (and inviting a re-approve that would dispatch and
   * bill the same shot twice), this asks the server what actually happened to the job.
   */
  /** {@code options.dialogueFit}: KEEP_PLANNED when the creator chose "go with the original" over
   * extending the shot to fit its line, from the dialogue-fit panel. Omitted otherwise, which lets
   * the server extend rather than let a line be cut -- and, for a line too long for any clip the
   * model makes, refuse instead of spending on a render that comes back severed. */
  const handleApprove = async (shotId, options) => {
    const info = prepared[shotId];
    if (!info?.externalJobId) return;
    setPreparing((s) => ({ ...s, [shotId]: true }));
    try {
      const job = await approveJob({
        jobId: info.externalJobId,
        projectId,
        dialogueFit: options?.dialogueFit,
      }).unwrap();
      setVideos((v) => ({ ...v, [shotId]: job }));
      setRegenerating((r) => ({ ...r, [shotId]: false }));
      reportJobOutcome(job);
    } catch (error) {
      // A gateway timeout (504) or a dropped connection means we stopped waiting, not that the
      // render stopped running. Ask the job.
      const timedOut = error?.status === 504 || error?.status === "FETCH_ERROR" || error?.status === "TIMEOUT_ERROR";
      if (timedOut) {
        const job = await pollJobUntilSettled(info.externalJobId, shotId);
        // Whatever the poll concluded, the listing is the authority on where the clip is and holds
        // a freshly signed URL. Asking it again is what turns a finished-but-unseen render into a
        // shot that plays, instead of one that looks like it was never generated.
        refetchShotVideos();
        if (job) {
          reportJobOutcome(job);
          return;
        }
        dispatch(showFlash({
          message: "Still rendering — this shot is taking a while. It will appear here when it finishes.",
          type: "info",
        }));
        return;
      }
      dispatch(showFlash({ message: error?.data?.message || "Could not generate this video — it may take a few minutes, try again", type: "error" }));
    } finally {
      setPreparing((s) => ({ ...s, [shotId]: false }));
    }
  };

  /** Says what happened to a job, using the server's own reason when it failed. */
  const reportJobOutcome = (job) => {
    if (job?.status === "COMPLETED") {
      dispatch(showFlash({ message: "Video ready", type: "success" }));
    } else if (job?.status === "FAILED") {
      dispatch(showFlash({ message: job.lastError || "Generation failed", type: "error" }));
    }
  };

  /** Watches a job that outlived its request. Returns the job once it settles, or null if it is
   * still running when we stop watching -- the render is unaffected either way, so giving up
   * watching is not giving up on the shot. */
  const pollJobUntilSettled = async (jobId, shotId) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, 5000); });
      try {
        // eslint-disable-next-line no-await-in-loop
        const job = await triggerGetVideoGenJob(jobId).unwrap();
        if (job?.status === "COMPLETED" || job?.status === "FAILED") {
          setVideos((v) => ({ ...v, [shotId]: job }));
          return job;
        }
      } catch {
        // A blip while polling is not an answer about the job; keep watching.
      }
    }
    return null;
  };

  const handleReject = async (shotId) => {
    const info = prepared[shotId];
    if (!info?.externalJobId) return false;
    try {
      await rejectJob({ jobId: info.externalJobId }).unwrap();
      // Deliberately keep the prepared info. It used to be deleted, which removed the prompt
      // from the card -- so the moment a creator said "this is wrong" they lost the text they
      // needed to fix. The job is rejected on the server either way; the prompt stays here to
      // be rewritten, and saving it creates a new version off the rejected one.
      return true;
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not reject this", type: "error" }));
      return false;
    }
  };

  const toggleShotSelected = (shotId) => {
    setSelectedShotIds((ids) => (ids.includes(shotId) ? ids.filter((id) => id !== shotId) : [...ids, shotId]));
  };

  const handleGenerateAll = async () => {
    // MOTION_GRAPHIC shots prepare too now -- MotionGraphicShotContextAssemblyStrategy attaches
    // the shot's own MOTION_GRAPHIC image as the reference frame, so Wan/Seedance treat it as the
    // input for image-to-video (animating the actual designed graphic rather than making up its
    // own interpretation of the animation notes). Filtering them out here would leave MG shots
    // out of "Prepare all" and force per-shot manual prepare, defeating the batch action.
    //
    // Nothing ticked -> send [] and let the server expand it to every shot in the project, so the
    // UI never has to hold a list the bundle already carries. Ticked boxes are sent verbatim.
    const shotIds = selectedShotIds;
    // Which cards show a spinner while the batch runs. `shots` is already in shotNumber order,
    // the same order the backend walks the bundle in.
    const busyIds = shotIds.length ? shotIds : shots.map((shot) => shot.id);
    if (!busyIds.length) return;
    busyIds.forEach((id) => setPreparing((s) => ({ ...s, [id]: true })));
    try {
      // Returns 202 as soon as the batch is queued -- it runs server-side, a shot at a time,
      // committing each prompt as it completes. Nothing to read from this response; progress
      // arrives through the poll below.
      //
      // Send the on-screen choices explicitly rather than relying on the stored project config:
      // the model/resolution dropdowns PUT asynchronously, so a creator who changes one and
      // immediately hits Prepare would otherwise get the previous value baked into every prompt.
      const accepted = await prepareShotScenesBatch({
        projectId,
        shotIds,
        featureFlagOverrides: featureFlagOverridesBody(),
        modelPin: projectConfig?.preferredVideoModel || undefined,
        resolutionOverride: projectConfig?.preferredResolution || undefined,
      }).unwrap();
      // Either this call queued the batch or it joined one already live for the project -- both
      // come back as a job to watch, so either way the UI starts polling.
      setActiveBatchJobId(accepted?.jobId || null);
      setBatchRunning(true);
    } catch (error) {
      busyIds.forEach((id) => setPreparing((s) => ({ ...s, [id]: false })));
      dispatch(showFlash({ message: error?.data?.message || "Could not start preparing shots", type: "error" }));
    }
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
      // Invalidating saved audio reloads fresh URLs for every generated clip.
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
      {audioLoadFailed && (
        <p className="mb-3 text-xs text-rose-300">
          Could not load saved dialogue audio. <button type="button" onClick={reloadAudio} className="underline">Retry</button>
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Video generation</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Prepare each shot to see the suggested model and exact prompt before anything generates — approve to spend and render.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedShotIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedShotIds([])}
              className="text-[11px] font-bold text-slate-400 underline hover:text-slate-200"
            >
              Clear selection
            </button>
          )}
          {overBudget && (
            <p className="flex w-full items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-200">
              <Clapperboard size={13} />
              This cut now runs {plannedTotal}s against the {targetTotal}s planned —{" "}
              {plannedTotal - targetTotal}s over. Lengthening shots to fit their dialogue is how that
              happens; rephrasing a line instead keeps the running time where it was agreed.
            </p>
          )}
          {/* Where the film gets put together. Assembly lives on the editor page, which is not
              somewhere you would look from here -- so the last step of this page points at it
              instead of leaving it to be found. Shown once any shot has a clip, since that is the
              point from which there is something to assemble. */}
          {Object.keys(videos).length > 0 && (
            <Link
              to="/editor"
              className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-200 hover:border-purple-400/60"
            >
              <Layers size={13} />
              Merge the shots into one film
            </Link>
          )}
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={batchRunning}
            title={selectedShotIds.length
              ? "Prepare only the shots you ticked."
              : "Tick shots to prepare just those; with none ticked this prepares every shot in the project."}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-purple-400/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {batchRunning ? <Loader2 size={13} className="animate-spin" /> : <Clapperboard size={13} />}
            {batchRunning
              ? batchStatus?.totalCount && (!activeBatchJobId || batchStatus.jobId === activeBatchJobId)
                ? `Preparing ${(batchStatus.preparedCount || 0) + (batchStatus.failedCount || 0)} of ${batchStatus.totalCount}…`
                : "Preparing shots…"
              : selectedShotIds.length
                ? `Prepare ${selectedShotIds.length} selected shot${selectedShotIds.length === 1 ? "" : "s"}`
                : "Prepare all shots"}
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
            selected={selectedShotIds.includes(shot.id)}
            onSelectToggle={() => toggleShotSelected(shot.id)}
            onPrepare={() => handlePrepare(shot.id)}
            onRegenerate={() => handleRegenerate(shot.id)}
            regenerating={!!regenerating[shot.id]}
            onSavePrompt={(positive) => handleSavePrompt(shot.id, positive)}
            onApprove={(options) => handleApprove(shot.id, options)}
            onReject={() => handleReject(shot.id)}
          />
        ))}
      </div>
    </div>
  );
}
