# 🔄 PWA Végtelen Refresh Loop Javítás

## 🐛 Probléma Leírása

**Tünet:** Production környezetben új verzió deploy után az oldal folyamatosan refresh-el, használhatatlanná téve a felhasználók számára.

**Ok:** A PWA (Progressive Web App) service worker update mechanizmusa végtelen ciklusba kerül:

```
1. Új SW verzió érhető el
2. User rákattint "Frissítés" gombra
3. updateServiceWorker(true) aktiválja az új SW-t
4. cleanupOutdatedCaches törli a régi cache-eket
5. window.location.reload() újratölti az oldalt
6. Az új SW újra észleli a frissítési igényt
7. → Vissza az 1. lépéshez ♻️ INFINITE LOOP!
```

---

## ✅ Megoldás

### **1. Service Worker Konfiguráció Javítása**

**Fájl:** `vite.config.js`

```javascript
VitePWA({
  registerType: 'prompt', // ✅ User confirmation required
  injectRegister: 'auto',  // ✅ Better control
  workbox: {
    cleanupOutdatedCaches: true,
    skipWaiting: false,     // ✅ CRITICAL: Don't auto-activate
    clientsClaim: false,    // ✅ CRITICAL: Don't force claim
    navigationPreload: true // ✅ Performance boost
  }
})
```

**Kulcsfontosságú beállítások:**
- `skipWaiting: false` - Az új SW **NEM** aktiválódik automatikusan
- `clientsClaim: false` - Az új SW **NEM** veszi át azonnal az irányítást
- `registerType: 'prompt'` - Felhasználói beleegyezés szükséges

---

### **2. Update Logika Újraírása**

**Fájl:** `src/composables/usePWA.ts`

#### **Előtte (ROSSZ):**
```typescript
const updateApp = async () => {
  await updateServiceWorker(true)
  setTimeout(() => {
    window.location.reload() // ❌ Ez okozta a végtelen loopot!
  }, 1000)
}
```

#### **Utána (JÓ):**
```typescript
const updateApp = async () => {
  needRefresh.value = false
  updateAvailable.value = false

  // Set flag to prevent infinite loop
  sessionStorage.setItem('pwa-updating', 'true')

  // Update SW - reload happens automatically via SW lifecycle
  await updateServiceWorker(true)

  // ✅ NO manual reload needed!
}
```

**Változtatások:**
1. ✅ `sessionStorage` flag a loop megelőzésére
2. ✅ Töröltük a `window.location.reload()` hívást
3. ✅ Az SW lifecycle automatikusan kezeli a frissítést

---

### **3. Infinite Loop Védelem**

**Fájl:** `src/composables/usePWA.ts`

```typescript
onNeedRefresh() {
  // Check if already updating
  const isUpdating = sessionStorage.getItem('pwa-updating')

  if (isUpdating === 'true') {
    console.log('SW: Update in progress, skipping prompt')
    // Silent auto-update
    updateServiceWorker(true)
    return
  }

  // Show update prompt to user
  needRefresh.value = true
  updateAvailable.value = true
  console.log('SW: Update available')
}
```

**Védelem működése:**
1. Ha már folyamatban van update (`pwa-updating === 'true'`)
2. **NEM** jelenítjük meg újra a promptot
3. Csendesen frissítünk a háttérben
4. Megszakítjuk a végtelen ciklust

---

### **4. Cleanup SessionStorage**

```typescript
onRegistered(r) {
  console.log('SW Registered: ' + r)
  sessionStorage.removeItem('pwa-updating') // ✅ Cleanup
}

onRegisterError(error) {
  console.log('SW registration error', error)
  sessionStorage.removeItem('pwa-updating') // ✅ Cleanup on error
}

onOfflineReady() {
  offlineReady.value = true
  sessionStorage.removeItem('pwa-updating') // ✅ Cleanup
}
```

---

## 🧪 Tesztelés

### **Production Build Tesztelés:**

```bash
# 1. Build production
npm run build

# 2. Preview build
npm run preview

# 3. Nyisd meg: http://localhost:4173
```

### **Update Szimuláció:**

1. **Első verzió build:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Módosítsd a kódot** (pl. változtass valamit `HomeView.vue`-ban)

3. **Második verzió build:**
   ```bash
   npm run build
   npm run preview
   ```

4. **Frissítsd a böngészőt** → Update prompt megjelenik

5. **Klikk "Frissítés"** → Egyszer frissül, **NEM** végtelen loop! ✅

---

## 🔍 Debug Információk

### **Console Logs:**

```
✅ Normál működés:
SW: Update available
SW Registered: [object ServiceWorkerRegistration]

❌ Végtelen loop esetén (RÉGI VERZIÓ):
SW: Update available
SW: Update available
SW: Update available
...
```

### **SessionStorage Ellenőrzése:**

**DevTools → Application → Session Storage:**
- Frissítés közben: `pwa-updating: "true"`
- Frissítés után: `pwa-updating` törlődik

---

## 📊 Service Worker Lifecycle

```
[User clicks "Frissítés"]
         ↓
[sessionStorage: pwa-updating = true]
         ↓
[updateServiceWorker(true)]
         ↓
[New SW: Install → Waiting → Active]
         ↓
[Old SW terminated]
         ↓
[New SW controls page]
         ↓
[Page reloads ONCE via SW]
         ↓
[onRegistered: cleanup sessionStorage]
         ↓
[✅ DONE - No infinite loop!]
```

---

## 🛡️ Biztonsági Intézkedések

### **1. Session Flag**
- Védi az infinite loop ellen
- Csak a session élettartamára szól
- Automatikusan törlődik sikeresen frissítés után

### **2. Conditional Prompt**
- Ha már frissítés folyik → Silent update
- Ha nincs frissítés → User prompt

### **3. No Manual Reload**
- Töröltük a `window.location.reload()` hívást
- SW lifecycle kezeli az újratöltést
- Biztonságosabb és kevésbé hibára hajlamos

---

## ⚙️ Opcionális Konfigurációk

### **Auto-Update Timeout (Ajánlott production-re):**

```typescript
// src/composables/usePWA.ts
const AUTO_UPDATE_TIMEOUT = 10000 // 10 másodperc

onNeedRefresh() {
  needRefresh.value = true
  updateAvailable.value = true

  // Auto-update 10 másodperc után, ha user nem klikkel
  setTimeout(() => {
    if (needRefresh.value) {
      console.log('Auto-updating after timeout')
      updateApp()
    }
  }, AUTO_UPDATE_TIMEOUT)
}
```

### **Forced Update Check Interval:**

```typescript
// App.vue vagy main.ts
import { usePWA } from '@/composables/usePWA'

const { checkForUpdate } = usePWA()

// Check for updates every 1 hour
setInterval(() => {
  checkForUpdate()
}, 60 * 60 * 1000)
```

---

## 🎯 Best Practices

1. ✅ **Ne használj `window.location.reload()`** SW update után
2. ✅ **`skipWaiting: false`** production-ben
3. ✅ **`registerType: 'prompt'`** user control miatt
4. ✅ **SessionStorage flag** loop védelem
5. ✅ **Clear flag** minden lifecycle eseményben
6. ✅ **Console logs** debug információkhoz
7. ✅ **Tesztelj production build-et** deploy előtt

---

## 🐞 Hibaelhárítás

### **Problem: Még mindig végtelen loop van**

**Megoldás:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear cache: DevTools → Application → Clear storage
3. Unregister SW: DevTools → Application → Service Workers → Unregister
4. Újra töltsd be az oldalt

### **Problem: Update nem jelenik meg**

**Ellenőrzés:**
1. `registerType: 'prompt'` be van állítva? ✅
2. Console-ban látod: "SW: Update available"? ✅
3. `PWAUpdatePrompt.vue` be van importálva `App.vue`-ba? ✅

### **Problem: SW nem regisztrálódik**

**Megoldás:**
```bash
# 1. Clear dist folder
rm -rf dist

# 2. Rebuild
npm run build

# 3. Check build output
ls -la dist/sw.js  # Service worker létezik?

# 4. Preview
npm run preview
```

---

## 📚 További Források

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Docs](https://developer.chrome.com/docs/workbox/)
- [PWA Update Patterns](https://web.dev/articles/service-worker-lifecycle)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**✅ JAVÍTVA:** 2025-12-13
**Verzió:** 1.1.8beta+fix
**Status:** Production Ready
