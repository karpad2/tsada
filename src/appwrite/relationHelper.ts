/**
 * Relation Helper - Appwrite relációk betöltése
 *
 * Az Appwrite újabb verzióiban a relációk gyakran csak ID-kat adnak vissza,
 * nem a teljes nested dokumentumokat. Ez a helper batch-ben tölti be őket
 * (N+1 elkerülése).
 */

import { Query } from 'appwrite'
import { databases, config, MAX_LIST_LIMIT } from './index'

export interface RelationConfig {
  /** A mező neve a dokumentumban (pl. 'workers', 'courses', 'gallery') */
  field: string
  /** A collection ID ahol a kapcsolt dokumentumok vannak */
  collectionId: string
  /** A database ID (alapértelmezett: website_db) */
  databaseId?: string
}

/** Collect relation ids from a field value (string | string[] | null). */
function collectIds(value: unknown): string[] {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === 'string') return v
        if (v && typeof v === 'object' && '$id' in v) return String((v as { $id: string }).$id)
        return null
      })
      .filter((id): id is string => !!id)
  }
  if (typeof value === 'object' && value !== null && '$id' in value) {
    return [String((value as { $id: string }).$id)]
  }
  return []
}

/** Appwrite Query.equal array size is limited — chunk large id lists. */
async function fetchByIds(
  databaseId: string,
  collectionId: string,
  ids: string[]
): Promise<Map<string, any>> {
  const map = new Map<string, any>()
  if (!ids.length) return map

  const unique = [...new Set(ids)]
  const chunkSize = Math.min(MAX_LIST_LIMIT, 100)

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    try {
      const result = await databases.listDocuments(databaseId, collectionId, [
        Query.equal('$id', chunk),
        Query.limit(chunk.length)
      ])
      for (const doc of result.documents) {
        map.set(doc.$id, doc)
      }
    } catch (error) {
      console.error(`Failed to load relation chunk for ${collectionId}:`, error)
    }
  }

  return map
}

/**
 * Betölti a kapcsolt dokumentumokat egy dokumentum listához (batch).
 */
export async function loadRelations<T extends Record<string, any>>(
  documents: T[],
  relations: RelationConfig[]
): Promise<T[]> {
  if (!documents.length || !relations.length) {
    return documents
  }

  const relationMaps = new Map<string, Map<string, any>>()

  await Promise.all(
    relations.map(async (rel) => {
      const ids = documents.flatMap((doc) => collectIds(doc[rel.field]))
      if (ids.length === 0) {
        relationMaps.set(rel.field, new Map())
        return
      }

      const dbId = rel.databaseId || config.website_db
      const map = await fetchByIds(dbId, rel.collectionId, ids)
      relationMaps.set(rel.field, map)
    })
  )

  return documents.map((doc) => {
    const enrichedDoc = { ...doc }

    for (const rel of relations) {
      const map = relationMaps.get(rel.field)
      if (!map) continue

      const raw = doc[rel.field]
      if (Array.isArray(raw)) {
        enrichedDoc[rel.field] = raw.map((item) => {
          const id =
            typeof item === 'string'
              ? item
              : item && typeof item === 'object' && '$id' in item
                ? String(item.$id)
                : null
          return id ? map.get(id) || item : item
        })
      } else {
        const ids = collectIds(raw)
        if (ids.length === 1) {
          enrichedDoc[rel.field] = map.get(ids[0]) || null
        }
      }
    }

    return enrichedDoc
  })
}

/**
 * Betölti egyetlen dokumentum relációit
 */
export async function loadRelationsForDocument<T extends Record<string, any>>(
  document: T,
  relations: RelationConfig[]
): Promise<T> {
  const results = await loadRelations([document], relations)
  return results[0]
}

/**
 * Előre definiált reláció konfigurációk gyakran használt collection-ökhöz
 */
export const commonRelations = {
  classes: [
    { field: 'workers', collectionId: config.workers },
    { field: 'courses', collectionId: config.courselist }
  ] as RelationConfig[],

  documents: [
    { field: 'documentCategories', collectionId: config.document_categories_db }
  ] as RelationConfig[],

  albumImages: [
    { field: 'gallery', collectionId: config.gallery }
  ] as RelationConfig[],

  workers: [
    { field: 'roles', collectionId: config.roles_db }
  ] as RelationConfig[],

  services: [
    { field: 'workers', collectionId: config.workers }
  ] as RelationConfig[],

  parliamentMembers: [
    { field: 'classList', collectionId: config.classlist }
  ] as RelationConfig[],

  parentsCouncil: [
    { field: 'classList', collectionId: config.classlist }
  ] as RelationConfig[]
}

/**
 * ERP-specifikus reláció konfigurációk
 */
export const erpRelations = {
  students: [
    { field: 'birth_place', collectionId: config.erp_places, databaseId: config.erp_db },
    { field: 'foreign_language', collectionId: config.erp_foreign_languages, databaseId: config.erp_db },
    { field: 'religion_option', collectionId: config.erp_religion_options, databaseId: config.erp_db },
    { field: 'study_program', collectionId: config.erp_study_programs, databaseId: config.erp_db },
    { field: 'generation', collectionId: config.erp_generations, databaseId: config.erp_db }
  ] as RelationConfig[],

  studentGrades: [
    { field: 'student', collectionId: config.erp_students, databaseId: config.erp_db },
    { field: 'subject', collectionId: config.erp_subjects, databaseId: config.erp_db },
    { field: 'school_year', collectionId: config.erp_school_years, databaseId: config.erp_db }
  ] as RelationConfig[],

  studyProgramSubjects: [
    { field: 'subjects', collectionId: config.erp_subjects, databaseId: config.erp_db },
    { field: 'studyPrograms', collectionId: config.erp_study_programs, databaseId: config.erp_db }
  ] as RelationConfig[],

  studentEnrollments: [
    { field: 'student', collectionId: config.erp_students, databaseId: config.erp_db },
    { field: 'school_year', collectionId: config.erp_school_years, databaseId: config.erp_db },
    { field: 'study_program', collectionId: config.erp_study_programs, databaseId: config.erp_db }
  ] as RelationConfig[]
}

export default {
  loadRelations,
  loadRelationsForDocument,
  commonRelations,
  erpRelations
}
