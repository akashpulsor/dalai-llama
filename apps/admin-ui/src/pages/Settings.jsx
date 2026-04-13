import { useState } from 'react';
import {
  useListTrunksQuery, useCreateTrunkMutation, useDeleteTrunkMutation,
} from '@dalaillama/shared-store/slices/pbxCoreApi.js';

import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';

import {
  Settings as SettingsIcon, Phone, Globe, Webhook, Key,Database,
  Plus, Trash2, Server, Shield,
} from 'lucide-react';

const TABS = [
  { id: 'trunks', label: 'SIP Trunks', icon: Server },
  { id: 'dids', label: 'DIDs', icon: Phone },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'crm', label: 'CRM Integration', icon: Database },
  { id: 'keys', label: 'API Keys', icon: Key },
  { id: 'general', label: 'General', icon: SettingsIcon },
];

export default function Settings() {
  const [tab, setTab] = useState('trunks');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">System configuration</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((/** @type {typeof TABS[number]} */ t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">
        {tab === 'trunks' && <TrunksTab />}
        {tab === 'dids' && <DidsTab />}
        {tab === 'webhooks' && <WebhooksTab />}
        {tab === 'keys' && <ApiKeysTab />}
        {tab === 'general' && <GeneralTab />}
        {tab === 'crm' && <CrmTab />}
      </div>
    </div>
  );
}

function TrunksTab() {
  const tenantId = useSelector(selectTenantId);
  const { data: trunks = [], isLoading } = useListTrunksQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const [createTrunk] = useCreateTrunkMutation();
  const [deleteTrunk] = useDeleteTrunkMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
      name: '', provider: '', sip_server: '', sip_port: 5060,
      transport: 'UDP', auth_type: 'CREDENTIALS', auth_username: '', auth_password: '',
      max_concurrent: 30, outbound_caller_id: '', codec_preference: '',
    });

  const handleCreate = async () => {
    if (!tenantId) return;
    await createTrunk({
      tenant_id: tenantId,
      subscription_id: tenantId,
      ...form,
    });
    setShowCreate(false);
    setForm({ name: '', provider: '', sip_server: '', sip_port: 5060,
      transport: 'UDP', auth_type: 'CREDENTIALS', auth_username: '', auth_password: '',
      max_concurrent: 30, outbound_caller_id: '', codec_preference: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{/** @type {any[]} */ (trunks).length} trunk{/** @type {any[]} */ (trunks).length !== 1 ? 's' : ''} configured</p>
        <button onClick={() => setShowCreate(!showCreate)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Trunk
        </button>
      </div>

      {showCreate && (
        <div className="border border-primary-200 bg-primary-50/30 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Name" value={form.name} onChange={(/** @type {string} */ v) => setForm({ ...form, name: v })} placeholder="Primary PSTN" />
            <Inp label="SIP Server" value={form.sip_server} onChange={(v) => setForm({ ...form, sip_server: v })} placeholder="sip.provider.com" />
            <Inp label="Provider" value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} placeholder="twilio, bandwidth..." />
            <Inp label="Port" value={String(form.sip_port)} onChange={(/** @type {string} */ v) => setForm({ ...form, sip_port: parseInt(v) || 5060 })} placeholder="5060" />
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Transport</label>
              <select value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>UDP</option><option>TCP</option><option>TLS</option>
              </select>
            </div>
            <Inp label="Auth Username" value={form.auth_username} onChange={(v) => setForm({ ...form, auth_username: v })} />
            <Inp label="Auth Password" value={form.auth_password} onChange={(v) => setForm({ ...form, auth_password: v })} type="password" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5">Cancel</button>
            <button onClick={() => handleCreate()} disabled={!form.name || !form.sip_server}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors">Save</button>
          </div>
        </div>
      )}

      {/** @type {any[]} */ (trunks).map((/** @type {any} */ t) => (
        <div key={t.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-400">{t.host}:{t.port} ({t.transport})</p>
            </div>
          </div>
          <button onClick={() => deleteTrunk(t.id)} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function DidsTab() {
  return (
    <div className="text-center py-12">
      <Phone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 text-sm">Assigned DID numbers</p>
      <p className="text-slate-400 text-xs mt-1">DIDs are provisioned during tenant setup. Contact support to request new numbers.</p>
    </div>
  );
}

function WebhooksTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Configure webhook URLs for call events</p>
      <div className="space-y-3">
        {['call.start', 'call.end', 'escalation', 'campaign.complete'].map((/** @type {string} */ event) => (
          <div key={event} className="flex items-center gap-3">
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded min-w-[140px]">{event}</span>
            <input type="text" placeholder="https://your-server.com/webhook" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        ))}
      </div>
      <button className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors text-sm">Save Webhooks</button>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Your own AI provider keys (override platform defaults)</p>
      <div className="space-y-3">
        {[
          { label: 'OpenAI API Key', placeholder: 'sk-...' },
          { label: 'Deepgram API Key', placeholder: 'dg-...' },
          { label: 'ElevenLabs API Key', placeholder: 'el-...' },
        ].map((/** @type {any} */ k) => (
          <div key={k.label}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{k.label}</label>
            <input type="password" placeholder={k.placeholder}
              className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        ))}
      </div>
      <button className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors text-sm">Save Keys</button>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-4 max-w-md">
      <Inp label="Timezone" value="Asia/Kolkata" onChange={() => {}} />
      <Inp label="Default Language" value="en" onChange={() => {}} />
      <p className="text-xs text-slate-400 pt-4">Tenant ID and realm are configured during provisioning and cannot be changed here.</p>
    </div>
  );
}

/** @param {{ label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }} props */
function Inp({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
  );
}


function CrmTab() {
  const [provider, setProvider] = useState('');
  const [config, setConfig] = useState({ api_url: '', api_key: '', sync_contacts: true, sync_calls: true, sync_notes: true });

  const CRM_PROVIDERS = [
    { id: 'salesforce', name: 'Salesforce', desc: 'Sync leads, contacts, and call logs', fields: ['instance_url', 'client_id', 'client_secret', 'refresh_token'] },
    { id: 'hubspot', name: 'HubSpot', desc: 'Sync contacts, deals, and call activities', fields: ['api_key'] },
    { id: 'zoho', name: 'Zoho CRM', desc: 'Sync leads, contacts, and call logs', fields: ['api_url', 'client_id', 'client_secret', 'refresh_token'] },
    { id: 'freshsales', name: 'Freshsales', desc: 'Sync contacts and call activities', fields: ['domain', 'api_key'] },
    { id: 'pipedrive', name: 'Pipedrive', desc: 'Sync persons, deals, and call logs', fields: ['api_token'] },
    { id: 'custom', name: 'Custom REST API', desc: 'Connect any CRM via REST webhook', fields: ['api_url', 'api_key', 'auth_header'] },
  ];

  const selected = CRM_PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 mb-4">Connect your CRM to sync contacts, push call logs, and pull lead data for outbound campaigns.</p>
      </div>

      {/* Provider selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CRM Provider</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CRM_PROVIDERS.map((/** @type {any} */ p) => (
            <button key={p.id} onClick={() => setProvider(p.id)}
              className={`text-left border rounded-2xl p-4 transition-all duration-200 ${
                provider === p.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
              }`}>
              <p className="text-sm font-semibold text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Config form */}
      {selected && (
        <div className="border border-primary-200 bg-primary-50/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-slate-900 text-sm">{selected.name} Configuration</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {selected.fields.map((/** @type {string} */ field) => (
              <Inp key={field} label={field.replace(/_/g, ' ')}
                value={/** @type {any} */ (config)[field] || ''}
                onChange={(/** @type {string} */ v) => setConfig({ ...config, [field]: v })}
                placeholder={field.includes('secret') || field.includes('key') || field.includes('token') ? '••••••••' : `Enter ${field}`}
                type={field.includes('secret') || field.includes('key') || field.includes('token') || field.includes('password') ? 'password' : 'text'} />
            ))}
          </div>

          {/* Sync options */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sync Settings</p>
            <div className="space-y-2">
              <SyncToggle label="Sync Contacts" desc="Import contacts from CRM for campaigns" checked={config.sync_contacts} onChange={(/** @type {boolean} */ v) => setConfig({ ...config, sync_contacts: v })} />
              <SyncToggle label="Push Call Logs" desc="Send CDR + transcript to CRM after each call" checked={config.sync_calls} onChange={(/** @type {boolean} */ v) => setConfig({ ...config, sync_calls: v })} />
              <SyncToggle label="Push Agent Notes" desc="Sync agent wrap-up notes to CRM" checked={config.sync_notes} onChange={(/** @type {boolean} */ v) => setConfig({ ...config, sync_notes: v })} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors text-sm">Save & Connect</button>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-5 py-2.5 font-semibold transition-colors text-sm">Test Connection</button>
            <button onClick={() => setProvider('')} className="text-xs text-slate-500 hover:text-slate-700 ml-auto">Cancel</button>
          </div>
        </div>
      )}

      {/* Active integrations */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Integrations</p>
        <div className="text-center py-8 bg-slate-50 rounded-2xl">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No CRM connected yet</p>
          <p className="text-xs text-slate-300 mt-1">Select a provider above to get started</p>
        </div>
      </div>
    </div>
  );
}

/** @param {{ label: string, desc: string, checked: boolean, onChange: (v: boolean) => void }} props */
function SyncToggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className="transition-colors">
        {checked
          ? <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" /></div>
          : <div className="w-10 h-6 bg-slate-300 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" /></div>
        }
      </button>
    </div>
  );
}
