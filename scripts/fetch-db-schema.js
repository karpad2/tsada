/**
 * Appwrite Database Schema Fetcher
 *
 * Ez a script lekéri az összes collection struktúráját az Appwrite-ból
 * és kiírja egy JSON fájlba, amit Claude olvasni tud.
 *
 * Használat: node scripts/fetch-db-schema.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config betöltése
const configPath = path.join(__dirname, '../src/appwrite/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// MCP config betöltése az API key-ért
const mcpConfigPath = path.join(__dirname, '../.claude/mcp.json');
const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
const apiKey = mcpConfig.mcpServers['appwrite-api'].env.APPWRITE_API_KEY;

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const PROJECT_ID = '659ea7f886cf55d4528a';

// Appwrite REST API hívás
async function appwriteRequest(endpoint) {
    const response = await fetch(`${ENDPOINT}${endpoint}`, {
        headers: {
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
}

async function fetchDatabaseSchema() {
    console.log('🔍 Fetching Appwrite database schema...\n');

    const databaseId = config.website_db;
    const schema = {
        databaseId,
        fetchedAt: new Date().toISOString(),
        collections: {}
    };

    // Összes collection ID a config-ból
    const collectionIds = Object.entries(config)
        .filter(([key, value]) =>
            typeof value === 'string' &&
            value.length === 20 &&
            !key.includes('storage') &&
            !key.includes('images') &&
            !key.includes('db') &&
            key !== 'pan'
        )
        .map(([key, id]) => ({ name: key, id }));

    // Hozzáadjuk a _db végű collection-öket is
    const dbCollections = Object.entries(config)
        .filter(([key, value]) =>
            typeof value === 'string' &&
            value.length > 15 &&
            (key.endsWith('_db') || key.endsWith('_coll'))
        )
        .map(([key, id]) => ({ name: key, id }));

    const allCollections = [...collectionIds, ...dbCollections];

    console.log(`📊 Found ${allCollections.length} collections to fetch\n`);

    for (const { name, id } of allCollections) {
        try {
            console.log(`  📁 Fetching: ${name} (${id})`);

            const collection = await appwriteRequest(`/databases/${databaseId}/collections/${id}`);

            schema.collections[name] = {
                $id: collection.$id,
                name: collection.name,
                enabled: collection.enabled,
                documentSecurity: collection.documentSecurity,
                attributes: collection.attributes.map(attr => ({
                    key: attr.key,
                    type: attr.type,
                    required: attr.required,
                    array: attr.array,
                    size: attr.size,
                    default: attr.default,
                    // Enum values ha van
                    ...(attr.elements && { elements: attr.elements })
                })),
                indexes: collection.indexes?.map(idx => ({
                    key: idx.key,
                    type: idx.type,
                    attributes: idx.attributes
                })) || []
            };

            console.log(`    ✅ ${collection.attributes.length} attributes`);

        } catch (error) {
            console.log(`    ❌ Error: ${error.message}`);
            schema.collections[name] = {
                $id: id,
                error: error.message
            };
        }
    }

    // Kiírás fájlba
    const outputPath = path.join(__dirname, '../DATABASE_SCHEMA.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));

    console.log(`\n✅ Schema saved to: DATABASE_SCHEMA.json`);
    console.log(`📊 Total collections: ${Object.keys(schema.collections).length}`);

    // Markdown verzió is
    let markdown = `# 🗄️ Appwrite Database Schema\n\n`;
    markdown += `> Fetched: ${schema.fetchedAt}\n`;
    markdown += `> Database ID: ${schema.databaseId}\n\n`;

    for (const [name, coll] of Object.entries(schema.collections)) {
        if (coll.error) {
            markdown += `## ❌ ${name}\n\nError: ${coll.error}\n\n`;
            continue;
        }

        markdown += `## 📁 ${name}\n\n`;
        markdown += `- **Collection ID:** \`${coll.$id}\`\n`;
        markdown += `- **Name:** ${coll.name}\n`;
        markdown += `- **Enabled:** ${coll.enabled}\n\n`;

        if (coll.attributes.length > 0) {
            markdown += `### Attributes\n\n`;
            markdown += `| Key | Type | Required | Array | Size |\n`;
            markdown += `|-----|------|----------|-------|------|\n`;

            for (const attr of coll.attributes) {
                markdown += `| \`${attr.key}\` | ${attr.type} | ${attr.required ? '✅' : '❌'} | ${attr.array ? '✅' : '❌'} | ${attr.size || '-'} |\n`;
            }
            markdown += `\n`;
        }

        if (coll.indexes?.length > 0) {
            markdown += `### Indexes\n\n`;
            for (const idx of coll.indexes) {
                markdown += `- **${idx.key}** (${idx.type}): ${idx.attributes.join(', ')}\n`;
            }
            markdown += `\n`;
        }

        markdown += `---\n\n`;
    }

    const mdPath = path.join(__dirname, '../DATABASE_SCHEMA.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`📝 Markdown version saved to: DATABASE_SCHEMA.md`);
}

fetchDatabaseSchema().catch(console.error);
