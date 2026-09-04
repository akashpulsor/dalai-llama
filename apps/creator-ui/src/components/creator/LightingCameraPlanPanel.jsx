// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Camera, Loader2, Pencil, Save, Sparkles, Sun, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateCameraPlanMutation,
  useGenerateLightingPlanMutation,
  useGetCameraPlanQuery,
  useGetLightingPlanQuery,
  useSaveCameraPlanEditMutation,
  useSaveLightingPlanEditMutation,
} from "../../api/creatorEndpoints.js";

const FIELD = "block w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] font-medium text-slate-200";
const LABEL = "mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500";

/** Structured plans that feed the LIGHTING/CAMERA_PLAN shot images (see ShotImagePromptBuilder) --
 * generated automatically right after shot-list generation (with a critique retry, see
 * LightingPlanService/CameraPlanService), so "Plan"/"Replan" here is the fallback for whatever
 * that pass missed and the way to revise one after editing the shot, not the only way to get one.
 * Either plan can also be corrected by hand -- editing sets source to EDITED. */
export default function LightingCameraPlanPanel({ shotId }) {
  const dispatch = useDispatch();
  const { data: lighting, error: lightingError } = useGetLightingPlanQuery(shotId, { skip: !shotId });
  const { data: camera, error: cameraError } = useGetCameraPlanQuery(shotId, { skip: !shotId });
  const [generateLighting, { isLoading: generatingLighting }] = useGenerateLightingPlanMutation();
  const [generateCamera, { isLoading: generatingCamera }] = useGenerateCameraPlanMutation();
  const [saveLightingEdit, { isLoading: savingLighting }] = useSaveLightingPlanEditMutation();
  const [saveCameraEdit, { isLoading: savingCamera }] = useSaveCameraPlanEditMutation();
  const [editingLighting, setEditingLighting] = useState(false);
  const [editingCamera, setEditingCamera] = useState(false);
  const [lightingDraft, setLightingDraft] = useState(null);
  const [cameraDraft, setCameraDraft] = useState(null);

  const hasLighting = Boolean(lighting) && lightingError?.status !== 404;
  const hasCamera = Boolean(camera) && cameraError?.status !== 404;

  const handleGenerate = async (fn, label) => {
    try {
      await fn(shotId).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || `Could not plan the ${label}`, type: "error" }));
    }
  };

  const startEditLighting = () => {
    setLightingDraft({
      cinematicIntent: lighting.cinematicIntent || "",
      estimatedSetupMinutes: lighting.estimatedSetupMinutes || "",
      keyLightGear: lighting.keyLightGear || "",
      fillLightGear: lighting.fillLightGear || "",
      rimLightGear: lighting.rimLightGear || "",
      negFillGear: lighting.negFillGear || "",
      diffuserGear: lighting.diffuserGear || "",
      cameraRigGear: lighting.cameraRigGear || "",
      buildSteps: lighting.buildSteps || "",
    });
    setEditingLighting(true);
  };

  const saveLighting = async () => {
    try {
      await saveLightingEdit({
        shotId,
        ...lightingDraft,
        estimatedSetupMinutes: lightingDraft.estimatedSetupMinutes === "" ? null : Number(lightingDraft.estimatedSetupMinutes),
      }).unwrap();
      dispatch(showFlash({ message: "Lighting plan updated", type: "success" }));
      setEditingLighting(false);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the lighting plan", type: "error" }));
    }
  };

  const startEditCamera = () => {
    setCameraDraft({
      blockingMap: camera.blockingMap || "",
      executionSteps: camera.executionSteps || "",
      gimbalEnabled: Boolean(camera.gimbalEnabled),
      gimbalDevice: camera.gimbalDevice || "",
      gimbalMode: camera.gimbalMode || "",
      safetyFlags: camera.safetyFlags || "",
      complianceNote: camera.complianceNote || "",
    });
    setEditingCamera(true);
  };

  const saveCamera = async () => {
    try {
      await saveCameraEdit({ shotId, ...cameraDraft }).unwrap();
      dispatch(showFlash({ message: "Camera plan updated", type: "success" }));
      setEditingCamera(false);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the camera plan", type: "error" }));
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            <Sun size={11} />
            Lighting plan
            {hasLighting && lighting.source === "CRITIC" && (
              <span title={lighting.critiqueNotes} className="flex items-center gap-0.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-bold text-rose-300">
                <Sparkles size={8} />
                Critic-revised
              </span>
            )}
            {hasLighting && lighting.source === "EDITED" && (
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">Edited</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            {hasLighting && !editingLighting && (
              <button type="button" onClick={startEditLighting} className="rounded border border-white/10 p-1 text-slate-400 hover:border-purple-400/30 hover:text-slate-200">
                <Pencil size={10} />
              </button>
            )}
            <button
              type="button"
              disabled={generatingLighting}
              onClick={() => handleGenerate(generateLighting, "lighting")}
              className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-purple-400/30 disabled:opacity-60"
            >
              {generatingLighting && <Loader2 size={10} className="animate-spin" />}
              {hasLighting ? "Replan" : "Plan"}
            </button>
          </div>
        </div>

        {editingLighting ? (
          <div className="space-y-1.5">
            <div>
              <label className={LABEL}>Cinematic intent</label>
              <textarea rows={2} className={FIELD} value={lightingDraft.cinematicIntent} onChange={(e) => setLightingDraft((d) => ({ ...d, cinematicIntent: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={LABEL}>Key light</label>
                <input className={FIELD} value={lightingDraft.keyLightGear} onChange={(e) => setLightingDraft((d) => ({ ...d, keyLightGear: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Fill light</label>
                <input className={FIELD} value={lightingDraft.fillLightGear} onChange={(e) => setLightingDraft((d) => ({ ...d, fillLightGear: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Rim light</label>
                <input className={FIELD} value={lightingDraft.rimLightGear} onChange={(e) => setLightingDraft((d) => ({ ...d, rimLightGear: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Setup minutes</label>
                <input type="number" className={FIELD} value={lightingDraft.estimatedSetupMinutes} onChange={(e) => setLightingDraft((d) => ({ ...d, estimatedSetupMinutes: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Build steps</label>
              <textarea rows={3} className={FIELD} value={lightingDraft.buildSteps} onChange={(e) => setLightingDraft((d) => ({ ...d, buildSteps: e.target.value }))} />
            </div>
            <div className="flex gap-1.5 pt-0.5">
              <button type="button" onClick={() => setEditingLighting(false)} className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">
                <X size={10} /> Cancel
              </button>
              <button type="button" disabled={savingLighting} onClick={saveLighting} className="creator-primary flex flex-1 items-center justify-center gap-1 py-1 text-[10px] font-bold text-white disabled:opacity-60">
                {savingLighting ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                Save
              </button>
            </div>
          </div>
        ) : hasLighting ? (
          <div className="space-y-1 text-[11px] font-medium text-slate-300">
            <p>{lighting.cinematicIntent}</p>
            <p className="text-slate-400">Key: {lighting.keyLightGear || "—"} · Fill: {lighting.fillLightGear || "—"}</p>
            {lighting.rimLightGear && <p className="text-slate-400">Rim: {lighting.rimLightGear}</p>}
            {lighting.estimatedSetupMinutes && <p className="text-slate-500">~{lighting.estimatedSetupMinutes} min setup</p>}
          </div>
        ) : (
          <p className="text-[11px] font-medium text-slate-500">No lighting plan yet.</p>
        )}
      </div>

      <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            <Camera size={11} />
            Camera plan
            {hasCamera && camera.source === "CRITIC" && (
              <span title={camera.critiqueNotes} className="flex items-center gap-0.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-bold text-rose-300">
                <Sparkles size={8} />
                Critic-revised
              </span>
            )}
            {hasCamera && camera.source === "EDITED" && (
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">Edited</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            {hasCamera && !editingCamera && (
              <button type="button" onClick={startEditCamera} className="rounded border border-white/10 p-1 text-slate-400 hover:border-purple-400/30 hover:text-slate-200">
                <Pencil size={10} />
              </button>
            )}
            <button
              type="button"
              disabled={generatingCamera}
              onClick={() => handleGenerate(generateCamera, "camera")}
              className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-purple-400/30 disabled:opacity-60"
            >
              {generatingCamera && <Loader2 size={10} className="animate-spin" />}
              {hasCamera ? "Replan" : "Plan"}
            </button>
          </div>
        </div>

        {editingCamera ? (
          <div className="space-y-1.5">
            <div>
              <label className={LABEL}>Blocking map</label>
              <textarea rows={2} className={FIELD} value={cameraDraft.blockingMap} onChange={(e) => setCameraDraft((d) => ({ ...d, blockingMap: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Execution steps</label>
              <textarea rows={3} className={FIELD} value={cameraDraft.executionSteps} onChange={(e) => setCameraDraft((d) => ({ ...d, executionSteps: e.target.value }))} />
            </div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
              <input type="checkbox" checked={cameraDraft.gimbalEnabled} onChange={(e) => setCameraDraft((d) => ({ ...d, gimbalEnabled: e.target.checked }))} />
              Gimbal enabled
            </label>
            {cameraDraft.gimbalEnabled && (
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className={LABEL}>Device</label>
                  <input className={FIELD} value={cameraDraft.gimbalDevice} onChange={(e) => setCameraDraft((d) => ({ ...d, gimbalDevice: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Mode</label>
                  <input className={FIELD} value={cameraDraft.gimbalMode} onChange={(e) => setCameraDraft((d) => ({ ...d, gimbalMode: e.target.value }))} />
                </div>
              </div>
            )}
            <div>
              <label className={LABEL}>Safety flags</label>
              <input className={FIELD} value={cameraDraft.safetyFlags} onChange={(e) => setCameraDraft((d) => ({ ...d, safetyFlags: e.target.value }))} />
            </div>
            <div className="flex gap-1.5 pt-0.5">
              <button type="button" onClick={() => setEditingCamera(false)} className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">
                <X size={10} /> Cancel
              </button>
              <button type="button" disabled={savingCamera} onClick={saveCamera} className="creator-primary flex flex-1 items-center justify-center gap-1 py-1 text-[10px] font-bold text-white disabled:opacity-60">
                {savingCamera ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                Save
              </button>
            </div>
          </div>
        ) : hasCamera ? (
          <div className="space-y-1 text-[11px] font-medium text-slate-300">
            <p>{camera.blockingMap}</p>
            {camera.gimbalEnabled && (
              <p className="text-slate-400">Gimbal: {camera.gimbalDevice} ({camera.gimbalMode})</p>
            )}
            {camera.safetyFlags && <p className="text-amber-300">⚠ {camera.safetyFlags}</p>}
          </div>
        ) : (
          <p className="text-[11px] font-medium text-slate-500">No camera plan yet.</p>
        )}
      </div>
    </div>
  );
}
