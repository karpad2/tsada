export const MESSAGE_MAX = 255
export const NAME_MAX = 40

export function extractMessageBody(doc: Record<string, any> | null | undefined): string {
  if (!doc) return ''
  const preferred = ['message', 'text', 'content', 'body', 'msg']
  for (const key of preferred) {
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith('$')) continue
    if (key === 'name' || key === 'email') continue
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

export function clip(value: string, max: number): string {
  return (value || '').trim().slice(0, max)
}
