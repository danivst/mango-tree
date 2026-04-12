import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: 'info',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Ensure the proxy rewrites the URL correctly
        rewrite: (path) => path,
      },
    },
  },
})

/*
for https
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: 'info',
  server: {
    https: true,
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
        xfwd: true,
        // Ensure the proxy rewrites the URL correctly
        rewrite: (path) => path,
      },
    },
  },
})*/