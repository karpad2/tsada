import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { visualizer } from 'rollup-plugin-visualizer'

const analyze = process.env.ANALYZE === '1'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ...(analyze
      ? [
          visualizer({
            open: true,
            filename: 'dist/stats.html',
            gzipSize: true
          })
        ]
      : []),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false // avoid SW noise in dev
      },
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'robots.txt'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // CRITICAL: prevent infinite reload — wait for user + controlled claim
        skipWaiting: false,
        clientsClaim: false,
        navigationPreload: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/v1/, /share\.tsada\.edu\.rs/],
        // Do not precache heavy optional routes — they load on demand + runtime cache
        globIgnores: [
          '**/HeistGame-*.js',
          '**/HeistGame-*.css',
          '**/vendor-three-*.js',
          '**/vendor-pdf-*.js',
          '**/vendor-quill-*.js',
          '**/vendor-particles-*.js',
          '**/vendor-xlsx-*.js',
          '**/vendor-peer-*.js',
          '**/DcChat-*.js',
          '**/DcChat-*.css',
          // MDI: only modern woff2 is needed — skip legacy formats (~3MB)
          '**/materialdesignicons-webfont-*.eot',
          '**/materialdesignicons-webfont-*.ttf',
          '**/materialdesignicons-webfont-*.woff',
          '**/stats.html'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/appwrite\.tsada\.edu\.rs\/v1\/storage\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'appwrite-storage-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.tsada\.edu\.rs\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 5 * 60
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /\.(?:woff2?|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60
              }
            }
          },
          {
            // Lazy route chunks not in precache (heist, dc, pdf…)
            urlPattern: /\/assets\/(?:HeistGame|DcChat|vendor-three|vendor-pdf|vendor-quill|vendor-particles|vendor-xlsx|vendor-peer)-.+\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lazy-chunks-cache',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 7 * 24 * 60 * 60
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Tehnička Škola Ada',
        short_name: 'TŠAda',
        description: 'Tehnička škola Ada - mašinstvo, elektrotehnika, građevinarstvo',
        theme_color: '#0ea5e9',
        background_color: '#0b1220',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: 'sr',
        categories: ['education', 'school'],
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    }),
    vue(),
    // Tree-shake Vuetify: only components actually used in templates
    vuetify({ autoImport: true }),
    {
      name: 'markdown-loader',
      transform(code, id) {
        if (id.slice(-3) === '.md') {
          return `export default ${JSON.stringify(code)};`
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
    target: 'esnext',
    chunkSizeWarningLimit: 800,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules/vue-router') ||
            id.includes('node_modules/pinia')
          ) {
            return 'vendor-vue'
          }

          if (id.includes('node_modules/vuetify')) {
            return 'vendor-vuetify'
          }
          if (id.includes('node_modules/@mdi/')) {
            return 'vendor-mdi'
          }
          if (id.includes('node_modules/primevue') || id.includes('node_modules/@primevue')) {
            return 'vendor-primevue'
          }

          if (id.includes('node_modules/appwrite')) {
            return 'vendor-appwrite'
          }

          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap'
          }
          if (id.includes('node_modules/@tsparticles') || id.includes('node_modules/tsparticles')) {
            return 'vendor-particles'
          }

          if (id.includes('node_modules/vue-i18n') || id.includes('node_modules/@intlify')) {
            return 'vendor-i18n'
          }

          if (id.includes('node_modules/axios')) {
            return 'vendor-axios'
          }

          if (id.includes('node_modules/v-viewer') || id.includes('node_modules/viewerjs')) {
            return 'vendor-viewer'
          }
          if (id.includes('node_modules/swiper')) {
            return 'vendor-swiper'
          }

          if (id.includes('node_modules/three')) {
            return 'vendor-three'
          }

          if (id.includes('node_modules/@vueup/vue-quill') || id.includes('node_modules/quill')) {
            return 'vendor-quill'
          }

          if (id.includes('node_modules/vuestic')) {
            return 'vendor-vuestic'
          }

          if (id.includes('node_modules/vue-responsive-video')) {
            return 'vendor-video'
          }

          if (id.includes('node_modules/html2canvas') || id.includes('node_modules/jspdf')) {
            return 'vendor-pdf'
          }

          if (id.includes('node_modules/xlsx')) {
            return 'vendor-xlsx'
          }
          if (id.includes('node_modules/peerjs')) {
            return 'vendor-peer'
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-dexie'
          }

          if (id.includes('node_modules/@fireworks-js')) {
            return 'vendor-fireworks'
          }
          if (id.includes('node_modules/@ipaat') || id.includes('node_modules/@kyvg')) {
            return 'vendor-ui-extras'
          }

          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
        }
      }
    }
  }
})
