// Run with: node --test apps/creator-ui/src/utils/soundLayers.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVoiceTimeline } from "./voiceTimeline.js";
import { isSoundLayerPending, msToSeconds, placeSoundLayers, secondsToMs } from "./soundLayers.js";

const shots = [
  { id: "a", shotNumber: 1, screenplaySceneId: "s1", durationSeconds: 4 },
  { id: "b", shotNumber: 2, screenplaySceneId: "s1", durationSeconds: 6.5 },
  { id: "c", shotNumber: 3, screenplaySceneId: "s2", durationSeconds: 5 },
];
const timeline = buildVoiceTimeline(shots, []);

test("a layer plays at its shot's start plus its own offset, in film order", () => {
  const placed = placeSoundLayers(timeline, [
    { layerId: "bell", shotId: "c", offsetMs: 1500, durationSeconds: 3.2, included: true },
    { layerId: "cue", shotId: "a", offsetMs: 0, durationSeconds: 10, included: true },
  ]);

  assert.deepEqual(placed.map((p) => [p.layer.layerId, p.start, Number(p.end.toFixed(1))]), [
    ["cue", 0, 10],
    ["bell", 12, 15.2],
  ]);
});

test("switched-off layers stay on the lane, flagged; layers of missing shots are dropped", () => {
  const placed = placeSoundLayers(timeline, [
    { layerId: "off", shotId: "b", offsetMs: 0, durationSeconds: 1, included: false },
    { layerId: "orphan", shotId: "gone", offsetMs: 0, durationSeconds: 1, included: true },
  ]);

  assert.deepEqual(placed.map((p) => [p.layer.layerId, p.included]), [["off", false]]);
});

test("sounds still queued or failed on the worker are not placed", () => {
  const placed = placeSoundLayers(timeline, [
    { layerId: "ready", shotId: "a", status: "COMPLETED", durationSeconds: 1, included: true },
    { layerId: "queued", shotId: "a", status: "QUEUED", included: true },
    { layerId: "failed", shotId: "a", status: "FAILED", included: true },
  ]);

  assert.deepEqual(placed.map((p) => p.layer.layerId), ["ready"]);
  assert.equal(isSoundLayerPending({ status: "PROCESSING" }), true);
  assert.equal(isSoundLayerPending({ status: "FAILED" }), false);
});

test("start times read and parse as seconds", () => {
  assert.equal(msToSeconds(1500), "1.5");
  assert.equal(msToSeconds(0), "0");
  assert.equal(secondsToMs("2.25"), 2250);
  assert.equal(secondsToMs("-1"), null);
  assert.equal(secondsToMs("abc"), null);
});
