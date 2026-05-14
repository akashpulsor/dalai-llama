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

/** @param {any} cfg */
const getTenantApps = (cfg) => {
  if (Array.isArray(cfg?.apps)) return cfg.apps;
  if (cfg?.app && typeof cfg.app === "object") return [cfg.app];
  return [];
};

/** @param {any} app */
const getAppClientId = (app) => app?.keycloak_client_id ?? app?.keycloakClientId ?? null;
/** @param {any} app */
const getAppProductCode = (app) => app?.product_code ?? app?.productCode ?? null;
/** @param {any} app */
const getAppWsUrl = (app, cfg) => app?.websocket_url ?? app?.websocketUrl ?? app?.stomp_ws_url ?? app?.stompWsUrl ?? cfg?.stomp_ws_url ?? cfg?.stompWsUrl ?? null;
/** @param {any} app */
const getAppTurnUrl = (app, cfg) => app?.turn_url ?? app?.turnUrl ?? cfg?.turn_url ?? cfg?.turnUrl ?? null;
/** @param {any} app */
const getAppDashboardUrl = (app) => app?.dashboard_url ?? app?.dashboardUrl ?? app?.app_url ?? app?.appUrl ?? app?.url ?? null;
/** @param {any} app */
const getAppFeatures = (app, cfg) => app?.features || cfg?.features || {};

/**
 * @param {any} app
 * @param {string} targetAppType
 * @returns {boolean}
 */
const matchesAppType = (app, targetAppType) => {
  const rawType = String(app?.app_type ?? app?.appType ?? "").toLowerCase();
  const rawProduct = String(app?.product_code ?? app?.productCode ?? "").toLowerCase();
  const rawSubdomain = String(app?.subdomain ?? "").toLowerCase();

  if (targetAppType === "admin") {
    return rawType.includes("admin") || rawProduct.includes("admin") || rawSubdomain === "admin";
  }
  if (targetAppType === "supervisor") {
    return rawType.includes("supervisor") || rawProduct.includes("supervisor") || rawSubdomain === "supervisor";
  }
  if (targetAppType === "agent") {
    return rawType.includes("contact_center") || rawType.includes("agent") || rawProduct.includes("agent") || rawSubdomain === "agent";
  }
  if (targetAppType === "dashboard") {
    return rawType.includes("dashboard") || rawProduct.includes("dashboard") || rawSubdomain === "dashboard";
  }
  return false;
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

      // Eagerly derive tenantWsUrl so STOMP can connect without waiting
      // for the public tenant-config endpoint (dashboard-ui doesn't need it).
      if (!state.tenantWsUrl) {
        try {
          const apiBase = appConfig.API_BASE_URL || '';
          if (apiBase.startsWith('/')) {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            state.tenantWsUrl = origin.replace(/^http/, 'ws') + '/ws';
          } else {
            const url = new URL(apiBase);
            const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
            state.tenantWsUrl = `${wsProto}//${url.host}/ws`;
          }
        } catch (e) {
          console.warn('Failed to derive tenant WS URL in setTenantIdentity:', e);
        }
      }

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
      const apps = getTenantApps(cfg);
      state.apps = apps;

      const app = apps[0];
      if (app) {
        state.keycloakClientId = getAppClientId(app) ?? cfg.client_id ?? cfg.clientId ?? null;
        state.productCode = getAppProductCode(app) ?? cfg.product_code ?? cfg.productCode ?? null;
        const wsUrl = getAppWsUrl(app, cfg);
        state.stompWsUrl = wsUrl;
        state.websocketUrl = wsUrl;
        state.turnUrl = getAppTurnUrl(app, cfg);
        state.dashboardUrl = getAppDashboardUrl(app);
        state.features = getAppFeatures(app, cfg);
      } else {
        // Flat response format — no apps array, read top-level fields directly
        state.keycloakClientId = cfg.client_id ?? cfg.clientId ?? null;
        state.productCode = cfg.product_code ?? cfg.productCode ?? null;
        state.stompWsUrl = cfg.stomp_ws_url ?? cfg.stompWsUrl ?? null;
        state.websocketUrl = cfg.stomp_ws_url ?? cfg.stompWsUrl ?? null;
        state.turnUrl = cfg.turn_url ?? cfg.turnUrl ?? null;
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
      const app = state.apps.find((a) => matchesAppType(a, appType)) || state.apps[0];

      if (app) {
        state.keycloakClientId = getAppClientId(app);
        state.productCode = getAppProductCode(app);
        const wsUrl = getAppWsUrl(app, {});
        state.stompWsUrl = wsUrl;
        state.websocketUrl = wsUrl;
        state.turnUrl = getAppTurnUrl(app, {});
        state.dashboardUrl = getAppDashboardUrl(app);
        state.features = getAppFeatures(app, {});
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
