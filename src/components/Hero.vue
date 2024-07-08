<template>
    <!-- Top Hero -->
    <video-background src="https://raw.githubusercontent.com/karpad2/tsada/main/src/assets/videoplayback.mp4" style="min-height: 205px; margin-top: -5px;" class="flex flex-wrap w-full mb-20">
    <section class="text-gray-600 body-font" id="about">
       
        <div class="container mx-auto text-white flex px-5 py-5 md:flex-row flex-col items-center">
            <div
                class="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center"
            >
                <h1 id="hero-heading-text" class="title-font sm:text-4xl text-3xl mb-4 font-medium items-center text-white">
                    {{ $t('cometous') }}
                    <br class="hidden lg:inline-block" />
                </h1>
                <p class="mb-8 leading-relaxed items-center">
                {{ $t('whycomehere') }} 
                <span class="font-medium text-sky-400">{{ $t("msc") }}</span>.
                </p>
                <div class="flex justify-center">
                    
                    <button  v-if="false" class="inline-flex text-white bg-sky-500/100 border-0 py-2 px-6 focus:outline-none hover:bg-sky-500/100 rounded text-lg">
                        
                    </button>
                    
                </div>
            </div>
            <div v-if="false" class="lg:max-w-lg lg:w-full md:w-2/3 w-5/6 rounded-lg">
                <swiper
                    
                    class="object-cover object-center rounded"
                    :effect="'fade'"
                    :navigation="true"
                    :autoplay="true"
                    :slidesPerView="1"
                    :modules="modules"
                >
                    <swiper-slide v-for="image in images"><img class="transition duration-300 ease-in-out " :src="image" /></swiper-slide>
                    <swiper-slide v-for="image in images"><img class="transition duration-300 ease-in-out hover" :src="image" /></swiper-slide>
                </swiper>
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
import {appw,config} from "@/appwrite";
import { VaButton } from 'vuestic-ui/web-components';
import gsap from "gsap";



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