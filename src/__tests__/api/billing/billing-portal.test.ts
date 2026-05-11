import { describe, it, expect } from 'vitest'

// Pure function — validates customer ID is a non-empty string
function resolveCustomerId(stripeCustomerId: unknown): string | null {
  if (typeof stripeCustomerId === 'string' && stripeCustomerId.length > 0) {
    return stripeCustomerId
  }
  return null
}

describe('resolveCustomerId', () => {
  it('returns the customer ID when valid', () => {
    expect(resolveCustomerId('cus_abc123')).toBe('cus_abc123')
  })

  it('returns null for empty string', () => {
    expect(resolveCustomerId('')).toBeNull()
  })

  it('returns null for non-string', () => {
    expect(resolveCustomerId(null)).toBeNull()
  })
})
