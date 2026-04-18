"use client"

import { useState, useEffect, useRef } from "react"
import { buildPrompt } from "@/lib/buildPrompt"

function buildMcpSnippet(token: string): string {
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

type Project = { name: string }

export default function ConnectPage() {
  const [token, setToken] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [mcpCopied, setMcpCopied] = useState(false)
  const [showMcp, setShowMcp] = useState(false)
  const [connected, setConnected] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/connection/token")
      .then(r => r.json())
      .then((data: { token?: string }) => {
        if (data.token) setToken(data.token)
      })
      .catch(() => {})

    fetch("/api/projects")
      .then(r => r.json())
      .then((data: { projects?: Project[] }) => {
        const list = data.projects ?? []
        setProjects(list)
        if (list.length > 0) setSelectedProject(list[0].name)
      })
      .catch(() => {})

    function checkStatus() {
      fetch("/api/connection/status")
        .then(r => r.json())
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

  function handleCopy() {
    if (!token || !selectedProject) return
    navigator.clipboard.writeText(buildPrompt(token, selectedProject)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleMcpCopy() {
    if (!token) return
    navigator.clipboard.writeText(buildMcpSnippet(token)).then(() => {
      setMcpCopied(true)
      setTimeout(() => setMcpCopied(false), 2000)
    })
  }

  const hasProjects = projects.length > 0

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Connect your coding tool</h1>
      <p className="text-text-dim font-sans text-sm mb-8">
        Paste this into your project&apos;s{" "}
        <code className="font-mono text-xs bg-depth border border-border px-1.5 py-0.5 rounded text-text-dim">
          CLAUDE.md
        </code>{" "}
        or coding tool system instructions. BirdBot will start remembering your sessions.
      </p>

      {hasProjects ? (
        <>
          {/* Project selector */}
          {projects.length > 1 && (
            <div className="mb-4">
              <label className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest block mb-2">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full bg-depth border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-text-base focus:outline-none focus:border-blue transition-colors"
              >
                {projects.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Prompt block */}
          <div className="relative rounded-xl bg-depth border border-border overflow-hidden mb-4">
            {!token ? (
              <div className="p-5 h-48 flex items-center justify-center">
                <span className="text-xs text-text-muted font-mono animate-pulse">Loading your token…</span>
              </div>
            ) : (
              <pre className="text-xs font-mono text-text-dim p-5 overflow-x-auto leading-relaxed whitespace-pre pr-20">
                {buildPrompt(token, selectedProject)}
              </pre>
            )}
            <button
              onClick={handleCopy}
              disabled={!token || !selectedProject}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base hover:border-border/60 transition-colors disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-border border-dashed text-center gap-2 mb-4">
          <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
          <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed">
            Create a project in the Projects tab to get your personalized connection prompt.
          </p>
        </div>
      )}

      {/* MCP toggle */}
      <button
        onClick={() => setShowMcp(v => !v)}
        className="text-xs text-text-muted hover:text-text-dim font-sans underline underline-offset-2 mb-4 block transition-colors"
      >
        {showMcp ? "Hide MCP config" : "Prefer MCP config instead?"}
      </button>

      {showMcp && (
        <div className="relative rounded-xl bg-depth border border-border overflow-hidden mb-6">
          {!token ? (
            <div className="p-5 h-36 flex items-center justify-center">
              <span className="text-xs text-text-muted font-mono animate-pulse">Loading…</span>
            </div>
          ) : (
            <pre className="text-xs font-mono text-text-dim p-5 overflow-x-auto leading-relaxed whitespace-pre">
              {buildMcpSnippet(token)}
            </pre>
          )}
          <button
            onClick={handleMcpCopy}
            disabled={!token}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base hover:border-border/60 transition-colors disabled:opacity-40"
          >
            {mcpCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Connection status */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
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
            <span className="text-xs font-semibold font-sans text-text-muted">Waiting for connection…</span>
          </>
        )}
      </div>
    </div>
  )
}
