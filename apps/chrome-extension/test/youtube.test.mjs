import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidPairing, videoIdFrom } from "../src/youtube.js";

test("finds the video id in watch, shorts and youtu.be links", () => {
  assert.equal(videoIdFrom("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s"), "dQw4w9WgXcQ");
  assert.equal(videoIdFrom("https://m.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(videoIdFrom("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(videoIdFrom("https://youtu.be/dQw4w9WgXcQ?si=abc"), "dQw4w9WgXcQ");
});

test("ignores anything that isn't a YouTube video page", () => {
  assert.equal(videoIdFrom("https://www.youtube.com/@riya"), null);
  assert.equal(videoIdFrom("https://evil-youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(videoIdFrom("https://www.youtube.com/watch?v=short"), null);
  assert.equal(videoIdFrom("not a url"), null);
});

test("pairing is accepted only from our app with a well-formed token", () => {
  const allowed = ["https://creator.dalaillama.in"];
  const token = "dlx_" + "a".repeat(64);
  assert.equal(isValidPairing("https://creator.dalaillama.in", { type: "DALAI_PAIR", token }, allowed), true);
  assert.equal(isValidPairing("https://evil.example", { type: "DALAI_PAIR", token }, allowed), false);
  assert.equal(isValidPairing("https://creator.dalaillama.in", { type: "DALAI_PAIR", token: "abc" }, allowed), false);
  assert.equal(isValidPairing("https://creator.dalaillama.in", { type: "OTHER", token }, allowed), false);
});
