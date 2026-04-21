"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, MoreHorizontal } from "lucide-react"
import { useWizard } from "@/components/onboarding/WizardContext"
import { ProjectPromptModal } from "@/components/dashboard/ProjectPromptModal"

type Project = {
  name: string
  createdAt: string
  sessionCount: number
  decisionCount: number
  lastSessionAt: string | null
}

type ProjectStatus = "not-connected" | "connected"

function getProjectStatus(p: Project): ProjectStatus {
  return p.sessionCount > 0 ? "connected" : "not-connected"
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; dot: string }> = {
  "not-connected": { label: "Not connected", color: "text-amber-400", dot: "bg-amber-400" },
  connected:       { label: "Connected",     color: "text-emerald-400", dot: "bg-emerald-400" },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// 50 hues starting at green (120°), evenly spaced around the full wheel
const PALETTE: number[] = Array.from({ length: 50 }, (_, i) => Math.round((120 + i * 7.2) % 360))

function paletteIndex(name: string): number {
  // djb2 hash — small changes in name produce very different indices
  let h = 5381
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(h, 33) ^ name.charCodeAt(i)
  }
  return Math.abs(h) % 50
}

function avatarGradient(name: string): string {
  const hue = PALETTE[paletteIndex(name)]
  return `linear-gradient(135deg, hsl(${hue}deg 55% 28%), hsl(${(hue + 60) % 360}deg 70% 52%))`
}

function accentColor(name: string): string {
  const hue = PALETTE[paletteIndex(name)]
  return `hsl(${(hue + 60) % 360}deg 65% 58%)`
}

export default function ProjectsPage() {
  const router = useRouter()
  const { projectsVersion, setNewProjectOpen } = useWizard()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingProject, setDeletingProject] = useState<string | null>(null)
  const [promptProject, setPromptProject] = useState<string | null>(null)
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null)
  const [renamingProject, setRenamingProject] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renaming, setRenaming] = useState(false)

  const fetchProjects = useCallback(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: { projects?: Project[] }) => setProjects(data.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects, projectsVersion])

  useEffect(() => {
    if (!openMenuFor) return
    const close = () => setOpenMenuFor(null)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [openMenuFor])

  async function handleDelete(e: React.MouseEvent, name: string) {
    e.stopPropagation()
    if (!window.confirm(`Delete project "${name}"? This will remove all sessions and decisions.`)) return
    setDeletingProject(name)
    try {
      await fetch(`/api/projects/${encodeURIComponent(name)}`, { method: "DELETE" })
      setProjects(prev => prev.filter(p => p.name !== name))
    } catch {}
    finally { setDeletingProject(null) }
  }

  async function handleRename(oldName: string, newName: string) {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) { setRenamingProject(null); return }
    setRenaming(true)
    try {
      await fetch(`/api/projects/${encodeURIComponent(oldName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      setProjects(prev => prev.map(p => p.name === oldName ? { ...p, name: trimmed } : p))
      setRenamingProject(null)
    } catch {}
    finally { setRenaming(false) }
  }

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Projects</h1>
          <p className="text-text-dim font-sans text-sm">
            Sessions from your coding tool appear here automatically.
          </p>
        </div>
        <button
          onClick={() => setNewProjectOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue text-white text-sm font-semibold font-sans hover:bg-blue-light transition-colors flex-shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-text-muted font-sans">Loading…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
          <p className="text-xs text-text-muted font-sans text-center max-w-xs leading-relaxed">
            Create a project or connect BirdBot in your coding tool to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p, i) => {
            const status = getProjectStatus(p)
            const cfg = STATUS_CONFIG[status]
            const isMenuOpen = openMenuFor === p.name
            const isDeleting = deletingProject === p.name

            return (
              <div
                key={p.name}
                className={`relative group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-panel border border-border hover:border-blue/30 hover:bg-panel-hover transition-all cursor-pointer animate-slide-up ${isMenuOpen ? "z-50" : ""}`}
                style={{
                  animationDelay: `${i * 50}ms`,
                  boxShadow: `inset 3px 0 0 ${accentColor(p.name)}`,
                }}
                onClick={() => router.push(`/dashboard/projects/${encodeURIComponent(p.name)}`)}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: avatarGradient(p.name) }}
                >
                  {p.name[0]?.toUpperCase()}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-base font-sans truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className={`text-[11px] font-sans ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold font-heading text-text-base leading-none tabular-nums">{p.sessionCount}</p>
                    <p className="text-[10px] text-text-muted font-sans mt-0.5">sessions</p>
                  </div>
                  <div className="w-px h-5 bg-border" />
                  <div className="text-right">
                    <p className="text-sm font-semibold font-heading text-text-base leading-none tabular-nums">{p.decisionCount}</p>
                    <p className="text-[10px] text-text-muted font-sans mt-0.5">decisions</p>
                  </div>
                </div>

                {/* Timestamp */}
                <span className="hidden md:block text-[11px] text-text-muted font-sans w-14 text-right flex-shrink-0">
                  {p.lastSessionAt ? timeAgo(p.lastSessionAt) : "—"}
                </span>

                {/* Three-dot menu */}
                <div
                  className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpenMenuFor(isMenuOpen ? null : p.name)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface transition-all"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-panel border border-border rounded-xl shadow-lg overflow-hidden z-20">
                      <button
                        className="w-full text-left px-3 py-2.5 text-sm font-sans text-text-base hover:bg-surface transition-colors"
                        onClick={() => { setPromptProject(p.name); setOpenMenuFor(null) }}
                      >
                        Connect MCP
                      </button>
                      <button
                        className="w-full text-left px-3 py-2.5 text-sm font-sans text-text-base hover:bg-surface transition-colors"
                        onClick={() => { setRenamingProject(p.name); setRenameValue(p.name); setOpenMenuFor(null) }}
                      >
                        Rename
                      </button>
                      <button
                        className="w-full text-left px-3 py-2.5 text-sm font-sans text-red-400 hover:bg-red-400/10 transition-colors"
                        onClick={(e) => { handleDelete(e, p.name); setOpenMenuFor(null) }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rename modal */}
      {renamingProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-heading font-bold text-base text-text-base mb-4">Rename project</h2>
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleRename(renamingProject, renameValue)
                if (e.key === "Escape") setRenamingProject(null)
              }}
              className="w-full bg-panel border border-border rounded-xl px-3 py-2 text-sm font-sans text-text-base focus:outline-none focus:border-blue/40 transition-colors mb-4"
              placeholder="Project name"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-4 py-2 rounded-xl text-sm font-sans text-text-dim bg-panel border border-border hover:text-text-base transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRename(renamingProject, renameValue)}
                disabled={renaming || !renameValue.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold font-sans bg-blue text-white hover:bg-blue-light disabled:opacity-40 transition-colors"
              >
                {renaming ? "Renaming…" : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {promptProject && (
        <ProjectPromptModal
          projectName={promptProject}
          onClose={() => setPromptProject(null)}
        />
      )}
    </div>
  )
}
