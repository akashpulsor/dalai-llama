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
  useGetScriptQuery,
  useListCastProfilesQuery,
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
  { id: "idea", label: "Idea" },
  { id: "script", label: "Script" },
  { id: "screenplay", label: "Screenplay" },
  { id: "cast", label: "Character" },
  { id: "shots", label: "Shots" },
  { id: "video", label: "Video" },
];

const NEXT_TAB = Object.fromEntries(TABS.map((tab, index) => [tab.id, TABS[index + 1] || null]));

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
  const [activeTab, setActiveTab] = useState("idea");
  const [ideaExpanded, setIdeaExpanded] = useState(true);
  const [editedIdea, setEditedIdea] = useState(null);
  const [duration, setDuration] = useState(60);
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

  const hasScript = Boolean(script?.scriptText);
  const scriptNotYetGenerated = scriptError?.status === 404;

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

  const composedBrief = useMemo(() => composeBriefFromIdea(editedIdea), [editedIdea]);

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
        {activeTab === "idea" ? "Idea" : activeTab === "script" ? "Script" : activeTab === "screenplay" ? "Screenplay" : activeTab === "cast" ? "Character" : activeTab === "video" ? "Video" : "Shots"}
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
            <div>
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target duration (seconds)</label>
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="creator-input w-32 px-3 py-2.5 text-[13px] font-semibold"
              >
                {[15, 30, 45, 60, 90, 120].map((seconds) => (
                  <option key={seconds} value={seconds}>{seconds}s</option>
                ))}
              </select>
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
