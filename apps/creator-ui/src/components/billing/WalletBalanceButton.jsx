// @ts-nocheck
import React from "react";
import { AlertCircle, AlertTriangle, Loader2, WalletCards } from "lucide-react";

const currency = (amount, code = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export default function WalletBalanceButton({ wallet, isLoading, onRecharge, minimumBalance = 300, minimumLabel = "paid generation" }) {
  const balance = Number(wallet?.balance ?? wallet?.totalBalance ?? 0);
  const currencyCode = wallet?.currency || "INR";
  const requiredBalance = Number(minimumBalance) > 0 ? Number(minimumBalance) : 300;
  const isEmpty = !isLoading && balance <= 0;
  const isLow = !isLoading && balance > 0 && balance < requiredBalance;

  return (
    <div className={`creator-control flex items-center gap-3 px-3 py-2 ${
      isEmpty ? "border-rose-300/30" : isLow ? "border-amber-300/30" : ""
    }`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
        {isLoading ? <Loader2 size={17} className="animate-spin" /> : isEmpty ? <AlertCircle size={17} /> : isLow ? <AlertTriangle size={17} /> : <WalletCards size={17} />}
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-400">Wallet</p>
        <p className="text-sm font-bold text-white">{currency(balance, currencyCode)}</p>
        {(isEmpty || isLow) && (
          <p className={`mt-0.5 text-[10px] font-bold ${isEmpty ? "text-rose-200" : "text-amber-200"}`}>
            {isEmpty ? "Please recharge" : `Keep ${currency(requiredBalance, currencyCode)}`}
          </p>
        )}
        {!isLoading && !isEmpty && !isLow && (
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            Ready for {minimumLabel}
          </p>
        )}
      </div>
      <button type="button" onClick={onRecharge} className="creator-primary ml-1 px-3 py-2 text-xs font-bold text-white">
        Recharge
      </button>
    </div>
  );
}
