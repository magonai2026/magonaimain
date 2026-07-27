import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // The dev server runs in a container with the source bind-mounted from
    // Windows. Filesystem events do not cross that boundary, so Vite never
    // sees edits and HMR silently never fires — polling is the only reliable
    // way to pick up changes in this setup.
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      '/api': {
        // In Docker compose the gateway service is reachable by name.
        // Outside Docker (plain `npm run dev`) it falls back to localhost.
        target: process.env.VITE_GATEWAY_URL || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})