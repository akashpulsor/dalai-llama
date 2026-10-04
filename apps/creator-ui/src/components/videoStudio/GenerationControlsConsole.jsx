import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useGetGenerationControlsQuery, useUpdateGenerationControlsMutation } from "../../api/creatorEndpoints.js";

/**
 * Every step of the render path that can stop or reshape a shot, as a switch for this project. The
 * defaults are the path that always lets a shot be generated; each switch says what turning it on
 * costs or risks, so the trade is visible where it is made.
 */
const SWITCHES = [
  {
    key: "fitDurationToDialogue",
    label: "Fit duration to dialogue",
    on: "Resizes the clip to its measured line, and refuses a line too long to fit.",
    off: "Generates at exactly the duration you chose; a long line may be cut.",
  },
  {
    key: "autoDubDialogue",
    label: "Auto-dub the cloned voice",
    on: "Generates silent, then lays the cast's cloned voice on top.",
    off: "The video model performs the line itself.",
  },
  {
    key: "mixBackgroundMusic",
    label: "Mix the shot's music bed",
    on: "Lays the shot's music under the finished clip.",
    off: "The clip keeps only its own audio.",
  },
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

export default function GenerationControlsConsole({ projectId }) {
  const dispatch = useDispatch();
  const { data: controls, isLoading, error, refetch } = useGetGenerationControlsQuery(projectId, { skip: !projectId });
  const [update, { isLoading: saving, originalArgs }] = useUpdateGenerationControlsMutation();

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
        <SlidersHorizontal size={12} /> Generation controls
        <span className="font-semibold normal-case tracking-normal text-slate-500">— apply to every shot in this project</span>
      </summary>
      {isLoading && <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-400"><Loader2 size={12} className="animate-spin" /> Loading…</p>}
      {error && (
        <p className="mt-2 text-[11px] text-rose-200">
          Could not load the controls. <button type="button" className="font-bold underline" onClick={refetch}>Retry</button>
        </p>
      )}
      {controls && (
        <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {SWITCHES.map((item) => {
            const on = !!controls[item.key];
            const busy = saving && originalArgs && originalArgs[item.key] !== controls[item.key];
            return (
              <li key={item.key} className="flex items-start gap-2.5 rounded-md border border-white/5 bg-white/[0.02] p-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={saving}
                  onClick={() => toggle(item.key)}
                  className={`relative mt-0.5 h-4 w-7 shrink-0 rounded-full transition ${on ? "bg-purple-500" : "bg-white/15"} disabled:opacity-60`}
                >
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${on ? "left-3.5" : "left-0.5"}`} />
                </button>
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                    {item.label} {busy && <Loader2 size={10} className="animate-spin" />}
                  </p>
                  <p className="text-[10px] text-slate-500">{on ? item.on : item.off}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}
