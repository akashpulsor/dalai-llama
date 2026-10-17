// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getInspiration } from "./showcaseApi.js";
import { INDUSTRY_LABEL } from "./labels.js";
import { RequestFromDalaillamaButton } from "./BrandActions.jsx";

/**
 * Videos from Pinterest that we picked as references for an industry. They play in Pinterest's own
 * embed, which credits whoever made them: inspiration, never our creators' work. "Make one like
 * this" opens the request form with the pin as the reference.
 */
export default function InspirationBoard({ industry = null, limit = null }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getInspiration(industry).then((list) => !cancelled && setItems(list)).catch(() => !cancelled && setItems([]));
    return () => { cancelled = true; };
  }, [industry]);

  if (items === null) return <Loader2 className="h-5 w-5 animate-spin text-slate-500" />;
  if (items.length === 0) return <p className="text-sm text-slate-500">No inspiration picked for this industry yet.</p>;
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">From Pinterest, credited to their makers — references, not work by our creators.</p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <li key={item.id} className="flex flex-col rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
            <iframe
              title={item.title}
              src={`https://assets.pinterest.com/ext/embed.html?id=${item.pinId}`}
              loading="lazy"
              className="mx-auto h-[560px] w-full max-w-[345px] rounded-lg border-0"
              scrolling="no"
            />
            <p className="mt-3 font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-400">
              {INDUSTRY_LABEL[item.industry]}{item.note ? ` · ${item.note}` : ""}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <RequestFromDalaillamaButton
                label="Make one like this"
                prefill={{ industry: item.industry, campaignDirection: `Like this reference: ${item.pinUrl}` }}
                remember={false}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
              />
              <a href={item.pinUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-400 hover:text-white">
                On Pinterest
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
