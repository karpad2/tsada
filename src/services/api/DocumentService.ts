import { Query } from 'appwrite'
import { BaseApiService } from './BaseApiService'
import { storageService } from '../storage/StorageService'
import { i18nService } from '../i18n/I18nService'
import { validationService } from '../validation/ValidationService'
import { trackUserInteraction, trackError } from '@/utils/analytics'
import { appwriteService } from '@/appwrite'
import type { ApiResponse } from './BaseApiService'

export interface DocumentItem {
  id: string
  document_id: string
  document_title_hu?: string
  document_title_rs?: string
  document_title_en?: string
  document_categories: string[]
  file_id?: string
  file_url?: string
  file_size?: number
  file_type?: string
  contact?: string
  archived?: boolean
  visible?: boolean
  created_at: string
  updated_at: string
}

export interface DocumentCategory {
  id: string
  category_name_hu?: string
  category_name_rs?: string
  category_name_en?: string
  archived: boolean
  listasorrend?: number
  created_at: string
  updated_at: string
}

export interface DocumentItemInput {
  document_title_hu?: string
  document_title_rs?: string
  document_title_en?: string
  document_categories: string[]
  file_id?: string
  contact?: string
  archived?: boolean
  visible?: boolean
}

export interface DocumentCategoryInput {
  category_name_hu?: string
  category_name_rs?: string
  category_name_en?: string
  listasorrend?: number
  archived?: boolean
}

export interface DocumentStats {
  total_documents: number
  visible_documents: number
  archived_documents: number
  total_categories: number
  archived_categories: number
  documents_by_category: Record<string, number>
}

export interface DocumentSearchOptions {
  query?: string
  categories?: string[]
  archived?: boolean
  visible_only?: boolean
  sort_by?: 'created' | 'updated' | 'title'
  sort_order?: 'asc' | 'desc'
  limit?: number
}

/**
 * Service for managing documents and document categories
 */
export class DocumentService extends BaseApiService<DocumentItem> {
  private static instance: DocumentService
  private config = appwriteService.config

  constructor() {
    super(appwriteService.config.website_db, appwriteService.config.documents_db)
  }

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService()
    }
    return DocumentService.instance
  }

  /**
   * Get all documents with optional filtering
   */
  async getDocuments(options: DocumentSearchOptions = {}): Promise<ApiResponse<DocumentItem[]>> {
    try {
      trackUserInteraction('documents_list_view', 'documents', { options })

      const queries: string[] = [
        Query.orderDesc('$createdAt'),
        Query.limit(options.limit || 50)
      ]

      if (options.categories && options.categories.length > 0) {
        queries.push(Query.equal('documentCategories', options.categories))
      }

      if (options.archived !== undefined) {
        queries.push(Query.equal('archived', options.archived))
      }

      if (options.visible_only) {
        queries.push(Query.equal('visible', true))
      }

      const response = await this.getAll({ queries })

      if (response.success && response.data) {
        return {
          success: true,
          data: this.sortDocuments(response.data, options)
        }
      }

      return response
    } catch (error: any) {
      trackError('documents_list_error', error, { options })
      return this.handleError('Failed to fetch documents', error)
    }
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(categoryId: string): Promise<ApiResponse<DocumentItem[]>> {
    try {
      trackUserInteraction('documents_category_view', 'documents', { category_id: categoryId })

      const queries = [
        Query.equal('documentCategories', [categoryId]),
        Query.orderDesc('$createdAt')
      ]

      const response = await this.getAll({ queries })

      return response
    } catch (error: any) {
      trackError('documents_category_error', error, { category_id: categoryId })
      return this.handleError('Failed to fetch documents for category', error)
    }
  }

  /**
   * Create new document
   */
  async createDocument(documentData: DocumentItemInput): Promise<ApiResponse<DocumentItem>> {
    try {
      trackUserInteraction('document_create_attempt', 'documents', 1)

      // Validate input data
      const validationResult = this.validateDocumentInput(documentData)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const preparedData = this.prepareDocumentData(documentData)
      const response = await this.create(preparedData)

      if (response.success) {
        trackUserInteraction('document_created', 'documents', 1)
      }

      return response
    } catch (error: any) {
      trackError('document_create_error', error, documentData)
      return this.handleError('Failed to create document', error)
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, documentData: Partial<DocumentItemInput>): Promise<ApiResponse<DocumentItem>> {
    try {
      trackUserInteraction('document_update_attempt', 'documents', 1)

      const validationResult = this.validateDocumentInput(documentData, false)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const preparedData = this.prepareDocumentData(documentData)
      const response = await this.update(id, preparedData)

      if (response.success) {
        trackUserInteraction('document_updated', 'documents', 1)
      }

      return response
    } catch (error: any) {
      trackError('document_update_error', error, { document_id: id, data: documentData })
      return this.handleError('Failed to update document', error)
    }
  }

  /**
   * Delete document (and associated file if exists)
   */
  async deleteDocument(id: string, deleteFile = true): Promise<ApiResponse<void>> {
    try {
      trackUserInteraction('document_delete_attempt', 'documents', 1)

      if (deleteFile) {
        // Get document first to find file_id
        const documentResponse = await this.getById(id)
        if (documentResponse.success && documentResponse.data?.file_id) {
          await storageService.deleteFile(
            documentResponse.data.file_id,
            this.config.documents_storage
          )
        }
      }

      const response = await this.delete(id)

      if (response.success) {
        trackUserInteraction('document_deleted', 'documents', 1)
      }

      return response
    } catch (error: any) {
      trackError('document_delete_error', error, { document_id: id })
      return this.handleError('Failed to delete document', error)
    }
  }

  /**
   * Archive/Unarchive document
   */
  async toggleDocumentArchive(id: string): Promise<ApiResponse<DocumentItem>> {
    try {
      const documentResponse = await this.getById(id)

      if (!documentResponse.success || !documentResponse.data) {
        return documentResponse
      }

      const newArchivedState = !documentResponse.data.archived
      const response = await this.update(id, { archived: newArchivedState })

      if (response.success) {
        trackUserInteraction(
          'document_archive_toggled',
          'documents',
          1,
          { archived: newArchivedState }
        )
      }

      return response
    } catch (error: any) {
      trackError('document_archive_error', error, { document_id: id })
      return this.handleError('Failed to toggle document archive status', error)
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(searchTerm: string, options: DocumentSearchOptions = {}): Promise<ApiResponse<DocumentItem[]>> {
    try {
      trackUserInteraction('document_search', 'search', { term: searchTerm, options })

      const searchFields = [
        'document_title_hu', 'document_title_rs', 'document_title_en'
      ]

      const response = await this.search(searchTerm, searchFields)

      if (response.success && response.data) {
        let filteredResults = response.data

        if (options.categories && options.categories.length > 0) {
          filteredResults = filteredResults.filter(doc =>
            doc.document_categories.some(cat => options.categories!.includes(cat))
          )
        }

        if (options.archived !== undefined) {
          filteredResults = filteredResults.filter(doc => doc.archived === options.archived)
        }

        if (options.visible_only) {
          filteredResults = filteredResults.filter(doc => doc.visible)
        }

        return {
          success: true,
          data: this.sortDocuments(filteredResults, options)
        }
      }

      return response
    } catch (error: any) {
      trackError('document_search_error', error, { term: searchTerm, options })
      return this.handleError('Failed to search documents', error)
    }
  }

  // Document Categories

  /**
   * Get all document categories
   */
  async getCategories(includeArchived = false): Promise<ApiResponse<DocumentCategory[]>> {
    try {
      trackUserInteraction('document_categories_view', 'documents', { include_archived: includeArchived })

      const databases = appwriteService.getDatabases()

      const queries = [
        Query.orderAsc('listasorrend')
      ]

      if (!includeArchived) {
        queries.push(Query.equal('archived', false))
      }

      const response = await databases.listDocuments(
        this.config.website_db,
        this.config.document_categories_db,
        queries
      )

      const categories = response.documents.map(doc => this.transformCategoryDocument(doc))

      return {
        success: true,
        data: categories
      }
    } catch (error: any) {
      trackError('document_categories_error', error, { include_archived: includeArchived })
      return this.handleError('Failed to fetch document categories', error)
    }
  }

  /**
   * Create new document category
   */
  async createCategory(categoryData: DocumentCategoryInput): Promise<ApiResponse<DocumentCategory>> {
    try {
      trackUserInteraction('document_category_create_attempt', 'documents', 1)

      const validationResult = this.validateCategoryInput(categoryData)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const databases = appwriteService.getDatabases()

      const document = await databases.createDocument(
        this.config.website_db,
        this.config.document_categories_db,
        undefined, // Let Appwrite generate ID
        this.prepareCategoryData(categoryData)
      )

      const category = this.transformCategoryDocument(document)

      trackUserInteraction('document_category_created', 'documents', 1)

      return {
        success: true,
        data: category
      }
    } catch (error: any) {
      trackError('document_category_create_error', error, categoryData)
      return this.handleError('Failed to create document category', error)
    }
  }

  /**
   * Update document category
   */
  async updateCategory(id: string, categoryData: Partial<DocumentCategoryInput>): Promise<ApiResponse<DocumentCategory>> {
    try {
      trackUserInteraction('document_category_update_attempt', 'documents', 1)

      const validationResult = this.validateCategoryInput(categoryData, false)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const databases = appwriteService.getDatabases()

      const document = await databases.updateDocument(
        this.config.website_db,
        this.config.document_categories_db,
        id,
        this.prepareCategoryData(categoryData)
      )

      const category = this.transformCategoryDocument(document)

      trackUserInteraction('document_category_updated', 'documents', 1)

      return {
        success: true,
        data: category
      }
    } catch (error: any) {
      trackError('document_category_update_error', error, { category_id: id, data: categoryData })
      return this.handleError('Failed to update document category', error)
    }
  }

  /**
   * Delete document category
   */
  async deleteCategory(id: string, deleteDocuments = false): Promise<ApiResponse<void>> {
    try {
      trackUserInteraction('document_category_delete_attempt', 'documents', 1)

      if (deleteDocuments) {
        // Delete all documents in this category
        const documentsResponse = await this.getDocumentsByCategory(id)
        if (documentsResponse.success && documentsResponse.data) {
          for (const document of documentsResponse.data) {
            await this.deleteDocument(document.id)
          }
        }
      }

      const databases = appwriteService.getDatabases()
      await databases.deleteDocument(
        this.config.website_db,
        this.config.document_categories_db,
        id
      )

      trackUserInteraction('document_category_deleted', 'documents', 1)

      return {
        success: true
      }
    } catch (error: any) {
      trackError('document_category_delete_error', error, { category_id: id })
      return this.handleError('Failed to delete document category', error)
    }
  }

  /**
   * Archive/Unarchive category
   */
  async toggleCategoryArchive(id: string): Promise<ApiResponse<DocumentCategory>> {
    try {
      const databases = appwriteService.getDatabases()

      // Get current category
      const categoryDoc = await databases.getDocument(
        this.config.website_db,
        this.config.document_categories_db,
        id
      )

      const newArchivedState = !categoryDoc.archived

      const updatedDoc = await databases.updateDocument(
        this.config.website_db,
        this.config.document_categories_db,
        id,
        { archived: newArchivedState }
      )

      const category = this.transformCategoryDocument(updatedDoc)

      trackUserInteraction(
        'document_category_archive_toggled',
        'documents',
        1,
        { archived: newArchivedState }
      )

      return {
        success: true,
        data: category
      }
    } catch (error: any) {
      trackError('document_category_archive_error', error, { category_id: id })
      return this.handleError('Failed to toggle category archive status', error)
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(): Promise<ApiResponse<DocumentStats>> {
    try {
      trackUserInteraction('document_stats_view', 'analytics', {})

      const [documentsResponse, categoriesResponse] = await Promise.all([
        this.getDocuments({ archived: undefined }),
        this.getCategories(true)
      ])

      if (!documentsResponse.success || !categoriesResponse.success) {
        throw new Error('Failed to fetch data for statistics')
      }

      const documents = documentsResponse.data!
      const categories = categoriesResponse.data!

      const stats: DocumentStats = {
        total_documents: documents.length,
        visible_documents: documents.filter(d => d.visible).length,
        archived_documents: documents.filter(d => d.archived).length,
        total_categories: categories.length,
        archived_categories: categories.filter(c => c.archived).length,
        documents_by_category: {}
      }

      // Count documents by category
      for (const category of categories) {
        const categoryDocuments = documents.filter(doc =>
          doc.document_categories.includes(category.id)
        )
        const categoryName = i18nService.getLocalizedContent({
          category_name_hu: category.category_name_hu,
          category_name_rs: category.category_name_rs,
          category_name_en: category.category_name_en
        })
        stats.documents_by_category[categoryName] = categoryDocuments.length
      }

      return {
        success: true,
        data: stats
      }
    } catch (error: any) {
      trackError('document_stats_error', error, {})
      return this.handleError('Failed to get document statistics', error)
    }
  }

  // Private helper methods

  private validateDocumentInput(data: Partial<DocumentItemInput>, requireTitle = true): { isValid: boolean, errors: string[] } {
    if (requireTitle) {
      const mlValidation = validationService.validateMultiLanguageContent(
        data as any,
        ['rs'],
        'document_title_'
      )

      if (!mlValidation.isValid) {
        return {
          isValid: false,
          errors: mlValidation.errors.map(e => e.message)
        }
      }
    }

    if (!data.document_categories || data.document_categories.length === 0) {
      return {
        isValid: false,
        errors: ['At least one category is required']
      }
    }

    return {
      isValid: true,
      errors: []
    }
  }

  private validateCategoryInput(data: Partial<DocumentCategoryInput>, requireName = true): { isValid: boolean, errors: string[] } {
    if (requireName) {
      const mlValidation = validationService.validateMultiLanguageContent(
        data as any,
        ['rs'],
        'category_name_'
      )

      if (!mlValidation.isValid) {
        return {
          isValid: false,
          errors: mlValidation.errors.map(e => e.message)
        }
      }
    }

    return {
      isValid: true,
      errors: []
    }
  }

  private prepareDocumentData(data: Partial<DocumentItemInput>): Record<string, any> {
    const prepared: Record<string, any> = {}

    // Multi-language fields
    if (data.document_title_hu !== undefined) prepared.document_title_hu = data.document_title_hu.trim()
    if (data.document_title_rs !== undefined) prepared.document_title_rs = data.document_title_rs.trim()
    if (data.document_title_en !== undefined) prepared.document_title_en = data.document_title_en.trim()

    // Other fields
    if (data.document_categories) prepared.documentCategories = data.document_categories
    if (data.file_id !== undefined) prepared.file_id = data.file_id
    if (data.contact !== undefined) prepared.contact = data.contact.trim()
    if (data.archived !== undefined) prepared.archived = data.archived
    if (data.visible !== undefined) prepared.visible = data.visible

    return prepared
  }

  private prepareCategoryData(data: Partial<DocumentCategoryInput>): Record<string, any> {
    const prepared: Record<string, any> = {}

    // Multi-language fields
    if (data.category_name_hu !== undefined) prepared.category_name_hu = data.category_name_hu.trim()
    if (data.category_name_rs !== undefined) prepared.category_name_rs = data.category_name_rs.trim()
    if (data.category_name_en !== undefined) prepared.category_name_en = data.category_name_en.trim()

    // Other fields
    if (data.listasorrend !== undefined) prepared.listasorrend = data.listasorrend
    if (data.archived !== undefined) prepared.archived = data.archived

    return prepared
  }

  private sortDocuments(documents: DocumentItem[], options: DocumentSearchOptions): DocumentItem[] {
    const sortBy = options.sort_by || 'created'
    const sortOrder = options.sort_order || 'desc'

    return documents.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          const titleA = i18nService.getLocalizedContent({
            document_title_hu: a.document_title_hu,
            document_title_rs: a.document_title_rs,
            document_title_en: a.document_title_en
          })
          const titleB = i18nService.getLocalizedContent({
            document_title_hu: b.document_title_hu,
            document_title_rs: b.document_title_rs,
            document_title_en: b.document_title_en
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

  private transformCategoryDocument(doc: any): DocumentCategory {
    return {
      id: doc.$id,
      category_name_hu: doc.category_name_hu || '',
      category_name_rs: doc.category_name_rs || '',
      category_name_en: doc.category_name_en || '',
      archived: doc.archived || false,
      listasorrend: doc.listasorrend || 0,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }

  protected transformDocument(doc: any): DocumentItem {
    return {
      id: doc.$id,
      document_id: doc.document_id || '',
      document_title_hu: doc.document_title_hu || '',
      document_title_rs: doc.document_title_rs || '',
      document_title_en: doc.document_title_en || '',
      document_categories: doc.documentCategories || [],
      file_id: doc.file_id || '',
      file_url: doc.file_url || '',
      file_size: doc.file_size || 0,
      file_type: doc.file_type || '',
      contact: doc.contact || '',
      archived: doc.archived || false,
      visible: doc.visible !== false, // Default to true
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }
}

// Create and export singleton instance
export const documentService = DocumentService.getInstance()