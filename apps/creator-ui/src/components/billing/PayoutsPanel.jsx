// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Banknote, Pencil } from "lucide-react";
import { selectTenantId, showFlash } from "@dalaillama/shared-store";
import {
  useGetPayoutAccountQuery,
  useListPreProductionProjectsQuery,
  useListPayoutsQuery,
  useSavePayoutAccountMutation,
} from "../../api/creatorEndpoints.js";
import { money } from "./ProjectEconomics.jsx";

const STATUS = {
  QUEUED: { label: "Working it out", tone: "text-slate-300" },
  AWAITING_ACCOUNT: { label: "Add a bank account or UPI", tone: "text-amber-300" },
  NOTHING_TO_PAY: { label: "Nothing left to pay", tone: "text-slate-400" },
  READY: { label: "Being paid to you", tone: "text-sky-300" },
  SENT: { label: "On its way", tone: "text-sky-300" },
  PAID: { label: "Paid", tone: "text-emerald-300" },
  FAILED: { label: "Didn't go through — back in your wallet", tone: "text-rose-300" },
};

/** Where the creator is paid, and what each project paid them: once the client's final payment
 * is in, what's left after production, platform charges and payment fees goes to their bank or UPI. */
export default function PayoutsPanel() {
  const tenantId = useSelector(selectTenantId);
  const { data: account, isLoading: accountLoading } = useGetPayoutAccountQuery(tenantId, { skip: !tenantId });
  const { data: payouts = [] } = useListPayoutsQuery(tenantId, { skip: !tenantId });
  const { data: projects = [] } = useListPreProductionProjectsQuery(undefined, { skip: !tenantId });
  const nameOf = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const [editing, setEditing] = useState(false);
  const waiting = payouts.some((p) => p.status === "AWAITING_ACCOUNT");

  return (
    <div className="creator-panel mt-6 p-5">
      <div className="mb-1 flex items-center gap-2 text-purple-200">
        <Banknote size={16} />
        <span className="text-xs font-bold uppercase tracking-[0.16em]">Payouts</span>
      </div>
      <h2 className="text-lg font-bold text-white">Your share, paid to your bank</h2>
      <p className="mt-1 text-sm font-medium text-slate-400">
        When a client makes the final payment, what's left after production, platform charges and payment fees is sent
        to you.
      </p>

      {accountLoading ? null : account && !editing ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-slate-200">
            {account.method === "UPI"
              ? <>UPI · <span className="font-semibold">{account.vpa}</span></>
              : <>Bank · <span className="font-semibold">{account.ifsc} ••{account.accountLast4}</span></>}
            <span className="text-slate-400"> · {account.holderName}</span>
          </p>
          <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:underline">
            <Pencil size={12} /> Change
          </button>
        </div>
      ) : (
        <PayoutAccountForm tenantId={tenantId} account={account} waiting={waiting}
                           onDone={() => setEditing(false)} onCancel={account ? () => setEditing(false) : null} />
      )}

      {payouts.length > 0 && (
        <div className="mt-4 divide-y divide-white/5">
          {payouts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{nameOf.get(p.projectId) || `Project ${p.projectId.slice(0, 8)}`}</p>
                {p.clientPaid != null && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Client paid {money(p.clientPaid, p.currency)} − production {money(p.productionCharged, p.currency)} − payment
                    fees {money(p.gatewayFees, p.currency)}
                  </p>
                )}
                <p className={`mt-0.5 text-[11px] font-semibold ${STATUS[p.status]?.tone || "text-slate-300"}`}>
                  {STATUS[p.status]?.label || p.status}
                  {p.paidAt ? ` · ${new Date(p.paidAt).toLocaleDateString()}` : ""}
                  {p.utr ? ` · UTR ${p.utr}` : ""}
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-300">{p.amount != null ? money(p.amount, p.currency) : "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayoutAccountForm({ tenantId, account, waiting, onDone, onCancel }) {
  const dispatch = useDispatch();
  const [method, setMethod] = useState(account?.method || "BANK_ACCOUNT");
  const [holderName, setHolderName] = useState(account?.holderName || "");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmNumber, setConfirmNumber] = useState("");
  const [vpa, setVpa] = useState("");
  const [save, { isLoading }] = useSavePayoutAccountMutation();
  const field = "mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";
  const mismatch = method === "BANK_ACCOUNT" && confirmNumber !== "" && confirmNumber !== accountNumber;
  const ready = holderName.trim() && (method === "UPI" ? vpa.trim() : ifsc.trim() && accountNumber && confirmNumber === accountNumber);

  const handleSave = async () => {
    try {
      await save({ tenantId, method, holderName, ifsc, accountNumber, vpa }).unwrap();
      dispatch(showFlash({ message: "Payout account saved", type: "success" }));
      onDone();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Couldn't save your payout account", type: "error" }));
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {waiting && (
        <p className="rounded-lg border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100">
          A payout is waiting for you — add where to send it.
        </p>
      )}
      <div className="flex gap-2">
        {[["BANK_ACCOUNT", "Bank account"], ["UPI", "UPI"]].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setMethod(value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${method === value ? "border-purple-400/60 bg-purple-500/15 text-white" : "border-white/10 text-slate-400"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-400">Account holder's name
          <input value={holderName} onChange={(e) => setHolderName(e.target.value)} maxLength={120} className={field} />
        </label>
        {method === "UPI" ? (
          <label className="text-xs text-slate-400">UPI ID
            <input value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="name@bank" className={field} />
          </label>
        ) : (
          <>
            <label className="text-xs text-slate-400">IFSC
              <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} maxLength={11} placeholder="HDFC0001234" className={field} />
            </label>
            <label className="text-xs text-slate-400">Account number
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={18} className={field} />
            </label>
            <label className="text-xs text-slate-400">Account number again
              <input value={confirmNumber} onChange={(e) => setConfirmNumber(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={18} className={field} />
              {mismatch && <span className="mt-1 block text-[11px] text-rose-300">The numbers don't match</span>}
            </label>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={!ready || isLoading} onClick={handleSave}
                className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {isLoading ? "Saving…" : "Save payout account"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-400 hover:underline">Cancel</button>}
      </div>
    </div>
  );
}
