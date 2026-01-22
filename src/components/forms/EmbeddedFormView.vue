<template>
  <div class="embedded-form">
    <!-- Loading -->
    <div v-if="isLoading" class="form-loading">
      <div class="spinner"></div>
      <p>Űrlap betöltése...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="form-error">
      <p>{{ error }}</p>
    </div>

    <!-- Form Not Active -->
    <div v-else-if="form && !form.settings.active" class="form-inactive">
      <p>Ez az űrlap jelenleg nem aktív.</p>
    </div>

    <!-- Success -->
    <div v-else-if="isSubmitted" class="form-success">
      <div class="success-icon">✅</div>
      <h3>Köszönjük!</h3>
      <p>{{ form?.settings.confirmationMessage || 'Válaszod sikeresen rögzítve!' }}</p>
      <button v-if="form?.settings.allowMultipleResponses" @click="resetForm" class="btn-primary">
        Új válasz beküldése
      </button>
    </div>

    <!-- Form -->
    <form v-else-if="form" @submit.prevent="submitForm" class="form-content">
      <!-- Form Header -->
      <div class="form-header">
        <h3 class="form-title">{{ form.title }}</h3>
        <p v-if="form.description" class="form-description">{{ form.description }}</p>
      </div>

      <!-- Progress Bar -->
      <div v-if="form.settings.showProgressBar && form.fields.length > 1" class="progress-bar">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <span class="progress-text">{{ answeredCount }}/{{ form.fields.length }}</span>
      </div>

      <!-- Email Field -->
      <div v-if="form.settings.collectEmail" class="form-field">
        <label class="field-label">
          Email cím <span class="required">*</span>
        </label>
        <input
          v-model="email"
          type="email"
          placeholder="pelda@email.com"
          class="field-input"
          required
        />
      </div>

      <!-- Dynamic Fields -->
      <div v-for="field in form.fields" :key="field.id" class="form-field">
        <label class="field-label">
          {{ field.label }}
          <span v-if="field.required" class="required">*</span>
        </label>
        <p v-if="field.description" class="field-description">{{ field.description }}</p>

        <!-- Text -->
        <input
          v-if="field.type === 'text'"
          v-model="responses[field.id]"
          type="text"
          :placeholder="field.placeholder"
          class="field-input"
          :required="field.required"
        />

        <!-- Textarea -->
        <textarea
          v-else-if="field.type === 'textarea'"
          v-model="responses[field.id]"
          :placeholder="field.placeholder"
          rows="4"
          class="field-textarea"
          :required="field.required"
        ></textarea>

        <!-- Email -->
        <input
          v-else-if="field.type === 'email'"
          v-model="responses[field.id]"
          type="email"
          :placeholder="field.placeholder || 'pelda@email.com'"
          class="field-input"
          :required="field.required"
        />

        <!-- Number -->
        <input
          v-else-if="field.type === 'number'"
          v-model.number="responses[field.id]"
          type="number"
          :placeholder="field.placeholder"
          :min="field.validation?.min"
          :max="field.validation?.max"
          class="field-input"
          :required="field.required"
        />

        <!-- Tel -->
        <input
          v-else-if="field.type === 'tel'"
          v-model="responses[field.id]"
          type="tel"
          :placeholder="field.placeholder || '+36 XX XXX XXXX'"
          class="field-input"
          :required="field.required"
        />

        <!-- Date -->
        <input
          v-else-if="field.type === 'date'"
          v-model="responses[field.id]"
          type="date"
          class="field-input"
          :required="field.required"
        />

        <!-- Time -->
        <input
          v-else-if="field.type === 'time'"
          v-model="responses[field.id]"
          type="time"
          class="field-input"
          :required="field.required"
        />

        <!-- Select -->
        <select
          v-else-if="field.type === 'select'"
          v-model="responses[field.id]"
          class="field-select"
          :required="field.required"
        >
          <option value="" disabled>Válassz...</option>
          <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- Radio -->
        <div v-else-if="field.type === 'radio'" class="radio-group">
          <label
            v-for="opt in field.options"
            :key="opt"
            class="radio-option"
            :class="{ selected: responses[field.id] === opt }"
          >
            <input type="radio" :name="field.id" :value="opt" v-model="responses[field.id]" />
            <span class="radio-indicator"></span>
            <span>{{ opt }}</span>
          </label>
        </div>

        <!-- Checkbox -->
        <div v-else-if="field.type === 'checkbox'" class="checkbox-group">
          <label
            v-for="opt in field.options"
            :key="opt"
            class="checkbox-option"
            :class="{ selected: (responses[field.id] || []).includes(opt) }"
          >
            <input type="checkbox" :value="opt" v-model="responses[field.id]" />
            <span class="checkbox-indicator"></span>
            <span>{{ opt }}</span>
          </label>
        </div>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting" class="btn-submit">
          {{ isSubmitting ? 'Küldés...' : 'Beküldés' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { FormsService, type Form } from '@/services/forms/FormsService';

export default defineComponent({
  name: 'EmbeddedFormView',
  props: {
    formId: {
      type: String,
      required: true
    },
    showResults: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const formsService = FormsService.getInstance();

    const form = ref<Form | null>(null);
    const responses = ref<Record<string, any>>({});
    const email = ref('');
    const isLoading = ref(true);
    const isSubmitting = ref(false);
    const isSubmitted = ref(false);
    const error = ref<string | null>(null);

    const answeredCount = computed(() => {
      if (!form.value) return 0;
      return form.value.fields.filter(f => {
        const val = responses.value[f.id];
        if (Array.isArray(val)) return val.length > 0;
        return val !== undefined && val !== null && val !== '';
      }).length;
    });

    const progressPercent = computed(() => {
      if (!form.value || form.value.fields.length === 0) return 0;
      return Math.round((answeredCount.value / form.value.fields.length) * 100);
    });

    onMounted(async () => {
      try {
        form.value = await formsService.getForm(props.formId);
        initResponses();
      } catch (err) {
        error.value = 'Az űrlap nem található';
        console.error('Failed to load form:', err);
      } finally {
        isLoading.value = false;
      }
    });

    function initResponses() {
      if (!form.value) return;
      form.value.fields.forEach(field => {
        responses.value[field.id] = field.type === 'checkbox' ? [] : '';
      });
    }

    async function submitForm() {
      if (!form.value?.$id) return;

      // Validate
      for (const field of form.value.fields) {
        if (field.required) {
          const val = responses.value[field.id];
          const isEmpty = Array.isArray(val) ? val.length === 0 : !val;
          if (isEmpty) {
            alert(`Kérjük töltsd ki: ${field.label}`);
            return;
          }
        }
      }

      if (form.value.settings.collectEmail && !email.value) {
        alert('Kérjük add meg az email címed!');
        return;
      }

      isSubmitting.value = true;

      try {
        const data = { ...responses.value };
        if (form.value.settings.collectEmail) {
          data._email = email.value;
        }

        await formsService.submitResponse(form.value.$id, data);
        isSubmitted.value = true;
      } catch (err: any) {
        alert(err.message || 'Hiba történt a beküldés során');
      } finally {
        isSubmitting.value = false;
      }
    }

    function resetForm() {
      isSubmitted.value = false;
      initResponses();
      email.value = '';
    }

    return {
      form,
      responses,
      email,
      isLoading,
      isSubmitting,
      isSubmitted,
      error,
      answeredCount,
      progressPercent,
      submitForm,
      resetForm
    };
  }
});
</script>

<style scoped>
.embedded-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-loading,
.form-error,
.form-inactive,
.form-success {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-error {
  color: #dc2626;
}

.form-inactive {
  color: #6b7280;
}

.form-success {
  background: #ecfdf5;
  border-radius: 12px;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.form-success h3 {
  color: #065f46;
  margin-bottom: 0.5rem;
}

.form-success p {
  color: #047857;
}

.form-content {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.form-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #8b5cf6;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.form-description {
  color: #6b7280;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.form-field {
  margin-bottom: 1.25rem;
}

.field-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #dc2626;
}

.field-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.field-input,
.field-textarea,
.field-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.field-textarea {
  resize: vertical;
  min-height: 100px;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover,
.checkbox-option:hover {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.radio-option.selected,
.checkbox-option.selected {
  border-color: #8b5cf6;
  background: #f3e8ff;
}

.radio-option input,
.checkbox-option input {
  display: none;
}

.radio-indicator,
.checkbox-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  flex-shrink: 0;
}

.radio-indicator {
  border-radius: 50%;
}

.checkbox-indicator {
  border-radius: 4px;
}

.radio-option.selected .radio-indicator {
  border-color: #8b5cf6;
  background: #8b5cf6;
  box-shadow: inset 0 0 0 4px #fff;
}

.checkbox-option.selected .checkbox-indicator {
  border-color: #8b5cf6;
  background: #8b5cf6;
}

.checkbox-option.selected .checkbox-indicator::after {
  content: '✓';
  display: block;
  color: #fff;
  font-size: 12px;
  text-align: center;
  line-height: 16px;
}

.form-actions {
  margin-top: 1.5rem;
  text-align: right;
}

.btn-submit,
.btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-submit:hover,
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Dark mode support */
:deep(.dark) .form-content {
  background: #1f2937;
}

:deep(.dark) .form-title {
  color: #f9fafb;
}

:deep(.dark) .field-label {
  color: #e5e7eb;
}

:deep(.dark) .field-input,
:deep(.dark) .field-textarea,
:deep(.dark) .field-select {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}
</style>
