// Run with: node --test apps/creator-ui/src/components/videoStudio/studioState.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coverageRows,
  differsFromRecommendation,
  formatSeconds,
  generateBlockers,
  hasUnsavedEdits,
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
