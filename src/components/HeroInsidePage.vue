<template>
    <!-- Top Hero -->
    <video-background v-if="loaded" :src="integrated_video" style="min-height: 220px; margin-top: -5px;" class="hero-inside flex flex-wrap w-full mb-12 relative overflow-hidden">
    <div class="hero-inside-overlay absolute inset-0 pointer-events-none"></div>
    <section class="text-gray-600 body-font relative z-10 w-full" id="about">
       
        <div class="container mx-auto text-white flex px-5 py-6 md:flex-row flex-col items-center">
            <div
                class="glass-panel rounded-3xl p-6 md:p-8 max-w-xl lg:flex-grow md:w-1/2 flex flex-col md:items-start md:text-left mb-4 md:mb-0 items-center text-center">
                <h1 id="hero-heading-text" class="title-font py-2 sm:text-4xl text-3xl mb-2 font-semibold items-center text-white tracking-tight drop-shadow-lg">
                    {{ $t('cometous') }}
                    <br class="hidden lg:inline-block" />
                </h1>
                <p v-if="false" class="mb-8 leading-relaxed items-center text-white/90">
                {{ $t('whycomehere') }} 
                <span class="font-semibold text-sky-300">{{ $t("msc") }}</span>.
                </p>
                
            </div>
        </div>
    </section>
    </video-background>
</template>

<script>
import { Swiper, SwiperSlide } from 'swiper/vue';
import VideoBackground from 'vue-responsive-video-background-player'
import { EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Databases, Storage, Query } from "appwrite";
import {appw,config,randomIntFromInterval} from "@/appwrite";


const database = new Databases(appw);
const storage = new Storage(appw);
//import video from "@a/videoplayback.webm"



export default {
    components: {
    Swiper,
    SwiperSlide,
},
    mounted() {
        
       this.load_mp_images_from_base();
       this.load_mp_videos_from_base();

    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo(
        "#hero-heading-text",
        {
          opacity: 0,
          x: "-100%",
        },
        {
          duration: 1.5,
          opacity: 1,
          x: 0,
        }
      );
    });
    },
    data:  () => ({
        swiper: null,
        images:[],
        modules:[EffectFade, Navigation, Pagination],
        integrated_video:config.default_video,
        loaded:false,
        options: {
            mouseControls: true,
            touchControls: true,
            minHeight: 500.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00
        }
    }),
    methods:{
        async load_mp_images_from_base() {
            const l = await database.listDocuments(config.website_db, config.main_page_gallery, [
                Query.limit(50),
            ]);
            this.images = l.documents.map(element =>
                storage.getFilePreview(config.website_images, element.file_id, 1280, 0, 'center', 82).toString()
            );
        },
        async load_mp_videos_from_base() {
            try {
                const l = await database.listDocuments(config.website_db, config.hero_videos, [
                    Query.limit(50),
                ]);
                if (l.documents.length > 0) {
                    const k = randomIntFromInterval(0, l.documents.length - 1);
                    this.integrated_video = l.documents[k].link;
                }
            } finally {
                this.loaded = true;
            }
        },
        }
    }

</script>
<style>
.hero-inside-overlay {
  background: linear-gradient(
    120deg,
    rgba(15, 23, 42, 0.5) 0%,
    rgba(14, 165, 233, 0.18) 50%,
    rgba(15, 23, 42, 0.3) 100%
  );
}

.swiper-slide {
  background-position: center;
  background-size: cover;
}

.swiper-slide img {
  display: block;
  width: 100%;
}
</style>