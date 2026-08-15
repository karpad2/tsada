import type { MenuCondition } from '@/types/MenuTypes'

export type ModuleId = 'erasmus_apply' | 'erasmus_list' | 'gallery' | 'document_search'
export type MenuSetting = NonNullable<MenuCondition['setting']>
export type AdminRole = 'admin' | 'editor' | 'teacher' | 'photographer' | 'secretary'

export interface ModuleWindow {
  enabled: boolean
  from?: string
  until?: string
}

export type ModuleMap = Record<ModuleId, ModuleWindow>

export interface SiteModule {
  id: ModuleId
  labelKey: string
  helpKey: string
  defaultEnabled: boolean
  menuSetting?: MenuSetting
  publicPaths?: string[]
  legacySettingId?: string
  admin?: {
    to: string
    titleKey: string
    descKey: string
    icon: string
    tone: string
    roles: AdminRole[]
    group: 'content' | 'school' | 'communication' | 'system'
  }
}

export const SITE_MODULES: SiteModule[] = [
  {
    id: 'erasmus_apply',
    labelKey: 'erasmus_apply',
    helpKey: 'module_help_erasmus_apply',
    defaultEnabled: false,
    menuSetting: 'erasmus-apply',
    publicPaths: ['/erasmus/apply'],
    legacySettingId: 'erasmus_apply_on',
    admin: {
      to: '/admin/erasmus/applies',
      titleKey: 'erasmus_applies',
      descKey: 'dash_desc_erasmus',
      icon: 'mdi-airplane',
      tone: 'indigo',
      roles: ['admin', 'editor'],
      group: 'school'
    }
  },
  {
    id: 'erasmus_list',
    labelKey: 'erasmus_applies_result',
    helpKey: 'module_help_erasmus_list',
    defaultEnabled: false,
    menuSetting: 'erasmus-list',
    publicPaths: ['/erasmus/results'],
    legacySettingId: 'erasmus_list'
  },
  {
    id: 'gallery',
    labelKey: 'gallery',
    helpKey: 'module_help_gallery',
    defaultEnabled: true,
    menuSetting: 'gallery',
    publicPaths: ['/gallery'],
    admin: {
      to: '/admin/gallery-approval',
      titleKey: 'gal_approval_title',
      descKey: 'dash_desc_gallery_approval',
      icon: 'mdi-image-check',
      tone: 'amber',
      roles: ['admin', 'editor'],
      group: 'content'
    }
  },
  {
    id: 'document_search',
    labelKey: 'docsearch_title',
    helpKey: 'module_help_document_search',
    defaultEnabled: true,
    menuSetting: 'document-search',
    publicPaths: ['/documents/search']
  }
]

export const MODULE_IDS = SITE_MODULES.map((module) => module.id)

export function getSiteModule(id: ModuleId): SiteModule | undefined {
  return SITE_MODULES.find((module) => module.id === id)
}

export function defaultModuleMap(): ModuleMap {
  return SITE_MODULES.reduce((map, module) => {
    map[module.id] = { enabled: module.defaultEnabled, from: '', until: '' }
    return map
  }, {} as ModuleMap)
}

export function flagsFromWindows(map: ModuleMap, now = new Date()): Record<ModuleId, boolean> {
  return SITE_MODULES.reduce((flags, module) => {
    flags[module.id] = isWindowOpen(map[module.id], now)
    return flags
  }, {} as Record<ModuleId, boolean>)
}

export function isWindowOpen(mod: ModuleWindow | undefined, now = new Date()): boolean {
  if (!mod?.enabled) return false
  const t = now.getTime()
  if (mod.from) {
    const from = Date.parse(mod.from)
    if (!Number.isNaN(from) && t < from) return false
  }
  if (mod.until) {
    const until = Date.parse(mod.until)
    if (!Number.isNaN(until) && t > until) return false
  }
  return true
}

export function isMenuSettingOpen(
  setting: string | undefined,
  flags: Partial<Record<ModuleId, boolean>>
): boolean {
  if (!setting) return true
  const module = SITE_MODULES.find((item) => item.menuSetting === setting)
  if (!module) return true
  return flags[module.id] !== false
}

export function moduleIdForPath(path: string): ModuleId | null {
  const clean = path.split('?')[0]
  const match = SITE_MODULES.find((module) =>
    (module.publicPaths || []).some((item) => clean === item || clean.startsWith(`${item}/`))
  )
  return match?.id || null
}
