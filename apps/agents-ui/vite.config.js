import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@dalaillama/shared-store': path.resolve(__dirname, '../../shared/store'),
      '@dalaillama/shared-hooks': path.resolve(__dirname, '../../shared/hooks'),
      '@dalaillama/shared-ui': path.resolve(__dirname, '../../shared/ui'),
      '@dalaillama/shared-config': path.resolve(__dirname, '../../shared/config'),
      '@dalaillama/shared-utils': path.resolve(__dirname, '../../shared/utils'),
    },
  },
  optimizeDeps: {
    include: ['@reduxjs/toolkit', '@reduxjs/toolkit/query/react', 'react-redux'],
  },
  server: {
    port: 5175,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', ws: true },
    },
  },
    define: {
    global: 'globalThis',
  },
});
