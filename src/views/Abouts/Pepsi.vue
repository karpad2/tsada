<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <!-- Hero Header -->
      <div class="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div class="relative container mx-auto px-6 py-12">
          <div class="max-w-4xl">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div class="w-12 h-12 flex items-center justify-center">
                  <i class="pi pi-briefcase text-white text-2xl"></i>
                </div>
              </div>
              <h1 class="text-4xl font-bold text-white tracking-tight">{{ $t('services') }}</h1>
            </div>
            <p class="text-blue-100 text-lg mb-6 leading-relaxed">
              {{ $t('services_subtitle') || 'Iskolai szolgáltatások és fogadó órák' }}
            </p>
            <div class="flex gap-4">
              <button
                v-if="isAdmin"
                @click="openEditModal"
                class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                <i class="pi pi-plus w-5 h-5"></i>
                {{ $t('add_new_service') }}
              </button>
  
              <button
                v-if="isAdmin"
                @click="toggleEditMode"
                class="inline-flex items-center gap-2 px-6 py-3 backdrop-blur-sm text-white font-medium rounded-xl transition-all duration-200 border border-white/20"
                :class="editMode ? 'bg-red-600/80 hover:bg-red-700/80' : 'bg-green-600/80 hover:bg-green-700/80'"
              >
                <i :class="editMode ? 'pi pi-times' : 'pi pi-pencil'" class="w-5 h-5"></i>
                {{ editMode ? $t('exit_edit_mode') : $t('enter_edit_mode') }}
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Edit Mode Banner -->
      <div v-if="editMode && isAdmin" class="bg-orange-500 text-white px-6 py-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          <span class="font-medium">{{ $t('edit_mode_active') || 'Szerkesztési mód aktív - Kattints bármelyik szolgáltatásra a szerkesztéshez' }}</span>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="container mx-auto px-6 py-8">
        <!-- Loading State -->
        <div v-if="!loaded" class="flex flex-col items-center justify-center py-20">
          <div class="relative">
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p class="mt-4 text-gray-600 font-medium">{{ $t('loading_data') || 'Adatok betöltése...' }}</p>
        </div>
  
        <!-- Services Grid -->
        <div v-if="loaded && services.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div
            v-for="service in services"
            :key="service.id"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 transform relative"
            :class="{
              'hover:shadow-xl hover:-translate-y-1': !editMode,
              'hover:shadow-xl hover:border-blue-300 cursor-pointer': editMode,
              'ring-4 ring-blue-300 ring-opacity-50': editMode
            }"
            @click="editMode && editService(service)"
          >
            <!-- Edit Mode Overlay -->
            <div v-if="editMode" class="absolute inset-0 bg-blue-600/10 backdrop-blur-[0.5px] z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div class="bg-white rounded-full p-4 shadow-lg">
                <i class="pi pi-pencil text-blue-600 text-2xl"></i>
              </div>
            </div>
  
            <!-- Service Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button
                v-if="isAdmin && !editMode"
                @click.stop="editService(service)"
                class="absolute top-3 right-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors duration-200 opacity-0 group-hover:opacity-100"
              >
                <i class="pi pi-pencil text-white text-sm"></i>
              </button>
  
              <div class="flex items-center gap-4">
                <div class="relative">
                  <img
                    :src="service.worker_img"
                    :alt="service.worker_name || service.function_name"
                    class="w-16 h-16 rounded-full border-3 border-white/30 object-cover"
                  />
                  <div v-if="false" class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <i class="pi pi-check text-white text-xs"></i>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold mb-1 flex items-center gap-2">
                    {{ service.worker_name || $t('unknown') }}
                    <span v-if="!service.worker_name" class="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                      no worker match
                    </span>
                  </h3>
                  <p class="text-blue-100 text-sm">{{ service.function_name }}</p>
                </div>
              </div>
            </div>
  
            <!-- Service Content -->
            <div class="p-6">
              <!-- Receiving Hours -->
              <div v-if="service.receiving_schedules && service.receiving_schedules.length > 0" class="mb-4">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-clock text-blue-600"></i>
                  <h4 class="text-sm font-semibold text-gray-700"></h4>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(schedule, idx) in service.receiving_schedules"
                    :key="idx"
                    class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100"
                  >
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span class="font-medium text-gray-800 text-sm">
                          {{ getDayName(schedule.day) }}
                        </span>
                      </div>
                      <p class="text-blue-600 font-semibold text-sm ml-4">
                        {{ formatTimeRange(schedule.start, schedule.end) }}
                      </p>
                      <p v-if="schedule.location" class="text-gray-500 text-xs ml-4 flex items-center gap-1 mt-1">
                        <i class="pi pi-map-marker"></i>
                        {{ schedule.location }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6">
                <i class="pi pi-calendar-times text-gray-300 text-3xl mb-2"></i>
                <p class="text-gray-500 text-sm">{{ $t('no_receiving_hours') }}</p>
              </div>
  
              <!-- Contact Info -->
              <div v-if="service.contact" class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-envelope text-blue-600"></i>
                  <h4 class="text-sm font-semibold text-gray-700">{{ $t('contact') }}</h4>
                </div>
                <p class="text-gray-600 text-sm bg-gray-50 p-2 rounded-lg">
                  {{ service.contact }}
                </p>
              </div>
            </div>
  
            <!-- Admin Actions (Hidden in Edit Mode) -->
            <div v-if="isAdmin && !editMode" class="px-6 pb-4 group">
              <div class="flex gap-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  @click.stop="editService(service)"
                  class="flex-1 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                >
                  <i class="pi pi-pencil mr-1"></i>
                  {{ $t('edit') || 'Szerkesztés' }}
                </button>
                <button
                  @click.stop="deleteService(service.id)"
                  class="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Empty State -->
        <div v-if="loaded && services.length === 0" class="text-center py-20">
          <div class="max-w-md mx-auto">
            <div class="text-gray-400 mb-6">
              <i class="pi pi-briefcase text-6xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t('no_services_available') }}</h3>
            <p class="text-gray-600 mb-6">{{ $t('no_services_description') }}</p>
            <div v-if="isAdmin" class="flex gap-4 justify-center">
              <button
                @click="openEditModal"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                <i class="pi pi-plus"></i>
                {{ $t('add_new_service') }}
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Service Editor Modal -->
      <div
        v-if="showEditModal && isAdmin"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeEditModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold flex items-center gap-2">
                <i class="pi pi-briefcase"></i>
                {{ editingService ? $t('edit_service') : $t('add_new_service') }}
              </h3>
              <button
                @click="closeEditModal"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              >
                <i class="pi pi-times text-xl"></i>
              </button>
            </div>
            <p class="text-blue-100 text-sm mt-2">
              {{ editingService ? $t('modify_service_details') : $t('add_new_service_details') }}
            </p>
          </div>
  
          <!-- Modal Content -->
          <form @submit.prevent="addNewService" class="p-6 space-y-6">
            <!-- Worker Selection with Preview -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="pi pi-user text-blue-600"></i>
                {{ $t('worker_information') }}
              </h4>
  
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    {{ $t('select_worker') }} *
                  </label>
                  <select
                    v-model="newService.worker"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">{{ $t('choose_worker') }}</option>
                    <option v-for="worker in availableWorkers" :key="worker.id" :value="worker.id">
                      {{ worker.name }}
                    </option>
                  </select>
                </div>
  
                <!-- Worker Preview -->
                <div v-if="selectedWorker" class="flex flex-col items-center justify-center">
                  <img :src="selectedWorker.img" :alt="selectedWorker.name"
                       class="w-16 h-16 rounded-full border-4 border-blue-200 object-cover mb-2">
                  <p class="text-sm font-medium text-gray-700 text-center">{{ selectedWorker.name }}</p>
                </div>
              </div>
            </div>
  
            <!-- Function Fields -->
            <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
              <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="pi pi-briefcase text-blue-600"></i>
                {{ $t('function_details') }}
              </h4>
  
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    {{ $t('function') }} (Magyar) *
                  </label>
                  <input
                    v-model="newService.function_hu"
                    type="text"
                    required
                    :placeholder="$t('function_placeholder') || 'pl. Igazgató, Tanár, stb.'"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
  
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                      {{ $t('function_rs') }} (Српски)
                    </label>
                    <input
                      v-model="newService.function_rs"
                      type="text"
                      :placeholder="$t('function_rs_placeholder') || 'нпр. Директор, Наставник, итд.'"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
  
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                      {{ $t('function_en') }} (English)
                    </label>
                    <input
                      v-model="newService.function_en"
                      type="text"
                      :placeholder="$t('function_en_placeholder') || 'e.g. Principal, Teacher, etc.'"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Contact Info -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
              <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="pi pi-envelope text-green-600"></i>
                {{ $t('contact_information') }}
              </h4>
  
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  {{ $t('contact_info') }}
                </label>
                <input
                  v-model="newService.contact"
                  type="text"
                  :placeholder="$t('contact_placeholder') || 'Email cím, telefonszám, stb.'"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                />
                <p class="text-xs text-gray-500 mt-1">{{ $t('contact_info_hint') || 'Opcionális - csak akkor töltsd ki, ha szeretnéd megjeleníteni' }}</p>
              </div>
            </div>
  
            <!-- Receiving Hours -->
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <i class="pi pi-clock text-purple-600"></i>
                  {{ $t('receiving_hours') }}
                </h4>
                <button
                  type="button"
                  @click="addSchedule"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-lg"
                >
                  <i class="pi pi-plus"></i>
                  {{ $t('add_schedule') }}
                </button>
              </div>
  
              <div class="space-y-4">
                <div
                  v-for="(schedule, index) in newService.receiving_schedules"
                  :key="index"
                  class="p-4 bg-white rounded-lg border-2 border-gray-100 hover:border-purple-200 transition-colors duration-200"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                      {{ $t('schedule') }} #{{ index + 1 }}
                    </h5>
                    <button
                      type="button"
                      @click="removeSchedule(index)"
                      class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      :title="$t('remove_schedule')"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ $t('day') }} *</label>
                      <select
                        v-model="schedule.day"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-colors duration-200"
                        required
                      >
                        <option value="">{{ $t('select_day') }}</option>
                        <option value="monday">{{ getDayName('monday') }}</option>
                        <option value="tuesday">{{ getDayName('tuesday') }}</option>
                        <option value="wednesday">{{ getDayName('wednesday') }}</option>
                        <option value="thursday">{{ getDayName('thursday') }}</option>
                        <option value="friday">{{ getDayName('friday') }}</option>
                      </select>
                    </div>
  
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ $t('start_time') }} *</label>
                      <input
                        v-model="schedule.start"
                        type="time"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-colors duration-200"
                      />
                    </div>
  
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ $t('end_time') }} *</label>
                      <input
                        v-model="schedule.end"
                        type="time"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-colors duration-200"
                      />
                    </div>
  
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ $t('location') }}</label>
                      <input
                        v-model="schedule.location"
                        type="text"
                        :placeholder="$t('location_placeholder') || 'Helyiség, iroda'"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-colors duration-200"
                      />
                    </div>
                  </div>
  
                  <div v-if="schedule.start && schedule.end && !isValidTimeRange(schedule.start, schedule.end)"
                       class="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <i class="pi pi-exclamation-triangle"></i>
                    {{ $t('invalid_time_range') || 'A végidő később kell legyen, mint a kezdés' }}
                  </div>
                </div>
  
                <div v-if="newService.receiving_schedules.length === 0" class="text-center py-8 text-gray-500">
                  <i class="pi pi-calendar-times text-3xl mb-2 block"></i>
                  <p class="text-sm">{{ $t('no_schedules_yet') || 'Még nincsenek fogadóórák hozzáadva' }}</p>
                  <p class="text-xs">{{ $t('click_add_schedule') || 'Kattints a "Beosztás hozzáadása" gombra' }}</p>
                </div>
              </div>
            </div>
  
            <!-- Validation Summary -->
            <div v-if="validationErrors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-exclamation-triangle text-red-600"></i>
                <h5 class="text-sm font-semibold text-red-800">{{ $t('validation_errors') || 'Hiányzó vagy hibás adatok:' }}</h5>
              </div>
              <ul class="text-sm text-red-700 space-y-1">
                <li v-for="error in validationErrors" :key="error">• {{ error }}</li>
              </ul>
            </div>
  
            <!-- Modal Footer -->
            <div class="flex gap-3 justify-end pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                type="button"
                @click="closeEditModal"
                class="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                {{ $t('cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!isFormValid"
                class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                <i class="pi pi-save"></i>
                {{ editingService ? $t('update_service') : $t('add_service') }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm && isAdmin" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="p-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="p-3 bg-red-100 rounded-full">
                <i class="pi pi-trash text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ $t('confirm_delete') }}</h3>
                <p class="text-gray-600">{{ $t('confirm_delete_service') }}</p>
              </div>
            </div>
            <div class="flex gap-3 justify-end">
              <button
                @click="showDeleteConfirm = false"
                class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {{ $t('cancel') }}
              </button>
              <button
                @click="confirmDelete"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                {{ $t('delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { Databases, Storage, Query, ID } from 'appwrite';
  import { appw, config } from '@/appwrite';
  import { convertifserbian } from '@/lang';
  import { useLoadingStore } from '@/stores/loading';
  import Loading from '@/components/Loading.vue';
  
  interface Schedule {
    day: string;
    start: string;
    end: string;
    location: string;
  }
  
  interface Service {
    id: string;
    worker: string;
    worker_name: string;
    worker_img: string;
    function_hu: string;
    function_rs: string;
    function_en: string;
    function_name: string;
    contact: string;
    receiving_schedules: Schedule[];
  }
  
  interface Worker {
    id: string;
    name: string;
    img: string;
  }
  
  export default defineComponent({
    name: 'Services',
    components: { Loading },
    data: () => ({
      services: [] as Service[],
      availableWorkers: [] as Worker[],
      loaded: false,
      showEditModal: false,
      showDeleteConfirm: false,
      editingService: null as Service | null,
      serviceToDelete: null as string | null,
      editMode: false,
      newService: {
        worker: '',
        function_hu: '',
        function_rs: '',
        function_en: '',
        contact: '',
        receiving_schedules: [] as Schedule[],
      },
      dayNames: {
        hu: { monday: 'Hétfő', tuesday: 'Kedd', wednesday: 'Szerda', thursday: 'Csütörtök', friday: 'Péntek' },
        rs: { monday: 'Понедељак', tuesday: 'Уторак', wednesday: 'Среда', thursday: 'Четвртак', friday: 'Петак' },
        en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' },
      } as Record<string, Record<string, string>>,
    }),
    computed: {
      isAdmin(): boolean {
        const loadingStore = useLoadingStore();
        return loadingStore.userLoggedin;
      },
      selectedWorker(): Worker | null {
        return this.availableWorkers.find(w => w.id === this.newService.worker) || null;
      },
      isFormValid(): boolean {
        return !!(this.newService.worker && this.newService.function_hu);
      },
      validationErrors(): string[] {
        const errors: string[] = [];
        if (!this.newService.worker) {
          errors.push(String(this.$t('worker_required') || 'Munkatárs kiválasztása kötelező'));
        }
        if (!this.newService.function_hu) {
          errors.push(String(this.$t('function_hu_required') || 'Magyar nyelvű beosztás megadása kötelező'));
        }
        this.newService.receiving_schedules.forEach((schedule, index) => {
          if (schedule.day && (schedule.start || schedule.end)) {
            if (!schedule.start) errors.push(String(this.$t('schedule_start_required') || `${index + 1}. beosztás: kezdési idő kötelező`));
            if (!schedule.end) errors.push(String(this.$t('schedule_end_required') || `${index + 1}. beosztás: befejezési idő kötelező`));
            if (schedule.start && schedule.end && !this.isValidTimeRange(schedule.start, schedule.end)) {
              errors.push(String(this.$t('schedule_time_invalid') || `${index + 1}. beosztás: hibás időintervallum`));
            }
          }
        });
        return errors;
      },
    },
    mounted() {
      document.title = String(this.$t('services'));
      this.loadServices();
      this.loadWorkers();
    },
    methods: {
      toggleEditMode() {
        this.editMode = !this.editMode;
        if (this.editMode) {
          this.showNotification(String(this.$t('edit_mode_activated') || 'Szerkesztési mód aktiválva - Kattints bármelyik szolgáltatásra a szerkesztéshez'), 'info');
        }
      },
  
      showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
        if (type === 'error') alert('❌ ' + message);
        else if (type === 'success') alert('✅ ' + message);
        else alert('ℹ️ ' + message);
      },
  
      getDayName(dayKey: string): string {
        const loadingStore = useLoadingStore();
        const lang = loadingStore.language || 'hu';
        const langKey = lang === 'sr' ? 'rs' : (['hu', 'rs', 'en'].includes(lang) ? lang : 'hu');
        return (this.dayNames as any)[langKey]?.[dayKey] || dayKey;
      },
  
      formatTimeRange(start?: string, end?: string) {
        const pad = (t?: string) => {
          const s = (t || '').trim();
          if (!s) return '';
          const [h = '00', m = '00'] = s.split(':');
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };
        const s = pad(start);
        const e = pad(end);
        if (s && e) return `${s} – ${e}`;
        return s || e || '';
      },
  
      isValidTimeRange(start: string, end: string) {
        const toMin = (t: string) => {
          const [h, m] = (t || '').split(':').map(Number);
          return (isFinite(h) ? h : 0) * 60 + (isFinite(m) ? m : 0);
        };
        return !!start && !!end && toMin(end) > toMin(start);
      },
  
      // ---- ROBUSZTUS WORKER FELISMERÉS/FELOLDÁS ----
      guessWorkerField(doc: any): string | null {
        if (!doc || typeof doc !== 'object') return null;
        const candidates = ['workers','worker','worker_id','workerId','person','member','employee','staff','munkatars'];
        for (const key of candidates) if (key in doc) return key;
  
        for (const [k, v] of Object.entries(doc)) {
          if (v && typeof v === 'object' && '$id' in (v as any)) return k;
          if (typeof v === 'string' && v.length >= 20 && v.length <= 40) return k;
          if (Array.isArray(v)) {
            const first = v.find(Boolean);
            if (first && (typeof first === 'string' || (typeof first === 'object' && '$id' in first))) return k;
          }
        }
        return null;
      },
  
      async resolveWorkerValue(
        value: any,
        database: Databases,
        storage: Storage,
        local: string,
        missingPicture: string
      ): Promise<{ workerId: string; workerName: string; workerImg: string }> {
  
        const pickName = (w: any) =>
          (local === 'rs' || local === 'sr')
            ? convertifserbian(w?.worker_name_rs || w?.worker_name_hu || '')
            : (w?.worker_name_hu || w?.worker_name_rs || '');
  
        const fileUrl = (fid?: string) => fid
          ? (storage.getFileView(config.website_images, fid) as unknown as string)
          : (missingPicture as string);
  
        if (!value) return { workerId: '', workerName: '', workerImg: missingPicture };
  
        if (Array.isArray(value)) {
          const first = value.find(Boolean);
          return this.resolveWorkerValue(first, database, storage, local, missingPicture);
        }
  
        if (typeof value === 'object') {
          const workerId = (value as any).$id || '';
          return {
            workerId,
            workerName: pickName(value),
            workerImg: fileUrl((value as any).worker_img),
          };
        }
  
        if (typeof value === 'string') {
          try {
            const w = await database.getDocument(config.website_db, config.workers, value);
            return {
              workerId: w.$id,
              workerName: pickName(w),
              workerImg: fileUrl((w as any).worker_img),
            };
          } catch (e) {
            console.warn('resolveWorkerValue: getDocument failed for id:', value, e);
            return { workerId: value, workerName: '', workerImg: missingPicture };
          }
        }
  
        return { workerId: '', workerName: '', workerImg: missingPicture };
      },
  
      normalizeSchedules(raw: any): Schedule[] {
        try {
          const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : []);
          return (arr || []).map((s: any) => ({
            day: s?.day || '',
            start: s?.start || '',
            end: s?.end || '',
            location: s?.location || '',
          }));
        } catch {
          return [];
        }
      },
  
      async loadServices() {
        try {
          const database = new Databases(appw);
          const storage = new Storage(appw);
          const loadingStore = useLoadingStore();
          const local = loadingStore.language || 'hu';
          const missingPicture = storage.getFileView(
            config.website_images,
            config.missing_worker_picture
          ) as unknown as string;
  
          const { documents } = await database.listDocuments(
            config.website_db,
            config.services,
            [
              Query.limit(200),
              Query.orderAsc('$createdAt'),
              // Ha nálad működik a reláció-expanzió Appwrite 1.6+:
              // // @ts-ignore
              // Query.relations(true),
            ]
          );
  
          if (!documents || documents.length === 0) {
            this.services = [];
            this.loaded = true;
            return;
          }
  
          this.services = await Promise.all(
            documents.map(async (doc: any) => {
              const workerField = this.guessWorkerField(doc);
              const rawWorkerValue = workerField ? (doc as any)[workerField] : null;
  
              const { workerId, workerName, workerImg } = await this.resolveWorkerValue(
                rawWorkerValue,
                database,
                storage,
                local,
                missingPicture
              );
  
              const functionName =
                (local === 'rs' || local === 'sr') ? (doc.function_rs || doc.function_hu) :
                (local === 'en')              ? (doc.function_en || doc.function_hu) :
                                                (doc.function_hu || '');
  
              return {
                id: doc.$id,
                worker: workerId,
                worker_name: workerName || String(this.$t('unknown') || 'Ismeretlen'),
                worker_img: workerImg,
                function_hu: doc.function_hu || '',
                function_rs: doc.function_rs || '',
                function_en: doc.function_en || '',
                function_name: functionName,
                contact: doc.contact || '',
                receiving_schedules: this.normalizeSchedules(doc.receiving_schedules),
              } as Service;
            })
          );
  
          this.loaded = true;
        } catch (error) {
          console.error('Error loading services:', error);
          this.loaded = true;
          this.showNotification(String(this.$t('error_loading_services') || 'Hiba a szolgáltatások betöltése során'), 'error');
        }
      },
  
      async loadWorkers() {
        try {
          const database = new Databases(appw);
          const storage = new Storage(appw);
          const loadingStore = useLoadingStore();
          const local = loadingStore.language || 'hu';
          const missingPicture = storage.getFileView(config.website_images, config.missing_worker_picture) as unknown as string;
  
          const { documents } = await database.listDocuments(config.website_db, config.workers, [
            Query.select(['worker_name_hu', 'worker_name_rs', 'worker_img', '$id']),
            Query.limit(200),
          ]);
  
          this.availableWorkers = documents.map((worker: any) => ({
            id: worker.$id,
            name:
              (local === 'rs' || local === 'sr')
                ? convertifserbian(worker.worker_name_rs || '')
                : (worker.worker_name_hu || ''),
            img: worker.worker_img ? (storage.getFileView(config.website_images, worker.worker_img) as unknown as string) : missingPicture,
          }));
        } catch (error) {
          console.error('Error loading workers:', error);
          this.showNotification(String(this.$t('error_loading_workers') || 'Hiba a munkatársak betöltése során'), 'error');
        }
      },
  
      openEditModal() {
        this.showEditModal = true;
        this.resetNewService();
      },
  
      closeEditModal() {
        this.showEditModal = false;
        this.editingService = null;
        this.resetNewService();
        this.editMode = false;
      },
  
      resetNewService() {
        this.newService = {
          worker: '',
          function_hu: '',
          function_rs: '',
          function_en: '',
          contact: '',
          receiving_schedules: [],
        };
      },
  
      editService(service: Service) {
        this.editingService = service;
        this.newService = {
          worker: service.worker,
          function_hu: service.function_hu,
          function_rs: service.function_rs,
          function_en: service.function_en,
          contact: service.contact,
          receiving_schedules: JSON.parse(JSON.stringify(service.receiving_schedules)),
        };
        this.showEditModal = true;
        this.editMode = false;
      },
  
      addSchedule() {
        this.newService.receiving_schedules.push({
          day: '',
          start: '',
          end: '',
          location: '',
        });
      },
  
      removeSchedule(index: number) {
        this.newService.receiving_schedules.splice(index, 1);
      },
  
      async addNewService() {
        if (!this.isFormValid) {
          this.showNotification(String(this.$t('please_fix_validation_errors') || 'Kérlek javítsd ki a hibákat mielőtt elmented'), 'error');
          return;
        }
  
        const cleaned = (this.newService.receiving_schedules || [])
          .filter((s) => s.day && this.isValidTimeRange(s.start, s.end))
          .map((s) => ({ day: s.day, start: s.start, end: s.end, location: s.location || '' }));
  
        try {
          const database = new Databases(appw);
  
          const serviceData = {
            // DB mezőnév egységesen: workers
            workers: this.newService.worker,
            function_hu: this.newService.function_hu,
            function_rs: this.newService.function_rs,
            function_en: this.newService.function_en,
            contact: this.newService.contact,
            receiving_schedules: JSON.stringify(cleaned),
          };
  
          if (this.editingService) {
            await database.updateDocument(
              config.website_db,
              config.services,
              this.editingService.id,
              serviceData
            );
            this.showNotification(String(this.$t('service_updated_successfully') || 'Szolgáltatás sikeresen frissítve'), 'success');
          } else {
            await database.createDocument(
              config.website_db,
              config.services,
              ID.unique(),
              serviceData
            );
            this.showNotification(String(this.$t('service_added_successfully') || 'Szolgáltatás sikeresen hozzáadva'), 'success');
          }
  
          await this.loadServices();
          this.closeEditModal();
        } catch (error) {
          console.error('Error saving service:', error);
          this.showNotification(String(this.$t('error_saving_service') || 'Hiba történt a mentés során'), 'error');
        }
      },
  
      deleteService(serviceId: string) {
        this.serviceToDelete = serviceId;
        this.showDeleteConfirm = true;
      },
  
      async confirmDelete() {
        if (!this.serviceToDelete) return;
  
        try {
          const database = new Databases(appw);
          await database.deleteDocument(config.website_db, config.services, this.serviceToDelete);
          await this.loadServices();
          this.showDeleteConfirm = false;
          this.serviceToDelete = null;
          this.showNotification(String(this.$t('service_deleted_successfully') || 'Szolgáltatás sikeresen törölve'), 'success');
        } catch (error) {
          console.error('Error deleting service:', error);
          this.showNotification(String(this.$t('error_deleting_service') || 'Hiba történt a törlés során'), 'error');
        }
      },
    },
  });
  </script>
  
  <style scoped>
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  
  .animate-spin { animation: spin 1s linear infinite; }
  .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .ring-4 { animation: editModeGlow 2s ease-in-out infinite; }
  .bg-white { animation: fadeInUp 0.6s ease-out forwards; }
  .fixed { animation: fadeIn 0.3s ease-out forwards; }
  .fixed > div { animation: slideUp 0.4s ease-out forwards; }
  
  .hover\:shadow-xl:hover { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); transform: translateY(-4px); }
  .hover\:-translate-y-1:hover { transform: translateY(-0.25rem); }
  
  input:invalid:not(:placeholder-shown), select:invalid:not(:placeholder-shown) { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
  input:focus:valid, select:focus:valid { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
  
  .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
  .backdrop-blur-sm { backdrop-filter: blur(4px); }
  
  .overflow-y-auto::-webkit-scrollbar { width: 8px; }
  .overflow-y-auto::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
  .overflow-y-auto::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #cbd5e1, #94a3b8); border-radius: 4px; }
  .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #94a3b8, #64748b); }
  
  button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  button:hover { transform: translateY(-1px); }
  button:active { transform: translateY(0); }
  
  button:focus, input:focus, select:focus { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 3px rgba(59,130,246,0.5); }
  
  .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
  .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
  .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
  
  @media (max-width: 640px) {
    .grid-cols-1 { gap: 1rem; }
    .px-6 { padding-left: 1rem; padding-right: 1rem; }
    .text-4xl { font-size: 2rem; line-height: 2.5rem; }
  }
  
  @media (prefers-color-scheme: dark) {
    .bg-white { background-color: #1f2937; color: #f9fafb; }
    .text-gray-600 { color: #d1d5db; }
    .border-gray-100 { border-color: #374151; }
    .bg-gray-50 { background-color: #374151; }
  }
  
  @keyframes editModeGlow { 0%,100% { box-shadow: 0 0 5px rgba(59,130,246,0.3); } 50% { box-shadow: 0 0 20px rgba(59,130,246,0.5); } }
  @keyframes shake { 0%,100% { transform: translateX(0); } 10%,30%,50%,70%,90% { transform: translateX(-2px); } 20%,40%,60%,80% { transform: translateX(2px); } }
  .validation-error { animation: shake 0.5s ease-in-out; }
  .modal-overlay { transition: opacity 0.3s ease-out; }
  .modal-content { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .success-glow { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
  .interactive:hover { transform: scale(1.02); transition: transform 0.2s ease-out; }
  .interactive:active { transform: scale(0.98); }
  </style>
  