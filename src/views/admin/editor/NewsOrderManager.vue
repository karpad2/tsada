<template>
  <div class="page-shell">
  <div class="page-panel container">
    <!-- Header -->
    <div class="page-header-row">
      <div>
        <h1 class="section-title !text-2xl sm:!text-3xl">
          {{ $t('news_order_manager') }}
        </h1>
        <div class="section-accent"></div>
        <p class="page-subtitle">
          {{ $t('news_order_description') }}
        </p>
      </div>
      <div class="flex gap-3 mt-4 lg:mt-0">
        <v-btn color="primary" @click="saveOrder" :loading="saving" :disabled="!hasChanges">
          <v-icon left>mdi-content-save</v-icon>
          {{ $t('save_order') }}
        </v-btn>
        <v-btn @click="$router.go(-1)" variant="outlined">
          {{ $t('goback') }}
        </v-btn>
      </div>
    </div>

    <!-- Info banner -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6 flex items-start gap-3">
      <svg class="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div class="text-sm text-amber-800 dark:text-amber-200">
        <strong>{{ $t('pinned_news_info_title') }}</strong>
        <p class="mt-1">{{ $t('pinned_news_info_desc') }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-2 border-sky-500 border-t-transparent"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Pinned / Featured news -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ $t('pinned_news') }}
          </h2>
          <span class="glass-badge text-xs px-2 py-0.5 rounded-full">
            {{ pinnedItems.length }}
          </span>
        </div>

        <draggable
          v-model="pinnedItems"
          group="news"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost-card"
          animation="200"
          class="space-y-2 min-h-[100px] bg-sky-50/50 dark:bg-sky-900/10 rounded-xl p-3 border-2 border-dashed border-sky-200 dark:border-sky-800"
          @change="onOrderChange"
        >
          <template #item="{ element, index }">
            <div
              class="flex items-center gap-3 glass-card rounded-lg p-3 border border-sky-200 dark:border-sky-700 hover:shadow-md transition-shadow cursor-default"
            >
              <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                </svg>
              </div>

              <span class="text-sm font-bold text-sky-500 w-6 text-center">{{ index + 1 }}</span>

              <img
                v-if="element.img"
                :src="element.img"
                :alt="element.title"
                class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                @error="handleImageError"
              />
              <div v-else class="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ element.title || $t('no_title') }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(element.createdAt) }}
                  <span v-if="!element.visible" class="ml-1 text-yellow-600">- {{ $t('invisible') }}</span>
                </p>
              </div>

              <v-btn
                size="x-small"
                variant="text"
                color="primary"
                @click="unpinItem(element)"
                :title="$t('unpin_news')"
              >
                <v-icon>mdi-pin-off</v-icon>
              </v-btn>

              <v-btn
                size="x-small"
                variant="text"
                @click="openEditor(element)"
                :title="$t('edit')"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
          </template>
        </draggable>

        <div v-if="pinnedItems.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
          </svg>
          <p class="text-sm">{{ $t('no_pinned_news') }}</p>
          <p class="text-xs mt-1">{{ $t('drag_to_pin') }}</p>
        </div>
      </div>

      <!-- Regular news -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ $t('regular_news') }}
          </h2>
          <span class="bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs px-2 py-0.5 rounded-full">
            {{ regularItems.length }}
          </span>
        </div>

        <!-- Search -->
        <div class="relative mb-3">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_content')"
            class="w-full px-4 py-2 pl-10 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <draggable
          v-model="regularItems"
          group="news"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost-card"
          animation="200"
          class="space-y-2 min-h-[100px] bg-sky-50/50 dark:bg-sky-900/10 rounded-xl p-3 border-2 border-dashed border-sky-200 dark:border-sky-800 max-h-[600px] overflow-y-auto"
          @change="onOrderChange"
        >
          <template #item="{ element }">
            <div
              v-show="matchesSearch(element)"
              class="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-default"
            >
              <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                </svg>
              </div>

              <img
                v-if="element.img"
                :src="element.img"
                :alt="element.title"
                class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                @error="handleImageError"
              />
              <div v-else class="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ element.title || $t('no_title') }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(element.createdAt) }}
                  <span v-if="!element.visible" class="ml-1 text-yellow-600">- {{ $t('invisible') }}</span>
                </p>
              </div>

              <v-btn
                size="x-small"
                variant="text"
                color="primary"
                @click="pinItem(element)"
                :title="$t('pin_news')"
              >
                <v-icon>mdi-pin</v-icon>
              </v-btn>

              <v-btn
                size="x-small"
                variant="text"
                @click="openEditor(element)"
                :title="$t('edit')"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Databases, Query, Storage } from 'appwrite'
import { appw, config } from '@/appwrite'
import { useLoadingStore } from '@/stores/loading'
import { pickLocalized } from '@/utils/localizedText'
import draggable from 'vuedraggable'

interface NewsItem {
  id: string
  title: string
  img: string
  visible: boolean
  pinned: boolean
  sort_order: number
  createdAt: string
}

export default defineComponent({
  name: 'NewsOrderManager',
  components: { draggable },
  setup() {
    const router = useRouter()
    const loadingStore = useLoadingStore()
    const database = new Databases(appw)
    const storage = new Storage(appw)

    const loading = ref(true)
    const saving = ref(false)
    const hasChanges = ref(false)
    const searchQuery = ref('')
    const snackbar = ref(false)
    const snackbarText = ref('')
    const snackbarColor = ref('success')

    const pinnedItems = ref<NewsItem[]>([])
    const regularItems = ref<NewsItem[]>([])

    const loadNews = async () => {
      loading.value = true
      try {
        const lang = loadingStore.language
        const allItems: NewsItem[] = []
        let offset = 0
        const limit = 100
        let hasMore = true

        while (hasMore) {
          const { documents } = await database.listDocuments(
            config.website_db,
            config.about_us_db,
            [
              Query.equal('type', 'news'),
              Query.or([Query.isNull('notNews'), Query.equal('notNews', false)]),
              Query.limit(limit),
              Query.offset(offset),
              Query.orderDesc('$createdAt'),
              Query.select([
                'title_hu', 'title_en', 'title_rs',
                '$id', 'default_image', 'visible',
                'pinned', 'sort_order',
                '$createdAt'
              ])
            ]
          )

          for (const doc of documents) {
            const title = pickLocalized(doc, ['title'], lang)

            allItems.push({
              id: doc.$id,
              title: title || '',
              img: doc.default_image
                ? storage.getFilePreview(config.website_images, doc.default_image, 100, 100, 'center', 80, 0, 'FFFFFF', 0, 0, 0, 'FFFFFF', 'webp').toString()
                : '',
              visible: doc.visible || false,
              pinned: doc.pinned || false,
              sort_order: doc.sort_order || 0,
              createdAt: doc.$createdAt
            })
          }

          if (documents.length < limit) hasMore = false
          else offset += limit
        }

        // Split into pinned and regular
        const pinned = allItems.filter(item => item.pinned)
        const regular = allItems.filter(item => !item.pinned)

        // Sort pinned by sort_order (ascending)
        pinned.sort((a, b) => a.sort_order - b.sort_order)

        pinnedItems.value = pinned
        regularItems.value = regular
      } catch (error) {
        console.error('Failed to load news:', error)
        showSnackbar('Failed to load news', 'error')
      } finally {
        loading.value = false
      }
    }

    const saveOrder = async () => {
      saving.value = true
      try {
        const updates: Promise<any>[] = []

        // Update pinned items with their order
        pinnedItems.value.forEach((item, index) => {
          updates.push(
            database.updateDocument(config.website_db, config.about_us_db, item.id, {
              pinned: true,
              sort_order: index + 1
            })
          )
        })

        // Update regular items (unpin them, reset order)
        regularItems.value.forEach((item) => {
          if (item.pinned || item.sort_order !== 0) {
            updates.push(
              database.updateDocument(config.website_db, config.about_us_db, item.id, {
                pinned: false,
                sort_order: 0
              })
            )
          }
        })

        await Promise.all(updates)
        hasChanges.value = false
        showSnackbar('order_saved_successfully', 'success')
      } catch (error) {
        console.error('Failed to save order:', error)
        showSnackbar('save_order_failed', 'error')
      } finally {
        saving.value = false
      }
    }

    const pinItem = (item: NewsItem) => {
      const idx = regularItems.value.findIndex(i => i.id === item.id)
      if (idx !== -1) {
        regularItems.value.splice(idx, 1)
        item.pinned = true
        item.sort_order = pinnedItems.value.length + 1
        pinnedItems.value.push(item)
        hasChanges.value = true
      }
    }

    const unpinItem = (item: NewsItem) => {
      const idx = pinnedItems.value.findIndex(i => i.id === item.id)
      if (idx !== -1) {
        pinnedItems.value.splice(idx, 1)
        item.pinned = false
        item.sort_order = 0
        regularItems.value.unshift(item)
        hasChanges.value = true
      }
    }

    const onOrderChange = () => {
      hasChanges.value = true
    }

    const openEditor = (item: NewsItem) => {
      router.push(`/admin/edit/news/${item.id}`)
    }

    const matchesSearch = (item: NewsItem) => {
      if (!searchQuery.value) return true
      return item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleDateString()
    }

    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement
      img.style.display = 'none'
    }

    const showSnackbar = (text: string, color: string) => {
      snackbarText.value = text
      snackbarColor.value = color
      snackbar.value = true
    }

    onMounted(() => {
      loadNews()
    })

    return {
      loading,
      saving,
      hasChanges,
      searchQuery,
      pinnedItems,
      regularItems,
      snackbar,
      snackbarText,
      snackbarColor,
      loadNews,
      saveOrder,
      pinItem,
      unpinItem,
      onOrderChange,
      openEditor,
      matchesSearch,
      formatDate,
      handleImageError
    }
  }
})
</script>

<style scoped>
.ghost-card {
  opacity: 0.4;
  background: #fef3c7 !important;
  border: 2px dashed #f59e0b !important;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
