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
    tools:null,
    llm:null,
    onboardingData:null,
    businessData: null,
    isLoggedIn: false,
    twiliodata:null,
    selectedLlm: {}
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      console.log(state);
    },
    setToken: (state, action) => {
        storeTokenInAsyncStorage(action.payload.token);
        state.isLoggedIn = true;
        state.token = action.payload.token;
        
    },
   clearAuth: (state) => {
      //TODO add error case
      removeTokenInAsyncStorage().then(r =>{

      });
       state.user = null;
       state.token = null;
       state.isLoggedIn = false;
    },

    setOnboardingData: (state, action) => {
      state.onboardingData = action.payload;
      
    },
    setBusinessData: (state, action) => {
      state.businessData = action.payload;
    },
    setTwilioData: (state, action) => {
      state.twiliodata = action.payload;
    }
  }
});

export const { setUser, setToken, clearAuth,
  setOnboardingData, setBusinessData,setTwilioData  } = authSlice.actions;

// Store token in AsyncStorage
const storeTokenInAsyncStorage = async (token) => {
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



export const selectError = (state) => state.auth.error;

export const selectOnboardingData = (state) => state.auth.onboardingData;
export const selectBusinessData = (state) => state.auth.businessData;

export const selectTwilioData = (state) => state.auth.TwilioData;

