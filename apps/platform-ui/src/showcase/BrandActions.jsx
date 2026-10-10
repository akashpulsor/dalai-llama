// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Heart, UserPlus, Check, X } from "lucide-react";
import { follow, isSignedIn, likedHere, requestVideo, setLiked, SignInRequired, unfollow, attributionToken } from "./brandApi.js";

/** Sends the visitor to sign in, remembering what to do once they're back. */
export function goSignIn(pendingAction) {
  window.location.assign(`/brands/sign-in?next=${encodeURIComponent(pendingAction)}`);
}

export function LikeButton({ card }) {
  const [liked, setLikedState] = useState(() => likedHere(card.publicId));
  const [count, setCount] = useState(card.likeCount || 0);
  const toggle = async () => {
    const next = !liked;
    setLikedState(next);
    try {
      setCount((await setLiked(card.publicId, next)).likeCount);
    } catch {
      setLikedState(!next);
    }
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={liked}
            className={`flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-sm font-bold ${liked ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
      <Heart size={15} fill={liked ? "currentColor" : "none"} /> {count > 0 ? count : "Like"}
    </button>
  );
}

export function FollowButton({ profile }) {
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(profile.followerCount || 0);
  const [busy, setBusy] = useState(false);

  // Finish a follow started before sign-in.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("then") === "follow" && isSignedIn()) toggle(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(want = !following) {
    if (!isSignedIn()) return goSignIn(`follow:${profile.handle}`);
    setBusy(true);
    try {
      const state = want ? await follow(profile.handle) : await unfollow(profile.handle);
      setFollowing(state.following);
      setCount(state.followerCount);
    } catch (e) {
      if (e instanceof SignInRequired) goSignIn(`follow:${profile.handle}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={() => toggle()} disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-50">
      {following ? <Check size={15} /> : <UserPlus size={15} />}
      {following ? "Following" : "Follow"}{count > 0 ? ` · ${count}` : ""}
    </button>
  );
}

const BUDGETS = [
  ["UNDER_50K", "Under ₹50k"],
  ["FROM_50K_TO_2L", "₹50k – 2L"],
  ["FROM_2L_TO_8L", "₹2L – 8L"],
  ["OVER_8L", "Over ₹8L"],
  ["NOT_SURE", "Not sure yet"],
];
const TIMELINES = [
  ["ASAP", "As soon as possible"],
  ["THIS_MONTH", "This month"],
  ["THIS_QUARTER", "This quarter"],
  ["EXPLORING", "Just exploring"],
];

export function RequestVideoButton({ profile, film }) {
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get("then") === "request" && isSignedIn());
  const start = () => (isSignedIn() ? setOpen(true) : goSignIn(`request:${profile.handle}`));
  return (
    <>
      <button type="button" onClick={start}
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800">
        Request a video
      </button>
      {open && <RequestDialog profile={profile} film={film} onClose={() => setOpen(false)} />}
    </>
  );
}

function RequestDialog({ profile, film, onClose }) {
  const [form, setForm] = useState({ budgetBand: "NOT_SURE", timeline: "THIS_MONTH", message: "" });
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setState("sending");
    try {
      await requestVideo(profile.handle, { ...form, publicId: film?.publicId || null, attributionToken: attributionToken() });
      setState("sent");
    } catch (e) {
      if (e instanceof SignInRequired) return goSignIn(`request:${profile.handle}`);
      setError(e.message);
      setState("idle");
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="request-title"
         className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 id="request-title" className="text-lg font-bold text-slate-900">Request a video from {profile.displayName}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        {state === "sent" ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>Sent. {profile.displayName} will reply by email, usually with a brief for you to review.</p>
            <a href="/brands/home" className="font-bold text-indigo-700">See your requests</a>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            {film && <p className="text-sm text-slate-600">About: <span className="font-semibold">{film.title}</span></p>}
            <label className="block text-sm font-semibold text-slate-700">
              What do you need?
              <textarea required maxLength={1000} rows={4} value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Product, where it will run, length, anything you liked in their work"
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Budget
                <select value={form.budgetBand} onChange={(e) => setForm({ ...form, budgetBand: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal">
                  {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                When
                <select value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal">
                  {TIMELINES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={state === "sending" || !form.message.trim()}
                    className="w-full rounded-lg bg-indigo-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {state === "sending" ? "Sending…" : "Send request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export const BUDGET_LABEL = Object.fromEntries(BUDGETS);
export const TIMELINE_LABEL = Object.fromEntries(TIMELINES);
