import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/stripe', () => ({
  PLANS: {
    monthly: { priceId: 'price_test_monthly' },
    annual:  { priceId: 'price_test_annual'  },
  },
}))

import { PLANS } from '@/lib/stripe'

// Pure function extracted from route — testable without HTTP
function resolvePlanLabel(stripePriceId: string): string {
  if (stripePriceId === PLANS.monthly.priceId) return 'Monthly · $9 / mo'
  if (stripePriceId === PLANS.annual.priceId)  return 'Annual · $60 / yr'
  return 'BirdBot Pro'
}

describe('resolvePlanLabel', () => {
  it('returns monthly label for monthly price ID', () => {
    expect(resolvePlanLabel(PLANS.monthly.priceId)).toBe('Monthly · $9 / mo')
  })

  it('returns annual label for annual price ID', () => {
    expect(resolvePlanLabel(PLANS.annual.priceId)).toBe('Annual · $60 / yr')
  })

  it('returns fallback label for unknown price ID', () => {
    expect(resolvePlanLabel('price_unknown_xyz')).toBe('BirdBot Pro')
  })
})
