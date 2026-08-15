import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientIndex = path.join(__dirname, 'dist/client/index.html')
const hasClientBuild = await fs.access(clientIndex).then(() => true).catch(() => false)
// Explicit NODE_ENV wins; if unset, treat existing client build as production
const env = process.env.NODE_ENV
const isProduction = env === 'production'
const port = process.env.PORT || (isProduction ? 3000 : 5174)
const base = process.env.BASE || '/'

const templateHtml =
  isProduction && hasClientBuild ? await fs.readFile(clientIndex, 'utf-8') : ''

let ssrManifest
if (isProduction) {
  try {
    ssrManifest = await fs.readFile(
      path.join(__dirname, 'dist/client/.vite/ssr-manifest.json'),
      'utf-8'
    )
  } catch {
    ssrManifest = undefined
  }
}

const app = express()

let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv(path.join(__dirname, 'dist/client'), { extensions: [] }))
}

// Health check (no SSR)
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, mode: isProduction ? 'production' : 'development' })
})

// SSR all document navigations
app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')
    const cleanPath = (url.split('?')[0] || '/')

    // Asset-like paths that slipped past static middleware
    if (/\.\w+$/.test(cleanPath) && !cleanPath.endsWith('.html')) {
      res.status(404).end('Not found')
      return
    }

    let template
    let render

    if (!isProduction) {
      template = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.js')).render
    } else {
      template = templateHtml
      const serverEntry = pathToFileURL(path.join(__dirname, 'dist/server/entry-server.js')).href
      render = (await import(serverEntry)).render
    }

    const renderUrl = url.startsWith('/') ? url : `/${url}`
    const rendered = await render(renderUrl, ssrManifest)

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '')

    res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(html)
  } catch (e) {
    vite?.ssrFixStacktrace?.(e)
    console.error('[SSR]', e.stack || e)

    // Fallback: serve shell without SSR so the SPA can still boot
    try {
      let fallback = isProduction
        ? templateHtml
        : await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8')
      if (!isProduction && vite) {
        fallback = await vite.transformIndexHtml(req.originalUrl, fallback)
      }
      fallback = fallback
        .replace(`<!--app-head-->`, '')
        .replace(`<!--app-html-->`, '')
      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(fallback)
    } catch {
      res.status(500).end(e.stack || String(e))
    }
  }
})

app.listen(port, () => {
  console.log(
    `TSADA SSR server started at http://localhost:${port} (${isProduction ? 'production' : 'development'})`
  )
})
