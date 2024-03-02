import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authApi } from './authApi'; // Import authApi
import authReducer from './authSlice'; // Import authSlice reducer

import { useNavigation } from '@react-navigation/native';
import { Toast } from 'react-native-toast-message'

export const navigate = (routeName, params) => {
    const navigation = useNavigation();
    navigation.navigate(routeName, params);
};

const showToastError = (message) =>{
    Toast.show(
        {
            Type:"Error",
            Text1:{message},
            autoHide:false,
            visibiliyTime:2500,
            position: 'top',
        }
    )
}

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
          } else if (action.error ) {
            // Handle token expiration, redirect to login page
              if (action.payload?.status === 401) {
                  navigate('Login');
              }
              else {
                  console.log("ERROR  "+ action.payload);
                  showToastError(action.payload);
              }
             // Replace with your navigation function
          }
          return next(action);
        });
      },
});

