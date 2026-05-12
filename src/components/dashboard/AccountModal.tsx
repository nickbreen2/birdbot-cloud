"use client"

import { useState, useRef, useEffect } from "react"
import { X, Menu, Mail, LogOut, Camera, Check, Pencil, Monitor, Smartphone } from "lucide-react"
import Image from "next/image"
import { useUser, useClerk, useSignIn, useSessionList, useSession } from "@clerk/nextjs"

type SessionActivity = { browserName?: string; deviceType?: string; isMobile?: boolean; city?: string; country?: string }
type SessionWithActivitiesResource = { id: string; status: string; lastActiveAt: Date; latestActivity?: SessionActivity; revoke: () => Promise<unknown> }
import { useWizard } from "@/components/onboarding/WizardContext"

type AccountSection = "profile" | "security" | "billing" | "danger"

const SECTION_META: Record<AccountSection, { title: string; subtitle: string }> = {
  profile:  { title: "Profile",  subtitle: "Manage your profile, email, and connected accounts." },
  security: { title: "Security", subtitle: "View and manage your active sessions." },
  billing:  { title: "Billing",  subtitle: "Manage your subscription, plan, and payment method." },
  danger:   { title: "Danger Zone", subtitle: "Irreversible actions. Proceed with caution." },
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

export function AccountModal() {
  const { accountOpen, setAccountOpen } = useWizard()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { signIn } = useSignIn()

  const [section, setSection] = useState<AccountSection>("profile")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (accountOpen) {
      setSection("profile")
      setMobileNavOpen(false)
    }
  }, [accountOpen])

  function selectSection(id: AccountSection) {
    setSection(id)
    setMobileNavOpen(false)
  }

  if (!accountOpen || !isLoaded || !user) return null

  const showDanger = user.deleteSelfEnabled

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={() => setAccountOpen(false)}
    >
      <div
        className="w-full max-w-[860px] rounded-2xl border border-border overflow-hidden flex relative h-[90vh] md:h-[700px]"
        style={{
          background: "var(--theme-surface)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.07), 0 60px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Mobile nav overlay ── */}
        {mobileNavOpen && (
          <div
            className="md:hidden absolute inset-0 z-10 flex flex-col"
            style={{ background: "var(--theme-depth)" }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-sans font-semibold text-text-base leading-tight">Account</h2>
                <p className="text-xs text-text-muted font-sans mt-1">Manage your account settings.</p>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-base hover:bg-white/[0.06] transition-all"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <nav className="flex-1 flex flex-col px-2 py-3 gap-0.5 overflow-y-auto">
              {(["profile", "security", "billing"] as const).map((id) => (
                <button
                  key={id}
                  onClick={() => selectSection(id)}
                  className={`w-full text-left px-4 py-3.5 text-sm font-sans transition-all rounded-xl capitalize ${
                    section === id
                      ? "border-l-2 text-text-base font-medium"
                      : "border-l-2 border-transparent text-text-muted hover:text-text-dim hover:bg-white/[0.03]"
                  }`}
                  style={
                    section === id
                      ? { background: "var(--theme-nav-active-bg)", borderColor: "var(--theme-nav-active-bar)" }
                      : undefined
                  }
                >
                  {id === "profile" ? "Profile" : id === "security" ? "Security" : "Billing"}
                </button>
              ))}
            </nav>
            {showDanger && (
              <div className="px-2 pb-6 pt-3 border-t border-border">
                <button
                  onClick={() => selectSection("danger")}
                  className={`w-full text-left px-4 py-3.5 text-sm font-sans transition-all rounded-xl ${
                    section === "danger"
                      ? "border-l-2 border-red-400 text-red-300 font-medium"
                      : "border-l-2 border-transparent text-red-400 hover:text-red-300 hover:bg-red-500/[0.08]"
                  }`}
                  style={
                    section === "danger"
                      ? { background: "linear-gradient(90deg, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.05) 100%)" }
                      : undefined
                  }
                >
                  ⚠ Danger Zone
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Left sidebar ── */}
        <div
          className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-border"
          style={{ background: "var(--theme-depth)" }}
        >
          <div className="px-5 pt-6 pb-5">
            <h2 className="text-lg font-sans font-semibold text-text-base leading-tight">Account</h2>
            <p className="text-xs text-text-muted font-sans mt-1">Manage your account settings.</p>
          </div>

          <nav className="flex-1 flex flex-col px-2 gap-0.5">
            {(["profile", "security", "billing"] as const).map((id) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full text-left px-3 py-2.5 text-sm font-sans transition-all rounded-r-xl ${
                  section === id
                    ? "border-l-2 text-text-base font-medium"
                    : "border-l-2 border-transparent text-text-muted hover:text-text-dim hover:bg-white/[0.03]"
                }`}
                style={
                  section === id
                    ? { background: "var(--theme-nav-active-bg)", borderColor: "var(--theme-nav-active-bar)" }
                    : undefined
                }
              >
                {id === "profile" ? "Profile" : id === "security" ? "Security" : "Billing"}
              </button>
            ))}
          </nav>

          {showDanger && (
            <div className="px-2 pb-4 pt-3 border-t border-border mt-2">
              <button
                onClick={() => setSection("danger")}
                className={`w-full text-left px-3 py-2.5 text-sm font-sans transition-all rounded-r-xl ${
                  section === "danger"
                    ? "border-l-2 border-red-400 text-red-300 font-medium"
                    : "border-l-2 border-transparent text-red-400 hover:text-red-300 hover:bg-red-500/[0.08]"
                }`}
                style={
                  section === "danger"
                    ? { background: "linear-gradient(90deg, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.05) 100%)" }
                    : undefined
                }
              >
                ⚠ Danger Zone
              </button>
            </div>
          )}
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "var(--theme-acct-main-bg)" }}>
          {/* Sticky header */}
          <div
            className="flex items-center px-4 md:px-8 py-5 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--theme-border)", background: "var(--theme-acct-main-bg)" }}
          >
            <button
              className="md:hidden mr-3 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-base hover:bg-white/[0.06] transition-all flex-shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-sans font-semibold text-base text-text-base leading-tight truncate">
                {SECTION_META[section].title}
              </h3>
              <p className="text-xs text-text-muted font-sans mt-0.5 truncate">{SECTION_META[section].subtitle}</p>
            </div>
            <button
              onClick={() => setAccountOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-base hover:bg-white/[0.06] transition-all ml-4 flex-shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {section === "profile" && (
              <ProfileSection user={user} signIn={signIn} signOut={signOut} onClose={() => setAccountOpen(false)} />
            )}
            {section === "security" && <SecuritySection />}
            {section === "billing" && <BillingSection />}
            {section === "danger" && (
              <DangerSection user={user} onClose={() => setAccountOpen(false)} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Profile section (avatar + name + email + connected accounts + session) ─────

function ProfileSection({
  user,
  signIn,
  signOut,
  onClose,
}: {
  user: NonNullable<ReturnType<typeof useUser>["user"]>
  signIn: ReturnType<typeof useSignIn>["signIn"]
  signOut: ReturnType<typeof useClerk>["signOut"]
  onClose: () => void
}) {
  const [editingName, setEditingName] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [nameSaving, setNameSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = (() => {
    const f = user.firstName?.[0] ?? ""
    const l = user.lastName?.[0] ?? ""
    if (f || l) return (f + l).toUpperCase()
    return (user.primaryEmailAddress?.emailAddress?.[0] ?? "U").toUpperCase()
  })()

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—"

  const googleAccount = user.externalAccounts.find(a => a.provider === "google") ?? null

  function startEditName() {
    setFirstName(user.firstName ?? "")
    setLastName(user.lastName ?? "")
    setEditingName(true)
  }

  async function saveName() {
    setNameSaving(true)
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() })
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
      await user.setProfileImage({ file })
    } finally {
      setAvatarSaving(false)
      e.target.value = ""
    }
  }

  async function connectGoogle() {
    if (!signIn) return
    await signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/dashboard",
    })
  }

  async function disconnectGoogle() {
    if (!googleAccount) return
    await googleAccount.destroy()
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-8">

      {/* Avatar + name */}
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">Profile</p>

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
                style={{ background: "linear-gradient(135deg, #333333, #555555)" }}
              >
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 disabled:opacity-50 transition-colors"
              style={{ background: "#444444", borderColor: "#111111" }}
            >
              {avatarSaving ? (
                <span className="block w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={9} className="text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-base">
              {user.fullName || user.primaryEmailAddress?.emailAddress || "User"}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Member since {memberSince}</p>
          </div>
        </div>

        <div className="h-px" style={{ background: "var(--theme-border)" }} />

        {/* Full name row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">Full name</p>
            {editingName ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoFocus
                  className="flex-1 min-w-0 rounded-xl px-3 py-2 text-text-base text-sm outline-none focus:ring-1 focus:ring-white/20"
                  style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
                />
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="flex-1 min-w-0 rounded-xl px-3 py-2 text-text-base text-sm outline-none focus:ring-1 focus:ring-white/20"
                  style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
                />
              </div>
            ) : (
              <p className="text-sm text-text-base">
                {user.fullName || <span className="text-text-muted italic">Not set</span>}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0 sm:pt-5">
            {editingName ? (
              <>
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #333333, #555555)" }}
                >
                  <Check size={12} />
                  {nameSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-dim hover:text-text-base border border-border transition-colors"
                >
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
      </div>

      {/* Email */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">Email Address</p>
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Mail size={15} className="text-text-muted flex-shrink-0" />
            <span className="text-sm text-text-base truncate">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </div>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ color: "#4ade80", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            Verified
          </span>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">Connected Accounts</p>
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
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
              className="text-xs text-text-dim hover:text-text-base border border-border hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Session */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">Session</p>
        <div
          className="px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <button
            type="button"
            onClick={() => { onClose(); signOut({ redirectUrl: "/sign-in" }) }}
            className="flex items-center gap-2.5 text-sm text-text-dim hover:text-text-base transition-colors"
          >
            <LogOut size={14} className="text-text-muted" />
            Sign out of all devices
          </button>
        </div>
      </div>

    </div>
  )
}

// ── Security section ───────────────────────────────────────────────────────────

function SecuritySection() {
  const { sessions, isLoaded } = useSessionList()
  const { session: currentSession } = useSession()
  const [revoking, setRevoking] = useState<string | null>(null)

  if (!isLoaded) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex items-center justify-center h-40">
        <span className="text-sm text-text-muted">Loading sessions…</span>
      </div>
    )
  }

  const activeSessions = (sessions ?? []).filter(s => s.status === "active") as unknown as SessionWithActivitiesResource[]

  async function handleRevoke(sessionId: string, revokeFn: () => Promise<unknown>) {
    setRevoking(sessionId)
    try {
      await revokeFn()
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">
          Active Sessions
        </p>

        {activeSessions.length === 0 ? (
          <p className="text-sm text-text-muted">No active sessions found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeSessions.map(session => {
              const activity = session.latestActivity
              const isCurrent = session.id === currentSession?.id
              const isMobile = activity?.isMobile ?? false

              const deviceLabel =
                [activity?.browserName, activity?.deviceType].filter(Boolean).join(" on ") ||
                "Unknown device"
              const locationLabel =
                [activity?.city, activity?.country].filter(Boolean).join(", ") || null

              const lastActive = session.lastActiveAt
                ? new Date(session.lastActiveAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"

              return (
                <div
                  key={session.id}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                  style={{
                    background: isCurrent ? "var(--theme-panel-hover)" : "var(--theme-surface)",
                    border: "1px solid var(--theme-border)",
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5 text-text-muted">
                    {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-text-base font-medium truncate">{deviceLabel}</p>
                      {isCurrent && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            color: "var(--theme-text-dim)",
                            backgroundColor: "var(--theme-nav-hover-bg)",
                            border: "1px solid var(--theme-border)",
                          }}
                        >
                          This device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {locationLabel && (
                        <p className="text-xs text-text-muted">{locationLabel}</p>
                      )}
                      {locationLabel && <span className="text-text-muted text-xs">·</span>}
                      <p className="text-xs text-text-muted">Active {lastActive}</p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(session.id, () => session.revoke())}
                      disabled={revoking === session.id}
                      className="flex-shrink-0 text-xs text-text-dim hover:text-red-400 border border-border hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {revoking === session.id ? "Signing out…" : "Sign out"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Billing section ────────────────────────────────────────────────────────────

type BillingInfo = { plan: string; status: string; currentPeriodEnd: string }

function BillingSection() {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [noSubscription, setNoSubscription] = useState(false)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setNoSubscription(false)
    setInfo(null)

    async function load() {
      try {
        const infoRes = await fetch('/api/billing-info')
        if (cancelled) return
        if (infoRes.status === 404) {
          setNoSubscription(true)
          return
        }
        if (!infoRes.ok) { setError(true); return }
        const infoData = await infoRes.json() as BillingInfo
        setInfo(infoData)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [retryCount])

  async function handleManageClick() {
    setPortalLoading(true)
    setPortalError(false)
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      if (!res.ok) { setPortalError(true); return }
      const { url } = await res.json() as { url: string }
      window.open(url, '_blank')
    } catch {
      setPortalError(true)
    } finally {
      setPortalLoading(false)
    }
  }

  const periodEnd = info
    ? new Date(info.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const isTrialing = info?.status === 'trialing'

  if (loading) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex items-center justify-center h-40">
        <span className="text-sm text-text-muted">Loading billing info…</span>
      </div>
    )
  }

  if (noSubscription) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-3">
        <p className="text-sm text-text-muted">No active subscription found.</p>
        <p className="text-xs text-text-muted">
          Need help?{' '}
          <a href="mailto:support@birdbot.ai" className="underline hover:text-text-dim transition-colors">
            Contact support
          </a>
        </p>
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-3">
        <p className="text-sm text-text-muted">Unable to load billing info. Please try again.</p>
        <button
          type="button"
          onClick={() => setRetryCount(c => c + 1)}
          className="text-xs text-text-dim hover:text-text-base border border-border px-3 py-1.5 rounded-lg transition-colors w-fit"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">
          Subscription
        </p>

        {/* Plan */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <span className="text-sm text-text-muted">Plan</span>
          <span className="text-sm font-semibold text-text-base">{info.plan}</span>
        </div>

        {/* Status */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <span className="text-sm text-text-muted">Status</span>
          {isTrialing ? (
            <span
              className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
              style={{
                color: "#34d399",
                background: "rgba(5,150,105,0.12)",
                border: "1px solid rgba(5,150,105,0.28)",
              }}
            >
              Trial
            </span>
          ) : (
            <span
              className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
              style={{
                color: "#4ade80",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              Active
            </span>
          )}
        </div>

        {/* Trial end / Next billing */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <span className="text-sm text-text-muted">
            {isTrialing ? "Trial ends" : "Next billing"}
          </span>
          <span className="text-sm font-semibold text-text-base">{periodEnd}</span>
        </div>

        {/* Manage button */}
        <button
          type="button"
          onClick={handleManageClick}
          disabled={portalLoading}
          className="w-full h-10 rounded-xl text-sm font-semibold transition-colors mt-1 disabled:opacity-50 bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
        >
          {portalLoading ? 'Opening…' : 'Manage subscription'}
        </button>

        <p className="text-center text-[11.5px] font-sans text-text-muted">
          Cancel anytime · Opens Stripe&apos;s secure billing portal
        </p>
        {portalError && (
          <p className="text-center text-[11.5px] text-red-400">
            Could not open portal. Please try again.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Danger Zone section ────────────────────────────────────────────────────────

function DangerSection({
  user,
  onClose,
}: {
  user: NonNullable<ReturnType<typeof useUser>["user"]>
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [killInput, setKillInput]   = useState("")
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const killPhrase = "Shut Down my Account Forever"
  const canDelete  = killInput === killPhrase

  function startConfirm() {
    setConfirming(true)
    setKillInput("")
    setError("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleDelete() {
    setDeleting(true)
    setError("")
    try {
      await user.delete()
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-5">
      {!confirming ? (
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)",
            border: "1px solid rgba(239,68,68,0.35)",
            boxShadow: "inset 0 0 40px rgba(239,68,68,0.04)",
          }}
        >
          <div>
            <p className="text-sm font-semibold text-red-400 font-sans">Delete account</p>
            <p className="text-xs text-text-muted font-sans mt-1.5 leading-relaxed">
              Permanently remove your account and all associated data. This cannot be undone.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={startConfirm}
              className="px-4 py-2 rounded-xl text-sm font-semibold font-sans transition-all"
              style={{
                border: "1px solid rgba(239,68,68,0.6)",
                color: "#f87171",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.12)"
                e.currentTarget.style.boxShadow = "0 0 16px rgba(239,68,68,0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              Shut Down Account
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-5 flex flex-col gap-5"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.04) 100%)",
            border: "1px solid rgba(239,68,68,0.5)",
            boxShadow: "0 0 40px rgba(239,68,68,0.08)",
          }}
        >
          <div>
            <p className="text-sm font-semibold text-red-400 font-sans">⚠ Shut Down my Account Forever?</p>
            <p className="text-xs text-text-muted font-sans mt-1.5 leading-relaxed">
              This cannot be undone. Your account and all associated data will be permanently destroyed.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">
              Type <span className="text-red-400 font-mono normal-case tracking-normal">{killPhrase}</span> to confirm
            </label>
            <input
              ref={inputRef}
              type="text"
              value={killInput}
              onChange={(e) => setKillInput(e.target.value)}
              placeholder={killPhrase}
              className="px-4 py-3 rounded-xl text-text-base placeholder:text-text-muted font-sans text-sm focus:outline-none transition-all"
              style={{
                background: "var(--theme-surface)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid rgba(239,68,68,0.6)"
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.10)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid rgba(239,68,68,0.3)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>

          {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setConfirming(false); setKillInput("") }}
              className="px-4 py-2 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm font-semibold font-sans text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              style={
                canDelete && !deleting
                  ? {
                      background: "linear-gradient(135deg,#b91c1c,#ef4444)",
                      boxShadow: "0 0 20px rgba(239,68,68,0.4)",
                    }
                  : { background: "#7f1d1d" }
              }
            >
              {deleting ? "Deleting…" : killPhrase}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
