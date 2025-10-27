// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Directories
  srcDir: 'src/',

  // Import global CSS
  css: [
    '~/assets/main.css',
    'primeicons/primeicons.css'
  ],

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    // '@nuxtjs/i18n', // TEMPORARILY DISABLED - compatibility issue
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  // App config
  app: {
    head: {
      title: 'Tehnička Škola Ada',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Tehnička škola Ada - moderna stručna škola u Adi' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  // i18n configuration
  i18n: {
    locales: [
      { code: 'rs', iso: 'sr-RS', name: 'Српски', file: 'rs.json' },
      { code: 'hu', iso: 'hu-HU', name: 'Magyar', file: 'hu.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'rs',
    langDir: 'lang/',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  },

  // PWA configuration
  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Tehnička Škola Ada',
      short_name: 'TŠAda',
      description: 'Tehnička Škola Ada',
      theme_color: '#0ea5e9',
      icons: [
        {
          src: '/favicon.png',
          sizes: '1024x1024',
          type: 'image/png'
        }
      ]
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
              maxAgeSeconds: 5 * 60
            },
            networkTimeoutSeconds: 3
          }
        }
      ]
    }
  },

  // Auto-import components
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  // Pinia configuration
  pinia: {
    storesDirs: ['~/stores/**']
  },

  // Build configuration
  vite: {
    build: {
      target: 'esnext'
    }
  },

  // SSR configuration
  ssr: true,

  // Runtime config for environment variables
  runtimeConfig: {
    public: {
      appwriteEndpoint: 'https://appwrite.tsada.edu.rs/v1',
      appwriteProject: '659ea7f886cf55d4528a'
    }
  },

  compatibilityDate: '2025-01-27'
})
