import { appConfig } from "@dalaillama/shared-config";

/**
 * @typedef {"debug" | "info" | "warn" | "error"} LogLevel
 */

/** @type {readonly LogLevel[]} */
const levels = ["debug", "info", "warn", "error"];

/**
 * Type guard for valid log levels
 * @param {string} value
 * @returns {value is LogLevel}
 */
function isLogLevel(value) {
  return levels.includes(/** @type {LogLevel} */ (value));
}

/**
 * Ensure configured log level is valid
 * @param {string} level
 * @returns {LogLevel}
 */
function resolveLogLevel(level) {
  return isLogLevel(level) ? level : "info";
}

/** @type {LogLevel} */
const configuredLevel = resolveLogLevel(appConfig.LOG_LEVEL || "info");

const currentLevelIndex = levels.indexOf(configuredLevel);

/**
 * Optional: send logs to backend collector
 * @param {string} url
 * @param {Record<string, unknown>} payload
 */
async function postLog(url, payload) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow error
  }
}

/**
 * Central log writer (console + optional backend)
 *
 * @param {LogLevel} level
 * @param {...unknown} args
 */
function log(level, ...args) {
  if (levels.indexOf(level) < currentLevelIndex) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  /** @type {"log"|"info"|"warn"|"error"} */
  const consoleMethod = level === "debug" ? "log" : level;

  console[consoleMethod](prefix, ...args);

  // Backend collector (optional)
  if (appConfig.LOG_COLLECTOR_URL) {
    const payload = {
      level,
      ts: timestamp,
      message: String(args[0] ?? ""),
      meta: args.length > 1 ? args.slice(1) : undefined,
    };

    postLog(appConfig.LOG_COLLECTOR_URL, payload);
  }
}

/** @param {...unknown} args */ export const logDebug = (...args) => log("debug", ...args);
/** @param {...unknown} args */ export const logInfo = (...args) => log("info", ...args);
/** @param {...unknown} args */ export const logWarn = (...args) => log("warn", ...args);
/** @param {...unknown} args */ export const logError = (...args) => log("error", ...args);

export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};
