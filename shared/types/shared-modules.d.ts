declare module "@dalaillama/shared-hooks" {
  import type { MutationTrigger } from "@reduxjs/toolkit/query/react";

  export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "supervisor" | "agent";
    tenantId: string;
  }

  export function useAuthGuard(): {
    status: "checking" | "authenticated" | "redirecting";
    user: User | null;
  };

  export function useMetricsHeartbeat(): void;
  export function useAuthBootstrap(options?: {
    redirectToDashboard?: boolean;
  }): {
    status: string;
    error: string | null;
  };

  export const keycloakApi: any;

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

  export function getAccessToken(): string | null;
  export function getUser(): User | null;
  export function isAuthenticated(): boolean;
  export function isTokenExpired(token: string): boolean;
  export function clearAuthState(): void;

  export type AppType = "agent" | "supervisor" | "admin";

  export interface TenantAuthResult {
    isReady: boolean;
    isAuthenticated: boolean;
    user: any;
    tenantId: string | null;
    productCode: string | null;
    features: Record<string, any>;
    token: string | null;
    keycloak: any;
    error: string | null;
    logout: () => void;
  }

  export function useTenantAuth(appType: AppType): TenantAuthResult;

  export interface StompSubscription {
    unsubscribe: () => void;
  }

  export interface StompEventsResult {
    isConnected: boolean;
    subscribe: (
      topic: string,
      callback: (msg: any) => void
    ) => StompSubscription;
    send: (destination: string, body: any) => void;
    client: any;
  }

  export function useStompEvents(token: string | null): StompEventsResult;

  export interface SipPhoneResult {
    isRegistered: boolean;
    register: () => Promise<void>;
    unregister: () => Promise<void>;
    call: (number: string) => Promise<void>;
    answer: () => Promise<void>;
    hangup: () => void;
    hold: () => Promise<void>;
    unhold: () => Promise<void>;
    mute: () => void;
    unmute: () => void;
    transfer: (target: string) => Promise<void>;
    sendDtmf: (digit: string) => void;
    isMuted: boolean;
  }

  export function useSipPhone(): SipPhoneResult;

  export interface BotTestResult {
    sendMessage: (text: string) => Promise<void>;
    startVoice: () => Promise<void>;
    stopVoice: () => void;
    startTest: () => Promise<void>;
    endTest: () => void;
    transcript: Array<{ role: string; text: string; timestamp?: number }>;
    intents: Array<{ intent: string; confidence: number; timestamp?: number }>;
    sentiment: number;
    escalationEvents: Array<{
      type: string;
      target?: string;
      reason?: string;
      timestamp?: number;
    }>;
    isActive: boolean;
  }

  export function useBotTest(
    botId: string | null,
    options?: { voiceBrainUrl?: string }
  ): BotTestResult;

  export interface TestCallResult {
    startCall: (options?: {
      phone_number?: string;
      use_softphone?: boolean;
    }) => Promise<void>;
    hangup: () => Promise<void>;
    callId: string | null;
    pipelineStatus: any;
    latency: any;
    transcript: Array<{ role: string; text: string; timestamp?: number }>;
    intents: Array<{ intent: string; confidence: number; timestamp?: number }>;
    sentiment: number;
    escalationEvents: Array<{
      type: string;
      target?: string;
      reason?: string;
      timestamp?: number;
    }>;
    isActive: boolean;
  }

  export function useTestCall(
    botId: string | null,
    deps?: {
      useStompSubscribe?: (
        topic: string,
        callback: (msg: any) => void
      ) => { unsubscribe: () => void };
    }
  ): TestCallResult;

  export type RangePreset =
    | "today"
    | "yesterday"
    | "this_week"
    | "this_month"
    | "last_30_days"
    | "custom";

  export interface AnalyticsRangeResult {
    fromTs: string;
    toTs: string;
    preset: RangePreset;
    setPreset: (p: RangePreset) => void;
    setCustomRange: (from: Date, to: Date) => void;
    label: string;
  }

  export function useAnalyticsRange(
    defaultPreset?: RangePreset
  ): AnalyticsRangeResult;
  export const RANGE_PRESETS: RangePreset[];
  export const PRESET_LABELS: Record<RangePreset, string>;
}
