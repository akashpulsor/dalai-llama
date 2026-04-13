import { useSelector } from 'react-redux';
import { selectTenantId, selectFeatures } from '@dalaillama/shared-store/slices/tenantSlice.js';
import useAnalyticsRange, { RANGE_PRESETS, PRESET_LABELS } from '@dalaillama/shared-hooks/useAnalyticsRange.js';
import {
  useGetOverviewQuery, useGetCustomerAnalyticsQuery,
  useGetBotAnalyticsQuery, useGetAgentAnalyticsQuery,
} from '@dalaillama/shared-store/slices/analyticsApi.js';
import {
  CreditCard, Phone, Bot, Clock, Users, TrendingUp, Wallet,
  Calendar, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

export default function Billing() {
  const tenantId = useSelector(selectTenantId);
  const features = useSelector(selectFeatures);
  const range = useAnalyticsRange('this_month');

  const { data: overview } = useGetOverviewQuery(
    tenantId ? { tenantId, fromTs: range.fromTs, toTs: range.toTs } : /** @type {any} */ (undefined),
    { skip: !tenantId }
  );
  const { data: botStats } = useGetBotAnalyticsQuery(
    tenantId ? { tenantId, fromTs: range.fromTs, toTs: range.toTs } : /** @type {any} */ (undefined),
    { skip: !tenantId }
  );

  // Mock data for demo
  const ov = overview || { total_calls: 1247, total_minutes: 4832, total_cost: 12450, ai_minutes: 2340, avg_handle_time: 245, sla_percentage: 87 };
  const mockUsage = [
    { item: 'Inbound Minutes', qty: 2890, rate: 1.5, cost: 4335 },
    { item: 'Outbound Minutes', qty: 1942, rate: 2.0, cost: 3884 },
    { item: 'AI Minutes', qty: 2340, rate: 1.8, cost: 4212 },
    { item: 'Recording Storage (GB)', qty: 4.2, rate: 5.0, cost: 21 },
  ];
  const mockDaily = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    cost: Math.floor(Math.random() * 500) + 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Usage</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor costs and plan limits</p>
        </div>
        {/* Date range picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-slate-400" />
          {RANGE_PRESETS.filter((/** @type {string} */ p) => p !== 'custom').map((/** @type {string} */ p) => (
            <button key={p} onClick={() => range.setPreset(/** @type {any} */ (p))}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                range.preset === p ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {PRESET_LABELS[/** @type {keyof typeof PRESET_LABELS} */ (p)]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Kpi icon={Wallet} label="Total Cost" value={`₹${(ov.total_cost / 1000).toFixed(1)}k`} iconBg="bg-amber-100" />
        <Kpi icon={Phone} label="Total Calls" value={ov.total_calls.toLocaleString()} iconBg="bg-blue-100" />
        <Kpi icon={Clock} label="Total Minutes" value={ov.total_minutes.toLocaleString()} iconBg="bg-emerald-100" />
        <Kpi icon={Bot} label="AI Minutes" value={ov.ai_minutes.toLocaleString()} iconBg="bg-violet-100" />
        <Kpi icon={TrendingUp} label="Avg Handle" value={`${Math.floor(ov.avg_handle_time / 60)}m`} iconBg="bg-primary-100" />
        <Kpi icon={BarChart3} label="SLA" value={`${ov.sla_percentage}%`} iconBg="bg-emerald-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily cost chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Daily Cost</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-6">{range.label}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="cost" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan limits */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-6">Plan Limits</h3>
          <div className="space-y-4">
            <LimitBar label="Agents" used={8} max={features.max_agents || 15} />
            <LimitBar label="Queues" used={4} max={features.max_queues || 10} />
            <LimitBar label="Channels" used={12} max={features.max_channels || 30} />
            <LimitBar label="AI Minutes" used={2340} max={features.max_ai_minutes || 5000} />
          </div>
        </div>
      </div>

      {/* Usage breakdown table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Usage Breakdown</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Line Item', 'Quantity', 'Rate', 'Cost'].map((/** @type {string} */ h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockUsage.map((/** @type {any} */ u, /** @type {number} */ i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-6 py-3 text-sm font-medium text-slate-900">{u.item}</td>
                <td className="px-6 py-3 text-sm font-mono text-slate-600">{u.qty.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm font-mono text-slate-600">₹{u.rate.toFixed(2)}/min</td>
                <td className="px-6 py-3 text-sm font-mono font-semibold text-slate-900">₹{u.cost.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td colSpan={3} className="px-6 py-3 text-sm font-bold text-slate-900 text-right">Total</td>
              <td className="px-6 py-3 text-sm font-mono font-bold text-primary-600">
                ₹{mockUsage.reduce((/** @type {number} */ s, /** @type {any} */ u) => s + u.cost, 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** @param {{ icon: import('react').ElementType, label: string, value: string, iconBg: string }} props */
function Kpi({ icon: Icon, label, value, iconBg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-4.5 h-4.5 text-primary-600" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

/** @param {{ label: string, used: number, max: number }} props */
function LimitBar({ label, used, max }) {
  const pct = max > 0 ? (used / max) * 100 : 0;
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-primary-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-xs font-mono text-slate-500">{used} / {max}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
