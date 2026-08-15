import { describe, expect, it } from 'vitest'
import { erasmusUploadErrorKey, isAllowedErasmusFile, pickUploadFile } from '@/services/erasmus/upload'

describe('erasmus upload helpers', () => {
  it('picks a File from v-file-input values', () => {
    const file = new File(['%PDF'], 'letter.pdf', { type: 'application/pdf' })
    expect(pickUploadFile(file)).toBe(file)
    expect(pickUploadFile([file])).toBe(file)
    expect(pickUploadFile(null)).toBeNull()
    expect(pickUploadFile([])).toBeNull()
  })

  it('accepts pdf and office documents even if the mime type is empty', () => {
    expect(isAllowedErasmusFile(new File(['x'], 'a.pdf', { type: '' }))).toBe(true)
    expect(isAllowedErasmusFile(new File(['x'], 'a.docx', { type: '' }))).toBe(true)
    expect(isAllowedErasmusFile(new File(['x'], 'a.exe', { type: '' }))).toBe(false)
  })

  it('maps upload failures to i18n keys', () => {
    expect(erasmusUploadErrorKey(new Error('erasmus_pdf_only'))).toBe('erasmus_pdf_only')
    expect(erasmusUploadErrorKey({ code: 401 })).toBe('erasmus_upload_forbidden')
    expect(erasmusUploadErrorKey({ code: 500 })).toBe('error_uploading_file')
  })
})
