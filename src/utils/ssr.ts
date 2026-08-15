/**
 * SSR / client environment helpers (Vite injects import.meta.env.SSR).
 */

export const isSSR = typeof window === 'undefined' || import.meta.env.SSR === true

export const isClient = !isSSR

/** Safe no-op storage for Pinia persist during SSR */
export const ssrSafeStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  get length() {
    return 0
  }
}

export function getClientStorage(): Storage {
  if (typeof window === 'undefined') return ssrSafeStorage
  try {
    return window.localStorage
  } catch {
    return ssrSafeStorage
  }
}
