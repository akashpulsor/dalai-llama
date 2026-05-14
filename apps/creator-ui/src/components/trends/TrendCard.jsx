// @ts-nocheck
import React, { useState } from "react";
import { Check, TrendingUp } from "lucide-react";

const tone = {
  "Very Hot": "bg-red-500 text-white",
  Hot: "bg-orange-500 text-white",
  Trending: "bg-slate-600 text-white",
};

export default function TrendCard({ trend, selected, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = `/mocks/creator/${trend.id}.png`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-[13.25rem] shrink-0 overflow-hidden rounded-lg border bg-white/[0.04] p-2 text-left transition ${
        selected ? "border-purple-400 shadow-[0_0_0_1px_rgba(168,85,247,0.36),0_18px_46px_rgba(88,28,135,0.24)]" : "border-white/10 hover:border-purple-300/50"
      }`}
    >
      {selected && (
        <span className="absolute left-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-950/40">
          <Check size={15} />
        </span>
      )}
      <span className={`absolute right-4 top-4 z-10 rounded-full px-2 py-1 text-[10px] font-bold shadow-lg shadow-black/30 ${tone[trend.status] || tone.Trending}`}>
        {trend.status}
      </span>
      <div className="creator-media h-[8.2rem]">
        {!imageFailed && <img src={imageSrc} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-[2.35rem] text-sm font-bold leading-5 text-white">{trend.title}</h3>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-300">{trend.hashtags?.join(" ")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="metric-tile p-2">
          <p className="text-[10px] font-medium text-slate-400">Reels</p>
          <p className="text-sm font-bold text-white">{trend.reels}</p>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><TrendingUp size={10} /> {trend.reelsGrowth}</p>
        </div>
        <div className="metric-tile p-2">
          <p className="text-[10px] font-medium text-slate-400">Engagement</p>
          <p className="text-sm font-bold text-white">{trend.engagement}</p>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><TrendingUp size={10} /> {trend.engagementGrowth}</p>
        </div>
      </div>
    </button>
  );
}
