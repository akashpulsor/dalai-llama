// @ts-nocheck
import React from "react";
import { CheckCircle2, CreditCard } from "lucide-react";

const currency = (amount, code = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code || "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function PaidActionSummary({ label, cost = 0, wallet, includedItems = [], duration }) {
  const balance = Number(wallet?.balance ?? wallet?.amount ?? 0);
  const currencyCode = wallet?.currency || "INR";
  const after = balance - Number(cost || 0);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard size={17} className="text-purple-300" />
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs font-medium text-slate-400">{duration ? `${duration} second storyboard package` : "Wallet deduction summary"}</p>
        </div>
      </div>
      <div className="grid gap-2 text-sm font-semibold sm:grid-cols-3">
        <div className="rounded-lg bg-black/20 p-3">
          <p className="text-xs text-slate-500">Wallet</p>
          <p className="mt-1 text-white">{currency(balance, currencyCode)}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-3">
          <p className="text-xs text-slate-500">Cost</p>
          <p className="mt-1 text-amber-200">{currency(cost, currencyCode)}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-3">
          <p className="text-xs text-slate-500">After</p>
          <p className={`mt-1 ${after >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{currency(after, currencyCode)}</p>
        </div>
      </div>
      {includedItems.length > 0 && (
        <div className="mt-3 space-y-2 text-xs font-semibold text-slate-300">
          {includedItems.map((item) => (
            <p key={item} className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-300" />
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
