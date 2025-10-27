<template>
  <div class="documents-block" :class="documentsClasses">
    <div v-if="localizedContent.title" class="documents-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="documents-description mb-4">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <div class="documents-list">
      <DocLister :_id="contentId" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, DocumentsComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';
import DocLister from '@/components/DocLister.vue';

export default defineComponent({
  name: 'DocumentsBlock',
  components: {
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
    const localizedContent = computed((): DocumentsComponentContent => {
      let content: DocumentsComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as DocumentsComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as DocumentsComponentContent;
          break;
        case 'en':
          content = props.component.content_en as DocumentsComponentContent;
          break;
        default:
          content = props.component.content_rs as DocumentsComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || {};
    });

    const documentsClasses = computed(() => {
      const classes = ['documents-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      documentsClasses
    };
  }
});
</script>

<style scoped>
.documents-wrapper {
  @apply w-full mb-8;
}

.documents-title h3 {
  @apply text-xl font-semibold text-gray-800 dark:text-white mb-4;
}

.documents-description p {
  @apply text-gray-600 dark:text-gray-300 leading-relaxed;
}

.documents-list {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-6;
}
</style>