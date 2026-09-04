// @ts-nocheck
import React, { useState } from "react";
import { ChevronDown, ChevronUp, ListTree } from "lucide-react";
import { useListShotThoughtsQuery } from "../../api/creatorEndpoints.js";

const STEP_LABEL = {
  ASSEMBLING: "Assembling shot context",
  CRITIQUE_STARTED: "Running pre-flight critique",
  CRITIQUE_PASSED: "Critique passed",
  CRITIQUE_BLOCKED: "Critique blocked — needs human review",
  DECOMPOSITION_RECOMMENDED: "Critique recommends splitting this shot",
  SHOT_PROMPT_READY: "Prompt ready for review",
  SHOT_GENERATED: "Shot generated",
  SHOT_GENERATION_FAILED: "Generation failed",
};

function labelFor(step) {
  if (STEP_LABEL[step]) return STEP_LABEL[step];
  if (step?.endsWith("_IMAGE_STARTED")) return `Generating ${step.replace("_IMAGE_STARTED", "").toLowerCase()} image`;
  if (step?.endsWith("_IMAGE_GENERATED")) return `${step.replace("_IMAGE_GENERATED", "").toLowerCase()} image generated`;
  return step || "Step";
}

/** What the backend actually did for this shot's dispatch, in order -- closed by default (this is
 * detail for someone curious, not something every shot card should open with) since a shot with
 * several image generations plus a dispatch can log a dozen-plus entries. Fetched only once opened
 * so browsing a project's shots never fires N thought-log requests up front. */
export default function ShotThoughtLog({ shotId }) {
  const [open, setOpen] = useState(false);
  const { data: thoughts = [] } = useListShotThoughtsQuery(shotId, { skip: !shotId || !open });

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
          <ListTree size={12} />
          What happened during generation
        </span>
        {open ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-3 py-2.5">
          {thoughts.length === 0 ? (
            <p className="text-[11px] font-medium text-slate-500">Nothing logged for this shot yet.</p>
          ) : (
            <ol className="space-y-2">
              {thoughts.map((t, i) => (
                <li key={i} className="flex gap-2 text-[11px]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400/60" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200">{labelFor(t.step)}</p>
                    <p className="text-slate-400">{t.message}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
