"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"

interface Loop {
  id: string
  name: string
  description: string | null
  createdAt: string
}

function formatAge(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function LoopHistoryPage() {
  const [loops, setLoops] = useState<Loop[] | null>(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch("/api/hq/loops")
      .then((r) => {
        if (!r.ok) throw new Error("not ok")
        return r.json()
      })
      .then((d: { loops: Loop[] }) => setLoops(d.loops))
      .catch(() => setFetchError(true))
  }, [])

  function undoLoop(id: string) {
    setLoops((prev) => prev ? prev.filter((l) => l.id !== id) : prev)
    fetch(`/api/hq/loops/${id}`, { method: "POST" }).catch(() => {})
  }

  return (
    <div className="brief">
      <a href="/dashboard" className="brief__back">
        <ArrowLeft size={13} />
        HQ
      </a>

      <div className="brief__eyebrow" style={{ marginTop: 24 }}>
        <h2>Loop history</h2>
        <span className="brief__tag">MARKED DONE</span>
      </div>

      {fetchError && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "rgba(252,165,165,0.9)",
            fontSize: 13,
          }}
        >
          Couldn&rsquo;t load history — refresh the page to try again.
        </div>
      )}

      {!loops ? (
        <p className="brief__empty">Loading…</p>
      ) : loops.length === 0 ? (
        <p className="brief__empty">No dismissed loops yet — mark one as done and it will appear here.</p>
      ) : (
        <div className="loops">
          {loops.map((loop) => (
            <div key={loop.id} className="loop loop--done">
              <span className="loop__text">
                You said you&rsquo;d <em>{loop.name}</em>
              </span>
              <span className="loop__age">{formatAge(new Date(loop.createdAt))}</span>
              <span className="loop__thread">TASK</span>
              <button className="loop__done loop__undo" onClick={() => undoLoop(loop.id)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
