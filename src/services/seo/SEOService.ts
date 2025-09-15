/**
 * SEO Service for generating and managing SEO metadata
 */

export interface SEOConfig {
  siteName: string
  baseUrl: string
  defaultImage: string
  social: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
  }
  languages: Array<{
    code: string
    locale: string
    hreflang: string
  }>
}

export interface PageSEO {
  title: string
  description: string
  keywords: string
  image?: string
  url: string
  type: 'website' | 'article' | 'profile'
  locale: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  author?: string
}

export class SEOService {
  private static instance: SEOService
  private config: SEOConfig

  static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService()
    }
    return SEOService.instance
  }

  private constructor() {
    this.config = {
      siteName: 'Tehnička Škola Ada',
      baseUrl: 'https://tsada.edu.rs',
      defaultImage: 'https://tsada.edu.rs/favicon.png',
      social: {
        facebook: 'https://facebook.com/tehnicka.skola.ada',
        instagram: 'https://instagram.com/tsada_official'
      },
      languages: [
        { code: 'sr', locale: 'sr_RS', hreflang: 'sr' },
        { code: 'hu', locale: 'hu_HU', hreflang: 'hu' },
        { code: 'en', locale: 'en_US', hreflang: 'en' }
      ]
    }
  }

  /**
   * Generate complete SEO metadata
   */
  generateSEO(pageData: Partial<PageSEO>): PageSEO {
    const defaultSEO: PageSEO = {
      title: this.config.siteName,
      description: 'Tehnička škola Ada - najveća srednja stručna škola u opštini Ada. Mašinstvo, elektrotehnika, građevinarstvo.',
      keywords: 'tehnička škola, Ada, Vojvodina, Srbija, stručno obrazovanje',
      image: this.config.defaultImage,
      url: this.config.baseUrl,
      type: 'website',
      locale: 'sr_RS'
    }

    return {
      ...defaultSEO,
      ...pageData
    }
  }

  /**
   * Generate meta tags HTML
   */
  generateMetaTags(seo: PageSEO): string {
    const tags = [
      // Primary meta tags
      `<title>${seo.title}</title>`,
      `<meta name="title" content="${seo.title}">`,
      `<meta name="description" content="${seo.description}">`,
      `<meta name="keywords" content="${seo.keywords}">`,

      // Open Graph
      `<meta property="og:type" content="${seo.type}">`,
      `<meta property="og:url" content="${seo.url}">`,
      `<meta property="og:title" content="${seo.title}">`,
      `<meta property="og:description" content="${seo.description}">`,
      `<meta property="og:image" content="${seo.image || this.config.defaultImage}">`,
      `<meta property="og:site_name" content="${this.config.siteName}">`,
      `<meta property="og:locale" content="${seo.locale}">`,

      // Twitter
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:url" content="${seo.url}">`,
      `<meta name="twitter:title" content="${seo.title}">`,
      `<meta name="twitter:description" content="${seo.description}">`,
      `<meta name="twitter:image" content="${seo.image || this.config.defaultImage}">`,

      // Canonical
      `<link rel="canonical" href="${seo.url}">`
    ]

    // Article specific meta tags
    if (seo.type === 'article') {
      if (seo.publishedTime) {
        tags.push(`<meta property="article:published_time" content="${seo.publishedTime}">`)
      }
      if (seo.modifiedTime) {
        tags.push(`<meta property="article:modified_time" content="${seo.modifiedTime}">`)
      }
      if (seo.section) {
        tags.push(`<meta property="article:section" content="${seo.section}">`)
      }
      if (seo.author) {
        tags.push(`<meta property="article:author" content="${seo.author}">`)
      }
      if (seo.tags) {
        seo.tags.forEach(tag => {
          tags.push(`<meta property="article:tag" content="${tag}">`)
        })
      }
    }

    // Language alternates
    this.config.languages.forEach(lang => {
      const url = lang.code === 'sr' ? this.config.baseUrl : `${this.config.baseUrl}?lang=${lang.code}`
      tags.push(`<link rel="alternate" hreflang="${lang.hreflang}" href="${url}">`)
    })

    return tags.join('\n')
  }

  /**
   * Generate structured data (JSON-LD)
   */
  generateStructuredData(type: string, data: any): any {
    const baseSchema = {
      "@context": "https://schema.org"
    }

    switch (type) {
      case 'organization':
        return {
          ...baseSchema,
          "@type": "EducationalOrganization",
          "name": this.config.siteName,
          "alternateName": "Technical School Ada",
          "url": this.config.baseUrl,
          "logo": this.config.defaultImage,
          "image": this.config.defaultImage,
          "description": "Tehnička škola Ada - najveća srednja stručna škola u opštini Ada.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Moše Pijade 47",
            "addressLocality": "Ada",
            "postalCode": "24430",
            "addressCountry": "RS"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+381-24-853-034",
            "contactType": "customer service",
            "availableLanguage": ["Serbian", "Hungarian", "English"]
          },
          "sameAs": Object.values(this.config.social).filter(Boolean)
        }

      case 'article':
        return {
          ...baseSchema,
          "@type": "Article",
          "headline": data.title,
          "description": data.description,
          "image": data.image || this.config.defaultImage,
          "author": {
            "@type": "Organization",
            "name": this.config.siteName
          },
          "publisher": {
            "@type": "Organization",
            "name": this.config.siteName,
            "logo": {
              "@type": "ImageObject",
              "url": this.config.defaultImage
            }
          },
          "datePublished": data.publishedTime,
          "dateModified": data.modifiedTime || data.publishedTime,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url
          }
        }

      case 'course':
        return {
          ...baseSchema,
          "@type": "Course",
          "name": data.name,
          "description": data.description,
          "provider": {
            "@type": "Organization",
            "name": this.config.siteName,
            "sameAs": this.config.baseUrl
          },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "onsite",
            "location": {
              "@type": "Place",
              "name": this.config.siteName,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Moše Pijade 47",
                "addressLocality": "Ada",
                "postalCode": "24430",
                "addressCountry": "RS"
              }
            }
          }
        }

      case 'event':
        return {
          ...baseSchema,
          "@type": "Event",
          "name": data.name,
          "description": data.description,
          "startDate": data.startDate,
          "endDate": data.endDate,
          "location": {
            "@type": "Place",
            "name": this.config.siteName,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Moše Pijade 47",
              "addressLocality": "Ada",
              "postalCode": "24430",
              "addressCountry": "RS"
            }
          },
          "organizer": {
            "@type": "Organization",
            "name": this.config.siteName,
            "url": this.config.baseUrl
          }
        }

      case 'breadcrumb':
        return {
          ...baseSchema,
          "@type": "BreadcrumbList",
          "itemListElement": data.map((item: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        }

      default:
        return baseSchema
    }
  }

  /**
   * Generate sitemap.xml content
   */
  generateSitemap(urls: Array<{
    url: string
    lastmod?: string
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
  }>): string {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`

    const urlEntries = urls.map(entry => {
      let urlXml = `  <url>
    <loc>${entry.url}</loc>`

      if (entry.lastmod) {
        urlXml += `
    <lastmod>${entry.lastmod}</lastmod>`
      }

      if (entry.changefreq) {
        urlXml += `
    <changefreq>${entry.changefreq}</changefreq>`
      }

      if (entry.priority) {
        urlXml += `
    <priority>${entry.priority}</priority>`
      }

      // Add language alternates
      this.config.languages.forEach(lang => {
        const langUrl = lang.code === 'sr' ? entry.url : `${entry.url}?lang=${lang.code}`
        urlXml += `
    <xhtml:link rel="alternate" hreflang="${lang.hreflang}" href="${langUrl}"/>`
      })

      urlXml += `
  </url>`
      return urlXml
    })

    const footer = `
</urlset>`

    return header + '\n' + urlEntries.join('\n') + footer
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.config.baseUrl}/sitemap.xml

# Crawl-delay for politeness
Crawl-delay: 1

# Block admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /_nuxt/
Disallow: /src/

# Allow important paths
Allow: /gallery/
Allow: /about/
Allow: /contact/
Allow: /courses/`
  }

  /**
   * Get configuration
   */
  getConfig(): SEOConfig {
    return this.config
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SEOConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const seoService = SEOService.getInstance()