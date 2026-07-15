import { ref, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const UPDATE_FLAG = 'pwa-updating'
const UPDATE_FLAG_TS = 'pwa-updating-ts'
const UPDATE_COOLDOWN_MS = 60_000 // don't re-prompt within 1 min after update attempt
const PERIODIC_CHECK_MS = 60 * 60 * 1000 // hourly SW update check

function isRecentlyUpdating(): boolean {
  try {
    const flag = sessionStorage.getItem(UPDATE_FLAG)
    const ts = Number(sessionStorage.getItem(UPDATE_FLAG_TS) || 0)
    if (flag === 'true' && Date.now() - ts < UPDATE_COOLDOWN_MS) {
      return true
    }
    // stale flag
    if (flag === 'true' && Date.now() - ts >= UPDATE_COOLDOWN_MS) {
      sessionStorage.removeItem(UPDATE_FLAG)
      sessionStorage.removeItem(UPDATE_FLAG_TS)
    }
  } catch {
    /* private mode etc. */
  }
  return false
}

function markUpdating() {
  try {
    sessionStorage.setItem(UPDATE_FLAG, 'true')
    sessionStorage.setItem(UPDATE_FLAG_TS, String(Date.now()))
  } catch {
    /* ignore */
  }
}

function clearUpdating() {
  try {
    sessionStorage.removeItem(UPDATE_FLAG)
    sessionStorage.removeItem(UPDATE_FLAG_TS)
  } catch {
    /* ignore */
  }
}

// Singleton registration so multiple components share one SW binding
let swBound = false
let updateServiceWorkerFn: ((reloadPage?: boolean) => Promise<void>) | null = null
let periodicTimer: ReturnType<typeof setInterval> | null = null

const needRefresh = ref(false)
const offlineReady = ref(false)
const updateAvailable = ref(false)

function bindServiceWorker() {
  if (swBound || typeof window === 'undefined') return
  swBound = true

  const {
    needRefresh: pwaNeedRefresh,
    offlineReady: pwaOfflineReady,
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      clearUpdating()

      // Periodic update checks (when tab is visible)
      if (registration && !periodicTimer) {
        periodicTimer = setInterval(() => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {})
          }
        }, PERIODIC_CHECK_MS)
      }
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error', error)
      clearUpdating()
    },
    onNeedRefresh() {
      // Already mid-update or just finished — do not re-prompt / re-reload
      if (isRecentlyUpdating()) {
        console.info('[PWA] Update in progress or recent — skip prompt')
        return
      }
      needRefresh.value = true
      updateAvailable.value = true
    },
    onOfflineReady() {
      offlineReady.value = true
      clearUpdating()
    }
  })

  updateServiceWorkerFn = updateServiceWorker

  // Keep local flags in sync if the plugin flips them
  watch(pwaNeedRefresh, (v) => {
    if (v && !isRecentlyUpdating()) {
      needRefresh.value = true
      updateAvailable.value = true
    }
  })
  watch(pwaOfflineReady, (v) => {
    if (v) offlineReady.value = true
  })

  // One clean reload when the new worker takes control
  if ('serviceWorker' in navigator) {
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      if (!isRecentlyUpdating()) return
      reloading = true
      // Allow next load to clear the flag after settle
      setTimeout(() => clearUpdating(), 2000)
      window.location.reload()
    })
  }
}

export function usePWA() {
  bindServiceWorker()

  const closePrompt = () => {
    needRefresh.value = false
    updateAvailable.value = false
  }

  const updateApp = async () => {
    try {
      needRefresh.value = false
      updateAvailable.value = false
      markUpdating()

      if (updateServiceWorkerFn) {
        // reloadPage=true → skipWaiting + claims + plugin may reload;
        // our controllerchange handler also reloads once with loop protection
        await updateServiceWorkerFn(true)
      }
    } catch (error) {
      console.error('[PWA] Error updating service worker:', error)
      clearUpdating()
      throw error
    }
  }

  const checkForUpdate = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
      }
    } catch (error) {
      console.error('[PWA] Error checking for updates:', error)
    }
  }

  /** Clear runtime/API caches only (keep precached shell) */
  const clearCacheAndReload = async () => {
    if (!('caches' in window)) return
    try {
      const cacheNames = await caches.keys()
      const runtime = cacheNames.filter(
        (name) =>
          name.includes('api-cache') ||
          name.includes('dynamic-cache') ||
          name.includes('runtime-cache')
      )
      await Promise.all(runtime.map((n) => caches.delete(n)))
    } catch (error) {
      console.error('[PWA] Error clearing cache:', error)
    }
  }

  /** Nuclear option — full unregister + cache wipe (settings / recovery) */
  const forceUpdate = async () => {
    try {
      markUpdating()
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((n) => caches.delete(n)))
      }
    } catch (error) {
      console.error('[PWA] Error force updating:', error)
    } finally {
      window.location.reload()
    }
  }

  return {
    needRefresh,
    offlineReady,
    updateAvailable,
    closePrompt,
    updateApp,
    checkForUpdate,
    clearCacheAndReload,
    forceUpdate
  }
}
