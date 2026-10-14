// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Globe, Loader2, MapPin } from "lucide-react";
import ShowcaseGrid from "../showcase/ShowcaseGrid.jsx";
import PublicHeader, { PublicFooter } from "../showcase/PublicHeader.jsx";
import { getCreator } from "../showcase/showcaseApi.js";
import { INDUSTRY_LABEL } from "../showcase/labels.js";
import { FollowButton, RequestVideoButton } from "../showcase/BrandActions.jsx";

/** dalaillama.in/c/<handle>: one creator's films, platform films first. ?industry= brings the
 * films for that industry to the top (how mail links open it). */
export default function CreatorPublicPage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const industry = new URLSearchParams(window.location.search).get("industry");
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    getCreator(handle)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        // A handle the creator changed answers with the new one: show the new address.
        if (p && p.handle !== handle) navigate(`/c/${p.handle}${window.location.search}`, { replace: true });
      })
      .catch(() => !cancelled && setProfile(null));
    return () => { cancelled = true; };
  }, [handle, navigate]);

  useEffect(() => {
    if (!profile) return undefined;
    document.title = `${profile.displayName} · Dalai Llama`;
    // Not ready = "coming soon": keep it out of search engines until there's work to show.
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = profile.ready ? "index,follow" : "noindex";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, [profile]);

  if (profile === undefined) {
    return <Shell><p className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading…</p></Shell>;
  }
  if (profile === null) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">This creator's page isn't available</h1>
        <a href="/creators" className="mt-3 inline-block font-semibold text-purple-300">See all creators</a>
      </Shell>
    );
  }

  const items = industry
    ? [...profile.items].sort((a, b) => (b.industry === industry) - (a.industry === industry))
    : profile.items;
  const platform = items.filter((i) => i.origin === "PLATFORM");
  const other = items.filter((i) => i.origin !== "PLATFORM");

  return (
    <Shell>
      <section className="flex flex-wrap items-start gap-5">
        {profile.avatarUrl && <img src={profile.avatarUrl} alt="" className="h-24 w-24 rounded-full border-4 border-white object-cover shadow" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">{profile.displayName}</h1>
          {profile.companyName && profile.companyName !== profile.displayName && (
            <p className="mt-0.5 text-sm font-semibold text-slate-400">{profile.companyName}</p>
          )}
          {profile.headline && <p className="mt-1 text-lg text-slate-300">{profile.headline}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {profile.countryCode && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.countryCode}</span>}
            {profile.industries.map((i) => INDUSTRY_LABEL[i]).join(" · ")}
            {profile.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noreferrer nofollow" className="flex items-center gap-1 text-purple-300"><Globe size={14} /> Website</a>
            )}
            {profile.youtubeChannelUrl && (
              <a href={profile.youtubeChannelUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-300">YouTube <ExternalLink size={12} /></a>
            )}
          </p>
          {profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-slate-300">{profile.bio}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <RequestVideoButton profile={profile} />
          <FollowButton profile={profile} />
        </div>
      </section>

      {!profile.ready ? (
        <p className="mt-10 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-6 text-center text-slate-400 shadow-sm">
          {profile.displayName}'s films are coming soon.
        </p>
      ) : (
        <>
          {platform.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-white">Made on Dalaillama</h2>
              <ShowcaseGrid cards={platform} showCreator={false} />
            </section>
          )}
          {other.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-white">{platform.length > 0 ? "More work" : "Work"}</h2>
              <ShowcaseGrid cards={other} showCreator={false} />
            </section>
          )}
        </>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen creator-app text-slate-100">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">{children}</main>
      <PublicFooter />
    </div>
  );
}
