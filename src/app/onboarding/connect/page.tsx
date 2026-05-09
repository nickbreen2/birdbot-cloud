"use client"

import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'

const btnBlue: React.CSSProperties = {
  width: '100%', height: 48, background: '#fff', color: '#111',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  transition: 'background 0.15s', marginBottom: 10,
}

const ACCESS_ITEMS = [
  {
    label: 'Label & organize your emails, draft replies in your voice',
    src: '/google-gmail.svg',
  },
  {
    label: "Handle your schedule, book meetings, track what's coming up",
    src: '/google-calendar.svg',
  },
  {
    label: 'Access your Drive files when you need to reference or share them',
    src: '/google-drive.svg',
  },
]

export default function OnboardingStep2() {
  const router = useRouter()

  function handleGoogleConnect() {
    window.location.href = '/api/google/connect'
  }

  function handleSkip() {
    router.push('/onboarding/plan')
  }

  return (
    <OnboardingShell step={2}>
      <h1 style={{
        fontFamily: 'var(--font-outfit, "Outfit", sans-serif)',
        fontSize: 30, fontWeight: 700, color: 'var(--theme-text-base)',
        letterSpacing: '-0.7px', lineHeight: 1.2, marginBottom: 10,
      }}>
        Get the most out of BirdBot<br />by connecting your essentials
      </h1>

      <p style={{ fontSize: 15, color: 'var(--theme-text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        Connect your Google account so BirdBot can handle your inbox, calendar, and files — all in your voice.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
        {ACCESS_ITEMS.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            fontSize: 14, color: 'var(--theme-text-dim)', fontWeight: 500,
            padding: '12px 0',
            borderBottom: i < ACCESS_ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 5,
            }}>
              <img src={item.src} alt="" width={22} height={22} style={{ display: 'block' }} />
            </div>
            {item.label}
          </div>
        ))}
      </div>

      <button style={btnBlue} onClick={handleGoogleConnect}>
        {/* Google G logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Connect Google
      </button>

      <button
        onClick={handleSkip}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)',
          width: '100%', padding: '6px 0', letterSpacing: '-0.1px',
          transition: 'color 0.15s',
        }}
      >
        Skip for now
      </button>
    </OnboardingShell>
  )
}
