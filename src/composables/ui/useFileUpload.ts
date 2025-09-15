import { ref, computed } from 'vue'
import { storageService, type UploadOptions, type FileInfo } from '@/services'
import { trackUserInteraction, trackError } from '@/utils/analytics'

export interface UseFileUploadOptions extends UploadOptions {
  multiple?: boolean
  autoUpload?: boolean
  trackAnalytics?: boolean
}

export interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadedFiles: FileInfo[]
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    multiple = false,
    autoUpload = false,
    trackAnalytics = true,
    ...uploadOptions
  } = options

  // State
  const selectedFiles = ref<File[]>([])
  const isUploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)
  const uploadedFiles = ref<FileInfo[]>([])

  // Computed
  const hasFiles = computed(() => selectedFiles.value.length > 0)
  const canUpload = computed(() => hasFiles.value && !isUploading.value)
  const uploadState = computed<UploadState>(() => ({
    isUploading: isUploading.value,
    progress: progress.value,
    error: error.value,
    uploadedFiles: uploadedFiles.value
  }))

  // File validation
  const validateFiles = (files: File[]): string | null => {
    if (!multiple && files.length > 1) {
      return 'Only one file is allowed'
    }

    if (uploadOptions.maxSize) {
      const oversizedFile = files.find(file => file.size > uploadOptions.maxSize!)
      if (oversizedFile) {
        return `File "${oversizedFile.name}" exceeds maximum size limit`
      }
    }

    if (uploadOptions.allowedTypes) {
      const invalidFile = files.find(file => !uploadOptions.allowedTypes!.includes(file.type))
      if (invalidFile) {
        return `File type "${invalidFile.type}" is not allowed`
      }
    }

    if (uploadOptions.allowedExtensions) {
      const invalidFile = files.find(file => {
        const extension = file.name.split('.').pop()?.toLowerCase()
        return !extension || !uploadOptions.allowedExtensions!.includes(extension)
      })
      if (invalidFile) {
        return `File extension not allowed for "${invalidFile.name}"`
      }
    }

    return null
  }

  // Methods
  const selectFiles = (files: File[]) => {
    error.value = null

    const validationError = validateFiles(files)
    if (validationError) {
      error.value = validationError
      return false
    }

    selectedFiles.value = files

    if (trackAnalytics) {
      trackUserInteraction('files_selected', 'file_input', {
        file_count: files.length,
        file_types: files.map(f => f.type),
        total_size: files.reduce((sum, f) => sum + f.size, 0)
      })
    }

    if (autoUpload) {
      uploadFiles()
    }

    return true
  }

  const clearFiles = () => {
    selectedFiles.value = []
    error.value = null
    progress.value = 0
  }

  const uploadFiles = async () => {
    if (!canUpload.value) return

    isUploading.value = true
    error.value = null
    progress.value = 0

    try {
      const uploadOptionsWithProgress: UploadOptions = {
        ...uploadOptions,
        onProgress: (progressValue: number) => {
          progress.value = progressValue
          if (uploadOptions.onProgress) {
            uploadOptions.onProgress(progressValue)
          }
        }
      }

      if (selectedFiles.value.length === 1) {
        // Single file upload
        const result = await storageService.uploadFile(
          selectedFiles.value[0],
          uploadOptionsWithProgress
        )

        if (result.success && result.file) {
          const fileInfo = await storageService.getFileInfo(result.file.id)
          if (fileInfo) {
            uploadedFiles.value.push(fileInfo)
          }
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } else {
        // Multiple file upload
        const result = await storageService.uploadMultipleFiles(
          selectedFiles.value,
          uploadOptionsWithProgress
        )

        for (const uploadResult of result.results) {
          if (uploadResult.success && uploadResult.file) {
            const fileInfo = await storageService.getFileInfo(uploadResult.file.id)
            if (fileInfo) {
              uploadedFiles.value.push(fileInfo)
            }
          }
        }

        if (result.errorCount > 0) {
          const errors = result.results
            .filter(r => !r.success)
            .map(r => r.error)
            .join(', ')
          throw new Error(`${result.errorCount} files failed to upload: ${errors}`)
        }
      }

      // Clear selected files after successful upload
      clearFiles()

      if (trackAnalytics) {
        trackUserInteraction('files_uploaded', 'upload_button', {
          file_count: uploadedFiles.value.length,
          success: true
        })
      }
    } catch (err: any) {
      error.value = err.message || 'Upload failed'

      if (trackAnalytics) {
        trackError('file_upload_error', err.message, 'useFileUpload')
      }
    } finally {
      isUploading.value = false
      progress.value = 0
    }
  }

  const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1)

    if (trackAnalytics) {
      trackUserInteraction('file_removed', 'remove_button', {
        remaining_files: selectedFiles.value.length
      })
    }
  }

  const deleteUploadedFile = async (fileId: string) => {
    try {
      const result = await storageService.deleteFile(fileId, uploadOptions.bucketId)

      if (result.success) {
        uploadedFiles.value = uploadedFiles.value.filter(file => file.id !== fileId)

        if (trackAnalytics) {
          trackUserInteraction('uploaded_file_deleted', 'delete_button', {
            file_id: fileId
          })
        }

        return true
      } else {
        throw new Error(result.error || 'Delete failed')
      }
    } catch (err: any) {
      error.value = err.message || 'Delete failed'

      if (trackAnalytics) {
        trackError('file_delete_error', err.message, 'useFileUpload')
      }

      return false
    }
  }

  const resetUploadState = () => {
    selectedFiles.value = []
    uploadedFiles.value = []
    isUploading.value = false
    progress.value = 0
    error.value = null
  }

  // Helper methods
  const getFileIcon = (file: File | FileInfo): string => {
    const type = 'type' in file ? file.type : file.name.split('.').pop()?.toLowerCase() || ''

    if (type.includes('image')) return 'mdi-image'
    if (type.includes('pdf')) return 'mdi-file-pdf-box'
    if (type.includes('word')) return 'mdi-file-word'
    if (type.includes('text')) return 'mdi-file-document'
    if (type.includes('video')) return 'mdi-video'
    if (type.includes('audio')) return 'mdi-music'

    return 'mdi-file'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFilePreviewUrl = (file: FileInfo): string => {
    return file.previewUrl || file.url
  }

  const downloadFile = (file: FileInfo) => {
    window.open(file.downloadUrl, '_blank')

    if (trackAnalytics) {
      trackUserInteraction('file_downloaded', 'download_button', {
        file_id: file.id,
        file_type: file.type
      })
    }
  }

  return {
    // State
    selectedFiles,
    uploadedFiles,
    isUploading,
    progress,
    error,

    // Computed
    hasFiles,
    canUpload,
    uploadState,

    // Methods
    selectFiles,
    clearFiles,
    uploadFiles,
    removeFile,
    deleteUploadedFile,
    resetUploadState,

    // Helpers
    getFileIcon,
    formatFileSize,
    getFilePreviewUrl,
    downloadFile,
    validateFiles
  }
}