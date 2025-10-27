declare module "@dalaillama/shared-utils" {
  export const prometheusClient: {
    pushHeartbeat: () => Promise<void>;
    push?: (metric: string, labels?: Record<string, string | number>, value?: number) => Promise<void>;
    pushLatency?: (name: string, durationMs: number, labels?: Record<string, string | number>) => Promise<void>;
    pushTokenStatus?: (ok: boolean) => Promise<void>;
  };

  export const logger: {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };

  export const logDebug: (...args: unknown[]) => void;
  export const logInfo: (...args: unknown[]) => void;
  export const logWarn: (...args: unknown[]) => void;
  export const logError: (...args: unknown[]) => void;
}
