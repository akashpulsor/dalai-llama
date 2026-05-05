import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { appConfig } from "@dalaillama/shared-config";
import {
  selectApp,
  setTenantConfig,
  setTenantIdentity,
} from "@dalaillama/shared-store";

const TENANT_CONTEXT_KEY = "dashboard_tenant_context";
const sanitizeTenantId = (tenantId) => {
  if (!tenantId) return null;
  const normalized = String(tenantId).trim();
  return normalized && normalized.toLowerCase() !== "default" ? normalized : null;
};

const safeReadJson = (key) => {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const safeReadStorage = (key) => {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const persistTenantContext = (context) => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TENANT_CONTEXT_KEY, JSON.stringify(context));
    if (context.tenantId) {
      window.localStorage.setItem("tenantId", context.tenantId);
    }
    if (context.slug) {
      window.localStorage.setItem("tenant_slug", context.slug);
    }
  } catch (error) {
    console.error("[dashboard] Failed to persist tenant context", error);
  }
};

const getQueryParam = (name) => {
  try {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
};

const resolveTenantContext = (tenantState) => {
  const persistedContext = safeReadJson(TENANT_CONTEXT_KEY) || {};
  const persistedConfig = safeReadJson("tenant_config") || {};

  return {
    tenantId:
      sanitizeTenantId(tenantState.tenantId) ||
      sanitizeTenantId(persistedContext.tenantId) ||
      sanitizeTenantId(safeReadStorage("tenantId")) ||
      null,
    slug:
      getQueryParam("tenant") ||
      getQueryParam("slug") ||
      tenantState.slug ||
      persistedContext.slug ||
      safeReadStorage("tenant_slug") ||
      persistedConfig.slug ||
      null,
  };
};

export default function useDashboardTenantBootstrap() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.keycloakToken || s.auth.token);
  const authTenantId = useSelector((s) => s.auth.user?.tenantId || null);
  const tenantState = useSelector((s) => s.tenant);
  const lastLoadedSlugRef = useRef(null);

  const tenantContext = useMemo(
    () => {
      const resolved = resolveTenantContext(tenantState);
      return {
        ...resolved,
        tenantId: sanitizeTenantId(resolved.tenantId) || sanitizeTenantId(authTenantId) || null,
      };
    },
    [authTenantId, tenantState.tenantId, tenantState.slug]
  );

  useEffect(() => {
    if (
      tenantContext.tenantId &&
      tenantContext.tenantId !== tenantState.tenantId
    ) {
      dispatch(setTenantIdentity({ tenantId: tenantContext.tenantId }));
    }

    if (tenantContext.slug && tenantContext.slug !== tenantState.slug) {
      dispatch(setTenantIdentity({ slug: tenantContext.slug }));
    }
  }, [
    dispatch,
    tenantContext.slug,
    tenantContext.tenantId,
    tenantState.slug,
    tenantState.tenantId,
  ]);

  useEffect(() => {
    if (!token || !tenantContext.slug) return;

    // Dashboard-ui already has Keycloak config from appConfig (platform realm).
    // The public endpoint is optional — only needed for apps/features metadata.
    // STOMP WS URL is derived from appConfig.API_BASE_URL in setTenantIdentity.
    if (
      lastLoadedSlugRef.current === tenantContext.slug &&
      tenantState.isResolved &&
      tenantState.slug === tenantContext.slug
    ) {
      return;
    }

    const controller = new AbortController();

    const loadTenantConfig = async () => {
      try {
        const response = await fetch(
          `${appConfig.API_BASE_URL}/public/tenant-config/${encodeURIComponent(tenantContext.slug)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-App-Type": "dashboard",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          console.error(`[dashboard] tenant-config ${response.status}:`, errBody);
          if (response.status === 404 || response.status === 403) {
            return;
          }
          throw new Error(`Tenant config request failed: ${response.status}`);
        }

        const config = await response.json();
        lastLoadedSlugRef.current = tenantContext.slug;
        dispatch(setTenantConfig(config));
        dispatch(selectApp("dashboard"));
        dispatch(
          setTenantIdentity({
            tenantId: config.tenant_id ?? tenantContext.tenantId ?? null,
            slug: config.slug ?? tenantContext.slug,
            name: config.name ?? null,
            companyName: config.company_name ?? null,
          })
        );

        persistTenantContext({
          tenantId: config.tenant_id ?? tenantContext.tenantId ?? null,
          slug: config.slug ?? tenantContext.slug,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[dashboard] Tenant config bootstrap failed", error);
      }
    };

    void loadTenantConfig();

    return () => controller.abort();
  }, [
    dispatch,
    tenantContext.slug,
    tenantContext.tenantId,
    tenantState.isResolved,
    tenantState.slug,
    tenantState.tenantId,
    token,
  ]);
}
