import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  message: '',
  type: '', // 'success' | 'error'
  isVisible: false
};

const flashMessageSlice = createSlice({
  name: 'flashMessage',
  initialState,
  reducers: {
    showMessage: (state, action) => {
      state.message = action.payload.message;
      state.type = action.payload.type;
      state.isVisible = true;
    },
    hideMessage: (state) => {
      state.message = '';
      state.type = '';
      state.isVisible = false;
    }
  }
});

export const { showMessage, hideMessage } = flashMessageSlice.actions;
export default flashMessageSlice.reducer;