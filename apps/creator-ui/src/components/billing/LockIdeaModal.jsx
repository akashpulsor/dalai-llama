// @ts-nocheck
import React from "react";
import { AlertTriangle, Loader2, LockKeyhole, X } from "lucide-react";
import PaidActionSummary from "./PaidActionSummary.jsx";

export default function LockIdeaModal({
  open,
  onClose,
  onConfirm,
  onRecharge,
  onUpgrade,
  isLoading,
  quote,
  wallet,
  subscription,
  selectedTrend,
  selectedIdea,
  selectedCreator,
  audience,
  duration,
}) {
  if (!open) return null;

  const cost = Number(quote?.cost ?? quote?.packageCost ?? 0);
  const balance = Number((quote?.wallet || wallet)?.balance || 0);
  const hasEnoughWallet = balance >= cost;
  const entitlementBlocked = quote?.entitlementAllowed === false || subscription?.creatorEntitlements?.lockIdeaPackageEnabled === false;
  const canConfirm = hasEnoughWallet && !entitlementBlocked && !isLoading;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="creator-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-purple-200">
              <LockKeyhole size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Paid generation</span>
            </div>
            <h3 className="text-xl font-bold text-white">Lock Idea & Generate Storyboard</h3>
            <p className="mt-1 text-sm font-medium text-slate-400">
              This locks the creative snapshot and deducts the storyboard package from your wallet.
            </p>
          </div>
          <button type="button" onClick={onClose} className="creator-control flex h-9 w-9 items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ReviewRow label="Trend" value={selectedTrend?.title} />
          <ReviewRow label="Idea" value={selectedIdea?.title || selectedIdea?.description} />
          <ReviewRow label="Audience" value={audience?.title || "Confirmed audience"} />
          <ReviewRow label="Cast" value={selectedCreator?.name || "Confirmed cast"} />
        </div>

        <div className="mt-4">
          <PaidActionSummary
            label="Creator storyboard package"
            duration={duration}
            cost={cost}
            wallet={quote?.wallet || wallet}
            includedItems={[
              "Immutable locked idea snapshot",
              "First director-level storyboard generation",
              "Scene-by-scene prompt and production notes",
            ]}
          />
        </div>

        {!hasEnoughWallet && (
          <InlineWarning message="Wallet balance is lower than the package cost. Recharge before locking this idea." />
        )}
        {entitlementBlocked && (
          <InlineWarning message="Your current subscription does not include this Creator generation package." />
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {!hasEnoughWallet && (
            <button type="button" onClick={onRecharge} className="creator-control px-4 py-3 text-sm font-bold text-emerald-100">
              Recharge Wallet
            </button>
          )}
          {entitlementBlocked && (
            <button type="button" onClick={onUpgrade} className="creator-control px-4 py-3 text-sm font-bold text-amber-100">
              Subscription
            </button>
          )}
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="creator-primary flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Confirm & Generate
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-bold text-white">{value || "Not selected"}</p>
    </div>
  );
}

function InlineWarning({ message }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm font-semibold text-amber-100">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
