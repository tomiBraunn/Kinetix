import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { boneyardPlugin } from 'boneyard-js/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), boneyardPlugin()],
  envDir: '../',
  server: {
    // El tunel de cloudflared conecta a localhost:5173 y expone HTTPS real hacia afuera.
    host: true,
    // El túnel llega con un Host header *.trycloudflare.com; Vite lo bloquea por default.
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
