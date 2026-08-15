import { convertifserbian } from '@/lang'
import { useLoadingStore } from '@/stores/loading'

export type UiLang = 'hu' | 'rs' | 'en'

export function normalizeLang(lang?: string | null): UiLang {
  if (lang === 'hu') return 'hu'
  if (lang === 'en') return 'en'
  return 'rs'
}

export function currentUiLang(): UiLang {
  try {
    return normalizeLang(useLoadingStore().language)
  } catch {
    return 'hu'
  }
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function present(value: string, lang: UiLang): string {
  return lang === 'rs' ? convertifserbian(value) : value
}

/**
 * Pick a non-empty localized string.
 * Order: requested language, then HU, RS, EN. Never returns English
 * just because the requested field exists but is empty.
 */
export function pickLocalized(
  source: Record<string, any> | null | undefined,
  prefixes: string[] = ['title', 'name', 'document_title', 'category_name'],
  lang?: string | null
): string {
  if (!source) return ''
  const wanted = normalizeLang(lang ?? currentUiLang())
  const order: UiLang[] = [wanted, 'hu', 'rs', 'en'].filter(
    (code, index, all) => all.indexOf(code) === index
  )

  for (const code of order) {
    for (const prefix of prefixes) {
      const value =
        asText(source[`${prefix}_${code}`]) ||
        asText(source[`${prefix}-${code}`])
      if (value) return present(value, code)
    }
    const direct = asText(source[code])
    if (direct) return present(direct, code)
  }

  return ''
}

export function pickLocalizedTrio(
  hu?: unknown,
  rs?: unknown,
  en?: unknown,
  lang?: string | null
): string {
  return pickLocalized(
    { title_hu: hu, title_rs: rs, title_en: en },
    ['title'],
    lang
  )
}
