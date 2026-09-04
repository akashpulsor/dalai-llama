// @ts-nocheck
import React, { useRef } from "react";
import { Download, Loader2, Redo2, Repeat, Undo2, UploadCloud } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";

export default function Toolbar() {
  const { state, actions, canUndo, canRedo } = usePatchEditor();
  const fileInputRef = useRef(null);

  const handleNewVideoClick = () => fileInputRef.current?.click();
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) actions.loadSource(file);
    event.target.value = "";
  };

  const exporting = state.exportState.status === "processing";

  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Now editing</p>
        <p className="mt-1 truncate text-sm font-black text-white">{state.sourceName || "Untitled video"}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => actions.setViewMode("original")}
            className={`px-3 py-2 text-xs font-black uppercase transition ${
              state.viewMode === "original" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => actions.setViewMode("patched")}
            disabled={!state.edl.length}
            className={`px-3 py-2 text-xs font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
              state.viewMode === "patched" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            Patched preview
          </button>
        </div>

        <button
          type="button"
          onClick={actions.toggleLoop}
          title="Loop selection"
          className={`creator-control flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-slate-100 ${
            state.playback.loopSelection ? "border-purple-300/50 bg-purple-400/[0.12] text-purple-100" : ""
          }`}
        >
          <Repeat size={14} /> Loop
        </button>

        <button
          type="button"
          onClick={actions.undo}
          disabled={!canUndo}
          title="Undo"
          className="creator-control flex h-9 w-9 items-center justify-center text-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          onClick={actions.redo}
          disabled={!canRedo}
          title="Redo"
          className="creator-control flex h-9 w-9 items-center justify-center text-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Redo2 size={15} />
        </button>

        <button
          type="button"
          onClick={handleNewVideoClick}
          className="creator-control flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-slate-100"
        >
          <UploadCloud size={14} /> New video
        </button>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

        <button
          type="button"
          onClick={actions.exportFinal}
          disabled={!state.sourceFile || exporting}
          className="flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exporting ? `Exporting ${Math.round(state.exportState.progress * 100)}%` : "Export final video"}
        </button>
      </div>
    </div>
  );
}
