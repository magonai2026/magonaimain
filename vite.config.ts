import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
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