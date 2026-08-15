import { Databases, Permission, Role } from 'appwrite'
import { appw, config } from '@/appwrite'
import {
  SITE_MODULES,
  defaultModuleMap,
  isWindowOpen,
  type ModuleId,
  type ModuleMap,
  type ModuleWindow
} from './registry'

export {
  SITE_MODULES,
  defaultModuleMap,
  isWindowOpen as isModuleOpen,
  type ModuleId,
  type ModuleMap,
  type ModuleWindow
} from './registry'

export const MODULE_CATALOG = SITE_MODULES

const database = new Databases(appw)
const DOC_ID = 'module_windows'

export function modulePhase(mod: ModuleWindow | undefined, now = new Date()): 'off' | 'scheduled' | 'live' | 'ended' {
  if (!mod?.enabled) return 'off'
  const t = now.getTime()
  if (mod.from) {
    const from = Date.parse(mod.from)
    if (!Number.isNaN(from) && t < from) return 'scheduled'
  }
  if (mod.until) {
    const until = Date.parse(mod.until)
    if (!Number.isNaN(until) && t > until) return 'ended'
  }
  return 'live'
}

function parseMap(raw: string | undefined | null): Partial<Record<string, ModuleWindow>> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed.items === 'object' && parsed.items ? parsed.items : {}
  } catch {
    return {}
  }
}

export async function loadModuleWindows(): Promise<ModuleMap> {
  const next = defaultModuleMap()
  try {
    const legacyIds = SITE_MODULES.map((module) => module.legacySettingId).filter(Boolean) as string[]
    const [doc, ...legacyDocs] = await Promise.all([
      database.getDocument(config.website_db, config.general_settings, DOC_ID).catch(() => null),
      ...legacyIds.map((id) =>
        database.getDocument(config.website_db, config.general_settings, id).catch(() => null)
      )
    ])
    const stored = parseMap(doc?.setting_data)
    SITE_MODULES.forEach((module) => {
      const item = stored[module.id]
      if (item && typeof item === 'object') {
        next[module.id] = {
          enabled: Boolean(item.enabled),
          from: item.from || '',
          until: item.until || ''
        }
      }
    })
    SITE_MODULES.forEach((module) => {
      if (!module.legacySettingId || stored[module.id]) return
      const index = legacyIds.indexOf(module.legacySettingId)
      const legacy = legacyDocs[index]
      if (legacy) next[module.id].enabled = Boolean(legacy.setting_status)
    })
  } catch (error) {
    console.error('Failed to load module windows:', error)
  }
  return next
}

async function writeSetting(id: string, enabled: boolean, data?: string) {
  const payload: Record<string, unknown> = { setting_status: enabled }
  if (data !== undefined) payload.setting_data = data
  try {
    await database.updateDocument(config.website_db, config.general_settings, id, payload)
  } catch (error: any) {
    if (error?.code !== 404) throw error
    await database.createDocument(
      config.website_db,
      config.general_settings,
      id,
      payload,
      [Permission.read(Role.any()), Permission.update(Role.users()), Permission.delete(Role.users())]
    )
  }
}

export async function saveModuleWindows(map: ModuleMap): Promise<void> {
  await writeSetting(DOC_ID, true, JSON.stringify({ items: map }))
  await Promise.all(
    SITE_MODULES
      .filter((module) => module.legacySettingId)
      .map((module) => writeSetting(module.legacySettingId!, isWindowOpen(map[module.id])))
  )
}

export async function isPublicModuleOpen(id: ModuleId, now = new Date()): Promise<boolean> {
  const map = await loadModuleWindows()
  return isWindowOpen(map[id], now)
}
