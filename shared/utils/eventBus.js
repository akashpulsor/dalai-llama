// shared/utils/eventBus.js
// --------------------------------------------------------------
//  Tiny Global Event Bus (Pub/Sub) for cross-app communication
// --------------------------------------------------------------

/**
 * @template T
 * @typedef {(payload: T) => void} EventHandler
 */

/**
 * @typedef {Record<string, Set<EventHandler<any>>>} EventMap
 */

/** @type {EventMap} */
const listeners = {};

/**
 * Subscribe to an event
 * @template T
 * @param {string} event
 * @param {EventHandler<T>} handler
 * @returns {() => void} unsubscribe function
 */
export function on(event, handler) {
  if (!listeners[event]) {
    listeners[event] = new Set();
  }
  listeners[event].add(handler);

  return () => listeners[event].delete(handler);
}

/**
 * Emit an event
 * @template T
 * @param {string} event
 * @param {T} payload
 */
export function emit(event, payload) {
  const subs = listeners[event];
  if (!subs) return;

  for (const handler of subs) {
    try {
      handler(payload);
    } catch (err) {
      console.error("EventBus handler error:", err);
    }
  }
}

/**
 * Remove all subscribers for an event
 * @param {string} event
 */
export function clear(event) {
  if (listeners[event]) {
    listeners[event].clear();
  }
}

/**
 * Reset entire event bus (logout / app teardown)
 */
export function resetEventBus() {
  for (const key of Object.keys(listeners)) {
    listeners[key].clear();
  }
}

export const eventBus = { on, emit, clear, reset: resetEventBus };
export default eventBus;
