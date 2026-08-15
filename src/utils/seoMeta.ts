/**
 * Shared SEO meta generation for SSR head injection and client updates.
 * Pure functions — safe on server and client.
 */

export interface RouteSEO {
  title: string
  description: string
  keywords: string
  type?: string
  section?: string
}

const BASE_URL = 'https://tsada.edu.rs'
const DEFAULT_IMAGE = 'https://tsada.edu.rs/favicon.png'

const ABOUT_TITLES: Record<string, string> = {
  history: 'Istorija škole',
  workers: 'Nastavno osoblje',
  classlist: 'Spisak razreda',
  schoolboard: 'Školski odbor',
  parentscouncil: 'Savet roditelja',
  studentcouncil: 'Učenički parlament',
  timetable: 'Raspored časova',
  workerstimetable: 'Raspored konsultacija',
  parentvisiting: 'Prijem roditelja',
  birthday: 'Rođendani',
  gallery: 'Galerija',
  pepsi: 'PEPSI',
  'class-schedule': 'Raspored odeljenja'
}

const COURSE_TITLES: Record<string, string> = {
  mechanical_technician: 'Računarsko upravljanje u tehnici (CNC tehniker)',
  cnc_miller: 'CNC operater',
  mechatronic_technician: 'Mechatronički tehniker',
  computer_electrotechnician: 'Elektronski tehniker',
  primary_construction_works_operator: 'Izvođač građevinskih radova'
}

export function getPageTypeFromPath(path: string): string {
  if (path === '/' || path === '/home') return 'home'
  if (path.startsWith('/about')) return 'about'
  if (path.startsWith('/gallery') || path.startsWith('/album')) return 'gallery'
  if (path.startsWith('/contact')) return 'contact'
  if (path.startsWith('/renderer/education')) return 'courses'
  if (path.startsWith('/documents') || path.startsWith('/studentdocuments')) return 'documents'
  if (path.startsWith('/renderer/about') || path.startsWith('/renderer/')) return 'news'
  if (path.startsWith('/erasmus')) return 'erasmus'
  if (path.startsWith('/login')) return 'login'
  if (path.startsWith('/admin') || path.startsWith('/dc') || path.startsWith('/heist') || path.startsWith('/tv')) {
    return 'app'
  }
  return 'general'
}

export function generateSEOFromPath(path: string): RouteSEO {
  const pageType = getPageTypeFromPath(path)
  const segment = path.split('/').filter(Boolean).pop() || ''

  switch (pageType) {
    case 'home':
      return {
        title: 'Tehnička Škola Ada - Moderna stručna škola u Adi',
        description:
          'Tehnička škola Ada - najveća srednja stručna škola u opštini Ada. Mašinstvo, elektrotehnika, građevinarstvo. Savremena nastava, kvalifikovani kadri, Erasmus+ projekti.',
        keywords:
          'tehnička škola, Ada, Vojvodina, Srbija, stručno obrazovanje, mašinstvo, elektrotehnika, građevinarstvo, CNC tehniker, mechatronika',
        type: 'website'
      }

    case 'about': {
      const aboutTitle = ABOUT_TITLES[segment] || 'O školi'
      return {
        title: `${aboutTitle} - Tehnička Škola Ada`,
        description: `${aboutTitle} Tehničke škole Ada. Detaljne informacije o našoj školi, kadru i organizaciji.`,
        keywords: `${aboutTitle.toLowerCase()}, tehnicka skola ada, informacije o skoli`,
        type: 'article',
        section: 'About'
      }
    }

    case 'gallery':
      return {
        title: 'Galerija - Tehnička Škola Ada',
        description:
          'Galerija slika Tehničke škole Ada. Pogledajte fotografije sa događaja, nastave i školskih aktivnosti.',
        keywords: 'galerija, fotografije, događaji, školske aktivnosti, tehnicka skola ada',
        type: 'article',
        section: 'Gallery'
      }

    case 'courses': {
      const courseTitle = COURSE_TITLES[segment] || 'Obrazovni profili'
      return {
        title: `${courseTitle} - Tehnička Škola Ada`,
        description: `${courseTitle} na Tehničkoj školi Ada. Detaljne informacije o nastavnom planu, predmetima i mogućnostima zapošljavanja.`,
        keywords: `${courseTitle.toLowerCase()}, obrazovni profili, nastava, tehnicko obrazovanje, Ada`,
        type: 'article',
        section: 'Education'
      }
    }

    case 'contact':
      return {
        title: 'Kontakt - Tehnička Škola Ada',
        description:
          'Kontakt informacije Tehničke škole Ada. Adresa, telefon, email i radno vreme kancelarije.',
        keywords: 'kontakt, adresa, telefon, email, radno vreme, tehnicka skola ada',
        type: 'article',
        section: 'Contact'
      }

    case 'documents':
      if (path.includes('/search')) {
        return {
          title: 'Pretraga dokumenata - Tehnička Škola Ada',
          description:
            'Pretražite dokumente Tehničke škole Ada po kategoriji, jeziku i datumu.',
          keywords: 'dokumenti, pretraga, kategorija, jezik, datum, tehnicka skola ada',
          type: 'article',
          section: 'Documents'
        }
      }
      return {
        title: 'Dokumenti - Tehnička Škola Ada',
        description:
          'Zvanični dokumenti, pravilnici i obaveštenja Tehničke škole Ada. Pristupite važnim školskim dokumentima.',
        keywords: 'dokumenti, pravilnici, obaveštenja, školska dokumenta, tehnicka skola ada',
        type: 'article',
        section: 'Documents'
      }

    case 'erasmus':
      return {
        title: 'Erasmus+ - Tehnička Škola Ada',
        description: 'Erasmus+ projekti i prijave Tehničke škole Ada.',
        keywords: 'erasmus, mobilnost, projekti, tehnicka skola ada',
        type: 'article',
        section: 'Erasmus'
      }

    case 'login':
      return {
        title: 'Prijava - Tehnička Škola Ada',
        description: 'Prijava na nalog Tehničke škole Ada.',
        keywords: 'prijava, login, tehnicka skola ada',
        type: 'website'
      }

    case 'app':
      return {
        title: 'Tehnička Škola Ada',
        description: 'Tehnička škola Ada - moderna stručna škola u Adi.',
        keywords: 'tehnicka skola ada',
        type: 'website'
      }

    default:
      return {
        title: 'Tehnička Škola Ada',
        description: 'Tehnička škola Ada - moderna stručna škola u Adi.',
        keywords: 'tehnicka skola ada',
        type: 'website'
      }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build SSR-injectable head HTML for a request path.
 */
export function generateHeadHtml(urlPath: string): string {
  const path = (urlPath.split('?')[0] || '/').replace(/\/$/, '') || '/'
  const seo = generateSEOFromPath(path)
  const fullUrl = `${BASE_URL}${path === '/' ? '/' : path}`
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const keywords = escapeHtml(seo.keywords)
  const type = seo.type || 'website'

  return `
    <title>${title}</title>
    <meta name="title" content="${title}">
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${DEFAULT_IMAGE}">
    <meta property="og:site_name" content="Tehnička Škola Ada">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${fullUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${DEFAULT_IMAGE}">
    <link rel="canonical" href="${fullUrl}">
  `.trim()
}
