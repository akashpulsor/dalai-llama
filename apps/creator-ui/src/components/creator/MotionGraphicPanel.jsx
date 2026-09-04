// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useGenerateMotionGraphicPlanMutation, useGetMotionGraphicPlanQuery } from "../../api/creatorEndpoints.js";

/** MOTION_GRAPHIC shots don't go through video-generation-service (no motion-graphics rendering
 * engine exists in this backend) -- this plans what the graphic should contain for a human
 * designer to build, instead of the video-gen prepare/approve flow. */
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
