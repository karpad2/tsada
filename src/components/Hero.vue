<template>
  <video-background
    v-if="loaded"
    :src="integrated_video"
    :options="options"
    class="hero-shell flex flex-wrap w-full mb-10 min-h-[280px] md:min-h-[360px] -mt-[5px]"
    poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  >
    <div class="hero-overlay absolute inset-0 pointer-events-none"></div>
    <section class="text-gray-600 body-font relative z-10 w-full" id="about">
      <div class="container mx-auto text-white flex px-5 py-8 md:py-12 md:flex-row flex-col items-center">
        <div class="glass-panel rounded-3xl p-6 md:p-10 max-w-xl lg:flex-grow md:w-1/2 flex flex-col md:items-start md:text-left items-center text-center shadow-2xl">
          <h1
            id="hero-heading-text"
            class="title-font py-2 sm:text-5xl text-3xl mb-3 font-semibold items-center text-white tracking-tight drop-shadow-lg"
          >
            {{ $t('cometous') }}
            <br class="hidden lg:inline-block" />
          </h1>
          <p v-if="showParagraph" class="mb-6 leading-relaxed items-center text-white/90 text-base md:text-lg">
            {{ $t('whycomehere') }}
            <span class="font-semibold text-sky-300">{{ $t("msc") }}</span>.
          </p>
          <div class="w-full flex md:justify-start justify-center animate-slide-in-right">
            <button
              @click="$router.push('/renderer/about/enrollment')"
              class="glass-btn relative mb-2 inline-flex items-center justify-center px-8 py-3.5 overflow-hidden font-bold text-white rounded-full group"
              aria-label="Join Us"
            >
              <span class="relative z-10">{{ $t('joinus') || 'Join Us!' }}</span>
              <span class="absolute left-0 w-full h-full transform -skew-x-12 bg-white opacity-10 group-hover:animate-shine"></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </video-background>
</template>

<script>
import VideoBackground from 'vue-responsive-video-background-player';
import { Databases, Query } from 'appwrite';
import { appw, config, randomIntFromInterval } from '@/appwrite';


const database = new Databases(appw);

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
    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo(
        '#hero-heading-text',
        { opacity: 0, x: '-100%' },
        { duration: 1.5, opacity: 1, x: 0, ease: 'power2.out' }
      );
    });
  },
  methods: {
    async load_mp_videos_from_base() {
      try {
        const { documents } = await database.listDocuments(
          config.website_db,
          config.hero_videos,
          [Query.select(['link', '$id'])]
        );
        if (documents.length > 0) {
          const k = randomIntFromInterval(0, documents.length - 1);
          this.integrated_video = documents[k].link;
        }
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        this.loaded = true;
      }
    },
  },
};
</script>

<style scoped>
.hero-shell {
  position: relative;
  overflow: hidden;
}

.hero-overlay {
  background: linear-gradient(
    120deg,
    rgba(15, 23, 42, 0.55) 0%,
    rgba(14, 165, 233, 0.2) 45%,
    rgba(15, 23, 42, 0.35) 100%
  );
}

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
