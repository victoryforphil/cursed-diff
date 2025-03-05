import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      // Improve HMR performance for Chrome
      protocol: 'ws',
      host: 'localhost',
      port: 24678,
    },
    watch: {
      // Reduce file system watching overhead
      usePolling: false,
      interval: 1000,
    },
    // Configure proxy to API when in development mode
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Use relative paths for assets
    assetsDir: 'assets',
    // Use relative paths for all asset references
    base: './',
    // Optimize chunk size for better performance
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
