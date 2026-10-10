// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Search } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useAddCompaniesToAudienceMutation, useGetAudiencesQuery, useLazySearchBrandsQuery } from "../../api/showcaseEndpoints.js";
import { errorMessage, INDUSTRIES } from "../showcase/showcaseLabels.js";

const control = "rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";

/** Rule 42: find brands in a shared directory (filled from Hunter.io and reused by every creator),
 * then add them to one of your audiences. Their emails are looked up once and kept. */
export default function BrandFinder() {
  const dispatch = useDispatch();
  const { data: audiences = [] } = useGetAudiencesQuery();
  const [search, { data, isFetching, error }] = useLazySearchBrandsQuery();
  const [add, addState] = useAddCompaniesToAudienceMutation();
  const [form, setForm] = useState({ industry: "FOOD_BEVERAGE", country: "IN", q: "" });
  const [selected, setSelected] = useState([]);
  const [audienceId, setAudienceId] = useState("");
  const [report, setReport] = useState(null);
  const target = audiences.find((a) => a.id === audienceId) || audiences[0];

  const run = (event) => {
    event.preventDefault();
    setSelected([]);
    setReport(null);
    search({ industry: form.industry, country: form.country.trim().slice(0, 2), q: form.q.trim() });
  };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 25 ? s : [...s, id]));
  const addSelected = async () => {
    try {
      setReport(await add({ audienceId: target.id, companyIds: selected }).unwrap());
      setSelected([]);
      dispatch(showFlash({ message: "Added to your audience", type: "success" }));
    } catch (e) { dispatch(showFlash({ message: errorMessage(e, "Couldn't add those brands"), type: "error" })); }
  };
  const credits = data?.credits || report?.credits;

  return (
    <section className="creator-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Find brands</h2>
          <p className="mt-1 text-xs text-slate-400">Search companies by industry and country, then add them to an audience.</p>
        </div>
        {credits && (
          <p className="text-right text-[11px] text-slate-500">
            {credits.configured ? `${credits.leftThisMonth} email lookups left this month (shared)` : "Showing brands already in the directory"}
          </p>
        )}
      </div>
      <form onSubmit={run} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Industry
          <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={`${control} mt-1 block`}>
            {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Country
          <input value={form.country} maxLength={2} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                 placeholder="IN" className={`${control} mt-1 block w-20`} />
        </label>
        <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-normal text-slate-500">Keywords (optional)
          <input value={form.q} maxLength={120} onChange={(e) => setForm({ ...form, q: e.target.value })}
                 placeholder="e.g. tea, organic snacks" className={`${control} mt-1 block w-full`} />
        </label>
        <button type="submit" disabled={isFetching} className="creator-primary flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-300">{errorMessage(error, "Search failed")}</p>}
      {data && (
        <>
          {data.companies.length === 0 ? <p className="mt-4 text-sm text-slate-400">No brands found. Try another industry or fewer keywords.</p> : (
            <ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
              {data.companies.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">{c.name || c.domain}</span>
                      <span className="block text-xs text-slate-500">{c.domain}{c.countryCode ? ` · ${c.countryCode}` : ""}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {c.contactsKnown > 0 ? `${c.contactsKnown} contacts known` : c.emailsAvailable ? `${c.emailsAvailable} emails available` : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {data.companies.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {audiences.length === 0 ? <p className="text-xs text-slate-400">Create an audience first.</p> : (
                <>
                  <select value={target?.id || ""} onChange={(e) => setAudienceId(e.target.value)} className={control} aria-label="Audience">
                    {audiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button type="button" onClick={addSelected} disabled={selected.length === 0 || addState.isLoading}
                          className="creator-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                    {addState.isLoading ? "Adding…" : `Add ${selected.length || ""} to audience`}
                  </button>
                  <span className="text-[11px] text-slate-500">Up to 25 at a time</span>
                </>
              )}
            </div>
          )}
        </>
      )}
      {report && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">
          {report.companiesAdded} brands added · {report.contactsAdded} new contacts
          {report.companiesWithoutContacts > 0 ? ` · ${report.companiesWithoutContacts} had no emails` : ""}
          {report.skippedNoCredits > 0 ? ` · ${report.skippedNoCredits} skipped (this month's email lookups are used up)` : ""}
        </p>
      )}
    </section>
  );
}
