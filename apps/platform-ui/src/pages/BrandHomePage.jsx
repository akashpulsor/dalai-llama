// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ExternalLink, Loader2, LogOut } from "lucide-react";
import { getMe, getMyInquiries, isSignedIn, savePreferences, signOut, SignInRequired } from "../showcase/brandApi.js";
import { BUDGET_LABEL, TIMELINE_LABEL } from "../showcase/BrandActions.jsx";
import { INDUSTRIES } from "../showcase/labels.js";

const STATUS = {
  NEW: ["Sent", "bg-slate-700 text-slate-100"],
  VIEWED: ["Seen", "bg-sky-900 text-sky-200"],
  CONVERTED: ["Brief ready", "bg-emerald-900 text-emerald-200"],
  DECLINED: ["Declined", "bg-rose-950 text-rose-300"],
};

/** /brands/home: what a signed-in brand has going on: requests (with the brief once the creator
 * sends one), creators they follow, and whether we email them picks. Dark, like the creator app. */
export default function BrandHomePage() {
  const [me, setMe] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSignedIn()) {
      window.location.replace("/brands/sign-in");
      return;
    }
    Promise.all([getMe(), getMyInquiries()])
      .then(([m, i]) => { setMe(m); setInquiries(i); })
      .catch((e) => (e instanceof SignInRequired ? window.location.replace("/brands/sign-in") : setError(e.message)));
  }, []);

  const leave = () => { signOut(); window.location.assign("/"); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="/" className="text-lg font-bold">Dalai Llama</a>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <a href="/creators" className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800">Find creators</a>
          <button type="button" onClick={leave} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800">
            <LogOut size={14} /> Sign out
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {error && <p className="text-rose-400">{error}</p>}
        {!me && !error && <p className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</p>}
        {me && (
          <>
            <h1 className="text-2xl font-bold">{me.companyName || me.contactName || me.email}</h1>
            <p className="text-sm text-slate-400">{me.email}</p>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
                <h2 className="font-bold">Your requests</h2>
                {inquiries.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    None yet. <a href="/creators" className="font-semibold text-indigo-300">Find a creator</a> and ask for a video.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-800">
                    {inquiries.map((q) => <InquiryRow key={q.id} q={q} />)}
                  </ul>
                )}
              </section>
              <div className="space-y-6">
                <Following list={me.following} />
                <Preferences me={me} onSaved={setMe} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function InquiryRow({ q }) {
  const [label, tone] = STATUS[q.status];
  return (
    <li className="flex flex-wrap items-start gap-3 py-4">
      {q.creatorAvatarUrl && <img src={q.creatorAvatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          <a href={`/c/${q.creatorHandle}`} className="hover:underline">{q.creatorName}</a>
          {q.filmTitle && <span className="font-normal text-slate-400"> · about “{q.filmTitle}”</span>}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-300">{q.message}</p>
        <p className="mt-1 text-xs text-slate-500">
          {[BUDGET_LABEL[q.budgetBand], TIMELINE_LABEL[q.timeline], new Date(q.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
        {q.briefUrl && (
          <a href={q.briefUrl} className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:underline">
            Open brief <ExternalLink size={12} />
          </a>
        )}
      </div>
    </li>
  );
}

function Following({ list }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="font-bold">Following</h2>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Follow creators to find them here.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {list.map((c) => (
            <li key={c.handle}>
              <a href={`/c/${c.handle}`} className="flex items-center gap-3 hover:opacity-80">
                {c.avatarUrl && <img src={c.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{c.displayName}</span>
                  {c.headline && <span className="block truncate text-xs text-slate-400">{c.headline}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Preferences({ me, onSaved }) {
  const [prefs, setPrefs] = useState({ autoPicksOptIn: me.autoPicksOptIn, autoCadenceDays: me.autoCadenceDays, industry: me.industry || "" });
  const [state, setState] = useState("idle");
  const save = async (event) => {
    event.preventDefault();
    setState("saving");
    try {
      onSaved(await savePreferences({ ...prefs, industry: prefs.industry || null }));
      setState("saved");
    } catch {
      setState("error");
    }
  };
  const control = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm font-normal text-slate-100";
  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="font-bold">Picks by email</h2>
      <label className="flex items-start gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={prefs.autoPicksOptIn} onChange={(e) => setPrefs({ ...prefs, autoPicksOptIn: e.target.checked })} className="mt-1" />
        Send me new films from creators in my industry
      </label>
      <label className="block text-sm font-semibold text-slate-300">Industry
        <select value={prefs.industry} onChange={(e) => setPrefs({ ...prefs, industry: e.target.value })} className={control}>
          <option value="">Choose…</option>
          {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-300">At most every
        <select value={prefs.autoCadenceDays} onChange={(e) => setPrefs({ ...prefs, autoCadenceDays: Number(e.target.value) })} className={control}>
          {[7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} days</option>)}
        </select>
      </label>
      <button type="submit" disabled={state === "saving"} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save</button>
      {state === "saved" && <span className="ml-3 text-xs text-emerald-300">Saved</span>}
      {state === "error" && <span className="ml-3 text-xs text-rose-400">Couldn't save</span>}
    </form>
  );
}
