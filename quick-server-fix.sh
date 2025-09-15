#!/bin/bash

# Quick fix for the server - run this DIRECTLY on the server
# Copy and paste this into the server terminal

cd /home/karpad/tsada

echo "🔧 Quick fix for loading.gif issue..."

# Option 1: Create the missing file
echo "Creating placeholder loading.gif..."
mkdir -p src/assets
echo "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" | base64 -d > src/assets/loading.gif

# Option 2: If Loading.gif exists with capital L
if [ -f "src/assets/Loading.gif" ]; then
    cp src/assets/Loading.gif src/assets/loading.gif
fi

# Option 3: Patch main.ts to remove the import
echo "Patching main.ts..."
cp src/main.ts src/main.ts.backup

# Remove or comment out the problematic imports
cat > /tmp/main-patch.sed << 'EOF'
s|import LoadingImg from "@/assets/loading.gif"|// import LoadingImg from "@/assets/loading.gif"|g
s|import Loading from "@/assets/Loading.gif"|// import Loading from "@/assets/Loading.gif"|g
EOF

sed -f /tmp/main-patch.sed src/main.ts > src/main.ts.tmp && mv src/main.ts.tmp src/main.ts

# Now try the build again
echo "Attempting build..."
npm run build:ssr

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    pm2 start server.js --name "tsada-ssr"
    pm2 save
    echo "🚀 Server running!"
else
    echo "❌ Build still failing. Creating fallback solution..."

    # Create a minimal main.ts that will work
    echo "Creating SSR-safe main.ts..."
    cat > src/main-ssr-safe.ts << 'MAINEOF'
import './assets/main.css'
import { createApp as createVueApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import { createRouter } from './router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import VueLazyLoad from 'vue3-lazyload'
import 'primeicons/primeicons.css'
import VueCookieComply from '@ipaat/vue3-tailwind3-cookie-comply'
import { createI18n } from 'vue-i18n'
import {messages} from '@/lang'
import Notifications from '@kyvg/vue3-notification'
import {appw} from "@/appwrite"
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import VideoBackground from 'vue-responsive-video-background-player'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import CKEditor from '@mayasabha/ckeditor4-vue3'
import CountryFlag from 'vue-country-flag-next'
import 'viewerjs/dist/viewer.css'
import VueViewer from 'v-viewer'
import { createGtag } from "vue-gtag"
import SEOPlugin from '@/plugins/seo'

// No image imports for SSR
const LoadingImg = ''

export function createApp() {
  const app = createVueApp(App)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  const router = createRouter()

  app.use(pinia)
  app.use(router)

  if (typeof window !== 'undefined') {
    const gtag = createGtag({ tagId: "G-FZYC1503VB" })
    app.use(gtag)
    app.use(VueLazyLoad, { loading: LoadingImg })
  }

  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: { light:{}, dark:{} }
    }
  })

  app.component('QuillEditor', QuillEditor)
  app.use(CKEditor)

  const i18n = createI18n({
    locale: 'en', fallbackLocale: 'en', messages, globalInjection: true
  })

  app.use(Notifications)
  app.use(vuetify)
  app.use(PrimeVue, { theme: { preset: Aura } })
  app.component('country-flag', CountryFlag)
  app.component('video-background', VideoBackground)
  app.config.globalProperties.$appwrite = appw
  app.use(i18n)
  app.use(VueViewer, { defaultOptions: { zIndex: 9999 } })
  app.use(SEOPlugin)
  app.component('VueCookieComply', VueCookieComply)

  return { app, router, pinia }
}

if (typeof window !== 'undefined') {
  const { app } = createApp()
  app.mount('#app')
}
MAINEOF

    # Backup original and use safe version
    mv src/main.ts src/main-original.ts
    mv src/main-ssr-safe.ts src/main.ts

    # Try build again
    npm run build:ssr

    if [ $? -eq 0 ]; then
        echo "✅ Build successful with safe version!"
        pm2 start server.js --name "tsada-ssr"
    fi
fi