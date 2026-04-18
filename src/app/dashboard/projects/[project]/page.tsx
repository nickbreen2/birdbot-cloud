"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Session = {
  sessionId: string
  summary: string | null
  decisionCount: number
  createdAt: string
}

export default function ProjectSessionsPage() {
  const params = useParams<{ project: string }>()
  const router = useRouter()
  const project = decodeURIComponent(params.project)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(project)}/sessions`)
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project])

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="text-xs text-text-muted font-sans hover:text-text-dim transition-colors mb-6 flex items-center gap-1"
      >
        ← Projects
      </button>

      <h1 className="font-heading font-bold text-2xl text-text-base mb-1">{project}</h1>
      <p className="text-text-dim font-sans text-sm mb-8">Session history</p>

      {loading ? (
        <p className="text-sm text-text-muted font-sans">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border border-dashed text-center gap-2">
          <p className="text-sm font-semibold text-text-dim font-sans">No sessions yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() =>
                router.push(
                  `/dashboard/projects/${encodeURIComponent(project)}/sessions/${s.sessionId}`
                )
              }
              className="text-left p-4 rounded-xl border border-border bg-panel hover:border-blue/50 hover:bg-blue/5 transition-colors"
            >
              <p className="text-xs text-emerald font-sans mb-1">
                {new Date(s.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                — {s.decisionCount} decision{s.decisionCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-text-base font-sans leading-relaxed line-clamp-2">
                {s.summary ?? "No summary"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
