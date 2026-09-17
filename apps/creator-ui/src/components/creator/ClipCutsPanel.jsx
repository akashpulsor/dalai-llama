// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Check, Loader2, Upload, VolumeX } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import ShotCanvasPlayer from "./ShotCanvasPlayer.jsx";
import {
  useAcceptClipCutMutation,
  useCreateDubbedCutMutation,
  useCreateSilentCutMutation,
  useListClipVersionsQuery,
  useUploadClipCutMutation,
} from "../../api/creatorEndpoints.js";

/**
 * Cutting a shot: make a version, watch it, then decide whether the film uses it.
 *
 * <p>The change that matters is the order. A cut used to replace the clip the moment it was
 * produced, so the only way to find out whether it was any good was to lose the alternative -- and
 * a cut that came out wrong took the shot's only video with it. Every cut here is a numbered
 * PREVIEW that can be watched first; nothing the film uses changes until "Use this cut".
 *
 * <p>Version numbers rather than ids, because "version 3" is something a creator can point at and
 * ask for. Nothing is ever deleted, so going back costs a click.
 */

const ORIGIN_LABEL = {
  GENERATED: "as generated",
  DUBBED: "with the dubbed voice",
  SILENT: "no voice",
  UPLOADED: "your own edit",
};

const seconds = (value) => (value == null ? null : `${Number(value).toFixed(1)}s`);

export default function ClipCutsPanel({ shot, projectId, aspectRatio, onChanged }) {
  const dispatch = useDispatch();
  const shotId = shot?.id;
  const { data: versions = [], isLoading } = useListClipVersionsQuery(
    { projectId, shotId },
    { skip: !projectId || !shotId },
  );
  const [createDubbed, dubbedState] = useCreateDubbedCutMutation();
  const [createSilent, silentState] = useCreateSilentCutMutation();
  const [uploadCut, uploadState] = useUploadClipCutMutation();
  const [acceptCut, acceptState] = useAcceptClipCutMutation();
  const fileRef = React.useRef(null);

  const busy = dubbedState.isLoading || silentState.isLoading
    || uploadState.isLoading || acceptState.isLoading;

  const current = versions.find((version) => version.status === "ACTIVE");
  const previews = versions.filter((version) => version.status === "PREVIEW");

  const run = async (action, args, madeMessage) => {
    try {
      const made = await action({ projectId, shotId, shotRef: shot?.shotRef, ...args }).unwrap();
      dispatch(showFlash({
        message: `${madeMessage} Watch it below, then use it if it is right.`,
        type: "success",
      }));
      return made;
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || error?.data?.error || "Could not make that cut",
        type: "error",
      }));
      return null;
    }
  };

  const handleAccept = async (versionId) => {
    try {
      await acceptCut({ projectId, shotId, versionId }).unwrap();
      dispatch(showFlash({
        message: "That is the shot's video now. The one it replaced is still here.",
        type: "success",
      }));
      onChanged?.();
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || "Could not use that cut",
        type: "error",
      }));
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await run(uploadCut, { file }, "Your edit is in as a new version.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] p-3">
        <Loader2 size={13} className="animate-spin text-slate-400" />
        <p className="text-[11px] font-medium text-slate-400">Loading this shot's versions…</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
          This shot's video
        </p>
        {current && (
          <span className="text-[10px] font-bold text-slate-500">
            Using v{current.versionNumber} · {ORIGIN_LABEL[current.origin] || current.origin}
            {current.durationSeconds ? ` · ${seconds(current.durationSeconds)}` : ""}
          </span>
        )}
      </div>

      {/* The two cuts, as two buttons. Neither changes the film -- both make something to look at. */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(createDubbed, {}, "Made a cut with the dubbed voice on it.")}
          className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 disabled:opacity-50"
        >
          {dubbedState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <AudioLines size={11} />}
          {dubbedState.isLoading ? "Making…" : "Use the dubbed voice"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(createSilent, {}, "Made a silent cut.")}
          className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 disabled:opacity-50"
        >
          {silentState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <VolumeX size={11} />}
          {silentState.isLoading ? "Making…" : "Remove the audio"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {uploadState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
          {uploadState.isLoading ? "Uploading…" : "Upload your own edit"}
        </button>
        <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
      </div>
      <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-slate-500">
        Both make a new version to watch. Neither changes the shot until you choose it, and nothing
        is ever deleted — every version stays here.
      </p>

      {previews.length > 0 && (
        <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-200">
            Waiting for you to decide
          </p>
          {previews.map((version) => (
            <div key={version.versionId} className="rounded-md border border-amber-400/25 bg-amber-500/[0.06] p-2">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-200">
                  v{version.versionNumber} · {ORIGIN_LABEL[version.origin] || version.origin}
                  {version.durationSeconds ? ` · ${seconds(version.durationSeconds)}` : ""}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAccept(version.versionId)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/15 px-2 py-1 text-[10px] font-bold text-purple-200 disabled:opacity-50"
                >
                  {acceptState.isLoading ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                  Use this cut
                </button>
              </div>
              <ShotCanvasPlayer
                src={version.videoUrl}
                aspectRatio={aspectRatio}
                className="mx-auto w-full max-w-xs"
                label={`v${version.versionNumber}`}
              />
            </div>
          ))}
        </div>
      )}

      {versions.length > 1 && (
        <div className="mt-2.5 border-t border-white/10 pt-2">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            All versions
          </p>
          {versions.map((version) => (
            <div key={version.versionId} className="flex items-center justify-between gap-2 py-0.5">
              <span className="truncate text-[10px] font-medium text-slate-400">
                v{version.versionNumber} · {ORIGIN_LABEL[version.origin] || version.origin}
                {version.status === "ACTIVE" ? " · in use" : ""}
              </span>
              {version.status !== "ACTIVE" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAccept(version.versionId)}
                  className="shrink-0 text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-50"
                >
                  Use this one
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
