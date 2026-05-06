"use client"

import { useState, useEffect } from "react"
import { X, ArrowLeft } from "lucide-react"

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

export function LoopHistoryPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [loops, setLoops] = useState<Loop[] | null>(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoops(null)
    setFetchError(false)
    fetch("/api/hq/loops")
      .then((r) => {
        if (!r.ok) throw new Error("not ok")
        return r.json()
      })
      .then((d: { loops: Loop[] }) => setLoops(d.loops))
      .catch(() => setFetchError(true))
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function undoLoop(id: string) {
    setLoops((prev) => (prev ? prev.filter((l) => l.id !== id) : prev))
    fetch(`/api/hq/loops/${id}`, { method: "POST" }).catch(() => {})
  }

  if (!open) return null

  return (
    <>
      <div className="lhp-backdrop" onClick={onClose} />
      <div className="lhp">
        <div className="lhp__header">
          <button className="lhp__back" onClick={onClose}>
            <ArrowLeft size={14} />
            Back
          </button>
          <span className="lhp__title">Loop history</span>
          {loops !== null && loops.length > 0 && (
            <span className="lhp__count">{loops.length} done</span>
          )}
          <button className="lhp__close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="lhp__body">
          {fetchError && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "rgba(252,165,165,0.85)",
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              Couldn&rsquo;t load history — refresh to try again.
            </div>
          )}
          {!loops ? (
            <p className="lhp__empty">Loading…</p>
          ) : loops.length === 0 ? (
            <p className="lhp__empty">
              No dismissed loops yet — mark one as done and it will appear here.
            </p>
          ) : (
            <div>
              {loops.map((loop) => (
                <div key={loop.id} className="lhp__item">
                  <span className="lhp__item-name">{loop.name}</span>
                  <span className="lhp__item-age">{formatAge(new Date(loop.createdAt))}</span>
                  <button className="lhp__item-undo" onClick={() => undoLoop(loop.id)}>
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
