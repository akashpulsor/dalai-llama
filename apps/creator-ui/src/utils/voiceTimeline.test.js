// Run with: node --test apps/creator-ui/src/utils/voiceTimeline.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVoiceTimeline, formatTime, speechKind, spokenLine } from "./voiceTimeline.js";

const scenes = [
  { id: "s1", sceneNumber: 1, slug: "The surface: modern India" },
  { id: "s2", sceneNumber: 2, slug: "What lies beneath" },
];

const shots = [
  { id: "a", shotNumber: 1, screenplaySceneId: "s1", shotType: "B_ROLL", durationSeconds: 5,
    voiceOver: "India is modernising at extraordinary speed.", cast: { characterType: "NARRATOR" } },
  { id: "b", shotNumber: 2, screenplaySceneId: "s1", shotType: "B_ROLL", durationSeconds: 6, scriptLine: "Train passes a factory" },
  { id: "c", shotNumber: 3, screenplaySceneId: "s2", shotType: "DIALOGUE", durationSeconds: 4,
    scriptLine: "We came for peace.", cast: { characterType: "HUMAN", characterName: "Priya" } },
  { id: "d", shotNumber: 4, screenplaySceneId: "s2", shotType: "B_ROLL", voiceOver: "But beneath the new India is something older." },
];

test("a narrator line is voice-over, an on-camera line is dialogue, visual direction is silence", () => {
  assert.equal(speechKind(shots[0]), "VOICE_OVER");
  assert.equal(speechKind(shots[2]), "DIALOGUE");
  assert.equal(speechKind(shots[1]), null);
  // scriptLine on a non-dialogue shot is direction, never spoken
  assert.equal(spokenLine(shots[1]), "");
});

test("sections follow the screenplay scenes, timed from the shots in order", () => {
  const timeline = buildVoiceTimeline(shots, scenes);

  assert.deepEqual(timeline.sections.map((s) => [s.number, s.title, s.start, s.end]), [
    [1, "The surface: modern India", 0, 11],
    [2, "What lies beneath", 11, 15],
  ]);
  assert.deepEqual(timeline.sections[1].lines.map((l) => [l.shotNumber, l.kind, l.speaker, l.start]), [
    [3, "DIALOGUE", "Priya", 11],
    [4, "VOICE_OVER", null, 15],
  ]);
  assert.equal(timeline.totalSeconds, 15);
  assert.equal(timeline.totalWords, 6 + 4 + 8);
  assert.equal(timeline.voiceOverLines, 2);
  assert.equal(timeline.dialogueLines, 1);
  // shot 4 has no duration: it takes no time and is reported, not hidden
  assert.equal(timeline.untimedShots, 1);
});

test("shots are ordered by shot number whatever order they arrive in", () => {
  const timeline = buildVoiceTimeline([...shots].reverse(), scenes);
  assert.equal(timeline.sections[0].lines[0].shotNumber, 1);
});

test("times read as m:ss", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(71), "1:11");
  assert.equal(formatTime(121), "2:01");
});
