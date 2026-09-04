// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { formatDuration } from "../utils/time.js";

// Composes playback from the EDL (edit decision list) instead of a real render:
// plays the original video up to a patch, switches source to the replacement
// clip, then switches back — so "preview result" is instant, with no ffmpeg pass.
export default function PatchedPreviewPlayer() {
  const { state } = usePatchEditor();
  const { segments, patchedDuration, sourceUrl } = state;
  const videoRef = useRef(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [patchedTime, setPatchedTime] = useState(0);

  const segment = segments[segmentIndex] || null;

  useEffect(() => {
    setSegmentIndex(0);
    setPatchedTime(0);
    setIsPlaying(false);
  }, [segments]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !segment) return;
    const targetSrc = segment.kind === "original" ? sourceUrl : segment.url;
    if (video.dataset.activeSrc !== targetSrc) {
      video.dataset.activeSrc = targetSrc;
      video.src = targetSrc;
    }
    video.currentTime = segment.sourceStart;
    if (isPlaying) video.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentIndex, segment?.url, sourceUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.play().catch(() => {});
    else video.pause();
  }, [isPlaying]);

  const advance = () => {
    setSegmentIndex((index) => {
      if (index < segments.length - 1) return index + 1;
      setIsPlaying(false);
      return index;
    });
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !segment) return;
    setPatchedTime(segment.timelineStart + (video.currentTime - segment.sourceStart));
    if (video.currentTime >= segment.sourceEnd - 0.05) advance();
  };

  if (!segments.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
        Upload a replacement clip to see the patched preview here.
      </div>
    );
  }

  const progressPct = patchedDuration ? Math.min(Math.max((patchedTime / patchedDuration) * 100, 0), 100) : 0;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
      <video ref={videoRef} className="max-h-full max-w-full" onTimeUpdate={handleTimeUpdate} onEnded={advance} playsInline />
      <div className="flex w-full max-w-xl items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setIsPlaying((value) => !value)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-500"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-purple-500" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="shrink-0 font-mono font-bold text-slate-400">
          {formatDuration(patchedTime)} / {formatDuration(patchedDuration)}
        </span>
        {segment?.kind === "replacement" && (
          <span className="shrink-0 rounded border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-100">
            Patched
          </span>
        )}
      </div>
    </div>
  );
}
