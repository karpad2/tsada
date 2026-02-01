<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Űrlap Szerkesztő</h1>
            <p class="text-body-2 text-medium-emphasis mt-1">Google Forms-szerű űrlap építő</p>
          </div>
          <div class="d-flex ga-2">
            <v-btn color="primary" prepend-icon="mdi-content-save" :loading="isSaving" @click="saveForm">
              Mentés
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-eye" @click="previewForm">
              Előnézet
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
              Vissza
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Field Types Palette -->
      <v-col cols="12" lg="3">
        <v-card class="sticky-palette">
          <v-card-title>Mezők</v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="fieldType in fieldTypes"
              :key="fieldType.type"
              :prepend-icon="fieldType.icon"
              :title="fieldType.label"
              :subtitle="fieldType.description"
              @click="addField(fieldType.type)"
              class="cursor-pointer"
            />
          </v-list>
        </v-card>
      </v-col>

      <!-- Form Builder Area -->
      <v-col cols="12" lg="9">
        <!-- Form Header -->
        <v-card class="mb-4">
          <v-card-text>
            <v-text-field
              v-model="form.title"
              label="Űrlap címe"
              variant="outlined"
              class="text-h5 mb-2"
            />
            <v-textarea
              v-model="form.description"
              label="Űrlap leírása (opcionális)"
              variant="outlined"
              rows="2"
              auto-grow
            />
          </v-card-text>
        </v-card>

        <!-- Fields -->
        <draggable
          v-model="form.fields"
          item-key="id"
          handle=".drag-handle"
          @start="drag = true"
          @end="drag = false"
        >
          <template #item="{ element: field, index }">
            <v-card
              class="mb-3"
              :variant="selectedField === field.id ? 'outlined' : 'elevated'"
              :color="selectedField === field.id ? 'primary' : undefined"
            >
              <v-card-text>
                <div class="d-flex align-start ga-3">
                  <!-- Drag Handle -->
                  <v-icon class="drag-handle cursor-move mt-3" color="grey">mdi-drag</v-icon>

                  <!-- Field Content -->
                  <div class="flex-grow-1">
                    <v-text-field
                      v-model="field.label"
                      :placeholder="`${getFieldTypeName(field.type)} címke`"
                      variant="underlined"
                      density="comfortable"
                      hide-details
                      class="mb-1"
                    />
                    <v-text-field
                      v-model="field.description"
                      placeholder="Segítő szöveg (opcionális)"
                      variant="plain"
                      density="compact"
                      hide-details
                      class="text-body-2"
                    />

                    <!-- Field Image Preview -->
                    <v-img
                      v-if="field.imageId"
                      :src="getFieldImageUrl(field.imageId)"
                      max-height="200"
                      class="rounded my-2"
                      cover
                    />

                    <!-- Field Preview -->
                    <div class="my-3 pointer-events-none">
                      <component
                        :is="getFieldComponent(field.type)"
                        :field="field"
                        :disabled="true"
                      />
                    </div>

                    <!-- Field Settings (Expandable) -->
                    <v-expand-transition>
                      <div v-if="selectedField === field.id" class="mt-3 pa-3 bg-grey-lighten-5 rounded">
                        <!-- Options for select/radio/checkbox -->
                        <div v-if="['select', 'radio', 'checkbox'].includes(field.type)" class="mb-3">
                          <div class="text-subtitle-2 mb-2">Opciók</div>
                          <div v-for="(option, optIndex) in field.options" :key="optIndex" class="d-flex ga-2 mb-2">
                            <v-text-field
                              v-model="field.options[optIndex]"
                              :placeholder="`Opció ${optIndex + 1}`"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                            <v-btn
                              icon="mdi-close"
                              size="small"
                              variant="text"
                              color="error"
                              @click="removeOption(field, optIndex)"
                            />
                          </div>
                          <v-btn
                            variant="text"
                            size="small"
                            color="primary"
                            prepend-icon="mdi-plus"
                            @click="addOption(field)"
                          >
                            Új opció
                          </v-btn>
                        </div>

                        <!-- Placeholder -->
                        <v-text-field
                          v-if="['text', 'textarea', 'email', 'number', 'tel'].includes(field.type)"
                          v-model="field.placeholder"
                          label="Placeholder"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="mb-3"
                        />

                        <!-- Validation -->
                        <v-row v-if="field.type === 'number'" dense class="mb-3">
                          <v-col cols="6">
                            <v-text-field
                              v-model.number="field.validation.min"
                              label="Min"
                              type="number"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model.number="field.validation.max"
                              label="Max"
                              type="number"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                          </v-col>
                        </v-row>

                        <!-- Image upload -->
                        <div class="mb-3">
                          <div class="text-subtitle-2 mb-2">Kép a kérdéshez</div>
                          <div v-if="field.imageId" class="d-flex align-center ga-2 mb-2">
                            <v-img
                              :src="getFieldImageUrl(field.imageId)"
                              max-width="120"
                              max-height="80"
                              class="rounded border"
                              cover
                            />
                            <v-btn
                              icon="mdi-delete"
                              size="small"
                              variant="text"
                              color="error"
                              @click="removeFieldImage(field)"
                            />
                          </div>
                          <v-file-input
                            v-if="!field.imageId"
                            accept="image/*"
                            label="Kép feltöltése"
                            variant="outlined"
                            density="compact"
                            hide-details
                            prepend-icon="mdi-image-plus"
                            :loading="uploadingFieldId === field.id"
                            @update:model-value="(files: File[]) => uploadFieldImage(field, files)"
                          />
                        </div>

                        <!-- Required toggle -->
                        <v-checkbox
                          v-model="field.required"
                          label="Kötelező mező"
                          density="compact"
                          hide-details
                        />
                      </div>
                    </v-expand-transition>
                  </div>

                  <!-- Actions -->
                  <div class="d-flex flex-column ga-1">
                    <v-btn
                      icon="mdi-cog"
                      size="small"
                      variant="text"
                      @click="toggleFieldSettings(field.id)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeField(index)"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </template>
        </draggable>

        <!-- Add Field Hint -->
        <v-card v-if="form.fields.length === 0" class="text-center pa-12">
          <v-icon size="64" color="grey">mdi-plus-circle-outline</v-icon>
          <p class="text-body-1 text-medium-emphasis mt-4">Kattints a bal oldali mezőkre az űrlap építéséhez</p>
        </v-card>

        <!-- Form Settings -->
        <v-card class="mt-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
            Beállítások
          </v-card-title>
          <v-card-text>
            <v-checkbox
              v-model="form.settings.allowMultipleResponses"
              label="Többszöri kitöltés engedélyezése"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.requireLogin"
              label="Bejelentkezés kötelező"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.showProgressBar"
              label="Haladásjelző megjelenítése"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.collectEmail"
              label="Email cím gyűjtése"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.active"
              label="Űrlap aktív"
              density="compact"
              hide-details
              class="mb-4"
            />
            <v-textarea
              v-model="form.settings.confirmationMessage"
              label="Megerősítő üzenet"
              variant="outlined"
              rows="3"
              auto-grow
              placeholder="Köszönjük a válaszod!"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { FormsService, type Form, type FormField } from '@/services/forms/FormsService';
import { FileManager } from '@/appwrite/FileManagement';
import { nanoid } from 'nanoid';
import { notify } from '@kyvg/vue3-notification';
import FormFieldPreview from '@/components/forms/fields/FormFieldPreview.vue';

const route = useRoute();
const router = useRouter();
const formsService = FormsService.getInstance();

const fileManager = new FileManager();
const drag = ref(false);
const isSaving = ref(false);
const selectedField = ref<string | null>(null);
const uploadingFieldId = ref<string | null>(null);

const fieldTypes = [
  { type: 'text', label: 'Rövid szöveg', icon: 'mdi-form-textbox', description: 'Egy soros szöveg' },
  { type: 'textarea', label: 'Hosszú szöveg', icon: 'mdi-text-long', description: 'Több soros szöveg' },
  { type: 'email', label: 'Email', icon: 'mdi-email-outline', description: 'Email cím' },
  { type: 'number', label: 'Szám', icon: 'mdi-numeric', description: 'Számérték' },
  { type: 'tel', label: 'Telefon', icon: 'mdi-phone-outline', description: 'Telefonszám' },
  { type: 'date', label: 'Dátum', icon: 'mdi-calendar', description: 'Dátum választó' },
  { type: 'time', label: 'Idő', icon: 'mdi-clock-outline', description: 'Idő választó' },
  { type: 'select', label: 'Legördülő', icon: 'mdi-form-dropdown', description: 'Választás listából' },
  { type: 'radio', label: 'Rádió gomb', icon: 'mdi-radiobox-marked', description: 'Egy választás' },
  { type: 'checkbox', label: 'Jelölőnégyzet', icon: 'mdi-checkbox-marked-outline', description: 'Több választás' },
];

const form = ref<Form>({
  title: 'Névtelen űrlap',
  description: '',
  fields: [],
  settings: {
    allowMultipleResponses: true,
    requireLogin: false,
    showProgressBar: true,
    confirmationMessage: 'Köszönjük a válaszod!',
    collectEmail: false,
    active: true,
  },
});

onMounted(async () => {
  if (route.params.id && route.params.id !== 'new') {
    await loadForm(route.params.id as string);
  }
});

async function loadForm(formId: string) {
  try {
    form.value = await formsService.getForm(formId);
  } catch (error) {
    console.error('Failed to load form:', error);
    notify({ type: 'error', text: 'Nem sikerült betölteni az űrlapot!' });
  }
}

function addField(type: string) {
  const field: FormField = {
    id: nanoid(),
    type: type as any,
    label: `Új ${getFieldTypeName(type)}`,
    required: false,
    validation: {},
  };

  if (['select', 'radio', 'checkbox'].includes(type)) {
    field.options = ['Opció 1', 'Opció 2', 'Opció 3'];
  }

  form.value.fields.push(field);
  selectedField.value = field.id;
}

function removeField(index: number) {
  form.value.fields.splice(index, 1);
}

function addOption(field: FormField) {
  if (!field.options) field.options = [];
  field.options.push(`Opció ${field.options.length + 1}`);
}

function removeOption(field: FormField, index: number) {
  field.options?.splice(index, 1);
}

function getFieldImageUrl(imageId: string): string {
  return fileManager.getFileView(imageId, 'gallery');
}

async function uploadFieldImage(field: FormField, files: File[] | null) {
  if (!files || files.length === 0) return;
  uploadingFieldId.value = field.id;
  try {
    const result = await fileManager.uploadFile({ file: files[0], bucketId: 'gallery' });
    field.imageId = result.$id;
  } catch (error) {
    console.error('Failed to upload image:', error);
    notify({ type: 'error', text: 'Nem sikerült feltölteni a képet!' });
  } finally {
    uploadingFieldId.value = null;
  }
}

function removeFieldImage(field: FormField) {
  if (field.imageId) {
    fileManager.deleteFile(field.imageId, 'gallery').catch(() => {});
    field.imageId = undefined;
  }
}

function toggleFieldSettings(fieldId: string) {
  selectedField.value = selectedField.value === fieldId ? null : fieldId;
}

function getFieldTypeName(type: string): string {
  return fieldTypes.find(ft => ft.type === type)?.label || type;
}

function getFieldComponent(_type: string) {
  return FormFieldPreview;
}

async function saveForm() {
  isSaving.value = true;

  try {
    if (route.params.id && route.params.id !== 'new') {
      await formsService.updateForm(route.params.id as string, form.value);
      notify({ type: 'success', text: 'Űrlap sikeresen frissítve!' });
    } else {
      const created = await formsService.createForm(form.value);
      notify({ type: 'success', text: 'Űrlap sikeresen létrehozva!' });
      router.replace(`/admin/forms/edit/${created.$id}`);
    }
  } catch (error: any) {
    console.error('Failed to save form:', error);
    notify({ type: 'error', text: 'Hiba történt: ' + (error.message || 'Ismeretlen hiba') });
  } finally {
    isSaving.value = false;
  }
}

function previewForm() {
  if (form.value.$id) {
    window.open(`/forms/${form.value.$id}`, '_blank');
  } else {
    notify({ type: 'warning', text: 'Mentsd el először az űrlapot!' });
  }
}

function goBack() {
  router.push('/admin/forms');
}
</script>

<style scoped>
.sticky-palette {
  position: sticky;
  top: 24px;
}
.cursor-pointer {
  cursor: pointer;
}
.cursor-move {
  cursor: move;
}
.pointer-events-none {
  pointer-events: none;
}
</style>
