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
const DATABASE_ID = '658d3bb1c4785b1fad28';

async function listAllCollections() {
    console.log('🔍 Fetching ALL collections from Appwrite...\n');

    const allCollections = [];
    let offset = 0;
    const limit = 100;
    let total = 0;

    // Paginate through all collections
    while (true) {
        // Appwrite REST API query format
        const queryParams = new URLSearchParams();
        queryParams.append('queries[0]', JSON.stringify({ method: 'limit', values: [limit] }));
        queryParams.append('queries[1]', JSON.stringify({ method: 'offset', values: [offset] }));

        const response = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections?${queryParams.toString()}`, {
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
        total = data.total;
        allCollections.push(...data.collections);

        if (allCollections.length >= total || data.collections.length === 0) {
            break;
        }
        offset += limit;
    }

    console.log(`📊 Total collections in database: ${total}\n`);
    console.log('| # | Collection Name | Collection ID | Attributes |');
    console.log('|---|-----------------|---------------|------------|');

    allCollections.forEach((coll, i) => {
        console.log(`| ${i+1} | ${coll.name} | ${coll.$id} | ${coll.attributes?.length || 0} |`);
    });

    console.log(`\n✅ Found ${allCollections.length} collections`);

    const data = { collections: allCollections, total };

    // Save full schema
    const schema = {
        databaseId: DATABASE_ID,
        fetchedAt: new Date().toISOString(),
        total: data.total,
        collections: {}
    };

    for (const coll of data.collections) {
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
    }

    const outputPath = path.join(__dirname, '../DATABASE_SCHEMA_FULL.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    console.log(`\n📁 Full schema saved to DATABASE_SCHEMA_FULL.json`);
}

listAllCollections().catch(console.error);
