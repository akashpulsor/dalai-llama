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
    selectedLlm: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      console.log(state)
    },
    setToken: (state, action) => {

       storeTokenInAsyncStorage(state.token).then(() => {
          console.log(state);
      })
      .catch(error => {
          console.error('Error storing token:', error);
      });
      state.isLoggedIn = true;
      state.token = action.payload;
      //console.log(state);
    },
   clearAuth: (state) => {
      //TODO add error case
      removeTokenInAsyncStorage().then(r =>{

      });
       state.user = null;
       state.token = null;
       state.isLoggedIn = false;
    },
    setTools: (state, action) => {
      state.tools = action.payload;
    },
    setLlm: (state, action) => {
      state.llm = action.payload;
    },
    setSelectedLlm: (state, action) => {
          state.selectedLlm = action.payload;
          },
  },
  extraReducers: (builder) =>{
    builder.addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
            authSlice.caseReducers.setToken(state,payload);
        }
    ),
        builder.addMatcher(
            authApi.endpoints.getTools.matchFulfilled,
            (state, { payload }) => {
                authSlice.caseReducers.setTools(state, payload)
    }),
        builder.addMatcher(
            authApi.endpoints.getLlm.matchFulfilled,
            (state, { payload }) => {
                authSlice.caseReducers.setLlm(state, payload)
            }),
        builder.addMatcher(
            authApi.endpoints.logout.matchFulfilled,
            (state, { payload }) => {
                authSlice.caseReducers.clearAuth()
            }),
        builder.addMatcher(
            authApi.endpoints.register.matchFulfilled,
            (state, { payload }) => {
                authSlice.caseReducers.setUser(state,payload);
                authSlice.caseReducers.setToken(state,payload);
            })
  }

});

export const { setUser, setToken, clearAuth,
  setTools,setLlm,setSelectedLlm } = authSlice.actions;

// Store token in AsyncStorage
const storeTokenInAsyncStorage = async (token) => {
    console.log(token);
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
}

const removeTokenInAsyncStorage = async () => {
    try {
        await AsyncStorage.removeItem('authToken');
    } catch (error) {
        console.error('Error storing token:', error);
    }
};

// Export async action creator to store token in AsyncStorage


export default authSlice.reducer;

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectUser = (state) => state.auth.user;

export const selectTools = (state) => state.auth.tools;

export const selectLlmData = (state) => state.auth.llm;

export const selectError = (state) => state.auth.error;

export const selectedLLm = (state) => state.auth.selectedLlm;

