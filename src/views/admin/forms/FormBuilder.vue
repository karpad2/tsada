<template>
  <div class="form-builder min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-4xl font-black text-white mb-2">📝 Űrlap Szerkesztő</h1>
          <p class="text-gray-300">Google Forms-szerű űrlap építő</p>
        </div>
        <div class="flex gap-3">
          <button @click="saveForm" :disabled="isSaving" class="btn-primary">
            {{ isSaving ? '💾 Mentés...' : '💾 Mentés' }}
          </button>
          <button @click="previewForm" class="btn-secondary">
            👁️ Előnézet
          </button>
          <button @click="goBack" class="btn-secondary">
            ← Vissza
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Field Types Palette -->
        <div class="lg:col-span-1">
          <div class="glass-card p-6 rounded-2xl sticky top-6">
            <h3 class="text-xl font-bold text-white mb-4">Mezők</h3>
            <div class="space-y-2">
              <button
                v-for="fieldType in fieldTypes"
                :key="fieldType.type"
                @click="addField(fieldType.type)"
                class="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left"
              >
                <span class="text-2xl">{{ fieldType.icon }}</span>
                <div>
                  <div class="text-white font-semibold">{{ fieldType.label }}</div>
                  <div class="text-xs text-gray-400">{{ fieldType.description }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Form Builder Area -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Form Header -->
          <div class="glass-card p-8 rounded-3xl">
            <input
              v-model="form.title"
              type="text"
              placeholder="Űrlap címe"
              class="text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-400 w-full mb-4"
            />
            <textarea
              v-model="form.description"
              placeholder="Űrlap leírása (opcionális)"
              rows="2"
              class="text-lg bg-transparent border-none outline-none text-gray-300 placeholder-gray-500 w-full resize-none"
            ></textarea>
          </div>

          <!-- Fields -->
          <draggable
            v-model="form.fields"
            item-key="id"
            handle=".drag-handle"
            @start="drag = true"
            @end="drag = false"
            class="space-y-4"
          >
            <template #item="{ element: field, index }">
              <div class="glass-card p-6 rounded-2xl" :class="{ 'ring-2 ring-purple-500': selectedField === field.id }">
                <div class="flex items-start gap-4">
                  <!-- Drag Handle -->
                  <div class="drag-handle cursor-move text-gray-400 hover:text-white mt-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>

                  <!-- Field Content -->
                  <div class="flex-1">
                    <!-- Field Label & Settings Toggle -->
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex-1">
                        <input
                          v-model="field.label"
                          type="text"
                          :placeholder="`${getFieldTypeName(field.type)} címke`"
                          class="text-xl font-semibold bg-transparent border-b border-white/20 focus:border-purple-500 outline-none text-white placeholder-gray-400 w-full pb-2"
                        />
                        <input
                          v-model="field.description"
                          type="text"
                          placeholder="Segítő szöveg (opcionális)"
                          class="text-sm bg-transparent border-none outline-none text-gray-400 placeholder-gray-500 w-full mt-2"
                        />
                      </div>
                      <button
                        @click="toggleFieldSettings(field.id)"
                        class="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                    <!-- Field Preview -->
                    <div class="mb-4">
                      <component
                        :is="getFieldComponent(field.type)"
                        :field="field"
                        :disabled="true"
                        class="pointer-events-none"
                      />
                    </div>

                    <!-- Field Settings (Expandable) -->
                    <div v-if="selectedField === field.id" class="mt-4 p-4 bg-white/5 rounded-xl space-y-3">
                      <!-- Options for select/radio/checkbox -->
                      <div v-if="['select', 'radio', 'checkbox'].includes(field.type)">
                        <label class="block text-white text-sm font-semibold mb-2">Opciók</label>
                        <div class="space-y-2">
                          <div v-for="(option, optIndex) in field.options" :key="optIndex" class="flex gap-2">
                            <input
                              v-model="field.options[optIndex]"
                              type="text"
                              :placeholder="`Opció ${optIndex + 1}`"
                              class="flex-1 input-field-sm"
                            />
                            <button
                              @click="removeOption(field, optIndex)"
                              class="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                          <button @click="addOption(field)" class="text-sm text-purple-400 hover:text-purple-300">
                            + Új opció
                          </button>
                        </div>
                      </div>

                      <!-- Placeholder -->
                      <div v-if="['text', 'textarea', 'email', 'number', 'tel'].includes(field.type)">
                        <label class="block text-white text-sm font-semibold mb-2">Placeholder</label>
                        <input v-model="field.placeholder" type="text" class="input-field-sm" />
                      </div>

                      <!-- Validation -->
                      <div class="grid grid-cols-2 gap-3">
                        <div v-if="field.type === 'number'">
                          <label class="block text-white text-sm font-semibold mb-2">Min</label>
                          <input v-model.number="field.validation.min" type="number" class="input-field-sm" />
                        </div>
                        <div v-if="field.type === 'number'">
                          <label class="block text-white text-sm font-semibold mb-2">Max</label>
                          <input v-model.number="field.validation.max" type="number" class="input-field-sm" />
                        </div>
                      </div>

                      <!-- Required toggle -->
                      <label class="flex items-center gap-2 text-white cursor-pointer">
                        <input v-model="field.required" type="checkbox" class="checkbox" />
                        <span class="text-sm">Kötelező mező</span>
                      </label>
                    </div>
                  </div>

                  <!-- Delete Button -->
                  <button
                    @click="removeField(index)"
                    class="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </draggable>

          <!-- Add Field Hint -->
          <div v-if="form.fields.length === 0" class="glass-card p-12 rounded-2xl text-center">
            <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <p class="text-gray-400 text-lg">Kattints a bal oldali mezőkre az űrlap építéséhez</p>
          </div>

          <!-- Form Settings -->
          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-xl font-bold text-white mb-4">⚙️ Beállítások</h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between text-white cursor-pointer">
                <span>Többszöri kitöltés engedélyezése</span>
                <input v-model="form.settings.allowMultipleResponses" type="checkbox" class="checkbox" />
              </label>
              <label class="flex items-center justify-between text-white cursor-pointer">
                <span>Bejelentkezés kötelező</span>
                <input v-model="form.settings.requireLogin" type="checkbox" class="checkbox" />
              </label>
              <label class="flex items-center justify-between text-white cursor-pointer">
                <span>Haladásjelző megjelenítése</span>
                <input v-model="form.settings.showProgressBar" type="checkbox" class="checkbox" />
              </label>
              <label class="flex items-center justify-between text-white cursor-pointer">
                <span>Email cím gyűjtése</span>
                <input v-model="form.settings.collectEmail" type="checkbox" class="checkbox" />
              </label>
              <label class="flex items-center justify-between text-white cursor-pointer">
                <span>Űrlap aktív</span>
                <input v-model="form.settings.active" type="checkbox" class="checkbox" />
              </label>
              <div>
                <label class="block text-white text-sm font-semibold mb-2">Megerősítő üzenet</label>
                <textarea
                  v-model="form.settings.confirmationMessage"
                  rows="3"
                  class="input-field resize-none"
                  placeholder="Köszönjük a válaszod!"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { FormsService, type Form, type FormField } from '@/services/forms/FormsService';
import { nanoid } from 'nanoid';

const route = useRoute();
const router = useRouter();
const formsService = FormsService.getInstance();

const drag = ref(false);
const isSaving = ref(false);
const selectedField = ref<string | null>(null);

const fieldTypes = [
  { type: 'text', label: 'Rövid szöveg', icon: '📝', description: 'Egy soros szöveg' },
  { type: 'textarea', label: 'Hosszú szöveg', icon: '📄', description: 'Több soros szöveg' },
  { type: 'email', label: 'Email', icon: '📧', description: 'Email cím' },
  { type: 'number', label: 'Szám', icon: '🔢', description: 'Számérték' },
  { type: 'tel', label: 'Telefon', icon: '📞', description: 'Telefonszám' },
  { type: 'date', label: 'Dátum', icon: '📅', description: 'Dátum választó' },
  { type: 'time', label: 'Idő', icon: '⏰', description: 'Idő választó' },
  { type: 'select', label: 'Legördülő', icon: '📋', description: 'Választás listából' },
  { type: 'radio', label: 'Rádió gomb', icon: '🔘', description: 'Egy választás' },
  { type: 'checkbox', label: 'Jelölőnégyzet', icon: '☑️', description: 'Több választás' },
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
    alert('Nem sikerült betölteni az űrlapot!');
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

function toggleFieldSettings(fieldId: string) {
  selectedField.value = selectedField.value === fieldId ? null : fieldId;
}

function getFieldTypeName(type: string): string {
  return fieldTypes.find(ft => ft.type === type)?.label || type;
}

function getFieldComponent(type: string) {
  // Return preview component based on type
  return 'div'; // Placeholder - you'd create actual preview components
}

async function saveForm() {
  isSaving.value = true;

  try {
    if (route.params.id && route.params.id !== 'new') {
      await formsService.updateForm(route.params.id as string, form.value);
      alert('✅ Űrlap sikeresen frissítve!');
    } else {
      const created = await formsService.createForm(form.value);
      alert('✅ Űrlap sikeresen létrehozva!');
      router.replace(`/admin/forms/edit/${created.$id}`);
    }
  } catch (error: any) {
    console.error('Failed to save form:', error);
    alert('❌ Hiba történt: ' + (error.message || 'Ismeretlen hiba'));
  } finally {
    isSaving.value = false;
  }
}

function previewForm() {
  if (form.value.$id) {
    window.open(`/forms/${form.value.$id}`, '_blank');
  } else {
    alert('Mentsd el először az űrlapot!');
  }
}

function goBack() {
  router.push('/admin/forms');
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.input-field,
.input-field-sm {
  @apply w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500;
}

.input-field-sm {
  @apply py-2 text-sm;
}

.btn-primary {
  @apply px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all disabled:opacity-50;
}

.btn-secondary {
  @apply px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all;
}

.checkbox {
  @apply w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500;
}
</style>
