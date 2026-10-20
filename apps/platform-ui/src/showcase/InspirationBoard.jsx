// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getInspiration } from "./showcaseApi.js";
import { INDUSTRY_LABEL } from "./labels.js";
import { RequestFromDalaillamaButton } from "./BrandActions.jsx";

/** Our own page for an inspiration video (it comes first there): the reference a request carries. */
export const inspirationLink = (pinId) => `${window.location.origin}/inspiration?pin=${encodeURIComponent(pinId)}`;

/** The board's videos for an industry (all when none); null while loading. */
export function useInspiration(industry = null) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setItems(null);
    getInspiration(industry).then((list) => !cancelled && setItems(list || [])).catch(() => !cancelled && setItems([]));
    return () => { cancelled = true; };
  }, [industry]);
  return items;
}

/**
 * An inspiration video: an idea of what a creator here can make, tagged "Inspiration" (our own films
 * say "Made on Dalaillama") and credited to its maker. It plays in our own player, muted on hover
 * or tap. "Make one like this" opens the request form with it as the reference.
 */
export function InspirationCard({ item }) {
  const [playing, setPlaying] = useState(false);
  const video = React.useRef(null);
  const play = () => {
    if (!video.current || !item.videoUrl) return;
    video.current.play().then(() => setPlaying(true)).catch(() => {});
  };
  const stop = () => {
    if (!video.current) return;
    video.current.pause();
    setPlaying(false);
  };
  const ratio = item.posterWidth && item.posterHeight ? `${item.posterWidth} / ${item.posterHeight}` : "9 / 16";
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: ratio }}
           onMouseEnter={play} onMouseLeave={stop} onClick={() => (playing ? stop() : play())}>
        {item.videoUrl ? (
          <video ref={video} src={item.videoUrl} poster={item.posterUrl} muted loop playsInline preload="none"
                 className="absolute inset-0 h-full w-full object-cover" aria-label={item.title} />
        ) : (
          <img src={item.posterUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {item.videoUrl && !playing && (
          <span className="pointer-events-none absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-lg text-white">▶</span>
        )}
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
          Inspiration
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        <p className="text-xs text-slate-400">
          {INDUSTRY_LABEL[item.industry]}{item.makerName ? ` · by ${item.makerName}` : ""}{item.note ? ` · ${item.note}` : ""}
        </p>
        <div className="pt-1.5">
          <RequestFromDalaillamaButton
            label="Make one like this"
            prefill={{ industry: item.industry, campaignDirection: `Like this inspiration video: ${item.title} (${inspirationLink(item.pinId)})` }}
            remember={false}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
          />
        </div>
      </div>
    </div>
  );
}

/** The board on its own (/inspiration): the same masonry as the films grid. */
export default function InspirationBoard({ industry = null, limit = null, first = null }) {
  const items = useInspiration(industry);
  if (items === null) return <Loader2 className="h-5 w-5 animate-spin text-slate-500" />;
  if (items.length === 0) return <p className="text-sm text-slate-500">No inspiration picked for this industry yet.</p>;
  // A linked video (?pin=) comes first.
  const ordered = first ? [...items].sort((a, b) => (b.pinId === first) - (a.pinId === first)) : items;
  const shown = limit ? ordered.slice(0, limit) : ordered;
  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {shown.map((item) => <InspirationCard key={item.id} item={item} />)}
    </div>
  );
}
