import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    visualizer({ open: true }),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tsada\.edu\.rs\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes for API data
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
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
