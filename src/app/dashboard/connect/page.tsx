"use client"

import { useState, useEffect, useRef } from "react"

const TOOLS = [
  { id: "claude", label: "Claude Code", file: "~/.claude/settings.json" },
  { id: "cursor", label: "Cursor",      file: "~/.cursor/mcp.json" },
  { id: "windsurf", label: "Windsurf",  file: "~/.codeium/windsurf/mcp_config.json" },
] as const

function buildSnippet(token: string) {
  return `{
  "mcpServers": {
    "birdbot": {
      "command": "npx",
      "args": ["-y", "birdbot-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_KEY_HERE",
        "BIRDBOT_USER_TOKEN": "${token}"
      }
    }
  }
}`
}

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState<string>("claude")
  const [copied, setCopied] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const [connected, setConnected] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    localStorage.setItem("bb_connected", "1")

    fetch("/api/connection/token")
      .then((r) => r.json())
      .then((data: { token?: string }) => {
        if (data.token) setToken(data.token)
        else setTokenError(true)
      })
      .catch(() => setTokenError(true))

    function checkStatus() {
      fetch("/api/connection/status")
        .then((r) => r.json())
        .then((data: { connected?: boolean; lastSeenAt?: string | null }) => {
          if (data.connected) {
            setConnected(true)
            setLastSeenAt(data.lastSeenAt ?? null)
            if (pollRef.current) clearInterval(pollRef.current)
          }
        })
        .catch(() => {})
    }

    checkStatus()
    pollRef.current = setInterval(checkStatus, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const tool = TOOLS.find((t) => t.id === activeTab)!
  const snippet = buildSnippet(token ?? "YOUR_TOKEN_HERE")

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Connect your coding tool</h1>
      <p className="text-text-dim font-sans text-sm mb-8">
        Paste the snippet below into your MCP config file and restart your tool. BirdBot will start remembering your sessions.
      </p>

      {/* Tool tabs */}
      <div className="flex gap-1 bg-depth border border-border rounded-xl p-1 mb-4">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold font-sans transition-colors ${
              activeTab === t.id
                ? "bg-blue text-white"
                : "text-text-muted hover:text-text-base"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* File path */}
      <p className="text-[11px] text-text-muted font-mono mb-3">
        Config file: <span className="text-text-dim">{tool.file}</span>
      </p>

      {/* Snippet */}
      <div className="relative rounded-xl bg-depth border border-border overflow-hidden mb-4">
        {!token && !tokenError ? (
          <div className="p-5 h-44 flex items-center justify-center">
            <span className="text-xs text-text-muted font-mono animate-pulse">Loading your token...</span>
          </div>
        ) : (
          <pre className="text-xs font-mono text-text-dim p-5 overflow-x-auto leading-relaxed whitespace-pre">
            {snippet}
          </pre>
        )}
        <button
          onClick={handleCopy}
          disabled={!token}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base hover:border-border/60 transition-colors disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border mb-6 ${
        connected ? "border-emerald/30 bg-emerald/5" : "border-border bg-panel"
      }`}>
        {connected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald flex-shrink-0" />
            <span className="text-xs font-semibold font-sans text-emerald">Connected</span>
            {lastSeenAt && (
              <span className="text-xs text-text-muted font-sans ml-auto">
                Last seen: {new Date(lastSeenAt).toLocaleString()}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold font-sans text-text-muted">Waiting for connection...</span>
          </>
        )}
      </div>

      {/* API key note */}
      <div className="flex gap-3 p-4 rounded-xl bg-gold/5 border border-gold/20 mb-6">
        <span className="text-gold text-base flex-shrink-0 mt-0.5">ℹ</span>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-gold font-sans">Anthropic API key required</p>
          <p className="text-xs text-text-muted font-sans leading-relaxed">
            Replace <span className="font-mono text-gold">YOUR_KEY_HERE</span> with a key from{" "}
            <span className="font-mono text-text-dim">console.anthropic.com</span>. This key stays on your machine — BirdBot never sees it.
          </p>
        </div>
      </div>

      {/* Step-by-step */}
      <div className="border-t border-border pt-6">
        <h2 className="font-heading font-semibold text-sm text-text-base mb-4">What to do next</h2>
        <ol className="flex flex-col gap-3">
          {[
            "Open your tool's MCP config file at the path shown above",
            "Paste the snippet (merge it in if you already have other MCP servers)",
            "Replace YOUR_KEY_HERE with your Anthropic API key",
            "Save and restart your coding tool",
            "At the start of your next session, ask it to call get_briefing",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm font-sans text-text-dim">
              <span className="w-5 h-5 rounded-full bg-panel border border-border flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
