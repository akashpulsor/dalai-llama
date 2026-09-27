// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Music, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateProjectScoreMutation,
  useGetMusicPlanQuery,
  usePlanMusicMutation,
  useRecomposeMusicMasterPromptMutation,
  useUpdateMusicMasterPromptMutation,
} from "../../api/creatorEndpoints.js";

/**
 * The score for the whole video, as one composition.
 *
 * <p>This is deliberately not the per-shot background-music control (that still exists on each
 * shot card). Planning here runs across the complete timeline and returns sections whose
 * boundaries follow the story, so six shots inside one emotional beat are one section rather than
 * six unrelated cues.
 *
 * <p>Planning and generating are separate buttons because they cost differently: planning is a
 * text call you can re-run while tuning the prompt, generating is billable audio.
 */
const fmt = (n) => (n == null ? "?" : Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(1));

export default function MusicPlanPanel({ projectId, shotsReady }) {
  const dispatch = useDispatch();
  const { data: plan, isLoading, error } = useGetMusicPlanQuery(projectId, { skip: !projectId });
  const [planMusic, { isLoading: planning }] = usePlanMusicMutation();
  const [updatePrompt, { isLoading: savingPrompt }] = useUpdateMusicMasterPromptMutation();
  const [recompose, { isLoading: recomposing }] = useRecomposeMusicMasterPromptMutation();
  const [generate, { isLoading: generating }] = useGenerateProjectScoreMutation();

  const [prompt, setPrompt] = useState("");
  // Model override is a registered model id, not a provider. Blank uses whatever the deployment
  // is configured with, which is the normal case.
  const [modelOverride, setModelOverride] = useState("");
  useEffect(() => { setPrompt(plan?.masterPrompt ?? ""); }, [plan?.masterPrompt]);

  const notPlannedYet = error?.status === 404;
  const dirty = plan?.masterPrompt != null && prompt !== plan.masterPrompt;

  const run = async (action, arg, message) => {
    try {
      await action(arg).unwrap();
      dispatch(showFlash({ message, type: "success" }));
    } catch (err) {
      dispatch(showFlash({
        message: err?.data?.message || "Could not do that to the score",
        type: "error",
      }));
    }
  };

  if (isLoading) return null;

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
            <Music size={13} /> Score
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            One continuous piece for the whole video — sections follow the story, not the cuts
          </p>
        </div>
        <button
          type="button"
          disabled={planning || !shotsReady}
          onClick={() => run(planMusic, projectId, "Planned the score across the whole video.")}
          title={shotsReady ? undefined : "Generate the shot list first — the score is planned against a fixed timeline"}
          className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {planning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {planning ? "Planning…" : plan ? "Re-plan" : "Plan the score"}
        </button>
      </div>

      {notPlannedYet && (
        <p className="text-[11px] font-medium text-slate-500">
          No score planned yet. Planning reads the script, the scenes and the fixed shot timeline
          (including where dialogue falls) and designs one evolving composition.
        </p>
      )}

      {plan && (
        <>
          {plan.globalIdentity && (
            <div className="mb-3 rounded-md border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                Musical identity — held across the whole film
              </p>
              <p className="text-[11px] font-medium text-slate-300">
                {[plan.globalIdentity.genre, plan.globalIdentity.overallTone].filter(Boolean).join(" · ")}
                {plan.globalIdentity.bpm ? ` · ${plan.globalIdentity.bpm} BPM` : ""}
                {plan.globalIdentity.keyOrScale ? ` · ${plan.globalIdentity.keyOrScale}` : ""}
              </p>
              {plan.globalIdentity.motif && (
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Motif: <span className="text-slate-200">{plan.globalIdentity.motif}</span>
                  {plan.globalIdentity.motifDescription ? ` — ${plan.globalIdentity.motifDescription}` : ""}
                </p>
              )}
            </div>
          )}

          {plan.sections?.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                {plan.sections.length} section{plan.sections.length === 1 ? "" : "s"} over {fmt(plan.totalDurationSeconds)}s
              </p>
              {plan.sections.map((section, index) => (
                <div key={index} className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
                  <p className="text-[11px] font-bold text-slate-200">
                    {fmt(section.startTime)}–{fmt(section.endTime)}s
                    <span className="ml-2 font-medium text-slate-400">{section.mood}</span>
                  </p>
                  {section.storyBeat && (
                    <p className="text-[10px] font-medium text-slate-500">{section.storyBeat}</p>
                  )}
                  {section.motifTreatment && (
                    <p className="mt-0.5 text-[10px] font-medium text-purple-200/70">{section.motifTreatment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
            Generation prompt — edit freely; re-plan does not overwrite your edit
          </label>
          <textarea
            rows={8}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="creator-input mb-2 w-full resize-y px-2.5 py-2 text-[11px] leading-relaxed"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!dirty || savingPrompt}
              onClick={() => run(updatePrompt, { projectId, masterPrompt: prompt }, "Saved the prompt.")}
              className="flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-200 disabled:opacity-40"
            >
              {savingPrompt ? <Loader2 size={11} className="animate-spin" /> : null}
              Save prompt
            </button>
            <button
              type="button"
              disabled={recomposing}
              onClick={() => run(recompose, projectId, "Rebuilt the prompt from the plan.")}
              title="Throw away prompt edits and rebuild from the structured plan"
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-40"
            >
              {recomposing ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
              Reset to plan
            </button>
            <input
              type="text"
              value={modelOverride}
              onChange={(event) => setModelOverride(event.target.value)}
              placeholder="model (optional)"
              title="Registered music model id, e.g. elevenlabs/music-v1 or fal-ai/ace-step. Blank uses the configured default."
              className="creator-input w-52 px-2 py-1.5 text-[10px]"
            />
            <button
              type="button"
              disabled={generating || dirty}
              title={dirty ? "Save the prompt first" : undefined}
              onClick={() => run(generate, { projectId, model: modelOverride || undefined },
                "Generated the score for the whole video.")}
              className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold text-purple-200 disabled:opacity-40"
            >
              {generating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              {generating ? "Generating…" : "Generate score"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
