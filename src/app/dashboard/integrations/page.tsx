"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ExternalLink, RefreshCw } from "lucide-react"

type Status =
  | { state: "loading" }
  | { state: "unpaired" }
  | { state: "paired"; displayName: string }
  | { state: "error"; message: string }

type PairResult = { deepLink: string; expiresAt: string }

const COMING_SOON = [
  { name: "Slack",              icon: "/Slack.svg",              description: "Get Bird updates and send notes from Slack" },
  { name: "WhatsApp",           icon: "/Whatsapp.svg",           description: "Chat with Bird directly from WhatsApp" },
  { name: "Discord",            icon: "/Discord.svg",            description: "Bring Bird into your Discord server" },
  { name: "Gmail",              icon: "/google-gmail.svg",       description: "Let Bird read and draft emails on your behalf" },
  { name: "Google Calendar",    icon: "/google-calendar.svg",    description: "Let Bird manage your meetings and schedule" },
  { name: "Google Drive",       icon: "/google-drive.svg",       description: "Give Bird access to your files and docs" },
  { name: "Microsoft Outlook",  icon: "/Microsoft_Outlook.svg",  description: "Connect Bird to your Outlook inbox" },
  { name: "iMessage",           icon: "/IMessage.svg",           description: "Send notes to Bird from iMessage" },
]

const TOTAL = 1 + COMING_SOON.length

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Status>({ state: "loading" })
  const [pairing, setPairing] = useState<PairResult | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [disconnectInput, setDisconnectInput] = useState("")
  const [disconnecting, setDisconnecting] = useState(false)

  async function fetchStatus() {
    setStatus({ state: "loading" })
    try {
      const res = await fetch("/api/telegram/status")
      const data = await res.json() as { paired: boolean; displayName?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch status")
      setStatus(data.paired
        ? { state: "paired", displayName: data.displayName ?? "Telegram" }
        : { state: "unpaired" }
      )
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  useEffect(() => { fetchStatus() }, [])

  async function handleConnect() {
    setConnecting(true)
    setPairing(null)
    try {
      const res = await fetch("/api/telegram/pair", { method: "POST" })
      const data = await res.json() as PairResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to generate pairing link")
      setPairing(data)
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch("/api/telegram/unpair", { method: "DELETE" })
      setStatus({ state: "unpaired" })
      setPairing(null)
    } finally {
      setDisconnecting(false)
      setShowDisconnect(false)
      setDisconnectInput("")
    }
  }

  const isPaired = status.state === "paired"
  const connectedCount = isPaired ? 1 : 0
  const disconnectConfirmed = disconnectInput.trim().toLowerCase() === "disconnect telegram"

  return (
    <div className="flex items-start justify-center min-h-screen w-full pt-16 pb-10 px-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-text-base mb-1.5">Integrations</h1>
          <p className="text-sm font-sans text-text-muted leading-relaxed">
            Connect Bird to the tools you already use.
          </p>
        </div>

        {/* Stats bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-8 font-sans text-sm"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="font-semibold text-text-base">
            {status.state === "loading" ? (
              <span className="inline-block h-4 w-28 rounded bg-surface animate-pulse align-middle" />
            ) : (
              `${connectedCount} of ${TOTAL} connected`
            )}
          </span>
          <span className="text-border">·</span>
          <span className="text-text-muted">Apps 1/{TOTAL}</span>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-3 mb-2">
          <p className="text-[10px] font-bold font-sans text-text-muted uppercase tracking-widest whitespace-nowrap">
            Connected Apps
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>
        <p className="text-xs text-text-muted font-sans mb-4">
          Connect these so Bird can message you and sync your tools.
        </p>

        {/* Cards */}
        <div className="flex flex-col gap-3">

          {/* Telegram — live */}
          <div
            className="rounded-xl px-5 py-4 relative overflow-hidden"
            style={{
              background: isPaired ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.025)",
              border: isPaired ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {isPaired && (
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                style={{ background: "linear-gradient(180deg, #34d399, #10b981)" }}
              />
            )}
            <div className="flex items-center gap-4">
              <Image src="/Telegram.svg" alt="Telegram" width={40} height={40} className="flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold font-sans text-text-base">Telegram</span>
                  {status.state === "loading" ? (
                    <div className="h-4 w-24 rounded bg-surface animate-pulse" />
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-sans border"
                      style={isPaired
                        ? { background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.22)", color: "#34d399" }
                        : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#71717a" }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: isPaired ? "#34d399" : "#52525b" }}
                      />
                      {isPaired ? `Connected as ${status.displayName}` : "Not connected"}
                    </span>
                  )}
                </div>
                <p className="text-xs font-sans text-text-muted">Send notes to Bird via Telegram DM</p>

                {status.state === "unpaired" && pairing && (
                  <div className="mt-3 space-y-2.5">
                    <p className="text-xs text-text-dim font-sans leading-relaxed">
                      Click the link below to open Bird in Telegram, then tap{" "}
                      <span className="font-mono text-text-base">Start</span>. Expires in 15 minutes.
                    </p>
                    <div className="flex items-center gap-3">
                      <a
                        href={pairing.deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors"
                        style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.22)", color: "#38bdf8" }}
                      >
                        <ExternalLink size={11} />
                        Open in Telegram
                      </a>
                      <button
                        onClick={fetchStatus}
                        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-dim font-sans transition-colors"
                      >
                        <RefreshCw size={11} />
                        Check if connected
                      </button>
                    </div>
                  </div>
                )}

                {status.state === "error" && (
                  <p className="text-xs text-red-400 font-sans mt-2">{status.message}</p>
                )}
              </div>

              {status.state !== "loading" && !pairing && !isPaired && (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-colors disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.85)" }}
                >
                  {connecting ? (
                    <><RefreshCw size={11} className="animate-spin" />Generating…</>
                  ) : "Connect"}
                </button>
              )}
              {isPaired && (
                <button
                  onClick={() => { setShowDisconnect(true); setDisconnectInput("") }}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-colors"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Coming soon cards */}
          {COMING_SOON.map((app) => (
            <div
              key={app.name}
              className="rounded-xl px-5 py-4 opacity-60"
              style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-4">
                <Image src={app.icon} alt={app.name} width={40} height={40} className="flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold font-sans text-text-base">{app.name}</span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium font-sans border"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#52525b" }}
                    >
                      Coming soon
                    </span>
                  </div>
                  <p className="text-xs font-sans text-text-muted">{app.description}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Disconnect confirmation modal */}
      {showDisconnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDisconnect(false); setDisconnectInput("") } }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h2 className="font-heading font-bold text-base text-text-base mb-1">Disconnect Telegram?</h2>
            <p className="text-xs font-sans text-text-muted mb-5 leading-relaxed">
              Bird will no longer receive messages from your Telegram account. To confirm, type{" "}
              <span className="font-mono text-text-base">disconnect Telegram</span> below.
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
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!disconnectConfirmed || disconnecting}
                className="flex-1 py-2 rounded-lg text-xs font-semibold font-sans transition-colors disabled:opacity-30"
                style={{ background: disconnectConfirmed ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
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
