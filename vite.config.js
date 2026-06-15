import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
  },

  build: {
    // Raise the warning threshold — our vendor bundle is legitimately large
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Split the bundle into logical chunks so browsers can cache
        // vendor code independently of app code
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI / icon libraries
          'vendor-ui': ['lucide-react', 'react-toastify'],
          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
  },
})
