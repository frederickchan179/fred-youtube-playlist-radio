import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isLando = process.env.LANDO === 'ON'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: isLando ? '0.0.0.0' : '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: isLando ? ['.lndo.site', 'localhost', '127.0.0.1'] : undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
