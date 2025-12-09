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
  },
  build: {
    target: 'esnext', // Support modern features including top-level await
    chunkSizeWarningLimit: 600, // Temporary increase while optimizing
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core Vue ecosystem
          if (id.includes('node_modules/vue/') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia')) {
            return 'vendor-vue';
          }

          // UI Libraries
          if (id.includes('node_modules/vuetify')) {
            return 'vendor-vuetify';
          }
          if (id.includes('node_modules/primevue') ||
              id.includes('node_modules/@primevue')) {
            return 'vendor-primevue';
          }

          // Backend/API
          if (id.includes('node_modules/appwrite')) {
            return 'vendor-appwrite';
          }

          // Animations & Effects
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          if (id.includes('node_modules/@tsparticles') ||
              id.includes('node_modules/tsparticles')) {
            return 'vendor-particles';
          }

          // i18n
          if (id.includes('node_modules/vue-i18n') ||
              id.includes('node_modules/@intlify')) {
            return 'vendor-i18n';
          }

          // Utilities
          if (id.includes('node_modules/moment')) {
            return 'vendor-moment';
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }

          // Viewers & Media
          if (id.includes('node_modules/v-viewer') ||
              id.includes('node_modules/viewerjs')) {
            return 'vendor-viewer';
          }
          if (id.includes('node_modules/swiper')) {
            return 'vendor-swiper';
          }

          // Other large dependencies
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }

          // All other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        }
      }
    }
  }
})
