import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit';
import { authApi } from './authApi'; // Import authApi
import authReducer from './authSlice'; // Import authSlice reducer
import { setUser, setToken, clearAuth, setTools } from './authSlice';
import { useNavigation } from '@react-navigation/native';

// Combine reducers
const rootReducer = combineReducers({
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer, // Add authApi reducer
    // Add other reducers if any
});

export const navigate = (routeName, params) => {
    const navigation = useNavigation();
    navigation.navigate(routeName, params);
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
});

// Define middleware to handle token expiration
const handleTokenExpiration = ({ dispatch, getState }) => (next) => async (action) => {
    if (action.type === 'authApi/login/fulfilled' || action.type === 'authApi/register/fulfilled') {
        const { token } = action.payload; // Assuming token is returned in the payload
        // Save token to local storage, redux store, or wherever you prefer
        dispatch(setToken(token));
    } else if (action.error) {
        // Handle token expiration, redirect to login page
        if (action.payload?.status === 401 && action.payload.data?.message === 'Token expired') {
            const refreshTokenResult = await dispatch(authApi.endpoints.refreshToken.initiate());
            if (refreshTokenResult && !refreshTokenResult.error) {
                // Token refreshed successfully, retry the original request
                // Extract the original request from action.meta.originalArgs
                const originalRequest = action.meta.originalArgs;
                const result = await dispatch(originalRequest);
                return result;
            } else {
                // Refresh token failed, redirect to login page or handle error
                navigate('Login'); // Redirect to login page
            }
        } else {
            console.log("ERROR: ", action.payload);
        }
    }
    return next(action);
};

store.dispatch(handleTokenExpiration);
