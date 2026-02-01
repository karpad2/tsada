/**
 * Relation Helper - Appwrite relációk betöltése
 *
 * Az Appwrite újabb verzióiban a relációk csak ID-kat adnak vissza,
 * nem a teljes nested dokumentumokat. Ez a helper segít betölteni
 * a kapcsolt dokumentumokat.
 */

import { Databases, Query } from 'appwrite';
import { appw, config } from './index';

const databases = new Databases(appw);

export interface RelationConfig {
  /** A mező neve a dokumentumban (pl. 'workers', 'courses', 'gallery') */
  field: string;
  /** A collection ID ahol a kapcsolt dokumentumok vannak */
  collectionId: string;
  /** A database ID (alapértelmezett: website_db) */
  databaseId?: string;
}

/**
 * Betölti a kapcsolt dokumentumokat egy dokumentum listához
 *
 * @param documents - A dokumentumok listája
 * @param relations - A betöltendő relációk konfigurációja
 * @returns A dokumentumok a betöltött relációkkal
 *
 * @example
 * ```ts
 * const classesWithRelations = await loadRelations(classes, [
 *   { field: 'workers', collectionId: config.workers },
 *   { field: 'courses', collectionId: config.courselist }
 * ]);
 * ```
 */
export async function loadRelations<T extends Record<string, any>>(
  documents: T[],
  relations: RelationConfig[]
): Promise<T[]> {
  if (!documents.length || !relations.length) {
    return documents;
  }

  // Összegyűjtjük az összes egyedi ID-t minden relációhoz
  const relationMaps = new Map<string, Map<string, any>>();

  await Promise.all(
    relations.map(async (rel) => {
      const ids = [...new Set(
        documents
          .map(doc => doc[rel.field])
          .filter(id => id && typeof id === 'string')
      )];

      if (ids.length === 0) {
        relationMaps.set(rel.field, new Map());
        return;
      }

      try {
        const dbId = rel.databaseId || config.website_db;
        const result = await databases.listDocuments(
          dbId,
          rel.collectionId,
          [Query.equal('$id', ids), Query.limit(ids.length)]
        );

        const map = new Map(result.documents.map(doc => [doc.$id, doc]));
        relationMaps.set(rel.field, map);
      } catch (error) {
        console.error(`Failed to load relations for ${rel.field}:`, error);
        relationMaps.set(rel.field, new Map());
      }
    })
  );

  // Hozzárendeljük a betöltött dokumentumokat
  return documents.map(doc => {
    const enrichedDoc = { ...doc };

    for (const rel of relations) {
      const map = relationMaps.get(rel.field);
      const id = doc[rel.field];

      if (map && id && typeof id === 'string') {
        enrichedDoc[rel.field] = map.get(id) || null;
      }
    }

    return enrichedDoc;
  });
}

/**
 * Betölti egyetlen dokumentum relációit
 *
 * @param document - A dokumentum
 * @param relations - A betöltendő relációk konfigurációja
 * @returns A dokumentum a betöltött relációkkal
 */
export async function loadRelationsForDocument<T extends Record<string, any>>(
  document: T,
  relations: RelationConfig[]
): Promise<T> {
  const results = await loadRelations([document], relations);
  return results[0];
}

/**
 * Előre definiált reláció konfigurációk gyakran használt collection-ökhöz
 */
export const commonRelations = {
  /** Osztályok relációi */
  classes: [
    { field: 'workers', collectionId: config.workers },
    { field: 'courses', collectionId: config.courselist }
  ] as RelationConfig[],

  /** Dokumentumok kategória relációja */
  documents: [
    { field: 'documentCategories', collectionId: config.document_categories_db }
  ] as RelationConfig[],

  /** Album képek galéria relációja */
  albumImages: [
    { field: 'gallery', collectionId: config.gallery }
  ] as RelationConfig[],

  /** Munkavállalók szerepkör relációja */
  workers: [
    { field: 'roles', collectionId: config.roles_db }
  ] as RelationConfig[],

  /** Szolgáltatások munkavállalóinak relációja */
  services: [
    { field: 'workers', collectionId: config.workers }
  ] as RelationConfig[],

  /** Parlament tagok osztály relációja */
  parliamentMembers: [
    { field: 'classList', collectionId: config.classlist }
  ] as RelationConfig[],

  /** Szülői tanács osztály relációja */
  parentsCouncil: [
    { field: 'classList', collectionId: config.classlist }
  ] as RelationConfig[]
};

/**
 * ERP-specifikus reláció konfigurációk
 */
export const erpRelations = {
  /** Diákok relációi */
  students: [
    { field: 'birth_place', collectionId: config.erp_places, databaseId: config.erp_db },
    { field: 'foreign_language', collectionId: config.erp_foreign_languages, databaseId: config.erp_db },
    { field: 'religion_option', collectionId: config.erp_religion_options, databaseId: config.erp_db },
    { field: 'study_program', collectionId: config.erp_study_programs, databaseId: config.erp_db },
    { field: 'generation', collectionId: config.erp_generations, databaseId: config.erp_db }
  ] as RelationConfig[],

  /** Diák jegyek relációi */
  studentGrades: [
    { field: 'student', collectionId: config.erp_students, databaseId: config.erp_db },
    { field: 'subject', collectionId: config.erp_subjects, databaseId: config.erp_db },
    { field: 'school_year', collectionId: config.erp_school_years, databaseId: config.erp_db }
  ] as RelationConfig[],

  /** Szak-tantárgy összerendelés relációi */
  studyProgramSubjects: [
    { field: 'subjects', collectionId: config.erp_subjects, databaseId: config.erp_db },
    { field: 'studyPrograms', collectionId: config.erp_study_programs, databaseId: config.erp_db }
  ] as RelationConfig[],

  /** Diák beiratkozások relációi */
  studentEnrollments: [
    { field: 'student', collectionId: config.erp_students, databaseId: config.erp_db },
    { field: 'school_year', collectionId: config.erp_school_years, databaseId: config.erp_db },
    { field: 'study_program', collectionId: config.erp_study_programs, databaseId: config.erp_db }
  ] as RelationConfig[]
};

export default {
  loadRelations,
  loadRelationsForDocument,
  commonRelations,
  erpRelations
};
