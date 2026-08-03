import { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  useListQueuesQuery, useCreateQueueMutation, useGetQueueQuery,
  useGetQueueStatsQuery, useGetQueueMembersQuery,
  useAddQueueMemberMutation, useRemoveQueueMemberMutation,
  useListAgentsQuery,
} from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import {
  useGetCreativeWorkOrdersQuery,
  useUpdateCreativeWorkOrderMutation,
} from '../api/creatorWorkOrderEndpoints.js';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  ArrowLeft, BarChart3, CheckCircle2, ClipboardCheck, FileText, Film, Layers, Loader2, Plus, Send, Trash2, UserPlus, Users,
} from 'lucide-react';

export default function Queues() {
  return (
    <Routes>
      <Route index element={<QueueList />} />
      <Route path=":id" element={<QueueDetail />} />
    </Routes>
  );
}

function QueueList() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
  const { data: queues = [], isLoading } = useListQueuesQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [createQueue] = useCreateQueueMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', strategy: 'ROUND_ROBIN', max_wait_seconds: 300, wrapup_seconds: 15 });

  const handleCreate = async () => {
    if (!tenantId) return;
    try {
      await createQueue({ tenant_id: tenantId, subscription_id: tenantId, ...form }).unwrap();
      setShowCreate(false);
      setForm({ name: '', strategy: 'ROUND_ROBIN', max_wait_seconds: 300, wrapup_seconds: 15 });
    } catch (/** @type {any} */ e) { alert(e?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Queues</h1>
          <p className="text-sm text-slate-500 mt-1">{/** @type {any[]} */ (queues).length} queue{/** @type {any[]} */ (queues).length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Create Queue
        </button>
      </div>

      <CreativeWorkQueue />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : /** @type {any[]} */ (queues).length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No queues yet</p>
          </div>
        ) : /** @type {any[]} */ (queues).map((/** @type {any} */ q) => (
          <div key={q.id} onClick={() => navigate(`/queues/${q.id}`)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{q.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{q.strategy}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Wait: {q.max_wait_seconds}s</span>
              <span>Wrap: {q.wrapup_seconds}s</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Create Queue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Sales Queue" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Strategy</label>
                <select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="LONGEST_IDLE">Longest Idle</option>
                  <option value="SKILLS_BASED">Skills Based</option>
                  <option value="RING_ALL">Ring All</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Wait: {form.max_wait_seconds}s</label>
                <input type="range" min={30} max={600} step={30} value={form.max_wait_seconds}
                  onChange={(e) => setForm({ ...form, max_wait_seconds: parseInt(e.target.value) })} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Wrap-up: {form.wrapup_seconds}s</label>
                <input type="range" min={5} max={60} step={5} value={form.wrapup_seconds}
                  onChange={(e) => setForm({ ...form, wrapup_seconds: parseInt(e.target.value) })} className="w-full accent-primary-600" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 font-semibold transition-colors">Cancel</button>
              <button onClick={() => handleCreate()} disabled={!form.name}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl py-2.5 font-semibold transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreativeWorkQueue() {
  const { data = [], isLoading, isFetching, refetch } = useGetCreativeWorkOrdersQuery(
    { status: 'SUBMITTED,ASSIGNED,IN_PROGRESS,DELIVERED,CHANGE_REQUESTED', limit: 25 },
    { pollingInterval: 15000 }
  );
  const [updateWorkOrder, updateState] = useUpdateCreativeWorkOrderMutation();
  const [forms, setForms] = useState({});
  const orders = normalizeCreativeWorkOrders(data);

  const formFor = (order) => forms[creativeWorkOrderId(order)] || {};
  const updateForm = (order, patch) => {
    const id = creativeWorkOrderId(order);
    setForms((current) => ({ ...current, [id]: { ...(current[id] || {}), ...patch } }));
  };
  const changeStatus = async (order, status) => {
    const id = creativeWorkOrderId(order);
    if (!id) return;
    const form = formFor(order);
    try {
      await updateWorkOrder({
        workOrderId: id,
        status,
        assignedTo: form.assignedTo || undefined,
        reviewerNotes: form.reviewerNotes || undefined,
        deliveryPayload: status === 'DELIVERED' ? deliveryPayloadFor(order, form) : undefined,
      }).unwrap();
      refetch();
    } catch (/** @type {any} */ error) {
      alert(error?.data?.message || error?.message || 'Could not update creative work order');
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">Creative Work Queue</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">{orders.length} screenplay review or editing job{orders.length === 1 ? '' : 's'}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">No creative work is waiting right now</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const id = creativeWorkOrderId(order);
              const form = formFor(order);
              const status = String(order.status || '').toUpperCase();
              const workType = String(order.workType || order.work_type || '').toUpperCase();
              const Icon = workType === 'EDITING_JOB' ? Film : FileText;
              const sourceUrl = sourceFinalClip(order);
              return (
                <div key={id} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.75fr)_auto] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-[11px] font-bold uppercase text-primary-700">
                        <Icon className="h-3.5 w-3.5" /> {creativeWorkTypeLabel(workType)}
                      </span>
                      <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase ${creativeStatusClass(status)}`}>
                        {creativeStatusLabel(status)}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-bold text-slate-900">{order.title || 'Untitled creative job'}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{order.description || order.requesterNotes || 'No description provided.'}</p>
                    {sourceUrl && (
                      <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-primary-700 hover:text-primary-800">
                        Download source assets
                      </a>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <input
                      value={form.assignedTo || order.assignedTo || ''}
                      onChange={(event) => updateForm(order, { assignedTo: event.target.value })}
                      placeholder="Reviewer or editor name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <textarea
                      value={form.reviewerNotes || ''}
                      onChange={(event) => updateForm(order, { reviewerNotes: event.target.value })}
                      rows={2}
                      placeholder={workType === 'EDITING_JOB' ? 'Editing notes, asset notes, revision summary' : 'Improved script notes and review summary'}
                      className="min-h-[4.5rem] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      value={form.deliveryUrl || ''}
                      onChange={(event) => updateForm(order, { deliveryUrl: event.target.value })}
                      placeholder={workType === 'EDITING_JOB' ? 'Edited video URL' : 'Improved screenplay URL'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 xl:w-44 xl:flex-col">
                    <button
                      type="button"
                      onClick={() => changeStatus(order, 'ASSIGNED')}
                      disabled={updateState.isLoading || status === 'ASSIGNED'}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                      <Users className="h-3.5 w-3.5" /> Claim
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(order, 'IN_PROGRESS')}
                      disabled={updateState.isLoading || status === 'IN_PROGRESS'}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" /> Start
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(order, 'DELIVERED')}
                      disabled={updateState.isLoading || !form.deliveryUrl}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:bg-slate-300"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Deliver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function normalizeCreativeWorkOrders(response) {
  if (Array.isArray(response)) return response;
  return [response?.workOrders, response?.items, response?.content, response?.data].find(Array.isArray) || [];
}

function creativeWorkOrderId(order = {}) {
  return order.workOrderId || order.work_order_id || order.id;
}

function creativeWorkTypeLabel(workType = '') {
  return workType === 'EDITING_JOB' ? 'Editing job' : 'Screenplay review';
}

function creativeStatusLabel(status = '') {
  return String(status || 'SUBMITTED').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function creativeStatusClass(status = '') {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'DELIVERED') return 'bg-emerald-50 text-emerald-700';
  if (normalized === 'CHANGE_REQUESTED') return 'bg-amber-50 text-amber-700';
  if (normalized === 'IN_PROGRESS') return 'bg-blue-50 text-blue-700';
  if (normalized === 'ASSIGNED') return 'bg-violet-50 text-violet-700';
  return 'bg-slate-100 text-slate-600';
}

function sourceFinalClip(order = {}) {
  const source = order.sourcePayload || order.source_payload || {};
  return source.finalClipUrl
    || source.final_clip_url
    || source.videoRun?.finalVideoUrl
    || source.videoRun?.final_video_url
    || source.videoRun?.finalUrl
    || source.videoRun?.final_url
    || '';
}

function deliveryPayloadFor(order = {}, form = {}) {
  const workType = String(order.workType || order.work_type || '').toUpperCase();
  const payload = {
    reviewerNotes: form.reviewerNotes || '',
    deliveredAt: new Date().toISOString(),
  };
  if (workType === 'EDITING_JOB') {
    payload.editedVideoUrl = form.deliveryUrl || '';
    payload.assetNotes = form.reviewerNotes || '';
  } else {
    payload.improvedScreenplayUrl = form.deliveryUrl || '';
    payload.scriptReviewNotes = form.reviewerNotes || '';
  }
  return payload;
}

function QueueDetail() {
  const { id } = useParams();
  const queueId = /** @type {string} */ (id);
  const tenantId = useSelector(selectTenantId);
  const navigate = useNavigate();
  const { data: queue } = useGetQueueQuery(queueId);
  const { data: stats } = useGetQueueStatsQuery(queueId);
  const { data: members = [], refetch: refetchMembers } = useGetQueueMembersQuery(queueId);
  const { data: allAgents = [] } = useListAgentsQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [addMember] = useAddQueueMemberMutation();
  const [removeMember] = useRemoveQueueMemberMutation();
  const [tab, setTab] = useState('members');

  const memberIds = /** @type {any[]} */ (members).map((/** @type {any} */ m) => m.agent_id || m.id);
  const availableAgents = /** @type {any[]} */ (allAgents).filter((/** @type {any} */ a) => !memberIds.includes(a.id));

  if (!queue) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/queues')} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{/** @type {any} */ (queue).name}</h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{/** @type {any} */ (queue).strategy}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QStat label="Waiting" value={/** @type {any} */ (stats).waiting || 0} />
          <QStat label="Avg Wait" value={`${/** @type {any} */ (stats).avg_wait_seconds || 0}s`} />
          <QStat label="SLA" value={`${/** @type {any} */ (stats).sla_percent || 0}%`} />
          <QStat label="Agents" value={/** @type {any} */ (stats).agents_available || 0} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {[{ id: 'members', label: 'Members', icon: Users }, { id: 'performance', label: 'Performance', icon: BarChart3 }].map((/** @type {any} */ t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
        {tab === 'members' && (
          <div className="space-y-4">
            {/* Add member */}
            {availableAgents.length > 0 && (
              <div className="flex items-center gap-3">
                <select id="add-agent" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Add agent to queue...</option>
                  {availableAgents.map((/** @type {any} */ a) => <option key={a.id} value={a.id}>{a.display_name} ({a.extension})</option>)}
                </select>
                <button onClick={async () => {
                  const sel = /** @type {HTMLSelectElement} */ (document.getElementById('add-agent'));
                  if (sel.value) { await addMember({ queueId, agent_id: sel.value, priority: 5 }); refetchMembers(); sel.value = ''; }
                }} className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2.5 font-semibold transition-colors flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Add
                </button>
              </div>
            )}

            {/* Member list */}
            {/** @type {any[]} */ (members).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No members yet</p>
            ) : (
              <div className="space-y-2">
                {/** @type {any[]} */ (members).map((/** @type {any} */ m) => (
                  <div key={m.agent_id || m.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.agent_name || m.display_name || m.agent_id}</p>
                      <p className="text-xs text-slate-400">Priority: {m.priority || 5}</p>
                    </div>
                    <button onClick={() => { removeMember({ queueId: /** @type {string} */ (id), agentId: m.agent_id || m.id }); refetchMembers(); }}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'performance' && (
          <div className="text-center py-12 text-slate-400 text-sm">Historical queue performance charts — coming next</div>
        )}
      </div>
    </div>
  );
}

/** @param {{ label: string, value: string|number }} props */
function QStat({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
