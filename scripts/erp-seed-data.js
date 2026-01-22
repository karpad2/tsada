/**
 * ERP Database Seed Data Script
 *
 * Feltölti az alapadatokat az ERP adatbázisba:
 * - Tantárgyak (subjects)
 * - Idegen nyelvek (foreign_languages)
 * - Hittan/Polgári opciók (religion_options)
 * - Helységek (places) - az Excel alapján
 * - Szakok (study_programs) - az Excel alapján
 * - Generációk (generations)
 *
 * Használat: node scripts/erp-seed-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mcpConfigPath = path.join(__dirname, '../.claude/mcp.json');
const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
const apiKey = mcpConfig.mcpServers['appwrite-api'].env.APPWRITE_API_KEY;

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const PROJECT_ID = '659ea7f886cf55d4528a';
const ERP_DATABASE_ID = '696ff344002025b7ffe0';

// ============================================
// SEED DATA
// ============================================

// Idegen nyelvek
const FOREIGN_LANGUAGES = [
  { name_hu: 'Német', name_rs: 'Немачки' },
  { name_hu: 'Angol', name_rs: 'Енглески' }
];

// Hittan/Polgári opciók
const RELIGION_OPTIONS = [
  { name_hu: 'Hittan', name_rs: 'Верска настава' },
  { name_hu: 'Polgári nevelés', name_rs: 'Грађанско васпитање' }
];

// Tanévek (school years)
const SCHOOL_YEARS = [
  { year_start: 2024, year_end: 2025, name: '2024/2025' },
  { year_start: 2025, year_end: 2026, name: '2025/2026' },
  { year_start: 2026, year_end: 2027, name: '2026/2027' }
];

// Generációk (a jelenlegi diákok alapján)
const GENERATIONS = [
  { year_start: 2024, year_end: 2028, name: '2024-2028' }, // 1. osztályosok (4 éves)
  { year_start: 2023, year_end: 2027, name: '2023-2027' }, // 2. osztályosok
  { year_start: 2022, year_end: 2026, name: '2022-2026' }, // 3. osztályosok
  { year_start: 2021, year_end: 2025, name: '2021-2025' }  // 4. osztályosok
];

// ============================================
// API FUNCTIONS
// ============================================

async function appwriteRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${ENDPOINT}${endpoint}`, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function createDocument(collectionId, data, documentId = null) {
  const endpoint = `/databases/${ERP_DATABASE_ID}/collections/${collectionId}/documents`;

  const body = {
    documentId: documentId || 'unique()',
    data
  };

  try {
    const result = await appwriteRequest(endpoint, 'POST', body);
    return result;
  } catch (error) {
    if (error.message.includes('already exists')) {
      return null; // Already exists, skip
    }
    throw error;
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedForeignLanguages() {
  console.log('\n📚 Seeding foreign languages...');
  for (const lang of FOREIGN_LANGUAGES) {
    try {
      await createDocument('foreign_languages', lang);
      console.log(`   ✅ ${lang.name_hu}`);
    } catch (error) {
      console.log(`   ❌ ${lang.name_hu}: ${error.message}`);
    }
    await wait(300);
  }
}

async function seedReligionOptions() {
  console.log('\n🙏 Seeding religion options...');
  for (const opt of RELIGION_OPTIONS) {
    try {
      await createDocument('religion_options', opt);
      console.log(`   ✅ ${opt.name_hu}`);
    } catch (error) {
      console.log(`   ❌ ${opt.name_hu}: ${error.message}`);
    }
    await wait(300);
  }
}

async function seedSchoolYears() {
  console.log('\n📅 Seeding school years...');
  for (const year of SCHOOL_YEARS) {
    try {
      await createDocument('school_years', year);
      console.log(`   ✅ ${year.name}`);
    } catch (error) {
      console.log(`   ❌ ${year.name}: ${error.message}`);
    }
    await wait(300);
  }
}

async function seedGenerations() {
  console.log('\n👥 Seeding generations...');
  for (const gen of GENERATIONS) {
    try {
      await createDocument('generations', gen);
      console.log(`   ✅ ${gen.name}`);
    } catch (error) {
      console.log(`   ❌ ${gen.name}: ${error.message}`);
    }
    await wait(300);
  }
}

async function seedSubjectsFromExcel() {
  console.log('\n📖 Seeding subjects from Excel...');

  const excelPath = path.join(__dirname, '../Adatbazis-I-1.xls');
  if (!fs.existsSync(excelPath)) {
    console.log('   ❌ Excel file not found!');
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['tantargyak'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Tantárgyak párosával vannak (RS, HU)
  const subjects = [];
  for (let i = 0; i < data.length; i += 2) {
    const rsRow = data[i];
    const huRow = data[i + 1];

    if (rsRow && huRow && rsRow[1] && huRow[1]) {
      subjects.push({
        subject_code: rsRow[0] || i / 2 + 1,
        name_rs: rsRow[1],
        name_hu: huRow[1]
      });
    }
  }

  console.log(`   Found ${subjects.length} subjects`);

  for (const subj of subjects) {
    try {
      await createDocument('subjects', subj);
      console.log(`   ✅ ${subj.name_hu}`);
    } catch (error) {
      console.log(`   ❌ ${subj.name_hu}: ${error.message}`);
    }
    await wait(200);
  }
}

async function seedPlacesFromExcel() {
  console.log('\n🏘️ Seeding places from Excel...');

  const excelPath = path.join(__dirname, '../Adatbazis-I-1.xls');
  if (!fs.existsSync(excelPath)) {
    console.log('   ❌ Excel file not found!');
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['adatok'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = data[0];

  // Helység oszlopok indexei
  const placeRsIdx = headers.indexOf('Место');
  const placeHuIdx = headers.indexOf('születési hely');
  const municipalityRsIdx = headers.indexOf('општина');
  const municipalityHuIdx = headers.indexOf('község');
  const countryRsIdx = headers.indexOf('држава');
  const countryHuIdx = headers.indexOf('állam');

  // Egyedi helységek gyűjtése
  const placesMap = new Map();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = `${row[placeRsIdx]}_${row[municipalityRsIdx]}`;

    if (!placesMap.has(key) && row[placeRsIdx]) {
      placesMap.set(key, {
        place_rs: row[placeRsIdx],
        place_hu: row[placeHuIdx],
        municipality_rs: row[municipalityRsIdx],
        municipality_hu: row[municipalityHuIdx],
        country_rs: row[countryRsIdx] || 'Република Србија',
        country_hu: row[countryHuIdx] || 'Szerb Köztársaság'
      });
    }
  }

  console.log(`   Found ${placesMap.size} unique places`);

  for (const place of placesMap.values()) {
    try {
      await createDocument('places', place);
      console.log(`   ✅ ${place.place_hu}`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log(`   ❌ ${place.place_hu}: ${error.message}`);
      }
    }
    await wait(200);
  }
}

async function seedStudyProgramsFromExcel() {
  console.log('\n🎓 Seeding study programs from Excel...');

  const excelPath = path.join(__dirname, '../Adatbazis-I-1.xls');
  if (!fs.existsSync(excelPath)) {
    console.log('   ❌ Excel file not found!');
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['adatok'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = data[0];

  // Szak oszlopok indexei
  const programRsIdx = headers.indexOf('образовни профил');
  const programHuIdx = headers.indexOf('oktatási profil');
  const durationRsIdx = headers.indexOf('траје');
  const durationHuIdx = headers.indexOf('időtartam');

  // Egyedi szakok gyűjtése
  const programsMap = new Map();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = row[programRsIdx];

    if (!programsMap.has(key) && key) {
      const durationRs = row[durationRsIdx];
      let durationYears = 4;
      if (durationRs === 'три' || row[durationHuIdx] === 'három') {
        durationYears = 3;
      }

      programsMap.set(key, {
        study_program_name_rs: row[programRsIdx],
        study_program_name_hu: row[programHuIdx],
        study_program_internal_name: row[programHuIdx]?.substring(0, 50),
        duration_years: durationYears,
        language: 'hu' // Magyar tagozat
      });
    }
  }

  console.log(`   Found ${programsMap.size} unique study programs`);

  for (const program of programsMap.values()) {
    try {
      await createDocument('study_programs', program);
      console.log(`   ✅ ${program.study_program_name_hu}`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log(`   ❌ ${program.study_program_name_hu}: ${error.message}`);
      }
    }
    await wait(200);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🌱 ERP Database Seed Data');
  console.log('==========================');

  await seedForeignLanguages();
  await seedReligionOptions();
  await seedSchoolYears();
  await seedGenerations();
  await seedSubjectsFromExcel();
  await seedPlacesFromExcel();
  await seedStudyProgramsFromExcel();

  console.log('\n==========================');
  console.log('✅ Seed data complete!');
  console.log('\nNext: Run node scripts/erp-import-students.js to import students');
}

main().catch(console.error);
