// apps/dashboard-ui/src/pages/tenant-onboarding/components/Step1TenantRegistration.jsx

import React from "react";

/**
 * @typedef {import("../TenantOnboarding.jsx").OnboardingState} OnboardingState
 */

/**
 * @typedef {Object} Step1Props
 * @property {OnboardingState} data
 * @property {(key: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => void} onChange
 */

/**
 * @param {Step1Props} props
 */
export function Step1TenantRegistration({ data, onChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-700">Tenant Registration</h2>

      {/* Company Name */}
      <div className="flex flex-col">
        <label className="font-semibold text-gray-700">Company Name</label>
        <input
          type="text"
          value={data.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
          className="p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-purple-400"
          placeholder="Enter company name"
        />
      </div>

      {/* Contact Email */}
      <div className="flex flex-col">
        <label className="font-semibold text-gray-700">Contact Email</label>
        <input
          type="email"
          value={data.contactEmail}
          onChange={(e) => onChange("contactEmail", e.target.value)}
          className="p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-purple-400"
          placeholder="contact@company.com"
        />
      </div>

      {/* Brand Image */}
      <div className="flex flex-col">
        <label className="font-semibold text-gray-700">Brand Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            if (file) {
              onChange("brandImage", file);
              onChange("brandImagePreview", URL.createObjectURL(file));
            }
          }}
          className="p-2"
        />
        {data.brandImagePreview && (
          <img
            src={data.brandImagePreview}
            alt="logo preview"
            className="h-14 mt-3 object-contain"
          />
        )}
      </div>
    </div>
  );
}
