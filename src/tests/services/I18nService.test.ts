import { describe, it, expect, beforeEach, vi } from 'vitest'
import { I18nService } from '@/services/i18n/I18nService'

// Mock the convertifserbian function
vi.mock('@/lang', () => ({
  convertifserbian: vi.fn((text: string) => `[CYRILLIC]${text}`)
}))

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackLanguageChange: vi.fn()
}))

describe('I18nService', () => {
  let i18nService: I18nService

  beforeEach(() => {
    i18nService = I18nService.getInstance()
    i18nService.setCurrentLanguage('hu') // Reset to default
  })

  describe('Language management', () => {
    it('should return supported languages', () => {
      const languages = i18nService.getSupportedLanguages()

      expect(languages).toHaveLength(3)
      expect(languages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'hu', name: 'Hungarian' }),
          expect.objectContaining({ code: 'rs', name: 'Serbian' }),
          expect.objectContaining({ code: 'en', name: 'English' })
        ])
      )
    })

    it('should set and get current language', () => {
      expect(i18nService.getCurrentLanguage()).toBe('hu')

      i18nService.setCurrentLanguage('rs')
      expect(i18nService.getCurrentLanguage()).toBe('rs')

      i18nService.setCurrentLanguage('en')
      expect(i18nService.getCurrentLanguage()).toBe('en')
    })

    it('should not set unsupported language', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      i18nService.setCurrentLanguage('fr')

      expect(i18nService.getCurrentLanguage()).toBe('hu') // Should remain unchanged
      expect(consoleSpy).toHaveBeenCalledWith('Language fr is not supported')

      consoleSpy.mockRestore()
    })

    it('should check if language is supported', () => {
      expect(i18nService.isLanguageSupported('hu')).toBe(true)
      expect(i18nService.isLanguageSupported('rs')).toBe(true)
      expect(i18nService.isLanguageSupported('en')).toBe(true)
      expect(i18nService.isLanguageSupported('fr')).toBe(false)
    })

    it('should get language configuration', () => {
      const huConfig = i18nService.getLanguageConfig('hu')
      expect(huConfig).toEqual({
        code: 'hu',
        name: 'Hungarian',
        nativeName: 'Magyar',
        flag: 'hu'
      })

      const invalidConfig = i18nService.getLanguageConfig('invalid')
      expect(invalidConfig).toBeUndefined()
    })
  })

  describe('Content localization', () => {
    it('should get localized content based on current language', () => {
      const content = {
        title_hu: 'Hungarian Title',
        title_rs: 'Serbian Title',
        title_en: 'English Title'
      }

      i18nService.setCurrentLanguage('hu')
      expect(i18nService.getLocalizedContent(content)).toBe('Hungarian Title')

      i18nService.setCurrentLanguage('en')
      expect(i18nService.getLocalizedContent(content)).toBe('English Title')
    })

    it('should apply Cyrillic conversion for Serbian content', () => {
      const content = {
        title_rs: 'Serbian Title',
        title_hu: 'Hungarian Title'
      }

      i18nService.setCurrentLanguage('rs')
      const result = i18nService.getLocalizedContent(content)

      expect(result).toBe('[CYRILLIC]Serbian Title')
    })

    it('should fallback to fallback language when content not available', () => {
      const content = {
        title_hu: 'Hungarian Title',
        title_en: 'English Title'
        // No title_rs
      }

      i18nService.setCurrentLanguage('rs')
      const result = i18nService.getLocalizedContent(content, 'rs', 'hu')

      expect(result).toBe('Hungarian Title') // Should fallback to Hungarian
    })

    it('should return first available content as last resort', () => {
      const content = {
        description_en: 'English Description'
        // No Hungarian or Serbian content
      }

      i18nService.setCurrentLanguage('rs')
      const result = i18nService.getLocalizedContent(content, 'rs', 'hu')

      expect(result).toBe('English Description')
    })

    it('should return empty string when no content available', () => {
      const content = {}

      const result = i18nService.getLocalizedContent(content)

      expect(result).toBe('')
    })
  })

  describe('Multi-language templates and validation', () => {
    it('should create multi-language template', () => {
      const template = i18nService.createMultiLangTemplate('title', {
        hu: 'Default Hungarian',
        rs: 'Default Serbian'
      })

      expect(template).toEqual({
        title_hu: 'Default Hungarian',
        title_rs: 'Default Serbian',
        title_en: ''
      })
    })

    it('should validate multi-language content', () => {
      const content = {
        title_rs: 'Serbian title',
        title_hu: '', // Missing required
        title_en: 'English title'
      }

      const result = i18nService.validateMultiLangContent(content, ['rs', 'hu'], 'title')

      expect(result.isValid).toBe(false)
      expect(result.missingLanguages).toEqual(['hu'])
    })

    it('should pass validation when all required languages present', () => {
      const content = {
        title_rs: 'Serbian title',
        title_hu: 'Hungarian title',
        title_en: 'English title'
      }

      const result = i18nService.validateMultiLangContent(content, ['rs', 'hu'], 'title')

      expect(result.isValid).toBe(true)
      expect(result.missingLanguages).toEqual([])
    })
  })

  describe('Display name handling', () => {
    it('should get display name based on current language', () => {
      const person = {
        name_hu: 'Hungarian Name',
        name_rs: 'Serbian Name',
        name_en: 'English Name'
      }

      i18nService.setCurrentLanguage('hu')
      expect(i18nService.getDisplayName(person)).toBe('Hungarian Name')

      i18nService.setCurrentLanguage('rs')
      expect(i18nService.getDisplayName(person)).toBe('[CYRILLIC]Serbian Name')

      i18nService.setCurrentLanguage('en')
      expect(i18nService.getDisplayName(person)).toBe('English Name')
    })

    it('should return Unknown when no name available', () => {
      const person = {}

      const result = i18nService.getDisplayName(person)

      expect(result).toBe('Unknown')
    })
  })

  describe('Role translations', () => {
    it('should translate roles correctly', () => {
      expect(i18nService.getRoleTranslation('elnök', 'hu')).toBe('Elnök')
      expect(i18nService.getRoleTranslation('elnök', 'rs')).toBe('Председник')
      expect(i18nService.getRoleTranslation('elnök', 'en')).toBe('President')

      expect(i18nService.getRoleTranslation('alelnök', 'hu')).toBe('Alelnök')
      expect(i18nService.getRoleTranslation('alelnök', 'rs')).toBe('Заменик председника')
      expect(i18nService.getRoleTranslation('alelnök', 'en')).toBe('Vice President')

      expect(i18nService.getRoleTranslation('tag', 'hu')).toBe('Tag')
      expect(i18nService.getRoleTranslation('tag', 'rs')).toBe('Члан')
      expect(i18nService.getRoleTranslation('tag', 'en')).toBe('Member')
    })

    it('should handle role precedence correctly (alelnök before elnök)', () => {
      // This tests that "alelnök" doesn't get matched as "elnök"
      expect(i18nService.getRoleTranslation('alelnök', 'rs')).toBe('Заменик председника')
      expect(i18nService.getRoleTranslation('alelnök', 'rs')).not.toBe('Председник')
    })

    it('should return original role if not found', () => {
      expect(i18nService.getRoleTranslation('unknown-role', 'hu')).toBe('unknown-role')
    })
  })

  describe('Formatting utilities', () => {
    it('should format dates according to locale', () => {
      const date = new Date('2023-12-25')

      const huFormatted = i18nService.formatDate(date, 'hu')
      const rsFormatted = i18nService.formatDate(date, 'rs')
      const enFormatted = i18nService.formatDate(date, 'en')

      // These will depend on the browser's Intl implementation
      expect(typeof huFormatted).toBe('string')
      expect(typeof rsFormatted).toBe('string')
      expect(typeof enFormatted).toBe('string')
      expect(huFormatted).toContain('2023')
      expect(huFormatted).toContain('25')
    })

    it('should format numbers according to locale', () => {
      const number = 1234567.89

      const huFormatted = i18nService.formatNumber(number, 'hu')
      const rsFormatted = i18nService.formatNumber(number, 'rs')
      const enFormatted = i18nService.formatNumber(number, 'en')

      expect(typeof huFormatted).toBe('string')
      expect(typeof rsFormatted).toBe('string')
      expect(typeof enFormatted).toBe('string')
    })
  })

  describe('Content analysis', () => {
    it('should get available languages from content', () => {
      const content = {
        title_hu: 'Hungarian Title',
        title_rs: 'Serbian Title', // Not empty now
        title_en: 'English Title'
      }

      const available = i18nService.getAvailableLanguages(content)

      expect(available).toContain('hu') // Has title_hu
      expect(available).toContain('en') // Has title_en
      expect(available).toContain('rs') // Has title_rs
    })

    it('should not include languages with empty content', () => {
      const content = {
        title_hu: 'Hungarian Title',
        title_rs: '', // Empty, should not be counted
        title_en: 'English Title'
      }

      const available = i18nService.getAvailableLanguages(content)

      expect(available).toContain('hu')
      expect(available).toContain('en')
      expect(available).not.toContain('rs') // Empty content
    })

    it('should calculate content completeness', () => {
      const content = {
        title_hu: 'Hungarian Title',
        description_hu: '', // Missing
        title_rs: 'Serbian Title',
        description_rs: 'Serbian Description',
        title_en: '', // Missing
        description_en: '' // Missing
      }

      const completeness = i18nService.getContentCompleteness(content)

      expect(completeness.hu).toBe(50) // 1 out of 2 fields filled
      expect(completeness.rs).toBe(100) // 2 out of 2 fields filled
      expect(completeness.en).toBe(0) // 0 out of 2 fields filled
    })
  })

  describe('Language direction', () => {
    it('should return LTR for all supported languages', () => {
      expect(i18nService.getLanguageDirection('hu')).toBe('ltr')
      expect(i18nService.getLanguageDirection('rs')).toBe('ltr')
      expect(i18nService.getLanguageDirection('en')).toBe('ltr')
    })
  })
})