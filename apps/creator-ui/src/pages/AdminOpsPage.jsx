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
import ShowcaseAdminTab from "../components/showcase/ShowcaseAdminTab.jsx";
import RequestRoutingTab from "../components/showcase/RequestRoutingTab.jsx";
import BrandMailHistory from "../components/outreach/BrandMailHistory.jsx";
import { INDUSTRIES } from "../components/showcase/showcaseLabels.js";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AlertTriangle, RefreshCw, ExternalLink, Loader2, ShieldAlert, Plus } from "lucide-react";
import {
  useListStuckLlmJobsQuery,
  useListRecentLlmJobsQuery,
  useRetryLlmJobMutation,
  useListAdminTenantsQuery,
  useActivateAdminTenantMutation,
  useDeactivateAdminTenantMutation,
  useGetAdminWalletQuery,
  useListAdminProjectEconomicsQuery,
  useListAdminProjectsQuery,
  useListAdminProviderCostsQuery,
  useGetAdminVideoPricingQuery,
  useGetAdminProductionCriticsQuery,
  useUpdateAdminProductionCriticsMutation,
  useUpdateAdminVideoPricingMutation,
  usePreviewAdminVideoPricingQuery,
  useCreditAdminWalletMutation,
  useListAdminPlansQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useActivateAdminPlanMutation,
  useDeactivateAdminPlanMutation,
  useListGrantablePlansQuery,
  useGetCreatorGrantQuery,
  useGrantCreatorPlanMutation,
  useEndCreatorGrantMutation,
  useListCreatorMailTemplatesQuery,
  useCountBrandMailAudienceQuery,
  useAddDirectoryBrandMutation,
  useSaveCreatorMailTemplateMutation,
  useListCreatorMailRecipientsQuery,
  useListCreatorMailSendsQuery,
  useSendCreatorMailMutation,
  useGetCreatorMailOverviewQuery,
  useImportCreatorLeadsMutation,
  useImportBrandDirectoryMutation,
  usePreviewCreatorMailMutation,
  useListAdminPayoutsQuery,
  useRetryAdminPayoutMutation,
  useMarkAdminPayoutPaidMutation,
} from "../api/creatorEndpoints.js";
import { ProductionChargeLines, ProjectEconomicsCard, money } from "../components/billing/ProjectEconomics.jsx";
import { ProviderCostCard, groupProviderCosts, usd } from "../components/billing/ProviderCosts.jsx";

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
    { key: "projects", label: "Project P&L", component: <ProjectEconomicsTab /> },
    { key: "costs", label: "Provider costs", component: <ProviderCostsTab /> },
    { key: "pricing", label: "Pricing", component: <PricingTab /> },
    { key: "plans", label: "Plans", component: <PlansTab /> },
    { key: "grants", label: "Free plans", component: <GrantsTab /> },
    { key: "payouts", label: "Payouts", component: <PayoutsTab /> },
    // Keyed apart: the same component in the same spot would otherwise carry one tab's audience (say,
    // two picked creators) over to the other, and a brand template would be sent to creators.
    { key: "creator-mail", label: "Mail creators", component: <CreatorMailTab key="creators" /> },
    { key: "brand-mail", label: "Mail brands", component: <CreatorMailTab key="brands" mailFor="BRANDS" /> },
    { key: "showcase", label: "Showcase", component: <ShowcaseAdminTab /> },
    { key: "requests", label: "Requests", component: <RequestRoutingTab /> },
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
                <Th>Tenant</Th><Th>Contact</Th><Th>Status</Th><Th>Keycloak</Th><Th>Type</Th><Th>Public profile</Th><Th>Created</Th><Th>Action</Th>
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
                    <Td>
                      {t.publicProfileUrl ? (
                        <>
                          <a href={t.publicProfileUrl} target="_blank" rel="noreferrer"
                             className="inline-flex items-center gap-1 text-purple-300 hover:underline">
                            Open <ExternalLink size={11} />
                          </a>
                          <div className={t.liveVideos ? "text-slate-500" : "text-amber-300"}>
                            {t.liveVideos ? `${t.liveVideos} video${t.liveVideos === 1 ? "" : "s"}` : "no video yet"}
                          </div>
                        </>
                      ) : <span className="text-slate-500">-</span>}
                    </Td>
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

// ------- Pricing tab ---------------------------------------------------------

/** Set the per-second video rate new briefs are quoted at, and preview what a client would pay.
 * A saved rate re-prices new briefs only -- every brief keeps the quote it was created with. */
function PricingTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const { data: pricing } = useGetAdminVideoPricingQuery();
  const [saveRate, { isLoading: saving }] = useUpdateAdminVideoPricingMutation();
  const [rateInput, setRateInput] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [seconds, setSeconds] = useState("60");
  const [flash, setFlash] = useState(null);
  const durationSeconds = Number(seconds);
  const canPreview = !!tenantId && Number.isInteger(durationSeconds) && durationSeconds >= 1 && durationSeconds <= 600;
  const { data: preview, isFetching } = usePreviewAdminVideoPricingQuery({ tenantId, durationSeconds }, { skip: !canPreview });

  useEffect(() => {
    if (pricing?.ratePerSecondInr != null) setRateInput(String(pricing.ratePerSecondInr));
  }, [pricing?.ratePerSecondInr]);

  const handleSave = async () => {
    setFlash(null);
    try {
      await saveRate(Number(rateInput)).unwrap();
      setFlash({ tone: "success", message: "Rate saved. New briefs are quoted at this rate; existing briefs keep their price." });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.detail || err?.data?.message || "Could not save the rate" });
    }
  };

  const quote = preview?.quote;
  return (
    <section className="space-y-4">
      <ProductionCriticsCard />

      <div className="creator-panel space-y-3 p-4">
        <p className="text-sm font-bold text-white">Video rate</p>
        <div className="flex flex-wrap items-end gap-2 text-xs">
          <label className="flex flex-col gap-1 text-slate-500">
            Rupees per second of video
            <input
              type="number"
              min="0.01"
              step="0.0001"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="creator-input w-36 px-2.5 py-1.5 text-[11px] font-semibold"
            />
          </label>
          <button
            type="button"
            disabled={saving || !(Number(rateInput) > 0)}
            onClick={handleSave}
            className="creator-primary px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save rate"}
          </button>
          {pricing && (
            <span className="text-[11px] text-slate-500">Default if never set: {money(pricing.defaultRatePerSecondInr)}/s</span>
          )}
        </div>
        {flash && (
          <p className={`text-[11px] font-semibold ${flash.tone === "success" ? "text-emerald-300" : "text-rose-300"}`}>{flash.message}</p>
        )}
      </div>

      <div className="creator-panel space-y-3 p-4">
        <p className="text-sm font-bold text-white">What will the client pay?</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="creator-input flex-1 px-2.5 py-1.5 text-[11px] font-semibold"
          >
            <option value="">— creator (their margin applies) —</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.primaryContactEmail})</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="600"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            className="creator-input w-20 px-2.5 py-1.5 text-[11px] font-semibold"
          />
          <span className="text-slate-500">seconds</span>
        </div>
        {!canPreview ? (
          <p className="text-[11px] text-slate-500">Pick a creator and a length between 1 and 600 seconds.</p>
        ) : isFetching || !preview ? (
          <p className="text-[11px] text-slate-500">Pricing…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Client is shown</p>
              <ProductionChargeLines production={preview.production} />
            </div>
            <div className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-slate-400">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">How it is built</p>
              <p>{quote.estimatedShotCount} shots, video at {money(preview.ratePerSecondInr)}/s</p>
              <p>Platform cost: <span className="font-bold text-slate-200">{money(quote.platformCost)}</span></p>
              <p>Creator margin: <span className="font-bold text-slate-200">{quote.creatorMarginPercent}% = {money(quote.creatorAmount)}</span></p>
              <p>Client pays: <span className="font-bold text-white">{money(quote.totalPrice, quote.currency)}</span></p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Production's critics (script, camera plan, lighting plan, per-shot pre-flight) send plans back
 * for more attempts; switched off, every plan is its first attempt. Applies from the next step. */
function ProductionCriticsCard() {
  const { data } = useGetAdminProductionCriticsQuery();
  const [setCritics, { isLoading }] = useUpdateAdminProductionCriticsMutation();
  const enabled = data?.enabled ?? true;
  return (
    <div className="creator-panel flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">Production critics: {enabled ? "on" : "off"}</p>
        <p className="text-[11px] text-slate-500">
          Script, camera, lighting and per-shot critics. Off: each plan is used as first generated, with no critic calls and no
          retries. Applies from the next generation step.
        </p>
      </div>
      <button
        type="button"
        disabled={isLoading || !data}
        onClick={() => setCritics(!enabled)}
        className={`px-3 py-1.5 text-[11px] font-bold disabled:opacity-60 ${enabled ? "creator-control text-slate-200" : "creator-primary text-white"}`}
      >
        {isLoading ? "Saving…" : enabled ? "Switch critics off" : "Switch critics on"}
      </button>
    </div>
  );
}

// ------- Provider costs tab ---------------------------------------------------

/** What each project actually cost at the providers -- Google, fal.ai, ElevenLabs -- per model, in
 * USD, from llm-gateway's per-call cost (recorded as each call finished, at the rate card's prices
 * for the tokens/images/seconds the provider reported). Picks the tenant itself when there is one. */
function ProviderCostsTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const [tenantId, setTenantId] = useState("");
  useEffect(() => {
    if (!tenantId && tenants.length === 1) setTenantId(tenants[0].id);
  }, [tenantId, tenants]);
  const { data: rows = [], isFetching, isError, error } = useListAdminProviderCostsQuery(tenantId, { skip: !tenantId });
  const { data: projects = [] } = useListAdminProjectsQuery(tenantId, { skip: !tenantId });
  const groups = React.useMemo(() => groupProviderCosts(rows, projects), [rows, projects]);
  const total = groups.reduce((sum, g) => sum + g.total, 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-slate-500">Tenant:</label>
        <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}
          className="creator-input flex-1 px-2.5 py-1.5 text-[11px] font-semibold">
          <option value="">— pick a tenant —</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.primaryContactEmail})</option>
          ))}
        </select>
        {tenantId && !isFetching && <span className="font-bold text-slate-200">All projects: {usd(total)}</span>}
      </div>
      <p className="text-[10px] text-slate-500">
        Actual usage priced at each provider's list rate when the call ran (USD). Calls that came back with no result
        (e.g. Gemini refusing an image) are counted under "No result".
      </p>
      {!tenantId ? null : isFetching ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : isError ? (
        <p className="text-xs text-rose-300">{error?.data?.message || "Could not load provider costs"}</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-slate-500">No provider calls recorded for this tenant yet.</p>
      ) : (
        groups.map((group) => <ProviderCostCard key={group.projectId || "none"} group={group} />)
      )}
    </section>
  );
}

// ------- Project P&L tab -----------------------------------------------------

/** Per project for one tenant: actual provider charges vs what the creator was charged vs what
 * the client paid, with the creator's and the platform's profit. Same card the creator sees,
 * plus the platform column billing only serves on this admin route. */
function ProjectEconomicsTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const [tenantId, setTenantId] = useState("");
  const { data: statements = [], isFetching, isError, error } = useListAdminProjectEconomicsQuery(tenantId, { skip: !tenantId });
  const { data: projects = [] } = useListAdminProjectsQuery(tenantId, { skip: !tenantId });
  const projectName = (id) => projects.find((p) => p.id === id)?.name || `Project ${id}`;

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
      {!tenantId ? null : isFetching ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : isError ? (
        <p className="text-xs text-rose-300">{error?.data?.message || "Could not load project economics"}</p>
      ) : statements.length === 0 ? (
        <p className="text-xs text-slate-500">This tenant has no charged or paid projects yet.</p>
      ) : (
        statements.map((economics) => (
          <ProjectEconomicsCard key={economics.projectId} economics={economics} title={projectName(economics.projectId)} />
        ))
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
    // Just clear the oauth2-proxy cookie and land back at /admin -- oauth2-proxy will re-auth
    // against Keycloak on the next request, and if the KC session is still live the user gets
    // straight back in (that's the shared-perimeter contract). We deliberately DON'T chain into
    // Keycloak's end_session endpoint: it validates post_logout_redirect_uri against the
    // ops-dashboard client's `post.logout.redirect.uris` attribute, and any mismatch (including
    // trailing-slash / port normalisation quirks) blows up with "invalid_redirect_uri" and
    // leaves the user stuck on a Keycloak error page instead of signed out. If a full KC logout
    // is ever required, provision a real logout job and hit it from server-side.
    window.location.href = `${window.location.origin}/oauth2/sign_out?rd=${encodeURIComponent("/admin")}`;
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

// ------- Plans tab ----------------------------------------------------------

function PlansTab() {
  const { data: plans = [], isLoading, isError, error, refetch } = useListAdminPlansQuery();
  const [createPlan, { isLoading: creating }] = useCreateAdminPlanMutation();
  const [activatePlan] = useActivateAdminPlanMutation();
  const [deactivatePlan] = useDeactivateAdminPlanMutation();
  const [flash, setFlash] = useState(null);

  // Create form state -- kept minimal, only monthly today per product ask.
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", description: "", amount: "", currency: "INR",
    walletCreditPerCycle: "",
  });

  const handleCreate = async () => {
    setFlash(null);
    try {
      await createPlan({
        code: form.code.toUpperCase(),
        name: form.name,
        description: form.description,
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
        frequency: "MONTHLY",
        walletCreditPerCycle: Number(form.walletCreditPerCycle),
        isDefault: false,
        active: true,
      }).unwrap();
      setFlash({ tone: "success", message: `Plan ${form.code} created` });
      setShowForm(false);
      setForm({ code: "", name: "", description: "", amount: "", currency: "INR", walletCreditPerCycle: "" });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.detail || err?.data?.message || "Create failed" });
    }
  };

  const handleToggle = async (plan) => {
    setFlash(null);
    try {
      if (plan.active) {
        await deactivatePlan(plan.id).unwrap();
        setFlash({ tone: "warn", message: `${plan.code} deactivated` });
      } else {
        await activatePlan(plan.id).unwrap();
        setFlash({ tone: "success", message: `${plan.code} activated` });
      }
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.detail || err?.data?.message || "Toggle failed" });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="creator-primary flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-white"
        >
          {showForm ? "Cancel" : "New monthly plan"}
        </button>
        <button
          type="button"
          onClick={refetch}
          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-300 hover:border-purple-400/30"
        >
          Reload
        </button>
      </div>
      {flash && (<Notice tone={flash.tone} icon={flash.tone === "error" ? <AlertTriangle size={14} /> : null}>{flash.message}</Notice>)}
      {showForm && (
        <div className="rounded-lg border border-purple-400/25 bg-purple-500/[0.05] p-3">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-purple-300">New monthly plan</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="code (STARTER, PRO, ...)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="creator-input px-2 py-1 text-[11px]" />
            <input placeholder="name (human-friendly)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="creator-input px-2 py-1 text-[11px]" />
            <input placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="creator-input px-2 py-1 text-[11px] sm:col-span-2" />
            <input type="number" step="0.01" placeholder="amount charged per month" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="creator-input px-2 py-1 text-[11px]" />
            <input type="number" step="0.01" placeholder="wallet credit per month" value={form.walletCreditPerCycle} onChange={(e) => setForm({ ...form, walletCreditPerCycle: e.target.value })} className="creator-input px-2 py-1 text-[11px]" />
            <input placeholder="currency (INR)" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="creator-input px-2 py-1 text-[11px]" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !form.code || !form.name || !form.amount || Number(form.amount) < 0 || !form.walletCreditPerCycle}
              className="creator-primary flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-white disabled:opacity-40"
            >
              {creating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Create
            </button>
            <span className="text-[10px] text-slate-500">Cycle: monthly (only supported today)</span>
          </div>
        </div>
      )}
      {isLoading && <Loader label="Loading plans" />}
      {isError && <Notice tone="error" icon={<AlertTriangle size={14} />}>Could not load plans: {error?.status || "unknown"}</Notice>}
      {!isLoading && !isError && plans.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/10 py-8 text-center text-xs font-medium text-slate-500">
          No plans yet. Create one to start enrolling tenants.
        </p>
      )}
      {plans.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-[11px]">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <Th>Plan</Th><Th>Charge / cycle</Th><Th>Wallet credit</Th><Th>Cycle</Th><Th>Status</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <Td>
                    <div className="font-bold text-slate-100">{p.name || p.code}</div>
                    <div className="text-slate-500">
                      <code className="text-[10px]">{p.code}</code>
                      {p.isDefault && <span className="ml-2 rounded bg-purple-500/20 px-1 py-0.5 text-[9px] font-bold text-purple-200">DEFAULT</span>}
                    </div>
                    {p.description && <div className="mt-1 max-w-md text-[10px] text-slate-500">{p.description}</div>}
                  </Td>
                  <Td className="font-mono text-slate-200">{p.currency} {Number(p.amount || 0).toFixed(2)}</Td>
                  <Td className="font-mono text-emerald-300">{p.currency} {Number(p.walletCreditPerCycle || 0).toFixed(2)}</Td>
                  <Td className="text-slate-300">{p.frequency}</Td>
                  <Td>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${p.active ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" : "border-slate-500/30 bg-slate-500/15 text-slate-400"}`}>
                      {p.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => handleToggle(p)}
                      className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-bold ${p.active ? "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/60"}`}
                    >
                      {p.active ? "Deactivate" : "Activate"}
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

/** Creator payouts: each project's share once the client's final payment is in. Until RazorpayX is
 * available they are paid by hand: a READY payout has already left the creator's wallet -- send that
 * amount to the bank / UPI shown, then enter the transfer's UTR to mark it paid. A FAILED payout's
 * money is back in the creator's wallet; Retry works it out again. */
function PayoutsTab() {
  const { data: rows = [], isLoading, refetch } = useListAdminPayoutsQuery();
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const [retry, { isLoading: retrying }] = useRetryAdminPayoutMutation();
  const [markPaid, { isLoading: marking }] = useMarkAdminPayoutPaidMutation();
  const [utrs, setUtrs] = useState({});
  const [flash, setFlash] = useState(null);
  const nameOf = React.useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);
  const toPay = rows.filter((r) => r.payout.status === "READY");

  const run = async (action, success) => {
    setFlash(null);
    try {
      await action().unwrap();
      setFlash({ tone: "success", message: success });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.message || "That didn't work" });
    }
  };
  const handleMarkPaid = (p) => run(() => markPaid({ payoutId: p.id, utr: utrs[p.id] || "" }),
    `Marked paid -- ${nameOf.get(p.tenantId) || "the creator"} now sees it as paid.`);
  const handleRetry = (p) => run(() => retry(p.id), "Queued again -- worked out afresh on the next run (about a minute).");
  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <div className="space-y-4">
      <Notice>
        Amount = what the client paid into the creator's wallet − the project's AI usage (as charged) − Razorpay's fees on those
        payments, capped at the wallet balance. A payout is <b>READY</b> once it's worked out and taken from the wallet: send
        that amount to the account shown, then enter the UTR and mark it paid.
      </Notice>
      {toPay.length > 0 && <Notice tone="warn">{toPay.length} payout{toPay.length > 1 ? "s" : ""} to pay by hand.</Notice>}
      {flash && <Notice tone={flash.tone}>{flash.message}</Notice>}
      <div className="creator-panel overflow-x-auto p-4">
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={refetch} className="text-xs font-bold text-purple-300 hover:underline">Refresh</button>
        </div>
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        ) : rows.length === 0 ? (
          <p className="text-xs text-slate-400">No payouts yet.</p>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2 pr-3">Creator</th><th className="pr-3">Project</th><th className="pr-3">Client paid</th>
                <th className="pr-3">Production</th><th className="pr-3">Fees</th><th className="pr-3">Payout</th>
                <th className="pr-3">Pay to</th><th className="pr-3">Status</th><th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(({ payout: p, payee }) => (
                <tr key={p.id} className="align-top">
                  <td className="py-2 pr-3">{nameOf.get(p.tenantId) || p.tenantId.slice(0, 8)}</td>
                  <td className="py-2 pr-3 font-mono">{p.projectId.slice(0, 8)}</td>
                  <td className="py-2 pr-3">{p.clientPaid != null ? money(p.clientPaid, p.currency) : "—"}</td>
                  <td className="py-2 pr-3">{p.productionCharged != null ? money(p.productionCharged, p.currency) : "—"}</td>
                  <td className="py-2 pr-3">{p.gatewayFees != null ? money(p.gatewayFees, p.currency) : "—"}</td>
                  <td className="py-2 pr-3 font-bold text-white">{p.amount != null ? money(p.amount, p.currency) : "—"}</td>
                  <td className="py-2 pr-3">
                    {!payee ? <span className="text-amber-300">No account yet</span> : payee.method === "UPI" ? (
                      <button type="button" onClick={() => copy(payee.vpa)} title="Copy" className="text-left hover:underline">
                        UPI {payee.vpa}<span className="block text-slate-500">{payee.holderName}</span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => copy(payee.accountNumber)} title="Copy account number" className="text-left font-mono hover:underline">
                        {payee.accountNumber} · {payee.ifsc}<span className="block font-sans text-slate-500">{payee.holderName}</span>
                      </button>
                    )}
                  </td>
                  <td className="py-2 pr-3" title={p.failureReason || ""}>
                    {p.status}{p.utr ? ` · UTR ${p.utr}` : ""}{p.failureReason ? ` · ${p.failureReason.slice(0, 60)}` : ""}
                  </td>
                  <td className="py-2">
                    {p.status === "READY" && (
                      <div className="flex items-center gap-2">
                        <input value={utrs[p.id] || ""} onChange={(e) => setUtrs({ ...utrs, [p.id]: e.target.value })} placeholder="UTR"
                               maxLength={64} className="w-32 rounded border border-white/10 bg-[#0b0f19] px-2 py-1 text-xs text-white" />
                        <button type="button" disabled={marking || !(utrs[p.id] || "").trim()} onClick={() => handleMarkPaid(p)}
                                className="whitespace-nowrap text-xs font-bold text-emerald-300 hover:underline disabled:opacity-50">Mark paid</button>
                      </div>
                    )}
                    {p.status === "FAILED" && (
                      <button type="button" disabled={retrying} onClick={() => handleRetry(p)}
                              className="text-xs font-bold text-purple-300 hover:underline disabled:opacity-50">Retry</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** Free plans: give a creator Studio or Pro free for a number of days. Nothing is charged or
 * renewed; when the days are up they are back on the free plan. A creator who pays is left alone. */
function GrantsTab() {
  const { data: tenants = [] } = useListAdminTenantsQuery();
  const { data: plans = [] } = useListGrantablePlansQuery();
  const [tenantId, setTenantId] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState(null);
  const { data: current, isFetching } = useGetCreatorGrantQuery(tenantId, { skip: !tenantId });
  const [grant, { isLoading: granting }] = useGrantCreatorPlanMutation();
  const [endGrant, { isLoading: ending }] = useEndCreatorGrantMutation();
  const plan = planCode || plans.find((p) => p.tier === "PROFESSIONAL")?.planCode || plans[0]?.planCode || "";
  const tenant = tenants.find((t) => t.id === tenantId);
  const ends = new Date(Date.now() + Number(days || 0) * 86400000);
  const planLabel = (p) => (p.tier === "PROFESSIONAL" ? "Pro" : p.tier === "STARTER" ? "Studio" : p.name);

  const handleGrant = async () => {
    setFlash(null);
    try {
      const result = await grant({ tenantId, planCode: plan, days: Number(days), note: note || null }).unwrap();
      setFlash({ tone: "success", message: `${tenant?.name || "Creator"} is on ${result.planName} free until ${new Date(result.expiresAt).toLocaleString()}.` });
      setNote("");
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.message || err?.data?.detail || "Couldn't grant the plan" });
    }
  };
  const handleEnd = async () => {
    if (!window.confirm(`End ${tenant?.name || "this creator"}'s free plan now? They go back to the free plan.`)) return;
    setFlash(null);
    try {
      await endGrant({ subscriptionId: current.subscriptionId, tenantId }).unwrap();
      setFlash({ tone: "warn", message: "Free plan ended." });
    } catch (err) {
      setFlash({ tone: "error", message: err?.data?.message || "Couldn't end the free plan" });
    }
  };

  const activeGrant = current?.complimentary && current.status === "ACTIVE";
  const field = "mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";
  return (
    <div className="space-y-4">
      <Notice>
        Give a creator a paid plan free for a set number of days. Nothing is charged or renewed; when the days are up they are back
        on the free plan. Granting again replaces the current free plan (to extend it or change the plan).
      </Notice>
      {flash && <Notice tone={flash.tone}>{flash.message}</Notice>}
      <div className="creator-panel grid gap-3 p-4 sm:grid-cols-2">
        <label className="text-xs text-slate-400">Creator
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={field}>
            <option value="">— pick a creator —</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">Plan
          <select value={plan} onChange={(e) => setPlanCode(e.target.value)} className={field}>
            {plans.map((p) => <option key={p.planCode} value={p.planCode}>{planLabel(p)}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">For how many days
          <input type="number" min={1} max={3660} value={days} onChange={(e) => setDays(e.target.value)} className={field} />
          <span className="mt-1 block text-[11px] text-slate-500">
            {[7, 30, 90, 365].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} className="mr-2 text-purple-300 hover:underline">
                {d === 365 ? "1 year" : `${d} days`}
              </button>
            ))}
            {Number(days) >= 1 && <>· ends {ends.toLocaleDateString()}</>}
          </span>
        </label>
        <label className="text-xs text-slate-400">Note (optional, for ops)
          <input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Launch partner, 3 months free" className={field} />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="button" disabled={!tenantId || !plan || granting || !(Number(days) >= 1)} onClick={handleGrant}
                  className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {granting ? "Granting…" : "Give this plan free"}
          </button>
          {tenantId && (isFetching ? <Loader2 size={13} className="animate-spin text-slate-400" /> : current && (
            <span className="text-xs text-slate-300">
              Now: {current.subscriptionId
                ? `${current.planName || current.planCode} · ${current.status}${current.complimentary ? " · free" : " · paid"}${current.expiresAt ? ` · until ${new Date(current.expiresAt).toLocaleDateString()}` : ""}`
                : "Free plan (never subscribed)"}
              {current.note ? ` · ${current.note}` : ""}
            </span>
          ))}
          {activeGrant && (
            <button type="button" disabled={ending} onClick={handleEnd} className="text-xs font-bold text-rose-300 hover:underline disabled:opacity-50">
              End free plan now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ------- Mail creators tab --------------------------------------------------

const EMPTY_TEMPLATE = { id: null, name: "", subject: "", body: "", ctaLabel: "", ctaUrl: "", ideaVideos: 0, ideaIndustry: "", style: "PLAIN", active: true };
const asDraft = (t) => ({
  id: t.id, name: t.name, subject: t.subject, body: t.body, ctaLabel: t.ctaLabel || "", ctaUrl: t.ctaUrl || "",
  ideaVideos: t.ideaVideos || 0, ideaIndustry: t.ideaIndustry || "", style: t.style || "PLAIN", active: t.active,
});

const SEND_AUDIENCE_LABEL = { ALL: "Every creator", CHOSEN: "Picked creators", NO_VIDEO: "No video on profile", LEADS: "Creator leads",
  BRANDS: "Brands", TEST: "Test" };
const COMPANY_SIZES = [["SMALL", "Small"], ["MEDIUM", "Medium"], ["LARGE", "Large"], ["ENTERPRISE", "Enterprise"]];

/** CSV uploads ops make: creators to invite (not on the platform yet), and the brand master list
 * creators search in Find brands. */
const EMPTY_BRAND = { company: "", website: "", name: "", designation: "", email: "", phone: "", industry: "", country: "IN", size: "SMALL", category: "" };

/** One brand into the brand directory, the way Marketing adds a lead: only the name and website are
 * needed. With no email it's listed as "Email not available" (and left out of brand mail) until one is
 * added: type the brand again with the email, and it joins the same brand. */
function AddBrandForm() {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(EMPTY_BRAND);
  const [note, setNote] = useState(null);
  const [add, { isLoading }] = useAddDirectoryBrandMutation();
  const field = "mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";
  const set = (key) => (e) => setBrand({ ...brand, [key]: e.target.value });
  const canSave = !isLoading && brand.company.trim() && (brand.website.trim() || brand.email.includes("@"));
  const save = async (e) => {
    e.preventDefault();
    setNote(null);
    try {
      const body = Object.fromEntries(Object.entries(brand).map(([k, v]) => [k, typeof v === "string" && !v.trim() ? null : v]));
      const r = await add(body).unwrap();
      setNote({ tone: "success", message: r.contacts > 0
        ? `${r.company} (${r.domain}) saved with ${r.contacts} contact${r.contacts === 1 ? "" : "s"}; it's in the brand count below.`
        : `${r.company} (${r.domain}) saved. No email yet, so it shows as "Email not available"; add it again with the email when you find it.` });
      setBrand(EMPTY_BRAND);
    } catch (err) {
      setNote({ tone: "error", message: err?.data?.message || err?.data?.detail || "Couldn't save the brand" });
    }
  };
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:underline">
        <Plus size={12} /> Add a brand
      </button>
    );
  }
  return (
    <form onSubmit={save} className="creator-panel grid gap-3 p-4 text-xs text-slate-400 sm:grid-cols-2">
      <p className="sm:col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Add a brand</p>
      <label>Brand name *<input required maxLength={160} value={brand.company} onChange={set("company")} className={field} placeholder="Kesar Kitchen" /></label>
      <label>Website *<input maxLength={255} value={brand.website} onChange={set("website")} className={field} placeholder="kesarkitchen.in" /></label>
      <label>Contact name<input maxLength={120} value={brand.name} onChange={set("name")} className={field} placeholder="Anita Rao" /></label>
      <label>Designation<input maxLength={120} value={brand.designation} onChange={set("designation")} className={field} placeholder="Founder" /></label>
      <label>Email (if known)<input type="email" maxLength={254} value={brand.email} onChange={set("email")} className={field} placeholder="anita@kesarkitchen.in" /></label>
      <label>Phone (if known)<input maxLength={32} value={brand.phone} onChange={set("phone")} className={field} placeholder="+91 98765 43210" /></label>
      <label>Industry
        <select value={brand.industry} onChange={set("industry")} className={field}>
          <option value="">Not sure</option>
          {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label>What it sells<input maxLength={80} value={brand.category} onChange={set("category")} className={field} placeholder="Pickles, Jewellery, Pet food…" /></label>
      <label>Size
        <select value={brand.size} onChange={set("size")} className={field}>
          {COMPANY_SIZES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label>Country<input maxLength={60} value={brand.country} onChange={set("country")} className={field} placeholder="IN" /></label>
      <p className="sm:col-span-2 text-[11px] text-slate-500">
        Only the name and website are needed. "What it sells" picks the inspiration videos its mail shows. Saving a brand that's already listed
        (same website) adds the new details and contact to it.
      </p>
      {note && <div className="sm:col-span-2"><Notice tone={note.tone}>{note.message}</Notice></div>}
      <div className="sm:col-span-2 flex gap-3">
        <button type="submit" disabled={!canSave} className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {isLoading ? "Saving…" : "Save brand"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setNote(null); }} className="text-xs text-slate-400 hover:underline">Close</button>
      </div>
    </form>
  );
}

function ListUploads({ onFlash }) {
  const [importLeads, leadsState] = useImportCreatorLeadsMutation();
  const [importBrands, brandsState] = useImportBrandDirectoryMutation();
  const upload = (run, describe) => async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      onFlash({ tone: "success", message: describe(await run(file).unwrap()) });
    } catch (err) {
      onFlash({ tone: "error", message: err?.data?.message || err?.data?.detail || "Couldn't read that file" });
    }
  };
  const button = "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white";
  return (
    <div className="creator-panel flex flex-wrap items-center gap-3 p-3 text-xs text-slate-400">
      <label className={button}>
        {leadsState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Upload creator leads (CSV)
        <input type="file" accept=".csv,text/csv" className="hidden"
               onChange={upload(importLeads, (r) => `${r.added} new creator leads, ${r.alreadyKnown} already known, ${r.rejected} rows without an email. ${r.totalLeads} leads in all.`)} />
      </label>
      <span>columns: email, name, website (their channel or page)</span>
      <label className={button}>
        {brandsState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Upload brand master list (CSV)
        <input type="file" accept=".csv,text/csv" className="hidden"
               onChange={upload(importBrands, (r) => `${r.companies} brands added or updated (${r.companiesWithoutEmail} without an email, shown as "Email not available"), ${r.contacts} contacts, ${r.rejected} rows skipped (no website or work email).`)} />
      </label>
      <span>columns: company, email, name, designation, phone, industry, website, country, size</span>
    </div>
  );
}

/** Ops mail to creators: keep templates, then send one to every active creator, creators whose
 * profile has no video yet, chosen creators, or the creator leads ops uploaded (not on the platform
 * yet); or to yourself as a test. {name} becomes the first name. Mail is queued and leaves a limited
 * number a day, each with an unsubscribe link; a template reaches an address once. */
function CreatorMailTab({ mailFor = "CREATORS" }) {
  const forBrands = mailFor === "BRANDS";
  const { data: templates = [] } = useListCreatorMailTemplatesQuery(forBrands ? "BRANDS" : undefined);
  const { data: creators = [] } = useListCreatorMailRecipientsQuery(undefined, { skip: forBrands });
  // Brand mail: which brands (an empty list doesn't narrow); the count follows the filter.
  const [brandFilter, setBrandFilter] = useState({ industries: [], sizes: ["SMALL"], countries: ["IN"] });
  const { data: brandAudience } = useCountBrandMailAudienceQuery(brandFilter, { skip: !forBrands });
  const flip = (key, value) => setBrandFilter((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
  const { data: sends = [] } = useListCreatorMailSendsQuery();
  const { data: overview } = useGetCreatorMailOverviewQuery(undefined, { pollingInterval: 60000 });
  const [save, { isLoading: saving }] = useSaveCreatorMailTemplateMutation();
  const [send, { isLoading: sending }] = useSendCreatorMailMutation();
  const [draft, setDraft] = useState(EMPTY_TEMPLATE);
  const [audience, setAudience] = useState(forBrands ? "BRANDS" : "ALL");
  const [chosen, setChosen] = useState([]);
  const [testEmail, setTestEmail] = useState("");
  const [flash, setFlash] = useState(null);
  // The last send's outcome, shown by the send button (where ops are looking).
  const [sendNote, setSendNote] = useState(null);
  const field = "mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";
  const saved = templates.find((t) => t.id === draft.id);
  const dirty = !saved || JSON.stringify(asDraft(saved)) !== JSON.stringify(draft);
  const [renderPreview, { data: rendered }] = usePreviewCreatorMailMutation();
  // The real mail in its chosen look, redrawn shortly after each edit.
  useEffect(() => {
    if (!draft.subject && !draft.body) return undefined;
    const timer = setTimeout(() => {
      renderPreview({ subject: draft.subject, body: draft.body, ctaLabel: draft.ctaLabel, ctaUrl: draft.ctaUrl, ideaVideos: draft.ideaVideos, ideaIndustry: draft.ideaIndustry || null, style: draft.style, mailFor,
        brands: forBrands ? brandFilter : null });
    }, 500);
    return () => clearTimeout(timer);
  }, [draft.subject, draft.body, draft.ctaLabel, draft.ctaUrl, draft.ideaVideos, draft.ideaIndustry, draft.style, forBrands, brandFilter, renderPreview]);
  const noVideo = creators.filter((c) => !c.liveVideos).length;
  const AUDIENCES = [
    ["ALL", `Every active creator (${creators.length})`],
    ["NO_VIDEO", `Creators with no video on their profile (${noVideo})`],
    ["CHOSEN", `Only the ones I pick (${chosen.length})`],
    ["LEADS", `Creator leads, not on the platform yet (${overview?.creatorLeads ?? 0} uploaded)`],
  ];
  const recipients = { ALL: creators.length, NO_VIDEO: noVideo, CHOSEN: chosen.length, LEADS: overview?.creatorLeads ?? 0,
    BRANDS: brandAudience?.brands ?? 0 }[audience];
  const firstName = (creators[0]?.name || "Asha").trim().split(/\s+/)[0];
  const preview = (s) => s.split("{name}").join(firstName);
  // A subject as ops read it outside the preview: {name} differs per creator.
  // The first name the mail would use for someone, roughly as the server does (an address-like name gives none).
  const firstOf = (name) => {
    const word = (name || "").trim().split(/\s+/)[0] || "";
    return /^[\p{L}'-]{2,20}$/u.test(word) ? word[0].toUpperCase() + word.slice(1).toLowerCase() : "creator";
  };
  const audienceCreators = { ALL: creators, NO_VIDEO: creators.filter((c) => !c.liveVideos),
    CHOSEN: creators.filter((c) => chosen.includes(c.tenantId)), LEADS: [] }[audience] || [];
  const example = audienceCreators[0];
  // A stored subject with {name} shown as a placeholder chip (it differs per creator).
  const named = (s) => (s || "").split("{name}").flatMap((part, i) => (i === 0 ? [part] : [
    <span key={i} className="rounded bg-purple-500/20 px-1 text-purple-200">first name</span>, part]));
  const plural = (n) => `${n} ${{ LEADS: "lead", BRANDS: "brand" }[audience] || "creator"}${n === 1 ? "" : "s"}`;
  const errorOf = (err, fallback) => err?.data?.message || err?.data?.detail || fallback;

  const handleSave = async () => {
    setFlash(null);
    try {
      const t = await save({ ...draft, ideaIndustry: draft.ideaIndustry || null, mailFor }).unwrap();
      setDraft(asDraft(t));
      setFlash({ tone: "success", message: "Template saved." });
    } catch (err) {
      setFlash({ tone: "error", message: errorOf(err, "Couldn't save the template") });
    }
  };
  const handleSend = async (test) => {
    const sample = forBrands
      ? `${draft.subject.split("{name}").join("[first name]").split("{company}").join(brandAudience?.sample?.[0] || "[brand]")}" (each brand's mail carries its own contact's first name and brand name)`
      : example ? `${draft.subject.split("{name}").join(firstOf(example.name))}" (as ${example.name} sees it; each gets their own name)`
      : `${draft.subject.split("{name}").join("Asha")}" (each lead gets their own name)`;
    if (!test && !window.confirm(`Send "${sample} to up to ${plural(recipients)}?`)) return;
    setFlash(null);
    setSendNote(null);
    try {
      const result = await send(test
        ? { templateId: draft.id, audience: "TEST", testEmail }
        : forBrands ? { templateId: draft.id, audience: "BRANDS", brands: brandFilter }
        : { templateId: draft.id, audience, tenantIds: audience === "CHOSEN" ? chosen : [] }).unwrap();
      const skipped = [
        result.alreadyHad ? `${result.alreadyHad} already had this mail` : null,
        result.unsubscribed ? `${result.unsubscribed} unsubscribed` : null,
      ].filter(Boolean).join(", ");
      setSendNote(test
        ? { tone: "success", message: `Test handed to the mail server for ${testEmail}; it usually arrives within a minute. Not there? Check Spam and Promotions.` }
        : result.recipients === 0
          ? { tone: "warn", message: `Nothing sent: nobody new to send this to${skipped ? ` (${skipped})` : ""}. A template reaches each address once, so pick another template or write a new one.` }
          : { tone: "success", message: `${plural(result.recipients)} queued; they go out within a few minutes (up to ${overview?.dailyCap ?? "a set number of"} a day).${skipped ? ` Skipped: ${skipped}.` : ""}` });
    } catch (err) {
      setSendNote({ tone: "error", message: errorOf(err, "Couldn't send") });
    }
  };
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const canSave = !saving && dirty && draft.name.trim() && draft.subject.trim() && draft.body.trim();

  return (
    <div className="space-y-4">
      <Notice>
        {forBrands ? <>Write a mail for brands once, keep it as a template, and send it to the brands in the directory (the brand master
        list you upload), picked by industry, size and country: one mail per brand, to its best contact. <code>{"{company}"}</code> is the
        brand's name; inspiration videos come from each brand's own industry unless the template picks one. </> : null}
        {forBrands ? null : <>Write a mail once, keep it as a template, and send it to creators on the platform or to creator leads you uploaded. </>}It goes
        from Akash (hello@partner.dalaillama.in) with an unsubscribe link. Write <code>{"{name}"}</code> for the first name; a
        blank line starts a new paragraph and links become clickable. Mails queue and go out {overview?.dailyCap ?? "a set number"} a
        day; a template reaches each address once. Send yourself a test first.
      </Notice>
      {overview && (
        <p className="text-xs text-slate-400">
          {overview.sentToday} of {overview.dailyCap} sent today · {overview.queued} waiting · {overview.creatorLeads} creator leads uploaded
        </p>
      )}
      <ListUploads onFlash={setFlash} />
      {forBrands && <AddBrandForm />}
      {flash && <Notice tone={flash.tone}>{flash.message}</Notice>}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="creator-panel space-y-1 p-3">
          <button type="button" onClick={() => setDraft(EMPTY_TEMPLATE)}
                  className="mb-2 flex items-center gap-1 text-xs font-bold text-purple-300 hover:underline">
            <Plus size={12} /> New template
          </button>
          {templates.length === 0 && <p className="text-xs text-slate-500">No templates yet.</p>}
          {templates.map((t) => (
            <button key={t.id} type="button"
                    onClick={() => { setDraft(asDraft(t)); setSendNote(null); }}
                    className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs ${draft.id === t.id ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"}`}>
              <span className={t.active ? "" : "line-through opacity-60"}>{t.name}</span>
              <span className="block text-[10px] text-slate-500">
                {t.lastSentAt ? `last sent ${new Date(t.lastSentAt).toLocaleDateString()}` : "never sent"}
              </span>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <div className="creator-panel grid gap-3 p-4">
            <label className="text-xs text-slate-400">Template name (only ops see it)
              <input maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field}
                     placeholder="e.g. New feature: brand requests" />
            </label>
            <label className="text-xs text-slate-400">Subject
              <input maxLength={200} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className={field}
                     placeholder="{name}, brands can now request videos from you" />
            </label>
            <label className="text-xs text-slate-400">Message
              <textarea rows={10} maxLength={10000} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                        className={field} placeholder={"Hi {name},\n\n..."} />
              <span className="mt-1 block text-[11px] text-slate-500">{"{name}"} is their first name, from their account, the lead upload, or their address (asha.rao@ reads Asha). With none it reads "creator", and a subject starting "{"{name}"}," just drops it.</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">Link text (optional)
                <input maxLength={40} value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} className={field}
                       placeholder="Join Dalai Llama here" />
              </label>
              <label className="text-xs text-slate-400">Link
                <input maxLength={300} value={draft.ctaUrl} onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })} className={field}
                       placeholder="https://creator.dalaillama.in" />
              </label>
            </div>
            <label className="text-xs text-slate-400">Look
              <select value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} className={field}>
                <option value="PLAIN">Plain letter from Akash (best for the main inbox)</option>
                <option value="STYLED">Styled mail: picture cards and a button (often lands in Promotions)</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">Inspiration videos in the mail
              <select value={draft.ideaVideos} onChange={(e) => setDraft({ ...draft, ideaVideos: Number(e.target.value) })} className={field}>
                <option value={0}>None</option>
                <option value={1}>1 video from the inspiration board</option>
                <option value={2}>2 videos from the inspiration board</option>
                <option value={3}>3 videos from the inspiration board</option>
              </select>
              <span className="mt-1 block text-[11px] text-slate-500">Picked when each mail goes out, after your message: listed by title in a plain letter, as picture cards in a styled mail.</span>
            </label>
            {draft.ideaVideos > 0 && (
              <label className="text-xs text-slate-400">Which kind of videos
                <select value={draft.ideaIndustry} onChange={(e) => setDraft({ ...draft, ideaIndustry: e.target.value })} className={field}>
                  <option value="">Random: a different industry for every mail</option>
                  {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </label>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={!canSave} onClick={handleSave}
                      className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                {saving ? "Saving…" : draft.id ? "Save changes" : "Save template"}
              </button>
              {draft.id && (
                <label className="flex items-center gap-1.5 text-xs text-slate-300">
                  <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                  In use (untick and save to retire it)
                </label>
              )}
            </div>
          </div>
          {(draft.subject || draft.body) && (
            <div className="creator-panel p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Preview, as it arrives ({forBrands ? "for Asha at Hearth Foods, a food brand" : "for a creator called Asha"})</p>
              {rendered?.to && <p className="mt-2 text-xs text-slate-400">As mailed to {rendered.to}, the first brand you picked</p>}
              <p className="mt-2 text-sm font-bold text-white">{rendered?.subject || preview(draft.subject)}</p>
              {rendered?.html ? (
                <iframe title="Mail preview" srcDoc={rendered.html} sandbox="" className="mt-3 h-[560px] w-full rounded-lg border border-white/10 bg-white" />
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{preview(draft.body)}</p>
              )}
            </div>
          )}
          <div className="creator-panel space-y-3 p-4">
            {!draft.id || dirty ? (
              <p className="text-xs text-slate-400">Save the template to send it.</p>
            ) : !draft.active ? (
              <p className="text-xs text-slate-400">This template is retired; tick "In use" and save to send it.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex-1 text-xs text-slate-400">Send a test to
                    <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={field}
                           placeholder="you@dalaillama.in" />
                  </label>
                  <button type="button" disabled={sending || !testEmail.includes("@")} onClick={() => handleSend(true)}
                          className="rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                    Send test
                  </button>
                </div>
                {forBrands ? (
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="text-slate-400">Which brands (leave a row empty for all)</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {INDUSTRIES.map(([code, label]) => (
                        <label key={code} className="flex items-center gap-1">
                          <input type="checkbox" checked={brandFilter.industries.includes(code)} onChange={() => flip("industries", code)} /> {label}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {COMPANY_SIZES.map(([code, label]) => (
                        <label key={code} className="flex items-center gap-1">
                          <input type="checkbox" checked={brandFilter.sizes.includes(code)} onChange={() => flip("sizes", code)} /> {label}
                        </label>
                      ))}
                    </div>
                    <label className="block text-slate-400">Countries (codes, comma-separated; empty for all)
                      <input value={brandFilter.countries.join(", ")} className={field} placeholder="IN"
                             onChange={(e) => setBrandFilter((f) => ({ ...f, countries: e.target.value.split(/[ ,]+/).filter(Boolean) }))} />
                    </label>
                    <p className="text-slate-400">
                      {brandAudience ? `${plural(brandAudience.brands)} with an email${brandAudience.sample?.length ? `, e.g. ${brandAudience.sample.join(", ")}` : ""}.` : "Counting…"}
                    </p>
                  </div>
                ) : (
                  <>
                <div className="grid gap-1.5 text-xs text-slate-300 sm:grid-cols-2">
                  {AUDIENCES.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5">
                      <input type="radio" checked={audience === key} onChange={() => setAudience(key)} /> {label}
                    </label>
                  ))}
                </div>
                {audience === "CHOSEN" && (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2">
                    {creators.map((c) => (
                      <label key={c.tenantId} className="flex items-center gap-2 text-xs text-slate-300">
                        <input type="checkbox" checked={chosen.includes(c.tenantId)} onChange={() => toggle(c.tenantId)} />
                        {c.name} <span className="text-slate-500">{c.email}</span>
                        <span className="text-slate-500">· {c.liveVideos ? `${c.liveVideos} video${c.liveVideos === 1 ? "" : "s"}` : "no video"}</span>
                        {c.publicProfileUrl && (
                          <a href={c.publicProfileUrl} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline">profile</a>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {audience === "LEADS" && (
                  <p className="text-[11px] text-amber-200">
                    These people haven't signed up, so each mail carries an unsubscribe link. Leads who already have an account are left out.
                  </p>
                )}
                  </>
                )}
                <button type="button" disabled={sending || recipients === 0} onClick={() => handleSend(false)}
                        className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {sending ? "Queuing…" : `Send to ${plural(recipients)}`}
                </button>
                {sendNote && <Notice tone={sendNote.tone}>{sendNote.message}</Notice>}
              </>
            )}
          </div>
        </div>
      </div>
      {sends.length > 0 && (
        <div className="creator-panel overflow-x-auto p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Recent sends</p>
          <table className="w-full text-[11px]">
            <thead><tr><Th>When</Th><Th>Subject</Th><Th>To</Th><Th>Recipients</Th><Th>Sent</Th><Th>Waiting</Th></tr></thead>
            <tbody>
              {sends.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <Td>{new Date(s.createdAt).toLocaleString()}</Td>
                  <Td>{named(s.subject)}</Td>
                  <Td>{SEND_AUDIENCE_LABEL[s.audience] || s.audience}</Td>
                  <Td>{s.recipients}</Td>
                  <Td>{s.audience === "TEST" ? "-" : s.sent}</Td>
                  <Td>{s.audience === "TEST" ? "-" : s.queued}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {forBrands && <BrandMailHistory />}
    </div>
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
