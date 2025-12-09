// shared/utils/voiceUtils.js

/**
 * Normalize an audio PCM float value into a visual-ready 0–1 range.
 *
 * @param {number} value - PCM float sample (-1.0 to 1.0)
 * @returns {number} scaled value between 0 and 1
 */
export function normalizeSample(value) {
  const v = Math.abs(value);
  return Math.min(1, Math.max(0, v));
}

/**
 * Convert an array of PCM float values into UI waveform samples (0–1).
 *
 * @param {number[]} pcm
 * @returns {number[]} normalized samples
 */
export function pcmToWaveform(pcm) {
  return pcm.map((v) => normalizeSample(v));
}

/**
 * Detect silence based on amplitude threshold.
 *
 * @param {number[]} pcm
 * @param {number} [threshold=0.02]
 * @returns {boolean}
 */
export function isSilence(pcm, threshold = 0.02) {
  return pcm.every((v) => Math.abs(v) < threshold);
}

/**
 * Maintain a rolling buffer of waveform samples.
 *
 * @param {number[]} buffer
 * @param {number[]} incoming
 * @param {number} maxLen
 * @returns {number[]}
 */
export function appendRolling(buffer, incoming, maxLen = 120) {
  const out = [...buffer, ...incoming];
  if (out.length > maxLen) {
    return out.slice(out.length - maxLen);
  }
  return out;
}

export default {
  normalizeSample,
  pcmToWaveform,
  isSilence,
  appendRolling,
};
