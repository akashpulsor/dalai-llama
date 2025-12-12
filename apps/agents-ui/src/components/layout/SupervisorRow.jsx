import React from "react";
import { Edit, Power } from "lucide-react";
import { useDisableAgentMutation } from "@dalaillama/shared-store";

/**
 * @typedef {Object} Supervisor
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string[]} permissions
 * @property {string[]} agents
 * @property {string[]} queues
 */

/**
 * @param {{ supervisor: Supervisor, onEdit: () => void }} props
 */
export default function SupervisorRow({ supervisor, onEdit }) {
  const [disableSupervisor] = useDisableAgentMutation();

  const safePermissions = Array.isArray(supervisor.permissions)
    ? supervisor.permissions
    : [];

  const safeAgents = Array.isArray(supervisor.agents)
    ? supervisor.agents
    : [];

  return (
    <tr className="border-t border-slate-300">
      {/* NAME + EMAIL */}
      <td className="px-4 py-4">
        <div className="font-medium">{supervisor.name}</div>
        <div className="text-xs text-slate-500">{supervisor.email}</div>
      </td>

      {/* TEAM SIZE */}
      <td className="px-4 py-4">
        {safeAgents.length} agents
      </td>

      {/* PERMISSIONS */}
      <td className="px-4 py-4">
        {safePermissions.length ? safePermissions.join(", ") : "None"}
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-4">
        <div className="flex gap-4 text-sm">
          <button
            onClick={onEdit}
            className="text-sky-600 hover:underline flex items-center gap-1"
          >
            <Edit size={14} /> Edit
          </button>

          <button
            onClick={() => disableSupervisor({ id: supervisor.id })}
            className="text-red-600 hover:underline flex items-center gap-1"
          >
            <Power size={14} /> Disable
          </button>
        </div>
      </td>
    </tr>
  );
}
