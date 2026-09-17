// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Film, Loader2, Send } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import ShotCanvasPlayer from "./ShotCanvasPlayer.jsx";
import {
  useAssembleFilmMutation,
  useGetFilmReadinessQuery,
  useGetLatestFilmQuery,
  usePublishFilmMutation,
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
  const dispatch = useDispatch();
  const { data: readiness } = useGetFilmReadinessQuery(projectId, { skip: !projectId });
  const { data: film, refetch: refetchFilm } = useGetLatestFilmQuery(projectId, { skip: !projectId });
  const [assemble] = useAssembleFilmMutation();
  const [publish, publishState] = usePublishFilmMutation();
  const [joining, setJoining] = React.useState(false);

  const ready = readiness?.ready === true;
  const missing = readiness?.missingShotRefs || [];
  const disabledReason = ready
    ? null
    : missing.length
      ? `Please generate all shots — still missing: ${missing.join(", ")}`
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
      </div>

      {!ready && disabledReason && (
        <p className="mt-1.5 text-[10px] font-bold text-amber-200/90">{disabledReason}</p>
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
