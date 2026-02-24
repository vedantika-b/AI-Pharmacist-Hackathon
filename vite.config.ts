import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend'),
    },
  },
  server: {
    port: 5000,
    open: false,
  },
  build: {
    outDir: '../dist-frontend',
    emptyOutDir: true,
  },
})
