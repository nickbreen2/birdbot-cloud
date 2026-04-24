"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

type SourceType = "session" | "decision" | "telegram"
type EntityTypeName = "file" | "concept" | "decision" | "task" | "technology" | "person" | "goal"

interface EntityChip {
  id: string
  name: string
  type: EntityTypeName
}

interface MessageData {
  sourceId: string
  sourceType: SourceType
  snippet: string | null
  createdAt: string
  entities: EntityChip[]
}

const SOURCE_LABELS: Record<SourceType, string> = {
  telegram: "Telegram",
  session: "MCP",
  decision: "Decision",
}

const SOURCE_COLORS: Record<SourceType, string> = {
  telegram: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  session: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  decision: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

const CHIP_COLORS: Record<EntityTypeName, string> = {
  goal: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  task: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  concept: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  file: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  technology: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  person: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  decision: "bg-orange-500/15 text-orange-300 border-orange-500/25",
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
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function SourceBadge({ type }: { type: SourceType }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans border ${SOURCE_COLORS[type]}`}
    >
      {SOURCE_LABELS[type]}
    </span>
  )
}

function MessageCard({ message }: { message: MessageData }) {
  return (
    <div className="rounded-xl bg-panel border border-border px-4 py-4">
      <p className="text-sm font-sans text-text-base leading-relaxed whitespace-pre-wrap break-words">
        {message.snippet ?? (
          <span className="italic text-text-muted">No content recorded</span>
        )}
      </p>
      <div className="flex items-center gap-2 mt-2.5">
        <SourceBadge type={message.sourceType} />
        <span className="text-[11px] text-text-muted font-sans">
          {formatRelative(message.createdAt)}
        </span>
      </div>
      {message.entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {message.entities.map((entity) => (
            <span
              key={entity.id}
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-sans border ${CHIP_COLORS[entity.type]}`}
            >
              {entity.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonFeed() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl bg-panel border border-border px-4 py-4">
          <div className="space-y-2">
            <div className="h-3.5 rounded bg-surface animate-pulse w-[90%]" />
            <div className="h-3.5 rounded bg-surface animate-pulse w-[75%]" />
            <div className="h-3.5 rounded bg-surface animate-pulse w-[55%]" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-4 w-14 rounded bg-surface animate-pulse" />
            <div className="h-3 w-10 rounded bg-surface animate-pulse" />
          </div>
          <div className="flex gap-1.5 mt-3">
            <div className="h-5 w-16 rounded-md bg-surface animate-pulse" />
            <div className="h-5 w-20 rounded-md bg-surface animate-pulse" />
            <div className="h-5 w-14 rounded-md bg-surface animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold font-sans text-text-base mb-1">
        Bird hasn&apos;t heard from you yet.
      </p>
      <p className="text-sm text-text-muted font-sans mb-6">
        Say hi from Telegram and watch this fill up.
      </p>
      <Link
        href="/dashboard/integrations"
        className="px-4 py-2 rounded-xl text-sm font-semibold font-sans bg-blue/10 border border-blue/20 text-blue-bright hover:bg-blue/20 transition-colors"
      >
        Set up Telegram
      </Link>
    </div>
  )
}

export default function ListView() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const fetchFeed = useCallback(async (reset: boolean, q: string, cursor?: string) => {
    if (reset) {
      setLoading(true)
      setMessages([])
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      if (q) params.set("query", q)
      if (!reset && cursor) params.set("cursor", cursor)

      const res = await fetch(`/api/memory?${params}`)
      if (!res.ok) throw new Error("Failed to load memory")
      const data = (await res.json()) as {
        messages: MessageData[]
        nextCursor: string | null
        hasMore: boolean
      }

      setMessages((prev) => (reset ? data.messages : [...prev, ...data.messages]))
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchFeed(true, debouncedQuery)
  }, [debouncedQuery, fetchFeed])

  return (
    <>
      <div className="relative mb-6">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search memory…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm font-sans rounded-xl bg-panel border border-border text-text-base placeholder:text-text-muted focus:outline-none focus:border-blue/50 transition-colors"
        />
      </div>

      {loading ? (
        <SkeletonFeed />
      ) : error ? (
        <p className="text-sm text-red-400 font-sans">{error}</p>
      ) : messages.length === 0 ? (
        debouncedQuery ? (
          <p className="text-sm text-text-muted font-sans py-12 text-center">
            No results for &ldquo;{debouncedQuery}&rdquo;
          </p>
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageCard key={message.sourceId} message={message} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => {
                if (nextCursor && !loadingMore) fetchFeed(false, debouncedQuery, nextCursor)
              }}
              disabled={loadingMore}
              className="mt-6 w-full py-2.5 text-sm font-sans font-medium text-text-muted hover:text-text-dim border border-border rounded-xl hover:bg-panel transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </>
  )
}
