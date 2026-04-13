// src/pages/admin/AdminDashboard.jsx
import React, { useState } from "react";
import {
  Phone,
  Radio,
  GitBranch,
  Database,
  Gauge,
  Activity,
  UserPlus,
  Bot,
  Layers,
  PlusCircle,
  Sliders,
  X,
} from "lucide-react";

/**
 * RTK Query hooks expected to be exported by your adminApi slice.
 * Make sure these exist (names may differ; adjust import if needed).
 */
import {
  useAddAgentMutation,
  useAddQueueMutation,
  useBuyDidMutation,
  useCreateBotMutation,
  useSaveDidMutation,
  useSaveSipMutation,
  usePublishIvrMutation,
} from "@dalaillama/shared-store";

/* -------------------------------------------------------------------------- */
/*                                 TYPE HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Telephony overview shape
 * @typedef {Object} TelephonyOverview
 * @property {string} primaryDid
 * @property {string} sipTrunkStatus
 * @property {string} defaultIvr
 * @property {string} inboundRouting
 * @property {string} outboundCalls
 */

/**
 * Live stats shape
 * @typedef {Object} LiveStats
 * @property {number} activeCalls
 * @property {number} agentsOnline
 * @property {number} queues
 * @property {number} peakToday
 * @property {number} supervisors
 * @property {number} bots
 */

/**
 * Usage stats shape
 * @typedef {Object} UsageStats
 * @property {number} voiceMinutes
 * @property {number} botMinutes
 * @property {string} storageUsed
 * @property {number} recordings
 */

/**
 * Global modal keys including quick actions
 * @typedef {'did' | 'sip' | 'ivr' | 'inbound' | 'outbound' | 'addAgent' | 'addQueue' | 'buyDid' | 'publishIvr' | 'addBot' | null} ModalID
 */

/**
 * AccentColor union
 * @typedef {'cyan' | 'violet' | 'amber' | 'fuchsia' | 'emerald' | 'indigo'} AccentColor
 */

/**
 * Error map type
 * @typedef {Record<string, string>} ErrorMap
 */

/* -------------------------------------------------------------------------- */
/*                              UTIL HELPERS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Safely extract message from unknown error
 * @param {unknown} err
 * @returns {string}
 */
const getErrMsg = (err) => {
  if (typeof err === "string") return err;
  if (typeof err === "object" && err && "message" in err) {
    // @ts-ignore
    return /** @type {{ message: string }} */ (err).message || "Unexpected error";
  }
  return "Unexpected error";
};

/* -------------------------------------------------------------------------- */
/*                              MAIN DASHBOARD                                 */
/* -------------------------------------------------------------------------- */

/**
 * Admin Dashboard — RTK Query integrated version
 * @returns {React.ReactElement}
 */
export default function AdminDashboard() {
  /** @type {[TelephonyOverview, React.Dispatch<React.SetStateAction<TelephonyOverview>>]} */
  const [telephony, setTelephony] = useState({
    primaryDid: "+1 202 555 0134",
    sipTrunkStatus: "Connected",
    defaultIvr: "Published (2 hrs ago)",
    inboundRouting: "Active",
    outboundCalls: "Enabled",
  });

  /** @type {[LiveStats, React.Dispatch<React.SetStateAction<LiveStats>>]} */
  const [stats, setStats] = useState({
    activeCalls: 12,
    agentsOnline: 18,
    queues: 4,
    peakToday: 29,
    supervisors: 3,
    bots: 2,
  });

  /** @type {[UsageStats, React.Dispatch<React.SetStateAction<UsageStats>>]} */
  const [usage, setUsage] = useState({
    voiceMinutes: 143,
    botMinutes: 18,
    storageUsed: "3.1 GB",
    recordings: 248,
  });

  /** @type {[ModalID, React.Dispatch<React.SetStateAction<ModalID>>]} */
  const [modal, setModal] = useState(/** @type {ModalID} */ (null));

  /* ----------------------- RTK Query mutations ----------------------- */
  const [addAgent, { isLoading: addAgentLoading }] = useAddAgentMutation();
  const [addQueue, { isLoading: addQueueLoading }] = useAddQueueMutation();
  const [buyDid, { isLoading: buyDidLoading }] = useBuyDidMutation();
  const [createBot, { isLoading: createBotLoading }] = useCreateBotMutation();
  const [saveDid, { isLoading: saveDidLoading }] = useSaveDidMutation();
  const [saveSip, { isLoading: saveSipLoading }] = useSaveSipMutation();
  const [publishIvr, { isLoading: publishIvrLoading }] = usePublishIvrMutation();

  /**
   * optimistic increment when adding agent locally
   * @param {any} agentPayload
   */
  const handleOptimisticAgentAdd = (agentPayload) => {
    setStats((s) => ({ ...s, agentsOnline: s.agentsOnline + 1 }));
  };

  const handleRevertAgentAdd = () => {
    setStats((s) => ({ ...s, agentsOnline: Math.max(0, s.agentsOnline - 1) }));
  };

  /**
   * @param {string} newDid
   */
  const applyDidUpdate = (newDid) => {
    setTelephony((t) => ({ ...t, primaryDid: newDid }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Top header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Gauge className="text-sky-600" />
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enterprise control — compact & actionable</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">Prod · us-east</div>
          <button
            onClick={() => alert("Theme toggle placeholder")}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50"
            aria-label="Toggle theme"
          >
            <Sliders size={16} />
          </button>
        </div>
      </header>

      {/* Layout: main content + sticky right actions */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6" style={{ minHeight: "calc(100vh - 88px)" }}>
        {/* MAIN COLUMN */}
        <main className="space-y-6 overflow-hidden">
          {/* Glance metrics bar */}
          <div className="flex gap-4 items-stretch">
            <CompactMetric icon={<Phone />} label="Primary DID" value={telephony.primaryDid} />
            <CompactMetric icon={<Radio />} label="SIP Trunk" value={telephony.sipTrunkStatus} />
            <CompactMetric icon={<Activity />} label="Active Calls" value={String(stats.activeCalls)} />
            <CompactMetric icon={<UserPlus />} label="Agents" value={String(stats.agentsOnline)} />
            <CompactMetric icon={<Gauge />} label="Peak Today" value={String(stats.peakToday)} />
          </div>

          {/* Live tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <LiveTile title="Live Calls" value={stats.activeCalls} icon={<Activity />} accent="cyan" />
            <LiveTile title="Agents Online" value={stats.agentsOnline} icon={<UserPlus />} accent="violet" />
            <LiveTile title="Queues" value={stats.queues} icon={<Layers />} accent="amber" />
            <LiveTile title="Bots" value={stats.bots} icon={<Bot />} accent="fuchsia" />
            <LiveTile title="IVR Status" value={telephony.defaultIvr} icon={<GitBranch />} accent="emerald" />
            <LiveTile title="Storage" value={usage.storageUsed} icon={<Database />} accent="indigo" />
          </div>

          {/* Compact telephony overview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-sky-50 to-white dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-100 dark:border-slate-700">
                  <Phone className="text-sky-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Primary DID</div>
                  <div className="font-semibold">{telephony.primaryDid}</div>
                </div>

                <div className="ml-6">
                  <div className="text-xs text-slate-500 dark:text-slate-400">SIP Trunk</div>
                  <div className="font-semibold">{telephony.sipTrunkStatus}</div>
                </div>

                <div className="ml-6">
                  <div className="text-xs text-slate-500 dark:text-slate-400">IVR</div>
                  <div className="font-semibold">{telephony.defaultIvr}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModal(/** @type {ModalID} */("did"))}
                  className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition"
                >
                  Edit DID
                </button>
                <button
                  onClick={() => setModal(/** @type {ModalID} */("sip"))}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Trunk Settings
                </button>
              </div>
            </div>
          </div>

          {/* Bottom: usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageCard title="Voice Minutes" value={`${usage.voiceMinutes} min`} />
            <UsageCard title="Bot Minutes" value={`${usage.botMinutes} min`} />
            <UsageCard title="Recordings" value={String(usage.recordings)} />
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="relative">
          <div className="sticky top-6 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Quick Actions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">One-click common tasks</p>

              <div className="flex flex-col gap-2">
                <QuickActionButton label="Add Agent" onClick={() => setModal(/** @type {ModalID} */("addAgent"))} />
                <QuickActionButton label="Add Queue" onClick={() => setModal(/** @type {ModalID} */("addQueue"))} />
                <QuickActionButton label="Buy DID" onClick={() => setModal(/** @type {ModalID} */("buyDid"))} />
                <QuickActionButton label="Publish IVR" onClick={() => setModal(/** @type {ModalID} */("publishIvr"))} />
                <QuickActionButton label="Add Bot" onClick={() => setModal(/** @type {ModalID} */("addBot"))} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow">
              <h4 className="text-sm font-semibold">System Health</h4>
              <div className="mt-3 text-xs text-slate-200">All systems nominal · latency 32ms · errors 0</div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-white/10 rounded-md text-sm">View Logs</button>
                <button className="px-3 py-2 bg-white/20 rounded-md text-sm">Run Check</button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL */}
      <ModalShell active={modal} onClose={() => setModal(/** @type {ModalID} */(null))}>
        <ModalContent
          keyId={modal}
          onClose={() => setModal(/** @type {ModalID} */(null))}
          onAgentOptimisticAdd={handleOptimisticAgentAdd}
          onAgentRevertAdd={handleRevertAgentAdd}
          onDidSaved={applyDidUpdate}
          rtk={{
            addAgent,
            addAgentLoading,
            addQueue,
            addQueueLoading,
            buyDid,
            buyDidLoading,
            createBot,
            createBotLoading,
            saveDid,
            saveDidLoading,
            saveSip,
            saveSipLoading,
            publishIvr,
            publishIvrLoading,
          }}
        />
      </ModalShell>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Small UI Primitives                            */
/* -------------------------------------------------------------------------- */

/**
 * Compact metric pill
 * @param {{ icon: React.ReactNode, label: string, value: string }} props
 */
const CompactMetric = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 px-3 py-2 bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm flex-1 min-w-[160px]">
    <div className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
      {icon}
    </div>
    <div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  </div>
);

/**
 * @typedef {Object} LiveTileProps
 * @property {string} title
 * @property {string | number} value
 * @property {React.ReactNode} icon
 * @property {AccentColor} [accent]
 */

/**
 * @param {LiveTileProps} props
 */
const LiveTile = ({ title, value, icon, accent = "cyan" }) => {
  /** @type {Record<AccentColor, string>} */
  const accentMap = {
    cyan: "from-cyan-50 to-white",
    violet: "from-violet-50 to-white",
    amber: "from-amber-50 to-white",
    fuchsia: "from-fuchsia-50 to-white",
    emerald: "from-emerald-50 to-white",
    indigo: "from-indigo-50 to-white",
  };

  const accentClass = accentMap[accent];

  return (
    <div
      className={`bg-gradient-to-br ${accentClass} rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
            {icon}
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{title}</div>
            <div className="font-bold text-lg">{value}</div>
          </div>
        </div>
        <div className="text-xs text-slate-500">Live</div>
      </div>
    </div>
  );
};

/**
 * Usage card
 * @param {{ title: string, value: string }} props
 */
const UsageCard = ({ title, value }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
    <div className="text-xs text-slate-500">{title}</div>
    <div className="font-bold text-lg mt-2">{value}</div>
  </div>
);

/**
 * Quick action button
 * @param {{ label: string, onClick: () => void }} props
 */
const QuickActionButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-3"
  >
    <PlusCircle size={16} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

/* -------------------------------------------------------------------------- */
/*                                   MODAL                                     */
/* -------------------------------------------------------------------------- */

/**
 * Modal shell wrapper
 * @param {{ active: ModalID, onClose: () => void, children: React.ReactNode }} props
 */
const ModalShell = ({ active, onClose, children }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94%] max-w-2xl p-4">{children}</div>
    </div>
  );
};

/**
 * @typedef {{ keyId: ModalID, onClose: () => void, onAgentOptimisticAdd: (p: any) => void, onAgentRevertAdd: () => void, onDidSaved: (d: string) => void, rtk: any }} ModalContentProps
 * @param {ModalContentProps} props
 */
const ModalContent = ({ keyId, onClose, onAgentOptimisticAdd, onAgentRevertAdd, onDidSaved, rtk }) => {
  if (!keyId) return null;

  // Titles map
  const titles = {
    did: "Edit Primary DID",
    sip: "Configure SIP Trunk",
    ivr: "Publish / Edit IVR",
    inbound: "Inbound Routing",
    outbound: "Outbound Calling",
    addAgent: "Add Agent",
    addQueue: "Add Queue",
    buyDid: "Buy DID",
    publishIvr: "Publish IVR",
    addBot: "Add Bot",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{titles[keyId]}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Production-ready workflow — async & optimistic</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
          <X />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {keyId === "addAgent" && (
          <AddAgentForm
            onClose={onClose}
            onOptimisticAdd={onAgentOptimisticAdd}
            onRevert={onAgentRevertAdd}
            createAgent={rtk.addAgent}
            loading={rtk.addAgentLoading}
          />
        )}
        {keyId === "addQueue" && <AddQueueForm onClose={onClose} createQueue={rtk.addQueue} loading={rtk.addQueueLoading} />}
        {keyId === "buyDid" && <BuyDidForm onClose={onClose} buyDid={rtk.buyDid} loading={rtk.buyDidLoading} />}
        {(keyId === "publishIvr" || keyId === "ivr") && <PublishIVRForm onClose={onClose} publishIvr={rtk.publishIvr} loading={rtk.publishIvrLoading} />}
        {keyId === "addBot" && <AddBotForm onClose={onClose} createBot={rtk.createBot} loading={rtk.createBotLoading} />}
        {keyId === "did" && <EditDidForm onClose={onClose} onSaved={onDidSaved} saveDid={rtk.saveDid} loading={rtk.saveDidLoading} />}
        {keyId === "sip" && <SipTrunkForm onClose={onClose} saveSip={rtk.saveSip} loading={rtk.saveSipLoading} />}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             PRODUCTION FORMS                                */
/* -------------------------------------------------------------------------- */

/**
 * Basic reusable field wrapper
 * @param {{ label: string, error?: string, children: React.ReactNode }} props
 */
const Field = ({ label, error, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
  </div>
);

/**
 * Shared submit/cancel row
 * @param {{ onCancel: () => void, submitLabel?: string, submitting?: boolean }} props
 */
const SubmitRow = ({ onCancel, submitLabel = "Save", submitting = false }) => (
  <div className="flex justify-end gap-3 pt-2">
    <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
    <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg" disabled={submitting}>
      {submitting ? "Working..." : submitLabel}
    </button>
  </div>
);

/* ------------------------------- AddAgentForm ------------------------------- */
/**
 * @param {{ onClose: () => void, onOptimisticAdd: (p: any) => void, onRevert: () => void, createAgent: any, loading: boolean }} props
 */
const AddAgentForm = ({ onClose, onOptimisticAdd, onRevert, createAgent, loading }) => {
  /** @type {[ErrorMap, React.Dispatch<React.SetStateAction<ErrorMap>>]} */
  const [errors, setErrors] = useState(/** @type {ErrorMap} */ ({}));
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [statusMsg, setStatusMsg] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      role: String(form.get("role") || "agent"),
      password: String(form.get("password") || "").trim(),
      ext: String(form.get("ext") || "").trim(),
      skill: String(form.get("skill") || "Support"),
    };

    /** @type {ErrorMap} */
    const newErrors = {};

    if (!payload.name) newErrors.name = "Name required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) newErrors.email = "Invalid email";
    if (payload.password.length < 6) newErrors.password = "Min 6 chars";
    if (!/^\d{3,4}$/.test(payload.ext)) newErrors.ext = "Ext must be 3-4 digits";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    // optimistic update
    onOptimisticAdd(payload);
    setSubmitting(true);
    setStatusMsg("Creating agent...");

    try {
      // RTK Query mutation (expects promise with unwrap in slice wiring)
      const result = await createAgent(payload).unwrap?.() ?? createAgent(payload);
      setStatusMsg("Agent created successfully.");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      // revert optimistic update
      onRevert();
      const msg = getErrMsg(err);
      setErrors({ submit: msg });
      setStatusMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name" error={errors.name}>
          <input name="name" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input name="email" type="email" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Role">
          <select name="role" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option value="agent">Agent</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </Field>

        <Field label="Skill group">
          <select name="skill" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option>Support</option>
            <option>Sales</option>
            <option>Billing</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Password" error={errors.password}>
          <div className="flex gap-2">
            <input name="password" type="text" className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <button
              type="button"
              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg"
              onClick={() => {
                const generated = Math.random().toString(36).slice(2, 10);
                const el = /** @type {HTMLInputElement | null} */ (document.querySelector("input[name=password]"));
                if (el) el.value = generated;
              }}
            >
              Generate
            </button>
          </div>
        </Field>

        <Field label="Extension" error={errors.ext}>
          <input name="ext" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="1002" />
        </Field>
      </div>

      {errors.submit && <div className="text-sm text-red-500">{errors.submit}</div>}
      {statusMsg && <div className="text-sm text-slate-500">{statusMsg}</div>}

      <SubmitRow onCancel={onClose} submitLabel="Create Agent" submitting={submitting || loading} />
    </form>
  );
};

/* ------------------------------- AddQueueForm ------------------------------- */
/**
 * @param {{ onClose: () => void, createQueue: any, loading: boolean }} props
 */
const AddQueueForm = ({ onClose, createQueue, loading }) => {
  /** @type {[ErrorMap, React.Dispatch<React.SetStateAction<ErrorMap>>]} */
  const [errors, setErrors] = useState(/** @type {ErrorMap} */ ({}));
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [status, setStatus] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    const form = new FormData(e.currentTarget);

    const payload = {
      name: String(form.get("name") || "").trim(),
      strategy: String(form.get("strategy") || "round-robin"),
      maxWait: Number(form.get("maxWait") || 30),
      music: String(form.get("music") || "Corporate Classic"),
    };

    /** @type {ErrorMap} */
    const newErrors = {};
    if (!payload.name) newErrors.name = "Queue name required";
    if (payload.maxWait < 10) newErrors.maxWait = "Minimum 10 seconds";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    setStatus("Creating queue...");

    try {
      await createQueue(payload).unwrap?.();
      setStatus("Queue created");
      setTimeout(() => onClose(), 500);
    } catch (err) {
      const msg = getErrMsg(err);
      setErrors({ submit: msg });
      setStatus(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <Field label="Queue Name" error={errors.name}>
        <input name="name" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Routing Strategy">
          <select name="strategy" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option value="round-robin">Round Robin</option>
            <option value="least-calls">Least Calls</option>
            <option value="ring-all">Ring All</option>
          </select>
        </Field>

        <Field label="Max Wait (s)" error={errors.maxWait}>
          <input name="maxWait" type="number" min="10" defaultValue={30} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </Field>
      </div>

      <Field label="Hold Music">
        <select name="music" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <option>Corporate Classic</option>
          <option>Soft Melody</option>
          <option>Calm Synth</option>
        </select>
      </Field>

      {errors.submit && <div className="text-sm text-red-500">{errors.submit}</div>}
      {status && <div className="text-sm text-slate-500">{status}</div>}

      <SubmitRow onCancel={onClose} submitLabel="Create Queue" submitting={submitting || loading} />
    </form>
  );
};

/* -------------------------------- BuyDidForm -------------------------------- */
/**
 * @param {{ onClose: () => void, buyDid: any, loading: boolean }} props
 */
const BuyDidForm = ({ onClose, buyDid, loading }) => {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [searching, setSearching] = useState(false);
  /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
  const [numbers, setNumbers] = useState(/** @type {string[]} */ ([]));
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [selected, setSelected] = useState("");
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [status, setStatus] = useState("");
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [submitting, setSubmitting] = useState(false);

  const searchNumbers = async () => {
    setSearching(true);
    setStatus("Searching numbers…");
    // You can use backend search in the future; currently just simulate a quick fetch
    // We'll call backend on buy, not on search, per your request to "save data in backend".
    setTimeout(() => {
      const found = ["+1 202 555 0173", "+1 202 555 0191", "+1 202 555 0110"];
      setNumbers(found);
      setStatus(`${found.length} numbers found`);
      setSearching(false);
    }, 450);
  };

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleBuy = async (e) => {
    e.preventDefault();
    if (!selected) {
      setStatus("Select a number to buy");
      return;
    }
    setSubmitting(true);
    setStatus("Purchasing number...");
    try {
      await buyDid({ number: selected }).unwrap?.();
      setStatus("Number purchased");
      setTimeout(() => onClose(), 600);
    } catch (err) {
      const msg = getErrMsg(err);
      setStatus(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleBuy} className="space-y-4" aria-live="polite">
      <Field label="Country / Region">
        <select name="country" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <option value="US">🇺🇸 United States</option>
          <option value="IN">🇮🇳 India</option>
          <option value="UK">🇬🇧 United Kingdom</option>
        </select>
      </Field>

      <Field label="Pattern / Prefix">
        <input name="pattern" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="202, 987..." />
      </Field>

      <div className="flex gap-2">
        <button type="button" onClick={searchNumbers} className="px-4 py-2 bg-sky-600 text-white rounded-lg" disabled={searching}>
          {searching ? "Searching…" : "Search Numbers"}
        </button>
        <div className="flex-1 text-sm text-slate-500 pt-2">{status}</div>
      </div>

      {numbers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Available</div>
          <div className="grid grid-cols-1 gap-2">
            {numbers.map((n) => (
              <label key={n} className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer">
                <input name="selected" type="radio" value={n} onChange={() => setSelected(n)} checked={selected === n} />
                <div className="font-medium">{n}</div>
              </label>
            ))}
          </div>
        </div>
      )}

      <SubmitRow onCancel={onClose} submitLabel="Buy Number" submitting={submitting || loading} />
    </form>
  );
};

/* ------------------------------- PublishIVRForm ----------------------------- */
/**
 * @param {{ onClose: () => void, publishIvr: any, loading: boolean }} props
 */
const PublishIVRForm = ({ onClose, publishIvr, loading }) => {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [publishing, setPublishing] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [status, setStatus] = useState("");

  const handlePublish = async () => {
    setPublishing(true);
    setStatus("Publishing IVR...");
    try {
      await publishIvr({ flowId: "default" }).unwrap?.();
      setStatus("IVR published");
      setTimeout(() => onClose(), 500);
    } catch (err) {
      const msg = getErrMsg(err);
      setStatus(msg);
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        Current state: <span className="font-semibold">Published (2 hrs ago)</span>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-sky-600 text-white rounded-lg" onClick={handlePublish} disabled={publishing || loading}>
          {publishing || loading ? "Publishing…" : "Publish IVR"}
        </button>
        <button className="px-4 py-2 border rounded-lg" onClick={() => alert("Open IVR builder")}>
          Open IVR Builder
        </button>
      </div>
      {status && <div className="text-sm text-slate-500">{status}</div>}
    </div>
  );
};

/* -------------------------------- AddBotForm -------------------------------- */
/**
 * @param {{ onClose: () => void, createBot: any, loading: boolean }} props
 */
const AddBotForm = ({ onClose, createBot, loading }) => {
  /** @type {[ErrorMap, React.Dispatch<React.SetStateAction<ErrorMap>>]} */
  const [errors, setErrors] = useState(/** @type {ErrorMap} */ ({}));
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [status, setStatus] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      language: String(form.get("language") || "English"),
      model: String(form.get("model") || "gpt-4.1"),
      welcome: String(form.get("welcome") || "").trim(),
      // voice bot options for later: provider, apiKeyId, voiceEngine etc.
      type: String(form.get("type") || "chat"),
      provider: String(form.get("provider") || "openai"),
      apiKeyId: String(form.get("apiKeyId") || ""),
      voiceEngine: String(form.get("voiceEngine") || ""),
    };

    /** @type {ErrorMap} */
    const newErrors = {};
    if (!payload.name) newErrors.name = "Bot name required";
    if (payload.type === "voice" && !payload.apiKeyId) newErrors.apiKeyId = "API Key required for voice bot";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    setStatus("Creating bot...");

    try {
      await createBot(payload).unwrap?.();
      setStatus("Bot created");
      setTimeout(() => onClose(), 500);
    } catch (err) {
      const msg = getErrMsg(err);
      setStatus(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <Field label="Bot name" error={errors.name}>
        <input name="name" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Support Assistant" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Bot type">
          <select name="type" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" defaultValue="chat">
            <option value="chat">Chat Bot</option>
            <option value="voice">Voice Bot</option>
          </select>
        </Field>

        <Field label="Language">
          <select name="language" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option>English</option>
            <option>Hindi</option>
            <option>Spanish</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="LLM Provider">
          <select name="provider" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" defaultValue="openai">
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="local">Local</option>
          </select>
        </Field>

        <Field label="Model">
          <select name="model" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" defaultValue="gpt-4.1">
            <option value="gpt-4.1">gpt-4.1</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="llama-3">llama-3</option>
          </select>
        </Field>
      </div>

      <Field label="Provider API Key (ID)">
        <input name="apiKeyId" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="apiKeyId (saved server-side)" />
      </Field>

      <Field label="Voice Engine (optional)">
        <select name="voiceEngine" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <option value="">— none —</option>
          <option value="elevenlabs:klaryx">ElevenLabs — Klaryx</option>
        </select>
      </Field>

      <Field label="Welcome Message">
        <textarea name="welcome" rows={3} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Hi — how can I help?"></textarea>
      </Field>

      {status && <div className="text-sm text-slate-500">{status}</div>}
      <SubmitRow onCancel={onClose} submitLabel="Create Bot" submitting={submitting || loading} />
    </form>
  );
};

/* -------------------------------- EditDidForm -------------------------------- */
/**
 * @param {{ onClose: () => void, onSaved: (d: string) => void, saveDid: any, loading: boolean }} props
 */
const EditDidForm = ({ onClose, onSaved, saveDid, loading }) => {
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [value, setValue] = useState("+1 202 555 0134");
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [status, setStatus] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!value || value.trim().length < 6) {
      setStatus("Enter a valid DID");
      return;
    }
    setSubmitting(true);
    setStatus("Saving...");
    try {
      await saveDid({ did: value }).unwrap?.();
      setStatus("Saved");
      onSaved(value);
      setTimeout(() => onClose(), 400);
    } catch (err) {
      const msg = getErrMsg(err);
      setStatus(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4" aria-live="polite">
      <Field label="Primary DID">
        <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
      </Field>

      {status && <div className="text-sm text-slate-500">{status}</div>}
      <SubmitRow onCancel={onClose} submitLabel="Save DID" submitting={submitting || loading} />
    </form>
  );
};

/* -------------------------------- SipTrunkForm -------------------------------- */
/**
 * @param {{ onClose: () => void, saveSip: any, loading: boolean }} props
 */
const SipTrunkForm = ({ onClose, saveSip, loading }) => {
  /** @type {[ErrorMap, React.Dispatch<React.SetStateAction<ErrorMap>>]} */
  const [errors, setErrors] = useState(/** @type {ErrorMap} */ ({}));
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [status, setStatus] = useState("");

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    const form = new FormData(e.currentTarget);
    const payload = {
      server: String(form.get("server") || "").trim(),
      username: String(form.get("username") || "").trim(),
      password: String(form.get("password") || "").trim(),
      port: Number(form.get("port") || 5060),
    };

    /** @type {ErrorMap} */
    const newErrors = {};
    if (!payload.server) newErrors.server = "SIP server required";
    if (!payload.username) newErrors.username = "Username required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    setStatus("Saving trunk...");

    try {
      await saveSip(payload).unwrap?.();
      setStatus("Saved");
      setTimeout(() => onClose(), 400);
    } catch (err) {
      const msg = getErrMsg(err);
      setStatus(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <Field label="SIP Server" error={errors.server}>
        <input name="server" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="sip.example.com" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Username" error={errors.username}>
          <input name="username" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </Field>

        <Field label="Password">
          <input name="password" type="password" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </Field>
      </div>

      <Field label="Port">
        <input name="port" type="number" defaultValue={5060} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
      </Field>

      {status && <div className="text-sm text-slate-500">{status}</div>}
      <SubmitRow onCancel={onClose} submitLabel="Save Trunk" submitting={submitting || loading} />
    </form>
  );
};
