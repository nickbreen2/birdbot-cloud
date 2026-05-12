"use client"

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useUser, useSession } from '@clerk/nextjs'
import { ExternalLink, RefreshCw, X } from 'lucide-react'

function popupKey(sessionId: string) { return `cgPopupDismissed_${sessionId}` }
function bannerKey(sessionId: string) { return `cgBannerDismissed_${sessionId}` }

type PairResult = { deepLink: string; expiresAt: string }
type Stage = 'idle' | 'generating' | 'link_ready' | 'connected'
type View = 'popup' | 'banner' | 'hidden'

function getStepState(stepIdx: number, stage: Stage): 'done' | 'active' | 'pending' {
  if (stage === 'connected') return 'done'
  if (stage === 'idle' || stage === 'generating') return stepIdx === 0 ? 'active' : 'pending'
  return stepIdx === 0 ? 'done' : 'active'
}

const STEP_LABELS = [
  'Generate your pairing link below',
  'Open the link on your phone',
  'Tap Start in the BirdBot chat',
]

export function ConnectGuidePopup() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const platform = (user?.publicMetadata?.platform as string) ?? 'telegram'

  const [view, setView] = useState<View>('hidden')
  const [stage, setStage] = useState<Stage>('idle')
  const [pairing, setPairing] = useState<PairResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isLoaded || !session) return
    if (platform !== 'telegram') return

    fetch('/api/telegram/status')
      .then(r => r.json())
      .then((data: { paired: boolean }) => {
        if (data.paired) return
        try {
          const popupDismissed = sessionStorage.getItem(popupKey(session.id))
          const bannerDismissed = sessionStorage.getItem(bannerKey(session.id))
          if (bannerDismissed) return
          if (popupDismissed) { setView('banner'); return }
        } catch {}
        setView('popup')
      })
      .catch(() => setView('popup'))
  }, [isLoaded, session, platform])

  useEffect(() => {
    if (stage !== 'link_ready') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/telegram/status')
        const data = await res.json() as { paired: boolean }
        if (data.paired) {
          setStage('connected')
          clearInterval(pollRef.current!)
        }
      } catch {}
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [stage])

  useEffect(() => { setMounted(true) }, [])

  function dismissPopup() {
    try { if (session) sessionStorage.setItem(popupKey(session.id), 'true') } catch {}
    setView('banner')
    if (pollRef.current) clearInterval(pollRef.current)
  }

  function dismissBanner() {
    try { if (session) sessionStorage.setItem(bannerKey(session.id), 'true') } catch {}
    setView('hidden')
  }

  function reopenPopup() {
    setStage('idle')
    setPairing(null)
    setError(null)
    setView('popup')
  }

  function dismissConnected() {
    try {
      if (session) {
        sessionStorage.setItem(popupKey(session.id), 'true')
        sessionStorage.setItem(bannerKey(session.id), 'true')
      }
    } catch {}
    setView('hidden')
    if (pollRef.current) clearInterval(pollRef.current)
  }

  async function handleGenerate() {
    setStage('generating')
    setError(null)
    try {
      const res = await fetch('/api/telegram/pair', { method: 'POST' })
      const data = await res.json() as PairResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setPairing(data)
      setStage('link_ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link — try again.')
      setStage('idle')
    }
  }

  if (view === 'hidden') return null

  if (view === 'banner') {
    return (
      <>
      <div className="cg-banner" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(36,99,235,0.07)',
        borderBottom: '1px solid rgba(36,99,235,0.18)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>
        <Image src="/Telegram.svg" alt="Telegram" width={22} height={22} className="cg-banner__logo" style={{ flexShrink: 0 }} />
        <span className="cg-banner__text cg-banner__text--full" style={{ fontSize: 13, color: 'var(--theme-text-base)', flex: 1, lineHeight: 1.4 }}>
          Connect Telegram to start talking to Bird.
        </span>
        <span className="cg-banner__text cg-banner__text--short" style={{ fontSize: 13, color: 'var(--theme-text-base)', flex: 1, lineHeight: 1.4 }}>
          Connect Telegram
        </span>
        <button
          onClick={reopenPopup}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: '#2463EB',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Connect
        </button>
        <button
          onClick={dismissBanner}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'transparent',
            border: '1px solid var(--theme-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--theme-text-muted)',
            flexShrink: 0,
          }}
        >
          <X size={12} />
        </button>
      </div>
      <style>{`
        [data-theme="dark"] .cg-banner {
          background: rgba(36,99,235,0.18) !important;
          border-bottom-color: rgba(36,99,235,0.35) !important;
        }
        [data-theme="dark"] .cg-banner__text {
          color: rgba(147,197,253,0.9) !important;
        }
        .cg-banner__text--short { display: none; }
        @media (max-width: 639px) {
          .cg-banner__logo { display: none; }
          .cg-banner__text--full { display: none; }
          .cg-banner__text--short { display: inline; font-size: 16px; font-weight: 600; }
        }
      `}</style>
      </>
    )
  }

  if (!mounted) return null

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      <div style={{
        position: 'fixed', zIndex: 9999,
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(460px, calc(100vw - 32px))',
        background: 'var(--theme-panel)',
        borderRadius: 24,
        padding: '28px 32px',
        boxShadow: '0 0 0 1px var(--theme-border), 0 8px 16px rgba(0,0,0,0.18), 0 32px 80px rgba(0,0,0,0.3)',
        animation: 'cg-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {stage !== 'connected' && (
          <button
            onClick={dismissPopup}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--theme-text-muted)',
            }}
          >
            <X size={13} />
          </button>
        )}

        {stage === 'connected' ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11L9 16L18 6" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
              fontSize: 22, fontWeight: 700, color: 'var(--theme-text-base)',
              letterSpacing: '-0.5px', marginBottom: 8,
            }}>
              You&rsquo;re connected!
            </h2>
            <p style={{ fontSize: 13, color: 'var(--theme-text-dim)', lineHeight: 1.55, marginBottom: 22 }}>
              Bird is now listening on Telegram. Send it your first message to get started.
            </p>
            <button
              onClick={dismissConnected}
              style={{
                width: '100%', height: 44, background: '#2463EB', color: '#fff',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
                fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px',
              }}
            >
              Take me to my dashboard →
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Image src="/Telegram.svg" alt="Telegram" width={28} height={28} />
              <h2 style={{
                fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
                fontSize: 18, fontWeight: 700, color: 'var(--theme-text-base)',
                letterSpacing: '-0.4px', margin: 0,
              }}>
                Connect Telegram
              </h2>
            </div>

            <p style={{ fontSize: 13, color: 'var(--theme-text-dim)', lineHeight: 1.55, marginBottom: 20 }}>
              You&rsquo;re one step away from talking to Bird. It only takes a minute.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
              {STEP_LABELS.map((label, i) => {
                const state = getStepState(i, stage)
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < STEP_LABELS.length - 1 ? '1px solid var(--theme-border)' : 'none',
                    opacity: state === 'pending' ? 0.4 : 1,
                    transition: 'opacity 0.25s',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${state === 'done' ? '#34d399' : state === 'active' ? '#2463EB' : 'var(--theme-border)'}`,
                      background: state === 'done' ? 'rgba(52,211,153,0.12)' : state === 'active' ? 'rgba(36,99,235,0.12)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {state === 'done' ? (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.8 7L9 1" stroke="#34d399" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, color: state === 'active' ? '#2463EB' : 'var(--theme-text-muted)' }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--theme-text-base)' }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {stage === 'idle' || stage === 'generating' ? (
              <button
                onClick={handleGenerate}
                disabled={stage === 'generating'}
                style={{
                  width: '100%', height: 44,
                  background: '#2463EB', color: '#fff',
                  border: 'none', borderRadius: 12,
                  cursor: stage === 'generating' ? 'default' : 'pointer',
                  opacity: stage === 'generating' ? 0.65 : 1,
                  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
                  fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                {stage === 'generating' ? (
                  <><RefreshCw size={13} className="animate-spin" /> Generating…</>
                ) : 'Generate pairing link'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href={pairing!.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    height: 44, borderRadius: 12, textDecoration: 'none',
                    background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
                    color: '#38bdf8', fontSize: 14, fontWeight: 600,
                    fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
                  }}
                >
                  <ExternalLink size={13} /> Open in Telegram
                </a>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <RefreshCw size={11} className="animate-spin" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }} />
                  <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Waiting for you to tap Start…</span>
                </div>
              </div>
            )}

            {error && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</p>
            )}

            <button
              onClick={dismissPopup}
              style={{
                display: 'block', width: '100%', marginTop: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--theme-text-muted)',
                fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
                textAlign: 'center', padding: '4px 0',
              }}
            >
              I&apos;ll do this later
            </button>
          </>
        )}

        <style>{`
          @keyframes cg-pop {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.92) translateY(8px); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1)    translateY(0); }
          }
        `}</style>
      </div>
    </>,
    document.body
  )
}
