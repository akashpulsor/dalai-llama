// @ts-nocheck
import React from "react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { formatBytes, formatDuration } from "../utils/time.js";

export default function VideoMetadataPanel() {
  const { state } = usePatchEditor();

  const rows = [
    ["File", state.sourceName || "—"],
    ["Duration", formatDuration(state.duration)],
    ["Resolution", state.width && state.height ? `${state.width}×${state.height}` : "—"],
    ["Size", state.sourceFile ? formatBytes(state.sourceFile.size) : "—"],
    ["Patches applied", String(state.edl.length)],
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-normal text-slate-400">Video</p>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="truncate font-bold text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
