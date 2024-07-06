<template>
    <div class="">
       
        <Header />
        <vue-particles
        v-if="animation_flag"
            id="tsparticles"
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
        <main  v-if="!isLoading">
            <slot></slot>
        </main>

        <main v-else>
            <Loading />
        </main>

        <Footer />
    </div>
</template>

<script lang="ts">
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import Loading from '@/components/Loading.vue';
import Toast from "primevue/toast";
import {useLoadingStore} from "@/stores/loading";


export default {
    components: {
    Header,
    Footer,
    Loading,
    Toast
},
data()
{
return {
    
}
},
    
    mounted()
    {
        
       //console.log( app.config.globalProperties.$loading);

    
            
    },
    computed: {
        isLoading() {
           return useLoadingStore().isLoading;
            
            //return app.config.globalProperties.loading;
            
           
        },
        animation_flag()
        {
            return useLoadingStore().animationSetting
        }
    },
    
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