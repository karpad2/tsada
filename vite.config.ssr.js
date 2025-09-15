import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    ssr: true,
    target: 'node',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  ssr: {
    noExternal: [
      'vue',
      'vue-router',
      'pinia',
      '@vue/server-renderer',
      'vue-i18n',
      'primevue',
      'vuetify'
    ]
  }
})