import React from "react";
import { ChevronDown } from "lucide-react";
import { Chip, PromptVersionChip } from "./PromptChips.jsx";
import { PromptState } from "./promptModel.js";

/** One closed-by-default section of the card. The header is a real button. */
function Accordion({ id, title, count, children }) {
  const [open, setOpen] = React.useState(false);
  const panelId = `${id}-panel`;
  return (
    <div className="border-t border-white/5">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 py-2 text-left text-[10px] font-extrabold uppercase tracking-wide text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:text-purple-200">
        <span>{title}{count != null && <span className="ml-1.5 font-bold text-slate-500">{count}</span>}</span>
        <ChevronDown size={12} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id={panelId} className="pb-2.5">{children}</div>}
    </div>
  );
}

function Thumbs({ images, held }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto">
      {images.map((img, i) => (
        <figure key={img.assetId} className="shrink-0">
          <img src={img.thumbnailUrl} alt={img.label} title={held ? img.label : `Slot ${i} — ${img.label}`}
            className={`h-14 w-14 rounded object-cover ${held ? "border border-dashed border-white/15 opacity-70" : "border border-white/10"}`} />
          <figcaption className="mt-0.5 w-14 truncate text-center text-[9px] font-semibold text-slate-500">{img.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Three lines, or the whole version on click. */
function VersionText({ text }) {
  const [full, setFull] = React.useState(false);
  return (
    <button type="button" aria-expanded={full} onClick={() => setFull((f) => !f)} title={full ? "Show less" : "Show the whole prompt"}
      className={`block w-full text-left text-[11px] font-medium leading-relaxed text-slate-400 ${full ? "whitespace-pre-wrap" : "line-clamp-3"}`}>
      {text || "—"}
    </button>
  );
}

function HistoryList({ history, currentVersion, onUse }) {
  if (!history.length) return <p className="text-[11px] text-slate-500">No versions yet — the first is written when the prompt is prepared or generated.</p>;
  return (
    <ol className="space-y-1.5">
      {history.map((v) => (
        <li key={v.promptId ?? v.version} className="rounded border border-white/10 bg-black/20 p-2">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <PromptVersionChip version={v} />
            {v.sourceLabel && <span className="text-[9px] font-bold text-slate-500">{v.sourceLabel}</span>}
            {v.generateSeconds != null && <span className="text-[9px] font-bold text-slate-500">{v.generateSeconds}s</span>}
            {v.createdAt && (
              <span className="text-[9px] font-semibold text-slate-600">
                {new Date(v.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {v.state === PromptState.SENT && <Chip tone="green">Sent</Chip>}
            {v.approvalStatus === "REJECTED" && <Chip tone="amber">Rejected</Chip>}
            {v.version === currentVersion && <span className="text-[9px] font-black uppercase text-purple-300">current</span>}
          </div>
          <VersionText text={v.text} />
          {onUse && v.version !== currentVersion && (
            <button type="button" onClick={() => onUse(v.text)} className="mt-1 text-[10px] font-bold text-purple-300 hover:text-purple-200">
              Use this as a new draft
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * What goes with the text: the negative prompt, the images and audio sent with it, and every
 * version. All closed until asked for.
 */
export default function PromptCollapsibles({ idPrefix, version, history, onUseVersion }) {
  const sent = version?.images.filter((img) => img.sentToModel) ?? [];
  const held = version?.images.filter((img) => !img.sentToModel) ?? [];
  const audio = version?.audio ?? [];
  return (
    <div>
      {version?.negativePrompt && (
        <Accordion id={`${idPrefix}-negative`} title="Negative prompt">
          <p className="whitespace-pre-wrap text-[11px] text-slate-400">{version.negativePrompt}</p>
        </Accordion>
      )}
      {(sent.length > 0 || held.length > 0) && (
        <Accordion id={`${idPrefix}-images`} title="Images sent to the model" count={sent.length}>
          <div className="space-y-2">
            {sent.length > 0 ? <Thumbs images={sent} /> : <p className="text-[10px] text-slate-500">None sent.</p>}
            {held.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium text-slate-500">Held, not sent — this shot's other images</p>
                <Thumbs images={held} held />
              </div>
            )}
          </div>
        </Accordion>
      )}
      {audio.length > 0 && (
        <Accordion id={`${idPrefix}-audio`} title="Audio references" count={audio.length}>
          <ul className="space-y-2">
            {audio.map((a) => (
              <li key={a.assetId} className="space-y-1.5 rounded-md border border-white/10 bg-white/[0.02] p-2">
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                  {a.label}
                  {a.source && <span className={`rounded border px-1 text-[8px] font-bold uppercase tracking-wide ${a.source === "generated" ? "border-purple-400/30 text-purple-300" : "border-white/15 text-slate-400"}`}>{a.source}</span>}
                </p>
                {a.purpose && <p className="text-[10px] leading-relaxed text-slate-400">{a.purpose}</p>}
                <audio controls src={a.url} preload="none" className="h-8 w-full" />
              </li>
            ))}
          </ul>
        </Accordion>
      )}
      <Accordion id={`${idPrefix}-history`} title="History" count={history.length}>
        <HistoryList history={history} currentVersion={version?.version} onUse={onUseVersion} />
      </Accordion>
    </div>
  );
}
