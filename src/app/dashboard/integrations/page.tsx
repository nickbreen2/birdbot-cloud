"use client"

import { useState, useEffect } from "react"
import { Send, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react"

type Status =
  | { state: "loading" }
  | { state: "unpaired" }
  | { state: "paired"; displayName: string }
  | { state: "error"; message: string }

type PairResult = { deepLink: string; expiresAt: string }

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Status>({ state: "loading" })
  const [pairing, setPairing] = useState<PairResult | null>(null)
  const [connecting, setConnecting] = useState(false)

  async function fetchStatus() {
    setStatus({ state: "loading" })
    try {
      const res = await fetch("/api/telegram/status")
      const data = await res.json() as { paired: boolean; displayName?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch status")
      setStatus(data.paired
        ? { state: "paired", displayName: data.displayName! }
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

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-8">Integrations</h1>

      <section>
        <h2 className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-4">
          Telegram
        </h2>

        <div className="p-4 rounded-xl bg-panel border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue/10 border border-blue/20 flex items-center justify-center flex-shrink-0">
              <Send size={16} className="text-blue-bright" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-base font-sans">Telegram</p>
              <p className="text-xs text-text-muted font-sans">Send notes to your Bird via DM</p>
            </div>
          </div>

          {status.state === "loading" && (
            <p className="text-xs text-text-muted font-sans">Checking connection…</p>
          )}

          {status.state === "paired" && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-400 font-sans font-medium">
                Connected as {status.displayName}
              </span>
            </div>
          )}

          {status.state === "unpaired" && !pairing && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold font-sans bg-blue/10 border border-blue/20 text-blue-bright hover:bg-blue/20 transition-colors disabled:opacity-50"
            >
              {connecting
                ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
                : <><Send size={14} /> Connect Telegram</>
              }
            </button>
          )}

          {status.state === "unpaired" && pairing && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-text-dim font-sans leading-relaxed">
                Click the link below to open your Bird in Telegram, then tap{" "}
                <span className="font-mono text-text-base">Start</span>. The link expires in 15 minutes.
              </p>
              <a
                href={pairing.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold font-sans bg-blue/10 border border-blue/20 text-blue-bright hover:bg-blue/20 transition-colors"
              >
                <ExternalLink size={14} />
                Open in Telegram
              </a>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-2 text-xs text-text-muted hover:text-text-dim font-sans transition-colors"
              >
                <RefreshCw size={12} />
                Check if connected
              </button>
            </div>
          )}

          {status.state === "error" && (
            <p className="text-xs text-red-400 font-sans mt-2">{status.message}</p>
          )}
        </div>
      </section>
    </div>
  )
}
