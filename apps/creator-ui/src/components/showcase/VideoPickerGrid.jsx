// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Plus } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useGetMyShowcaseQuery, useGetMyVideosQuery, usePickVideoMutation } from "../../api/showcaseEndpoints.js";
import ShowcaseFields from "./ShowcaseFields.jsx";
import { INELIGIBLE_REASON, errorMessage } from "./showcaseLabels.js";

/** The creator's imported YouTube videos; eligible ones can be put on the profile. */
export default function VideoPickerGrid() {
  const dispatch = useDispatch();
  const { data: videos = [], isLoading } = useGetMyVideosQuery();
  const { data: items = [] } = useGetMyShowcaseQuery();
  const [pick, pickState] = usePickVideoMutation();
  const [picking, setPicking] = useState(null);
  const [fields, setFields] = useState(emptyFields());

  const onShowcase = new Set(items.map((i) => i.youtubeVideoId));

  const startPick = (video) => {
    setPicking(video);
    setFields(emptyFields());
  };

  const onPick = async () => {
    try {
      await pick({ youtubeVideoId: picking.videoId, ...fields }).unwrap();
      dispatch(showFlash({ message: "Added to your profile", type: "success" }));
      setPicking(null);
    } catch (e) {
      dispatch(showFlash({ message: errorMessage(e, "Could not add this video"), type: "error" }));
    }
  };

  if (isLoading) {
    return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading your videos…</p>;
  }
  if (videos.length === 0) {
    return <p className="text-sm text-slate-400">No videos yet. Verify your channel, or sync it after uploading.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {videos.map((v) => {
          const added = onShowcase.has(v.videoId);
          return (
            <div key={v.videoId} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="relative w-full bg-black" style={{ aspectRatio: v.vertical ? "9 / 16" : "16 / 9" }}>
                {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {v.vertical ? "Vertical" : "Wide"}
                </span>
              </div>
              <div className="space-y-1.5 p-2.5">
                <p className="line-clamp-2 text-xs font-semibold text-white">{v.title}</p>
                {!v.eligible && (
                  <p className="text-[11px] font-semibold text-amber-200">{INELIGIBLE_REASON[v.ineligibleReason] || v.ineligibleReason}</p>
                )}
                <button
                  type="button"
                  onClick={() => startPick(v)}
                  disabled={!v.eligible || added}
                  className="creator-control flex h-8 w-full items-center justify-center gap-1.5 text-[11px] font-bold text-slate-200 disabled:opacity-50"
                >
                  {added ? "On your profile" : <><Plus size={12} /> Show on profile</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {picking && (
        <div role="dialog" aria-modal="true" aria-labelledby="pick-title"
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="creator-panel w-full max-w-md p-5">
            <h3 id="pick-title" className="text-base font-bold text-white">Show on your profile</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">{picking.title}</p>
            <ShowcaseFields value={fields} onChange={setFields} />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPicking(null)} className="creator-control h-9 px-4 text-xs font-bold text-slate-200">Cancel</button>
              <button type="button" onClick={onPick} disabled={!fields.rightsConfirmed || pickState.isLoading}
                      className="creator-primary flex h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
                {pickState.isLoading && <Loader2 size={13} className="animate-spin" />} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function emptyFields() {
  return { industry: "FOOD_BEVERAGE", format: "PRODUCT_AD", clientLabel: "", rightsConfirmed: false };
}
