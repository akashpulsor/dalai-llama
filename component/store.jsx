import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit';
import { authApi } from './authApi'; // Import authApi
import authReducer from './authSlice'; // Import authSlice reducer
import { setupListeners } from '@reduxjs/toolkit/query';
import flashMessageReducer from './flashMessageSlice';
// Combine reducers
const rootReducer = combineReducers({
    auth: authReducer,
    flashMessage: flashMessageReducer,
    [authApi.reducerPath]: authApi.reducer, // Add authApi reducer
    // Add other reducers if any
});



export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
});

setupListeners(store.dispatch);



// Export the store as well if needed
export default store;