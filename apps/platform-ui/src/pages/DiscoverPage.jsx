// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ShowcaseGrid from "../showcase/ShowcaseGrid.jsx";
import PublicHeader from "../showcase/PublicHeader.jsx";
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f6f8fc_100%)]">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-900 sm:text-4xl">Work from our creators</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Films made by independent creators. Watch anything; ask a creator for one of your own.</p>

        <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Sort">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === id ? "bg-indigo-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
          <label htmlFor="format" className="sr-only">Format</label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value)}
                  className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <option value="">All formats</option>
            {FORMATS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Industry">
          <button type="button" onClick={() => setIndustry("")} aria-pressed={!industry}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${!industry ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-600"}`}>
            All industries
          </button>
          {INDUSTRIES.map(([code, label]) => (
            <button key={code} type="button" onClick={() => setIndustry(code)} aria-pressed={industry === code}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${industry === code ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading && <p className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading films…</p>}
          {error && <p className="text-rose-600">Films couldn't load. Try again in a moment.</p>}
          {!loading && !error && cards.length === 0 && <p className="text-slate-500">No films here yet. Try another industry.</p>}
          {!loading && cards.length > 0 && <ShowcaseGrid cards={cards} />}
          {hasMore && !loading && (
            <button type="button" onClick={loadMore} className="mx-auto mt-6 block rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-indigo-800 shadow-sm hover:bg-slate-50">
              Show more
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
