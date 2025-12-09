// shared/utils/supervisorUtils.js

/**
 * @typedef {"listen"|"whisper"|"idle"} SupervisorMode
 */

/**
 * Convert a raw call event (e.g., from WebSocket) into a supervisor mode.
 *
 * @param {any} ev
 * @returns {SupervisorMode}
 */
export function eventToMode(ev) {
  if (!ev || !ev.type) return "idle";

  switch (ev.type) {
    case "SUPERVISOR_LISTEN_STARTED":
      return "listen";
    case "SUPERVISOR_WHISPER_STARTED":
      return "whisper";
    case "SUPERVISOR_LISTEN_STOPPED":
    case "SUPERVISOR_WHISPER_STOPPED":
      return "idle";
    default:
      return "idle";
  }
}

/**
 * Format an event into a UI-friendly string.
 *
 * @param {{type:string, callId?:string, ts?:number}} ev
 * @returns {string}
 */
export function formatSupervisorEvent(ev) {
  if (!ev) return "Unknown event";

  const ts = ev.ts ? new Date(ev.ts).toLocaleTimeString() : "";

  switch (ev.type) {
    case "SUPERVISOR_LISTEN_STARTED":
      return `[${ts}] Supervisor started listening to Call ${ev.callId}`;
    case "SUPERVISOR_WHISPER_STARTED":
      return `[${ts}] Supervisor began whispering on Call ${ev.callId}`;
    case "SUPERVISOR_LISTEN_STOPPED":
      return `[${ts}] Listening stopped`;
    case "SUPERVISOR_WHISPER_STOPPED":
      return `[${ts}] Whisper mode stopped`;
    default:
      return `[${ts}] ${ev.type}`;
  }
}

/**
 * Compute button states for SupervisorControls component.
 *
 * @param {SupervisorMode} mode
 * @returns {{
 *   canListen: boolean,
 *   canStopListen: boolean,
 *   canWhisper: boolean,
 *   canStopWhisper: boolean
 * }}
 */
export function computeSupervisorActions(mode) {
  return {
    canListen: mode === "idle",
    canStopListen: mode === "listen",
    canWhisper: mode === "idle",
    canStopWhisper: mode === "whisper",
  };
}

export default {
  eventToMode,
  formatSupervisorEvent,
  computeSupervisorActions,
};
