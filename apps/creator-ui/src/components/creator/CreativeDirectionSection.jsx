import React from "react";
import { useDispatch } from "react-redux";
import { ArrowRight, CheckCircle2, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useAddCreativeDirectionFeedbackMutation,
  useApproveCreativeDirectionMutation,
  useGenerateCreativeDirectionsMutation,
  useGetCreativeDirectionsQuery,
  useReviseCreativeDirectionMutation,
  useSelectCreativeDirectionMutation,
} from "../../api/creatorEndpoints.js";
import CreativeDirectionCard, { DirectionFeedbackForm } from "../creativeDirection/CreativeDirectionCard.jsx";

/**
 * Creative Direction -- between the locked idea and the script. Three director's treatments for the
 * idea (the AI's recommendation first, with its reason), each reviewable, revisable and approvable;
 * the approved one becomes the creative contract every later stage is generated from. Projects
 * created before this stage existed (board.required === false) may use it but are never blocked.
 */
export default function CreativeDirectionSection({ projectId, onContinue }) {
  const dispatch = useDispatch();
  const { data: board, isLoading, isError, error, refetch } = useGetCreativeDirectionsQuery(projectId, { skip: !projectId });
  const [generate, { isLoading: generating }] = useGenerateCreativeDirectionsMutation();
  const [select] = useSelectCreativeDirectionMutation();
  const [addFeedback, { isLoading: sendingFeedback }] = useAddCreativeDirectionFeedbackMutation();
  const [revise, { isLoading: revising, originalArgs: revisingArgs }] = useReviseCreativeDirectionMutation();
  const [approve, { isLoading: approving, originalArgs: approvingArgs }] = useApproveCreativeDirectionMutation();

  const flash = (message, type = "error") => dispatch(showFlash({ message, type }));
  const run = async (action, success) => {
    try {
      await action();
      if (success) flash(success, "success");
      return true;
    } catch (err) {
      flash(err?.data?.message || err?.data?.detail || "That didn't work -- please try again");
      return false;
    }
  };

  if (isLoading) {
    return <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">Loading creative direction…</p>;
  }
  if (isError) {
    return (
      <div className="creator-panel mt-6 space-y-3 p-6 text-center">
        <p className="text-xs font-semibold text-rose-300">{error?.data?.message || "Could not load creative direction."}</p>
        <button type="button" onClick={refetch} className="creator-control px-3 py-1.5 text-[11px] font-bold text-slate-200">Retry</button>
      </div>
    );
  }

  const approved = board?.approved;
  const directions = board?.directions || [];
  const handleGenerate = () => run(() => generate(projectId).unwrap(),
    directions.length ? "New alternatives are ready" : "Three creative directions are ready");

  return (
    <section className="mt-6 space-y-4">
      <div className="creator-panel p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Creative direction</p>
        <h2 className="mt-1 text-lg font-bold text-white">How should this idea be told?</h2>
        <p className="mt-1 text-[12.5px] font-medium text-slate-400">
          Three director's treatments for the locked idea. Approve one and it travels with the idea into the hook,
          script, screenplay, shot plan, camera plan and production frames.
          {!board?.required && " This project was created before creative direction existed, so it is optional here."}
        </p>
        {board?.idea && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[12px] text-slate-300">
            <p className="font-bold text-white">{board.idea.title}</p>
            {board.idea.concept && <p className="mt-0.5">{board.idea.concept}</p>}
            {board.briefText && <p className="mt-1.5 text-slate-500">Brief: {board.briefText}</p>}
            {board.durationSeconds && <p className="mt-0.5 text-slate-500">Target: {board.durationSeconds} seconds</p>}
          </div>
        )}
        <button
          type="button"
          disabled={generating}
          onClick={handleGenerate}
          className="creator-primary mt-4 flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : directions.length ? <RefreshCw size={14} /> : <Sparkles size={14} />}
          {generating ? "Writing three treatments… (up to a minute)" : directions.length ? "Generate new alternatives" : "Generate creative directions"}
        </button>
        {directions.length > 0 && approved && (
          <p className="mt-2 text-[11px] font-medium text-slate-500">New alternatives never replace the approved direction until you approve one of them.</p>
        )}
      </div>

      {approved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-400/25 bg-emerald-500/[0.07] p-4">
          <p className="flex items-center gap-2 text-[12.5px] font-bold text-emerald-200">
            <CheckCircle2 size={15} /> Approved: {approved.title}
            {approved.approvedVia === "CLIENT" && <span className="font-medium text-emerald-300/80">(approved by the client)</span>}
          </p>
          {onContinue && (
            <button type="button" onClick={onContinue} className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-100">
              Generate the script from it <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {directions.length === 0 && !generating && (
        <p className="creator-panel p-6 text-center text-xs font-semibold text-slate-500">
          No creative directions yet. Generate them to choose how this idea will be made.
        </p>
      )}

      {approved && !directions.some((direction) => direction.id === approved.id) && (
        <CreativeDirectionCard direction={approved} />
      )}

      {directions.map((direction) => {
        const isApproved = direction.reviewStatus === "APPROVED";
        const thisRevising = revising && revisingArgs?.directionId === direction.id;
        const thisApproving = approving && approvingArgs?.directionId === direction.id;
        return (
          <CreativeDirectionCard key={direction.id} direction={direction} highlighted={direction.recommended && !approved}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {!isApproved && direction.reviewStatus !== "SELECTED" && (
                  <button
                    type="button"
                    onClick={() => run(() => select({ projectId, directionId: direction.id }).unwrap())}
                    className="creator-control px-3 py-1.5 text-[11px] font-bold text-slate-200"
                  >
                    Select for review
                  </button>
                )}
                <button
                  type="button"
                  disabled={thisRevising}
                  onClick={() => run(() => revise({ projectId, directionId: direction.id }).unwrap(), "Revised treatment is ready")}
                  className="creator-control flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-200 disabled:opacity-60"
                  title="Rewrite this treatment against the review notes"
                >
                  {thisRevising ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {thisRevising ? "Revising…" : "Revise with the notes"}
                </button>
                {!isApproved && (
                  <button
                    type="button"
                    disabled={thisApproving}
                    onClick={() => run(() => approve({ projectId, directionId: direction.id }).unwrap(), `Approved "${direction.title}"`)}
                    className="creator-primary flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                  >
                    {thisApproving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    {thisApproving ? "Approving…" : "Approve this direction"}
                  </button>
                )}
              </div>
              <DirectionFeedbackForm
                busy={sendingFeedback}
                onSubmit={(body) => run(() => addFeedback({ projectId, directionId: direction.id, ...body }).unwrap(), "Feedback saved")}
              />
            </div>
          </CreativeDirectionCard>
        );
      })}
    </section>
  );
}
