// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, ArrowRight, Check, Film, Lightbulb, Loader2, Wand2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetShotDialogueFitQuery,
  useAdviseShotDialogueFitMutation,
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
 * <p>The opposite case renders nothing at all. A short line in a long shot plays in full; the shot
 * simply runs on afterwards, which is ordinary filmmaking and frequently the intent. Nothing is cut,
 * so there is nothing to decide and the shot is simply generated.
 *
 * <p>Which remedy suits the shot is asked of a model, because it is a judgement about craft rather
 * than arithmetic -- whether the extra seconds would still look like the film, whether the line can
 * afford to lose words. That suggestion arrives with its reasoning and selects one of the three; it
 * never adds a fourth. Only shots with a real overrun ever reach it.
 *
 * <p>Deliberately not a blocking modal and deliberately not self-repairing. A rephrase is shown
 * against the original and replaces it only on an explicit "Use this line".
 */

const VERDICT_STYLES = {
  AUDIO_LONGER: {
    tone: "border-amber-400/30 bg-amber-500/10",
    text: "text-amber-200",
    icon: AlertTriangle,
    label: "Line runs past the end of the shot",
  },
  NEEDS_REWRITE: {
    tone: "border-amber-400/30 bg-amber-500/10",
    text: "text-amber-200",
    icon: AlertTriangle,
    label: "Line runs well past the end of the shot",
  },
  UNFITTABLE: {
    tone: "border-rose-400/30 bg-rose-500/10",
    text: "text-rose-200",
    icon: AlertTriangle,
    label: "Line is too long for any clip this model can make",
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
  const [advise] = useAdviseShotDialogueFitMutation();
  const [advice, setAdvice] = React.useState(null);
  const [updateShot, updateShotState] = useUpdatePreProductionShotMutation();
  const [updateBeat] = useUpdateShotDialogueBeatMutation();
  const [retimed, setRetimed] = React.useState(null);
  const [applying, setApplying] = React.useState(false);

  // Only the cases where something is actually lost get an interface. A shot whose line fits, or
  // whose line is SHORTER than the clip, renders nothing at all: every word is heard, the shot just
  // runs on afterwards, and that is ordinary filmmaking -- so it is simply generated. A panel on
  // every shot would bury the few that need a decision.
  const style = fit && VERDICT_STYLES[fit.verdict];
  const needsDecision = !!style;

  // Asked once per flagged shot, and never for one that fits: the arithmetic upstream is free, the
  // judgement is a prompt call. It answers which remedy suits THIS shot -- whether the extra seconds
  // would still look like the film, whether the line can afford to lose words -- which is the part
  // no threshold can decide. Declared above the early return because hooks cannot be conditional;
  // `needsDecision` is what actually gates the call.
  React.useEffect(() => {
    if (!needsDecision || advice !== null || !shot?.id) return undefined;
    let cancelled = false;
    advise({ projectId, shotId: shot.id }).unwrap()
      // `false` rather than null for "asked, got nothing" -- null still means "not asked yet", and
      // conflating them would retry the call on every render.
      .then((result) => { if (!cancelled) setAdvice(result || false); })
      .catch(() => { if (!cancelled) setAdvice(false); });
    return () => { cancelled = true; };
  }, [needsDecision, advice, advise, projectId, shot?.id]);

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
      // The stored take was synthesized from the OLD words, so its length no longer describes this
      // line. The server now refuses to call that a measurement (it compares the take's text against
      // the shot's), so refetching swaps the confident number for a labelled estimate rather than
      // leaving the previous take's figures on screen looking current.
      refetch();
      // And the prompt still holds the old line until the shot is prepared again -- saving the text
      // changes the SHOT, not the prompt built from it. Without this the creator accepts a rewrite,
      // sees the panel update, generates, and gets the line they just replaced.
      onResized?.();
      dispatch(showFlash({
        message: "Line updated and the prompt rebuilt. Re-dub this shot to hear the new timing before generating.",
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
      await updateShot({ projectId, shotId: shot.id, durationSeconds: extendTo }).unwrap();
      refetch();
      // The prepared prompt carries the old duration, so it has to be rebuilt before it means
      // anything -- the parent owns that, since it also owns the prepare button's busy state.
      onResized?.(extendTo);
      dispatch(showFlash({
        message: `Shot is now ${extendTo}s. Prepare it again so the prompt matches.`,
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not change the shot's length", type: "error" }));
    }
  };

  // Only overruns reach this panel, so extending is the only resize on offer. What it costs is
  // stated on the button: clips are billed per second, and "+2s" is the part a creator is agreeing
  // to when they press it.
  // A recommended extension can exceed the blanket allowance -- that is exactly why a judgement was
  // asked for, and it is still bounded by what the model will generate and still confirmed by a
  // click. Without one, the allowance stands.
  const recommendedExtend = advice && advice.recommendation === "EXTEND"
    ? advice.recommendedDurationSeconds : null;
  const extendTo = recommendedExtend ?? (fit.verdict === "AUDIO_LONGER" ? fit.suggestedDurationSeconds : null);
  const extraSeconds = (extendTo ?? 0) - (fit.plannedDurationSeconds ?? 0);
  const canExtend = extendTo != null && extraSeconds > 0;

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
          {fit.verdict === "NEEDS_REWRITE" && (
            <p className="mt-1 text-[10px] font-medium text-amber-200/80">
              Giving this shot the {seconds(fit.requiredSeconds)} its line needs would be{" "}
              {((fit.requiredSeconds / Math.max(1, fit.plannedDurationSeconds))).toFixed(1)}× its
              length — billed per second, and added to the film's running time. Rephrasing costs
              nothing.
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

          {/* The judgement, where there is one. Shown above the buttons rather than as a fourth
              option: it recommends one of the three, it does not add a way out. The reason is the
              point -- a recommendation without one is just another button. */}
          {advice && advice.recommendation && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-white/10 bg-black/20 p-2">
              <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-[10px] font-medium leading-relaxed text-slate-300">
                <span className="font-extrabold text-slate-200">
                  {advice.recommendation === "EXTEND"
                    ? `Suggested: extend to ${advice.recommendedDurationSeconds}s`
                    : advice.recommendation === "REWRITE"
                      ? "Suggested: rephrase the line"
                      : "Suggested: generate as planned"}
                </span>
                {advice.reason ? ` — ${advice.reason}` : ""}
              </p>
            </div>
          )}

          {/* Three options, stated as three. Only the first two change anything; "go with the
              original" is a real choice rather than the absence of one, so it is a button like the
              others -- and for a line too long for any clip it is the only way past the block. */}
          <div className="mt-2 flex flex-wrap gap-2">
            {canExtend && (
              <button
                type="button"
                disabled={updateShotState.isLoading}
                onClick={handleResize}
                className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-white/30 disabled:opacity-50"
              >
                {updateShotState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
                {`Extend shot to ${extendTo}s (+${extraSeconds}s, billed)`}
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
            {onKeepOriginal && (
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
            Extending keeps the whole line but adds billed seconds to this shot and to the film.
            Rephrasing keeps both the length and the cost. Going with the original means the end of
            the line is cut.
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
