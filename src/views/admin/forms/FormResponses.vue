<template>
  <div class="page-shell">
  <div class="page-panel container">
  <v-container fluid class="pa-0">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <div>
            <h1 class="section-title !text-2xl sm:!text-3xl !mb-1">Válaszok</h1>
            <div class="section-accent !mb-2"></div>
            <p class="page-subtitle !mt-0" v-if="form">{{ form.title }}</p>
          </div>
          <div class="d-flex ga-2">
            <v-btn variant="outlined" prepend-icon="mdi-download" :disabled="responses.length === 0" @click="exportToCSV">
              CSV Export
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
              Vissza
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="isLoading">
      <v-col class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-1 text-medium-emphasis mt-4">Betöltés...</p>
      </v-col>
    </v-row>

    <template v-else-if="form">
      <!-- Stats Cards -->
      <v-row class="mb-6">
        <v-col cols="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold">{{ total }}</div>
              <div class="text-caption text-medium-emphasis">Összes válasz</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold">{{ form.fields.length }}</div>
              <div class="text-caption text-medium-emphasis">Mező</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <v-chip :color="form.settings.active ? 'success' : 'error'" variant="tonal" size="large">
                {{ form.settings.active ? 'Aktív' : 'Inaktív' }}
              </v-chip>
              <div class="text-caption text-medium-emphasis mt-1">Státusz</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h6 font-weight-bold">{{ latestResponseDate || '-' }}</div>
              <div class="text-caption text-medium-emphasis">Utolsó válasz</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- View Toggle -->
      <v-row class="mb-4">
        <v-col>
          <v-btn-toggle v-model="viewMode" mandatory color="primary" variant="outlined">
            <v-btn value="table" prepend-icon="mdi-table">Táblázat</v-btn>
            <v-btn value="cards" prepend-icon="mdi-view-grid">Kártyák</v-btn>
            <v-btn value="stats" prepend-icon="mdi-chart-bar">Statisztikák</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-card v-if="responses.length === 0" class="text-center pa-12">
        <v-icon size="64" color="grey">mdi-inbox-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mt-4">Még nincsenek válaszok</h3>
        <p class="text-body-2 text-medium-emphasis mt-2">Oszd meg az űrlap linkjét, hogy válaszokat kapj!</p>
        <v-btn color="primary" class="mt-4" prepend-icon="mdi-link" @click="copyFormLink">
          Link másolása
        </v-btn>
      </v-card>

      <!-- Table View -->
      <v-card v-else-if="viewMode === 'table'">
        <v-table>
          <thead>
            <tr>
              <th>#</th>
              <th>Dátum</th>
              <th v-for="field in form.fields" :key="field.id" class="text-truncate" style="max-width: 200px;">
                {{ field.label }}
              </th>
              <th class="text-right">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(response, index) in responses" :key="response.$id">
              <td>{{ index + 1 }}</td>
              <td class="text-no-wrap">{{ formatDate(response.submittedAt) }}</td>
              <td
                v-for="field in form.fields"
                :key="field.id"
                class="text-truncate"
                style="max-width: 200px;"
                :title="formatResponseValue(response.responses[field.id])"
              >
                {{ formatResponseValue(response.responses[field.id]) }}
              </td>
              <td class="text-right text-no-wrap">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="viewResponse(response)"
                  title="Megtekintés"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDeleteResponse(response)"
                  title="Törlés"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Cards View -->
      <v-row v-else-if="viewMode === 'cards'">
        <v-col
          v-for="(response, index) in responses"
          :key="response.$id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card class="h-100">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-primary font-weight-bold">#{{ index + 1 }}</span>
              <span class="text-caption text-medium-emphasis">{{ formatDate(response.submittedAt) }}</span>
            </v-card-title>
            <v-card-text>
              <div v-for="field in form.fields" :key="field.id" class="mb-2">
                <div class="text-caption text-medium-emphasis text-uppercase">{{ field.label }}</div>
                <div>{{ formatResponseValue(response.responses[field.id]) || '-' }}</div>
              </div>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <v-btn variant="text" size="small" prepend-icon="mdi-eye" @click="viewResponse(response)">
                Részletek
              </v-btn>
              <v-spacer />
              <v-btn variant="text" size="small" color="error" icon="mdi-delete" @click="confirmDeleteResponse(response)" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats View -->
      <div v-else-if="viewMode === 'stats'">
        <v-card v-for="field in form.fields" :key="field.id" class="mb-4">
          <v-card-title>{{ field.label }}</v-card-title>
          <v-card-text>
            <!-- For select/radio/checkbox - show bar chart -->
            <div v-if="['select', 'radio', 'checkbox'].includes(field.type) && stats?.fieldStats[field.id]?.counts">
              <div v-for="(count, option) in stats.fieldStats[field.id].counts" :key="String(option)" class="mb-3">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-body-2">{{ option }}</span>
                  <span class="text-body-2 font-weight-medium">{{ count }} ({{ getPercentage(count as number) }}%)</span>
                </div>
                <v-progress-linear
                  :model-value="getPercentage(count as number)"
                  color="primary"
                  height="8"
                  rounded
                />
              </div>
            </div>

            <!-- For text/number - show summary -->
            <div v-else-if="stats?.fieldStats[field.id]">
              <v-row dense class="mb-4">
                <v-col cols="6" md="3">
                  <v-card variant="tonal" color="primary">
                    <v-card-text class="text-center pa-3">
                      <div class="text-h5 font-weight-bold">{{ stats.fieldStats[field.id].responses?.length || 0 }}</div>
                      <div class="text-caption">Válaszok</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col v-if="field.type === 'number'" cols="6" md="3">
                  <v-card variant="tonal" color="success">
                    <v-card-text class="text-center pa-3">
                      <div class="text-h5 font-weight-bold">{{ calculateAverage(stats.fieldStats[field.id].responses) }}</div>
                      <div class="text-caption">Átlag</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <!-- Recent responses preview -->
              <div class="text-subtitle-2 mb-2">Utolsó válaszok:</div>
              <v-list density="compact" variant="tonal">
                <v-list-item
                  v-for="(resp, idx) in (stats.fieldStats[field.id].responses || []).slice(-5).reverse()"
                  :key="idx"
                  :title="String(resp)"
                />
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Pagination -->
      <v-row v-if="total > pageSize && viewMode !== 'stats'" class="mt-4">
        <v-col class="d-flex justify-center">
          <v-pagination
            v-model="currentPage"
            :length="Math.ceil(total / pageSize)"
            @update:model-value="loadResponses"
          />
        </v-col>
      </v-row>
    </template>

    <!-- Response Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="600">
      <v-card v-if="selectedResponse">
        <v-card-title>Válasz részletei</v-card-title>
        <v-card-subtitle>Beküldve: {{ formatDate(selectedResponse.submittedAt) }}</v-card-subtitle>
        <v-card-text>
          <v-list>
            <v-list-item v-for="field in form?.fields" :key="field.id" class="px-0">
              <template #prepend>
                <v-icon color="primary" size="small">mdi-circle-small</v-icon>
              </template>
              <v-list-item-title class="text-caption text-medium-emphasis">{{ field.label }}</v-list-item-title>
              <v-list-item-subtitle class="text-body-1 text-high-emphasis" style="white-space: pre-wrap;">
                {{ formatResponseValue(selectedResponse.responses[field.id]) || '-' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">Bezárás</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="420">
      <v-card>
        <v-card-title>Válasz törlése</v-card-title>
        <v-card-text>
          Biztosan törölni szeretnéd ezt a választ? Ez a művelet nem vonható vissza!
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">Mégsem</v-btn>
          <v-btn color="error" variant="elevated" :loading="isDeleting" @click="deleteResponse">
            Törlés
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
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
const showDetailDialog = ref(false);
const showDeleteDialog = ref(false);

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
  const avg = numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length;
  return avg.toFixed(1);
}

function viewResponse(response: FormResponse) {
  selectedResponse.value = response;
  showDetailDialog.value = true;
}

function confirmDeleteResponse(response: FormResponse) {
  responseToDelete.value = response;
  showDeleteDialog.value = true;
}

async function deleteResponse() {
  if (!responseToDelete.value?.$id) return;

  isDeleting.value = true;
  try {
    await formsService.deleteResponse(responseToDelete.value.$id);
    notify({
      type: 'success',
      text: 'Válasz sikeresen törölve!'
    });
    showDeleteDialog.value = false;
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
      text: 'Link másolva a vágólapra!'
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
    text: 'CSV fájl letöltve!'
  });
}

function goBack() {
  router.push('/admin/forms');
}
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
