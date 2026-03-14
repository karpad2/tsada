import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createI18n } from 'vue-i18n'
import { messages } from '@/lang'
import { useLoadingStore } from '@/stores/loading'
import Notifications from '@kyvg/vue3-notification'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import './assets/main.css'

import DcApp from './DcApp.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const loadingStore = useLoadingStore(pinia)
const savedLanguage = loadingStore.language || 'sr'

const i18n = createI18n({
  locale: savedLanguage,
  fallbackLocale: 'en',
  messages,
  globalInjection: true,
})

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
  },
})

const app = createApp(DcApp)
app.use(pinia)
app.use(i18n)
app.use(vuetify)
app.use(Notifications)
app.mount('#app')
