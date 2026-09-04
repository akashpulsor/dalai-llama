// @ts-nocheck
import React from "react";
import { Film, Scissors, X } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { formatDuration } from "../utils/time.js";

const isDelete = (entry) => entry?.kind === "delete" || !entry?.replacementUrl;

export default function PatchList() {
  const { state, actions } = usePatchEditor();

  if (!state.edl.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-normal text-slate-400">Patches (EDL)</p>
      <ul className="space-y-2">
        {state.edl.map((entry) => {
          const deleted = isDelete(entry);
          return (
            <li
              key={entry.id}
              className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                deleted ? "border-rose-300/20 bg-rose-400/10" : "border-emerald-300/20 bg-emerald-400/10"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {deleted ? (
                  <Scissors size={14} className="shrink-0 text-rose-200" />
                ) : (
                  <Film size={14} className="shrink-0 text-emerald-200" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-200">{entry.replacementName}</p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {formatDuration(entry.start)}–{formatDuration(entry.end)} {deleted ? "removed" : "replaced"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => actions.removePatch(entry.id)}
                title={deleted ? "Undo this cut" : "Remove this patch"}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-white/10 hover:text-rose-300"
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
