import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development, /api calls are forwarded to the Express server
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
