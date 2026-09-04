// @ts-nocheck
import React, { useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { useListUpscaleModelsQuery } from "../../../api/creatorEndpoints.js";

export default function UpscalePanel() {
  const { state, actions } = usePatchEditor();
  const { upscale, sourceHostedUrl } = state;
  const { data: models = [], isLoading: modelsLoading } = useListUpscaleModelsQuery();
  const [selectedModel, setSelectedModel] = useState("");

  const processing = upscale.status === "processing";
  const canUpscale = !!sourceHostedUrl && !processing;
  const selectedLabel = selectedModel;

  const handleUpscale = () => {
    if (!canUpscale) return;
    actions.upscaleVideo(selectedModel || undefined);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Upscale</p>
        <span className="rounded border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-100">Beta</span>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-slate-500">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-emerald-300" />
        Runs the whole clip through a chosen upscale model, then replaces it here with the result.
      </p>

      {!sourceHostedUrl && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-amber-300">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          Only available for a video pulled from a project (not a raw local upload).
        </p>
      )}

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Model</span>
        <select
          value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
          disabled={processing || modelsLoading}
          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs font-bold text-slate-100 focus:border-emerald-400/60 focus:outline-none disabled:opacity-60"
        >
          <option value="" className="bg-slate-950 text-slate-100">
            {modelsLoading ? "Loading models…" : "Default model"}
          </option>
          {models.map((model) => (
            <option key={model.modelId} value={model.modelId} className="bg-slate-950 text-slate-100">
              {model.modelId}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={handleUpscale}
        disabled={!canUpscale}
        className="creator-primary mt-3 flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {processing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {processing ? "Upscaling…" : selectedLabel ? `Upscale with ${selectedLabel}` : "Upscale"}
      </button>

      {upscale.status === "error" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle size={12} /> {upscale.error}
        </p>
      )}
      <p className="mt-2 text-[11px] font-semibold text-slate-600">
        Upscaling runs on the full video and can take a few minutes. The result loads back onto the timeline.
      </p>
    </div>
  );
}
