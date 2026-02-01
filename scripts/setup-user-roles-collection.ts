/**
 * Setup script: user_roles collection létrehozása az Appwrite-ban
 *
 * Futtatás:
 *   npx tsx scripts/setup-user-roles-collection.ts
 *
 * Ez a script létrehozza a user_roles collection-t a roles_db adatbázisban
 * a következő attribútumokkal:
 *   - user_id (string, required) - Appwrite user $id
 *   - role (string, required) - 'admin' | 'editor' | 'teacher'
 *   - assigned_classes (string[], optional) - Osztály ID-k (teacher role-nál)
 *   - assigned_by (string, optional) - Ki adta a jogot
 *   - created_at (string, optional) - Mikor
 */

import { Client, Databases, ID } from 'appwrite';

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const PROJECT_ID = '659ea7f886cf55d4528a';
const ROLES_DB = '658e8e87938c0b66650c';
const COLLECTION_ID = 'user_roles';

async function setup() {
  // API key szükséges a collection létrehozáshoz
  // Ezt az Appwrite Console-ból kell megadni
  const API_KEY = process.env.APPWRITE_API_KEY;

  if (!API_KEY) {
    console.error('❌ Hiányzó APPWRITE_API_KEY környezeti változó!');
    console.log('');
    console.log('Használat:');
    console.log('  APPWRITE_API_KEY=your_api_key npx tsx scripts/setup-user-roles-collection.ts');
    console.log('');
    console.log('Alternatíva: Hozd létre manuálisan az Appwrite Console-ban:');
    console.log('');
    console.log('1. Nyisd meg: https://appwrite.tsada.edu.rs');
    console.log('2. Menj a Databases szekcióba');
    console.log(`3. Válaszd ki a roles_db adatbázist (ID: ${ROLES_DB})`);
    console.log('4. Kattints a "Create Collection" gombra');
    console.log(`5. Collection ID: ${COLLECTION_ID}`);
    console.log('6. Hozd létre a következő attribútumokat:');
    console.log('');
    console.log('   Attribútum          Típus        Required   Méret');
    console.log('   ─────────────────────────────────────────────────────');
    console.log('   user_id             String       Yes        128');
    console.log('   role                String       Yes        20');
    console.log('   assigned_classes    String[]     No         128 (elem)');
    console.log('   assigned_by         String       No         128');
    console.log('   created_at          String       No         64');
    console.log('');
    console.log('7. Hozz létre egy indexet:');
    console.log('   - Név: user_id_index');
    console.log('   - Típus: Key');
    console.log('   - Attribútum: user_id');
    console.log('   - Sorrend: ASC');
    console.log('');
    console.log('8. Permissions beállítása:');
    console.log('   - Any: Read (hogy bármelyik bejelentkezett user le tudja kérdezni a saját role-ját)');
    console.log('   - Users: Read');
    console.log('   - Vagy specifikus: role:admin - Read/Write/Update/Delete');
    console.log('');
    process.exit(1);
  }

  const client = new Client();
  client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);

  console.log('🚀 user_roles collection létrehozása...');

  try {
    // Collection létrehozása
    await databases.createCollection(
      ROLES_DB,
      COLLECTION_ID,
      'User Roles',
      [
        // Permissions: bárki olvashat (bejelentkezett user lekérdezi a sajátját)
        'read("users")',
        'create("team:admin")',
        'update("team:admin")',
        'delete("team:admin")'
      ]
    );
    console.log('✅ Collection létrehozva: user_roles');

    // Attribútumok létrehozása
    await databases.createStringAttribute(
      ROLES_DB, COLLECTION_ID, 'user_id', 128, true
    );
    console.log('  ✅ user_id attribútum');

    await databases.createStringAttribute(
      ROLES_DB, COLLECTION_ID, 'role', 20, true
    );
    console.log('  ✅ role attribútum');

    // String array a hozzárendelt osztályoknak
    await databases.createStringAttribute(
      ROLES_DB, COLLECTION_ID, 'assigned_classes', 128, false, undefined, true
    );
    console.log('  ✅ assigned_classes attribútum');

    await databases.createStringAttribute(
      ROLES_DB, COLLECTION_ID, 'assigned_by', 128, false
    );
    console.log('  ✅ assigned_by attribútum');

    await databases.createStringAttribute(
      ROLES_DB, COLLECTION_ID, 'created_at', 64, false
    );
    console.log('  ✅ created_at attribútum');

    // Várunk egy kicsit, hogy az attribútumok létrejöjjenek
    console.log('  ⏳ Várakozás az attribútumok létrehozására...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Index létrehozása
    await databases.createIndex(
      ROLES_DB, COLLECTION_ID, 'user_id_index', 'key', ['user_id'], ['asc']
    );
    console.log('  ✅ user_id_index index');

    console.log('');
    console.log('🎉 Kész! A user_roles collection sikeresen létrejött.');
    console.log('');
    console.log('Következő lépés: Adj hozzá egy admin user-t:');
    console.log('  A Role Manager felületen (/admin/roles) add meg a user ID-t és válaszd ki a szerepkört.');

  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️  A collection már létezik.');
    } else {
      console.error('❌ Hiba:', error.message || error);
    }
  }
}

setup();
