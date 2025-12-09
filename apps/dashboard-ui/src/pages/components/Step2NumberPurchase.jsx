/**
 * Step 2 – Number Purchase
 *
 * This version is fully TS-safe and matches TenantOnboarding.jsx:
 * onChange: (key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void
 */

import React, { useState } from "react";

/**
 * @typedef {import("../TenantOnboarding.jsx").OnboardingState} OnboardingState
 */

/**
 * @typedef {Object} DID
 * @property {string} did
 * @property {string} country
 * @property {string} [countryCode]
 * @property {string} [type]
 */

/**
 * @typedef {Object} Step2Props
 * @property {OnboardingState} data
 * @property {(key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void} onChange
 * @property {DID[]} didInventory
 * @property {(didId: string) => void} onPurchase
 */

/**
 * @param {Step2Props} props
 */
export function Step2NumberPurchase({ data, onChange, didInventory, onPurchase }) {
  const [selected, setSelected] = useState(data.selectedDid ?? "");

  return (
    <div className="space-y-6">
      {/* Country */}
      <div>
        <label className="block text-sm font-semibold">Select Country</label>
        <select
          className="mt-1 w-full border rounded-lg px-3 py-2"
          value={data.country ?? ""}
          onChange={(e) => onChange("country", e.target.value)}
        >
          <option value="">-- choose --</option>
          <option value="US">United States</option>
          <option value="IN">India</option>
          <option value="UK">United Kingdom</option>
          <option value="AU">Australia</option>
        </select>
      </div>

      {/* DID list */}
      <div>
        <p className="text-sm font-semibold mb-2">Available Numbers</p>

        <div className="grid grid-cols-1 gap-3">
          {didInventory.map((d) => (
            <label
              key={d.did}
              className={`border px-4 py-3 rounded-xl cursor-pointer shadow-sm flex items-center gap-3
                ${
                  selected === d.did
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-300"
                }`}
            >
              <input
                type="radio"
                className="mr-2"
                checked={selected === d.did}
                onChange={() => {
                  setSelected(d.did);
                  onChange("selectedDid", d.did);
                }}
              />
              <div>
                <p className="font-medium">{d.did}</p>
                <p className="text-xs text-gray-500">{d.country}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Purchase */}
      <button
        className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
        onClick={() => onPurchase(selected)}
        disabled={!selected}
      >
        Purchase Number
      </button>
    </div>
  );
}
