import { config, listAllDocuments } from '@/appwrite'

export type AuditLang = 'hu' | 'rs' | 'en'

export interface AuditSource {
  key: string
  labelKey: string
  collection: string
  editPath: (id: string) => string
  titleFields: Record<AuditLang, string>
  bodyFields?: Record<AuditLang, string>
}

export interface AuditFinding {
  id: string
  source: string
  sourceLabelKey: string
  title: string
  visible?: boolean
  missingTitles: AuditLang[]
  missingBodies: AuditLang[]
  editTo: string
  severity: 'critical' | 'optional'
}

export interface AuditSummary {
  scanned: number
  complete: number
  critical: number
  optional: number
  missingByLang: Record<AuditLang, number>
  failedSources: string[]
}

const LANGS: AuditLang[] = ['hu', 'rs', 'en']

function textOf(doc: Record<string, any>, field?: string): string {
  if (!field) return ''
  const value = doc[field]
  return typeof value === 'string' ? value.trim() : ''
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
}

export function auditSources(): AuditSource[] {
  return [
    {
      key: 'pages',
      labelKey: 'audit_source_pages',
      collection: config.about_us_db,
      editPath: (id) => `/admin/edit/about/${id}`,
      titleFields: { hu: 'title_hu', rs: 'title_rs', en: 'title_en' },
      bodyFields: { hu: 'text_hu', rs: 'text_rs', en: 'text_en' }
    },
    {
      key: 'gallery',
      labelKey: 'audit_source_gallery',
      collection: config.gallery,
      editPath: (id) => `/admin/gallery-edit/${id}`,
      titleFields: { hu: 'title_hu', rs: 'title_rs', en: 'title_en' },
      bodyFields: { hu: 'short_hu', rs: 'short_rs', en: 'short_en' }
    },
    {
      key: 'documents',
      labelKey: 'audit_source_documents',
      collection: config.documents_db,
      editPath: (id) => `/admin/document/${id}`,
      titleFields: { hu: 'document_title_hu', rs: 'document_title_rs', en: 'document_title_en' }
    },
    {
      key: 'text_documents',
      labelKey: 'audit_source_text_documents',
      collection: config.text_documents,
      editPath: (id) => `/admin/text-document-editor/${id}`,
      titleFields: { hu: 'document_title_hu', rs: 'document_title_rs', en: 'document_title_en' }
    },
    {
      key: 'student_documents',
      labelKey: 'audit_source_student_documents',
      collection: config.st_documents,
      editPath: (id) => `/admin/studentdocument/${id}`,
      titleFields: { hu: 'document_title_hu', rs: 'document_title_rs', en: 'document_title_en' }
    }
  ]
}

function displayTitle(doc: Record<string, any>, source: AuditSource): string {
  return (
    textOf(doc, source.titleFields.hu) ||
    textOf(doc, source.titleFields.rs) ||
    textOf(doc, source.titleFields.en) ||
    doc.$id
  )
}

export function inspectDocument(doc: Record<string, any>, source: AuditSource): AuditFinding {
  const missingTitles: AuditLang[] = []
  const missingBodies: AuditLang[] = []

  for (const lang of LANGS) {
    if (!textOf(doc, source.titleFields[lang])) missingTitles.push(lang)
    if (source.bodyFields) {
      const body = stripHtml(textOf(doc, source.bodyFields[lang]))
      if (!body) missingBodies.push(lang)
    }
  }

  const criticalMissing = missingTitles.filter((lang) => lang !== 'en').length > 0
    || (source.bodyFields ? missingBodies.filter((lang) => lang !== 'en').length > 0 : false)

  return {
    id: doc.$id,
    source: source.key,
    sourceLabelKey: source.labelKey,
    title: displayTitle(doc, source),
    visible: typeof doc.visible === 'boolean' ? doc.visible : undefined,
    missingTitles,
    missingBodies,
    editTo: source.editPath(doc.$id),
    severity: criticalMissing ? 'critical' : 'optional'
  }
}

export function summarizeFindings(findings: AuditFinding[], scanned: number, failedSources: string[] = []): AuditSummary {
  const incomplete = findings.filter((item) => item.missingTitles.length || item.missingBodies.length)
  const missingByLang: Record<AuditLang, number> = { hu: 0, rs: 0, en: 0 }

  incomplete.forEach((item) => {
    const langs = new Set<AuditLang>([...item.missingTitles, ...item.missingBodies])
    langs.forEach((lang) => {
      missingByLang[lang] += 1
    })
  })

  return {
    scanned,
    complete: scanned - incomplete.length,
    critical: incomplete.filter((item) => item.severity === 'critical').length,
    optional: incomplete.filter((item) => item.severity === 'optional').length,
    missingByLang,
    failedSources
  }
}

export async function runContentAudit(): Promise<{ findings: AuditFinding[]; summary: AuditSummary }> {
  const findings: AuditFinding[] = []
  const failedSources: string[] = []
  let scanned = 0

  for (const source of auditSources()) {
    try {
      const result = await listAllDocuments(config.website_db, source.collection)
      scanned += result.documents.length
      result.documents.forEach((doc) => {
        const finding = inspectDocument(doc, source)
        if (finding.missingTitles.length || finding.missingBodies.length) {
          findings.push(finding)
        }
      })
    } catch (error) {
      console.error(`Content audit failed for ${source.key}:`, error)
      failedSources.push(source.key)
    }
  }

  findings.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1
    return a.title.localeCompare(b.title, 'hu')
  })

  return {
    findings,
    summary: summarizeFindings(findings, scanned, failedSources)
  }
}
