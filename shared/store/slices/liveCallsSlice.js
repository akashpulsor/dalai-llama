// shared/store/slices/liveCallsSlice.js
// --------------------------------------------------------
//  Live Calls Slice (Supervisor / Dashboard / Analytics)
// --------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

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

/**
 * @typedef {object} LiveCallsState
 * @property {LiveCall[]} calls
 */

/** @type {LiveCallsState} */
const initialState = {
  calls: [],
};

const liveCallsSlice = createSlice({
  name: "liveCalls",
  initialState,

  reducers: {
    /**
     * Replace full list of live calls
     * @param {LiveCallsState} state
     * @param {{payload: LiveCall[]}} action
     */
    setLiveCalls(state, action) {
      state.calls = Array.isArray(action.payload) ? action.payload : [];
    },

    /**
     * Insert or update a single call
     * @param {LiveCallsState} state
     * @param {{payload: LiveCall}} action
     */
    upsertLiveCall(state, action) {
      const call = action.payload;
      const idx = state.calls.findIndex((c) => c.id === call.id);

      if (idx >= 0) {
        state.calls[idx] = { ...state.calls[idx], ...call };
      } else {
        state.calls.push(call);
      }
    },

    /**
     * Remove call by ID
     * @param {LiveCallsState} state
     * @param {{payload: string}} action
     */
    removeLiveCall(state, action) {
      state.calls = state.calls.filter((c) => c.id !== action.payload);
    },

    /**
     * Logout or disconnect
     */
    resetLiveCalls() {
      return initialState;
    },
  },
});

export const {
  setLiveCalls,
  upsertLiveCall,
  removeLiveCall,
  resetLiveCalls,
} = liveCallsSlice.actions;

export default liveCallsSlice.reducer;
