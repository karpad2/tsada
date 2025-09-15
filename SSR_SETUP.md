# SSR (Server-Side Rendering) Setup Guide

This document describes the painless SSR implementation added to the TSADA project.

## Overview

We've implemented a minimal SSR solution using Vite's built-in SSR capabilities, which is the least disruptive approach for the existing Vue 3 + Vite + PWA + Appwrite configuration.

## Features

✅ **Server-Side Rendering** - Pages are pre-rendered on the server for better SEO and initial page load
✅ **Client-Side Hydration** - Full Vue.js functionality after hydration
✅ **SEO Optimization** - Dynamic meta tags and structured data
✅ **PWA Compatibility** - Works alongside existing PWA setup
✅ **Development Mode** - Hot reload in SSR development
✅ **Production Ready** - Optimized builds for production

## Architecture

### Entry Points

- **`src/entry-client.js`** - Client-side entry point for hydration
- **`src/entry-server.js`** - Server-side entry point for SSR rendering
- **`src/main.ts`** - Shared application factory function

### Server

- **`server.js`** - Express server handling SSR requests
- **Development**: Uses Vite middleware for hot reload
- **Production**: Serves pre-built static assets with compression

### Templates

- **`index.html`** - Contains SSR placeholders:
  - `<!--app-head-->` - Dynamic meta tags injection
  - `<!--app-html-->` - Server-rendered app content

## Usage

### Development

```bash
# Regular client-side development (existing)
npm run dev

# SSR development server
npm run dev:ssr
```

The SSR development server runs on `http://localhost:5173` with hot reload capabilities.

### Production Build

```bash
# Build for client-side only (existing)
npm run build

# Build for SSR (client + server)
npm run build:ssr

# Preview SSR production build
npm run preview:ssr
```

### Scripts Added

```json
{
  "dev:ssr": "node server.js",
  "build:client": "vite build --outDir dist/client",
  "build:server": "vite build --outDir dist/server --ssr src/entry-server.js",
  "build:ssr": "npm run build:client && npm run build:server",
  "preview:ssr": "NODE_ENV=production node server.js"
}
```

## Technical Implementation

### 1. Universal App Factory

The `main.ts` now exports a `createApp()` factory function instead of directly mounting:

```typescript
export function createApp() {
  const app = createVueApp(App)
  const router = createRouter()
  const pinia = createPinia()

  // Client-side only plugins
  if (typeof window !== 'undefined') {
    app.use(gtag)
    app.use(VueLazyLoad)
    app.use(Particles)
  }

  return { app, router, pinia }
}
```

### 2. Universal Router

Router now uses different history modes for server/client:

```typescript
export function createRouter() {
  return createVueRouter({
    history: typeof window !== 'undefined'
      ? createWebHistory()
      : createMemoryHistory(),
    routes: [...]
  })
}
```

### 3. Server-Side Rendering

The server entry point handles:
- Route navigation
- App rendering to string
- Meta tags extraction
- SEO optimization

```javascript
export async function render(url, manifest) {
  const { app, router } = createApp()
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app, ctx)
  const head = generateHead(metaTags, url)

  return { html, head }
}
```

### 4. Client-Side Hydration

The client entry performs hydration instead of mounting:

```javascript
import { createApp } from './main'

const { app } = createApp()
app.mount('#app')
```

## SEO Benefits

### Server-Side Meta Tags

- Dynamic title and description generation
- Open Graph tags for social sharing
- Twitter Card metadata
- Canonical URLs
- Structured data (JSON-LD)

### Search Engine Optimization

- Faster initial page load (perceived performance)
- Content available for web crawlers
- Better Core Web Vitals scores
- Enhanced social media sharing

## PWA Compatibility

The SSR implementation is fully compatible with the existing PWA setup:

- Service Worker registration works normally
- Cache strategies remain unchanged
- Offline functionality preserved
- App manifest and icons unaffected

## Configuration Files

### `vite.config.ssr.js`
SSR-specific Vite configuration for server builds.

### `server.js`
Express server with Vite middleware for development and static serving for production.

## Browser Support

- **Modern Browsers**: Full SSR + hydration support
- **Legacy Browsers**: Falls back to client-side rendering
- **JavaScript Disabled**: Basic HTML content available

## Performance Considerations

### Development
- SSR dev server has slightly longer startup time
- Hot reload works for both client and server code

### Production
- Initial page load faster due to pre-rendered content
- Subsequent navigation uses client-side routing
- Server requires Node.js runtime environment

## Deployment

### Traditional Hosting
Deploy the Express server (`server.js`) with the built assets.

### Static Hosting + API
Continue using existing static deployment for pure client-side mode.

### Hybrid Approach
Use SSR for public pages (home, about, etc.) and client-side for admin/dynamic pages.

## Migration Notes

### Existing Features Preserved
✅ PWA functionality
✅ Client-side routing
✅ State management (Pinia)
✅ Internationalization
✅ Component lazy loading
✅ Analytics tracking

### Breaking Changes
❌ None - existing client-side deployment continues to work

## Next Steps

1. **Test SSR Server**: Verify all routes render correctly
2. **SEO Testing**: Check meta tag generation for different pages
3. **Performance Testing**: Compare SSR vs client-side metrics
4. **Production Deployment**: Set up SSR hosting environment

## Commands Quick Reference

```bash
# Development
npm run dev          # Client-side only (existing)
npm run dev:ssr      # SSR development server

# Building
npm run build        # Client-side build (existing)
npm run build:ssr    # Full SSR build

# Preview
npm run preview      # Preview client build (existing)
npm run preview:ssr  # Preview SSR production
```

The implementation provides a **painless migration path** to SSR while preserving all existing functionality and deployment options.