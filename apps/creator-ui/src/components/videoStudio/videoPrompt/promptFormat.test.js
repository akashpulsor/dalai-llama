// Run with: node --test apps/creator-ui/src/components/videoStudio/videoPrompt/promptFormat.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { promptBlocks, timeSegments } from "./promptFormat.js";

test("times and frame numbers are picked out of the text", () => {
  const times = timeSegments("Logo lands by 0.6s (frame 18), holds to 2s, then the 3-second mark.").filter((s) => s.time).map((s) => s.text);
  assert.deepEqual(times, ["0.6s (frame 18)", "2s", "3-second mark"]);
});

test("words like 'shows' are not read as seconds", () => {
  assert.deepEqual(timeSegments("image 1 shows the set").filter((s) => s.time), []);
});

test("a paragraph with several timed sentences becomes beats; untimed sentences stay with their beat", () => {
  const blocks = promptBlocks("A clean blue frame. At 0.0s (frame 0) the text appears. It glows softly. By 2.4s (frame 72) it fades out.");
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[1].kind, "beats");
  assert.deepEqual(blocks[1].beats.map((b) => b.time), ["0.0s (frame 0)", "2.4s (frame 72)"]);
  assert.match(blocks[1].beats[0].segments.map((s) => s.text).join(""), /It glows softly\./);
});

test("reference lines become one list, headings stay headings", () => {
  const blocks = promptBlocks("THE TIMELINE\nOne line.\n\nreference image 1 = this shot's own frame.\nreference image 2 = Akanksha -- identity only.");
  assert.deepEqual(blocks.map((b) => b.kind), ["heading", "paragraph", "references"]);
  assert.deepEqual(blocks[2].items.map((i) => i.label), ["Image 1", "Image 2"]);
});
