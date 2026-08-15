import { describe, expect, it } from 'vitest'
import { groupApprovalQueue, type ApprovalAlbum, type PendingImage } from '@/services/gallery/approval'

const albums: ApprovalAlbum[] = [
  {
    id: 'a1',
    titleHu: 'Ballagás',
    titleRs: 'Matura',
    titleEn: 'Graduation',
    visible: false,
    defaultImage: '',
    pending: [],
    deleteRequested: []
  }
]

const images: PendingImage[] = [
  { id: 'i1', imageId: 'f1', galleryId: 'a1', status: 'pending', createdAt: '2026-08-14', preview: '' },
  { id: 'i2', imageId: 'f2', galleryId: 'a1', status: 'delete_requested', createdAt: '2026-08-14', preview: '' },
  { id: 'i3', imageId: 'f3', galleryId: 'missing', status: 'pending', createdAt: '2026-08-14', preview: '' }
]

describe('gallery approval queue', () => {
  it('groups pending and delete requests by album', () => {
    const queue = groupApprovalQueue(albums, images)
    expect(queue).toHaveLength(2)

    const known = queue.find((album) => album.id === 'a1')
    expect(known?.pending).toHaveLength(1)
    expect(known?.deleteRequested).toHaveLength(1)

    const orphan = queue.find((album) => album.id === 'missing')
    expect(orphan?.pending.map((image) => image.id)).toEqual(['i3'])
  })

  it('hides albums with nothing to review', () => {
    const queue = groupApprovalQueue(albums, [])
    expect(queue).toHaveLength(0)
  })
})
