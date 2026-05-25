// @ts-nocheck
import React from "react";
import { Clock, Flame, Sparkles, TimerReset, TrendingUp, Users } from "lucide-react";

export default function WhyTrendingStrip({ trend, insight, isLoading, onPredictSelected }) {
  const reasons = insight?.whyItWorked || insight?.reasons || [];
  const bestTimes = insight?.bestTimes || insight?.postingWindows || [];
  const actions = insight?.creatorActions || insight?.recommendedActions || [];
  const strategy = insight?.postingStrategy || insight?.aiOutput?.postingStrategy || {};
  const hasInsight = Boolean(insight && (reasons.length || bestTimes.length || Object.keys(strategy).length));

  return (
    <div className="creator-panel grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/12">
          <Flame size={17} className="text-orange-300" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">Why this worked</p>
            {isLoading && <span className="creator-badge px-2 py-0.5 text-[10px] font-bold">Analyzing</span>}
            {hasInsight && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">AI insight</span>}
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{trend?.title || "Selected trend"}</p>
          {reasons.length ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {reasons.slice(0, 4).map((reason, index) => (
                <div key={`${reason}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
                  <p className="text-xs font-medium leading-5 text-slate-300">{reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3">
              <p className="text-xs font-medium leading-5 text-slate-300">
                Select a backend trend row to generate AI insight. Timing is not guessed in the browser.
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.slice(0, 3).map((action) => (
              <span key={action} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
                {action}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="creator-panel-muted space-y-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-purple-200" />
          <span className="text-xs font-medium text-slate-400">AI posting plan</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniMetric icon={TimerReset} label="Rank delay" value={strategy.rankingDelayEstimateMinutes ? `${strategy.rankingDelayEstimateMinutes}m` : "AI"} />
          <MiniMetric icon={Users} label="Audience" value={strategy.audiencePeakLabel || "Pending"} />
        </div>
        <div className="space-y-2">
          {bestTimes.length ? (
            bestTimes.slice(0, 3).map((slot, index) => (
              <div key={`${slot.window}-${index}`} className="rounded-md bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-purple-200">{slot.label || `Window ${index + 1}`}</span>
                  <span className="text-xs font-extrabold text-white">{slot.window || slot.time || slot}</span>
                </div>
                {slot.reason && <p className="mt-1 text-[11px] font-medium leading-4 text-slate-400">{slot.reason}</p>}
              </div>
            ))
          ) : (
            <div className="rounded-md bg-black/20 px-3 py-3">
              <p className="text-[11px] font-medium leading-4 text-slate-400">AI timing will appear after the selected trend insight API responds.</p>
            </div>
          )}
        </div>
        <button type="button" onClick={onPredictSelected} className="creator-control flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-100">
          <Sparkles size={14} /> Predict more like this
        </button>
        <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <TrendingUp size={12} /> AI uses trend velocity, ranking delay, timezone, and audience availability.
        </p>
      </div>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md bg-black/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-normal text-slate-500">
        <Icon size={12} /> {label}
      </div>
      <p className="mt-1 text-xs font-extrabold text-white">{value}</p>
    </div>
  );
}
