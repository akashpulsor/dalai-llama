// @ts-nocheck
import React from "react";
import { Loader2, WalletCards } from "lucide-react";

const currency = (amount, code = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export default function WalletBalanceButton({ wallet, isLoading, onRecharge }) {
  return (
    <div className="creator-control flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
        {isLoading ? <Loader2 size={17} className="animate-spin" /> : <WalletCards size={17} />}
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-400">Wallet</p>
        <p className="text-sm font-bold text-white">{currency(wallet?.balance, wallet?.currency)}</p>
      </div>
      <button type="button" onClick={onRecharge} className="creator-primary ml-1 px-3 py-2 text-xs font-bold text-white">
        Recharge
      </button>
    </div>
  );
}
