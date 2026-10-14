import React from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Plus, Trash2, Wrench } from "lucide-react";
import { coverageRows, formatSeconds, issuesFor, timelineFix } from "./studioState.js";

const FIRST_ROWS = 6;

/** One colour per kind of action: A* actions, D* dialogue, C* camera, OPEN/END framing. */
const ID_TONES = {
  A: { chip: "border-purple-400/30 bg-purple-500/15 text-purple-200", bar: "bg-purple-500/60" },
  D: { chip: "border-sky-400/30 bg-sky-500/15 text-sky-200", bar: "bg-sky-500/60" },
  C: { chip: "border-amber-400/30 bg-amber-500/15 text-amber-200", bar: "bg-amber-500/60" },
  O: { chip: "border-white/15 bg-white/5 text-slate-300", bar: "bg-slate-500/60" },
  E: { chip: "border-white/15 bg-white/5 text-slate-300", bar: "bg-slate-500/60" },
};
const tone = (id) => ID_TONES[(id ?? "").trim()[0]] ?? ID_TONES.O;
const ids = (actionId) => (actionId ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function ActionIdChip({ id }) {
  return <span className={`inline-block rounded border px-1 font-mono text-[9px] font-bold ${tone(id).chip}`}>{id}</span>;
}

function ShowAll({ total, open, onToggle }) {
  if (total <= FIRST_ROWS) return null;
  return (
    <button type="button" aria-expanded={open} onClick={onToggle}
      className="flex w-full items-center justify-center gap-1 border-t border-white/5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200">
      <ChevronDown size={12} className={open ? "rotate-180" : ""} /> {open ? "Show fewer" : `Show all ${total}`}
    </button>
  );
}

/** A row that shows one line and opens to the rest on click. */
function ExpandableRow({ summary, details, children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <li>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-[11px] hover:bg-white/[0.03]">
        {summary}
        <span className={`min-w-0 flex-1 text-slate-200 ${open ? "" : "line-clamp-1"}`}>{children}</span>
        {details && <ChevronDown size={11} className={`mt-0.5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {open && details && <div className="space-y-0.5 px-2.5 pb-2 pl-[5.5rem] text-[10px] text-slate-400">{details}</div>}
    </li>
  );
}

/** The actions the analysis found, one line each, with where each one landed. */
export function RequiredActions({ plan }) {
  const rows = coverageRows(plan);
  const [all, setAll] = React.useState(false);
  if (!rows.length) return null;
  const withProblems = rows.filter((row) => issuesFor(plan.assessmentIssues, row.actionId).length).length;
  const shown = all ? rows : rows.slice(0, FIRST_ROWS);
  return (
    <div className="rounded-md border border-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400">
        Required actions <span className="text-slate-500">{rows.length}</span>
        <span className={`ml-auto flex items-center gap-1 ${withProblems ? "text-rose-300" : "text-emerald-300/80"}`}>
          {withProblems ? <><AlertTriangle size={11} /> {withProblems} with problems</> : <><CheckCircle2 size={11} /> every one must appear</>}
        </span>
      </div>
      <ul className="divide-y divide-white/5">
        {shown.map((row) => {
          const problems = issuesFor(plan.assessmentIssues, row.actionId);
          return (
            <ExpandableRow key={row.actionId}
              summary={(
                <span className="flex w-20 shrink-0 items-center gap-1.5">
                  <ActionIdChip id={row.actionId} />
                  <span className="font-mono text-[9px] text-slate-500">
                    {row.coverage ? `${formatSeconds(row.coverage.startSeconds)}–${formatSeconds(row.coverage.endSeconds)}s` : ""}
                  </span>
                </span>
              )}
              details={(row.fixedSeconds != null || problems.length > 0) && (
                <>
                  {row.fixedSeconds != null && <p>Needs {formatSeconds(row.fixedSeconds)}s on screen.</p>}
                  {problems.map((p) => <p key={p.code} className="text-rose-300">{p.message}</p>)}
                </>
              )}
            >
              {problems.length > 0 && <AlertTriangle size={10} className="mr-1 inline text-rose-300" />}
              {row.description}
            </ExpandableRow>
          );
        })}
      </ul>
      <ShowAll total={rows.length} open={all} onToggle={() => setAll((a) => !a)} />
    </div>
  );
}

/**
 * The timeline as a strip -- each interval as wide as its time, hover for its action -- above a
 * list of one-line rows that open to the subject and camera.
 */
export function ActionTimeline({ intervals, frameRate, stale }) {
  const [all, setAll] = React.useState(false);
  const end = Math.max(...intervals.map((i) => Number(i.endSeconds) || 0), 0.1);
  const seconds = Array.from({ length: Math.floor(end) + 1 }, (_, i) => i);
  const shown = all ? intervals : intervals.slice(0, FIRST_ROWS);
  return (
    <div className={`space-y-2 ${stale ? "opacity-60" : ""}`}>
      <div>
        <div className="relative h-6 overflow-hidden rounded-md border border-white/10 bg-white/[0.03]">
          {intervals.map((interval, i) => {
            const left = (Number(interval.startSeconds) / end) * 100;
            const width = Math.max(((Number(interval.endSeconds) - Number(interval.startSeconds)) / end) * 100, 0.8);
            const first = ids(interval.actionId)[0];
            return (
              <span key={i} title={`${formatSeconds(interval.startSeconds)}–${formatSeconds(interval.endSeconds)}s · ${interval.actionId}: ${interval.action}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                className={`absolute inset-y-0 flex items-center justify-center overflow-hidden border-r border-black/40 font-mono text-[9px] font-bold text-white/90 ${tone(first).bar}`}>
                {width > 7 ? ids(interval.actionId).join("+") : ""}
              </span>
            );
          })}
        </div>
        <div className="relative mt-0.5 h-3">
          {seconds.map((s) => (
            <span key={s} style={{ left: `${(s / end) * 100}%` }} className="absolute -translate-x-1/2 font-mono text-[8px] text-slate-500 first:translate-x-0">{s}s</span>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-white/10">
        <ul className="divide-y divide-white/5">
          {shown.map((interval, i) => (
            <ExpandableRow key={i}
              summary={(
                <span className="w-20 shrink-0 font-mono text-[10px] text-slate-400">
                  {formatSeconds(interval.startSeconds)}–{formatSeconds(interval.endSeconds)}s
                  {frameRate ? <span className="block text-[9px] text-slate-500">f {Math.round(Number(interval.startSeconds) * frameRate)}–{Math.round(Number(interval.endSeconds) * frameRate)}</span> : null}
                </span>
              )}
              details={(interval.subjectState || interval.cameraBehavior || interval.holdRequired) && (
                <>
                  {interval.subjectState && <p><b className="text-slate-500">Subject:</b> {interval.subjectState}</p>}
                  {interval.cameraBehavior && <p><b className="text-slate-500">Camera:</b> {interval.cameraBehavior}</p>}
                  {interval.holdRequired && <p className="text-amber-300/80">Holds — no new movement.</p>}
                </>
              )}
            >
              <span className="mr-1.5 inline-flex gap-0.5 align-middle">{ids(interval.actionId).map((id) => <ActionIdChip key={id} id={id} />)}</span>
              {interval.action}
            </ExpandableRow>
          ))}
        </ul>
        <ShowAll total={intervals.length} open={all} onToggle={() => setAll((a) => !a)} />
      </div>
    </div>
  );
}


const cell = "creator-input w-full px-1.5 py-1 text-[11px]";

/**
 * The timeline as a form: each moment's start, end, action ids and what happens. Saving sends it
 * to the server, which checks it like one the AI built; the prompt is rewritten from it on Update.
 */
export function TimelineEditor({ intervals, seconds, saving, onSave, onCancel }) {
  const [rows, setRows] = React.useState(() => intervals.map((i) => ({ ...i, holdRequired: !!i.holdRequired })));
  const set = (index, key, value) => setRows((all) => all.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const add = () => setRows((all) => {
    const start = all.length ? Number(all[all.length - 1].endSeconds) : 0;
    return [...all, { startSeconds: start, endSeconds: seconds, actionId: "", action: "", holdRequired: false }];
  });
  const complete = rows.length > 0 && rows.every((row) => String(row.actionId).trim()
    && Number(row.endSeconds) > Number(row.startSeconds));
  return (
    <div className="space-y-2 rounded-md border border-purple-400/25 bg-purple-500/[0.04] p-2">
      <p className="text-[10px] text-slate-400">
        Times are within the {seconds}s clip. Several actions in one moment: separate their ids with commas (A1, D1).
      </p>
      <div className="space-y-1.5">
        <div className="grid grid-cols-[3.25rem_3.25rem_5rem_1fr_auto_auto] gap-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
          <span>From</span><span>To</span><span>Actions</span><span>What happens</span><span>Hold</span><span />
        </div>
        {rows.map((row, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="grid grid-cols-[3.25rem_3.25rem_5rem_1fr_auto_auto] items-center gap-1.5">
            <input aria-label={`Moment ${i + 1} starts at`} type="number" step="0.1" min="0" max={seconds} value={row.startSeconds}
              onChange={(e) => set(i, "startSeconds", e.target.value)} className={cell} />
            <input aria-label={`Moment ${i + 1} ends at`} type="number" step="0.1" min="0" max={seconds} value={row.endSeconds}
              onChange={(e) => set(i, "endSeconds", e.target.value)} className={cell} />
            <input aria-label={`Moment ${i + 1} actions`} value={row.actionId}
              onChange={(e) => set(i, "actionId", e.target.value)} className={`${cell} font-mono`} />
            <input aria-label={`Moment ${i + 1} what happens`} value={row.action ?? ""}
              onChange={(e) => set(i, "action", e.target.value)} className={cell} />
            <input aria-label={`Moment ${i + 1} holds still`} type="checkbox" checked={row.holdRequired}
              onChange={(e) => set(i, "holdRequired", e.target.checked)} className="h-3.5 w-3.5 accent-purple-500" />
            <button type="button" aria-label={`Remove moment ${i + 1}`} onClick={() => setRows((all) => all.filter((_, j) => j !== i))}
              className="text-slate-500 hover:text-rose-300"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={add} className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-purple-200">
          <Plus size={11} /> Add a moment
        </button>
        <span className="ml-auto" />
        <button type="button" onClick={onCancel} disabled={saving}
          className="rounded-md border border-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-400 disabled:opacity-50">Cancel</button>
        <button type="button" disabled={!complete || saving}
          onClick={() => onSave(rows.map((row) => ({
            startSeconds: Number(row.startSeconds),
            endSeconds: Number(row.endSeconds),
            actionId: String(row.actionId).trim(),
            action: row.action ?? "",
            subjectState: row.subjectState ?? null,
            cameraBehavior: row.cameraBehavior ?? null,
            holdRequired: !!row.holdRequired,
          })))}
          className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1 text-[10px] font-bold text-purple-100 disabled:opacity-50">
          {saving && <Loader2 size={11} className="animate-spin" />} Save timeline
        </button>
      </div>
      {!complete && <p className="text-[10px] text-slate-500">Every moment needs an action id and an end after its start.</p>}
    </div>
  );
}

/**
 * What the timeline's checks found, each with what to do about it. Problems that are only about
 * time get one button that fixes them all; the rest say what to change by hand, or that Update
 * rebuilds the timeline -- which replaces any hand edits, so it is the last resort, not the first.
 */
export function TimelineProblems({ issues, onFixTimes, fixing }) {
  if (!issues?.length) return null;
  const timeOnly = issues.some((issue) => timelineFix(issue).timeOnly);
  return (
    <div className="space-y-1.5 rounded-md border border-rose-400/25 bg-rose-500/[0.05] p-2">
      <p className="flex items-center gap-1.5 text-[10px] font-bold text-rose-200">
        <AlertTriangle size={11} /> The timeline fails {issues.length} check{issues.length === 1 ? "" : "s"}
      </p>
      <ul className="space-y-1">
        {issues.map((issue, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={i} className="text-[10px]">
            <p className="text-rose-100">{issue.actionId && <ActionIdChip id={issue.actionId} />} {issue.message}</p>
            <p className="text-slate-400">{timelineFix(issue).advice}</p>
          </li>
        ))}
      </ul>
      {timeOnly && onFixTimes && (
        <button type="button" onClick={onFixTimes} disabled={fixing}
          className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-purple-400/40 disabled:opacity-50">
          {fixing ? <Loader2 size={11} className="animate-spin" /> : <Wrench size={11} />} Fix the times
        </button>
      )}
      <p className="text-[10px] text-slate-500">Update rebuilds a timeline that still fails its checks, replacing any edits made by hand.</p>
    </div>
  );
}
