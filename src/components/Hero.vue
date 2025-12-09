<template>
  <video-background
    v-if="loaded"
    :src="integrated_video"
    :options="options"
    class="flex flex-wrap w-full mb-20 min-h-[220px] -mt-[5px]"
    poster="path/to/fallback-image.jpg"
  >
    <section class="text-gray-600 body-font" id="about">
      <div class="container mx-auto text-white flex px-5 py-5 md:flex-row flex-col items-center">
        <div class="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          <h1 id="hero-heading-text" class="title-font py-8 sm:text-4xl text-3xl mb-4 font-medium items-center text-white">
            {{ $t('cometous') }}
            <br class="hidden lg:inline-block" />
          </h1>
          <p v-if="showParagraph" class="mb-8 leading-relaxed items-center">
            {{ $t('whycomehere') }}
            <span class="font-medium text-sky-400">{{ $t("msc") }}</span>.
          </p>
          <div class="w-full flex justify-end  animate-slide-in-right">
            <button
              @click="$router.push('/renderer/about/enrollment')"
              class="relative mb-10 inline-flex items-center justify-center px-8 py-3  overflow-hidden font-bold text-white transition duration-500 ease-in-out transform bg-gradient-to-r from-sky-600 to-sky-400 rounded-full shadow-lg hover:scale-105 hover:shadow-xl group"
              aria-label="Join Us"
            >
              <span class="relative z-10">{{ $t('joinus') || 'Join Us!' }}</span>
              <span class="absolute left-0 w-full h-full transform -skew-x-12 bg-white opacity-10 group-hover:animate-shine"></span>
              <span class="absolute inset-0 rounded-full ring-2 ring-sky-500 opacity-50 blur-md group-hover:opacity-75 transition"></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </video-background>
</template>

<script>
import VideoBackground from 'vue-responsive-video-background-player';
import { Client, Databases, Storage, Query } from 'appwrite';
import { appw, config, randomIntFromInterval } from '@/appwrite';
import gsap from 'gsap';

export default {
  data: () => ({
    integrated_video: config.default_video,
    loaded: false,
    showParagraph: false,
    options: {
      mouseControls: true,
      touchControls: true,
      minHeight: 500.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
    },
  }),
  mounted() {
    this.load_mp_videos_from_base();
    gsap.fromTo(
      '#hero-heading-text',
      { opacity: 0, x: '-100%' },
      { duration: 1.5, opacity: 1, x: 0, ease: 'power2.out' }
    );
  },
  methods: {
    async load_mp_videos_from_base() {
      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const { documents } = await database.listDocuments(
          config.website_db,
          config.hero_videos,
          [Query.select(['link', '$id'])]
        );
        if (documents.length > 0) {
          const k = randomIntFromInterval(0, documents.length - 1);
          this.integrated_video = documents[k].link;
        }
        this.loaded = true;
      } catch (error) {
        console.error('Failed to load videos:', error);
        this.loaded = true; // Use default video if fetch fails
      }
    },
  },
};
</script>

<style scoped>
/* Scoped styles to avoid affecting other components */
.animate-shine {
  animation: shine 0.75s ease-in-out;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(100%) skewX(-12deg);
  }
}
</style>