import './assets/main.css'
import { createApp as createVueApp } from 'vue'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useLoadingStore } from '@/stores/loading'
import { i18nService } from '@/services/i18n/I18nService'

import App from './App.vue'
import { createRouter } from './router'

import VueLazyLoad from 'vue3-lazyload'
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
import { createGtag } from 'vue-gtag'
import SEOPlugin from '@/plugins/seo'

// Conditional loading for assets to prevent SSR build errors
let LoadingImg: any = ''
if (typeof window !== 'undefined') {
  // @ts-ignore
  LoadingImg = (await import('@/assets/loading.gif')).default
}

export function createApp() {
  const app = createVueApp(App)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  const router = createRouter()

  app.use(pinia)
  app.use(router)

  // Only initialize gtag on client side
  if (typeof window !== 'undefined') {
    const gtag = createGtag({
      tagId: 'G-FZYC1503VB'
    })
    app.use(gtag)
  }

  const vuetify = createAppVuetify()

  // Get persisted language from pinia store
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

  if (typeof window !== 'undefined') {
    app.use(VueLazyLoad, {
      loading: LoadingImg
    })
  }

  app.use(PrimeVue, {
    theme: {
      preset: Aura
    }
  })
  app.component('country-flag', CountryFlag)
  app.config.globalProperties.$appwrite = appw

  // Heavy plugins: load after first paint so homepage TTI stays low
  if (typeof window !== 'undefined') {
    // Video background — only needed on a few public pages
    void import('vue-responsive-video-background-player').then((mod) => {
      app.component('video-background', mod.default)
    })

    // Image lightbox — gallery / album only
    void import('viewerjs/dist/viewer.css')
    void import('v-viewer').then((mod) => {
      app.use(mod.default, {
        defaultOptions: { zIndex: 9999 }
      })
    })

    // Defer even heavier optional deps
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

  app.use(i18n)
  app.use(SEOPlugin)
  app.component('VueCookieComply', VueCookieComply)

  return { app, router, pinia }
}

// Client-side only
if (typeof window !== 'undefined') {
  const { app } = createApp()
  app.mount('#app')
}
