/**
 * Migration script: Set status='approved' on all album_images documents
 * that don't have a status field or have status=null.
 *
 * This fixes the issue where gallery images don't load for unauthenticated
 * users because AlbumViewer.vue filters by Query.equal('status', 'approved')
 * for non-admin users.
 *
 * Usage: node scripts/migrate-album-images-status.js
 */

const { Client, Databases, Query } = require(require('path').join(process.cwd(), 'node_modules', 'node-appwrite'));

const client = new Client();
client.setEndpoint('https://appwrite.tsada.edu.rs/v1')
  .setProject('659ea7f886cf55d4528a')
  .setKey('8d162ece139831a5da8159ee244835dc07994f5cb164a86550187d0ac3621bbdafadfd48da81862d51fd4e9052a2eb9ad36c4dfec638b0cffa6277f95b05d503f426c49fd12ba202b7959649539bf583bc3743bdfea4213faef92650c12b8352dfa700131f9cc4c172722bd5448af9929d287ecf83091198212f71d4fdbfaa31');

const WEBSITE_DB = '658d3bb1c4785b1fad28';
const ALBUM_IMAGES = '6596d072e9f944374991';

async function migrate() {
  const db = new Databases(client);

  let offset = 0;
  const limit = 100;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalDocuments = 0;

  console.log('Starting album_images status migration...');
  console.log('Setting status="approved" on documents without status or with null status.\n');

  while (true) {
    const response = await db.listDocuments(WEBSITE_DB, ALBUM_IMAGES, [
      Query.limit(limit),
      Query.offset(offset)
    ]);

    if (response.documents.length === 0) break;

    totalDocuments += response.documents.length;

    for (const doc of response.documents) {
      if (!doc.status || doc.status === null || doc.status === '') {
        try {
          await db.updateDocument(WEBSITE_DB, ALBUM_IMAGES, doc.$id, {
            status: 'approved'
          });
          totalUpdated++;
          console.log(`  Updated: ${doc.$id} (image_id: ${doc.image_id}) -> status: "approved"`);
        } catch (err) {
          console.error(`  ERROR updating ${doc.$id}:`, err.message);
        }
      } else {
        totalSkipped++;
        console.log(`  Skipped: ${doc.$id} (already has status: "${doc.status}")`);
      }
    }

    offset += limit;

    if (response.documents.length < limit) break;
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Total documents scanned: ${totalDocuments}`);
  console.log(`Updated (set status="approved"): ${totalUpdated}`);
  console.log(`Skipped (already had status): ${totalSkipped}`);
  console.log('Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
