import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@smart-aging/packages': resolve(__dirname, '../../packages'),
    },
  },
  server: {
    fs: {
      // 允许访问工作区根目录（用于本地 workspace 包）
      allow: ['..', resolve(__dirname, '../../')],
    },
  },
})
