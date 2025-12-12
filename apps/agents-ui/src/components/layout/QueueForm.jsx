// src/pages/admin/QueueManagement/QueueForm.jsx
import React, { useState } from "react";
import Field from "./Field.jsx";

import {
  useAddQueueMutation,
  useUpdateQueueMutation
} from "@dalaillama/shared-store";

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
export default function QueueForm({ mode, queue, onClose }) {
  const isEdit = mode === "edit";

  const [addQueue] = useAddQueueMutation();
  const [updateQueue] = useUpdateQueueMutation();

  const [name, setName] = useState(queue?.name ?? "");
  const [strategy, setStrategy] = useState(queue?.strategy ?? "Round Robin");

  const [maxWait, setMaxWait] = useState(queue?.maxWait ?? 45);
  const [maxSize, setMaxSize] = useState(queue?.maxSize ?? 25);
  const [wrapUp, setWrapUp] = useState(queue?.wrapUp ?? 10);

  const [skills, setSkills] = useState(queue?.skills ?? []);
  const [slaTime, setSlaTime] = useState(queue?.slaTime ?? 20);
  const [slaPercent, setSlaPercent] = useState(queue?.slaPercent ?? 80);

  const [businessHours, setBusinessHours] =
    useState(queue?.businessHours ?? "Default Business Hours");

  const addSkill = () => {
    const s = prompt("Enter skill name");
    if (s)
      setSkills(
        /**
         * @param {string[]} prev
         */
        prev => [...prev, s]
      );
  };

  const handleSave = async () => {
    const payload = {
      name,
      strategy,
      maxWait,
      maxSize,
      wrapUp,
      skills,
      slaTime,
      slaPercent,
      businessHours
    };

    if (isEdit && queue) {
      await updateQueue({ id: queue.id, ...payload });
    } else {
      await addQueue(payload);
    }

    onClose();
  };

  return (
    <div className="space-y-6 text-slate-100">

      <Field label="Queue Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        />
      </Field>

      <Field label="Strategy">
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        >
          <option>Round Robin</option>
          <option>Skill</option>
          <option>Least Busy</option>
        </select>
      </Field>

      <Field label="Max Wait Time (sec)">
        <input
          type="number"
          value={maxWait}
          onChange={(e) => setMaxWait(Number(e.target.value))}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        />
      </Field>

      <Field label="Max Queue Size">
        <input
          type="number"
          value={maxSize}
          onChange={(e) => setMaxSize(Number(e.target.value))}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        />
      </Field>

      <Field label="Wrap-up Time (sec)">
        <input
          type="number"
          value={wrapUp}
          onChange={(e) => setWrapUp(Number(e.target.value))}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        />
      </Field>

      {/* Skills */}
      <Field label="Skills Required">
        <div className="flex gap-2 flex-wrap">
          {skills.map(
            /**
             * @param {string} s
             */
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
            onClick={addSkill}
            className="px-2 py-1 bg-sky-600 text-white rounded text-xs"
          >
            + Add Skill
          </button>
        </div>
      </Field>

      {/* SLA */}
      <Field label="SLA Target Answer Time (sec)">
        <input
          type="number"
          value={slaTime}
          onChange={(e) => setSlaTime(Number(e.target.value))}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        />
      </Field>

      <Field label="SLA Target (%)">
        <input
          type="number"
          value={slaPercent}
          onChange={(e) => setSlaPercent(Number(e.target.value))}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        />
      </Field>

      {/* Business Hours */}
      <Field label="Business Hours">
        <select
          value={businessHours}
          onChange={(e) => setBusinessHours(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded"
        >
          <option>Default Business Hours</option>
          <option>24/7</option>
        </select>
      </Field>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-700 rounded text-white"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
