import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {{ id: string, direction: string, remoteNumber: string, remoteName: string, state: string, startTime: number }} ActiveCallInfo
 * @typedef {{ id: string, callerNumber: string, callerName: string, timestamp: number }} IncomingCallInfo
 *
 * @typedef {Object} SipState
 * @property {'UNREGISTERED'|'REGISTERING'|'REGISTERED'|'FAILED'} registrationState
 * @property {ActiveCallInfo|null} activeCall
 * @property {IncomingCallInfo|null} incomingCall
 * @property {'IDLE'|'RINGING_IN'|'RINGING_OUT'|'CONNECTED'|'ON_HOLD'|'WRAP_UP'} callState
 * @property {boolean} isMuted
 */

/** @type {SipState} */
const initialState = {
  registrationState: 'UNREGISTERED',
  activeCall: null,
  incomingCall: null,
  callState: 'IDLE',
  isMuted: false,
};

const sipSlice = createSlice({
  name: 'sip',
  initialState,
  reducers: {
    setRegistrationState(state, action) {
      state.registrationState = action.payload;
    },
    setIncomingCall(state, action) {
      state.incomingCall = action.payload;
      state.callState = action.payload ? 'RINGING_IN' : state.callState;
    },
    clearIncomingCall(state) {
      state.incomingCall = null;
      if (state.callState === 'RINGING_IN') state.callState = 'IDLE';
    },
    setActiveCall(state, action) {
      state.activeCall = action.payload;
      state.callState = action.payload ? 'CONNECTED' : 'IDLE';
      state.incomingCall = null;
    },
    setCallState(state, action) {
      state.callState = action.payload;
    },
    setMuted(state, action) {
      state.isMuted = action.payload;
    },
    callEnded(state) {
      state.activeCall = null;
      state.incomingCall = null;
      state.callState = 'WRAP_UP';
      state.isMuted = false;
    },
    wrapUpComplete(state) {
      state.callState = 'IDLE';
    },
    resetSip() {
      return initialState;
    },
  },
});

export const {
  setRegistrationState, setIncomingCall, clearIncomingCall,
  setActiveCall, setCallState, setMuted, callEnded, wrapUpComplete, resetSip,
} = sipSlice.actions;

/** @param {{ sip: SipState }} state */
export const selectSipState = (state) => state.sip;
/** @param {{ sip: SipState }} state */
export const selectIsRegistered = (state) => state.sip.registrationState === 'REGISTERED';
/** @param {{ sip: SipState }} state */
export const selectActiveCall = (state) => state.sip.activeCall;
/** @param {{ sip: SipState }} state */
export const selectIncomingCall = (state) => state.sip.incomingCall;
/** @param {{ sip: SipState }} state */
export const selectCallState = (state) => state.sip.callState;

export default sipSlice.reducer;