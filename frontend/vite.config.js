import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Requests to /api/... are forwarded to the Lab 01 backend.
    // e.g. /api/customers/login  ->  http://localhost:5000/customers/login
    proxy: {
      '/api': {
        // API_TARGET lets you point the dev server at another backend
        target: process.env.API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
