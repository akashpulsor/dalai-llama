// @ts-nocheck
import React from "react";
import { ChevronRight, Flame } from "lucide-react";
import TrendCard from "./TrendCard.jsx";

export default function TrendCarousel({ trends, selectedTrendId, onSelectTrend, onViewAll }) {
  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-300" />
          <h2 className="text-base font-bold">Top Trending Topics</h2>
        </div>
        <button type="button" onClick={onViewAll} className="flex items-center gap-1 text-xs font-semibold text-purple-300">
          View All Trends <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {trends.map((trend) => (
          <TrendCard key={trend.id} trend={trend} selected={selectedTrendId === trend.id} onClick={() => onSelectTrend(trend.id)} />
        ))}
      </div>
    </section>
  );
}
