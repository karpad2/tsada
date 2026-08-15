import { ID, Permission, Role, Storage } from 'appwrite'
import { appw, config } from '@/appwrite'

const MAX_BYTES = 15 * 1024 * 1024

export function pickUploadFile(value: unknown): File | null {
  if (value instanceof File) return value
  if (Array.isArray(value)) {
    const first = value.find((item) => item instanceof File)
    return first instanceof File ? first : null
  }
  if (value && typeof value === 'object' && 'target' in value) {
    const files = (value as Event & { target?: { files?: FileList } }).target?.files
    if (files?.[0] instanceof File) return files[0]
  }
  return null
}

export function isAllowedErasmusFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === 'application/pdf' ||
    name.endsWith('.pdf') ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  )
}

export function erasmusUploadErrorKey(error: unknown): string {
  const code = (error as { code?: number; message?: string })?.code
  const message = String((error as { message?: string })?.message || '')
  if (message === 'erasmus_pdf_only') return 'erasmus_pdf_only'
  if (message === 'erasmus_file_too_large') return 'erasmus_file_too_large'
  if (code === 401 || code === 403) return 'erasmus_upload_forbidden'
  return 'error_uploading_file'
}

export async function uploadErasmusDocument(file: File): Promise<string> {
  if (!isAllowedErasmusFile(file)) throw new Error('erasmus_pdf_only')
  if (file.size > MAX_BYTES) throw new Error('erasmus_file_too_large')

  const storage = new Storage(appw)
  const payload = {
    bucketId: config.fs_erasmus,
    fileId: ID.unique(),
    file
  }

  try {
    const created = await storage.createFile({
      ...payload,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    })
    return created.$id
  } catch (error: any) {
    if (error?.code === 401 || error?.code === 403) throw error
    const created = await storage.createFile(payload)
    return created.$id
  }
}

export function asViewUrl(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof URL) return value.toString()
  if (typeof (value as { href?: string }).href === 'string') return (value as { href: string }).href
  if (typeof (value as { toString?: () => string }).toString === 'function') {
    const text = (value as { toString: () => string }).toString()
    return text === '[object Object]' ? '' : text
  }
  return ''
}
