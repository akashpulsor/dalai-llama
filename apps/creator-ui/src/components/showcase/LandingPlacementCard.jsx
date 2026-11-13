// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAdminLandingItemsQuery, useAdminPlaceOnLandingMutation } from "../../api/showcaseEndpoints.js";
import { INDUSTRY_LABEL } from "./showcaseLabels.js";

/** Creators' films on dalaillama.in: put one in the hero at the top, or take one off the landing
 * page. Only the landing page changes; the film stays on the creator's profile. Listed best score
 * first, which is roughly the landing order (likes weigh in at the nightly re-score). */
export default function LandingPlacementCard() {
  const { data: items = [], isLoading } = useAdminLandingItemsQuery();
  const [place, placeState] = useAdminPlaceOnLandingMutation();
  const [error, setError] = useState(null);
  const heroes = items.filter((i) => i.landingHeroAt).length;

  const update = async (item, change) => {
    setError(null);
    try {
      await place({ publicId: item.publicId, hidden: item.landingHidden, hero: Boolean(item.landingHeroAt), ...change }).unwrap();
    } catch (e) {
      setError(e?.data?.message || `Failed (${e?.status || "?"})`);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Landing page videos</p>
      <p className="mt-1 text-xs text-slate-500">
        Creator films on dalaillama.in, shown before inspiration videos. Hero films come first and the newest one fills the
        hero. Removing a film takes it off the landing page only; it stays on the creator's profile.
      </p>
      {error && <p className="mt-2 text-xs font-semibold text-rose-200">{error}</p>}
      {isLoading && <Loader2 size={14} className="mt-2 animate-spin text-slate-400" />}
      {!isLoading && items.length === 0 && <p className="mt-2 text-xs text-slate-500">No creator films can be shown publicly yet.</p>}
      {items.length > 0 && (
        <>
          <p className="mt-2 text-xs text-slate-400">{items.length} films · {heroes} in the hero</p>
          <ul className="mt-2 divide-y divide-white/5">
            {items.map((item) => (
              <li key={item.publicId} className={`flex items-center gap-3 py-2 ${item.landingHidden ? "opacity-50" : ""}`}>
                <a href={item.watchUrl} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={item.thumbnailUrl} alt="" className="h-12 w-20 rounded object-cover" loading="lazy" />
                </a>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="truncate font-bold text-slate-200">{item.title || item.publicId}</p>
                  <p className="truncate text-slate-500">
                    {item.creatorName} · {INDUSTRY_LABEL[item.industry] || item.industry} · {item.likeCount} likes · {item.playCount} plays
                    {item.globalScore != null && ` · score ${Number(item.globalScore).toFixed(3)}`}
                  </p>
                </div>
                <span className={`text-[11px] font-bold ${item.landingHeroAt ? "text-amber-200" : item.landingHidden ? "text-rose-200" : "text-slate-400"}`}>
                  {item.landingHeroAt ? "Hero" : item.landingHidden ? "Removed" : "On landing"}
                </span>
                <button type="button" disabled={placeState.isLoading || item.landingHidden}
                        onClick={() => update(item, { hero: !item.landingHeroAt })}
                        className="creator-control h-7 px-2.5 text-[11px] font-bold text-slate-200 disabled:opacity-40">
                  {item.landingHeroAt ? "Unhero" : "Make hero"}
                </button>
                <button type="button" disabled={placeState.isLoading || Boolean(item.landingHeroAt)}
                        onClick={() => update(item, { hidden: !item.landingHidden })}
                        className={`creator-control h-7 px-2.5 text-[11px] font-bold disabled:opacity-40 ${item.landingHidden ? "text-slate-200" : "text-rose-200"}`}>
                  {item.landingHidden ? "Restore" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
