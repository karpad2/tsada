import { Client, Databases, Storage, Account, Query, ID } from 'appwrite'
import { config } from '@/appwrite'
import { PWAApiService, type PWAApiOptions } from './PWAApiService'

// Appwrite configuration constants
const APPWRITE_CONFIG = {
  endpoint: 'https://appwrite.tsada.edu.rs/v1',
  projectId: '659ea7f886cf55d4528a'
} as const

/**
 * PWA-optimized Appwrite service wrapper
 * Provides intelligent caching and offline support for Appwrite operations
 */
export class PWAAppwriteService {
  private static instance: PWAAppwriteService
  private client: Client
  private databases: Databases
  private storage: Storage
  private account: Account
  private pwaApi: PWAApiService

  static getInstance(): PWAAppwriteService {
    if (!PWAAppwriteService.instance) {
      PWAAppwriteService.instance = new PWAAppwriteService()
    }
    return PWAAppwriteService.instance
  }

  private constructor() {
    this.client = new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId)

    this.databases = new Databases(this.client)
    this.storage = new Storage(this.client)
    this.account = new Account(this.client)
    this.pwaApi = PWAApiService.getInstance()
  }

  /**
   * List documents with PWA caching
   */
  async listDocuments(
    databaseId: string,
    collectionId: string,
    queries: string[] = [],
    options: PWAApiOptions = {}
  ) {
    const url = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents')
    const searchParams = new URLSearchParams()

    queries.forEach((query, index) => {
      searchParams.append(`queries[${index}]`, query)
    })

    const fullUrl = `${url}?${searchParams.toString()}`

    const defaultOptions: PWAApiOptions = {
      cache: true,
      ttl: 300, // 5 minutes
      priority: 'network',
      ...options
    }

    try {
      const result = await this.pwaApi.fetch(fullUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        ...defaultOptions
      })

      return {
        ...result.data,
        fromCache: result.fromCache,
        timestamp: result.timestamp
      }
    } catch (error) {
      console.error('PWA listDocuments error:', error)
      throw error
    }
  }

  /**
   * Get single document with caching
   */
  async getDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    options: PWAApiOptions = {}
  ) {
    const url = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents', documentId)

    const defaultOptions: PWAApiOptions = {
      cache: true,
      ttl: 600, // 10 minutes for single documents
      priority: 'cache', // Documents change less frequently
      ...options
    }

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        ...defaultOptions
      })

      return {
        ...result.data,
        fromCache: result.fromCache,
        timestamp: result.timestamp
      }
    } catch (error) {
      console.error('PWA getDocument error:', error)
      throw error
    }
  }

  /**
   * Create document (no caching, immediate sync)
   */
  async createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string | typeof ID.unique,
    data: any,
    permissions: string[] = []
  ) {
    const url = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents')

    const body = {
      documentId: documentId === ID.unique ? 'unique()' : documentId,
      data,
      permissions
    }

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        cache: false, // Don't cache mutations
        offline: true // Queue for offline
      })

      // Invalidate related caches
      await this.invalidateCollectionCache(databaseId, collectionId)

      return result.data
    } catch (error) {
      console.error('PWA createDocument error:', error)
      throw error
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any,
    permissions: string[] = []
  ) {
    const url = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents', documentId)

    const body = {
      data,
      permissions
    }

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        cache: false,
        offline: true
      })

      // Invalidate caches
      await this.invalidateDocumentCache(databaseId, collectionId, documentId)
      await this.invalidateCollectionCache(databaseId, collectionId)

      return result.data
    } catch (error) {
      console.error('PWA updateDocument error:', error)
      throw error
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ) {
    const url = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents', documentId)

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
        cache: false,
        offline: true
      })

      // Invalidate caches
      await this.invalidateDocumentCache(databaseId, collectionId, documentId)
      await this.invalidateCollectionCache(databaseId, collectionId)

      return result.data
    } catch (error) {
      console.error('PWA deleteDocument error:', error)
      throw error
    }
  }

  /**
   * Account operations (minimal caching due to sensitive nature)
   */
  async getCurrentUser(options: PWAApiOptions = {}) {
    const url = this.buildUrl('account')

    const defaultOptions: PWAApiOptions = {
      cache: true,
      ttl: 60, // 1 minute only
      priority: 'network',
      ...options
    }

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        ...defaultOptions
      })

      return result.data
    } catch (error) {
      console.error('PWA getCurrentUser error:', error)
      throw error
    }
  }

  /**
   * Create session (no caching)
   */
  async createEmailSession(email: string, password: string) {
    const url = this.buildUrl('account', 'sessions', 'email')

    const body = {
      email,
      password
    }

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        cache: false,
        offline: false // Auth must be online
      })

      // Clear all caches after login to ensure fresh data
      await this.pwaApi.clearCache()

      return result.data
    } catch (error) {
      console.error('PWA createEmailSession error:', error)
      throw error
    }
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId: string) {
    const url = this.buildUrl('account', 'sessions', sessionId)

    try {
      const result = await this.pwaApi.fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
        cache: false,
        offline: false
      })

      // Clear all caches after logout
      await this.pwaApi.clearCache()

      return result.data
    } catch (error) {
      console.error('PWA deleteSession error:', error)
      throw error
    }
  }

  /**
   * Storage operations with caching for file metadata
   */
  async getFilePreview(
    bucketId: string,
    fileId: string,
    width?: number,
    height?: number,
    gravity?: string,
    quality?: number,
    borderWidth?: number,
    borderColor?: string,
    borderRadius?: number,
    opacity?: number,
    rotation?: number,
    background?: string,
    output?: string
  ): Promise<string> {
    const params = new URLSearchParams()
    if (width) params.append('width', width.toString())
    if (height) params.append('height', height.toString())
    if (gravity) params.append('gravity', gravity)
    if (quality) params.append('quality', quality.toString())
    if (borderWidth) params.append('borderWidth', borderWidth.toString())
    if (borderColor) params.append('borderColor', borderColor)
    if (borderRadius) params.append('borderRadius', borderRadius.toString())
    if (opacity) params.append('opacity', opacity.toString())
    if (rotation) params.append('rotation', rotation.toString())
    if (background) params.append('background', background)
    if (output) params.append('output', output)

    const url = this.buildUrl('storage', 'buckets', bucketId, 'files', fileId, 'preview')
    return `${url}?${params.toString()}`
  }

  /**
   * Clear all PWA caches
   */
  async clearAllCaches(): Promise<void> {
    await this.pwaApi.clearCache()
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.pwaApi.getCacheStatus()
  }

  // Private helper methods

  private buildUrl(...paths: string[]): string {
    return `${APPWRITE_CONFIG.endpoint}/${paths.join('/')}`
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
      'X-SDK-Version': 'appwrite:web:11.0.0',
      'X-SDK-Name': 'Web',
      'X-SDK-Language': 'javascript'
    }
  }

  private async invalidateDocumentCache(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<void> {
    const url = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents', documentId)
    await this.pwaApi.clearEndpointCache(url)
  }

  private async invalidateCollectionCache(
    databaseId: string,
    collectionId: string
  ): Promise<void> {
    // This is a simplified approach - in production you might want to clear based on patterns
    const baseUrl = this.buildUrl('databases', databaseId, 'collections', collectionId, 'documents')
    await this.pwaApi.clearEndpointCache(baseUrl)
  }
}

// Export singleton instance
export const pwaAppwriteService = PWAAppwriteService.getInstance()