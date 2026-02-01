<template>
  <div class="content-block" :class="`content-block--${block.type || 'text'}`">
    <!-- Text Block -->
    <div v-if="block.type === 'text' || !block.type" class="text-block">
      <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
      <div class="block-content" v-html="blockText"></div>
    </div>

    <!-- Gallery Block -->
    <div v-else-if="block.type === 'gallery'" class="gallery-block">
      <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
      <AlbumViewer
        v-if="settings.galleryId"
        :caption="false"
        :id="settings.galleryId"
        :layout="settings.layout || 'grid'"
        :columns="settings.columns || 3"
      />
      <div v-else class="empty-block">
        <p>{{ $t('no_gallery_selected') || 'Nincs kiválasztott galéria' }}</p>
      </div>
    </div>

    <!-- Video Block -->
    <div v-else-if="block.type === 'video'" class="video-block">
      <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
      <div v-if="embedUrl" class="video-wrapper">
        <iframe
          :src="embedUrl"
          width="100%"
          height="400"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <div v-else class="empty-block">
        <p>{{ $t('no_video_url') || 'Nincs videó URL' }}</p>
      </div>
    </div>

    <!-- Form Block -->
    <div v-else-if="block.type === 'form'" class="form-block">
      <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
      <EmbeddedFormView
        v-if="settings.formId"
        :form-id="settings.formId"
        :show-results="settings.showResults"
      />
      <div v-else class="empty-block">
        <p>{{ $t('no_form_selected') || 'Nincs kiválasztott űrlap' }}</p>
      </div>
    </div>

    <!-- Document Block -->
    <div v-else-if="block.type === 'document'" class="document-block">
      <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
      <DocumentList
        v-if="settings.documentIds && settings.documentIds.length > 0"
        :document-ids="settings.documentIds"
        :show-preview="settings.showPreview"
      />
      <div v-else class="empty-block">
        <p>{{ $t('no_documents_selected') || 'Nincsenek kiválasztott dokumentumok' }}</p>
      </div>
    </div>

    <!-- Unknown Block Type -->
    <div v-else class="unknown-block">
      <p>Ismeretlen blokk típus: {{ block.type }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, defineAsyncComponent } from 'vue';
import AlbumViewer from '@/components/AlbumViewer.vue';

// Lazy load heavy components
const EmbeddedFormView = defineAsyncComponent(() => import('@/components/forms/EmbeddedFormView.vue'));
const DocumentList = defineAsyncComponent(() => import('@/components/shared/DocumentList.vue'));

interface ContentBlock {
  $id: string;
  title: string;
  text: string;
  type: string;
  settings: string;
  visible: boolean;
}

export default defineComponent({
  name: 'ContentBlockRenderer',
  components: {
    AlbumViewer,
    EmbeddedFormView,
    DocumentList
  },
  props: {
    block: {
      type: Object as () => ContentBlock,
      required: true
    },
    language: {
      type: String,
      default: 'rs'
    }
  },
  setup(props) {
    const settings = computed(() => {
      try {
        return props.block.settings ? JSON.parse(props.block.settings) : {};
      } catch {
        return {};
      }
    });

    const blockText = computed(() => {
      return props.block.text || '';
    });

    const embedUrl = computed(() => {
      const videoUrl = settings.value.videoUrl;
      if (!videoUrl) return '';

      const provider = settings.value.provider || 'youtube';
      const autoplay = settings.value.autoplay ? '?autoplay=1' : '';

      if (provider === 'youtube') {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}${autoplay}`;
        }
      } else if (provider === 'vimeo') {
        const videoId = extractVimeoId(videoUrl);
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}${autoplay}`;
        }
      } else {
        return videoUrl;
      }

      return '';
    });

    const extractYouTubeId = (url: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const extractVimeoId = (url: string): string | null => {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? match[1] : null;
    };

    return {
      settings,
      blockText,
      embedUrl
    };
  }
});
</script>

<style scoped>
.content-block {
  margin-bottom: 2rem;
  padding: 1rem 0;
}

.block-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: inherit;
}

.text-block .block-content {
  line-height: 1.7;
}

.text-block .block-content :deep(p) {
  margin-bottom: 1rem;
}

.text-block .block-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.video-wrapper iframe {
  border-radius: 12px;
}

.gallery-block,
.document-block {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.form-block {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 1.5rem;
}

.empty-block {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.unknown-block {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  color: #92400e;
}

/* Dark mode */
:deep(.dark) .content-block {
  color: #f3f4f6;
}

:deep(.dark) .block-title {
  color: #f9fafb;
}

:deep(.dark) .gallery-block,
:deep(.dark) .document-block {
  border-top-color: rgba(255, 255, 255, 0.1);
}

:deep(.dark) .form-block {
  background: rgba(255, 255, 255, 0.05);
}

/* Responsive */
@media (max-width: 768px) {
  .video-wrapper iframe {
    height: 250px;
  }

  .block-title {
    font-size: 1.25rem;
  }
}
</style>
