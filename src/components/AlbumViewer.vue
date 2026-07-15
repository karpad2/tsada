<template>
  <section
    ref="scrollContainer"
    class="album-viewer page-shell text-gray-600 dark:text-gray-300 body-font overflow-x-hidden"
    :class="{ 'p-2 sm:p-4': caption, 'p-0': !caption }"
    id="courses"
  >
    <div :class="caption ? 'page-panel container !min-h-0' : 'px-1'">
      <!-- Header Section -->
      <div v-if="caption" class="page-header-row">
        <div>
          <h1 class="section-title !text-2xl sm:!text-3xl">
            {{ title }}
          </h1>
          <div class="section-accent !w-20"></div>
          <p v-if="images.length > 0" class="page-subtitle !mt-1">
            {{ images.length }} {{ $t("image") }}
          </p>
        </div>

        <!-- Admin Controls -->
        <div v-if="isAdmin" class="flex flex-wrap gap-2">
          <button
            type="button"
            class="glass-btn px-4 py-2 text-white text-sm font-medium rounded-full"
            @click="editMode"
          >
            {{ $t('edit_gallery') }}
          </button>
          <button
            type="button"
            class="btn-ghost-glass text-sm"
            :disabled="isDeleting"
            @click="deleteBrokenImages"
          >
            <span v-if="isDeleting" class="inline-flex mr-1">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ isDeleting ? $t('deleting') : $t('delete_broken_images') }}
          </button>
        </div>
      </div>

      <!-- Admin Controls when no caption header -->
      <div v-if="isAdmin && !caption" class="mb-4 flex flex-wrap gap-2">
        <button type="button" class="glass-btn px-4 py-2 text-white text-sm font-medium rounded-full" @click="editMode">
          {{ $t('edit_gallery') }}
        </button>
        <button type="button" class="btn-ghost-glass text-sm" :disabled="isDeleting" @click="deleteBrokenImages">
          {{ isDeleting ? $t('deleting') : $t('delete_broken_images') }}
        </button>
      </div>

      <!-- Image Gallery -->
      <div class="album-grid">
        <div
          v-for="(course, index) in courses"
          :key="course.img"
          class="album-item group relative cursor-pointer"
          @click="openImage(index)"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <figure class="relative overflow-hidden touch-target h-full">
            <img
              :src="course.img"
              class="album-thumb w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-active:scale-105"
              loading="lazy"
              :alt="`${title} - Kép ${index + 1}`"
              @load="onImageLoad(course.img)"
              @error="onImageError(course.img)"
              draggable="false"
            />

            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>

            <!-- Hover/Touch icon -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300">
              <div class="album-zoom-btn">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Image counter badge -->
            <div class="album-badge absolute top-3 left-3">
              {{ index + 1 }}
            </div>

            <!-- Loading overlay -->
            <div
              v-if="!loadedImages.has(course.img) && !imageErrors.has(course.img)"
              class="absolute inset-0 album-loading flex items-center justify-center"
            >
              <div class="text-center">
                <div class="page-spinner mx-auto mb-3"></div>
                <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t("loading") }}...</p>
              </div>
            </div>

            <!-- Error state -->
            <div
              v-if="imageErrors.has(course.img)"
              class="absolute inset-0 bg-red-50/90 dark:bg-red-950/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div class="text-center p-4">
                <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-red-600 dark:text-red-300 text-sm font-medium mb-2">{{ $t("error_at_loading") }}</p>
                <button
                  type="button"
                  class="px-3 py-1.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors"
                  @click.stop="retryImage(course.img, index)"
                >
                  {{ $t("retry") || 'Újrapróbálás' }}
                </button>
              </div>
            </div>
          </figure>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="isLoading" class="album-grid mt-4">
        <div
          v-for="n in limit"
          :key="`skeleton-${n}`"
          class="album-skeleton animate-pulse"
        >
          <div class="w-12 h-12 rounded-full bg-sky-200/50 dark:bg-slate-600/50 mx-auto mb-2"></div>
          <div class="h-2 w-16 mx-auto rounded bg-sky-200/40 dark:bg-slate-600/40"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && courses.length === 0" class="page-state">
        <div class="empty-icon mx-auto mb-4">
          <svg class="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="page-state-title">{{ $t("no_image_here") }}</h3>
        <p class="page-state-text">{{ $t("this_gallery_empty") }}</p>
      </div>

      <!-- End indicator -->
      <div v-if="noMoreImages && courses.length > 0" class="text-center py-8">
        <div class="flex items-center justify-center space-x-4 text-gray-400 dark:text-gray-500">
          <div class="h-px bg-gradient-to-r from-transparent via-sky-300/50 dark:via-sky-600/40 to-transparent w-16"></div>
          <span class="text-sm font-medium">{{ $t("gallery_end") }}</span>
          <div class="h-px bg-gradient-to-l from-transparent via-sky-300/50 dark:via-sky-600/40 to-transparent w-16"></div>
        </div>
      </div>
    </div>

    <!-- Custom Image Viewer Modal -->
    <Teleport to="body">
      <div
        v-if="showViewer"
        class="album-lightbox fixed inset-0 z-[9999]"
        @click="closeViewer"
        @wheel="handleZoom"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- Close Button -->
          <button
            type="button"
            class="lightbox-ctrl absolute top-4 right-4 z-10"
            @click="closeViewer"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Navigation -->
          <button
            v-if="currentImageIndex > 0"
            type="button"
            class="lightbox-ctrl absolute left-4 top-1/2 -translate-y-1/2 z-10"
            @click.stop="previousImage"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            v-if="currentImageIndex < courses.length - 1"
            type="button"
            class="lightbox-ctrl absolute right-4 top-1/2 -translate-y-1/2 z-10"
            @click.stop="nextImage"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Counter -->
          <div class="lightbox-pill absolute top-4 left-4 z-10">
            {{ currentImageIndex + 1 }} / {{ courses.length }}
          </div>

          <!-- Control Bar -->
          <div class="lightbox-toolbar absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1">
            <button type="button" class="lightbox-tool-btn" title="Kicsinyítés" @click.stop="zoomOut">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6" />
              </svg>
            </button>
            <button type="button" class="lightbox-tool-btn" title="Eredeti méret" @click.stop="resetZoom">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button type="button" class="lightbox-tool-btn" title="Nagyítás" @click.stop="zoomIn">
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
              class="max-w-full max-h-full object-contain transition-transform duration-300 ease-out select-none drop-shadow-2xl"
              :style="{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin: 'center center'
              }"
              @load="onViewerImageLoad"
              @error="onViewerImageError"
              @dragstart.prevent
            />

            <div v-if="viewerLoading" class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="page-spinner mx-auto mb-4 !border-white/30 !border-t-white"></div>
                <p class="text-white text-lg">{{ $t("loading") }}...</p>
              </div>
            </div>

            <div v-if="viewerError" class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <p class="text-white text-lg mb-4">{{ $t("error_at_loading") }}</p>
                <button
                  type="button"
                  class="px-4 py-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
                  @click="retryViewerImage"
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

const database = new Databases(appw);
const storage = new Storage(appw);

export default defineComponent({
  name: 'AlbumViewer',
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

  watch: {
    id: {
      immediate: false,
      handler(newId) {
        if (newId && this.courses.length === 0) {
          this.loadCourses();
        }
      }
    }
  },

  mounted() {
    const loadingStore = useLoadingStore();
    const role = loadingStore.userRole;
    this.isAdmin = loadingStore.userLoggedin && (role === 'admin' || role === 'editor' || role === 'photographer');
    this.loadCourses();
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('touchstart', () => {}, { passive: true });
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    async loadCourses() {
      if (this.isLoading || this.noMoreImages || !this.id) return;
      this.isLoading = true;

      try {
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

        const queries = [
          Query.equal('gallery', this.id),
          Query.offset(this.page * this.limit),
          Query.limit(this.limit),
        ];
        if (!this.isAdmin) {
          queries.push(Query.equal('status', 'approved'));
        }
        const { documents } = await database.listDocuments(
          config.website_db,
          config.album_images,
          queries
        );

        if (!documents.length) {
          this.noMoreImages = true;
          return;
        }

        const newImages = await Promise.all(
          documents.map(async ({ $id, image_id }) => {
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
      // reserved for tap detection
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
        return;
      }

      this.isDeleting = true;

      try {
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
      } catch (error) {
        console.error('Failed to delete broken images:', error);
      } finally {
        this.isDeleting = false;
      }
    },

    editMode() {
      this.$router.push(`/admin/gallery-edit/${this.id}`);
    },

    showImage(index: number) {
      this.currentImageIndex = index;
      this.resetZoom();
      this.viewerLoading = true;
      this.viewerError = false;
    },

    openImage(index: number) {
      this.showImage(index);
      this.showViewer = true;
      document.body.style.overflow = 'hidden';
    },

    closeViewer() {
      this.showViewer = false;
      this.resetZoom();
      document.body.style.overflow = '';
    },

    nextImage() {
      if (this.currentImageIndex < this.courses.length - 1) {
        this.showImage(this.currentImageIndex + 1);
      }
    },

    previousImage() {
      if (this.currentImageIndex > 0) {
        this.showImage(this.currentImageIndex - 1);
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
      this.scale = 0.8;
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

    handleTouchStart(e: TouchEvent) {
      if (!this.showViewer) return;

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      } else if (e.touches.length === 1) {
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
        this.isDragging = true;
        this.lastTouchTime = Date.now();
      }
    },

    handleTouchMove(e: TouchEvent) {
      if (!this.showViewer) return;
      e.preventDefault();

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (this.lastTouchDistance > 0) {
          const scaleChange = distance / this.lastTouchDistance;
          this.scale = Math.max(0.1, Math.min(5, this.scale * scaleChange));
        }
        this.lastTouchDistance = distance;
      } else if (e.touches.length === 1 && this.isDragging && this.scale > 1) {
        const deltaX = e.touches[0].clientX - this.lastTouchX;
        const deltaY = e.touches[0].clientY - this.lastTouchY;

        this.translateX += deltaX;
        this.translateY += deltaY;
        this.constrainPosition();

        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
      }
    },

    handleTouchEnd(e: TouchEvent) {
      if (!this.showViewer) return;

      if (e.touches.length === 0) {
        this.isDragging = false;
        this.lastTouchDistance = 0;

        // Double-tap detection
        const now = Date.now();
        if (now - this.lastTouchTime < 300 && e.changedTouches.length === 1) {
          // could toggle zoom - kept simple
        }
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
      this.viewerLoading = true;
      this.viewerError = false;
      if (this.currentImage) {
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
.album-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .album-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
  .album-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .album-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (min-width: 1280px) {
  .album-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}

.album-item {
  height: 260px;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(14, 165, 233, 0.18);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 18px rgba(14, 165, 233, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.dark .album-item {
  background: rgba(30, 41, 59, 0.55);
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
}

.album-item:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 189, 248, 0.45);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.18);
}

.album-thumb {
  min-height: 260px;
}

.album-badge {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.album-zoom-btn {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
  transform: scale(0.9);
  transition: transform 0.25s ease;
}

.group:hover .album-zoom-btn {
  transform: scale(1);
}

.album-loading {
  background: linear-gradient(135deg, rgba(224, 242, 254, 0.9), rgba(241, 245, 249, 0.9));
}

.dark .album-loading {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9));
}

.album-skeleton {
  height: 260px;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.12);
}

.dark .album-skeleton {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(148, 163, 184, 0.14);
}

.empty-icon {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.12);
  border: 1px solid rgba(14, 165, 233, 0.2);
}

/* Lightbox */
.album-lightbox {
  background: rgba(2, 6, 23, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.lightbox-ctrl {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  transition: background 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}

.lightbox-ctrl:hover {
  background: rgba(14, 165, 233, 0.45);
  transform: scale(1.05);
}

.lightbox-pill {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
}

.lightbox-toolbar {
  padding: 0.35rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
}

.lightbox-tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  color: white;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.lightbox-tool-btn:hover {
  background: rgba(14, 165, 233, 0.45);
}

.touch-target {
  -webkit-tap-highlight-color: transparent;
}
</style>
