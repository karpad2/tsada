<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold dark:text-white  ">{{ $t('forms_management') }}</h1>
            <p class="text-body-2 text-medium-emphasis mt-1">{{ $t('forms_subtitle') }}</p>
          </div>
          <div class="d-flex ga-2">
            <v-btn color="primary" prepend-icon="mdi-plus" @click="createNewForm">
              {{ $t('new_form') }}
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
              {{ $t('back') }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="isLoading">
      <v-col class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-1 text-medium-emphasis mt-4">{{ $t('loading') }}...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="forms.length === 0">
      <v-col>
        <v-card class="text-center pa-12">
          <v-icon size="64" color="grey">mdi-clipboard-text-outline</v-icon>
          <h3 class="text-h5 font-weight-bold mt-4">{{ $t('no_forms') }}</h3>
          <p class="text-body-2 text-medium-emphasis mt-2">{{ $t('create_first_form') }}!</p>
          <v-btn color="primary" class="mt-4" prepend-icon="mdi-plus" @click="createNewForm">
            {{ $t('create_first_form_btn') }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Forms Grid -->
    <v-row v-else>
      <v-col
        v-for="form in forms"
        :key="form.$id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          class="h-100 cursor-pointer"
          hover
          @click="editForm(form.$id!)"
        >
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-truncate">{{ form.title || $t('untitled_form') }}</span>
            <v-chip
              :color="form.settings.active ? 'success' : 'grey'"
              size="small"
              variant="tonal"
            >
              {{ form.settings.active ? $t('active') : $t('inactive') }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <p class="text-body-2 text-medium-emphasis" style="min-height: 40px;">
              {{ form.description || $t('no_description') }}
            </p>
            <div class="d-flex ga-4 mt-3">
              <span class="text-caption text-medium-emphasis">
                <v-icon size="14" class="mr-1">mdi-format-list-bulleted</v-icon>
                {{ form.fields?.length || 0 }} {{ $t('fields') }}
              </span>
              <span class="text-caption text-medium-emphasis">
                <v-icon size="14" class="mr-1">mdi-message-reply-text</v-icon>
                {{ form.responsesCount || 0 }} {{ $t('responses') }}
              </span>
            </div>
          </v-card-text>

          <v-divider />

          <v-card-actions>
            <v-spacer />
            <v-btn
              icon="mdi-chart-bar"
              size="small"
              variant="text"
              @click.stop="viewResponses(form.$id!)"
              :title="$t('view_responses')"
            />
            <v-btn
              icon="mdi-link"
              size="small"
              variant="text"
              @click.stop="copyFormLink(form.$id!)"
              :title="$t('link_copied')"
            />
            <v-btn
              icon="mdi-content-copy"
              size="small"
              variant="text"
              @click.stop="duplicateForm(form)"
              :title="$t('duplicate_form')"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="confirmDelete(form)"
              :title="$t('delete_form')"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-row v-if="total > pageSize" class="mt-4">
      <v-col class="d-flex justify-center">
        <v-pagination
          v-model="currentPage"
          :length="Math.ceil(total / pageSize)"
          @update:model-value="loadForms"
        />
      </v-col>
    </v-row>

    <!-- Delete Dialog -->
    <v-dialog v-model="showDeleteModal" max-width="420">
      <v-card>
        <v-card-title>{{ $t('delete_form') }}</v-card-title>
        <v-card-text>
          {{ $t('delete_form_confirm') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteModal = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="error" variant="elevated" :loading="isDeleting" @click="deleteForm">
            {{ $t('delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { FormsService, type Form } from '@/services/forms/FormsService';
import { notify } from '@kyvg/vue3-notification';

const { t } = useI18n();

const router = useRouter();
const formsService = FormsService.getInstance();

const forms = ref<Form[]>([]);
const total = ref(0);
const isLoading = ref(true);
const currentPage = ref(1);
const pageSize = 12;

const showDeleteModal = ref(false);
const formToDelete = ref<Form | null>(null);
const isDeleting = ref(false);

onMounted(async () => {
  await loadForms();
});

async function loadForms() {
  isLoading.value = true;
  try {
    const offset = (currentPage.value - 1) * pageSize;
    const result = await formsService.listForms(pageSize, offset);
    forms.value = result.forms;
    total.value = result.total;
  } catch (error) {
    console.error('Failed to load forms:', error);
    notify({ type: 'error', text: t('forms_load_error') });
  } finally {
    isLoading.value = false;
  }
}

function createNewForm() {
  router.push('/admin/forms/edit/new');
}

function editForm(formId: string) {
  router.push(`/admin/forms/edit/${formId}`);
}

function viewResponses(formId: string) {
  router.push(`/admin/forms/responses/${formId}`);
}

function copyFormLink(formId: string) {
  const url = `${window.location.origin}/forms/${formId}`;
  navigator.clipboard.writeText(url).then(() => {
    notify({ type: 'success', text: t('link_copied') });
  }).catch(() => {
    notify({ type: 'error', text: t('link_copy_error') });
  });
}

async function duplicateForm(form: Form) {
  try {
    const newForm: Form = {
      title: `${form.title} (${t('copy_suffix')})`,
      description: form.description,
      fields: [...form.fields],
      settings: { ...form.settings },
    };
    await formsService.createForm(newForm);
    notify({ type: 'success', text: t('form_duplicated') });
    await loadForms();
  } catch (error) {
    console.error('Failed to duplicate form:', error);
    notify({ type: 'error', text: t('form_duplicate_error') });
  }
}

function confirmDelete(form: Form) {
  formToDelete.value = form;
  showDeleteModal.value = true;
}

async function deleteForm() {
  if (!formToDelete.value?.$id) return;
  isDeleting.value = true;
  try {
    await formsService.deleteForm(formToDelete.value.$id);
    notify({ type: 'success', text: t('form_deleted') });
    showDeleteModal.value = false;
    formToDelete.value = null;
    await loadForms();
  } catch (error) {
    console.error('Failed to delete form:', error);
    notify({ type: 'error', text: t('form_delete_error') });
  } finally {
    isDeleting.value = false;
  }
}

function goBack() {
  router.push('/admin');
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.h-100 {
  height: 100%;
}
</style>
