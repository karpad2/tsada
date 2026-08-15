<template>
  <div class="page-shell">
    <div class="page-panel container">
      <div class="page-header-row">
        <div>
          <h1 class="section-title !text-2xl sm:!text-3xl">{{ $t('modules_title') }}</h1>
          <div class="section-accent !w-20"></div>
          <p class="page-subtitle">{{ $t('modules_help') }}</p>
        </div>
        <v-btn color="primary" :loading="saving" :disabled="!dirty" @click="save">
          {{ $t('save') }}
        </v-btn>
      </div>

      <div v-if="loading" class="page-state">
        <div class="page-spinner mx-auto mb-3"></div>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="item in catalog"
          :key="item.id"
          class="glass rounded-2xl p-4 sm:p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ $t(item.labelKey) }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ $t(item.helpKey) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <v-chip size="small" :color="phaseColor(item.id)" variant="tonal">
                {{ $t('module_phase_' + phase(item.id)) }}
              </v-chip>
              <v-switch
                v-model="map[item.id].enabled"
                color="primary"
                hide-details
                inset
                @update:model-value="dirty = true"
              />
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="block">
              <span class="text-xs font-medium text-slate-500">{{ $t('module_from') }}</span>
              <input
                v-model="map[item.id].from"
                type="datetime-local"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                @change="dirty = true"
              />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-slate-500">{{ $t('module_until') }}</span>
              <input
                v-model="map[item.id].until"
                type="datetime-local"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                @change="dirty = true"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  MODULE_CATALOG,
  defaultModuleMap,
  loadModuleWindows,
  modulePhase,
  saveModuleWindows,
  type ModuleId,
  type ModuleMap
} from '@/services/modules/windows'
import { notify } from '@kyvg/vue3-notification'
import { navigationService } from '@/services/navigation/NavigationService'
import { useNavigationData } from '@/composables/useNavigationData'

const { t } = useI18n()
const catalog = MODULE_CATALOG
const map = ref<ModuleMap>(defaultModuleMap())
const loading = ref(true)
const saving = ref(false)
const dirty = ref(false)

function phase(id: ModuleId) {
  return modulePhase(map.value[id])
}

function phaseColor(id: ModuleId) {
  const value = phase(id)
  if (value === 'live') return 'success'
  if (value === 'scheduled') return 'info'
  if (value === 'ended') return 'warning'
  return 'default'
}

onMounted(async () => {
  map.value = await loadModuleWindows()
  loading.value = false
})

async function save() {
  saving.value = true
  try {
    await saveModuleWindows(map.value)
    navigationService.clearCache()
    useNavigationData().clearCache()
    dirty.value = false
    notify({ type: 'success', text: t('saved') })
  } catch (error) {
    console.error('Failed to save module windows:', error)
    notify({ type: 'error', text: t('create_error') })
  } finally {
    saving.value = false
  }
}
</script>
