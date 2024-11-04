<template>
    <!-- Top Hero -->
    <video-background :src="integrated_video" style="min-height: 205px; margin-top: -5px;" class="flex flex-wrap w-full mb-20">
    <section class="text-gray-600 body-font" id="about">
       
        <div class="container mx-auto text-white flex px-5 py-5 md:flex-row flex-col items-center">
            <div
                class="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center"
            >
                <h1 id="hero-heading-text" class="title-font py-8 sm:text-4xl text-3xl mb-4 font-medium items-center text-white">
                    {{ $t('cometous') }}
                    <br class="hidden lg:inline-block" />
                </h1>
                <p v-if="false" class="mb-8 leading-relaxed items-center">
                {{ $t('whycomehere') }} 
                <span class="font-medium text-sky-400">{{ $t("msc") }}</span>.
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
import { Client, Databases, ID,Storage } from "appwrite";
import {appw,config,randomIntFromInterval} from "@/appwrite";
import { VaButton } from 'vuestic-ui/web-components';
import gsap from "gsap";
//import video from "@a/videoplayback.webm"



/*
<video-background 
            src="https://raw.githubusercontent.com/karpad2/tsada/media/src/assets/videos/videoplayback.mp4"
        
        style="max-height: 400px;">
        </video-background>
*/
export default {
    components: {
    Swiper,
    SwiperSlide,
    VaButton
},
    mounted() {
        
       this.load_mp_images_from_base();
       this.load_mp_videos_from_base();

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
    },
    data:  () => ({
        swiper: null,
        images:[],
        modules:[EffectFade, Navigation, Pagination],
        integrated_video:config.default_video,
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
        async load_mp_images_from_base()
        {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.main_page_gallery);
        
        l.documents.forEach(element => {
            this.images.push(storage.getFileView(config.website_images,element.file_id));
        });
        },
        async load_mp_videos_from_base()
        {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.hero_videos);
        
        let k= randomIntFromInterval(0,l.documents.length-1);
        this.integrated_video=l.documents[k].link;
        },

        
       
        }
    }

</script>
<style>
.swiper-slide {
  background-position: center;
  background-size: cover;
}

.swiper-slide img {
  display: block;
  width: 100%;
}


</style>