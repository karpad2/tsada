import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageSelector from '@/components/navigation/LanguageSelector.vue'

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackUserInteraction: vi.fn(),
  trackLanguageChange: vi.fn()
}))

// Mock i18n with global
const mockT = vi.fn((key) => key)
const globalMocks = {
  global: {
    mocks: {
      $t: mockT
    }
  }
}

describe('LanguageSelector', () => {
  const defaultProps = {
    languages: [
      { code: 'hu', name: 'Magyar', country: 'hu' },
      { code: 'rs', name: 'Српски', country: 'rs' }
    ],
    currentLanguage: 'hu',
    currentFlag: 'hu'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders language selector with correct initial language', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    expect(wrapper.find('.language-selector').exists()).toBe(true)
    expect(wrapper.find('img[alt="Magyar"]').exists()).toBe(true)
  })

  it('shows Serbian flag when language is Serbian', async () => {
    const wrapper = mount(LanguageSelector, {
      props: {
        ...defaultProps,
        currentLanguage: 'rs',
        currentFlag: 'rs'
      },
      ...globalMocks
    })

    expect(wrapper.find('img[alt="Српски"]').exists()).toBe(true)
  })

  it('displays correct language labels', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    expect(wrapper.text()).toContain('Magyar')
  })

  it('shows dropdown menu on click', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const button = wrapper.find('[role="button"]')
    await button.trigger('click')

    const dropdownContent = wrapper.find('.dropdown-content')
    expect(dropdownContent.exists()).toBe(true)
  })

  it('displays all available languages in dropdown', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const languageItems = wrapper.findAll('li')
    expect(languageItems).toHaveLength(2)

    expect(wrapper.text()).toContain('Magyar')
    expect(wrapper.text()).toContain('Српски')
  })

  it('changes language when option is clicked', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const languageLinks = wrapper.findAll('li a')
    await languageLinks[1].trigger('click')

    expect(wrapper.emitted('language-change')).toBeTruthy()
    expect(wrapper.emitted('language-change')?.[0]).toEqual(['rs'])
  })

  it('tracks analytics on language change', async () => {
    const { trackLanguageChange } = await import('@/utils/analytics')

    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const languageLinks = wrapper.findAll('li a')
    await languageLinks[1].trigger('click')

    expect(trackLanguageChange).toHaveBeenCalledWith('hu', 'rs')
  })

  it('handles keyboard navigation', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const button = wrapper.find('[role="button"]')
    await button.trigger('keydown.enter')

    expect(wrapper.find('.dropdown-content').exists()).toBe(true)
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    expect(wrapper.find('.language-selector').exists()).toBe(true)
    expect(wrapper.find('.dropdown').exists()).toBe(true)
  })

  it('handles missing language gracefully', async () => {
    const wrapper = mount(LanguageSelector, {
      props: {
        ...defaultProps,
        currentLanguage: 'unknown'
      },
      ...globalMocks
    })

    // Should not throw error and render fallback
    expect(wrapper.find('.language-selector').exists()).toBe(true)
  })

  it('does not change to same language', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const languageLinks = wrapper.findAll('li a')
    await languageLinks[0].trigger('click')

    // Should not emit event for same language
    expect(wrapper.emitted('language-change')).toBeFalsy()
  })

  it('tracks menu open analytics', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')

    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
      ...globalMocks
    })

    const button = wrapper.find('[role="button"]')
    await button.trigger('click')

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'language_menu_open',
      'i18n',
      { current_language: 'hu' }
    )
  })
})