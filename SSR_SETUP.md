# SSR Setup — TSADA

Az alkalmazás **SSR-alapú** (Vue 3 + Vite + Express). A publikus oldalak a szerveren renderelődnek, a kliens hydrálja a HTML-t.

## Parancsok

```bash
# Fejlesztés localhoston — Vite SPA (alapértelmezett)
npm run dev

# SSR fejlesztés (Express + Vite middleware)
npm run dev:ssr

# Csak client SPA (ugyanaz, mint npm run dev)
npm run dev:spa

# Production build (client + server)
npm run build

# Production indítás
npm start
# vagy
NODE_ENV=production node server.js
```

## Architektúra

| Fájl | Szerep |
|------|--------|
| `src/main.ts` | Universal `createApp()` (`createSSRApp`) |
| `src/entry-client.js` | Hydration entry |
| `src/entry-server.js` | `renderToString` + SEO head |
| `src/utils/seoMeta.ts` | Útvonal → meta HTML |
| `src/utils/ssr.ts` | `isSSR` / storage helper |
| `server.js` | Express: Vite middleware (dev) / sirv (prod) |
| `index.html` | `<!--app-head-->` + `<!--app-html-->` |

## Fontos viselkedés

- **Layout** (`Index.vue`): tartalom azonnal SSR-ben (nincs network-gate loading).
- **Hero**: statikus shell SSR-ben, videó csak clienten.
- **LazyWrapper**: SSR-ben azonnali render, mount után `v-lazy`.
- **Auth guard**: csak böngészőben (Pinia persist).
- **i18n**: az `@` karakter a fordításokban `{'@'}` formában kell (pl. e-mail).
- **PWA**: továbbra is működik; online navigációnál a szerver adja az SSR HTML-t.

## Deploy

```bash
npm run build
NODE_ENV=production PORT=3000 node server.js
# vagy Docker:
docker compose up tsada-ssr
```

Healthcheck: `GET /health` → `{ ok: true }`.

## Hibakeresés

Ha egy útvonal üres shell-t ad vissza (nincs Vue HTML a `#app`-ban), nézd a szerver log `[SSR]` sorait — a fallback SPA shell-t szolgálja ki hiba esetén.
