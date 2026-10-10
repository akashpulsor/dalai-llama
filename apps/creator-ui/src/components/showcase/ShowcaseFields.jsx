// @ts-nocheck
import React from "react";
import { FORMATS, INDUSTRIES } from "./showcaseLabels.js";

const selectClass =
  "w-full rounded-lg border border-white/10 bg-[#0b101c] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500";

/** Industry, format, how the client is described, and the rights confirmation: the fields every
 * way of putting a video on the profile asks for. */
export default function ShowcaseFields({ value, onChange, showRights = true }) {
  const set = (key, v) => onChange({ ...value, [key]: v });
  return (
    <div className="mt-4 grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Industry</span>
          <select id="industry" value={value.industry} onChange={(e) => set("industry", e.target.value)} className={selectClass}>
            {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Format</span>
          <select id="format" value={value.format} onChange={(e) => set("format", e.target.value)} className={selectClass}>
            {FORMATS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>How should we describe the client?</span>
        <input
          id="clientLabel"
          value={value.clientLabel}
          onChange={(e) => set("clientLabel", e.target.value)}
          maxLength={80}
          placeholder="D2C skincare brand"
          className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
        />
        <span className="mt-1 block text-[11px] text-slate-500">The client's name stays hidden unless you write it here.</span>
      </label>
      {showRights && (
        <label className="flex items-start gap-3">
          <input
            id="rightsConfirmed"
            type="checkbox"
            checked={value.rightsConfirmed}
            onChange={(e) => set("rightsConfirmed", e.target.checked)}
            className="mt-1 h-4 w-4 accent-purple-500"
          />
          <span className="text-sm text-slate-300">I have the client's permission to show this video publicly.</span>
        </label>
      )}
    </div>
  );
}
