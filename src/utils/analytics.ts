import { useLoadingStore } from '@/stores/loading'

export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

export interface UserProperties {
  language?: string
  user_type?: 'student' | 'teacher' | 'admin' | 'visitor'
  school_section?: string
  device_type?: 'mobile' | 'tablet' | 'desktop'
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === ''
}

function emitGaEvent(name: string, params?: Record<string, unknown>): void {
  if (isLocalhost()) return
  if (typeof window === 'undefined') return
  const fn = window.gtag
  if (typeof fn !== 'function') return
  try {
    fn('event', name, params)
  } catch {
    /* never break the app */
  }
}

export class AnalyticsManager {
  trackPageView(page_path: string, page_title?: string): void {
    if (isLocalhost()) return
    try {
      const loadingStore = useLoadingStore()
      emitGaEvent('page_view', {
        page_path,
        page_title: page_title || (typeof document !== 'undefined' ? document.title : page_path),
        page_location: typeof window !== 'undefined' ? window.location.href : page_path,
        language: loadingStore.language,
        user_type: this.getUserType(),
        device_type: this.getDeviceType()
      })
    } catch {
      /* ignore */
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (isLocalhost()) return
    try {
      const loadingStore = useLoadingStore()
      emitGaEvent(event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        language: loadingStore.language,
        user_type: this.getUserType(),
        ...event.custom_parameters
      })
    } catch {
      /* ignore */
    }
  }

  trackUserInteraction(action: string, element: string, details?: Record<string, any>): void {
    this.trackEvent({
      action: 'user_interaction',
      category: 'engagement',
      label: `${action}_${element}`,
      custom_parameters: {
        interaction_type: action,
        element_type: element,
        ...details
      }
    })
  }

  trackFileUpload(fileType: string, fileSize: number, uploadDuration?: number): void {
    this.trackEvent({
      action: 'file_upload',
      category: 'content_management',
      label: fileType,
      value: Math.round(fileSize / 1024),
      custom_parameters: {
        file_type: fileType,
        file_size_bytes: fileSize,
        upload_duration_ms: uploadDuration
      }
    })
  }

  trackGalleryInteraction(action: string, galleryId: string, imageCount?: number): void {
    this.trackEvent({
      action: `gallery_${action}`,
      category: 'gallery_management',
      label: galleryId,
      value: imageCount,
      custom_parameters: {
        gallery_id: galleryId,
        image_count: imageCount
      }
    })
  }

  trackDocumentInteraction(action: string, documentType: string, documentId: string): void {
    this.trackEvent({
      action: `document_${action}`,
      category: 'document_management',
      label: documentType,
      custom_parameters: {
        document_type: documentType,
        document_id: documentId
      }
    })
  }

  trackLanguageChange(fromLanguage: string, toLanguage: string): void {
    if (!fromLanguage || fromLanguage === toLanguage) return
    this.trackEvent({
      action: 'language_change',
      category: 'localization',
      label: `${fromLanguage}_to_${toLanguage}`,
      custom_parameters: {
        from_language: fromLanguage,
        to_language: toLanguage
      }
    })
  }

  trackSearch(query: string, resultsCount: number, searchType: string = 'general'): void {
    this.trackEvent({
      action: 'search',
      category: 'site_search',
      label: searchType,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        search_type: searchType,
        results_count: resultsCount
      }
    })
  }

  trackNavigation(from: string, to: string, navigationMethod: string = 'click'): void {
    this.trackEvent({
      action: 'navigation',
      category: 'site_navigation',
      label: navigationMethod,
      custom_parameters: {
        from_page: from,
        to_page: to,
        navigation_method: navigationMethod
      }
    })
  }

  trackError(_errorType: string, _errorMessage: string, _errorLocation: string): void {
    if (isLocalhost()) return
    this.trackEvent({
      action: 'error',
      category: 'exceptions',
      label: _errorType,
      custom_parameters: {
        error_type: _errorType,
        error_message: _errorMessage,
        error_location: _errorLocation
      }
    })
  }

  trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.trackEvent({
      action: 'performance_metric',
      category: 'performance',
      label: metricName,
      value: Math.round(value),
      custom_parameters: {
        metric_name: metricName,
        metric_unit: unit
      }
    })
  }

  setUserProperties(properties: UserProperties): void {
    if (isLocalhost()) return
    if (typeof window === 'undefined') return
    const fn = window.gtag
    if (typeof fn !== 'function') return
    try {
      fn('set', 'user_properties', properties)
    } catch {
      /* ignore */
    }
  }

  trackAdminAction(action: string, resource: string, resourceId?: string): void {
    this.trackEvent({
      action: `admin_${action}`,
      category: 'admin_actions',
      label: resource,
      custom_parameters: {
        admin_action: action,
        resource_type: resource,
        resource_id: resourceId
      }
    })
  }

  trackTimeSpent(page: string, timeInSeconds: number): void {
    this.trackEvent({
      action: 'time_spent',
      category: 'engagement',
      label: page,
      value: timeInSeconds,
      custom_parameters: {
        time_spent_seconds: timeInSeconds
      }
    })
  }

  private getUserType(): string {
    try {
      const loadingStore = useLoadingStore()
      return loadingStore.userLoggedin ? 'admin' : 'visitor'
    } catch {
      return 'visitor'
    }
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown'
    const width = window.innerWidth
    if (width <= 768) return 'mobile'
    if (width <= 1024) return 'tablet'
    return 'desktop'
  }
}

export const analytics = new AnalyticsManager()

export const trackPageView = (page_path: string, page_title?: string) =>
  analytics.trackPageView(page_path, page_title)

export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event)

export const trackUserInteraction = (action: string, element: string, details?: Record<string, any>) =>
  analytics.trackUserInteraction(action, element, details)

export const trackFileUpload = (fileType: string, fileSize: number, uploadDuration?: number) =>
  analytics.trackFileUpload(fileType, fileSize, uploadDuration)

export const trackError = (errorType: string, errorMessage: string, errorLocation: string) =>
  analytics.trackError(errorType, errorMessage, errorLocation)

export const trackNavigation = (from: string, to: string, navigationMethod: string = 'router') =>
  analytics.trackNavigation(from, to, navigationMethod)

export const trackGalleryInteraction = (action: string, galleryId: string, imageCount?: number) =>
  analytics.trackGalleryInteraction(action, galleryId, imageCount)

export const trackAdminAction = (action: string, resource: string, resourceId?: string) =>
  analytics.trackAdminAction(action, resource, resourceId)

export const trackLanguageChange = (fromLanguage: string, toLanguage: string) =>
  analytics.trackLanguageChange(fromLanguage, toLanguage)

export const setUserProperties = (properties: UserProperties) =>
  analytics.setUserProperties(properties)
