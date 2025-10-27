<template>
  <div class="video-block" :class="videoClasses">
    <div v-if="localizedContent.title" class="video-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="video-description mb-4">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <div class="video-container" :class="videoContainerClasses">
      <!-- Custom Video Player -->
      <div v-if="videoSource" class="relative">
        <video
          ref="videoElement"
          :controls="showControls"
          :autoplay="autoplayEnabled"
          :muted="mutedEnabled"
          :loop="loopEnabled"
          :poster="thumbnailUrl"
          class="video-player"
          @loadedmetadata="onVideoLoaded"
          @error="onVideoError"
        >
          <source :src="videoSource" type="video/mp4">
          <p class="text-red-500">{{ $t('video_not_supported') }}</p>
        </video>

        <!-- Custom Play Button Overlay -->
        <div
          v-if="showPlayButton && !isPlaying"
          class="video-overlay"
          @click="togglePlay"
        >
          <div class="play-button">
            <i class="pi pi-play text-4xl"></i>
          </div>
        </div>

        <!-- Video Info Overlay -->
        <div
          v-if="showVideoInfo"
          class="video-info"
        >
          <div class="video-duration">
            {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
          </div>
        </div>
      </div>

      <!-- Video Not Found -->
      <div v-else-if="videoNotFound" class="video-error">
        <div class="error-content">
          <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {{ $t('video_not_found') }}
          </h4>
          <p class="text-gray-600 dark:text-gray-400">
            {{ $t('video_not_found_description') }}
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="video-loading">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">
            {{ $t('loading_video') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Video Metadata -->
    <div v-if="showMetadata && videoLoaded" class="video-metadata mt-4">
      <div class="metadata-grid">
        <div v-if="videoDimensions" class="metadata-item">
          <span class="metadata-label">{{ $t('resolution') }}:</span>
          <span class="metadata-value">{{ videoDimensions }}</span>
        </div>
        <div v-if="duration" class="metadata-item">
          <span class="metadata-label">{{ $t('duration') }}:</span>
          <span class="metadata-value">{{ formatDuration(duration) }}</span>
        </div>
        <div v-if="fileSize" class="metadata-item">
          <span class="metadata-label">{{ $t('file_size') }}:</span>
          <span class="metadata-value">{{ formatFileSize(fileSize) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue';
import { Storage } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent, VideoComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'VideoBlock',
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
    const videoElement = ref<HTMLVideoElement>();
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const videoLoaded = ref(false);
    const videoNotFound = ref(false);
    const videoDimensions = ref('');
    const fileSize = ref(0);

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

      return content || {
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      };
    });

    const videoSource = computed(() => {
      if (!localizedContent.value.video_id) return null;

      try {
        const storage = new Storage(appw);
        return storage.getFileView(config.website_videos, localizedContent.value.video_id).href;
      } catch (error) {
        console.error('Error getting video URL:', error);
        videoNotFound.value = true;
        return null;
      }
    });

    const thumbnailUrl = computed(() => {
      if (!localizedContent.value.thumbnail_id) return undefined;

      try {
        const storage = new Storage(appw);
        return storage.getFileView(config.website_images, localizedContent.value.thumbnail_id).href;
      } catch (error) {
        console.error('Error getting thumbnail URL:', error);
        return undefined;
      }
    });

    const showControls = computed(() => {
      return localizedContent.value.controls !== false;
    });

    const autoplayEnabled = computed(() => {
      return localizedContent.value.autoplay === true;
    });

    const mutedEnabled = computed(() => {
      return localizedContent.value.muted === true;
    });

    const loopEnabled = computed(() => {
      return localizedContent.value.loop === true;
    });

    const showPlayButton = computed(() => {
      return props.component.settings?.show_play_button !== false;
    });

    const showVideoInfo = computed(() => {
      return props.component.settings?.show_video_info === true;
    });

    const showMetadata = computed(() => {
      return props.component.settings?.show_metadata === true;
    });

    const videoClasses = computed(() => {
      const classes = ['video-wrapper'];

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

    // Methods
    const togglePlay = () => {
      if (!videoElement.value) return;

      if (videoElement.value.paused) {
        videoElement.value.play();
        isPlaying.value = true;
      } else {
        videoElement.value.pause();
        isPlaying.value = false;
      }
    };

    const onVideoLoaded = () => {
      if (!videoElement.value) return;

      videoLoaded.value = true;
      duration.value = videoElement.value.duration;
      videoDimensions.value = `${videoElement.value.videoWidth}x${videoElement.value.videoHeight}`;

      // Try to get file size (may not always be available)
      if ('mozInputSource' in videoElement.value) {
        // Firefox
        fileSize.value = (videoElement.value as any).mozInputSource?.size || 0;
      }
    };

    const onVideoError = () => {
      videoNotFound.value = true;
      console.error('Video failed to load');
    };

    const updateTime = () => {
      if (videoElement.value) {
        currentTime.value = videoElement.value.currentTime;
      }
    };

    const formatDuration = (seconds: number): string => {
      if (!seconds || isNaN(seconds)) return '0:00';

      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '';

      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    // Event listeners
    const addVideoEventListeners = () => {
      if (!videoElement.value) return;

      videoElement.value.addEventListener('timeupdate', updateTime);
      videoElement.value.addEventListener('play', () => { isPlaying.value = true; });
      videoElement.value.addEventListener('pause', () => { isPlaying.value = false; });
      videoElement.value.addEventListener('ended', () => { isPlaying.value = false; });
    };

    const removeVideoEventListeners = () => {
      if (!videoElement.value) return;

      videoElement.value.removeEventListener('timeupdate', updateTime);
      videoElement.value.removeEventListener('play', () => { isPlaying.value = true; });
      videoElement.value.removeEventListener('pause', () => { isPlaying.value = false; });
      videoElement.value.removeEventListener('ended', () => { isPlaying.value = false; });
    };

    onMounted(() => {
      addVideoEventListeners();
    });

    onUnmounted(() => {
      removeVideoEventListeners();
    });

    return {
      videoElement,
      isPlaying,
      currentTime,
      duration,
      videoLoaded,
      videoNotFound,
      videoDimensions,
      fileSize,
      localizedContent,
      videoSource,
      thumbnailUrl,
      showControls,
      autoplayEnabled,
      mutedEnabled,
      loopEnabled,
      showPlayButton,
      showVideoInfo,
      showMetadata,
      videoClasses,
      videoContainerClasses,
      togglePlay,
      onVideoLoaded,
      onVideoError,
      formatDuration,
      formatFileSize
    };
  }
});
</script>

<style scoped>
.video-wrapper {
  @apply w-full mb-8;
}

.video-player {
  @apply w-full h-full object-cover;
}

.video-overlay {
  @apply absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer transition-opacity hover:bg-opacity-20;
}

.play-button {
  @apply bg-white bg-opacity-90 rounded-full p-6 shadow-lg transform transition-transform hover:scale-110;
}

.video-info {
  @apply absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm;
}

.video-error,
.video-loading {
  @apply flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg;
}

.error-content,
.loading-content {
  @apply text-center;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto;
}

.video-metadata {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.metadata-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.metadata-item {
  @apply flex justify-between;
}

.metadata-label {
  @apply font-medium text-gray-600 dark:text-gray-400;
}

.metadata-value {
  @apply text-gray-800 dark:text-white;
}

/* Custom video controls styling */
.video-player::-webkit-media-controls-panel {
  background-color: rgba(0, 0, 0, 0.8);
}

.video-player::-webkit-media-controls-play-button,
.video-player::-webkit-media-controls-volume-slider,
.video-player::-webkit-media-controls-timeline {
  filter: invert(1);
}
</style>