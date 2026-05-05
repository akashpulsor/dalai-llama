// @ts-check
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  ShieldCheck,
  Phone,
  Cpu,
  Globe,
  Server,
  HeartPulse,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useRetryProvisionMutation, useLazyGetProvisionStatusQuery } from "@dalaillama/shared-store";

/* ─── provisioning step metadata ──────────────────────────────────── */

/**
 * @typedef {'pending'|'running'|'completed'|'failed'} StepStatus
 */

/**
 * @typedef {Object} ProvisioningStepMeta
 * @property {string} key
 * @property {string} label
 * @property {string} group
 * @property {import('lucide-react').LucideIcon} icon
 */

/** @type {ProvisioningStepMeta[]} */
const PROVISIONING_STEPS = [
  { key: "FETCH_ENTITLEMENTS",      label: "Loading plan entitlements",       group: "Identity",     icon: ShieldCheck },
  { key: "RESOLVE_NAMESPACE",       label: "Resolving namespace",            group: "Identity",     icon: Globe },
  { key: "CREATE_KEYCLOAK_CLIENT",  label: "Creating auth client",           group: "Identity",     icon: ShieldCheck },
  { key: "CREATE_ADMIN_USER",       label: "Creating admin user",            group: "Identity",     icon: ShieldCheck },
  { key: "CONFIGURE_KAMAILIO",      label: "Configuring SIP proxy",          group: "Telecom",      icon: Phone },
  { key: "CONFIGURE_FREESWITCH",    label: "Setting up call engine",         group: "Telecom",      icon: Phone },
  { key: "CONFIGURE_COTURN",        label: "Configuring TURN server",        group: "Telecom",      icon: Phone },
  { key: "CONFIGURE_RTPENGINE",     label: "Configuring media relay",        group: "Telecom",      icon: Phone },
  { key: "CONFIGURE_AI_SERVICE",    label: "Configuring AI pipeline",        group: "AI",           icon: Sparkles },
  { key: "STAMP_INFRA_URLS",        label: "Stamping infrastructure URLs",   group: "Infra",        icon: Server },
  { key: "CONFIGURE_ISTIO_ROUTES",  label: "Creating routing rules",         group: "Infra",        icon: Globe },
  { key: "CONFIGURE_MINIO_BUCKETS", label: "Setting up storage buckets",     group: "Infra",        icon: Server },
  { key: "SYNC_PBX_CORE",           label: "Syncing PBX configuration",      group: "Finalize",     icon: Cpu },
  { key: "HEALTH_CHECK",            label: "Running health checks",          group: "Finalize",     icon: HeartPulse },
  { key: "FINALIZE",                label: "Activating tenant",              group: "Finalize",     icon: CheckCircle2 },
];

/**
 * Map a backend message to a step key by matching description keywords.
 * @param {string} message
 * @returns {string|null}
 */
const resolveStepKey = (message) => {
  if (!message) return null;
  const lower = message.toLowerCase();
  for (const step of PROVISIONING_STEPS) {
    if (lower.includes(step.key.toLowerCase().replace(/_/g, " "))) return step.key;
    if (lower.includes(step.label.toLowerCase())) return step.key;
  }
  // Fallback: partial keyword matches
  if (lower.includes("entitlement")) return "FETCH_ENTITLEMENTS";
  if (lower.includes("namespace")) return "RESOLVE_NAMESPACE";
  if (lower.includes("keycloak") && lower.includes("client")) return "CREATE_KEYCLOAK_CLIENT";
  if (lower.includes("admin user")) return "CREATE_ADMIN_USER";
  if (lower.includes("kamailio")) return "CONFIGURE_KAMAILIO";
  if (lower.includes("freeswitch") || lower.includes("dialplan")) return "CONFIGURE_FREESWITCH";
  if (lower.includes("coturn") || lower.includes("turn")) return "CONFIGURE_COTURN";
  if (lower.includes("rtpengine") || lower.includes("rtp")) return "CONFIGURE_RTPENGINE";
  if (lower.includes("ai") && (lower.includes("service") || lower.includes("pipeline"))) return "CONFIGURE_AI_SERVICE";
  if (lower.includes("infra url") || lower.includes("stamp")) return "STAMP_INFRA_URLS";
  if (lower.includes("istio") || lower.includes("virtual")) return "CONFIGURE_ISTIO_ROUTES";
  if (lower.includes("minio") || lower.includes("bucket")) return "CONFIGURE_MINIO_BUCKETS";
  if (lower.includes("pbx") && lower.includes("sync")) return "SYNC_PBX_CORE";
  if (lower.includes("health")) return "HEALTH_CHECK";
  if (lower.includes("finalize") || lower.includes("mark") && lower.includes("active")) return "FINALIZE";
  return null;
};

/* ─── step status icon ────────────────────────────────────────────── */

/** @param {{ status: StepStatus }} props */
const StepIcon = ({ status }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={16} className="text-emerald-500" />;
    case "running":
      return <Loader2 size={16} className="text-purple-500 animate-spin" />;
    case "failed":
      return <XCircle size={16} className="text-rose-500" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-slate-200" />;
  }
};

/* ─── main component ──────────────────────────────────────────────── */

/**
 * @typedef {Object} ProvisioningWaitScreenProps
 * @property {() => void} onComplete - Called when provisioning finishes successfully.
 * @property {() => void} [onFailed]  - Called when provisioning fails.
 * @property {string} [productName]   - Display name for the product being provisioned.
 * @property {string} [tenantAppId]   - TenantApp UUID, required for retry.
 * @property {boolean} [autoStart]    - Automatically trigger provisioning on mount.
 */

/** @param {ProvisioningWaitScreenProps} props */
export default function ProvisioningWaitScreen({ onComplete, onFailed, productName, tenantAppId, autoStart }) {
  const [retryProvision, { isLoading: isRetrying }] = useRetryProvisionMutation();
  const [fetchStatus] = useLazyGetProvisionStatusQuery();
  /** @type {[Record<string, StepStatus>, React.Dispatch<React.SetStateAction<Record<string, StepStatus>>>]} */
  const [stepStatuses, setStepStatuses] = useState(() => {
    /** @type {Record<string, StepStatus>} */
    const initial = {};
    PROVISIONING_STEPS.forEach((s) => { initial[s.key] = "pending"; });
    return initial;
  });
  const [overallStatus, setOverallStatus] = useState(/** @type {'running'|'completed'|'failed'} */ ("running"));
  const [failMessage, setFailMessage] = useState(/** @type {string|null} */ (null));
  const completedRef = useRef(false);
  const autoStartedRef = useRef(false);

  // Auto-start provisioning when opened from Settings with tenantAppId
  useEffect(() => {
    if (autoStart && tenantAppId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      retryProvision(tenantAppId).unwrap().catch((err) => {
        console.error("[ProvisioningWaitScreen] Auto-start failed:", err);
        setOverallStatus("failed");
        setFailMessage(err?.data?.message || "Failed to start provisioning.");
      });
    }
  }, [autoStart, tenantAppId, retryProvision]);

  const handleProvisioningEvent = useCallback(
    /** @param {Event} nativeEvent */
    (nativeEvent) => {
      const detail = /** @type {any} */ (/** @type {CustomEvent} */ (nativeEvent)).detail;
      if (!detail) return;

      const status = String(detail.status || detail.event || "").toUpperCase();
      const message = detail.message || detail.data?.message || "";

      if (status === "STARTED") {
        // Mark first step as running
        setStepStatuses((prev) => ({ ...prev, [PROVISIONING_STEPS[0].key]: "running" }));
        return;
      }

      if (status === "STEP_RUNNING") {
        const stepKey = resolveStepKey(message);
        if (stepKey) {
          setStepStatuses((prev) => ({ ...prev, [stepKey]: "running" }));
        }
        return;
      }

      if (status === "STEP_COMPLETED") {
        const stepKey = resolveStepKey(message);
        if (stepKey) {
          setStepStatuses((prev) => {
            const next = { ...prev, [stepKey]: /** @type {StepStatus} */ ("completed") };
            // Auto-advance: mark next step as running
            const idx = PROVISIONING_STEPS.findIndex((s) => s.key === stepKey);
            if (idx >= 0 && idx < PROVISIONING_STEPS.length - 1) {
              const nextStep = PROVISIONING_STEPS[idx + 1];
              if (next[nextStep.key] === "pending") {
                next[nextStep.key] = "running";
              }
            }
            return next;
          });
        }
        return;
      }

      if (status === "COMPLETED") {
        if (completedRef.current) return;
        completedRef.current = true;
        // Mark all remaining as completed
        setStepStatuses((prev) => {
          /** @type {Record<string, StepStatus>} */
          const next = {};
          for (const key of Object.keys(prev)) {
            next[key] = "completed";
          }
          return next;
        });
        setOverallStatus("completed");
        // Delay before calling onComplete for a brief success animation
        setTimeout(() => onComplete(), 2000);
        return;
      }

      if (status === "FAILED") {
        setOverallStatus("failed");
        setFailMessage(message || "Provisioning failed. Please contact support.");
        const stepKey = resolveStepKey(message);
        if (stepKey) {
          setStepStatuses((prev) => ({ ...prev, [stepKey]: /** @type {StepStatus} */ ("failed") }));
        }
        onFailed?.();
        return;
      }
    },
    [onComplete, onFailed]
  );

  // Listen for provisioning + app WebSocket browser events
  useEffect(() => {
    window.addEventListener("tenant-provisioning-event", handleProvisioningEvent);
    window.addEventListener("tenant-app-event", handleProvisioningEvent);
    return () => {
      window.removeEventListener("tenant-provisioning-event", handleProvisioningEvent);
      window.removeEventListener("tenant-app-event", handleProvisioningEvent);
    };
  }, [handleProvisioningEvent]);

  // Polling fallback — check provisioning status every 5s in case WS events are missed
  useEffect(() => {
    if (!tenantAppId || overallStatus !== "running") return;
    const interval = setInterval(async () => {
      try {
        const result = await fetchStatus(tenantAppId).unwrap();
        if (!result) return;
        const taskStatus = String(result.status || "").toUpperCase();
        const currentStep = result.currentStep;

        if (taskStatus === "COMPLETED") {
          handleProvisioningEvent(new CustomEvent("poll", { detail: { status: "COMPLETED" } }));
        } else if (taskStatus === "FAILED") {
          handleProvisioningEvent(new CustomEvent("poll", {
            detail: { status: "FAILED", message: result.lastError || "Provisioning failed" }
          }));
        } else if (currentStep) {
          // Update current step status from poll
          const stepKey = resolveStepKey(currentStep);
          if (stepKey) {
            setStepStatuses((prev) => {
              const next = { ...prev };
              // Mark all steps before current as completed
              for (const s of PROVISIONING_STEPS) {
                if (s.key === stepKey) break;
                if (next[s.key] === "pending" || next[s.key] === "running") {
                  next[s.key] = "completed";
                }
              }
              next[stepKey] = "running";
              return next;
            });
          }
        }
      } catch (_) { /* ignore poll errors */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [tenantAppId, overallStatus, fetchStatus, handleProvisioningEvent]);

  // Group steps for display
  const groups = /** @type {{ name: string; steps: (ProvisioningStepMeta & { status: StepStatus })[] }[]} */ ([]);
  /** @type {Map<string, (ProvisioningStepMeta & { status: StepStatus })[]>} */
  const groupMap = new Map();
  for (const step of PROVISIONING_STEPS) {
    if (!groupMap.has(step.group)) groupMap.set(step.group, []);
    groupMap.get(step.group)?.push({ ...step, status: stepStatuses[step.key] });
  }
  groupMap.forEach((steps, name) => groups.push({ name, steps }));

  const completedCount = Object.values(stepStatuses).filter((s) => s === "completed").length;
  const progressPct = Math.round((completedCount / PROVISIONING_STEPS.length) * 100);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center shrink-0 mb-6">
        {overallStatus === "completed" ? (
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-emerald-100/50">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-emerald-100 rounded-full animate-ping opacity-20" />
          </div>
        ) : overallStatus === "failed" ? (
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl shadow-rose-100/50">
            <XCircle size={40} strokeWidth={2.5} />
          </div>
        ) : (
          <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl shadow-purple-100/50">
            <Loader2 size={36} className="animate-spin" />
          </div>
        )}

        <h2 className="text-xl font-black text-slate-900 mb-1">
          {overallStatus === "completed"
            ? "Provisioning Complete"
            : overallStatus === "failed"
              ? "Provisioning Failed"
              : "Setting Up Your Workspace"}
        </h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          {overallStatus === "completed"
            ? `${productName || "Your workspace"} is ready to use.`
            : overallStatus === "failed"
              ? failMessage || "An error occurred during setup."
              : `Provisioning ${productName || "your workspace"}. This usually takes 30-60 seconds.`}
        </p>

        {overallStatus === "failed" && tenantAppId && (
          <button
            onClick={async () => {
              try {
                await retryProvision(tenantAppId).unwrap();
                // Reset step statuses — keep completed ones, reset failed→running
                setStepStatuses((prev) => {
                  /** @type {Record<string, StepStatus>} */
                  const next = {};
                  for (const [key, val] of Object.entries(prev)) {
                    next[key] = val === "failed" ? "running" : val;
                  }
                  return next;
                });
                setOverallStatus("running");
                setFailMessage(null);
                completedRef.current = false;
              } catch (err) {
                console.error("[ProvisioningWaitScreen] Retry failed:", err);
              }
            }}
            disabled={isRetrying}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />
            {isRetrying ? "Retrying..." : "Retry from failed step"}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-5 px-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
          <span className="text-[10px] font-bold text-purple-600">{progressPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              overallStatus === "failed" ? "bg-rose-500" : overallStatus === "completed" ? "bg-emerald-500" : "bg-purple-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 custom-scrollbar">
        {groups.map((group) => (
          <div key={group.name}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
              {group.name}
            </p>
            <div className="space-y-1">
              {group.steps.map((step) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300 ${
                    step.status === "running"
                      ? "bg-purple-50 border border-purple-100"
                      : step.status === "completed"
                        ? "bg-emerald-50/50"
                        : step.status === "failed"
                          ? "bg-rose-50 border border-rose-100"
                          : "opacity-40"
                  }`}
                >
                  <StepIcon status={step.status} />
                  <span
                    className={`text-sm font-medium ${
                      step.status === "running"
                        ? "text-purple-700"
                        : step.status === "completed"
                          ? "text-emerald-700"
                          : step.status === "failed"
                            ? "text-rose-700"
                            : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
