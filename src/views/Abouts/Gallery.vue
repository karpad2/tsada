<template>
  <section
    class="text-gray-600 body-font p-5 min-h-screen"
    id="courses"
    role="main"
    aria-label="Gallery section"
    :aria-busy="loading"
  >
    <div class="container px-5 mx-auto">
      <!-- Header -->
      <div class="flex flex-wrap w-full mb-10">
        <div class="lg:w-1/2 w-full mb-6">
          <h1
            class="sm:text-3xl text-2xl font-medium title-font text-gray-900 dark:text-white"
            id="gallery-heading"
          >
            {{ $t("gallery") }}
          </h1>
          <div class="h-1 w-20 bg-sky-500 rounded"></div>
        </div>
        
        <!-- Item counter -->
        <div class="lg:w-1/2 w-full flex justify-end items-center">
          <div v-if="totalItems > 0" class="text-sm text-gray-500 dark:text-gray-400">
            {{ courses.length }} / {{ totalItems }} {{ $t("items") }}
          </div>
        </div>
      </div>

      <!-- Gallery Grid -->
      <div class="flex flex-wrap -m-3 justify-start" ref="scrollContainer">
        <!-- Admin: New Item -->
        <div
          v-if="admin"
          @click="new_stuff"
          @keydown.enter="new_stuff"
          @keydown.space.prevent="new_stuff"
          class="gallery-card cursor-pointer m-3 group"
          tabindex="0"
          role="button"
          aria-label="Add new gallery item"
        >
          <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300">
            <div class="aspect-[4/3] flex items-center justify-center">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t("add_new_content") }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gallery Items -->
        <div
          v-for="(course, index) in courses"
          :key="course.id"
          @click="courseopen(course.id)"
          @keydown.enter="courseopen(course.id)"
          @keydown.space.prevent="courseopen(course.id)"
          class="gallery-card cursor-pointer m-3 group animate-fade-in"
          :style="{ animationDelay: `${index * 50}ms` }"
          tabindex="0"
          role="button"
          :aria-label="`Open ${course.title}`"
        >
          <div class="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
            <!-- Image -->
            <div class="relative aspect-[4/3] overflow-hidden">
              <img
                v-lazy="course.img"
                :alt="course.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                @error="handleImageError"
              />
              
              <!-- Visibility Badge -->
              <div
                v-if="admin && !course.visible"
                class="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium"
              >
                {{ $t('invisible') }}
              </div>
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
            </div>

            <!-- Content -->
            <div class="p-4">
              <div class="mb-2">
                <span class="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                  {{ course.subtitle }}
                </span>
              </div>
              
              <h3 class="text-lg font-semibold text-gray-900  line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                {{ course.title }}
              </h3>
              
              <p 
                v-if="course.text" 
                class="mt-2 text-sm text-gray-600  line-clamp-2"
                v-html="course.text"
              ></p>
            </div>
          </div>
        </div>

        <!-- Skeleton Loaders -->
        <div
          v-if="loading"
          v-for="n in skeletonCount"
          :key="`skeleton-${n}`"
          class="gallery-card m-3"
          aria-hidden="true"
        >
          <div class="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700">
            <div class="aspect-[4/3] bg-gray-300 dark:bg-gray-600 rounded-t-xl"></div>
            <div class="p-4 space-y-3">
              <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
              <div class="h-5 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="courses.length === 0 && !loading"
        class="text-center py-20"
      >
        <div class="mb-6">
          <svg class="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
          {{ $t("no_gallery_items") }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ admin ? $t("add_first_item") : $t("check_back_later") }}
        </p>
      </div>

      <!-- Load More Button -->
      <div 
        v-if="!reachedEnd && courses.length > 0 && !loading"
        class="flex justify-center mt-12"
      >
        <button
          @click="loadMore"
          class="px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:bg-sky-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 font-medium"
        >
          {{ $t("load_more") }}
        </button>
      </div>

      <!-- Loading Indicator -->
      <div
        v-if="loading && courses.length > 0"
        class="flex justify-center items-center py-8"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <svg class="animate-spin h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="font-medium">{{ $t("loading") }}...</span>
        </div>
      </div>

      <!-- Back to Top -->
      <Transition name="fade">
        <button
          v-if="showBackToTop"
          @click="scrollToTop"
          class="fixed bottom-6 right-6 w-12 h-12 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 z-50"
          aria-label="Back to top"
        >
          <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>
      </Transition>
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
      scrollThreshold: 800,
      isInitialLoad: true,
      totalItems: 0,
      showBackToTop: false,
      handleScrollDebounced: null as any,
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
    skeletonCount() {
      return this.isInitialLoad ? 6 : 3;
    }
  },
  async mounted() {
    document.title = this.$t("gallery");
    this.admin = this.userLoggedin;
    
    // Setup scroll listener
    this.handleScrollDebounced = this.debounce(this.handleScroll, 200);
    window.addEventListener("scroll", this.handleScrollDebounced, { passive: true });
    
    // Load initial content
    await this.load_courses_base();
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
      if (this.loading || this.reachedEnd) {
        return;
      }
      
      this.loading = true;

      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        
        const queries = [
          Query.select([
            "title_hu", "title_en", "title_rs",
            "short_en", "short_hu", "short_rs",
            "$id", "default_image", "visible"
          ]),
          Query.limit(this.itemsPerPage),
          Query.offset(this.page * this.itemsPerPage),
          Query.orderDesc("$createdAt"),
        ];

        if (!this.userLoggedin) {
          queries.push(Query.equal("visible", true));
        }

        const res = await database.listDocuments(config.website_db, config.gallery, queries);
        
        // Set total on first load
        if (this.page === 0) {
          this.totalItems = res.total;
        }

        // Check if we reached the end
        if (res.documents.length === 0 || res.documents.length < this.itemsPerPage) {
          this.reachedEnd = true;
        }

        // Process new courses
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
        }

      } catch (error) {
        console.error("Failed to load courses:", error);
        this.$notify?.({
          type: "error",
          text: this.$t("error_loading_courses"),
        });
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
        return storage.getFilePreview(
          config.gallery_pictures_storage,
          imageId,
          400, 300, 'center', 85, 0, 'FFFFFF', 10, 1, 0, 'FFFFFF', 'webp'
        );
      } catch (error) {
        console.error('Error getting image URL:', error);
        return '';
      }
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
        this.$notify?.({
          type: "error",
          text: this.$t("error_creating_item"),
        });
      }
    },

    loadMore() {
      this.load_courses_base();
    },

    handleScroll() {
      // Back to top button
      this.showBackToTop = window.scrollY > 400;

      // Auto-load more when near bottom
      if (this.loading || this.reachedEnd) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      
      if (documentHeight - scrollPosition < this.scrollThreshold) {
        this.load_courses_base();
      }
    },

    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },

    handleImageError(event: Event) {
      const img = event.target as HTMLImageElement;
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    },

    async refreshGallery() {
      this.courses = [];
      this.page = 0;
      this.reachedEnd = false;
      this.isInitialLoad = true;
      this.totalItems = 0;
      await this.load_courses_base();
    },
  },
});
</script>

<style scoped>
/* Gallery card responsive sizing */
.gallery-card {
  width: 100%;
  max-width: 300px;
}

@media (min-width: 640px) {
  .gallery-card {
    width: calc(50% - 1.5rem);
  }
}

@media (min-width: 768px) {
  .gallery-card {
    width: calc(33.333% - 1.5rem);
  }
}

@media (min-width: 1024px) {
  .gallery-card {
    width: calc(25% - 1.5rem);
  }
}

@media (min-width: 1280px) {
  .gallery-card {
    width: calc(20% - 1.5rem);
  }
}

/* Text clamp utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out both;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Focus styles */
.gallery-card:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
  border-radius: 0.75rem;
}

/* Hover effects */
.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}

.group:hover .group-hover\:text-sky-600 {
  color: #0284c7;
}

.dark .group:hover .dark\:group-hover\:text-sky-400 {
  color: #38bdf8;
}

/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Pulse animation for skeletons */
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