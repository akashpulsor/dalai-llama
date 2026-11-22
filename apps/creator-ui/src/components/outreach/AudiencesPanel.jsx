// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Building2, FileUp, Loader2, MailSearch, Plus, Send, Trash2, UserPlus, Users, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useAddLeadContactPointMutation,
  useAddLeadToAudienceMutation,
  useCreateAudienceMutation,
  useDeleteAudienceMutation,
  useDiscardContactPointMutation,
  useFindAudienceEmailsMutation,
  useGetAudienceLeadsQuery,
  useGetAudiencesQuery,
  useGetDirectoriesQuery,
  useRemoveLeadFromAudienceMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage, INDUSTRIES, INDUSTRY_LABEL } from "../showcase/showcaseLabels.js";
import { CONTACT_STATUS } from "./outreachLabels.js";
import { COMPANY_SIZES, NoEmailFlag, SizeBadge } from "./CompanySize.jsx";
import BrandFinder from "./BrandFinder.jsx";
import CsvImport from "./CsvImport.jsx";
import PeopleFinder from "./PeopleFinder.jsx";

const ADD_WAYS = [
  ["csv", "Upload CSV", FileUp],
  ["people", "Find people", Users],
  ["brands", "Find brands", Building2],
  ["manual", "Add one", UserPlus],
];

/** Contacts (rules 21–25, 42, 44): lists of brand contacts on the left, the open list on the right.
 * One "Add contacts" control holds every way in: upload a CSV (checked and previewed first), find
 * people or brands, or type one. Contacts without an email can be filled in automatically from
 * their website ("Find missing emails") or by hand. */
export default function AudiencesPanel({ onSendTo }) {
  const dispatch = useDispatch();
  const { data: audiences = [], isLoading } = useGetAudiencesQuery();
  const [openId, setOpenId] = useState(null);
  const fail = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));
  const open = audiences.find((a) => a.id === openId) || audiences[0];

  if (isLoading) return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>;
  if (audiences.length === 0) return <FirstContacts onCreated={setOpenId} onFail={fail} />;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Lists audiences={audiences} openId={open?.id} onOpen={setOpenId} onFail={fail} />
      {open && <ListDetail key={open.id} audience={open} onFail={fail} onSendTo={onSendTo} onDeleted={() => setOpenId(null)} />}
    </div>
  );
}

/** No lists yet: the three ways to start, the CSV one open. */
function FirstContacts({ onCreated, onFail }) {
  const dispatch = useDispatch();
  const [way, setWay] = useState("csv");
  const { data: directories } = useGetDirectoriesQuery();
  const [create, createState] = useCreateAudienceMutation();
  const startManual = async () => {
    try { onCreated((await create("My contacts").unwrap()).id); } catch (e) { onFail(e, "Couldn't create the list"); }
  };
  return (
    <section className="creator-panel p-5">
      <h2 className="text-lg font-bold text-white">Add the brands you want to reach</h2>
      <p className="mt-1 text-sm text-slate-400">Bring your own list, or find brand contacts here. You can add more anytime.</p>
      <WayPicker way={way} onPick={(w) => (w === "manual" ? startManual() : setWay(w))} directories={directories} busy={createState.isLoading} />
      <div className="mt-5">
        {way === "csv" && <CsvImport audienceId={null} onImported={(id, r) => {
          dispatch(showFlash({ message: `${r.rowsImported} contacts imported${r.leadsWithoutEmail ? `, ${r.leadsWithoutEmail} without email` : ""}`, type: "success" }));
          onCreated(id);
        }} />}
        {way === "people" && <PeopleFinder />}
        {way === "brands" && <BrandFinder />}
      </div>
    </section>
  );
}

function WayPicker({ way, onPick, directories, busy }) {
  const ways = ADD_WAYS.filter(([id]) => (id === "people" ? directories?.people : id === "brands" ? directories?.companies : true));
  return (
    <div role="tablist" aria-label="Ways to add contacts" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ways.map(([id, text, Icon]) => (
        <button key={id} type="button" role="tab" aria-selected={way === id} onClick={() => onPick(id)} disabled={busy}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${way === id ? "border-purple-400 bg-purple-500/15 text-white" : "border-white/10 text-slate-300 hover:border-white/25"}`}>
          <Icon size={15} /> {text}
        </button>
      ))}
    </div>
  );
}

function Lists({ audiences, openId, onOpen, onFail }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [create, createState] = useCreateAudienceMutation();
  const add = async (event) => {
    event.preventDefault();
    try {
      const created = await create(name.trim()).unwrap();
      setName("");
      setCreating(false);
      onOpen(created.id);
    } catch (e) { onFail(e, "Couldn't create the list"); }
  };
  return (
    <aside className="creator-panel p-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-normal text-slate-400">Your lists</h2>
        <button type="button" onClick={() => setCreating(!creating)} className="flex items-center gap-1 text-xs font-bold text-purple-200 hover:text-white">
          <Plus size={13} /> New list
        </button>
      </div>
      {creating && (
        <form onSubmit={add} className="mt-2 flex gap-1.5">
          <label htmlFor="new-list" className="sr-only">New list name</label>
          <input id="new-list" autoFocus required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Food brands, Mumbai"
                 className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-sm text-white" />
          <button type="submit" disabled={createState.isLoading} className="creator-primary px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Create</button>
        </form>
      )}
      <ul className="mt-2 space-y-1">
        {audiences.map((a) => {
          const missing = a.leads - a.reachable;
          return (
            <li key={a.id}>
              <button type="button" onClick={() => onOpen(a.id)} aria-current={a.id === openId}
                      className={`w-full rounded-lg px-3 py-2 text-left ${a.id === openId ? "bg-purple-500/15 ring-1 ring-purple-400/50" : "hover:bg-white/5"}`}>
                <span className="block truncate text-sm font-bold text-white">{a.name}</span>
                <span className="block text-[11px] text-slate-400">
                  {a.leads} contacts{missing > 0 && <span className="text-amber-200"> · {missing} need email</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function ListDetail({ audience, onFail, onSendTo, onDeleted }) {
  const dispatch = useDispatch();
  const { data: directories } = useGetDirectoriesQuery();
  const [adding, setAdding] = useState(audience.leads === 0 ? "csv" : null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [found, setFound] = useState(null);
  const { data, isFetching } = useGetAudienceLeadsQuery({ audienceId: audience.id, q, page });
  const [findEmails, findState] = useFindAudienceEmailsMutation();
  const [remove] = useDeleteAudienceMutation();
  const [removeLead] = useRemoveLeadFromAudienceMutation();
  const [discard] = useDiscardContactPointMutation();
  const missing = audience.leads - audience.reachable;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  useEffect(() => { if (audience.leads === 0) setAdding((a) => a || "csv"); }, [audience.leads]);

  const runFind = async () => {
    try { setFound(await findEmails(audience.id).unwrap()); } catch (e) { onFail(e, "Couldn't look up emails"); }
  };
  const del = async () => {
    if (!window.confirm(`Delete the list "${audience.name}"? Its contacts stay in your other lists.`)) return;
    try { await remove(audience.id).unwrap(); onDeleted(); } catch (e) { onFail(e, "Couldn't delete"); }
  };

  return (
    <section className="creator-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-white">{audience.name}</h2>
          <p className="text-xs text-slate-400">
            {audience.leads} contacts · <span className="text-emerald-200">{audience.reachable} can be emailed</span>
            {missing > 0 && <span className="text-amber-200"> · {missing} missing email</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onSendTo && (
            <button type="button" onClick={() => onSendTo(audience.id)} disabled={audience.reachable === 0}
                    title={audience.reachable === 0 ? "Add a contact with an email first" : undefined}
                    className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
              <Send size={13} /> Send mail to this list
            </button>
          )}
          <button type="button" onClick={del} aria-label={`Delete ${audience.name}`} title="Delete list" className="creator-control px-2.5 py-2 text-rose-300">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-400">Add contacts</p>
          {adding && <button type="button" onClick={() => setAdding(null)} aria-label="Close" className="text-slate-500 hover:text-white"><X size={15} /></button>}
        </div>
        <WayPicker way={adding} onPick={(w) => setAdding(adding === w ? null : w)} directories={directories} />
        {adding && (
          <div className="mt-4">
            {adding === "csv" && <CsvImport audienceId={audience.id} onFindEmails={runFind} />}
            {adding === "people" && <PeopleFinder audienceId={audience.id} />}
            {adding === "brands" && <BrandFinder audienceId={audience.id} />}
            {adding === "manual" && <AddLeadForm audienceId={audience.id} onDone={() => setAdding(null)} onFail={onFail} />}
          </div>
        )}
      </div>

      {(missing > 0 || found) && (
        <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-50">
              {missing > 0 ? <><span className="font-bold">{missing} {missing === 1 ? "contact has" : "contacts have"} no email.</span> We can look for one at each contact's website, or you can add it below.</>
                : "Every contact in this list has an email."}
            </p>
            {missing > 0 && (
              <button type="button" onClick={runFind} disabled={findState.isLoading}
                      className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                {findState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <MailSearch size={13} />} Find missing emails
              </button>
            )}
          </div>
          {found && <p className="mt-2 text-xs text-slate-200" role="status">{findSummary(found)}</p>}
        </div>
      )}

      <label htmlFor="lead-search" className="sr-only">Search contacts</label>
      <input id="lead-search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search name, company or email"
             className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60" />
      {isFetching && !data && <p className="mt-3 text-sm text-slate-400">Loading…</p>}
      {data && (
        <>
          <ul className="mt-3 divide-y divide-white/10">
            {data.leads.length === 0 && <li className="py-3 text-xs text-slate-400">{q ? "No contacts match." : "No contacts yet. Add some above."}</li>}
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
                  {l.website && <p className="truncate text-[11px] text-slate-500">{l.website}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {[...l.emails, ...l.phones].map((c) => (
                      <ContactChip key={c.id} c={c} onDiscard={() => discard({ leadId: l.id, contactPointId: c.id }).unwrap().catch((e) => onFail(e, "Couldn't remove"))} />
                    ))}
                    {l.emails.length === 0 && <NoEmailFlag />}
                    {l.emails.length === 0 && <AddContact leadId={l.id} onFail={onFail} onAdded={() => dispatch(showFlash({ message: "Email added", type: "success" }))} />}
                    {l.discarded > 0 && <span className="text-[11px] text-slate-500">{l.discarded} invalid removed</span>}
                  </div>
                </div>
                <button type="button" onClick={() => removeLead({ audienceId: audience.id, leadId: l.id }).unwrap().catch((e) => onFail(e, "Couldn't remove"))}
                        className="text-xs font-bold text-slate-500 hover:text-rose-300">Remove</button>
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

/** What "Find missing emails" did, in one sentence per outcome. */
export function findSummary(r) {
  if (r.checked === 0) return "Every contact already has an email.";
  const parts = [];
  parts.push(r.found > 0 ? `Found emails for ${r.found} ${r.found === 1 ? "contact" : "contacts"}.` : "No new emails found.");
  if (r.noWebsite > 0) parts.push(`${r.noWebsite} ${r.noWebsite === 1 ? "has" : "have"} no website to search by: add the email by hand, or re-upload with a website column.`);
  if (r.notFound > 0) parts.push(`${r.notFound}: nobody found at their website.`);
  if (r.outOfCredits > 0) parts.push(`${r.outOfCredits} weren't searched: this month's free lookups are used up.`);
  if (!r.configured && r.found === 0 && r.noWebsite < r.checked) parts.push("Automatic email search isn't switched on yet, so only emails we already know are added.");
  if (r.checked >= 25) parts.push("Run it again for the next 25.");
  return parts.join(" ");
}

function ContactChip({ c, onDiscard }) {
  const [text, tone] = c.unsubscribed ? ["Unsubscribed", "bg-rose-500/15 text-rose-300"] : CONTACT_STATUS[c.status] || ["", ""];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 py-0.5 pl-2.5 pr-1 text-xs text-slate-200">
      {c.value}
      {text && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>{text}</span>}
      <button type="button" onClick={onDiscard} aria-label={`Remove ${c.value}`} title="Wrong for this contact"
              className="rounded-full p-0.5 text-slate-500 hover:bg-white/10 hover:text-rose-300">
        <X size={11} />
      </button>
    </span>
  );
}

const EMPTY_LEAD = { name: "", designation: "", company: "", email: "", phone: "", industry: "", website: "", size: "" };

/** One contact typed in: the CSV's columns as fields. A company, name or email is enough. */
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
      dispatch(showFlash({ message: result.merged ? "Added to a contact you already had" : "Contact added", type: "success" }));
      setLead(EMPTY_LEAD);
    } catch (e) { onFail(e, "Couldn't add that contact"); }
  };
  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <label className="text-[11px] font-bold text-slate-400">Company<input value={lead.company} onChange={set("company")} maxLength={160} className={input} placeholder="Hearth Foods" /></label>
      <label className="text-[11px] font-bold text-slate-400">Email<input value={lead.email} onChange={set("email")} maxLength={254} className={input} placeholder="asha@hearthfoods.in (optional)" /></label>
      <label className="text-[11px] font-bold text-slate-400">Name<input value={lead.name} onChange={set("name")} maxLength={120} className={input} placeholder="Asha Rao" /></label>
      <label className="text-[11px] font-bold text-slate-400">Website<input value={lead.website} onChange={set("website")} maxLength={255} className={input} placeholder="hearthfoods.in (helps find the email)" /></label>
      <label className="text-[11px] font-bold text-slate-400">Designation<input value={lead.designation} onChange={set("designation")} maxLength={120} className={input} placeholder="Founder" /></label>
      <label className="text-[11px] font-bold text-slate-400">Phone<input value={lead.phone} onChange={set("phone")} maxLength={40} className={input} placeholder="+91 98765 43210" /></label>
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
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={!ready || state.isLoading} className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {state.isLoading ? "Adding…" : "Add contact"}
        </button>
        <button type="button" onClick={onDone} className="text-xs font-bold text-slate-400 hover:text-white">Done</button>
        <span className="text-[11px] text-slate-500">A company, name or email is enough.</span>
      </div>
    </form>
  );
}

function AddContact({ leadId, onFail, onAdded }) {
  const [value, setValue] = useState("");
  const [add, state] = useAddLeadContactPointMutation();
  const save = async (event) => {
    event.preventDefault();
    try { await add({ leadId, value: value.trim() }).unwrap(); setValue(""); onAdded?.(); } catch (e) { onFail(e, "Couldn't add that"); }
  };
  return (
    <form onSubmit={save} className="flex items-center gap-1.5">
      <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={254} placeholder="Add email"
             aria-label="Add email or phone" className="w-44 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-white" />
      <button type="submit" disabled={!value.trim() || state.isLoading} className="creator-control px-2 py-1 text-xs font-bold text-slate-200 disabled:opacity-40">Add</button>
    </form>
  );
}
