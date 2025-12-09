// shared/utils/validators.js
// --------------------------------------------------------------
//  Common validation helpers (strict JSDoc for checkJs=true)
// --------------------------------------------------------------

/**
 * Validate an E.164 or basic phone number.
 * Accepts:
 *   +15551234567
 *   9876543210
 *   0801234567
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isPhoneNumber(value) {
  if (typeof value !== "string") return false;
  return /^\+?[0-9]{7,15}$/.test(value.trim());
}

/**
 * Validate email format
 * @param {string} value
 * @returns {boolean}
 */
export function isEmail(value) {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Validate non-empty string with optional min length
 * @param {string} value
 * @param {number} [min=1]
 * @returns {boolean}
 */
export function isNonEmpty(value, min = 1) {
  return typeof value === "string" && value.trim().length >= min;
}

/**
 * Validate numeric (integer or float)
 * @param {any} value
 * @returns {boolean}
 */
export function isNumeric(value) {
  if (value === null || value === undefined) return false;
  return !isNaN(Number(value));
}

/**
 * Validate positive integer
 * @param {any} value
 * @returns {boolean}
 */
export function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

/**
 * Validate enum
 * @template T
 * @param {T[]} allowed
 * @param {any} value
 * @returns {value is T}
 */
export function isEnum(allowed, value) {
  return allowed.includes(value);
}

/**
 * Validation result object
 * @typedef {object} ValidationResult
 * @property {boolean} ok
 * @property {string=} error
 */

/**
 * Validate object fields using a rule map
 *
 * @param {Record<string, any>} data
 * @param {Record<string, (v:any)=>boolean>} rules
 * @returns {ValidationResult}
 */
export function validateObject(data, rules) {
  for (const key in rules) {
    const validator = rules[key];
    if (!validator(data[key])) {
      return { ok: false, error: `Invalid field: ${key}` };
    }
  }
  return { ok: true };
}

export default {
  isPhoneNumber,
  isEmail,
  isNonEmpty,
  isNumeric,
  isPositiveInt,
  isEnum,
  validateObject,
};
