/**
 * Print Template Service
 * Nyomtatási sablonok kezelése - évfolyam és szak alapján
 *
 * A főkönyv nyomtatásnál minden évfolyamnak külön oszlopa van,
 * és csak az adott év adatait kell nyomtatni (a korábbi évek már rajta vannak)
 */

import { Databases, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';

const ERP_DB = config.erp_db;

// ============================================
// INTERFACES
// ============================================

/**
 * Egy mező pozíciója a nyomtatáson
 */
export interface FieldPosition {
  /** Mező azonosító (pl. 'student_name', 'grade_math') */
  fieldId: string;
  /** Megjelenített név */
  label: string;
  /** X pozíció mm-ben */
  x: number;
  /** Y pozíció mm-ben */
  y: number;
  /** Betűméret pt-ben */
  fontSize: number;
  /** Betűköz mm-ben (opcionális, karakterenkénti nyomtatáshoz) */
  letterSpacing?: number;
  /** Maximális szélesség mm-ben (szöveg töréshez) */
  maxWidth?: number;
  /** Igazítás: left, center, right */
  align?: 'left' | 'center' | 'right';
}

/**
 * Tantárgy jegy pozíció a táblázatban
 */
export interface SubjectGradePosition {
  /** Tantárgy ID (az erp_subjects collection-ből) */
  subjectId: string;
  /** Tantárgy neve (megjelenítéshez) */
  subjectName: string;
  /** Sor index a táblázatban (0-tól) */
  rowIndex: number;
  /** X pozíció a jegy oszlopban mm-ben */
  gradeX: number;
  /** Y pozíció mm-ben (alap + rowIndex * rowHeight) */
  baseY: number;
}

/**
 * Jegytáblázat konfiguráció
 */
export interface GradesTableConfig {
  /** Táblázat kezdő X pozíció mm-ben */
  startX: number;
  /** Táblázat kezdő Y pozíció mm-ben */
  startY: number;
  /** Sor magasság mm-ben */
  rowHeight: number;
  /** Jegy oszlop X pozíciója (relatív a startX-hez) */
  gradeColumnOffsetX: number;
  /** Betűméret a jegyekhez */
  fontSize: number;
  /** Tantárgyak sorrendje és pozíciói */
  subjects: SubjectGradePosition[];
}

/**
 * Nyomtatási sablon - egy szak egy évfolyamához
 */
export interface PrintTemplate {
  $id?: string;
  /** Sablon neve (pl. "Elektrotechnikai - 1. évfolyam") */
  name: string;
  /** Szak ID (study_program) - ha null, akkor általános sablon */
  studyProgramId: string | null;
  /**
   * Évfolyam (0, 1, 2, 3, 4)
   * 0 = beiratkozási sablon (üres főkönyv alap adatokkal)
   * 1-4 = évfolyam sablonok (jegyek pozíciói)
   */
  year: number;
  /**
   * Dokumentum típus:
   * - 'grade_book_base': Üres főkönyv sablon (beiratkozáskor nyomtatandó alap adatok)
   * - 'grade_book_year': Évfolyam jegyek (1-4. év oszlopai)
   * - 'certificate': Bizonyítvány
   * - 'enrollment': Beiratkozási lap
   * - 'custom': Egyéb
   */
  documentType: 'grade_book_base' | 'grade_book_year' | 'certificate' | 'enrollment' | 'custom';
  /** Papírméret */
  paperSize: {
    width: number;
    height: number;
    name: string;
  };
  /** Általános mezők pozíciói */
  fields: FieldPosition[];
  /** Jegytáblázat konfiguráció (csak grade_book_year típusnál) */
  gradesTable?: GradesTableConfig;
  /** Globális eltolás (finomhangoláshoz) */
  globalOffset: {
    x: number;
    y: number;
  };
  /** Létrehozás/módosítás időpontja */
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sablon keresési feltételek
 */
export interface TemplateSearchCriteria {
  studyProgramId?: string;
  year?: number;
  documentType?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

export class PrintTemplateService {
  private databases: Databases;

  constructor() {
    this.databases = new Databases(appw);
  }

  /**
   * Sablon lekérése szak és évfolyam alapján
   * Ha nincs specifikus sablon, az általános sablont adja vissza
   */
  async getTemplate(
    studyProgramId: string | null,
    year: number,
    documentType: string = 'grade_book'
  ): Promise<PrintTemplate | null> {
    try {
      // Először keresünk specifikus sablont a szakhoz
      if (studyProgramId) {
        const specific = await this.databases.listDocuments(
          ERP_DB,
          config.erp_print_templates,
          [
            Query.equal('studyProgramId', studyProgramId),
            Query.equal('year', year),
            Query.equal('documentType', documentType),
            Query.limit(1)
          ]
        );

        if (specific.documents.length > 0) {
          return this.parseTemplate(specific.documents[0]);
        }
      }

      // Ha nincs specifikus, keresünk általános sablont (studyProgramId = null)
      const general = await this.databases.listDocuments(
        ERP_DB,
        config.erp_print_templates,
        [
          Query.isNull('studyProgramId'),
          Query.equal('year', year),
          Query.equal('documentType', documentType),
          Query.limit(1)
        ]
      );

      if (general.documents.length > 0) {
        return this.parseTemplate(general.documents[0]);
      }

      return null;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  /**
   * Összes sablon lekérése (szerkesztőhöz)
   */
  async getAllTemplates(): Promise<PrintTemplate[]> {
    try {
      const result = await this.databases.listDocuments(
        ERP_DB,
        config.erp_print_templates,
        [Query.orderAsc('documentType'), Query.orderAsc('year'), Query.limit(100)]
      );

      return result.documents.map(doc => this.parseTemplate(doc));
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Sablon mentése (létrehozás vagy frissítés)
   */
  async saveTemplate(template: PrintTemplate): Promise<PrintTemplate | null> {
    try {
      const data = {
        name: template.name,
        studyProgramId: template.studyProgramId,
        year: template.year,
        documentType: template.documentType,
        paperSize: JSON.stringify(template.paperSize),
        fields: JSON.stringify(template.fields),
        gradesTable: template.gradesTable ? JSON.stringify(template.gradesTable) : null,
        globalOffset: JSON.stringify(template.globalOffset),
        updatedAt: new Date().toISOString()
      };

      if (template.$id) {
        // Frissítés
        const doc = await this.databases.updateDocument(
          ERP_DB,
          config.erp_print_templates,
          template.$id,
          data
        );
        return this.parseTemplate(doc);
      } else {
        // Létrehozás
        const doc = await this.databases.createDocument(
          ERP_DB,
          config.erp_print_templates,
          ID.unique(),
          {
            ...data,
            createdAt: new Date().toISOString()
          }
        );
        return this.parseTemplate(doc);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      return null;
    }
  }

  /**
   * Sablon törlése
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(
        ERP_DB,
        config.erp_print_templates,
        templateId
      );
      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }

  /**
   * Sablon duplikálása (másik évfolyamra/szakra)
   */
  async duplicateTemplate(
    templateId: string,
    newStudyProgramId: string | null,
    newYear: number,
    newName: string
  ): Promise<PrintTemplate | null> {
    try {
      const original = await this.databases.getDocument(
        ERP_DB,
        config.erp_print_templates,
        templateId
      );

      const parsed = this.parseTemplate(original);
      parsed.$id = undefined;
      parsed.name = newName;
      parsed.studyProgramId = newStudyProgramId;
      parsed.year = newYear;

      return await this.saveTemplate(parsed);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      return null;
    }
  }

  /**
   * Alapértelmezett sablon létrehozása (ha még nincs)
   */
  getDefaultTemplate(year: number, documentType: PrintTemplate['documentType'] = 'grade_book_year'): PrintTemplate {
    if (documentType === 'grade_book_base' || year === 0) {
      return this.getDefaultBaseTemplate();
    }

    return {
      name: `Általános főkönyv - ${year}. évfolyam`,
      studyProgramId: null,
      year,
      documentType: 'grade_book_year',
      paperSize: {
        width: 420,
        height: 297,
        name: 'A3 Fekvő'
      },
      fields: this.getDefaultYearFields(year),
      gradesTable: this.getDefaultGradesTable(year),
      globalOffset: { x: 0, y: 0 }
    };
  }

  /**
   * Alapértelmezett ALAP sablon (beiratkozáskor - üres főkönyv)
   * Tartalmazza a diák állandó adatait
   */
  private getDefaultBaseTemplate(): PrintTemplate {
    return {
      name: 'Főkönyv alap (beiratkozás)',
      studyProgramId: null,
      year: 0,
      documentType: 'grade_book_base',
      paperSize: {
        width: 420,
        height: 297,
        name: 'A3 Fekvő'
      },
      fields: [
        // Fejléc - diák alapadatai
        { fieldId: 'student_name', label: 'Diák neve', x: 50, y: 15, fontSize: 12 },
        { fieldId: 'birth_date', label: 'Születési dátum', x: 50, y: 25, fontSize: 10 },
        { fieldId: 'birth_place', label: 'Születési hely', x: 120, y: 25, fontSize: 10 },
        { fieldId: 'mother_name', label: 'Anyja neve', x: 50, y: 35, fontSize: 10 },
        { fieldId: 'jmbg', label: 'JMBG', x: 200, y: 35, fontSize: 10, letterSpacing: 3 },
        { fieldId: 'study_program', label: 'Szak', x: 50, y: 45, fontSize: 10 },
        { fieldId: 'enrollment_date', label: 'Beiratkozás dátuma', x: 200, y: 45, fontSize: 10 },
        { fieldId: 'enrollment_number', label: 'Anyakönyvi szám', x: 300, y: 15, fontSize: 10 },
        { fieldId: 'school_name', label: 'Iskola neve', x: 150, y: 5, fontSize: 11, align: 'center' }
      ],
      globalOffset: { x: 0, y: 0 }
    };
  }

  /**
   * Alapértelmezett évfolyam mezők (jegyek oszlopa)
   */
  private getDefaultYearFields(year: number): FieldPosition[] {
    // Oszlop pozíciók évfolyamonként (A3 fekvő lapon)
    const columnOffsets: Record<number, number> = {
      1: 30,   // 1. év oszlop kezdete
      2: 130,  // 2. év oszlop kezdete
      3: 230,  // 3. év oszlop kezdete
      4: 330   // 4. év oszlop kezdete
    };

    const baseX = columnOffsets[year] || 30;

    return [
      { fieldId: 'school_year', label: 'Tanév', x: baseX + 10, y: 55, fontSize: 9 },
      { fieldId: 'class_name', label: 'Osztály', x: baseX + 50, y: 55, fontSize: 9 },
      { fieldId: 'class_teacher', label: 'Osztályfőnök', x: baseX + 10, y: 62, fontSize: 8 },
      { fieldId: 'final_grade', label: 'Tanulmányi átlag', x: baseX + 10, y: 250, fontSize: 10 },
      { fieldId: 'absences_total', label: 'Össz. mulasztás', x: baseX + 10, y: 258, fontSize: 9 },
      { fieldId: 'absences_justified', label: 'Igazolt', x: baseX + 50, y: 258, fontSize: 9 },
      { fieldId: 'absences_unjustified', label: 'Igazolatlan', x: baseX + 70, y: 258, fontSize: 9 },
      { fieldId: 'behavior', label: 'Magatartás', x: baseX + 10, y: 266, fontSize: 9 },
      { fieldId: 'diligence', label: 'Szorgalom', x: baseX + 50, y: 266, fontSize: 9 },
      { fieldId: 'date', label: 'Keltezés', x: baseX + 10, y: 280, fontSize: 9 },
      { fieldId: 'director_signature', label: 'Igazgató', x: baseX + 60, y: 280, fontSize: 8 }
    ];
  }

  /**
   * Alapértelmezett jegytáblázat konfiguráció
   */
  private getDefaultGradesTable(year: number): GradesTableConfig {
    const columnOffsets: Record<number, number> = {
      1: 30,
      2: 130,
      3: 230,
      4: 330
    };

    const baseX = columnOffsets[year] || 30;

    return {
      startX: baseX,
      startY: 75,
      rowHeight: 7,
      gradeColumnOffsetX: 70,
      fontSize: 10,
      subjects: []  // Ezt a TemplateEditor-ban töltjük ki a tantárgyak alapján
    };
  }

  /**
   * Appwrite dokumentum -> PrintTemplate konverzió
   */
  private parseTemplate(doc: any): PrintTemplate {
    return {
      $id: doc.$id,
      name: doc.name,
      studyProgramId: doc.studyProgramId,
      year: doc.year,
      documentType: doc.documentType,
      paperSize: typeof doc.paperSize === 'string' ? JSON.parse(doc.paperSize) : doc.paperSize,
      fields: typeof doc.fields === 'string' ? JSON.parse(doc.fields) : doc.fields,
      gradesTable: doc.gradesTable
        ? (typeof doc.gradesTable === 'string' ? JSON.parse(doc.gradesTable) : doc.gradesTable)
        : undefined,
      globalOffset: typeof doc.globalOffset === 'string' ? JSON.parse(doc.globalOffset) : doc.globalOffset,
      createdAt: doc.createdAt || doc.$createdAt,
      updatedAt: doc.updatedAt || doc.$updatedAt
    };
  }
}

export default new PrintTemplateService();
