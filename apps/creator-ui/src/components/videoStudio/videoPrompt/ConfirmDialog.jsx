import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * A small two-choice question. Focus stays inside while open, Escape or a click outside cancels,
 * and focus returns to whatever opened it.
 *
 * @param {{
 *   open: boolean, title: string, body?: React.ReactNode,
 *   primary: { label: string, icon?: React.ComponentType<{ size?: number }>, onClick: () => void },
 *   secondary: { label: string, icon?: React.ComponentType<{ size?: number }>, onClick: () => void },
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmDialog({ open, title, body, primary, secondary, onCancel }) {
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    panelRef.current?.querySelector("button")?.focus();
    return () => opener?.focus?.();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [...panelRef.current.querySelectorAll("button:not([disabled])")];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const PrimaryIcon = primary.icon;
  const SecondaryIcon = secondary.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={body ? "confirm-dialog-body" : undefined}
        onKeyDown={onKeyDown}
        className="w-full max-w-sm space-y-3 rounded-lg border border-amber-400/30 bg-slate-950 p-4 shadow-2xl"
      >
        <p id="confirm-dialog-title" className="flex items-center gap-2 text-sm font-bold text-amber-100">
          <AlertTriangle size={15} className="shrink-0" /> {title}
        </p>
        {body && <div id="confirm-dialog-body" className="text-[11px] text-slate-300">{body}</div>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={primary.onClick}
            className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-3 py-1.5 text-[11px] font-bold text-purple-100 hover:bg-purple-500/25">
            {PrimaryIcon && <PrimaryIcon size={12} />} {primary.label}
          </button>
          <button type="button" onClick={secondary.onClick}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:border-amber-400/40">
            {SecondaryIcon && <SecondaryIcon size={12} />} {secondary.label}
          </button>
        </div>
      </div>
    </div>
  );
}
