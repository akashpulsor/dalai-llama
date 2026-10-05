import React from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { isTrendsStale } from "../../api/trendsFromReports.js";

/**
 * This week's trend moments, one section per category (Bollywood, Politics, History, ...).
 * Shows the last run until the creator presses Update trends -- each run is charged to the wallet,
 * so nothing here generates on its own.
 */
export default function TrendMomentSections({ moments, lastRun, isLoading, isUpdating, canUpdate, onUpdate, onPick }) {
  const categories = (moments?.categories || []).filter((category) => category.ideas.length > 0);
  const stale = isTrendsStale(moments?.updatedAt);

  return (
    <div className="mb-3.5 border-t border-white/10 pt-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-purple-200">
            <TrendingUp size={13} />
            Trending this week — tap one to start a video
          </p>
          {lastRun && (
            <p className={`mt-0.5 text-[11px] font-semibold ${stale ? "text-amber-300" : "text-slate-500"}`}>
              {stale ? `Stale — last updated ${lastRun}. Run Update trends to refresh.` : `Updated ${lastRun}`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onUpdate}
          disabled={isUpdating || !canUpdate}
          title={canUpdate ? "Generates fresh trends; charged to your wallet" : "Top up your wallet to update trends"}
          className="creator-control inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-100 disabled:opacity-50"
        >
          <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""} />
          {isUpdating ? "Updating…" : "Update trends"}
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-400">
          {isLoading
            ? "Loading trends…"
            : "No trends yet. Update trends to get this week's Bollywood, politics, history, sports and entertainment moments (charged to your wallet)."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.category} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{category.label}</p>
              <ul className="space-y-1">
                {category.ideas.map((idea) => (
                  <li key={idea.id}>
                    <button
                      type="button"
                      onClick={() => onPick(idea)}
                      title={idea.prompt}
                      className="w-full truncate rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-200 transition hover:bg-purple-500/15 hover:text-white"
                    >
                      {idea.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
