// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Play, Square } from "lucide-react";
import {
  useListBuiltinVoicesQuery,
  useListDialogueLanguagesQuery,
  useSetBuiltinVoiceFaceMutation,
  useUploadCastMediaMutation,
} from "../../api/creatorEndpoints.js";
import { normalizeGender } from "../../utils/gender.js";

// Public MinIO reverse-proxy base -- llm-gateway returns just the object key for face refs (it
// has no MinIO client of its own to presign); the frontend renders it via pre-production-service's
// existing public prefix (same pattern as cast media).
const PUBLIC_MEDIA_BASE = "/api/v1/media/public";

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
  const fileInputRef = useRef(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadCastMedia] = useUploadCastMediaMutation();
  const [setBuiltinVoiceFace] = useSetBuiltinVoiceFaceMutation();

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

  // Two-step face attach: upload to pre-prod's cast-media MinIO (kind=FACE) -> get bucket+key
  // back -> PUT them onto the built-in voice via llm-gateway. Re-upload replaces (server just
  // overwrites the three columns), so there is no explicit delete flow.
  const handleFacePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-picked
    if (!file || !selected) return;
    setUploadingFace(true);
    setUploadError(null);
    try {
      const uploaded = await uploadCastMedia({ kind: "FACE", file }).unwrap();
      await setBuiltinVoiceFace({
        voiceId: selected.voiceId,
        bucket: uploaded.bucket,
        objectKey: uploaded.objectKey,
        contentType: file.type || null,
      }).unwrap();
    } catch (error) {
      setUploadError(error?.data?.message || "Face upload failed");
    } finally {
      setUploadingFace(false);
    }
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

      {/* Face image for the built-in voice -- so a voice-only pick still has a matching visual
          identity on the cast picker. Replaces the AI-generated identity image flow that used to
          run at cast-create time. Upload is per-voice and persists on the voice row itself. */}
      {selected && (
        <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-3">
            {selected.faceRefObjectKey ? (
              <img
                src={`${PUBLIC_MEDIA_BASE}/${selected.faceRefObjectKey}`}
                alt=""
                className="h-11 w-11 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/15 text-slate-500">
                <ImagePlus size={14} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Face image</p>
              <p className="text-[10px] font-medium text-slate-500">
                {selected.faceRefObjectKey ? "Uploaded — pick another to replace." : "No face image yet."}
              </p>
              {uploadError && <p className="mt-1 text-[10px] font-semibold text-rose-300">{uploadError}</p>}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFace}
              className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/10 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 hover:bg-purple-500/20 disabled:opacity-60"
            >
              <ImagePlus size={11} />
              {uploadingFace ? "Uploading…" : selected.faceRefObjectKey ? "Replace" : "Upload"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFacePick}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
