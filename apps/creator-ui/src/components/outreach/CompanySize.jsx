import React from "react";
import { MailX } from "lucide-react";

/** The API's company size codes and how they read. */
export const COMPANY_SIZES = [
  ["SMALL", "Small"],
  ["MEDIUM", "Medium"],
  ["LARGE", "Large"],
  ["ENTERPRISE", "Enterprise"],
];

const LABELS = Object.fromEntries(COMPANY_SIZES);

export function SizeBadge({ size }) {
  if (!size) return null;
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-normal text-slate-300">
      {LABELS[size] || size}
    </span>
  );
}

/** Shown where a brand or lead has no email we can send to. */
export function NoEmailFlag({ children = "Email not available" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-bold text-amber-200">
      <MailX size={11} /> {children}
    </span>
  );
}
