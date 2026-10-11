// @ts-nocheck
import React from "react";
import { Loader2, X } from "lucide-react";
import { useGetOfficialUploadQuery, useGetYouTubeConnectionQuery, useGetYouTubeKitQuery } from "../../api/showcaseEndpoints.js";
import { ConnectionCard, PublishCard } from "../outreach/YouTubePanel.jsx";
import { errorMessage } from "./showcaseLabels.js";

const OFFICIAL_STATUS = {
  QUEUED: "Queued for Dalaillama's channel",
  UPLOADING: "Uploading to Dalaillama's channel",
  DONE: "On Dalaillama's channel",
  FAILED: "Dalaillama's channel upload failed; our team will look at it",
  NEEDS_MANUAL: "Dalaillama's channel upload needs our team to finish it",
};

/** Publish a finished film to the creator's own YouTube channel (connect with Google right here if
 * needed). Every upload from Dalaillama carries the Dalaillama stamp. Paid films with the client's
 * consent also go to Dalaillama's channel automatically -- nothing to do for that. */
export default function PublishToShowcaseDialog({ projectId, onClose }) {
  const { data: kit, isLoading, error } = useGetYouTubeKitQuery(projectId);
  const { data: connection } = useGetYouTubeConnectionQuery();
  const { data: official } = useGetOfficialUploadQuery(projectId, { pollingInterval: 15000 });
  const connected = connection?.connected && connection.canPublish;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="publish-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="creator-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="publish-title" className="text-base font-bold text-white">Publish to YouTube</h3>
            <p className="mt-1 text-xs text-slate-400">Goes to your own channel, stamped "Made on Dalaillama".</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="creator-control flex h-8 w-8 items-center justify-center text-slate-300">
            <X size={14} />
          </button>
        </div>

        {isLoading && <p className="mt-3 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>}
        {error && <p className="mt-3 text-sm text-rose-200">{errorMessage(error, "Could not load this film")}</p>}
        {kit && !kit.filmReady && <p className="mt-3 text-sm text-amber-200">Publish the finished film to the review page first.</p>}

        {kit && kit.filmReady && (
          <div className="mt-4 space-y-4">
            {!connected && <ConnectionCard connection={connection} />}
            {connected && (
              <p className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
                Once the upload finishes, this film appears on your profile as "Made on Dalaillama". It shows to brands only when
                it's <b>Public</b> on YouTube; Private and Unlisted stay off your profile.
              </p>
            )}
            {connected && <PublishCard projectId={projectId} />}
            <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
              {official
                ? `${OFFICIAL_STATUS[official.status] || official.status}${official.error && official.status !== "DONE" ? ` · ${official.error}` : ""}`
                : kit.officialUploadAvailable
                  ? "Dalaillama's channel: this film goes there automatically, credited to you."
                  : `Dalaillama's channel: ${kit.officialUploadBlockedReason || "not for this film"}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
