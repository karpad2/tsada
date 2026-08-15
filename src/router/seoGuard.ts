import type { RouteLocationNormalized } from 'vue-router'
import { seoService } from '@/services/seo/SEOService'
import { generateSEOFromPath, getPageTypeFromPath } from '@/utils/seoMeta'

/**
 * Router guard for automatic SEO handling (client-side document updates).
 * SSR head tags are injected via entry-server + generateHeadHtml.
 */
export function seoGuard(to: RouteLocationNormalized) {
  if (to.path.startsWith('/admin')) {
    return
  }

  const pageType = getPageTypeFromPath(to.path)
  const seoData = generateSEOFromPath(to.path)

  if (typeof document === 'undefined') {
    return
  }

  if (seoData.title) {
    document.title = seoData.title
  }

  addStructuredDataForRoute(to, pageType)
}

function addStructuredDataForRoute(route: RouteLocationNormalized, pageType: string) {
  if (typeof document === 'undefined') return

  const existing = document.querySelector('script[type="application/ld+json"]#route-seo')
  if (existing) {
    existing.remove()
  }

  let structuredData: any = null

  switch (pageType) {
    case 'home':
      structuredData = seoService.generateStructuredData('organization', {})
      break

    case 'courses': {
      const coursePath = route.path.split('/').pop() || ''
      const courseNames: Record<string, string> = {
        mechanical_technician: 'Računarsko upravljanje u tehnici (CNC tehniker)',
        cnc_miller: 'CNC operater',
        mechatronic_technician: 'Mechatronički tehniker',
        computer_electrotechnician: 'Elektronski tehniker',
        primary_construction_works_operator: 'Izvođač građevinskih radova'
      }

      if (courseNames[coursePath]) {
        structuredData = seoService.generateStructuredData('course', {
          name: courseNames[coursePath],
          description: `Obrazovni profil ${courseNames[coursePath]} na Tehničkoj školi Ada`
        })
      }
      break
    }

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

  if (structuredData) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'route-seo'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }
}
