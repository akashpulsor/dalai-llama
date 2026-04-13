import { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  useListBotsQuery, useCreateBotMutation, useUpdateBotMutation,
  useActivateBotMutation, useDisableBotMutation, useGetBotQuery,
  useListBotKnowledgeQuery, useCreateBotKnowledgeMutation, useUpdateBotKnowledgeMutation, useDeleteBotKnowledgeMutation,
  useListBotEscalationQuery, useCreateBotEscalationMutation, useUpdateBotEscalationMutation, useDeleteBotEscalationMutation,
  useListQueuesQuery,
} from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import {
  Bot, Plus, ArrowLeft, ArrowRight, Settings, BookOpen, Zap, FlaskConical,
  ToggleLeft, ToggleRight, Trash2, Save, Check, Pencil, ChevronDown, ChevronUp,
  Mic, Brain, MessageSquare, Shield, Layers,
} from 'lucide-react';

export default function Bots() {
  return (
    <Routes>
      <Route index element={<BotList />} />
      <Route path="new" element={<CreateBotWizard />} />
      <Route path=":id" element={<BotDetail />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════
// BOT LIST — card grid
// ═══════════════════════════════════════════════════════════

function BotList() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
  const { data: bots = [], isLoading } = useListBotsQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [activateBot] = useActivateBotMutation();
  const [disableBot] = useDisableBotMutation();

  const toggleBot = async (/** @type {any} */ bot, /** @type {any} */ e) => {
    e.stopPropagation();
    if (bot.is_active || bot.active) await disableBot(bot.id);
    else await activateBot(bot.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bots</h1>
          <p className="text-sm text-slate-500 mt-1">{/** @type {any[]} */ (bots).length} bot{/** @type {any[]} */ (bots).length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/bots/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Create Bot
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : /** @type {any[]} */ (bots).length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No bots yet — create your first AI bot</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/** @type {any[]} */ (bots).map((/** @type {any} */ bot) => {
            const isActive = bot.is_active || bot.active;
            return (
              <div key={bot.id} onClick={() => navigate(`/bots/${bot.id}`)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-violet-100' : 'bg-slate-100'}`}>
                      <Bot className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{bot.name}</p>
                      <p className="text-[10px] text-slate-400">{bot.language || 'en'} · {bot.voiceProvider || 'default'}</p>
                    </div>
                  </div>
                  <button onClick={(e) => toggleBot(bot, e)}
                    className="text-slate-400 hover:text-primary-600 transition-colors">
                    {isActive ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
                {bot.systemPrompt && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{bot.systemPrompt}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                  {bot.transferType && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{bot.transferType}</span>
                  )}
                  {bot.sentimentTracking && (
                    <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">Sentiment</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CREATE BOT WIZARD — matches BotController.create() exactly
// ═══════════════════════════════════════════════════════════

const WIZARD_STEPS = ['Identity', 'Voice & AI', 'Behavior', 'Escalation', 'Review'];

function CreateBotWizard() {
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
  const [createBot, { isLoading }] = useCreateBotMutation();
  const { data: queues = [] } = useListQueuesQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    // Step 0: Identity
    name: '',
    system_prompt: '',
    greeting_message: 'Hello! How can I help you today?',
    goodbye_message: 'Thank you for calling. Goodbye!',
    guidelines: /** @type {string[]} */ ([]),
    // Step 1: Voice & AI
    voice_provider: 'openai',
    voice_id: 'alloy',
    voice_speed: 1.0,
    language: 'en',
    // Step 2: Behavior
    allowed_intents: /** @type {string[]} */ ([]),
    fallback_message: "I'm sorry, I didn't understand that. Could you rephrase?",
    max_turns: 20,
    max_duration_seconds: 300,
    dtmf_enabled: true,
    barge_in_enabled: true,
    sentiment_tracking: true,
    // Step 3: Escalation
    transfer_target: '',
    transfer_type: 'QUEUE',
    escalation_rules: /** @type {Record<string, any>} */ ({}),
  });

  const [guidelineInput, setGuidelineInput] = useState('');
  const [intentInput, setIntentInput] = useState('');

  const u = (/** @type {string} */ key, /** @type {any} */ val) => setForm((p) => ({ ...p, [key]: val }));

  const addGuideline = () => {
    const v = guidelineInput.trim();
    if (v && !form.guidelines.includes(v)) { u('guidelines', [...form.guidelines, v]); setGuidelineInput(''); }
  };

  const addIntent = () => {
    const v = intentInput.trim().toLowerCase();
    if (v && !form.allowed_intents.includes(v)) { u('allowed_intents', [...form.allowed_intents, v]); setIntentInput(''); }
  };

  const handleCreate = async () => {
    if (!tenantId) return;
    try {
      await createBot({
        tenant_id: tenantId,
        subscription_id: tenantId, // TODO: use actual subscription_id
        ...form,
      }).unwrap();
      navigate('/bots');
    } catch (/** @type {any} */ e) {
      alert(`Failed: ${e?.data?.message || e?.message || 'Unknown error'}`);
    }
  };

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/bots')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Bots
      </button>

      <h1 className="text-2xl font-bold text-slate-900">Create Bot</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {WIZARD_STEPS.map((/** @type {string} */ s, /** @type {number} */ i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              i < step ? 'bg-primary-600 text-white' :
              i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600' :
              'bg-slate-100 text-slate-400'
            }`}>{i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}</div>
            <span className={`text-[10px] font-medium hidden lg:inline ${i === step ? 'text-primary-700' : 'text-slate-400'}`}>{s}</span>
            {i < WIZARD_STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">

        {/* ── Step 0: Identity ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Bot className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-slate-900">Bot Identity</h2></div>
            <Inp label="Bot Name *" value={form.name} onChange={(/** @type {string} */ v) => u('name', v)} placeholder="Sales Assistant" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">System Prompt *</label>
              <textarea value={form.system_prompt} onChange={(e) => u('system_prompt', e.target.value)} rows={4}
                placeholder="You are a helpful sales assistant for Acme Corp. You help customers with pricing questions, product features, and support issues..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Inp label="Greeting Message" value={form.greeting_message} onChange={(/** @type {string} */ v) => u('greeting_message', v)} />
              <Inp label="Goodbye Message" value={form.goodbye_message} onChange={(/** @type {string} */ v) => u('goodbye_message', v)} />
            </div>
            {/* Guidelines */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Guidelines</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={guidelineInput} onChange={(e) => setGuidelineInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGuideline(); } }}
                  placeholder="e.g. Always be polite and professional" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={() => addGuideline()} className="bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl px-4 py-2 text-sm font-semibold transition-colors">Add</button>
              </div>
              <div className="space-y-1">
                {form.guidelines.map((/** @type {string} */ g, /** @type {number} */ i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{g}</span>
                    <button onClick={() => u('guidelines', form.guidelines.filter((/** @type {string} */ _, /** @type {number} */ j) => j !== i))} className="text-slate-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Voice & AI ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Mic className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-slate-900">Voice & AI Configuration</h2></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Voice Provider</label>
                <select value={form.voice_provider} onChange={(e) => u('voice_provider', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="openai">OpenAI TTS</option>
                  <option value="deepgram">Deepgram</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="piper">Piper (Free)</option>
                </select>
              </div>
              <Inp label="Voice ID" value={form.voice_id} onChange={(/** @type {string} */ v) => u('voice_id', v)} placeholder="alloy, nova, shimmer..." />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Voice Speed: {form.voice_speed}x</label>
                <input type="range" min={0.5} max={2.0} step={0.1} value={form.voice_speed}
                  onChange={(e) => u('voice_speed', parseFloat(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Language</label>
                <select value={form.language} onChange={(e) => u('language', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="hi-en">Hindi + English</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="bn">Bengali</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Behavior ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Brain className="w-5 h-5 text-primary-600" /><h2 className="font-bold text-slate-900">Call Behavior</h2></div>
            {/* Allowed intents */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Allowed Intents</label>
              <p className="text-xs text-slate-400 mb-2">Intents the bot should detect. These become available for escalation rules in the next step.</p>
              <div className="flex gap-2 mb-2">
                <input type="text" value={intentInput} onChange={(e) => setIntentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIntent(); } }}
                  placeholder="e.g. interested, complaint, billing_issue, pricing_query" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={() => addIntent()} className="bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl px-4 py-2 text-sm font-semibold transition-colors">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.allowed_intents.map((/** @type {string} */ intent) => (
                  <span key={intent} className="bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    {intent}
                    <button onClick={() => u('allowed_intents', form.allowed_intents.filter((/** @type {string} */ i) => i !== intent))} className="text-violet-400 hover:text-violet-600">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fallback Message</label>
              <input type="text" value={form.fallback_message} onChange={(e) => u('fallback_message', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Turns: {form.max_turns}</label>
                <input type="range" min={5} max={50} value={form.max_turns}
                  onChange={(e) => u('max_turns', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Duration: {form.max_duration_seconds}s</label>
                <input type="range" min={60} max={900} step={30} value={form.max_duration_seconds}
                  onChange={(e) => u('max_duration_seconds', parseInt(e.target.value))} className="w-full accent-primary-600" />
              </div>
            </div>
            {/* Toggles */}
            <div className="space-y-3">
              <Toggle label="DTMF Input" desc="Allow caller to press keys during bot conversation" checked={form.dtmf_enabled} onChange={(/** @type {boolean} */ v) => u('dtmf_enabled', v)} />
              <Toggle label="Barge-in" desc="Allow caller to interrupt bot while it's speaking" checked={form.barge_in_enabled} onChange={(/** @type {boolean} */ v) => u('barge_in_enabled', v)} />
              <Toggle label="Sentiment Tracking" desc="Track caller sentiment per utterance for reporting" checked={form.sentiment_tracking} onChange={(/** @type {boolean} */ v) => u('sentiment_tracking', v)} />
            </div>
          </div>
        )}

        {/* ── Step 3: Escalation ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5 text-amber-600" /><h2 className="font-bold text-slate-900">Escalation Rules</h2></div>
            <p className="text-sm text-slate-500">Configure when the bot should hand off to a human. Escalation intents are matched by priority (highest first). You'll add detailed intents after creation.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Default Transfer Type</label>
                <select value={form.transfer_type} onChange={(e) => u('transfer_type', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="QUEUE">Transfer to Queue</option>
                  <option value="AGENT">Transfer to Agent</option>
                  <option value="EXTERNAL">Transfer to External</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Default Transfer Target</label>
                {form.transfer_type === 'QUEUE' ? (
                  <select value={form.transfer_target} onChange={(e) => u('transfer_target', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Select queue...</option>
                    {/** @type {any[]} */ (queues).map((/** @type {any} */ q) => (
                      <option key={q.id} value={q.name || q.id}>{q.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={form.transfer_target} onChange={(e) => u('transfer_target', e.target.value)}
                    placeholder={form.transfer_type === 'AGENT' ? 'agent extension' : 'SIP URI'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                )}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-700">
                <strong>How it works:</strong> When a caller's intent is detected with confidence above the threshold, the bot will transfer the call. 
                You can add per-intent escalation rules (with different queues/agents) after creating the bot.
              </p>
            </div>
            {/* Show intents from step 2 as preview */}
            {form.allowed_intents.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Intents available for escalation</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.allowed_intents.map((/** @type {string} */ intent) => (
                    <span key={intent} className="bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">{intent}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Check className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Review & Create</h2></div>
            <div className="bg-slate-50 rounded-xl p-5 space-y-3 text-sm">
              <RR label="Name" value={form.name} />
              <RR label="System Prompt" value={form.system_prompt?.substring(0, 100) + (form.system_prompt?.length > 100 ? '...' : '')} />
              <RR label="Greeting" value={form.greeting_message} />
              <RR label="Voice" value={`${form.voice_provider} / ${form.voice_id} / ${form.voice_speed}x`} />
              <RR label="Language" value={form.language} />
              <RR label="Intents" value={form.allowed_intents.join(', ') || 'None'} />
              <RR label="Max Turns" value={String(form.max_turns)} />
              <RR label="Max Duration" value={`${form.max_duration_seconds}s`} />
              <RR label="DTMF" value={form.dtmf_enabled ? 'Enabled' : 'Disabled'} />
              <RR label="Barge-in" value={form.barge_in_enabled ? 'Enabled' : 'Disabled'} />
              <RR label="Sentiment" value={form.sentiment_tracking ? 'Enabled' : 'Disabled'} />
              <RR label="Transfer" value={`${form.transfer_type} → ${form.transfer_target || 'Not set'}`} />
              <RR label="Guidelines" value={`${form.guidelines.length} rules`} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/bots')}
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
              {isLoading ? 'Creating...' : 'Create Bot'} <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BOT DETAIL — 4 tabs: config, knowledge, escalation, test
// ═══════════════════════════════════════════════════════════

function BotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenantId = useSelector(selectTenantId);
const botId = /** @type {string} */ (id);
  const { data: bot, isLoading } = useGetBotQuery(botId);
  const [updateBot, { isLoading: saving }] = useUpdateBotMutation();
  const { data: knowledge = [], refetch: refetchKnowledge } = useListBotKnowledgeQuery(botId);
  const { data: escalation = [], refetch: refetchEscalation } = useListBotEscalationQuery(botId);
  const { data: queues = [] } = useListQueuesQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [createKnowledge] = useCreateBotKnowledgeMutation();
  const [deleteKnowledge] = useDeleteBotKnowledgeMutation();
  const [createEscalation] = useCreateBotEscalationMutation();
  const [updateEscalation] = useUpdateBotEscalationMutation();
  const [deleteEscalation] = useDeleteBotEscalationMutation();

  const [tab, setTab] = useState('config');

  const TABS = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'escalation', label: 'Escalation Intents', icon: Zap },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'test', label: 'Test', icon: FlaskConical },
  ];

  if (isLoading || !bot) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const b = /** @type {any} */ (bot);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bots')} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{b.name}</h1>
              <p className="text-xs text-slate-400">{b.language} · {b.voiceProvider || 'default'} · {(b.is_active || b.active) ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map((/** @type {typeof TABS[number]} */ t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">

        {/* Config tab */}
        {tab === 'config' && (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <ConfigRow label="System Prompt" value={b.systemPrompt || b.system_prompt} />
              <ConfigRow label="Greeting" value={b.greetingMessage || b.greeting_message} />
              <ConfigRow label="Goodbye" value={b.goodbyeMessage || b.goodbye_message} />
              <ConfigRow label="Fallback" value={b.fallbackMessage || b.fallback_message} />
              <ConfigRow label="Voice" value={`${b.voiceProvider || b.voice_provider || '—'} / ${b.voiceId || b.voice_id || '—'}`} />
              <ConfigRow label="Language" value={b.language} />
              <ConfigRow label="Max Turns" value={b.maxTurns || b.max_turns} />
              <ConfigRow label="Max Duration" value={`${b.maxDurationSeconds || b.max_duration_seconds || '—'}s`} />
              <ConfigRow label="Transfer" value={`${b.transferType || b.transfer_type || '—'} → ${b.transferTarget || b.transfer_target || '—'}`} />
              <ConfigRow label="DTMF" value={(b.dtmfEnabled || b.dtmf_enabled) ? 'Yes' : 'No'} />
              <ConfigRow label="Barge-in" value={(b.bargeInEnabled || b.barge_in_enabled) ? 'Yes' : 'No'} />
              <ConfigRow label="Sentiment" value={(b.sentimentTracking || b.sentiment_tracking) ? 'Yes' : 'No'} />
            </div>
            {(b.guidelines || []).length > 0 && (
              <div className="pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Guidelines</p>
                <ul className="space-y-1">
                  {(b.guidelines || []).map((/** @type {string} */ g, /** @type {number} */ i) => (
                    <li key={i} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">• {g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Escalation tab — the key feature */}
        {tab === 'escalation' && (
          <EscalationTab
            botId={/** @type {string} */ (id)}
            escalation={/** @type {any[]} */ (escalation)}
            queues={/** @type {any[]} */ (queues)}
            onCreate={(/** @type {any} */ data) => createEscalation({ botId: id, ...data }).then(() => refetchEscalation())}
            onUpdate={(/** @type {any} */ data) => updateEscalation({ botId: id, ...data }).then(() => refetchEscalation())}
            onDelete={(/** @type {string} */ intentId) => deleteEscalation({ botId: /** @type {string} */ (id), intentId }).then(() => refetchEscalation())}
          />
        )}

        {/* Knowledge tab */}
        {tab === 'knowledge' && (
          <KnowledgeTab
            botId={/** @type {string} */ (id)}
            knowledge={/** @type {any[]} */ (knowledge)}
            onCreate={(/** @type {any} */ data) => createKnowledge({ botId: id, ...data }).then(() => refetchKnowledge())}
            onDelete={(/** @type {string} */ docId) => deleteKnowledge({ botId: /** @type {string} */ (id), docId }).then(() => refetchKnowledge())}
          />
        )}

        {/* Test tab */}
        {tab === 'test' && (
          <div className="text-center py-12 text-slate-400 text-sm">
            <FlaskConical className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            Use the dedicated Bot Testing page for live testing
            <br />
            <button onClick={() => navigate('/bot-test')} className="mt-3 text-primary-600 hover:text-primary-700 font-semibold text-sm">Go to Bot Testing →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ESCALATION TAB — intent → queue/agent mapping with priority
// ═══════════════════════════════════════════════════════════

/**
 * @param {{ botId: string, escalation: any[], queues: any[],
 *           onCreate: (data: any) => void, onUpdate: (data: any) => void,
 *           onDelete: (intentId: string) => void }} props
 */
function EscalationTab({ botId, escalation, queues, onCreate, onUpdate, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    intent_name: '', description: '', threshold: 0.85, action: 'TRANSFER_QUEUE', target: '', priority: 10,
  });

  const handleAdd = () => {
    onCreate(form);
    setForm({ intent_name: '', description: '', threshold: 0.85, action: 'TRANSFER_QUEUE', target: '', priority: 10 });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {escalation.length} escalation rule{escalation.length !== 1 ? 's' : ''}. 
            Higher priority rules are evaluated first.
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Intent Rule
        </button>
      </div>

      {/* Flow diagram */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-800 mb-2">How escalation works:</p>
        <div className="flex items-center gap-2 text-[10px] text-violet-600">
          <span className="bg-white px-2 py-1 rounded font-semibold">Caller speaks</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded font-semibold">STT</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded font-semibold">Intent Detection</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded font-semibold">Confidence &gt; Threshold?</span>
          <span>→</span>
          <span className="bg-amber-100 px-2 py-1 rounded font-bold text-amber-800">Transfer to Queue/Agent</span>
        </div>
      </div>

      {/* Visual intent → queue mapping */}
      {escalation.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Intent → Queue Mapping</p>
          <div className="space-y-2">
            {[...escalation].sort((/** @type {any} */ a, /** @type {any} */ b) => (b.priority || 0) - (a.priority || 0)).map((/** @type {any} */ rule) => {
              const targetQueue = queues.find((/** @type {any} */ q) => q.name === rule.target || q.id === rule.target);
              return (
                <div key={rule.id} className="flex items-center gap-2 text-xs">
                  <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-900 min-w-[100px]">
                    "{rule.intentName || rule.intent_name}"
                  </span>
                  <span className="text-slate-400">≥ {((rule.threshold || 0.9) * 100).toFixed(0)}%</span>
                  <span className="text-slate-300">→</span>
                  <span className={`px-3 py-1.5 rounded-lg font-semibold min-w-[80px] ${
                    rule.action === 'TRANSFER_QUEUE' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                    rule.action === 'TRANSFER_AGENT' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                    'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {rule.action === 'TRANSFER_QUEUE' ? `Queue: ${/** @type {any} */ (targetQueue)?.name || rule.target}` :
                     rule.action === 'TRANSFER_AGENT' ? `Agent: ${rule.target}` :
                     'Hang Up'}
                  </span>
                  <span className="text-slate-300 ml-auto">P{rule.priority || 0}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 text-xs mt-2 pt-2 border-t border-slate-200">
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg font-semibold text-slate-500 min-w-[100px] italic">no match</span>
              <span className="text-slate-300">→</span>
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg font-semibold text-slate-500">Bot continues conversation</span>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border border-primary-200 bg-primary-50/30 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Intent Name *" value={form.intent_name} onChange={(/** @type {string} */ v) => setForm({ ...form, intent_name: v })} placeholder="interested, complaint, billing" />
            <Inp label="Description" value={form.description} onChange={(/** @type {string} */ v) => setForm({ ...form, description: v })} placeholder="When caller shows interest" />
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Threshold: {form.threshold}</label>
              <input type="range" min={0.1} max={1.0} step={0.05} value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) })} className="w-full accent-primary-600" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority: {form.priority}</label>
              <input type="range" min={1} max={100} value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} className="w-full accent-primary-600" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Action</label>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="TRANSFER_QUEUE">Transfer to Queue</option>
                <option value="TRANSFER_AGENT">Transfer to Agent</option>
                <option value="HANGUP">Hang Up</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target</label>
              {form.action === 'TRANSFER_QUEUE' ? (
                <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select queue...</option>
                  {queues.map((/** @type {any} */ q) => <option key={q.id} value={q.name || q.id}>{q.name}</option>)}
                </select>
              ) : (
                <input type="text" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
                  placeholder={form.action === 'HANGUP' ? 'N/A' : 'extension or URI'}
                  disabled={form.action === 'HANGUP'}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50" />
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5">Cancel</button>
            <button onClick={() => handleAdd()} disabled={!form.intent_name}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors">Add Rule</button>
          </div>
        </div>
      )}

      {/* Rules list — sorted by priority desc */}
      {escalation.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">No escalation rules yet. Calls will use the bot's default transfer settings.</div>
      ) : (
        <div className="space-y-2">
          {[...escalation].sort((/** @type {any} */ a, /** @type {any} */ b) => (b.priority || 0) - (a.priority || 0)).map((/** @type {any} */ rule) => (
            <div key={rule.id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-700">P{rule.priority || 0}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{rule.intentName || rule.intent_name}</span>
                      <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                        ≥ {((rule.threshold || 0.9) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {rule.action} → <span className="font-semibold text-slate-600">{rule.target || 'default'}</span>
                      {rule.description && ` · ${rule.description}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => onDelete(rule.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE TAB
// ═══════════════════════════════════════════════════════════

/**
 * @param {{ botId: string, knowledge: any[], onCreate: (data: any) => void, onDelete: (docId: string) => void }} props
 */
function KnowledgeTab({ botId, knowledge, onCreate, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', content_type: 'FAQ', language: 'en' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{knowledge.length} document{knowledge.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Document
        </button>
      </div>

      {showAdd && (
        <div className="border border-primary-200 bg-primary-50/30 rounded-2xl p-5 space-y-3">
          <Inp label="Title *" value={form.title} onChange={(/** @type {string} */ v) => setForm({ ...form, title: v })} placeholder="Pricing FAQ" />
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Content *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
              placeholder="Q: How much does the basic plan cost?&#10;A: The basic plan is Rs 999/month..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
              <select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="FAQ">FAQ</option>
                <option value="PRODUCT">Product Info</option>
                <option value="SCRIPT">Call Script</option>
                <option value="POLICY">Policy</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500 px-3 py-1.5">Cancel</button>
            <button onClick={() => { onCreate(form); setForm({ title: '', content: '', content_type: 'FAQ', language: 'en' }); setShowAdd(false); }}
              disabled={!form.title || !form.content}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors">Add</button>
          </div>
        </div>
      )}

      {knowledge.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">No knowledge documents yet. Add FAQ, product info, or scripts for grounded bot answers.</div>
      ) : (
        <div className="space-y-2">
          {knowledge.map((/** @type {any} */ doc) => (
            <div key={doc.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{doc.title}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{doc.contentType || doc.content_type}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{doc.content?.substring(0, 100)}</p>
                </div>
                <button onClick={() => onDelete(doc.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
function ConfigRow({ label, value }) {
  return (
    <div className="py-2 border-b border-slate-50">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

/** @param {{ label: string, desc: string, checked: boolean, onChange: (v: boolean) => void }} props */
function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className="transition-colors">
        {checked ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
      </button>
    </div>
  );
}