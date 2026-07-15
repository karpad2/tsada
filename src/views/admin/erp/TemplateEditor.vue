<template>
  <div class="page-shell">
  <div class="page-panel container !p-2">
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <!-- Left Sidebar: Fields & Settings -->
      <v-col cols="3" class="sidebar pa-3">
        <!-- Sablon azonosítás -->
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-file-document-outline</v-icon>
            Sablon típus
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="documentType"
              :items="documentTypes"
              item-title="label"
              item-value="value"
              label="Dokumentum típus"
              density="compact"
              @update:model-value="onDocumentTypeChange"
            ></v-select>
            <v-select
              v-model="selectedYear"
              :items="yearOptions"
              item-title="label"
              item-value="value"
              label="Évfolyam"
              density="compact"
              class="mt-2"
              :disabled="documentType === 'grade_book_base'"
            ></v-select>
            <v-select
              v-model="selectedStudyProgramId"
              :items="studyProgramOptions"
              item-title="name"
              item-value="$id"
              label="Szak (opcionális)"
              density="compact"
              clearable
              class="mt-2"
              hint="Ha üres, általános sablon"
              persistent-hint
            ></v-select>
            <v-select
              v-model="formLanguage"
              :items="formLanguageOptions"
              item-title="label"
              item-value="value"
              label="Űrlap nyelve"
              density="compact"
              class="mt-2"
            ></v-select>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-image</v-icon>
            Sablon háttér
          </v-card-title>
          <v-card-text>
            <v-file-input
              v-model="templateFile"
              label="Kép feltöltése"
              accept="image/*"
              prepend-icon="mdi-camera"
              density="compact"
              @update:model-value="loadTemplateImage"
            ></v-file-input>
            <v-text-field
              v-model="templateName"
              label="Sablon neve"
              density="compact"
              class="mt-2"
            ></v-text-field>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-ruler</v-icon>
            Papírméret
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedPaperSize"
              :items="paperSizes"
              item-title="name"
              item-value="id"
              density="compact"
              @update:model-value="applyPaperSize"
            ></v-select>
            <v-row dense class="mt-2">
              <v-col cols="6">
                <v-text-field
                  v-model.number="pageWidth"
                  label="Szélesség"
                  suffix="mm"
                  type="number"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="pageHeight"
                  label="Magasság"
                  suffix="mm"
                  type="number"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-form-textbox</v-icon>
            Mezők
          </v-card-title>
          <v-card-text class="pa-2">
            <v-list density="compact">
              <v-list-item
                v-for="field in availableFields"
                :key="field.key"
                :class="{ 'bg-primary-lighten-4': selectedFieldKey === field.key }"
                @click="selectField(field.key)"
              >
                <template #prepend>
                  <v-icon size="small" :color="isFieldPlaced(field.key) ? 'success' : 'grey'">
                    {{ isFieldPlaced(field.key) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ field.label }}</v-list-item-title>
                <template #append>
                  <v-btn
                    v-if="!isFieldPlaced(field.key)"
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click.stop="addFieldToCanvas(field.key)"
                  >
                    <v-icon size="small">mdi-plus</v-icon>
                  </v-btn>
                  <v-btn
                    v-else
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click.stop="removeFieldFromCanvas(field.key)"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-divider class="my-3"></v-divider>

            <!-- Grade rows csak grade_book_year típusnál -->
            <template v-if="documentType === 'grade_book_year'">
              <v-btn
                color="secondary"
                variant="outlined"
                size="small"
                block
                @click="addGradeRow"
                class="mb-2"
              >
                <v-icon left>mdi-plus</v-icon>
                Jegy sor hozzáadása
              </v-btn>

              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                block
                @click="generateSubjectRows"
                :disabled="allSubjects.length === 0"
              >
                <v-icon left>mdi-auto-fix</v-icon>
                Tantárgyak betöltése ({{ allSubjects.length }})
              </v-btn>
            </template>

            <!-- Alap sablon: tantárgy nevek mezők hozzáadása -->
            <template v-if="documentType === 'grade_book_base'">
              <v-btn
                color="info"
                variant="outlined"
                size="small"
                block
                @click="addSubjectNameFields"
              >
                <v-icon left>mdi-format-list-bulleted</v-icon>
                Tantárgy nevek hozzáadása
              </v-btn>
            </template>
          </v-card-text>
        </v-card>

        <!-- Selected Field Properties -->
        <v-card v-if="selectedFieldKey && placedFields[selectedFieldKey]">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-cog</v-icon>
            Mező beállítások
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="placedFields[selectedFieldKey].x"
                  label="X pozíció"
                  suffix="mm"
                  type="number"
                  step="0.1"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="placedFields[selectedFieldKey].y"
                  label="Y pozíció"
                  suffix="mm"
                  type="number"
                  step="0.1"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="placedFields[selectedFieldKey].fontSize"
                  label="Betűméret"
                  suffix="pt"
                  type="number"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="placedFields[selectedFieldKey].width"
                  label="Szélesség"
                  suffix="mm"
                  type="number"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-select
              v-model="placedFields[selectedFieldKey].fontFamily"
              :items="fontFamilies"
              label="Betűtípus"
              density="compact"
              class="mt-2"
            ></v-select>
            <v-row dense class="mt-2">
              <v-col cols="6">
                <v-text-field
                  v-model.number="placedFields[selectedFieldKey].letterSpacing"
                  label="Betűköz"
                  suffix="mm"
                  type="number"
                  step="0.1"
                  density="compact"
                  hint="Karakterek közti távolság"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="placedFields[selectedFieldKey].lineHeight"
                  label="Sormagasság"
                  type="number"
                  step="0.1"
                  density="compact"
                  hint="pl. 1.2, 1.5"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-checkbox
              v-model="placedFields[selectedFieldKey].bold"
              label="Félkövér"
              density="compact"
              hide-details
            ></v-checkbox>
            <v-checkbox
              v-model="placedFields[selectedFieldKey].strikethrough"
              label="Kihúzás ha üres"
              density="compact"
              hide-details
              class="mt-2"
            ></v-checkbox>
            <v-text-field
              v-if="placedFields[selectedFieldKey].strikethrough"
              v-model.number="placedFields[selectedFieldKey].strikethroughWidth"
              label="Kihúzás szélesség"
              suffix="mm"
              type="number"
              step="0.1"
              density="compact"
              class="mt-2"
            ></v-text-field>
          </v-card-text>
        </v-card>

        <!-- Actions -->
        <v-card class="mt-4">
          <v-card-text>
            <v-btn color="primary" block class="mb-2" @click="saveTemplate">
              <v-icon left>mdi-content-save</v-icon>
              Sablon mentése
            </v-btn>
            <v-btn color="secondary" variant="outlined" block class="mb-2" @click="loadTemplate">
              <v-icon left>mdi-folder-open</v-icon>
              Sablon betöltése
            </v-btn>
            <v-btn color="success" variant="outlined" block @click="testPrint">
              <v-icon left>mdi-printer</v-icon>
              Teszt nyomtatás
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Main Canvas Area -->
      <v-col cols="9" class="canvas-area">
        <div class="canvas-toolbar pa-2 d-flex align-center">
          <v-btn-toggle v-model="viewMode" mandatory density="compact" class="mr-4">
            <v-btn value="edit" size="small">
              <v-icon>mdi-pencil</v-icon>
              Szerkesztés
            </v-btn>
            <v-btn value="preview" size="small">
              <v-icon>mdi-eye</v-icon>
              Előnézet
            </v-btn>
          </v-btn-toggle>

          <v-slider
            v-model="zoomLevel"
            :min="20"
            :max="150"
            :step="10"
            hide-details
            style="max-width: 200px"
            class="mr-4"
          >
            <template #prepend>
              <span class="text-caption">{{ zoomLevel }}%</span>
            </template>
          </v-slider>

          <v-checkbox
            v-model="showGrid"
            label="Rács"
            density="compact"
            hide-details
            class="mr-4"
          ></v-checkbox>

          <v-checkbox
            v-model="snapToGrid"
            label="Rácshoz igazítás"
            density="compact"
            hide-details
          ></v-checkbox>

          <v-spacer></v-spacer>

          <v-chip size="small" class="mr-2">
            {{ pageWidth }} × {{ pageHeight }} mm
          </v-chip>
        </div>

        <div class="canvas-scroll" ref="canvasScroll">
          <div
            class="canvas-wrapper"
            :style="{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left'
            }"
          >
            <div
              ref="canvas"
              class="template-canvas"
              :class="{ 'show-grid': showGrid }"
              :style="canvasStyle"
              @mousedown="onCanvasMouseDown"
              @mousemove="onCanvasMouseMove"
              @mouseup="onCanvasMouseUp"
              @mouseleave="onCanvasMouseUp"
            >
              <!-- Template Background Image -->
              <img
                v-if="templateImageUrl"
                :src="templateImageUrl"
                class="template-background"
                :style="{ width: '100%', height: '100%', objectFit: 'contain' }"
              />

              <!-- Placed Fields -->
              <div
                v-for="(field, key) in placedFields"
                :key="key"
                class="placed-field"
                :class="{
                  'selected': selectedFieldKey === key,
                  'dragging': draggingField === key,
                  'has-strikethrough': field.strikethrough
                }"
                :style="getFieldStyle(field)"
                @mousedown.stop="startDragField(key, $event)"
              >
                <div class="field-content" :style="getFieldContentStyle(field)">
                  {{ viewMode === 'preview' ? getPreviewValue(key) : getFieldLabel(key) }}
                </div>
                <div v-if="field.strikethrough && viewMode === 'edit'" class="strikethrough-indicator" :style="{ width: field.strikethroughWidth + 'mm' }"></div>
                <div v-if="selectedFieldKey === key && viewMode === 'edit'" class="field-handles">
                  <div class="handle handle-e" @mousedown.stop="startResize(key, 'e', $event)"></div>
                </div>
              </div>

              <!-- Grade Rows -->
              <div
                v-for="(gradeRow, index) in gradeRows"
                :key="'grade-' + index"
                class="placed-field grade-row"
                :class="{ 'selected': selectedGradeRow === index }"
                :style="getGradeRowStyle(gradeRow)"
                @mousedown.stop="startDragGradeRow(index, $event)"
              >
                <div class="grade-subject" :style="{ width: gradeRow.subjectWidth + 'mm' }">
                  {{ viewMode === 'preview' ? getSampleSubject(index) : 'Tantárgy ' + (index + 1) }}
                </div>
                <div class="grade-value" :style="{ marginLeft: gradeRow.gradeOffsetX + 'mm' }">
                  {{ viewMode === 'preview' ? getSampleGrade(index) : '5' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Load Template Dialog -->
    <v-dialog v-model="showLoadDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-folder-open</v-icon>
          Sablon betöltése
        </v-card-title>
        <v-card-text>
          <v-list v-if="savedTemplates.length > 0" lines="three">
            <v-list-item
              v-for="template in savedTemplates"
              :key="template.id"
              @click="loadSelectedTemplate(template)"
              class="mb-2"
              rounded
              border
            >
              <template #prepend>
                <v-icon :color="template._original ? 'primary' : 'grey'">
                  {{ template._original ? 'mdi-cloud' : 'mdi-content-save' }}
                </v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{ template.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip size="x-small" class="mr-1" v-if="template._original">
                  {{ getDocumentTypeLabel(template._original.documentType) }}
                </v-chip>
                <v-chip size="x-small" class="mr-1" v-if="template._original && template._original.year > 0">
                  {{ template._original.year }}. évfolyam
                </v-chip>
                <v-chip size="x-small" variant="outlined">
                  {{ template.pageWidth }}×{{ template.pageHeight }}mm
                </v-chip>
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-caption mt-1">
                <span v-if="template._original">Adatbázisban tárolva</span>
                <span v-else>Helyi tárolás (localStorage)</span>
              </v-list-item-subtitle>
              <template #append>
                <v-btn icon size="small" variant="text" color="error" @click.stop="deleteTemplate(template.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8 text-grey">
            <v-icon size="64" color="grey-lighten-1">mdi-file-document-outline</v-icon>
            <p class="mt-4">Nincsenek mentett sablonok</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showLoadDialog = false">Bezárás</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { notify } from '@kyvg/vue3-notification';
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog';
import PrintTemplateService, { type PrintTemplate, type FieldPosition } from '@/services/PrintTemplateService';
import ErpService from '@/services/ErpService';

interface PlacedField {
  x: number;
  y: number;
  fontSize: number;
  width: number;
  fontFamily: string;
  bold: boolean;
  letterSpacing: number;
  lineHeight: number;
  strikethrough: boolean;
  strikethroughWidth: number;
}

interface GradeRow {
  x: number;
  y: number;
  fontSize: number;
  subjectWidth: number;
  gradeOffsetX: number;
  subjectId?: string;
  subjectName?: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  pageWidth: number;
  pageHeight: number;
  templateImage?: string;
  fields: Record<string, PlacedField>;
  gradeRows: GradeRow[];
}

interface StudyProgram {
  $id: string;
  name: string;
  name_rs?: string;
}

interface Subject {
  $id: string;
  name: string;
  name_rs?: string;
}

const STORAGE_KEY = 'erp_print_templates';

export default defineComponent({
  name: 'TemplateEditor',
  setup() {
    const { openDialog } = useConfirmDialog();

    // Document types
    const documentTypes = [
      { value: 'grade_book_base', label: 'Főkönyv alap (beiratkozás)' },
      { value: 'grade_book_year', label: 'Főkönyv évfolyam (jegyek)' },
      { value: 'grade_book_matura', label: 'Főkönyv érettségi' },
      { value: 'grade_book_certificates', label: 'Főkönyv oklevelek' },
      { value: 'certificate', label: 'Bizonyítvány' },
      { value: 'enrollment', label: 'Beiratkozási lap' },
      { value: 'custom', label: 'Egyéni' }
    ];

    const yearOptions = [
      { value: 0, label: 'Alap (beiratkozás)' },
      { value: 1, label: '1. évfolyam' },
      { value: 2, label: '2. évfolyam' },
      { value: 3, label: '3. évfolyam' },
      { value: 4, label: '4. évfolyam' }
    ];

    // Paper sizes
    const paperSizes = [
      { id: 'a2', name: 'A2 (420×594mm)', width: 420, height: 594 },
      { id: 'a2_landscape', name: 'A2 fekvő (594×420mm)', width: 594, height: 420 },
      { id: 'a3', name: 'A3 (297×420mm)', width: 297, height: 420 },
      { id: 'a3_landscape', name: 'A3 fekvő (420×297mm)', width: 420, height: 297 },
      { id: 'custom', name: 'Egyéni', width: 420, height: 594 }
    ];

    const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

    // Nyelvi variánsok
    const formLanguageOptions = [
      { value: 'bilingual', label: 'Kétnyelvű (szerb + magyar)' },
      { value: 'serbian', label: 'Egynyelvű (szerb)' }
    ];

    // Alap mezők - beiratkozáskor (grade_book_base)
    const baseFields = [
      { key: 'enrollmentNumber', label: 'Anyakönyvi szám' },
      { key: 'registryNumber', label: 'Belső sorszám' },
      { key: 'studentName', label: 'Diák neve (magyar)' },
      { key: 'studentNameRs', label: 'Diák neve (szerb)' },
      { key: 'fatherName', label: 'Apa neve' },
      { key: 'motherName', label: 'Anya neve' },
      { key: 'birthDate', label: 'Születési dátum' },
      { key: 'birthPlace', label: 'Születési hely (magyar)' },
      { key: 'birthPlaceRs', label: 'Születési hely (szerb)' },
      { key: 'jmbg', label: 'JMBG' },
      { key: 'studyProgram', label: 'Szak (magyar)' },
      { key: 'studyProgramRs', label: 'Szak (szerb)' },
      { key: 'educationType', label: 'Képzés típusa (rendes/rendkívüli)' },
      { key: 'educationDuration', label: 'Képzés időtartama' },
      { key: 'enrollmentDate', label: 'Beiratkozás dátuma' },
      { key: 'generation', label: 'Generáció' },
      { key: 'schoolName', label: 'Iskola neve' },
      { key: 'foreignLanguage', label: 'Idegen nyelv' },
      { key: 'religionOption', label: 'Hittan/Polgári' },
      { key: 'parentName', label: 'Szülő neve' },
      { key: 'parentAddress', label: 'Szülő címe' },
      { key: 'parentPhone', label: 'Szülő telefonszáma' }
    ];

    // Évfolyam mezők - évvégi nyomtatáshoz (grade_book_year)
    const yearFields = [
      { key: 'schoolYear', label: 'Tanév' },
      { key: 'classYear', label: 'Évfolyam' },
      { key: 'className', label: 'Osztály neve' },
      { key: 'classTeacher', label: 'Osztályfőnök' },
      { key: 'finalGrade', label: 'Tanulmányi átlag' },
      { key: 'behaviorText', label: 'Magaviselet (szöveges)' },
      { key: 'generalSuccess', label: 'Általános siker' },
      { key: 'absencesTotal', label: 'Össz. mulasztás' },
      { key: 'absencesJustified', label: 'Igazolt mulasztás' },
      { key: 'absencesUnjustified', label: 'Igazolatlan mulasztás' },
      { key: 'date', label: 'Keltezés' },
      { key: 'directorSignature', label: 'Igazgató aláírás' },
      { key: 'dateNow', label: 'Mai dátum' }
    ];

    // Érettségi mezők (grade_book_matura)
    const maturaFields = [
      { key: 'maturaSchoolYear', label: 'Tanév' },
      { key: 'maturaYear', label: 'Vizsgaidőszak éve' },
      { key: 'maturaClassYear', label: 'Évfolyam szám' },
      { key: 'maturaSubject1Name', label: '1. tárgy neve' },
      { key: 'maturaSubject1Grade', label: '1. tárgy jegy' },
      { key: 'maturaSubject2Name', label: '2. tárgy neve' },
      { key: 'maturaSubject2Grade', label: '2. tárgy jegy' },
      { key: 'maturaSubject3Name', label: '3. tárgy neve (szakmai)' },
      { key: 'maturaSubject3Grade', label: '3. tárgy jegy' },
      { key: 'maturaPracticalDesc', label: 'Gyakorlati vizsga leírás' },
      { key: 'maturaPracticalGrade', label: 'Gyakorlati vizsga jegy' },
      { key: 'maturaFinalGrade', label: 'Összesített eredmény' },
      { key: 'maturaResult', label: 'Eredménnyel tette le' },
      { key: 'maturaDate', label: 'Érettségi keltezés' }
    ];

    // Oklevelek/bizonyítványok mezők (grade_book_certificates)
    const certificatesFields = [
      { key: 'diplomaNumber', label: 'Oklevél iktatószám' },
      { key: 'diplomaDate', label: 'Oklevél keltezés' },
      { key: 'certificateNumber', label: 'Bizonylat iktatószám' },
      { key: 'certificateDate', label: 'Bizonylat keltezés' },
      { key: 'serialNumber', label: 'Sorozatszám (szerijszki broj)' },
      { key: 'classTeacherSign', label: 'Osztályfőnök aláírás' },
      { key: 'examCommitteeChair', label: 'Vizsgabizottság elnöke' },
      { key: 'receivedDate', label: 'Átvétel dátuma' },
      { key: 'receivedSignature', label: 'Átvette (aláírás)' },
      { key: 'notes', label: 'Megjegyzések' }
    ];

    // State - sablon azonosítás
    const documentType = ref<'grade_book_base' | 'grade_book_year' | 'grade_book_matura' | 'grade_book_certificates' | 'certificate' | 'enrollment' | 'custom'>('grade_book_base');
    const selectedYear = ref(0);
    const selectedStudyProgramId = ref<string | null>(null);
    const currentTemplateId = ref<string | null>(null);
    const formLanguage = ref<'bilingual' | 'serbian'>('bilingual');

    // Study programs és subjects
    const studyProgramOptions = ref<StudyProgram[]>([]);
    const allSubjects = ref<Subject[]>([]);
    const saving = ref(false);

    // State
    const templateName = ref('Új sablon');
    const templateFile = ref<File[]>([]);
    const templateImageUrl = ref<string | null>(null);
    const selectedPaperSize = ref('a3_landscape');
    const pageWidth = ref(420);
    const pageHeight = ref(297);

    // Dinamikusan számított elérhető mezők
    const availableFields = computed(() => {
      switch (documentType.value) {
        case 'grade_book_base':
          return baseFields;
        case 'grade_book_year':
          return yearFields;
        case 'grade_book_matura':
          return maturaFields;
        case 'grade_book_certificates':
          return certificatesFields;
        default:
          return [...baseFields, ...yearFields];
      }
    });

    const viewMode = ref<'edit' | 'preview'>('edit');
    const zoomLevel = ref(50);
    const showGrid = ref(true);
    const snapToGrid = ref(true);
    const gridSize = 1; // mm (tized mm-es finomhangolás a number inputokon)

    const placedFields = ref<Record<string, PlacedField>>({});
    const gradeRows = ref<GradeRow[]>([]);
    const selectedFieldKey = ref<string | null>(null);
    const selectedGradeRow = ref<number | null>(null);

    // Dragging state
    const draggingField = ref<string | null>(null);
    const draggingGradeRow = ref<number | null>(null);
    const resizingField = ref<string | null>(null);
    const dragStartX = ref(0);
    const dragStartY = ref(0);
    const fieldStartX = ref(0);
    const fieldStartY = ref(0);

    const canvas = ref<HTMLElement | null>(null);
    const showLoadDialog = ref(false);
    const savedTemplates = ref<SavedTemplate[]>([]);

    // Computed
    const canvasStyle = computed(() => ({
      width: `${pageWidth.value}mm`,
      height: `${pageHeight.value}mm`,
      backgroundSize: showGrid.value ? `${gridSize}mm ${gridSize}mm` : 'none'
    }));

    // Methods
    const applyPaperSize = (sizeId: string) => {
      const size = paperSizes.find(p => p.id === sizeId);
      if (size && sizeId !== 'custom') {
        pageWidth.value = size.width;
        pageHeight.value = size.height;
      }
    };

    const loadTemplateImage = () => {
      if (templateFile.value && templateFile.value.length > 0) {
        const file = templateFile.value[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          templateImageUrl.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };

    const isFieldPlaced = (key: string) => key in placedFields.value;

    const selectField = (key: string) => {
      selectedFieldKey.value = key;
      selectedGradeRow.value = null;
    };

    const addFieldToCanvas = (key: string) => {
      placedFields.value[key] = {
        x: 50,
        y: 50 + Object.keys(placedFields.value).length * 15,
        fontSize: 11,
        width: 80,
        fontFamily: 'Arial',
        bold: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        strikethrough: false,
        strikethroughWidth: 30
      };
      selectedFieldKey.value = key;
    };

    const removeFieldFromCanvas = (key: string) => {
      delete placedFields.value[key];
      if (selectedFieldKey.value === key) {
        selectedFieldKey.value = null;
      }
    };

    const addGradeRow = () => {
      const lastRow = gradeRows.value[gradeRows.value.length - 1];
      gradeRows.value.push({
        x: lastRow?.x || 30,
        y: (lastRow?.y || 150) + 8,
        fontSize: 10,
        subjectWidth: 100,
        gradeOffsetX: 120
      });
    };

    const getFieldLabel = (key: string) => {
      return availableFields.find(f => f.key === key)?.label || key;
    };

    const getPreviewValue = (key: string) => {
      const sampleData: Record<string, string> = {
        // Alap mezők
        studentName: 'Kovács János',
        studentNameRs: 'Јанош Ковач',
        birthDate: '2008.05.15.',
        birthPlace: 'Szabadka',
        birthPlaceRs: 'Суботица',
        jmbg: '1505008123456',
        studyProgram: 'Gimnázium',
        studyProgramRs: 'Гимназија',
        schoolYear: '2024/2025',
        classYear: '2.',
        foreignLanguage: 'Angol',
        religionOption: 'Hittan',
        parentName: 'Kovács István',
        dateNow: new Date().toLocaleDateString('hu-HU'),
        fatherName: 'Kovács István',
        motherName: 'Kiss Mária',
        enrollmentNumber: '123/2024',
        registryNumber: '45',
        parentAddress: 'Szabadka, Kossuth u. 12.',
        parentPhone: '+381 24 123 456',
        enrollmentDate: '2024.09.01.',
        educationType: 'Rendes',
        educationDuration: '4 év',
        generation: '2024/2028',
        // Évfolyam mezők
        className: 'I-1',
        classTeacher: 'Nagy Péter',
        finalGrade: '4.52',
        behaviorText: 'примерно / példás',
        generalSuccess: 'врло добар / jó',
        absencesTotal: '45',
        absencesJustified: '40',
        absencesUnjustified: '5',
        date: '2025.06.15.',
        directorSignature: 'Dr. Szabó Endre',
        // Érettségi mezők
        maturaSchoolYear: '2027/2028',
        maturaYear: '2028',
        maturaClassYear: 'IV',
        maturaSubject1Name: 'Magyar nyelv és irodalom',
        maturaSubject1Grade: '5 (öt)',
        maturaSubject2Name: 'Matematika',
        maturaSubject2Grade: '4 (négy)',
        maturaSubject3Name: 'Szakmai tárgy',
        maturaSubject3Grade: '5 (öt)',
        maturaPracticalDesc: 'Gyakorlati érettségi vizsga',
        maturaPracticalGrade: '5 (öt)',
        maturaFinalGrade: 'Jeles (5)',
        maturaResult: 'одличним успехом / jeles eredménnyel',
        maturaDate: '2028.06.20.',
        // Oklevelek mezők
        diplomaNumber: '03-123/2028',
        diplomaDate: '2028.06.25.',
        certificateNumber: '05-456/2028',
        certificateDate: '2028.06.25.',
        serialNumber: 'А-123456',
        classTeacherSign: 'Nagy Péter',
        examCommitteeChair: 'Dr. Horvát Anna',
        receivedDate: '2028.07.01.',
        receivedSignature: 'Kovács István',
        notes: 'Megjegyzés példa'
      };
      return sampleData[key] || key;
    };

    const getSampleSubject = (index: number) => {
      const subjects = ['Magyar nyelv', 'Szerb nyelv', 'Matematika', 'Történelem', 'Földrajz', 'Biológia', 'Fizika', 'Kémia'];
      return subjects[index % subjects.length];
    };

    const getSampleGrade = (index: number) => {
      const grades = [5, 4, 5, 4, 5, 4, 3, 4];
      return grades[index % grades.length];
    };

    const mmToPx = (mm: number) => mm * 3.7795275591; // 1mm = 3.78px at 96dpi

    const pxToMm = (px: number) => px / 3.7795275591;

    const snapValue = (value: number) => {
      if (!snapToGrid.value) return value;
      return Math.round(value / gridSize) * gridSize;
    };

    const getFieldStyle = (field: PlacedField) => ({
      left: `${field.x}mm`,
      top: `${field.y}mm`,
      width: `${field.width}mm`,
      fontSize: `${field.fontSize}pt`,
      fontFamily: field.fontFamily,
      fontWeight: field.bold ? 'bold' : 'normal',
      letterSpacing: `${field.letterSpacing || 0}mm`,
      lineHeight: field.lineHeight || 1.2
    });

    const getFieldContentStyle = (field: PlacedField) => ({
      fontSize: `${field.fontSize}pt`,
      fontFamily: field.fontFamily,
      fontWeight: field.bold ? 'bold' : 'normal',
      letterSpacing: `${field.letterSpacing || 0}mm`,
      lineHeight: field.lineHeight || 1.2
    });

    const getGradeRowStyle = (row: GradeRow) => ({
      left: `${row.x}mm`,
      top: `${row.y}mm`,
      fontSize: `${row.fontSize}pt`
    });

    // Drag handlers
    const startDragField = (key: string, event: MouseEvent) => {
      if (viewMode.value !== 'edit') return;
      draggingField.value = key;
      selectedFieldKey.value = key;
      selectedGradeRow.value = null;
      dragStartX.value = event.clientX;
      dragStartY.value = event.clientY;
      fieldStartX.value = placedFields.value[key].x;
      fieldStartY.value = placedFields.value[key].y;
    };

    const startDragGradeRow = (index: number, event: MouseEvent) => {
      if (viewMode.value !== 'edit') return;
      draggingGradeRow.value = index;
      selectedGradeRow.value = index;
      selectedFieldKey.value = null;
      dragStartX.value = event.clientX;
      dragStartY.value = event.clientY;
      fieldStartX.value = gradeRows.value[index].x;
      fieldStartY.value = gradeRows.value[index].y;
    };

    const startResize = (key: string, _direction: string, event: MouseEvent) => {
      resizingField.value = key;
      dragStartX.value = event.clientX;
      fieldStartX.value = placedFields.value[key].width;
    };

    const onCanvasMouseDown = (_event: MouseEvent) => {
      // Deselect when clicking empty canvas area
      if (!draggingField.value && !draggingGradeRow.value) {
        selectedFieldKey.value = null;
        selectedGradeRow.value = null;
      }
    };

    const onCanvasMouseMove = (event: MouseEvent) => {
      const scale = zoomLevel.value / 100;

      if (draggingField.value) {
        const field = placedFields.value[draggingField.value];
        const deltaX = pxToMm((event.clientX - dragStartX.value) / scale);
        const deltaY = pxToMm((event.clientY - dragStartY.value) / scale);
        field.x = snapValue(fieldStartX.value + deltaX);
        field.y = snapValue(fieldStartY.value + deltaY);
      }

      if (draggingGradeRow.value !== null) {
        const row = gradeRows.value[draggingGradeRow.value];
        const deltaX = pxToMm((event.clientX - dragStartX.value) / scale);
        const deltaY = pxToMm((event.clientY - dragStartY.value) / scale);
        row.x = snapValue(fieldStartX.value + deltaX);
        row.y = snapValue(fieldStartY.value + deltaY);
      }

      if (resizingField.value) {
        const field = placedFields.value[resizingField.value];
        const deltaX = pxToMm((event.clientX - dragStartX.value) / scale);
        field.width = Math.max(10, snapValue(fieldStartX.value + deltaX));
      }
    };

    const onCanvasMouseUp = () => {
      draggingField.value = null;
      draggingGradeRow.value = null;
      resizingField.value = null;
    };

    // Helper: PlacedField -> FieldPosition konverzió
    const convertToFieldPositions = (): FieldPosition[] => {
      return Object.entries(placedFields.value).map(([key, field]) => ({
        fieldId: key,
        label: getFieldLabel(key),
        x: field.x,
        y: field.y,
        fontSize: field.fontSize,
        letterSpacing: field.letterSpacing || undefined,
        maxWidth: field.width || undefined,
        align: 'left' as const,
        strikethrough: field.strikethrough || undefined,
        strikethroughWidth: field.strikethroughWidth || undefined
      }));
    };

    // Helper: FieldPosition[] -> PlacedFields konverzió
    const convertFromFieldPositions = (fields: FieldPosition[]): Record<string, PlacedField> => {
      const result: Record<string, PlacedField> = {};
      for (const field of fields) {
        result[field.fieldId] = {
          x: field.x,
          y: field.y,
          fontSize: field.fontSize,
          width: field.maxWidth || 80,
          fontFamily: 'Arial',
          bold: false,
          letterSpacing: field.letterSpacing || 0,
          lineHeight: 1.2,
          strikethrough: field.strikethrough || false,
          strikethroughWidth: field.strikethroughWidth || 30
        };
      }
      return result;
    };

    // Save/Load - Adatbázisba mentés
    const saveTemplate = async () => {
      saving.value = true;
      try {
        const template: PrintTemplate = {
          $id: currentTemplateId.value || undefined,
          name: templateName.value,
          studyProgramId: selectedStudyProgramId.value,
          year: selectedYear.value,
          documentType: documentType.value,
          formLanguage: formLanguage.value,
          paperSize: {
            width: pageWidth.value,
            height: pageHeight.value,
            name: paperSizes.find(p => p.width === pageWidth.value && p.height === pageHeight.value)?.name || 'Egyéni'
          },
          fields: convertToFieldPositions(),
          gradesTable: documentType.value === 'grade_book_year' ? {
            startX: gradeRows.value[0]?.x || 30,
            startY: gradeRows.value[0]?.y || 75,
            rowHeight: 7,
            gradeColumnOffsetX: gradeRows.value[0]?.gradeOffsetX || 70,
            fontSize: gradeRows.value[0]?.fontSize || 10,
            subjects: gradeRows.value.map((row, index) => ({
              subjectId: row.subjectId || `subject_${index}`,
              subjectName: row.subjectName || `Tantárgy ${index + 1}`,
              rowIndex: index,
              gradeX: row.x + row.gradeOffsetX,
              baseY: row.y
            }))
          } : undefined,
          globalOffset: { x: 0, y: 0 }
        };

        const saved = await PrintTemplateService.saveTemplate(template);
        if (saved) {
          currentTemplateId.value = saved.$id || null;
          notify({ type: 'success', text: 'Sablon sikeresen mentve az adatbázisba!' });
        } else {
          notify({ type: 'error', text: 'Hiba a sablon mentésekor!' });
        }
      } catch (error) {
        console.error('Save error:', error);
        notify({ type: 'error', text: 'Hiba történt a mentés során!' });
      } finally {
        saving.value = false;
      }
    };

    // Sablon betöltése dialógus
    const loadTemplate = async () => {
      try {
        const templates = await PrintTemplateService.getAllTemplates();
        savedTemplates.value = templates.map(t => ({
          id: t.$id || '',
          name: t.name,
          pageWidth: t.paperSize.width,
          pageHeight: t.paperSize.height,
          fields: convertFromFieldPositions(t.fields),
          gradeRows: t.gradesTable?.subjects.map(s => ({
            x: t.gradesTable!.startX,
            y: s.baseY,
            fontSize: t.gradesTable!.fontSize,
            subjectWidth: 100,
            gradeOffsetX: t.gradesTable!.gradeColumnOffsetX,
            subjectId: s.subjectId,
            subjectName: s.subjectName
          })) || [],
          // Extra adatok a betöltéshez
          _original: t
        })) as any[];
        showLoadDialog.value = true;
      } catch (error) {
        console.error('Load error:', error);
        // Fallback localStorage-ra
        savedTemplates.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        showLoadDialog.value = true;
      }
    };

    const loadSelectedTemplate = (template: any) => {
      if (template._original) {
        // Adatbázisból jön
        const t = template._original as PrintTemplate;
        currentTemplateId.value = t.$id || null;
        templateName.value = t.name;
        documentType.value = t.documentType;
        selectedYear.value = t.year;
        selectedStudyProgramId.value = t.studyProgramId;
        formLanguage.value = t.formLanguage || 'bilingual';
        pageWidth.value = t.paperSize.width;
        pageHeight.value = t.paperSize.height;
        placedFields.value = convertFromFieldPositions(t.fields);
        if (t.gradesTable) {
          gradeRows.value = t.gradesTable.subjects.map(s => ({
            x: t.gradesTable!.startX,
            y: s.baseY,
            fontSize: t.gradesTable!.fontSize,
            subjectWidth: 100,
            gradeOffsetX: t.gradesTable!.gradeColumnOffsetX,
            subjectId: s.subjectId,
            subjectName: s.subjectName
          }));
        } else {
          gradeRows.value = [];
        }
      } else {
        // localStorage-ból jön (régi formátum)
        templateName.value = template.name;
        pageWidth.value = template.pageWidth;
        pageHeight.value = template.pageHeight;
        templateImageUrl.value = template.templateImage || null;
        placedFields.value = template.fields;
        gradeRows.value = template.gradeRows;
        currentTemplateId.value = null;
      }
      showLoadDialog.value = false;
    };

    const deleteTemplate = async (id: string) => {
      const confirmed = await openDialog({
        title: 'Sablon törlése',
        message: 'Biztosan törölni szeretnéd a sablont?',
        confirmText: 'Törlés',
        color: 'error',
        icon: 'mdi-delete'
      });
      if (!confirmed) return;

      try {
        const success = await PrintTemplateService.deleteTemplate(id);
        if (success) {
          // Frissítjük a listát
          const templates = await PrintTemplateService.getAllTemplates();
          savedTemplates.value = templates.map(t => ({
            id: t.$id || '',
            name: t.name,
            pageWidth: t.paperSize.width,
            pageHeight: t.paperSize.height,
            fields: {},
            gradeRows: [],
            _original: t
          })) as any[];
        }
      } catch (error) {
        console.error('Delete error:', error);
        // Fallback localStorage-ra
        const templates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = templates.filter((t: SavedTemplate) => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        savedTemplates.value = filtered;
      }
    };

    // Dokumentum típus változásakor
    const onDocumentTypeChange = () => {
      if (documentType.value === 'grade_book_base') {
        selectedYear.value = 0;
      } else if (documentType.value === 'grade_book_year' && selectedYear.value === 0) {
        selectedYear.value = 1;
      }
      // Töröljük a nem releváns mezőket
      const validKeys = availableFields.value.map(f => f.key);
      for (const key of Object.keys(placedFields.value)) {
        if (!validKeys.includes(key)) {
          delete placedFields.value[key];
        }
      }
    };

    // Tantárgyak betöltése sablon szerint
    const loadSubjectsForTemplate = async () => {
      if (documentType.value !== 'grade_book_year') return;

      try {
        if (selectedStudyProgramId.value) {
          // Szak-specifikus tantárgyak
          const subjects = await ErpService.getSubjectsForStudyProgram(selectedStudyProgramId.value, selectedYear.value);
          allSubjects.value = subjects;
        } else {
          // Összes tantárgy
          const subjects = await ErpService.getAllSubjects();
          allSubjects.value = subjects;
        }
      } catch (error) {
        console.error('Failed to load subjects:', error);
      }
    };

    // Tantárgy sorok automatikus generálása (évfolyam sablonhoz)
    const generateSubjectRows = () => {
      if (allSubjects.value.length === 0) return;

      const startY = 75;
      const rowHeight = 7;

      gradeRows.value = allSubjects.value.map((subject, index) => ({
        x: 30,
        y: startY + index * rowHeight,
        fontSize: 10,
        subjectWidth: 100,
        gradeOffsetX: 120,
        subjectId: subject.$id,
        subjectName: subject.name
      }));
    };

    // Dokumentum típus címke
    const getDocumentTypeLabel = (type: string): string => {
      const labels: Record<string, string> = {
        'grade_book_base': 'Főkönyv alap',
        'grade_book_year': 'Főkönyv évfolyam',
        'grade_book_matura': 'Főkönyv érettségi',
        'grade_book_certificates': 'Főkönyv oklevelek',
        'certificate': 'Bizonyítvány',
        'enrollment': 'Beiratkozási lap',
        'custom': 'Egyéni'
      };
      return labels[type] || type;
    };

    // Tantárgy nevek hozzáadása a beiratkozási sablonhoz
    // Ez a főkönyv bal oldalára kerül, ahol a tantárgy nevek vannak előre nyomtatva
    const addSubjectNameFields = () => {
      if (allSubjects.value.length === 0) {
        notify({ type: 'warning', text: 'Nincsenek betöltött tantárgyak!' });
        return;
      }

      const startY = 75;
      const rowHeight = 7;
      const baseX = 10; // Bal oldali margó

      // Tantárgy neveket helyezzük el a sablonon
      allSubjects.value.forEach((subject, index) => {
        const fieldKey = `subject_name_${index}`;
        placedFields.value[fieldKey] = {
          x: baseX,
          y: startY + index * rowHeight,
          fontSize: 9,
          width: 90,
          fontFamily: 'Arial',
          bold: false,
          letterSpacing: 0,
          lineHeight: 1.2,
          strikethrough: false,
          strikethroughWidth: 30
        };

        // Hozzáadjuk a mezőlistához is, ha még nincs
        if (!baseFields.find(f => f.key === fieldKey)) {
          baseFields.push({
            key: fieldKey,
            label: subject.name
          });
        }
      });
    };

    const testPrint = () => {
      viewMode.value = 'preview';
      setTimeout(() => {
        window.print();
      }, 100);
    };

    onMounted(async () => {
      // Régi sablonok localStorage-ból
      savedTemplates.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

      // Szakok betöltése
      try {
        studyProgramOptions.value = await ErpService.getAllStudyPrograms();
      } catch (error) {
        console.error('Failed to load study programs:', error);
      }

      // Tantárgyak betöltése
      try {
        allSubjects.value = await ErpService.getAllSubjects();
      } catch (error) {
        console.error('Failed to load subjects:', error);
      }
    });

    // Watch: szak vagy évfolyam változásakor tantárgyak újratöltése
    watch([selectedStudyProgramId, selectedYear], () => {
      if (documentType.value === 'grade_book_year') {
        loadSubjectsForTemplate();
      }
    });

    return {
      // Data
      documentTypes,
      yearOptions,
      paperSizes,
      fontFamilies,
      formLanguageOptions,
      availableFields,
      documentType,
      selectedYear,
      selectedStudyProgramId,
      currentTemplateId,
      formLanguage,
      studyProgramOptions,
      allSubjects,
      saving,
      templateName,
      templateFile,
      templateImageUrl,
      selectedPaperSize,
      pageWidth,
      pageHeight,
      viewMode,
      zoomLevel,
      showGrid,
      snapToGrid,
      placedFields,
      gradeRows,
      selectedFieldKey,
      selectedGradeRow,
      draggingField,
      canvas,
      showLoadDialog,
      savedTemplates,

      // Computed
      canvasStyle,

      // Methods
      applyPaperSize,
      loadTemplateImage,
      isFieldPlaced,
      selectField,
      addFieldToCanvas,
      removeFieldFromCanvas,
      addGradeRow,
      getFieldLabel,
      getPreviewValue,
      getSampleSubject,
      getSampleGrade,
      getFieldStyle,
      getFieldContentStyle,
      getGradeRowStyle,
      startDragField,
      startDragGradeRow,
      startResize,
      onCanvasMouseDown,
      onCanvasMouseMove,
      onCanvasMouseUp,
      saveTemplate,
      loadTemplate,
      loadSelectedTemplate,
      deleteTemplate,
      testPrint,
      onDocumentTypeChange,
      loadSubjectsForTemplate,
      generateSubjectRows,
      addSubjectNameFields,
      getDocumentTypeLabel
    };
  }
});
</script>

<style scoped>
.sidebar {
  background: #f5f5f5;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.canvas-area {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
}

.canvas-toolbar {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.canvas-scroll {
  flex: 1;
  overflow: auto;
  background: #e0e0e0;
  padding: 20px;
}

.canvas-wrapper {
  display: inline-block;
}

.template-canvas {
  position: relative;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.template-canvas.show-grid {
  background-image:
    linear-gradient(rgba(0, 0, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 255, 0.05) 1px, transparent 1px);
}

.template-background {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.5;
  pointer-events: none;
}

.placed-field {
  position: absolute;
  border: 1px dashed #1976d2;
  background: rgba(25, 118, 210, 0.05);
  cursor: move;
  user-select: none;
  padding: 2px 4px;
  min-height: 1.5em;
}

.placed-field.selected {
  border: 2px solid #1976d2;
  background: rgba(25, 118, 210, 0.1);
}

.placed-field.dragging {
  opacity: 0.7;
}

.placed-field:hover {
  background: rgba(25, 118, 210, 0.15);
}

.placed-field.has-strikethrough {
  border-color: #e65100;
}

.strikethrough-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  height: 0;
  border-top: 2px dashed #e65100;
  opacity: 0.7;
  pointer-events: none;
}

.field-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-handles {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 8px;
}

.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #1976d2;
  border-radius: 50%;
}

.handle-e {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.grade-row {
  display: flex;
  align-items: center;
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.grade-row.selected {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.grade-subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grade-value {
  font-weight: bold;
}

@media print {
  /* Hide all UI elements */
  .sidebar,
  .canvas-toolbar,
  .v-navigation-drawer,
  .v-app-bar,
  .v-footer,
  header,
  nav,
  .v-overlay-container {
    display: none !important;
  }

  /* Reset page margins */
  @page {
    margin: 0 !important;
    size: auto;
  }

  /* Remove any browser-added elements */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide URL, date, page numbers in print header/footer */
  html {
    height: 100%;
  }

  .canvas-area {
    height: auto;
    position: absolute;
    top: 0;
    left: 0;
  }

  .canvas-scroll {
    padding: 0;
    background: none;
    overflow: visible;
  }

  .canvas-wrapper {
    transform: none !important;
  }

  .template-canvas {
    box-shadow: none;
    margin: 0;
    padding: 0;
  }

  .placed-field {
    border: none !important;
    background: none !important;
  }

  .grade-row {
    border: none !important;
    background: none !important;
  }

  .template-background {
    opacity: 0;
  }

  /* Hide field handles */
  .field-handles {
    display: none !important;
  }
}
</style>
