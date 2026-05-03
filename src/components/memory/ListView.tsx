"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { EntityTypeName } from "./graphConstants"

type SourceType = "session" | "decision" | "telegram"

interface EntityChip {
  id: string
  name: string
  type: EntityTypeName
}

interface MessageData {
  sourceId: string
  sourceType: SourceType
  snippet: string | null
  summary?: string | null
  createdAt: string
  entities: EntityChip[]
}

interface DateGroup {
  label: string
  sub: string
  key: string
  entries: MessageData[]
}

const SOURCE_LABELS: Record<SourceType, string> = {
  telegram: "Telegram",
  session: "MCP",
  decision: "Decision",
}

const SOURCE_DOT: Record<SourceType, string> = {
  telegram: "#229ED9",
  session: "#8B5CF6",
  decision: "#F59E0B",
}

const SOURCE_PILL: Record<SourceType, string> = {
  telegram: "mem-pill--telegram",
  session: "mem-pill--session",
  decision: "mem-pill--decision",
}

const ENTITY_ICON: Record<EntityTypeName, string> = {
  task: "☐",
  goal: "★",
  concept: "◎",
  date: "◷",
  technology: "⌬",
  person: "◉",
  decision: "→",
  file: "□",
}

const ENTITY_COLORS: Record<EntityTypeName, { bg: string; text: string; border: string }> = {
  goal:       { bg: "rgba(245,158,11,0.12)",  text: "#FCD34D", border: "rgba(245,158,11,0.25)" },
  task:       { bg: "rgba(59,130,246,0.12)",  text: "#93C5FD", border: "rgba(59,130,246,0.25)" },
  concept:    { bg: "rgba(113,113,122,0.10)", text: "#A1A1AA", border: "rgba(113,113,122,0.20)" },
  date:       { bg: "rgba(217,70,239,0.12)",  text: "#E879F9", border: "rgba(217,70,239,0.25)" },
  file:       { bg: "rgba(16,185,129,0.12)",  text: "#6EE7B7", border: "rgba(16,185,129,0.25)" },
  technology: { bg: "rgba(139,92,246,0.12)",  text: "#C4B5FD", border: "rgba(139,92,246,0.25)" },
  person:     { bg: "rgba(244,63,94,0.12)",   text: "#FDA4AF", border: "rgba(244,63,94,0.25)"  },
  decision:   { bg: "rgba(249,115,22,0.12)",  text: "#FDBA74", border: "rgba(249,115,22,0.25)" },
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

function getDateGroup(dateStr: string): { label: string; sub: string; key: string } {
  const now = new Date()
  const date = new Date(dateStr)
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((nowMidnight.getTime() - dateMidnight.getTime()) / 86_400_000)
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  const sub = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  if (diffDays === 0) return { label: "Today", sub, key }
  if (diffDays === 1) return { label: "Yesterday", sub, key }
  if (diffDays < 7) return { label: "Earlier this week", sub, key }
  return { label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }), sub, key }
}

function groupMessages(messages: MessageData[]): DateGroup[] {
  const map = new Map<string, DateGroup>()
  for (const msg of messages) {
    const { label, sub, key } = getDateGroup(msg.createdAt)
    if (!map.has(key)) map.set(key, { label, sub, key, entries: [] })
    map.get(key)!.entries.push(msg)
  }
  return Array.from(map.values())
}

function MemoryCard({ message }: { message: MessageData }) {
  return (
    <article className="mem-card">
      <div className="mem-card__meta">
        <span className={`mem-pill ${SOURCE_PILL[message.sourceType]}`}>
          <span className="mem-pill__dot" style={{ background: SOURCE_DOT[message.sourceType] }} />
          {SOURCE_LABELS[message.sourceType]}
        </span>
        <span className="mem-card__time">{formatRelative(message.createdAt)}</span>
      </div>

      {message.summary && (
        <div className="mem-card__summary">
          <span className="mem-card__summary-tag">TL;DR</span>
          <span className="mem-card__summary-text">{message.summary}</span>
        </div>
      )}

      {message.snippet && (
        <p className="mem-card__body">{message.snippet}</p>
      )}

      {message.entities.length > 0 && (
        <div className="mem-card__entities">
          {message.entities.map((entity) => {
            const c = ENTITY_COLORS[entity.type]
            return (
              <span
                key={entity.id}
                className="mem-chip"
                style={{ background: c.bg, color: c.text, borderColor: c.border }}
              >
                <span className="mem-chip__icon">{ENTITY_ICON[entity.type]}</span>
                {entity.name}
              </span>
            )
          })}
        </div>
      )}
    </article>
  )
}

function GroupHeader({ group }: { group: DateGroup }) {
  const count = group.entries.length
  return (
    <header className="mem-group__head">
      <h2 className="mem-group__title">{group.label}</h2>
      <span className="mem-group__sub">{group.sub}</span>
      <div className="mem-group__rule" />
      <span className="mem-group__count">{count} {count === 1 ? "entry" : "entries"}</span>
    </header>
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

export default function ListView({ query }: { query: string }) {
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

  const groups = groupMessages(messages)

  return (
    <>
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
          <div className="mem-timeline">
            {groups.map((group) => (
              <section key={group.key} className="mem-group">
                <GroupHeader group={group} />
                <div className="mem-group__list">
                  {group.entries.map((message) => (
                    <MemoryCard key={message.sourceId} message={message} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {hasMore && (
            <button
              type="button"
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
