<template>
  <div class="gallery-block" :class="galleryClasses">
    <div v-if="localizedContent.title" class="gallery-title mb-6">
      <h3 class="text-2xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="gallery-description mb-6">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <!-- Grid Layout -->
    <div
      v-if="galleryLayout === 'grid'"
      class="gallery-grid"
      :class="gridClasses"
    >
      <div
        v-for="(image, index) in galleryImages"
        :key="image.id"
        class="gallery-item"
        @click="openLightbox(index)"
      >
        <img
          :src="getImageUrl(image)"
          :alt="image.alt_text || `Gallery image ${index + 1}`"
          class="gallery-image"
          loading="lazy"
        />
        <div
          v-if="showCaptions && image.caption"
          class="image-caption"
        >
          {{ image.caption }}
        </div>
      </div>
    </div>

    <!-- Carousel Layout -->
    <div
      v-else-if="galleryLayout === 'carousel'"
      class="gallery-carousel"
    >
      <div class="carousel-container" ref="carouselContainer">
        <div class="carousel-track" :style="carouselTrackStyle">
          <div
            v-for="(image, index) in galleryImages"
            :key="image.id"
            class="carousel-slide"
          >
            <img
              :src="getImageUrl(image)"
              :alt="image.alt_text || `Gallery image ${index + 1}`"
              class="carousel-image"
              @click="openLightbox(index)"
            />
            <div
              v-if="showCaptions && image.caption"
              class="carousel-caption"
            >
              {{ image.caption }}
            </div>
          </div>
        </div>
      </div>

      <!-- Carousel Controls -->
      <div class="carousel-controls">
        <button
          @click="prevSlide"
          :disabled="currentSlide === 0"
          class="carousel-btn carousel-prev"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <div class="carousel-indicators">
          <button
            v-for="(_, index) in galleryImages"
            :key="index"
            @click="goToSlide(index)"
            :class="['carousel-dot', { active: currentSlide === index }]"
          />
        </div>
        <button
          @click="nextSlide"
          :disabled="currentSlide === galleryImages.length - 1"
          class="carousel-btn carousel-next"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Masonry Layout -->
    <div
      v-else-if="galleryLayout === 'masonry'"
      class="gallery-masonry"
      ref="masonryContainer"
    >
      <div
        v-for="(image, index) in galleryImages"
        :key="image.id"
        class="masonry-item"
        @click="openLightbox(index)"
      >
        <img
          :src="getImageUrl(image)"
          :alt="image.alt_text || `Gallery image ${index + 1}`"
          class="masonry-image"
          loading="lazy"
          @load="onImageLoad"
        />
        <div
          v-if="showCaptions && image.caption"
          class="masonry-caption"
        >
          {{ image.caption }}
        </div>
      </div>
    </div>

    <!-- Slideshow Layout -->
    <div
      v-else-if="galleryLayout === 'slideshow'"
      class="gallery-slideshow"
    >
      <div class="slideshow-main">
        <img
          :src="getImageUrl(galleryImages[currentSlide])"
          :alt="galleryImages[currentSlide]?.alt_text || `Slide ${currentSlide + 1}`"
          class="slideshow-image"
          @click="openLightbox(currentSlide)"
        />
        <div
          v-if="showCaptions && galleryImages[currentSlide]?.caption"
          class="slideshow-caption"
        >
          {{ galleryImages[currentSlide].caption }}
        </div>
      </div>

      <!-- Slideshow Thumbnails -->
      <div class="slideshow-thumbnails">
        <div
          v-for="(image, index) in galleryImages"
          :key="image.id"
          @click="goToSlide(index)"
          :class="['thumbnail', { active: currentSlide === index }]"
        >
          <img
            :src="getImageUrl(image, true)"
            :alt="`Thumbnail ${index + 1}`"
            class="thumbnail-image"
          />
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div
      v-if="lightboxOpen"
      class="lightbox-overlay"
      @click="closeLightbox"
    >
      <div class="lightbox-content" @click.stop>
        <button @click="closeLightbox" class="lightbox-close">
          <i class="pi pi-times"></i>
        </button>

        <div class="lightbox-image-container">
          <img
            :src="getImageUrl(galleryImages[lightboxIndex])"
            :alt="galleryImages[lightboxIndex]?.alt_text"
            class="lightbox-image"
          />
        </div>

        <div
          v-if="galleryImages[lightboxIndex]?.caption"
          class="lightbox-caption"
        >
          {{ galleryImages[lightboxIndex].caption }}
        </div>

        <!-- Lightbox Navigation -->
        <button
          v-if="lightboxIndex > 0"
          @click="prevLightboxImage"
          class="lightbox-nav lightbox-prev"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <button
          v-if="lightboxIndex < galleryImages.length - 1"
          @click="nextLightboxImage"
          class="lightbox-nav lightbox-next"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, nextTick } from 'vue';
import { Storage } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent, GalleryComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'GalleryBlock',
  props: {
    component: {
      type: Object as () => ContentComponent,
      required: true
    },
    language: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const carouselContainer = ref<HTMLElement>();
    const masonryContainer = ref<HTMLElement>();
    const currentSlide = ref(0);
    const lightboxOpen = ref(false);
    const lightboxIndex = ref(0);

    const localizedContent = computed((): GalleryComponentContent => {
      let content: GalleryComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as GalleryComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as GalleryComponentContent;
          break;
        case 'en':
          content = props.component.content_en as GalleryComponentContent;
          break;
        default:
          content = props.component.content_rs as GalleryComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || { images: [], layout: 'grid', columns: 3, show_captions: true, lightbox: true };
    });

    const galleryImages = computed(() => {
      return localizedContent.value.images || [];
    });

    const galleryLayout = computed(() => {
      return localizedContent.value.layout || 'grid';
    });

    const galleryColumns = computed(() => {
      return localizedContent.value.columns || 3;
    });

    const showCaptions = computed(() => {
      return localizedContent.value.show_captions !== false;
    });

    const enableLightbox = computed(() => {
      return localizedContent.value.lightbox !== false;
    });

    const galleryClasses = computed(() => {
      const classes = ['gallery-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const gridClasses = computed(() => {
      const columns = galleryColumns.value;
      const classes = ['grid', 'gap-4'];

      switch (columns) {
        case 1:
          classes.push('grid-cols-1');
          break;
        case 2:
          classes.push('grid-cols-1', 'md:grid-cols-2');
          break;
        case 3:
          classes.push('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
          break;
        case 4:
          classes.push('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
          break;
        default:
          classes.push('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      }

      return classes.join(' ');
    });

    const carouselTrackStyle = computed(() => {
      return {
        transform: `translateX(-${currentSlide.value * 100}%)`
      };
    });

    // Methods
    const getImageUrl = (image: any, thumbnail: boolean = false): string => {
      if (image.url) {
        return image.url;
      }

      if (image.id) {
        const storage = new Storage(appw);
        return storage.getFilePreview(
          config.website_images,
          image.id,
          thumbnail ? 200 : 1200,
          thumbnail ? 200 : 800,
          'center',
          85
        ).href;
      }

      return 'https://via.placeholder.com/400x300?text=Image+Not+Found';
    };

    const openLightbox = (index: number) => {
      if (!enableLightbox.value) return;

      lightboxIndex.value = index;
      lightboxOpen.value = true;
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightboxOpen.value = false;
      document.body.style.overflow = '';
    };

    const nextLightboxImage = () => {
      if (lightboxIndex.value < galleryImages.value.length - 1) {
        lightboxIndex.value++;
      }
    };

    const prevLightboxImage = () => {
      if (lightboxIndex.value > 0) {
        lightboxIndex.value--;
      }
    };

    const nextSlide = () => {
      if (currentSlide.value < galleryImages.value.length - 1) {
        currentSlide.value++;
      }
    };

    const prevSlide = () => {
      if (currentSlide.value > 0) {
        currentSlide.value--;
      }
    };

    const goToSlide = (index: number) => {
      currentSlide.value = index;
    };

    const onImageLoad = async () => {
      if (galleryLayout.value === 'masonry') {
        await nextTick();
        initMasonry();
      }
    };

    const initMasonry = () => {
      // Simple masonry layout
      if (!masonryContainer.value) return;

      const items = masonryContainer.value.children;
      const columns = galleryColumns.value;
      const columnHeights = new Array(columns).fill(0);

      Array.from(items).forEach((item: any, index) => {
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
        const x = shortestColumn * (100 / columns);
        const y = columnHeights[shortestColumn];

        item.style.position = 'absolute';
        item.style.left = `${x}%`;
        item.style.top = `${y}px`;
        item.style.width = `${100 / columns}%`;

        columnHeights[shortestColumn] += item.offsetHeight + 16; // 16px gap
      });

      masonryContainer.value.style.height = `${Math.max(...columnHeights)}px`;
    };

    // Keyboard navigation for lightbox
    const handleKeydown = (event: KeyboardEvent) => {
      if (!lightboxOpen.value) return;

      switch (event.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          prevLightboxImage();
          break;
        case 'ArrowRight':
          nextLightboxImage();
          break;
      }
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown);

      if (galleryLayout.value === 'masonry') {
        nextTick(() => {
          initMasonry();
        });
      }
    });

    return {
      carouselContainer,
      masonryContainer,
      currentSlide,
      lightboxOpen,
      lightboxIndex,
      localizedContent,
      galleryImages,
      galleryLayout,
      showCaptions,
      galleryClasses,
      gridClasses,
      carouselTrackStyle,
      getImageUrl,
      openLightbox,
      closeLightbox,
      nextLightboxImage,
      prevLightboxImage,
      nextSlide,
      prevSlide,
      goToSlide,
      onImageLoad
    };
  }
});
</script>

<style scoped>
.gallery-wrapper {
  @apply w-full mb-8;
}

/* Grid Layout */
.gallery-grid {
  @apply w-full;
}

.gallery-item {
  @apply cursor-pointer transition-transform duration-300 hover:scale-105;
}

.gallery-image {
  @apply w-full h-auto rounded-lg shadow-md;
}

.image-caption {
  @apply mt-2 text-sm text-gray-600 dark:text-gray-400 text-center;
}

/* Carousel Layout */
.gallery-carousel {
  @apply relative;
}

.carousel-container {
  @apply overflow-hidden rounded-lg;
}

.carousel-track {
  @apply flex transition-transform duration-500 ease-in-out;
}

.carousel-slide {
  @apply min-w-full relative;
}

.carousel-image {
  @apply w-full h-64 md:h-96 object-cover cursor-pointer;
}

.carousel-caption {
  @apply absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center;
}

.carousel-controls {
  @apply flex items-center justify-between mt-4;
}

.carousel-btn {
  @apply bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.carousel-indicators {
  @apply flex space-x-2;
}

.carousel-dot {
  @apply w-3 h-3 rounded-full bg-gray-400 hover:bg-gray-600 transition-colors;
}

.carousel-dot.active {
  @apply bg-blue-500;
}

/* Masonry Layout */
.gallery-masonry {
  @apply relative;
}

.masonry-item {
  @apply cursor-pointer transition-transform duration-300 hover:scale-105 p-2;
}

.masonry-image {
  @apply w-full h-auto rounded-lg shadow-md;
}

.masonry-caption {
  @apply mt-2 text-sm text-gray-600 dark:text-gray-400;
}

/* Slideshow Layout */
.gallery-slideshow {
  @apply space-y-4;
}

.slideshow-main {
  @apply relative;
}

.slideshow-image {
  @apply w-full h-64 md:h-96 object-cover rounded-lg cursor-pointer;
}

.slideshow-caption {
  @apply absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center rounded-b-lg;
}

.slideshow-thumbnails {
  @apply flex space-x-2 overflow-x-auto pb-2;
}

.thumbnail {
  @apply flex-shrink-0 cursor-pointer border-2 border-transparent rounded-lg overflow-hidden transition-colors;
}

.thumbnail.active {
  @apply border-blue-500;
}

.thumbnail-image {
  @apply w-16 h-16 object-cover;
}

/* Lightbox */
.lightbox-overlay {
  @apply fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4;
}

.lightbox-content {
  @apply relative max-w-4xl max-h-full;
}

.lightbox-close {
  @apply absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300 transition-colors;
}

.lightbox-image-container {
  @apply relative;
}

.lightbox-image {
  @apply max-w-full max-h-screen object-contain;
}

.lightbox-caption {
  @apply text-white text-center mt-4 text-lg;
}

.lightbox-nav {
  @apply absolute top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300 transition-colors p-2;
}

.lightbox-prev {
  @apply left-4;
}

.lightbox-next {
  @apply right-4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .carousel-image,
  .slideshow-image {
    @apply h-48;
  }

  .lightbox-nav {
    @apply text-2xl;
  }
}
</style>