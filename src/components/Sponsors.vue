<template>
  <section class="text-gray-600 body-font" id="usefullinks">
    <div class="container px-5 py-20 mx-auto">
      <div class="mb-10">
        <div class="lg:w-1/3 w-full">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ title }}</h1>
          <div class="h-1 w-20 bg-sky-500 rounded"></div>
        </div>
      </div>

      <swiper
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
            class="bg-slate-100/30 hover:bg-sky-400/30 dark:bg-slate-300/30 rounded-lg shadow cursor-pointer p-2"
            style="min-width: 100px; max-width: 200px;"
            @click="goto(link.link)"
          >
            <img class="object-scale-down h-48 w-32" :src="link.img" alt="Link image" />
          </div>
        </swiper-slide>
      </swiper>
    </div>
  </section>
</template>

<script>
import { Databases, Storage, Query, ImageFormat, ImageGravity } from 'appwrite';
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
      swiperModules: [EffectFade, Navigation, Pagination, Autoplay],
      autoplayConfig: {
        delay: 2500,
        disableOnInteraction: false,
      },
      windowWidth: window.innerWidth,
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
    window.addEventListener('resize', this.handleResize, { passive: true });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
    async updateTitleAndLoad() {
      this.title = this.$t(this.isSponsorsMode ? 'sponsors' : 'usefullinks');
      const collectionId = this.isSponsorsMode ? config.sponsors_db : config.usefullinks;
      const imageField = this.isSponsorsMode ? 'sponsor_img' : 'logo';
      const linkField = this.isSponsorsMode ? 'sponsor_url' : 'link';
      await this.loadLinks(collectionId, imageField, linkField);
    },
    async loadLinks(collectionId, imageField, linkField) {
      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const { documents } = await database.listDocuments(config.website_db, collectionId, [
          Query.orderAsc('sorrend'),
        ]);

        this.links = documents.map((doc) => ({
          id: doc.$id,
          link: doc[linkField],
          img: storage.getFilePreview(
            config.website_images,
            doc[imageField],
            200,
            0,
            ImageGravity.Center,
            90,
            5,
            'FFFFFF',
            0,
            1,
            0,
            'FFFFFF',
            ImageFormat.Webp,
          ).href,
        }));
      } catch (error) {
        console.error('Failed to load links:', error);
        this.links = [];
      }
    },
    goto(link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    },
  },
};
</script>

<style scoped>
.swiper-centered .swiper-wrapper {
  display: flex;
  justify-content: center;
}
</style>