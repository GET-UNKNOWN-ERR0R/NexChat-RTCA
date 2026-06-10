import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(),],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000/',
        secure: false,
        changeOrigin: true,
      }
    }
  },
})