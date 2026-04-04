"use client"

export function TraitSlider({
  label, value, onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold font-sans text-text-dim w-24 flex-shrink-0">{label}</span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 bg-border rounded-full" />
        {/* Fill */}
        <div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none"
          style={{
            width: `${value}%`,
            background: "linear-gradient(90deg,#2563eb,#60a5fa)",
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer"
          style={{ zIndex: 2 }}
        />
        {/* Thumb */}
        <div
          className="absolute h-4 w-4 rounded-full bg-blue border-2 border-blue-bright pointer-events-none shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          style={{ left: `calc(${value}% - 8px)`, zIndex: 1 }}
        />
      </div>
      <span className="text-sm font-bold font-sans text-gold w-8 text-right tabular-nums">{value}</span>
    </div>
  )
}
