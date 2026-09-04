// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDownLeft, ArrowUpRight, Percent, Save, TrendingUp } from "lucide-react";
import { selectTenantId, showFlash, useGetWalletBalanceQuery } from "@dalaillama/shared-store";
import { useGetOrganizationQuery, useListWalletTransactionsQuery, useUpdateOrganizationMutation } from "../api/creatorEndpoints.js";
import WalletBalanceButton from "../components/billing/WalletBalanceButton.jsx";

const rupee = (n, code = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

// Money IN vs OUT vs earned-from-clients. USAGE_DEDUCTION/DID_RENTAL/SUBSCRIPTION/ADJUSTMENT_DEBIT
// are what the creator spent; RECHARGE is what they paid in; ADJUSTMENT_CREDIT referencing a
// client payment is what they earned (populated once the pay-to-lock flow lands).
const OUT_TYPES = new Set(["USAGE_DEDUCTION", "DID_RENTAL", "SUBSCRIPTION", "ADJUSTMENT_DEBIT"]);
// Client-payment earnings are credited via walletService.credit (which records RECHARGE) with a
// CLIENT_REVIEW_PAYMENT reference -- detect by reference, not type.
const isClientEarning = (tx) => /CLIENT_REVIEW_PAYMENT/i.test(`${tx.reference || ""} ${tx.description || ""}`);

const TYPE_LABEL = {
  RECHARGE: "Wallet recharge",
  USAGE_DEDUCTION: "AI generation",
  ADJUSTMENT_CREDIT: "Credit",
  ADJUSTMENT_DEBIT: "Debit",
  REFUND: "Refund",
  DID_RENTAL: "Number rental",
  SUBSCRIPTION: "Subscription",
};

/** Wallet & Billing -- previously the sidebar link had nowhere to actually go (see Sidebar.jsx's
 * own comment). Wallet balance (same button as the sidebar's, its Recharge click reaches the
 * globally-mounted GlobalRechargeModal) plus the creator's margin: the markup added on top of
 * the platform's standard rate when a client pays to lock a reviewed deliverable. */
export default function WalletBillingPage() {
  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const { data: wallet, isFetching: walletLoading } = useGetWalletBalanceQuery(tenantId, { skip: !tenantId });
  const { data: organization } = useGetOrganizationQuery(undefined, { skip: !tenantId });
  const { data: transactions = [], isLoading: txLoading } = useListWalletTransactionsQuery(tenantId, { skip: !tenantId });
  const [updateOrganization, { isLoading: saving }] = useUpdateOrganizationMutation();
  const [marginInput, setMarginInput] = useState("");
  const currencyCode = wallet?.currency || "INR";

  const summary = useMemo(() => {
    let paidIn = 0;
    let spent = 0;
    let earned = 0;
    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0;
      if (isClientEarning(tx)) earned += amt;
      else if (tx.type === "RECHARGE") paidIn += amt;
      else if (OUT_TYPES.has(tx.type)) spent += amt;
    }
    return { paidIn, spent, earned };
  }, [transactions]);

  useEffect(() => {
    setMarginInput(organization?.marginPercent != null ? String(organization.marginPercent) : "");
  }, [organization?.marginPercent]);

  const handleSaveMargin = async () => {
    const value = marginInput.trim() === "" ? 0 : Number(marginInput);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      dispatch(showFlash({ message: "Margin must be a number between 0 and 100", type: "error" }));
      return;
    }
    try {
      await updateOrganization({ tenantId, marginPercent: value }).unwrap();
      dispatch(showFlash({ message: "Margin saved", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save your margin", type: "error" }));
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-white">Wallet & Billing</h1>
      <p className="mt-1 text-sm font-medium text-slate-400">Your wallet, and how client-facing pricing is set.</p>

      <div className="mt-6">
        <WalletBalanceButton wallet={wallet} isLoading={walletLoading} onRecharge={() => window.dispatchEvent(new CustomEvent("creator:open-recharge"))} />
      </div>

      {/* SUMMARY */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={ArrowDownLeft} tone="sky" label="You paid in" value={rupee(summary.paidIn, currencyCode)} sub="Wallet recharges" />
        <SummaryCard icon={ArrowUpRight} tone="rose" label="You spent" value={rupee(summary.spent, currencyCode)} sub="AI generation & fees" />
        <SummaryCard icon={TrendingUp} tone="emerald" label="You earned" value={rupee(summary.earned, currencyCode)} sub="From client payments" />
      </div>

      {/* LEDGER */}
      <div className="creator-panel mt-6 p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Transaction history</p>
        <p className="mt-0.5 text-xs font-medium text-slate-400">Every credit and debit on your wallet, newest first.</p>

        {txLoading ? (
          <p className="py-8 text-center text-xs font-medium text-slate-500">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-white/10 py-8 text-center text-xs font-medium text-slate-500">
            No transactions yet. Recharge your wallet or generate a video to see activity here.
          </p>
        ) : (
          <div className="mt-4 space-y-1.5">
            {transactions.map((tx) => {
              const out = OUT_TYPES.has(tx.type);
              const earned = isClientEarning(tx);
              const amt = Number(tx.amount) || 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    earned ? "bg-emerald-400/10 text-emerald-300" : out ? "bg-rose-400/10 text-rose-300" : "bg-sky-400/10 text-sky-300"
                  }`}>
                    {out ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{earned ? "Client payment" : (TYPE_LABEL[tx.type] || tx.type)}</p>
                    <p className="line-clamp-1 text-[10px] font-medium text-slate-500">
                      {tx.description || tx.reference || "—"} · {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${out ? "text-rose-200" : "text-emerald-200"}`}>
                      {out ? "−" : "+"}{rupee(amt, currencyCode)}
                    </p>
                    {tx.balanceAfter != null && (
                      <p className="text-[10px] font-medium text-slate-500 tabular-nums">bal {rupee(tx.balanceAfter, currencyCode)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="creator-panel mt-6 p-5">
        <div className="mb-2 flex items-center gap-2 text-purple-200">
          <Percent size={16} />
          <span className="text-xs font-bold uppercase tracking-[0.16em]">Client pricing</span>
        </div>
        <h2 className="text-lg font-bold text-white">Your margin</h2>
        <p className="mt-1 text-sm font-medium text-slate-400">
          The platform runs a standard rate for client-facing charges. Set your own markup on top of it -- a
          client paying to approve and lock a reviewed deliverable pays the standard rate plus this margin.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Margin (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={marginInput}
                onChange={(event) => setMarginInput(event.target.value)}
                className="creator-input w-28 px-2.5 py-2 text-sm font-semibold"
                placeholder="0"
              />
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>
          <button
            type="button"
            disabled={saving || !tenantId}
            onClick={handleSaveMargin}
            className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            <Save size={13} />
            {saving ? "Saving…" : "Save margin"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TONE = {
  sky: "border-sky-400/20 text-sky-300",
  rose: "border-rose-400/20 text-rose-300",
  emerald: "border-emerald-400/20 text-emerald-300",
};

function SummaryCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className={`creator-panel flex items-center gap-3 p-4 ${TONE[tone]}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ${TONE[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
        <p className="text-[10px] font-medium text-slate-500">{sub}</p>
      </div>
    </div>
  );
}
