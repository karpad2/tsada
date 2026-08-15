<template>
  <div class="page-shell">
  <div class="page-panel container">
  <v-container fluid class="pa-0">
    <div class="page-header">
      <h1 class="section-title !text-2xl !mb-1">{{ $t('print') }}</h1>
      <div class="section-accent !w-20"></div>
    </div>
    <v-row>
      <!-- Left Panel: Settings -->
      <v-col cols="12" lg="4">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-printer</v-icon>
            {{ $t('print_settings') }}
          </v-card-title>
          <v-card-text>
            <!-- 1. lépés: Fő dokumentum típus -->
            <v-select
              v-model="mainDocumentType"
              :items="mainDocumentTypes"
              item-title="label"
              item-value="value"
              :label="$t('document_type')"
              class="mb-4"
              @update:model-value="onMainDocumentTypeChange"
            ></v-select>

            <!-- 2. lépés: Főkönyv részei (multi-select, csak ha Főkönyv) -->
            <v-select
              v-if="mainDocumentType === 'grade_book'"
              v-model="selectedGradeBookParts"
              :items="gradeBookParts"
              item-title="label"
              item-value="value"
              :label="$t('print_sections')"
              multiple
              chips
              closable-chips
              class="mb-4"
              @update:model-value="onGradeBookPartsChange"
            ></v-select>

            <!-- 3. lépés: Évfolyam választó (csak ha évfolyam jegyek) -->
            <v-select
              v-if="selectedGradeBookParts.includes('grade_book_year')"
              v-model="selectedPrintYear"
              :items="yearOptions"
              item-title="label"
              item-value="value"
              :label="$t('print_year')"
              class="mb-4"
              @update:model-value="loadTemplateForSelection"
            ></v-select>

            <!-- Nyelvi variáns -->
            <v-select
              v-model="selectedFormLanguage"
              :items="formLanguageOptions"
              item-title="label"
              item-value="value"
              :label="$t('form_language_label')"
              class="mb-4"
              @update:model-value="loadTemplateForSelection"
            ></v-select>

            <!-- Template info -->
            <v-alert
              v-if="loadedTemplates.length > 0"
              type="info"
              density="compact"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-caption">{{ $t('loaded_templates_count', { count: loadedTemplates.length }) }}</div>
              <div v-for="t in loadedTemplates" :key="t.documentType" class="font-weight-medium">
                {{ t.name }}
              </div>
            </v-alert>
            <v-alert
              v-else-if="selectedDocumentTypes.length > 0"
              type="warning"
              density="compact"
              variant="tonal"
              class="mb-4"
            >
              {{ $t('no_template_for_config') }}
            </v-alert>

            <!-- Paper Size -->
            <v-select
              v-model="selectedPaperSize"
              :items="paperSizes"
              item-title="name"
              item-value="id"
              :label="$t('paper_size')"
              class="mb-4"
              @update:model-value="applyPaperSize"
            ></v-select>

            <v-row dense class="mb-4">
              <v-col cols="6">
                <v-text-field
                  v-model.number="pageSize.width"
                  :label="$t('width')"
                  type="number"
                  suffix="mm"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="pageSize.height"
                  :label="$t('height')"
                  type="number"
                  suffix="mm"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Class/Student Selection -->
            <v-select
              v-model="selectedClassId"
              :items="classes"
              item-title="displayName"
              item-value="$id"
              :label="$t('class')"
              class="mb-4"
            ></v-select>

            <!-- Szak választó -->
            <v-select
              v-model="selectedStudyProgramId"
              :items="studyPrograms"
              item-title="study_program_name_hu"
              item-value="$id"
              :label="$t('study_program_paper')"
              clearable
              class="mb-4"
              @update:model-value="loadTemplateForSelection"
            ></v-select>

            <v-select
              v-model="selectedSchoolYearId"
              :items="schoolYears"
              item-title="name"
              item-value="$id"
              :label="$t('school_year')"
              class="mb-4"
            ></v-select>

            <v-autocomplete
              v-model="selectedStudentId"
              :items="students"
              :item-title="studentDisplayName"
              item-value="$id"
              :label="$t('student_optional_print')"
              clearable
              class="mb-4"
            ></v-autocomplete>
          </v-card-text>
        </v-card>

        <!-- Position Settings -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-ruler</v-icon>
            {{ $t('position_fine_tune') }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="globalOffsetX"
                  :label="$t('horizontal_offset')"
                  type="number"
                  suffix="mm"
                  density="compact"
                  step="0.1"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="globalOffsetY"
                  :label="$t('vertical_offset') || $t('position_fine_tune')"
                  type="number"
                  suffix="mm"
                  density="compact"
                  step="0.1"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-expansion-panels variant="accordion" class="mt-4">
              <v-expansion-panel :title="$t('field_positions')">
                <v-expansion-panel-text>
                  <div v-for="(field, key) in fieldPositions" :key="key" class="mb-3">
                    <div class="text-caption text-grey mb-1">{{ field.label }}</div>
                    <v-row dense>
                      <v-col cols="3">
                        <v-text-field
                          v-model.number="field.x"
                          label="X"
                          type="number"
                          density="compact"
                          suffix="mm"
                          step="0.1"
                          hide-details
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          v-model.number="field.y"
                          label="Y"
                          type="number"
                          density="compact"
                          suffix="mm"
                          step="0.1"
                          hide-details
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          v-model.number="field.fontSize"
                          :label="$t('size')"
                          type="number"
                          density="compact"
                          suffix="pt"
                          hide-details
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          v-model.number="field.letterSpacing"
                          :label="$t('letter_spacing')"
                          type="number"
                          density="compact"
                          suffix="mm"
                          step="0.1"
                          hide-details
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel :title="$t('grades_table')">
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.startX"
                        :label="$t('start_x')"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.1"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.startY"
                        :label="$t('start_y')"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.1"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.rowHeight"
                        :label="$t('row_height')"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.1"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.gradeColumnX"
                        :label="$t('grade_column_x')"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.1"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <v-btn
              color="secondary"
              variant="outlined"
              block
              class="mt-4"
              @click="saveSettings"
            >
              <v-icon left>mdi-content-save</v-icon>
              {{ $t('save_settings') }}
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Actions -->
        <v-card>
          <v-card-text>
            <v-btn
              color="primary"
              block
              size="large"
              :loading="isPrinting"
              @click="printDocument"
            >
              <v-icon left>mdi-printer</v-icon>
              {{ $t('print') }}
            </v-btn>
            <v-btn
              color="secondary"
              variant="outlined"
              block
              class="mt-2"
              @click="printAll"
              :disabled="!selectedClassId"
            >
              <v-icon left>mdi-printer-multiple</v-icon>
              {{ $t('print_all_students') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Panel: Preview -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-eye</v-icon>
            {{ $t('preview') }}
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="previewMode" mandatory density="compact">
              <v-btn value="preview">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn value="grid">
                <v-icon>mdi-grid</v-icon>
              </v-btn>
            </v-btn-toggle>
            <v-slider
              v-model="previewScale"
              :min="20"
              :max="100"
              :step="5"
              hide-details
              style="max-width: 150px"
              class="ml-4"
            >
              <template #prepend>
                <v-icon size="small">mdi-magnify-minus</v-icon>
              </template>
              <template #append>
                <v-icon size="small">mdi-magnify-plus</v-icon>
              </template>
            </v-slider>
          </v-card-title>
          <v-card-text>
            <div class="preview-container" :style="{ transform: `scale(${previewScale / 100})` }">
              <div
                ref="printArea"
                class="print-page"
                :class="{ 'show-grid': previewMode === 'grid' }"
                :style="pageStyle"
              >
                <!-- Generikus mező renderelés minden betöltött sablonból -->
                <div
                  v-for="(field, key) in fieldPositions"
                  :key="key"
                  class="print-field"
                  :style="getFieldStyle(field)"
                >
                  <template v-if="getPreviewFieldValue(key) && getPreviewFieldValue(key) !== key">
                    {{ getPreviewFieldValue(key) }}
                  </template>
                  <template v-else-if="field.strikethrough">
                    <div class="strikethrough-line" :style="{ width: (field.strikethroughWidth || 30) + 'mm' }"></div>
                  </template>
                  <template v-else>
                    {{ getPreviewFieldValue(key) }}
                  </template>
                </div>

                <!-- Grades Table (ha grade_book_year típus aktív) -->
                <template v-if="selectedDocumentTypes.includes('grade_book_year')">
                  <div
                    v-for="(grade, index) in previewData.grades"
                    :key="'grade-' + index"
                    class="print-field"
                    :style="getGradeStyle(index)"
                  >
                    {{ grade.grade }}
                  </div>

                  <!-- Subject Names (optional, for reference) -->
                  <div
                    v-for="(grade, index) in previewData.grades"
                    :key="'subj-' + index"
                    class="print-field print-field-subject"
                    :style="getSubjectStyle(index)"
                  >
                    {{ grade.subjectName }}
                  </div>
                </template>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Print Style (injected for actual printing) -->
    <component :is="'style'" v-if="isPrinting">
      @media print {
        body * { visibility: hidden; }
        .print-page, .print-page * { visibility: visible; }
        .print-page {
          position: absolute;
          left: 0;
          top: 0;
          width: {{ pageSize.width }}mm !important;
          height: {{ pageSize.height }}mm !important;
        }
        .print-field-subject { display: none !important; }
        @page {
          size: {{ pageSize.width }}mm {{ pageSize.height }}mm;
          margin: 0;
        }
      }
    </component>
  </v-container>
  </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { notify } from '@kyvg/vue3-notification';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { loadRelations, commonRelations, erpRelations } from '@/appwrite/relationHelper';
import { ErpService, type StudyProgram, type SchoolYear } from '@/services/ErpService';
import PrintTemplateService, { type PrintTemplate } from '@/services/PrintTemplateService';

const databases = new Databases(appw);

interface FieldPosition {
  label: string;
  x: number;
  y: number;
  fontSize: number;
  letterSpacing?: number;
  strikethrough?: boolean;
  strikethroughWidth?: number;
}

interface Student {
  $id: string;
  firstname_hu: string;
  firstname_rs?: string;
  lastname_hu?: string;
  lastname_rs?: string;
  JMBG?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_place?: any;
  study_program?: any;
}

interface GradeData {
  subjectName: string;
  grade: number;
}

const STORAGE_KEY = 'erp_print_settings';

export default defineComponent({
  name: 'PrintManager',
  setup() {
    const erpService = ErpService.getInstance();
    const { t } = useI18n();

    const mainDocumentTypes = computed(() => [
      { value: 'grade_book', label: t('doc_grade_book') },
      { value: 'certificate', label: t('doc_certificate') },
      { value: 'enrollment', label: t('doc_enrollment') }
    ]);

    const gradeBookParts = computed(() => [
      { value: 'grade_book_base', label: t('grade_book_base') },
      { value: 'grade_book_year', label: t('grade_book_year') },
      { value: 'grade_book_matura', label: t('grade_book_matura') },
      { value: 'grade_book_certificates', label: t('grade_book_certificates') }
    ]);

    const yearOptions = computed(() => [
      { value: 1, label: t('year_n', { n: 1 }) },
      { value: 2, label: t('year_n', { n: 2 }) },
      { value: 3, label: t('year_n', { n: 3 }) },
      { value: 4, label: t('year_n', { n: 4 }) }
    ]);

    const formLanguageOptions = computed(() => [
      { value: 'bilingual', label: t('lang_bilingual') },
      { value: 'serbian', label: t('lang_serbian') }
    ]);

    // Current template from database
    const currentTemplate = ref<PrintTemplate | null>(null);
    const loadedTemplates = ref<PrintTemplate[]>([]);
    const mainDocumentType = ref<string>('grade_book');
    const selectedGradeBookParts = ref<string[]>(['grade_book_base']);
    const selectedFormLanguage = ref<'bilingual' | 'serbian'>('bilingual');
    const documentType = ref<string>('grade_book_base'); // backward compat
    const selectedPrintYear = ref<number>(1);

    // Computed: tényleges kiválasztott típusok a hierarchiából
    const selectedDocumentTypes = computed(() => {
      if (mainDocumentType.value === 'grade_book') {
        return selectedGradeBookParts.value;
      }
      return [mainDocumentType.value];
    });

    // Paper sizes
    const paperSizes = computed(() => [
      { id: 'a2', name: 'A2 (420 × 594 mm)', width: 420, height: 594 },
      { id: 'a2_landscape', name: `A2 ${t('paper_landscape')} (594 × 420 mm)`, width: 594, height: 420 },
      { id: 'a3', name: 'A3 (297 × 420 mm)', width: 297, height: 420 },
      { id: 'a3_landscape', name: `A3 ${t('paper_landscape')} (420 × 297 mm)`, width: 420, height: 297 },
      { id: 'a4', name: 'A4 (210 × 297 mm)', width: 210, height: 297 },
      { id: 'a4_landscape', name: `A4 ${t('paper_landscape')} (297 × 210 mm)`, width: 297, height: 210 },
      { id: 'custom', name: t('paper_custom'), width: 420, height: 594 }
    ]);
    const selectedPaperSize = ref('a2');

    // Data
    const classes = ref<any[]>([]);
    const students = ref<Student[]>([]);
    const schoolYears = ref<SchoolYear[]>([]);
    const studentGrades = ref<any[]>([]);
    const studyPrograms = ref<StudyProgram[]>([]);

    // Selection
    const selectedClassId = ref<string | null>(null);
    const selectedSchoolYearId = ref<string | null>(null);
    const selectedStudentId = ref<string | null>(null);
    const selectedStudyProgramId = ref<string | null>(null);

    // Sablon betöltése az adatbázisból - több típus egyidejű támogatása
    const loadTemplateForSelection = async () => {
      try {
        // Szak meghatározása: 1) explicit választás, 2) diákból, 3) osztályból
        const student = students.value.find(s => s.$id === selectedStudentId.value);
        const studyProgramId = selectedStudyProgramId.value
          || student?.study_program?.$id
          || null;

        const templates: PrintTemplate[] = [];
        const mergedPositions: Record<string, FieldPosition> = {};

        for (const docType of selectedDocumentTypes.value) {
          const year = docType === 'grade_book_base' ? 0
            : (docType === 'grade_book_matura' || docType === 'grade_book_certificates') ? 4
            : selectedPrintYear.value;

          let template = await PrintTemplateService.getTemplate(
            studyProgramId,
            year,
            docType,
            selectedFormLanguage.value
          );

          if (!template) {
            template = PrintTemplateService.getDefaultTemplate(year, docType as any);
          }

          templates.push(template);

          // Mezők összegyűjtése minden sablonból
          for (const field of template.fields) {
            mergedPositions[field.fieldId] = {
              label: field.label,
              x: field.x,
              y: field.y,
              fontSize: field.fontSize,
              letterSpacing: field.letterSpacing,
              strikethrough: field.strikethrough,
              strikethroughWidth: field.strikethroughWidth
            };
          }
        }

        loadedTemplates.value = templates;
        currentTemplate.value = templates.length > 0 ? templates[0] : null;
        documentType.value = selectedDocumentTypes.value[0] || 'grade_book_base';

        // Papírméret az első sablontól
        if (templates.length > 0) {
          pageSize.value.width = templates[0].paperSize.width;
          pageSize.value.height = templates[0].paperSize.height;
          globalOffsetX.value = templates[0].globalOffset.x;
          globalOffsetY.value = templates[0].globalOffset.y;
        }

        fieldPositions.value = mergedPositions;

        // Jegytáblázat pozíció (grade_book_year-ből ha van)
        const yearTemplate = templates.find(t => t.documentType === 'grade_book_year');
        if (yearTemplate?.gradesTable) {
          gradesTablePosition.value = {
            startX: yearTemplate.gradesTable.startX,
            startY: yearTemplate.gradesTable.startY,
            rowHeight: yearTemplate.gradesTable.rowHeight,
            gradeColumnX: yearTemplate.gradesTable.gradeColumnOffsetX,
            subjectColumnX: yearTemplate.gradesTable.startX,
            fontSize: yearTemplate.gradesTable.fontSize
          };
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        currentTemplate.value = null;
        loadedTemplates.value = [];
      }
    };

    // Fő dokumentum típus változásakor
    const onMainDocumentTypeChange = () => {
      if (mainDocumentType.value === 'grade_book') {
        // Alapértelmezett: alap adatok
        if (selectedGradeBookParts.value.length === 0) {
          selectedGradeBookParts.value = ['grade_book_base'];
        }
        documentType.value = selectedGradeBookParts.value[0] || 'grade_book_base';
      } else {
        documentType.value = mainDocumentType.value;
      }
      loadTemplateForSelection();
    };

    // Főkönyv részei változásakor
    const onGradeBookPartsChange = () => {
      if (selectedGradeBookParts.value.length > 0) {
        documentType.value = selectedGradeBookParts.value[0];
      }
      loadTemplateForSelection();
    };

    // Előnézet mező érték lekérdezése
    const getPreviewFieldValue = (key: string): string => {
      const student = students.value.find(s => s.$id === selectedStudentId.value);
      const schoolYear = schoolYears.value.find(y => y.$id === selectedSchoolYearId.value);

      // Valódi adatok, ha van kiválasztott diák
      if (student) {
        const realData: Record<string, string> = {
          studentName: `${student.lastname_hu || ''} ${student.firstname_hu || ''}`,
          studentNameRs: `${student.lastname_rs || ''} ${student.firstname_rs || ''}`,
          birthDate: student.birth_year
            ? `${student.birth_year}.${String(student.birth_month || 1).padStart(2, '0')}.${String(student.birth_day || 1).padStart(2, '0')}.`
            : '',
          birthPlace: student.birth_place?.place_hu || '',
          birthPlaceRs: student.birth_place?.place_rs || '',
          jmbg: student.JMBG || '',
          studyProgram: student.study_program?.study_program_name_hu || '',
          studyProgramRs: student.study_program?.study_program_name_rs || '',
          schoolYear: schoolYear?.name || ''
        };
        if (realData[key]) return realData[key];
      }

      // Minta adatok
      const sampleData: Record<string, string> = {
        studentName: 'Kovács János',
        studentNameRs: 'Јанош Ковач',
        birthDate: '2008.05.15.',
        birthPlace: 'Szabadka',
        birthPlaceRs: 'Суботица',
        jmbg: '1505008123456',
        studyProgram: 'Gimnázium',
        studyProgramRs: 'Гимназија',
        schoolYear: '2024/2025',
        className: 'I-1',
        classTeacher: 'Nagy Péter',
        enrollmentNumber: '123/2024',
        registryNumber: '45',
        fatherName: 'Kovács István',
        motherName: 'Kiss Mária',
        parentName: 'Kovács István',
        parentAddress: 'Szabadka, Kossuth u. 12.',
        parentPhone: '+381 24 123 456',
        enrollmentDate: '2024.09.01.',
        educationType: 'Rendes',
        educationDuration: '4 év',
        generation: '2024/2028',
        foreignLanguage: 'Angol',
        religionOption: 'Hittan',
        finalGrade: '4.52',
        behaviorText: 'примерно / példás',
        generalSuccess: 'врло добар / jó',
        absencesTotal: '45',
        absencesJustified: '40',
        absencesUnjustified: '5',
        date: '2025.06.15.',
        directorSignature: 'Dr. Szabó Endre',
        maturaSchoolYear: '2027/2028',
        maturaYear: '2028',
        maturaClassYear: 'IV',
        maturaSubject1Name: 'Magyar nyelv',
        maturaSubject1Grade: '5',
        maturaSubject2Name: 'Matematika',
        maturaSubject2Grade: '4',
        maturaSubject3Name: 'Szakmai tárgy',
        maturaSubject3Grade: '5',
        maturaPracticalDesc: 'Gyakorlati vizsga',
        maturaPracticalGrade: '5',
        maturaFinalGrade: 'Jeles (5)',
        maturaResult: 'jeles eredménnyel',
        maturaDate: '2028.06.20.',
        diplomaNumber: '03-123/2028',
        diplomaDate: '2028.06.25.',
        certificateNumber: '05-456/2028',
        certificateDate: '2028.06.25.',
        serialNumber: 'А-123456',
        classTeacherSign: 'Nagy Péter',
        examCommitteeChair: 'Dr. Horvát Anna',
        receivedDate: '2028.07.01.',
        receivedSignature: 'Kovács István',
        notes: 'Megjegyzés'
      };
      return sampleData[key] || key;
    };

    // Preview
    const previewMode = ref('preview');
    const previewScale = ref(40); // Lower scale for A2 preview
    const printArea = ref<HTMLElement | null>(null);
    const isPrinting = ref(false);

    // Page settings (A2 by default for grade books)
    const pageSize = ref({
      width: 420,
      height: 594
    });

    const applyPaperSize = (sizeId: string) => {
      const size = paperSizes.value.find(p => p.id === sizeId);
      if (size && sizeId !== 'custom') {
        pageSize.value.width = size.width;
        pageSize.value.height = size.height;
      }
    };

    // Global offset for entire page alignment
    const globalOffsetX = ref(0);
    const globalOffsetY = ref(0);

    // Field positions (in mm from top-left) - adjusted for A2 size
    const fieldPositions = ref<Record<string, FieldPosition>>({
      studentName: { label: t('tpl_student_name'), x: 80, y: 60, fontSize: 14 },
      birthDate: { label: t('tpl_birth_date'), x: 80, y: 75, fontSize: 11 },
      birthPlace: { label: t('tpl_birth_place'), x: 80, y: 90, fontSize: 11 },
      jmbg: { label: t('tpl_jmbg'), x: 80, y: 105, fontSize: 11 },
      studyProgram: { label: t('tpl_study_program'), x: 80, y: 120, fontSize: 11 },
      schoolYear: { label: t('tpl_school_year'), x: 300, y: 60, fontSize: 11 },
      classYear: { label: t('tpl_class_year'), x: 300, y: 75, fontSize: 11 }
    });

    // Grades table position - adjusted for A2 size
    const gradesTablePosition = ref({
      startX: 30,
      startY: 160,
      rowHeight: 8,
      gradeColumnX: 350,
      subjectColumnX: 35,
      fontSize: 10
    });

    // Computed preview data (jegyek a táblázathoz)
    const previewData = computed(() => {
      return {
        grades: studentGrades.value.length > 0
          ? studentGrades.value.map(g => ({
              subjectName: g.subject?.name_hu || 'Tantárgy',
              grade: g.grade
            }))
          : generateSampleGrades()
      };
    });

    const pageStyle = computed(() => ({
      width: `${pageSize.value.width}mm`,
      height: `${pageSize.value.height}mm`,
      paddingLeft: `${globalOffsetX.value}mm`,
      paddingTop: `${globalOffsetY.value}mm`
    }));

    // Methods
    const studentDisplayName = (student: Student) =>
      `${student.lastname_hu || ''} ${student.firstname_hu || ''}`;

    const getFieldStyle = (field: FieldPosition) => ({
      left: `${field.x}mm`,
      top: `${field.y}mm`,
      fontSize: `${field.fontSize}pt`,
      letterSpacing: field.letterSpacing ? `${field.letterSpacing}mm` : 'normal'
    });

    const getGradeStyle = (index: number) => ({
      left: `${gradesTablePosition.value.gradeColumnX}mm`,
      top: `${gradesTablePosition.value.startY + index * gradesTablePosition.value.rowHeight}mm`,
      fontSize: `${gradesTablePosition.value.fontSize}pt`,
      textAlign: 'center' as const,
      width: '15mm'
    });

    const getSubjectStyle = (index: number) => ({
      left: `${gradesTablePosition.value.subjectColumnX}mm`,
      top: `${gradesTablePosition.value.startY + index * gradesTablePosition.value.rowHeight}mm`,
      fontSize: `${gradesTablePosition.value.fontSize}pt`
    });

    const generateSampleGrades = (): GradeData[] => [
      { subjectName: 'Magyar nyelv', grade: 5 },
      { subjectName: 'Szerb nyelv', grade: 4 },
      { subjectName: 'Matematika', grade: 5 },
      { subjectName: 'Történelem', grade: 4 },
      { subjectName: 'Földrajz', grade: 5 },
      { subjectName: 'Biológia', grade: 4 },
      { subjectName: 'Fizika', grade: 3 },
      { subjectName: 'Kémia', grade: 4 },
      { subjectName: 'Testnevelés', grade: 5 },
      { subjectName: 'Informatika', grade: 5 }
    ];

    const loadClasses = async () => {
      try {
        const result = await databases.listDocuments(
          config.website_db,
          config.classlist,
          [Query.orderAsc('year'), Query.orderAsc('designation'), Query.limit(100)]
        );

        // Betöltjük a workers és courses relációkat a helper segítségével
        const docsWithRelations = await loadRelations(result.documents, commonRelations.classes);

        classes.value = docsWithRelations.map((doc: any) => {
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

    const loadStudyPrograms = async () => {
      try {
        const result = await erpService.getStudyPrograms(100);
        studyPrograms.value = result.programs;
      } catch (error) {
        console.error('Failed to load study programs:', error);
      }
    };

    const loadSchoolYears = async () => {
      schoolYears.value = await erpService.getSchoolYears();
      if (schoolYears.value.length > 0) {
        selectedSchoolYearId.value = schoolYears.value[0].$id || null;
      }
    };

    const loadStudents = async () => {
      if (!selectedClassId.value) {
        students.value = [];
        return;
      }

      try {
        const selectedClass = classes.value.find(c => c.$id === selectedClassId.value);
        const queries = [Query.limit(200)];

        if (selectedClass?.courses?.$id) {
          queries.push(Query.equal('study_program', selectedClass.courses.$id));
        }

        const result = await databases.listDocuments(
          config.erp_db,
          config.erp_students,
          queries
        );

        // Betöltjük a diákok relációit (birth_place, study_program, stb.)
        const studentsWithRelations = await loadRelations(result.documents, erpRelations.students);
        students.value = studentsWithRelations as unknown as Student[];
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };

    const loadStudentGrades = async () => {
      if (!selectedStudentId.value || !selectedSchoolYearId.value) {
        studentGrades.value = [];
        return;
      }

      try {
        const result = await databases.listDocuments(
          config.erp_db,
          config.erp_student_grades,
          [
            Query.equal('student', selectedStudentId.value),
            Query.equal('school_year', selectedSchoolYearId.value),
            Query.limit(50)
          ]
        );

        // Betöltjük a jegyek relációit (subject, stb.)
        const gradesWithRelations = await loadRelations(result.documents, erpRelations.studentGrades);
        studentGrades.value = gradesWithRelations;
      } catch (error) {
        console.error('Failed to load grades:', error);
      }
    };

    const saveSettings = () => {
      const settings = {
        selectedPaperSize: selectedPaperSize.value,
        globalOffsetX: globalOffsetX.value,
        globalOffsetY: globalOffsetY.value,
        fieldPositions: fieldPositions.value,
        gradesTablePosition: gradesTablePosition.value,
        pageSize: pageSize.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      notify({ type: 'success', text: t('settings_saved') });
    };

    const loadSettings = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.selectedPaperSize) {
            selectedPaperSize.value = settings.selectedPaperSize;
          }
          globalOffsetX.value = settings.globalOffsetX ?? 0;
          globalOffsetY.value = settings.globalOffsetY ?? 0;
          if (settings.fieldPositions) {
            Object.assign(fieldPositions.value, settings.fieldPositions);
          }
          if (settings.gradesTablePosition) {
            Object.assign(gradesTablePosition.value, settings.gradesTablePosition);
          }
          if (settings.pageSize) {
            Object.assign(pageSize.value, settings.pageSize);
          }
        } catch (e) {
          console.error('Failed to load settings:', e);
        }
      }
    };

    const printDocument = () => {
      isPrinting.value = true;
      setTimeout(() => {
        window.print();
        isPrinting.value = false;
      }, 100);
    };

    const printAll = async () => {
      if (!selectedClassId.value || students.value.length === 0) return;

      for (const student of students.value) {
        selectedStudentId.value = student.$id;
        await loadStudentGrades();
        await new Promise(resolve => setTimeout(resolve, 500));
        printDocument();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    // Watchers
    watch(selectedClassId, (newClassId) => {
      loadStudents();
      // Auto-set study program from class (courses field)
      if (newClassId) {
        const selectedClass = classes.value.find(c => c.$id === newClassId);
        if (selectedClass?.courses?.$id) {
          selectedStudyProgramId.value = selectedClass.courses.$id;
          loadTemplateForSelection();
        }
      }
    });
    watch([selectedStudentId, selectedSchoolYearId], loadStudentGrades);

    onMounted(async () => {
      loadSettings();
      await Promise.all([loadClasses(), loadSchoolYears(), loadStudyPrograms()]);
    });

    // Watchers - sablon újratöltése diák változásakor
    watch(selectedStudentId, () => {
      if (selectedStudentId.value) {
        loadTemplateForSelection();
      }
    });

    return {
      // Data
      mainDocumentTypes,
      gradeBookParts,
      yearOptions,
      formLanguageOptions,
      paperSizes,
      classes,
      students,
      schoolYears,
      studentGrades,
      studyPrograms,

      // Template
      currentTemplate,
      loadedTemplates,
      mainDocumentType,
      selectedGradeBookParts,
      selectedFormLanguage,
      selectedDocumentTypes,
      documentType,
      selectedPrintYear,

      // Selection
      selectedPaperSize,
      selectedClassId,
      selectedSchoolYearId,
      selectedStudentId,
      selectedStudyProgramId,

      // Preview
      previewMode,
      previewScale,
      printArea,
      isPrinting,

      // Settings
      pageSize,
      globalOffsetX,
      globalOffsetY,
      fieldPositions,
      gradesTablePosition,

      // Computed
      previewData,
      pageStyle,

      // Methods
      applyPaperSize,
      onMainDocumentTypeChange,
      onGradeBookPartsChange,
      loadTemplateForSelection,
      getPreviewFieldValue,

      // Methods
      studentDisplayName,
      getFieldStyle,
      getGradeStyle,
      getSubjectStyle,
      saveSettings,
      printDocument,
      printAll
    };
  }
});
</script>

<style scoped>
.preview-container {
  overflow: auto;
  background: #e0e0e0;
  padding: 20px;
  transform-origin: top left;
}

.print-page {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  margin: 0 auto;
  box-sizing: border-box;
}

.print-page.show-grid {
  background-image:
    linear-gradient(rgba(0, 0, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 255, 0.1) 1px, transparent 1px);
  background-size: 5mm 5mm;
}

.print-field {
  position: absolute;
  white-space: nowrap;
}

.strikethrough-line {
  height: 0;
  border-top: 1px solid black;
  position: relative;
  top: 0.5em;
}

.print-field-subject {
  color: #666;
  font-style: italic;
}

@media print {
  /* Hide all UI elements */
  .v-navigation-drawer,
  .v-app-bar,
  .v-footer,
  header,
  nav,
  .v-overlay-container,
  .v-container > .v-row > .v-col:first-child {
    display: none !important;
  }

  /* Reset page margins - removes browser header/footer */
  @page {
    margin: 0 !important;
    size: auto;
  }

  /* Remove any browser-added margins */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .preview-container {
    background: none;
    padding: 0;
    transform: none !important;
    position: absolute;
    top: 0;
    left: 0;
  }

  .print-page {
    box-shadow: none;
    margin: 0;
  }

  .print-page.show-grid {
    background-image: none;
  }

  .print-field-subject {
    display: none;
  }
}
</style>
