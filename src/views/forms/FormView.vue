<template>
  <div class="form-view min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-2xl mx-auto">
      <div class="glass-card p-12 rounded-3xl text-center">
        <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">Űrlap betöltése...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-2xl mx-auto">
      <div class="glass-card p-12 rounded-3xl text-center">
        <div class="text-6xl mb-4">😕</div>
        <h2 class="text-2xl font-bold text-white mb-2">{{ error }}</h2>
        <p class="text-gray-400 mb-6">Az űrlap nem található vagy nem elérhető.</p>
        <button @click="goHome" class="btn-secondary">
          ← Vissza a főoldalra
        </button>
      </div>
    </div>

    <!-- Form Not Active -->
    <div v-else-if="form && !form.settings.active" class="max-w-2xl mx-auto">
      <div class="glass-card p-12 rounded-3xl text-center">
        <div class="text-6xl mb-4">🚫</div>
        <h2 class="text-2xl font-bold text-white mb-2">Az űrlap jelenleg nem aktív</h2>
        <p class="text-gray-400 mb-6">Ez az űrlap ideiglenesen le van zárva.</p>
        <button @click="goHome" class="btn-secondary">
          ← Vissza a főoldalra
        </button>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="isSubmitted" class="max-w-2xl mx-auto">
      <div class="glass-card p-12 rounded-3xl text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-white mb-4">Köszönjük!</h2>
        <p class="text-gray-300 text-lg mb-6">
          {{ form?.settings.confirmationMessage || 'Válaszod sikeresen rögzítve!' }}
        </p>
        <div class="flex gap-4 justify-center">
          <button v-if="form?.settings.allowMultipleResponses" @click="resetForm" class="btn-primary">
            ➕ Új válasz beküldése
          </button>
          <button @click="goHome" class="btn-secondary">
            ← Vissza a főoldalra
          </button>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div v-else-if="form" class="max-w-2xl mx-auto">
      <!-- Progress Bar -->
      <div v-if="form.settings.showProgressBar && form.fields.length > 1" class="mb-6">
        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <p class="text-gray-400 text-sm mt-2 text-center">
          {{ answeredFieldsCount }} / {{ form.fields.length }} mező kitöltve
        </p>
      </div>

      <!-- Form Header -->
      <div class="glass-card p-8 rounded-t-3xl border-b-0">
        <div class="w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6"></div>
        <h1 class="text-3xl font-bold text-white mb-3">{{ form.title }}</h1>
        <p v-if="form.description" class="text-gray-300">{{ form.description }}</p>
        <p v-if="form.settings.collectEmail" class="text-sm text-purple-400 mt-4">
          * Email cím megadása kötelező
        </p>
      </div>

      <!-- Form Fields -->
      <form @submit.prevent="submitForm">
        <!-- Email Field (if collecting) -->
        <div v-if="form.settings.collectEmail" class="glass-card p-6 border-t-0 border-b-0">
          <div class="field-container">
            <label class="field-label">
              Email cím
              <span class="text-red-400">*</span>
            </label>
            <input
              v-model="emailAddress"
              type="email"
              placeholder="pelda@email.com"
              class="field-input"
              required
            />
          </div>
        </div>

        <!-- Dynamic Fields -->
        <div
          v-for="(field, index) in form.fields"
          :key="field.id"
          class="glass-card p-6 border-t-0"
          :class="{ 'border-b-0': index < form.fields.length - 1 }"
        >
          <div class="field-container">
            <label class="field-label">
              {{ field.label }}
              <span v-if="field.required" class="text-red-400">*</span>
            </label>
            <p v-if="field.description" class="field-description">{{ field.description }}</p>

            <!-- Text Input -->
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

            <!-- Phone -->
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

            <!-- Select (Dropdown) -->
            <select
              v-else-if="field.type === 'select'"
              v-model="responses[field.id]"
              class="field-select"
              :required="field.required"
            >
              <option value="" disabled>Válassz egy opciót...</option>
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>

            <!-- Radio Buttons -->
            <div v-else-if="field.type === 'radio'" class="field-radio-group">
              <label
                v-for="option in field.options"
                :key="option"
                class="field-radio-option"
                :class="{ 'selected': responses[field.id] === option }"
              >
                <input
                  type="radio"
                  :name="field.id"
                  :value="option"
                  v-model="responses[field.id]"
                  :required="field.required"
                />
                <span class="radio-circle"></span>
                <span class="radio-label">{{ option }}</span>
              </label>
            </div>

            <!-- Checkboxes -->
            <div v-else-if="field.type === 'checkbox'" class="field-checkbox-group">
              <label
                v-for="option in field.options"
                :key="option"
                class="field-checkbox-option"
                :class="{ 'selected': (responses[field.id] || []).includes(option) }"
              >
                <input
                  type="checkbox"
                  :value="option"
                  v-model="responses[field.id]"
                />
                <span class="checkbox-box"></span>
                <span class="checkbox-label">{{ option }}</span>
              </label>
            </div>

            <!-- File Upload -->
            <div v-else-if="field.type === 'file'" class="field-file-upload">
              <input
                type="file"
                :id="field.id"
                @change="handleFileChange(field.id, $event)"
                class="hidden"
              />
              <label :for="field.id" class="file-upload-area">
                <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span class="upload-text">
                  {{ responses[field.id]?.name || 'Kattints a fájl kiválasztásához' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="glass-card p-6 rounded-b-3xl border-t-0">
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="clearForm"
              class="text-gray-400 hover:text-white transition-colors"
            >
              Űrlap törlése
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="btn-primary"
            >
              {{ isSubmitting ? '⏳ Küldés...' : '📤 Beküldés' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FormsService, type Form } from '@/services/forms/FormsService';
import { notify } from '@kyvg/vue3-notification';

const route = useRoute();
const router = useRouter();
const formsService = FormsService.getInstance();

const form = ref<Form | null>(null);
const responses = ref<Record<string, any>>({});
const emailAddress = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const error = ref<string | null>(null);

const answeredFieldsCount = computed(() => {
  if (!form.value) return 0;
  return form.value.fields.filter(field => {
    const value = responses.value[field.id];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;
});

const progressPercent = computed(() => {
  if (!form.value || form.value.fields.length === 0) return 0;
  return Math.round((answeredFieldsCount.value / form.value.fields.length) * 100);
});

onMounted(async () => {
  const formId = route.params.id as string;
  if (!formId) {
    error.value = 'Hibás URL';
    isLoading.value = false;
    return;
  }

  try {
    form.value = await formsService.getForm(formId);
    initializeResponses();
  } catch (err) {
    console.error('Failed to load form:', err);
    error.value = 'Az űrlap nem található';
  } finally {
    isLoading.value = false;
  }
});

function initializeResponses() {
  if (!form.value) return;

  form.value.fields.forEach(field => {
    if (field.type === 'checkbox') {
      responses.value[field.id] = [];
    } else {
      responses.value[field.id] = '';
    }
  });
}

function handleFileChange(fieldId: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    responses.value[fieldId] = input.files[0];
  }
}

async function submitForm() {
  if (!form.value?.$id) return;

  // Validate required fields
  for (const field of form.value.fields) {
    if (field.required) {
      const value = responses.value[field.id];
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

      if (isEmpty) {
        notify({
          type: 'error',
          text: `Kérjük, töltsd ki a "${field.label}" mezőt!`
        });
        return;
      }
    }
  }

  // Validate email if collecting
  if (form.value.settings.collectEmail && !emailAddress.value) {
    notify({
      type: 'error',
      text: 'Kérjük, add meg az email címedet!'
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const submissionData = { ...responses.value };
    if (form.value.settings.collectEmail) {
      submissionData._email = emailAddress.value;
    }

    await formsService.submitResponse(form.value.$id, submissionData);
    isSubmitted.value = true;
  } catch (err: any) {
    console.error('Failed to submit form:', err);
    notify({
      type: 'error',
      text: err.message || 'Hiba történt a beküldés során!'
    });
  } finally {
    isSubmitting.value = false;
  }
}

function clearForm() {
  initializeResponses();
  emailAddress.value = '';
}

function resetForm() {
  isSubmitted.value = false;
  clearForm();
}

function goHome() {
  router.push('/');
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary {
  @apply px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all;
}

.field-container {
  @apply space-y-2;
}

.field-label {
  @apply block text-lg font-semibold text-white;
}

.field-description {
  @apply text-sm text-gray-400;
}

.field-input,
.field-textarea,
.field-select {
  @apply w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all;
}

.field-textarea {
  @apply resize-none;
}

.field-select {
  @apply appearance-none cursor-pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;
}

.field-radio-group,
.field-checkbox-group {
  @apply space-y-3 mt-2;
}

.field-radio-option,
.field-checkbox-option {
  @apply flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer transition-all hover:bg-white/10;
}

.field-radio-option.selected,
.field-checkbox-option.selected {
  @apply bg-purple-500/20 ring-2 ring-purple-500;
}

.field-radio-option input,
.field-checkbox-option input {
  @apply hidden;
}

.radio-circle {
  @apply w-5 h-5 rounded-full border-2 border-white/30 flex-shrink-0 relative;
}

.field-radio-option.selected .radio-circle {
  @apply border-purple-500;
}

.field-radio-option.selected .radio-circle::after {
  content: '';
  @apply absolute inset-1 bg-purple-500 rounded-full;
}

.checkbox-box {
  @apply w-5 h-5 rounded-md border-2 border-white/30 flex-shrink-0 flex items-center justify-center;
}

.field-checkbox-option.selected .checkbox-box {
  @apply bg-purple-500 border-purple-500;
}

.field-checkbox-option.selected .checkbox-box::after {
  content: '✓';
  @apply text-white text-xs font-bold;
}

.radio-label,
.checkbox-label {
  @apply text-white;
}

.field-file-upload {
  @apply mt-2;
}

.file-upload-area {
  @apply flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-white/5 transition-all;
}

.upload-icon {
  @apply w-10 h-10 text-gray-400 mb-2;
}

.upload-text {
  @apply text-gray-400 text-center;
}

.hidden {
  display: none;
}
</style>
