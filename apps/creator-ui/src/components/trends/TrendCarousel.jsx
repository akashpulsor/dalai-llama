// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { Check, ChevronLeft, ChevronRight, Flame, Lightbulb, PencilLine } from "lucide-react";
import AiProviderSelect from "../ai/AiProviderSelect.jsx";

export default function TrendCarousel({
  trends,
  selectedTrendId,
  onSelectTrend,
  onViewAll,
  pageInfo,
  onPageChange,
  mode = "trend",
  onModeChange,
  originalIdea = "",
  onOriginalIdeaChange,
  onSaveOriginalIdea,
  onSaveTrend,
  onGenerateStoryIdeas,
  isFetching,
  isLockingSelection,
  isGeneratingIdeas,
  canGenerateStoryIdeas,
  savedBriefTitle,
  aiProviders = [],
  selectedProviderCode,
  selectedProvider,
  onProviderChange,
  providersLoading,
  providersError,
  trendsDisabled = false,
  autoFocusOriginalIdea = false,
}) {
  const originalIdeaRef = useRef(null);
  const page = pageInfo?.number || 0;
  const totalPages = Math.max(1, pageInfo?.totalPages || 1);
  const totalElements = pageInfo?.totalElements || trends.length;
  const originalWords = countWords(originalIdea);
  const originalIdeaValid = originalWords > 0 && originalWords <= 50;

  useEffect(() => {
    if (!autoFocusOriginalIdea || mode !== "original") return undefined;
    const focusTimer = window.setTimeout(() => {
      originalIdeaRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(focusTimer);
  }, [autoFocusOriginalIdea, mode]);

  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          {trendsDisabled ? <Lightbulb size={18} className="text-emerald-200" /> : <Flame size={18} className="text-orange-300" />}
          <div>
            <h2 className="text-base font-bold">Creative Brief</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {trendsDisabled
                ? "Write the topic you want to generate content about."
                : isFetching ? "Loading fresh trend rows..." : "Show trends or go with your own idea."}
            </p>
          </div>
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
          {trendsDisabled ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.08] px-3 py-2 text-xs font-bold text-emerald-100">
              <PencilLine size={14} /> Own Topic
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => onModeChange?.("trend")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${
                  mode === "trend" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Flame size={14} /> Show Trends
              </button>
              <button
                type="button"
                onClick={() => onModeChange?.("original")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${
                  mode === "original" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <PencilLine size={14} /> Go With Own Idea
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === "trend" && !trendsDisabled ? (
        <>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {trends.map((trend, index) => {
                const selected = selectedTrendId === trend.id;
                const score = Number(trend.score ?? trend.confidenceScore ?? 0);
                const sizeClass = index % 5 === 0 ? "text-base px-4 py-3" : index % 3 === 0 ? "text-sm px-3.5 py-2.5" : "text-xs px-3 py-2";
                return (
                  <button
                    key={trend.id}
                    type="button"
                    onClick={() => onSelectTrend?.(trend.id)}
                    className={`group inline-flex max-w-full items-center gap-2 rounded-full border font-extrabold transition ${sizeClass} ${
                      selected
                        ? "border-purple-300 bg-purple-500/25 text-white shadow-[0_0_0_1px_rgba(168,85,247,0.22)]"
                        : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-purple-300/40 hover:bg-white/[0.075] hover:text-white"
                    }`}
                  >
                    {selected && <Check size={14} className="shrink-0 text-emerald-200" />}
                    <span className="truncate">{trend.title}</span>
                    <span className="shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                      {score ? score.toFixed(0) : trend.status || "Trend"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Page {page + 1} of {totalPages} - {totalElements} trends</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Select a trend, save it, then generate 20 story ideas in the workflow.
              </p>
              {savedBriefTitle && <p className="mt-1 truncate text-[11px] font-bold text-emerald-200">Saved: {savedBriefTitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onViewAll} className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-semibold text-purple-200">
                View All <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.max(0, page - 1))}
                disabled={page <= 0}
                className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={onSaveTrend}
                disabled={!selectedTrendId || isLockingSelection}
                className="creator-control flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-100 disabled:opacity-50"
              >
                {isLockingSelection ? "Saving..." : "Save Trend"}
              </button>
              <button
                type="button"
                onClick={onGenerateStoryIdeas}
                disabled={!canGenerateStoryIdeas || isGeneratingIdeas}
                className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {isGeneratingIdeas ? "Generating Ideas..." : "Generate Story Ideas"} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={17} className="text-emerald-200" />
            <div>
              <p className="text-sm font-extrabold text-white">
                {trendsDisabled ? "Write the topic you want to generate content about" : "Write your original idea"}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {trendsDisabled ? "What topic do you want to generate content about? Maximum 50 words." : "Keep it short. Maximum 50 words."}
              </p>
            </div>
          </div>
          <textarea
            ref={originalIdeaRef}
            value={originalIdea}
            onChange={(event) => {
              const next = limitWords(event.target.value, 50);
              onOriginalIdeaChange?.(next);
            }}
            rows={4}
            placeholder={trendsDisabled
              ? "Example: A short-form video about a beginner learning AI tools to save time in daily work."
              : "Example: A shy beginner enters the gym for the first time and turns one nervous moment into a funny confidence win."}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#070b12] px-3 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/60"
          />
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className={`text-xs font-bold ${originalWords > 50 ? "text-red-200" : "text-slate-500"}`}>
                {originalWords}/50 words
              </p>
              {savedBriefTitle && <p className="mt-1 truncate text-[11px] font-bold text-emerald-200">Saved: {savedBriefTitle}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSaveOriginalIdea?.(originalIdea.trim())}
                disabled={!originalIdeaValid || isLockingSelection}
                className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-100 disabled:opacity-50"
              >
                {isLockingSelection ? "Saving..." : trendsDisabled ? "Save Topic" : "Save Idea"}
              </button>
              <button
                type="button"
                onClick={onGenerateStoryIdeas}
                disabled={!canGenerateStoryIdeas || isGeneratingIdeas}
                className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {isGeneratingIdeas ? "Generating Ideas..." : "Generate Story Ideas"} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function limitWords(value, maxWords) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(" ");
}
