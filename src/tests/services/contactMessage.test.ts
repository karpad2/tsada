import { describe, expect, it } from 'vitest'
import { extractMessageBody } from '@/utils/contactMessage'

describe('extractMessageBody', () => {
  it('prefers the message field', () => {
    expect(extractMessageBody({ name: 'A', email: 'a@b.c', message: 'Szia' })).toBe('Szia')
  })

  it('falls back to other text fields', () => {
    expect(extractMessageBody({ name: 'A', text: 'Hello' })).toBe('Hello')
  })
})
