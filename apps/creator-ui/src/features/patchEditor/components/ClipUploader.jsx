// @ts-nocheck
import React, { useRef } from "react";
import { AlertTriangle, Loader2, UploadCloud } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";

export default function ClipUploader() {
  const { state, actions } = usePatchEditor();
  const { replacement, selection } = state;
  const inputRef = useRef(null);
  const processing = replacement.status === "processing";

  const handleClick = () => inputRef.current?.click();
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) actions.uploadReplacement(file);
    event.target.value = "";
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!selection || processing}
        className="creator-control flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        {processing ? "Reading clip…" : "Upload edited clip"}
      </button>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
      {replacement.status === "error" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle size={12} /> {replacement.error}
        </p>
      )}
      <p className="mt-2 text-[11px] font-semibold text-slate-600">Replaces the current selection and switches to Patched preview.</p>
    </div>
  );
}
