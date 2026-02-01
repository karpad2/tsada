/**
 * Migration script: setting_data attributum meret novelese 255 -> 16384
 *
 * Futtatas:
 *   APPWRITE_API_KEY=your_api_key npx tsx scripts/migrate-setting-data-size.ts
 *
 * Ez a script:
 * 1. Backup-olja az osszes general_settings dokumentum setting_data mezot
 * 2. Torli a regi setting_data attributumot (255 char limit)
 * 3. Letrehoz egy uj setting_data attributumot 16384 char limittel
 * 4. Visszaallitja az osszes dokumentum adatat
 */

import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const PROJECT_ID = '659ea7f886cf55d4528a';
const WEBSITE_DB = '658d3bb1c4785b1fad28';
const GENERAL_SETTINGS = '6685329bdc8a922a45f2';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAttribute(databases: Databases, status: 'available' | 'deleted') {
  const maxWait = 30;
  for (let i = 0; i < maxWait; i++) {
    try {
      const attr = await databases.getAttribute(WEBSITE_DB, GENERAL_SETTINGS, 'setting_data');
      if (status === 'available' && (attr as any).status === 'available') {
        return true;
      }
    } catch {
      if (status === 'deleted') {
        return true;
      }
    }
    console.log(`  Varakozas... (${i + 1}/${maxWait})`);
    await sleep(2000);
  }
  return false;
}

async function migrate() {
  const API_KEY = process.env.APPWRITE_API_KEY;

  if (!API_KEY) {
    console.error('Hianyzik az APPWRITE_API_KEY kornyezeti valtozo!');
    console.log('Hasznalat:');
    console.log('  APPWRITE_API_KEY=your_api_key npx tsx scripts/migrate-setting-data-size.ts');
    process.exit(1);
  }

  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const databases = new Databases(client);

  // 1. Backup all documents
  console.log('1. Dokumentumok backup...');
  const docs = await databases.listDocuments(WEBSITE_DB, GENERAL_SETTINGS, [
    Query.limit(100)
  ]);
  console.log(`   ${docs.documents.length} dokumentum talalhato.`);

  const backup: Array<{ id: string; setting_data: string }> = [];
  for (const doc of docs.documents) {
    if (doc.setting_data) {
      backup.push({ id: doc.$id, setting_data: doc.setting_data });
      console.log(`   Backup: ${doc.$id} (${doc.setting_data.length} char)`);
    }
  }

  // 2. Delete old attribute
  console.log('\n2. Regi setting_data attributum torlese...');
  try {
    await databases.deleteAttribute(WEBSITE_DB, GENERAL_SETTINGS, 'setting_data');
    console.log('   Torles elinditva, varakozas...');
  } catch (err: any) {
    if (err.code === 404) {
      console.log('   Attributum nem letezik, folytatas...');
    } else {
      throw err;
    }
  }

  // Wait for deletion
  const deleted = await waitForAttribute(databases, 'deleted');
  if (!deleted) {
    console.error('   HIBA: Attributum torles timeout!');
    process.exit(1);
  }
  console.log('   Attributum torolve.');

  // 3. Create new attribute with larger size
  console.log('\n3. Uj setting_data attributum letrehozasa (16384 char)...');
  await databases.createStringAttribute(
    WEBSITE_DB,
    GENERAL_SETTINGS,
    'setting_data',
    16384,
    false,
    ''
  );
  console.log('   Letrehozas elinditva, varakozas...');

  const created = await waitForAttribute(databases, 'available');
  if (!created) {
    console.error('   HIBA: Attributum letrehozas timeout!');
    console.log('   FONTOS: A backup adatok:');
    console.log(JSON.stringify(backup, null, 2));
    process.exit(1);
  }
  console.log('   Attributum letrehozva.');

  // 4. Restore data
  console.log('\n4. Adatok visszaallitasa...');
  for (const item of backup) {
    try {
      await databases.updateDocument(WEBSITE_DB, GENERAL_SETTINGS, item.id, {
        setting_data: item.setting_data
      });
      console.log(`   Visszaallitva: ${item.id}`);
    } catch (err: any) {
      console.error(`   HIBA ${item.id}:`, err.message);
    }
  }

  console.log('\nKesz! A setting_data attributum most 16384 karakter limitu.');
}

migrate();
