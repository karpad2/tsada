<template>
  <section
    ref="scrollContainer"
    class="text-gray-600 body-font p-5 overflow-x-hidden"
    id="courses"
  >
    <div class="container px-5 mx-auto">
      <!-- Header Section -->
      <div v-if="caption" class="flex flex-wrap w-full mb-10">
        <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
            {{ title }}
          </h1>
          <div class="h-1 w-20 bg-sky-500 rounded"></div>
          <p v-if="images.length > 0" class="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {{ images.length }} {{ $t("image") }}
          </p>
        </div>
      </div>

      <!-- Admin Controls -->
      <div v-if="isAdmin" class="mb-5 mt-5 flex gap-2">
        <VBtn @click="editMode">{{ $t('edit_gallery') }}</VBtn>
        <VBtn 
          @click="deleteBrokenImages"
          :disabled="isDeleting"
          class="relative"
        >
          <span v-if="isDeleting" class="mr-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ isDeleting ? 'Törlés...' : $t('delete_broken_images') }}
        </VBtn>
      </div>

      <!-- Image Gallery -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          v-for="(course, index) in courses"
          :key="course.img"
          class="gallery-item group relative cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-out"
          @click="openImage(index)"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <!-- Image -->
          <figure class="relative overflow-hidden touch-target">
            <img
              :src="course.img"
              style="height: 280px"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-active:scale-105"
              loading="lazy"
              :alt="`${title} - Kép ${index + 1}`"
              @load="onImageLoad(course.img)"
              @error="onImageError(course.img)"
              draggable="false"
            />

            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"></div>

            <!-- Touch feedback -->
            <div class="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity duration-150 pointer-events-none"></div>

            <!-- Hover/Touch icon -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300">
              <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-4 shadow-xl transform scale-90 group-hover:scale-100 group-active:scale-95 transition-transform duration-300">
                <svg class="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Image counter badge -->
            <div class="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full touch-counter">
              {{ index + 1 }}
            </div>

            <!-- Quick action button (mobile) -->
            <div class="absolute top-3 right-3 md:hidden">
              <button 
                @click.stop="openImage(index)"
                class="bg-black/70 backdrop-blur-sm text-white p-2 rounded-full touch-button transition-transform active:scale-90"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            <!-- Loading overlay -->
            <div 
              v-if="!loadedImages.has(course.img) && !imageErrors.has(course.img)"
              class="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            >
              <div class="text-center">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto mb-3"></div>
                <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t("loading") }}...</p>
              </div>
            </div>

            <!-- Error state -->
            <div 
              v-if="imageErrors.has(course.img)"
              class="absolute inset-0 bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
            >
              <div class="text-center p-4">
                <svg class="w-16 h-16 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-red-600 dark:text-red-400 text-sm font-medium">{{ $t("error_at_loading") }}</p>
                <button 
                  @click.stop="retryImage(course.img, index)"
                  class="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors"
                >
                  Újrapróbálás
                </button>
              </div>
            </div>
          </figure>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
        <div
          v-for="n in limit"
          :key="`skeleton-${n}`"
          class="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse h-[280px] rounded-xl flex items-center justify-center"
        >
          <div class="text-center">
            <div class="w-16 h-16 bg-white/30 dark:bg-gray-600/30 rounded-full flex items-center justify-center mb-3 mx-auto">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="h-3 bg-white/40 dark:bg-gray-600/40 rounded w-20 mx-auto"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && courses.length === 0" class="text-center py-16">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2"> {{$t("no_image_here")}}</h3>
        <p class="text-gray-500 dark:text-gray-400"> {{ $t("this_gallery_empty") }}</p>
      </div>

      <!-- End indicator -->
      <div v-if="noMoreImages && courses.length > 0" class="text-center py-8">
        <div class="flex items-center justify-center space-x-4 text-gray-400">
          <div class="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-16"></div>
          <span class="text-sm font-medium">{{ $t("gallery_end") }}</span>
          <div class="h-px bg-gradient-to-l from-transparent via-gray-300 dark:via-gray-600 to-transparent w-16"></div>
        </div>
      </div>
    </div>

    <!-- Custom Image Viewer Modal -->
    <Teleport to="body">
      <div
        v-if="showViewer"
        class="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm"
        @click="closeViewer"
        @wheel="handleZoom"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Viewer Content -->
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- Close Button -->
          <button
            @click="closeViewer"
            class="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 touch-button"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Navigation Buttons -->
          <button
            v-if="currentImageIndex > 0"
            @click.stop="previousImage"
            class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 touch-button"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            v-if="currentImageIndex < courses.length - 1"
            @click.stop="nextImage"
            class="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 touch-button"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Image Counter -->
          <div class="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-full">
            {{ currentImageIndex + 1 }} / {{ courses.length }}
          </div>

          <!-- Control Bar -->
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-black/50 rounded-full p-2">
            <button
              @click.stop="zoomOut"
              class="text-white p-2 hover:bg-white/20 rounded-full transition-colors touch-button"
              title="Kicsinyítés"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6" />
              </svg>
            </button>

            <button
              @click.stop="resetZoom"
              class="text-white p-2 hover:bg-white/20 rounded-full transition-colors touch-button"
              title="Eredeti méret"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            <button
              @click.stop="zoomIn"
              class="text-white p-2 hover:bg-white/20 rounded-full transition-colors touch-button"
              title="Nagyítás"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          </div>

          <!-- Main Image -->
          <div
            ref="imageContainer"
            class="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
            @click.stop
          >
            <img
              v-if="currentImage"
              :src="currentImage.fullsize"
              :alt="`${title} - Kép ${currentImageIndex + 1}`"
              class="max-w-none transition-transform duration-300 ease-out select-none"
              :style="{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin: 'center center'
              }"
              @load="onViewerImageLoad"
              @error="onViewerImageError"
              @dragstart.prevent
            />

            <!-- Viewer Loading -->
            <div
              v-if="viewerLoading"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p class="text-white text-lg">{{ $t("loading") }}...</p>
              </div>
            </div>

            <!-- Viewer Error -->
            <div
              v-if="viewerError"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="text-center">
                <svg class="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-white text-lg mb-4">{{ $t("error_at_loading") }}</p>
                <button
                  @click="retryViewerImage"
                  class="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  {{ $t("retry") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Databases, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';

export default defineComponent({
  name: 'SlideModules',
  props: {
    mode: { type: String, default: '' },
    caption: { type: Boolean, default: false },
    id: { type: String, required: true },
  },
  data: () => ({
    isAdmin: false,
    loadedImages: new Set<string>(),
    imageErrors: new Set<string>(),
    title: '',
    page: 0,
    limit: 10,
    isLoading: false,
    isDeleting: false,
    noMoreImages: false,
    touchStartTime: 0,
    courses: [] as Array<{ img: string; fullsize: string; id: string; img_id: string }>,
    
    // Viewer state
    showViewer: false,
    currentImageIndex: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
    viewerLoading: false,
    viewerError: false,
    
    // Touch handling
    lastTouchDistance: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    isDragging: false,
    lastTouchTime: 0,
  }),
  
  computed: {
    images(): string[] {
      return this.courses.map(course => course.img);
    },
    
    currentImage() {
      return this.courses[this.currentImageIndex] || null;
    }
  },
  
  mounted() {
    this.isAdmin = useLoadingStore().userLoggedin;
    this.loadCourses();
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('keydown', this.handleKeydown);
    
    // Touch event optimization
    document.addEventListener('touchstart', () => {}, { passive: true });
  },
  
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
  },
  
  methods: {
    async loadCourses() {
      if (this.isLoading || this.noMoreImages) return;
      this.isLoading = true;

      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);

        if (this.page === 0) {
          const { title_hu, title_en, title_rs } = await database.getDocument(
            config.website_db,
            config.gallery,
            this.id,
            [Query.select(['title_hu', 'title_en', 'title_rs'])]
          );

          const { language } = useLoadingStore();
          this.title =
            language === 'en'
              ? title_en
              : language === 'hu'
              ? title_hu
              : title_rs;
          document.title = this.title;
        }

        const { documents } = await database.listDocuments(
          config.website_db,
          config.album_images,
          [
            Query.equal('gallery', this.id),
            Query.offset(this.page * this.limit),
            Query.limit(this.limit),
          ]
        );

        if (!documents.length) {
          this.noMoreImages = true;
          return;
        }

        const newImages = await Promise.all(
          documents.map(async ({ $id, image_id }) => {
            // Low-resolution thumbnail for gallery (600px for better mobile performance)
            const thumbnail = await storage.getFilePreview(
              config.gallery_pictures_storage,
              image_id,
              600,
              0,
              'center',
              85,
              5,
              'FFFFFF',
              15,
              1,
              0,
              'FFFFFF',
              'webp'
            );

            // Higher-resolution image for viewer (1920px for better viewing experience)
            const fullsize = await storage.getFilePreview(
              config.gallery_pictures_storage,
              image_id,
              1920,
              0,
              'center',
              95,
              5,
              'FFFFFF',
              15,
              1,
              0,
              'FFFFFF',
              'webp'
            );

            return { img: thumbnail, fullsize, id: $id, img_id: image_id };
          })
        );

        this.courses.push(...newImages);
        this.page++;
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        this.isLoading = false;
      }
    },

    handleScroll() {
      if (this.isLoading || this.noMoreImages) return;

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300;

      if (nearBottom) {
        this.loadCourses();
      }
    },

    onImageLoad(src: string) {
      this.loadedImages.add(src);
      this.imageErrors.delete(src);
    },

    onImageError(src: string) {
      this.imageErrors.add(src);
      console.warn(`Image load error: ${src}`);
    },

    onTouchStart() {
      this.touchStartTime = Date.now();
    },

    onTouchEnd() {
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration < 300) {
        // Quick tap detected
      }
    },

    async retryImage(src: string, index: number) {
      this.imageErrors.delete(src);
      this.loadedImages.delete(src);
      
      const img = new Image();
      img.onload = () => this.onImageLoad(src);
      img.onerror = () => this.onImageError(src);
      img.src = src + '?retry=' + Date.now();
    },

    async deleteBrokenImages() {
      const brokenImages = this.images.filter((img) => !this.loadedImages.has(img) || this.imageErrors.has(img));
      
      if (!brokenImages.length) {
        console.log('No broken images found');
        return;
      }

      this.isDeleting = true;

      try {
        const storage = new Storage(appw);
        const database = new Databases(appw);

        await Promise.all(
          brokenImages.map(async (brokenImage) => {
            const course = this.courses.find(({ img }) => img === brokenImage);
            if (!course?.id || !course.img_id) return;

            await Promise.all([
              database.deleteDocument(config.website_db, config.album_images, course.id),
              storage.deleteFile(config.gallery_pictures_storage, course.img_id),
            ]);

            this.courses = this.courses.filter(({ id }) => id !== course.id);
            this.loadedImages.delete(brokenImage);
            this.imageErrors.delete(brokenImage);
          })
        );

        console.log(`Deleted ${brokenImages.length} broken images`);
      } catch (error) {
        console.error('Failed to delete broken images:', error);
      } finally {
        this.isDeleting = false;
      }
    },

    editMode() {
      this.$router.push(`/admin/gallery-edit/${this.id}`);
    },

    // ===== VIEWER METHODS =====
    
    openImage(index: number) {
      this.currentImageIndex = index;
      this.showViewer = true;
      this.resetZoom();
      this.viewerLoading = true;
      this.viewerError = false;
      document.body.style.overflow = 'hidden';
    },

    closeViewer() {
      this.showViewer = false;
      this.resetZoom();
      document.body.style.overflow = '';
    },

    nextImage() {
      if (this.currentImageIndex < this.courses.length - 1) {
        this.currentImageIndex++;
        this.resetZoom();
        this.viewerLoading = true;
        this.viewerError = false;
      }
    },

    previousImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
        this.resetZoom();
        this.viewerLoading = true;
        this.viewerError = false;
      }
    },

    zoomIn() {
      this.scale = Math.min(this.scale * 1.5, 5);
    },

    zoomOut() {
      this.scale = Math.max(this.scale / 1.5, 0.1);
      this.constrainPosition();
    },

    resetZoom() {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
    },

    constrainPosition() {
      if (!this.$refs.imageContainer) return;
      
      const container = this.$refs.imageContainer as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      
      const maxTranslateX = Math.max(0, (containerRect.width * this.scale - containerRect.width) / 2);
      const maxTranslateY = Math.max(0, (containerRect.height * this.scale - containerRect.height) / 2);
      
      this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX));
      this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY));
    },

    handleKeydown(e: KeyboardEvent) {
      if (!this.showViewer) return;
      
      switch (e.key) {
        case 'Escape':
          this.closeViewer();
          break;
        case 'ArrowLeft':
          this.previousImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoomIn();
          break;
        case '-':
          e.preventDefault();
          this.zoomOut();
          break;
        case '0':
          e.preventDefault();
          this.resetZoom();
          break;
      }
    },

    handleZoom(e: WheelEvent) {
      if (!this.showViewer) return;
      e.preventDefault();
      
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    },

    // Touch handling for mobile
    handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
        this.lastTouchTime = Date.now();
      } else if (e.touches.length === 2) {
        // Pinch to zoom
        this.isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    },

    handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      
      if (e.touches.length === 1 && this.isDragging) {
        // Single finger drag
        const deltaX = e.touches[0].clientX - this.lastTouchX;
        const deltaY = e.touches[0].clientY - this.lastTouchY;
        
        this.translateX += deltaX;
        this.translateY += deltaY;
        
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
        
        this.constrainPosition();
      } else if (e.touches.length === 2) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (this.lastTouchDistance > 0) {
          const scaleChange = currentDistance / this.lastTouchDistance;
          this.scale = Math.max(0.1, Math.min(5, this.scale * scaleChange));
        }
        
        this.lastTouchDistance = currentDistance;
        this.constrainPosition();
      }
    },

    handleTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
        // Check for double tap
        const touchDuration = Date.now() - this.lastTouchTime;
        if (touchDuration < 300 && !this.isDragging) {
          // Double tap to zoom
          if (this.scale > 1) {
            this.resetZoom();
          } else {
            this.scale = 2;
            this.constrainPosition();
          }
        }
        
        this.isDragging = false;
        this.lastTouchDistance = 0;
      }
    },

    onViewerImageLoad() {
      this.viewerLoading = false;
      this.viewerError = false;
    },

    onViewerImageError() {
      this.viewerLoading = false;
      this.viewerError = true;
    },

    retryViewerImage() {
      if (this.currentImage) {
        this.viewerLoading = true;
        this.viewerError = false;
        // Force image reload with cache busting
        const img = new Image();
        img.onload = () => this.onViewerImageLoad();
        img.onerror = () => this.onViewerImageError();
        img.src = this.currentImage.fullsize + '?retry=' + Date.now();
      }
    },
  },
});
</script>

<style scoped>
/* Touch-optimized gallery styles */
.gallery-item {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.gallery-item:hover {
  z-index: 10;
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Touch feedback */
.gallery-item:active {
  transform: translateY(-4px) scale(1.01);
  transition-duration: 0.1s;
}

/* Touch target optimization */
.touch-target {
  min-height: 280px;
  position: relative;
}

.touch-button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.touch-counter {
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Improved mobile responsiveness */
@media (max-width: 640px) {
  .gallery-item {
    transform: none;
    transition: box-shadow 0.2s ease;
  }
  
  .gallery-item:hover {
    transform: none;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }
  
  .gallery-item:active {
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
  }
  
  .touch-target {
    height: 250px;
  }
}

/* Disable transitions for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .gallery-item,
  .gallery-item:hover,
  .gallery-item:active {
    transition: none;
    transform: none;
  }
}

/* Improved glass effect */
.gallery-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.gallery-item:hover::before {
  opacity: 1;
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* Loading animation improvements */
@keyframes pulse-smooth {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse-smooth 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Better focus states for accessibility */
.gallery-item:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.touch-button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Viewer specific styles */
.cursor-move {
  cursor: move;
}

/* Prevent text selection in viewer */
.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Backdrop blur support check */
@supports (backdrop-filter: blur(10px)) {
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }
}

/* Touch device specific improvements */
@media (hover: none) and (pointer: coarse) {
  .gallery-item:hover {
    transform: none;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }
  
  /* Larger touch targets on mobile */
  .touch-button {
    min-width: 48px;
    min-height: 48px;
  }
}

/* High DPI displays */
@media (min-resolution: 2dppx) {
  .gallery-item img {
    image-rendering: crisp-edges;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .gallery-item::before {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  }
}

/* Animation performance optimization */
.gallery-item,
.gallery-item img {
  will-change: transform;
  transform: translateZ(0);
}

/* Remove will-change after animation */
.gallery-item:not(:hover) {
  will-change: auto;
}
</style>