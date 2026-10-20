// @ts-nocheck
import React, { useEffect, useState } from "react";
import PublicHeader, { PublicFooter } from "../showcase/PublicHeader.jsx";
import InspirationBoard from "../showcase/InspirationBoard.jsx";
import { INDUSTRIES } from "../showcase/labels.js";

/** /inspiration?industry=FOOD_BEVERAGE -- the board on its own page, the link our mailers send. */
export default function InspirationPage() {
  const [industry, setIndustry] = useState(() => new URLSearchParams(window.location.search).get("industry") || "");
  useEffect(() => {
    document.title = "Inspiration · Dalai Llama";
    const url = new URL(window.location.href);
    if (industry) url.searchParams.set("industry", industry);
    else url.searchParams.delete("industry");
    window.history.replaceState(null, "", url);
  }, [industry]);

  return (
    <div className="min-h-screen creator-app text-slate-100">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Inspiration</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Videos brands like yours are running. See one you like? Ask for one like it — we match you with a creator for your industry.
        </p>
        <label className="mt-5 flex items-center gap-2 text-sm text-slate-300">
          Industry
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/[0.04] p-2 text-sm text-white">
            <option value="">All</option>
            {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <div className="mt-6">
          <InspirationBoard industry={industry || null} first={new URLSearchParams(window.location.search).get("pin")} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
