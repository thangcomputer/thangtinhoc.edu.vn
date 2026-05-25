import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production: deployed at https://your-domain.com/admin (same origin, no subdomain).
// Dev: served at localhost:5174 with base / for convenience.
// https://vite.dev/config/shared-options.html#base
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/admin/' : '/',
  server: {
    port: 5174,
  },
  build: {
    emptyOutDir: false,
    // Trinh duyet cu hon: giu @media (max-width) thay vi (width<=)
    cssTarget: 'chrome87',
  },
}))
