// @ts-check
// shared/store/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { appConfig } from "@dalaillama/shared-config";

/* -------------------------------------------------------------------------- */
/*                               TOKEN HELPERS                                */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                                   STATE                                    */
/* -------------------------------------------------------------------------- */
/**
 * @typedef {"agent"|"supervisor"|"admin"} UserRole
 */

/**
 * @typedef {{ id: string, name: string, role: UserRole, email: string, tenantId: string }} User
 */

const safeGetStorageItem = (key) => {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

/**
 * @type {{ user: User | null, token: string | null, keycloakToken: string | null }}
 */
const initialState = {
  user: JSON.parse(safeGetStorageItem("user") || "null"),
  token: safeGetStorageItem("auth_token"),
  keycloakToken: null,
};

/* -------------------------------------------------------------------------- */
/*                                MOCK USERS                                  */
/* -------------------------------------------------------------------------- */
/** @type {Record<UserRole, User>} */
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
 * @returns {UserRole}
 */
const getRoleFromEmail = (email) => {
  const e = email.toLowerCase();
  if (e.includes("admin")) return "admin";
  if (e.includes("supervisor")) return "supervisor";
  return "agent";
};

/**
 * Get dashboard URL for role
 * @param {UserRole} role
 * @returns {string}
 */
const getDashboardUrl = (role) => {
  const routes = {
    admin: "/admin/dashboard",
    supervisor: "/supervisor/cockpit",
    agent: "/agent/live",
  };
  return routes[role] || "/agent/live";
};

/* -------------------------------------------------------------------------- */
/*                                   SLICE                                    */
/* -------------------------------------------------------------------------- */
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set user and token (used by keycloakApi after login)
     */
    setUser(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      // Note: localStorage is handled in keycloakApi to keep it in sync
    },

    /**
     * Set Keycloak token from tenant auth (useTenantAuth).
     * RTK Query prepareHeaders reads this for API calls.
     */
    setKeycloakToken(state, action) {
      state.keycloakToken = action.payload;
    },

    /**
     * Logout - clear state only (redirect handled by caller)
     */
    logout(state) {
      state.user = null;
      state.token = null;
      state.keycloakToken = null;
      // Note: localStorage clearing is handled in keycloakApi.clearAuthState()
    },

    /**
     * Validate token - check expiry
     */
    validateToken(state) {
      const token = state.token;
      if (!token || tokenExpired(token)) {
        state.user = null;
        state.token = null;
      }
    },

    /**
     * Mock login - for demo mode
     */
    loginMock(state, action) {
      const email = action.payload;
      const role = getRoleFromEmail(email);
      const user = MOCK_USERS[role];
      const token = `mock-token-${role}-${Date.now()}`;

      state.user = user;
      state.token = token;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (typeof window !== "undefined") {
        window.location.href = getDashboardUrl(role);
      }
    },

    /**
     * Mock login by role directly
     */
    loginMockByRole(state, action) {
      /** @type {UserRole} */
      const role = action.payload;
      const user = MOCK_USERS[role] || MOCK_USERS.agent;
      const token = `mock-token-${role}-${Date.now()}`;

      state.user = user;
      state.token = token;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (typeof window !== "undefined") {
        window.location.href = getDashboardUrl(role);
      }
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                                  EXPORTS                                   */
/* -------------------------------------------------------------------------- */
export const {
  setUser,
  setKeycloakToken,
  logout,
  validateToken,
  loginMock,
  loginMockByRole,
} = slice.actions;

export const login = loginMock;

export default slice.reducer;
