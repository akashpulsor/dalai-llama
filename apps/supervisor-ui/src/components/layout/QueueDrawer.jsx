// src/pages/admin/QueueManagement/QueueDrawer.jsx
import React from "react";
import { X } from "lucide-react";
import QueueForm from "./QueueForm.jsx";

/**
 * @typedef {Object} Queue
 * @property {string} id
 * @property {string} name
 * @property {string} strategy
 * @property {number} maxWait
 * @property {number} maxSize
 * @property {number} wrapUp
 * @property {string[]} skills
 * @property {number} slaTime
 * @property {number} slaPercent
 * @property {string} businessHours
 */

/**
 * @param {{ mode:"add"|"edit", queue?:Queue, onClose:()=>void }} props
 */
export default function QueueDrawer({ mode, queue, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full sm:w-[430px] h-full bg-slate-900 border-l border-slate-800 p-6 overflow-auto shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-slate-100">
            {mode === "edit" ? "Edit Queue" : "Create Queue"}
          </div>

          <button
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <QueueForm mode={mode} queue={queue} onClose={onClose} />
      </div>
    </div>
  );
}
