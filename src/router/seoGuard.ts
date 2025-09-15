import type { RouteLocationNormalized } from 'vue-router'
import { seoService } from '@/services/seo/SEOService'

/**
 * Router guard for automatic SEO handling
 */
export function seoGuard(to: RouteLocationNormalized) {
  // Don't process admin routes
  if (to.path.startsWith('/admin')) {
    return
  }

  // Generate basic SEO for the route
  const pageType = getPageTypeFromRoute(to)
  const seoData = generateSEOFromRoute(to, pageType)

  // Update page title immediately
  if (seoData.title) {
    document.title = seoData.title
  }

  // Add structured data based on page type
  addStructuredDataForRoute(to, pageType)
}

/**
 * Determine page type from route
 */
function getPageTypeFromRoute(route: RouteLocationNormalized): string {
  const path = route.path

  if (path === '/' || path === '/home') {
    return 'home'
  } else if (path.startsWith('/about')) {
    return 'about'
  } else if (path.startsWith('/gallery')) {
    return 'gallery'
  } else if (path.startsWith('/contact')) {
    return 'contact'
  } else if (path.startsWith('/renderer/education')) {
    return 'courses'
  } else if (path.startsWith('/documents')) {
    return 'documents'
  } else if (path.startsWith('/renderer/about')) {
    return 'news'
  }

  return 'general'
}

/**
 * Generate SEO data from route
 */
function generateSEOFromRoute(route: RouteLocationNormalized, pageType: string) {
  const baseUrl = 'https://tsada.edu.rs'
  const currentUrl = `${baseUrl}${route.path}`

  // Extract data from route params and query
  const routeData = {
    id: route.params.id,
    category: route.params.category,
    ...route.query
  }

  switch (pageType) {
    case 'home':
      return {
        title: 'Tehnička Škola Ada - Moderna stručna škola u Adi',
        description: 'Tehnička škola Ada - najveća srednja stručna škola u opštini Ada. Mašinstvo, elektrotehnika, građevinarstvo. Savremena nastava, kvalifikovani kadri, Erasmus+ projekti.',
        keywords: 'tehnička škola, Ada, Vojvodina, Srbija, stručno obrazovanje, mašinstvo, elektrotehnika, građevinarstvo, CNC tehniker, mechatronika'
      }

    case 'about':
      const aboutTitles: Record<string, string> = {
        'history': 'Istorija škole',
        'workers': 'Nastavno osoblje',
        'classlist': 'Spisak razreda',
        'schoolboard': 'Školski odbor',
        'parentscouncil': 'Savet roditelja',
        'studentcouncil': 'Učenički parlament',
        'timetable': 'Raspored časova',
        'workerstimetable': 'Raspored konsultacija'
      }

      const aboutPath = route.path.split('/').pop() || ''
      const aboutTitle = aboutTitles[aboutPath] || 'O školi'

      return {
        title: `${aboutTitle} - Tehnička Škola Ada`,
        description: `${aboutTitle} Tehničke škole Ada. Detaljne informacije o našoj školi, kadru i organizaciji.`,
        keywords: `${aboutTitle.toLowerCase()}, tehnicka skola ada, informacije o skoli`
      }

    case 'gallery':
      return {
        title: 'Galerija - Tehnička Škola Ada',
        description: 'Galerija slika Tehničke škole Ada. Pogledajte fotografije sa događaja, nastave i školskih aktivnosti.',
        keywords: 'galerija, fotografije, događaji, školske aktivnosti, tehnicka skola ada'
      }

    case 'courses':
      const courseTitles: Record<string, string> = {
        'mechanical_technician': 'Računarsko upravljanje u tehnici (CNC tehniker)',
        'cnc_miller': 'CNC operater',
        'mechatronic_technician': 'Mechatronički tehniker',
        'computer_electrotechnician': 'Elektronski tehniker',
        'primary_construction_works_operator': 'Izvođač građevinskih radova'
      }

      const coursePath = route.path.split('/').pop() || ''
      const courseTitle = courseTitles[coursePath] || 'Obrazovni profili'

      return {
        title: `${courseTitle} - Tehnička Škola Ada`,
        description: `${courseTitle} na Tehničkoj školi Ada. Detaljne informacije o nastavnom planu, predmetima i mogućnostima zapošljavanja.`,
        keywords: `${courseTitle.toLowerCase()}, obrazovni profili, nastava, tehnicko obrazovanje, Ada`
      }

    case 'contact':
      return {
        title: 'Kontakt - Tehnička Škola Ada',
        description: 'Kontakt informacije Tehničke škole Ada. Adresa, telefon, email i radno vreme kancelarije.',
        keywords: 'kontakt, adresa, telefon, email, radno vreme, tehnicka skola ada'
      }

    case 'documents':
      return {
        title: 'Dokumenti - Tehnička Škola Ada',
        description: 'Zvanični dokumenti, pravilnici i obaveštenja Tehničke škole Ada. Pristupite važnim školskim dokumentima.',
        keywords: 'dokumenti, pravilnici, obaveštenja, školska dokumenta, tehnicka skola ada'
      }

    default:
      return {
        title: 'Tehnička Škola Ada',
        description: 'Tehnička škola Ada - moderna stručna škola u Adi.',
        keywords: 'tehnicka skola ada'
      }
  }
}

/**
 * Add structured data for specific routes
 */
function addStructuredDataForRoute(route: RouteLocationNormalized, pageType: string) {
  // Remove existing dynamic structured data
  const existing = document.querySelector('script[type="application/ld+json"]#route-seo')
  if (existing) {
    existing.remove()
  }

  let structuredData: any = null

  switch (pageType) {
    case 'home':
      structuredData = seoService.generateStructuredData('organization', {})
      break

    case 'courses':
      const coursePath = route.path.split('/').pop() || ''
      const courseNames: Record<string, string> = {
        'mechanical_technician': 'Računarsko upravljanje u tehnici (CNC tehniker)',
        'cnc_miller': 'CNC operater',
        'mechatronic_technician': 'Mechatronički tehniker',
        'computer_electrotechnician': 'Elektronski tehniker',
        'primary_construction_works_operator': 'Izvođač građevinskih radova'
      }

      if (courseNames[coursePath]) {
        structuredData = seoService.generateStructuredData('course', {
          name: courseNames[coursePath],
          description: `Obrazovni profil ${courseNames[coursePath]} na Tehničkoj školi Ada`
        })
      }
      break

    case 'news':
    case 'about':
      if (route.params.id) {
        structuredData = seoService.generateStructuredData('article', {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
          url: `https://tsada.edu.rs${route.path}`,
          publishedTime: new Date().toISOString()
        })
      }
      break
  }

  // Add structured data to page
  if (structuredData) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'route-seo'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }
}