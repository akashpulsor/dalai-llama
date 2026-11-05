import React, { useState } from "react";
import {
  useGetBrandFollowUpQuery,
  useGetBrandPrioritiesQuery,
  useSaveBrandFollowUpMutation,
  useListCreatorMailTemplatesQuery,
  useGetVideoCoverageQuery,
  useGetBrandTemplateStatsQuery,
  useListBrandMailHistoryQuery,
  useGetBrandMailHistoryQuery,
} from "../../api/creatorEndpoints.js";

// Ops "Mail brands": which kinds of brand the inspiration board has too few videos for, how each
// brand template does, and every mail a brand got with what it opened, clicked and requested.

// MailThemes keys as ops read them.
const THEME_LABELS = {
  travelgear: "Bags & luggage", footwear: "Footwear", drinks: "Drinks", pantry: "Pantry (sauces, pickles, spices)",
  snacks: "Snacks", sweets: "Sweets & desserts", coffee: "Coffee", tea: "Tea", nutrition: "Nutrition", wellness: "Wellness",
  skincare: "Skincare", haircare: "Haircare", makeup: "Makeup", fragrance: "Fragrance", bodycare: "Body care",
  jewellery: "Jewellery", ethnic: "Ethnic wear", womenswear: "Womenswear", menswear: "Menswear", streetwear: "Streetwear",
  activewear: "Activewear", kids: "Kids & baby", home: "Home", pet: "Pet", gifting: "Gifting", gadgets: "Gadgets",
};
const themeLabel = (theme) => THEME_LABELS[theme] || theme;
const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
const pct = (n, of) => (of ? `${Math.round((100 * n) / of)}%` : "—");
// Fewer than two videos a brand of the kind, or under five in all: mail to it soon repeats or misses.
const isShort = (c) => c.videos < 5 || c.videos < 2 * c.brands;

function Coverage() {
  const { data: rows = [], isLoading } = useGetVideoCoverageQuery();
  const short = rows.filter(isShort);
  return (
    <div className="creator-panel space-y-2 p-4">
      <h3 className="text-sm font-bold text-white">Videos for each kind of brand</h3>
      <p className="text-xs text-slate-400">
        A brand gets videos about what it sells (from its category, name and website). Kinds marked short need more
        inspiration videos; ops get a mail each morning naming any kind that went out without one.
      </p>
      {isLoading ? <p className="text-xs text-slate-500">Loading…</p> : (
        <>
          {short.length > 0 && <p className="text-xs text-amber-300">Short: {short.map((c) => themeLabel(c.theme)).join(", ")}</p>}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-500">Kind</span><span className="text-right text-slate-500">Brands</span><span className="text-right text-slate-500">Videos</span>
            {rows.map((c) => (
              <React.Fragment key={c.theme}>
                <span className={isShort(c) ? "text-amber-300" : "text-slate-200"}>{themeLabel(c.theme)}</span>
                <span className="text-right text-slate-300">{c.brands}</span>
                <span className={`text-right ${isShort(c) ? "text-amber-300" : "text-slate-300"}`}>{c.videos}</span>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TemplateResults() {
  const { data: rows = [] } = useGetBrandTemplateStatsQuery();
  return (
    <div className="creator-panel space-y-2 p-4">
      <h3 className="text-sm font-bold text-white">How each template does</h3>
      <p className="text-xs text-slate-400">
        Opened counts designed mails only (a plain letter carries no tracking picture; a click counts as an open).
        Requested: the brand sent a request after the mail.
      </p>
      {rows.length === 0 ? <p className="text-xs text-slate-500">No brand mail has gone out yet.</p> : (
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 gap-y-1 text-xs">
          <span className="text-slate-500">Template</span><span className="text-right text-slate-500">Sent</span>
          <span className="text-right text-slate-500">Opened</span><span className="text-right text-slate-500">Clicked</span>
          <span className="text-right text-slate-500">Requested</span>
          {rows.map((t) => (
            <React.Fragment key={t.templateId}>
              <span className={t.active ? "text-slate-200" : "text-slate-500"}>{t.name}{t.active ? "" : " (off)"}</span>
              <span className="text-right text-slate-300">{t.sent}</span>
              <span className="text-right text-slate-300">{t.opened} · {pct(t.opened, t.sent)}</span>
              <span className="text-right text-slate-300">{t.clicked} · {pct(t.clicked, t.sent)}</span>
              <span className="text-right text-emerald-300">{t.requested} · {pct(t.requested, t.sent)}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

const FOLLOW_UP_STAGES = { NOT_OPENED: "Not opened", OPENED: "Opened, no click", CLICKED: "Clicked, no request" };
const LAST_MAIL_STAGES = { LAST_NOT_OPENED: "Never opened", LAST_OPENED: "Opened or clicked" };

/** The funnel, and the weekly inspiration mail it drives: which templates each stage gets, on or off. */
function FollowUps() {
  const { data } = useGetBrandFollowUpQuery();
  const { data: templates = [] } = useListCreatorMailTemplatesQuery("BRANDS");
  const [save, { isLoading: saving, error }] = useSaveBrandFollowUpMutation();
  if (!data) return null;
  const stagesWith = (stage, templateIds) => data.stages.map((s) => ({ stage: s.stage, templateIds: s.stage === stage ? templateIds : s.templateIds }));
  const flip = (s, id) => save({ enabled: data.enabled, stages: stagesWith(s.stage,
    s.templateIds.includes(id) ? s.templateIds.filter((t) => t !== id) : [...s.templateIds, id]) });
  const usable = templates.filter((t) => t.active && t.ideaVideos > 0);
  const hasTemplates = data.stages.some((s) => s.templateIds.length > 0);
  return (
    <div className="creator-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">Weekly inspiration mail: {data.enabled ? "running" : "stopped"}</h3>
        <button type="button" disabled={saving || (!data.enabled && !hasTemplates)}
                onClick={() => save({ enabled: !data.enabled, stages: data.stages.map(({ stage, templateIds }) => ({ stage, templateIds })) })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${data.enabled ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}>
          {data.enabled ? "Stop" : "Start"}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        A week after a brand's last mail, it gets new video ideas in a template ticked for its stage (several take turns), at most {data.maxFollowUps} weekly mails.
        A brand that has seen every video that fits waits until new ones are added. Checked once a day (10:00 IST); mail then joins the queue and its daily limit.
        Stop also takes back weekly mails still queued.
        A plain letter can't report an open, so someone who read one without clicking shows as not opened.
      </p>
      {!hasTemplates && <p className="text-xs text-amber-300">Tick at least one template to start. Only templates that show videos are listed.</p>}
      {error && <p className="text-xs text-red-300">{error?.data?.message || "Couldn't save"}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {data.stages.map((s) => (
          <div key={s.stage} className="rounded-lg border border-white/10 p-3 text-xs">
            <p className="font-semibold text-slate-100">{FOLLOW_UP_STAGES[s.stage]}</p>
            <p className="text-2xl font-bold text-white">{s.brands}</p>
            <p className="mb-2 text-slate-400">{s.due} due this week</p>
            {usable.map((t) => (
              <label key={t.id} className="flex items-center gap-2 py-0.5 text-slate-300">
                <input type="checkbox" disabled={saving} checked={s.templateIds.includes(t.id)} onChange={() => flip(s, t.id)} />
                {t.name}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 p-3 text-xs">
        <p className="font-semibold text-slate-100">Last mail, after {data.maxFollowUps} weekly mails with no request</p>
        <p className="mb-2 text-slate-400">Goes once, even if they opened or clicked. A brand that sent a request or gave its priorities doesn't get it.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {data.lastMails.map((s) => (
            <label key={s.stage} className="text-slate-300">
              {LAST_MAIL_STAGES[s.stage]} ({s.due} due now)
              <select value={s.templateIds[0] || ""} disabled={saving}
                      onChange={(e) => save({ enabled: data.enabled, stages: [{ stage: s.stage, templateIds: e.target.value ? [e.target.value] : [] }] })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f19] px-2 py-1.5 text-white">
                <option value="">None (no last mail)</option>
                {templates.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Out of the funnel: {data.requested} sent a request · {data.unsubscribed} unsubscribed · {data.badAddress} bad address · {data.finished} had every weekly mail
      </p>
    </div>
  );
}

/** What brands said they want in their console, for ops to find videos by. */
function BrandPriorities() {
  const { data: rows = [] } = useGetBrandPrioritiesQuery();
  return (
    <div className="creator-panel space-y-2 p-4">
      <h3 className="text-sm font-bold text-white">What brands asked to see</h3>
      {rows.length === 0 ? <p className="text-xs text-slate-500">No brand has told us yet.</p> : (
        <div className="divide-y divide-white/5 text-xs">
          {rows.map((p) => (
            <div key={p.email} className="py-2">
              <p className="font-semibold text-slate-100">{p.company || p.email} <span className="ml-1 font-normal text-slate-500">{p.email} · {day(p.updatedAt)}</span></p>
              {p.themes.length > 0 && <p className="text-slate-300">Kinds of video: {p.themes.map(themeLabel).join(", ")}</p>}
              {p.adsFrom && <p className="text-slate-300">Ads from: {p.adsFrom}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The mail as it went. Nothing in it can be clicked or run: its links are the brand's own tracked ones and
 * its unsubscribe, so following one here would count a click for the brand or unsubscribe them. */
function SentMailCopy({ html, title }) {
  const lock = '<base target="_blank"><style>a{pointer-events:none}</style>';
  const page = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (head) => head + lock) : lock + html;
  return <iframe title={title} srcDoc={page} sandbox="" loading="lazy" className="mt-2 h-[480px] w-full rounded-lg border border-white/10 bg-white" />;
}

function BrandMails({ email }) {
  const { data, isLoading } = useGetBrandMailHistoryQuery(email);
  if (isLoading || !data) return <p className="px-3 pb-3 text-xs text-slate-500">Loading…</p>;
  return (
    <div className="space-y-3 px-3 pb-3">
      {data.requests.length > 0 && (
        <p className="text-xs text-emerald-300">
          Requests: {data.requests.map((r) => `${day(r.createdAt)}${r.paidAt ? " (paid)" : ""}`).join(", ")}
        </p>
      )}
      {data.mails.map(({ mail, videos, links }) => (
        <div key={mail.deliveryId} className="rounded-lg border border-white/10 p-3 text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-100">{mail.templateName}</span>
            <span className="text-slate-400">{day(mail.sentAt)}</span>
          </div>
          <p className="text-slate-400">{mail.subject}</p>
          <p className="mt-1 text-slate-300">
            {mail.openedAt ? `Opened ${day(mail.openedAt)}` : "Not opened (or a plain letter)"}
            {" · "}{mail.firstClickedAt ? `Clicked ${day(mail.firstClickedAt)}` : "No click"}
          </p>
          {mail.videosFit === false && <p className="text-amber-300">No video about what this brand sells was available.</p>}
          {mail.html
            ? <SentMailCopy html={mail.html} title={`Mail sent: ${mail.subject}`} />
            : <p className="mt-2 text-slate-500">This mail went before copies were kept, so only its subject, videos and links are shown.</p>}
          {videos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {videos.map((v, i) => (
                <div key={i} className="w-28">
                  {v.posterUrl && <img src={v.posterUrl} alt="" className="h-16 w-28 rounded object-cover" loading="lazy" />}
                  <p className="mt-1 leading-tight text-slate-300">{v.title}</p>
                  {!v.onBoard && <p className="text-slate-500">taken off the board</p>}
                </div>
              ))}
            </div>
          )}
          {links.length > 0 && (
            <p className="mt-2 text-slate-400">
              Links: {links.map((l) => `${l.label} (${l.clicks} ${l.clicks === 1 ? "click" : "clicks"})`).join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function BrandsMailed() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const { data: brands = [], isFetching } = useListBrandMailHistoryQuery(query.trim());
  return (
    <div className="creator-panel space-y-2 p-4">
      <h3 className="text-sm font-bold text-white">What each brand was sent</h3>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a brand or address"
             className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white" />
      {brands.length === 0 ? (
        <p className="text-xs text-slate-500">{isFetching ? "Loading…" : "No brand has been mailed yet."}</p>
      ) : (
        <div className="divide-y divide-white/5">
          {brands.map((b) => (
            <div key={b.email}>
              <button type="button" onClick={() => setOpen(open === b.email ? null : b.email)}
                      className="flex w-full flex-wrap items-baseline justify-between gap-2 py-2 text-left text-xs hover:bg-white/5">
                <span>
                  <span className="font-semibold text-slate-100">{b.company || b.email}</span>
                  <span className="ml-2 text-slate-500">{b.email}</span>
                </span>
                <span className="text-slate-400">
                  {b.mails} {b.mails === 1 ? "mail" : "mails"} · {b.opened} opened · {b.clicked} clicked
                  {b.requests > 0 && <span className="text-emerald-300"> · {b.requests} {b.requests === 1 ? "request" : "requests"}</span>}
                  {" · last "}{day(b.lastSentAt)}
                </span>
              </button>
              {open === b.email && <BrandMails email={b.email} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrandMailHistory() {
  return (
    <div className="space-y-4">
      <FollowUps />
      <BrandPriorities />
      <div className="grid gap-4 lg:grid-cols-2">
        <Coverage />
        <TemplateResults />
      </div>
      <BrandsMailed />
    </div>
  );
}
