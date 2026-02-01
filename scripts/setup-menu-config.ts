/**
 * Setup script: menu_config dokumentum letrehozasa a general_settings kollekcioban
 *
 * Futtatas:
 *   APPWRITE_API_KEY=your_api_key npx tsx scripts/setup-menu-config.ts
 *
 * Ez a script letrehozza a menu_config dokumentumot ures alapertelmezett konfiggal.
 * A kliens oldali MenuEditor ezutan mar updateDocument-tel tudja modositani.
 */

import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const PROJECT_ID = '659ea7f886cf55d4528a';
const WEBSITE_DB = '658d3bb1c4785b1fad28';
const GENERAL_SETTINGS = '6685329bdc8a922a45f2';
const MENU_CONFIG_DOC_ID = 'menu_config';

async function setup() {
  const API_KEY = process.env.APPWRITE_API_KEY;

  if (!API_KEY) {
    console.error('Hianyzik az APPWRITE_API_KEY kornyezeti valtozo!');
    console.log('');
    console.log('Hasznalat:');
    console.log('  APPWRITE_API_KEY=your_api_key npx tsx scripts/setup-menu-config.ts');
    console.log('');
    console.log('Alternativa: Hozd letre manuálisan az Appwrite Console-ban:');
    console.log(`  Database: ${WEBSITE_DB}`);
    console.log(`  Collection: ${GENERAL_SETTINGS}`);
    console.log(`  Document ID: ${MENU_CONFIG_DOC_ID}`);
    console.log('  setting_status: false');
    console.log('  setting_data: ""');
    process.exit(1);
  }

  const client = new Client();
  client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);

  console.log('menu_config dokumentum letrehozasa...');

  try {
    // Ellenorizzuk, hogy mar letezik-e
    try {
      await databases.getDocument(WEBSITE_DB, GENERAL_SETTINGS, MENU_CONFIG_DOC_ID);
      console.log('A menu_config dokumentum mar letezik. Nincs tennivalo.');
      return;
    } catch {
      // Nem letezik, letrehozzuk
    }

    await databases.createDocument(
      WEBSITE_DB,
      GENERAL_SETTINGS,
      MENU_CONFIG_DOC_ID,
      {
        setting_status: false,
        setting_data: ''
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    console.log('menu_config dokumentum sikeresen letrehozva.');
    console.log('A Menu Editor (/admin/menu-editor) mar hasznalhato.');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('A dokumentum mar letezik.');
    } else {
      console.error('Hiba:', error.message || error);
    }
  }
}

setup();
