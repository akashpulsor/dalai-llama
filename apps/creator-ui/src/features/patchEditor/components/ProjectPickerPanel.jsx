// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Clapperboard, Film, FolderOpen, Layers, Loader2 } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { sleep } from "../utils/jobStatus.js";
import {
  useCreateFinalRenderMutation,
  useGetLatestFinalRenderQuery,
  useListPreProductionProjectsQuery,
  useListProjectShotVideosQuery,
} from "../../../api/creatorEndpoints.js";

const RENDER_POLL_INTERVAL_MS = 2500;
const RENDER_POLL_MAX_ATTEMPTS = 240; // ~10 minutes, an ffmpeg concat of a long project

// The second entry point into the editor (besides uploading a file): pull a project that already
// has generated video. Everything here runs against the live pipeline -- pre-production-service
// for the project list, video-generation-service for the shots and the assembled cut. It used to
// call creator-service's /creator/storyboards/* routes for both, which have been unreachable since
// that service was decommissioned, so selecting a project produced an empty panel no matter how
// much finished video the project actually had.
//
// Both URL sources are presigned, which is the constraint that decided them: the editor loads a
// source with a plain fetch() that sends no Authorization header, so a 302-behind-JWT endpoint
// (like /v1/jobs/{id}/video) could not be used here.
export default function ProjectPickerPanel() {
  const { actions } = usePatchEditor();
  const location = useLocation();
  const { data: preProductionProjects = [], isLoading: projectsLoading } = useListPreProductionProjectsQuery();
  const [projectId, setProjectId] = useState("");
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(null);

  // Only a project that finished generating video has anything to edit, so the dropdown is the
  // creator's finished projects rather than everything they have ever started.
  const projects = useMemo(
    () => preProductionProjects
      .filter((project) => project.status === "VIDEO_GENERATION_COMPLETE")
      .map((project) => ({ projectId: String(project.id), title: project.name || "Creator project" })),
    [preProductionProjects]
  );

  const incomingProjectId = location.state?.projectId;
  useEffect(() => {
    if (!incomingProjectId || projectId || !projects.length) return;
    const match = projects.find((project) => project.projectId === String(incomingProjectId));
    if (match) setProjectId(match.projectId);
  }, [incomingProjectId, projectId, projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.projectId === projectId) || null,
    [projects, projectId]
  );

  const { data: finalRender, refetch: refetchFinalRender, isFetching: finalRenderLoading } =
    useGetLatestFinalRenderQuery(projectId, { skip: !projectId });
  const { data: shotVideos = [], isFetching: shotsLoading } =
    useListProjectShotVideosQuery(projectId, { skip: !projectId });
  const [createFinalRender] = useCreateFinalRenderMutation();

  const fullVideoUrl = finalRender?.videoUrl || "";
  const renderStatus = finalRender?.status || "";
  const playableShots = useMemo(() => shotVideos.filter((shot) => shot?.videoUrl), [shotVideos]);
  const projectLabel = selectedProject?.title || "project";

  const load = async (url, name) => {
    if (!url || loadingUrl) return;
    setLoadingUrl(url);
    try {
      await actions.loadSourceFromUrl(url, name);
    } finally {
      setLoadingUrl(null);
    }
  };

  /** Assembles every completed shot into one cut, then loads it. Fire-and-poll: createFinalRender
   * hands back a job straight away, so this watches the latest render until it carries a videoUrl
   * rather than holding a request open for the length of an ffmpeg concat. */
  const handleRender = async () => {
    if (!projectId || rendering) return;
    setRenderError(null);
    setRendering(true);
    try {
      await createFinalRender(projectId).unwrap();
      let url = "";
      for (let attempt = 0; attempt < RENDER_POLL_MAX_ATTEMPTS && !url; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(RENDER_POLL_INTERVAL_MS);
        // eslint-disable-next-line no-await-in-loop
        const latest = await refetchFinalRender().unwrap();
        if (latest?.status === "FAILED") throw new Error(latest?.lastError || "Assembling the video failed.");
        url = latest?.videoUrl || "";
      }
      if (!url) throw new Error("Still assembling — check back in a moment.");
      await load(url, `${projectLabel}-full.mp4`);
    } catch (error) {
      setRenderError(error.message || "Could not assemble the full video.");
    } finally {
      setRendering(false);
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
          <p className="text-sm font-bold text-white">Edit, upscale or dub a video you have already generated</p>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Project</span>
        <select
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            setRenderError(null);
          }}
          disabled={projectsLoading}
          className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 text-sm font-bold text-slate-100 focus:border-purple-400/60 focus:outline-none disabled:opacity-60"
        >
          <option value="" className="bg-slate-950 text-slate-100">
            {projectsLoading ? "Loading projects…" : projects.length ? "Select a project…" : "No projects with finished video yet"}
          </option>
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId} className="bg-slate-950 text-slate-100">
              {project.title}
            </option>
          ))}
        </select>
      </label>

      {projectId && (
        <div className="mt-4 space-y-4">
          {/* FULL VIDEO */}
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-normal text-slate-400">
              <Layers size={13} className="text-purple-300" /> Full video
            </p>
            {finalRenderLoading && !rendering ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Loader2 size={12} className="animate-spin" /> Checking…
              </p>
            ) : fullVideoUrl ? (
              <button
                type="button"
                onClick={() => load(fullVideoUrl, `${projectLabel}-full.mp4`)}
                disabled={!!loadingUrl}
                className="creator-primary mt-2 flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:opacity-55"
              >
                {loadingUrl === fullVideoUrl ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
                {loadingUrl === fullVideoUrl ? "Loading…" : "Load full video into editor"}
              </button>
            ) : playableShots.length ? (
              <div className="mt-2">
                <p className="mb-2 text-[11px] font-semibold text-slate-500">
                  {playableShots.length} generated shot{playableShots.length === 1 ? "" : "s"}
                  {renderStatus === "RUNNING" ? " — assembling…" : " — assemble them into one video."}
                </p>
                <button
                  type="button"
                  onClick={handleRender}
                  disabled={rendering}
                  className="creator-primary flex min-h-9 w-full items-center justify-center gap-2 text-xs font-black text-white disabled:opacity-55"
                >
                  {rendering ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                  {rendering ? "Assembling…" : "Assemble the full video"}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] font-semibold text-slate-600">
                No full video yet — generate some shots for this project first.
              </p>
            )}
            {renderError && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
                <AlertTriangle size={12} /> {renderError}
              </p>
            )}
          </div>

          {/* INDIVIDUAL SHOTS */}
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-normal text-slate-400">
              <Film size={13} className="text-sky-300" /> Individual shots
            </p>
            {shotsLoading ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Loader2 size={12} className="animate-spin" /> Loading shots…
              </p>
            ) : playableShots.length ? (
              <div className="mt-2 grid gap-1.5">
                {playableShots.map((shot) => (
                  <button
                    key={shot.jobId}
                    type="button"
                    onClick={() => load(shot.videoUrl, `${projectLabel}-${shot.shotRef || "shot"}.mp4`)}
                    disabled={!!loadingUrl}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs font-bold text-slate-200 hover:border-sky-300/40 hover:bg-white/[0.05] disabled:opacity-55"
                  >
                    <span className="flex items-center gap-2">
                      <Film size={13} className="text-slate-400" />
                      {shot.shotRef || "Shot"}
                      {shot.approvalStatus ? (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-400">
                          {shot.approvalStatus}
                        </span>
                      ) : null}
                    </span>
                    {loadingUrl === shot.videoUrl ? (
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
