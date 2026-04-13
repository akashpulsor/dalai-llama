// src/pages/admin/RoutingRules/RoutingRuleDrawer.jsx
import React from "react";
import { X } from "lucide-react";
import RoutingRuleForm from "./RoutingRuleForm.jsx";

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
 * @param {{
 *   mode:"add"|"edit",
 *   rule?:RoutingRule,
 *   onClose:()=>void
 * }} props
 */
export default function RoutingRuleDrawer({ mode, rule, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full sm:w-[480px] h-full bg-slate-900 border-l border-slate-800 p-6 overflow-auto shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-slate-100">
            {mode === "edit" ? "Edit Rule" : "Add Rule"}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <RoutingRuleForm mode={mode} rule={rule} onClose={onClose} />
      </div>
    </div>
  );
}
