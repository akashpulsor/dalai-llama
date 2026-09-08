// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Film, FileDown, Loader2, Plus, RefreshCw, Save, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCreatePreProductionShotMutation,
  useExportShotsPdfMutation,
  useGeneratePreProductionShotListMutation,
  useGetAnimatedPreviewHtmlMutation,
  useGetPreProductionShotListJobQuery,
  useListPreProductionShotsQuery,
  useListShotAssetCompletionQuery,
  useListShotPlanIssuesQuery,
  useReanalyzePreProductionShotImagesForProjectMutation,
  useUpdatePreProductionShotMutation,
} from "../../api/creatorEndpoints.js";
import ShotImagesPanel from "./ShotImagesPanel.jsx";
import ShotProductReferencePanel from "./ShotProductReferencePanel.jsx";
import LightingCameraPlanPanel from "./LightingCameraPlanPanel.jsx";
import ShotAssetBatchPanel from "./ShotAssetBatchPanel.jsx";

/** Shots, the stage after Cast: one shot list per project (destructive regenerate, no versioning
 * yet -- same as Script), each shot expandable into its 4 image kinds plus an optional per-shot
 * product/subject reference. */
/** Renders only the fields that actually have a value -- most shots won't have all ~26 of these
 * filled in, and an empty group (or a group full of blank rows) is worse than no group at all. */
function FieldGroup({ title, fields }) {
  const visible = fields.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!visible.length) return null;
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2.5">
      <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-wide text-purple-300">{title}</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {visible.map(([label, value]) => (
          <p key={label} className="text-[11px] font-medium leading-4 text-slate-400">
            {label}: <span className="text-slate-200">{String(value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

const SHOT_SIZE_OPTIONS = [
  { value: "", label: "—" },
  { value: "EWS", label: "EWS (extreme wide)" },
  { value: "VWS", label: "VWS (very wide)" },
  { value: "WS", label: "WS (wide)" },
  { value: "MWS", label: "MWS (medium-wide)" },
  { value: "MS", label: "MS (medium)" },
  { value: "MCU", label: "MCU (medium close-up)" },
  { value: "CU", label: "CU (close-up)" },
  { value: "ECU", label: "ECU (extreme close-up)" },
  { value: "INSERT", label: "INSERT" },
  { value: "OTS", label: "OTS (over-the-shoulder)" },
];
const MOOD_OPTIONS = [
  { value: "", label: "—" },
  { value: "HIGH_KEY", label: "High key (bright, even)" },
  { value: "LOW_KEY", label: "Low key (dark, contrasty)" },
  { value: "CHIAROSCURO", label: "Chiaroscuro (deep shadows)" },
  { value: "SOFT", label: "Soft (diffused)" },
];
const TIME_OF_DAY_OPTIONS = [
  { value: "", label: "—" },
  { value: "DAWN", label: "Dawn" },
  { value: "GOLDEN_HOUR", label: "Golden hour" },
  { value: "MIDDAY", label: "Midday" },
  { value: "BLUE_HOUR", label: "Blue hour" },
  { value: "MAGIC_HOUR", label: "Magic hour" },
  { value: "NIGHT", label: "Night" },
];

/** Hand-edit a shot's plan -- same "generated, then fix by hand" pattern the lighting/camera
 * plan editors already use. Every field is PATCH-optional server-side, so an untouched field is
 * sent as undefined and left alone. Deep cinematography (cine_*) still lives in the Lighting/
 * Camera plan editors below; this covers the practical shot-plan surface a creator reaches for
 * when the AI-generated draft got something wrong. */
function EditShotFields({ shot, onSave, saving }) {
  const initial = React.useMemo(() => ({
    scriptLine: shot.scriptLine || "",
    durationSeconds: shot.durationSeconds ?? "",
    action: shot.action || "",
    voiceOver: shot.voiceOver || "",
    emotion: shot.emotion || "",
    textOverlay: shot.textOverlay || "",
    soundDesign: shot.soundDesign || "",
    editingNotes: shot.editingNotes || "",
    location: shot.location || "",
    timeOfDay: shot.timeOfDay || "",
    lightingMood: shot.lightingMood || "",
    cameraShotSize: shot.cameraShotSize || "",
    cameraAngle: shot.cameraAngle || "",
    cameraMovement: shot.cameraMovement || "",
    cameraNote: shot.cameraNote || "",
  }), [shot]);
  const [draft, setDraft] = useState(initial);
  React.useEffect(() => { setDraft(initial); }, [initial]);

  const dirty = Object.keys(initial).some((key) => String(draft[key] ?? "") !== String(initial[key] ?? ""));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    const payload = {};
    Object.keys(initial).forEach((key) => {
      if (String(draft[key] ?? "") !== String(initial[key] ?? "")) {
        if (key === "durationSeconds") {
          payload[key] = draft[key] === "" ? undefined : Number(draft[key]);
        } else {
          payload[key] = draft[key] === "" ? null : draft[key];
        }
      }
    });
    onSave(payload);
  };

  const label = "mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500";
  const field = "creator-input w-full text-[11px] font-medium";

  return (
    <div className="rounded-md border border-purple-400/20 bg-purple-500/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] font-extrabold uppercase tracking-wide text-purple-300">Shot plan — hand-edit</p>
        <button
          type="button"
          onClick={submit}
          disabled={!dirty || saving}
          className="creator-primary flex h-7 items-center gap-1.5 px-2.5 text-[10px] font-black text-white disabled:opacity-55"
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
        </button>
      </div>

      <div className="mb-2">
        <label className={label}>Script line</label>
        <textarea rows={2} value={draft.scriptLine} onChange={(e) => set({ scriptLine: e.target.value })}
                  placeholder="What's said or shown in this shot" className={`${field} resize-y`} />
      </div>

      <div className="mb-2 grid gap-2 sm:grid-cols-4">
        <div>
          <label className={label}>Duration (s)</label>
          <input type="number" min={1} value={draft.durationSeconds}
                 onChange={(e) => set({ durationSeconds: e.target.value })} className={field} />
        </div>
        <div>
          <label className={label}>Shot size</label>
          <select value={draft.cameraShotSize} onChange={(e) => set({ cameraShotSize: e.target.value })} className={field}>
            {SHOT_SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Lighting mood</label>
          <select value={draft.lightingMood} onChange={(e) => set({ lightingMood: e.target.value })} className={field}>
            {MOOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Time of day</label>
          <select value={draft.timeOfDay} onChange={(e) => set({ timeOfDay: e.target.value })} className={field}>
            {TIME_OF_DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-2 grid gap-2 sm:grid-cols-2">
        <div>
          <label className={label}>Action (what happens on screen)</label>
          <textarea rows={2} value={draft.action} onChange={(e) => set({ action: e.target.value })} className={`${field} resize-y`} />
        </div>
        <div>
          <label className={label}>Voice-over (what's spoken)</label>
          <textarea rows={2} value={draft.voiceOver} onChange={(e) => set({ voiceOver: e.target.value })} className={`${field} resize-y`} />
        </div>
      </div>

      <div className="mb-2 grid gap-2 sm:grid-cols-2">
        <div>
          <label className={label}>Location</label>
          <input value={draft.location} onChange={(e) => set({ location: e.target.value })} className={field} />
        </div>
        <div>
          <label className={label}>Emotion / delivery</label>
          <input value={draft.emotion} onChange={(e) => set({ emotion: e.target.value })}
                 placeholder="e.g. warm, confident, playful" className={field} />
        </div>
      </div>

      <div className="mb-2 grid gap-2 sm:grid-cols-3">
        <div>
          <label className={label}>Camera angle</label>
          <input value={draft.cameraAngle} onChange={(e) => set({ cameraAngle: e.target.value })}
                 placeholder="eye-level, low, high…" className={field} />
        </div>
        <div>
          <label className={label}>Camera movement</label>
          <input value={draft.cameraMovement} onChange={(e) => set({ cameraMovement: e.target.value })}
                 placeholder="static, dolly-in, whip pan…" className={field} />
        </div>
        <div>
          <label className={label}>Camera note</label>
          <input value={draft.cameraNote} onChange={(e) => set({ cameraNote: e.target.value })} className={field} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className={label}>On-screen text</label>
          <textarea rows={2} value={draft.textOverlay} onChange={(e) => set({ textOverlay: e.target.value })} className={`${field} resize-y`} />
        </div>
        <div>
          <label className={label}>Sound design</label>
          <textarea rows={2} value={draft.soundDesign} onChange={(e) => set({ soundDesign: e.target.value })} className={`${field} resize-y`} />
        </div>
        <div>
          <label className={label}>Editing notes</label>
          <textarea rows={2} value={draft.editingNotes} onChange={(e) => set({ editingNotes: e.target.value })} className={`${field} resize-y`} />
        </div>
      </div>
    </div>
  );
}

export default function ShotsSection({ projectId }) {
  const dispatch = useDispatch();
  const [openShotId, setOpenShotId] = useState(null);

  const [showIssues, setShowIssues] = useState(false);
  const { data: shots = [], isLoading, refetch: refetchShots } = useListPreProductionShotsQuery(projectId, { skip: !projectId });
  const { data: issues = [] } = useListShotPlanIssuesQuery(projectId, { skip: !projectId });
  const { data: completion = [] } = useListShotAssetCompletionQuery(projectId, { skip: !projectId });
  const [reanalyzeMissing] = useReanalyzePreProductionShotImagesForProjectMutation();
  // One-shot per project mount: proactively backfill on_screen_text on every legacy image at once,
  // so a creator visiting a project locked before the on_screen_text feature shipped doesn't have
  // to open each tile individually to unlock its Download button. Server-side skips any image
  // whose field is already set, so re-runs are cheap; the sessionStorage guard prevents this
  // from re-firing on every tab back-and-forth in the same browser session.
  useEffect(() => {
    if (!projectId) return;
    const guardKey = `reanalyze-missing-fired-${projectId}`;
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem(guardKey)) return;
        sessionStorage.setItem(guardKey, "1");
      } catch (_) { /* ignore private-mode / disabled storage */ }
    }
    reanalyzeMissing(projectId).unwrap().catch(() => {});
  }, [projectId, reanalyzeMissing]);
  const completeShotIds = new Set(completion.filter((c) => c.complete).map((c) => c.shotId));
  const [generateList, { isLoading: submitting }] = useGeneratePreProductionShotListMutation();

  // Async job pattern: submitting only kicks off the LLM call on llm-gateway's Kafka worker;
  // we poll this until it reaches SUCCEEDED (then refetch the shot list itself, which is what
  // the user actually cares about) or FAILED (show the error). Polling is skipped once we have
  // no active job id or the job is already terminal, so no polling happens at rest.
  const [activeJobId, setActiveJobId] = useState(null);
  const { data: shotListJob } = useGetPreProductionShotListJobQuery(
    { projectId, jobId: activeJobId },
    { skip: !projectId || !activeJobId, pollingInterval: 3000 },
  );
  const generating = submitting || (!!activeJobId && shotListJob?.status === "PENDING");

  useEffect(() => {
    if (!shotListJob) return;
    if (shotListJob.status === "SUCCEEDED") {
      refetchShots();
      dispatch(showFlash({ message: "Shot list ready", type: "success" }));
      setActiveJobId(null);
    } else if (shotListJob.status === "FAILED") {
      dispatch(showFlash({
        message: shotListJob.errorMessage || "Shot list generation failed", type: "error",
      }));
      setActiveJobId(null);
    }
  }, [shotListJob, dispatch, refetchShots]);
  const [exportPdf, { isLoading: exporting }] = useExportShotsPdfMutation();
  const [getAnimatedPreview, { isLoading: loadingPreview }] = useGetAnimatedPreviewHtmlMutation();
  const [createShot, { isLoading: creatingShot }] = useCreatePreProductionShotMutation();
  const [updateShot, { isLoading: updatingShot }] = useUpdatePreProductionShotMutation();

  const [addingShot, setAddingShot] = useState(false);
  const [newScriptLine, setNewScriptLine] = useState("");
  const [newDurationSeconds, setNewDurationSeconds] = useState("4");
  // New shots need an existing screenplay scene to belong to -- default to the same scene the
  // last shot in the list is already in, since "add one more shot" almost always means "one more
  // beat in the scene I'm already looking at", not a brand new scene (creating one of those is a
  // separate, screenplay-level action, not a shot-level one).
  const lastScreenplaySceneId = shots.length ? shots[shots.length - 1].screenplaySceneId : null;

  const handleGenerate = async () => {
    try {
      const job = await generateList(projectId).unwrap();
      setActiveJobId(job.jobId);
      dispatch(showFlash({
        message: shots.length ? "Regenerating shot list…" : "Generating shot list…",
        type: "info",
      }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not submit shot list generation", type: "error" }));
    }
  };

  const handleExportPdf = async () => {
    try {
      const result = await exportPdf(projectId).unwrap();
      window.open(result.signedUrl, "_blank");
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not export the PDF", type: "error" }));
    }
  };

  const handleAnimatedPreview = async () => {
    try {
      const html = await getAnimatedPreview(projectId).unwrap();
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not build the preview", type: "error" }));
    }
  };

  const handleAddShot = async () => {
    if (!lastScreenplaySceneId) return;
    try {
      await createShot({
        projectId,
        screenplaySceneId: lastScreenplaySceneId,
        scriptLine: newScriptLine || undefined,
        durationSeconds: newDurationSeconds === "" ? undefined : Number(newDurationSeconds),
      }).unwrap();
      dispatch(showFlash({ message: "Shot added", type: "success" }));
      setAddingShot(false);
      setNewScriptLine("");
      setNewDurationSeconds("4");
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not add the shot", type: "error" }));
    }
  };

  const handleUpdateShot = async (shotId, patch) => {
    try {
      await updateShot({ projectId, shotId, ...patch }).unwrap();
      dispatch(showFlash({ message: "Shot updated", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not update the shot", type: "error" }));
    }
  };

  if (isLoading) return null;

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Shots</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Regenerating replaces the shot list — there's no version history yet, same as the script.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {shots.length > 0 && (
            <>
              <button
                type="button"
                disabled={loadingPreview}
                onClick={handleAnimatedPreview}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-purple-400/30 disabled:opacity-60"
              >
                {loadingPreview ? <Loader2 size={13} className="animate-spin" /> : <Film size={13} />}
                Animated preview
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-purple-400/30 disabled:opacity-60"
              >
                {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                Export PDF
              </button>
            </>
          )}
          {shots.length > 0 && (
            <button
              type="button"
              onClick={() => setAddingShot((open) => !open)}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-purple-400/30"
            >
              <Plus size={13} />
              Add shot
            </button>
          )}
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {shots.length ? <RefreshCw size={13} /> : <Sparkles size={13} />}
            {generating ? "Generating…" : shots.length ? "Regenerate shot list" : "Generate shot list"}
          </button>
        </div>
      </div>

      {shots.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/10 py-8 text-center text-xs font-medium text-slate-500">
          No shots yet — generate the shot list from the screenplay above.
        </p>
      )}

      {addingShot && (
        <div className="mb-3 rounded-lg border border-purple-400/25 bg-purple-500/[0.05] p-3">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-purple-300">
            New shot — added to the same scene as the last shot below
          </p>
          <textarea
            value={newScriptLine}
            onChange={(event) => setNewScriptLine(event.target.value)}
            rows={2}
            placeholder="Script line for this shot"
            className="creator-input w-full resize-y text-xs"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={newDurationSeconds}
              onChange={(event) => setNewDurationSeconds(event.target.value)}
              className="creator-input h-8 w-20 text-xs"
            />
            <span className="text-[10px] font-bold text-slate-500">seconds</span>
            <button
              type="button"
              onClick={handleAddShot}
              disabled={creatingShot || !lastScreenplaySceneId}
              className="creator-primary ml-auto flex h-8 items-center gap-1.5 px-3 text-[11px] font-black text-white disabled:opacity-55"
            >
              {creatingShot ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add shot
            </button>
          </div>
        </div>
      )}

      <ShotAssetBatchPanel projectId={projectId} shots={shots} />

      {issues.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.04] p-3">
          <button type="button" onClick={() => setShowIssues((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
              <AlertTriangle size={12} />
              {issues.length} shot plan issue{issues.length > 1 ? "s" : ""} found
            </span>
            {showIssues ? <ChevronUp size={13} className="text-amber-300" /> : <ChevronDown size={13} className="text-amber-300" />}
          </button>
          {showIssues && (
            <div className="mt-2.5 space-y-1.5">
              {issues.map((issue, i) => (
                <p key={i} className="text-[11px] font-medium text-amber-200/90">
                  <span className="font-bold">{issue.shotRef}</span> — {issue.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {shots.map((shot) => {
          const isOpen = openShotId === shot.id;
          return (
            <div key={shot.id} className="rounded-lg border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setOpenShotId(isOpen ? null : shot.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {shot.cast?.castFaceImageUrl && (
                    <img
                      src={shot.cast.castFaceImageUrl}
                      alt={shot.cast.castDisplayName}
                      className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
                      title={`${shot.cast.characterName} — ${shot.cast.castDisplayName}`}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">
                      Shot {shot.shotNumber} <span className="ml-1.5 font-medium text-slate-500">{shot.shotType}</span>
                      {completeShotIds.has(shot.id) && (
                        <CheckCircle2 size={13} className="ml-1.5 inline-block shrink-0 align-text-bottom text-emerald-400" title="All assets generated" />
                      )}
                      {shot.productShotType && (
                        <span className="ml-1.5 rounded-full border border-purple-400/20 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-200">
                          {shot.productShotType}
                        </span>
                      )}
                      {shot.cast?.castDisplayName && (
                        <span className="ml-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-200">
                          {shot.cast.castDisplayName}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-400">{shot.scriptLine || shot.cameraNote}</p>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={15} className="shrink-0 text-slate-400" /> : <ChevronDown size={15} className="shrink-0 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-white/10 px-4 py-3.5">
                  {shot.cast && (
                    <div className="flex items-center gap-3 rounded-md border border-emerald-400/20 bg-emerald-500/[0.04] p-2.5">
                      {shot.cast.castFaceImageUrl ? (
                        <img src={shot.cast.castFaceImageUrl} alt="" className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-500">
                          {shot.cast.characterType === "NARRATOR" ? "VO" : "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">
                          {shot.cast.characterName}
                          <span className="ml-1.5 text-[10px] font-medium text-slate-500">
                            {shot.cast.characterType === "NARRATOR" ? "Narrator" : "Character"}
                          </span>
                        </p>
                        <p className="text-[11px] font-medium text-emerald-200">
                          {shot.cast.castDisplayName
                            ? `Cast: ${shot.cast.castDisplayName}${shot.cast.hasVoiceSample ? " · voice cloned" : ""}`
                            : "Not cast yet — assign in the Character tab"}
                        </p>
                      </div>
                    </div>
                  )}
                  <EditShotFields
                    shot={shot}
                    saving={updatingShot}
                    onSave={(patch) => handleUpdateShot(shot.id, patch)}
                  />
                  <FieldGroup
                    title="Direction"
                    fields={[
                      ["Action", shot.action],
                      ["Composition", shot.composition],
                      ["Retention goal", shot.retentionGoal],
                      ["Creator direction", shot.creatorDirection],
                      ["Director's note", shot.directorNote],
                      ["Editing notes", shot.editingNotes],
                    ]}
                  />
                  <FieldGroup
                    title="Performance"
                    fields={[
                      ["Expression", shot.expression],
                      ["Emotion", shot.emotion],
                      ["Body language", shot.bodyLanguage],
                      ["Voice over", shot.voiceOver],
                      ["Text overlay", shot.textOverlay],
                    ]}
                  />
                  <FieldGroup
                    title="Camera & lighting"
                    fields={[
                      ["Camera angle", shot.cameraAngle],
                      ["Camera movement", shot.cameraMovement],
                      ["Lens suggestion", shot.lensSuggestion],
                      ["FPS", shot.fps],
                      ["Lighting mood", shot.lightingMood],
                      ["Location", shot.location],
                      ["Time of day", shot.timeOfDay],
                    ]}
                  />
                  <FieldGroup
                    title="Production detail"
                    fields={[
                      ["Coverage", shot.coverageType],
                      ["Screen direction", shot.screenDirection],
                      ["People in frame", shot.peopleInFrame],
                      ["Shoot day", shot.shootDay],
                      ["Shoot block", shot.shootBlock],
                      ["Execution difficulty", shot.executionDifficulty],
                      ["Rookie guide", shot.rookieFriendlyGuide],
                      ["Cinematic execution", shot.cinematicExecution],
                      ["Cultural references", shot.culturalReferences],
                      ["Safe zone notes", shot.safeZoneNotes],
                      ["Mobile focus area", shot.mobileFocusArea],
                      ["Sound design", shot.soundDesign],
                      ["Sketch prompt", shot.sketchPrompt],
                    ]}
                  />
                  <ShotImagesPanel shotId={shot.id} shotRef={shot.shotRef} projectId={projectId} aspectRatio={shot.aspectRatio} shotType={shot.shotType} />
                  <LightingCameraPlanPanel shotId={shot.id} />
                  <ShotProductReferencePanel shotId={shot.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
