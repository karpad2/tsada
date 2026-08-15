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
          :key="course.id"
          class="album-item group relative cursor-pointer"
          @click="openImage(index)"
        >
          <figure class="relative overflow-hidden touch-target h-full">
            <ProgressiveImage
              :key="`${course.id}-${course.retry}`"
              :image-id="course.img_id"
              layer="thumb"
              :eager="index < 4"
              :alt="course.caption || `${title} - Kép ${index + 1}`"
              img-class="album-thumb transition-transform duration-500 group-hover:scale-110 group-active:scale-105"
              @ready="onImageLoad(course)"
              @error="onImageError(course)"
            />

            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>
            <figcaption
              v-if="course.caption"
              class="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-xs text-white bg-slate-900/70 line-clamp-2"
            >
              {{ course.caption }}
            </figcaption>

            <!-- Hover/Touch icon -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300 pointer-events-none">
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
              v-if="!course.loaded && !course.error"
              class="absolute inset-0 album-loading flex items-center justify-center pointer-events-none"
            >
              <div class="text-center">
                <div class="page-spinner mx-auto mb-3"></div>
                <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t("loading") }}...</p>
              </div>
            </div>

            <!-- Error state -->
            <div
              v-if="course.error"
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
                  @click.stop="retryImage(course)"
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
        @click.self="closeViewer"
        @wheel="handleZoom"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="relative w-full h-full flex items-center justify-center" @click.self="closeViewer">
          <!-- Close Button -->
          <button
            type="button"
            class="lightbox-ctrl lightbox-hit absolute top-4 right-4 z-50"
            aria-label="Bezárás"
            @click.stop="closeViewer"
            @mousedown.stop
            @touchstart.stop
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Navigation -->
          <button
            v-if="currentImageIndex > 0"
            type="button"
            class="lightbox-ctrl lightbox-hit absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50"
            aria-label="Előző kép"
            @click.stop="previousImage"
            @mousedown.stop
            @touchstart.stop
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            v-if="currentImageIndex < courses.length - 1"
            type="button"
            class="lightbox-ctrl lightbox-hit absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50"
            aria-label="Következő kép"
            @click.stop="nextImage"
            @mousedown.stop
            @touchstart.stop
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Counter -->
          <div class="lightbox-pill absolute top-4 left-4 z-50 pointer-events-none">
            {{ currentImageIndex + 1 }} / {{ courses.length }}
          </div>
          <div
            v-if="currentImage?.caption"
            class="lightbox-pill absolute bottom-16 left-1/2 -translate-x-1/2 z-50 max-w-[80%] text-center pointer-events-none"
          >
            {{ currentImage.caption }}
          </div>

          <!-- Control Bar -->
          <div class="lightbox-toolbar absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1" @click.stop @mousedown.stop @touchstart.stop>
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

          <!-- Main Image: wrapper must not steal clicks from the nav buttons -->
          <div
            ref="imageContainer"
            class="relative z-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none"
            :class="viewerCursor"
            @click.self="onLightboxStageClick"
          >
            <img
              v-if="currentImage"
              :key="currentImage.id"
              ref="viewerImage"
              :src="viewerSrc"
              :alt="currentImage.caption || `${title} - Kép ${currentImageIndex + 1}`"
              class="pointer-events-auto max-w-[86vw] max-h-[86vh] object-contain select-none drop-shadow-2xl"
              :class="isMouseDown || scale !== 1 ? '' : 'transition-transform duration-200 ease-out'"
              :style="{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin: 'center center'
              }"
              @load="onViewerImageLoad"
              @error="onViewerImageError"
              @click.stop="onLightboxImageClick"
              @mousedown.prevent="onViewerMouseDown"
              @dragstart.prevent
            />

            <div
              v-if="viewerLoading && !viewerSrc"
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
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
                  @click.stop="retryViewerImage"
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
import { defineComponent, nextTick } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config, storage } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';
import { pickLocalized } from '@/utils/localizedText';
import { setDocumentTitle } from '@/composables/useSEO';
import { captionText, loadCaptions, type ImageCaption } from '@/services/gallery/captions';
import ProgressiveImage from '@/components/ProgressiveImage.vue';
import { galleryLayers } from '@/services/gallery/imageUrl';
import { prefetchImage, prefetchImages } from '@/services/gallery/loadQueue';

const database = new Databases(appw);

interface AlbumImage {
  img: string;
  tiny: string;
  medium: string;
  fullsize: string;
  id: string;
  img_id: string;
  caption: string;
  loaded: boolean;
  error: boolean;
  usedFallback: boolean;
  retry: number;
}

export default defineComponent({
  name: 'AlbumViewer',
  components: { ProgressiveImage },
  props: {
    mode: { type: String, default: '' },
    caption: { type: Boolean, default: false },
    id: { type: String, required: true },
  },
  data: () => ({
    isAdmin: false,
    title: '',
    page: 0,
    limit: 12,
    isLoading: false,
    isDeleting: false,
    noMoreImages: false,
    courses: [] as AlbumImage[],
    captions: {} as Record<string, ImageCaption>,
    captionsLoaded: false,

    // Viewer state
    showViewer: false,
    currentImageIndex: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
    viewerLoading: false,
    viewerError: false,
    viewerSrc: '',
    viewerLayer: 'thumb' as 'tiny' | 'thumb' | 'medium' | 'full',
    viewerGen: 0,

    // Touch handling
    lastTouchDistance: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    isDragging: false,
    lastTapTime: 0,
    touchStartX: 0,
    touchStartY: 0,
    didSwipe: false,
    isMouseDown: false,
    didMouseDrag: false,
    mouseStartX: 0,
    mouseStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
  }),

  computed: {
    images(): string[] {
      return this.courses.map(course => course.img);
    },

    currentImage(): AlbumImage | null {
      return this.courses[this.currentImageIndex] || null;
    },

    viewerCursor(): string {
      if (this.isMouseDown && (this.scale > 1 || this.didMouseDrag)) return 'cursor-grabbing';
      if (this.scale > 1) return 'cursor-grab';
      return 'cursor-pointer';
    }
  },

  watch: {
    id: {
      handler(newId, oldId) {
        if (!newId || newId === oldId) return;
        this.resetAlbum();
        this.loadCourses();
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
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
    this.unbindMouseDrag();
    document.body.style.overflow = '';
  },

  methods: {
    resetAlbum() {
      this.courses = [];
      this.page = 0;
      this.noMoreImages = false;
      this.isLoading = false;
      this.closeViewer();
    },

    async ensureCaptions() {
      if (this.captionsLoaded) return;
      try {
        this.captions = await loadCaptions();
      } catch {
        this.captions = {};
      } finally {
        this.captionsLoaded = true;
      }
    },

    async loadCourses() {
      if (this.isLoading || this.noMoreImages || !this.id) return;
      this.isLoading = true;

      try {
        if (this.page === 0) {
          const album = await database.getDocument(
            config.website_db,
            config.gallery,
            this.id,
            [Query.select(['title_hu', 'title_en', 'title_rs', 'visible'])]
          );

          if (!this.isAdmin && !album.visible) {
            this.noMoreImages = true;
            this.title = '';
            return;
          }

          const { language } = useLoadingStore();
          this.title = pickLocalized(album, ['title'], language);
          if (this.title) setDocumentTitle(this.title);
          await this.ensureCaptions();
        }

        const queries = [
          Query.equal('gallery', this.id),
          Query.offset(this.page * this.limit),
          Query.limit(this.limit),
        ];
        if (!this.isAdmin) {
          queries.push(Query.equal('status', 'approved'));
        }

        let documents: any[] = [];
        try {
          const result = await database.listDocuments(
            config.website_db,
            config.album_images,
            queries
          );
          documents = result.documents;
        } catch (queryError) {
          if (this.isAdmin) throw queryError;
          const fallback = await database.listDocuments(
            config.website_db,
            config.album_images,
            [
              Query.equal('gallery', this.id),
              Query.offset(this.page * this.limit),
              Query.limit(this.limit),
            ]
          );
          documents = fallback.documents.filter((doc: any) => !doc.status || doc.status === 'approved');
        }

        if (!documents.length) {
          this.noMoreImages = true;
          return;
        }

        const lang = useLoadingStore().language;
        const newImages: AlbumImage[] = [];
        for (const doc of documents) {
          const imageId = typeof doc.image_id === 'string' ? doc.image_id : '';
          if (!imageId) continue;
          const layers = galleryLayers(imageId);
          newImages.push({
            img: layers.thumb,
            tiny: layers.tiny,
            medium: layers.medium,
            fullsize: layers.full,
            id: doc.$id,
            img_id: imageId,
            caption: captionText(this.captions[doc.$id], lang),
            loaded: false,
            error: false,
            usedFallback: false,
            retry: 0,
          });
        }

        this.courses.push(...newImages);
        this.page++;
        if (documents.length < this.limit) this.noMoreImages = true;
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        this.isLoading = false;
      }
    },

    handleScroll() {
      if (this.isLoading || this.noMoreImages || this.showViewer) return;

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300;

      if (nearBottom) {
        this.loadCourses();
      }
    },

    onImageLoad(course: AlbumImage) {
      course.loaded = true;
      course.error = false;
    },

    onImageError(course: AlbumImage) {
      course.loaded = false;
      course.error = true;
    },

    retryImage(course: AlbumImage) {
      course.error = false;
      course.loaded = false;
      course.usedFallback = false;
      course.retry += 1;
    },

    async deleteBrokenImages() {
      const broken = this.courses.filter((course) => course.error || !course.loaded);
      if (!broken.length) return;

      this.isDeleting = true;
      try {
        await Promise.all(
          broken.map(async (course) => {
            if (!course.id || !course.img_id) return;
            await Promise.all([
              database.deleteDocument(config.website_db, config.album_images, course.id),
              storage.deleteFile(config.gallery_pictures_storage, course.img_id).catch(() => undefined),
            ]);
            this.courses = this.courses.filter(({ id }) => id !== course.id);
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
      this.viewerError = false;
      this.viewerGen += 1;
      const image = this.courses[index];
      const start = image?.img || image?.tiny || image?.medium || '';
      this.viewerSrc = start;
      this.viewerLayer = image?.img ? 'thumb' : image?.tiny ? 'tiny' : 'medium';
      this.viewerLoading = !start;
      void nextTick(() => this.syncViewerFromCache());
      if (image) {
        this.upgradeViewer(image, this.viewerGen);
        this.prefetchNeighbors(index);
      }
    },

    openImage(index: number) {
      this.showImage(index);
      this.showViewer = true;
      document.body.style.overflow = 'hidden';
    },

    async upgradeViewer(image: AlbumImage, gen: number) {
      if (this.viewerLayer !== 'medium' && this.viewerLayer !== 'full') {
        const mediumOk = await prefetchImage(image.medium);
        if (gen !== this.viewerGen || !this.showViewer) return;
        if (mediumOk) {
          this.viewerSrc = image.medium;
          this.viewerLayer = 'medium';
          this.viewerLoading = false;
          this.viewerError = false;
        }
      }
      if (this.scale > 1.15) this.ensureFullLayer();
    },

    prefetchNeighbors(index: number) {
      const around = [this.courses[index - 1], this.courses[index + 1]];
      prefetchImages(around.flatMap((image) => (image ? [image.img, image.medium] : [])));
    },

    ensureFullLayer() {
      const image = this.currentImage;
      if (!image || this.viewerLayer === 'full' || this.scale <= 1.15) return;
      const gen = this.viewerGen;
      void prefetchImage(image.fullsize).then((ok) => {
        if (!ok || gen !== this.viewerGen || !this.showViewer) return;
        this.viewerSrc = image.fullsize;
        this.viewerLayer = 'full';
      });
    },

    closeViewer() {
      this.unbindMouseDrag();
      this.showViewer = false;
      this.viewerSrc = '';
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
      this.scale = Math.min(this.scale * 1.35, 5);
      this.ensureFullLayer();
    },

    zoomOut() {
      this.scale = Math.max(this.scale / 1.35, 1);
      if (this.scale === 1) {
        this.translateX = 0;
        this.translateY = 0;
      } else {
        this.constrainPosition();
      }
    },

    resetZoom() {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
    },

    constrainPosition() {
      const container = this.$refs.imageContainer as HTMLElement | undefined;
      const img = this.$refs.viewerImage as HTMLImageElement | undefined;
      if (!container) return;

      const box = container.getBoundingClientRect();
      let extraX = Math.max(0, (box.width * this.scale - box.width) / 2);
      let extraY = Math.max(0, (box.height * this.scale - box.height) / 2);

      if (img?.naturalWidth && img.naturalHeight) {
        const fit = Math.min((box.width * 0.86) / img.naturalWidth, (box.height * 0.86) / img.naturalHeight, 1);
        extraX = Math.max(0, (img.naturalWidth * fit * this.scale - box.width) / 2);
        extraY = Math.max(0, (img.naturalHeight * fit * this.scale - box.height) / 2);
      }

      this.translateX = Math.max(-extraX, Math.min(extraX, this.translateX));
      this.translateY = Math.max(-extraY, Math.min(extraY, this.translateY));
    },

    bindMouseDrag() {
      window.addEventListener('mousemove', this.onViewerMouseMove);
      window.addEventListener('mouseup', this.onViewerMouseUp);
    },

    unbindMouseDrag() {
      window.removeEventListener('mousemove', this.onViewerMouseMove);
      window.removeEventListener('mouseup', this.onViewerMouseUp);
      this.isMouseDown = false;
    },

    onViewerMouseDown(e: MouseEvent) {
      if (!this.showViewer || e.button !== 0) return;
      this.mouseStartX = e.clientX;
      this.mouseStartY = e.clientY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.isMouseDown = true;
      this.didMouseDrag = false;
      this.bindMouseDrag();
    },

    onViewerMouseMove(e: MouseEvent) {
      if (!this.showViewer || !this.isMouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      const moved = Math.hypot(e.clientX - this.mouseStartX, e.clientY - this.mouseStartY);
      if (moved > 6) this.didMouseDrag = true;

      if (this.scale > 1 && this.didMouseDrag) {
        this.translateX += dx;
        this.translateY += dy;
        this.constrainPosition();
      }

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    },

    onViewerMouseUp(e: MouseEvent) {
      if (!this.isMouseDown) return;
      this.unbindMouseDrag();
      if (!this.didMouseDrag || this.scale !== 1) return;

      const dx = e.clientX - this.mouseStartX;
      const dy = e.clientY - this.mouseStartY;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        if (dx < 0) this.nextImage();
        else this.previousImage();
      }
    },

    handleKeydown(e: KeyboardEvent) {
      if (!this.showViewer) return;

      switch (e.key) {
        case 'Escape':
          this.closeViewer();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
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
      this.ensureFullLayer();
    },

    onLightboxStageClick() {
      if (this.scale > 1) {
        this.resetZoom();
        return;
      }
      this.closeViewer();
    },

    onLightboxImageClick(e: MouseEvent) {
      if (this.didMouseDrag) {
        this.didMouseDrag = false;
        return;
      }
      if (this.scale > 1) {
        this.resetZoom();
        return;
      }
      const el = e.currentTarget as HTMLElement | null;
      if (!el) {
        this.nextImage();
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.4) this.previousImage();
      else this.nextImage();
    },

    isControlTarget(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest('button, .lightbox-toolbar, .lightbox-ctrl'));
    },

    handleTouchStart(e: TouchEvent) {
      if (!this.showViewer || this.isControlTarget(e.target)) return;

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        this.didSwipe = true;
      } else if (e.touches.length === 1) {
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = true;
        this.didSwipe = false;
      }
    },

    handleTouchMove(e: TouchEvent) {
      if (!this.showViewer || this.isControlTarget(e.target)) return;
      if (e.touches.length === 2 || this.scale > 1) e.preventDefault();

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (this.lastTouchDistance > 0) {
          const scaleChange = distance / this.lastTouchDistance;
          this.scale = Math.max(1, Math.min(5, this.scale * scaleChange));
          this.ensureFullLayer();
        }
        this.lastTouchDistance = distance;
        this.didSwipe = true;
      } else if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - this.lastTouchX;
        const deltaY = e.touches[0].clientY - this.lastTouchY;

        if (this.scale > 1) {
          this.translateX += deltaX;
          this.translateY += deltaY;
          this.constrainPosition();
          this.didSwipe = true;
        } else if (Math.abs(e.touches[0].clientX - this.touchStartX) > 12) {
          this.didSwipe = true;
        }

        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
      }
    },

    handleTouchEnd(e: TouchEvent) {
      if (!this.showViewer || this.isControlTarget(e.target)) return;

      if (e.touches.length === 0) {
        const dx = this.lastTouchX - this.touchStartX;
        const dy = this.lastTouchY - this.touchStartY;
        this.isDragging = false;
        this.lastTouchDistance = 0;

        if (this.scale === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) this.nextImage();
          else this.previousImage();
          return;
        }

        const now = Date.now();
        if (!this.didSwipe && now - this.lastTapTime < 280) {
          if (this.scale === 1) this.zoomIn();
          else this.resetZoom();
          this.lastTapTime = 0;
          return;
        }
        this.lastTapTime = now;
      }
    },

    syncViewerFromCache() {
      const el = this.$refs.viewerImage as HTMLImageElement | undefined;
      if (el?.complete && el.naturalWidth > 0) {
        this.onViewerImageLoad();
      }
    },

    onViewerImageLoad() {
      this.viewerLoading = false;
      this.viewerError = false;
    },

    onViewerImageError() {
      const image = this.currentImage;
      if (image && this.viewerSrc === image.fullsize && image.medium) {
        this.viewerSrc = image.medium;
        this.viewerLayer = 'medium';
        return;
      }
      if (image && this.viewerSrc !== image.img && image.img) {
        this.viewerSrc = image.img;
        this.viewerLayer = 'thumb';
        return;
      }
      if (image?.tiny && this.viewerSrc !== image.tiny) {
        this.viewerSrc = image.tiny;
        this.viewerLayer = 'tiny';
        return;
      }
      this.viewerLoading = false;
      this.viewerError = true;
    },

    retryViewerImage() {
      const image = this.currentImage;
      if (!image) return;
      this.viewerError = false;
      this.viewerSrc = image.img || image.tiny;
      this.viewerLayer = 'thumb';
      this.viewerLoading = !this.viewerSrc;
      this.upgradeViewer(image, this.viewerGen);
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
  touch-action: none;
}

.lightbox-ctrl {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  pointer-events: auto;
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

.lightbox-hit::before {
  content: '';
  position: absolute;
  inset: -18px;
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

.album-lightbox img {
  -webkit-user-drag: none;
  user-select: none;
}
</style>
