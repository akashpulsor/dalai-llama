// @ts-nocheck
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentSceneIndex: 11,
  isPlaying: false,
  cursorMs: 12000,
  durationMs: 30000,
};

const previewSlice = createSlice({
  name: "creatorPreview",
  initialState,
  reducers: {
    setCurrentSceneIndex(state, action) {
      state.currentSceneIndex = Math.max(0, Number(action.payload) || 0);
    },
    togglePlayback(state) {
      state.isPlaying = !state.isPlaying;
    },
    setPlaying(state, action) {
      state.isPlaying = Boolean(action.payload);
    },
    setCursorMs(state, action) {
      state.cursorMs = Math.max(0, Math.min(state.durationMs, Number(action.payload) || 0));
    },
    setDurationMs(state, action) {
      const next = Math.max(1000, Number(action.payload) || state.durationMs);
      state.durationMs = next;
      state.cursorMs = Math.min(state.cursorMs, next);
    },
  },
});

export const { setCurrentSceneIndex, togglePlayback, setPlaying, setCursorMs, setDurationMs } = previewSlice.actions;
export const selectCreatorPreview = (state) => state.creatorPreview;
export default previewSlice.reducer;
