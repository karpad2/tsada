<template>
    <div class="dark:blue-gray-900;" >
       
        <Header v-if="!__hideheaders" class="no_print" />
        
        <vue-particles
        v-if="animation_flag&&false"
            id="tsparticles"
            class="no_print"
            :particlesLoaded="particlesLoaded"
            :options="{
                   /*background: {
                        
                    },*/
                    fpsLimit: 120,
                    interactivity: {
                        events: {
                            onClick: {
                                enable: true,
                                mode: 'push'
                            },
                            onHover: {
                                enable: true,
                                mode: 'repulse'
                            }
                        },
                        modes: {
                            bubble: {
                                distance: 400,
                                duration: 2,
                                opacity: 0.8,
                                size: 40
                            },
                            push: {
                                quantity: 4
                            },
                            repulse: {
                                distance: 200,
                                duration: 0.4
                            }
                        }
                    },
                    particles: {
                        color: {
                            value: '#43afe1',
                            
                        },
                        links: {
                            color: '#43afe1',
                            distance: 150,
                            enable: true,
                            opacity: 0.5,
                            width: 1
                        },
                        move: {
                            direction: 'none',
                            enable: true,
                            outModes: 'bounce',
                            random: false,
                            speed: 6,
                            straight: false
                        },
                        number: {
                            density: {
                                enable: true,
                            },
                            value: 80
                        },
                        opacity: {
                            value: 0.8
                        },
                        shape: {
                            type: 'circle'
                        },
                        size: {
                            value: { min: 1, max: 5 }
                        }
                    },
                    detectRetina: true
                }"
        />

        <Fireworks
            style="z-index: 5;"
            v-if="firework_flag"
        
            :autostart="firework_flag"
            
            :style="{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            position: 'fixed',
            
            
            }"
        />
        <div :class="{ bg_image: light_theme }" class="min-h-screen dark:bg-slate-900/80 bg-slate-50">
         
        <div v-if="checking">
            <Loading />
            
        </div>
        <div class="container m-auto w-60 mt-5" v-else-if="!we_have_net">
            <NoInternet  />
        </div>
        <div v-else-if="we_have_net"> 

            
        <main class="min-h-screen" v-if="!_loading">
            <slot></slot>
        </main>

        <main v-else>
            <Loading />
            
        </main>
    </div>
    <div v-else>

    </div>

            </div>
        <Footer v-if="!__hideheaders" class="no_print" />
    </div>
</template>

<script lang="ts">
//
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import Loading from '@/components/Loading.vue';
import Toast from "primevue/toast";
import {useLoadingStore} from "@/stores/loading";
import { Fireworks } from '@fireworks-js/vue'
import NoInternet from '@/components/NoInternet.vue';
import vv from "../../package.json";
import axios from 'axios';
import { version } from 'vite';

export default {
    components: {
    Header,
    Footer,
    Loading,
    Toast,
    Fireworks,
    NoInternet
},
data()
{
return {
    _loading:false,
    we_have_net:false,
    checking:true
}
},
    
    mounted()
    {
        this.checkingstuff();
       //console.log( app.config.globalProperties.$loading);
       
    
            
    },
    computed: {
        isLoading() {
        const cc=useLoadingStore();
        console.log('isLoading:', cc.isLoading);
        this._loading=cc.isLoading;
           return cc.isLoading;
            
            //return app.config.globalProperties.loading;
            
           
        },
        animation_flag()
        {
            const cc=useLoadingStore();
            return !cc.animationSetting;
        },

        firework_flag()
        {
            const cc=useLoadingStore();
            return cc.fireworkSetting;
        },
        theme_flag()
        {
            const cc=useLoadingStore();
            return cc.theme;
        },
        light_theme()
        {
            return this.theme_flag=="light";
        },
        __version()
        {
            return vv.version;
        },
        __hideheaders()
        {
            const cc=useLoadingStore();
            return cc.hideheaders;
        }

    },
    methods:{
    async checkServerConnection() {
      try {
        const response = await axios.get('https://share.tsada.edu.rs/ping');
        if (response.data === 'Pong') {
          this.serverMessage = 'Server responded: Pong';
          this.we_have_net=true;
        } else {
          this.serverMessage = 'Unexpected server response';
        }
      } catch (error) {
        this.serverMessage = 'Failed to connect to the server';
        this.we_have_net=false;
      }
      this.checking=false;
    },
    async checkingstuff()
    {
        this.checkForUpdates();
        this.checkServerConnection();

    },
    async checkForUpdates() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/karpad2/tsada/refs/heads/main/package.json');
        const data = await response.json();

        const latestVersion = data.version;
        if (latestVersion !== this.__version  && process.env.NODE_ENV === 'production') {
            this.refreshApp();
        }
      } catch (error) {
        console.error('Error checking for app updates:', error);
      }
    },
    refreshApp() {
      console.log('New version detected. Reloading the app with cache bypass...');
      const currentUrl = window.location.href;
      const newUrl = currentUrl.split('?')[0] + '?v=' + new Date().getTime();

      setTimeout( ()=>{
        
        this.clearCache();
      },1000);
        // Reloads the page with a unique query string
    },
    clearCache() {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
              registration.unregister();
            }
            window.location.reload(true); // Reloads page after clearing service worker
          });
        } else {
          window.location.reload(true); // Fallback for hard reload
        }
      }
    }
    
}
</script>
<style>
    #tsparticles {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: -1;
        
    }

    

   
</style>