/**
 * Pure rules for the video studio, kept out of the component so they can be tested on their own.
 *
 * The server never says "stale": it returns what each artefact was built for (the timeline's and
 * the recommendation's duration, fps and continuation frame) beside what is selected now, and these
 * functions make the comparison.
 */

/** The prompt the editor should start from: the creator's saved draft, else the AI recommendation. */
export function savedPromptText(plan) {
  return plan?.prompt?.userEditedPrompt ?? plan?.prompt?.aiRecommendedPrompt ?? "";
}

/** True when the editor holds text that has not been saved as the draft. */
export function hasUnsavedEdits(editorText, plan) {
  return (editorText ?? "") !== savedPromptText(plan);
}

/** True when the editor differs from the AI recommendation -- what "Reset" would undo. */
export function differsFromRecommendation(editorText, plan) {
  const recommended = plan?.prompt?.aiRecommendedPrompt;
  return recommended != null && (editorText ?? "") !== recommended;
}

const sameValue = (a, b) => (a ?? null) === (b ?? null);
const after = (a, b) => !!a && !!b && new Date(a).getTime() > new Date(b).getTime();

/**
 * What no longer matches the current choices. Each flag is a reason to rebuild that artefact, never
 * a reason to stop the creator: a stale prompt can still be generated, knowingly.
 */
export function staleness(plan) {
  const duration = plan?.settings?.generationDurationSeconds ?? null;
  const fps = plan?.settings?.generationFps ?? null;
  const timeline = plan?.timeline ?? [];
  const prompt = plan?.prompt ?? {};
  const continuationKey = plan?.continuationFrame?.objectKey ?? null;
  const hasRecommendation = !!prompt.aiRecommendedPrompt;
  return {
    timelineMissing: duration != null && timeline.length === 0,
    timelineStale: timeline.length > 0
      && (!sameValue(plan.timelineDurationSeconds, duration) || !sameValue(plan.timelineFps, fps)),
    promptStale: hasRecommendation
      && (!sameValue(prompt.promptDurationSeconds, duration) || !sameValue(prompt.promptFps, fps)),
    promptMissesContinuation: hasRecommendation && !sameValue(prompt.promptContinuationObjectKey, continuationKey),
    promptOlderThanAnalysis: hasRecommendation && after(plan?.assessment?.assessedAt, prompt.promptComposedAt),
    newerRecommendationThanDraft: prompt.userEditedPrompt != null
      && after(prompt.promptComposedAt, prompt.draftSavedAt),
  };
}

/**
 * Why Generate Video cannot run yet, in words for the button's tooltip. Empty means it can. Only
 * what would certainly fail is listed -- warnings and stale artefacts are the creator's call.
 */
export function generateBlockers(plan, editorText) {
  const reasons = [];
  if (!plan) return ["The shot is still loading."];
  for (const error of plan.settings?.errors ?? []) reasons.push(error.message);
  if (plan.settings?.generationDurationSeconds == null) reasons.push("Choose a generation duration.");
  const text = editorText ?? "";
  if (!text.trim()) reasons.push("Write or compose a prompt first.");
  if (plan.continuationFrame?.status === "EXTRACTING") {
    reasons.push("The previous shot's last frame is still being taken -- a few seconds.");
  }
  const max = plan.prompt?.maxChars;
  if (max && text.length > max) reasons.push(`The prompt is ${text.length} characters; the model takes ${max}.`);
  return reasons;
}

/** Seconds as the timeline shows them: "3", "3.5". */
export function formatSeconds(value) {
  if (value == null) return "–";
  const rounded = Math.round(Number(value) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Each required action with the time the assessment gave it (null when it gave none). */
export function coverageRows(plan) {
  const coverage = new Map((plan?.assessment?.actionCoverage ?? []).map((c) => [c.actionId, c]));
  return (plan?.requiredActions ?? []).map((action) => ({ ...action, coverage: coverage.get(action.actionId) ?? null }));
}

/** Issues for one action id, so a row can show its own problem. */
export function issuesFor(issues, actionId) {
  return (issues ?? []).filter((issue) => issue.actionId === actionId);
}
