// @ts-nocheck
import React from "react";
import { Clock, Flame } from "lucide-react";

export default function WhyTrendingStrip() {
  return (
    <div className="creator-panel flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/12">
          <Flame size={17} className="text-orange-300" />
        </span>
        <div>
          <p className="text-sm font-bold">Why is this trending?</p>
          <p className="text-sm font-medium text-slate-300">Transformation stories + emotional hooks are driving high saves and shares right now.</p>
        </div>
      </div>
      <div className="creator-panel-muted flex items-center gap-2 px-3 py-2">
        <Clock size={16} className="text-purple-200" />
        <span className="text-xs font-medium text-slate-400">Best time to post</span>
        <span className="text-xs font-bold text-white">Today, 6PM - 10PM</span>
      </div>
    </div>
  );
}
