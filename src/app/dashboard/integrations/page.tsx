"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ExternalLink, RefreshCw, X, MoreVertical } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type TelegramStatus =
  | { state: "loading" }
  | { state: "unpaired" }
  | { state: "paired"; displayName: string }
  | { state: "error" }

type PairResult = { deepLink: string; expiresAt: string }

type GoogleStatus =
  | { state: "loading" }
  | { state: "disconnected" }
  | { state: "connected"; email: string }
  | { state: "error" }

interface IntegrationDef {
  name: string
  description: string
  icon: string | null
  iconBg: string
  initials?: string
  live?: boolean
  googleService?: boolean
}

interface SectionDef {
  id: string
  title: string
  subtitle: string
  accent: string
  integrations: IntegrationDef[]
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    id: "home",
    title: "Pick a home",
    subtitle: "Select where your Bird will live",
    accent: "#38bdf8",
    integrations: [
      { name: "Telegram",  description: "Send notes via DM",        icon: "/Telegram.svg",  iconBg: "", live: true },
      { name: "WhatsApp",  description: "Chat via WhatsApp",         icon: "/Whatsapp.svg",  iconBg: "" },
      { name: "iMessage",  description: "Chat via iMessage",         icon: "/IMessage.svg",  iconBg: "" },
    ],
  },
  {
    id: "scheduling",
    title: "Manage your schedule",
    subtitle: "Let Bird handle your calendar and time",
    accent: "#f59e0b",
    integrations: [
      { name: "Google Calendar",  description: "Sync meetings",         icon: "/google-calendar.svg",   iconBg: "", googleService: true },
      { name: "Apple Calendar",   description: "Sync iCal events",      icon: null, iconBg: "#FF3B30",  initials: "AC" },
      { name: "Outlook Calendar", description: "Sync Outlook calendar", icon: "/Microsoft_Outlook.svg", iconBg: "" },
      { name: "Fantastical",      description: "Natural language cal",  icon: null, iconBg: "#C0362B",  initials: "Fa" },
      { name: "Calendly",         description: "Manage your bookings",  icon: null, iconBg: "#006BFF",  initials: "Cl" },
    ],
  },
  {
    id: "email",
    title: "Manage your email",
    subtitle: "Let Bird read and draft emails on your behalf",
    accent: "#f43f5e",
    integrations: [
      { name: "Gmail",      description: "Read and draft emails", icon: "/google-gmail.svg",      iconBg: "", googleService: true },
      { name: "Outlook",    description: "Read Outlook inbox",    icon: "/Microsoft_Outlook.svg", iconBg: "" },
      { name: "Apple Mail", description: "Read Apple Mail",       icon: null, iconBg: "#1C6CE8",  initials: "AM" },
      { name: "ProtonMail", description: "Read ProtonMail",       icon: null, iconBg: "#6D4AFF",  initials: "PM" },
      { name: "Fastmail",   description: "Read Fastmail inbox",   icon: null, iconBg: "#F66A00",  initials: "Fm" },
      { name: "Hey",        description: "Read Hey inbox",        icon: null, iconBg: "#E02D0A",  initials: "He" },
    ],
  },
  {
    id: "files",
    title: "Manage your files",
    subtitle: "Let Bird search and create documents on your behalf",
    accent: "#34d399",
    integrations: [
      { name: "Google Drive", description: "Search and create docs", icon: "/google-drive.svg", iconBg: "", googleService: true },
      { name: "Dropbox",      description: "Search Dropbox files",   icon: null, iconBg: "#0061FF", initials: "Db" },
      { name: "OneDrive",     description: "Search OneDrive",        icon: null, iconBg: "#0078D4", initials: "OD" },
    ],
  },
  {
    id: "community",
    title: "Manage your community",
    subtitle: "Bring Bird into your team's workspace",
    accent: "#8b5cf6",
    integrations: [
      { name: "Slack",           description: "Slack workspace",  icon: "/Slack.svg",   iconBg: "" },
      { name: "Discord",         description: "Discord server",   icon: "/Discord.svg", iconBg: "" },
      { name: "Microsoft Teams", description: "Teams workspace",  icon: null, iconBg: "#6264A7", initials: "Te" },
      { name: "Notion",          description: "Notion workspace", icon: null, iconBg: "#404040", initials: "No" },
      { name: "Linear",          description: "Linear projects",  icon: null, iconBg: "#5E6AD2", initials: "Li" },
      { name: "GitHub",          description: "Repo activity",    icon: null, iconBg: "#333333", initials: "Gh" },
    ],
  },
  {
    id: "social",
    title: "Manage your social media",
    subtitle: "Let Bird monitor and post on your behalf",
    accent: "#ec4899",
    integrations: [
      { name: "X (Twitter)", description: "Posts and mentions", icon: null, iconBg: "#18181b", initials: "X"  },
      { name: "Instagram",   description: "Instagram posts",    icon: null, iconBg: "#E1306C", initials: "In" },
      { name: "TikTok",      description: "TikTok content",     icon: null, iconBg: "#010101", initials: "Ti" },
      { name: "LinkedIn",    description: "LinkedIn posts",     icon: null, iconBg: "#0077B5", initials: "Li" },
      { name: "YouTube",     description: "YouTube channel",    icon: null, iconBg: "#FF0000", initials: "Yt" },
      { name: "Threads",     description: "Threads posts",      icon: null, iconBg: "#3A3A3A", initials: "Th" },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InitialIcon({ initials, bg }: { initials: string; bg: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-white font-sans"
      style={{ background: bg }}
    >
      {initials}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [tgStatus, setTgStatus] = useState<TelegramStatus>({ state: "loading" })
  const [pairing, setPairing] = useState<PairResult | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [disconnectInput, setDisconnectInput] = useState("")
  const [disconnecting, setDisconnecting] = useState(false)
  const [showTgMenu, setShowTgMenu] = useState(false)

  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({ state: "loading" })
  const [showGoogleConnectModal, setShowGoogleConnectModal] = useState(false)
  const [showGoogleDisconnect, setShowGoogleDisconnect] = useState(false)
  const [googleDisconnectInput, setGoogleDisconnectInput] = useState("")
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false)
  const [showGoogleMenu, setShowGoogleMenu] = useState(false)

  useEffect(() => {
    fetch("/api/telegram/status")
      .then((r) => r.json())
      .then((data: { paired: boolean; displayName?: string }) => {
        setTgStatus(
          data.paired
            ? { state: "paired", displayName: data.displayName ?? "Telegram" }
            : { state: "unpaired" }
        )
      })
      .catch(() => setTgStatus({ state: "error" }))
  }, [])

  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((data: { connected: boolean; email?: string }) => {
        setGoogleStatus(
          data.connected
            ? { state: "connected", email: data.email ?? "" }
            : { state: "disconnected" }
        )
      })
      .catch(() => setGoogleStatus({ state: "error" }))
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setPairing(null)
    setConnectError(null)
    try {
      const res = await fetch("/api/telegram/pair", { method: "POST" })
      const data = (await res.json()) as PairResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Request failed")
      setPairing(data)
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Failed to generate pairing link — try again.")
    } finally {
      setConnecting(false)
    }
  }

  async function checkConnection() {
    setConnectError(null)
    try {
      const res = await fetch("/api/telegram/status")
      const data = (await res.json()) as { paired: boolean; displayName?: string }
      if (data.paired) {
        setTgStatus({ state: "paired", displayName: data.displayName ?? "Telegram" })
        setShowConnectModal(false)
        setPairing(null)
      } else {
        setConnectError("Not connected yet — make sure you tapped Start in Telegram.")
      }
    } catch {
      setConnectError("Could not check status — try again.")
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch("/api/telegram/unpair", { method: "DELETE" })
      setTgStatus({ state: "unpaired" })
      setPairing(null)
    } finally {
      setDisconnecting(false)
      setShowDisconnect(false)
      setDisconnectInput("")
    }
  }

  async function handleGoogleDisconnect() {
    setDisconnectingGoogle(true)
    try {
      await fetch("/api/google/disconnect", { method: "DELETE" })
      setGoogleStatus({ state: "disconnected" })
    } finally {
      setDisconnectingGoogle(false)
      setShowGoogleDisconnect(false)
      setGoogleDisconnectInput("")
    }
  }

  const isGoogleConnected = googleStatus.state === "connected"
  const googleDisconnectConfirmed =
    googleDisconnectInput.trim().toLowerCase() === "disconnect google"

  const isPaired = tgStatus.state === "paired"
  const disconnectConfirmed =
    disconnectInput.trim().toLowerCase() === "disconnect telegram"

  return (
    <div className="min-h-screen w-full px-8 md:px-14 py-12 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h2 className="m-0 text-base md:text-xl font-bold text-text-base font-sans" style={{ letterSpacing: "-0.005em" }}>
          Integrations
        </h2>
        <span
          className="mt-1.5 block text-[10px] sm:text-[9px] md:text-[11px] font-medium font-mono uppercase"
          style={{ letterSpacing: "0.12em", color: "#7A7A82" }}
        >
          CONNECT BIRD TO THE TOOLS YOU ALREADY USE
        </span>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-12">
        {SECTIONS.map((section) => (
          <div key={section.id}>

            {/* Section header */}
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-[3px] self-stretch rounded-full flex-shrink-0 mt-0.5"
                style={{ background: section.accent, minHeight: "2.5rem" }}
              />
              <div>
                <h2 className="text-base font-bold font-sans text-text-base leading-snug">
                  {section.title}
                </h2>
                <p className="text-xs font-sans text-text-muted mt-0.5">{section.subtitle}</p>
              </div>
            </div>

            {/* Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.integrations.map((integration) => {
                const isTelegram = integration.live === true
                const isGoogle = integration.googleService === true

                if (isTelegram) {
                  return (
                    <div
                      key={integration.name}
                      data-connected={isPaired ? "true" : undefined}
                      className="integ-card flex items-center gap-4 px-5 py-4 rounded-xl relative"
                    >

                      <Image
                        src="/Telegram.svg"
                        alt="Telegram"
                        width={40}
                        height={40}
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold font-sans text-text-base leading-none">
                            Telegram
                          </p>
                          {tgStatus.state === "loading" ? (
                            <div className="h-4 w-20 rounded bg-surface animate-pulse" />
                          ) : isPaired ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans border"
                              style={{
                                background: "rgba(52,211,153,0.1)",
                                borderColor: "rgba(52,211,153,0.22)",
                                color: "#34d399",
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              Connected
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-sans text-text-muted truncate">
                          {integration.description}
                        </p>
                      </div>

                      {!isPaired && tgStatus.state !== "loading" && (
                        <button
                          onClick={() => {
                            setShowConnectModal(true)
                            setPairing(null)
                            setConnectError(null)
                          }}
                          className="integ-connect-btn flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold font-sans transition-colors"
                        >
                          Connect
                        </button>
                      )}

                      {isPaired && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setShowTgMenu((v) => !v)}
                            className="p-1.5 rounded-lg transition-colors text-text-muted hover:text-text-base"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {showTgMenu && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowTgMenu(false)}
                              />
                              <div
                                className="integ-dropdown absolute right-0 bottom-8 z-20 rounded-xl py-1 min-w-[130px] shadow-xl"
                              >
                                <button
                                  onClick={() => {
                                    setShowTgMenu(false)
                                    setShowDisconnect(true)
                                    setDisconnectInput("")
                                  }}
                                  className="w-full text-center px-4 py-2 text-sm font-sans font-medium transition-colors"
                                  style={{ color: "#f87171" }}
                                >
                                  Disconnect
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }

                if (isGoogle) {
                  return (
                    <div
                      key={integration.name}
                      data-connected={isGoogleConnected ? "true" : undefined}
                      className="integ-card flex items-center gap-4 px-5 py-4 rounded-xl relative"
                    >
                      {integration.icon ? (
                        <Image src={integration.icon} alt={integration.name} width={40} height={40} className="flex-shrink-0" />
                      ) : (
                        <InitialIcon initials={integration.initials ?? integration.name[0]} bg={integration.iconBg} />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold font-sans text-text-base leading-none">
                            {integration.name}
                          </p>
                          {googleStatus.state === "loading" ? (
                            <div className="h-4 w-20 rounded bg-surface animate-pulse" />
                          ) : isGoogleConnected ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans border"
                              style={{ background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.22)", color: "#34d399" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              Connected
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-sans text-text-muted truncate">
                          {isGoogleConnected && googleStatus.state === "connected"
                            ? googleStatus.email
                            : integration.description}
                        </p>
                      </div>

                      {!isGoogleConnected && googleStatus.state !== "loading" && (
                        <button
                          onClick={() => setShowGoogleConnectModal(true)}
                          className="integ-connect-btn flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold font-sans transition-colors"
                        >
                          Connect
                        </button>
                      )}

                      {isGoogleConnected && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setShowGoogleMenu((v) => !v)}
                            className="p-1.5 rounded-lg transition-colors text-text-muted hover:text-text-base"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {showGoogleMenu && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowGoogleMenu(false)} />
                              <div className="integ-dropdown absolute right-0 bottom-8 z-20 rounded-xl py-1 min-w-[130px] shadow-xl">
                                <button
                                  onClick={() => {
                                    setShowGoogleMenu(false)
                                    setShowGoogleDisconnect(true)
                                    setGoogleDisconnectInput("")
                                  }}
                                  className="w-full text-center px-4 py-2 text-sm font-sans font-medium transition-colors"
                                  style={{ color: "#f87171" }}
                                >
                                  Disconnect
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div
                    key={integration.name}
                    className="integ-card flex items-center gap-4 px-5 py-4 rounded-xl"
                  >
                    {integration.icon ? (
                      <Image
                        src={integration.icon}
                        alt={integration.name}
                        width={40}
                        height={40}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <InitialIcon
                        initials={integration.initials ?? integration.name[0]}
                        bg={integration.iconBg}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-sans text-text-base leading-none mb-1">
                        {integration.name}
                      </p>
                      <p className="text-xs font-sans text-text-muted truncate">
                        {integration.description}
                      </p>
                    </div>
                    <span className="integ-soon-badge flex-shrink-0 text-[10px] font-semibold font-sans px-2.5 py-1 rounded-full">
                      Soon
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
        ))}
      </div>

      <div className="lg:hidden" style={{ height: '32px' }} aria-hidden="true" />

      {/* Connect Telegram modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConnectModal(false)
              setPairing(null)
              setConnectError(null)
            }
          }}
        >
          <div
            className="integ-modal w-full max-w-sm rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Image src="/Telegram.svg" alt="Telegram" width={28} height={28} />
                <span className="font-heading font-bold text-base text-text-base">
                  Connect Telegram
                </span>
              </div>
              <button
                onClick={() => {
                  setShowConnectModal(false)
                  setPairing(null)
                  setConnectError(null)
                }}
                className="text-text-muted hover:text-text-base transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {!pairing ? (
              <>
                <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
                  Link your Telegram account so Bird can receive your messages and send you
                  updates.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold font-sans transition-colors disabled:opacity-50"
                  style={{
                    background: "rgba(56,189,248,0.1)",
                    border: "1px solid rgba(56,189,248,0.22)",
                    color: "#38bdf8",
                  }}
                >
                  {connecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> Generating link…
                    </span>
                  ) : (
                    "Generate pairing link"
                  )}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-sans text-text-muted mb-4 leading-relaxed">
                  Click the link below to open your Bird in Telegram, then tap{" "}
                  <span className="font-mono text-text-base">Start</span>. The link expires in
                  15 minutes.
                </p>
                <a
                  href={pairing.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-sans mb-3 transition-colors"
                  style={{
                    background: "rgba(56,189,248,0.1)",
                    border: "1px solid rgba(56,189,248,0.22)",
                    color: "#38bdf8",
                  }}
                >
                  <ExternalLink size={13} /> Open in Telegram
                </a>
                <button
                  onClick={checkConnection}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-sans text-text-muted hover:text-text-dim transition-colors"
                >
                  <RefreshCw size={11} /> Check if connected
                </button>
              </>
            )}
            {connectError && (
              <p className="mt-3 text-xs font-sans text-center" style={{ color: "#f87171" }}>
                {connectError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Connect Google modal */}
      {showGoogleConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGoogleConnectModal(false) }}
        >
          <div
            className="integ-modal w-full max-w-sm rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-heading font-bold text-base text-text-base">Connect Google</span>
              <button onClick={() => setShowGoogleConnectModal(false)} className="text-text-muted hover:text-text-base transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
              Give Bird read and write access to your Google Calendar, Gmail, and Drive. You&apos;ll
              confirm all write actions before Bird executes them.
            </p>
            <a
              href="/api/google/connect"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-sans transition-colors"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)", color: "#34d399" }}
            >
              Connect Google Account
            </a>
          </div>
        </div>
      )}

      {/* Disconnect Google modal */}
      {showGoogleDisconnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGoogleDisconnect(false)
              setGoogleDisconnectInput("")
            }
          }}
        >
          <div
            className="integ-modal w-full max-w-sm rounded-2xl p-6"
          >
            <h2 className="font-heading font-bold text-base text-text-base mb-1">Disconnect Google?</h2>
            <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
              Bird will lose access to your Calendar, Gmail, and Drive. Type{" "}
              <span className="font-mono text-text-base">disconnect Google</span> to confirm.
            </p>
            <input
              type="text"
              value={googleDisconnectInput}
              onChange={(e) => setGoogleDisconnectInput(e.target.value)}
              placeholder="disconnect Google"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono bg-transparent text-text-base placeholder:text-text-muted focus:outline-none mb-4"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowGoogleDisconnect(false); setGoogleDisconnectInput("") }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.65)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleGoogleDisconnect}
                disabled={!googleDisconnectConfirmed || disconnectingGoogle}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans disabled:opacity-30 transition-colors"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              >
                {disconnectingGoogle ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect confirmation modal */}
      {showDisconnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDisconnect(false)
              setDisconnectInput("")
            }
          }}
        >
          <div
            className="integ-modal w-full max-w-sm rounded-2xl p-6"
          >
            <h2 className="font-heading font-bold text-base text-text-base mb-1">
              Disconnect Telegram?
            </h2>
            <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
              Bird will stop receiving your Telegram messages. Type{" "}
              <span className="font-mono text-text-base">disconnect Telegram</span> to confirm.
            </p>
            <input
              type="text"
              value={disconnectInput}
              onChange={(e) => setDisconnectInput(e.target.value)}
              placeholder="disconnect Telegram"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono bg-transparent text-text-base placeholder:text-text-muted focus:outline-none mb-4"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDisconnect(false)
                  setDisconnectInput("")
                }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!disconnectConfirmed || disconnecting}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans disabled:opacity-30 transition-colors"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                }}
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
