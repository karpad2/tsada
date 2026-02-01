/**
 * ERP Service
 * Diákok, tantárgyak, szakok, tanmenetek kezelése
 */

import { Databases, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';
import { loadRelations, erpRelations } from '@/appwrite/relationHelper';

const ERP_DB = config.erp_db;

// ============================================
// INTERFACES
// ============================================

export interface Subject {
  $id?: string;
  name_hu: string;
  name_rs: string;
  subject_code?: number;
}

export interface StudyProgram {
  $id?: string;
  study_program_name_hu: string;
  study_program_name_rs: string;
  study_program_internal_name?: string;
  duration_years?: number;
  language?: string;
}

export interface StudyProgramSubject {
  $id?: string;
  subjects?: Subject | string;
  studyPrograms?: StudyProgram | string;
  subject?: Subject; // Expanded relationship
  studyProgram?: StudyProgram; // Expanded relationship
  year: number; // 1, 2, 3, 4
}

export interface ForeignLanguage {
  $id?: string;
  name_hu: string;
  name_rs: string;
}

export interface ReligionOption {
  $id?: string;
  name_hu: string;
  name_rs: string;
}

export interface Generation {
  $id?: string;
  year_start: number;
  year_end: number;
  name?: string;
}

export interface Place {
  $id?: string;
  place_hu: string;
  place_rs: string;
  municipality_hu?: string;
  municipality_rs?: string;
  country_hu?: string;
  country_rs?: string;
}

export interface SchoolYear {
  $id?: string;
  year_start: number;
  year_end: number;
  name?: string;
}

// ============================================
// ERP SERVICE CLASS
// ============================================

export class ErpService {
  private static instance: ErpService;
  private databases: Databases;

  private constructor() {
    this.databases = new Databases(appw);
  }

  static getInstance(): ErpService {
    if (!ErpService.instance) {
      ErpService.instance = new ErpService();
    }
    return ErpService.instance;
  }

  // ============================================
  // SUBJECTS (Tantárgyak)
  // ============================================

  async getSubjects(limit = 100, offset = 0): Promise<{ subjects: Subject[]; total: number }> {
    try {
      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_subjects,
        [
          Query.orderAsc('subject_code'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      return {
        subjects: result.documents as unknown as Subject[],
        total: result.total
      };
    } catch (error) {
      console.error('Failed to get subjects:', error);
      return { subjects: [], total: 0 };
    }
  }

  async getSubject(id: string): Promise<Subject | null> {
    try {
      const doc = await this.databases.getDocument(ERP_DB, config.erp_subjects, id);
      return doc as unknown as Subject;
    } catch (error) {
      console.error('Failed to get subject:', error);
      return null;
    }
  }

  async createSubject(subject: Omit<Subject, '$id'>): Promise<Subject | null> {
    try {
      const doc = await this.databases.createDocument(
        ERP_DB,
        config.erp_subjects,
        ID.unique(),
        subject
      );
      return doc as unknown as Subject;
    } catch (error) {
      console.error('Failed to create subject:', error);
      return null;
    }
  }

  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject | null> {
    try {
      const doc = await this.databases.updateDocument(
        ERP_DB,
        config.erp_subjects,
        id,
        subject
      );
      return doc as unknown as Subject;
    } catch (error) {
      console.error('Failed to update subject:', error);
      return null;
    }
  }

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(ERP_DB, config.erp_subjects, id);
      return true;
    } catch (error) {
      console.error('Failed to delete subject:', error);
      return false;
    }
  }

  // ============================================
  // STUDY PROGRAMS (Szakok/Tanmenetek)
  // ============================================

  async getStudyPrograms(limit = 100): Promise<{ programs: StudyProgram[]; total: number }> {
    try {
      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_study_programs,
        [Query.limit(limit)]
      );
      return {
        programs: result.documents as unknown as StudyProgram[],
        total: result.total
      };
    } catch (error) {
      console.error('Failed to get study programs:', error);
      return { programs: [], total: 0 };
    }
  }

  async getStudyProgram(id: string): Promise<StudyProgram | null> {
    try {
      const doc = await this.databases.getDocument(ERP_DB, config.erp_study_programs, id);
      return doc as unknown as StudyProgram;
    } catch (error) {
      console.error('Failed to get study program:', error);
      return null;
    }
  }

  async createStudyProgram(program: Omit<StudyProgram, '$id'>): Promise<StudyProgram | null> {
    try {
      const doc = await this.databases.createDocument(
        ERP_DB,
        config.erp_study_programs,
        ID.unique(),
        program
      );
      return doc as unknown as StudyProgram;
    } catch (error) {
      console.error('Failed to create study program:', error);
      return null;
    }
  }

  async updateStudyProgram(id: string, program: Partial<StudyProgram>): Promise<StudyProgram | null> {
    try {
      const doc = await this.databases.updateDocument(
        ERP_DB,
        config.erp_study_programs,
        id,
        program
      );
      return doc as unknown as StudyProgram;
    } catch (error) {
      console.error('Failed to update study program:', error);
      return null;
    }
  }

  async deleteStudyProgram(id: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(ERP_DB, config.erp_study_programs, id);
      return true;
    } catch (error) {
      console.error('Failed to delete study program:', error);
      return false;
    }
  }

  // ============================================
  // STUDY PROGRAM SUBJECTS (Szak-Tantárgy összerendelés)
  // ============================================

  async getStudyProgramSubjects(studyProgramId?: string, year?: number): Promise<StudyProgramSubject[]> {
    try {
      const queries: string[] = [Query.limit(200)];

      if (studyProgramId) {
        queries.push(Query.equal('studyPrograms', studyProgramId));
      }
      if (year) {
        queries.push(Query.equal('year', year));
      }

      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_study_program_subjects,
        queries
      );

      // Betöltjük a szak-tantárgy összerendelés relációit
      const docsWithRelations = await loadRelations(result.documents, erpRelations.studyProgramSubjects);
      return docsWithRelations as unknown as StudyProgramSubject[];
    } catch (error) {
      console.error('Failed to get study program subjects:', error);
      return [];
    }
  }

  async addSubjectToProgram(studyProgramId: string, subjectId: string, year: number): Promise<StudyProgramSubject | null> {
    try {
      const doc = await this.databases.createDocument(
        ERP_DB,
        config.erp_study_program_subjects,
        ID.unique(),
        {
          studyPrograms: studyProgramId,
          subjects: subjectId,
          year
        }
      );
      return doc as unknown as StudyProgramSubject;
    } catch (error) {
      console.error('Failed to add subject to program:', error);
      return null;
    }
  }

  async removeSubjectFromProgram(id: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(ERP_DB, config.erp_study_program_subjects, id);
      return true;
    } catch (error) {
      console.error('Failed to remove subject from program:', error);
      return false;
    }
  }

  // ============================================
  // HELPER DATA (Languages, Religions, etc.)
  // ============================================

  async getForeignLanguages(): Promise<ForeignLanguage[]> {
    try {
      const result = await this.databases.listDocuments(ERP_DB, config.erp_foreign_languages);
      return result.documents as unknown as ForeignLanguage[];
    } catch (error) {
      console.error('Failed to get foreign languages:', error);
      return [];
    }
  }

  async getReligionOptions(): Promise<ReligionOption[]> {
    try {
      const result = await this.databases.listDocuments(ERP_DB, config.erp_religion_options);
      return result.documents as unknown as ReligionOption[];
    } catch (error) {
      console.error('Failed to get religion options:', error);
      return [];
    }
  }

  async getGenerations(): Promise<Generation[]> {
    try {
      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_generations,
        [Query.orderDesc('year_start')]
      );
      return result.documents as unknown as Generation[];
    } catch (error) {
      console.error('Failed to get generations:', error);
      return [];
    }
  }

  async getPlaces(): Promise<Place[]> {
    try {
      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_places,
        [Query.orderAsc('place_hu')]
      );
      return result.documents as unknown as Place[];
    } catch (error) {
      console.error('Failed to get places:', error);
      return [];
    }
  }

  async getSchoolYears(): Promise<SchoolYear[]> {
    try {
      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_school_years,
        [Query.orderDesc('year_start')]
      );
      return result.documents as unknown as SchoolYear[];
    } catch (error) {
      console.error('Failed to get school years:', error);
      return [];
    }
  }

  // ============================================
  // CREATE HELPER DATA
  // ============================================

  async createPlace(place: Omit<Place, '$id'>): Promise<Place | null> {
    try {
      const doc = await this.databases.createDocument(
        ERP_DB,
        config.erp_places,
        ID.unique(),
        place
      );
      return doc as unknown as Place;
    } catch (error) {
      console.error('Failed to create place:', error);
      return null;
    }
  }

  async createGeneration(generation: Omit<Generation, '$id'>): Promise<Generation | null> {
    try {
      const doc = await this.databases.createDocument(
        ERP_DB,
        config.erp_generations,
        ID.unique(),
        generation
      );
      return doc as unknown as Generation;
    } catch (error) {
      console.error('Failed to create generation:', error);
      return null;
    }
  }

  async createSchoolYear(schoolYear: Omit<SchoolYear, '$id'>): Promise<SchoolYear | null> {
    try {
      const doc = await this.databases.createDocument(
        ERP_DB,
        config.erp_school_years,
        ID.unique(),
        schoolYear
      );
      return doc as unknown as SchoolYear;
    } catch (error) {
      console.error('Failed to create school year:', error);
      return null;
    }
  }
}

export default ErpService;
