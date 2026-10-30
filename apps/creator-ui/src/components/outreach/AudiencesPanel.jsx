// @ts-nocheck
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Plus, Send, Trash2, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCreateAudienceMutation,
  useDeleteAudienceMutation,
  useAddLeadContactPointMutation,
  useAddLeadToAudienceMutation,
  useDiscardContactPointMutation,
  useGetDirectoriesQuery,
  useGetAudienceLeadsQuery,
  useGetAudiencesQuery,
  useRemoveLeadFromAudienceMutation,
  useUploadAudienceCsvMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage, INDUSTRIES, INDUSTRY_LABEL } from "../showcase/showcaseLabels.js";
import { CONTACT_STATUS } from "./outreachLabels.js";
import { COMPANY_SIZES, NoEmailFlag, SizeBadge } from "./CompanySize.jsx";
import BrandFinder from "./BrandFinder.jsx";
import PeopleFinder from "./PeopleFinder.jsx";

/** Audiences tab (rules 21–25): upload a CSV into a named audience; rows for the same person (any
 * shared email or phone) become one lead. Contact points are checked continuously: once one is
 * validated only validated ones show, otherwise every unchecked one does. */
export default function AudiencesPanel({ onSendTo }) {
  const dispatch = useDispatch();
  const { data: audiences = [], isLoading } = useGetAudiencesQuery();
  const { data: directories } = useGetDirectoriesQuery();
  const [create, createState] = useCreateAudienceMutation();
  const [remove] = useDeleteAudienceMutation();
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState(null);
  const fail = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));

  const add = async (event) => {
    event.preventDefault();
    try {
      const created = await create(name.trim()).unwrap();
      setName("");
      setOpenId(created.id);
    } catch (e) { fail(e, "Couldn't create the audience"); }
  };
  const del = async (a) => {
    if (!window.confirm(`Delete the audience "${a.name}"? The leads stay in your other audiences.`)) return;
    try { await remove(a.id).unwrap(); if (openId === a.id) setOpenId(null); } catch (e) { fail(e, "Couldn't delete"); }
  };

  return (
    <div className="space-y-6">
      <section className="creator-panel p-5">
        <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Audiences</h2>
        <p className="mt-1 text-xs text-slate-400">
          Upload the brand contacts you want to reach as a CSV file (up to 5,000 rows), or find brands below.
        </p>
        <CsvFormat />
        <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
          <label htmlFor="new-audience" className="sr-only">New audience name</label>
          <input id="new-audience" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
                 placeholder="e.g. Food brands, Mumbai"
                 className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60" />
          <button type="submit" disabled={createState.isLoading} className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50">
            <Plus size={13} /> Create audience
          </button>
        </form>
        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading…</p> : (
          <ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
            {audiences.length === 0 && <li className="p-3 text-xs text-slate-400">No audiences yet.</li>}
            {audiences.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <button type="button" onClick={() => setOpenId(openId === a.id ? null : a.id)} className="text-left">
                  <span className="block font-bold text-white">{a.name}</span>
                  <span className="block text-xs text-slate-400">
                    {a.leads} leads · {a.reachable} reachable
                    {a.leads > a.reachable && <span className="text-amber-200"> · {a.leads - a.reachable} can't be emailed</span>}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpenId(openId === a.id ? null : a.id)}
                          className="creator-control px-3 py-1.5 text-xs font-bold text-slate-200">{openId === a.id ? "Close" : "Open"}</button>
                  <button type="button" onClick={() => del(a)} aria-label={`Delete ${a.name}`} className="creator-control px-2 py-1.5 text-rose-300">
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {directories?.people && <PeopleFinder />}
      {directories?.companies && <BrandFinder />}
      {directories && !directories.people && !directories.companies && (
        <p className="creator-panel p-5 text-xs text-slate-400">Brand search isn't switched on yet. Upload a CSV meanwhile.</p>
      )}
      {openId && <AudienceDetail audience={audiences.find((a) => a.id === openId)} onFail={fail} onSendTo={onSendTo} />}
    </div>
  );
}

function AudienceDetail({ audience, onFail, onSendTo }) {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [report, setReport] = useState(null);
  const { data, isFetching } = useGetAudienceLeadsQuery({ audienceId: audience?.id, q, page }, { skip: !audience });
  const [upload, uploadState] = useUploadAudienceCsvMutation();
  const [removeLead] = useRemoveLeadFromAudienceMutation();
  const [discard] = useDiscardContactPointMutation();
  if (!audience) return null;

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setReport(await upload({ audienceId: audience.id, file }).unwrap());
      dispatch(showFlash({ message: "Upload finished", type: "success" }));
    } catch (e) { onFail(e, "Couldn't read that file"); }
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <section className="creator-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">{audience.name}</h2>
        <div className="flex flex-wrap gap-2">
          {onSendTo && (
            <button type="button" onClick={() => onSendTo(audience.id)} disabled={audience.reachable === 0}
                    title={audience.reachable === 0 ? "Add a lead with an email first" : undefined}
                    className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
              <Send size={13} /> Send mail to this audience
            </button>
          )}
          <button type="button" onClick={() => setAdding(!adding)}
                  className="creator-control flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200">
            <Plus size={13} /> Add a lead
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadState.isLoading}
                  className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
            {uploadState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload CSV
          </button>
        </div>
      </div>
      {adding && <AddLeadForm audienceId={audience.id} onDone={() => setAdding(false)} onFail={onFail} />}
      {report && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">
          {report.rowsImported} of {report.rowsTotal} rows imported · {report.leadsCreated} new leads · {report.leadsMerged} rows joined
          an existing lead · {report.contactPointsAdded} new emails/phones · {report.rowsRejected} rows skipped (no email, phone, name or
          company) · audience now has {report.audienceSize} leads
          {report.leadsWithoutEmail > 0 && (
            <span className="mt-2 block text-amber-200">
              {report.leadsWithoutEmail} lead{report.leadsWithoutEmail === 1 ? " has" : "s have"} no email: they're kept and marked
              "Email not available". Add an email on each to send to them.
            </span>
          )}
        </p>
      )}
      <label htmlFor="lead-search" className="sr-only">Search leads</label>
      <input id="lead-search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search name, company or email"
             className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60" />
      {isFetching && !data && <p className="mt-3 text-sm text-slate-400">Loading…</p>}
      {data && (
        <>
          <ul className="mt-3 divide-y divide-white/10">
            {data.leads.length === 0 && <li className="py-3 text-xs text-slate-400">No leads here yet. Upload a CSV.</li>}
            {data.leads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">
                    {l.name || l.company || "Unnamed"}
                    {l.name && l.designation && <span className="font-normal text-slate-400"> · {l.designation}</span>}
                    {l.name && l.company && <span className="font-normal text-slate-400"> · {l.company}</span>}
                    {l.industry && <span className="font-normal text-slate-500"> · {INDUSTRY_LABEL[l.industry]}</span>}
                    {l.size && <span className="ml-2 align-middle"><SizeBadge size={l.size} /></span>}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[...l.emails, ...l.phones].map((c) => (
                      <ContactChip key={c.id} c={c} onDiscard={() => discard({ leadId: l.id, contactPointId: c.id }).unwrap().catch((e) => onFail(e, "Couldn't remove"))} />
                    ))}
                    {l.emails.length === 0 && <NoEmailFlag />}
                    {l.emails.length === 0 && <AddContact leadId={l.id} onFail={onFail} />}
                    {l.discarded > 0 && <span className="text-[11px] text-slate-500">{l.discarded} discarded</span>}
                  </div>
                </div>
                <button type="button" onClick={() => removeLead({ audienceId: audience.id, leadId: l.id }).unwrap().catch((e) => onFail(e, "Couldn't remove"))}
                        className="text-xs font-bold text-slate-400 hover:text-rose-300">Remove from audience</button>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-400">
              <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="creator-control px-2 py-1 disabled:opacity-40">Previous</button>
              <span>Page {page + 1} of {pages}</span>
              <button type="button" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="creator-control px-2 py-1 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ContactChip({ c, onDiscard }) {
  const [text, tone] = c.unsubscribed ? ["Unsubscribed", "bg-rose-500/15 text-rose-300"] : CONTACT_STATUS[c.status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 py-0.5 pl-2.5 pr-1 text-xs text-slate-200">
      {c.value}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>{text}</span>
      <button type="button" onClick={onDiscard} aria-label={`Remove ${c.value}`} title="Wrong for this lead"
              className="rounded-full p-0.5 text-slate-500 hover:bg-white/10 hover:text-rose-300">
        <X size={11} />
      </button>
    </span>
  );
}

const SAMPLE_CSV = [
  "name,designation,company,email,email2,phone,industry,website,size",
  "Asha Rao,Marketing Head,Hearth Foods,asha@hearthfoods.in,marketing@hearthfoods.in,+91 98765 43210,FOOD_BEVERAGE,https://hearthfoods.in,Small",
  "Vikram Shah,Brand Manager,Bolt Motors,vikram@boltmotors.in,,+91 91234 56789,AUTOMOTIVE,https://boltmotors.in,Medium",
].join("\r\n");

/** The CSV columns, with a sample to download. Rows for the same person (any shared email or
 * phone) become one lead. */
function CsvFormat() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV + "\r\n"], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dalai-llama-audience-sample.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const cols = [
    ["name", "Contact's full name (or first name + last name columns)"],
    ["designation", "Their role, e.g. Marketing Head (also: title, position, role)"],
    ["company", "Brand or company name"],
    ["email", "Work email. More in email2, email3… or several separated by ;"],
    ["phone", "With country code, e.g. +91 98765 43210"],
    ["industry", "Optional: FASHION, BEAUTY, FOOD_BEVERAGE, TECH, FINANCE, …"],
    ["website", "Optional, starting with https://"],
    ["size", "Optional: Small, Medium, Large or Enterprise (or a headcount like 11-50)"],
  ];
  return (
    <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
      <summary className="cursor-pointer font-bold text-slate-200">CSV format</summary>
      <p className="mt-2 text-slate-400">First row must be the column names. A row without an email is still kept (marked "Email not available") if it has a name or company; add the email later.</p>
      <table className="mt-2 w-full text-left">
        <tbody>
          {cols.map(([c, d]) => (
            <tr key={c} className="border-t border-white/5"><td className="py-1 pr-3 font-mono text-purple-200">{c}</td><td className="py-1 text-slate-400">{d}</td></tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={download} className="creator-control mt-3 px-3 py-1.5 text-xs font-bold text-slate-200">Download sample CSV</button>
    </details>
  );
}

/** No email yet (Apollo's free lookups ran out, or none was found): the creator adds one they found. */
const EMPTY_LEAD = { name: "", designation: "", company: "", email: "", phone: "", industry: "", website: "", size: "" };

/** One lead typed in: the CSV's columns as fields. Only a company, name or email is needed; with no
 * email the lead is kept and marked "Email not available". */
function AddLeadForm({ audienceId, onDone, onFail }) {
  const dispatch = useDispatch();
  const [lead, setLead] = useState(EMPTY_LEAD);
  const [add, state] = useAddLeadToAudienceMutation();
  const set = (field) => (e) => setLead({ ...lead, [field]: e.target.value });
  const input = "mt-1 w-full rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-sm text-white";
  const ready = lead.company.trim() || lead.name.trim() || lead.email.trim();

  const save = async (event) => {
    event.preventDefault();
    try {
      const result = await add({ audienceId, ...lead, industry: lead.industry || null, size: lead.size || null }).unwrap();
      dispatch(showFlash({ message: result.merged ? "Added to a lead you already had" : "Lead added", type: "success" }));
      setLead(EMPTY_LEAD);
    } catch (e) { onFail(e, "Couldn't add that lead"); }
  };
  return (
    <form onSubmit={save} className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
      <label className="text-[11px] font-bold text-slate-400">Company<input value={lead.company} onChange={set("company")} maxLength={160} className={input} placeholder="Hearth Foods" /></label>
      <label className="text-[11px] font-bold text-slate-400">Email<input value={lead.email} onChange={set("email")} maxLength={254} className={input} placeholder="asha@hearthfoods.in (leave empty if you don't have it)" /></label>
      <label className="text-[11px] font-bold text-slate-400">Name<input value={lead.name} onChange={set("name")} maxLength={120} className={input} placeholder="Asha Rao" /></label>
      <label className="text-[11px] font-bold text-slate-400">Designation<input value={lead.designation} onChange={set("designation")} maxLength={120} className={input} placeholder="Founder" /></label>
      <label className="text-[11px] font-bold text-slate-400">Phone<input value={lead.phone} onChange={set("phone")} maxLength={40} className={input} placeholder="+91 98765 43210" /></label>
      <label className="text-[11px] font-bold text-slate-400">Website<input value={lead.website} onChange={set("website")} maxLength={255} className={input} placeholder="hearthfoods.in" /></label>
      <label className="text-[11px] font-bold text-slate-400">Industry
        <select value={lead.industry} onChange={set("industry")} className={input}>
          <option value="">—</option>
          {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label className="text-[11px] font-bold text-slate-400">Size
        <select value={lead.size} onChange={set("size")} className={input}>
          <option value="">—</option>
          {COMPANY_SIZES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={!ready || state.isLoading} className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {state.isLoading ? "Adding…" : "Add lead"}
        </button>
        <button type="button" onClick={onDone} className="text-xs font-bold text-slate-400 hover:text-white">Done</button>
        <span className="text-[11px] text-slate-500">Company, name or email is enough. No email? It's kept and marked so you can add it later.</span>
      </div>
    </form>
  );
}

function AddContact({ leadId, onFail }) {
  const [value, setValue] = useState("");
  const [add, state] = useAddLeadContactPointMutation();
  const save = async (event) => {
    event.preventDefault();
    try { await add({ leadId, value: value.trim() }).unwrap(); setValue(""); } catch (e) { onFail(e, "Couldn't add that"); }
  };
  return (
    <form onSubmit={save} className="flex items-center gap-1.5">
      <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={254} placeholder="Add email or phone"
             aria-label="Add email or phone" className="w-48 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-white" />
      <button type="submit" disabled={!value.trim() || state.isLoading} className="creator-control px-2 py-1 text-xs font-bold text-slate-200 disabled:opacity-40">Add</button>
    </form>
  );
}
