// shared/store/slices/settingsSlice.js
// --------------------------------------------------------------
// App UI Settings Slice (Theme, Layout, Softphone Mode)
// --------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {"light"|"dark"} ThemeMode
 * @typedef {"compact"|"comfortable"} LayoutMode
 * @typedef {"embedded"|"floating"} SoftphoneMode
 */

/**
 * @typedef {object} SettingsState
 * @property {ThemeMode} theme
 * @property {LayoutMode} layout
 * @property {SoftphoneMode} softphoneMode
 */

/** @type {SettingsState} */
const initialState = {
  theme: "light",
  layout: "comfortable",
  softphoneMode: "embedded",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    /**
     * @param {SettingsState} state
     * @param {{payload: ThemeMode}} action
     */
    setTheme(state, action) {
      state.theme = action.payload;
    },

    /**
     * @param {SettingsState} state
     * @param {{payload: LayoutMode}} action
     */
    setLayout(state, action) {
      state.layout = action.payload;
    },

    /**
     * @param {SettingsState} state
     * @param {{payload: SoftphoneMode}} action
     */
    setSoftphoneMode(state, action) {
      state.softphoneMode = action.payload;
    },

    /**
     * Reset to default UI settings
     */
    resetSettings() {
      return initialState;
    },
  },
});

export const {
  setTheme,
  setLayout,
  setSoftphoneMode,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
