import { createSlice } from '@reduxjs/toolkit';
import { appConfig } from '../../config/appConfig.js';

/**
 * @typedef {Object} TenantState
 * @property {string|null} tenantId
 * @property {string|null} slug
 * @property {string|null} name
 * @property {string|null} companyName
 * @property {string|null} status
 * @property {string|null} keycloakUrl
 * @property {string|null} keycloakRealm
 * @property {string|null} keycloakIssuer
 * @property {string|null} keycloakClientId
 * @property {string|null} productCode
 * @property {string|null} stompWsUrl
 * @property {string|null} websocketUrl
 * @property {string|null} tenantWsUrl
 * @property {string|null} turnUrl
 * @property {string|null} dashboardUrl
 * @property {Record<string, any>} features
 * @property {Array<any>} apps
 * @property {boolean} isResolved
 */

const safeGetStorageItem = (/** @type {string} */ key) => {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

/** @type {TenantState} */
const initialState = {
  tenantId: null,
  slug: null,
  name: null,
  companyName: null,
  status: null,
  keycloakUrl: null,
  keycloakRealm: null,
  keycloakIssuer: null,
  keycloakClientId: null,
  productCode: null,
  stompWsUrl: null,
  websocketUrl: null,
  tenantWsUrl: null,
  turnUrl: null,
  dashboardUrl: null,
  features: {},
  apps: [],
  isResolved: false,
};

// Load persisted tenant config from localStorage
const persistedTenantConfig = safeGetStorageItem("tenant_config");
if (persistedTenantConfig) {
  try {
    const parsed = JSON.parse(persistedTenantConfig);
    Object.assign(initialState, parsed);
  } catch (e) {
    console.error("Failed to parse persisted tenant config:", e);
  }
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    /**
     * Update tenant identity without requiring a full tenant-config payload.
     * Useful for dashboard flows where the tenant is created before
     * websocket/app config is fetched.
     * @param {import('@reduxjs/toolkit').PayloadAction<{ tenantId?: string|null, slug?: string|null, name?: string|null, companyName?: string|null }>} action
     */
    setTenantIdentity(state, action) {
      const {
        tenantId = state.tenantId,
        slug = state.slug,
        name = state.name,
        companyName = state.companyName,
      } = action.payload || {};

      state.tenantId = tenantId ?? state.tenantId;
      state.slug = slug ?? state.slug;
      state.name = name ?? state.name;
      state.companyName = companyName ?? state.companyName;

      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("tenant_config", JSON.stringify(state));
        }
      } catch (e) {
        console.error("Failed to persist tenant identity:", e);
      }
    },

    /**
     * Populate from v5 backend: GET /api/v1/public/tenant-config/{slug}
     * @param {import('@reduxjs/toolkit').PayloadAction<any>} action
     */
    setTenantConfig(state, action) {
      const cfg = action.payload;

      // Tenant-level fields
      state.tenantId = cfg.tenant_id ?? cfg.slug ?? null;
      state.slug = cfg.slug ?? null;
      state.name = cfg.name ?? null;
      state.companyName = cfg.company_name ?? null;
      state.status = cfg.status ?? null;

      // Keycloak auth — handle both keycloak_realm and realm field names
      state.keycloakUrl = cfg.keycloak_url ?? null;
      state.keycloakRealm = cfg.keycloak_realm ?? cfg.realm ?? null;
      state.keycloakIssuer = cfg.keycloak_issuer ?? null;

      // Per-app config — find the matching app for the current appType
      // (set by useTenantAuth after resolving from hostname)
      const apps = cfg.apps || [];
      state.apps = apps;

      const app = apps[0];
      if (app) {
        state.keycloakClientId = app.keycloak_client_id ?? cfg.client_id ?? null;
        state.productCode = app.product_code ?? cfg.product_code ?? null;
        // Handle both websocket_url and stomp_ws_url field names (per-app and top-level)
        const wsUrl = app.websocket_url ?? app.stomp_ws_url ?? cfg.stomp_ws_url ?? null;
        state.stompWsUrl = wsUrl;
        state.websocketUrl = wsUrl;
        state.turnUrl = app.turn_url ?? cfg.turn_url ?? null;
        state.dashboardUrl = app.dashboard_url ?? null;
        state.features = app.features || cfg.features || {};
      } else {
        // Flat response format — no apps array, read top-level fields directly
        state.keycloakClientId = cfg.client_id ?? null;
        state.productCode = cfg.product_code ?? null;
        state.stompWsUrl = cfg.stomp_ws_url ?? null;
        state.websocketUrl = cfg.stomp_ws_url ?? null;
        state.turnUrl = cfg.turn_url ?? null;
        state.dashboardUrl = null;
        state.features = cfg.features || {};
      }

      // Derive tenant-service WS URL from API_BASE_URL
      // API_BASE_URL: https://api.dalaillama.in/api/v1 → wss://api.dalaillama.in/ws
      // API_BASE_URL: /api/v1 (local proxy) → ws://localhost:{port}/ws
      try {
        const apiBase = appConfig.API_BASE_URL || '';
        if (apiBase.startsWith('/')) {
          // Local dev with Vite proxy — use current origin
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          state.tenantWsUrl = origin.replace(/^http/, 'ws') + '/ws';
        } else {
          const url = new URL(apiBase);
          const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
          state.tenantWsUrl = `${wsProto}//${url.host}/ws`;
        }
      } catch (e) {
        console.warn('Failed to derive tenant WS URL:', e);
        state.tenantWsUrl = null;
      }

      state.isResolved = true;

      // Persist to localStorage
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("tenant_config", JSON.stringify(state));
        }
      } catch (e) {
        console.error("Failed to persist tenant config:", e);
      }
    },

    /**
     * Select a specific app from the apps array (by appType or index).
     * Called after setTenantConfig when the appType is known.
     * @param {import('@reduxjs/toolkit').PayloadAction<string>} action - appType: 'admin'|'agent'|'supervisor'
     */
    selectApp(state, action) {
      const appType = action.payload;
      const app = state.apps.find(a =>
        a.app_type?.toLowerCase() === appType ||
        a.product_code?.toLowerCase().includes(appType)
      ) || state.apps[0];

      if (app) {
        state.keycloakClientId = app.keycloak_client_id ?? null;
        state.productCode = app.product_code ?? null;
        const wsUrl = app.websocket_url ?? app.stomp_ws_url ?? null;
        state.stompWsUrl = wsUrl;
        state.websocketUrl = wsUrl;
        state.turnUrl = app.turn_url ?? null;
        state.dashboardUrl = app.dashboard_url ?? null;
        state.features = app.features || {};
      }
    },

    clearTenant(state) {
      Object.assign(state, initialState);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("tenant_config");
        }
      } catch (e) {
        console.error("Failed to clear persisted tenant config:", e);
      }
    },
  },
});

export const { setTenantIdentity, setTenantConfig, selectApp, clearTenant } = tenantSlice.actions;

/** @param {{ tenant: TenantState }} state */
export const selectTenant = (state) => state.tenant;
/** @param {{ tenant: TenantState }} state */
export const selectTenantId = (state) => state.tenant.tenantId;
/** @param {{ tenant: TenantState }} state */
export const selectProductCode = (state) => state.tenant.productCode;
/** @param {{ tenant: TenantState }} state */
export const selectFeatures = (state) => state.tenant.features;
/**
 * @param {string} name
 * @returns {(state: { tenant: TenantState }) => boolean}
 */
export const selectFeature = (name) => (state) => !!state.tenant.features[name];
/** @param {{ tenant: TenantState }} state */
export const selectIsResolved = (state) => state.tenant.isResolved;
/** @param {{ tenant: TenantState }} state */
export const selectTenantWsUrl = (state) => state.tenant.tenantWsUrl;
/** @param {{ tenant: TenantState }} state */
export const selectStompWsUrl = (state) => state.tenant.stompWsUrl;

export default tenantSlice.reducer;
