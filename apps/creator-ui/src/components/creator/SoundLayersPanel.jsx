// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Bell, Loader2, Music, Sparkles, Trash2, Upload } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useDeleteSoundLayerMutation,
  useGenerateSoundLayerMutation,
  useListSoundLayersQuery,
  useUpdateSoundLayerMutation,
  useUploadSoundLayerMutation,
} from "../../api/creatorEndpoints.js";
import { msToSeconds, secondsToMs } from "../../utils/soundLayers.js";

const KIND = {
  SOUND_EFFECT: { label: "Sound effect", Icon: Bell, tone: "text-amber-200", placeholder: "e.g. a single temple bell, long ring" },
  MUSIC: { label: "Music", Icon: Music, tone: "text-emerald-200", placeholder: "e.g. soft tanpura drone, no percussion" },
};

/** A shot's sound layers: music cues and sound effects placed on the film's timeline from this
 * shot. Each can be moved, levelled, switched out of the film or deleted; nothing is baked into
 * the shot's clip -- the film render mixes whatever is switched on, where it is placed. */
export default function SoundLayersPanel({ projectId, shot }) {
  const dispatch = useDispatch();
  const { data: allLayers = [] } = useListSoundLayersQuery(projectId, { skip: !projectId });
  const layers = allLayers.filter((layer) => layer.shotId === shot.id);
  const [generate, { isLoading: generating }] = useGenerateSoundLayerMutation();
  const [uploadLayer, { isLoading: uploading }] = useUploadSoundLayerMutation();
  const [updateLayer] = useUpdateSoundLayerMutation();
  const [deleteLayer] = useDeleteSoundLayerMutation();
  const [kind, setKind] = React.useState("SOUND_EFFECT");
  const [prompt, setPrompt] = React.useState("");
  const [startAt, setStartAt] = React.useState("0");
  const [lengthSeconds, setLengthSeconds] = React.useState(shot.durationSeconds || "");
  const fileRef = React.useRef(null);
  const busy = generating || uploading;

  const flashError = (error, fallback) =>
    dispatch(showFlash({ message: error?.data?.message || fallback, type: "error" }));

  const handleGenerate = async () => {
    const offsetMs = secondsToMs(startAt);
    if (!prompt.trim() || offsetMs == null) return;
    try {
      await generate({
        projectId,
        shotId: shot.id,
        kind,
        prompt: prompt.trim(),
        offsetMs,
        durationSeconds: kind === "MUSIC" && lengthSeconds ? Number(lengthSeconds) : undefined,
      }).unwrap();
      dispatch(showFlash({ message: `${KIND[kind].label} added to shot ${shot.shotNumber}`, type: "success" }));
      setPrompt("");
    } catch (error) {
      flashError(error, "Could not generate that sound");
    }
  };

  const handleUpload = async (file) => {
    const offsetMs = secondsToMs(startAt);
    if (!file || offsetMs == null) return;
    try {
      await uploadLayer({ projectId, shotId: shot.id, kind, offsetMs, file }).unwrap();
      dispatch(showFlash({ message: `${KIND[kind].label} added to shot ${shot.shotNumber}`, type: "success" }));
    } catch (error) {
      flashError(error, "Could not use that file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const patch = (layer, change) =>
    updateLayer({ projectId, layerId: layer.layerId, ...change }).unwrap().catch((error) => flashError(error, "Could not change that sound"));

  const remove = (layer) =>
    deleteLayer({ projectId, layerId: layer.layerId }).unwrap().catch((error) => flashError(error, "Could not delete that sound"));

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2.5">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-300">Sound</p>
      <p className="mt-0.5 text-[10px] text-slate-500">
        Music and sound effects placed from this shot. They are mixed into the film when it renders — switch one off or move it, then render again.
      </p>

      {layers.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {layers.map((layer) => {
            const { label, Icon, tone } = KIND[layer.kind] || KIND.SOUND_EFFECT;
            return (
              <div key={layer.layerId} className={`rounded border border-white/10 p-2 ${layer.included ? "bg-white/[0.03]" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1 text-[10px] font-bold ${tone}`}><Icon size={11} /> {label}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-slate-200" title={layer.prompt || "Uploaded"}>
                    {layer.prompt || "Uploaded file"}
                  </span>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-300">
                    <input type="checkbox" checked={layer.included} onChange={(e) => patch(layer, { included: e.target.checked })} />
                    In the film
                  </label>
                  <button type="button" onClick={() => remove(layer)} title="Delete this sound"
                    className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-slate-400 hover:border-red-400/40 hover:text-red-300">
                    <Trash2 size={11} />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  {layer.audioUrl && <audio controls preload="none" src={layer.audioUrl} className="h-7 max-w-[14rem]" />}
                  <LayerNumber
                    label="Starts at (s)"
                    value={msToSeconds(layer.offsetMs)}
                    onCommit={(text) => { const ms = secondsToMs(text); if (ms != null) patch(layer, { offsetMs: ms }); }}
                  />
                  <LayerNumber
                    label="Volume (dB)"
                    value={String(layer.volumeDb)}
                    onCommit={(text) => { const db = Number(text); if (Number.isFinite(db) && db >= -60 && db <= 12) patch(layer, { volumeDb: db }); }}
                  />
                  {layer.durationSeconds && (
                    <span className="text-[10px] text-slate-500">{Number(layer.durationSeconds).toFixed(1)}s long</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
            {Object.entries(KIND).map(([key, { label, Icon }]) => (
              <button key={key} type="button" onClick={() => setKind(key)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold ${kind === key ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}>
                <Icon size={10} /> {label}
              </button>
            ))}
          </div>
          <LayerNumber label="Starts at (s)" value={startAt} onChange={setStartAt} />
          {kind === "MUSIC" && <LayerNumber label="Length (s)" value={String(lengthSeconds)} onChange={setLengthSeconds} />}
        </div>
        <div className="flex gap-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={KIND[kind].placeholder}
            className="creator-input flex-1 px-2.5 py-1.5 text-[11px]" />
          <button type="button" disabled={busy || !prompt.trim() || secondsToMs(startAt) == null} onClick={handleGenerate}
            className="flex items-center gap-1 rounded-md border border-purple-400/40 bg-purple-500/15 px-2.5 py-1 text-[10px] font-bold text-purple-100 disabled:opacity-50">
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {generating ? "Generating…" : "Generate"}
          </button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} title="Upload your own sound file"
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-200 disabled:opacity-50">
            {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

/** A small number box. Controlled (onChange) for the add form; commit-on-blur (onCommit) for a
 * saved layer, so typing "1.5" does not fire three saves. */
function LayerNumber({ label, value, onChange, onCommit }) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => { setDraft(value); }, [value]);
  return (
    <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
      {label}
      <input
        value={onCommit ? draft : value}
        onChange={(e) => (onCommit ? setDraft(e.target.value) : onChange(e.target.value))}
        onBlur={() => { if (onCommit && draft !== value) onCommit(draft); }}
        onKeyDown={(e) => { if (onCommit && e.key === "Enter") e.currentTarget.blur(); }}
        className="creator-input w-14 px-1.5 py-0.5 text-[11px]"
      />
    </label>
  );
}
