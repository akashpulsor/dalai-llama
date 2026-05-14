// @ts-nocheck
import React from "react";
import { Crown, Loader2 } from "lucide-react";

export default function SubscriptionBadge({ subscription, isLoading, onUpgrade }) {
  const plan = subscription?.planName || subscription?.planCode || "Creator Starter";
  const blocked = subscription?.creatorEntitlements?.creatorTrendPredictionEnabled === false;

  return (
    <div className="creator-control flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200">
        {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Crown size={17} />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">Subscription</p>
        <p className="max-w-36 truncate text-sm font-bold text-white">{plan}</p>
      </div>
      <button type="button" onClick={onUpgrade} className="creator-control px-3 py-2 text-xs font-bold text-amber-100">
        {blocked ? "Subscribe" : "Upgrade"}
      </button>
    </div>
  );
}
