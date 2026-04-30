import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import keycloak from 'keycloak-js';
const Keycloak = /** @type {any} */ (keycloak);
import { setTenantConfig, selectApp, selectIsResolved } from '../store/slices/tenantSlice.js';
import { setKeycloakToken } from '../store/slices/authSlice.js';

/**
 * @typedef {'agent'|'supervisor'|'admin'} AppType
 */

/**
 * @typedef {Object} TenantAuthResult
 * @property {boolean} isReady
 * @property {boolean} isAuthenticated
 * @property {any} user
 * @property {string|null} tenantId
 * @property {string|null} productCode
 * @property {Record<string, any>} features
 * @property {string|null} token
 * @property {Keycloak|null} keycloak
 * @property {string|null} error
 * @property {() => void} logout
 */

/**
 * Tenant-aware Keycloak auth hook for agent-ui, supervisor-ui, admin-ui.
 *
 * @param {AppType} appType - 'agent' | 'supervisor' | 'admin'
 * @returns {TenantAuthResult}
 */
export default function useTenantAuth(appType) {
  const dispatch = useDispatch();
  const isResolved = useSelector(selectIsResolved);

  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(/** @type {any} */ (null));
  const [token, setToken] = useState(/** @type {string|null} */ (null));
  const [error, setError] = useState(/** @type {string|null} */ (null));

  const keycloakRef = /** @type {import('react').MutableRefObject<Keycloak|null>} */ (useRef(null));
  const refreshIntervalRef = /** @type {import('react').MutableRefObject<ReturnType<typeof setInterval>|null>} */ (useRef(null));

  // ── Step 1: Parse subdomain ──
  const parsedRef = /** @type {import('react').MutableRefObject<{slug: string, resolvedAppType: string}|null>} */ (useRef(null));
  if (!parsedRef.current) {
    parsedRef.current = parseSubdomain(window.location.hostname, appType);
  }
  const { slug, resolvedAppType } = parsedRef.current;

  // ── Steps 2-5: Init sequence (runs once) ──
  useEffect(() => {
    if (!slug) {
      setError('Could not resolve tenant from URL');
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        // Step 2: Fetch tenant config from api.{domain} (no auth, public endpoint)
        const apiBase = getApiBaseUrl();
        const configRes = await fetch(`${apiBase}/api/v1/public/tenant-config/${slug}`, {
          headers: { 'X-App-Type': resolvedAppType },
        });
        if (!configRes.ok) {
          if (configRes.status === 400) throw new Error(`Invalid tenant: ${slug}`);
          if (configRes.status === 404) throw new Error(`Tenant not found: ${slug}`);
          if (configRes.status === 403) {
            const body = await configRes.json().catch(() => ({}));
            throw new Error(body.message || `Tenant inactive: ${slug}`);
          }
          throw new Error(`Tenant config error: ${configRes.status}`);
        }
        const tenantConfig = await configRes.json();
        if (cancelled) return;

        // Dispatch to Redux — populates tenant-level + first app config
        dispatch(setTenantConfig(tenantConfig));
        // Select the app matching this UI's appType
        dispatch(selectApp(resolvedAppType));

        // Find the matching app's keycloak_client_id
        const apps = tenantConfig.apps || [];
        const matchedApp = apps.find(a =>
          a.app_type?.toLowerCase() === resolvedAppType
        ) || apps[0];

        if (!matchedApp) {
          throw new Error(`No app configured for type: ${resolvedAppType}`);
        }

        // Step 3: Init Keycloak with tenant realm
        const kc = new Keycloak({
          url: tenantConfig.keycloak_url,
          realm: tenantConfig.keycloak_realm,
          clientId: matchedApp.keycloak_client_id,
        });
        keycloakRef.current = kc;

        const authenticated = await kc.init({
          onLoad: 'login-required',
          pkceMethod: 'S256',
          checkLoginIframe: false,
        });

        if (cancelled) return;

        if (!authenticated) {
          setError('Authentication failed');
          return;
        }

        setIsAuthenticated(true);
        setToken(kc.token ?? null);
        dispatch(setKeycloakToken(kc.token ?? null));

        // Step 4: Fetch user profile (uses JWT)
        const meRes = await fetch(`${apiBase}/api/v1/agents/me`, {
          headers: { 'Authorization': `Bearer ${kc.token}` },
        });

        if (meRes.ok) {
          const profile = await meRes.json();
          if (!cancelled) setUser(profile);
        }

        // Step 5: Token refresh every 50s
        refreshIntervalRef.current = setInterval(async () => {
          try {
            const refreshed = await kc.updateToken(60);
            if (refreshed) {
              setToken(kc.token ?? null);
              dispatch(setKeycloakToken(kc.token ?? null));
            }
          } catch (/** @type {any} */ _err) {
            console.error('Token refresh failed, redirecting to login');
            kc.login();
          }
        }, 50000);

        if (!cancelled) setIsReady(true);

      } catch (/** @type {any} */ err) {
        console.error('Tenant auth init failed:', err);
        if (!cancelled) setError(err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [slug, resolvedAppType, dispatch]);

  const logout = useCallback(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    keycloakRef.current?.logout({ redirectUri: window.location.origin });
  }, []);

  return {
    isReady,
    isAuthenticated,
    user,
    token,
    tenantId: user?.tenant_id || null,
    productCode: /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.tenant.productCode)),
    features: /** @type {Record<string, any>} */ (useSelector((/** @type {any} */ s) => s.tenant.features)),
    keycloak: keycloakRef.current,
    error,
    logout,
  };
}

/**
 * Parse "agent-acme.dalaillama.in" → { slug: "acme", resolvedAppType: "agent" }
 * @param {string} hostname
 * @param {string} fallbackAppType
 * @returns {{ slug: string, resolvedAppType: string }}
 */
function parseSubdomain(hostname, fallbackAppType) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    return {
      slug: params.get('tenant') || import.meta.env.VITE_TENANT_SLUG || 'demo',
      resolvedAppType: params.get('app') || fallbackAppType,
    };
  }

  const parts = hostname.split('.');
  const subdomain = parts[0];

  const dashIndex = subdomain.indexOf('-');
  if (dashIndex === -1) {
    return { slug: subdomain, resolvedAppType: fallbackAppType };
  }

  const appPart = subdomain.substring(0, dashIndex);
  const slugPart = subdomain.substring(dashIndex + 1);

  return {
    slug: slugPart,
    resolvedAppType: ['agent', 'supervisor', 'admin'].includes(appPart) ? appPart : fallbackAppType,
  };
}

/**
 * Get base domain from current hostname.
 * e.g. "admin-acme.dalaillama.in" → "dalaillama.in"
 * @returns {string}
 */
function getDomain() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') return import.meta.env.VITE_AUTH_DOMAIN || 'localhost:8081';
  const parts = hostname.split('.');
  return parts.slice(-2).join('.');
}

/**
 * Get the API base URL.
 * In production: https://api.{domain} (e.g. https://api.dalaillama.in)
 * In dev: use Vite proxy (empty string) or VITE_API_BASE_URL
 * @returns {string}
 */
function getApiBaseUrl() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_API_BASE_URL || '';
  }
  const domain = getDomain();
  return `https://api.${domain}`;
}