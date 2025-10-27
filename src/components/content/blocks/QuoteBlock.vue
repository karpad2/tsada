<template>
  <div class="quote-block" :class="quoteBlockClasses">
    <div v-if="localizedContent.title" class="quote-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <blockquote class="quote-container" :class="quoteClasses">
      <!-- Quote Icon -->
      <div v-if="showQuoteIcon" class="quote-icon" :class="iconClasses">
        <i class="pi pi-quote-left"></i>
      </div>

      <!-- Quote Text -->
      <div class="quote-content">
        <p class="quote-text" :class="textClasses">
          {{ localizedContent.text }}
        </p>

        <!-- Citation -->
        <div v-if="localizedContent.author || localizedContent.source" class="quote-citation" :class="citationClasses">
          <span v-if="localizedContent.author" class="author">
            {{ localizedContent.author }}
          </span>
          <span v-if="localizedContent.source" class="source">
            <span v-if="localizedContent.author">, </span>
            <cite>{{ localizedContent.source }}</cite>
          </span>
        </div>
      </div>

      <!-- Avatar/Image -->
      <div v-if="authorImage" class="quote-avatar">
        <img
          :src="authorImage"
          :alt="localizedContent.author || 'Author'"
          class="avatar-image"
        />
      </div>
    </blockquote>

    <div v-if="localizedContent.description" class="quote-description mt-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ localizedContent.description }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { Storage } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent, QuoteComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'QuoteBlock',
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
    const localizedContent = computed((): QuoteComponentContent => {
      let content: QuoteComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as QuoteComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.text) content.text = convertifserbian(content.text);
          if (content.author) content.author = convertifserbian(content.author);
          if (content.source) content.source = convertifserbian(content.source);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as QuoteComponentContent;
          break;
        case 'en':
          content = props.component.content_en as QuoteComponentContent;
          break;
        default:
          content = props.component.content_rs as QuoteComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.text) content.text = convertifserbian(content.text);
          if (content.author) content.author = convertifserbian(content.author);
          if (content.source) content.source = convertifserbian(content.source);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || { text: '' };
    });

    const quoteStyle = computed(() => {
      return props.component.settings?.style || 'default';
    });

    const showQuoteIcon = computed(() => {
      return props.component.settings?.show_icon !== false;
    });

    const authorImage = computed(() => {
      if (localizedContent.value.author_image_url) {
        return localizedContent.value.author_image_url;
      }

      if (localizedContent.value.author_image_id) {
        try {
          const storage = new Storage(appw);
          return storage.getFileView(config.website_images, localizedContent.value.author_image_id).href;
        } catch (error) {
          console.error('Error getting author image URL:', error);
          return null;
        }
      }

      return null;
    });

    const quoteBlockClasses = computed(() => {
      const classes = ['quote-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const quoteClasses = computed(() => {
      const classes = ['relative', 'p-6', 'rounded-lg', 'mb-6'];

      switch (quoteStyle.value) {
        case 'bordered':
          classes.push('border-l-4', 'border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20', 'pl-6');
          break;
        case 'highlighted':
          classes.push('bg-yellow-50', 'dark:bg-yellow-900/20', 'border', 'border-yellow-200', 'dark:border-yellow-800');
          break;
        case 'card':
          classes.push('bg-white', 'dark:bg-gray-800', 'shadow-lg', 'border', 'border-gray-200', 'dark:border-gray-700');
          break;
        case 'minimal':
          classes.push('border-l-2', 'border-gray-300', 'dark:border-gray-600', 'pl-4', 'italic');
          break;
        case 'colorful':
          classes.push('bg-gradient-to-r', 'from-purple-400', 'via-pink-500', 'to-red-500', 'text-white', 'p-8');
          break;
        default: // default
          classes.push('bg-gray-50', 'dark:bg-gray-800', 'border', 'border-gray-200', 'dark:border-gray-700');
      }

      // Layout for quotes with avatars
      if (authorImage.value) {
        classes.push('flex', 'items-start', 'space-x-4');
      }

      return classes.join(' ');
    });

    const iconClasses = computed(() => {
      const classes = ['absolute', 'top-4', 'left-4', 'text-3xl', 'opacity-20'];

      switch (quoteStyle.value) {
        case 'bordered':
          classes.push('text-blue-500');
          break;
        case 'highlighted':
          classes.push('text-yellow-600');
          break;
        case 'colorful':
          classes.push('text-white');
          break;
        default:
          classes.push('text-gray-400');
      }

      return classes.join(' ');
    });

    const textClasses = computed(() => {
      const classes = ['quote-main-text', 'leading-relaxed'];

      const size = props.component.settings?.text_size || 'medium';
      switch (size) {
        case 'small':
          classes.push('text-base');
          break;
        case 'large':
          classes.push('text-xl', 'md:text-2xl');
          break;
        default: // medium
          classes.push('text-lg');
      }

      switch (quoteStyle.value) {
        case 'colorful':
          classes.push('text-white');
          break;
        case 'minimal':
          classes.push('italic');
          break;
        default:
          classes.push('text-gray-800', 'dark:text-gray-200');
      }

      // Add quote marks for certain styles
      if (props.component.settings?.add_quotes !== false && quoteStyle.value !== 'minimal') {
        classes.push('quote-marks');
      }

      return classes.join(' ');
    });

    const citationClasses = computed(() => {
      const classes = ['mt-4', 'text-sm', 'font-medium'];

      switch (quoteStyle.value) {
        case 'colorful':
          classes.push('text-white', 'opacity-90');
          break;
        default:
          classes.push('text-gray-600', 'dark:text-gray-400');
      }

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      } else {
        classes.push('text-right');
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      showQuoteIcon,
      authorImage,
      quoteBlockClasses,
      quoteClasses,
      iconClasses,
      textClasses,
      citationClasses
    };
  }
});
</script>

<style scoped>
.quote-wrapper {
  @apply w-full mb-8;
}

.quote-marks::before {
  content: '"';
  @apply text-4xl leading-none opacity-50 mr-1;
}

.quote-marks::after {
  content: '"';
  @apply text-4xl leading-none opacity-50 ml-1;
}

.avatar-image {
  @apply w-16 h-16 rounded-full object-cover border-2 border-white shadow-md;
}

.quote-content {
  @apply flex-1;
}

.author {
  @apply font-semibold;
}

.source {
  @apply font-normal;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .quote-container.flex {
    @apply flex-col space-x-0 space-y-4;
  }

  .avatar-image {
    @apply w-12 h-12 mx-auto;
  }
}
</style>