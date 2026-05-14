// @ts-nocheck
import React from "react";
import { Clock3, FileText, Loader2, LockKeyhole, PencilLine, Sparkles, TrendingUp } from "lucide-react";

const durationOptions = [30, 45, 60];

export default function IdeaLockPanel({
  ideas = [],
  selectedIdeaId,
  savedIdeaIds,
  manualIdea,
  onManualIdeaChange,
  onManualIdeaSave,
  onSelectIdea,
  onToggleSave,
  onGenerateMore,
  onOpenGenerateScript,
  onOpenScriptDetail,
  selectedTrendTitle,
  isGeneratingMore,
  duration,
  onDurationChange,
  onLock,
  isLocking,
  lockDisabled,
}) {
  const canSaveManual = manualIdea?.trim?.().length >= 12;
  const canGenerateIdeaFromScript = manualIdea?.trim?.().length >= 24;
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) || ideas[0];
  const briefValue = manualIdea || selectedIdea?.description || "";
  const hasScriptDetail = Boolean(selectedIdea?.scriptScenes?.length);

  return (
    <section className="creator-panel flex h-full w-full flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">4. Creative Brief</h2>
          <p className="mt-1 text-sm font-medium text-slate-400">Choose or write the core idea, set timing, then lock it for storyboard generation.</p>
        </div>
        <span className="creator-badge shrink-0 px-2 py-1 text-[10px] font-bold">Paid Lock</span>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
              <PencilLine size={14} className="text-purple-300" />
              Story Idea / Script Seed
            </div>
            {selectedIdea?.title && <span className="max-w-[9rem] truncate text-[11px] font-bold text-purple-200">{selectedIdea.title}</span>}
          </div>
          <textarea
            value={briefValue}
            onChange={(event) => onManualIdeaChange?.(event.target.value)}
            rows={5}
            placeholder="A beginner almost skips the gym, then chooses one small action that changes the day."
            className="w-full resize-none rounded-lg border border-white/10 bg-[#070b12] px-3 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/60"
          />
          {hasScriptDetail && (
            <button
              type="button"
              onClick={() => onOpenScriptDetail?.(selectedIdea)}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15"
            >
              <FileText size={14} />
              Open Complete Script Detail
            </button>
          )}
          <div className="mt-2 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            <button
              type="button"
              disabled={!canSaveManual}
              onClick={() => onManualIdeaSave?.(manualIdea.trim())}
              className="creator-control px-3 py-2 text-xs font-bold text-purple-200 disabled:opacity-50"
            >
              Use Edited Brief
            </button>
            <button type="button" onClick={() => onOpenGenerateScript?.("brief")} className="creator-control px-3 py-2 text-xs font-bold text-emerald-100">
              Generate Script From Idea
            </button>
            <button
              type="button"
              disabled={!canGenerateIdeaFromScript}
              onClick={() => onOpenGenerateScript?.("script")}
              className="creator-control px-3 py-2 text-xs font-bold text-sky-100 disabled:opacity-50"
            >
              Generate Idea From Script
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                <Sparkles size={14} className="text-purple-300" />
                AI Suggestions
              </p>
            </div>
            <button
              type="button"
              onClick={onGenerateMore}
              disabled={isGeneratingMore}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2.5 text-xs font-bold text-purple-100 transition hover:border-purple-300/60 hover:bg-purple-500/15 disabled:opacity-60"
            >
              {isGeneratingMore ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              Generate Ideas From Trend
            </button>
            {selectedTrendTitle && (
              <p className="mb-3 truncate text-[11px] font-semibold text-slate-500">
                Trend source: <span className="text-slate-300">{selectedTrendTitle}</span>
              </p>
            )}
            <div className="custom-scrollbar max-h-52 space-y-1.5 overflow-y-auto pr-1">
              {ideas.map((idea) => {
                const selected = selectedIdeaId === idea.id;
                return (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => {
                      onSelectIdea?.(idea.id);
                      onManualIdeaChange?.("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${
                      selected ? "bg-purple-500/20 text-white" : "bg-white/[0.035] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${selected ? "bg-emerald-300" : "bg-slate-600"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{idea.title}</span>
                      <span className="block truncate text-xs font-medium text-slate-400">{idea.description}</span>
                    </span>
                    {idea.bestMatch && <span className="shrink-0 text-[10px] font-bold text-emerald-200">Best</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
              <Clock3 size={14} className="text-purple-300" />
              Short Length
            </div>
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          <button
            type="button"
            onClick={onLock}
            disabled={lockDisabled || isLocking}
            className="creator-primary mt-auto flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isLocking ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
            Lock Idea & Generate Storyboard
          </button>
        </div>
      </div>
    </section>
  );
}
