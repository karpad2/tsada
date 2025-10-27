<template>
  <div class="rich-text-editor-wrapper">
    <div v-if="showLabel" class="editor-label mb-2">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
        <span v-if="required" class="text-red-500 ml-1">*</span>
      </label>
    </div>

    <div
      class="rich-text-editor"
      :class="{
        'editor-focused': isFocused,
        'editor-error': hasError,
        'editor-disabled': disabled
      }"
    >
      <QuillEditor
        ref="quillRef"
        v-model:content="modelValue"
        :options="editorOptions"
        :placeholder="placeholder"
        :enable="!disabled"
        @focus="handleFocus"
        @blur="handleBlur"
        @textChange="handleTextChange"
        @ready="handleReady"
        content-type="html"
        class="custom-quill-editor"
      />

      <!-- Character Count -->
      <div v-if="showCharCount" class="char-count mt-2 text-right">
        <span
          class="text-xs"
          :class="isOverLimit ? 'text-red-500' : 'text-gray-500'"
        >
          {{ characterCount }}{{ maxLength ? `/${maxLength}` : '' }}
        </span>
      </div>

      <!-- Error Messages -->
      <div v-if="errorMessages && errorMessages.length > 0" class="error-messages mt-1">
        <div
          v-for="error in errorMessages"
          :key="error"
          class="text-xs text-red-500"
        >
          {{ error }}
        </div>
      </div>

      <!-- Hint Text -->
      <div v-if="hint && !hasError" class="hint-text mt-1">
        <div class="text-xs text-gray-500">
          {{ hint }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, nextTick } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';

export default defineComponent({
  name: 'RichTextEditor',
  components: {
    QuillEditor
  },
  emits: ['update:modelValue', 'focus', 'blur', 'change', 'ready'],
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Írj valamit...'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    maxLength: {
      type: Number,
      default: null
    },
    minHeight: {
      type: String,
      default: '150px'
    },
    toolbar: {
      type: [String, Array],
      default: 'essential'
    },
    theme: {
      type: String,
      default: 'snow'
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    showCharCount: {
      type: Boolean,
      default: false
    },
    errorMessages: {
      type: Array as () => string[],
      default: () => []
    },
    hint: {
      type: String,
      default: ''
    },
    autoFocus: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const quillRef = ref(null);
    const isFocused = ref(false);

    // Toolbar configurations
    const toolbarConfigs = {
      minimal: [
        ['bold', 'italic', 'underline'],
        ['link']
      ],
      essential: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      full: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'header': 1 }, { 'header': 2 }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      simple: [
        ['bold', 'italic'],
        ['link'],
        ['clean']
      ]
    };

    // Computed properties
    const hasError = computed(() => {
      return props.errorMessages && props.errorMessages.length > 0;
    });

    const characterCount = computed(() => {
      // Remove HTML tags for character count
      const div = document.createElement('div');
      div.innerHTML = props.modelValue || '';
      return div.textContent?.length || 0;
    });

    const isOverLimit = computed(() => {
      return props.maxLength && characterCount.value > props.maxLength;
    });

    const editorOptions = computed(() => {
      let toolbar = props.toolbar;

      // If toolbar is a string, get predefined config
      if (typeof toolbar === 'string' && toolbarConfigs[toolbar as keyof typeof toolbarConfigs]) {
        toolbar = toolbarConfigs[toolbar as keyof typeof toolbarConfigs];
      }

      return {
        theme: props.theme,
        placeholder: props.placeholder,
        modules: {
          toolbar: toolbar,
          history: {
            delay: 1000,
            maxStack: 50,
            userOnly: true
          }
        },
        formats: [
          'header', 'font', 'size',
          'bold', 'italic', 'underline', 'strike',
          'color', 'background',
          'script',
          'blockquote', 'code-block',
          'list', 'bullet', 'indent',
          'direction', 'align',
          'link', 'image', 'video'
        ]
      };
    });

    // Methods
    const handleFocus = () => {
      isFocused.value = true;
      emit('focus');
    };

    const handleBlur = () => {
      isFocused.value = false;
      emit('blur');
    };

    const handleTextChange = (delta: any, oldDelta: any, source: string) => {
      // Validate max length
      if (props.maxLength && characterCount.value > props.maxLength) {
        // Could implement length limiting here if needed
      }

      emit('change', { delta, oldDelta, source });
    };

    const handleReady = (quill: any) => {
      if (props.autoFocus) {
        nextTick(() => {
          quill.focus();
        });
      }
      emit('ready', quill);
    };

    const focus = () => {
      if (quillRef.value) {
        (quillRef.value as any).focus();
      }
    };

    const blur = () => {
      if (quillRef.value) {
        (quillRef.value as any).blur();
      }
    };

    const getQuill = () => {
      return quillRef.value ? (quillRef.value as any).getQuill() : null;
    };

    // Watch for style changes
    onMounted(() => {
      // Apply custom min-height
      nextTick(() => {
        const editor = document.querySelector('.custom-quill-editor .ql-editor');
        if (editor) {
          (editor as HTMLElement).style.minHeight = props.minHeight;
        }
      });
    });

    return {
      quillRef,
      isFocused,
      hasError,
      characterCount,
      isOverLimit,
      editorOptions,
      handleFocus,
      handleBlur,
      handleTextChange,
      handleReady,
      focus,
      blur,
      getQuill
    };
  }
});
</script>

<style scoped>
.rich-text-editor-wrapper {
  @apply w-full;
}

.editor-label {
  @apply block;
}

.rich-text-editor {
  @apply relative transition-all duration-200;
}

.rich-text-editor.editor-focused {
  @apply ring-2 ring-blue-500 ring-opacity-50 rounded-lg;
}

.rich-text-editor.editor-error {
  @apply ring-2 ring-red-500 ring-opacity-50 rounded-lg;
}

.rich-text-editor.editor-disabled {
  @apply opacity-60 cursor-not-allowed;
}

.char-count {
  @apply text-xs text-right;
}

.error-messages {
  @apply space-y-1;
}

.hint-text {
  @apply text-xs;
}

/* Quill editor customizations */
:deep(.custom-quill-editor) {
  @apply border border-gray-300 rounded-lg overflow-hidden;
}

:deep(.custom-quill-editor .ql-toolbar) {
  @apply border-b border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600;
}

:deep(.custom-quill-editor .ql-editor) {
  @apply text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900;
  font-family: inherit;
  line-height: 1.6;
}

:deep(.custom-quill-editor .ql-editor.ql-blank::before) {
  @apply text-gray-400 dark:text-gray-500 italic;
}

:deep(.custom-quill-editor .ql-snow .ql-tooltip) {
  @apply bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg;
}

:deep(.custom-quill-editor .ql-snow .ql-tooltip input) {
  @apply bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
}

/* Toolbar button styling */
:deep(.custom-quill-editor .ql-toolbar button) {
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors;
}

:deep(.custom-quill-editor .ql-toolbar button.ql-active) {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400;
}

/* Dark mode adjustments */
.dark :deep(.custom-quill-editor) {
  @apply border-gray-600;
}

.dark :deep(.custom-quill-editor .ql-toolbar) {
  @apply border-gray-600 bg-gray-800;
}

.dark :deep(.custom-quill-editor .ql-editor) {
  @apply bg-gray-900 text-gray-100;
}

/* Focus state */
.editor-focused :deep(.custom-quill-editor) {
  @apply border-blue-500;
}

.editor-focused :deep(.custom-quill-editor .ql-toolbar) {
  @apply border-blue-500;
}

/* Error state */
.editor-error :deep(.custom-quill-editor) {
  @apply border-red-500;
}

.editor-error :deep(.custom-quill-editor .ql-toolbar) {
  @apply border-red-500;
}

/* Disabled state */
.editor-disabled :deep(.custom-quill-editor) {
  @apply opacity-60;
}

.editor-disabled :deep(.custom-quill-editor .ql-editor) {
  @apply cursor-not-allowed;
}
</style>