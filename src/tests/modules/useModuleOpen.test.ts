import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const isPublicModuleOpen = vi.fn()

vi.mock('@/services/modules/windows', () => ({
  isPublicModuleOpen: (...args: unknown[]) => isPublicModuleOpen(...args)
}))

import { useModuleOpen } from '@/composables/useModuleOpen'

function mountHook(id: 'gallery' | 'erasmus_apply', staffBypass = false) {
  const Comp = defineComponent({
    setup() {
      return useModuleOpen(id, staffBypass)
    },
    template: '<div>{{ open }}-{{ ready }}</div>'
  })
  return mount(Comp)
}

describe('useModuleOpen', () => {
  beforeEach(() => {
    isPublicModuleOpen.mockReset()
  })

  it('starts open, then follows the public window', async () => {
    isPublicModuleOpen.mockResolvedValue(false)
    const wrapper = mountHook('gallery')
    expect(wrapper.text()).toBe('true-false')

    await flushPromises()
    expect(isPublicModuleOpen).toHaveBeenCalledWith('gallery')
    expect(wrapper.text()).toBe('false-true')
  })

  it('skips the lookup for staff bypass', async () => {
    const wrapper = mountHook('erasmus_apply', true)
    await flushPromises()
    expect(isPublicModuleOpen).not.toHaveBeenCalled()
    expect(wrapper.text()).toBe('true-true')
  })
})
