import { appConfig } from "@dalaillama/shared-config";

/**
 * @typedef {"debug" | "info" | "warn" | "error"} LogLevel
 */

/** @type {readonly LogLevel[]} */
const levels = ["debug", "info", "warn", "error"];

/**
 * Type guard to check if a value is a valid LogLevel
 * @param {string} value
 * @returns {value is LogLevel}
 */
function isLogLevel(value) {
  return levels.includes(/** @type {LogLevel} */ (value));
}

/**
 * Safely resolve the configured log level.
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
 * Log message if allowed by configured log level.
 * @param {LogLevel} level
 * @param {...unknown} args
 */
function log(level, ...args) {
  if (levels.indexOf(level) >= currentLevelIndex) {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;

    /** @type {"log" | "info" | "warn" | "error"} */
    const consoleMethod = level === "debug" ? "log" : level;

    console[consoleMethod](prefix, ...args);
  }
}

/** @param {...unknown} args */ export const logDebug = (...args) => log("debug", ...args);
/** @param {...unknown} args */ export const logInfo = (...args) => log("info", ...args);
/** @param {...unknown} args */ export const logWarn = (...args) => log("warn", ...args);
/** @param {...unknown} args */ export const logError = (...args) => log("error", ...args);

export const logger = { debug: logDebug, info: logInfo, warn: logWarn, error: logError };
