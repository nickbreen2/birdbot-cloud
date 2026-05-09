"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'

const btn: React.CSSProperties = {
  width: '100%', height: 48, background: '#2463EB', color: '#fff',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'background 0.15s',
}

export default function OnboardingStep1() {
  const router = useRouter()
  const [selected, setSelected] = useState<'telegram' | null>('telegram')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!selected || loading) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selected }),
      })
      if (!res.ok) throw new Error('Failed to save platform')
      router.push('/onboarding/connect')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={1}>
      <h1 style={{
        fontFamily: 'var(--font-outfit, "Outfit", sans-serif)',
        fontSize: 30, fontWeight: 700, color: 'var(--theme-text-base)',
        letterSpacing: '-0.7px', lineHeight: 1.2, marginBottom: 10,
      }}>
        Pick a home for your BirdBot
      </h1>

      <p style={{ fontSize: 15, color: 'var(--theme-text-dim)', lineHeight: 1.6, marginBottom: 24 }}>
        Choose where Bird will reach you. More platforms are on the way.
      </p>

      {/* Platform cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <PlatformCard
          label="Telegram"
          selected={selected === 'telegram'}
          onClick={() => setSelected('telegram')}
          iconBg="transparent"
          icon={<img src="/Telegram.svg" alt="Telegram" style={{ width: 42, height: 42, borderRadius: 12 }} />}
        />

        <PlatformCard
          label="WhatsApp"
          selected={false}
          disabled
          iconBg="transparent"
          icon={<img src="/Whatsapp.svg" alt="WhatsApp" style={{ width: 42, height: 42, borderRadius: 12 }} />}
        />

        <PlatformCard
          label="iMessage"
          selected={false}
          disabled
          iconBg="transparent"
          icon={<img src="/IMessage.svg" alt="iMessage" style={{ width: 42, height: 42, borderRadius: 12 }} />}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10, textAlign: 'center' }}>{error}</p>
      )}

      <button
        style={{ ...btn, opacity: selected && !loading ? 1 : 0.5, cursor: selected && !loading ? 'pointer' : 'not-allowed' }}
        onClick={handleContinue}
        disabled={!selected || loading}
      >
        {loading ? 'Saving…' : 'Continue'}
        {!loading && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7H11M11 7L8 4M11 7L8 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </OnboardingShell>
  )
}

function PlatformCard({
  label, selected, disabled = false, iconBg, icon, onClick
}: {
  label: string
  selected: boolean
  disabled?: boolean
  iconBg: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        flex: 1, height: 144,
        border: `1.5px solid ${selected ? '#2463EB' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 18,
        background: selected ? 'rgba(36,99,235,0.15)' : 'rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.3 : 1,
        boxShadow: selected ? '0 0 0 4px rgba(36,99,235,.2)' : 'none',
        transition: 'border-color 0.18s, background 0.18s',
      }}
    >
      {disabled && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
          background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 99, padding: '2px 8px',
        }}>Soon</span>
      )}
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10, width: 20, height: 20,
          background: '#2463EB', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div style={{
        width: 58, height: 58, borderRadius: 16,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-base)', letterSpacing: '-0.2px' }}>
        {label}
      </span>
    </div>
  )
}
