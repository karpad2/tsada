<template>
  <section
    class="text-gray-600 body-font p-5 min-h-screen"
    id="courses"
    role="main"
    aria-label="Gallery section"
    :aria-busy="loading"
  >
    <div class="container px-5 mx-auto">
      <div class="flex flex-wrap w-full mb-10">
        <div class="lg:w-1/2 w-full mb-6">
          <h1
            class="sm:text-3xl text-2xl font-medium title-font text-gray-900 dark:text-white"
            id="gallery-heading"
          >
            {{ $t("gallery") }}
          </h1>
          <div class="h-1 w-20 bg-sky-500 rounded" role="presentation"></div>
        </div>
      </div>

      <div class="flex flex-wrap -m-3 justify-start" ref="scrollContainer">
        <!-- Admin: New Item -->
        <div
          v-if="admin"
          @click="new_stuff"
          @keypress.enter="new_stuff"
          class="card card-compact cursor-pointer glass m-3 w-full sm:w-1/3 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"
          style="min-width: 273px; min-height: 276px;"
          role="button"
          tabindex="0"
          aria-label="Add new gallery item"
        >
          <figure class="h-40 flex justify-center items-center">
            <img
              class="size-16 rounded object-cover"
              src="@/assets/add-plus-new.svg"
              alt="Add new item icon"
            />
          </figure>
          <div class="card-body">
            <h2 class="text-lg text-gray-900 font-medium dark:text-white">
              {{ $t("add_new_content") }}
            </h2>
          </div>
        </div>

        <!-- Gallery Items -->
        <div
          v-for="course in courses"
          :key="course.id"
          @click="courseopen(course.id)"
          @keypress.enter="courseopen(course.id)"
          class="card card-compact cursor-pointer glass m-3 w-full sm:w-1/3 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"
          style="min-width: 273px; min-height: 276px;"
          role="button"
          tabindex="0"
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

        <!-- Skeleton Loader -->
        <div v-if="loading && courses.length === 0" class="flex flex-wrap -m-3 justify-start">
          <div
            v-for="n in 6"
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

        <!-- Empty Fallback -->
        <div
          v-if="courses.length === 0 && !loading"
          class="w-full text-center py-10 text-gray-500 dark:text-white"
        >
          {{ $t("no_gallery_items") }}
        </div>
      </div>

      <!-- Loading indicator for additional items -->
      <div
        v-if="loading && courses.length > 0"
        class="text-center py-8 text-gray-400 dark:text-gray-300"
        role="status"
        aria-live="polite"
      >
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ $t("loading") }}...
        </div>
      </div>


    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { convertifserbian } from "@/lang";
import { useLoadingStore } from "@/stores/loading";

interface Course {
  id: string;
  visible: boolean;
  title: string;
  subtitle: string;
  text: string;
  img: string;
}

export default defineComponent({
  name: "Gallery",
  data() {
    return {
      admin: false,
      courses: [] as Course[],
      page: 0,
      loading: false,
      reachedEnd: false,
      itemsPerPage: 12,
      scrollThreshold: 800, // pixel distance from bottom to trigger load
      isInitialLoad: true,
    };
  },
  props: {
    mode: String,
  },
  computed: {
    loadingStore() {
      return useLoadingStore();
    },
    language() {
      return this.loadingStore.language;
    },
    userLoggedin() {
      return this.loadingStore.userLoggedin;
    },
  },
  mounted() {
    document.title = this.$t("gallery");
    this.admin = this.userLoggedin;
    this.load_courses_base();
    
    // Optimalizált scroll listener
    this.handleScrollDebounced = this.debounce(this.handleScroll, 150);
    window.addEventListener("scroll", this.handleScrollDebounced, { passive: true });
  },
  beforeUnmount() {
    if (this.handleScrollDebounced) {
      window.removeEventListener("scroll", this.handleScrollDebounced);
    }
  },
  methods: {
    debounce(fn: Function, wait: number) {
      let timeout: ReturnType<typeof setTimeout>;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
      };
    },

    async load_courses_base() {
      // Elkerüljük a dupla hívásokat
      if (this.loading || this.reachedEnd) {
        console.log('Skipping load: loading=', this.loading, 'reachedEnd=', this.reachedEnd);
        return;
      }
      
      this.loading = true;
      console.log('Loading page:', this.page);

      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        
        // Javított query felépítés
        const queries = [
          Query.select([
            "title_hu",
            "title_en",
            "title_rs",
            "short_en",
            "short_hu", 
            "short_rs",
            "$id",
            "default_image",
            "visible",
          ]),
          Query.limit(this.itemsPerPage), // Mindig csak a szükséges mennyiséget kérjük
          Query.offset(this.page * this.itemsPerPage), // Helyes offset számítás
          Query.orderDesc("$createdAt"), // Konzisztens rendezés
        ];

        // Csak a látható elemeket kérjük nem admin esetén
        if (!this.userLoggedin) {
          queries.push(Query.equal("visible", true));
        }

        console.log('Executing query with offset:', this.page * this.itemsPerPage, 'limit:', this.itemsPerPage);
        const res = await database.listDocuments(config.website_db, config.gallery, queries);
        
        console.log('Received documents:', res.documents.length, 'total:', res.total);

        // Ha nincs több elem, jelezzük
        if (res.documents.length === 0 || res.documents.length < this.itemsPerPage) {
          this.reachedEnd = true;
          console.log('Reached end of content');
        }

        // Ha vannak elemek, hozzáadjuk őket
        if (res.documents.length > 0) {
          const newCourses = res.documents.map((doc) => ({
            id: doc.$id,
            visible: doc.visible,
            title: this.getLocalizedTitle(doc),
            subtitle: this.getLocalizedSubtitle(doc),
            text: "",
            img: this.getImageUrl(doc.default_image, storage),
          }));

          this.courses.push(...newCourses);
          this.page++;
          
          console.log('Added', newCourses.length, 'new courses. Total:', this.courses.length);
        }

      } catch (error) {
        console.error("Failed to load courses:", error);
        this.$notify({
          type: "error",
          text: this.$t("error_loading_courses"),
        });
        
        // Hiba esetén ne próbáljunk tovább
        this.reachedEnd = true;
      } finally {
        this.loading = false;
        this.isInitialLoad = false;
      }
    },

    getLocalizedTitle(doc: any): string {
      const titles = {
        en: doc.title_en,
        hu: doc.title_hu,
        rs: convertifserbian(doc.title_rs),
      };
      return titles[this.language as keyof typeof titles] || doc.title_en || 'Untitled';
    },

    getLocalizedSubtitle(doc: any): string {
      const subtitles = {
        en: doc.short_en,
        hu: doc.short_hu,
        rs: convertifserbian(doc.short_rs),
      };
      return subtitles[this.language as keyof typeof subtitles] || doc.short_en || '';
    },

    getImageUrl(imageId: string, storage: Storage): string {
      if (!imageId) return '';
      
      try {
        return storage
          .getFilePreview(
            config.gallery_pictures_storage,
            imageId,
            400,
            0,
            "center",
            85,
            0,
            "FFFFFF",
            10,
            1,
            0,
            "FFFFFF",
            "webp"
          )
          .href;
      } catch (error) {
        console.error('Error getting image URL for:', imageId, error);
        return '';
      }
    },

    isHidden(visible: boolean) {
      return !visible;
    },

    courseopen(id: string) {
      const path = id.toLowerCase().replaceAll(" ", "");
      this.$router.push("/album/" + path);
    },

    async new_stuff() {
      if (this.loading) return;
      
      try {
        const database = new Databases(appw);
        const newDoc = await database.createDocument(
          config.website_db,
          config.gallery,
          ID.unique(),
          { visible: false }
        );
        this.$router.push("/admin/gallery-edit/" + newDoc.$id);
      } catch (error) {
        console.error("Failed to create new gallery item:", error);
        this.$notify({
          type: "error",
          text: this.$t("error_creating_item"),
        });
      }
    },

    handleScroll() {
      // Csak akkor próbáljunk tölteni, ha nem töltünk már és van még tartalom
      if (this.loading || this.reachedEnd) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      const distanceFromBottom = documentHeight - scrollPosition;

      // Debug info
      console.log('Scroll check - Distance from bottom:', distanceFromBottom, 'Threshold:', this.scrollThreshold);

      // Ha elég közel vagyunk az aljához, töltünk
      if (distanceFromBottom < this.scrollThreshold) {
        console.log('Triggering load from scroll');
        this.load_courses_base();
      }
    },

    // Refresh function admin műveletek után
    async refreshGallery() {
      this.courses = [];
      this.page = 0;
      this.reachedEnd = false;
      this.isInitialLoad = true;
      await this.load_courses_base();
    },
  },
});
</script>

<style scoped>
/* Smooth transitions for better UX */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* Loading animation */
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
</style>