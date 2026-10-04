import test from "node:test";
import assert from "node:assert/strict";
import { trendsFromReports } from "./trendsFromReports.js";

const report = {
  id: "r1",
  topic: "fitness on instagram reels in IN",
  industry: "fitness",
  createdAt: "2026-10-04T10:00:00Z",
  predictions: [
    { title: "Hyper-Localized Vernacular Storytelling", summary: "s", confidenceScore: 0.95, evidenceType: "EVIDENCE_BACKED", suggestedTags: ["VernacularFitness", "#DesiGym"] },
    { title: "Untagged", confidenceScore: null, suggestedTags: null },
  ],
};

test("each prediction is one trend, tagged with its own suggested tags", () => {
  const [first, second] = trendsFromReports([report]);
  assert.equal(first.id, "r1:0");
  assert.equal(first.title, "Hyper-Localized Vernacular Storytelling");
  assert.deepEqual(first.hashtags, ["#VernacularFitness", "#DesiGym"]);
  assert.equal(first.score, 95);
  assert.equal(first.category, "fitness");
  // Nothing invented for a prediction that carries no tags or confidence.
  assert.deepEqual(second.hashtags, []);
  assert.equal(second.score, null);
});

test("no reports, or a bad payload, is no trends", () => {
  assert.deepEqual(trendsFromReports([]), []);
  assert.deepEqual(trendsFromReports(undefined), []);
  assert.deepEqual(trendsFromReports([{ id: "r2" }]), []);
});
