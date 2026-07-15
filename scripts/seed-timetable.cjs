/**
 * Órarend Seed Script - Adatok feltöltése Appwrite-ba
 *
 * HASZNÁLAT:
 * 1. Hozd létre a 2 Appwrite collection-t a website_db-ben:
 *    - timetable_configs: name(string), valid_from(string), is_active(boolean)
 *    - timetable_classes: config_id(string), class_name(string), shift(string), schedule(string, max 100000 char)
 *
 * 2. Írd be a collection ID-kat ide alább (COLLECTION_IDS)
 *
 * 3. Futtasd: node scripts/seed-timetable.cjs
 */

const APPWRITE_ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const APPWRITE_PROJECT = '659ea7f886cf55d4528a';
const DATABASE_ID = '658d3bb1c4785b1fad28';

// ⚠️ IDE ÍRD BE A VALÓS COLLECTION ID-KAT:
const COLLECTION_IDS = {
  timetable_configs: 'timetable_configs',  // <-- cseréld ki
  timetable_classes: 'timetable_classes',  // <-- cseréld ki
};

// ⚠️ IDE ÍRD BE EGY ADMIN API KEY-T (Appwrite Console → Settings → API Keys)
const API_KEY = 'YOUR_API_KEY_HERE';

// ============================================================
// TANÁROK LISTÁJA (a PDF-ből kinyerve)
// ============================================================
const TEACHERS = [
  { id: 1,  name: 'Hodik Péter Krisztina',      homeroom: 'III-1', hours: 20 },
  { id: 2,  name: 'Polyák Szollár Anna',         homeroom: 'IV-2',  hours: 18 },
  { id: 3,  name: 'Horvát Anikó',                homeroom: 'I-3',   hours: 16 },
  { id: 4,  name: 'Maletaški Rajka',             homeroom: 'II-4',  hours: 20 },
  { id: 5,  name: 'Gavrić Ugarak Natalija',      homeroom: 'III-4', hours: 21 },
  { id: 6,  name: 'Csonka Áron',                 homeroom: null,    hours: 4 },
  { id: 7,  name: 'Tóth Gabriella',              homeroom: 'IV-3',  hours: 21 },
  { id: 8,  name: 'Ürményi Ágnes',               homeroom: null,    hours: 3 },
  { id: 9,  name: 'Pataki Kranjec Lilien',       homeroom: null,    hours: 10 },
  { id: 10, name: 'Ljubanić Ádam',               homeroom: null,    hours: 11 },
  { id: 11, name: 'Jovanović Danijela',          homeroom: 'III-2', hours: 11 },
  { id: 12, name: 'Nacsa Marietta',              homeroom: 'III-5', hours: 17 },
  { id: 13, name: 'Halgašev Mirjana',            homeroom: null,    hours: 10 },
  { id: 14, name: 'Mészáros Kiss Tibor',         homeroom: null,    hours: 10 },
  { id: 15, name: 'Viszmeg Tamás',               homeroom: 'I-6',   hours: 14 },
  { id: 16, name: 'Konjević Klára',              homeroom: null,    hours: 22 },
  { id: 17, name: 'Nagy Éva',                    homeroom: 'III-3', hours: 21 },
  { id: 18, name: 'Tóth István',                 homeroom: null,    hours: 22 },
  { id: 19, name: 'Mátyás Magdolna',             homeroom: 'I-4',   hours: 22 },
  { id: 20, name: 'Gordán Attila',               homeroom: null,    hours: 20 },
  { id: 21, name: 'Jasztrebinác Edit',            homeroom: 'II-3',  hours: 21 },
  { id: 22, name: 'Kis Andrea',                  homeroom: null,    hours: 24 },
  { id: 23, name: 'Almádi Gabriella',            homeroom: 'IV-1',  hours: 23 },
  { id: 24, name: 'Bozsik Andor',                homeroom: 'II-5',  hours: 13 },
  { id: 25, name: 'Finna Erik',                  homeroom: null,    hours: 21 },
  { id: 26, name: 'Gordos Emil',                 homeroom: 'I-1',   hours: 24 },
  { id: 27, name: 'Illés Veronika',              homeroom: 'I-5',   hours: 23 },
  { id: 28, name: 'Pálfi Noémi',                 homeroom: null,    hours: 18 },
  { id: 29, name: 'Rácz Szabó Ákos',             homeroom: null,    hours: 22 },
  { id: 30, name: 'Sörös Róbert',                homeroom: null,    hours: 27 },
  { id: 31, name: 'Sziveri Attila',              homeroom: null,    hours: 24 },
  { id: 32, name: 'Tápai Renáta',                homeroom: 'II-1',  hours: 16 },
  { id: 33, name: 'Zombori Zoltán',              homeroom: null,    hours: 12 },
  { id: 34, name: 'Molnár Péter',                homeroom: null,    hours: 24 },
  { id: 35, name: 'Simon Ágnes',                 homeroom: null,    hours: 11 },
  { id: 36, name: 'Vujinović Aleksandar',        homeroom: null,    hours: 6 },
  { id: 37, name: 'Bíró Árpád',                  homeroom: 'II-2',  hours: 25 },
  { id: 38, name: 'Fekete Lajos',                homeroom: null,    hours: 22 },
  { id: 39, name: 'Pásztor Lajos',               homeroom: null,    hours: 22 },
  { id: 40, name: 'Pásztor Edina',               homeroom: 'I-2',   hours: 23 },
  { id: 41, name: 'Török Csaba',                 homeroom: null,    hours: 15 },
  { id: 42, name: 'Kovács Árpád',                homeroom: null,    hours: 21 },
  { id: 43, name: 'Balog Teodóra',               homeroom: 'II-6',  hours: 26 },
  { id: 44, name: 'Csomor Dániel',               homeroom: 'III-6', hours: 27 },
  { id: 45, name: 'Tanurdžić Bojana',            homeroom: null,    hours: 3 },
];

// ============================================================
// TANÁR → OSZTÁLY HOZZÁRENDELÉSEK (heti óraszámmal)
// Ezeket a PDF összefoglaló részéből nyertük ki
// ============================================================
const TEACHER_CLASS_MAP = {
  1:  { 'II-1': 3, 'II-2': 3, 'II-3': 3, 'II-5': 2, 'III-1': 3, 'III-2': 3, 'III-3': 3 },
  2:  { 'I-1': 3, 'I-2': 3, 'I-5': 3, 'IV-1': 3, 'IV-2': 3, 'IV-3': 3 },
  3:  { 'I-3': 3, 'III-5': 2, 'III-6': 2, 'II-6': 2, 'I-6': 3, 'I-1': 1, 'I-2': 1, 'I-3*': 1 },
  4:  { 'I-5': 2, 'IV-3': 2, 'II-2': 2, 'II-3': 2, 'II-6': 2, 'III-1': 2, 'III-3': 2, 'III-5': 2, 'III-6': 2, 'I-6': 2 },
  5:  { 'I-1': 2, 'I-2': 2, 'I-4': 3, 'II-1': 2, 'II-4': 3, 'III-2': 2, 'III-4': 3, 'IV-1': 2, 'I-3': 2 },
  6:  { 'II-5': 2, 'IV-2': 2 },
  7:  { 'I-1,2': 2, 'I-3,4': 2, 'I-5': 2, 'II-1,4': 2, 'II-2,3': 2, 'II-5,6': 2, 'III-1,4': 2, 'III-2,3': 2, 'III-5,6': 1, 'IV-1,2': 2, 'IV-3': 2 },
  8:  { 'III-5,6': 1, 'II-5,6': 2 },
  9:  { 'I-1,2,3,4': 2, 'I-5': 2, 'II-1,2,3': 2, 'III-1,2': 2, 'IV-1,2,3': 2 },
  10: { 'I-1,2,3,4': 2, 'I-5': 2, 'II-1,2,3': 2, 'III-1,2': 1 },
  11: { 'I-2,3': 1, 'II-1': 1, 'II-2,3': 1, 'I-5': 1, 'IV-2,3': 1, 'III-2,3': 1, 'II-5,6': 1, 'III-1': 1, 'I-1': 1, 'III-5,6': 1, 'IV-1': 1 },
  12: { 'I-2': 2, 'I-3': 2, 'I-4': 2, 'IV-1': 2, 'III-2,3': 2, 'I-4*': 1 },
  13: { 'I-5': 2, 'II-1': 2, 'II-5': 1, 'II-6': 1, 'IV-1': 2, 'IV-2': 2, 'IV-3': 2, 'I-6': 2 },
  14: { 'I-3': 2, 'II-1': 2, 'II-2': 2, 'II-4': 2, 'II-5': 1, 'I-6': 1 },
  15: { 'I-5': 1, 'II-1': 2, 'II-2': 2, 'II-4': 2, 'II-6': 1, 'I-3': 2 },
  16: { 'I-1': 2, 'I-2': 2, 'II-3': 2, 'II-5': 2, 'I-6': 2, 'I-1*': 2, 'I-3': 2 },
  17: { 'II-5': 2, 'II-6': 2, 'III-1': 3, 'III-2': 3, 'III-4': 3, 'IV-1': 3, 'III-1v': 2, 'III-4v': 2, 'I-6': 2 },
  18: { 'I-1': 2, 'I-2': 2, 'II-2': 2, 'II-3': 2, 'III-3': 3, 'III-2,3v': 2, 'IV-1,2,3': 2, 'I-3': 2 },
  19: { 'I-3': 3, 'I-4': 3, 'I-5': 2, 'II-1': 3, 'II-4': 3, 'III-5': 1, 'III-6': 1, 'IV-2': 3, 'IV-3': 3 },
  20: { 'I-1': 2, 'I-2': 2, 'I-3': 2, 'I-4': 2, 'II-1': 2, 'II-2': 2, 'III-2': 2, 'III-3': 2, 'III-5': 2, 'I-6': 2, 'IV-1': 2 },
  21: { 'I-5': 2, 'II-3': 2, 'II-4': 2, 'II-5': 2, 'II-6': 2, 'III-1': 2, 'III-4': 2, 'III-6': 2, 'IV-2': 2, 'IV-3': 2 },
  22: { 'II-2A': 2, 'II-2B': 2, 'III-3': 4, 'II-3': 2, 'IV-3A': 3, 'IV-3B': 3, 'II-3*': 3, 'II-4': 2 },
  23: { 'I-1A': 2, 'I-1B': 2, 'I-2A': 2, 'I-2B': 2, 'I-3': 2, 'I-4': 2, 'I-5A': 2, 'I-5B': 2, 'I-6': 2, 'III-6': 2, 'IV-3A': 2, 'IV-3B': 2 },
  24: { 'I-1A': 3, 'I-1B': 3, 'I-4': 3, 'I-2A': 3, 'I-2B': 3, 'I-2': 3, 'I-4*': 3, 'IV-1': 2 },
  25: { 'I-5A': 6, 'II-1A': 4, 'III-4': 3 },
  26: { 'I-1a': 3, 'I-1c': 3, 'I-2': 2, 'I-2A/B': 2, 'I-4': 1, 'II-2': 2, 'II-2A': 2, 'II-2B': 2, 'II-4': 2, 'I-5': 2 },
  27: { 'I-1': 2, 'II-1': 3, 'III-1A': 2, 'III-1A*': 4, 'III-1B': 4, 'III-2': 3, 'II-5A': 3, 'II-5B': 3 },
  28: { 'I-5B': 6, 'I-1b': 3, 'I-5': 2, 'II-1B': 4, 'I-5*': 2, 'I-5A': 2, 'III-5A': 2, 'III-5A*': 2 },
  29: { 'II-2': 2, 'III-2A': 3, 'III-1': 2, 'III-5B': 2, 'IV-1A': 2, 'I-5A': 3, 'IV-2A': 2, 'III-1B': 2 },
  30: { 'III-4': 3, 'III-1A': 3, 'III-1B': 3, 'IV-1A': 7, 'IV-1B': 6 },
  31: { 'II-4': 3, 'II-5A': 12, 'III-5A': 12 },
  32: { 'I-1': 3, 'I-1A': 1, 'I-1B': 1, 'II-1': 5, 'III-1': 1, 'III-1A': 1, 'III-1B': 1, 'II-2': 3, 'II-4': 2, 'II-5A': 3, 'II-5B': 3 },
  33: { 'II-1A': 3, 'II-1B': 3, 'III-5': 1, 'IV-1A': 6, 'IV-1B': 3 },
  34: { 'III-1A': 6, 'IV-1C': 6 },
  35: { 'II-1C': 4, 'III-5B': 12, 'III-5A': 2, 'III-5A*': 6 },
  36: { 'I-5B': 3, 'I-5B*': 2, 'III-5B': 2, 'III-5B*': 2, 'IV-1B': 2 },
  37: { 'I-4': 2, 'II-4': 2, 'I-4*': 2 },
  38: { 'II-2': 2, 'II-A': 1, 'II-B': 1, 'I-4': 4, 'I-3': 4, 'II-4': 3, 'IV-2': 3, 'IV-3': 1, 'IV-3A': 2, 'IV-3B': 2, 'III-4': 2 },
  39: { 'III-3': 3, 'III-3*': 3, 'IV-3': 2, 'IV-3A': 2, 'IV-3B': 2, 'IV-3A*': 3, 'IV-3B*': 3, 'III-4': 4 },
  40: { 'I-2': 2, 'I-4': 1, 'I-3': 2, 'II-4': 3, 'II-2': 2, 'II-2A': 1, 'II-2B': 1, 'III-2': 3, 'III-4': 3, 'III-4*': 4 },
  41: { 'II-3': 2, 'I-2': 3, 'I-2A': 1, 'I-2B': 1, 'III-2': 4, 'III-3': 3, 'III-3*': 3, 'III-2*': 2, 'III-2**': 4 },
  42: { 'I-3': 2, 'II-3': 2, 'IV-3A': 2, 'IV-3B': 2, 'II-3*': 4, 'I-1': 1, 'I-1A': 1, 'I-1B': 1 },
  43: { 'IV-2': 12, 'III-3': 3, 'II-3': 6 },
  44: { 'II-6': 12, 'I-6': 4, 'I-4': 1, 'III-6': 1, 'II-6*': 8 },
  45: { 'III-6': 22, 'I-6': 5 },
};

// ============================================================
// DÉLELŐTTI + DÉLUTÁNI OSZTÁLYOK
// ============================================================
const MORNING_CLASSES = [
  'I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6',
  'II-1', 'II-2', 'II-3', 'II-4', 'II-5', 'II-6',
  'III-1', 'III-2', 'III-3', 'III-4', 'III-5', 'III-6',
  'IV-1', 'IV-2', 'IV-3'
];

const AFTERNOON_CLASSES = [
  // Délutáni osztályok - töltsd ki ha vannak külön délutáni osztályok
  // Vagy használd ugyanazokat mint délelőtt, ha a műszak váltakozik
];

// ============================================================
// ÜRES ÓRAREND GENERÁTOR
// ============================================================
function emptySchedule() {
  const schedule = {};
  for (let day = 1; day <= 5; day++) {
    schedule[String(day)] = Array.from({ length: 8 }, () => ({ teacher: '', room: '' }));
  }
  return schedule;
}

// ============================================================
// APPWRITE API HÍVÁSOK
// ============================================================
async function appwriteRequest(method, path, body = null) {
  const url = `${APPWRITE_ENDPOINT}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT,
    'X-Appwrite-Key': API_KEY,
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Appwrite error: ${response.status} - ${JSON.stringify(data)}`);
  }
  return data;
}

async function createDocument(collectionId, data, documentId = null) {
  const id = documentId || generateId();
  return appwriteRequest('POST', `/databases/${DATABASE_ID}/collections/${collectionId}/documents`, {
    documentId: id,
    data,
  });
}

function generateId() {
  return 'unique()';
}

// ============================================================
// FŐ SEED FUNKCIÓ
// ============================================================
async function seed() {
  console.log('🏫 Órarend seed script indítása...\n');

  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ Kérlek add meg az Appwrite API kulcsot a scriptben (API_KEY)!');
    console.log('\n📋 Lépések:');
    console.log('1. Appwrite Console → Settings → API Keys → Create API Key');
    console.log('2. Adj hozzá databases.read és databases.write jogosultságot');
    console.log('3. Másold be az API kulcsot a script API_KEY változójába');
    process.exit(1);
  }

  // 1. Timetable config létrehozása
  console.log('📅 Órarend config létrehozása...');
  const config = await createDocument(COLLECTION_IDS.timetable_configs, {
    name: '2025/2026 - I. félév (Első/Prva műszak)',
    valid_from: '2025-09-01',
    is_active: true,
  });
  console.log(`   ✅ Config létrehozva: ${config.$id}`);

  // 2. Délelőtti osztály órarendek
  console.log('\n☀️ Délelőtti műszak osztályok létrehozása...');
  for (const className of MORNING_CLASSES) {
    const schedule = emptySchedule();
    await createDocument(COLLECTION_IDS.timetable_classes, {
      config_id: config.$id,
      class_name: className,
      shift: 'morning',
      schedule: JSON.stringify(schedule),
    });
    console.log(`   ✅ ${className} (délelőtt)`);
  }

  // 3. Délutáni osztály órarendek (ha vannak)
  if (AFTERNOON_CLASSES.length > 0) {
    console.log('\n🌙 Délutáni műszak osztályok létrehozása...');
    for (const className of AFTERNOON_CLASSES) {
      const schedule = emptySchedule();
      await createDocument(COLLECTION_IDS.timetable_classes, {
        config_id: config.$id,
        class_name: className,
        shift: 'afternoon',
        schedule: JSON.stringify(schedule),
      });
      console.log(`   ✅ ${className} (délután)`);
    }
  }

  // 4. Összegzés
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Seed kész!');
  console.log(`   Config ID: ${config.$id}`);
  console.log(`   Osztályok: ${MORNING_CLASSES.length} délelőtt + ${AFTERNOON_CLASSES.length} délután`);
  console.log('\n📋 Következő lépések:');
  console.log('   1. Menj a /admin/timetable-editor oldalra');
  console.log('   2. Kattints az órarend szerkesztésére');
  console.log('   3. Válaszd ki az osztályt és töltsd ki a tanárneveket');
  console.log('\n📊 Tanár referencia (ki melyik osztályban tanít):');

  // Tanár referencia kiírása
  for (const className of MORNING_CLASSES) {
    const teachers = [];
    for (const [teacherId, classes] of Object.entries(TEACHER_CLASS_MAP)) {
      for (const [cls, hours] of Object.entries(classes)) {
        // Match exact class or class without suffixes
        const baseClass = cls.replace(/[*A-Za-z/,]+$/, '').replace(/[a-c]$/, '');
        if (baseClass === className || cls === className) {
          const teacher = TEACHERS.find(t => t.id === parseInt(teacherId));
          if (teacher) {
            teachers.push(`${teacher.name} (${hours}h)`);
          }
        }
      }
    }
    if (teachers.length > 0) {
      console.log(`   ${className}: ${teachers.join(', ')}`);
    }
  }
}

seed().catch(err => {
  console.error('❌ Hiba:', err.message);
  process.exit(1);
});
