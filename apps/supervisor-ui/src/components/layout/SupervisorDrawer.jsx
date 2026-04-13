import React from "react";
import { X } from "lucide-react";
import SupervisorForm from "./SupervisorForm.jsx";

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
 * @param {{ mode:"add"|"edit", supervisor?:Supervisor, onClose:()=>void }} props
 */
export default function SupervisorDrawer({ mode, supervisor, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full sm:w-[420px] h-full bg-slate-900 border-l border-slate-800 p-6 overflow-auto shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-semibold text-slate-100">
            {mode === "edit" ? "Edit Supervisor" : "Add Supervisor"}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <SupervisorForm mode={mode} supervisor={supervisor} onClose={onClose} />
      </div>
    </div>
  );
}
