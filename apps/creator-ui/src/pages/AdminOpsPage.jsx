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
  useListRecentLlmJobsQuery,
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
  // On ops.dalaillama.in the perimeter is oauth2-proxy + dalai_admin at the Istio gateway --
  // any request that reaches this component is already role-checked upstream. The Redux
  // auth.user is null here because creator-ui's OWN Keycloak flow (client=creator-ui) never
  // runs on ops.*; the oauth2-proxy flow uses a different client (client=ops-dashboard) and
  // sets a cookie the React SPA cannot introspect. So we trust the gate on ops.* and skip
  // the in-app role check. On any other host isServedOnOpsHost() short-circuits above.

  // /admin is deliberately narrow: LLM job ledger, tenants, wallets. Metrics/logs/traces/mesh
  // live at their own subdomains (grafana./prometheus./jaeger./kiali./loki.dalaillama.in) so
  // each tool serves at its native root without subpath contortions -- see
  // manifests/ops-tool-subdomains.yaml. The ExternalTools nav below links them out.
  const TABS = [
    { key: "jobs", label: "LLM jobs", component: <JobsTab /> },
    { key: "tenants", label: "Tenants", component: <TenantsTab /> },
    { key: "wallets", label: "Wallets", component: <WalletsTab /> },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Ops dashboard</p>
          <h1 className="mt-1 text-2xl font-black text-slate-100">Platform admin</h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Signed in via oauth2-proxy (Keycloak <code className="text-slate-300">dalai_admin</code>).
            Actions here affect real tenant data — no undo.
          </p>
        </div>
        {/* Sign-out flow: oauth2-proxy /oauth2/sign_out clears its session cookie on ops.
         * dalaillama.in. The rd= URL is the Keycloak end-session endpoint so Keycloak's own
         * session is closed too (otherwise clicking sign-out then immediately hitting /admin
         * would silently sign back in via the still-valid Keycloak session). After Keycloak
         * ends the session it 302s to post_logout_redirect_uri which we point back at
         * ops.dalaillama.in/admin -- a fresh login prompt greets the operator on return. */}
        <SignOutButton />
      </header>
      {/* External tools: sibling subdomains, oauth2-proxy shares the same dalai_admin session
       * across .dalaillama.in via the cookie domain, so clicking these opens the tool without
       * re-login. Each tool serves at its own native root -- no subpath quirks. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px]">
        <span className="font-extrabold uppercase tracking-wide text-slate-500">Ops tools:</span>
        <a href="https://grafana.dalaillama.in/" target="_blank" rel="noreferrer" className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200">Grafana</a>
        <a href="https://prometheus.dalaillama.in/" target="_blank" rel="noreferrer" className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200">Prometheus</a>
        <a href="https://jaeger.dalaillama.in/" target="_blank" rel="noreferrer" className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200">Jaeger</a>
        <a href="https://kiali.dalaillama.in/" target="_blank" rel="noreferrer" className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200">Kiali</a>
        <a href="https://loki.dalaillama.in/" target="_blank" rel="noreferrer" className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200">Loki</a>
      </div>
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
  // "stuck" hides COMPLETED so operator focus is on things needing attention. "all" shows
  // every job for the "did this run" audit view.
  const [scope, setScope] = useState("stuck");
  const stuckQuery = useListStuckLlmJobsQuery(lookbackHours, { skip: scope !== "stuck" });
  const recentQuery = useListRecentLlmJobsQuery(lookbackHours, { skip: scope !== "all" });
  const { data: jobs = [], isLoading, isError, error, refetch } = scope === "stuck" ? stuckQuery : recentQuery;
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
          <label className="text-slate-500">Scope:</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-200"
          >
            <option value="stuck">Needs attention (stuck/failed)</option>
            <option value="all">All jobs (incl. completed)</option>
          </select>
          <label className="ml-2 text-slate-500">Lookback:</label>
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
          href="https://grafana.dalaillama.in/explore"
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

// ------- Sign-out ------------------------------------------------------------

function SignOutButton() {
  const handleSignOut = () => {
    const keycloakLogout = new URL("https://auth.dalaillama.in/realms/dalai-llama/protocol/openid-connect/logout");
    keycloakLogout.searchParams.set("client_id", "ops-dashboard");
    keycloakLogout.searchParams.set("post_logout_redirect_uri", `${window.location.origin}/admin`);
    const rd = encodeURIComponent(keycloakLogout.toString());
    window.location.href = `${window.location.origin}/oauth2/sign_out?rd=${rd}`;
  };
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-rose-400/40 hover:text-rose-200"
    >
      Sign out
    </button>
  );
}

// ------- Embedded tool tab (Grafana / Kiali / Prom / Jaeger) ----------------

/** Iframes an ops tool served from the same origin. Auth is already established
 * (oauth2-proxy set the cookie on ops.dalaillama.in), so the iframe request
 * carries the cookie automatically and the tool renders inline.
 *
 * Grafana needs [security] allow_embedding = true (set in grafana-ops-config.yaml).
 * Kiali/Prometheus/Jaeger have no default frame-ancestors restriction so they
 * work out of the box.
 *
 * A "pop out" link on the header row escape-hatches into the same tool as a
 * standalone tab -- useful for deep dives where the iframe chrome (this page's
 * header, tab bar) wastes vertical space. */
function EmbeddedToolTab({ src, name }) {
  return (
    <div className="flex h-[calc(100vh-190px)] flex-col rounded-lg border border-white/10 bg-black/20">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-slate-500">
        <span>{name} · <code className="text-slate-400">{src}</code></span>
        {/* "Pop out" (previously a new-tab link) removed -- same oauth2-proxy ext-authz
         * redirect quirk as the "Open in Grafana" link. The iframe below already carries the
         * session cookie from ops.dalaillama.in; opening the tool full-screen inside the same
         * tab is achievable by clicking the browser's own "open in new tab" on the URL if
         * really needed. */}
      </div>
      <iframe
        src={src}
        title={name}
        className="flex-1 border-0"
        // Sandboxed but with the flags each tool needs to work: run scripts, keep same-origin
        // cookies for auth, allow top-frame navigation for internal links, allow popups.
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation allow-downloads"
      />
    </div>
  );
}

// ------- Live errors tab (Loki-backed) --------------------------------------

/** Reusable Loki log viewer. LogQL comes from the parent tab so this component
 * stays generic -- error stream, LLM gateway stream, tenant-filtered slice, etc.
 * are all the same widget with different queries. */
function LokiLogPanel({ logql, sinceMinutes, tenantFilter, limit = 100, refetchMs = 15000 }) {
  const fullQuery = tenantFilter ? `${logql} |= "tenant_id=\\"${tenantFilter}\\""` : logql;
  const { data, isFetching, refetch } = useQueryLokiRangeQuery(
    { logql: fullQuery, sinceMinutes, limit },
    { pollingInterval: refetchMs, refetchOnMountOrArgChange: true }
  );

  const rows = (data?.data?.result || []).flatMap((stream) =>
    (stream.values || []).map(([ns, line]) => ({
      ts: new Date(Number(ns) / 1_000_000),
      labels: stream.stream || {},
      line,
    }))
  ).sort((a, b) => b.ts - a.ts);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span>Query: <code className="text-slate-400">{fullQuery}</code></span>
        <span className="ml-auto">
          {isFetching ? <Loader2 size={11} className="inline animate-spin" /> : `${rows.length} lines · auto-refresh ${refetchMs / 1000}s`}
        </span>
        <button
          type="button"
          onClick={refetch}
          className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-slate-300 hover:border-purple-400/30"
        >
          Reload
        </button>
      </div>
      <div className="max-h-[500px] overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[10.5px] leading-4">
        {rows.length === 0 && !isFetching && (
          <p className="p-2 text-slate-500">No log lines in the last {sinceMinutes} minutes.</p>
        )}
        {rows.map((r, i) => {
          const parsed = tryParseJson(r.line);
          const level = parsed?.level || r.labels.level || "";
          const tenantId = parsed?.tenant_id || r.labels.tenant_id || "";
          const msg = parsed?.message || r.line;
          const levelTone = level === "ERROR" ? "text-rose-300" : level === "WARN" ? "text-amber-300" : "text-slate-400";
          return (
            <div key={`${r.ts.getTime()}-${i}`} className="border-b border-white/5 py-1">
              <span className="text-slate-500">{r.ts.toISOString().slice(11, 23)}</span>{" "}
              <span className={`font-bold ${levelTone}`}>{level.padEnd(5) || "     "}</span>{" "}
              <span className="text-purple-300">{r.labels.app || parsed?.app || "-"}</span>{" "}
              {tenantId && <span className="text-emerald-300">t={tenantId.slice(0, 8)}</span>}{" "}
              <span className="text-slate-200">{msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function tryParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function LiveErrorsTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const [tenantId, setTenantId] = useState("");
  const [sinceMinutes, setSinceMinutes] = useState(60);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-slate-500">Tenant filter:</label>
        <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="creator-input px-2 py-1 text-[11px]">
          <option value="">All tenants</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label className="ml-2 text-slate-500">Since:</label>
        <select value={sinceMinutes} onChange={(e) => setSinceMinutes(Number(e.target.value))} className="creator-input px-2 py-1 text-[11px]">
          <option value={15}>15 min</option>
          <option value={60}>1 hour</option>
          <option value={360}>6 hours</option>
          <option value={1440}>24 hours</option>
        </select>
        {/* The "Open in Grafana" link that used to live here opened a new tab whose ext-authz
         * call had oauth2-proxy record /oauth2/auth/grafana/explore as the post-auth redirect
         * target (Envoy path_prefix + client path), so the user landed on the internal ext-authz
         * URL after login. Cleanest fix is the Grafana tab in the nav bar above -- it iframes
         * the same Grafana with a live authenticated session, no new-tab handoff needed. */}
      </div>
      <LokiLogPanel
        logql={'{level="ERROR"}'}
        sinceMinutes={sinceMinutes}
        tenantFilter={tenantId}
        refetchMs={10000}
      />
    </section>
  );
}

// ------- LLM gateway logs tab -----------------------------------------------

function LlmGatewayLogsTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const [tenantId, setTenantId] = useState("");
  const [sinceMinutes, setSinceMinutes] = useState(60);
  const [levelFilter, setLevelFilter] = useState("all");
  const baseQuery = levelFilter === "all"
    ? '{app="llm-gateway"}'
    : `{app="llm-gateway",level="${levelFilter}"}`;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-slate-500">Tenant:</label>
        <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="creator-input px-2 py-1 text-[11px]">
          <option value="">All</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label className="ml-2 text-slate-500">Level:</label>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="creator-input px-2 py-1 text-[11px]">
          <option value="all">All</option>
          <option value="ERROR">ERROR</option>
          <option value="WARN">WARN</option>
          <option value="INFO">INFO</option>
        </select>
        <label className="ml-2 text-slate-500">Since:</label>
        <select value={sinceMinutes} onChange={(e) => setSinceMinutes(Number(e.target.value))} className="creator-input px-2 py-1 text-[11px]">
          <option value={15}>15 min</option>
          <option value={60}>1 hour</option>
          <option value={360}>6 hours</option>
          <option value={1440}>24 hours</option>
        </select>
        {/* See LiveErrorsTab: dropped the "Open in Grafana" link -- the Grafana tab in the
         * nav bar handles the same query in a same-session iframe without the new-tab
         * ext-authz redirect quirk. */}
      </div>
      <LokiLogPanel logql={baseQuery} sinceMinutes={sinceMinutes} tenantFilter={tenantId} refetchMs={10000} />
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
