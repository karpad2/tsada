<template>
  <div class="text-block" :class="textClasses">
    <div v-if="showTitle && localizedContent.title" class="text-title">
      <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div
      class="text-content"
      :class="contentClasses"
      v-html="localizedContent.content"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, TextComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'TextBlock',
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
    const localizedContent = computed((): TextComponentContent => {
      let content: TextComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as TextComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.content) content.content = convertifserbian(content.content);
          break;
        case 'hu':
          content = props.component.content_hu as TextComponentContent;
          break;
        case 'en':
          content = props.component.content_en as TextComponentContent;
          break;
        default:
          content = props.component.content_rs as TextComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.content) content.content = convertifserbian(content.content);
      }

      return content || { content: '', style: 'paragraph' };
    });

    const showTitle = computed(() => {
      return localizedContent.value.title && localizedContent.value.title.trim() !== '';
    });

    const textClasses = computed(() => {
      const classes = ['text-block-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const contentClasses = computed(() => {
      const classes = ['prose', 'prose-lg', 'dark:prose-invert', 'max-w-none'];

      const style = localizedContent.value.style || 'paragraph';

      switch (style) {
        case 'heading1':
          classes.push('text-3xl', 'font-bold', 'mb-6');
          break;
        case 'heading2':
          classes.push('text-2xl', 'font-semibold', 'mb-4');
          break;
        case 'heading3':
          classes.push('text-xl', 'font-medium', 'mb-3');
          break;
        case 'quote':
          classes.push('border-l-4', 'border-blue-500', 'pl-4', 'italic', 'text-gray-700', 'dark:text-gray-300');
          break;
        case 'caption':
          classes.push('text-sm', 'text-gray-600', 'dark:text-gray-400', 'italic');
          break;
        case 'paragraph':
        default:
          classes.push('text-base', 'leading-relaxed');
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      showTitle,
      textClasses,
      contentClasses
    };
  }
});
</script>

<style scoped>
.text-block-wrapper {
  @apply w-full;
}

.text-title {
  @apply mb-3;
}

.text-content {
  @apply text-gray-700 dark:text-gray-200;
}

/* Deep styles for content */
.text-content :deep(p) {
  @apply mb-4;
}

.text-content :deep(h1) {
  @apply text-2xl font-bold mb-4 text-gray-800 dark:text-white;
}

.text-content :deep(h2) {
  @apply text-xl font-semibold mb-3 text-gray-800 dark:text-white;
}

.text-content :deep(h3) {
  @apply text-lg font-medium mb-2 text-gray-800 dark:text-white;
}

.text-content :deep(ul) {
  @apply list-disc list-inside mb-4 space-y-1;
}

.text-content :deep(ol) {
  @apply list-decimal list-inside mb-4 space-y-1;
}

.text-content :deep(li) {
  @apply mb-1;
}

.text-content :deep(a) {
  @apply text-blue-600 hover:text-blue-800 underline transition-colors;
}

.text-content :deep(strong) {
  @apply font-semibold;
}

.text-content :deep(em) {
  @apply italic;
}

.text-content :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic my-4;
}

.text-content :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
}

.text-content :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4;
}

.text-content :deep(img) {
  @apply max-w-full h-auto rounded-lg shadow-md my-4;
}
</style>