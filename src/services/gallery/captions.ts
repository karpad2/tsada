import { Databases, Permission, Role } from 'appwrite'
import { appw, config } from '@/appwrite'
import { pickLocalizedTrio } from '@/utils/localizedText'

const database = new Databases(appw)
const DOC_ID = 'gallery_captions'

export interface ImageCaption {
  hu?: string
  rs?: string
  en?: string
}

type CaptionMap = Record<string, ImageCaption>

function parseMap(raw: string | undefined | null): CaptionMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed.items === 'object' && parsed.items ? parsed.items : {}
  } catch {
    return {}
  }
}

export async function loadCaptions(): Promise<CaptionMap> {
  try {
    const doc = await database.getDocument(config.website_db, config.general_settings, DOC_ID)
    return parseMap(doc.setting_data)
  } catch (error: any) {
    if (error?.code !== 404) console.error('Failed to load gallery captions:', error)
    return {}
  }
}

export async function saveCaption(imageDocId: string, caption: ImageCaption): Promise<CaptionMap> {
  const items = await loadCaptions()
  const next = {
    hu: (caption.hu || '').trim(),
    rs: (caption.rs || '').trim(),
    en: (caption.en || '').trim()
  }
  if (!next.hu && !next.rs && !next.en) delete items[imageDocId]
  else items[imageDocId] = next
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
  return items
}

export function captionText(caption: ImageCaption | undefined, lang?: string): string {
  if (!caption) return ''
  return pickLocalizedTrio(caption.hu, caption.rs, caption.en, lang)
}
