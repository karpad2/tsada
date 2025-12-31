# 🔔 Push Notification System Setup Guide

## Áttekintés

A TSADA weboldal most már támogatja a **Web Push Notification** rendszert, amely lehetővé teszi valós idejű értesítések küldését a felhasználóknak böngészőjükben - még akkor is, ha az oldal nincs megnyitva!

## 🎯 Funkciók

### ✅ Már Implementált

1. **PushNotificationService** - Teljes push notification kezelő szolgáltatás
2. **NotificationManager Vue komponens** - Szép UI a felhasználóknak az engedélyek kezeléséhez
3. **Admin Panel** - Értesítések küldésére szolgáló felület (`/admin/notifications/send`)
4. **Appwrite Integráció** - Feliratkozások és értesítési napló tárolása
5. **PWA Támogatás** - Service Worker alapú push notification rendszer

### 📋 Mik Az Értesítés Típusok

- **Bejelentések** - Általános iskolai közlemények
- **Események** - Közelgő rendezvények
- **Sürgős** - Fontos, azonnali figyelmeztetések
- **Hírek** - Friss hírek és információk
- **Emlékeztetők** - Határidők, találkozók

## 🚀 Telepítési Lépések

### 1. VAPID Kulcsok Generálása

A Web Push API-hoz szükséged van **VAPID kulcspárra**:

```bash
# Telepítsd a web-push npm package-et
npm install -g web-push

# Generálj VAPID kulcspárt
web-push generate-vapid-keys
```

Ez két kulcsot fog generálni:
- **Public Key** - A frontend használja
- **Private Key** - A backend használja (SOHA ne commitold!)

### 2. Környezeti Változók Beállítása

Hozz létre egy `.env` fájlt a projekt gyökerében:

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:admin@tsada.edu.rs
```

**FONTOS**: A `.env` fájlt add hozzá a `.gitignore`-hoz!

### 3. Appwrite Adatbázis Beállítása

#### 3.1 Hozz létre egy `push_subscriptions` collection-t

**Attribútumok:**

| Név | Típus | Méret | Kötelező |
|-----|-------|-------|----------|
| `endpoint` | String | 500 | Igen |
| `p256dh` | String | 200 | Igen |
| `auth` | String | 200 | Igen |
| `user_agent` | String | 500 | Nem |
| `subscribed_at` | DateTime | - | Igen |

**Indexek:**
- `endpoint_index` - Key: endpoint (Unique)

**Engedélyek:**
- Role: All Users - Create, Read, Update, Delete

#### 3.2 Hozz létre egy `push_notifications_log` collection-t

**Attribútumok:**

| Név | Típus | Méret | Kötelező |
|-----|-------|-------|----------|
| `title` | String | 100 | Igen |
| `body` | String | 500 | Igen |
| `icon` | String | 500 | Nem |
| `action_url` | String | 500 | Nem |
| `tag` | String | 50 | Nem |
| `require_interaction` | Boolean | - | Nem |
| `recipients_count` | Integer | - | Igen |
| `sent_at` | DateTime | - | Igen |

**Indexek:**
- `sent_at_index` - Key: sent_at (DESC)

**Engedélyek:**
- Role: All Users - Read
- Role: Admin - Create, Read, Update, Delete

### 4. Config Frissítése

Frissítsd az `src/appwrite/config.json` fájlban a placeholder értékeket:

```json
{
  ...
  "push_subscriptions": "actual_collection_id_here",
  "push_notifications_log": "actual_collection_id_here"
}
```

### 5. Backend Service Worker Setup

A `vite.config.js` már tartalmazza a PWA plugint. Győződj meg róla, hogy a `registerType: 'prompt'` be van állítva.

## 💻 Használat

### Frontend - Felhasználói Engedély Kérése

Használd a `NotificationManager` komponenst az `App.vue`-ban vagy a főoldalon:

```vue
<template>
  <div id="app">
    <!-- Auto-show permission banner after 5 seconds -->
    <NotificationManager :auto-show="true" />

    <!-- Your app content -->
  </div>
</template>

<script setup>
import NotificationManager from '@/components/notifications/NotificationManager.vue';
</script>
```

### Admin - Értesítés Küldése

1. Navigálj ide: `/admin/notifications/send`
2. Töltsd ki az űrlapot:
   - **Cím** (max 50 karakter)
   - **Szöveg** (max 200 karakter)
   - **Ikon URL** (opcionális)
   - **Művelet URL** (opcionális - ahová kattintáskor megyünk)
   - **Kategória** - announcement, event, urgent, news, reminder
   - **Megköveteli interakciót** - ha be van pipálva, az értesítés nem tűnik el magától
3. Nézd meg az előnézetet
4. Kattints a "Értesítés Küldése" gombra

### Programozottan - Értesítés Küldése Kódból

```typescript
import { PushNotificationService } from '@/services/notifications/PushNotificationService';

const notificationService = PushNotificationService.getInstance();

// Engedély kérése
const permission = await notificationService.requestPermission();

if (permission === 'granted') {
  // Értesítés küldése
  await notificationService.showNotification({
    title: '🎉 Új Esemény!',
    body: 'Holnap sportverseny a tornateremben!',
    icon: '/favicon.png',
    tag: 'event-123',
    requireInteraction: false,
    data: {
      url: '/events/123'
    },
    actions: [
      {
        action: 'view',
        title: 'Megtekintés',
      },
      {
        action: 'dismiss',
        title: 'Bezárás',
      }
    ]
  });
}
```

## 🔧 Backend Push Szolgáltatás (Szükséges!)

**FONTOS**: Az admin panel csak a frontenden mutat értesítést. Ahhoz, hogy az összes feliratkozott felhasználónak menjen, kell egy **backend push szolgáltatás**.

### Opció 1: Appwrite Function (Ajánlott)

Hozz létre egy Appwrite Function-t, ami a Web Push protokollt használja:

```javascript
// functions/send-push-notification/index.js
import webpush from 'web-push';

export default async ({ req, res, log, error }) => {
  const { title, body, icon, tag, actionUrl } = JSON.parse(req.body);

  // VAPID setup
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // Fetch all subscriptions from database
  const database = new Database(client);
  const subscriptions = await database.listDocuments(
    'website_db',
    'push_subscriptions'
  );

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/favicon.png',
    tag,
    data: { url: actionUrl }
  });

  // Send to all subscribers
  const promises = subscriptions.documents.map(sub => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    return webpush.sendNotification(pushSubscription, payload)
      .catch(err => {
        error('Push failed:', err);
        // If subscription is invalid, delete it
        if (err.statusCode === 410) {
          database.deleteDocument('website_db', 'push_subscriptions', sub.$id);
        }
      });
  });

  await Promise.allSettled(promises);

  return res.json({ success: true });
};
```

### Opció 2: Node.js Backend

```javascript
// backend/push-notification.js
const express = require('express');
const webpush = require('web-push');
const { Databases } = require('node-appwrite');

const app = express();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.post('/api/send-notification', async (req, res) => {
  const { title, body, icon, tag, actionUrl } = req.body;

  const database = new Databases(client);
  const subscriptions = await database.listDocuments(
    'website_db',
    'push_subscriptions'
  );

  const payload = JSON.stringify({ title, body, icon, tag, data: { url: actionUrl } });

  const promises = subscriptions.documents.map(sub => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    };
    return webpush.sendNotification(pushSubscription, payload);
  });

  await Promise.allSettled(promises);
  res.json({ success: true });
});

app.listen(3000);
```

## 📊 Statisztikák

Az admin panel automatikusan mutatja:
- **Feliratkozók száma** - Összes aktív feliratkozás
- **Ma küldött** - Mai napra elküldött értesítések
- **Összes küldés** - Összesen elküldött értesítések

## 🎨 Testreszabás

### Notification Banner Színek

Módosítsd a `NotificationManager.vue` komponenst:

```vue
<style scoped>
.glass-card {
  /* Változtasd meg a háttér színét */
  background: rgba(139, 92, 246, 0.15); /* Lila háttér */
}
</style>
```

### Notification Ikonok

Alapértelmezett ikon: `/favicon.png`

Egyedi ikonok használata:

```typescript
await notificationService.showNotification({
  icon: 'https://tsada.edu.rs/custom-icon.png',
  badge: 'https://tsada.edu.rs/badge.png'
});
```

## 🔒 Biztonság

1. **VAPID kulcsok**: Soha ne commitold a private key-t!
2. **Appwrite engedélyek**: Csak adminok küldhetnek értesítéseket
3. **Rate limiting**: Implementálj rate limitinget a backend oldalon
4. **Validáció**: Minden input validálása szerver oldalon

## 🧪 Tesztelés

### 1. Helyi Teszt (Dev Mode)

```bash
npm run dev
```

- Navigálj a főoldalra
- Várj 5 másodpercet az auto-show banner megjelenéséért
- Engedélyezd az értesítéseket
- Menj a `/admin/notifications/send` oldalra
- Küldj egy teszt értesítést

### 2. Production Teszt

**FONTOS**: Push notificationök csak HTTPS-en működnek (vagy localhost-on)!

## 📱 Böngésző Támogatás

| Böngésző | Támogatás |
|----------|-----------|
| Chrome 42+ | ✅ Teljes |
| Firefox 44+ | ✅ Teljes |
| Safari 16+ | ✅ Teljes (macOS 13+, iOS 16.4+) |
| Edge 17+ | ✅ Teljes |
| Opera 29+ | ✅ Teljes |

## 🐛 Hibaelhárítás

### "Notifications not supported"

- Ellenőrizd, hogy HTTPS-en vagy (vagy localhost-on)
- Ellenőrizd a böngésző támogatását
- Service Worker regisztrálva van-e

### "Permission denied"

- Felhasználó korábban letiltotta az értesítéseket
- Törölni kell a site settings-ből és újra engedélyezni

### Push nem érkezik meg

1. Ellenőrizd a VAPID kulcsokat
2. Ellenőrizd a backend service működését
3. Nézd meg a browser console-t hibákért
4. Ellenőrizd, hogy a subscription aktív-e az adatbázisban

## 📚 További Források

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm package](https://www.npmjs.com/package/web-push)
- [Appwrite Functions](https://appwrite.io/docs/functions)

## 🎉 Gratulálunk!

Sikeresen implementáltad a push notification rendszert! Most már valós időben tudod értesíteni a felhasználókat az iskolai hírekről és eseményekről! 🚀

---

**Készítette**: Claude AI Assistant
**Verzió**: 1.0.0
**Utolsó frissítés**: 2025-12-13
