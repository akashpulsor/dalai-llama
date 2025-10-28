import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

import { appConfig } from "@dalaillama/shared-config";
import { prometheusClient } from "@dalaillama/shared-utils";

/**
 * Check whether JWT token is expired
 * @param {string} token
 * @returns {boolean}
 */
const tokenExpired = (token) => {
  try {
    /** @type {{ exp?: number }} */
    const { exp } = jwtDecode(token);
    return !exp || exp * 1000 < Date.now(); // ✅ Fix undefined exp
  } catch {
    return true;
  }
};

/** @type {{ user: any, token: string | null }} */
const initialState = {
  user: null,
  token: localStorage.getItem("auth_token") || null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      localStorage.setItem("auth_token", token);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("auth_token");
      window.location.href = `${appConfig.PLATFORM_URL}/login`;
    },
    validateToken(state) {
      const token = localStorage.getItem("auth_token");
      const expired = !token || tokenExpired(token);
      prometheusClient.pushTokenStatus(!expired);
      if (expired) {
        localStorage.removeItem("auth_token");
        window.location.href = `${appConfig.PLATFORM_URL}/login`;
      }
    }
  }
});

export const { setUser, logout, validateToken } = slice.actions;
export default slice.reducer;
