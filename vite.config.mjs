import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      //   '/api': {
      //     target: 'http://localhost:5000',
      //     changeOrigin: true,
      //     secure: false,
      //   },
      // Use explicit URL in src/services/api.js instead of proxy for detached frontend/backend deployment preference
    }
  }
})
