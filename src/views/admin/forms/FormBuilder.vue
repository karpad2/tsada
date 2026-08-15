<template>
  <div class="page-shell">
  <div class="page-panel container">
  <v-container fluid class="pa-0">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <div>
            <h1 class="section-title !text-2xl sm:!text-3xl !mb-1">{{ $t('form_builder') }}</h1>
            <div class="section-accent !mb-2"></div>
            <p class="page-subtitle !mt-0">{{ $t('form_builder_subtitle') }}</p>
          </div>
          <div class="d-flex ga-2">
            <v-btn color="primary" prepend-icon="mdi-content-save" :loading="isSaving" @click="saveForm">
              {{ $t('save') }}
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-eye" @click="previewForm">
              {{ $t('preview') }}
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
              {{ $t('back') }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Field Types Palette -->
      <v-col cols="12" lg="3">
        <v-card class="sticky-palette">
          <v-card-title>{{ $t('form_fields') }}</v-card-title>
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
              :label="$t('form_title')"
              variant="outlined"
              class="text-h5 mb-2"
            />
            <v-textarea
              v-model="form.description"
              :label="$t('form_description_optional')"
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
                      :placeholder="$t('field_label_placeholder', { type: getFieldTypeName(field.type) })"
                      variant="underlined"
                      density="comfortable"
                      hide-details
                      class="mb-1"
                    />
                    <v-text-field
                      v-model="field.description"
                      :placeholder="$t('help_text_optional')"
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
                          <div class="text-subtitle-2 mb-2">{{ $t('field_options') }}</div>
                          <div v-for="(option, optIndex) in field.options" :key="optIndex" class="d-flex ga-2 mb-2">
                            <v-text-field
                              v-model="field.options[optIndex]"
                              :placeholder="$t('option_n', { n: optIndex + 1 })"
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
                            {{ $t('add_option') }}
                          </v-btn>
                        </div>

                        <!-- Placeholder -->
                        <v-text-field
                          v-if="['text', 'textarea', 'email', 'number', 'tel'].includes(field.type)"
                          v-model="field.placeholder"
                          :label="$t('placeholder')"
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
                              :label="$t('min_value')"
                              type="number"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model.number="field.validation.max"
                              :label="$t('max_value')"
                              type="number"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                          </v-col>
                        </v-row>

                        <!-- Image upload -->
                        <div class="mb-3">
                          <div class="text-subtitle-2 mb-2">{{ $t('question_image') }}</div>
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
                            :label="$t('upload_image')"
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
                          :label="$t('field_required')"
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
          <p class="text-body-1 text-medium-emphasis mt-4">{{ $t('click_fields_to_build') }}</p>
        </v-card>

        <!-- Form Settings -->
        <v-card class="mt-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
            {{ $t('settings') }}
          </v-card-title>
          <v-card-text>
            <v-checkbox
              v-model="form.settings.allowMultipleResponses"
              :label="$t('allow_multiple_responses')"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.requireLogin"
              :label="$t('require_login')"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.showProgressBar"
              :label="$t('show_progress_bar')"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.collectEmail"
              :label="$t('collect_email')"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="form.settings.active"
              :label="$t('form_active')"
              density="compact"
              hide-details
              class="mb-4"
            />
            <v-textarea
              v-model="form.settings.confirmationMessage"
              :label="$t('confirmation_message')"
              variant="outlined"
              rows="3"
              auto-grow
              :placeholder="$t('thank_you_message')"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import { FormsService, type Form, type FormField } from '@/services/forms/FormsService';
import { FileManager } from '@/appwrite/FileManagement';
import { nanoid } from 'nanoid';
import { notify } from '@kyvg/vue3-notification';
import FormFieldPreview from '@/components/forms/fields/FormFieldPreview.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const formsService = FormsService.getInstance();

const fileManager = new FileManager();
const drag = ref(false);
const isSaving = ref(false);
const selectedField = ref<string | null>(null);
const uploadingFieldId = ref<string | null>(null);

const fieldTypes = computed(() => [
  { type: 'text', label: t('short_text'), icon: 'mdi-form-textbox', description: t('field_desc_short_text') },
  { type: 'textarea', label: t('long_text'), icon: 'mdi-text-long', description: t('field_desc_long_text') },
  { type: 'email', label: t('email'), icon: 'mdi-email-outline', description: t('field_desc_email') },
  { type: 'number', label: t('field_desc_number'), icon: 'mdi-numeric', description: t('field_desc_number') },
  { type: 'tel', label: t('phone'), icon: 'mdi-phone-outline', description: t('field_desc_phone') },
  { type: 'date', label: t('date'), icon: 'mdi-calendar', description: t('field_desc_date') },
  { type: 'time', label: t('time_picker'), icon: 'mdi-clock-outline', description: t('field_desc_time') },
  { type: 'select', label: t('dropdown'), icon: 'mdi-form-dropdown', description: t('field_desc_select') },
  { type: 'radio', label: t('radio_button'), icon: 'mdi-radiobox-marked', description: t('field_desc_radio') },
  { type: 'checkbox', label: t('checkbox'), icon: 'mdi-checkbox-marked-outline', description: t('field_desc_checkbox') },
]);

const form = ref<Form>({
  title: t('untitled_form'),
  description: '',
  fields: [],
  settings: {
    allowMultipleResponses: true,
    requireLogin: false,
    showProgressBar: true,
    confirmationMessage: t('thank_you_message'),
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
    notify({ type: 'error', text: t('form_load_error') });
  }
}

function addField(type: string) {
  const field: FormField = {
    id: nanoid(),
    type: type as any,
    label: t('new_field', { type: getFieldTypeName(type) }),
    required: false,
    validation: {},
  };

  if (['select', 'radio', 'checkbox'].includes(type)) {
    field.options = [t('option_n', { n: 1 }), t('option_n', { n: 2 }), t('option_n', { n: 3 })];
  }

  form.value.fields.push(field);
  selectedField.value = field.id;
}

function removeField(index: number) {
  form.value.fields.splice(index, 1);
}

function addOption(field: FormField) {
  if (!field.options) field.options = [];
  field.options.push(t('option_n', { n: field.options.length + 1 }));
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
    notify({ type: 'error', text: t('image_upload_failed') });
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
  return fieldTypes.value.find(ft => ft.type === type)?.label || type;
}

function getFieldComponent(_type: string) {
  return FormFieldPreview;
}

async function saveForm() {
  isSaving.value = true;

  try {
    if (route.params.id && route.params.id !== 'new') {
      await formsService.updateForm(route.params.id as string, form.value);
      notify({ type: 'success', text: t('form_updated_success') });
    } else {
      const created = await formsService.createForm(form.value);
      notify({ type: 'success', text: t('form_created_success') });
      router.replace(`/admin/forms/edit/${created.$id}`);
    }
  } catch (error: any) {
    console.error('Failed to save form:', error);
    notify({ type: 'error', text: t('error_saving') + ': ' + (error.message || t('unknown_error')) });
  } finally {
    isSaving.value = false;
  }
}

function previewForm() {
  if (form.value.$id) {
    window.open(`/forms/${form.value.$id}`, '_blank');
  } else {
    notify({ type: 'warning', text: t('form_save_first') });
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
