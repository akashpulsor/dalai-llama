// src/pages/admin/RoutingRules/RoutingRuleForm.jsx
import React, { useState } from "react";
import Field from "./Field.jsx";

import {
  useAddRoutingRuleMutation,
  useUpdateRoutingRuleMutation,
  useGetQueuesQuery,
  useGetBotsQuery,
  useGetIvrsQuery
} from "@dalaillama/shared-store";

const FIELD_OPTIONS = ["Caller ID", "Time"];
const OPERATORS = ["equals", "contains", "between"];
const DEST_TYPES = ["Queue", "IVR", "Bot"];
const COMBINE = ["AND", "OR"];
const FALLBACKS = ["Queue", "IVR", "End Call"];

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
 *   mode: "add"|"edit",
 *   rule?: RoutingRule,
 *   onClose: ()=>void
 * }} props
 */
export default function RoutingRuleForm({ mode, rule, onClose }) {
  const isEdit = mode === "edit";

  const [addRule] = useAddRoutingRuleMutation();
  const [updateRule] = useUpdateRoutingRuleMutation();

  const { data: queues = [] } = useGetQueuesQuery();
  const { data: bots = [] } = useGetBotsQuery();
  const { data: ivrs = [] } = useGetIvrsQuery();

  /** @type {[string, (v:string)=>void]} */
  const [name, setName] = useState(rule?.name ?? "");

  /**
   * @type {[ RoutingRuleCondition[],
   *   (v: RoutingRuleCondition[] |
   *      ((prev: RoutingRuleCondition[]) => RoutingRuleCondition[])
   *   ) => void ]}
   */
  const [conditions, setConditions] = useState(
    rule?.conditions ?? [{ field: "Caller ID", operator: "equals", value: "" }]
  );

  /** @type {["AND"|"OR", (v:"AND"|"OR")=>void]} */
  const [combine, setCombine] = useState(rule?.combine ?? "AND");

  /** @type {["Queue"|"IVR"|"Bot", (v:"Queue"|"IVR"|"Bot")=>void]} */
  const [destinationType, setDestinationType] = useState(
    rule?.destinationType ?? "Queue"
  );

  /** @type {[string, (v:string)=>void]} */
  const [destination, setDestination] = useState(rule?.destination ?? "");

  /** @type {[string, (v:string)=>void]} */
  const [fallback, setFallback] = useState(rule?.fallback ?? "End Call");

  /** Add Condition */
  const addCondition = () => {
    setConditions(
      /** @param {RoutingRuleCondition[]} prev */
      (prev) => [
        ...prev,
        { field: "Caller ID", operator: "equals", value: "" }
      ]
    );
  };

  /**
   * Update a condition row
   * @param {number} i
   * @param {"field"|"operator"|"value"} key
   * @param {string} value
   */
  const updateCondition = (i, key, value) => {
    setConditions(
      /** @param {RoutingRuleCondition[]} prev */
      (prev) =>
        prev.map(
          /**
           * @param {RoutingRuleCondition} c
           * @param {number} idx
           */
          (c, idx) => (idx === i ? { ...c, [key]: value } : c)
        )
    );
  };

  /** SAVE handler */
  const handleSave = async () => {
    if (isEdit && !rule) return;

    const payload = {
      name,
      conditions,
      combine,
      destinationType,
      destination,
      fallback
    };

    if (isEdit && rule) {
      await updateRule({ id: rule.id, ...payload });
    } else {
      await addRule(payload);
    }

    onClose();
  };

  return (
    <div className="space-y-6 text-slate-100">

      {/* NAME */}
      <Field label="Rule Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded text-white"
        />
      </Field>

      {/* CONDITIONS */}
      <Field label="IF Conditions">
        <div className="space-y-4">

          {conditions.map(
            /**
             * @param {RoutingRuleCondition} c
             * @param {number} i
             */
            (c, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 bg-slate-800 p-3 rounded border border-slate-700"
              >
                <div className="flex gap-2">

                  {/* FIELD */}
                  <select
                    value={c.field}
                    onChange={(e) => updateCondition(i, "field", e.target.value)}
                    className="p-2 rounded bg-slate-900 border border-slate-700 text-white flex-1"
                  >
                    {FIELD_OPTIONS.map(
                      /** @param {string} f */
                      (f) => (
                        <option key={f}>{f}</option>
                      )
                    )}
                  </select>

                  {/* OPERATOR */}
                  <select
                    value={c.operator}
                    onChange={(e) =>
                      updateCondition(i, "operator", e.target.value)
                    }
                    className="p-2 rounded bg-slate-900 border border-slate-700 text-white flex-1"
                  >
                    {OPERATORS.map(
                      /** @param {string} op */
                      (op) => (
                        <option key={op}>{op}</option>
                      )
                    )}
                  </select>

                  {/* VALUE */}
                  <input
                    value={c.value}
                    onChange={(e) =>
                      updateCondition(i, "value", e.target.value)
                    }
                    placeholder="Value…"
                    className="p-2 rounded bg-slate-900 border border-slate-700 text-white flex-1"
                  />
                </div>
              </div>
            )
          )}

          <button
            onClick={addCondition}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm"
          >
            + Add Condition
          </button>

          {/* COMBINE */}
          <div className="pt-2">
            Combine With:
            <select
              value={combine}
              onChange={(e) =>
                setCombine(
                  /** @type {"AND"|"OR"} */ (e.target.value)
                )
              }
              className="ml-2 p-2 bg-slate-900 border border-slate-700 text-white rounded"
            >
              {COMBINE.map(
                /** @param {string} d */
                (d) => (
                  <option key={d}>{d}</option>
                )
              )}
            </select>
          </div>
        </div>
      </Field>

      {/* ROUTE TO */}
      <Field label="Route To">
        <div className="flex flex-col gap-3">

          <select
            value={destinationType}
            onChange={(e) =>
              setDestinationType(
                /** @type {"Queue"|"IVR"|"Bot"} */ (e.target.value)
              )
            }
            className="p-3 rounded bg-slate-900 border border-slate-700 text-white"
          >
            {DEST_TYPES.map(
              /** @param {string} d */
              (d) => (
                <option key={d}>{d}</option>
              )
            )}
          </select>

          {/* Queue Picker */}
          {destinationType === "Queue" && (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="p-3 rounded bg-slate-900 border border-slate-700 text-white"
            >
              <option value="">Select Queue</option>
              {queues.map(
                /** @param {{id:string,name:string}} q */
                (q) => (
                  <option key={q.id} value={q.name}>
                    {q.name}
                  </option>
                )
              )}
            </select>
          )}

          {/* IVR Picker */}
          {destinationType === "IVR" && (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="p-3 rounded bg-slate-900 border border-slate-700 text-white"
            >
              <option value="">Select IVR</option>
              {ivrs.map(
                /** @param {{id:string,name:string}} ivr */
                (ivr) => (
                  <option key={ivr.id} value={ivr.name}>
                    {ivr.name}
                  </option>
                )
              )}
            </select>
          )}

          {/* Bot Picker */}
          {destinationType === "Bot" && (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="p-3 rounded bg-slate-900 border border-slate-700 text-white"
            >
              <option value="">Select Bot</option>
              {bots.map(
                /** @param {{id:string,name:string}} b */
                (b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                )
              )}
            </select>
          )}
        </div>
      </Field>

      {/* FALLBACK */}
      <Field label="Fallback">
        <select
          value={fallback}
          onChange={(e) => setFallback(e.target.value)}
          className="p-3 bg-slate-900 border border-slate-700 text-white rounded w-full"
        >
          {FALLBACKS.map(
            /** @param {string} f */
            (f) => (
              <option key={f}>{f}</option>
            )
          )}
        </select>
      </Field>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-700 text-white rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}
