// @ts-nocheck
import ProCta from "../common/ProCta.jsx";
import useCreatorVideoEntitlements from "../../hooks/useCreatorVideoEntitlements.js";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Plus, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateScreenplayMutation,
  useGetProjectConfigQuery,
  useGetScreenplayQuery,
  useGetScreenplayVersionQuery,
  useListDialogueLanguagesQuery,
  useListScreenplayVersionsQuery,
  useListScriptVersionsQuery,
  useSaveScreenplayEditMutation,
} from "../../api/creatorEndpoints.js";

const SCENE_EDIT_FIELDS = [
  { key: "slug", label: "Scene heading" },
  { key: "location", label: "Location" },
  { key: "summary", label: "Summary" },
];

const BLANK_SCENE = { slug: "", location: "", timeOfDay: null, summary: "", characterFocus: "", emotionalPurpose: "", estimatedSeconds: null, needsMultiImage: false, multiImageLabel: null, sceneType: null };

// Structural intent for a scene -- reaches the shot page (inherited) and the video-gen prompt so
// the model knows what kind of shot it is. Keep options coarse; downstream reads unknown/null as
// GENERIC. Values must stay in lock-step with pre-production-service's SceneType enum.
const SCENE_TYPE_OPTIONS = [
  { value: "", label: "Generic (default)" },
  { value: "IDENTITY", label: "Identity beat (hold on face/cast)" },
  { value: "MOTION_GRAPHIC", label: "Motion graphic / typographic" },
  { value: "LIVE_ACTION", label: "Live action" },
  { value: "PRODUCT_HERO", label: "Product hero" },
  { value: "GENERIC", label: "Generic" },
];

/** Screenplay is versioned on the backend (every generate/edit inserts a new row) -- this
 * component is what reads that: it shows the latest version by default, lets the creator step
 * through older ones, and lets them either regenerate via the LLM (a new GENERATED version) or
 * hand-edit scenes and save (a new EDITED version, no LLM call). */
export default function ScreenplaySection({ projectId }) {
  const { entitlements } = useCreatorVideoEntitlements();
  const dispatch = useDispatch();
  const [viewedVersion, setViewedVersion] = useState(null); // null = latest
  const [editing, setEditing] = useState(false);
  const [editedScenes, setEditedScenes] = useState(null);
  const [expandedSceneId, setExpandedSceneId] = useState(null);
  const [dialogueLanguage, setDialogueLanguage] = useState("");
  const [narrativeLanguage, setNarrativeLanguage] = useState("");
  const [selectedScriptVersion, setSelectedScriptVersion] = useState("");

  const { data: dialogueLanguageOptions = [] } = useListDialogueLanguagesQuery();
  const { data: projectConfig } = useGetProjectConfigQuery(projectId, { skip: !projectId });
  const { data: scriptVersions = [] } = useListScriptVersionsQuery(projectId, { skip: !projectId });

  // Pre-fill both language pickers from ProjectConfig once loaded so an existing choice
  // (persisted from a prior generate) is visible. Blank means "use the saved default" server-side.
  useEffect(() => {
    if (!dialogueLanguage && projectConfig?.dialogueLanguage) {
      setDialogueLanguage(projectConfig.dialogueLanguage);
    }
  }, [dialogueLanguage, projectConfig?.dialogueLanguage]);
  useEffect(() => {
    if (!narrativeLanguage && projectConfig?.narrativeLanguage) {
      setNarrativeLanguage(projectConfig.narrativeLanguage);
    }
  }, [narrativeLanguage, projectConfig?.narrativeLanguage]);

  const { data: latest, isLoading: latestLoading, error: latestError } = useGetScreenplayQuery(projectId, { skip: !projectId });
  const { data: versions = [] } = useListScreenplayVersionsQuery(projectId, { skip: !projectId });
  const { data: specificVersion } = useGetScreenplayVersionQuery(
    { projectId, version: viewedVersion },
    { skip: !projectId || viewedVersion == null }
  );

  const [generateScreenplay, { isLoading: generating }] = useGenerateScreenplayMutation();
  const [saveEdit, { isLoading: savingEdit }] = useSaveScreenplayEditMutation();

  const screenplay = viewedVersion == null ? latest : specificVersion;
  const hasScreenplay = Boolean(screenplay?.scenes?.length);
  const noScreenplayYet = latestError?.status === 404;

  const versionIndex = useMemo(() => versions.findIndex((v) => v.version === (screenplay?.version)), [versions, screenplay?.version]);
  const canGoPrev = versionIndex > 0;
  const canGoNext = versionIndex >= 0 && versionIndex < versions.length - 1;

  useEffect(() => {
    // Jumping to latest whenever a fresh version lands (generate/save-edit both invalidate
    // `latest`) keeps the view from silently pointing at a now-stale version number.
    setViewedVersion(null);
    setEditing(false);
  }, [latest?.id]);

  const goPrev = () => canGoPrev && setViewedVersion(versions[versionIndex - 1].version);
  const goNext = () => {
    if (!canGoNext) return;
    const target = versions[versionIndex + 1];
    // Stepping back to the latest version resets to "follow latest" instead of pinning a number.
    setViewedVersion(target.version === latest?.version ? null : target.version);
  };

  const handleGenerate = async () => {
    try {
      await generateScreenplay({
        projectId,
        dialogueLanguage: dialogueLanguage || undefined,
        narrativeLanguage: narrativeLanguage || undefined,
        scriptVersion: selectedScriptVersion ? Number(selectedScriptVersion) : undefined,
      }).unwrap();
      dispatch(showFlash({ message: hasScreenplay ? "New screenplay version generated" : "Screenplay generated", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate the screenplay", type: "error" }));
    }
  };

  const startEdit = () => {
    setEditedScenes(screenplay.scenes.map((s) => ({ ...s })));
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setEditedScenes(null);
  };
  const updateScene = (index, key, value) => {
    setEditedScenes((current) => current.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  };
  const [newSceneSeconds, setNewSceneSeconds] = useState("");
  const addScene = () => {
    const raw = Number.parseInt(newSceneSeconds, 10);
    const addSecs = Number.isFinite(raw) && raw > 0 ? raw : 0;
    setEditedScenes((current) => {
      // Proportionally shrink every existing scene that has a duration so the total video length
      // stays constant. Scenes with no estimatedSeconds are left untouched (they don't contribute
      // to the total, so there's nothing to shrink). Falls back to a simple append when there's
      // nothing to shrink (no addSecs, or no scenes with duration).
      const sized = current.filter((s) => Number.isFinite(Number(s.estimatedSeconds)) && Number(s.estimatedSeconds) > 0);
      const total = sized.reduce((sum, s) => sum + Number(s.estimatedSeconds), 0);
      const rebalanced = addSecs > 0 && total > addSecs
        ? current.map((s) => {
            const sec = Number(s.estimatedSeconds);
            if (!Number.isFinite(sec) || sec <= 0) return s;
            const shrunk = Math.max(1, Math.round(sec * (total - addSecs) / total));
            return { ...s, estimatedSeconds: shrunk };
          })
        : current;
      return [...rebalanced, { ...BLANK_SCENE, sceneNumber: rebalanced.length + 1, estimatedSeconds: addSecs > 0 ? addSecs : null }];
    });
    setNewSceneSeconds("");
  };
  const removeScene = (index) => {
    setEditedScenes((current) => current.filter((_, i) => i !== index));
  };
  const handleSaveEdit = async () => {
    try {
      await saveEdit({
        projectId,
        fromVersion: screenplay.version,
        // Renumbered sequentially on save — add/remove leaves gaps or duplicates in sceneNumber
        // otherwise, and generation always produces a clean 1..N sequence.
        scenes: editedScenes.map((s, index) => ({
          sceneNumber: index + 1,
          slug: s.slug,
          location: s.location,
          timeOfDay: s.timeOfDay,
          summary: s.summary,
          characterFocus: s.characterFocus,
          emotionalPurpose: s.emotionalPurpose,
          estimatedSeconds: s.estimatedSeconds === "" || s.estimatedSeconds == null ? null : Number(s.estimatedSeconds),
          needsMultiImage: Boolean(s.needsMultiImage),
          multiImageLabel: s.multiImageLabel || null,
          sceneType: s.sceneType || null,
        })),
      }).unwrap();
      dispatch(showFlash({ message: "Saved as a new screenplay version", type: "success" }));
      setEditing(false);
      setEditedScenes(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save these edits", type: "error" }));
    }
  };

  if (latestLoading) return null;

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Screenplay</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Every generate or saved edit is a new version — nothing is overwritten</p>
        </div>

        {hasScreenplay && versions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={goPrev} disabled={!canGoPrev} className="creator-control flex h-7 w-7 items-center justify-center disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span className="px-1 text-xs font-bold text-slate-300">
              v{screenplay.version} of {versions.length}
              {screenplay.source === "EDITED" && <span className="ml-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-300">Edited</span>}
              {screenplay.source === "CRITIC" && <span className="ml-1.5 rounded-full border border-rose-400/25 bg-rose-400/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-rose-300">Critic-revised</span>}
            </span>
            <button type="button" onClick={goNext} disabled={!canGoNext} className="creator-control flex h-7 w-7 items-center justify-center disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {!hasScreenplay && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <LanguagePicker
              label="Narrative / prose language"
              value={narrativeLanguage}
              onChange={setNarrativeLanguage}
              options={dialogueLanguageOptions}
            />
            <LanguagePicker
              label="Dialogue / spoken language"
              value={dialogueLanguage}
              onChange={setDialogueLanguage}
              options={dialogueLanguageOptions}
            />
          </div>
          <ScriptVersionPicker
            value={selectedScriptVersion}
            onChange={setSelectedScriptVersion}
            versions={scriptVersions}
          />
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white disabled:opacity-60"
          >
            <Sparkles size={15} />
            {generating ? "Generating…" : noScreenplayYet ? "Generate screenplay" : "Generate screenplay"}
          </button>
        </div>
      )}

      {hasScreenplay && !editing && (
        <>
          <div className="space-y-3">
            {screenplay.scenes.map((scene) => {
              const isExpanded = expandedSceneId === scene.id;
              const hasDetail = Boolean(scene.characterFocus || scene.emotionalPurpose);
              return (
                <div key={scene.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
                  <button
                    type="button"
                    onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                    className="flex w-full items-start justify-between gap-2 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-200">{scene.slug}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {scene.needsMultiImage && (
                            <span
                              className="rounded-full border border-purple-400/40 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-200"
                              title="Creator flagged: needs multiple reference images on the shot page"
                            >
                              +imgs{scene.multiImageLabel ? ` · ${scene.multiImageLabel}` : ""}
                            </span>
                          )}
                          {scene.sceneType && scene.sceneType !== "GENERIC" && (
                            <span
                              className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-200"
                              title="Structural scene type -- reaches the shot page and video prompt"
                            >
                              {scene.sceneType.toLowerCase().replace("_", " ")}
                            </span>
                          )}
                          {scene.estimatedSeconds != null && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">~{scene.estimatedSeconds}s</span>
                          )}
                        </div>
                      </div>
                      <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{scene.location} {scene.timeOfDay ? `· ${scene.timeOfDay}` : ""}</p>
                      <p className="mb-1.5 text-xs font-medium leading-relaxed text-slate-400">{scene.summary}</p>
                      {scene.characters?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {scene.characters.map((c) => (
                            <span
                              key={c.scriptCharacterId}
                              className="rounded-full border border-purple-400/25 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-200"
                            >
                              {c.characterName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          B-roll / motion — no character
                        </span>
                      )}
                    </div>
                    {hasDetail && (isExpanded ? <ChevronUp size={14} className="mt-1 shrink-0 text-slate-400" /> : <ChevronDown size={14} className="mt-1 shrink-0 text-slate-400" />)}
                  </button>

                  {isExpanded && hasDetail && (
                    <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2">
                      {scene.characterFocus && (
                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Character focus</p>
                          <p className="text-[11px] font-medium text-slate-300">{scene.characterFocus}</p>
                        </div>
                      )}
                      {scene.emotionalPurpose && (
                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Emotional purpose</p>
                          <p className="text-[11px] font-medium text-slate-300">{scene.emotionalPurpose}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <LanguagePicker
                label="Narrative / prose language"
                value={narrativeLanguage}
                onChange={setNarrativeLanguage}
                options={dialogueLanguageOptions}
              />
              <LanguagePicker
                label="Dialogue / spoken language"
                value={dialogueLanguage}
                onChange={setDialogueLanguage}
                options={dialogueLanguageOptions}
              />
            </div>
            <ScriptVersionPicker
              value={selectedScriptVersion}
              onChange={setSelectedScriptVersion}
              versions={scriptVersions}
            />
            <div className="flex gap-2.5">
              <ProCta unlocked={entitlements.editsEnabled} feature="Editing the screenplay" onClick={startEdit} className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-purple-400/30">
                <Pencil size={12} />
                Edit scenes
              </ProCta>
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerate}
                className="creator-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                <RefreshCw size={13} />
                {generating ? "Generating…" : "Regenerate screenplay"}
              </button>
            </div>
          </div>
        </>
      )}

      {hasScreenplay && editing && (
        <div className="space-y-3">
          {editedScenes.map((scene, index) => (
            <div key={scene.id || `new-${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-purple-300">Scene {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeScene(index)}
                  disabled={editedScenes.length <= 1}
                  title="Remove scene"
                  className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-slate-400 hover:border-red-400/40 hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {SCENE_EDIT_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
                    <textarea
                      rows={key === "summary" ? 2 : 1}
                      value={scene[key] || ""}
                      onChange={(event) => updateScene(index, key, event.target.value)}
                      className="creator-input w-full resize-y px-2.5 py-2 text-xs"
                    />
                  </div>
                ))}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Estimated seconds</label>
                    <input
                      type="number"
                      min="0"
                      value={scene.estimatedSeconds ?? ""}
                      onChange={(event) => updateScene(index, "estimatedSeconds", event.target.value)}
                      className="creator-input w-24 px-2.5 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Scene type</label>
                    <select
                      value={scene.sceneType || ""}
                      onChange={(event) => updateScene(index, "sceneType", event.target.value || null)}
                      className="creator-input w-full px-2.5 py-2 text-xs font-semibold"
                    >
                      {SCENE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value || "GENERIC-blank"} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Multi-image reference bundle -- creator marks a scene that will need multiple
                    reference images (e.g. an app-flow scene with several screenshots). Phase 1:
                    just persist the flag + label on the scene. Phase 2: the shot(s) generated
                    from this scene inherit the flag and the shot page reveals the actual multi
                    -image upload UI using this label as the bundle name; the images then flow
                    to storyboard, PDF, and the video-generation prompt. */}
                <div className="rounded-md border border-purple-400/20 bg-purple-500/[0.04] p-2.5">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(scene.needsMultiImage)}
                      onChange={(event) => updateScene(index, "needsMultiImage", event.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 accent-purple-500"
                    />
                    <span className="flex-1 text-[11px] font-semibold text-slate-200">
                      This scene needs multiple reference images (uploaded later on the shot page)
                    </span>
                  </label>
                  {scene.needsMultiImage && (
                    <div className="mt-2 pl-5">
                      <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">What to call this image bundle</label>
                      <input
                        type="text"
                        value={scene.multiImageLabel ?? ""}
                        onChange={(event) => updateScene(index, "multiImageLabel", event.target.value)}
                        placeholder="e.g. app flow, before/after, product angles"
                        className="creator-input w-full px-2.5 py-1.5 text-[11px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Add-scene row: creator picks a duration, other sized scenes shrink proportionally so
              the total video length stays the same (rebalance runs client-side in addScene). Leave
              seconds blank to just append a blank scene without rebalancing. */}
          <div className="flex items-stretch gap-2">
            <input
              type="number"
              min="1"
              placeholder="Seconds (optional)"
              value={newSceneSeconds}
              onChange={(event) => setNewSceneSeconds(event.target.value)}
              className="creator-input w-40 px-2.5 py-2 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={addScene}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-white/15 py-2.5 text-xs font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200"
              title={newSceneSeconds ? "Add scene and proportionally shrink others to keep total constant" : "Add a blank scene"}
            >
              <Plus size={13} />
              Add scene{newSceneSeconds ? ` (${newSceneSeconds}s, rebalanced)` : ""}
            </button>
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={cancelEdit} className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200">
              <X size={12} />
              Cancel
            </button>
            <button
              type="button"
              disabled={savingEdit || editedScenes.length === 0}
              onClick={handleSaveEdit}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              <Save size={12} />
              {savingEdit ? "Saving…" : "Save as new version"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** BCP-47 picker used for both the narrative-prose and dialogue-spoken language pickers on the
 * screenplay generate form. Blank = "use ProjectConfig's saved default"; a non-blank value
 * overrides AND becomes the new saved default (see ProjectConfigService.resolveDialogueLanguage /
 * resolveNarrativeLanguage). */
function LanguagePicker({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="creator-input w-full px-3 py-2 text-xs font-semibold"
      >
        <option value="">Use project default</option>
        {options.map((option) => (
          <option key={option.code || option.value} value={option.code || option.value}>
            {option.label || option.displayName || option.code || option.value}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Optional per-generate script version selector. Blank = "use the live/latest script row"
 * (existing behavior). Picking a specific version reroutes screenplay generation to base itself
 * on THAT version's scriptText rather than the current live one -- the "wait, I liked v2 better,
 * make the screenplay from v2" flow. Hidden when there's only one version to pick from. */
function ScriptVersionPicker({ value, onChange, versions }) {
  if (!versions || versions.length < 2) return null;
  return (
    <div>
      <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Script version to use</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="creator-input w-full px-3 py-2 text-xs font-semibold"
      >
        <option value="">Latest ({versions.length} versions available)</option>
        {[...versions].reverse().map((v) => (
          <option key={v.version} value={String(v.version)}>
            v{v.version}{v.source ? ` · ${v.source.toLowerCase()}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
