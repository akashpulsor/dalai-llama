// @ts-nocheck
import React from "react";
import { Check, WalletCards } from "lucide-react";

export default function UpgradeCard() {
  const openRecharge = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("creator:open-recharge"));
  };

  return (
    <div className="rounded-lg border border-emerald-300/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <WalletCards size={16} className="text-emerald-300" />
        Recharge Wallet
      </div>
      <div className="space-y-1.5 text-xs font-medium text-slate-300">
        {["AI video renders", "UGC creator jobs", "Screenplay review", "Human editing queue"].map((item) => (
          <p key={item} className="flex items-center gap-2">
            <Check size={13} className="text-emerald-300" />
            <span>{item}</span>
          </p>
        ))}
      </div>
      <button type="button" onClick={openRecharge} className="creator-primary mt-4 w-full px-3 py-2 text-xs font-bold text-white transition">
        Add Balance
      </button>
    </div>
  );
}
