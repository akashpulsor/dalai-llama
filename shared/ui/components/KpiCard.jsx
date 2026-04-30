/**
 * KPI stat card — used in all dashboards.
 *
 * @param {{ title: string, value: string|number, subtitle?: string,
 *           icon?: any, iconBg?: string, trend?: number, className?: string }} props
 */
export default function KpiCard({ title, value, subtitle, icon: Icon, iconBg = 'bg-purple-100', trend, className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-lg p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend !== undefined && trend !== null && (
            <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
        )}
      </div>
    </div>
  );
}
