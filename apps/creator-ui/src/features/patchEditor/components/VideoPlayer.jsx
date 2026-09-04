// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { formatTimecode } from "../utils/time.js";

export default function VideoPlayer() {
  const { state, actions } = usePatchEditor();
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Timeline drags / clicks move state.playback.currentTime; reflect that onto the element.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - state.playback.currentTime) > 0.08) {
      video.currentTime = state.playback.currentTime;
    }
  }, [state.playback.currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (state.playback.isPlaying) video.play().catch(() => {});
    else video.pause();
  }, [state.playback.isPlaying]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const { selection, playback } = state;
    if (playback.loopSelection && selection && video.currentTime >= selection.outPoint) {
      video.currentTime = selection.inPoint;
    }
    actions.setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && state.selection) video.currentTime = state.selection.inPoint;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (video) video.muted = next;
  };

  const handleVolumeChange = (event) => {
    const next = Number(event.target.value);
    setVolume(next);
    setMuted(next === 0);
    const video = videoRef.current;
    if (video) {
      video.volume = next;
      video.muted = next === 0;
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <video
          ref={videoRef}
          src={state.sourceUrl}
          className="max-h-full max-w-full"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => actions.setPlaying(true)}
          onPause={() => actions.setPlaying(false)}
          onLoadedMetadata={handleLoadedMetadata}
          playsInline
        />
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-white/10 bg-black/40 px-3 py-2">
        <button
          type="button"
          onClick={() => actions.setPlaying(!state.playback.isPlaying)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-500"
        >
          {state.playback.isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="shrink-0 font-mono text-xs font-bold text-slate-300">
          {formatTimecode(state.playback.currentTime)} / {formatTimecode(state.duration)}
        </span>
        <div className="flex flex-1" />
        <button
          type="button"
          onClick={toggleMute}
          title={muted ? "Unmute" : "Mute"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
        >
          {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          className="h-1.5 w-20 shrink-0 accent-purple-500"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
