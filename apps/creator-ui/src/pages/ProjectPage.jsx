// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, Check, ChevronDown, ChevronUp, Plus, RefreshCw, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateScriptMutation,
  useGetLockedIdeaQuery,
  useGetPreProductionProjectQuery,
  useGetProjectConfigQuery,
  useGetProjectRequirementQuery,
  useGetProjectRequirementProductQuery,
  useGetScriptQuery,
  useListCastProfilesQuery,
  useListDialogueLanguagesQuery,
  useListProjectRequirementProductImagesQuery,
  useListProjectRequirementReferenceImagesQuery,
} from "../api/creatorEndpoints.js";
import ScriptSection from "../components/creator/ScriptSection.jsx";
import ScreenplaySection from "../components/creator/ScreenplaySection.jsx";
import CastSection from "../components/creator/CastSection.jsx";
import CastProfileQuickCreate from "../components/creator/CastProfileQuickCreate.jsx";
import ProjectSettingsPanel from "../components/creator/ProjectSettingsPanel.jsx";
import ShotsSection from "../components/creator/ShotsSection.jsx";
import ShotChatPanel from "../components/creator/ShotChatPanel.jsx";
import ProjectIdeaOptionsPanel from "../components/creator/ProjectIdeaOptionsPanel.jsx";
import VideoGenerationSection from "../components/creator/VideoGenerationSection.jsx";
import ContinuityBiblePanel from "../components/creator/ContinuityBiblePanel.jsx";
import ClientReviewPanel from "../components/creator/ClientReviewPanel.jsx";

const IDEA_FIELDS = [
  { key: "title", label: "Title", multiline: false },
  { key: "concept", label: "Concept", multiline: true },
  { key: "targetAudience", label: "Target audience", multiline: false },
  { key: "campaignAngle", label: "Campaign angle", multiline: false },
  { key: "keyMessage", label: "Key message", multiline: false },
  { key: "tone", label: "Tone", multiline: false },
];

/** Turns the (possibly edited) locked-idea fields into the single briefText string
 * pre-production-service's script endpoint actually accepts -- see GenerateScriptRequest's
 * javadoc: this v1 slice takes briefText directly rather than fetching structured idea fields
 * itself, so composing a richer brief from the idea is the frontend's job. */
function composeBriefFromIdea(idea) {
  if (!idea) return "";
  const lines = [idea.concept];
  if (idea.campaignAngle) lines.push(`Angle: ${idea.campaignAngle}`);
  if (idea.keyMessage) lines.push(`Key message: ${idea.keyMessage}`);
  if (idea.tone) lines.push(`Tone: ${idea.tone}`);
  if (idea.targetAudience) lines.push(`Target audience: ${idea.targetAudience}`);
  return [idea.title, lines.filter(Boolean).join(" ")].filter(Boolean).join(". ");
}

const TABS = [
  { id: "brief", label: "Brief" },
  { id: "idea", label: "Idea" },
  { id: "script", label: "Script" },
  { id: "screenplay", label: "Screenplay" },
  { id: "cast", label: "Character" },
  { id: "shots", label: "Shots" },
  { id: "video", label: "Video" },
];

const NEXT_TAB = Object.fromEntries(TABS.map((tab, index) => [tab.id, TABS[index + 1] || null]));

/** Read-only view of the originating brief -- the client's requirement text, product, target
 * audience, reference images, quoted price. Shown on the workspace as its own tab so a creator
 * looking at ideas/script/shots can always look back at what the client actually asked for
 * without leaving the project page. Editing is intentionally not exposed here yet: once a script
 * has been generated the brief is effectively frozen (ideas/screenplay/shots were all generated
 * off it), and the share-token brief page remains the pre-lock edit surface. Follow-up work will
 * add a PATCH endpoint + editable form for the still-unlocked case. */
function BriefPanel({ requirement, product, productImages, referenceImages, shareUrl, locked, hasRequirement }) {
  if (!hasRequirement) {
    return (
      <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
        This project wasn't started from a brief (locked from a chat session instead), so there's
        no client brief to show here.
      </p>
    );
  }
  if (!requirement) {
    return <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">Loading brief…</p>;
  }
  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">The brief</p>
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${locked ? "border-slate-500/30 bg-slate-500/15 text-slate-400" : "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"}`}>
          {locked ? "LOCKED (view only)" : "EDITABLE"}
        </span>
      </div>
      <p className="mb-5 border-l-2 border-purple-500/40 pl-3.5 text-[15px] font-semibold leading-relaxed text-white">
        &ldquo;{requirement.briefText}&rdquo;
      </p>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {requirement.targetAudience && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target audience</p>
            <p className="text-[13px] font-bold text-slate-100">{requirement.targetAudience}</p>
          </div>
        )}
        {requirement.durationSeconds != null && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Duration</p>
            <p className="text-[13px] font-bold text-slate-100">{requirement.durationSeconds}s</p>
          </div>
        )}
        {Boolean(requirement.languages?.length) && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Languages</p>
            <p className="text-[13px] font-bold text-slate-100">{requirement.languages.join(", ")}</p>
          </div>
        )}
        {requirement.quotedTotalPrice != null && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Quoted price</p>
            <p className="text-[13px] font-bold text-slate-100">
              {requirement.quotedCurrency || "INR"} {Number(requirement.quotedTotalPrice).toFixed(2)}
            </p>
          </div>
        )}
      </div>
      {product && (
        <div className="mb-5 border-t border-white/10 pt-5">
          <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Product</p>
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[13px] font-bold text-slate-100">{product.name}</p>
            {product.category && <p className="text-[11px] font-semibold text-slate-500">{product.category}</p>}
            {product.description && <p className="mt-1.5 text-xs font-medium text-slate-400">{product.description}</p>}
          </div>
          {Array.isArray(productImages) && productImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {productImages.slice(0, 6).map((image) => (
                <img key={image.id} src={image.signedUrl || image.url} alt="product" className="aspect-square w-full rounded border border-white/10 object-cover" />
              ))}
            </div>
          )}
        </div>
      )}
      {Array.isArray(referenceImages) && referenceImages.length > 0 && (
        <div className="mb-5 border-t border-white/10 pt-5">
          <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Client references</p>
          <div className="grid grid-cols-3 gap-2">
            {referenceImages.slice(0, 6).map((image) => (
              <img key={image.id} src={image.signedUrl || image.url} alt="reference" className="aspect-square w-full rounded border border-white/10 object-cover" />
            ))}
          </div>
        </div>
      )}
      {shareUrl && !locked && (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Edit via brief link</p>
          <a href={shareUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-purple-300 hover:text-purple-200 break-all">
            {shareUrl}
          </a>
        </div>
      )}
    </div>
  );
}

/** A stage's own generate/save controls live inside its section component -- this is just the
 * "you're done here, keep going" nudge once that stage has something to show, so the creator
 * isn't left to notice and click the tab pill above. Every tab is already freely clickable (no
 * tab is actually gated), so this never blocks anything it doesn't also offer as a plain tab
 * click -- it's a shortcut, not a lock. */
function ContinueButton({ fromTabId, onContinue }) {
  const next = NEXT_TAB[fromTabId];
  if (!next) return null;
  return (
    <button
      type="button"
      onClick={onContinue}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-400/25 bg-purple-500/10 py-3 text-[12px] font-bold text-purple-200 hover:bg-purple-500/15"
    >
      Continue to {next.label}
      <ArrowRight size={14} />
    </button>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("brief");
  const [ideaExpanded, setIdeaExpanded] = useState(true);
  const [editedIdea, setEditedIdea] = useState(null);
  const [duration, setDuration] = useState(60);
  const [dialogueLanguage, setDialogueLanguage] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const { data: project } = useGetPreProductionProjectQuery(projectId, { skip: !projectId });
  const { data: lockedIdea } = useGetLockedIdeaQuery(project?.lockedIdeaId, { skip: !project?.lockedIdeaId });
  const {
    data: script,
    error: scriptError,
    isLoading: scriptLoading,
    refetch: refetchScript,
  } = useGetScriptQuery(projectId, { skip: !projectId });
  const [generateScript, { isLoading: generating }] = useGenerateScriptMutation();
  const { data: productProfiles = [] } = useListCastProfilesQuery({ projectId, profileType: "PRODUCT" }, { skip: !projectId });
  const { data: dialogueLanguageOptions = [] } = useListDialogueLanguagesQuery();
  const { data: projectConfig } = useGetProjectConfigQuery(projectId, { skip: !projectId });

  // Pre-fill the language picker from ProjectConfig once it loads, so an existing choice
  // (persisted from a prior generate or the project's default) is visible instead of blank.
  // The creator can still change it before generating -- the mutation only sends dialogueLanguage
  // when it's non-empty, and ProjectConfigService.resolveDialogueLanguage overwrites the saved
  // default whenever a non-blank value comes in.
  useEffect(() => {
    if (!dialogueLanguage && projectConfig?.dialogueLanguage) {
      setDialogueLanguage(projectConfig.dialogueLanguage);
    }
  }, [dialogueLanguage, projectConfig?.dialogueLanguage]);

  const hasScript = Boolean(script?.scriptText);
  const scriptNotYetGenerated = scriptError?.status === 404;

  // Backend added projectRequirementId to LockedIdeaView so the creator's workspace can hydrate a
  // "Brief" panel without a reverse-lookup call. Null for projects that were locked from a chat
  // session rather than a requirement/brief -- Brief tab shows a "no brief attached" note in that
  // case rather than a spinner. Read-only once a script exists (editing the brief text after the
  // fact has no effect: ideas + script were already generated from it).
  const requirementId = lockedIdea?.projectRequirementId || null;
  const { data: requirement } = useGetProjectRequirementQuery(requirementId, { skip: !requirementId });
  const { data: briefProduct } = useGetProjectRequirementProductQuery(requirementId, { skip: !requirementId });
  const { data: briefProductImages } = useListProjectRequirementProductImagesQuery(requirementId, { skip: !requirementId || !briefProduct });
  const { data: briefReferenceImages } = useListProjectRequirementReferenceImagesQuery(requirementId, { skip: !requirementId });
  const briefLocked = hasScript;
  const briefShareUrl = requirement?.shareToken ? `${window.location.origin}/brief/${requirement.shareToken}` : "";

  // Migrated projects (ported from the old system) have no real locked idea to fetch -- their
  // locked_idea_id is a synthetic placeholder. Falling back to the script's own story-structure
  // fields means the idea tab still shows something real instead of blank inputs.
  const hasLockedIdea = Boolean(lockedIdea);
  useEffect(() => {
    if (editedIdea) return;
    if (lockedIdea) {
      setEditedIdea({
        title: lockedIdea.title || "",
        concept: lockedIdea.concept || "",
        targetAudience: lockedIdea.targetAudience || "",
        campaignAngle: lockedIdea.campaignAngle || "",
        keyMessage: lockedIdea.keyMessage || "",
        tone: lockedIdea.tone || "",
      });
    } else if (script) {
      setEditedIdea({
        title: script.logline || project?.name || "",
        concept: [script.centralConflict, script.setting].filter(Boolean).join(" "),
        targetAudience: "",
        campaignAngle: "",
        keyMessage: script.endingPayoff || "",
        tone: script.storytellingType || "",
      });
    }
  }, [lockedIdea, editedIdea, script, project?.name]);

  useEffect(() => {
    // Collapse the idea editor once a script exists — first-time generation wants it open,
    // regeneration is a deliberate re-expand.
    if (hasScript) setIdeaExpanded(false);
  }, [hasScript]);

  const composedBrief = useMemo(() => {
    const base = composeBriefFromIdea(editedIdea);
    // Optional ad-hoc: if the client answered "yes" to "want shots from my reference videos?"
    // on the brief page (creative-planning surfaces the text via LockedIdeaView.videoShotsIntent),
    // append it so the script prompt is aware to leave a slot for a manually-inserted shot.
    // Silently no-op when unset -- the existing script flow is unchanged for projects without an
    // originating brief or where the client answered No.
    if (lockedIdea?.videoShotsIntent && lockedIdea.videoShotsIntent.trim()) {
      const note = `Reserve a shot slot for a client-supplied reference video clip. What that shot should convey: ${lockedIdea.videoShotsIntent.trim()}`;
      return [base, note].filter(Boolean).join(". ");
    }
    return base;
  }, [editedIdea, lockedIdea?.videoShotsIntent]);

  const updateField = (key, value) => setEditedIdea((current) => ({ ...current, [key]: value }));

  const toggleProduct = (id) => {
    setSelectedProductIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const handleGenerate = async () => {
    if (!editedIdea?.concept?.trim()) {
      dispatch(showFlash({ message: "The idea needs a concept before generating a script", type: "error" }));
      return;
    }
    try {
      await generateScript({
        projectId,
        briefText: composedBrief,
        targetDurationSeconds: duration,
        productCastProfileIds: selectedProductIds,
        dialogueLanguage: dialogueLanguage || undefined,
      }).unwrap();
      dispatch(showFlash({ message: hasScript ? "Script regenerated" : "Script generated", type: "success" }));
      refetchScript();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate the script", type: "error" }));
    }
  };

  if (!project || (scriptLoading && !scriptNotYetGenerated)) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-sm font-semibold text-slate-400">Loading project…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
      <p className="mt-1.5 text-sm font-medium text-slate-400">
        {activeTab === "brief" ? "Brief" : activeTab === "idea" ? "Idea" : activeTab === "script" ? "Script" : activeTab === "screenplay" ? "Screenplay" : activeTab === "cast" ? "Character" : activeTab === "video" ? "Video" : "Shots"}
        {" "}&middot; regenerating replaces the current draft, there's no version history
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              activeTab === tab.id ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "brief" && (
        <BriefPanel
          requirement={requirement}
          product={briefProduct}
          productImages={briefProductImages}
          referenceImages={briefReferenceImages}
          shareUrl={briefShareUrl}
          locked={briefLocked}
          hasRequirement={Boolean(requirementId)}
        />
      )}

      {activeTab === "idea" && <ProjectSettingsPanel projectId={projectId} />}

      {activeTab === "idea" && (
      <div className="creator-panel mt-6 p-6">
        <button
          type="button"
          onClick={() => setIdeaExpanded((v) => !v)}
          className="mb-4 flex w-full items-center justify-between gap-3 text-left"
        >
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">The idea</p>
          {ideaExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {!hasLockedIdea && editedIdea && (
          <p className="mb-3 rounded-md border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
            No original idea brief was carried over for this project — these fields are derived from the script's own story structure instead.
          </p>
        )}

        {!ideaExpanded && editedIdea && (
          <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-bold text-white">{editedIdea.title}</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">{editedIdea.concept}</p>
          </div>
        )}

        {ideaExpanded && editedIdea && (
          <div className="mb-5 space-y-3">
            {IDEA_FIELDS.map(({ key, label, multiline }) => (
              <div key={key}>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
                {multiline ? (
                  <textarea
                    rows={3}
                    value={editedIdea[key]}
                    onChange={(event) => updateField(key, event.target.value)}
                    className="creator-input w-full resize-y px-3 py-2.5 text-[13px]"
                  />
                ) : (
                  <input
                    type="text"
                    value={editedIdea[key]}
                    onChange={(event) => updateField(key, event.target.value)}
                    className="creator-input w-full px-3 py-2.5 text-[13px] font-semibold"
                  />
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-6">
              {/* Duration is a preset dropdown for the common lengths PLUS a "Custom" option that
                  reveals a free-form numeric input, so a creator can pick e.g. 22s or 180s without
                  us having to enumerate every possibility. Clamped 1..600s (10 min) to keep the
                  server-side prompt from receiving an absurd value; the LLM has to plan beats to
                  fit this exact time. */}
              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target duration (seconds)</label>
                <div className="flex items-center gap-2">
                  <select
                    value={[15, 30, 45, 60, 90, 120].includes(duration) ? String(duration) : "custom"}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "custom") return;
                      setDuration(Number(value));
                    }}
                    className="creator-input w-32 px-3 py-2.5 text-[13px] font-semibold"
                  >
                    {[15, 30, 45, 60, 90, 120].map((seconds) => (
                      <option key={seconds} value={seconds}>{seconds}s</option>
                    ))}
                    <option value="custom">Custom…</option>
                  </select>
                  {![15, 30, 45, 60, 90, 120].includes(duration) && (
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={duration}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 600) {
                          setDuration(parsed);
                        }
                      }}
                      className="creator-input w-24 px-3 py-2.5 text-[13px] font-semibold"
                      placeholder="e.g. 22"
                    />
                  )}
                </div>
              </div>
              {/* BCP-47 language picker -- overrides ProjectConfig.dialogueLanguage AND becomes
                  the new saved default so screenplay/shot-list/dialogue-details all see it, no
                  separate project-settings save required. Empty option means "leave the saved
                  default alone" (falls back to en-US server-side if nothing was ever set). */}
              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Dialogue language</label>
                <select
                  value={dialogueLanguage}
                  onChange={(event) => setDialogueLanguage(event.target.value)}
                  className="creator-input w-56 px-3 py-2.5 text-[13px] font-semibold"
                >
                  <option value="">Use project default</option>
                  {dialogueLanguageOptions.map((option) => (
                    <option key={option.code || option.value} value={option.code || option.value}>
                      {option.label || option.displayName || option.code || option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Products to feature (optional)
              </label>
              <p className="mb-2 text-[11px] font-medium text-slate-500">
                Pick real products so the script plans product-hero shots around them instead of inventing one.
              </p>
              {productProfiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {productProfiles.map((p) => {
                    const selected = selectedProductIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          selected
                            ? "border-purple-400/40 bg-purple-500/15 text-purple-200"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/30"
                        }`}
                      >
                        {selected && <Check size={11} />}
                        {p.displayName}
                      </button>
                    );
                  })}
                </div>
              )}
              {!creatingProduct ? (
                <button
                  type="button"
                  onClick={() => setCreatingProduct(true)}
                  className="flex items-center gap-1.5 rounded-md border border-dashed border-white/15 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200"
                >
                  <Plus size={12} />
                  New product
                </button>
              ) : (
                <CastProfileQuickCreate
                  profileType="PRODUCT"
                  projectId={projectId}
                  onCreated={(profile) => {
                    setSelectedProductIds((current) => [...current, profile.id]);
                    setCreatingProduct(false);
                  }}
                  onCancel={() => setCreatingProduct(false)}
                />
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={generating}
          onClick={() => { handleGenerate(); setActiveTab("script"); }}
          className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {hasScript ? <RefreshCw size={15} /> : <Sparkles size={15} />}
          {generating ? "Generating…" : hasScript ? "Regenerate script with these changes" : "Generate script"}
        </button>
      </div>
      )}

      {activeTab === "idea" && <ProjectIdeaOptionsPanel projectId={projectId} />}

        {activeTab === "script" && !hasScript && (
          <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
            No script yet — generate one from the Idea tab first.
          </p>
        )}

        {activeTab === "script" && hasScript && (
          <>
            <ScriptSection projectId={projectId} />
            <ContinueButton fromTabId="script" onContinue={() => setActiveTab("screenplay")} />
          </>
        )}

      {activeTab === "screenplay" && hasScript && (
        <>
          <ScreenplaySection projectId={projectId} />
          <ContinueButton fromTabId="screenplay" onContinue={() => setActiveTab("cast")} />
        </>
      )}
      {activeTab === "screenplay" && !hasScript && (
        <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
          No script yet — generate one from the Idea tab first.
        </p>
      )}

      {activeTab === "cast" && hasScript && script.characters?.length > 0 && (
        <>
          <CastSection projectId={projectId} characters={script.characters} />
          <ContinueButton fromTabId="cast" onContinue={() => setActiveTab("shots")} />
        </>
      )}
      {activeTab === "cast" && hasScript && !(script.characters?.length > 0) && (
        <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">No characters on this script yet.</p>
      )}
      {activeTab === "cast" && !hasScript && (
        <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
          No script yet — generate one from the Idea tab first.
        </p>
      )}

      {activeTab === "shots" && hasScript && (
        <>
          <ShotsSection projectId={projectId} />
          <ContinueButton fromTabId="shots" onContinue={() => setActiveTab("video")} />
          <ShotChatPanel projectId={projectId} />
          <ContinuityBiblePanel projectId={projectId} />
        </>
      )}
      {activeTab === "shots" && !hasScript && (
        <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
          No script yet — generate one from the Idea tab first.
        </p>
      )}

      {activeTab === "video" && hasScript && <VideoGenerationSection projectId={projectId} />}
      {activeTab === "video" && !hasScript && (
        <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
          No script yet — generate one from the Idea tab first.
        </p>
      )}

      {hasScript && <ClientReviewPanel projectId={projectId} />}
    </div>
  );
}
