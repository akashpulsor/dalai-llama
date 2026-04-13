import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAgentMutation, useListQueuesQuery } from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import { useSelector } from 'react-redux';
import { selectTenantId, selectFeatures } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  ArrowLeft, ArrowRight, Check, User, Layers, ClipboardCheck,
  Copy, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';

const STEPS = ['Basic Info', 'Queue Assignment', 'Review & Create'];

export default function CreateAgentWizard() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
  const features = useSelector(selectFeatures);
  const [createAgent, { isLoading }] = useCreateAgentMutation();
  const { data: queues = [] } = useListQueuesQuery(undefined);

  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState(/** @type {any} */ (null));

  const [form, setForm] = useState({
    display_name: '',
    email: '',
    extension: '',
    username: '',
    role: 'AGENT',
    skills: /** @type {string[]} */ ([]),
    selectedQueues: /** @type {Array<{queue_id: string, priority: number}>} */ ([]),
  });

  const [skillInput, setSkillInput] = useState('');

  const updateField = (/** @type {string} */ key, /** @type {any} */ value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'extension' && !form.username) {
      setForm((prev) => ({ ...prev, username: value }));
    }
  };

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !form.skills.includes(s)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
      setSkillInput('');
    }
  };

  const removeSkill = (/** @type {string} */ skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((/** @type {string} */ s) => s !== skill) }));
  };

  const toggleQueue = (/** @type {string} */ queueId) => {
    setForm((prev) => {
      const exists = prev.selectedQueues.find((/** @type {any} */ q) => q.queue_id === queueId);
      if (exists) {
        return { ...prev, selectedQueues: prev.selectedQueues.filter((/** @type {any} */ q) => q.queue_id !== queueId) };
      }
      return { ...prev, selectedQueues: [...prev.selectedQueues, { queue_id: queueId, priority: 5 }] };
    });
  };

  const setQueuePriority = (/** @type {string} */ queueId, /** @type {number} */ priority) => {
    setForm((prev) => ({
      ...prev,
      selectedQueues: prev.selectedQueues.map((/** @type {any} */ q) =>
        q.queue_id === queueId ? { ...q, priority } : q
      ),
    }));
  };

  const canNext = () => {
    if (step === 0) return form.display_name && form.email && form.extension;
    return true;
  };

  const handleCreate = async () => {
    try {
      const res = await createAgent({
        display_name: form.display_name,
        email: form.email,
        extension: form.extension,
        username: form.username || form.extension,
        role: form.role,
        skills: form.skills,
      }).unwrap();
      setResult(res);
      setStep(3); // Success step
    } catch (/** @type {any} */ err) {
      alert(`Failed to create agent: ${err?.data?.message || err?.message || 'Unknown error'}`);
    }
  };

  // Success view
  if (step === 3 && result) {
    const agent = result.agent || result;
    const sipPassword = result.sip_password;
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Agent Created</h2>
          <p className="text-sm text-slate-500 mb-6">{agent.display_name} is ready to log in</p>

          {/* SIP Credentials */}
          {sipPassword && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">One-time SIP credentials</p>
              </div>
              <p className="text-xs text-amber-700 mb-3">This password is shown only once. Agent can regenerate via their profile.</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500">Extension</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{agent.extension}</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500">SIP Password</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {showPassword ? sipPassword : '••••••••••••'}
                    </span>
                    <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(sipPassword)} className="text-slate-400 hover:text-slate-600">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate('/agents')}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 font-semibold transition-colors">
              Back to Agents
            </button>
            <button onClick={() => { setStep(0); setForm({ display_name: '', email: '', extension: '', username: '', role: 'AGENT', skills: [], selectedQueues: [] }); setResult(null); }}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 font-semibold transition-colors">
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate('/agents')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Agents
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Agent</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((/** @type {string} */ s, /** @type {number} */ i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-primary-600 text-white' :
              i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-primary-700' : 'text-slate-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-slate-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Display Name *</label>
                <input type="text" value={form.display_name} onChange={(e) => updateField('display_name', e.target.value)}
                  placeholder="Priya Sharma" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
                  placeholder="priya@acme.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Extension *</label>
                <input type="text" value={form.extension} onChange={(e) => updateField('extension', e.target.value)}
                  placeholder="1001" maxLength={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                <input type="text" value={form.username} onChange={(e) => updateField('username', e.target.value)}
                  placeholder="Auto from extension" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role *</label>
                <select value={form.role} onChange={(e) => updateField('role', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="AGENT">Agent</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skills</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Type a skill and press Enter" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={() => addSkill()} className="bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl px-4 py-2 text-sm font-semibold transition-colors">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((/** @type {string} */ s) => (
                  <span key={s} className="bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-primary-400 hover:text-primary-600">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Queue Assignment */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-slate-900">Queue Assignment</h2>
            </div>
            <p className="text-sm text-slate-500">Select queues this agent should be assigned to. You can set this later.</p>

            {/** @type {any[]} */ (queues).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No queues configured yet</div>
            ) : (
              <div className="space-y-2">
                {/** @type {any[]} */ (queues).map((/** @type {any} */ q) => {
                  const selected = form.selectedQueues.find((/** @type {any} */ sq) => sq.queue_id === q.id);
                  return (
                    <div key={q.id} className={`border rounded-xl p-4 transition-colors ${selected ? 'border-primary-300 bg-primary-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input type="checkbox" checked={!!selected} onChange={() => toggleQueue(q.id)}
                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{q.name}</p>
                            <p className="text-xs text-slate-400">{q.strategy}</p>
                          </div>
                        </label>
                        {selected && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 uppercase">Priority</span>
                            <input type="range" min="1" max="10" value={selected.priority}
                              onChange={(e) => setQueuePriority(q.id, parseInt(e.target.value))}
                              className="w-20 accent-primary-600" />
                            <span className="text-xs font-mono text-slate-700 w-4">{selected.priority}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-slate-900">Review & Create</h2>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <ReviewRow label="Name" value={form.display_name} />
              <ReviewRow label="Email" value={form.email} />
              <ReviewRow label="Extension" value={form.extension} />
              <ReviewRow label="Username" value={form.username || form.extension} />
              <ReviewRow label="Role" value={form.role} />
              <ReviewRow label="Skills" value={form.skills.length > 0 ? form.skills.join(', ') : 'None'} />
              <ReviewRow label="Queues" value={form.selectedQueues.length > 0
                ? form.selectedQueues.map((/** @type {any} */ q) => {
                    const queue = /** @type {any[]} */ (queues).find((/** @type {any} */ qq) => qq.id === q.queue_id);
                    return `${queue?.name || q.queue_id} (p${q.priority})`;
                  }).join(', ')
                : 'None'} />
            </div>

            <p className="text-xs text-slate-400">
              A Keycloak user will be created in your tenant realm. The agent will log in with their email
              and set a password on first login. SIP credentials are auto-generated.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/agents')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 2 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext()}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl px-6 py-2.5 font-semibold transition-colors flex items-center gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleCreate()} disabled={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl px-6 py-2.5 font-semibold transition-colors flex items-center gap-2">
              {isLoading ? 'Creating...' : 'Create Agent'} <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-900 font-medium">{value}</span>
    </div>
  );
}
