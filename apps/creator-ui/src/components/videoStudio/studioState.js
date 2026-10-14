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
    // The timeline was corrected by hand (or rebuilt) after the prompt was written from it.
    promptOlderThanTimeline: hasRecommendation && timeline.length > 0 && after(plan?.timelineBuiltAt, prompt.promptComposedAt),
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

/**
 * The shot's plan as three checkpoints -- analysis, timeline, prompt -- each "done", "stale"
 * (built for other choices, or failed its checks) or "missing", and every reason one is stale in
 * words. The studio shows these as one status line with one button, instead of three steps each
 * with its own rebuild. promptReasons are the prompt card's own (draftStaleReasons).
 */
export function planStatus(plan, flags = staleness(plan), promptReasons = [], shotSeconds = null) {
  const lengthMoved = lengthChanged(plan, shotSeconds);
  const assessment = plan?.assessment;
  const timeline = plan?.timeline ?? [];
  const prompt = plan?.prompt ?? {};
  const actions = coverageRows(plan).length;
  const steps = [
    {
      key: "analysis",
      label: "Analysed",
      state: !assessment ? "missing" : plan.assessmentIssues?.length || lengthMoved ? "stale" : "done",
      detail: assessment ? `${actions} action${actions === 1 ? "" : "s"}` : null,
    },
    {
      key: "timeline",
      label: "Timed",
      state: !timeline.length ? "missing" : flags.timelineStale || plan.timelineIssues?.length ? "stale" : "done",
      detail: timeline.length ? `for ${plan.timelineDurationSeconds}s` : null,
    },
    {
      key: "prompt",
      label: "Prompt written",
      state: !prompt.aiRecommendedPrompt ? "missing"
        : flags.promptStale || flags.promptMissesContinuation || flags.promptOlderThanAnalysis || flags.promptOlderThanTimeline ? "stale" : "done",
      detail: prompt.aiRecommendedPrompt && prompt.promptDurationSeconds != null ? `for ${prompt.promptDurationSeconds}s` : null,
    },
  ];
  const checks = (n) => `${n} check${n === 1 ? "" : "s"} failed`;
  const problems = [];
  if (lengthMoved) problems.push(`Shot length: now ${shotSeconds}s, the plan was built for a ${formatSeconds(plan.plannedDurationSeconds)}s shot`);
  if (plan?.assessmentIssues?.length) problems.push(`Analysis: ${checks(plan.assessmentIssues.length)}`);
  if (flags.timelineStale) {
    const seconds = plan?.settings?.generationDurationSeconds;
    problems.push(plan.timelineDurationSeconds !== seconds
      ? `Timeline: built for ${plan.timelineDurationSeconds}s, the clip is now ${seconds}s`
      : `Timeline: built for ${plan.timelineFps ?? "another"} fps, the clip is now ${plan?.settings?.generationFps} fps`);
  }
  if (plan?.timelineIssues?.length) problems.push(`Timeline: ${checks(plan.timelineIssues.length)}`);
  for (const reason of promptReasons) problems.push(`Prompt: ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`);
  const untouched = steps.every((step) => step.state === "missing");
  return { steps, problems, upToDate: steps.every((step) => step.state === "done"), untouched };
}

/**
 * The clip length that holds the whole shot: the shortest length the model renders that is at
 * least the shot's planned length, else its longest. The same rule the server applies when it
 * analyses a shot (GenerationPlanValidator.shotLengthClip), so "Use the shot's length" lands where
 * a fresh analysis would.
 */
export function shotLengthClip(supportedSeconds, plannedSeconds) {
  if (plannedSeconds == null || !supportedSeconds?.length) return null;
  const needed = Math.ceil(Number(plannedSeconds) - 1e-9);
  const holding = supportedSeconds.filter((d) => d >= needed);
  return holding.length ? Math.min(...holding) : Math.max(...supportedSeconds);
}

/** The shot's length was changed after the plan was built for it. */
export function lengthChanged(plan, shotSeconds) {
  return shotSeconds != null && plan?.assessment != null && plan?.plannedDurationSeconds != null
    && Number(plan.plannedDurationSeconds) !== Number(shotSeconds);
}

/** Problems the timeline's checks report that the intervals' times alone can fix. */
export const TIME_FIXABLE = Object.freeze(["GAP", "OVERLAP", "TIMELINE_NOT_FROM_ZERO", "TIMELINE_NOT_TO_END"]);

/**
 * The timeline with its times made continuous: sorted by start, from 0, each interval starting
 * where the last ended, the last ending at the clip's end. Words and action ids are untouched --
 * this only fixes the clock, which is all the time-only checks complain about.
 */
export function closeTimelineGaps(intervals, seconds) {
  const sorted = [...intervals].sort((a, b) => Number(a.startSeconds) - Number(b.startSeconds));
  let cursor = 0;
  return sorted.map((interval, i) => {
    const start = cursor;
    const end = i === sorted.length - 1 ? Number(seconds) : Math.max(Number(interval.endSeconds), start + 0.1);
    cursor = end;
    return { ...interval, startSeconds: round1(start), endSeconds: round1(end) };
  });
}

const round1 = (n) => Math.round(n * 10) / 10;

/** What to do about each kind of timeline problem, in the creator's terms. */
const TIMELINE_ADVICE = Object.freeze({
  GAP: "Nothing happens between two moments. Fix the times, or stretch the moment before it.",
  OVERLAP: "Two moments overlap. Fix the times so one ends where the next begins.",
  TIMELINE_NOT_FROM_ZERO: "The first moment does not start at 0s. Fix the times.",
  TIMELINE_NOT_TO_END: "The last moment ends before the clip does. Fix the times, or hold the last pose.",
  MISSING_ACTION: "An action from the shot never happens. Add its id to a moment, or press Update to rebuild the timeline.",
  UNKNOWN_ACTION: "A moment names an action the shot does not have. Correct or remove that id.",
  DUPLICATE_ACTION: "An action happens twice. Remove one of them.",
  ORDER_VIOLATED: "Actions happen in the wrong order. Swap the moments, or press Update to rebuild.",
  OPENING_STATE_NOT_FIRST: "The opening state must be the first moment. Move OPEN to the start.",
  OPENING_STATE_NOT_AT_START: "The opening state must be the first moment. Move OPEN to the start.",
  ENDING_STATE_NOT_LAST: "The ending state must be the last moment. Move END to the end.",
  ENDING_STATE_NOT_AT_END: "The ending state must be the last moment. Move END to the end.",
  FIXED_TIMING_SHORTENED: "An action that needs a set time was squeezed. Give its moment more time.",
  ACTION_NOT_PRESERVED: "An action was dropped. Add it back, or press Update to rebuild.",
});

/** How to fix one problem the timeline's checks found: advice, and whether "Fix the times" does it. */
export function timelineFix(issue) {
  return {
    advice: TIMELINE_ADVICE[issue?.code] ?? "Edit the timeline, or press Update to rebuild it.",
    timeOnly: TIME_FIXABLE.includes(issue?.code),
  };
}
