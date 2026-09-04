// @ts-nocheck
import React, { useRef, useState } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { useListCloningModelsQuery } from "../../api/creatorEndpoints.js";

// A short, phonetically varied paragraph -- enough seconds of clean speech for a usable voice-
// clone sample without asking the creator to write their own script.
const VOICE_SAMPLE_SCRIPT =
  "The quick brown fox jumps over the lazy dog near the old oak tree. " +
  "I've traveled through busy cities and quiet valleys, always noticing how light changes the mood of a place. " +
  "Numbers like twelve, forty-seven, and two hundred and three come up more often than you'd expect. " +
  "Thank you for listening -- this short reading helps capture how my voice actually sounds.";

/** Upload-or-record voice sample capture, shared by cast-profile creation and by adding/replacing
 * a voice sample on a profile that already exists. Owns its own recording state; hands the parent
 * a plain File via {@code onFileChange} either way -- the parent decides what to do with it
 * (stage it for a create-profile submit, or upload it immediately to attach to an existing one). */
export default function VoiceSampleField({ file, onFileChange }) {
  const { data: cloningModels = [] } = useListCloningModelsQuery();
  const [voiceMode, setVoiceMode] = useState("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [recordError, setRecordError] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = async () => {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const extension = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        const recordedFile = new File([blob], `voice-sample.${extension}`, { type: blob.type });
        onFileChange(recordedFile);
        setRecordedUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setRecordError("Could not access the microphone. Check your browser's permission for this site.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Voice sample (to clone)</label>
        <div className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => setVoiceMode("upload")}
            className={`rounded px-2 py-1 text-[10px] font-bold ${voiceMode === "upload" ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setVoiceMode("record")}
            className={`rounded px-2 py-1 text-[10px] font-bold ${voiceMode === "record" ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
          >
            Record
          </button>
        </div>
      </div>

      {voiceMode === "upload" ? (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:border-purple-400/30">
          <Upload size={12} />
          {file ? file.name : "Choose a file"}
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => {
              onFileChange(event.target.files?.[0] || null);
              setRecordedUrl("");
            }}
          />
        </label>
      ) : (
        <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-2.5">
          <p className="text-[11px] font-medium leading-relaxed text-slate-400">Read this out loud, clearly and at a natural pace:</p>
          <p className="rounded border border-white/10 bg-black/20 p-2 text-[11px] font-semibold italic text-slate-200">{VOICE_SAMPLE_SCRIPT}</p>
          {recordError && <p className="text-[11px] font-semibold text-rose-300">{recordError}</p>}
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:border-purple-400/30"
              >
                <Mic size={12} />
                {recordedUrl ? "Record again" : "Start recording"}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1.5 rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-200"
              >
                <Square size={11} />
                Stop recording
              </button>
            )}
            {recordedUrl && !isRecording && <audio controls src={recordedUrl} className="h-8 flex-1" />}
          </div>
        </div>
      )}

      {cloningModels.length > 0 && (
        <p className="mt-1.5 text-[10px] font-medium text-slate-500">
          This sample can be cloned with: {cloningModels.map((m) => m.modelId).join(", ")}
        </p>
      )}
    </div>
  );
}
