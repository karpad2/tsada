<template>
  <div class="page-shell">
  <div class="page-panel container">
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <div class="page-header">
          <h1 class="section-title !text-2xl !mb-1">{{ $t('manage_subjects') }}</h1>
          <div class="section-accent !w-20"></div>
        </div>
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-book-open-variant</v-icon>
            {{ $t('manage_subjects') }}
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="openCreateDialog">
              <v-icon left>mdi-plus</v-icon>
              {{ $t('new_subject') }}
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Search -->
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              :label="$t('search_content')"
              single-line
              hide-details
              clearable
              class="mb-4"
            ></v-text-field>

            <!-- Subjects Table -->
            <v-data-table
              :headers="headers"
              :items="filteredSubjects"
              :loading="isLoading"
              class="elevation-1"
              item-value="$id"
            >
              <template #item.subject_code="{ item }">
                <v-chip size="small" color="grey">
                  {{ item.subject_code || '-' }}
                </v-chip>
              </template>

              <template #item.actions="{ item }">
                <v-btn icon size="small" variant="text" @click="editSubject(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>

              <template #no-data>
                <div class="text-center py-4">
                  <v-icon size="64" color="grey">mdi-book-open-variant</v-icon>
                  <p class="mt-2">{{ $t('no_subjects') }}</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">{{ editingSubject ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ editingSubject ? $t('edit_subject') : $t('new_subject') }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.name_hu"
                  :label="$t('subject_name_hu')"
                  :rules="[v => !!v || $t('required_field')]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.name_rs"
                  :label="$t('subject_name_rs')"
                  :rules="[v => !!v || $t('required_field')]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.subject_code"
                  :label="$t('subject_code')"
                  type="number"
                  :hint="$t('optional_for_ordering')"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" :loading="isSaving" :disabled="!formValid" @click="saveSubject">
            {{ editingSubject ? $t('save') : $t('create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          {{ $t('confirm_delete') }}
        </v-card-title>
        <v-card-text>
          {{ $t('confirm_delete_subject', { name: deletingSubject?.name_hu }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="error" :loading="isDeleting" @click="deleteSubject">{{ $t('delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ErpService, type Subject } from '@/services/ErpService';

export default defineComponent({
  name: 'SubjectsAdmin',
  setup() {
    const { t } = useI18n();
    const erpService = ErpService.getInstance();

    const subjects = ref<Subject[]>([]);
    const search = ref('');
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isDeleting = ref(false);

    const showDialog = ref(false);
    const showDeleteDialog = ref(false);
    const formValid = ref(false);
    const formRef = ref();

    const editingSubject = ref<Subject | null>(null);
    const deletingSubject = ref<Subject | null>(null);

    const form = ref({
      name_hu: '',
      name_rs: '',
      subject_code: null as number | null
    });

    const headers = computed(() => [
      { title: t('subject_code'), key: 'subject_code', width: '80px' },
      { title: t('subject_name_hu'), key: 'name_hu' },
      { title: t('subject_name_rs'), key: 'name_rs' },
      { title: t('operations'), key: 'actions', sortable: false, width: '120px' }
    ]);

    const filteredSubjects = computed(() => {
      if (!search.value) return subjects.value;
      const s = search.value.toLowerCase();
      return subjects.value.filter(
        sub => sub.name_hu?.toLowerCase().includes(s) || sub.name_rs?.toLowerCase().includes(s)
      );
    });

    const loadSubjects = async () => {
      isLoading.value = true;
      try {
        const result = await erpService.getSubjects(200);
        subjects.value = result.subjects;
      } finally {
        isLoading.value = false;
      }
    };

    const openCreateDialog = () => {
      editingSubject.value = null;
      form.value = { name_hu: '', name_rs: '', subject_code: null };
      showDialog.value = true;
    };

    const editSubject = (subject: Subject) => {
      editingSubject.value = subject;
      form.value = {
        name_hu: subject.name_hu,
        name_rs: subject.name_rs,
        subject_code: subject.subject_code || null
      };
      showDialog.value = true;
    };

    const saveSubject = async () => {
      if (!formValid.value) return;

      isSaving.value = true;
      try {
        const data: Partial<Subject> = {
          name_hu: form.value.name_hu,
          name_rs: form.value.name_rs
        };
        if (form.value.subject_code) {
          data.subject_code = form.value.subject_code;
        }

        if (editingSubject.value?.$id) {
          await erpService.updateSubject(editingSubject.value.$id, data);
        } else {
          await erpService.createSubject(data as Subject);
        }

        showDialog.value = false;
        await loadSubjects();
      } finally {
        isSaving.value = false;
      }
    };

    const confirmDelete = (subject: Subject) => {
      deletingSubject.value = subject;
      showDeleteDialog.value = true;
    };

    const deleteSubject = async () => {
      if (!deletingSubject.value?.$id) return;

      isDeleting.value = true;
      try {
        await erpService.deleteSubject(deletingSubject.value.$id);
        showDeleteDialog.value = false;
        await loadSubjects();
      } finally {
        isDeleting.value = false;
      }
    };

    onMounted(loadSubjects);

    return {
      subjects,
      search,
      isLoading,
      isSaving,
      isDeleting,
      showDialog,
      showDeleteDialog,
      formValid,
      formRef,
      editingSubject,
      deletingSubject,
      form,
      headers,
      filteredSubjects,
      openCreateDialog,
      editSubject,
      saveSubject,
      confirmDelete,
      deleteSubject
    };
  }
});
</script>
