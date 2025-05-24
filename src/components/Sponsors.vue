<template>
    <section class="text-gray-600 body-font" id="usefullinks">
      <div class="container px-5 py-20 mx-auto">
        <div class="w-full mb-10">
          <div class="lg:w-1/3 w-full">
            <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ _title }}</h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </div>
  
        <swiper
          :slides-per-view="slidesPerView"
          :space-between="30"
          :autoplay="_autoplay"
          :loop="true"
          :modules="modules"
        >
          <swiper-slide v-for="(link, index) in links" :key="index">
            <div
              @click="goto(link.link)"
              class="bg-slate-100/30 hover:bg-sky-400/30 dark:bg-slate-300/30 rounded-lg shadow cursor-pointer p-2"
              style="min-width: 100px; max-width: 200px;"
            >
              <img class="object-scale-down h-48 w-32" v-lazy="link.img" />
            </div>
          </swiper-slide>
        </swiper>
      </div>
    </section>
  </template>
  
  <script>
  import { Databases, Storage, Query, ImageFormat, ImageGravity } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { Swiper, SwiperSlide } from 'swiper/vue';
  import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/effect-fade';
  import 'swiper/css/navigation';
  import 'swiper/css/pagination';
  
  export default {
    name: "UsefulLinks",
    components: { Swiper, SwiperSlide },
    props: { mode: String },
    data() {
      return {
        _title: "",
        links: [],
        modules: [EffectFade, Navigation, Pagination, Autoplay],
        _autoplay: {
          delay: 2500,
          disableOnInteraction: false
        },
        windowWidth: window.innerWidth
      };
    },
    computed: {
      slidesPerView() {
        if (this.windowWidth <= 480) return 2;
        if (this.windowWidth <= 768) return 3;
        if (this.windowWidth <= 1024) return 4;
        return 5;
      }
    },
    mounted() {
      this.updateTitleAndLoad();
      window.addEventListener("resize", this.handleResize);
    },
    beforeUnmount() {
      window.removeEventListener("resize", this.handleResize);
    },
    methods: {
      handleResize() {
        this.windowWidth = window.innerWidth;
      },
      async updateTitleAndLoad() {
        this._title = this.$t(this.mode === "sponsors" ? "sponsors" : "usefullinks");
        if (this.mode === "sponsors") {
          await this.loadLinks(config.sponsors_db, "sponsor_img", "sponsor_url");
        } else {
          await this.loadLinks(config.usefullinks, "logo", "link");
        }
      },
      async loadLinks(collectionId, imageField, linkField) {
        this.links = [];
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const res = await database.listDocuments(config.website_db, collectionId, [Query.orderAsc("sorrend")]);
  
        this.links = res.documents.map((doc) => ({
          link: doc[linkField],
          img: storage.getFilePreview(
            config.website_images,
            doc[imageField],
            200,
            0,
            ImageGravity.Center,
            90,
            5,
            "FFFFFF",
            0,
            1,
            0,
            "FFFFFF",
            ImageFormat.Webp
          ).href
        }));
      },
      goto(link) {
        window.open(link, "_blank");
      }
    }
  };
  </script>
  