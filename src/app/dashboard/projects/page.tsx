"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const BRIEFING_COMMAND = `get_briefing({ project: "my-project" })`

type Project = {
  name: string
  sessionCount: number
  decisionCount: number
  lastSessionAt: string | null
}

export default function ProjectsPage() {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    setConnected(!!localStorage.getItem("bb_connected"))
  }, [])

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }, [])

  function handleCopyCommand() {
    navigator.clipboard.writeText(BRIEFING_COMMAND).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const steps = [
    {
      num: 1,
      done: true,
      title: "Create your account",
      detail: "You're in.",
    },
    {
      num: 2,
      done: connected,
      title: "Connect your coding tool",
      detail: "Paste the MCP config so BirdBot can remember your sessions.",
      action: (
        <Link
          href="/dashboard/connect"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans bg-blue text-white hover:bg-blue-light transition-colors"
        >
          Go to Connect →
        </Link>
      ),
    },
    {
      num: 3,
      done: false,
      title: "Run your first briefing",
      detail: "At the start of any coding session, ask your tool to call:",
      action: (
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs font-mono text-gold bg-depth border border-border px-3 py-1.5 rounded-lg">
            {BRIEFING_COMMAND}
          </code>
          <button
            onClick={handleCopyCommand}
            className="text-xs font-sans text-text-muted hover:text-text-dim transition-colors px-2 py-1.5 rounded-lg border border-border hover:border-border/60"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Get Started</h1>
      <p className="text-text-dim font-sans text-sm mb-8">
        Three steps to persistent memory across every coding session.
      </p>

      {/* Checklist */}
      <div className="flex flex-col gap-3 mb-10">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`flex gap-4 p-4 rounded-xl border transition-colors ${
              step.done ? "border-emerald/30 bg-emerald/5" : "border-border bg-panel"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold font-sans border-2 ${
                step.done ? "bg-emerald border-emerald text-white" : "border-border text-text-muted"
              }`}
            >
              {step.done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className={`text-sm font-semibold font-sans ${step.done ? "text-emerald" : "text-text-base"}`}>
                {step.title}
              </p>
              <p className="text-xs text-text-muted font-sans leading-relaxed">{step.detail}</p>
              {!step.done && step.action && step.action}
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="border-t border-border pt-8">
        <h2 className="font-heading font-semibold text-base text-text-base mb-1">Your Projects</h2>
        <p className="text-text-muted text-sm font-sans mb-6">
          Projects you log via birdbot-mcp will appear here.
        </p>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-muted font-sans">Loading…</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border border-dashed text-center gap-2">
            <span className="text-3xl select-none">🗂️</span>
            <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
            <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed">
              Start a session in Claude to see your project history here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {projects.map((p) => (
              <button
                key={p.name}
                onClick={() => router.push(`/dashboard/projects/${encodeURIComponent(p.name)}`)}
                className="text-left p-4 rounded-xl border border-border bg-panel hover:border-blue/50 hover:bg-blue/5 transition-colors"
              >
                <p className="text-sm font-semibold text-text-base font-sans mb-2">{p.name}</p>
                <div className="flex gap-3">
                  <span className="text-xs text-text-muted font-sans">📋 {p.sessionCount}</span>
                  <span className="text-xs text-text-muted font-sans">⚡ {p.decisionCount}</span>
                </div>
                {p.lastSessionAt && (
                  <p className="text-xs text-text-muted font-sans mt-2">
                    Last: {new Date(p.lastSessionAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
