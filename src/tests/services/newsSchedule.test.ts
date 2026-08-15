import { describe, expect, it } from 'vitest'
import { isNewsLive } from '@/services/content/newsSchedule'

describe('news schedule', () => {
  const now = new Date('2026-08-14T10:00:00')

  it('hides invisible news', () => {
    expect(isNewsLive('1', false, {}, now)).toBe(false)
  })

  it('shows visible news without a window', () => {
    expect(isNewsLive('1', true, {}, now)).toBe(true)
  })

  it('hides news before the start', () => {
    expect(isNewsLive('1', true, { '1': { from: '2026-08-20T08:00' } }, now)).toBe(false)
  })

  it('hides news after the end', () => {
    expect(isNewsLive('1', true, { '1': { until: '2026-08-01T08:00' } }, now)).toBe(false)
  })

  it('shows news inside the window', () => {
    expect(isNewsLive('1', true, { '1': { from: '2026-08-01T08:00', until: '2026-08-20T08:00' } }, now)).toBe(true)
  })
})
