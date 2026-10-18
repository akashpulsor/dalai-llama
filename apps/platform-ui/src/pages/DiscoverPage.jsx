// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ShowcaseGrid from "../showcase/ShowcaseGrid.jsx";
import InspirationBoard from "../showcase/InspirationBoard.jsx";
import { RequestFromDalaillamaButton } from "../showcase/BrandActions.jsx";
import PublicHeader, { PublicFooter } from "../showcase/PublicHeader.jsx";
import { getFeed } from "../showcase/showcaseApi.js";
import { FORMATS, INDUSTRIES } from "../showcase/labels.js";

const TABS = [
  ["TOP", "Top"],
  ["NEW", "New"],
  ["ALL", "All"],
];

/** /creators: films from every creator, filterable by the brand's industry. No login. */
export default function DiscoverPage() {
  const params = new URLSearchParams(window.location.search);
  const [tab, setTab] = useState(params.get("tab") || "TOP");
  const [industry, setIndustry] = useState(params.get("industry") || "");
  const [format, setFormat] = useState("");
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Only filters that have films: an industry chip over an empty page reads as a dead site.
  const [present, setPresent] = useState({ industries: new Set(), formats: new Set() });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const industries = new Set();
      const formats = new Set();
      for (let p = 0; p < 5; p++) {
        const result = await getFeed({ tab: "ALL", industry: "", format: "", page: p }).catch(() => null);
        (result?.items || []).forEach((c) => { if (c.industry) industries.add(c.industry); if (c.format) formats.add(c.format); });
        if (!result?.hasMore) break;
      }
      if (!cancelled) setPresent({ industries, formats });
    })();
    return () => { cancelled = true; };
  }, []);
  const industryChips = INDUSTRIES.filter(([code]) => present.industries.has(code) || code === industry);
  const formatOptions = FORMATS.filter(([code]) => present.formats.has(code) || code === format);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getFeed({ tab, industry, format, page: 0 })
      .then((result) => {
        if (cancelled) return;
        setCards(result?.items || []);
        setHasMore(Boolean(result?.hasMore));
        setPage(0);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [tab, industry, format]);

  const loadMore = async () => {
    const next = page + 1;
    const result = await getFeed({ tab, industry, format, page: next });
    setCards((prev) => [...prev, ...(result?.items || [])]);
    setHasMore(Boolean(result?.hasMore));
    setPage(next);
  };

  return (
    <div className="min-h-screen creator-app text-slate-100">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Work from our creators</h1>
        <p className="mt-2 max-w-2xl text-slate-400">Films made by independent creators. Watch anything; ask a creator for one of your own.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <RequestFromDalaillamaButton />
          <span className="text-sm text-slate-500">Not sure who to ask? We'll match you with a creator for your industry.</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Sort">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === id ? "bg-purple-600 text-white" : "bg-white/[0.04] ring-1 ring-white/10 text-slate-300 hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
          <label htmlFor="format" className="sr-only">Format</label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value)}
                  className="ml-auto rounded-lg border border-white/15 bg-white/[0.04] ring-1 ring-white/10 px-3 py-2 text-sm text-slate-300">
            <option value="">All formats</option>
            {formatOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </div>

        {industryChips.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Industry">
          <button type="button" onClick={() => setIndustry("")} aria-pressed={!industry}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${!industry ? "border-purple-500 bg-purple-500/10 text-purple-200" : "border-white/15 bg-white/[0.04] ring-1 ring-white/10 text-slate-400"}`}>
            All industries
          </button>
          {industryChips.map(([code, label]) => (
            <button key={code} type="button" onClick={() => setIndustry(code)} aria-pressed={industry === code}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${industry === code ? "border-purple-500 bg-purple-500/10 text-purple-200" : "border-white/15 bg-white/[0.04] ring-1 ring-white/10 text-slate-400"}`}>
              {label}
            </button>
          ))}
        </div>
        )}

        <div className="mt-8">
          {loading && <p className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading films…</p>}
          {error && <p className="text-rose-300">Films couldn't load. Try again in a moment.</p>}
          {!loading && !error && cards.length === 0 && <p className="text-slate-500">No films here yet. New work from our creators shows up here as they publish.</p>}
          {!loading && cards.length > 0 && <ShowcaseGrid cards={cards} />}
          {hasMore && !loading && (
            <button type="button" onClick={loadMore} className="mx-auto mt-6 block rounded-lg bg-white/[0.04] ring-1 ring-white/10 px-5 py-2.5 text-sm font-bold text-purple-200 shadow-sm hover:bg-white/5">
              Show more
            </button>
          )}
        </div>

        <section className="mt-14" aria-labelledby="inspiration-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="inspiration-title" className="text-2xl font-bold tracking-tight text-white">Inspiration</h2>
              <p className="mt-1 max-w-2xl text-slate-400">Videos brands like yours are running. See one you like? We'll make you one like it.</p>
            </div>
            <a href={industry ? `/inspiration?industry=${industry}` : "/inspiration"} className="text-sm font-semibold text-purple-300 hover:underline">
              See all
            </a>
          </div>
          <div className="mt-5">
            <InspirationBoard industry={industry || null} limit={12} />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
