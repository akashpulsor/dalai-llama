// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { ArrowDown, ArrowUp, Check, Loader2, TriangleAlert } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useLazyGetShotReorderImpactQuery,
  useReorderShotMutation,
} from "../../api/creatorEndpoints.js";

/**
 * Moving a shot, with the consequences stated before it moves.
 *
 * <p>Reordering is usually harmless and occasionally destroys the edit, and no rule can tell those
 * apart -- moving a call-to-action card off the end takes the landing away from the whole ad, moving
 * a B-roll cutaway one place earlier changes nothing anyone could name. So the answer is asked of a
 * model, asked BEFORE the move, and shown as three separate things because they cost different
 * amounts to put right: the story, the shots either side, and anything already generated.
 *
 * <p>The move itself changes only position. Not the script, not the shot descriptions, not a single
 * clip -- a creator reordering their edit is not asking for their plan to be rewritten, and a tool
 * that quietly re-planned underneath them would be useless for exactly the case it exists for.
 * Generated video follows on its own, because clips are keyed to a shot rather than to a place in
 * the running order.
 *
 * <p>"This is fine" is a real answer here, not a fallback. A tool that always finds a concern is one
 * people learn to click past.
 */

const VERDICT = {
  SAFE: {
    tone: "border-emerald-400/30 bg-emerald-500/[0.07]",
    text: "text-emerald-200",
    icon: Check,
    label: "This move is fine",
  },
  REVIEW: {
    tone: "border-amber-400/30 bg-amber-500/[0.07]",
    text: "text-amber-200",
    icon: TriangleAlert,
    label: "Worth knowing before you move it",
  },
  BREAKS: {
    tone: "border-rose-400/30 bg-rose-500/[0.07]",
    text: "text-rose-200",
    icon: TriangleAlert,
    label: "This breaks the film's ending",
  },
};

export default function ShotReorderControl({ shot, projectId, totalShots, onReordered }) {
  const dispatch = useDispatch();
  const [fetchImpact, impactState] = useLazyGetShotReorderImpactQuery();
  const [reorder, reorderState] = useReorderShotMutation();
  const [pending, setPending] = React.useState(null);

  const position = shot?.shotNumber;
  const canMoveUp = position > 1;
  const canMoveDown = position < totalShots;

  /** Asks what the move would do. Nothing has moved at this point. */
  const propose = async (target) => {
    setPending({ target, impact: null });
    try {
      const impact = await fetchImpact({ projectId, shotId: shot.id, position: target }).unwrap();
      setPending({ target, impact });
    } catch {
      // An opinion we could not get must not stop a creator reordering their own film.
      setPending({ target, impact: { available: false, summary: "Could not check what this would do — you can still move it." } });
    }
  };

  const confirm = async () => {
    try {
      await reorder({ projectId, shotId: shot.id, position: pending.target }).unwrap();
      dispatch(showFlash({
        message: `Moved to position ${pending.target}. Nothing else was changed.`,
        type: "success",
      }));
      setPending(null);
      onReordered?.();
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || "Could not move this shot",
        type: "error",
      }));
    }
  };

  const style = pending?.impact?.verdict ? VERDICT[pending.impact.verdict] : null;
  const Icon = style?.icon;

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-500">Position {position}</span>
        <button
          type="button"
          disabled={!canMoveUp || impactState.isFetching || reorderState.isLoading}
          onClick={() => propose(position - 1)}
          title="Move earlier in the film"
          className="rounded border border-white/10 p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
        >
          <ArrowUp size={11} />
        </button>
        <button
          type="button"
          disabled={!canMoveDown || impactState.isFetching || reorderState.isLoading}
          onClick={() => propose(position + 1)}
          title="Move later in the film"
          className="rounded border border-white/10 p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
        >
          <ArrowDown size={11} />
        </button>
        {impactState.isFetching && <Loader2 size={11} className="animate-spin text-slate-500" />}
      </div>

      {pending && (
        <div className={`mt-2 rounded-md border p-2.5 ${style?.tone || "border-white/10 bg-white/[0.03]"}`}>
          <div className="flex items-start gap-1.5">
            {Icon && <Icon size={12} className={`mt-0.5 shrink-0 ${style.text}`} />}
            <div className="min-w-0 flex-1">
              <p className={`text-[11px] font-extrabold ${style?.text || "text-slate-300"}`}>
                {style?.label || "Moving this shot"}
              </p>
              {pending.impact?.summary && (
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-300">
                  {pending.impact.summary}
                </p>
              )}

              {/* Three separate answers, because they cost different amounts to put right. Only
                  shown when there is something to say -- an empty heading is noise. */}
              {pending.impact?.storyImpact && (
                <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-slate-400">
                  <span className="font-extrabold text-slate-300">Story: </span>
                  {pending.impact.storyImpact}
                </p>
              )}
              {pending.impact?.shotPlanImpact && (
                <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400">
                  <span className="font-extrabold text-slate-300">Shot plan: </span>
                  {pending.impact.shotPlanImpact}
                </p>
              )}
              {pending.impact?.videoImpact && (
                <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400">
                  <span className="font-extrabold text-slate-300">Video: </span>
                  {pending.impact.videoImpact}
                </p>
              )}

              <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-slate-500">
                {pending.impact?.requiresReplanning
                  ? "Moving it will NOT rewrite anything. If the wording needs to change to suit the new order, that stays yours to do."
                  : "Only the order changes. The script, the shot descriptions and every clip already generated stay exactly as they are — the videos just move with their shots."}
              </p>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={reorderState.isLoading}
                  onClick={confirm}
                  className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 disabled:opacity-50"
                >
                  {reorderState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Move to position {pending.target}
                </button>
                <button
                  type="button"
                  disabled={reorderState.isLoading}
                  onClick={() => setPending(null)}
                  className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 disabled:opacity-50"
                >
                  Leave it where it is
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
