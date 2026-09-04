// @ts-nocheck
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import * as videoService from "../services/videoService.js";
import * as thumbnailService from "../services/thumbnailService.js";
import { canRedo, canUndo } from "../services/historyService.js";
import { computeSegments } from "../utils/edl.js";
import { clamp } from "../utils/time.js";
import { extractResultVideoUrl, isCompletedJobStatus, isFailedJobStatus, jobErrorMessage, sleep } from "../utils/jobStatus.js";
import {
  useCreateDubbingJobMutation,
  useGenerateUpscaleMutation,
  useGeneratePatchEditAsyncMutation,
  useLazyGetDubbingJobQuery,
  useLazyGetJobQuery,
} from "../../../api/creatorEndpoints.js";
import { initialPatchEditorState, patchEditorReducer } from "./patchEditorReducer.js";

const JOB_POLL_INTERVAL_MS = 2000;

const PatchEditorContext = createContext(null);

function triggerBrowserDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "clip.mp4";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function PatchEditorProvider({ children }) {
  const [state, dispatch] = useReducer(patchEditorReducer, initialPatchEditorState);
  const [triggerGeneratePatchEdit] = useGeneratePatchEditAsyncMutation();
  const [triggerGetJob] = useLazyGetJobQuery();
  const [triggerCreateDubbingJob] = useCreateDubbingJobMutation();
  const [triggerGetDubbingJob] = useLazyGetDubbingJobQuery();
  const [triggerGenerateUpscale] = useGenerateUpscaleMutation();
  const thumbnailRunId = useRef(0);

  useEffect(() => {
    if (state.status !== "ready" || !state.sourceFile || !state.duration) return undefined;

    const runId = ++thumbnailRunId.current;
    dispatch({ type: "THUMBNAILS_LOADING" });

    thumbnailService
      .generateThumbnails({
        file: state.sourceFile,
        duration: state.duration,
        count: 40,
        isCancelled: () => thumbnailRunId.current !== runId,
      })
      .then((items) => {
        if (thumbnailRunId.current === runId) dispatch({ type: "THUMBNAILS_READY", items });
      })
      .catch(() => {
        if (thumbnailRunId.current === runId) dispatch({ type: "THUMBNAILS_ERROR" });
      });

    return () => {
      thumbnailRunId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.sourceFile, state.duration]);

  useEffect(
    () => () => {
      if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
      if (state.extraction.url) URL.revokeObjectURL(state.extraction.url);
      if (state.exportState.url) URL.revokeObjectURL(state.exportState.url);
      state.history.present.forEach((entry) => {
        if (entry.replacementUrl) URL.revokeObjectURL(entry.replacementUrl);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const readSource = useCallback(async (file, hostedUrl = null) => {
    dispatch({ type: "SOURCE_LOADING" });
    try {
      const metadata = await videoService.probeMetadata(file);
      if (!metadata.duration || !Number.isFinite(metadata.duration)) {
        throw new Error("Could not determine video duration for this file.");
      }
      const url = URL.createObjectURL(file);
      dispatch({
        type: "SOURCE_READY",
        file,
        url,
        hostedUrl,
        name: file.name,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
      });
    } catch (error) {
      dispatch({ type: "SOURCE_ERROR", error: error.message || "Could not load this video." });
    }
  }, []);

  const loadSource = readSource;

  // Pulls in an asset generated elsewhere in the app (e.g. the combined final
  // video from the Video page) so it lands in the editor as a normal `File`,
  // same as a manual upload — extractClip/exportVideo both key off `file.name`.
  const loadSourceFromUrl = useCallback(
    async (assetUrl, assetName) => {
      dispatch({ type: "SOURCE_LOADING" });
      try {
        const response = await fetch(assetUrl);
        if (!response.ok) throw new Error(`Could not fetch the video (${response.status}).`);
        const blob = await response.blob();
        const name = assetName || assetUrl.split("/").pop()?.split("?")[0] || "video.mp4";
        const file = new File([blob], name, { type: blob.type || "video/mp4" });
        await readSource(file, assetUrl);
      } catch (error) {
        dispatch({ type: "SOURCE_ERROR", error: error.message || "Could not load this video." });
      }
    },
    [readSource]
  );

  const setSelection = useCallback(
    (inPoint, outPoint) => {
      const duration = state.duration || 0;
      const clampedIn = clamp(Math.min(inPoint, outPoint), 0, duration);
      const clampedOut = clamp(Math.max(inPoint, outPoint), 0, duration);
      dispatch({ type: "SET_SELECTION", inPoint: clampedIn, outPoint: Math.max(clampedOut, clampedIn + 0.05) });
    },
    [state.duration]
  );

  const setCurrentTime = useCallback((time) => {
    dispatch({ type: "SET_CURRENT_TIME", time });
  }, []);

  const setPlaying = useCallback((isPlaying) => {
    dispatch({ type: "SET_PLAYING", isPlaying });
  }, []);

  const toggleLoop = useCallback(() => dispatch({ type: "TOGGLE_LOOP" }), []);

  const setViewMode = useCallback((mode) => dispatch({ type: "SET_VIEW_MODE", mode }), []);

  const downloadClip = useCallback(async () => {
    if (!state.sourceFile || !state.selection) return;
    dispatch({ type: "EXTRACTION_START" });
    try {
      const { url, filename } = await videoService.extractClip({
        file: state.sourceFile,
        start: state.selection.inPoint,
        end: state.selection.outPoint,
        onProgress: (progress) => dispatch({ type: "EXTRACTION_PROGRESS", progress }),
      });
      dispatch({ type: "EXTRACTION_SUCCESS", url, filename });
      triggerBrowserDownload(url, filename);
    } catch (error) {
      dispatch({ type: "EXTRACTION_ERROR", error: error.message || "Could not extract the clip." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sourceFile, state.selection]);

  const uploadReplacement = useCallback(
    async (file) => {
      if (!state.selection) return;
      dispatch({ type: "REPLACEMENT_START" });
      try {
        const metadata = await videoService.probeMetadata(file);
        const entry = {
          id: `patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          start: state.selection.inPoint,
          end: state.selection.outPoint,
          replacementUrl: URL.createObjectURL(file),
          replacementName: file.name,
          replacementDuration: metadata.duration,
          createdAt: Date.now(),
        };
        dispatch({ type: "APPLY_REPLACEMENT", entry });
        dispatch({ type: "SET_VIEW_MODE", mode: "patched" });
      } catch (error) {
        dispatch({ type: "REPLACEMENT_ERROR", error: error.message || "Could not read the uploaded clip." });
      }
    },
    [state.selection]
  );

  const generateAiEdit = useCallback(
    async ({ provider, model, prompt, negativePrompt, referenceImages, referenceVideos } = {}) => {
      if (!state.sourceFile || !state.selection) return;
      dispatch({ type: "AI_EDIT_START" });
      try {
        dispatch({ type: "AI_EDIT_PROGRESS", progress: 0.05, statusLabel: "Cutting selection…" });
        const { blob, filename } = await videoService.extractClip({
          file: state.sourceFile,
          start: state.selection.inPoint,
          end: state.selection.outPoint,
        });
        const clipFile = new File([blob], filename, { type: "video/mp4" });

        dispatch({ type: "AI_EDIT_PROGRESS", progress: 0.15, statusLabel: `Sending to ${provider}…` });
        // The cut selection IS the "reference video" for this edit - it becomes
        // video_url in the provider request (see CreatorPatchEditService). Reference
        // images are separate, optional "elements" the prompt can point at (@Element1…).
        const job = await triggerGeneratePatchEdit({
          file: clipFile,
          provider,
          model,
          prompt,
          negativePrompt,
          referenceImages: referenceImages && referenceImages.length ? referenceImages : undefined,
          referenceVideos: referenceVideos && referenceVideos.length ? referenceVideos : undefined,
          startSeconds: state.selection.inPoint,
          endSeconds: state.selection.outPoint,
        }).unwrap();

        const jobId = job?.jobId || job?.id;
        if (!jobId) throw new Error("Backend did not return a job id.");

        let finishedJob = null;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-await-in-loop
          const polled = await triggerGetJob(jobId).unwrap();
          const status = polled?.status;
          if (isFailedJobStatus(status)) {
            throw new Error(jobErrorMessage(polled) || "The AI edit job failed.");
          }
          if (isCompletedJobStatus(status)) {
            finishedJob = polled;
            break;
          }
          const progress = 0.25 + clamp(Number(polled?.progress) || 0, 0, 1) * 0.65;
          dispatch({ type: "AI_EDIT_PROGRESS", progress, statusLabel: status || "Processing…" });
          // eslint-disable-next-line no-await-in-loop
          await sleep(JOB_POLL_INTERVAL_MS);
        }

        const resultUrl = extractResultVideoUrl(finishedJob);
        if (!resultUrl) throw new Error("The AI edit finished but no result video was returned.");

        dispatch({ type: "AI_EDIT_PROGRESS", progress: 0.95, statusLabel: "Fetching result…" });
        const metadata = await videoService.probeMetadata(resultUrl);

        const entry = {
          id: `patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          start: state.selection.inPoint,
          end: state.selection.outPoint,
          replacementUrl: resultUrl,
          replacementName: `${provider} AI edit`,
          replacementDuration: metadata.duration,
          createdAt: Date.now(),
        };
        dispatch({ type: "APPLY_REPLACEMENT", entry });
        dispatch({ type: "SET_VIEW_MODE", mode: "patched" });
        dispatch({ type: "AI_EDIT_SUCCESS" });
      } catch (error) {
        dispatch({ type: "AI_EDIT_ERROR", error: error.message || "AI edit failed." });
      }
    },
    [state.sourceFile, state.selection, triggerGeneratePatchEdit, triggerGetJob]
  );

  // Dub / change-language of the WHOLE current video: uploads it with a target language,
  // the backend re-voices the dialogue (clone -> synth -> lip-sync the speaking parts) and
  // re-muxes, then the dubbed result is loaded back in as a fresh source on the timeline.
  const dubVideo = useCallback(
    async (targetLanguage) => {
      if (!state.sourceFile || !targetLanguage || state.dub.status === "processing") return;
      dispatch({ type: "DUB_START", targetLanguage });
      try {
        dispatch({ type: "DUB_PROGRESS", progress: 0.1, statusLabel: "Uploading video…" });
        const job = await triggerCreateDubbingJob({ file: state.sourceFile, targetLanguage }).unwrap();
        const jobId = job?.jobId || job?.id;
        if (!jobId) throw new Error("Backend did not return a job id.");

        let finishedJob = null;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-await-in-loop
          const polled = await triggerGetDubbingJob(jobId).unwrap();
          const status = polled?.status;
          if (isFailedJobStatus(status)) {
            throw new Error(jobErrorMessage(polled) || polled?.lastError || "The dubbing job failed.");
          }
          if (isCompletedJobStatus(status)) {
            finishedJob = polled;
            break;
          }
          // No numeric progress from this pipeline; show the coarse stage it reports.
          const label = status === "PROCESSING" ? "Transcribing, translating & re-voicing…" : "Queued…";
          dispatch({ type: "DUB_PROGRESS", progress: 0.4, statusLabel: label });
          // eslint-disable-next-line no-await-in-loop
          await sleep(JOB_POLL_INTERVAL_MS);
        }

        const resultUrl = finishedJob?.videoUrl;
        if (!resultUrl) throw new Error("Dubbing finished but no result video was returned.");
        dispatch({ type: "DUB_PROGRESS", progress: 0.9, statusLabel: "Loading dubbed video…" });
        dispatch({ type: "DUB_SUCCESS" });
        // Replaces the whole source with the dubbed cut (resets editor state, incl. dub).
        await loadSourceFromUrl(resultUrl, `dubbed-${targetLanguage}.mp4`);
      } catch (error) {
        dispatch({ type: "DUB_ERROR", error: error.message || "Dubbing failed." });
      }
    },
    [state.sourceFile, state.dub.status, triggerCreateDubbingJob, triggerGetDubbingJob, loadSourceFromUrl]
  );

  // Upscale the WHOLE current video through a chosen model. Unlike dub/AI-edit, post-production's
  // /v1/post-production/upscale blocks until the result is ready -- no job to poll. Only available
  // when the current source has a known hosted URL (loaded via ProjectPickerPanel or a prior
  // dub/upscale result) -- fal.ai needs a URL it can fetch, not a local blob: preview URL.
  const upscaleVideo = useCallback(
    async (modelId) => {
      if (!state.sourceHostedUrl || state.upscale.status === "processing") return;
      dispatch({ type: "UPSCALE_START", model: modelId });
      try {
        const result = await triggerGenerateUpscale({
          sourceVideoUrl: state.sourceHostedUrl,
          model: modelId,
          durationSeconds: state.duration,
        }).unwrap();
        const resultUrl = result?.videoUrl;
        if (!resultUrl) throw new Error("Upscale finished but no result video was returned.");
        dispatch({ type: "UPSCALE_SUCCESS" });
        // Replaces the whole source with the upscaled result (resets editor state, incl. upscale).
        await loadSourceFromUrl(resultUrl, `upscaled-${state.sourceName || "video.mp4"}`);
      } catch (error) {
        dispatch({ type: "UPSCALE_ERROR", error: error.message || "Upscale failed." });
      }
    },
    [state.sourceHostedUrl, state.sourceName, state.duration, state.upscale.status, triggerGenerateUpscale, loadSourceFromUrl]
  );

  // Cut/delete the current selection: drops [inPoint,outPoint] and closes the gap. Recorded as
  // a delete EDL entry so it previews/exports/undoes like any other edit (no re-encode yet).
  const deleteSelection = useCallback(() => {
    if (!state.selection) return;
    const entry = {
      id: `cut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      start: state.selection.inPoint,
      end: state.selection.outPoint,
      kind: "delete",
      replacementName: "Deleted section",
      createdAt: Date.now(),
    };
    dispatch({ type: "APPLY_REPLACEMENT", entry });
    dispatch({ type: "SET_VIEW_MODE", mode: "patched" });
  }, [state.selection]);

  const removePatch = useCallback((id) => dispatch({ type: "REMOVE_PATCH", id }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const exportFinal = useCallback(async () => {
    if (!state.sourceFile) return;
    const { segments } = computeSegments(state.duration, state.history.present);
    dispatch({ type: "EXPORT_START" });
    try {
      const { url, filename } = await videoService.exportVideo({
        file: state.sourceFile,
        duration: state.duration,
        segments,
        onProgress: (progress) => dispatch({ type: "EXPORT_PROGRESS", progress }),
      });
      dispatch({ type: "EXPORT_SUCCESS", url, filename });
      triggerBrowserDownload(url, filename);
    } catch (error) {
      dispatch({ type: "EXPORT_ERROR", error: error.message || "Export failed." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sourceFile, state.duration, state.history.present]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const edl = state.history.present;
  const { segments, totalDuration: patchedDuration } = useMemo(
    () => computeSegments(state.duration, edl),
    [state.duration, edl]
  );

  const value = useMemo(
    () => ({
      state: { ...state, edl, segments, patchedDuration },
      canUndo: canUndo(state.history),
      canRedo: canRedo(state.history),
      actions: {
        loadSource,
        loadSourceFromUrl,
        setSelection,
        setCurrentTime,
        setPlaying,
        toggleLoop,
        setViewMode,
        downloadClip,
        uploadReplacement,
        generateAiEdit,
        dubVideo,
        upscaleVideo,
        deleteSelection,
        removePatch,
        undo,
        redo,
        exportFinal,
        reset,
      },
    }),
    [
      state,
      edl,
      segments,
      patchedDuration,
      loadSource,
      loadSourceFromUrl,
      setSelection,
      setCurrentTime,
      setPlaying,
      toggleLoop,
      setViewMode,
      downloadClip,
      uploadReplacement,
      generateAiEdit,
      dubVideo,
      upscaleVideo,
      deleteSelection,
      removePatch,
      undo,
      redo,
      exportFinal,
      reset,
    ]
  );

  return <PatchEditorContext.Provider value={value}>{children}</PatchEditorContext.Provider>;
}

export function usePatchEditor() {
  const ctx = useContext(PatchEditorContext);
  if (!ctx) throw new Error("usePatchEditor must be used within a PatchEditorProvider");
  return ctx;
}
