// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Search } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useAddPeopleToAudienceMutation, useCreateAudienceMutation, useGetAudiencesQuery, useLazySearchPeopleQuery } from "../../api/showcaseEndpoints.js";
import { errorMessage, INDUSTRIES } from "../showcase/showcaseLabels.js";

const control = "rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";

const COUNTRIES = [
  ["", "Any country"], ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["AE", "United Arab Emirates"],
  ["SG", "Singapore"], ["AU", "Australia"], ["CA", "Canada"], ["DE", "Germany"], ["FR", "France"], ["NL", "Netherlands"],
  ["SA", "Saudi Arabia"], ["ID", "Indonesia"], ["MY", "Malaysia"], ["JP", "Japan"], ["BR", "Brazil"],
];
const NEW_AUDIENCE = "__new__";

/** Rule 44: find brand decision makers (Apollo.io, shared by every creator) and add them to an
 * audience. Emails are revealed while this month's free lookups last; after that people are added
 * without one and you can enter it on the lead. */
export default function PeopleFinder() {
  const dispatch = useDispatch();
  const { data: audiences = [] } = useGetAudiencesQuery();
  const [search, { data, isFetching, error }] = useLazySearchPeopleQuery();
  const [add, addState] = useAddPeopleToAudienceMutation();
  const [createAudience, createState] = useCreateAudienceMutation();
  const [newName, setNewName] = useState("");
  const [form, setForm] = useState({ industry: "", country: "IN", title: "", q: "" });
  const [selected, setSelected] = useState([]);
  const [audienceId, setAudienceId] = useState("");
  const [report, setReport] = useState(null);
  const creatingNew = audienceId === NEW_AUDIENCE || audiences.length === 0;
  const target = audiences.find((a) => a.id === audienceId) || audiences[0];

  const run = (event) => {
    event.preventDefault();
    setSelected([]);
    setReport(null);
    search({ industry: form.industry || undefined, country: form.country, title: form.title.trim(), q: form.q.trim() });
  };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 25 ? s : [...s, id]));
  const addSelected = async () => {
    try {
      let id = target?.id;
      if (creatingNew) {
        if (!newName.trim()) { dispatch(showFlash({ message: "Name the new audience", type: "error" })); return; }
        id = (await createAudience(newName.trim()).unwrap()).id;
        setAudienceId(id);
        setNewName("");
      }
      setReport(await add({ audienceId: id, personIds: selected }).unwrap());
      setSelected([]);
      dispatch(showFlash({ message: "Added to your audience", type: "success" }));
    } catch (e) { dispatch(showFlash({ message: errorMessage(e, "Couldn't add those people"), type: "error" })); }
  };
  const credits = data?.credits || report?.credits;

  return (
    <section className="creator-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Find people at brands</h2>
          <p className="mt-1 text-xs text-slate-400">Marketing heads, brand managers and founders. Pick who to add to an audience.</p>
        </div>
        {credits && (
          <p className="text-right text-[11px] text-slate-500">
            {credits.configured ? `${credits.leftThisMonth} free email lookups left this month` : "Showing people already in the directory"}
          </p>
        )}
      </div>
      <form onSubmit={run} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Industry
          <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={`${control} mt-1 block`}>
            <option value="">Any industry</option>
            {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Country
          <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={`${control} mt-1 block`}>
            {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Role (optional)
          <input value={form.title} maxLength={80} onChange={(e) => setForm({ ...form, title: e.target.value })}
                 placeholder="e.g. brand manager" className={`${control} mt-1 block w-44`} />
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
          {data.people.length === 0 ? <p className="mt-4 text-sm text-slate-400">No one found. Try another industry, role or fewer keywords.</p> : (
            <ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
              {data.people.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">{p.name}</span>
                      <span className="block text-xs text-slate-500">{[p.title, p.company].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="text-xs text-slate-400">{p.emailKnown ? "Email known" : p.emailAvailable ? "Email available" : "No email"}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {data.people.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <>
                  {audiences.length > 0 && (
                    <select value={creatingNew ? NEW_AUDIENCE : target?.id || ""} onChange={(e) => setAudienceId(e.target.value)} className={control} aria-label="Audience">
                      {audiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      <option value={NEW_AUDIENCE}>+ New audience…</option>
                    </select>
                  )}
                  {creatingNew && (
                    <input value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} placeholder="New audience name"
                           aria-label="New audience name" className={control} />
                  )}
                  <button type="button" onClick={addSelected} disabled={selected.length === 0 || addState.isLoading || createState.isLoading}
                          className="creator-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                    {addState.isLoading ? "Adding…" : `Add ${selected.length || ""} to audience`}
                  </button>
                  <span className="text-[11px] text-slate-500">Up to 25 at a time</span>
              </>
            </div>
          )}
        </>
      )}
      {report && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">
          {report.added} added · {report.withEmail} with an email
          {report.needEmail > 0 ? ` · ${report.needEmail} need an email: open the audience and add it on each lead` : ""}
        </p>
      )}
    </section>
  );
}
