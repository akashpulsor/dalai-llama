// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Heart, UserPlus, Check, X } from "lucide-react";
import { follow, isSignedIn, likedHere, requestVideo, requestVideoAsGuest, requestVideoFromDalaillama, setLiked, SignInRequired, unfollow, attributionToken } from "./brandApi.js";
import { INDUSTRIES } from "./labels.js";
import { getCreator } from "./showcaseApi.js";

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
            className={`flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-sm font-bold ${liked ? "border-rose-200 bg-rose-50 text-rose-300" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
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
            className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white/[0.04] ring-1 ring-white/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/10 disabled:opacity-50">
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
  // Arrived from a film's "Request a video" while signed out: sign in (or register), then come back here.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("then") === "request" && !isSignedIn()) goSignIn(`request:${profile.handle}`);
  }, [profile.handle]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = () => (isSignedIn() ? setOpen(true) : goSignIn(`request:${profile.handle}`));
  return (
    <>
      <button type="button" onClick={start}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">
        Request a video
      </button>
      {open && <RequestDialog profile={profile} film={film} onClose={() => setOpen(false)} />}
    </>
  );
}

/** "Request a video" with no creator chosen: Dalaillama finds one for the brand's industry. No
 * sign-in: a visitor who isn't signed in just adds their name and email to the form. Opened from a
 * creator's mail (?then=request&creator=<handle>), it is a request to that creator: the router gives
 * it to them. */
export function RequestFromDalaillamaButton({ className, label = "Request a video", prefill = null, remember = true }) {
  const [open, setOpen] = useState(() => remember && new URLSearchParams(window.location.search).get("then") === "request");
  const { creator, ...fromMail } = remember ? mailPrefill() : {};
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
              className={className || "rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"}>
        {label}
      </button>
      {open && <RequestDialog profile={null} film={null} prefill={{ ...fromMail, ...(prefill || {}) }}
                              creatorHandle={creator || null} onClose={() => setOpen(false)} />}
    </>
  );
}

/** What a mail's "Request a video" link says: the creator, the industry, the inspiration pin. */
function mailPrefill() {
  const q = new URLSearchParams(window.location.search);
  const industry = INDUSTRIES.some(([code]) => code === q.get("industry")) ? q.get("industry") : undefined;
  const pin = /^[0-9]{6,32}$/.test(q.get("inspiration") || "") ? q.get("inspiration") : null;
  return {
    creator: q.get("creator") || null,
    ...(industry ? { industry } : {}),
    ...(pin ? { campaignDirection: `Like this inspiration video: ${window.location.origin}/inspiration?pin=${pin}` } : {}),
  };
}

const DURATIONS = [[15, "15 seconds"], [30, "30 seconds"], [45, "45 seconds"], [60, "60 seconds"], [90, "90 seconds"]];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Kannada", "Malayalam", "Gujarati", "Punjabi"];
const field = "mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] p-2.5 text-sm font-normal text-white placeholder:text-slate-500";
const labelCls = "block text-sm font-semibold text-slate-300";

/** The request is the same brief a creator fills for a new project (rule 48): what the video is
 * for, the product, who it's for, the direction, length and languages, plus budget and timing.
 * When the creator makes it a brief, all of it carries over. */
function RequestDialog({ profile, film, prefill = null, creatorHandle = null, onClose }) {
  const [form, setForm] = useState({
    message: "", productName: "", productDescription: "", targetAudience: "", campaignDirection: "",
    durationSeconds: 30, languages: ["English"], budgetBand: "NOT_SURE", timeline: "THIS_MONTH", industry: "",
    ...(prefill || {}),
  });
  // From a creator's mail: who it goes to, by name.
  const [mailer, setMailer] = useState(null);
  useEffect(() => {
    if (!creatorHandle) return undefined;
    let cancelled = false;
    getCreator(creatorHandle).then((p) => !cancelled && setMailer(p)).catch(() => {});
    return () => { cancelled = true; };
  }, [creatorHandle]);
  // Only a request to Dalaillama can be sent without signing in; who is asking comes with it.
  const guest = !profile && !isSignedIn();
  const [contact, setContact] = useState({ contactName: "", email: "", companyName: "", websiteUrl: "" });
  const setContactField = (key) => (e) => setContact({ ...contact, [key]: e.target.value });
  const [state, setState] = useState("idle");
  // The brief to review and pay, when a creator took the request at once.
  const [briefUrl, setBriefUrl] = useState(null);
  const [error, setError] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [referenceImages, setReferenceImages] = useState([]);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleLanguage = (l) => setForm({
    ...form,
    languages: form.languages.includes(l) ? form.languages.filter((x) => x !== l) : form.languages.length >= 6 ? form.languages : [...form.languages, l],
  });

  const submit = async (event) => {
    event.preventDefault();
    setState("sending");
    try {
      const brief = {
        ...form, durationSeconds: Number(form.durationSeconds), industry: form.industry || null,
        publicId: film?.publicId || new URLSearchParams(window.location.search).get("film") || null,
        attributionToken: attributionToken(),
        creator: profile ? null : creatorHandle,
      };
      // To the creator whose page this is, or to Dalaillama, which routes it to a creator.
      const submitted = profile ? await requestVideo(profile.handle, brief, productImages, referenceImages)
        : guest ? await requestVideoAsGuest(withWebsite(contact), brief, productImages, referenceImages)
          : await requestVideoFromDalaillama(brief, productImages, referenceImages);
      setBriefUrl(submitted?.briefUrl || null);
      setState("sent");
    } catch (e) {
      if (e instanceof SignInRequired) return goSignIn(profile ? `request:${profile.handle}` : "request");
      setError(e.message);
      setState("idle");
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="request-title"
         className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#0B101C] p-6 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="request-title" className="text-xl font-bold text-white">
              {profile ? `New brief for ${profile.displayName}` : mailer ? `Request a video from ${mailer.displayName}` : "Request a video"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {profile
                ? "Tell them what you need. You get a brief with their price straight away: review it and pay to start."
                : mailer
                  ? `Tell ${mailer.displayName} what you need. You get a brief with the price straight away: review it and pay to start.`
                  : "Tell us what you need. We match you with a creator for your industry, and you get a brief with the price straight away: review it and pay to start."}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-white/5"><X size={18} /></button>
        </div>
        {state === "sent" && briefUrl ? (
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <p>Your brief is ready{profile ? ` with ${profile.displayName}` : ""}. Check the details, change anything you like, and pay
              the upfront amount to start production. We've emailed you the link too.</p>
            <a href={briefUrl}
               className="block w-full rounded-lg bg-purple-600 py-3 text-center text-sm font-bold text-white hover:bg-purple-700">
              Review brief &amp; pay
            </a>
          </div>
        ) : state === "sent" ? (
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>{profile
              ? `Sent. ${profile.displayName} will turn it into a brief and email you the link to review and pay.`
              : mailer
                ? `Sent to ${mailer.displayName}. We'll email ${guest ? contact.email.trim() : "you"} the brief to review and pay.`
              : guest
                ? `Sent. We're matching you with a creator, usually within a day, and we'll email ${contact.email.trim()} the brief to review and pay.`
                : "Sent. We're matching you with a creator; your requests page shows who, and we email you the brief."}</p>
            {!guest && <a href="/brands/home" className="font-bold text-purple-300">See your requests</a>}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-5">
            {film && <p className="text-sm text-slate-400">Inspired by: <span className="font-semibold text-slate-200">{film.title}</span></p>}
            {guest && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelCls}>Your name
                  <input required maxLength={80} autoComplete="name" value={contact.contactName} onChange={setContactField("contactName")} className={field} />
                </label>
                <label className={labelCls}>Work email
                  <input required type="email" maxLength={254} autoComplete="email" value={contact.email} onChange={setContactField("email")}
                         placeholder="you@yourbrand.com" className={field} />
                </label>
                <label className={labelCls}>Brand
                  <input maxLength={120} autoComplete="organization" value={contact.companyName} onChange={setContactField("companyName")} className={field} />
                </label>
                <label className={labelCls}>Website <span className="font-normal text-slate-500">(optional)</span>
                  <input maxLength={255} autoComplete="url" value={contact.websiteUrl} onChange={setContactField("websiteUrl")}
                         placeholder="yourbrand.com" className={field} />
                </label>
              </div>
            )}
            {!profile && (
              <label className={labelCls}>Your industry
                <select value={form.industry} onChange={set("industry")} className={field}>
                  <option value="">Choose one</option>
                  {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </label>
            )}
            <label className={labelCls}>
              What should the video do?
              <textarea required maxLength={1000} rows={4} value={form.message} onChange={set("message")}
                        placeholder="e.g. Launch our new ghee for Diwali, run as Instagram reels and YouTube shorts, drive store visits."
                        className={field} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={labelCls}>Length
                <select value={form.durationSeconds} onChange={set("durationSeconds")} className={field}>
                  {DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className={labelCls}>Budget
                <select value={form.budgetBand} onChange={set("budgetBand")} className={field}>
                  {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className={labelCls}>When
                <select value={form.timeline} onChange={set("timeline")} className={field}>
                  {TIMELINES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            <details className="group space-y-5" open={!!profile}>
              <summary className="cursor-pointer text-sm font-semibold text-purple-300">More details <span className="font-normal text-slate-500">(optional: product, audience, look, images, languages)</span></summary>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className={labelCls}>Product
                  <input maxLength={160} value={form.productName} onChange={set("productName")} placeholder="e.g. A2 Desi Ghee" className={field} />
                </label>
                <label className={labelCls}>Who it's for
                  <input maxLength={500} value={form.targetAudience} onChange={set("targetAudience")} placeholder="e.g. Young parents in metro cities" className={field} />
                </label>
              </div>
              <label className={labelCls}>About the product
                <textarea maxLength={1000} rows={2} value={form.productDescription} onChange={set("productDescription")}
                          placeholder="What it is, what makes it different" className={field} />
              </label>
              <label className={labelCls}>Look and feel
                <textarea maxLength={1000} rows={2} value={form.campaignDirection} onChange={set("campaignDirection")}
                          placeholder="e.g. Warm and homely, morning kitchen, no voice-over" className={field} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImagePicker label="Product photos" files={productImages} onChange={setProductImages}
                             hint={form.productName ? "Photos of the product" : "Name the product above to attach its photos"} disabled={!form.productName} />
                <ImagePicker label="Reference images" files={referenceImages} onChange={setReferenceImages}
                             hint="Looks, moods or ads you like" />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-slate-300">Languages</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button key={l} type="button" onClick={() => toggleLanguage(l)} aria-pressed={form.languages.includes(l)}
                            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${form.languages.includes(l) ? "bg-purple-600 text-white ring-purple-500" : "text-slate-300 ring-white/15 hover:bg-white/5"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </fieldset>
            </details>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={state === "sending" || !form.message.trim() || form.languages.length === 0}
                    className="w-full rounded-lg bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">
              {state === "sending" ? "Sending…" : guest ? "Send request" : "Send brief"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/** "yourbrand.com" is what people type; the server wants a link. */
function withWebsite(contact) {
  const site = contact.websiteUrl.trim();
  return { ...contact, email: contact.email.trim(), websiteUrl: site && !/^https?:\/\//i.test(site) ? `https://${site}` : site };
}

/** Up to 4 images, 3 MB each; previews with remove. */
function ImagePicker({ label, hint, files, onChange, disabled = false }) {
  const [problem, setProblem] = useState("");
  const add = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    const ok = picked.filter((f) => f.type.startsWith("image/") && f.size <= 3 * 1024 * 1024);
    setProblem(ok.length < picked.length ? "Images only, up to 3 MB each." : "");
    onChange([...files, ...ok].slice(0, 4));
  };
  return (
    <div>
      <p className="text-sm font-semibold text-slate-300">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((f, i) => (
          <span key={`${f.name}-${i}`} className="relative">
            <img src={URL.createObjectURL(f)} alt={f.name} className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/15" />
            <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white ring-1 ring-white/30">×</button>
          </span>
        ))}
        {files.length < 4 && (
          <label className={`flex h-16 w-16 items-center justify-center rounded-lg text-2xl text-slate-400 ring-1 ring-dashed ring-white/20 ${disabled ? "opacity-40" : "cursor-pointer hover:bg-white/5"}`}>
            +
            <input type="file" accept="image/*" multiple disabled={disabled} onChange={add} className="hidden" aria-label={`Add ${label.toLowerCase()}`} />
          </label>
        )}
      </div>
      {problem && <p className="mt-1 text-xs text-rose-300">{problem}</p>}
    </div>
  );
}

export const BUDGET_LABEL = Object.fromEntries(BUDGETS);
export const TIMELINE_LABEL = Object.fromEntries(TIMELINES);
