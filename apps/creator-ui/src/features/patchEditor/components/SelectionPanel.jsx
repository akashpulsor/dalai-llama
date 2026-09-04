// @ts-nocheck
import React from "react";
import { Scissors } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { clamp, formatDuration } from "../utils/time.js";
import ClipDownloader from "./ClipDownloader.jsx";
import ClipUploader from "./ClipUploader.jsx";

export default function SelectionPanel() {
  const { state, actions } = usePatchEditor();
  const { selection, duration } = state;

  if (!selection) return null;

  const clipDuration = Math.max(selection.outPoint - selection.inPoint, 0);

  const handleInChange = (event) => {
    const value = clamp(Number(event.target.value), 0, duration);
    actions.setSelection(value, selection.outPoint);
  };

  const handleOutChange = (event) => {
    const value = clamp(Number(event.target.value), 0, duration);
    actions.setSelection(selection.inPoint, value);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-normal text-slate-400">Selection</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Start (s)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={duration}
            value={selection.inPoint.toFixed(2)}
            onChange={handleInChange}
            className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 font-mono text-slate-100 focus:border-purple-400/60 focus:outline-none"
          />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">End (s)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={duration}
            value={selection.outPoint.toFixed(2)}
            onChange={handleOutChange}
            className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 font-mono text-slate-100 focus:border-purple-400/60 focus:outline-none"
          />
        </label>
        <div className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Duration</span>
          <div className="flex h-9 items-center rounded-lg border border-white/10 bg-black/20 px-2 font-mono text-slate-300">
            {formatDuration(clipDuration)}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={actions.deleteSelection}
          disabled={clipDuration <= 0}
          className="flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 text-xs font-black text-rose-100 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Scissors size={14} /> Cut / delete this section
        </button>
        <ClipDownloader />
        <ClipUploader />
      </div>
    </div>
  );
}
