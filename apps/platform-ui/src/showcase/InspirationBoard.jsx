// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getInspiration } from "./showcaseApi.js";
import { INDUSTRY_LABEL } from "./labels.js";
import { RequestFromDalaillamaButton } from "./BrandActions.jsx";

/**
 * Pinterest's player scales the video to its width and adds a fixed-height white footer (caption and
 * maker) below it, with a "Save" button over the video's top. The card shows the video alone: sized
 * to the video, its top strip and the footer cut off. The maker stays credited in the card's own
 * "Pinned by" line.
 */
const SAVE_STRIP = 56;
const PLAYER_FOOTER = 104;
/** At Pinterest's 450px width the oEmbed height is the video plus the footer; tall when unknown. */
const PLAYER_WIDTH = 450;
const TALL_PLAYER_HEIGHT = 899;

/** The card's box: the video's height for the card's width, less the cropped strip. */
const videoBox = (embedHeight) => {
  const videoRatio = ((embedHeight || TALL_PLAYER_HEIGHT) - PLAYER_FOOTER) / PLAYER_WIDTH;
  return { height: 0, paddingBottom: `calc(${(videoRatio * 100).toFixed(3)}% - ${SAVE_STRIP}px)` };
};

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
 * One video from Pinterest that we picked as a reference, tagged "Inspiration" (where our own films
 * say "Made on Dalaillama") and credited under the video ("Pinned by ..."): never presented as our
 * creators' work. "Make one like this" opens the request form with the pin as the reference.
 */
export function InspirationCard({ item }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
      <div className="relative w-full overflow-hidden" style={videoBox(item.embedHeight)}>
        <iframe
          title={item.title}
          src={`https://assets.pinterest.com/ext/embed.html?id=${item.pinId}`}
          loading="lazy"
          className="absolute left-0 w-full border-0"
          style={{ top: -SAVE_STRIP, height: `calc(100% + ${SAVE_STRIP + PLAYER_FOOTER}px)` }}
          scrolling="no"
        />
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
          Inspiration
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        <p className="text-xs text-slate-400">{INDUSTRY_LABEL[item.industry]}{item.note ? ` · ${item.note}` : ""}</p>
        <div className="pt-1.5">
          <RequestFromDalaillamaButton
            label="Make one like this"
            prefill={{ industry: item.industry, campaignDirection: `Like this reference: ${item.pinUrl}` }}
            remember={false}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
          />
        </div>
      </div>
    </div>
  );
}

/** The board on its own (/inspiration): the same masonry as the films grid. */
export default function InspirationBoard({ industry = null, limit = null }) {
  const items = useInspiration(industry);
  if (items === null) return <Loader2 className="h-5 w-5 animate-spin text-slate-500" />;
  if (items.length === 0) return <p className="text-sm text-slate-500">No inspiration picked for this industry yet.</p>;
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {shown.map((item) => <InspirationCard key={item.id} item={item} />)}
    </div>
  );
}
