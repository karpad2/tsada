<template>
  <div class="heading-block" :class="headingClasses">
    <component
      :is="headingTag"
      class="heading-text"
      :class="headingStyles"
    >
      {{ localizedContent.title }}
    </component>

    <div
      v-if="localizedContent.subtitle"
      class="heading-subtitle"
      :class="subtitleStyles"
    >
      {{ localizedContent.subtitle }}
    </div>

    <!-- Optional decorative line -->
    <div
      v-if="showDecorator"
      class="heading-decorator"
      :class="decoratorClasses"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { ContentComponent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'HeadingBlock',
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
    const localizedContent = computed(() => {
      let content: any;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.subtitle) content.subtitle = convertifserbian(content.subtitle);
          break;
        case 'hu':
          content = props.component.content_hu;
          break;
        case 'en':
          content = props.component.content_en;
          break;
        default:
          content = props.component.content_rs;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.subtitle) content.subtitle = convertifserbian(content.subtitle);
      }

      return content || { title: '', subtitle: '' };
    });

    const headingLevel = computed(() => {
      return props.component.settings?.heading_level || 1;
    });

    const headingTag = computed(() => {
      return `h${Math.min(Math.max(headingLevel.value, 1), 6)}`;
    });

    const showDecorator = computed(() => {
      return props.component.settings?.show_decorator !== false;
    });

    const headingClasses = computed(() => {
      const classes = ['heading-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      if (props.component.settings?.spacing) {
        classes.push(`spacing-${props.component.settings.spacing}`);
      }

      return classes.join(' ');
    });

    const headingStyles = computed(() => {
      const classes = ['heading-main'];
      const level = headingLevel.value;

      // Default styles based on heading level
      switch (level) {
        case 1:
          classes.push('text-4xl', 'md:text-5xl', 'font-bold', 'mb-4');
          break;
        case 2:
          classes.push('text-3xl', 'md:text-4xl', 'font-bold', 'mb-3');
          break;
        case 3:
          classes.push('text-2xl', 'md:text-3xl', 'font-semibold', 'mb-3');
          break;
        case 4:
          classes.push('text-xl', 'md:text-2xl', 'font-semibold', 'mb-2');
          break;
        case 5:
          classes.push('text-lg', 'md:text-xl', 'font-medium', 'mb-2');
          break;
        case 6:
          classes.push('text-base', 'md:text-lg', 'font-medium', 'mb-2');
          break;
      }

      // Custom color
      if (props.component.settings?.text_color) {
        // Remove default text colors and apply custom
        const filtered = classes.filter(c => !c.startsWith('text-gray') && !c.startsWith('text-black'));
        return filtered.join(' ');
      } else {
        classes.push('text-gray-900', 'dark:text-white');
      }

      return classes.join(' ');
    });

    const subtitleStyles = computed(() => {
      const classes = ['text-gray-600', 'dark:text-gray-300', 'mt-2'];

      const level = headingLevel.value;

      switch (level) {
        case 1:
          classes.push('text-lg', 'md:text-xl');
          break;
        case 2:
          classes.push('text-base', 'md:text-lg');
          break;
        case 3:
        case 4:
          classes.push('text-base');
          break;
        default:
          classes.push('text-sm');
      }

      return classes.join(' ');
    });

    const decoratorClasses = computed(() => {
      const classes = ['h-1', 'w-20', 'rounded', 'mt-3'];

      const decoratorColor = props.component.settings?.decorator_color || 'bg-blue-500';
      classes.push(decoratorColor);

      if (props.component.settings?.alignment === 'center') {
        classes.push('mx-auto');
      } else if (props.component.settings?.alignment === 'right') {
        classes.push('ml-auto');
      }

      return classes.join(' ');
    });

    return {
      localizedContent,
      headingTag,
      showDecorator,
      headingClasses,
      headingStyles,
      subtitleStyles,
      decoratorClasses
    };
  }
});
</script>

<style scoped>
.heading-wrapper {
  @apply w-full mb-6;
}

.heading-main {
  @apply leading-tight;
}

.heading-subtitle {
  @apply leading-relaxed;
}

.heading-decorator {
  @apply transition-all duration-300;
}

/* Spacing variants */
.spacing-tight {
  @apply mb-3;
}

.spacing-normal {
  @apply mb-6;
}

.spacing-loose {
  @apply mb-12;
}
</style>