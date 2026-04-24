"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

type EntityTypeName = "file" | "concept" | "decision" | "task" | "technology" | "person" | "goal"

interface EntityDetail {
  id: string
  name: string
  type: EntityTypeName
  description: string | null
  createdAt: string
}

interface MentionItem {
  sourceId: string
  sourceType: string
  snippet: string | null
  createdAt: string
}

const TYPE_BADGE: Record<EntityTypeName, string> = {
  goal:       "bg-amber-500/15 text-amber-300 border-amber-500/25",
  task:       "bg-blue-500/15 text-blue-300 border-blue-500/25",
  concept:    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  file:       "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  technology: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  person:     "bg-rose-500/15 text-rose-300 border-rose-500/25",
  decision:   "bg-orange-500/15 text-orange-300 border-orange-500/25",
}

const SOURCE_LABELS: Record<string, string> = {
  telegram: "Telegram",
  session:  "MCP",
  decision: "Decision",
}

const SOURCE_COLORS: Record<string, string> = {
  telegram: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  session:  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  decision: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

interface EntityPanelProps {
  entityId: string | null
  onClose: () => void
}

export default function EntityPanel({ entityId, onClose }: EntityPanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [entity, setEntity] = useState<EntityDetail | null>(null)
  const [mentions, setMentions] = useState<MentionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (entityId) {
      const t = setTimeout(() => closeBtnRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [entityId])

  useEffect(() => {
    if (!entityId) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [entityId, onClose])

  useEffect(() => {
    if (!entityId) return

    setLoading(true)
    setError(null)
    setEntity(null)
    setMentions([])
    setNextCursor(null)
    setHasMore(false)

    fetch(`/api/memory/entity/${entityId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load entity")
        return r.json()
      })
      .then((data) => {
        setEntity(data.entity)
        setMentions(data.mentions)
        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false))
  }, [entityId])

  async function loadMore() {
    if (!entityId || !nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/memory/entity/${entityId}?cursor=${nextCursor}`)
      if (!res.ok) throw new Error("Failed to load more")
      const data = await res.json()
      setMentions((prev) => [...prev, ...data.mentions])
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch {
      // silent — load-more failure leaves existing mentions intact
    } finally {
      setLoadingMore(false)
    }
  }

  const isOpen = entityId !== null

  return (
    <div
      className={`flex flex-col flex-shrink-0 border-l border-border overflow-hidden transition-all duration-200 ${
        isOpen ? "w-96 xl:w-[40%]" : "w-0"
      }`}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 flex-shrink-0">
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2 pt-0.5">
                  <div className="h-5 w-36 rounded bg-surface animate-pulse" />
                  <div className="h-4 w-16 rounded bg-surface animate-pulse" />
                </div>
              ) : entity ? (
                <>
                  <h2 className="font-heading font-bold text-lg text-text-base leading-snug truncate">
                    {entity.name}
                  </h2>
                  <span
                    className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium font-sans border ${
                      TYPE_BADGE[entity.type] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}
                  >
                    {entity.type}
                  </span>
                </>
              ) : null}
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-blue/50"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description */}
          {!loading && entity?.description && (
            <p className="px-5 pb-3 text-sm font-sans text-text-muted leading-relaxed flex-shrink-0">
              {entity.description}
            </p>
          )}

          <div className="h-px bg-border mx-5 flex-shrink-0" />

          {/* Scrollable mentions */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl bg-panel border border-border px-4 py-4">
                  <div className="space-y-2">
                    <div className="h-3.5 rounded bg-surface animate-pulse w-[88%]" />
                    <div className="h-3.5 rounded bg-surface animate-pulse w-[68%]" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-4 w-14 rounded bg-surface animate-pulse" />
                    <div className="h-3 w-10 rounded bg-surface animate-pulse" />
                  </div>
                </div>
              ))
            ) : error ? (
              <p className="text-sm text-red-400 font-sans">{error}</p>
            ) : mentions.length === 0 ? (
              <p className="text-sm text-text-muted font-sans py-8 text-center">
                No mentions recorded.
              </p>
            ) : (
              <>
                {mentions.map((m) => (
                  <div
                    key={m.sourceId}
                    className="rounded-xl bg-panel border border-border px-4 py-4"
                  >
                    <p className="text-sm font-sans text-text-base leading-relaxed whitespace-pre-wrap break-words">
                      {m.snippet ?? (
                        <span className="italic text-text-muted">No content recorded</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans border ${
                          SOURCE_COLORS[m.sourceType] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {SOURCE_LABELS[m.sourceType] ?? m.sourceType}
                      </span>
                      <span className="text-[11px] text-text-muted font-sans">
                        {formatRelative(m.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2.5 text-sm font-sans font-medium text-text-muted hover:text-text-dim border border-border rounded-xl hover:bg-panel transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
