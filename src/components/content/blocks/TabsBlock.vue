<template>
  <div class="tabs-block" :class="tabsBlockClasses">
    <div v-if="localizedContent.title" class="tabs-title mb-6">
      <h3 class="text-2xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="tabs-description mb-6">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <div class="tabs-container" :class="containerClasses">
      <!-- Tab Navigation -->
      <div class="tabs-nav" :class="navClasses">
        <button
          v-for="(tab, index) in tabsData"
          :key="tab.id"
          @click="setActiveTab(index)"
          class="tab-button"
          :class="getTabButtonClasses(index)"
          :aria-selected="activeTab === index"
          :aria-controls="`tab-panel-${index}`"
          role="tab"
        >
          <i v-if="tab.icon" :class="tab.icon" class="mr-2"></i>
          {{ tab.title }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tabs-content" :class="contentClasses">
        <div
          v-for="(tab, index) in tabsData"
          :key="tab.id"
          v-show="activeTab === index"
          :id="`tab-panel-${index}`"
          class="tab-panel"
          :class="panelClasses"
          role="tabpanel"
          :aria-labelledby="`tab-${index}`"
        >
          <div v-html="tab.content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import type { ContentComponent, TabsComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'TabsBlock',
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
    const activeTab = ref(0);

    const localizedContent = computed((): TabsComponentContent => {
      let content: TabsComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as TabsComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.tabs) {
            content.tabs = content.tabs.map(tab => ({
              ...tab,
              title: convertifserbian(tab.title),
              content: convertifserbian(tab.content)
            }));
          }
          break;
        case 'hu':
          content = props.component.content_hu as TabsComponentContent;
          break;
        case 'en':
          content = props.component.content_en as TabsComponentContent;
          break;
        default:
          content = props.component.content_rs as TabsComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.tabs) {
            content.tabs = content.tabs.map(tab => ({
              ...tab,
              title: convertifserbian(tab.title),
              content: convertifserbian(tab.content)
            }));
          }
      }

      return content || {
        tabs: [],
        position: 'top',
        style: 'default'
      };
    });

    const tabsData = computed(() => {
      return localizedContent.value.tabs || [];
    });

    const tabsPosition = computed(() => {
      return localizedContent.value.position || 'top';
    });

    const tabsStyle = computed(() => {
      return localizedContent.value.style || 'default';
    });

    const setActiveTab = (index: number) => {
      activeTab.value = index;
    };

    const tabsBlockClasses = computed(() => {
      const classes = ['tabs-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const containerClasses = computed(() => {
      const classes = ['tabs-main'];

      switch (tabsPosition.value) {
        case 'left':
          classes.push('flex', 'flex-col', 'md:flex-row');
          break;
        case 'right':
          classes.push('flex', 'flex-col', 'md:flex-row-reverse');
          break;
        case 'bottom':
          classes.push('flex', 'flex-col-reverse');
          break;
        default: // top
          classes.push('flex', 'flex-col');
      }

      return classes.join(' ');
    });

    const navClasses = computed(() => {
      const classes = ['tabs-navigation'];

      switch (tabsPosition.value) {
        case 'left':
        case 'right':
          classes.push('flex', 'flex-col', 'md:w-1/4', 'mb-4', 'md:mb-0');
          if (tabsPosition.value === 'right') {
            classes.push('md:ml-4');
          } else {
            classes.push('md:mr-4');
          }
          break;
        case 'bottom':
          classes.push('flex', 'mt-4');
          break;
        default: // top
          classes.push('flex', 'mb-4');
      }

      // Add style-specific classes
      switch (tabsStyle.value) {
        case 'pills':
          classes.push('tabs-pills');
          break;
        case 'underline':
          classes.push('tabs-underline', 'border-b', 'border-gray-200', 'dark:border-gray-700');
          break;
        default: // default
          classes.push('tabs-default');
      }

      return classes.join(' ');
    });

    const getTabButtonClasses = (index: number) => {
      const classes = [
        'tab-btn',
        'px-4',
        'py-2',
        'font-medium',
        'text-sm',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:ring-opacity-50',
        'transition-all',
        'duration-200'
      ];

      const isActive = activeTab.value === index;

      switch (tabsStyle.value) {
        case 'pills':
          classes.push('rounded-full', 'mr-2', 'mb-2');
          if (isActive) {
            classes.push('bg-blue-500', 'text-white');
          } else {
            classes.push('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
          }
          break;
        case 'underline':
          classes.push('border-b-2', 'mr-6', 'pb-2');
          if (isActive) {
            classes.push('border-blue-500', 'text-blue-600', 'dark:text-blue-400');
          } else {
            classes.push('border-transparent', 'text-gray-500', 'dark:text-gray-400', 'hover:text-gray-700', 'dark:hover:text-gray-300', 'hover:border-gray-300', 'dark:hover:border-gray-600');
          }
          break;
        default: // default
          classes.push('rounded-lg', 'mr-2', 'mb-2');
          if (isActive) {
            classes.push('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-700', 'dark:text-blue-300', 'border', 'border-blue-200', 'dark:border-blue-800');
          } else {
            classes.push('text-gray-500', 'dark:text-gray-400', 'hover:text-gray-700', 'dark:hover:text-gray-300', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');
          }
      }

      return classes.join(' ');
    };

    const contentClasses = computed(() => {
      const classes = ['tabs-content-area'];

      switch (tabsPosition.value) {
        case 'left':
        case 'right':
          classes.push('flex-1');
          break;
        default:
          classes.push('w-full');
      }

      return classes.join(' ');
    });

    const panelClasses = computed(() => {
      const classes = ['tab-content-panel'];

      const contentStyle = props.component.settings?.content_style || 'default';
      switch (contentStyle) {
        case 'bordered':
          classes.push('border', 'border-gray-200', 'dark:border-gray-700', 'rounded-lg', 'p-4');
          break;
        case 'card':
          classes.push('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-lg', 'p-6');
          break;
        case 'minimal':
          classes.push('pt-4');
          break;
        default:
          classes.push('p-4', 'bg-gray-50', 'dark:bg-gray-800', 'rounded-lg');
      }

      return classes.join(' ');
    });

    return {
      activeTab,
      localizedContent,
      tabsData,
      tabsPosition,
      tabsStyle,
      setActiveTab,
      tabsBlockClasses,
      containerClasses,
      navClasses,
      getTabButtonClasses,
      contentClasses,
      panelClasses
    };
  }
});
</script>

<style scoped>
.tabs-wrapper {
  @apply w-full mb-8;
}

.tab-btn {
  @apply cursor-pointer;
}

.tab-btn:hover {
  @apply transition-all duration-200;
}

.tab-btn:focus {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tabs-navigation {
    flex-direction: column;
  }

  .tabs-navigation .tab-btn {
    width: 100%;
    margin-bottom: 0.5rem;
    margin-right: 0;
  }

  .tabs-main {
    flex-direction: column;
  }
}

/* Content styling */
.tab-content-panel :deep(h1),
.tab-content-panel :deep(h2),
.tab-content-panel :deep(h3),
.tab-content-panel :deep(h4),
.tab-content-panel :deep(h5),
.tab-content-panel :deep(h6) {
  @apply font-semibold text-gray-900 dark:text-white mb-3;
}

.tab-content-panel :deep(p) {
  @apply mb-4 leading-relaxed text-gray-700 dark:text-gray-300;
}

.tab-content-panel :deep(ul),
.tab-content-panel :deep(ol) {
  @apply ml-4 mb-4;
}

.tab-content-panel :deep(li) {
  @apply mb-1;
}

.tab-content-panel :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.tab-content-panel :deep(strong) {
  @apply font-semibold;
}

.tab-content-panel :deep(em) {
  @apply italic;
}

.tab-content-panel :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
}

.tab-content-panel :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto;
}

.tab-content-panel :deep(blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-4;
}

.tab-content-panel :deep(img) {
  @apply max-w-full h-auto rounded-lg;
}

/* Animation for tab content */
.tab-content-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>