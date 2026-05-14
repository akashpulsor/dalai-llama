// @ts-check
import React, { useState, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  Cpu,
  Headphones,
  MessageSquare,
  Clock,
  ChevronDown,
  ExternalLink,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Settings,
  User,
  Sparkles,
  Eye,
} from "lucide-react";
import {
  useGetMyAppsQuery,
  useRetryProvisionMutation,
  useDeleteAppMutation,
  useGetMyDidsQuery,
  useReleaseDidMutation,
  useCancelSubscriptionMutation,
  useLazyGetSubscriptionStatusQuery,
  useLazyGetTenantSubscriptionDetailsQuery,
  useLazyGetTenantAppQuery,
} from "@dalaillama/shared-store";

const SUCCESS_EVENT_STATUSES = new Set(["ACTIVE", "COMPLETED", "READY", "SUCCESS"]);
const FAILURE_EVENT_STATUSES = new Set(["ERROR", "FAILED", "PARTIAL_FAILURE"]);

/** @param {any} value */
const isPresent = (value) => value !== null && value !== undefined && String(value).trim() !== "";

/** @param {string} status */
const statusLabel = (status) => {
  switch (status) {
    case "COMPLETED": return "Active";
    case "RUNNING": return "Provisioning";
    case "PENDING": return "Pending";
    case "FAILED": return "Failed";
    default: return status;
  }
};

/** @param {string} status */
const statusTone = (status) => {
  switch (status) {
    case "COMPLETED":
      return {
        pill: "bg-emerald-50 text-emerald-600",
        glow: "shadow-emerald-100/70",
        accent: "from-emerald-500 via-teal-400 to-sky-400",
        icon: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
      };
    case "RUNNING":
    case "PENDING":
      return {
        pill: "bg-purple-50 text-purple-600",
        glow: "shadow-purple-100/70",
        accent: "from-purple-600 via-fuchsia-500 to-sky-400",
        icon: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
      };
    case "FAILED":
      return {
        pill: "bg-rose-50 text-rose-600",
        glow: "shadow-rose-100/70",
        accent: "from-rose-500 via-orange-400 to-amber-300",
        icon: "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white",
      };
    default:
      return {
        pill: "bg-slate-100 text-slate-600",
        glow: "shadow-slate-100/70",
        accent: "from-slate-700 via-slate-500 to-slate-300",
        icon: "bg-slate-50 text-slate-600 group-hover:bg-slate-700 group-hover:text-white",
      };
  }
};

/** @param {{ status: string }} props */
const StatusIcon = ({ status }) => {
  switch (status) {
    case "COMPLETED": return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "RUNNING": return <Loader2 size={14} className="animate-spin text-purple-500" />;
    case "PENDING": return <Clock size={14} className="text-amber-500" />;
    case "FAILED": return <XCircle size={14} className="text-rose-500" />;
    default: return <Clock size={14} className="text-slate-400" />;
  }
};

/** @param {string|null|undefined} appType */
const appIcon = (appType) => {
  switch (appType) {
    case "CONTACT_CENTER": return Headphones;
    case "CONV_IVR": return MessageSquare;
    case "BASIC_PBX": return Phone;
    case "OUTBOUND_DIALER": return Phone;
    case "VIRTUAL_RECEPTIONIST": return MessageSquare;
    default: return Cpu;
  }
};

/** @param {string | null | undefined} appType */
const panelIcon = (appType) => {
  switch (appType) {
    case "CONTACT_CENTER": return Headphones;
    case "SUPERVISOR": return Eye;
    case "ADMIN_PANEL": return Settings;
    case "AGENT":
    case "AGENT_PANEL": return Phone;
    default: return LayoutDashboard;
  }
};

/** @param {string | null | undefined} value */
const toUrl = (value) => {
  if (!isPresent(value)) return null;
  const normalized = String(value).trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized.replace(/^\/+/, "")}`;
};

/** @param {string | null | undefined} value */
const formatDate = (value) => {
  if (!isPresent(value)) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

/**
 * @param {any} source
 * @param {string[][]} paths
 * @returns {any}
 */
const pickValue = (source, paths) => {
  for (const path of paths) {
    let current = source;
    let missing = false;
    for (const key of path) {
      if (!current || typeof current !== "object" || !(key in current)) {
        missing = true;
        break;
      }
      current = current[key];
    }
    if (!missing && isPresent(current)) return current;
  }
  return null;
};

/** @param {any} app */
const extractDetails = (app) => {
  const domain = pickValue(app, [["domain"]]);
  const subdomain = pickValue(app, [["subdomain"]]);
  const host = isPresent(subdomain)
    ? String(subdomain).includes(".")
      ? String(subdomain)
      : isPresent(domain)
        ? `${subdomain}.${domain}`
        : String(subdomain)
    : domain;

  return {
    portalUrl: toUrl(
      pickValue(app, [
        ["adminUrl"],
        ["admin_url"],
        ["appUrl"],
        ["app_url"],
        ["dashboardUrl"],
        ["dashboard_url"],
        ["workspaceUrl"],
        ["workspace_url"],
        ["loginUrl"],
        ["login_url"],
        ["url"],
        ["domain"],
      ]) || host
    ),
    adminUsername: pickValue(app, [
      ["adminUsername"],
      ["admin_username"],
      ["username"],
      ["adminUser", "username"],
      ["admin_user", "username"],
      ["adminCredentials", "username"],
      ["admin_credentials", "username"],
      ["credentials", "username"],
      ["config", "admin_username"],
    ]),
    adminPassword: pickValue(app, [
      ["adminPassword"],
      ["admin_password"],
      ["password"],
      ["adminUser", "password"],
      ["admin_user", "password"],
      ["adminCredentials", "password"],
      ["admin_credentials", "password"],
      ["credentials", "password"],
      ["config", "admin_password"],
    ]),
    keycloakRealm: pickValue(app, [
      ["keycloakRealm"],
      ["keycloak_realm"],
      ["realm"],
    ]),
    deployedAt: pickValue(app, [["deployedAt"], ["deployed_at"]]),
  };
};

/** @param {any} source */
const extractAppPanels = (source) => {
  const panels = Array.isArray(source?.appPanels)
    ? source.appPanels
    : Array.isArray(source?.app_panels)
      ? source.app_panels
      : [];

  return panels
    .filter((panel) => panel && isPresent(panel.url))
    .slice()
    .sort((a, b) => Number(a.displayOrder ?? a.display_order ?? 0) - Number(b.displayOrder ?? b.display_order ?? 0));
};

/** @param {unknown} value */
const formatJson = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

function HoverDetailRow({ icon: Icon, label, value, href }) {
  if (!isPresent(value)) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        <Icon size={12} />
        {label}
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 break-all text-xs font-semibold text-white hover:text-purple-200"
        >
          {String(value)}
          <ExternalLink size={12} />
        </a>
      ) : (
        <p className="break-all text-xs font-semibold text-white">{String(value)}</p>
      )}
    </div>
  );
}

/**
 * @param {{
 *   panels: any[];
 *   workspaceUrl?: string | null;
 * }} props
 */
function LaunchLinks({ panels, workspaceUrl }) {
  const hasWorkspace = isPresent(workspaceUrl);
  if (!panels.length && !hasWorkspace) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Launch</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-slate-300">
          {panels.length + (hasWorkspace ? 1 : 0)}
        </span>
      </div>
      <div className="grid gap-2">
        {hasWorkspace && (
          <a
            href={workspaceUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="group/link flex min-w-0 items-center gap-3 rounded-xl border border-purple-300/25 bg-purple-500/15 px-3 py-3 text-white transition-all hover:border-purple-200/60 hover:bg-purple-500/25"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-400/20 text-purple-100">
              <Globe size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">Workspace URL</span>
              <span className="mt-0.5 block truncate text-[11px] font-medium text-purple-100/80">
                {workspaceUrl}
              </span>
            </span>
            <ExternalLink size={13} className="shrink-0 text-purple-100" />
          </a>
        )}
        {panels.map((panel, index) => {
          const Icon = panelIcon(panel.appType || panel.app_type);
          const label = panel.displayName || panel.display_name || panel.appType || "Open Panel";
          const url = toUrl(panel.url);

          return (
            <a
              key={`${url}-${index}`}
              href={url || "#"}
              target="_blank"
              rel="noreferrer"
              className="group/link flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white transition-all hover:border-purple-300/40 hover:bg-purple-500/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-purple-100">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">{String(label)}</span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400 group-hover/link:text-purple-100">
                  {url}
                </span>
              </span>
              <ExternalLink size={13} className="shrink-0 text-slate-500 group-hover/link:text-purple-100" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   username: unknown;
 *   password: unknown;
 * }} props
 */
function AdminAccess({ username, password }) {
  const hasUsername = isPresent(username);
  const hasPassword = isPresent(password);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Admin Access</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
          hasUsername || hasPassword ? "bg-emerald-400/10 text-emerald-200" : "bg-white/10 text-slate-300"
        }`}>
          {hasUsername || hasPassword ? "Ready" : "Pending"}
        </span>
      </div>
      <div className="grid gap-2">
        <HoverDetailRow icon={User} label="Username" value={hasUsername ? username : "Not returned yet"} />
        <HoverDetailRow icon={Lock} label="Password" value={hasPassword ? password : "Not returned yet"} />
      </div>
    </div>
  );
}

function EmptySubscriptionsState() {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
        <Sparkles size={22} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">No subscriptions yet</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        Activate a product from the marketplace and it will appear here with live provisioning updates.
      </p>
    </div>
  );
}

function SectionShell({ title, count, tint, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${tint}`}>{title}</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm">{count}</span>
      </div>
      {children}
    </section>
  );
}

function ListHeader() {
  return (
    <div className="hidden rounded-[1.4rem] border border-slate-100 bg-slate-50/90 px-5 py-3 lg:grid lg:grid-cols-[minmax(0,2.2fr)_1fr_1.1fr_1fr_auto] lg:items-center lg:gap-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Subscription</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Status</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Phone Number</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Created</p>
      <p className="text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Actions</p>
    </div>
  );
}

/**
 * @typedef {Object} TenantAppSummary
 * @property {string} id
 * @property {string} tenantId
 * @property {string} appType
 * @property {string} displayName
 * @property {string} subdomain
 * @property {string} productCode
 * @property {string} planCode
 * @property {string} planTier
 * @property {string} didNumber
 * @property {string} deploymentStatus
 * @property {string} subscriptionId
 * @property {string} createdAt
 * @property {string} deployedAt
 */

/**
 * @typedef {Object} SubscriptionSidebarProps
 * @property {(appId: string) => void} [onRetryWithProgress]
 */

/** @param {SubscriptionSidebarProps} props */
export default function SubscriptionSidebar({ onRetryWithProgress }) {
  const { data: apps = [], isLoading, refetch } = useGetMyAppsQuery(undefined, {
    pollingInterval: 5000,
  });
  const [retryProvision] = useRetryProvisionMutation();
  const [deleteApp] = useDeleteAppMutation();
  const { data: dids = [], refetch: refetchDids } = useGetMyDidsQuery(undefined);
  const [releaseDid] = useReleaseDidMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();
  const [fetchSubscriptionStatus] = useLazyGetSubscriptionStatusQuery();
  const [fetchTenantSubscriptionDetails] = useLazyGetTenantSubscriptionDetailsQuery();
  const [fetchTenantApp] = useLazyGetTenantAppQuery();

  useEffect(() => {
    /** @param {Event} e */
    const onProvisionEvent = (e) => {
      const detail = /** @type {any} */ (/** @type {CustomEvent} */ (e)).detail;
      const status = String(detail?.status || detail?.event || "").toUpperCase();
      if (SUCCESS_EVENT_STATUSES.has(status) || FAILURE_EVENT_STATUSES.has(status)) {
        refetch();
        refetchDids();
      }
    };
    window.addEventListener("tenant-provisioning-event", onProvisionEvent);
    window.addEventListener("tenant-app-event", onProvisionEvent);
    return () => {
      window.removeEventListener("tenant-provisioning-event", onProvisionEvent);
      window.removeEventListener("tenant-app-event", onProvisionEvent);
    };
  }, [refetch, refetchDids]);

  const [retryingId, setRetryingId] = useState(/** @type {string|null} */ (null));
  const [deletingId, setDeletingId] = useState(/** @type {string|null} */ (null));
  const [confirmDeleteId, setConfirmDeleteId] = useState(/** @type {string|null} */ (null));
  const [cancellingSubId, setCancellingSubId] = useState(/** @type {string|null} */ (null));
  const [confirmCancelSubId, setConfirmCancelSubId] = useState(/** @type {string|null} */ (null));
  const [releasingDidId, setReleasingDidId] = useState(/** @type {string|null} */ (null));
  const [confirmReleaseDidId, setConfirmReleaseDidId] = useState(/** @type {string|null} */ (null));
  const [detailsByAppId, setDetailsByAppId] = useState(/** @type {Record<string, any>} */ ({}));
  const [loadingDetailsByAppId, setLoadingDetailsByAppId] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [expandedSummaryByAppId, setExpandedSummaryByAppId] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [expandedRawByAppId, setExpandedRawByAppId] = useState(/** @type {Record<string, boolean>} */ ({}));

  useEffect(() => {
    if (!isLoading) {
      console.log("[SubscriptionSidebar] GET /tenants/me/apps response:", apps);
    }
  }, [apps, isLoading]);

  const loadActiveSubscriptionDetails = useCallback(async (app) => {
    if (!app?.id || app.deploymentStatus !== "COMPLETED" || !app.subscriptionId || detailsByAppId[app.id] || loadingDetailsByAppId[app.id]) {
      return;
    }

    setLoadingDetailsByAppId((current) => ({ ...current, [app.id]: true }));

    try {
      const tenantId = pickValue(app, [
        ["tenantId"],
        ["tenant_id"],
        ["tenant", "id"],
      ]);
      const subscriptionDetailsUrl = tenantId
        ? `/tenants/${tenantId}/subscriptions/${app.subscriptionId}`
        : `/subscriptions/${app.subscriptionId}`;

      console.log("[SubscriptionSidebar] Loading subscription details:", {
        tenantAppId: app.id,
        tenantId,
        subscriptionId: app.subscriptionId,
        url: subscriptionDetailsUrl,
      });

      const subscription = tenantId
        ? await fetchTenantSubscriptionDetails({ tenantId, subscriptionId: app.subscriptionId }, true).unwrap()
        : await fetchSubscriptionStatus(app.subscriptionId, true).unwrap();

      console.log("[SubscriptionSidebar] Subscription detail response:", {
        tenantAppId: app.id,
        url: subscriptionDetailsUrl,
        response: subscription,
      });

      const subscriptionStatus = String(
        subscription?.status ||
        subscription?.subscriptionStatus ||
        subscription?.state ||
        ""
      ).toUpperCase();

      if (subscriptionStatus && !SUCCESS_EVENT_STATUSES.has(subscriptionStatus)) {
        setDetailsByAppId((current) => ({
          ...current,
          [app.id]: { subscription },
        }));
        return;
      }

      const tenantAppId = pickValue(subscription, [
        ["tenantAppId"],
        ["tenant_app_id"],
        ["tenantApp", "id"],
        ["app", "id"],
      ]);

      if (tenantAppId) {
        const tenantApp = await fetchTenantApp(tenantAppId, true).unwrap();
        setDetailsByAppId((current) => ({
          ...current,
          [app.id]: { subscription, tenantApp },
        }));
        return;
      }

      setDetailsByAppId((current) => ({
        ...current,
        [app.id]: { subscription },
      }));
    } catch (error) {
      console.error("[SubscriptionSidebar] Failed to load subscription details:", error);
      setDetailsByAppId((current) => ({
        ...current,
        [app.id]: { error: true },
      }));
    } finally {
      setLoadingDetailsByAppId((current) => {
        const next = { ...current };
        delete next[app.id];
        return next;
      });
    }
  }, [detailsByAppId, fetchSubscriptionStatus, fetchTenantApp, fetchTenantSubscriptionDetails, loadingDetailsByAppId]);

  const handleRetry = useCallback(async (tenantAppId) => {
    setRetryingId(tenantAppId);
    try {
      await retryProvision(tenantAppId).unwrap();
      refetch();
    } catch (err) {
      console.error("[SubscriptionSidebar] Retry failed:", err);
    } finally {
      setRetryingId(null);
    }
  }, [retryProvision, refetch]);

  const handleDelete = useCallback(async (tenantAppId) => {
    setDeletingId(tenantAppId);
    try {
      await deleteApp(tenantAppId).unwrap();
      setConfirmDeleteId(null);
      refetch();
      refetchDids();
    } catch (err) {
      console.error("[SubscriptionSidebar] Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  }, [deleteApp, refetch, refetchDids]);

  const handleReleaseDid = useCallback(async (didId) => {
    setReleasingDidId(didId);
    try {
      await releaseDid(didId).unwrap();
      setConfirmReleaseDidId(null);
      refetchDids();
    } catch (err) {
      console.error("[SubscriptionSidebar] Release DID failed:", err);
    } finally {
      setReleasingDidId(null);
    }
  }, [releaseDid, refetchDids]);

  const handleCancelSubscription = useCallback(async (subscriptionId) => {
    setCancellingSubId(subscriptionId);
    try {
      await cancelSubscription(subscriptionId).unwrap();
      setConfirmCancelSubId(null);
      refetch();
      refetchDids();
    } catch (err) {
      console.error("[SubscriptionSidebar] Cancel subscription failed:", err);
    } finally {
      setCancellingSubId(null);
    }
  }, [cancelSubscription, refetch, refetchDids]);

  const activeApps = /** @type {TenantAppSummary[]} */ (apps).filter((a) => a.deploymentStatus === "COMPLETED");
  const failedApps = /** @type {TenantAppSummary[]} */ (apps).filter((a) => a.deploymentStatus === "FAILED");
  const pendingApps = /** @type {TenantAppSummary[]} */ (apps).filter((a) => a.deploymentStatus === "PENDING" || a.deploymentStatus === "RUNNING");
  const didList = /** @type {any[]} */ (dids);

  useEffect(() => {
    activeApps.forEach((app) => {
      void loadActiveSubscriptionDetails(app);
    });
  }, [activeApps, loadActiveSubscriptionDetails]);

  /** @param {TenantAppSummary} app */
  const findDidForApp = (app) => {
    const directNumber = app.didNumber;
    const directMatch = didList.find((did) => {
      const didNumber = did.displayNumber || did.number || did.didNumber || did.did;
      return directNumber && didNumber === directNumber;
    });
    if (directMatch) return directMatch;

    const relatedMatch = didList.find((did) => {
      const didTenantAppId = did.tenantAppId || did.tenant_app_id || did.appId || did.app_id;
      const didSubscriptionId = did.subscriptionId || did.subscription_id;
      return (didTenantAppId && didTenantAppId === app.id) || (didSubscriptionId && didSubscriptionId === app.subscriptionId);
    });
    if (relatedMatch) return relatedMatch;

    if (activeApps.length === 1 && didList.length === 1) return didList[0];
    return null;
  };

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-semibold">Loading subscriptions...</span>
        </div>
      </div>
    );
  }

  if (!apps.length) {
    return <EmptySubscriptionsState />;
  }

  /**
   * @param {TenantAppSummary} app
   * @param {boolean} [showRetry]
   */
  const renderAppCard = (app, showRetry = false) => {
    const Icon = appIcon(app.appType);
    const tone = statusTone(app.deploymentStatus);
    const isCurrentlyRetrying = retryingId === app.id;
    const isCompleted = app.deploymentStatus === "COMPLETED";
    const loadedDetails = detailsByAppId[app.id] || null;
    const liveDetails = loadedDetails
      ? { ...(loadedDetails.subscription || {}), ...(loadedDetails.tenantApp || {}) }
      : null;
    const details = extractDetails(liveDetails || app);
    const appPanels = extractAppPanels(liveDetails || {});
    const primaryPanelUrl = toUrl(appPanels[0]?.url) || details.portalUrl;
    const assignedDid = findDidForApp(app);
    const phoneNumber = app.didNumber || assignedDid?.displayNumber || assignedDid?.number || assignedDid?.didNumber || assignedDid?.did;
    const isLoadingDetails = Boolean(loadingDetailsByAppId[app.id]);
    const isSummaryExpanded = expandedSummaryByAppId[app.id] !== false;
    const isRawExpanded = Boolean(expandedRawByAppId[app.id]);
    const subscriptionStatus = String(
      detailsByAppId[app.id]?.subscription?.status ||
      detailsByAppId[app.id]?.subscription?.subscriptionStatus ||
      ""
    ).toUpperCase();
    const canShowFetchedDetails = !subscriptionStatus || SUCCESS_EVENT_STATUSES.has(subscriptionStatus);

    return (
      <div
        key={app.id}
        onMouseEnter={() => { void loadActiveSubscriptionDetails(app); }}
        onFocus={() => { void loadActiveSubscriptionDetails(app); }}
        className={`group relative rounded-[1.6rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:z-20 hover:border-purple-200 hover:shadow-xl focus-within:z-20 focus-within:border-purple-200 focus-within:shadow-xl ${tone.glow}`}
      >
        <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.accent}`} />

        <div className="relative px-5 py-4">
          <div className="flex min-h-[4.75rem] flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2.2fr)_1fr_1.1fr_1fr_auto] lg:items-center lg:gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all ${tone.icon}`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {app.appType?.replace(/_/g, " ") || "Subscription"}
                  </p>
                  <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] lg:hidden ${tone.pill}`}>
                    <StatusIcon status={app.deploymentStatus} />
                    {statusLabel(app.deploymentStatus)}
                  </div>
                </div>
                <h3 className="mt-2 truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-purple-600 lg:text-xl">
                  {app.displayName || app.productCode}
                </h3>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.pill}`}>
                <StatusIcon status={app.deploymentStatus} />
                {statusLabel(app.deploymentStatus)}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 lg:hidden">
                Phone Number
              </p>
              <p className={`truncate text-sm font-bold ${phoneNumber ? "font-mono text-slate-900" : "text-slate-400"}`}>
                {phoneNumber || (isCompleted ? "Not assigned" : "In progress")}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 lg:hidden">Created</p>
              <p className="text-sm font-bold text-slate-900">{formatDate(app.createdAt) || "Recently"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {primaryPanelUrl && isCompleted && (
                <a
                  href={primaryPanelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all hover:bg-purple-600 hover:text-white"
                  aria-label="Open subscription"
                >
                  <ExternalLink size={18} />
                </a>
              )}

              <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:inline-flex">
                Details
              </div>
            </div>
          </div>

          <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 lg:inset-x-auto lg:bottom-auto lg:right-8 lg:top-28 lg:w-[42rem]">
            <div className="max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto rounded-[1.6rem] bg-slate-950 px-4 py-4 text-white shadow-2xl ring-1 ring-white/10 custom-scrollbar">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_auto]">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Subscription Details</p>
                    <h4 className="mt-1 text-lg font-bold">{app.displayName || app.productCode}</h4>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.pill}`}>
                    {statusLabel(app.deploymentStatus)}
                  </div>
                </div>

                {isLoadingDetails ? (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-semibold text-slate-300">
                    <Loader2 size={14} className="animate-spin" />
                    Loading active subscription details...
                  </div>
                ) : (
                  <>
                    {canShowFetchedDetails && (
                      <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(13rem,0.75fr)]">
                        <LaunchLinks panels={appPanels} workspaceUrl={details.portalUrl} />
                        {isCompleted && (
                          <AdminAccess username={details.adminUsername} password={details.adminPassword} />
                        )}
                      </div>
                    )}
                    {isCompleted && canShowFetchedDetails && !appPanels.length && loadedDetails?.subscription && !loadedDetails?.error && (
                      <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-semibold text-slate-300">
                        No app panel links were returned for this subscription yet.
                      </div>
                    )}
                    {detailsByAppId[app.id]?.error && (
                      <div className="mb-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-xs font-semibold text-rose-100">
                        We couldn&apos;t load the latest subscription details right now. Showing the current subscription summary.
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedSummaryByAppId((current) => ({
                      ...current,
                      [app.id]: !isSummaryExpanded,
                    }));
                  }}
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-300 transition-all hover:bg-white/10"
                >
                  Summary
                  <ChevronDown size={14} className={`transition-transform ${isSummaryExpanded ? "rotate-180" : ""}`} />
                </button>

                {isSummaryExpanded && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {isLoadingDetails ? (
                    <div className="col-span-full flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-semibold text-slate-300">
                      <Loader2 size={14} className="animate-spin" />
                      Loading active subscription details...
                    </div>
                  ) : (
                    <>
                      <HoverDetailRow icon={Phone} label="Phone Number" value={phoneNumber} />
                      <HoverDetailRow icon={KeyRound} label="Keycloak Realm" value={canShowFetchedDetails ? details.keycloakRealm : null} />
                      <HoverDetailRow icon={ShieldCheck} label="Provisioned At" value={canShowFetchedDetails ? formatDate(details.deployedAt) : null} />
                      {!canShowFetchedDetails && (
                        <div className="col-span-full rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-xs font-semibold text-amber-100">
                          Subscription details are available only after the subscription becomes `ACTIVE`.
                        </div>
                      )}
                    </>
                  )}
                  </div>
                )}

                {loadedDetails?.subscription && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRawByAppId((current) => ({
                          ...current,
                          [app.id]: !isRawExpanded,
                        }));
                      }}
                      className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-transparent px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition-all hover:bg-white/5 hover:text-slate-200"
                    >
                      View Full API JSON
                      <ChevronDown size={14} className={`transition-transform ${isRawExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isRawExpanded && (
                      <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-slate-900/80 p-3 font-mono text-[10px] leading-5 text-slate-300 custom-scrollbar">
                        {formatJson(loadedDetails.subscription)}
                      </pre>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-start gap-2 lg:flex-col lg:justify-start">
                {showRetry && onRetryWithProgress && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRetryWithProgress(app.id); }}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-purple-500"
                  >
                    Retry With Progress
                  </button>
                )}
                {showRetry && !onRetryWithProgress && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(app.id); }}
                    disabled={isCurrentlyRetrying}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-purple-500 disabled:opacity-50"
                  >
                    {isCurrentlyRetrying ? "Retrying..." : "Retry"}
                  </button>
                )}
                {assignedDid?.id && (
                  confirmReleaseDidId === assignedDid.id ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReleaseDid(assignedDid.id); }}
                        disabled={releasingDidId === assignedDid.id}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                      >
                        {releasingDidId === assignedDid.id ? "Releasing..." : "Confirm Release"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmReleaseDidId(null); }}
                        className="rounded-xl border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300"
                      >
                        Back
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmReleaseDidId(assignedDid.id); }}
                      className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-rose-200"
                    >
                      Release Number
                    </button>
                  )
                )}
                {app.subscriptionId && (
                  confirmCancelSubId === app.subscriptionId ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelSubscription(app.subscriptionId); }}
                        disabled={cancellingSubId === app.subscriptionId}
                        className="rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                      >
                        {cancellingSubId === app.subscriptionId ? "Cancelling..." : "Confirm Cancel"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmCancelSubId(null); }}
                        className="rounded-xl border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300"
                      >
                        Back
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmCancelSubId(app.subscriptionId); }}
                      className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200"
                    >
                      Cancel Subscription
                    </button>
                  )
                )}
                {confirmDeleteId === app.id ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                      disabled={deletingId === app.id}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                    >
                      {deletingId === app.id ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="rounded-xl border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300"
                    >
                      Back
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(app.id); }}
                    className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-rose-200"
                  >
                    Delete
                  </button>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {activeApps.length > 0 && (
        <SectionShell title="Active Subscriptions" count={activeApps.length} tint="text-emerald-500">
          <ListHeader />
          <div className="space-y-4">
            {activeApps.map((app) => renderAppCard(app))}
          </div>
        </SectionShell>
      )}

      {pendingApps.length > 0 && (
        <SectionShell title="Provisioning" count={pendingApps.length} tint="text-purple-500">
          <ListHeader />
          <div className="space-y-4">
            {pendingApps.map((app) => renderAppCard(app, true))}
          </div>
        </SectionShell>
      )}

      {failedApps.length > 0 && (
        <SectionShell title="Needs Attention" count={failedApps.length} tint="text-rose-500">
          <ListHeader />
          <div className="space-y-4">
            {failedApps.map((app) => renderAppCard(app, true))}
          </div>
        </SectionShell>
      )}

    </div>
  );
}
