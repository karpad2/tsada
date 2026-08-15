import { describe, expect, it, vi } from 'vitest'
import {
  asFileUrl,
  galleryFullUrl,
  galleryLayerUrl,
  galleryLayers,
  galleryThumbUrl,
  withCacheBust
} from '@/services/gallery/imageUrl'
import { galleryConcurrency, prefetchImage, resetGalleryLoadQueue } from '@/services/gallery/loadQueue'

vi.mock('@/appwrite', () => ({
  storage: {
    getFilePreview: vi.fn((params: { fileId: string; width?: number; quality?: number }) =>
      `https://files.test/preview/${params.fileId}?width=${params.width ?? ''}&quality=${params.quality ?? ''}`
    ),
    getFileView: vi.fn((params: { fileId: string }) => `https://files.test/view/${params.fileId}`)
  },
  config: {
    gallery_pictures_storage: 'gallery-bucket'
  }
}))

describe('gallery image urls', () => {
  it('stringifies URL objects and ignores empty values', () => {
    expect(asFileUrl('')).toBe('')
    expect(asFileUrl(null)).toBe('')
    expect(asFileUrl(new URL('https://files.test/a.jpg'))).toBe('https://files.test/a.jpg')
    expect(asFileUrl({ href: 'https://files.test/b.jpg' })).toBe('https://files.test/b.jpg')
    expect(asFileUrl({ toString: () => '[object Object]' })).toBe('')
  })

  it('builds separate tiny / thumb / medium / original layers', () => {
    expect(galleryLayerUrl('', 'thumb')).toBe('')
    expect(galleryLayerUrl('img-1', 'tiny')).toBe('https://files.test/preview/img-1?width=72&quality=30')
    expect(galleryLayerUrl('img-1', 'thumb')).toBe('https://files.test/preview/img-1?width=360&quality=62')
    expect(galleryLayerUrl('img-1', 'medium')).toBe('https://files.test/preview/img-1?width=1200&quality=70')
    expect(galleryFullUrl('img-1')).toBe('https://files.test/view/img-1')
    expect(galleryLayers('img-1').tiny).toContain('width=72')
    expect(galleryThumbUrl('img-1')).toContain('width=360')
  })

  it('adds a cache-busting query for retries', () => {
    const next = withCacheBust('https://files.test/view/img-1')
    expect(next).toMatch(/^https:\/\/files\.test\/view\/img-1\?retry=\d+$/)
    expect(withCacheBust('https://files.test/a?x=1')).toMatch(/&retry=\d+$/)
  })
})

describe('gallery load queue', () => {
  it('caps parallel downloads on slow connections', () => {
    const original = (navigator as any).connection
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '2g', saveData: false }
    })
    expect(galleryConcurrency()).toBe(2)
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: original
    })
  })

  it('dedupes in-flight prefetch of the same url', async () => {
    resetGalleryLoadQueue()
    class FakeImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      set src(_url: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    const original = globalThis.Image
    // @ts-expect-error test stub
    globalThis.Image = FakeImage
    try {
      const a = prefetchImage('https://files.test/a.jpg')
      const b = prefetchImage('https://files.test/a.jpg')
      expect(a).toBe(b)
      await expect(a).resolves.toBe(true)
    } finally {
      globalThis.Image = original
      resetGalleryLoadQueue()
    }
  })
})
