// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetProjectConfigQuery,
  useListAspectRatiosQuery,
  useListDialogueLanguagesQuery,
  useSyncBuiltinVoicesMutation,
  useUpdateProjectConfigMutation,
} from "../../api/creatorEndpoints.js";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

/**
 * Project-wide settings, set once before/alongside script generation: aspect ratio, target
 * duration, dialogue language, and whether to prefer MOTION_GRAPHIC for text/data-driven beats.
 * Everything after this (shot-list aspect ratio, script duration default, what language the script
 * is actually written in) reads from here instead of the creator having to specify it again at
 * every stage.
 */
export default function ProjectSettingsPanel({ projectId }) {
  const dispatch = useDispatch();
  const { data: config } = useGetProjectConfigQuery(projectId, { skip: !projectId });
  const { data: aspectRatios = [] } = useListAspectRatiosQuery();
  const { data: languages = [] } = useListDialogueLanguagesQuery();
  const [updateConfig, { isLoading: saving }] = useUpdateProjectConfigMutation();
  const [syncVoices, { isLoading: syncingVoices }] = useSyncBuiltinVoicesMutation();

  const handleAspectRatio = async (code) => {
    try {
      await updateConfig({ projectId, aspectRatio: code }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the aspect ratio", type: "error" }));
    }
  };

  const handleDuration = async (event) => {
    const raw = event.target.value;
    const value = raw ? Number(raw) : null;
    try {
      await updateConfig({ projectId, targetDurationSeconds: value }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the duration", type: "error" }));
    }
  };

  const handleMotionGraphicsToggle = async () => {
    try {
      await updateConfig({ projectId, preferMotionGraphics: !config?.preferMotionGraphics }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this preference", type: "error" }));
    }
  };

  const handleDialogueLanguage = async (event) => {
    const code = event.target.value || null;
    try {
      await updateConfig({ projectId, dialogueLanguage: code }).unwrap();
      dispatch(showFlash({ message: "Dialogue language saved.", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the dialogue language", type: "error" }));
    }
  };

  const handleSyncVoices = async () => {
    try {
      const result = await syncVoices().unwrap();
      const inserted = result?.insertedCount ?? 0;
      const updated = result?.updatedCount ?? 0;
      const total = inserted + updated;
      dispatch(showFlash({
        message: total > 0
          ? `Refreshed ${total} Hindi-verified voice${total === 1 ? "" : "s"} from ElevenLabs.`
          : "Sync ran but ElevenLabs returned no Hindi-verified voices — add one from the ElevenLabs voice library first.",
        type: total > 0 ? "success" : "info",
      }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not refresh voices from ElevenLabs", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-6 p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Project settings</p>
      <p className="mt-0.5 mb-4 text-xs font-medium text-slate-400">
        Set the aspect ratio and target duration before generating the script — every stage after plans around these.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Aspect ratio</label>
          <select
            value={config?.aspectRatio || ""}
            onChange={(event) => event.target.value && handleAspectRatio(event.target.value)}
            disabled={saving}
            className="creator-input w-full px-3 py-2.5 text-[13px] font-semibold disabled:opacity-60"
          >
            <option value="" disabled>Choose aspect ratio…</option>
            {aspectRatios.map((ratio) => (
              <option key={ratio.code} value={ratio.code}>{ratio.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target duration (seconds)</label>
          <select
            value={config?.targetDurationSeconds || ""}
            onChange={handleDuration}
            disabled={saving}
            className="creator-input w-full px-3 py-2.5 text-[13px] font-semibold disabled:opacity-60"
          >
            <option value="" disabled>Choose duration…</option>
            {DURATION_PRESETS.map((seconds) => (
              <option key={seconds} value={seconds}>{seconds}s</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Dialogue language</label>
          <select
            value={config?.dialogueLanguage || ""}
            onChange={handleDialogueLanguage}
            disabled={saving}
            className="creator-input w-full px-3 py-2.5 text-[13px] font-semibold disabled:opacity-60"
          >
            <option value="">English (default)</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
                {lang.nativeLabel && lang.nativeLabel !== lang.label ? ` (${lang.nativeLabel})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-300">
        <input type="checkbox" checked={Boolean(config?.preferMotionGraphics)} onChange={handleMotionGraphicsToggle} />
        <Sparkles size={12} className="text-purple-300" />
        Prefer motion graphics for text/data-driven beats
      </label>

      <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/[0.02] p-3">
        <div className="flex-1">
          <p className="text-[11px] font-bold text-slate-200">Hindi voices sound English?</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">
            Refreshes built-in voices from your ElevenLabs account and keeps only voices ElevenLabs itself verifies for Hindi. Do this once after adding a Hindi-native voice from ElevenLabs' voice library.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSyncVoices}
          disabled={syncingVoices}
          className="flex items-center gap-1.5 rounded-md border border-purple-400/40 bg-purple-500/10 px-3 py-1.5 text-[11px] font-bold text-purple-200 hover:border-purple-400/60 disabled:opacity-60"
        >
          {syncingVoices ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {syncingVoices ? "Syncing…" : "Refresh Hindi voices"}
        </button>
      </div>
    </div>
  );
}
