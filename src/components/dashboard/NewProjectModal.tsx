"use client"

import { useState, useEffect } from "react"
import { Copy, Check, RotateCw } from "lucide-react"
import { buildPrompt } from "@/lib/buildPrompt"

type IDE = "claude-code" | "cursor" | "windsurf" | "cline"

const IDE_TABS: { id: IDE; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor",      label: "Cursor" },
  { id: "windsurf",   label: "Windsurf" },
  { id: "cline",      label: "Cline" },
]

function buildMcpJson(token: string): string {
  return `{
  "mcpServers": {
    "birdbot": {
      "command": "npx",
      "args": ["-y", "birdbot-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_KEY",
        "BIRDBOT_USER_TOKEN": "${token}"
      }
    }
  }
}`
}

function useCopy(text: string | null): { copied: boolean; copy: () => void } {
  const [copied, setCopied] = useState(false)
  function copy() {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return { copied, copy }
}

const CONFIG_PATHS: Record<IDE, string> = {
  "claude-code": "",
  cursor:        ".cursor/mcp.json",
  windsurf:      "~/.codeium/windsurf/mcp_config.json",
  cline:         "Cline → Settings → MCP Servers",
}

const PASTE_TARGETS: Record<IDE, string> = {
  "claude-code": "CLAUDE.md",
  cursor:        ".cursorrules",
  windsurf:      ".windsurfrules",
  cline:         "Cline → Custom Instructions",
}

const VERIFY_NOTES: Record<IDE, string> = {
  "claude-code": "After running the command, BirdBot MCP will be available in Claude Code.",
  cursor:        "Restart Cursor after saving the config. BirdBot will appear in your MCP panel.",
  windsurf:      "Restart Windsurf after saving. BirdBot will appear under MCP integrations.",
  cline:         "After adding via the extension UI, reload your window to activate BirdBot.",
}

export function NewProjectModal({
  onClose,
  onProjectCreated,
}: {
  onClose: () => void
  onProjectCreated?: () => void
}) {
  const [step, setStep]           = useState<"name" | "install">("name")
  const [projectName, setProject] = useState("")
  const [token, setToken]         = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState("")
  const [activeIde, setIde]       = useState<IDE>("claude-code")

  useEffect(() => {
    fetch("/api/connection/token")
      .then(r => r.json())
      .then((d: { token?: string }) => { if (d.token) setToken(d.token) })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = projectName.trim()
    if (!name) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Failed to create project")
        setSaving(false)
        return
      }
      onProjectCreated?.()
      setStep("install")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const name      = projectName.trim()
  const ccCommand = token ? `claude mcp add birdbot --scope user -e BIRDBOT_USER_TOKEN=${token}` : ""
  const mcpJson   = token ? buildMcpJson(token) : ""
  const prompt    = token ? buildPrompt(token, name) : ""

  const { copied: promptCopied, copy: copyPrompt } = useCopy(prompt)
  const { copied: cmdCopied,    copy: copyCmd }    = useCopy(ccCommand)
  const { copied: jsonCopied,   copy: copyJson }   = useCopy(mcpJson)

  const isClaude   = activeIde === "claude-code"
  const codeCopy   = isClaude ? copyCmd   : copyJson
  const codeCopied = isClaude ? cmdCopied : jsonCopied

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,16,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border flex flex-col overflow-hidden"
        style={{ background: "#0d1424" }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Step: Name ── */}
        {step === "name" && (
          <div className="px-8 py-7">
            <h2 className="font-heading font-bold text-xl text-text-base mb-2">New Project</h2>
            <p className="text-text-muted text-sm font-sans mb-6">
              Name your project to get a personalized connection prompt.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={projectName}
                onChange={e => { setProject(e.target.value); setError("") }}
                placeholder="e.g. birdbot-cloud"
                autoFocus
                className="w-full bg-depth border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-base placeholder:text-text-muted focus:outline-none focus:border-blue transition-colors"
              />
              {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!projectName.trim() || saving}
                  className="bg-blue text-white font-semibold font-sans text-sm px-6 py-2.5 rounded-xl hover:bg-blue-light transition-colors disabled:opacity-40"
                >
                  {saving ? "Creating…" : "Continue →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step: Install ── */}
        {step === "install" && (
          <>
            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-border">
              <div>
                <h2 className="font-heading font-bold text-base text-text-base leading-tight">Install</h2>
                <p className="text-[11px] text-text-muted font-sans mt-0.5 leading-relaxed">
                  Select your IDE and follow the instructions below.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <button
                  onClick={copyPrompt}
                  disabled={!token}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue text-white text-[11px] font-semibold font-sans hover:bg-blue-light transition-colors disabled:opacity-40"
                >
                  {promptCopied
                    ? <><Check size={11} /> Copied!</>
                    : <><Copy size={11} /> Copy Prompt</>}
                </button>
                <span className="text-[10px] font-sans" style={{ color: "#4b6080" }}>
                  Paste into <span style={{ color: "#6b8aad" }}>{PASTE_TARGETS[activeIde]}</span>
                </span>
              </div>
            </div>

            {/* IDE Tabs */}
            <div className="flex items-center px-6 border-b border-border" style={{ background: "#080d18" }}>
              {IDE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setIde(tab.id)}
                  className={`px-3.5 py-3 text-[12px] font-sans font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeIde === tab.id
                      ? "border-blue-bright text-text-base"
                      : "border-transparent text-text-muted hover:text-text-dim"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-6">

              {/* Step 1 */}
              <div className="flex gap-3.5">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}
                  >1</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold font-sans text-text-base mb-0.5">
                    {isClaude ? "Run Installation Command" : "Add to MCP Config"}
                  </p>
                  <p className="text-[11px] text-text-muted font-sans mb-3 leading-relaxed">
                    {isClaude
                      ? "Run this command in your terminal to add BirdBot to Claude Code:"
                      : `Add this to your ${CONFIG_PATHS[activeIde]}:`}
                  </p>
                  <div
                    className="rounded-xl overflow-hidden border"
                    style={{ background: "#060a14", borderColor: "#1a2540", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  >
                    <div
                      className="flex items-center justify-between px-3.5 py-2 border-b"
                      style={{ borderColor: "#1a2540", background: "#080c18" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: "#2a3550" }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: "#2a3550" }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: "#2a3550" }} />
                      </div>
                      <button
                        onClick={codeCopy}
                        disabled={!token}
                        className="flex items-center gap-1 text-[10px] font-sans transition-colors disabled:opacity-30"
                        style={{ color: codeCopied ? "#34d399" : "#4b6080" }}
                      >
                        {codeCopied ? <Check size={10} /> : <Copy size={10} />}
                        {codeCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    {!token ? (
                      <div className="px-4 py-4 h-14 flex items-center">
                        <span className="text-[11px] font-mono animate-pulse" style={{ color: "#2a3550" }}>Loading token…</span>
                      </div>
                    ) : isClaude ? (
                      <div className="px-4 py-3.5 flex items-center gap-2">
                        <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "#4b6080" }}>$</span>
                        <pre className="text-[11px] font-mono overflow-x-auto whitespace-nowrap leading-relaxed" style={{ color: "#a8c4f0" }}>
                          {ccCommand}
                        </pre>
                      </div>
                    ) : (
                      <pre className="text-[11px] font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre" style={{ color: "#a8c4f0" }}>
                        {mcpJson}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}
                  >2</div>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold font-sans text-text-base mb-0.5">Verify Installation</p>
                  <p className="text-[11px] text-text-muted font-sans mb-3 leading-relaxed">{VERIFY_NOTES[activeIde]}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check size={12} style={{ color: "#34d399" }} className="flex-shrink-0" />
                      <span className="text-[11px] font-sans" style={{ color: "#6b8aad" }}>The MCP server will be automatically configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={12} style={{ color: "#34d399" }} className="flex-shrink-0" />
                      <span className="text-[11px] font-sans" style={{ color: "#6b8aad" }}>You can start tracking sessions immediately</span>
                    </div>
                    {isClaude && (
                      <div className="flex items-center gap-2">
                        <RotateCw size={12} style={{ color: "#4b6080" }} className="flex-shrink-0" />
                        <span className="text-[11px] font-sans" style={{ color: "#6b8aad" }}>
                          To verify, run:{" "}
                          <code className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "#060a14", border: "1px solid #1a2540", color: "#a8c4f0" }}>
                            claude mcp list
                          </code>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-between items-center">
              <button
                onClick={() => setStep("name")}
                className="text-xs text-text-muted hover:text-text-dim font-sans transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={onClose}
                className="bg-blue text-white font-semibold font-sans text-sm px-6 py-2.5 rounded-xl hover:bg-blue-light transition-colors"
              >
                Done →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
