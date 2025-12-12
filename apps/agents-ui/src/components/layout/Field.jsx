import React from "react";

/**
 * @param {{ label: string, children: React.ReactNode }} props
 */
export default function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}
