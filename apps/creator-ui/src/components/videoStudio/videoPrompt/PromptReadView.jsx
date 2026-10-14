import React from "react";
import { ChevronDown } from "lucide-react";
import { promptBlocks } from "./promptFormat.js";

function Segments({ segments }) {
  return segments.map((s, i) => (s.time
    ? <mark key={i} className="rounded bg-purple-500/15 px-1 font-mono text-[10px] font-bold text-purple-200">{s.text}</mark>
    : <React.Fragment key={i}>{s.text}</React.Fragment>));
}

function Block({ block }) {
  switch (block.kind) {
    case "heading":
      return <p className="pt-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{block.text}</p>;
    case "beats":
      return (
        <ol className="space-y-1.5 border-l border-purple-400/25 pl-3">
          {block.beats.map((beat, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-purple-400/70" />
              <span className="mb-0.5 block font-mono text-[10px] font-bold text-purple-300">{beat.time}</span>
              <span className="text-slate-200"><Segments segments={beat.segments} /></span>
            </li>
          ))}
        </ol>
      );
    case "references":
      return (
        <ul className="space-y-1 rounded-md border border-white/5 bg-black/20 p-2">
          {block.items.map((item) => (
            <li key={item.label} className="flex gap-2 text-[10px]">
              <span className="w-14 shrink-0 font-bold text-slate-400">{item.label}</span>
              <span className="text-slate-400">{item.text}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return <p className="text-slate-200"><Segments segments={block.segments} /></p>;
  }
}

/**
 * The prompt laid out for reading: timed beats down a timeline, reference lines as a list, times
 * highlighted. Long prompts open at a fixed height with "Show the whole prompt".
 */
export default function PromptReadView({ text, placeholder }) {
  const [expanded, setExpanded] = React.useState(false);
  const blocks = React.useMemo(() => promptBlocks(text), [text]);
  const long = text.length > 900;
  if (!text.trim()) return <p className="rounded-md border border-dashed border-white/10 p-3 text-[11px] text-slate-500">{placeholder}</p>;
  return (
    <div className="rounded-md border border-white/10 bg-black/20">
      <div className={`relative space-y-2.5 p-3 text-[11.5px] leading-relaxed ${long && !expanded ? "max-h-72 overflow-hidden" : ""}`}>
        {blocks.map((block, i) => <Block key={i} block={block} />)}
        {long && !expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />}
      </div>
      {long && (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-center gap-1 border-t border-white/5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200">
          <ChevronDown size={12} className={expanded ? "rotate-180" : ""} /> {expanded ? "Show less" : "Show the whole prompt"}
        </button>
      )}
    </div>
  );
}
