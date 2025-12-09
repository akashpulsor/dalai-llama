// shared/hooks/useCallTimer.js
// --------------------------------------------------------------
//  Call Duration + ACW Timer Hook
//  Updates call duration every 1 second while connected
// --------------------------------------------------------------

import { useEffect, useRef } from "react";
import store from "@dalaillama/shared-store";
import { tick } from "@dalaillama/shared-store/slices/callSlice.js";

/**
 * @typedef {import("@dalaillama/shared-types/call").ActiveCall} ActiveCall
 */

/**
 * Hook that auto-updates call duration using callSlice.tick()
 *
 * @param {ActiveCall | null} activeCall
 */
export function useCallTimer(activeCall) {
  /** @type {React.MutableRefObject<NodeJS.Timeout | null>} */
  const intervalRef = useRef(null);

  useEffect(() => {
    // If no active call → clean up existing timer
    if (!activeCall || activeCall.status !== "connected") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start ticking every 1 second
    intervalRef.current = setInterval(() => {
      store.dispatch(tick());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeCall?.status]);

  return null;
}

export default useCallTimer;
