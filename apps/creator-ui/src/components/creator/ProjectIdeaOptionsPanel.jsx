// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { ArrowRight, Sparkles } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListProjectIdeaOptionsQuery,
  useGenerateProjectIdeaOptionsMutation,
  useSelectProjectIdeaOptionMutation,
} from "../../api/creatorEndpoints.js";

/** Idea versioning for an already-created project: generate alternatives to the current idea,
 * pick a different one. Modeled on ProjectRequirementPage.jsx's pre-project-creation idea picker,
 * without the inline-edit flow (not needed here -- switching, not authoring). Switching creates a
 * brand new locked idea and repoints the project at it; nothing existing is deleted, but every
 * script/screenplay/shot already generated stays stamped with the idea it was actually built
 * from, so it may no longer match what's now current. */
export default function ProjectIdeaOptionsPanel({ projectId }) {
  const dispatch = useDispatch();
  const [confirmingId, setConfirmingId] = useState(null);

  const { data: options = [] } = useListProjectIdeaOptionsQuery(projectId, { skip: !projectId });
  const [generateOptions, { isLoading: generating }] = useGenerateProjectIdeaOptionsMutation();
  const [selectOption, { isLoading: selecting }] = useSelectProjectIdeaOptionMutation();

  const handleGenerate = async () => {
    try {
      await generateOptions({ projectId }).unwrap();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not generate other ideas", type: "error" }));
    }
  };

  const handleSelect = async (ideaOptionId) => {
    try {
      await selectOption({ projectId, ideaOptionId }).unwrap();
      dispatch(showFlash({ message: "Switched to this idea", type: "success" }));
      setConfirmingId(null);
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not switch to this idea", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-6 p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Other idea options</p>
      <p className="mt-0.5 mb-4 text-xs font-medium text-slate-400">
        Not sure this is the right idea? Generate a few alternatives — switching creates a new locked idea rather than changing this one, so nothing is lost.
      </p>

      {options.length === 0 ? (
        <button
          type="button"
          disabled={generating}
          onClick={handleGenerate}
          className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white disabled:opacity-60"
        >
          <Sparkles size={16} />
          {generating ? "Generating…" : "Generate other ideas"}
        </button>
      ) : (
        <div className="space-y-3">
          {options.map((option) => {
            const isConfirming = confirmingId === option.id;
            return (
              <div key={option.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-1.5 text-sm font-extrabold text-white">{option.title}</p>
                <p className="mb-2 text-xs font-medium leading-relaxed text-slate-400">{option.concept}</p>
                {option.campaignAngle && (
                  <p className="mb-3 text-[11px] font-semibold text-purple-300">{option.campaignAngle}</p>
                )}

                {!isConfirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(option.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-purple-400/30 bg-purple-500/10 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-500/20"
                  >
                    Switch to this idea
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <div className="space-y-2 rounded-md border border-amber-400/20 bg-amber-500/[0.06] p-3">
                    <p className="text-[11px] font-semibold text-amber-200">
                      Any script, screenplay, or shots already generated were built for the current idea and won&rsquo;t match this one — you&rsquo;ll want to regenerate them after switching.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="flex-1 rounded-md border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={selecting}
                        onClick={() => handleSelect(option.id)}
                        className="flex-1 rounded-md border border-amber-400/30 bg-amber-500/15 py-2 text-xs font-bold text-amber-200 disabled:opacity-60"
                      >
                        {selecting ? "Switching…" : "Confirm switch"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2 text-center text-xs font-bold text-purple-300 hover:text-purple-200"
          >
            {generating ? "Generating…" : "Generate more"}
          </button>
        </div>
      )}
    </div>
  );
}
