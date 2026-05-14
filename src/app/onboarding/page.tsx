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
      <h1 className="ob-h1">
        Pick a home for your BirdBot
      </h1>

      <p style={{ fontSize: 15, color: 'var(--theme-text-dim)', lineHeight: 1.6, marginBottom: 24 }}>
        Choose where Bird will reach you. More platforms are on the way.
      </p>

      {/* Platform cards */}
      <div className="ob-platform-list" style={{ marginBottom: 28 }}>
        <PlatformCard
          label="Telegram"
          selected={selected === 'telegram'}
          onClick={() => setSelected('telegram')}
          iconBg="transparent"
          icon={<img src="/Telegram.svg" alt="Telegram" style={{ borderRadius: 12 }} />}
        />

        <PlatformCard
          label="WhatsApp"
          selected={false}
          disabled
          iconBg="transparent"
          icon={<img src="/Whatsapp.svg" alt="WhatsApp" style={{ borderRadius: 12 }} />}
        />

        <PlatformCard
          label="iMessage"
          selected={false}
          disabled
          iconBg="transparent"
          icon={<img src="/IMessage.svg" alt="iMessage" style={{ borderRadius: 12 }} />}
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
      className="ob-platform-card"
      onClick={disabled ? undefined : onClick}
      style={{
        flex: 1,
        border: `1.5px solid ${selected ? '#2463EB' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 12,
        background: selected ? 'rgba(36,99,235,0.15)' : 'rgba(255,255,255,0.04)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.55 : 1,
        boxShadow: selected ? '0 0 0 4px rgba(36,99,235,.2)' : 'none',
        transition: 'border-color 0.18s, background 0.18s',
      }}
    >
      {disabled && (
        <span className="ob-platform-soon">Coming soon</span>
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
      <div className="ob-platform-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-base)', letterSpacing: '-0.2px' }}>
        {label}
      </span>
    </div>
  )
}
