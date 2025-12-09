// shared/hooks/sttStream.js
// ------------------------------------------------------
//  Unified STT + Waveform Engine (MOCK + REAL + AUTO-SWITCH)
// ------------------------------------------------------

import { appConfig } from "@dalaillama/shared-config";
import {
  addTranscript,
  updateSentiment,
  updateWaveform,     // ✅ PATCHED: real waveform support
  setAISummary,
} from "@dalaillama/shared-store/slices/callSlice.js";

/**
 * @typedef {import("redux").Store} ReduxStore
 */

/**
 * @typedef {"stt" | "sentiment" | "waveform"} MessageType
 */

/**
 * @typedef {object} STTMessage
 * @property {MessageType} type
 * @property {string | undefined} speaker
 * @property {string | undefined} text
 * @property {string | undefined} sentiment
 * @property {number[] | undefined} samples
 */

/* ------------------------------------------------------
 * Helpers
 * ------------------------------------------------------ */

/**
 * Pick a random element from an array
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CUSTOMER_LINES = [
  "Hello, I'm calling regarding my account.",
  "Can you help me with my issue?",
  "I don't understand this charge.",
  "This is taking long, please hurry.",
  "Thanks, that helps a lot.",
];

const AGENT_LINES = [
  "Sure, I can help with that.",
  "Please give me a moment.",
  "I'm checking that information for you.",
  "I totally understand your concern.",
  "Happy to assist you.",
];

/** @type {("neutral"|"positive"|"negative")[]} */
const SENTIMENT = ["neutral", "positive", "negative"];

/**
 * Generate a waveform array of 64 float samples
 * @returns {number[]}
 */
function generateWaveform() {
  /** @type {number[]} */
  const out = [];
  for (let i = 0; i < 64; i++) {
    const base = Math.sin((i / 64) * Math.PI * 2);
    const noise = (Math.random() - 0.5) * 0.3;
    out.push(Number((base * 0.7 + noise).toFixed(3)));
  }
  return out;
}

/* ------------------------------------------------------
 * MOCK ENGINE
 * ------------------------------------------------------ */

/**
 * @param {ReduxStore} store
 * @param {string} callId
 * @returns {() => void}
 */
function startMockStream(store, callId) {
  console.log("🦙 MOCK STT STREAM → START", callId);

  /** @type {ReturnType<typeof setInterval>} */
  const sttInterval = setInterval(() => {
    /** @type {"customer"|"agent"} */
    const speaker = Math.random() > 0.5 ? "customer" : "agent";
    const text =
      speaker === "customer" ? pick(CUSTOMER_LINES) : pick(AGENT_LINES);

    store.dispatch(addTranscript({ speaker, text }));

    if (Math.random() < 0.3) {
      store.dispatch(updateSentiment(pick(SENTIMENT)));
    }
  }, 1200);

  /** @type {ReturnType<typeof setInterval>} */
  const waveInterval = setInterval(() => {
    const data = generateWaveform();

    // ✅ PATCHED: store real waveform, not AI summary hack
    store.dispatch(updateWaveform(data));
  }, 120);

  return () => {
    clearInterval(sttInterval);
    clearInterval(waveInterval);
  };
}

/* ------------------------------------------------------
 * REAL ENGINE
 * ------------------------------------------------------ */

/**
 * @param {ReduxStore} store
 * @param {string} callId
 * @returns {() => void}
 */
function startRealStream(store, callId) {
  const wsUrl = `${appConfig.WS_STT_URL}?callId=${encodeURIComponent(callId)}`;

  /** @type {WebSocket | null} */
  let ws = new WebSocket(wsUrl);

  /** @type {ReturnType<typeof setInterval> | null} */
  let heartbeat = null;

  ws.onopen = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "subscribe", callId }));
    }

    heartbeat = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 8000);
  };

  ws.onmessage = (event) => {
    /** @type {STTMessage} */
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!msg || !msg.type) return;

    switch (msg.type) {
      case "stt": {
        /** @type {"agent"|"customer"} */
        const speaker =
          msg.speaker === "agent" || msg.speaker === "customer"
            ? msg.speaker
            : "customer";

        const text = msg.text ?? "";
        store.dispatch(addTranscript({ speaker, text }));
        break;
      }

      case "sentiment": {
        if (
          msg.sentiment === "neutral" ||
          msg.sentiment === "positive" ||
          msg.sentiment === "negative"
        ) {
          store.dispatch(updateSentiment(msg.sentiment));
        }
        break;
      }

      case "waveform": {
        if (Array.isArray(msg.samples)) {
          // ✅ PATCHED: use waveform reducer directly
          store.dispatch(updateWaveform(msg.samples));
        }
        break;
      }
    }
  };

  ws.onclose = () => {
    if (heartbeat !== null) clearInterval(heartbeat);
    heartbeat = null;
  };

  return () => {
    if (heartbeat !== null) clearInterval(heartbeat);
    if (ws) ws.close();
    ws = null;
  };
}

/* ------------------------------------------------------
 * PUBLIC ENTRY POINT
 * ------------------------------------------------------ */

/**
 * @param {ReduxStore} store
 * @param {string} callId
 * @returns {() => void}
 */
export function startSTTStream(store, callId) {
  if (!callId) return () => {};

  const useMock = Boolean(appConfig.MOCK_MODE);

  return useMock
    ? startMockStream(store, callId)
    : startRealStream(store, callId);
}
