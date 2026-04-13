import React from "react";
import { X } from "lucide-react";
import AgentForm from "./AgentForm.jsx";

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
 * @param {{ mode: "add"|"edit", agent?: Agent, onClose: () => void }} props
 */
export default function AgentDrawer({ mode, agent, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full sm:w-[420px] h-full bg-slate-900 border-l border-slate-800 p-6 overflow-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-slate-100">
            {mode === "edit" ? "Edit Agent" : "Add Agent"}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <AgentForm mode={mode} agent={agent} onClose={onClose} />
      </div>
    </div>
  );
}
