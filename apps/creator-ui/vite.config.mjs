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
      proxy: (() => {
        // Local-dev routing overrides: when VITE_LOCAL_VIDEO_GEN_URL /
        // VITE_LOCAL_POST_PROD_URL are set (e.g. in .env.local), the paths owned by those
        // services proxy to localhost instead of the cloud gateway. Everything else keeps
        // going to the cloud. Path prefixes must match apiPaths in infra-platform/charts/
        // backend-service/values.yaml exactly -- adding a service means listing every prefix
        // it claims there.
        const localVideoGen = env.VITE_LOCAL_VIDEO_GEN_URL;   // e.g. http://localhost:8180
        const localPostProd = env.VITE_LOCAL_POST_PROD_URL;   // e.g. http://localhost:8181
        const local = (target) => ({ target, changeOrigin: true, secure: false });
        const cloud = { target: proxyTarget, changeOrigin: true, secure: false };
        const overrides = {};
        if (localVideoGen) {
          // Every prefix video-gen owns at the gateway -- see backend-service values.yaml.
          for (const p of ["/v1/voice-tests", "/v1/prompts", "/v1/jobs", "/v1/exports", "/v1/scenes", "/v1/final-renders"]) {
            overrides[p] = local(localVideoGen);
          }
        }
        if (localPostProd) {
          for (const p of ["/v1/post-production", "/v1/dubbing"]) {
            overrides[p] = local(localPostProd);
          }
        }
        return {
          ...overrides,   // longer prefixes first -- Vite/http-proxy matches in insertion order
          "/api": cloud,
          // The 9 real backend services (creative-planning-service, pre-production-service,
          // trend-intelligence-service, ...) are mounted at the gateway's bare /v1/* -- see
          // infra-platform/charts/backend-service/values.yaml's apiPaths and the matching
          // absolute-URL calls in src/api/creatorEndpoints.js. This catch-all is the fallback
          // for any /v1/* prefix not explicitly overridden above.
          "/v1": cloud,
        };
      })(),
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
