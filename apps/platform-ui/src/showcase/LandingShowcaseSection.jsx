// @ts-nocheck
import React, { useEffect, useState } from "react";
import ShowcaseGrid from "./ShowcaseGrid.jsx";
import { getLanding } from "./showcaseApi.js";

/** "Work from our creators" on the landing page. The server returns an empty grid while too few
 * films qualify, and then this section doesn't render at all. */
export default function LandingShowcaseSection() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getLanding().then((result) => !cancelled && setCards(result || [])).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="creators-heading" className="py-6 sm:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="creators-heading" className="text-2xl font-bold text-slate-950 sm:text-3xl lg:text-4xl">Work from our creators</h2>
          <p className="mt-1 text-slate-600">Films made with Dalai Llama for real brands.</p>
        </div>
        <a href="/creators" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-800 shadow-sm hover:bg-slate-50">
          See all creators
        </a>
      </div>
      <ShowcaseGrid cards={cards} />
    </section>
  );
}
