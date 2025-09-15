import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHeader } from '@/composables/ui/useHeader'

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackUserInteraction: vi.fn()
}))

// Mock services
const mockNavigationData = {
  documentCategories: [
    { id: '1', name: 'Category 1', documents: [] }
  ],
  aboutItems: [
    { id: '1', title: 'About Item 1', url: '/about/1' }
  ],
  erasmusItems: [
    { id: '1', title: 'Erasmus Item 1', url: '/erasmus/1' }
  ],
  studentItems: [
    { id: '1', title: 'Student Item 1', url: '/student/1' }
  ]
}

const mockNavigationService = {
  getNavigationData: vi.fn(() => Promise.resolve(mockNavigationData)),
  clearCache: vi.fn()
}

vi.mock('@/services', () => ({
  navigationService: mockNavigationService,
  i18nService: {
    getCurrentLanguage: vi.fn(() => 'hu'),
    changeLanguage: vi.fn()
  }
}))

// Mock loading store
const mockLoadingStore = {
  language: 'hu',
  user: null,
  logout: vi.fn()
}

vi.mock('@/stores/loading', () => ({
  useLoadingStore: () => mockLoadingStore
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('useHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadingStore.user = null
    mockLoadingStore.language = 'hu'
  })

  it('initializes with correct default values', () => {
    const {
      isMobileMenuOpen,
      isNavigationLoading,
      navigationData
    } = useHeader()

    expect(isMobileMenuOpen.value).toBe(false)
    expect(isNavigationLoading.value).toBe(false)
    expect(navigationData.value).toBeNull()
  })

  it('loads navigation data on initialization', async () => {
    const { loadNavigationData } = useHeader()

    await loadNavigationData()

    expect(mockNavigationService.getNavigationData).toHaveBeenCalled()
  })

  it('toggles mobile menu state', () => {
    const { isMobileMenuOpen, toggleMobileMenu } = useHeader()

    expect(isMobileMenuOpen.value).toBe(false)

    toggleMobileMenu()
    expect(isMobileMenuOpen.value).toBe(true)

    toggleMobileMenu()
    expect(isMobileMenuOpen.value).toBe(false)
  })

  it('closes mobile menu', () => {
    const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useHeader()

    toggleMobileMenu() // Open menu
    expect(isMobileMenuOpen.value).toBe(true)

    closeMobileMenu()
    expect(isMobileMenuOpen.value).toBe(false)
  })

  it('tracks analytics on mobile menu toggle', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')
    const { toggleMobileMenu } = useHeader()

    toggleMobileMenu()

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'mobile_menu_toggle',
      'navigation',
      { action: 'open' }
    )
  })

  it('handles language change', async () => {
    const { handleLanguageChange } = useHeader()

    await handleLanguageChange('rs')

    expect(mockNavigationService.clearCache).toHaveBeenCalled()
  })

  it('tracks analytics on language change', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')
    const { handleLanguageChange } = useHeader()

    await handleLanguageChange('rs')

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'language_change',
      'navigation',
      { from: 'hu', to: 'rs' }
    )
  })

  it('handles navigation dropdown clicks', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')
    const { handleNavigationClick } = useHeader()

    const mockItem = {
      id: '1',
      title: 'Test Item',
      url: '/test'
    }

    await handleNavigationClick(mockItem, 'documents')

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'navigation_click',
      'navigation',
      {
        category: 'documents',
        item: 'Test Item',
        url: '/test'
      }
    )
  })

  it('handles external URL navigation', async () => {
    const { handleNavigationClick } = useHeader()

    const mockItem = {
      id: '1',
      title: 'External Link',
      url: 'https://example.com'
    }

    // Mock window.open
    const originalOpen = window.open
    window.open = vi.fn()

    await handleNavigationClick(mockItem, 'external')

    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank')

    // Restore original
    window.open = originalOpen
  })

  it('handles internal URL navigation', async () => {
    const { handleNavigationClick } = useHeader()

    const mockItem = {
      id: '1',
      title: 'Internal Link',
      url: '/internal'
    }

    await handleNavigationClick(mockItem, 'internal')

    expect(mockPush).toHaveBeenCalledWith('/internal')
  })

  it('provides computed navigation items', async () => {
    const { navigationData, loadNavigationData, documentItems, aboutItems } = useHeader()

    await loadNavigationData()

    expect(documentItems.value).toEqual(mockNavigationData.documentCategories)
    expect(aboutItems.value).toEqual(mockNavigationData.aboutItems)
  })

  it('handles user authentication state', () => {
    const { isAuthenticated } = useHeader()

    expect(isAuthenticated.value).toBe(false)

    mockLoadingStore.user = {
      $id: '123',
      name: 'Test User',
      email: 'test@example.com'
    }

    expect(isAuthenticated.value).toBe(true)
  })

  it('handles user logout', async () => {
    const { handleLogout } = useHeader()

    await handleLogout()

    expect(mockLoadingStore.logout).toHaveBeenCalled()
  })

  it('tracks analytics on logout', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')
    mockLoadingStore.user = {
      $id: '123',
      name: 'Test User',
      email: 'test@example.com'
    }

    const { handleLogout } = useHeader()

    await handleLogout()

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'user_logout',
      'authentication',
      { user: 'Test User' }
    )
  })

  it('handles navigation data loading errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockNavigationService.getNavigationData.mockRejectedValue(new Error('API Error'))

    const { loadNavigationData } = useHeader()

    await loadNavigationData()

    expect(consoleSpy).toHaveBeenCalledWith('Error loading navigation data:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('provides current language from store', () => {
    const { currentLanguage } = useHeader()

    expect(currentLanguage.value).toBe('hu')

    mockLoadingStore.language = 'rs'
    expect(currentLanguage.value).toBe('rs')
  })

  it('closes mobile menu on route navigation', () => {
    const { isMobileMenuOpen, toggleMobileMenu, handleNavigationClick } = useHeader()

    toggleMobileMenu() // Open menu
    expect(isMobileMenuOpen.value).toBe(true)

    const mockItem = {
      id: '1',
      title: 'Test Item',
      url: '/test'
    }

    handleNavigationClick(mockItem, 'internal')

    expect(isMobileMenuOpen.value).toBe(false)
  })

  it('handles navigation data refresh', async () => {
    const { refreshNavigationData } = useHeader()

    await refreshNavigationData()

    expect(mockNavigationService.clearCache).toHaveBeenCalled()
    expect(mockNavigationService.getNavigationData).toHaveBeenCalled()
  })
})