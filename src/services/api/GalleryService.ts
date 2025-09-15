import { Query } from 'appwrite'
import { BaseApiService } from './BaseApiService'
import { storageService } from '../storage/StorageService'
import { i18nService } from '../i18n/I18nService'
import { validationService } from '../validation/ValidationService'
import { trackGalleryInteraction, trackUserInteraction, trackError } from '@/utils/analytics'
import { appwriteService } from '@/appwrite'
import type { ApiResponse } from './BaseApiService'

export interface GalleryItem {
  id: string
  title_hu?: string
  title_rs?: string
  title_en?: string
  short_hu?: string
  short_rs?: string
  short_en?: string
  visible: boolean
  default_image?: string
  images?: GalleryImage[]
  created_at: string
  updated_at: string
}

export interface GalleryImage {
  id: string
  gallery: string
  image_id: string
  filename?: string
  size?: number
  mime_type?: string
  created_at: string
  updated_at: string
}

export interface GalleryItemInput {
  title_hu?: string
  title_rs?: string
  title_en?: string
  short_hu?: string
  short_rs?: string
  short_en?: string
  visible?: boolean
  default_image?: string
}

export interface GalleryImageInput {
  gallery: string
  image_id: string
  filename?: string
  size?: number
  mime_type?: string
}

export interface GalleryStats {
  total_galleries: number
  visible_galleries: number
  hidden_galleries: number
  total_images: number
  galleries_without_images: number
  galleries_with_default_image: number
}

export interface GallerySearchOptions {
  query?: string
  visible_only?: boolean
  with_images_only?: boolean
  languages?: string[]
  sort_by?: 'created' | 'updated' | 'title'
  sort_order?: 'asc' | 'desc'
}

/**
 * Service for managing gallery items and their associated images
 */
export class GalleryService extends BaseApiService<GalleryItem> {
  private static instance: GalleryService
  private config = appwriteService.config

  constructor() {
    super(appwriteService.config.website_db, appwriteService.config.gallery)
  }

  static getInstance(): GalleryService {
    if (!GalleryService.instance) {
      GalleryService.instance = new GalleryService()
    }
    return GalleryService.instance
  }

  /**
   * Get all galleries with optional filtering
   */
  async getGalleries(options: GallerySearchOptions = {}): Promise<ApiResponse<GalleryItem[]>> {
    try {
      trackUserInteraction('galleries_list_view', 'gallery', { options })

      const queries: string[] = [
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ]

      if (options.visible_only) {
        queries.push(Query.equal('visible', true))
      }

      const response = await this.getAll({ queries })

      if (response.success && response.data) {
        // Load images for each gallery if requested
        const galleries = await Promise.all(
          response.data.map(async (gallery) => {
            if (options.with_images_only !== false) {
              const imagesResponse = await this.getGalleryImages(gallery.id)
              gallery.images = imagesResponse.success ? imagesResponse.data : []
            }
            return gallery
          })
        )

        // Filter galleries with images if requested
        const filteredGalleries = options.with_images_only
          ? galleries.filter(g => g.images && g.images.length > 0)
          : galleries

        return {
          success: true,
          data: this.sortGalleries(filteredGalleries, options)
        }
      }

      return response
    } catch (error: any) {
      trackError('gallery_list_error', error, { options })
      return this.handleError('Failed to fetch galleries', error)
    }
  }

  /**
   * Get gallery by ID with images
   */
  async getGalleryWithImages(id: string): Promise<ApiResponse<GalleryItem>> {
    try {
      trackUserInteraction('gallery_view', 'gallery', { gallery_id: id })

      const response = await this.getById(id)

      if (response.success && response.data) {
        const imagesResponse = await this.getGalleryImages(id)
        response.data.images = imagesResponse.success ? imagesResponse.data : []
      }

      return response
    } catch (error: any) {
      trackError('gallery_fetch_error', error, { gallery_id: id })
      return this.handleError('Failed to fetch gallery', error)
    }
  }

  /**
   * Create new gallery with validation
   */
  async createGallery(galleryData: GalleryItemInput): Promise<ApiResponse<GalleryItem>> {
    try {
      trackGalleryInteraction('gallery_create_attempt', 'new_gallery', 1)

      // Validate input data
      const validationResult = this.validateGalleryInput(galleryData)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const preparedData = this.prepareGalleryData(galleryData)
      const response = await this.create(preparedData)

      if (response.success) {
        trackGalleryInteraction('gallery_created', response.data!.id, 1)
      }

      return response
    } catch (error: any) {
      trackError('gallery_create_error', error, galleryData)
      return this.handleError('Failed to create gallery', error)
    }
  }

  /**
   * Update existing gallery
   */
  async updateGallery(id: string, galleryData: Partial<GalleryItemInput>): Promise<ApiResponse<GalleryItem>> {
    try {
      trackGalleryInteraction('gallery_update_attempt', id, 1)

      // Validate input data if provided
      const validationResult = this.validateGalleryInput(galleryData, false)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const preparedData = this.prepareGalleryData(galleryData)
      const response = await this.update(id, preparedData)

      if (response.success) {
        trackGalleryInteraction('gallery_updated', id, 1)
      }

      return response
    } catch (error: any) {
      trackError('gallery_update_error', error, { gallery_id: id, data: galleryData })
      return this.handleError('Failed to update gallery', error)
    }
  }

  /**
   * Delete gallery and associated images
   */
  async deleteGallery(id: string, deleteImages = true): Promise<ApiResponse<void>> {
    try {
      trackGalleryInteraction('gallery_delete_attempt', id, 1)

      if (deleteImages) {
        // Get gallery images first
        const imagesResponse = await this.getGalleryImages(id)
        if (imagesResponse.success && imagesResponse.data) {
          // Delete each image
          for (const image of imagesResponse.data) {
            await this.deleteGalleryImage(image.id)
          }
        }
      }

      const response = await this.delete(id)

      if (response.success) {
        trackGalleryInteraction('gallery_deleted', id, 1)
      }

      return response
    } catch (error: any) {
      trackError('gallery_delete_error', error, { gallery_id: id })
      return this.handleError('Failed to delete gallery', error)
    }
  }

  /**
   * Get images for a specific gallery
   */
  async getGalleryImages(galleryId: string): Promise<ApiResponse<GalleryImage[]>> {
    try {
      const databases = appwriteService.getDatabases()

      const response = await databases.listDocuments(
        this.config.website_db,
        this.config.gallery_images || this.config.album_images,
        [
          Query.equal('gallery', galleryId),
          Query.orderDesc('$createdAt')
        ]
      )

      const images = response.documents.map(doc => this.transformImageDocument(doc))

      return {
        success: true,
        data: images
      }
    } catch (error: any) {
      trackError('gallery_images_fetch_error', error, { gallery_id: galleryId })
      return this.handleError('Failed to fetch gallery images', error)
    }
  }

  /**
   * Add image to gallery
   */
  async addImageToGallery(imageData: GalleryImageInput): Promise<ApiResponse<GalleryImage>> {
    try {
      trackGalleryInteraction('image_add_attempt', imageData.gallery, 1)

      const databases = appwriteService.getDatabases()

      const document = await databases.createDocument(
        this.config.website_db,
        this.config.gallery_images || this.config.album_images,
        imageData.image_id, // Use image_id as document ID
        {
          gallery: imageData.gallery,
          image_id: imageData.image_id,
          filename: imageData.filename || '',
          size: imageData.size || 0,
          mime_type: imageData.mime_type || ''
        }
      )

      const image = this.transformImageDocument(document)

      trackGalleryInteraction('image_added', imageData.gallery, 1)

      return {
        success: true,
        data: image
      }
    } catch (error: any) {
      trackError('gallery_image_add_error', error, imageData)
      return this.handleError('Failed to add image to gallery', error)
    }
  }

  /**
   * Delete image from gallery
   */
  async deleteGalleryImage(imageId: string): Promise<ApiResponse<void>> {
    try {
      trackGalleryInteraction('image_delete_attempt', 'gallery', 1)

      // Delete from storage
      await storageService.deleteFile(imageId, this.config.website_images)

      // Delete from database
      const databases = appwriteService.getDatabases()
      await databases.deleteDocument(
        this.config.website_db,
        this.config.gallery_images || this.config.album_images,
        imageId
      )

      trackGalleryInteraction('image_deleted', 'gallery', 1)

      return {
        success: true
      }
    } catch (error: any) {
      trackError('gallery_image_delete_error', error, { image_id: imageId })
      return this.handleError('Failed to delete image', error)
    }
  }

  /**
   * Set default image for gallery
   */
  async setDefaultImage(galleryId: string, imageId: string): Promise<ApiResponse<GalleryItem>> {
    try {
      trackGalleryInteraction('set_default_image', galleryId, 1)

      const response = await this.update(galleryId, { default_image: imageId })

      if (response.success) {
        trackGalleryInteraction('default_image_set', galleryId, 1)
      }

      return response
    } catch (error: any) {
      trackError('set_default_image_error', error, { gallery_id: galleryId, image_id: imageId })
      return this.handleError('Failed to set default image', error)
    }
  }

  /**
   * Search galleries by title and description
   */
  async searchGalleries(searchTerm: string, options: GallerySearchOptions = {}): Promise<ApiResponse<GalleryItem[]>> {
    try {
      trackUserInteraction('gallery_search', 'search', { term: searchTerm, options })

      const searchFields = [
        'title_hu', 'title_rs', 'title_en',
        'short_hu', 'short_rs', 'short_en'
      ]

      const response = await this.search(searchTerm, searchFields)

      if (response.success && response.data) {
        let filteredResults = response.data

        if (options.visible_only) {
          filteredResults = filteredResults.filter(gallery => gallery.visible)
        }

        if (options.with_images_only) {
          // Load images for filtering
          const galleries = await Promise.all(
            filteredResults.map(async (gallery) => {
              const imagesResponse = await this.getGalleryImages(gallery.id)
              gallery.images = imagesResponse.success ? imagesResponse.data : []
              return gallery
            })
          )
          filteredResults = galleries.filter(g => g.images && g.images.length > 0)
        }

        return {
          success: true,
          data: this.sortGalleries(filteredResults, options)
        }
      }

      return response
    } catch (error: any) {
      trackError('gallery_search_error', error, { term: searchTerm, options })
      return this.handleError('Failed to search galleries', error)
    }
  }

  /**
   * Get gallery statistics
   */
  async getGalleryStats(): Promise<ApiResponse<GalleryStats>> {
    try {
      trackUserInteraction('gallery_stats_view', 'analytics', {})

      const allGalleriesResponse = await this.getAll()

      if (!allGalleriesResponse.success || !allGalleriesResponse.data) {
        return this.handleError('Failed to fetch galleries for stats', new Error('No data'))
      }

      const galleries = allGalleriesResponse.data
      let totalImages = 0
      let galleriesWithoutImages = 0
      let galleriesWithDefaultImage = 0

      // Count images and analyze galleries
      for (const gallery of galleries) {
        const imagesResponse = await this.getGalleryImages(gallery.id)
        const imageCount = imagesResponse.success ? imagesResponse.data?.length || 0 : 0

        totalImages += imageCount

        if (imageCount === 0) {
          galleriesWithoutImages++
        }

        if (gallery.default_image) {
          galleriesWithDefaultImage++
        }
      }

      const stats: GalleryStats = {
        total_galleries: galleries.length,
        visible_galleries: galleries.filter(g => g.visible).length,
        hidden_galleries: galleries.filter(g => !g.visible).length,
        total_images: totalImages,
        galleries_without_images: galleriesWithoutImages,
        galleries_with_default_image: galleriesWithDefaultImage
      }

      return {
        success: true,
        data: stats
      }
    } catch (error: any) {
      trackError('gallery_stats_error', error, {})
      return this.handleError('Failed to get gallery statistics', error)
    }
  }

  /**
   * Toggle gallery visibility
   */
  async toggleVisibility(id: string): Promise<ApiResponse<GalleryItem>> {
    try {
      const galleryResponse = await this.getById(id)

      if (!galleryResponse.success || !galleryResponse.data) {
        return galleryResponse
      }

      const newVisibility = !galleryResponse.data.visible
      const response = await this.update(id, { visible: newVisibility })

      if (response.success) {
        trackGalleryInteraction(
          'gallery_visibility_toggled',
          id,
          1,
          { visibility: newVisibility }
        )
      }

      return response
    } catch (error: any) {
      trackError('gallery_visibility_toggle_error', error, { gallery_id: id })
      return this.handleError('Failed to toggle gallery visibility', error)
    }
  }

  // Private helper methods

  private validateGalleryInput(data: Partial<GalleryItemInput>, requireTitle = true): { isValid: boolean, errors: string[] } {
    const rules = []

    if (requireTitle) {
      rules.push(
        { field: 'title_rs', rules: [{ type: 'required' as const }] }
      )
    }

    // Validate multi-language content
    const mlValidation = validationService.validateMultiLanguageContent(
      data as any,
      ['rs'],
      'title_'
    )

    if (!mlValidation.isValid) {
      return {
        isValid: false,
        errors: mlValidation.errors.map(e => e.message)
      }
    }

    return {
      isValid: true,
      errors: []
    }
  }

  private prepareGalleryData(data: Partial<GalleryItemInput>): Record<string, any> {
    const prepared: Record<string, any> = {}

    // Multi-language fields
    if (data.title_hu !== undefined) prepared.title_hu = data.title_hu.trim()
    if (data.title_rs !== undefined) prepared.title_rs = data.title_rs.trim()
    if (data.title_en !== undefined) prepared.title_en = data.title_en.trim()
    if (data.short_hu !== undefined) prepared.short_hu = data.short_hu.trim()
    if (data.short_rs !== undefined) prepared.short_rs = data.short_rs.trim()
    if (data.short_en !== undefined) prepared.short_en = data.short_en.trim()

    // Other fields
    if (data.visible !== undefined) prepared.visible = data.visible
    if (data.default_image !== undefined) prepared.default_image = data.default_image

    return prepared
  }

  private sortGalleries(galleries: GalleryItem[], options: GallerySearchOptions): GalleryItem[] {
    const sortBy = options.sort_by || 'created'
    const sortOrder = options.sort_order || 'desc'

    return galleries.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          const titleA = i18nService.getLocalizedContent({
            title_hu: a.title_hu,
            title_rs: a.title_rs,
            title_en: a.title_en
          })
          const titleB = i18nService.getLocalizedContent({
            title_hu: b.title_hu,
            title_rs: b.title_rs,
            title_en: b.title_en
          })
          comparison = titleA.localeCompare(titleB)
          break
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case 'created':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private transformImageDocument(doc: any): GalleryImage {
    return {
      id: doc.$id,
      gallery: doc.gallery || '',
      image_id: doc.image_id || '',
      filename: doc.filename || '',
      size: doc.size || 0,
      mime_type: doc.mime_type || '',
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }

  protected transformDocument(doc: any): GalleryItem {
    return {
      id: doc.$id,
      title_hu: doc.title_hu || '',
      title_rs: doc.title_rs || '',
      title_en: doc.title_en || '',
      short_hu: doc.short_hu || '',
      short_rs: doc.short_rs || '',
      short_en: doc.short_en || '',
      visible: doc.visible || false,
      default_image: doc.default_image || '',
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }
}

// Create and export singleton instance
export const galleryService = GalleryService.getInstance()