// @ts-nocheck
import React, { useMemo, useState } from "react";
import { AlertTriangle, Languages, Loader2 } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { useListDialogueLanguagesQuery } from "../../../api/creatorEndpoints.js";

// A short fallback so the panel is still usable if the master-data call is slow/unavailable.
const FALLBACK_LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ar", label: "Arabic" },
];

export default function DubPanel() {
  const { state, actions } = usePatchEditor();
  const { dub } = state;
  const { data: fetchedLanguages = [] } = useListDialogueLanguagesQuery();
  const [selectedCode, setSelectedCode] = useState("");

  const languages = fetchedLanguages.length ? fetchedLanguages : FALLBACK_LANGUAGES;
  const processing = dub.status === "processing";
  const selectedLabel = useMemo(
    () => languages.find((lang) => lang.code === selectedCode)?.label || "",
    [languages, selectedCode]
  );

  const handleDub = () => {
    if (!selectedLabel || processing) return;
    // The backend feeds targetLanguage into the translation prompt, so pass the human-readable
    // label ("Hindi"), not the code.
    actions.dubVideo(selectedLabel);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Dub / change language</p>
        <span className="rounded border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-sky-100">Beta</span>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-slate-500">
        <Languages size={13} className="mt-0.5 shrink-0 text-sky-300" />
        Re-voices the spoken dialogue in another language — clones the speaker, synthesizes the
        translation and lip-syncs the talking parts, then replaces the whole clip here.
      </p>

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Target language</span>
        <select
          value={selectedCode}
          onChange={(event) => setSelectedCode(event.target.value)}
          disabled={processing}
          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs font-bold text-slate-100 focus:border-sky-400/60 focus:outline-none disabled:opacity-60"
        >
          <option value="" className="bg-slate-950 text-slate-100">Select a language…</option>
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-100">
              {lang.label}
              {lang.nativeLabel && lang.nativeLabel !== lang.label ? ` (${lang.nativeLabel})` : ""}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={handleDub}
        disabled={!selectedLabel || processing}
        className="creator-primary mt-3 flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {processing ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
        {processing ? dub.statusLabel || "Dubbing…" : selectedLabel ? `Dub into ${selectedLabel}` : "Dub into language"}
      </button>

      {dub.status === "error" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle size={12} /> {dub.error}
        </p>
      )}
      <p className="mt-2 text-[11px] font-semibold text-slate-600">
        Dubbing runs on the full video and can take a few minutes. The result loads back onto the timeline.
      </p>
    </div>
  );
}
