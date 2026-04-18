"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NewProjectModal } from "@/components/dashboard/NewProjectModal"

type Project = {
  name: string
  sessionCount: number
  decisionCount: number
  lastSessionAt: string | null
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: { projects?: Project[] }) => setProjects(data.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-base mb-1">Your Projects</h1>
          <p className="text-text-dim font-sans text-sm">
            Sessions from your coding tool appear here automatically.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue text-white font-semibold font-sans text-sm px-4 py-2.5 rounded-xl hover:bg-blue-light transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-text-muted font-sans">Loading…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border border-dashed text-center gap-3">
          <p className="text-sm font-semibold text-text-dim font-sans">No projects yet</p>
          <p className="text-xs text-text-muted font-sans max-w-xs leading-relaxed">
            Create a project to get your connection prompt, or sessions will appear automatically once you start using BirdBot.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 bg-blue text-white font-semibold font-sans text-sm px-4 py-2 rounded-xl hover:bg-blue-light transition-colors"
          >
            + New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map(p => (
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

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
