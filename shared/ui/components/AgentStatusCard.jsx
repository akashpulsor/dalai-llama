// shared/ui/components/AgentStatusCard.jsx
import React from "react";

/**
 * @typedef {"online" | "offline" | "busy" | "away"} AgentStatus
 */

/**
 * @typedef {Object} AgentStatusCardProps
 * @property {string} name
 * @property {AgentStatus} status
 * @property {string} [role]
 */

/**
 * @param {AgentStatusCardProps} props
 */
export default function AgentStatusCard(props) {
  const { name, status, role = "" } = props;

  /** @type {Record<AgentStatus, string>} */
  const colors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-400",
  };

  /** @type {string} */
  const color = colors[status] ?? "bg-gray-400";

  return (
    <div className="p-4 border rounded bg-white flex items-center gap-3 shadow-sm">
      <div className={`w-3 h-3 rounded-full ${color}`} />

      <div className="flex-1">
        <div className="font-medium text-gray-800">{name}</div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
  );
}
