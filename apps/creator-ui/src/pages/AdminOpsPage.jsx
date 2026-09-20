// @ts-nocheck
/**
 * Ops dashboard hosted inside creator-ui, served under /admin. Not routable from the public
 * creator.dalaillama.in gateway: exists only behind ops.dalaillama.in, which is guarded by
 * oauth2-proxy + Keycloak dalai_admin role at the ingress (see ops-virtualservice.yaml).
 *
 * Kept single-file on purpose: DRY hurts a tiny surface like this, and every tab is a
 * self-contained subcomponent so adding a Tenants tab or a Wallet tab tomorrow just means
 * writing one more function below and adding it to TABS.
 *
 * Currently ships one tab: Jobs (stuck LLM jobs + one-click retry). That is the one operator
 * action the Pragya incident actually needed.
 */
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { AlertTriangle, RefreshCw, ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import {
  useListStuckLlmJobsQuery,
  useRetryLlmJobMutation,
  useListAdminTenantsQuery,
  useActivateAdminTenantMutation,
  useDeactivateAdminTenantMutation,
  useGetAdminWalletQuery,
  useCreditAdminWalletMutation,
} from "../api/creatorEndpoints.js";

const OPS_HOST_HINT = "ops.dalaillama.in";

/** Only render admin surface on ops.dalaillama.in -- admin REST endpoints are ONLY routable
 * there (VirtualService pins /api/v1/internal/admin/** to llm-gateway on the ops hostname).
 * On creator.dalaillama.in the fetch would 404 and the page would be a broken shell. */
function isServedOnOpsHost() {
  if (typeof window === "undefined") return true;
  return window.location.hostname.startsWith("ops.");
}

/** Realm role check. The oauth2-proxy gate already denies anyone without dalai_admin at the
 * network layer; this second check is defence-in-depth so a misconfigured route or a
 * copy-pasted link within an admin's browser does not render UI that pretends to work. */
function hasAdminRole(user) {
  if (!user) return false;
  const roles = user.realmRoles || user.roles || [];
  return Array.isArray(roles) && roles.includes("dalai_admin");
}

export default function AdminOpsPage() {
  const user = useSelector((state) => state?.auth?.user || null);
  const [activeTab, setActiveTab] = useState("jobs");

  if (!isServedOnOpsHost()) {
    return (
      <Notice icon={<ShieldAlert size={16} />} tone="warn">
        The admin dashboard is only available at <b>{OPS_HOST_HINT}</b>. Open{" "}
        <a href={`https://${OPS_HOST_HINT}/admin`} className="underline">
          https://{OPS_HOST_HINT}/admin
        </a>{" "}
        instead.
      </Notice>
    );
  }
  if (!hasAdminRole(user)) {
    return (
      <Notice icon={<ShieldAlert size={16} />} tone="error">
        You are signed in as <b>{user?.email || "unknown"}</b>, which does not have the
        <code className="mx-1 rounded bg-black/40 px-1 py-0.5 text-[10px]">dalai_admin</code>
        realm role. Ask Keycloak admin to grant it and refresh.
      </Notice>
    );
  }

  const TABS = [
    { key: "jobs", label: "LLM jobs", component: <JobsTab /> },
    { key: "tenants", label: "Tenants", component: <TenantsTab /> },
    { key: "wallets", label: "Wallets", component: <WalletsTab /> },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Ops dashboard</p>
        <h1 className="mt-1 text-2xl font-black text-slate-100">Platform admin</h1>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Signed in as <b className="text-slate-200">{user.email}</b>. Actions here affect real
          tenant data — no undo.
        </p>
      </header>
      <nav className="mb-4 flex gap-2 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              activeTab === tab.key
                ? "border-b-2 border-purple-400 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {TABS.find((t) => t.key === activeTab)?.component}
    </div>
  );
}

// ------- Jobs tab (the operational meat) -------------------------------------

function JobsTab() {
  const [lookbackHours, setLookbackHours] = useState(24);
  const { data: jobs = [], isLoading, isError, error, refetch } = useListStuckLlmJobsQuery(lookbackHours);
  const [retryJob, { isLoading: retrying }] = useRetryLlmJobMutation();
  const [flash, setFlash] = useState(null);

  const handleRetry = async (jobId) => {
    setFlash(null);
    try {
      const response = await retryJob(jobId).unwrap();
      setFlash({ tone: "success", message: `Retry published (previousStatus=${response.previousStatus}). Poll llm_job for the next terminal state.` });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.detail || err?.data?.message || err?.error || "Retry failed" });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-500">Lookback:</label>
          <select
            value={lookbackHours}
            onChange={(e) => setLookbackHours(Number(e.target.value))}
            className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-200"
          >
            <option value={1}>1 hour</option>
            <option value={24}>24 hours</option>
            <option value={168}>7 days</option>
          </select>
          <button
            type="button"
            onClick={refetch}
            className="ml-2 rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-300 hover:border-purple-400/30"
          >
            Reload
          </button>
        </div>
        <a
          href="/grafana/explore"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-purple-200"
        >
          Open in Grafana Loki <ExternalLink size={11} />
        </a>
      </div>

      {flash && (
        <Notice tone={flash.tone} icon={flash.tone === "error" ? <AlertTriangle size={14} /> : null}>
          {flash.message}
        </Notice>
      )}

      {isLoading && <Loader label="Loading jobs" />}
      {isError && (
        <Notice tone="error" icon={<AlertTriangle size={14} />}>
          Could not load stuck jobs: {error?.status || "unknown error"}
        </Notice>
      )}

      {!isLoading && !isError && jobs.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/10 py-8 text-center text-xs font-medium text-slate-500">
          No stuck jobs in the last {lookbackHours} hours. Nothing to do.
        </p>
      )}

      {jobs.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-[11px]">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <Th>Job</Th>
                <Th>Tenant</Th>
                <Th>Model / task</Th>
                <Th>Status</Th>
                <Th>Attempts</Th>
                <Th>Created</Th>
                <Th>Error</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.map((job) => (
                <tr key={job.jobId} className="hover:bg-white/[0.02]">
                  <Td>
                    <code className="text-[10px] text-slate-400">{job.jobId.slice(0, 8)}</code>
                  </Td>
                  <Td>
                    <code className="text-[10px] text-slate-400">{job.tenantId?.slice(0, 8) || "-"}</code>
                  </Td>
                  <Td>
                    <div className="font-semibold text-slate-200">{job.modelId}</div>
                    <div className="text-slate-500">{job.taskKey || "-"}</div>
                  </Td>
                  <Td>
                    <StatusPill status={job.status} />
                  </Td>
                  <Td className="text-slate-300">{job.attemptCount ?? 0}</Td>
                  <Td className="text-slate-400">{formatTime(job.createdAt)}</Td>
                  <Td className="max-w-xs truncate text-rose-300" title={job.lastErrorSummary || ""}>
                    {job.lastErrorSummary || "-"}
                  </Td>
                  <Td>
                    <button
                      type="button"
                      disabled={retrying || job.status === "PROCESSING" || job.status === "COMPLETED"}
                      onClick={() => handleRetry(job.jobId)}
                      className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-purple-400/30 disabled:opacity-40"
                    >
                      <RefreshCw size={11} />
                      Retry
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ------- Tenants tab ---------------------------------------------------------

function TenantsTab() {
  const { data: tenants = [], isLoading, isError, error, refetch } = useListAdminTenantsQuery();
  const [activate, { isLoading: activating }] = useActivateAdminTenantMutation();
  const [deactivate, { isLoading: deactivating }] = useDeactivateAdminTenantMutation();
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filtered = tenants.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (t.name || "").toLowerCase().includes(q)
      || (t.slug || "").toLowerCase().includes(q)
      || (t.primaryContactEmail || "").toLowerCase().includes(q);
  });

  const handleActivate = async (t) => {
    setBusyId(t.id);
    setFlash(null);
    try {
      await activate(t.id).unwrap();
      setFlash({ tone: "success", message: `${t.name} activated. status → ACTIVE.` });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.message || err?.data?.detail || "Activate failed" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (t) => {
    // Reason is required by policy (so an auditor can tell later WHY a tenant was cut off) --
    // ship the prompt as a native browser prompt for now; a dedicated modal is polish for later.
    const reason = window.prompt(`Reason for suspending "${t.name}"?\n(Lands in tenants.suspension_reason — used for audit later.)`);
    if (reason == null) return; // cancelled
    setBusyId(t.id);
    setFlash(null);
    try {
      await deactivate({ tenantId: t.id, reason }).unwrap();
      setFlash({ tone: "warn", message: `${t.name} suspended. status → SUSPENDED. Reason: ${reason || "(none)"}` });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.message || err?.data?.detail || "Deactivate failed" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name / slug / email"
          className="creator-input flex-1 px-2.5 py-1.5 text-[11px] font-semibold"
        />
        <button
          type="button"
          onClick={refetch}
          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:border-purple-400/30"
        >
          Reload
        </button>
      </div>
      {flash && (<Notice tone={flash.tone} icon={flash.tone === "error" ? <AlertTriangle size={14} /> : null}>{flash.message}</Notice>)}
      {isLoading && <Loader label="Loading tenants" />}
      {isError && <Notice tone="error" icon={<AlertTriangle size={14} />}>Could not load tenants: {error?.status || "unknown"}</Notice>}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-[11px]">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <Th>Tenant</Th><Th>Contact</Th><Th>Status</Th><Th>Keycloak</Th><Th>Type</Th><Th>Created</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t) => {
                const isActive = t.status === "ACTIVE";
                const rowBusy = busyId === t.id && (activating || deactivating);
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <Td>
                      <div className="font-semibold text-slate-200">{t.name}</div>
                      <div className="text-slate-500">{t.slug} · <code className="text-[10px]">{t.id.slice(0, 8)}</code></div>
                    </Td>
                    <Td>
                      <div className="text-slate-300">{t.primaryContactName || "-"}</div>
                      <div className="text-slate-500">{t.primaryContactEmail}</div>
                    </Td>
                    <Td>
                      <StatusPill status={t.status} />
                      {t.statusMessage && (
                        <div className="mt-1 max-w-xs truncate text-rose-300" title={t.statusMessage}>{t.statusMessage}</div>
                      )}
                    </Td>
                    <Td className={t.keycloakConfigured ? "text-emerald-300" : "text-rose-300"}>
                      {t.keycloakConfigured ? "configured" : "MISSING"}
                    </Td>
                    <Td className="text-slate-300">{t.accountType || "-"}</Td>
                    <Td className="text-slate-400">{formatTime(t.createdAt)}</Td>
                    <Td>
                      {isActive ? (
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => handleDeactivate(t)}
                          className="flex items-center gap-1 rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-200 hover:border-rose-400/60 disabled:opacity-40"
                        >
                          {rowBusy ? <Loader2 size={11} className="animate-spin" /> : <AlertTriangle size={11} />}
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => handleActivate(t)}
                          className="flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-200 hover:border-emerald-400/60 disabled:opacity-40"
                        >
                          {rowBusy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                          Activate
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ------- Wallets tab ---------------------------------------------------------

function WalletsTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const [tenantId, setTenantId] = useState("");
  const { data: wallet, isFetching, isError, error } = useGetAdminWalletQuery(tenantId, { skip: !tenantId });
  const [credit, { isLoading: crediting }] = useCreditAdminWalletMutation();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [flash, setFlash] = useState(null);

  const handleCredit = async () => {
    setFlash(null);
    try {
      await credit({ tenantId, amount: Number(amount), reference }).unwrap();
      setFlash({ tone: "success", message: `Credited ₹${amount} to wallet. Reference recorded in transaction ledger.` });
      setAmount("");
      setReference("");
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.detail || err?.data?.message || "Credit failed" });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-slate-500">Tenant:</label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="creator-input flex-1 px-2.5 py-1.5 text-[11px] font-semibold"
        >
          <option value="">— pick a tenant —</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.primaryContactEmail})</option>
          ))}
        </select>
      </div>

      {flash && (<Notice tone={flash.tone} icon={flash.tone === "error" ? <AlertTriangle size={14} /> : null}>{flash.message}</Notice>)}

      {!tenantId && <p className="rounded-lg border border-dashed border-white/10 py-6 text-center text-xs text-slate-500">Pick a tenant to view their wallet.</p>}
      {tenantId && isFetching && <Loader label="Loading wallet" />}
      {tenantId && isError && <Notice tone="error" icon={<AlertTriangle size={14} />}>Could not load wallet: {error?.status === 404 ? "no wallet exists for this tenant" : error?.status}</Notice>}

      {wallet && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-purple-300">Balance</p>
            <p className="mt-1 text-3xl font-black text-slate-100">{wallet.currency} {Number(wallet.balance).toFixed(2)}</p>
            <dl className="mt-3 space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between"><dt>Credit limit</dt><dd>{wallet.creditLimit ?? "-"}</dd></div>
              <div className="flex justify-between"><dt>Low-balance alert</dt><dd>{wallet.lowBalanceThreshold ?? "-"}</dd></div>
              <div className="flex justify-between"><dt>Auto-recharge</dt><dd>{wallet.autoRechargeEnabled ? `on @ ${wallet.autoRechargeThreshold} → ${wallet.autoRechargeAmount}` : "off"}</dd></div>
              <div className="flex justify-between"><dt>Last recharged</dt><dd>{formatTime(wallet.lastRechargedAt)}</dd></div>
              <div className="flex justify-between"><dt>Last deducted</dt><dd>{formatTime(wallet.lastDeductedAt)}</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-purple-300">Manual credit</p>
            <p className="mt-1 text-[11px] text-slate-400">Off-payment adjustment. Reference is required and lands verbatim in the transaction ledger for audit.</p>
            <div className="mt-3 space-y-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Amount in ${wallet.currency}`}
                className="creator-input w-full px-2.5 py-1.5 text-[11px] font-semibold"
              />
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={"Reference (e.g. 'comp for shot-list-gen incident 2026-09-20')"}
                className="creator-input w-full px-2.5 py-1.5 text-[11px] font-semibold"
              />
              <button
                type="button"
                onClick={handleCredit}
                disabled={crediting || !amount || Number(amount) <= 0 || !reference || reference.length < 3}
                className="creator-primary flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-40"
              >
                {crediting ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                Apply credit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ------- Bits and pieces -----------------------------------------------------

function Th({ children }) {
  return <th className="px-3 py-2 text-left font-bold">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

function StatusPill({ status }) {
  const tone = {
    FAILED: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    TIMED_OUT: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    CANCELLED: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    PROCESSING: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  }[status] || "bg-slate-500/15 text-slate-300 border-slate-400/30";
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>{status}</span>
  );
}

function Notice({ children, tone = "info", icon = null }) {
  const tones = {
    info: "border-purple-400/25 bg-purple-500/[0.06] text-slate-200",
    success: "border-emerald-400/25 bg-emerald-500/[0.06] text-emerald-100",
    warn: "border-amber-400/25 bg-amber-500/[0.06] text-amber-100",
    error: "border-rose-400/25 bg-rose-500/[0.06] text-rose-100",
  };
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${tones[tone] || tones.info}`}>
      {icon && <span className="mt-0.5">{icon}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Loader({ label }) {
  return (
    <div className="flex items-center gap-2 py-8 text-xs text-slate-400">
      <Loader2 size={13} className="animate-spin" />
      {label}
    </div>
  );
}

function formatTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return value;
  }
}
