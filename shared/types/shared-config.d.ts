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
    
    LOG_LEVEL: string;
    METRICS_ENDPOINT: string;

    getDashboardUrl(planType: "shared" | "single", id: string): string;

    MOCK_MODE: boolean;
    DEMO_MODE: boolean;

    MOCK_API_BASE_URL: string;

    WS_STT_URL: string;
    MOCK_WS_URL: string;
    LOG_COLLECTOR_URL: string;

    /** 🚀 ROUTES MUST BE DEFINED EXACTLY LIKE JS */
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
  }

  export const appConfig: AppConfig;
  export const MOCK_MODE: boolean;
  export const DEMO_MODE: boolean;
  export const API_BASE_URL: string;
}
