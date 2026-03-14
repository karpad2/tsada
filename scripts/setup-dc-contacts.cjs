/**
 * Setup script: Create dc_contacts collection in Appwrite
 *
 * Creates the collection with attributes:
 *   - owner_id: string(50) - required
 *   - contact_id: string(50) - required
 *   - contact_nickname: string(50) - required
 *   - ecdh_public_key: string(2000) - required
 *   - added_at: string(30) - required
 *   - blocked: boolean - default false
 *
 * Indexes:
 *   - owner_id (key) - list contacts by owner
 *   - owner_contact (unique) - prevent duplicate contacts
 *   - contact_id (key) - reverse lookup
 *
 * Usage: node scripts/setup-dc-contacts.cjs
 */

const { Client, Databases, Permission, Role } = require(require('path').join(process.cwd(), 'node_modules', 'node-appwrite'));

const client = new Client();
client.setEndpoint('https://appwrite.tsada.edu.rs/v1')
  .setProject('659ea7f886cf55d4528a')
  .setKey('8d162ece139831a5da8159ee244835dc07994f5cb164a86550187d0ac3621bbdafadfd48da81862d51fd4e9052a2eb9ad36c4dfec638b0cffa6277f95b05d503f426c49fd12ba202b7959649539bf583bc3743bdfea4213faef92650c12b8352dfa700131f9cc4c172722bd5448af9929d287ecf83091198212f71d4fdbfaa31');

const WEBSITE_DB = '658d3bb1c4785b1fad28';
const COLLECTION_ID = 'dc_contacts';

async function setup() {
  const db = new Databases(client);

  // 1. Create the collection
  console.log('Creating dc_contacts collection...');
  try {
    await db.createCollection(
      WEBSITE_DB,
      COLLECTION_ID,
      'dc_contacts',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      true // documentSecurity enabled
    );
    console.log('  Collection created successfully!');
  } catch (err) {
    if (err.code === 409) {
      console.log('  Collection already exists, continuing with attributes...');
    } else {
      throw err;
    }
  }

  // 2. Create attributes
  console.log('\nCreating attributes...');

  const attributes = [
    { name: 'owner_id', type: 'string', size: 50, required: true },
    { name: 'contact_id', type: 'string', size: 50, required: true },
    { name: 'contact_nickname', type: 'string', size: 50, required: true },
    { name: 'ecdh_public_key', type: 'string', size: 2000, required: true },
    { name: 'added_at', type: 'string', size: 30, required: true },
    { name: 'blocked', type: 'boolean', required: false, default: false },
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await db.createStringAttribute(
          WEBSITE_DB,
          COLLECTION_ID,
          attr.name,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'boolean') {
        await db.createBooleanAttribute(
          WEBSITE_DB,
          COLLECTION_ID,
          attr.name,
          attr.required,
          attr.default
        );
      }
      console.log(`  Created attribute: ${attr.name} (${attr.type})`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`  Attribute ${attr.name} already exists, skipping...`);
      } else {
        console.error(`  ERROR creating ${attr.name}:`, err.message);
      }
    }
  }

  // Wait for attributes to be ready
  console.log('\nWaiting for attributes to be processed...');
  await sleep(3000);

  // 3. Create indexes
  console.log('Creating indexes...');

  const indexes = [
    {
      key: 'idx_owner',
      type: 'key',
      attributes: ['owner_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_owner_contact',
      type: 'unique',
      attributes: ['owner_id', 'contact_id'],
      orders: ['ASC', 'ASC'],
    },
    {
      key: 'idx_contact',
      type: 'key',
      attributes: ['contact_id'],
      orders: ['ASC'],
    },
  ];

  for (const idx of indexes) {
    try {
      await db.createIndex(
        WEBSITE_DB,
        COLLECTION_ID,
        idx.key,
        idx.type,
        idx.attributes,
        idx.orders
      );
      console.log(`  Created index: ${idx.key} (${idx.type}) on [${idx.attributes.join(', ')}]`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`  Index ${idx.key} already exists, skipping...`);
      } else {
        console.error(`  ERROR creating index ${idx.key}:`, err.message);
      }
    }
  }

  console.log('\n--- Setup Complete ---');
  console.log('Collection: dc_contacts');
  console.log('Database: ' + WEBSITE_DB);
  console.log('Attributes: owner_id, contact_id, contact_nickname, ecdh_public_key, added_at, blocked');
  console.log('Indexes: idx_owner, idx_owner_contact (unique), idx_contact');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
