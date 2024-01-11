import './assets/main.css'

import { createApp  } from 'vue'

import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
//import Particles from "vue3-particles";


import 'primeicons/primeicons.css'; //icons


import LImage from "@/components/LImage.vue";
import { createI18n } from 'vue-i18n'
import {messages} from '@/lang';
import Notifications from '@kyvg/vue3-notification';
import {appw} from "@/appwrite";

import Particles from "@tsparticles/vue3";
import { loadFull } from "tsparticles";
import VideoBackground from 'vue-responsive-video-background-player'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


const app = createApp(App)
//const client = new Client();
app.use(createPinia());
app.use(router);

const vuetify = createVuetify({
    components,
    directives,
  })


//console.log(messages);


const i18n = createI18n({
    locale: 'en', fallbackLocale: 'en',  messages  });
/*
client
    .setEndpoint('https://appwrite.kasoft.co.uk/v1')
    .setProject('653bb473ee7f6a6074e7');*/
//app.use(VueI18n);
app.use(Notifications);
app.use(vuetify);
vuetify.theme.name.primary = '#0EA5E9';
app.component('video-background', VideoBackground);
app.config.globalProperties.$appwrite = appw;
app.use(Particles,{init:async engine => {await loadFull(engine)}});

app.use(i18n);

app.use(router);
app.mount('#app');

