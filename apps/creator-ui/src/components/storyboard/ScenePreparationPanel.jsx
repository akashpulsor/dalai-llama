// @ts-nocheck
import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Edit3, FileText, Loader2, Save, Sparkles, X } from "lucide-react";
import {
  useGetProjectScenePreparationQuery,
  usePrepareProjectSceneMutation,
  usePrepareShotSceneMutation,
  useLazyGetShotScenePromptQuery,
  useUpdateShotScenePromptMutation,
  useApproveVideoGenJobMutation,
} from "../../api/creatorEndpoints.js";

/**
 * Two-stage prepare-scene flow (video-generation-service PrepareSceneController):
 * 1. Project-level "Prepare Scene" button -- populates ProjectScenePreparation once per project.
 * 2. Per-shot "Prepare shot" -- assembles the ShotContext, saves an editable ShotPrompt.
 * User reviews/edits the prompt, then dispatches via approve on the returned job id.
 *
 * Deliberately self-contained -- doesn't touch ScreenplayVideoGenerationPanel's existing per-shot
 * generate flow. Both can coexist: a creator can still hit the old "Generate" per shot if they
 * want the auto-assembled prompt dispatched immediately, or use this panel to review/edit first.
 */
export default function ScenePreparationPanel({ projectId, shots = [], activeShotId, onSelectShot, onClose }) {
  const {
    data: preparation,
    isFetching: preparationLoading,
    error: preparationError,
    refetch: refetchPreparation,
  } = useGetProjectScenePreparationQuery(projectId, { skip: !projectId });
  const [prepareProject, prepareProjectState] = usePrepareProjectSceneMutation();
  const [prepareShot, prepareShotState] = usePrepareShotSceneMutation();
  const [triggerGetPrompt] = useLazyGetShotScenePromptQuery();
  const [updatePrompt, updatePromptState] = useUpdateShotScenePromptMutation();
  const [approveJob, approveJobState] = useApproveVideoGenJobMutation();

  const [preparedPrompt, setPreparedPrompt] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [flashError, setFlashError] = useState(null);
  // Blank = provider default (Seedance 720p, Wan 480p) -- see video-generation-service's
  // VideoResolution for why only these two tiers are offered (no model registered today honors
  // 1080p, so it isn't in the list).
  const [resolutionOverride, setResolutionOverride] = useState("");

  useEffect(() => {
    setPreparedPrompt(null);
    setEditing(false);
    setEditedText("");
    setFlashError(null);
  }, [activeShotId]);

  const projectPrepared = Boolean(preparation?.templateText);
  const projectHas404 = preparationError?.status === 404;

  const handlePrepareProject = async () => {
    setFlashError(null);
    try {
      await prepareProject(projectId).unwrap();
      refetchPreparation();
    } catch (error) {
      setFlashError(error?.data?.message || "Could not prepare project scene.");
    }
  };

  const handlePrepareShot = async () => {
    if (!activeShotId) return;
    setFlashError(null);
    try {
      const prompt = await prepareShot({
        projectId,
        shotId: activeShotId,
        resolutionOverride: resolutionOverride || undefined,
      }).unwrap();
      setPreparedPrompt(prompt);
      setEditedText(prompt.promptCompressed || prompt.promptOriginal || "");
      setEditing(false);
    } catch (error) {
      setFlashError(error?.data?.message || "Could not prepare this shot.");
    }
  };

  const handleSaveEdit = async () => {
    if (!preparedPrompt?.promptId) return;
    setFlashError(null);
    try {
      const updated = await updatePrompt({ promptId: preparedPrompt.promptId, positive: editedText }).unwrap();
      setPreparedPrompt(updated);
      setEditing(false);
      const fresh = await triggerGetPrompt(updated.promptId).unwrap();
      setPreparedPrompt(fresh);
    } catch (error) {
      setFlashError(error?.data?.message || "Could not save the edit.");
    }
  };

  const handleGenerate = async () => {
    if (!preparedPrompt?.jobId) return;
    setFlashError(null);
    try {
      await approveJob(preparedPrompt.jobId).unwrap();
      const fresh = await triggerGetPrompt(preparedPrompt.promptId).unwrap();
      setPreparedPrompt(fresh);
    } catch (error) {
      setFlashError(error?.data?.message || "Dispatch failed.");
    }
  };

  const activeShot = shots.find((s) => String(s.id) === String(activeShotId));
  const preparingProject = prepareProjectState.isLoading;
  const preparingShot = prepareShotState.isLoading;
  const saving = updatePromptState.isLoading;
  const dispatching = approveJobState.isLoading;
  const promptBody = editing ? editedText : (preparedPrompt?.promptCompressed || preparedPrompt?.promptOriginal || "");
  const disableGenerate = !preparedPrompt?.jobId || dispatching || editing;

  return (
    <div className="creator-panel space-y-5 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-normal text-purple-200">Prepare Scene</p>
          <h2 className="mt-1 text-lg font-black text-white">Assemble &amp; edit shot prompts</h2>
          <p className="mt-1 max-w-lg text-xs font-semibold leading-5 text-slate-400">
            Pulls the project's continuity bible, cast, plans, and images from pre-production; assembles the shot
            context; and saves an editable prompt you can review before dispatching.
          </p>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="creator-control h-8 w-8 rounded-lg text-slate-300">
            <X size={14} />
          </button>
        ) : null}
      </header>

      <section className="rounded-lg border border-white/10 bg-black/25 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-slate-400">Step 1 &middot; Project scope</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {preparationLoading
                ? "Checking whether this project has been prepared…"
                : projectPrepared
                ? `Prepared on ${new Date(preparation.preparedAt).toLocaleString()}`
                : "Not prepared yet — do this once per project."}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrepareProject}
            disabled={preparingProject}
            className="creator-primary flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-white disabled:opacity-55"
          >
            {preparingProject ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {projectPrepared ? "Re-prepare project" : "Prepare project"}
          </button>
        </div>
        {projectPrepared && (
          <details className="mt-3">
            <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-300">
              View project template ({preparation.templateText.length} chars)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded border border-white/10 bg-black/40 p-3 text-[11px] font-medium text-slate-300">
              {preparation.templateText}
            </pre>
          </details>
        )}
        {projectHas404 && !projectPrepared && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
            <AlertTriangle size={12} /> This project has never been prepared; nothing to load.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-black/25 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-slate-400">Step 2 &middot; This shot</p>
            {activeShot ? (
              <p className="mt-1 truncate text-sm font-bold text-slate-100">
                Shot {activeShot.shotNumber || "?"} — {activeShot.shotRef || activeShot.title || activeShot.id}
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-slate-500">Select a shot on the left to prepare.</p>
            )}
            {activeShot?.scriptLine ? (
              <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-500">{activeShot.scriptLine}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Resolution</span>
              <select
                value={resolutionOverride}
                onChange={(event) => setResolutionOverride(event.target.value)}
                disabled={preparingShot}
                className="h-9 rounded-lg border border-white/10 bg-black/40 px-2 text-xs font-bold text-slate-100 focus:border-purple-400/60 focus:outline-none disabled:opacity-60"
              >
                <option value="" className="bg-slate-950 text-slate-100">Default (cheapest)</option>
                <option value="480p" className="bg-slate-950 text-slate-100">480p</option>
                <option value="720p" className="bg-slate-950 text-slate-100">720p</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handlePrepareShot}
              disabled={!activeShotId || !projectPrepared || preparingShot}
              className="creator-primary flex min-h-9 shrink-0 items-center gap-1.5 px-3 text-xs font-black text-white disabled:opacity-55"
            >
              {preparingShot ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {preparedPrompt ? "Re-prepare shot" : "Prepare shot"}
            </button>
          </div>
        </div>

        {shots.length > 0 && !activeShotId && (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2 md:grid-cols-3">
            {shots.slice(0, 12).map((shot) => (
              <button
                key={shot.id}
                type="button"
                onClick={() => onSelectShot?.(shot.id)}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left text-[11px] font-bold text-slate-200 hover:border-purple-300/40 hover:bg-white/[0.06]"
              >
                <span className="truncate">Shot {shot.shotNumber || "?"}</span>
                <ChevronRight size={12} className="text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </section>

      {preparedPrompt && (
        <section className="rounded-lg border border-purple-300/25 bg-purple-400/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-purple-200">Prepared prompt</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                {preparedPrompt.compressionApplied ? "Compressed to fit model limit" : "Within limit, no compression"}
                {preparedPrompt.parentPromptId ? " · edited version" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setEditedText(preparedPrompt.promptOriginal || ""); }}
                    className="creator-control flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving || !editedText?.trim()}
                    className="creator-primary flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-white disabled:opacity-55"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save edit
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="creator-control flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-slate-200"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={disableGenerate}
                    className="creator-primary flex min-h-9 items-center gap-1.5 px-3 text-xs font-black text-white disabled:opacity-55"
                  >
                    {dispatching ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Generate
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <textarea
              value={editedText}
              onChange={(event) => setEditedText(event.target.value)}
              rows={10}
              className="creator-input mt-3 w-full resize-y whitespace-pre-wrap font-mono text-xs leading-5"
            />
          ) : (
            <pre className="mt-3 whitespace-pre-wrap rounded border border-white/10 bg-black/40 p-3 text-[11px] font-medium leading-5 text-slate-100">
              {promptBody || "(empty)"}
            </pre>
          )}

          {preparedPrompt.negativePrompt ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-300">
                Negative prompt
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-white/10 bg-black/40 p-3 text-[11px] font-medium text-slate-400">
                {preparedPrompt.negativePrompt}
              </pre>
            </details>
          ) : null}

          {(preparedPrompt.referenceImageUrls || []).length ? (
            <div className="mt-3">
              <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">References</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {preparedPrompt.referenceImageUrls.map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt="reference" className="h-16 w-full rounded border border-white/10 object-cover" />
                ))}
              </div>
            </div>
          ) : null}

          {preparedPrompt.jobStatus ? (
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              Job status: <span className="text-slate-200">{preparedPrompt.jobStatus}</span>
              {preparedPrompt.approvalStatus ? ` · ${preparedPrompt.approvalStatus}` : ""}
            </p>
          ) : null}
        </section>
      )}

      {flashError ? (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle size={12} /> {flashError}
        </p>
      ) : null}
    </div>
  );
}
