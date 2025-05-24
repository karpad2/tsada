<template>
    <section class="text-gray-600 body-font p-5 min-h-screen" id="courses" role="main" aria-label="Gallery section">
      <div class="container px-5 mx-auto">
        <div class="flex flex-wrap w-full mb-10">
          <div class="lg:w-1/2 w-full mb-6">
            <h1 class="sm:text-3xl text-2xl font-medium title-font text-gray-900 dark:text-white" id="gallery-heading">
              {{ $t("gallery") }}
            </h1>
            <div class="h-1 w-20 bg-sky-500 rounded" role="presentation"></div>
          </div>
        </div>
  
        <div class="flex flex-wrap -m-3 justify-start" ref="scrollContainer">
          <!-- Admin: Új hozzáadása -->
          <div
            v-if="admin"
            @click="new_stuff"
            class="card card-compact cursor-pointer glass m-3 w-full sm:w-1/3 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"
            style="min-width: 273px; min-height: 276px;"
            role="button"
            aria-label="Add new gallery item"
          >
            <figure class="h-40 flex justify-center items-center">
              <img class="size-16 rounded object-cover" src="@/assets/add-plus-new.svg" alt="Add new item icon" />
            </figure>
            <div class="card-body">
              <h2 class="text-lg text-gray-900 font-medium dark:text-white">
                {{ $t("add_new_content") }}
              </h2>
            </div>
          </div>
  
          <!-- Galéria elemek -->
          <div
            v-for="course in courses"
            :key="course.id"
            @click="courseopen(course.id)"
            class="card card-compact cursor-pointer glass m-3 w-full sm:w-1/3 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"
            role="link"
            :aria-label="'Open ' + course.title"
          >
            <figure>
              <img
                class="h-40 rounded w-full object-cover transition duration-300"
                v-lazy="course.img"
                :alt="course.title"
              />
            </figure>
            <div class="card-body">
              <h3 class="tracking-widest text-sky-500 text-sm font-medium">
                {{ course.subtitle }}
                <span v-if="isHidden(course.visible)">({{ $t('invisible') }})</span>
              </h3>
              <h2 class="text-lg text-gray-900 font-medium dark:text-white">{{ course.title }}</h2>
              <p class="text-base" v-html="course.text"></p>
            </div>
          </div>
  
          <!-- Skeleton loader -->
          <div v-if="loading && courses.length === 0" class="flex flex-wrap -m-3 justify-start">
            <div
              v-for="n in 5"
              :key="'skeleton-' + n"
              class="card card-compact m-3 w-full sm:w-1/3 md:w-1/5 lg:w-1/5 bg-slate-200/40 dark:bg-slate-600/30 shadow animate-pulse"
              style="min-width: 273px; min-height: 276px;"
              aria-hidden="true"
            >
              <div class="h-40 bg-slate-300 dark:bg-slate-700 rounded-t"></div>
              <div class="p-4 space-y-2">
                <div class="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                <div class="h-6 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
                <div class="h-3 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
              </div>
            </div>
          </div>
  
          <!-- Üres fallback -->
          <div v-if="courses.length === 0 && !loading" class="w-full text-center py-10 text-gray-500 dark:text-white">
            {{ $t("no_gallery_items") }}
          </div>
        </div>
  
        <!-- További betöltés -->
        <div v-if="loading && courses.length > 0" class="text-center py-10 text-gray-400 dark:text-gray-300" role="status" aria-live="polite">
          {{ $t("loading") }}...
        </div>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { Databases, ID, Storage, Query } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { convertifserbian } from "@/lang";
  import { useLoadingStore } from "@/stores/loading";
  
  export default {
    name: "Gallery",
    data() {
      return {
        admin: false,
        courses: [],
        page: 0,
        loading: false,
        reachedEnd: false
      };
    },
    props: {
      mode: String
    },
    mounted() {
      document.title = this.$t("gallery");
      this.admin = useLoadingStore().userLoggedin;
      this.load_courses_base();
      window.addEventListener("scroll", this.handleScroll);
    },
    beforeUnmount() {
      window.removeEventListener("scroll", this.handleScroll);
    },
    methods: {
      async load_courses_base() {
        if (this.loading || this.reachedEnd) return;
        this.loading = true;
  
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const { language, userLoggedin } = useLoadingStore();
  
        const queries = [
          Query.select([
            "title_hu", "title_en", "title_rs",
            "short_en", "short_hu", "short_rs",
            "$id", "default_image", "visible"
          ]),
          Query.limit(12),
          Query.offset(this.page * 12)
        ];
  
        if (!userLoggedin) {
          queries.unshift(Query.equal("visible", true));
        }
  
        const res = await database.listDocuments(config.website_db, config.gallery, queries);
  
        if (res.documents.length === 0) {
          this.reachedEnd = true;
          this.loading = false;
          return;
        }
  
        res.documents.forEach(doc => {
          const localized = {
            en: { title: doc.title_en, subtitle: doc.short_en },
            hu: { title: doc.title_hu, subtitle: doc.short_hu },
            rs: { title: convertifserbian(doc.title_rs), subtitle: convertifserbian(doc.short_rs) }
          }[language] || {};
  
          const imgUrl = storage.getFilePreview(
            config.gallery_pictures_storage,
            doc.default_image,
            400, 0, 'center', 85, 0, 'FFFFFF', 10, 1, 0, 'FFFFFF', 'webp'
          ).href;
  
          this.courses.push({
            id: doc.$id,
            visible: doc.visible,
            title: localized.title,
            subtitle: localized.subtitle,
            text: '',
            img: imgUrl
          });
        });
  
        this.page++;
        this.loading = false;
      },
      isHidden(visible: boolean) {
        return !visible;
      },
      courseopen(id: string) {
        const path = id.toLowerCase().replaceAll(" ", "");
        this.$router.push("/album/" + path);
      },
      async new_stuff() {
        const database = new Databases(appw);
        const newDoc = await database.createDocument(config.website_db, config.gallery, ID.unique(), { visible: false });
        this.$router.push("/admin/gallery-edit/" + newDoc.$id);
      },
      handleScroll() {
        const bottomReached = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
        if (bottomReached) {
          this.load_courses_base();
        }
      }
    }
  };
  </script>
  
  <style scoped>
  /* Extra animációs osztály ha kellene */
  .becsuszo_kep {}
  </style>
  