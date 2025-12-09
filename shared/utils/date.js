// shared/utils/date.js
// --------------------------------------------------------------
//  Date & Time Utilities
//  Used by: agent timer, supervisor cockpit, analytics, billing
// --------------------------------------------------------------

/**
 * Format a timestamp into YYYY-MM-DD
 * @param {number | string | Date} input
 * @returns {string}
 */
export function formatDate(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Format time into HH:MM:SS
 * @param {number | string | Date} input
 * @returns {string}
 */
export function formatTime(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

/**
 * Format duration in ms into MM:SS or HH:MM:SS for long calls
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (typeof ms !== "number" || ms < 0) return "00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${mm}:${ss}`
    : `${mm}:${ss}`;
}

/**
 * "2 minutes ago", "1 hour ago", "just now"
 * @param {number | string | Date} input
 * @returns {string}
 */
export function formatRelative(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Returns current timestamp (unix ms)
 * @returns {number}
 */
export function now() {
  return Date.now();
}

export default {
  formatDate,
  formatTime,
  formatDuration,
  formatRelative,
  now,
};
