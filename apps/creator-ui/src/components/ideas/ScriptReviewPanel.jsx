// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FileText, GripVertical, Loader2, MessageSquareText, Plus, RefreshCw, Save, Send, Sparkles, Trash2, Users } from "lucide-react";

const AUTOSAVE_DELAY_MS = 1800;

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

export default function ScriptReviewPanel({
  scriptIdea,
  duration = 30,
  storytellingType = "narrator_visual_mix",
  hookLens = "direct",
  onContinue,
  onSave,
  onGenerate,
  isGenerating = false,
  isSaving,
  humanReviewOrder,
  onSubmitHumanReview,
  isSubmittingHumanReview = false,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [draft, setDraft] = useState(() => normalizeEditableScript(scriptIdea, duration, storytellingType, hookLens));
  const [draggedShotIndex, setDraggedShotIndex] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const saveTimerRef = useRef(null);
  const latestDraftRef = useRef(draft);
  const shots = draft?.shots || [];
  const totalPages = shots.length + 1;
  const isOverviewPage = pageIndex === 0;
  const shotIndex = Math.max(0, pageIndex - 1);
  const page = shots[shotIndex] || shots[0];
  const hasScript = Boolean(scriptIdea?.scriptId || scriptIdea?.scriptText || scriptIdea?.scriptJson || scriptIdea?.scriptScenes?.length);

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const nextDraft = normalizeEditableScript(scriptIdea, duration, storytellingType, hookLens);
    setDraft(nextDraft);
    latestDraftRef.current = nextDraft;
    setPageIndex(0);
    setDirty(false);
    setSaveState(hasScript ? "saved" : "idle");
  }, [duration, hasScript, hookLens, scriptIdea, storytellingType]);

  useEffect(() => {
    if (!hasScript || !dirty || !onSave) return undefined;
    window.clearTimeout(saveTimerRef.current);
    setSaveState("dirty");
    saveTimerRef.current = window.setTimeout(async () => {
      const normalized = normalizeDraftForSave(latestDraftRef.current);
      setSaveState("saving");
      try {
        await onSave(normalized);
        latestDraftRef.current = normalized;
        setDraft(normalized);
        setDirty(false);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(saveTimerRef.current);
  }, [dirty, draft, hasScript, onSave]);

  const scriptHeader = useMemo(() => buildScriptHeader(draft, isOverviewPage ? null : page, shotIndex, shots.length), [draft, isOverviewPage, page, shotIndex, shots.length]);

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    markDirty();
  };

  const updateShot = (patch) => {
    setDraft((current) => ({
      ...current,
      shots: current.shots.map((shot, index) => index === shotIndex ? { ...shot, ...patch } : shot),
    }));
    markDirty();
  };

  const updateShots = (nextShots, nextPageIndex = pageIndex) => {
    const normalizedShots = renumberShots(nextShots);
    setDraft((current) => ({
      ...current,
      totalShots: normalizedShots.length,
      shots: normalizedShots,
    }));
    setPageIndex(Math.max(0, Math.min(normalizedShots.length, nextPageIndex)));
    markDirty();
  };

  const addShotAfter = (index) => {
    const safeIndex = Math.max(-1, Math.min(shots.length - 1, index));
    const newShotPageIndex = safeIndex + 2;
    const newShot = createInsertedShot(newShotPageIndex);
    const nextShots = [
      ...shots.slice(0, safeIndex + 1),
      newShot,
      ...shots.slice(safeIndex + 1),
    ];
    updateShots(nextShots, newShotPageIndex);
  };

  const reorderShot = (fromIndex, toIndex) => {
    if (fromIndex == null || toIndex == null || fromIndex === toIndex) return;
    const nextShots = [...shots];
    const [moved] = nextShots.splice(fromIndex, 1);
    nextShots.splice(toIndex, 0, moved);
    updateShots(nextShots, toIndex + 1);
    setDraggedShotIndex(null);
  };

  const updateShotPath = (path, value) => {
    const [root, key] = path.split(".");
    updateShot({ [root]: { ...(page?.[root] || {}), [key]: value } });
  };

  const updateVisualTreatment = (key, value) => {
    updateShot({
      visualTreatment: {
        ...(page?.visualTreatment || {}),
        [key]: value,
      },
    });
  };

  const updateGuideList = (key, value) => {
    updateShot({
      rookieFriendlyGuide: {
        ...(page?.rookieFriendlyGuide || {}),
        [key]: textToList(value),
      },
    });
  };

  const updateShotList = (key, value) => {
    updateShot({ [key]: textToList(value) });
  };

  const updateDialogueAt = (dialogueIndex, field, value) => {
    const entries = Object.entries(normalizeDialogue(page?.dialogue));
    if (!entries[dialogueIndex]) return;
    const [speaker, line] = entries[dialogueIndex];
    entries[dialogueIndex] = field === "speaker"
      ? [value.trim() || `speaker${dialogueIndex + 1}`, line]
      : [speaker, updateDialogueLineValue(line, value)];
    updateShot({ dialogue: Object.fromEntries(entries) });
  };

  const addDialogueLine = () => {
    const entries = Object.entries(normalizeDialogue(page?.dialogue));
    updateShot({ dialogue: Object.fromEntries([...entries, [`speaker${entries.length + 1}`, [{ line: "", lineStartTime: numberValue(page?.startTime), lineEndTime: numberValue(page?.endTime), deliveryNote: "", subtext: "" }]]]) });
  };

  const removeDialogueLine = (dialogueIndex) => {
    const entries = Object.entries(normalizeDialogue(page?.dialogue));
    if (!entries[dialogueIndex]) return;
    updateShot({ dialogue: Object.fromEntries(entries.filter((_, index) => index !== dialogueIndex)) });
  };

  const markDirty = () => {
    setDirty(true);
    setSaveState("dirty");
  };

  const saveDraftNow = async () => {
    if (!hasScript || !onSave || isSaving) return;
    window.clearTimeout(saveTimerRef.current);
    const normalized = normalizeDraftForSave(latestDraftRef.current);
    setSaveState("saving");
    try {
      await onSave(normalized);
      latestDraftRef.current = normalized;
      setDraft(normalized);
      setDirty(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <section className="creator-panel flex min-h-[42rem] flex-col p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-purple-200">
            <FileText size={15} />
            Script editor
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-white">Review the shot-wise script</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            Pick a section from the shot strip, edit the details on the page, and the script auto-saves after you pause.
          </p>
        </div>
        <AutoSaveBadge state={saveState} isSaving={isSaving} duration={draft?.duration || duration} />
      </div>

      {!hasScript ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 p-8 text-center">
          {isGenerating ? (
            <CreativeScriptLoader />
          ) : (
            <div className="max-w-md">
              <Sparkles className="mx-auto text-purple-300" size={28} />
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">
                Storyline, cast, and audience are locked. Generate the shot-wise screenplay from this production package.
              </p>
              <p className="mx-auto mt-3 w-fit rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1 text-xs font-black uppercase text-purple-100">
                {storytellingLabelFor(storytellingType)} / Hook: {hookLensLabelFor(hookLens)}
              </p>
              <button
                type="button"
                onClick={() => onGenerate?.()}
                disabled={!onGenerate || isGenerating}
                className="creator-primary mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Sparkles size={15} />
                Generate Screenplay
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-4">
            <HumanReviewCard
              order={humanReviewOrder}
              disabled={!hasScript || dirty || saveState === "saving" || isSaving || isSubmittingHumanReview}
              isSubmitting={isSubmittingHumanReview}
              onSubmit={() => onSubmitHumanReview?.({
                requesterNotes: "Please review and improve the screenplay for hook strength, scene clarity, pacing, visual continuity, dialogue, and production readiness.",
              })}
            />

            <ScriptPageNavigator
              draft={draft}
              duration={duration}
              shots={shots}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              addShotAfter={addShotAfter}
              reorderShot={reorderShot}
              draggedShotIndex={draggedShotIndex}
              setDraggedShotIndex={setDraggedShotIndex}
            />

            <article className="script-paper mx-auto min-h-[56rem] w-full max-w-[68rem] overflow-hidden rounded-sm border border-[#d8c9ac] bg-[#f6eedc] text-[#15110d] shadow-2xl shadow-black/40">
              <div className="grid gap-3 border-b border-black/10 bg-[#eadcbd] px-8 py-4 font-mono text-[11px] font-bold uppercase text-black/45 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <ScreenplayInline
                  value={draft?.projectTitle || ""}
                  onChange={(value) => updateDraft({ projectTitle: value })}
                  className="min-w-0 text-left text-sm font-black uppercase tracking-normal text-black"
                />
                <span className="rounded border border-black/10 bg-[#f7efd9] px-3 py-1 text-right">
                  {isOverviewPage ? "Title Page" : `Shot ${shotIndex + 1} / ${shots.length}`} / Page {pageIndex + 1} / {totalPages}
                </span>
              </div>

              <div className="custom-scrollbar h-[clamp(48rem,calc(100vh-10rem),72rem)] overflow-y-auto bg-[#f6eedc] px-5 py-7 sm:px-10 lg:px-16">
                <div className="mx-auto max-w-[54rem] font-mono">
                  <div className="mb-7 grid gap-2 rounded-sm border border-black/10 bg-[#fff8e9]/70 px-4 py-3 text-[10px] font-bold uppercase text-black/45 md:grid-cols-3">
                    <span>{scriptHeader.pacing}</span>
                    <span className="md:text-center">{scriptHeader.arc}</span>
                    <span className="md:text-right">{scriptHeader.difficulty}</span>
                  </div>

                  {isOverviewPage ? (
                    <ScriptOverviewPage draft={draft} shots={shots} duration={duration} updateDraft={updateDraft} />
                  ) : (
                    <ShotScriptPage
                      page={page}
                      shotIndex={shotIndex}
                      updateShot={updateShot}
                      updateShotPath={updateShotPath}
                      updateVisualTreatment={updateVisualTreatment}
                      updateShotList={updateShotList}
                      updateGuideList={updateGuideList}
                      updateDialogueAt={updateDialogueAt}
                      addDialogueLine={addDialogueLine}
                      removeDialogueLine={removeDialogueLine}
                    />
                  )}
                </div>
              </div>
            </article>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {saveState === "dirty" ? "Autosaving after you pause..." : saveState === "saving" ? "Saving screenplay..." : saveState === "saved" ? "Screenplay saved automatically." : saveState === "error" ? "Save failed. Edit again to retry." : isOverviewPage ? "Editing the screenplay title page." : `Editing shot ${shotIndex + 1} of ${shots.length}.`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveDraftNow}
                disabled={!dirty || saveState === "saving" || isSaving}
                className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Save the current shot-plan edits now."
              >
                {saveState === "saving" || isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
              <button type="button" onClick={() => setPageIndex((current) => Math.max(0, current - 1))} disabled={pageIndex <= 0} className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40">
                <ChevronLeft size={14} /> Previous Page
              </button>
              <button type="button" onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))} disabled={pageIndex >= totalPages - 1} className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40">
                Next Page <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onGenerate?.()}
                disabled={!onGenerate || isGenerating || dirty || saveState === "saving" || isSaving}
                className="creator-control flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                title={dirty || saveState === "saving" ? "Wait for screenplay autosave before regenerating." : "Regenerate the shot-wise screenplay from the locked storyline, cast, and audience context."}
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Regenerate Screenplay
              </button>
              <button type="button" onClick={onContinue} disabled={dirty || saveState === "saving" || isSaving} className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                Continue To Shot Plans
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function HumanReviewCard({ order, disabled, isSubmitting, onSubmit }) {
  const status = humanOrderStatus(order);
  const active = Boolean(order) && !["APPROVED", "REJECTED", "CANCELLED", "CANCELED"].includes(status);
  const delivered = ["DELIVERED", "APPROVED"].includes(status);
  const reviewerNotes = order?.reviewerNotes || order?.deliveryPayload?.reviewerNotes || order?.deliveryPayload?.summary || "";
  return (
    <section className="creator-panel-muted grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-purple-300/20 bg-purple-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-purple-100">
            <Users size={13} /> Human screenplay review
          </span>
          {order && (
            <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-slate-300">
              {humanStatusLabel(status)}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
          Send the saved screenplay to a human reviewer for expert structure, hook, dialogue, and production polish.
        </p>
        {reviewerNotes && (
          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-emerald-100">
            <MessageSquareText size={13} className="mr-1 inline" /> {reviewerNotes}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || active || delivered || isSubmitting}
        className="creator-control inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase text-slate-200 disabled:opacity-50"
        title={delivered ? "The latest human review has been delivered." : active ? "This screenplay is already in the human review queue." : "Send this screenplay for human review."}
      >
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {active ? "Review queued" : delivered ? "Review delivered" : order ? "Send again" : "Send to reviewer"}
      </button>
    </section>
  );
}

function CreativeScriptLoader() {
  return (
    <div className="w-full max-w-md rounded-lg border border-purple-300/20 bg-purple-500/[0.08] p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-400/15 text-purple-100">
          <Loader2 size={20} className="animate-spin" />
          <Sparkles size={12} className="absolute -right-1 -top-1 text-amber-200" />
        </div>
        <div>
          <p className="text-sm font-black text-white">Generating screenplay</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
            Creating shot pages, dialogue blocks, camera notes, and production structure.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScriptPageNavigator({
  draft,
  duration,
  shots,
  pageIndex,
  setPageIndex,
  addShotAfter,
  reorderShot,
  draggedShotIndex,
  setDraggedShotIndex,
}) {
  return (
    <section className="creator-panel-muted p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-slate-500">Script sections</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Select the title page or one shot page to review in detail.</p>
        </div>
        <button
          type="button"
          onClick={() => addShotAfter(-1)}
          className="creator-control inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase text-slate-300"
        >
          <Plus size={13} /> Add Shot At Start
        </button>
      </div>

      <div className="custom-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setPageIndex(0)}
          className={`min-h-[5.75rem] w-56 shrink-0 rounded-lg border p-3 text-left transition ${
            pageIndex === 0
              ? "border-purple-300 bg-purple-500/15 text-white"
              : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-purple-300/40 hover:text-slate-200"
          }`}
        >
          <p className="text-xs font-black uppercase">Title Page</p>
          <p className="mt-1 line-clamp-2 text-sm font-bold">{draft?.projectTitle || "Project Overview"}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {draft?.duration || duration}s / {shots.length} shots
          </p>
        </button>

        {shots.map((item, index) => (
          <div
            key={`${item.shotNumber || index}-${item.title}`}
            draggable
            onDragStart={() => setDraggedShotIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => reorderShot(draggedShotIndex, index)}
            className={`min-h-[5.75rem] w-64 shrink-0 rounded-lg border p-3 text-left transition ${
              index + 1 === pageIndex
                ? "border-purple-300 bg-purple-500/15 text-white"
                : draggedShotIndex === index
                  ? "border-purple-300/50 bg-purple-500/10 text-slate-200"
                  : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-purple-300/40 hover:text-slate-200"
            }`}
          >
            <button type="button" onClick={() => setPageIndex(index + 1)} className="w-full text-left">
              <p className="flex items-center gap-2 text-xs font-black uppercase">
                <GripVertical size={13} className="text-slate-500" />
                Shot {item.shotNumber || index + 1}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-bold">{item.title || "Untitled Shot"}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {item.shotType || "Shot"} / {item.cameraMovement || "Static"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => addShotAfter(index)}
              className="mt-2 rounded-md border border-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-500 hover:border-purple-300/40 hover:text-purple-200"
            >
              <Plus size={11} className="mr-1 inline" /> Add After
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScriptOverviewPage({ draft, shots, duration, updateDraft }) {
  return (
    <div className="space-y-6 text-[13px] leading-7 sm:text-sm">
      <div className="mx-auto max-w-[40rem] pt-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-normal text-black/35">Creator Screenplay</p>
        <ScreenplayParagraph
          value={draft?.projectTitle}
          onChange={(value) => updateDraft({ projectTitle: value })}
          className="mx-auto mt-3 min-h-[3.5rem] text-center text-2xl font-black uppercase leading-9 text-black"
        />
        <p className="mt-2 text-[11px] font-black uppercase text-black/45">
          {draft?.duration || duration} seconds / {shots.length} shots / {draft?.overallExecutionDifficulty || "Beginner Friendly"}
        </p>
      </div>

      <PaperSection title="Project Setup" description="Base production metadata used by every shot plan.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          <ScriptCompactNote
            label="Duration"
            description="Final reel length."
            value={draft?.duration || duration}
            onChange={(value) => updateDraft({ duration: value })}
          />
          <ScriptCompactNote
            label="Total Shots"
            description="Generated pages after this title page."
            value={shots.length}
            onChange={() => {}}
            readOnly
          />
          <ScriptCompactNote
            label="Category"
            description="Topic memory for later storyboard prompts."
            value={draft?.category || ""}
            onChange={(value) => updateDraft({ category: value })}
          />
          <ScriptCompactNote
            label="Language"
            description="Dialogue, VO, and on-screen copy language."
            value={draft?.dialogueLanguage || "English"}
            onChange={(value) => updateDraft({ dialogueLanguage: value })}
          />
          <ScriptCompactNote
            label="Screen"
            description="Target frame orientation."
            value={draft?.screenType || "vertical"}
            onChange={(value) => updateDraft({ screenType: value })}
          />
          <ScriptCompactNote
            label="Storytelling"
            description="Narrator, visuals, or acted scene mix."
            value={storytellingLabelFor(draft?.storytellingType)}
            onChange={(value) => updateDraft({ storytellingType: storytellingValueFor(value) })}
          />
          <ScriptCompactNote
            label="Hook Lens"
            description="Opening bridge into the story."
            value={hookLensLabelFor(draft?.hookLens)}
            onChange={(value) => updateDraft({ hookLens: hookLensValueFor(value) })}
          />
        </div>
      </PaperSection>

      <PaperSection title="Story Shape" description="Review hook, pace, emotion, and execution difficulty before generating shot plans.">
        <div className="grid gap-7 lg:grid-cols-2">
          <ScriptNote
            label="Pacing Style"
            description="How fast the short should feel."
            value={draft?.pacingStyle}
            onChange={(value) => updateDraft({ pacingStyle: value })}
          />
          <ScriptNote
            label="Emotional Arc"
            description="The feeling journey from start to payoff."
            value={draft?.emotionalArc}
            onChange={(value) => updateDraft({ emotionalArc: value })}
          />
          <ScriptNote
            label="Hook Strategy"
            description="What grabs attention in the first seconds."
            value={draft?.hookStrategy}
            onChange={(value) => updateDraft({ hookStrategy: value })}
          />
          <ScriptNote
            label="Overall Difficulty"
            description="How hard the complete shoot is for the creator."
            value={draft?.overallExecutionDifficulty}
            onChange={(value) => updateDraft({ overallExecutionDifficulty: value })}
          />
        </div>
      </PaperSection>

      <PaperSection title="Fit Notes" description="Reasoning that explains why this script works for the creator and audience.">
        <div className="grid gap-7 lg:grid-cols-2">
          <ScriptNote
            label="Creator Fit Reasoning"
            description="Why this script matches the creator setup."
            value={draft?.creatorFitReasoning}
            onChange={(value) => updateDraft({ creatorFitReasoning: value })}
          />
          <ScriptNote
            label="Audience Fit Reasoning"
            description="Why the audience is likely to understand and engage."
            value={draft?.audienceFitReasoning}
            onChange={(value) => updateDraft({ audienceFitReasoning: value })}
          />
          <ScriptNote
            label="Inferred Tone"
            description="Optional tone inferred from the idea/script."
            value={draft?.inferredTone}
            onChange={(value) => updateDraft({ inferredTone: value })}
          />
          <ScriptNote
            label="Prompt/Model Notes"
            description="Optional provider memory saved with the script."
            value={[draft?.provider, draft?.model].filter(Boolean).join("\n")}
            onChange={(value) => {
              const [provider = "", model = ""] = String(value || "").split("\n");
              updateDraft({ provider, model });
            }}
          />
        </div>
      </PaperSection>
    </div>
  );
}

function ShotScriptPage({
  page,
  shotIndex,
  updateShot,
  updateShotPath,
  updateVisualTreatment,
  updateShotList,
  updateGuideList,
  updateDialogueAt,
  addDialogueLine,
  removeDialogueLine,
}) {
  const dialogueEntries = Object.entries(normalizeDialogue(page?.dialogue));

  return (
    <div className="space-y-7 text-[13px] leading-7 sm:text-sm">
      <PaperSection title="Timing And Scene" description="Basic page order, time range, and visible scene heading.">
        <div className="grid gap-3 sm:grid-cols-4">
          <ScriptCompactNote label="Shot No." description="Page order." value={page?.shotNumber || shotIndex + 1} onChange={(value) => updateShot({ shotNumber: value })} />
          <ScriptCompactNote label="Start" description="Scene start time." value={page?.startTime} onChange={(value) => updateShot({ startTime: value })} />
          <ScriptCompactNote label="End" description="Scene end time." value={page?.endTime} onChange={(value) => updateShot({ endTime: value })} />
          <ScriptCompactNote label="Seconds" description="Shot duration." value={page?.durationSeconds} onChange={(value) => updateShot({ durationSeconds: value })} />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="shrink-0 text-[10px] font-black uppercase text-black/35">Scene Heading</span>
          <ScreenplayInline
            value={page?.title || `Shot ${shotIndex + 1}`}
            onChange={(value) => updateShot({ title: value })}
            className="w-full font-black uppercase tracking-normal text-black"
          />
        </div>
      </PaperSection>

      <PaperSection title="On-Screen Script" description="The actual beat: purpose, action, dialogue, voice over, and transition.">
        <div className="space-y-7">
          <ScreenplayElement label="Purpose">
            <ScreenplayParagraph value={page?.purpose} onChange={(value) => updateShot({ purpose: value })} placeholder="Why this shot exists..." />
          </ScreenplayElement>

          <ScreenplayElement label="Action">
            <ScreenplayParagraph value={page?.action} onChange={(value) => updateShot({ action: value })} placeholder="Action happens here..." />
          </ScreenplayElement>

          <div className="space-y-6">
            {dialogueEntries.map(([speaker, line], index) => (
              <DialogueLine
                key={`${shotIndex}-${index}`}
                speaker={speaker}
                line={dialogueLineText(line)}
                parenthetical={index === 0 ? textValue(page?.emotion) : ""}
                onSpeakerChange={(value) => updateDialogueAt(index, "speaker", value)}
                onLineChange={(value) => updateDialogueAt(index, "line", value)}
                onParentheticalChange={(value) => updateShot({ emotion: value })}
                onDelete={() => removeDialogueLine(index)}
              />
            ))}
            <button type="button" onClick={addDialogueLine} className="mx-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase text-black/45 hover:bg-black/5 hover:text-black">
              <Plus size={13} /> Add Dialogue
            </button>
          </div>

          <div className="mx-auto max-w-[28rem]">
            <p className="text-center text-[10px] font-black uppercase text-black/35">Voice Over</p>
            <ScreenplayParagraph value={page?.voiceOver} onChange={(value) => updateShot({ voiceOver: value })} placeholder="Optional voiceover..." className="text-center" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScriptCompactNote
              label="Story Role"
              description="Narrator face, related visual, acted beat."
              value={page?.storytellingRole}
              onChange={(value) => updateShot({ storytellingRole: value })}
            />
            <ScriptCompactNote
              label="Asset Mode"
              description="Record, generate, or either."
              value={page?.assetCaptureMode}
              onChange={(value) => updateShot({ assetCaptureMode: value })}
            />
            <ScriptNote
              label="Asset Prompt"
              description="Prompt for visuals the user may generate instead of record."
              value={page?.assetGenerationPrompt}
              onChange={(value) => updateShot({ assetGenerationPrompt: value })}
            />
          </div>

          <div className="ml-auto max-w-[18rem] text-right">
            <ScreenplayInline value={page?.transition} onChange={(value) => updateShot({ transition: value })} className="w-full text-right font-black uppercase text-black" />
          </div>
        </div>
      </PaperSection>

      <PaperSection title="Camera And Composition" description="Frame, lens, motion, set, lighting, and mobile safe area.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScriptCompactNote label="Shot Type" description="Wide, medium, close up, detail." value={page?.shotType} onChange={(value) => updateShot({ shotType: value })} />
          <ScriptCompactNote label="Camera Angle" description="Where the phone/camera looks from." value={page?.cameraAngle} onChange={(value) => updateShot({ cameraAngle: value })} />
          <ScriptCompactNote label="Camera Movement" description="Static, push in, pan, handheld." value={page?.cameraMovement} onChange={(value) => updateShot({ cameraMovement: value })} />
          <ScriptCompactNote label="Lens" description="Phone lens/zoom suggestion." value={page?.lensSuggestion} onChange={(value) => updateShot({ lensSuggestion: value })} />
          <ScriptCompactNote label="FPS" description="Capture frame rate." value={page?.fps} onChange={(value) => updateShot({ fps: value })} />
          <ScriptCompactNote label="Transition" description="Cut into the next shot." value={page?.transition} onChange={(value) => updateShot({ transition: value })} />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ScriptNote label="Composition" description="Where people/objects sit inside the vertical frame." value={page?.composition} onChange={(value) => updateShot({ composition: value })} />
          <ScriptNote label="Set Design" description="Physical set, props, background, and negative space." value={page?.setDesign} onChange={(value) => updateShot({ setDesign: value })} />
          <ScriptNote label="Lighting" description="How the shot is lit in a practical way." value={page?.lighting} onChange={(value) => updateShot({ lighting: value })} />
          <ScriptNote label="Environment" description="Location/set that should appear in the shot." value={page?.environment} onChange={(value) => updateShot({ environment: value })} />
          <ScriptNote label="Mobile Focus Area" description="What must stay clear and centered for vertical video." value={page?.mobileFocusArea} onChange={(value) => updateShot({ mobileFocusArea: value })} />
        </div>
      </PaperSection>

      <PaperSection title="People And Blocking" description="Who is in frame and what every actor physically does.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScriptCompactNote label="People In Frame" description="Exact visible people count." value={page?.peopleInFrame} onChange={(value) => updateShot({ peopleInFrame: value })} />
          <ScriptNote label="Primary Actors" description="Named main actors visible in this shot." value={listToText(page?.primaryActors)} onChange={(value) => updateShotList("primaryActors", value)} />
          <ScriptNote label="Side Actors" description="Supporting/background actors visible in this shot." value={listToText(page?.sideActors)} onChange={(value) => updateShotList("sideActors", value)} />
          <ScriptNote label="Primary Actor Action" description="What the main actor does in this shot." value={page?.primaryActorAction} onChange={(value) => updateShot({ primaryActorAction: value })} />
          <ScriptNote label="Side Actor Action" description="What side actors do, or why none are needed." value={page?.sideActorAction} onChange={(value) => updateShot({ sideActorAction: value })} />
        </div>
      </PaperSection>

      <PaperSection title="Performance And Retention" description="Acting, expression, emotional read, and why the beat keeps attention.">
        <div className="grid gap-5 lg:grid-cols-2">
          <ScriptNote label="Emotion" description="The feeling the viewer should read." value={page?.emotion} onChange={(value) => updateShot({ emotion: value })} />
          <ScriptNote label="Expression" description="Face acting direction for each person." value={page?.expression} onChange={(value) => updateShot({ expression: value })} />
          <ScriptNote label="Body Language" description="Physical posture and gesture direction." value={page?.bodyLanguage} onChange={(value) => updateShot({ bodyLanguage: value })} />
          <ScriptNote label="Retention Goal" description="Why viewers keep watching this exact beat." value={page?.retentionGoal} onChange={(value) => updateShot({ retentionGoal: value })} />
          <ScriptNote label="Creator Direction" description="Plain-language acting instruction." value={page?.creatorDirection} onChange={(value) => updateShot({ creatorDirection: value })} />
          <ScriptNote label="Text Overlay" description="Words visible on the video frame." value={page?.textOverlay} onChange={(value) => updateShot({ textOverlay: value })} />
        </div>
      </PaperSection>

      <PaperSection title="Phone-Friendly Execution" description="Quick feasibility checks for a smartphone creator shoot.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScriptCompactNote label="Difficulty Score" description="1 is easiest." value={page?.executionDifficulty?.score} onChange={(value) => updateShotPath("executionDifficulty.score", value)} />
          <ScriptCompactNote label="Difficulty Level" description="Beginner, easy, medium." value={page?.executionDifficulty?.level} onChange={(value) => updateShotPath("executionDifficulty.level", value)} />
          <PaperBoolean label="Needs Tripod" checked={Boolean(page?.executionDifficulty?.requiresTripod)} onChange={(value) => updateShotPath("executionDifficulty.requiresTripod", value)} />
          <PaperBoolean label="Needs Helper" checked={Boolean(page?.executionDifficulty?.requiresHelper)} onChange={(value) => updateShotPath("executionDifficulty.requiresHelper", value)} />
          <PaperBoolean label="Phone Friendly" checked={page?.executionDifficulty?.phoneFriendly !== false} onChange={(value) => updateShotPath("executionDifficulty.phoneFriendly", value)} />
        </div>
      </PaperSection>

      <PaperSection title="Cinematic Execution" description="Capture mode, stabilization, zoom, motion, and edit complexity.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScriptCompactNote label="Recommended FPS" description="AI capture recommendation." value={page?.cinematicExecution?.recommendedFPS} onChange={(value) => updateShotPath("cinematicExecution.recommendedFPS", value)} />
          <ScriptCompactNote label="Capture Mode" description="Normal, slow motion, time-lapse." value={page?.cinematicExecution?.captureMode} onChange={(value) => updateShotPath("cinematicExecution.captureMode", value)} />
          <ScriptCompactNote label="Playback Speed" description="Final edit speed." value={page?.cinematicExecution?.playbackSpeed} onChange={(value) => updateShotPath("cinematicExecution.playbackSpeed", value)} />
          <ScriptCompactNote label="Camera Style" description="Static, handheld, push in." value={page?.cinematicExecution?.cameraStyle} onChange={(value) => updateShotPath("cinematicExecution.cameraStyle", value)} />
          <ScriptCompactNote label="Stabilization" description="How steady the phone should be." value={page?.cinematicExecution?.stabilization} onChange={(value) => updateShotPath("cinematicExecution.stabilization", value)} />
          <ScriptCompactNote label="Transition Style" description="Editing transition to use." value={page?.cinematicExecution?.transitionStyle} onChange={(value) => updateShotPath("cinematicExecution.transitionStyle", value)} />
          <ScriptCompactNote label="Zoom" description="Whether to push, pull, or stay still." value={page?.cinematicExecution?.zoomRecommendation} onChange={(value) => updateShotPath("cinematicExecution.zoomRecommendation", value)} />
          <ScriptCompactNote label="Motion Intensity" description="Low, medium, or high movement." value={page?.cinematicExecution?.motionIntensity} onChange={(value) => updateShotPath("cinematicExecution.motionIntensity", value)} />
          <ScriptCompactNote label="Editing Complexity" description="How hard the edit will be." value={page?.cinematicExecution?.editingComplexity} onChange={(value) => updateShotPath("cinematicExecution.editingComplexity", value)} />
        </div>
      </PaperSection>

      <PaperSection title="Visual Treatment" description="Per-shot motion and colour treatment. These settings are saved into the storyboard and final video render brief.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScriptSelectNote
            label="Motion Effect"
            description="How time and movement should feel in this shot."
            value={page?.visualTreatment?.motionStyle}
            onChange={(value) => updateVisualTreatment("motionStyle", value)}
            options={[
              { value: "natural motion", label: "Natural motion" },
              { value: "slow motion", label: "Slow motion" },
              { value: "speed ramp", label: "Speed ramp" },
              { value: "time-lapse", label: "Time-lapse" },
              { value: "stop motion", label: "Stop motion" },
            ]}
          />
          <ScriptSelectNote
            label="Colour Grade"
            description="The final-video colour language for this one shot."
            value={page?.visualTreatment?.colorGrade}
            onChange={(value) => updateVisualTreatment("colorGrade", value)}
            options={[
              { value: "natural colour", label: "Natural colour" },
              { value: "black and white", label: "Black and white" },
              { value: "high contrast", label: "High contrast" },
              { value: "warm premium", label: "Warm premium" },
              { value: "cool clean", label: "Cool clean" },
              { value: "vintage film", label: "Vintage film" },
            ]}
          />
          <ScriptSelectNote
            label="Editorial Effect"
            description="A visible effect or transition treatment."
            value={page?.visualTreatment?.editorialEffect}
            onChange={(value) => updateVisualTreatment("editorialEffect", value)}
            options={[
              { value: "none", label: "None" },
              { value: "freeze frame", label: "Freeze frame" },
              { value: "match cut", label: "Match cut" },
              { value: "film grain", label: "Film grain" },
              { value: "split screen", label: "Split screen" },
              { value: "light leak", label: "Light leak" },
            ]}
          />
        </div>
        <div className="mt-5">
          <ScriptNote
            label="Visual Treatment Notes"
            description="Add the exact creative instruction for the shot. Example: slow-motion ingredient fall; monochrome image with the pack kept in colour."
            value={page?.visualTreatment?.notes}
            onChange={(value) => updateVisualTreatment("notes", value)}
          />
        </div>
      </PaperSection>

      <PaperSection title="Rookie-Friendly Guide" description="Plain-language instructions for a creator who needs practical shoot guidance.">
        <div className="grid gap-5 lg:grid-cols-2">
          <ScriptNote label="What Is This?" description="Plain explanation of this shot type." value={page?.rookieFriendlyGuide?.whatIsThis} onChange={(value) => updateShotPath("rookieFriendlyGuide.whatIsThis", value)} />
          <ScriptNote label="Why This Works" description="Why this shot helps retention or emotion." value={page?.rookieFriendlyGuide?.whyThisWorks} onChange={(value) => updateShotPath("rookieFriendlyGuide.whyThisWorks", value)} />
          <ScriptNote label="How To Shoot" description="Step-by-step phone filming instructions." value={listToText(page?.rookieFriendlyGuide?.howToShoot)} onChange={(value) => updateGuideList("howToShoot", value)} />
          <ScriptNote label="How To Move Camera" description="Simple movement directions." value={listToText(page?.rookieFriendlyGuide?.howToMoveCamera)} onChange={(value) => updateGuideList("howToMoveCamera", value)} />
          <ScriptNote label="How To Act" description="Performance guidance for beginner actors." value={listToText(page?.rookieFriendlyGuide?.howToAct)} onChange={(value) => updateGuideList("howToAct", value)} />
          <ScriptNote label="Common Mistakes" description="Mistakes to avoid while shooting." value={listToText(page?.rookieFriendlyGuide?.commonMistakes)} onChange={(value) => updateGuideList("commonMistakes", value)} />
          <ScriptNote label="Editing Tip" description="Simple edit advice for this page." value={page?.rookieFriendlyGuide?.editingTip} onChange={(value) => updateShotPath("rookieFriendlyGuide.editingTip", value)} />
          <PaperBoolean label="Phone Only Friendly" checked={page?.rookieFriendlyGuide?.phoneOnlyFriendly !== false} onChange={(value) => updateShotPath("rookieFriendlyGuide.phoneOnlyFriendly", value)} />
        </div>
      </PaperSection>

      <PaperSection title="Sound, Edit, And Safe Zones" description="Audio bed, cut timing, subtitles, and platform-safe placement.">
        <div className="grid gap-5 lg:grid-cols-2">
          <ScriptNote label="Sound Design" description="Music, ambience, effects, or tone notes." value={listToText(page?.soundDesign)} onChange={(value) => updateShotList("soundDesign", value)} />
          <ScriptNote label="Editing Notes" description="Cut timing, zooms, pauses, and edit rhythm." value={listToText(page?.editingNotes)} onChange={(value) => updateShotList("editingNotes", value)} />
          <ScriptNote label="Subtitle Position" description="Where subtitles should sit." value={page?.subtitlePosition} onChange={(value) => updateShot({ subtitlePosition: value })} />
          <ScriptNote label="Safe Zone Notes" description="How to avoid platform UI covering important text." value={page?.safeZoneNotes} onChange={(value) => updateShot({ safeZoneNotes: value })} />
        </div>
      </PaperSection>

    </div>
  );
}

function AutoSaveBadge({ state, isSaving, duration }) {
  const saving = state === "saving" || isSaving;
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-right">
      <p className="text-[11px] font-bold uppercase text-slate-500">{duration}s screenplay</p>
      <p className="mt-1 flex items-center justify-end gap-2 text-sm font-extrabold text-white">
        {saving ? <Loader2 size={14} className="animate-spin text-purple-300" /> : state === "saved" ? <Check size={14} className="text-emerald-300" /> : null}
        {saving ? "Saving" : state === "dirty" ? "Autosave pending" : state === "error" ? "Retry on edit" : "Saved"}
      </p>
    </div>
  );
}

function humanOrderStatus(order) {
  return String(order?.status || "NOT_SUBMITTED").toUpperCase();
}

function humanStatusLabel(status) {
  return String(status || "NOT_SUBMITTED").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ScreenplayInline({ value, onChange, className = "", readOnly = false }) {
  return (
    <input
      value={textValue(value)}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      className={`border-0 bg-transparent px-0 py-0.5 outline-none transition placeholder:text-black/25 focus:bg-transparent focus:ring-0 ${readOnly ? "cursor-default" : ""} ${className}`}
    />
  );
}

function ScreenplayParagraph({ value, onChange, placeholder, className = "" }) {
  return (
    <textarea
      value={textValue(value)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={4}
      className={`min-h-[6.5rem] max-h-72 w-full resize-y overflow-y-auto rounded-sm border border-black/10 bg-[#fffaf0]/70 px-3 py-2 leading-7 shadow-inner shadow-black/[0.03] outline-none transition placeholder:text-black/25 focus:border-black/20 focus:bg-[#fffdf5] focus:ring-0 ${className}`}
    />
  );
}

function ScriptNote({ label, description, value, onChange }) {
  return (
    <label className="block rounded-sm border border-black/10 bg-[#fff8e9]/45 p-3">
      <span className="block text-[10px] font-black uppercase tracking-normal text-black/45">{label}</span>
      {description && <span className="mt-0.5 block text-[10px] font-semibold leading-4 text-black/35">{description}</span>}
      <ScreenplayParagraph value={value} onChange={onChange} />
    </label>
  );
}

function ScriptCompactNote({ label, description, value, onChange, readOnly = false }) {
  return (
    <label className="block rounded-sm border border-black/10 bg-[#fff8e9]/55 p-3">
      <span className="block text-[10px] font-black uppercase tracking-normal text-black/45">{label}</span>
      {description && <span className="block text-[10px] font-semibold leading-4 text-black/30">{description}</span>}
      <ScreenplayInline
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className="mt-2 w-full border-b border-dotted border-black/25 text-sm font-bold text-black"
      />
    </label>
  );
}

function ScriptSelectNote({ label, description, value, onChange, options = [] }) {
  return (
    <label className="block rounded-sm border border-black/10 bg-[#fff8e9]/55 p-3">
      <span className="block text-[10px] font-black uppercase tracking-normal text-black/45">{label}</span>
      {description && <span className="block text-[10px] font-semibold leading-4 text-black/30">{description}</span>}
      <select
        value={textValue(value)}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-2 w-full border-0 border-b border-dotted border-black/25 bg-transparent px-0 py-1 text-sm font-bold text-black outline-none focus:border-black/45 focus:ring-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function PaperBoolean({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="mt-1 flex min-h-[3.75rem] items-center justify-between rounded-sm border border-black/10 bg-[#fff8e9]/55 px-3 py-2 text-left"
    >
      <span>
        <span className="block text-[10px] font-black uppercase tracking-normal text-black/40">{label}</span>
        <span className="block text-sm font-bold text-black">{checked ? "Yes" : "No"}</span>
      </span>
      <span className={`grid size-5 place-items-center rounded-full border ${checked ? "border-black bg-black text-[#f4ecd8]" : "border-black/25 text-transparent"}`}>
        <Check size={12} />
      </span>
    </button>
  );
}

function ScreenplayElement({ label, children }) {
  return (
    <section className="rounded-sm border border-black/10 bg-[#fff8e9]/40 p-3">
      <p className="mb-2 border-b border-black/10 pb-1 text-[10px] font-black uppercase tracking-normal text-black/40">{label}</p>
      {children}
    </section>
  );
}

function PaperSection({ title, description, children }) {
  return (
    <section className="rounded-sm border border-black/10 bg-[#fdf3dc]/55 p-4 shadow-sm shadow-black/[0.03]">
      <div className="mb-4 border-b border-black/10 pb-3">
        <p className="text-[11px] font-black uppercase tracking-normal text-black/55">{title}</p>
        {description && <p className="mt-1 text-[11px] font-semibold leading-5 text-black/40">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function DialogueLine({ speaker, line, parenthetical, onSpeakerChange, onLineChange, onParentheticalChange, onDelete }) {
  return (
    <div className="group relative mx-auto max-w-[32rem] rounded-sm border border-black/10 bg-[#fff8e9]/45 px-4 py-3 text-center">
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete dialogue"
        title="Delete dialogue"
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-sm border border-black/10 bg-[#f6eedc] text-black/35 opacity-100 transition hover:border-rose-400/30 hover:bg-rose-50 hover:text-rose-700 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
      <ScreenplayInline
        value={speaker}
        onChange={onSpeakerChange}
        className="mx-auto w-56 border-b border-dotted border-black/20 text-center font-black uppercase tracking-normal text-black"
      />
      <ScreenplayInline
        value={parenthetical ? `(${parenthetical})` : ""}
        onChange={(value) => onParentheticalChange?.(value.replace(/^\(|\)$/g, ""))}
        className="mx-auto mt-1 w-64 text-center text-xs text-black/60"
      />
      <ScreenplayParagraph
        value={line}
        onChange={onLineChange}
        placeholder="Dialogue line..."
        className="mt-1 text-center"
      />
    </div>
  );
}

function buildScriptHeader(draft, page, pageIndex, totalPages) {
  return {
    pacing: draft?.pacingStyle || "Short-form pacing",
    arc: draft?.emotionalArc || `Shot ${pageIndex + 1} of ${totalPages}`,
    difficulty: page?.executionDifficulty?.level || draft?.overallExecutionDifficulty || "Beginner",
  };
}

function storytellingLabelFor(value) {
  return storytellingTypeOptions.find((option) => option.value === value)?.label || "Narrator + Visuals";
}

function hookLensLabelFor(value) {
  return hookLensOptions.find((option) => option.value === value)?.label || "Direct";
}

function storytellingValueFor(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return storytellingTypeOptions.find((option) => option.value === value || option.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") === normalized)?.value
    || (normalized || "narrator_visual_mix");
}

function hookLensValueFor(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return hookLensOptions.find((option) => option.value === value || option.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") === normalized)?.value
    || (normalized || "direct");
}

function normalizeEditableScript(scriptIdea, duration, storytellingType = "narrator_visual_mix", hookLens = "direct") {
  const source = scriptIdea?.scriptJson || {};
  const rawShots = source?.shots?.length ? source.shots : scriptIdea?.scriptScenes?.length ? scriptIdea.scriptScenes : [];
  const shots = rawShots.length ? rawShots.map(normalizeShot) : [normalizeShot({ shotNumber: 1, title: "Screenplay Pending", action: "Generate screenplay first." })];
  return {
    projectTitle: source.projectTitle || scriptIdea?.title || "Creator Screenplay",
    duration: source.duration || scriptIdea?.durationSeconds || duration || 30,
    totalShots: shots.length,
    pacingStyle: source.pacingStyle || "Retention-led short-form pacing",
    emotionalArc: source.emotionalArc || "Hook -> progression -> payoff",
    hookStrategy: source.hookStrategy || "Open with immediate human tension.",
    creatorFitReasoning: source.creatorFitReasoning || "Beginner-friendly smartphone production.",
    audienceFitReasoning: source.audienceFitReasoning || "Built for fast context and relatable payoff.",
    overallExecutionDifficulty: source.overallExecutionDifficulty || "Beginner Friendly",
    category: source.category || scriptIdea?.categoryCode || scriptIdea?.category,
    inferredTone: source.inferredTone || scriptIdea?.inferredTone,
    dialogueLanguage: source.dialogueLanguage || scriptIdea?.dialogueLanguage || "English",
    screenType: source.screenType || scriptIdea?.screenType || "vertical",
    storytellingType: source.storytellingType || scriptIdea?.storytellingType || storytellingType || "narrator_visual_mix",
    storytellingGuidance: source.storytellingGuidance || scriptIdea?.storytellingGuidance || {},
    shotMixPlan: source.shotMixPlan || {},
    hookLens: source.hookLens || scriptIdea?.hookLens || hookLens || "direct",
    hookLensGuidance: source.hookLensGuidance || scriptIdea?.hookLensGuidance || {},
    hookBridge: source.hookBridge || scriptIdea?.hookBridge || {},
    factualityNotes: source.factualityNotes || scriptIdea?.factualityNotes || {},
    provider: source.provider,
    model: source.model,
    shots,
  };
}

function normalizeShot(shot = {}) {
  const shotNumber = Number(shot.shotNumber || shot.sceneNumber || 1);
  return {
    shotNumber,
    startTime: shot.startTime ?? parseTime(shot.time, 0) ?? `0:${String((shotNumber - 1) * 3).padStart(2, "0")}`,
    endTime: shot.endTime ?? parseTime(shot.time, 1) ?? `0:${String(shotNumber * 3).padStart(2, "0")}`,
    durationSeconds: shot.durationSeconds === "" ? "" : Number(shot.durationSeconds || 3),
    title: stripShotPrefix(plainText(shot.title, `Shot ${shotNumber}`)),
    purpose: plainText(shot.purpose ?? shot.intent, "Move the short forward."),
    shotType: plainText(shot.shotType ?? shot.camera, "Medium Shot"),
    cameraAngle: plainText(shot.cameraAngle, "Front vertical angle"),
    cameraMovement: plainText(shot.cameraMovement, "Static"),
    lensSuggestion: plainText(shot.lensSuggestion, "1x phone camera"),
    fps: shot.fps === "" ? "" : Number(shot.fps || shot.cinematicExecution?.recommendedFPS || 30),
    composition: plainText(shot.composition, "Keep the main action centered for mobile viewing."),
    setDesign: plainText(shot.setDesign),
    peopleInFrame: shot.peopleInFrame === "" ? "" : Number(shot.peopleInFrame || 1),
    primaryActors: textToList(shot.primaryActors || "Main creator"),
    sideActors: textToList(shot.sideActors || ""),
    primaryActorAction: plainText(shot.primaryActorAction),
    sideActorAction: plainText(shot.sideActorAction),
    expression: plainText(shot.expression),
    emotion: plainText(shot.emotion),
    bodyLanguage: plainText(shot.bodyLanguage),
    lighting: plainText(shot.lighting, "Natural light"),
    environment: plainText(shot.environment),
    action: plainText(shot.action ?? shot.visual ?? shot.description),
    voiceOver: plainText(shot.voiceOver ?? shot.vo),
    dialogue: normalizeDialogue(shot.dialogue),
    textOverlay: plainText(shot.textOverlay ?? shot.screenText),
    transition: plainText(shot.transition, "Hard Cut"),
    storytellingRole: shot.storytellingRole || shot.storyRole || "narrator_face",
    assetCaptureMode: shot.assetCaptureMode || shot.captureMode || "record",
    assetGenerationPrompt: plainText(shot.assetGenerationPrompt),
    soundDesign: textToList(shot.soundDesign),
    editingNotes: textToList(shot.editingNotes),
    retentionGoal: plainText(shot.retentionGoal ?? shot.intent),
    creatorDirection: plainText(shot.creatorDirection ?? shot.directorNote),
    subtitlePosition: plainText(shot.subtitlePosition, "lower-middle"),
    mobileFocusArea: plainText(shot.mobileFocusArea, "faces"),
    safeZoneNotes: plainText(shot.safeZoneNotes, "Keep subtitles above platform UI."),
    executionDifficulty: {
      score: shot.executionDifficulty?.score === "" ? "" : Number(shot.executionDifficulty?.score || 1),
      level: shot.executionDifficulty?.level ?? "Beginner",
      requiresTripod: Boolean(shot.executionDifficulty?.requiresTripod),
      requiresHelper: Boolean(shot.executionDifficulty?.requiresHelper),
      phoneFriendly: shot.executionDifficulty?.phoneFriendly !== false,
    },
    cinematicExecution: {
      recommendedFPS: shot.cinematicExecution?.recommendedFPS === "" ? "" : Number(shot.cinematicExecution?.recommendedFPS || shot.fps || 30),
      captureMode: plainText(shot.cinematicExecution?.captureMode, "normal"),
      playbackSpeed: plainText(shot.cinematicExecution?.playbackSpeed, "1x"),
      cameraStyle: plainText(shot.cinematicExecution?.cameraStyle, "static"),
      stabilization: plainText(shot.cinematicExecution?.stabilization),
      transitionStyle: plainText(shot.cinematicExecution?.transitionStyle),
      zoomRecommendation: plainText(shot.cinematicExecution?.zoomRecommendation),
      motionIntensity: plainText(shot.cinematicExecution?.motionIntensity),
      editingComplexity: plainText(shot.cinematicExecution?.editingComplexity, "easy"),
    },
    visualTreatment: {
      motionStyle: plainText(shot.visualTreatment?.motionStyle ?? shot.cinematicExecution?.captureMode, "natural motion"),
      colorGrade: plainText(shot.visualTreatment?.colorGrade, "natural colour"),
      editorialEffect: plainText(shot.visualTreatment?.editorialEffect, "none"),
      notes: plainText(shot.visualTreatment?.notes),
    },
    rookieFriendlyGuide: {
      whatIsThis: shot.rookieFriendlyGuide?.whatIsThis || "",
      whyThisWorks: shot.rookieFriendlyGuide?.whyThisWorks || "",
      howToShoot: Array.isArray(shot.rookieFriendlyGuide?.howToShoot) ? shot.rookieFriendlyGuide.howToShoot : [],
      howToMoveCamera: Array.isArray(shot.rookieFriendlyGuide?.howToMoveCamera) ? shot.rookieFriendlyGuide.howToMoveCamera : [],
      howToAct: Array.isArray(shot.rookieFriendlyGuide?.howToAct) ? shot.rookieFriendlyGuide.howToAct : [],
      editingTip: shot.rookieFriendlyGuide?.editingTip || "",
      commonMistakes: Array.isArray(shot.rookieFriendlyGuide?.commonMistakes) ? shot.rookieFriendlyGuide.commonMistakes : [],
      phoneOnlyFriendly: shot.rookieFriendlyGuide?.phoneOnlyFriendly !== false,
    },
    sketchPrompt: shot.sketchPrompt || "",
  };
}

function renumberShots(shots = []) {
  return shots.map((shot, index) => ({
    ...normalizeShot({ ...shot, shotNumber: index + 1 }),
    shotNumber: index + 1,
  }));
}

function createInsertedShot(shotNumber) {
  return {
    shotNumber,
    startTime: "",
    endTime: "",
    durationSeconds: 3,
    title: `Shot ${shotNumber}`,
    purpose: "",
    shotType: "",
    cameraAngle: "",
    cameraMovement: "",
    lensSuggestion: "",
    fps: 30,
    composition: "",
    setDesign: "",
    peopleInFrame: "",
    primaryActors: [],
    sideActors: [],
    primaryActorAction: "",
    sideActorAction: "",
    expression: "",
    emotion: "",
    bodyLanguage: "",
    lighting: "",
    environment: "",
    action: "",
    voiceOver: "",
    dialogue: {},
    textOverlay: "",
    transition: "",
    storytellingRole: "narrator_face",
    assetCaptureMode: "record",
    assetGenerationPrompt: "",
    soundDesign: [],
    editingNotes: [],
    retentionGoal: "",
    creatorDirection: "",
    subtitlePosition: "",
    mobileFocusArea: "",
    safeZoneNotes: "",
    executionDifficulty: {
      score: "",
      level: "",
      requiresTripod: false,
      requiresHelper: false,
      phoneFriendly: true,
    },
    cinematicExecution: {
      recommendedFPS: "",
      captureMode: "",
      playbackSpeed: "",
      cameraStyle: "",
      stabilization: "",
      transitionStyle: "",
      zoomRecommendation: "",
      motionIntensity: "",
      editingComplexity: "",
    },
    visualTreatment: {
      motionStyle: "natural motion",
      colorGrade: "natural colour",
      editorialEffect: "none",
      notes: "",
    },
    rookieFriendlyGuide: {
      whatIsThis: "",
      whyThisWorks: "",
      howToShoot: [],
      howToMoveCamera: [],
      howToAct: [],
      editingTip: "",
      commonMistakes: [],
      phoneOnlyFriendly: true,
    },
    sketchPrompt: "",
  };
}

function normalizeDraftForSave(draft) {
  const shots = renumberShots(draft?.shots || []);
  return {
    ...draft,
    storytellingType: draft?.storytellingType || "narrator_visual_mix",
    storytellingGuidance: draft?.storytellingGuidance || {},
    shotMixPlan: draft?.shotMixPlan || {},
    hookLens: draft?.hookLens || "direct",
    hookLensGuidance: draft?.hookLensGuidance || {},
    hookBridge: draft?.hookBridge || {},
    factualityNotes: draft?.factualityNotes || {},
    totalShots: shots.length,
    shots,
  };
}

function normalizeDialogue(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item]));
  }
  return textToDialogue(String(value));
}

function updateDialogueLineValue(current, line) {
  if (Array.isArray(current)) {
    const first = current[0] && typeof current[0] === "object" ? current[0] : {};
    return [{ ...first, line }, ...current.slice(1)];
  }
  if (current && typeof current === "object") {
    return { ...current, line };
  }
  return line;
}

function dialogueLineText(value) {
  if (Array.isArray(value)) {
    return value.map(dialogueLineText).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return value.line || textValue(value);
  }
  return textValue(value);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function textToDialogue(value) {
  const lines = String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return {};
  const entries = lines.map((line, index) => {
    const colon = line.indexOf(":");
    if (colon > 0) return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    return [index === 0 ? "creator" : `speaker${index + 1}`, line];
  });
  return Object.fromEntries(entries);
}

function listToText(value) {
  return textValue(value);
}

function textToList(value) {
  if (Array.isArray(value)) return value.flatMap((item) => textToList(item));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => textToList(item));
  return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function parseTime(value, part) {
  const pieces = String(value || "").match(/(\d+:\d+|\d+)/g);
  return pieces?.[part];
}

function stripShotPrefix(value) {
  return textValue(value).replace(/^\d+\.\s*/, "");
}

function textValue(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${textValue(item)}`).join("\n");
  }
  return String(value);
}

function plainText(value, fallback = "") {
  const text = textValue(value).trim();
  return text || fallback;
}
