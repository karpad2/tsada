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
  /** Ha true, a mező áthúzva jelenik meg nyomtatáskor (ha nincs adat) */
  strikethrough?: boolean;
  /** Áthúzás szélessége mm-ben (alapértelmezett: maxWidth vagy 30mm) */
  strikethroughWidth?: number;
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
   * - 'grade_book_matura': Érettségi vizsga szekció
   * - 'grade_book_certificates': Oklevelek/bizonyítványok szekció
   * - 'certificate': Bizonyítvány
   * - 'enrollment': Beiratkozási lap
   * - 'custom': Egyéb
   */
  documentType: 'grade_book_base' | 'grade_book_year' | 'grade_book_matura' | 'grade_book_certificates' | 'certificate' | 'enrollment' | 'custom';
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
  /** Űrlap nyelvi variáns: kétnyelvű (szerb+magyar) vagy egynyelvű (szerb) */
  formLanguage?: 'bilingual' | 'serbian';
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
    documentType: string = 'grade_book',
    formLanguage: 'bilingual' | 'serbian' = 'bilingual'
  ): Promise<PrintTemplate | null> {
    try {
      // Először keresünk specifikus sablont a szakhoz
      if (studyProgramId) {
        const queries = [
          Query.equal('studyProgramId', studyProgramId),
          Query.equal('year', year),
          Query.equal('documentType', documentType),
          Query.limit(1)
        ];
        // formLanguage szűrő - ha van ilyen mező az adatbázisban
        queries.push(Query.equal('formLanguage', formLanguage));

        const specific = await this.databases.listDocuments(
          ERP_DB,
          config.erp_print_templates,
          queries
        );

        if (specific.documents.length > 0) {
          return this.parseTemplate(specific.documents[0]);
        }

        // Fallback: próbáljuk formLanguage nélkül (régi sablonok kompatibilitás)
        const specificNoLang = await this.databases.listDocuments(
          ERP_DB,
          config.erp_print_templates,
          [
            Query.equal('studyProgramId', studyProgramId),
            Query.equal('year', year),
            Query.equal('documentType', documentType),
            Query.limit(1)
          ]
        );

        if (specificNoLang.documents.length > 0) {
          return this.parseTemplate(specificNoLang.documents[0]);
        }
      }

      // Ha nincs specifikus, keresünk általános sablont (studyProgramId = null)
      const generalQueries = [
        Query.isNull('studyProgramId'),
        Query.equal('year', year),
        Query.equal('documentType', documentType),
        Query.limit(1)
      ];
      generalQueries.push(Query.equal('formLanguage', formLanguage));

      const general = await this.databases.listDocuments(
        ERP_DB,
        config.erp_print_templates,
        generalQueries
      );

      if (general.documents.length > 0) {
        return this.parseTemplate(general.documents[0]);
      }

      // Fallback: formLanguage nélkül (régi sablonok)
      const generalNoLang = await this.databases.listDocuments(
        ERP_DB,
        config.erp_print_templates,
        [
          Query.isNull('studyProgramId'),
          Query.equal('year', year),
          Query.equal('documentType', documentType),
          Query.limit(1)
        ]
      );

      if (generalNoLang.documents.length > 0) {
        return this.parseTemplate(generalNoLang.documents[0]);
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
        formLanguage: template.formLanguage || 'bilingual',
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

    if (documentType === 'grade_book_matura') {
      return this.getDefaultMaturaTemplate();
    }

    if (documentType === 'grade_book_certificates') {
      return this.getDefaultCertificatesTemplate();
    }

    return {
      name: `Általános főkönyv - ${year}. évfolyam`,
      studyProgramId: null,
      year,
      documentType: 'grade_book_year',
      paperSize: {
        width: 297,
        height: 420,
        name: 'A3 Álló'
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
        width: 297,
        height: 420,
        name: 'A3 Álló'
      },
      fields: [
        // Fejléc - "број" bal felső sarok, "Број у регистру" középen, "JMB" jobb oldalon
        { fieldId: 'enrollmentNumber', label: 'Број / Szám', x: 15.0, y: 14.0, fontSize: 10 },
        { fieldId: 'registryNumber', label: 'Број у регистру / Belső sorszám', x: 78.0, y: 14.0, fontSize: 10 },
        { fieldId: 'jmbg', label: 'JMB', x: 187.0, y: 14.0, fontSize: 9, letterSpacing: 2.2 },
        // Diák neve - egy sorban szerb + magyar (a képen: "Варга Даниела / Varga Daniella")
        { fieldId: 'studentNameRs', label: 'Diák neve (szerb)', x: 15.0, y: 32.0, fontSize: 11 },
        { fieldId: 'studentName', label: 'Diák neve (magyar)', x: 148.0, y: 32.0, fontSize: 11 },
        // Születési hely/dátum sor
        { fieldId: 'birthDate', label: 'Születési dátum', x: 15.0, y: 38.5, fontSize: 9 },
        { fieldId: 'birthPlaceRs', label: 'Születési hely (szerb)', x: 70.0, y: 38.5, fontSize: 9 },
        { fieldId: 'birthPlace', label: 'Születési hely (magyar)', x: 160.0, y: 38.5, fontSize: 9 },
        // Szülők neve sor
        { fieldId: 'fatherName', label: 'Apa neve', x: 15.0, y: 45.0, fontSize: 9 },
        { fieldId: 'motherName', label: 'Anya neve', x: 175.0, y: 45.0, fontSize: 9 },
        // Szak / képzési profil sorok
        { fieldId: 'studyProgramRs', label: 'Szak (szerb)', x: 15.0, y: 52.0, fontSize: 9 },
        { fieldId: 'studyProgram', label: 'Szak (magyar)', x: 15.0, y: 58.0, fontSize: 9 },
        { fieldId: 'educationType', label: 'Képzés típusa (rendes/rendkívüli)', x: 100.0, y: 64.0, fontSize: 8 },
        { fieldId: 'educationDuration', label: 'Képzés időtartama', x: 215.0, y: 64.0, fontSize: 8 },
        // Beiratkozás adatai
        { fieldId: 'enrollmentDate', label: 'Beiratkozás dátuma', x: 15.0, y: 64.0, fontSize: 9 },
        { fieldId: 'generation', label: 'Generáció / évfolyam', x: 60.0, y: 64.0, fontSize: 8 },
        // Szülő adatai (a képen: alul az "érdeklődő szülő" címe)
        { fieldId: 'parentName', label: 'Szülő neve', x: 15.0, y: 70.0, fontSize: 9 },
        { fieldId: 'parentAddress', label: 'Szülő címe', x: 100.0, y: 70.0, fontSize: 9 },
        { fieldId: 'parentPhone', label: 'Szülő telefonszáma', x: 200.0, y: 70.0, fontSize: 9 },
        // Egyéb opciók
        { fieldId: 'foreignLanguage', label: 'Idegen nyelv', x: 15.0, y: 76.0, fontSize: 8 },
        { fieldId: 'religionOption', label: 'Hittan/Polgári', x: 100.0, y: 76.0, fontSize: 8 }
      ],
      globalOffset: { x: 0, y: 0 }
    };
  }

  /**
   * Alapértelmezett érettségi sablon
   */
  private getDefaultMaturaTemplate(): PrintTemplate {
    return {
      name: 'Főkönyv érettségi',
      studyProgramId: null,
      year: 4,
      documentType: 'grade_book_matura',
      paperSize: {
        width: 297,
        height: 420,
        name: 'A3 Álló'
      },
      fields: [
        // "Ученик-ца је полагао-ла / A tanuló" fejléc sor
        // A képen: "року школске / vizsgaidőszakban a  2024/25  године/годіне..."
        { fieldId: 'maturaSchoolYear', label: 'Tanév (року школске)', x: 125.0, y: 230.0, fontSize: 8 },
        { fieldId: 'maturaYear', label: 'Vizsgaidőszak éve', x: 175.0, y: 230.0, fontSize: 8 },
        { fieldId: 'maturaClassYear', label: 'Évfolyam ...ás, -es, -ös tanévben', x: 220.0, y: 236.0, fontSize: 8 },
        // Érettségi tárgyak (kétnyelvű: "На матурском испиту полагао-на је..." sor utáni sorok)
        // Bal oldalon tárgy neve, jobb oldalon () jegy szám és () szöveges
        { fieldId: 'maturaSubject1Name', label: '1. tárgy neve', x: 15.0, y: 255.0, fontSize: 8 },
        { fieldId: 'maturaSubject1Grade', label: '1. tárgy jegy', x: 210.0, y: 255.0, fontSize: 9 },
        { fieldId: 'maturaSubject2Name', label: '2. tárgy neve', x: 15.0, y: 262.0, fontSize: 8 },
        { fieldId: 'maturaSubject2Grade', label: '2. tárgy jegy', x: 210.0, y: 262.0, fontSize: 9 },
        { fieldId: 'maturaSubject3Name', label: '3. tárgy neve (szakmai-elméleti)', x: 15.0, y: 269.0, fontSize: 8 },
        { fieldId: 'maturaSubject3Grade', label: '3. tárgy jegy', x: 210.0, y: 269.0, fontSize: 9 },
        // "На матурском испиту - érettségi vizsgán" - gyakorlati rész
        { fieldId: 'maturaPracticalDesc', label: 'Gyakorlati vizsga leírás', x: 15.0, y: 282.0, fontSize: 8 },
        { fieldId: 'maturaPracticalGrade', label: 'Gyakorlati jegy', x: 210.0, y: 282.0, fontSize: 9 },
        // "и добио оцену / és osztályzatot kapott" sor
        { fieldId: 'maturaFinalGrade', label: 'Végső jegy (szám+szöveg)', x: 120.0, y: 295.0, fontSize: 9 },
        // "Ученик је положио-на / A tanuló a(z)" - eredmény sor
        { fieldId: 'maturaResult', label: 'Eredménnyel tette le (успехом)', x: 175.0, y: 305.0, fontSize: 9 },
        { fieldId: 'maturaDate', label: 'Keltezés', x: 15.0, y: 305.0, fontSize: 8 }
      ],
      globalOffset: { x: 0, y: 0 }
    };
  }

  /**
   * Alapértelmezett oklevelek/bizonyítványok sablon
   */
  private getDefaultCertificatesTemplate(): PrintTemplate {
    return {
      name: 'Főkönyv oklevelek',
      studyProgramId: null,
      year: 4,
      documentType: 'grade_book_certificates',
      paperSize: {
        width: 297,
        height: 420,
        name: 'A3 Álló'
      },
      fields: [
        // "Деловодни број и датум дипломе / Az oklevél iktatószáma és keltezése"
        { fieldId: 'diplomaNumber', label: 'Oklevél iktatószám + dátum', x: 15.0, y: 318.0, fontSize: 8 },
        { fieldId: 'diplomaDate', label: 'Oklevél keltezés', x: 160.0, y: 318.0, fontSize: 8 },
        // "Деловодни број и датум уверења / A bizonylat iktatószáma és keltezése"
        { fieldId: 'certificateNumber', label: 'Bizonylat iktatószám', x: 15.0, y: 326.0, fontSize: 8 },
        { fieldId: 'certificateDate', label: 'Bizonylat keltezés', x: 160.0, y: 326.0, fontSize: 8 },
        // "Серијски број дипломе - уверења / Az oklevél-bizonylat sorozatszáma"
        { fieldId: 'serialNumber', label: 'Sorozatszám', x: 15.0, y: 334.0, fontSize: 8 },
        // Jobb oldalon: aláírások ("Одељенски старешина / Osztályfőnök", "Председник испитне комисије")
        { fieldId: 'classTeacherSign', label: 'Osztályfőnök', x: 195.0, y: 318.0, fontSize: 8 },
        { fieldId: 'examCommitteeChair', label: 'Vizsgabizottság elnöke', x: 195.0, y: 328.0, fontSize: 8 },
        // "Примио-ла дипломе - уверење / Átvette az oklevelet - bizonylatot"
        { fieldId: 'receivedSignature', label: 'Átvette (aláírás)', x: 15.0, y: 345.0, fontSize: 8 },
        { fieldId: 'receivedDate', label: 'Átvétel dátuma', x: 160.0, y: 345.0, fontSize: 8 },
        // "НАПОМЕНЕ / MEGJEGYZÉSEK"
        { fieldId: 'notes', label: 'Megjegyzések', x: 15.0, y: 358.0, fontSize: 8, maxWidth: 265 }
      ],
      globalOffset: { x: 0, y: 0 }
    };
  }

  /**
   * Alapértelmezett évfolyam mezők (jegyek oszlopa)
   */
  private getDefaultYearFields(year: number): FieldPosition[] {
    // Oszlop pozíciók évfolyamonként (A3 álló lapon - 297mm széles)
    // A képek alapján: a 4 év oszlopai a tantárgy nevek után, ~30mm szélesek
    const columnOffsets: Record<number, number> = {
      1: 148.0,  // 1. év oszlop kezdete
      2: 178.0,  // 2. év oszlop kezdete
      3: 208.0,  // 3. év oszlop kezdete
      4: 238.0   // 4. év oszlop kezdete
    };

    const baseX = columnOffsets[year] || 148.0;

    return [
      // Fejléc mezők (a tantárgy táblázat fölötti "Школска година" sorban)
      { fieldId: 'schoolYear', label: 'Tanév', x: baseX, y: 83.0, fontSize: 7 },
      { fieldId: 'className', label: 'Osztály (разр./oszt.)', x: baseX, y: 89.5, fontSize: 7 },
      // Alul: Vladanje/Magaviselet szekció (hátlap teteje, de azonos lapon)
      { fieldId: 'behaviorText', label: 'Vladanje/Magaviselet', x: baseX, y: 320.0, fontSize: 7 },
      { fieldId: 'generalSuccess', label: 'Általános siker / Opšti uspeh', x: baseX, y: 328.0, fontSize: 7 },
      { fieldId: 'finalGrade', label: 'Átlagosztályzat / Prosečna ocena', x: baseX, y: 335.0, fontSize: 8 },
      { fieldId: 'absencesTotal', label: 'Össz. mulasztás', x: baseX, y: 342.0, fontSize: 7 },
      { fieldId: 'absencesJustified', label: 'Igazolt', x: baseX + 12.0, y: 342.0, fontSize: 7 },
      { fieldId: 'absencesUnjustified', label: 'Igazolatlan', x: baseX + 22.0, y: 342.0, fontSize: 7 },
      { fieldId: 'classTeacher', label: 'Osztályfőnök', x: baseX, y: 350.0, fontSize: 7 },
      { fieldId: 'date', label: 'Keltezés', x: baseX, y: 357.0, fontSize: 7 },
      { fieldId: 'directorSignature', label: 'Igazgató', x: baseX, y: 364.0, fontSize: 7 }
    ];
  }

  /**
   * Alapértelmezett jegytáblázat konfiguráció
   */
  private getDefaultGradesTable(year: number): GradesTableConfig {
    // A3 álló lapon a jegy oszlopok pozíciói (a képek alapján)
    const columnOffsets: Record<number, number> = {
      1: 148.0,
      2: 178.0,
      3: 208.0,
      4: 238.0
    };

    const baseX = columnOffsets[year] || 148.0;

    return {
      startX: baseX,
      startY: 96.0,      // Tantárgyak listája innen indul (a fejléc sorok alatt)
      rowHeight: 6.2,     // Sorok magassága mm-ben (a képen kb 6-6.5mm)
      gradeColumnOffsetX: 12.0,  // A jegy a tantárgy név után ennyi mm-re van
      fontSize: 8,
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
      formLanguage: doc.formLanguage || 'bilingual',
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
