import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download } from 'lucide-react';

/**
 * Audio player with waveform visualization for call recordings.
 *
 * @param {{ src: string, title?: string, className?: string }} props
 */
export default function AudioPlayer({ src, title, className = '' }) {
const audioRef = /** @type {import('react').MutableRefObject<HTMLAudioElement|null>} */ (useRef(null));
  const canvasRef = /** @type {import('react').MutableRefObject<HTMLCanvasElement|null>} */ (useRef(null));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const formatTime = (/** @type {number} */ s) => {
    if (!s || !isFinite(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => { setDuration(audio.duration); setIsLoaded(true); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  // Draw simple progress waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const progress = currentTime / duration;

    ctx.clearRect(0, 0, w, h);

    const barCount = 80;
    const barWidth = (w / barCount) * 0.7;
    const gap = (w / barCount) * 0.3;

    for (let i = 0; i < barCount; i++) {
      // Generate pseudo-random height (seeded by position for consistency)
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const barHeight = (Math.abs(seed - Math.floor(seed)) * 0.6 + 0.2) * h;
      const x = i * (barWidth + gap);
      const y = (h - barHeight) / 2;
      const filled = (i / barCount) <= progress;

      ctx.fillStyle = filled ? '#7C3AED' : '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }, [currentTime, duration]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((/** @type {React.MouseEvent<HTMLCanvasElement>} */ e) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audio.currentTime = pct * duration;
  }, [duration]);

  const skip = useCallback((/** @type {number} */ seconds) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  }, [duration]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</p>}

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={400}
        height={48}
        onClick={seek}
        className="w-full h-12 cursor-pointer mb-3 rounded"
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button onClick={() => skip(-10)}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          <SkipBack className="w-4 h-4" />
        </button>

        <button onClick={togglePlay} disabled={!isLoaded}
          className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button onClick={() => skip(10)}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          <SkipForward className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-slate-500 min-w-[90px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex-1" />

        <button onClick={() => { setIsMuted(!isMuted); if (audioRef.current) audioRef.current.muted = !isMuted; }}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {src && (
          <a href={src} download className="text-slate-400 hover:text-slate-600 transition-colors">
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
