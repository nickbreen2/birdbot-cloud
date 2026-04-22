"use client"

import { useState, useEffect, useRef } from "react"
import { Copy, Check, Eye, EyeOff, BookOpen, GitBranch, Layers, ChevronDown } from "lucide-react"

type IDE = "claude-code" | "cursor" | "windsurf" | "cline"

const IDE_TABS: { id: IDE; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor",      label: "Cursor" },
  { id: "windsurf",    label: "Windsurf" },
  { id: "cline",       label: "Cline" },
]

const TOOLS = [
  {
    icon: BookOpen,
    title: "Session Memory",
    description: "Automatically logs what you build each coding session — no manual notes needed.",
  },
  {
    icon: GitBranch,
    title: "Decision Tracking",
    description: "Records key architectural and design choices with full context and reasoning.",
  },
  {
    icon: Layers,
    title: "Project Briefings",
    description: "Gives your agent a full context briefing from past sessions before starting work.",
  },
]

const IDE_PATH: Record<Exclude<IDE, "claude-code">, string | null> = {
  cursor:   "~/.cursor/mcp.json",
  windsurf: "~/.codeium/windsurf/mcp_config.json",
  cline:    null,
}

function buildCommand(token: string): string {
  return `claude mcp add birdbot --scope user -e BIRDBOT_USER_TOKEN=${token} -- npx -y birdbot-mcp`
}

function buildJsonConfig(token: string): string {
  return `{
  "mcpServers": {
    "birdbot": {
      "command": "npx",
      "args": ["-y", "birdbot-mcp"],
      "env": {
        "BIRDBOT_USER_TOKEN": "${token}"
      }
    }
  }
}`
}

function CopyButton({ text, disabled }: { text: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handle}
      disabled={disabled}
      className="p-1.5 rounded-md text-text-muted hover:text-text-base transition-colors disabled:opacity-40 flex-shrink-0"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  )
}

function StepNum({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-surface border border-border text-text-dim text-[11px] font-bold font-sans flex items-center justify-center flex-shrink-0">
      {n}
    </span>
  )
}

export default function ConnectPage() {
  const [token, setToken]           = useState<string | null>(null)
  const [revealed, setRevealed]     = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [connected, setConnected]   = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const [activeIde, setActiveIde]   = useState<IDE>("claude-code")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/connection/token")
      .then(r => r.json())
      .then((data: { token?: string }) => { if (data.token) setToken(data.token) })
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

  function copyToken() {
    if (!token) return
    navigator.clipboard.writeText(token).then(() => {
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    })
  }

  const masked = token ? token.slice(0, 8) + "•".repeat(28) : ""

  return (
    <div className="p-6 md:p-10 min-h-full">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base mb-1">MCP Setup</h1>
          <p className="text-text-dim font-sans text-sm">
            Install BirdBot in your coding tool. Sessions and decisions will appear in your dashboard automatically.
          </p>
        </div>

        {/* Tools */}
        <section>
          <h2 className="text-sm font-semibold font-sans text-text-base mb-3">Tools</h2>
          <div className="flex flex-col gap-2">
            {TOOLS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel">
                <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} className="text-text-dim" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold font-sans text-text-base mb-0.5">{title}</p>
                  <p className="text-xs font-sans text-text-muted leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Token */}
        <section>
          <h2 className="text-sm font-semibold font-sans text-text-base mb-3">API Key</h2>
          <div className="flex items-center gap-2 bg-panel border border-border rounded-xl px-4 py-2.5">
            <code className="flex-1 text-sm font-mono text-text-dim overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
              {!token ? "Loading…" : revealed ? token : masked}
            </code>
            <button
              onClick={() => setRevealed(v => !v)}
              disabled={!token}
              title={revealed ? "Hide" : "Reveal"}
              className="p-1.5 rounded-md text-text-muted hover:text-text-base transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={copyToken}
              disabled={!token}
              title="Copy"
              className="p-1.5 rounded-md text-text-muted hover:text-text-base transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {tokenCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </section>

        {/* Install */}
        <section>
          <h2 className="text-sm font-semibold font-sans text-text-base mb-0.5">Install</h2>
          <p className="text-xs font-sans text-text-muted mb-3">Select your IDE and follow the instructions below.</p>

          <div className="border border-border rounded-xl overflow-hidden bg-panel">
            {/* IDE tabs */}
            <div className="flex items-center px-2 border-b border-border">
              {IDE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveIde(tab.id)}
                  className={`px-4 py-3 text-sm font-sans font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeIde === tab.id
                      ? "border-blue-bright text-text-base"
                      : "border-transparent text-text-muted hover:text-text-dim"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-6">
              {activeIde === "claude-code" ? (
                <>
                  {/* Step 1 */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <StepNum n={1} />
                      <p className="text-sm font-semibold font-sans text-text-base">Run Installation Command</p>
                    </div>
                    <p className="text-xs font-sans text-text-muted mb-2 ml-9">
                      Run this command in your terminal to add BirdBot to Claude Code:
                    </p>
                    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5 ml-9">
                      <code className="flex-1 text-xs font-mono text-text-dim overflow-x-auto whitespace-nowrap">
                        {token ? buildCommand(token) : "Loading…"}
                      </code>
                      <CopyButton text={token ? buildCommand(token) : ""} disabled={!token} />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <StepNum n={2} />
                      <p className="text-sm font-semibold font-sans text-text-base">Verify Installation</p>
                    </div>
                    <p className="text-xs font-sans text-text-muted mb-3 ml-9">
                      After running the command, BirdBot MCP will be available in Claude Code.
                    </p>
                    <div className="flex flex-col gap-2 ml-9">
                      <VerifyItem type="check" text="The MCP server will be automatically configured" />
                      <VerifyItem type="check" text="You can start tracking sessions immediately" />
                      <VerifyItem type="sync" text={
                        <span>
                          To verify, run:{" "}
                          <code className="font-mono text-xs bg-surface border border-border px-1.5 py-0.5 rounded text-text-dim">
                            claude mcp list
                          </code>
                        </span>
                      } />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 1 */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <StepNum n={1} />
                      <p className="text-sm font-semibold font-sans text-text-base">Open your MCP config file</p>
                    </div>
                    {IDE_PATH[activeIde as Exclude<IDE, "claude-code">] ? (
                      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5 ml-9">
                        <code className="flex-1 text-xs font-mono text-text-dim overflow-x-auto whitespace-nowrap">
                          {IDE_PATH[activeIde as Exclude<IDE, "claude-code">]}
                        </code>
                        <CopyButton text={IDE_PATH[activeIde as Exclude<IDE, "claude-code">]!} disabled={false} />
                      </div>
                    ) : (
                      <p className="text-xs font-sans text-text-muted ml-9">
                        Open VS Code → Extensions → Cline → Settings → MCP Servers
                      </p>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <StepNum n={2} />
                      <p className="text-sm font-semibold font-sans text-text-base">Add BirdBot to your config</p>
                    </div>
                    <div className="relative bg-surface border border-border rounded-lg overflow-hidden ml-9">
                      <pre className="text-xs font-mono text-text-dim p-4 pr-12 overflow-x-auto leading-relaxed whitespace-pre">
                        {token ? buildJsonConfig(token) : "Loading…"}
                      </pre>
                      <div className="absolute top-2.5 right-2.5">
                        <CopyButton text={token ? buildJsonConfig(token) : ""} disabled={!token} />
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3">
                    <StepNum n={3} />
                    <p className="text-sm font-semibold font-sans text-text-base">Restart your IDE to activate BirdBot</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Connection status */}
        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${
          connected ? "border-emerald-400/30 bg-emerald-400/5" : "border-border bg-panel"
        }`}>
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
          </span>
          {connected ? (
            <>
              <span className="text-sm font-semibold font-sans text-emerald-400">Connected</span>
              {lastSeenAt && (
                <span className="text-xs text-text-muted font-sans ml-auto">
                  Last seen {new Date(lastSeenAt).toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-sans text-text-muted">Waiting for first connection…</span>
          )}
        </div>

        {/* Troubleshooting */}
        <Troubleshooting />

      </div>
    </div>
  )
}

function VerifyItem({ type, text }: { type: "check" | "sync"; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {type === "check" ? (
        <Check size={13} className="text-emerald-400 flex-shrink-0" />
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-text-muted flex-shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      )}
      <span className="text-xs font-sans text-text-muted">{text}</span>
    </div>
  )
}

// ─── Troubleshooting ──────────────────────────────────────────────────────────

type IssueCard = { title: string; bullets: string[]; code?: string }

const COMMON_ISSUES: IssueCard[] = [
  {
    title: "BirdBot MCP not connecting",
    bullets: [
      "Restart your coding tool after running the install command",
      "Verify the MCP is installed: run claude mcp list (Claude Code)",
      "Make sure Node.js ≥ 18 is installed: node --version",
    ],
  },
  {
    title: "No sessions appearing in dashboard",
    bullets: [
      "BirdBot tracks sessions automatically — just start coding with your agent",
      "Check the connection status shows green on this page",
      "Make sure your coding tool is using the BirdBot MCP tools",
    ],
  },
  {
    title: "MCP server fails to start",
    bullets: [
      "Update npm to the latest version: npm install -g npm@latest",
      "Try running npx birdbot-mcp directly in terminal to see errors",
      "Check your internet connection and firewall settings",
    ],
  },
]

const IDE_ISSUES: Record<string, IssueCard[]> = {
  "Claude Code": [
    {
      title: "BirdBot not showing in MCP list",
      bullets: [
        "Remove and re-add the server: claude mcp remove birdbot, then run the install command again",
        "Make sure Claude Code is updated to the latest version",
        "Run claude mcp list to confirm the server was registered",
      ],
    },
    {
      title: "Sessions not being tracked",
      bullets: [
        "Ensure your agent prompt references the BirdBot MCP tools",
        "Check that CLAUDE.md includes your BirdBot project instructions",
        "Start a new session — BirdBot tracks from the point of connection",
      ],
    },
  ],
  Cursor: [
    {
      title: "Cursor not picking up BirdBot",
      bullets: [
        "Verify the config file exists at ~/.cursor/mcp.json",
        "Restart Cursor completely (quit and reopen) after saving the config",
        "Check the JSON file for syntax errors using a JSON validator",
      ],
    },
    {
      title: "Config file not found",
      bullets: [
        "Create the file manually if it doesn't exist: ~/.cursor/mcp.json",
        "Paste the BirdBot JSON config from the Install tab above",
      ],
      code: `// ~/.cursor/mcp.json
{
  "mcpServers": {
    "birdbot": {
      "command": "npx",
      "args": ["-y", "birdbot-mcp"],
      "env": {
        "BIRDBOT_USER_TOKEN": "your_token_here"
      }
    }
  }
}`,
    },
  ],
  Windsurf: [
    {
      title: "Windsurf not picking up BirdBot",
      bullets: [
        "Config location: ~/.codeium/windsurf/mcp_config.json",
        "Restart Windsurf after saving the config file",
        "Verify the file contains valid JSON",
      ],
    },
    {
      title: "Conflicts with existing MCP servers",
      bullets: [
        "Check for duplicate birdbot entries in your mcp_config.json",
        "Remove any old or conflicting birdbot entries before adding a fresh one",
        "Make sure the server key is exactly birdbot with no special characters",
      ],
    },
  ],
  Cline: [
    {
      title: "Cline not picking up BirdBot",
      bullets: [
        "Reload the VS Code window (Cmd/Ctrl+Shift+P → Reload Window)",
        "Check the Cline extension is updated to the latest version",
        "Verify the MCP server appears in Cline's configuration panel",
      ],
    },
    {
      title: "Token not being recognized",
      bullets: [
        "Double-check that BIRDBOT_USER_TOKEN is set correctly in the env block",
        "Copy your token from the API Key section above and paste it fresh",
        "Make sure there are no extra spaces or line breaks around the token value",
      ],
    },
  ],
}

const IDE_ISSUE_TABS = Object.keys(IDE_ISSUES)

function IssueBlock({ title, bullets, code }: IssueCard) {
  return (
    <div className="border border-border rounded-xl p-4 bg-surface">
      <p className="text-sm font-semibold font-sans text-text-base mb-2">{title}</p>
      <ul className="flex flex-col gap-1.5 mb-0">
        {bullets.map(b => (
          <li key={b} className="flex items-start gap-2 text-xs font-sans text-text-muted">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-text-muted flex-shrink-0" />
            {b}
          </li>
        ))}
      </ul>
      {code && (
        <pre className="mt-3 text-xs font-mono text-text-dim bg-panel border border-border rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre">
          {code}
        </pre>
      )}
    </div>
  )
}

function Troubleshooting() {
  const [open, setOpen]         = useState(false)
  const [ideTab, setIdeTab]     = useState(IDE_ISSUE_TABS[0])

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-panel">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold font-sans text-text-base hover:text-text-base transition-colors"
      >
        Troubleshooting
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 flex flex-col gap-6">

          {/* Common Issues */}
          <div>
            <p className="text-xs font-semibold font-sans text-text-muted uppercase tracking-widest mb-3">
              Common Issues
            </p>
            <div className="flex flex-col gap-2">
              {COMMON_ISSUES.map(issue => (
                <IssueBlock key={issue.title} {...issue} />
              ))}
            </div>
          </div>

          {/* IDE-Specific Issues */}
          <div>
            <p className="text-xs font-semibold font-sans text-text-muted uppercase tracking-widest mb-3">
              IDE-Specific Issues
            </p>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center px-2 border-b border-border">
                {IDE_ISSUE_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setIdeTab(tab)}
                    className={`px-4 py-3 text-sm font-sans font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                      ideTab === tab
                        ? "border-blue-bright text-text-base"
                        : "border-transparent text-text-muted hover:text-text-dim"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4 flex flex-col gap-2">
                {IDE_ISSUES[ideTab].map(issue => (
                  <IssueBlock key={issue.title} {...issue} />
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
