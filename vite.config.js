import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePWA({ registerType: 'autoUpdate', 
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      devOptions: {
        enabled: true // Enable PWA in development (optional)
      },
      manifest: {
        name: 'Tehnička Škola Ada',
        short_name: 'TŠAda',
        description: 'Tehnička Škola Ada',
        theme_color: '#0ea5e9',
        icons: [
          
          {
            src: 'favicon.png',
            sizes: '1024x1024',
            type: 'image/png'
          }
        ]
      }
    }),
    vue(),
    {
      name: "markdown-loader",
      transform(code, id) {
        if (id.slice(-3) === ".md") {
          // For .md files, get the raw content
          return `export default ${JSON.stringify(code)};`;
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@a': fileURLToPath(new URL('./src/assets', import.meta.url))
    }
  }
})
