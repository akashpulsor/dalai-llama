// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";
import { Check, Crown } from "lucide-react";
import useCreatorVideoEntitlements from "../hooks/useCreatorVideoEntitlements.js";

/** Sidebar upsell -- was a second, redundant "recharge wallet" CTA duplicating the wallet
 * balance button right above it (WalletBalanceButton already owns that action). Repurposed as
 * the subscription upsell instead, listing the actual gated Pro entitlements rather than
 * marketing copy unrelated to what a subscription really unlocks. Hidden once already subscribed
 * -- nothing to upsell a Pro creator into. */
export default function UpgradeCard() {
  const { isSubscribed } = useCreatorVideoEntitlements();
  if (isSubscribed) return null;

  return (
    <div className="rounded-lg border border-amber-300/20 bg-gradient-to-br from-amber-500/10 to-slate-900 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Crown size={16} className="text-amber-300" />
        Upgrade to Pro
      </div>
      <div className="space-y-1.5 text-xs font-medium text-slate-300">
        {["AI edits & repairs", "Upscaling", "Character voice/image uploads", "Share briefs with clients"].map((item) => (
          <p key={item} className="flex items-center gap-2">
            <Check size={13} className="text-amber-300" />
            <span>{item}</span>
          </p>
        ))}
      </div>
      <Link to="/subscription" className="creator-primary mt-4 flex w-full items-center justify-center px-3 py-2 text-xs font-bold text-white transition">
        Subscribe
      </Link>
    </div>
  );
}
