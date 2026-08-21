import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { boneyardPlugin } from 'boneyard-js/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), boneyardPlugin()],
  envDir: '../',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
