// @ts-nocheck
import React from "react";
import { Check, ChevronRight } from "lucide-react";

const steps = [
  { id: "trend", label: "Brief / Trend" },
  { id: "ideas", label: "Story Ideas" },
  { id: "script", label: "Script" },
  { id: "screenplay", label: "Screenplay" },
  { id: "cast", label: "Cast Plan" },
  { id: "audience", label: "Audience" },
  { id: "storyboard", label: "Storyboard" },
];

export default function PlannerStepper({ activeStep, completedSteps, onStepClick, briefLabel = "Brief / Trend" }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const visibleSteps = steps.map((step) => step.id === "trend" ? { ...step, label: briefLabel } : step);

  return (
    <div className="creator-panel p-2">
      <div className="grid gap-1 md:grid-cols-7">
        {visibleSteps.map((step, index) => {
          const isComplete = Boolean(completedSteps?.[step.id]);
          const isActive = step.id === activeStep;
          const isEnabled = index <= activeIndex || isComplete || visibleSteps.slice(0, index).every((candidate) => completedSteps?.[candidate.id]);

          return (
            <div key={step.id} className="flex min-w-0 items-center">
              <button
                type="button"
                disabled={!isEnabled}
                onClick={() => onStepClick?.(step.id)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-purple-600/18 text-purple-100 ring-1 ring-purple-400/40"
                    : isComplete
                      ? "bg-emerald-400/12 text-emerald-100"
                      : "text-slate-400 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${isComplete ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300"}`}>
                  {isComplete ? <Check size={13} /> : index + 1}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
              {index < visibleSteps.length - 1 && <ChevronRight size={18} className="mx-1 hidden shrink-0 text-slate-600 md:block" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
