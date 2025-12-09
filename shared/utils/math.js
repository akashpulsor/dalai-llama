// shared/utils/math.js
// --------------------------------------------------------------
//  Math Helpers for Analytics, Charts, Waveforms & UI
// --------------------------------------------------------------

/**
 * Clamp number between min and max
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(n, min, max) {
  if (typeof n !== "number") return min;
  return Math.min(Math.max(n, min), max);
}

/**
 * Round to nearest decimal place
 * @param {number} n
 * @param {number} decimals
 * @returns {number}
 */
export function round(n, decimals = 0) {
  if (typeof n !== "number") return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Percent helper (returns 0–100)
 * @param {number} part
 * @param {number} total
 * @returns {number}
 */
export function percent(part, total) {
  if (typeof part !== "number" || typeof total !== "number" || total === 0)
    return 0;
  return round((part / total) * 100, 2);
}

/**
 * Moving average for smoothing charts & waveform
 * @param {number[]} arr
 * @param {number} windowSize
 * @returns {number[]}
 */
export function movingAverage(arr, windowSize = 3) {
  if (!Array.isArray(arr) || arr.length === 0) return [];

  return arr.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const slice = arr.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / slice.length;
  });
}

/**
 * Smooth waveform values 0–1
 * @param {number[]} samples
 * @returns {number[]}
 */
export function smoothWaveform(samples) {
  if (!Array.isArray(samples)) return [];
  const normalized = samples.map((n) => clamp(n, 0, 1));
  return movingAverage(normalized, 4);
}

/**
 * Safe number conversion
 * @param {any} v
 * @param {number} fallback
 * @returns {number}
 */
export function toNumber(v, fallback = 0) {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

export default {
  clamp,
  round,
  percent,
  movingAverage,
  smoothWaveform,
  toNumber,
};
