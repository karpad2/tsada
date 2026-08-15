type QueueTask = {
  url: string
  resolve: (ok: boolean) => void
}

const pending = new Map<string, Promise<boolean>>()
const queue: QueueTask[] = []
let active = 0

export function galleryConcurrency(): number {
  if (typeof navigator === 'undefined') return 3
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (conn?.saveData) return 2
  const type = conn?.effectiveType
  if (type === 'slow-2g' || type === '2g') return 2
  if (type === '3g') return 3
  return 4
}

function drain() {
  const limit = galleryConcurrency()
  while (active < limit && queue.length) {
    const task = queue.shift()
    if (!task) return
    active += 1
    const img = new Image()
    const finish = (ok: boolean) => {
      active = Math.max(0, active - 1)
      task.resolve(ok)
      drain()
    }
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.src = task.url
  }
}

/** Decode one URL with a small parallel cap so school wifi is not flooded. */
export function prefetchImage(url: string): Promise<boolean> {
  if (!url || typeof Image === 'undefined') return Promise.resolve(false)
  const existing = pending.get(url)
  if (existing) return existing

  const promise = new Promise<boolean>((resolve) => {
    queue.push({ url, resolve })
    drain()
  }).finally(() => {
    pending.delete(url)
  })

  pending.set(url, promise)
  return promise
}

export function prefetchImages(urls: Array<string | undefined | null>): void {
  urls.forEach((url) => {
    if (url) void prefetchImage(url)
  })
}

export function resetGalleryLoadQueue() {
  queue.length = 0
  pending.clear()
  active = 0
}
