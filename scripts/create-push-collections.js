/**
 * Push Notifications Collections Creator
 *
 * Creates the necessary collections for push notifications in Appwrite
 *
 * Usage: node scripts/create-push-collections.js
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
const DATABASE_ID = '658d3bb1c4785b1fad28';

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

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return response.json();
}

async function createCollection(name, collectionId) {
    console.log(`\n📁 Creating collection: ${name}...`);

    try {
        const collection = await appwriteRequest(`/databases/${DATABASE_ID}/collections`, 'POST', {
            collectionId,
            name,
            permissions: [
                'read("any")',
                'create("users")',
                'update("users")',
                'delete("users")'
            ],
            documentSecurity: false,
            enabled: true
        });

        console.log(`   ✅ Created: ${collection.$id}`);
        return collection.$id;
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`   ⚠️ Collection already exists, skipping...`);
            return collectionId;
        }
        throw error;
    }
}

async function createAttribute(collectionId, attribute) {
    const { key, type, size, required, array, defaultValue, elements } = attribute;

    console.log(`   📝 Adding attribute: ${key} (${type})`);

    try {
        let endpoint = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes`;
        let body = { key, required: required || false, array: array || false };

        switch (type) {
            case 'string':
                endpoint += '/string';
                body.size = size || 255;
                if (defaultValue !== undefined) body.default = defaultValue;
                break;
            case 'integer':
                endpoint += '/integer';
                if (defaultValue !== undefined) body.default = defaultValue;
                break;
            case 'boolean':
                endpoint += '/boolean';
                if (defaultValue !== undefined) body.default = defaultValue;
                break;
            case 'datetime':
                endpoint += '/datetime';
                if (defaultValue !== undefined) body.default = defaultValue;
                break;
            case 'enum':
                endpoint += '/enum';
                body.elements = elements;
                if (defaultValue !== undefined) body.default = defaultValue;
                break;
        }

        await appwriteRequest(endpoint, 'POST', body);
        console.log(`      ✅ Created`);
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`      ⚠️ Already exists, skipping...`);
        } else {
            console.log(`      ❌ Error: ${error.message}`);
        }
    }
}

async function createIndex(collectionId, key, type, attributes) {
    console.log(`   🔍 Creating index: ${key}`);

    try {
        await appwriteRequest(`/databases/${DATABASE_ID}/collections/${collectionId}/indexes`, 'POST', {
            key,
            type,
            attributes
        });
        console.log(`      ✅ Created`);
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`      ⚠️ Already exists, skipping...`);
        } else {
            console.log(`      ❌ Error: ${error.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Creating Push Notification Collections...\n');

    // 1. Push Subscriptions Collection
    const pushSubsId = await createCollection('push_subscriptions', 'push_subscriptions');

    // Wait for collection to be ready
    await new Promise(r => setTimeout(r, 2000));

    const pushSubsAttributes = [
        { key: 'user_id', type: 'string', size: 50, required: false },
        { key: 'endpoint', type: 'string', size: 500, required: true },
        { key: 'p256dh', type: 'string', size: 200, required: true },
        { key: 'auth', type: 'string', size: 100, required: true },
        { key: 'user_agent', type: 'string', size: 500, required: false },
        { key: 'created_at', type: 'datetime', required: false },
        { key: 'last_used', type: 'datetime', required: false },
        { key: 'is_active', type: 'boolean', required: false, defaultValue: true }
    ];

    for (const attr of pushSubsAttributes) {
        await createAttribute(pushSubsId, attr);
        await new Promise(r => setTimeout(r, 500)); // Rate limiting
    }

    // Wait for attributes to be ready
    await new Promise(r => setTimeout(r, 3000));

    // Create indexes
    await createIndex(pushSubsId, 'user_id_idx', 'key', ['user_id']);
    await createIndex(pushSubsId, 'endpoint_idx', 'unique', ['endpoint']);

    // 2. Push Notifications Log Collection
    const pushLogId = await createCollection('push_notifications_log', 'push_notifications_log');

    await new Promise(r => setTimeout(r, 2000));

    const pushLogAttributes = [
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'body', type: 'string', size: 1000, required: false },
        { key: 'icon', type: 'string', size: 255, required: false },
        { key: 'url', type: 'string', size: 500, required: false },
        { key: 'sent_by', type: 'string', size: 50, required: false },
        { key: 'sent_at', type: 'datetime', required: false },
        { key: 'target_type', type: 'enum', elements: ['all', 'users', 'specific'], required: false, defaultValue: 'all' },
        { key: 'target_users', type: 'string', size: 5000, required: false, array: false },
        { key: 'success_count', type: 'integer', required: false, defaultValue: 0 },
        { key: 'failure_count', type: 'integer', required: false, defaultValue: 0 },
        { key: 'status', type: 'enum', elements: ['pending', 'sending', 'completed', 'failed'], required: false, defaultValue: 'pending' }
    ];

    for (const attr of pushLogAttributes) {
        await createAttribute(pushLogId, attr);
        await new Promise(r => setTimeout(r, 500));
    }

    await new Promise(r => setTimeout(r, 3000));

    await createIndex(pushLogId, 'sent_at_idx', 'key', ['sent_at']);
    await createIndex(pushLogId, 'status_idx', 'key', ['status']);

    console.log('\n\n✅ Push Notification Collections created successfully!');
    console.log('\n📋 Update your config.json with:');
    console.log(`   "push_subscriptions": "${pushSubsId}"`);
    console.log(`   "push_notifications_log": "${pushLogId}"`);
}

main().catch(console.error);
