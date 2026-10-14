// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, UserCircle } from "lucide-react";
import ProfileForm from "../components/showcase/ProfileForm.jsx";
import VideoPickerGrid from "../components/showcase/VideoPickerGrid.jsx";
import ShowcaseManager from "../components/showcase/ShowcaseManager.jsx";
import PlatformFilmsCard from "../components/showcase/PlatformFilmsCard.jsx";
import LadderCard from "../components/showcase/LadderCard.jsx";
import { ConnectionCard, useYouTubeResultFlash } from "../components/outreach/YouTubePanel.jsx";
import { RequestsList } from "./RequestsPage.jsx";
import { useGetMyPublicProfileQuery } from "../api/showcaseEndpoints.js";
import { useGetYouTubeConnectionQuery } from "../api/showcaseEndpoints.js";

const heading = "mb-3 text-sm font-bold uppercase tracking-normal text-slate-300";

/** One page for the creator's public presence: the profile brands see, the YouTube channel
 * (connected with Google, which also proves it is theirs), the videos shown, brand requests,
 * and where they stand. */
export default function CreatorProfilePage() {
  useYouTubeResultFlash();
  const { data: profile } = useGetMyPublicProfileQuery();
  const { data: connection } = useGetYouTubeConnectionQuery();
  const [editing, setEditing] = useState(false);
  const channelConnected = Boolean(connection?.channelId);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id) window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-100"><UserCircle size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.displayName || "Your profile"}</h1>
            <p className="text-sm font-medium text-slate-400">What brands see: your videos, and the requests they send you.</p>
          </div>
        </div>
        {profile?.publicUrl && (
          <a href={profile.publicUrl} target="_blank" rel="noreferrer" className="creator-control flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200">
            View public page <ExternalLink size={13} />
          </a>
        )}
      </div>

      <section className="mb-6">
        <button type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing}
                className="creator-panel flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
          <span>
            <span className="block text-sm font-bold uppercase tracking-normal text-slate-300">Profile details</span>
            {profile && (
              <span className="mt-0.5 block text-xs text-slate-400">
                @{profile.handle}{profile.missing?.length ? ` · ${profile.missing.length} things to finish` : " · complete"}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
            {editing ? "Close" : "Edit"} <ChevronDown size={16} className={`transition ${editing ? "rotate-180" : ""}`} />
          </span>
        </button>
        {editing && <div className="mt-4"><ProfileForm /></div>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section id="videos">
            <h2 className={heading}>On your profile</h2>
            <ShowcaseManager />
          </section>
          <section id="films">
            <h2 className={heading}>Films made on Dalaillama</h2>
            <PlatformFilmsCard />
          </section>
          <section>
            <h2 className={heading}>Your channel's videos</h2>
            {channelConnected
              ? <VideoPickerGrid />
              : <p className="creator-panel p-5 text-sm text-slate-400">Connect your YouTube channel to pick videos for your profile.</p>}
          </section>
          <section id="requests">
            <h2 className={heading}>Requests from brands</h2>
            <RequestsList />
          </section>
        </div>

        <aside className="space-y-6">
          <ConnectionCard connection={connection} />
          <LadderCard />
        </aside>
      </div>
    </div>
  );
}
