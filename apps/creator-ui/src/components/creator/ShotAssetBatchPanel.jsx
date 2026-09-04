// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  creatorApi,
  useGetShotAssetBatchStatusQuery,
  useListShotAssetDeadLettersQuery,
  useRetryShotAssetDeadLetterMutation,
  useStartShotAssetBatchMutation,
} from "../../api/creatorEndpoints.js";

const RUNNING = new Set(["PENDING", "PROCESSING"]);

const STEP_LABEL = {
  LIGHTING_PLAN: "lighting plan",
  CAMERA_PLAN: "camera plan",
  STORYBOARD_IMAGE: "storyboard image",
  PRODUCTION_IMAGE: "production image",
  LIGHTING_IMAGE: "lighting image",
  CAMERA_PLAN_IMAGE: "camera plan image",
};

/** Steps that failed 3 automatic attempts during a run -- never retried on their own (see the
 * backend's own reasoning), only one at a time, deliberately, here. Closed by default: this is
 * detail for when something actually needs attention, not something every project's shots page
 * should open with. */
function ShotAssetDeadLetters({ projectId, shots }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { data: deadLetters = [] } = useListShotAssetDeadLettersQuery(projectId, { skip: !projectId || !open });
  const [retry, { isLoading: retrying }] = useRetryShotAssetDeadLetterMutation();
  const [pendingId, setPendingId] = useState(null);

  const shotNumberById = React.useMemo(() => {
    const map = new Map();
    (shots || []).forEach((s) => map.set(s.id, s.shotNumber));
    return map;
  }, [shots]);

  const handleRetry = async (deadLetterId) => {
    setPendingId(deadLetterId);
    try {
      await retry({ projectId, deadLetterId }).unwrap();
      dispatch(showFlash({ message: "Regenerated", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Still failing — check the shot's own fields", type: "error" }));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mt-2 rounded-md border border-rose-400/20 bg-rose-500/[0.03]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300">
          <AlertTriangle size={12} />
          Needs attention
        </span>
        {open ? <ChevronUp size={13} className="text-rose-300" /> : <ChevronDown size={13} className="text-rose-300" />}
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-rose-400/10 px-3 py-2.5">
          {deadLetters.length === 0 ? (
            <p className="text-[11px] font-medium text-slate-500">Nothing needs attention.</p>
          ) : (
            deadLetters.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/20 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-200">
                    Shot {shotNumberById.get(d.shotId) ?? "?"} — {STEP_LABEL[d.step] || d.step}
                  </p>
                  <p className="truncate text-[10px] font-medium text-slate-500" title={d.lastError}>
                    Failed {d.attempts}x: {d.lastError || "unknown error"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={retrying && pendingId === d.id}
                  onClick={() => handleRetry(d.id)}
                  className="flex shrink-0 items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-200 hover:border-purple-400/30 disabled:opacity-60"
                >
                  {retrying && pendingId === d.id ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                  Retry
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** One CTA that generates every shot's lighting plan, camera plan, and all 4 images -- what used
 * to be up to ~7 separate manual buttons per shot (confirmed: 10 shots was genuinely ~70 CTAs on
 * this page). The backend does this one step at a time on its own worker (ShotAssetBatchWorker);
 * this just starts it and polls for progress. Per-shot "Plan"/"Regenerate" buttons elsewhere on
 * this page stay exactly as they are -- this doesn't replace them, it's just no longer required to
 * click all of them to get a first pass. */
export default function ShotAssetBatchPanel({ projectId, shots }) {
  const dispatch = useDispatch();
  const [start, { isLoading: starting }] = useStartShotAssetBatchMutation();
  const { data: status, refetch } = useGetShotAssetBatchStatusQuery(projectId, { skip: !projectId });
  const wasRunning = useRef(false);

  const running = RUNNING.has(status?.status);

  // Poll only while a batch is actually in flight -- the initial fetch (on mount, regardless of
  // polling) is what tells us whether one is; no need to keep hitting this every few seconds once
  // a run is done or none has ever happened for this project.
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(refetch, 3000);
    return () => clearInterval(interval);
  }, [running, refetch]);

  // Once the batch finishes, the per-shot lighting/camera/image panels are still holding onto
  // whatever they had cached before the batch ran -- refresh them so the new plans/images show up
  // without a manual page reload.
  useEffect(() => {
    if (wasRunning.current && !running && status) {
      const tags = (shots || []).flatMap((s) => [
        { type: "CreatorHomeProjects", id: `lighting-plan-${s.id}` },
        { type: "CreatorHomeProjects", id: `camera-plan-${s.id}` },
        { type: "CreatorHomeProjects", id: `shot-images-${s.id}` },
      ]);
      tags.push({ type: "CreatorHomeProjects", id: "shot-asset-completion" });
      if (tags.length) dispatch(creatorApi.util.invalidateTags(tags));
      dispatch(showFlash({
        message: status.errorCount > 0
          ? `Done — ${status.errorCount} step${status.errorCount === 1 ? "" : "s"} had issues, regenerate those individually below`
          : "All shot assets generated",
        type: status.errorCount > 0 ? "warning" : "success",
      }));
    }
    wasRunning.current = running;
  }, [running, status, shots, dispatch]);

  const handleStart = async () => {
    try {
      await start(projectId).unwrap();
      refetch();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not start generation", type: "error" }));
    }
  };

  if (!shots?.length) return null;

  return (
    <div className="mb-4 rounded-lg border border-purple-400/20 bg-purple-500/[0.04] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold text-white">Generate all shot assets</p>
          <p className="text-[11px] font-medium text-slate-400">
            Lighting plan, camera plan, and all 4 images for every shot, one at a time.
          </p>
        </div>
        <button
          type="button"
          disabled={starting || running}
          onClick={handleStart}
          className="creator-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {starting || running ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {running ? "Generating…" : "Generate all"}
        </button>
      </div>

      {status && (running || status.status === "COMPLETED" || status.status === "FAILED") && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-purple-400 transition-all"
              style={{ width: `${status.totalShots ? Math.round((status.completedShots / status.totalShots) * 100) : 0}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            {status.status === "FAILED" ? (
              <AlertTriangle size={12} className="shrink-0 text-rose-400" />
            ) : status.status === "COMPLETED" ? (
              <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
            ) : (
              <Loader2 size={12} className="shrink-0 animate-spin text-purple-300" />
            )}
            <span>
              {status.status === "FAILED"
                ? status.lastError || "Generation stopped unexpectedly"
                : `${status.completedShots} of ${status.totalShots} shots — ${status.currentStepLabel || "starting…"}`}
              {status.errorCount > 0 && status.status !== "FAILED" && ` (${status.errorCount} issue${status.errorCount === 1 ? "" : "s"})`}
            </span>
          </div>
        </div>
      )}

      {status?.errorCount > 0 && <ShotAssetDeadLetters projectId={projectId} shots={shots} />}
    </div>
  );
}
