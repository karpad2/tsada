import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'
import { appwriteService } from '@/appwrite'
import { navigationService } from '@/services/navigation/NavigationService'
import { i18nService } from '@/services/i18n/I18nService'
import { trackUserInteraction, trackLanguageChange, trackError } from '@/utils/analytics'
import type { NavigationData, MenuItem } from '@/services/navigation/NavigationService'

export interface Language {
  code: string
  name: string
  country: string
  flag?: string
}

export interface HeaderState {
  navigationData: NavigationData | null
  loading: boolean
  error: string | null
  mobileMenuOpen: boolean
  currentLanguage: string
  currentFlag: string
  languages: Language[]
}

export function useHeader() {
  // Reactive state
  const state = reactive<HeaderState>({
    navigationData: null,
    loading: false,
    error: null,
    mobileMenuOpen: false,
    currentLanguage: 'rs',
    currentFlag: 'rs',
    languages: [
      { code: 'rs', name: 'Српски', country: 'rs' },
      { code: 'hu', name: 'Magyar', country: 'hu' },
      { code: 'en', name: 'English', country: 'gb' }
    ]
  })

  // Stores and router
  const loadingStore = useLoadingStore()
  const route = useRoute()
  const router = useRouter()

  // Computed properties
  const isAuthenticated = computed(() => loadingStore.userLoggedin)
  const isMobileView = computed(() => loadingStore.mobile_view)
  const isTabletMode = computed(() => loadingStore.tablet_mode)
  const isMobileMode = computed(() => loadingStore.mobile_mode)
  const currentBreadcrumb = computed(() => {
    if (state.navigationData) {
      return navigationService.getBreadcrumb(route.path, state.navigationData)
    }
    return []
  })

  // Erasmus settings
  const showErasmusFlag = computed(() =>
    state.navigationData?.erasmusSettings.list_enabled || false
  )

  const showErasmusApply = computed(() =>
    state.navigationData?.erasmusSettings.apply_enabled || false
  )

  // EU Co-funded logo visibility (controlled by database setting and page route)
  const showEuFunding = computed(() => {
    // Check if globally enabled in database
    const isEnabled = state.navigationData?.erasmusSettings.eu_funding_enabled || false
    if (!isEnabled) return false

    // Check current page - show on specific pages
    const path = route.path.toLowerCase()
    return path.includes('/home') ||
           path.includes('/erasmus') ||
           path.includes('/about') ||
           path.includes('/renderer/about') ||
           path === '/'
  })

  // Navigation methods
  const initializeHeader = async (forceRefresh = false) => {
    state.loading = true
    state.error = null

    try {
      trackUserInteraction('header_initialization', 'navigation', { forceRefresh })

      // Initialize authentication check
      await appwriteService.checkAuth()

      // Set current language
      state.currentLanguage = loadingStore.language
      setCurrentLanguageFlag(state.currentLanguage)

      // Load navigation data
      const response = await navigationService.getNavigationData(forceRefresh)

      if (response.success && response.data) {
        state.navigationData = response.data
      } else {
        throw new Error(response.error || 'Failed to load navigation data')
      }
    } catch (error: any) {
      console.error('Error initializing header:', error)
      state.error = error.message
      trackError('header_initialization_error', error, {})
    } finally {
      state.loading = false
    }
  }

  // Mobile menu methods
  const toggleMobileMenu = () => {
    state.mobileMenuOpen = !state.mobileMenuOpen
    trackUserInteraction('mobile_menu_toggle', 'navigation', {
      opened: state.mobileMenuOpen
    })
  }

  const closeMobileMenu = () => {
    if (state.mobileMenuOpen) {
      state.mobileMenuOpen = false
      trackUserInteraction('mobile_menu_close', 'navigation', {})
    }
  }

  // Language methods
  const setCurrentLanguageFlag = (languageCode: string) => {
    const language = state.languages.find(l => l.code === languageCode)
    state.currentFlag = language?.country || 'rs'
  }

  const changeLanguage = (languageCode: string) => {
    const oldLanguage = state.currentLanguage

    if (oldLanguage !== languageCode) {
      trackLanguageChange(oldLanguage, languageCode)

      // Update stores
      loadingStore.setLanguage(languageCode)
      i18nService.setCurrentLanguage(languageCode)

      // Update local state
      state.currentLanguage = languageCode
      setCurrentLanguageFlag(languageCode)

      // Clear navigation cache to reload localized content
      navigationService.clearCache()

      // Reload page for i18n changes
      window.location.reload()
    }
  }

  // Authentication methods
  const logout = async () => {
    try {
      trackUserInteraction('user_logout', 'auth', {})

      await appwriteService.logout()

      // Update loading store
      loadingStore.setUserLoggedin(false)

      // Redirect to home or reload
      await router.push('/home')
      window.location.reload()
    } catch (error: any) {
      console.error('Logout error:', error)
      trackError('logout_error', error, {})
    }
  }

  // Navigation helpers
  const getLocalizedMenuTitle = (item: MenuItem): string => {
    return item.title || item.name || ''
  }

  const searchNavigationItems = (query: string): MenuItem[] => {
    if (!state.navigationData || !query.trim()) return []

    return navigationService.searchNavigationItems(query.trim(), state.navigationData)
  }

  const refreshNavigationData = async () => {
    await initializeHeader(true)
  }

  // Menu item getters for template
  const getDocumentCategories = (): MenuItem[] => {
    return state.navigationData?.documentCategories || []
  }

  const getAboutItems = (): MenuItem[] => {
    return state.navigationData?.aboutItems || []
  }

  const getErasmusItems = (): MenuItem[] => {
    return state.navigationData?.erasmusItems || []
  }

  const getStudentItems = (): MenuItem[] => {
    return state.navigationData?.studentItems || []
  }

  // Watch for route changes to close mobile menu
  watch(route, () => {
    closeMobileMenu()
  })

  // Watch for language changes from store
  watch(
    () => loadingStore.language,
    (newLang) => {
      if (newLang !== state.currentLanguage) {
        state.currentLanguage = newLang
        setCurrentLanguageFlag(newLang)
      }
    }
  )

  // Lifecycle
  onMounted(() => {
    initializeHeader()
  })

  return {
    // State
    state,

    // Computed
    isAuthenticated,
    isMobileView,
    isTabletMode,
    isMobileMode,
    currentBreadcrumb,
    showErasmusFlag,
    showErasmusApply,
    showEuFunding,

    // Methods
    initializeHeader,
    toggleMobileMenu,
    closeMobileMenu,
    changeLanguage,
    logout,
    getLocalizedMenuTitle,
    searchNavigationItems,
    refreshNavigationData,

    // Menu getters
    getDocumentCategories,
    getAboutItems,
    getErasmusItems,
    getStudentItems
  }
}