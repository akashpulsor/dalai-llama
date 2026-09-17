// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Check, Download, Loader2, Send, Upload, VolumeX } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import ShotCanvasPlayer from "./ShotCanvasPlayer.jsx";
import {
  useAcceptClipCutMutation,
  useCheckoutClipVersionMutation,
  useImportClipBaselineMutation,
  usePublishClipVersionMutation,
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
  const [checkout] = useCheckoutClipVersionMutation();
  const [publishVersion, publishState] = usePublishClipVersionMutation();
  const [importBaseline, baselineState] = useImportClipBaselineMutation();
  const fileRef = React.useRef(null);
  // Which cut the pending upload is an edit OF. Set when a version is downloaded, so bringing the
  // file back links the two rather than leaving a version that came from nowhere.
  const editingFromRef = React.useRef(null);

  const busy = dubbedState.isLoading || silentState.isLoading
    || uploadState.isLoading || acceptState.isLoading || publishState.isLoading
    || baselineState.isLoading;

  /**
   * Starts tracking this shot's generated clip as version 1, and returns it.
   *
   * <p>Nothing exists to download, publish or point at until a shot has a version, and versions are
   * only made when a shot is cut -- so a shot the creator is perfectly happy with had no row and no
   * buttons. The first time one of those is wanted, this creates it.
   */
  const ensureBaseline = async () => {
    if (versions.length) return versions.find((v) => v.status === "ACTIVE") || versions[0];
    try {
      return await importBaseline({ projectId, shotId, shotRef: shot?.shotRef }).unwrap();
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || "Could not read this shot's generated video",
        type: "error",
      }));
      return null;
    }
  };

  /**
   * Takes a cut away to be edited: marks it out, then saves the file.
   *
   * <p>The mark is what makes "which shots am I waiting on" answerable. The download itself is done
   * by fetching the bytes and handing them over as a blob -- the download attribute is ignored for
   * cross-origin URLs, so a plain link opens the video in a tab instead of saving it.
   */
  const handleDownload = async (version) => {
    try {
      await checkout({ projectId, shotId, versionId: version.versionId }).unwrap();
      editingFromRef.current = version.versionId;
    } catch {
      // Marking is bookkeeping; never block the download itself over it.
    }
    const filename = `${shot?.shotRef || "shot"}-v${version.versionNumber}.mp4`;
    try {
      const response = await fetch(version.videoUrl);
      if (!response.ok) throw new Error(String(response.status));
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      window.open(version.videoUrl, "_blank", "noopener");
    }
  };

  const handlePublish = async (version) => {
    try {
      await publishVersion({
        projectId, shotId, versionId: version.versionId, published: !version.published,
      }).unwrap();
      dispatch(showFlash({
        message: version.published
          ? "Taken down — your client no longer sees this shot."
          : "Published — your client can watch this shot on their review page.",
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || "Could not change whether the client sees this shot",
        type: "error",
      }));
    }
  };

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
      await run(uploadCut, { file, editedFromVersionId: editingFromRef.current },
        "Your edit is in as a new version.");
      editingFromRef.current = null;
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  // Deliberately NOT an early return while loading.
  //
  // This used to render a spinner INSTEAD of the panel, so a slow or failed version lookup hid the
  // two buttons the panel exists for -- and the download and upload with them. The buttons do not
  // depend on that list: they act on the shot, not on a version. So they render immediately and the
  // list says it is still loading in its own corner.

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

      {isLoading && (
        <div className="mt-2 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin text-slate-500" />
          <p className="text-[10px] font-medium text-slate-500">Checking earlier versions…</p>
        </div>
      )}

      {!isLoading && versions.length === 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2.5">
          <span className="text-[10px] font-medium text-slate-500">
            This shot is on its generated video:
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={async () => { const v = await ensureBaseline(); if (v) handleDownload(v); }}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <Download size={10} /> Download to edit
          </button>
        </div>
      )}

      {!isLoading && versions.length > 0 && (
        <div className="mt-2.5 border-t border-white/10 pt-2">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            All versions
          </p>
          {versions.map((version) => (
            <div key={version.versionId} className="flex items-center justify-between gap-2 py-0.5">
              <span className="truncate text-[10px] font-medium text-slate-400">
                v{version.versionNumber} · {ORIGIN_LABEL[version.origin] || version.origin}
                {version.status === "ACTIVE" ? " · in use" : ""}
                {/* Said out loud, because "which shots am I still waiting on" had no answer before
                    downloading left a trace. */}
                {version.downloadedForEditAt ? " · out for edit" : ""}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDownload(version)}
                  title="Download to edit elsewhere, then upload it back"
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50"
                >
                  <Download size={10} /> Edit
                </button>
                {version.status !== "ACTIVE" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAccept(version.versionId)}
                    className="text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-50"
                  >
                    Use this one
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
