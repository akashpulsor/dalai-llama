// @ts-nocheck
import React, { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, MailSearch } from "lucide-react";
import { useCreateAudienceMutation, useUploadAudienceCsvMutation } from "../../api/showcaseEndpoints.js";
import { errorMessage } from "../showcase/showcaseLabels.js";
import { CSV_COLUMNS, SAMPLE_CSV, checkCsv, checkFileKind } from "./csvCheck.js";

/** Upload a contacts CSV in three steps: choose a file → see it checked and previewed → import.
 * A file in the wrong format never reaches the server; the creator is told what's wrong and how to
 * fix it, with the format beside it. {@code audienceId} null = the upload makes a new list. */
export default function CsvImport({ audienceId, onImported, onFindEmails }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [check, setCheck] = useState(null);
  const [listName, setListName] = useState("");
  const [report, setReport] = useState(null);
  const [serverError, setServerError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [upload, uploadState] = useUploadAudienceCsvMutation();
  const [createAudience, createState] = useCreateAudienceMutation();
  const busy = uploadState.isLoading || createState.isLoading;

  const choose = async (picked) => {
    if (!picked) return;
    setReport(null);
    setServerError("");
    setFile(picked);
    setListName(picked.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 80));
    const head = new Uint8Array(await picked.slice(0, 4).arrayBuffer());
    setCheck(checkFileKind(picked.name, head) || checkCsv(await picked.text(), { size: picked.size }));
  };
  const reset = () => { setFile(null); setCheck(null); setReport(null); setServerError(""); };

  const doImport = async () => {
    setServerError("");
    try {
      const target = audienceId || (await createAudience(listName.trim() || "Uploaded contacts").unwrap()).id;
      const result = await upload({ audienceId: target, file }).unwrap();
      setReport(result);
      setCheck(null);
      onImported?.(target, result);
    } catch (e) { setServerError(errorMessage(e, "Couldn't import that file")); }
  };

  if (report) {
    return (
      <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4" role="status">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-100"><CheckCircle2 size={16} /> {report.rowsImported} contacts imported</p>
        <p className="mt-1 text-xs text-slate-300">
          {report.leadsCreated} new · {report.leadsMerged} matched contacts you already had
          {report.rowsRejected > 0 && ` · ${report.rowsRejected} rows skipped (nothing to know them by)`} · list now has {report.audienceSize}
        </p>
        {report.leadsWithoutEmail > 0 && (
          <p className="mt-2 text-xs text-amber-100">
            {report.leadsWithoutEmail} {report.leadsWithoutEmail === 1 ? "contact has" : "contacts have"} no email yet.
            {onFindEmails && (
              <button type="button" onClick={onFindEmails} className="ml-2 inline-flex items-center gap-1 font-bold text-purple-200 underline-offset-2 hover:underline">
                <MailSearch size={12} /> Find their emails
              </button>
            )}
          </p>
        )}
        <button type="button" onClick={reset} className="mt-3 text-xs font-bold text-slate-300 hover:text-white">Upload another file</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!check && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center ${dragging ? "border-purple-400 bg-purple-500/10" : "border-white/15 hover:border-white/30"}`}>
          <FileUp size={26} className="text-purple-200" />
          <span className="text-sm font-bold text-white">Drop your CSV here, or click to choose it</span>
          <span className="text-xs text-slate-400">Up to 5,000 contacts · 2 MB · we check it before anything is imported</span>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" data-testid="csv-input"
                 onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}

      {check && !check.ok && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.07] p-4" role="alert">
          <p className="flex items-center gap-2 text-sm font-bold text-rose-100"><AlertTriangle size={16} /> {check.title}</p>
          <p className="mt-1 text-xs text-slate-300">{file?.name}: {check.detail}</p>
          <p className="mt-2 text-xs text-slate-200"><span className="font-bold">How to fix it:</span> {check.fix}</p>
          <button type="button" onClick={reset} className="creator-control mt-3 px-3 py-1.5 text-xs font-bold text-slate-200">
            Choose another file
          </button>
        </div>
      )}

      {check?.ok && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-white">{file.name} · {check.rows} {check.rows === 1 ? "row" : "rows"}</p>
            <button type="button" onClick={reset} className="text-xs font-bold text-slate-400 hover:text-white">Choose another file</button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
            <li className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">{check.withEmail} with email</li>
            {check.withoutEmail > 0 && <li className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">{check.withoutEmail} without email (kept, find it later)</li>}
            {check.skipped > 0 && <li className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300">{check.skipped} skipped: nothing to know them by</li>}
            {check.badEmails > 0 && <li className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200">{check.badEmails} email{check.badEmails === 1 ? " isn't" : "s aren't"} valid and won't be used</li>}
          </ul>
          <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[520px] text-left text-xs" aria-label="Preview of the first contacts">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-normal text-slate-500">
                <tr>{["Name", "Company", "Email", "Phone", "Website"].map((h) => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {check.preview.map((c, i) => (
                  <tr key={i} className={c.skipped ? "opacity-50" : ""} title={c.skipped ? "Skipped: no email, phone, name, company or website" : undefined}>
                    <td className="px-3 py-2">{c.skipped ? <span className="text-slate-400">Skipped</span> : c.name || <Dash />}</td>
                    <td className="px-3 py-2">{c.company || <Dash />}</td>
                    <td className="px-3 py-2">{c.emails.join(", ") || (c.skipped ? <Dash /> : <span className="text-amber-200">No email</span>)}</td>
                    <td className="px-3 py-2">{c.phone || <Dash />}</td>
                    <td className="max-w-[160px] truncate px-3 py-2">{c.website || <Dash />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {check.rows > 5 ? `First 5 of ${check.rows} shown. ` : ""}Columns used: {check.recognised.join(", ")}
            {check.ignored.length > 0 && <> · ignored: {check.ignored.join(", ")}</>}
          </p>
          {check.withoutEmail > 0 && !check.hasWebsite && (
            <p className="mt-2 text-[11px] text-amber-200">Tip: add a website column so we can find the missing emails for you.</p>
          )}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            {!audienceId && (
              <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-normal text-slate-500">List name
                <input value={listName} onChange={(e) => setListName(e.target.value)} maxLength={80} required
                       className="mt-1 block w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm normal-case text-white" />
              </label>
            )}
            <button type="button" onClick={doImport} disabled={busy || (!audienceId && !listName.trim())}
                    className="creator-primary flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {busy && <Loader2 size={14} className="animate-spin" />} Import {check.withEmail + check.withoutEmail} {check.withEmail + check.withoutEmail === 1 ? "contact" : "contacts"}
            </button>
          </div>
          {serverError && <p className="mt-2 text-xs text-rose-300" role="alert">{serverError}</p>}
        </div>
      )}

      {!check?.ok && <CsvFormat />}
    </div>
  );
}

const Dash = () => <span className="text-slate-600">—</span>;

/** The expected format, shown open beside the upload: the sample as a small sheet (what the file
 * should look like), what each column means, and the sample to download and fill in. */
export function CsvFormat() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV + "\r\n"], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dalai-llama-contacts-sample.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const [header, ...rows] = SAMPLE_CSV.split("\r\n").map((line) => line.split(","));
  return (
    <section aria-labelledby="csv-format-h" className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="csv-format-h" className="text-sm font-bold text-white">Your file should look like this</h3>
          <p className="mt-0.5 text-slate-400">
            First row = column names. Each contact needs at least one of <b className="text-slate-200">email, phone, name, company or website</b>.
            Other columns are optional; columns we don't know are ignored.
          </p>
        </div>
        <button type="button" onClick={download} className="creator-control inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200">
          <Download size={12} /> Download sample CSV
        </button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[640px] text-left font-mono text-[11px]" aria-label="Sample CSV">
          <thead className="bg-purple-500/10 text-purple-100">
            <tr>{header.map((h) => <th key={h} className="px-2.5 py-1.5 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {rows.map((row, i) => (
              <tr key={i}>{header.map((h, j) => <td key={h} className="whitespace-nowrap px-2.5 py-1.5">{row[j] || <span className="text-slate-600">(empty)</span>}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {CSV_COLUMNS.map(([c, d]) => (
          <div key={c} className="flex gap-2"><dt className="w-20 shrink-0 font-mono text-purple-200">{c}</dt><dd className="text-slate-400">{d}</dd></div>
        ))}
      </dl>
      <p className="mt-3 text-slate-500">Made in Excel or Google Sheets? Save or download it as <b className="text-slate-300">CSV (comma separated)</b>, not .xlsx.</p>
    </section>
  );
}
