export interface PendingGoal {
  id: string
  title: string
  description: string | null
  createdAt: string
  entityId: string
  triggerSnippet: string | null
}

export default function PendingCard({
  goal,
  onAction,
}: {
  goal: PendingGoal
  onAction?: (id: string, status: "active" | "abandoned") => void
}) {
  return (
    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-4">
      <p className="text-sm font-bold font-sans text-text-base leading-snug mb-1">
        {goal.title}
      </p>
      {goal.description && (
        <p className="text-xs italic text-text-muted font-sans leading-relaxed mb-2.5">
          &ldquo;{goal.description}&rdquo;
        </p>
      )}
      {goal.triggerSnippet && (
        <div className="rounded-lg bg-surface border border-border px-3 py-2 mb-3">
          <p className="text-xs text-text-dim font-sans leading-relaxed">
            You said:{" "}
            <span className="italic">&ldquo;{goal.triggerSnippet}&rdquo;</span>
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAction?.(goal.id, "active")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold font-sans bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-colors"
        >
          Yes, track this
        </button>
        <button
          type="button"
          onClick={() => onAction?.(goal.id, "abandoned")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold font-sans bg-zinc-500/10 border border-zinc-500/20 text-text-muted hover:bg-zinc-500/15 transition-colors"
        >
          Never mind
        </button>
      </div>
    </div>
  )
}
