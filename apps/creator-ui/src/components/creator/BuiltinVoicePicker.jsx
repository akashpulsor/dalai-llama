// @ts-nocheck
import React, { useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { useListBuiltinVoicesQuery } from "../../api/creatorEndpoints.js";
import { normalizeGender } from "../../utils/gender.js";

// Only the codes language_master actually seeds for this catalog today (see llm-gateway's
// builtin_voice migration) -- not a general-purpose language-name lookup, just display labels for
// whatever shows up in the fetched voices' own languageCodes.
const LANGUAGE_LABEL = { "en-US": "English", "hi-IN": "Hindi" };

/** Alternative to VoiceSampleField for a character with no recorded sample: pick a stock
 * ElevenLabs voice instead. Gender is a default/suggestion only -- picking a voice from the other
 * tab is always allowed, just flagged with a warning, since CastProfile.gender is free text and
 * this shouldn't hard-block on it. Dialect/language and gender each narrow the list instead of
 * showing every voice at once. */
export default function BuiltinVoicePicker({ gender, selectedVoiceId, onSelect }) {
  const { data: voices = [], isLoading } = useListBuiltinVoicesQuery();
  const suggestedGender = normalizeGender(gender);
  const [activeGender, setActiveGender] = useState(suggestedGender || "MALE");
  const [activeLanguage, setActiveLanguage] = useState(null); // null = any language

  const languages = useMemo(() => {
    const codes = new Set();
    voices.forEach((v) => (v.languageCodes || []).forEach((c) => codes.add(c)));
    return Array.from(codes).sort();
  }, [voices]);

  const selected = useMemo(() => voices.find((v) => v.providerVoiceId === selectedVoiceId) || null, [voices, selectedVoiceId]);
  const shown = useMemo(
    () =>
      voices.filter(
        (v) => v.gender === activeGender && (!activeLanguage || (v.languageCodes || []).includes(activeLanguage))
      ),
    [voices, activeGender, activeLanguage]
  );
  const mismatch = selected && suggestedGender && selected.gender !== suggestedGender;

  if (isLoading) {
    return <p className="text-[11px] font-medium text-slate-500">Loading voices…</p>;
  }
  if (!voices.length) {
    return <p className="text-[11px] font-medium text-slate-500">No built-in voices configured yet.</p>;
  }

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Built-in voice</label>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <div className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
          {["MALE", "FEMALE"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGender(g)}
              className={`rounded px-2 py-1 text-[10px] font-bold ${activeGender === g ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
            >
              {g === "MALE" ? "Male" : "Female"}
            </button>
          ))}
        </div>
        {languages.length > 1 && (
          <div className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setActiveLanguage(null)}
              className={`rounded px-2 py-1 text-[10px] font-bold ${!activeLanguage ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
            >
              Any language
            </button>
            {languages.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveLanguage(code)}
                className={`rounded px-2 py-1 text-[10px] font-bold ${activeLanguage === code ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
              >
                {LANGUAGE_LABEL[code] || code}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {shown.map((voice) => {
          const isSelected = voice.providerVoiceId === selectedVoiceId;
          return (
            <div
              key={voice.voiceId}
              className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 ${
                isSelected ? "border-purple-400/40 bg-purple-500/10" : "border-white/10 bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(voice)}
                className={`flex flex-1 items-center gap-1.5 text-left text-[11px] font-semibold ${
                  isSelected ? "text-purple-100" : "text-slate-300 hover:text-purple-200"
                }`}
              >
                {isSelected && <Check size={12} className="shrink-0 text-purple-300" />}
                {voice.displayName}
              </button>
              {voice.previewAudioUrl && (
                <audio controls preload="none" src={voice.previewAudioUrl} className="h-7 w-32 shrink-0" />
              )}
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-[11px] font-medium italic text-slate-500">No matching voices.</p>}
      </div>

      {mismatch && (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-amber-300">
          <AlertTriangle size={11} />
          This voice is listed as {selected.gender.toLowerCase()}; the character's gender is {gender}.
        </p>
      )}
    </div>
  );
}
