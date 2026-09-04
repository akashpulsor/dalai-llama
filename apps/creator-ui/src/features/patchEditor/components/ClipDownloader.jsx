// @ts-nocheck
import React from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";

export default function ClipDownloader() {
  const { state, actions } = usePatchEditor();
  const { extraction, selection } = state;
  const processing = extraction.status === "processing";

  return (
    <div>
      <button
        type="button"
        onClick={actions.downloadClip}
        disabled={!selection || processing}
        className="creator-primary flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {processing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {processing ? `Cutting clip ${Math.round(extraction.progress * 100)}%` : "Download selected clip"}
      </button>
      {extraction.status === "error" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle size={12} /> {extraction.error}
        </p>
      )}
      {extraction.status === "done" && !processing && (
        <p className="mt-2 text-[11px] font-semibold text-emerald-300">Saved {extraction.filename}. Edit it externally, then upload it back below.</p>
      )}
    </div>
  );
}
