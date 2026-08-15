import { Query } from 'appwrite'
import { config, listAllDocuments, databases, storage } from '@/appwrite'
import { galleryThumbUrl } from '@/services/gallery/imageUrl'

export type ImageStatus = 'pending' | 'approved' | 'delete_requested'

export interface PendingImage {
  id: string
  imageId: string
  galleryId: string
  status: ImageStatus
  createdAt: string
  preview: string
}

export interface ApprovalAlbum {
  id: string
  titleHu: string
  titleRs: string
  titleEn: string
  visible: boolean
  defaultImage: string
  pending: PendingImage[]
  deleteRequested: PendingImage[]
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function previewUrl(imageId: string): string {
  return galleryThumbUrl(imageId, 400)
}

function mapImage(doc: Record<string, any>): PendingImage {
  const status = (doc.status || 'approved') as ImageStatus
  return {
    id: doc.$id,
    imageId: asText(doc.image_id),
    galleryId: typeof doc.gallery === 'string' ? doc.gallery : doc.gallery?.$id || '',
    status,
    createdAt: doc.$createdAt,
    preview: previewUrl(asText(doc.image_id))
  }
}

export function albumTitle(album: ApprovalAlbum, locale: string): string {
  if (locale === 'en') return album.titleEn || album.titleHu || album.titleRs || album.id
  if (locale === 'hu') return album.titleHu || album.titleRs || album.titleEn || album.id
  return album.titleRs || album.titleHu || album.titleEn || album.id
}

export function groupApprovalQueue(
  albums: ApprovalAlbum[],
  images: PendingImage[]
): ApprovalAlbum[] {
  const map = new Map(albums.map((album) => [album.id, { ...album, pending: [], deleteRequested: [] }]))

  images.forEach((image) => {
    const album = map.get(image.galleryId)
    if (!album) {
      const orphan: ApprovalAlbum = {
        id: image.galleryId || 'unknown',
        titleHu: '',
        titleRs: '',
        titleEn: '',
        visible: false,
        defaultImage: '',
        pending: [],
        deleteRequested: []
      }
      if (image.status === 'delete_requested') orphan.deleteRequested.push(image)
      else orphan.pending.push(image)
      map.set(orphan.id, orphan)
      return
    }
    if (image.status === 'delete_requested') album.deleteRequested.push(image)
    else album.pending.push(image)
  })

  return Array.from(map.values())
    .filter((album) => album.pending.length || album.deleteRequested.length)
    .sort((a, b) => b.pending.length - a.pending.length)
}

export async function loadApprovalQueue(): Promise<{ albums: ApprovalAlbum[]; failed: boolean }> {
  try {
    const [galleryResult, pendingResult, deleteResult] = await Promise.all([
      listAllDocuments(config.website_db, config.gallery),
      listAllDocuments(config.website_db, config.album_images, [Query.equal('status', 'pending')]),
      listAllDocuments(config.website_db, config.album_images, [Query.equal('status', 'delete_requested')])
    ])

    const albums: ApprovalAlbum[] = galleryResult.documents.map((doc) => ({
      id: doc.$id,
      titleHu: asText(doc.title_hu),
      titleRs: asText(doc.title_rs),
      titleEn: asText(doc.title_en),
      visible: Boolean(doc.visible),
      defaultImage: asText(doc.default_image),
      pending: [],
      deleteRequested: []
    }))

    const images = [...pendingResult.documents, ...deleteResult.documents].map(mapImage)
    return { albums: groupApprovalQueue(albums, images), failed: false }
  } catch (error) {
    console.error('Failed to load gallery approval queue:', error)
    return { albums: [], failed: true }
  }
}

export async function countPendingImages(): Promise<number | null> {
  try {
    const result = await databases.listDocuments(config.website_db, config.album_images, [
      Query.equal('status', 'pending'),
      Query.limit(1)
    ])
    return result.total
  } catch {
    return null
  }
}

export async function setImageStatus(imageDocId: string, status: ImageStatus): Promise<void> {
  await databases.updateDocument(config.website_db, config.album_images, imageDocId, { status })
}

export async function rejectImage(imageDocId: string, fileId: string): Promise<void> {
  try {
    if (fileId) await storage.deleteFile(config.gallery_pictures_storage, fileId)
  } catch (error) {
    console.error('Failed to delete gallery file:', error)
  }
  await databases.deleteDocument(config.website_db, config.album_images, imageDocId)
}

export async function publishAlbum(album: ApprovalAlbum, firstApprovedImageId?: string): Promise<void> {
  const defaultImage = album.defaultImage || firstApprovedImageId || album.pending[0]?.imageId || ''
  await databases.updateDocument(config.website_db, config.gallery, album.id, {
    visible: true,
    default_image: defaultImage
  })
}

export async function approveAlbumImages(album: ApprovalAlbum): Promise<void> {
  await Promise.all(album.pending.map((image) => setImageStatus(image.id, 'approved')))
}


