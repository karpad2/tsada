<template>
    <div class="">
        <TopBar v-if="false"/>
        <Header />
        <vue-particles
            id="tsparticles"
            :particlesLoaded="particlesLoaded"
            :options="{
                    background: {
                        color: {
                            value: '#fff'
                        }
                    },
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
                            },
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
                            value: '#0d47a1'
                        },
                        links: {
                            color: '#0d47a1',
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
                            value: 0.5
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

<script>

import useLoadingStore  from "@/stores";
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import Loading from '@/components/Loading.vue';
import Toast from "primevue/toast";
import TopBar from "@/components/TopBar.vue";


export default {
    components: {
    Header,
    Footer,
    Loading,
    Toast,
    TopBar,
    
},
    
    mounted()
    {
       //console.log( app.config.globalProperties.$loading);
    },
    computed: {
        isLoading() {
            let loadingStore = useLoadingStore();
            return loadingStore.isLoading;
            //return app.config.globalProperties.loading;
            
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