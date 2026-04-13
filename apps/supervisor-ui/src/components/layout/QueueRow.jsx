// src/pages/admin/QueueManagement/QueueRow.jsx
import React from "react";
import { Edit } from "lucide-react";

/**
 * @typedef {Object} Queue
 * @property {string} id
 * @property {string} name
 * @property {string} strategy
 * @property {number|string} slaTime
 * @property {number|string} slaPercent
 * @property {number} agentsCount
 * @property {string[]} skills
 */

/**
 * @param {{ queue: Queue, onEdit: () => void }} props
 */
export default function QueueRow({ queue, onEdit }) {
  return (
    <tr className="border-t border-slate-300">
      <td className="px-4 py-4">{queue.name}</td>

      <td className="px-4 py-4">{queue.strategy}</td>

      <td className="px-4 py-4">
        {queue.slaTime}s / {queue.slaPercent}%
      </td>

      <td className="px-4 py-4">{queue.agentsCount}</td>

      <td className="px-4 py-4">
        <button
          onClick={onEdit}
          className="text-sky-600 hover:underline flex items-center gap-1"
        >
          <Edit size={14} /> Edit
        </button>
      </td>
    </tr>
  );
}
