import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // короткие ссылки: ровно 6 буквенно-цифровых символов в корне → в бэк
      '^/[A-Za-z0-9]{6}$': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
