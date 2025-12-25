declare module "@dalaillama/shared-config" {
  export const appConfig: {
    APP_NAME: string;
    ENV: string;
    API_BASE_URL: string;
    METRICS_ENDPOINT: string;
    METRICS_INTERVAL_MS: number;
    LOG_LEVEL: string;
    PLATFORM_URL: string;
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_CLIENT: string;
    REMOTE_APPS?: {
      dashboard?: string;
      agent?: string;
      analytics?: string;
      subscription?: string;
    };
    APP_ROUTES?: {
      ROOT: string;
      LOGIN: string;
      PLATFORM: string;
      TENANT: string;
      AGENT: string;
      DASHBOARD: string;
      ANALYTICS: string;
      SUBSCRIPTION: string;
    };
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
    pushLatency: (...args: any[]) => Promise<void>;
    pushTokenStatus: (valid: boolean) => Promise<void>;
    push: (...args: any[]) => Promise<void>;
  };
}

declare module "@dalaillama/shared-hooks" {
  import type { MutationTrigger } from "@reduxjs/toolkit/query/react";

  // Existing
  export function useMetricsHeartbeat(): void;
  export function useAuthBootstrap(options?: { redirectToDashboard?: boolean }): {
    status: string;
    error: string | null;
  };

  // Keycloak API
  export const keycloakApi: any;

  // Keycloak Mutations
  export function useInitiateLoginMutation(): [
    MutationTrigger<any>,
    { isLoading: boolean; error?: any }
  ];

  export function useExchangeTokenMutation(): [
    MutationTrigger<any>,
    { isLoading: boolean; error?: any }
  ];

  export function useRefreshTokenMutation(): [
    MutationTrigger<any>,
    { isLoading: boolean; error?: any }
  ];

  export function useKeycloakLogoutMutation(): [
    MutationTrigger<any>,
    { isLoading: boolean; error?: any }
  ];

  // Auth utilities
  export function getAccessToken(): string | null;
  export function getUser(): {
    id: string;
    name: string;
    email: string;
    role: "admin" | "supervisor" | "agent";
    tenantId: string;
  } | null;
  export function isAuthenticated(): boolean;
  export function isTokenExpired(token: string): boolean;
  export function clearAuthState(): void;
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
