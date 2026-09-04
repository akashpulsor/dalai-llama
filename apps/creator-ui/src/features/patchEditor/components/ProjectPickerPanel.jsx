// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Clapperboard, Film, FolderOpen, Layers, Loader2 } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { isCompletedJobStatus, isFailedJobStatus, jobErrorMessage, sleep } from "../utils/jobStatus.js";
import {
  useGetAcceptedShotSequenceQuery,
  useGetPostProductionProjectsQuery,
  useGetShotTakesQuery,
  useLazyGetJobQuery,
  useListPreProductionProjectsQuery,
  useRenderAcceptedShotSequenceAsyncMutation,
} from "../../../api/creatorEndpoints.js";

const JOB_POLL_INTERVAL_MS = 2500;

// The second entry point into the editor (besides uploading a file): pull a project that
// already has generated video. The combined video is the creator-service "accepted shot
// sequence" (locally ffmpeg-stitched into one clip); individual shots are the per-shot takes.
//
// Only projects whose video generation has actually finished (pre-production-service's
// VIDEO_GENERATION_COMPLETE) are offered -- joined client-side against
// listPreProductionProjects (real project status) since this panel's own project list is
// keyed differently (scriptId) and doesn't carry status itself. Arriving here via the "Move
// to Post-Production" CTA (PlannerPage) passes the project id in route state, so it's
// auto-selected instead of requiring a manual pick.
export default function ProjectPickerPanel() {
  const { actions } = usePatchEditor();
  const location = useLocation();
  const { data: allProjects = [], isLoading: projectsLoading } = useGetPostProductionProjectsQuery();
  const { data: preProductionProjects = [] } = useListPreProductionProjectsQuery();
  const [scriptId, setScriptId] = useState("");
  const [stitching, setStitching] = useState(false);
  const [stitchError, setStitchError] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(null);

  const videoGeneratedProjectIds = useMemo(
    () => new Set(
      preProductionProjects
        .filter((project) => project.status === "VIDEO_GENERATION_COMPLETE")
        .map((project) => String(project.id))
    ),
    [preProductionProjects]
  );
  const projects = useMemo(
    () => allProjects.filter((project) => videoGeneratedProjectIds.has(String(project.projectId))),
    [allProjects, videoGeneratedProjectIds]
  );

  const incomingProjectId = location.state?.projectId;
  useEffect(() => {
    if (!incomingProjectId || scriptId || !projects.length) return;
    const match = projects.find((project) => String(project.projectId) === String(incomingProjectId));
    if (match) setScriptId(match.scriptId);
  }, [incomingProjectId, scriptId, projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.scriptId === scriptId) || null,
    [projects, scriptId]
  );

  const { data: sequence, refetch: refetchSequence, isFetching: sequenceLoading } =
    useGetAcceptedShotSequenceQuery({ scriptId }, { skip: !scriptId });
  const { data: takes = [], isFetching: takesLoading } = useGetShotTakesQuery({ scriptId }, { skip: !scriptId });
  const [renderSequence] = useRenderAcceptedShotSequenceAsyncMutation();
  const [triggerGetJob] = useLazyGetJobQuery();

  const combinedUrl = sequence?.url || "";
  const sequenceStatus = sequence?.status || "";
  const acceptedTakeCount = sequence?.acceptedTakeCount || 0;
  const shotClips = useMemo(() => (takes || []).filter((take) => take?.assetUrl), [takes]);

  const load = async (url, name) => {
    if (!url || loadingUrl) return;
    setLoadingUrl(url);
    try {
      await actions.loadSourceFromUrl(url, name);
    } finally {
      setLoadingUrl(null);
    }
  };

  const handleStitch = async () => {
    if (!scriptId || stitching) return;
    setStitchError(null);
    setStitching(true);
    try {
      const job = await renderSequence({ scriptId }).unwrap();
      const jobId = job?.jobId || job?.id;
      if (!jobId) throw new Error("Backend did not return a job id.");
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const polled = await triggerGetJob(jobId).unwrap();
        const status = polled?.status;
        if (isFailedJobStatus(status)) throw new Error(jobErrorMessage(polled) || "Stitching failed.");
        if (isCompletedJobStatus(status)) break;
        // eslint-disable-next-line no-await-in-loop
        await sleep(JOB_POLL_INTERVAL_MS);
      }
      const refreshed = await refetchSequence().unwrap();
      const url = refreshed?.url;
      if (!url) throw new Error("Stitched, but no combined video was returned.");
      await load(url, `${selectedProject?.title || "project"}-combined.mp4`);
    } catch (error) {
      setStitchError(error.message || "Could not stitch the accepted shots.");
    } finally {
      setStitching(false);
    }
  };

  return (
    <div className="creator-panel p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-400/15 text-purple-200">
          <FolderOpen size={16} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Pull a project</p>
          <p className="text-sm font-bold text-white">Edit or dub a video you've already generated</p>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Project</span>
        <select
          value={scriptId}
          onChange={(event) => {
            setScriptId(event.target.value);
            setStitchError(null);
          }}
          disabled={projectsLoading}
          className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 text-sm font-bold text-slate-100 focus:border-purple-400/60 focus:outline-none disabled:opacity-60"
        >
          <option value="" className="bg-slate-950 text-slate-100">
            {projectsLoading ? "Loading projects…" : projects.length ? "Select a project…" : "No projects with finished video yet"}
          </option>
          {projects.map((project) => (
            <option key={project.scriptId} value={project.scriptId} className="bg-slate-950 text-slate-100">
              {project.title}
              {project.shotCount ? ` · ${project.shotCount} shots` : ""}
            </option>
          ))}
        </select>
      </label>

      {scriptId && (
        <div className="mt-4 space-y-4">
          {/* COMBINED VIDEO */}
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-normal text-slate-400">
              <Layers size={13} className="text-purple-300" /> Combined video
            </p>
            {sequenceLoading ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Loader2 size={12} className="animate-spin" /> Checking…
              </p>
            ) : combinedUrl ? (
              <button
                type="button"
                onClick={() => load(combinedUrl, `${selectedProject?.title || "project"}-combined.mp4`)}
                disabled={!!loadingUrl}
                className="creator-primary mt-2 flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:opacity-55"
              >
                {loadingUrl === combinedUrl ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
                {loadingUrl === combinedUrl ? "Loading…" : "Load combined video into editor"}
              </button>
            ) : sequenceStatus === "PENDING_RENDER" || acceptedTakeCount > 0 ? (
              <div className="mt-2">
                <p className="mb-2 text-[11px] font-semibold text-slate-500">
                  {acceptedTakeCount} accepted shot{acceptedTakeCount === 1 ? "" : "s"} ready — stitch them into one video.
                </p>
                <button
                  type="button"
                  onClick={handleStitch}
                  disabled={stitching}
                  className="creator-primary flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:opacity-55"
                >
                  {stitching ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                  {stitching ? "Stitching…" : "Stitch accepted shots into one video"}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] font-semibold text-slate-600">
                No combined video yet — accept some shot takes for this project first.
              </p>
            )}
            {stitchError && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
                <AlertTriangle size={12} /> {stitchError}
              </p>
            )}
          </div>

          {/* INDIVIDUAL SHOTS */}
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-normal text-slate-400">
              <Film size={13} className="text-sky-300" /> Individual shots
            </p>
            {takesLoading ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Loader2 size={12} className="animate-spin" /> Loading shots…
              </p>
            ) : shotClips.length ? (
              <div className="mt-2 grid gap-1.5">
                {shotClips.map((take) => (
                  <button
                    key={take.takeId}
                    type="button"
                    onClick={() => load(take.assetUrl, `${selectedProject?.title || "project"}-shot-${take.shotNumber}.mp4`)}
                    disabled={!!loadingUrl}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs font-bold text-slate-200 hover:border-sky-300/40 hover:bg-white/[0.05] disabled:opacity-55"
                  >
                    <span className="flex items-center gap-2">
                      <Film size={13} className="text-slate-400" />
                      Shot {take.shotNumber}
                      {take.reviewStatus ? (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-400">
                          {take.reviewStatus}
                        </span>
                      ) : null}
                    </span>
                    {loadingUrl === take.assetUrl ? (
                      <Loader2 size={13} className="animate-spin text-sky-300" />
                    ) : (
                      <span className="text-[10px] font-black uppercase text-sky-300">Load</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[11px] font-semibold text-slate-600">No generated shot clips for this project yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
