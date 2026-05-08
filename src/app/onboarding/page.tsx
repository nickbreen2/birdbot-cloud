"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'

const btn: React.CSSProperties = {
  width: '100%', height: 52, background: '#2463EB', color: '#fff',
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
        fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
        fontSize: 36, fontWeight: 700, color: '#0D0D0D',
        letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 12,
      }}>
        Pick a home for your BirdBot
      </h1>

      <p style={{ fontSize: 15, color: '#888882', lineHeight: 1.6, marginBottom: 40 }}>
        Choose where Bird will reach you. More platforms are on the way.
      </p>

      {/* Platform cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        {/* Telegram — active (removed comment formatting to avoid duplication) */}
        <PlatformCard
          label="Telegram"
          selected={selected === 'telegram'}
          onClick={() => setSelected('telegram')}
          iconBg="#28A8E0"
          icon={
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
              <path d="M1 11L25 1L19 21L13 13L1 11Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M13 13L17 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          }
        />

        {/* WhatsApp — disabled */}
        <PlatformCard
          label="WhatsApp"
          selected={false}
          disabled
          iconBg="#25D366"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          }
        />

        {/* iMessage — disabled */}
        <PlatformCard
          label="iMessage"
          selected={false}
          disabled
          iconBg="linear-gradient(145deg,#34C759,#25A244)"
          icon={
            <svg width="26" height="24" viewBox="0 0 24 22" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V14C2 15.1 2.9 16 4 16H8L12 20L16 16H20C21.1 16 22 15.1 22 14V4C22 2.9 21.1 2 20 2Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          }
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
        flex: 1, height: 136,
        border: `1.5px solid ${selected ? '#2463EB' : '#E4E4E2'}`,
        borderRadius: 18, background: selected ? '#EFF6FF' : '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.36 : 1,
        boxShadow: selected ? '0 0 0 4px rgba(36,99,235,.09)' : 'none',
        transition: 'border-color 0.18s, background 0.18s',
      }}
    >
      {disabled && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
          background: '#F3F4F6', color: '#A0A09A', border: '1px solid #E4E4E2',
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
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: '-0.2px' }}>
        {label}
      </span>
    </div>
  )
}
