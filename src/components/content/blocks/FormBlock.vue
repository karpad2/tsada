<template>
  <div class="form-block" :class="formBlockClasses">
    <div v-if="localizedContent.title" class="form-title mb-6">
      <h3 class="text-2xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="form-description mb-6">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="form-container" :class="formClasses">
      <!-- Form Fields -->
      <div
        v-for="field in formFields"
        :key="field.id"
        class="form-field mb-4"
        :class="getFieldClasses(field)"
      >
        <label
          :for="field.id"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>

        <!-- Text Input -->
        <input
          v-if="field.type === 'text' || field.type === 'email'"
          :id="field.id"
          v-model="formData[field.name]"
          :type="field.type"
          :name="field.name"
          :placeholder="field.placeholder"
          :required="field.required"
          class="form-input"
          :class="inputClasses"
        />

        <!-- Textarea -->
        <textarea
          v-else-if="field.type === 'textarea'"
          :id="field.id"
          v-model="formData[field.name]"
          :name="field.name"
          :placeholder="field.placeholder"
          :required="field.required"
          rows="4"
          class="form-input"
          :class="inputClasses"
        />

        <!-- Select -->
        <select
          v-else-if="field.type === 'select'"
          :id="field.id"
          v-model="formData[field.name]"
          :name="field.name"
          :required="field.required"
          class="form-input"
          :class="inputClasses"
        >
          <option value="">{{ $t('select_option') }}</option>
          <option
            v-for="option in field.options"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>

        <!-- Checkbox -->
        <div v-else-if="field.type === 'checkbox'" class="form-checkbox-group">
          <div
            v-for="option in field.options"
            :key="option"
            class="flex items-center mb-2"
          >
            <input
              :id="`${field.id}_${option}`"
              v-model="formData[field.name]"
              type="checkbox"
              :value="option"
              class="form-checkbox"
            />
            <label
              :for="`${field.id}_${option}`"
              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              {{ option }}
            </label>
          </div>
        </div>

        <!-- Radio -->
        <div v-else-if="field.type === 'radio'" class="form-radio-group">
          <div
            v-for="option in field.options"
            :key="option"
            class="flex items-center mb-2"
          >
            <input
              :id="`${field.id}_${option}`"
              v-model="formData[field.name]"
              type="radio"
              :name="field.name"
              :value="option"
              :required="field.required"
              class="form-radio"
            />
            <label
              :for="`${field.id}_${option}`"
              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              {{ option }}
            </label>
          </div>
        </div>

        <!-- File Upload -->
        <input
          v-else-if="field.type === 'file'"
          :id="field.id"
          @change="handleFileChange(field.name, $event)"
          type="file"
          :name="field.name"
          :required="field.required"
          class="form-file"
          :class="inputClasses"
        />

        <!-- Date Input -->
        <input
          v-else-if="field.type === 'date'"
          :id="field.id"
          v-model="formData[field.name]"
          type="date"
          :name="field.name"
          :required="field.required"
          class="form-input"
          :class="inputClasses"
        />

        <!-- Field Error -->
        <div
          v-if="fieldErrors[field.name]"
          class="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {{ fieldErrors[field.name] }}
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-submit mt-6">
        <button
          type="submit"
          :disabled="submitting"
          class="submit-button"
          :class="submitButtonClasses"
        >
          <div v-if="submitting" class="flex items-center">
            <div class="loading-spinner mr-2"></div>
            {{ $t('submitting') }}
          </div>
          <span v-else>{{ submitButtonText }}</span>
        </button>
      </div>

      <!-- Success Message -->
      <div
        v-if="submitSuccess"
        class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md"
      >
        <div class="flex">
          <i class="pi pi-check-circle text-green-400"></i>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">
              {{ localizedContent.success_message || $t('form_submitted_successfully') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="submitError"
        class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md"
      >
        <div class="flex">
          <i class="pi pi-exclamation-triangle text-red-400"></i>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">
              {{ localizedContent.error_message || $t('form_submission_error') }}
            </p>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, reactive } from 'vue';
import type { ContentComponent, FormComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'FormBlock',
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
    const formData = reactive<Record<string, any>>({});
    const fieldErrors = reactive<Record<string, string>>({});
    const submitting = ref(false);
    const submitSuccess = ref(false);
    const submitError = ref(false);

    const localizedContent = computed((): FormComponentContent => {
      let content: FormComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as FormComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.success_message) content.success_message = convertifserbian(content.success_message);
          if (content.error_message) content.error_message = convertifserbian(content.error_message);
          break;
        case 'hu':
          content = props.component.content_hu as FormComponentContent;
          break;
        case 'en':
          content = props.component.content_en as FormComponentContent;
          break;
        default:
          content = props.component.content_rs as FormComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.success_message) content.success_message = convertifserbian(content.success_message);
          if (content.error_message) content.error_message = convertifserbian(content.error_message);
      }

      return content || {
        fields: [],
        submit_action: 'email',
        submit_target: '',
        success_message: '',
        error_message: ''
      };
    });

    const formFields = computed(() => {
      return localizedContent.value.fields || [];
    });

    const submitButtonText = computed(() => {
      return props.component.settings?.submit_button_text || 'Submit';
    });

    const formBlockClasses = computed(() => {
      const classes = ['form-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const formClasses = computed(() => {
      const classes = ['form-content'];

      const layout = props.component.settings?.layout || 'vertical';
      if (layout === 'horizontal') {
        classes.push('form-horizontal');
      }

      const style = props.component.settings?.style || 'default';
      switch (style) {
        case 'bordered':
          classes.push('p-6', 'border', 'border-gray-200', 'dark:border-gray-700', 'rounded-lg');
          break;
        case 'card':
          classes.push('p-6', 'bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-lg');
          break;
        case 'minimal':
          classes.push('space-y-4');
          break;
        default:
          classes.push('space-y-4');
      }

      return classes.join(' ');
    });

    const inputClasses = computed(() => {
      const classes = [
        'w-full',
        'px-3',
        'py-2',
        'border',
        'border-gray-300',
        'dark:border-gray-600',
        'rounded-md',
        'shadow-sm',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:border-blue-500',
        'dark:bg-gray-700',
        'dark:text-white'
      ];

      return classes.join(' ');
    });

    const submitButtonClasses = computed(() => {
      const classes = [
        'w-full',
        'px-4',
        'py-2',
        'text-white',
        'font-medium',
        'rounded-md',
        'transition-colors',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2'
      ];

      const buttonStyle = props.component.settings?.button_style || 'primary';
      switch (buttonStyle) {
        case 'secondary':
          classes.push('bg-gray-600', 'hover:bg-gray-700', 'focus:ring-gray-500');
          break;
        case 'success':
          classes.push('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
          break;
        case 'danger':
          classes.push('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-500');
          break;
        default: // primary
          classes.push('bg-blue-600', 'hover:bg-blue-700', 'focus:ring-blue-500');
      }

      if (submitting.value) {
        classes.push('opacity-50', 'cursor-not-allowed');
      }

      return classes.join(' ');
    });

    const getFieldClasses = (field: any) => {
      const classes = [];

      if (field.width) {
        classes.push(`w-${field.width}`);
      } else {
        classes.push('w-full');
      }

      return classes.join(' ');
    };

    const handleFileChange = (fieldName: string, event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        formData[fieldName] = target.files[0];
      }
    };

    const validateForm = (): boolean => {
      // Clear previous errors
      Object.keys(fieldErrors).forEach(key => {
        delete fieldErrors[key];
      });

      let isValid = true;

      formFields.value.forEach(field => {
        const value = formData[field.name];

        // Required field validation
        if (field.required) {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            fieldErrors[field.name] = `${field.label} is required`;
            isValid = false;
          }
        }

        // Email validation
        if (field.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            fieldErrors[field.name] = 'Please enter a valid email address';
            isValid = false;
          }
        }

        // Custom validation
        if (field.validation && value) {
          try {
            const regex = new RegExp(field.validation);
            if (!regex.test(value)) {
              fieldErrors[field.name] = 'Please enter a valid value';
              isValid = false;
            }
          } catch (error) {
            console.error('Invalid validation regex:', field.validation);
          }
        }
      });

      return isValid;
    };

    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }

      submitting.value = true;
      submitSuccess.value = false;
      submitError.value = false;

      try {
        const action = localizedContent.value.submit_action;
        const target = localizedContent.value.submit_target;

        switch (action) {
          case 'email':
            await submitViaEmail(target, formData);
            break;
          case 'webhook':
            await submitViaWebhook(target, formData);
            break;
          case 'database':
            await submitToDatabase(target, formData);
            break;
          default:
            throw new Error('Invalid submit action');
        }

        submitSuccess.value = true;

        // Clear form after successful submission
        Object.keys(formData).forEach(key => {
          delete formData[key];
        });

        // Redirect if specified
        if (localizedContent.value.redirect_url) {
          setTimeout(() => {
            window.location.href = localizedContent.value.redirect_url!;
          }, 2000);
        }

      } catch (error) {
        console.error('Form submission error:', error);
        submitError.value = true;
      } finally {
        submitting.value = false;
      }
    };

    const submitViaEmail = async (email: string, data: Record<string, any>) => {
      // This would typically integrate with your email service
      console.log('Submitting form via email to:', email, data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    };

    const submitViaWebhook = async (webhookUrl: string, data: Record<string, any>) => {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Webhook submission failed');
      }
    };

    const submitToDatabase = async (collection: string, data: Record<string, any>) => {
      // This would integrate with your Appwrite database
      console.log('Submitting form to database collection:', collection, data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    };

    return {
      formData,
      fieldErrors,
      submitting,
      submitSuccess,
      submitError,
      localizedContent,
      formFields,
      submitButtonText,
      formBlockClasses,
      formClasses,
      inputClasses,
      submitButtonClasses,
      getFieldClasses,
      handleFileChange,
      handleSubmit
    };
  }
});
</script>

<style scoped>
.form-wrapper {
  @apply w-full mb-8;
}

.form-horizontal .form-field {
  @apply flex items-center space-x-4;
}

.form-horizontal .form-field label {
  @apply w-1/3 mb-0;
}

.form-horizontal .form-field .form-input,
.form-horizontal .form-field .form-checkbox-group,
.form-horizontal .form-field .form-radio-group {
  @apply w-2/3;
}

.form-checkbox {
  @apply w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2;
}

.form-radio {
  @apply w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2;
}

.form-file {
  @apply w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
}

/* Custom focus states */
.form-input:focus {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

.form-checkbox:focus,
.form-radio:focus {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

/* Dark mode enhancements */
.dark .form-checkbox {
  @apply bg-gray-700 border-gray-600;
}

.dark .form-radio {
  @apply bg-gray-700 border-gray-600;
}
</style>