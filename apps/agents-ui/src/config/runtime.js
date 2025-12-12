// src/config/runtime.js

/**
 * Load runtime config (Keycloak + Branding)
 * Saved by: setRuntimeKeycloakConfig()
 *
 * @returns {{
 *   url: string,
 *   realm: string,
 *   clientId: string,
 *   brandName?: string,
 *   brandLogo?: string,
 *   tenantId?: string
 * } | null}
 */
// src/config/runtime.js
export function loadRuntime() {
  try {
    const raw = localStorage.getItem("kc_cfg");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load runtime", e);
    return null;
  }
}

