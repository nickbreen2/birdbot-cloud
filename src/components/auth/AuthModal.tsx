// src/components/auth/AuthModal.tsx
'use client'
import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

interface AuthModalProps {
  mode: 'sign-in' | 'sign-up'
  onClose: () => void
  onSwitchMode: (mode: 'sign-in' | 'sign-up') => void
}

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="auth-card rounded-2xl glow-border-blue w-full max-w-[440px] p-6 sm:p-8 flex flex-col gap-5 sm:gap-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
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
