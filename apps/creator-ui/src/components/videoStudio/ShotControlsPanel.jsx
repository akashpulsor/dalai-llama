import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetShotGenerationControlsQuery,
  useResetShotGenerationControlsMutation,
  useUpdateShotGenerationControlsMutation,
} from "../../api/creatorEndpoints.js";
import { ControlSwitches } from "./GenerationControlsConsole.jsx";

/**
 * This shot's generation controls. A shot follows the project's defaults until one switch is
 * changed here; from then on it has its own set, and "Use the project defaults" hands it back.
 */
export default function ShotControlsPanel({ projectId, shotId }) {
  const dispatch = useDispatch();
  const args = { projectId, shotId };
  const { data, isLoading, error, refetch } = useGetShotGenerationControlsQuery(args);
  const [update, { isLoading: saving }] = useUpdateShotGenerationControlsMutation();
  const [reset, { isLoading: resetting }] = useResetShotGenerationControlsMutation();

  const toggle = async (key) => {
    try {
      await update({ ...args, ...data.controls, [key]: !data.controls[key] }).unwrap();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not change that switch", type: "error" }));
    }
  };

  const returnToDefaults = async () => {
    try {
      await reset(args).unwrap();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not reset this shot's controls", type: "error" }));
    }
  };

  return (
    <details className="rounded-md border border-white/10 bg-white/[0.02] p-2.5">
      <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
        <SlidersHorizontal size={11} /> This shot's generation controls
        {data && (
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal ${data.custom ? "bg-purple-500/20 text-purple-200" : "bg-white/5 text-slate-500"}`}>
            {data.custom ? "custom for this shot" : "project defaults"}
          </span>
        )}
      </summary>
      <div className="mt-2 space-y-2">
        {isLoading && <p className="flex items-center gap-2 text-[10px] text-slate-400"><Loader2 size={11} className="animate-spin" /> Loading…</p>}
        {error && (
          <p className="text-[10px] text-rose-200">
            Could not load this shot's controls. <button type="button" className="font-bold underline" onClick={refetch}>Retry</button>
          </p>
        )}
        {data && (
          <>
            <ControlSwitches controls={data.controls} saving={saving || resetting} onToggle={toggle} />
            {data.custom && (
              <button type="button" onClick={returnToDefaults} disabled={resetting}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50">
                {resetting ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />} Use the project defaults again
              </button>
            )}
          </>
        )}
      </div>
    </details>
  );
}
