// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Download, Loader2, Scissors, Upload, Volume2, Wand2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useExtendShotTailMutation,
  useGetShotClipSourcesQuery,
  useUploadShotClipMutation,
} from "../../api/creatorEndpoints.js";

/**
 * Repairing a finished clip whose dialogue does not fit it, without paying to generate it again.
 *
 * <p>Shown on any shot that has a clip and a dubbed take. Regenerating bills the whole clip a second
 * time and returns a different-looking one; everything here keeps what was already made and paid for.
 *
 * <p>The simplest case is a dub that FITS: the clip carries whatever audio the video model produced
 * -- on the native-audio path, a line it had no room for, so a fragment at the end over ambience --
 * and swapping that for the dubbed take is the whole repair. That one is always offered.
 *
 * <p>The costs are stated on the buttons because they are the whole point of offering this. Holding
 * the last frame bills nothing. Generating a tail bills only the seconds added, with a cheaper model
 * than the shot itself used. Downloading to fix by hand bills nothing and is the way out when
 * neither automatic repair produces something worth shipping.
 */
const seconds = (v) => `${Number(v ?? 0).toFixed(1)}s`;

export default function ClipRepairPanel({ shot, projectId, onRepaired }) {
  const dispatch = useDispatch();
  const { data: sources, refetch } = useGetShotClipSourcesQuery(
    { projectId, shotId: shot?.id },
    { skip: !projectId || !shot?.id },
  );
  const [extendTail, extendState] = useExtendShotTailMutation();
  const [uploadClip, uploadState] = useUploadShotClipMutation();
  const fileRef = React.useRef(null);

  const clip = sources?.clipSeconds;
  const audio = sources?.audioSeconds;
  const shortfall = clip != null && audio != null ? audio - clip : null;
  // Shown whenever there is a clip and a dubbed take. It used to require the dub to OVERRUN, which
  // hid the simplest repair of all: a dub that fits a clip still carrying the video model's own
  // audio, where swapping the sound is the whole fix and costs nothing.
  if (!sources?.clipUrl || !sources?.audioUrl || shortfall == null) return null;

  const overruns = shortfall > 0.05;
  const needed = Math.max(1, Math.ceil(shortfall));

  const runExtend = async (mode) => {
    try {
      const result = await extendTail({ projectId, shotId: shot.id, mode }).unwrap();
      dispatch(showFlash({
        message: `Clip is now ${seconds(result.seconds)} and carries the whole line.`,
        type: "success",
      }));
      refetch();
      onRepaired?.(result);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not extend the clip", type: "error" }));
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadClip({ projectId, shotId: shot.id, file }).unwrap();
      dispatch(showFlash({ message: `Your clip is in — ${seconds(result.seconds)}.`, type: "success" }));
      refetch();
      onRepaired?.(result);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not upload that clip", type: "error" }));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const busy = extendState.isLoading || uploadState.isLoading;

  return (
    <div className="rounded-md border border-amber-400/25 bg-amber-500/[0.05] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Scissors size={13} className="text-amber-300" />
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-200">
          {overruns ? "The line does not fit this clip" : "Put the dubbed voice on this clip"}
        </p>
      </div>
      <p className="text-[11px] font-medium leading-relaxed text-slate-300">
        {overruns ? (
          <>
            The dubbed take runs <strong>{seconds(audio)}</strong> but the clip is{" "}
            <strong>{seconds(clip)}</strong> — the last <strong>{seconds(shortfall)}</strong> of the
            line is cut off. Regenerating bills the whole shot again; these keep the clip you have.
          </>
        ) : (
          <>
            The dubbed take runs <strong>{seconds(audio)}</strong> and fits this{" "}
            <strong>{seconds(clip)}</strong> clip. Putting it on replaces whatever audio the video
            model produced — no regeneration, nothing billed.
          </>
        )}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {/* Always offered: it drops the model's own audio and lays the dub on instead, which on a
            shot generated with native audio is usually the entire fix. */}
        <button
          type="button"
          disabled={busy}
          onClick={() => runExtend("REPLACE_AUDIO")}
          className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 hover:border-purple-400/50 disabled:opacity-50"
        >
          {extendState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Volume2 size={11} />}
          Use dubbed voice (free)
        </button>
        {overruns && (
        <>
        <button
          type="button"
          disabled={busy}
          onClick={() => runExtend("HOLD")}
          className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-white/30 disabled:opacity-50"
        >
          {extendState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Scissors size={11} />}
          {`Hold last frame +${needed}s (free)`}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => runExtend("GENERATE")}
          className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-white/30 disabled:opacity-50"
        >
          {extendState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
          {`Generate +${needed}s tail (${needed}s billed)`}
        </button>
        </>
        )}
      </div>

      {/* The manual route. Deliberately plain links rather than a flow: the point is to get the two
          files out of the system and let the creator use whatever they already work in. */}
      <div className="mt-2.5 border-t border-white/10 pt-2">
        <p className="text-[10px] font-medium text-slate-500">Or fix it yourself:</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <a
            href={sources.clipUrl}
            download={`${shot.shotRef || "shot"}.mp4`}
            className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200"
          >
            <Download size={11} /> Video
          </a>
          {sources.audioUrl && (
            <a
              href={sources.audioUrl}
              download={`${shot.shotRef || "shot"}-dialogue.mp3`}
              className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200"
            >
              <Download size={11} /> Dialogue
            </a>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-purple-400/40 disabled:opacity-50"
          >
            {uploadState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            {uploadState.isLoading ? "Uploading…" : "Upload finished clip"}
          </button>
          <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {sources.outputOrigin && sources.outputOrigin !== "GENERATED" && (
        <p className="mt-2 text-[10px] font-medium italic text-slate-400">
          This clip was already repaired ({sources.outputOrigin.toLowerCase().replace("_", " ")}).
          Regenerating the shot would replace it.
        </p>
      )}
    </div>
  );
}
