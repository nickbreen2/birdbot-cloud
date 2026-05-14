"use client"

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'hasSeenWelcome'

const CAP_ITEMS = [
  {
    iconBg: '#EEF3FF',
    title: 'Handle your schedule',
    desc: 'Book meetings, set reminders, and keep your calendar in check — right from Telegram.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="3" width="18" height="16" rx="2" fill="white" stroke="#C3D4FC" strokeWidth="1.2"/>
        <rect x="1" y="3" width="18" height="6" rx="2" fill="#4285F4"/>
        <path d="M6 1v4M14 1v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="10" y="16.5" textAnchor="middle" fill="#1A73E8" fontSize="5.5" fontFamily="Arial,sans-serif" fontWeight="700">CAL</text>
      </svg>
    ),
  },
  {
    iconBg: '#FFF8F0',
    title: 'Label, organize & draft email replies',
    desc: 'Bird reads your inbox, sorts what matters, and writes replies that sound like you.',
    icon: (
      <svg width="16" height="13" viewBox="0 0 20 16" fill="none">
        <path d="M2 2h16v12H2z" fill="white" stroke="#F0EFE9" strokeWidth="1.2"/>
        <path d="M2 2l8 7 8-7" stroke="#EA4335" strokeWidth="1.4"/>
        <path d="M2 2v12" stroke="#4285F4" strokeWidth="1.4"/>
        <path d="M18 2v12" stroke="#34A853" strokeWidth="1.4"/>
        <path d="M2 14h16" stroke="#FBBC05" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    iconBg: '#F0FDF4',
    title: "Keep up on what's on your plate",
    desc: 'Ask Bird for a quick briefing anytime — tasks, events, unread emails, all in one message.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#86EFAC" strokeWidth="1.5"/>
        <path d="M7 10l2 2 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    iconBg: '#FDF4FF',
    title: 'Unlimited texts & memory',
    desc: 'No message caps. Bird remembers your context across every conversation.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" fill="#E9D5FF" stroke="#A855F7" strokeWidth="1.2"/>
        <path d="M10 6v4l3 2" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function WelcomePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    } catch {
      // localStorage unavailable
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(13,13,13,0.32)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', zIndex: 9999,
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 480, background: 'var(--theme-panel)', borderRadius: 24,
        padding: '28px 36px',
        boxShadow: '0 0 0 1px var(--theme-border), 0 8px 16px rgba(0,0,0,0.12), 0 32px 80px rgba(0,0,0,0.22)',
        animation: 'welcome-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Close button */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--theme-panel-hover)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--theme-text-muted)', fontSize: 14,
          }}
        >✕</button>

        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#eab308', marginBottom: 6 }}>
          You&rsquo;re all set
        </p>
        <h2 style={{
          fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
          fontSize: 26, fontWeight: 700, color: 'var(--theme-text-base)', letterSpacing: '-0.6px',
          lineHeight: 1.2, marginBottom: 6,
        }}>
          Welcome &mdash; here&rsquo;s what I can do for you
        </h2>
        <p style={{ fontSize: 14, color: 'var(--theme-text-dim)', lineHeight: 1.55, marginBottom: 16 }}>
          Bird is ready to go. Here&rsquo;s a quick look at what you&rsquo;ve unlocked.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {CAP_ITEMS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
            }}>
              <div className={`wcap-icon-${i}`} style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: item.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--theme-text-base)', marginBottom: 1 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          style={{
            width: '100%', height: 48, background: '#2463EB', color: '#fff',
            fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
            fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
            border: 'none', borderRadius: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          Take me to my dashboard →
        </button>
      </div>

      <style>{`
        @keyframes welcome-pop {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); }
        }
        [data-theme="dark"] .wcap-icon-0 { background: rgba(66,133,244,0.18) !important; }
        [data-theme="dark"] .wcap-icon-1 { background: rgba(234,67,53,0.15) !important; }
        [data-theme="dark"] .wcap-icon-2 { background: rgba(22,163,74,0.18) !important; }
        [data-theme="dark"] .wcap-icon-3 { background: rgba(168,85,247,0.18) !important; }
      `}</style>
    </>
  )
}
