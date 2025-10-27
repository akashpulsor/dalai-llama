import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

// recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
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
  },
});
