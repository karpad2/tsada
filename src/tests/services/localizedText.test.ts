import { describe, expect, it, vi } from 'vitest'
import { normalizeLang, pickLocalized, pickLocalizedTrio } from '@/utils/localizedText'

vi.mock('@/lang', () => ({
  convertifserbian: (text: string) => text
}))

vi.mock('@/stores/loading', () => ({
  useLoadingStore: () => ({ language: 'hu' })
}))

describe('localized titles', () => {
  it('maps sr to rs', () => {
    expect(normalizeLang('sr')).toBe('rs')
    expect(normalizeLang('hu')).toBe('hu')
  })

  it('does not show empty HU as English', () => {
    const title = pickLocalized(
      { title_hu: '', title_rs: 'Naslov', title_en: 'Title' },
      ['title'],
      'hu'
    )
    expect(title).toBe('Naslov')
  })

  it('uses requested language when present', () => {
    expect(pickLocalizedTrio('Magyar', 'Srpski', 'English', 'hu')).toBe('Magyar')
  })

  it('falls back instead of disappearing', () => {
    expect(pickLocalizedTrio('', '', 'English', 'sr')).toBe('English')
    expect(pickLocalizedTrio('', '', '', 'hu')).toBe('')
  })
})
