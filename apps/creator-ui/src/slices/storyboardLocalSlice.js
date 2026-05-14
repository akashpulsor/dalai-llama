// @ts-nocheck
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  hoveredSceneId: null,
  regeneratingSceneIds: [],
  readySceneIds: [],
  imageReadySceneIds: [],
};

const storyboardLocalSlice = createSlice({
  name: "creatorStoryboardLocal",
  initialState,
  reducers: {
    setHoveredScene(state, action) {
      state.hoveredSceneId = action.payload;
    },
    markSceneRegenerating(state, action) {
      if (!state.regeneratingSceneIds.includes(action.payload)) state.regeneratingSceneIds.push(action.payload);
    },
    clearSceneRegenerating(state, action) {
      state.regeneratingSceneIds = state.regeneratingSceneIds.filter((id) => id !== action.payload);
    },
    markSceneJsonReady(state, action) {
      if (!state.readySceneIds.includes(action.payload)) state.readySceneIds.push(action.payload);
    },
    markSceneImageReady(state, action) {
      if (!state.imageReadySceneIds.includes(action.payload)) state.imageReadySceneIds.push(action.payload);
    },
    resetStoryboardLocal() {
      return initialState;
    },
  },
});

export const {
  setHoveredScene,
  markSceneRegenerating,
  clearSceneRegenerating,
  markSceneJsonReady,
  markSceneImageReady,
  resetStoryboardLocal,
} = storyboardLocalSlice.actions;

export const selectCreatorStoryboardLocal = (state) => state.creatorStoryboardLocal;
export default storyboardLocalSlice.reducer;
