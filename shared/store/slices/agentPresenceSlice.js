// shared/store/slices/agentPresenceSlice.js
// --------------------------------------------------------------
// Agent Presence State (Online / Offline / On-Call / ACW)
// --------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

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
 * @typedef {object} AgentPresenceState
 * @property {AgentPresence[]} agents
 */

/** @type {AgentPresenceState} */
const initialState = {
  agents: [],
};

const agentPresenceSlice = createSlice({
  name: "agentPresence",
  initialState,
  reducers: {
    /**
     * Replace full agent list
     * @param {AgentPresenceState} state
     * @param {{payload: AgentPresence[]}} action
     */
    setAgents(state, action) {
      state.agents = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    /**
     * Insert/update a single agent
     * @param {AgentPresenceState} state
     * @param {{payload: AgentPresence}} action
     */
    upsertAgent(state, action) {
      const agent = action.payload;
      const idx = state.agents.findIndex((a) => a.id === agent.id);

      if (idx >= 0) state.agents[idx] = { ...state.agents[idx], ...agent };
      else state.agents.push(agent);
    },

    /**
     * Remove an agent from tracking
     * @param {AgentPresenceState} state
     * @param {{payload: string}} action
     */
    removeAgent(state, action) {
      state.agents = state.agents.filter((a) => a.id !== action.payload);
    },

    resetAgentPresence() {
      return initialState;
    },
  },
});

export const {
  setAgents,
  upsertAgent,
  removeAgent,
  resetAgentPresence,
} = agentPresenceSlice.actions;

export default agentPresenceSlice.reducer;
