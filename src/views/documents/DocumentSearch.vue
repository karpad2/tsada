<template>
  <section class="page-shell">
    <div class="page-panel container">
      <div class="page-header">
        <div class="inline-flex items-center gap-3 mb-2">
          <div class="w-11 h-11 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25">
            <i class="pi pi-search text-white text-lg"></i>
          </div>
          <h1 class="section-title !mb-0">{{ $t('docsearch_title') }}</h1>
        </div>
        <div class="section-accent"></div>
        <p class="page-subtitle">{{ $t('docsearch_subtitle') }}</p>
      </div>

      <div v-if="!moduleOpen" class="page-state">
        <h3 class="page-state-title">{{ $t('module_closed') }}</h3>
      </div>

      <form v-else class="glass rounded-2xl p-4 sm:p-5 mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" @submit.prevent>
        <label class="block md:col-span-2 xl:col-span-3">
          <span class="label">{{ $t('docsearch_query') }}</span>
          <input
            v-model="filters.query"
            type="search"
            class="field"
            :placeholder="$t('docsearch_query_placeholder')"
          />
        </label>

        <label class="block">
          <span class="label">{{ $t('docsearch_category') }}</span>
          <select v-model="filters.categoryId" class="field">
            <option value="">{{ $t('docsearch_all_categories') }}</option>
            <option v-for="cat in visibleCategories" :key="cat.id" :value="cat.id">
              {{ categoryLabel(cat) }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="label">{{ $t('docsearch_source') }}</span>
          <select v-model="filters.source" class="field">
            <option value="all">{{ $t('docsearch_source_all') }}</option>
            <option value="school">{{ $t('docsearch_source_school') }}</option>
            <option value="students">{{ $t('docsearch_source_students') }}</option>
          </select>
        </label>

        <label class="block">
          <span class="label">{{ $t('docsearch_from') }}</span>
          <input v-model="filters.from" type="date" class="field" />
        </label>

        <label class="block">
          <span class="label">{{ $t('docsearch_to') }}</span>
          <input v-model="filters.to" type="date" class="field" />
        </label>

        <div class="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2 items-center">
          <button type="button" class="chip" @click="applyPreset('30')">{{ $t('docsearch_preset_30') }}</button>
          <button type="button" class="chip" @click="applyPreset('year')">{{ $t('docsearch_preset_year') }}</button>
          <button type="button" class="chip" @click="applyPreset('last_year')">{{ $t('docsearch_preset_last_year') }}</button>
          <button type="button" class="chip chip-reset" @click="resetFilters">{{ $t('docsearch_reset') }}</button>
        </div>
      </form>

      <div v-if="moduleOpen && loading" class="flex justify-center py-16">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <template v-else-if="moduleOpen">
        <div v-if="failed.length" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {{ $t('docsearch_partial') }}
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {{ $t('docsearch_results', { count: hits.length }) }}
        </p>

        <div v-if="hits.length === 0" class="text-center py-14 text-gray-400">
          <i class="pi pi-inbox text-4xl mb-3 block"></i>
          {{ $t('docsearch_empty') }}
        </div>

        <div v-else class="space-y-2">
          <article
            v-for="hit in hits"
            :key="hit.source + hit.id"
            class="rounded-xl border border-gray-200 dark:border-slate-600 bg-white/70 dark:bg-slate-800/40 p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <h2 class="font-semibold text-gray-900 dark:text-white truncate">{{ hit.title }}</h2>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span v-if="hit.categoryName" class="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200">
                  {{ hit.categoryName }}
                </span>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                  {{ hit.source === 'students' ? $t('docsearch_source_students') : $t('docsearch_source_school') }}
                </span>
                <span>{{ formatDate(hit.createdAt) }}</span>
              </div>
            </div>
            <div class="flex gap-2 shrink-0">
              <router-link
                v-if="hit.fileId"
                :to="`/document/${hit.fileId}`"
                class="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm"
              >
                {{ $t('docsearch_open') }}
              </router-link>
              <router-link
                v-if="isStaff"
                :to="hit.editTo"
                class="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm"
              >
                {{ $t('Edit') }}
              </router-link>
            </div>
          </article>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from '@/utils/dayjs'
import { useLoadingStore } from '@/stores/loading'
import { isPublicModuleOpen } from '@/services/modules/windows'
import {
  displayCategoryName,
  emptyFilters,
  filterDocuments,
  loadSearchIndex,
  presetRange,
  type SearchCategory,
  type SearchFilters,
  type SearchableDoc,
  type SourceFilter
} from '@/services/documents/search'

const route = useRoute()
const router = useRouter()
const loadingStore = useLoadingStore()

const loading = ref(true)
const documents = ref<SearchableDoc[]>([])
const categories = ref<SearchCategory[]>([])
const failed = ref<string[]>([])
const filters = reactive<SearchFilters>(emptyFilters())

const locale = computed(() => loadingStore.language || 'hu')
const isStaff = computed(() =>
  loadingStore.userLoggedin && ['admin', 'editor'].includes(loadingStore.userRole)
)

const visibleCategories = computed(() =>
  categories.value
    .filter((cat) => {
      if (cat.archived) return false
      if (filters.source !== 'all' && cat.source !== filters.source) return false
      return true
    })
    .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), locale.value === 'rs' ? 'sr' : locale.value))
)

const hits = computed(() =>
  filterDocuments(documents.value, categories.value, filters, locale.value)
)

function categoryLabel(cat: SearchCategory): string {
  return displayCategoryName(cat, locale.value)
}

function formatDate(value: string): string {
  const lang = locale.value === 'rs' ? 'sr' : locale.value
  dayjs.locale(lang || 'hu')
  return dayjs(value).format('LL')
}

function applyPreset(kind: '30' | 'year' | 'last_year') {
  const range = presetRange(kind)
  filters.from = range.from
  filters.to = range.to
}

function resetFilters() {
  Object.assign(filters, emptyFilters())
}

function readQuery() {
  const q = route.query
  filters.query = typeof q.q === 'string' ? q.q : ''
  filters.categoryId = typeof q.cat === 'string' ? q.cat : ''
  filters.from = typeof q.from === 'string' ? q.from : ''
  filters.to = typeof q.to === 'string' ? q.to : ''
  filters.source = q.src === 'school' || q.src === 'students' ? (q.src as SourceFilter) : 'all'
}

let writingQuery = false

function writeQuery() {
  if (writingQuery) return
  const next: Record<string, string> = {}
  if (filters.query.trim()) next.q = filters.query.trim()
  if (filters.categoryId) next.cat = filters.categoryId
  if (filters.from) next.from = filters.from
  if (filters.to) next.to = filters.to
  if (filters.source !== 'all') next.src = filters.source

  const current = route.query
  const same =
    (current.q || '') === (next.q || '') &&
    (current.cat || '') === (next.cat || '') &&
    (current.from || '') === (next.from || '') &&
    (current.to || '') === (next.to || '') &&
    (current.src || '') === (next.src || '')
  if (same) return

  writingQuery = true
  router.replace({ path: '/documents/search', query: next }).finally(() => {
    writingQuery = false
  })
}

watch(
  () => filters.source,
  () => {
    if (filters.categoryId && !visibleCategories.value.some((cat) => cat.id === filters.categoryId)) {
      filters.categoryId = ''
    }
  }
)
watch(filters, writeQuery, { deep: true })
watch(() => route.query, readQuery)

const moduleOpen = ref(true)

onMounted(async () => {
  moduleOpen.value = await isPublicModuleOpen('document_search')
  if (!moduleOpen.value) {
    loading.value = false
    return
  }
  readQuery()
  try {
    const index = await loadSearchIndex()
    documents.value = index.documents
    categories.value = index.categories
    failed.value = index.failed
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}
.dark .label {
  color: #cbd5e1;
}
.field {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 0.8rem;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #1f2937;
}
.dark .field {
  border-color: #475569;
  background: #334155;
  color: #e2e8f0;
}
.chip {
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}
.dark .chip {
  background: #334155;
  border-color: #64748b;
  color: #e2e8f0;
}
.chip-reset {
  border-color: #fca5a5;
  color: #b91c1c;
}
</style>
