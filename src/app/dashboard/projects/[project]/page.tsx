"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, Home, FolderOpen, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { ProjectPromptModal } from "@/components/dashboard/ProjectPromptModal"

type Session = {
  sessionId: string
  summary: string | null
  decisionCount: number
  createdAt: string
}

type ChatMessage = { role: "user" | "assistant"; content: string }
type Tab = "sessions" | "chat" | "roadmap" | "connections" | "graph"

const TABS: { id: Tab; label: string }[] = [
  { id: "sessions",    label: "Sessions" },
  { id: "chat",        label: "Chat" },
  { id: "roadmap",     label: "Roadmap" },
  { id: "connections", label: "Connections" },
  { id: "graph",       label: "Graph" },
]

const SUGGESTED = [
  "What's the current architecture?",
  "What key decisions have been made?",
  "What was worked on recently?",
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function avatarGradient(name: string): string {
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return `linear-gradient(135deg, hsl(${hue}deg 55% 28%), hsl(${(hue + 50) % 360}deg 65% 52%))`
}

export default function ProjectDetailPage() {
  const params  = useParams<{ project: string }>()
  const router  = useRouter()
  const project = decodeURIComponent(params.project)

  const [sessions,    setSessions]    = useState<Session[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState<Tab>("sessions")

  // Adjacent project navigation
  const [allProjects, setAllProjects] = useState<string[]>([])

  // Three-dot menu
  const [menuOpen,    setMenuOpen]    = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Prompt modal
  const [promptOpen,  setPromptOpen]  = useState(false)

  // Rename
  const [renamingOpen, setRenamingOpen] = useState(false)
  const [renameValue,  setRenameValue]  = useState("")
  const [renaming,     setRenaming]     = useState(false)

  // Delete
  const [deleting, setDeleting] = useState(false)

  // Chat
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [input,     setInput]     = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(project)}/sessions`)
      .then(r => r.json())
      .then(data => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project])

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((d: { projects?: { name: string }[] }) => {
        setAllProjects((d.projects ?? []).map(p => p.name))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  useEffect(() => {
    if (activeTab === "chat") setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeTab])

  useEffect(() => {
    if (!menuOpen) return
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [menuOpen])

  const idx         = allProjects.indexOf(project)
  const prevProject = idx > 0 ? allProjects[idx - 1] : null
  const nextProject = idx !== -1 && idx < allProjects.length - 1 ? allProjects[idx + 1] : null

  async function handleDelete() {
    if (!window.confirm(`Delete project "${project}"? This will remove all sessions and decisions.`)) return
    setDeleting(true)
    try {
      await fetch(`/api/projects/${encodeURIComponent(project)}`, { method: "DELETE" })
      router.push("/dashboard/projects")
    } catch {} finally { setDeleting(false) }
  }

  async function handleRename() {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === project) { setRenamingOpen(false); return }
    setRenaming(true)
    try {
      await fetch(`/api/projects/${encodeURIComponent(project)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      router.replace(`/dashboard/projects/${encodeURIComponent(trimmed)}`)
      setRenamingOpen(false)
    } catch {} finally { setRenaming(false) }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return
    const history = messages
    const newMessages: ChatMessage[] = [...history, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setStreaming(true)
    setMessages([...newMessages, { role: "assistant", content: "" }])
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })
      if (!res.ok || !res.body) {
        setMessages(prev => { const c = [...prev]; c[c.length - 1] = { role: "assistant", content: "Something went wrong." }; return c })
        return
      }
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => { const c = [...prev]; c[c.length - 1] = { role: "assistant", content: full }; return c })
      }
    } catch {
      setMessages(prev => { const c = [...prev]; c[c.length - 1] = { role: "assistant", content: "Network error. Please try again." }; return c })
    } finally { setStreaming(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const decisionCount = sessions.reduce((sum, s) => sum + s.decisionCount, 0)
  const lastSessionAt = sessions[0]?.createdAt ?? null

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-1 min-h-0 max-w-4xl mx-auto w-full px-6 md:px-8 py-6 md:py-8 gap-4">

        {/* ── Top nav bar ── */}
        <div className="grid grid-cols-3 items-center flex-shrink-0">

          {/* Left: arrows */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-lg border border-border bg-panel overflow-hidden">
              <button
                onClick={() => prevProject && router.push(`/dashboard/projects/${encodeURIComponent(prevProject)}`)}
                disabled={!prevProject}
                className="px-2 py-1.5 text-text-muted hover:text-text-base hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-border"
                title={prevProject ?? "No previous project"}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => nextProject && router.push(`/dashboard/projects/${encodeURIComponent(nextProject)}`)}
                disabled={!nextProject}
                className="px-2 py-1.5 text-text-muted hover:text-text-base hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={nextProject ?? "No next project"}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Center: breadcrumb (truly centered) */}
          <div className="flex items-center justify-center gap-2 text-sm font-sans text-text-muted">
            <button
              onClick={() => router.push("/dashboard/projects")}
              className="flex items-center gap-1.5 hover:text-text-dim transition-colors"
            >
              <Home size={13} />
              <span>Home</span>
            </button>
            <span className="text-border">/</span>
            <span className="flex items-center gap-1.5 text-text-dim">
              <FolderOpen size={13} />
              <span className="truncate max-w-[180px] text-[13px]">{project}</span>
            </span>
          </div>

          {/* Right: three-dot menu */}
          <div className="flex justify-end">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg border border-border bg-panel text-text-muted hover:text-text-base hover:bg-surface transition-colors"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-panel border border-border rounded-xl shadow-xl overflow-hidden z-30" onClick={e => e.stopPropagation()}>
                <button
                  className="w-full text-left px-3 py-2.5 text-sm font-sans text-text-base hover:bg-surface transition-colors"
                  onClick={() => { setPromptOpen(true); setMenuOpen(false) }}
                >
                  Connect MCP
                </button>
                <button
                  className="w-full text-left px-3 py-2.5 text-sm font-sans text-text-base hover:bg-surface transition-colors"
                  onClick={() => { setRenameValue(project); setRenamingOpen(true); setMenuOpen(false) }}
                >
                  Rename
                </button>
                <button
                  className="w-full text-left px-3 py-2.5 text-sm font-sans text-red-400 hover:bg-red-400/10 transition-colors"
                  onClick={() => { setMenuOpen(false); handleDelete() }}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* ── Unified card ── */}
        <div className="bg-panel border border-border rounded-2xl flex flex-col flex-1 min-h-0">

          {/* Project header */}
          <div className="p-6 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: avatarGradient(project) }}
              >
                {project[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-heading font-bold text-xl text-text-base mb-1.5 truncate">{project}</h1>
                <div className="flex items-center gap-1.5 mb-2">
                  {sessions.length > 0 ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-[11px] font-semibold font-sans text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-[11px] font-semibold font-sans text-amber-400">Not connected</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted font-sans flex-wrap">
                  <span>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
                  <span className="text-border">·</span>
                  <span>{decisionCount} decision{decisionCount !== 1 ? "s" : ""}</span>
                  {lastSessionAt && (
                    <>
                      <span className="text-border">·</span>
                      <span>Last active {timeAgo(lastSessionAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center px-2 border-b border-border flex-shrink-0 bg-white/[0.04] backdrop-blur-sm">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3.5 text-sm font-sans font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-bright text-text-base"
                    : "border-transparent text-text-muted hover:text-text-dim"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sessions */}
          {activeTab === "sessions" && (
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <p className="text-sm text-text-muted font-sans py-8 text-center">Loading…</p>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-sm font-semibold text-text-dim font-sans">No sessions yet</p>
                  <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed text-center">
                    Sessions appear here once you start using BirdBot in your coding tool.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sessions.map(s => (
                    <button
                      key={s.sessionId}
                      onClick={() => router.push(`/dashboard/projects/${encodeURIComponent(project)}/sessions/${s.sessionId}`)}
                      className="text-left p-4 rounded-xl border border-border bg-surface hover:border-blue/50 hover:bg-blue/5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-text-muted font-sans">{timeAgo(s.createdAt)}</span>
                        <span className="text-xs font-semibold font-sans text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                          {s.decisionCount} decision{s.decisionCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-sm text-text-base font-sans leading-relaxed line-clamp-2">
                        {s.summary ?? "No summary"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          {activeTab === "chat" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col gap-3 mt-6">
                    <p className="text-xs text-text-muted font-sans text-center">
                      Ask anything about <span className="font-semibold text-text-dim">{project}</span>
                    </p>
                    <div className="flex flex-col gap-2 mt-1 max-w-sm mx-auto w-full">
                      {SUGGESTED.map(q => (
                        <button
                          key={q}
                          onClick={() => { setInput(q); inputRef.current?.focus() }}
                          className="text-left text-sm font-sans text-text-dim px-4 py-3 rounded-xl border border-border bg-surface hover:border-blue/30 hover:text-text-base transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-sans leading-relaxed ${
                        m.role === "user" ? "bg-blue text-white" : "bg-surface border border-border text-text-base"
                      }`}>
                        {m.content || (
                          <span className="flex gap-1 items-center text-text-muted">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <div className="px-4 py-3 border-t border-border flex-shrink-0">
                <div className="flex items-end gap-2 bg-surface border border-border rounded-xl px-3 py-2 focus-within:border-blue/40 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this project…"
                    rows={1}
                    disabled={streaming}
                    className="flex-1 bg-transparent text-sm font-sans text-text-base placeholder:text-text-muted resize-none focus:outline-none leading-relaxed disabled:opacity-50"
                    style={{ maxHeight: "120px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || streaming}
                    className="p-1.5 rounded-lg bg-blue text-white hover:bg-blue-light transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    <Send size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted font-sans mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
              </div>
            </div>
          )}

          {/* Roadmap */}
          {activeTab === "roadmap" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-semibold text-text-dim font-sans">Roadmap coming soon</p>
              <p className="text-xs text-text-muted font-sans text-center max-w-xs leading-relaxed">
                Track planned features and milestones derived from your sessions and decisions.
              </p>
            </div>
          )}

          {/* Connections */}
          {activeTab === "connections" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-semibold text-text-dim font-sans">Connections coming soon</p>
              <p className="text-xs text-text-muted font-sans text-center max-w-xs leading-relaxed">
                Link your GitHub repo to surface pull requests and commits alongside your sessions.
              </p>
            </div>
          )}

          {/* Graph */}
          {activeTab === "graph" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-semibold text-text-dim font-sans">Graph coming soon</p>
              <p className="text-xs text-text-muted font-sans text-center max-w-xs leading-relaxed">
                Visualize how decisions, sessions, and concepts connect across your project.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Rename modal */}
      {renamingOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-heading font-bold text-base text-text-base mb-4">Rename project</h2>
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleRename()
                if (e.key === "Escape") setRenamingOpen(false)
              }}
              className="w-full bg-panel border border-border rounded-xl px-3 py-2 text-sm font-sans text-text-base focus:outline-none focus:border-blue/40 transition-colors mb-4"
              placeholder="Project name"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenamingOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-sans text-text-dim bg-panel border border-border hover:text-text-base transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={renaming || !renameValue.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold font-sans bg-blue text-white hover:bg-blue-light disabled:opacity-40 transition-colors"
              >
                {renaming ? "Renaming…" : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt modal */}
      {promptOpen && (
        <ProjectPromptModal
          projectName={project}
          onClose={() => setPromptOpen(false)}
        />
      )}
    </div>
  )
}
