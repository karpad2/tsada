import { Query } from 'appwrite'
import { BaseApiService } from '../api/BaseApiService'
import { i18nService } from '../i18n/I18nService'
import { trackUserInteraction, trackError } from '@/utils/analytics'
import { appwriteService } from '@/appwrite'
import type { ApiResponse } from '../api/BaseApiService'

export interface MenuItem {
  id: string
  title: string
  name?: string
  type?: string
  url?: string
  children?: MenuItem[]
  show_in_header?: boolean
  order?: number
}

export interface NavigationData {
  documentCategories: MenuItem[]
  aboutItems: MenuItem[]
  erasmusItems: MenuItem[]
  studentItems: MenuItem[]
  erasmusSettings: {
    list_enabled: boolean
    apply_enabled: boolean
  }
}

/**
 * Service for managing navigation menu data and structure
 */
export class NavigationService extends BaseApiService<any> {
  private static instance: NavigationService
  private config = appwriteService.config
  private cachedData: NavigationData | null = null
  private cacheTimestamp = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    super(appwriteService.config.website_db, '')
  }

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService()
    }
    return NavigationService.instance
  }

  /**
   * Get all navigation data with caching
   */
  async getNavigationData(forceRefresh = false): Promise<ApiResponse<NavigationData>> {
    try {
      trackUserInteraction('navigation_data_request', 'header', {})

      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && this.cachedData && (Date.now() - this.cacheTimestamp < this.CACHE_TTL)) {
        return {
          success: true,
          data: this.cachedData
        }
      }

      const [documentCategories, aboutItems, erasmusItems, studentItems, erasmusSettings] = await Promise.all([
        this.getDocumentCategories(),
        this.getAboutItems(),
        this.getErasmusItems(),
        this.getStudentItems(),
        this.getErasmusSettings()
      ])

      const navigationData: NavigationData = {
        documentCategories: documentCategories.success ? documentCategories.data! : [],
        aboutItems: aboutItems.success ? aboutItems.data! : [],
        erasmusItems: erasmusItems.success ? erasmusItems.data! : [],
        studentItems: studentItems.success ? studentItems.data! : [],
        erasmusSettings: erasmusSettings.success ? erasmusSettings.data! : {
          list_enabled: false,
          apply_enabled: false
        }
      }

      // Cache the data
      this.cachedData = navigationData
      this.cacheTimestamp = Date.now()

      return {
        success: true,
        data: navigationData
      }
    } catch (error: any) {
      trackError('navigation_data_error', error, {})
      return this.handleError('Failed to fetch navigation data', error)
    }
  }

  /**
   * Get document categories for navigation
   */
  async getDocumentCategories(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const databases = appwriteService.getDatabases()

      const result = await databases.listDocuments(
        this.config.website_db,
        this.config.document_categories_db
      )

      const items = result.documents
        .map(doc => this.transformToMenuItem(doc))
        .filter(item => item.title)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      return {
        success: true,
        data: items
      }
    } catch (error: any) {
      trackError('document_categories_error', error, {})
      return this.handleError('Failed to fetch document categories', error)
    }
  }

  /**
   * Get about section items for navigation
   */
  async getAboutItems(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const databases = appwriteService.getDatabases()

      const result = await databases.listDocuments(
        this.config.website_db,
        this.config.about_us_db,
        [
          Query.equal('show_at_the_header_from_about', true),
          Query.select(['title_hu', 'title_en', 'title_rs', '$id', 'sorrend']),
          Query.orderAsc('sorrend')
        ]
      )

      const items = result.documents
        .map(doc => this.transformToMenuItem(doc))
        .filter(item => item.title)

      return {
        success: true,
        data: items
      }
    } catch (error: any) {
      trackError('about_items_error', error, {})
      return this.handleError('Failed to fetch about items', error)
    }
  }

  /**
   * Get Erasmus items for navigation
   */
  async getErasmusItems(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const databases = appwriteService.getDatabases()

      const result = await databases.listDocuments(
        this.config.website_db,
        this.config.about_us_db,
        [
          Query.equal('type', 'erasmus'),
          Query.select(['title_hu', 'title_en', 'title_rs', '$id'])
        ]
      )

      const items = result.documents
        .map(doc => this.transformToMenuItem(doc, 'erasmus'))
        .filter(item => item.title)

      return {
        success: true,
        data: items
      }
    } catch (error: any) {
      trackError('erasmus_items_error', error, {})
      return this.handleError('Failed to fetch Erasmus items', error)
    }
  }

  /**
   * Get student section items for navigation
   */
  async getStudentItems(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const databases = appwriteService.getDatabases()

      const result = await databases.listDocuments(
        this.config.website_db,
        this.config.about_us_db,
        [
          Query.equal('type', 'students'),
          Query.select(['title_hu', 'title_en', 'title_rs', '$id'])
        ]
      )

      const items = result.documents
        .map(doc => this.transformToMenuItem(doc, 'students'))
        .filter(item => item.title)

      return {
        success: true,
        data: items
      }
    } catch (error: any) {
      trackError('student_items_error', error, {})
      return this.handleError('Failed to fetch student items', error)
    }
  }

  /**
   * Get Erasmus module settings
   */
  async getErasmusSettings(): Promise<ApiResponse<{ list_enabled: boolean; apply_enabled: boolean }>> {
    try {
      const databases = appwriteService.getDatabases()

      const [listSetting, applySetting] = await Promise.all([
        databases.getDocument(this.config.website_db, this.config.general_settings, 'erasmus_list').catch(() => null),
        databases.getDocument(this.config.website_db, this.config.general_settings, 'erasmus_apply_on').catch(() => null)
      ])

      return {
        success: true,
        data: {
          list_enabled: listSetting?.setting_status || false,
          apply_enabled: applySetting?.setting_status || false
        }
      }
    } catch (error: any) {
      trackError('erasmus_settings_error', error, {})
      return this.handleError('Failed to fetch Erasmus settings', error)
    }
  }

  /**
   * Clear navigation cache
   */
  clearCache(): void {
    this.cachedData = null
    this.cacheTimestamp = 0
    trackUserInteraction('navigation_cache_cleared', 'header', {})
  }

  /**
   * Search navigation items
   */
  searchNavigationItems(query: string, data?: NavigationData): MenuItem[] {
    const navigationData = data || this.cachedData
    if (!navigationData || !query) return []

    const searchTerm = query.toLowerCase()
    const allItems = [
      ...navigationData.documentCategories,
      ...navigationData.aboutItems,
      ...navigationData.erasmusItems,
      ...navigationData.studentItems
    ]

    return allItems.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      (item.name && item.name.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * Get navigation breadcrumb for a given path
   */
  getBreadcrumb(path: string, data?: NavigationData): MenuItem[] {
    const navigationData = data || this.cachedData
    if (!navigationData) return []

    const breadcrumb: MenuItem[] = []

    // Simple breadcrumb logic - can be enhanced based on routing structure
    const pathSegments = path.split('/').filter(Boolean)

    if (pathSegments.includes('about')) {
      breadcrumb.push({ id: 'about', title: 'About Us' })
    }
    if (pathSegments.includes('documents')) {
      breadcrumb.push({ id: 'documents', title: 'Documents' })
    }
    if (pathSegments.includes('students')) {
      breadcrumb.push({ id: 'students', title: 'For Students' })
    }
    if (pathSegments.includes('erasmus')) {
      breadcrumb.push({ id: 'erasmus', title: 'Erasmus+' })
    }

    return breadcrumb
  }

  // Private helper methods

  private transformToMenuItem(doc: any, type?: string): MenuItem {
    const item: MenuItem = {
      id: doc.$id,
      title: this.getLocalizedTitle(doc),
      type: type || doc.type,
      order: parseInt(doc.sorrend) || 0,
      show_in_header: doc.show_at_the_header_from_about || false
    }

    // Set name for backward compatibility
    if (doc.category_name_hu || doc.category_name_rs || doc.category_name_en) {
      item.name = this.getLocalizedCategoryName(doc)
    } else {
      item.name = item.title
    }

    return item
  }

  private getLocalizedTitle(element: any): string {
    const content = {
      title_hu: element.title_hu || '',
      title_rs: element.title_rs || '',
      title_en: element.title_en || ''
    }

    return i18nService.getLocalizedContent(content) || ''
  }

  private getLocalizedCategoryName(element: any): string {
    const content = {
      category_name_hu: element.category_name_hu || '',
      category_name_rs: element.category_name_rs || '',
      category_name_en: element.category_name_en || ''
    }

    return i18nService.getLocalizedContent(content) || ''
  }

  protected transformDocument(doc: any): any {
    return doc
  }
}

// Create and export singleton instance
export const navigationService = NavigationService.getInstance()