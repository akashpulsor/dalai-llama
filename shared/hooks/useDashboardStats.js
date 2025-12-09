// shared/hooks/useDashboardStats.js
// --------------------------------------------------------------
// Dashboard Analytics Hook
// --------------------------------------------------------------

import { useEffect } from "react";
import store from "@dalaillama/shared-store";
import { api } from "@dalaillama/shared-store/slices/apiSlice.js";

const dispatchAny = /** @type {any} */ (store.dispatch);

/**
 * @typedef {object} DashboardStats
 * @property {number} totalCalls
 * @property {number} answered
 * @property {number} missed
 * @property {number} avgHandleTime
 * @property {number} liveAgents
 */

export function useDashboardStats() {
  useEffect(() => {
    const run = async () => {
      try {
        const result = await dispatchAny(api.endpoints.getDashboardStats?.initiate()).unwrap();
        if (result) {
          store.dispatch({
            type: "dashboard/setStats",
            payload: result,
          });
        }
      } catch {}
    };

    run();
  }, []);

  return {
    get stats() {
      return store.getState().dashboard?.stats ?? {};
    },
  };
}

export default useDashboardStats;
