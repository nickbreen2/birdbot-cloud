"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ExternalLink, RefreshCw, X } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type TelegramStatus =
  | { state: "loading" }
  | { state: "unpaired" }
  | { state: "paired"; displayName: string }
  | { state: "error" }

type PairResult = { deepLink: string; expiresAt: string }

interface IntegrationDef {
  name: string
  description: string
  icon: string | null
  iconBg: string
  initials?: string
  live?: boolean
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
      { name: "Google Calendar",  description: "Sync meetings",         icon: "/google-calendar.svg",   iconBg: "" },
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
      { name: "Gmail",      description: "Read and draft emails", icon: "/google-gmail.svg",      iconBg: "" },
      { name: "Outlook",    description: "Read Outlook inbox",    icon: "/Microsoft_Outlook.svg", iconBg: "" },
      { name: "Apple Mail", description: "Read Apple Mail",       icon: null, iconBg: "#1C6CE8",  initials: "AM" },
      { name: "ProtonMail", description: "Read ProtonMail",       icon: null, iconBg: "#6D4AFF",  initials: "PM" },
      { name: "Fastmail",   description: "Read Fastmail inbox",   icon: null, iconBg: "#F66A00",  initials: "Fm" },
      { name: "Hey",        description: "Read Hey inbox",        icon: null, iconBg: "#E02D0A",  initials: "He" },
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

  async function handleConnect() {
    setConnecting(true)
    setPairing(null)
    setConnectError(null)
    try {
      const res = await fetch("/api/telegram/pair", { method: "POST" })
      const data = (await res.json()) as PairResult & { error?: string }
      if (!res.ok) throw new Error(data.error)
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

  const isPaired = tgStatus.state === "paired"
  const disconnectConfirmed =
    disconnectInput.trim().toLowerCase() === "disconnect telegram"

  return (
    <div className="min-h-screen w-full px-8 md:px-14 py-12 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading font-bold text-4xl text-text-base">Integrations</h1>
        <p className="text-sm font-sans text-text-muted mt-2">
          Connect Bird to the tools you already use.
        </p>
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

                if (isTelegram) {
                  return (
                    <div
                      key={integration.name}
                      className="flex items-center gap-4 px-5 py-4 rounded-xl relative overflow-hidden"
                      style={
                        isPaired
                          ? {
                              background: "rgba(52,211,153,0.05)",
                              border: "1px solid rgba(52,211,153,0.22)",
                            }
                          : {
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.15)",
                            }
                      }
                    >
                      {isPaired && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ background: "linear-gradient(180deg, #34d399, #10b981)" }}
                        />
                      )}

                      <Image
                        src="/Telegram.svg"
                        alt="Telegram"
                        width={40}
                        height={40}
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold font-sans text-text-base leading-none">
                            Telegram
                          </p>
                          {tgStatus.state === "loading" ? (
                            <div className="h-4 w-24 rounded bg-surface animate-pulse" />
                          ) : isPaired && tgStatus.state === "paired" ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans border"
                              style={{
                                background: "rgba(52,211,153,0.1)",
                                borderColor: "rgba(52,211,153,0.22)",
                                color: "#34d399",
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              Connected as {tgStatus.displayName}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-sans text-text-muted truncate">
                          {integration.description}
                        </p>
                      </div>

                      {tgStatus.state === "loading" ? (
                        <div className="h-4 w-16 rounded bg-surface animate-pulse flex-shrink-0" />
                      ) : isPaired ? (
                        <button
                          onClick={() => {
                            setShowDisconnect(true)
                            setDisconnectInput("")
                          }}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: "#f87171",
                          }}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowConnectModal(true)
                            setPairing(null)
                            setConnectError(null)
                          }}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.16)",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  )
                }

                return (
                  <div
                    key={integration.name}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
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
                    <span
                      className="flex-shrink-0 text-[10px] font-semibold font-sans px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        color: "#71717a",
                      }}
                    >
                      Soon
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
        ))}
      </div>

      {/* Connect Telegram modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConnectModal(false)
              setPairing(null)
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.18)" }}
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
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.18)" }}
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
