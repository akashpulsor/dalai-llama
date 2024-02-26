// authSlice.js

import { createSlice,isAnyOf } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import {authApi} from "./authApi";



export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: 'idle',
    error: null,
    tools:[],
    llm:[],
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
      console.log(state);
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      console.log("AKASH4")
    },
    setTools: (state, action) => {
      state.tools = action.payload;
    },
    setLlm: (state, action) => {
      state.llm = action.payload;
    },
  },
  extraReducers: (builder) =>{
    builder.addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          console.log("AKASH")
          state.token = payload.token
          state.user = payload.user
          state.isLoggedIn = true;
        }
    ),
        builder.addMatcher(
            authApi.endpoints.getTools.matchFulfilled,
            (state, { payload }) => {
              console.log("AKASH3")
              state.tools = payload
    }),
        builder.addMatcher(
            authApi.endpoints.getLlm.matchFulfilled,
            (state, { payload }) => {
              console.log("AKASH4")
              state.llm = payload
            }),
        builder.addMatcher(
            authApi.endpoints.logout.matchFulfilled,
            (state, { payload }) => {
                clearAuth()
            })
  }

});

export const { setUser, setToken, clearAuth,
  setTools,setLlm } = authSlice.actions;

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

export const selectTools = (state) => state.auth.tools;

export const selectLlm = (state) => state.auth.llm;