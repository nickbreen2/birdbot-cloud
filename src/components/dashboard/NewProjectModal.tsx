"use client"

import { useState, useEffect } from "react"

function buildPrompt(token: string, projectName: string): string {
  return `## BirdBot Memory

You have access to BirdBot — a persistent memory layer for this project.

At the START of every session, call:
  GET https://app.birdbot.ai/api/mcp/briefing?project=${projectName}
  Authorization: Bearer ${token}
Read the returned briefing as your project context. Use the returned sessionId in all subsequent BirdBot calls this session.

When you make a significant architectural decision, call:
  POST https://app.birdbot.ai/api/mcp/decisions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "decision": "...", "reasoning": "..." }

At the END of every session, call:
  POST https://app.birdbot.ai/api/mcp/sessions
  Authorization: Bearer ${token}
  Body: { "project": "${projectName}", "sessionId": "<sessionId from briefing>", "summary": "..." }`
}

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"name" | "prompt">("name")
  const [projectName, setProjectName] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/connection/token")
      .then(r => r.json())
      .then((data: { token?: string }) => {
        if (data.token) setToken(data.token)
      })
      .catch(() => {})
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (projectName.trim()) setStep("prompt")
  }

  function handleCopy() {
    if (!token) return
    navigator.clipboard.writeText(buildPrompt(token, projectName.trim())).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,9,18,0.92)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border overflow-hidden"
        style={{ background: "#111827" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 py-7">
          {step === "name" ? (
            <>
              <h2 className="font-heading font-bold text-xl text-text-base mb-2">New Project</h2>
              <p className="text-text-muted text-sm font-sans mb-6">
                Name your project to get a personalized connection prompt.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. birdbot-cloud"
                  autoFocus
                  className="w-full bg-depth border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-base placeholder:text-text-muted focus:outline-none focus:border-blue transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!projectName.trim()}
                    className="bg-blue text-white font-semibold font-sans text-sm px-6 py-2.5 rounded-xl hover:bg-blue-light transition-colors disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-heading font-bold text-xl text-text-base mb-2">
                Connect {projectName}
              </h2>
              <p className="text-text-muted text-sm font-sans mb-4">
                Paste this into your project&apos;s{" "}
                <code className="text-gold font-mono text-xs bg-depth px-1.5 py-0.5 rounded border border-border">
                  CLAUDE.md
                </code>{" "}
                or coding tool system instructions.
              </p>
              <div className="relative bg-depth border border-border rounded-xl p-4 mb-6">
                <pre className="text-xs font-mono text-text-dim leading-relaxed whitespace-pre-wrap overflow-x-auto pr-16">
                  {token ? buildPrompt(token, projectName.trim()) : "Loading your token…"}
                </pre>
                <button
                  onClick={handleCopy}
                  disabled={!token}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans border border-border bg-panel text-text-dim hover:text-text-base transition-colors disabled:opacity-40"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex justify-between items-center">
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
    </div>
  )
}
