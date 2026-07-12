import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/sitemap.xml': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  // Same proxy for `vite preview` so local production testing can reach the API
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/sitemap.xml': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  build: {
    emptyOutDir: false,
    cssTarget: 'chrome87',
    rolldownOptions: {
      output: {
        // Only split shared framework libs — do NOT dump all node_modules into one
        // vendor chunk (that defeats route-level code splitting / unused-JS audits).
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
})
