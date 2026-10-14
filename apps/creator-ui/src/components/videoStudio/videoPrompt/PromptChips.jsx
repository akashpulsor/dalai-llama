import React from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { PromptFreshness, PromptOrigin, PromptState } from "./promptModel.js";

const TONES = {
  slate: "border-white/10 bg-white/5 text-slate-300",
  purple: "border-purple-400/25 bg-purple-500/10 text-purple-200",
  sky: "border-sky-400/25 bg-sky-500/10 text-sky-200",
  green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
};

/** @param {{ tone?: keyof typeof TONES, title?: string, children: React.ReactNode }} props */
export function Chip({ tone = "slate", title, children }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** "v3", "v3 · draft", plus who wrote it. */
export function PromptVersionChip({ version }) {
  return (
    <>
      <Chip tone="purple">v{version.version}{version.state === PromptState.DRAFT && !version.promptId ? " · draft" : ""}</Chip>
      <Chip tone={version.origin === PromptOrigin.USER_EDITED ? "sky" : "slate"}>
        {version.origin === PromptOrigin.USER_EDITED ? "Edited by you" : "AI-written"}
      </Chip>
    </>
  );
}

/** @param {{ freshness: string, staleReason: string | null }} props */
export function PromptFreshnessBadge({ freshness, staleReason }) {
  if (freshness === PromptFreshness.STALE) {
    return <Chip tone="amber" title={staleReason ?? undefined}><RefreshCw size={10} /> Out of date: {staleReason}</Chip>;
  }
  return <Chip tone="green"><CheckCircle2 size={10} /> Up to date</Chip>;
}
