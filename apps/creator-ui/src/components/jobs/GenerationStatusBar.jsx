// @ts-nocheck
import React from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function GenerationStatusBar({ job, label }) {
  if (!job) return null;

  const status = String(job.status || "PENDING").toUpperCase();
  const done = ["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(status);
  const failed = ["FAILED", "ERROR"].includes(status);
  const progress = Math.max(5, Math.min(100, Number(job.progress ?? (done ? 100 : 42))));

  return (
    <div className={`creator-panel p-4 ${failed ? "border-rose-400/30" : done ? "border-emerald-400/30" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${failed ? "bg-rose-400/10 text-rose-200" : done ? "bg-emerald-400/10 text-emerald-200" : "bg-purple-400/10 text-purple-200"}`}>
            {failed ? <XCircle size={18} /> : done ? <CheckCircle2 size={18} /> : <Loader2 size={18} className="animate-spin" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{label || "Generation job"}</p>
            <p className="text-xs font-semibold text-slate-400">{job.message || status}</p>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400">{progress}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${failed ? "bg-rose-400" : done ? "bg-emerald-400" : "bg-purple-500"}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
