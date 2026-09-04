// @ts-nocheck
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schedulerPath = [
  path.resolve(__dirname, "node_modules/scheduler/index.js"),
  path.resolve(__dirname, "../../node_modules/scheduler/index.js"),
].find((candidate) => fs.existsSync(candidate));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "https://api.dalaillama.in/api/v1";
  const proxyTarget = (() => {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      return "https://api.dalaillama.in";
    }
  })();

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@dalaillama/shared-ui": path.resolve(__dirname, "../../shared/ui"),
        "@dalaillama/shared-hooks": path.resolve(__dirname, "../../shared/hooks"),
        "@dalaillama/shared-store": path.resolve(__dirname, "../../shared/store"),
        "@dalaillama/shared-config": path.resolve(__dirname, "../../shared/config"),
        "@dalaillama/shared-utils": path.resolve(__dirname, "../../shared/utils"),
        "@dalaillama/shared-types": path.resolve(__dirname, "../../shared/types"),
        ...(schedulerPath ? { scheduler: schedulerPath } : {}),
      },
      preserveSymlinks: true,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV || "development"),
      __KEYCLOAK_URL__: JSON.stringify(env.VITE_KEYCLOAK_URL),
      __KEYCLOAK_REALM__: JSON.stringify(env.VITE_KEYCLOAK_REALM || "dalai-llama"),
      __KEYCLOAK_CLIENT_ID__: JSON.stringify(env.VITE_KEYCLOAK_CLIENT_ID || "creator-ui"),
      __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || "https://api.dalaillama.in/api/v1"),
    },
    server: {
      port: 5181,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // The 9 real backend services (creative-planning-service, pre-production-service,
        // trend-intelligence-service, ...) are mounted at the gateway's bare /v1/* -- see
        // infra-platform/charts/backend-service/values.yaml's apiPaths and the matching
        // absolute-URL calls in src/api/creatorEndpoints.js.
        "/v1": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      target: "esnext",
      rollupOptions: {
        external: () => false,
      },
      commonjsOptions: {
        include: [/node_modules/],
      },
    },
  };
});
