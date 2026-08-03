// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, X } from "lucide-react";

const currencyLocales = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  AED: "en-AE",
  SGD: "en-SG",
};

const currencyPresets = {
  INR: [500, 1000, 2500],
  USD: [10, 25, 50],
  GBP: [10, 25, 50],
  AED: [50, 100, 250],
  SGD: [15, 30, 60],
};

const currencySteps = {
  INR: 50,
  USD: 5,
  GBP: 5,
  AED: 10,
  SGD: 5,
};

function normalizeCurrency(value = "INR") {
  const currency = String(value || "INR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "INR";
}

function money(amount, currency = "INR") {
  const normalizedCurrency = normalizeCurrency(currency);
  return new Intl.NumberFormat(currencyLocales[normalizedCurrency] || "en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount) || 0);
}

export default function RechargeWalletModal({
  open,
  onClose,
  onRecharge,
  isLoading,
  currencyCode = "INR",
  regionLabel = "India",
}) {
  const normalizedCurrency = normalizeCurrency(currencyCode);
  const amounts = useMemo(() => currencyPresets[normalizedCurrency] || [10, 25, 50], [normalizedCurrency]);
  const [amount, setAmount] = useState(amounts[1] || amounts[0] || 1000);

  useEffect(() => {
    if (!open) return;
    setAmount(amounts[1] || amounts[0] || 1000);
  }, [amounts, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="creator-panel w-full max-w-md p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Recharge Wallet</h3>
            <p className="mt-1 text-sm font-medium text-slate-400">Add balance before using paid Creator generation.</p>
          </div>
          <button type="button" onClick={onClose} className="creator-control flex h-8 w-8 items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {amounts.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAmount(option)}
              className={`rounded-lg border px-3 py-3 text-sm font-bold ${
                amount === option ? "border-purple-400 bg-purple-500/20 text-white" : "border-white/10 bg-white/[0.035] text-slate-300"
              }`}
            >
              {money(option, normalizedCurrency)}
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300">
          Showing {normalizedCurrency} for {regionLabel || "your billing region"}. Powered by Razorpay Checkout.
        </p>
        <label className="mt-4 block text-xs font-semibold text-slate-400">Custom amount</label>
        <input
          type="number"
          min="1"
          step={currencySteps[normalizedCurrency] || 1}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value) || 0)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm font-bold text-white outline-none focus:border-purple-400/60"
        />
        <button
          type="button"
          disabled={isLoading || amount < 1}
          onClick={() => onRecharge?.({ amount, currency: normalizedCurrency })}
          className="creator-primary mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {!isLoading && <CreditCard size={16} />}
          Pay {money(amount, normalizedCurrency)} with Razorpay
        </button>
      </div>
    </div>
  );
}
