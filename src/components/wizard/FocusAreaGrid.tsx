"use client"

import { FOCUS_AREAS, type FocusId } from "@/types/wizard"

export function FocusAreaGrid({
  selected,
  onChange,
}: {
  selected: FocusId[]
  onChange: (v: FocusId[]) => void
}) {
  function toggle(id: FocusId) {
    onChange(
      selected.includes(id)
        ? selected.filter((f) => f !== id)
        : [...selected, id]
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {FOCUS_AREAS.map((f) => {
        const isSelected = selected.includes(f.id)
        return (
          <button
            key={f.id}
            onClick={() => toggle(f.id)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[11px] font-semibold font-sans transition-all ${
              isSelected
                ? "border-blue/50 bg-blue/10 text-blue-bright"
                : "border-border bg-depth text-text-muted hover:border-blue/30 hover:text-text-dim"
            }`}
          >
            <span className="text-xl">{f.icon}</span>
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
