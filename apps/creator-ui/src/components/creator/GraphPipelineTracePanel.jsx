// @ts-nocheck
import React from "react";
import { CheckCircle2, CircleDashed, Loader2, Sparkles, XCircle } from "lucide-react";
import { isCompletedJobStatus, isFailedJobStatus } from "../../features/patchEditor/utils/jobStatus.js";

const STAGE_LABELS = {
  STORY_SCRIPT: "Story script (hook + beats planned and critiqued)",
  SCREENPLAY: "Shot-wise screenplay",
  SHOT_PLAN: "Shot plan (lighting, camera, continuity)",
  STORYBOARD: "Storyboard frames + editing/sound design plans",
  PIPELINE: "Pipeline",
};

function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage || "Stage";
}

function StageIcon({ status }) {
  if (status === "FAILED") return <XCircle size={14} className="text-rose-400" />;
  if (status === "COMPLETED") return <CheckCircle2 size={14} className="text-emerald-400" />;
  return <CircleDashed size={14} className="text-slate-500" />;
}

// Surfaces CreatorGenerationGraphOrchestratorService's run: a single button that chains
// story script -> screenplay -> shot plan -> storyboard (each stage already runs its own
// critic/retry loop server-side), plus a readable trace of what happened at each stage -
// "Cursor for ad generation" per the plan, not a black-box progress bar.
export default function GraphPipelineTracePanel({ onRun, isStarting, job }) {
  const status = job?.status;
  const running = status && !isCompletedJobStatus(status) && !isFailedJobStatus(status);
  const trace = Array.isArray(job?.result?.trace) ? job.result.trace : [];

  return (
    <div className="creator-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-200">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-sm font-black text-white">Run full pipeline</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Auto-generate story script, screenplay, shot plan, and storyboard - each stage scores and retries
              itself. Stops before video so you can review first.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isStarting || running}
          className="creator-primary flex h-8 items-center gap-1.5 px-3 text-[11px] font-black text-white disabled:opacity-40"
          title="Run story script, screenplay, shot plan, and storyboard generation end to end"
        >
          {isStarting || running ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {running ? "Running..." : "Run full pipeline"}
        </button>
      </div>

      {job ? (
        <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] font-semibold text-slate-400">
            {job.message || (isFailedJobStatus(status) ? "Pipeline run failed." : "Pipeline running...")}
            {typeof job.progress === "number" ? ` (${job.progress}%)` : ""}
          </p>
          {trace.length > 0 && (
            <ul className="space-y-1.5">
              {trace.map((row, index) => (
                <li key={`${row.stage || index}-${row.timestamp || index}`} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <span className="mt-0.5">
                    <StageIcon status={row.status} />
                  </span>
                  <span>
                    <span className="font-bold text-slate-200">{stageLabel(row.stage)}</span>
                    {row.summary ? <span className="text-slate-400"> - {row.summary}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isFailedJobStatus(status) && job.errorMessage ? (
            <p className="text-[11px] font-semibold text-rose-400">{job.errorMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
