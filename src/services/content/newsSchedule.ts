import { Databases, Permission, Role } from 'appwrite'
import { appw, config } from '@/appwrite'

const database = new Databases(appw)
const DOC_ID = 'news_schedule'

export interface NewsWindow {
  from?: string
  until?: string
}

type ScheduleMap = Record<string, NewsWindow>

function parseMap(raw: string | undefined | null): ScheduleMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed.items === 'object' && parsed.items ? parsed.items : {}
  } catch {
    return {}
  }
}

export async function loadNewsSchedule(): Promise<ScheduleMap> {
  try {
    const doc = await database.getDocument(config.website_db, config.general_settings, DOC_ID)
    return parseMap(doc.setting_data)
  } catch (error: any) {
    if (error?.code !== 404) console.error('Failed to load news schedule:', error)
    return {}
  }
}

async function saveMap(items: ScheduleMap): Promise<void> {
  const payload = { setting_status: true, setting_data: JSON.stringify({ items }) }
  try {
    await database.updateDocument(config.website_db, config.general_settings, DOC_ID, payload)
  } catch (error: any) {
    if (error?.code !== 404) throw error
    await database.createDocument(
      config.website_db,
      config.general_settings,
      DOC_ID,
      payload,
      [Permission.read(Role.any()), Permission.update(Role.users()), Permission.delete(Role.users())]
    )
  }
}

export async function setNewsSchedule(newsId: string, window: NewsWindow): Promise<void> {
  const items = await loadNewsSchedule()
  if (!window.from && !window.until) delete items[newsId]
  else items[newsId] = { from: window.from || '', until: window.until || '' }
  await saveMap(items)
}

export function isNewsLive(newsId: string, visible: boolean, schedule: ScheduleMap, now = new Date()): boolean {
  if (!visible) return false
  const window = schedule[newsId]
  if (!window || (!window.from && !window.until)) return true
  const t = now.getTime()
  if (window.from) {
    const from = Date.parse(window.from)
    if (!Number.isNaN(from) && t < from) return false
  }
  if (window.until) {
    const until = Date.parse(window.until)
    if (!Number.isNaN(until) && t > until) return false
  }
  return true
}
