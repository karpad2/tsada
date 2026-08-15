<template>
  <section class="page-shell py-4">
    <div class="page-panel container">
      <div class="page-header-row">
        <div>
          <div class="inline-flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
              <i class="pi pi-images text-white text-lg"></i>
            </div>
            <h1 class="section-title !mb-0 !text-2xl">{{ $t('gal_approval_title') }}</h1>
          </div>
          <div class="section-accent"></div>
          <p class="page-subtitle">{{ $t('gal_approval_subtitle') }}</p>
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

      <div v-else-if="failed" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
        {{ $t('gal_approval_load_error') }}
      </div>

      <div v-else-if="albums.length === 0" class="text-center py-16 text-gray-400">
        <i class="pi pi-check-circle text-5xl mb-3 block text-emerald-400"></i>
        {{ $t('gal_approval_empty') }}
      </div>

      <div v-else class="space-y-6">
        <article
          v-for="album in albums"
          :key="album.id"
          class="glass rounded-2xl p-4 sm:p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ albumTitle(album, locale) }}
              </h2>
              <div class="mt-1 flex flex-wrap gap-2 text-xs">
                <span
                  class="px-2 py-0.5 rounded-full"
                  :class="album.visible
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'"
                >
                  {{ album.visible ? $t('visible') : $t('hidden') }}
                </span>
                <span v-if="album.pending.length" class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {{ album.pending.length }} {{ $t('pending') }}
                </span>
                <span v-if="album.deleteRequested.length" class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {{ album.deleteRequested.length }} {{ $t('delete_requested') }}
                </span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="album.pending.length"
                type="button"
                class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm"
                @click="approveAll(album)"
              >
                {{ $t('approve_all') }}
              </button>
              <button
                v-if="album.pending.length && !album.visible"
                type="button"
                class="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm"
                @click="approveAndPublish(album)"
              >
                {{ $t('gal_approve_and_publish') }}
              </button>
              <router-link
                :to="`/admin/gallery-edit/${album.id}`"
                class="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-sm"
              >
                {{ $t('Edit') }}
              </router-link>
            </div>
          </div>

          <div v-if="album.pending.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div v-for="image in album.pending" :key="image.id" class="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-slate-800/50">
              <img :src="image.preview" alt="" class="w-full aspect-[4/3] object-cover" />
              <div class="p-2 flex gap-1">
                <button type="button" class="flex-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs" @click="approveOne(album, image)">
                  {{ $t('approve') }}
                </button>
                <button type="button" class="flex-1 px-2 py-1 bg-rose-600 text-white rounded text-xs" @click="rejectOne(album, image)">
                  {{ $t('reject') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="album.deleteRequested.length" class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div v-for="image in album.deleteRequested" :key="image.id" class="rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800">
              <img :src="image.preview" alt="" class="w-full aspect-[4/3] object-cover opacity-70" />
              <div class="p-2 flex gap-1">
                <button type="button" class="flex-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs" @click="restoreOne(album, image)">
                  {{ $t('restore') }}
                </button>
                <button type="button" class="flex-1 px-2 py-1 bg-rose-600 text-white rounded text-xs" @click="rejectOne(album, image)">
                  {{ $t('delete') }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLoadingStore } from '@/stores/loading'
import {
  albumTitle,
  approveAlbumImages,
  loadApprovalQueue,
  publishAlbum,
  rejectImage,
  setImageStatus,
  type ApprovalAlbum,
  type PendingImage
} from '@/services/gallery/approval'

const { t } = useI18n()
const loadingStore = useLoadingStore()
const locale = computed(() => loadingStore.language || 'hu')

const loading = ref(true)
const failed = ref(false)
const albums = ref<ApprovalAlbum[]>([])
const busy = ref(false)

async function refresh() {
  loading.value = true
  const result = await loadApprovalQueue()
  albums.value = result.albums
  failed.value = result.failed
  loading.value = false
}

function removeImage(album: ApprovalAlbum, imageId: string) {
  album.pending = album.pending.filter((item) => item.id !== imageId)
  album.deleteRequested = album.deleteRequested.filter((item) => item.id !== imageId)
  if (!album.pending.length && !album.deleteRequested.length) {
    albums.value = albums.value.filter((item) => item.id !== album.id)
  }
}

async function approveOne(album: ApprovalAlbum, image: PendingImage) {
  if (busy.value) return
  busy.value = true
  try {
    await setImageStatus(image.id, 'approved')
    if (!album.defaultImage) album.defaultImage = image.imageId
    removeImage(album, image.id)
  } catch {
    alert(t('error_approving_image'))
  } finally {
    busy.value = false
  }
}

async function restoreOne(album: ApprovalAlbum, image: PendingImage) {
  if (busy.value) return
  busy.value = true
  try {
    await setImageStatus(image.id, 'approved')
    removeImage(album, image.id)
  } catch {
    alert(t('error_approving_image'))
  } finally {
    busy.value = false
  }
}

async function rejectOne(album: ApprovalAlbum, image: PendingImage) {
  if (!confirm(t('confirm_reject_image'))) return
  if (busy.value) return
  busy.value = true
  try {
    await rejectImage(image.id, image.imageId)
    removeImage(album, image.id)
  } catch {
    alert(t('error_deleting_gallery'))
  } finally {
    busy.value = false
  }
}

async function approveAll(album: ApprovalAlbum) {
  if (busy.value) return
  busy.value = true
  try {
    await approveAlbumImages(album)
    if (!album.defaultImage && album.pending[0]) album.defaultImage = album.pending[0].imageId
    album.pending = []
    if (!album.deleteRequested.length) {
      albums.value = albums.value.filter((item) => item.id !== album.id)
    }
  } catch {
    alert(t('error_approving_image'))
  } finally {
    busy.value = false
  }
}

async function approveAndPublish(album: ApprovalAlbum) {
  if (busy.value) return
  busy.value = true
  try {
    const first = album.pending[0]?.imageId
    await approveAlbumImages(album)
    await publishAlbum(album, first)
    album.visible = true
    album.pending = []
    if (!album.deleteRequested.length) {
      albums.value = albums.value.filter((item) => item.id !== album.id)
    }
  } catch {
    alert(t('gal_approval_publish_error'))
  } finally {
    busy.value = false
  }
}

onMounted(refresh)
</script>
