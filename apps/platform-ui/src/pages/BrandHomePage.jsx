// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getMe, getMyInquiries, isSignedIn, savePreferences, signOut, SignInRequired, unfollow } from "../showcase/brandApi.js";
import { getFeed } from "../showcase/showcaseApi.js";
import ShowcaseGrid from "../showcase/ShowcaseGrid.jsx";
import BrandLogo from "../showcase/BrandLogo.jsx";
import { BUDGET_LABEL } from "../showcase/BrandActions.jsx";
import { INDUSTRIES, INDUSTRY_LABEL } from "../showcase/labels.js";

// Brand Console (Figma "Brand home"): the palette and type of the design.
const C = { bg: "#05070D", bar: "#070A12", panel: "#0B101C", line: "#1B2230", text: "#F1F5F9", muted: "#94A3B8", soft: "#CBD5E1" };
const STATUS = {
  NEW: ["Sent to creator", "rgba(148,163,184,.10)", "#CBD5E1", "rgba(148,163,184,.25)"],
  VIEWED: ["Creator viewed", "rgba(139,92,246,.14)", "#D8B4FE", "rgba(168,85,247,.38)"],
  CONVERTED: ["Brief ready", "rgba(56,214,122,.12)", "#6EE7A8", "rgba(56,214,122,.35)"],
  DECLINED: ["Declined", "rgba(244,63,94,.10)", "#FDA4AF", "rgba(244,63,94,.30)"],
};
const AVATAR_TONES = ["#3B2A63", "#1E3A5F", "#14402D", "#3F2A1E"];
const CADENCES = [[7, "Weekly"], [14, "Every two weeks"], [30, "Monthly"]];
const panel = { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16 };

const initial = (s) => (s || "?").trim().charAt(0).toUpperCase();
const tone = (s) => AVATAR_TONES[(s || "").length % AVATAR_TONES.length];

/** /brands/home: the brand's console after signing in -- their requests, new films for their
 * industry, creators they follow, and what we email them. */
export default function BrandHomePage() {
  const [me, setMe] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [films, setFilms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSignedIn()) { window.location.replace("/brands/sign-in"); return; }
    Promise.all([getMe(), getMyInquiries()])
      .then(([m, i]) => { setMe(m); setInquiries(i); })
      .catch((e) => (e instanceof SignInRequired ? window.location.replace("/brands/sign-in") : setError(e.message)));
  }, []);

  useEffect(() => {
    if (!me) return;
    getFeed({ tab: "NEW", industry: me.industry || "", format: "", page: 0 })
      .then((r) => setFilms((r?.items || []).slice(0, 8)))
      .catch(() => setFilms([]));
  }, [me?.industry]); // eslint-disable-line react-hooks/exhaustive-deps

  const name = me?.contactName?.split(" ")[0] || me?.companyName || "there";
  const industryLabel = me?.industry ? INDUSTRY_LABEL[me.industry] : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontWeight: 500, fontSize: 15, lineHeight: 1.5 }}>
      <Header me={me} />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 20px 64px", display: "flex", flexDirection: "column", gap: 28, boxSizing: "border-box" }}>
        {error && <p style={{ color: "#FDA4AF" }}>{error}</p>}
        {!me && !error && <p style={{ display: "flex", gap: 8, alignItems: "center", color: C.muted }}><Loader2 size={16} className="animate-spin" /> Loading…</p>}
        {me && (
          <>
            <section>
              {industryLabel && (
                <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "#D8B4FE", border: "1px solid rgba(168,85,247,.38)", padding: "3px 10px", borderRadius: 999 }}>
                  {industryLabel}
                </span>
              )}
              <h1 style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Hi {name}</h1>
              <p style={{ margin: "6px 0 0", color: C.muted }}>Your requests to creators, new films for your industry, and the creators you follow.</p>
            </section>

            <Requests inquiries={inquiries} />

            <section aria-labelledby="picks-h" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
                <h2 id="picks-h" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
                  {industryLabel ? `New films for ${industryLabel.toLowerCase()}` : "New films from our creators"}
                </h2>
                <a href={`/creators${me.industry ? `?industry=${me.industry}` : ""}`} style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "#C4B5FD" }}>See all</a>
              </div>
              {films.length === 0
                ? <p style={{ ...panel, padding: 18, margin: 0, color: C.muted }}>New films show up here as creators publish them.</p>
                : <ShowcaseGrid cards={films} />}
            </section>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              <Following me={me} onChange={setMe} />
              <EmailPrefs me={me} onSaved={setMe} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Header({ me }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const who = me?.contactName || me?.email || "";
  return (
    <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: `1px solid ${C.line}`, background: C.bar }}>
      <a href="/brands/home" style={{ textDecoration: "none", color: C.text }} aria-label="Brand home"><BrandLogo /></a>
      <a href="/creators" style={{ height: 44, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.line}`, color: C.soft, textDecoration: "none", fontWeight: 600 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        Browse creators
      </a>
      {me && (
        <div ref={ref} style={{ marginLeft: "auto", position: "relative" }}>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Account menu for ${who}`}
                  style={{ display: "flex", alignItems: "center", gap: 10, height: 44, padding: "0 12px 0 4px", border: `1px solid ${C.line}`, borderRadius: 999, background: C.panel, color: C.text, font: "inherit", cursor: "pointer" }}>
            <span style={{ width: 34, height: 34, borderRadius: 999, background: "#3B2A63", color: "#DDD6FE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initial(who)}</span>
            <span style={{ textAlign: "left", lineHeight: 1.2 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{me.contactName || me.email}</span>
              {me.companyName && <span style={{ display: "block", fontSize: 12, color: C.muted }}>{me.companyName}</span>}
            </span>
          </button>
          {open && (
            <div role="menu" style={{ position: "absolute", right: 0, top: 50, minWidth: 200, ...panel, padding: 6, zIndex: 20 }}>
              <p style={{ margin: 0, padding: "8px 10px", fontSize: 12, color: C.muted }}>{me.email}</p>
              <button type="button" role="menuitem" onClick={signOut}
                      style={{ width: "100%", textAlign: "left", padding: "10px", borderRadius: 8, border: 0, background: "transparent", color: C.text, font: "inherit", cursor: "pointer" }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function Requests({ inquiries }) {
  return (
    <section aria-labelledby="req-h" style={{ ...panel, overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "18px 20px 14px" }}>
        <h2 id="req-h" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Your requests</h2>
        <span style={{ color: C.muted, fontSize: 14 }}>{inquiries.length} sent</span>
      </div>
      {inquiries.length === 0 ? (
        <p style={{ margin: 0, padding: "14px 20px 20px", borderTop: `1px solid ${C.line}`, color: C.muted }}>
          None yet. <a href="/creators" style={{ color: "#C4B5FD", fontWeight: 600 }}>Browse creators</a> and request a video.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {inquiries.map((q) => {
            const [label, bg, fg, border] = STATUS[q.status] || STATUS.NEW;
            const details = [q.filmTitle ? `About “${q.filmTitle}”` : null, BUDGET_LABEL[q.budgetBand], `sent ${new Date(q.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`].filter(Boolean).join(" · ");
            return (
              <li key={q.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: `1px solid ${C.line}` }}>
                {q.creatorAvatarUrl
                  ? <img src={q.creatorAvatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }} />
                  : <span style={{ width: 40, height: 40, borderRadius: 999, background: tone(q.creatorName), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initial(q.creatorName)}</span>}
                <span style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <a href={`/c/${q.creatorHandle}`} style={{ display: "block", fontWeight: 600, color: C.text, textDecoration: "none" }}>{q.creatorName}</a>
                  <span style={{ display: "block", fontSize: 13.5, color: C.muted }}>{details}</span>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: bg, color: fg, border: `1px solid ${border}` }}>{label}</span>
                {q.briefUrl && (
                  <a href={q.briefUrl} style={{ height: 40, display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: 10, background: "#7C3AED", color: "#FFFFFF", textDecoration: "none", fontWeight: 700 }}>Open brief</a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Following({ me, onChange }) {
  const [busy, setBusy] = useState("");
  const drop = async (handle) => {
    setBusy(handle);
    try {
      await unfollow(handle);
      onChange({ ...me, following: me.following.filter((c) => c.handle !== handle) });
    } finally { setBusy(""); }
  };
  return (
    <section aria-labelledby="follow-h" style={{ flex: "1 1 400px", minWidth: 0, ...panel, padding: "18px 20px" }}>
      <h2 id="follow-h" style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 700 }}>Creators you follow</h2>
      {me.following.length === 0 ? (
        <p style={{ margin: 0, color: C.muted }}>Follow creators from their page to see them here.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {me.following.map((f) => (
            <li key={f.handle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
              {f.avatarUrl
                ? <img src={f.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }} />
                : <span style={{ width: 40, height: 40, borderRadius: 999, background: tone(f.displayName), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initial(f.displayName)}</span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600 }}>{f.displayName}</span>
                {f.headline && <span style={{ display: "block", fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.headline}</span>}
              </span>
              <a href={`/c/${f.handle}`} style={{ fontSize: 14, fontWeight: 600, color: "#C4B5FD" }}>Profile</a>
              <button type="button" onClick={() => drop(f.handle)} disabled={busy === f.handle}
                      style={{ height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: "transparent", color: C.soft, font: "inherit", fontSize: 13, cursor: "pointer" }}>
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmailPrefs({ me, onSaved }) {
  const [prefs, setPrefs] = useState({ autoPicksOptIn: me.autoPicksOptIn, autoCadenceDays: me.autoCadenceDays || 7, industry: me.industry || "" });
  const [state, setState] = useState("idle");
  const save = async (next) => {
    setPrefs(next);
    setState("saving");
    try {
      onSaved(await savePreferences({ ...next, industry: next.industry || null }));
      setState("saved");
    } catch {
      setState("error");
    }
  };
  const field = { height: 44, borderRadius: 10, border: `1px solid ${C.line}`, padding: "0 10px", font: "inherit", color: C.text, background: C.bar };
  return (
    <section aria-labelledby="mail-h" style={{ flex: "1 1 300px", minWidth: 0, ...panel, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 id="mail-h" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Email from us</h2>
      <label htmlFor="industry" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, color: C.soft }}>Your industry
        <select id="industry" value={prefs.industry} onChange={(e) => save({ ...prefs, industry: e.target.value })} style={field}>
          <option value="">Choose…</option>
          {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label htmlFor="picks-toggle" style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
        <input id="picks-toggle" type="checkbox" checked={prefs.autoPicksOptIn} onChange={(e) => save({ ...prefs, autoPicksOptIn: e.target.checked })}
               style={{ width: 20, height: 20, marginTop: 2, accentColor: "#8B5CF6" }} />
        <span><span style={{ display: "block", fontWeight: 600 }}>New films for my industry</span><span style={{ display: "block", fontSize: 13.5, color: C.muted }}>Includes new work from creators you follow</span></span>
      </label>
      <label htmlFor="cadence" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, color: C.soft }}>How often
        <select id="cadence" value={prefs.autoCadenceDays} disabled={!prefs.autoPicksOptIn}
                onChange={(e) => save({ ...prefs, autoCadenceDays: Number(e.target.value) })} style={field}>
          {CADENCES.map(([days, label]) => <option key={days} value={days}>{label}</option>)}
        </select>
      </label>
      <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
        You never get more than one email a day from us.{state === "saved" ? " Saved." : state === "error" ? " Couldn't save; try again." : ""}
      </p>
      {prefs.autoPicksOptIn && (
        <button type="button" onClick={() => save({ ...prefs, autoPicksOptIn: false })}
                style={{ alignSelf: "flex-start", padding: 0, border: 0, background: "none", color: "#C4B5FD", font: "inherit", fontSize: 13.5, cursor: "pointer", textDecoration: "underline" }}>
          Stop all emails from us
        </button>
      )}
    </section>
  );
}
