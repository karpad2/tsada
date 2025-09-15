import { Storage, ID } from 'appwrite'
import { appw, config } from '@/appwrite'
import { ValidationService } from '../validation/ValidationService'
import { trackFileUpload, trackError } from '@/utils/analytics'

export interface UploadOptions {
  bucketId?: string
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
  generateThumbnail?: boolean
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  success: boolean
  file?: {
    id: string
    name: string
    size: number
    type: string
    url: string
  }
  error?: string
}

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  url: string
  previewUrl?: string
  downloadUrl: string
  createdAt: string
}

/**
 * Universal storage service for file management
 */
export class StorageService {
  private storage: Storage
  private validationService: ValidationService

  constructor() {
    this.storage = new Storage(appw)
    this.validationService = ValidationService.getInstance()
  }

  /**
   * Upload single file with validation
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const startTime = performance.now()

    try {
      // Validate file
      const validation = this.validationService.validateFile(file, {
        maxSize: options.maxSize,
        allowedTypes: options.allowedTypes,
        allowedExtensions: options.allowedExtensions
      })

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        }
      }

      const bucketId = options.bucketId || config.website_images
      const fileId = ID.unique()

      // Upload file with progress tracking
      let uploadProgress = 0
      const uploadPromise = this.storage.createFile(bucketId, fileId, file)

      // Mock progress for now (Appwrite doesn't support upload progress yet)
      if (options.onProgress) {
        const progressInterval = setInterval(() => {
          uploadProgress += Math.random() * 20
          if (uploadProgress >= 90) {
            clearInterval(progressInterval)
            return
          }
          options.onProgress!(Math.min(uploadProgress, 90))
        }, 100)

        uploadPromise.finally(() => {
          clearInterval(progressInterval)
          options.onProgress!(100)
        })
      }

      const response = await uploadPromise
      const uploadDuration = performance.now() - startTime

      // Track successful upload
      trackFileUpload(file.type, file.size, uploadDuration)

      return {
        success: true,
        file: {
          id: response.$id,
          name: response.name,
          size: response.sizeOriginal,
          type: file.type,
          url: this.getFileUrl(response.$id, bucketId)
        }
      }
    } catch (error: any) {
      trackError('file_upload_error', error.message, 'StorageService')

      return {
        success: false,
        error: error.message || 'Upload failed'
      }
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<{ results: UploadResult[], successCount: number, errorCount: number }> {
    const results: UploadResult[] = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Update progress for multiple files
      const baseProgress = (i / files.length) * 100
      const fileProgress = (progress: number) => {
        if (options.onProgress) {
          options.onProgress(baseProgress + (progress / files.length))
        }
      }

      const result = await this.uploadFile(file, {
        ...options,
        onProgress: fileProgress
      })

      results.push(result)

      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }

    return { results, successCount, errorCount }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId: string, bucketId?: string): Promise<{ success: boolean, error?: string }> {
    try {
      await this.storage.deleteFile(bucketId || config.website_images, fileId)
      return { success: true }
    } catch (error: any) {
      trackError('file_delete_error', error.message, 'StorageService')
      return {
        success: false,
        error: error.message || 'Delete failed'
      }
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string, bucketId?: string): Promise<FileInfo | null> {
    try {
      const bucket = bucketId || config.website_images
      const file = await this.storage.getFile(bucket, fileId)

      return {
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        type: file.mimeType,
        url: this.getFileUrl(fileId, bucket),
        previewUrl: this.getFilePreview(fileId, bucket),
        downloadUrl: this.getFileDownload(fileId, bucket),
        createdAt: file.$createdAt
      }
    } catch (error: any) {
      trackError('file_info_error', error.message, 'StorageService')
      return null
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(fileId: string, bucketId?: string): string {
    return this.storage.getFileView(bucketId || config.website_images, fileId).toString()
  }

  /**
   * Get file preview URL (for images)
   */
  getFilePreview(
    fileId: string,
    bucketId?: string,
    width = 400,
    height = 300,
    gravity: 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right' = 'center',
    quality = 100
  ): string {
    return this.storage.getFilePreview(
      bucketId || config.website_images,
      fileId,
      width,
      height,
      gravity,
      quality
    ).toString()
  }

  /**
   * Get file download URL
   */
  getFileDownload(fileId: string, bucketId?: string): string {
    return this.storage.getFileDownload(bucketId || config.website_images, fileId).toString()
  }

  /**
   * List files in bucket
   */
  async listFiles(bucketId?: string, limit = 100): Promise<{ success: boolean, files?: FileInfo[], error?: string }> {
    try {
      const response = await this.storage.listFiles(bucketId || config.website_images, [], limit)

      const files = response.files.map(file => ({
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        type: file.mimeType,
        url: this.getFileUrl(file.$id, bucketId),
        previewUrl: this.getFilePreview(file.$id, bucketId),
        downloadUrl: this.getFileDownload(file.$id, bucketId),
        createdAt: file.$createdAt
      }))

      return {
        success: true,
        files
      }
    } catch (error: any) {
      trackError('list_files_error', error.message, 'StorageService')
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(bucketId?: string): Promise<{ success: boolean, stats?: { fileCount: number, totalSize: number }, error?: string }> {
    try {
      const result = await this.listFiles(bucketId, 1000)

      if (!result.success || !result.files) {
        return {
          success: false,
          error: result.error || 'Failed to get files'
        }
      }

      const fileCount = result.files.length
      const totalSize = result.files.reduce((sum, file) => sum + file.size, 0)

      return {
        success: true,
        stats: { fileCount, totalSize }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Clean up orphaned files (files not referenced in database)
   */
  async cleanupOrphanedFiles(
    bucketId?: string,
    referencedFileIds: string[] = []
  ): Promise<{ success: boolean, deletedCount?: number, error?: string }> {
    try {
      const result = await this.listFiles(bucketId)

      if (!result.success || !result.files) {
        return {
          success: false,
          error: result.error || 'Failed to get files'
        }
      }

      const orphanedFiles = result.files.filter(file => !referencedFileIds.includes(file.id))
      let deletedCount = 0

      for (const file of orphanedFiles) {
        const deleteResult = await this.deleteFile(file.id, bucketId)
        if (deleteResult.success) {
          deletedCount++
        }
      }

      return {
        success: true,
        deletedCount
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}