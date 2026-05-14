// @ts-nocheck
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      target: "esnext",
      rollupOptions: {
        external: [],
      },
    },
  };
});
