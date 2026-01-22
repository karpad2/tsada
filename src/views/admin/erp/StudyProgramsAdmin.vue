<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-school</v-icon>
            Szakok kezelése
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="openCreateDialog">
              <v-icon left>mdi-plus</v-icon>
              Új szak
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Search -->
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Keresés..."
              single-line
              hide-details
              clearable
              class="mb-4"
            ></v-text-field>

            <!-- Study Programs Table -->
            <v-data-table
              :headers="headers"
              :items="filteredPrograms"
              :loading="isLoading"
              class="elevation-1"
              item-value="$id"
            >
              <template #item.duration_years="{ item }">
                <v-chip size="small" :color="item.duration_years === 4 ? 'primary' : 'secondary'">
                  {{ item.duration_years }} év
                </v-chip>
              </template>

              <template #item.language="{ item }">
                <v-chip size="small" :color="item.language === 'hu' ? 'success' : 'info'">
                  {{ item.language === 'hu' ? 'Magyar' : item.language === 'rs' ? 'Szerb' : item.language }}
                </v-chip>
              </template>

              <template #item.actions="{ item }">
                <v-btn icon size="small" variant="text" @click="editProgram(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="primary" @click="manageSubjects(item)">
                  <v-icon>mdi-book-multiple</v-icon>
                  <v-tooltip activator="parent">Tantárgyak kezelése</v-tooltip>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>

              <template #no-data>
                <div class="text-center py-4">
                  <v-icon size="64" color="grey">mdi-school</v-icon>
                  <p class="mt-2">Nincsenek szakok</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="700">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">{{ editingProgram ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ editingProgram ? 'Szak szerkesztése' : 'Új szak' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.study_program_name_hu"
                  label="Magyar név"
                  :rules="[v => !!v || 'Kötelező mező']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.study_program_name_rs"
                  label="Szerb név"
                  :rules="[v => !!v || 'Kötelező mező']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.study_program_internal_name"
                  label="Belső név (rövid)"
                  hint="Rövidített név belső használatra"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.duration_years"
                  :items="[3, 4]"
                  label="Időtartam (év)"
                  :rules="[v => !!v || 'Kötelező mező']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.language"
                  :items="languageOptions"
                  item-title="text"
                  item-value="value"
                  label="Tagozat nyelve"
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDialog = false">Mégse</v-btn>
          <v-btn color="primary" :loading="isSaving" :disabled="!formValid" @click="saveProgram">
            {{ editingProgram ? 'Mentés' : 'Létrehozás' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          Törlés megerősítése
        </v-card-title>
        <v-card-text>
          Biztosan törölni szeretnéd a(z) <strong>{{ deletingProgram?.study_program_name_hu }}</strong> szakot?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">Mégse</v-btn>
          <v-btn color="error" :loading="isDeleting" @click="deleteProgram">Törlés</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Subjects Management Dialog -->
    <v-dialog v-model="showSubjectsDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-book-multiple</v-icon>
          {{ selectedProgram?.study_program_name_hu }} - Tantárgyak
        </v-card-title>
        <v-card-text>
          <v-tabs v-model="selectedYear" color="primary">
            <v-tab v-for="year in availableYears" :key="year" :value="year">
              {{ year }}. évfolyam
            </v-tab>
          </v-tabs>

          <v-divider class="my-4"></v-divider>

          <!-- Add Subject -->
          <v-row class="mb-4">
            <v-col cols="12" md="8">
              <v-autocomplete
                v-model="subjectToAdd"
                :items="availableSubjects"
                item-title="name_hu"
                item-value="$id"
                label="Tantárgy hozzáadása"
                clearable
                return-object
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #subtitle>{{ item.raw.name_rs }}</template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-btn
                color="primary"
                :disabled="!subjectToAdd"
                :loading="isAddingSubject"
                @click="addSubjectToProgram"
              >
                <v-icon left>mdi-plus</v-icon>
                Hozzáadás
              </v-btn>
            </v-col>
          </v-row>

          <!-- Assigned Subjects List -->
          <v-list v-if="programSubjects.length > 0">
            <v-list-item
              v-for="ps in programSubjects"
              :key="ps.$id"
              class="border rounded mb-2"
            >
              <template #prepend>
                <v-icon>mdi-book</v-icon>
              </template>
              <v-list-item-title>{{ (ps.subjects as any)?.name_hu || 'N/A' }}</v-list-item-title>
              <v-list-item-subtitle>{{ (ps.subjects as any)?.name_rs || '' }}</v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  :loading="removingSubjectId === ps.$id"
                  @click="removeSubjectFromProgram(ps.$id)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8 text-grey">
            <v-icon size="48">mdi-book-off</v-icon>
            <p class="mt-2">Nincs tantárgy ehhez az évfolyamhoz</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showSubjectsDialog = false">Bezárás</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { ErpService, type StudyProgram, type Subject, type StudyProgramSubject } from '@/services/ErpService';

export default defineComponent({
  name: 'StudyProgramsAdmin',
  setup() {
    const erpService = ErpService.getInstance();

    const programs = ref<StudyProgram[]>([]);
    const subjects = ref<Subject[]>([]);
    const search = ref('');
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isDeleting = ref(false);

    const showDialog = ref(false);
    const showDeleteDialog = ref(false);
    const showSubjectsDialog = ref(false);
    const formValid = ref(false);
    const formRef = ref();

    const editingProgram = ref<StudyProgram | null>(null);
    const deletingProgram = ref<StudyProgram | null>(null);
    const selectedProgram = ref<StudyProgram | null>(null);

    const selectedYear = ref(1);
    const programSubjects = ref<StudyProgramSubject[]>([]);
    const subjectToAdd = ref<Subject | null>(null);
    const isAddingSubject = ref(false);
    const removingSubjectId = ref<string | null>(null);

    const form = ref({
      study_program_name_hu: '',
      study_program_name_rs: '',
      study_program_internal_name: '',
      duration_years: 4,
      language: 'hu'
    });

    const languageOptions = [
      { text: 'Magyar', value: 'hu' },
      { text: 'Szerb', value: 'rs' }
    ];

    const headers = [
      { title: 'Magyar név', key: 'study_program_name_hu' },
      { title: 'Szerb név', key: 'study_program_name_rs' },
      { title: 'Időtartam', key: 'duration_years', width: '120px' },
      { title: 'Tagozat', key: 'language', width: '120px' },
      { title: 'Műveletek', key: 'actions', sortable: false, width: '150px' }
    ];

    const filteredPrograms = computed(() => {
      if (!search.value) return programs.value;
      const s = search.value.toLowerCase();
      return programs.value.filter(
        p => p.study_program_name_hu?.toLowerCase().includes(s) ||
             p.study_program_name_rs?.toLowerCase().includes(s) ||
             p.study_program_internal_name?.toLowerCase().includes(s)
      );
    });

    const availableYears = computed(() => {
      const years = selectedProgram.value?.duration_years || 4;
      return Array.from({ length: years }, (_, i) => i + 1);
    });

    const availableSubjects = computed(() => {
      const assignedIds = programSubjects.value.map(ps => (ps.subjects as any)?.$id);
      return subjects.value.filter(s => !assignedIds.includes(s.$id));
    });

    const loadPrograms = async () => {
      isLoading.value = true;
      try {
        const result = await erpService.getStudyPrograms(200);
        programs.value = result.programs;
      } finally {
        isLoading.value = false;
      }
    };

    const loadSubjects = async () => {
      const result = await erpService.getSubjects(500);
      subjects.value = result.subjects;
    };

    const loadProgramSubjects = async () => {
      if (!selectedProgram.value?.$id) return;
      programSubjects.value = await erpService.getStudyProgramSubjects(
        selectedProgram.value.$id,
        selectedYear.value
      );
    };

    const openCreateDialog = () => {
      editingProgram.value = null;
      form.value = {
        study_program_name_hu: '',
        study_program_name_rs: '',
        study_program_internal_name: '',
        duration_years: 4,
        language: 'hu'
      };
      showDialog.value = true;
    };

    const editProgram = (program: StudyProgram) => {
      editingProgram.value = program;
      form.value = {
        study_program_name_hu: program.study_program_name_hu,
        study_program_name_rs: program.study_program_name_rs,
        study_program_internal_name: program.study_program_internal_name || '',
        duration_years: program.duration_years || 4,
        language: program.language || 'hu'
      };
      showDialog.value = true;
    };

    const saveProgram = async () => {
      if (!formValid.value) return;

      isSaving.value = true;
      try {
        const data: Partial<StudyProgram> = {
          study_program_name_hu: form.value.study_program_name_hu,
          study_program_name_rs: form.value.study_program_name_rs,
          study_program_internal_name: form.value.study_program_internal_name || undefined,
          duration_years: form.value.duration_years,
          language: form.value.language
        };

        if (editingProgram.value?.$id) {
          await erpService.updateStudyProgram(editingProgram.value.$id, data);
        } else {
          await erpService.createStudyProgram(data as StudyProgram);
        }

        showDialog.value = false;
        await loadPrograms();
      } finally {
        isSaving.value = false;
      }
    };

    const confirmDelete = (program: StudyProgram) => {
      deletingProgram.value = program;
      showDeleteDialog.value = true;
    };

    const deleteProgram = async () => {
      if (!deletingProgram.value?.$id) return;

      isDeleting.value = true;
      try {
        await erpService.deleteStudyProgram(deletingProgram.value.$id);
        showDeleteDialog.value = false;
        await loadPrograms();
      } finally {
        isDeleting.value = false;
      }
    };

    const manageSubjects = async (program: StudyProgram) => {
      selectedProgram.value = program;
      selectedYear.value = 1;
      showSubjectsDialog.value = true;
      await loadProgramSubjects();
    };

    const addSubjectToProgram = async () => {
      if (!subjectToAdd.value?.$id || !selectedProgram.value?.$id) return;

      isAddingSubject.value = true;
      try {
        await erpService.addSubjectToProgram(
          selectedProgram.value.$id,
          subjectToAdd.value.$id,
          selectedYear.value
        );
        subjectToAdd.value = null;
        await loadProgramSubjects();
      } finally {
        isAddingSubject.value = false;
      }
    };

    const removeSubjectFromProgram = async (id: string) => {
      removingSubjectId.value = id;
      try {
        await erpService.removeSubjectFromProgram(id);
        await loadProgramSubjects();
      } finally {
        removingSubjectId.value = null;
      }
    };

    watch(selectedYear, () => {
      if (showSubjectsDialog.value) {
        loadProgramSubjects();
      }
    });

    onMounted(() => {
      loadPrograms();
      loadSubjects();
    });

    return {
      programs,
      subjects,
      search,
      isLoading,
      isSaving,
      isDeleting,
      showDialog,
      showDeleteDialog,
      showSubjectsDialog,
      formValid,
      formRef,
      editingProgram,
      deletingProgram,
      selectedProgram,
      selectedYear,
      programSubjects,
      subjectToAdd,
      isAddingSubject,
      removingSubjectId,
      form,
      languageOptions,
      headers,
      filteredPrograms,
      availableYears,
      availableSubjects,
      openCreateDialog,
      editProgram,
      saveProgram,
      confirmDelete,
      deleteProgram,
      manageSubjects,
      addSubjectToProgram,
      removeSubjectFromProgram
    };
  }
});
</script>
