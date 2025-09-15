import { useLoadingStore } from '@/stores/loading';

export interface AnalyticsEvent {
    action: string;
    category: string;
    label?: string;
    value?: number;
    custom_parameters?: Record<string, any>;
}

export interface UserProperties {
    language?: string;
    user_type?: 'student' | 'teacher' | 'admin' | 'visitor';
    school_section?: string;
    device_type?: 'mobile' | 'tablet' | 'desktop';
}

declare global {
    interface Window {
        gtag: any;
    }
}

export class AnalyticsManager {
    private gtag: any;

    constructor() {
        this.gtag = window.gtag;
    }

    // Page view tracking
    trackPageView(page_path: string, page_title?: string): void {
        if (!this.isEnabled()) return;

        const loadingStore = useLoadingStore();

        this.gtag?.event('page_view', {
            page_path,
            page_title: page_title || document.title,
            page_location: window.location.href,
            language: loadingStore.language,
            user_type: this.getUserType(),
            device_type: this.getDeviceType()
        });

        console.log('📊 Page view tracked:', page_path);
    }

    // Enhanced event tracking
    trackEvent(event: AnalyticsEvent): void {
        if (!this.isEnabled()) return;

        const loadingStore = useLoadingStore();

        const eventData = {
            event_category: event.category,
            event_label: event.label,
            value: event.value,
            language: loadingStore.language,
            user_type: this.getUserType(),
            ...event.custom_parameters
        };

        this.gtag?.event(event.action, eventData);

        console.log('📊 Event tracked:', event.action, eventData);
    }

    // User interaction tracking
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
        });
    }

    // File upload tracking
    trackFileUpload(fileType: string, fileSize: number, uploadDuration?: number): void {
        this.trackEvent({
            action: 'file_upload',
            category: 'content_management',
            label: fileType,
            value: Math.round(fileSize / 1024), // KB
            custom_parameters: {
                file_type: fileType,
                file_size_bytes: fileSize,
                upload_duration_ms: uploadDuration
            }
        });
    }

    // Gallery interaction tracking
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
        });
    }

    // Document interaction tracking
    trackDocumentInteraction(action: string, documentType: string, documentId: string): void {
        this.trackEvent({
            action: `document_${action}`,
            category: 'document_management',
            label: documentType,
            custom_parameters: {
                document_type: documentType,
                document_id: documentId
            }
        });
    }

    // Language change tracking
    trackLanguageChange(fromLanguage: string, toLanguage: string): void {
        this.trackEvent({
            action: 'language_change',
            category: 'localization',
            label: `${fromLanguage}_to_${toLanguage}`,
            custom_parameters: {
                from_language: fromLanguage,
                to_language: toLanguage
            }
        });
    }

    // Search tracking
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
        });
    }

    // Navigation tracking
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
        });
    }

    // Error tracking
    trackError(errorType: string, errorMessage: string, errorLocation: string): void {
        this.trackEvent({
            action: 'error',
            category: 'exceptions',
            label: errorType,
            custom_parameters: {
                error_type: errorType,
                error_message: errorMessage,
                error_location: errorLocation
            }
        });
    }

    // Performance tracking
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
        });
    }

    // User properties
    setUserProperties(properties: UserProperties): void {
        if (!this.isEnabled()) return;

        this.gtag?.config({
            user_properties: properties
        });

        console.log('👤 User properties set:', properties);
    }

    // Admin actions tracking
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
        });
    }

    // Time spent tracking
    trackTimeSpent(page: string, timeInSeconds: number): void {
        this.trackEvent({
            action: 'time_spent',
            category: 'engagement',
            label: page,
            value: timeInSeconds,
            custom_parameters: {
                time_spent_seconds: timeInSeconds
            }
        });
    }

    private isEnabled(): boolean {
        return typeof window !== 'undefined' && this.gtag;
    }

    private getUserType(): string {
        const loadingStore = useLoadingStore();
        if (loadingStore.userLoggedin) {
            return 'admin'; // Since only admins can log in
        }
        return 'visitor';
    }

    private getDeviceType(): string {
        if (typeof window === 'undefined') return 'unknown';

        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }
}

// Global analytics instance
export const analytics = new AnalyticsManager();

// Convenience functions
export const trackPageView = (page_path: string, page_title?: string) =>
    analytics.trackPageView(page_path, page_title);

export const trackEvent = (event: AnalyticsEvent) =>
    analytics.trackEvent(event);

export const trackUserInteraction = (action: string, element: string, details?: Record<string, any>) =>
    analytics.trackUserInteraction(action, element, details);

export const trackFileUpload = (fileType: string, fileSize: number, uploadDuration?: number) =>
    analytics.trackFileUpload(fileType, fileSize, uploadDuration);

export const trackError = (errorType: string, errorMessage: string, errorLocation: string) =>
    analytics.trackError(errorType, errorMessage, errorLocation);

export const trackNavigation = (from: string, to: string, navigationMethod: string = 'router') =>
    analytics.trackNavigation(from, to, navigationMethod);

export const trackGalleryInteraction = (action: string, galleryId: string, imageCount?: number) =>
    analytics.trackGalleryInteraction(action, galleryId, imageCount);

export const trackAdminAction = (action: string, resource: string, resourceId?: string) =>
    analytics.trackAdminAction(action, resource, resourceId);

export const trackLanguageChange = (fromLanguage: string, toLanguage: string) =>
    analytics.trackLanguageChange(fromLanguage, toLanguage);

export const setUserProperties = (properties: UserProperties) =>
    analytics.setUserProperties(properties);

// Auto-track unhandled errors
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        trackError(
            'javascript_error',
            event.message,
            `${event.filename}:${event.lineno}:${event.colno}`
        );
    });

    window.addEventListener('unhandledrejection', (event) => {
        trackError(
            'unhandled_promise_rejection',
            event.reason?.toString() || 'Unknown promise rejection',
            'promise'
        );
    });
}

// Auto-track performance metrics
if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
                analytics.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
                analytics.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
                analytics.trackPerformance('first_contentful_paint', navigation.loadEventEnd - navigation.fetchStart);
            }
        }, 0);
    });
}