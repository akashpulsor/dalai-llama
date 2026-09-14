// @ts-nocheck
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Download, Loader2, Receipt } from "lucide-react";
import { selectTenantId } from "@dalaillama/shared-store";
import { appConfig } from "@dalaillama/shared-config";
import {
  useGetWalletStatementLinesQuery,
  useGetWalletStatementQuery,
} from "../../api/creatorEndpoints.js";

const rupee = (n, code = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", maximumFractionDigits: 2 })
    .format(Number(n) || 0);

const dateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * The wallet as a statement rather than a scrolling list.
 *
 * <p>The transaction list answered "what happened" one row at a time, in a feed whose totals moved
 * every time anything ran and where every AI charge read identically. The question a creator is
 * actually asking is "I put money in — where has it gone since?", so that is what this leads with:
 * the last credit, the spend against it, and which stage of production took it.
 */
export default function WalletStatementPanel() {
  const tenantId = useSelector(selectTenantId);
  const [expanded, setExpanded] = useState(false);
  const { data: statement, isFetching } = useGetWalletStatementQuery(tenantId, { skip: !tenantId });
  // Only fetched once someone asks for the detail -- a busy tenant has thousands of these and
  // nobody needs them to read a summary.
  const { data: lines = [], isFetching: linesLoading } = useGetWalletStatementLinesQuery(
    { tenantId },
    { skip: !tenantId || !expanded }
  );

  const currency = statement?.currency || "INR";
  const stages = statement?.stages || [];
  const spent = Number(statement?.spentSince || 0);
  const exportHref = tenantId
    ? `${appConfig.API_BASE_URL}/tenants/${tenantId}/wallet/statement/export`
    : null;

  return (
    <div className="creator-panel mt-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-purple-200">
            <Receipt size={16} />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">Statement</span>
          </div>
          <h2 className="text-lg font-bold text-white">Since your last top-up</h2>
          {statement?.lastCreditAt ? (
            <p className="mt-1 text-sm font-medium text-slate-400">
              You added {rupee(statement.lastCreditAmount, currency)} on {dateTime(statement.lastCreditAt)}.
              {statement.callsSince > 0
                ? ` ${statement.callsSince} charge${statement.callsSince === 1 ? "" : "s"} since then.`
                : " Nothing charged since."}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-slate-400">
              No top-up recorded yet — this covers everything charged so far.
            </p>
          )}
        </div>
        {exportHref && (
          // A plain link, not a fetch: the browser handles the download and the file arrives named
          // by the server's Content-Disposition.
          <a
            href={exportHref}
            className="creator-control flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-100"
          >
            <Download size={13} />
            Export CSV
          </a>
        )}
      </div>

      {isFetching && !statement ? (
        <div className="mt-4 h-24 animate-pulse rounded-md bg-white/[0.03]" />
      ) : (
        <>
          <p className="mt-4 text-3xl font-black tracking-tight text-white tabular-nums">
            {rupee(spent, currency)}
          </p>
          <p className="text-[11px] font-semibold text-slate-500">spent since that top-up</p>

          {stages.length === 0 ? (
            <p className="mt-4 text-xs font-medium text-slate-500">Nothing charged in this period.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {stages.map((stage) => {
                // Share of the period's spend, so the bar means something rather than being
                // decoration. Guarded because a period can total zero.
                const share = spent > 0 ? (Number(stage.amount) / spent) * 100 : 0;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-xs font-bold text-slate-200">{stage.label}</p>
                      <p className="text-xs font-bold text-slate-100 tabular-nums">
                        {rupee(stage.amount, currency)}
                        <span className="ml-1.5 font-semibold text-slate-500">
                          {stage.calls} call{stage.calls === 1 ? "" : "s"}
                        </span>
                      </p>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-purple-400/70" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 text-[11px] font-bold text-purple-300 hover:text-purple-200"
          >
            {expanded ? "Hide every charge" : "Show every charge"}
          </button>

          {expanded && (
            <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
              {linesLoading ? (
                <div className="h-24 animate-pulse bg-white/[0.03]" />
              ) : (
                <table className="w-full min-w-[34rem] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Stage</th>
                      <th className="px-3 py-2">What</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={`${line.recordedAt}-${index}`} className="border-b border-white/[0.06] last:border-0">
                        <td className="whitespace-nowrap px-3 py-2 text-[11px] font-medium text-slate-400">
                          {dateTime(line.recordedAt)}
                        </td>
                        <td className="px-3 py-2 text-[11px] font-semibold text-slate-300">{line.stage}</td>
                        <td className="px-3 py-2 text-[11px] font-medium text-slate-400">
                          {line.taskKey || line.description || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-bold text-slate-200 tabular-nums">
                          {rupee(line.amount, currency)}
                        </td>
                      </tr>
                    ))}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-[11px] font-medium text-slate-500">
                          No charges recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
