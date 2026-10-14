import React from "react";
import { Check, Loader2, Pencil, RotateCcw, Save, ShieldCheck } from "lucide-react";
import PromptReadView from "./PromptReadView.jsx";

function ActionButton({ onClick, busy, disabled, icon: Icon, children }) {
  return (
    <button type="button" onClick={onClick} disabled={busy || disabled}
      className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-purple-400/40 hover:text-purple-200 disabled:opacity-50">
      {busy ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {children}
    </button>
  );
}

/**
 * The one place the prompt's words are shown. It opens formatted for reading; "Edit text" turns it
 * into a text box and "Done" back. A sent version has no Edit here -- the card's Edit starts a new
 * draft from it instead.
 *
 * @param {{
 *   text: string, onChange?: (text: string) => void, readOnly: boolean, writing: boolean,
 *   maxChars: number | null, generateSeconds: number | null, unsaved: boolean,
 *   save?: { onClick: () => void, busy: boolean, disabled: boolean },
 *   reset?: { onClick: () => void, busy: boolean, disabled: boolean },
 *   validate?: { onClick: () => void, busy: boolean, disabled: boolean },
 *   editSignal?: object | null,  a new object opens the text box (Reject & rewrite)
 * }} props
 */
export default function PromptTextEditor({ text, onChange, readOnly, writing, maxChars, generateSeconds, unsaved, save, reset, validate, editSignal = null }) {
  const [editing, setEditing] = React.useState(false);
  React.useEffect(() => { if (editSignal && !readOnly) setEditing(true); }, [editSignal, readOnly]);
  const boxRef = React.useRef(null);
  React.useEffect(() => { if (readOnly || writing) setEditing(false); }, [readOnly, writing]);
  React.useEffect(() => { if (editing) boxRef.current?.focus(); }, [editing]);
  const over = maxChars && text.length > maxChars;

  return (
    <div className="space-y-2">
      <div className="relative">
        {editing ? (
          <textarea
            ref={boxRef}
            value={text}
            aria-label="Video prompt"
            onChange={(e) => onChange?.(e.target.value)}
            rows={14}
            className="creator-input w-full font-mono text-[11px] leading-relaxed"
          />
        ) : (
          <div className={writing ? "opacity-40" : ""} aria-busy={writing}>
            <PromptReadView text={text} placeholder="No prompt yet — press Write prompt, or Edit text to write it yourself." />
          </div>
        )}
        {writing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-bold text-purple-100">
            <Loader2 size={14} className="animate-spin" /> Writing a new version from the actions and timeline…
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`text-[10px] font-bold ${over ? "text-rose-300" : "text-slate-500"}`}>
          {text.length}{maxChars ? ` / ${maxChars}` : ""} characters
        </span>
        {unsaved && !readOnly && <span className="text-[10px] font-bold text-amber-300">Unsaved edits</span>}
        {!readOnly && (
          <div className="ml-auto flex flex-wrap gap-2">
            {editing
              ? <ActionButton icon={Check} onClick={() => setEditing(false)}>Done</ActionButton>
              : <ActionButton icon={Pencil} onClick={() => setEditing(true)} disabled={writing}>Edit text</ActionButton>}
            {save && <ActionButton icon={Save} {...save}>Save draft</ActionButton>}
            {reset && <ActionButton icon={RotateCcw} {...reset}>Reset to AI version</ActionButton>}
            {validate && <ActionButton icon={ShieldCheck} {...validate}>Validate</ActionButton>}
          </div>
        )}
      </div>
      {generateSeconds != null && (
        <p className="text-[10px] text-slate-500">
          Timings in this prompt are for the generated clip ({generateSeconds}s), not the final film.
        </p>
      )}
    </div>
  );
}
