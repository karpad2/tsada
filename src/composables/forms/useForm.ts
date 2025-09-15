import { ref, computed, reactive, watch } from 'vue'
import { validationService, type ValidationRule, type ValidationResult } from '@/services'

export interface FormField<T = any> {
  value: T
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface FormOptions<T> {
  initialValues: T
  validationRules?: ValidationRule[]
  validateOnChange?: boolean
  validateOnBlur?: boolean
  resetAfterSubmit?: boolean
}

export function useForm<T extends Record<string, any>>(options: FormOptions<T>) {
  const {
    initialValues,
    validationRules = [],
    validateOnChange = true,
    validateOnBlur = true,
    resetAfterSubmit = false
  } = options

  // Create reactive form state
  const formData = reactive<T>({ ...initialValues })

  // Create field state tracking
  const fields = reactive<Record<keyof T, FormField>>(
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false
      }
      return acc
    }, {} as Record<keyof T, FormField>)
  )

  const isSubmitting = ref(false)
  const hasBeenSubmitted = ref(false)
  const submitError = ref<string | null>(null)

  // Computed properties
  const isValid = computed(() => {
    return Object.values(fields).every(field => !field.error)
  })

  const isDirty = computed(() => {
    return Object.values(fields).some(field => field.dirty)
  })

  const touchedFields = computed(() => {
    return Object.keys(fields).filter(key => fields[key as keyof T].touched) as (keyof T)[]
  })

  const errors = computed(() => {
    const errorObj: Partial<Record<keyof T, string>> = {}

    Object.keys(fields).forEach(key => {
      const field = fields[key as keyof T]
      if (field.error) {
        errorObj[key as keyof T] = field.error
      }
    })

    return errorObj
  })

  const hasErrors = computed(() => {
    return Object.keys(errors.value).length > 0
  })

  // Watch for form data changes
  Object.keys(initialValues).forEach(key => {
    watch(
      () => formData[key],
      (newValue, oldValue) => {
        const field = fields[key as keyof T]

        // Update field value
        field.value = newValue

        // Mark as dirty if value changed from initial
        field.dirty = newValue !== initialValues[key]

        // Validate on change if enabled
        if (validateOnChange && field.touched) {
          validateField(key as keyof T)
        }
      },
      { deep: true }
    )
  })

  // Methods
  const validateField = (fieldName: keyof T): boolean => {
    const fieldRules = validationRules.filter(rule => rule.field === fieldName)

    if (fieldRules.length === 0) {
      fields[fieldName].error = null
      return true
    }

    const validation = validationService.validate(
      { [fieldName]: formData[fieldName] },
      fieldRules
    )

    fields[fieldName].error = validation.errors[0]?.message || null

    return validation.isValid
  }

  const validateForm = (): ValidationResult => {
    const validation = validationService.validate(formData, validationRules)

    // Update field errors
    Object.keys(fields).forEach(key => {
      const fieldError = validation.errors.find(error => error.field === key)
      fields[key as keyof T].error = fieldError?.message || null
    })

    return validation
  }

  const setFieldValue = (fieldName: keyof T, value: any) => {
    formData[fieldName] = value
  }

  const setFieldError = (fieldName: keyof T, error: string | null) => {
    fields[fieldName].error = error
  }

  const setFieldTouched = (fieldName: keyof T, touched = true) => {
    fields[fieldName].touched = touched

    // Validate on blur if enabled
    if (validateOnBlur && touched) {
      validateField(fieldName)
    }
  }

  const setFormValues = (values: Partial<T>) => {
    Object.keys(values).forEach(key => {
      if (key in formData) {
        formData[key as keyof T] = values[key as keyof T]!
      }
    })
  }

  const setFormErrors = (errors: Partial<Record<keyof T, string>>) => {
    Object.keys(errors).forEach(key => {
      if (key in fields) {
        fields[key as keyof T].error = errors[key as keyof T] || null
      }
    })
  }

  const resetForm = () => {
    // Reset form data
    Object.keys(initialValues).forEach(key => {
      formData[key as keyof T] = initialValues[key as keyof T]
    })

    // Reset field state
    Object.keys(fields).forEach(key => {
      const field = fields[key as keyof T]
      field.value = initialValues[key as keyof T]
      field.error = null
      field.touched = false
      field.dirty = false
    })

    // Reset form state
    isSubmitting.value = false
    hasBeenSubmitted.value = false
    submitError.value = null
  }

  const clearErrors = () => {
    Object.keys(fields).forEach(key => {
      fields[key as keyof T].error = null
    })
    submitError.value = null
  }

  const touchAllFields = () => {
    Object.keys(fields).forEach(key => {
      fields[key as keyof T].touched = true
    })
  }

  const handleSubmit = async (
    onSubmit: (formData: T) => Promise<void> | void,
    onError?: (error: any) => void
  ) => {
    if (isSubmitting.value) return

    isSubmitting.value = true
    hasBeenSubmitted.value = true
    submitError.value = null

    try {
      // Touch all fields to show validation errors
      touchAllFields()

      // Validate form
      const validation = validateForm()

      if (!validation.isValid) {
        isSubmitting.value = false
        return
      }

      // Execute submit handler
      await onSubmit(formData)

      // Reset form if option is enabled
      if (resetAfterSubmit) {
        resetForm()
      }
    } catch (error: any) {
      submitError.value = error.message || 'Submission failed'

      if (onError) {
        onError(error)
      }
    } finally {
      isSubmitting.value = false
    }
  }

  // Field helper functions
  const getFieldProps = (fieldName: keyof T) => {
    return {
      value: formData[fieldName],
      error: fields[fieldName].error,
      touched: fields[fieldName].touched,
      dirty: fields[fieldName].dirty,
      onChange: (value: any) => setFieldValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName),
      onFocus: () => setFieldTouched(fieldName, false)
    }
  }

  const getFieldError = (fieldName: keyof T): string | null => {
    return fields[fieldName].error
  }

  const isFieldValid = (fieldName: keyof T): boolean => {
    return !fields[fieldName].error
  }

  const isFieldDirty = (fieldName: keyof T): boolean => {
    return fields[fieldName].dirty
  }

  const isFieldTouched = (fieldName: keyof T): boolean => {
    return fields[fieldName].touched
  }

  return {
    // Form data
    formData,
    fields,

    // State
    isSubmitting,
    hasBeenSubmitted,
    submitError,

    // Computed
    isValid,
    isDirty,
    touchedFields,
    errors,
    hasErrors,

    // Methods
    validateField,
    validateForm,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setFormValues,
    setFormErrors,
    resetForm,
    clearErrors,
    touchAllFields,
    handleSubmit,

    // Field helpers
    getFieldProps,
    getFieldError,
    isFieldValid,
    isFieldDirty,
    isFieldTouched
  }
}