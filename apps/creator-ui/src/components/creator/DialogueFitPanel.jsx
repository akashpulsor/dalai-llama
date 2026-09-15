// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, ArrowRight, Check, Clock, Film, Loader2, Scissors, Wand2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetShotDialogueFitQuery,
  useRetimeShotDialogueMutation,
  useUpdatePreProductionShotMutation,
  useUpdateShotDialogueBeatMutation,
} from "../../api/creatorEndpoints.js";

/**
 * Whether this shot's spoken line fits the clip it is about to be generated into, and the choice of
 * what to do when it does not: extend the shot, rephrase the dialogue, or go with the original.
 *
 * <p>It sits before "Approve & generate" because that is the last moment any of it is free. Once the
 * clip is rendered the outcome is baked in and paid for.
 *
 * <p>The failure this exists for is audio being CUT. Generation is multimodal, so a line longer than
 * its clip comes back severed mid-word -- the model speaks what fits and stops, or the dub is pinned
 * to the video length and the rest is dropped. Nothing downstream can recover it.
 *
 * <p>The opposite case is NOT that failure and is not presented as one. A short line in a long shot
 * plays in full; the shot simply runs on, which is ordinary filmmaking and frequently the intent.
 * It is shown only because clips are billed by the second, so the spare seconds are worth offering
 * back -- a neutral note with a trim button, never a warning.
 *
 * <p>Deliberately not a blocking modal and deliberately not self-repairing. Whether silence after a
 * line is a mistake or a held beat is not something a duration comparison can know, so this states
 * what is true and lets the creator decide. A rephrase is shown against the original and replaces it
 * only on an explicit "Use this line".
 */

const VERDICT_STYLES = {
  AUDIO_LONGER: {
    tone: "border-amber-400/30 bg-amber-500/10",
    text: "text-amber-200",
    icon: AlertTriangle,
    label: "Line runs past the end of the shot",
  },
  UNFITTABLE: {
    tone: "border-rose-400/30 bg-rose-500/10",
    text: "text-rose-200",
    icon: AlertTriangle,
    label: "Line is too long for any clip this model can make",
  },
  // Not a warning. Every word is heard; the shot just runs on afterwards, which is ordinary
  // filmmaking. Styled as a neutral note so it cannot be mistaken for the case that breaks a render.
  AUDIO_SHORTER: {
    tone: "border-white/10 bg-white/[0.03]",
    text: "text-slate-300",
    icon: Clock,
    label: "Shot runs on after the line ends",
  },
};

const seconds = (value) => `${Number(value ?? 0).toFixed(1)}s`;

/** Frames, not just seconds: a frame is the smallest gap between sound and picture that can be acted
 * on, so it is the honest unit for "how far out is this". Seconds alongside it, because that is what
 * a creator feels. */
function Misfit({ fit }) {
  const overrun = fit.slackFrames < 0;
  const magnitude = Math.abs(fit.slackSeconds);
  const frames = Math.abs(fit.slackFrames);
  return (
    <span>
      {overrun ? "Overruns by " : "Silence of "}
      <strong>{seconds(magnitude)}</strong> ({frames} {frames === 1 ? "frame" : "frames"} at {fit.fps}fps
      {fit.fpsAssumed ? ", assumed" : ""})
    </span>
  );
}

function RewritePreview({ retimed, onUse, onDismiss, applying }) {
  return (
    <div className="mt-2 rounded-md border border-white/10 bg-black/30 p-2.5">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Suggested rewrite</p>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-200">{retimed.rewritten}</p>
      {retimed.whatChanged && (
        <p className="mt-1.5 text-[10px] font-medium italic text-slate-400">{retimed.whatChanged}</p>
      )}
      <p className="mt-1.5 text-[10px] font-medium text-slate-500">
        {retimed.direction === "KEEP"
          ? "Judged already close to the target and left alone."
          : `Should run about ${seconds(retimed.predictedSeconds)}, against a target of ${seconds(retimed.targetSeconds)} — down from ${seconds(retimed.currentSeconds)}.`}{" "}
        {retimed.rateFromAudio
          ? "Projected from this voice's own measured speaking rate, so it is close but not certain — re-dub the shot to know."
          : "Projected from a default speaking rate, because nothing in this project has been dubbed yet — treat it loosely."}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={applying}
          onClick={onUse}
          className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 disabled:opacity-50"
        >
          {applying ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          {applying ? "Saving…" : "Use this line"}
        </button>
        <button
          type="button"
          disabled={applying}
          onClick={onDismiss}
          className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 disabled:opacity-50"
        >
          Keep mine
        </button>
      </div>
    </div>
  );
}

export default function DialogueFitPanel({ shot, projectId, onResized, onKeepOriginal }) {
  const dispatch = useDispatch();
  const { data: fit, isLoading, refetch } = useGetShotDialogueFitQuery(
    { projectId, shotId: shot?.id },
    { skip: !projectId || !shot?.id },
  );
  const [retime, retimeState] = useRetimeShotDialogueMutation();
  const [updateShot, updateShotState] = useUpdatePreProductionShotMutation();
  const [updateBeat] = useUpdateShotDialogueBeatMutation();
  const [retimed, setRetimed] = React.useState(null);
  const [applying, setApplying] = React.useState(false);

  // A shot whose line and clip agree needs no interface. Same for one with nothing spoken in it --
  // a row that says "nothing to check" on every shot buries the few that need a decision.
  const style = fit && VERDICT_STYLES[fit.verdict];
  if (isLoading || !fit || !style) return null;

  const Icon = style.icon;
  // The beat whose text a rewrite would replace. With beats broken out, the last one to be spoken is
  // the one carrying the overrun or leaving the silence; with none, the shot's own voice-over is the
  // line. Either way the rewrite targets exactly one piece of text, never a guess spread across
  // several -- redistributing a rewrite across beats would change timings nobody asked to change.
  const lastBeat = fit.beats?.length
    ? fit.beats.reduce((latest, beat) => (beat.startSeconds >= (latest?.startSeconds ?? -1) ? beat : latest), null)
    : null;
  const lineToRewrite = lastBeat?.text || fit.dialogue;

  const handleRewrite = async () => {
    setRetimed(null);
    try {
      const result = await retime({
        projectId,
        dialogue: lineToRewrite,
        // Straight from the report: already allows for the breath after the last word and already
        // snapped to this shot's frame grid. Recomputing it here would be a second opinion on the
        // same question, and the two would drift.
        targetSeconds: fit.suggestedTargetAudioSeconds,
        shotId: shot.id,
        beatId: lastBeat?.beatId,
      }).unwrap();
      setRetimed(result);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not rewrite the line to length", type: "error" }));
    }
  };

  const handleUseRewrite = async () => {
    setApplying(true);
    try {
      if (lastBeat?.beatId) {
        // Beats carry their own placement, so the PUT has to restate it -- sending only the text
        // would reset this beat's position in the shot to whatever the server defaults to.
        await updateBeat({
          shotId: shot.id,
          beatId: lastBeat.beatId,
          projectId,
          orderIndex: lastBeat.orderIndex,
          startSeconds: lastBeat.startSeconds,
          durationSeconds: lastBeat.plannedSeconds ?? undefined,
          text: retimed.rewritten,
          characterKey: lastBeat.characterKey ?? undefined,
        }).unwrap();
      } else {
        await updateShot({ projectId, shotId: shot.id, voiceOver: retimed.rewritten }).unwrap();
      }
      setRetimed(null);
      // The stored length is now a measurement of the OLD line, so the fit figures are stale until
      // the shot is re-dubbed. Refetching says so honestly (the report falls back to an estimate)
      // rather than leaving the previous take's numbers on screen looking current.
      refetch();
      dispatch(showFlash({
        message: "Line updated. Re-dub this shot to hear the new timing before generating.",
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the new line", type: "error" }));
    } finally {
      setApplying(false);
    }
  };

  const handleResize = async () => {
    try {
      await updateShot({ projectId, shotId: shot.id, durationSeconds: fit.suggestedDurationSeconds }).unwrap();
      refetch();
      // The prepared prompt carries the old duration, so it has to be rebuilt before it means
      // anything -- the parent owns that, since it also owns the prepare button's busy state.
      onResized?.(fit.suggestedDurationSeconds);
      dispatch(showFlash({
        message: `Shot is now ${fit.suggestedDurationSeconds}s. Prepare it again so the prompt matches.`,
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not change the shot's length", type: "error" }));
    }
  };

  const resizeLabel = fit.verdict === "AUDIO_SHORTER"
    ? `Shorten shot to ${fit.suggestedDurationSeconds}s`
    : `Extend shot to ${fit.suggestedDurationSeconds}s`;

  return (
    <div className={`rounded-md border p-3 ${style.tone}`}>
      <div className="flex items-start gap-2">
        <Icon size={14} className={`mt-0.5 shrink-0 ${style.text}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-extrabold ${style.text}`}>{style.label}</p>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-300">
            The line needs <strong>{seconds(fit.requiredSeconds)}</strong> in a shot planned for{" "}
            <strong>{fit.plannedDurationSeconds}s</strong>. <Misfit fit={fit} />.
          </p>
          {!fit.measured && (
            <p className="mt-1 text-[10px] font-medium italic text-slate-400">
              Estimated from the text — this shot has not been dubbed yet, and speaking rate varies by
              language and voice. Dub it for a real measurement.
            </p>
          )}
          {fit.verdict === "UNFITTABLE" && (
            <p className="mt-1 text-[10px] font-medium text-rose-200/80">
              No clip length can hold this line, so generating it now would produce a shot that is cut
              off mid-word. Shorten it, or split it across two shots.
            </p>
          )}
          {fit.overlaps?.length > 0 && (
            <p className="mt-1 text-[10px] font-medium text-amber-200/80">
              {fit.overlaps.length === 1 ? "One line starts" : `${fit.overlaps.length} lines start`} before the
              previous one has finished speaking, so the delivery will run late against the picture.
              Move {fit.overlaps.length === 1 ? "its" : "their"} start time later in the beats editor.
            </p>
          )}

          {/* Three options, stated as three. Only the first two change anything; "go with the
              original" is a real choice rather than the absence of one, so it is a button like the
              others -- and for a line too long for any clip it is the only way past the block. */}
          <div className="mt-2 flex flex-wrap gap-2">
            {fit.suggestedDurationSeconds != null && fit.verdict !== "UNFITTABLE" && (
              <button
                type="button"
                disabled={updateShotState.isLoading}
                onClick={handleResize}
                className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-white/30 disabled:opacity-50"
              >
                {updateShotState.isLoading
                  ? <Loader2 size={11} className="animate-spin" />
                  : fit.verdict === "AUDIO_SHORTER" ? <Scissors size={11} /> : <ArrowRight size={11} />}
                {resizeLabel}
              </button>
            )}
            {lineToRewrite && fit.suggestedTargetAudioSeconds != null && (
              <button
                type="button"
                disabled={retimeState.isLoading}
                onClick={handleRewrite}
                className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-white/30 disabled:opacity-50"
              >
                {retimeState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                {retimeState.isLoading
                  ? "Rewriting…"
                  : `Rephrase dialogue for ${seconds(fit.suggestedTargetAudioSeconds)}`}
              </button>
            )}
            {onKeepOriginal && fit.verdict !== "AUDIO_SHORTER" && (
              <button
                type="button"
                onClick={onKeepOriginal}
                title="Generate at the planned length and with the line as written."
                className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200"
              >
                <Film size={11} />
                Go with the original
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-slate-500">
            {fit.verdict === "AUDIO_SHORTER"
              ? "Nothing is wrong with this shot — the whole line is heard. Shortening it only saves the seconds you are billed for; if the silence is a beat the shot needs, leave it."
              : "Extending the shot keeps the whole line but costs more per second. Rephrasing keeps the length and the cost. Going with the original means the line will be hurried or cut where it overruns."}
          </p>

          {retimed && (
            <RewritePreview
              retimed={retimed}
              applying={applying}
              onUse={handleUseRewrite}
              onDismiss={() => setRetimed(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
