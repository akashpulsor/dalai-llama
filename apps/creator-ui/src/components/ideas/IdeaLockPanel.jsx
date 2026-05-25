// @ts-nocheck
import React from "react";
import { Clock3, FileText, Loader2, LockKeyhole, PencilLine, Sparkles, Wand2 } from "lucide-react";

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
  onGenerateGeneralIdea,
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
  const canSaveManual = manualIdea?.trim?.().length >= 8;
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) || ideas[0];
  const hasScriptDetail = Boolean(selectedIdea?.scriptScenes?.length);

  return (
    <section className="creator-panel flex h-full w-full flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">2. Creative Brief</h2>
          <p className="mt-1 text-sm font-medium text-slate-400">Start with one sentence, or let AI create the idea from trends or general category context.</p>
        </div>
        <span className="creator-badge shrink-0 px-2 py-1 text-[10px] font-bold">Paid Lock</span>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                  <PencilLine size={14} className="text-purple-300" />
                  One sentence brief
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">Example: Indian wife starts gym and turns nervous day one into a funny confidence moment.</p>
              </div>
            </div>
            <input
              value={manualIdea}
              onChange={(event) => onManualIdeaChange?.(event.target.value)}
              placeholder="Write the short idea in one sentence..."
              className="w-full rounded-lg border border-white/10 bg-[#070b12] px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/60"
            />
            <button
              type="button"
              disabled={!canSaveManual}
              onClick={() => onManualIdeaSave?.(manualIdea.trim())}
              className="creator-primary mt-3 flex w-full items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Sparkles size={15} />
              Use This Brief As Idea
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
              <Wand2 size={14} className="text-purple-300" />
              Generate idea
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={onGenerateMore}
                disabled={isGeneratingMore}
                className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-4 text-left transition hover:border-purple-300/60 hover:bg-purple-500/15 disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-purple-100">
                  {isGeneratingMore ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  AI From Trend
                </span>
                <span className="mt-2 block text-xs font-medium leading-5 text-slate-400">
                  Use selected trend signals and insight to generate creator-ready ideas.
                </span>
                {selectedTrendTitle && <span className="mt-2 block truncate text-[11px] font-bold text-slate-500">{selectedTrendTitle}</span>}
              </button>
              <button
                type="button"
                onClick={onGenerateGeneralIdea}
                disabled={isGeneratingMore}
                className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-4 py-4 text-left transition hover:border-emerald-200/50 hover:bg-emerald-400/15 disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-emerald-100">
                  {isGeneratingMore ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                  General AI Idea
                </span>
                <span className="mt-2 block text-xs font-medium leading-5 text-slate-400">
                  Ask AI for a fresh idea without depending on a selected trend.
                </span>
              </button>
            </div>
          </div>

          <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                <Sparkles size={14} className="text-purple-300" />
                Idea candidates
              </div>
              <span className="text-[11px] font-semibold text-slate-500">{ideas.length} options</span>
            </div>
            <div className="custom-scrollbar max-h-[20rem] space-y-1.5 overflow-y-auto pr-1">
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
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-purple-200">
              <LockKeyhole size={14} />
              Selected idea
            </div>
            <h3 className="text-xl font-extrabold leading-7 text-white">{selectedIdea?.title || "Generate or write an idea"}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
              {selectedIdea?.description || "Once an idea is selected, lock it to generate the AI audience, cast fit, and paid storyboard package."}
            </p>
            {hasScriptDetail && (
              <button
                type="button"
                onClick={() => onOpenScriptDetail?.(selectedIdea)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15"
              >
                <FileText size={14} />
                Open Complete Script Detail
              </button>
            )}
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
            Lock Selected Idea
          </button>
        </div>
      </div>
    </section>
  );
}
