// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetOutreachAnalyticsQuery } from "../../api/showcaseEndpoints.js";
import { LAYOUT_LABEL } from "./outreachLabels.js";

/** Analytics tab (rule 28): our own numbers only — mail delivered, waiting, film clicks and brand
 * requests that came from mail, by template and by audience. */
export default function AnalyticsPanel() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useGetOutreachAnalyticsQuery(days);

  return (
    <div className="space-y-6">
      <section className="creator-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">How your outreach is doing</h2>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Last
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                    className="rounded-lg border border-white/10 bg-[#0b0f19] px-2 py-1 text-xs text-white">
              {[7, 30, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
          </label>
        </div>
        {isLoading && <p className="mt-3 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>}
        {isError && <p className="mt-3 text-sm text-rose-300">Analytics couldn't load.</p>}
        {data && (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[["Emails delivered", data.totals.delivered], ["Waiting to send", data.totals.queued], ["Film clicks", data.totals.clicks],
              ["Requests from email", data.totals.requestsFromMail], ["Brands following you", data.totals.followers]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-normal text-slate-500">{k}</dt>
                <dd className="text-lg font-bold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {data && (
        <section className="creator-panel overflow-x-auto p-5">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">By template</h2>
          <Table head={["Template", "Layout", "Sent", "Waiting", "Clicks", "Requests"]}
                 rows={data.templates.map((t) => [
                   <span key="n">{t.name} {t.global && <span className="ml-1 rounded-full bg-purple-500/20 px-1.5 text-[10px] font-bold text-purple-200">Dalai Llama</span>}
                     {!t.active && <span className="ml-1 text-[10px] text-slate-500">(deleted)</span>}</span>,
                   LAYOUT_LABEL[t.layout], t.sent, t.queued, t.clicks, t.requests])} />
        </section>
      )}

      {data && (
        <section className="creator-panel overflow-x-auto p-5">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">By audience</h2>
          {data.audiences.length === 0 ? <p className="mt-2 text-xs text-slate-400">No audiences yet.</p> : (
            <Table head={["Audience", "Leads", "Reachable", "Sent", "Waiting", "Clicks", "Requests"]}
                   rows={data.audiences.map((a) => [a.name, a.leads, a.reachable, a.sent, a.queued, a.clicks, a.requests])} />
          )}
        </section>
      )}
    </div>
  );
}

function Table({ head, rows }) {
  return (
    <table className="mt-3 w-full min-w-[520px] text-left text-sm">
      <thead>
        <tr className="text-[10px] uppercase tracking-normal text-slate-500">
          {head.map((h, i) => <th key={h} scope="col" className={`pb-2 font-bold ${i > 1 ? "text-right" : ""}`}>{h}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {rows.map((r, n) => (
          <tr key={n} className="text-slate-200">
            {r.map((cell, i) => <td key={i} className={`py-2 ${i > 1 ? "text-right tabular-nums" : ""}`}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
