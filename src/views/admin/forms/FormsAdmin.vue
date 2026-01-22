<template>
  <div class="forms-admin min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-4xl font-black text-white mb-2">📝 Űrlapok</h1>
          <p class="text-gray-300">Google Forms-szerű űrlapok kezelése</p>
        </div>
        <div class="flex gap-3">
          <button @click="createNewForm" class="btn-primary">
            ➕ Új űrlap
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

      <!-- Empty State -->
      <div v-else-if="forms.length === 0" class="glass-card p-12 rounded-2xl text-center">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-2xl font-bold text-white mb-2">Még nincsenek űrlapok</h3>
        <p class="text-gray-400 mb-6">Hozd létre az első űrlapodat a fenti gombbal!</p>
        <button @click="createNewForm" class="btn-primary">
          ➕ Első űrlap létrehozása
        </button>
      </div>

      <!-- Forms Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="form in forms"
          :key="form.$id"
          class="glass-card rounded-2xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer group"
          @click="editForm(form.$id!)"
        >
          <!-- Card Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                {{ form.title || 'Névtelen űrlap' }}
              </h3>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  form.settings.active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                ]"
              >
                {{ form.settings.active ? 'Aktív' : 'Inaktív' }}
              </span>
            </div>
            <p class="text-gray-400 text-sm line-clamp-2 min-h-[40px]">
              {{ form.description || 'Nincs leírás' }}
            </p>
          </div>

          <!-- Card Stats -->
          <div class="px-6 py-4 bg-white/5 border-t border-white/10">
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1 text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {{ form.fields?.length || 0 }} mező
                </span>
                <span class="flex items-center gap-1 text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  {{ form.responsesCount || 0 }} válasz
                </span>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="px-6 py-3 bg-white/5 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              @click.stop="viewResponses(form.$id!)"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Válaszok megtekintése"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              @click.stop="copyFormLink(form.$id!)"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Link másolása"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <button
              @click.stop="duplicateForm(form)"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Duplikálás"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              @click.stop="confirmDelete(form)"
              class="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
              title="Törlés"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > pageSize" class="flex items-center justify-center gap-4 mt-8">
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

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteModal = false"
    >
      <div class="glass-card p-6 rounded-2xl max-w-md w-full">
        <h3 class="text-xl font-bold text-white mb-4">🗑️ Űrlap törlése</h3>
        <p class="text-gray-300 mb-6">
          Biztosan törölni szeretnéd a(z) <strong class="text-white">"{{ formToDelete?.title }}"</strong> űrlapot?
          Ez a művelet nem vonható vissza, és az összes válasz is törlődik!
        </p>
        <div class="flex gap-3 justify-end">
          <button @click="showDeleteModal = false" class="btn-secondary">
            Mégsem
          </button>
          <button @click="deleteForm" :disabled="isDeleting" class="btn-danger">
            {{ isDeleting ? 'Törlés...' : '🗑️ Törlés' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FormsService, type Form } from '@/services/forms/FormsService';
import { notify } from '@kyvg/vue3-notification';

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
    notify({
      type: 'error',
      text: 'Nem sikerült betölteni az űrlapokat!'
    });
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
    notify({
      type: 'success',
      text: '✅ Link másolva a vágólapra!'
    });
  }).catch(() => {
    notify({
      type: 'error',
      text: 'Nem sikerült másolni a linket'
    });
  });
}

async function duplicateForm(form: Form) {
  try {
    const newForm: Form = {
      title: `${form.title} (másolat)`,
      description: form.description,
      fields: [...form.fields],
      settings: { ...form.settings },
      theme: form.theme ? { ...form.theme } : undefined,
    };

    await formsService.createForm(newForm);
    notify({
      type: 'success',
      text: '✅ Űrlap sikeresen duplikálva!'
    });
    await loadForms();
  } catch (error) {
    console.error('Failed to duplicate form:', error);
    notify({
      type: 'error',
      text: 'Nem sikerült duplikálni az űrlapot!'
    });
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
    notify({
      type: 'success',
      text: '✅ Űrlap sikeresen törölve!'
    });
    showDeleteModal.value = false;
    formToDelete.value = null;
    await loadForms();
  } catch (error) {
    console.error('Failed to delete form:', error);
    notify({
      type: 'error',
      text: 'Nem sikerült törölni az űrlapot!'
    });
  } finally {
    isDeleting.value = false;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadForms();
  }
}

function nextPage() {
  if (currentPage.value < Math.ceil(total.value / pageSize)) {
    currentPage.value++;
    loadForms();
  }
}

function goBack() {
  router.push('/admin');
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
