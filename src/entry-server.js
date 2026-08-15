import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'
import { generateHeadHtml } from './utils/seoMeta'

/**
 * Render the app for a given URL (called by server.js).
 * @param {string} url - Request path (may include query)
 * @param {string|undefined} _manifest - Vite SSR manifest (optional)
 */
export async function render(url, _manifest) {
  const { app, router } = createApp()

  const path = url.startsWith('/') ? url : `/${url}`

  await router.push(path)
  await router.isReady()

  // Collect modules for optional preload hints
  const ctx = {}
  const html = await renderToString(app, ctx)
  const head = generateHeadHtml(path)

  return { html, head }
}
