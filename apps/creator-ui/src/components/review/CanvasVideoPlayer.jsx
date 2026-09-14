// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";

/** Aspect ratios the pipeline can produce, as CSS ratios. Keyed by the backend enum name so a
 * ratio added there shows up here as a miss rather than silently rendering 16:9. */
const RATIOS = {
  RATIO_16_9: "16 / 9",
  RATIO_9_16: "9 / 16",
  RATIO_1_1: "1 / 1",
  RATIO_4_5: "4 / 5",
  RATIO_21_9: "21 / 9",
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/**
 * Plays a cut for review without handing over a file.
 *
 * The <video> is kept out of the document's reach and its frames are painted to a <canvas>, so
 * there is no element to right-click and save and no src sitting in the markup. Be clear about
 * what that is worth: the browser still fetches the video, so anyone who opens devtools can find
 * the URL. This raises the bar against a casual save; it is not protection against someone
 * determined, and it should not be sold as such.
 *
 * The canvas is shaped by the project's aspect ratio rather than the file's, so a vertical cut
 * gets a vertical frame instead of being letterboxed into a landscape box.
 */
export default function CanvasVideoPlayer({ src, aspectRatio, className = "" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const ratio = RATIOS[aspectRatio] || "16 / 9";

  /** One painted frame. Runs on rAF while playing, and once on demand after a seek or load so a
   * paused canvas still shows the current frame rather than going blank. */
  const paint = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const loop = () => {
      paint();
      setPosition(videoRef.current?.currentTime || 0);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, paint]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  const seek = (event) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration) || duration <= 0) return;
    const next = (Number(event.target.value) / 1000) * duration;
    video.currentTime = next;
    setPosition(next);
    // Paint immediately so scrubbing while paused actually moves the picture.
    requestAnimationFrame(paint);
  };

  return (
    <div className={className}>
      <div className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-black" style={{ aspectRatio: ratio }}>
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-slate-500">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}
        {/* Never rendered to the page: no controls, no context menu, nothing to save.
            No crossOrigin on purpose -- setting it would make playback depend on the media
            host sending CORS headers, and the video would fail to load outright if they were
            ever missing. Without it the media always loads and the canvas is merely tainted,
            which only blocks pixel read-back; this player only ever draws. */}
        <video
          ref={videoRef}
          src={src}
          playsInline
          className="hidden"
          onLoadedData={() => {
            setReady(true);
            setDuration(videoRef.current?.duration || 0);
            paint();
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={() => setPosition(videoRef.current?.currentTime || 0)}
        />
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
        </button>

        <span className="w-10 shrink-0 text-[11px] font-bold tabular-nums text-slate-400">{formatTime(position)}</span>

        <input
          type="range"
          min={0}
          max={1000}
          value={duration > 0 ? Math.round((position / duration) * 1000) : 0}
          onChange={seek}
          disabled={!ready}
          aria-label="Seek"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-purple-400 disabled:opacity-50"
        />

        <span className="w-10 shrink-0 text-[11px] font-bold tabular-nums text-slate-400">{formatTime(duration)}</span>

        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}
          disabled={!ready}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white disabled:opacity-50"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>
    </div>
  );
}
