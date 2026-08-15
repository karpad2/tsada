/* Disables Navigation Preload for SPA shell SW.
   Clears leftover state from older workbox builds that called enable(). */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.registration && self.registration.navigationPreload) {
          await self.registration.navigationPreload.disable()
        }
      } catch (_) {
        /* ignore */
      }
    })()
  )
})
