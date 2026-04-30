import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} BotTestState
 * @property {string|null} sessionId
 * @property {boolean} isActive
 * @property {Array<{role: string, text: string, timestamp: number}>} transcript
 * @property {Array<{intent: string, confidence: number, timestamp: number}>} intents
 * @property {number} sentiment
 * @property {Array<{type: string, target: string, reason: string, timestamp: number}>} escalationEvents
 * @property {Object|null} pipelineStatus
 * @property {Object|null} latency
 */

/** @type {BotTestState} */
const initialState = {
  sessionId: null,
  isActive: false,
  transcript: [],
  intents: [],
  sentiment: 0,
  escalationEvents: [],
  pipelineStatus: null,
  latency: null,
};

const botTestSlice = createSlice({
  name: 'botTest',
  initialState,
  reducers: {
    startSession(state, action) {
      state.sessionId = action.payload;
      state.isActive = true;
      state.transcript = [];
      state.intents = [];
      state.sentiment = 0;
      state.escalationEvents = [];
      state.pipelineStatus = null;
      state.latency = null;
    },
    endSession(state) {
      state.isActive = false;
    },
    addTranscript(state, action) {
      state.transcript.push({ ...action.payload, timestamp: Date.now() });
    },
    addIntent(state, action) {
      state.intents.push({ ...action.payload, timestamp: Date.now() });
    },
    setSentiment(state, action) {
      state.sentiment = action.payload;
    },
    addEscalation(state, action) {
      state.escalationEvents.push({ ...action.payload, timestamp: Date.now() });
    },
    setPipelineStatus(state, action) {
      state.pipelineStatus = action.payload;
    },
    setLatency(state, action) {
      state.latency = action.payload;
    },
    resetBotTest() {
      return initialState;
    },
  },
});

export const {
  startSession, endSession, addTranscript, addIntent,
  setSentiment, addEscalation, setPipelineStatus, setLatency, resetBotTest,
} = botTestSlice.actions;

/** @param {{ botTest: BotTestState }} state */
export const selectBotTest = (state) => state.botTest;

export default botTestSlice.reducer;