import { storage, config } from '@/appwrite'

export type GalleryLayer = 'tiny' | 'thumb' | 'cover' | 'medium' | 'full'

export const GALLERY_LAYERS: Record<Exclude<GalleryLayer, 'full'>, { width: number; quality: number }> = {
  tiny: { width: 72, quality: 30 },
  thumb: { width: 360, quality: 62 },
  cover: { width: 420, quality: 65 },
  medium: { width: 1200, quality: 70 }
}

export function asFileUrl(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (value instanceof URL) return value.toString()
  if (typeof (value as { href?: unknown }).href === 'string') {
    return (value as { href: string }).href
  }
  if (typeof (value as { toString?: () => string }).toString === 'function') {
    const text = (value as { toString: () => string }).toString()
    return text === '[object Object]' ? '' : text
  }
  return ''
}

export function withCacheBust(url: string): string {
  if (!url) return ''
  const glue = url.includes('?') ? '&' : '?'
  return `${url}${glue}retry=${Date.now()}`
}

export function galleryPreviewUrl(imageId: string, width: number, quality: number): string {
  if (!imageId) return ''
  try {
    return asFileUrl(
      storage.getFilePreview({
        bucketId: config.gallery_pictures_storage,
        fileId: imageId,
        width,
        quality
      })
    )
  } catch {
    return ''
  }
}

export function galleryFullUrl(imageId: string): string {
  if (!imageId) return ''
  try {
    return asFileUrl(
      storage.getFileView({
        bucketId: config.gallery_pictures_storage,
        fileId: imageId
      })
    )
  } catch {
    return ''
  }
}

export function galleryLayerUrl(imageId: string, layer: GalleryLayer): string {
  if (!imageId) return ''
  if (layer === 'full') return galleryFullUrl(imageId)
  const spec = GALLERY_LAYERS[layer]
  return galleryPreviewUrl(imageId, spec.width, spec.quality) || galleryFullUrl(imageId)
}

export function galleryLayers(imageId: string) {
  return {
    tiny: galleryLayerUrl(imageId, 'tiny'),
    thumb: galleryLayerUrl(imageId, 'thumb'),
    cover: galleryLayerUrl(imageId, 'cover'),
    medium: galleryLayerUrl(imageId, 'medium'),
    full: galleryFullUrl(imageId)
  }
}

/** @deprecated Prefer galleryLayerUrl(id, 'thumb') — kept for existing callers. */
export function galleryThumbUrl(imageId: string, width = GALLERY_LAYERS.thumb.width): string {
  const quality = width <= 80 ? 30 : width <= 420 ? 62 : 70
  return galleryPreviewUrl(imageId, width, quality) || galleryFullUrl(imageId)
}
