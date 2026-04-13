import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  useListAgentsQuery, useDeleteAgentMutation, useSetAgentStatusMutation,
} from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  Users, Plus, Search, MoreVertical,
  Pencil, Trash2, Key, UserCheck, UserX,
} from 'lucide-react';
import CreateAgentWizard from '../components/CreateAgentWizard.jsx';
import AgentDetail from '../components/AgentDetail.jsx';

const STATUS_CONFIG = /** @type {const} */ ({
  ONLINE:  { label: 'Online',  color: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  ON_CALL: { label: 'On Call', color: 'bg-blue-500',    bg: 'bg-blue-50',     text: 'text-blue-700' },
  BREAK:   { label: 'Break',   color: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700' },
  WRAP_UP: { label: 'Wrap Up', color: 'bg-violet-500',  bg: 'bg-violet-50',   text: 'text-violet-700' },
  OFFLINE: { label: 'Offline', color: 'bg-slate-300',   bg: 'bg-slate-50',    text: 'text-slate-500' },
});

const ROLE_CONFIG = /** @type {const} */ ({
  AGENT:        { label: 'Agent',      bg: 'bg-blue-50',    text: 'text-blue-700' },
  SUPERVISOR:   { label: 'Supervisor', bg: 'bg-purple-50',  text: 'text-purple-700' },
  TENANT_ADMIN: { label: 'Admin',      bg: 'bg-amber-50',   text: 'text-amber-700' },
});

export default function Agents() {
  return (
    <Routes>
      <Route index element={<AgentList />} />
      <Route path="new" element={<CreateAgentWizard />} />
      <Route path=":id" element={<AgentDetail />} />
    </Routes>
  );
}

function AgentList() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
const { data: agents = [], isLoading, refetch } = useListAgentsQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [deleteAgent] = useDeleteAgentMutation();
  const [setStatus] = useSetAgentStatusMutation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [menuOpen, setMenuOpen] = useState(/** @type {string|null} */ (null));

  const filtered = /** @type {any[]} */ (agents).filter((/** @type {any} */ a) => {
    const matchSearch = !search ||
      a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.extension?.includes(search) ||
      a.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || a.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleDelete = async (/** @type {string} */ id, /** @type {string} */ name) => {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return;
    await deleteAgent(id);
    refetch();
  };

  const handleForceStatus = async (/** @type {string} */ id, /** @type {string} */ status) => {
    await setStatus({ id, status });
    setMenuOpen(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={() => navigate('/agents/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Create Agent
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search name, extension, email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="ALL">All Roles</option>
          <option value="AGENT">Agent</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="TENANT_ADMIN">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="ALL">All Status</option>
          <option value="ONLINE">Online</option>
          <option value="ON_CALL">On Call</option>
          <option value="BREAK">Break</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">{search ? 'No agents match' : 'No agents yet'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Agent', 'Extension', 'Role', 'Status', 'Skills', ''].map((/** @type {string} */ h) => (
                  <th key={h} className={`px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((/** @type {any} */ agent) => {
                const st = STATUS_CONFIG[/** @type {keyof typeof STATUS_CONFIG} */ (agent.status)] || STATUS_CONFIG.OFFLINE;
                const rl = ROLE_CONFIG[/** @type {keyof typeof ROLE_CONFIG} */ (agent.role)] || ROLE_CONFIG.AGENT;
                return (
                  <tr key={agent.id} onClick={() => navigate(`/agents/${agent.id}`)}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600">{agent.display_name?.charAt(0)?.toUpperCase() || '?'}</span>
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${st.color} rounded-full border-2 border-white`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{agent.display_name}</p>
                          <p className="text-xs text-slate-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded">{agent.extension}</span></td>
                    <td className="px-6 py-4"><span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${rl.bg} ${rl.text}`}>{rl.label}</span></td>
                    <td className="px-6 py-4"><span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(agent.skills || []).slice(0, 3).map((/** @type {string} */ s, /** @type {number} */ i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {(agent.skills?.length || 0) > 3 && <span className="text-[10px] text-slate-400">+{agent.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === agent.id ? null : agent.id); }}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        {menuOpen === agent.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                              <MBtn icon={Pencil} label="Edit" onClick={() => { setMenuOpen(null); navigate(`/agents/${agent.id}`); }} />
                              <MBtn icon={Key} label="Reset SIP Password" onClick={() => { setMenuOpen(null); alert('TODO: Reset SIP password'); }} />
                              {agent.status === 'ONLINE' && <MBtn icon={UserX} label="Force Break" onClick={() => handleForceStatus(agent.id, 'BREAK')} />}
                              {agent.status !== 'ONLINE' && agent.status !== 'OFFLINE' && <MBtn icon={UserCheck} label="Set Online" onClick={() => handleForceStatus(agent.id, 'ONLINE')} />}
                              <div className="border-t border-slate-100 my-1" />
                              <MBtn icon={Trash2} label="Delete" danger onClick={() => { setMenuOpen(null); handleDelete(agent.id, agent.display_name); }} />
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** @param {{ icon: import('react').ElementType, label: string, onClick: () => void, danger?: boolean }} props */
function MBtn({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50'}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
