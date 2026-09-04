// @ts-nocheck
// Mirrors the job-status conventions used across creator-ui (see PlannerPage.jsx /
// GenerateShortsPage.jsx isCompletedJobStatus/isFailedJobStatus + jobPayload helpers)
// so the AI Patch Editor's backend job polling behaves the same as every other
// *Async mutation in this app, regardless of which AI provider the backend routes to.
const COMPLETED_STATUSES = new Set(["COMPLETED", "SUCCEEDED", "SUCCESS"]);
const FAILED_STATUSES = new Set(["FAILED", "FAILURE", "ERROR", "ERRORED", "CANCELED", "CANCELLED", "TIMED_OUT"]);

export function isCompletedJobStatus(status) {
  return COMPLETED_STATUSES.has(String(status || "").toUpperCase());
}

export function isFailedJobStatus(status) {
  return FAILED_STATUSES.has(String(status || "").toUpperCase());
}

export function jobResultPayload(job = {}) {
  return job?.result || job?.outputPayload || job?.data || {};
}

export function extractResultVideoUrl(job) {
  const payload = jobResultPayload(job);
  return (
    payload.finalVideoUrl ||
    payload.videoUrl ||
    payload.clipUrl ||
    payload.publicUrl ||
    payload.signedUrl ||
    payload?.finalVideo?.videoUrl ||
    payload?.finalVideo?.clipUrl ||
    null
  );
}

export function jobErrorMessage(job) {
  return job?.errorMessage || job?.message || null;
}

export function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
