// authSlice.js

import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: 'idle',
    error: null,
    tools:null,
    llm:null,
    isLoggedIn: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = true;
      console.log(state)
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
    },
    setTools: (state) => {
      state.tools = action.payload;
    },
    setLlm: (state) => {
      state.llm = action.payload;
    },
  },
});

export const { setUser, setToken, clearAuth } = authSlice.actions;

// Store token in AsyncStorage
const storeTokenInAsyncStorage = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

// Export async action creator to store token in AsyncStorage
export const storeToken = (token) => async (dispatch) => {
  dispatch(setToken(token));
  await storeTokenInAsyncStorage(token);
};

export default authSlice.reducer;

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectEmail = (state) => state.auth.email;
export const selectUser = (state) => state.auth.user;