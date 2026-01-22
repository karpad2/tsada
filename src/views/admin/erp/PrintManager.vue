<template>
  <v-container fluid>
    <v-row>
      <!-- Left Panel: Settings -->
      <v-col cols="12" lg="4">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-printer</v-icon>
            Nyomtatási beállítások
          </v-card-title>
          <v-card-text>
            <!-- Document Type Selection -->
            <v-select
              v-model="documentType"
              :items="documentTypes"
              item-title="label"
              item-value="value"
              label="Dokumentum típus"
              class="mb-4"
              @update:model-value="onDocumentTypeChange"
            ></v-select>

            <!-- Year Selection (for grade_book_year) -->
            <v-select
              v-if="documentType === 'grade_book_year'"
              v-model="selectedPrintYear"
              :items="yearOptions"
              item-title="label"
              item-value="value"
              label="Nyomtatandó évfolyam"
              class="mb-4"
              @update:model-value="loadTemplateForSelection"
            ></v-select>

            <!-- Template info -->
            <v-alert
              v-if="currentTemplate"
              type="info"
              density="compact"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-caption">Aktív sablon:</div>
              <div class="font-weight-medium">{{ currentTemplate.name }}</div>
            </v-alert>
            <v-alert
              v-else
              type="warning"
              density="compact"
              variant="tonal"
              class="mb-4"
            >
              Nincs sablon ehhez a konfigurációhoz. Alapértelmezett értékek használata.
            </v-alert>

            <!-- Paper Size -->
            <v-select
              v-model="selectedPaperSize"
              :items="paperSizes"
              item-title="name"
              item-value="id"
              label="Papírméret"
              class="mb-4"
              @update:model-value="applyPaperSize"
            ></v-select>

            <v-row dense class="mb-4">
              <v-col cols="6">
                <v-text-field
                  v-model.number="pageSize.width"
                  label="Szélesség"
                  type="number"
                  suffix="mm"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="pageSize.height"
                  label="Magasság"
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
              label="Osztály"
              class="mb-4"
            ></v-select>

            <v-select
              v-model="selectedSchoolYearId"
              :items="schoolYears"
              item-title="name"
              item-value="$id"
              label="Tanév"
              class="mb-4"
            ></v-select>

            <v-autocomplete
              v-model="selectedStudentId"
              :items="students"
              :item-title="studentDisplayName"
              item-value="$id"
              label="Diák (opcionális - egyéni nyomtatás)"
              clearable
              class="mb-4"
            ></v-autocomplete>
          </v-card-text>
        </v-card>

        <!-- Position Settings -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-ruler</v-icon>
            Pozíció finomhangolás (mm)
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="globalOffsetX"
                  label="Vízszintes eltolás"
                  type="number"
                  suffix="mm"
                  density="compact"
                  step="0.5"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="globalOffsetY"
                  label="Függőleges eltolás"
                  type="number"
                  suffix="mm"
                  density="compact"
                  step="0.5"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-expansion-panels variant="accordion" class="mt-4">
              <v-expansion-panel title="Mezők pozíciói">
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
                          step="0.5"
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
                          step="0.5"
                          hide-details
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          v-model.number="field.fontSize"
                          label="Méret"
                          type="number"
                          density="compact"
                          suffix="pt"
                          hide-details
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          v-model.number="field.letterSpacing"
                          label="Betűköz"
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

              <v-expansion-panel title="Jegyek táblázat">
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.startX"
                        label="Kezdő X"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.5"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.startY"
                        label="Kezdő Y"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.5"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.rowHeight"
                        label="Sor magasság"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.5"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="gradesTablePosition.gradeColumnX"
                        label="Jegy oszlop X"
                        type="number"
                        suffix="mm"
                        density="compact"
                        step="0.5"
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
              Beállítások mentése
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
              Nyomtatás
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
              Összes diák nyomtatása
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Panel: Preview -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-eye</v-icon>
            Előnézet
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
                <!-- Student Name -->
                <div
                  v-if="fieldPositions.studentName"
                  class="print-field"
                  :style="getFieldStyle(fieldPositions.studentName)"
                >
                  {{ previewData.studentName }}
                </div>

                <!-- Birth Date -->
                <div
                  v-if="fieldPositions.birthDate"
                  class="print-field"
                  :style="getFieldStyle(fieldPositions.birthDate)"
                >
                  {{ previewData.birthDate }}
                </div>

                <!-- Birth Place -->
                <div
                  v-if="fieldPositions.birthPlace"
                  class="print-field"
                  :style="getFieldStyle(fieldPositions.birthPlace)"
                >
                  {{ previewData.birthPlace }}
                </div>

                <!-- JMBG -->
                <div
                  v-if="fieldPositions.jmbg"
                  class="print-field"
                  :style="getFieldStyle(fieldPositions.jmbg)"
                >
                  {{ previewData.jmbg }}
                </div>

                <!-- Study Program -->
                <div
                  v-if="fieldPositions.studyProgram"
                  class="print-field"
                  :style="getFieldStyle(fieldPositions.studyProgram)"
                >
                  {{ previewData.studyProgram }}
                </div>

                <!-- School Year -->
                <div
                  v-if="fieldPositions.schoolYear"
                  class="print-field"
                  :style="getFieldStyle(fieldPositions.schoolYear)"
                >
                  {{ previewData.schoolYear }}
                </div>

                <!-- Grades Table -->
                <div
                  v-for="(grade, index) in previewData.grades"
                  :key="index"
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
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { loadRelations, commonRelations, erpRelations } from '@/appwrite/relationHelper';
import { ErpService, type Subject, type StudyProgram, type SchoolYear } from '@/services/ErpService';
import PrintTemplateService, { type PrintTemplate, type FieldPosition as TemplateFieldPosition } from '@/services/PrintTemplateService';

interface FieldPosition {
  label: string;
  x: number;
  y: number;
  fontSize: number;
  letterSpacing?: number;
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
    const databases = new Databases(appw);
    const erpService = ErpService.getInstance();

    // Document type options
    const documentTypes = [
      { value: 'grade_book_base', label: 'Főkönyv alap (beiratkozás)' },
      { value: 'grade_book_year', label: 'Főkönyv évfolyam (év végi)' },
      { value: 'certificate', label: 'Bizonyítvány' },
      { value: 'enrollment', label: 'Beiratkozási lap' }
    ];

    const yearOptions = [
      { value: 1, label: '1. évfolyam' },
      { value: 2, label: '2. évfolyam' },
      { value: 3, label: '3. évfolyam' },
      { value: 4, label: '4. évfolyam' }
    ];

    // Current template from database
    const currentTemplate = ref<PrintTemplate | null>(null);
    const documentType = ref<string>('grade_book_base');
    const selectedPrintYear = ref<number>(1);

    // Paper sizes
    const paperSizes = [
      { id: 'a2', name: 'A2 (420 × 594 mm)', width: 420, height: 594 },
      { id: 'a2_landscape', name: 'A2 fekvő (594 × 420 mm)', width: 594, height: 420 },
      { id: 'a3', name: 'A3 (297 × 420 mm)', width: 297, height: 420 },
      { id: 'a3_landscape', name: 'A3 fekvő (420 × 297 mm)', width: 420, height: 297 },
      { id: 'a4', name: 'A4 (210 × 297 mm)', width: 210, height: 297 },
      { id: 'a4_landscape', name: 'A4 fekvő (297 × 210 mm)', width: 297, height: 210 },
      { id: 'custom', name: 'Egyéni méret', width: 420, height: 594 }
    ];
    const selectedPaperSize = ref('a2');

    // Data
    const classes = ref<any[]>([]);
    const students = ref<Student[]>([]);
    const schoolYears = ref<SchoolYear[]>([]);
    const studentGrades = ref<any[]>([]);

    // Selection
    const selectedClassId = ref<string | null>(null);
    const selectedSchoolYearId = ref<string | null>(null);
    const selectedStudentId = ref<string | null>(null);

    // Sablon betöltése az adatbázisból
    const loadTemplateForSelection = async () => {
      try {
        // A kiválasztott diák szak ID-ja
        const student = students.value.find(s => s.$id === selectedStudentId.value);
        const studyProgramId = student?.study_program?.$id || null;

        // Évfolyam meghatározása
        const year = documentType.value === 'grade_book_base' ? 0 : selectedPrintYear.value;

        // Sablon lekérése
        const template = await PrintTemplateService.getTemplate(
          studyProgramId,
          year,
          documentType.value
        );

        if (template) {
          currentTemplate.value = template;
          applyTemplateSettings(template);
        } else {
          // Alapértelmezett sablon használata
          currentTemplate.value = null;
          const defaultTemplate = PrintTemplateService.getDefaultTemplate(
            year,
            documentType.value as any
          );
          applyTemplateSettings(defaultTemplate);
        }
      } catch (error) {
        console.error('Failed to load template:', error);
        currentTemplate.value = null;
      }
    };

    // Sablon beállítások alkalmazása
    const applyTemplateSettings = (template: PrintTemplate) => {
      // Papírméret
      pageSize.value.width = template.paperSize.width;
      pageSize.value.height = template.paperSize.height;

      // Globális eltolás
      globalOffsetX.value = template.globalOffset.x;
      globalOffsetY.value = template.globalOffset.y;

      // Mező pozíciók konvertálása
      const newPositions: Record<string, FieldPosition> = {};
      for (const field of template.fields) {
        newPositions[field.fieldId] = {
          label: field.label,
          x: field.x,
          y: field.y,
          fontSize: field.fontSize,
          letterSpacing: field.letterSpacing
        };
      }
      fieldPositions.value = newPositions;

      // Jegytáblázat pozíció
      if (template.gradesTable) {
        gradesTablePosition.value = {
          startX: template.gradesTable.startX,
          startY: template.gradesTable.startY,
          rowHeight: template.gradesTable.rowHeight,
          gradeColumnX: template.gradesTable.gradeColumnOffsetX,
          subjectColumnX: template.gradesTable.startX,
          fontSize: template.gradesTable.fontSize
        };
      }
    };

    // Dokumentum típus változásakor
    const onDocumentTypeChange = () => {
      if (documentType.value === 'grade_book_base') {
        selectedPrintYear.value = 0;
      }
      loadTemplateForSelection();
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
      const size = paperSizes.find(p => p.id === sizeId);
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
      studentName: { label: 'Diák neve', x: 80, y: 60, fontSize: 14 },
      birthDate: { label: 'Születési dátum', x: 80, y: 75, fontSize: 11 },
      birthPlace: { label: 'Születési hely', x: 80, y: 90, fontSize: 11 },
      jmbg: { label: 'JMBG', x: 80, y: 105, fontSize: 11 },
      studyProgram: { label: 'Szak', x: 80, y: 120, fontSize: 11 },
      schoolYear: { label: 'Tanév', x: 300, y: 60, fontSize: 11 },
      classYear: { label: 'Évfolyam', x: 300, y: 75, fontSize: 11 }
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

    // Computed preview data
    const previewData = computed(() => {
      const student = students.value.find(s => s.$id === selectedStudentId.value);
      const schoolYear = schoolYears.value.find(y => y.$id === selectedSchoolYearId.value);

      return {
        studentName: student
          ? `${student.lastname_hu || ''} ${student.firstname_hu || ''}`
          : 'Minta Diák',
        birthDate: student?.birth_year
          ? `${student.birth_year}.${String(student.birth_month || 1).padStart(2, '0')}.${String(student.birth_day || 1).padStart(2, '0')}.`
          : '2008.01.15.',
        birthPlace: student?.birth_place?.place_hu || 'Szabadka',
        jmbg: student?.JMBG || '1501008123456',
        studyProgram: student?.study_program?.study_program_name_hu || 'Gimnázium',
        schoolYear: schoolYear?.name || '2024/2025',
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
      textAlign: 'center',
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
      alert('Beállítások elmentve!');
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
    watch(selectedClassId, loadStudents);
    watch([selectedStudentId, selectedSchoolYearId], loadStudentGrades);

    onMounted(async () => {
      loadSettings();
      await Promise.all([loadClasses(), loadSchoolYears()]);
    });

    // Watchers - sablon újratöltése diák változásakor
    watch(selectedStudentId, () => {
      if (selectedStudentId.value) {
        loadTemplateForSelection();
      }
    });

    return {
      // Data
      documentTypes,
      yearOptions,
      paperSizes,
      classes,
      students,
      schoolYears,
      studentGrades,

      // Template
      currentTemplate,
      documentType,
      selectedPrintYear,

      // Selection
      selectedPaperSize,
      selectedClassId,
      selectedSchoolYearId,
      selectedStudentId,

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
      onDocumentTypeChange,
      loadTemplateForSelection,

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
