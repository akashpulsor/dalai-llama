// @ts-check

import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { appConfig } from "@dalaillama/shared-config";
import { prometheusClient } from "@dalaillama/shared-utils";
import KeycloakPkg from "keycloak-js";

/** @type {any} */
const KeycloakCtor = KeycloakPkg.default || KeycloakPkg;

/* ---------------------------------------------
 * TOKEN HELPERS
 --------------------------------------------- */
/**
 * @param {string} token
 * @returns {boolean}
 */
const tokenExpired = (token) => {
  try {
    /** @type {{ exp?: number }} */
    const decoded = jwtDecode(token);
    return !decoded.exp || decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

/* ---------------------------------------------
 * STATE
 --------------------------------------------- */
/**
 * @typedef {"agent"|"supervisor"|"admin"} MockRole
 */

/**
 * @typedef {{ id: string, name: string, role: MockRole, email: string, tenantId: string }} MockUser
 */

/**
 * @type {{ user: MockUser | null, token: string | null }}
 */
const initialState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("auth_token"),
};

/* ---------------------------------------------
 * MOCK USERS
 --------------------------------------------- */
/** @type {Record<MockRole, MockUser>} */
const MOCK_USERS = {
  agent: {
    id: "mock-agent-1",
    name: "Mock Agent",
    role: "agent",
    email: "agent@demo.com",
    tenantId: "tenant-demo",
  },
  supervisor: {
    id: "mock-supervisor-1",
    name: "Mock Supervisor",
    role: "supervisor",
    email: "supervisor@demo.com",
    tenantId: "tenant-demo",
  },
  admin: {
    id: "mock-admin-1",
    name: "Mock Admin",
    role: "admin",
    email: "admin@demo.com",
    tenantId: "tenant-demo",
  },
};

/**
 * @param {string} email
 * @returns {MockRole}
 */
const getRoleFromEmail = (email) => {
  const e = email.toLowerCase();
  if (e.includes("admin")) return "admin";
  if (e.includes("supervisor")) return "supervisor";
  return "agent";
};

/* ---------------------------------------------
 * SLICE
 --------------------------------------------- */
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * @param {typeof initialState} state
     * @param {{ payload: { user: MockUser, token: string } }} action
     */
    setUser(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    /**
     * @param {typeof initialState} state
     */
    logout(state) {
      state.user = null;
      state.token = null;

      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");

      window.location.href = `${appConfig.PLATFORM_URL}`;
    },

    /**
     * @param {typeof initialState} state
     */
    validateToken(state) {
      const token = state.token;
      const expired = !token || tokenExpired(token);

      prometheusClient.pushTokenStatus(!expired);

      if (expired) {
        state.user = null;
        state.token = null;

        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        window.location.href = `${appConfig.PLATFORM_URL}/login`;
      }
    },

    /**
     * MOCK LOGIN
     * @param {typeof initialState} state
     * @param {{ payload: string }} action
     */
    loginMock(state, action) {
      const  email  = action.payload;
      console.log("MOCK LOGIN:", email);
      const role = getRoleFromEmail(email);

      const user = MOCK_USERS[role];
      const token = `mock-token-${role}`;

      state.user = user;
      state.token = token;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (role === "admin") window.location.href = "/admin/dashboard";
      else if (role === "supervisor") window.location.href = "/supervisor/cockpit";
      else window.location.href = "/agent/live";
    },

    /**
     * REAL LOGIN
     * @param {typeof initialState} _state
     */
    loginReal(_state) {
      // @ts-ignore constructor signature mismatch
      const keycloak = new KeycloakCtor({
        url: appConfig.KEYCLOAK_URL,
        realm: appConfig.KEYCLOAK_REALM,
        clientId: appConfig.KEYCLOAK_CLIENT,
      });

      keycloak.login();
    },

   /**
     * Main login entry point — delegates to mock or real implementation.
     * NOTE: we forward the original action to loginMock, and call loginReal with only state.
     *
     * @param {typeof initialState} state
     * @param {{ payload: string }} action
     */
    login(state, action) {
      if (appConfig.MOCK_MODE) {
        // loginMock expects (state, action) where action has payload (email)
        slice.caseReducers.loginMock(state, action);
      } else {
        // loginReal expects only state
        slice.caseReducers.loginReal(state);
      }
    },
  },
});

/* ---------------------------------------------
 * EXPORTS
 --------------------------------------------- */
export const {
  setUser,
  logout,
  validateToken,
  login,
  loginMock,
  loginReal,
} = slice.actions;

export default slice.reducer;
