<template>
  <section class="page-shell py-4">
    <div class="page-panel container">
      <div class="page-header-row">
        <div>
          <div class="inline-flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25">
              <i class="pi pi-check-square text-white text-lg"></i>
            </div>
            <h1 class="section-title !mb-0 !text-2xl">{{ $t('audit_title') }}</h1>
          </div>
          <div class="section-accent"></div>
          <p class="page-subtitle">{{ $t('audit_subtitle') }}</p>
        </div>
        <button
          type="button"
          class="glass-btn px-4 py-2 text-white rounded-full text-sm font-medium"
          :disabled="loading"
          @click="refresh"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="mr-1"></i>
          {{ $t('audit_rescan') }}
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <template v-else>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="glass rounded-2xl p-4">
            <div class="text-2xl font-bold">{{ summary.scanned }}</div>
            <div class="text-sm text-gray-500">{{ $t('audit_scanned') }}</div>
          </div>
          <div class="glass rounded-2xl p-4">
            <div class="text-2xl font-bold text-emerald-600">{{ summary.complete }}</div>
            <div class="text-sm text-gray-500">{{ $t('audit_complete') }}</div>
          </div>
          <div class="glass rounded-2xl p-4">
            <div class="text-2xl font-bold text-rose-600">{{ summary.critical }}</div>
            <div class="text-sm text-gray-500">{{ $t('audit_critical') }}</div>
          </div>
          <div class="glass rounded-2xl p-4">
            <div class="text-2xl font-bold text-amber-600">{{ summary.optional }}</div>
            <div class="text-sm text-gray-500">{{ $t('audit_optional') }}</div>
          </div>
        </div>

        <div v-if="summary.failedSources.length" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {{ $t('audit_failed_sources') }}: {{ summary.failedSources.join(', ') }}
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="chip in chips"
            :key="chip.id"
            type="button"
            class="px-3 py-1.5 rounded-full text-sm border transition"
            :class="filter === chip.id
              ? 'bg-sky-500 text-white border-sky-500'
              : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'"
            @click="filter = chip.id"
          >
            {{ chip.label }}
            <span class="opacity-70">({{ chip.count }})</span>
          </button>
        </div>

        <input
          v-model="query"
          type="search"
          class="w-full md:w-80 mb-4 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
          :placeholder="$t('audit_search')"
        />

        <div v-if="visibleFindings.length === 0" class="text-center py-12 text-gray-400">
          {{ $t('audit_empty') }}
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in visibleFindings"
            :key="item.source + item.id"
            class="rounded-xl border border-gray-200 dark:border-slate-600 p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 dark:text-white truncate">{{ item.title }}</div>
              <div class="text-xs text-gray-500 mt-1 flex flex-wrap gap-2 items-center">
                <span>{{ $t(item.sourceLabelKey) }}</span>
                <span
                  v-if="item.visible === false"
                  class="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-600"
                >
                  {{ $t('invisible') }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full"
                  :class="item.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'"
                >
                  {{ item.severity === 'critical' ? $t('audit_critical') : $t('audit_optional') }}
                </span>
                <span v-for="lang in item.missingTitles" :key="'t'+lang" class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {{ $t('audit_missing_title') }} {{ lang.toUpperCase() }}
                </span>
                <span v-for="lang in item.missingBodies" :key="'b'+lang" class="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                  {{ $t('audit_missing_body') }} {{ lang.toUpperCase() }}
                </span>
              </div>
            </div>
            <router-link
              :to="item.editTo"
              class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm shrink-0"
            >
              {{ $t('Edit') }}
            </router-link>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { runContentAudit, type AuditFinding, type AuditSummary } from '@/services/content/audit'

const { t } = useI18n()

const loading = ref(true)
const query = ref('')
const filter = ref<'all' | 'critical' | 'hu' | 'rs' | 'en'>('all')
const findings = ref<AuditFinding[]>([])
const summary = ref<AuditSummary>({
  scanned: 0,
  complete: 0,
  critical: 0,
  optional: 0,
  missingByLang: { hu: 0, rs: 0, en: 0 },
  failedSources: []
})

const chips = computed(() => [
  { id: 'all' as const, label: t('audit_filter_all'), count: findings.value.length },
  { id: 'critical' as const, label: t('audit_critical'), count: summary.value.critical },
  { id: 'hu' as const, label: 'HU', count: summary.value.missingByLang.hu },
  { id: 'rs' as const, label: 'RS', count: summary.value.missingByLang.rs },
  { id: 'en' as const, label: 'EN', count: summary.value.missingByLang.en }
])

const visibleFindings = computed(() => {
  const q = query.value.trim().toLowerCase()
  return findings.value.filter((item) => {
    const langs = new Set([...item.missingTitles, ...item.missingBodies])
    if (filter.value === 'critical' && item.severity !== 'critical') return false
    if (filter.value !== 'all' && filter.value !== 'critical' && !langs.has(filter.value)) return false
    if (q && !item.title.toLowerCase().includes(q)) return false
    return true
  })
})

async function refresh() {
  loading.value = true
  try {
    const result = await runContentAudit()
    findings.value = result.findings
    summary.value = result.summary
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>
