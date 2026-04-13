import React from "react";
import { Edit, RotateCcw, Power } from "lucide-react";
import { useDisableAgentMutation } from "@dalaillama/shared-store";

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} mobile
 * @property {string[]} skills
 * @property {string[]} queues
 * @property {"Active"|"Disabled"} status
 * @property {number} maxCalls
 * @property {number} maxChats
 * @property {string} [sipUser]
 * @property {string} [sipPass]
 * @property {number} [proficiency]
 */

/**
 * @param {{ agent: Agent, onEdit: () => void }} props
 */
export default function AgentRow({ agent, onEdit }) {
  const [disableAgent] = useDisableAgentMutation();

  const safeQueues = Array.isArray(agent.queues) ? agent.queues : [];

  return (
    <tr className="border-t border-slate-200">
      <td className="px-4 py-4">
        <div className="font-medium">{agent.name}</div>
        <div className="text-xs text-slate-500">{agent.email}</div>
        <div className="text-xs text-slate-500">
          Queues: {safeQueues.length ? safeQueues.join(", ") : "None"}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          {(agent.skills ?? []).map(
            /** @param {string} s */ (s) => (
              <span
                key={s}
                className="px-2 py-1 text-xs bg-slate-100 rounded-md"
              >
                {s}
              </span>
            )
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <span
          className={
            agent.status === "Active"
              ? "text-green-600 font-medium"
              : "text-red-600 font-medium"
          }
        >
          {agent.status}
        </span>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={onEdit}
            className="text-sky-600 hover:underline flex items-center gap-1"
          >
            <Edit size={14} /> Edit
          </button>

          <button
            onClick={() => alert("Reset credentials flow")}
            className="text-orange-600 hover:underline flex items-center gap-1"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={() => disableAgent({ id: agent.id })}
            className="text-red-600 hover:underline flex items-center gap-1"
          >
            <Power size={14} /> Disable
          </button>
        </div>
      </td>
    </tr>
  );
}
