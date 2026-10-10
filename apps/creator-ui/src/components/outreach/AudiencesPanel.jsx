// @ts-nocheck
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCreateAudienceMutation,
  useDeleteAudienceMutation,
  useDiscardContactPointMutation,
  useGetAudienceLeadsQuery,
  useGetAudiencesQuery,
  useRemoveLeadFromAudienceMutation,
  useUploadAudienceCsvMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage, INDUSTRY_LABEL } from "../showcase/showcaseLabels.js";
import { CONTACT_STATUS } from "./outreachLabels.js";
import BrandFinder from "./BrandFinder.jsx";

/** Audiences tab (rules 21–25): upload a CSV into a named audience; rows for the same person (any
 * shared email or phone) become one lead. Contact points are checked continuously: once one is
 * validated only validated ones show, otherwise every unchecked one does. */
export default function AudiencesPanel() {
  const dispatch = useDispatch();
  const { data: audiences = [], isLoading } = useGetAudiencesQuery();
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
          Upload brands you want to reach. CSV with a header row: email (more emails in email2… or separated by ;), phone, name,
          company, industry, website. Up to 5,000 rows.
        </p>
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
                  <span className="block text-xs text-slate-400">{a.leads} leads · {a.reachable} reachable</span>
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
      <BrandFinder />
      {openId && <AudienceDetail audience={audiences.find((a) => a.id === openId)} onFail={fail} />}
    </div>
  );
}

function AudienceDetail({ audience, onFail }) {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
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
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadState.isLoading}
                  className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
            {uploadState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload CSV
          </button>
        </div>
      </div>
      {report && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">
          {report.rowsImported} of {report.rowsTotal} rows imported · {report.leadsCreated} new leads · {report.leadsMerged} rows joined
          an existing lead · {report.contactPointsAdded} new emails/phones · {report.rowsRejected} rows without an email or phone ·
          audience now has {report.audienceSize} leads
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
                    {l.name && l.company && <span className="font-normal text-slate-400"> · {l.company}</span>}
                    {l.industry && <span className="font-normal text-slate-500"> · {INDUSTRY_LABEL[l.industry]}</span>}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[...l.emails, ...l.phones].map((c) => (
                      <ContactChip key={c.id} c={c} onDiscard={() => discard({ leadId: l.id, contactPointId: c.id }).unwrap().catch((e) => onFail(e, "Couldn't remove"))} />
                    ))}
                    {l.emails.length + l.phones.length === 0 && <span className="text-xs text-rose-300">No usable email or phone</span>}
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
