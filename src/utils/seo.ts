/**
 * SEO utilities for easier integration throughout the app
 */

import { useSEO } from '@/composables/useSEO'
import { seoService } from '@/services/seo/SEOService'
import { sitemapService } from '@/services/seo/SitemapService'

/**
 * Easy SEO setup for pages
 */
export function setupPageSEO(
  pageType: string,
  data?: any,
  customSEO?: {
    title?: string
    description?: string
    keywords?: string
    image?: string
  }
) {
  const { setSEO, generatePageSEO } = useSEO()

  let seoData
  if (customSEO?.title || customSEO?.description) {
    seoData = {
      title: customSEO.title,
      description: customSEO.description,
      keywords: customSEO.keywords,
      image: customSEO.image,
      type: pageType === 'home' ? 'website' : 'article'
    }
  } else {
    seoData = generatePageSEO(pageType, data)
  }

  setSEO(seoData)
  return seoData
}

/**
 * Generate Open Graph image URL
 */
export function generateOGImageUrl(
  title: string,
  subtitle?: string,
  image?: string
): string {
  const baseUrl = 'https://tsada.edu.rs'

  // For now, use the favicon. In production, you might want to generate dynamic OG images
  return image || `${baseUrl}/favicon.png`
}

/**
 * Extract SEO data from content
 */
export function extractSEOFromContent(content: any): {
  title: string
  description: string
  keywords: string
  image?: string
  publishedTime?: string
  modifiedTime?: string
} {
  const title = content.title_hu || content.title_rs || content.title_en || content.title || 'Tehnička Škola Ada'

  let description = ''
  if (content.description_hu || content.description_rs || content.description_en) {
    description = content.description_hu || content.description_rs || content.description_en
  } else if (content.content_hu || content.content_rs || content.content_en) {
    // Extract first 160 characters from content as description
    const contentText = content.content_hu || content.content_rs || content.content_en
    description = stripHtmlAndTruncate(contentText, 160)
  } else {
    description = 'Tehnička škola Ada - moderna stručna škola u Adi.'
  }

  // Generate keywords from title and content
  const keywords = generateKeywordsFromContent(title, description)

  return {
    title,
    description,
    keywords,
    image: content.image || content.featured_image,
    publishedTime: content.$createdAt,
    modifiedTime: content.$updatedAt
  }
}

/**
 * Strip HTML tags and truncate text
 */
export function stripHtmlAndTruncate(html: string, maxLength: number): string {
  if (!html) return ''

  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '')

  // Remove extra whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim()

  // Truncate and add ellipsis if needed
  if (cleanText.length <= maxLength) return cleanText

  return cleanText.substring(0, maxLength - 3).trim() + '...'
}

/**
 * Generate keywords from content
 */
export function generateKeywordsFromContent(title: string, description: string): string {
  const commonWords = ['i', 'u', 'na', 'za', 'sa', 'se', 'je', 'su', 'od', 'do', 'po', 'pre', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']

  const text = (title + ' ' + description).toLowerCase()
  const words = text.split(/\s+/)

  // Extract meaningful words (longer than 3 characters, not common words)
  const keywords = words
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .filter(word => /^[a-zA-ZčćžšđČĆŽŠĐáéíóúýÁÉÍÓÚÝäëïöüÄËÏÖÜ]+$/.test(word))
    .slice(0, 10) // Take first 10 keywords

  // Add default keywords based on current language context
  const defaultKeywords = ['tehnicka skola ada', 'stručno obrazovanje', 'Ada', 'Vojvodina', 'adai műszaki iskola', 'technical school ada', 'szakképzés', 'vocational education']

  return [...new Set([...keywords, ...defaultKeywords])].join(', ')
}

/**
 * Update page title with proper formatting
 */
export function updatePageTitle(title: string, addSiteName = true, language = 'rs'): void {
  // Multi-language school names
  const schoolNames = {
    'rs': 'Tehnička Škola Ada',
    'hu': 'Adai Műszaki Iskola',
    'en': 'Technical School Ada'
  } as const

  const siteName = schoolNames[language as keyof typeof schoolNames] || schoolNames.rs
  const formattedTitle = addSiteName && !title.includes(siteName)
    ? `${title} ~ ${siteName}`
    : title

  document.title = formattedTitle
}

/**
 * Add breadcrumb structured data
 */
export function addBreadcrumbData(breadcrumbs: Array<{ name: string; url: string }>): void {
  const structuredData = seoService.generateStructuredData('breadcrumb', breadcrumbs)

  // Remove existing breadcrumb data
  const existing = document.querySelector('script[type="application/ld+json"]#breadcrumb-seo')
  if (existing) {
    existing.remove()
  }

  // Add new breadcrumb data
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = 'breadcrumb-seo'
  script.textContent = JSON.stringify(structuredData)
  document.head.appendChild(script)
}

/**
 * Check if current page is indexable by search engines
 */
export function isPageIndexable(): boolean {
  const currentPath = window.location.pathname

  const noIndexPaths = [
    '/admin',
    '/login',
    '/api',
    '/tv',
    '/presentation'
  ]

  return !noIndexPaths.some(path => currentPath.startsWith(path))
}

/**
 * Generate sitemap on demand
 */
export async function generateSitemap(): Promise<string> {
  try {
    return await sitemapService.generateSitemap()
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return ''
  }
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(): string {
  return sitemapService.generateRobotsTxt()
}

/**
 * Performance-optimized image loading for SEO
 */
export function optimizeImageForSEO(src: string, alt: string, width?: number, height?: number): {
  src: string
  alt: string
  loading: 'lazy' | 'eager'
  decoding: 'async' | 'sync'
  width?: number
  height?: number
} {
  return {
    src,
    alt: alt || 'Tehnička Škola Ada',
    loading: 'lazy',
    decoding: 'async',
    width,
    height
  }
}

/**
 * Check if meta description is optimal length
 */
export function validateMetaDescription(description: string): {
  isValid: boolean
  length: number
  recommendation: string
} {
  const length = description.length
  const isValid = length >= 120 && length <= 160

  let recommendation = ''
  if (length < 120) {
    recommendation = 'Meta description is too short. Aim for 120-160 characters.'
  } else if (length > 160) {
    recommendation = 'Meta description is too long. It may be truncated in search results.'
  } else {
    recommendation = 'Meta description length is optimal.'
  }

  return {
    isValid,
    length,
    recommendation
  }
}

/**
 * Export all SEO utilities
 */
export const SEOUtils = {
  setupPageSEO,
  generateOGImageUrl,
  extractSEOFromContent,
  stripHtmlAndTruncate,
  generateKeywordsFromContent,
  updatePageTitle,
  addBreadcrumbData,
  isPageIndexable,
  generateSitemap,
  generateRobotsTxt,
  optimizeImageForSEO,
  validateMetaDescription
}