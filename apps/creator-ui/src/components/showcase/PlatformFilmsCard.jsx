// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { CheckCircle2, Film, Loader2, Upload, UserCircle } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetMyShowcaseQuery,
  useGetPublishableFilmsQuery,
  useGetPublishJobsQuery,
  useGetYouTubeChannelsQuery,
  usePublishFilmToProfileMutation,
} from "../../api/showcaseEndpoints.js";
import PublishToShowcaseDialog from "./PublishToShowcaseDialog.jsx";

const STATUS = {
  QUEUED: "Waiting to upload",
  UPLOADING: "Uploading",
  PUBLISHED: "On YouTube",
  SCHEDULED: "Scheduled",
  FAILED: "Upload failed",
  CANCELLED: "Cancelled",
};

/** The films made on Dalaillama: put each on the profile, then share it to one of the creator's
 * YouTube channels from here. */
export default function PlatformFilmsCard() {
  const dispatch = useDispatch();
  const { data: profileItems = [] } = useGetMyShowcaseQuery();
  const [publishToProfile, profileState] = usePublishFilmToProfileMutation();
  const onProfile = (projectId) => profileItems.some((item) => item.sourceProjectId === projectId && item.status === "LIVE");
  const putOnProfile = async (projectId) => {
    try {
      await publishToProfile(projectId).unwrap();
      dispatch(showFlash({ message: "It's on your profile.", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || error?.data?.error || "Could not put it on your profile", type: "error" }));
    }
  };
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
                  {onProfile(film.projectId) && <span className="mr-1.5 inline-flex items-center gap-1 font-bold text-emerald-300"><CheckCircle2 size={11} /> On your profile ·</span>}
                  {film.renderedAt ? `Finished ${new Date(film.renderedAt).toLocaleDateString()}` : "Finished"}
                  {!film.clientConsented && " · client hasn't agreed to marketing use, so private only"}
                </p>
                {latest.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-300">
                    {latest.map((j) => `${STATUS[j.status] || j.status}${titles[j.connectionId] ? ` on ${titles[j.connectionId]}` : ""}`).join(" · ")}
                  </p>
                )}
              </div>
              {!onProfile(film.projectId) && (
                <button type="button" onClick={() => putOnProfile(film.projectId)} disabled={profileState.isLoading}
                        className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {profileState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <UserCircle size={13} />} Publish to profile
                </button>
              )}
              <button type="button" onClick={() => setPublishing(film.projectId)}
                      className="creator-control flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200">
                <Upload size={13} /> Share to YouTube
              </button>
            </li>
          );
        })}
      </ul>
      {publishing && <PublishToShowcaseDialog projectId={publishing} onClose={() => setPublishing(null)} />}
    </>
  );
}
