// shared/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./slices/apiSlice.js";
import authReducer, {
  setUser,
  logout,
  validateToken
} from "./slices/authSlice.js";
import flashReducer from "./slices/flashSlice.js";

/**
 * @typedef {import('@reduxjs/toolkit').EnhancedStore} EnhancedStore
 */

/**
 * Create and configure the Redux store
 * @returns {EnhancedStore}
 */
export const createStore = () =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
      flash: flashReducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

/** @type {EnhancedStore} */
const store = createStore();

export default store;

export * from "./slices/apiSlice.js";
export * from "./slices/authSlice.js";
export * from "./slices/flashSlice.js";
export { setUser, logout, validateToken };