"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ExternalLink, RefreshCw, X } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface HQStats {
  entities: number
  connections: number
  messages: number
  lastActive: string | null
}

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
      { name: "Telegram",  description: "Send notes via DM",         icon: "/Telegram.svg",  iconBg: "", live: true },
      { name: "WhatsApp",  description: "Chat via WhatsApp",          icon: "/Whatsapp.svg",  iconBg: "" },
      { name: "iMessage",  description: "Chat via iMessage",          icon: "/IMessage.svg",  iconBg: "" },
    ],
  },
  {
    id: "scheduling",
    title: "Manage your schedule",
    subtitle: "Let Bird handle your calendar and time",
    accent: "#f59e0b",
    integrations: [
      { name: "Google Calendar",  description: "Sync meetings",          icon: "/google-calendar.svg",   iconBg: "" },
      { name: "Apple Calendar",   description: "Sync iCal events",       icon: null, iconBg: "#FF3B30",  initials: "AC" },
      { name: "Outlook Calendar", description: "Sync Outlook calendar",  icon: "/Microsoft_Outlook.svg", iconBg: "" },
      { name: "Fantastical",      description: "Natural language cal",   icon: null, iconBg: "#C0362B",  initials: "Fa" },
      { name: "Calendly",         description: "Manage your bookings",   icon: null, iconBg: "#006BFF",  initials: "Cl" },
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
      { name: "Apple Mail", description: "Read Apple Mail",       icon: null, iconBg: "#1C6CE8", initials: "AM" },
      { name: "ProtonMail", description: "Read ProtonMail",       icon: null, iconBg: "#6D4AFF", initials: "PM" },
      { name: "Fastmail",   description: "Read Fastmail inbox",   icon: null, iconBg: "#F66A00", initials: "Fm" },
      { name: "Hey",        description: "Read Hey inbox",        icon: null, iconBg: "#E02D0A", initials: "He" },
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
      { name: "X (Twitter)", description: "Posts and mentions",  icon: null, iconBg: "#18181b", initials: "X"  },
      { name: "Instagram",   description: "Instagram posts",     icon: null, iconBg: "#E1306C", initials: "In" },
      { name: "TikTok",      description: "TikTok content",      icon: null, iconBg: "#010101", initials: "Ti" },
      { name: "LinkedIn",    description: "LinkedIn posts",      icon: null, iconBg: "#0077B5", initials: "Li" },
      { name: "YouTube",     description: "YouTube channel",     icon: null, iconBg: "#FF0000", initials: "Yt" },
      { name: "Threads",     description: "Threads posts",       icon: null, iconBg: "#3A3A3A", initials: "Th" },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="flex-1 flex flex-col px-7 py-6 rounded-2xl font-sans"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <span className="text-[2rem] font-bold text-text-base leading-none mb-2 tabular-nums">{value}</span>
      <span className="text-[10px] text-text-muted uppercase tracking-widest">{label}</span>
    </div>
  )
}

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

export default function HQPage() {
  const [stats, setStats] = useState<HQStats | null>(null)
  const [tgStatus, setTgStatus] = useState<TelegramStatus>({ state: "loading" })
  const [pairing, setPairing] = useState<PairResult | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [disconnectInput, setDisconnectInput] = useState("")
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetch("/api/hq/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/telegram/status")
      .then((r) => r.json())
      .then((data: { paired: boolean; displayName?: string }) => {
        setTgStatus(data.paired
          ? { state: "paired", displayName: data.displayName ?? "Telegram" }
          : { state: "unpaired" }
        )
      })
      .catch(() => setTgStatus({ state: "error" }))
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setPairing(null)
    try {
      const res = await fetch("/api/telegram/pair", { method: "POST" })
      const data = await res.json() as PairResult & { error?: string }
      if (!res.ok) throw new Error(data.error)
      setPairing(data)
    } finally {
      setConnecting(false)
    }
  }

  async function checkConnection() {
    const res = await fetch("/api/telegram/status")
    const data = await res.json() as { paired: boolean; displayName?: string }
    if (data.paired) {
      setTgStatus({ state: "paired", displayName: data.displayName ?? "Telegram" })
      setShowConnectModal(false)
      setPairing(null)
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
  const disconnectConfirmed = disconnectInput.trim().toLowerCase() === "disconnect telegram"

  return (
    <div className="min-h-screen w-full px-8 md:px-14 py-12 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading font-bold text-4xl text-text-base">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h1>
      </div>

      {/* Stats bar */}
      <div className="flex items-stretch gap-4 mb-14">
        {stats ? (
          <>
            <StatCard label="Entities"    value={stats.entities} />
            <StatCard label="Connections" value={stats.connections} />
            <StatCard label="Messages"    value={stats.messages} />
            {stats.lastActive ? (
              <StatCard label="Last Active" value={formatRelative(stats.lastActive)} />
            ) : (
              <StatCard label="Last Active" value="—" />
            )}
          </>
        ) : (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-24 rounded-2xl bg-surface animate-pulse" />
          ))
        )}
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
                <h2 className="text-base font-bold font-sans text-text-base leading-snug">{section.title}</h2>
                <p className="text-xs font-sans text-text-muted mt-0.5">{section.subtitle}</p>
              </div>
            </div>

            {/* Integration tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.integrations.map((integration) => {
                const isTelegram = integration.live === true

                return (
                  <div
                    key={integration.name}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl"
                    style={
                      isTelegram && isPaired
                        ? { background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.18)" }
                        : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    {/* Icon */}
                    {integration.icon ? (
                      <Image src={integration.icon} alt={integration.name} width={40} height={40} className="flex-shrink-0" />
                    ) : (
                      <InitialIcon initials={integration.initials ?? integration.name[0]} bg={integration.iconBg} />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-sans text-text-base leading-none mb-1">{integration.name}</p>
                      <p className="text-xs font-sans text-text-muted truncate">{integration.description}</p>
                    </div>

                    {/* Status / Action */}
                    {isTelegram ? (
                      tgStatus.state === "loading" ? (
                        <div className="h-4 w-16 rounded bg-surface animate-pulse flex-shrink-0" />
                      ) : isPaired ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium font-sans text-emerald-400 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          Selected
                        </span>
                      ) : (
                        <button
                          onClick={() => { setShowConnectModal(true); setPairing(null) }}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.8)" }}
                        >
                          Connect
                        </button>
                      )
                    ) : (
                      <span
                        className="flex-shrink-0 text-[10px] font-semibold font-sans px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#52525b" }}
                      >
                        Soon
                      </span>
                    )}
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
          onClick={(e) => { if (e.target === e.currentTarget) { setShowConnectModal(false); setPairing(null) } }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Image src="/Telegram.svg" alt="Telegram" width={28} height={28} />
                <span className="font-heading font-bold text-base text-text-base">Connect Telegram</span>
              </div>
              <button
                onClick={() => { setShowConnectModal(false); setPairing(null) }}
                className="text-text-muted hover:text-text-base transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {!pairing ? (
              <>
                <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
                  Link your Telegram account so Bird can receive your messages and send you updates.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold font-sans transition-colors disabled:opacity-50"
                  style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.22)", color: "#38bdf8" }}
                >
                  {connecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> Generating link…
                    </span>
                  ) : "Generate pairing link"}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-sans text-text-muted mb-4 leading-relaxed">
                  Click the link below to open your Bird in Telegram, then tap{" "}
                  <span className="font-mono text-text-base">Start</span>. The link expires in 15 minutes.
                </p>
                <a
                  href={pairing.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-sans mb-3 transition-colors"
                  style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.22)", color: "#38bdf8" }}
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
          </div>
        </div>
      )}

      {/* Disconnect confirmation modal */}
      {showDisconnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDisconnect(false); setDisconnectInput("") } }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="font-heading font-bold text-base text-text-base mb-1">Disconnect Telegram?</h2>
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
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDisconnect(false); setDisconnectInput("") }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!disconnectConfirmed || disconnecting}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans disabled:opacity-30 transition-colors"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
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
