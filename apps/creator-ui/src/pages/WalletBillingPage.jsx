// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Crown, Percent, Save, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { selectTenantId, showFlash, useGetWalletBalanceQuery } from "@dalaillama/shared-store";
import WalletStatementPanel from "../components/billing/WalletStatementPanel.jsx";
import { useGetOrganizationQuery, useListWalletTransactionsQuery, useUpdateOrganizationMutation } from "../api/creatorEndpoints.js";
import WalletBalanceButton from "../components/billing/WalletBalanceButton.jsx";
import useCreatorVideoEntitlements from "../hooks/useCreatorVideoEntitlements.js";

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
  // Collapsed by default: the point of grouping is that the page opens as a short summary, and
  // you open the one group you actually want to inspect.
  const [expandedTag, setExpandedTag] = useState(null);
  const currencyCode = wallet?.currency || "INR";
  const { planName, status: subscriptionStatus } = useCreatorVideoEntitlements();

  const summary = useMemo(() => {
    let paidIn = 0;
    let spent = 0;
    let earned = 0;
    for (const tx of transactions) {
      // billing-service stores a debit's amount already negated (see WalletServiceImpl.debit) --
      // these are magnitudes for display, the sign is conveyed by which bucket a row falls into.
      const amt = Math.abs(Number(tx.amount) || 0);
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <WalletBalanceButton wallet={wallet} isLoading={walletLoading} onRecharge={() => window.dispatchEvent(new CustomEvent("creator:open-recharge"))} />
        <Link to="/subscription" className="creator-control flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-amber-100">
          <Crown size={15} className="text-amber-300" />
          {subscriptionStatus === "ACTIVE" ? `${planName} plan` : "Subscribe for edits, uploads & sharing"}
        </Link>
      </div>

      {/* SUMMARY */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={ArrowDownLeft} tone="sky" label="You paid in" value={rupee(summary.paidIn, currencyCode)} sub="Wallet recharges" />
        <SummaryCard icon={ArrowUpRight} tone="rose" label="You spent" value={rupee(summary.spent, currencyCode)} sub="AI generation & fees" />
        <SummaryCard icon={TrendingUp} tone="emerald" label="You earned" value={rupee(summary.earned, currencyCode)} sub="From client payments" />
      </div>

      {/* The statement first: what you last added, what has gone out since, and on what. The
          raw feed below is for looking something up, not for understanding the wallet. */}
      <WalletStatementPanel />

      {/* LEDGER */}
      <div className="creator-panel mt-6 p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Transaction history</p>
        <p className="mt-0.5 text-xs font-medium text-slate-400">
          Grouped by what was charged, biggest spend first. Open a group to see its individual charges.
        </p>

        {txLoading ? (
          <p className="py-8 text-center text-xs font-medium text-slate-500">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-white/10 py-8 text-center text-xs font-medium text-slate-500">
            No transactions yet. Recharge your wallet or generate a video to see activity here.
          </p>
        ) : (
          <div className="mt-4 space-y-1.5">
            {groupByTag(transactions).map((group) => {
              const open = expandedTag === group.key;
              return (
                <div key={group.key} className="overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setExpandedTag(open ? null : group.key)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03]"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      group.out ? "bg-rose-400/10 text-rose-300" : "bg-sky-400/10 text-sky-300"
                    }`}>
                      {group.out ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{group.label}</p>
                      <p className="text-[10px] font-medium text-slate-500">
                        {group.rows.length} charge{group.rows.length === 1 ? "" : "s"}
                        {group.lastAt ? ` · last ${new Date(group.lastAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                      </p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${group.out ? "text-rose-200" : "text-emerald-200"}`}>
                      {group.out ? "−" : "+"}{rupee(group.total, currencyCode)}
                    </p>
                    <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>

                  {open && (
                    <div className="space-y-1 border-t border-white/10 bg-black/20 px-3 py-2">
                      {group.rows.map((tx) => {
                        const amt = Math.abs(Number(tx.amount) || 0);
                        return (
                          <div key={tx.id} className="flex items-center gap-3 py-1">
                            <p className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-500">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                              {tx.reference ? ` · ${tx.reference}` : ""}
                            </p>
                            <p className={`shrink-0 text-[11px] font-bold tabular-nums ${group.out ? "text-rose-200/80" : "text-emerald-200/80"}`}>
                              {group.out ? "−" : "+"}{rupee(amt, currencyCode)}
                            </p>
                            {tx.balanceAfter != null && (
                              <p className="w-24 shrink-0 text-right text-[10px] font-medium text-slate-500 tabular-nums">
                                bal {rupee(tx.balanceAfter, currencyCode)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

/** Buckets the feed by calendar day, newest first, with each day's net movement. A wallet
  * ledger read as one flat column tells you nothing about when anything happened; a day
  * header and a net figure make a spending day visible at a glance. Rows with no timestamp
  * fall into their own bucket rather than being dropped or dated to the epoch. */
/** Turns "AI usage: gemini-2.5-flash" and "Usage charge: USAGE:AI_LLM_TOKENS:LLM_GATEWAY" into
  * something worth grouping on: the model or metric that was actually charged.
  *
  * This wallet carries ~870 usage rows against 2 recharges, so the flat feed was a wall of
  * near-identical lines. Tagged, the same data is a handful of rows, and the one that matters --
  * which model is eating the balance -- sits at the top. */
function tagOf(tx) {
  const description = String(tx.description || "").trim();

  const aiUsage = description.match(/^AI usage:\s*(.+)$/i);
  if (aiUsage) return { key: "model:" + aiUsage[1].trim(), label: aiUsage[1].trim() };

  // "USAGE:AI_LLM_TOKENS:LLM_GATEWAY" -- the metric is the useful half, the source just repeats it.
  const usageCharge = description.match(/^Usage charge:\s*USAGE:([A-Z0-9_]+)/i);
  if (usageCharge) return { key: "metric:" + usageCharge[1], label: humaniseToken(usageCharge[1]) };

  if (description) return { key: "desc:" + description, label: description };
  return { key: "type:" + (tx.type || "OTHER"), label: TYPE_LABEL[tx.type] || tx.type || "Other" };
}

/** AI_LLM_TOKENS -> "AI LLM tokens": keep known initialisms upper-case, lower the rest. */
function humaniseToken(token) {
  const words = String(token).split("_").filter(Boolean);
  if (!words.length) return token;
  return words
    .map((word, index) => {
      if (["AI", "LLM", "TTS", "API"].includes(word)) return word;
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

/** Groups the feed by tag, heaviest spend first. The question this page gets asked is "where is my
  * money going", and that ordering answers it without scrolling. */
function groupByTag(transactions) {
  const buckets = new Map();
  transactions.forEach((tx) => {
    const { key, label } = tagOf(tx);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label, rows: [], total: 0, out: OUT_TYPES.has(tx.type), lastAt: null });
    }
    const bucket = buckets.get(key);
    bucket.rows.push(tx);
    // Magnitude only: tx.amount is already negative for some debit types and positive for others,
    // so summing it raw double-counts the sign. Direction comes from the type instead.
    bucket.total += Math.abs(Number(tx.amount) || 0);
    if (tx.createdAt && (!bucket.lastAt || new Date(tx.createdAt) > new Date(bucket.lastAt))) {
      bucket.lastAt = tx.createdAt;
    }
  });
  return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
}

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
