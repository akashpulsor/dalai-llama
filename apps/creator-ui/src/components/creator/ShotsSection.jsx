// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Film, FileDown, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useExportShotsPdfMutation,
  useGeneratePreProductionShotListMutation,
  useGetAnimatedPreviewHtmlMutation,
  useListPreProductionShotsQuery,
  useListShotAssetCompletionQuery,
  useListShotPlanIssuesQuery,
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

export default function ShotsSection({ projectId }) {
  const dispatch = useDispatch();
  const [openShotId, setOpenShotId] = useState(null);

  const [showIssues, setShowIssues] = useState(false);
  const { data: shots = [], isLoading } = useListPreProductionShotsQuery(projectId, { skip: !projectId });
  const { data: issues = [] } = useListShotPlanIssuesQuery(projectId, { skip: !projectId });
  const { data: completion = [] } = useListShotAssetCompletionQuery(projectId, { skip: !projectId });
  const completeShotIds = new Set(completion.filter((c) => c.complete).map((c) => c.shotId));
  const [generateList, { isLoading: generating }] = useGeneratePreProductionShotListMutation();
  const [exportPdf, { isLoading: exporting }] = useExportShotsPdfMutation();
  const [getAnimatedPreview, { isLoading: loadingPreview }] = useGetAnimatedPreviewHtmlMutation();

  const handleGenerate = async () => {
    try {
      await generateList(projectId).unwrap();
      dispatch(showFlash({ message: shots.length ? "Shot list regenerated" : "Shot list generated", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate the shot list", type: "error" }));
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
                  <ShotImagesPanel shotId={shot.id} aspectRatio={shot.aspectRatio} />
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
