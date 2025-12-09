// shared/store/slices/callSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * Import shared types for JSDoc type safety
 * (no runtime imports — these come from .d.ts declarations)
 *
 * @typedef {import("@dalaillama/shared-types/call").CallState} CallState
 * @typedef {import("@dalaillama/shared-types/call").ActiveCall} ActiveCall
 * @typedef {import("@dalaillama/shared-types/call").Speaker} Speaker
 * @typedef {import("@dalaillama/shared-types/call").Sentiment} Sentiment
 * @typedef {import("@dalaillama/shared-types/call").WaveformArray} WaveformArray
 */

/* -------------------------------------------------------------------------- */
/*                         INITIAL STATE + HELPERS                             */
/* -------------------------------------------------------------------------- */

/**
 * @returns {{agent: string[], customer: string[]}}
 */
const emptyTranscript = () => ({
  agent: [],
  customer: [],
});

/**
 * @returns {WaveformArray}
 */
const emptyWaveform = () => new Array(64).fill(0);

/** @type {CallState} */
const initialState = {
  activeCall: null,
  inACW: false,
  acwForm: {},
};

/* -------------------------------------------------------------------------- */
/*                               CALL SLICE                                   */
/* -------------------------------------------------------------------------- */

const callSlice = createSlice({
  name: "call",
  initialState,

  reducers: {
    /**
     * Start inbound/outbound call
     */
    startCall(state, action) {
      const p = action.payload;

      /** @type {ActiveCall} */
      const newCall = {
        callId: p.callId,
        direction: p.direction,
        from: p.from,
        to: p.to,

        status: "ringing",
        startedAt: Date.now(),
        durationMs: 0,

        sentiment: "neutral",
        transcript: emptyTranscript(),
        waveform: emptyWaveform(),

        mute: false,
        hold: false,
        recording: true,

        supervisorListening: false,
        supervisorWhispering: false,

        aiSummary: null,
      };

      state.activeCall = newCall;
    },

    acceptCall(state) {
      if (state.activeCall) {
        state.activeCall.status = "connected";
        state.activeCall.startedAt = Date.now();
      }
    },

    tick(state) {
      if (state.activeCall && state.activeCall.status === "connected") {
        state.activeCall.durationMs =
          Date.now() - state.activeCall.startedAt;
      }
    },

    /**
     * Append STT transcript lines
     */
    addTranscript(state, action) {
      if (!state.activeCall) return;

      const { speaker, text } = action.payload;

      if (speaker === "agent") {
        state.activeCall.transcript.agent.push(text);
        if (state.activeCall.transcript.agent.length > 50)
          state.activeCall.transcript.agent.shift();
      } else {
        state.activeCall.transcript.customer.push(text);
        if (state.activeCall.transcript.customer.length > 50)
          state.activeCall.transcript.customer.shift();
      }
    },

    /**
     * Update live sentiment
     */
    updateSentiment(state, action) {
      if (state.activeCall) {
        /** @type {Sentiment} */
        const sentiment = action.payload;
        state.activeCall.sentiment = sentiment;
      }
    },

    /**
     * Inject waveform array (from WS or mock)
     */
    updateWaveform(state, action) {
      if (!state.activeCall) return;

      /** @type {WaveformArray} */
      const samples = Array.isArray(action.payload)
        ? action.payload.slice(0, 64)
        : emptyWaveform();

      state.activeCall.waveform = samples;
    },

    toggleMute(state) {
      if (state.activeCall) state.activeCall.mute = !state.activeCall.mute;
    },

    toggleHold(state) {
      if (state.activeCall) state.activeCall.hold = !state.activeCall.hold;
    },

    supervisorListen(state) {
      if (state.activeCall) state.activeCall.supervisorListening = true;
    },
    supervisorStopListen(state) {
      if (state.activeCall) state.activeCall.supervisorListening = false;
    },

    supervisorWhisper(state) {
      if (state.activeCall) {
        state.activeCall.supervisorWhispering = true;
        state.activeCall.supervisorListening = true;
      }
    },
    supervisorStopWhisper(state) {
      if (state.activeCall) {
        state.activeCall.supervisorWhispering = false;
      }
    },

    endCall(state) {
      if (state.activeCall) {
        state.activeCall.status = "ended";
        state.inACW = true;
      }
    },

    updateACW(state, action) {
      state.acwForm = { ...state.acwForm, ...action.payload };
    },

    setAISummary(state, action) {
      if (state.activeCall) {
        state.activeCall.aiSummary = action.payload;
      }
    },

    completeACW(state) {
      state.inACW = false;
      state.acwForm = {};
      state.activeCall = null;
    },

    resetCallState() {
      return initialState;
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                             EXPORTS                                         */
/* -------------------------------------------------------------------------- */

export const {
  startCall,
  acceptCall,
  tick,
  addTranscript,
  updateSentiment,
  updateWaveform,
  toggleMute,
  toggleHold,
  supervisorListen,
  supervisorStopListen,
  supervisorWhisper,
  supervisorStopWhisper,
  endCall,
  updateACW,
  setAISummary,
  completeACW,
  resetCallState,
} = callSlice.actions;

export default callSlice.reducer;
