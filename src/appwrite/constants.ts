/** Single source of truth for Appwrite connection (browser SDK). */
export const APPWRITE_ENDPOINT = 'https://appwrite.tsada.edu.rs/v1'
export const APPWRITE_PROJECT_ID = '659ea7f886cf55d4528a'

/** Appwrite listDocuments default is 25 — always set an explicit limit. */
export const DEFAULT_LIST_LIMIT = 100
export const MAX_LIST_LIMIT = 100

/**
 * Cloud Function ID for secure user label (role) updates.
 * Override with VITE_FUNCTION_SET_USER_LABELS if the deployed ID differs.
 */
export const FUNCTION_SET_USER_LABELS =
  import.meta.env.VITE_FUNCTION_SET_USER_LABELS || 'set-user-labels'
