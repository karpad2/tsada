export interface ValidationRule {
  field: string
  rules: Array<{
    type: 'required' | 'minLength' | 'maxLength' | 'email' | 'url' | 'custom'
    value?: any
    message?: string
    validator?: (value: any) => boolean
  }>
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Universal validation service
 */
export class ValidationService {
  private static instance: ValidationService

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService()
    }
    return ValidationService.instance
  }

  /**
   * Validate data against rules
   */
  validate(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = []

    for (const rule of rules) {
      const fieldValue = data[rule.field]
      const fieldErrors = this.validateField(fieldValue, rule)
      errors.push(...fieldErrors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate single field
   */
  validateField(value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = []

    for (const validator of rule.rules) {
      const error = this.applyValidationRule(value, rule.field, validator)
      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  /**
   * Apply single validation rule
   */
  private applyValidationRule(
    value: any,
    fieldName: string,
    rule: ValidationRule['rules'][0]
  ): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && !value.trim())) {
          return {
            field: fieldName,
            message: rule.message || `${fieldName} is required`
          }
        }
        break

      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value || 0)) {
          return {
            field: fieldName,
            message: rule.message || `${fieldName} must be at least ${rule.value} characters`
          }
        }
        break

      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value || 0)) {
          return {
            field: fieldName,
            message: rule.message || `${fieldName} must not exceed ${rule.value} characters`
          }
        }
        break

      case 'email':
        if (value && !this.isValidEmail(value)) {
          return {
            field: fieldName,
            message: rule.message || `${fieldName} must be a valid email address`
          }
        }
        break

      case 'url':
        if (value && !this.isValidUrl(value)) {
          return {
            field: fieldName,
            message: rule.message || `${fieldName} must be a valid URL`
          }
        }
        break

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return {
            field: fieldName,
            message: rule.message || `${fieldName} is invalid`
          }
        }
        break
    }

    return null
  }

  /**
   * Email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * URL validation
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate file upload
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number // in bytes
      allowedTypes?: string[]
      allowedExtensions?: string[]
    } = {}
  ): ValidationResult {
    const errors: ValidationError[] = []

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      errors.push({
        field: 'file',
        message: `File size must not exceed ${this.formatFileSize(options.maxSize)}`
      })
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        message: `File type must be one of: ${options.allowedTypes.join(', ')}`
      })
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push({
          field: 'file',
          message: `File extension must be one of: ${options.allowedExtensions.join(', ')}`
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate multi-language content
   */
  validateMultiLanguageContent(
    data: Record<string, any>,
    requiredLanguages: string[] = ['rs'],
    fieldPrefix = ''
  ): ValidationResult {
    const errors: ValidationError[] = []

    for (const lang of requiredLanguages) {
      const fieldName = `${fieldPrefix}${lang}`
      const value = data[fieldName]

      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push({
          field: fieldName,
          message: `Content in ${lang.toUpperCase()} is required`
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Create common validation rules
   */
  static createRules() {
    return {
      required: (field: string, message?: string): ValidationRule => ({
        field,
        rules: [{ type: 'required', message }]
      }),

      email: (field: string, message?: string): ValidationRule => ({
        field,
        rules: [{ type: 'email', message }]
      }),

      minLength: (field: string, length: number, message?: string): ValidationRule => ({
        field,
        rules: [{ type: 'minLength', value: length, message }]
      }),

      maxLength: (field: string, length: number, message?: string): ValidationRule => ({
        field,
        rules: [{ type: 'maxLength', value: length, message }]
      }),

      custom: (field: string, validator: (value: any) => boolean, message?: string): ValidationRule => ({
        field,
        rules: [{ type: 'custom', validator, message }]
      })
    }
  }
}