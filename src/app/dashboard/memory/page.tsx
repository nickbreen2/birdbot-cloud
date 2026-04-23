"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Search,
  FileText, Lightbulb, GitFork, CheckSquare, Cpu, User, Flag,
  ChevronDown, ChevronUp,
} from "lucide-react"

type EntityTypeName = "file" | "concept" | "decision" | "task" | "technology" | "person" | "goal"
type SourceType = "session" | "decision" | "telegram"

interface PreviewMention {
  id: string
  sourceType: SourceType
  snippet: string | null
}

interface EntityData {
  id: string
  type: EntityTypeName
  name: string
  description: string | null
  project: string | null
  createdAt: string
  previewMention: PreviewMention | null
}

interface MentionData {
  id: string
  sourceType: SourceType
  sourceId: string
  snippet: string | null
  createdAt: string
}

const ENTITY_ICONS: Record<EntityTypeName, LucideIcon> = {
  file: FileText,
  concept: Lightbulb,
  decision: GitFork,
  task: CheckSquare,
  technology: Cpu,
  person: User,
  goal: Flag,
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

function SkeletonFeed() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-panel border border-border px-4 py-3.5 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-surface animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex justify-between gap-4">
              <div className="h-3.5 rounded bg-surface animate-pulse w-[38%]" />
              <div className="h-3 rounded bg-surface animate-pulse w-14" />
            </div>
            <div className="h-3 rounded bg-surface animate-pulse w-[65%]" />
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

interface EntityRowProps {
  entity: EntityData
  expanded: boolean
  onExpand: () => void
  mentions: MentionData[] | null
  loadingMentions: boolean
}

function EntityRow({ entity, expanded, onExpand, mentions, loadingMentions }: EntityRowProps) {
  const Icon = ENTITY_ICONS[entity.type]

  return (
    <div className="rounded-xl bg-panel border border-border overflow-hidden">
      <button
        onClick={onExpand}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue/10 border border-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-blue-bright" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <p className="text-sm font-semibold font-sans text-text-base truncate">{entity.name}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entity.previewMention && (
                <SourceBadge type={entity.previewMention.sourceType} />
              )}
              <span className="text-[11px] text-text-muted font-sans whitespace-nowrap">
                {formatRelative(entity.createdAt)}
              </span>
            </div>
          </div>
          {entity.description && (
            <p className="text-xs text-text-muted font-sans mt-0.5 line-clamp-2">
              {entity.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 mt-1 ml-1">
          {expanded
            ? <ChevronUp size={14} className="text-text-muted" />
            : <ChevronDown size={14} className="text-text-muted" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border">
          {loadingMentions ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-surface animate-pulse" />
              ))}
            </div>
          ) : mentions && mentions.length > 0 ? (
            <div className="space-y-3">
              {mentions.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5">
                  <SourceBadge type={m.sourceType} />
                  <p className="text-xs text-text-dim font-sans leading-relaxed flex-1">
                    {m.snippet ?? (
                      <span className="italic text-text-muted">No excerpt recorded</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted font-sans italic">
              No excerpts recorded for this entity.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function MemoryPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [entities, setEntities] = useState<EntityData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mentionsCache, setMentionsCache] = useState<Record<string, MentionData[]>>({})
  const [loadingMentionsId, setLoadingMentionsId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const fetchFeed = useCallback(async (reset: boolean, q: string, cursor?: string) => {
    if (reset) {
      setLoading(true)
      setEntities([])
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
      const data = await res.json() as {
        entities: EntityData[]
        nextCursor: string | null
        hasMore: boolean
      }

      setEntities((prev) => (reset ? data.entities : [...prev, ...data.entities]))
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

  async function handleExpand(entityId: string) {
    if (expandedId === entityId) {
      setExpandedId(null)
      return
    }
    setExpandedId(entityId)
    if (mentionsCache[entityId] !== undefined) return

    setLoadingMentionsId(entityId)
    try {
      const res = await fetch(`/api/memory/${entityId}/mentions`)
      if (!res.ok) throw new Error()
      const data = await res.json() as { mentions: MentionData[] }
      setMentionsCache((prev) => ({ ...prev, [entityId]: data.mentions }))
    } catch {
      setMentionsCache((prev) => ({ ...prev, [entityId]: [] }))
    } finally {
      setLoadingMentionsId(null)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-6">Memory</h1>

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
      ) : entities.length === 0 ? (
        debouncedQuery ? (
          <p className="text-sm text-text-muted font-sans py-12 text-center">
            No results for &ldquo;{debouncedQuery}&rdquo;
          </p>
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {entities.map((entity) => (
              <EntityRow
                key={entity.id}
                entity={entity}
                expanded={expandedId === entity.id}
                onExpand={() => handleExpand(entity.id)}
                mentions={mentionsCache[entity.id] ?? null}
                loadingMentions={loadingMentionsId === entity.id}
              />
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
    </div>
  )
}
