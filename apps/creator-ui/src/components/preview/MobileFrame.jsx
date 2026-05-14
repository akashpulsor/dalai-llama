// @ts-nocheck
import React, { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Pause, Play, Share2 } from "lucide-react";

export default function MobileFrame({ scene, cursorMs, durationMs, isPlaying, onToggle, onSeek }) {
  const progress = Math.max(0, Math.min(100, (cursorMs / durationMs) * 100));
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const flash = (text) => {
    setMessage(text);
    window.clearTimeout(window.__creatorPreviewNotice);
    window.__creatorPreviewNotice = window.setTimeout(() => setMessage(""), 1800);
  };

  const share = async () => {
    const shareText = "Mock preview link copied for She Almost Didn't Go";
    try {
      await navigator.clipboard?.writeText?.("https://creator.dalaillama.in/mock/she-almost-didnt-go");
      flash(shareText);
    } catch {
      flash("Mock preview link ready");
    }
  };

  return (
    <section className="creator-panel sticky top-5 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">6. Preview</h2>
        <p className="text-sm font-medium text-slate-400">See how your short will look.</p>
      </div>
      <div className="mx-auto w-full max-w-[18.5rem] rounded-[2.2rem] border border-slate-700/80 bg-black p-3 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-3 text-[11px] font-bold">
            <span>9:41</span>
            <span>5G 100%</span>
          </div>
          <div className="h-[34rem] phone-poster" />
          <EngagementRail
            liked={liked}
            menuOpen={menuOpen}
            onLike={() => {
              setLiked((value) => !value);
              flash(liked ? "Like removed" : "Liked preview");
            }}
            onComment={() => flash("Mock comments opened")}
            onShare={share}
            onMore={() => setMenuOpen((value) => !value)}
            onMenuAction={(action) => {
              setMenuOpen(false);
              flash(action);
            }}
          />
          {message && (
            <div className="absolute left-5 right-5 top-14 z-30 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-center text-xs font-semibold backdrop-blur">
              {message}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/58 to-transparent p-5">
            <p className="max-w-[12rem] text-lg font-bold leading-6">
              Just one decision... <span className="text-amber-300">to show up.</span>
            </p>
            <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-300">{scene?.description}</p>
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={onToggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <span className="text-xs font-bold">{formatTime(cursorMs)} / {formatTime(durationMs)}</span>
            </div>
            <button type="button" onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              const nextMs = Math.max(0, Math.min(durationMs, durationMs * ratio));
              onSeek?.(nextMs);
              flash(`Scrubbed to ${formatTime(nextMs)}`);
            }} className="mt-3 block h-3 w-full rounded-full bg-white/20 p-0">
              <span className="block h-1.5 rounded-full bg-purple-500" style={{ width: `${progress}%` }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EngagementRail({ liked, menuOpen, onLike, onComment, onShare, onMore, onMenuAction }) {
  const items = [
    [Heart, liked ? "12.5K" : "12.4K", onLike, liked],
    [MessageCircle, "156", onComment, false],
    [Share2, "323", onShare, false],
    [MoreHorizontal, "", onMore, false],
  ];
  return (
    <div className="absolute bottom-32 right-4 z-20 space-y-4 text-center">
      {items.map(([Icon, label, action, active]) => (
        <div key={label || "more"} className="relative">
          <button type="button" onClick={action} className={`drop-shadow transition ${active ? "text-rose-300" : "text-white"}`}>
            <Icon size={24} className="mx-auto" fill={Icon === Heart && active ? "currentColor" : "none"} />
            {label && <p className="mt-1 text-[10px] font-bold">{label}</p>}
          </button>
          {Icon === MoreHorizontal && menuOpen && (
            <div className="absolute bottom-0 right-8 w-32 rounded-lg border border-white/10 bg-black/80 p-2 text-left text-xs font-semibold shadow-2xl backdrop-blur">
              <button type="button" onClick={() => onMenuAction?.("Preview duplicated")} className="block w-full rounded px-2 py-1.5 text-left hover:bg-white/10">Duplicate</button>
              <button type="button" onClick={() => onMenuAction?.("Mock report saved")} className="block w-full rounded px-2 py-1.5 text-left hover:bg-white/10">Report mock</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  return `00:${String(total).padStart(2, "0")}`;
}
