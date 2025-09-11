<template>
  <div class="pdf-viewer-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ $t('loading') }}...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-overlay">
      <div class="error-content">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <h3 class="error-title">{{ $t('error_loading_document') }}</h3>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <button @click="retryLoad" class="retry-btn">
            <i class="pi pi-refresh"></i>
            {{ $t('retry') }}
          </button>
          <button @click="goBack" class="back-btn">
            <i class="pi pi-arrow-left"></i>
            {{ $t('go_back') }}
          </button>
        </div>
      </div>
    </div>

    <!-- PDF Viewer -->
    <div v-else class="pdf-container">
      <!-- Toolbar -->
      <div class="pdf-toolbar">
        <div class="toolbar-left">
          <button @click="goBack" class="toolbar-btn" :title="$t('go_back')">
            <i class="pi pi-arrow-left"></i>
          </button>
          <span class="document-title">{{ documentTitle }}</span>
        </div>
        
        <div class="toolbar-right">
          <button @click="openInNewTab" class="toolbar-btn" :title="$t('open_in_new_tab')">
            <i class="pi pi-external-link"></i>
          </button>
          <button @click="downloadFile" class="toolbar-btn" :title="$t('download')">
            <i class="pi pi-download"></i>
          </button>
          <button @click="toggleFullscreen" class="toolbar-btn" :title="$t('fullscreen')">
            <i class="pi pi-window-maximize" v-if="!isFullscreen"></i>
            <i class="pi pi-window-minimize" v-else></i>
          </button>
        </div>
      </div>

      <!-- PDF Iframe -->
      <iframe 
        ref="pdfFrame"
        :src="pdfUrl" 
        class="pdf-iframe"
        frameborder="0"
        @load="onFrameLoad"
        @error="onFrameError"
      ></iframe>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Storage, Databases, Query } from 'appwrite'
import { appw, config } from '@/appwrite'

interface DocumentInfo {
title: string
filename: string
size: number
}

export default {
name: 'PDFViewer',

setup() {
  const route = useRoute()
  const router = useRouter()
  
  // Reactive state
  const loading = ref(true)
  const error = ref(false)
  const errorMessage = ref('')
  const pdfUrl = ref('')
  const documentTitle = ref('Document')
  const documentInfo = ref<DocumentInfo | null>(null)
  const isFullscreen = ref(false)
  const pdfFrame = ref<HTMLIFrameElement | null>(null)
  
  // Methods
  const loadDocument = async (): Promise<void> => {
    const documentId = route.params.id as string
    
    if (!documentId) {
      error.value = true
      errorMessage.value = 'No document ID provided'
      loading.value = false
      return
    }

    try {
      loading.value = true
      error.value = false
      
      const storage = new Storage(appw)
      
      // Get file view URL
      const fileView = await storage.getFileView(config.documents_storage, documentId)
      pdfUrl.value = fileView.href
      
      // Try to get document metadata for better title
      try {
        const file = await storage.getFile(config.documents_storage, documentId)
        documentInfo.value = {
          title: file.name || 'Document',
          filename: file.name || 'document.pdf',
          size: file.sizeOriginal || 0
        }
        documentTitle.value = file.name || 'Document'
      } catch (metaError) {
        console.warn('Could not load document metadata:', metaError)
        documentTitle.value = 'Document'
      }
      
      console.log('Successfully loaded PDF:', pdfUrl.value)
      
    } catch (loadError: any) {
      console.error('Failed to load document:', loadError)
      error.value = true
      
      // Better error messages based on error type
      if (loadError.code === 404) {
        errorMessage.value = 'Document not found'
      } else if (loadError.code === 401) {
        errorMessage.value = 'Access denied to this document'
      } else {
        errorMessage.value = loadError.message || 'Unknown error occurred'
      }
    } finally {
      loading.value = false
    }
  }

  const retryLoad = async (): Promise<void> => {
    await loadDocument()
  }

  const goBack = (): void => {
    router.go(-1)
  }

  const openInNewTab = (): void => {
    if (pdfUrl.value) {
      window.open(pdfUrl.value, '_blank')
    }
  }

  const downloadFile = (): void => {
    if (pdfUrl.value && documentInfo.value) {
      const link = document.createElement('a')
      link.href = pdfUrl.value
      link.download = documentInfo.value.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const toggleFullscreen = (): void => {
    const container = document.querySelector('.pdf-viewer-container') as HTMLElement
    
    if (!isFullscreen.value) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen()
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen()
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      }
    }
  }

  const onFrameLoad = (): void => {
    console.log('PDF iframe loaded successfully')
  }

  const onFrameError = (): void => {
    console.error('PDF iframe failed to load')
    error.value = true
    errorMessage.value = 'Failed to load PDF viewer'
    loading.value = false
  }

  const handleFullscreenChange = (): void => {
    isFullscreen.value = !!document.fullscreenElement
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    // ESC key to exit fullscreen
    if (event.key === 'Escape' && isFullscreen.value) {
      toggleFullscreen()
    }
    // F11 key to toggle fullscreen
    if (event.key === 'F11') {
      event.preventDefault()
      toggleFullscreen()
    }
  }

  // Lifecycle
  onMounted(async () => {
    await loadDocument()
    
    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    // Remove event listeners
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    loading,
    error,
    errorMessage,
    pdfUrl,
    documentTitle,
    documentInfo,
    isFullscreen,
    pdfFrame,
    retryLoad,
    goBack,
    openInNewTab,
    downloadFile,
    toggleFullscreen,
    onFrameLoad,
    onFrameError
  }
}
}
</script>

<style scoped>
.pdf-viewer-container {
width: 100%;
height: 100vh;
display: flex;
flex-direction: column;
background: #f5f5f5;
position: relative;
}

.loading-overlay,
.error-overlay {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
display: flex;
align-items: center;
justify-content: center;
background: rgba(255, 255, 255, 0.95);
z-index: 1000;
}

.loading-content,
.error-content {
text-align: center;
padding: 2rem;
max-width: 400px;
}

.loading-spinner {
width: 48px;
height: 48px;
border: 4px solid #e5e7eb;
border-top: 4px solid #3b82f6;
border-radius: 50%;
animation: spin 1s linear infinite;
margin: 0 auto 1rem;
}

@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}

.loading-text {
font-size: 1.1rem;
color: #6b7280;
margin: 0;
}

.error-icon {
font-size: 3rem;
color: #ef4444;
margin-bottom: 1rem;
}

.error-title {
font-size: 1.5rem;
font-weight: 600;
color: #111827;
margin: 0 0 0.5rem;
}

.error-message {
color: #6b7280;
margin-bottom: 1.5rem;
}

.error-actions {
display: flex;
gap: 0.75rem;
justify-content: center;
}

.retry-btn,
.back-btn {
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.75rem 1.5rem;
border: none;
border-radius: 0.5rem;
font-weight: 500;
cursor: pointer;
transition: all 0.2s;
}

.retry-btn {
background: #3b82f6;
color: white;
}

.retry-btn:hover {
background: #2563eb;
}

.back-btn {
background: #e5e7eb;
color: #374151;
}

.back-btn:hover {
background: #d1d5db;
}

.pdf-container {
display: flex;
flex-direction: column;
height: 100%;
}

.pdf-toolbar {
display: flex;
justify-content: space-between;
align-items: center;
padding: 0.75rem 1rem;
background: white;
border-bottom: 1px solid #e5e7eb;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-left,
.toolbar-right {
display: flex;
align-items: center;
gap: 0.75rem;
}

.document-title {
font-weight: 500;
color: #111827;
max-width: 300px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}

.toolbar-btn {
display: flex;
align-items: center;
justify-content: center;
width: 36px;
height: 36px;
border: none;
border-radius: 0.375rem;
background: transparent;
color: #6b7280;
cursor: pointer;
transition: all 0.2s;
}

.toolbar-btn:hover {
background: #f3f4f6;
color: #374151;
}

.pdf-iframe {
flex: 1;
width: 100%;
border: none;
background: white;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
.pdf-viewer-container {
  background: #1f2937;
}

.pdf-toolbar {
  background: #374151;
  border-color: #4b5563;
}

.document-title {
  color: #f9fafb;
}

.toolbar-btn {
  color: #d1d5db;
}

.toolbar-btn:hover {
  background: #4b5563;
  color: #f9fafb;
}

.loading-text {
  color: #d1d5db;
}

.error-title {
  color: #f9fafb;
}

.error-message {
  color: #d1d5db;
}
}

/* Responsive design */
@media (max-width: 768px) {
.pdf-toolbar {
  padding: 0.5rem;
}

.document-title {
  max-width: 150px;
  font-size: 0.875rem;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
}

.error-actions {
  flex-direction: column;
}

.retry-btn,
.back-btn {
  width: 100%;
  justify-content: center;
}
}

/* Fullscreen styles */
.pdf-viewer-container:fullscreen {
background: #000;
}

.pdf-viewer-container:fullscreen .pdf-toolbar {
background: rgba(0, 0, 0, 0.8);
border-color: rgba(255, 255, 255, 0.1);
}

.pdf-viewer-container:fullscreen .document-title {
color: white;
}

.pdf-viewer-container:fullscreen .toolbar-btn {
color: #d1d5db;
}

.pdf-viewer-container:fullscreen .toolbar-btn:hover {
background: rgba(255, 255, 255, 0.1);
color: white;
}
</style>