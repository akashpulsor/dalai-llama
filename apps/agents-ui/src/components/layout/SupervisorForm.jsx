import React, { use, useState } from "react";
import Field from "./Field.jsx";
import {
  useAddAgentMutation,
  useUpdateAgentMutation,
  useGetAgentsQuery
} from "@dalaillama/shared-store";

const PERMISSIONS = [
  "View Live Calls",
  "Whisper",
  "Barge",
  "Access Recordings",
  "Manage Queues",
];

/**
 * Agent shape (used for agents list coming from API)
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string[]} [skills]
 * @property {string[]} [queues]
 */

/**
 * Supervisor shape
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
export default function SupervisorForm({ mode, supervisor, onClose }) {
  const isEdit = mode === "edit";

  const [addSupervisor] = useAddAgentMutation();
  const [updateSupervisor] = useUpdateAgentMutation();

  const { data: agents = [] } = useGetAgentsQuery();

  const [name, setName] = useState(supervisor?.name ?? "");
  const [email, setEmail] = useState(supervisor?.email ?? "");
  const [permissions, setPermissions] = useState(supervisor?.permissions ?? []);
  const [assignedAgents, setAssignedAgents] = useState(supervisor?.agents ?? []);
  const [queues, setQueues] = useState(supervisor?.queues ?? []);

  /**
   * Toggle helper
   * @param {(newList: string[]) => void} listSetter
   * @param {string[]} list
   * @param {string} item
   */
  const toggle = (listSetter, list, item) => {
    listSetter(
      list.includes(item)
        ? list.filter((x) => x !== item)
        : [...list, item]
    );
  };

  const handleSave = async () => {
    const payload = {
      name,
      email,
      permissions,
      agents: assignedAgents,
      queues,
    };

    if (isEdit && supervisor?.id) {
      await updateSupervisor({ id: supervisor.id, ...payload }).unwrap();
    } else {
      await addSupervisor(payload).unwrap();
    }

    onClose();
  };

  return (
    <div className="space-y-6 text-slate-100">

      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
        />
      </Field>

      <Field label="Email">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
        />
      </Field>

      <Field label="Permissions">
        <div className="flex flex-col gap-2">
          {PERMISSIONS.map((p) => (
            <label key={p} className="flex gap-2 items-center text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.includes(p)}
                onChange={() => toggle(setPermissions, permissions, p)}
              />
              {p}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Assign Agents">
        <div className="space-y-2">
          {agents.map((/** @type {Agent} */ a) => (
            <label key={a.id} className="flex gap-2 items-center text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={assignedAgents.includes(a.id)}
                onChange={() =>
                  toggle(setAssignedAgents, assignedAgents, a.id)
                }
              />
              {a.name}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Queues Supervised">
        <div className="flex gap-2 flex-wrap">
          {["SalesLine", "EnglishSupport"].map((q) => (
            <span
              key={q}
              onClick={() => toggle(setQueues, queues, q)}
              className={`px-3 py-1 rounded-md cursor-pointer border ${
                queues.includes(q)
                  ? "bg-sky-600 border-sky-500"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              {q}
            </span>
          ))}
        </div>
      </Field>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-700 rounded-lg text-white hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white"
        >
          Save
        </button>
      </div>

    </div>
  );
}
