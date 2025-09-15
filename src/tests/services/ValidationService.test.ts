import { describe, it, expect, beforeEach } from 'vitest'
import { ValidationService } from '@/services/validation/ValidationService'

describe('ValidationService', () => {
  let validationService: ValidationService

  beforeEach(() => {
    validationService = ValidationService.getInstance()
  })

  describe('Basic validation', () => {
    it('should validate required fields', () => {
      const data = { name: '', email: 'test@example.com' }
      const rules = [
        { field: 'name', rules: [{ type: 'required' as const }] },
        { field: 'email', rules: [{ type: 'required' as const }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].message).toContain('required')
    })

    it('should validate minimum length', () => {
      const data = { password: '123' }
      const rules = [
        { field: 'password', rules: [{ type: 'minLength' as const, value: 6 }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('at least 6 characters')
    })

    it('should validate maximum length', () => {
      const data = { username: 'verylongusernamethatexceedslimit' }
      const rules = [
        { field: 'username', rules: [{ type: 'maxLength' as const, value: 10 }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('not exceed 10 characters')
    })

    it('should validate email format', () => {
      const data = { email: 'invalid-email' }
      const rules = [
        { field: 'email', rules: [{ type: 'email' as const }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('valid email')
    })

    it('should validate URL format', () => {
      const data = { website: 'not-a-url' }
      const rules = [
        { field: 'website', rules: [{ type: 'url' as const }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('valid URL')
    })

    it('should validate with custom validator', () => {
      const data = { age: 15 }
      const rules = [
        {
          field: 'age',
          rules: [{
            type: 'custom' as const,
            validator: (value: number) => value >= 18,
            message: 'Must be 18 or older'
          }]
        }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toBe('Must be 18 or older')
    })
  })

  describe('File validation', () => {
    it('should validate file size', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 1000000, writable: false }) // 1MB

      const result = validationService.validateFile(file, { maxSize: 500000 }) // 500KB

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('size must not exceed')
    })

    it('should validate file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = validationService.validateFile(file, {
        allowedTypes: ['image/jpeg', 'image/png']
      })

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('File type must be one of')
    })

    it('should validate file extension', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = validationService.validateFile(file, {
        allowedExtensions: ['jpg', 'png']
      })

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('File extension must be one of')
    })

    it('should pass file validation when valid', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 100000, writable: false }) // 100KB

      const result = validationService.validateFile(file, {
        maxSize: 500000,
        allowedTypes: ['image/jpeg'],
        allowedExtensions: ['jpg']
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Multi-language validation', () => {
    it('should validate required languages', () => {
      const data = {
        title_rs: 'Serbian title',
        title_hu: '',
        title_en: 'English title'
      }

      const result = validationService.validateMultiLanguageContent(
        data,
        ['rs', 'hu'],
        'title_'
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('title_hu')
      expect(result.errors[0].message).toContain('HU is required')
    })

    it('should pass when all required languages are provided', () => {
      const data = {
        title_rs: 'Serbian title',
        title_hu: 'Hungarian title',
        title_en: 'English title'
      }

      const result = validationService.validateMultiLanguageContent(
        data,
        ['rs', 'hu'],
        'title_'
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Complex validation scenarios', () => {
    it('should validate multiple rules on single field', () => {
      const data = { password: 'abc' }
      const rules = [
        {
          field: 'password',
          rules: [
            { type: 'required' as const },
            { type: 'minLength' as const, value: 6 }
          ]
        }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      // Should have at least the minLength error
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate all fields in form', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        age: 15,
        website: 'https://valid-site.com'
      }

      const rules = [
        { field: 'name', rules: [{ type: 'required' as const }] },
        { field: 'email', rules: [{ type: 'email' as const }] },
        {
          field: 'age',
          rules: [{
            type: 'custom' as const,
            validator: (value: number) => value >= 18
          }]
        },
        { field: 'website', rules: [{ type: 'url' as const }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3) // name, email, age should fail
    })

    it('should pass when all validations succeed', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        website: 'https://johndoe.com'
      }

      const rules = [
        { field: 'name', rules: [{ type: 'required' as const }] },
        { field: 'email', rules: [{ type: 'email' as const }] },
        {
          field: 'age',
          rules: [{
            type: 'custom' as const,
            validator: (value: number) => value >= 18
          }]
        },
        { field: 'website', rules: [{ type: 'url' as const }] }
      ]

      const result = validationService.validate(data, rules)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('ValidationService.createRules helper', () => {
    it('should create validation rules with helper methods', () => {
      const rules = ValidationService.createRules()

      const requiredRule = rules.required('name', 'Name is mandatory')
      expect(requiredRule).toEqual({
        field: 'name',
        rules: [{ type: 'required', message: 'Name is mandatory' }]
      })

      const emailRule = rules.email('email', 'Please enter valid email')
      expect(emailRule).toEqual({
        field: 'email',
        rules: [{ type: 'email', message: 'Please enter valid email' }]
      })

      const minLengthRule = rules.minLength('password', 8, 'Too short')
      expect(minLengthRule).toEqual({
        field: 'password',
        rules: [{ type: 'minLength', value: 8, message: 'Too short' }]
      })
    })
  })
})