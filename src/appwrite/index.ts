import { Client, Account, Databases, Storage, Query } from 'appwrite'
import config from './config.json'
import { useLoadingStore } from '@/stores/loading'
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from './constants'

const appw = new Client()

appw.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID)

const account = new Account(appw)
const databases = new Databases(appw)
const storage = new Storage(appw)

// Valid user roles that can be extracted from Appwrite user labels
const VALID_ROLES = ['admin', 'editor', 'teacher', 'photographer', 'secretary']

interface AppwriteConfig {
  website_db: string
  website_images: string
  gallery: string
  gallery_images: string
  [key: string]: string
}

interface UserSession {
  $id: string
  name: string
  email: string
  status: boolean
  roles?: string[]
}

class AppwriteService {
  private client: Client
  private account: Account
  private databases: Databases
  private storage: Storage
  public config: AppwriteConfig

  constructor() {
    this.client = appw
    this.account = account
    this.databases = databases
    this.storage = storage
    this.config = config as AppwriteConfig
  }

  async checkAuth(): Promise<UserSession | null> {
    const loading = useLoadingStore()

    try {
      const user = await this.account.get()

      if (user) {
        loading.setUserLoggedin(true)
        loading.setuid(user.$id)

        const labels = user.labels || []
        const role = labels.find((label: string) => VALID_ROLES.includes(label)) || ''
        loading.setUserRole(role)

        return {
          $id: user.$id,
          name: user.name,
          email: user.email,
          status: true,
          roles: labels
        }
      }
    } catch {
      // Expected for guest users
      loading.setUserLoggedin(false)
      loading.setUserRole('')
    }

    return null
  }

  async login(email: string, password: string): Promise<UserSession> {
    await this.account.createEmailPasswordSession(email, password)
    const user = await this.account.get()

    return {
      $id: user.$id,
      name: user.name,
      email: user.email,
      status: true
    }
  }

  async logout(): Promise<void> {
    await this.account.deleteSession('current')
    const loading = useLoadingStore()
    loading.setUserLoggedin(false)
    loading.setUserRole('')
  }

  getClient(): Client {
    return this.client
  }

  getAccount(): Account {
    return this.account
  }

  getDatabases(): Databases {
    return this.databases
  }

  getStorage(): Storage {
    return this.storage
  }
}

const appwriteService = new AppwriteService()

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Paginate through all documents (Appwrite max 100 per request).
 * Prefer this over bare listDocuments when you need every row.
 * Do not pass Query.limit / Query.offset in `queries` — pagination is handled here.
 */
async function listAllDocuments(
  databaseId: string,
  collectionId: string,
  queries: string[] = [],
  maxTotal = 2000
): Promise<{ documents: any[]; total: number }> {
  const documents: any[] = []
  let offset = 0
  let total = 0

  while (offset < maxTotal) {
    const page = await databases.listDocuments(databaseId, collectionId, [
      ...queries,
      Query.limit(MAX_LIST_LIMIT),
      Query.offset(offset)
    ])
    total = page.total
    documents.push(...page.documents)
    if (page.documents.length < MAX_LIST_LIMIT) break
    offset += MAX_LIST_LIMIT
  }

  return { documents, total }
}

export {
  appw,
  config,
  account as user,
  databases,
  storage,
  appwriteService,
  randomIntFromInterval,
  listAllDocuments,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  DEFAULT_LIST_LIMIT,
  MAX_LIST_LIMIT
}

export type { AppwriteConfig, UserSession }
