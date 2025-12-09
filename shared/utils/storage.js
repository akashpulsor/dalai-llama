// shared/utils/storage.js
// --------------------------------------------------------------
//  Safe Typed Storage Helpers (localStorage + sessionStorage)
//  Fully JSDoc typed for checkJs=true
// --------------------------------------------------------------

/**
 * Safely read a value from storage.
 *
 * @template T
 * @param {Storage} storage
 * @param {string} key
 * @param {T} [fallback]
 * @returns {T}
 */
function safeGet(storage, key, fallback = /** @type {any} */ (null)) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;

    try {
      return JSON.parse(raw);
    } catch {
      return /** @type {T} */ (raw);
    }
  } catch {
    return fallback;
  }
}

/**
 * Safely write a value to storage.
 *
 * @param {Storage} storage
 * @param {string} key
 * @param {any} value
 * @returns {void}
 */
function safeSet(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * Safely remove a value
 *
 * @param {Storage} storage
 * @param {string} key
 * @returns {void}
 */
function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * --------------------------------------------------------------
 * LOCAL STORAGE WRAPPERS
 * --------------------------------------------------------------
 */
export const localStore = {
  /**
   * @template T
   * @param {string} key
   * @param {T} [fallback]
   * @returns {T}
   */
  get(key, fallback) {
    return safeGet(localStorage, key, fallback);
  },

  /**
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    safeSet(localStorage, key, value);
  },

  /**
   * @param {string} key
   */
  remove(key) {
    safeRemove(localStorage, key);
  },
};

/**
 * --------------------------------------------------------------
 * SESSION STORAGE WRAPPERS
 * --------------------------------------------------------------
 */
export const sessionStore = {
  /**
   * @template T
   * @param {string} key
   * @param {T} [fallback]
   * @returns {T}
   */
  get(key, fallback) {
    return safeGet(sessionStorage, key, fallback);
  },

  /**
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    safeSet(sessionStorage, key, value);
  },

  /**
   * @param {string} key
   */
  remove(key) {
    safeRemove(sessionStorage, key);
  },
};

export default {
  localStore,
  sessionStore,
};
