// @ts-check
import React, { useState, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Phone,
  Cpu,
  Headphones,
  MessageSquare,
  ChevronRight,
  Clock,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  useGetMyAppsQuery,
  useRetryProvisionMutation,
  useDeleteAppMutation,
  useGetMyDidsQuery,
  useReleaseDidMutation,
  useCancelSubscriptionMutation,
} from "@dalaillama/shared-store";

/* ─── helpers ─────────────────────────────────────────────────────── */

/** @param {string} status */
const statusLabel = (status) => {
  switch (status) {
    case "COMPLETED": return "Active";
    case "RUNNING":   return "Provisioning";
    case "PENDING":   return "Pending";
    case "FAILED":    return "Failed";
    default:          return status;
  }
};

/** @param {string} status */
const statusColor = (status) => {
  switch (status) {
    case "COMPLETED": return "text-emerald-600 bg-emerald-50";
    case "RUNNING":   return "text-purple-600 bg-purple-50";
    case "PENDING":   return "text-amber-600 bg-amber-50";
    case "FAILED":    return "text-rose-600 bg-rose-50";
    default:          return "text-slate-600 bg-slate-50";
  }
};

/** @param {{ status: string }} props */
const StatusIcon = ({ status }) => {
  switch (status) {
    case "COMPLETED": return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "RUNNING":   return <Loader2 size={14} className="text-purple-500 animate-spin" />;
    case "PENDING":   return <Clock size={14} className="text-amber-500" />;
    case "FAILED":    return <XCircle size={14} className="text-rose-500" />;
    default:          return <Clock size={14} className="text-slate-400" />;
  }
};

/** @param {string|null|undefined} appType */
const appIcon = (appType) => {
  switch (appType) {
    case "CONTACT_CENTER":       return Headphones;
    case "CONV_IVR":             return MessageSquare;
    case "BASIC_PBX":            return Phone;
    case "OUTBOUND_DIALER":      return Phone;
    case "VIRTUAL_RECEPTIONIST": return MessageSquare;
    default:                     return Cpu;
  }
};

/* ─── types ────────────────────────────────────────────────────────── */

/**
 * @typedef {Object} TenantAppSummary
 * @property {string} id
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

/* ─── component ────────────────────────────────────────────────────── */

/**
 * @typedef {Object} SubscriptionSidebarProps
 * @property {(appId: string) => void} [onSelectApp] - Called when user selects an app for details.
 * @property {(appId: string) => void} [onRetryWithProgress] - Called to open provisioning step-by-step view.
 */

/** @param {SubscriptionSidebarProps} props */
export default function SubscriptionSidebar({ onSelectApp, onRetryWithProgress }) {
  const { data: apps = [], isLoading, refetch } = useGetMyAppsQuery(undefined, {
    pollingInterval: 5000,
  });
  const [retryProvision] = useRetryProvisionMutation();
  const [deleteApp] = useDeleteAppMutation();
  const { data: dids = [], refetch: refetchDids } = useGetMyDidsQuery(undefined);
  const [releaseDid] = useReleaseDidMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();

  // Immediately refetch when a provisioning WS event fires (COMPLETED / FAILED)
  useEffect(() => {
    /** @param {Event} e */
    const onProvisionEvent = (e) => {
      const detail = /** @type {any} */ (/** @type {CustomEvent} */ (e)).detail;
      const status = String(detail?.status || detail?.event || "").toUpperCase();
      if (status === "COMPLETED" || status === "FAILED") {
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

  const handleRetry = useCallback(
    /** @param {string} tenantAppId */
    async (tenantAppId) => {
      setRetryingId(tenantAppId);
      try {
        await retryProvision(tenantAppId).unwrap();
        refetch();
      } catch (err) {
        console.error("[SubscriptionSidebar] Retry failed:", err);
      } finally {
        setRetryingId(null);
      }
    },
    [retryProvision, refetch]
  );

  const handleDelete = useCallback(
    /** @param {string} tenantAppId */
    async (tenantAppId) => {
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
    },
    [deleteApp, refetch, refetchDids]
  );

  const handleReleaseDid = useCallback(
    /** @param {string} didId */
    async (didId) => {
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
    },
    [releaseDid, refetchDids]
  );

  const handleCancelSubscription = useCallback(
    /** @param {string} subscriptionId */
    async (subscriptionId) => {
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
    },
    [cancelSubscription, refetch, refetchDids]
  );

  const activeApps = /** @type {TenantAppSummary[]} */ (apps).filter(
    (a) => a.deploymentStatus === "COMPLETED"
  );
  const failedApps = /** @type {TenantAppSummary[]} */ (apps).filter(
    (a) => a.deploymentStatus === "FAILED"
  );
  const pendingApps = /** @type {TenantAppSummary[]} */ (apps).filter(
    (a) => a.deploymentStatus === "PENDING" || a.deploymentStatus === "RUNNING"
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-medium">Loading subscriptions...</span>
        </div>
      </div>
    );
  }

  if (!apps.length) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs font-medium text-slate-400">No subscriptions yet</p>
      </div>
    );
  }

  /**
   * @param {TenantAppSummary} app
   * @param {boolean} [showRetry]
   */
  const renderAppCard = (app, showRetry = false) => {
    const Icon = appIcon(app.appType);
    const isCurrentlyRetrying = retryingId === app.id;
    const isCompleted = app.deploymentStatus === "COMPLETED";
    const isFailed = app.deploymentStatus === "FAILED";
    const isPending = app.deploymentStatus === "PENDING" || app.deploymentStatus === "RUNNING";

    return (
      <div
        key={app.id}
        className="group rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:shadow-md hover:border-slate-200"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {app.displayName || app.productCode}
              </h4>
              <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(app.deploymentStatus)}`}>
                <StatusIcon status={app.deploymentStatus} />
                {statusLabel(app.deploymentStatus)}
              </div>
            </div>

            {app.didNumber && (
              <p className="mt-0.5 text-xs font-mono text-slate-400">{app.didNumber}</p>
            )}

            {app.planTier && (
              <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {app.planTier} plan
              </p>
            )}

            {/* ── Action buttons row ── */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Open button — only for completed apps with subdomain */}
              {isCompleted && app.subdomain && (
                <button
                  onClick={() => onSelectApp?.(app.id)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 uppercase tracking-wider hover:text-purple-700"
                >
                  Open <ExternalLink size={10} />
                </button>
              )}

              {/* Retry — failed or pending */}
              {showRetry && onRetryWithProgress && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRetryWithProgress(app.id); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider transition-all hover:bg-purple-700 active:scale-[0.97]"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              )}
              {showRetry && !onRetryWithProgress && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRetry(app.id); }}
                  disabled={isCurrentlyRetrying}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider transition-all hover:bg-purple-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={12} className={isCurrentlyRetrying ? "animate-spin" : ""} />
                  {isCurrentlyRetrying ? "Retrying" : "Retry"}
                </button>
              )}

              {/* Cancel subscription — all statuses if subscriptionId present */}
              {app.subscriptionId && (
                <>
                  {confirmCancelSubId === app.subscriptionId ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelSubscription(app.subscriptionId); }}
                        disabled={cancellingSubId === app.subscriptionId}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider transition-all hover:bg-amber-700 disabled:opacity-50"
                      >
                        {cancellingSubId === app.subscriptionId ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
                        {cancellingSubId === app.subscriptionId ? "Cancelling" : "Confirm Cancel"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmCancelSubId(null); }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50"
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmCancelSubId(app.subscriptionId); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider transition-all hover:bg-amber-100 active:scale-[0.97]"
                    >
                      <AlertTriangle size={12} />
                      Cancel Sub
                    </button>
                  )}
                </>
              )}

              {/* Delete app — all statuses */}
              {confirmDeleteId === app.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                    disabled={deletingId === app.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider transition-all hover:bg-rose-700 disabled:opacity-50"
                  >
                    {deletingId === app.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {deletingId === app.id ? "Deleting" : "Confirm Delete"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(app.id); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-wider transition-all hover:bg-rose-100 active:scale-[0.97]"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Active — primary apps shown first */}
      {activeApps.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Active ({activeApps.length})
          </p>
          <div className="space-y-2">
            {activeApps.map((app) => renderAppCard(app))}
          </div>
        </div>
      )}

      {/* Pending/Running */}
      {pendingApps.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-purple-400">
            Provisioning ({pendingApps.length})
          </p>
          <div className="space-y-2">
            {pendingApps.map((app) => renderAppCard(app, true))}
          </div>
        </div>
      )}

      {/* Failed — needs attention */}
      {failedApps.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-rose-400">
            Failed ({failedApps.length})
          </p>
          <div className="space-y-2">
            {failedApps.map((app) => renderAppCard(app, true))}
          </div>
        </div>
      )}

      {/* DIDs */}
      {/** @type {any[]} */ (dids).length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Phone Numbers ({/** @type {any[]} */ (dids).length})
          </p>
          <div className="space-y-2">
            {/** @type {any[]} */ (dids).map((did) => {
              const didStatus = String(did.status || "").toUpperCase();
              const isActive = didStatus === "ACTIVE";
              return (
                <div
                  key={did.id}
                  className="group rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:shadow-md hover:border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                      <Phone size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold font-mono text-slate-900 truncate">
                          {did.displayNumber || did.number}
                        </h4>
                        <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isActive ? "text-emerald-600 bg-emerald-50" : "text-slate-600 bg-slate-50"
                        }`}>
                          {didStatus}
                        </div>
                      </div>
                      {did.country && (
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                          {did.country}{did.city ? ` — ${did.city}` : ""}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {confirmReleaseDidId === did.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReleaseDid(did.id); }}
                              disabled={releasingDidId === did.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider transition-all hover:bg-rose-700 disabled:opacity-50"
                            >
                              {releasingDidId === did.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              {releasingDidId === did.id ? "Releasing" : "Confirm"}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmReleaseDidId(null); }}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmReleaseDidId(did.id); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-wider transition-all hover:bg-rose-100 active:scale-[0.97]"
                          >
                            <Trash2 size={12} />
                            Release
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
