// @ts-check
import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Film,
  Inbox,
  Loader2,
  LogOut,
  MessageSquare,
  Play,
  RefreshCcw,
  Send,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Users,
} from "lucide-react";
import { AuthError, AuthLoader } from "@dalaillama/shared-ui";
import { getUser, useAuthBootstrap, useAuthGuard } from "@dalaillama/shared-hooks";
import { useKeycloakLogoutMutation } from "@dalaillama/shared-hooks";
import {
  useAddCreativeWorkOrderMessageMutation,
  useGetCreativeWorkerMeQuery,
  useGetCreativeWorkersQuery,
  useGetCreativeWorkQueueQuery,
  useSetCreativeWorkerPresenceMutation,
  useUpdateCreativeWorkOrderMutation,
} from "./api/creativeWorkEndpoints.js";

const QUEUE_STATUSES = "SUBMITTED,ASSIGNED,IN_PROGRESS,DELIVERED,CHANGE_REQUESTED";

const LANES = {
  copywriter: {
    key: "copywriter",
    role: "COPYWRITER",
    title: "Copywriter Desk",
    shortTitle: "Copywriter",
    workType: "SCREENPLAY_REVIEW",
    description: "Screenplay reviews waiting for human judgment.",
    empty: "No screenplay reviews are assigned right now.",
  },
  editor: {
    key: "editor",
    role: "EDITOR",
    title: "Editor Desk",
    shortTitle: "Editor",
    workType: "EDITING_JOB",
    description: "Editing jobs with final clips, assets, notes, and review chat.",
    empty: "No editing jobs are assigned right now.",
  },
  operations: {
    key: "operations",
    role: "OPS",
    title: "Operations Desk",
    shortTitle: "Operations",
    workType: "",
    description: "Unassigned and active creative work across both lanes.",
    empty: "No work is waiting right now.",
  },
};

function AuthCallbackPage() {
  const { status, error } = useAuthBootstrap();

  if (status === "authenticated") return <Navigate to="/" replace />;
  if (error) return <AuthError message={error} />;
  return <AuthLoader message="Signing you in" />;
}

function ProtectedDesk() {
  const { status } = useAuthGuard();

  if (status === "checking" || status === "redirecting") {
    return <AuthLoader message="Opening creative desk" />;
  }

  return <CreativeDesk />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<ProtectedDesk />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function CreativeDesk() {
  const user = useSelector((state) => state.auth?.user) || getUser() || {};
  const lane = useMemo(() => resolveLane(user), [user]);
  const isOps = lane.key === "operations";
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [drafts, setDrafts] = useState({});
  const [messageDrafts, setMessageDrafts] = useState({});
  const [presenceOnline, setPresenceOnline] = useState(true);
  const [logoutMutation] = useKeycloakLogoutMutation();
  const [setPresence, presenceState] = useSetCreativeWorkerPresenceMutation();
  const [updateWorkOrder, updateState] = useUpdateCreativeWorkOrderMutation();
  const [addMessage, messageState] = useAddCreativeWorkOrderMessageMutation();

  const params = {
    status: statusFilter === "ACTIVE" ? QUEUE_STATUSES : statusFilter,
    limit: 80,
    ...(lane.workType ? { workType: lane.workType } : {}),
  };
  const { data: workerMe, isLoading: isWorkerLoading } = useGetCreativeWorkerMeQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: queueData = [], isLoading, isFetching, refetch } = useGetCreativeWorkQueueQuery(params, {
    pollingInterval: 12000,
  });
  const { data: workersData = [] } = useGetCreativeWorkersQuery(undefined, {
    skip: !isOps,
    pollingInterval: 20000,
  });

  const orders = useMemo(() => normalizeArray(queueData), [queueData]);
  const workers = useMemo(() => normalizeArray(workersData), [workersData]);
  const selectedOrder = orders.find((order) => getOrderId(order) === selectedId) || orders[0] || null;

  useEffect(() => {
    if (!selectedId && orders[0]) {
      setSelectedId(getOrderId(orders[0]));
    }
  }, [orders, selectedId]);

  useEffect(() => {
    setPresenceOnline(workerMe?.online !== false);
  }, [workerMe?.online]);

  useEffect(() => {
    let cancelled = false;
    const goOnline = async () => {
      try {
        await setPresence({
          role: lane.role,
          online: true,
          displayName: user.name || user.email || "Creative worker",
        }).unwrap();
      } catch {
        if (!cancelled) setPresenceOnline(false);
      }
    };
    goOnline();
    const timer = window.setInterval(() => {
      if (presenceOnline) {
        setPresence({
          role: lane.role,
          online: true,
          displayName: user.name || user.email || "Creative worker",
        });
      }
    }, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [lane.role, presenceOnline, setPresence, user.email, user.name]);

  const formFor = (order) => drafts[getOrderId(order)] || {};
  const updateForm = (order, patch) => {
    const id = getOrderId(order);
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), ...patch } }));
  };

  const setOnline = async (online) => {
    setPresenceOnline(online);
    await setPresence({
      role: lane.role,
      online,
      displayName: user.name || user.email || "Creative worker",
    });
  };

  const patchOrder = async (order, status, extra = {}) => {
    const id = getOrderId(order);
    if (!id) return;
    const form = formFor(order);
    await updateWorkOrder({
      workOrderId: id,
      status,
      reviewerNotes: form.reviewerNotes || undefined,
      assignedTo: extra.assignedTo || form.assignedTo || undefined,
      deliveryPayload: status === "DELIVERED" ? deliveryPayloadFor(order, form) : undefined,
      sourcePayload: extra.sourcePayload,
    }).unwrap();
    refetch();
  };

  const sendChatMessage = async (order) => {
    const id = getOrderId(order);
    const text = (messageDrafts[id] || "").trim();
    if (!id || !text) return;
    await addMessage({
      workOrderId: id,
      message: text,
      authorRole: lane.key === "operations" ? "ops" : lane.key,
    }).unwrap();
    setMessageDrafts((current) => ({ ...current, [id]: "" }));
    refetch();
  };

  const handleLogout = async () => {
    await logoutMutation().unwrap().catch(() => {});
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="text-sm font-extrabold tracking-tight text-slate-950">Dalaillama</div>
            <div className="mt-1 text-xs font-semibold uppercase text-slate-500">Creative Desk</div>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Lane</p>
              <h1 className="mt-1 text-xl font-extrabold text-slate-950">{lane.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{lane.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setOnline(!presenceOnline)}
              disabled={presenceState.isLoading || isWorkerLoading}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm font-bold ${
                presenceOnline
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <span>{presenceOnline ? "Online for jobs" : "Offline"}</span>
              {presenceOnline ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Active" value={orders.length} />
              <Metric label="Delivered" value={orders.filter((order) => normalizeStatus(order.status) === "DELIVERED").length} />
            </div>
          </div>
          <div className="mt-auto border-t border-slate-200 p-5">
            <div className="mb-3 min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{user.name || "Creative worker"}</p>
              <p className="truncate text-xs text-slate-500">{user.email || workerMe?.email || lane.shortTitle}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                <Inbox className="h-4 w-4" />
                {lane.shortTitle}
              </div>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Work queue</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="ACTIVE">Active</option>
                <option value="SUBMITTED">Waiting</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="CHANGE_REQUESTED">Change requested</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              <button
                type="button"
                onClick={() => refetch()}
                className="flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-73px)] gap-0 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.35fr)]">
          <section className="border-r border-slate-200 bg-white">
            {isLoading ? (
              <CenteredLoader />
            ) : orders.length === 0 ? (
              <EmptyState text={lane.empty} />
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <QueueRow
                    key={getOrderId(order)}
                    order={order}
                    selected={getOrderId(order) === getOrderId(selectedOrder)}
                    onSelect={() => setSelectedId(getOrderId(order))}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-50">
            {!selectedOrder ? (
              <EmptyState text="Select a job to see details." />
            ) : (
              <WorkOrderDetail
                order={selectedOrder}
                lane={lane}
                isOps={isOps}
                workers={workers}
                form={formFor(selectedOrder)}
                messageDraft={messageDrafts[getOrderId(selectedOrder)] || ""}
                setMessageDraft={(value) =>
                  setMessageDrafts((current) => ({ ...current, [getOrderId(selectedOrder)]: value }))
                }
                updateForm={(patch) => updateForm(selectedOrder, patch)}
                patchOrder={patchOrder}
                sendChatMessage={sendChatMessage}
                busy={updateState.isLoading || messageState.isLoading}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function QueueRow({ order, selected, onSelect }) {
  const workType = normalizeWorkType(order.workType);
  const status = normalizeStatus(order.status);
  const Icon = workType === "EDITING_JOB" ? Film : FileText;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full px-4 py-4 text-left transition ${
        selected ? "bg-brand-50" : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-extrabold uppercase text-slate-700">
              <Icon className="h-3.5 w-3.5" /> {workTypeLabel(workType)}
            </span>
            <span className={`rounded-md px-2 py-1 text-[11px] font-extrabold uppercase ${statusClass(status)}`}>
              {statusLabel(status)}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5 text-slate-950">
            {order.title || "Untitled job"}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {order.description || order.requesterNotes || "No brief included."}
          </p>
        </div>
        <Clock3 className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-400">
        <span>{formatDate(order.submittedAt || order.createdAt)}</span>
        {order.assignedTo ? <span>Assigned</span> : <span>Unassigned</span>}
        {changeRequestCount(order) > 0 && <span>{changeRequestCount(order)} review note(s)</span>}
      </div>
    </button>
  );
}

function WorkOrderDetail({
  order,
  lane,
  isOps,
  workers,
  form,
  messageDraft,
  setMessageDraft,
  updateForm,
  patchOrder,
  sendChatMessage,
  busy,
}) {
  const id = getOrderId(order);
  const workType = normalizeWorkType(order.workType);
  const status = normalizeStatus(order.status);
  const source = order.sourcePayload || order.source_payload || {};
  const delivery = order.deliveryPayload || order.delivery_payload || {};
  const assets = extractAssets(source);
  const editorHandoff = extractEditorHandoff(source);
  const assignableWorkers = workers.filter((worker) => {
    const role = String(worker.role || "").toUpperCase();
    return workType === "EDITING_JOB" ? role === "EDITOR" : role === "COPYWRITER";
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-extrabold uppercase text-slate-700">
                {workTypeLabel(workType)}
              </span>
              <span className={`rounded-md px-2 py-1 text-[11px] font-extrabold uppercase ${statusClass(status)}`}>
                {statusLabel(status)}
              </span>
              {order.billingStatus && (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-extrabold uppercase text-amber-700">
                  {String(order.billingStatus).replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight text-slate-950">{order.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{order.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={UserCheck}
              label={order.assignedTo ? "Assigned" : "Claim"}
              disabled={busy || status === "ASSIGNED" || Boolean(order.assignedTo)}
              onClick={() => patchOrder(order, "ASSIGNED")}
            />
            <ActionButton
              icon={Play}
              label="Start"
              disabled={busy || status === "IN_PROGRESS"}
              onClick={() => patchOrder(order, "IN_PROGRESS")}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Panel title="Brief">
            <KeyValue label="Customer notes" value={order.requesterNotes || "No extra notes."} />
            <KeyValue label="Assigned to" value={order.assignedTo || "Not assigned yet"} />
            <KeyValue label="Price" value={`${order.priceAmount || 0} ${order.priceCurrency || "INR"}`} />
          </Panel>

          {workType === "EDITING_JOB" && editorHandoff && (
            <Panel title="Editor Handoff">
              <p className="text-sm leading-6 text-slate-700">
                {editorHandoff.summary || editorHandoff.editorNotes || "Use the approved source assets and return the finished edit."}
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <CompactList title="Tools to use" items={formatTools(editorHandoff.recommendedTools || editorHandoff.toolsToUse)} />
                <CompactList title="Source assets" items={formatList(editorHandoff.sourceAssetsRequired || source.sourceAssetsRequired)} />
                <CompactList title="Deliverables" items={formatList(editorHandoff.deliverables)} />
                <CompactList title="Quality checklist" items={formatList(editorHandoff.qualityChecklist || source.editorChecklist).slice(0, 8)} />
              </div>
              {editorHandoff.musicLicenseRequirements && (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <p className="text-[11px] font-extrabold uppercase text-amber-700">Music license</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    {editorHandoff.musicLicenseRequirements.policy || "Use only verified commercial-safe music and include license/source notes in delivery."}
                  </p>
                </div>
              )}
            </Panel>
          )}

          <Panel title="Source Assets">
            {assets.length === 0 ? (
              <p className="text-sm text-slate-500">No downloadable asset links were attached.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {assets.map((asset) => (
                  <a
                    key={asset.label}
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                  >
                    <span className="truncate">{asset.label}</span>
                    <Download className="h-4 w-4 shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
            <DetailsJson value={source.screenplay || source.screenplayVideoRun || source.editingPlan || source} />
          </Panel>

          <Panel title="Deliver Work">
            <div className="grid gap-3">
              <textarea
                value={form.reviewerNotes || ""}
                onChange={(event) => updateForm({ reviewerNotes: event.target.value })}
                rows={4}
                placeholder={workType === "EDITING_JOB" ? "Editor notes, changes made, known constraints" : "Copywriter notes, improved hook, structure changes"}
                className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600"
              />
              {workType === "SCREENPLAY_REVIEW" && (
                <textarea
                  value={form.improvedScreenplay || delivery.improvedScreenplay || ""}
                  onChange={(event) => updateForm({ improvedScreenplay: event.target.value })}
                  rows={6}
                  placeholder="Paste the improved screenplay or notes here"
                  className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600"
                />
              )}
              <input
                value={form.deliveryUrl || delivery.editedVideoUrl || delivery.improvedScreenplayUrl || ""}
                onChange={(event) => updateForm({ deliveryUrl: event.target.value })}
                placeholder={workType === "EDITING_JOB" ? "Edited video URL" : "Improved screenplay document URL"}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-600"
              />
              <button
                type="button"
                disabled={busy || (!form.deliveryUrl && workType === "EDITING_JOB")}
                onClick={() => patchOrder(order, "DELIVERED")}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Deliver to customer
              </button>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          {isOps && (
            <Panel title="Ops Assignment">
              <select
                value={form.assignedTo || ""}
                onChange={(event) => updateForm({ assignedTo: event.target.value })}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Choose online worker</option>
                {assignableWorkers.map((worker) => (
                  <option key={worker.userId || worker.user_id} value={worker.userId || worker.user_id}>
                    {worker.displayName || worker.email || worker.userId} {worker.online ? "(online)" : "(offline)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !form.assignedTo}
                onClick={() => patchOrder(order, "ASSIGNED", { assignedTo: form.assignedTo })}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:bg-slate-300"
              >
                <Users className="h-4 w-4" /> Assign selected worker
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                If nobody is online, call the right worker and ask them to log in. Pending jobs are assigned when they come online.
              </p>
            </Panel>
          )}

          <Panel title="Chat">
            <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              {normalizeArray(order.conversation).length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet.</p>
              ) : (
                normalizeArray(order.conversation).map((message) => (
                  <ChatBubble key={message.id || `${message.createdAt}-${message.message}`} message={message} />
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                rows={2}
                placeholder="Ask a question or send an update"
                className="min-h-16 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600"
              />
              <button
                type="button"
                disabled={busy || !messageDraft.trim()}
                onClick={() => sendChatMessage(order)}
                className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-extrabold uppercase text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-2 last:border-0">
      <p className="text-[11px] font-extrabold uppercase text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function CompactList({ title, items }) {
  const safeItems = formatList(items).filter(Boolean).slice(0, 10);
  if (safeItems.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-extrabold uppercase text-slate-400">{title}</p>
      <div className="mt-2 space-y-1.5">
        {safeItems.map((item, index) => (
          <p key={`${title}-${index}`} className="text-xs leading-5 text-slate-700">{item}</p>
        ))}
      </div>
    </div>
  );
}

function DetailsJson({ value }) {
  if (!value || typeof value !== "object") return null;
  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700">
        <ArrowUpRight className="h-4 w-4" /> View raw brief
      </summary>
      <pre className="max-h-72 overflow-auto border-t border-slate-200 p-3 text-xs leading-5 text-slate-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function ChatBubble({ message }) {
  const role = String(message.authorRole || "worker").toLowerCase();
  const isCreator = role === "creator";
  const isSystem = role === "system";
  return (
    <div className={`rounded-lg px-3 py-2 ${isSystem ? "bg-slate-100" : isCreator ? "bg-amber-50" : "bg-brand-50"}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`text-[11px] font-extrabold uppercase ${isCreator ? "text-amber-700" : "text-brand-700"}`}>
          {role.replace(/_/g, " ")}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">{formatDate(message.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-extrabold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function CenteredLoader() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
      <AlertCircle className="h-8 w-8 text-slate-300" />
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function resolveLane(user = {}) {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const laneParam = search.get("lane");
    if (laneParam && LANES[laneParam]) return LANES[laneParam];
    if (host.startsWith("copywriter.")) return LANES.copywriter;
    if (host.startsWith("editor.")) return LANES.editor;
    if (host.startsWith("operations.") || host.startsWith("ops.")) return LANES.operations;
  }

  const role = String(user.role || "").toLowerCase();
  if (role.includes("copywriter")) return LANES.copywriter;
  if (role.includes("editor")) return LANES.editor;
  if (role.includes("ops") || role.includes("operation")) return LANES.operations;
  return LANES.copywriter;
}

function normalizeArray(response) {
  if (Array.isArray(response)) return response;
  return [response?.items, response?.content, response?.data, response?.workOrders].find(Array.isArray) || [];
}

function getOrderId(order = {}) {
  return order.id || order.workOrderId || order.work_order_id || "";
}

function normalizeWorkType(value) {
  return String(value || "SCREENPLAY_REVIEW").toUpperCase();
}

function normalizeStatus(value) {
  return String(value || "SUBMITTED").toUpperCase();
}

function statusLabel(status) {
  return String(status || "SUBMITTED")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function workTypeLabel(workType) {
  return workType === "EDITING_JOB" ? "Editing job" : "Screenplay review";
}

function statusClass(status) {
  if (status === "DELIVERED") return "bg-emerald-50 text-emerald-700";
  if (status === "CHANGE_REQUESTED") return "bg-amber-50 text-amber-700";
  if (status === "IN_PROGRESS") return "bg-blue-50 text-blue-700";
  if (status === "ASSIGNED") return "bg-violet-50 text-violet-700";
  return "bg-slate-100 text-slate-600";
}

function extractAssets(source = {}) {
  const pairs = [
    ["Final clip", source.finalClipUrl || source.final_clip_url],
    ["Voice track", source.segregatedAssets?.voice || source.voiceTrack || source.voice],
    ["Music track", source.segregatedAssets?.music || source.musicTrack || source.music],
    ["Captions", source.segregatedAssets?.captions || source.srt || source.captionTrack],
    ["Edited source", source.downloadUrl || source.sourceUrl],
  ];
  return pairs
    .filter(([, url]) => typeof url === "string" && url.trim())
    .map(([label, url]) => ({ label, url }));
}

function extractEditorHandoff(source = {}) {
  const direct = source.editorHandoffPlan || source.editor_handoff_plan || source.editingPlan || source.editing_plan;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct;
  const run = source.screenplayVideoRun || source.screenplay_video_run || {};
  const runPlan = run.editorHandoffPlan || run.editingPlan;
  if (runPlan && typeof runPlan === "object" && !Array.isArray(runPlan)) return runPlan;
  const manifest = run.renderManifest || run.render_manifest || {};
  const manifestPlan = manifest.editorHandoffPlan || manifest.editingPlan;
  if (manifestPlan && typeof manifestPlan === "object" && !Array.isArray(manifestPlan)) return manifestPlan;
  return null;
}

function formatTools(value) {
  const tools = Array.isArray(value) ? value : [];
  return tools.map((tool) => {
    if (!tool || typeof tool !== "object") return String(tool || "");
    const stage = String(tool.stage || tool.name || "tool").replace(/_/g, " ");
    const preferred = tool.preferred || tool.tool || "";
    const alternatives = Array.isArray(tool.alternatives) && tool.alternatives.length > 0
      ? `; alternatives: ${tool.alternatives.join(", ")}`
      : "";
    return `${stage}: ${preferred}${alternatives}`;
  });
}

function formatList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!item || typeof item !== "object") return String(item || "");
      return item.title || item.label || item.policy || item.summary || JSON.stringify(item);
    }).filter(Boolean);
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key.replace(/_/g, " ")}: ${typeof item === "object" ? JSON.stringify(item) : item}`);
  }
  return [String(value)];
}

function deliveryPayloadFor(order = {}, form = {}) {
  const workType = normalizeWorkType(order.workType);
  const base = {
    reviewerNotes: form.reviewerNotes || "",
    deliveredAt: new Date().toISOString(),
  };
  if (workType === "EDITING_JOB") {
    return {
      ...base,
      editedVideoUrl: form.deliveryUrl || "",
      assetNotes: form.reviewerNotes || "",
    };
  }
  return {
    ...base,
    improvedScreenplay: form.improvedScreenplay || "",
    improvedScreenplayUrl: form.deliveryUrl || "",
    scriptReviewNotes: form.reviewerNotes || "",
  };
}

function changeRequestCount(order = {}) {
  return normalizeArray(order.conversation).filter(
    (message) => String(message.messageType || "").toUpperCase() === "CHANGE_REQUEST"
  ).length;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}
