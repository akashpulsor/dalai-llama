import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useGetGenerationControlsQuery, useUpdateGenerationControlsMutation } from "../../api/creatorEndpoints.js";

/**
 * The steps of the render path that are genuinely the creator's call, as switches for this project.
 * Length, voice and slowing are not here: the clip is the length chosen in the video studio, a shot
 * with a line is rendered silent and gets its recorded take, and a shorter clip is slowed to the shot
 * (always interpolated) after generation, from the clip itself.
 */
export const SWITCHES = [
  {
    key: "preventDuplicateRenders",
    label: "Prevent duplicate renders",
    on: "A shot already rendering, or already rendered from that prompt, is not queued again.",
    off: "You can queue the same shot again -- each render is billed.",
  },
  {
    key: "attachPreviousLastFrame",
    label: "Start each shot from the previous shot's last frame",
    on: "Attaches the previous shot's last frame when it has a video; skipped for the first shot.",
    off: "Attach it per shot from the video studio when you want it.",
  },
];

/** A toggle switch: the label is the row's own text, read by aria-labelledby. */
function Switch({ on, disabled, onClick, labelledBy, describedBy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? "border-purple-400/60 bg-purple-500" : "border-white/15 bg-white/10"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

/** Switches turned on, out of all of them. */
export function switchesOn(controls) {
  return SWITCHES.filter((item) => !!controls?.[item.key]).length;
}

/** The switch list itself, shared by the project defaults and each shot's own set. */
export function ControlSwitches({ controls, saving, onToggle }) {
  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
      {SWITCHES.map((item) => {
        const on = !!controls[item.key];
        return (
          <li key={item.key} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p id={`switch-${item.key}`} className={`text-[11px] font-bold ${on ? "text-slate-100" : "text-slate-300"}`}>{item.label}</p>
              <p id={`switch-${item.key}-hint`} className="text-[10px] leading-snug text-slate-500">{on ? item.on : item.off}</p>
            </div>
            <Switch on={on} disabled={saving} onClick={() => onToggle(item.key)}
              labelledBy={`switch-${item.key}`} describedBy={`switch-${item.key}-hint`} />
          </li>
        );
      })}
    </ul>
  );
}

export default function GenerationControlsConsole({ projectId }) {
  const dispatch = useDispatch();
  const { data: controls, isLoading, error, refetch } = useGetGenerationControlsQuery(projectId, { skip: !projectId });
  const [update, { isLoading: saving }] = useUpdateGenerationControlsMutation();

  const toggle = async (key) => {
    try {
      await update({ projectId, ...controls, [key]: !controls[key] }).unwrap();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not change that switch", type: "error" }));
    }
  };

  return (
    <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3" open>
      <summary className="flex cursor-pointer items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-300">
        <SlidersHorizontal size={12} /> Default generation controls
        <span className="font-semibold normal-case tracking-normal text-slate-500">— for every shot without its own (set those in each shot's video studio)</span>
      </summary>
      {isLoading && <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-400"><Loader2 size={12} className="animate-spin" /> Loading…</p>}
      {error && (
        <p className="mt-2 text-[11px] text-rose-200">
          Could not load the controls. <button type="button" className="font-bold underline" onClick={refetch}>Retry</button>
        </p>
      )}
      {controls && (
        <div className="mt-2">
          <ControlSwitches controls={controls} saving={saving} onToggle={toggle} />
        </div>
      )}
    </details>
  );
}
