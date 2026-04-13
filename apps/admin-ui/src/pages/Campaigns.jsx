import { useState, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  useListCampaignsQuery, useCreateCampaignMutation, useGetCampaignQuery,
  useStartCampaignMutation, usePauseCampaignMutation, useResumeCampaignMutation,
  useCancelCampaignMutation, useImportContactsMutation, useGetContactStatsQuery,
  useListBotsQuery, useListQueuesQuery,
} from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import {
  Megaphone, Plus, Play, Pause, Square, ArrowLeft, ArrowRight, Upload,
  Users, BarChart3, Clock, CheckCircle, XCircle, AlertTriangle,
  Bot, Phone, Settings, Zap, Calendar, Check, Layers,
} from 'lucide-react';

const STATUS_STYLE = {
  DRAFT:     { label: 'Draft',     bg: 'bg-slate-100',   text: 'text-slate-600' },
  RUNNING:   { label: 'Running',   bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  PAUSED:    { label: 'Paused',    bg: 'bg-amber-50',    text: 'text-amber-700' },
  COMPLETED: { label: 'Completed', bg: 'bg-blue-50',     text: 'text-blue-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50',      text: 'text-red-700' },
};

export default function Campaigns() {
  return (
    <Routes>
      <Route index element={<CampaignList />} />
      <Route path="new" element={<CreateCampaignWizard />} />
      <Route path=":id" element={<CampaignDetail />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════
// CAMPAIGN LIST
// ═══════════════════════════════════════════════════════════

function CampaignList() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
  const { data: campaigns = [], isLoading } = useListCampaignsQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [startCampaign] = useStartCampaignMutation();
  const [pauseCampaign] = usePauseCampaignMutation();
  const [resumeCampaign] = useResumeCampaignMutation();
  const [cancelCampaign] = useCancelCampaignMutation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Outbound dialer campaigns</p>
        </div>
        <button onClick={() => navigate('/campaigns/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Create Campaign
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : /** @type {any[]} */ (campaigns).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Megaphone className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No campaigns yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Campaign', 'Type', 'Bot', 'Status', 'Progress', 'Contacts', 'Actions'].map((/** @type {string} */ h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/** @type {any[]} */ (campaigns).map((/** @type {any} */ c) => {
                const st = /** @type {any} */ (STATUS_STYLE[/** @type {keyof typeof STATUS_STYLE} */ (c.status)] || STATUS_STYLE.DRAFT);
                const progress = c.totalContacts > 0 ? Math.round(((c.contactsCompleted || 0) / c.totalContacts) * 100) : 0;
                return (
                  <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}`)}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.outboundCallerId || c.didNumber || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{c.campaignType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{c.bot?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      {c.contactsCompleted || 0}/{c.totalContacts || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {c.status === 'DRAFT' && <ActBtn icon={Play} label="Start" color="emerald" onClick={() => startCampaign(c.id)} />}
                        {c.status === 'RUNNING' && <ActBtn icon={Pause} label="Pause" color="amber" onClick={() => pauseCampaign(c.id)} />}
                        {c.status === 'PAUSED' && <ActBtn icon={Play} label="Resume" color="emerald" onClick={() => resumeCampaign(c.id)} />}
                        {['RUNNING', 'PAUSED'].includes(c.status) && <ActBtn icon={Square} label="Cancel" color="red" onClick={() => cancelCampaign(c.id)} />}
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

// ═══════════════════════════════════════════════════════════
// CREATE CAMPAIGN WIZARD — matches Campaign entity exactly
// ═══════════════════════════════════════════════════════════

const WIZARD_STEPS = ['Basic Info', 'Bot & DID', 'Dialer Config', 'Schedule', 'Review'];

function CreateCampaignWizard() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();
  const { data: bots = [] } = useListBotsQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const { data: queues = [] } = useListQueuesQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const activeBots = /** @type {any[]} */ (bots).filter((/** @type {any} */ b) => b.is_active || b.active);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    // Step 0: Basic
    name: '',
    description: '',
    campaignType: 'OUTBOUND',
    // Step 1: Bot & DID
    botId: '',
    didNumber: '',
    outboundCallerId: '',
    queueId: '',
    afterHoursAction: 'VOICEMAIL',
    // Step 2: Dialer
    dialerMode: 'PROGRESSIVE',
    pacingRatio: 1.0,
    maxConcurrentCalls: 5,
    maxAttemptsPerContact: 3,
    retryDelayMinutes: 60,
    amdEnabled: false,
    amdAction: 'HANGUP',
    // Step 3: Schedule
    timezone: 'Asia/Kolkata',
    startDate: '',
    endDate: '',
    maxDailyCalls: 500,
    maxTotalCalls: 10000,
  });

  const u = (/** @type {string} */ k, /** @type {any} */ v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!tenantId) return;
    try {
      await createCampaign({
        tenantId,
        subscriptionId: tenantId,
        name: form.name,
        description: form.description,
        campaignType: form.campaignType,
        bot: form.botId ? { id: form.botId } : undefined,
        didNumber: form.didNumber,
        outboundCallerId: form.outboundCallerId,
        queueId: form.queueId || undefined,
        afterHoursAction: form.afterHoursAction,
        dialerMode: form.dialerMode,
        pacingRatio: form.pacingRatio,
        maxConcurrentCalls: form.maxConcurrentCalls,
        maxAttemptsPerContact: form.maxAttemptsPerContact,
        retryDelayMinutes: form.retryDelayMinutes,
        amdEnabled: form.amdEnabled,
        amdAction: form.amdAction,
        timezone: form.timezone,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        maxDailyCalls: form.maxDailyCalls,
        maxTotalCalls: form.maxTotalCalls,
      }).unwrap();
      navigate('/campaigns');
    } catch (/** @type {any} */ e) { alert(e?.data?.message || 'Failed'); }
  };

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return !!form.botId;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/campaigns')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </button>
      <h1 className="text-2xl font-bold text-slate-900">Create Campaign</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {WIZARD_STEPS.map((/** @type {string} */ s, /** @type {number} */ i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600' : 'bg-slate-100 text-slate-400'
            }`}>{i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}</div>
            <span className={`text-[10px] font-medium hidden lg:inline ${i === step ? 'text-primary-700' : 'text-slate-400'}`}>{s}</span>
            {i < WIZARD_STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Megaphone className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-slate-900">Basic Info</h2></div>
            <Inp label="Campaign Name *" value={form.name} onChange={(/** @type {string} */ v) => u('name', v)} placeholder="Q1 Sales Outreach" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => u('description', e.target.value)} rows={3}
                placeholder="Target SMBs in Maharashtra for enterprise plan upsell..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Campaign Type</label>
              <select value={form.campaignType} onChange={(e) => u('campaignType', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="OUTBOUND">Outbound (Bot dials contacts)</option>
                <option value="INBOUND">Inbound (Route to bot/queue)</option>
                <option value="BLENDED">Blended (Both directions)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Bot & DID */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Bot className="w-5 h-5 text-violet-600" /><h2 className="font-bold text-slate-900">Bot & Numbers</h2></div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bot *</label>
              <select value={form.botId} onChange={(e) => u('botId', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select bot...</option>
                {activeBots.map((/** @type {any} */ b) => <option key={b.id} value={b.id}>{b.name} ({b.language})</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">Bot handles the initial conversation. Escalation intents route to queues/agents.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Inp label="DID Number" value={form.didNumber} onChange={(/** @type {string} */ v) => u('didNumber', v)} placeholder="+919876543210" />
              <Inp label="Outbound Caller ID" value={form.outboundCallerId} onChange={(/** @type {string} */ v) => u('outboundCallerId', v)} placeholder="+919876543210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fallback Queue (when bot escalates)</label>
              <select value={form.queueId} onChange={(e) => u('queueId', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">No default queue (use bot escalation rules)</option>
                {/** @type {any[]} */ (queues).map((/** @type {any} */ q) => <option key={q.id} value={q.id}>{q.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">After Hours Action</label>
              <select value={form.afterHoursAction} onChange={(e) => u('afterHoursAction', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="VOICEMAIL">Voicemail</option>
                <option value="BOT">Route to After-Hours Bot</option>
                <option value="HANGUP">Hang Up</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Dialer Config */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Settings className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-slate-900">Dialer Configuration</h2></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dialer Mode</label>
                <select value={form.dialerMode} onChange={(e) => u('dialerMode', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="PREVIEW">Preview (agent reviews before dial)</option>
                  <option value="PROGRESSIVE">Progressive (auto-dial when agent free)</option>
                  <option value="PREDICTIVE">Predictive (over-dial based on stats)</option>
                  <option value="POWER">Power (fixed ratio)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pacing Ratio: {form.pacingRatio}x</label>
                <input type="range" min={0.5} max={3.0} step={0.1} value={form.pacingRatio}
                  onChange={(e) => u('pacingRatio', parseFloat(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Concurrent Calls: {form.maxConcurrentCalls}</label>
                <input type="range" min={1} max={20} value={form.maxConcurrentCalls}
                  onChange={(e) => u('maxConcurrentCalls', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Attempts Per Contact: {form.maxAttemptsPerContact}</label>
                <input type="range" min={1} max={5} value={form.maxAttemptsPerContact}
                  onChange={(e) => u('maxAttemptsPerContact', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Retry Delay: {form.retryDelayMinutes} min</label>
                <input type="range" min={15} max={240} step={15} value={form.retryDelayMinutes}
                  onChange={(e) => u('retryDelayMinutes', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
            </div>
            {/* AMD */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Answering Machine Detection</p>
                <p className="text-xs text-slate-400">Detect voicemail/IVR before connecting to bot</p>
              </div>
              <button onClick={() => u('amdEnabled', !form.amdEnabled)} className="transition-colors">
                {form.amdEnabled
                  ? <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" /></div>
                  : <div className="w-10 h-6 bg-slate-300 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full" /></div>
                }
              </button>
            </div>
            {form.amdEnabled && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">AMD Action</label>
                <select value={form.amdAction} onChange={(e) => u('amdAction', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="HANGUP">Hang Up</option>
                  <option value="VOICEMAIL">Leave Voicemail</option>
                  <option value="CONTINUE">Continue (connect to bot anyway)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-slate-900">Schedule & Limits</h2></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Timezone</label>
                <select value={form.timezone} onChange={(e) => u('timezone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
              <div />
              <Inp label="Start Date" value={form.startDate} onChange={(/** @type {string} */ v) => u('startDate', v)} placeholder="2026-04-01" />
              <Inp label="End Date" value={form.endDate} onChange={(/** @type {string} */ v) => u('endDate', v)} placeholder="2026-04-30" />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Daily Calls: {form.maxDailyCalls}</label>
                <input type="range" min={50} max={5000} step={50} value={form.maxDailyCalls}
                  onChange={(e) => u('maxDailyCalls', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Total Calls: {form.maxTotalCalls}</label>
                <input type="range" min={100} max={100000} step={100} value={form.maxTotalCalls}
                  onChange={(e) => u('maxTotalCalls', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Check className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Review & Create</h2></div>
            <div className="bg-slate-50 rounded-xl p-5 space-y-2.5 text-sm">
              <RR label="Name" value={form.name} />
              <RR label="Type" value={form.campaignType} />
              <RR label="Bot" value={activeBots.find((/** @type {any} */ b) => b.id === form.botId)?.name || '—'} />
              <RR label="Caller ID" value={form.outboundCallerId || form.didNumber || '—'} />
              <RR label="Dialer" value={`${form.dialerMode} · ${form.maxConcurrentCalls} concurrent · ${form.maxAttemptsPerContact} attempts`} />
              <RR label="AMD" value={form.amdEnabled ? `Enabled → ${form.amdAction}` : 'Disabled'} />
              <RR label="Schedule" value={form.startDate ? `${form.startDate} → ${form.endDate || '∞'}` : 'No schedule'} />
              <RR label="Limits" value={`${form.maxDailyCalls}/day · ${form.maxTotalCalls} total`} />
              <RR label="Timezone" value={form.timezone} />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-700"><strong>Next step:</strong> After creating, import contacts via CSV then click Start to begin dialing.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/campaigns')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext()}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl px-6 py-2.5 font-semibold transition-colors flex items-center gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleCreate()} disabled={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl px-6 py-2.5 font-semibold transition-colors flex items-center gap-2">
              {isLoading ? 'Creating...' : 'Create Campaign'} <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CAMPAIGN DETAIL — stats + contact import + live progress
// ═══════════════════════════════════════════════════════════

function CampaignDetail() {
  const { id } = useParams();
  const campaignId = /** @type {string} */ (id);
  const tenantId = useSelector(selectTenantId);
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useGetCampaignQuery(campaignId);
  const { data: stats } = useGetContactStatsQuery(campaignId);
  const [importContacts] = useImportContactsMutation();
  const [startCampaign] = useStartCampaignMutation();
  const [pauseCampaign] = usePauseCampaignMutation();
  const [resumeCampaign] = useResumeCampaignMutation();
  const [cancelCampaign] = useCancelCampaignMutation();
  const fileRef = /** @type {import('react').MutableRefObject<HTMLInputElement|null>} */ (useRef(null));

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !tenantId) return;
    const text = await file.text();
    const lines = text.split('\n').filter((/** @type {string} */ l) => l.trim());
    const contacts = lines.slice(1).map((/** @type {string} */ line) => {
      const [phone_number, name, company] = line.split(',').map((/** @type {string} */ s) => s.trim());
      return { phone_number, name, company };
    }).filter((/** @type {any} */ c) => c.phone_number);
    await importContacts({ campaignId, tenant_id: tenantId, contacts });
    alert(`Imported ${contacts.length} contacts`);
  };

  if (isLoading || !campaign) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const c = /** @type {any} */ (campaign);
  const st = /** @type {any} */ (STATUS_STYLE[/** @type {keyof typeof STATUS_STYLE} */ (c.status)] || STATUS_STYLE.DRAFT);
  const progress = c.totalContacts > 0 ? Math.round(((c.contactsCompleted || 0) / c.totalContacts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/campaigns')} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{c.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
              <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{c.campaignType}</span>
              <span className="text-xs text-slate-400">{c.dialerMode} dialer</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {c.status === 'DRAFT' && <ActBtn icon={Play} label="Start" color="emerald" onClick={() => startCampaign(campaignId)} />}
          {c.status === 'RUNNING' && <ActBtn icon={Pause} label="Pause" color="amber" onClick={() => pauseCampaign(campaignId)} />}
          {c.status === 'PAUSED' && <ActBtn icon={Play} label="Resume" color="emerald" onClick={() => resumeCampaign(campaignId)} />}
          {['RUNNING', 'PAUSED'].includes(c.status) && <ActBtn icon={Square} label="Cancel" color="red" onClick={() => cancelCampaign(campaignId)} />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Progress</span>
          <span className="text-sm font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>{c.contactsDialed || 0} dialed</span>
          <span>{c.contactsConnected || 0} connected</span>
          <span>{c.contactsCompleted || 0} completed</span>
          <span>{c.totalContacts || 0} total</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total" value={/** @type {any} */ (stats)?.total || c.totalContacts || 0} />
        <StatCard icon={Clock} label="Pending" value={/** @type {any} */ (stats)?.pending || 0} />
        <StatCard icon={CheckCircle} label="Completed" value={/** @type {any} */ (stats)?.completed || c.contactsCompleted || 0} color="text-emerald-600" />
        <StatCard icon={XCircle} label="Failed" value={/** @type {any} */ (stats)?.failed || 0} color="text-red-600" />
        <StatCard icon={AlertTriangle} label="DNC Skipped" value={/** @type {any} */ (stats)?.dnc_skipped || 0} color="text-amber-600" />
      </div>

      {/* Campaign config summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dialer Settings</h3>
          <div className="space-y-2">
            <CfgRow label="Mode" value={c.dialerMode} />
            <CfgRow label="Concurrent" value={c.maxConcurrentCalls} />
            <CfgRow label="Attempts" value={`${c.maxAttemptsPerContact}/contact`} />
            <CfgRow label="Retry Delay" value={`${c.retryDelayMinutes} min`} />
            <CfgRow label="AMD" value={c.amdEnabled ? c.amdAction : 'Off'} />
            <CfgRow label="Caller ID" value={c.outboundCallerId || c.didNumber || '—'} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Schedule</h3>
          <div className="space-y-2">
            <CfgRow label="Timezone" value={c.timezone} />
            <CfgRow label="Start" value={c.startDate || 'Not set'} />
            <CfgRow label="End" value={c.endDate || 'Not set'} />
            <CfgRow label="Daily Limit" value={c.maxDailyCalls || '—'} />
            <CfgRow label="Total Limit" value={c.maxTotalCalls || '—'} />
            <CfgRow label="Bot" value={c.bot?.name || '—'} />
          </div>
        </div>
      </div>

      {/* Import contacts */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Import Contacts</h3>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv" className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          <button onClick={() => handleUpload()} className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">CSV columns: phone_number (required), name, company</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

/** @param {{ label: string, value: string, onChange: (v: string) => void, placeholder?: string }} props */
function Inp({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function RR({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

/** @param {{ label: string, value: any }} props */
function CfgRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-slate-700 font-medium">{value || '—'}</span>
    </div>
  );
}

/** @param {{ icon: import('react').ElementType, label: string, value: number, color?: string }} props */
function StatCard({ icon: Icon, label, value, color = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <Icon className="w-4 h-4 text-slate-400 mb-2" />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/** @param {{ icon: import('react').ElementType, label: string, color: string, onClick: () => void }} props */
function ActBtn({ icon: Icon, label, color, onClick }) {
  const colors = /** @type {Record<string, string>} */ ({
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 hover:bg-red-100',
  });
  return (
    <button onClick={() => onClick()} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${colors[color] || ''}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}