// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Flag, X } from "lucide-react";
import { loadYouTubeIframeApi } from "./youtubeIframeApi.js";
import { getSelfSource, recordPlay, reportVideo } from "./showcaseApi.js";
import { INDUSTRY_LABEL } from "./labels.js";
import { LikeButton } from "./BrandActions.jsx";

const PLAY_COUNTS_AFTER_MS = 3000;
const REPORT_REASONS = [
  ["RIGHTS", "This is our content and we didn't agree to it being shown"],
  ["OFFENSIVE", "Offensive or harmful"],
  ["MISLEADING", "Misleading"],
  ["OTHER", "Something else"],
];

/** Plays a showcase film at its true aspect ratio: YouTube's own player (unmodified) for YouTube
 * cards, a plain video element for self-hosted platform films. A play counts after 3 seconds and
 * a full play when the video ends; both are our own data, never YouTube's. */
export default function VideoPlayerModal({ card, onClose, actions }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [selfUrl, setSelfUrl] = useState(null);
  const [reporting, setReporting] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (card.host !== "SELF") return undefined;
    let cancelled = false;
    getSelfSource(card.publicId)
      .then((source) => !cancelled && (source ? setSelfUrl(source.url) : setFailed(true)))
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [card]);

  useEffect(() => {
    if (card.host !== "YOUTUBE") return undefined;
    let player;
    let timer;
    loadYouTubeIframeApi().then((YT) => {
      if (!mountRef.current) return;
      player = new YT.Player(mountRef.current, {
        videoId: card.youtubeVideoId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING && !counted.current) {
              timer = window.setTimeout(() => {
                counted.current = true;
                recordPlay(card.publicId, false);
              }, PLAY_COUNTS_AFTER_MS);
            } else if (event.data !== YT.PlayerState.PLAYING) {
              window.clearTimeout(timer);
            }
            if (event.data === YT.PlayerState.ENDED) recordPlay(card.publicId, true);
          },
          // 101 / 150: the owner turned embedding off, or a rights claim blocks it here.
          onError: () => setFailed(true),
        },
      });
    }).catch(() => setFailed(true));
    return () => {
      window.clearTimeout(timer);
      try { player?.destroy(); } catch { /* already gone */ }
    };
  }, [card]);

  const onSelfTime = (event) => {
    if (!counted.current && event.currentTarget.currentTime >= PLAY_COUNTS_AFTER_MS / 1000) {
      counted.current = true;
      recordPlay(card.publicId, false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="player-title"
         className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-5xl flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 sm:flex-row sm:p-5"
           onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-full overflow-hidden rounded-xl bg-black sm:flex-1"
             style={{ aspectRatio: `${card.aspectW} / ${card.aspectH}`, maxHeight: "80vh", maxWidth: card.vertical ? 420 : undefined }}>
          {failed ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
              <p>This video can't play here.</p>
              <a href={card.watchUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-4 py-2 font-bold text-slate-900">Watch on YouTube</a>
            </div>
          ) : card.host === "SELF" ? (
            selfUrl && <video src={selfUrl} controls autoPlay playsInline onTimeUpdate={onSelfTime}
                              onEnded={() => recordPlay(card.publicId, true)} className="h-full w-full" />
          ) : (
            <div ref={mountRef} className="h-full w-full" />
          )}
        </div>

        <div className="flex flex-col gap-3 sm:w-72">
          <div className="flex items-start justify-between gap-2">
            <h2 id="player-title" className="text-lg font-bold text-slate-900">{card.title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-slate-600">
            {INDUSTRY_LABEL[card.industry]}{card.clientLabel ? ` · ${card.clientLabel}` : ""}
          </p>
          <a href={`/c/${card.creator.handle}`} className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            {card.creator.avatarUrl && <img src={card.creator.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
            {card.creator.displayName}
          </a>
          <LikeButton card={card} />
          {actions}
          {card.host === "YOUTUBE" && (
            <a href={card.watchUrl} target="_blank" rel="noreferrer"
               className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Watch on YouTube <ExternalLink size={14} />
            </a>
          )}
          <button type="button" onClick={() => setReporting(true)}
                  className="mt-auto flex items-center gap-1.5 self-start text-xs font-semibold text-slate-400 hover:text-rose-600">
            <Flag size={12} /> Report this video
          </button>
          {reporting && <ReportForm publicId={card.publicId} onDone={() => setReporting(false)} />}
        </div>
      </div>
    </div>
  );
}

function ReportForm({ publicId, onDone }) {
  const [reason, setReason] = useState("RIGHTS");
  const [note, setNote] = useState("");
  const [state, setState] = useState("idle");

  const submit = async (event) => {
    event.preventDefault();
    setState("sending");
    try {
      await reportVideo(publicId, reason, note);
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") return <p className="text-xs font-semibold text-emerald-700">Thanks. Our team will review it.</p>;

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-slate-200 p-3">
      <fieldset className="space-y-1">
        <legend className="text-xs font-bold text-slate-700">What's wrong?</legend>
        {REPORT_REASONS.map(([code, label]) => (
          <label key={code} className="flex items-start gap-2 text-xs text-slate-600">
            <input type="radio" name="reason" value={code} checked={reason === code} onChange={() => setReason(code)} className="mt-0.5" />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="block text-xs text-slate-600" htmlFor="report-note">Details (optional)</label>
      <textarea id="report-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
                className="w-full rounded border border-slate-300 p-2 text-xs" />
      {state === "error" && <p className="text-xs text-rose-600">Could not send. Try again.</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={state === "sending"} className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Send report</button>
        <button type="button" onClick={onDone} className="rounded px-3 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
      </div>
    </form>
  );
}
