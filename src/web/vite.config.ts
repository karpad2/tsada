import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',   // relative paths so Electron file:// loading works
  server: {
    host: '0.0.0.0',   // expose on LAN
  },
})
