import { describe, it, expect } from 'vitest'

// Inline the validation logic that will live in the route
function validatePlatform(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (b.platform !== 'telegram') return null   // only telegram is live
  return b.platform as string
}

describe('validatePlatform', () => {
  it('accepts telegram', () => {
    expect(validatePlatform({ platform: 'telegram' })).toBe('telegram')
  })

  it('rejects whatsapp (not live)', () => {
    expect(validatePlatform({ platform: 'whatsapp' })).toBeNull()
  })

  it('rejects missing platform', () => {
    expect(validatePlatform({})).toBeNull()
  })

  it('rejects null body', () => {
    expect(validatePlatform(null)).toBeNull()
  })
})
