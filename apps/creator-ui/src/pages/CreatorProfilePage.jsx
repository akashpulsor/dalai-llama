// @ts-nocheck
import React, { useState } from "react";
import { UserCircle } from "lucide-react";
import ProfileForm from "../components/showcase/ProfileForm.jsx";
import ChannelLinkWizard from "../components/showcase/ChannelLinkWizard.jsx";
import VideoPickerGrid from "../components/showcase/VideoPickerGrid.jsx";
import ShowcaseManager from "../components/showcase/ShowcaseManager.jsx";
import LadderCard from "../components/showcase/LadderCard.jsx";

const TABS = [
  ["profile", "Profile"],
  ["showcase", "Showcase"],
  ["visibility", "Visibility"],
];

/** The creator's public profile, their YouTube channel and showcase videos, and where they stand. */
export default function CreatorProfilePage() {
  const [tab, setTab] = useState("profile");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-100">
          <UserCircle size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Public profile</h1>
          <p className="text-sm font-medium text-slate-400">What brands see, and the work you show them.</p>
        </div>
      </div>

      <div role="tablist" aria-label="Profile sections" className="mb-5 flex gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    tab === id ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileForm />}
      {tab === "showcase" && (
        <div className="space-y-6">
          <ChannelLinkWizard />
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-normal text-slate-300">On your profile</h2>
            <ShowcaseManager />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-normal text-slate-300">Your channel's videos</h2>
            <VideoPickerGrid />
          </section>
        </div>
      )}
      {tab === "visibility" && <LadderCard />}
    </div>
  );
}
