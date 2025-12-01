import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'
import { useI18n } from 'vue-i18n'
import { messages } from '@/lang'

export interface SEOData {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  locale?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tag?: string
  structuredData?: any
}

export function useSEO() {
  const route = useRoute()
  const loadingStore = useLoadingStore()
  const { t } = useI18n()

  const defaultSEO = {
    title: 'Tehnička Škola Ada',
    description: 'Tehnička škola Ada - najveća srednja stručna škola u opštini Ada. Mašinstvo, elektrotehnika, građevinarstvo.',
    keywords: 'tehnička škola, Ada, Vojvodina, Srbija, stručno obrazovanje, mašinstvo, elektrotehnika, građevinarstvo',
    image: 'https://tsada.edu.rs/favicon.png',
    url: 'https://tsada.edu.rs',
    type: 'website',
    locale: 'sr_RS'
  }

  const currentSEO = ref<SEOData>({ ...defaultSEO })

  /**
   * Set page title with automatic formatting: "title ~ School Name"
   * @param title - The page title (can be a translation key or plain text)
   */
  const setPageTitle = (title: string) => {
    const schoolName = t('school_name')
    const formattedTitle = title ? `${title} ~ ${schoolName}` : schoolName
    document.title = formattedTitle
    updateMetaTag('property', 'og:title', formattedTitle)
    updateMetaTag('name', 'twitter:title', formattedTitle)
  }

  /**
   * Set SEO data for current page
   */
  const setSEO = (seoData: SEOData) => {
    currentSEO.value = {
      ...defaultSEO,
      ...seoData
    }
    updateMetaTags()
  }

  /**
   * Update HTML meta tags
   */
  const updateMetaTags = () => {
    const seo = currentSEO.value

    // Update title with formatting
    if (seo.title) {
      const schoolName = t('school_name')
      const formattedTitle = seo.title.includes(schoolName) ? seo.title : `${seo.title} ~ ${schoolName}`
      document.title = formattedTitle
      updateMetaTag('property', 'og:title', formattedTitle)
      updateMetaTag('name', 'twitter:title', formattedTitle)
    }

    // Update description
    if (seo.description) {
      updateMetaTag('name', 'description', seo.description)
      updateMetaTag('property', 'og:description', seo.description)
      updateMetaTag('name', 'twitter:description', seo.description)
    }

    // Update keywords
    if (seo.keywords) {
      updateMetaTag('name', 'keywords', seo.keywords)
    }

    // Update image
    if (seo.image) {
      updateMetaTag('property', 'og:image', seo.image)
      updateMetaTag('name', 'twitter:image', seo.image)
    }

    // Update URL
    if (seo.url) {
      updateMetaTag('property', 'og:url', seo.url)
      updateMetaTag('name', 'twitter:url', seo.url)
      updateLinkTag('canonical', seo.url)
    }

    // Update type
    if (seo.type) {
      updateMetaTag('property', 'og:type', seo.type)
    }

    // Update locale
    if (seo.locale) {
      updateMetaTag('property', 'og:locale', seo.locale)
      updateHtmlLang(seo.locale)
    }

    // Update author
    if (seo.author) {
      updateMetaTag('name', 'author', seo.author)
    }

    // Update timestamps
    if (seo.publishedTime) {
      updateMetaTag('property', 'article:published_time', seo.publishedTime)
    }

    if (seo.modifiedTime) {
      updateMetaTag('property', 'article:modified_time', seo.modifiedTime)
    }

    // Update section/category
    if (seo.section) {
      updateMetaTag('property', 'article:section', seo.section)
    }

    // Update tags
    if (seo.tag) {
      updateMetaTag('property', 'article:tag', seo.tag)
    }

    // Update structured data
    if (seo.structuredData) {
      updateStructuredData(seo.structuredData)
    }
  }

  /**
   * Update or create meta tag
   */
  const updateMetaTag = (attribute: string, value: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${value}"]`)

    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, value)
      document.head.appendChild(element)
    }

    element.setAttribute('content', content)
  }

  /**
   * Update or create link tag
   */
  const updateLinkTag = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`)

    if (!element) {
      element = document.createElement('link')
      element.setAttribute('rel', rel)
      document.head.appendChild(element)
    }

    element.setAttribute('href', href)
  }

  /**
   * Update HTML lang attribute
   */
  const updateHtmlLang = (locale: string) => {
    const lang = locale.split('_')[0]
    document.documentElement.setAttribute('lang', lang)
  }

  /**
   * Update structured data (JSON-LD)
   */
  const updateStructuredData = (data: any) => {
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]#dynamic-seo')
    if (existing) {
      existing.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'dynamic-seo'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  /**
   * Generate SEO for different page types
   */
  const generatePageSEO = (pageType: string, data?: any): SEOData => {
    const baseUrl = 'https://tsada.edu.rs'
    const currentUrl = `${baseUrl}${route.path}`

    switch (pageType) {
      case 'home':
        return {
          title: 'Tehnička Škola Ada - Moderna stručna škola u Adi',
          description: 'Tehnička škola Ada - najveća srednja stručna škola u opštini Ada. Mašinstvo, elektrotehnika, građevinarstvo. Savremena nastava, kvalifikovani kadri, Erasmus+ projekti.',
          keywords: 'tehnička škola, Ada, Vojvodina, Srbija, stručno obrazovanje, mašinstvo, elektrotehnika, građevinarstvo, CNC tehniker, mechatronika',
          url: baseUrl,
          type: 'website'
        }

      case 'about':
        return {
          title: `O školi - Tehnička Škola Ada`,
          description: 'Istorija, vizija i misija Tehničke škole Ada. Upoznajte se sa našim kadrom, objektima i vrednostima koje negujemo.',
          keywords: 'o nama, istorija škole, vizija, misija, kadrovska struktura, tehnicka skola ada',
          url: currentUrl,
          type: 'article',
          section: 'About'
        }

      case 'courses':
        return {
          title: `${data?.courseName || 'Obrazovni profili'} - Tehnička Škola Ada`,
          description: `${data?.courseName || 'Obrazovni profili'} na Tehničkoj školi Ada. Detaljne informacije o nastavnom planu, predmetima i mogućnostima zapošljavanja.`,
          keywords: `${data?.courseName || 'kursevi'}, obrazovni profili, nastava, tehnicko obrazovanje, Ada`,
          url: currentUrl,
          type: 'article',
          section: 'Education'
        }

      case 'gallery':
        return {
          title: `${data?.albumName || 'Galerija'} - Tehnička Škola Ada`,
          description: `${data?.albumName || 'Galerija slika'} Tehničke škole Ada. Pogledajte fotografije sa događaja, nastave i školskih aktivnosti.`,
          keywords: 'galerija, fotografije, događaji, školske aktivnosti, tehnicka skola ada',
          url: currentUrl,
          type: 'article',
          section: 'Gallery'
        }

      case 'news':
        return {
          title: `${data?.title || 'Vesti'} - Tehnička Škola Ada`,
          description: data?.description || 'Najnovije vesti i obaveštenja Tehničke škole Ada. Budite u toku sa najnovijim dešavanjima.',
          keywords: 'vesti, obavešenja, događaji, novosti, tehnicka skola ada',
          url: currentUrl,
          type: 'article',
          section: 'News',
          publishedTime: data?.publishedTime,
          modifiedTime: data?.modifiedTime
        }

      case 'contact':
        return {
          title: 'Kontakt - Tehnička Škola Ada',
          description: 'Kontakt informacije Tehničke škole Ada. Adresa, telefon, email i radno vreme kancelarije.',
          keywords: 'kontakt, adresa, telefon, email, radno vreme, tehnicka skola ada',
          url: currentUrl,
          type: 'article',
          section: 'Contact'
        }

      default:
        return {
          title: `${data?.title || 'Stranica'} - Tehnička Škola Ada`,
          description: data?.description || defaultSEO.description,
          url: currentUrl,
          type: 'article'
        }
    }
  }

  /**
   * Watch for language changes and update locale
   */
  watch(() => loadingStore.language, (newLang) => {
    const localeMap: Record<string, string> = {
      'sr': 'sr_RS',
      'rs': 'sr_RS',
      'hu': 'hu_HU',
      'en': 'en_US'
    }

    currentSEO.value.locale = localeMap[newLang] || 'sr_RS'
    updateMetaTags()
  })

  /**
   * Initialize SEO on mount
   */
  onMounted(() => {
    updateMetaTags()
  })

  return {
    currentSEO,
    setSEO,
    setPageTitle,
    generatePageSEO,
    updateMetaTags
  }
}

/**
 * Global helper function to set page title (works in Options API)
 * @param title - The page title
 */
export function setDocumentTitle(title: string) {
  const loadingStore = useLoadingStore()
  const currentLang = loadingStore.language || 'hu'

  // Get messages for current language
  const langKey = currentLang === 'sr' ? 'rs' : currentLang
  const langMessages = (messages as any)[langKey] || (messages as any).hu
  const schoolName = langMessages.school_name || 'Adai Műszaki Iskola'
  const formattedTitle = title ? `${title} ~ ${schoolName}` : schoolName
  document.title = formattedTitle
}