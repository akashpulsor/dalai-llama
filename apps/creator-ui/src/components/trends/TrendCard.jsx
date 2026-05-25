// @ts-nocheck
import React from "react";
import { Check, RadioTower, TrendingUp } from "lucide-react";

const tone = {
  "Very Hot": "bg-red-500 text-white",
  Hot: "bg-orange-500 text-white",
  Trending: "bg-slate-600 text-white",
};

export default function TrendCard({ trend, selected, onClick }) {
  const tags = trend.hashtags || trend.tags || [];
  const score = Number(trend.score ?? trend.confidenceScore ?? 0);
  const velocity = Number(trend.velocity ?? 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full min-w-0 overflow-hidden rounded-lg border bg-white/[0.04] p-3 text-left transition ${
        selected ? "border-purple-400 shadow-[0_0_0_1px_rgba(168,85,247,0.36),0_18px_46px_rgba(88,28,135,0.24)]" : "border-white/10 hover:border-purple-300/50"
      }`}
    >
      {selected && (
        <span className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-950/40">
          <Check size={15} />
        </span>
      )}
      <span className={`absolute right-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-bold shadow-lg shadow-black/30 ${tone[trend.status] || tone.Trending}`}>
        {trend.status}
      </span>

      <div className="min-h-[8.2rem] rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.36))] p-3">
        <div className="flex items-center gap-2 pl-8 pr-20">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-200">
            <RadioTower size={16} />
          </span>
          <span className="truncate text-[11px] font-bold uppercase tracking-normal text-slate-400">
            {trend.sourceName || trend.platform || "Trend signal"}
          </span>
        </div>
        <h3 className="mt-4 line-clamp-3 min-h-[3.75rem] text-base font-extrabold leading-5 text-white">{trend.title || "Untitled trend"}</h3>
        <p className="mt-2 line-clamp-2 min-h-[2rem] text-xs font-medium leading-4 text-slate-300">{trend.summary || tags.join(" ") || "Structured trend row ready for insight and prediction."}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.055] px-2 py-1 text-[10px] font-bold text-slate-300">{tag}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="metric-tile p-2">
          <p className="text-[10px] font-medium text-slate-400">Trend Score</p>
          <p className="text-sm font-bold text-white">{score ? score.toFixed(0) : trend.reels}</p>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><TrendingUp size={10} /> {trend.reelsGrowth}</p>
        </div>
        <div className="metric-tile p-2">
          <p className="text-[10px] font-medium text-slate-400">Velocity</p>
          <p className="text-sm font-bold text-white">{velocity ? velocity.toFixed(1) : trend.engagement}</p>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><TrendingUp size={10} /> {trend.engagementGrowth}</p>
        </div>
      </div>
    </button>
  );
}
