// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, Download, Film, Loader2, Send, Sparkles, Upload, UserCircle } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import ShotCanvasPlayer from "./ShotCanvasPlayer.jsx";
import { Link } from "react-router-dom";
import { useGetMyShowcaseQuery } from "../../api/showcaseEndpoints.js";
import PublishToProfileDialog from "../showcase/PublishToProfileDialog.jsx";
import {
  useAssembleFilmMutation,
  useGetFilmReadinessQuery,
  useGetLatestFilmQuery,
  useUpscaleFilmMutation,
  useListProjectClipsQuery,
  usePublishFilmMutation,
  useUploadFilmEditMutation,
} from "../../api/creatorEndpoints.js";

/**
 * The last step: join every shot into one film, then show it to the client.
 *
 * <p>The combine button is disabled until every shot has a video, and it says which ones do not --
 * a greyed-out control with no reason attached is the thing a creator has to guess their way
 * around. The server enforces the same rule; this only explains it.
 *
 * <p>Joining is queued rather than waited on, so this polls. Publishing is deliberately a second,
 * separate press: the client's review page shows no film at all until it happens, which means a cut
 * nobody has chosen to show cannot be reached by someone holding the review link.
 */

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 225; // ~15 minutes, an ffmpeg join of a long project

export default function FilmAssemblyBar({ projectId, aspectRatio }) {
  // Publishing puts the film on the creator's profile (thumbnail chosen first); sharing it to
  // YouTube happens from there.
  const [profileDialog, setProfileDialog] = React.useState(false);
  const { data: profileItems = [] } = useGetMyShowcaseQuery();
  const onProfile = profileItems.some((item) => item.sourceProjectId === projectId && item.status === "LIVE");
  const dispatch = useDispatch();
  const { data: readiness } = useGetFilmReadinessQuery(projectId, { skip: !projectId });
  const { data: film, refetch: refetchFilm } = useGetLatestFilmQuery(projectId, { skip: !projectId });
  const { data: currentClips = [] } = useListProjectClipsQuery(projectId, { skip: !projectId });
  const [assemble] = useAssembleFilmMutation();
  const [upscaleFilm] = useUpscaleFilmMutation();
  const [upscaling, setUpscaling] = React.useState(false);

  /**
   * Whether the film on screen was built from the cuts the shots have NOW.
   *
   * <p>A film is a built artifact, not a live view -- accepting a new cut cannot change an .mp4 that
   * already exists. Nothing said so, so fixing a shot and pressing play showed the old film and read
   * as "the fix did not work". It is the one question this panel could not answer and the server
   * could not answer for it.
   *
   * <p>Compared here rather than flagged by the server: the film carries the version ids it was made
   * from and this page already holds the current ones, so the comparison is two lists. A server-side
   * "stale" boolean would have to be recomputed on every read and would go wrong quietly.
   */
  const staleShotCount = React.useMemo(() => {
    const builtFrom = film?.sourceVersionIds;
    if (!builtFrom?.length || !currentClips.length) return 0;
    const inFilm = new Set(builtFrom);
    return currentClips.filter((clip) => !inFilm.has(clip.versionId)).length;
  }, [film?.sourceVersionIds, currentClips]);
  const [publish, publishState] = usePublishFilmMutation();
  const [uploadEdit, uploadState] = useUploadFilmEditMutation();
  const [joining, setJoining] = React.useState(false);
  const fileRef = React.useRef(null);

  /** The film, saved so it can be cut elsewhere. Fetched and handed over as a blob because the
   * download attribute is ignored for cross-origin URLs, which would open it in a tab instead. */
  const handleDownload = async () => {
    const filename = "film.mp4";
    try {
      const response = await fetch(film.videoUrl);
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
      window.open(film.videoUrl, "_blank", "noopener");
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadEdit({ projectId, file }).unwrap();
        dispatch(showFlash({
          message: "Your edit is in. Publish it when you want the client to see it.",
          type: "success",
        }));
      } catch (error) {
        dispatch(showFlash({
          message: error?.data?.message || "Could not take that file",
          type: "error",
        }));
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const ready = readiness?.ready === true;
  const missing = readiness?.missingShotRefs || [];
  // Shots the client films need their footage uploaded, not generating -- said separately so the
  // creator knows which ones are waiting on someone else.
  const awaitingClient = readiness?.awaitingClientFootageShotRefs || [];
  const toGenerate = missing.filter((ref) => !awaitingClient.includes(ref));
  const disabledReason = ready
    ? null
    : missing.length
      ? [
          toGenerate.length ? `Please generate: ${toGenerate.join(", ")}` : null,
          awaitingClient.length ? `Waiting for client footage: ${awaitingClient.join(", ")}` : null,
        ].filter(Boolean).join(" · ")
      : "Please generate all shots";

  const handleAssemble = async () => {
    if (!ready || joining) return;
    setJoining(true);
    try {
      await assemble(projectId).unwrap();
      dispatch(showFlash({ message: "Joining the shots into one film…", type: "info" }));
      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, POLL_INTERVAL_MS); });
        // eslint-disable-next-line no-await-in-loop
        const latest = await refetchFilm().unwrap();
        if (latest?.status === "COMPLETED") {
          dispatch(showFlash({ message: "The film is ready.", type: "success" }));
          return;
        }
        if (latest?.status === "FAILED") {
          dispatch(showFlash({
            message: latest.lastError || "Joining the shots failed.",
            type: "error",
          }));
          return;
        }
      }
      dispatch(showFlash({
        message: "Still joining — it will appear here when it finishes.",
        type: "info",
      }));
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || error?.data?.error || "Could not join the shots",
        type: "error",
      }));
    } finally {
      setJoining(false);
    }
  };

  // A film generated small (480x854 is typical) can be upscaled to Full HD once the edit is settled.
  const upscaled = !!film?.upscaledFromRenderId;
  const canUpscale = film?.status === "COMPLETED" && !upscaled && film?.width > 0 && film?.height > 0
    && Math.min(film.width, film.height) < 1080;
  const upscaleRunning = upscaling || (upscaled && (film?.status === "QUEUED" || film?.status === "PROCESSING"));

  const handleUpscale = async () => {
    setUpscaling(true);
    try {
      await upscaleFilm({ projectId, renderId: film.renderId }).unwrap();
      dispatch(showFlash({ message: "Upscaling the film to Full HD with Topaz — a few minutes.", type: "info" }));
      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, POLL_INTERVAL_MS); });
        // eslint-disable-next-line no-await-in-loop
        const latest = await refetchFilm().unwrap();
        if (latest?.status === "COMPLETED") {
          dispatch(showFlash({ message: "The Full HD film is ready. Publish it when you want the client to see it.", type: "success" }));
          return;
        }
        if (latest?.status === "FAILED") {
          dispatch(showFlash({ message: latest.lastError || "Upscaling the film failed.", type: "error" }));
          return;
        }
      }
      dispatch(showFlash({ message: "Still upscaling — it will appear here when it finishes.", type: "info" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || error?.data?.error || "Could not upscale the film", type: "error" }));
    } finally {
      setUpscaling(false);
    }
  };

  const handlePublish = async () => {
    try {
      await publish({ projectId, renderId: film.renderId, published: !film.published }).unwrap();
      dispatch(showFlash({
        message: film.published
          ? "Taken down — your client's review page no longer shows it."
          : "Published — your client can watch it on their review page.",
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || "Could not change whether the client can see this",
        type: "error",
      }));
    }
  };

  if (!projectId) return null;

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">The film</p>
      <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
        Every shot's chosen version, joined in order at the project's aspect ratio.
        {readiness ? ` ${readiness.readyShots} of ${readiness.totalShots} shots have video.` : ""}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAssemble}
          disabled={!ready || joining}
          title={disabledReason || undefined}
          className="creator-primary flex min-h-9 items-center justify-center gap-2 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joining ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
          {joining ? "Joining…" : "Combine into one video"}
        </button>

        {(canUpscale || upscaleRunning) && (
          <button
            type="button"
            onClick={handleUpscale}
            disabled={upscaleRunning}
            title="Topaz upscales the joined film to Full HD (1080 wide for a vertical film). About $0.02 per second of film."
            className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-sky-400/30 bg-sky-500/10 px-4 text-xs font-black text-sky-100 disabled:opacity-60"
          >
            {upscaleRunning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {upscaleRunning ? "Upscaling to Full HD…" : "Upscale to Full HD"}
          </button>
        )}
        {upscaled && film?.status === "COMPLETED" && (
          <span className="flex min-h-9 items-center rounded-md border border-sky-400/20 px-3 text-[11px] font-bold text-sky-200">
            Full HD · {film.width}×{film.height}
          </span>
        )}

        {film?.status === "COMPLETED" && film?.videoUrl && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-xs font-black text-slate-300 hover:text-slate-100"
          >
            <Download size={14} /> Download to edit
          </button>
        )}

        {film?.status === "COMPLETED" && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadState.isLoading}
            className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-xs font-black text-slate-300 hover:text-slate-100 disabled:opacity-60"
          >
            {uploadState.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploadState.isLoading ? "Uploading…" : "Upload your edit"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />

        {film?.status === "COMPLETED" && film?.videoUrl && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishState.isLoading}
            className={`flex min-h-9 items-center justify-center gap-2 rounded-md px-4 text-xs font-black disabled:opacity-60 ${
              film.published
                ? "border border-white/10 bg-white/5 text-slate-200"
                : "border border-purple-400/30 bg-purple-500/15 text-purple-200"
            }`}
          >
            {publishState.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {film.published ? "Take down from review page" : "Publish to review page"}
          </button>
        )}

        {film?.status === "COMPLETED" && film?.published && (onProfile ? (
          <Link
            to="/profile#films"
            className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-4 text-xs font-black text-emerald-100"
          >
            <UserCircle size={14} /> On your profile · share it from there
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setProfileDialog(true)}
            className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-4 text-xs font-black text-emerald-100"
          >
            <UserCircle size={14} /> Publish to my profile
          </button>
        ))}
      </div>
      {profileDialog && <PublishToProfileDialog projectId={projectId} onProfile={false} onClose={() => setProfileDialog(false)} />}

      {!ready && disabledReason && (
        <p className="mt-1.5 text-[10px] font-bold text-amber-200/90">{disabledReason}</p>
      )}

      {staleShotCount > 0 && film?.status === "COMPLETED" && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-500/[0.08] px-3 py-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[11px] font-semibold leading-relaxed text-amber-100">
            {staleShotCount === 1
              ? "One shot has been re-cut since this film was made."
              : `${staleShotCount} shots have been re-cut since this film was made.`}{" "}
            <span className="font-bold">Combine again</span> to put them in it — this video still has
            the older cuts.
          </p>
        </div>
      )}

      {film?.status === "FAILED" && (
        <p className="mt-1.5 text-[10px] font-bold text-rose-300">
          {film.lastError || "The last attempt to join the shots failed."}
        </p>
      )}

      {film?.status === "COMPLETED" && film?.videoUrl && (
        <div className="mt-3">
          <ShotCanvasPlayer
            src={film.videoUrl}
            aspectRatio={aspectRatio}
            className="mx-auto w-full max-w-md"
            label={film.published ? "Published" : "Not published yet"}
          />
        </div>
      )}
    </div>
  );
}
