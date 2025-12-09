// shared/hooks/useSTTStream.js
// --------------------------------------------------------------
// React hook wrapper for STT WebSocket or Mock Engine
// --------------------------------------------------------------

import { useEffect, useRef } from "react";
import { startSTTStream } from "../store/slices/sttStream.js";
import store from "@dalaillama/shared-store";

/**
 * @typedef {import("@dalaillama/shared-types/call").ActiveCall} ActiveCall
 */

/**
 * React hook that automatically starts the STT stream
 * when a call is active and tears down when call ends.
 *
 * @param {ActiveCall | null} activeCall
 */
export function useSTTStream(activeCall) {
  /** @type {React.MutableRefObject<null | (() => void)>} */
  const cleanupRef = useRef(null);

  useEffect(() => {
    // If no active call, clean up and return
    if (!activeCall || !activeCall.callId) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // Start STT engine (mock or real chosen inside sttStream.js)
    cleanupRef.current = startSTTStream(store, activeCall.callId);

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [activeCall?.callId]);
}

export default useSTTStream;
