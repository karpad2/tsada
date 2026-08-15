/**
 * Setup script: substitutions dokumentum letrehozasa a general_settings kollekcioban
 *
 * Futtatas:
 *   APPWRITE_API_KEY=your_api_key npx tsx scripts/setup-substitutions.ts
 */
import { Client, Databases, Permission, Role } from 'node-appwrite'

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1'
const PROJECT_ID = '659ea7f886cf55d4528a'
const WEBSITE_DB = '658d3bb1c4785b1fad28'
const GENERAL_SETTINGS = '6685329bdc8a922a45f2'
const DOC_ID = 'substitutions'

async function setup() {
  const API_KEY = process.env.APPWRITE_API_KEY
  if (!API_KEY) {
    console.error('Hianyzik az APPWRITE_API_KEY kornyezeti valtozo.')
    console.log('  APPWRITE_API_KEY=your_api_key npx tsx scripts/setup-substitutions.ts')
    process.exit(1)
  }

  const client = new Client()
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
  const databases = new Databases(client)

  try {
    await databases.getDocument(WEBSITE_DB, GENERAL_SETTINGS, DOC_ID)
    console.log('A substitutions dokumentum mar letezik.')
    return
  } catch {
    // create below
  }

  await databases.createDocument(
    WEBSITE_DB,
    GENERAL_SETTINGS,
    DOC_ID,
    {
      setting_status: true,
      setting_data: JSON.stringify({ entries: [] })
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  )
  console.log('substitutions dokumentum letrehozva.')
}

setup().catch((error) => {
  console.error(error)
  process.exit(1)
})
