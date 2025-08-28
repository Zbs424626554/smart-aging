import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: false,
      }
    }
  },
  define: {
    'process.env': {
      REACT_APP_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api'
    }
  }
})
