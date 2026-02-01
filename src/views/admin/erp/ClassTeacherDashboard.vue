<template>
  <v-container fluid>
    <!-- Class Selection Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            <v-icon class="mr-2">mdi-school</v-icon>
            {{ $t('class_teacher_dashboard') }}
            <v-spacer></v-spacer>
            <v-select
              v-model="selectedClassId"
              :items="classes"
              item-title="displayName"
              item-value="$id"
              :label="$t('select_class_label')"
              density="compact"
              hide-details
              style="max-width: 250px"
              class="mr-2"
            ></v-select>
            <v-select
              v-model="selectedSchoolYearId"
              :items="schoolYears"
              item-title="name"
              item-value="$id"
              :label="$t('school_year')"
              density="compact"
              hide-details
              style="max-width: 180px"
            ></v-select>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="selectedClass">
      <!-- Students Panel -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            {{ selectedClass.displayName }} - {{ $t('students') }}
            <v-chip class="ml-2" size="small" color="primary">
              {{ students.length }} {{ $t('persons') }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn color="primary" size="small" @click="openAddStudentDialog">
              <v-icon left>mdi-plus</v-icon>
              {{ $t('new_student') }}
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="studentSearch"
              prepend-inner-icon="mdi-magnify"
              :label="$t('search_student')"
              single-line
              hide-details
              clearable
              density="compact"
              class="mb-3"
            ></v-text-field>

            <v-data-table
              :headers="studentHeaders"
              :items="filteredStudents"
              :loading="isLoadingStudents"
              density="compact"
              item-value="$id"
            >
              <template #item.name="{ item }">
                <div>
                  <strong>{{ item.lastname_hu }} {{ item.firstname_hu }}</strong>
                  <div class="text-caption text-grey">
                    {{ item.lastname_rs }} {{ item.firstname_rs }}
                  </div>
                </div>
              </template>

              <template #item.birth="{ item }">
                <span v-if="item.birth_year">
                  {{ item.birth_year }}.{{ item.birth_month?.toString().padStart(2, '0') }}.{{ item.birth_day?.toString().padStart(2, '0') }}.
                </span>
                <span v-else class="text-grey">-</span>
              </template>

              <template #item.foreign_language="{ item }">
                <v-chip v-if="item.foreign_language" size="x-small">
                  {{ item.foreign_language?.name_hu || '-' }}
                </v-chip>
              </template>

              <template #item.actions="{ item }">
                <v-btn icon size="x-small" variant="text" @click="editStudent(item)">
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="primary" @click="openGradesDialog(item)">
                  <v-icon size="small">mdi-clipboard-text</v-icon>
                  <v-tooltip activator="parent">{{ $t('grades') }}</v-tooltip>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="error" @click="confirmDeleteStudent(item)">
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>

              <template #no-data>
                <div class="text-center py-4">
                  <v-icon size="48" color="grey">mdi-account-off</v-icon>
                  <p class="mt-2">{{ $t('no_students_in_class') }}</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Stats Panel -->
      <v-col cols="12" lg="4">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-chart-bar</v-icon>
            {{ $t('class_statistics') }}
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-account-group</v-icon>
                </template>
                <v-list-item-title>{{ $t('headcount') }}</v-list-item-title>
                <template #append>
                  <strong>{{ students.length }} {{ $t('persons') }}</strong>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-school</v-icon>
                </template>
                <v-list-item-title>{{ $t('study_program') }}</v-list-item-title>
                <template #append>
                  <span class="text-caption">{{ selectedClass?.courses?.title_hu || '-' }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-translate</v-icon>
                </template>
                <v-list-item-title>{{ $t('department') }}</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" :color="selectedClass?.language === 'class_hun' ? 'success' : 'info'">
                    {{ selectedClass?.language === 'class_hun' ? $t('hungarian') : $t('serbian') }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
            {{ $t('quick_actions') }}
          </v-card-title>
          <v-card-text>
            <v-btn block color="primary" variant="outlined" class="mb-2" @click="openBulkGradeEntry">
              <v-icon left>mdi-clipboard-edit</v-icon>
              {{ $t('bulk_grade_entry') }}
            </v-btn>
            <v-btn block color="secondary" variant="outlined" class="mb-2" @click="exportStudentList">
              <v-icon left>mdi-download</v-icon>
              {{ $t('export_list') }}
            </v-btn>
            <v-btn block color="success" variant="outlined" class="mb-2" @click="openExcelImportDialog">
              <v-icon left>mdi-file-excel</v-icon>
              {{ $t('import_from_excel') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-card class="text-center py-8">
          <v-icon size="64" color="grey">mdi-school-outline</v-icon>
          <h3 class="mt-4 text-grey">{{ $t('select_class_from_menu') }}</h3>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Student Dialog -->
    <v-dialog v-model="showStudentDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">{{ editingStudent ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ editingStudent ? $t('edit_student') : $t('add_new_student') }}
        </v-card-title>
        <v-card-text>
          <v-form ref="studentFormRef" v-model="studentFormValid">
            <v-row>
              <v-col cols="12" class="pb-0">
                <h4 class="text-subtitle-2 text-grey mb-2">{{ $t('personal_data') }}</h4>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="studentForm.lastname_hu"
                  :label="$t('lastname_hungarian')"
                  :rules="[v => !!v || $t('required_field')]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="studentForm.firstname_hu"
                  :label="$t('firstname_hungarian')"
                  :rules="[v => !!v || $t('required_field')]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="studentForm.lastname_rs"
                  :label="$t('lastname_serbian')"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="studentForm.firstname_rs"
                  :label="$t('firstname_serbian')"
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="pb-0">
                <h4 class="text-subtitle-2 text-grey mb-2">{{ $t('birth_data') }}</h4>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="studentForm.birth_year"
                  :label="$t('year')"
                  type="number"
                  :min="1990"
                  :max="2020"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="studentForm.birth_month"
                  :items="months"
                  :label="$t('month')"
                ></v-select>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="studentForm.birth_day"
                  :label="$t('day')"
                  type="number"
                  :min="1"
                  :max="31"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="studentForm.birth_place"
                  :items="places"
                  item-title="place_hu"
                  item-value="$id"
                  :label="$t('birth_place')"
                  clearable
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #subtitle>{{ item.raw.place_rs }}</template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="studentForm.JMBG"
                  :label="$t('jmbg_personal_number')"
                  maxlength="13"
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="pb-0">
                <h4 class="text-subtitle-2 text-grey mb-2">{{ $t('school_data') }}</h4>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="studentForm.foreign_language"
                  :items="foreignLanguages"
                  item-title="name_hu"
                  item-value="$id"
                  :label="$t('foreign_language')"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="studentForm.religion_option"
                  :items="religionOptions"
                  item-title="name_hu"
                  item-value="$id"
                  :label="$t('religion_civics')"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="studentForm.generation"
                  :items="generations"
                  item-title="name"
                  item-value="$id"
                  :label="$t('generation')"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="studentForm.study_program"
                  :items="studyPrograms"
                  item-title="study_program_name_hu"
                  item-value="$id"
                  :label="$t('study_program')"
                  clearable
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showStudentDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" :loading="isSavingStudent" :disabled="!studentFormValid" @click="saveStudent">
            {{ editingStudent ? $t('save') : $t('add') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Grades Dialog (Éves osztályzatok) -->
    <v-dialog v-model="showGradesDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-clipboard-text</v-icon>
          {{ selectedStudentForGrades?.lastname_hu }} {{ selectedStudentForGrades?.firstname_hu }} - {{ $t('yearly_grades') }}
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            {{ $t('yearly_grades_info') }}
          </v-alert>

          <v-list v-if="studentGrades.length > 0">
            <v-list-item
              v-for="grade in studentGrades"
              :key="grade.$id"
              class="border rounded mb-2"
            >
              <v-list-item-title>{{ (grade.subject as any)?.name_hu || 'N/A' }}</v-list-item-title>
              <v-list-item-subtitle>{{ (grade.subject as any)?.name_rs || '' }}</v-list-item-subtitle>
              <template #append>
                <v-chip
                  :color="getGradeColor(grade.grade)"
                  class="mr-2"
                  size="large"
                >
                  {{ grade.grade }}
                </v-chip>
                <v-btn icon size="x-small" variant="text" @click="editGrade(grade)">
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="error" @click="deleteGrade(grade.$id)">
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8 text-grey">
            <v-icon size="48">mdi-clipboard-off</v-icon>
            <p class="mt-2">{{ $t('no_yearly_grades') }}</p>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Add Grade Form -->
          <h4 class="mb-3">{{ $t('add_grade') }}</h4>
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="newGrade.subject"
                :items="subjects"
                item-title="name_hu"
                item-value="$id"
                :label="$t('subject')"
                clearable
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #subtitle>{{ item.raw.name_rs }}</template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="newGrade.grade"
                :items="[1, 2, 3, 4, 5]"
                :label="$t('grade')"
              ></v-select>
            </v-col>
            <v-col cols="6" md="3">
              <v-btn
                color="primary"
                block
                :disabled="!newGrade.subject || !newGrade.grade"
                :loading="isAddingGrade"
                @click="addGrade"
              >
                <v-icon left>mdi-plus</v-icon>
                {{ $t('add') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showGradesDialog = false">{{ $t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Grade Entry Dialog -->
    <v-dialog v-model="showBulkGradeDialog" max-width="1000" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-clipboard-edit</v-icon>
          {{ $t('bulk_grade_entry') }}
          <v-spacer></v-spacer>
          <v-select
            v-model="bulkGradeSubject"
            :items="subjects"
            item-title="name_hu"
            item-value="$id"
            :label="$t('subject')"
            density="compact"
            hide-details
            style="max-width: 250px"
            class="mr-2"
          ></v-select>
                  </v-card-title>
        <v-card-text v-if="bulkGradeSubject">
          <v-table density="compact">
            <thead>
              <tr>
                <th>{{ $t('student_name') }}</th>
                <th width="100">{{ $t('grade') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.$id">
                <td>{{ student.lastname_hu }} {{ student.firstname_hu }}</td>
                <td>
                  <v-select
                    v-model="bulkGrades[student.$id!]"
                    :items="[null, 1, 2, 3, 4, 5]"
                    density="compact"
                    hide-details
                    variant="underlined"
                  >
                    <template #selection="{ item }">
                      <v-chip v-if="item.value" :color="getGradeColor(item.value)" size="small">
                        {{ item.value }}
                      </v-chip>
                      <span v-else class="text-grey">-</span>
                    </template>
                  </v-select>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-text v-else class="text-center py-8">
          <v-icon size="48" color="grey">mdi-book</v-icon>
          <p class="mt-2 text-grey">{{ $t('select_subject_for_grades') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showBulkGradeDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" :loading="isSavingBulkGrades" :disabled="!bulkGradeSubject" @click="saveBulkGrades">
            {{ $t('save_grades') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Student Confirmation -->
    <v-dialog v-model="showDeleteStudentDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          {{ $t('delete_student') }}
        </v-card-title>
        <v-card-text>
          {{ $t('confirm_delete_student', { name: `${deletingStudent?.lastname_hu} ${deletingStudent?.firstname_hu}` }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteStudentDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="error" :loading="isDeletingStudent" @click="deleteStudent">{{ $t('delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Excel Import Dialog -->
    <v-dialog v-model="showExcelImportDialog" max-width="900" scrollable persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="success">mdi-file-excel</v-icon>
          {{ $t('import_from_excel') }}
          <v-spacer></v-spacer>
          <v-btn icon size="small" variant="text" @click="closeExcelImportDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <!-- Step 1: File Upload -->
          <v-stepper v-model="excelImportStep" :items="excelImportSteps" hide-actions>
            <template #item.1>
              <v-card flat>
                <v-card-text>
                  <v-file-input
                    v-model="excelFile"
                    :label="$t('select_excel_file')"
                    accept=".xls,.xlsx,.csv"
                    prepend-icon="mdi-file-excel"
                    show-size
                    @update:model-value="onExcelFileSelected"
                  ></v-file-input>

                  <v-alert v-if="excelFileError" type="error" variant="tonal" class="mt-3">
                    {{ excelFileError }}
                  </v-alert>

                  <div v-if="excelSheets.length > 0" class="mt-4">
                    <h4 class="mb-2">{{ $t('select_sheet') }}</h4>
                    <v-radio-group v-model="selectedSheetName">
                      <v-radio
                        v-for="sheet in excelSheets"
                        :key="sheet.name"
                        :label="`${sheet.name} (${sheet.rowCount} ${$t('rows')})`"
                        :value="sheet.name"
                      ></v-radio>
                    </v-radio-group>
                  </div>
                </v-card-text>
              </v-card>
            </template>

            <template #item.2>
              <v-card flat>
                <v-card-text>
                  <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                    {{ $t('column_mapping_info') }}
                  </v-alert>

                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>{{ $t('excel_column') }}</th>
                        <th>{{ $t('target_field') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(mapping, index) in columnMappings" :key="index">
                        <td>{{ mapping.excelColumn }}</td>
                        <td>
                          <v-select
                            v-model="columnMappings[index].targetField"
                            :items="availableTargetFields"
                            item-title="label"
                            item-value="value"
                            density="compact"
                            hide-details
                            clearable
                            variant="underlined"
                          ></v-select>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </template>

            <template #item.3>
              <v-card flat>
                <v-card-text>
                  <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                    {{ $t('preview_import_data') }}
                  </v-alert>

                  <div v-if="importPreviewData.length > 0">
                    <v-chip class="mb-3 mr-2" color="primary">
                      {{ importPreviewData.length }} {{ $t('students_to_import') }}
                    </v-chip>

                    <v-data-table
                      :headers="importPreviewHeaders"
                      :items="importPreviewData.slice(0, 10)"
                      density="compact"
                      class="elevation-1"
                    >
                      <template #bottom>
                        <div v-if="importPreviewData.length > 10" class="text-center py-2 text-grey">
                          ... {{ $t('and_more', { count: importPreviewData.length - 10 }) }}
                        </div>
                      </template>
                    </v-data-table>
                  </div>

                  <v-alert v-if="importResult?.errors?.length" type="warning" variant="tonal" class="mt-4">
                    {{ $t('import_errors', { count: importResult.errors.length }) }}
                    <ul class="mt-2">
                      <li v-for="err in importResult.errors.slice(0, 5)" :key="err.row">
                        {{ $t('row') }} {{ err.row }}: {{ err.error }}
                      </li>
                    </ul>
                  </v-alert>
                </v-card-text>
              </v-card>
            </template>

            <template #item.4>
              <v-card flat>
                <v-card-text class="text-center py-8">
                  <div v-if="isImporting">
                    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                    <p class="mt-4">{{ $t('importing_students') }}...</p>
                  </div>
                  <div v-else-if="importCompleted">
                    <v-icon size="64" color="success">mdi-check-circle</v-icon>
                    <h3 class="mt-4 text-success">{{ $t('import_completed') }}</h3>
                    <p class="mt-2">
                      {{ $t('imported_count', { count: importedCount }) }}
                    </p>
                    <p v-if="importSkippedCount > 0" class="text-grey">
                      {{ $t('skipped_count', { count: importSkippedCount }) }}
                    </p>
                  </div>
                </v-card-text>
              </v-card>
            </template>
          </v-stepper>
        </v-card-text>

        <v-card-actions>
          <v-btn
            v-if="excelImportStep > 1 && !importCompleted"
            variant="text"
            @click="excelImportStep--"
          >
            {{ $t('back') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeExcelImportDialog">
            {{ importCompleted ? $t('close') : $t('cancel') }}
          </v-btn>
          <v-btn
            v-if="excelImportStep === 1 && selectedSheetName"
            color="primary"
            @click="proceedToColumnMapping"
          >
            {{ $t('next') }}
          </v-btn>
          <v-btn
            v-if="excelImportStep === 2"
            color="primary"
            @click="proceedToPreview"
          >
            {{ $t('preview') }}
          </v-btn>
          <v-btn
            v-if="excelImportStep === 3 && importPreviewData.length > 0"
            color="success"
            :loading="isImporting"
            @click="executeImport"
          >
            {{ $t('import') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { Databases, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';
import { loadRelations, commonRelations, erpRelations } from '@/appwrite/relationHelper';
import { ErpService, type Subject, type StudyProgram, type Generation, type Place, type ForeignLanguage, type ReligionOption, type SchoolYear } from '@/services/ErpService';
import { ExcelImportService, type ExcelSheetInfo, type ExcelColumnMapping, type ImportResult, type ExcelStudentData } from '@/services/ExcelImportService';
import { useLoadingStore } from '@/stores/loading';
import { useI18n } from 'vue-i18n';

interface Student {
  $id?: string;
  firstname_hu: string;
  firstname_rs?: string;
  lastname_hu?: string;
  lastname_rs?: string;
  JMBG?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_place?: string | Place;
  foreign_language?: string | ForeignLanguage;
  religion_option?: string | ReligionOption;
  study_program?: string | StudyProgram;
  generation?: string | Generation;
}

interface ClassItem {
  $id: string;
  year: number;
  designation: number;
  language: string;
  workers?: any;
  courses?: any;
  displayName?: string;
}

interface StudentGrade {
  $id?: string;
  student?: string | Student;
  subject?: string | Subject;
  school_year?: string | SchoolYear;
  grade: number;
  semester?: number;
  is_final?: boolean;
}

export default defineComponent({
  name: 'ClassTeacherDashboard',
  setup() {
    const { t } = useI18n();
    const databases = new Databases(appw);
    const erpService = ErpService.getInstance();
    const excelImportService = ExcelImportService.getInstance();
    const loadingStore = useLoadingStore();

    // Data
    const classes = ref<ClassItem[]>([]);
    const students = ref<Student[]>([]);
    const subjects = ref<Subject[]>([]);
    const studyPrograms = ref<StudyProgram[]>([]);
    const generations = ref<Generation[]>([]);
    const places = ref<Place[]>([]);
    const foreignLanguages = ref<ForeignLanguage[]>([]);
    const religionOptions = ref<ReligionOption[]>([]);
    const schoolYears = ref<SchoolYear[]>([]);
    const studentGrades = ref<StudentGrade[]>([]);

    // Selection
    const selectedClassId = ref<string | null>(null);
    const selectedSchoolYearId = ref<string | null>(null);
    const studentSearch = ref('');

    // Loading states
    const isLoadingStudents = ref(false);
    const isSavingStudent = ref(false);
    const isDeletingStudent = ref(false);
    const isAddingGrade = ref(false);
    const isSavingBulkGrades = ref(false);

    // Dialogs
    const showStudentDialog = ref(false);
    const showGradesDialog = ref(false);
    const showBulkGradeDialog = ref(false);
    const showDeleteStudentDialog = ref(false);
    const showExcelImportDialog = ref(false);

    // Excel Import State
    const excelImportStep = ref(1);
    const excelImportSteps = computed(() => [
      { title: t('file_selection'), value: 1 },
      { title: t('column_mapping'), value: 2 },
      { title: t('preview'), value: 3 },
      { title: t('import'), value: 4 }
    ]);
    const excelFile = ref<File[] | null>(null);
    const excelFileError = ref<string | null>(null);
    const excelSheets = ref<ExcelSheetInfo[]>([]);
    const selectedSheetName = ref<string | null>(null);
    const columnMappings = ref<ExcelColumnMapping[]>([]);
    const availableTargetFields = ref(excelImportService.getAvailableTargetFields());
    const importResult = ref<ImportResult | null>(null);
    const importPreviewData = ref<ExcelStudentData[]>([]);
    const isImporting = ref(false);
    const importCompleted = ref(false);
    const importedCount = ref(0);
    const importSkippedCount = ref(0);

    const importPreviewHeaders = computed(() => [
      { title: t('lastname_hungarian'), key: 'lastname_hu' },
      { title: t('firstname_hungarian'), key: 'firstname_hu' },
      { title: t('lastname_serbian'), key: 'lastname_rs' },
      { title: t('firstname_serbian'), key: 'firstname_rs' },
      { title: 'JMBG', key: 'JMBG' },
      { title: t('birth_date'), key: 'birth_display' }
    ]);

    // Form states
    const studentFormRef = ref();
    const studentFormValid = ref(false);
    const editingStudent = ref<Student | null>(null);
    const deletingStudent = ref<Student | null>(null);
    const selectedStudentForGrades = ref<Student | null>(null);

    const studentForm = ref({
      firstname_hu: '',
      firstname_rs: '',
      lastname_hu: '',
      lastname_rs: '',
      JMBG: '',
      birth_year: null as number | null,
      birth_month: null as number | null,
      birth_day: null as number | null,
      birth_place: null as string | null,
      foreign_language: null as string | null,
      religion_option: null as string | null,
      study_program: null as string | null,
      generation: null as string | null
    });

    const newGrade = ref({
      subject: null as string | null,
      grade: null as number | null
    });

    const bulkGradeSubject = ref<string | null>(null);
    const bulkGrades = ref<Record<string, number | null>>({});

    const months = computed(() => [
      { value: 1, title: t('month_january') },
      { value: 2, title: t('month_february') },
      { value: 3, title: t('month_march') },
      { value: 4, title: t('month_april') },
      { value: 5, title: t('month_may') },
      { value: 6, title: t('month_june') },
      { value: 7, title: t('month_july') },
      { value: 8, title: t('month_august') },
      { value: 9, title: t('month_september') },
      { value: 10, title: t('month_october') },
      { value: 11, title: t('month_november') },
      { value: 12, title: t('month_december') }
    ]);

    const studentHeaders = computed(() => [
      { title: t('name'), key: 'name', sortable: true },
      { title: t('birth_date'), key: 'birth', width: '140px' },
      { title: t('foreign_language'), key: 'foreign_language', width: '120px' },
      { title: t('operations'), key: 'actions', sortable: false, width: '130px' }
    ]);

    // Computed
    const selectedClass = computed(() =>
      classes.value.find(c => c.$id === selectedClassId.value)
    );

    const filteredStudents = computed(() => {
      if (!studentSearch.value) return students.value;
      const s = studentSearch.value.toLowerCase();
      return students.value.filter(st =>
        st.firstname_hu?.toLowerCase().includes(s) ||
        st.lastname_hu?.toLowerCase().includes(s) ||
        st.firstname_rs?.toLowerCase().includes(s) ||
        st.lastname_rs?.toLowerCase().includes(s)
      );
    });

    // Load functions
    const loadClasses = async () => {
      try {
        const result = await databases.listDocuments(
          config.website_db,
          config.classlist,
          [Query.orderAsc('year'), Query.orderAsc('designation'), Query.limit(100)]
        );

        // Betöltjük a workers és courses relációkat a helper segítségével
        const docsWithRelations = await loadRelations(result.documents, commonRelations.classes);

        let filteredDocs = docsWithRelations;

        // Teacher role: csak a hozzárendelt osztályokat mutassa
        if (loadingStore.userRole === 'teacher' && loadingStore.assignedClasses.length > 0) {
          filteredDocs = docsWithRelations.filter((doc: any) =>
            loadingStore.assignedClasses.includes(doc.$id)
          );
        }

        classes.value = filteredDocs.map((doc: any) => {
          const langLabel = doc.language === 'class_hun' ? 'Magyar' : 'Szerb';
          const courseName = doc.courses?.title_hu || doc.courses?.title_rs || '';
          const workerName = doc.workers?.worker_name_hu || doc.workers?.worker_name_rs || '';
          return {
            ...doc,
            displayName: `${doc.year}/${doc.designation} - ${langLabel}${courseName ? ` (${courseName})` : ''}${workerName ? ` - ${workerName}` : ''}`
          };
        });
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };

    const loadHelperData = async () => {
      const [subjectsRes, programsRes, genRes, placesRes, langRes, relRes, yearsRes] = await Promise.all([
        erpService.getSubjects(500),
        erpService.getStudyPrograms(100),
        erpService.getGenerations(),
        erpService.getPlaces(),
        erpService.getForeignLanguages(),
        erpService.getReligionOptions(),
        erpService.getSchoolYears()
      ]);

      subjects.value = subjectsRes.subjects;
      studyPrograms.value = programsRes.programs;
      generations.value = genRes;
      places.value = placesRes;
      foreignLanguages.value = langRes;
      religionOptions.value = relRes;
      schoolYears.value = yearsRes;

      if (yearsRes.length > 0) {
        selectedSchoolYearId.value = yearsRes[0].$id || null;
      }
    };

    const loadStudents = async () => {
      if (!selectedClass.value) {
        students.value = [];
        return;
      }

      isLoadingStudents.value = true;
      try {
        // Query students that match the class criteria
        // For now, we'll load all students and filter by generation/study_program
        const queries = [Query.limit(200)];

        // If the class has a course (study program), filter by it
        if (selectedClass.value.courses?.$id) {
          queries.push(Query.equal('study_program', selectedClass.value.courses.$id));
        }

        const result = await databases.listDocuments(
          config.erp_db,
          config.erp_students,
          queries
        );

        // Betöltjük a diákok relációit (birth_place, foreign_language, stb.)
        const studentsWithRelations = await loadRelations(result.documents, erpRelations.students);
        students.value = studentsWithRelations as unknown as Student[];
      } catch (error) {
        console.error('Failed to load students:', error);
        students.value = [];
      } finally {
        isLoadingStudents.value = false;
      }
    };

    const loadStudentGrades = async () => {
      if (!selectedStudentForGrades.value?.$id || !selectedSchoolYearId.value) {
        studentGrades.value = [];
        return;
      }

      try {
        const result = await databases.listDocuments(
          config.erp_db,
          config.erp_student_grades,
          [
            Query.equal('student', selectedStudentForGrades.value.$id),
            Query.equal('school_year', selectedSchoolYearId.value),
            Query.limit(100)
          ]
        );

        // Betöltjük a jegyek relációit (subject, stb.)
        const gradesWithRelations = await loadRelations(result.documents, erpRelations.studentGrades);
        studentGrades.value = gradesWithRelations as unknown as StudentGrade[];
      } catch (error) {
        console.error('Failed to load grades:', error);
        studentGrades.value = [];
      }
    };

    // Student CRUD
    const openAddStudentDialog = () => {
      editingStudent.value = null;
      studentForm.value = {
        firstname_hu: '',
        firstname_rs: '',
        lastname_hu: '',
        lastname_rs: '',
        JMBG: '',
        birth_year: null,
        birth_month: null,
        birth_day: null,
        birth_place: null,
        foreign_language: null,
        religion_option: null,
        study_program: selectedClass.value?.courses?.$id || null,
        generation: null
      };
      showStudentDialog.value = true;
    };

    const editStudent = (student: Student) => {
      editingStudent.value = student;
      studentForm.value = {
        firstname_hu: student.firstname_hu || '',
        firstname_rs: student.firstname_rs || '',
        lastname_hu: student.lastname_hu || '',
        lastname_rs: student.lastname_rs || '',
        JMBG: student.JMBG || '',
        birth_year: student.birth_year || null,
        birth_month: student.birth_month || null,
        birth_day: student.birth_day || null,
        birth_place: typeof student.birth_place === 'object' ? student.birth_place?.$id || null : student.birth_place || null,
        foreign_language: typeof student.foreign_language === 'object' ? student.foreign_language?.$id || null : student.foreign_language || null,
        religion_option: typeof student.religion_option === 'object' ? student.religion_option?.$id || null : student.religion_option || null,
        study_program: typeof student.study_program === 'object' ? student.study_program?.$id || null : student.study_program || null,
        generation: typeof student.generation === 'object' ? student.generation?.$id || null : student.generation || null
      };
      showStudentDialog.value = true;
    };

    const saveStudent = async () => {
      if (!studentFormValid.value) return;

      isSavingStudent.value = true;
      try {
        const data: any = {
          firstname_hu: studentForm.value.firstname_hu,
          firstname_rs: studentForm.value.firstname_rs || undefined,
          lastname_hu: studentForm.value.lastname_hu || undefined,
          lastname_rs: studentForm.value.lastname_rs || undefined,
          JMBG: studentForm.value.JMBG || undefined,
          birth_year: studentForm.value.birth_year || undefined,
          birth_month: studentForm.value.birth_month || undefined,
          birth_day: studentForm.value.birth_day || undefined,
          birth_place: studentForm.value.birth_place || undefined,
          foreign_language: studentForm.value.foreign_language || undefined,
          religion_option: studentForm.value.religion_option || undefined,
          study_program: studentForm.value.study_program || undefined,
          generation: studentForm.value.generation || undefined
        };

        // Remove undefined values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        if (editingStudent.value?.$id) {
          await databases.updateDocument(
            config.erp_db,
            config.erp_students,
            editingStudent.value.$id,
            data
          );
        } else {
          await databases.createDocument(
            config.erp_db,
            config.erp_students,
            ID.unique(),
            data
          );
        }

        showStudentDialog.value = false;
        await loadStudents();
      } catch (error) {
        console.error('Failed to save student:', error);
      } finally {
        isSavingStudent.value = false;
      }
    };

    const confirmDeleteStudent = (student: Student) => {
      deletingStudent.value = student;
      showDeleteStudentDialog.value = true;
    };

    const deleteStudent = async () => {
      if (!deletingStudent.value?.$id) return;

      isDeletingStudent.value = true;
      try {
        await databases.deleteDocument(
          config.erp_db,
          config.erp_students,
          deletingStudent.value.$id
        );
        showDeleteStudentDialog.value = false;
        await loadStudents();
      } catch (error) {
        console.error('Failed to delete student:', error);
      } finally {
        isDeletingStudent.value = false;
      }
    };

    // Grades
    const openGradesDialog = (student: Student) => {
      selectedStudentForGrades.value = student;
      newGrade.value = { subject: null, grade: null };
      showGradesDialog.value = true;
      loadStudentGrades();
    };

    const addGrade = async () => {
      if (!newGrade.value.subject || !newGrade.value.grade || !selectedStudentForGrades.value?.$id || !selectedSchoolYearId.value) return;

      isAddingGrade.value = true;
      try {
        await databases.createDocument(
          config.erp_db,
          config.erp_student_grades,
          ID.unique(),
          {
            student: selectedStudentForGrades.value.$id,
            subject: newGrade.value.subject,
            school_year: selectedSchoolYearId.value,
            grade: newGrade.value.grade
          }
        );
        newGrade.value = { subject: null, grade: null };
        await loadStudentGrades();
      } catch (error) {
        console.error('Failed to add grade:', error);
      } finally {
        isAddingGrade.value = false;
      }
    };

    const editGrade = (grade: StudentGrade) => {
      // For simplicity, we'll delete and re-add
      // A proper implementation would have an edit dialog
      console.log('Edit grade:', grade);
    };

    const deleteGrade = async (gradeId?: string) => {
      if (!gradeId) return;
      try {
        await databases.deleteDocument(config.erp_db, config.erp_student_grades, gradeId);
        await loadStudentGrades();
      } catch (error) {
        console.error('Failed to delete grade:', error);
      }
    };

    // Bulk grades
    const openBulkGradeEntry = () => {
      bulkGradeSubject.value = null;
      bulkGrades.value = {};
      students.value.forEach(s => {
        if (s.$id) bulkGrades.value[s.$id] = null;
      });
      showBulkGradeDialog.value = true;
    };

    const saveBulkGrades = async () => {
      if (!bulkGradeSubject.value || !selectedSchoolYearId.value) return;

      isSavingBulkGrades.value = true;
      try {
        const promises = [];
        for (const [studentId, grade] of Object.entries(bulkGrades.value)) {
          if (grade !== null && grade !== undefined) {
            promises.push(
              databases.createDocument(
                config.erp_db,
                config.erp_student_grades,
                ID.unique(),
                {
                  student: studentId,
                  subject: bulkGradeSubject.value,
                  school_year: selectedSchoolYearId.value,
                  grade: grade
                }
              )
            );
          }
        }
        await Promise.all(promises);
        showBulkGradeDialog.value = false;
      } catch (error) {
        console.error('Failed to save bulk grades:', error);
      } finally {
        isSavingBulkGrades.value = false;
      }
    };

    // Helpers
    const getGradeColor = (grade: number) => {
      if (grade === 5) return 'success';
      if (grade === 4) return 'light-green';
      if (grade === 3) return 'warning';
      if (grade === 2) return 'orange';
      return 'error';
    };

    const exportStudentList = () => {
      // Simple CSV export
      const headers = ['Vezetéknév (HU)', 'Keresztnév (HU)', 'Vezetéknév (RS)', 'Keresztnév (RS)', 'JMBG', 'Születési dátum'];
      const rows = students.value.map(s => [
        s.lastname_hu || '',
        s.firstname_hu || '',
        s.lastname_rs || '',
        s.firstname_rs || '',
        s.JMBG || '',
        s.birth_year ? `${s.birth_year}.${s.birth_month?.toString().padStart(2, '0')}.${s.birth_day?.toString().padStart(2, '0')}.` : ''
      ]);

      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedClass.value?.displayName || 'diakok'}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };

    // Excel Import Functions
    const openExcelImportDialog = () => {
      // Reset state
      excelImportStep.value = 1;
      excelFile.value = null;
      excelFileError.value = null;
      excelSheets.value = [];
      selectedSheetName.value = null;
      columnMappings.value = [];
      importResult.value = null;
      importPreviewData.value = [];
      isImporting.value = false;
      importCompleted.value = false;
      importedCount.value = 0;
      importSkippedCount.value = 0;
      showExcelImportDialog.value = true;
    };

    const closeExcelImportDialog = () => {
      showExcelImportDialog.value = false;
      if (importCompleted.value) {
        loadStudents();
      }
    };

    const onExcelFileSelected = async (files: File[] | null) => {
      excelFileError.value = null;
      excelSheets.value = [];
      selectedSheetName.value = null;

      if (!files || files.length === 0) return;

      const file = files[0];
      try {
        excelSheets.value = await excelImportService.readExcelFile(file);
        if (excelSheets.value.length > 0) {
          selectedSheetName.value = excelSheets.value[0].name;
        }
      } catch (error) {
        excelFileError.value = String(error);
      }
    };

    const proceedToColumnMapping = () => {
      if (!selectedSheetName.value) return;

      const selectedSheet = excelSheets.value.find(s => s.name === selectedSheetName.value);
      if (!selectedSheet) return;

      // Auto-detect column mappings
      const autoMappings = excelImportService.findColumnMappings(selectedSheet.columns);

      // Add remaining columns without mapping
      const mappedColumns = new Set(autoMappings.map(m => m.excelColumn));
      selectedSheet.columns.forEach(col => {
        if (!mappedColumns.has(col)) {
          autoMappings.push({
            excelColumn: col,
            targetField: ''
          });
        }
      });

      columnMappings.value = autoMappings;
      excelImportStep.value = 2;
    };

    const proceedToPreview = async () => {
      if (!excelFile.value || !selectedSheetName.value) return;

      try {
        // Filter only mappings with target fields
        const activeMappings = columnMappings.value.filter(m => m.targetField);

        importResult.value = await excelImportService.importSheet(
          excelFile.value[0],
          selectedSheetName.value,
          activeMappings,
          true
        );

        // Add display field for birth date
        importPreviewData.value = importResult.value.data.map(item => ({
          ...item,
          birth_display: item.birth_year
            ? `${item.birth_year}.${(item.birth_month || 1).toString().padStart(2, '0')}.${(item.birth_day || 1).toString().padStart(2, '0')}.`
            : '-'
        }));

        excelImportStep.value = 3;
      } catch (error) {
        excelFileError.value = String(error);
      }
    };

    const executeImport = async () => {
      if (!importPreviewData.value.length || !selectedClass.value) return;

      isImporting.value = true;
      importedCount.value = 0;
      importSkippedCount.value = 0;

      try {
        for (const studentData of importPreviewData.value) {
          try {
            // Prepare data for database
            const data: any = {
              firstname_hu: studentData.firstname_hu || '',
              firstname_rs: studentData.firstname_rs || undefined,
              lastname_hu: studentData.lastname_hu || undefined,
              lastname_rs: studentData.lastname_rs || undefined,
              JMBG: studentData.JMBG || undefined,
              birth_year: studentData.birth_year || undefined,
              birth_month: studentData.birth_month || undefined,
              birth_day: studentData.birth_day || undefined,
              // Set study program from current class if available
              study_program: selectedClass.value?.courses?.$id || undefined
            };

            // Remove undefined values
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            await databases.createDocument(
              config.erp_db,
              config.erp_students,
              ID.unique(),
              data
            );
            importedCount.value++;
          } catch (error) {
            console.error('Failed to import student:', studentData, error);
            importSkippedCount.value++;
          }
        }

        importCompleted.value = true;
        excelImportStep.value = 4;
      } catch (error) {
        excelFileError.value = String(error);
      } finally {
        isImporting.value = false;
      }
    };

    // Watchers
    watch(selectedClassId, () => {
      loadStudents();
    });

    watch(selectedSchoolYearId, () => {
      if (showGradesDialog.value) {
        loadStudentGrades();
      }
    });

    onMounted(async () => {
      await Promise.all([loadClasses(), loadHelperData()]);
    });

    return {
      // Data
      classes,
      students,
      subjects,
      studyPrograms,
      generations,
      places,
      foreignLanguages,
      religionOptions,
      schoolYears,
      studentGrades,

      // Selection
      selectedClassId,
      selectedSchoolYearId,
      selectedClass,
      studentSearch,

      // Loading
      isLoadingStudents,
      isSavingStudent,
      isDeletingStudent,
      isAddingGrade,
      isSavingBulkGrades,

      // Dialogs
      showStudentDialog,
      showGradesDialog,
      showBulkGradeDialog,
      showDeleteStudentDialog,
      showExcelImportDialog,

      // Excel Import
      excelImportStep,
      excelImportSteps,
      excelFile,
      excelFileError,
      excelSheets,
      selectedSheetName,
      columnMappings,
      availableTargetFields,
      importResult,
      importPreviewData,
      importPreviewHeaders,
      isImporting,
      importCompleted,
      importedCount,
      importSkippedCount,

      // Form
      studentFormRef,
      studentFormValid,
      editingStudent,
      deletingStudent,
      selectedStudentForGrades,
      studentForm,
      newGrade,
      bulkGradeSubject,
      bulkGrades,
      months,
      studentHeaders,
      filteredStudents,

      // Methods
      openAddStudentDialog,
      editStudent,
      saveStudent,
      confirmDeleteStudent,
      deleteStudent,
      openGradesDialog,
      addGrade,
      editGrade,
      deleteGrade,
      openBulkGradeEntry,
      saveBulkGrades,
      getGradeColor,
      exportStudentList,

      // Excel Import Methods
      openExcelImportDialog,
      closeExcelImportDialog,
      onExcelFileSelected,
      proceedToColumnMapping,
      proceedToPreview,
      executeImport
    };
  }
});
</script>
