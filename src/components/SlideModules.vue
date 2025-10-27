<template>
  <section class="text-gray-600 body-font mt-5 mb-5" id="courses">
    <div class="container px-5 mx-auto">
      <!-- Enhanced header section with statistics and filters -->
      <div class="flex flex-wrap justify-between items-center mb-12">
        <div class="lg:w-1/2 w-full mb-6">
          <h1 class="sm:text-4xl text-3xl font-semibold title-font mb-3 text-gray-900 dark:text-white">
            {{ $t(mode) }}
          </h1>
          <div class="h-1 w-24 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full mb-4"></div>

          <!-- Statistics badges -->
          <div class="flex flex-wrap gap-3 mt-4">
            <div class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {{ courses.length }} {{ $t('items') }}
            </div>

            <div v-if="admin" class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ visibleCount }} {{ $t('visible') }}
            </div>

            <div v-if="admin && hiddenCount > 0" class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.5 8.5m1.378 1.378l4.242 4.242M12 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-6-6l-6-6"></path>
              </svg>
              {{ hiddenCount }} {{ $t('hidden') }}
            </div>
          </div>
        </div>

        <!-- Admin actions section -->
        <div v-if="admin" class="lg:w-1/2 w-full flex flex-col lg:items-end">
          <!-- Admin search bar -->
          <div class="relative mb-4 w-full lg:w-96">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              :placeholder="$t('search_content')"
              class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>

            <!-- Clear search button -->
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Admin filter buttons -->
          <div class="flex gap-2 mb-4">
            <button
              @click="setFilter('all')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                filterType === 'all'
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ $t('all') }}
            </button>

            <button
              @click="setFilter('visible')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                filterType === 'visible'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ $t('visible_only') }}
            </button>

            <button
              @click="setFilter('hidden')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                filterType === 'hidden'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ $t('hidden_only') }}
            </button>
          </div>

          <!-- Admin view toggle -->
          <div v-if="false" class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading skeleton for initial load -->
      <div v-if="isInitialLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n" class="animate-pulse">
          <div class="bg-gray-200 dark:bg-gray-700 h-48 rounded-t-xl"></div>
          <div class="p-4 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Cards grid with improved responsive layout -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <!-- Add new content card - improved design -->
        <div
          v-if="admin"
          class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-slate-800 dark:to-slate-700 border-2 border-dashed border-sky-300 dark:border-sky-600 hover:border-sky-500 dark:hover:border-sky-400 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          @click="newStuff"
          @keydown.enter="newStuff"
          @keydown.space.prevent="newStuff"
          tabindex="0"
          role="button"
          :aria-label="$t('add_new_content')"
        >
          <div class="h-48 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-sky-500 rounded-full flex items-center justify-center group-hover:bg-sky-600 transition-colors duration-200">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </div>
              <p class="text-sky-700 dark:text-sky-300 font-medium group-hover:text-sky-800 dark:group-hover:text-sky-200">
                {{ $t('add_new_content') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Content cards with improved design -->
        <article
          v-for="course in courses"
          :key="course.id"
          class="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 fade-slide border border-gray-100 dark:border-gray-700"
          @click="courseOpen(course.id)"
          @keydown.enter="courseOpen(course.id)"
          @keydown.space.prevent="courseOpen(course.id)"
          tabindex="0"
          role="article"
          :aria-label="`${course.title} - ${course.subtitle}`"
        >
          <!-- Image container with loading state and overlay -->
          <div class="relative overflow-hidden h-48">
            <img
              :src="course.img"
              :alt="course.title"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              @error="handleImageError"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <!-- Visibility indicator -->
            <div v-if="admin && !course.visible" 
                 class="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {{ $t('invisible') }}
            </div>
          </div>

          <!-- Content section with improved typography -->
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span v-if="false" class="inline-block px-2 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-medium rounded-full tracking-wide uppercase">
                {{ course.subtitle }}
              </span>
            </div>
            
            <h2 class="text-xl font-semibold text-gray-900  leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-200 line-clamp-2">
              {{ course.title }}
            </h2>
            
            <p v-if="course.text" 
               class="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 text-sm" 
               v-html="course.text">
            </p>

            <!-- Read more indicator -->
            <div class="flex items-center text-sky-600 dark:text-sky-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span class="mr-1">{{ $t('read_more') }}</span>
              <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </article>
      </div>

      <!-- Improved loading indicator -->
      <div v-if="isLoading && !isInitialLoading" class="w-full text-center py-8">
        <div class="inline-flex items-center space-x-2">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent"></div>
          <span class="text-gray-600 dark:text-gray-300 font-medium">{{ $t('loading_more') }}</span>
        </div>
      </div>

      <!-- No more content indicator -->
      <div v-if="!hasMore && courses.length > 0" class="w-full text-center py-8">
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t('no_more_content') }}</p>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && !isInitialLoading && courses.length === 0" class="text-center py-16">
        <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">{{ $t('no_content_available') }}</h3>
        <p class="text-gray-500 dark:text-gray-400">{{ $t('no_content_description') }}</p>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Databases, ID, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { convertifserbian as convertIfSerbian, getStatus } from '@/lang';
import { useLoadingStore } from '@/stores/loading';
import gsap from 'gsap';

export default defineComponent({
  name: 'SlideModules',
  props: {
    mode: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      admin: false,
      courses: [] as Array<{
        id: string;
        visible: boolean;
        title: string;
        subtitle: string;
        text: string;
        img: string;
      }>,
      page: 0,
      limit: 24, // Significantly increased to load more items
      isLoading: false,
      isInitialLoading: true,
      hasMore: true,
      retryCount: 0,
      maxRetries: 3,
      searchQuery: '',
      filterType: 'all', // 'all', 'visible', 'hidden'
      viewMode: 'grid', // 'grid', 'list'
      allCourses: [] as Array<any>, // Store all courses for filtering
      searchTimeout: null as any, // For debouncing search
    };
  },
  computed: {
    loadingStore() {
      return useLoadingStore();
    },
    currentLanguage() {
      return this.loadingStore.language;
    },
    visibleCount() {
      return this.courses.filter(course => course.visible).length;
    },
    hiddenCount() {
      return this.courses.filter(course => !course.visible).length;
    },
    filteredCourses() {
      console.log('Computing filteredCourses with filterType:', this.filterType);
      let filtered = [...this.allCourses];

      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(course =>
          course.title.toLowerCase().includes(query) ||
          course.text.toLowerCase().includes(query)
        );
      }

      // Apply visibility filter
      if (this.filterType === 'visible') {
        console.log('Filtering for visible only');
        filtered = filtered.filter(course => course.visible);
      } else if (this.filterType === 'hidden') {
        console.log('Filtering for hidden only');
        filtered = filtered.filter(course => !course.visible);
      }

      console.log('Filtered result:', filtered.length, 'items');
      return filtered;
    }
  },
  async mounted() {
    this.admin = this.loadingStore.userLoggedin;
    await this.loadCourses();

    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Improved animation with better performance
    this.$nextTick(() => {
      gsap.fromTo(
        '.fade-slide',
        { opacity: 0, y: 30, scale: 0.95 },
        { 
          duration: 0.8, 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          stagger: 0.05, 
          ease: 'power2.out',
          clearProps: 'transform' // Clean up after animation
        }
      );
    });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  watch: {
    // Watch for language changes in the Pinia store
    async currentLanguage() {
      // Reload content when language changes
      await this.reloadAllContent();
    },

    // Watch for filter type changes
    filterType() {
      console.log('Filter type changed to:', this.filterType);
      this.applyFilters();
    }
  },
  methods: {
    async loadCourses(retryOnError = true) {
      if (this.isLoading || !this.hasMore) return;
      this.isLoading = true;

      try {
        const db = new Databases(appw);
        const storage = new Storage(appw);

        const filters = [
          Query.equal('type', this.mode),
          Query.limit(this.limit),
          Query.offset(this.page * this.limit),
          Query.orderDesc('$createdAt'),
          Query.select([
            'title_hu',
            'title_en',
            'title_rs',
            'short_en',
            'short_hu',
            'short_rs',
            '$id',
            'default_image',
            'visible',
            'notNews',
            '$createdAt',
          ]),
          ...(this.mode === 'news' ? [Query.or([Query.isNull('notNews'), Query.equal('notNews', false)])] : []),
          ...(!this.loadingStore.userLoggedin ? [Query.equal(getStatus(), true), Query.equal('visible', true)] : []),
        ];

        const { documents } = await db.listDocuments(config.website_db, config.about_us_db, filters);

        if (documents.length < this.limit) this.hasMore = false;

        const newCourses = documents.map((doc) => {
          const lang = this.loadingStore.language;
          return {
            id: doc.$id,
            visible: doc.visible,
            title:
              lang === 'en'
                ? doc.title_en
                : lang === 'hu'
                ? doc.title_hu
                : convertIfSerbian(doc.title_rs),
            subtitle:
              lang === 'en'
                ? doc.short_en
                : lang === 'hu'
                ? doc.short_hu
                : convertIfSerbian(doc.short_rs),
            text: '',
            img: doc.default_image
              ? storage.getFilePreview(
                  config.website_images,
                  doc.default_image,
                  700, 0, 'center', 90, 5, 'FFFFFF', 15, 1, 0, 'FFFFFF', 'webp'
                ).toString()
              : this.getPlaceholderImage(),
          };
        });

        this.courses.push(...newCourses);
        this.allCourses.push(...newCourses); // Store all courses for filtering
        this.page++;
        this.retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('Error loading courses:', error);
        
        if (retryOnError && this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.loadCourses(true), 1000 * this.retryCount);
        }
      } finally {
        this.isLoading = false;
        if (this.isInitialLoading) {
          this.isInitialLoading = false;
        }
      }
    },
    courseOpen(id: string) {
      const path = id.toLowerCase().replace(/\s/g, '');
      this.$router.push(`/renderer/${this.mode}/${path}`);
    },
    async newStuff() {
      try {
        const db = new Databases(appw);
        const doc = await db.createDocument(config.website_db, config.about_us_db, ID.unique(), {
          type: this.mode,
          aboutCategories: config.news_category_in_text,
          notNews: false,
        });
        this.$router.push(`/admin/edit/${this.mode}/${doc.$id}`);
      } catch (error) {
        console.error('Error creating new content:', error);
        // Could add user notification here
      }
    },
    handleScroll() {
      const threshold = 200; // Load more content when 200px from bottom
      if (
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - threshold &&
        !this.isLoading &&
        this.hasMore &&
        !this.isInitialLoading
      ) {
        this.loadCourses();
      }
    },
    handleImageError(event: Event) {
      const img = event.target as HTMLImageElement;
      img.src = this.getPlaceholderImage();
    },
    getPlaceholderImage(): string {
      return 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&h=400&q=80';
    },

    // Search and filter methods
    handleSearch() {
      // Debounce search for better performance
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.applyFilters();
      }, 300);
    },

    clearSearch() {
      this.searchQuery = '';
      this.applyFilters();
    },

    setFilter(type: string) {
      console.log('Setting filter to:', type);
      this.filterType = type;
      this.applyFilters();
    },

    applyFilters() {
      console.log('Applying filters - filterType:', this.filterType, 'searchQuery:', this.searchQuery);
      console.log('All courses:', this.allCourses.length, 'Filtered courses:', this.filteredCourses.length);
      // Update displayed courses based on current filters
      this.courses = [...this.filteredCourses]; // Force reactivity with spread operator
    },

    async reloadAllContent() {
      // Reset pagination and reload all content for new language
      this.page = 0;
      this.courses = [];
      this.allCourses = [];
      this.hasMore = true;
      this.isInitialLoading = true;
      await this.loadCourses();
    },
  },
});
</script>

<style scoped>
.fade-slide {
  will-change: transform, opacity;
}

/* Line clamp utilities if not available in Tailwind */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-500 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500 dark:bg-gray-400;
}

/* Focus styles for accessibility */
[tabindex]:focus-visible {
  @apply outline-2 outline-offset-2 outline-sky-500;
}

/* Animation performance optimization */
@media (prefers-reduced-motion: reduce) {
  .fade-slide,
  .transition-all,
  .transition-transform,
  .transition-colors,
  .transition-opacity {
    transition: none !important;
    animation: none !important;
  }
}
</style>