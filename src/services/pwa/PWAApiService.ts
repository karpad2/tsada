/**
 * PWA-optimized API service for better caching and offline support
 */

export interface PWAApiOptions {
  cache?: boolean
  offline?: boolean
  priority?: 'network' | 'cache'
  ttl?: number // Time to live in seconds
  retryCount?: number
}

export interface CachedResponse<T> {
  data: T
  timestamp: number
  ttl: number
  fromCache: boolean
}

export class PWAApiService {
  private static instance: PWAApiService
  private cacheName = 'pwa-api-cache-v1'
  private offlineQueue: Array<{ url: string; options: RequestInit; timestamp: number }> = []

  static getInstance(): PWAApiService {
    if (!PWAApiService.instance) {
      PWAApiService.instance = new PWAApiService()
    }
    return PWAApiService.instance
  }

  private constructor() {
    this.initOfflineHandler()
  }

  /**
   * PWA-optimized fetch with intelligent caching
   */
  async fetch<T>(
    url: string,
    options: RequestInit & PWAApiOptions = {}
  ): Promise<CachedResponse<T>> {
    const {
      cache = true,
      offline = true,
      priority = 'network',
      ttl = 300, // 5 minutes default
      retryCount = 3,
      ...fetchOptions
    } = options

    const cacheKey = this.getCacheKey(url, fetchOptions)

    try {
      // Network first strategy for fresh data
      if (priority === 'network' && navigator.onLine) {
        try {
          const response = await this.fetchWithRetry(url, fetchOptions, retryCount)
          const data = await response.json()

          // Cache successful responses
          if (cache && response.ok) {
            await this.cacheResponse(cacheKey, data, ttl)
          }

          return {
            data,
            timestamp: Date.now(),
            ttl,
            fromCache: false
          }
        } catch (networkError) {
          console.warn('Network request failed, trying cache:', networkError)
          // Fall through to cache
        }
      }

      // Cache first or fallback to cache
      if (cache) {
        const cachedData = await this.getCachedResponse<T>(cacheKey)
        if (cachedData) {
          // Background refresh if cache is stale
          if (priority === 'cache' && navigator.onLine && this.isCacheStale(cachedData)) {
            this.backgroundRefresh(url, fetchOptions, cacheKey, ttl)
          }

          return {
            ...cachedData,
            fromCache: true
          }
        }
      }

      // Last resort: offline queue if offline support enabled
      if (offline && !navigator.onLine) {
        await this.addToOfflineQueue(url, fetchOptions)
        throw new Error('Offline: Request queued for when connection is restored')
      }

      // Network request as last resort
      const response = await this.fetchWithRetry(url, fetchOptions, retryCount)
      const data = await response.json()

      return {
        data,
        timestamp: Date.now(),
        ttl,
        fromCache: false
      }

    } catch (error) {
      console.error('PWA API Service error:', error)
      throw error
    }
  }

  /**
   * Clear all API cache
   */
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      await caches.delete(this.cacheName)
    }
  }

  /**
   * Clear specific endpoint cache
   */
  async clearEndpointCache(url: string, options: RequestInit = {}): Promise<void> {
    if ('caches' in window) {
      const cache = await caches.open(this.cacheName)
      const cacheKey = this.getCacheKey(url, options)
      await cache.delete(cacheKey)
    }
  }

  /**
   * Get cache status for debugging
   */
  async getCacheStatus(): Promise<{ size: number; entries: string[] }> {
    if (!('caches' in window)) {
      return { size: 0, entries: [] }
    }

    try {
      const cache = await caches.open(this.cacheName)
      const keys = await cache.keys()

      return {
        size: keys.length,
        entries: keys.map(req => req.url)
      }
    } catch (error) {
      return { size: 0, entries: [] }
    }
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue(): Promise<void> {
    if (!navigator.onLine || this.offlineQueue.length === 0) {
      return
    }

    const queueCopy = [...this.offlineQueue]
    this.offlineQueue = []

    for (const item of queueCopy) {
      try {
        await fetch(item.url, item.options)
        console.log('Offline request processed:', item.url)
      } catch (error) {
        console.error('Failed to process offline request:', error)
        // Re-queue if failed
        this.offlineQueue.push(item)
      }
    }
  }

  // Private methods

  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${btoa(body)}`
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount: number
  ): Promise<Response> {
    let lastError: Error

    for (let i = 0; i <= retryCount; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10s timeout
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response
      } catch (error) {
        lastError = error as Error

        if (i < retryCount) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, i), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  private async cacheResponse<T>(
    cacheKey: string,
    data: T,
    ttl: number
  ): Promise<void> {
    if (!('caches' in window)) return

    try {
      const cache = await caches.open(this.cacheName)
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttl * 1000 // Convert to milliseconds
      }

      const response = new Response(JSON.stringify(cacheData), {
        headers: { 'Content-Type': 'application/json' }
      })

      await cache.put(cacheKey, response)
    } catch (error) {
      console.warn('Failed to cache response:', error)
    }
  }

  private async getCachedResponse<T>(cacheKey: string): Promise<CachedResponse<T> | null> {
    if (!('caches' in window)) return null

    try {
      const cache = await caches.open(this.cacheName)
      const cachedResponse = await cache.match(cacheKey)

      if (!cachedResponse) return null

      const cacheData = await cachedResponse.json()
      const now = Date.now()

      // Check if cache is expired
      if (now - cacheData.timestamp > cacheData.ttl) {
        await cache.delete(cacheKey)
        return null
      }

      return {
        data: cacheData.data,
        timestamp: cacheData.timestamp,
        ttl: cacheData.ttl,
        fromCache: true
      }
    } catch (error) {
      console.warn('Failed to get cached response:', error)
      return null
    }
  }

  private isCacheStale(cachedData: CachedResponse<any>): boolean {
    const now = Date.now()
    const age = now - cachedData.timestamp
    const staleThreshold = cachedData.ttl * 0.8 // Refresh when 80% of TTL passed

    return age > staleThreshold
  }

  private async backgroundRefresh(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number
  ): Promise<void> {
    try {
      const response = await fetch(url, options)
      const data = await response.json()

      if (response.ok) {
        await this.cacheResponse(cacheKey, data, ttl)
      }
    } catch (error) {
      console.warn('Background refresh failed:', error)
    }
  }

  private async addToOfflineQueue(url: string, options: RequestInit): Promise<void> {
    // Only queue POST, PUT, DELETE requests
    const method = options.method?.toUpperCase()
    if (method && ['POST', 'PUT', 'DELETE'].includes(method)) {
      this.offlineQueue.push({
        url,
        options,
        timestamp: Date.now()
      })
    }
  }

  private initOfflineHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Back online, processing queue...')
        this.processOfflineQueue()
      })

      window.addEventListener('offline', () => {
        console.log('Gone offline')
      })
    }
  }
}