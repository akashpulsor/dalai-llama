/**
 * Step 3 – Plan Selection
 *
 * TS-safe version matching TenantOnboarding.jsx onChange signature.
 */

import React from "react";

/**
 * @typedef {import("../TenantOnboarding.jsx").OnboardingState} OnboardingState
 */

/**
 * @typedef {Object} Plan
 * @property {string} id
 * @property {string} name
 * @property {number} priceMonthly
 * @property {string[]} features
 */

/**
 * @typedef {Object} Step3Props
 * @property {OnboardingState} data
 * @property {(key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void} onChange
 * @property {Plan[]} plans
 * @property {(plan: Plan) => void} onSelect
 */

/**
 * @param {Step3Props} props
 */
export function Step3PlanSelection({ data, onChange, plans, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans.map((p) => (
        <div
          key={p.id}
          className={`border rounded-2xl p-5 cursor-pointer transition-all shadow-md ${
            data.planId === p.id
              ? "border-purple-600 bg-purple-50"
              : "border-gray-300 hover:border-purple-400"
          }`}
          onClick={() => {
            onChange("planId", p.id);
            onSelect(p);
          }}
        >
          <h3 className="text-lg font-bold text-purple-700">{p.name}</h3>
          <p className="text-gray-700">₹{p.priceMonthly}/month</p>

          <ul className="text-sm mt-3 space-y-1">
            {p.features.map((f, i) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
