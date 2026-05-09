import { describe, it, expect } from 'vitest'
import { PLANS } from '@/lib/stripe'

// Test the plan-to-priceId mapping (the pure logic extracted from the route)
function resolvePriceId(plan: string): string | null {
  if (plan === 'monthly') return PLANS.monthly.priceId
  if (plan === 'annual')  return PLANS.annual.priceId
  return null
}

describe('resolvePriceId', () => {
  it('returns monthly priceId', () => {
    expect(resolvePriceId('monthly')).toBe(PLANS.monthly.priceId)
  })

  it('returns annual priceId', () => {
    expect(resolvePriceId('annual')).toBe(PLANS.annual.priceId)
  })

  it('returns null for unknown plan', () => {
    expect(resolvePriceId('lifetime')).toBeNull()
  })
})
