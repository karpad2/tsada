import { describe, expect, it, vi } from 'vitest'
import {
  emptyFilters,
  filterDocuments,
  type SearchableDoc,
  type SearchCategory
} from '@/services/documents/search'

vi.mock('@/lang', () => ({
  convertifserbian: (text: string) => text
}))

const categories: SearchCategory[] = [
  { id: 'cat-school', nameHu: 'Határozatok', nameRs: 'Odluke', nameEn: 'Decisions', source: 'school', archived: false },
  { id: 'cat-old', nameHu: 'Régi', nameRs: 'Staro', nameEn: 'Old', source: 'school', archived: true },
  { id: 'cat-st', nameHu: 'Diák', nameRs: 'Učenici', nameEn: 'Students', source: 'students', archived: false }
]

const docs: SearchableDoc[] = [
  {
    id: '1',
    fileId: 'file-1',
    titleHu: 'Igazgatói határozat',
    titleRs: 'Direktorska odluka',
    titleEn: '',
    categoryIds: ['cat-school'],
    createdAt: '2026-03-10T10:00:00.000Z',
    source: 'school',
    archived: false
  },
  {
    id: '2',
    fileId: 'file-2',
    titleHu: '',
    titleRs: 'English only missing',
    titleEn: 'Procurement plan',
    categoryIds: ['cat-school'],
    createdAt: '2025-11-02T10:00:00.000Z',
    source: 'school',
    archived: false
  },
  {
    id: '3',
    fileId: 'file-3',
    titleHu: 'Archivált',
    titleRs: '',
    titleEn: '',
    categoryIds: ['cat-old'],
    createdAt: '2026-01-01T10:00:00.000Z',
    source: 'school',
    archived: false
  },
  {
    id: '4',
    fileId: 'file-4',
    titleHu: 'Diák szabályzat',
    titleRs: 'Pravilnik',
    titleEn: '',
    categoryIds: ['cat-st'],
    createdAt: '2026-08-01T10:00:00.000Z',
    source: 'students',
    archived: false
  }
]

describe('document search filters', () => {
  it('filters by category and hides archived categories', () => {
    const all = filterDocuments(docs, categories, emptyFilters(), 'hu')
    expect(all.map((hit) => hit.id)).toEqual(['4', '1', '2'])

    const byCat = filterDocuments(docs, categories, { ...emptyFilters(), categoryId: 'cat-school' }, 'hu')
    expect(byCat.map((hit) => hit.id)).toEqual(['1', '2'])
  })

  it('filters by date range, source and title query', () => {
    const hits = filterDocuments(
      docs,
      categories,
      { ...emptyFilters(), from: '2026-01-01', to: '2026-12-31', source: 'school', query: 'határozat' },
      'hu'
    )
    expect(hits).toHaveLength(1)
    expect(hits[0].id).toBe('1')
    expect(hits[0].categoryName).toBe('Határozatok')
  })
})
