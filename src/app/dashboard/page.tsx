"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Brain, GitBranch } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Thread {
  id: string
  name: string
  type: string
  description: string | null
  mentionCount: number
  lastMentionAt: string
}

interface Loop {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface LearnedItem {
  id: string
  snippet: string
  createdAt: string
  entityName: string
  entityType: string
}

interface BriefData {
  threads: Thread[]
  loops: Loop[]
  learned: LearnedItem[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  concept:    "#6366F1",
  goal:       "#10B981",
  person:     "#EC4899",
  decision:   "#8B5CF6",
  technology: "#06B6D4",
  date:       "#64748B",
  file:       "#94A3B8",
  task:       "#F59E0B",
}

const CAPABILITIES = [
  { id: 1, icon: <MessageCircle size={13} />, label: "Listen on Telegram", live: true },
  { id: 2, icon: <Brain size={13} />, label: "Remember what you tell me", live: true },
  { id: 3, icon: <GitBranch size={13} />, label: "Track threads across messages", live: true },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAge(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function formatRelativeTime(date: Date): string {
  return `${formatAge(date)} ago`
}

function getDateLine(): string {
  const now = new Date()
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
  const month = now.toLocaleDateString("en-US", { month: "long" }).toUpperCase()
  const day = now.getDate()
  const hour = now.getHours()
  const tod = hour < 12 ? "MORNING" : hour < 17 ? "AFTERNOON" : "EVENING"
  return `${weekday} · ${month} ${day} · ${tod}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HQPage() {
  const [data, setData] = useState<BriefData | null>(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch("/api/hq/brief")
      .then((r) => {
        if (!r.ok) throw new Error("not ok")
        return r.json()
      })
      .then((d: BriefData) => setData(d))
      .catch(() => setFetchError(true))
  }, [])

  function dismissLoop(id: string) {
    setData((prev) => prev ? { ...prev, loops: prev.loops.filter((l) => l.id !== id) } : prev)
    fetch(`/api/hq/loops/${id}`, { method: "DELETE" }).catch(() => {})
  }

  const threads = data?.threads ?? []
  const loops = data?.loops ?? []
  const learned = data?.learned ?? []

  return (
    <div className="brief">

      {/* Date */}
      <p className="greet__date" style={{ marginBottom: 32 }}>{getDateLine()}</p>

      {/* Error banner */}
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
          Couldn&rsquo;t load your briefing — refresh the page to try again.
        </div>
      )}

      {/* 1 · Threads */}
      <section>
        <div className="brief__eyebrow">
          <h2>What I&rsquo;m tracking for you</h2>
          <span className="brief__tag">{threads.length} THREADS</span>
        </div>
        {!data ? (
          <p className="brief__empty">Loading…</p>
        ) : threads.length === 0 ? (
          <p className="brief__empty">No threads yet — Bird will start tracking topics as you message it.</p>
        ) : (
          <div className="threads">
            {threads.map((t) => {
              const color = TYPE_COLOR[t.type] ?? "#6366F1"
              const updatedAt = new Date(t.lastMentionAt)
              return (
                <div key={t.id} className="thread">
                  <div className="thread__head">
                    <span
                      className="thread__chip"
                      style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
                    />
                    <span className="thread__title">{t.name}</span>
                    <span className="thread__count">{t.mentionCount}</span>
                  </div>
                  {t.description && <p className="thread__note">{t.description}</p>}
                  <div className="thread__foot">
                    <span className="thread__status" style={{ color }}>{t.type}</span>
                    <span className="thread__time">{formatRelativeTime(updatedAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 2 · Open loops */}
      <section>
        <div className="brief__eyebrow">
          <h2>Open loops</h2>
          <span className="brief__tag">THINGS YOU SAID YOU&rsquo;D DO</span>
        </div>
        {!data ? (
          <p className="brief__empty">Loading…</p>
        ) : loops.length === 0 ? (
          <p className="brief__empty">No open loops — Bird hasn&rsquo;t caught any unfollowed promises yet.</p>
        ) : (
          <div className="loops">
            {loops.map((loop) => (
              <div key={loop.id} className="loop">
                <span className="loop__text">
                  You said you&rsquo;d <em>{loop.name}</em>
                </span>
                <span className="loop__age">{formatAge(new Date(loop.createdAt))}</span>
                <span className="loop__thread">TASK</span>
                <button className="loop__done" onClick={() => dismissLoop(loop.id)}>
                  Done
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3 · Recently learned */}
      <section>
        <div className="brief__eyebrow">
          <h2>Recently learned</h2>
          <span className="brief__tag">{learned.length} RECENT</span>
          <a href="/dashboard/memory" className="brief__link">Memory →</a>
        </div>
        {!data ? (
          <p className="brief__empty">Loading…</p>
        ) : learned.length === 0 ? (
          <p className="brief__empty">Nothing new — Bird hasn&rsquo;t learned anything since you last checked.</p>
        ) : (
          <div className="learned">
            {learned.map((item) => (
              <div key={item.id} className="learn">
                <span className="learn__dot" />
                <p className="learn__text">{item.snippet}</p>
                <span className="learn__time">{formatRelativeTime(new Date(item.createdAt))}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4 · Capabilities */}
      <section>
        <div className="brief__eyebrow">
          <h2>What I can do for you</h2>
        </div>
        <p className="cap-intro">I&rsquo;m being honest with you about what I can and can&rsquo;t do yet. We&rsquo;ll grow this list together.</p>
        <div className="cap-list">
          {CAPABILITIES.map((cap) => (
            <div key={cap.id} className={`cap-row${cap.live ? "" : " cap-row--soon"}`}>
              <div className="cap-row__icon">{cap.icon}</div>
              <span className="cap-row__label">{cap.label}</span>
              <span className="cap-row__status">{cap.live ? "NOW" : "SOON"}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
