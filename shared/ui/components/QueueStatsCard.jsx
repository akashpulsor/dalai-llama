import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Queue stats card — shows real-time queue metrics.
 *
 * @param {{ queue: { name: string, waiting: number, avg_wait_seconds: number,
 *           sla_percent: number, agents_available: number, abandoned: number },
 *           onClick?: () => void }} props
 */
export default function QueueStatsCard({ queue, onClick }) {
  const slaColor = queue.sla_percent >= 80 ? 'text-emerald-600' : queue.sla_percent >= 60 ? 'text-amber-600' : 'text-red-600';
  const waitColor = queue.avg_wait_seconds <= 30 ? 'text-emerald-600' : queue.avg_wait_seconds <= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div
      onClick={onClick ? () => onClick() : undefined}
      className={`bg-white rounded-3xl border border-slate-100 shadow-lg p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-sm">{queue.name}</h3>
        {queue.waiting > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
            {queue.waiting} waiting
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat icon={Users} label="Agents" value={queue.agents_available} color="text-purple-600" />
        <Stat icon={Clock} label="Avg Wait" value={`${queue.avg_wait_seconds}s`} color={waitColor} />
        <Stat icon={CheckCircle} label="SLA" value={`${queue.sla_percent}%`} color={slaColor} />
        <Stat icon={AlertCircle} label="Abandoned" value={queue.abandoned} color={queue.abandoned > 0 ? 'text-red-600' : 'text-slate-400'} />
      </div>

      <div className="mt-4">
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              queue.sla_percent >= 80 ? 'bg-emerald-500' : queue.sla_percent >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(queue.sla_percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ icon: import('react').ElementType, label: string, value: string|number, color: string }} props
 */
function Stat({ icon: Icon, label, value, color }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}