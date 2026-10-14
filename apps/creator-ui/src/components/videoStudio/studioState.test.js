// Run with: node --test apps/creator-ui/src/components/videoStudio/studioState.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coverageRows,
  differsFromRecommendation,
  formatSeconds,
  generateBlockers,
  hasUnsavedEdits,
  closeTimelineGaps,
  lengthChanged,
  planStatus,
  timelineFix,
  shotLengthClip,
  savedPromptText,
  staleness,
} from "./studioState.js";

const plan = (overrides = {}) => ({
  settings: { generationDurationSeconds: 6, generationFps: 24, errors: [], warnings: [] },
  timeline: [{ startSeconds: 0, endSeconds: 6, actionId: "OPEN" }],
  timelineDurationSeconds: 6,
  timelineFps: 24,
  continuationFrame: null,
  assessment: { assessedAt: "2026-10-03T10:00:00Z", actionCoverage: [] },
  requiredActions: [],
  prompt: {
    aiRecommendedPrompt: "AI text",
    userEditedPrompt: null,
    promptDurationSeconds: 6,
    promptFps: 24,
    promptContinuationObjectKey: null,
    promptComposedAt: "2026-10-03T10:05:00Z",
    draftSavedAt: null,
    maxChars: 100,
  },
  ...overrides,
});

test("the editor starts from the saved draft, else the AI recommendation", () => {
  assert.equal(savedPromptText(plan()), "AI text");
  assert.equal(savedPromptText(plan({ prompt: { ...plan().prompt, userEditedPrompt: "mine" } })), "mine");
  assert.equal(savedPromptText(null), "");
});

test("typing makes the editor unsaved; reset is offered only once it differs from the recommendation", () => {
  assert.equal(hasUnsavedEdits("AI text", plan()), false);
  assert.equal(hasUnsavedEdits("AI text, edited", plan()), true);
  assert.equal(differsFromRecommendation("AI text", plan()), false);
  assert.equal(differsFromRecommendation("mine", plan()), true);
});

test("nothing is stale when every artefact was built for the current settings", () => {
  const flags = staleness(plan());
  assert.deepEqual(Object.values(flags).filter(Boolean), []);
});

test("changing duration makes both the timeline and the recommendation stale", () => {
  const changed = plan({ settings: { generationDurationSeconds: 4, generationFps: 24, errors: [] } });
  const flags = staleness(changed);
  assert.equal(flags.timelineStale, true);
  assert.equal(flags.promptStale, true);
});

test("attaching a last frame after composing marks the prompt as not describing it", () => {
  const attached = plan({ continuationFrame: { objectKey: "shot-frames/p/last.jpg" } });
  assert.equal(staleness(attached).promptMissesContinuation, true);
});

test("re-analysing after the prompt was written is reported, as is a newer recommendation than the draft", () => {
  const reanalysed = plan({ assessment: { assessedAt: "2026-10-03T11:00:00Z" } });
  assert.equal(staleness(reanalysed).promptOlderThanAnalysis, true);
  const draftThenRegenerated = plan({
    prompt: { ...plan().prompt, userEditedPrompt: "mine", draftSavedAt: "2026-10-03T10:01:00Z" },
  });
  assert.equal(staleness(draftThenRegenerated).newerRecommendationThanDraft, true);
});

test("generate is blocked only by what would certainly fail", () => {
  assert.deepEqual(generateBlockers(plan(), "0-6s he stands."), []);
  assert.ok(generateBlockers(plan(), "   ").some((r) => r.includes("prompt")));
  assert.ok(generateBlockers(plan(), "x".repeat(101)).some((r) => r.includes("101 characters")));
  const unsupported = plan({ settings: { generationDurationSeconds: 3, errors: [{ message: "cannot generate 3s" }] } });
  assert.ok(generateBlockers(unsupported, "ok").includes("cannot generate 3s"));
  // A stale timeline is a warning on the page, never a blocker.
  const stale = plan({ settings: { generationDurationSeconds: 4, generationFps: 24, errors: [] } });
  assert.deepEqual(generateBlockers(stale, "0-4s he stands."), []);
});

test("a last frame still being taken holds generation until it arrives; a failed one does not", () => {
  assert.ok(generateBlockers(plan({ continuationFrame: { status: "EXTRACTING" } }), "0-6s.").some((r) => r.includes("last frame")));
  assert.deepEqual(generateBlockers(plan({ continuationFrame: { status: "FAILED", error: "no video" } }), "0-6s."), []);
});

test("seconds read as the timeline shows them", () => {
  assert.equal(formatSeconds(3), "3");
  assert.equal(formatSeconds("3.500"), "3.5");
  assert.equal(formatSeconds(null), "–");
});

test("every required action gets a row, timed or not", () => {
  const rows = coverageRows(plan({
    requiredActions: [{ actionId: "OPEN" }, { actionId: "A1" }],
    assessment: { actionCoverage: [{ actionId: "OPEN", startSeconds: 0, endSeconds: 1 }] },
  }));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].coverage.endSeconds, 1);
  assert.equal(rows[1].coverage, null);
});

test("plan status: nothing built yet is untouched", () => {
  const status = planStatus({ settings: { generationDurationSeconds: 5 }, timeline: [], prompt: {} });
  assert.equal(status.untouched, true);
  assert.equal(status.upToDate, false);
});

test("plan status: changing the length leaves the timeline and prompt stale, the analysis done", () => {
  const plan = {
    settings: { generationDurationSeconds: 7, generationFps: 24 },
    assessment: { assessedAt: "2026-10-13T09:00:00Z", requiredActions: [] },
    timeline: [{ startSeconds: 0, endSeconds: 2, actionId: "A1", action: "walks" }],
    timelineDurationSeconds: 2, timelineFps: 24,
    prompt: { aiRecommendedPrompt: "p", promptDurationSeconds: 2, promptFps: 24, promptComposedAt: "2026-10-13T10:00:00Z" },
  };
  const { steps, upToDate } = planStatus(plan);
  assert.deepEqual(steps.map((s) => s.state), ["done", "stale", "stale"]);
  assert.equal(steps[1].detail, "for 2s");
  assert.equal(upToDate, false);
  const { problems } = planStatus(plan, staleness(plan), ["Written for 2s, shot now generates 7s"]);
  assert.deepEqual(problems, [
    "Timeline: built for 2s, the clip is now 7s",
    "Prompt: written for 2s, shot now generates 7s",
  ]);
});

test("plan status: everything built for the current length is up to date", () => {
  const plan = {
    settings: { generationDurationSeconds: 7, generationFps: 24 },
    assessment: { assessedAt: "2026-10-13T09:00:00Z" },
    timeline: [{ startSeconds: 0, endSeconds: 7, actionId: "A1", action: "walks" }],
    timelineDurationSeconds: 7, timelineFps: 24,
    prompt: { aiRecommendedPrompt: "p", promptDurationSeconds: 7, promptFps: 24, promptComposedAt: "2026-10-13T10:00:00Z" },
  };
  assert.equal(planStatus(plan).upToDate, true);
});

test("the clip holds the whole shot at the shortest length the model renders", () => {
  assert.equal(shotLengthClip([4, 6, 8], 5), 6);
  assert.equal(shotLengthClip([4, 6, 8], "4.000"), 4);
  assert.equal(shotLengthClip([4, 6, 8], 12), 8);
  assert.equal(shotLengthClip([4, 6, 8], null), null);
  assert.equal(shotLengthClip([], 5), null);
});

test("a shot made longer after its plan was built says so, and the analysis is out of date", () => {
  const plan = {
    plannedDurationSeconds: "5.000",
    settings: { generationDurationSeconds: 5 },
    assessment: { assessedAt: "2026-10-13T09:00:00Z" },
    timeline: [], prompt: {},
  };
  assert.equal(lengthChanged(plan, 7), true);
  assert.equal(lengthChanged(plan, 5), false);
  const { steps, problems } = planStatus(plan, staleness(plan), [], 7);
  assert.equal(steps[0].state, "stale");
  assert.deepEqual(problems, ["Shot length: now 7s, the plan was built for a 5s shot"]);
});

test("fixing the times closes gaps and overlaps and runs the timeline from 0 to the clip's end", () => {
  const fixed = closeTimelineGaps([
    { startSeconds: 2.5, endSeconds: 4, actionId: "A1", action: "b" },
    { startSeconds: 0.3, endSeconds: 2, actionId: "OPEN", action: "a" },
    { startSeconds: 3.5, endSeconds: 5.5, actionId: "END", action: "c" },
  ], 6);
  assert.deepEqual(fixed.map((i) => [i.actionId, i.startSeconds, i.endSeconds]), [
    ["OPEN", 0, 2], ["A1", 2, 4], ["END", 4, 6],
  ]);
});

test("each timeline problem comes with what to do, and says whether fixing the times is enough", () => {
  assert.equal(timelineFix({ code: "GAP" }).timeOnly, true);
  assert.equal(timelineFix({ code: "MISSING_ACTION" }).timeOnly, false);
  assert.match(timelineFix({ code: "MISSING_ACTION" }).advice, /Update/);
  assert.match(timelineFix({ code: "SOMETHING_NEW" }).advice, /Edit the timeline/);
});

test("a timeline corrected after the prompt was written leaves the prompt out of date", () => {
  const plan = {
    settings: { generationDurationSeconds: 6 },
    timeline: [{ startSeconds: 0, endSeconds: 6 }],
    timelineDurationSeconds: 6,
    timelineBuiltAt: "2026-10-13T11:00:00Z",
    prompt: { aiRecommendedPrompt: "p", promptDurationSeconds: 6, promptComposedAt: "2026-10-13T10:00:00Z" },
  };
  assert.equal(staleness(plan).promptOlderThanTimeline, true);
});
