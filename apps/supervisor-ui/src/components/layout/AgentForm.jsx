import React, { useState } from "react";
import { useAddAgentMutation, useUpdateAgentMutation } from "@dalaillama/shared-store";
import Field from "./Field.jsx";

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
 * @param {unknown} err
 * @returns {string}
 */
const getErrMsg = (err) => {
  if (typeof err === "string") return err;

  if (err && typeof err === "object" && "message" in err) {
    return /** @type {{message?:string}} */ (err).message ?? "Unexpected error";
  }

  return "Unexpected error";
};

/**
 * @param {{
 *   mode: "add" | "edit",
 *   agent?: Agent,
 *   onClose: () => void
 * }} props
 */
export default function AgentForm({ mode, agent, onClose }) {
  const isEdit = mode === "edit";

  const [addAgent] = useAddAgentMutation();
  const [updateAgent] = useUpdateAgentMutation();

  // BASE FIELDS
  const [name, setName] = useState(agent?.name ?? "");
  const [email, setEmail] = useState(agent?.email ?? "");
  const [mobile, setMobile] = useState(agent?.mobile ?? "");
  const [timezone, setTimezone] = useState("UTC+5:30");

  /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
  const [skills, setSkills] = useState(agent?.skills ?? ["Sales"]);

  /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
  const [queues, setQueues] = useState(agent?.queues ?? []);

  const [maxCalls, setMaxCalls] = useState(agent?.maxCalls ?? 3);
  const [maxChats, setMaxChats] = useState(agent?.maxChats ?? 5);

  // EXTRAS
  const [proficiency, setProficiency] = useState(agent?.proficiency ?? 3);

  const [sipUser] = useState(agent?.sipUser ?? `sip_${Date.now()}`);
  const [sipPass] = useState(
    agent?.sipPass ?? Math.random().toString(36).slice(2, 10)
  );

  const [statusMsg, setStatusMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ADD SKILL
  const handleAddSkill = () => {
    const val = prompt("Enter skill name");
    if (val) {
      setSkills(
        /** @returns {string[]} */
        (prev) => [...prev, val]
      );
    }
  };

  /**
   * @param {string} q
   */
  const toggleQueue = (q) => {
    setQueues(
      /**
       * @param {string[]} prev
       * @returns {string[]}
       */
      (prev) =>
        prev.includes(q)
          ? prev.filter(
              /** @param {string} x */ (x) => x !== q
            )
          : [...prev, q]
    );
  };

  const handleSave = async () => {
    setSubmitting(true);

    const payload = {
      name,
      email,
      mobile,
      timezone,
      skills,
      queues,
      maxCalls,
      maxChats,
      proficiency,
      sipUser,
      sipPass,
    };

    try {
      if (isEdit && agent) {
        await updateAgent({ id: agent.id, ...payload }).unwrap();
      } else {
        await addAgent(payload).unwrap();
      }

      setStatusMsg("Saved!");
      setTimeout(onClose, 500);
    } catch (err) {
      setStatusMsg(getErrMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <Field label="Full Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />
      </Field>

      <Field label="Email">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />
      </Field>

      <Field label="Mobile">
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />
      </Field>

      <Field label="Timezone">
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        >
          <option>UTC+5:30</option>
          <option>UTC+0</option>
          <option>UTC-4</option>
        </select>
      </Field>

      {/* SKILLS */}
      <Field label="Skills">
        <div className="flex gap-2 flex-wrap">
          {skills.map(
            /** @param {string} s */
            (s) => (
              <span
                key={s}
                className="px-2 py-1 bg-slate-800 border border-slate-700 text-xs rounded"
              >
                {s}
              </span>
            )
          )}

          <button
            onClick={handleAddSkill}
            className="px-2 py-1 bg-sky-600 text-white rounded text-xs"
          >
            + Add
          </button>
        </div>
      </Field>

      {/* PROFICIENCY */}
      <Field label="Proficiency (0–5)">
        <input
          type="range"
          min="0"
          max="5"
          value={proficiency}
          onChange={(e) => setProficiency(Number(e.target.value))}
          className="w-full accent-sky-600"
        />
        <div className="text-xs text-slate-400">Level: {proficiency}</div>
      </Field>

      {/* QUEUES */}
      <Field label="Assign Queues">
        <div className="flex gap-3 flex-wrap">
          {["SalesLine", "Support", "Billing"].map(
            /** @param {string} q */
            (q) => (
              <label key={q} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={queues.includes(q)}
                  onChange={() => toggleQueue(q)}
                />
                {q}
              </label>
            )
          )}
        </div>
      </Field>

      {/* Call/Chat Limits */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Max Calls">
          <input
            type="number"
            value={maxCalls}
            onChange={(e) => setMaxCalls(Number(e.target.value))}
            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
          />
        </Field>

        <Field label="Max Chats">
          <input
            type="number"
            value={maxChats}
            onChange={(e) => setMaxChats(Number(e.target.value))}
            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
          />
        </Field>
      </div>

      {/* SIP FIELDS */}
      <Field label="SIP Username">
        <div className="p-3 bg-slate-800 border border-slate-700 rounded text-slate-300">
          {sipUser}
        </div>
      </Field>

      <Field label="SIP Password">
        <div className="p-3 bg-slate-800 border border-slate-700 rounded text-slate-300">
          {sipPass}
        </div>
      </Field>

      {statusMsg && <div className="text-sm text-slate-400">{statusMsg}</div>}

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-700 rounded-lg text-white"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={submitting}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
