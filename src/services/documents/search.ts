import { config, listAllDocuments } from '@/appwrite'
import { pickLocalizedTrio } from '@/utils/localizedText'

export type DocLang = 'hu' | 'rs' | 'en'
export type DocSource = 'school' | 'students'
export type SourceFilter = 'all' | DocSource

export interface SearchableDoc {
  id: string
  fileId: string
  titleHu: string
  titleRs: string
  titleEn: string
  categoryIds: string[]
  createdAt: string
  source: DocSource
  archived: boolean
}

export interface SearchCategory {
  id: string
  nameHu: string
  nameRs: string
  nameEn: string
  source: DocSource
  archived: boolean
}

export interface SearchFilters {
  query: string
  categoryId: string
  from: string
  to: string
  source: SourceFilter
}

export interface SearchHit {
  id: string
  fileId: string
  title: string
  categoryName: string
  createdAt: string
  source: DocSource
  editTo: string
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function relationIds(raw: unknown): string[] {
  if (!raw) return []
  if (typeof raw === 'string') return [raw]
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && '$id' in item) return String((item as { $id: string }).$id)
        return ''
      })
      .filter(Boolean)
  }
  if (typeof raw === 'object' && raw && '$id' in raw) {
    return [String((raw as { $id: string }).$id)]
  }
  return []
}

export function displayTitle(doc: SearchableDoc, locale: string, preferred?: '' | DocLang): string {
  return pickLocalizedTrio(doc.titleHu, doc.titleRs, doc.titleEn, preferred || locale) || doc.id
}

export function displayCategoryName(category: SearchCategory | undefined, locale: string): string {
  if (!category) return ''
  return pickLocalizedTrio(category.nameHu, category.nameRs, category.nameEn, locale)
}

function dayStart(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime()
}

function dayEnd(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999).getTime()
}

export function emptyFilters(): SearchFilters {
  return {
    query: '',
    categoryId: '',
    from: '',
    to: '',
    source: 'all'
  }
}

export function filterDocuments(
  docs: SearchableDoc[],
  categories: SearchCategory[],
  filters: SearchFilters,
  locale: string
): SearchHit[] {
  const query = filters.query.trim().toLowerCase()
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))

  return docs
    .filter((doc) => {
      if (doc.archived) return false
      if (filters.source !== 'all' && doc.source !== filters.source) return false

      if (filters.categoryId) {
        if (!doc.categoryIds.includes(filters.categoryId)) return false
      } else {
        const live = doc.categoryIds.some((id) => {
          const cat = categoryMap.get(id)
          return cat && !cat.archived
        })
        if (doc.categoryIds.length > 0 && !live) return false
      }

      const created = new Date(doc.createdAt).getTime()
      if (filters.from && created < dayStart(filters.from)) return false
      if (filters.to && created > dayEnd(filters.to)) return false

      if (query) {
        const hay = `${doc.titleHu} ${doc.titleRs} ${doc.titleEn}`.toLowerCase()
        if (!hay.includes(query)) return false
      }

      return true
    })
    .map((doc) => {
      const firstCat = doc.categoryIds.map((id) => categoryMap.get(id)).find(Boolean)
      return {
        id: doc.id,
        fileId: doc.fileId,
        title: displayTitle(doc, locale),
        categoryName: displayCategoryName(firstCat, locale),
        createdAt: doc.createdAt,
        source: doc.source,
        editTo: doc.source === 'students' ? `/admin/studentdocument/${doc.id}` : `/admin/document/${doc.id}`
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function mapDocument(doc: Record<string, any>, source: DocSource, categoryField: string): SearchableDoc {
  return {
    id: doc.$id,
    fileId: asText(doc.document_id),
    titleHu: asText(doc.document_title_hu),
    titleRs: asText(doc.document_title_rs),
    titleEn: asText(doc.document_title_en),
    categoryIds: relationIds(doc[categoryField]),
    createdAt: doc.$createdAt,
    source,
    archived: Boolean(doc.archived)
  }
}

function mapCategory(doc: Record<string, any>, source: DocSource): SearchCategory {
  return {
    id: doc.$id,
    nameHu: asText(doc.category_name_hu),
    nameRs: asText(doc.category_name_rs),
    nameEn: asText(doc.category_name_en),
    source,
    archived: Boolean(doc.archived)
  }
}

async function loadCollection(
  collectionId: string,
  queries: string[] = []
): Promise<Record<string, any>[]> {
  const result = await listAllDocuments(config.website_db, collectionId, queries)
  return result.documents
}

export async function loadSearchIndex(): Promise<{
  documents: SearchableDoc[]
  categories: SearchCategory[]
  failed: string[]
}> {
  const documents: SearchableDoc[] = []
  const categories: SearchCategory[] = []
  const failed: string[] = []

  const jobs: Array<{
    key: string
    run: () => Promise<void>
  }> = [
    {
      key: 'school_categories',
      run: async () => {
        const rows = await loadCollection(config.document_categories_db)
        categories.push(...rows.map((row) => mapCategory(row, 'school')))
      }
    },
    {
      key: 'school_documents',
      run: async () => {
        const rows = await loadCollection(config.documents_db)
        documents.push(...rows.map((row) => mapDocument(row, 'school', 'documentCategories')))
      }
    },
    {
      key: 'student_categories',
      run: async () => {
        const rows = await loadCollection(config.st_document_categories)
        categories.push(...rows.map((row) => mapCategory(row, 'students')))
      }
    },
    {
      key: 'student_documents',
      run: async () => {
        const rows = await loadCollection(config.st_documents)
        documents.push(...rows.map((row) => mapDocument(row, 'students', 'stDocumentCategories')))
      }
    }
  ]

  await Promise.all(
    jobs.map(async (job) => {
      try {
        await job.run()
      } catch (error) {
        console.error(`Document search failed to load ${job.key}:`, error)
        failed.push(job.key)
      }
    })
  )

  return { documents, categories, failed }
}

export function presetRange(kind: '30' | 'year' | 'last_year'): { from: string; to: string } {
  const now = new Date()
  const to = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-')

  if (kind === '30') {
    const fromDate = new Date(now)
    fromDate.setDate(fromDate.getDate() - 30)
    return {
      from: [
        fromDate.getFullYear(),
        String(fromDate.getMonth() + 1).padStart(2, '0'),
        String(fromDate.getDate()).padStart(2, '0')
      ].join('-'),
      to
    }
  }

  if (kind === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to }
  }

  const year = now.getFullYear() - 1
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}
