<template>
  <div class="image-block" :class="imageClasses">
    <div v-if="localizedContent.title" class="image-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div class="image-container" :class="imageContainerClasses">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="localizedContent.alt_text || localizedContent.title || 'Image'"
        class="image-element"
        :class="imageStyles"
        loading="lazy"
        @click="openLightbox"
        @error="onImageError"
      />

      <div v-else class="image-error">
        <div class="error-content">
          <i class="pi pi-image text-4xl text-gray-400 mb-4"></i>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {{ $t('image_not_found') }}
          </h4>
          <p class="text-gray-600 dark:text-gray-400">
            {{ $t('image_not_found_description') }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="localizedContent.caption" class="image-caption mt-3">
      <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
        {{ localizedContent.caption }}
      </p>
    </div>

    <!-- Lightbox -->
    <div
      v-if="lightboxOpen && enableLightbox"
      class="lightbox-overlay"
      @click="closeLightbox"
    >
      <div class="lightbox-content" @click.stop>
        <button @click="closeLightbox" class="lightbox-close">
          <i class="pi pi-times"></i>
        </button>
        <img
          :src="imageUrl"
          :alt="localizedContent.alt_text || localizedContent.title"
          class="lightbox-image"
        />
        <div v-if="localizedContent.caption" class="lightbox-caption">
          {{ localizedContent.caption }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { Storage } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent, ImageComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'ImageBlock',
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
    const lightboxOpen = ref(false);
    const imageError = ref(false);

    const localizedContent = computed((): ImageComponentContent => {
      let content: ImageComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as ImageComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.caption) content.caption = convertifserbian(content.caption);
          if (content.alt_text) content.alt_text = convertifserbian(content.alt_text);
          break;
        case 'hu':
          content = props.component.content_hu as ImageComponentContent;
          break;
        case 'en':
          content = props.component.content_en as ImageComponentContent;
          break;
        default:
          content = props.component.content_rs as ImageComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.caption) content.caption = convertifserbian(content.caption);
          if (content.alt_text) content.alt_text = convertifserbian(content.alt_text);
      }

      return content || {};
    });

    const imageUrl = computed(() => {
      if (localizedContent.value.url) {
        return localizedContent.value.url;
      }

      if (localizedContent.value.image_id) {
        try {
          const storage = new Storage(appw);
          return storage.getFileView(config.website_images, localizedContent.value.image_id).href;
        } catch (error) {
          console.error('Error getting image URL:', error);
          return null;
        }
      }

      return null;
    });

    const enableLightbox = computed(() => {
      return props.component.settings?.lightbox !== false;
    });

    const imageClasses = computed(() => {
      const classes = ['image-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const imageContainerClasses = computed(() => {
      const classes = ['relative', 'overflow-hidden'];

      if (props.component.settings?.rounded) {
        classes.push('rounded-lg');
      }

      if (props.component.settings?.shadow) {
        classes.push('shadow-lg');
      }

      return classes.join(' ');
    });

    const imageStyles = computed(() => {
      const classes = ['transition-transform', 'duration-300'];

      const width = props.component.settings?.width || 'auto';
      const height = props.component.settings?.height || 'auto';

      if (width === 'full') {
        classes.push('w-full');
      } else if (width !== 'auto') {
        classes.push(`w-${width}`);
      }

      if (height === 'auto') {
        classes.push('h-auto');
      } else if (height) {
        classes.push(`h-${height}`);
      }

      const objectFit = props.component.settings?.object_fit || 'cover';
      classes.push(`object-${objectFit}`);

      if (enableLightbox.value) {
        classes.push('cursor-pointer', 'hover:scale-105');
      }

      return classes.join(' ');
    });

    const openLightbox = () => {
      if (enableLightbox.value && !imageError.value) {
        lightboxOpen.value = true;
        document.body.style.overflow = 'hidden';
      }
    };

    const closeLightbox = () => {
      lightboxOpen.value = false;
      document.body.style.overflow = '';
    };

    const onImageError = () => {
      imageError.value = true;
    };

    return {
      localizedContent,
      imageUrl,
      lightboxOpen,
      enableLightbox,
      imageClasses,
      imageContainerClasses,
      imageStyles,
      openLightbox,
      closeLightbox,
      onImageError
    };
  }
});
</script>

<style scoped>
.image-wrapper {
  @apply w-full mb-6;
}

.image-element {
  @apply max-w-full;
}

.image-error {
  @apply flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg;
}

.error-content {
  @apply text-center;
}

.image-caption {
  @apply leading-relaxed;
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

.lightbox-image {
  @apply max-w-full max-h-screen object-contain;
}

.lightbox-caption {
  @apply text-white text-center mt-4 text-lg;
}
</style>