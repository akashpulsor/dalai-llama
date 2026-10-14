// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Check, Loader2, UserCircle, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useChoosePosterFrameMutation, useGetPosterFramesQuery, usePublishFilmToProfileMutation } from "../../api/showcaseEndpoints.js";

/**
 * Puts a film on the creator's profile, with the thumbnail it shows there chosen from the film's
 * own generated frames (the first shot's by default). Opened again for a film already on the
 * profile, it only changes the thumbnail.
 */
export default function PublishToProfileDialog({ projectId, onProfile, onClose }) {
  const dispatch = useDispatch();
  const { data: frames = [], isLoading } = useGetPosterFramesQuery(projectId);
  const [choose, chooseState] = useChoosePosterFrameMutation();
  const [publish, publishState] = usePublishFilmToProfileMutation();
  const fail = (error, fallback) => dispatch(showFlash({ message: error?.data?.message || error?.data?.error || fallback, type: "error" }));

  const pick = async (imageId) => {
    try { await choose({ projectId, imageId }).unwrap(); } catch (error) { fail(error, "Could not set the thumbnail"); }
  };
  const handlePublish = async () => {
    try {
      await publish(projectId).unwrap();
      dispatch(showFlash({ message: "It's on your profile. Share it to YouTube from your profile page.", type: "success" }));
      onClose();
    } catch (error) {
      fail(error, "Could not put it on your profile");
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="profile-publish-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="creator-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="profile-publish-title" className="text-base font-bold text-white">{onProfile ? "Profile thumbnail" : "Publish to your profile"}</h3>
            <p className="mt-1 text-xs text-slate-400">Pick the frame your profile shows for this film.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="creator-control flex h-8 w-8 items-center justify-center text-slate-300">
            <X size={14} />
          </button>
        </div>

        {isLoading && <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading the frames…</p>}
        {!isLoading && frames.length === 0 && <p className="mt-4 text-sm text-slate-400">This film has no frames to choose from yet.</p>}
        {frames.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {frames.map((frame) => (
              <li key={frame.imageId}>
                <button type="button" onClick={() => pick(frame.imageId)} disabled={chooseState.isLoading}
                        aria-pressed={frame.chosen}
                        className={`relative block w-full overflow-hidden rounded-lg border-2 ${frame.chosen ? "border-purple-400" : "border-transparent hover:border-white/30"}`}>
                  {frame.url && <img src={frame.url} alt={`Shot ${frame.shotNumber ?? ""}`} className="aspect-[9/16] w-full object-cover" />}
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">Shot {frame.shotNumber ?? "–"}</span>
                  {frame.chosen && <span className="absolute right-1 top-1 rounded-full bg-purple-500 p-0.5 text-white"><Check size={12} /></span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end gap-2">
          {onProfile ? (
            <button type="button" onClick={onClose} className="creator-primary px-4 py-2 text-sm font-bold text-white">Done</button>
          ) : (
            <button type="button" onClick={handlePublish} disabled={publishState.isLoading}
                    className="creator-primary flex items-center gap-2 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {publishState.isLoading ? <Loader2 size={14} className="animate-spin" /> : <UserCircle size={14} />} Publish to profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
