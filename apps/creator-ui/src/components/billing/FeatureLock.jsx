// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";

/** Wraps a Pro-only feature: renders `children` unlocked, or a compact upgrade prompt in its
 * place when `unlocked` is false. One component so every gated feature point (edits, image
 * upload, upscaling, character voice upload, brief-URL share) looks and behaves the same way
 * rather than each one inventing its own locked-state UI. */
export default function FeatureLock({ unlocked, feature, compact = false, children }) {
  if (unlocked) return children;

  if (compact) {
    return (
      <Link
        to="/subscription"
        className="flex items-center gap-1.5 rounded-md border border-amber-400/25 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:border-amber-400/40"
      >
        <Lock size={11} />
        {feature} — upgrade to unlock
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-amber-400/25 bg-amber-500/[0.04] px-6 py-10 text-center">
      <Crown size={22} className="text-amber-300" />
      <p className="text-sm font-bold text-white">{feature} is a Pro feature</p>
      <p className="max-w-sm text-xs font-medium text-slate-400">
        Upgrade your subscription to unlock {feature.toLowerCase()} and everything else on the Pro plan.
      </p>
      <Link
        to="/subscription"
        className="creator-primary mt-1 rounded-md px-4 py-2 text-xs font-bold text-white"
      >
        View plans
      </Link>
    </div>
  );
}
