// Run with: node --test apps/creator-ui/src/utils/providerCosts.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupProviderCosts, usd } from "./providerCosts.js";

const tirth = "f4f67a1f-03bf-4fda-903e-d868e43aaa7e";
const older = "b312eaeb-1ae5-4063-8246-735c129eddb1";
const rows = [
  { projectId: older, providerId: "google", modelId: "gemini-2.5-flash", calls: 10, noResult: 0, costUsd: 0.05, lastAt: "2026-09-25T10:00:00Z" },
  { projectId: tirth, providerId: "fal.ai", modelId: "fal-ai/flux/schnell", calls: 4, noResult: 0, costUsd: 0.012, lastAt: "2026-10-05T12:00:00Z" },
  { projectId: tirth, providerId: "google", modelId: "gemini-2.5-flash", calls: 161, noResult: 0, costUsd: 0.3274, lastAt: "2026-10-05T15:00:00Z" },
  { projectId: tirth, providerId: "google", modelId: "gemini-3.1-flash-image", calls: 12, noResult: 3, costUsd: 0.8093, lastAt: "2026-10-05T15:35:53Z" },
  { projectId: null, providerId: "google", modelId: "gemini-2.5-flash", calls: 14, noResult: 0, costUsd: 0.0323, lastAt: "2026-10-05T09:00:00Z" },
];
const projects = [{ id: tirth, name: "OMJI — Stay Inside the Tirth" }];

test("one entry per project, newest activity first, totals and per-provider subtotals", () => {
  const groups = groupProviderCosts(rows, projects);

  assert.deepEqual(groups.map((g) => g.name), ["OMJI — Stay Inside the Tirth", "Not tied to a project", "Project b312eaeb"]);
  const omji = groups[0];
  assert.equal(omji.total.toFixed(4), "1.1487");
  assert.deepEqual(omji.providers.map(([p, c]) => [p, c.toFixed(4)]), [["google", "1.1367"], ["fal.ai", "0.0120"]]);
  assert.equal(omji.calls, 177);
  assert.equal(omji.noResult, 3);
  // most expensive model first
  assert.equal(omji.models[0].modelId, "gemini-3.1-flash-image");
});

test("money reads in USD with cents, or four places under a dollar", () => {
  assert.equal(usd(1.1569), "$1.16");
  assert.equal(usd(0.0083), "$0.0083");
});
