import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),],
    server: {
      port: 4000,
      open: true,
      allowedHosts: [
        'b3c2-2402-800-6318-9d6f-498-b30f-7901-55bc.ngrok-free.app'
      ]
    },
    build: {
      outDir: 'dist',
    },
    base: '/',
})
