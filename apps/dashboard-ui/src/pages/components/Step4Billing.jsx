/**
 * Step 4 – Billing & Wallet
 *
 * Fully TS-safe version that matches TenantOnboarding.jsx:
 * onChange: (key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void
 */

import React from "react";

/**
 * @typedef {import("../TenantOnboarding.jsx").OnboardingState} OnboardingState
 */

/**
 * @typedef {Object} Step4Props
 * @property {OnboardingState} data
 * @property {(key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void} onChange
 * @property {(card: { number: string }) => void} onAddCard
 */

/**
 * @param {Step4Props} props
 */
export function Step4Billing({ data, onChange, onAddCard }) {
  return (
    <div className="space-y-6">

      {/* Card Number */}
      <div>
        <label className="block text-sm font-semibold">Card Number</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          placeholder="4111 1111 1111 1111"
          value={data.card?.number ?? ""}
          onChange={(e) =>
            onChange("card", {
              ...(data.card ?? {}),
              number: e.target.value
            })
          }
        />
      </div>

      {/* Wallet Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.enableWallet}
          onChange={(e) => onChange("enableWallet", e.target.checked)}
        />
        <span className="text-sm font-semibold">Enable Wallet Auto Top-Up</span>
      </div>

      {/* Wallet Threshold */}
      {data.enableWallet && (
        <div>
          <label className="block text-sm font-semibold">Wallet Threshold (₹)</label>
          <input
            type="number"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={data.walletThreshold}
            onChange={(e) =>
              onChange("walletThreshold", Number(e.target.value))
            }
          />
        </div>
      )}

      {/* Save Button */}
      <button
        className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
        onClick={() =>
          onAddCard({
            number: data.card?.number ?? ""
          })
        }
      >
        Save Billing Details
      </button>
    </div>
  );
}
