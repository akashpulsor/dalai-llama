declare module "@dalaillama/shared-config" {
  export const appConfig: {
    APP_NAME: string;
    ENV: string;
    API_BASE_URL: string;
    METRICS_ENDPOINT: string;
    METRICS_INTERVAL_MS: number;
    LOG_LEVEL: string;
  };
}

declare module "@dalaillama/shared-utils" {
  export const logger: {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  };
  export const prometheusClient: {
    pushHeartbeat: () => Promise<void>;
  };
}

declare module "@dalaillama/shared-hooks" {
  export function useMetricsHeartbeat(): void;
  export function useAuthBootstrap(): void;
}

declare module "@dalaillama/shared-ui" {
  import * as React from "react";
  export const Toaster: React.FC;
  export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {}
}

declare module "@dalaillama/shared-store" {
  import { Store } from "@reduxjs/toolkit";
  export function createStore(): Store;
}
