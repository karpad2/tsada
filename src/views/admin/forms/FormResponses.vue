<template>
  <div class="form-responses min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-4xl font-black text-white mb-2">📊 Válaszok</h1>
          <p class="text-gray-300" v-if="form">{{ form.title }}</p>
        </div>
        <div class="flex gap-3">
          <button @click="exportToCSV" :disabled="responses.length === 0" class="btn-secondary">
            📥 CSV Export
          </button>
          <button @click="goBack" class="btn-secondary">
            ← Vissza
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="glass-card p-12 rounded-2xl text-center">
        <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">Betöltés...</p>
      </div>

      <!-- Stats Cards -->
      <div v-else-if="form" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-3xl font-bold text-white mb-1">{{ total }}</div>
          <div class="text-gray-400 text-sm">Összes válasz</div>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-3xl font-bold text-white mb-1">{{ form.fields.length }}</div>
          <div class="text-gray-400 text-sm">Mező</div>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-3xl font-bold text-white mb-1">
            {{ form.settings.active ? '✅' : '❌' }}
          </div>
          <div class="text-gray-400 text-sm">{{ form.settings.active ? 'Aktív' : 'Inaktív' }}</div>
        </div>
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-3xl font-bold text-white mb-1">
            {{ latestResponseDate || '-' }}
          </div>
          <div class="text-gray-400 text-sm">Utolsó válasz</div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex gap-2 mb-6">
        <button
          @click="viewMode = 'table'"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition-all',
            viewMode === 'table' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
          ]"
        >
          📋 Táblázat
        </button>
        <button
          @click="viewMode = 'cards'"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition-all',
            viewMode === 'cards' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
          ]"
        >
          🗂️ Kártyák
        </button>
        <button
          @click="viewMode = 'stats'"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition-all',
            viewMode === 'stats' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
          ]"
        >
          📊 Statisztikák
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && responses.length === 0" class="glass-card p-12 rounded-2xl text-center">
        <div class="text-6xl mb-4">📭</div>
        <h3 class="text-2xl font-bold text-white mb-2">Még nincsenek válaszok</h3>
        <p class="text-gray-400 mb-6">Oszd meg az űrlap linkjét, hogy válaszokat kapj!</p>
        <button @click="copyFormLink" class="btn-primary">
          📋 Link másolása
        </button>
      </div>

      <!-- Table View -->
      <div v-else-if="viewMode === 'table'" class="glass-card rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-white/10">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">#</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Dátum</th>
                <th
                  v-for="field in form?.fields"
                  :key="field.id"
                  class="px-4 py-3 text-left text-sm font-semibold text-gray-300 max-w-xs"
                >
                  {{ field.label }}
                </th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-300">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(response, index) in responses"
                :key="response.$id"
                class="border-t border-white/10 hover:bg-white/5"
              >
                <td class="px-4 py-3 text-gray-400">{{ index + 1 }}</td>
                <td class="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">
                  {{ formatDate(response.submittedAt) }}
                </td>
                <td
                  v-for="field in form?.fields"
                  :key="field.id"
                  class="px-4 py-3 text-white max-w-xs truncate"
                  :title="formatResponseValue(response.responses[field.id])"
                >
                  {{ formatResponseValue(response.responses[field.id]) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="viewResponse(response)"
                    class="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                    title="Megtekintés"
                  >
                    👁️
                  </button>
                  <button
                    @click="confirmDeleteResponse(response)"
                    class="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                    title="Törlés"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards View -->
      <div v-else-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(response, index) in responses"
          :key="response.$id"
          class="glass-card p-6 rounded-2xl"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-purple-400 font-bold">#{{ index + 1 }}</span>
            <span class="text-gray-400 text-sm">{{ formatDate(response.submittedAt) }}</span>
          </div>
          <div class="space-y-3">
            <div v-for="field in form?.fields" :key="field.id">
              <div class="text-gray-400 text-xs uppercase tracking-wide">{{ field.label }}</div>
              <div class="text-white">{{ formatResponseValue(response.responses[field.id]) || '-' }}</div>
            </div>
          </div>
          <div class="flex gap-2 mt-4 pt-4 border-t border-white/10">
            <button
              @click="viewResponse(response)"
              class="flex-1 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              👁️ Részletek
            </button>
            <button
              @click="confirmDeleteResponse(response)"
              class="py-2 px-4 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Stats View -->
      <div v-else-if="viewMode === 'stats'" class="space-y-6">
        <div v-for="field in form?.fields" :key="field.id" class="glass-card p-6 rounded-2xl">
          <h3 class="text-xl font-bold text-white mb-4">{{ field.label }}</h3>

          <!-- For select/radio/checkbox - show bar chart -->
          <div v-if="['select', 'radio', 'checkbox'].includes(field.type) && stats?.fieldStats[field.id]?.counts">
            <div class="space-y-3">
              <div
                v-for="(count, option) in stats.fieldStats[field.id].counts"
                :key="option"
                class="flex items-center gap-4"
              >
                <div class="w-32 text-gray-300 truncate" :title="option">{{ option }}</div>
                <div class="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    :style="{ width: `${getPercentage(count)}%` }"
                  ></div>
                </div>
                <div class="w-16 text-right text-white font-semibold">
                  {{ count }} ({{ getPercentage(count) }}%)
                </div>
              </div>
            </div>
          </div>

          <!-- For text/number - show summary -->
          <div v-else-if="stats?.fieldStats[field.id]">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-white/5 p-4 rounded-xl">
                <div class="text-2xl font-bold text-white">{{ stats.fieldStats[field.id].responses?.length || 0 }}</div>
                <div class="text-gray-400 text-sm">Válaszok</div>
              </div>
              <div v-if="field.type === 'number'" class="bg-white/5 p-4 rounded-xl">
                <div class="text-2xl font-bold text-white">{{ calculateAverage(stats.fieldStats[field.id].responses) }}</div>
                <div class="text-gray-400 text-sm">Átlag</div>
              </div>
            </div>
            <!-- Recent responses preview -->
            <div class="mt-4">
              <div class="text-gray-400 text-sm mb-2">Utolsó válaszok:</div>
              <div class="space-y-2">
                <div
                  v-for="(resp, idx) in (stats.fieldStats[field.id].responses || []).slice(-5).reverse()"
                  :key="idx"
                  class="p-3 bg-white/5 rounded-lg text-white text-sm"
                >
                  "{{ resp }}"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > pageSize && viewMode !== 'stats'" class="flex items-center justify-center gap-4 mt-8">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="btn-secondary disabled:opacity-50"
        >
          ← Előző
        </button>
        <span class="text-gray-400">
          {{ currentPage }} / {{ Math.ceil(total / pageSize) }}
        </span>
        <button
          @click="nextPage"
          :disabled="currentPage >= Math.ceil(total / pageSize)"
          class="btn-secondary disabled:opacity-50"
        >
          Következő →
        </button>
      </div>
    </div>

    <!-- Response Detail Modal -->
    <div
      v-if="selectedResponse"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="selectedResponse = null"
    >
      <div class="glass-card p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">📝 Válasz részletei</h3>
          <button
            @click="selectedResponse = null"
            class="p-2 hover:bg-white/10 rounded-lg text-gray-400"
          >
            ✕
          </button>
        </div>
        <div class="text-sm text-gray-400 mb-4">
          Beküldve: {{ formatDate(selectedResponse.submittedAt) }}
        </div>
        <div class="space-y-4">
          <div v-for="field in form?.fields" :key="field.id" class="p-4 bg-white/5 rounded-xl">
            <div class="text-purple-400 text-sm font-semibold mb-1">{{ field.label }}</div>
            <div class="text-white whitespace-pre-wrap">
              {{ formatResponseValue(selectedResponse.responses[field.id]) || '-' }}
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-6">
          <button @click="selectedResponse = null" class="btn-secondary">
            Bezárás
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="responseToDelete"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="responseToDelete = null"
    >
      <div class="glass-card p-6 rounded-2xl max-w-md w-full">
        <h3 class="text-xl font-bold text-white mb-4">🗑️ Válasz törlése</h3>
        <p class="text-gray-300 mb-6">
          Biztosan törölni szeretnéd ezt a választ? Ez a művelet nem vonható vissza!
        </p>
        <div class="flex gap-3 justify-end">
          <button @click="responseToDelete = null" class="btn-secondary">
            Mégsem
          </button>
          <button @click="deleteResponse" :disabled="isDeleting" class="btn-danger">
            {{ isDeleting ? 'Törlés...' : '🗑️ Törlés' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FormsService, type Form, type FormResponse } from '@/services/forms/FormsService';
import { notify } from '@kyvg/vue3-notification';

const route = useRoute();
const router = useRouter();
const formsService = FormsService.getInstance();

const form = ref<Form | null>(null);
const responses = ref<FormResponse[]>([]);
const stats = ref<{ totalResponses: number; fieldStats: Record<string, any> } | null>(null);
const total = ref(0);
const isLoading = ref(true);
const isDeleting = ref(false);
const currentPage = ref(1);
const pageSize = 25;
const viewMode = ref<'table' | 'cards' | 'stats'>('table');

const selectedResponse = ref<FormResponse | null>(null);
const responseToDelete = ref<FormResponse | null>(null);

const latestResponseDate = computed(() => {
  if (responses.value.length === 0) return null;
  const dates = responses.value.map(r => new Date(r.submittedAt));
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));
  return formatShortDate(latest);
});

onMounted(async () => {
  const formId = route.params.id as string;
  if (!formId) {
    router.push('/admin/forms');
    return;
  }

  try {
    form.value = await formsService.getForm(formId);
    await loadResponses();
    stats.value = await formsService.getFormStats(formId);
  } catch (error) {
    console.error('Failed to load form:', error);
    notify({
      type: 'error',
      text: 'Nem sikerült betölteni az űrlapot!'
    });
    router.push('/admin/forms');
  } finally {
    isLoading.value = false;
  }
});

async function loadResponses() {
  if (!form.value?.$id) return;

  const offset = (currentPage.value - 1) * pageSize;
  const result = await formsService.getFormResponses(form.value.$id, pageSize, offset);
  responses.value = result.responses;
  total.value = result.total;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('hu-HU', {
    month: 'short',
    day: 'numeric'
  });
}

function formatResponseValue(value: any): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function getPercentage(count: number): number {
  if (total.value === 0) return 0;
  return Math.round((count / total.value) * 100);
}

function calculateAverage(values: any[]): string {
  if (!values || values.length === 0) return '-';
  const numbers = values.filter(v => typeof v === 'number');
  if (numbers.length === 0) return '-';
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return avg.toFixed(1);
}

function viewResponse(response: FormResponse) {
  selectedResponse.value = response;
}

function confirmDeleteResponse(response: FormResponse) {
  responseToDelete.value = response;
}

async function deleteResponse() {
  if (!responseToDelete.value?.$id) return;

  isDeleting.value = true;
  try {
    await formsService.deleteResponse(responseToDelete.value.$id);
    notify({
      type: 'success',
      text: '✅ Válasz sikeresen törölve!'
    });
    responseToDelete.value = null;
    await loadResponses();
    if (form.value?.$id) {
      stats.value = await formsService.getFormStats(form.value.$id);
    }
  } catch (error) {
    console.error('Failed to delete response:', error);
    notify({
      type: 'error',
      text: 'Nem sikerült törölni a választ!'
    });
  } finally {
    isDeleting.value = false;
  }
}

function copyFormLink() {
  if (!form.value?.$id) return;
  const url = `${window.location.origin}/forms/${form.value.$id}`;
  navigator.clipboard.writeText(url).then(() => {
    notify({
      type: 'success',
      text: '✅ Link másolva a vágólapra!'
    });
  });
}

function exportToCSV() {
  if (!form.value || responses.value.length === 0) return;

  const headers = ['#', 'Dátum', ...form.value.fields.map(f => f.label)];
  const rows = responses.value.map((response, index) => {
    return [
      index + 1,
      formatDate(response.submittedAt),
      ...form.value!.fields.map(f => formatResponseValue(response.responses[f.id]))
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${form.value.title || 'form'}_responses_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  notify({
    type: 'success',
    text: '✅ CSV fájl letöltve!'
  });
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadResponses();
  }
}

function nextPage() {
  if (currentPage.value < Math.ceil(total.value / pageSize)) {
    currentPage.value++;
    loadResponses();
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

.btn-primary {
  @apply px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all disabled:opacity-50;
}

.btn-secondary {
  @apply px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all;
}

.btn-danger {
  @apply px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50;
}
</style>
