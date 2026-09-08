// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Play, Square } from "lucide-react";
import { useListBuiltinVoicesQuery, useListDialogueLanguagesQuery } from "../../api/creatorEndpoints.js";
import { normalizeGender } from "../../utils/gender.js";

/** Alternative to VoiceSampleField for a character with no recorded sample: pick a stock
 * ElevenLabs voice instead. Gender is a default/suggestion only -- picking a voice from the other
 * tab is always allowed, just flagged with a warning, since CastProfile.gender is free text.
 *
 * <p>Rendered as three dropdowns (language, gender, voice) plus one preview player for the
 * currently-selected voice, deliberately scale-first: today's catalog is ~30 voices across a
 * couple of languages, but the tenant is expected to keep adding voices and languages -- a chip
 * strip works for the couple-of-languages case and becomes a wall of buttons at ten. A native
 * <select> stays compact at any count. */
export default function BuiltinVoicePicker({ gender, selectedVoiceId, onSelect }) {
  const { data: voices = [], isLoading } = useListBuiltinVoicesQuery();
  const { data: dialogueLanguages = [] } = useListDialogueLanguagesQuery();

  const suggestedGender = normalizeGender(gender);
  const [activeGender, setActiveGender] = useState(suggestedGender || "MALE");
  const [activeLanguage, setActiveLanguage] = useState(""); // "" = any language
  const audioRef = useRef(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // Real name for each code from language_master (via /v1/dialogue-languages), not a hardcoded
  // frontend map -- so a language added upstream shows up here with no code change.
  const languageLabelByCode = useMemo(() => {
    const map = new Map();
    dialogueLanguages.forEach((l) => map.set(l.code, l.nativeLabel && l.nativeLabel !== l.label ? `${l.label} (${l.nativeLabel})` : l.label));
    return map;
  }, [dialogueLanguages]);

  // Only offer language codes that at least one voice in this catalog actually speaks -- picking
  // one that has no matching voice would be a dead-end filter.
  const availableLanguages = useMemo(() => {
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

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingVoiceId(null);
  };

  // Stop any playing preview when the user changes gender/language filters so a stale preview
  // doesn't keep playing after its dropdown option is gone.
  useEffect(() => {
    stopPreview();
  }, [activeGender, activeLanguage]);

  const handleVoiceChange = (event) => {
    stopPreview();
    const voice = voices.find((v) => v.voiceId === event.target.value);
    if (voice) onSelect(voice);
  };

  const togglePreview = () => {
    if (!selected?.previewAudioUrl) return;
    if (playingVoiceId === selected.voiceId) {
      stopPreview();
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = selected.previewAudioUrl;
      audioRef.current.play().catch(() => {});
      setPlayingVoiceId(selected.voiceId);
    }
  };

  if (isLoading) {
    return <p className="text-[11px] font-medium text-slate-500">Loading voices…</p>;
  }
  if (!voices.length) {
    return (
      <p className="text-[11px] font-medium text-slate-500">
        No built-in voices configured yet — add a voice in your ElevenLabs account, then click
        <span className="mx-1 font-bold text-purple-300">Refresh Hindi voices</span>
        in Project Settings.
      </p>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Built-in voice</label>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500">Language</label>
          <select
            value={activeLanguage}
            onChange={(event) => setActiveLanguage(event.target.value)}
            className="creator-input w-full px-2 py-1.5 text-[11px] font-semibold"
          >
            <option value="">Any language</option>
            {availableLanguages.map((code) => (
              <option key={code} value={code}>{languageLabelByCode.get(code) || code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500">Gender</label>
          <select
            value={activeGender}
            onChange={(event) => setActiveGender(event.target.value)}
            className="creator-input w-full px-2 py-1.5 text-[11px] font-semibold"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      <div className="mt-2">
        <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500">
          Voice ({shown.length} match{shown.length === 1 ? "" : "es"})
        </label>
        <div className="flex items-center gap-2">
          <select
            value={selected?.voiceId || ""}
            onChange={handleVoiceChange}
            disabled={shown.length === 0}
            className="creator-input flex-1 px-2 py-1.5 text-[11px] font-semibold disabled:opacity-60"
          >
            <option value="" disabled>{shown.length === 0 ? "No matching voices" : "Choose a voice…"}</option>
            {shown.map((voice) => (
              <option key={voice.voiceId} value={voice.voiceId}>{voice.displayName}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={togglePreview}
            disabled={!selected?.previewAudioUrl}
            title={selected?.previewAudioUrl ? "Play preview" : "No preview available for this voice"}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/30 disabled:opacity-40"
          >
            {playingVoiceId === selected?.voiceId ? <Square size={12} /> : <Play size={12} />}
          </button>
        </div>
        <audio ref={audioRef} onEnded={() => setPlayingVoiceId(null)} preload="none" className="hidden" />
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
