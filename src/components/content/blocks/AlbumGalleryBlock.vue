<template>
  <div class="album-gallery-block" :class="albumGalleryClasses">
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

    <div v-if="localizedContent.gallery_id" class="album-viewer-wrapper">
      <AlbumViewer
        :caption="localizedContent.show_captions !== false"
        :id="localizedContent.gallery_id"
      />
    </div>

    <div v-else class="no-gallery-message">
      <p class="text-gray-500 italic">{{ $t('no_gallery_selected') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, AlbumGalleryComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';
import AlbumViewer from '@/components/AlbumViewer.vue';

export default defineComponent({
  name: 'AlbumGalleryBlock',
  components: {
    AlbumViewer
  },
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
    const localizedContent = computed((): AlbumGalleryComponentContent => {
      let content: AlbumGalleryComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as AlbumGalleryComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as AlbumGalleryComponentContent;
          break;
        case 'en':
          content = props.component.content_en as AlbumGalleryComponentContent;
          break;
        default:
          content = props.component.content_rs as AlbumGalleryComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || { gallery_id: '', show_captions: false };
    });

    const albumGalleryClasses = computed(() => {
      const classes = ['album-gallery-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      albumGalleryClasses
    };
  }
});
</script>

<style scoped>
.album-gallery-wrapper {
  @apply w-full mb-8;
}

.gallery-title h3 {
  @apply text-2xl font-semibold text-gray-800 dark:text-white mb-4;
}

.gallery-description p {
  @apply text-gray-600 dark:text-gray-300 leading-relaxed;
}

.album-viewer-wrapper {
  @apply mt-6;
}

.no-gallery-message {
  @apply text-center py-8;
}

.no-gallery-message p {
  @apply text-gray-500 italic;
}
</style>