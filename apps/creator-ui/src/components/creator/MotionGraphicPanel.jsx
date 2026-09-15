// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useGenerateMotionGraphicPlanMutation, useGetMotionGraphicPlanQuery } from "../../api/creatorEndpoints.js";

/** What a MOTION_GRAPHIC shot should contain -- the concept, the on-screen text, the style and the
 * animation notes -- as a brief a human designer can build from.
 *
 * <p>It used to be ALL a motion-graphic shot got: the card showed this and stopped, on the reasoning
 * that there is no motion-graphics rendering engine in this backend. But the backend never behaved
 * that way. prepare-batch builds prompts for these shots like any other, so they accumulated
 * video_gen_jobs stuck on PENDING_APPROVAL that the page offered no way to approve, and they were
 * silently absent from the final render.
 *
 * <p>So this now sits ABOVE the ordinary prepare/approve flow rather than in place of it. The plan
 * is the brief; the video model animates the shot's MOTION_GRAPHIC still into a clip. A designer
 * replacing that clip with a properly built graphic is still the better outcome where there is time
 * for one -- this is what the film uses when there is not. */
export default function MotionGraphicPanel({ shotId }) {
  const dispatch = useDispatch();
  const { data: plan, error, refetch } = useGetMotionGraphicPlanQuery(shotId, { skip: !shotId });
  const [generatePlan, { isLoading: generating }] = useGenerateMotionGraphicPlanMutation();
  const hasPlan = Boolean(plan) && error?.status !== 404;

  const handleGenerate = async () => {
    try {
      await generatePlan(shotId).unwrap();
      refetch();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not plan this motion graphic", type: "error" }));
    }
  };

  return (
    <div className="rounded-md border border-amber-400/20 bg-amber-500/[0.04] p-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-300">
        <Sparkles size={11} />
        Motion graphic — planned, not video-generated
      </p>

      {hasPlan ? (
        <div className="space-y-1.5 text-[11px] font-medium text-slate-300">
          <p>{plan.concept}</p>
          {plan.onScreenText && <p className="text-slate-400">Text: "{plan.onScreenText}"</p>}
          {plan.visualStyle && <p className="text-slate-400">Style: {plan.visualStyle}</p>}
          {plan.animationNotes && <p className="text-slate-400">Animation: {plan.animationNotes}</p>}
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="mt-2 flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-200 disabled:opacity-60"
          >
            {generating && <Loader2 size={11} className="animate-spin" />}
            Replan
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={generating}
          onClick={handleGenerate}
          className="creator-primary flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold text-white disabled:opacity-60"
        >
          {generating && <Loader2 size={13} className="animate-spin" />}
          {generating ? "Planning…" : "Plan this motion graphic"}
        </button>
      )}
    </div>
  );
}
