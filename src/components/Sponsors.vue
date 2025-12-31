<template>
  <section class="text-gray-600 body-font" id="usefullinks">
    <div class="container px-5 py-20 mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <div class="lg:w-1/3 w-full">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
            {{ title }}
          </h1>
          <div class="h-1 w-20 bg-sky-500 rounded"></div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div v-for="i in 5" :key="i" class="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400 mb-4">Hiba történt a betöltéskor 😅</p>
        <button @click="loadData" class="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors">
          Újra próbálkozás
        </button>
      </div>

      <!-- Content -->
      <swiper
        v-else-if="links.length > 0"
        :slides-per-view="slidesPerView"
        :space-between="30"
        :centered-slides="true"
        :autoplay="autoplayConfig"
        :loop="true"
        :modules="swiperModules"
        class="swiper-centered"
      >
        <swiper-slide v-for="link in links" :key="link.id">
          <div
            class="bg-slate-100/30 hover:bg-sky-400/30 dark:bg-slate-300/30 rounded-lg shadow cursor-pointer p-2
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style="min-width: 100px; max-width: 200px;"
            @click="goto(link.link)"
          >
            <img 
              class="object-scale-down h-48 w-full mx-auto" 
              :src="link.img" 
              :alt="link.title || 'Link image'"
              loading="lazy"
            />
            <h3 v-if="link.title" class="text-sm font-medium text-gray-900 dark:text-white text-center mt-2 truncate">
              {{ link.title }}
            </h3>
          </div>
        </swiper-slide>
      </swiper>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">Nincs megjeleníthető tartalom</p>
      </div>
    </div>
  </section>
</template>

<script>
import { Databases, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default {
  name: 'UsefulLinks',
  components: { Swiper, SwiperSlide },
  props: {
    mode: {
      type: String,
      default: 'usefullinks',
      validator: (value) => ['usefullinks', 'sponsors'].includes(value),
    },
  },
  data() {
    return {
      title: '',
      links: [],
      isLoading: true,
      error: null,
      swiperModules: [EffectFade, Navigation, Pagination, Autoplay],
      autoplayConfig: {
        delay: 2500,
        disableOnInteraction: false,
      },
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    };
  },
  computed: {
    slidesPerView() {
      const { windowWidth } = this;
      if (windowWidth <= 480) return 2;
      if (windowWidth <= 768) return 3;
      if (windowWidth <= 1024) return 4;
      return 5;
    },
    isSponsorsMode() {
      return this.mode === 'sponsors';
    },
  },
  created() {
    this.updateTitleAndLoad();
  },
  mounted() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
    }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
    async updateTitleAndLoad() {
      this.title = this.$t(this.isSponsorsMode ? 'sponsors' : 'usefullinks');
      await this.loadData();
    },
    async loadData() {
      this.isLoading = true;
      this.error = null;

      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        
        const collectionId = this.isSponsorsMode ? config.sponsors_db : config.usefullinks;
        const imageField = this.isSponsorsMode ? 'sponsor_img' : 'logo';
        const linkField = this.isSponsorsMode ? 'sponsor_url' : 'link';
        

        const selectFields = this.isSponsorsMode
          ? [ 'sponsor_url', 'sponsor_img', '$id']
          : [ 'link', 'logo', '$id'];

        const { documents } = await database.listDocuments(config.website_db, collectionId, [
          Query.select(selectFields),
          Query.orderAsc('sorrend'),
        ]);

        this.links = documents.map((doc) => ({
          id: doc.$id,
          //title: doc[titleField] || '',
          link: doc[linkField],
          img: storage.getFilePreview(
            config.website_images,
            doc[imageField],
            200, 0, "center", 90, 5, 'FFFFFF', 0, 1, 0, 'FFFFFF', "webp"
          ),
        }));

        this.isLoading = false;
      } catch (error) {
        console.error('Failed to load links:', error);
        this.error = error;
        this.links = [];
        this.isLoading = false;
      }
    },
    goto(link) {
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    },
  },
};
</script>

<style scoped>
.swiper-centered .swiper-wrapper {
  display: flex;
  justify-content: center;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
  transition: background-color 0.2s ease;
}
</style>