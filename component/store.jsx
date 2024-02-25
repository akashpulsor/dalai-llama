import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authApi } from './authApi'; // Import authApi
import authReducer from './authSlice'; // Import authSlice reducer

import { useNavigation } from '@react-navigation/native';

export const navigate = (routeName, params) => {
    const navigation = useNavigation();
    navigation.navigate(routeName, params);
};

// Combine reducers
const rootReducer = combineReducers({
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer, // Add authApi reducer
    // Add other reducers if any
  });

export const store = configureStore({
    reducer: rootReducer,
 
    // Define the middleware to intercept responses
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(authApi.middleware, (getDefaultMiddleware) => (next) => (action) => {
          if (action.type === 'authApi/login/fulfilled' || action.type === 'authApi/register/fulfilled') {
            const { token } = action.payload; // Assuming token is returned in the payload
            // Save token to local storage, redux store, or wherever you prefer
          } else if (action.error && action.payload?.status === 401) {
            // Handle token expiration, redirect to login page
            navigate('Login'); // Replace with your navigation function
          }
          return next(action);
        });
      },
});

