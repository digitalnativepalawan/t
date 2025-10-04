import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for static hosting (Hostinger) using HashRouter
export default defineConfig({
  base: '/', // change to '/subfolder/' if deploying under a subdirectory
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
    open: false,
  },
});
