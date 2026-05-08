"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MoreHorizontal, Target } from "lucide-react"
import { formatDate } from "@/lib/time"

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

function goalStatusLine(lastCheckinAt: string | null): string {
  if (!lastCheckinAt) return "Bird picked this up but hasn't heard back since."
  const diff = Date.now() - new Date(lastCheckinAt).getTime()
  if (diff < 86_400_000) return "Heard about this a few hours ago."
  const days = Math.floor(diff / 86_400_000)
  const duration =
    days < 30
      ? `${days} day${days === 1 ? "" : "s"}`
      : `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"}`
  return `Last came up ${duration} ago — Bird hasn't forgotten.`
}

function mentionAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
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
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full text-left px-4 py-4 pr-10 hover:bg-surface/50 transition-colors"
        >
          {/* Title row */}
          <div className="flex items-start gap-2.5">
            <Target size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold font-sans text-text-base leading-snug">
              {goal.title}
            </p>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-xs italic text-text-muted font-sans mt-2 leading-relaxed pl-[25px]">
              &ldquo;{goal.description}&rdquo;
            </p>
          )}

          {/* Status line */}
          <p className="text-xs text-text-muted font-sans mt-1.5 pl-[25px]">
            {goalStatusLine(goal.lastCheckinAt)}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2.5 mt-2.5 pl-[25px] flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-sans border bg-amber-500/15 text-amber-300 border-amber-500/25">
              {CADENCE_LABELS[goal.cadence] ?? goal.cadence}
            </span>
            <span className="text-[11px] text-text-muted font-sans">
              Tracking since {formatDate(goal.createdAt)}
            </span>
            <span className="text-text-muted">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </div>
        </button>

        {/* Actions menu — wired in commit 5 */}
        <button
          type="button"
          onClick={() => {}}
          aria-label="Goal actions"
          className="absolute top-4 right-3 p-1 text-text-muted hover:text-text-dim transition-colors rounded"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Expanded mentions */}
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
                    <span className="text-text-muted">{mentionAge(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted font-sans">
              No mentions yet — Bird will start tracking them when you talk about this.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
