// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Check, Clock3, Eye, FileText, Loader2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import AiProviderSelect from "../ai/AiProviderSelect.jsx";

const durationOptions = [15, 30, 45, 60];

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

export default function StoryScriptPanel({
  storyIdea,
  duration = 30,
  onDurationChange,
  storytellingType = "narrator_visual_mix",
  onStorytellingTypeChange,
  hookLens = "direct",
  onHookLensChange,
  onSave,
  onGenerateScreenplay,
  generateScreenplayLabel = "Generate Screenplay",
  isSaving,
  isGeneratingScreenplay,
  sourceIdea,
  onGenerateStoryScript,
  isGeneratingStoryScript,
  isSavingStoryIdea,
  aiProviders = [],
  selectedProviderCode,
  selectedProvider,
  onProviderChange,
  providersLoading,
  providersError,
}) {
  const initialBundle = normalizeStoryScriptBundle(storyIdea, duration, storytellingType, hookLens);
  const [draft, setDraft] = useState(() => initialBundle.current);
  const [originalDraft, setOriginalDraft] = useState(() => initialBundle.original);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [showChanges, setShowChanges] = useState(false);
  const timerRef = useRef(null);
  const latestRef = useRef(draft);
  const hasScript = Boolean(storyIdea?.storyScriptJson || storyIdea?.storyScriptText || storyIdea?.scriptJson?.characters?.length);
  const changeSummary = buildChangeSummary(originalDraft, draft);
  const hasUserRevision = hasExistingUserRevision(storyIdea) || changeSummary.length > 0;

  useEffect(() => {
    latestRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const nextBundle = normalizeStoryScriptBundle(storyIdea, duration, storytellingType, hookLens);
    setDraft(nextBundle.current);
    setOriginalDraft(nextBundle.original);
    latestRef.current = nextBundle.current;
    setDirty(false);
    setSaveState(hasScript ? "saved" : "idle");
  }, [duration, hasScript, hookLens, storyIdea, storytellingType]);

  useEffect(() => {
    if (!hasScript || !dirty || !onSave) return undefined;
    window.clearTimeout(timerRef.current);
    setSaveState("dirty");
    timerRef.current = window.setTimeout(async () => {
      const normalized = normalizeDraftForSave(latestRef.current);
      setSaveState("saving");
      try {
        await onSave(normalized, {
          llmGeneratedScript: originalDraft,
          changes: buildChangeSummary(originalDraft, normalized),
          hasUserRevision: true,
        });
        latestRef.current = normalized;
        setDraft(normalized);
        setDirty(false);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 900);
    return () => window.clearTimeout(timerRef.current);
  }, [dirty, draft, hasScript, onSave]);

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setSaveState("dirty");
  };

  const resetToGenerated = () => {
    const nextDraft = normalizeDraftForSave(originalDraft);
    latestRef.current = nextDraft;
    setDraft(nextDraft);
    setDirty(true);
    setSaveState("dirty");
  };

  const updateCharacter = (index, patch) => {
    updateDraft({
      characters: draft.characters.map((character, itemIndex) => itemIndex === index ? { ...character, ...patch } : character),
    });
  };

  const updateBeat = (index, patch) => {
    updateDraft({
      beats: draft.beats.map((beat, itemIndex) => itemIndex === index ? { ...beat, ...patch } : beat),
    });
  };

  if (!hasScript) {
    const canGenerateStoryScript = Boolean(sourceIdea?.id && onGenerateStoryScript);
    return (
      <section className="creator-panel flex h-full min-h-0 items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <Sparkles className="mx-auto text-purple-300" size={28} />
          <h2 className="mt-3 text-xl font-extrabold text-white">Create the storyline</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
            {sourceIdea?.title
              ? `Selected idea: ${sourceIdea.title}. Generate the full storyline, character names, personas, and backstories here.`
              : "Generate the full storyline, character names, personas, and backstories here."}
          </p>
          <div className="mx-auto mt-5 max-w-sm rounded-lg border border-white/10 bg-black/20 p-3 text-left">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
              <Clock3 size={14} className="text-purple-300" />
              Video Duration
            </div>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onDurationChange?.(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                    Number(duration) === value
                      ? "border-purple-400 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-purple-300/40"
                  }`}
                >
                  {value}s
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase text-slate-400">Storytelling Type</span>
              <select
                value={storytellingType}
                onChange={(event) => onStorytellingTypeChange?.(event.target.value)}
                className="creator-control min-h-[2.4rem] w-full rounded-lg px-3 py-2 text-sm font-bold text-slate-200 outline-none"
                aria-label="Storytelling type"
              >
                {storytellingTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase text-slate-400">Opening Hook Lens</span>
              <select
                value={hookLens}
                onChange={(event) => onHookLensChange?.(event.target.value)}
                className="creator-control min-h-[2.4rem] w-full rounded-lg px-3 py-2 text-sm font-bold text-slate-200 outline-none"
                aria-label="Opening hook lens"
              >
                {hookLensOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {canGenerateStoryScript && (
            <button
              type="button"
              onClick={onGenerateStoryScript}
              disabled={isGeneratingStoryScript || isSavingStoryIdea}
              className="creator-primary mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {isGeneratingStoryScript || isSavingStoryIdea ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Generate Storyline
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="creator-panel flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-purple-200">
            <FileText size={15} />
            Story script
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-white">Storyline</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            Review the story, beats, and characters before creating the shot-wise script.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AiProviderSelect
            providers={aiProviders}
            value={selectedProviderCode}
            selectedProvider={selectedProvider}
            onChange={onProviderChange}
            isLoading={providersLoading}
            isError={providersError}
            compact
          />
          <AutoSaveBadge state={saveState} isSaving={isSaving} />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-normal text-slate-500">Revision</p>
          <p className="mt-1 text-sm font-semibold text-slate-300">{hasUserRevision ? `${changeSummary.length} edited fields` : "Generated draft"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChanges((open) => !open)}
            className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300"
          >
            <Eye size={14} /> {showChanges ? "Hide changes" : "View changes"}
          </button>
          <button
            type="button"
            onClick={resetToGenerated}
            disabled={!hasUserRevision}
            className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-40"
          >
            <RotateCcw size={14} /> Reset to LLM
          </button>
        </div>
      </div>

      {showChanges && <ChangeSummaryPanel changes={changeSummary} />}

      <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/30 xl:p-5">
        <section className="creator-panel-muted p-5">
          <SectionHeader
            eyebrow="Storyline"
            title="Storyline"
            detail="Project title, complete storyline, hook, conflict, payoff, tone, and setting."
            meta={`${draft.duration || duration}s`}
          />
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-normal text-purple-200">Story title</p>
            <ScriptInput value={draft.projectTitle} onChange={(value) => updateDraft({ projectTitle: value })} className="mt-2 text-2xl font-black leading-9 text-white" />
            <div className="mt-3 flex flex-wrap gap-2">
              <StoryChip label={`${draft.duration || duration}s`} />
              <StoryChip label={draft.dialogueLanguage || "English"} />
              <StoryChip label={draft.screenType || "vertical"} />
              <StoryChip label={storytellingLabelFor(draft.storytellingType || storytellingType)} />
              <StoryChip label={`Hook: ${hookLensLabelFor(draft.hookLens || hookLens)}`} />
              {draft.category && <StoryChip label={draft.category} />}
            </div>
          </div>

          <div className="mt-4">
            <ScriptBlock label="Complete Storyline" value={draft.storyline} originalValue={originalDraft.storyline} onChange={(value) => updateDraft({ storyline: value })} rows={10} roomy />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <ScriptBlock label="Logline" value={draft.logline} originalValue={originalDraft.logline} onChange={(value) => updateDraft({ logline: value })} rows={3} />
            <ScriptBlock label="Hook" value={draft.hook} originalValue={originalDraft.hook} onChange={(value) => updateDraft({ hook: value })} rows={3} />
            <ScriptBlock label="Central Conflict" value={draft.centralConflict} originalValue={originalDraft.centralConflict} onChange={(value) => updateDraft({ centralConflict: value })} rows={3} />
            <ScriptBlock label="Ending Payoff" value={draft.endingPayoff} originalValue={originalDraft.endingPayoff} onChange={(value) => updateDraft({ endingPayoff: value })} rows={3} />
            <ScriptBlock label="Emotional Arc" value={draft.emotionalArc} originalValue={originalDraft.emotionalArc} onChange={(value) => updateDraft({ emotionalArc: value })} rows={3} />
            <ScriptBlock label="Setting" value={draft.setting} originalValue={originalDraft.setting} onChange={(value) => updateDraft({ setting: value })} rows={3} />
          </div>
        </section>

        <section className="creator-panel-muted p-5">
          <SectionHeader
            eyebrow="Story beats"
            title="Beats"
            detail="Story movement with emotional purpose and character focus."
            meta={`${draft.beats.length} beats`}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {draft.beats.map((beat, index) => (
              <article key={`${beat.beatNumber}-${beat.title}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-normal text-purple-200">Beat {beat.beatNumber || index + 1}</p>
                    <ScriptInput value={beat.title} onChange={(value) => updateBeat(index, { title: value })} className="mt-1 text-lg font-black leading-7 text-white" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {beat.estimatedSeconds ? <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-slate-400">{beat.estimatedSeconds}s</span> : null}
                    {isObjectChanged(originalDraft.beats[index], beat) && (
                      <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">Edited</span>
                    )}
                  </div>
                </div>
                <ScriptBlock label="Summary" value={beat.summary} onChange={(value) => updateBeat(index, { summary: value })} rows={4} />
                <div className="mt-3 grid gap-3">
                  <ScriptBlock label="Character Focus" value={beat.characterFocus} onChange={(value) => updateBeat(index, { characterFocus: value })} rows={2} />
                  <ScriptBlock label="Emotional Purpose" value={beat.emotionalPurpose} onChange={(value) => updateBeat(index, { emotionalPurpose: value })} rows={5} roomy />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-panel-muted p-5">
          <SectionHeader
            eyebrow="Characters"
            title="Characters"
            detail="Role profile, visual identity, backstory, motivation, and speaking style."
            meta={`${draft.characters.length} roles`}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {draft.characters.map((character, index) => (
              <article key={`${character.name}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-purple-200">
                      <UserRound size={14} /> Character {index + 1}
                    </div>
                    <ScriptInput value={character.name} onChange={(value) => updateCharacter(index, { name: value })} className="text-xl font-black leading-8 text-white" />
                    <ScriptInput value={character.role} onChange={(value) => updateCharacter(index, { role: value })} className="mt-1 text-sm font-bold text-slate-400" />
                  </div>
                  {isObjectChanged(originalDraft.characters[index], character) && (
                    <span className="shrink-0 rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">Edited</span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {textValue(character.gender) && <ScriptBlock label="Gender" value={character.gender} onChange={(value) => updateCharacter(index, { gender: value })} rows={1} compact />}
                  {textValue(character.age) && <ScriptBlock label="Age" value={character.age} onChange={(value) => updateCharacter(index, { age: value })} rows={1} compact />}
                  {textValue(character.look) && <ScriptBlock label="Look" value={character.look} onChange={(value) => updateCharacter(index, { look: value })} rows={2} />}
                  {textValue(character.profile) && <ScriptBlock label="Profile" value={character.profile} onChange={(value) => updateCharacter(index, { profile: value })} rows={2} />}
                  {textValue(character.persona) && <ScriptBlock label="Persona" value={character.persona} onChange={(value) => updateCharacter(index, { persona: value })} rows={2} />}
                  {textValue(character.backstory) && <ScriptBlock label="Backstory" value={character.backstory} onChange={(value) => updateCharacter(index, { backstory: value })} rows={2} />}
                  {textValue(character.motivation) && <ScriptBlock label="Motivation" value={character.motivation} onChange={(value) => updateCharacter(index, { motivation: value })} rows={2} />}
                  {textValue(character.speakingStyle) && <ScriptBlock label="Speaking Style" value={character.speakingStyle} onChange={(value) => updateCharacter(index, { speakingStyle: value })} rows={2} />}
                </div>
                {!hasCharacterDetailContent(character) && (
                  <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-500">
                    No additional character details were returned for this role.
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          {saveState === "dirty" ? "Autosaving story script..." : saveState === "saving" ? "Saving story script..." : saveState === "saved" ? "Story script saved." : saveState === "error" ? "Save failed. Edit again to retry." : "Review the story layer before screenplay."}
        </p>
        <button
          type="button"
          onClick={() => onGenerateScreenplay?.(draft)}
          disabled={dirty || saveState === "saving" || isSaving || isGeneratingScreenplay}
          className="creator-primary flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {isGeneratingScreenplay ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          {generateScreenplayLabel}
        </button>
      </div>
    </section>
  );
}

function AutoSaveBadge({ state, isSaving }) {
  const saving = state === "saving" || isSaving;
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-right">
      <p className="text-[11px] font-bold uppercase text-slate-500">Story script</p>
      <p className="mt-1 flex items-center justify-end gap-2 text-sm font-extrabold text-white">
        {saving ? <Loader2 size={14} className="animate-spin text-purple-300" /> : state === "saved" ? <Check size={14} className="text-emerald-300" /> : null}
        {saving ? "Saving" : state === "dirty" ? "Autosave pending" : state === "error" ? "Retry on edit" : "Saved"}
      </p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, detail, meta }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-normal text-purple-200">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
        {detail && <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-400">{detail}</p>}
      </div>
      {meta && <span className="w-fit rounded bg-white/[0.06] px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">{meta}</span>}
    </div>
  );
}

function ChangeSummaryPanel({ changes = [] }) {
  return (
    <div className="mb-4 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-normal text-slate-500">Changes against LLM baseline</p>
        <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-slate-400">{changes.length} total</span>
      </div>
      {changes.length === 0 ? (
        <p className="text-sm font-semibold text-slate-400">No user edits yet. The visible story still matches the generated baseline.</p>
      ) : (
        <div className="grid gap-2 xl:grid-cols-2">
          {changes.slice(0, 16).map((change) => (
            <div key={change.path} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-black uppercase text-amber-200">{change.label}</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <DiffValue label="LLM" value={change.original} />
                <DiffValue label="User" value={change.current} />
              </div>
            </div>
          ))}
          {changes.length > 16 && (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-slate-400">
              {changes.length - 16} more field changes are tracked in the save payload.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffValue({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase text-slate-600">{label}</p>
      <p className="mt-1 line-clamp-4 text-xs font-semibold leading-5 text-slate-300">{textValue(value) || "-"}</p>
    </div>
  );
}

function StoryChip({ label }) {
  return (
    <span className="rounded bg-white/[0.06] px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">
      {label}
    </span>
  );
}

function ScriptBlock({ label, value, originalValue, onChange, rows = 3, roomy = false, compact = false }) {
  const changed = hasMeaningfulChange(originalValue, value);
  return (
    <label className={`block rounded-lg border border-white/10 bg-white/[0.035] ${roomy ? "p-4" : compact ? "p-2.5" : "p-3"}`}>
      <span className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-normal text-slate-500">
        {label}
        {changed && <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[9px] text-amber-200">Edited</span>}
      </span>
      {rows === 1 ? <ScriptInput value={value} onChange={onChange} /> : <ScriptArea value={value} onChange={onChange} rows={rows} roomy={roomy} />}
    </label>
  );
}

function ScriptInput({ value, onChange, className = "", readOnly = false }) {
  return (
    <input
      value={textValue(value)}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      className={`w-full border-0 bg-transparent px-0 py-1 text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:ring-0 ${readOnly ? "cursor-default" : ""} ${className}`}
    />
  );
}

function ScriptArea({ value, onChange, rows = 3, roomy = false }) {
  return (
    <textarea
      value={textValue(value)}
      onChange={(event) => onChange?.(event.target.value)}
      rows={rows}
      className={`w-full resize-y overflow-y-auto border-0 bg-transparent px-0 py-1 font-medium text-slate-300 outline-none placeholder:text-slate-600 focus:ring-0 ${roomy ? "max-h-[32rem] text-base leading-8" : "max-h-72 text-sm leading-6"}`}
    />
  );
}

function normalizeStoryScriptBundle(idea, duration, storytellingType = "narrator_visual_mix", hookLens = "direct") {
  const source = idea?.storyScriptJson || idea?.scriptJson || {};
  const originalSource = source?.llmGeneratedScript || source?.originalLlmScript || source?.generatedScript || stripRevisionMeta(source);
  const currentSource = source?.userRevision || source?.acceptedScript || source?.currentRevision || stripRevisionMeta(source);
  return {
    original: normalizeStoryScriptSource(originalSource, idea, duration, storytellingType, hookLens),
    current: normalizeStoryScriptSource(currentSource, idea, duration, storytellingType, hookLens),
  };
}

function normalizeStoryScriptSource(source = {}, idea, duration, storytellingType = "narrator_visual_mix", hookLens = "direct") {
  return {
    projectTitle: source.projectTitle || idea?.title || "Creator Story Script",
    duration: source.duration || idea?.durationSeconds || duration || 30,
    category: source.category || idea?.category || "",
    dialogueLanguage: source.dialogueLanguage || idea?.dialogueLanguage || "English",
    screenType: source.screenType || idea?.screenType || "vertical",
    storytellingType: source.storytellingType || idea?.storytellingType || storytellingType || "narrator_visual_mix",
    storytellingGuidance: source.storytellingGuidance || idea?.storytellingGuidance || {},
    hookLens: source.hookLens || idea?.hookLens || hookLens || "direct",
    hookLensGuidance: source.hookLensGuidance || idea?.hookLensGuidance || {},
    hookBridge: source.hookBridge || idea?.hookBridge || {},
    factualityNotes: source.factualityNotes || idea?.factualityNotes || {},
    provider: source.provider || idea?.provider || "",
    model: source.model || idea?.model || "",
    logline: source.logline || idea?.description || "A short-form story generated from the saved idea.",
    centralConflict: source.centralConflict || "The main character wants change but hesitates at the first real step.",
    storyline: source.storyline || idea?.storyScriptText || idea?.scriptText || "",
    emotionalArc: source.emotionalArc || "Doubt -> recognition -> small action -> payoff",
    hook: source.hook || "Open on the decision point before explaining the idea.",
    endingPayoff: source.endingPayoff || "End with a clear line or look the audience can save.",
    setting: source.setting || "Everyday phone-friendly location",
    inferredTone: source.inferredTone || idea?.inferredTone || "",
    characters: normalizeCharacters(source.characters),
    beats: normalizeBeats(source.beats),
  };
}

function stripRevisionMeta(source = {}) {
  if (!source || typeof source !== "object") return {};
  const {
    llmGeneratedScript,
    originalLlmScript,
    generatedScript,
    userRevision,
    acceptedScript,
    currentRevision,
    revisionAudit,
    editAudit,
    auditTrail,
    ...storyFields
  } = source;
  return storyFields;
}

function normalizeCharacters(characters) {
  const list = Array.isArray(characters) && characters.length ? characters : [
    { name: "Priya", role: "Main creator", gender: "Female", age: "26", look: "Everyday casual outfit, natural face, expressive eyes.", profile: "Beginner creator and emotional point of view for the short.", persona: "Relatable beginner", backstory: "Has tried before and wants this attempt to feel real.", motivation: "Find one small win.", speakingStyle: "Natural and honest" },
    { name: "Neha", role: "Support character", gender: "Female", age: "27", look: "Simple casual look with grounded body language.", profile: "Practical friend who gives a tiny useful push.", persona: "Practical friend", backstory: "Knows the main character overthinks the first step.", motivation: "Give a tiny useful push.", speakingStyle: "Casual and grounded" },
  ];
  return list.map((character) => ({
    name: character.name || "Character",
    role: character.role || "Story character",
    gender: character.gender || "",
    age: character.age || character.ageRange || "",
    ageRange: character.ageRange || "",
    look: character.look || character.visualIdentity || "",
    profile: character.profile || character.persona || "",
    persona: character.persona || "",
    backstory: character.backstory || "",
    motivation: character.motivation || "",
    fearOrBlock: character.fearOrBlock || "",
    relationshipToStory: character.relationshipToStory || "",
    speakingStyle: character.speakingStyle || "",
    visualIdentity: character.visualIdentity || "",
  }));
}

function normalizeBeats(beats) {
  const list = Array.isArray(beats) && beats.length ? beats : [
    { beatNumber: 1, title: "Decision Point", summary: "The main character hesitates.", emotionalPurpose: "Create recognition.", estimatedSeconds: 6 },
    { beatNumber: 2, title: "The Block", summary: "The real excuse becomes visible.", emotionalPurpose: "Build relatability.", estimatedSeconds: 8 },
    { beatNumber: 3, title: "Small Push", summary: "A tiny action begins.", emotionalPurpose: "Shift energy.", estimatedSeconds: 8 },
    { beatNumber: 4, title: "Payoff", summary: "The character lands the emotional close.", emotionalPurpose: "Deliver save/share value.", estimatedSeconds: 8 },
  ];
  return list.map((beat, index) => ({
    beatNumber: beat.beatNumber || index + 1,
    title: beat.title || `Beat ${index + 1}`,
    summary: beat.summary || "",
    characterFocus: beat.characterFocus || "",
    emotionalPurpose: beat.emotionalPurpose || "",
    estimatedSeconds: beat.estimatedSeconds || 0,
  }));
}

function normalizeDraftForSave(draft) {
  return {
    ...draft,
    duration: Number(draft.duration || 30),
    storytellingType: draft.storytellingType || "narrator_visual_mix",
    storytellingGuidance: draft.storytellingGuidance || {},
    hookLens: draft.hookLens || "direct",
    hookLensGuidance: draft.hookLensGuidance || {},
    hookBridge: draft.hookBridge || {},
    factualityNotes: draft.factualityNotes || {},
    provider: draft.provider || "",
    model: draft.model || "",
    characters: normalizeCharacters(draft.characters),
    beats: normalizeBeats(draft.beats),
  };
}

function storytellingLabelFor(value) {
  return storytellingTypeOptions.find((option) => option.value === value)?.label || "Narrator + Visuals";
}

function hookLensLabelFor(value) {
  return hookLensOptions.find((option) => option.value === value)?.label || "Direct";
}

function buildChangeSummary(original = {}, current = {}) {
  const changes = [];
  const topLevelFields = [
    ["projectTitle", "Story title"],
    ["logline", "Logline"],
    ["hook", "Hook"],
    ["centralConflict", "Central conflict"],
    ["endingPayoff", "Ending payoff"],
    ["emotionalArc", "Emotional arc"],
    ["setting", "Setting"],
    ["storyline", "Complete storyline"],
  ];

  topLevelFields.forEach(([field, label]) => {
    addChange(changes, `story.${field}`, label, original?.[field], current?.[field]);
  });

  const maxCharacters = Math.max(original?.characters?.length || 0, current?.characters?.length || 0);
  for (let index = 0; index < maxCharacters; index += 1) {
    const left = original?.characters?.[index] || {};
    const right = current?.characters?.[index] || {};
    ["name", "role", "look", "profile", "persona", "backstory", "motivation", "speakingStyle"].forEach((field) => {
      addChange(changes, `characters.${index}.${field}`, `Character ${index + 1} ${fieldLabel(field)}`, left[field], right[field]);
    });
  }

  const maxBeats = Math.max(original?.beats?.length || 0, current?.beats?.length || 0);
  for (let index = 0; index < maxBeats; index += 1) {
    const left = original?.beats?.[index] || {};
    const right = current?.beats?.[index] || {};
    ["title", "summary", "characterFocus", "emotionalPurpose"].forEach((field) => {
      addChange(changes, `beats.${index}.${field}`, `Beat ${index + 1} ${fieldLabel(field)}`, left[field], right[field]);
    });
  }

  return changes;
}

function addChange(changes, path, label, original, current) {
  if (!hasMeaningfulChange(original, current)) return;
  changes.push({ path, label, original: textValue(original), current: textValue(current) });
}

function hasExistingUserRevision(idea) {
  const source = idea?.storyScriptJson || idea?.scriptJson || {};
  return Boolean(source?.userRevision || source?.revisionAudit?.edited);
}

function isObjectChanged(original, current) {
  return JSON.stringify(original || {}) !== JSON.stringify(current || {});
}

function hasCharacterDetailContent(character = {}) {
  return ["gender", "age", "look", "profile", "persona", "backstory", "motivation", "speakingStyle"]
    .some((field) => Boolean(textValue(character[field]).trim()));
}

function hasMeaningfulChange(original, current) {
  return textValue(original).trim() !== textValue(current).trim();
}

function fieldLabel(field) {
  return String(field || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
}

function textValue(value) {
  if (value == null || value === "") return "";
  return String(value);
}
