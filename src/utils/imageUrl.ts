/**
 * Appwrite Storage image URL helpers — prefer resized WebP previews over full /view.
 * Full-size originals are fine for downloads / lightbox; lists & cards should use thumbs.
 */

const ENDPOINT = 'https://appwrite.tsada.edu.rs/v1'
const PROJECT = '659ea7f886cf55d4528a'

export type ImageGravity =
  | 'center'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'

export interface ImagePreviewOptions {
  width?: number
  height?: number
  quality?: number
  gravity?: ImageGravity
  output?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif' | 'heic' | 'avif'
}

/**
 * Build a CDN-style preview URL without requiring the Appwrite SDK instance.
 * Useful in templates and static helpers.
 */
export function buildImagePreviewUrl(
  bucketId: string,
  fileId: string,
  options: ImagePreviewOptions = {}
): string {
  if (!fileId || !bucketId) return ''

  const {
    width = 400,
    height = 0,
    quality = 80,
    gravity = 'center',
    output = 'webp'
  } = options

  const params = new URLSearchParams({
    project: PROJECT,
    width: String(width),
    quality: String(quality),
    gravity,
    output
  })
  if (height > 0) params.set('height', String(height))

  return `${ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/preview?${params.toString()}`
}

/** Full original file (no resize) — use sparingly */
export function buildImageViewUrl(bucketId: string, fileId: string): string {
  if (!fileId || !bucketId) return ''
  return `${ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${PROJECT}`
}

/** Common sizes for lists / cards / avatars */
export const IMAGE_SIZES = {
  avatar: { width: 96, height: 96, quality: 75 },
  thumb: { width: 320, height: 240, quality: 80 },
  card: { width: 640, height: 400, quality: 82 },
  hero: { width: 1280, height: 0, quality: 85 },
  lightbox: { width: 1920, height: 0, quality: 90 }
} as const

export function avatarUrl(bucketId: string, fileId: string): string {
  return buildImagePreviewUrl(bucketId, fileId, IMAGE_SIZES.avatar)
}

export function cardImageUrl(bucketId: string, fileId: string): string {
  return buildImagePreviewUrl(bucketId, fileId, IMAGE_SIZES.card)
}

export function thumbUrl(bucketId: string, fileId: string): string {
  return buildImagePreviewUrl(bucketId, fileId, IMAGE_SIZES.thumb)
}
