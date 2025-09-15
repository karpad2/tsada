import { ref, onMounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export function usePWA() {
  const needRefresh = ref(false)
  const offlineReady = ref(false)
  const updateAvailable = ref(false)

  const {
    needRefresh: pwaUpdateNeeded,
    offlineReady: pwaOfflineReady,
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
    onNeedRefresh() {
      needRefresh.value = true
      updateAvailable.value = true
      console.log('SW: Update available')
    },
    onOfflineReady() {
      offlineReady.value = true
      console.log('SW: App ready to work offline')
    }
  })

  const closePrompt = () => {
    needRefresh.value = false
    updateAvailable.value = false
  }

  const updateApp = async () => {
    try {
      await updateServiceWorker(true)
      needRefresh.value = false
      updateAvailable.value = false

      // Kis késés után újratöltés
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error updating service worker:', error)
    }
  }

  // Force update ellenőrzés
  const checkForUpdate = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
        }
      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }
  }

  // Cache törlés language váltáskor
  const clearCacheAndReload = async () => {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        // Cache nevek lekérése
        const cacheNames = await caches.keys()

        // Csak az API cache-t töröljük, a statikus asset-eket megtartjuk
        const apiCaches = cacheNames.filter(name =>
          name.includes('api-cache') ||
          name.includes('dynamic-cache') ||
          name.includes('runtime-cache')
        )

        // API cache-k törlése
        await Promise.all(
          apiCaches.map(cacheName => caches.delete(cacheName))
        )

        console.log('API caches cleared for language change')
      } catch (error) {
        console.error('Error clearing cache:', error)
      }
    }
  }

  // SW force restart
  const forceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()

        for (const registration of registrations) {
          await registration.unregister()
        }

        // Cache teljes törlése
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )

        console.log('All caches and service workers cleared')
        window.location.reload()
      } catch (error) {
        console.error('Error force updating:', error)
        window.location.reload()
      }
    } else {
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