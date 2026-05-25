// @ts-nocheck
import React, { useState } from "react";
import { Calendar, ChevronDown, Dumbbell, Instagram, RefreshCw } from "lucide-react";

const fallbackOptions = {
  platform: [
    { value: "instagram_reels", label: "Instagram Reels" },
    { value: "youtube_shorts", label: "YouTube Shorts" },
    { value: "tiktok", label: "TikTok" },
  ],
  category: [
    { value: "fitness", label: "Fitness" },
    { value: "beauty", label: "Beauty" },
    { value: "food", label: "Food" },
    { value: "study", label: "Study" },
  ],
  timeframe: [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
  ],
};

const filterMeta = {
  platform: { icon: Instagram, label: "Platform" },
  category: { icon: Dumbbell, label: "Category" },
  timeframe: { icon: Calendar, label: "Time" },
};

function normalizeOption(option) {
  if (!option) return option;
  return {
    value: option.value || option.code || option.platformCode || option.categoryCode,
    label: option.label || option.displayName || option.name || option.code,
    description: option.description || option.promptContext || "",
  };
}

function FilterPill({ id, value, options, open, onToggle, onSelect }) {
  const { icon: Icon, label } = filterMeta[id];
  const normalizedOptions = (options?.length ? options : fallbackOptions[id]).map(normalizeOption);
  const current = normalizedOptions.find((option) => option.value === value) || normalizedOptions[0];

  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className="creator-control flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left">
        <Icon size={18} className="shrink-0 text-purple-300" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium text-slate-400">{label}</span>
          <span className="block truncate text-sm font-semibold text-white">{current.label}</span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] p-1 shadow-2xl shadow-black/40">
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`block w-full rounded-md px-3 py-2 text-left transition ${
                option.value === value ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              {option.description && (
                <span className={`mt-0.5 block line-clamp-2 text-[11px] leading-4 ${option.value === value ? "text-purple-100" : "text-slate-500"}`}>
                  {option.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrendFilterBar({
  filters,
  onFilterChange,
  onPredict,
  isPredicting,
  platformOptions,
  categoryOptions,
  timeframeOptions,
  validCombination = true,
}) {
  const [openFilter, setOpenFilter] = useState(null);

  const selectFilter = (id, value) => {
    onFilterChange?.({ ...filters, [id]: value });
    setOpenFilter(null);
  };

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_0.95fr]">
      {Object.keys(filterMeta).map((id) => (
        <FilterPill
          key={id}
          id={id}
          value={filters[id]}
          options={id === "platform" ? platformOptions : id === "category" ? categoryOptions : timeframeOptions}
          open={openFilter === id}
          onToggle={() => setOpenFilter(openFilter === id ? null : id)}
          onSelect={(value) => selectFilter(id, value)}
        />
      ))}
      <button
        type="button"
        onClick={() => onPredict?.(filters)}
        disabled={isPredicting || !validCombination}
        className="creator-primary flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60"
        title={validCombination ? "Predict trends for this combination" : "Select a valid platform/category combination"}
      >
        <RefreshCw size={17} className={isPredicting ? "animate-spin" : ""} />
        Predict Trends
      </button>
      {!validCombination && (
        <p className="text-xs font-semibold text-amber-200 md:col-span-4">This platform/category combination is not available yet.</p>
      )}
    </div>
  );
}
