// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FileText, Loader2, RefreshCw, Save, Sparkles } from "lucide-react";
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
  storytellingType = "narrator_visual_mix",
  onStorytellingTypeChange,
  hookLens = "direct",
  onHookLensChange,
  productionStyle = "hybrid",
  onProductionStyleChange,
  productionStyleOptions = [],
  hybridSceneMode = "ask_speaking_scenes",
  onHybridSceneModeChange,
  hybridSceneModeOptions = [],
  brollStyle = "cinematic_social",
  onBrollStyleChange,
  brollStyleOptions = [],
  captionStyle = "bold_keyword",
  onCaptionStyleChange,
  captionStyleOptions = [],
  aiProviders = [],
  selectedProviderCode,
  selectedProvider,
  onProviderChange,
  providersLoading,
  providersError,
  pageInfo,
  onPageChange,
  onGenerateIdeas,
  campaignAngleSuggestions = [],
  selectedCampaignAngle = null,
  onGenerateCampaignAngles,
  onSelectCampaignAngle,
  isGeneratingCampaignAngles = false,
  isSelectingCampaignAngle = false,
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
  weeklyIdeaTags = {},
  weeklyIdeaTagsLoading = false,
  onLoadWeeklyIdeaTags,
  onSelectWeeklyIdeaTag,
  onRefreshWeeklyIdeaTags,
}) {
  const [expandedIdeaIds, setExpandedIdeaIds] = useState(() => new Set());
  const weeklyTagsAutoLoadRef = useRef(false);
  const page = pageInfo?.number || 0;
  const totalPages = Math.max(1, pageInfo?.totalPages || 1);
  const totalElements = pageInfo?.totalElements || ideas.length;
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId);
  const hasIdeas = ideas.length > 0;
  const weeklyIdeaCloud = normalizeWeeklyIdeaTags(weeklyIdeaTags);
  const hasWeeklyIdeaTags = weeklyIdeaCloud.tags.length > 0;

  const toggleIdeaDetails = (ideaId) => {
    setExpandedIdeaIds((current) => {
      const next = new Set(current);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
      return next;
    });
  };

  const handleWeeklyIdeaTagClick = (tag) => {
    const prompt = limitWords(String(tag?.prompt || tag?.title || tag?.label || "").trim(), 50);
    if (!prompt) return;
    onSelectWeeklyIdeaTag?.({ ...tag, prompt });
  };

  useEffect(() => {
    if (lockedBrief || projectMode || weeklyIdeaTagsLoading || hasWeeklyIdeaTags || weeklyTagsAutoLoadRef.current) return;
    weeklyTagsAutoLoadRef.current = true;
    onLoadWeeklyIdeaTags?.();
  }, [hasWeeklyIdeaTags, lockedBrief, onLoadWeeklyIdeaTags, projectMode, weeklyIdeaTagsLoading]);

  return (
    <section className="creator-panel flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-purple-200">
            <Sparkles size={15} />
            {projectMode && !hasIdeas ? "Project idea generation" : projectMode ? "Project story idea" : "20 AI story ideas"}
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-white">{projectMode && !hasIdeas ? "Generate story ideas" : projectMode ? "Selected story idea" : lockedBrief ? "Story ideas" : "New idea"}</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            {projectMode && !hasIdeas
              ? "Generate story ideas from this project's saved brief before opening the story."
              : projectMode
              ? "This project already has generated story ideas. Review the selected idea and continue from the saved stage."
              : lockedBrief
              ? "Review generated ideas, save one, then continue to the script."
              : "Pick a trend tag below or save your own topic from Creative Brief."}
          </p>
        </div>
        {lockedBrief ? (
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-right">
            <p className="text-[11px] font-bold uppercase text-slate-500">Saved brief</p>
            <p className="mt-1 max-w-[22rem] truncate text-sm font-extrabold text-white">{lockedBrief.title}</p>
          </div>
        ) : null}
      </div>

      {!lockedBrief ? (
        <div className="flex flex-1 flex-col justify-center rounded-lg border border-dashed border-white/10 bg-black/20 p-5">
          <div className="mx-auto w-full max-w-5xl">
            {projectMode ? (
              <p className="text-center text-sm font-semibold leading-6 text-slate-400">
                No project story idea was restored for this project yet.
              </p>
            ) : (
              <WeeklyIdeaCloud
                cloud={weeklyIdeaCloud}
                isLoading={weeklyIdeaTagsLoading}
                hasTags={hasWeeklyIdeaTags}
                onRefresh={onRefreshWeeklyIdeaTags}
                onSelectTag={handleWeeklyIdeaTagClick}
              />
            )}
          </div>
        </div>
      ) : !ideas.length ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <div className="w-full max-w-2xl">
            <p className="text-sm font-semibold leading-6 text-slate-400">
              {isLoading
                ? "Generating story ideas from the saved brief..."
                : "No story ideas are available for this project yet."}
            </p>
            <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.055] p-3 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-normal text-emerald-100">Campaign angle</p>
                <button
                  type="button"
                  onClick={onGenerateCampaignAngles}
                  disabled={isGeneratingCampaignAngles || isSelectingCampaignAngle}
                  className="creator-control inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50"
                >
                  {isGeneratingCampaignAngles ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {campaignAngleSuggestions.length ? "Refresh angles" : "Generate AI angles"}
                </button>
              </div>
              {campaignAngleSuggestions.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {campaignAngleSuggestions.slice(0, 3).map((angle) => {
                    const selected = selectedCampaignAngle?.id === angle.id
                      || (selectedCampaignAngle?.title && selectedCampaignAngle.title === angle.title);
                    return (
                      <button
                        key={angle.id || angle.title}
                        type="button"
                        onClick={() => onSelectCampaignAngle?.(angle)}
                        disabled={isSelectingCampaignAngle}
                        aria-pressed={selected}
                        className={`min-h-[5.5rem] rounded-md border px-3 py-2 text-left transition disabled:opacity-60 ${
                          selected
                            ? "border-emerald-300/55 bg-emerald-400/[0.14]"
                            : "border-white/10 bg-black/20 hover:border-emerald-300/35 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-black text-white">
                          {selected && <Check size={13} className="text-emerald-200" />}
                          {angle.title}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-slate-400">{angle.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <WorkflowSetupControls
              duration={duration}
              onDurationChange={onDurationChange}
              dialogueLanguage={dialogueLanguage}
              onDialogueLanguageChange={onDialogueLanguageChange}
              screenType={screenType}
              onScreenTypeChange={onScreenTypeChange}
              storytellingType={storytellingType}
              onStorytellingTypeChange={onStorytellingTypeChange}
              hookLens={hookLens}
              onHookLensChange={onHookLensChange}
              productionStyle={productionStyle}
              onProductionStyleChange={onProductionStyleChange}
              productionStyleOptions={productionStyleOptions}
              hybridSceneMode={hybridSceneMode}
              onHybridSceneModeChange={onHybridSceneModeChange}
              hybridSceneModeOptions={hybridSceneModeOptions}
              brollStyle={brollStyle}
              onBrollStyleChange={onBrollStyleChange}
              brollStyleOptions={brollStyleOptions}
              captionStyle={captionStyle}
              onCaptionStyleChange={onCaptionStyleChange}
              captionStyleOptions={captionStyleOptions}
              aiProviders={aiProviders}
              selectedProviderCode={selectedProviderCode}
              selectedProvider={selectedProvider}
              onProviderChange={onProviderChange}
              providersLoading={providersLoading}
              providersError={providersError}
            />
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
              <select
                value={storytellingType}
                onChange={(event) => onStorytellingTypeChange?.(event.target.value)}
                className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                aria-label="Storytelling type"
              >
                {storytellingTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={hookLens}
                onChange={(event) => onHookLensChange?.(event.target.value)}
                className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                aria-label="Opening hook lens"
              >
                {hookLensOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
              {productionStyleOptions.length > 0 && (
                <select
                  value={productionStyle}
                  onChange={(event) => onProductionStyleChange?.(event.target.value)}
                  className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                  aria-label="Production style"
                >
                  {productionStyleOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {productionStyle === "hybrid" && hybridSceneModeOptions.length > 0 && (
                <select
                  value={hybridSceneMode}
                  onChange={(event) => onHybridSceneModeChange?.(event.target.value)}
                  className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                  aria-label="Hybrid scene mode"
                >
                  {hybridSceneModeOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {brollStyleOptions.length > 0 && (
                <select
                  value={brollStyle}
                  onChange={(event) => onBrollStyleChange?.(event.target.value)}
                  className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                  aria-label="B-roll style"
                >
                  {brollStyleOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {captionStyleOptions.length > 0 && (
                <select
                  value={captionStyle}
                  onChange={(event) => onCaptionStyleChange?.(event.target.value)}
                  className="creator-control min-h-[2.125rem] rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                  aria-label="Caption style"
                >
                  {captionStyleOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
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

function WorkflowSetupControls({
  duration,
  onDurationChange,
  dialogueLanguage,
  onDialogueLanguageChange,
  screenType,
  onScreenTypeChange,
  storytellingType,
  onStorytellingTypeChange,
  hookLens,
  onHookLensChange,
  productionStyle,
  onProductionStyleChange,
  productionStyleOptions = [],
  hybridSceneMode,
  onHybridSceneModeChange,
  hybridSceneModeOptions = [],
  brollStyle,
  onBrollStyleChange,
  brollStyleOptions = [],
  captionStyle,
  onCaptionStyleChange,
  captionStyleOptions = [],
  aiProviders,
  selectedProviderCode,
  selectedProvider,
  onProviderChange,
  providersLoading,
  providersError,
}) {
  return (
    <div className="mx-auto mt-5 grid min-w-0 gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
      <div className="min-w-0 sm:col-span-2 lg:col-span-1">
        <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-500">Video Duration</p>
        <div className="grid min-h-[2.75rem] grid-cols-4 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
          {[15, 30, 45, 60].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onDurationChange?.(value)}
              className={`min-w-0 rounded-md px-2 py-1.5 text-xs font-black transition ${
                Number(duration) === value
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              }`}
            >
              {value}s
            </button>
          ))}
        </div>
      </div>
      <label className="block min-w-0">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">Language</span>
        <select
          value={dialogueLanguage}
          onChange={(event) => onDialogueLanguageChange?.(event.target.value)}
          className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
          aria-label="Dialogue language"
        >
          {dialogueLanguageOptions.map((option) => (
            <option key={option} value={option} className="bg-slate-950 text-slate-100">
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-500">Format</p>
        <div className="grid min-h-[2.75rem] grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
          {screenTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onScreenTypeChange?.(option.value)}
              className={`min-w-0 rounded-md px-2 py-1.5 text-xs font-black transition ${
                screenType === option.value
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              }`}
            >
              <span className="block truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      <label className="block min-w-0">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">Storytelling</span>
        <select
          value={storytellingType}
          onChange={(event) => onStorytellingTypeChange?.(event.target.value)}
          className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
          aria-label="Storytelling type"
        >
          {storytellingTypeOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">Hook Lens</span>
        <select
          value={hookLens}
          onChange={(event) => onHookLensChange?.(event.target.value)}
          className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
          aria-label="Opening hook lens"
        >
          {hookLensOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {productionStyleOptions.length > 0 && (
        <label className="block min-w-0">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">Production</span>
          <select
            value={productionStyle}
            onChange={(event) => onProductionStyleChange?.(event.target.value)}
            className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
            aria-label="Production style"
          >
            {productionStyleOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {productionStyle === "hybrid" && hybridSceneModeOptions.length > 0 && (
        <label className="block min-w-0">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">Scene Choice</span>
          <select
            value={hybridSceneMode}
            onChange={(event) => onHybridSceneModeChange?.(event.target.value)}
            className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
            aria-label="Hybrid scene choice"
          >
            {hybridSceneModeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {brollStyleOptions.length > 0 && (
        <label className="block min-w-0">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">B-roll</span>
          <select
            value={brollStyle}
            onChange={(event) => onBrollStyleChange?.(event.target.value)}
            className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
            aria-label="B-roll style"
          >
            {brollStyleOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {captionStyleOptions.length > 0 && (
        <label className="block min-w-0">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-normal text-slate-500">Captions</span>
          <select
            value={captionStyle}
            onChange={(event) => onCaptionStyleChange?.(event.target.value)}
            className="creator-control min-h-[2.75rem] w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-200 outline-none"
            aria-label="Caption style"
          >
            {captionStyleOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="min-w-0 sm:col-span-2 lg:col-span-3 2xl:col-span-1">
        <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-500">AI</p>
        <AiProviderSelect
          providers={aiProviders}
          value={selectedProviderCode}
          selectedProvider={selectedProvider}
          onChange={onProviderChange}
          isLoading={providersLoading}
          isError={providersError}
          compact
        />
      </div>
    </div>
  );
}

const dialogueLanguageOptions = ["English", "Hinglish", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi"];

const screenTypeOptions = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
];

const storytellingTypeOptions = [
  { value: "narrator_visual_mix", label: "Narrator + Visuals" },
  { value: "talking_head_explainer", label: "Talking Head" },
  { value: "visual_voiceover", label: "Visual VO" },
  { value: "dialogue_scene", label: "Dialogue Scene" },
  { value: "dramatic_scene", label: "Drama Scene" },
];

const hookLensOptions = [
  { value: "direct", label: "Direct" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "philosophy", label: "Philosophy" },
  { value: "science", label: "Science" },
  { value: "culture", label: "Culture" },
  { value: "psychology", label: "Psychology" },
  { value: "economics", label: "Economics" },
];

function WeeklyIdeaCloud({ cloud, isLoading, hasTags, onRefresh, onSelectTag }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-purple-200" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-normal text-purple-100">Trend moments for marketing</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Pick a tag to copy its brief into the Creative Brief topic box.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="creator-control inline-flex shrink-0 items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-100 disabled:opacity-50"
          title="Refresh trend moments"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Refresh moments
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {isLoading && !hasTags ? (
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-400">
            Loading weekly trend tags...
          </p>
        ) : null}
        {cloud.categories.map((category) => {
          if (!category.ideas.length) return null;
          return (
            <div key={category.category || category.label}>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-normal text-slate-500">{category.label}</p>
              <div className="flex flex-wrap gap-2">
                {category.ideas.map((tag) => (
                  <button
                    key={tag.id || `${category.category}-${tag.title || tag.label}`}
                    type="button"
                    onClick={() => onSelectTag?.(tag)}
                    className="max-w-full rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-purple-300/50 hover:bg-purple-500/15 hover:text-white"
                    title={tag.prompt || tag.title || tag.label}
                  >
                    <span className="block max-w-[220px] truncate">{tag.label || tag.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {!isLoading && !hasTags ? (
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-400">
            Trend moments are not loaded yet. Refresh moments to create the first marketing cloud.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function noteToText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(noteToText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${noteToText(item)}`).join("; ");
  }
  return String(value);
}

function normalizeWeeklyIdeaTags(payload = {}) {
  const categoryOrder = ["history", "politics", "sports", "entertainment", "bollywood"];
  const labels = {
    history: "History",
    politics: "Politics",
    sports: "Sports",
    entertainment: "Entertainment",
    bollywood: "Bollywood",
  };
  const categories = Array.isArray(payload?.categories) ? payload.categories : [];
  const normalizedCategories = categoryOrder.map((categoryCode) => {
    const matched = categories.find((category) => normalizeCode(category?.category || category?.code || category?.label) === categoryCode) || {};
    const ideas = Array.isArray(matched?.ideas) ? matched.ideas : [];
    return {
      category: categoryCode,
      label: matched?.label || labels[categoryCode],
      ideas: ideas
        .map((idea, index) => normalizeWeeklyIdeaTag(idea, categoryCode, index))
        .filter((idea) => idea.title || idea.prompt),
    };
  });

  const tagsFromCategories = normalizedCategories.flatMap((category) => category.ideas);
  const flatTags = Array.isArray(payload?.tags)
    ? payload.tags
        .map((tag, index) => normalizeWeeklyIdeaTag(tag, normalizeCode(tag?.category || tag?.categoryCode || "misc"), index))
        .filter((tag) => tag.title || tag.prompt)
    : [];
  const displayCategories = tagsFromCategories.length
    ? normalizedCategories
    : normalizedCategories.map((category) => ({
        ...category,
        ideas: flatTags.filter((tag) => tag.category === category.category),
      }));

  return {
    categories: displayCategories,
    tags: displayCategories.flatMap((category) => category.ideas),
  };
}

function normalizeWeeklyIdeaTag(item = {}, categoryCode, index) {
  const title = String(item?.title || item?.label || item?.tag || item?.topic || "").trim();
  const prompt = String(item?.prompt || item?.creatorPrompt || item?.brief || title).trim();
  return {
    ...item,
    id: item?.id || `${categoryCode}-${index}-${title}`,
    category: categoryCode,
    label: title,
    title,
    prompt,
  };
}

function normalizeCode(value) {
  const code = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (code === "sport") return "sports";
  if (code === "bolly_wood" || code === "bolly") return "bollywood";
  if (["political", "political_news", "current_affairs", "election", "elections"].includes(code)) return "politics";
  return code;
}

function limitWords(value, maxWords) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(" ");
}
