<template>
  <div class="divider-block" :class="dividerBlockClasses">
    <div v-if="localizedContent.title" class="divider-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white text-center">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div class="divider-container" :class="containerClasses">
      <!-- Line with text/icon -->
      <div v-if="dividerType === 'line-with-text' || dividerType === 'line-with-icon'" class="flex items-center">
        <div class="flex-1" :class="lineClasses"></div>
        <div v-if="dividerType === 'line-with-text' && localizedContent.text" class="px-4">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ localizedContent.text }}
          </span>
        </div>
        <div v-else-if="dividerType === 'line-with-icon' && dividerIcon" class="px-4">
          <i :class="iconClasses"></i>
        </div>
        <div class="flex-1" :class="lineClasses"></div>
      </div>

      <!-- Simple line -->
      <div v-else-if="dividerType === 'line'" :class="lineClasses"></div>

      <!-- Decorative -->
      <div v-else-if="dividerType === 'decorative'" class="flex justify-center">
        <div class="decorative-divider" :class="decorativeClasses">
          <div class="decorative-dot"></div>
          <div class="decorative-dot"></div>
          <div class="decorative-dot"></div>
        </div>
      </div>

      <!-- Wavy -->
      <div v-else-if="dividerType === 'wavy'" class="wavy-divider">
        <svg viewBox="0 0 400 20" class="w-full h-5" :class="waveClasses">
          <path d="M0,10 Q100,0 200,10 T400,10" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </div>

      <!-- Zigzag -->
      <div v-else-if="dividerType === 'zigzag'" class="zigzag-divider">
        <svg viewBox="0 0 400 20" class="w-full h-5" :class="zigzagClasses">
          <path d="M0,15 L20,5 L40,15 L60,5 L80,15 L100,5 L120,15 L140,5 L160,15 L180,5 L200,15 L220,5 L240,15 L260,5 L280,15 L300,5 L320,15 L340,5 L360,15 L380,5 L400,15" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </div>

      <!-- Space/Blank -->
      <div v-else-if="dividerType === 'space'" :class="spaceClasses"></div>
    </div>

    <div v-if="localizedContent.description" class="divider-description mt-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
        {{ localizedContent.description }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, DividerComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'DividerBlock',
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
    const localizedContent = computed((): DividerComponentContent => {
      let content: DividerComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as DividerComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.text) content.text = convertifserbian(content.text);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as DividerComponentContent;
          break;
        case 'en':
          content = props.component.content_en as DividerComponentContent;
          break;
        default:
          content = props.component.content_rs as DividerComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.text) content.text = convertifserbian(content.text);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || {};
    });

    const dividerType = computed(() => {
      return props.component.settings?.type || 'line';
    });

    const dividerIcon = computed(() => {
      return props.component.settings?.icon;
    });

    const dividerThickness = computed(() => {
      return props.component.settings?.thickness || 'medium';
    });

    const dividerColor = computed(() => {
      return props.component.settings?.color || 'gray';
    });

    const dividerBlockClasses = computed(() => {
      const classes = ['divider-wrapper'];

      const spacing = props.component.settings?.spacing || 'normal';
      switch (spacing) {
        case 'tight':
          classes.push('my-4');
          break;
        case 'loose':
          classes.push('my-12');
          break;
        default: // normal
          classes.push('my-8');
      }

      return classes.join(' ');
    });

    const containerClasses = computed(() => {
      const classes = ['divider-content'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const lineClasses = computed(() => {
      const classes = ['border-t'];

      // Thickness
      switch (dividerThickness.value) {
        case 'thin':
          classes.push('border-t');
          break;
        case 'thick':
          classes.push('border-t-4');
          break;
        default: // medium
          classes.push('border-t-2');
      }

      // Color
      switch (dividerColor.value) {
        case 'primary':
          classes.push('border-blue-500');
          break;
        case 'secondary':
          classes.push('border-purple-500');
          break;
        case 'success':
          classes.push('border-green-500');
          break;
        case 'warning':
          classes.push('border-yellow-500');
          break;
        case 'danger':
          classes.push('border-red-500');
          break;
        case 'dark':
          classes.push('border-gray-800', 'dark:border-gray-200');
          break;
        default: // gray
          classes.push('border-gray-300', 'dark:border-gray-600');
      }

      return classes.join(' ');
    });

    const iconClasses = computed(() => {
      const classes = ['text-lg'];

      if (dividerIcon.value) {
        classes.push(dividerIcon.value);
      }

      // Color
      switch (dividerColor.value) {
        case 'primary':
          classes.push('text-blue-500');
          break;
        case 'secondary':
          classes.push('text-purple-500');
          break;
        case 'success':
          classes.push('text-green-500');
          break;
        case 'warning':
          classes.push('text-yellow-500');
          break;
        case 'danger':
          classes.push('text-red-500');
          break;
        case 'dark':
          classes.push('text-gray-800', 'dark:text-gray-200');
          break;
        default: // gray
          classes.push('text-gray-500', 'dark:text-gray-400');
      }

      return classes.join(' ');
    });

    const decorativeClasses = computed(() => {
      const classes = ['flex', 'space-x-2'];

      return classes.join(' ');
    });

    const waveClasses = computed(() => {
      const classes = [];

      // Color
      switch (dividerColor.value) {
        case 'primary':
          classes.push('text-blue-500');
          break;
        case 'secondary':
          classes.push('text-purple-500');
          break;
        case 'success':
          classes.push('text-green-500');
          break;
        case 'warning':
          classes.push('text-yellow-500');
          break;
        case 'danger':
          classes.push('text-red-500');
          break;
        case 'dark':
          classes.push('text-gray-800', 'dark:text-gray-200');
          break;
        default: // gray
          classes.push('text-gray-400', 'dark:text-gray-600');
      }

      return classes.join(' ');
    });

    const zigzagClasses = computed(() => {
      return waveClasses.value; // Same as wave classes
    });

    const spaceClasses = computed(() => {
      const classes = [];

      const height = props.component.settings?.height || 'medium';
      switch (height) {
        case 'small':
          classes.push('h-4');
          break;
        case 'large':
          classes.push('h-16');
          break;
        default: // medium
          classes.push('h-8');
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      dividerType,
      dividerIcon,
      dividerBlockClasses,
      containerClasses,
      lineClasses,
      iconClasses,
      decorativeClasses,
      waveClasses,
      zigzagClasses,
      spaceClasses
    };
  }
});
</script>

<style scoped>
.divider-wrapper {
  @apply w-full;
}

.decorative-dot {
  @apply w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600;
}

/* Animation for decorative divider */
.decorative-divider .decorative-dot {
  animation: pulse 2s ease-in-out infinite;
}

.decorative-divider .decorative-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.decorative-divider .decorative-dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0%, 100% {
    @apply opacity-50 scale-100;
  }
  50% {
    @apply opacity-100 scale-110;
  }
}
</style>