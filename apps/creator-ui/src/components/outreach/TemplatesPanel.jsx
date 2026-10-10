// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Pencil, Plus, Send, Trash2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCreateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useGetEmailTemplatesQuery,
  useUpdateEmailTemplateMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage } from "../showcase/showcaseLabels.js";
import { LAYOUTS, LAYOUT_LABEL, PLACEHOLDERS } from "./outreachLabels.js";

const EMPTY = { name: "", layout: "SHOWCASE_WORK", subject: "", intro: "" };
const input = "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60";
const label = "mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500";

/** Templates tab (rule 27): Dalai Llama's templates (read-only, use as they are) and your own. */
export default function TemplatesPanel({ onUse }) {
  const dispatch = useDispatch();
  const { data: templates = [], isLoading } = useGetEmailTemplatesQuery();
  const [create, createState] = useCreateEmailTemplateMutation();
  const [update, updateState] = useUpdateEmailTemplateMutation();
  const [remove] = useDeleteEmailTemplateMutation();
  const [editing, setEditing] = useState(null); // null | "new" | template id
  const [form, setForm] = useState(EMPTY);

  const fail = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));
  const startNew = (from) => {
    setEditing("new");
    setForm(from ? { name: `${from.name} (my copy)`, layout: from.layout, subject: from.subject, intro: from.intro } : EMPTY);
  };
  const startEdit = (t) => { setEditing(t.id); setForm({ name: t.name, layout: t.layout, subject: t.subject, intro: t.intro }); };
  const save = async (event) => {
    event.preventDefault();
    try {
      if (editing === "new") await create(form).unwrap();
      else await update({ id: editing, ...form }).unwrap();
      dispatch(showFlash({ message: "Template saved", type: "success" }));
      setEditing(null);
    } catch (e) { fail(e, "Couldn't save the template"); }
  };
  const del = async (t) => {
    if (!window.confirm(`Delete "${t.name}"? Mail already sent keeps its numbers.`)) return;
    try { await remove(t.id).unwrap(); } catch (e) { fail(e, "Couldn't delete"); }
  };

  const globals = templates.filter((t) => t.global);
  const mine = templates.filter((t) => !t.global);

  return (
    <div className="space-y-6">
      <section className="creator-panel p-5">
        <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Dalai Llama templates</h2>
        <p className="mt-1 text-xs text-slate-400">Ready to send as they are. Copy one to make it your own.</p>
        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading…</p> : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {globals.map((t) => <TemplateCard key={t.id} t={t} onUse={onUse} onCopy={() => startNew(t)} />)}
          </ul>
        )}
      </section>

      <section className="creator-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">My templates</h2>
          <button type="button" onClick={() => startNew(null)} className="creator-control flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-200">
            <Plus size={13} /> New template
          </button>
        </div>
        {mine.length === 0 && editing === null && <p className="mt-3 text-xs text-slate-400">None yet.</p>}
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((t) => (
            <TemplateCard key={t.id} t={t} onUse={onUse} onEdit={() => startEdit(t)} onDelete={() => del(t)} />
          ))}
        </ul>

        {editing !== null && (
          <form onSubmit={save} className="mt-5 space-y-3 rounded-xl border border-white/10 p-4">
            <label className="block"><span className={label}>Name</span>
              <input required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            </label>
            <label className="block"><span className={label}>Layout</span>
              <select value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white">
                {LAYOUTS.map(([code, text]) => <option key={code} value={code}>{text}</option>)}
              </select>
            </label>
            <label className="block"><span className={label}>Subject</span>
              <input required maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={input} />
            </label>
            <label className="block"><span className={label}>Opening line</span>
              <textarea required maxLength={1000} rows={3} value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} className={input} />
            </label>
            <p className="text-[11px] text-slate-500">You can use {PLACEHOLDERS}.</p>
            <div className="flex gap-2">
              <button type="submit" disabled={createState.isLoading || updateState.isLoading}
                      className="creator-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function TemplateCard({ t, onUse, onCopy, onEdit, onDelete }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-white">{t.name}</p>
        {t.global && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200">Dalai Llama</span>}
      </div>
      <p className="text-[11px] text-slate-500">{LAYOUT_LABEL[t.layout]}</p>
      <p className="text-sm text-slate-200">{t.subject}</p>
      <p className="line-clamp-3 text-xs text-slate-400">{t.intro}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        <button type="button" onClick={() => onUse(t.id)} className="creator-primary flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white">
          <Send size={12} /> Use
        </button>
        {onCopy && <button type="button" onClick={onCopy} className="creator-control px-3 py-1.5 text-xs font-bold text-slate-200">Copy</button>}
        {onEdit && <button type="button" onClick={onEdit} aria-label={`Edit ${t.name}`} className="creator-control px-2 py-1.5 text-slate-200"><Pencil size={12} /></button>}
        {onDelete && <button type="button" onClick={onDelete} aria-label={`Delete ${t.name}`} className="creator-control px-2 py-1.5 text-rose-300"><Trash2 size={12} /></button>}
      </div>
    </li>
  );
}
