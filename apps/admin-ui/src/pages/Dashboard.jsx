import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectTenantId, selectFeatures } from '@dalaillama/shared-store/slices/tenantSlice.js';
import useAnalyticsRange, { RANGE_PRESETS, PRESET_LABELS } from '@dalaillama/shared-hooks/useAnalyticsRange.js';
import {
  Phone, Bot, Users, Clock, TrendingUp, Wallet, Activity, Layers,
  Brain, Zap, Calendar, BarChart3, MessageSquare, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

// ── Operations mock data ──
const MOCK_KPIS = {
  activeCalls: 12, todayCalls: 347,
  aiMinutes: { used: 2340, limit: 5000 },
  monthlyCost: 12450,
  agents: { online: 8, total: 15 },
  queuesActive: 4,
};

const MOCK_CALL_VOLUME = [
  { day: 'Mon', inbound: 45, outbound: 22 },
  { day: 'Tue', inbound: 52, outbound: 28 },
  { day: 'Wed', inbound: 61, outbound: 35 },
  { day: 'Thu', inbound: 48, outbound: 30 },
  { day: 'Fri', inbound: 70, outbound: 42 },
  { day: 'Sat', inbound: 32, outbound: 15 },
  { day: 'Sun', inbound: 25, outbound: 10 },
];

const MOCK_AGENT_PERF = [
  { name: 'Priya', calls: 45, sentiment: 0.82 },
  { name: 'Rahul', calls: 38, sentiment: 0.75 },
  { name: 'Anita', calls: 42, sentiment: 0.91 },
  { name: 'Vikram', calls: 35, sentiment: 0.68 },
  { name: 'Deepa', calls: 50, sentiment: 0.88 },
  { name: 'Arjun', calls: 33, sentiment: 0.79 },
  { name: 'Kavita', calls: 41, sentiment: 0.85 },
  { name: 'Suresh', calls: 28, sentiment: 0.72 },
];

const MOCK_PIE = [
  { name: 'Inbound', value: 65, color: '#7C3AED' },
  { name: 'Outbound', value: 35, color: '#a855f7' },
];

// ── AI / Intent mock data ──
const MOCK_BOT_KPIS = {
  totalBotCalls: 892, avgBotDuration: 142, botResolutionRate: 62,
  avgSentiment: 0.72, escalationRate: 38, aiMinutesUsed: 2340,
  topIntent: 'pricing_query', avgConfidence: 0.87,
};

const MOCK_INTENT_DIST = [
  { name: 'pricing_query', count: 342, pct: 28 },
  { name: 'interested', count: 256, pct: 21 },
  { name: 'support_request', count: 198, pct: 16 },
  { name: 'billing_issue', count: 154, pct: 13 },
  { name: 'complaint', count: 89, pct: 7 },
  { name: 'language_support', count: 72, pct: 6 },
  { name: 'callback_request', count: 55, pct: 5 },
  { name: 'cancellation', count: 42, pct: 3 },
  { name: 'upgrade_interest', count: 38, pct: 3 },
  { name: 'other', count: 48, pct: 4 },
];

const MOCK_INTENT_TIME = [
  { day: 'Mon', pricing_query: 52, interested: 38, support_request: 30, complaint: 12 },
  { day: 'Tue', pricing_query: 48, interested: 42, support_request: 35, complaint: 15 },
  { day: 'Wed', pricing_query: 65, interested: 50, support_request: 28, complaint: 8 },
  { day: 'Thu', pricing_query: 40, interested: 35, support_request: 32, complaint: 18 },
  { day: 'Fri', pricing_query: 72, interested: 55, support_request: 40, complaint: 10 },
  { day: 'Sat', pricing_query: 30, interested: 22, support_request: 15, complaint: 5 },
  { day: 'Sun', pricing_query: 25, interested: 18, support_request: 12, complaint: 3 },
];

const MOCK_SENTIMENT_TIME = [
  { day: 'Mon', positive: 68, neutral: 22, negative: 10 },
  { day: 'Tue', positive: 65, neutral: 25, negative: 10 },
  { day: 'Wed', positive: 72, neutral: 20, negative: 8 },
  { day: 'Thu', positive: 60, neutral: 25, negative: 15 },
  { day: 'Fri', positive: 75, neutral: 18, negative: 7 },
  { day: 'Sat', positive: 70, neutral: 22, negative: 8 },
  { day: 'Sun', positive: 78, neutral: 17, negative: 5 },
];

const MOCK_ESCALATION = [
  { intent: 'pricing_query', escalated: 85, total: 342, rate: 24.9, target: 'Sales Queue' },
  { intent: 'complaint', escalated: 67, total: 89, rate: 75.3, target: 'Support Queue' },
  { intent: 'billing_issue', escalated: 42, total: 154, rate: 27.3, target: 'Billing Queue' },
  { intent: 'interested', escalated: 38, total: 256, rate: 14.8, target: 'Sales Queue' },
  { intent: 'support_request', escalated: 95, total: 198, rate: 48.0, target: 'Support Queue' },
  { intent: 'cancellation', escalated: 35, total: 42, rate: 83.3, target: 'Retention Queue' },
  { intent: 'callback_request', escalated: 50, total: 55, rate: 90.9, target: 'Callback Queue' },
  { intent: 'language_support', escalated: 12, total: 72, rate: 16.7, target: 'Hindi Queue' },
];

const INTENT_COLORS = ['#7C3AED', '#a855f7', '#c084fc', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#94a3b8', '#fb923c', '#a3e635'];

export default function Dashboard() {
  const features = /** @type {any} */ (useSelector(selectFeatures));
  const tenantId = useSelector(selectTenantId);
  const range = useAnalyticsRange('this_week');
  const [view, setView] = useState(/** @type {'operations'|'ai'} */ ('operations'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your contact center</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
            <ToggleBtn active={view === 'operations'} icon={Activity} label="Operations" onClick={() => setView('operations')} />
            <ToggleBtn active={view === 'ai'} icon={Brain} label="AI & Intents" onClick={() => setView('ai')} />
          </div>
          {/* Date range */}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            {RANGE_PRESETS.filter((/** @type {string} */ p) => p !== 'custom').map((/** @type {string} */ p) => (
              <button key={p} onClick={() => range.setPreset(/** @type {any} */ (p))}
                className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                  range.preset === p ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {PRESET_LABELS[/** @type {keyof typeof PRESET_LABELS} */ (p)]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'operations' ? <OperationsView /> : <AiIntentsView />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OPERATIONS VIEW
// ═══════════════════════════════════════════════════════════

function OperationsView() {
  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Active Calls" value={MOCK_KPIS.activeCalls} icon={Activity} iconBg="bg-emerald-100" iconColor="text-emerald-600" pulse />
        <KpiCard title="Today's Calls" value={MOCK_KPIS.todayCalls} icon={Phone} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <KpiCard title="AI Minutes" value={`${(MOCK_KPIS.aiMinutes.used / 1000).toFixed(1)}k`} subtitle={`of ${(MOCK_KPIS.aiMinutes.limit / 1000).toFixed(0)}k`}
          icon={Bot} iconBg="bg-violet-100" iconColor="text-violet-600" progress={MOCK_KPIS.aiMinutes.used / MOCK_KPIS.aiMinutes.limit} />
        <KpiCard title="Monthly Cost" value={`₹${(MOCK_KPIS.monthlyCost / 1000).toFixed(1)}k`} icon={Wallet} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <KpiCard title="Agents Online" value={`${MOCK_KPIS.agents.online}/${MOCK_KPIS.agents.total}`} icon={Users} iconBg="bg-primary-100" iconColor="text-primary-600" />
        <KpiCard title="Active Queues" value={MOCK_KPIS.queuesActive} icon={Layers} iconBg="bg-slate-100" iconColor="text-slate-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Volume */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Call Volume</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-600" /> Inbound</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-300" /> Outbound</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={MOCK_CALL_VOLUME}>
              <defs>
                <linearGradient id="igr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ogr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Area type="monotone" dataKey="inbound" stroke="#7C3AED" strokeWidth={2} fill="url(#igr)" />
              <Area type="monotone" dataKey="outbound" stroke="#c084fc" strokeWidth={2} fill="url(#ogr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Direction Split */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-6">Call Direction</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={MOCK_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {MOCK_PIE.map((/** @type {any} */ e, /** @type {number} */ i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={TT_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {MOCK_PIE.map((/** @type {any} */ item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance — scrollable */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-6">
          Agent Performance <span className="text-[10px] text-slate-400 uppercase tracking-wider ml-2">Today · {MOCK_AGENT_PERF.length} agents</span>
        </h3>
        <div className="max-h-[340px] overflow-y-auto">
          <ResponsiveContainer width="100%" height={Math.max(200, MOCK_AGENT_PERF.length * 40)}>
            <BarChart data={MOCK_AGENT_PERF} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Bar dataKey="calls" fill="#7C3AED" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// AI & INTENTS VIEW
// ═══════════════════════════════════════════════════════════

function AiIntentsView() {
  return (
    <>
      {/* AI KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <KpiCard title="Bot Calls" value={MOCK_BOT_KPIS.totalBotCalls} icon={Bot} iconBg="bg-violet-100" iconColor="text-violet-600" />
        <KpiCard title="Avg Duration" value={`${Math.floor(MOCK_BOT_KPIS.avgBotDuration / 60)}m ${MOCK_BOT_KPIS.avgBotDuration % 60}s`} icon={Clock} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <KpiCard title="Resolution" value={`${MOCK_BOT_KPIS.botResolutionRate}%`} icon={Target} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <KpiCard title="Sentiment" value={`+${MOCK_BOT_KPIS.avgSentiment}`} icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <KpiCard title="Escalation" value={`${MOCK_BOT_KPIS.escalationRate}%`} icon={Zap} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <KpiCard title="AI Minutes" value={MOCK_BOT_KPIS.aiMinutesUsed.toLocaleString()} icon={Brain} iconBg="bg-violet-100" iconColor="text-violet-600" />
        <KpiCard title="Top Intent" value={MOCK_BOT_KPIS.topIntent} icon={MessageSquare} iconBg="bg-primary-100" iconColor="text-primary-600" />
        <KpiCard title="Confidence" value={`${(MOCK_BOT_KPIS.avgConfidence * 100).toFixed(0)}%`} icon={BarChart3} iconBg="bg-blue-100" iconColor="text-blue-600" />
      </div>

      {/* Intent Distribution + Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution — scrollable bar list */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Intent Distribution</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">{MOCK_INTENT_DIST.length} intents detected</p>
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {MOCK_INTENT_DIST.map((/** @type {typeof MOCK_INTENT_DIST[number]} */ d, /** @type {number} */ i) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{d.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{d.count} ({d.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${d.pct}%`, backgroundColor: INTENT_COLORS[i % INTENT_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trends — line chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Intent Trends</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Top 4 intents over time</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] flex-wrap">
              {['pricing_query', 'interested', 'support_request', 'complaint'].map((/** @type {string} */ n, /** @type {number} */ i) => (
                <span key={n} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: INTENT_COLORS[i] }} /> {n}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={MOCK_INTENT_TIME}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Line type="monotone" dataKey="pricing_query" stroke={INTENT_COLORS[0]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="interested" stroke={INTENT_COLORS[1]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="support_request" stroke={INTENT_COLORS[2]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="complaint" stroke={INTENT_COLORS[3]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment + Escalation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment stacked area */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Sentiment Distribution</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">% of calls by sentiment</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_SENTIMENT_TIME}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Area type="monotone" dataKey="positive" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
              <Area type="monotone" dataKey="negative" stackId="1" stroke="#f87171" fill="#f87171" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3">
            {[{ l: 'Positive', c: '#34d399' }, { l: 'Neutral', c: '#fbbf24' }, { l: 'Negative', c: '#f87171' }].map((/** @type {{l:string,c:string}} */ s) => (
              <span key={s.l} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.c }} /> {s.l}
              </span>
            ))}
          </div>
        </div>

        {/* Escalation table — scrollable with sticky header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Escalation by Intent</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">{MOCK_ESCALATION.length} intent rules</p>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  {['Intent', 'Esc', 'Total', 'Rate', 'Target'].map((/** @type {string} */ h) => (
                    <th key={h} className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_ESCALATION.map((/** @type {typeof MOCK_ESCALATION[number]} */ row) => (
                  <tr key={row.intent} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-2.5 text-xs font-semibold text-slate-900">{row.intent}</td>
                    <td className="px-2 py-2.5 text-xs font-mono text-slate-600">{row.escalated}</td>
                    <td className="px-2 py-2.5 text-xs font-mono text-slate-400">{row.total}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{
                            width: `${Math.min(row.rate, 100)}%`,
                            backgroundColor: row.rate > 50 ? '#f87171' : row.rate > 25 ? '#fbbf24' : '#34d399',
                          }} />
                        </div>
                        <span className={`text-[10px] font-bold ${row.rate > 50 ? 'text-red-600' : row.rate > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {row.rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold">{row.target}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

const TT_STYLE = /** @type {import('react').CSSProperties} */ ({ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 });

/**
 * @param {{ title: string, value: string|number, subtitle?: string, icon: import('react').ElementType,
 *           iconBg: string, iconColor: string, pulse?: boolean, progress?: number }} props
 */
function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, pulse, progress }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{title}</p>
      <div className="flex items-baseline gap-1.5">
        <p className={`font-bold text-slate-900 truncate ${String(value).length > 10 ? 'text-sm' : 'text-xl'}`}>{value}</p>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-700 ${
            progress > 0.8 ? 'bg-red-500' : progress > 0.6 ? 'bg-amber-500' : 'bg-primary-500'
          }`} style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

/** @param {{ active: boolean, icon: import('react').ElementType, label: string, onClick: () => void }} props */
function ToggleBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button onClick={() => onClick()}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
        active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}