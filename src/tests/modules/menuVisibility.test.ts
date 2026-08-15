import { describe, expect, it } from 'vitest'
import menu from '@/config/menu.json'
import { SITE_MODULES } from '@/services/modules/registry'
import { menuConfigService } from '@/services/navigation/MenuConfigService'
import { defaultModuleMap, flagsFromWindows } from '@/services/modules/registry'
import type { NavigationData } from '@/services/navigation/NavigationService'
import type { MenuGroupDefinition, MenuItemDefinition } from '@/types/MenuTypes'

function collectSettings(items: Array<MenuGroupDefinition | MenuItemDefinition>): string[] {
  const found: string[] = []
  const walk = (node: MenuGroupDefinition | MenuItemDefinition) => {
    if (node.condition?.setting) found.push(node.condition.setting)
    const children = 'items' in node ? node.items : node.children
    children?.forEach((child) => walk(child))
  }
  items.forEach((item) => walk(item))
  return found
}

function collectTo(groups: ReturnType<typeof menuConfigService.resolveMenu>): string[] {
  const found: string[] = []
  const walk = (item: { to?: string; children?: Array<{ to?: string; children?: unknown[] }> }) => {
    if (item.to) found.push(item.to)
    item.children?.forEach((child) => walk(child as never))
  }
  groups.forEach((group) => {
    if (!group.visible) return
    if (group.to) found.push(group.to)
    group.items.forEach((item) => walk(item))
  })
  return found
}

function navData(overrides: Partial<ReturnType<typeof flagsFromWindows>> = {}): NavigationData {
  const moduleFlags = {
    ...flagsFromWindows(defaultModuleMap(), new Date('2026-08-15T10:00:00')),
    ...overrides
  }
  return {
    documentCategories: [],
    aboutItems: [],
    erasmusItems: [{ id: 'proj1', title: 'Erasmus projekt' }],
    studentItems: [],
    moduleFlags,
    erasmusSettings: {
      list_enabled: moduleFlags.erasmus_list,
      apply_enabled: moduleFlags.erasmus_apply,
      gallery_enabled: moduleFlags.gallery,
      document_search_enabled: moduleFlags.document_search,
      eu_funding_enabled: false
    }
  }
}

describe('menu module wiring', () => {
  it('keeps menu.json settings in sync with the catalog', () => {
    const inMenu = new Set(collectSettings(menu as MenuGroupDefinition[]))
    const inCatalog = SITE_MODULES.map((module) => module.menuSetting).filter(Boolean) as string[]

    inCatalog.forEach((setting) => {
      expect(inMenu.has(setting), `${setting} is in the catalog but missing from menu.json`).toBe(true)
    })
    inMenu.forEach((setting) => {
      expect(inCatalog.includes(setting), `${setting} is in menu.json but missing from the catalog`).toBe(true)
    })
  })

  it('hides public module links when the window is closed', () => {
    const groups = menuConfigService.resolveMenu(
      menuConfigService.getEffectiveRegistry(),
      navData({
        erasmus_apply: false,
        erasmus_list: false,
        gallery: false,
        document_search: false
      }),
      false,
      null,
      (key) => key,
      'hu',
      { logout: () => undefined }
    )

    const links = collectTo(groups)
    expect(links).not.toContain('/gallery')
    expect(links).not.toContain('/erasmus/apply')
    expect(links).not.toContain('/erasmus/results')
    expect(links).not.toContain('/documents/search')
    expect(links).not.toContain('/documents/search?src=students')
  })

  it('shows public module links when they are live', () => {
    const groups = menuConfigService.resolveMenu(
      menuConfigService.getEffectiveRegistry(),
      navData({
        erasmus_apply: true,
        erasmus_list: true,
        gallery: true,
        document_search: true
      }),
      false,
      null,
      (key) => key,
      'hu',
      { logout: () => undefined }
    )

    const links = collectTo(groups)
    expect(links).toContain('/gallery')
    expect(links).toContain('/erasmus/apply')
    expect(links).toContain('/erasmus/results')
    expect(links).toContain('/documents/search')
    expect(links).toContain('/documents/search?src=students')
  })

  it('keeps staff-only Erasmus admin out of the public menu', () => {
    const publicMenu = menuConfigService.resolveMenu(
      menuConfigService.getEffectiveRegistry(),
      navData({ erasmus_apply: true }),
      false,
      null,
      (key) => key,
      'hu',
      { logout: () => undefined }
    )
    const staffMenu = menuConfigService.resolveMenu(
      menuConfigService.getEffectiveRegistry(),
      navData({ erasmus_apply: true }),
      true,
      'admin',
      (key) => key,
      'hu',
      { logout: () => undefined }
    )

    expect(collectTo(publicMenu)).not.toContain('/admin/erasmus/applies')
    expect(collectTo(staffMenu)).toContain('/admin/erasmus/applies')
  })
})
