'use client'
import { useState, useRef } from 'react'
import { useUser, useClerk, useSignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { Mail, LogOut, Camera, Check, X, Pencil } from 'lucide-react'

function SectionCard({
  label,
  children,
  danger = false,
}: {
  label: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className={`text-xs font-semibold uppercase tracking-widest ${
          danger ? 'text-red-400' : 'text-text-muted'
        }`}
      >
        {label}
      </p>
      <div
        className={`rounded-2xl p-5 flex flex-col gap-4 border ${
          danger ? 'border-red-500/20' : 'border-border'
        }`}
        style={{ backgroundColor: '#111827' }}
      >
        {children}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { signIn } = useSignIn()

  const [editingName, setEditingName] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  const [avatarSaving, setAvatarSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  if (!isLoaded) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-text-muted text-sm">Loading…</p>
      </div>
    )
  }

  if (!user) return null

  const initials = (() => {
    const f = user.firstName?.[0] ?? ''
    const l = user.lastName?.[0] ?? ''
    if (f || l) return (f + l).toUpperCase()
    return (user.primaryEmailAddress?.emailAddress?.[0] ?? 'U').toUpperCase()
  })()

  const googleAccount = user.externalAccounts.find(a => a.provider === 'google') ?? null

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  function startEditName() {
    setFirstName(user!.firstName ?? '')
    setLastName(user!.lastName ?? '')
    setEditingName(true)
  }

  async function saveName() {
    setNameSaving(true)
    try {
      await user!.update({ firstName: firstName.trim(), lastName: lastName.trim() })
      setEditingName(false)
    } finally {
      setNameSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarSaving(true)
    try {
      await user!.setProfileImage({ file })
    } finally {
      setAvatarSaving(false)
      e.target.value = ''
    }
  }

  async function connectGoogle() {
    if (!signIn) return
    await signIn.sso({
      strategy: 'oauth_google',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/dashboard/account',
    })
  }

  async function disconnectGoogle() {
    if (!googleAccount) return
    await googleAccount.destroy()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await user!.delete()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto flex flex-col gap-8">

      {/* Page header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-text-base">Account</h1>
        <p className="text-sm text-text-dim mt-1">Manage your profile and account settings.</p>
      </div>

      {/* ── Profile ── */}
      <SectionCard label="Profile">

        {/* Avatar + member since */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user.hasImage ? (
              <Image
                src={user.imageUrl}
                alt="Profile photo"
                width={56}
                height={56}
                className="rounded-full object-cover w-14 h-14"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold select-none"
                style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}
              >
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue flex items-center justify-center border-2 border-surface hover:bg-blue-light transition-colors disabled:opacity-50"
            >
              {avatarSaving ? (
                <span className="block w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={9} className="text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-base">
              {user.fullName || user.primaryEmailAddress?.emailAddress || 'User'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Member since {memberSince}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Name row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <p className="text-xs text-text-muted uppercase tracking-wide">Full name</p>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoFocus
                  className="flex-1 min-w-0 rounded-xl px-3 py-2 text-text-base text-sm outline-none focus:ring-2 focus:ring-blue"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #1e2a45' }}
                />
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="flex-1 min-w-0 rounded-xl px-3 py-2 text-text-base text-sm outline-none focus:ring-2 focus:ring-blue"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #1e2a45' }}
                />
              </div>
            ) : (
              <p className="text-sm text-text-base">
                {user.fullName || <span className="text-text-muted italic">Not set</span>}
              </p>
            )}
          </div>

          <div className="flex gap-1.5 flex-shrink-0 pt-5">
            {editingName ? (
              <>
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                >
                  <Check size={12} />
                  {nameSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-dim hover:text-text-base border border-border transition-colors"
                >
                  <X size={12} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditName}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-dim hover:text-text-base border border-border transition-colors"
              >
                <Pencil size={11} />
                Edit
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Email address ── */}
      <SectionCard label="Email address">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Mail size={15} className="text-text-muted flex-shrink-0" />
            <span className="text-sm text-text-base truncate">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </div>
          <span
            className="text-[11px] font-medium text-emerald px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            Verified
          </span>
        </div>
      </SectionCard>

      {/* ── Connected accounts ── */}
      <SectionCard label="Connected accounts">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GoogleIcon />
            <div className="min-w-0">
              <p className="text-sm text-text-base">Google</p>
              {googleAccount && (
                <p className="text-xs text-text-muted truncate">{googleAccount.emailAddress}</p>
              )}
            </div>
          </div>
          {googleAccount ? (
            <button
              type="button"
              onClick={disconnectGoogle}
              className="text-xs text-text-dim hover:text-red-400 border border-border hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connectGoogle}
              className="text-xs text-blue-light hover:text-blue-bright border border-blue/25 hover:border-blue/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Connect
            </button>
          )}
        </div>
      </SectionCard>

      {/* ── Session ── */}
      <SectionCard label="Session">
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          className="flex items-center gap-2.5 text-sm text-text-dim hover:text-text-base transition-colors w-fit"
        >
          <LogOut size={14} className="text-text-muted" />
          Sign out of all devices
        </button>
      </SectionCard>

      {/* ── Danger zone ── */}
      {user.deleteSelfEnabled && (
        <SectionCard label="Danger zone" danger>
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-base">Are you absolutely sure?</p>
              <p className="text-xs text-text-muted leading-relaxed">
                This will permanently delete your account and all associated data. There is no going back.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors"
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-xs text-text-dim hover:text-text-base border border-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-base">Delete account</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Permanently remove your account and all data. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/25 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                Delete
              </button>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
