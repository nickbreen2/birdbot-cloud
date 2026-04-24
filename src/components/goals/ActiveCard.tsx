"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface ActiveGoal {
  id: string
  title: string
  description: string | null
  cadence: string
  lastCheckinAt: string | null
  targetDate: string | null
  createdAt: string
  entityId: string
}

interface MentionRow {
  sourceId: string
  sourceType: string
  snippet: string | null
  createdAt: string
}

const SOURCE_LABELS: Record<string, string> = {
  telegram: "Telegram",
  session: "MCP",
  decision: "Decision",
}

const SOURCE_COLORS: Record<string, string> = {
  telegram: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  session: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  decision: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

const CADENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
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

export default function ActiveCard({ goal }: { goal: ActiveGoal }) {
  const [expanded, setExpanded] = useState(false)
  const [mentions, setMentions] = useState<MentionRow[] | null>(null)
  const [loadingMentions, setLoadingMentions] = useState(false)

  async function handleToggle() {
    if (!expanded && mentions === null) {
      setLoadingMentions(true)
      try {
        const res = await fetch(`/api/memory/entity/${goal.entityId}`)
        if (res.ok) {
          const data = (await res.json()) as { mentions: MentionRow[] }
          setMentions(data.mentions)
        }
      } finally {
        setLoadingMentions(false)
      }
    }
    setExpanded((v) => !v)
  }

  return (
    <div className="rounded-xl bg-panel border border-border overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-left px-4 py-4 hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-sans text-text-base leading-snug">
              {goal.title}
            </p>
            {goal.description && (
              <p className="text-xs text-text-muted font-sans mt-1 leading-relaxed">
                {goal.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-sans border bg-amber-500/15 text-amber-300 border-amber-500/25">
                {CADENCE_LABELS[goal.cadence] ?? goal.cadence}
              </span>
              <span className="text-[11px] text-text-muted font-sans">
                Last mention:{" "}
                {goal.lastCheckinAt ? formatRelative(goal.lastCheckinAt) : "Never"}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-text-muted mt-0.5">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <p className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-3">
            Mentions
          </p>
          {loadingMentions ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 rounded bg-surface animate-pulse w-[85%]" />
                  <div className="h-3 rounded bg-surface animate-pulse w-[65%]" />
                </div>
              ))}
            </div>
          ) : mentions && mentions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {mentions.map((m) => (
                <div key={m.sourceId} className="text-xs font-sans">
                  <p className="text-text-dim leading-relaxed">
                    {m.snippet ?? (
                      <span className="italic text-text-muted">No content recorded</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans border ${SOURCE_COLORS[m.sourceType] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}
                    >
                      {SOURCE_LABELS[m.sourceType] ?? m.sourceType}
                    </span>
                    <span className="text-text-muted">{formatRelative(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-text-muted font-sans">No mentions yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
