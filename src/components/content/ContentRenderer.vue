<template>
  <div class="content-renderer">
    <!-- Legacy Content Mode (Backward Compatibility) -->
    <div v-if="useLegacyContent" class="legacy-content">
      <div
        v-if="legacyContent"
        class="w-full p-5 dark:text-white print_content content-section"
        v-html="localizedLegacyContent"
      />

      <!-- Legacy additional content sections -->
      <div
        v-for="contentSection in legacyChtmls"
        :key="contentSection.$id"
        class="w-full p-5 dark:text-white print_content content-section"
        v-html="contentSection.text"
      />
    </div>

    <!-- New Modular Content System -->
    <div v-else class="modular-content">
      <div
        v-for="component in sortedComponents"
        :key="component.$id"
        class="content-component"
        :class="getComponentClasses(component)"
        :style="getComponentStyles(component)"
      >
        <!-- Text Component -->
        <TextBlock
          v-if="component.type === 'text' || component.type === 'rich_text'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Heading Component -->
        <HeadingBlock
          v-else-if="component.type === 'heading'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Gallery Component -->
        <AlbumGalleryBlock
          v-else-if="component.type === 'gallery'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Documents Component -->
        <DocumentsBlock
          v-else-if="component.type === 'documents'"
          :component="component"
          :language="currentLanguage"
          :content-id="contentId"
        />

        <!-- Image Component -->
        <ImageBlock
          v-else-if="component.type === 'image'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Video Component -->
        <VideoBlock
          v-else-if="component.type === 'video'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- YouTube Component -->
        <YouTubeBlock
          v-else-if="component.type === 'youtube'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Form Component -->
        <FormBlock
          v-else-if="component.type === 'form'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Button Component -->
        <ButtonBlock
          v-else-if="component.type === 'button'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Divider Component -->
        <DividerBlock
          v-else-if="component.type === 'divider'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Table Component -->
        <TableBlock
          v-else-if="component.type === 'table'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Quote Component -->
        <QuoteBlock
          v-else-if="component.type === 'quote'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Accordion Component -->
        <AccordionBlock
          v-else-if="component.type === 'accordion'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Tabs Component -->
        <TabsBlock
          v-else-if="component.type === 'tabs'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Legacy Content Component (for mixed mode) -->
        <LegacyContentBlock
          v-else-if="component.type === 'legacy_content'"
          :component="component"
          :language="currentLanguage"
        />

        <!-- Fallback for unknown component types -->
        <div v-else class="unknown-component bg-yellow-100 border border-yellow-400 p-4 rounded">
          <p class="text-yellow-800">Unknown component type: {{ component.type }}</p>
          <pre class="text-sm mt-2">{{ JSON.stringify(component, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Legacy YouTube Videos (for backward compatibility) -->
    <div v-if="ytVideos && ytVideos.length > 0" class="legacy-youtube-videos">
      <div v-for="ytVideo in ytVideos" :key="ytVideo" class="p-5 video-container">
        <iframe
          class="mx-auto"
          width="560"
          height="315"
          :src="getYouTubeEmbedUrl(ytVideo)"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        />
      </div>
    </div>

    <!-- Legacy Gallery (for backward compatibility) -->
    <div v-if="galleryFlag && galleryId" class="legacy-gallery-section">
      <AlbumViewer :caption="false" :id="galleryId" />
    </div>

    <!-- Legacy Documents (for backward compatibility) -->
    <div v-if="hasDocuments" class="legacy-documents-section">
      <div class="m-auto w-full">
        <DocLister :_id="contentId" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useLoadingStore } from '@/stores/loading';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { convertifserbian } from '@/lang';
import type { ContentComponent, LegacyContent } from '@/types/contentTypes';
import {
  shouldUseLegacyContent,
  migrateLegacyDocument,
  createLegacyCompatibilityComponent
} from '@/utils/contentMigration';

// Import content block components
import TextBlock from './blocks/TextBlock.vue';
import HeadingBlock from './blocks/HeadingBlock.vue';
import AlbumGalleryBlock from './blocks/AlbumGalleryBlock.vue';
import DocumentsBlock from './blocks/DocumentsBlock.vue';
import ImageBlock from './blocks/ImageBlock.vue';
import VideoBlock from './blocks/VideoBlock.vue';
import YouTubeBlock from './blocks/YouTubeBlock.vue';
import FormBlock from './blocks/FormBlock.vue';
import ButtonBlock from './blocks/ButtonBlock.vue';
import DividerBlock from './blocks/DividerBlock.vue';
import TableBlock from './blocks/TableBlock.vue';
import QuoteBlock from './blocks/QuoteBlock.vue';
import AccordionBlock from './blocks/AccordionBlock.vue';
import TabsBlock from './blocks/TabsBlock.vue';
import LegacyContentBlock from './blocks/LegacyContentBlock.vue';

// Legacy components for backward compatibility
import AlbumViewer from '@/components/AlbumViewer.vue';
import DocLister from '@/components/DocLister.vue';

export default defineComponent({
  name: 'ContentRenderer',
  components: {
    TextBlock,
    HeadingBlock,
    AlbumGalleryBlock,
    DocumentsBlock,
    ImageBlock,
    VideoBlock,
    YouTubeBlock,
    FormBlock,
    ButtonBlock,
    DividerBlock,
    TableBlock,
    QuoteBlock,
    AccordionBlock,
    TabsBlock,
    LegacyContentBlock,
    AlbumViewer,
    DocLister
  },

  props: {
    contentId: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      default: 'document' // 'document', 'page', 'news', 'about'
    },
    previewMode: {
      type: Boolean,
      default: false
    },
    autoMigrate: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const loadingStore = useLoadingStore();

    // Reactive data
    const components = ref<ContentComponent[]>([]);
    const legacyContent = ref<LegacyContent | null>(null);
    const legacyChtmls = ref<any[]>([]);
    const useLegacyContent = ref(true);
    const loading = ref(true);

    // Legacy support data
    const ytVideos = ref<string[] | null>(null);
    const galleryFlag = ref(false);
    const galleryId = ref('');
    const hasDocuments = ref(false);

    // Computed properties
    const currentLanguage = computed(() => loadingStore.language);

    const sortedComponents = computed(() => {
      return [...components.value]
        .filter(component => component.visible && component.published)
        .sort((a, b) => a.order - b.order);
    });

    const localizedLegacyContent = computed(() => {
      if (!legacyContent.value) return '';

      switch (currentLanguage.value) {
        case 'sr':
        case 'rs':
          return legacyContent.value.text_rs;
        case 'hu':
          return legacyContent.value.text_hu;
        case 'en':
          return legacyContent.value.text_en;
        default:
          return legacyContent.value.text_rs;
      }
    });

    // Methods
    const loadContent = async () => {
      try {
        loading.value = true;
        const database = new Databases(appw);

        // Load main content document
        const mainContent = await database.getDocument(
          config.website_db,
          getCollectionForContentType(props.contentType),
          props.contentId
        );

        // Use migration service to determine content type
        useLegacyContent.value = shouldUseLegacyContent(mainContent);

        if (useLegacyContent.value) {
          // Legacy mode - load content as before
          await loadLegacyContent(mainContent);
        } else {
          // New modular mode - load components
          await loadModularContent(mainContent);
        }

        // Load legacy additional content sections (for backward compatibility)
        await loadLegacyAdditionalContent();

      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        loading.value = false;
      }
    };

    const loadLegacyContent = async (mainContent: any) => {
      // Map legacy content
      legacyContent.value = {
        title_rs: mainContent.title_rs || '',
        title_en: mainContent.title_en || '',
        title_hu: mainContent.title_hu || '',
        text_rs: mainContent.text_rs || '',
        text_en: mainContent.text_en || '',
        text_hu: mainContent.text_hu || '',
        yt_video: mainContent.yt_video || null,
        has_gallery: mainContent.has_gallery || false,
        gallery: mainContent.gallery || null,
        has_documents: mainContent.has_documents || false,
        video: mainContent.video || '',
        show_date: mainContent.show_date || false
      };

      // Set legacy flags
      ytVideos.value = mainContent.yt_video || null;
      galleryFlag.value = mainContent.has_gallery || false;
      hasDocuments.value = mainContent.has_documents || false;

      if (galleryFlag.value && mainContent.gallery) {
        try {
          galleryId.value = mainContent.gallery.$id;
        } catch (error) {
          console.error('Gallery ID error:', error);
        }
      }
    };

    const loadModularContent = async (mainContent: any) => {
      const database = new Databases(appw);

      // Load all modular components using text_components collection
      const componentsResponse = await database.listDocuments(
        config.website_db,
        config.text_components,
        [
          Query.equal("parent_id", props.contentId),
          Query.orderAsc("order")
        ]
      );

      // Group by component_id to combine all languages for each component
      const componentsByComponentId: { [key: string]: any[] } = {};

      componentsResponse.documents.forEach(doc => {
        const componentId = doc.component_id || doc.$id; // fallback to doc ID if no component_id
        if (!componentsByComponentId[componentId]) {
          componentsByComponentId[componentId] = [];
        }
        componentsByComponentId[componentId].push(doc);
      });

      // Transform to ContentComponent format
      components.value = Object.keys(componentsByComponentId).map(componentId => {
        const componentDocs = componentsByComponentId[componentId];
        const mainDoc = componentDocs[0]; // Use first doc for shared properties

        // Build content for each language
        const content_rs = componentDocs.find(d => d.lang === 'rs')?.content || componentDocs.find(d => d.lang === 'rs')?.text || '';
        const content_en = componentDocs.find(d => d.lang === 'en')?.content || componentDocs.find(d => d.lang === 'en')?.text || '';
        const content_hu = componentDocs.find(d => d.lang === 'hu')?.content || componentDocs.find(d => d.lang === 'hu')?.text || '';

        return {
          $id: componentId,
          type: mainDoc.type || 'text',
          name: mainDoc.title || `component_${mainDoc.order}`,
          order: mainDoc.order || 0,
          parent_id: mainDoc.parent_id || props.contentId, // Use parent_id, fallback to contentId
          parent_type: mainDoc.parent_type || props.contentType,
          content_rs: content_rs ? (typeof content_rs === 'string' ? JSON.parse(content_rs) : content_rs) : { content: content_rs },
          content_en: content_en ? (typeof content_en === 'string' ? JSON.parse(content_en) : content_en) : { content: content_en },
          content_hu: content_hu ? (typeof content_hu === 'string' ? JSON.parse(content_hu) : content_hu) : { content: content_hu },
          language_metadata: {
            primary_language: 'rs',
            available_languages: componentDocs.map(d => d.lang),
            translation_status: {
              rs: componentDocs.find(d => d.lang === 'rs') ? 'complete' : 'missing',
              en: componentDocs.find(d => d.lang === 'en') ? 'complete' : 'missing',
              hu: componentDocs.find(d => d.lang === 'hu') ? 'complete' : 'missing'
            }
          },
          settings: mainDoc.settings ? JSON.parse(mainDoc.settings) : {},
          visible: mainDoc.visible !== false,
          published: mainDoc.published !== false,
          created_at: mainDoc.$createdAt,
          updated_at: mainDoc.$updatedAt,
          created_by: 'text_components_system'
        } as ContentComponent;
      }).sort((a, b) => a.order - b.order);
    };

    const loadLegacyAdditionalContent = async () => {
      const database = new Databases(appw);

      try {
        // Load old text_components for backward compatibility
        const additionalContent = await database.listDocuments(
          config.website_db,
          config.text_components,
          [
            Query.equal("parent_id", props.contentId),
            Query.equal("lang", currentLanguage.value),
            Query.orderAsc("order")
          ]
        );
        legacyChtmls.value = additionalContent.documents;
      } catch (error) {
        // If collection doesn't exist or no data, that's fine
        console.log('No legacy additional content found');
      }
    };

    const getCollectionForContentType = (type: string): string => {
      switch (type) {
        case 'document':
          return config.documents_db;
        case 'news':
          return config.news_db;
        case 'page':
          return config.pages_db;
        case 'courses':
          return config.courselist;
        case 'about':
        default:
          return config.about_us_db;
      }
    };

    const getComponentClasses = (component: ContentComponent): string => {
      const classes = ['content-block'];

      if (component.settings?.layout) {
        classes.push(`layout-${component.settings.layout}`);
      }

      if (component.settings?.alignment) {
        classes.push(`text-${component.settings.alignment}`);
      }

      if (component.settings?.spacing) {
        classes.push(`spacing-${component.settings.spacing}`);
      }

      if (component.settings?.animation) {
        classes.push(`animate-${component.settings.animation}`);
      }

      if (component.settings?.shadow) {
        classes.push('shadow-lg');
      }

      return classes.join(' ');
    };

    const getComponentStyles = (component: ContentComponent): Record<string, string> => {
      const styles: Record<string, string> = {};

      if (component.settings?.background_color) {
        styles.backgroundColor = component.settings.background_color;
      }

      if (component.settings?.text_color) {
        styles.color = component.settings.text_color;
      }

      if (component.settings?.padding) {
        styles.padding = component.settings.padding;
      }

      if (component.settings?.margin) {
        styles.margin = component.settings.margin;
      }

      if (component.settings?.border_radius) {
        styles.borderRadius = component.settings.border_radius;
      }

      if (component.settings?.animation_delay) {
        styles.animationDelay = `${component.settings.animation_delay}ms`;
      }

      return styles;
    };

    const getYouTubeEmbedUrl = (url: string): string => {
      const videoId = url.split('?v=')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    };

    // Watch for changes
    watch(() => props.contentId, loadContent);
    watch(currentLanguage, loadContent);

    // Lifecycle
    onMounted(loadContent);

    return {
      components,
      legacyContent,
      legacyChtmls,
      useLegacyContent,
      loading,
      ytVideos,
      galleryFlag,
      galleryId,
      hasDocuments,
      currentLanguage,
      sortedComponents,
      localizedLegacyContent,
      getComponentClasses,
      getComponentStyles,
      getYouTubeEmbedUrl
    };
  }
});
</script>

<style scoped>
.content-renderer {
  @apply w-full;
}

.content-component {
  @apply mb-6;
}

.content-block {
  @apply transition-all duration-300;
}

/* Layout classes */
.layout-full {
  @apply w-full;
}

.layout-container {
  @apply max-w-4xl mx-auto px-4;
}

.layout-narrow {
  @apply max-w-2xl mx-auto px-4;
}

/* Spacing classes */
.spacing-tight {
  @apply mb-2;
}

.spacing-normal {
  @apply mb-6;
}

.spacing-loose {
  @apply mb-12;
}

/* Animation classes */
.animate-fade {
  @apply opacity-0 animate-fadeIn;
}

.animate-slide {
  @apply transform translate-y-4 opacity-0 animate-slideUp;
}

.animate-zoom {
  @apply transform scale-95 opacity-0 animate-zoomIn;
}

/* Legacy content styles */
.legacy-content .content-section {
  @apply leading-relaxed;
}

.legacy-content .content-section :deep(h1),
.legacy-content .content-section :deep(h2),
.legacy-content .content-section :deep(h3) {
  @apply font-semibold text-gray-800 dark:text-white mb-4;
}

.legacy-content .content-section :deep(h1) {
  @apply text-2xl;
}

.legacy-content .content-section :deep(h2) {
  @apply text-xl;
}

.legacy-content .content-section :deep(h3) {
  @apply text-lg;
}

.legacy-content .content-section :deep(p) {
  @apply mb-4 text-gray-700 dark:text-gray-200;
}

.legacy-content .content-section :deep(ul),
.legacy-content .content-section :deep(ol) {
  @apply mb-4 pl-6;
}

.legacy-content .content-section :deep(li) {
  @apply mb-2 text-gray-700 dark:text-gray-200;
}

.legacy-content .content-section :deep(a) {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.legacy-content .content-section :deep(img) {
  @apply rounded-lg shadow-md max-w-full h-auto mx-auto my-6;
}

.video-container {
  @apply mb-8;
}

.legacy-gallery-section,
.legacy-documents-section {
  @apply border-t border-gray-200 dark:border-gray-700 pt-8 mt-8;
}

.unknown-component {
  @apply bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded mb-4;
}

/* Responsive video */
@media (max-width: 768px) {
  .video-container iframe {
    width: 100%;
    height: 200px;
  }
}

/* Animation keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slideUp {
  animation: slideUp 0.6s ease-out forwards;
}

.animate-zoomIn {
  animation: zoomIn 0.6s ease-out forwards;
}
</style>