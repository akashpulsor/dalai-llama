// @ts-nocheck
import React, { useState } from "react";
import { Loader2, X } from "lucide-react";

const amounts = [500, 1000, 2500];

export default function RechargeWalletModal({ open, onClose, onRecharge, isLoading }) {
  const [amount, setAmount] = useState(1000);
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
              INR {option}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs font-semibold text-slate-400">Custom amount</label>
        <input
          type="number"
          min="100"
          step="50"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value) || 0)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm font-bold text-white outline-none focus:border-purple-400/60"
        />
        <button
          type="button"
          disabled={isLoading || amount < 100}
          onClick={() => onRecharge?.({ amount, currency: "INR" })}
          className="creator-primary mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          Continue Recharge
        </button>
      </div>
    </div>
  );
}
