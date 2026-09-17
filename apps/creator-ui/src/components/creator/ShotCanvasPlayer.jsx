// @ts-nocheck
import React from "react";
import { Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";

/**
 * One player for every clip on this page.
 *
 * <p>There used to be two elements per shot: a muted autoplaying tile that looped like a gif, and a
 * separate full player with controls. Two elements meant two downloads of the same file, the tile
 * could never be heard, and the player could never be glanced at -- so a creator checking whether a
 * shot looked right had to open a card, and one checking whether it SOUNDED right had to open a
 * different control. This is one element that does both: it loops quietly like the tile did, and
 * the sound is one click away rather than a different component.
 *
 * <p>Painted to a canvas rather than shown as a bare video, for two reasons that happen to agree.
 * It gives every clip on the page the same frame -- shaped by the project's aspect ratio, so a
 * vertical cut is not letterboxed into a landscape box -- and it keeps the source out of the
 * markup, which is what the client review page needs. Be honest about the second: the browser still
 * fetches the file, so this raises the bar against a casual save and is not protection.
 *
 * <p>Nothing is fetched until it is wanted. `preload="metadata"` means opening a project of thirteen
 * finished shots fetches thirteen headers rather than thirteen films, which is what made this page
 * slow to open.
 */

/** Aspect ratios the pipeline produces, keyed by the backend enum so a new one shows up here as a
 * miss rather than silently rendering 16:9. */
const RATIOS = {
  RATIO_16_9: "16 / 9",
  RATIO_9_16: "9 / 16",
  RATIO_1_1: "1 / 1",
  RATIO_4_5: "4 / 5",
  RATIO_21_9: "21 / 9",
};

export default function ShotCanvasPlayer({
  src,
  aspectRatio,
  // Loops silently on its own, like the old tile. Off for a clip being judged, where playing
  // uninvited is noise.
  autoLoop = false,
  className = "",
  label,
}) {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [state, setState] = React.useState("loading");
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [naturalRatio, setNaturalRatio] = React.useState(null);

  // The project's shape first, the clip's own second, 16:9 only when neither is known. The server
  // returns no aspect ratio for a project with no config yet and documents the player falling back
  // to the file's dimensions -- so it does, rather than forcing a landscape box on a vertical cut.
  const ratio = RATIOS[aspectRatio] || naturalRatio || "16 / 9";

  React.useEffect(() => {
    setState("loading");
    setPlaying(false);
  }, [src]);

  /** One painted frame. On rAF while playing, and once after a load or seek so a paused canvas
   * shows the current frame rather than going blank. */
  const paint = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!video.paused && !video.ended) {
      requestAnimationFrame(paint);
    }
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(paint).catch(() => setState("error"));
    } else {
      video.pause();
    }
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    // Unmuting is the moment someone wants to HEAR it, so start it if it is not already running.
    if (!next && video.paused) {
      video.play().then(paint).catch(() => undefined);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 bg-black ${className}`}
         style={{ aspectRatio: ratio }}>
      <canvas ref={canvasRef} className="h-full w-full object-contain" />

      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
          <Loader2 size={18} className="animate-spin text-slate-300" />
          <p className="text-[10px] font-bold text-slate-400">{label || "Loading…"}</p>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-4">
          <p className="text-center text-[10px] font-bold text-rose-300">
            This clip could not be loaded.
          </p>
        </div>
      )}

      {state === "ready" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent p-2">
          <button type="button" onClick={toggle}
                  aria-label={playing ? "Pause" : "Play"}
                  className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button type="button" onClick={toggleMuted}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          {label && <span className="truncate text-[10px] font-bold text-white/80">{label}</span>}
        </div>
      )}

      {/* Never rendered to the page: no controls, no context menu, nothing to right-click.
          No crossOrigin on purpose -- setting it would make playback depend on the media host
          sending CORS headers, and the clip would fail to load outright if they were ever
          missing. Without it the media always loads and the canvas is merely tainted, which
          only blocks pixel read-back; this player only ever draws. */}
      <video
        ref={videoRef}
        key={src}
        src={src}
        playsInline
        loop={autoLoop}
        muted
        preload="metadata"
        className="hidden"
        onLoadedData={() => {
          setState("ready");
          const video = videoRef.current;
          if (video?.videoWidth > 0 && video?.videoHeight > 0) {
            setNaturalRatio(`${video.videoWidth} / ${video.videoHeight}`);
          }
          paint();
          if (autoLoop) {
            video.play().then(paint).catch(() => undefined);
          }
        }}
        onPlay={() => { setPlaying(true); paint(); }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setState("error")}
      />
    </div>
  );
}
