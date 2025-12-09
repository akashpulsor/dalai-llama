/**
 * Step 5 – Admin User + SIP Trunk Config
 *
 * Fully TS-safe version.
 */

import React from "react";

/**
 * @typedef {import("../TenantOnboarding.jsx").OnboardingState} OnboardingState
 */

/**
 * @typedef {Object} Step5Props
 * @property {OnboardingState} data
 * @property {(key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void} onChange
 */

/**
 * @param {Step5Props} props
 */
export function Step5AdminTelephony({ data, onChange }) {
  return (
    <div className="space-y-6">
      {/* Admin Email */}
      <div>
        <label className="block text-sm font-semibold">Admin Email</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          placeholder="admin@company.com"
          value={data.adminEmail}
          onChange={(e) => onChange("adminEmail", e.target.value)}
        />
      </div>

      {/* SIP Host */}
      <div>
        <label className="block text-sm font-semibold">SIP Trunk Host</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          placeholder="sip.company.com"
          value={data.sipHost}
          onChange={(e) => onChange("sipHost", e.target.value)}
        />
      </div>

      {/* Default DID */}
      <div>
        <label className="block text-sm font-semibold">Default DID</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          placeholder="+1 555 555 5555"
          value={data.defaultDid}
          onChange={(e) => onChange("defaultDid", e.target.value)}
        />
      </div>
    </div>
  );
}
