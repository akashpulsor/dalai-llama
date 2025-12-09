// shared/utils/formatters.js
// --------------------------------------------------------------
//  Formatting Helpers Shared Across All Apps
// --------------------------------------------------------------

/**
 * Format a phone number into +1 (555) 000-0000 style.
 * @param {string | number | null | undefined} input
 * @returns {string}
 */
export function formatPhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D+/g, "");

  if (digits.length < 10) return input.toString();

  const country = digits.length > 10 ? digits.slice(0, digits.length - 10) : "1";
  const core = digits.slice(-10);
  const area = core.slice(0, 3);
  const mid = core.slice(3, 6);
  const last = core.slice(6);

  return `+${country} (${area}) ${mid}-${last}`;
}

/**
 * Format call duration ms -> mm:ss or hh:mm:ss
 * @param {number | null | undefined} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return "00:00";

  const totalSec = Math.floor(ms / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);

/**
 * Pad number with leading zero
 * @param {number} n
 * @returns {string}
 */
   const pad = (n) => (n < 10 ? "0" + n : String(n));


  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Format a timestamp (ms) into YYYY-MM-DD HH:mm:ss
 * @param {number | null | undefined} ts
 * @returns {string}
 */
export function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0") +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0") +
    ":" +
    String(d.getSeconds()).padStart(2, "0")
  );
}

/**
 * Format currency (default INR)
 * @param {number | string | null | undefined} value
 * @param {string} [currency="INR"]
 * @returns {string}
 */
export function formatCurrency(value, currency = "INR") {
  if (value == null) return "";

  const num = Number(value);
  if (Number.isNaN(num)) return "";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Format percentage
 * @param {number | null | undefined} val
 * @param {number} [digits=1]
 * @returns {string}
 */
export function formatPercent(val, digits = 1) {
  if (val == null) return "";
  return (val * 100).toFixed(digits) + "%";
}

/**
 * Trim and collapse whitespace
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function clean(str) {
  if (!str) return "";
  return String(str).trim().replace(/\s+/g, " ");
}

/**
 * Capitalize first letter
 * @param {string} s
 * @returns {string}
 */
export function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default {
  formatPhone,
  formatDuration,
  formatTimestamp,
  formatCurrency,
  formatPercent,
  clean,
  capitalize,
};
