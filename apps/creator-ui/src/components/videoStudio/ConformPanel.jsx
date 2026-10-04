import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, Timer } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { creatorApi, useLazyGetShotConformQuery, useRequestShotConformMutation } from "../../api/creatorEndpoints.js";

/**
 * Slow the shot's newest clip to a length -- the planned one by default -- in post-production, with
 * frame interpolation so the slowed motion stays smooth. A longer clip is trimmed instead. The
 * result becomes the shot's clip; the clip as generated stays in its cuts.
 */
export default function ConformPanel({ shot, projectId, clipSeconds }) {
  const dispatch = useDispatch();
  const [target, setTarget] = React.useState(shot.durationSeconds ?? "");
  const [interpolate, setInterpolate] = React.useState(true);
  const [status, setStatus] = React.useState(null);
  const [requestConform, { isLoading: requesting }] = useRequestShotConformMutation();
  const [fetchConform] = useLazyGetShotConformQuery();
  const working = requesting || status === "QUEUED" || status === "PROCESSING";

  const run = async () => {
    const seconds = Number(target);
    if (!(seconds > 0)) return;
    try {
      const queued = await requestConform({ projectId, shotId: shot.id, targetSeconds: seconds, interpolate }).unwrap();
      setStatus(queued.status);
      for (let attempt = 0; attempt < 120; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 5000); });
        // eslint-disable-next-line no-await-in-loop
        const latest = await fetchConform({ projectId, shotId: shot.id, requestId: queued.requestId }).unwrap().catch(() => null);
        if (!latest) continue;
        setStatus(latest.status);
        if (latest.status === "COMPLETED") {
          dispatch(creatorApi.util.invalidateTags([
            { type: "CreatorHomeProjects", id: `project-clips-${projectId}` },
            { type: "CreatorHomeProjects", id: `clip-cuts-${shot.id}` },
          ]));
          dispatch(showFlash({ message: `The shot now plays at ${seconds}s${interpolate ? ", interpolated" : ""}.`, type: "success" }));
          return;
        }
        if (latest.status === "FAILED") {
          dispatch(showFlash({ message: latest.error || "Could not change the clip's length", type: "error" }));
          return;
        }
      }
      dispatch(showFlash({ message: "Still working on it — the new cut will appear when it finishes.", type: "info" }));
    } catch (error) {
      setStatus(null);
      dispatch(showFlash({ message: error?.data?.message || error?.data?.error || "Could not start that", type: "error" }));
    }
  };

  const factor = clipSeconds > 0 && Number(target) > 0 ? Number(target) / clipSeconds : null;

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
        <Timer size={12} /> Slow down to length (interpolate)
      </p>
      <p className="mt-1 text-[10px] text-slate-500">
        {clipSeconds ? `The clip is ${Number(clipSeconds).toFixed(1)}s. ` : ""}
        Slowed to the length you set{factor && factor > 1 ? ` (${factor.toFixed(1)}× slower)` : ""}; a longer clip is trimmed.
        The line and the music are laid back on at normal speed.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="text-[10px] font-bold text-slate-400">Length
          <input type="number" min="1" step="1" value={target} onChange={(e) => setTarget(e.target.value)}
            disabled={working} className="creator-input ml-1.5 w-16 px-2 py-1 text-[11px]" /> s
        </label>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
          <input type="checkbox" checked={interpolate} onChange={(e) => setInterpolate(e.target.checked)} disabled={working} />
          Interpolate frames (smooth motion)
        </label>
        <button type="button" onClick={run} disabled={working || !(Number(target) > 0)}
          className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[11px] font-bold text-purple-100 disabled:opacity-50">
          {working ? <Loader2 size={12} className="animate-spin" /> : <Timer size={12} />}
          {working ? (status === "PROCESSING" ? "Interpolating…" : "Queued…") : `Make it ${target || "–"}s`}
        </button>
      </div>
      {factor && factor > 2 && <p className="mt-1.5 text-[10px] text-amber-200">More than 2× slower can look unnatural even with interpolation.</p>}
    </div>
  );
}
