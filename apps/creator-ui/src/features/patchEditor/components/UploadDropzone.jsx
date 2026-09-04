// @ts-nocheck
import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, Loader2, UploadCloud } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";

export default function UploadDropzone() {
  const { state, actions } = usePatchEditor();
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const loading = state.status === "loading";

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (file) actions.loadSource(file);
    },
    [actions]
  );

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <section className="creator-panel overflow-hidden p-4 sm:p-5">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors ${
          isDragOver
            ? "border-purple-300/50 bg-[linear-gradient(135deg,rgba(109,63,216,0.22),rgba(15,23,42,0.88))]"
            : "border-purple-300/25 bg-[linear-gradient(135deg,rgba(109,63,216,0.12),rgba(15,23,42,0.88))]"
        }`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-purple-400/15 text-purple-100">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
        </span>
        <div>
          <p className="text-lg font-black text-white">{loading ? "Reading video…" : "Upload a video to patch"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">Drag & drop, or click to browse. MP4/WebM recommended.</p>
        </div>
        {state.status === "error" && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
            <AlertTriangle size={14} /> {state.error}
          </p>
        )}
        <button type="button" onClick={() => inputRef.current?.click()} className="creator-control mt-2 flex min-h-9 items-center gap-2 px-4 text-xs font-black text-slate-100">
          <UploadCloud size={14} /> Choose video
        </button>
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleFiles(event.target.files)} />
      </div>
    </section>
  );
}
