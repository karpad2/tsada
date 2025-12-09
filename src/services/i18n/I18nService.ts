import { convertifserbian } from '@/lang'
import { trackLanguageChange } from '@/utils/analytics'

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl?: boolean
}

export interface MultiLangContent {
  [key: string]: string // e.g., title_hu, title_rs, title_en
}

/**
 * Internationalization service
 */
export class I18nService {
  private static instance: I18nService
  private currentLanguage = 'hu'

  static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService()
    }
    return I18nService.instance
  }

  private readonly supportedLanguages: LanguageConfig[] = [
    {
      code: 'hu',
      name: 'Hungarian',
      nativeName: 'Magyar',
      flag: 'hu'
    },
    {
      code: 'sr',
      name: 'Serbian',
      nativeName: 'Српски',
      flag: 'rs'
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: 'gb'
    }
  ]

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return this.supportedLanguages
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  /**
   * Set current language
   */
  setCurrentLanguage(languageCode: string): void {
    const oldLanguage = this.currentLanguage

    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguage = languageCode
      trackLanguageChange(oldLanguage, languageCode)
    } else {
      console.warn(`Language ${languageCode} is not supported`)
    }
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode)
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(languageCode: string): LanguageConfig | undefined {
    return this.supportedLanguages.find(lang => lang.code === languageCode)
  }

  /**
   * Get localized content from multi-language object
   */
  getLocalizedContent(content: MultiLangContent, languageCode?: string, fallbackLang = 'hu'): string {
    const lang = languageCode || this.currentLanguage
    const key = this.findContentKey(content, lang)

    if (key && content[key]) {
      // Apply Serbian Cyrillic conversion if needed
      if ((lang === 'rs' || lang === 'sr') && content[key]) {
        return convertifserbian(content[key])
      }
      return content[key]
    }

    // Fallback to fallback language
    if (lang !== fallbackLang) {
      return this.getLocalizedContent(content, fallbackLang, 'en')
    }

    // Last resort: return first available content
    const firstKey = Object.keys(content).find(key => content[key])
    return firstKey ? content[firstKey] : ''
  }

  /**
   * Find content key for language (title_hu, name_rs, etc.)
   */
  private findContentKey(content: MultiLangContent, languageCode: string): string | undefined {
    // Common field prefixes
    const prefixes = ['title_', 'name_', 'description_', 'content_', 'short_', 'text_', 'category_name_']

    // Map 'sr' to 'rs' for database compatibility (database uses 'rs' but app uses 'sr')
    const dbLanguageCode = languageCode === 'sr' ? 'rs' : languageCode

    for (const prefix of prefixes) {
      // Try with mapped language code first (sr -> rs)
      const key = `${prefix}${dbLanguageCode}`
      if (content.hasOwnProperty(key)) {
        return key
      }

      // Also try original language code for backward compatibility
      if (languageCode !== dbLanguageCode) {
        const altKey = `${prefix}${languageCode}`
        if (content.hasOwnProperty(altKey)) {
          return altKey
        }
      }
    }

    // Direct language code key (try both versions)
    if (content.hasOwnProperty(dbLanguageCode)) {
      return dbLanguageCode
    }
    if (languageCode !== dbLanguageCode && content.hasOwnProperty(languageCode)) {
      return languageCode
    }

    return undefined
  }

  /**
   * Create multi-language content object template
   */
  createMultiLangTemplate(fieldPrefix: string, defaultValues: Partial<Record<string, string>> = {}): MultiLangContent {
    const template: MultiLangContent = {}

    for (const lang of this.supportedLanguages) {
      const key = `${fieldPrefix}_${lang.code}`
      template[key] = defaultValues[lang.code] || ''
    }

    return template
  }

  /**
   * Validate multi-language content
   */
  validateMultiLangContent(
    content: MultiLangContent,
    requiredLanguages: string[] = ['sr'],
    fieldPrefix = 'title'
  ): { isValid: boolean, missingLanguages: string[] } {
    const missingLanguages: string[] = []

    for (const lang of requiredLanguages) {
      const key = `${fieldPrefix}_${lang}`
      if (!content[key] || !content[key].trim()) {
        missingLanguages.push(lang)
      }
    }

    return {
      isValid: missingLanguages.length === 0,
      missingLanguages
    }
  }

  /**
   * Get display name for person with localization
   */
  getDisplayName(person: { name_hu?: string, name_rs?: string, name_en?: string }, languageCode?: string): string {
    const lang = languageCode || this.currentLanguage

    const content = {
      name_hu: person.name_hu || '',
      name_rs: person.name_rs || '',
      name_en: person.name_en || ''
    }

    return this.getLocalizedContent(content, lang) || 'Unknown'
  }

  /**
   * Format date according to language locale
   */
  formatDate(date: string | Date, languageCode?: string): string {
    const lang = languageCode || this.currentLanguage
    const dateObj = typeof date === 'string' ? new Date(date) : date

    try {
      const locales: Record<string, string> = {
        'hu': 'hu-HU',
        'sr': 'sr-RS',
        'en': 'en-GB'
      }

      return dateObj.toLocaleDateString(locales[lang] || 'hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateObj.toLocaleDateString()
    }
  }

  /**
   * Format number according to language locale
   */
  formatNumber(number: number, languageCode?: string): string {
    const lang = languageCode || this.currentLanguage

    try {
      const locales: Record<string, string> = {
        'hu': 'hu-HU',
        'sr': 'sr-RS',
        'en': 'en-GB'
      }

      return number.toLocaleString(locales[lang] || 'hu-HU')
    } catch (error) {
      return number.toString()
    }
  }

  /**
   * Get role translation
   */
  getRoleTranslation(role: string, languageCode?: string): string {
    const lang = languageCode || this.currentLanguage

    const roleTranslations: Record<string, Record<string, string>> = {
      'alelnök': {
        'rs': 'Заменик председника',
        'sr': 'Заменик председника',
        'hu': 'Alelnök',
        'en': 'Vice President'
      },
      'elnök': {
        'rs': 'Председник',
        'sr': 'Председник',
        'hu': 'Elnök',
        'en': 'President'
      },
      'tag': {
        'rs': 'Члан',
        'sr': 'Члан',
        'hu': 'Tag',
        'en': 'Member'
      }
    }

    const roleLower = role.toLowerCase()

    // Check alelnök first to avoid matching "elnök" within "alelnök"
    if (roleLower.includes('alelnök')) {
      return roleTranslations['alelnök'][lang] || role
    }
    if (roleLower.includes('elnök')) {
      return roleTranslations['elnök'][lang] || role
    }
    if (roleLower.includes('tag')) {
      return roleTranslations['tag'][lang] || role
    }

    return role
  }

  /**
   * Get language direction (LTR/RTL)
   */
  getLanguageDirection(languageCode?: string): 'ltr' | 'rtl' {
    const lang = languageCode || this.currentLanguage
    const config = this.getLanguageConfig(lang)
    return config?.rtl ? 'rtl' : 'ltr'
  }

  /**
   * Get available content languages from multi-lang object
   */
  getAvailableLanguages(content: MultiLangContent): string[] {
    const availableLanguages: string[] = []

    for (const lang of this.supportedLanguages) {
      const key = this.findContentKey(content, lang.code)
      if (key && content[key] && content[key].trim()) {
        availableLanguages.push(lang.code)
      }
    }

    return availableLanguages
  }

  /**
   * Get completion percentage for multi-language content
   */
  getContentCompleteness(content: MultiLangContent): Record<string, number> {
    const completeness: Record<string, number> = {}
    const totalFields = Object.keys(content).length

    if (totalFields === 0) return completeness

    for (const lang of this.supportedLanguages) {
      const langFields = Object.keys(content).filter(key => key.endsWith(`_${lang.code}`))
      const filledFields = langFields.filter(key => content[key] && content[key].trim()).length

      completeness[lang.code] = langFields.length > 0 ? Math.round((filledFields / langFields.length) * 100) : 0
    }

    return completeness
  }
}

// Export singleton instance
export const i18nService = I18nService.getInstance()