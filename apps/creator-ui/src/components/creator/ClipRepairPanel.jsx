// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Download, Loader2, Scissors, Upload, Volume2, VolumeX, Wand2 } from "lucide-react";
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
 * <p>The costs are stated on the buttons because they are the whole point of offering this. Freezing
 * the last frame debits nothing -- it is ffmpeg on infrastructure already paid for, not free. Generating a tail bills only the seconds added, with a cheaper model
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
  const [showMore, setShowMore] = React.useState(false);

  const clip = sources?.clipSeconds;
  const audio = sources?.audioSeconds;
  const shortfall = clip != null && audio != null ? audio - clip : null;
  // Shown whenever there is a clip and a dubbed take. It used to require the dub to OVERRUN, which
  // hid the simplest repair of all: a dub that fits a clip still carrying the video model's own
  // audio, where swapping the sound is the whole fix and costs nothing.
  if (!sources?.clipUrl) return null;

  const hasDub = !!sources.audioUrl && audio != null;
  const overruns = hasDub && shortfall != null && shortfall > 0.05;
  // Sized to whichever is longer: what the dialogue needs, or what the shot is now planned for.
  // The plan was ignored, so a creator who lengthened a 4s shot to 5s and came here got a tail cut
  // to the audio -- a clip that no longer matched the length they had just set, with nothing saying
  // why. The shot's length is a decision someone made; the audio is a measurement. Honour both.
  const plannedShortfall = shot?.durationSeconds != null && clip != null
    ? shot.durationSeconds - clip : null;
  const audioNeeded = hasDub && shortfall != null ? Math.ceil(shortfall) : 0;
  const needed = Math.max(1, audioNeeded, plannedShortfall != null ? Math.ceil(plannedShortfall) : 0);
  const forPlan = plannedShortfall != null && Math.ceil(plannedShortfall) > audioNeeded;

  const runExtend = async (mode) => {
    try {
      const result = await extendTail({
        projectId,
        shotId: shot.id,
        mode,
        // Stated rather than left to the server, which sizes from the audio alone and knows
        // nothing about a length the creator has since changed.
        tailSeconds: mode === "GENERATE" || mode === "HOLD" ? needed : undefined,
      }).unwrap();
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

  // One action, not a menu. The creator's goal is always the same -- the voice and the picture
  // should match -- and which ffmpeg call gets them there is not a decision worth making. So the
  // situation picks the action, the button says what it will do and what it costs, and everything
  // else lives behind "other ways" for the cases where the obvious answer is not the right one.
  const plan = !hasDub
    ? { mode: "SILENCE", label: `Remove the invented voice → ${seconds(clip)} silent clip`, cost: "no model cost" }
    : !overruns && !forPlan
      ? { mode: "REPLACE_AUDIO", label: `Use the dubbed voice → ${seconds(clip)} clip`, cost: "no model cost" }
      : { mode: "GENERATE", label: `Extend to ${seconds((clip ?? 0) + needed)} and use the dubbed voice`, cost: `${needed}s billed` };

  return (
    <div className="rounded-md border border-amber-400/25 bg-amber-500/[0.05] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Scissors size={13} className="text-amber-300" />
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-200">
          {overruns
            ? "The voice is longer than the picture"
            : forPlan
              ? "The clip is shorter than the shot is now planned for"
              : hasDub ? "The dubbed voice is not on this clip" : "This clip's audio was invented"}
        </p>
      </div>
      <p className="text-[11px] font-medium leading-relaxed text-slate-300">
        {!hasDub
          ? `Nothing is spoken in this shot, but it was generated with the video model's own audio — so whatever you hear, nobody wrote it.`
          : overruns
            ? `The dubbed take runs ${seconds(audio)} and the clip is ${seconds(clip)}. The shot needs ${needed}s more picture to carry the whole line.`
            : forPlan
              ? `The dubbed take fits, but this shot is now planned for ${shot.durationSeconds}s and the clip is only ${seconds(clip)}. Extending adds the missing seconds to the clip you already have, then lays the dubbed voice over the whole thing — the clip's own audio is dropped, not mixed under it.`
              : `The dubbed take runs ${seconds(audio)} and fits this ${seconds(clip)} clip — it just is not on it yet.`}
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => runExtend(plan.mode)}
        className="creator-primary mt-2 flex w-full items-center justify-center gap-2 py-2 text-[11px] font-bold text-white disabled:opacity-60"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
        {busy ? "Fixing…" : `${plan.label} (${plan.cost})`}
      </button>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300"
      >
        {showMore ? "Fewer options" : "Other ways"}
      </button>

      {showMore && (
        <div className="mt-1.5 space-y-2 border-t border-white/10 pt-2">
          {(overruns || forPlan) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runExtend("HOLD")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 hover:text-slate-100 disabled:opacity-50"
            >
              <Scissors size={11} />
              {`Freeze the last frame instead → ${seconds((clip ?? 0) + needed)}, no model cost`}
            </button>
          )}
          {hasDub && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runExtend("SILENCE")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 hover:text-slate-100 disabled:opacity-50"
            >
              <VolumeX size={11} /> Drop the voice and leave it silent
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-medium text-slate-500">Do it yourself:</span>
            <a href={sources.clipUrl} download={`${shot.shotRef || "shot"}.mp4`}
               className="flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200">
              <Download size={11} /> Video
            </a>
            {hasDub && (
              <a href={sources.audioUrl} download={`${shot.shotRef || "shot"}-dialogue.mp3`}
                 className="flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200">
                <Download size={11} /> Dialogue
              </a>
            )}
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-50">
              {uploadState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              {uploadState.isLoading ? "Uploading…" : "Upload finished clip"}
            </button>
            <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
