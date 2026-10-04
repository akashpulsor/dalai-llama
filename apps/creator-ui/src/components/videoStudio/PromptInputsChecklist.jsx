import React from "react";
import { CheckCircle2, Circle, ListChecks, Loader2 } from "lucide-react";
import { useGetShotPromptInputsQuery } from "../../api/creatorEndpoints.js";

/**
 * What this shot's video prompt is built from -- creative direction, script, screenplay, frames,
 * lighting plan and the rest -- ticked when present. Shown on every shot card, clip or not, so a
 * shot can be checked before and after generating.
 */
export default function PromptInputsChecklist({ projectId, shotId }) {
  const { data: inputs, isFetching, isError, refetch } = useGetShotPromptInputsQuery({ projectId, shotId });
  const present = inputs?.filter((item) => item.present).length ?? 0;

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
          <ListChecks size={12} /> What the prompt is built from
          {inputs && <span className="font-bold normal-case text-slate-500">{present}/{inputs.length}</span>}
        </p>
        <button type="button" onClick={refetch} disabled={isFetching} className="text-[10px] font-bold text-purple-300 disabled:opacity-50">
          {isFetching ? <Loader2 size={11} className="animate-spin" /> : "Recheck"}
        </button>
      </div>
      {isError && <p className="mt-1 text-[10px] text-amber-200">Could not read this shot's inputs.</p>}
      {inputs && (
        <ul className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
          {inputs.map((item) => (
            <li key={item.key} className="flex gap-1.5 text-[11px]" title={item.detail}>
              {item.present ? <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-300" /> : <Circle size={12} className="mt-0.5 shrink-0 text-slate-600" />}
              <span>
                <span className={item.present ? "font-bold text-slate-200" : "font-bold text-slate-500"}>{item.label}</span>
                <span className="block text-[10px] text-slate-500 line-clamp-2">{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
