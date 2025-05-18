import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { authApi } from './authApi';
import { websocketApi } from './websocketApi'; // Add this import
import { publicApi } from './publicApi'; // Add this import
import { setupListeners } from '@reduxjs/toolkit/query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuth } from './authSlice';
import { jwtDecode } from 'jwt-decode';
import flashMessageReducer from './flashMessageSlice';

const isTokenExpired = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  } catch (error) {
    return true;
  }
};

const rootReducer = combineReducers({
  auth: authReducer,
  flashMessage: flashMessageReducer,
  [authApi.reducerPath]: authApi.reducer,
  [websocketApi.reducerPath]: websocketApi.reducer, // Add this line
  [publicApi.reducerPath]: publicApi.reducer, // Add this line
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authApi.middleware, websocketApi.middleware, publicApi.middleware), // Add publicApi.middleware
});

setupListeners(store.dispatch);

// Add a listener to check for 401 errors and token expiration
store.subscribe(() => {
  const { auth } = store.getState();
  if (authApi.reducerPath) {
    const lastError = store.getState()[authApi.reducerPath]?.queries || store.getState()[authApi.reducerPath]?.mutations;
    if (lastError) {
      const errorValue = Object.values(lastError).find(item => item?.error?.status === 401);
      if (errorValue?.error?.status === 401) {
        const token = auth.token;
        if (token && isTokenExpired(token)) {
          console.log("Token expired, clearing auth and navigating to login");
          AsyncStorage.removeItem('token').then(() => {
            store.dispatch(clearAuth());
          });
        } else {
          console.log("Token is still valid, redirecting to dashboard");
        }
      }
    }
  }
});

export default store;