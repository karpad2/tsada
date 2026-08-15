import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDocument = vi.fn()
const updateDocument = vi.fn()
const createDocument = vi.fn()

vi.mock('appwrite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('appwrite')>()
  return {
    ...actual,
    Databases: class {
      getDocument = (...args: unknown[]) => getDocument(...args)
      updateDocument = (...args: unknown[]) => updateDocument(...args)
      createDocument = (...args: unknown[]) => createDocument(...args)
    }
  }
})

vi.mock('@/appwrite', () => ({
  appw: {},
  config: {
    website_db: 'test_db',
    general_settings: 'settings'
  }
}))

import { defaultModuleMap, isModuleOpen, loadModuleWindows, modulePhase, saveModuleWindows } from '@/services/modules/windows'

const now = new Date('2026-08-15T10:00:00')

function settingDoc(id: string, status: boolean, data?: unknown) {
  return {
    $id: id,
    setting_status: status,
    setting_data: data === undefined ? undefined : JSON.stringify(data)
  }
}

describe('module phase', () => {
  it('reports off / scheduled / live / ended', () => {
    expect(modulePhase({ enabled: false }, now)).toBe('off')
    expect(modulePhase({ enabled: true, from: '2026-09-01T08:00' }, now)).toBe('scheduled')
    expect(modulePhase({ enabled: true, until: '2026-08-01T08:00' }, now)).toBe('ended')
    expect(modulePhase({ enabled: true, from: '2026-08-01T08:00', until: '2026-08-20T08:00' }, now)).toBe('live')
    expect(isModuleOpen({ enabled: true, until: '2026-08-01T08:00' }, now)).toBe(false)
  })
})

describe('loadModuleWindows', () => {
  beforeEach(() => {
    getDocument.mockReset()
    updateDocument.mockReset()
    createDocument.mockReset()
  })

  it('returns defaults when nothing is stored', async () => {
    getDocument.mockRejectedValue({ code: 404 })
    const map = await loadModuleWindows()
    expect(map).toEqual(defaultModuleMap())
  })

  it('reads saved windows from module_windows', async () => {
    getDocument.mockImplementation(async (_db: string, _col: string, id: string) => {
      if (id === 'module_windows') {
        return settingDoc('module_windows', true, {
          items: {
            erasmus_apply: { enabled: true, from: '2026-08-01T08:00', until: '2026-08-30T18:00' },
            gallery: { enabled: false }
          }
        })
      }
      throw { code: 404 }
    })

    const map = await loadModuleWindows()
    expect(map.erasmus_apply).toEqual({
      enabled: true,
      from: '2026-08-01T08:00',
      until: '2026-08-30T18:00'
    })
    expect(map.gallery.enabled).toBe(false)
    expect(map.document_search.enabled).toBe(true)
  })

  it('seeds Erasmus from legacy setting docs when the new map has no entry', async () => {
    getDocument.mockImplementation(async (_db: string, _col: string, id: string) => {
      if (id === 'module_windows') return settingDoc('module_windows', true, { items: {} })
      if (id === 'erasmus_apply_on') return settingDoc(id, true)
      if (id === 'erasmus_list') return settingDoc(id, true)
      throw { code: 404 }
    })

    const map = await loadModuleWindows()
    expect(map.erasmus_apply.enabled).toBe(true)
    expect(map.erasmus_list.enabled).toBe(true)
  })

  it('ignores broken JSON and keeps defaults', async () => {
    getDocument.mockImplementation(async (_db: string, _col: string, id: string) => {
      if (id === 'module_windows') return { $id: id, setting_status: true, setting_data: '{not-json' }
      throw { code: 404 }
    })
    const map = await loadModuleWindows()
    expect(map.gallery.enabled).toBe(true)
    expect(map.erasmus_apply.enabled).toBe(false)
  })
})

describe('saveModuleWindows', () => {
  beforeEach(() => {
    getDocument.mockReset()
    updateDocument.mockResolvedValue({})
    createDocument.mockResolvedValue({})
  })

  it('stores the map and mirrors live Erasmus flags to legacy docs', async () => {
    const map = defaultModuleMap()
    map.erasmus_apply = { enabled: true, from: '2026-08-01T08:00', until: '2026-08-20T08:00' }
    map.erasmus_list = { enabled: true, from: '2026-09-01T08:00' }

    await saveModuleWindows(map)

    expect(updateDocument).toHaveBeenCalledWith(
      'test_db',
      'settings',
      'module_windows',
      expect.objectContaining({
        setting_status: true,
        setting_data: expect.stringContaining('"erasmus_apply"')
      })
    )

    const legacyCalls = updateDocument.mock.calls.filter((call) => call[2] !== 'module_windows')
    const legacyStatus = Object.fromEntries(legacyCalls.map((call) => [call[2], call[3].setting_status]))
    expect(legacyStatus.erasmus_apply_on).toBe(true)
    expect(legacyStatus.erasmus_list).toBe(false)
  })

  it('creates a missing settings document on 404', async () => {
    updateDocument.mockRejectedValue({ code: 404 })
    await saveModuleWindows(defaultModuleMap())
    expect(createDocument).toHaveBeenCalled()
    expect(createDocument.mock.calls[0][2]).toBe('module_windows')
  })
})
