declare module "@dalaillama/shared-types/react-props" {
  export * from "../../shared/types/react-props";
}


// ════════════════════════════════════════════════════════════════════════
// FILE 6: ADDITIONS to shared/types/global.d.ts
//
// Add to ImportMetaEnv interface
// ════════════════════════════════════════════════════════════════════════

interface ImportMetaEnv {
  // Existing
  readonly VITE_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_METRICS_ENDPOINT: string;
  readonly VITE_LOG_LEVEL: string;

  // NEW — for tenant-facing apps (agent-ui, supervisor-ui, admin-ui)
  /** Tenant slug override for local dev (e.g., "acme") */
  readonly VITE_TENANT_SLUG?: string;
  /** Auth domain override for local dev (e.g., "localhost:8081") */
  readonly VITE_AUTH_DOMAIN?: string;
  /** SIP WSS URL override */
  readonly VITE_SIP_WSS_URL?: string;
  /** voice-brain URL for bot testing */
  readonly VITE_VOICE_BRAIN_URL?: string;
}