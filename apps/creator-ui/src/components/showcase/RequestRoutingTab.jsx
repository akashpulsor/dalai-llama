// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useAdminAssignRequestMutation,
  useAdminRequestRoutingQuery,
  useAdminSetCreatorAcceptingMutation,
  useAdminSetRoutingStrategyMutation,
} from "../../api/showcaseEndpoints.js";
import { INDUSTRY_LABEL } from "./showcaseLabels.js";

const STRATEGIES = [
  ["ROUND_ROBIN_BY_INDUSTRY", "Round robin by industry", "Each request goes straight to the next creator for its industry; the brand gets the brief to pay at once."],
  ["OFFER_TO_ALL", "Offer to all", "Every creator on gets an email; the first to accept takes it, then the brand gets the brief."],
  ["OPS_ASSIGNS", "Ops assigns", "Requests wait below until ops pick the creator."],
];

/** Ops controls for requests sent to Dalaillama: how they're routed, which creators take them
 * (every active creator, unless switched off here) and the queue waiting for a creator. */
export default function RequestRoutingTab() {
  const { data, isLoading, isError } = useAdminRequestRoutingQuery();
  const [setStrategy, strategyState] = useAdminSetRoutingStrategyMutation();
  const [setAccepting] = useAdminSetCreatorAcceptingMutation();
  const [assign] = useAdminAssignRequestMutation();
  const [message, setMessage] = useState(null);

  const run = async (action, ok) => {
    setMessage(null);
    try {
      await action().unwrap();
      setMessage({ ok: true, text: ok });
    } catch (e) {
      setMessage({ ok: false, text: e?.data?.message || `Failed (${e?.status || "?"})` });
    }
  };

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-slate-500" />;
  if (isError || !data) return <p className="text-sm text-rose-300">Routing couldn't load.</p>;
  const onCreators = data.creators.filter((c) => c.accepting);

  return (
    <section className="space-y-6 text-sm">
      {message && (
        <p className={`rounded-md border px-3 py-2 text-xs font-semibold ${message.ok ? "border-emerald-400/30 text-emerald-200" : "border-rose-400/30 text-rose-200"}`}>
          {message.text}
        </p>
      )}

      <div className="creator-panel rounded-xl p-4">
        <h3 className="font-bold text-white">How requests are routed</h3>
        <div className="mt-3 space-y-2">
          {STRATEGIES.map(([code, label, hint]) => (
            <label key={code} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-white/5">
              <input type="radio" name="strategy" checked={data.strategy === code} disabled={strategyState.isLoading}
                     onChange={() => run(() => setStrategy(code), `Routing: ${label}`)} className="mt-1" />
              <span>
                <span className="font-semibold text-white">{label}</span>
                <span className="block text-xs text-slate-400">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="creator-panel rounded-xl p-4">
        <h3 className="font-bold text-white">Creators taking requests <span className="font-normal text-slate-400">· {onCreators.length} of {data.creators.length} on</span></h3>
        <p className="mt-1 text-xs text-slate-400">Every creator with an active profile takes requests unless switched off.</p>
        <ul className="mt-3 divide-y divide-white/10">
          {data.creators.map((c) => (
            <li key={c.handle} className="flex items-center justify-between py-2">
              <span><span className="font-semibold text-white">{c.displayName}</span> <span className="text-slate-500">@{c.handle}</span></span>
              <button type="button" onClick={() => run(() => setAccepting({ handle: c.handle, accepting: !c.accepting }),
                `${c.displayName} ${c.accepting ? "switched off" : "switched on"}`)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${c.accepting ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-slate-400"}`}>
                {c.accepting ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="creator-panel rounded-xl p-4">
        <h3 className="font-bold text-white">Waiting for a creator <span className="font-normal text-slate-400">· {data.waiting.length}</span></h3>
        {data.waiting.length === 0 && <p className="mt-2 text-xs text-slate-400">Nothing waiting.</p>}
        <ul className="mt-3 space-y-3">
          {data.waiting.map((w) => <WaitingRow key={w.id} w={w} creators={data.creators}
                                                onAssign={(handle) => run(() => assign({ id: w.id, handle }), `Assigned to @${handle}; the brand gets the brief to pay`)} />)}
        </ul>
      </div>
    </section>
  );
}

function WaitingRow({ w, creators, onAssign }) {
  const [handle, setHandle] = useState(creators.find((c) => c.accepting)?.handle || creators[0]?.handle || "");
  return (
    <li className="rounded-lg bg-white/[0.03] p-3 ring-1 ring-white/10">
      <p className="font-semibold text-white">{w.brand} <span className="font-normal text-slate-400">· {w.email}{w.industry ? ` · ${INDUSTRY_LABEL[w.industry]}` : ""}</span></p>
      <p className="mt-1 text-slate-300">“{w.message}”</p>
      <p className="mt-1 text-xs text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
      <div className="mt-2 flex items-center gap-2">
        <select value={handle} onChange={(e) => setHandle(e.target.value)}
                className="rounded-lg border border-white/15 bg-white/[0.04] p-1.5 text-xs text-white">
          {creators.map((c) => <option key={c.handle} value={c.handle}>{c.displayName} (@{c.handle})</option>)}
        </select>
        <button type="button" disabled={!handle} onClick={() => onAssign(handle)}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50">
          Assign
        </button>
      </div>
    </li>
  );
}
