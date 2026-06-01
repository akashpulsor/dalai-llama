// @ts-nocheck
import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, FileText, Loader2, Save, Sparkles } from "lucide-react";
import AiProviderSelect from "../ai/AiProviderSelect.jsx";

export default function IdeaCandidatesPanel({
  lockedBrief,
  ideas = [],
  selectedIdeaId,
  duration,
  onDurationChange,
  dialogueLanguage = "English",
  onDialogueLanguageChange,
  screenType = "vertical",
  onScreenTypeChange,
  aiProviders = [],
  selectedProviderCode,
  selectedProvider,
  onProviderChange,
  providersLoading,
  providersError,
  pageInfo,
  onPageChange,
  onGenerateIdeas,
  showGenerateIdeasAction = true,
  onSelectIdea,
  onSaveStoryIdea,
  onGenerateScript,
  isLoading,
  isSavingStoryIdea,
  isGeneratingScript,
  savedStoryIdeaId,
  storyScriptReady = false,
  screenplayReady = false,
  shotPlansReady = false,
  onShowStoryScript,
  onShowScreenplay,
  onShowShots,
  projectMode = false,
}) {
  const [expandedIdeaIds, setExpandedIdeaIds] = useState(() => new Set());
  const page = pageInfo?.number || 0;
  const totalPages = Math.max(1, pageInfo?.totalPages || 1);
  const totalElements = pageInfo?.totalElements || ideas.length;
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId);
  const hasIdeas = ideas.length > 0;

  const toggleIdeaDetails = (ideaId) => {
    setExpandedIdeaIds((current) => {
      const next = new Set(current);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
      return next;
    });
  };

  return (
    <section className="creator-panel flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-purple-200">
            <Sparkles size={15} />
            {projectMode && !hasIdeas ? "Project idea generation" : projectMode ? "Project story idea" : "20 AI story ideas"}
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-white">{projectMode && !hasIdeas ? "Generate story ideas" : projectMode ? "Selected story idea" : "Select story idea"}</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            {projectMode && !hasIdeas
              ? "Generate story ideas from this project's saved brief before opening the story."
              : projectMode
              ? "This project already has generated story ideas. Review the selected idea and continue from the saved stage."
              : "Generated from the locked brief. Save one story idea, then generate the complete script."}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-[11px] font-bold uppercase text-slate-500">Locked brief</p>
          <p className="mt-1 max-w-[22rem] truncate text-sm font-extrabold text-white">
            {lockedBrief?.title || "Select a trend or original idea first"}
          </p>
        </div>
      </div>

      {!lockedBrief ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <p className="max-w-md text-sm font-semibold leading-6 text-slate-400">
            {projectMode
              ? "No project story idea was restored for this project yet."
              : "Lock a trend or original idea from the Creative Brief panel to generate paginated AI idea options here."}
          </p>
        </div>
      ) : !ideas.length ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <div className="max-w-md">
            <p className="text-sm font-semibold leading-6 text-slate-400">
              {isLoading
                ? "Generating story ideas from the saved brief..."
                : "No story ideas are available for this project yet."}
            </p>
            {showGenerateIdeasAction && (
              <button
                type="button"
                onClick={onGenerateIdeas}
                disabled={isLoading}
                className="creator-primary mx-auto mt-4 flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isLoading ? "Generating Ideas..." : "Generate Story Ideas"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid flex-1 auto-rows-fr gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {ideas.map((idea, index) => {
              const selected = selectedIdeaId === idea.id;
              const notes = idea.creativeNotes || {};
              const expanded = expandedIdeaIds.has(idea.id);
              const description = idea.description || idea.summary || "No description returned for this idea.";
              const detailNotes = [
                { label: "Hook", value: notes.hook },
                { label: "Audience Promise", value: notes.audiencePromise },
                { label: "Why It Works", value: notes.whyItWorks },
                { label: "Story Shape", value: notes.storyShape },
                { label: "Selection Reason", value: notes.selectionReason },
              ].filter((item) => item.value);
              return (
                <article
                  key={idea.id}
                  className={`group flex min-h-[15rem] flex-col rounded-lg border p-4 text-left transition ${
                    selected
                      ? "border-purple-300 bg-purple-500/18 shadow-[0_0_0_1px_rgba(168,85,247,0.22)]"
                      : "border-white/10 bg-white/[0.035] hover:border-purple-300/40 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="rounded-md bg-black/25 px-2 py-1 text-[11px] font-black text-slate-400">
                      #{page * (pageInfo?.size || 5) + index + 1}
                    </span>
                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={13} />
                      </span>
                    )}
                    {savedStoryIdeaId === idea.id && !selected && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black text-emerald-200">
                        Saved
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={() => onSelectIdea?.(idea.id)} className="block text-left">
                    <h3 className="text-base font-extrabold leading-6 text-white">{idea.title}</h3>
                    <p className={`mt-2 text-sm font-medium leading-6 text-slate-400 ${expanded ? "" : "line-clamp-4"}`}>
                      {description}
                    </p>
                  </button>
                  {(expanded || detailNotes.length > 0) && (
                    <div className={`${expanded ? "mt-3 block" : "hidden"} space-y-2 rounded-lg border border-white/10 bg-black/20 p-3`}>
                      {detailNotes.length ? detailNotes.map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{item.label}</p>
                          <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-300">{noteToText(item.value)}</p>
                        </div>
                      )) : (
                        <p className="text-xs font-semibold text-slate-500">No extra creative notes returned for this idea.</p>
                      )}
                    </div>
                  )}
                  <div className="mt-auto pt-3">
                    <p className="line-clamp-2 text-[11px] font-bold leading-5 text-purple-200">{notes.hook || notes.targetEmotion || idea.source || "Generated idea"}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(idea.hashtags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectIdea?.(idea.id)}
                        className={`rounded-md px-3 py-1.5 text-[11px] font-black transition ${
                          selected ? "bg-purple-600 text-white" : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] hover:text-white"
                        }`}
                      >
                        {selected ? "Selected" : "Select"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleIdeaDetails(idea.id)}
                        className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-black text-slate-300 transition hover:border-purple-300/40 hover:text-white"
                      >
                        {expanded ? "Collapse" : "Read full idea"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">
                Page {page + 1} of {totalPages} - {totalElements} ideas
              </p>
              <p className="mt-1 truncate text-xs font-bold text-slate-300">
                Selected: {selectedIdea?.title || "Pick one story idea"}
              </p>
              {selectedIdea && (
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                  {selectedIdea.description || selectedIdea.summary}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                {[15, 30, 45, 60].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onDurationChange?.(value)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-black transition ${
                      Number(duration) === value
                        ? "bg-purple-600 text-white"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    {value}s
                  </button>
                ))}
              </div>
              <select
                value={dialogueLanguage}
                onChange={(event) => onDialogueLanguageChange?.(event.target.value)}
                className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                aria-label="Dialogue language"
              >
                {dialogueLanguageOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-950 text-slate-100">
                    {option}
                  </option>
                ))}
              </select>
              <AiProviderSelect
                providers={aiProviders}
                value={selectedProviderCode}
                selectedProvider={selectedProvider}
                onChange={onProviderChange}
                isLoading={providersLoading}
                isError={providersError}
                compact
              />
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                {screenTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onScreenTypeChange?.(option.value)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-black transition ${
                      screenType === option.value
                        ? "bg-purple-600 text-white"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onSaveStoryIdea}
                disabled={!selectedIdeaId || savedStoryIdeaId === selectedIdeaId || isSavingStoryIdea || isGeneratingScript}
                className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                {isSavingStoryIdea ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {savedStoryIdeaId === selectedIdeaId ? "Story Idea Saved" : "Save Story Idea"}
              </button>
              <button
                type="button"
                onClick={storyScriptReady ? onShowStoryScript : onGenerateScript}
                disabled={!selectedIdeaId || (!storyScriptReady && (isSavingStoryIdea || isGeneratingScript))}
                className="creator-primary flex items-center gap-2 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {!storyScriptReady && (isSavingStoryIdea || isGeneratingScript) ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {storyScriptReady ? "Show Story Script" : savedStoryIdeaId === selectedIdeaId ? "Generate Story Script" : "Save + Generate Story"}
              </button>
              {storyScriptReady && (
                <button
                  type="button"
                  onClick={onShowScreenplay}
                  className={`creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold ${screenplayReady ? "text-emerald-100" : "text-slate-200"}`}
                >
                  <FileText size={14} />
                  {screenplayReady ? "Show Screenplay" : "Generate Screenplay"}
                </button>
              )}
              {screenplayReady && (
                <button
                  type="button"
                  onClick={onShowShots}
                  className={`creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold ${shotPlansReady ? "text-emerald-100" : "text-slate-200"}`}
                >
                  <FileText size={14} />
                  {shotPlansReady ? "Show Shots" : "Generate Shot Plans"}
                </button>
              )}
              <button
                type="button"
                onClick={() => onPageChange?.(Math.max(0, page - 1))}
                disabled={page <= 0 || isLoading}
                className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const dialogueLanguageOptions = ["English", "Hinglish", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi"];

const screenTypeOptions = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
];

function noteToText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(noteToText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${noteToText(item)}`).join("; ");
  }
  return String(value);
}
