/**
 * Excel Import Service
 * Iskolai adatbázisok (Excel/XLS) beolvasása és feldolgozása
 */

import * as XLSX from 'xlsx';

// ============================================
// INTERFACES
// ============================================

export interface ExcelStudentData {
  // Magyar nevek
  lastname_hu?: string;
  firstname_hu?: string;
  // Szerb nevek
  lastname_rs?: string;
  firstname_rs?: string;
  // Személyes adatok
  JMBG?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_place_hu?: string;
  birth_place_rs?: string;
  // Egyéb
  foreign_language?: string;
  religion_option?: string;
  study_program?: string;
  generation?: string;
  // Extra mezők az Excel-ből
  [key: string]: any;
}

export interface ExcelColumnMapping {
  excelColumn: string;
  targetField: keyof ExcelStudentData | string;
  transform?: (value: any) => any;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: Array<{ row: number; error: string }>;
  data: ExcelStudentData[];
}

export interface ExcelSheetInfo {
  name: string;
  rowCount: number;
  columns: string[];
  sampleData: Record<string, any>[];
}

// Alapértelmezett oszlop megfeleltetések (magyar iskolai adatbázisokhoz)
export const DEFAULT_COLUMN_MAPPINGS: ExcelColumnMapping[] = [
  { excelColumn: 'Vezetéknév', targetField: 'lastname_hu' },
  { excelColumn: 'Keresztnév', targetField: 'firstname_hu' },
  { excelColumn: 'Prezime', targetField: 'lastname_rs' },
  { excelColumn: 'Ime', targetField: 'firstname_rs' },
  { excelColumn: 'JMBG', targetField: 'JMBG' },
  { excelColumn: 'Matični broj', targetField: 'JMBG' },
  { excelColumn: 'Születési év', targetField: 'birth_year', transform: (v) => parseInt(v) || null },
  { excelColumn: 'Godina rođenja', targetField: 'birth_year', transform: (v) => parseInt(v) || null },
  { excelColumn: 'Születési hónap', targetField: 'birth_month', transform: (v) => parseInt(v) || null },
  { excelColumn: 'Mesec rođenja', targetField: 'birth_month', transform: (v) => parseInt(v) || null },
  { excelColumn: 'Születési nap', targetField: 'birth_day', transform: (v) => parseInt(v) || null },
  { excelColumn: 'Dan rođenja', targetField: 'birth_day', transform: (v) => parseInt(v) || null },
  { excelColumn: 'Születési dátum', targetField: 'birth_date', transform: parseDateString },
  { excelColumn: 'Datum rođenja', targetField: 'birth_date', transform: parseDateString },
  { excelColumn: 'Születési hely', targetField: 'birth_place_hu' },
  { excelColumn: 'Mesto rođenja', targetField: 'birth_place_rs' },
  { excelColumn: 'Idegen nyelv', targetField: 'foreign_language' },
  { excelColumn: 'Strani jezik', targetField: 'foreign_language' },
  { excelColumn: 'Vallás/Polgári', targetField: 'religion_option' },
  { excelColumn: 'Verska nastava', targetField: 'religion_option' },
  { excelColumn: 'Szak', targetField: 'study_program' },
  { excelColumn: 'Obrazovni profil', targetField: 'study_program' },
  { excelColumn: 'Évfolyam', targetField: 'generation' },
  { excelColumn: 'Generacija', targetField: 'generation' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Dátum string feldolgozása (különböző formátumok támogatása)
 */
function parseDateString(value: any): { year?: number; month?: number; day?: number } | null {
  if (!value) return null;

  // Ha már Date objektum (Excel dátum)
  if (value instanceof Date) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate()
    };
  }

  const str = String(value).trim();

  // YYYY.MM.DD. vagy YYYY-MM-DD formátum
  let match = str.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (match) {
    return {
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3])
    };
  }

  // DD.MM.YYYY vagy DD-MM-YYYY formátum
  match = str.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\.?$/);
  if (match) {
    return {
      year: parseInt(match[3]),
      month: parseInt(match[2]),
      day: parseInt(match[1])
    };
  }

  return null;
}

/**
 * Oszlopnév normalizálása (kis betűk, szóközök eltávolítása)
 */
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ============================================
// EXCEL IMPORT SERVICE CLASS
// ============================================

export class ExcelImportService {
  private static instance: ExcelImportService;

  private constructor() {}

  static getInstance(): ExcelImportService {
    if (!ExcelImportService.instance) {
      ExcelImportService.instance = new ExcelImportService();
    }
    return ExcelImportService.instance;
  }

  /**
   * Excel fájl beolvasása és munkalapok listázása
   */
  async readExcelFile(file: File): Promise<ExcelSheetInfo[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          const sheets: ExcelSheetInfo[] = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            // Első sor = oszlopnevek
            const columns = jsonData[0]?.map(c => String(c || '').trim()) || [];

            // Adatsorok (első 5 minta)
            const dataRows = jsonData.slice(1, 6);
            const sampleData = dataRows.map(row => {
              const obj: Record<string, any> = {};
              columns.forEach((col, idx) => {
                if (col) obj[col] = row[idx];
              });
              return obj;
            });

            return {
              name: sheetName,
              rowCount: jsonData.length - 1, // Fejléc nélkül
              columns: columns.filter(c => c),
              sampleData
            };
          });

          resolve(sheets);
        } catch (error) {
          reject(new Error(`Excel fájl olvasási hiba: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Fájl olvasási hiba'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Excel munkalap adatainak importálása
   */
  async importSheet(
    file: File,
    sheetName: string,
    columnMappings: ExcelColumnMapping[],
    skipEmptyRows: boolean = true
  ): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const worksheet = workbook.Sheets[sheetName];

          if (!worksheet) {
            reject(new Error(`Munkalap nem található: ${sheetName}`));
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          const headers = jsonData[0]?.map(c => String(c || '').trim()) || [];
          const dataRows = jsonData.slice(1);

          const result: ImportResult = {
            success: true,
            totalRows: dataRows.length,
            importedRows: 0,
            skippedRows: 0,
            errors: [],
            data: []
          };

          // Oszlop index mapping létrehozása
          const columnIndexMap = new Map<string, number>();
          headers.forEach((header, index) => {
            columnIndexMap.set(normalizeColumnName(header), index);
          });

          // Adatsorok feldolgozása
          dataRows.forEach((row, rowIndex) => {
            try {
              // Üres sor ellenőrzése
              const isEmptyRow = row.every(cell => cell === null || cell === undefined || String(cell).trim() === '');
              if (skipEmptyRows && isEmptyRow) {
                result.skippedRows++;
                return;
              }

              const studentData: ExcelStudentData = {};

              // Oszlop megfeleltetések alkalmazása
              columnMappings.forEach(mapping => {
                const normalizedColumn = normalizeColumnName(mapping.excelColumn);
                const columnIndex = columnIndexMap.get(normalizedColumn);

                if (columnIndex !== undefined) {
                  let value = row[columnIndex];

                  // Transzformáció alkalmazása
                  if (mapping.transform && value !== null && value !== undefined) {
                    value = mapping.transform(value);
                  }

                  // Dátum speciális kezelése
                  if (mapping.targetField === 'birth_date' && value) {
                    const dateValue = value as { year?: number; month?: number; day?: number };
                    if (dateValue.year) studentData.birth_year = dateValue.year;
                    if (dateValue.month) studentData.birth_month = dateValue.month;
                    if (dateValue.day) studentData.birth_day = dateValue.day;
                  } else if (value !== null && value !== undefined && value !== '') {
                    (studentData as any)[mapping.targetField] = value;
                  }
                }
              });

              // Ellenőrzés: van-e legalább név
              if (studentData.lastname_hu || studentData.firstname_hu ||
                  studentData.lastname_rs || studentData.firstname_rs) {
                result.data.push(studentData);
                result.importedRows++;
              } else {
                result.skippedRows++;
              }
            } catch (error) {
              result.errors.push({
                row: rowIndex + 2, // +2 mert 1-től számolunk és van fejléc
                error: String(error)
              });
            }
          });

          resolve(result);
        } catch (error) {
          reject(new Error(`Import hiba: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Fájl olvasási hiba'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Automatikus oszlop megfeleltetés keresése
   */
  findColumnMappings(excelColumns: string[]): ExcelColumnMapping[] {
    const mappings: ExcelColumnMapping[] = [];
    const usedTargetFields = new Set<string>();

    excelColumns.forEach(excelColumn => {
      const normalizedExcel = normalizeColumnName(excelColumn);

      // Keresés az alapértelmezett megfeleltetésekben
      for (const defaultMapping of DEFAULT_COLUMN_MAPPINGS) {
        const normalizedDefault = normalizeColumnName(defaultMapping.excelColumn);

        if (normalizedExcel === normalizedDefault ||
            normalizedExcel.includes(normalizedDefault) ||
            normalizedDefault.includes(normalizedExcel)) {

          // Elkerüljük a duplikált target field-eket
          if (!usedTargetFields.has(defaultMapping.targetField)) {
            mappings.push({
              excelColumn: excelColumn,
              targetField: defaultMapping.targetField,
              transform: defaultMapping.transform
            });
            usedTargetFields.add(defaultMapping.targetField);
            break;
          }
        }
      }
    });

    return mappings;
  }

  /**
   * Összes lehetséges cél mező listázása
   */
  getAvailableTargetFields(): Array<{ value: string; label: string }> {
    return [
      { value: 'lastname_hu', label: 'Vezetéknév (magyar)' },
      { value: 'firstname_hu', label: 'Keresztnév (magyar)' },
      { value: 'lastname_rs', label: 'Vezetéknév (szerb)' },
      { value: 'firstname_rs', label: 'Keresztnév (szerb)' },
      { value: 'JMBG', label: 'JMBG / Személyi szám' },
      { value: 'birth_year', label: 'Születési év' },
      { value: 'birth_month', label: 'Születési hónap' },
      { value: 'birth_day', label: 'Születési nap' },
      { value: 'birth_date', label: 'Születési dátum (teljes)' },
      { value: 'birth_place_hu', label: 'Születési hely (magyar)' },
      { value: 'birth_place_rs', label: 'Születési hely (szerb)' },
      { value: 'foreign_language', label: 'Idegen nyelv' },
      { value: 'religion_option', label: 'Vallás/Polgári' },
      { value: 'study_program', label: 'Szak' },
      { value: 'generation', label: 'Évfolyam/Generáció' },
    ];
  }
}

export default ExcelImportService;
