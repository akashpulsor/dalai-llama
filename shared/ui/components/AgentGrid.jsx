import { User, Phone, Coffee, Clock, PhoneOff } from 'lucide-react';

/**
 * @typedef {Object} AgentItem
 * @property {string} id
 * @property {string} display_name
 * @property {string} extension
 * @property {string} status - ONLINE|ON_CALL|BREAK|WRAP_UP|OFFLINE
 * @property {string} [current_call_number]
 * @property {number} [call_duration] - seconds
 * @property {string} [avatar_url]
 */

const STATUS_CONFIG = {
  ONLINE:  { label: 'Online',  color: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700', icon: User },
  ON_CALL: { label: 'On Call', color: 'bg-blue-500',    bg: 'bg-blue-50',     text: 'text-blue-700',    icon: Phone },
  BREAK:   { label: 'Break',   color: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700',   icon: Coffee },
  WRAP_UP: { label: 'Wrap Up', color: 'bg-violet-500',  bg: 'bg-violet-50',   text: 'text-violet-700',  icon: Clock },
  OFFLINE: { label: 'Offline', color: 'bg-slate-300',   bg: 'bg-slate-50',    text: 'text-slate-500',   icon: PhoneOff },
};

/**
 * Agent grid — shows agent cards with real-time status.
 * Used in supervisor wallboard and admin agent monitoring.
 *
 * @param {{ agents: AgentItem[], onAgentClick?: (agent: AgentItem) => void,
 *           compact?: boolean }} props
 */
export default function AgentGrid({ agents = [], onAgentClick, compact = false }) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No agents found
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {agents.map((agent) => {
        const config = STATUS_CONFIG[/** @type {keyof typeof STATUS_CONFIG} */ (agent.status)] || STATUS_CONFIG.OFFLINE;
        const Icon = config.icon;

        return (
          <div
            key={agent.id}
            onClick={() => onAgentClick?.(agent)}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${onAgentClick ? 'cursor-pointer' : ''} ${compact ? 'p-3' : 'p-4'}`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with status dot */}
              <div className="relative">
                <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full ${config.bg} flex items-center justify-center`}>
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className={`${compact ? 'text-sm' : 'text-base'} font-bold ${config.text}`}>
                      {agent.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${config.color} rounded-full border-2 border-white`} />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-slate-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {agent.display_name}
                </p>
                <p className="text-[10px] text-slate-400">
                  Ext. {agent.extension}
                </p>
              </div>
            </div>

            {/* Status + call info */}
            <div className={`flex items-center justify-between ${compact ? 'mt-2' : 'mt-3'}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                {config.label}
              </span>
              {agent.status === 'ON_CALL' && agent.current_call_number && !compact && (
                <span className="text-[10px] text-blue-500 font-mono truncate max-w-[80px]">
                  {agent.current_call_number}
                </span>
              )}
              {agent.status === 'ON_CALL' && agent.call_duration != null && (
                <span className="text-[10px] text-blue-500 font-mono">
                  {Math.floor(agent.call_duration / 60)}:{(agent.call_duration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
