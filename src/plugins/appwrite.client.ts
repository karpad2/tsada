import { Client, Databases, Storage, Account, Functions } from 'appwrite'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Initialize Appwrite client
  const client = new Client()
  client
    .setEndpoint(config.public.appwriteEndpoint as string)
    .setProject(config.public.appwriteProject as string)

  // Initialize services
  const databases = new Databases(client)
  const storage = new Storage(client)
  const account = new Account(client)
  const functions = new Functions(client)

  // Provide to app
  return {
    provide: {
      appwrite: {
        client,
        databases,
        storage,
        account,
        functions
      }
    }
  }
})
