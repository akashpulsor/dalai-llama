// @ts-nocheck
import React, { useRef, useState } from "react";
import { AlertTriangle, Clapperboard, ImagePlus, Loader2, Sparkles, VideoIcon, X } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { formatDuration } from "../utils/time.js";

// Model-agnostic by design: the backend decides which provider actually runs
// the video-to-video edit (Kling today; swap/extend PROVIDERS when the backend
// wires up Seedance, Veo, fal.ai, etc. — the request shape stays the same).
const PROVIDERS = [
  { value: "kling", model: "kling-o3-pro", label: "Kling O3 Pro (video-to-video)", disabled: false },
  { value: "seedance", model: "seedance-v1", label: "Seedance (coming soon)", disabled: true },
  { value: "veo", model: "veo-3", label: "Veo (coming soon)", disabled: true },
];

const MAX_REFERENCE_IMAGES = 4;
const MAX_REFERENCE_VIDEOS = 1;

export default function AiEditPanel() {
  const { state, actions } = usePatchEditor();
  const { aiEdit, selection } = state;
  const [providerValue, setProviderValue] = useState(PROVIDERS[0].value);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState([]); // [{ file, url }]
  const [referenceVideo, setReferenceVideo] = useState(null); // { file, url }
  const referenceInputRef = useRef(null);
  const referenceVideoInputRef = useRef(null);

  const processing = aiEdit.status === "processing";
  const provider = PROVIDERS.find((item) => item.value === providerValue) || PROVIDERS[0];
  const selectionSeconds = selection ? Math.max(0, selection.outPoint - selection.inPoint) : 0;

  const handleReferenceImagesChange = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setReferenceImages((current) => {
      const room = Math.max(0, MAX_REFERENCE_IMAGES - current.length);
      const accepted = incoming.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...current, ...accepted];
    });
  };

  const removeReferenceImage = (index) => {
    setReferenceImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleReferenceVideoChange = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setReferenceVideo((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { file, url: URL.createObjectURL(file) };
    });
  };

  const removeReferenceVideo = () => {
    setReferenceVideo((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const handleGenerate = async () => {
    if (!selection || !prompt.trim() || processing) return;
    await actions.generateAiEdit({
      provider: provider.value,
      model: provider.model,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      referenceImages: referenceImages.map((item) => item.file),
      referenceVideos: referenceVideo ? [referenceVideo.file] : [],
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">AI edit</p>
        <span className="rounded border border-purple-300/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-purple-100">Beta</span>
      </div>

      <label className="mt-2 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Provider</span>
        <select
          value={providerValue}
          onChange={(event) => setProviderValue(event.target.value)}
          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs font-bold text-slate-100 focus:border-purple-400/60 focus:outline-none"
        >
          {PROVIDERS.map((item) => (
            <option key={item.value} value={item.value} disabled={item.disabled} className="bg-slate-950 text-slate-100">
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {selection && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-purple-300/20 bg-purple-400/10 px-2 py-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-purple-400/20 text-purple-100">
            <Clapperboard size={14} />
          </span>
          <p className="min-w-0 text-[11px] font-semibold text-slate-300">
            <span className="font-black text-purple-100">@Video1</span> attached — the selected{" "}
            <span className="font-black text-slate-100">{formatDuration(selectionSeconds)}</span> clip (timeline selection)
            is the video being edited.
          </p>
        </div>
      )}

      <label className="mt-2 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Edit instructions</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. remove the visual glitch and smooth the camera pan. Reference an uploaded image with @Element1, @Element2…"
          className="min-h-[4.5rem] w-full resize-y rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-semibold text-slate-100 focus:border-purple-400/60 focus:outline-none"
        />
      </label>

      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-[10px] font-black uppercase tracking-normal text-slate-500">
            Reference images (optional)
          </span>
          <span className="text-[10px] font-bold text-slate-600">{referenceImages.length}/{MAX_REFERENCE_IMAGES}</span>
        </div>
        {referenceImages.length > 0 && (
          <div className="mb-1.5 grid grid-cols-4 gap-1.5">
            {referenceImages.map((item, index) => (
              <div key={item.url} className="group relative">
                <img src={item.url} alt={`Element ${index + 1}`} className="h-14 w-full rounded-md object-cover" />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-black text-slate-200">
                  @Element{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeReferenceImage(index)}
                  className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-white"
                  aria-label={`Remove reference image ${index + 1}`}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        {referenceImages.length < MAX_REFERENCE_IMAGES && (
          <button
            type="button"
            onClick={() => referenceInputRef.current?.click()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-black/40 text-xs font-bold text-slate-400 hover:border-purple-300/40 hover:text-slate-200"
          >
            <ImagePlus size={14} /> Add reference image{referenceImages.length ? "s" : ""}
          </button>
        )}
        <input
          ref={referenceInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            handleReferenceImagesChange(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-[10px] font-black uppercase tracking-normal text-slate-500">
            Reference video (optional)
          </span>
          <span className="text-[10px] font-bold text-slate-600">{referenceVideo ? 1 : 0}/{MAX_REFERENCE_VIDEOS}</span>
        </div>
        {referenceVideo ? (
          <div className="group relative mb-1.5">
            <video src={referenceVideo.url} muted preload="metadata" className="h-20 w-full rounded-md bg-black object-cover" />
            <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-black text-slate-200">
              @RefVideo1
            </span>
            <button
              type="button"
              onClick={removeReferenceVideo}
              className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-white"
              aria-label="Remove reference video"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => referenceVideoInputRef.current?.click()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-black/40 text-xs font-bold text-slate-400 hover:border-purple-300/40 hover:text-slate-200"
          >
            <VideoIcon size={14} /> Upload a video for style reference
          </button>
        )}
        <input
          ref={referenceVideoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            handleReferenceVideoChange(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <label className="mt-2 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Negative prompt (optional)</span>
        <input
          value={negativePrompt}
          onChange={(event) => setNegativePrompt(event.target.value)}
          placeholder="e.g. no extra objects, no camera shake"
          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs font-semibold text-slate-100 focus:border-purple-400/60 focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!selection || !prompt.trim() || processing}
        className="creator-primary mt-3 flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {processing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {processing ? `${aiEdit.statusLabel || "Generating"}${aiEdit.progress ? ` ${Math.round(aiEdit.progress * 100)}%` : "…"}` : "Generate AI edit"}
      </button>

      {aiEdit.status === "error" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle size={12} /> {aiEdit.error}
        </p>
      )}
      <p className="mt-2 text-[11px] font-semibold text-slate-600">
        Cuts the current selection, sends it to your backend for AI editing, then patches the result back in automatically.
      </p>
    </div>
  );
}
