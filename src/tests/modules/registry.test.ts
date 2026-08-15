import { describe, expect, it } from 'vitest'
import {
  SITE_MODULES,
  defaultModuleMap,
  flagsFromWindows,
  getSiteModule,
  isMenuSettingOpen,
  isWindowOpen,
  moduleIdForPath
} from '@/services/modules/registry'

const now = new Date('2026-08-15T10:00:00')

describe('module catalog', () => {
  it('has unique ids, labels and menu settings', () => {
    const ids = SITE_MODULES.map((module) => module.id)
    const settings = SITE_MODULES.map((module) => module.menuSetting).filter(Boolean)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(settings).size).toBe(settings.length)
    expect(SITE_MODULES.every((module) => module.labelKey && module.helpKey)).toBe(true)
    expect(getSiteModule('gallery')?.publicPaths).toContain('/gallery')
    expect(getSiteModule('missing' as never)).toBeUndefined()
  })

  it('builds an isolated default map from catalog defaults', () => {
    const first = defaultModuleMap()
    first.gallery.enabled = false
    first.erasmus_apply.enabled = true

    const second = defaultModuleMap()
    expect(second.gallery.enabled).toBe(true)
    expect(second.erasmus_apply.enabled).toBe(false)
    expect(second.document_search.enabled).toBe(true)
    expect(second.erasmus_list.enabled).toBe(false)
  })

  it('turns windows into live flags', () => {
    const flags = flagsFromWindows({
      ...defaultModuleMap(),
      erasmus_apply: { enabled: true, from: '2026-08-01T08:00', until: '2026-08-20T08:00' },
      gallery: { enabled: true, from: '2026-09-01T08:00' },
      document_search: { enabled: false }
    }, now)

    expect(flags.erasmus_apply).toBe(true)
    expect(flags.erasmus_list).toBe(false)
    expect(flags.gallery).toBe(false)
    expect(flags.document_search).toBe(false)
  })

  it('treats invalid dates as no bound', () => {
    expect(isWindowOpen({ enabled: true, from: 'not-a-date', until: 'also-bad' }, now)).toBe(true)
    expect(isWindowOpen(undefined, now)).toBe(false)
  })

  it('maps menu settings and public paths from the catalog', () => {
    const flags = flagsFromWindows({
      ...defaultModuleMap(),
      erasmus_apply: { enabled: true },
      gallery: { enabled: false }
    }, now)

    expect(isMenuSettingOpen(undefined, flags)).toBe(true)
    expect(isMenuSettingOpen('erasmus-apply', flags)).toBe(true)
    expect(isMenuSettingOpen('gallery', flags)).toBe(false)
    expect(isMenuSettingOpen('unknown-setting', flags)).toBe(true)
    expect(moduleIdForPath('/erasmus/apply')).toBe('erasmus_apply')
    expect(moduleIdForPath('/erasmus/results')).toBe('erasmus_list')
    expect(moduleIdForPath('/documents/search?src=students')).toBe('document_search')
    expect(moduleIdForPath('/album/123')).toBeNull()
  })
})
