// @ts-nocheck
import React from "react";
import { Play } from "lucide-react";
import { INDUSTRY_LABEL } from "./labels.js";

/** One film on a public grid. Vertical films keep a vertical frame; the YouTube mark says where it
 * plays from (developer policies: YouTube shown as the source). */
export default function ShowcaseCard({ card, onOpen, showCreator = true }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onOpen(card)}
        aria-label={`Play ${card.title}`}
        className="group relative block w-full bg-slate-900"
        style={{ aspectRatio: card.vertical ? "9 / 16" : `${card.aspectW} / ${card.aspectH}`, maxHeight: 420 }}
      >
        {card.thumbnailUrl && (
          <img src={card.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition group-hover:scale-110">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </span>
        {card.host === "YOUTUBE" && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">YouTube</span>
        )}
        {card.origin === "PLATFORM" && (
          <span className="absolute left-2 top-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Made on Dalaillama</span>
        )}
      </button>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{card.title}</p>
        <p className="text-xs text-slate-500">
          {INDUSTRY_LABEL[card.industry]}{card.clientLabel ? ` · ${card.clientLabel}` : ""}
        </p>
        {showCreator && (
          <a href={`/c/${card.creator.handle}`} className="flex items-center gap-2 pt-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900">
            {card.creator.avatarUrl && <img src={card.creator.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />}
            {card.creator.displayName}
          </a>
        )}
      </div>
    </article>
  );
}
