// @ts-nocheck
import React from "react";
import { usd } from "../../utils/providerCosts.js";

export { groupProviderCosts, usd } from "../../utils/providerCosts.js";

const PROVIDER_LABELS = { google: "Google", "fal.ai": "fal.ai", elevenlabs: "ElevenLabs" };

const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

/** One project's actual provider spend: total, per provider, and the per-model breakdown. */
export function ProviderCostCard({ group }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-slate-100">{group.name}</p>
        <p className="text-lg font-black text-slate-100">{usd(group.total)}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {group.providers.map(([provider, cost]) => (
          <span key={provider} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-200">
            {PROVIDER_LABELS[provider] || provider} {usd(cost)}
          </span>
        ))}
        <span className="text-[10px] font-semibold text-slate-500">
          {group.calls} calls · last {when(group.lastAt)}
        </span>
      </div>
      <table className="mt-3 w-full text-left text-[11px]">
        <thead className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-1">Provider</th>
            <th className="py-1">Model</th>
            <th className="py-1 text-right">Calls</th>
            <th className="py-1 text-right" title="Came back without a result -- a refusal (e.g. Gemini IMAGE_OTHER) or a failed job">No result</th>
            <th className="py-1 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {group.models.map((row) => (
            <tr key={`${row.providerId}-${row.modelId}`} className="border-t border-white/5 text-slate-300">
              <td className="py-1">{PROVIDER_LABELS[row.providerId] || row.providerId}</td>
              <td className="py-1 font-mono text-[10px]">{row.modelId}</td>
              <td className="py-1 text-right">{row.calls}</td>
              <td className={`py-1 text-right ${row.noResult ? "font-bold text-amber-300" : "text-slate-500"}`}>{row.noResult}</td>
              <td className="py-1 text-right font-semibold text-slate-100">{usd(row.costUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
