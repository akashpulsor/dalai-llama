// shared/utils/errors.js
// --------------------------------------------------------------
//  Centralized Error Types + Normalizers
//  Fully type-safe (JSDoc + checkJs)
// --------------------------------------------------------------

/**
 * Enum-like mapping. `as const` ensures every value is a string literal.
 */
export const ErrorTypes = {
  NETWORK: "network",
  AUTH: "auth",
  SERVER: "server",
  NOT_FOUND: "not_found",
  VALIDATION: "validation",
  UNKNOWN: "unknown",
} ;

/**
 * Union of literal error type strings:
 * "network" | "auth" | "server" | "not_found" | "validation" | "unknown"
 *
 * @typedef {typeof ErrorTypes[keyof typeof ErrorTypes]} ErrorType
 */

/**
 * AppError structure
 *
 * @typedef {object} AppError
 * @property {ErrorType} type
 * @property {string} message
 * @property {number | undefined} status
 * @property {any} [meta]
 */

/**
 * Create a standard application error object
 *
 * @param {ErrorType} type
 * @param {string} message
 * @param {number} [status]
 * @param {any} [meta]
 * @returns {AppError}
 */
export function createError(type, message, status, meta) {
  return { type, message, status, meta };
}

/**
 * Converts unknown errors into AppError
 *
 * @param {any} err
 * @returns {AppError}
 */
export function normalizeError(err) {
  if (!err) {
    return createError(
      ErrorTypes.UNKNOWN,
      "Unknown error",
      undefined,
      err
    );
  }

  // RTK Query fetchBaseQuery error shape
  if (typeof err.status === "number") {
    const msg =
      typeof err.data === "string"
        ? err.data
        : JSON.stringify(err.data ?? {});

    // 401/403 → auth
    if (err.status === 401 || err.status === 403) {
      return createError(ErrorTypes.AUTH, msg, err.status, err);
    }

    // 404
    if (err.status === 404) {
      return createError(ErrorTypes.NOT_FOUND, msg, err.status, err);
    }

    // 500+ → server
    if (err.status >= 500) {
      return createError(ErrorTypes.SERVER, msg, err.status, err);
    }

    // default
    return createError(ErrorTypes.SERVER, msg, err.status, err);
  }

  // Network error from fetchBaseQuery
  if (err.status === "FETCH_ERROR") {
    return createError(
      ErrorTypes.NETWORK,
      err.error || "Network Failure",
      undefined,
      err
    );
  }

  // JS Exception
  if (err instanceof Error) {
    return createError(
      ErrorTypes.UNKNOWN,
      err.message || "Unexpected error",
      undefined,
      err
    );
  }

  // fallback safe path
  return createError(
    ErrorTypes.UNKNOWN,
    String(err),
    undefined,
    err
  );
}

/**
 * Pretty-print an AppError
 *
 * @param {AppError} error
 * @returns {string}
 */
export function errorToString(error) {
  const s = error.status ? ` (status=${error.status})` : "";
  return `[${error.type}] ${error.message}${s}`;
}

export default {
  ErrorTypes,
  createError,
  normalizeError,
  errorToString,
};
