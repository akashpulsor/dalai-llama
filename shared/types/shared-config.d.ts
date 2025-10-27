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

    getDashboardUrl: (planType: "shared" | "single", id: string) => string;

    // older fields some code referenced:
    ENV?: string;
    METRICS_ENDPOINT?: string;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error";
  }

  export const appConfig: AppConfig;
}
