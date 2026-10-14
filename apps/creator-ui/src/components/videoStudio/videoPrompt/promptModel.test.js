// Run with: node --test apps/creator-ui/src/components/videoStudio/videoPrompt/promptModel.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PromptFreshness,
  PromptOrigin,
  PromptState,
  buildCardData,
  draftFromSent,
  draftStaleReasons,
  estimateFor,
  formatEstimate,
  needsGenerateConfirm,
  toVersions,
} from "./promptModel.js";
import { staleness } from "../studioState.js";

// Newest first, as /scenes/shots/{id}/prompts returns them.
const rows = () => [
  { promptId: "p3", promptOriginal: "edited text", variantLabel: "studio-reviewed", approvalStatus: "APPROVED", durationSeconds: 7,
    references: [{ kind: "STORYBOARD", slotIndex: 0, url: "u/frame", audio: false }, { kind: "BACKGROUND_MUSIC", slotIndex: 1, url: "u/music", audio: true }] },
  { promptId: "p2", promptOriginal: "ai text", variantLabel: "planned", approvalStatus: "PENDING", durationSeconds: 7 },
  { promptId: "p1", promptOriginal: "old ai text", variantLabel: null, approvalStatus: "REJECTED", durationSeconds: 2 },
];

const plan = (overrides = {}) => ({
  settings: { generationDurationSeconds: 7, generationFps: 24 },
  timeline: [],
  prompt: { aiRecommendedPrompt: "ai text", promptDurationSeconds: 7, promptFps: 24, promptComposedAt: "2026-10-13T10:00:00Z" },
  assessment: { assessedAt: "2026-10-13T09:00:00Z" },
  ...overrides,
});

const draft = (text, staleReasons = []) => ({ text, aiText: "ai text", generateSeconds: 7, fps: 24, staleReasons });

test("versions are numbered oldest first and say who wrote them and which was sent", () => {
  const [v3, v2, v1] = toVersions(rows(), []);
  assert.deepEqual([v3.version, v2.version, v1.version], [3, 2, 1]);
  assert.equal(v3.state, PromptState.SENT);
  assert.equal(v2.state, PromptState.SUPERSEDED);
  assert.equal(v1.state, PromptState.SUPERSEDED);
  // A studio generation whose text no AI version had is the creator's edit.
  assert.equal(v3.origin, PromptOrigin.USER_EDITED);
  assert.equal(v2.origin, PromptOrigin.AI_GENERATED);
  assert.equal(v3.images.length, 1);
  assert.equal(v3.audio[0].source, "generated");
});

test("a cast voice sample says it is for cloning the voice, not the shot's line", () => {
  const [v3] = toVersions([{ ...rows()[0], references: [{ kind: "CHARACTER_VOICE", slotIndex: 2, url: "u/voice", audio: true }] }], []);
  assert.equal(v3.audio[0].label, "Cast voice sample");
  assert.match(v3.audio[0].purpose, /clone their voice/);
  assert.match(v3.audio[0].purpose, /not this shot's line/);
});

test("a shot image the model was not given is listed as held", () => {
  const [v3] = toVersions(rows(), [{ id: "i1", kind: "PRODUCTION", signedUrl: "u/production" }, { id: "i2", kind: "STORYBOARD", signedUrl: "u/frame" }]);
  assert.deepEqual(v3.images.map((i) => [i.label, i.sentToModel]), [["Shot frame", true], ["PRODUCTION", false]]);
});

test("stale badge: a prompt written for 2s while the shot generates 7s is out of date, with the reason", () => {
  const stalePlan = plan({ prompt: { ...plan().prompt, promptDurationSeconds: 2 } });
  const reasons = draftStaleReasons(stalePlan, staleness(stalePlan));
  assert.deepEqual(reasons, ["Written for 2s, shot now generates 7s"]);
  const card = buildCardData({ rows: rows(), draft: draft("ai text", reasons) });
  assert.equal(card.freshness, PromptFreshness.STALE);
  assert.equal(card.staleReason, "Written for 2s, shot now generates 7s");
});

test("a prompt written for the current settings is up to date", () => {
  const reasons = draftStaleReasons(plan(), staleness(plan()));
  assert.deepEqual(reasons, []);
  assert.equal(buildCardData({ rows: rows(), draft: draft("ai text", reasons) }).freshness, PromptFreshness.CURRENT);
});

test("confirm dialog: generating asks first only when the prompt is stale", () => {
  assert.equal(needsGenerateConfirm(PromptFreshness.STALE), true);
  assert.equal(needsGenerateConfirm(PromptFreshness.CURRENT), false);
});

test("the editor's unsent text is the next version, as a draft", () => {
  const card = buildCardData({ rows: rows(), draft: draft("my new words") });
  assert.equal(card.current.version, 4);
  assert.equal(card.current.state, PromptState.DRAFT);
  assert.equal(card.current.promptId, null);
  assert.equal(card.current.origin, PromptOrigin.USER_EDITED);
  assert.equal(card.history.length, 3);
});

test("the editor holding the newest version's text is that version", () => {
  const card = buildCardData({ rows: rows(), draft: draft("edited text") });
  assert.equal(card.current.version, 3);
  assert.equal(card.current.state, PromptState.SENT);
});

test("without the studio the card shows the version that was sent", () => {
  const card = buildCardData({ rows: rows() });
  assert.equal(card.current.version, 3);
  assert.equal(card.current.state, PromptState.SENT);
});

test("edit after sent: a new draft numbered after the newest version, the sent one unchanged", () => {
  const card = buildCardData({ rows: rows() });
  const sentBefore = structuredClone(card.history[0]);
  Object.freeze(card.history[0]);
  const next = draftFromSent(card);
  assert.equal(next.version, 4);
  assert.equal(next.state, PromptState.DRAFT);
  assert.equal(next.promptId, null);
  assert.equal(next.text, "edited text");
  assert.deepEqual(card.history[0], sentBefore);
  assert.equal(card.history[0].state, PromptState.SENT);
});

test("a first draft with no versions yet is v1", () => {
  const card = buildCardData({ rows: [], draft: draft("ai text") });
  assert.equal(card.current.version, 1);
  assert.equal(card.current.origin, PromptOrigin.AI_GENERATED);
});

test("cost: the newest priced version, scaled per second when it was priced for another length", () => {
  const priced = [
    { promptId: "p2", promptOriginal: "b", estimatedCost: 14, costCurrency: "INR", durationSeconds: 7 },
    { promptId: "p1", promptOriginal: "a", estimatedCost: 4, costCurrency: "INR", durationSeconds: 2 },
  ];
  const history = toVersions(priced, []);
  assert.equal(formatEstimate(estimateFor(history, 7)), "₹14.00");
  assert.equal(formatEstimate(estimateFor(history, 5)), "≈ ₹10.00");
  assert.equal(estimateFor([], 5), null);
});
