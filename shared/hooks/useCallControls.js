// shared/hooks/useCallControls.js
// --------------------------------------------------------------
//  Unified Call Controls Hook
//  Auto-switches between REAL API and MOCK ENGINE
// --------------------------------------------------------------

import { useCallback } from "react";
import { appConfig } from "@dalaillama/shared-config";

import {
  startCall,
  acceptCall,
  endCall,
  toggleMute,
  toggleHold,
  supervisorListen,
  supervisorStopListen,
  supervisorWhisper,
  supervisorStopWhisper,
} from "@dalaillama/shared-store/slices/callSlice.js";

import { api } from "@dalaillama/shared-store/slices/apiSlice.js";
import store from "@dalaillama/shared-store";

/** --------------------------------------------------------------
 * DISPATCH (FIX)
 * RTK mutation initiate() returns a ThunkAction, so TS complains.
 * We safely wrap store.dispatch into dispatchAny ONCE.
 * --------------------------------------------------------------*/
const dispatchAny = /** @type {any} */ (store.dispatch);

/**
 * --------------------------------------------------------------------------
 * MOCK IMPLEMENTATION
 * --------------------------------------------------------------------------
 */
const mockControls = {
  /**
   * Mock originate call immediately
   * @param {string} to
   */
  dial: (to) => {
    const callId = "mock-" + Date.now();

    store.dispatch(
      startCall({
        callId,
        direction: "outbound",
        from: "0001112222",
        to,
      })
    );

    setTimeout(() => {
      store.dispatch(acceptCall());
    }, 800);

    return Promise.resolve({ callId });
  },

  acceptInbound: () => {
    store.dispatch(acceptCall());
  },

  hangup: () => {
    store.dispatch(endCall());
  },
};

/**
 * --------------------------------------------------------------------------
 * REAL API IMPLEMENTATION
 * --------------------------------------------------------------------------
 */
const realControls = {
  /**
   * @param {string} to
   */
  dial: async (to) => {
    try {
      const result = await dispatchAny(
        api.endpoints.originateCall.initiate({ to })
      ).unwrap();

      if (result?.callId) {
        store.dispatch(
          startCall({
            callId: result.callId,
            direction: "outbound",
            from: result.from || "",
            to,
          })
        );
      }

      return result;
    } catch (err) {
      console.error("Real dial failed → fallback to mock", err);
      return mockControls.dial(to);
    }
  },

  acceptInbound: async () => {
    try {
      await dispatchAny(api.endpoints.acceptCall.initiate()).unwrap();
      store.dispatch(acceptCall());
    } catch (err) {
      console.warn("Real acceptInbound failed → mock");
      mockControls.acceptInbound();
    }
  },

  hangup: async () => {
    try {
      await dispatchAny(api.endpoints.hangupCall.initiate()).unwrap();
      store.dispatch(endCall());
    } catch (err) {
      console.warn("Real hangup failed → mock");
      mockControls.hangup();
    }
  },
};

/**
 * --------------------------------------------------------------------------
 * PUBLIC HOOK
 * --------------------------------------------------------------------------
 */
export function useCallControls() {
  const useMock = Boolean(appConfig.MOCK_MODE);
  const controls = useMock ? mockControls : realControls;

  return {
    dial: useCallback(
    /**
     * @param {string} to
     */
    (to) => controls.dial(to),
    [useMock]
    ),

    acceptInbound: useCallback(() => controls.acceptInbound(), [useMock]),
    hangup: useCallback(() => controls.hangup(), [useMock]),

    mute: useCallback(() => store.dispatch(toggleMute()), []),
    hold: useCallback(() => store.dispatch(toggleHold()), []),

    supervisorListen: useCallback(
      () => store.dispatch(supervisorListen()),
      []
    ),
    supervisorStopListen: useCallback(
      () => store.dispatch(supervisorStopListen()),
      []
    ),

    supervisorWhisper: useCallback(
      () => store.dispatch(supervisorWhisper()),
      []
    ),
    supervisorStopWhisper: useCallback(
      () => store.dispatch(supervisorStopWhisper()),
      []
    ),
  };
}

export default useCallControls;
