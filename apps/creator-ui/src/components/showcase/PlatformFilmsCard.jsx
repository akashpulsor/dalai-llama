// @ts-nocheck
import React, { useState } from "react";
import { Film, Upload } from "lucide-react";
import { useGetPublishableFilmsQuery, useGetPublishJobsQuery, useGetYouTubeChannelsQuery } from "../../api/showcaseEndpoints.js";
import PublishToShowcaseDialog from "./PublishToShowcaseDialog.jsx";

const STATUS = {
  QUEUED: "Waiting to upload",
  UPLOADING: "Uploading",
  PUBLISHED: "On YouTube",
  SCHEDULED: "Scheduled",
  FAILED: "Upload failed",
  CANCELLED: "Cancelled",
};

/** The films made on Dalaillama, each publishable to one of the creator's YouTube channels from
 * here. Once uploaded, a film goes on the profile as "Made on Dalaillama". */
export default function PlatformFilmsCard() {
  const { data: films = [], isLoading } = useGetPublishableFilmsQuery();
  const { data: jobs = [] } = useGetPublishJobsQuery();
  const { data: channels = [] } = useGetYouTubeChannelsQuery();
  const [publishing, setPublishing] = useState(null);
  const titles = Object.fromEntries(channels.map((c) => [c.connectionId, c.channelTitle]));

  if (isLoading) return <p className="creator-panel p-5 text-sm text-slate-400">Loading your films…</p>;
  if (films.length === 0) {
    return <p className="creator-panel p-5 text-sm text-slate-400">No finished films yet. A film appears here once it's published in its project.</p>;
  }
  return (
    <>
      <ul className="space-y-2">
        {films.map((film) => {
          // Newest first from the API: the latest attempt per channel says where the film stands.
          const latest = jobs.filter((j) => j.projectId === film.projectId)
            .filter((j, i, all) => all.findIndex((k) => k.connectionId === j.connectionId) === i);
          return (
            <li key={film.projectId} className="creator-panel flex flex-wrap items-center gap-3 p-3">
              <Film size={16} className="shrink-0 text-purple-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{film.name}</p>
                <p className="text-xs text-slate-400">
                  {film.renderedAt ? `Finished ${new Date(film.renderedAt).toLocaleDateString()}` : "Finished"}
                  {!film.clientConsented && " · client hasn't agreed to marketing use, so private only"}
                </p>
                {latest.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-300">
                    {latest.map((j) => `${STATUS[j.status] || j.status}${titles[j.connectionId] ? ` on ${titles[j.connectionId]}` : ""}`).join(" · ")}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setPublishing(film.projectId)}
                      className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white">
                <Upload size={13} /> Publish to YouTube
              </button>
            </li>
          );
        })}
      </ul>
      {publishing && <PublishToShowcaseDialog projectId={publishing} onClose={() => setPublishing(null)} />}
    </>
  );
}
