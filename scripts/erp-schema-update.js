/**
 * ERP Database Schema Update Script
 *
 * Bővíti az ERP adatbázist a hiányzó mezőkkel és collection-ökkel
 * Normalizált struktúra - minden adat külön táblában
 *
 * Használat: node scripts/erp-schema-update.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mcpConfigPath = path.join(__dirname, '../.claude/mcp.json');
const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
const apiKey = mcpConfig.mcpServers['appwrite-api'].env.APPWRITE_API_KEY;

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const PROJECT_ID = '659ea7f886cf55d4528a';
const ERP_DATABASE_ID = '696ff344002025b7ffe0';

// ============================================
// SÉMA DEFINÍCIÓK - Normalizált struktúra
// ============================================

// Új collection-ök létrehozása
const NEW_COLLECTIONS = [
  {
    $id: 'foreign_languages',
    name: 'foreign_languages',
    attributes: [
      { key: 'name_hu', type: 'string', size: 50, required: true },
      { key: 'name_rs', type: 'string', size: 50, required: true }
    ]
  },
  {
    $id: 'religion_options',
    name: 'religion_options',
    attributes: [
      { key: 'name_hu', type: 'string', size: 50, required: true },
      { key: 'name_rs', type: 'string', size: 50, required: true }
    ]
  },
  {
    $id: 'school_years',
    name: 'school_years',
    attributes: [
      { key: 'year_start', type: 'integer', required: true },
      { key: 'year_end', type: 'integer', required: true },
      { key: 'name', type: 'string', size: 20, required: false } // "2024/2025"
    ]
  },
  {
    $id: 'student_enrollments',
    name: 'student_enrollments',
    attributes: [
      // Relationships will be added separately
      { key: 'class_year', type: 'integer', required: true }, // 1, 2, 3, 4
      { key: 'attempt_hu', type: 'string', size: 20, required: false }, // először, másodszor
      { key: 'attempt_rs', type: 'string', size: 20, required: false }  // први, други
    ],
    relationships: [
      { key: 'student', relatedCollection: 'students', type: 'manyToOne' },
      { key: 'school_year', relatedCollection: 'school_years', type: 'manyToOne' },
      { key: 'study_program', relatedCollection: 'study_programs', type: 'manyToOne' }
    ]
  },
  {
    $id: 'student_grades',
    name: 'student_grades',
    attributes: [
      { key: 'grade', type: 'integer', required: true }, // 1-5
      { key: 'semester', type: 'integer', required: false }, // 1 vagy 2
      { key: 'is_final', type: 'boolean', required: false, default: false }
    ],
    relationships: [
      { key: 'student', relatedCollection: 'students', type: 'manyToOne' },
      { key: 'subject', relatedCollection: 'subjects', type: 'manyToOne' },
      { key: 'school_year', relatedCollection: 'school_years', type: 'manyToOne' }
    ]
  }
];

// Meglévő students collection bővítése
const STUDENTS_NEW_ATTRIBUTES = [
  { key: 'lastname_hu', type: 'string', size: 255, required: false },
  { key: 'lastname_rs', type: 'string', size: 255, required: false },
  { key: 'job_code', type: 'string', size: 30, required: false },
  { key: 'birth_year', type: 'integer', required: false },
  { key: 'birth_month', type: 'integer', required: false },
  { key: 'birth_day', type: 'integer', required: false }
];

const STUDENTS_NEW_RELATIONSHIPS = [
  { key: 'birth_place', relatedCollection: 'places', type: 'manyToOne' },
  { key: 'father', relatedCollection: 'parents_of_students', type: 'manyToOne' },
  { key: 'mother', relatedCollection: 'parents_of_students', type: 'manyToOne' },
  { key: 'foreign_language', relatedCollection: 'foreign_languages', type: 'manyToOne' },
  { key: 'religion_option', relatedCollection: 'religion_options', type: 'manyToOne' },
  { key: 'study_program', relatedCollection: 'study_programs', type: 'manyToOne' },
  { key: 'generation', relatedCollection: 'generations', type: 'manyToOne' }
];

// subjects collection bővítése (jelenleg üres)
const SUBJECTS_ATTRIBUTES = [
  { key: 'name_hu', type: 'string', size: 255, required: true },
  { key: 'name_rs', type: 'string', size: 255, required: true },
  { key: 'subject_code', type: 'integer', required: false }
];

// generations collection bővítése (jelenleg üres)
const GENERATIONS_ATTRIBUTES = [
  { key: 'year_start', type: 'integer', required: true },
  { key: 'year_end', type: 'integer', required: true },
  { key: 'name', type: 'string', size: 30, required: false }
];

// study_programs bővítése
const STUDY_PROGRAMS_NEW_ATTRIBUTES = [
  { key: 'duration_years', type: 'integer', required: false } // 3 vagy 4
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

async function createCollection(collectionDef) {
  console.log(`\n📁 Creating collection: ${collectionDef.name}`);

  try {
    await appwriteRequest(
      `/databases/${ERP_DATABASE_ID}/collections`,
      'POST',
      {
        collectionId: collectionDef.$id,
        name: collectionDef.name,
        permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")']
      }
    );
    console.log(`   ✅ Collection created: ${collectionDef.name}`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️ Collection already exists: ${collectionDef.name}`);
      return true;
    }
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function createAttribute(collectionId, attr) {
  const endpoint = `/databases/${ERP_DATABASE_ID}/collections/${collectionId}/attributes`;

  try {
    let body = {
      key: attr.key,
      required: attr.required || false
    };

    let attrEndpoint = endpoint;

    switch (attr.type) {
      case 'string':
        attrEndpoint += '/string';
        body.size = attr.size || 255;
        body.default = attr.default || null;
        break;
      case 'integer':
        attrEndpoint += '/integer';
        body.min = attr.min;
        body.max = attr.max;
        body.default = attr.default || null;
        break;
      case 'boolean':
        attrEndpoint += '/boolean';
        body.default = attr.default || false;
        break;
      case 'enum':
        attrEndpoint += '/enum';
        body.elements = attr.elements;
        body.default = attr.default || null;
        break;
      default:
        console.log(`   ⚠️ Unknown attribute type: ${attr.type}`);
        return false;
    }

    await appwriteRequest(attrEndpoint, 'POST', body);
    console.log(`   ✅ Attribute: ${attr.key} (${attr.type})`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️ Attribute exists: ${attr.key}`);
      return true;
    }
    console.log(`   ❌ Attribute ${attr.key}: ${error.message}`);
    return false;
  }
}

async function createRelationship(collectionId, rel) {
  const endpoint = `/databases/${ERP_DATABASE_ID}/collections/${collectionId}/attributes/relationship`;

  try {
    await appwriteRequest(endpoint, 'POST', {
      relatedCollectionId: rel.relatedCollection,
      type: rel.type,
      twoWay: rel.twoWay || false,
      key: rel.key,
      twoWayKey: rel.twoWayKey || null,
      onDelete: rel.onDelete || 'setNull'
    });
    console.log(`   ✅ Relationship: ${rel.key} → ${rel.relatedCollection}`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️ Relationship exists: ${rel.key}`);
      return true;
    }
    console.log(`   ❌ Relationship ${rel.key}: ${error.message}`);
    return false;
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 ERP Database Schema Update');
  console.log('================================\n');

  // 1. Új collection-ök létrehozása (relationships nélkül előbb)
  console.log('📦 PHASE 1: Creating new collections...');
  for (const coll of NEW_COLLECTIONS) {
    const created = await createCollection(coll);
    if (created && coll.attributes) {
      await wait(1000); // Wait for collection to be ready
      for (const attr of coll.attributes) {
        await createAttribute(coll.$id, attr);
        await wait(500);
      }
    }
  }

  // 2. Meglévő students collection bővítése
  console.log('\n📦 PHASE 2: Updating students collection...');
  for (const attr of STUDENTS_NEW_ATTRIBUTES) {
    await createAttribute('students', attr);
    await wait(500);
  }

  // 3. subjects collection feltöltése attribútumokkal
  console.log('\n📦 PHASE 3: Updating subjects collection...');
  for (const attr of SUBJECTS_ATTRIBUTES) {
    await createAttribute('subjects', attr);
    await wait(500);
  }

  // 4. generations collection bővítése
  console.log('\n📦 PHASE 4: Updating generations collection...');
  for (const attr of GENERATIONS_ATTRIBUTES) {
    await createAttribute('generations', attr);
    await wait(500);
  }

  // 5. study_programs bővítése
  console.log('\n📦 PHASE 5: Updating study_programs collection...');
  for (const attr of STUDY_PROGRAMS_NEW_ATTRIBUTES) {
    await createAttribute('study_programs', attr);
    await wait(500);
  }

  // 6. Relationships hozzáadása (ezeket utoljára, mert a collection-öknek léteznie kell)
  console.log('\n📦 PHASE 6: Creating relationships...');

  // students relationships
  console.log('\n   Students relationships:');
  for (const rel of STUDENTS_NEW_RELATIONSHIPS) {
    await createRelationship('students', rel);
    await wait(1000);
  }

  // student_enrollments relationships
  console.log('\n   Student enrollments relationships:');
  const enrollmentRels = NEW_COLLECTIONS.find(c => c.$id === 'student_enrollments')?.relationships || [];
  for (const rel of enrollmentRels) {
    await createRelationship('student_enrollments', rel);
    await wait(1000);
  }

  // student_grades relationships
  console.log('\n   Student grades relationships:');
  const gradesRels = NEW_COLLECTIONS.find(c => c.$id === 'student_grades')?.relationships || [];
  for (const rel of gradesRels) {
    await createRelationship('student_grades', rel);
    await wait(1000);
  }

  console.log('\n================================');
  console.log('✅ Schema update complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/fetch-erp-schema.js - to update local schema');
  console.log('2. Run: node scripts/erp-seed-data.js - to seed initial data');
}

main().catch(console.error);
