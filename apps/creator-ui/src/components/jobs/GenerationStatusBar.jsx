// @ts-nocheck
import React from "react";
import { CheckCircle2, Circle, CircleDot, Loader2, Pause, XCircle } from "lucide-react";

export default function GenerationStatusBar({ job, label }) {
  if (!job) return null;

  const status = String(job.status || "PENDING").toUpperCase();
  const done = ["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(status);
  const failed = ["FAILED", "ERROR"].includes(status);
  const paused = status === "PAUSED";
  const progress = Math.max(5, Math.min(100, Number(job.progress ?? (done ? 100 : 42))));
  const usage = done ? completedUsageSummary(job) : null;
  const steps = buildJobSteps(job, label, progress, done, failed);

  return (
    <div className={`creator-panel p-4 ${failed ? "border-rose-400/30" : done ? "border-emerald-400/30" : paused ? "border-amber-300/30" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${failed ? "bg-rose-400/10 text-rose-200" : done ? "bg-emerald-400/10 text-emerald-200" : paused ? "bg-amber-300/10 text-amber-100" : "bg-purple-400/10 text-purple-200"}`}>
            {failed ? <XCircle size={18} /> : done ? <CheckCircle2 size={18} /> : paused ? <Pause size={18} /> : <Loader2 size={18} className="animate-spin" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{label || "Generation job"}</p>
            <p className="text-xs font-semibold text-slate-400">{job.message || status}</p>
            {usage && (
              <p className="mt-1 text-[11px] font-bold text-slate-500">
                {usage}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400">{progress}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${failed ? "bg-rose-400" : done ? "bg-emerald-400" : paused ? "bg-amber-300" : "bg-purple-500"}`} style={{ width: `${progress}%` }} />
      </div>
      {steps.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={`${step.label}-${index}`} className="flex min-w-0 items-start gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
              <StepIcon status={step.status} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-200">{step.label}</p>
                {step.detail && <p className="truncate text-[10px] font-semibold text-slate-500">{step.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepIcon({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "failed") return <XCircle size={13} className="mt-0.5 shrink-0 text-rose-300" />;
  if (normalized === "completed" || normalized === "done") return <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" />;
  if (normalized === "running" || normalized === "active") return <CircleDot size={13} className="mt-0.5 shrink-0 animate-pulse text-purple-200" />;
  return <Circle size={13} className="mt-0.5 shrink-0 text-slate-600" />;
}

function buildJobSteps(job = {}, label = "", progress = 0, done = false, failed = false) {
  const output = job.outputPayload || job.result || {};
  const explicitSteps = firstArray(job.steps, output.steps, output.generationSteps, output.storyboard?.steps);
  if (explicitSteps.length) {
    return explicitSteps
      .map((step) => normalizeStep(step, failed))
      .filter((step) => step.label);
  }
  return deriveJobSteps(job, label, output, progress, done, failed);
}

function deriveJobSteps(job = {}, label = "", output = {}, progress = 0, done = false, failed = false) {
  const message = String(job.message || output.message || "").toLowerCase();
  const scenes = Array.isArray(output.storyboard?.scenes) ? output.storyboard.scenes : [];
  const sceneCount = Number(output.sceneCount ?? scenes.length ?? 0);
  const totalShots = Number(output.storyboard?.totalShots ?? output.totalShots ?? output.shotCount ?? sceneCount ?? 0);
  const lightingCount = scenes.filter((scene) => scene?.lightingImageUrl || scene?.lighting_image_url).length;
  const cameraCount = scenes.filter((scene) => scene?.cameraPlanImageUrl || scene?.camera_plan_image_url || scene?.dpImageUrl || scene?.dp_image_url).length;
  const isStoryboardPhase = Boolean(output.storyboard)
    || /storyboard image|storyboard pack|lighting sheet|dp camera|camera plan|image ready|sheet ready/.test(message);

  if (isStoryboardPhase) {
    return [
      {
        label: "Create storyboard pack",
        status: stepStatus(done || sceneCount > 0 || progress > 8, /storyboard pack|starting|created/.test(message), failed),
      },
      {
        label: "Render storyboard images",
        status: stepStatus(totalShots > 0 && sceneCount >= totalShots, /storyboard image/.test(message) || sceneCount > 0, failed),
        detail: totalShots > 0 ? `${Math.min(sceneCount, totalShots)}/${totalShots} shots` : "",
      },
      {
        label: "Render lighting sheets",
        status: stepStatus(totalShots > 0 && lightingCount >= totalShots, /lighting/.test(message) || lightingCount > 0, failed),
        detail: totalShots > 0 ? `${Math.min(lightingCount, totalShots)}/${totalShots} shots` : "",
      },
      {
        label: "Render DP camera sheets",
        status: stepStatus(done || (totalShots > 0 && cameraCount >= totalShots), /dp camera|camera plan/.test(message) || cameraCount > 0, failed),
        detail: totalShots > 0 ? `${Math.min(cameraCount, totalShots)}/${totalShots} shots` : "",
      },
    ];
  }

  const isShotDesign = String(label || "").toLowerCase().includes("shot")
    || String(job.jobType || job.type || "").toUpperCase().includes("PRODUCTION_PLAN")
    || /production plan|shot plan/.test(message);
  if (isShotDesign) {
    return [
      { label: "Read screenplay shots", status: stepStatus(progress >= 12 || done, progress < 20, failed) },
      { label: "Generate plan JSON", status: stepStatus(progress >= 80 || done, /production plan|shot plan|generating/.test(message), failed) },
      { label: "Save shot tags", status: stepStatus(progress >= 90 || done, /saved|reused|generated production plan/.test(message), failed) },
      { label: "Ready for images", status: stepStatus(done, progress >= 90 && !done, failed) },
    ];
  }

  return [];
}

function normalizeStep(step = {}, failed = false) {
  if (typeof step === "string") return { label: step, status: failed ? "failed" : "pending", detail: "" };
  const status = failed ? "failed" : String(step.status || step.state || "pending").toLowerCase();
  return {
    label: String(step.label || step.name || step.title || "").trim(),
    status,
    detail: String(step.detail || step.description || step.message || "").trim(),
  };
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || [];
}

function stepStatus(completed, running, failed) {
  if (failed) return "failed";
  if (completed) return "completed";
  if (running) return "running";
  return "pending";
}

function completedUsageSummary(job = {}) {
  const output = job.outputPayload || job.result || {};
  const tokenMetadata = output.tokenMetadata || output.usageMetadata || {};
  const costMetadata = output.costMetadata || output.providerCost || output.audioEnhancement?.costMetadata || {};
  const inputTokens = Number(tokenMetadata.billableInputTokens ?? tokenMetadata.inputTokens ?? tokenMetadata.totalInputTokens ?? costMetadata.usage?.billableInputTokens ?? costMetadata.usage?.inputTokens ?? 0);
  const outputTokens = Number(tokenMetadata.billableOutputTokens ?? tokenMetadata.outputTokens ?? tokenMetadata.totalOutputTokens ?? costMetadata.usage?.billableOutputTokens ?? costMetadata.usage?.outputTokens ?? 0);
  const totalTokens = Number(tokenMetadata.billableTotalTokens ?? tokenMetadata.totalTokens ?? tokenMetadata.totalRequestUsage ?? costMetadata.usage?.billableTotalTokens ?? inputTokens + outputTokens);
  const cost = Number(costMetadata.billableTotalCost ?? costMetadata.customerTotalCost ?? costMetadata.totalCost ?? costMetadata.amount ?? output.amount ?? 0);
  const currency = costMetadata.currency || output.currency || "";
  const durationSeconds = Number(costMetadata.usage?.customerBillableSeconds ?? costMetadata.usage?.billableDurationSeconds ?? costMetadata.usage?.billableSeconds ?? costMetadata.usage?.durationSeconds ?? costMetadata.usage?.requestedDurationSeconds ?? output.durationSeconds ?? 0);
  const parts = [];
  if (Number.isFinite(totalTokens) && totalTokens > 0) {
    parts.push(`Tokens ${Math.round(inputTokens)} in / ${Math.round(outputTokens)} out`);
  } else if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    parts.push(`Usage ${formatSeconds(durationSeconds)}`);
  }
  if (Number.isFinite(cost) && cost > 0) {
    parts.push(`Charged ${formatCost(cost, currency)}`);
  }
  return parts.length ? parts.join(" | ") : "";
}

function formatSeconds(value) {
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds)) return "0s";
  if (seconds < 60) return `${seconds.toFixed(seconds % 1 ? 1 : 0)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function formatCost(value, currency = "") {
  const amount = Number(value || 0);
  const code = String(currency || "").toUpperCase();
  if (code === "USD" || !code) return `$${amount < 0.01 ? amount.toFixed(4) : amount.toFixed(2)}`;
  return `${code} ${amount < 1 ? amount.toFixed(4) : amount.toFixed(2)}`;
}
