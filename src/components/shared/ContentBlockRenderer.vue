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
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(14, 165, 233, 0.12);
  box-shadow: 0 2px 12px rgba(14, 165, 233, 0.05);
}

.block-title {
  font-size: 1.35rem;
  font-weight: 600;
  margin-bottom: 0.85rem;
  color: #0f172a;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(14, 165, 233, 0.15);
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
  border-radius: 0.75rem;
  margin: 1rem 0;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.1);
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 0.85rem;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.15);
}

.video-wrapper iframe {
  border-radius: 0.85rem;
  display: block;
}

.gallery-block,
.document-block {
  /* inherit glass shell */
}

.form-block {
  background: rgba(14, 165, 233, 0.05);
}

.empty-block {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-style: italic;
  border-radius: 0.75rem;
  background: rgba(148, 163, 184, 0.08);
}

.unknown-block {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 0.75rem;
  padding: 1rem;
  color: #92400e;
}

/* Dark mode */
:global(.dark) .content-block {
  color: #f3f4f6;
  background: rgba(30, 41, 59, 0.45);
  border-color: rgba(148, 163, 184, 0.14);
}

:global(.dark) .block-title {
  color: #f9fafb;
  border-bottom-color: rgba(56, 189, 248, 0.15);
}

:global(.dark) .form-block {
  background: rgba(56, 189, 248, 0.06);
}

:global(.dark) .empty-block {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.08);
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
