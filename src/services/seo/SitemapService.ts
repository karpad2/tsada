import { seoService } from './SEOService'
import { pwaAppwriteService } from '../pwa/PWAAppwriteService'
import { config } from '@/appwrite'

export interface SitemapUrl {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export class SitemapService {
  private static instance: SitemapService
  private baseUrl = 'https://tsada.edu.rs'

  static getInstance(): SitemapService {
    if (!SitemapService.instance) {
      SitemapService.instance = new SitemapService()
    }
    return SitemapService.instance
  }

  /**
   * Generate complete sitemap
   */
  async generateSitemap(): Promise<string> {
    try {
      const urls = await this.getAllUrls()
      return seoService.generateSitemap(urls)
    } catch (error) {
      console.error('Error generating sitemap:', error)
      return this.getStaticSitemap()
    }
  }

  /**
   * Get all URLs for sitemap
   */
  private async getAllUrls(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = []

    // Static pages
    urls.push(...this.getStaticPages())

    // Dynamic pages from database
    try {
      const [documents, galleries, courses, news] = await Promise.all([
        this.getDocumentUrls(),
        this.getGalleryUrls(),
        this.getCourseUrls(),
        this.getNewsUrls()
      ])

      urls.push(...documents, ...galleries, ...courses, ...news)
    } catch (error) {
      console.error('Error fetching dynamic URLs:', error)
    }

    return urls
  }

  /**
   * Static pages
   */
  private getStaticPages(): SitemapUrl[] {
    return [
      {
        url: this.baseUrl,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      },
      {
        url: `${this.baseUrl}/about`,
        changefreq: 'monthly',
        priority: 0.8
      },
      {
        url: `${this.baseUrl}/about/history`,
        changefreq: 'yearly',
        priority: 0.7
      },
      {
        url: `${this.baseUrl}/about/workers`,
        changefreq: 'monthly',
        priority: 0.7
      },
      {
        url: `${this.baseUrl}/about/classlist`,
        changefreq: 'weekly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/about/schoolboard`,
        changefreq: 'monthly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/about/parentscouncil`,
        changefreq: 'monthly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/about/studentcouncil`,
        changefreq: 'monthly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/about/timetable`,
        changefreq: 'weekly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/about/workerstimetable`,
        changefreq: 'weekly',
        priority: 0.5
      },
      {
        url: `${this.baseUrl}/gallery`,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${this.baseUrl}/contact`,
        changefreq: 'monthly',
        priority: 0.7
      },
      {
        url: `${this.baseUrl}/documents`,
        changefreq: 'weekly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/studentdocuments`,
        changefreq: 'weekly',
        priority: 0.6
      }
    ]
  }

  /**
   * Get document URLs
   */
  private async getDocumentUrls(): Promise<SitemapUrl[]> {
    try {
      const response = await pwaAppwriteService.listDocuments(
        config.website_db,
        config.document_categories_db,
        [],
        { cache: true, ttl: 3600 }
      )

      return response.documents.map((doc: any) => ({
        url: `${this.baseUrl}/documents/${doc.$id}`,
        changefreq: 'weekly' as const,
        priority: 0.5,
        lastmod: doc.$updatedAt
      }))
    } catch (error) {
      console.error('Error fetching document URLs:', error)
      return []
    }
  }

  /**
   * Get gallery URLs
   */
  private async getGalleryUrls(): Promise<SitemapUrl[]> {
    try {
      const response = await pwaAppwriteService.listDocuments(
        config.website_db,
        config.gallery_db,
        [],
        { cache: true, ttl: 3600 }
      )

      return response.documents.map((doc: any) => ({
        url: `${this.baseUrl}/gallery/${doc.$id}`,
        changefreq: 'monthly' as const,
        priority: 0.6,
        lastmod: doc.$updatedAt
      }))
    } catch (error) {
      console.error('Error fetching gallery URLs:', error)
      return []
    }
  }

  /**
   * Get course URLs
   */
  private async getCourseUrls(): Promise<SitemapUrl[]> {
    const courses = [
      'mechanical_technician',
      'cnc_miller',
      'mechatronic_technician',
      'computer_electrotechnician',
      'primary_construction_works_operator'
    ]

    return courses.map(course => ({
      url: `${this.baseUrl}/renderer/education/${course}`,
      changefreq: 'monthly' as const,
      priority: 0.7
    }))
  }

  /**
   * Get news URLs
   */
  private async getNewsUrls(): Promise<SitemapUrl[]> {
    try {
      const response = await pwaAppwriteService.listDocuments(
        config.website_db,
        config.about_us_db,
        ['Query.equal("type", "news")', 'Query.orderDesc("$createdAt")', 'Query.limit(100)'],
        { cache: true, ttl: 1800 }
      )

      return response.documents.map((doc: any) => ({
        url: `${this.baseUrl}/renderer/about/${doc.$id}`,
        changefreq: 'monthly' as const,
        priority: 0.6,
        lastmod: doc.$updatedAt
      }))
    } catch (error) {
      console.error('Error fetching news URLs:', error)
      return []
    }
  }

  /**
   * Fallback static sitemap
   */
  private getStaticSitemap(): string {
    const staticUrls = this.getStaticPages()
    return seoService.generateSitemap(staticUrls)
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(): string {
    return seoService.generateRobotsTxt()
  }

  /**
   * Check if URL should be included in sitemap
   */
  private shouldIncludeUrl(url: string): boolean {
    const excludePatterns = [
      '/admin',
      '/api',
      '/login',
      '/_nuxt',
      '/src'
    ]

    return !excludePatterns.some(pattern => url.includes(pattern))
  }

  /**
   * Get sitemap index for large sites
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      { url: `${this.baseUrl}/sitemap-pages.xml`, lastmod: new Date().toISOString() },
      { url: `${this.baseUrl}/sitemap-documents.xml`, lastmod: new Date().toISOString() },
      { url: `${this.baseUrl}/sitemap-gallery.xml`, lastmod: new Date().toISOString() }
    ]

    const header = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    const sitemapEntries = sitemaps.map(sitemap =>
      `  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
    )

    const footer = `
</sitemapindex>`

    return header + '\n' + sitemapEntries.join('\n') + footer
  }
}

export const sitemapService = SitemapService.getInstance()