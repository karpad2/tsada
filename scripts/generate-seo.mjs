/**
 * Post-build SEO generator for Firebase SPA hosting.
 *
 * Firebase serves real files before SPA rewrites, so:
 *   dist/about/workers/index.html  →  /about/workers
 *   dist/renderer/about/foo/index.html → /renderer/about/foo
 *
 * Google (and other bots) get unique <title>, meta, JSON-LD and crawlable
 * body text without needing full JS execution.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const baseUrl = 'https://tsada.edu.rs'

/** @typedef {{ path: string, title: string, description: string, priority?: number, changefreq?: string, lastmod?: string, bodyHtml?: string }} SeoRoute */

/** @type {SeoRoute[]} */
const PUBLIC_ROUTES = [
  {
    path: '/',
    title: 'Tehnička Škola Ada - Moderna stručna škola u Adi',
    description:
      'Tehnička škola Ada - najveća srednja stručna škola u opštini Ada. Mašinstvo, elektrotehnika, građevinarstvo. Savremena nastava, Erasmus+ projekti.',
    priority: 1.0,
    changefreq: 'daily'
  },
  {
    path: '/home',
    title: 'Tehnička Škola Ada - Početna',
    description: 'Početna stranica Tehničke škole Ada. Vesti, kursevi, galerija i kontakt informacije.',
    priority: 0.9,
    changefreq: 'daily'
  },
  {
    path: '/about',
    title: 'O školi ~ Tehnička Škola Ada',
    description: 'Informacije o Tehničkoj školi Ada: istorija, organizacija, osoblje i aktivnosti.',
    priority: 0.8,
    changefreq: 'monthly'
  },
  {
    path: '/about/workers',
    title: 'Nastavno osoblje ~ Tehnička Škola Ada',
    description: 'Pregled nastavnog i stručnog osoblja Tehničke škole Ada.',
    priority: 0.8,
    changefreq: 'monthly'
  },
  {
    path: '/about/workerstimetable',
    title: 'Prijemni sati ~ Tehnička Škola Ada',
    description: 'Raspored prijema roditelja i učenika kod nastavnika.',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    path: '/about/classlist',
    title: 'Spisak razreda ~ Tehnička Škola Ada',
    description: 'Lista razreda Tehničke škole Ada.',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    path: '/about/parentvisiting',
    title: 'Prijem roditelja ~ Tehnička Škola Ada',
    description: 'Termini prijema roditelja kod razrednih starešina.',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    path: '/about/timetable',
    title: 'Raspored časova ~ Tehnička Škola Ada',
    description: 'Raspored časova Tehničke škole Ada.',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    path: '/about/class-schedule',
    title: 'Raspored ~ Tehnička Škola Ada',
    description: 'Nedeljni raspored časova po odeljenjima i nastavnicima.',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    path: '/about/schoolboard',
    title: 'Školski odbor ~ Tehnička Škola Ada',
    description: 'Članovi školskog odbora Tehničke škole Ada.',
    priority: 0.6,
    changefreq: 'monthly'
  },
  {
    path: '/about/parentscouncil',
    title: 'Savet roditelja ~ Tehnička Škola Ada',
    description: 'Savet roditelja Tehničke škole Ada.',
    priority: 0.6,
    changefreq: 'monthly'
  },
  {
    path: '/about/studentcouncil',
    title: 'Učenički parlament ~ Tehnička Škola Ada',
    description: 'Učenički parlament Tehničke škole Ada.',
    priority: 0.6,
    changefreq: 'monthly'
  },
  {
    path: '/about/pepsi',
    title: 'Usluge škole ~ Tehnička Škola Ada',
    description: 'Usluge i aktivnosti Tehničke škole Ada.',
    priority: 0.5,
    changefreq: 'monthly'
  },
  {
    path: '/gallery',
    title: 'Galerija ~ Tehnička Škola Ada',
    description: 'Foto galerija događaja i života škole.',
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/contact',
    title: 'Kontakt ~ Tehnička Škola Ada',
    description: 'Kontakt informacije: adresa Moše Pijade 47, Ada, telefon, email.',
    priority: 0.8,
    changefreq: 'monthly'
  },
  {
    path: '/documents',
    title: 'Dokumenta ~ Tehnička Škola Ada',
    description: 'Javna dokumenta i akti Tehničke škole Ada.',
    priority: 0.7,
    changefreq: 'weekly'
  },
  {
    path: '/studentdocuments',
    title: 'Dokumenta za učenike ~ Tehnička Škola Ada',
    description: 'Dokumenta namenjena učenicima Tehničke škole Ada.',
    priority: 0.6,
    changefreq: 'weekly'
  },
  {
    path: '/erasmus/apply',
    title: 'Erasmus+ prijava ~ Tehnička Škola Ada',
    description: 'Prijava za Erasmus+ programe Tehničke škole Ada.',
    priority: 0.7,
    changefreq: 'monthly'
  },
  {
    path: '/erasmus/results',
    title: 'Erasmus+ rezultati ~ Tehnička Škola Ada',
    description: 'Rezultati Erasmus+ prijava.',
    priority: 0.5,
    changefreq: 'monthly'
  },
  {
    path: '/about/birthday',
    title: 'Rođendani ~ Tehnička Škola Ada',
    description: 'Današnji rođendani u školi.',
    priority: 0.3,
    changefreq: 'daily'
  }
]

const NAV_LINKS = [
  { href: '/', label: 'Početna' },
  { href: '/about/workers', label: 'Nastavno osoblje' },
  { href: '/about/classlist', label: 'Spisak razreda' },
  { href: '/about/timetable', label: 'Raspored časova' },
  { href: '/gallery', label: 'Galerija' },
  { href: '/documents', label: 'Dokumenta' },
  { href: '/contact', label: 'Kontakt' },
  { href: '/erasmus/apply', label: 'Erasmus+' }
]

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function plainDescription(...candidates) {
  for (const c of candidates) {
    const text = stripHtml(c)
    if (text && text.length > 20 && !/^[-–—.\s]+$/.test(text)) {
      return text.slice(0, 160)
    }
  }
  return ''
}

function setOrInsertMeta(html, attr, key, content) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*>`, 'i')
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}">`
  if (re.test(html)) {
    return html.replace(re, tag)
  }
  return html.replace('</head>', `  ${tag}\n  </head>`)
}

function setTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  }
  return html.replace('</head>', `  <title>${escapeHtml(title)}</title>\n  </head>`)
}

function setCanonical(html, url) {
  const re = /<link[^>]*rel=["']canonical["'][^>]*>/i
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`
  if (re.test(html)) {
    return html.replace(re, tag)
  }
  return html.replace('</head>', `  ${tag}\n  </head>`)
}

function injectPrerenderBody(html, route) {
  const url = `${baseUrl}${route.path === '/' ? '' : route.path}`
  const nav = NAV_LINKS.map(
    (r) => `<li><a href="${r.href}">${escapeHtml(r.label)}</a></li>`
  ).join('\n')

  const extraBody = route.bodyHtml
    ? `<div class="seo-content">${route.bodyHtml}</div>`
    : `<p>${escapeHtml(route.description)}</p>`

  const crawlable = `
    <div id="seo-prerender" data-seo-path="${escapeHtml(route.path)}">
      <header>
        <p><a href="/">Tehnička Škola Ada</a></p>
        <h1>${escapeHtml(route.title)}</h1>
        <p>${escapeHtml(route.description)}</p>
      </header>
      <nav aria-label="Main">
        <ul>
          ${nav}
        </ul>
      </nav>
      <main>
        ${extraBody}
        <p>Moše Pijade 47, 24430 Ada, Srbija · <a href="mailto:info@tsada.edu.rs">info@tsada.edu.rs</a> · <a href="tel:+38124853034">+381 24 853 034</a></p>
        <p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
      </main>
    </div>
  `

  if (html.includes('<!--app-html-->')) {
    return html.replace('<!--app-html-->', crawlable)
  }
  if (html.includes('<div id="app"></div>')) {
    return html.replace('<div id="app"></div>', `<div id="app">${crawlable}</div>`)
  }
  if (html.includes('<div id="app">')) {
    return html.replace(/<div id="app">[\s\S]*?<\/div>\s*(?=<script|<noscript)/, `<div id="app">${crawlable}</div>\n    `)
  }
  return html
}

function injectJsonLd(html, route) {
  const isArticle = route.path.startsWith('/renderer/') || route.path.startsWith('/album/')
  const data = isArticle
    ? {
        '@context': 'https://schema.org',
        '@type': route.path.startsWith('/album/') ? 'ImageGallery' : 'Article',
        headline: route.title,
        name: route.title,
        description: route.description,
        url: `${baseUrl}${route.path}`,
        dateModified: route.lastmod || undefined,
        author: { '@type': 'Organization', name: 'Tehnička Škola Ada' },
        publisher: {
          '@type': 'EducationalOrganization',
          name: 'Tehnička Škola Ada',
          logo: { '@type': 'ImageObject', url: `${baseUrl}/favicon.png` }
        },
        isPartOf: { '@type': 'WebSite', name: 'Tehnička Škola Ada', url: baseUrl }
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: route.title,
        description: route.description,
        url: `${baseUrl}${route.path === '/' ? '' : route.path}`,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Tehnička Škola Ada',
          url: baseUrl
        },
        about: {
          '@type': 'EducationalOrganization',
          name: 'Tehnička Škola Ada',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Moše Pijade 47',
            addressLocality: 'Ada',
            postalCode: '24430',
            addressCountry: 'RS'
          }
        }
      }

  const script = `<script type="application/ld+json">${JSON.stringify(data)}</script>`
  return html.replace('</head>', `  ${script}\n  </head>`)
}

async function writeRobots() {
  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /dc
Disallow: /heist
Disallow: /tv
Disallow: /presentation
Disallow: /sterasmus

Sitemap: ${baseUrl}/sitemap.xml
`
  await fs.writeFile(path.join(distDir, 'robots.txt'), content, 'utf-8')
  await fs.writeFile(path.join(root, 'public', 'robots.txt'), content, 'utf-8')
  console.log('[seo] robots.txt written')
}

/**
 * @param {Array<{ loc: string, lastmod?: string, changefreq?: string, priority?: number }>} urls
 */
async function writeSitemap(urls) {
  const seen = new Set()
  const unique = urls.filter((u) => {
    if (!u.loc || seen.has(u.loc)) return false
    seen.add(u.loc)
    return true
  })

  const now = new Date().toISOString()
  const body = unique
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
    <changefreq>${u.changefreq || 'monthly'}</changefreq>
    <priority>${Number(u.priority ?? 0.5).toFixed(1)}</priority>
  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf-8')
  await fs.writeFile(path.join(root, 'public', 'sitemap.xml'), xml, 'utf-8')
  console.log(`[seo] sitemap.xml written (${unique.length} urls)`)
}

async function listAllDocuments(collectionId) {
  const endpoint = 'https://appwrite.tsada.edu.rs/v1'
  const project = '659ea7f886cf55d4528a'
  const db = '658d3bb1c4785b1fad28'
  const headers = {
    'X-Appwrite-Project': project,
    'Content-Type': 'application/json'
  }

  const all = []
  const limit = 100
  let offset = 0

  while (true) {
    const url = `${endpoint}/databases/${db}/collections/${collectionId}/documents?limit=${limit}&offset=${offset}`
    const res = await fetch(url, { headers })
    if (!res.ok) {
      console.warn(`[seo] Appwrite ${collectionId}: HTTP ${res.status}`)
      break
    }
    const data = await res.json()
    const docs = data.documents || []
    all.push(...docs)
    if (docs.length < limit) break
    offset += limit
    if (offset > 2000) break
  }

  return all
}

/**
 * Fetch dynamic content routes from Appwrite for sitemap + prerender.
 * @returns {Promise<SeoRoute[]>}
 */
async function fetchDynamicRoutes() {
  /** @type {SeoRoute[]} */
  const routes = []

  try {
    const aboutDocs = await listAllDocuments('65975896caafdd1f1b63')
    for (const doc of aboutDocs) {
      if (doc.visible === false) continue

      const title =
        doc.title_rs || doc.title_hu || doc.title_en || doc.$id
      const description =
        plainDescription(
          doc.short_rs,
          doc.short_hu,
          doc.short_en,
          doc.text_rs,
          doc.text_hu,
          doc.text_en
        ) || `${title} – Tehnička Škola Ada`

      const isEducation =
        doc.type === 'courses' ||
        doc.type === 'education' ||
        doc.show_at_the_header_from_education === true

      const mode = isEducation ? 'education' : 'about'
      const pathSeg = `/renderer/${mode}/${doc.$id}`

      const bodyText = plainDescription(doc.text_rs, doc.text_hu, doc.text_en).slice(0, 800)

      routes.push({
        path: pathSeg,
        title: `${title} ~ Tehnička Škola Ada`,
        description,
        priority: isEducation ? 0.7 : 0.6,
        changefreq: 'monthly',
        lastmod: doc.$updatedAt,
        bodyHtml: bodyText
          ? `<p>${escapeHtml(bodyText)}${bodyText.length >= 800 ? '…' : ''}</p>`
          : undefined
      })
    }
    console.log(`[seo] about/content docs: ${aboutDocs.length} → ${routes.length} visible routes`)
  } catch (e) {
    console.warn('[seo] about content failed:', e.message)
  }

  try {
    const albums = await listAllDocuments('6596d061d7071d82025f')
    let albumCount = 0
    for (const doc of albums) {
      if (doc.visible === false) continue
      const title = doc.title_rs || doc.title_hu || doc.title_en || 'Album'
      const description =
        plainDescription(doc.short_rs, doc.short_hu, doc.short_en) ||
        `Foto album: ${title} – Tehnička Škola Ada`

      routes.push({
        path: `/album/${doc.$id}`,
        title: `${title} ~ Galerija ~ Tehnička Škola Ada`,
        description,
        priority: 0.5,
        changefreq: 'monthly',
        lastmod: doc.$updatedAt
      })
      albumCount++
    }
    console.log(`[seo] albums: ${albums.length} → ${albumCount} visible`)
  } catch (e) {
    console.warn('[seo] albums failed:', e.message)
  }

  // Known static education slugs (menu) in case not in DB as visible
  const knownEducation = [
    'mechanical_technician',
    'cnc_miller',
    'mechatronic_technician',
    'computer_electrotechnician',
    'primary_construction_works_operator',
    'examslist',
    'textbooks',
    'adult_education'
  ]
  const existing = new Set(routes.map((r) => r.path))
  for (const slug of knownEducation) {
    const p = `/renderer/education/${slug}`
    if (existing.has(p) || existing.has(`/renderer/about/${slug}`)) continue
    // will be filled if document exists when listed; skip phantom URLs
  }

  return routes
}

/**
 * @param {string} template
 * @param {SeoRoute[]} routes
 */
async function prerenderRoutes(template, routes) {
  let count = 0
  for (const route of routes) {
    let html = template
    const url = `${baseUrl}${route.path === '/' ? '' : route.path}`

    html = setTitle(html, route.title)
    html = setOrInsertMeta(html, 'name', 'description', route.description)
    html = setOrInsertMeta(html, 'name', 'title', route.title)
    html = setOrInsertMeta(html, 'property', 'og:title', route.title)
    html = setOrInsertMeta(html, 'property', 'og:description', route.description)
    html = setOrInsertMeta(html, 'property', 'og:url', url)
    html = setOrInsertMeta(html, 'property', 'twitter:title', route.title)
    html = setOrInsertMeta(html, 'property', 'twitter:description', route.description)
    html = setOrInsertMeta(html, 'name', 'twitter:title', route.title)
    html = setOrInsertMeta(html, 'name', 'twitter:description', route.description)
    html = setCanonical(html, url)
    html = injectJsonLd(html, route)
    html = injectPrerenderBody(html, route)

    if (route.path === '/') {
      await fs.writeFile(path.join(distDir, 'index.html'), html, 'utf-8')
    } else {
      const dir = path.join(distDir, route.path.replace(/^\//, ''))
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, 'index.html'), html, 'utf-8')
    }
    count++
  }
  console.log(`[seo] prerendered ${count} routes`)
}

async function main() {
  try {
    await fs.access(distDir)
  } catch {
    console.error('[seo] dist/ not found — run vite build first')
    process.exit(1)
  }

  // Read Vite-built index once; do not reuse already-prerendered root
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8')

  // If re-running seo:generate alone, strip previous seo-prerender from template
  let cleanTemplate = template
  if (cleanTemplate.includes('id="seo-prerender"')) {
    cleanTemplate = cleanTemplate.replace(
      /<div id="seo-prerender"[\s\S]*?<\/div>\s*(?=<\/div>\s*(?:<script|<noscript)|$)/,
      ''
    )
    // Prefer a fresh shell: rebuild recommended, but try to recover
    if (!cleanTemplate.includes('<!--app-html-->') && !cleanTemplate.includes('<div id="app"></div>')) {
      cleanTemplate = cleanTemplate.replace(
        /<div id="app">[\s\S]*?<\/div>/,
        '<div id="app"><!--app-html--></div>'
      )
    }
  }

  const dynamicRoutes = await fetchDynamicRoutes()
  const allRoutes = [...PUBLIC_ROUTES, ...dynamicRoutes]

  await writeRobots()
  await writeSitemap(
    allRoutes.map((r) => ({
      loc: `${baseUrl}${r.path === '/' ? '' : r.path}`,
      lastmod: r.lastmod,
      changefreq: r.changefreq || 'monthly',
      priority: r.priority ?? 0.5
    }))
  )
  await prerenderRoutes(cleanTemplate, allRoutes)

  console.log('[seo] done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
