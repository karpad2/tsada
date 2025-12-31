# 📨 Appwrite Messaging - Teljes Útmutató

## 🎯 Mi Az Appwrite Messaging?

Az **Appwrite Messaging** a natív, beépített üzenetküldő rendszer az Appwrite-ban, amely támogatja:

- **📱 Push Notifications** (iOS, Android, Web)
- **📧 Email**
- **💬 SMS**

**Előnyök a custom Web Push API-hoz képest:**
- ✅ Nincs szükség VAPID kulcsokra
- ✅ Nincs szükség saját backend szolgáltatásra
- ✅ Beépített ütemezés, topic kezelés, statisztikák
- ✅ Egy API mindhárom csatornához (Push, Email, SMS)
- ✅ Firebase FCM és Apple APNs beépített támogatás
- ✅ 2025 január új funkciók: Critical alerts, Background updates, Priority controls

## 🚀 Implementáció - Már Kész!

### ✅ Mit Csináltam

1. **AppwriteMessagingService.ts** - Teljes Appwrite Messaging wrapper
2. **MessagingCenter.vue** - Modern admin panel Push, Email, SMS küldéshez
3. **Router frissítve** - Új route: `/admin/messaging`

## 📋 Beállítási Lépések

### 1️⃣ Appwrite Console - Provider Beállítása

#### **Firebase Cloud Messaging (FCM)** - Android & Web Push

1. **Firebase Project létrehozása**
   - Menj a [Firebase Console](https://console.firebase.google.com/)-ra
   - Hozz létre új projectet vagy használd a meglévőt

2. **FCM Credentials megszerzése**
   - Project Settings → Cloud Messaging
   - Generálj egy **Server key**-t
   - Mentsd el a **Sender ID**-t is

3. **Appwrite Console - Provider hozzáadása**
   - Messaging → Providers → Add Provider
   - Válaszd: **Firebase Cloud Messaging (FCM)**
   - Add meg:
     - **Provider Name**: "FCM Production"
     - **Server Key**: A Firebase-ből kimásolt server key
   - Mentés

#### **Apple Push Notification Service (APNs)** - iOS Push

1. **Apple Developer Account**
   - Menj az [Apple Developer Portal](https://developer.apple.com/)-ra
   - Certificates, Identifiers & Profiles

2. **APNs Certificate vagy Auth Key**

   **Opció A: Certificate** (régebbi módszer)
   - Create Certificate → Apple Push Notification service SSL
   - Download `.p12` file

   **Opció B: Auth Key** (ajánlott)
   - Keys → Create a new key
   - Enable: Apple Push Notifications service (APNs)
   - Download `.p8` file
   - Mentsd: **Key ID** és **Team ID**

3. **Appwrite Console - Provider hozzáadása**
   - Messaging → Providers → Add Provider
   - Válaszd: **Apple Push Notification Service (APNs)**
   - Add meg:
     - **Provider Name**: "APNs Production"
     - **Auth Key (.p8 file)** vagy **Certificate (.p12)**
     - **Bundle ID**: Az iOS app bundle ID-ja
     - **Team ID** és **Key ID** (auth key használatakor)
   - Mentés

### 2️⃣ Topics Létrehozása

A topics csoportokat jelentenek - például "all-users", "students", "teachers", stb.

**Appwrite Console-ban:**
1. Messaging → Topics → Create Topic
2. Adj nevet: `all-users`, `students`, `teachers`, `important-alerts`
3. Kész!

**Kódból (opcionális):**
```typescript
import { AppwriteMessagingService } from '@/services/notifications/AppwriteMessagingService';

const messaging = AppwriteMessagingService.getInstance();

await messaging.createTopic('all-users', 'Minden felhasználó');
await messaging.createTopic('students', 'Diákok');
await messaging.createTopic('teachers', 'Tanárok');
```

### 3️⃣ Felhasználók Feliratkoztatása

#### Frontend - User Subscribe

Amikor egy felhasználó bejelentkezik, iratkoztasd fel a megfelelő topic-ra:

```vue
<script setup>
import { AppwriteMessagingService } from '@/services/notifications/AppwriteMessagingService';
import { useLoadingStore } from '@/stores/loading';

const messaging = AppwriteMessagingService.getInstance();
const store = useLoadingStore();

onMounted(async () => {
  if (store.userLoggedin) {
    // Minden user feliratkozik az 'all-users' topic-ra
    await messaging.subscribeToTopic(
      'unique()', // Subscriber ID
      'all-users' // Topic ID
    );
  }
});
</script>
```

#### Több Topic Feliratkozás

```typescript
// Diák feliratkozik
if (user.role === 'student') {
  await messaging.subscribeToTopic(user.$id, 'students');
  await messaging.subscribeToTopic(user.$id, 'all-users');
}

// Tanár feliratkozik
if (user.role === 'teacher') {
  await messaging.subscribeToTopic(user.$id, 'teachers');
  await messaging.subscribeToTopic(user.$id, 'all-users');
}
```

## 💻 Használat

### Admin Panel - `/admin/messaging`

A MessagingCenter.vue egy teljes körű admin felület:

1. **Navigálj** `/admin/messaging`-re
2. **Válaszd** a csatornát: Push / Email / SMS
3. **Írd meg** az üzenetet
4. **Célzás**:
   - "Mindenki" → `all-users` topic
   - "Topic" → Válassz egy topic-ot
   - "Felhasználók" → Add meg user ID-kat
5. **Haladó beállítások** (opcionális):
   - Ikon, hang
   - Prioritás (Android)
   - iOS Interruption Level (Critical, Time-sensitive)
   - Ütemezés
6. **Küld!** 🚀

### Kódból - Programozottan

#### 1. Egyszerű Push Notification

```typescript
import { AppwriteMessagingService } from '@/services/notifications/AppwriteMessagingService';

const messaging = AppwriteMessagingService.getInstance();

// Küldés mindenkinek
await messaging.sendToAll({
  title: '🎉 Új Esemény!',
  body: 'Holnap sportverseny a tornateremben!',
  icon: 'https://tsada.edu.rs/icon.png',
  action: 'https://tsada.edu.rs/events/123'
});
```

#### 2. Topic-ra Küldés

```typescript
// Csak diákoknak
await messaging.sendToTopic('students', {
  title: '📚 Házi Feladat',
  body: 'Ne felejtsd: holnap matek dolgozat!',
  icon: '/icon.png'
});
```

#### 3. Konkrét Felhasználóknak

```typescript
await messaging.sendToUsers(
  ['user123', 'user456', 'user789'],
  {
    title: '📧 Személyes Üzenet',
    body: 'Fontos értesítés számodra.'
  }
);
```

#### 4. Ütemezett Notification

```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0); // Holnap 9:00

await messaging.schedulePushNotification(
  {
    title: '⏰ Emlékeztető',
    body: 'Ma kezdődik az esemény!'
  },
  { topic: 'all-users' },
  tomorrow
);
```

#### 5. Kritikus Alert (iOS - Do Not Disturb bypass)

```typescript
await messaging.sendCriticalAlert(
  {
    title: '🚨 SÜRGŐS FIGYELMEZTETÉS',
    body: 'Azonnal hagyd el az épületet!',
    sound: 'critical'
  },
  { topic: 'all-users' }
);
```

#### 6. Háttér Frissítés (Silent Notification)

```typescript
// iOS app-nak adatot küld háttérben, értesítés nélkül
await messaging.sendBackgroundUpdate(
  {
    action: 'sync-data',
    timestamp: Date.now().toString()
  },
  { topic: 'all-users' }
);
```

#### 7. Időérzékeny Notification

```typescript
await messaging.sendTimeSensitive(
  {
    title: '⏰ Kezdődik!',
    body: 'Az óra 5 perc múlva kezdődik!',
    badge: 1
  },
  { topic: 'students' }
);
```

## 🎨 Notification Opciók

### iOS Specific

```typescript
{
  interruptionLevel: 'passive' | 'active' | 'time-sensitive' | 'critical',
  contentAvailable: true, // Háttér frissítés
  mutableContent: true, // Notification módosítás engedélyezése
  sound: 'default' | 'critical',
  badge: 5 // Badge szám
}
```

**Interruption Levels:**
- **passive**: Nem jelenik meg azonnal, csak Notification Center-ben
- **active**: Normál értesítés (alapértelmezett)
- **time-sensitive**: Időérzékeny, átüti a Focus módokat
- **critical**: Átüti a Do Not Disturb-ot is (speciális engedély kell!)

### Android Specific

```typescript
{
  priority: 'min' | 'low' | 'default' | 'high' | 'max',
  channelId: 'important-alerts', // Notification channel
  color: '#FF0000', // Értesítés színe
  sound: 'notification_sound'
}
```

### Közös Opciók

```typescript
{
  badge: 3, // Badge szám
  sound: 'custom_sound.mp3',
  data: {
    custom_key: 'custom_value',
    event_id: '123'
  },
  tag: 'event-123', // Csoportosítás
  scheduledAt: '2025-12-25T09:00:00.000Z' // ISO 8601 dátum
}
```

## 📊 Statisztikák & Monitoring

### Üzenet Státusz Lekérése

```typescript
const message = await messaging.getMessageStatus('message-id-123');

console.log(message.status); // 'draft', 'processing', 'sent', 'failed', 'scheduled'
console.log(message.deliveredTotal); // Kézbesített darabszám
console.log(message.deliveredUsers); // Kézbesített user ID-k
```

### Összes Üzenet Listázása

```typescript
const messages = await messaging.listMessages(50); // Utolsó 50 üzenet

messages.messages.forEach(msg => {
  console.log(`${msg.data.title}: ${msg.status}`);
});
```

### Topic Információk

```typescript
const topics = await messaging.listTopics();

topics.topics.forEach(topic => {
  console.log(`${topic.name}: ${topic.total} subscribers`);
});
```

## 🔒 Engedélyek & Biztonság

### Appwrite Permissions

**Topics Collection:**
- Role: All Users - Read
- Role: Admin - Create, Read, Update, Delete

**Messages:**
- Role: Admin - Create, Read, Update, Delete
- Users csak a nekik szóló értesítéseket láthatják

### Best Practices

1. **Ne spammeld a felhasználókat** - Max 2-3 értesítés naponta
2. **Időzítés** - Ne küldd éjszaka (kivéve kritikus alert)
3. **Releváns tartalom** - Csak fontos dolgokról értesíts
4. **Opt-out lehetőség** - Add meg a lehetőséget leiratkozásra
5. **Teszteld** - Mindig teszteld először kis csoporton

## 🐛 Hibaelhárítás

### "Provider not found"

**Megoldás**: Ellenőrizd, hogy létrehoztad-e a Provider-t az Appwrite Console-ban (FCM vagy APNs).

### "Topic not found"

**Megoldás**: Hozd létre a topic-ot az Appwrite Console-ban vagy a `createTopic()` metódussal.

### "User not subscribed"

**Megoldás**: A felhasználónak először fel kell iratkoznia a topic-ra a `subscribeToTopic()` metódussal.

### Push notification nem érkezik meg

1. **Ellenőrizd a Provider credentials-t** (FCM Server Key, APNs certificate)
2. **Ellenőrizd a user subscription-t** (feliratkozott-e a topic-ra)
3. **Ellenőrizd az app permission-t** (engedélyezte-e az értesítéseket)
4. **Nézd meg a message status-t** az Appwrite Console-ban

## 📱 Frontend Integráció

### FCM Web Push Setup (opcionális)

Ha web push-hoz is FCM-et használsz, add hozzá a `firebase-messaging-sw.js`-t:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

## 🎉 Példa Workflow

### Esemény Értesítési Rendszer

```typescript
// 1. Esemény létrehozásakor
async function createEvent(eventData) {
  // Mentsd az eseményt az adatbázisba
  const event = await database.createDocument(...);

  // Küldj értesítést
  await messaging.sendToAll({
    title: `🎉 ${event.title}`,
    body: `${event.date} - ${event.location}`,
    action: `/events/${event.$id}`,
    icon: event.image,
    data: {
      event_id: event.$id,
      type: 'new_event'
    }
  });
}

// 2. Esemény előtt 24 órával emlékeztető
async function scheduleEventReminder(event) {
  const reminderTime = new Date(event.date);
  reminderTime.setHours(reminderTime.getHours() - 24);

  await messaging.schedulePushNotification(
    {
      title: '⏰ Emlékeztető',
      body: `Holnap kezdődik: ${event.title}`,
      action: `/events/${event.$id}`
    },
    { topic: 'all-users' },
    reminderTime
  );
}

// 3. Esemény kezdésekor
async function notifyEventStart(event) {
  await messaging.sendTimeSensitive(
    {
      title: '🚀 Kezdődik!',
      body: `${event.title} most kezdődik!`,
      action: `/events/${event.$id}`,
      badge: 1
    },
    { topic: 'all-users' }
  );
}
```

## 📚 További Források

- [Appwrite Messaging Dokumentáció](https://appwrite.io/docs/products/messaging)
- [Send Push Notifications](https://appwrite.io/docs/products/messaging/send-push-notifications)
- [Messaging Blog Post](https://appwrite.io/blog/post/announcing-appwrite-messaging)
- [2025 Új Funkciók](https://appwrite.io/changelog/entry/2025-01-22)

---

**🎊 Gratulálunk!** Most már használhatod az Appwrite Messaging-et push notifications, email és SMS küldésére! 🚀

**Készítette**: Claude AI Assistant
**Verzió**: 2.0.0 (Appwrite Native)
**Utolsó frissítés**: 2025-12-13
