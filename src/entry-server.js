import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'

export async function render(url, manifest) {
  const { app, router } = createApp()

  // Push the requested URL to the router
  await router.push(url)
  await router.isReady()

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {}
  const html = await renderToString(app, ctx)

  // Extract SEO metadata from the rendered page
  const metaTags = extractMetaTags()
  const head = generateHead(metaTags, url)

  return { html, head }
}

function extractMetaTags() {
  // In a real SSR environment, you'd extract meta tags from the document head
  // For now, we'll return basic meta tags
  return {
    title: 'Tehnička Škola Ada',
    description: 'Tehnička škola Ada - moderna stručna škola u Adi',
    keywords: 'tehnicka skola ada, stručno obrazovanje, Ada, Vojvodina'
  }
}

function generateHead(metaTags, url) {
  const baseUrl = 'https://tsada.edu.rs'

  return `
    <title>${metaTags.title}</title>
    <meta name="description" content="${metaTags.description}">
    <meta name="keywords" content="${metaTags.keywords}">
    <meta property="og:title" content="${metaTags.title}">
    <meta property="og:description" content="${metaTags.description}">
    <meta property="og:url" content="${baseUrl}${url}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${metaTags.title}">
    <meta name="twitter:description" content="${metaTags.description}">
    <link rel="canonical" href="${baseUrl}${url}">
  `
}