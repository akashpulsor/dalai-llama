// src/pages/admin/RoutingRules/RoutingRuleRow.jsx
import React from "react";
import { Edit } from "lucide-react";

/**
 * @typedef {Object} RoutingRuleCondition
 * @property {string} field
 * @property {string} operator
 * @property {string} value
 */

/**
 * @typedef {Object} RoutingRule
 * @property {string} id
 * @property {string} name
 * @property {RoutingRuleCondition[]} conditions
 * @property {"AND"|"OR"} combine
 * @property {"Queue"|"IVR"|"Bot"} destinationType
 * @property {string} destination
 * @property {string} [fallback]  
 */

/**
 * @param {{ rule: RoutingRule, onEdit: () => void }} props
 */
export default function RoutingRuleRow({ rule, onEdit }) {
  const condText = (rule.conditions ?? [])
    .map((c) => `${c.field} ${c.operator} ${c.value}`)
    .join(` ${rule.combine} `);

  return (
    <tr className="border-t border-slate-300">
      <td className="px-4 py-4">{rule.name}</td>

      <td className="px-4 py-4">{condText}</td>

      <td className="px-4 py-4">
        {rule.destinationType} → {rule.destination}
      </td>

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
