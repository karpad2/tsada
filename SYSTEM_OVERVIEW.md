# 🏫 TSADA Weboldal - Rendszer Áttekintés

> **Verzió**: 1.1.8beta
> **Framework**: Vue 3 + Vite
> **Backend**: Appwrite (Self-hosted)
> **Utolsó frissítés**: 2025-12-13

---

## 📊 Projekt Statisztikák

- **44 route** (útvonal)
- **375 sor** router kód
- **17 service** (szolgáltatás)
- **40+ view komponens**
- **30+ shared komponens**
- **PWA támogatás** ✅
- **SSR képesség** ✅
- **i18n többnyelvűség** ✅

---

## 🏗️ Architektúra

### **Tech Stack**

```
Frontend:
├── Vue 3.5.12 (Composition API)
├── TypeScript
├── Tailwind CSS 3.4.14
├── Vite 5.4.11
├── Pinia 2.2.6 (State Management)
└── Vue Router 4.4.5

Backend:
├── Appwrite 20 (Self-hosted)
├── Endpoint: https://appwrite.tsada.edu.rs/v1
└── Project ID: 659ea7f886cf55d4528a

UI Libraries:
├── PrimeVue 4.2.1
├── Vuestic UI 1.10.3
├── GSAP 3.12.5 (Animations)
└── Swiper 11.1.14 (Carousels)

Rich Text:
├── CKEditor 4
└── Quill Editor

Other:
├── Moment.js (Dates)
├── Axios (HTTP)
├── i18n (Internationalization)
└── vee-validate (Form Validation)
```

---

## 📁 Projekt Struktúra

```
tsada/
├── src/
│   ├── appwrite/          # Appwrite config & services
│   │   ├── index.ts       # Client initialization
│   │   ├── config.json    # Database/Collection IDs
│   │   └── FileManagement.ts
│   │
│   ├── assets/            # Static assets (images, fonts)
│   │
│   ├── components/        # Vue komponensek
│   │   ├── HeaderComponents/
│   │   ├── navigation/    # Navigation menu, dropdowns
│   │   ├── notifications/ # Push notification components
│   │   ├── shared/        # Reusable components
│   │   ├── Hero.vue
│   │   ├── Footer.vue
│   │   └── ...
│   │
│   ├── composables/       # Vue Composition Functions
│   │   ├── api/           # API composables
│   │   ├── forms/         # Form composables
│   │   └── ui/            # UI utilities
│   │
│   ├── lang/              # i18n translation files
│   │   ├── en.json
│   │   ├── sr.json
│   │   └── hu.json
│   │
│   ├── plugins/           # Vue plugins
│   │
│   ├── router/            # Vue Router
│   │   ├── index.ts       # Route definitions (44 routes)
│   │   └── seoGuard.ts    # SEO metadata guard
│   │
│   ├── services/          # Business logic services
│   │   ├── api/           # API services
│   │   │   ├── BaseApiService.ts
│   │   │   ├── DocumentService.ts
│   │   │   ├── GalleryService.ts
│   │   │   ├── SchoolBoardService.ts
│   │   │   └── WorkerService.ts
│   │   ├── forms/
│   │   │   └── FormsService.ts
│   │   ├── i18n/
│   │   │   └── I18nService.ts
│   │   ├── navigation/
│   │   │   └── NavigationService.ts
│   │   ├── notifications/
│   │   │   ├── AppwriteMessagingService.ts
│   │   │   └── PushNotificationService.ts
│   │   ├── pwa/
│   │   │   ├── PWAApiService.ts
│   │   │   └── PWAAppwriteService.ts
│   │   ├── seo/
│   │   │   ├── SEOService.ts
│   │   │   └── SitemapService.ts
│   │   ├── storage/
│   │   │   └── StorageService.ts
│   │   └── validation/
│   │       └── ValidationService.ts
│   │
│   ├── stores/            # Pinia stores
│   │   ├── loading.ts     # Global state (auth, language, theme)
│   │   ├── cookie.ts
│   │   └── index.ts
│   │
│   ├── tests/             # Vitest tests
│   │
│   ├── utils/             # Utility functions
│   │
│   ├── views/             # Page components
│   │   ├── Abouts/        # About pages
│   │   ├── admin/         # Admin panel
│   │   │   ├── editor/    # Content editors
│   │   │   ├── erasmus/   # Erasmus management
│   │   │   ├── messages/  # Messages
│   │   │   ├── notifications/ # Push notifications
│   │   │   └── forms/     # Form builder
│   │   ├── documents/     # Document system
│   │   ├── Erasmus/       # Erasmus public pages
│   │   ├── TV/            # TV presentation mode
│   │   │   └── TVView.vue # Digital signage
│   │   ├── account/
│   │   │   ├── Login.vue
│   │   │   └── Account.vue
│   │   ├── HomeView.vue
│   │   ├── AboutView.vue
│   │   └── ...
│   │
│   ├── App.vue            # Root component
│   ├── main.ts            # App entry point
│   └── entry-server.js    # SSR entry
│
├── functions/             # Appwrite Functions (?)
├── public/                # Public static files
├── dist/                  # Build output
│
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── package.json
└── README.md
```

---

## 🗄️ Appwrite Adatbázis Struktúra

### **Database**: `658d3bb1c4785b1fad28`

| Collection Name | ID | Leírás |
|----------------|-----|--------|
| `mess_coll` | 658d3c1031808d03b1e5 | Üzenetek |
| `main_page_gallery` | 658d8f529368ca8ce991 | Főoldali galéria |
| `courses_short` | 658d9c9548c866c524c8 | Kurzusok rövid |
| `workers` | 658e8ac42b2715b1d88a | Dolgozók |
| `usefullinks` | 658e96e629a18b1af975 | Hasznos linkek |
| `gallery` | 6596d061d7071d82025f | Galéria |
| `gallery_images` | 6596d072e9f944374991 | Galéria képek |
| `roles_db` | 658e8e87938c0b66650c | Szerepkörök |
| `sponsors_db` | 659816056e9c95b61132 | Szponzorok |
| `news_db` | 6596cfc340c1fae00931 | Hírek |
| `documents_db` | 659711fb2cd514a5c07c | Dokumentumok |
| `document_categories_db` | 659987b25f7b82415230 | Dokumentum kategóriák |
| `about_us_db` | 65975896caafdd1f1b63 | Rólunk |
| `general_settings` | 6685329bdc8a922a45f2 | Általános beállítások |
| `users_settings` | 6687d5bd01350de84e13 | Felhasználói beállítások |
| `fs_erasmus` | 668d1408aac3543d622d | Erasmus fájlok |
| `erasmus_applies` | 66c46e28001bdc1b0260 | Erasmus pályázatok |
| `birthday_db` | 653bb50bcd9f2b052636 | Születésnapok |
| `classlist` | 6697bff0e8492a70ae52 | Osztálylista |
| `courselist` | 6697c1ecbcb81199ffa6 | Kurzuslista |
| `st_documents` | 66d1eb0500180a834581 | Diák dokumentumok |
| `st_document_categories` | 66d1ea8a001ae6793b0f | Diák dokumentum kategóriák |
| `text_documents` | 66dc29cf003acfb68da3 | Szöveges dokumentumok |
| `erasmus_location` | 66e305d60008b5b453f1 | Erasmus helyszínek |
| `news_category_in_text` | 66f1249a00093aca885c | Hír kategóriák szövegben |
| `tv_slides` | 67095b22001314de8923 | TV diák |
| `hero_videos` | 6728cfdc00150b2436dd | Hero videók |
| `promo_images` | 67b5ddfb0013b380f663 | Promóciós képek |
| `text_components` | 683ed86a00265f3b65b5 | Szöveg komponensek |
| `parliament_members` | 68c17ee1000cf42b8b76 | Parlamenti tagok |
| `parent_council_members` | 68c48971000e22c04756 | Szülői tanács tagok |
| `school_board` | 68c55bb4000d6f5f630e | Iskolai tanács |
| `services` | 68c692da001074b6c9fb | Szolgáltatások |
| `push_subscriptions` | PLACEHOLDER_PUSH_SUBS | Push feliratkozások ⚠️ |
| `push_notifications_log` | PLACEHOLDER_PUSH_LOG | Push értesítések napló ⚠️ |
| `forms` | TBD | Űrlapok ⚠️ |
| `form_responses` | TBD | Űrlap válaszok ⚠️ |

**⚠️ Placeholders**: Ezeket még létre kell hozni az Appwrite Console-ban!

### **Storage Buckets**

| Bucket Name | ID | Leírás |
|-------------|-----|--------|
| `website_images` | 658d805ba6d15a0d3256 | Weboldal képek |
| `gallery_pictures_storage` | 6596dfaf2af315d07061 | Galéria képek tárolója |
| `documents_storage` | 658d8f296ae052c86e99 | Dokumentumok |

---

## 🛣️ Routing Rendszer (44 Route)

### **Publikus Oldalak**

| Route | Component | Leírás |
|-------|-----------|--------|
| `/` | HomeView | Főoldal |
| `/about` | AboutView | Rólunk |
| `/about/workers` | Workers | Dolgozók listája |
| `/about/workerstimetable` | WorkersTimetable | Dolgozók órarendje |
| `/about/classlist` | ClassList | Osztálylista |
| `/about/parentvisiting` | ParentVisiting | Fogadóóra |
| `/about/birthday` | Birthday | Születésnapok (tűzijátékkal!) |
| `/about/timetable` | Timetable | Órarend |
| `/about/parentscouncil` | ParentsCouncil | Szülői tanács |
| `/about/pepsi` | Pepsi | PEPSI |
| `/about/schoolboard` | SchoolBoard | Iskolai tanács |
| `/about/studentcouncil` | StudentCouncil | Diák parlament |
| `/gallery` | Gallery | Galéria |
| `/album/:id` | Album | Album részletek |
| `/documents` | Documents | Dokumentumok |
| `/docs/:id` | DocumentLister | Dokumentum lista |
| `/document/:id` | DocViewer | Dokumentum megtekintő |
| `/studentdocuments` | StudentDocuments | Diák dokumentumok |
| `/erasmus/apply` | ErasmusApply | Erasmus pályázás |
| `/erasmus/results` | ErasmusList | Erasmus eredmények |
| `/contact` | Contact | Kapcsolat |
| `/login` | Login | Bejelentkezés |
| `/presentation` | Presentation | Prezentáció mód |
| `/tv` | TVView | TV nézet (Digital Signage) |

### **Admin Oldalak** (Authentication Required)

| Route | Component | Leírás |
|-------|-----------|--------|
| `/admin/edit/:mode/:id` | ContentEditor | Tartalom szerkesztő |
| `/admin/worker/:id` | WorkerEditor | Dolgozó szerkesztő |
| `/admin/document/:id` | DocumentEditor | Dokumentum szerkesztő |
| `/admin/text-document-editor/:id` | DocumentEditor | Szöveges dok. szerkesztő |
| `/admin/studentdocument/:id` | DocumentEditor | Diák dok. szerkesztő |
| `/admin/gallery-edit/:id` | GalleryEditor | Galéria szerkesztő |
| `/admin/class-edit/:id` | ClassEditor | Osztály szerkesztő |
| `/admin/slide-editor` | SlideEditor | Slide szerkesztő |
| `/admin/messages` | Messages | Üzenetek |
| `/admin/message/:id` | Message | Üzenet részletek |
| `/admin/erasmus/applies` | ErasmusApplies | Erasmus pályázatok |
| `/admin/erasmus/editapply/:id` | ErasmusApplyEdit | Erasmus pályázat szerkesztés |
| `/admin/erasmus/docviewer/:id` | ErDocViewer | Erasmus dok. néző |
| `/admin/notifications/send` | SendNotification | Push értesítés küldése |
| `/admin/messaging` | MessagingCenter | Appwrite Messaging központ |
| `/admin/forms` | FormsList | Űrlapok listája ⚠️ TBD |
| `/admin/forms/edit/:id` | FormBuilder | Űrlap építő ⚠️ TBD |
| `/admin/forms/responses/:id` | FormResponses | Űrlap válaszok ⚠️ TBD |

### **Renderer & Utility Routes**

| Route | Component | Leírás |
|-------|-----------|--------|
| `/renderer/:mode/:id` | MDRenderer | Markdown renderer |
| `/:pathMatch(.*)*` | MissingPage | 404 oldal |

---

## 🔐 Authentikáció & Autorizáció

### **Appwrite Auth**

```typescript
// src/appwrite/index.ts
const appw = new Client()
  .setEndpoint('https://appwrite.tsada.edu.rs/v1')
  .setProject('659ea7f886cf55d4528a');

const account = new Account(appw);
```

### **Auth Flow**

1. **Login**: Email + Password → Session
2. **Store**: Pinia `useLoadingStore().userLoggedin = true`
3. **Router Guard**: `/admin/*` routek ellenőrzése
4. **Logout**: Session törlése

### **Pinia Store State**

```typescript
{
  userLoggedin: boolean,
  uid: string,
  language: string ('sr', 'en', 'hu'),
  theme: string ('light', 'dark'),
  isErasmus: boolean,
  fireworkSetting: boolean,
  hideheaders: boolean,
  currentPageEuFunding: boolean,
  mobile_view: boolean,
  tablet_mode: boolean
}
```

---

## 🎨 Features & Modulok

### ✅ **Kész Funkciók**

#### 1. **Content Management System (CMS)**
- Tartalom szerkesztő (CKEditor, Quill)
- Markdown renderer
- Galéria kezelés
- Dokumentum kezelés
- Dolgozók kezelése
- Osztályok kezelése

#### 2. **Erasmus Rendszer**
- Erasmus pályázás (űrlap)
- Pályázatok kezelése (admin)
- Dokumentumok feltöltése
- Eredmények megjelenítése

#### 3. **Digital Signage (TV Mode)**
- TV prezentáció mód
- Slide rendszer
- News ticker
- Események megjelenítése
- Időjárás kijelzés
- **Újratervezett glassmorphism dizájn** ⭐

#### 4. **PWA (Progressive Web App)**
- Offline működés
- Service Worker
- Cachel és
- Installálható
- Push Notifications támogatás

#### 5. **Push Notifications** ⭐ **ÚJ!**
- **Custom Web Push** implementáció
- **Appwrite Messaging** natív integráció
- Admin panel értesítés küldésre
- Topic kezelés
- Ütemezett értesítések
- iOS Critical Alerts
- Android Priority Control

#### 6. **Többnyelvűség (i18n)**
- Szerb (sr)
- Magyar (hu)
- Angol (en)
- Nyelv váltó komponens

#### 7. **SEO Optimalizálás**
- Meta tags
- OpenGraph
- Sitemap generation
- SEO Guard (router)

#### 8. **Analytics**
- Google Analytics (vue-gtag)
- Page view tracking
- Navigation tracking
- User properties

#### 9. **Speciális Elemek**
- Születésnap oldal (tűzijátékkal!)
- Cookie banner
- No Internet detector
- Offline Dino játék
- Loading animációk
- Particles háttér

### ⏳ **Folyamatban / Tervezett**

#### 10. **Forms Rendszer** 🚧 **ÉPÜL!**
- Google Forms-szerű építő
- Drag-and-drop mezők
- Különböző mezőtípusok (text, select, radio, checkbox, stb.)
- Válaszok gyűjtése
- Statisztikák és elemzés
- Export funkció

---

## 📦 Komponens Rendszer

### **Shared Components** (Újrafelhasználható)

```
src/components/shared/
├── ActionButton.vue         # Akció gombok
├── DocumentLister.vue       # Dokumentum listázó
├── GalleryImageCard.vue     # Galéria kép kártya
├── GeneralControlsSection.vue # Általános vezérlők
├── LanguageFieldGroup.vue   # Nyelvválasztó mezőcsoport
├── ModularCard.vue          # Moduláris kártya
├── StatusIndicator.vue      # Státusz jelző
└── FileUploadSection.vue    # Fájl feltöltő
```

### **Navigation Components**

```
src/components/navigation/
├── LanguageSelector.vue     # Nyelv váltó
├── MobileMenuButton.vue     # Mobil menü gomb
├── NavigationDropdown.vue   # Navigációs legördülő
├── UserMenu.vue             # Felhasználói menü
├── GlassDropdown.vue        # Glass effektes dropdown
├── GlassDropdownItem.vue
├── GlassDropdownDivider.vue
├── GlassNestedDropdown.vue
└── AccordionMenu.vue        # Accordion menü
```

### **Notification Components** ⭐ **ÚJ!**

```
src/components/notifications/
└── NotificationManager.vue  # Push notification kezelő
```

---

## 🛠️ Szolgáltatások (Services)

### **API Services**

```typescript
// src/services/api/
BaseApiService.ts           # Alap API szolgáltatás
DocumentService.ts          # Dokumentumok API
GalleryService.ts           # Galéria API
SchoolBoardService.ts       # Iskolai tanács API
WorkerService.ts            # Dolgozók API
```

### **Notifications Services** ⭐ **ÚJ!**

```typescript
// src/services/notifications/
PushNotificationService.ts        # Custom Web Push
AppwriteMessagingService.ts       # Appwrite Messaging (AJÁNLOTT!)
```

### **Forms Service** 🚧 **ÚJ!**

```typescript
// src/services/forms/
FormsService.ts             # Űrlap kezelés
```

### **Other Services**

```typescript
I18nService.ts              # Többnyelvűség
NavigationService.ts        # Navigáció
SEOService.ts               # SEO
SitemapService.ts           # Sitemap generálás
StorageService.ts           # Fájl tárolás
ValidationService.ts        # Validáció
PWAApiService.ts            # PWA caching
PWAAppwriteService.ts       # PWA + Appwrite
```

---

## 🎨 Design System

### **Színek**

- **Primary**: Purple (#8b5cf6) → Pink (#ec4899) gradiens
- **Background**: Slate-900 → Purple-900 gradiens
- **Accent**: Various (green, yellow, blue)

### **Glassmorphism Stílus**

```css
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### **Animációk**

- GSAP animációk
- CSS transitions (cubic-bezier easing)
- Particles háttér (tsparticles)
- Swiper carousels
- Fireworks (születésnap oldalon)

---

## 🚀 Build & Deploy

### **Development**

```bash
npm run dev            # Vite dev server
npm run dev:ssr        # SSR development
```

### **Production Build**

```bash
npm run build          # Standard build
npm run build:ssr      # SSR build
npm run preview        # Preview build
npm run preview:ssr    # Preview SSR
```

### **Testing**

```bash
npm run test           # Run tests (Vitest)
npm run test:ui        # Test UI
npm run test:coverage  # Coverage report
```

---

## 📝 TODO / Hiányosságok

### ⚠️ **Collection Placeholders** (Létre kell hozni Appwrite-ban!)

- `push_subscriptions` collection
- `push_notifications_log` collection
- `forms` collection
- `form_responses` collection

### 🚧 **Félkész Modulok**

- Forms rendszer (builder, renderer, responses viewer)
- Admin Dashboard (jelenleg üres)

### 💡 **Jövőbeli Ötletek**

- Digitális napló / Jegyek rendszer
- Házi feladat tracker
- Online beiratkozás
- Könyvtári rendszer
- Menza modul
- QR kódos jelenléti rendszer
- Chatbot asszisztens
- Video streaming platform
- AI tanulmányi asszisztens

---

## 🔗 Hasznos Linkek

- **Appwrite Endpoint**: https://appwrite.tsada.edu.rs/v1
- **Production URL**: TBD
- **Dokumentációk**:
  - [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)
  - [APPWRITE_MESSAGING_GUIDE.md](./APPWRITE_MESSAGING_GUIDE.md)
  - [OPTIMALIZALAS.md](./OPTIMALIZALAS.md)
  - [SSR_SETUP.md](./SSR_SETUP.md)

---

**🎓 TSADA Technikai Iskola Ada**
**Készítette**: Claude AI + Fejlesztői Csapat
**Utolsó frissítés**: 2025-12-13
