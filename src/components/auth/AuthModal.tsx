// src/components/auth/AuthModal.tsx
'use client'
import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

interface AuthModalProps {
  mode: 'sign-in' | 'sign-up'
  onClose: () => void
  onSwitchMode: (mode: 'sign-in' | 'sign-up') => void
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const els = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (els.length === 0) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        data-theme="landing"
        className="auth-card rounded-2xl glow-border-blue w-full max-w-[440px] p-6 sm:p-8 flex flex-col gap-5 sm:gap-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'sign-in' ? 'Sign in to BirdBot' : 'Create your BirdBot account'}
      >
        {mode === 'sign-in' ? (
          <SignInForm onSwitchMode={() => onSwitchMode('sign-up')} />
        ) : (
          <SignUpForm onSwitchMode={() => onSwitchMode('sign-in')} />
        )}
      </div>
    </div>,
    document.body
  )
}
