import { createSlice } from "@reduxjs/toolkit";
const slice = createSlice({
  name: "flash",
  initialState: { message: null, type: "info" },
  reducers: {
    showFlash(state, action) {
      state.message = action.payload.message;
      state.type = action.payload.type || "info";
    },
    clearFlash(state) {
      state.message = null;
    }
  }
});
export const { showFlash, clearFlash } = slice.actions;
export default slice.reducer;
