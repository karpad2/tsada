<template>
  <div class="button-block" :class="buttonBlockClasses">
    <div v-if="localizedContent.title" class="button-title mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div class="button-container" :class="containerClasses">
      <component
        :is="buttonComponent"
        :to="buttonLink"
        :href="buttonLink"
        :target="linkTarget"
        :rel="linkRel"
        class="button-element"
        :class="buttonClasses"
        @click="handleClick"
      >
        <i v-if="buttonIcon" :class="iconClasses" class="mr-2"></i>
        {{ localizedContent.text }}
        <i v-if="showArrow" class="pi pi-arrow-right ml-2"></i>
      </component>
    </div>

    <div v-if="localizedContent.description" class="button-description mt-3">
      <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
        {{ localizedContent.description }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent, ButtonComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'ButtonBlock',
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
    const localizedContent = computed((): ButtonComponentContent => {
      let content: ButtonComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as ButtonComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.text) content.text = convertifserbian(content.text);
          if (content.description) content.description = convertifserbian(content.description);
          break;
        case 'hu':
          content = props.component.content_hu as ButtonComponentContent;
          break;
        case 'en':
          content = props.component.content_en as ButtonComponentContent;
          break;
        default:
          content = props.component.content_rs as ButtonComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.text) content.text = convertifserbian(content.text);
          if (content.description) content.description = convertifserbian(content.description);
      }

      return content || { text: 'Button' };
    });

    const buttonType = computed(() => {
      return props.component.settings?.button_type || 'button';
    });

    const buttonStyle = computed(() => {
      return props.component.settings?.style || 'primary';
    });

    const buttonSize = computed(() => {
      return props.component.settings?.size || 'medium';
    });

    const buttonIcon = computed(() => {
      return props.component.settings?.icon;
    });

    const showArrow = computed(() => {
      return props.component.settings?.show_arrow === true;
    });

    const isExternal = computed(() => {
      const url = localizedContent.value.url || '';
      return url.startsWith('http') || url.startsWith('//');
    });

    const buttonComponent = computed(() => {
      if (buttonType.value === 'link' && localizedContent.value.url) {
        return isExternal.value ? 'a' : 'router-link';
      }
      return 'button';
    });

    const buttonLink = computed(() => {
      if (buttonType.value === 'link' && localizedContent.value.url) {
        return localizedContent.value.url;
      }
      return undefined;
    });

    const linkTarget = computed(() => {
      if (isExternal.value && props.component.settings?.open_in_new_tab !== false) {
        return '_blank';
      }
      return undefined;
    });

    const linkRel = computed(() => {
      if (isExternal.value) {
        return 'noopener noreferrer';
      }
      return undefined;
    });

    const buttonBlockClasses = computed(() => {
      const classes = ['button-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const containerClasses = computed(() => {
      const classes = [];

      if (props.component.settings?.alignment === 'center') {
        classes.push('flex', 'justify-center');
      } else if (props.component.settings?.alignment === 'right') {
        classes.push('flex', 'justify-end');
      } else if (props.component.settings?.alignment === 'left') {
        classes.push('flex', 'justify-start');
      }

      return classes.join(' ');
    });

    const buttonClasses = computed(() => {
      const classes = ['inline-flex', 'items-center', 'justify-center', 'font-medium', 'transition-all', 'duration-200', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2'];

      // Size classes
      switch (buttonSize.value) {
        case 'small':
          classes.push('px-3', 'py-1.5', 'text-sm');
          break;
        case 'large':
          classes.push('px-6', 'py-3', 'text-lg');
          break;
        default: // medium
          classes.push('px-4', 'py-2', 'text-base');
      }

      // Style classes
      switch (buttonStyle.value) {
        case 'secondary':
          classes.push('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:text-white', 'dark:hover:bg-gray-600', 'focus:ring-gray-500');
          break;
        case 'outline':
          classes.push('border-2', 'border-blue-500', 'text-blue-500', 'hover:bg-blue-500', 'hover:text-white', 'dark:border-blue-400', 'dark:text-blue-400', 'dark:hover:bg-blue-400', 'dark:hover:text-gray-900', 'focus:ring-blue-500');
          break;
        case 'ghost':
          classes.push('text-blue-500', 'hover:bg-blue-50', 'dark:text-blue-400', 'dark:hover:bg-blue-900/20', 'focus:ring-blue-500');
          break;
        case 'danger':
          classes.push('bg-red-500', 'text-white', 'hover:bg-red-600', 'dark:bg-red-600', 'dark:hover:bg-red-700', 'focus:ring-red-500');
          break;
        case 'success':
          classes.push('bg-green-500', 'text-white', 'hover:bg-green-600', 'dark:bg-green-600', 'dark:hover:bg-green-700', 'focus:ring-green-500');
          break;
        default: // primary
          classes.push('bg-blue-500', 'text-white', 'hover:bg-blue-600', 'dark:bg-blue-600', 'dark:hover:bg-blue-700', 'focus:ring-blue-500');
      }

      // Shape classes
      const shape = props.component.settings?.shape || 'rounded';
      switch (shape) {
        case 'square':
          // No border radius
          break;
        case 'pill':
          classes.push('rounded-full');
          break;
        default: // rounded
          classes.push('rounded-md');
      }

      // Full width
      if (props.component.settings?.full_width) {
        classes.push('w-full');
      }

      // Disabled state
      if (props.component.settings?.disabled) {
        classes.push('opacity-50', 'cursor-not-allowed');
      }

      return classes.join(' ');
    });

    const iconClasses = computed(() => {
      const classes = [];

      if (buttonIcon.value) {
        classes.push(buttonIcon.value);
      }

      return classes.join(' ');
    });

    const handleClick = (event: Event) => {
      if (props.component.settings?.disabled) {
        event.preventDefault();
        return;
      }

      if (buttonType.value === 'submit') {
        // Handle form submission
        const form = (event.target as HTMLElement).closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      } else if (buttonType.value === 'button' && localizedContent.value.action) {
        // Handle custom action
        console.log('Button action:', localizedContent.value.action);
      }
    };

    return {
      localizedContent,
      buttonComponent,
      buttonLink,
      linkTarget,
      linkRel,
      buttonIcon,
      showArrow,
      buttonBlockClasses,
      containerClasses,
      buttonClasses,
      iconClasses,
      handleClick
    };
  }
});
</script>

<style scoped>
.button-wrapper {
  @apply w-full mb-6;
}

.button-element {
  @apply no-underline;
}

.button-element:focus {
  @apply ring-2 ring-offset-2;
}

/* Custom hover effects */
.button-element:hover {
  @apply transform scale-105;
}

.button-element:active {
  @apply transform scale-95;
}
</style>