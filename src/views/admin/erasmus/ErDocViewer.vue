<template>
  <div class="page-shell">
    <div class="page-panel container !min-h-0" style="height: calc(100vh - 3rem);">
      <div v-if="loading" class="page-state">
        <div class="page-spinner mx-auto mb-3"></div>
        <p>{{ $t('loading') }}...</p>
      </div>
      <div v-else-if="error" class="page-state">
        <h3 class="page-state-title">{{ $t('erasmus_pdf_missing') }}</h3>
        <a v-if="downloadUrl" class="text-sky-600 underline" :href="downloadUrl" target="_blank" rel="noopener">
          {{ $t('erasmus_download_pdf') }}
        </a>
      </div>
      <iframe v-else class="h-full w-full rounded-xl" :src="pdf_file" title="Erasmus document"></iframe>
    </div>
  </div>
</template>

<script>
import { Storage } from 'appwrite'
import { appw, config } from '@/appwrite'
import { asViewUrl } from '@/services/erasmus/upload'

const storage = new Storage(appw)

export default {
  name: 'ErDocViewer',
  data() {
    return {
      pdf_file: '',
      downloadUrl: '',
      loading: true,
      error: false
    }
  },
  mounted() {
    this.loadpdf()
  },
  methods: {
    fileId() {
      const id = this.$route.params.id
      return Array.isArray(id) ? id[0] : id
    },
    async loadpdf() {
      const id = this.fileId()
      if (!id) {
        this.error = true
        this.loading = false
        return
      }
      try {
        this.pdf_file = asViewUrl(storage.getFileView({
          bucketId: config.fs_erasmus,
          fileId: id
        }))
        this.downloadUrl = asViewUrl(storage.getFileDownload({
          bucketId: config.fs_erasmus,
          fileId: id
        }))
        this.error = !this.pdf_file
      } catch (error) {
        console.error('Failed to open Erasmus document:', error)
        this.error = true
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
