import { Databases, Query, ID } from 'appwrite'
import { appw, config } from '@/appwrite'
import { trackError } from '@/utils/analytics'
import { pwaAppwriteService, type PWAApiOptions } from '../pwa/PWAAppwriteService'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  total?: number
  fromCache?: boolean
  timestamp?: number
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string[]
  filters?: any[]
  cache?: boolean
  ttl?: number
  priority?: 'network' | 'cache'
}

/**
 * Base API service class with common CRUD operations
 */
export abstract class BaseApiService<T = any> {
  protected database: Databases
  protected databaseId: string
  protected collectionId: string
  protected pwaService = pwaAppwriteService

  constructor(collectionId: string, databaseId = config.website_db) {
    this.database = new Databases(appw)
    this.databaseId = databaseId
    this.collectionId = collectionId
  }

  /**
   * Get all documents with optional query parameters and PWA caching
   */
  async getAll(options: QueryOptions = {}): Promise<ApiResponse<T[]>> {
    try {
      const { cache = true, ttl = 300, priority = 'network', ...queryOptions } = options
      const queries = this.buildQueries(queryOptions)

      // Use PWA service for enhanced caching
      const pwaOptions: PWAApiOptions = {
        cache,
        ttl,
        priority
      }

      const response = await this.pwaService.listDocuments(
        this.databaseId,
        this.collectionId,
        queries.map(q => q.toString()),
        pwaOptions
      )

      return {
        success: true,
        data: response.documents.map((doc: any) => this.transformDocument(doc)) as T[],
        total: response.total,
        fromCache: response.fromCache,
        timestamp: response.timestamp
      }
    } catch (error: any) {
      this.logError('getAll', error)

      // Fallback to regular Appwrite if PWA fails
      try {
        const queries = this.buildQueries(options)
        const response = await this.database.listDocuments(
          this.databaseId,
          this.collectionId,
          queries
        )

        return {
          success: true,
          data: response.documents.map(doc => this.transformDocument(doc)) as T[],
          total: response.total,
          fromCache: false
        }
      } catch (fallbackError: any) {
        return {
          success: false,
          error: error.message || fallbackError.message
        }
      }
    }
  }

  /**
   * Get single document by ID with PWA caching
   */
  async getById(id: string, options: { cache?: boolean; ttl?: number; priority?: 'network' | 'cache' } = {}): Promise<ApiResponse<T>> {
    try {
      const { cache = true, ttl = 600, priority = 'cache' } = options

      const response = await this.pwaService.getDocument(
        this.databaseId,
        this.collectionId,
        id,
        { cache, ttl, priority }
      )

      return {
        success: true,
        data: this.transformDocument(response) as T,
        fromCache: response.fromCache,
        timestamp: response.timestamp
      }
    } catch (error: any) {
      this.logError('getById', error)

      // Fallback to regular Appwrite
      try {
        const response = await this.database.getDocument(
          this.databaseId,
          this.collectionId,
          id
        )

        return {
          success: true,
          data: this.transformDocument(response) as T,
          fromCache: false
        }
      } catch (fallbackError: any) {
        return {
          success: false,
          error: error.message || fallbackError.message
        }
      }
    }
  }

  /**
   * Create new document with PWA offline support
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const processedData = this.prepareForSave(data)

      const response = await this.pwaService.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        processedData
      )

      return {
        success: true,
        data: this.transformDocument(response) as T
      }
    } catch (error: any) {
      this.logError('create', error)

      // Fallback to regular Appwrite
      try {
        const processedData = this.prepareForSave(data)
        const response = await this.database.createDocument(
          this.databaseId,
          this.collectionId,
          ID.unique(),
          processedData
        )

        return {
          success: true,
          data: this.transformDocument(response) as T
        }
      } catch (fallbackError: any) {
        return {
          success: false,
          error: error.message || fallbackError.message
        }
      }
    }
  }

  /**
   * Update existing document
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const processedData = this.prepareForSave(data)

      const response = await this.database.updateDocument(
        this.databaseId,
        this.collectionId,
        id,
        processedData
      )

      return {
        success: true,
        data: this.transformDocument(response) as T
      }
    } catch (error: any) {
      this.logError('update', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete document by ID
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await this.database.deleteDocument(
        this.databaseId,
        this.collectionId,
        id
      )

      return {
        success: true
      }
    } catch (error: any) {
      this.logError('delete', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Search documents with text query
   */
  async search(searchTerm: string, searchFields: string[] = []): Promise<ApiResponse<T[]>> {
    try {
      const queries = searchFields.map(field => Query.search(field, searchTerm))

      const response = await this.database.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      )

      return {
        success: true,
        data: response.documents.map(doc => this.transformDocument(doc)) as T[],
        total: response.total
      }
    } catch (error: any) {
      this.logError('search', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Build Appwrite queries from options
   */
  protected buildQueries(options: QueryOptions): any[] {
    const queries = []

    if (options.limit) {
      queries.push(Query.limit(options.limit))
    }

    if (options.offset) {
      queries.push(Query.offset(options.offset))
    }

    if (options.orderBy) {
      options.orderBy.forEach(order => {
        if (order.startsWith('-')) {
          queries.push(Query.orderDesc(order.substring(1)))
        } else {
          queries.push(Query.orderAsc(order))
        }
      })
    }

    if (options.filters) {
      queries.push(...options.filters)
    }

    return queries
  }

  /**
   * Transform raw Appwrite document to typed object
   * Override in child classes for specific transformations
   */
  protected transformDocument(doc: any): T {
    return {
      id: doc.$id,
      ...doc
    } as T
  }

  /**
   * Prepare data before saving to database
   * Override in child classes for specific preparations
   */
  protected prepareForSave(data: Partial<T>): any {
    // Remove undefined values and id field
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && _ !== 'id')
    )

    return cleanData
  }

  /**
   * Log errors with analytics tracking
   */
  protected logError(operation: string, error: any): void {
    console.error(`${this.constructor.name}.${operation}:`, error)

    trackError(
      `api_error_${operation}`,
      error.message || 'Unknown error',
      this.constructor.name
    )
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<ApiResponse<{ total: number }>> {
    try {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.limit(1)]
      )

      return {
        success: true,
        data: { total: response.total }
      }
    } catch (error: any) {
      this.logError('getStats', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}