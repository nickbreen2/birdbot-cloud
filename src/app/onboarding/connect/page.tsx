"use client"

import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'

const btnBlue: React.CSSProperties = {
  width: '100%', height: 48, background: '#2463EB', color: '#fff',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  transition: 'background 0.15s', marginBottom: 10,
}

const ACCESS_ITEMS = [
  {
    label: 'Label & organize your emails, draft replies in your voice',
    bg: '#fff', border: true,
    icon: (
      <svg width="18" height="14" viewBox="0 0 20 16" fill="none">
        <path d="M2 2h16v12H2z" fill="white"/>
        <path d="M2 2l8 7 8-7" stroke="#EA4335" strokeWidth="1.4"/>
        <path d="M2 2v12" stroke="#4285F4" strokeWidth="1.4"/>
        <path d="M18 2v12" stroke="#34A853" strokeWidth="1.4"/>
        <path d="M2 14h16" stroke="#FBBC05" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    label: "Handle your schedule, book meetings, track what's coming up",
    bg: '#1A73E8', border: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="3" width="18" height="16" rx="2" fill="white"/>
        <rect x="1" y="3" width="18" height="6" rx="2" fill="#4285F4"/>
        <path d="M6 1v4M14 1v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="10" y="16.5" textAnchor="middle" fill="#1A73E8" fontSize="6" fontFamily="Arial,sans-serif" fontWeight="700">CAL</text>
      </svg>
    ),
  },
  {
    label: 'Access your Drive files when you need to reference or share them',
    bg: '#fff', border: true,
    icon: (
      <svg width="18" height="16" viewBox="0 0 87 78" fill="none">
        <path d="M29 0L0 52H29L58 0Z" fill="#0F9D58"/>
        <path d="M58 0L87 52H58L29 0Z" fill="#4285F4"/>
        <path d="M0 52L14.5 78H72.5L87 52Z" fill="#F4B400"/>
      </svg>
    ),
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
        fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
        fontSize: 36, fontWeight: 700, color: '#0D0D0D',
        letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 10,
      }}>
        Get the most out of BirdBot<br />by connecting your essentials
      </h1>

      <p style={{ fontSize: 15, color: '#888882', lineHeight: 1.6, marginBottom: 20 }}>
        Connect your email and calendar so BirdBot can prioritize what matters, draft replies in your voice, and keep your schedule on track.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {ACCESS_ITEMS.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#444', fontWeight: 500 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: item.bg, border: item.border ? '1px solid #E4E4E2' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.icon}
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
          textAlign: 'center', fontSize: 13, color: '#A0A09A',
          textDecoration: 'underline', textUnderlineOffset: 3,
          textDecorationColor: '#DDDDD8', width: '100%',
        }}
      >
        Skip for now
      </button>
    </OnboardingShell>
  )
}
