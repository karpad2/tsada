import './assets/main.css'
import { createApp as createClientApp } from 'vue'

import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { useLoadingStore } from '@/stores/loading'
import { i18nService } from '@/services/i18n/I18nService'

import App from './App.vue'
import { createRouter } from './router'

import 'primeicons/primeicons.css'
import VueCookieComply from '@ipaat/vue3-tailwind3-cookie-comply'

import { createI18n } from 'vue-i18n'
import { messages } from '@/lang'
import Notifications from '@kyvg/vue3-notification'
import { appw } from '@/appwrite'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { createAppVuetify } from '@/plugins/vuetify'
import CountryFlag from 'vue-country-flag-next'
import SEOPlugin from '@/plugins/seo'
import { getClientStorage, isClient } from '@/utils/ssr'

/**
 * Universal app factory — used by both entry-client and entry-server.
 * Vite SPA (`npm run dev`) uses createApp (no hydration).
 * SSR server build uses createSSRApp.
 */
export function createApp() {
  const app = createClientApp(App)
  const pinia = createPinia()

  pinia.use(
    createPersistedState({
      storage: getClientStorage()
    })
  )

  const router = createRouter()

  app.use(pinia)
  app.use(router)

  const vuetify = createAppVuetify()

  // Language: default for SSR; pinia rehydrate may override on client after mount
  const loadingStore = useLoadingStore()
  const savedLanguage = loadingStore.language || 'sr'

  const i18n = createI18n({
    locale: savedLanguage,
    fallbackLocale: 'en',
    messages,
    globalInjection: true
  })

  i18nService.setCurrentLanguage(savedLanguage)

  app.use(Notifications)
  app.use(vuetify)

  app.use(PrimeVue, {
    theme: {
      preset: Aura
    }
  })
  app.component('country-flag', CountryFlag)
  app.config.globalProperties.$appwrite = appw

  app.use(i18n)
  app.use(SEOPlugin)
  app.component('VueCookieComply', VueCookieComply)

  app.config.errorHandler = (err, _instance, info) => {
    console.error('[app]', info, err)
  }

  // SSR stubs for client-only editors (avoid resolve warnings during renderToString)
  if (!isClient) {
    const EmptyStub = { name: 'ClientOnlyStub', render: () => null }
    app.component('QuillEditor', EmptyStub)
    app.component('video-background', EmptyStub)
  }

  // Client-only plugins (browser APIs, heavy optional deps)
  if (isClient) {
    const host = window.location.hostname
    if (host !== 'localhost' && host !== '127.0.0.1') {
      void import('vue-gtag').then(({ createGtag }) => {
        try {
          app.use(createGtag({ tagId: 'G-FZYC1503VB' }))
        } catch { /* analytics must not break boot */ }
      }).catch(() => {})
    }

    void import('@/assets/loading.gif').then((mod) => {
      void import('vue3-lazyload').then(({ default: VueLazyLoad }) => {
        app.use(VueLazyLoad, { loading: mod.default })
      })
    })

    void import('vue-responsive-video-background-player').then((mod) => {
      app.component('video-background', mod.default)
    })

    void import('@vueup/vue-quill').then((mod) => {
      app.component('QuillEditor', mod.QuillEditor)
    })

    // Image lightbox
    void import('viewerjs/dist/viewer.css')
    void import('v-viewer').then((mod) => {
      app.use(mod.default, {
        defaultOptions: { zIndex: 9999 }
      })
    })

    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 2500 })
        : (cb: () => void) => setTimeout(cb, 1)

    schedule(() => {
      import('@tsparticles/vue3').then(({ default: Particles }) => {
        import('tsparticles').then(({ loadFull }) => {
          app.use(Particles, {
            init: async (engine) => {
              await loadFull(engine)
            }
          })
        })
      })

      import('@mayasabha/ckeditor4-vue3').then(({ default: CKEditor }) => {
        app.use(CKEditor)
      })

      import('@vueup/vue-quill').then(({ QuillEditor }) => {
        app.component('QuillEditor', QuillEditor)
      })
      import('@vueup/vue-quill/dist/vue-quill.snow.css')
    })
  }

  return { app, router, pinia }
}
