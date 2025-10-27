<template>
  <div class="accordion-block" :class="accordionBlockClasses">
    <div v-if="localizedContent.title" class="accordion-title mb-6">
      <h3 class="text-2xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="accordion-description mb-6">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <div class="accordion-container" :class="containerClasses">
      <div
        v-for="(item, index) in accordionItems"
        :key="item.id"
        class="accordion-item"
        :class="getItemClasses(index)"
      >
        <!-- Accordion Header -->
        <button
          @click="toggleItem(index)"
          class="accordion-header"
          :class="headerClasses"
          :aria-expanded="isOpen(index)"
          :aria-controls="`accordion-content-${index}`"
        >
          <div class="flex items-center justify-between w-full">
            <span class="accordion-title-text">{{ item.title }}</span>
            <div class="accordion-icon" :class="{ 'transform rotate-180': isOpen(index) }">
              <i class="pi pi-chevron-down transition-transform duration-200"></i>
            </div>
          </div>
        </button>

        <!-- Accordion Content -->
        <div
          :id="`accordion-content-${index}`"
          class="accordion-content"
          :class="contentClasses"
          :style="getContentStyle(index)"
        >
          <div class="accordion-content-inner" :class="contentInnerClasses">
            <div v-html="item.content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import type { ContentComponent, AccordionComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'AccordionBlock',
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
    const openItems = ref<Set<number>>(new Set());

    const localizedContent = computed((): AccordionComponentContent => {
      let content: AccordionComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as AccordionComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.items) {
            content.items = content.items.map(item => ({
              ...item,
              title: convertifserbian(item.title),
              content: convertifserbian(item.content)
            }));
          }
          break;
        case 'hu':
          content = props.component.content_hu as AccordionComponentContent;
          break;
        case 'en':
          content = props.component.content_en as AccordionComponentContent;
          break;
        default:
          content = props.component.content_rs as AccordionComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.items) {
            content.items = content.items.map(item => ({
              ...item,
              title: convertifserbian(item.title),
              content: convertifserbian(item.content)
            }));
          }
      }

      return content || {
        items: [],
        allow_multiple: false,
        style: 'default'
      };
    });

    const accordionItems = computed(() => {
      return localizedContent.value.items || [];
    });

    const allowMultiple = computed(() => {
      return localizedContent.value.allow_multiple === true;
    });

    const accordionStyle = computed(() => {
      return localizedContent.value.style || 'default';
    });

    // Initialize open items based on default settings
    const initializeOpenItems = () => {
      accordionItems.value.forEach((item, index) => {
        if (item.open_by_default) {
          openItems.value.add(index);
        }
      });
    };

    // Initialize on first render
    initializeOpenItems();

    const isOpen = (index: number): boolean => {
      return openItems.value.has(index);
    };

    const toggleItem = (index: number) => {
      if (isOpen(index)) {
        openItems.value.delete(index);
      } else {
        if (!allowMultiple.value) {
          // Close all other items if multiple is not allowed
          openItems.value.clear();
        }
        openItems.value.add(index);
      }
    };

    const accordionBlockClasses = computed(() => {
      const classes = ['accordion-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const containerClasses = computed(() => {
      const classes = ['accordion-list'];

      const spacing = props.component.settings?.spacing || 'normal';
      switch (spacing) {
        case 'tight':
          classes.push('space-y-1');
          break;
        case 'loose':
          classes.push('space-y-4');
          break;
        default: // normal
          classes.push('space-y-2');
      }

      return classes.join(' ');
    });

    const getItemClasses = (index: number) => {
      const classes = ['accordion-single-item'];

      switch (accordionStyle.value) {
        case 'bordered':
          classes.push('border', 'border-gray-200', 'dark:border-gray-700', 'rounded-lg');
          if (index === 0) classes.push('rounded-t-lg');
          if (index === accordionItems.value.length - 1) classes.push('rounded-b-lg');
          break;
        case 'filled':
          classes.push('bg-gray-50', 'dark:bg-gray-800', 'rounded-lg');
          break;
        default: // default
          classes.push('border-b', 'border-gray-200', 'dark:border-gray-700');
          if (index === accordionItems.value.length - 1) classes.push('border-b-0');
      }

      return classes.join(' ');
    };

    const headerClasses = computed(() => {
      const classes = [
        'w-full',
        'text-left',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:ring-opacity-50',
        'transition-colors',
        'duration-200'
      ];

      switch (accordionStyle.value) {
        case 'bordered':
        case 'filled':
          classes.push('px-4', 'py-3', 'font-medium', 'text-gray-900', 'dark:text-white', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
          break;
        default: // default
          classes.push('py-4', 'font-medium', 'text-gray-900', 'dark:text-white', 'hover:text-blue-600', 'dark:hover:text-blue-400');
      }

      return classes.join(' ');
    });

    const contentClasses = computed(() => {
      const classes = ['accordion-content-wrapper', 'overflow-hidden', 'transition-all', 'duration-300', 'ease-in-out'];

      return classes.join(' ');
    });

    const contentInnerClasses = computed(() => {
      const classes = ['accordion-inner'];

      switch (accordionStyle.value) {
        case 'bordered':
        case 'filled':
          classes.push('px-4', 'pb-3');
          break;
        default: // default
          classes.push('pb-4');
      }

      return classes.join(' ');
    });

    const getContentStyle = (index: number) => {
      if (isOpen(index)) {
        return {
          maxHeight: '1000px', // Arbitrary large value
          opacity: '1'
        };
      } else {
        return {
          maxHeight: '0px',
          opacity: '0'
        };
      }
    };

    return {
      openItems,
      localizedContent,
      accordionItems,
      allowMultiple,
      accordionStyle,
      isOpen,
      toggleItem,
      accordionBlockClasses,
      containerClasses,
      getItemClasses,
      headerClasses,
      contentClasses,
      contentInnerClasses,
      getContentStyle
    };
  }
});
</script>

<style scoped>
.accordion-wrapper {
  @apply w-full mb-8;
}

.accordion-title-text {
  @apply text-base font-medium;
}

.accordion-icon {
  @apply flex-shrink-0 ml-2;
}

.accordion-content-wrapper {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

.accordion-inner {
  @apply text-gray-700 dark:text-gray-300 leading-relaxed;
}

/* Enhanced focus styles */
.accordion-header:focus {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

/* Hover effects */
.accordion-single-item:hover .accordion-header {
  @apply transition-colors duration-200;
}

/* Style-specific enhancements */
.accordion-single-item.border {
  @apply overflow-hidden;
}

.accordion-single-item.bg-gray-50 {
  @apply transition-colors duration-200;
}

.accordion-single-item.bg-gray-50:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}

/* Content styling */
.accordion-inner :deep(h1),
.accordion-inner :deep(h2),
.accordion-inner :deep(h3),
.accordion-inner :deep(h4),
.accordion-inner :deep(h5),
.accordion-inner :deep(h6) {
  @apply font-semibold text-gray-900 dark:text-white mb-2;
}

.accordion-inner :deep(p) {
  @apply mb-3;
}

.accordion-inner :deep(ul),
.accordion-inner :deep(ol) {
  @apply ml-4 mb-3;
}

.accordion-inner :deep(li) {
  @apply mb-1;
}

.accordion-inner :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.accordion-inner :deep(strong) {
  @apply font-semibold;
}

.accordion-inner :deep(em) {
  @apply italic;
}

.accordion-inner :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono;
}

.accordion-inner :deep(blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic;
}
</style>