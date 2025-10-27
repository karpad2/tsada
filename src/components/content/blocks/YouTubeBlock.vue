<template>
  <div class="youtube-block" :class="youtubeClasses">
    <div v-if="localizedContent.title" class="youtube-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="youtube-description mb-4">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <div class="youtube-container" :class="videoContainerClasses">
      <iframe
        v-if="embedUrl"
        :src="embedUrl"
        :title="localizedContent.title || 'YouTube video'"
        class="youtube-iframe"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      />

      <div v-else class="youtube-error">
        <div class="error-content">
          <i class="pi pi-youtube text-4xl text-red-500 mb-4"></i>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {{ $t('invalid_youtube_url') }}
          </h4>
          <p class="text-gray-600 dark:text-gray-400">
            {{ $t('please_check_youtube_url') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, VideoComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'YouTubeBlock',
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
    const localizedContent = computed((): VideoComponentContent => {
      let content: VideoComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as VideoComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as VideoComponentContent;
          break;
        case 'en':
          content = props.component.content_en as VideoComponentContent;
          break;
        default:
          content = props.component.content_rs as VideoComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || { autoplay: false, controls: true, muted: false, loop: false };
    });

    const embedUrl = computed(() => {
      const youtubeUrl = localizedContent.value.youtube_url;
      if (!youtubeUrl) return null;

      try {
        // Extract video ID from various YouTube URL formats
        let videoId = '';

        if (youtubeUrl.includes('youtube.com/watch?v=')) {
          videoId = youtubeUrl.split('watch?v=')[1].split('&')[0];
        } else if (youtubeUrl.includes('youtu.be/')) {
          videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
        } else if (youtubeUrl.includes('youtube.com/embed/')) {
          videoId = youtubeUrl.split('embed/')[1].split('?')[0];
        } else {
          // Try to extract ID from other formats
          const match = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (match) {
            videoId = match[1];
          }
        }

        if (!videoId) return null;

        // Build embed URL with parameters
        const params = new URLSearchParams();

        if (localizedContent.value.autoplay) {
          params.append('autoplay', '1');
        }

        if (localizedContent.value.muted) {
          params.append('mute', '1');
        }

        if (localizedContent.value.loop) {
          params.append('loop', '1');
          params.append('playlist', videoId);
        }

        if (!localizedContent.value.controls) {
          params.append('controls', '0');
        }

        // Additional parameters from settings
        if (props.component.settings?.start_time) {
          params.append('start', props.component.settings.start_time.toString());
        }

        if (props.component.settings?.end_time) {
          params.append('end', props.component.settings.end_time.toString());
        }

        if (props.component.settings?.hide_info) {
          params.append('showinfo', '0');
        }

        if (props.component.settings?.hide_related) {
          params.append('rel', '0');
        }

        const queryString = params.toString();
        return `https://www.youtube.com/embed/${videoId}${queryString ? '?' + queryString : ''}`;

      } catch (error) {
        console.error('Error parsing YouTube URL:', error);
        return null;
      }
    });

    const youtubeClasses = computed(() => {
      const classes = ['youtube-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const videoContainerClasses = computed(() => {
      const classes = ['relative', 'overflow-hidden', 'rounded-lg', 'shadow-lg'];

      const aspectRatio = props.component.settings?.aspect_ratio || '16:9';

      switch (aspectRatio) {
        case '16:9':
          classes.push('aspect-video');
          break;
        case '4:3':
          classes.push('aspect-[4/3]');
          break;
        case '1:1':
          classes.push('aspect-square');
          break;
        case '21:9':
          classes.push('aspect-[21/9]');
          break;
        default:
          classes.push('aspect-video');
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      embedUrl,
      youtubeClasses,
      videoContainerClasses
    };
  }
});
</script>

<style scoped>
.youtube-wrapper {
  @apply w-full mb-8;
}

.youtube-iframe {
  @apply w-full h-full;
}

.youtube-error {
  @apply flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg;
}

.error-content {
  @apply text-center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .youtube-container {
    @apply mx-auto;
  }
}
</style>