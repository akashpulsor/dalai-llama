// shared/hooks/useLiveCalls.js
// --------------------------------------------------------------
//  useLiveCalls Hook
//  Unified POLLING + MOCK + REAL WebSocket live call updates
// --------------------------------------------------------------

import { useEffect } from "react";
import { appConfig } from "@dalaillama/shared-config";

import store from "@dalaillama/shared-store";
import {
  setLiveCalls,
  upsertLiveCall,
  removeLiveCall,
} from "@dalaillama/shared-store/slices/liveCallsSlice.js";

import { api } from "@dalaillama/shared-store/slices/apiSlice.js";

const dispatchAny = /** @type {any} */ (store.dispatch);

/* --------------------------------------------------------------
 * TYPE HELPERS
 * --------------------------------------------------------------*/
/**
 * @typedef {"ringing"|"connected"|"hold"|"ended"} LiveCallStatus
 */

/**
 * @typedef {object} LiveCall
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {LiveCallStatus} status
 * @property {string} sentiment
 * @property {number} startedAt
 * @property {number} durationMs
 */

const validStatuses = ["ringing", "connected", "hold", "ended"];

/**
 * Normalize incoming live call to strict LiveCall type.
 * @param {any} raw
 * @returns {import("@dalaillama/shared-store/slices/liveCallsSlice.js").LiveCall | null}
 */
function normalizeLiveCall(raw) {
  if (!raw) return null;

  return {
    id: String(raw.id),
    from: String(raw.from ?? ""),
    to: String(raw.to ?? ""),
    startedAt: Number(raw.startedAt ?? Date.now()),
    durationMs: Number(raw.durationMs ?? 0),

    // FIX 1: Narrow status → LiveCallStatus
    status: validStatuses.includes(raw.status)
      ? raw.status
      : "connected",

    // always a string
    sentiment:
      typeof raw.sentiment === "string" ? raw.sentiment : "neutral",
  };
}

/* --------------------------------------------------------------
 * MOCK ENGINE
 * --------------------------------------------------------------*/

function startMockLiveCalls() {
  console.log("🦙 MOCK LIVE CALL STREAM — ACTIVE");

  const interval = setInterval(() => {
    const id = "mock-" + Math.floor(Math.random() * 3);

    const mockCall = normalizeLiveCall({
      id,
      from: "+1555000" + id,
      to: "Agent " + id,
      status: "connected",
      sentiment: ["neutral", "positive", "negative"][
        Math.floor(Math.random() * 3)
      ],
      startedAt: Date.now() - 30000,
      durationMs: 30000 + Math.random() * 10000,
    });

    if (mockCall) store.dispatch(upsertLiveCall(mockCall));

    if (Math.random() < 0.2) {
      store.dispatch(removeLiveCall(id));
    }
  }, 1500);

  return () => clearInterval(interval);
}

/* --------------------------------------------------------------
 * REAL ENGINE (WebSocket + fallback polling)
 * --------------------------------------------------------------*/

/**
 * @param {string} wsUrl
 * @returns {() => void}
 */
function startRealWebSocket(wsUrl) {
  /** @type {WebSocket | null} */
  let ws = new WebSocket(wsUrl); // FIX: ws is always constructed here

  /** heartbeat */
  const hb = setInterval(() => {
    // FIX 2: TS-safe ws null guard
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    }
  }, 7000);

  ws.onopen = () => console.log("WS LiveCalls connected");

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case "set":
        if (Array.isArray(msg.calls)) {
            /** @type {LiveCall[]} */
            const normalized = msg.calls
            .map(
            /**
             * @param {any} c
             * @returns {LiveCall | null}
             */
            (c) => normalizeLiveCall(c)
            )
            .filter(
            /**
             * @param {LiveCall | null} x
             * @returns {x is LiveCall}
             */
            (x) => x !== null
            );

            store.dispatch(setLiveCalls(normalized));
        }
        break;

        case "upsert":
          if (msg.call) {
            const call = normalizeLiveCall(msg.call);
            if (call) store.dispatch(upsertLiveCall(call));
          }
          break;

        case "remove":
          if (msg.id) {
            store.dispatch(removeLiveCall(msg.id));
          }
          break;
      }
    } catch {}
  };

  return () => {
    clearInterval(hb);
    if (ws) ws.close(); // FIX: ws may be null
    ws = null;
  };
}

/**
 * Poll fallback if WebSocket fails
 * @returns {() => void}
 */
function startPolling() {
  const interval = setInterval(async () => {
    try {
      const res = /** @type {any} */ (
        await dispatchAny(api.endpoints.getLiveCall.initiate()).unwrap()
      );

      if (Array.isArray(res)) {
        /** @type {LiveCall[]} */
        const normalized = res
            .map((c /** @type {any} */) => normalizeLiveCall(c))
            .filter((x) => x !== null);

        store.dispatch(setLiveCalls(normalized));
        }
    else if (res && typeof res === "object") {
        const call = normalizeLiveCall(res);
        if (call) store.dispatch(upsertLiveCall(call));
      }
    } catch {
      // ignore
    }
  }, 3000);

  return () => clearInterval(interval);
}

/* --------------------------------------------------------------
 * PUBLIC HOOK
 * --------------------------------------------------------------*/

export function useLiveCalls() {
  useEffect(() => {
    const useMock = Boolean(appConfig.MOCK_MODE);

    if (useMock) {
      return startMockLiveCalls();
    }

    const wsUrl = `${appConfig.API_BASE_URL.replace(
      "http",
      "ws"
    )}/calls/live/ws`;

    const cleanup = startRealWebSocket(wsUrl);
    const fallback = startPolling();

    return () => {
      cleanup?.();
      fallback?.();
    };
  }, []);

  return {
    get state() {
      return store.getState().liveCalls;
    },
  };
}

export default useLiveCalls;
