import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationDropdown from '@/components/navigation/NavigationDropdown.vue'
import type { MenuItem } from '@/services/navigation/NavigationService'

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackUserInteraction: vi.fn()
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('NavigationDropdown', () => {
  const mockItems: MenuItem[] = [
    {
      id: '1',
      title: 'Test Item 1',
      name: 'Test Item 1',
      url: '/test-1'
    },
    {
      id: '2',
      title: 'Test Item 2',
      name: 'Test Item 2',
      url: '/test-2'
    },
    {
      id: '3',
      title: 'External Link',
      name: 'External Link',
      url: 'https://example.com'
    }
  ]

  const defaultProps = {
    title: 'Test Dropdown',
    items: mockItems,
    routePrefix: '/test/',
    trackingCategory: 'test'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dropdown title correctly', () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Test Dropdown')
  })

  it('shows arrow by default', () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps
    })

    const arrowIcon = wrapper.find('.pi-angle-down')
    expect(arrowIcon.exists()).toBe(true)
  })

  it('hides arrow when showArrow is false', () => {
    const wrapper = mount(NavigationDropdown, {
      props: {
        ...defaultProps,
        showArrow: false
      }
    })

    const arrowIcon = wrapper.find('.pi-angle-down')
    expect(arrowIcon.exists()).toBe(false)
  })

  it('renders all menu items', () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps
    })

    const menuItems = wrapper.findAll('li')
    expect(menuItems).toHaveLength(3)

    expect(wrapper.text()).toContain('Test Item 1')
    expect(wrapper.text()).toContain('Test Item 2')
    expect(wrapper.text()).toContain('External Link')
  })

  it('creates router-link for internal URLs', () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps,
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
            props: ['to']
          }
        }
      }
    })

    // Check that router-link components are created for internal URLs
    const routerLinks = wrapper.findAllComponents({ name: 'router-link' })
    expect(routerLinks.length).toBeGreaterThan(0)
  })

  it('creates regular anchor tag for external URLs', () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps,
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
            props: ['to']
          }
        }
      }
    })

    const externalLinks = wrapper.findAll('a[href^="http"]')
    expect(externalLinks.length).toBeGreaterThan(0)
  })

  it('emits button-click event when button is clicked', async () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps
    })

    const button = wrapper.find('[role="button"]')
    await button.trigger('click')

    expect(wrapper.emitted('button-click')).toBeTruthy()
  })

  it('emits item-click event when menu item is clicked', async () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps,
      global: {
        stubs: {
          'router-link': {
            template: '<a @click="$emit(\'click\')"><slot /></a>',
            props: ['to'],
            emits: ['click']
          }
        }
      }
    })

    // Find the first menu item and click it
    const menuItems = wrapper.findAll('li')
    const firstItem = menuItems[0].find('a')

    await firstItem.trigger('click')

    expect(wrapper.emitted('item-click')).toBeTruthy()
  })

  it('applies custom button classes', () => {
    const customClass = 'custom-button-class'
    const wrapper = mount(NavigationDropdown, {
      props: {
        ...defaultProps,
        buttonClass: customClass
      }
    })

    const button = wrapper.find('[role="button"]')
    expect(button.classes()).toContain(customClass)
  })

  it('applies custom dropdown classes', () => {
    const customClass = 'custom-dropdown-class'
    const wrapper = mount(NavigationDropdown, {
      props: {
        ...defaultProps,
        dropdownClass: customClass
      }
    })

    const dropdown = wrapper.find('.dropdown-content')
    expect(dropdown.classes()).toContain(customClass)
  })

  it('handles empty items array', () => {
    const wrapper = mount(NavigationDropdown, {
      props: {
        ...defaultProps,
        items: []
      }
    })

    // Should still render button
    expect(wrapper.find('[role="button"]').exists()).toBe(true)

    // But no menu items
    const menuItems = wrapper.findAll('li')
    expect(menuItems).toHaveLength(0)
  })

  it('renders custom slot content', () => {
    const wrapper = mount(NavigationDropdown, {
      props: defaultProps,
      slots: {
        'custom-items': '<li class="custom-slot-item">Custom Item</li>'
      }
    })

    expect(wrapper.find('.custom-slot-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Item')
  })

  it('uses correct route prefix for internal links', () => {
    const routePrefix = '/custom-prefix/'
    const wrapper = mount(NavigationDropdown, {
      props: {
        ...defaultProps,
        routePrefix
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
            props: ['to']
          }
        }
      }
    })

    const component = wrapper.vm as any
    const routeProps = component.getItemProps(mockItems[0])

    // Should use route prefix + item id for items without explicit URL
    if (!mockItems[0].url || !mockItems[0].url.startsWith('http')) {
      expect(routeProps.to).toContain(routePrefix)
    }
  })

  it('tracks analytics on button click', async () => {
    const { trackUserInteraction } = await import('@/utils/analytics')

    const wrapper = mount(NavigationDropdown, {
      props: defaultProps
    })

    const button = wrapper.find('[role="button"]')
    await button.trigger('click')

    expect(trackUserInteraction).toHaveBeenCalledWith(
      'test_dropdown_open',
      'navigation',
      { dropdown: 'Test Dropdown' }
    )
  })

  it('handles missing item properties gracefully', () => {
    const incompleteItems: MenuItem[] = [
      {
        id: '1',
        title: ''  // Empty title
      },
      {
        id: '2',
        title: 'Valid Title',
        name: 'Valid Name'
      }
    ]

    const wrapper = mount(NavigationDropdown, {
      props: {
        ...defaultProps,
        items: incompleteItems
      }
    })

    // Should render both items
    const menuItems = wrapper.findAll('li')
    expect(menuItems).toHaveLength(2)

    // Should handle empty title gracefully
    expect(wrapper.text()).toContain('Valid Title')
  })
})