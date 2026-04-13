import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  useListRoutingPoliciesQuery, useCreateRoutingPolicyMutation,
  useDeleteRoutingPolicyMutation, useListIvrFlowsQuery,
} from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import { GitBranch, Plus, Trash2, ArrowUp, ArrowDown, Workflow } from 'lucide-react';

export default function Routing() {
  const tenantId = useSelector(selectTenantId);
  const [tab, setTab] = useState('policies');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Routing</h1>
        <p className="text-sm text-slate-500 mt-1">Call routing policies and IVR flows</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {[{ id: 'policies', label: 'Routing Policies', icon: GitBranch },
          { id: 'ivr', label: 'IVR Flows', icon: Workflow }].map((/** @type {any} */ t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'policies' && <PoliciesTab tenantId={tenantId} />}
      {tab === 'ivr' && <IvrTab tenantId={tenantId} />}
    </div>
  );
}

/** @param {{ tenantId: string|null }} props */
function PoliciesTab({ tenantId }) {
  const { data: policies = [] } = useListRoutingPoliciesQuery(
    tenantId ? { tenantId } : /** @type {any} */ (undefined),
    { skip: !tenantId }
  );
  const [createPolicy] = useCreateRoutingPolicyMutation();
  const [deletePolicy] = useDeleteRoutingPolicyMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', match_type: 'DID', match_value: '', action_type: 'QUEUE', action_target: '', priority: 10 });

  const handleCreate = async () => {
    if (!tenantId) return;
    await createPolicy({
      tenant_id: tenantId,
      subscription_id: tenantId,
      name: form.name || `${form.match_type}-${form.action_type}-${form.priority}`,
      match_type: form.match_type,
      match_value: form.match_value,
      action_type: form.action_type,
      action_target: form.action_target,
      priority: form.priority,
    });
    setShowCreate(false);
    setForm({ name: '', match_type: 'DID', match_value: '', action_type: 'QUEUE', action_target: '', priority: 10 });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        {/** @type {any[]} */ (policies).length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <GitBranch className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            No routing policies configured
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Priority', 'Match Type', 'Match Value', 'Action', 'Target', ''].map((/** @type {string} */ h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/** @type {any[]} */ (policies).map((/** @type {any} */ p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-mono text-slate-700">{p.priority}</td>
                  <td className="px-6 py-3"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{p.match_type}</span></td>
                  <td className="px-6 py-3 text-sm text-slate-700">{p.match_value || '*'}</td>
                  <td className="px-6 py-3"><span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold">{p.action}</span></td>
                  <td className="px-6 py-3 text-sm text-slate-600">{p.target}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deletePolicy(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Add Routing Policy</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Match Type</label>
                  <select value={form.match_type} onChange={(e) => setForm({ ...form, match_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="DID">DID Number</option>
                    <option value="CALLER_ID">Caller ID</option>
                    <option value="TIME">Time-based</option>
                    <option value="ALL">Match All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Match Value</label>
                  <input type="text" value={form.match_value} onChange={(e) => setForm({ ...form, match_value: e.target.value })}
                    placeholder="*" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Action</label>
                  <select value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="QUEUE">Route to Queue</option>
                    <option value="AGENT">Route to Agent</option>
                    <option value="IVR">Route to IVR</option>
                    <option value="BOT">Route to Bot</option>
                    <option value="EXTERNAL">Route External</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target</label>
                  <input type="text" value={form.action_target} onChange={(e) => setForm({ ...form, action_target: e.target.value })}
                    placeholder="sales_queue" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority: {form.priority}</label>
                <input type="range" min={1} max={100} value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                  className="w-full accent-primary-600" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 font-semibold transition-colors">Cancel</button>
              <button onClick={() => handleCreate()} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 font-semibold transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** @param {{ tenantId: string|null }} props */
function IvrTab({ tenantId }) {
  const { data: flows = [] } = useListIvrFlowsQuery(
    tenantId ? { tenantId } : /** @type {any} */ (undefined),
    { skip: !tenantId }
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">
      {/** @type {any[]} */ (flows).length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <Workflow className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No IVR flows configured — visual IVR builder coming soon
        </div>
      ) : (
        <div className="space-y-3">
          {/** @type {any[]} */ (flows).map((/** @type {any} */ f) => (
            <div key={f.id} className="border border-slate-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-900">{f.name}</p>
              <p className="text-xs text-slate-400">{f.node_count || '?'} nodes</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
