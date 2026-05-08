// src/components/onboarding/OrbitPanel.tsx
import React from 'react'

export function OrbitPanel() {
  return (
    <div style={{
      width: '50%',
      height: '100%',
      background: '#F5F4F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: '78%',
        aspectRatio: '1 / 1.05',
        background: '#ECEAE4',
        borderRadius: 28,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)',
      }}>
        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
        }} />

        {/* Solar system */}
        <div style={{ position: 'relative', width: 340, height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>

          {/* Rings */}
          {[136, 236, 340].map(size => (
            <div key={size} style={{
              position: 'absolute', width: size, height: size, borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.09)', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }} />
          ))}

          {/* Arm 1 — Telegram (inner, 136px, CW 9s) */}
          <div className="ob-arm-1" style={armWrap(136)}>
            <div className="ob-node" style={nodeBase('#28A8E0', false)}>
              <svg width="18" height="16" viewBox="0 0 26 22" fill="none">
                <path d="M1 11L25 1L19 21L13 13L1 11Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M13 13L17 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Arm 2 — Gmail top + GCal bottom (236px, CW 15s) */}
          <div className="ob-arm-2" style={armWrap(236)}>
            {/* Gmail — top */}
            <div className="ob-node" style={nodeBase('#fff', false)}>
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path d="M2 2h16v12H2z" fill="white"/>
                <path d="M2 2l8 7 8-7" stroke="#EA4335" strokeWidth="1.4"/>
                <path d="M2 2v12" stroke="#4285F4" strokeWidth="1.4"/>
                <path d="M18 2v12" stroke="#34A853" strokeWidth="1.4"/>
                <path d="M2 14h16" stroke="#FBBC05" strokeWidth="1.4"/>
              </svg>
            </div>
            {/* Google Calendar — bottom (180° offset via bottom:-19px) */}
            <div className="ob-node" style={nodeBase('#1A73E8', true)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1" y="3" width="18" height="16" rx="2" fill="white"/>
                <rect x="1" y="3" width="18" height="6" rx="2" fill="#4285F4"/>
                <path d="M6 1v4M14 1v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
                <text x="10" y="16.5" textAnchor="middle" fill="#1A73E8" fontSize="6" fontFamily="Arial,sans-serif" fontWeight="700">CAL</text>
              </svg>
            </div>
          </div>

          {/* Arm 3 — Google Drive (outer, 340px, CCW 21s) */}
          <div className="ob-arm-3" style={armWrap(340)}>
            <div className="ob-node" style={nodeBase('#fff', false)}>
              <svg width="20" height="18" viewBox="0 0 87 78" fill="none">
                <path d="M29 0L0 52H29L58 0Z" fill="#0F9D58"/>
                <path d="M58 0L87 52H58L29 0Z" fill="#4285F4"/>
                <path d="M0 52L14.5 78H72.5L87 52Z" fill="#F4B400"/>
              </svg>
            </div>
          </div>

          {/* Center sun */}
          <div className="ob-sun" style={{
            position: 'relative', zIndex: 30, width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(145deg, #2E72F5, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 8px rgba(36,99,235,0.1), 0 8px 28px rgba(36,99,235,0.38)',
          }}>
            <BirdIcon size={34} color="white" />
          </div>

        </div>
      </div>
    </div>
  )
}

function armWrap(size: number): React.CSSProperties {
  return {
    position: 'absolute', width: size, height: size, borderRadius: '50%',
    top: '50%', left: '50%', marginTop: -size / 2, marginLeft: -size / 2,
  }
}

function nodeBase(bg: string, isBottom: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    ...(isBottom ? { bottom: -19 } : { top: -19 }),
    left: '50%', transform: 'translateX(-50%)',
    width: 38, height: 38, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg,
    border: '1.5px solid rgba(255,255,255,0.7)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.16)',
  }
}

export function BirdIcon({ size = 18, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.87)} viewBox="0 0 24 20" fill="none">
      <path d="M23 2.5a10.4 10.4 0 01-3 .82A5.18 5.18 0 0022.36.37a10.35 10.35 0 01-3.29 1.26A5.17 5.17 0 0011.8 6.43 14.67 14.67 0 011.64 1.16a5.17 5.17 0 001.6 6.9A5.14 5.14 0 011 7.52v.06a5.17 5.17 0 004.15 5.07 5.2 5.2 0 01-2.33.09 5.18 5.18 0 004.83 3.59A10.38 10.38 0 011 18.34 14.65 14.65 0 007.93 20c9.52 0 14.72-7.88 14.72-14.72l-.02-.67A10.5 10.5 0 0023 2.5z" fill={color}/>
    </svg>
  )
}
