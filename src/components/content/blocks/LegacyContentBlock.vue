<template>
  <div class="legacy-content-block" :class="legacyBlockClasses">
    <!-- Title -->
    <div v-if="localizedTitle" class="legacy-title mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
        {{ localizedTitle }}
      </h2>
    </div>

    <!-- Main Content -->
    <div v-if="localizedContent" class="legacy-content mb-6">
      <div class="prose prose-lg dark:prose-invert max-w-none" v-html="localizedContent"></div>
    </div>

    <!-- YouTube Videos -->
    <div v-if="legacyData.yt_video && legacyData.yt_video.length > 0" class="legacy-videos mb-6">
      <div
        v-for="(videoUrl, index) in legacyData.yt_video"
        :key="index"
        class="video-container mb-4"
      >
        <div class="aspect-video">
          <iframe
            :src="getYouTubeEmbedUrl(videoUrl)"
            :title="`YouTube video ${index + 1}`"
            class="w-full h-full rounded-lg"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          />
        </div>
      </div>
    </div>

    <!-- Gallery -->
    <div v-if="legacyData.has_gallery && legacyData.gallery" class="legacy-gallery mb-6">
      <AlbumViewer :caption="false" :id="galleryId" />
    </div>

    <!-- Documents -->
    <div v-if="legacyData.has_documents" class="legacy-documents mb-6">
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {{ $t('related_documents') }}
        </h3>
        <DocLister :_id="contentId" />
      </div>
    </div>

    <!-- Date Information -->
    <div v-if="legacyData.show_date && (legacyData.$createdAt || legacyData.$updatedAt)" class="legacy-dates">
      <div class="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div v-if="legacyData.$createdAt" class="mb-1">
          <strong>{{ $t('created') }}:</strong> {{ formatDate(legacyData.$createdAt) }}
        </div>
        <div v-if="legacyData.$updatedAt">
          <strong>{{ $t('last_updated') }}:</strong> {{ formatDate(legacyData.$updatedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, LegacyContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';
import moment from 'moment/min/moment-with-locales';
import AlbumViewer from '@/components/AlbumViewer.vue';
import DocLister from '@/components/DocLister.vue';

export default defineComponent({
  name: 'LegacyContentBlock',
  components: {
    AlbumViewer,
    DocLister
  },
  props: {
    component: {
      type: Object as () => ContentComponent,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    contentId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const legacyData = computed((): LegacyContent => {
      let content: any;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs;
          break;
        case 'hu':
          content = props.component.content_hu;
          break;
        case 'en':
          content = props.component.content_en;
          break;
        default:
          content = props.component.content_rs;
      }

      return (content as LegacyContent) || {
        title_rs: '',
        title_en: '',
        title_hu: '',
        text_rs: '',
        text_en: '',
        text_hu: '',
        yt_video: [],
        has_gallery: false,
        gallery: null,
        has_documents: false,
        video: '',
        show_date: false
      };
    });

    const localizedTitle = computed(() => {
      switch (props.language) {
        case 'sr':
        case 'rs':
          return convertifserbian(legacyData.value.title_rs || '');
        case 'hu':
          return legacyData.value.title_hu || '';
        case 'en':
          return legacyData.value.title_en || '';
        default:
          return convertifserbian(legacyData.value.title_rs || '');
      }
    });

    const localizedContent = computed(() => {
      switch (props.language) {
        case 'sr':
        case 'rs':
          return legacyData.value.text_rs || '';
        case 'hu':
          return legacyData.value.text_hu || '';
        case 'en':
          return legacyData.value.text_en || '';
        default:
          return legacyData.value.text_rs || '';
      }
    });

    const galleryId = computed(() => {
      if (legacyData.value.gallery && typeof legacyData.value.gallery === 'object') {
        return legacyData.value.gallery.$id || legacyData.value.gallery.id;
      }
      return legacyData.value.gallery;
    });

    const legacyBlockClasses = computed(() => {
      const classes = ['legacy-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const getYouTubeEmbedUrl = (url: string): string => {
      try {
        let videoId = '';

        // Extract video ID from various YouTube URL formats
        if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('watch?v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
          videoId = url.split('embed/')[1].split('?')[0];
        } else {
          // Try to extract ID from other formats
          const match = url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([^"&?\/\s]{11})/);
          if (match) {
            videoId = match[1];
          }
        }

        if (!videoId) {
          console.warn('Could not extract YouTube video ID from URL:', url);
          return url; // Return original URL as fallback
        }

        return `https://www.youtube.com/embed/${videoId}`;
      } catch (error) {
        console.error('Error parsing YouTube URL:', error);
        return url; // Return original URL as fallback
      }
    };

    const formatDate = (dateString: string): string => {
      try {
        const language = props.language;

        switch (language) {
          case 'rs':
          case 'sr':
            moment.locale('sr');
            break;
          case 'hu':
            moment.locale('hu');
            break;
          case 'en':
            moment.locale('en');
            break;
          default:
            moment.locale('en');
        }

        return moment(dateString).format('LL');
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    };

    return {
      legacyData,
      localizedTitle,
      localizedContent,
      galleryId,
      legacyBlockClasses,
      getYouTubeEmbedUrl,
      formatDate
    };
  }
});
</script>

<style scoped>
.legacy-wrapper {
  @apply w-full mb-8;
}

.video-container {
  @apply relative overflow-hidden rounded-lg shadow-lg;
}

/* Prose styling enhancements */
.prose {
  @apply text-gray-700 dark:text-gray-300;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  @apply text-gray-900 dark:text-white font-semibold;
}

.prose :deep(h1) {
  @apply text-3xl mb-4;
}

.prose :deep(h2) {
  @apply text-2xl mb-3;
}

.prose :deep(h3) {
  @apply text-xl mb-3;
}

.prose :deep(h4) {
  @apply text-lg mb-2;
}

.prose :deep(h5),
.prose :deep(h6) {
  @apply text-base mb-2;
}

.prose :deep(p) {
  @apply mb-4 leading-relaxed;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply mb-4 ml-6;
}

.prose :deep(li) {
  @apply mb-1;
}

.prose :deep(blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4;
}

.prose :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
}

.prose :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4;
}

.prose :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.prose :deep(img) {
  @apply max-w-full h-auto rounded-lg my-4;
}

.prose :deep(table) {
  @apply min-w-full divide-y divide-gray-200 dark:divide-gray-700 my-4;
}

.prose :deep(th) {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800;
}

.prose :deep(td) {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white;
}

.prose :deep(tr:nth-child(even)) {
  @apply bg-gray-50 dark:bg-gray-800;
}

.prose :deep(strong) {
  @apply font-semibold text-gray-900 dark:text-white;
}

.prose :deep(em) {
  @apply italic;
}

/* Responsive video */
@media (max-width: 768px) {
  .video-container {
    @apply mx-auto max-w-full;
  }
}
</style>