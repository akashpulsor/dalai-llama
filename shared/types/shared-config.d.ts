declare module "@dalaillama/shared-config" {
  export interface AppConfig {
    APP_NAME: string;
    PLATFORM_URL: string;
    API_BASE_URL: string;
    DASHBOARD_DOMAIN: string;

    PROM_PUSH_URL: string;
    PROM_JOB_NAME: string;
    METRICS_INTERVAL_MS: number;
    REQUEST_TIMEOUT_MS: number;
    ENABLE_LOGGING: boolean;

    /** Static Keycloak defaults (unused after provisioning) */
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_CLIENT: string;

    /** 👇 NEW: Injected after provisioning */
    RUNTIME_KEYCLOAK?: {
      url: string;
      realm: string;
      clientId: string;
    };

    LOG_LEVEL: string;
    METRICS_ENDPOINT: string;

    MOCK_MODE: boolean;
    DEMO_MODE: boolean;

    MOCK_API_BASE_URL: string;

    WS_STT_URL: string;
    MOCK_WS_URL: string;
    LOG_COLLECTOR_URL: string;

    /** 🚀 ROUTES MUST MATCH JS */
    APP_ROUTES: {
      ROOT: string;
      LOGIN: string;

      PLATFORM: string;
      DASHBOARD: string;
      AGENT: string;
      ANALYTICS: string;
      SUBSCRIPTION: string;
      TENANT: string;
    };

    /** ---------- REMOTE MICRO-APP ROUTES ---------- */
    REMOTE_APPS: {
      agent?: string;
      dashboard?: string;
      analytics?: string;
      subscription?: string;
    };

    /** ---------- URL BUILDERS ---------- */
    getDashboardUrl(planType: "shared" | "single", id: string): string;

    getTenantDashboardUrl(tenantId: string): string | undefined;
    getTenantAgentUrl(tenantId: string): string | undefined;
  }

  export const appConfig: AppConfig;

  /** 👇 NEW: Runtime override setter (provisioning injects Keycloak config) */
  export function setRuntimeKeycloakConfig(cfg: {
    url: string;
    realm: string;
    clientId: string;
  }): void;

  export const MOCK_MODE: boolean;
  export const DEMO_MODE: boolean;
  export const API_BASE_URL: string;
}
