import './assets/main.css'
import { createApp as createVueApp } from 'vue'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import { createRouter } from './router'
//import Particles from "vue3-particles";

import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import VueLazyLoad from 'vue3-lazyload'
import 'primeicons/primeicons.css'; //icons
import VueCookieComply from '@ipaat/vue3-tailwind3-cookie-comply'
import LImage from "@/components/LImage.vue";

// Conditional loading for assets to prevent SSR build errors
let LoadingImg: any = ''
let Loading: any = ''
if (typeof window !== 'undefined') {
  // @ts-ignore
  LoadingImg = (await import('@/assets/loading.gif')).default
  // @ts-ignore
  Loading = LoadingImg // Use same image for both
}
import { createI18n } from 'vue-i18n'
import {messages} from '@/lang';
import Notifications from '@kyvg/vue3-notification';
import {appw} from "@/appwrite";
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import Particles from "@tsparticles/vue3";
import { loadFull } from "tsparticles";
import VideoBackground from 'vue-responsive-video-background-player'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import CKEditor from '@mayasabha/ckeditor4-vue3';
import CountryFlag from 'vue-country-flag-next'
//import { CkeditorPlugin } from '@ckeditor/ckeditor5-vue';
import 'viewerjs/dist/viewer.css'
import VueViewer from 'v-viewer'
import { createGtag } from "vue-gtag";
import SEOPlugin from '@/plugins/seo'

import gsap from "gsap";

export function createApp() {
  const app = createVueApp(App)
  //const client = new Client();
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  const router = createRouter()

  app.use(pinia)
  app.use(router)

  // Only initialize gtag on client side
  if (typeof window !== 'undefined') {
    const gtag = createGtag({
      tagId: "G-FZYC1503VB"
    })
    app.use(gtag)
  }

  const vuetify = createVuetify({
      components,
      directives,
      theme: {
        defaultTheme: 'light',
        themes:
        {
          light:{

          },
          dark:{}
        }
      }
    })
  app.component('QuillEditor', QuillEditor)

  //console.log(messages);

  app.use(CKEditor);
  const i18n = createI18n({
      locale: 'en', fallbackLocale: 'en',  messages, globalInjection: true  });
  /*
  client
      .setEndpoint('https://appwrite.kasoft.co.uk/v1')
      .setProject('653bb473ee7f6a6074e7');*/
  //app.use(VueI18n);
  //app.use(CkeditorPlugin);
  app.use(Notifications);
  app.use(vuetify);

  // Only use lazy loading on client side
  if (typeof window !== 'undefined') {
    app.use(VueLazyLoad, {
      loading: LoadingImg
      // options...
    });
  }

  app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
  });
  app.component('country-flag', CountryFlag)
  vuetify.theme.name.primary = "#0EA5E9";
  app.component('video-background', VideoBackground);
  app.config.globalProperties.$appwrite = appw;

  // Only use particles on client side
  if (typeof window !== 'undefined') {
    app.use(Particles,{init:async engine => {await loadFull(engine)}});
  }

  app.use(i18n);
  app.use(VueViewer, {
      defaultOptions: {
        zIndex: 9999
      }
    });

  app.use(SEOPlugin);
  app.component('VueCookieComply', VueCookieComply)
  //app.use(gsap);

  return { app, router, pinia }
}

// Client-side only
if (typeof window !== 'undefined') {
  const { app } = createApp()
  app.mount('#app')
}

