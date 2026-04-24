"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ActiveCard, { type ActiveGoal } from "@/components/goals/ActiveCard"
import PendingCard, { type PendingGoal } from "@/components/goals/PendingCard"

interface GoalsData {
  pending: PendingGoal[]
  active: ActiveGoal[]
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-panel border border-border px-4 py-4">
          <div className="space-y-2">
            <div className="h-4 rounded bg-surface animate-pulse w-[65%]" />
            <div className="h-3 rounded bg-surface animate-pulse w-[85%]" />
            <div className="h-3 rounded bg-surface animate-pulse w-[55%]" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-5 w-16 rounded-md bg-surface animate-pulse" />
            <div className="h-3 w-24 rounded bg-surface animate-pulse" />
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
        Bird hasn&apos;t spotted any commitments yet.
      </p>
      <p className="text-sm text-text-muted font-sans mb-6">
        Text it something like &ldquo;I want to ship by Friday&rdquo; and it&apos;ll start
        tracking.
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

export default function GoalsPage() {
  const [data, setData] = useState<GoalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load goals")
        return res.json() as Promise<GoalsData>
      })
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong")
      )
      .finally(() => setLoading(false))
  }, [])

  const isEmpty = data !== null && data.pending.length === 0 && data.active.length === 0

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-8">Goals</h1>

      {loading && <SkeletonCards />}

      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}

      {!loading && !error && isEmpty && <EmptyState />}

      {!loading && !error && data && !isEmpty && (
        <div className="flex flex-col gap-8">
          {data.pending.length > 0 && (
            <section>
              <h2 className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-4">
                Pending Confirmation
              </h2>
              <div className="flex flex-col gap-3">
                {data.pending.map((goal) => (
                  <PendingCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-4">
              Active Goals
            </h2>
            {data.active.length === 0 ? (
              <p className="text-sm text-text-muted font-sans">No active goals.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.active.map((goal) => (
                  <ActiveCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
