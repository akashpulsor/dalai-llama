import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authApi,authMiddleware } from './authApi'; // Import authApi
import authReducer from './authSlice'; // Import authSlice reducer
import { setUser, setToken, clearAuth,setTools,  } from './authSlice';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';


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
    middleware: (getDefaultMiddleware) => (next) => async (action) => {
        const dispatch = useDispatch();
        const { dispatch: baseDispatch, getState } = useDispatch();
        const state = getState();
        return getDefaultMiddleware().concat(authApi.middleware, (getDefaultMiddleware) => (next) => async (action) => {
            if (action.type === 'authApi/login/fulfilled' || action.type === 'authApi/register/fulfilled') {
                const {token} = action.payload; // Assuming token is returned in the payload
                // Save token to local storage, redux store, or wherever you prefer
                dispatch(setToken(token));
            } else if (action.error) {
                // Handle token expiration, redirect to login page
                if (action.payload?.status === 401 && action.payload.data?.message === 'Token expired') {
                    const refreshTokenResult = await baseDispatch(authApi.endpoints.refreshToken.initiate());
                    if (refreshTokenResult && !refreshTokenResult.error) {
                        // Token refreshed successfully, retry the original request
                        // Extract the original request from action.meta.originalArgs
                        const originalRequest = action.meta.originalArgs;
                        const result = await baseDispatch(originalRequest);
                        return result;
                    } else {
                        // Refresh token failed, redirect to login page or handle error
                        navigate('Login'); // Redirect to login page
                    }
                } else {
                    console.log("ERROR  " + action.payload);
                }
                // Replace with your navigation function
            }
            return next(action);
        });
      },
});

