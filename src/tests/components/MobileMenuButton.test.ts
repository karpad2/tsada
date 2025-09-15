import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileMenuButton from '@/components/navigation/MobileMenuButton.vue'

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackUserInteraction: vi.fn()
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

describe('MobileMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders mobile menu button with hamburger icon', () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('shows hamburger icon when menu is closed', () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    expect(wrapper.find('.pi-align-left').exists()).toBe(true)
    expect(wrapper.find('.pi-times').exists()).toBe(false)
  })

  it('shows close icon when menu is open', () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: true,
        isMobile: true
      },
      ...globalMocks
    })

    expect(wrapper.find('.pi-times').exists()).toBe(true)
    expect(wrapper.find('.pi-align-left').exists()).toBe(false)
  })

  it('emits toggle event when clicked', async () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')?.[0]).toEqual([true])
  })

  it('tracks analytics on button click', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')

    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'mobile_menu_toggle',
      'navigation',
      { action: 'open' }
    )
  })

  it('tracks correct action based on current state', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')

    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: true,
        isMobile: true
      },
      ...globalMocks
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'mobile_menu_toggle',
      'navigation',
      { action: 'close' }
    )
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBeDefined()
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('updates aria-expanded when state changes', async () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-expanded')).toBe('false')

    await wrapper.setProps({ isOpen: true })
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  it('does not render when isMobile is false', () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: false
      },
      ...globalMocks
    })

    expect(wrapper.find('.mobile-menu-container').exists()).toBe(false)
  })

  it('renders when isMobile is true', () => {
    const wrapper = mount(MobileMenuButton, {
      props: {
        isOpen: false,
        isMobile: true
      },
      ...globalMocks
    })

    expect(wrapper.find('.mobile-menu-container').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })
})