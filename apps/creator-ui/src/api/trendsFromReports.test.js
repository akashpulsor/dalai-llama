import test from "node:test";
import assert from "node:assert/strict";
import { isTrendMomentReport, isTrendsStale, trendMomentRequest, trendMomentsFromReports, trendsFromReports } from "./trendsFromReports.js";

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

test("trend moments: newest report per category, empty where none was generated", () => {
  const older = { id: "old", industry: "trend-moments:sports", createdAt: "2026-10-01T00:00:00Z", predictions: [{ title: "Old" }] };
  const newer = { id: "new", industry: "trend-moments:sports", createdAt: "2026-10-04T00:00:00Z",
    predictions: [{ title: "Asia Cup final", summary: "Fans react", suggestedTags: ["#AsiaCup"] }] };

  const { categories, updatedAt } = trendMomentsFromReports([older, newer, report]);

  const sports = categories.find((c) => c.category === "sports");
  assert.deepEqual(sports.ideas, [{ id: "new:0", title: "Asia Cup final", prompt: "Fans react", tags: ["#AsiaCup"] }]);
  assert.deepEqual(categories.find((c) => c.category === "history").ideas, []);
  assert.equal(categories.length, 5);
  assert.equal(updatedAt, "2026-10-04T00:00:00Z");
});

test("never generated is no last-run time, not stale", () => {
  assert.equal(trendMomentsFromReports([report]).updatedAt, null);
  assert.equal(isTrendsStale(null), false);
});

test("trends are stale a day after the last run", () => {
  const ranAt = "2026-10-04T00:00:00Z";
  const hour = 60 * 60 * 1000;
  assert.equal(isTrendsStale(ranAt, Date.parse(ranAt) + 23 * hour), false);
  assert.equal(isTrendsStale(ranAt, Date.parse(ranAt) + 25 * hour), true);
});

test("a trend-moment report is told apart from a planner trend report", () => {
  assert.equal(isTrendMomentReport(trendMomentRequest({ category: "bollywood", label: "Bollywood" })), true);
  assert.equal(isTrendMomentReport(report), false);
});
