import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoisted mock factories ──────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  customersRetrieve: vi.fn(),
  customersUpdate: vi.fn(),
  paymentMethodsAttach: vi.fn(),
  subscriptionsCreate: vi.fn(),
  getStripe: vi.fn(),
  subscriptionUpsert: vi.fn(),
}))

// ── Module mocks (must be at top level, before any imports of the module) ───
vi.mock('@clerk/nextjs/server', () => ({
  auth: mocks.auth,
  clerkClient: mocks.clerkClient,
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: mocks.getStripe,
  PLANS: {
    monthly: { priceId: 'price_monthly' },
    annual:  { priceId: 'price_annual'  },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: { upsert: mocks.subscriptionUpsert },
  },
}))

// ── Import route AFTER mocks are registered ─────────────────────────────────
import { POST } from '@/app/api/onboarding/subscribe/route'

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/onboarding/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/onboarding/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default stripe mock wiring
    mocks.getStripe.mockReturnValue({
      customers: {
        retrieve: mocks.customersRetrieve,
        update:   mocks.customersUpdate,
      },
      paymentMethods: { attach: mocks.paymentMethodsAttach },
      subscriptions:  { create: mocks.subscriptionsCreate  },
    })

    // Default clerk mock
    mocks.clerkClient.mockResolvedValue({
      users: {
        getUser:    vi.fn().mockResolvedValue({ publicMetadata: {} }),
        updateUser: vi.fn().mockResolvedValue({}),
      },
    })

    // Default prisma mock
    mocks.subscriptionUpsert.mockResolvedValue({})
  })

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue({ userId: null })

    const res = await POST(makeRequest({
      paymentMethodId: 'pm_test',
      customerId: 'cus_test',
      plan: 'monthly',
    }))

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when required fields are missing', async () => {
    mocks.auth.mockResolvedValue({ userId: 'user_123' })

    const res = await POST(makeRequest({
      paymentMethodId: 'pm_test',
      // customerId and plan intentionally omitted
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing required fields')
  })

  it('returns 403 when customerId belongs to a different user', async () => {
    mocks.auth.mockResolvedValue({ userId: 'user_123' })
    mocks.customersRetrieve.mockResolvedValue({
      deleted: false,
      metadata: { clerkUserId: 'other_user' },
    })

    const res = await POST(makeRequest({
      paymentMethodId: 'pm_test',
      customerId: 'cus_other',
      plan: 'monthly',
    }))

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns 403 when customer is deleted', async () => {
    mocks.auth.mockResolvedValue({ userId: 'user_123' })
    mocks.customersRetrieve.mockResolvedValue({ deleted: true })

    const res = await POST(makeRequest({
      paymentMethodId: 'pm_test',
      customerId: 'cus_deleted',
      plan: 'monthly',
    }))

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns 200 and creates subscription when customerId is valid', async () => {
    mocks.auth.mockResolvedValue({ userId: 'user_123' })
    mocks.customersRetrieve.mockResolvedValue({
      deleted: false,
      metadata: { clerkUserId: 'user_123' },
    })
    mocks.paymentMethodsAttach.mockResolvedValue({})
    mocks.customersUpdate.mockResolvedValue({})
    const trialEnd = Math.floor(Date.now() / 1000) + 86400
    mocks.subscriptionsCreate.mockResolvedValue({
      id: 'sub_1',
      status: 'trialing',
      trial_end: trialEnd,
      items: {
        data: [{ current_period_end: trialEnd }],
      },
    })

    const res = await POST(makeRequest({
      paymentMethodId: 'pm_test',
      customerId: 'cus_valid',
      plan: 'monthly',
    }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    expect(mocks.customersRetrieve).toHaveBeenCalledWith('cus_valid')
    expect(mocks.paymentMethodsAttach).toHaveBeenCalledWith('pm_test', { customer: 'cus_valid' })
    expect(mocks.subscriptionsCreate).toHaveBeenCalled()
    expect(mocks.subscriptionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkUserId: 'user_123' },
        create: expect.objectContaining({ stripeSubscriptionId: 'sub_1' }),
      })
    )
  })
})

// ── Existing plan-resolution unit tests (preserved) ──────────────────────────
import { PLANS } from '@/lib/stripe'

function resolvePriceId(plan: string): string | null {
  if (plan === 'monthly') return PLANS.monthly.priceId
  if (plan === 'annual')  return PLANS.annual.priceId
  return null
}

describe('resolvePriceId', () => {
  it('returns monthly priceId', () => {
    expect(resolvePriceId('monthly')).toBe('price_monthly')
  })

  it('returns annual priceId', () => {
    expect(resolvePriceId('annual')).toBe('price_annual')
  })

  it('returns null for unknown plan', () => {
    expect(resolvePriceId('lifetime')).toBeNull()
  })
})
