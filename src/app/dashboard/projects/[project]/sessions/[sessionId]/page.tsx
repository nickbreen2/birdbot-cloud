"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Decision = {
  id: string
  decision: string
  reasoning: string | null
  createdAt: string
}

type Session = {
  sessionId: string
  project: string
  summary: string | null
  createdAt: string
  decisions: Decision[]
}

export default function SessionDetailPage() {
  const params = useParams<{ project: string; sessionId: string }>()
  const router = useRouter()
  const project = decodeURIComponent(params.project)
  const { sessionId } = params
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(project)}/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => setSession(data.session ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project, sessionId])

  const dateLabel = session
    ? new Date(session.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <button
        onClick={() => router.push(`/dashboard/projects/${encodeURIComponent(project)}`)}
        className="text-xs text-text-muted font-sans hover:text-text-dim transition-colors mb-6 flex items-center gap-1"
      >
        ← {project}
      </button>

      {loading ? (
        <p className="text-sm text-text-muted font-sans">Loading…</p>
      ) : !session ? (
        <p className="text-sm text-text-muted font-sans">Session not found.</p>
      ) : (
        <>
          <h1 className="font-heading font-bold text-2xl text-text-base mb-1">{dateLabel}</h1>
          <p className="text-text-dim font-sans text-sm mb-6">Session detail</p>

          <div className="p-4 rounded-xl border border-border bg-panel mb-8">
            <p className="text-xs text-emerald font-sans uppercase tracking-wider mb-2">
              Session Summary
            </p>
            <p className="text-sm text-text-base font-sans leading-relaxed">
              {session.summary ?? "No summary recorded."}
            </p>
          </div>

          <h2 className="font-heading font-semibold text-base text-text-base mb-4">
            Decisions logged this session
          </h2>

          {session.decisions.length === 0 ? (
            <p className="text-sm text-text-muted font-sans">No decisions logged.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {session.decisions.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-border bg-panel">
                  <p className="text-sm text-text-base font-sans font-medium mb-2">
                    ⚡ {d.decision}
                  </p>
                  {d.reasoning && (
                    <p className="text-xs text-text-muted font-sans leading-relaxed">
                      <span className="text-text-dim">Why: </span>
                      {d.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
