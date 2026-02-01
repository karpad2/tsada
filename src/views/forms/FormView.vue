<template>
  <v-container class="py-8" style="max-width: 720px;">
    <!-- Loading State -->
    <v-card v-if="isLoading" class="text-center pa-12">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-1 text-medium-emphasis mt-4">Űrlap betöltése...</p>
    </v-card>

    <!-- Error State -->
    <v-card v-else-if="error" class="text-center pa-12">
      <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">{{ error }}</h2>
      <p class="text-body-2 text-medium-emphasis mt-2">Az űrlap nem található vagy nem elérhető.</p>
      <v-btn variant="outlined" class="mt-6" prepend-icon="mdi-arrow-left" @click="goHome">
        Vissza a főoldalra
      </v-btn>
    </v-card>

    <!-- Form Not Active -->
    <v-card v-else-if="form && !form.settings.active" class="text-center pa-12">
      <v-icon size="64" color="warning">mdi-lock-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">Az űrlap jelenleg nem aktív</h2>
      <p class="text-body-2 text-medium-emphasis mt-2">Ez az űrlap ideiglenesen le van zárva.</p>
      <v-btn variant="outlined" class="mt-6" prepend-icon="mdi-arrow-left" @click="goHome">
        Vissza a főoldalra
      </v-btn>
    </v-card>

    <!-- Success State -->
    <v-card v-else-if="isSubmitted" class="text-center pa-12">
      <v-icon size="64" color="success">mdi-check-circle-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">Köszönjük!</h2>
      <p class="text-body-1 text-medium-emphasis mt-2">
        {{ form?.settings.confirmationMessage || 'Válaszod sikeresen rögzítve!' }}
      </p>
      <div class="d-flex ga-3 justify-center mt-6">
        <v-btn v-if="form?.settings.allowMultipleResponses" color="primary" prepend-icon="mdi-plus" @click="resetForm">
          Új válasz beküldése
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goHome">
          Vissza a főoldalra
        </v-btn>
      </div>
    </v-card>

    <!-- Form -->
    <template v-else-if="form">
      <!-- Progress Bar -->
      <v-progress-linear
        v-if="form.settings.showProgressBar && form.fields.length > 1"
        :model-value="progressPercent"
        color="primary"
        height="8"
        rounded
        class="mb-2"
      />
      <p v-if="form.settings.showProgressBar && form.fields.length > 1" class="text-caption text-medium-emphasis text-center mb-4">
        {{ answeredFieldsCount }} / {{ form.fields.length }} mező kitöltve
      </p>

      <!-- Form Header -->
      <v-card class="mb-4">
        <div class="bg-primary pa-1 rounded-t" />
        <v-card-text class="pt-6">
          <h1 class="text-h4 font-weight-bold mb-2">{{ form.title }}</h1>
          <p v-if="form.description" class="text-body-1 text-medium-emphasis">{{ form.description }}</p>
          <p v-if="form.settings.collectEmail" class="text-caption text-primary mt-4">
            * Email cím megadása kötelező
          </p>
        </v-card-text>
      </v-card>

      <!-- Form Fields -->
      <v-form @submit.prevent="submitForm">
        <!-- Email Field (if collecting) -->
        <v-card v-if="form.settings.collectEmail" class="mb-4">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-medium mb-2">
              Email cím
              <span class="text-error">*</span>
            </div>
            <v-text-field
              v-model="emailAddress"
              type="email"
              placeholder="pelda@email.com"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Email cím kötelező']"
            />
          </v-card-text>
        </v-card>

        <!-- Dynamic Fields -->
        <v-card
          v-for="field in form.fields"
          :key="field.id"
          class="mb-4"
        >
          <v-card-text>
            <div class="text-subtitle-1 font-weight-medium mb-1">
              {{ field.label }}
              <span v-if="field.required" class="text-error">*</span>
            </div>
            <p v-if="field.description" class="text-caption text-medium-emphasis mb-3">{{ field.description }}</p>

            <!-- Field Image -->
            <v-img
              v-if="field.imageId"
              :src="getFieldImageUrl(field.imageId)"
              max-height="300"
              class="rounded mb-3"
              cover
            />

            <!-- Text Input -->
            <v-text-field
              v-if="field.type === 'text'"
              v-model="responses[field.id]"
              :placeholder="field.placeholder"
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Textarea -->
            <v-textarea
              v-else-if="field.type === 'textarea'"
              v-model="responses[field.id]"
              :placeholder="field.placeholder"
              variant="outlined"
              rows="4"
              auto-grow
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Email -->
            <v-text-field
              v-else-if="field.type === 'email'"
              v-model="responses[field.id]"
              type="email"
              :placeholder="field.placeholder || 'pelda@email.com'"
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Number -->
            <v-text-field
              v-else-if="field.type === 'number'"
              v-model.number="responses[field.id]"
              type="number"
              :placeholder="field.placeholder"
              :min="field.validation?.min"
              :max="field.validation?.max"
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => v !== '' && v !== null && v !== undefined || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Phone -->
            <v-text-field
              v-else-if="field.type === 'tel'"
              v-model="responses[field.id]"
              type="tel"
              :placeholder="field.placeholder || '+36 XX XXX XXXX'"
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Date -->
            <v-text-field
              v-else-if="field.type === 'date'"
              v-model="responses[field.id]"
              type="date"
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Time -->
            <v-text-field
              v-else-if="field.type === 'time'"
              v-model="responses[field.id]"
              type="time"
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Select (Dropdown) -->
            <v-select
              v-else-if="field.type === 'select'"
              v-model="responses[field.id]"
              :items="field.options"
              placeholder="Válassz egy opciót..."
              variant="outlined"
              density="comfortable"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />

            <!-- Radio Buttons -->
            <v-radio-group
              v-else-if="field.type === 'radio'"
              v-model="responses[field.id]"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            >
              <v-radio
                v-for="option in field.options"
                :key="option"
                :label="option"
                :value="option"
              />
            </v-radio-group>

            <!-- Checkboxes -->
            <div v-else-if="field.type === 'checkbox'">
              <v-checkbox
                v-for="option in field.options"
                :key="option"
                :label="option"
                :value="option"
                v-model="responses[field.id]"
                density="compact"
                hide-details
              />
            </div>

            <!-- File Upload -->
            <v-file-input
              v-else-if="field.type === 'file'"
              @update:model-value="handleFileChange(field.id, $event)"
              variant="outlined"
              density="comfortable"
              prepend-icon="mdi-paperclip"
              :rules="field.required ? [v => !!v || 'Kötelező mező'] : []"
              hide-details="auto"
            />
          </v-card-text>
        </v-card>

        <!-- Submit Area -->
        <v-card>
          <v-card-text class="d-flex align-center justify-space-between">
            <v-btn variant="text" @click="clearForm">
              Űrlap törlése
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="isSubmitting"
              prepend-icon="mdi-send"
            >
              Beküldés
            </v-btn>
          </v-card-text>
        </v-card>
      </v-form>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FormsService, type Form } from '@/services/forms/FormsService';
import { FileManager } from '@/appwrite/FileManagement';
import { notify } from '@kyvg/vue3-notification';

const route = useRoute();
const router = useRouter();
const formsService = FormsService.getInstance();
const fileManager = new FileManager();

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

function handleFileChange(fieldId: string, files: File[] | null) {
  if (files && files.length > 0) {
    responses.value[fieldId] = files[0];
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

function getFieldImageUrl(imageId: string): string {
  return fileManager.getFileView(imageId, 'gallery');
}

function goHome() {
  router.push('/');
}
</script>
