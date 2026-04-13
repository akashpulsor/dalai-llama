import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAgentQuery, useUpdateAgentMutation } from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import { ArrowLeft, Save, User, Layers, BarChart3, Phone, Key } from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'queues', label: 'Queues', icon: Layers },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'calls', label: 'Call History', icon: Phone },
];

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useGetAgentQuery(id);
  const [updateAgent, { isLoading: saving }] = useUpdateAgentMutation();
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState(/** @type {any} */ (null));

  // Initialize form when agent loads
  if (agent && !form) {
    setForm({
      display_name: agent.display_name || '',
      email: agent.email || '',
      role: agent.role || 'AGENT',
      skills: agent.skills || [],
    });
  }

  if (isLoading || !agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!form) return;
    await updateAgent({ id: agent.id, ...form });
    alert('Agent updated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/agents')}
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">{agent.display_name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{agent.display_name}</h1>
              <p className="text-xs text-slate-400">Ext. {agent.extension} · {agent.email}</p>
            </div>
          </div>
        </div>
        {activeTab === 'profile' && (
          <button onClick={() => handleSave()} disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map((/** @type {typeof TABS[number]} */ tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">
        {activeTab === 'profile' && form && (
          <div className="space-y-5 max-w-lg">
            <Field label="Display Name" value={form.display_name}
              onChange={(/** @type {string} */ v) => setForm({ ...form, display_name: v })} />
            <Field label="Email" value={form.email}
              onChange={(/** @type {string} */ v) => setForm({ ...form, email: v })} type="email" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="AGENT">Agent</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((/** @type {string} */ s, /** @type {number} */ i) => (
                  <span key={i} className="bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
                <Key className="w-4 h-4" /> Reset SIP Password
              </button>
              <p className="text-xs text-slate-400 mt-1">Agent will need to log in again after reset</p>
            </div>
          </div>
        )}

        {activeTab === 'queues' && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Queue membership management — coming next
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Agent performance analytics — coming next
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Agent call history — coming next
          </div>
        )}
      </div>
    </div>
  );
}

/** @param {{ label: string, value: string, onChange: (v: string) => void, type?: string }} props */
function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
  );
}
