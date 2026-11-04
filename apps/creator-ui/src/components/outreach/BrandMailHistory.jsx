import React, { useState } from "react";
import {
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Coverage />
        <TemplateResults />
      </div>
      <BrandsMailed />
    </div>
  );
}
