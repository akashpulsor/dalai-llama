// @ts-nocheck
import React from "react";
import { AlertTriangle, Loader2, Sparkles, X } from "lucide-react";

/** The critic service returns findings shaped {role, observation, risk, cause, correction,
 * severity} — the old UI rendered f.message||f.summary||JSON.stringify(f), none of which exist,
 * so it dumped raw JSON. This renders them as what they are: prioritized, role-attributed review
 * notes with a clear "what's wrong" + "how to fix". P1 first. */

const SEVERITY_ORDER = { P1: 0, P2: 1, P3: 2 };

const SEVERITY_STYLE = {
  P1: { chip: "border-rose-400/30 bg-rose-500/15 text-rose-200", label: "P1 · Blocking" },
  P2: { chip: "border-amber-400/30 bg-amber-500/15 text-amber-200", label: "P2 · Should fix" },
  P3: { chip: "border-sky-400/30 bg-sky-500/15 text-sky-200", label: "P3 · Nice to have" },
};

const ROLE_LABEL = {
  DIRECTOR: "Director",
  DP: "Cinematographer",
  PRODUCTION_DESIGN: "Production design",
  EDITOR: "Editor",
  SOUND: "Sound",
};

export default function CritiqueFindingsPanel({ findings = [], onAutoFix, onReject, fixing }) {
  const sorted = [...findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );
  const counts = sorted.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-lg border border-amber-400/25 bg-amber-500/[0.05] p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={14} className="text-amber-300" />
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-200">
          Pre-flight review — {sorted.length} finding{sorted.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-1">
          {["P1", "P2", "P3"].filter((s) => counts[s]).map((s) => (
            <span key={s} className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${SEVERITY_STYLE[s].chip}`}>
              {counts[s]} {s}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((f, i) => {
          const sev = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.P3;
          return (
            <div key={i} className="rounded-md border border-white/10 bg-black/20 p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${sev.chip}`}>{sev.label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {ROLE_LABEL[f.role] || f.role}
                </span>
              </div>
              {f.observation && (
                <p className="text-[11px] font-medium leading-snug text-slate-300">{f.observation}</p>
              )}
              {f.correction && (
                <p className="mt-1.5 flex gap-1.5 text-[11px] font-medium leading-snug text-emerald-200/90">
                  <span className="shrink-0 font-bold">Fix:</span>
                  <span>{f.correction}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        {onReject && (
          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300"
          >
            <X size={12} />
            Dismiss
          </button>
        )}
        {onAutoFix && (
          <button
            type="button"
            disabled={fixing}
            onClick={onAutoFix}
            className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-white disabled:opacity-60"
          >
            {fixing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {fixing ? "Fixing with AI…" : "Fix with AI & re-check"}
          </button>
        )}
      </div>
    </div>
  );
}
