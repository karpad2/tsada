/**
 * ERP Database Schema Fetcher
 * Lekéri az ERP database összes collection-jét
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

async function fetchERPSchema() {
    console.log('🔍 Fetching ERP database collections...\n');

    const response = await fetch(`${ENDPOINT}/databases/${ERP_DATABASE_ID}/collections?queries[]=${encodeURIComponent(JSON.stringify({ method: 'limit', values: [100] }))}`, {
        headers: {
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    console.log(`📊 Collections in ERP database: ${data.total}\n`);

    const schema = {
        databaseId: ERP_DATABASE_ID,
        databaseName: 'ERP',
        fetchedAt: new Date().toISOString(),
        total: data.total,
        collections: {}
    };

    console.log('| # | Collection Name | Collection ID | Attributes |');
    console.log('|---|-----------------|---------------|------------|');

    data.collections.forEach((coll, i) => {
        console.log(`| ${i+1} | ${coll.name} | ${coll.$id} | ${coll.attributes?.length || 0} |`);

        schema.collections[coll.$id] = {
            $id: coll.$id,
            name: coll.name,
            enabled: coll.enabled,
            attributes: coll.attributes.map(attr => ({
                key: attr.key,
                type: attr.type,
                required: attr.required,
                array: attr.array,
                size: attr.size,
                default: attr.default,
                ...(attr.elements && { elements: attr.elements })
            })),
            indexes: coll.indexes?.map(idx => ({
                key: idx.key,
                type: idx.type,
                attributes: idx.attributes
            })) || []
        };
    });

    const outputPath = path.join(__dirname, '../DATABASE_SCHEMA_ERP.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    console.log(`\n✅ Schema saved to: DATABASE_SCHEMA_ERP.json`);

    // Markdown verzió
    let markdown = `# 🏢 ERP Database Schema\n\n`;
    markdown += `> Fetched: ${schema.fetchedAt}\n`;
    markdown += `> Database ID: ${schema.databaseId}\n`;
    markdown += `> Total Collections: ${schema.total}\n\n`;

    for (const [id, coll] of Object.entries(schema.collections)) {
        markdown += `## 📁 ${coll.name}\n\n`;
        markdown += `- **Collection ID:** \`${coll.$id}\`\n`;
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

    const mdPath = path.join(__dirname, '../DATABASE_SCHEMA_ERP.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`📝 Markdown version saved to: DATABASE_SCHEMA_ERP.md`);
}

fetchERPSchema().catch(console.error);
