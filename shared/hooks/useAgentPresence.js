// shared/hooks/useAgentPresence.js
// --------------------------------------------------------------
//  Agent Presence Hook (Supervisor Dashboard + Agent List)
// --------------------------------------------------------------

import { useEffect } from "react";
import store from "@dalaillama/shared-store";
import {
  setAgents,
  upsertAgent,
  removeAgent,
} from "@dalaillama/shared-store/slices/agentPresenceSlice.js";

import { api } from "@dalaillama/shared-store/slices/apiSlice.js";
import { appConfig } from "@dalaillama/shared-config";

const dispatchAny = /** @type {any} */ (store.dispatch);

/**
 * @typedef {"online"|"offline"|"on-call"|"acw"} AgentPresenceStatus
 */

/**
 * @typedef {object} AgentPresence
 * @property {string} id
 * @property {string} name
 * @property {AgentPresenceStatus} status
 * @property {number} updatedAt
 */

/**
 * Normalize API response into AgentPresence type
 * @param {any} raw
 * @returns {AgentPresence | null}
 */
function normalizePresence(raw) {
  if (!raw) return null;

  const valid = ["online", "offline", "on-call", "acw"];

  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    status: valid.includes(raw.status) ? raw.status : "offline",
    updatedAt: Number(raw.updatedAt ?? Date.now()),
  };
}

/**
 * POLLING fallback for agent presence
 */
function startPollingPresence() {
  const interval = setInterval(async () => {
    try {
      const res = /** @type {any} */ (
        await dispatchAny(api.endpoints.getAgents.initiate()).unwrap()
      );

      if (Array.isArray(res)) {
        const normalized = res
          .map((x) => normalizePresence(x))
          .filter((x) => x !== null);

        store.dispatch(setAgents(normalized));
      }
    } catch {}
  }, 4000);

  return () => clearInterval(interval);
}

/**
 * Main public hook to use in UI
 */
export function useAgentPresence() {
  useEffect(() => {
    const polling = startPollingPresence();

    return () => polling?.();
  }, []);

  return {
    get agents() {
      return store.getState().agentPresence.agents;
    },
  };
}

export default useAgentPresence;
