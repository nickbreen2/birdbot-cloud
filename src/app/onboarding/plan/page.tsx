"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { BirdIcon } from '@/components/onboarding/OrbitPanel'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const btnBlue: React.CSSProperties = {
  width: '100%', height: 48, background: '#2463EB', color: '#fff',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
}

const BENEFITS = [
  'Handle your schedule & book meetings',
  'Label, organize & draft email replies in your voice',
  "Keep up on what's on your plate",
  'Unlimited texts & memory storage',
]

const PLAN_PRICES = {
  monthly: { display: '$9', cadence: 'per month', label: 'Monthly', sub: '$9/mo' },
  annual:  { display: '$60', cadence: 'per year',  label: 'Annual',  sub: '$60/yr' },
}

export default function OnboardingStep3() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch('/api/onboarding/setup-intent', { method: 'POST' })
      .then(r => r.json())
      .then((d: { clientSecret?: string; customerId?: string; error?: string }) => {
        if (d.error || !d.clientSecret || !d.customerId) {
          setFetchError(true)
          return
        }
        setClientSecret(d.clientSecret)
        setCustomerId(d.customerId)
      })
      .catch(() => setFetchError(true))
  }, [])

  if (fetchError) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#888882' }}>
        Failed to load payment form. Please refresh.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>

      {/* Left panel */}
      <div style={{
        width: '50%', height: '100%', padding: '0 148px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        borderRight: '1px solid #EBEBEA', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#2463EB', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(36,99,235,0.3)',
          }}>
            <BirdIcon size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
            fontSize: 16, fontWeight: 600, color: '#0D0D0D', letterSpacing: '-0.3px',
          }}>BirdBot</span>
        </div>

        {/* Progress bar — steps 1+2 done, step 3 active */}
        <div style={{ display: 'flex', gap: 5, width: '100%', marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: '#2463EB',
              opacity: i < 2 ? 0.45 : 1,
            }} />
          ))}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
          fontSize: 44, fontWeight: 700, color: '#0D0D0D',
          letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 10,
        }}>
          Start your<br />7&#8209;day free trial
        </h1>

        <p style={{ fontSize: 15, color: '#888882', lineHeight: 1.6, marginBottom: 20 }}>
          No charge until your trial ends. Cancel anytime, no questions asked.
        </p>

        {/* Plan toggle */}
        <div style={{
          display: 'flex', gap: 6, background: '#F5F4F0', borderRadius: 12, padding: 4, marginBottom: 20,
        }}>
          {(['monthly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              style={{
                flex: 1, height: 44, border: 'none', borderRadius: 9, cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
                fontSize: 14, fontWeight: 500,
                background: plan === p ? '#fff' : 'transparent',
                color: plan === p ? '#0D0D0D' : '#888882',
                boxShadow: plan === p ? '0 1px 3px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
            >
              {PLAN_PRICES[p].label}&nbsp;
              <span style={{ fontWeight: 600 }}>{PLAN_PRICES[p].sub}</span>
              {p === 'annual' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.2px',
                  background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                  padding: '2px 6px', borderRadius: 20,
                }}>Save 44%</span>
              )}
            </button>
          ))}
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              fontSize: 14, color: '#444', fontWeight: 500, lineHeight: 1.4,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#EEF3FF', border: '1.5px solid #C3D4FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="#2463EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {b}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#BBBBB5', lineHeight: 1.5, marginTop: 10 }}>
          By continuing you agree to our{' '}
          <a href="/terms" style={{ color: '#BBBBB5', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</a>
          {' '}&amp;{' '}
          <a href="/privacy" style={{ color: '#BBBBB5', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</a>
        </p>
      </div>

      {/* Right panel — white payment card on warm background */}
      <div style={{
        width: '50%', height: '100%', background: '#F5F4F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {clientSecret && customerId ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentCard plan={plan} customerId={customerId} />
          </Elements>
        ) : (
          <div style={{ color: '#888882', fontSize: 14 }}>Loading payment form…</div>
        )}
      </div>
    </div>
  )
}

function PaymentCard({ plan, customerId }: { plan: 'monthly' | 'annual'; customerId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || loading) return
    setLoading(true)
    setError(null)

    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message ?? 'Payment setup failed. Please try again.')
        setLoading(false)
        return
      }

      const paymentMethodId = typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id

      if (!paymentMethodId) {
        setError('Could not retrieve payment method. Please try again.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/onboarding/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, customerId, plan }),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Subscription creation failed. Please try again.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const prices = PLAN_PRICES[plan]

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: '78%', maxWidth: 400,
        background: '#fff', borderRadius: 24, padding: '32px 28px 28px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.09)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F0EFE9',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: 'linear-gradient(145deg, #2E72F5, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(36,99,235,0.3)',
        }}>
          <BirdIcon size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
            fontSize: 15, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.3px',
          }}>BirdBot Pro</div>
          <div style={{ fontSize: 12, color: '#888882', marginTop: 1 }}>7&#8209;day free trial included</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
            fontSize: 20, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.5px',
          }}>{prices.display}</div>
          <div style={{ fontSize: 11, color: '#888882' }}>{prices.cadence}</div>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <PaymentElement options={{ layout: 'tabs' }} />

      {/* Total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 0', margin: '14px 0', borderTop: '1px solid #F0EFE9',
      }}>
        <span style={{ fontSize: 13, color: '#888882' }}>Due today</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>$0.00</span>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10, textAlign: 'center' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          ...btnBlue,
          background: loading ? '#93C5FD' : '#2463EB',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 12,
        }}
      >
        {loading ? 'Processing…' : 'Start free trial'}
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, fontSize: 11.5, color: '#BBBBB5',
      }}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M6 1L1 3.5V7C1 9.8 3.2 12.4 6 13C8.8 12.4 11 9.8 11 7V3.5L6 1Z" fill="#A0A09A"/>
        </svg>
        Secured &amp; powered by Stripe
      </div>
    </form>
  )
}
